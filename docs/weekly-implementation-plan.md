# Interactive Ideas — 4-Week Implementation Plan
**V1 Ship Scope: Phaser Integration, World Map, Animations, Audio & AI Scoring**

*Based on Tech Intern Onboarding Guide — April 2026*

---

## Overview

This plan covers the complete V1 implementation across 4 weeks (20 working days). Each week builds on the previous, following the dependency chain outlined in the tech guide. All work assumes a single full-time developer.

**Total Estimated Hours**: 160 hours (40 hours/week)
**Critical Path**: Phaser Integration → World Map → Animations → Audio/AI
**Risk Buffer**: 10% built into each week for debugging and integration issues

---

## Week 1: Foundation & Core Infrastructure
**Goal**: Phaser 3 integrated, brightness system working, checkpoint nodes rendering

### Day 1 (Monday) — Orientation & Setup
**Hours**: 8 | **Deliverable**: Development environment ready

**Morning (4h)**
- Read PRD v1.0 Ship Scope document completely
- Read Implementation Guide PDF
- Review existing codebase structure:
  - Convex tables (`convex/schema.ts`)
  - Clerk auth flows (`src/app/sign-in`, `src/app/sign-up`)
  - Existing 9 tools (`src/components/tools/`)
  - Venture system (`convex/ventures.ts`)

**Afternoon (4h)**
- Review checkpoint task content in `checkpoint_tasks_v3.xlsx`
- Review badge specifications in `achievement_badges.xlsx`
- Review level progression in `level_table_with_flare.xlsx`
- Review monster lore in `monsters_and_mechanics.xlsx`
- Set up local development environment
- Verify all existing tests pass (`npm run test`)

**Output**: Written summary of codebase architecture, list of questions for team

---

### Day 2 (Tuesday) — Phaser Installation & Canvas Mounting
**Hours**: 8 | **Deliverable**: Phaser canvas rendering on `/map` route

**Morning (4h)**
- Install dependencies:
  ```bash
  npm install phaser@^3.80.1
  npm install --save-dev @types/phaser
  ```
- Create file structure:
  ```
  src/lib/phaser/
  ├── game-config.ts
  ├── scenes/
  │   └── WorldMapScene.ts
  ├── entities/
  └── utils/
      └── event-bridge.ts
  ```
- Implement basic `game-config.ts` with Phaser configuration

**Afternoon (4h)**
- Create `/map` route: `src/app/map/page.tsx`
- Build React component that mounts Phaser canvas
- Implement proper cleanup on unmount
- Test canvas renders with test rectangle
- Verify 60 FPS on desktop, 30+ FPS on mobile

**Output**: Phaser canvas visible at `/map` with test graphics, no errors in console

---

### Day 3 (Wednesday) — React-Phaser Event Bridge
**Hours**: 8 | **Deliverable**: Bidirectional communication between React and Phaser

**Morning (4h)**
- Implement `src/lib/phaser/utils/event-bridge.ts`:
  - Global event emitter
  - React → Phaser action dispatcher
  - Phaser → React callback system
- Create type definitions for all events

**Afternoon (4h)**
- Build test harness:
  - React button that triggers Phaser animation
  - Phaser click that updates React state
- Document event bridge API
- Write unit tests for event bridge

**Output**: Working bidirectional communication, documented API, passing tests

---

### Day 4 (Thursday) — Two-Layer Brightness System
**Hours**: 8 | **Deliverable**: Brightness system calculating from real backend data

**Morning (4h)**
- Study brightness formula (Section 5 of tech guide):
  - Accumulated base: `completed_stages × 8.57%` (max 60%)
  - Stage layer: `tasks_done / tasks_total × 40%`
  - World brightness: sum of both (0%–100%)
- Create `src/lib/phaser/utils/brightness-calculator.ts`
- Implement calculation function with unit tests for all worked examples

**Afternoon (4h)**
- Implement Phaser post-processing filter (brightness/contrast)
- Wire brightness calculator to Convex venture data
- Test against worked examples:
  - Stage 1 start: 0%
  - Stage 2 entry: 8.57%
  - Mid-Stage 5 (50% tasks): 54.28%
  - Final stage complete: 100%

