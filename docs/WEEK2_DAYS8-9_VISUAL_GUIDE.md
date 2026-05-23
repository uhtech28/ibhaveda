# Week 2 Days 8-9: Visual Guide
## Persona Animation System & Boss Silhouette System

---

## 1. Persona Animation System

### 1.1 Animation State Machine

```
┌─────────────────────────────────────────────────────────────┐
│                    PERSONA STATE MACHINE                     │
└─────────────────────────────────────────────────────────────┘

          ┌──────────┐
          │  CREATED │
          └────┬─────┘
               │
               │ setupFloatAnimation()
               ▼
          ┌─────────┐
     ┌───│  IDLE   │◄───┐
     │   └────┬────┘    │
     │        │          │
     │ playIdle()        │ onComplete()
     │        │          │
     │        │ playWalk(x, y, duration)
     │        │          │
     │        ▼          │
     │   ┌─────────┐    │
     └──►│  WALK   │────┘
         └─────────┘

States:
  IDLE: Floating animation (8px, 1200ms cycle)
  WALK: Bob + movement (4px bob, linear travel)
```

### 1.2 Visual Representation

```
IDLE ANIMATION (1200ms cycle):
═══════════════════════════════════════════════════

Frame 0ms:    👤        y = 0
              ▓▓

Frame 300ms:  👤        y = -4px
              ▓▓

Frame 600ms:  👤        y = -8px (peak)
              ▓

Frame 900ms:  👤        y = -4px
              ▓▓

Frame 1200ms: 👤        y = 0 (restart)
              ▓▓

Shadow scales with height: 1.0 → 0.7 → 1.0


WALK ANIMATION (200ms bob cycle):
═══════════════════════════════════════════════════

    👤 → → → 👤 → → → 👤 → → → 👤
    ▓▓      ▓▓      ▓▓      ▓▓
     ↑       ↑       ↑       ↑
    0ms   200ms   400ms   600ms

Bob: y oscillates -4px every 200ms
Move: Linear progression from start → end
```

### 1.3 Positioning on World Map

```
WORLD MAP LAYOUT (8 stages × 400px each):
═══════════════════════════════════════════════════

Stage:    1         2         3         4         5         6         7         8
     ┌────────┬────────┬────────┬────────┬────────┬────────┬────────┬────────┐
     │        │        │        │        │        │        │        │        │
     │   🔵   │   🔵   │   🔵   │   🔵   │   🔵   │   🟢   │   ⚫   │   ⚫   │
     │        │        │        │        │        │👤      │        │        │
     │        │        │        │        │        │80px    │        │        │
     │   ⚫   │   ⚫   │   ⚫   │   ⚫   │   ⚫   │        │        │        │
     └────────┴────────┴────────┴────────┴────────┴────────┴────────┴────────┘
     200px   600px   1000px  1400px  1800px  2200px  2600px  3000px

Legend:
  🔵 = Completed checkpoint (blue)
  🟢 = Active checkpoint (green) ← Persona positions here
  ⚫ = Locked checkpoint (gray)
  👤 = Persona (80px above active checkpoint)
```

### 1.4 Stage Transition Example

```
STAGE TRANSITION: Stage 5 → Stage 6
═══════════════════════════════════════════════════

Time 0ms:
     Stage 5          Stage 6
     ┌────────┬────────┐
     │   🔵   │   🟢   │
     │   👤   │        │
     │  (x:2200)       │
     └────────┴────────┘

Time 500ms: (mid-transition)
     Stage 5          Stage 6
     ┌────────┬────────┐
     │   🔵   │   🟢   │
     │        │  👤    │  ← Walking + bobbing
     │        │ (x:2400)
     └────────┴────────┘
                ↑
           Camera panning

Time 1000ms: (complete)
     Stage 5          Stage 6
     ┌────────┬────────┐
     │   🔵   │   🟢   │
     │        │   👤   │
     │        │ (x:2600)
     └────────┴────────┘

Distance: 400px
Duration: 400px × 2ms/px = 800ms (min 1000ms)
Final: 1000ms
```

---

## 2. Boss Silhouette System

### 2.1 Boss Opacity Progression

```
SUPER BOSS ALPHA PROGRESSION (Stages 1-8):
═══════════════════════════════════════════════════

Stage 1-4: SILHOUETTE (α = 0.15)
     👻
    ░░░  ← Barely visible
    ░░░
    ░ ░

Stage 5-6: PRESENT (α = 0.50)
     👹
    ▒▒▒  ← Half visible
    ▒▒▒
    ▒ ▒

Stage 7-8: FOREGROUND (α = 1.00)
     👿
    ███  ← Full visibility
    ███
    █ █

Defeated: SLAIN (α = 0.00)
    ⚰️
         ← Invisible
```

