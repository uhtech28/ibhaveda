# Checkpoint Animation System

Complete implementation of 6 unique checkpoint completion animations with standard and gold variants, totaling **12 distinct animations** for Interactive Ideas venture progression.

---

## 📋 Overview

The checkpoint animation system provides visually engaging feedback when users complete checkpoints in their venture journey. Each of the 8 stages has a unique animation pattern, with stages 3/7 sharing Beacon Lighting and stages 1/8 sharing Seal Break.

### Animation Patterns by Stage

| Stage | Pattern | Description |
|-------|---------|-------------|
| **S1** | Seal Break | Ancient seal shatters with crack lines and particle burst |
| **S2** | Rune Inscription | Mystical runes appear and glow with magical energy |
| **S3** | Beacon Lighting | Light beam shoots upward with rising particles |
| **S4** | Bridge Repair | Wooden planks assemble with rope attachments |
| **S5** | Compass Calibration | Compass needle spins and locks to North |
| **S6** | Ward Placement | Protective barriers form with shield activation |
| **S7** | Beacon Lighting | *Same as S3* |
| **S8** | Seal Break | *Same as S1* |

### Variants

Each animation has **two variants**:

- **Standard** (Blue): 2-second duration, blue color scheme (0x3B82F6)
- **Gold** (Amber): 3-second duration, gold/amber color scheme (0xF59E0B)

---

## 🚀 Quick Start

### Basic Usage

```typescript
import { WorldMapScene } from '@/lib/phaser/scenes/WorldMapScene'

// Inside your React component or event handler
eventBridge.dispatchToPhaser({
  type: 'PLAY_CHECKPOINT_ANIMATION',
  checkpointId: 'cp_001',
  stage: 1,
  variant: 'gold' // or 'standard'
})
```

### Direct Scene Method

```typescript
// Inside WorldMapScene
this.playCheckpointAnimation('cp_001', 1, 'gold')
```

---

## 🎨 Animation Patterns Detail

### 1. Seal Break (S1, S8)

**Visual Elements:**
- Central circular seal with mystical symbols
- 8 rune markers around the perimeter
- Crack lines appearing from center
- Explosive particle burst on shatter
- Fragments flying outward

**Stages:**
1. Seal appears with bounce (400ms)
2. Runes light up sequentially (800ms)
3. Crack lines spread (300ms)
4. Seal shatters into 12 pieces (400ms)

**Colors:**
- Standard: Blue seal (0x3B82F6)
- Gold: Amber seal (0xF59E0B)

---

### 2. Rune Inscription (S2)

**Visual Elements:**
- Mystical triangle with inner circle
- Central activation point
- 8 runic symbols (ᚠ, ᚢ, ᚦ, ᚨ, ᚱ, ᚲ, ᚷ, ᚹ)
- Pulsing glow ring
- Magical sparkle particles

**Stages:**
1. Base rune structure draws (400ms)
2. Glow ring pulses (600ms, 2 cycles)
3. Runic symbols appear sequentially (640ms)
4. Activation burst (500ms)

**Colors:**
- Standard: Blue runes with cyan glow
- Gold: Golden runes with amber glow

---

### 3. Beacon Lighting (S3, S7)

**Visual Elements:**
- Stone pillar base
- Upward light beam
- Flickering flame at top
- Rising particle stream

**Stages:**
1. Pillar rises from ground (700ms)
2. Light beam shoots upward (1000ms)
3. Flame ignites with particles
4. Beacon pulses to full brightness

**Colors:**
- Standard: Blue beacon light
- Gold: Amber/golden beacon light

---

### 4. Bridge Repair (S4)

**Visual Elements:**
- Wooden bridge base structure
- 6 individual planks
- Rope attachments
- Assembly animation

**Stages:**
1. Bridge foundation appears (500ms)
2. Planks drop into place sequentially (900ms)
3. Ropes attach to each plank
4. Bridge settles and stabilizes

**Colors:**
- Standard: Blue-tinted wood grain
- Gold: Golden-tinted premium wood

---

### 5. Compass Calibration (S5)

**Visual Elements:**
- Compass housing with 8 direction markers
- Cardinal points (N, E, S, W)
- Red/white dual-tone needle
- Rotating indicator ring

