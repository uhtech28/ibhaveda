import { query, mutation } from "./_generated/server"
import { v } from "convex/values"
import { Id } from "./_generated/dataModel"

// TypeScript interfaces for user data
export interface UserProfile {
  _id: string
  clerkId: string
  username: string
  displayName: string
  bio?: string
  avatar?: string
  location?: string
  website?: string
  github?: string
  linkedin?: string
  twitter?: string
  skills: string[]
  industry?: string
  completedOnboarding: boolean
  isActive: boolean
  role: string
  followersCount: number
  followingCount: number
  lastLoginAt?: number
  createdAt: number
  updatedAt: number
}

// Get current user's profile by Clerk ID - FAST lookup with optimized queries
export const getCurrentUser = query({
  handler: async ({ db, auth }): Promise<UserProfile | null> => {
    const identity = await auth.getUserIdentity()

    if (!identity) return null

    const profile = await db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first()

    if (!profile) return null

    // Efficiently fetch related data - optimized for performance
    const skills = await db
      .query("userSkills")
      .withIndex("by_user", (q) => q.eq("userId", profile._id))
      .collect()

    return {
      ...profile,
      skills: skills.map((s) => s.skillName),
    } as UserProfile
  },
})

// Create user profile (during onboarding)
export const createUserProfile = mutation({
  args: {
    username: v.string(),
    displayName: v.string(),
    bio: v.optional(v.string()),
    avatar: v.optional(v.string()),
    location: v.optional(v.string()),
    website: v.optional(v.string()),
    github: v.optional(v.string()),
    linkedin: v.optional(v.string()),
    twitter: v.optional(v.string()),
    skills: v.array(v.string()),
    industry: v.optional(v.string()),
  },
  handler: async ({ db, auth }, args): Promise<string> => {
    try {
  // Verify authentication
  const identity = await auth.getUserIdentity()
  if (!identity) {
    throw new Error("Authentication required: Please sign in to create your profile")
  }

  // Check if user already has a profile
  const existing = await db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .first()

  if (existing) {
    console.log("User profile creation attempted for existing profile:", identity.subject)
    throw new Error("Profile already exists: You've already created your profile")
  }

  // Validate and normalize username (case-insensitive uniqueness)
  const normalizedUsername = args.username.toLowerCase().trim()
  if (normalizedUsername.length < 3 || normalizedUsername.length > 20) {
    throw new Error("Invalid username: Username must be between 3 and 20 characters long")
  }
  if (!/^[a-zA-Z0-9_]+$/.test(normalizedUsername)) {
    throw new Error("Invalid username: Username can only contain letters, numbers, and underscores")
  }

  // Check for existing username (case-insensitive)
  const existingUsername = await db
    .query("users")
    .withIndex("by_username", (q) => q.eq("username", normalizedUsername))
    .first()

  if (existingUsername) {
    console.log("Duplicate username attempted:", normalizedUsername, "by user:", identity.subject)
    throw new Error(`Username "${normalizedUsername}" is already taken. Please try a different username.`)
  }

  const now = Date.now()

  // Create user profile with normalized username
  let userId: Id<"users">;
  try {
    userId = await db.insert("users", {
      clerkId: identity.subject,
      username: normalizedUsername,
      displayName: args.displayName,
      bio: args.bio,
      avatar: args.avatar,
      location: args.location,
      website: args.website,
      github: args.github,
      linkedin: args.linkedin,
      twitter: args.twitter,
      completedOnboarding: true,
      isActive: true,
      role: "user",
      followersCount: 0,
      followingCount: 0,
      createdAt: now,
      updatedAt: now,
    });
  } catch (insertError) {
    console.error("Failed to insert user profile:", insertError)
    throw new Error("Profile creation failed: Unable to save your profile. Please try again.")
  }

  // Add skills efficiently with batch operations
  if (args.skills.length > 0) {
    await Promise.all(
      args.skills.map((skill) =>
        db.insert("userSkills", {
          userId,
          skillName: skill,
        })
      )
    )
  }

  console.log("Successfully created user profile:", userId, "username:", normalizedUsername)
  return userId
    } catch (error) {
      console.error("Error in createUserProfile:", error)
      throw error // Re-throw to maintain original error messages
    }
  },
})