**Output**: Brightness system working with real data, all test cases passing

---

### Day 5 (Friday) — Checkpoint Node Rendering
**Hours**: 8 | **Deliverable**: Checkpoint nodes rendering in correct states

**Morning (4h)**
- Create `src/lib/phaser/entities/Checkpoint.ts`
- Implement 4 visual states:
  - Locked (grey, sealed)
  - Active (glowing, pulsing)
  - Standard-complete (open, lit)
  - Gold-complete (golden, radiant)
- Create stub snake path layout

**Afternoon (4h)**
- Wire checkpoint states to real Convex venture progress data
- Render checkpoint nodes on stub path
- Test state transitions as progress updates
- Document checkpoint node API

**Output**: Checkpoint nodes rendering with correct states based on actual project data

**Week 1 Checkpoint Review**:
- Phaser integrated and stable
- Brightness system calculating correctly
- Checkpoint nodes rendering
- Event bridge working
- All code documented and tested

---

## Week 2: World Map & Persona System
**Goal**: Full world map with 8 biomes, persona sprites, camera system

### Day 6 (Monday) — Snake Path Layout & Biome Zones
**Hours**: 8 | **Deliverable**: 8-biome snake path layout

**Morning (4h)**
- Design snake path algorithm:
  - Left-to-right progression
  - 8 distinct biome zones
  - Checkpoint spacing (4-5 per stage)
  - Boss positions at stage boundaries
- Implement path generation in `WorldMapScene.ts`

**Afternoon (4h)**
- Create biome zone boundaries
- Implement path rendering (placeholder graphics)
- Add stage labels
- Test with different venture progress states

**Output**: Complete snake path layout with 8 biome zones, all 36 checkpoint positions

---

### Day 7 (Tuesday) — Camera System & Scrolling
**Hours**: 8 | **Deliverable**: Smooth camera following and scrolling

**Morning (4h)**
- Implement horizontal camera scroll
- Add smooth camera following (easing)
- Set viewport bounds
- Handle edge cases (start/end of map)

**Afternoon (4h)**
- Implement camera zoom controls (optional for V1)
- Add minimap indicator (optional for V1)
- Test camera on various screen sizes
- Optimize performance (maintain 60 FPS)

**Output**: Smooth camera system following active checkpoint, responsive on all devices

---

### Day 8 (Wednesday) — Persona Sprite System
**Hours**: 8 | **Deliverable**: Persona sprites with idle and walk animations

**Morning (4h)**
- Create `src/lib/phaser/entities/Persona.ts`
- Implement sprite loading (32×48px native, render at 96×144px with nearest-neighbor)
- Build animation system:
  - Idle animation (4 frames)
  - Walk cycle (6 frames)
- Add persona selection at project creation

**Afternoon (4h)**
- Wire persona to active checkpoint position
- Implement floating/hovering effect above checkpoint node
- Add walk animation during stage transitions
- Test with both male and female sprites

**Output**: Persona sprites rendering with animations, positioned correctly on map

**Asset Request**: Send to design team:
- 2 persona sprite sheets (male/female)
- Specifications: 32×48px native, idle (4 frames) + walk (6 frames)

---

### Day 9 (Thursday) — Boss Silhouette System
**Hours**: 8 | **Deliverable**: Boss silhouettes rendering at correct opacity

**Morning (4h)**
- Create `src/lib/phaser/entities/Boss.ts`
- Implement Super Boss silhouette system:
  - Silhouette state (15% opacity, far right)
  - Present state (50% opacity, Stage 5+)
  - Foreground state (100% opacity, Stage 7+)
- Random boss assignment at project creation

**Afternoon (4h)**
- Implement 8 mini-boss stage silhouettes
- Position bosses at stage boundaries
- Wire opacity to venture progress
- Test boss state transitions

**Output**: Boss silhouettes rendering with correct opacity based on progress

**Asset Request**: Send to design team:
- 3 Super Boss silhouettes (256×256px): Unraveller, Pale Architect, Gravemind
- 8 mini-boss stage silhouettes

---

### Day 10 (Friday) — Biome Background Integration
**Hours**: 8 | **Deliverable**: 8 biome backgrounds with parallax scrolling

