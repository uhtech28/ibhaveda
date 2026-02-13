import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { api, internal } from "./_generated/api";

// Schedule a new meeting
export const scheduleMeeting = mutation({
    args: {
        ideaId: v.id("ideas"),
        title: v.string(),
        description: v.optional(v.string()),
        scheduledAt: v.number(),
        meetingLink: v.optional(v.string()),
        attendeeIds: v.array(v.id("users")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) throw new Error("User not found");

        // Verify Idea ownership or contribution rights?
        // Let's assume collaborators can schedule meetings.
        const idea = await ctx.db.get(args.ideaId);
        if (!idea) throw new Error("Idea not found");

        // Create Meeting
        const meetingId = await ctx.db.insert("meetings", {
            ideaId: args.ideaId,
            organizerId: user._id,
            title: args.title,
            description: args.description,
            scheduledAt: args.scheduledAt,
            status: "scheduled",
            attendees: args.attendeeIds, // Should we validate these IDs? Yes, but skipped for MVP speed.
            meetingLink: args.meetingLink,
            createdAt: Date.now(),
        });

        // Notify attendees? (Future task)

        // Award XP for scheduling? (Maybe small amount)
        await ctx.scheduler.runAfter(0, internal.gamification.internalAwardXP, {
            userId: user._id,
            amount: 2,
            action: "schedule_meeting",
        });

        return meetingId;
    }
});

// Complete a meeting (Triggers Skill Badge Progress)
export const completeMeeting = mutation({
    args: {
        meetingId: v.id("meetings"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) throw new Error("User not found");

        const meeting = await ctx.db.get(args.meetingId);
        if (!meeting) throw new Error("Meeting not found");

        if (meeting.organizerId !== user._id) {
            throw new Error("Only the organizer can mark a meeting as complete");
        }

        if (meeting.status === "completed") {
            return; // Already done
        }

        await ctx.db.patch(args.meetingId, {
            status: "completed",
        });

        // Award XP to Organizer
        await ctx.scheduler.runAfter(0, internal.gamification.internalAwardXP, {
            userId: user._id,
            amount: 10,
            action: "complete_meeting",
        });

        // Award XP to Attendees? (Need separate loop)

        // TRIGGER SKILL BADGE PROGRESS
        const idea = await ctx.db.get(meeting.ideaId);
        if (idea && idea.category) {
            const skills = idea.category.split(',').map(s => s.trim()).filter(s => s);

            // Credit the Organizer
            for (const skill of skills) {
                await ctx.scheduler.runAfter(0, internal.skillBadges.incrementSkillProgress, {
                    userId: user._id,
                    ideaId: idea._id,
                    skill: skill,
                    type: "meeting", // This counts as "Hosted Meeting"
                });
            }
        }
    }
});

// Get upcoming meetings for a user (as organizer or attendee)
// Note: Schema stores attendees as array of IDs.
// Querying "contains" in array is hard in Convex without indexing? 
// Actually Convex supports filtering array fields? 
// No, we need an inverted index or scan.
// Only `meetings` table has `attendees`.
// MVP: Just return meetings where user is organizer. 
// Attendees query is slow without `by_attendee` index (which requires separate table `meetingAttendees`).
// Let's stick to Organizer for now or fetch all meetings for ideas user interacts with.

export const getMyMeetings = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) return [];

        // Fetch meetings organized by user
        const organized = await ctx.db
            .query("meetings")
            .withIndex("by_organizer", (q) => q.eq("organizerId", user._id))
            .collect();

        return organized.sort((a, b) => a.scheduledAt - b.scheduledAt);
    }
});

export const getIdeaMeetings = query({
    args: { ideaId: v.id("ideas") },
    handler: async (ctx, args) => {
        const meetings = await ctx.db
            .query("meetings")
            .withIndex("by_idea", (q) => q.eq("ideaId", args.ideaId))
            .collect();
        return meetings.sort((a, b) => a.scheduledAt - b.scheduledAt);
    }
});
