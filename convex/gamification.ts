import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { LEVEL_DEFINITIONS } from "./ventureConstants";
import { meetsLevelRequirements } from "./levels";

// Helper to get consistent date string (UTC)
function getTodayString(): string {
    return new Date().toISOString().split('T')[0];
}

// Get user's current streak
export const getStreak = query({
    handler: async ({ db, auth }) => {
        const identity = await auth.getUserIdentity();
        if (!identity) return null;

        const user = await db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user) return null;

        const streak = await db
            .query("userStreaks")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .first();

        return streak || {
            currentStreak: 0,
            longestStreak: 0,
            lastLoginDate: "",
            recoveryAvailable: false
        };
    },
});

// Get any user's current streak
export const getUserStreak = query({
    args: { userId: v.id("users") },
    handler: async ({ db }, args) => {
        const streak = await db
            .query("userStreaks")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .first();

        return streak || {
            currentStreak: 0,
            longestStreak: 0,
            lastLoginDate: "",
            recoveryAvailable: false
        };
    },
});

// Update streak logic - usually called on session start
export const updateStreak = mutation({
    handler: async ({ db, auth, scheduler }) => {
        const identity = await auth.getUserIdentity();
        if (!identity) return null;

        const user = await db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user) return null;

        const today = getTodayString();

        // Get existing streak record
        const streakRecord = await db
            .query("userStreaks")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .first();

        if (!streakRecord) {
            // First time streak creation
            await db.insert("userStreaks", {
                userId: user._id,
                currentStreak: 1,
                longestStreak: 1,
                lastLoginDate: today,
                lastStreakUpdate: Date.now(),
                recoveryAvailable: true,
            });

            // Gamification: Daily Login Reward (First time)
            await scheduler.runAfter(0, internal.gamification.internalAwardXP, {
                userId: user._id,
                amount: 10,
                action: "daily_login",
            });
            await scheduler.runAfter(0, internal.gamification.internalAwardPoints, {
                userId: user._id,
                amount: 10,
                type: "daily_login",
                description: "Daily Login Bonus"
            });

            return { status: "started", streak: 1 };
        }

        // Already logged in today?
        if (streakRecord.lastLoginDate === today) {
            return { status: "maintained", streak: streakRecord.currentStreak };
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = yesterday.toISOString().split('T')[0];

        if (streakRecord.lastLoginDate === yesterdayString) {
            // Logged in yesterday -> Increment streak
            const newStreak = streakRecord.currentStreak + 1;
            await db.patch(streakRecord._id, {
                currentStreak: newStreak,
                longestStreak: Math.max(newStreak, streakRecord.longestStreak),
                lastLoginDate: today,
                lastStreakUpdate: Date.now(),
            });

            // Gamification: Daily Login Reward (Streak Continue)
            await scheduler.runAfter(0, internal.gamification.internalAwardXP, {
                userId: user._id,
                amount: 10,
                action: "daily_login",
            });
            await scheduler.runAfter(0, internal.gamification.internalAwardPoints, {
                userId: user._id,
                amount: 10,
                type: "daily_login",
                description: "Daily Login Bonus"
            });

            return { status: "incremented", streak: newStreak };
        } else {
            // Missed a day (or more) -> Reset streak
            // Check if recovery is available? (Future feature: Streak Freeze)
            await db.patch(streakRecord._id, {
                currentStreak: 1,
                lastLoginDate: today,
                lastStreakUpdate: Date.now(),
            });

            // Gamification: Daily Login Reward (Streak Reset)
            await scheduler.runAfter(0, internal.gamification.internalAwardXP, {
                userId: user._id,
                amount: 10,
                action: "daily_login",
            });
            await scheduler.runAfter(0, internal.gamification.internalAwardPoints, {
                userId: user._id,
                amount: 10,
                type: "daily_login",
                description: "Daily Login Bonus"
            });

            return { status: "reset", streak: 1 };
        }
    },
});

// Gamification: Wallet & Points System

// Get user's wallet balance
export const getWallet = query({
    handler: async ({ db, auth }) => {
        const identity = await auth.getUserIdentity();
        if (!identity) return null;

        const user = await db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user) return null;

        const wallet = await db
            .query("wallets")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .first();

        return wallet || { balance: 0 };
    },
});

// Get any user's wallet balance
export const getUserWallet = query({
    args: { userId: v.id("users") },
    handler: async ({ db }, args) => {
        const wallet = await db
            .query("wallets")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .first();

        return wallet || { balance: 0 };
    },
});

