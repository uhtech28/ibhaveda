# Checkpoint Animation System - 2-Stage MVP

Complete implementation of checkpoint completion animations for the Interactive Ideas 2-stage venture system with standard and gold variants.

---

## 📋 Overview

The checkpoint animation system provides visually engaging feedback when users complete checkpoints in their venture journey. The 2-stage MVP uses **2 unique animations** that align with the thematic progression from Ideation to Research.

### Animation Mapping

| Stage | Theme | Animation | Description |
|-------|-------|-----------|-------------|
| **Stage 1** | Ideation 🏝️ | Compass Calibration | Compass snaps to new heading, fog lifts to reveal the path forward |
| **Stage 2** | Research ⛰️ | Beacon Lighting | Watchtower beacon ignites, sending light across the map to guide the way |

### Variants

Each animation has **two variants** based on task completion:

- **Standard (Blue)**: 2/3 tasks completed - 1.5-2.5s duration, blue color scheme (0x3B82F6)
- **Gold (Amber)**: 3/3 tasks completed - 2.5-3.5s duration, gold color scheme (0xF59E0B) with special effects

---

## 🚀 Quick Start

### From React Component

```typescript
import { eventBridge } from '@/lib/phaser/EventBridge'

// Trigger animation when checkpoint is completed
eventBridge.dispatchToPhaser({
  type: 'PLAY_CHECKPOINT_ANIMATION',
  checkpointId: 'cp_s1_c1',
  stage: 1,
  variant: 'gold' // or 'standard'
})
```

### From Phaser Scene

```typescript
// Inside WorldMapScene
this.playCheckpointAnimation('cp_s1_c1', 1, 'gold')
```

---

## 🎨 Animation Details

### 1. Compass Calibration (Stage 1 - Ideation)

**Theme**: Finding direction in the ocean of ideas

**Visual Elements:**
- Circular compass with cardinal direction markers (N, E, S, W)
- Dual-tone needle (red pointing North, white pointing South)
- 8 directional tick marks around perimeter
- Indicator ring that pulses during calibration
- Fog overlay that obscures the compass initially

#### Standard Variant (2/3 Tasks)

**Duration**: 1.5-2s randomized

**Animation Sequence:**
1. **Fog appears** (0ms) - Cloudy mist covering the area
2. **Compass emerges** (0-400ms) - Compass base scales in with back ease
3. **Cardinal points light up** (400-800ms) - N, E, S, W appear sequentially
4. **Needle appears** (800-1100ms) - Red/white needle fades in
5. **Needle spins** (1100-1900ms) - 4 full rotations with pulsing indicator ring
6. **Needle locks North** (1900ms) - Snaps to 0° with glow burst
7. **Fog lifts** (1900-2700ms) - Fog fades and rises upward revealing clarity
8. **Completion pulse** (2700-3000ms) - Compass pulses slightly larger

**Colors:**
- Primary: Blue (0x3B82F6)
- Accent: Light Blue (0x60A5FA)
- Glow: Indigo (0x6366F1)
- North marker: Red (0xFF4444)

#### Gold Variant (3/3 Tasks)

**Duration**: 2.5-3.5s randomized

**Additional Effects:**
- **Directional beam** emits from compass pointing East toward next checkpoint
- Beam contains animated particles flowing along its length
- Beam fades out after 600ms of display
- Extra glow intensity on the indicator ring

**Visual Difference:**
- Golden compass housing instead of blue
- Brighter, more intense fog lift effect
- Directional beam shows path forward (unique to gold)

**Colors:**
- Primary: Amber (0xF59E0B)
- Accent: Light Amber (0xFEF08A)
- Glow: Pure Gold (0xFFD700)

---

### 2. Beacon Lighting (Stage 2 - Research)

**Theme**: Illuminating knowledge from the watchtower

**Visual Elements:**
- Stone watchtower base with support beams
- Beacon brazier/bowl at the top
- Upward light rays emanating in all directions
- Flickering flame with rising particles
- Inner glow chamber

