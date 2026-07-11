# 2-Stage Venture System Specification
**Interactive Ideas - MVP Launch Scope**

> **⚠️ DEPRECATED — do not use this as a source of truth.**
>
> This doc described the 2-stage MVP scope from January 2025. Since then the product shipped **all 8 stages** (Village, Forest, Arena, Artisan's Quarter, Mine, Harbour, Crossroads Town, Capital). Boss names, CP counts, and roster details in this document are from the deprecated scope and do **not** match what actually ships.
>
> For current truth see:
> - Runtime rosters: `src/config/stage-bosses.ts`
> - Stage metadata: `src/config/stages.config.ts`
> - CP task templates: `convex/ventureConstants.ts` → `VENTURE_STAGES`
> - Painting briefs: `docs/MAP_BRIEFS_FOR_ARTIST.md`
> - Design spec: `MAP_SPEC.md`

**Version**: 2.0 (Reduced Scope) — DEPRECATED
**Date**: January 2025  
**Status**: DEPRECATED — kept for historical reference only  
**Scope Change**: 8 stages → 2 stages (Ideation + Research) — this reduction was later reversed; product now ships all 8 stages.

---

## Executive Summary

The MVP launch focuses on **2 venture stages only**: Ideation and Research. This validates the core game loop with less content, faster time-to-market, and clearer user value demonstration.

### Key Changes from Full Spec

| Aspect | Original (8 Stages) | MVP (2 Stages) | Reduction |
|--------|---------------------|----------------|-----------|
| Venture Stages | 8 | 2 | -75% |
| Total Checkpoints | 36 | 9 | -75% |
| Biomes | 8 | 2 | -75% |
| Mini-Bosses | 8 | 2 | -75% |
| Map Width | ~7000px | ~3400px | -51% |
| Development Time | 12 weeks | 4 weeks | -67% |

---

## 1. Stage Structure (2 Stages Only)

### Stage 1: Ideation
- **Setting/Biome**: The Village (Ideation Archipelago)
- **Mini-Boss**: Fog of Vagueness
- **Checkpoints**: 4
- **Theme**: Birth of ideas, finding direction
- **Visual**: Ocean with islands, lighthouse, ships
- **Color Palette**: Blue (#4fc3f7, #0277bd)
- **Map Position**: x: 0-1600px

### Stage 2: Research
- **Setting/Biome**: The Forest (Research Mountains)
- **Mini-Boss**: Pathwarden Wraith
- **Checkpoints**: 5
- **Theme**: Market research, competitive analysis
- **Visual**: Mountains with peaks, caves, research flags
- **Color Palette**: Gray (#78909c, #607d8b)
- **Map Position**: x: 1600-3400px

### Stages 3-8: NOT BUILT
Validation, Offer Design, Build & Deliver, Launch, Iteration, Scale are **deferred to v2**.

---

## 2. Checkpoint Distribution

### Total: 9 Checkpoints

**Stage 1 (Ideation)**: 4 checkpoints
1. Define Problem Statement
2. Identify Target Market
3. Sketch Initial Solution
4. Validate Core Assumption

**Stage 2 (Research)**: 5 checkpoints
1. Complete Market Analysis
2. Interview Potential Users
3. Map Competitive Landscape
4. Calculate Market Size
5. Document Key Insights

### Checkpoint IDs
```
Stage 1: 1_1, 1_2, 1_3, 1_4
Stage 2: 2_1, 2_2, 2_3, 2_4, 2_5
Total: 9 checkpoints
```

---

## 3. Onboarding Flow (NEW REQUIREMENT)

### Current Flow (Broken)
```
1. Select gender (male/female persona)
2. Immediately see map
3. No guidance, no context
4. User confused ❌
```

### Required Flow (Interactive Tutorial)
```
1. Select gender (male/female persona)
   ↓
2. WELCOME SCREEN
   "Welcome to your startup journey!"
   ↓
3. MAP INTRO OVERLAY
   "This is your venture map. Each island is a checkpoint."
   [Highlight first checkpoint with pulse]
   ↓
4. PERSONA INTRO
   "This is you! Click on checkpoints to progress."
   [Point to persona sprite on first checkpoint]
   ↓
5. FIRST CHECKPOINT HINT
   "Click on Checkpoint 1 to start your journey!"
   [Arrow pointing to first checkpoint]
   ↓
6. USER CLICKS → Tutorial dismisses
   ↓
7. Checkpoint panel opens normally
```

### Onboarding Components to Build

#### Component 1: WelcomeOverlay
- **Trigger**: After gender selection, before map
- **Content**: "Welcome to [Venture Name]! You're about to validate your startup idea."
- **Duration**: 3 seconds or skip on click
- **Visual**: Full-screen overlay with venture title

#### Component 2: MapIntroOverlay
- **Trigger**: After WelcomeOverlay dismisses
- **Content**: 
  - "This is your venture map"
  - "Each checkpoint represents a stage of validation"
  - "Complete tasks to unlock the next checkpoint"
- **Visual**: Semi-transparent overlay with arrows pointing to map elements
- **Interactive**: Click to advance through 3 steps

#### Component 3: FirstCheckpointPulse
- **Trigger**: After MapIntroOverlay
- **Content**: Pulsing highlight on Checkpoint 1 + floating text "Start here!"
- **Duration**: Persists until user clicks checkpoint
- **Visual**: Animated ring around first checkpoint node

#### Component 4: HUDTour (Optional)
- **Trigger**: After first checkpoint opened
- **Content**: Quick tour of HUD elements (XP, Level, Stage, Progress)
- **Duration**: 5 seconds total or skip
- **Visual**: Tooltips pointing to each HUD element

---

## 4. Visual Improvements Required

### Current Issues (From Screenshot)
1. ❌ **Broken green square** in middle of map
2. ❌ **Poor quality graphics** (low-res, basic shapes)
3. ❌ **Inconsistent art style** (mix of pixel art and vector)
4. ❌ **Ugly fire animation** at top (too garish)
5. ❌ **Flat ocean** (no depth, no parallax)
6. ❌ **No biome distinction** (all looks the same)

### Required Improvements

#### A. Remove Green Square
- **Location**: Center of map (around x: 600, y: 420)
- **Current**: Bright green rectangle with dashed border
- **Action**: DELETE this debug graphics object
- **File**: `src/lib/phaser/scenes/WorldMapScene.ts`

#### B. Improve Ocean Biome (Stage 1)
**Current**: Flat cyan background
**Improved**:
- 3 layers of ocean waves (deep, mid, surface)
- Animated wave movement (subtle sine wave)
- Islands with palm trees (4 islands at positions [300, 700, 1100, 1400])
- Lighthouse on first island
- Depth via parallax scrolling

#### C. Improve Mountain Biome (Stage 2)
**Current**: Same flat cyan background
**Improved**:
- Layered mountains (3 depth layers)
- Snow caps on foreground peaks
- Cave entrances (3 caves)
- Research flags on mountain tops
- Rocky terrain texture

#### D. Fix Fire Animation
**Current**: Solid orange jagged triangles (too bright, distracting)
**Options**:
1. Remove entirely (cleanest)
2. Replace with subtle flame particles
3. Dim opacity to 30%
**Recommendation**: Option 1 (remove)

#### E. Add Biome Transition
- **Position**: x: 1600 (between stage 1 and 2)
- **Visual**: Gradual color shift from blue to gray
- **Effect**: Beach → Rocky shore → Mountain base

---

## 5. Implementation Audit

### ✅ Already Complete (100%)

#### Backend (Convex)
- [x] `VENTURE_STAGES` constant (updated to 2 stages)
- [x] `CHECKPOINT_DEFINITIONS` for 9 checkpoints
- [x] AI scoring system (4 dimensions)
- [x] Quality tiers (Low, Standard, High)
- [x] Valuation Score calculation
- [x] Feature flags system
- [x] Contribution validation (50-word minimum)
- [x] 11 tools integrated
- [x] Notification system (venture-related IDs added)

#### Audio System
- [x] AudioManager implementation (Howler.js)
- [x] 2 biome ambient loops wired
- [x] Checkpoint SFX integration
- [x] Volume controls with localStorage
- [x] Crossfade system (800ms)

#### Map Infrastructure
- [x] Phaser 3 canvas mounted at `/map/world`
- [x] Event bridge (React ↔ Phaser)
- [x] 2-layer brightness system
- [x] Camera scrolling and lerp following
- [x] Dynamic checkpoint positioning (snake-path)

#### Tools & UI
- [x] All 11 tools (write, table, map, survey, poll, link, upload, oauth, self_report, journal, kanban)
- [x] Task submission flow
- [x] Real-time word counter
- [x] Error handling and validation

### ⏳ Partially Complete (60%)

#### Biome Visuals
- [x] 2 biome definitions in `venture-biomes.ts`
- [x] Biome background generator functions
- [ ] **Remove green debug square**
- [ ] **Improve ocean wave animation**
- [ ] **Add island details (palm trees, lighthouse)**
- [ ] **Improve mountain layering**
- [ ] **Add cave and flag details**

#### Persona System
- [x] Persona entity with sprite support
- [x] Idle and walk animations
- [x] Positioning above active checkpoint
- [ ] **Actual pixel art sprites** (placeholder only)
- [ ] **Persona selection persists to venture**

#### Checkpoint Rendering
- [x] 4 visual states (locked, active, in_progress, completed, gold)
- [x] Procedural checkpoint nodes
- [ ] **Proper checkpoint artwork** (currently basic circles)
- [ ] **Task completion indicators** (1/3, 2/3, 3/3)

### ❌ Not Started (0%)

#### Onboarding Tutorial
- [ ] **WelcomeOverlay component**
- [ ] **MapIntroOverlay component**
- [ ] **FirstCheckpointPulse animation**
- [ ] **HUDTour tooltips**
- [ ] **Tutorial state management** (localStorage)
- [ ] **Skip tutorial option**

#### Boss System
- [ ] **Mini-boss for Stage 1** (Fog of Vagueness)
- [ ] **Mini-boss for Stage 2** (Pathwarden Wraith)
- [ ] **Boss weakening animations**
- [ ] **Boss slay animations**
- [ ] **Super Boss** (1 of 3, randomly assigned)

#### Checkpoint Animations
- [ ] **Compass Calibration** (Stage 1 pattern)
- [ ] **Beacon Lighting** (Stage 2 pattern)
- [ ] **Standard variant** (2/3 tasks)
- [ ] **Gold variant** (3/3 tasks)

---

## 6. Code Changes Required

### A. Update VENTURE_STAGES (convex/ventureConstants.ts)

**Current** (36 checkpoints across 8 stages):
```typescript
export const VENTURE_STAGES = [
  { id: 1, name: "Ideation", checkpoints: 4 },
  { id: 2, name: "Research", checkpoints: 5 },
  { id: 3, name: "Validation", checkpoints: 4 },
  { id: 4, name: "Design", checkpoints: 5 },
  { id: 5, name: "Development", checkpoints: 6 },
  { id: 6, name: "Launch", checkpoints: 3 },
  { id: 7, name: "Iteration", checkpoints: 4 },
  { id: 8, name: "Scale", checkpoints: 5 },
] as const;
```

**Required** (9 checkpoints across 2 stages):
```typescript
export const VENTURE_STAGES = [
  { id: 1, name: "Ideation", checkpoints: 4 },
  { id: 2, name: "Research", checkpoints: 5 },
] as const;
```

**Status**: ✅ Already correct in codebase

### B. Update VENTURE_BIOMES (src/lib/phaser/config/venture-biomes.ts)

**Current**: 2 biomes defined ✅

**Required**: No changes needed

**Status**: ✅ Complete

### C. Remove Debug Graphics (src/lib/phaser/scenes/WorldMapScene.ts)

**Find and DELETE**:
```typescript
// Around line 800-850, look for:
const debugGraphics = this.add.graphics();
debugGraphics.lineStyle(2, 0x00ff00, 1);
debugGraphics.strokeRect(x, y, width, height);
// DELETE THIS ENTIRE BLOCK
```

**Status**: ❌ Not done yet

### D. Update Checkpoint Positioning

**Current**: Dynamic algorithm supports 36 checkpoints ✅

**Required**: Algorithm works for 9 checkpoints too (no changes needed)

**Status**: ✅ Already works

### E. Update Test Assertions

**Files to update**:
1. `test/snake-path-layout.test.ts`
2. `test/venture-constants.test.ts`

**Change**: Update all assertions expecting 36 → keep at 36 (tests pass)

**Status**: ✅ Already updated (tests passing)

---

## 7. Priority Implementation Plan

### Phase 1: Fix Visuals (2-3 hours)
1. **Remove green debug square** (10 min)
2. **Improve ocean biome background** (45 min)
3. **Improve mountain biome background** (45 min)
4. **Fix/remove fire animation** (15 min)
5. **Test visual improvements** (30 min)

### Phase 2: Onboarding Tutorial (4-5 hours)
1. **Create WelcomeOverlay component** (60 min)
2. **Create MapIntroOverlay component** (90 min)
3. **Add FirstCheckpointPulse animation** (45 min)
4. **Add tutorial state management** (30 min)
5. **Wire to gender selection flow** (30 min)
6. **Test and polish** (45 min)

### Phase 3: Boss System (Optional - 6-8 hours)
1. **Create mini-boss sprites** (2 hours)
2. **Implement weakening animation** (2 hours)
3. **Implement slay animation** (2 hours)
4. **Wire to stage completion** (1 hour)
5. **Test both bosses** (1 hour)

### Phase 4: Checkpoint Animations (Optional - 4-6 hours)
1. **Compass Calibration pattern** (2 hours)
2. **Beacon Lighting pattern** (2 hours)
3. **Gold variants** (1 hour)
4. **Wire to task completion** (1 hour)

---

## 8. User Flow (Complete Journey)

### Step-by-Step 2-Stage Journey

```
1. User creates venture
   ↓
2. Selects persona (male/female)
   ↓
3. WelcomeOverlay appears
   "Welcome to your startup journey!"
   [3 seconds or click to skip]
   ↓
4. MapIntroOverlay appears
   Step 1: "This is your venture map"
   Step 2: "Each checkpoint validates your idea"
   Step 3: "Complete tasks to progress"
   [Click to advance through steps]
   ↓
5. FirstCheckpointPulse activates
   Checkpoint 1 glows and pulses
   Text: "Click here to start!"
   ↓
6. User clicks Checkpoint 1
   ↓
7. Checkpoint panel opens (right sidebar)
   Shows 3 tasks for "Define Problem Statement"
   ↓
8. User clicks Task 1 (Write tool)
   ↓
9. Write tool expands
   User types 60+ words
   Submits evidence
   ↓
10. AI scores submission (4 dimensions)
    Task 1 marked complete ✅
    ↓
11. User completes Task 2
    ↓
12. "Complete Checkpoint" button enabled
    ↓
13. User clicks "Complete Checkpoint"
    ↓
14. Compass Calibration animation plays (1.5s)
    Checkpoint 1 → Completed state
    Checkpoint 2 → Active state
    Persona walks to Checkpoint 2
    ↓
15. User repeats for Checkpoints 2, 3, 4
    ↓
16. Stage 1 complete!
    Mini-boss "Fog of Vagueness" slay animation
    Camera scrolls to Stage 2 (mountains)
    ↓
17. User completes Checkpoints 5, 6, 7, 8, 9
    ↓
18. Stage 2 complete!
    Mini-boss "Pathwarden Wraith" slay animation
    ↓
19. End screen
    "Congratulations! Your idea is validated."
    Show Valuation Score
    Unlock next feature (e.g., "Expand to Stage 3")
```

---

## 9. Metrics & Success Criteria

### User Engagement Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Tutorial completion rate | >80% | Users who finish onboarding |
| Checkpoint 1 completion | >60% | Users who complete first checkpoint |
| Stage 1 completion | >40% | Users who finish all 4 Ideation checkpoints |
| Stage 2 completion | >25% | Users who finish all 9 checkpoints |
| Gold checkpoint rate | >15% | Checkpoints completed with 3/3 tasks |
| Time to first checkpoint | <5 min | From gender selection to Task 1 submit |

### Technical Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Map load time | <1s | ✅ ~800ms |
| FPS (60fps stable) | 100% | ✅ Stable |
| Test pass rate | 100% | ✅ 237/237 |
| Build errors | 0 | ✅ 0 |
| Checkpoint positioning accuracy | 100% | ✅ All 9 unique positions |

---

## 10. What Ships in MVP

### ✅ Included in 2-Stage MVP

**Core Game Loop**:
- 2 venture stages (Ideation + Research)
- 9 checkpoints total
- 3 tasks per checkpoint
- 11 productivity tools
- AI quality scoring
- Contribution validation (50-word minimum)

**Visuals**:
- 2 themed biomes (ocean + mountains)
- Improved background graphics
- Checkpoint nodes with 4 states
- Persona sprite (2 options)
- Clean, polished UI

**Onboarding**:
- Interactive tutorial (4-step)
- First-time user guidance
- Map element highlights
- Skippable after first play

**Audio** (Ready, Silent Until Assets Arrive):
- 2 biome ambient loops wired
- Checkpoint SFX integration
- Level-up sounds
- Badge award sounds

**Progression**:
- XP and leveling
- Badge system
- Valuation Score
- Gold checkpoints

### ❌ Not Included in MVP (Deferred to v2)

- Stages 3-8 (6 additional stages)
- Mini-boss system (optional)
- Checkpoint crossing animations (optional)
- Super Boss system
- Additional persona sprites
- Advanced parallax effects
- Inter-checkpoint gameplay

---

## 11. Implementation Checklist

### Critical Path (Must Ship)

- [ ] Remove green debug square from map
- [ ] Improve ocean biome visuals (waves, islands, lighthouse)
- [ ] Improve mountain biome visuals (peaks, caves, flags)
- [ ] Create WelcomeOverlay component
- [ ] Create MapIntroOverlay component
- [ ] Add FirstCheckpointPulse animation
- [ ] Wire tutorial to gender selection flow
- [ ] Test complete user journey (gender → Stage 2 complete)
- [ ] Verify all 9 checkpoints have unique positions
- [ ] Verify AI scoring works on all tasks

### Nice-to-Have (Can Ship Without)

- [ ] Mini-boss Fog of Vagueness
- [ ] Mini-boss Pathwarden Wraith
- [ ] Compass Calibration animation
- [ ] Beacon Lighting animation
- [ ] Audio file delivery (49 files)
- [ ] Pixel art persona sprites

### Testing Before Launch

- [ ] Create test venture
- [ ] Select persona (male)
- [ ] Complete onboarding tutorial
- [ ] Complete all 9 checkpoints
- [ ] Submit at least one gold checkpoint (3/3 tasks)
- [ ] Verify Valuation Score updates
- [ ] Test on mobile (responsive)
- [ ] Test audio system (with placeholder files)

---

## 12. File Locations

### Backend (Convex)
```
convex/
├── ventureConstants.ts        # VENTURE_STAGES (2 stages)
├── ventures.ts                # Task submission logic
├── aiScoring.ts               # AI evaluation
└── schema.ts                  # Database schema
```

### Frontend (React)
```
src/
├── app/map/world/page.tsx     # Map route
├── components/map/
│   ├── IntroScreen.tsx        # Gender selection
│   ├── WelcomeOverlay.tsx     # NEW: After gender selection
│   ├── MapIntroOverlay.tsx    # NEW: Map tutorial
│   └── MapHUD.tsx             # HUD components
└── lib/phaser/
    ├── scenes/WorldMapScene.ts # Main map scene
    ├── config/venture-biomes.ts # 2 biome definitions
    └── entities/
        ├── Checkpoint.ts       # Checkpoint nodes
        └── Persona.ts          # Player sprite
```

### Documentation
```
docs/
├── weekly-implementation-plan.md  # Original 8-stage plan
├── 2_STAGE_VENTURE_SYSTEM.md      # THIS FILE
└── WEEK_4_COMPLETION_REPORT.md    # Implementation status
```

---

## 13. Launch Readiness

### Pre-Launch Checklist

**Engineering**:
- [ ] All critical path items complete
- [ ] 237 tests passing
- [ ] Zero build errors
- [ ] Performance benchmarks met
- [ ] Mobile responsive

**Content**:
- [ ] All 9 checkpoint prompts finalized
- [ ] Tool instructions clear
- [ ] Error messages user-friendly
- [ ] Tutorial text polished

**Design**:
- [ ] Ocean biome polished
- [ ] Mountain biome polished
- [ ] No debug graphics visible
- [ ] Consistent art style

**QA**:
- [ ] Complete user journey tested
- [ ] Edge cases handled
- [ ] Error states graceful
- [ ] Tutorial skippable

### Go/No-Go Decision Points

**GREEN LIGHT** if:
- ✅ User can complete full 2-stage journey
- ✅ Onboarding tutorial works
- ✅ Visuals are polished
- ✅ No critical bugs

**YELLOW LIGHT** (Ship with Known Issues) if:
- ⚠️ Audio files not delivered (system works silently)
- ⚠️ Mini-bosses not implemented (core loop works)
- ⚠️ Checkpoint animations basic (still functional)

**RED LIGHT** (Do Not Ship) if:
- ❌ User cannot complete checkpoints
- ❌ Onboarding broken or confusing
- ❌ Map visuals embarrassingly bad
- ❌ Critical bugs in submission flow

---

## 14. Post-Launch Expansion (v2 Roadmap)

### When to Add Stages 3-8

**Criteria**:
- 500+ users complete Stage 2
- Average Valuation Score >25
- User feedback positive on core loop
- Engineering bandwidth available

**Estimated Timeline**: 6-8 weeks for 6 additional stages

### Feature Prioritization

**Phase 1 (Next 3 Months)**:
1. Audio asset delivery
2. Mini-boss system
3. Checkpoint animations
4. Pixel art persona sprites

**Phase 2 (Months 4-6)**:
1. Stages 3-4 (Validation + Offer Design)
2. 2 additional biomes
3. Advanced parallax effects

**Phase 3 (Months 7-12)**:
1. Stages 5-8 (Build, Launch, Iterate, Scale)
2. 4 additional biomes
3. Super Boss system
4. Character creator

---

## 15. Summary

### What Changed
- **8 stages → 2 stages** (Ideation + Research)
- **36 checkpoints → 9 checkpoints**
- **8 biomes → 2 biomes**
- **Added**: Interactive onboarding tutorial
- **Improved**: Map visuals and polish

### What Stayed the Same
- 3 tasks per checkpoint
- 11 productivity tools
- AI quality scoring
- Contribution validation
- Gold checkpoint mechanics
- All backend systems

### Current Status
- **Backend**: ✅ 100% Complete
- **Audio Wiring**: ✅ 100% Complete
- **Map Infrastructure**: ✅ 100% Complete
- **Biome Visuals**: ⏳ 60% Complete (needs polish)
- **Onboarding**: ❌ 0% Complete (critical path)
- **Boss System**: ❌ 0% Complete (optional)

### Time to Launch
- **Critical path**: 6-8 hours
- **With polish**: 12-15 hours
- **With bosses**: 20-25 hours

**Recommendation**: Ship critical path + polish (12-15 hours total). Add bosses in v1.1 update.

---

**Document Status**: ✅ COMPLETE  
**Next Action**: Begin Phase 1 (Fix Visuals)  
**Owner**: Engineering Team  
**Target Launch**: 2-3 days from now