# Mini-Boss System Documentation

## Overview

The Mini-Boss System adds progressive boss encounters to the first two venture stages (Ideation and Research). Each mini-boss appears at the end of their respective stage and progressively weakens as the player completes checkpoints, culminating in a dramatic "slay" animation when the stage is fully completed.

## Mini-Boss Types

### 1. Fog of Vagueness (Stage 1 - Ideation)
**Visual Design:**
- Gray fog cloud composed of overlapping circles
- Glowing red eyes that pulse subtly
- Wispy edges creating a misty, uncertain appearance
- Total size: ~100×80 pixels

**Weakening Mechanic:**
- Fog opacity decreases as checkpoints are completed
- Starts at 100% opacity (full strength)
- Ends at 30% opacity (fully weakened, just before slay)
- Eyes fade proportionally with the fog body

**Slay Animation:**
- Fog dissipates outward with scale and fade
- Duration: 2 seconds
- Effect: Scale increases to 1.5x while alpha fades to 0
- Easing: Cubic.easeOut for smooth dissipation

### 2. Pathwarden Wraith (Stage 2 - Research)
**Visual Design:**
- Dark hooded figure with purple/black cloak
- Shadowy face void with faint red eyes
- Three glowing purple sigils (protective wards)
- Total size: ~80×100 pixels

**Weakening Mechanic:**
- Progressive cracks appear on the wraith as checkpoints are completed
- Crack 1 appears at 25% completion (left side)
- Crack 2 appears at 50% completion (right side)
- Crack 3 appears at 75% completion (center, branching)
- Additional shatter lines at 100% completion

**Slay Animation:**
- Wraith shatters and fades away
- Duration: 2 seconds total
- Effects:
  - Body fades and sinks downward (1.5s)
  - Cracks intensify and scale up (1s)
  - Full container fades to alpha 0 (2s)
- Easing: Combination of Cubic.easeIn and Sine.easeOut

## Implementation

### File Structure

```
src/lib/phaser/
├── entities/
│   └── MiniBoss.ts          # Mini-boss entity class
└── scenes/
    └── WorldMapScene.ts     # Integration into world map
```

### MiniBoss Class

**Location:** `src/lib/phaser/entities/MiniBoss.ts`

**Key Methods:**

#### `constructor(scene: Phaser.Scene, config: MiniBossConfig)`
Creates and positions a mini-boss on the world map.

**Parameters:**
- `bossId`: Unique identifier (e.g., "fog_of_vagueness")
- `bossType`: "fog_of_vagueness" | "pathwarden_wraith"
- `x`, `y`: World coordinates
- `stage`: Stage number (1-2)

#### `weaken(checkpointsComplete: number, totalCheckpoints: number)`
Progressively weakens the boss based on checkpoint completion.

**Behavior:**
- Calculates weakness ratio (0 to 1)
- For Fog: Reduces opacity proportionally
- For Wraith: Adds progressive cracks
- Smooth tween transitions (600ms)

#### `slay()`
Plays the slay animation and destroys the boss.

**Behavior:**
- Stops all ongoing tweens
- Plays type-specific destruction animation (2s)
- Destroys the container on completion
- Called automatically when stage is 100% complete

### WorldMapScene Integration

**Location:** `src/lib/phaser/scenes/WorldMapScene.ts`

**Key Additions:**

1. **Property:** `private miniBosses: Map<number, MiniBoss>`
   - Maps stage numbers to mini-boss instances

2. **Method:** `createMiniBosses()`
   - Called during scene creation
   - Positions bosses near last checkpoint of each stage
   - Offset: +100px right, -50px up from last checkpoint

3. **Method:** `updateMiniBossProgress(checkpoints: CheckpointState[])`
   - Called whenever checkpoints update
   - Groups checkpoints by stage
   - Counts completed checkpoints per stage
   - Calls `weaken()` or `slay()` accordingly

4. **Cleanup:** Mini-bosses destroyed in `shutdown()` method

## Usage Example

### Automatic Integration

The system works automatically once implemented:

