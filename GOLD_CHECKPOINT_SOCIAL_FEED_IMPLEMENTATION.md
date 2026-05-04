# Gold Checkpoint Social Feed Implementation

## Overview
Implemented community-wide gold checkpoint notifications that appear in the social feed when users complete all 3 tasks in a checkpoint (gold achievement).

## Changes Made

### File: `convex/ventures.ts`
**Location:** `submitEvidence` mutation, lines ~534-544

**What was added:**
- Community-wide social feed post for gold checkpoint achievements
- Creates a notification with type `"gold_checkpoint"` that will be visible to all users in the community feed
- Includes celebratory message with user name, checkpoint name, venture name, and stage

**Implementation details:**
```typescript
// Create community-wide social feed post for gold checkpoint achievement
// This notification will appear in the community venture feed for all users
await ctx.db.insert("notifications", {
  recipientId: user._id, // Self-notification acts as the feed post
  senderId: user._id,
  type: "gold_checkpoint",
  message: `🏆 ${user.displayName || user.username} earned a Gold Checkpoint on ${checkpointName} in ${ventureName}! (${stageName})`,
  relatedId: venture._id,
  isRead: false, // Keeps it visible in feeds
  createdAt: now,
});
```

## How It Works

### Detection Logic
Gold checkpoints are detected in the `submitEvidence` mutation when:
1. All three tasks are completed (`t1Completed && t2Completed && t3Completed`)
2. The gold bonus hasn't been earned yet (`!goldBonusEarned`)

### Notification Flow
When a gold checkpoint is achieved:

1. **Personal notification**: User receives notification about their achievement with points earned
2. **Collaborator notifications**: All collaborators on the venture receive notifications
3. **Community feed post**: ✨ **NEW** - A notification is created that appears in the community-wide social feed

### Social Feed Display

The notification appears in multiple feeds:

#### 1. Community Venture Feed (`getCommunityVentureFeed`)
- Shows gold checkpoint achievements from **all public ventures**
- Filters out private ventures automatically
- Sorted by most recent first

#### 2. User Venture Feed (`getUserVentureFeed`)
- Shows gold checkpoints from ventures the user is involved in (as author or contributor)

#### 3. Idea Feed (`getIdeaFeed`)
- Shows all gold checkpoints for ventures within a specific idea/project

#### 4. Venture Feed (`getVentureFeed`)
- Shows gold checkpoints for a specific venture

### Message Format
The celebration message follows this format:
```
🏆 {displayName} earned a Gold Checkpoint on {checkpointName} in {ventureName}! ({stageName})
```

Example:
```
🏆 John Smith earned a Gold Checkpoint on Validate Problem in Idea Machine! (Stage 1: Problem Discovery)
```

## Technical Details

### Schema
Uses the existing `notifications` table with:
- `type`: `"gold_checkpoint"`
- `recipientId`: The user who earned the gold (self-notification pattern)
- `senderId`: Same as recipientId
- `relatedId`: The venture ID
- `message`: Celebratory text with achievement details

### Query Integration
The existing social feed queries in `convex/socialFeed.ts` already support filtering by:
- Notification type (`"gold_checkpoint"`)
- Venture visibility (public vs private)
- Time ordering (most recent first)

No changes were needed to the social feed queries - they automatically pick up the new notifications!

## Benefits

1. **Community Engagement**: Users can see and celebrate each other's achievements
2. **Motivation**: Public recognition encourages users to complete gold checkpoints
3. **Transparency**: Shows active progress across the platform
4. **Social Proof**: Demonstrates the value and activity of the venture system

## Privacy Considerations

- Only **public ventures** appear in the community-wide feed
- Private ventures only show achievements to collaborators
- This is handled automatically by the existing `getCommunityVentureFeed` filter logic

## Testing Checklist

To verify the implementation works:

- [ ] Complete all 3 tasks in a checkpoint
- [ ] Verify gold checkpoint notification appears in personal notifications
- [ ] Check that the achievement appears in the community venture feed
- [ ] Verify collaborators receive their notifications
- [ ] Confirm private ventures don't appear in community feed
- [ ] Validate message format includes user name, checkpoint name, venture name, and stage
- [ ] Ensure points are awarded correctly (existing functionality)

## Future Enhancements

Potential improvements:
- Add badges/icons for different checkpoint types
- Include venture thumbnail/avatar in feed display
- Add "celebrate" or "congrats" reaction feature
- Show streak information (e.g., "3rd gold in a row!")
- Filter feed by stage or venture type
