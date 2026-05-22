# Week 2 Quick Reference Card

Fast reference for WorldMapScene enhancements - snake path layout, camera system, and biome backgrounds.

---

## Map Constants

```typescript
BIOME_WIDTH = 400        // Each biome zone width
MAP_WIDTH = 3600         // Total map width (200 + 8×400 + 200)
MAP_HEIGHT = 720         // Total map height
PATH_CENTER_Y = 360      // Vertical centerline
PATH_AMPLITUDE = 60      // Wave height (±60px from center)
```

---

## Biome Layout

| Biome | Stage | Name | Subtitle | X Range | Color | Checkpoints |
|-------|-------|------|----------|---------|-------|-------------|
| 1 | 1 | Ideation | Village | 200-600 | `#8B7355` | 4 |
| 2 | 2 | Research | Forest | 600-1000 | `#2D5016` | 5 |
| 3 | 3 | Validation | Arena | 1000-1400 | `#8B4513` | 4 |
| 4 | 4 | Design | Artisan Quarter | 1400-1800 | `#4A5568` | 5 |
| 5 | 5 | Development | Mine | 1800-2200 | `#1A1A2E` | 6 |
| 6 | 6 | Launch | Harbour | 2200-2600 | `#1E3A8A` | 3 |
| 7 | 7 | Iteration | Crossroads | 2600-3000 | `#92400E` | 4 |
| 8 | 8 | Scale | Capital | 3000-3400 | `#713F12` | 5 |

**Total: 36 checkpoints**

---

## Snake Path Formula

### Horizontal (X)
```typescript
biomeStartX = 200 + (stage - 1) × 400
biomeProgress = (checkpoint - 1) / max(checkpointsInStage - 1, 1)
x = biomeStartX + (biomeProgress × 400)
```

### Vertical (Y)
```typescript
isOddBiome = stage % 2 === 1
wavePhase = biomeProgress × π
verticalOffset = isOddBiome 
  ? sin(wavePhase) × 60      // UP for odd biomes
  : -sin(wavePhase) × 60     // DOWN for even biomes
y = 360 + verticalOffset
```

**Result**: Y range 300-420px

---

## Key Methods

### Camera Control

```typescript
// Smooth scroll to checkpoint
scrollToCheckpoint(checkpointId: string, smooth = true)
// Duration: 1000ms, Easing: Sine.easeInOut

// Auto-scroll to active checkpoint
autoScrollToActive()
// Finds first 'active' or 'in_progress' checkpoint
```

### Biome Rendering

```typescript
// Create biome zones with labels
createBiomeZones()
// Draws separators + stage labels

// Create procedural backgrounds
createBiomeBackgrounds()
// Generates 8 textures with random patterns
```

### Checkpoint Positioning

```typescript
calculateCheckpointPosition(stage: number, checkpoint: number, globalIndex: number)
// Returns: { x: number, y: number }
```

---

## Camera Settings

```typescript
// In create()
cameras.main.setBounds(0, 0, 3600, 720)
cameras.main.setLerp(0.05, 0.05)      // Smooth lerp
cameras.main.setZoom(1.0)
cameras.main.setScroll(0, 0)
```

**Pan Animation**:
- Duration: 1000ms
- Easing: `"Sine.easeInOut"`
- Auto-scroll delay: 500ms after venture load

---

## Parallax Scrolling

```typescript
// In update()
const scrollX = cameras.main.scrollX
biomeBackgrounds.forEach(bg => {
  bg.tilePositionX = scrollX × 0.3    // 30% scroll ratio
})
```

**Effect**: Backgrounds move slower than foreground → depth perception

---

## Event Bridge Communication

### From React → Phaser

```typescript
SET_ACTIVE_VENTURE
  → Spawns persona
  → Auto-scrolls to active checkpoint (500ms delay)

SCROLL_TO_CHECKPOINT
  → Pans camera to specified checkpoint

UPDATE_CHECKPOINTS
  → Recreates all checkpoint nodes

UPDATE_BRIGHTNESS
  → Adjusts scene brightness/contrast
```

### From Phaser → React

```typescript
PHASER_READY
  → Scene initialized

FPS_UPDATE (every 1000ms)
  → { fps: number }

CHECKPOINT_CLICKED
  → { checkpointId, stage, checkpoint }
```

