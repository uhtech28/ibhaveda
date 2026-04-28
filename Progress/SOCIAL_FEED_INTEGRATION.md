# Social Feed Integration for Venture System

## Overview

The social feed integration fires events to the notification/feed system when users hit key venture milestones. All project collaborators can see these events in real-time via Convex subscriptions.

## Implementation Summary

### ✅ Task 1: Gold Checkpoint Community Notification

**Location:** `convex/ventures.ts` (lines 311-344) and `convex/worldMap.ts` (lines 338-361)

When a user completes 3/3 tasks at any checkpoint:
- ✅ Event fired to notifications table (acts as social feed)
- ✅ Includes: project name, stage name, checkpoint name
- ✅ Message format: `🏆 {ventureName} - {stageName}: {checkpointName} - Gold Checkpoint! All 3 tasks completed. +{points} points`
- ✅ Feed renders as gold checkpoint card (use `type: "gold_checkpoint"`)

**Code locations:**
- `convex/ventures.ts` - `submitEvidence` mutation (after all 3 tasks complete)
- `convex/worldMap.ts` - `markTaskComplete` mutation (after all 3 tasks complete)

### ✅ Task 2: Stage Completion Feed Post

**Location:** `convex/ventures.ts` (lines 799-814)

When user completes the final checkpoint of any stage:
- ✅ Event fired to notifications table
- ✅ Includes: project name, stage name, stage number
- ✅ Message format: `🎉 {ventureName} - Stage {number}: {stageName} Complete! +{points} points`
- ✅ Feed renders as stage completion card (use `type: "venture_stage_complete"`)

**Code location:**
- `convex/ventures.ts` - `tryAdvanceStage` function (lines 755-851)

### ✅ Task 3: Contribution Post Attachment

**Status:** Already implemented ✅

Contributions are automatically attached to tasks via the `evidenceId` field:
- When submitting evidence: `convex/ventures.ts` - `submitEvidence` mutation creates `ventureEvidence` record
- Evidence includes: content, storageId (for files), toolType, userId
- Formats supported: text, audio, video, image, file (via `storageId`)
- Evidence is linked to the task that triggered the checkpoint/stage completion

**Data structure:**
```typescript
{
  taskId: Id<"ventureTasks">,
  userId: Id<"users">,
  toolType: "write" | "upload" | "audio" | "video" | ...,
  content: any, // Text, structured data, etc.
  storageId: Id<"_storage"> | undefined, // For uploaded files
  createdAt: number
}
```

### ✅ Task 4: Real-time Collaborator Map State

**Status:** Already working via Convex real-time subscriptions ✅

When a collaborator completes a task:
- Map reflects updated completion state in real-time for all project members
- Uses Convex's built-in real-time subscriptions
- No additional code needed - works automatically

**How it works:**
- Frontend components use `useQuery(api.worldMap.getWorldMapData, { ventureId })`
- Convex automatically pushes updates when checkpoint/task data changes
- All collaborators viewing the same venture see updates instantly

---

## Social Feed Queries

New file created: `convex/socialFeed.ts`

### Available Queries

#### 1. `getVentureFeed` - Feed for a specific venture
```typescript
const feed = useQuery(api.socialFeed.getVentureFeed, {
  ventureId: "...",
  limit: 50 // optional
});
```

Returns venture-specific feed items (gold checkpoints, stage completions).

#### 2. `getIdeaFeed` - Feed for all ventures in an idea/project
```typescript
const feed = useQuery(api.socialFeed.getIdeaFeed, {
  ideaId: "...",
  limit: 50 // optional
});
```

Shows activity from all ventures (team members) working on this project.

#### 3. `getUserVentureFeed` - Personal feed for current user
```typescript
const feed = useQuery(api.socialFeed.getUserVentureFeed, {
  limit: 50 // optional
});
```

Shows venture activity from all projects the user is involved in (as author or contributor).

#### 4. `getCommunityVentureFeed` - Platform-wide public feed
```typescript
const feed = useQuery(api.socialFeed.getCommunityVentureFeed, {
  limit: 50 // optional
});
```

Shows all public venture milestones across the platform (filters out private ventures).

---

## Feed Item Data Structure

Each feed item returned from the queries has this structure:

```typescript
{
  _id: Id<"notifications">,
  type: "gold_checkpoint" | "venture_stage_complete" | "venture_complete",
  message: string, // Pre-formatted message with emoji and details
  createdAt: number, // Unix timestamp
  isRead: boolean,
  
  // Enriched user data
  user: {
    _id: Id<"users">,
    displayName: string,
    username: string,
    avatar: string | undefined
  },
  
  // Enriched venture data
  venture: {
    _id: Id<"ventures">,
    name: string, // Idea/project title
    ideaId: Id<"ideas">,
    userId: Id<"users"> // Venture owner
  }
}
```

---

## Frontend Integration Examples

### Example 1: Project Feed Component

```typescript
"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";

export function ProjectFeed({ ideaId }: { ideaId: Id<"ideas"> }) {
  const feed = useQuery(api.socialFeed.getIdeaFeed, { ideaId, limit: 20 });

  if (!feed) return <div>Loading feed...</div>;
  if (feed.length === 0) return <div>No activity yet!</div>;

  return (
    <div className="space-y-4">
      {feed.map((item) => (
        <FeedCard key={item._id} item={item} />
      ))}
    </div>
  );
}

function FeedCard({ item }: { item: any }) {
  const isGoldCheckpoint = item.type === "gold_checkpoint";
  const isStageComplete = item.type === "venture_stage_complete";
  
  return (
    <div className={`p-4 rounded-lg border ${
      isGoldCheckpoint 
        ? "bg-yellow-50 border-yellow-300" 
        : isStageComplete 
        ? "bg-purple-50 border-purple-300"
        : "bg-gray-50 border-gray-300"
    }`}>
      <div className="flex items-center gap-3 mb-2">
        <img 
          src={item.user?.avatar} 
          alt={item.user?.displayName}
          className="w-10 h-10 rounded-full"
        />
        <div>
          <p className="font-bold">{item.user?.displayName}</p>
          <p className="text-sm text-gray-600">@{item.user?.username}</p>
        </div>
      </div>
      
      <p className="text-base mb-2">{item.message}</p>
      
      <div className="text-xs text-gray-500">
        {item.venture?.name} • {new Date(item.createdAt).toLocaleDateString()}
      </div>
    </div>
  );
}
```

