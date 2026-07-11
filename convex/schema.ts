import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table - stores user profiles and settings
  users: defineTable({
    clerkId: v.string(), // Clerk user ID
    username: v.string(), // Unique username
    displayName: v.string(), // Display name
    bio: v.optional(v.string()), // User bio
    avatar: v.optional(v.string()), // Avatar URL
    location: v.optional(v.string()), // User location
    website: v.optional(v.string()), // Website URL
    github: v.optional(v.string()), // GitHub URL
    linkedin: v.optional(v.string()), // LinkedIn URL
    twitter: v.optional(v.string()), // Twitter handle
    skills: v.optional(v.array(v.string())), // Array of user skills (handled via userSkills table)
    industry: v.optional(v.string()), // Primary industry (kept for backward compatibility)
    industries: v.optional(v.array(v.string())), // Multiple industries
    personaGender: v.optional(v.union(v.literal("male"), v.literal("female"))), // Legacy — kept for back-compat
    // PRD § 3.1 — 10 named personas. New ventures pick one of these
    // and the world-map renders the painted sprite. If unset on a
    // legacy venture, the Phaser scene falls back to personaGender.
    personaId: v.optional(
      v.union(
        v.literal("arcanist"),
        v.literal("ranger"),
        v.literal("alchemist"),
        v.literal("artisan"),
        v.literal("drifter"),
        v.literal("oracle"),
        v.literal("engineer"),
        v.literal("healer"),
        v.literal("pathfinder"),
        v.literal("sage"),
      ),
    ),
    // Builder persona picked during profile setup. Drives the AI
    // pre-fill in the first-run tour.
    builderRole: v.optional(
      v.union(
        v.literal("founder"),
        v.literal("engineer"),
        v.literal("designer"),
        v.literal("student"),
        v.literal("researcher"),
        v.literal("pm"),
      ),
    ),
    completedOnboarding: v.boolean(), // Onboarding status
    isActive: v.optional(v.boolean()), // Account status for user management
    role: v.optional(v.string()), // User role (user, moderator, admin)
    followersCount: v.optional(v.number()), // Number of followers
    followingCount: v.optional(v.number()), // Number of users followed
    xp: v.optional(v.number()), // Experience points
    level: v.optional(v.number()), // User level
    lastLoginAt: v.optional(v.number()), // Last login timestamp
    equippedBadges: v.optional(v.array(v.string())), // Array of equipped badge IDs (e.g. "venture_1", "general_chatterbox")
    // PRD §6 — first-time user feed walkthrough state.
    // not_started → auto-launches on first feed visit
    // in_progress → resumes from feedTutorialStep
    // completed / skipped → never auto-launches; manual replay only
    feedTutorialState: v.optional(
      v.union(
        v.literal("not_started"),
        v.literal("in_progress"),
        v.literal("completed"),
        v.literal("skipped"),
      ),
    ),
    feedTutorialStep: v.optional(v.number()), // Last viewed step index
    createdAt: v.number(), // Unix timestamp
    updatedAt: v.number(), // Unix timestamp
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_username", ["username"])
    .index("by_completed_onboarding", ["completedOnboarding"])
    .index("by_role", ["role"])
    .index("by_is_active", ["isActive"])
    .index("by_created_at", ["createdAt"]),

  // User skills table for many-to-many relationship
  userSkills: defineTable({
    userId: v.id("users"), // Reference to users table
    skillName: v.string(), // Skill name
  })
    .index("by_user", ["userId"])
    .index("by_skill", ["skillName"]),

  // User industries table for many-to-many relationship
  userIndustries: defineTable({
    userId: v.id("users"), // Reference to users table
    industryName: v.string(), // Industry name
  })
    .index("by_user", ["userId"])
    .index("by_industry", ["industryName"]),

  // Session tracking for security
  userSessions: defineTable({
    userId: v.id("users"), // Reference to users table
    sessionId: v.string(), // Session identifier
    expiresAt: v.number(), // Expiration timestamp
  })
    .index("by_session", ["sessionId"])
    .index("by_user_expires", ["userId", "expiresAt"]),

  // Ideas table - stores user-created ideas
  ideas: defineTable({
    authorId: v.id("users"), // Reference to users table (author)
    title: v.string(), // Idea title (required)
    description: v.string(), // Idea description (required)
    category: v.string(), // Skills as comma-separated string
    industries: v.optional(v.string()), // Industries as comma-separated string
    visibility: v.string(), // 'public' or 'private'
    // File attachment URLs (stored in Convex storage)
    attachments: v.optional(
      v.array(
        v.object({
          name: v.string(),
          type: v.string(),
          size: v.number(),
          url: v.string(),
          fileId: v.string(), // Convex storage ID
        }),
      ),
    ),
    sparkCount: v.number(), // Number of spark/like actions
    commentCount: v.number(), // Number of comments
    contributionRequestCount: v.optional(v.number()), // Number of contribution requests
    createdAt: v.number(), // Unix timestamp
    updatedAt: v.number(), // Unix timestamp
    isDeleted: v.optional(v.boolean()), // Soft delete flag
    parentId: v.optional(v.id("ideas")), // Optional parent idea for hierarchical relationships
  })
    .index("by_author", ["authorId"])
    .index("by_visibility", ["visibility"])
    .index("by_category", ["category"])
    .index("by_industries", ["industries"])
    .index("by_created_at", ["createdAt"])
    .index("by_author_visibility", ["authorId", "visibility"])
    .index("by_category_created", ["category", "createdAt"])
    .index("by_industries_created", ["industries", "createdAt"])
    .index("by_is_deleted", ["isDeleted"])
    .index("by_parent", ["parentId"]),

  // Comments table - stores comments on ideas
  comments: defineTable({
    ideaId: v.id("ideas"), // Reference to ideas table
    authorId: v.id("users"), // Reference to users table (comment author)
    content: v.string(), // Comment content
    createdAt: v.number(), // Unix timestamp
    parentCommentId: v.optional(v.id("comments")), // Optional parent comment for nested replies
    sparkCount: v.optional(v.number()), // Number of sparks on this comment
  })
    .index("by_idea", ["ideaId"])
    .index("by_author", ["authorId"])
    .index("by_idea_created", ["ideaId", "createdAt"])
    .index("by_parent", ["parentCommentId"]),

  // User idea sparks table - tracks which users have sparked which ideas
  userIdeaSparks: defineTable({
    userId: v.id("users"), // Reference to users table
    ideaId: v.id("ideas"), // Reference to ideas table
    createdAt: v.number(), // Unix timestamp when sparked
    seeded: v.optional(v.boolean()), // true = social-proof seeded spark (not visible to users)
  })
    .index("by_user", ["userId"])
    .index("by_idea", ["ideaId"])
    .index("by_user_idea", ["userId", "ideaId"]),

  // User comment sparks table - tracks which users have sparked which comments
  userCommentSparks: defineTable({
    userId: v.id("users"),
    commentId: v.id("comments"),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_comment", ["commentId"])
    .index("by_user_comment", ["userId", "commentId"]),

  // Social proof engine — per-post spark delivery schedules
  socialProofSchedules: defineTable({
    ideaId: v.id("ideas"),
    authorId: v.id("users"),
    createdAt: v.number(),       // when the idea was created (epoch ms)
    capCount: v.number(),        // absolute max sparks to deliver (75–95 % of total users)
    capPercent: v.number(),      // the % drawn (analytics only, never shown to users)
    sparksDelivered: v.number(), // running total of seeded sparks fired
    isComplete: v.boolean(),     // true once cap is reached or no eligible likers remain
  })
    .index("by_idea", ["ideaId"])
    .index("by_complete", ["isComplete"])
    .index("by_created_at", ["createdAt"]),

  // Contribution requests table
  // PRD § 9.1 — inline path henchman resolutions. One row per
  // henchman defeated or fled, scoped per user for idempotency.
  henchmanResolutions: defineTable({
    userId: v.id("users"),
    spawnId: v.string(),
    henchmanId: v.string(),
    ventureId: v.id("ventures"),
    stage: v.number(),
    resolution: v.union(v.literal("defeated"), v.literal("fled")),
    xpAwarded: v.number(),
    resolvedAt: v.number(),
  })
    .index("by_user_spawn", ["userId", "spawnId"])
    .index("by_venture", ["ventureId"]),

  // PRD § 9.2 — inter-checkpoint treasure chest claims. One row per
  // chest opened, scoped per user so idempotency guarantees a chest
  // can only be claimed once even if the React event fires twice.
  treasureChestClaims: defineTable({
    userId: v.id("users"),
    chestId: v.string(),
    ventureId: v.id("ventures"),
    reward: v.union(
      v.literal("xp_cache"),
      v.literal("flare_charge"),
      v.literal("corruption_shield"),
      v.literal("insight_fragment"),
    ),
    stage: v.number(),
    xpAwarded: v.optional(v.number()),
    claimedAt: v.number(),
  })
    .index("by_user_chest", ["userId", "chestId"])
    .index("by_venture", ["ventureId"]),

  contributionRequests: defineTable({
    ideaId: v.id("ideas"),
    contributorId: v.id("users"),
    authorId: v.id("users"),
    message: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected"),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_idea_status_created", ["ideaId", "status", "createdAt"])
    .index("by_idea_contributor", ["ideaId", "contributorId"])
    .index("by_contributor_status", ["contributorId", "status"])
    .index("by_author_created", ["authorId", "createdAt"]),

  // Todos table - tracks todo items for ideas
  todos: defineTable({
    ideaId: v.id("ideas"), // Reference to the idea
    authorId: v.id("users"), // User who created the todo
    assignedTo: v.optional(v.id("users")), // User assigned to the todo (reference to users table)
    title: v.string(), // Todo title/description
    status: v.union(
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("done"),
    ), // Status of the todo
    order: v.optional(v.number()), // Order for sorting/display
    deadline: v.optional(v.number()), // Deadline as Unix timestamp
    completionTarget: v.optional(v.string()), // Target description for completion
    createdAt: v.number(), // Unix timestamp
    updatedAt: v.number(), // Unix timestamp
  })
    .index("by_idea", ["ideaId"])
    .index("by_author", ["authorId"])
    .index("by_assigned_to", ["assignedTo"])
    .index("by_deadline", ["deadline"])
    .index("by_idea_status", ["ideaId", "status"])
    .index("by_created_at", ["createdAt"]),

  // Messages table - stores chat messages
  messages: defineTable({
    senderId: v.id("users"), // Reference to users table
    receiverId: v.optional(v.id("users")), // Reference to users table (optional for group chats)
    content: v.string(), // Message content (may be empty for image-only messages)
    createdAt: v.number(), // Unix timestamp
    read: v.boolean(), // Read status
    conversationId: v.id("conversations"), // Reference to conversations table
    messageType: v.optional(v.string()), // Message type (e.g., 'text', 'image')
    // PRD §10.2 — image attachments. `imageStorageId` references
    // Convex storage; the bytes themselves are never inline. Width /
    // height let the client reserve aspect ratio space before the
    // image loads, preventing layout shift.
    imageStorageId: v.optional(v.id("_storage")),
    imageWidth: v.optional(v.number()),
    imageHeight: v.optional(v.number()),
  })
    .index("by_sender", ["senderId"])
    .index("by_receiver", ["receiverId"])
    .index("by_conversation", ["conversationId"])
    .index("by_conversation_created", ["conversationId", "createdAt"])
    .index("by_created_at", ["createdAt"]),

  // Conversations table - stores conversation metadata
  conversations: defineTable({
    participant1: v.optional(v.id("users")), // First participant user ID (optional for groups)
    participant2: v.optional(v.id("users")), // Second participant user ID (optional for groups)
    type: v.optional(v.string()), // 'direct' or 'group'
    ideaId: v.optional(v.id("ideas")), // Reference to idea for group chats
    creatorId: v.optional(v.union(v.string(), v.id("users"))), // Creator of group chat (stored as string ID or User ID)
    name: v.optional(v.string()), // Group chat name
    createdAt: v.number(), // Unix timestamp
    updatedAt: v.number(), // Unix timestamp
    lastMessageId: v.optional(v.id("messages")), // Reference to latest message
    unreadCount: v.optional(v.number()), // Unread message count for current user
  })
    .index("by_participant1", ["participant1"])
    .index("by_participant2", ["participant2"])
    .index("by_created_at", ["createdAt"])
    .index("by_participants", ["participant1", "participant2"])
    .index("by_idea", ["ideaId"]),

  // Notifications table - tracks user notifications for ideas and system events
  notifications: defineTable({
    recipientId: v.id("users"), // User receiving the notification
    senderId: v.id("users"), // User who triggered the notification
    type: v.string(), // Notification type (new_idea, comment, spark, etc.)
    message: v.string(), // Notification message text
    relatedId: v.optional(
      v.union(
        v.id("ideas"),
        v.id("comments"),
        v.id("contributionRequests"),
        v.id("todos"),
        v.id("invitations"),
        v.id("badges"),
        v.id("ventures"),
        v.id("ventureCheckpoints"),
        v.id("ventureTasks"),
        v.id("ventureEvidence"),
        v.id("flares"),
        v.id("flareResponses"),
      ),
    ), // ID of related item
    isRead: v.boolean(), // Read status
    createdAt: v.number(), // Unix timestamp
  })
    .index("by_recipient", ["recipientId"])
    .index("by_recipient_read", ["recipientId", "isRead"])
    .index("by_recipient_created", ["recipientId", "createdAt"])
    .index("by_sender", ["senderId"])
    .index("by_related", ["relatedId"])
    .index("by_type", ["type"]),

  // Invitations table - tracks user invitations for idea contributions
  invitations: defineTable({
    ideaId: v.id("ideas"), // Reference to ideas table
    inviterId: v.id("users"), // User sending invitation
    inviteeId: v.id("users"), // User receiving invitation
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected"),
      v.literal("cancelled"),
    ), // Invitation status
    message: v.optional(v.string()), // Optional invitation message
    createdAt: v.number(), // Unix timestamp
    updatedAt: v.number(), // Unix timestamp
  })
    .index("by_idea", ["ideaId"])
    .index("by_inviter", ["inviterId"])
    .index("by_invitee", ["inviteeId"])
    .index("by_idea_status", ["ideaId", "status"])
    .index("by_invitee_status", ["inviteeId", "status"])
    .index("by_created_at", ["createdAt"]),

  // Conversation Members table - tracks membership in group chats
  conversationMembers: defineTable({
    conversationId: v.id("conversations"), // Reference to conversations
    userId: v.id("users"), // Reference to users
    role: v.optional(v.string()), // 'admin' or 'member'
    joinedAt: v.number(), // Unix timestamp
  })
    .index("by_user", ["userId"])
    .index("by_conversation", ["conversationId"])
    .index("by_user_conversation", ["userId", "conversationId"]),

  // --- Gamification Tables ---

  // User Wallets (Points/Coins)
  wallets: defineTable({
    userId: v.id("users"),
    balance: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_balance", ["balance"]),

  // Transactions History
  transactions: defineTable({
    walletId: v.id("wallets"),
    amount: v.number(),
    type: v.string(), // 'daily_login', 'create_idea', 'spark_idea', etc.
    description: v.string(),
    relatedId: v.optional(v.string()), // ID of related entity (idea, etc.)
    createdAt: v.number(),
  })
    .index("by_wallet", ["walletId"])
    .index("by_type", ["type"])
    .index("by_created_at", ["createdAt"]),

  // User Streaks
  userStreaks: defineTable({
    userId: v.id("users"),
    currentStreak: v.number(),
    longestStreak: v.number(),
    lastLoginDate: v.string(), // ISO date string "YYYY-MM-DD" (legacy)
    lastStreakUpdate: v.number(),
    recoveryAvailable: v.optional(v.boolean()),
    // Streak v2 — action-based, not login-based (PRD §9)
    lastActionDate: v.optional(v.string()), // ISO "YYYY-MM-DD" in user's local TZ
    lastActionType: v.optional(
      v.union(
        // PRD §9 qualifying actions (kept narrow per §9.2).
        v.literal("made_contribution"),
        v.literal("submitted_task"),
        v.literal("fired_flare"),
        v.literal("responded_to_flare"),
        // Legacy action types — never written by v2 but accepted for
        // backward compatibility with rows persisted before §9 landed.
        // Once the data is migrated, these can be dropped.
        v.literal("sparked_idea"),
        v.literal("posted_idea"),
        v.literal("commented"),
        v.literal("completed_checkpoint"),
        v.literal("won_combat"),
      ),
    ),
    // PRD §9 AC4 — user's IANA timezone, e.g. "America/New_York".
    // Persisted by `streaks.setMyTimezone` and read by `recordAction`.
    timezone: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  // Badges Definitions
  badges: defineTable({
    slug: v.string(), // Unique identifier e.g. "first-idea"
    name: v.string(),
    description: v.string(),
    icon: v.string(), // Icon name
    category: v.string(), // 'creation', 'social', etc.
    criteria: v.any(), // Flexible criteria object
  }).index("by_slug", ["slug"]),

  // User Badges (Earned)
  userBadges: defineTable({
    userId: v.id("users"),
    badgeId: v.id("badges"),
    awardedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_badge", ["userId", "badgeId"]),

  // ─────────────────────────────────────────────────────────────
  // Daily challenges — user gets 3 challenges per local day, rotated
  // deterministically by day-of-week so everyone on the same day sees
  // the same set. Progress increments live on qualifying actions;
  // claim mutation grants XP + points once all three complete.
  //
  // Fills gap #6 in the gamification audit ("no daily challenges,
  // engagement loop is thin").
  // ─────────────────────────────────────────────────────────────
  dailyChallenges: defineTable({
    userId: v.id("users"),
    // Local YYYY-MM-DD in the user's timezone (matches userStreaks).
    dateKey: v.string(),
    // The three challenges for this day, denormalised so progress
    // reads/writes are one document patch instead of joins.
    challenges: v.array(
      v.object({
        id: v.string(),                    // stable template id
        label: v.string(),                 // display label
        actionType: v.string(),            // "submit_task" | "fire_flare" | etc.
        target: v.number(),                // e.g. 3
        progress: v.number(),              // current count
        xpReward: v.number(),              // per-challenge XP
      }),
    ),
    // Whether the "all three complete" bonus has been claimed.
    claimedAt: v.optional(v.number()),
    // Timestamp of last progress update (for debugging + cleanup).
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "dateKey"]),

  // User Skill Progress (per Idea/Skill)
  userSkillProgress: defineTable({
    userId: v.id("users"),
    ideaId: v.id("ideas"),
    skill: v.string(),
    contributionsCount: v.number(),
    tasksCompletedCount: v.number(),
    meetingsHostedCount: v.number(),
    updatedAt: v.number(),
  }).index("by_user_idea_skill", ["userId", "ideaId", "skill"]),

  // User Skill Badges (Earned per Idea/Skill)
  userSkillBadges: defineTable({
    userId: v.id("users"),
    ideaId: v.id("ideas"),
    skill: v.string(),
    badgeLeveL: v.number(), // 1=Bronze, 2=Silver, 3=Gold, 4=Platinum
    awardedAt: v.number(),
  })
    .index("by_user_idea_skill", ["userId", "ideaId", "skill"])
    .index("by_user_skill", ["userId", "skill"]),

  // User Skill Levels (Aggregate)
  userSkillLevels: defineTable({
    userId: v.id("users"),
    skill: v.string(),
    level: v.number(),
    badgeCount: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_skill", ["userId", "skill"]),

  // Meetings Table
  meetings: defineTable({
    ideaId: v.id("ideas"),
    organizerId: v.optional(v.id("users")), // Made optional for legacy data
    title: v.string(),
    description: v.optional(v.string()),
    scheduledAt: v.optional(v.number()), // Made optional
    status: v.optional(v.string()), // Made optional
    attendees: v.array(v.id("users")),
    meetingLink: v.optional(v.string()),
    createdAt: v.number(),

    // Legacy fields found in existing data
    createdBy: v.optional(v.string()),
    date: v.optional(v.number()),
  })
    .index("by_organizer", ["organizerId"])
    .index("by_idea", ["ideaId"]),

  // Daily Leaderboard Winners
  dailyLeaderboardWinners: defineTable({
    date: v.string(), // YYYY-MM-DD
    userId: v.id("users"),
    rank: v.number(),
    points: v.number(),
    awardedAt: v.number(),
  }).index("by_user", ["userId"]),

  // ─────────────────────────────────────────────────────────────────────────
  // VENTURE PROGRESSION SYSTEM
  // ─────────────────────────────────────────────────────────────────────────

  // Ventures — wraps an existing idea with stage-progression tracking
  // Supports all four templates: venture | academic | lab | creative
  ventures: defineTable({
    ideaId: v.id("ideas"),
    userId: v.id("users"),
    // Template driving this venture's stages, monsters, and metric
    // Defaults to "venture" for all legacy rows
    templateId: v.optional(v.union(
      v.literal("venture"),
      v.literal("academic"),
      v.literal("lab"),
      v.literal("creative"),
    )),
    personaGender: v.optional(v.union(v.literal("male"), v.literal("female"))), // Legacy — kept for back-compat
    // PRD § 3.1 — 10 named personas selected per venture. Drives which
    // painted sprite renders as the world-map avatar. New ventures
    // populate this; legacy ventures fall back to personaGender via
    // legacyGenderToPersonaId in src/config/personas.ts.
    personaId: v.optional(
      v.union(
        v.literal("arcanist"),
        v.literal("ranger"),
        v.literal("alchemist"),
        v.literal("artisan"),
        v.literal("drifter"),
        v.literal("oracle"),
        v.literal("engineer"),
        v.literal("healer"),
        v.literal("pathfinder"),
        v.literal("sage"),
      ),
    ),
    // PRD § 9.2 — treasure chest reward state. Optional so legacy
    // ventures aren't broken by the schema migration.
    freeFlareCredits: v.optional(v.number()),
    corruptionShieldExpiresAt: v.optional(v.number()),
    currentStage: v.number(), // 1-N (varies by template: Venture=8, Academic=6, Lab=7, Creative=6)
    currentCheckpoint: v.number(), // 1-N within current stage
    corruptionLevel: v.optional(v.number()), // Backward-compatible for legacy venture rows
    lastActivityAt: v.optional(v.number()), // Backward-compatible for legacy venture rows
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("archived"),
    ),
    assignedBosses: v.array(v.number()), // boss IDs 1-12
    skills: v.optional(v.array(v.string())), // Selected skill tags (max 5)
    industries: v.optional(v.array(v.string())), // Selected industry tags (max 4)
    // Legacy field — pre-schema-refactor code recorded which stages the
    // user had "previewed" (the finale pan choreography). Nothing writes
    // this now, but existing prod rows carry it, so it must be declared
    // optional here for schema validation to pass on `convex dev`.
    previewedStages: v.optional(v.array(v.number())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_idea", ["ideaId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_user_status", ["userId", "status"]),

  // Venture checkpoints — tracks completion per checkpoint within a stage
  ventureCheckpoints: defineTable({
    ventureId: v.id("ventures"),
    stage: v.number(), // 1-8
    checkpoint: v.number(), // 1-N within stage
    status: v.union(
      v.literal("not_started"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("skipped"),
    ),
    t1Completed: v.boolean(),
    t2Completed: v.boolean(),
    t3Completed: v.boolean(),
    goldBonusEarned: v.boolean(),
    partialStartedAt: v.optional(v.number()),
    partialDecayAppliedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  })
    .index("by_venture", ["ventureId"])
    .index("by_venture_stage", ["ventureId", "stage"])
    .index("by_venture_status", ["ventureId", "status"]),

  // Venture tasks — individual T1/T2/T3 task tracking
  ventureTasks: defineTable({
    checkpointId: v.id("ventureCheckpoints"),
    // Denormalised venture reference so getWorldMapData can pull every
    // task for a venture in one indexed query instead of fanning out 24-36
    // `by_checkpoint` collects. Optional for back-compat; ensureVenture-
    // Structure backfills it when the owner opens the map.
    ventureId: v.optional(v.id("ventures")),
    taskLevel: v.union(v.literal("t1"), v.literal("t2"), v.literal("t3")),
    toolType: v.union(
      v.literal("write"),
      v.literal("table"),
      v.literal("map"),
      v.literal("survey"),
      v.literal("poll"),
      v.literal("link"),
      v.literal("upload"),
      // Legacy database value only. Do not add this back to TOOL_TYPES;
      // existing rows may still contain "oauth" and must validate until migrated.
      v.literal("oauth"),
      v.literal("self_report"),
      v.literal("journal"),
      v.literal("kanban"),
      v.literal("calendar"),
    ),
    status: v.union(
      v.literal("not_started"),
      v.literal("in_progress"),
      v.literal("completed"),
    ),
    evidenceId: v.optional(v.id("ventureEvidence")),
    completedAt: v.optional(v.number()),
  })
    .index("by_checkpoint", ["checkpointId"])
    .index("by_checkpoint_level", ["checkpointId", "taskLevel"])
    .index("by_venture", ["ventureId"]),

  // Venture evidence — user-submitted proof of task completion
  ventureEvidence: defineTable({
    taskId: v.id("ventureTasks"),
    userId: v.id("users"),
    toolType: v.string(),
    content: v.any(), // Tool-specific evidence structure
    storageId: v.optional(v.id("_storage")), // For file uploads
    createdAt: v.number(),
  })
    .index("by_task", ["taskId"])
    .index("by_user", ["userId"]),

  // Venture bosses — tracks boss encounters per venture
  ventureBosses: defineTable({
    ventureId: v.id("ventures"),
    bossId: v.number(), // 1-12
    status: v.union(
      v.literal("active"),
      v.literal("retreated"),
      v.literal("slain"),
    ),
    corruptionLevel: v.number(), // 0-100
    bossSpecificCounters: v.any(), // Boss-specific tracking data
    assignedAt: v.number(),
    defeatedAt: v.optional(v.number()),
  })
    .index("by_venture", ["ventureId"])
    .index("by_venture_status", ["ventureId", "status"]),

  // Venture tools — stores JSON blobs for generic world-map tools (Kanban, Calendar, etc.)
  ventureTools: defineTable({
    ventureId: v.id("ventures"),
    toolType: v.string(), // "kanban", "calendar", etc.
    data: v.any(), // Tool-specific JSON state
    updatedAt: v.number(),
  })
    .index("by_venture", ["ventureId"])
    .index("by_venture_tool", ["ventureId", "toolType"]),

  // ─────────────────────────────────────────────────────────────────────────
  // LEVEL PROGRESSION SYSTEM
  // ─────────────────────────────────────────────────────────────────────────

  // User level progression tracking
  userLevels: defineTable({
    userId: v.id("users"),
    currentLevel: v.number(), // 1-50
    titlePoints: v.number(), // Points toward next level
    totalPoints: v.number(), // All-time points earned
    goldCheckpoints: v.number(), // Total gold checkpoints earned
    fullLifecycles: v.number(), // Stage 1→8 completions
    helpfulFlareResponses: v.number(),
    flaresResolved: v.number(),
    menteesCount: v.number(),
    menteeCheckpointAdvances: v.number(),
    menteeLevelAchievements: v.number(),
    ideasLaunched: v.number(),
    ideasScaled: v.number(),
    collaboratorsRecruited: v.number(),
    collaboratorsJoined: v.number(),
    commentsCount: v.number(),
    upvotedCommentsCount: v.number(),
    ideasCreated: v.number(),
    ideasWithStage6: v.number(),
    ideasWithStage8: v.number(),
    activeIdeaTypes: v.array(v.string()),
    updatedAt: v.number(),
    // Leagues v1 — 5-tier weekly individual ladder
    currentLeagueTier: v.optional(
      v.union(
        v.literal("bronze"),
        v.literal("silver"),
        v.literal("gold"),
        v.literal("platinum"),
        v.literal("diamond"),
      ),
    ),
    weeklyLeagueXp: v.optional(v.number()),
    lastLeagueResetAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_level", ["currentLevel"])
    .index("by_total_points", ["totalPoints"])
    .index("by_league_tier_xp", ["currentLeagueTier", "weeklyLeagueXp"]),

  // ─────────────────────────────────────────────────────────────────────────
  // FLARE SYSTEM (Help Requests)
  // ─────────────────────────────────────────────────────────────────────────

  // Flares — help requests fired by users
  flares: defineTable({
    userId: v.id("users"), // Who fired the flare
    ventureId: v.optional(v.id("ventures")),
    checkpointId: v.optional(v.id("ventureCheckpoints")),
    description: v.string(), // What they need help with
    // Free-text expertise tag — what field/skill the helper should
    // have (e.g. "marketing", "react", "fundraising"). Optional so
    // legacy flares fired before this column existed don't break.
    expertiseTag: v.optional(v.string()),
    status: v.union(
      v.literal("open"),
      v.literal("resolved"),
      v.literal("closed"),
      v.literal("expired"),
    ),
    createdAt: v.number(),
    // Auto-expiry timestamp — set to createdAt + 7 days when fired.
    // A daily cron moves status="open" flares with expiresAt < now
    // to status="expired" so the feed stays clean.
    expiresAt: v.optional(v.number()),
    resolvedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_status_created", ["status", "createdAt"])
    .index("by_status_expires", ["status", "expiresAt"])
    .index("by_venture", ["ventureId"]),

  // Flare responses — community responses to flares
  flareResponses: defineTable({
    flareId: v.id("flares"),
    userId: v.id("users"), // Who responded
    content: v.string(),
    isHelpful: v.optional(v.boolean()), // Marked by flare sender
    createdAt: v.number(),
  })
    .index("by_flare", ["flareId"])
    .index("by_user", ["userId"])
    .index("by_flare_created", ["flareId", "createdAt"]),

  // ─────────────────────────────────────────────────────────────────────────
  // MENTORSHIP SYSTEM
  // ─────────────────────────────────────────────────────────────────────────

  // Mentorships — mentor-mentee relationships
  mentorships: defineTable({
    mentorId: v.id("users"),
    menteeId: v.id("users"),
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("ended"),
    ),
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
  })
    .index("by_mentor", ["mentorId"])
    .index("by_mentee", ["menteeId"])
    .index("by_mentor_status", ["mentorId", "status"])
    .index("by_mentee_status", ["menteeId", "status"]),

  // ─────────────────────────────────────────────────────────────────────────
  // BADGE SYSTEM (Extended — 62 badges)
  // ─────────────────────────────────────────────────────────────────────────

  // Venture badges — tracks which badges a user has earned (extends existing userBadges)
  ventureBadges: defineTable({
    userId: v.id("users"),
    badgeId: v.number(), // 1-62 (references BADGE_DEFINITIONS)
    awardedAt: v.number(),
    isHidden: v.boolean(), // Hidden until earned
    metadata: v.any(), // Context for award
  })
    .index("by_user", ["userId"])
    .index("by_user_badge", ["userId", "badgeId"])
    .index("by_badge", ["badgeId"]),

  // Badge evaluation tracking — avoids re-evaluating everything
  badgeEvaluations: defineTable({
    badgeId: v.number(), // 1-62
    userId: v.id("users"),
    condition: v.string(), // Condition being tracked
    lastChecked: v.number(),
    isAwarded: v.boolean(),
    awardedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_badge", ["userId", "badgeId"])
    .index("by_awarded", ["isAwarded"]),

  // ─────────────────────────────────────────────────────────────────────────
  // RE-ENGAGEMENT EMAIL TRACKING
  // ─────────────────────────────────────────────────────────────────────────

  // Tracks every re-engagement email dispatched so the cron can stagger sends,
  // enforce the 14-day resend window, and ensure the farewell email fires exactly once.
  //
  // type "reengagement" — standard re-engagement email (subject to 14-day stagger)
  // type "farewell"     — one-time goodbye email sent when user crosses the churn threshold;
  //                       after this the user is permanently excluded from all email runs.
  reengagementLog: defineTable({
    userId: v.id("users"),
    sentAt: v.number(),
    type: v.union(v.literal("reengagement"), v.literal("farewell")),
  })
    .index("by_user", ["userId"])
    .index("by_sent_at", ["sentAt"])
    // Compound index: supports q.eq("userId", id).eq("type", t) → order("desc") → .first()
    .index("by_user_type_sent", ["userId", "type", "sentAt"]),

  // AI QUALITY SCORING  (Week 4 — Day 18)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Per-stage aggregate quality score for a venture.
   * Updated each time a task submission is evaluated by the AI scorer.
   */
  qualityScores: defineTable({
    ventureId: v.id("ventures"),
    stageNumber: v.number(), // 1–N
    completeness: v.number(), // 0–3
    specificity: v.number(), // 0–3
    evidence: v.number(), // 0–3
    originality: v.number(), // 0–3
    totalScore: v.number(), // 0–12
    qualityTier: v.string(), // "low" | "standard" | "high"
    valuationScore: v.number(), // template metric value (₹ for venture, JIF for academic, p for lab, fans for creative)
    // Template-aware fields (optional for backward compatibility)
    templateId: v.optional(v.string()), // "venture" | "academic" | "lab" | "creative"
    metricDirection: v.optional(v.union(
      v.literal("higher_is_better"),
      v.literal("lower_is_better"),
    )),
    evaluatedAt: v.number(), // timestamp
  })
    .index("by_venture", ["ventureId"])
    .index("by_venture_stage", ["ventureId", "stageNumber"]),

  /**
   * Individual task-level AI evaluation record.
   * One row per task submission that has been scored.
   */
  aiEvaluations: defineTable({
    taskId: v.id("ventureTasks"),
    checkpointId: v.id("ventureCheckpoints"),
    content: v.string(), // submitted text content
    completeness: v.number(), // 0–3
    specificity: v.number(), // 0–3
    evidence: v.number(), // 0–3
    originality: v.number(), // 0–3
    totalScore: v.number(), // 0–12
    feedback: v.optional(v.string()), // AI-generated feedback text
    modelUsed: v.string(), // e.g. "gpt-4o" | "llama-3" | "mock"
    // Template-aware fields (optional for backward compatibility)
    templateId: v.optional(v.string()), // "venture" | "academic" | "lab" | "creative"
    dimension1Label: v.optional(v.string()), // First scoring dimension label
    dimension2Label: v.optional(v.string()), // Second scoring dimension label
    dimension3Label: v.optional(v.string()), // Third scoring dimension label
    dimension4Label: v.optional(v.string()), // Fourth scoring dimension label
    evaluatedAt: v.number(),
  })
    .index("by_task", ["taskId"])
    .index("by_checkpoint", ["checkpointId"]),

  // ─────────────────────────────────────────────────────────────────────────
  // FEATURE FLAGS  (Week 4 — Day 20)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Feature flags for phased rollout.
   * All new V1 features are gated behind flags until 100% rollout.
   *
   * V1 flags:
   *   phaser_world_map | ai_quality_scoring | persona_system | audio_system
   */
  featureFlags: defineTable({
    flag: v.string(), // unique flag name
    enabled: v.boolean(), // global on/off
    rolloutPercentage: v.number(), // 0–100 (percentage of users)
    enabledForUsers: v.array(v.id("users")), // explicit user overrides
    description: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_flag", ["flag"]),

  // ─────────────────────────────────────────────────────────────────────────
  // INTER-CHECKPOINT GAMEPLAY  (Phase 10)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Tracks inter-checkpoint event outcomes per venture/stage/checkpoint.
   * Events: henchman encounter, treasure chest, corruption shield, insight fragment.
   * All template-agnostic — the monster name is stored per-row.
   */
  interCheckpointStates: defineTable({
    ventureId: v.id("ventures"),
    stage: v.number(),
    checkpoint: v.number(),
    // Henchman encounter
    henchmanOutcome: v.optional(v.union(
      v.literal("victory"),
      v.literal("retreat"),
      v.literal("skipped"),
    )),
    henchmanName: v.optional(v.string()),
    henchmanVictories: v.optional(v.number()),
    // Treasure chest
    treasuresFound: v.optional(v.number()),
    // Corruption shields
    shieldsEarned: v.optional(v.number()),
    shieldsUsed: v.optional(v.number()),
    // Insight fragments
    insightFragments: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_venture", ["ventureId"])
    .index("by_venture_stage_cp", ["ventureId", "stage", "checkpoint"]),
  combatRounds: defineTable({
    userId: v.id("users"),
    ventureId: v.id("ventures"),
    checkpointId: v.id("ventureCheckpoints"),
    tier: v.union(v.literal("free"), v.literal("pro")),
    totalQuestions: v.number(),
    bossHpInitial: v.number(),
    playerHpInitial: v.number(),
    bossHpCurrent: v.number(),
    playerHpCurrent: v.number(),
    attemptNumber: v.number(),
    status: v.union(
      v.literal("active"),
      v.literal("won"),
      v.literal("lost"),
      v.literal("abandoned"),
      v.literal("cap_exhausted"),
    ),
    outcomeScore: v.optional(v.number()),
    individualPointsAwarded: v.optional(v.number()),
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
    monthBucket: v.string(),
  })
    .index("by_user_month", ["userId", "monthBucket"])
    .index("by_user_checkpoint", ["userId", "checkpointId"])
    .index("by_user_status", ["userId", "status"]),

  combatQuestions: defineTable({
    roundId: v.id("combatRounds"),
    userId: v.id("users"),
    order: v.number(),
    prompt: v.string(),
    normalizedPrompt: v.string(),
    persona: v.union(v.literal("villain"), v.literal("mentor")),
    complexityTier: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    durationMs: v.number(),
    answer: v.optional(v.string()),
    answerStartedAt: v.optional(v.number()),
    answerSubmittedAt: v.optional(v.number()),
    score1to5: v.optional(v.number()),
    bossHpAfter: v.optional(v.number()),
    playerHpAfter: v.optional(v.number()),
    aiDetectionConfidence: v.optional(v.number()),
    aiDetectionSignals: v.optional(v.array(v.string())),
    expiredFlag: v.optional(v.boolean()),
  })
    .index("by_round_order", ["roundId", "order"])
    .index("by_user_normalized", ["userId", "normalizedPrompt"]),

  combatAiSuspicions: defineTable({
    userId: v.id("users"),
    // roundId + questionId only present for combat-sourced strikes.
    // Henchman / task / other sources omit them.
    roundId: v.optional(v.id("combatRounds")),
    questionId: v.optional(v.id("combatQuestions")),
    confidence: v.number(),
    signals: v.array(v.string()),
    detectedAt: v.number(),
    action: v.union(v.literal("warning"), v.literal("ban")),
    // Where the strike came from — used to give support context
    // when reviewing suspensions.
    source: v.optional(
      v.union(
        v.literal("combat"),
        v.literal("henchman_encounter"),
        v.literal("task_submission"),
      ),
    ),
    textSample: v.optional(v.string()),
  })
    .index("by_user_detected", ["userId", "detectedAt"])
    .index("by_user", ["userId"]),

  userAccountSuspensions: defineTable({
    userId: v.id("users"),
    reason: v.string(),
    scope: v.union(v.literal("game"), v.literal("account")),
    isPermanent: v.boolean(),
    banStartAt: v.number(),
    banEndAt: v.number(),
    evidenceRoundId: v.optional(v.id("combatRounds")),
  }).index("by_user_active", ["userId", "banEndAt"]),

  leagueWeeklyHistory: defineTable({
    userId: v.id("users"),
    weekStartAt: v.number(),
    tier: v.union(
      v.literal("bronze"),
      v.literal("silver"),
      v.literal("gold"),
      v.literal("platinum"),
      v.literal("diamond"),
    ),
    rankInTier: v.number(),
    weeklyXp: v.number(),
    outcome: v.union(
      v.literal("promoted"),
      v.literal("relegated"),
      v.literal("held"),
    ),
    nextTier: v.union(
      v.literal("bronze"),
      v.literal("silver"),
      v.literal("gold"),
      v.literal("platinum"),
      v.literal("diamond"),
    ),
  })
    .index("by_user_week", ["userId", "weekStartAt"])
    .index("by_week_tier", ["weekStartAt", "tier"]),

  /**
   * PRD §4 — Team (project) league. One row per (idea, point-source
   * event). The Team-board query sums points where
   * `awardedAt >= now - 7d` to produce the trailing-7-day score (AC5).
   *
   * Kept as an append-only ledger so the score is reconstructable
   * even if the rolling sum drifts. Old rows can be GC'd after a
   * comfortable retention window — they don't affect the 7-day
   * computation.
   */
  projectWeeklyPoints: defineTable({
    ideaId: v.id("ideas"),
    /** The user whose action attributed the points (e.g. contributor). */
    contributorId: v.optional(v.id("users")),
    amount: v.number(),
    awardedAt: v.number(),
    /**
     * Free-text reason for the award. Mirrors the
     * `gamification.internalAwardPoints.description` convention so
     * Team-board grants are visible in the same ledger format as
     * individual XP.
     */
    reason: v.string(),
  })
    .index("by_idea_awarded", ["ideaId", "awardedAt"])
    .index("by_awarded", ["awardedAt"]),

  miniGameSessions: defineTable({
    userId: v.id("users"),
    spawnPointId: v.string(),
    archetype: v.union(
      v.literal("pattern_match"),
      v.literal("reflex_tap"),
      v.literal("decrypt"),
    ),
    difficulty: v.union(
      v.literal(1), v.literal(2), v.literal(3), v.literal(4), v.literal(5),
    ),
    ventureId: v.optional(v.id("ventures")),
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("abandoned"),
    ),
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
    scoreNormalized: v.optional(v.number()),
    integrityFlagged: v.optional(v.boolean()),
    integrityFlagReason: v.optional(v.string()),
  })
    .index("by_user_started", ["userId", "startedAt"])
    .index("by_user_active", ["userId", "status"]),

  miniGameCompletions: defineTable({
    userId: v.id("users"),
    spawnPointId: v.string(),
    sessionId: v.id("miniGameSessions"),
    completedAt: v.number(),
    xpAwarded: v.number(),
  })
    .index("by_user_spawn", ["userId", "spawnPointId"])
    .index("by_user_completed", ["userId", "completedAt"]),

  videos: defineTable({
    uploaderId: v.id("users"),
    // ── Provider abstraction (PRD §5.3) ────────────────────────────
    // v1: "convex" = raw bytes in Convex storage (v0 / dev path).
    //     "mux"    = Mux managed service (target / prod).
    //     "cloudflare" = Cloudflare Stream (alternative managed service).
    // The platform stores ONLY metadata + a playback identifier from the
    // managed provider; raw bytes never sit on app infra in prod.
    provider: v.optional(
      v.union(
        v.literal("convex"),
        v.literal("mux"),
        v.literal("cloudflare"),
      ),
    ),
    // Convex storage path (v0)
    storageId: v.optional(v.id("_storage")),
    posterStorageId: v.optional(v.id("_storage")),
    // Managed-service path (Mux / Cloudflare Stream)
    playbackId: v.optional(v.string()), // Mux playback id / Cloudflare uid
    playbackUrl: v.optional(v.string()), // HLS .m3u8 URL
    thumbnailUrl: v.optional(v.string()), // Service-generated poster
    // Service-reported processing state — "ready" before the player
    // can stream. PRD §5.4: card shows processing state until ready.
    processingStatus: v.optional(
      v.union(
        v.literal("uploading"),
        v.literal("processing"),
        v.literal("ready"),
        v.literal("errored"),
      ),
    ),
    // ── Common metadata ────────────────────────────────────────────
    durationMs: v.number(),
    width: v.number(),
    height: v.number(),
    mimeType: v.string(),
    bytes: v.number(),
    caption: v.optional(v.string()),
    ideaId: v.optional(v.id("ideas")),
    ventureId: v.optional(v.id("ventures")),
    visibility: v.union(v.literal("public"), v.literal("unlisted")),
    isDeleted: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_uploader_created", ["uploaderId", "createdAt"])
    .index("by_visibility_created", ["visibility", "createdAt"]),
});