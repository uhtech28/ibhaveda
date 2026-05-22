# Biome Background Crossfade System - Visual Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    WorldMapScene.ts                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  State Variables:                                                │
│  ├─ currentBiome: number = 1                                    │
│  ├─ previousBiome: number = 1                                   │
│  └─ crossfadeTween: Phaser.Tweens.Tween | null = null          │
│                                                                  │
│  Methods:                                                        │
│  ├─ update()                                                     │
│  │   └─> getCurrentBiomeFromCameraPosition(scrollX)            │
│  │       └─> crossfadeToBiome(targetBiome)                     │
│  │                                                              │
│  └─ Tween System (Phaser)                                       │
│      ├─ Previous Biome: alpha 0.4 → 0.2 (800ms)                │
│      └─ Current Biome: alpha 0.4 → 0.6 (800ms)                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Biome Position Calculation

```
Map Layout (3600px wide):
┌─────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────┐
│Start│ Biome 1 │ Biome 2 │ Biome 3 │ Biome 4 │ Biome 5 │ Biome 6 │ Biome 7 │ Biome 8 │ End │
│200px│  400px  │  400px  │  400px  │  400px  │  400px  │  400px  │  400px  │  400px  │200px│
└─────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────┘
      ▲         ▲         ▲         ▲         ▲         ▲         ▲         ▲         ▲
     x=200     x=600    x=1000    x=1400    x=1800    x=2200    x=2600    x=3000    x=3400

Biome Calculation Formula:
  relativeX = scrollX - 200
  biome = floor(relativeX / 400) + 1
  biome = clamp(biome, 1, 8)

Example:
  scrollX = 500   → relativeX = 300  → biome = floor(0.75) + 1 = 1 ✓
  scrollX = 700   → relativeX = 500  → biome = floor(1.25) + 1 = 2 ✓
  scrollX = 1500  → relativeX = 1300 → biome = floor(3.25) + 1 = 4 ✓
```

## Crossfade State Machine

```
                   Camera Enters New Biome
                            │
                            ▼
        ┌───────────────────────────────────┐
        │   biomeIndex ≠ currentBiome?      │
        └───────────┬───────────────────────┘
                    │ YES
                    ▼
        ┌───────────────────────────────────┐
        │  Stop existing crossfadeTween     │
        └───────────┬───────────────────────┘
                    │
                    ▼
        ┌───────────────────────────────────┐
        │  previousBiome = currentBiome     │
        │  currentBiome = targetBiome       │
        └───────────┬───────────────────────┘
                    │
                    ▼
        ┌───────────────────────────────────┐
        │  Start 800ms Tween (Parallel):    │
        │  ├─ prevBg: α 0.4 → 0.2           │
        │  └─ currBg: α 0.4 → 0.6           │
        └───────────┬───────────────────────┘
                    │
                    ▼
                 [800ms]
                    │
                    ▼
        ┌───────────────────────────────────┐
        │  On Complete:                      │
        │  ├─ prevBg.setAlpha(0.4) [reset]  │
        │  └─ currBg.setAlpha(0.5) [stable] │
        └───────────────────────────────────┘
```

## Alpha Timeline Visualization

```
Biome 1 → Biome 2 Transition (800ms duration)

Previous Biome (Biome 1):
Alpha
0.6 │
    │
0.5 │
    │
0.4 │●────────────────╮
    │                  ╲
0.3 │                   ╲
    │                    ╲
0.2 │                     ●───────
    │
0.1 │
    └────────────────────────────→ Time
    0ms               800ms

Current Biome (Biome 2):
Alpha
0.6 │                     ●───────
    │                    ╱
0.5 │                   ╱
    │                  ╱
0.4 │●────────────────╯
    │
0.3 │
    │
0.2 │
    │
0.1 │
    └────────────────────────────→ Time
    0ms               800ms

Easing: Sine.easeInOut (smooth S-curve)
```

## Multi-Biome Crossfade Scenario

```
Scenario: Camera scrolls from Biome 1 → 2 → 3 rapidly

Time: 0ms
┌──────────┬──────────┬──────────┐
│ Biome 1  │ Biome 2  │ Biome 3  │
│ α = 0.5  │ α = 0.4  │ α = 0.4  │  ← Current: 1
└──────────┴──────────┴──────────┘

Time: 100ms (Camera enters Biome 2)
┌──────────┬──────────┬──────────┐
│ Biome 1  │ Biome 2  │ Biome 3  │
│ α = 0.39 │ α = 0.41 │ α = 0.4  │  ← Tween started
└──────────┴──────────┴──────────┘

Time: 400ms (Camera enters Biome 3 - mid-transition!)
┌──────────┬──────────┬──────────┐
│ Biome 1  │ Biome 2  │ Biome 3  │
│ α = 0.4  │ α = 0.4  │ α = 0.4  │  ← Previous tween STOPPED
└──────────┴──────────┴──────────┘  ← New tween started (2→3)

Time: 1200ms (800ms after new tween)
┌──────────┬──────────┬──────────┐
│ Biome 1  │ Biome 2  │ Biome 3  │
│ α = 0.4  │ α = 0.2  │ α = 0.5  │  ← Transition complete
└──────────┴──────────┴──────────┘

Key Feature: Tween interruption prevents conflicts!
```

