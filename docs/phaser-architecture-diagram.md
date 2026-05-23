# Phaser Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Browser / Next.js App                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────┐    │
│  │                    React Layer (page.tsx)                      │    │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐         │    │
│  │  │   Convex    │  │   useState   │  │   useEffect  │         │    │
│  │  │  useQuery   │  │  - phaser    │  │  - mount     │         │    │
│  │  │  - ventures │  │    Ready     │  │  - sync data │         │    │
│  │  │  - worldMap │  │  - fps       │  │  - cleanup   │         │    │
│  │  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘         │    │
│  │         │                │                  │                  │    │
│  │         └────────────────┴──────────────────┘                  │    │
│  │                          │                                     │    │
│  │                          ▼                                     │    │
│  │                  ┌───────────────┐                            │    │
│  │                  │  Event Bridge │◄───────┐                   │    │
│  │                  │   Singleton   │        │                   │    │
│  │                  └───────┬───────┘        │                   │    │
│  │                          │                │                   │    │
│  └──────────────────────────┼────────────────┼───────────────────┘    │
│                             │                │                        │
│  ═══════════════════════════╪════════════════╪═══════════════════════ │
│                             │                │                        │
│  ┌──────────────────────────┼────────────────┼───────────────────┐    │
│  │               Phaser Layer (game-config.ts)                   │    │
│  │                          │                │                   │    │
│  │                          ▼                │                   │    │
│  │              ┌─────────────────────┐      │                   │    │
│  │              │   Phaser.Game       │      │                   │    │
│  │              │   Instance          │      │                   │    │
│  │              └──────────┬──────────┘      │                   │    │
│  │                         │                 │                   │    │
│  │                         ▼                 │                   │    │
│  │              ┌─────────────────────┐      │                   │    │
│  │              │   WorldMapScene     │──────┘                   │    │
│  │              │                     │                          │    │
│  │              │  ┌───────────────┐  │                          │    │
│  │              │  │ AssetLoader   │  │                          │    │
│  │              │  └───────────────┘  │                          │    │
│  │              │  ┌───────────────┐  │                          │    │
│  │              │  │ Checkpoints   │  │                          │    │
│  │              │  │ (Map<id,node>)│  │                          │    │
│  │              │  └───────────────┘  │                          │    │
│  │              │  ┌───────────────┐  │                          │    │
│  │              │  │ Persona       │  │                          │    │
│  │              │  └───────────────┘  │                          │    │
│  │              │  ┌───────────────┐  │                          │    │
│  │              │  │ Bosses []     │  │                          │    │
│  │              │  └───────────────┘  │                          │    │
│  │              └─────────────────────┘                          │    │
│  └───────────────────────────────────────────────────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Component Dependency Graph

```
┌──────────────────────┐
│   page.tsx           │
│   (React Component)  │
└──────────┬───────────┘
           │
           ├─────► Phaser (npm package)
           │
           ├─────► game-config.ts
           │       └─────► WorldMapScene.ts
           │
           ├─────► event-bridge.ts
           │
           └─────► Convex (useQuery)
                   └─────► api.worldMap.*


┌──────────────────────┐
│  WorldMapScene.ts    │
└──────────┬───────────┘
           │
           ├─────► AssetLoader
           │       (creates textures)
           │
           ├─────► CheckpointNode
           │       (game entity)
           │
           ├─────► Persona
           │       (game entity)
           │
           ├─────► BossSilhouette
           │       (game entity)
           │
           ├─────► event-bridge.ts
           │       (bidirectional events)
           │
           └─────► brightness-calculator
                   (utility)
```

---

## Data Flow: React → Phaser

```
┌─────────────┐
│   Convex    │  Query venture data
│  Database   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────┐
│  api.worldMap.getVenturesByUser()
│  api.worldMap.getWorldMapData(id)
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  React useQuery Hook        │
│  - ventures                 │
│  - worldMapData             │
│    { venture, checkpoints,  │
│      brightness }           │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  useEffect (sync to Phaser) │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  eventBridge.dispatchToPhaser()
│                             │
│  Events:                    │
│  - SET_ACTIVE_VENTURE       │
│  - UPDATE_CHECKPOINTS       │
│  - UPDATE_BRIGHTNESS        │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  WorldMapScene Handlers     │
│                             │
│  - handleSetActiveVenture() │
│  - handleUpdateCheckpoints()│
│  - handleUpdateBrightness() │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  Phaser Game Objects        │
│                             │
│  - Create persona           │
│  - Create checkpoint nodes  │
│  - Apply camera filters     │
└─────────────────────────────┘
```

---

## Event Flow: Phaser → React

