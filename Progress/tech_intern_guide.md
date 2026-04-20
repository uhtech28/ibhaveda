# Interactive Ideas — Tech Intern Onboarding Guide


*Prepared from PRD v1.0 (Ship Scope), Game Mechanics PRD v1.0, Implementation Guide, and all supporting design documents — April 2026*

---

## 1. What Is This Product?

Interactive Ideas is a **gamified project incubation platform** for Indian college students. The core premise: real intellectual work — building startups, writing academic papers, running experiments, creating art — becomes the actual gameplay in a 2D sidescroller RPG world.

This is not a productivity app with game badges bolted on. The work **is** the game. Completing a checkpoint is crossing a sealed gate. Leaving a project idle corrupts the world. Finishing a stage slays a monster that has been building in silhouette since day one.

There are four project templates: **Venture** (8 stages), **Academic** (6 stages), **Lab/Experimental** (7 stages), and **Creative** (6 stages). Each has its own world skin, stage monsters, and AI quality metric. V1 ships with Venture only.

The tech stack you're working with: **Next.js 15.5.7**, **React 19.1.0**, **Convex** (real-time DB with 28 core tables), **Clerk** (auth), **Tailwind CSS 4**, **Framer Motion 12.23.12**, **Phaser 3** (game engine — to be integrated), and **Howler.js** (audio — to be integrated).

---

## 2. What Is Already Built

Before writing a single line of code, you need to know what exists. The codebase is substantial.

**Core infrastructure** is complete: Next.js with App Router, Convex real-time database, Clerk auth with modal flows, Tailwind CSS 4 with dark mode, Radix UI primitives, Framer Motion, Convex Storage, real-time chat/notification subscriptions, Vitest with 60+ passing tests, and Turbopack build config.

**The Venture system** is fully specced: all 8 stages, 36 checkpoints, 3 tasks per checkpoint (T1/T2/T3), evidence submission, and progress persistence. The stage-monster lore and boss system are designed. What the checkpoint tasks actually *are* is documented in `checkpoint_tasks_v3.xlsx` — this is the content bible for every task across all 4 templates.

**The gamification framework** is live: 50 levels across 5 phases, 62 badges in 7 categories, points economy with wallet and transaction history, daily streak tracking, leaderboard, and Level 40+ mentorship system. The full level table (with timing projections for active vs. power users) is in `level_table_with_flare.xlsx`.

**Social features** are complete: idea creation/editing/liking, contribution requests and invites, real-time direct and group chat, Flares (help requests), notifications, and user search.

**9 of 11 task tools** work: Write, Table, Map/Canvas, Survey, Poll, Link, Upload, OAuth, and Self-report. **Journal, Kanban, and Calendar exist in the codebase but are not yet integrated into the Venture system.**

**What's NOT built yet** (per PRD v1.0 ship scope): Phaser 3 game engine integration, the world map rendering, persona sprites, boss animations, checkpoint crossing animations, the HUD, the audio system, AI quality scoring, and the brightness/lighting system. These are your domain.

---

## 3. The V1 Ship Scope — What Gets Built First

The V1 spec is explicit: **every item in the spec ships; everything not in the spec does not.** This is your north star as an intern. Do not scope-creep. Do not build V2 features while V1 items are incomplete.

Here is what V1 includes by domain:

**Project**: Venture only. All 8 stages. Full checkpoint structure. 3-task gate (advance on 2/3, gold on 3/3). Project creation with manual tag selection (no AI suggestions in V1).

**World Map**: Phaser 3 canvas at `/map` route. Snake-path overworld with 8 biome zones. Checkpoint nodes in 4 states: locked, active, partial, standard-complete, gold-complete. The two-layer brightness system (see Section 5). Biome skins for all 8 Venture stages.

**Personas**: 2 sprites only (male and female). 32×48px native, rendered at 96×144px (3× nearest-neighbour). Idle animation (4 frames) and walk cycle (6 frames). Selected once at project creation.

**Boss System**: 3 Super Bosses built (The Unraveller, The Pale Architect, The Gravemind). 8 stage mini-bosses (one per Venture stage: Fog of Vagueness, Pathwarden Wraith, Advocate of Comfortable Lies, Unfinished Golem, Collapse Specter, Harbourmaster of Hesitation, Babel Merchant, Iron Bureaucrat). Boss animation intensity is **standardised** — not scaled by AI quality score in V1.