```typescript
// When checkpoints update from React
eventBridge.dispatchToPhaser({
  type: 'UPDATE_CHECKPOINTS',
  checkpoints: [
    { id: 'cp1', stage: 1, status: 'completed', ... },
    { id: 'cp2', stage: 1, status: 'completed', ... },
    { id: 'cp3', stage: 1, status: 'in_progress', ... },
    // ... more checkpoints
  ]
});

// Mini-bosses automatically:
// 1. Calculate stage progress (2/3 complete)
// 2. Weaken boss proportionally
// 3. When 3/3 complete, slay the boss
```

### Manual Usage (Advanced)

```typescript
// Create a custom mini-boss
const customBoss = new MiniBoss(scene, {
  bossId: 'custom_boss',
  bossType: 'fog_of_vagueness',
  x: 800,
  y: 300,
  stage: 1
});

// Manually weaken (e.g., 50% complete)
customBoss.weaken(2, 4);

// Manually trigger slay
customBoss.slay();
```

## Visual Design Details

### Fog of Vagueness Colors
- Main cloud: `#6B7280` (Gray-500) at 80% opacity
- Wispy edges: `#9CA3AF` (Gray-400) at 60% opacity
- Eyes: `#FF4444` (Bright Red) with `#FF0000` stroke
- Eye pulse: 0.7 to 1.0 alpha, 1200ms cycle

### Pathwarden Wraith Colors
- Hood/body: `#1A0A2E` (Very Dark Purple) at 90% opacity
- Face void: `#000000` (Black) at 95% opacity
- Cloak: `#2D1B4E` (Dark Purple) at 85% opacity
- Sigils: `#8B5CF6` (Purple-500) at 80% opacity, 2px stroke
- Eyes: `#DC2626` (Red-600) at 60% opacity
- Cracks: `#FFFFFF` (White) at 70% opacity, 2px stroke

## Positioning Logic

Mini-bosses are positioned relative to the last checkpoint of their stage:

```typescript
const lastCheckpointPos = calculateCheckpointPosition(stage, lastCheckpoint, 0);
const bossX = lastCheckpointPos.x + 100;  // 100px to the right
const bossY = lastCheckpointPos.y - 50;   // 50px above
```

This ensures bosses appear as "guardians" at the end of each stage path.

## Future Enhancements

### Potential Additions for Stages 3-8:
1. **Advocate of Comfortable Lies** (Stage 3)
   - Visual: Sweet-talking merchant with honeyed words
   - Weakening: Words turn to ash and blow away

2. **Unfinished Golem** (Stage 4)
   - Visual: Stone construct missing pieces
   - Weakening: More pieces crumble away

3. **Collapse Specter** (Stage 5)
   - Visual: Ghostly form of stacked papers
   - Weakening: Papers scatter in the wind

4. **Harbourmaster** (Stage 6)
   - Visual: Stern dockworker with cargo chains
   - Weakening: Chains rust and break link by link

5. **Babel Merchant** (Stage 7)
   - Visual: Multilingual trader with scrolls
   - Weakening: Scrolls burn and text becomes illegible

6. **Iron Bureaucrat** (Stage 8)
   - Visual: Rigid official with red tape
   - Weakening: Red tape unravels and falls away

## Technical Notes

### Performance Considerations
- Uses procedural graphics (no texture loading required)
- Efficient tween-based animations
- Bosses destroyed after slay (no lingering objects)
- Maximum 2 active mini-bosses at once (only stages 1-2 implemented)

### Browser Compatibility
- Works in all modern browsers supporting Phaser 3
- No special shaders or WebGL features required
- Fallback to Canvas2D if WebGL unavailable

### Testing
To test the system:
1. Complete checkpoints in Stage 1 or 2
2. Observe fog dissipation or crack appearance
3. Complete all checkpoints in a stage
4. Watch the slay animation play

## Integration Checklist

- [x] MiniBoss.ts entity created
- [x] WorldMapScene integration complete
- [x] Fog of Vagueness visuals implemented
- [x] Pathwarden Wraith visuals implemented
- [x] Weakening mechanics functional
- [x] Slay animations working
- [x] Cleanup on scene shutdown
- [x] Automatic progress tracking
- [ ] Audio effects for weakening (future)
- [ ] Audio effects for slay (future)
- [ ] Stages 3-8 mini-bosses (future)

## Conclusion

The Mini-Boss System provides engaging visual feedback for stage progression, transforming abstract checkpoint completion into a satisfying boss battle experience. The procedural graphics approach ensures fast loading times while maintaining high visual quality.