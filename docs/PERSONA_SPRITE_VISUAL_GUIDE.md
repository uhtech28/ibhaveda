# Persona Sprite Visual Guide

**Purpose**: Visual reference for placeholder persona sprites  
**Status**: Currently in use (awaiting final pixel art)

---

## Color Coding

### Male Persona
- **Background**: `#4a90e2` (Blue)
- **Head**: `#ffd4a3` (Tan/Skin)
- **Body**: `#4a90e2` (Blue - matches background)
- **Legs**: `#333333` (Dark Gray)
- **Border**: `#ffffff` @ 50% opacity

### Female Persona
- **Background**: `#e94b9c` (Pink)
- **Head**: `#ffd4a3` (Tan/Skin)
- **Body**: `#e94b9c` (Pink - matches background)
- **Legs**: `#333333` (Dark Gray)
- **Border**: `#ffffff` @ 50% opacity

---

## Sprite Sheet Layouts

### Male Idle Animation (128×48px)
```
┌───────┬───────┬───────┬───────┐
│   1   │   2   │   3   │   4   │  Frame numbers
├───────┼───────┼───────┼───────┤
│  ●    │  ●    │  ●    │  ●    │  Head (circle, tan)
│ ┌┴┐   │ ┌┴┐   │ ┌┴┐   │ ┌┴┐   │  Body (rectangle, blue)
│ │ │   │ │ │   │ │ │   │ │ │   │
│ ╵ ╵   │ ╵ ╵   │ ╵ ╵   │ ╵ ╵   │  Legs (parallel, gray)
│       │       │       │       │
│  [1]  │  [2]  │  [3]  │  [4]  │  Debug labels
└───────┴───────┴───────┴───────┘
 32px    32px    32px    32px
```

### Male Walk Animation (192×48px)
```
┌───────┬───────┬───────┬───────┬───────┬───────┐
│   1   │   2   │   3   │   4   │   5   │   6   │  Frame numbers
├───────┼───────┼───────┼───────┼───────┼───────┤
│  ●    │  ●    │  ●    │  ●    │  ●    │  ●    │  Head
│ ┌┴┐   │ ┌┴┐   │ ┌┴┐   │ ┌┴┐   │ ┌┴┐   │ ┌┴┐   │  Body
│ │ │   │ │ │   │ │ │   │ │ │   │ │ │   │ │ │   │
│╱ ╲    │ │ ╲   │╱  │   │╲ ╱    │ ╲│    │ │ ╱   │  Legs (alternating)
│       │       │       │       │       │       │
│  [1]  │  [2]  │  [3]  │  [4]  │  [5]  │  [6]  │  Debug labels
└───────┴───────┴───────┴───────┴───────┴───────┘
 32px    32px    32px    32px    32px    32px
```

### Female Idle Animation (128×48px)
```
┌───────┬───────┬───────┬───────┐
│   1   │   2   │   3   │   4   │  Frame numbers
├───────┼───────┼───────┼───────┤
│  ●    │  ●    │  ●    │  ●    │  Head (circle, tan)
│ ┌┴┐   │ ┌┴┐   │ ┌┴┐   │ ┌┴┐   │  Body (rectangle, PINK)
│ │ │   │ │ │   │ │ │   │ │ │   │
│ ╵ ╵   │ ╵ ╵   │ ╵ ╵   │ ╵ ╵   │  Legs (parallel, gray)
│       │       │       │       │
│  [1]  │  [2]  │  [3]  │  [4]  │  Debug labels
└───────┴───────┴───────┴───────┘
 32px    32px    32px    32px
```

### Female Walk Animation (192×48px)
```
┌───────┬───────┬───────┬───────┬───────┬───────┐
│   1   │   2   │   3   │   4   │   5   │   6   │  Frame numbers
├───────┼───────┼───────┼───────┼───────┼───────┤
│  ●    │  ●    │  ●    │  ●    │  ●    │  ●    │  Head
│ ┌┴┐   │ ┌┴┐   │ ┌┴┐   │ ┌┴┐   │ ┌┴┐   │ ┌┴┐   │  Body (PINK)
│ │ │   │ │ │   │ │ │   │ │ │   │ │ │   │ │ │   │
│╱ ╲    │ │ ╲   │╱  │   │╲ ╱    │ ╲│    │ │ ╱   │  Legs (alternating)
│       │       │       │       │       │       │
│  [1]  │  [2]  │  [3]  │  [4]  │  [5]  │  [6]  │  Debug labels
└───────┴───────┴───────┴───────┴───────┴───────┘
 32px    32px    32px    32px    32px    32px
```

---

## Individual Frame Breakdown