// Award points to a user (Internal or admin use primarily)
// Usage: await awardPoints({ db, userId: ..., amount: 10, type: 'daily_login', description: 'Daily Login Reward' })
export const awardPoints = mutation({
    args: {
        userId: v.optional(v.id("users")), // Optional if calling as user
        amount: v.number(),
        type: v.string(),
        description: v.string(),
        relatedId: v.optional(v.string()),
    },
    handler: async ({ db, auth }, args) => {
        let userId = args.userId;

        // If no userId provided, try to get from auth
        if (!userId) {
            const identity = await auth.getUserIdentity();
            if (!identity) throw new Error("Unauthorized");
            const user = await db
                .query("users")
                .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
                .first();
            if (!user) throw new Error("User not found");
            userId = user._id;
        }

        // Get or create wallet
        let wallet = await db
            .query("wallets")
            .withIndex("by_user", (q) => q.eq("userId", userId!))
            .first();

        if (!wallet) {
            const walletId = await db.insert("wallets", {
                userId: userId!,
                balance: 0,
                updatedAt: Date.now(),
            });
            wallet = await db.get(walletId);
        }

        if (!wallet) throw new Error("Failed to initialize wallet");

        // Calculate new balance
        const newBalance = wallet.balance + args.amount;

        // Update wallet
        await db.patch(wallet._id, {
            balance: newBalance,
            updatedAt: Date.now(),
        });

        // Record transaction
        await db.insert("transactions", {
            walletId: wallet._id,
            amount: args.amount,
            type: args.type,
            description: args.description,
            relatedId: args.relatedId,
            createdAt: Date.now(),
        });

        return { success: true, newBalance };
    },
});

// Award XP to a user and handle level ups
// Usage: await awardXP({ db, userId: ..., amount: 50, action: 'create_idea' })
// Helper: Level Calculation Strategy
// Levels 1-10: Linear (100 XP per level)
// Levels 11+: Exponential (Base 1000 XP, 1.5x multiplier per level relative to base)
function calculateLevelFromXP(xp: number): number {
    if (xp < 1000) {
        return Math.floor(xp / 100) + 1;
    }
    // xp = 1000 * (1.5 ^ (level - 10))
    // level - 10 = log(xp / 1000) / log(1.5)
    // level = 10 + ...
    const power = Math.log(xp / 1000) / Math.log(1.5);
    return Math.floor(10 + power);
}

// Helper: Calculate XP required for a specific level
function calculateXPForLevel(level: number): number {
    if (level <= 10) {
        return (level - 1) * 100;
    }
    return Math.floor(1000 * Math.pow(1.5, level - 10));
}

export const getLevelProgress = query({
    args: { xp: v.number() },
    handler: async (ctx, args) => {
        const level = calculateLevelFromXP(args.xp);
        const currentLevelStart = calculateXPForLevel(level);
        const nextLevelStart = calculateXPForLevel(level + 1);

        return {
            level,
            currentXP: args.xp,
            levelStartXP: currentLevelStart,
            nextLevelXP: nextLevelStart,
            progress: ((args.xp - currentLevelStart) / (nextLevelStart - currentLevelStart)) * 100
        };
    }
});

// Award XP to a user and handle level ups
// Usage: await awardXP({ db, userId: ..., amount: 50, action: 'create_idea' })
export const awardXP = mutation({
    args: {
        userId: v.optional(v.id("users")),
        amount: v.number(),
        action: v.string(), // For logging/history if we add it later
    },
    handler: async ({ db, auth }, args) => {
        let userId = args.userId;

        // If no userId provided, try to get from auth
        if (!userId) {
            const identity = await auth.getUserIdentity();
            if (!identity) throw new Error("Unauthorized");
            const user = await db
                .query("users")
                .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
                .first();
            if (!user) throw new Error("User not found");
            userId = user._id;
        }

        const user = await db.get(userId);
        if (!user) throw new Error("User not found");

        const currentXP = user.xp || 0;
        const currentLevel = user.level || 1;
        const newXP = currentXP + args.amount;

        const newLevel = calculateLevelFromXP(newXP);

        await db.patch(userId, {
            xp: newXP,
            level: newLevel,
        });

        return {
            xpAdded: args.amount,
            newTotalXP: newXP,
            levelUp: newLevel > currentLevel,
            newLevel,
        };
    },
});

// Internal mutation to award XP (for use by other mutations via scheduler)
export const internalAwardXP = internalMutation({
    args: {
        userId: v.id("users"),
        amount: v.number(),
        action: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) return; // Fail silently for background tasks

        const currentXP = user.xp || 0;
        const newXP = currentXP + args.amount;

        const newLevel = calculateLevelFromXP(newXP);

        await ctx.db.patch(args.userId, {
            xp: newXP,
            level: newLevel,
        });

        // Leagues v1 — roll positive XP awards into the weekly league standings.
        // Wrapped so a league failure never blocks the primary XP grant.
        if (args.amount > 0) {
            try {
                await ctx.scheduler.runAfter(0, internal.leagues.bumpWeeklyXp, {
                    userId: args.userId,
                    amount: args.amount,
                });
            } catch { /* league rollup must never block XP grant */ }
        }
    },
});