**Stages:**
1. Compass base appears (400ms)
2. Cardinal points light up (400ms)
3. Needle appears and spins (800ms, 4 full rotations)
4. Needle locks to North with glow burst

**Colors:**
- Standard: Blue compass housing
- Gold: Golden compass housing
- North marker always red (0xFF4444)

---

### 6. Ward Placement (S6)

**Visual Elements:**
- Central ward crystal
- 3 concentric protection circles
- 6 runic symbols around perimeter
- Shield barrier formation

**Stages:**
1. Ward crystal appears (400ms)
2. Protection circles expand outward (600ms)
3. Runic symbols activate (480ms)
4. Shield barrier forms and pulses (1000ms)

**Colors:**
- Standard: Blue protective energy
- Gold: Golden divine protection

---

## 🔧 API Reference

### BaseCheckpointAnimation

Abstract base class for all checkpoint animations.

```typescript
abstract class BaseCheckpointAnimation {
  protected scene: Phaser.Scene
  protected config: AnimationConfig
  protected container: Phaser.GameObjects.Container
  
  protected readonly STANDARD_DURATION = 2000
  protected readonly GOLD_DURATION = 3000
  
  abstract create(): void
  play(): void
  skip(): void
  complete(): void
  destroy(): void
}
```

### AnimationConfig

Configuration object passed to animation constructors.

```typescript
interface AnimationConfig {
  x: number              // World X position
  y: number              // World Y position
  variant: AnimationVariant  // 'standard' | 'gold'
  onComplete?: () => void
  onSkip?: () => void
}
```

### Factory Functions

```typescript
// Create animation instance
createCheckpointAnimation(
  scene: Phaser.Scene,
  type: CheckpointAnimationType,
  config: AnimationConfig
): BaseCheckpointAnimation

// Get animation type for stage
getAnimationTypeForStage(stage: number): CheckpointAnimationType
```

---

## 🎮 Integration with WorldMapScene

### Method: `playCheckpointAnimation`

Plays a checkpoint animation at the checkpoint's world position.

```typescript
playCheckpointAnimation(
  checkpointId: string,
  stage: number,
  variant: AnimationVariant = 'standard'
): void
```

**Parameters:**
- `checkpointId` - ID of the checkpoint node to animate
- `stage` - Stage number (1-8) to determine animation pattern
- `variant` - 'standard' (blue, 2s) or 'gold' (amber, 3s)

**Example:**

```typescript
// Standard blue animation for stage 1 checkpoint
this.playCheckpointAnimation('cp_s1_c1', 1, 'standard')

// Gold animation for stage 5 checkpoint
this.playCheckpointAnimation('cp_s5_c3', 5, 'gold')
```

**Behavior:**
- Automatically stops any currently playing animation
- Gets checkpoint node position from scene
- Creates appropriate animation based on stage
- Fires completion event to React when done
- Supports skip via ESC key or click (after 500ms)

---

## 🎯 User Interactions

### Skip Functionality

All animations can be skipped after **500ms delay**:

- **ESC key** - Instant skip
- **Click anywhere** - Instant skip (after 500ms timer)

**Why the delay?**
- Prevents accidental skips from double-clicks
- Ensures users see at least initial animation frames
- Improves perceived polish and intentionality

### Completion Events

When an animation completes (naturally or via skip), it dispatches:

```typescript
eventBridge.dispatchToReact({
  type: 'CHECKPOINT_ANIMATION_COMPLETE',
  checkpointId: string,
  stage: number
})
```

React components can listen for this event to trigger follow-up actions:
- Update UI state
- Play sound effects
- Show rewards
- Enable next checkpoint

---

## 🎨 Visual Design Principles

### Color Schemes

**Standard (Blue):**
- Primary: `0x3B82F6` (blue-500)
- Accent: `0x60A5FA` (blue-400)
- Glow: `0x6366F1` (indigo-500)

**Gold (Amber):**
- Primary: `0xF59E0B` (amber-500)
- Accent: `0xFEF08A` (amber-200)
- Glow: `0xFFD700` (pure gold)

### Animation Timing

