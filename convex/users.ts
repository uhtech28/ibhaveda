import { query, mutation } from "./_generated/server"
import { v } from "convex/values"
import { Id } from "./_generated/dataModel"
import type { Doc } from "./_generated/dataModel"

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
      console.log('👤 Creating user profile:', { username: args.username, skills: args.skills.length, industry: args.industry })
  // Verify authentication
  const identity = await auth.getUserIdentity()
  if (!identity) {
    console.log("createUserProfile: No authentication identity found")
    throw new Error("Authentication required: Please sign in to create your profile")
  }

  console.log("createUserProfile: Authentication identity subject:", identity.subject)

  // Check if user already has a profile
  const existing = await db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .first()

  console.log("createUserProfile: Existing profile lookup result:", existing ? "found" : "not found")

  if (existing) {
    console.log("User profile creation attempted for existing profile:", identity.subject)
    throw new Error("You already have a profile set up!")
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
    console.log('💡 Adding skills:', args.skills)
    await Promise.all(
      args.skills.map((skill) =>
        db.insert("userSkills", {
          userId,
          skillName: skill,
        })
      )
    )
  }

  // Add industry if provided
  if (args.industry) {
    console.log('🏭 Adding industry:', args.industry)
    await db.insert("userIndustries", {
      userId,
      industryName: args.industry,
    })
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
    console.log('🔄 Updating user profile:', {
      displayName: args.displayName,
      skills: args.skills?.length,
      industry: args.industry
    })

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
      console.log('💡 Updating skills:', args.skills)
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

    // Handle industry updates
    if (args.industry !== undefined) {
      console.log('🏭 Updating industry:', args.industry)
      // Remove existing industry
      const existingIndustries = await db
        .query("userIndustries")
        .withIndex("by_user", (q) => q.eq("userId", profile._id))
        .collect()
      await Promise.all(
        existingIndustries.map((industry) => db.delete(industry._id))
      )

      // Add new industry
      if (args.industry) {
        await db.insert("userIndustries", {
          userId: profile._id,
          industryName: args.industry,
        })
      }
    }

    return profile._id
  },
})

// Check if user exists (for middleware) - optimized for speed
export const userExists = query({
  handler: async ({ db, auth }): Promise<boolean> => {
    const identity = await auth.getUserIdentity()
    if (!identity) {
      console.log("userExists: No authentication identity found")
      return false
    }

    console.log("userExists: Authentication identity subject:", identity.subject)

    const profile = await db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
      .first()

    console.log("userExists: Profile lookup result:", profile ? "found" : "not found")

    return !!profile
  },
})

