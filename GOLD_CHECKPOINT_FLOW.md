# Gold Checkpoint to Social Feed Flow

## Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER COMPLETES TASK 3                        │
│              (submitEvidence mutation called)                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              CHECK: Are all 3 tasks complete?                    │
│         (t1Completed && t2Completed && t3Completed)              │
└────────────┬────────────────────────────────────┬───────────────┘
             │                                     │
        NO   │                                     │ YES
             ▼                                     ▼
     ┌──────────────┐            ┌────────────────────────────────┐
     │   Continue   │            │  CHECK: Gold bonus earned yet? │
     │   Normal     │            │      (!goldBonusEarned)        │
     │   Flow       │            └──────────┬───────────┬─────────┘
     └──────────────┘                  YES  │           │ NO
                                             │           │
                                             ▼           ▼
                              ┌──────────────────┐  ┌────────────┐
                              │  Continue Normal  │  │  Continue  │
                              │       Flow        │  │  Normal    │
                              └──────────────────┘  │   Flow     │
                                                    └──────┬─────┘
                                                           │
                              ┌────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────────────────────────────┐
                    │     GOLD CHECKPOINT ACHIEVED! 🏆        │
                    │   Set goldBonusEarned = true            │
                    └────────────────┬────────────────────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    │                                 │
                    ▼                                 ▼
    ┌───────────────────────────┐    ┌──────────────────────────────┐
    │  Award Gold Bonus Points  │    │   Get Venture Details        │
    │  (POINT_VALUES.gold_      │    │   - Idea/Venture name        │
    │   checkpoint_bonus)       │    │   - Stage name               │
    └───────────────────────────┘    │   - Checkpoint name          │
                                     │   - User display name        │
                                     └────────────┬─────────────────┘
                                                  │
                        ┌─────────────────────────┴──────────────────┐
                        │                                            │
                        ▼                                            │
        ┌───────────────────────────────┐                           │
        │   NOTIFICATION #1: PERSONAL   │                           │
        │   To: User (self)             │                           │
        │   Type: gold_checkpoint       │                           │
        │   Message: "Gold Checkpoint!  │                           │
        │   All 3 tasks completed.      │                           │
        │   +{points} points"           │                           │
        └───────────────────────────────┘                           │
                        │                                            │
                        ▼                                            │
        ┌───────────────────────────────┐                           │
        │ NOTIFICATION #2: COLLABORATORS│                           │
        │   Query invitations for idea  │                           │
        │   For each accepted collabor. │                           │
        │   Create notification:        │                           │
        │   - Type: gold_checkpoint     │                           │
        │   - Message: "Gold Checkpoint │                           │
        │     achieved by collaborator!"│                           │
        └───────────────────────────────┘                           │
                        │                                            │
                        ▼                                            │
        ┌────────────────────────────────────────────┐              │
        │  NOTIFICATION #3: COMMUNITY FEED POST      │◄─────────────┘
        │  ✨ NEW IMPLEMENTATION ✨                  │
        │                                            │
        │  To: User (self-notification pattern)     │
        │  Type: gold_checkpoint                    │
        │  Message: "🏆 {displayName} earned a      │
        │  Gold Checkpoint on {checkpointName}      │
        │  in {ventureName}! ({stageName})"         │
        │  RelatedId: venture._id                   │
        │  IsRead: false                            │
        └────────────────────┬───────────────────────┘
                             │
                             ▼
        ┌────────────────────────────────────────────┐
        │  SOCIAL FEED QUERIES PICK UP NOTIFICATION  │
        │                                            │
        │  • getCommunityVentureFeed                 │
        │    → Shows to ALL users (public only)     │
        │                                            │
        │  • getUserVentureFeed                      │
        │    → Shows to involved users              │
        │                                            │
        │  • getIdeaFeed                             │
        │    → Shows in project feed                │
        │                                            │
        │  • getVentureFeed                          │
        │    → Shows in venture-specific feed       │
        └────────────────────┬───────────────────────┘
                             │
                             ▼
        ┌────────────────────────────────────────────┐
        │     DISPLAYED IN SOCIAL FEED UI            │
        │                                            │
        │  🏆 John Smith earned a Gold Checkpoint   │
        │     on Validate Problem in Idea Machine!  │
        │     (Stage 1: Problem Discovery)          │
        │                                            │
        │  [User Avatar] [Venture Link] [Timestamp] │
        └────────────────────────────────────────────┘
