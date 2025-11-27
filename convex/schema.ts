import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

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
    completedOnboarding: v.boolean(), // Onboarding status
    isActive: v.optional(v.boolean()), // Account status for user management
    role: v.optional(v.string()), // User role (user, moderator, admin)
    followersCount: v.optional(v.number()), // Number of followers
    followingCount: v.optional(v.number()), // Number of users followed
    lastLoginAt: v.optional(v.number()), // Last login timestamp
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
    attachments: v.optional(v.array(v.object({
      name: v.string(),
      type: v.string(),
      size: v.number(),
      url: v.string(),
      fileId: v.string(), // Convex storage ID
    }))),
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
  })
    .index("by_user", ["userId"])
    .index("by_idea", ["ideaId"])
    .index("by_user_idea", ["userId", "ideaId"]),

  // Contribution requests table
  contributionRequests: defineTable({
    ideaId: v.id("ideas"),
    contributorId: v.id("users"),
    authorId: v.id("users"),
    message: v.string(),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("rejected")),
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
    status: v.union(v.literal("todo"), v.literal("in_progress"), v.literal("done")), // Status of the todo
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
    content: v.string(), // Message content
    createdAt: v.number(), // Unix timestamp
    read: v.boolean(), // Read status
    conversationId: v.id("conversations"), // Reference to conversations table
    messageType: v.optional(v.string()), // Message type (e.g., 'text', 'image')
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
    relatedId: v.optional(v.union(v.id("ideas"), v.id("comments"), v.id("contributionRequests"), v.id("todos"), v.id("invitations"))), // ID of related item
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
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("rejected"), v.literal("cancelled")), // Invitation status
    message: v.optional(v.string()), // Optional invitation message
    createdAt: v.number(), // Unix timestamp
    updatedAt: v.number(), // Unix timestamp
  })
    .index("by_idea", ["ideaId"])
    .index("by_inviter", ["inviterId"])
    .index("by_invitee", ["inviteeId"])
    .index("by_idea_status", ["ideaId", "status"])
    .index("by_invitee_status", ["inviteeId", "status"])
    .index("by_created_at", ["createdAt"])
})