// Search users by username - supports partial matching with pagination (case-insensitive)
export const searchUsers = query({
  args: { query: v.string(), limit: v.optional(v.number()) },
  handler: async ({ db }, { query, limit = 20 }): Promise<
    Array<{ id: string; username: string; displayName: string; avatar?: string }>
  > => {
    const normalizedQuery = query.toLowerCase().trim()
    if (!normalizedQuery) return []

    // For partial matching, we'll fetch more users and filter client-side
    // This is a workaround since Convex doesn't support prefix search directly
    const allUsers = await db
      .query("users")
      .withIndex("by_is_active", (q) => q.eq("isActive", true))
      .take(1000) // Fetch a reasonable number of active users

    // Filter users whose username starts with the query
    const filteredUsers = allUsers
      .filter((user) =>
        user.username.toLowerCase().startsWith(normalizedQuery)
      )
      .slice(0, limit)

    return filteredUsers.map((user) => ({
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

    // Fetch industry efficiently
    const industries = await db
      .query("userIndustries")
      .withIndex("by_user", (q) => q.eq("userId", profile._id))
      .collect()

    // Calculate dynamic metrics
    const createdIdeas = await db
      .query("ideas")
      .withIndex("by_author", (q) => q.eq("authorId", profile._id))
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .filter((q) => q.or(q.eq(q.field("parentId"), undefined), q.eq(q.field("parentId"), null)))
      .collect()

    const sparkedRecords = await db
      .query("userIdeaSparks")
      .withIndex("by_user", (q) => q.eq("userId", profile._id))
      .collect()

    let sparkedCount = 0
    for (const spark of sparkedRecords) {
      const idea = await db.get(spark.ideaId)
      if (idea && !idea.isDeleted && idea.authorId !== profile._id) {
        sparkedCount++
      }
    }

    const acceptedRequests = await db
      .query("contributionRequests")
      .withIndex("by_contributor_status", (q) =>
        q.eq("contributorId", profile._id).eq("status", "accepted")
      )
      .collect()

    return {
      ...profile,
      skills: skills.map((s) => s.skillName),
      industry: industries.length > 0 ? industries[0].industryName : undefined,
      ideasCreated: createdIdeas.length,
      ideasSparked: sparkedCount,
      ideasContributed: acceptedRequests.length,
    } as UserProfile
  },
})

// Get all users for community page with real-time metrics
export const getAllUsers = query({
  handler: async ({ db }): Promise<UserProfile[]> => {
    const users = await db
      .query("users")
      .withIndex("by_is_active")
      .filter((q) => q.neq(q.field("isActive"), false))
      .collect()

    // Sort by createdAt descending
    users.sort((a, b) => b.createdAt - a.createdAt)

    // Fetch skills and dynamic metrics for each user efficiently
    const usersWithMetrics = await Promise.all(
      users.map(async (user) => {
        // Fetch skills
        const skills = await db
          .query("userSkills")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect()

        // Fetch created ideas count
        const createdIdeas = await db
          .query("ideas")
          .withIndex("by_author", (q) => q.eq("authorId", user._id))
          .filter((q) => q.neq(q.field("isDeleted"), true))
          .filter((q) => q.or(q.eq(q.field("parentId"), undefined), q.eq(q.field("parentId"), null)))
          .collect()

        // Fetch sparked ideas count (ideas user has sparked, excluding their own)
        const sparkedRecords = await db
          .query("userIdeaSparks")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect()

        // Filter out user's own ideas from sparked count
        let sparkedCount = 0
        for (const spark of sparkedRecords) {
          const idea = await db.get(spark.ideaId)
          if (idea && !idea.isDeleted && idea.authorId !== user._id) {
            sparkedCount++
          }
        }

        // Fetch contributed ideas count (ideas user contributed to with accepted requests)
        const acceptedRequests = await db
          .query("contributionRequests")
          .withIndex("by_contributor_status", (q) =>
            q.eq("contributorId", user._id).eq("status", "accepted")
          )
          .collect()

        return {
          ...user,
          skills: skills.map((s) => s.skillName),
          ideasCreated: createdIdeas.length,
          ideasSparked: sparkedCount,
          ideasContributed: acceptedRequests.length,
        } as UserProfile
      })
    )

    return usersWithMetrics
  },
})

// Check if user profile is complete
export const isProfileComplete = query({
  args: { clerkId: v.string() },
  handler: async ({ db }, { clerkId }): Promise<boolean> => {
    const profile = await db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!profile) return false;

    // Check required fields
    if (!profile.username || !profile.displayName || !profile.avatar || !profile.industry || !profile.bio || (profile.bio && profile.bio.length < 50)) {
      return false;
    }

    // Check at least 3 skills
    const skills = await db
      .query("userSkills")
      .withIndex("by_user", (q) => q.eq("userId", profile._id))
      .collect();

    if (skills.length < 3) return false;

    return true;
  },
});

// Get suggested collaborators based on skills and industries matching
export const getSuggestedCollaborators = query({
  args: {
    skills: v.array(v.string()),
    industries: v.array(v.string()),
    limit: v.optional(v.number()),
    excludeUserId: v.optional(v.string())
  },
  handler: async ({ db }, { skills, industries, limit = 10, excludeUserId }): Promise<UserProfile[]> => {
    console.log('🔍 getSuggestedCollaborators called with:', {
      skills: skills.length,
      industries: industries.length,
      limit,
      excludeUserId: excludeUserId ? 'present' : 'null',
      skillsList: skills,
      industriesList: industries
    })

    // Get user skill matches
    const skillMatches = new Set<Id<"users">>()
    if (skills.length > 0) {
      console.log('📊 Searching for skill matches...')
      const matchingUserSkills = await db
        .query("userSkills")
        .collect()

      console.log(`📊 Found ${matchingUserSkills.length} userSkills records`)

      matchingUserSkills.forEach(userSkill => {
        if (skills.some(skill => userSkill.skillName.toLowerCase() === skill.toLowerCase())) {
          skillMatches.add(userSkill.userId)
        }
      })
      console.log(`📊 Skill matches found: ${skillMatches.size} users`)
    }

    // Get user industry matches
    const industryMatches = new Set<Id<"users">>()
    if (industries.length > 0) {
      console.log('🏭 Searching for industry matches...')
      const matchingUserIndustries = await db
        .query("userIndustries")
        .collect()

      console.log(`🏭 Found ${matchingUserIndustries.length} userIndustries records`)

      matchingUserIndustries.forEach(userIndustry => {
        if (industries.some(industry => userIndustry.industryName.toLowerCase() === industry.toLowerCase())) {
          industryMatches.add(userIndustry.userId)
        }
      })
      console.log(`🏭 Industry matches found: ${industryMatches.size} users`)
    }

    // Combine matches (union of skill and industry matches)
    const allMatches = new Set([...skillMatches, ...industryMatches])

    // Remove current user if specified
    if (excludeUserId) {
      // Find the user ID from Clerk ID
      const currentUser = await db
        .query("users")
        .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", excludeUserId))
        .first()

      if (currentUser) {
        allMatches.delete(currentUser._id)
      }
    }

    console.log(`🎯 Total unique matches (excluding current user): ${allMatches.size}`)

    // Fetch user profiles for matches
    const matchedUsers = []
    for (const userId of allMatches) {
      try {
        const user = await db.get(userId)
        if (user && user.isActive !== false) {
          // Fetch skills for this user
          const userSkills = await db
            .query("userSkills")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .collect()

          matchedUsers.push({
            ...user,
            skills: userSkills.map((s) => s.skillName),
          } as UserProfile)
        } else {
          console.log(`⚠️ User ${userId} is inactive or not found`)
        }
      } catch (error) {
        console.error(`❌ Error fetching user ${userId}:`, error)
      }
    }

    console.log(`✅ Successfully fetched ${matchedUsers.length} user profiles`)

    // Sort by relevance (users with both skill and industry matches first)
    const skillMatchSet = new Set(skillMatches)
    const industryMatchSet = new Set(industryMatches)

    matchedUsers.sort((a, b) => {
      const aSkillMatch = skillMatchSet.has(a._id as Id<"users">)
      const bSkillMatch = skillMatchSet.has(b._id as Id<"users">)
      const aIndustryMatch = industryMatchSet.has(a._id as Id<"users">)
      const bIndustryMatch = industryMatchSet.has(b._id as Id<"users">)

      const aRelevance = (aSkillMatch ? 2 : 0) + (aIndustryMatch ? 1 : 0)
      const bRelevance = (bSkillMatch ? 2 : 0) + (bIndustryMatch ? 1 : 0)

      return bRelevance - aRelevance
    })

    // Return limited results
    const result = matchedUsers.slice(0, limit)
    console.log(`📤 Returning ${result.length} suggested collaborators`)
    return result
    },
  })
  
  // Check username availability - case-insensitive uniqueness check
  export const checkUsernameAvailability = query({
    args: { username: v.string() },
    handler: async ({ db }, { username }): Promise<{ available: boolean; error?: string }> => {
      console.log('🔍 DEBUG: checkUsernameAvailability called with:', username);

      const normalizedUsername = username.toLowerCase().trim()
      console.log('🔍 DEBUG: normalizedUsername:', normalizedUsername);

      // Validate format
      if (normalizedUsername.length < 3 || normalizedUsername.length > 20) {
        console.log('🔍 DEBUG: Username length validation failed:', normalizedUsername.length);
        return { available: false, error: "Username must be between 3 and 20 characters long" }
      }
      const regexTest = /^[a-zA-Z0-9_]+$/.test(normalizedUsername);
      console.log('🔍 DEBUG: Regex test result:', regexTest, 'for:', normalizedUsername);
      if (!regexTest) {
        console.log('🔍 DEBUG: Username regex validation failed');
        return { available: false, error: "Username can only contain letters, numbers, and underscores" }
      }

      // Check for existing username (case-insensitive)
      console.log('🔍 DEBUG: Checking database for existing username...');
      const existing = await db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", normalizedUsername))
        .first()

      console.log('🔍 DEBUG: Existing username check result:', existing ? 'TAKEN' : 'AVAILABLE');

      return { available: !existing }
    },
  })
  
  // Generate username suggestions when conflicts are detected
  export const generateUsernameSuggestions = query({
    args: { baseUsername: v.string(), count: v.optional(v.number()) },
    handler: async ({ db }, { baseUsername, count = 5 }): Promise<string[]> => {
      console.log('🔍 DEBUG: generateUsernameSuggestions called with:', baseUsername, 'count:', count);

      const normalizedBase = baseUsername.toLowerCase().trim()
      console.log('🔍 DEBUG: normalizedBase:', normalizedBase);

      // Validate base username format
      if (!normalizedBase || normalizedBase.length < 3 || normalizedBase.length > 20 || !/^[a-zA-Z0-9_]+$/.test(normalizedBase)) {
        console.log('🔍 DEBUG: Base username validation failed, returning empty suggestions');
        return []
      }

      const suggestions: string[] = []
      const variations: string[] = []

      // Generate systematic variations
      // 1. Append numbers
      for (let i = 1; i <= 10; i++) {
        variations.push(`${normalizedBase}${i}`)
      }

      // 2. Add common suffixes
      const suffixes = ['_dev', '_official', '_pro', '_x', '_hub']
      for (const suffix of suffixes) {
        variations.push(`${normalizedBase}${suffix}`)
      }

      // 3. Try with numbers in different positions
      if (normalizedBase.length >= 4) {
        variations.push(`${normalizedBase.slice(0, -1)}1${normalizedBase.slice(-1)}`)
        variations.push(`${normalizedBase.slice(0, 2)}1${normalizedBase.slice(2)}`)
      }

      // 4. Handle case variations (but keep normalized for checking)
      variations.push(normalizedBase.charAt(0).toUpperCase() + normalizedBase.slice(1))

      console.log('🔍 DEBUG: Generated', variations.length, 'variations:', variations);

      // Check each variation for availability
      for (const suggestion of variations) {
        if (suggestions.length >= count) break

        const normalizedSuggestion = suggestion.toLowerCase()
        if (normalizedSuggestion === normalizedBase) continue // Skip the original

        // Validate suggestion format
        if (normalizedSuggestion.length < 3 || normalizedSuggestion.length > 20 || !/^[a-zA-Z0-9_]+$/.test(normalizedSuggestion)) {
          console.log('🔍 DEBUG: Skipping invalid suggestion:', suggestion);
          continue
        }

        console.log('🔍 DEBUG: Checking availability of suggestion:', suggestion);
        const existing = await db
          .query("users")
          .withIndex("by_username", (q) => q.eq("username", normalizedSuggestion))
          .first()

        if (!existing) {
          console.log('🔍 DEBUG: Suggestion available:', suggestion);
          suggestions.push(suggestion)
        } else {
          console.log('🔍 DEBUG: Suggestion taken:', suggestion);
        }
      }

      console.log('🔍 DEBUG: Final suggestions:', suggestions.slice(0, count));
      return suggestions.slice(0, count)
    },
  })