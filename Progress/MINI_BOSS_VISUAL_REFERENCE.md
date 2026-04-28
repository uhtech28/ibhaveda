# Mini-Boss Visual Reference Guide

## Overview

This document provides detailed visual specifications for the two mini-bosses in the Interactive Ideas venture system. Both bosses are created using procedural graphics (Phaser Graphics API) rather than sprite assets.

---

## 1. Fog of Vagueness (Stage 1 - Ideation)

### Concept
A gray, amorphous cloud of fog with glowing red eyes representing the uncertainty and lack of clarity at the start of the ideation process.

### ASCII Representation
```
        ___  ___
       /   \/   \
      /  o    o  \
     |     ___    |
      \    \_/   /
       \___/\___/
        \_____/
```

### Detailed Structure

#### Main Cloud Body
- **Shape:** 7 overlapping circles creating a cloud-like mass
- **Total Dimensions:** ~100px width × 80px height
- **Composition:**
  ```
  Circle 1: Center (50, 30) radius 35 - Main cloud mass
  Circle 2: Left (30, 40) radius 28 - Left puff
  Circle 3: Right (70, 40) radius 28 - Right puff
  Circle 4: Bottom (50, 55) radius 30 - Bottom mass
  Circle 5: Upper Left (25, 20) radius 20 - Upper left wisp
  Circle 6: Upper Right (75, 20) radius 20 - Upper right wisp
  Circle 7: Bottom (50, 70) radius 18 - Lower wisp
  ```

#### Wispy Edges (Lighter Opacity)
- **Shape:** 3 smaller circles
- **Composition:**
  ```
  Edge 1: Far Left (15, 35) radius 15
  Edge 2: Far Right (85, 35) radius 15
  Edge 3: Bottom (50, 70) radius 18
  ```

#### Eyes
- **Type:** Circular arcs with stroke
- **Position:** (35, 30) and (65, 30)
- **Size:** 6px radius each
- **Animation:** Pulse between alpha 0.7 and 1.0 over 1200ms

### Color Palette
```
Main Cloud:
  - Fill: #6B7280 (Gray-500)
  - Opacity: 0.8 (80%)

Wispy Edges:
  - Fill: #9CA3AF (Gray-400)
  - Opacity: 0.6 (60%)

Eyes:
  - Fill: #FF4444 (Bright Red)
  - Stroke: #FF0000 (Pure Red), 2px
  - Opacity: Animated 0.7-1.0
```

### Weakening States

**Full Strength (0% complete):**
```
Cloud Opacity: 100%
Eyes Opacity: 100%
Visual: Dense, menacing fog
```

**25% Complete:**
```
Cloud Opacity: 82.5%
Eyes Opacity: 82.5%
Visual: Slightly less dense
```

**50% Complete:**
```
Cloud Opacity: 65%
Eyes Opacity: 65%
Visual: Noticeably thinner
```

**75% Complete:**
```
Cloud Opacity: 47.5%
Eyes Opacity: 47.5%
Visual: Very translucent
```

**100% Complete (Just Before Slay):**
```
Cloud Opacity: 30%
Eyes Opacity: 30%
Visual: Nearly transparent, barely visible
```

### Slay Animation
```
Duration: 2000ms
Effect: Scale 1.0 → 1.5, Alpha 1.0 → 0.0
Easing: Cubic.easeOut
Result: Fog expands outward and dissipates
```

---

## 2. Pathwarden Wraith (Stage 2 - Research)

### Concept
A dark, hooded figure with protective sigils representing the guardian that blocks progress through the research stage until proper paths are validated.

### ASCII Representation
```
        /\
       /  \
      /****\
     |  o o |
     |------|
     |  ⊕ ⊕ |
     | ⊕ ◊ ⊕|
     |______|
      |    |
      |    |
       \  /
        \/
```

### Detailed Structure

#### Hood (Top Triangle)
- **Shape:** Triangle path
- **Points:**
  ```
  Top: (40, 10)
  Left: (20, 40)
  Right: (60, 40)
  ```

#### Face Void
- **Shape:** Ellipse (darker than hood)
- **Position:** (40, 30)
- **Size:** 18px width × 22px height

#### Cloak Body
- **Shape:** Rectangle
- **Position:** (15, 40)
- **Size:** 50px width × 40px height

#### Cloak Taper (Bottom)
- **Shape:** Trapezoid path
- **Points:**
  ```
  Top Left: (15, 80)
  Bottom Left: (25, 100)
  Bottom Right: (55, 100)
  Top Right: (65, 80)
  ```

#### Protective Sigils (3 total)
- **Left Sigil:**
  - Circle at (25, 55), radius 8
  - Vertical line through center
  
- **Right Sigil:**
  - Circle at (55, 55), radius 8
  - Vertical line through center
  
- **Center Sigil:**
  - Diamond shape at (40, 68)
  - Points: (40,62), (45,68), (40,74), (35,68)