### Idle Frame Structure (32×48px)
```
Pixel Layout:
0        16        32
┌─────────────────┐  0
│ ╔═════════════╗ │
│ ║   BLUE or   ║ │  2
│ ║    PINK     ║ │
│ ║   BORDER    ║ │
│ ║             ║ │  8
│ ║      ●      ║ │  ← Head (y: 12, radius: 6px)
│ ║             ║ │  16
│ ║             ║ │
│ ║    ┌───┐    ║ │  ← Body (y: 18-32)
│ ║    │   │    ║ │  24
│ ║    │   │    ║ │
│ ║    │   │    ║ │
│ ║    │   │    ║ │  32
│ ║    ╵   ╵    ║ │  ← Legs (y: 32-40)
│ ║             ║ │
│ ║             ║ │  40
│ ║     [1]     ║ │  ← Label (y: 42)
│ ╚═════════════╝ │
└─────────────────┘  48
```

### Walk Frame Structure (32×48px, Frame 1 example)
```
Pixel Layout:
0        16        32
┌─────────────────┐  0
│ ╔═════════════╗ │
│ ║   BLUE or   ║ │  2
│ ║    PINK     ║ │
│ ║   BORDER    ║ │
│ ║             ║ │  8
│ ║      ●      ║ │  ← Head (y: 12)
│ ║             ║ │  16
│ ║             ║ │
│ ║    ┌───┐    ║ │  ← Body (y: 18-32)
│ ║    │   │    ║ │  24
│ ║    │   │    ║ │
│ ║    │   │    ║ │
│ ║   ╱│   │╲   ║ │  32 ← Legs OFFSET (alternating)
│ ║             ║ │
│ ║             ║ │  40
│ ║     [1]     ║ │  ← Label (y: 42)
│ ╚═════════════╝ │
└─────────────────┘  48
```

---

## Animation Sequences

### Idle Animation Loop (4 frames @ 4fps = 1 second total)
```
Frame 1   Frame 2   Frame 3   Frame 4   (Loop back to 1)
  ↓         ↓         ↓         ↓
┌───┐    ┌───┐    ┌───┐    ┌───┐
│ ● │    │ ● │    │ ● │    │ ● │
│┌─┐│    │┌─┐│    │┌─┐│    │┌─┐│
││ ││    ││ ││    ││ ││    ││ ││
│╵ ╵│    │╵ ╵│    │╵ ╵│    │╵ ╵│
└───┘    └───┘    └───┘    └───┘
 250ms    250ms    250ms    250ms

+ Shadow pulses: scale 1.0 → 0.85 → 1.0 over 1.2 seconds
```

### Walk Animation Loop (6 frames @ 8fps = 0.75 seconds total)
```
Frame 1   Frame 2   Frame 3   Frame 4   Frame 5   Frame 6
  ↓         ↓         ↓         ↓         ↓         ↓
┌───┐    ┌───┐    ┌───┐    ┌───┐    ┌───┐    ┌───┐
│ ● │    │ ● │    │ ● │    │ ● │    │ ● │    │ ● │
│┌─┐│    │┌─┐│    │┌─┐│    │┌─┐│    │┌─┐│    │┌─┐│
││ ││    ││ ││    ││ ││    ││ ││    ││ ││    ││ ││
│╱ ╲│    │ │╲│    │╱ ││    │╲ ╱│    │╲│ │    │ │╱│
└───┘    └───┘    └───┘    └───┘    └───┘    └───┘
125ms    125ms    125ms    125ms    125ms    125ms

Contact  Recoil  Passing  HighPt  Contact Recoil
(left)           (cross)          (right)

Shadow: Static during walk (no pulse)
```

---

## Rendering Details

### Actual Rendered Size
- **Native**: 32×48px (sprite sheet frame size)
- **Scale**: 3× nearest-neighbor
- **Display**: 96×144px on screen
- **Origin**: (0.5, 1.0) - center-bottom (feet at y=0)

### In-Game Appearance
```
┌─────────────────────────────┐
│      World Map Scene        │
│                             │
│         Checkpoint          │
│            ╔═╗              │
│            ║ ║              │
│            ╚═╝              │
│                             │
│             ●               │  ← Persona head
│            ┌┴┐              │  ← Persona body (96px wide)
│            │ │              │
│            │ │              │  (144px tall)
│            ╵ ╵              │  ← Feet at checkpoint level
│       ╱═════════╲           │  ← Shadow ellipse (48×14)
│                             │
└─────────────────────────────┘
```

### Shadow Details
```
Shadow Ellipse Properties:
- Size: 48×14 pixels
- Color: #000000 @ 25% opacity
- Position: (0, 66) relative to container
- Depth: Behind sprite (added to container first)

Idle Animation:
- Pulse: scale 1.0 ↔ 0.85 (both X and Y)
- Duration: 1200ms each direction
- Easing: Sine.InOut
- Repeat: Infinite

Walk Animation:
- No pulse (static shadow)
```

---

## Gender Comparison