### 2.2 Boss Positioning Layout

```
WORLD MAP WITH ALL BOSSES:
═══════════════════════════════════════════════════════════════════════

Y=250px ─►  👻₁  👻₂  👻₃  👻₄  👻₅  👻₆  👻₇  👻₈
            │    │    │    │    │    │    │    │
            │    │    │    │    │    │    │    │
Y=360px ─►  🔵───🔵───🔵───🔵───🔵───🟢───⚫───⚫──────────👿
            │    │    │    │    │    👤   │    │          │
            │    │    │    │    │    │    │    │          │
            200  600  1000 1400 1800 2200 2600 3000      3400px

Legend:
  👻₁-₈ = Mini-bosses (one per stage, y=250, scale=0.6)
  👿 = Super boss (end of map, y=360, scale=1.0)
  🔵/🟢/⚫ = Checkpoints (completed/active/locked)
  👤 = Persona

Mini-boss positions:
  Stage N boss: x = 200 + (N × 400) - 50
  
Super boss position:
  x = 3400 (near map end)
```

### 2.3 Mini-Boss Lifecycle

```
MINI-BOSS STATUS PER STAGE:
═══════════════════════════════════════════════════

Current Stage: 3

Stage 1 Boss (Fog of Vagueness):
  Status: SLAIN (α = 0.00)
  👻 → ⚰️  (defeated in past)
  
Stage 2 Boss (Pathwarden Wraith):
  Status: SLAIN (α = 0.00)
  👻 → ⚰️  (defeated in past)

Stage 3 Boss (Advocate of Lies):   ← CURRENT
  Status: PRESENT (α = 0.50)
  👻 → 👹  (active encounter)

Stage 4-8 Bosses:
  Status: SILHOUETTE (α = 0.15)
  👻 (future threats)
```

### 2.4 Alpha Transition Timeline

```
BOSS OPACITY CHANGES (800ms smooth transition):
═══════════════════════════════════════════════════

From: SILHOUETTE (α=0.15)
To:   PRESENT (α=0.50)

Time 0ms:    👻  ░░░  (15% visible)
Time 200ms:  👺  ░▒▒  (26% visible)
Time 400ms:  👹  ▒▒▒  (38% visible)
Time 600ms:  👹  ▒▒▓  (44% visible)
Time 800ms:  👹  ▒▓▓  (50% visible) ✓

Easing: Sine.easeInOut
Duration: 800ms
```

---

## 3. Event Flow Diagrams

### 3.1 Venture Load Sequence

```
┌───────────────────────────────────────────────────────────────┐
│                    VENTURE LOAD FLOW                           │
└───────────────────────────────────────────────────────────────┘

React Component (map/page.tsx)
      │
      │ useQuery(api.worldMap.getWorldMapData)
      ▼
Convex Database
      │ returns { venture, checkpoints, brightness }
      │
      ▼
React Effect (worldMapData changes)
      │
      ├─► eventBridge.dispatchToPhaser({
      │     type: "SET_ACTIVE_VENTURE",
      │     ventureId: "...",
      │     personaGender: "male",
      │     assignedBosses: ["unraveller", "gravemind"],
      │     currentStage: 6
      │   })
      │
      ▼
Phaser (WorldMapScene.handleSetActiveVenture)
      │
      ├─► Create Persona
      │   └─► new Persona(scene, 0, 0, "male")
      │
      ├─► Create Bosses
      │   ├─► createBossSilhouettes(["unraveller", "gravemind"])
      │   │   ├─► Super boss: "unraveller" at x=3400
      │   │   └─► 8 mini-bosses at stage boundaries
      │   │
      │   └─► updateBossOpacity(6)
      │       ├─► Super boss: PRESENT (stage 6, α=0.50)
      │       ├─► Mini-boss 1-5: SLAIN (α=0.00)
      │       ├─► Mini-boss 6: PRESENT (α=0.50)
      │       └─► Mini-boss 7-8: SILHOUETTE (α=0.15)
      │
      ├─► Position Persona
      │   └─► positionPersonaOnActiveCheckpoint()
      │       └─► persona.setPosition(node.x, node.y - 80)
      │
      └─► Auto-scroll
          └─► cameras.main.pan(targetX, targetY)
```

### 3.2 Stage Completion Flow