## Integration with Existing Systems

```
┌─────────────────────────────────────────────────────────────────┐
│                        update() Loop                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Parallax Scrolling (existing)                               │
│     └─> biomeBackgrounds.forEach(bg => bg.tilePositionX = ...)  │
│                                                                  │
│  2. Biome Detection (NEW)                                       │
│     └─> biomeIndex = getCurrentBiomeFromCameraPosition(scrollX) │
│                                                                  │
│  3. Crossfade Trigger (NEW)                                     │
│     └─> if (biomeIndex !== currentBiome)                        │
│         └─> crossfadeToBiome(targetBiome)                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Performance Characteristics

```
┌────────────────────────────────────────────────────────────────┐
│ Performance Metrics                                             │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ● CPU Usage:        LOW                                        │
│   └─ Only triggers on biome change (not every frame)          │
│                                                                 │
│ ● Memory Impact:    MINIMAL                                    │
│   └─ Reuses existing TileSprite backgrounds                   │
│   └─ Only 1-2 tweens active at a time                         │
│                                                                 │
│ ● Frame Rate:       NO IMPACT                                  │
│   └─ Alpha changes handled by GPU                             │
│   └─ Tween system optimized by Phaser                         │
│                                                                 │
│ ● Render Calls:     NO ADDITIONAL CALLS                        │
│   └─ Same backgrounds, just alpha changes                     │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

## Code Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                    Every Frame (update)                          │
└────────────────┬─────────────────────────────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────┐
    │ Get camera scrollX         │
    └────────────┬───────────────┘
                 │
                 ▼
    ┌────────────────────────────┐
    │ Calculate current biome    │
    │ biome = floor((scrollX -   │
    │   200) / 400) + 1          │
    └────────────┬───────────────┘
                 │
                 ▼
    ┌────────────────────────────┐       NO
    │ biome ≠ currentBiome? ─────┼──────────> Exit (no change)
    └────────────┬───────────────┘
                 │ YES
                 ▼
    ┌────────────────────────────┐
    │ crossfadeToBiome(biome)    │
    └────────────┬───────────────┘
                 │
                 ▼
    ┌────────────────────────────┐       YES
    │ crossfadeTween exists? ────┼──────────> Stop it
    └────────────┬───────────────┘
                 │ NO
                 ▼
    ┌────────────────────────────┐
    │ previousBiome = current    │
    │ currentBiome = target      │
    └────────────┬───────────────┘
                 │
                 ▼
    ┌────────────────────────────┐
    │ Start parallel tweens:     │
    │ ├─ prevBg: 0.4 → 0.2       │
    │ └─ currBg: 0.4 → 0.6       │
    │ Duration: 800ms            │
    │ Ease: Sine.easeInOut       │
    └────────────┬───────────────┘
                 │
                 ▼
              [Wait 800ms]
                 │
                 ▼
    ┌────────────────────────────┐
    │ onComplete callbacks:      │
    │ ├─ prevBg.alpha = 0.4      │
    │ └─ currBg.alpha = 0.5      │
    └────────────────────────────┘
```

## Visual Result

```
Before Crossfade (Static):
┌──────────────────────────────────────────────────────────────┐
│ [Biome 1 @ α=0.5]  [Biome 2 @ α=0.4]  [Biome 3 @ α=0.4]     │
│                                                              │
│    Abrupt transition when crossing boundary →               │
└──────────────────────────────────────────────────────────────┘

After Crossfade (Smooth):
┌──────────────────────────────────────────────────────────────┐
│ [Biome 1 fading out]  [Biome 2 fading in]  [Biome 3 waiting]│
│        ↓ 0.2              ↑ 0.6                 0.4          │
│                                                              │
│    Smooth 800ms gradient transition →                       │
└──────────────────────────────────────────────────────────────┘
```

## Key Implementation Points

1. **State Tracking**: 
   - `currentBiome` tracks active biome
   - `previousBiome` stores last active for fade-out
   - `crossfadeTween` reference allows interruption

2. **Biome Detection**:
   - Calculated every frame in `update()`
   - Formula: `floor((scrollX - 200) / 400) + 1`
   - Clamped to range [1, 8]

3. **Tween Management**:
   - Stops existing tween before starting new one
   - Prevents tween conflicts during rapid scrolling
   - Two parallel tweens (fade out + fade in)

4. **Alpha Values**:
   - Rest state: 0.4
   - Active state: 0.5-0.6
   - Inactive state: 0.2
   - Transition smooth via Sine.easeInOut

5. **Performance**:
   - Minimal CPU impact (biome change only)
   - GPU-accelerated alpha blending
   - Reuses existing background sprites

---

**Status**: ✅ Fully Implemented and Tested
**File**: `src/lib/phaser/scenes/WorldMapScene.ts`
**Lines**: 81-84 (properties), 1116-1199 (methods + update)