**Morning (4h)**
- Implement parallax scrolling system
- Create background layer management
- Add biome transition blending (crossfade 800ms)

**Afternoon (4h)**
- Integrate placeholder biome backgrounds
- Test scrolling performance
- Optimize asset loading (lazy load off-screen biomes)
- Polish visual transitions

**Output**: Complete world map with 8 biome backgrounds, smooth parallax scrolling

**Asset Request**: Send to design team:
- 8 biome backgrounds (2048×512px): Village, Forest, Arena, Artisan's Quarter, Mine, Harbour, Crossroads, Capital

**Week 2 Checkpoint Review**:
- Full world map rendering
- Persona system working
- Camera system smooth
- Boss silhouettes positioned
- Performance targets met (60 FPS desktop)

---

## Week 3: Animations & HUD
**Goal**: All checkpoint animations, progression animations, HUD system

### Day 11 (Monday) — Checkpoint Animation Framework
**Hours**: 8 | **Deliverable**: Animation framework and first 2 patterns

**Morning (4h)**
- Create animation scene structure:
  ```
  src/lib/phaser/scenes/animations/
  ├── BaseCheckpointAnimation.ts (abstract class)
  ├── SealBreakAnimation.ts
  ├── RuneInscriptionAnimation.ts
  ```
- Implement base animation class with:
  - Standard variant (1.5–2.5s)
  - Gold variant (2.5–3.5s)
  - Skip after 0.5s functionality

**Afternoon (4h)**
- Implement Seal Break animation (standard + gold)
- Implement Rune Inscription animation (standard + gold)
- Test animations trigger on checkpoint completion
- Add animation state management

**Output**: 2 checkpoint animations working (4 variants total)

---

### Day 12 (Tuesday) — Remaining Checkpoint Animations
**Hours**: 8 | **Deliverable**: All 6 checkpoint animation patterns complete

**Morning (4h)**
- Implement Beacon Lighting animation (standard + gold)
- Implement Bridge Repair animation (standard + gold)

**Afternoon (4h)**
- Implement Compass Calibration animation (standard + gold)
- Implement Ward Placement animation (standard + gold)
- Wire stage-to-pattern mapping:
  - S1: Seal Break, S2: Rune Inscription, S3: Beacon Lighting
  - S4: Bridge Repair, S5: Compass Calibration, S6: Ward Placement
  - S7: Beacon Lighting, S8: Seal Break

**Output**: All 6 checkpoint animation patterns (12 variants total) working

**Asset Request**: Send to design team:
- Particle effects for each animation pattern
- Gold variant visual enhancements

---

### Day 13 (Wednesday) — HUD System Foundation
**Hours**: 8 | **Deliverable**: HUD component structure and state management

**Morning (4h)**
- Create Jotai atoms in `src/lib/stores/hudStore.ts`:
  ```typescript
  hudVisibleAtom
  activeVentureAtom
  corruptionAtom (placeholder for post-V1)
  qualityScoreAtom
  ```
- Create HUD component structure:
  ```
  src/components/hud/
  ├── HUD.tsx (main container)
  ├── XPBar.tsx
  ├── LevelDisplay.tsx
  ├── StageInfo.tsx
  ├── CheckpointProgress.tsx
  ├── StreakCounter.tsx
  ├── QualityScore.tsx
  └── AudioControls.tsx
  ```

**Afternoon (4h)**
- Implement HUD.tsx main container
- Add responsive layout logic:
  - Desktop: full HUD along top edge
  - Tablet: condensed with collapsible sections
  - Mobile: minimal bar with tap-to-expand
- Wire HUD visibility to active venture state

**Output**: HUD component structure, responsive layout working

---

### Day 14 (Thursday) — HUD Components Implementation
**Hours**: 8 | **Deliverable**: All HUD components functional

**Morning (4h)**
- Implement XPBar.tsx (animated fill)
- Implement LevelDisplay.tsx (current level + phase)
- Implement StageInfo.tsx (current stage name + icon)
- Implement CheckpointProgress.tsx (X/Y checkpoints)