```
┌───────────────────────────────────────────────────────────────┐
│               STAGE COMPLETION FLOW (Future)                   │
└───────────────────────────────────────────────────────────────┘

User completes Stage 5 final checkpoint
      │
      ▼
Convex mutation updates venture.currentStage = 6
      │
      ▼
React re-renders with new worldMapData
      │
      ├─► UPDATE_CHECKPOINTS event
      │   └─► Stage 6 checkpoint becomes active
      │
      ├─► animateStageTransition()
      │   ├─► Persona walks from Stage 5 → Stage 6
      │   └─► Camera follows persona
      │
      └─► updateBossOpacity(6)
          ├─► Mini-boss 5: PRESENT → SLAIN (fade out)
          ├─► Mini-boss 6: SILHOUETTE → PRESENT (fade in)
          └─► Super boss: PRESENT → PRESENT (no change)
```

---

## 4. Boss Name Mapping

### 4.1 Numeric to Slug Conversion

```
DATABASE (Convex):
═══════════════════════════════════════════════════
venture.assignedBosses = [1, 8]
venture.currentStage = 3

      ↓ React: mapBossIdToSlug()

PHASER (Event Bridge):
═══════════════════════════════════════════════════
SET_ACTIVE_VENTURE {
  assignedBosses: ["unraveller", "gravemind"],
  currentStage: 3
}

      ↓ WorldMapScene: getBossName()

DISPLAY (Nameplate):
═══════════════════════════════════════════════════
Boss 1: "The Unraveller"
Boss 8: "The Gravemind"
```

### 4.2 All Boss Mappings

```
ID  │ SLUG            │ NAME
════╪═════════════════╪══════════════════════════
 1  │ unraveller      │ The Unraveller
 2  │ pale_architect  │ The Pale Architect
 3  │ hollow_king     │ The Hollow King
 4  │ thornwarden     │ The Thornwarden
 5  │ mirror_witch    │ The Mirror Witch
 6  │ ashen_drake     │ The Ashen Drake
 7  │ tide_caller     │ The Tide Caller
 8  │ gravemind       │ The Gravemind
 9  │ rusted_oracle   │ The Rusted Oracle
10  │ wraith_council  │ The Wraith Council
11  │ stonecaller     │ The Stonecaller
12  │ veilwalker      │ The Veilwalker

Mini-boss names (8 stages):
════════════════════════════════════════════════
Stage 1: Fog of Vagueness
Stage 2: Pathwarden Wraith
Stage 3: Advocate of Lies
Stage 4: Unfinished Golem
Stage 5: Collapse Specter
Stage 6: Harbourmaster
Stage 7: Babel Merchant
Stage 8: Iron Bureaucrat
```

---

## 5. Animation Timings Reference

### 5.1 Persona Timings

```
ANIMATION          │ DURATION │ EASING        │ PROPERTIES
═══════════════════╪══════════╪═══════════════╪══════════════
Idle Float         │ 1200ms   │ Sine.InOut    │ sprite.y: 0→-8
Idle Shadow        │ 1200ms   │ Sine.InOut    │ shadow.scaleX: 1.0→0.7
Walk Bob           │ 200ms    │ Sine.InOut    │ sprite.y: 0→-4 (yoyo)
Walk Movement      │ 2ms/px   │ Linear        │ container.x/y
Stage Transition   │ Max(1000,│ Linear (move) │ Persona + Camera
                   │ dist×2)  │ Sine (camera) │
```

### 5.2 Boss Timings

```
TRANSITION         │ DURATION │ EASING        │ ALPHA CHANGE
═══════════════════╪══════════╪═══════════════╪══════════════
Any → Any          │ 800ms    │ Sine.easeInOut│ smooth blend
Initial Setup      │ 0ms      │ instant       │ immediate set
Silhouette→Present │ 800ms    │ Sine.easeInOut│ 0.15 → 0.50
Present→Foreground │ 800ms    │ Sine.easeInOut│ 0.50 → 1.00
Any → Slain        │ 800ms    │ Sine.easeInOut│ current → 0.00
```

---

## 6. Quick Reference Cards

### 6.1 Persona Methods

```
┌─────────────────────────────────────────────────────┐
│ PERSONA API QUICK REFERENCE                         │
├─────────────────────────────────────────────────────┤
│ setPosition(x, y)                                   │
│   ↳ Instant teleport, returns this (chainable)     │
│   ↳ Use for: Initial placement, resets             │
├─────────────────────────────────────────────────────┤
│ moveToPosition(x, y, duration?)                     │
│   ↳ Animated walk, default 1000ms                  │
│   ↳ Use for: Stage transitions, checkpoint moves   │
├─────────────────────────────────────────────────────┤
│ playWalk(x, y, duration?)                           │
│   ↳ Low-level walk control with bob                │
│   ↳ Auto-returns to idle on completion             │
├─────────────────────────────────────────────────────┤
│ playIdle()                                          │
│   ↳ Resume floating animation                      │
│   ↳ Safe to call multiple times                    │
└─────────────────────────────────────────────────────┘
```