**Checkpoint Animations**: All 6 pattern types with standard and gold variants. Seal Break, Rune Inscription, Beacon Lighting, Bridge Repair, Compass Calibration, Ward Placement. No inter-checkpoint gameplay in V1.

**AI Scoring**: 4-dimension scoring (completeness, specificity, evidence, originality, 0–3 each). Maps to Valuation Score shown to users. Open-weight model for free tier; frontier model (GPT-4 / Claude) for Explorer Pro.

**Progression Animations (frontend only — backend already exists)**: XP bar fill, level-up sequence, badge award sequence with rarity variants.

**Collaboration & Social**: Wire up contribution requirement at checkpoint and stage completion. Gold checkpoint fires community feed notification.

**Tools**: All 11 tools integrated (including Journal, Kanban, Calendar).

**HUD**: XP bar, level, stage name, checkpoint progress, streak counter, Valuation Score, audio toggle.

**Audio**: 8 ambient biome loops, 12 checkpoint SFX (6 patterns × 2), level-up fanfare, badge award SFX per rarity, 3 Super Boss entrance themes, 8 mini-boss stage themes, UI action SFX. All via Howler.js.

**NOT in V1**: Remaining 9 Super Bosses, other project templates, character creator, photo-to-pixel, inter-checkpoint gameplay (henchmen, treasure chests), Corruption mechanic/meter, collaborator matching algorithm, AI tag suggestion, Flare system, weekly quests, leagues, Mentor tier (Level 40+).

---

## 4. Your Priority Build Order

Based on dependencies, this is the sequence that makes architectural sense. Each item unblocks the next.

### Priority 1 — Foundation (Do This First)

**Phaser 3 Integration** is the dependency everything visual sits on. Nothing else renders without it.

- Install `phaser@^3.80.1` via npm
- Create `src/lib/phaser/game-config.ts` — core Phaser configuration
- Build the React-Phaser event bridge (`src/lib/phaser/utils/event-bridge.ts`) — this is critical; React dispatches actions to Phaser via global event emitter, Phaser sends state updates back via callbacks
- Implement canvas mounting at `/map` route with proper cleanup
- Set up camera and viewport management
- Performance target: 60 FPS desktop, 30+ FPS mobile

The file structure to create:
```
src/lib/phaser/
├── game-config.ts
├── scenes/
│   ├── WorldMapScene.ts
│   ├── CheckpointScene.ts
│   └── BossScene.ts
├── entities/
│   ├── Persona.ts
│   ├── Checkpoint.ts
│   └── Boss.ts
└── utils/
    ├── event-bridge.ts
    └── asset-loader.ts
```

**Two-Layer Brightness System** — once the canvas renders, implement this before anything else that touches world state. It drives the entire visual progression feel (see Section 5 for the full formula).

### Priority 2 — World Map Rendering

With Phaser running, build the world map:

- Snake-path layout with 8 biome zones rendered left to right
- Checkpoint nodes: locked / active / partial / standard-complete / gold-complete states
- Checkpoint node sprites: 64×64px, 3 states + gold variant
- Boss silhouettes at end of each stage band
- Super Boss silhouette at far right of map (15% opacity from project start)
- Horizontal camera scroll with smooth following
- Persona sprite floating above active checkpoint node (idle animation)
- Walk animation during stage transition scroll

Asset specifications to brief to the design team:
- 8 biome backgrounds at 2048×512px (scrolling parallax)
- Checkpoint nodes: locked, active, standard-complete, gold-complete (64×64px each)
- Path/road tileset
- 3 Super Boss silhouettes (256×256px minimum)
- 8 mini-boss stage silhouettes

### Priority 3 — HUD System

The HUD is persistent across all pages when a project is active. Build it as a React component layer above the Phaser canvas.

Jotai atoms to implement:
```typescript
// src/lib/stores/hudStore.ts
export const hudVisibleAtom = atom(true);
export const activeVentureAtom = atom<Venture | null>(null);
export const corruptionAtom = atom(0);
export const qualityScoreAtom = atom(0);
```