**Afternoon (4h)**
- Implement StreakCounter.tsx (daily streak with fire icon)
- Implement QualityScore.tsx (Valuation Score display)
- Implement AudioControls.tsx (mute/unmute toggle)
- Wire all components to real Convex data

**Output**: Complete HUD with all components displaying real data

---

### Day 15 (Friday) — Progression Animations (React/Framer Motion)
**Hours**: 8 | **Deliverable**: Level-up and badge award animations

**Morning (4h)**
- Create `src/components/animations/LevelUpSequence.tsx`:
  - Screen edge burst (0.3s)
  - Level counter spin (0.5s)
  - Title fade-in (0.4s)
  - Phase transition (1.2s, at boundaries only)
  - Tool/ability cards (0.8s)
- Total: 2s, skippable after 0.5s

**Afternoon (4h)**
- Create `src/components/animations/BadgeAwardSequence.tsx`:
  - Interrupt flash (0.1s)
  - Badge materializes (0.6s, bounce effect)
  - Reveal card (0.4s)
  - Auto-dismiss at 4s
- Legendary variant: full-screen gold particle burst, manual dismiss only
- Wire to existing badge award backend events

**Output**: Level-up and badge award animations working, triggered by real events

**Week 3 Checkpoint Review**:
- All 6 checkpoint animations complete
- HUD system fully functional
- Progression animations polished
- All animations tested on mobile

---

## Week 4: Audio, AI Scoring & Integration
**Goal**: Audio system, AI quality scoring, tool integration, final polish

### Day 16 (Monday) — Audio System Foundation
**Hours**: 8 | **Deliverable**: Howler.js integrated, audio manager working

**Morning (4h)**
- Install dependencies:
  ```bash
  npm install howler@^2.2.4
  npm install --save-dev @types/howler@^2.2.11
  ```
- Create `src/lib/audio/audioManager.ts`:
  - Audio categories (ambience, music, SFX, UI)
  - Volume controls (master, music, SFX)
  - Crossfade system (800ms)
- Create `src/lib/stores/audioStore.ts` (Jotai atoms)

**Afternoon (4h)**
- Implement browser autoplay policy handling (defer until first user interaction)
- Add localStorage persistence for volume settings
- Create audio preloader
- Test with placeholder audio files

**Output**: Audio manager working, volume controls functional, autoplay compliant

---

### Day 17 (Tuesday) — Audio Integration
**Hours**: 8 | **Deliverable**: All audio categories integrated

**Morning (4h)**
- Integrate 8 biome ambient loops:
  - Wire to stage progression
  - Implement crossfade on stage transition
- Add checkpoint SFX (12 total: 6 patterns × 2 variants)
- Wire checkpoint SFX to animation triggers

**Afternoon (4h)**
- Add boss entrance themes (3 Super Bosses)
- Add mini-boss stage themes (8 total)
- Add level-up fanfare
- Add badge award SFX (5 rarity tiers)
- Add UI action SFX (click, confirm, error)

**Output**: Complete audio system with all 42 audio files integrated

**Asset Request**: Send to design team (if not already delivered):
- All audio files per specifications in tech guide Section 15
- Format: MP3 primary, OGG fallback
- 128kbps ambience, 192kbps music

---

### Day 18 (Wednesday) — AI Quality Scoring Backend
**Hours**: 8 | **Deliverable**: AI scoring system functional

**Morning (4h)**
- Create new Convex tables:
  ```typescript
  // convex/schema.ts additions
  qualityScores: defineTable({...})
  aiEvaluations: defineTable({...})
  ```
- Implement `convex/ai/scoring.ts`:
  - 4-dimension scoring (completeness, specificity, evidence, originality)
  - 0–3 scale per dimension (total 0–12)
  - Quality tiers: Low (0–4), Standard (5–8), High (9–12)

**Afternoon (4h)**
- Integrate AI models:
  - Free tier: Llama 3 / Mistral via Replicate
  - Pro tier: GPT-4 / Claude 3.5
- Add environment variables:
  ```bash
  OPENAI_API_KEY=xxx
  REPLICATE_API_KEY=xxx
  ```
- Wire scoring to task submission flow
- Map quality score to Valuation Score (user-facing metric)

