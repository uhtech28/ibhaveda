# Snake Path Layout - Visual Diagram

## Overview Map Structure

```
┌────────────────────────────────────────── 3600px Total Width ──────────────────────────────────────────┐
│                                                                                                          │
│  200px │         400px        │         400px        │         400px        │         400px        │...  │
│  Pad   │       Biome 1        │       Biome 2        │       Biome 3        │       Biome 4        │...  │
│        │      IDEATION        │      RESEARCH        │     VALIDATION       │       DESIGN         │     │
│        │     (4 checkpts)     │     (5 checkpts)     │     (4 checkpts)     │     (5 checkpts)     │     │
│        │                      │                      │                      │                      │     │
│        │                      │                      │                      │                      │     │
│ ───────┼──────────────────────┼──────────────────────┼──────────────────────┼──────────────────────┼─... │
│        │                      │                      │                      │                      │     │
│        │    ●─────●─────●─────●    ●─────●─────●─────●─────●    ●─────●─────●─────●                │     │
│        │                      │                      │                      │                      │     │
└────────┴──────────────────────┴──────────────────────┴──────────────────────┴──────────────────────┴─────┘
         0                    600                   1000                   1400                   1800
```

## Full 8-Biome Layout

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                         │
│     STAGE 1      │    STAGE 2      │    STAGE 3      │    STAGE 4      │    STAGE 5      │  STAGE 6   │
│    Ideation      │   Research      │  Validation     │     Design      │  Development    │   Launch   │
│   (Village)      │   (Forest)      │    (Arena)      │ (Artisan Qtr)   │     (Mine)      │  (Harbour) │
│   4 checkpts     │   5 checkpts    │   4 checkpts    │   5 checkpts    │   6 checkpts    │ 3 checkpts │
│                  │                 │                 │                 │                 │            │
│                  │                 │                 │                 │                 │            │
│      ╱‾‾●‾‾╲     │     ╲____●____╱ │      ╱‾‾●‾‾╲    │     ╲____●____╱ │      ╱‾‾●‾‾╲    │  ╲___●___╱│
│     ●        ●   │    ●          ● │     ●        ●  │    ●          ● │     ●        ● │●         ●│
│    ●          ●  │   ●            ●│    ●          ● │   ●            ●│    ●          ●│           │
│                  │  ●              │                 │  ●              │   ●            │            │
│                  │ ●               │                 │ ●               │  ●             │            │
├──────────────────┼─────────────────┼─────────────────┼─────────────────┼─────────────────┼────────────┤
│   200-600px      │   600-1000px    │  1000-1400px    │  1400-1800px    │  1800-2200px    │ 2200-2600  │
└──────────────────┴─────────────────┴─────────────────┴─────────────────┴─────────────────┴────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                             │
│    STAGE 7      │    STAGE 8      │   200px                                                │
│   Iteration     │     Scale       │   Padding                                              │
│ (Crossroads)    │   (Capital)     │                                                        │
│   4 checkpts    │   5 checkpts    │                                                        │
│                 │                 │                                                        │
│                 │                 │                                                        │
│      ╱‾‾●‾‾╲    │     ╲____●____╱ │                                                        │
│     ●        ●  │    ●          ● │                                                        │
│    ●          ● │   ●            ●│                                                        │
│                 │  ●              │                                                        │
│                 │ ●               │                                                        │
├─────────────────┼─────────────────┼────────────────────────────────────────────────────────┤
│  2600-3000px    │  3000-3400px    │  3400-3600px                                           │
└─────────────────┴─────────────────┴────────────────────────────────────────────────────────┘
```

## Detailed Wave Pattern

### Odd Biomes (1, 3, 5, 7) - Upward Wave

```
Y = 300 ────────────────●──────────────── (Peak)
                      ╱   ╲
Y = 330 ─────────●──────────●─────────── 
                ╱             ╲
Y = 360 ───●────────────────────●─────── (Center Line)
        
        Progress: 0% → 25% → 50% → 75% → 100%
```

**Formula:** `y = 360 + sin(progress * π) * 60`

### Even Biomes (2, 4, 6, 8) - Downward Wave

```
Y = 360 ───●────────────────────●─────── (Center Line)
                ╲             ╱
Y = 390 ─────────●──────────●─────────── 
                      ╲   ╱
Y = 420 ────────────────●──────────────── (Trough)

        Progress: 0% → 25% → 50% → 75% → 100%
```

**Formula:** `y = 360 - sin(progress * π) * 60`

## Checkpoint Distribution Detail

### Stage 1 - Ideation (4 checkpoints)
```
Biome Zone: 200-600px (400px wide)
Checkpoints: 4
Spacing: 400 / (4+1) = 80px per checkpoint
Offset: +50px from biome start

Positions:
● CP1: x = 200 + (0 * 80) + 50 = 250px,  y = 360 + sin(0.00π) * 60 = 360px
● CP2: x = 200 + (1 * 80) + 50 = 330px,  y = 360 + sin(0.33π) * 60 = 337px
● CP3: x = 200 + (2 * 80) + 50 = 410px,  y = 360 + sin(0.67π) * 60 = 337px
● CP4: x = 200 + (3 * 80) + 50 = 490px,  y = 360 + sin(1.00π) * 60 = 360px