### Side-by-Side Visual
```
MALE (BLUE)              FEMALE (PINK)
┌─────────────┐          ┌─────────────┐
│ ╔═════════╗ │          │ ╔═════════╗ │
│ ║  #4a90e2║ │          │ ║ #e94b9c ║ │
│ ║    ●    ║ │          │ ║    ●    ║ │
│ ║   ┌─┐   ║ │          │ ║   ┌─┐   ║ │
│ ║   │ │   ║ │          │ ║   │ │   ║ │
│ ║   ╵ ╵   ║ │          │ ║   ╵ ╵   ║ │
│ ║   [1]   ║ │          │ ║   [1]   ║ │
│ ╚═════════╝ │          │ ╚═════════╝ │
└─────────────┘          └─────────────┘
  The Founder            The Visionary
```

---

## Debug Labels

Each frame includes a small debug label at the bottom:
```
┌─────┐
│     │
│  ●  │
│ ┌─┐ │
│ │ │ │
│ ╵ ╵ │
│     │
│ [2] │  ← White text on black background
└─────┘    Font: 8px, Alpha: 0.7
```

Purpose:
- Verify animation is playing
- Check frame order is correct
- Debug timing issues
- Confirm sprite sheet loaded properly

**In Final Assets**: These labels will NOT be present

---

## Code Integration Points

### Loading
```typescript
// AssetLoader.preloadAssets()
scene.load.spritesheet("persona_male_idle_sheet", "/assets/persona/male_idle.png", {
  frameWidth: 32,
  frameHeight: 48,
});
```

### Generation (Fallback)
```typescript
// AssetLoader.createPersonaSpriteSheets()
const width = FRAME_WIDTH * sheet.frames;  // 128px or 192px
const height = FRAME_HEIGHT;                // 48px
gfx.generateTexture(sheet.key, width, height);
```

### Animation Creation
```typescript
// AssetLoader.createPersonaAnimations()
scene.anims.create({
  key: "persona_male_idle",
  frames: scene.anims.generateFrameNumbers("persona_male_idle_sheet", {
    start: 0,
    end: 3,  // 4 frames (0-3)
  }),
  frameRate: 4,
  repeat: -1,
});
```

### Playback
```typescript
// Persona.ts
this.sprite.play("persona_male_idle", true);  // Force restart
```

---

## Testing Checklist

### Visual Tests
- [ ] Idle animation plays smoothly (4 frames cycling)
- [ ] Walk animation plays during movement (6 frames cycling)
- [ ] Male sprite is blue
- [ ] Female sprite is pink
- [ ] Frame labels are visible (1-4 or 1-6)
- [ ] Shadow pulses during idle
- [ ] Shadow is static during walk
- [ ] Sprite renders at 3× scale (96×144px)
- [ ] Origin is at feet (bottom-center)

### Functional Tests
- [ ] Gender switching shows different colors
- [ ] Idle → Walk transition is smooth
- [ ] Walk → Idle transition is smooth
- [ ] No sprite flickering
- [ ] No animation stuttering
- [ ] Frame rate is correct (4fps idle, 8fps walk)

### Console Tests
```javascript
// Verify animations exist
scene.anims.exists('persona_male_idle')    // → true
scene.anims.exists('persona_male_walk')    // → true
scene.anims.exists('persona_female_idle')  // → true
scene.anims.exists('persona_female_walk')  // → true

// Verify sprite sheets exist
scene.textures.exists('persona_male_idle_sheet')    // → true
scene.textures.exists('persona_male_walk_sheet')    // → true
scene.textures.exists('persona_female_idle_sheet')  // → true
scene.textures.exists('persona_female_walk_sheet')  // → true
```

---

## Final Asset Guidelines

When replacing placeholders with final pixel art:

### Design Constraints
1. **Frame size**: Exactly 32×48 pixels per frame
2. **Layout**: Horizontal strip (all frames in one row)
3. **Spacing**: No padding between frames
4. **Format**: PNG with transparency
5. **Style**: Pixel art (no anti-aliasing)

### Character Details
- **Male**: Business casual, backpack, professional
- **Female**: Professional attire, accessories, confident
- **Origin**: Feet should be at bottom-center of frame
- **Head clearance**: Leave room at top for proper scaling

### Animation Tips
- **Idle**: Subtle breathing (chest rises slightly)
- **Walk**: Classic 6-frame cycle (contact, recoil, passing, high point, contact, recoil)
- **Consistency**: Keep character width/height consistent across all frames
- **Test**: Verify at 3× scale (96×144px) in-game

---

## Summary

The placeholder sprite system provides:
1. **Visual Feedback**: Clear color-coded sprites
2. **Debug Tools**: Frame labels for verification
3. **Animation Testing**: Full animation system operational
4. **Drop-in Replacement**: Final assets require zero code changes

**Status**: Ready for final pixel art delivery