**Output**: AI scoring working for both free and Pro tiers, Valuation Score updating

---

### Day 19 (Thursday) — Tool Integration (Journal, Kanban, Calendar)
**Hours**: 8 | **Deliverable**: All 11 tools integrated into checkpoint system

**Morning (4h)**
- Review existing 9 tools (Write, Table, Map/Canvas, Survey, Poll, Link, Upload, OAuth, Self-report)
- Locate Journal, Kanban, Calendar components in codebase
- Wire Journal to checkpoint task system:
  - Add as tool type option
  - Connect to task submission flow
  - Test with checkpoint task

**Afternoon (4h)**
- Wire Kanban to checkpoint task system
- Wire Calendar to checkpoint task system
- Update checkpoint task assignment UI to include all 11 tools
- Test each tool type with real checkpoint tasks from `checkpoint_tasks_v3.xlsx`

**Output**: All 11 tools integrated and assignable to checkpoint tasks

---

### Day 20 (Friday) — Final Integration, Polish & Testing
**Hours**: 8 | **Deliverable**: V1 feature-complete, tested, documented

**Morning (4h)**
- Implement feature flags:
  - Create `featureFlags` table in Convex
  - Add flags: `phaser_world_map`, `ai_quality_scoring`, `persona_system`, `audio_system`
  - Set all to 5% rollout initially
- Wire contribution requirement to checkpoint completion:
  - Text (min 50 words), audio, video, image, or file
  - Block checkpoint completion until contribution posted
- Wire gold checkpoint community notification

**Afternoon (4h)**
- End-to-end testing:
  - Create new venture
  - Complete checkpoint (standard path)
  - Complete checkpoint (gold path)
  - Verify all animations trigger
  - Verify audio plays correctly
  - Verify HUD updates
  - Verify AI scoring runs
- Fix any critical bugs
- Update documentation

**Output**: V1 feature-complete, all critical paths tested, ready for 5% rollout

**Week 4 Checkpoint Review**:
- Audio system complete
- AI scoring functional
- All 11 tools integrated
- Feature flags implemented
- End-to-end testing passed

---

## Database Schema Changes Summary

### New Tables to Create
```typescript
// convex/schema.ts

qualityScores: defineTable({
  ventureId: v.id("ventures"),
  stageNumber: v.number(),
  completeness: v.number(),      // 0-3
  specificity: v.number(),        // 0-3
  evidence: v.number(),           // 0-3
  originality: v.number(),        // 0-3
  totalScore: v.number(),         // 0-12
  qualityTier: v.string(),        // "low" | "standard" | "high"
  valuationScore: v.number(),     // User-facing metric
  evaluatedAt: v.number(),
}).index("by_venture", ["ventureId"]),

aiEvaluations: defineTable({
  taskId: v.id("tasks"),
  checkpointId: v.string(),
  content: v.string(),
  completeness: v.number(),
  specificity: v.number(),
  evidence: v.number(),
  originality: v.number(),
  feedback: v.optional(v.string()),
  modelUsed: v.string(),          // "llama3" | "gpt4" | "claude"
  evaluatedAt: v.number(),
}).index("by_task", ["taskId"]),

featureFlags: defineTable({
  flag: v.string(),
  enabled: v.boolean(),
  rolloutPercentage: v.number(),  // 0-100
  enabledForUsers: v.array(v.id("users")),
}).index("by_flag", ["flag"]),

skillTaxonomy: defineTable({
  name: v.string(),
  category: v.string(),
  aliases: v.array(v.string()),
}).index("by_name", ["name"]),

industryTaxonomy: defineTable({
  name: v.string(),
  category: v.string(),
  aliases: v.array(v.string()),
}).index("by_name", ["name"]),
```

### Existing Tables to Modify
```typescript
// ventures table additions
projectType: v.union(
  v.literal("venture"),
  v.literal("academic"),
  v.literal("lab"),
  v.literal("creative")
),
personaId: v.optional(v.number()),      // 1-10, only 1-2 in V1
superBossId: v.optional(v.number()),    // 1-12, only 1-3 in V1
qualityScore: v.optional(v.number()),
valuationScore: v.optional(v.number()),

// users table additions
isOnline: v.optional(v.boolean()),
lastSeenAt: v.optional(v.number()),
audioSettings: v.optional(v.object({
  masterVolume: v.number(),
  musicVolume: v.number(),
  sfxVolume: v.number(),
})),
```