#### Eyes
- **Type:** Small circular arcs
- **Position:** (33, 28) and (47, 28)
- **Size:** 3px radius each
- **Animation:** Pulse between alpha 0.4 and 0.8 over 1500ms

### Color Palette
```
Hood/Body:
  - Fill: #1A0A2E (Very Dark Purple)
  - Opacity: 0.9 (90%)

Face Void:
  - Fill: #000000 (Black)
  - Opacity: 0.95 (95%)

Cloak:
  - Fill: #2D1B4E (Dark Purple)
  - Opacity: 0.85 (85%)

Sigils:
  - Stroke: #8B5CF6 (Purple-500)
  - Stroke Width: 2px
  - Opacity: 0.8 (80%)

Eyes:
  - Fill: #DC2626 (Red-600)
  - Opacity: Animated 0.4-0.8

Cracks (when weakening):
  - Stroke: #FFFFFF (White)
  - Stroke Width: 2px
  - Opacity: 0.7 (70%)
```

### Weakening States & Crack Progression

**Full Strength (0-24% complete):**
```
Cracks: None
Visual: Pristine hooded figure
```

**25-49% Complete:**
```
Crack 1 Added: Left side crack
  Path: (25, 40) → (20, 60) → (15, 75)
Visual: First crack appears on left shoulder
```

**50-74% Complete:**
```
Crack 2 Added: Right side crack
  Path: (55, 40) → (60, 60) → (65, 75)
Visual: Second crack appears on right shoulder
```

**75-99% Complete:**
```
Crack 3 Added: Center branching crack
  Main: (40, 45) → (40, 70) → (35, 85)
  Branch: (40, 70) → (45, 85)
Visual: Major crack down the center with branches
```

**100% Complete (Just Before Slay):**
```
All cracks + additional shatter lines:
  Line 1: (30, 50) → (50, 55)
  Line 2: (25, 70) → (55, 65)
Visual: Heavily cracked, about to shatter
Crack Opacity: 100%
```

### Slay Animation
```
Duration: 2000ms total

Phase 1 (Body fade):
  Targets: bossGraphics
  Effect: Alpha 1.0 → 0.0, Y position +20px
  Duration: 1500ms
  Easing: Cubic.easeIn

Phase 2 (Crack intensify):
  Targets: cracksGraphics
  Effect: Alpha → 1.0, Scale 1.0 → 1.2
  Duration: 1000ms
  Easing: Back.easeOut

Phase 3 (Final fade):
  Targets: entire container
  Effect: Alpha 1.0 → 0.0
  Duration: 2000ms
  Easing: Sine.easeOut

Result: Wraith sinks, cracks expand, then everything fades
```

---

## Size Comparison

```
Fog of Vagueness:     100w × 80h pixels
Pathwarden Wraith:    80w × 100h pixels

Both are scaled and positioned relative to checkpoint nodes (64×64px)
```

---

## Positioning on World Map

Both mini-bosses are positioned relative to the last checkpoint of their stage:

```
lastCheckpointPosition = calculateCheckpointPosition(stage, lastCheckpoint, 0)

bossX = lastCheckpointPosition.x + 100  // 100px to the right
bossY = lastCheckpointPosition.y - 50   // 50px above
```

### Visual Layout Example
```
                    [MiniBoss]
                        ↑
                     (-50px)
                        
Checkpoint 1 → Checkpoint 2 → Checkpoint 3 → Checkpoint 4
                                                    ↓
                                             (Last checkpoint)
                                                    
                                             [Mini-Boss positioned here]
                                             (100px right, 50px up)
```

---

## Animation Timing Reference

### Fog of Vagueness
- **Eye Pulse:** 1200ms loop (yoyo)
- **Weaken Transition:** 600ms ease-out
- **Slay Animation:** 2000ms cubic-ease-out

### Pathwarden Wraith
- **Eye Pulse:** 1500ms loop (yoyo)
- **Weaken Transition:** 600ms ease-out
- **Slay Animation:** 2000ms multi-phase

---

## Implementation Notes

### Procedural Graphics Benefits
- **No Asset Loading:** Instant rendering, no HTTP requests
- **Scalable:** Can be sized up/down without quality loss
- **Themeable:** Colors can be easily adjusted
- **Performant:** Minimal draw calls

### Container Structure
```
MiniBoss Container
├── bossGraphics (main visual)
├── cracksGraphics (wraith only)
├── eyeLeft (Arc object)
├── eyeRight (Arc object)
└── namePlate (Text object)
```

---

## Color Accessibility

Both designs use high-contrast colors:
- Fog: Gray on variable backgrounds (adjusts with map)
- Wraith: Dark purple/black ensures visibility
- Red eyes: Universally recognizable threat indicator
- Purple sigils: Magical/mystical association

All colors pass WCAG AA contrast requirements for large text/graphics.

---

## Future Design Considerations

If extending to more stages:
1. Maintain consistent sizing (~80-100px range)
2. Use distinctive color palettes per boss
3. Keep weakening mechanics visually clear
4. Ensure slay animations are satisfying (1.5-2s duration)
5. Use procedural graphics for consistency