### 6.2 Boss Methods

```
┌─────────────────────────────────────────────────────┐
│ BOSS API QUICK REFERENCE                            │
├─────────────────────────────────────────────────────┤
│ updateStatus(status, smooth=true)                   │
│   ↳ Transitions to new status with alpha tween     │
│   ↳ smooth=false for instant (initial setup)       │
│   ↳ Updates nameplate on FOREGROUND                │
├─────────────────────────────────────────────────────┤
│ Statuses:                                           │
│   • silhouette (α=0.15) - distant threat           │
│   • present    (α=0.50) - looming danger           │
│   • foreground (α=1.00) - active encounter         │
│   • slain      (α=0.00) - defeated                 │
│   • retreated  (α=0.00) - fled                     │
└─────────────────────────────────────────────────────┘
```

---

## 7. Common Scenarios

### 7.1 New User Starting Venture

```
1. User creates venture → Stage 1, Checkpoint 1
2. React sends: SET_ACTIVE_VENTURE { stage: 1, bosses: [3, 7] }
3. Phaser creates:
   ✓ Persona at Stage 1 active checkpoint
   ✓ Super boss "hollow_king" at x=3400 (α=0.15)
   ✓ Mini-boss 1-8 at stage boundaries (all α=0.15)
4. Camera pans to Stage 1
5. User sees:
   👤 on Stage 1 checkpoint (floating)
   👻 faint mini-boss at Stage 1 end
   👻 super faint boss at far right
```

### 7.2 User Reaches Stage 7

```
1. User completes Stage 6 final checkpoint
2. React updates: currentStage = 7
3. Phaser triggers:
   ✓ animateStageTransition(stage6_last, stage7_first)
   ✓ updateBossOpacity(7)
4. Visual changes:
   👤 walks 400px → Stage 7 (1000ms)
   👻₇ fades from α=0.15 → α=0.50 (mini-boss 7)
   👿 fades from α=0.50 → α=1.00 (super boss) ← INTENSIFIES
5. User sees:
   Persona walking with bob animation
   Camera following smoothly
   Super boss becoming fully visible (threat imminent)
```

### 7.3 Boss Defeat (Future Feature)

```
1. User defeats mini-boss during Stage 4
2. React sends boss status update
3. Phaser calls:
   miniBoss4.updateStatus("slain")
4. Visual:
   👹 (α=0.50) → ⚰️ (α=0.00) over 800ms
5. Boss fades out with Sine.easeInOut
```

---

## 8. Debug Visualization

### 8.1 Console Logging Points

```typescript
// Persona debugging
console.log('[Persona] Animation:', this.currentAnimation)
console.log('[Persona] Position:', this.x, this.y)
console.log('[Persona] Walking to:', targetX, targetY, 'duration:', duration)

// Boss debugging
console.log('[Boss]', this.bossId, 'status:', status, 'alpha:', targetAlpha)
console.log('[WorldMap] Created', this.bosses.size, 'bosses')
console.log('[WorldMap] Stage', currentStage, 'boss opacity updated')
```

### 8.2 Visual Debug Overlay (Future)

```
┌─────────────────────────────────────────────────────┐
│ DEBUG HUD (Overlay)                                 │
├─────────────────────────────────────────────────────┤
│ Persona:                                            │
│   Position: (2200, 280)                             │
│   State: WALK                                       │
│   Target: (2600, 280)                               │
├─────────────────────────────────────────────────────┤
│ Bosses:                                             │
│   Super (unraveller): PRESENT (α=0.50)              │
│   Mini-1: SLAIN (α=0.00)                            │
│   Mini-6: PRESENT (α=0.50)                          │
│   Mini-7: SILHOUETTE (α=0.15)                       │
├─────────────────────────────────────────────────────┤
│ Active Tweens: 3                                    │
│ FPS: 60                                             │
└─────────────────────────────────────────────────────┘
```

---

**End of Visual Guide**

For implementation details, see:
- `WEEK2_DAYS8-9_SUMMARY.md`
- `WEEK2_DAYS8-9_COMPLETION_REPORT.md`

For code references:
- `src/lib/phaser/entities/Persona.ts`
- `src/lib/phaser/entities/Boss.ts`
- `src/lib/phaser/scenes/WorldMapScene.ts`