```
┌─────────────────────────────┐
│  User Interaction           │
│  (clicks checkpoint node)   │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  CheckpointNode             │
│  .on('pointerdown', ...)    │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  node.emit('checkpoint_clicked',
│    { id, stage, checkpoint })
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  WorldMapScene Handler      │
│  .on('checkpoint_clicked')  │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  eventBridge.dispatchToReact()
│  { type: 'CHECKPOINT_CLICKED',
│    checkpointId, stage, ... }
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  React useEffect            │
│  eventBridge.onReact(...)   │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  handleCheckpointClick()    │
│  - Navigate to detail page  │
│  - Update UI state          │
│  - Track analytics          │
└─────────────────────────────┘
```

---

## Lifecycle Management

```
MOUNT PHASE:
────────────

  1. page.tsx renders
         │
         ▼
  2. containerRef.current available
         │
         ▼
  3. new Phaser.Game(config)
         │
         ▼
  4. WorldMapScene.preload()
         │
         ▼
  5. WorldMapScene.create()
         │
         ├─► Create containers
         ├─► Setup event listeners
         ├─► Setup camera
         │
         ▼
  6. dispatchToReact('PHASER_READY')
         │
         ▼
  7. React: setPhaserReady(true)
         │
         ▼
  8. React: useEffect triggers data sync
         │
         ▼
  9. dispatchToPhaser('SET_ACTIVE_VENTURE')
  10. dispatchToPhaser('UPDATE_CHECKPOINTS')
  11. dispatchToPhaser('UPDATE_BRIGHTNESS')
         │
         ▼
  12. Scene handlers create game objects
         │
         ▼
  13. Game running ✓


UNMOUNT PHASE:
──────────────

  1. Component unmount triggered
         │
         ▼
  2. useEffect cleanup runs
         │
         ├─► eventBridge.off() for all listeners
         ├─► game.destroy(true)
         ├─► gameRef.current = null
         │
         ▼
  3. Phaser calls scene.shutdown()
         │
         ├─► Remove event listeners
         ├─► Clear bound handlers
         │
         ▼
  4. Full cleanup complete ✓
```

---

## Scene Layer Architecture

```
WorldMapScene
│
├── backgroundLayer (Container, depth: 0)
│   │
│   ├── Background graphics (future)
│   ├── Parallax layers (future)
│   └── Grid/guide lines (debug)
│
└── gameLayer (Container, depth: 10)
    │
    ├── CheckpointNode #1 (Container)
    │   ├── CircleGraphics
    │   ├── StatusIcon
    │   ├── TierIndicators (t1, t2, t3)
    │   └── PathConnector
    │
    ├── CheckpointNode #2 (Container)
    │   └── ...
    │
    ├── Persona (Container)
    │   ├── Sprite
    │   ├── Animations
    │   └── Nameplate
    │
    └── BossSilhouette #1 (Container)
        ├── SilhouetteGraphics
        └── NamePlate

Camera
├── Bounds: 3200 x 720
├── Viewport: 1280 x 720
├── PostFX Pipeline:
│   ├── ColorMatrix (brightness)
│   └── ColorMatrix (contrast)
└── Pan/Zoom controls (future)
```

---

## Checkpoint Position Algorithm

```
Snake Pattern Layout:

Row 0 (even): LEFT → RIGHT
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│  1  │  2  │  3  │  4  │  5  │  6  │  7  │  8  │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘
  200   380   560   740   920  1100  1280  1460

Row 1 (odd): RIGHT ← LEFT
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│ 16  │ 15  │ 14  │ 13  │ 12  │ 11  │ 10  │  9  │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘
 1460  1280  1100   920   740   560   380   200

Row 2 (even): LEFT → RIGHT
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│ 17  │ 18  │ 19  │ 20  │ 21  │ 22  │ 23  │ 24  │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘
  200   380   560   740   920  1100  1280  1460

Constants:
- CHECKPOINT_SPACING = 180px
- ROW_HEIGHT = 200px
- START_X = 200px
- START_Y = 360px
- CHECKPOINTS_PER_ROW = 8

Formula:
  row = floor(globalIndex / 8)
  col = globalIndex % 8
  
  x = (row % 2 == 0) 
      ? START_X + col * SPACING
      : START_X + (7 - col) * SPACING
      
  y = START_Y + row * ROW_HEIGHT
```

---

## Event Bridge Schema

```typescript
// React → Phaser Events
type ReactToPhaser = 
  | { type: 'UPDATE_BRIGHTNESS', brightness: number }
  | { type: 'UPDATE_CHECKPOINTS', checkpoints: CheckpointState[] }
  | { type: 'SET_ACTIVE_VENTURE', ventureId: string, personaGender: 'male' | 'female' }
  | { type: 'SCROLL_TO_CHECKPOINT', checkpointId: string }

// Phaser → React Events  
type PhaserToReact =
  | { type: 'PHASER_READY' }
  | { type: 'FPS_UPDATE', fps: number }
  | { type: 'CHECKPOINT_CLICKED', checkpointId: string, stage: number, checkpoint: number }
  | { type: 'PERSONA_CLICKED' }
  | { type: 'BOSS_CLICKED', bossId: string }

// Event Bridge Methods
interface EventBridge {
  onPhaser(type: string, handler: Function): void
  onReact(type: string, handler: Function): void
  dispatchToPhaser(event: ReactToPhaser): void
  dispatchToReact(event: PhaserToReact): void
  off(type: string, handler: Function): void
}
```