### Example 2: User's Personal Venture Feed

```typescript
export function MyVenturesFeed() {
  const feed = useQuery(api.socialFeed.getUserVentureFeed, { limit: 30 });

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">My Ventures Activity</h2>
      {feed?.map((item) => (
        <ActivityCard key={item._id} item={item} />
      ))}
    </div>
  );
}
```

### Example 3: Community Feed Page

```typescript
export function CommunityVentureFeed() {
  const feed = useQuery(api.socialFeed.getCommunityVentureFeed, { limit: 50 });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {feed?.map((item) => (
        <MilestoneCard key={item._id} item={item} />
      ))}
    </div>
  );
}
```

---

## Retrieving Contribution Evidence

To display contribution attachments with feed items:

```typescript
// In your component
const contribution = useQuery(api.ventures.getVenture, { 
  ventureId: feedItem.venture._id 
});

// Find the specific evidence from the checkpoint that triggered the post
const evidence = contribution?.checkpoints
  ?.find(cp => /* match checkpoint */)
  ?.tasks
  ?.find(t => t.evidenceId)
  ?.evidence;

// Evidence structure:
// {
//   content: any,
//   storageId: Id<"_storage"> | undefined,
//   toolType: "write" | "upload" | "audio" | etc.
// }

// Display based on toolType:
if (evidence?.toolType === "upload" && evidence.storageId) {
  // Show file/image/video from storage
  const url = useQuery(api.files.getUrl, { storageId: evidence.storageId });
}
```

---

## Feed Types Reference

### Gold Checkpoint (`gold_checkpoint`)
- **Trigger:** User completes all 3 tasks (t1, t2, t3) at a checkpoint
- **Visual:** Gold/yellow theme, trophy icon 🏆
- **Points:** Bonus points awarded
- **Data:** Venture name, stage name, checkpoint name

### Stage Completion (`venture_stage_complete`)
- **Trigger:** User completes all checkpoints in a stage
- **Visual:** Purple/celebration theme, party icon 🎉
- **Points:** Stage completion bonus
- **Data:** Venture name, stage number, stage name

### Venture Completion (`venture_complete`)
- **Trigger:** User completes all 8 stages
- **Visual:** Epic celebration theme 🎊
- **Points:** Large completion bonus
- **Data:** Full venture completion

---

## Real-Time Updates

All feed queries use Convex's real-time subscriptions:
- Feed automatically updates when new events occur
- No polling or manual refresh needed
- All collaborators see updates instantly
- Works across tabs and devices

---

## Privacy & Visibility

- **Venture-specific feeds:** Visible to venture owner
- **Idea-specific feeds:** Visible to idea author and accepted contributors
- **User feed:** Shows activity from user's own ventures and projects they contribute to
- **Community feed:** Only shows events from PUBLIC ideas/projects (private ventures filtered out)

---

## Database Schema

### Notifications Table (Social Feed)
```typescript
{
  recipientId: Id<"users">,
  senderId: Id<"users">,
  type: "gold_checkpoint" | "venture_stage_complete" | "venture_complete",
  message: string,
  relatedId: Id<"ventures">, // Links to the venture
  isRead: boolean,
  createdAt: number
}
```

### Indexes Used
- `by_related` - Fast lookup by ventureId
- `by_type` - Filter by event type
- `by_recipient_created` - User's notifications sorted by time

---

## Next Steps

### Recommended UI Enhancements

1. **Feed Components:** Create reusable feed card components for different event types
2. **Filters:** Add filters for event types (gold checkpoints, stage completions, etc.)
3. **Pagination:** Implement infinite scroll or pagination for large feeds
4. **Notifications Badge:** Show unread count for new feed items
5. **Activity Timeline:** Visual timeline view for project progress

### Potential Features

- **Reactions:** Let collaborators react to milestones (👏, 🎉, 🔥)
- **Comments:** Allow commenting on feed items
- **Share:** Share milestone achievements externally
- **Analytics:** Track team momentum and velocity
- **Leaderboards:** Most active projects, fastest completions, etc.

---

## Testing the Integration

1. **Create a venture** for an idea
2. **Complete tasks** using the venture UI or world map
3. **Watch the feed** update in real-time:
   - Complete 3/3 tasks → Gold checkpoint post appears
   - Complete final checkpoint of a stage → Stage completion post appears
4. **Check different feeds:**
   - Venture feed shows only that venture's events
   - Idea feed shows all team members' events
   - User feed shows all ventures you're involved in
   - Community feed shows public project events

---

## Files Modified

1. ✅ `convex/ventures.ts` - Enhanced notifications with full context
2. ✅ `convex/worldMap.ts` - Added gold checkpoint notification
3. ✅ `convex/socialFeed.ts` - Created feed query functions (NEW FILE)

---

## Questions?

The social feed infrastructure is now fully wired. Feed items are created automatically when users hit milestones, and they can be queried and displayed in real-time using the provided query functions.

For custom feed displays, extend the feed queries in `convex/socialFeed.ts` or create new notification types in the venture completion logic.