Pattern: ╱‾‾‾╲ (upward curve)
```

### Stage 2 - Research (5 checkpoints)
```
Biome Zone: 600-1000px (400px wide)
Checkpoints: 5
Spacing: 400 / (5+1) ≈ 66.67px per checkpoint
Offset: +50px from biome start

Positions:
● CP1: x = 600 + (0 * 66.67) + 50 = 650px,   y = 360 - sin(0.00π) * 60 = 360px
● CP2: x = 600 + (1 * 66.67) + 50 = 716px,   y = 360 - sin(0.25π) * 60 = 383px
● CP3: x = 600 + (2 * 66.67) + 50 = 783px,   y = 360 - sin(0.50π) * 60 = 420px
● CP4: x = 600 + (3 * 66.67) + 50 = 850px,   y = 360 - sin(0.75π) * 60 = 383px
● CP5: x = 600 + (4 * 66.67) + 50 = 916px,   y = 360 - sin(1.00π) * 60 = 360px

Pattern: ╲____╱ (downward curve)
```

### Stage 5 - Development (6 checkpoints) - Longest Stage
```
Biome Zone: 1800-2200px (400px wide)
Checkpoints: 6
Spacing: 400 / (6+1) ≈ 57.14px per checkpoint
Offset: +50px from biome start

Positions:
● CP1: x = 1800 + (0 * 57.14) + 50 = 1850px,  y = 360 + sin(0.00π) * 60 = 360px
● CP2: x = 1800 + (1 * 57.14) + 50 = 1907px,  y = 360 + sin(0.20π) * 60 = 323px
● CP3: x = 1800 + (2 * 57.14) + 50 = 1964px,  y = 360 + sin(0.40π) * 60 = 312px
● CP4: x = 1800 + (3 * 57.14) + 50 = 2021px,  y = 360 + sin(0.60π) * 60 = 312px
● CP5: x = 1800 + (4 * 57.14) + 50 = 2078px,  y = 360 + sin(0.80π) * 60 = 323px
● CP6: x = 1800 + (5 * 57.14) + 50 = 2135px,  y = 360 + sin(1.00π) * 60 = 360px

Pattern: ╱‾‾‾‾‾╲ (upward curve, more checkpoints)
```

### Stage 6 - Launch (3 checkpoints) - Shortest Stage
```
Biome Zone: 2200-2600px (400px wide)
Checkpoints: 3
Spacing: 400 / (3+1) = 100px per checkpoint
Offset: +50px from biome start

Positions:
● CP1: x = 2200 + (0 * 100) + 50 = 2250px,  y = 360 - sin(0.00π) * 60 = 360px
● CP2: x = 2200 + (1 * 100) + 50 = 2350px,  y = 360 - sin(0.50π) * 60 = 420px
● CP3: x = 2200 + (2 * 100) + 50 = 2450px,  y = 360 - sin(1.00π) * 60 = 360px

Pattern: ╲__╱ (downward curve, wider spacing)
```

## Complete Path Flow Visualization

```
START (x=250)                                                          END (x=3350)
  ↓                                                                         ↓
  ●═════════════════════════════════════════════════════════════════════════●

  Stage 1      Stage 2      Stage 3      Stage 4      Stage 5      Stage 6      Stage 7      Stage 8
  (4 CP)       (5 CP)       (4 CP)       (5 CP)       (6 CP)       (3 CP)       (4 CP)       (5 CP)
  
   ╱‾●‾╲       ╲__●__╱       ╱‾●‾╲       ╲__●__╱       ╱‾●‾╲       ╲_●_╱       ╱‾●‾╲       ╲__●__╱
  ●     ●     ●      ●     ●     ●     ●      ●     ●     ●     ●     ●     ●     ●     ●      ●
  ●     ●    ●        ●    ●     ●    ●        ●   ●       ●                 ●     ●    ●        ●
         ●  ●          ●        ●    ●          ● ●         ●                     ●    ●          ●
            ●                         ●           ●                                    ●

  UP      DOWN         UP       DOWN         UP       DOWN         UP       DOWN
  (Odd)   (Even)       (Odd)    (Even)       (Odd)    (Even)       (Odd)    (Even)

  200     600          1000     1400         1800     2200         2600     3000     3400
  ├───────┤────────────┤────────┤────────────┤────────┤────────────┤────────┤────────┤────┤
  Pad     Biome1       Biome2   Biome3       Biome4   Biome5       Biome6   Biome7   B8  Pad
```

## Camera Viewport Movement

```
Initial View (1280px viewport):
┌─────────────────────────────┐
│ Visible: Stages 1, 2, 3     │
│ [●●●●] [●●●●●] [●●●●]        │
└─────────────────────────────┘
0                           1280

Middle View (scrolled):
                    ┌─────────────────────────────┐
                    │ Visible: Stages 4, 5, 6     │
                    │ [●●●●●] [●●●●●●] [●●●]      │
                    └─────────────────────────────┘
                  1160                         2440

