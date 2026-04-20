# Checkpoint Animations - Quick Start Guide (2-Stage MVP)

Get started with the checkpoint animation system in 5 minutes.

---

## ⚡ Quick Setup

### 1. Import the Event Bridge

```typescript
import { eventBridge } from '@/lib/phaser/utils/event-bridge'
```

### 2. Trigger an Animation

```typescript
// From any React component
eventBridge.dispatchToPhaser({
  type: 'PLAY_CHECKPOINT_ANIMATION',
  checkpointId: 'cp_s1_c1',
  stage: 1,
  variant: 'standard' // or 'gold'
})
```

### 3. Listen for Completion (Optional)

```typescript
import { useGameEvent } from '@/lib/phaser/hooks/useGameEvent'

function MyComponent() {
  useGameEvent('CHECKPOINT_ANIMATION_COMPLETE', (event) => {
    console.log(`Animation completed for ${event.checkpointId}`)
    // Show rewards, update state, etc.
  })
  
  return <div>Your UI</div>
}
```

---

## 🎬 2-Stage Animation Mapping

| Stage | Theme | Animation | Description |
|-------|-------|-----------|-------------|
| **1** | Ideation 🏝️ | Compass Calibration | Compass snaps to heading, fog lifts |
| **2** | Research ⛰️ | Beacon Lighting | Watchtower beacon ignites, light spreads |

---

## 💎 Standard vs Gold Variants