#### Standard Variant (2/3 Tasks)

**Duration**: 1.5-2s randomized

**Animation Sequence:**
1. **Watchtower rises** (0-500ms) - Tower structure scales in from ground
2. **Beacon appears** (500-900ms) - Brazier/bowl appears with back ease
3. **Light rays ignite** (900-1500ms) - 16 rays spread outward with rotating pattern
4. **Flame ignites** (1500ms+) - Flickering orange/red flame particles rise
5. **Beacon visible on map** (1500-2000ms) - Full brightness achieved
6. **Completion pulse** (2000-2400ms) - Beacon pulses with final glow

**Flame Colors:**
- Deep Orange (0xFF4500)
- Orange (0xFF6600)
- Light Orange (0xFFAA00)
- Yellow (0xFFDD00)
- Amber (0xFF8800)

**Colors:**
- Primary: Blue (0x3B82F6)
- Accent: Light Blue (0x60A5FA)
- Glow: Indigo (0x6366F1)
- Structure: Stone Gray (0x4A5568)

#### Gold Variant (3/3 Tasks)

**Duration**: 2.5-3.5s randomized

**Additional Effects:**
- **Gold/white flame** instead of orange/red
- **Community notification rings** - 4 expanding rings broadcast outward
- Rings contain sparkle particles around perimeter
- Brighter, more intense light rays
- Longer-lasting flame particles

**Visual Difference:**
- Golden beacon light instead of blue
- White-hot flame at center
- Community notification waves ripple outward (unique to gold)
- More dramatic final glow burst

**Flame Colors (Gold):**
- Gold (0xFFD700)
- Light Yellow (0xFFED4E)
- White (0xFFFFFF)
- Cream (0xFEF3C7)

**Colors:**
- Primary: Amber (0xF59E0B)
- Accent: Light Amber (0xFEF08A)
- Glow: Pure Gold (0xFFD700)

---

## 🔧 Technical Implementation

### BaseCheckpointAnimation

Abstract base class providing common functionality.

```typescript
export abstract class BaseCheckpointAnimation {
  protected scene: Phaser.Scene
  protected config: AnimationConfig
  protected container: Phaser.GameObjects.Container
  protected isComplete: boolean
  protected isSkipped: boolean
  
  // Duration randomized within spec ranges
  protected calculatedDuration: number // 1500-2500ms (standard) or 2500-3500ms (gold)
  
  abstract create(): void
  play(): void
  skip(): void
  complete(): void
  destroy(): void
  
  // Helper methods for consistent theming
  protected getPrimaryColor(): number     // Blue or Amber
  protected getSecondaryColor(): number   // Light Blue or Light Amber
  protected getGlowColor(): number        // Indigo or Gold
}
```

### AnimationConfig Interface

```typescript
interface AnimationConfig {
  x: number                    // World X position on map
  y: number                    // World Y position on map
  variant: AnimationVariant    // 'standard' | 'gold'
  onComplete?: () => void      // Called when animation finishes
  onSkip?: () => void          // Called when skip is enabled
}
```

### Factory Functions

```typescript
// Get the correct animation type for a stage
getAnimationTypeForStage(stage: number): CheckpointAnimationType
// Returns: 'compass_calibration' for stage 1, 'beacon_lighting' for stage 2

// Create animation instance
createCheckpointAnimation(
  scene: Phaser.Scene,
  type: CheckpointAnimationType,
  config: AnimationConfig
): BaseCheckpointAnimation
```

---

## 🎮 WorldMapScene Integration

### Method: `playCheckpointAnimation`

Main entry point for playing checkpoint animations.

```typescript
playCheckpointAnimation(
  checkpointId: string,
  stage: number,
  variant: AnimationVariant = 'standard'
): void
```

