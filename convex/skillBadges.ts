import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Skill Badge Criteria Configuration
// Requirements are PER IDEA context
const CRITERIA = {
    bronze: { contributions: 1, tasks: 1, meetings: 0 }, // Easy: Just participate
    silver: { contributions: 3, tasks: 5, meetings: 1 }, // Medium: Heavy involvement
    gold: { contributions: 5, tasks: 10, meetings: 3 },  // Hard: Lead & Execute
    platinum: { contributions: 10, tasks: 20, meetings: 5 }, // Expert: Dedication
};

// Helper: Check if stats meet criteria
function meetsCriteria(stats: any, tier: "bronze" | "silver" | "gold" | "platinum") {
    const req = CRITERIA[tier];
    return (
        stats.contributionsCount >= req.contributions &&
        stats.tasksCompletedCount >= req.tasks &&
        stats.meetingsHostedCount >= req.meetings
    );
}

// Internal Mutation: Increment progress and check for badges
export const incrementSkillProgress = internalMutation({
    args: {
        userId: v.id("users"),
        ideaId: v.id("ideas"),
        skill: v.string(), // E.g., "React", "Design"
        type: v.union(v.literal("contribution"), v.literal("task"), v.literal("meeting")),
    },
    handler: async (ctx, args) => {
        const { userId, ideaId, skill, type } = args;

        // 1. Get or Create Progress Record
        let progress = await ctx.db
            .query("userSkillProgress")
            .withIndex("by_user_idea_skill", (q) =>
                q.eq("userId", userId).eq("ideaId", ideaId).eq("skill", skill)
            )
            .first();

        if (!progress) {
            const id = await ctx.db.insert("userSkillProgress", {
                userId,
                ideaId,
                skill,
                contributionsCount: 0,
                tasksCompletedCount: 0,
                meetingsHostedCount: 0,
                updatedAt: Date.now(),
            });
            progress = await ctx.db.get(id);
        }

        if (!progress) return; // Should not happen

        // 2. Increment Stats
        const updates: any = { updatedAt: Date.now() };
        if (type === "contribution") updates.contributionsCount = progress.contributionsCount + 1;
        if (type === "task") updates.tasksCompletedCount = progress.tasksCompletedCount + 1;
        if (type === "meeting") updates.meetingsHostedCount = progress.meetingsHostedCount + 1;

        await ctx.db.patch(progress._id, updates);

        // Refresh stats for checking
        const newStats = { ...progress, ...updates };

        // 3. Check for Badges (Bronze -> Platinum)
        const tiers: ("bronze" | "silver" | "gold" | "platinum")[] = ["platinum", "gold", "silver", "bronze"];

        // We check from highest to lowest? Or check all?
        // We want to award the HIGHEST UN-AWARDED badge if multiple met?
        // Actually, distinct badges: "Bronze React Badge", "Silver React Badge".
        // A user can have all 3 for the same Idea? Or upgrade?
        // PRD implies upgrades: "Level 1 -> Level 2 badge".
        // Let's store `badgeLevel` in `userSkillBadges`. Only one record per Idea/Skill.

        // Get existing badge for this Idea+Skill
        const existingBadge = await ctx.db
            .query("userSkillBadges")
            .withIndex("by_user_idea_skill", (q) =>
                q.eq("userId", userId).eq("ideaId", ideaId).eq("skill", skill)
            )
            .first();

        const currentBadgeLevel = existingBadge?.badgeLeveL || 0; // 0=None, 1=Bronze, 2=Silver, etc.
        let newBadgeLevel = currentBadgeLevel;

        if (meetsCriteria(newStats, "platinum")) newBadgeLevel = 4;
        else if (meetsCriteria(newStats, "gold")) newBadgeLevel = 3;
        else if (meetsCriteria(newStats, "silver")) newBadgeLevel = 2;
        else if (meetsCriteria(newStats, "bronze")) newBadgeLevel = 1;

        if (newBadgeLevel > currentBadgeLevel) {
            // AWARD BADGE!
            if (existingBadge) {
                await ctx.db.patch(existingBadge._id, {
                    badgeLeveL: newBadgeLevel,
                    awardedAt: Date.now(),
                });
            } else {
                await ctx.db.insert("userSkillBadges", {
                    userId,
                    ideaId,
                    skill,
                    badgeLeveL: newBadgeLevel,
                    awardedAt: Date.now(),
                });
            }

            // Notification?
            const badgeNames = ["", "Bronze", "Silver", "Gold", "Platinum"];
            await ctx.db.insert("notifications", {
                recipientId: userId,
                senderId: userId, // System
                type: "badge_awarded",
                message: `You earned the ${badgeNames[newBadgeLevel]} ${skill} Badge for this Idea!`,
                isRead: false,
                createdAt: Date.now(),
                relatedId: ideaId, // Link to idea? or Badge?
            });

            // Update Meta-Skill Level
            await updateUserSkillLevel(ctx, userId, skill);
        }
    }
});

// Helper: Update User's Aggregate Skill Level
async function updateUserSkillLevel(ctx: any, userId: Id<"users">, skill: string) {
    // 1. Use the new helper to get count
    // Count how many badges of this skill the user has across ALL ideas
    const allBadges = await ctx.db
        .query("userSkillBadges")
        .withIndex("by_user_skill", (q: any) => q.eq("userId", userId).eq("skill", skill))
        .collect();

    // Weighted Sum?
    // Bronze=1, Silver=2, Gold=3, Platinum=4 points?
    // Or just count? PRD says "Meta-game".
    // Let's use weighted points calculation for Skill Level.

    let totalSkillPoints = 0;
    for (const b of allBadges) {
        totalSkillPoints += (b.badgeLeveL || 1);
    }

    // Logic: Level = 1 + floor(Points / 5)
    // Example: 5 Bronze badges = Level 2.
    // 1 Gold (3pts) + 2 Bronze (2pts) = 5pts = Level 2.

    const newSkillLevel = 1 + Math.floor(totalSkillPoints / 5);

    const existingLevel = await ctx.db
        .query("userSkillLevels")
        .withIndex("by_user_skill", (q: any) => q.eq("userId", userId).eq("skill", skill))
        .first();

    if (existingLevel) {
        if (existingLevel.level !== newSkillLevel || existingLevel.badgeCount !== allBadges.length) {
            await ctx.db.patch(existingLevel._id, {
                level: newSkillLevel,
                badgeCount: allBadges.length,
                updatedAt: Date.now(),
            });
        }
    } else {
        await ctx.db.insert("userSkillLevels", {
            userId,
            skill,
            level: newSkillLevel,
            badgeCount: allBadges.length,
            updatedAt: Date.now(),
        });
    }
}

export const getSkillProfile = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const levels = await ctx.db
            .query("userSkillLevels")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();

        // Also fetch badges?
        // Let's return levels first
        return levels.sort((a, b) => b.level - a.level);
    }
});