```

## Code Location Map

```
convex/ventures.ts
  └─ submitEvidence mutation (L405-582)
       └─ Evidence validation (L430-437)
       └─ Create evidence record (L443-450)
       └─ Update task status (L454-456)
       └─ Update checkpoint flags (L460-467)
       └─ Check for gold checkpoint (L469-544) ⭐ KEY SECTION
            ├─ Set goldBonusEarned = true (L478)
            ├─ Award points (L481-486)
            ├─ Get venture details (L489-503)
            ├─ Personal notification (L505-512)
            ├─ Collaborator notifications (L515-534)
            └─ Community feed post (L536-544) ⭐ NEW CODE
       └─ Sync checkpoint completion (L537-543)
       └─ Award task points (L545-552)

convex/socialFeed.ts
  ├─ getCommunityVentureFeed (L149-242)
  │    └─ Queries notifications by type "gold_checkpoint"
  │    └─ Filters for public ventures only
  │    └─ Enriches with user & venture data
  │
  ├─ getUserVentureFeed (L247-376)
  │    └─ Shows gold checkpoints from user's ventures
  │
  ├─ getIdeaFeed (L71-146)
  │    └─ Shows gold checkpoints for specific idea
  │
  └─ getVentureFeed (L10-66)
       └─ Shows gold checkpoints for specific venture

convex/schema.ts
  └─ notifications table (L205-232)
       └─ Indexed by type for efficient querying
       └─ Indexed by relatedId for venture filtering
       └─ Indexed by createdAt for time sorting
```

## Data Flow Example

**Scenario:** Alice completes the 3rd task in "Problem Discovery" checkpoint

1. **Input:** `submitEvidence({ taskId: "abc123", content: {...} })`

2. **Processing:**
   ```
   Task completed ✓
   t1Completed: true
   t2Completed: true
   t3Completed: true ← Just set
   goldBonusEarned: false ← Not yet earned
   ```

3. **Gold Detection:** All conditions met! 🎉

4. **Notifications Created:**
   
   **A. Personal (existing):**
   ```json
   {
     "type": "gold_checkpoint",
     "recipientId": "alice_id",
     "senderId": "alice_id",
     "message": "🏆 Idea Machine - Stage 1: Problem Discovery...",
     "relatedId": "venture_123"
   }
   ```

   **B. Collaborators (existing):**
   ```json
   {
     "type": "gold_checkpoint",
     "recipientId": "bob_id",
     "senderId": "alice_id",
     "message": "🏆 Idea Machine - Stage 1: Problem Discovery...",
     "relatedId": "venture_123"
   }
   ```

   **C. Community Feed (NEW):**
   ```json
   {
     "type": "gold_checkpoint",
     "recipientId": "alice_id",
     "senderId": "alice_id",
     "message": "🏆 Alice Smith earned a Gold Checkpoint...",
     "relatedId": "venture_123",
     "isRead": false
   }
   ```

5. **Query Response:** `getCommunityVentureFeed()`
   ```json
   [
     {
       "_id": "notif_789",
       "type": "gold_checkpoint",
       "message": "🏆 Alice Smith earned a Gold Checkpoint...",
       "user": {
         "_id": "alice_id",
         "displayName": "Alice Smith",
         "username": "alice",
         "avatar": "..."
       },
       "venture": {
         "_id": "venture_123",
         "name": "Idea Machine",
         "ideaId": "idea_456"
       },
       "createdAt": 1703001234567
     }
   ]
   ```

6. **UI Display:** Social feed component renders the celebration!

## Key Benefits of This Design

✅ **Leverages Existing Infrastructure**
- No new tables needed
- Uses existing notification system
- Social feed queries already support it

✅ **Privacy Respecting**
- Automatic filtering of private ventures
- Only public ventures appear in community feed
- Collaborators still get their notifications

✅ **Efficient**
- Single database insert for community post
- Indexed queries for fast retrieval
- Minimal overhead on submission

✅ **Scalable**
- Works with any number of users
- Pagination support in queries
- No N+1 query problems

✅ **Celebratory**
- Trophy emoji 🏆 for visual impact
- Includes all relevant context
- Encourages community engagement
