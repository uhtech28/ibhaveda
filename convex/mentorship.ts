import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

/**
 * Apply to become a mentee under a mentor.
 */
export const applyForMentorship = mutation({
  args: {
    mentorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthenticated")

    const mentee = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first()

    if (!mentee) throw new Error("User not found")

    // Check if mentor is at least level 40
    const mentorLevel = await ctx.db
      .query("userLevels")
      .withIndex("by_user", (q) => q.eq("userId", args.mentorId))
      .first()

    if (!mentorLevel || mentorLevel.currentLevel < 40) {
      throw new Error("Mentor must be at least level 40")
    }

    // Check if already in an active mentorship
    const existing = await ctx.db
      .query("mentorships")
      .withIndex("by_mentee_status", (q) =>
        q.eq("menteeId", mentee._id).eq("status", "active")
      )
      .first()

    if (existing) throw new Error("Already in an active mentorship")

    return await ctx.db.insert("mentorships", {
      mentorId: args.mentorId,
      menteeId: mentee._id,
      status: "active",
      startedAt: Date.now(),
    })
  },
})

/**
 * Accept a mentee (mentor confirms).
 */
export const acceptMentee = mutation({
  args: {
    mentorshipId: v.id("mentorships"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthenticated")

    const mentor = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first()

    if (!mentor) throw new Error("User not found")

    const mentorship = await ctx.db.get(args.mentorshipId)
    if (!mentorship) throw new Error("Mentorship not found")
    if (mentorship.mentorId !== mentor._id) {
      throw new Error("Not your mentorship")
    }

    // Update mentor's mentee count
    const mentorLevel = await ctx.db
      .query("userLevels")
      .withIndex("by_user", (q) => q.eq("userId", mentor._id))
      .first()

    if (mentorLevel) {
      await ctx.db.patch(mentorLevel._id, {
        menteesCount: (mentorLevel.menteesCount || 0) + 1,
        updatedAt: Date.now(),
      })
    }
  },
})

/**
 * Track mentee checkpoint advancement — awards points to mentor.
 */
export const trackMenteeCheckpoint = mutation({
  args: {
    menteeId: v.id("users"),
    checkpointId: v.id("ventureCheckpoints"),
  },
  handler: async (ctx, args) => {
    const now = Date.now()

    const mentorship = await ctx.db
      .query("mentorships")
      .withIndex("by_mentee_status", (q) =>
        q.eq("menteeId", args.menteeId).eq("status", "active")
      )
      .first()

    if (!mentorship) return

    // Update mentor's tracking
    const mentorLevel = await ctx.db
      .query("userLevels")
      .withIndex("by_user", (q) => q.eq("userId", mentorship.mentorId))
      .first()

    if (mentorLevel) {
      await ctx.db.patch(mentorLevel._id, {
        menteeCheckpointAdvances: (mentorLevel.menteeCheckpointAdvances || 0) + 1,
        updatedAt: now,
      })
    }
  },
})

/**
 * End a mentorship.
 */
export const endMentorship = mutation({
  args: {
    mentorshipId: v.id("mentorships"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthenticated")

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first()

    if (!user) throw new Error("User not found")

    const mentorship = await ctx.db.get(args.mentorshipId)
    if (!mentorship) throw new Error("Mentorship not found")

    if (mentorship.mentorId !== user._id && mentorship.menteeId !== user._id) {
      throw new Error("Not your mentorship")
    }

    await ctx.db.patch(args.mentorshipId, {
      status: "ended",
      endedAt: Date.now(),
    })
  },
})

/**
 * Get mentor dashboard — mentees and their progress.
 */
export const getMentorDashboard = query({
  args: { mentorId: v.id("users") },
  handler: async (ctx, args) => {
    const mentorships = await ctx.db
      .query("mentorships")
      .withIndex("by_mentor_status", (q) =>
        q.eq("mentorId", args.mentorId).eq("status", "active")
      )
      .collect()

    const mentees = await Promise.all(
      mentorships.map(async (m) => {
        const mentee = await ctx.db.get(m.menteeId)
        const menteeLevel = await ctx.db
          .query("userLevels")
          .withIndex("by_user", (q) => q.eq("userId", m.menteeId))
          .first()

        return {
          mentorshipId: m._id,
          mentee: mentee,
          level: menteeLevel,
          startedAt: m.startedAt,
        }
      })
    )

    return mentees
  },
})

/**
 * Get user's mentorship status.
 */
export const getMentorshipStatus = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const asMentor = await ctx.db
      .query("mentorships")
      .withIndex("by_mentor_status", (q) =>
        q.eq("mentorId", args.userId).eq("status", "active")
      )
      .collect()

    const asMentee = await ctx.db
      .query("mentorships")
      .withIndex("by_mentee_status", (q) =>
        q.eq("menteeId", args.userId).eq("status", "active")
      )
      .first()

    return {
      isMentor: asMentor.length > 0,
      menteeCount: asMentor.length,
      hasMentor: !!asMentee,
      mentorId: asMentee?.mentorId,
    }
  },
})