**Parameters:**
- `checkpointId` - ID of the checkpoint node (e.g., 'cp_s1_c1')
- `stage` - Stage number (1 or 2)
- `variant` - 'standard' (2/3 tasks) or 'gold' (3/3 tasks)

**Behavior:**
1. Stops any currently playing animation
2. Gets checkpoint node's world position
3. Determines animation type from stage number
4. Creates and plays animation instance
5. Dispatches completion event to React when done
6. Supports skip after 500ms delay

**Example:**

```typescript
// Standard animation for Stage 1, Checkpoint 1
this.playCheckpointAnimation('cp_s1_c1', 1, 'standard')

// Gold animation for Stage 2, Checkpoint 3
this.playCheckpointAnimation('cp_s2_c3', 2, 'gold')
```

---

## 🎯 User Interactions

### Skip Functionality

All animations can be skipped after a **500ms delay** to prevent accidental skips:

- **ESC key** - Instant skip (after delay)
- **Click/tap anywhere** - Instant skip (after delay)

**Why the 500ms delay?**
- Prevents double-click accidents during UI interactions
- Ensures users see the initial animation frames
- Provides minimum feedback for user actions
- Creates more polished experience

### Completion Events

When animation completes (naturally or via skip):

```typescript
eventBridge.dispatchToReact({
  type: 'CHECKPOINT_ANIMATION_COMPLETE',
  checkpointId: string,
  stage: number
})
```

**React components can listen:**

```typescript
useEffect(() => {
  const handler = (event) => {
    if (event.type === 'CHECKPOINT_ANIMATION_COMPLETE') {
      console.log(`Checkpoint ${event.checkpointId} animation done!`)
      // Update UI, show rewards, unlock next checkpoint, etc.
    }
  }
  
  eventBridge.addReactListener(handler)
  return () => eventBridge.removeReactListener(handler)
}, [])
```

---

## 🎨 Design Principles

### Color Philosophy

**Standard (Blue) - Learning Mode:**
- Represents steady progress
- Calming, trustworthy blue tones
- "You're on the right path"

**Gold (Amber) - Excellence:**
- Celebrates complete mastery
- Warm, prestigious gold tones
- "You've achieved something special"

### Animation Timing

- **Randomized duration** within spec ranges for organic feel
- **Standard**: 1500-2500ms (avg 2s)
- **Gold**: 2500-3500ms (avg 3s)
- **Skip delay**: 500ms universally
- **Easing curves**: Primarily `Sine.easeInOut` and `Back.easeOut`

### Performance Targets

- **60 FPS** on all devices (desktop and mobile)
- **Maximum 20 particles** per animation active at once
- **Clean up all resources** in `destroy()` method
- **No memory leaks** - all tweens stopped, objects destroyed
- **Lightweight graphics** - uses Phaser's Graphics API, not sprites

---

## 📦 File Structure

```
src/lib/phaser/scenes/animations/
├── BaseCheckpointAnimation.ts      # Abstract base class
├── CompassCalibrationAnimation.ts  # Stage 1 (Ideation)
├── BeaconLightingAnimation.ts      # Stage 2 (Research)
├── index.ts                        # Exports & factory functions
└── README.md                       # This file

# Legacy animations (available but not used in 2-stage MVP)
├── SealBreakAnimation.ts
├── RuneInscriptionAnimation.ts
├── BridgeRepairAnimation.ts
└── WardPlacementAnimation.ts
```

---

## 🧪 Testing

### Manual Testing in Browser Console

```javascript
// Get the WorldMapScene
const scene = window.__PHASER_GAME__.scene.getScene('WorldMap')

// Test Stage 1 - Compass Calibration (Standard)
scene.playCheckpointAnimation('cp_s1_c1', 1, 'standard')

// Test Stage 1 - Compass Calibration (Gold)
scene.playCheckpointAnimation('cp_s1_c1', 1, 'gold')

// Test Stage 2 - Beacon Lighting (Standard)
scene.playCheckpointAnimation('cp_s2_c1', 2, 'standard')

// Test Stage 2 - Beacon Lighting (Gold)
scene.playCheckpointAnimation('cp_s2_c1', 2, 'gold')
```