---

## Checkpoint Status

```typescript
type CheckpointStatus = 
  | 'locked'
  | 'active'
  | 'in_progress'
  | 'completed'
  | 'gold'

// Access via public getter
node.status  // Returns CheckpointStatus
```

---

## Visual Layers (Depth)

```
-100  Biome backgrounds (TileSprite)
  0   Background layer (separators, labels)
 10   Game layer (checkpoints, persona)
```

---

## Background Generation

```typescript
// Per biome:
1. Create graphics (400×720px)
2. Fill with biome color (30% alpha)
3. Add 20 random circles (20-60px, 10% alpha)
4. Generate texture: 'biome_${index}'
5. Create TileSprite
6. Set alpha: 0.4, depth: -100
7. Add to backgroundLayer
```

---

## Performance Targets

- **FPS**: 60 (consistent)
- **update() time**: <2ms per frame
- **Camera pan**: Smooth, no jitter
- **Memory**: Stable, no leaks
- **Total objects**: ~50-60 (8 bg + 36 cp + ui)

---

## Common Patterns

### Check if checkpoint is active
```typescript
if (node.status === 'active' || node.status === 'in_progress') {
  // Scroll to this checkpoint
}
```

### Get checkpoint position
```typescript
const { x, y } = calculateCheckpointPosition(stage, checkpoint, globalIndex)
```

### Pan camera manually
```typescript
cameras.main.pan(x, y, 1000, 'Sine.easeInOut', false)
```

### Access scene from console
```typescript
const scene = window.game?.scene?.scenes[0]
console.log('Checkpoints:', scene.checkpointNodes.size)
```

---

## Debug Commands

```javascript
// Show all checkpoint positions
scene.checkpointNodes.forEach((node, id) => {
  console.log(id, `(${node.x}, ${node.y})`, node.status)
})

// Visualize path
scene.debugPathLayout()  // Draws magenta line

// Check biome backgrounds
scene.biomeBackgrounds.forEach((bg, i) => {
  console.log(`Biome ${i}:`, bg.x, bg.alpha)
})

// Monitor parallax
console.log('Camera:', cam.scrollX, 'BG:', bg.tilePositionX)
// Ratio should be ~0.3
```

---

## File Locations

```
src/lib/phaser/scenes/WorldMapScene.ts     (614 lines)
src/lib/phaser/entities/Checkpoint.ts       (+ status getter)
docs/week2/WEEK2_COMPLETION_SUMMARY.md
docs/week2/SNAKE_PATH_VISUALIZATION.md
docs/week2/TESTING_GUIDE.md
```

---

## TypeScript Types

```typescript
CheckpointConfig {
  id: string
  stage: number          // 1-8
  checkpoint: number     // 1-n
  status: CheckpointStatus
  x: number
  y: number
  t1: boolean
  t2: boolean
  t3: boolean
}
```

---

## Troubleshooting

| Issue | Check | Solution |
|-------|-------|----------|
| No auto-scroll | `autoScrollToActive()` called? | Verify 500ms delay in `handleSetActiveVenture()` |
| Wrong positions | Constants correct? | BIOME_WIDTH=400, CENTER_Y=360, AMPLITUDE=60 |
| No parallax | `update()` running? | Check `bg.tilePositionX = scrollX * 0.3` |
| Low FPS | Too many objects? | Profile update() - should be <2ms |
| Camera stuck | Bounds set? | `setBounds(0, 0, 3600, 720)` |

---

## Quick Test

```javascript
// Paste in browser console
const scene = window.game?.scene?.scenes[0]
console.log('✓ Map:', scene.MAP_WIDTH === 3600 ? 'OK' : 'FAIL')
console.log('✓ Checkpoints:', scene.checkpointNodes.size === 36 ? 'OK' : 'FAIL')
console.log('✓ Backgrounds:', scene.biomeBackgrounds.length === 8 ? 'OK' : 'FAIL')
console.log('✓ FPS:', Math.round(window.game.loop.actualFps))
```

---

**Version**: Week 2 Complete
**Last Updated**: 2024
**Status**: ✅ Production Ready