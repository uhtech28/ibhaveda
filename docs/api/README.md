# API Documentation

## 🎯 Overview

The Interactive Ideas Platform API is built with Convex, providing real-time queries and mutations for seamless client-server communication. This documentation covers all backend functions, database operations, and integration points.

## 📋 API Structure

### Convex Functions Organization

```
convex/
├── queries/           # Read operations
│   ├── ideas.ts      # Idea-related queries
│   ├── users.ts      # User-related queries
│   ├── notifications.ts
│   └── search.ts     # Search operations
├── mutations/        # Write operations
│   ├── ideas.ts      # Idea CRUD operations
│   ├── users.ts      # User profile updates
│   ├── collaboration.ts # Collaboration features
│   └── notifications.ts
├── auth.config.ts    # Authentication configuration
└── schema.ts         # Database schema definition
```

## 🔍 Query Functions

### Ideas Queries

#### `getAllIdeas`
**Purpose**: Fetch all public ideas with optional filtering.

**Parameters**:
```typescript
{
  userId?: string        // Filter by author
  category?: string      // Filter by category
  limit?: number        // Pagination limit (default: 20)
  cursor?: string       // Pagination cursor
}
```

**Returns**:
```typescript
{
  ideas: Idea[]
  nextCursor?: string
  hasMore: boolean
}
```

**Implementation**:
```typescript
export const getAllIdeas = query({
  args: {
    userId: v.optional(v.string()),
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20

    let query = ctx.db.query("ideas")
      .withIndex("by_visibility", (q) => q.eq("visibility", "public"))

    if (args.userId) {
      query = query.filter((idea) => idea.authorId === args.userId)
    }

    if (args.category) {
      query = query.filter((idea) => idea.category === args.category)
    }

    return await query
      .order("createdAt", "desc")
      .paginate({ numItems: limit, cursor: args.cursor })
  }
})
```

#### `getIdeaById`
**Purpose**: Fetch a single idea with full details.

**Parameters**:
```typescript
{
  ideaId: string
}
```

**Returns**:
```typescript
{
  idea: Idea
  author: User
  sparks: number
  comments: Comment[]
  collaborators: User[]
  isSparked: boolean     // Whether current user sparked it
  canEdit: boolean       // Whether current user can edit
}
```

### User Queries

#### `getCurrentUser`
**Purpose**: Get authenticated user profile.

**Parameters**: None

**Returns**:
```typescript
{
  user: User
  stats: {
    ideasCount: number
    sparksCount: number
    followersCount: number
    followingCount: number
  }
}
```

#### `getUserProfile`
**Purpose**: Get user profile for display.

**Parameters**:
```typescript
{
  username: string
}
```

**Returns**:
```typescript
{
  user: User
  ideas: Idea[]
  isFollowing: boolean
  canFollow: boolean
}
```

### Search Queries

#### `searchIdeas`
**Purpose**: Full-text search across ideas.

**Parameters**:
```typescript
{
  query: string
  filters: {
    category?: string[]
    industries?: string[]
    visibility?: 'public' | 'private'
    dateRange?: {
      start: number
      end: number
    }
  }
  sort: {
    field: 'relevance' | 'createdAt' | 'popularity'
    order: 'asc' | 'desc'
  }
  pagination: {
    page: number
    limit: number
  }
}
```

**Returns**:
```typescript
{
  results: Idea[]
  total: number
  facets: {
    categories: { name: string; count: number }[]
    industries: { name: string; count: number }[]
  }
}
```

## ✏️ Mutation Functions

### Idea Mutations

#### `createIdea`
**Purpose**: Create a new idea.

**Parameters**:
```typescript
{
  title: string
  description: string
  category: string
  industries?: string[]
  visibility: 'public' | 'private'
  attachments?: FileAttachment[]
}
```

**Returns**:
```typescript
{
  ideaId: string
}
```