### Testing Checklist

- [ ] Standard variant plays correctly for both stages
- [ ] Gold variant plays correctly for both stages
- [ ] Fog lifts in Compass Calibration (both variants)
- [ ] Directional beam appears in Compass Calibration (gold only)
- [ ] Watchtower rises in Beacon Lighting (both variants)
- [ ] Gold/white flame in Beacon Lighting (gold only)
- [ ] Community notification rings in Beacon Lighting (gold only)
- [ ] Skip works after 500ms delay (ESC and click)
- [ ] Completion event fires to React
- [ ] No memory leaks after multiple plays
- [ ] Runs at 60 FPS on target devices

---

## 🐛 Troubleshooting

### Animation doesn't appear

**Check:**
1. Is checkpoint node position valid in `checkpointNodes` Map?
2. Is `animationLayer` depth set correctly? (should be 100+)
3. Are camera bounds including the checkpoint position?

**Debug:**
```javascript
const scene = window.__PHASER_GAME__.scene.getScene('WorldMap')
console.log(scene.checkpointNodes.get('cp_s1_c1'))
```

### Animation stutters or lags

**Solutions:**
1. Check browser GPU acceleration is enabled
2. Reduce particle count if needed (currently optimized)
3. Close other browser tabs/applications
4. Test on different device/browser

### Skip doesn't work

**Check:**
1. Has 500ms delay passed since animation start?
2. Is ESC key handler registered in WorldMapScene?
3. Is click handler on scene's input enabled?

### Colors look wrong

**Verify:**
1. Variant is correctly passed ('standard' vs 'gold')
2. `getPrimaryColor()`, `getSecondaryColor()`, `getGlowColor()` return correct values
3. No CSS filters affecting the Phaser canvas

---

## 🚢 2-Stage MVP Context

### Why These Animations?

**Stage 1 - Compass Calibration**
- **Ideation** is about finding direction among many possibilities
- Compass represents navigation and decision-making
- Fog lifting = clarity emerging from uncertainty
- Directional beam (gold) = clear path to next milestone

**Stage 2 - Beacon Lighting**
- **Research** is about illuminating knowledge
- Watchtower beacon = elevated perspective
- Light rays = spreading knowledge/insights
- Community notification (gold) = sharing discoveries

### Task Completion Logic

- **Standard (Blue)**: User completes 2 out of 3 tasks at checkpoint
- **Gold (Amber)**: User completes all 3 tasks at checkpoint (100% mastery)

---

## 📈 Future Enhancements (Post-MVP)

- [ ] Sound effects synchronized with visual beats
- [ ] Haptic feedback on mobile devices
- [ ] Achievement badges for gold completions
- [ ] Animation replay gallery in user profile
- [ ] Social sharing of gold achievements
- [ ] Custom particle textures for more visual variety
- [ ] Additional stage animations as venture system expands

---

## 📝 Change Log

### v2.0.0 - 2-Stage MVP
- ✅ Simplified to 2 animations for MVP launch
- ✅ Enhanced Compass Calibration with fog lift and directional beam
- ✅ Enhanced Beacon Lighting with watchtower and community notification
- ✅ Randomized durations for organic feel
- ✅ Updated color schemes for standard/gold variants
- ✅ Full TypeScript support maintained
- ✅ 60 FPS performance verified

### v1.0.0 - Initial Release (8-Stage System)
- ✅ 6 unique animation patterns
- ✅ Standard and gold variants
- ✅ Skip functionality
- ✅ React event integration

---

## 👥 Credits

**Design**: Interactive Ideas Product Team  
**Implementation**: Phaser Animation System  
**Framework**: Phaser 3 + React + TypeScript  
**Inspiration**: Monument Valley, Journey, Zelda series

---

## 📄 License

Part of Interactive Ideas platform - All rights reserved