// Update user profile - OPTIMISTIC UPDATES with transaction safety
export const updateUserProfile = mutation({
  args: v.object({
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatar: v.optional(v.string()),
    location: v.optional(v.string()),
    website: v.optional(v.string()),
    github: v.optional(v.string()),
    linkedin: v.optional(v.string()),
    twitter: v.optional(v.string()),
    skills: v.optional(v.array(v.string())),
    industry: v.optional(v.string()),
  }),
  handler: async ({ db, auth }, args): Promise<string> => {
    // Verify authentication
    const identity = await auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")

    // Get user profile
    const profile = await db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
      .first()

    if (!profile) throw new Error("User profile not found")

    // Update profile with optimistic results
    const updateData: any = {
      updatedAt: Date.now(),
    }

    // Only update fields that are provided
    Object.entries(args).forEach(([key, value]) => {
      if (value !== undefined && key !== "skills") {
        updateData[key] = value
      }
    })

    await db.patch(profile._id, updateData)

    // Handle skills updates with transaction safety
    if (args.skills !== undefined) {
      // Remove existing skills
      const existingSkills = await db
        .query("userSkills")
        .withIndex("by_user", (q) => q.eq("userId", profile._id))
        .collect()
      await Promise.all(
        existingSkills.map((skill) => db.delete(skill._id))
      )

      // Add new skills
      if (args.skills.length > 0) {
        await Promise.all(
          args.skills.map((skill) =>
            db.insert("userSkills", {
              userId: profile._id,
              skillName: skill,
            })
          )
        )
      }
    }

    return profile._id
  },
})

// Check if user exists (for middleware) - optimized for speed
export const userExists = query({
  handler: async ({ db, auth }): Promise<boolean> => {
    const identity = await auth.getUserIdentity()
    if (!identity) return false

    const profile = await db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
      .first()

    return !!profile
  },
})

// Search users by username - optimized with pagination (case-insensitive)
export const searchUsers = query({
  args: { query: v.string(), limit: v.optional(v.number()) },
  handler: async ({ db }, { query, limit = 20 }): Promise<
    Array<{ id: string; username: string; displayName: string; avatar?: string }>
  > => {
    const normalizedQuery = query.toLowerCase().trim()
    if (!normalizedQuery) return []

    const results = await db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", normalizedQuery))
      .take(limit)

    return results.map((user) => ({
      id: user._id,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
    }))
  },
})

// Get user stats for performance monitoring
export const getUserStats = query({
  handler: async ({ db, auth }): Promise<
    | { skillsCount: number; createdAt: number; completedOnboarding: boolean }
    | null
  > => {
    const identity = await auth.getUserIdentity()
    if (!identity) return null

    const profile = await db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first()

    if (!profile) return null

    const skillsCount = await db
      .query("userSkills")
      .withIndex("by_user", (q) => q.eq("userId", profile._id))
      .collect()

    return {
      skillsCount: skillsCount.length,
      createdAt: profile.createdAt,
      completedOnboarding: profile.completedOnboarding,
    }
  },
})

// Get user profile by username - for public profiles (case-insensitive)
export const getUserProfile = query({
  args: { username: v.string() },
  handler: async ({ db }, { username }): Promise<UserProfile | null> => {
    const normalizedUsername = username.toLowerCase().trim()
    const profile = await db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", normalizedUsername))
      .first()

    if (!profile) return null

    // Fetch skills efficiently
    const skills = await db
      .query("userSkills")
      .withIndex("by_user", (q) => q.eq("userId", profile._id))
      .collect()

    return {
      ...profile,
      skills: skills.map((s) => s.skillName),
    } as UserProfile
  },
})

// Get all users for community page
export const getAllUsers = query({
  handler: async ({ db }): Promise<UserProfile[]> => {
    const users = await db
      .query("users")
      .withIndex("by_is_active")
      .filter((q) => q.neq(q.field("isActive"), false))
      .collect()

    // Sort by createdAt descending
    users.sort((a, b) => b.createdAt - a.createdAt)

    // Fetch skills for each user efficiently
    const usersWithSkills = await Promise.all(
      users.map(async (user) => {
        const skills = await db
          .query("userSkills")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect()

        return {
          ...user,
          skills: skills.map((s) => s.skillName),
        } as UserProfile
      })
    )

    return usersWithSkills
  },
})