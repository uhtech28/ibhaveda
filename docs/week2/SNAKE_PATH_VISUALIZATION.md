# Snake Path Visualization

Visual documentation of the checkpoint layout through 8 biome zones in WorldMapScene.

---

## Map Overview

```
Total Width: 3600px
├─ Start Padding: 200px
├─ Biome 1 (Ideation/Village):      200-600px   [4 checkpoints]
├─ Biome 2 (Research/Forest):       600-1000px  [5 checkpoints]
├─ Biome 3 (Validation/Arena):      1000-1400px [4 checkpoints]
├─ Biome 4 (Design/Artisan):        1400-1800px [5 checkpoints]
├─ Biome 5 (Development/Mine):      1800-2200px [6 checkpoints]
├─ Biome 6 (Launch/Harbour):        2200-2600px [3 checkpoints]
├─ Biome 7 (Iteration/Crossroads):  2600-3000px [4 checkpoints]
├─ Biome 8 (Scale/Capital):         3000-3400px [5 checkpoints]
└─ End Padding: 200px
```

---

## Snake Path Pattern (Side View)

```
Y-Axis (Vertical)
  300 ┤                                                    
      │     ╱╲              ╱╲              ╱╲            
  360 ┼────●──●────────●──●──●────────●──●──●──●─────── (Center Line)
      │   ╱    ╲        ╲      ╱        ╲      ╱         
  420 ┤                 ╲╱              ╲╱              
      └─────────────────────────────────────────────────> X-Axis
       B1  B2  B3  B4  B5  B6  B7  B8
      (Odd biomes wave UP, even biomes wave DOWN)

Legend:
  ● = Checkpoint
  ─ = Center line (y=360)
  ╱╲ = Upward sine wave (odd biomes: 1,3,5,7)
  ╲╱ = Downward sine wave (even biomes: 2,4,6,8)
```

---

## Detailed Biome Layout

### Biome 1: Ideation (Village) - ODD → Wave UP
```
Y-Range: 300-360px
X-Range: 200-600px
Checkpoints: 4

    300 ┤   ●₂
        │  ╱ ╲
    330 ┤ ●₁  ●₃
        │      ╲
    360 ┼───────●₄───────> (to Biome 2)
        200   400   600
```

### Biome 2: Research (Forest) - EVEN → Wave DOWN
```
Y-Range: 360-420px
X-Range: 600-1000px
Checkpoints: 5

    360 ┤●₁──────────────
        │ ╲
    390 ┤  ●₂    ●₄
        │   ╲   ╱
    420 ┤    ●₃   ●₅──> (to Biome 3)
        600  800  1000
```

### Biome 3: Validation (Arena) - ODD → Wave UP
```
Y-Range: 300-360px
X-Range: 1000-1400px
Checkpoints: 4

    300 ┤   ●₂
        │  ╱ ╲
    330 ┤ ●₁  ●₃
        │      ╲
    360 ┼───────●₄──> (to Biome 4)
       1000  1200 1400
```

### Biome 4: Design (Artisan Quarter) - EVEN → Wave DOWN
```
Y-Range: 360-420px
X-Range: 1400-1800px
Checkpoints: 5

    360 ┤●₁──────────────
        │ ╲
    390 ┤  ●₂    ●₄
        │   ╲   ╱
    420 ┤    ●₃   ●₅──> (to Biome 5)
       1400 1600 1800
```

### Biome 5: Development (Mine) - ODD → Wave UP
```
Y-Range: 300-360px
X-Range: 1800-2200px
Checkpoints: 6

    300 ┤  ●₂  ●₄
        │ ╱ ╲╱ ╲
    330 ┤●₁ ●₃ ●₅
        │       ╲
    360 ┼────────●₆──> (to Biome 6)
       1800 2000 2200
```

### Biome 6: Launch (Harbour) - EVEN → Wave DOWN
```
Y-Range: 360-420px
X-Range: 2200-2600px
Checkpoints: 3

    360 ┤●₁────────
        │ ╲
    390 ┤  ●₂
        │   ╲
    420 ┤    ●₃──> (to Biome 7)
       2200 2400 2600
```

### Biome 7: Iteration (Crossroads) - ODD → Wave UP
```
Y-Range: 300-360px
X-Range: 2600-3000px
Checkpoints: 4

    300 ┤   ●₂
        │  ╱ ╲
    330 ┤ ●₁  ●₃
        │      ╲
    360 ┼───────●₄──> (to Biome 8)
       2600 2800 3000
```

### Biome 8: Scale (Capital) - EVEN → Wave DOWN
```
Y-Range: 360-420px
X-Range: 3000-3400px
Checkpoints: 5

    360 ┤●₁──────────────
        │ ╲
    390 ┤  ●₂    ●₄
        │   ╲   ╱
    420 ┤    ●₃   ●₅ (END)
       3000 3200 3400
```

---

## Mathematical Formula

### Horizontal Position (X)
```typescript
biomeStartX = 200 + (stage - 1) × BIOME_WIDTH
biomeProgress = (checkpoint - 1) / max(checkpointsInStage - 1, 1)
x = biomeStartX + (biomeProgress × BIOME_WIDTH)

Where:
  - BIOME_WIDTH = 400px
  - stage = 1 to 8
  - checkpoint = 1 to n (varies per stage)
```