**Implementation**:
```typescript
export const createIdea = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.string(),
    industries: v.optional(v.array(v.string())),
    visibility: v.string(),
    attachments: v.optional(v.array(v.object({
      name: v.string(),
      type: v.string(),
      size: v.number(),
      url: v.string(),
      fileId: v.string()
    })))
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx)

    const ideaId = await ctx.db.insert("ideas", {
      authorId: userId,
      title: args.title,
      description: args.description,
      category: args.category,
      industries: args.industries?.join(','),
      visibility: args.visibility,
      attachments: args.attachments,
      sparkCount: 0,
      commentCount: 0,
      contributionRequestCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    })

    // Create notification for followers
    await createNotification(ctx, {
      type: 'new_idea',
      recipientIds: await getUserFollowers(ctx, userId),
      relatedId: ideaId,
      message: `${await getUserDisplayName(ctx, userId)} created a new idea: ${args.title}`
    })

    return { ideaId }
  }
})
```

#### `updateIdea`
**Purpose**: Update an existing idea.

**Parameters**:
```typescript
{
  ideaId: string
  updates: Partial<{
    title: string
    description: string
    category: string
    industries: string[]
    visibility: 'public' | 'private'
  }>
}
```

#### `deleteIdea`
**Purpose**: Soft delete an idea.

**Parameters**:
```typescript
{
  ideaId: string
}
```

### Collaboration Mutations

#### `requestContribution`
**Purpose**: Send contribution request to idea author.

**Parameters**:
```typescript
{
  ideaId: string
  message: string
}
```

**Returns**:
```typescript
{
  requestId: string
}
```

#### `respondToContributionRequest`
**Purpose**: Accept or reject contribution request.

**Parameters**:
```typescript
{
  requestId: string
  action: 'accept' | 'reject'
}
```

### Notification Mutations

#### `markNotificationRead`
**Purpose**: Mark notification as read.

**Parameters**:
```typescript
{
  notificationId: string
}
```

#### `markAllNotificationsRead`
**Purpose**: Mark all user notifications as read.

**Parameters**: None

## 💬 Real-time Subscriptions

### Idea Subscriptions

#### `subscribeToIdea`
**Purpose**: Subscribe to real-time idea updates.

**Parameters**:
```typescript
{
  ideaId: string
}
```

**Updates**:
- Spark count changes
- New comments
- Status updates
- Collaborator changes

### User Subscriptions

#### `subscribeToNotifications`
**Purpose**: Subscribe to new notifications.

**Parameters**: None

**Updates**:
- New notifications
- Notification status changes

### Collaboration Subscriptions

#### `subscribeToContributionRequests`
**Purpose**: Subscribe to contribution request updates.

**Parameters**:
```typescript
{
  ideaId?: string  // Optional: filter by idea
}
```

## 🔐 Authentication & Authorization

### Auth Configuration

**File**: `convex/auth.config.ts`

```typescript
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ]
}
```

### Permission Checks

**Helper Functions**:
```typescript
// Check if user can edit idea
export const canEditIdea = async (ctx: QueryCtx, ideaId: string) => {
  const userId = await getCurrentUserId(ctx)
  const idea = await ctx.db.get(ideaId)

  return idea.authorId === userId || await isCollaborator(ctx, ideaId, userId)
}

// Check if user can view private idea
export const canViewIdea = async (ctx: QueryCtx, idea: Idea) => {
  if (idea.visibility === 'public') return true

  const userId = await getCurrentUserId(ctx)
  return idea.authorId === userId || await isCollaborator(ctx, idea.id, userId)
}
```

## 📊 Database Schema

### Core Tables

#### Ideas Table
```typescript
{
  _id: string
  authorId: string
  title: string
  description: string
  category: string
  industries?: string
  visibility: 'public' | 'private'
  attachments?: FileAttachment[]
  sparkCount: number
  commentCount: number
  contributionRequestCount: number
  createdAt: number
  updatedAt: number
  isDeleted?: boolean
  parentId?: string
}
```

#### Users Table
```typescript
{
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
  skills?: string[]
  industry?: string
  completedOnboarding: boolean
  isActive?: boolean
  role?: string
  followersCount?: number
  followingCount?: number
  lastLoginAt?: number
  createdAt: number
  updatedAt: number
}
```

## 🚨 Error Handling

### Error Types

**Validation Errors**:
```typescript
throw new ConvexError({
  code: 'VALIDATION_ERROR',
  message: 'Title must be between 5 and 200 characters'
})
```

