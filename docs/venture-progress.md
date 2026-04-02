# Venture Progression System — Implementation Tracker

## Status: Phase 1-5 Complete ✅

### Completed (Phase 1: Backend Foundation)
- [x] `convex/ventureConstants.ts` — All static definitions:
  - 34 checkpoint definitions (8 stages × 3-5 checkpoints each)
  - 12 boss definitions with corruption/defeat mechanics
  - 50 level definitions with point thresholds and requirements
  - 62 badge definitions with colors, shapes, rarity
  - Point values for all actions
- [x] `convex/schema.ts` — Extended with 10 new tables:
  - `ventures`, `ventureCheckpoints`, `ventureTasks`, `ventureEvidence`, `ventureBosses`
  - `userLevels`, `flares`, `flareResponses`, `mentorships`
  - `ventureBadges`, `badgeEvaluations`
- [x] `convex/ventures.ts` — Core venture backend:
  - `createVenture` — Creates venture from idea, initializes all checkpoints/tasks, assigns 1-2 random bosses
  - `generateUploadUrl` — File upload URL generation
  - `startCheckpoint` — Transitions checkpoint to in_progress
  - `submitEvidence` — Submits task evidence, updates completion flags, checks gold bonus
  - `advanceCheckpoint` — Advances checkpoint (requires 2/3 tasks), triggers stage advancement
  - `advanceStage` — Advances to next stage (requires all checkpoints complete)
  - `getVenture`, `getUserVentures`, `getCheckpoint`, `getVentureProgress` — Queries
  - Internal helpers: `tryAdvanceStage`, `awardPoints`, `updateBossCorruptionOnProgress`
- [x] `convex/levels.ts` — Level progression:
  - `initializeUserLevel` — Creates level tracking record
  - `awardPoints` — Awards points, updates wallet, checks level up
  - `getUserLevelProgress`, `getAllLevels` — Queries
- [x] `convex/badges.ts` — Extended existing badges.ts:
  - `awardVentureBadge` — Awards venture badge
  - `getVentureBadges`, `getAllVentureBadges`, `getVentureBadgeProgress` — Queries
- [x] `convex/flares.ts` — Flare help system:
  - `fireFlare`, `respondToFlare`, `markResponseHelpful`, `resolveFlare` — Mutations
  - `getOpenFlares`, `getFlareResponses`, `getUserFlares` — Queries
- [x] `convex/mentorship.ts` — Mentor track:
  - `applyForMentorship`, `acceptMentee`, `trackMenteeCheckpoint`, `endMentorship` — Mutations
  - `getMentorDashboard`, `getMentorshipStatus` — Queries

### Completed (Phase 2: UI Pages + Core Tools)
- [x] `src/app/venture/[id]/page.tsx` — Venture detail with progress, bosses, stages
- [x] `src/app/venture/[id]/stage/[stage]/checkpoint/[checkpoint]/page.tsx` — Checkpoint with T1/T2/T3 tasks + tool integration
- [x] `src/app/venture/create/page.tsx` — Create venture from idea with boss preview
- [x] `src/components/tools/write-tool.tsx` — Rich text response tool
- [x] `src/components/tools/table-tool.tsx` — Dynamic table builder
- [x] `src/components/tools/link-tool.tsx` — URL submission tool
- [x] `src/components/tools/upload-tool.tsx` — File upload tool with Convex storage
- [x] `src/components/tools/self-report-tool.tsx` — Structured form tool

### Completed (Phase 3: Boss System)
- [x] `src/components/venture/boss-encounter.tsx` — Boss display with corruption levels, status badges, defeat methods
- [x] `src/components/venture/monument-display.tsx` — Slain boss monuments with gradient styling
- [x] Boss corruption CSS animations in `globals.css` — 12 unique per-boss effects + slay/monument animations

### Completed (Phase 4: Profile Integration)
- [x] `src/components/levels/level-badge.tsx` — Level display with phase colors, progress bar, requirements
- [x] `src/components/badges/badge-grid.tsx` — Badge collection grid with rarity colors, hidden badge support
- [x] `src/components/flares/flare-button.tsx` — Fire flare + flare feed components
- [x] Profile page integration — CompactProfileView now shows LevelBadge + BadgeGrid

### Completed (Phase 5: Remaining Tools + Integration)
- [x] `src/components/tools/map-tool.tsx` — Canvas with draggable nodes and connections
- [x] `src/components/tools/survey-tool.tsx` — Survey builder with text/multiple choice
- [x] `src/components/tools/poll-tool.tsx` — Poll creator with dynamic options
- [x] `src/components/tools/oauth-tool.tsx` — External tool linking (Figma, Notion, etc.)
- [x] `src/components/ui/radio-group.tsx` — Radio group UI component (shadcn)
- [x] Checkpoint page wired up with all 9 tool components
- [x] `src/components/IdeaToolbar.tsx` — Added "Convert to Venture" rocket button

### Pending (Phase 6: Polish & Production)
- [ ] Mobile responsive polish for all venture pages
- [ ] Notification system for completions/level ups/badges
- [ ] Feed integration (venture progress badges)
- [ ] Error handling & edge cases
- [ ] Testing (unit + integration)
- [ ] Performance optimization

## System Architecture

```
Ideas → Ventures → Checkpoints → Tasks → Evidence
  │         │           │          │        │
  │         │           │          │        └─ 9 Tool Types (Write/Table/Link/Upload/Map/Survey/Poll/OAuth/SelfReport)
  │         │           │          └─ T1/T2/T3 (Easy/Medium/Stretch)
  │         │           └─ 2/3 tasks to advance, all 3 = gold bonus
  │         └─ 8 stages, 34 total checkpoints
  └─ Wrap existing idea with progression

Bosses (1-2 per venture) → Corruption → Defeat → Monument
Levels (1-50) → Points → Requirements → Level Up
Badges (62) → Conditions → Award → Display
Flares → Help Requests → Responses → Resolution
Mentorship → Level 40+ → Mentees → Tracking
```

## Key Design Decisions
1. **Ventures wrap ideas** — Don't replace, extend existing idea system
2. **JSON evidence storage** — Flexible for different tool types
3. **Boss corruption numeric (0-100)** — Easy to scale visual effects
4. **Mentor track separate module** — Only relevant at Lv 40+
5. **Points feed existing gamification** — No separate wallet system needed
6. **Tool components are isolated** — Each tool is self-contained, testable
7. **Boss CSS animations are per-boss** — 12 unique animation classes

## Commits
1. `1ece4c7` — Backend foundation (8 Convex modules, 10 tables)
2. `740df45` — Venture UI pages (detail + checkpoint)
3. `3cb22c6` — Tool components + create page
4. `2e95d0f` — Level, badge, flare UI components
5. `4193272` — Boss encounter and monument display
6. `bd80e4a` — Profile page integration
7. `59789bf` — Remaining tools, boss CSS, checkpoint integration