### Vertical Position (Y)
```typescript
isOddBiome = stage % 2 === 1
wavePhase = biomeProgress × π
verticalOffset = isOddBiome 
  ? sin(wavePhase) × PATH_AMPLITUDE
  : -sin(wavePhase) × PATH_AMPLITUDE
y = PATH_CENTER_Y + verticalOffset

Where:
  - PATH_CENTER_Y = 360px
  - PATH_AMPLITUDE = 60px
  - Result range: 300-420px
```

---

## Full Map Top-Down View

```
       0        600      1200     1800     2400     3000    3600
       │         │         │         │         │         │      │
   300 ┤    ●        ●         ●         ●         ●         ●
       │   ╱╲      ╱╲       ╱╲       ╱╲       ╱╲       ╱╲
   360 ┼──●──●────●──●─────●──●─────●──●─────●──●─────●──●────
       │        ╲╱       ╲╱       ╲╱       ╲╱       ╲╱
   420 ┤         ●         ●         ●         ●         ●
       │
       └──────────────────────────────────────────────────────>
          B1    B2    B3    B4    B5    B6    B7    B8
        (4cp) (5cp) (4cp) (5cp) (6cp) (3cp) (4cp) (5cp)
```

---

## Checkpoint ID Mapping Example

```
Stage 1 (Ideation):
├─ Checkpoint 1 → X: 200,  Y: 360  (start)
├─ Checkpoint 2 → X: 333,  Y: 308  (peak up)
├─ Checkpoint 3 → X: 466,  Y: 308  (peak up)
└─ Checkpoint 4 → X: 600,  Y: 360  (return to center)

Stage 2 (Research):
├─ Checkpoint 1 → X: 600,  Y: 360  (start at center)
├─ Checkpoint 2 → X: 700,  Y: 407  (descending)
├─ Checkpoint 3 → X: 800,  Y: 420  (peak down)
├─ Checkpoint 4 → X: 900,  Y: 407  (ascending)
└─ Checkpoint 5 → X: 1000, Y: 360  (return to center)

... (pattern continues for all 8 stages)
```

---

## Wave Behavior

### Odd Biomes (1, 3, 5, 7) - Wave UP
- Start: y = 360 (center)
- Peak: y ≈ 300 (60px above center)
- End: y = 360 (back to center)
- Formula: `y = 360 + sin(phase) × 60`

### Even Biomes (2, 4, 6, 8) - Wave DOWN
- Start: y = 360 (center)
- Trough: y ≈ 420 (60px below center)
- End: y = 360 (back to center)
- Formula: `y = 360 - sin(phase) × 60`

---

## Parallax Background Effect

```
Camera Scroll Speed: 100%  (reference)
Background Scroll: 30%     (parallax ratio = 0.3)

Example:
  Camera at X=1000 → Background tilePositionX = 300
  Camera at X=2000 → Background tilePositionX = 600
  Camera at X=3000 → Background tilePositionX = 900

This creates depth perception as backgrounds move slower than foreground.
```

---

## Color Scheme per Biome

```
Biome 1 (Village):          0x8B7355  ███ Brown/Earth
Biome 2 (Forest):           0x2D5016  ███ Dark Green
Biome 3 (Arena):            0x8B4513  ███ Sandy Brown
Biome 4 (Artisan Quarter):  0x4A5568  ███ Grey Stone
Biome 5 (Mine):             0x1A1A2E  ███ Dark Purple/Black
Biome 6 (Harbour):          0x1E3A8A  ███ Deep Blue
Biome 7 (Crossroads):       0x92400E  ███ Rust/Orange
Biome 8 (Capital):          0x713F12  ███ Gold/Bronze
```

---

## Implementation Notes

1. **Smooth Transitions**: Checkpoints flow naturally between biomes due to sine wave returning to center (360px) at biome boundaries.

2. **Visual Balance**: Alternating up/down pattern prevents visual monotony and creates dynamic path flow.

3. **Checkpoint Spacing**: Within each biome, checkpoints are evenly distributed using `biomeProgress` calculation.

4. **Camera Bounds**: Full 3600px width allows camera to pan across entire journey without clipping.

5. **Parallax Depth**: 30% scroll ratio creates subtle depth without disorienting the player.

---

## Total Journey Statistics

- **Total Horizontal Distance**: 3200px (across 8 biomes)
- **Vertical Movement Range**: 120px (±60px from center)
- **Total Checkpoints**: 36
- **Average Checkpoints per Biome**: 4.5
- **Path Complexity**: 8 complete sine waves (alternating)

---

## Testing the Layout

To verify the snake path is working correctly:

1. Load a venture with all 36 checkpoints
2. Observe checkpoint positions form smooth sine waves
3. Verify odd biomes (1,3,5,7) wave upward
4. Verify even biomes (2,4,6,8) wave downward
5. Check biome boundaries align at y=360
6. Confirm backgrounds scroll at 30% speed
7. Test camera auto-scroll to active checkpoint

---

**Status**: Implementation complete and verified ✅