// Internal mutation to award Points (for use by other mutations via scheduler)
export const internalAwardPoints = internalMutation({
    args: {
        userId: v.id("users"),
        amount: v.number(),
        type: v.string(),
        description: v.string(),
        relatedId: v.optional(v.string()),
    },
    handler: async ({ db }, args) => {
        // Get or create wallet
        let wallet = await db
            .query("wallets")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .first();

        if (!wallet) {
            const walletId = await db.insert("wallets", {
                userId: args.userId,
                balance: 0,
                updatedAt: Date.now(),
            });
            wallet = await db.get(walletId);
        }

        if (!wallet) return;

        // Calculate new balance
        const newBalance = wallet.balance + args.amount;

        // Update wallet
        await db.patch(wallet._id, {
            balance: newBalance,
            updatedAt: Date.now(),
        });

        // Record transaction
        await db.insert("transactions", {
            walletId: wallet._id,
            amount: args.amount,
            type: args.type,
            description: args.description,
            relatedId: args.relatedId,
            createdAt: Date.now(),
        });

        // Mirror the award into the userLevels.titlePoints/totalPoints so the
        // Level progress bar in the profile UI actually moves. This unifies the
        // two parallel reward systems (wallet + userLevels) so creating ideas,
        // commenting, and sparking all advance the same level bar that venture
        // checkpoint completions advance.
        const now = Date.now();
        const userLevel = await db
            .query("userLevels")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .first();

        // Map action types to counter increments so task-gate fields
        // (ideasCreated, commentsCount, collaboratorsRecruited, collaboratorsJoined)
        // actually move when the user performs the gating action.
        const counterDelta = {
            ideasCreated: args.type === "create_idea" ? 1 : 0,
            commentsCount: args.type === "comment" ? 1 : 0,
            collaboratorsRecruited: args.type === "request_accepted" ? 1 : 0,
            collaboratorsJoined: args.type === "contribution_accepted" ? 1 : 0,
        };

        if (userLevel) {
            const newTitlePoints = (userLevel.titlePoints || 0) + args.amount;
            const newTotalPoints = (userLevel.totalPoints || 0) + args.amount;
            const newIdeasCreated = (userLevel.ideasCreated || 0) + counterDelta.ideasCreated;
            const newCommentsCount = (userLevel.commentsCount || 0) + counterDelta.commentsCount;
            const newCollabRecruited = (userLevel.collaboratorsRecruited || 0) + counterDelta.collaboratorsRecruited;
            const newCollabJoined = (userLevel.collaboratorsJoined || 0) + counterDelta.collaboratorsJoined;

            // Level-up check — must satisfy BOTH (a) titlePoints threshold AND
            // (b) task-gate requirements per the PDF (Lv 1–6 are task-gated;
            // Lv 7+ is purely points-based). Loops in case a single award crosses
            // multiple levels (only relevant for Lv 7+).
            const projectedUserLevel = {
                ...userLevel,
                titlePoints: newTitlePoints,
                totalPoints: newTotalPoints,
                ideasCreated: newIdeasCreated,
                commentsCount: newCommentsCount,
                collaboratorsRecruited: newCollabRecruited,
                collaboratorsJoined: newCollabJoined,
            };
            let newLevel = userLevel.currentLevel || 1;
            while (newLevel < 50) {
                const nextDef = LEVEL_DEFINITIONS.find((l) => l.level === newLevel + 1);
                if (!nextDef) break;
                const pointsOk = newTitlePoints >= nextDef.titlePoints;
                const gateOk = meetsLevelRequirements(nextDef.level, projectedUserLevel);
                if (pointsOk && gateOk) {
                    newLevel = nextDef.level;
                } else {
                    break;
                }
            }

            await db.patch(userLevel._id, {
                titlePoints: newTitlePoints,
                totalPoints: newTotalPoints,
                ideasCreated: newIdeasCreated,
                commentsCount: newCommentsCount,
                collaboratorsRecruited: newCollabRecruited,
                collaboratorsJoined: newCollabJoined,
                currentLevel: newLevel,
                updatedAt: now,
            });
        } else {
            await db.insert("userLevels", {
                userId: args.userId,
                currentLevel: 1,
                titlePoints: args.amount,
                totalPoints: args.amount,
                goldCheckpoints: 0,
                fullLifecycles: 0,
                helpfulFlareResponses: 0,
                flaresResolved: 0,
                menteesCount: 0,
                menteeCheckpointAdvances: 0,
                menteeLevelAchievements: 0,
                ideasLaunched: 0,
                ideasScaled: 0,
                collaboratorsRecruited: counterDelta.collaboratorsRecruited,
                collaboratorsJoined: counterDelta.collaboratorsJoined,
                commentsCount: counterDelta.commentsCount,
                upvotedCommentsCount: 0,
                ideasCreated: counterDelta.ideasCreated,
                ideasWithStage6: 0,
                ideasWithStage8: 0,
                activeIdeaTypes: [],
                updatedAt: now,
            });
        }
    },
});

// Update streak logic - usually called on session start


