# Phaser Week 1 Architecture — Visual Diagram

**Interactive Ideas — Game Engine Integration**

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         REACT LAYER (Next.js 15)                     │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  /app/map/page.tsx                                           │   │
│  │  • Mounts Phaser canvas                                      │   │
│  │  • Manages game lifecycle                                    │   │
│  │  • Queries Convex for venture data                           │   │
│  │  • Syncs state to Phaser via event bridge                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                   │                                  │
│                                   │ useQuery                         │
│                                   ▼                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  CONVEX DATABASE                                             │   │
│  │  • ventures table                                            │   │
│  │  • ventureCheckpoints table                                  │   │
│  │  • ventureBosses table                                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                   │                                  │
│                                   │ worldMap.ts queries              │
│                                   ▼                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Data Processing                                             │   │
│  │  • getWorldMapData()                                         │   │
│  │  • computeBrightness()                                       │   │
│  │  • getVenturesByUser()                                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────┬───────────────────────────────┘
                                    │
                                    │ dispatchToPhaser()
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         EVENT BRIDGE LAYER                           │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  event-bridge.ts                                             │   │
│  │  • Namespaced routing (PHASER: / REACT:)                     │   │
│  │  • Type-safe event definitions                               │   │
│  │  • Error isolation                                           │   │
│  │  • Listener management                                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│     React → Phaser Events:              Phaser → React Events:      │
│     • UPDATE_BRIGHTNESS                 • PHASER_READY              │
│     • UPDATE_CHECKPOINTS                • CHECKPOINT_CLICKED        │
│     • SET_ACTIVE_VENTURE                • FPS_UPDATE                │
│     • SCROLL_TO_CHECKPOINT              • SCENE_LOADED              │
│     • GAME_PAUSE/RESUME                 • ERROR                     │
│     • RESIZE                                                         │
└───────────────────────────────────┬───────────────────────────────┘
                                    │
                                    │ onPhaser() listeners
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         PHASER 3 LAYER                               │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  WorldMapScene.ts                                            │   │
│  │  • Main game loop                                            │   │
│  │  • Event handling                                            │   │
│  │  • Entity management                                         │   │
│  │  • Camera control                                            │   │
│  │  • Brightness post-FX                                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                         │                                            │
│                         │ creates/manages                            │
│                         ▼                                            │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │
│  │  CheckpointNode  │  │     Persona      │  │  BossSilhouette  │ │
│  │  • 5 states      │  │  • Male/Female   │  │  • 4 statuses    │ │
│  │  • T1/T2/T3 dots │  │  • Float anim    │  │  • Alpha lerp    │ │
│  │  • Interactive   │  │  • Shadow        │  │  • Nameplate     │ │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘ │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  AssetLoader.ts                                              │   │
│  │  • Procedural texture generation                             │   │
│  │  • Checkpoint sprites (5 × 64×64)                            │   │
│  │  • Persona sprites (2 × 32×48)                               │   │
│  │  • Path/particle textures                                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Convex → Phaser