Components to build (`src/components/hud/`): `HUD.tsx`, `XPBar.tsx`, `LevelDisplay.tsx`, `StageInfo.tsx`, `CheckpointProgress.tsx`, `StreakCounter.tsx`, `QualityScore.tsx`, `AudioControls.tsx`.

Note: The Corruption Meter component exists in the full spec but the **Corruption mechanic is NOT in V1**. Build the HUD slot for it but leave it as a placeholder.

Responsive behaviour: Full HUD along top edge on desktop → condensed with collapsible sections on tablet → minimal bar with tap-to-expand on mobile.

### Priority 4 — Checkpoint Crossing Animations

Six patterns, two variants each (standard and gold). These run as Phaser scenes.

```
src/lib/phaser/scenes/animations/
├── SealBreakAnimation.ts
├── RuneInscriptionAnimation.ts
├── BeaconLightingAnimation.ts
├── BridgeRepairAnimation.ts
├── CompassCalibrationAnimation.ts
└── WardPlacementAnimation.ts
```

Timing rules: standard animations 1.5–2.5 seconds, gold animations 2.5–3.5 seconds. All skippable after 0.5 seconds (except Legendary badge awards).

Venture stage-to-pattern mapping: S1 Seal Break, S2 Rune Inscription, S3 Beacon Lighting, S4 Bridge Repair, S5 Compass Calibration, S6 Ward Placement, S7 Beacon Lighting, S8 Seal Break.

### Priority 5 — Progression Animations

These are React/Framer Motion, not Phaser. The backend already handles point calculation and level tracking — you are building the frontend animation layer only.

**Level-Up Sequence** (2s total, skippable after 0.5s):
1. Screen edge burst — 0.3s, purple accent flash from edges
2. Level counter spin — 0.5s, number spins old → new with bounce easing
3. Title fade-in — 0.4s, new level title with gold glow
4. Phase transition — 1.2s (only at boundaries: 6→7, 15→16, 28→29, 39→40), shows world map area unlock
5. Tool/ability cards — 0.8s, floating cards for new unlocks

**Badge Award Sequence** (auto-dismiss at 4s):
1. Interrupt flash — 0.1s white overlay
2. Badge materialises — 0.6s drops from top, bounces to centre at 200% then settles to 100%
3. Reveal card — 0.4s fade, shows name/tagline/rarity
4. Auto-dismiss or tap

Legendary badges: add full-screen gold particle burst before flash, persist until manually dismissed.

### Priority 6 — Audio System (Howler.js)

Install `howler@^2.2.4` and `@types/howler@^2.2.11`.

```typescript
// src/lib/audio/audioManager.ts
// src/lib/stores/audioStore.ts
```

Audio categories to implement: 8 stage ambience loops (crossfade 800ms on transition), 12 checkpoint SFX, 3 Super Boss entrance themes, mini-boss stage themes, level-up and badge fanfares (5 rarity tiers), UI action SFX (click, hover, confirm, error).

Critical browser requirement: **defer audio initialisation until first user interaction** — this is a browser autoplay policy requirement, not optional.

Audio controls persist via localStorage: Master Volume, Music Volume (ambience + boss themes), SFX Volume (UI + checkpoints + level-ups).

Total audio files needed for V1: approximately 42. Format: MP3 primary, OGG fallback for Firefox. 128kbps for ambience, 192kbps for music/themes.

### Priority 7 — AI Quality Scoring

Backend integration for task submission evaluation.

```typescript
// convex/ai/scoring.ts
export async function evaluateTaskSubmission(
  content: string,
  checkpointOutcome: string,
  userTier: "free" | "pro"
)
```

4 dimensions: completeness, specificity, evidence, originality (0–3 each, total 0–12). Quality tiers: Low (0–4), Standard (5–8), High (9–12). Tier increments Valuation Score — the only AI output the user sees in V1.

Free tier: open-weight model (Llama 3, Mistral via Replicate or HuggingFace). Explorer Pro: frontier model (GPT-4 or Claude 3.5). Boss animation is NOT scaled by quality score in V1.

New database tables needed: `qualityScores`, `aiEvaluations`.

### Priority 8 — Tool Integration (Journal, Kanban, Calendar)