**Permission Errors**:
```typescript
throw new ConvexError({
  code: 'PERMISSION_DENIED',
  message: 'You do not have permission to edit this idea'
})
```

**Not Found Errors**:
```typescript
throw new ConvexError({
  code: 'NOT_FOUND',
  message: 'Idea not found'
})
```

### Client Error Handling

```typescript
try {
  const result = await convexMutation(args)
} catch (error) {
  if (error.code === 'VALIDATION_ERROR') {
    showValidationError(error.message)
  } else if (error.code === 'PERMISSION_DENIED') {
    showPermissionError()
  } else {
    showGenericError()
  }
}
```

## 🔍 Search & Filtering

### Search Indexes

**Idea Search Index**:
```typescript
// Search across title and description
.withSearchIndex("search_content", ["title", "description"])

// Filter by metadata
.withIndex("search_metadata", ["category", "industries", "visibility"])
```

### Faceted Search

**Category Facets**:
```typescript
const categoryFacets = await ctx.db
  .query("ideas")
  .withIndex("by_category")
  .collect()
  .then(ideas => {
    const facetMap = new Map()
    ideas.forEach(idea => {
      const count = facetMap.get(idea.category) || 0
      facetMap.set(idea.category, count + 1)
    })
    return Array.from(facetMap.entries()).map(([name, count]) => ({
      name,
      count
    }))
  })
```

## 📈 Analytics & Metrics

### Usage Tracking

**Idea Metrics**:
```typescript
export const getIdeaMetrics = query({
  args: { ideaId: v.string() },
  handler: async (ctx, args) => {
    const idea = await ctx.db.get(args.ideaId)

    return {
      views: idea.viewCount || 0,
      sparks: idea.sparkCount,
      comments: idea.commentCount,
      contributors: await getContributorCount(ctx, args.ideaId),
      avgRating: await calculateAverageRating(ctx, args.ideaId)
    }
  }
})
```

### Performance Monitoring

**Query Performance**:
- Response times
- Error rates
- Cache hit rates
- Database load

## 🔧 Maintenance & Operations

### Data Migration

**Migration Pattern**:
```typescript
export const migrateUserProfiles = mutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect()

    for (const user of users) {
      // Perform migration logic
      await ctx.db.patch(user._id, {
        migratedAt: Date.now()
      })
    }
  }
})
```

### Backup & Recovery

**Data Export**:
```typescript
export const exportUserData = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // Export all user data for GDPR compliance
    const user = await ctx.db.get(args.userId)
    const ideas = await ctx.db.query("ideas")
      .withIndex("by_author", (q) => q.eq("authorId", args.userId))
      .collect()

    return {
      user,
      ideas,
      exportDate: Date.now()
    }
  }
})
```

## 🧪 Testing API Functions

### Unit Tests

**Query Testing**:
```typescript
import { convexTest } from 'convex-test'
import { api } from './_generated/api'

const t = convexTest()

test('getAllIdeas returns public ideas', async () => {
  await t.run(async (ctx) => {
    // Create test data
    const userId = await ctx.db.insert("users", testUser)
    const ideaId = await ctx.db.insert("ideas", {
      ...testIdea,
      authorId: userId,
      visibility: 'public'
    })

    // Test query
    const result = await ctx.runQuery(api.ideas.getAllIdeas, {})
    expect(result.ideas).toContainEqual(
      expect.objectContaining({ _id: ideaId })
    )
  })
})
```

### Integration Tests

**Full Workflow Testing**:
```typescript
test('idea creation workflow', async () => {
  await t.run(async (ctx) => {
    // Create user
    const userId = await ctx.db.insert("users", testUser)

    // Create idea
    const result = await ctx.runMutation(api.ideas.createIdea, {
      title: 'Test Idea',
      description: 'Test description',
      category: 'Technology',
      visibility: 'public'
    })

    // Verify idea was created
    const idea = await ctx.db.get(result.ideaId)
    expect(idea.title).toBe('Test Idea')
    expect(idea.authorId).toBe(userId)
  })
})
```

This comprehensive API documentation covers all backend functions, database operations, and integration patterns used in the Interactive Ideas Platform.