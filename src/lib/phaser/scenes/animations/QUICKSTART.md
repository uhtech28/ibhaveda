# Checkpoint Animations - Quick Start Guide

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

## 🎬 Animation Patterns

| Stage | Animation | Best For |
|-------|-----------|----------|
| 1, 8 | Seal Break | Breaking through barriers |
| 2 | Rune Inscription | Knowledge/learning checkpoints |
| 3, 7 | Beacon Lighting | Major milestones |
| 4 | Bridge Repair | Connecting ideas |
| 5 | Compass Calibration | Finding direction |
| 6 | Ward Placement | Protection/completion |

---

## 💎 Standard vs Gold

**Standard (Blue):**
- Duration: 2 seconds
- Color: Blue (#3B82F6)
- Use for: Regular completions

**Gold (Amber):**
- Duration: 3 seconds
- Color: Gold (#F59E0B)
- Use for: Perfect scores, achievements, special milestones

---

## 📝 Common Patterns

### Pattern 1: Checkpoint Completion

```typescript
function handleCheckpointComplete(checkpoint) {
  // Determine variant based on score
  const variant = checkpoint.score >= 90 ? 'gold' : 'standard'
  
  eventBridge.dispatchToPhaser({
    type: 'PLAY_CHECKPOINT_ANIMATION',
    checkpointId: checkpoint.id,
    stage: checkpoint.stage,
    variant
  })
}
```

### Pattern 2: Achievement Unlock

```typescript
function unlockAchievement(achievement) {
  // Always use gold for achievements
  eventBridge.dispatchToPhaser({
    type: 'PLAY_CHECKPOINT_ANIMATION',
    checkpointId: achievement.checkpointId,
    stage: achievement.stage,
    variant: 'gold'
  })
}
```

### Pattern 3: Sequential Animations

```typescript
function playSequence(checkpoints) {
  checkpoints.forEach((cp, index) => {
    setTimeout(() => {
      eventBridge.dispatchToPhaser({
        type: 'PLAY_CHECKPOINT_ANIMATION',
        checkpointId: cp.id,
        stage: cp.stage,
        variant: 'standard'
      })
    }, index * 2500) // 2.5s between animations
  })
}
```

### Pattern 4: Completion with Callback

```typescript
function completeWithReward(checkpoint) {
  // Play animation
  eventBridge.dispatchToPhaser({
    type: 'PLAY_CHECKPOINT_ANIMATION',
    checkpointId: checkpoint.id,
    stage: checkpoint.stage,
    variant: 'gold'
  })
  
  // Listen for completion
  const cleanup = eventBridge.on('CHECKPOINT_ANIMATION_COMPLETE', (event) => {
    if (event.checkpointId === checkpoint.id) {
      showRewardModal(checkpoint.reward)
      cleanup() // Remove listener
    }
  })
}
```

---

## 🎮 Testing

### Option 1: Use the Demo Component

```tsx
import { AnimationDemo } from '@/lib/phaser/scenes/animations/AnimationDemo'

// Add to your dev page
<AnimationDemo />
```

### Option 2: Browser Console

```javascript
const scene = game.scene.getScene('WorldMap')
scene.playCheckpointAnimation('test', 1, 'gold')
```

### Option 3: React Dev Component

```tsx
function AnimationTester() {
  const [stage, setStage] = useState(1)
  const [variant, setVariant] = useState('standard')
  
  const test = () => {
    eventBridge.dispatchToPhaser({
      type: 'PLAY_CHECKPOINT_ANIMATION',
      checkpointId: 'test',
      stage,
      variant
    })
  }
  
  return (
    <div>
      <input type="number" min="1" max="8" value={stage} 
             onChange={e => setStage(Number(e.target.value))} />
      <select value={variant} onChange={e => setVariant(e.target.value)}>
        <option value="standard">Standard</option>
        <option value="gold">Gold</option>
      </select>
      <button onClick={test}>Play</button>
    </div>
  )
}
```

---

## 🎯 User Interactions

**Skip Animation:**
- Press `ESC` after 500ms
- Click anywhere after 500ms
- Not skippable in first 500ms (prevents accidental skips)

**During Animation:**
- User input is blocked (overlay captures clicks)
- Game continues in background
- Camera doesn't move

---

## 🐛 Troubleshooting

### Animation doesn't appear

```typescript
// Check 1: Is WorldMapScene loaded?
const scene = game.scene.getScene('WorldMap')
if (!scene) console.error('WorldMapScene not loaded')

// Check 2: Is checkpoint ID valid?
const checkpoint = scene.checkpointNodes.get('your-checkpoint-id')
if (!checkpoint) console.error('Checkpoint not found')

// Check 3: Is particle texture created?
const texture = game.textures.exists('particle_glow')
if (!texture) console.error('Particle texture missing')
```

### Animation plays but looks broken

```typescript
// Ensure AssetLoader created all textures
import { AssetLoader } from '@/lib/phaser/utils/asset-loader'

// In your preload or create phase
AssetLoader.createParticleTextures(this)
```

### Multiple animations overlap

```typescript
// This is by design - only one animation plays at a time
// The newest animation will stop the previous one
// To queue animations, use setTimeout:

function queueAnimations(checkpoints) {
  let delay = 0
  checkpoints.forEach(cp => {
    setTimeout(() => playAnimation(cp), delay)
    delay += 2500 // Wait for previous to finish
  })
}
```

### Animation won't skip

```typescript
// Check if 500ms has passed since animation started
// Skip is intentionally delayed to prevent accidental skips
// This is working as designed
```

---

## 📋 Checklist

Before going live:
- [ ] Test all 6 animation patterns
- [ ] Test both standard and gold variants
- [ ] Verify skip functionality (ESC and click)
- [ ] Test on mobile devices (touch events)
- [ ] Check performance (should maintain 60 FPS)
- [ ] Verify completion events fire correctly
- [ ] Test sequential animations
- [ ] Test interrupting animations

---

## 🔗 Links

- **Full Documentation:** `./README.md`
- **API Reference:** `./README.md#api-reference`
- **Demo Component:** `./AnimationDemo.tsx`
- **Event Bridge:** `../../utils/event-bridge.ts`
- **WorldMapScene:** `../WorldMapScene.ts`

---

## 💡 Pro Tips

1. **Use gold sparingly** - Makes it feel more special
2. **Match animation to context** - Seal Break for breakthroughs, Compass for navigation, etc.
3. **Test skip timing** - 500ms is usually perfect, but validate with users
4. **Chain animations carefully** - Don't overwhelm with too many in sequence
5. **Monitor performance** - Max 30 particles per animation for 60 FPS
6. **Provide feedback** - Always handle `CHECKPOINT_ANIMATION_COMPLETE` event

---

## ⚡ One-Liner Examples

```typescript
// Standard blue animation
eventBridge.dispatchToPhaser({ type: 'PLAY_CHECKPOINT_ANIMATION', checkpointId: 'cp1', stage: 1, variant: 'standard' })

// Gold achievement
eventBridge.dispatchToPhaser({ type: 'PLAY_CHECKPOINT_ANIMATION', checkpointId: 'cp1', stage: 1, variant: 'gold' })

// Listen for completion
useGameEvent('CHECKPOINT_ANIMATION_COMPLETE', (e) => console.log('Done!', e))
```

---

**Ready to go?** Start with a simple standard animation and build from there! 🚀