```
┌────────────────────┐
│  User logs in      │
│  Creates venture   │
└─────────┬──────────┘
          │
          ▼
┌────────────────────────────────────────┐
│  Convex Database                       │
│  ┌──────────────────────────────────┐ │
│  │ ventures                          │ │
│  │ • ventureId                       │ │
│  │ • currentStage: 1                 │ │
│  │ • currentCheckpoint: 1            │ │
│  │ • assignedBosses: ["unraveller"] │ │
│  └──────────────────────────────────┘ │
│  ┌──────────────────────────────────┐ │
│  │ ventureCheckpoints (36 rows)     │ │
│  │ • stage: 1..8                     │ │
│  │ • checkpoint: 1..N                │ │
│  │ • status: "not_started"           │ │
│  │ • t1Completed: false              │ │
│  │ • t2Completed: false              │ │
│  │ • t3Completed: false              │ │
│  └──────────────────────────────────┘ │
└────────────────┬───────────────────────┘
                 │
                 │ useQuery(api.worldMap.getWorldMapData)
                 ▼
┌────────────────────────────────────────┐
│  convex/worldMap.ts                    │
│  ┌──────────────────────────────────┐ │
│  │ computeBrightness()               │ │
│  │ • Counts completed stages         │ │
│  │ • Counts tasks in current stage   │ │
│  │ • Returns { accumulatedBase,      │ │
│  │             stageLayer,            │ │
│  │             worldBrightness }      │ │
│  └──────────────────────────────────┘ │
│                                        │
│  Returns:                              │
│  {                                     │
│    venture: { ... },                   │
│    checkpoints: [ ... ],               │
│    brightness: {                       │
│      accumulatedBase: 0,               │
│      stageLayer: 0,                    │
│      worldBrightness: 0                │
│    }                                   │
│  }                                     │
└────────────────┬───────────────────────┘
                 │
                 │ React useEffect
                 ▼
┌────────────────────────────────────────┐
│  map/page.tsx                          │
│  ┌──────────────────────────────────┐ │
│  │ Transform Convex → Phaser format  │ │
│  │                                   │ │
│  │ checkpoints.map(cp => ({          │ │
│  │   id: cp._id,                     │ │
│  │   stage: cp.stage,                │ │
│  │   checkpoint: cp.checkpoint,      │ │
│  │   status: mapStatus(...),         │ │
│  │   t1: cp.t1Completed,             │ │
│  │   t2: cp.t2Completed,             │ │
│  │   t3: cp.t3Completed              │ │
│  │ }))                               │ │
│  └──────────────────────────────────┘ │
└────────────────┬───────────────────────┘
                 │
                 │ eventBridge.dispatchToPhaser()
                 ▼
┌────────────────────────────────────────┐
│  event-bridge.ts                       │
│  • Fires PHASER:UPDATE_CHECKPOINTS     │
│  • Fires PHASER:UPDATE_BRIGHTNESS      │
│  • Fires PHASER:SET_ACTIVE_VENTURE     │
└────────────────┬───────────────────────┘
                 │
                 │ Scene event listeners
                 ▼
┌────────────────────────────────────────┐
│  WorldMapScene.ts                      │
│  ┌──────────────────────────────────┐ │
│  │ handleUpdateCheckpoints()         │ │
│  │ • Destroys old checkpoint nodes   │ │
│  │ • Creates new CheckpointNode for  │ │
│  │   each checkpoint                 │ │
│  │ • Positions via snake path algo   │ │
│  │ • Adds to gameLayer               │ │
│  └──────────────────────────────────┘ │
│  ┌──────────────────────────────────┐ │
│  │ handleUpdateBrightness()          │ │
│  │ • Converts 0-100% to Phaser vals  │ │
│  │ • Applies post-FX to camera       │ │
│  └──────────────────────────────────┘ │
│  ┌──────────────────────────────────┐ │
│  │ handleSetActiveVenture()          │ │
│  │ • Creates Persona sprite          │ │
│  │ • Positions on active checkpoint  │ │
│  │ • Starts idle animation           │ │
│  └──────────────────────────────────┘ │
└────────────────────────────────────────┘
```

---

## Entity Hierarchy

```
WorldMapScene
    │
    ├─── backgroundLayer: Container
    │       └─── (empty in Week 1, biomes in Week 2)
    │
    └─── gameLayer: Container
            │
            ├─── CheckpointNode 1: Container
            │       ├─── mainSprite: Image ('cp_locked')
            │       ├─── pulseRing: Arc (animated)
            │       ├─── glowCircle: Arc (glow effect)
            │       ├─── progressDots: Arc[] (3 dots for T1/T2/T3)
            │       └─── labelText: Text ("S1·C1")
            │
            ├─── CheckpointNode 2: Container
            │       ├─── mainSprite: Image ('cp_active')
            │       ├─── pulseRing: Arc (pulsing)
            │       ├─── glowCircle: Arc
            │       ├─── progressDots: Arc[]
            │       └─── labelText: Text ("S1·C2")
            │
            ├─── ... (34 more checkpoints)
            │
            ├─── Persona: Container
            │       ├─── shadowEllipse: Ellipse (48×14)
            │       └─── sprite: Image ('persona_male' @ 3× scale)
            │               └─── floatTween (y: 0 → -8)
            │
            └─── BossSilhouette: Container
                    ├─── silhouetteGraphics: Graphics (dark shape)
                    └─── namePlate: Text ("???")
```

---

## Brightness Calculation Flow