End View (scrolled to end):
                                            ┌─────────────────────────────┐
                                            │ Visible: Stages 7, 8        │
                                            │ [●●●●] [●●●●●]              │
                                            └─────────────────────────────┘
                                          2320                         3600
```

## Biome Separator Lines

```
Line 1: x = 600   (Between Stage 1 & 2)
Line 2: x = 1000  (Between Stage 2 & 3)
Line 3: x = 1400  (Between Stage 3 & 4)
Line 4: x = 1800  (Between Stage 4 & 5)
Line 5: x = 2200  (Between Stage 5 & 6)
Line 6: x = 2600  (Between Stage 6 & 7)
Line 7: x = 3000  (Between Stage 7 & 8)

Visual:
    │         │         │         │         │         │         │
    │  Zone1  │  Zone2  │  Zone3  │  Zone4  │  Zone5  │  Zone6  │  Zone7  │  Zone8  │
    │         │         │         │         │         │         │         │         │
```

## Stage Label Positioning

```
Y = 50px (top of map)
Each label centered within its biome:

Stage 1: x = 200 + 400/2 = 400px   "Ideation" + "Stage 1"
Stage 2: x = 600 + 400/2 = 800px   "Research" + "Stage 2"
Stage 3: x = 1000 + 400/2 = 1200px "Validation" + "Stage 3"
Stage 4: x = 1400 + 400/2 = 1600px "Design" + "Stage 4"
Stage 5: x = 1800 + 400/2 = 2000px "Development" + "Stage 5"
Stage 6: x = 2200 + 400/2 = 2400px "Launch" + "Stage 6"
Stage 7: x = 2600 + 400/2 = 2800px "Iteration" + "Stage 7"
Stage 8: x = 3000 + 400/2 = 3200px "Scale" + "Stage 8"
```

## Coordinate Reference Table

| Stage | Name        | Biome Zone    | Checkpoints | X Range       | Wave Type  |
|-------|-------------|---------------|-------------|---------------|------------|
| 1     | Ideation    | 200-600       | 4           | 250-490       | Upward ╱╲  |
| 2     | Research    | 600-1000      | 5           | 650-916       | Down ╲╱    |
| 3     | Validation  | 1000-1400     | 4           | 1050-1290     | Upward ╱╲  |
| 4     | Design      | 1400-1800     | 5           | 1450-1716     | Down ╲╱    |
| 5     | Development | 1800-2200     | 6           | 1850-2135     | Upward ╱╲  |
| 6     | Launch      | 2200-2600     | 3           | 2250-2450     | Down ╲╱    |
| 7     | Iteration   | 2600-3000     | 4           | 2650-2890     | Upward ╱╲  |
| 8     | Scale       | 3000-3400     | 5           | 3050-3316     | Down ╲╱    |

## Implementation Constants

```typescript
const BIOME_WIDTH = 400           // Each biome zone width
const CHECKPOINT_SPACING_X = 100  // (Not used directly, calculated per biome)
const CHECKPOINT_SPACING_Y = 80   // Vertical wave spacing
const START_X = 200               // Left padding
const START_Y = 360               // Vertical center (720/2)
const PATH_AMPLITUDE = 60         // Sine wave amplitude (±60px)
const MAP_WIDTH = 3600            // Total map width
const MAP_HEIGHT = 720            // Total map height
```

## Mathematical Formula

```typescript
// For each checkpoint at position i within stage s:
const biomeStartX = START_X + (stage - 1) * BIOME_WIDTH
const posInBiome = checkpoint - 1
const checkpointsInStage = getCheckpointsForStage(stage)

// X position (evenly distributed within biome)
const x = biomeStartX + (posInBiome * BIOME_WIDTH) / (checkpointsInStage + 1) + 50

// Y position (sine wave, alternating direction)
const progress = posInBiome / (checkpointsInStage - 1 || 1)
const isOddBiome = stage % 2 === 1
const verticalOffset = isOddBiome 
  ? Math.sin(progress * Math.PI) * PATH_AMPLITUDE
  : -Math.sin(progress * Math.PI) * PATH_AMPLITUDE
const y = START_Y + verticalOffset
```

## Benefits of Snake Path Layout

1. **Natural Flow:** Left-to-right progression matches reading direction
2. **Visual Grouping:** Biome zones clearly separate different stages
3. **Smooth Movement:** Sine wave creates organic, flowing path
4. **Scalability:** Easy to add/remove checkpoints per stage
5. **Camera Friendly:** Horizontal scrolling is intuitive
6. **Depth Perception:** Up/down waves add visual interest
7. **Clear Progress:** Player can see how far through journey they are

## Next Steps

- [ ] Add biome-specific background colors/gradients
- [ ] Implement animated path lines between checkpoints
- [ ] Add persona movement along the snake path
- [ ] Position boss silhouettes at biome transitions
- [ ] Add environmental particle effects per biome
- [ ] Implement parallax scrolling for background layers

---

**Total Checkpoints:** 36  
**Total Biomes:** 8  
**Map Width:** 3600px  
**Map Height:** 720px  
**Viewport:** 1280×720px (scrollable)