These three exist in the codebase but aren't venture-integrated. Wire them up to the checkpoint task system so they can be assigned as tool types in checkpoint tasks.

---

## 5. The Brightness System — Understand This Cold

This is the most nuanced system you'll implement. It drives the entire visual progression of the world map and is calculated from data already in the backend — no additional state needed.

| Layer | Source Signal | Formula | Range | Resets? |
|---|---|---|---|---|
| Accumulated base | Fully completed prior stages | `completed_stages × 8.57%`, capped at 60% | 0%–60% | Never |
| Stage layer | Task completion % in current stage | `tasks_done / tasks_total × 40%` | 0%–40% | Yes, on new stage entry |
| **World brightness** | Sum of both | `accumulated_base + stage_layer` | **0%–100%** | — |

**Worked examples to keep at your desk:**

- Stage 1 start: `0% + 0% = 0%` (darkest state — world is at its bleakest)
- Entering Stage 2 after completing Stage 1: `8.57% + 0% = 8.57%`
- Mid-Stage 5, 50% tasks done: `(4 × 8.57%) + (50% × 40%) = 34.28% + 20% = 54.28%`
- Final stage fully complete: `(7 × 8.57%) + 40% = 60% + 40% = 100%` (full brightness)

This drives a **single Phaser post-processing filter** — brightness/contrast. No per-biome custom logic. The filter applies globally to the canvas.

---

## 6. The Checkpoint & Task System — Content Reference

Every task at every checkpoint is documented in `checkpoint_tasks_v3.xlsx`. This is the content you'll be wiring into the system. A few things to know:

**Point weights within a checkpoint**: T1 Easy = 20%, T2 Medium = 20%, T3 Stretch = 35%, Gold bonus = +25% on top of full completion. The asymmetry is intentional — T1+T3 earns more points than T1+T2, pushing users toward stretch tasks.

**Advance condition**: 2 of 3 tasks completed. Gold condition: all 3. The AI scoring evaluates quality but does **not** gatekeep advancement.

**Tool types per task**: Each task is associated with a specific tool (Write, Table, Map/Canvas, Survey, Poll, Link, Upload, Self-report, Journal, Kanban, Calendar). When wiring checkpoint tasks to the system, the tool type determines which editor/interface the user sees.

**Contribution requirement**: Required text or media post before any checkpoint can be marked complete. Contribution formats: text (min 50 words), audio, video, image, or file (PDF, PPT, XLS, DOC).

**Gold checkpoint community event**: When a user earns a gold checkpoint (3/3 tasks), this fires a community feed notification. Wire this into the existing notification system.

---

## 7. The Boss System — Lore and Mechanics

There are two boss tiers in V1.

**Super Bosses (3 of 12 in V1)**: Randomly assigned at project creation. Persists for the full project lifespan.

| Boss | Type | Represents | Defeated by |
|---|---|---|---|
| The Unraveller | Ancient Void Serpent | Doubt, loss of direction | Weaving final stage into coherent whole |
| The Pale Architect | Undead Perfectionist Titan | Paralysis, perfectionism | Shipping something imperfect |
| The Gravemind | Necromantic Hive Intelligence | Fear of failure | Each completed checkpoint buries one past failure |

Super Boss animation states: **Silhouette** (project created, 15% opacity at far right) → **Present** (Stage 5 entered, 50% opacity, slow idle) → **Foreground** (Stage 7 entered, 100% opacity) → **Slay** (all stages complete, gold path: unique per-boss cinematic 3–4s unskippable) / **Retreat** (standard path: shared 2s retreat animation).

**Stage Mini-Bosses (8, one per Venture stage)**: Weaken visually as checkpoints are completed within that stage. Slay on stage complete, retreat on partial stage complete. See `monsters_and_mechanics.xlsx` for full lore and weakening behaviour per checkpoint hit.

Important: **Boss animation intensity is standardised in V1.** All users with the same completion state see the same animation. The Valuation Score is the only visible output of AI scoring.

---

## 8. The Badge and Level System — Don't Reinvent It

The backend for both is already live. Your job is the **frontend animation layer** and ensuring the trigger conditions connect to the existing backend events.