```
┌──────────────────────────────────────────────────────────────┐
│  Input: Venture checkpoint data                              │
│  • 36 checkpoints across 8 stages                            │
│  • Each has: stage, status, t1/t2/t3 completion flags        │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────┐
│  Step 1: Count completed stages                              │
│  • Loop through all checkpoints                              │
│  • Group by stage                                            │
│  • Stage is "complete" if ALL checkpoints in that stage      │
│    have status = "completed" or "gold"                       │
│  • completedStages = count of fully completed stages         │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────┐
│  Step 2: Calculate accumulated base brightness               │
│  • accumulatedBase = completedStages × (60 / 7)              │
│  • Capped at 60%                                             │
│  • This NEVER resets — it only accumulates                   │
│                                                               │
│  Examples:                                                    │
│  • 0 stages complete → 0%                                    │
│  • 1 stage complete  → 8.57%                                 │
│  • 4 stages complete → 34.28%                                │
│  • 7 stages complete → 60% (max)                             │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────┐
│  Step 3: Count tasks in current stage                        │
│  • Find all checkpoints with stage = venture.currentStage    │
│  • For each checkpoint, count completed tasks:               │
│    - t1Completed ? 1 : 0                                     │
│    - t2Completed ? 1 : 0                                     │
│    - t3Completed ? 1 : 0                                     │
│  • tasksDone = sum of all completed tasks                    │
│  • totalTasks = number of checkpoints × 3                    │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────┐
│  Step 4: Calculate stage layer brightness                    │
│  • stageLayer = (tasksDone / totalTasks) × 40                │
│  • This RESETS to 0 when entering a new stage                │
│                                                               │
│  Examples (Stage 5 has 18 total tasks):                      │
│  • 0 tasks done   → 0%                                       │
│  • 9 tasks done   → 20% (50% of stage)                       │
│  • 18 tasks done  → 40% (100% of stage)                      │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────┐
│  Step 5: Sum to get world brightness                         │
│  • worldBrightness = accumulatedBase + stageLayer            │
│  • Range: 0% (darkest) to 100% (brightest)                   │
│                                                               │
│  Full example (mid-Stage 5, 50% tasks):                      │
│  • completedStages = 4                                       │
│  • accumulatedBase = 4 × 8.57 = 34.28%                       │
│  • tasksDone = 9, totalTasks = 18                            │
│  • stageLayer = (9/18) × 40 = 20%                            │
│  • worldBrightness = 34.28 + 20 = 54.28%                     │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────┐
│  Step 6: Convert to Phaser post-FX values                    │
│  • brightnessToPhaser(54.28)                                 │
│  • Linear interpolation:                                     │
│    - brightness = 0.15 + (0.5428 × 0.85) = 0.611             │
│    - contrast   = -0.30 + (0.5428 × 0.40) = -0.083           │
│  • Apply via camera.postFX.addColorMatrix()                  │
└──────────────────────────────────────────────────────────────┘
```

---

## Event Bridge Message Flow

### React → Phaser (User completes a task)

```
1. User submits task evidence in React UI
   └─→ Convex mutation updates ventureCheckpoints table
         └─→ Convex subscription fires, React re-renders
               └─→ useEffect detects worldMapData change
                     └─→ eventBridge.dispatchToPhaser({
                           type: 'UPDATE_CHECKPOINTS',
                           checkpoints: [...new state]
                         })
                           └─→ EventBridge fires 'PHASER:UPDATE_CHECKPOINTS'
                                 └─→ WorldMapScene.handleUpdateCheckpoints()
                                       └─→ Destroys old nodes
                                       └─→ Creates new nodes with updated states
                                       └─→ Checkpoint visual changes (locked→active)
```

### Phaser → React (User clicks checkpoint)

```
1. User clicks checkpoint node in Phaser canvas
   └─→ CheckpointNode 'pointerdown' handler fires
         └─→ node.emit('checkpoint_clicked', { id, stage, checkpoint })
               └─→ WorldMapScene receives event
                     └─→ eventBridge.dispatchToReact({
                           type: 'CHECKPOINT_CLICKED',
                           checkpointId: '...',
                           stage: 2,
                           checkpoint: 3
                         })
                           └─→ EventBridge fires 'REACT:CHECKPOINT_CLICKED'
                                 └─→ map/page.tsx useEffect handler
                                       └─→ console.log('Checkpoint clicked:', ...)
                                       └─→ TODO: router.push(`/checkpoint/${id}`)
```

---

## File Dependencies Graph

```
map/page.tsx
    ├─── depends on → game-config.ts
    ├─── depends on → event-bridge.ts
    ├─── depends on → convex/worldMap.ts (via api)
    └─── creates → Phaser.Game instance
                     └─── loads → WorldMapScene

WorldMapScene.ts
    ├─── depends on → AssetLoader (preload phase)
    ├─── depends on → CheckpointNode
    ├─── depends on → Persona
    ├─── depends on → BossSilhouette
    ├─── depends on → brightness-calculator (brightnessToPhaser)
    └─── depends on → event-bridge

CheckpointNode.ts
    └─── depends on → Phaser.GameObjects.Container

Persona.ts
    └─── depends on → Phaser.GameObjects.Container

Boss.ts
    └─── depends on → Phaser.GameObjects.Container

AssetLoader.ts
    └─── depends on → Phaser.GameObjects.Graphics

brightness-calculator.ts
    └─── (no dependencies, pure functions)

event-bridge.ts
    └─── (no dependencies, singleton pattern)

convex/worldMap.ts
    └─── depends on → convex/schema.ts (via _generated)
```