- **Standard**: 2000ms total duration
- **Gold**: 3000ms total duration (50% slower for prestige)
- **Skip delay**: 500ms before skip is enabled
- **Easing**: Mostly `Sine.easeInOut` and `Back.easeOut` for bounce

### Performance

- **Target**: 60 FPS on all devices
- **Particle count**: Limited to 30 max per animation
- **Cleanup**: All tweens and objects destroyed on complete
- **Memory**: Zero leaks - proper disposal in `destroy()`

---

## 📦 File Structure

```
src/lib/phaser/scenes/animations/
├── BaseCheckpointAnimation.ts      # Abstract base class
├── SealBreakAnimation.ts           # S1, S8 pattern
├── RuneInscriptionAnimation.ts     # S2 pattern
├── BeaconLightingAnimation.ts      # S3, S7 pattern
├── BridgeRepairAnimation.ts        # S4 pattern
├── CompassCalibrationAnimation.ts  # S5 pattern
├── WardPlacementAnimation.ts       # S6 pattern
├── index.ts                        # Exports & factory functions
└── README.md                       # This file
```

---

## 🧪 Testing

### Manual Testing

```typescript
// In browser console (when WorldMapScene is active)
const scene = game.scene.getScene('WorldMap')

// Test all 6 patterns with standard variant
scene.playCheckpointAnimation('cp_test', 1, 'standard') // Seal Break
scene.playCheckpointAnimation('cp_test', 2, 'standard') // Rune Inscription
scene.playCheckpointAnimation('cp_test', 3, 'standard') // Beacon Lighting
scene.playCheckpointAnimation('cp_test', 4, 'standard') // Bridge Repair
scene.playCheckpointAnimation('cp_test', 5, 'standard') // Compass Calibration
scene.playCheckpointAnimation('cp_test', 6, 'standard') // Ward Placement

// Test gold variants
scene.playCheckpointAnimation('cp_test', 1, 'gold')
scene.playCheckpointAnimation('cp_test', 2, 'gold')
// ... etc
```

### Automated Tests (Future)

```typescript
describe('CheckpointAnimations', () => {
  it('should play seal break animation', () => {
    const scene = new Phaser.Scene({})
    const anim = new SealBreakAnimation(scene, {
      x: 400, y: 300, variant: 'standard'
    })
    
    anim.play()
    expect(anim.isComplete).toBe(false)
    
    // Fast-forward 2000ms
    scene.time.update(0, 2000)
    expect(anim.isComplete).toBe(true)
  })
})
```

---

## 🐛 Troubleshooting

### Animation doesn't appear

**Check:**
1. Is `particle_glow` texture created? (AssetLoader.createParticleTextures)
2. Is checkpoint node position valid?
3. Is animationLayer depth set correctly? (should be 100+)

### Animation stutters or lags

**Solutions:**
1. Reduce particle count in animation files
2. Use object pooling for frequently shown animations
3. Ensure GPU acceleration is enabled in browser

### Animation doesn't skip

**Check:**
1. Has 500ms delay passed?
2. Is ESC key handler registered?
3. Is overlay clickable area set up?

### Memory leaks

**Ensure:**
1. All tweens stopped in `destroy()`
2. All graphics objects destroyed
3. Event listeners removed
4. Container fully cleaned up

---

## 🔮 Future Enhancements

- [ ] Sound effects per animation type
- [ ] Particle texture variations
- [ ] Custom easing curves per stage
- [ ] Mobile-specific optimizations
- [ ] Animation replay system
- [ ] Screenshot capture on gold completions
- [ ] Social sharing of achievements

---

## 📝 Change Log

### v1.0.0 - Initial Release
- ✅ All 6 animation patterns implemented
- ✅ Standard and gold variants
- ✅ Skip functionality
- ✅ React event integration
- ✅ Full TypeScript support
- ✅ 60 FPS performance

---

## 👥 Credits

**Design**: Interactive Ideas Product Team  
**Implementation**: Week 3, Days 11-12  
**Framework**: Phaser 3 + React + TypeScript  
**Inspiration**: Among Us, Zelda, Monument Valley

---

## 📄 License

Part of Interactive Ideas platform - All rights reserved