**62 badges across 7 categories**: Onboarding (8, Common/Uncommon), Idea Milestones (18, Common→Legendary), Community (12, Common→Epic), Consistency (8, Common→Epic), Hidden (8, not visible until earned), Aspirational (8, all Legendary). The full list with hex colours, icon descriptions, taglines, and requirements is in `achievement_badges.xlsx`.

**50 levels across 5 phases**: Tutorial (1–6, task-gated), Early (7–15), Mid (16–28), Senior (29–39), Mentor (40–50). Full level requirements, point thresholds, and timing projections are in `level_table_with_flare.xlsx`. The Flare mechanic appears at Level 5 — note the Flare system is **not in V1 scope** but the level requirement references it. Flag this discrepancy to the team.

---

## 9. Database Changes You Need to Make

These new tables are required and are not yet created:

```typescript
// New tables
qualityScores         // AI evaluation outputs per stage
aiEvaluations         // Per-task scoring details
skillTaxonomy         // Fixed skill tag taxonomy
industryTaxonomy      // Fixed industry tag taxonomy
collaboratorMatches   // (not in V1, but schema is documented)
featureFlags          // For phased rollout
```

These existing tables need modification:

```typescript
// ventures table additions
projectType: v.union(v.literal("venture"), v.literal("academic"), v.literal("lab"), v.literal("creative"))
personaId: v.optional(v.number())  // 1-10, only 1-2 in V1
qualityScore: v.optional(v.number())

// ideas table additions
aiGeneratedTitle: v.optional(v.string())
aiSuggestedSkills: v.optional(v.array(v.string()))
aiSuggestedIndustries: v.optional(v.array(v.string()))

// users table additions
isOnline: v.optional(v.boolean())
lastSeenAt: v.optional(v.number())
```

---

## 10. Environment Variables to Add

```bash
# AI Models
OPENAI_API_KEY=xxx        # Frontier model (Pro tier)
REPLICATE_API_KEY=xxx     # Open-weight model (Free tier)

# Already exist — verify these are configured
CONVEX_DEPLOYMENT=xxx
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=xxx
CLERK_SECRET_KEY=xxx
```

---

## 11. Dependencies to Install

```json
{
  "dependencies": {
    "phaser": "^3.80.1",
    "howler": "^2.2.4"
  },
  "devDependencies": {
    "@types/howler": "^2.2.11",
    "@playwright/test": "^1.45.0",
    "storybook": "^8.0.0",
    "@storybook/react": "^8.0.0"
  }
}
```

---

## 12. Feature Flags — Use These for Everything

All new features should be behind feature flags. The `featureFlags` table (to be created) tracks these:

```typescript
featureFlags: defineTable({
  flag: v.string(),
  enabled: v.boolean(),
  rolloutPercentage: v.number(),  // 0-100
  enabledForUsers: v.array(v.id("users")),
})
```