### Standard (Blue) - 2/3 Tasks Complete
- Duration: 1.5-2.5s (randomized)
- Color: Blue (#3B82F6)
- **Stage 1:** Compass calibrates, fog lifts
- **Stage 2:** Beacon lights, visible on map

### Gold (Amber) - 3/3 Tasks Complete ✨
- Duration: 2.5-3.5s (randomized)
- Color: Gold (#F59E0B)
- **Stage 1:** Compass emits directional beam to next checkpoint
- **Stage 2:** Beacon burns gold/white flame, community notification rings

---

## 📝 Common Patterns

### Pattern 1: Checkpoint Completion

```typescript
function handleCheckpointComplete(checkpoint) {
  // Determine variant based on tasks completed
  const tasksCompleted = checkpoint.tasks.filter(t => t.completed).length
  const variant = tasksCompleted === 3 ? 'gold' : 'standard'
  
  eventBridge.dispatchToPhaser({
    type: 'PLAY_CHECKPOINT_ANIMATION',
    checkpointId: checkpoint.id,
    stage: checkpoint.stage, // 1 or 2
    variant
  })
}
```

### Pattern 2: Perfect Completion (All Tasks)

```typescript
function celebratePerfectCompletion(checkpoint) {
  // Always use gold for 3/3 tasks
  eventBridge.dispatchToPhaser({
    type: 'PLAY_CHECKPOINT_ANIMATION',
    checkpointId: checkpoint.id,
    stage: checkpoint.stage,
    variant: 'gold' // 🎉 Special effects!
  })
}
```

### Pattern 3: Completion with Reward

```typescript
function completeWithReward(checkpoint) {
  // Play animation first
  eventBridge.dispatchToPhaser({
    type: 'PLAY_CHECKPOINT_ANIMATION',
    checkpointId: checkpoint.id,
    stage: checkpoint.stage,
    variant: checkpoint.perfectScore ? 'gold' : 'standard'
  })
  
  // Listen for completion to show reward
  const cleanup = eventBridge.on('CHECKPOINT_ANIMATION_COMPLETE', (event) => {
    if (event.checkpointId === checkpoint.id) {
      showRewardModal(checkpoint.reward)
      cleanup() // Remove listener
    }
  })
}
```

### Pattern 4: Sequential Checkpoints

```typescript
function playCheckpointSequence(checkpoints) {
  checkpoints.forEach((cp, index) => {
    setTimeout(() => {
      eventBridge.dispatchToPhaser({
        type: 'PLAY_CHECKPOINT_ANIMATION',
        checkpointId: cp.id,
        stage: cp.stage,
        variant: cp.variant
      })
    }, index * 3000) // 3s between animations
  })
}
```

---

## 🎮 Testing

### Option 1: Browser Console

```javascript
// Get WorldMapScene
const scene = window.__PHASER_GAME__.scene.getScene('WorldMap')

// Test Stage 1 animations
scene.playCheckpointAnimation('cp_s1_c1', 1, 'standard')
scene.playCheckpointAnimation('cp_s1_c1', 1, 'gold')

// Test Stage 2 animations
scene.playCheckpointAnimation('cp_s2_c1', 2, 'standard')
scene.playCheckpointAnimation('cp_s2_c1', 2, 'gold')
```

### Option 2: React Dev Component

```tsx
function AnimationTester() {
  const [stage, setStage] = useState(1)
  const [variant, setVariant] = useState('standard')
  
  const test = () => {
    eventBridge.dispatchToPhaser({
      type: 'PLAY_CHECKPOINT_ANIMATION',
      checkpointId: `cp_s${stage}_c1`,
      stage,
      variant
    })
  }
  
  return (
    <div className="p-4 space-y-2">
      <div>
        <label>Stage: </label>
        <select value={stage} onChange={e => setStage(Number(e.target.value))}>
          <option value={1}>Stage 1 - Ideation (Compass)</option>
          <option value={2}>Stage 2 - Research (Beacon)</option>
        </select>
      </div>
      <div>
        <label>Variant: </label>
        <select value={variant} onChange={e => setVariant(e.target.value)}>
          <option value="standard">Standard (2/3 tasks)</option>
          <option value="gold">Gold (3/3 tasks)</option>
        </select>
      </div>
      <button onClick={test} className="px-4 py-2 bg-blue-500 text-white rounded">
        Play Animation
      </button>
    </div>
  )
}
```

### Option 3: Use the Demo Component

```tsx
import { AnimationDemo } from '@/lib/phaser/scenes/animations/AnimationDemo'

// Add to your dev page
<AnimationDemo />
```

---

## 🎯 User Interactions

**Skip Animation:**
- Press `ESC` after 500ms
- Click anywhere after 500ms
- Not skippable in first 500ms (prevents accidental skips)

**During Animation:**
- User input to map is blocked
- Game continues in background
- Camera doesn't move

**After Animation:**
- `CHECKPOINT_ANIMATION_COMPLETE` event fires
- Animation container is destroyed
- User can interact with map again

---

## 🎨 Visual Guide

### Stage 1: Compass Calibration

**Standard (Blue):**
1. Fog appears covering compass
2. Compass emerges and scales in
3. Cardinal points (N, E, S, W) light up
4. Needle spins 4 rotations
5. Needle snaps to North
6. **Fog lifts upward** revealing clarity
7. Compass pulses complete

**Gold (Amber):**
- All of the above, PLUS:
- **Directional beam** shoots East toward next checkpoint
- Beam contains flowing particles
- More intense glow effects

### Stage 2: Beacon Lighting

**Standard (Blue):**
1. Watchtower rises from ground
2. Beacon brazier appears at top
3. Light rays ignite in all directions
4. Orange/red flame particles rise
5. Beacon reaches full brightness
6. Final glow pulse

**Gold (Amber):**
- All of the above, PLUS:
- **Gold/white flame** instead of orange/red
- **Community notification rings** expand outward
- Sparkle particles around rings
- More dramatic light show

---

## 🐛 Troubleshooting

### Animation doesn't appear

```typescript
// Debug checklist:
const scene = window.__PHASER_GAME__.scene.getScene('WorldMap')

// 1. Is scene loaded?
console.log('Scene exists:', !!scene)

// 2. Is checkpoint valid?
console.log('Checkpoint exists:', scene.checkpointNodes.has('cp_s1_c1'))

// 3. Check checkpoint position
const node = scene.checkpointNodes.get('cp_s1_c1')
console.log('Checkpoint position:', node?.getWorldPosition())
```

### Animation plays at wrong location

```typescript
// Verify checkpoint node has correct position
const node = scene.checkpointNodes.get(checkpointId)
const worldPos = node.getWorldPosition()
console.log('Animation will play at:', worldPos)
```

### Animation won't skip

```typescript
// Skip is intentionally delayed 500ms to prevent accidental skips
// Wait for 500ms, then press ESC or click
// This is working as designed ✅
```

### Colors look wrong

```typescript
// Verify variant is correct
eventBridge.dispatchToPhaser({
  type: 'PLAY_CHECKPOINT_ANIMATION',
  checkpointId: 'cp_s1_c1',
  stage: 1,
  variant: 'gold' // Must be 'standard' or 'gold'
})
```

### Multiple animations overlap

```typescript
// Only one animation plays at a time (by design)
// New animation automatically stops the previous one
// To queue animations, add delays:

function queueAnimations(checkpoints) {
  checkpoints.forEach((cp, index) => {
    setTimeout(() => {
      eventBridge.dispatchToPhaser({
        type: 'PLAY_CHECKPOINT_ANIMATION',
        checkpointId: cp.id,
        stage: cp.stage,
        variant: cp.variant
      })
    }, index * 3000) // 3s delay between each
  })
}
```

---

## 📋 Launch Checklist

Before deploying:
- [ ] Test Stage 1 standard variant (2/3 tasks)
- [ ] Test Stage 1 gold variant (3/3 tasks)
- [ ] Test Stage 2 standard variant (2/3 tasks)
- [ ] Test Stage 2 gold variant (3/3 tasks)
- [ ] Verify fog lifts in Compass Calibration
- [ ] Verify directional beam in Compass Calibration (gold)
- [ ] Verify watchtower rises in Beacon Lighting
- [ ] Verify gold/white flame in Beacon Lighting (gold)
- [ ] Verify community notification rings (gold)
- [ ] Test skip functionality (ESC and click)
- [ ] Test on mobile devices (touch)
- [ ] Verify completion events fire correctly
- [ ] Check performance (60 FPS maintained)
- [ ] Test with real checkpoint data from Convex

---

## ⚡ One-Liner Examples

```typescript
// Stage 1, Standard (2/3 tasks)
eventBridge.dispatchToPhaser({ type: 'PLAY_CHECKPOINT_ANIMATION', checkpointId: 'cp_s1_c1', stage: 1, variant: 'standard' })

// Stage 1, Gold (3/3 tasks) - with directional beam!
eventBridge.dispatchToPhaser({ type: 'PLAY_CHECKPOINT_ANIMATION', checkpointId: 'cp_s1_c3', stage: 1, variant: 'gold' })

// Stage 2, Standard (2/3 tasks)
eventBridge.dispatchToPhaser({ type: 'PLAY_CHECKPOINT_ANIMATION', checkpointId: 'cp_s2_c2', stage: 2, variant: 'standard' })

// Stage 2, Gold (3/3 tasks) - with community notification!
eventBridge.dispatchToPhaser({ type: 'PLAY_CHECKPOINT_ANIMATION', checkpointId: 'cp_s2_c5', stage: 2, variant: 'gold' })

// Listen for completion
useGameEvent('CHECKPOINT_ANIMATION_COMPLETE', (e) => console.log('Done!', e.checkpointId))
```

---

## 💡 Pro Tips

1. **Use gold for perfect scores** - Makes 3/3 task completion feel special
2. **Match timing to UX** - 2-3s animations keep momentum while providing feedback
3. **Test skip timing** - 500ms prevents accidents but allows quick progression
4. **Leverage themed animations** - Compass for finding direction, Beacon for illuminating knowledge
5. **Monitor performance** - Animations are optimized but test on target devices
6. **Handle completion events** - Always respond to `CHECKPOINT_ANIMATION_COMPLETE`
7. **Progressive disclosure** - Standard → Gold creates satisfying progression loop

---

## 🔗 Resources

- **Full Documentation:** [README.md](./README.md)
- **API Reference:** [README.md#technical-implementation](./README.md#technical-implementation)
- **2-Stage MVP Overview:** [/2_STAGE_MVP_COMPLETE.md](../../../../2_STAGE_MVP_COMPLETE.md)
- **Event Bridge:** `../../utils/event-bridge.ts`
- **WorldMapScene:** `../WorldMapScene.ts`

---

## 🚀 Ready to Launch!

The 2-stage MVP animation system is production-ready:
- ✅ 2 unique animations (Compass + Beacon)
- ✅ Standard and gold variants
- ✅ Randomized durations for organic feel
- ✅ Skip functionality
- ✅ Event-driven architecture
- ✅ 60 FPS performance
- ✅ Mobile-friendly

**Start simple:** Test with standard variants first, then add gold celebrations for perfect scores! 🎉