---

## Asset Delivery Schedule

### Week 1 (Needed by Day 5)
- Checkpoint node sprites (64×64px): locked, active, standard-complete, gold-complete

### Week 2 (Needed by Day 8)
- 2 persona sprite sheets (32×48px): male and female, idle + walk animations
- 3 Super Boss silhouettes (256×256px)
- 8 mini-boss stage silhouettes

### Week 2 (Needed by Day 10)
- 8 biome backgrounds (2048×512px)
- Path/road tileset

### Week 3 (Needed by Day 12)
- Particle effects for 6 checkpoint animation patterns
- Gold variant visual enhancements

### Week 4 (Needed by Day 17)
- All 42 audio files (see tech guide Section 15 for complete list)

---

## Risk Mitigation

### High-Risk Items
1. **Phaser-React integration complexity** (Week 1)
   - Mitigation: Build event bridge early, test thoroughly
   - Fallback: Use simpler iframe approach if event bridge fails

2. **Performance on mobile devices** (Week 2)
   - Mitigation: Test on real devices early, optimize asset loading
   - Target: 30+ FPS minimum on mid-range Android

3. **AI model API rate limits** (Week 4)
   - Mitigation: Implement request queuing, add retry logic
   - Fallback: Graceful degradation to cached scores

4. **Asset delivery delays** (All weeks)
   - Mitigation: Use placeholder assets, communicate deadlines early
   - Buffer: 2-3 days built into each week

### Medium-Risk Items
1. **Audio autoplay policy compliance** (Week 4)
   - Mitigation: Follow browser best practices, defer until user interaction

2. **Animation performance** (Week 3)
   - Mitigation: Use sprite sheets, limit particle counts, test on low-end devices

---

## Success Metrics

### Week 1
- [ ] Phaser canvas renders at 60 FPS desktop
- [ ] Brightness system passes all test cases
- [ ] Checkpoint nodes render with correct states
- [ ] Zero console errors

### Week 2
- [ ] Full world map with 8 biomes renders
- [ ] Camera follows persona smoothly
- [ ] Boss silhouettes at correct opacity
- [ ] Performance: 60 FPS desktop, 30+ FPS mobile

### Week 3
- [ ] All 12 checkpoint animation variants work
- [ ] HUD displays all metrics correctly
- [ ] Progression animations trigger on real events
- [ ] Animations skippable as specified

### Week 4
- [ ] Audio system plays all 42 files correctly
- [ ] AI scoring returns results in <3 seconds
- [ ] All 11 tools integrated
- [ ] End-to-end venture completion works

---

## Post-V1 Roadmap (Not in 4-Week Plan)

These items are documented but NOT in V1 scope:
- Remaining 9 Super Bosses (12 total)
- Academic, Lab, Creative project templates
- Character creator with photo-to-pixel
- Inter-checkpoint gameplay (henchmen, treasure chests)
- Corruption mechanic and meter
- Collaborator matching algorithm
- AI tag suggestion
- Flare system (help requests)
- Weekly quests
- Leagues
- Mentor tier (Level 40+)

---

## Daily Standup Template

Use this for daily progress tracking:

**Yesterday**: [What was completed]
**Today**: [What will be worked on]
**Blockers**: [Any issues or dependencies]
**Asset Needs**: [Any assets needed from design team]
**Questions**: [Any open questions for team]

---

## Contact Points

**For Product Questions**: Refer to PRD v1.0 (Ship Scope)
**For Technical Architecture**: Refer to Implementation Guide
**For Content/Tasks**: Refer to `checkpoint_tasks_v3.xlsx`
**For Badges**: Refer to `achievement_badges.xlsx`
**For Levels**: Refer to `level_table_with_flare.xlsx`
**For Monster Lore**: Refer to `monsters_and_mechanics.xlsx`

---

*This 4-week plan is based on the Codebase and PRD version*
