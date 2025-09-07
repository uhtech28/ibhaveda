import { query, mutation } from "./_generated/server"
import { v } from "convex/values"
import { Id } from "./_generated/dataModel"

// Follow a user
export const followUser = mutation({
  args: {
    followeeId: v.id("users"), // The user to follow
  },
  handler: async ({ db, auth }, { followeeId }): Promise<void> => {
    const identity = await auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    // Get current user
    const follower = await db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first()
    if (!follower) throw new Error("User not found")

    const followerId = follower._id

    // Prevent following yourself
    if (followerId === followeeId) {
      throw new Error("Cannot follow yourself")
    }

    // Check if already following
    const existingFollow = await db
      .query("userFollows")
      .withIndex("by_follower_followee", (q) =>
        q.eq("followerId", followerId).eq("followeeId", followeeId)
      )
      .first()

    if (existingFollow) {
      throw new Error("Already following this user")
    }

    // Start a transaction to ensure consistency
    const now = Date.now()

    // Insert follow record
    await db.insert("userFollows", {
      followerId,
      followeeId,
      createdAt: now,
    })

    // Update follower's following count
    await db.patch(followerId, {
      followingCount: (follower.followingCount || 0) + 1,
      updatedAt: now,
    })

    // Update followee's followers count
    const followee = await db.get(followeeId)
    if (followee) {
      await db.patch(followeeId, {
        followersCount: (followee.followersCount || 0) + 1,
        updatedAt: now,
      })
    }
  },
})

// Unfollow a user
export const unfollowUser = mutation({
  args: {
    followeeId: v.id("users"), // The user to unfollow
  },
  handler: async ({ db, auth }, { followeeId }): Promise<void> => {
    const identity = await auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    // Get current user
    const follower = await db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first()
    if (!follower) throw new Error("User not found")

    const followerId = follower._id

    // Check if following
    const existingFollow = await db
      .query("userFollows")
      .withIndex("by_follower_followee", (q) =>
        q.eq("followerId", followerId).eq("followeeId", followeeId)
      )
      .first()

    if (!existingFollow) {
      throw new Error("Not following this user")
    }

    // Start a transaction-like update (Convex handles consistency)
    const now = Date.now()

    // Delete follow record
    await db.delete(existingFollow._id)

    // Update follower's following count
    await db.patch(followerId, {
      followingCount: Math.max(0, (follower.followingCount || 0) - 1),
      updatedAt: now,
    })

    // Update followee's followers count
    const followee = await db.get(followeeId)
    if (followee) {
      await db.patch(followeeId, {
        followersCount: Math.max(0, (followee.followersCount || 0) - 1),
        updatedAt: now,
      })
    }
  },
})

// Check if current user is following another user
export const isFollowing = query({
  args: {
    followeeId: v.id("users"), // The user to check follow status for
  },
  handler: async ({ db, auth }, { followeeId }): Promise<boolean> => {
    const identity = await auth.getUserIdentity()
    if (!identity) return false

    // Get current user
    const follower = await db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first()
    if (!follower) return false

    const followerId = follower._id

    // Check if following
    const follow = await db
      .query("userFollows")
      .withIndex("by_follower_followee", (q) =>
        q.eq("followerId", followerId).eq("followeeId", followeeId)
      )
      .first()

    return !!follow
  },
})

// Get follow stats for a user (optional additional query)
export const getFollowStats = query({
  args: {
    userId: v.id("users"),
  },
  handler: async ({ db }, { userId }) => {
    const followers = await db
      .query("userFollows")
      .withIndex("by_followee", (q) => q.eq("followeeId", userId))
      .collect()

    const following = await db
      .query("userFollows")
      .withIndex("by_follower", (q) => q.eq("followerId", userId))
      .collect()

    return {
      followersCount: followers.length,
      followingCount: following.length,
    }
  },
})