---

## State Management Flow

```
┌────────────────────────────────────────────────────────────┐
│  SOURCE OF TRUTH: Convex Database                          │
│  • ventures (1 row per project)                            │
│  • ventureCheckpoints (36 rows per venture)                │
│  • ventureBosses (1-2 rows per venture)                    │
└─────────────────┬──────────────────────────────────────────┘
                  │
                  │ Real-time subscription
                  ▼
┌────────────────────────────────────────────────────────────┐
│  REACT STATE: Ephemeral, derived from Convex               │
│  • worldMapData (from useQuery)                            │
│  • phaserReady (boolean)                                   │
│  • fps (number)                                            │
└─────────────────┬──────────────────────────────────────────┘
                  │
                  │ Event bridge dispatch
                  ▼
┌────────────────────────────────────────────────────────────┐
│  PHASER STATE: Transient, visual representation            │
│  • checkpointNodes (Map<string, CheckpointNode>)           │
│  • persona (Persona instance)                              │
│  • bosses (BossSilhouette[])                               │
│  • currentVentureId (string)                               │
└────────────────────────────────────────────────────────────┘
```

**Key Principle:** Phaser NEVER mutates data. It only renders. All state changes flow down from Convex → React → Phaser.

---

## Checkpoint State Machine

```
┌─────────────┐
│   LOCKED    │  (Grey circle, lock icon)
│   (default) │
└──────┬──────┘
       │ venture.currentCheckpoint == this checkpoint
       ▼
┌─────────────┐
│   ACTIVE    │  (Blue circle, pulsing animation)
│             │
└──────┬──────┘
       │ user starts working on tasks
       ▼
┌─────────────┐
│ IN_PROGRESS │  (Amber circle, flame icon)
│             │
└──────┬──────┘
       │ user completes 2/3 or 3/3 tasks
       ▼
┌─────────────┐
│  COMPLETED  │  (Green circle, checkmark)
│   (2/3 tasks)│
└──────┬──────┘
       │ user completes all 3 tasks
       ▼
┌─────────────┐
│    GOLD     │  (Gold circle, star icon, shimmer animation)
│   (3/3 tasks)│
└─────────────┘
```

---

## Performance Optimization Strategy

### Batched Rendering
- All checkpoints created in single `handleUpdateCheckpoints` call
- No per-frame position recalculations (static positions)
- Animations use Phaser tweens (GPU-accelerated)

### Efficient Queries
- `getWorldMapData` batches venture + checkpoints + brightness in 1 query
- No N+1 query problems
- Convex subscriptions only fire on actual data changes

### Memory Management
- Proper cleanup: `node.destroy()` before creating new nodes
- Event listeners removed in `shutdown()` lifecycle
- Phaser game destroyed on React unmount

### FPS Monitoring
- Real-time FPS tracking
- Throttled to 1 Hz reporting (not every frame)
- Visible in debug HUD for performance testing

---

## Week 1 Deliverables Checklist

- [x] Phaser 3 installed and configured
- [x] Canvas mounting at `/map` route
- [x] React-Phaser event bridge (bidirectional)
- [x] Two-layer brightness system
- [x] Checkpoint node rendering (5 states)
- [x] Persona sprites (male/female) with animations
- [x] Boss silhouette system (stub)
- [x] Procedural asset generation
- [x] World map scene implementation
- [x] Convex queries for venture data
- [x] Snake path layout algorithm
- [x] TypeScript strict mode compliance
- [x] Comprehensive documentation
- [x] Build verification (clean)

**Status:** ✅ **100% COMPLETE**

---

## Week 2 Preview

### Additional Components (Coming Soon)

```
WorldMapScene (enhanced)
    │
    ├─── backgroundLayer: Container
    │       ├─── BiomeBackground 1 (Village)
    │       ├─── BiomeBackground 2 (Forest)
    │       ├─── ... (8 total)
    │       └─── PathRenderer (road/trail graphics)
    │
    └─── gameLayer: Container
            ├─── CheckpointNodes (existing)
            ├─── Persona (enhanced with walk cycle)
            ├─── MiniBoss 1 (Stage 1 boundary)
            ├─── MiniBoss 2 (Stage 2 boundary)
            ├─── ... (8 total)
            └─── SuperBoss (far right, 3 assigned)
```

---

**End of Week 1 Architecture Document**