V1 flags to implement: `phaser_world_map`, `ai_quality_scoring`, `persona_system`, `audio_system`. Post-V1 flags (don't build yet): `academic_template`, `lab_template`, `creative_template`, `ai_matching`.

Recommended rollout: deploy backend changes → enable at 5% → monitor → gradually increase to 100% over 2 weeks → remove flags.

---

## 13. Open Questions — Know These Before Your First Team Meeting

These are unresolved decisions from the PRD. You don't need to answer them — you need to know they exist so you don't accidentally build a solution that pre-empts a decision.

**Photo-to-Pixel Pipeline**: Client-side (Canvas + WebGL) vs server-side (Pillow + dithering). The PRD recommendation is server-side. Not in V1 — but ask where this stands.

**AI Quality Score Calibration**: The gap between free and Pro AI scoring must feel meaningful to drive upgrades. This requires a dedicated A/B testing sprint — not just swapping model endpoints. The calibration work hasn't happened yet.

**Boss Difficulty Scaling Formula** (post-V1): The exact formula for mapping cumulative quality score to boss HP reduction needs playtesting. Too steep = trivial, too flat = unrewarding. Target sweet spot: high quality shortens boss fight by 40–60%.

**Community Visibility of Gold Checkpoints**: Options are in-world map event, community feed item, push notification, or all three. Recommended: all three. No decision confirmed yet.

**Contribution Verification**: Whether to add AI plagiarism detection at the contribution layer. Minimum viable approach for V1 is word count check (50+ words) and image hash uniqueness.

---

## 14. What to Do in Your First Week

**Day 1–2**: Read the PRD v1.0 (Ship Scope) document front to back. Read the Implementation Guide (the long PDF you've been given). Open the codebase and orient yourself — find the existing Convex tables, Clerk auth flows, and the 9 working tools. Don't touch anything yet.

**Day 3**: Install Phaser 3. Get a canvas rendering on the `/map` route — even a blank canvas with a test rectangle. This is your proof of life for the integration. Build the React-Phaser event bridge as your first real deliverable.

**Day 4**: Implement the two-layer brightness system (Section 5). This is a single Phaser post-processing filter driven by backend data. Test it against the worked examples in this document.

**Day 5**: Start on checkpoint node rendering — the 4 visual states (locked, active, standard-complete, gold-complete) on a stub snake path. These are your visual atoms.

**End of week 1 goal**: Phaser canvas is mounted, brightness system is wired to real backend data, and checkpoint nodes render in their correct states based on actual project progress.

---

## 15. Asset Requirements to Communicate to Design

You'll need to coordinate with whoever handles visual and audio assets. Here is what V1 requires — give them this list early, because asset production is the most common blocker on game projects.

**Graphics (V1 minimum)**:
- 2 persona sprite sheets (32×48px native): idle animation (4 frames) + walk cycle (6 frames), male and female
- 8 biome background images (2048×512px scrolling parallax): Village, Forest, Arena, Artisan's Quarter, Mine, Harbour, Crossroads Town, Capital
- Checkpoint node sprites: locked, active, standard-complete, gold-complete (64×64px each)
- Path/road tileset
- 3 Super Boss silhouettes (256×256px): The Unraveller, The Pale Architect, The Gravemind
- 8 mini-boss stage silhouettes (one per Venture stage)
- Gold burst particle sprite sheet
- Level-up explosion sprite

**Audio (V1 minimum)**:
- 8 ambient biome loops (2–3 minute loopable): Village, Forest, Arena, Quarry, Mine, Harbour, Crossroads, Capital
- 12 checkpoint SFX (6 patterns × 2 variants): standard and gold for each of Seal Break, Rune Inscription, Beacon Lighting, Bridge Repair, Compass Calibration, Ward Placement
- 3 Super Boss entrance themes (4 seconds each)
- 8 mini-boss stage themes (one per Venture stage)
- Level-up fanfare (2 seconds)
- Badge award SFX: 5 variants (Common through Legendary)
- UI action SFX: click, confirm, error (hover optional in V1)

Format: MP3 primary, OGG fallback. 128kbps ambience, 192kbps music.

---

## 16. The Design Philosophy — Why It Matters for Technical Decisions

This is worth understanding deeply, not just as background context, but because it should inform every technical trade-off you make.

Every design decision in this product reinforces one principle: **the work is the quest, not a metaphor for the quest.** Checkpoints are sealed gates. Quality degrades the forces working against you. Collaboration recruits allies. Persistence prevents world corruption.

The consequence for you as a technical contributor: when you face a choice between a technically simpler implementation that breaks the metaphor and a harder one that preserves it, the product will almost always prefer you preserve it.

Examples of this in practice:

- The brightness system starts at 0% (world is at its darkest at project start) and only accumulates through real work. Don't shortcut to a default brightness level — the darkness is intentional.
- Boss animations must not be skippable in their entirety (gold Legendary badge reveals are unskippable) because the ceremony is part of what makes completion feel like an achievement.
- The Corruption meter (post-V1) must increase daily for inactivity. It's not decorative — it represents the real cost of abandonment.
- AI scoring does not gatekeep advancement. Users always progress if they complete 2 of 3 tasks. Quality affects reward magnitude, not access. This is a deliberate design choice that must not be reversed.

When in doubt about a product decision, ask: does this make the work feel more like a quest, or less?

---

*This document synthesises all available project documentation as of April 2026. For the checkpoint task content bible, refer to `checkpoint_tasks_v3.xlsx`. For badge specifications, refer to `achievement_badges.xlsx`. For level progression details, refer to `level_table_with_flare.xlsx`. For monster lore and checkpoint crossing mechanics, refer to `monsters_and_mechanics.xlsx`.*