---

## State Management Flow

```
┌─────────────────────────────────────────────────────┐
│              Single Source of Truth                 │
│                  (Convex Database)                  │
└──────────────────────┬──────────────────────────────┘
                       │
         ┌─────────────┴─────────────┐
         │                           │
         ▼                           ▼
┌─────────────────┐         ┌─────────────────┐
│  React State    │         │  Phaser State   │
│  (read-only)    │         │  (derived)      │
│                 │         │                 │
│ - ventures      │────────►│ - checkpoints   │
│ - worldMapData  │  sync   │ - persona       │
│ - phaserReady   │────────►│ - bosses        │
│ - fps           │◄────────│ - brightness    │
└─────────────────┘  events └─────────────────┘
                       ▲
                       │
                       │ User interactions
                       │ (clicks, etc)
                       │
```

**Key Principles:**
1. Convex is the single source of truth
2. React queries Convex and holds read-only data
3. React syncs data to Phaser via event bridge
4. Phaser creates derived visual representations
5. User interactions in Phaser bubble up to React
6. React can trigger Convex mutations
7. Mutations cause re-query and re-sync cycle

---

## Error Handling Strategy

```
┌─────────────────────────────────────────┐
│          Error Categories               │
└─────────────────────────────────────────┘
           │
           ├─► Network Errors
           │   └─► Convex query failures
           │       - Show error state in UI
           │       - Retry with exponential backoff
           │
           ├─► Data Validation Errors
           │   └─► Invalid checkpoint structure
           │       - console.warn() with details
           │       - Skip invalid items
           │       - Continue processing valid items
           │
           ├─► Phaser Runtime Errors
           │   └─► Scene creation failures
           │       - Try/catch in handlers
           │       - console.warn() with context
           │       - Graceful degradation
           │
           └─► Event Bridge Errors
               └─► Handler exceptions
                   - Wrapped in try/catch
                   - Log but don't crash
                   - Isolate failures
```

---

## Performance Optimization Points

```
1. Asset Loading
   ├─► Use procedural textures (AssetLoader)
   └─► Avoid network requests for simple shapes

2. Render Optimization
   ├─► Pixel art mode (no antialiasing)
   ├─► Containers for batch rendering
   └─► Depth sorting for minimal state changes

3. Event Throttling
   ├─► FPS updates: 1/second
   ├─► Brightness: Immediate (infrequent)
   └─► Checkpoints: Immediate (one-time)

4. Memory Management
   ├─► Destroy old checkpoints before creating new
   ├─► Clear event listeners on shutdown
   └─► Destroy Phaser game on unmount

5. Camera
   ├─► Fixed bounds (3200x720)
   ├─► Smooth panning with easing
   └─► PostFX pipeline for effects
```

---

## Testing Strategy

```
Unit Tests (Vitest)
├── calculateCheckpointPosition()
│   ├─► First checkpoint (0,0) → (200, 360)
│   ├─► 8th checkpoint (0,7) → (1460, 360)
│   ├─► 9th checkpoint (1,0) → (1460, 560)
│   └─► Snake pattern correctness
│
├── brightnessToPhaser()
│   ├─► 0% → very dark
│   ├─► 50% → neutral
│   └─► 100% → bright/high contrast
│
└── Event bridge
    ├─► Listener registration
    ├─► Event dispatch
    └─► Listener cleanup

Integration Tests
├── Phaser lifecycle
│   ├─► Mount creates game
│   ├─► Ready event fires
│   └─► Unmount destroys game
│
├── Data sync
│   ├─► Convex data → Phaser
│   ├─► Checkpoint creation
│   └─► Brightness application
│
└── User interactions
    ├─► Checkpoint click → event
    ├─► Camera pan
    └─► Persona animations

E2E Tests (Playwright)
├── Full page load
├── Wait for Phaser ready
├── Verify checkpoints visible
├── Click checkpoint
└── Verify navigation
```

---

## Future Enhancements

```
Phase 2: Enhanced Visuals
├── Parallax background layers
├── Animated stars/particles
├── Path connectors between checkpoints
├── Glow effects on active checkpoint
└── Boss reveal animations

Phase 3: Interactions
├── Persona walking animation
├── Auto-scroll to current checkpoint
├── Checkpoint hover tooltips
├── Boss interaction modals
└── Progress celebration effects

Phase 4: Mobile
├── Touch gesture support
├── Pinch-to-zoom
├── Pan with momentum
├── Responsive layout
└── Portrait mode optimization

Phase 5: Multiplayer
├── Show other players' personas
├── Real-time position updates
├── Collaborative challenges
└── Leaderboards
```
