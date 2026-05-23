# Week 3 Integration Guide

**Target Audience:** Developers integrating Week 3 animations and HUD into the Interactive Ideas platform  
**Prerequisites:** Week 1 & 2 complete, Phaser 3.80+, React 18+, Jotai installed

---

## 🚀 Quick Start

### 1. Import HUD into Your Map Page

```typescript
// src/app/map/page.tsx
import { HUD } from '@/components/hud'

export default function MapPage() {
  return (
    <div className="relative w-full h-screen">
      <HUD />
      {/* Your Phaser canvas container */}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}
```

### 2. Update Jotai State from Convex Data

```typescript
// src/app/map/page.tsx
import { useAtom } from 'jotai'
import { userProgressAtom, stageInfoAtom } from '@/lib/stores/hudStore'

export default function MapPage() {
  const [, setUserProgress] = useAtom(userProgressAtom)
  const [, setStageInfo] = useAtom(stageInfoAtom)
  
  const userData = useQuery(api.users.getCurrentUserProgress)
  
  useEffect(() => {
    if (userData) {
      setUserProgress({
        level: userData.level,
        phase: userData.phase,
        xp: userData.xp,
        xpToNextLevel: userData.xpToNextLevel,
        streak: userData.streak,
        qualityScore: userData.qualityScore,
        valuationScore: userData.valuationScore,
      })
      
      setStageInfo({
        stageName: userData.currentStage.name,
        stageIcon: userData.currentStage.icon,
        biomeName: userData.currentStage.biome,
      })
    }
  }, [userData])
  
  return <HUD />
}
```

---

## 🎬 Checkpoint Animations

### Basic Usage in Phaser Scene

```typescript
// src/lib/phaser/scenes/WorldMapScene.ts
import { createCheckpointAnimation, getAnimationTypeForStage } from '@/lib/phaser/scenes/animations'

class WorldMapScene extends Phaser.Scene {
  playCheckpointAnimation(checkpoint: CheckpointData) {
    // Determine animation type based on stage
    const animationType = getAnimationTypeForStage(checkpoint.stage)
    
    // Determine variant based on task completion
    const variant = (checkpoint.t1 && checkpoint.t2 && checkpoint.t3) ? 'gold' : 'standard'
    
    // Create and play animation
    const animation = createCheckpointAnimation(
      this,
      animationType,
      {
        x: checkpoint.x,
        y: checkpoint.y,
        variant: variant,
        onComplete: () => {
          console.log('Animation completed!')
          this.handleAnimationComplete(checkpoint)
        },
        onSkip: () => {
          console.log('Animation skipped')
          this.handleAnimationComplete(checkpoint)
        }
      }
    )
    
    animation.play()
  }
  
  handleAnimationComplete(checkpoint: CheckpointData) {
    // Update Convex DB
    // Navigate to checkpoint detail page
    // Award XP
  }
}
```

### Manual Animation Creation

```typescript
import { SealBreakAnimation } from '@/lib/phaser/scenes/animations'

// Create specific animation directly
const sealBreak = new SealBreakAnimation(this, {
  x: 640,
  y: 360,
  variant: 'gold',
  onComplete: () => console.log('Seal broken!'),
  onSkip: () => console.log('Skipped!')
})

sealBreak.play()

// Later, destroy when done
sealBreak.destroy()
```

### Custom Animation Timing

```typescript
// All animations support skip after 500ms by default
// Standard variant: 2s duration
// Gold variant: 3s duration

// Access duration programmatically
const duration = animation.duration // 2000 or 3000

// Override skip delay (advanced)
class CustomAnimation extends BaseCheckpointAnimation {
  protected readonly SKIP_DELAY = 1000 // 1s instead of 500ms
}
```

---

## 🎯 Progression Animations

### Level-Up Sequence

```typescript
// src/app/map/page.tsx or any React component
import { useState, useEffect } from 'react'
import { LevelUpSequence } from '@/components/animations'
import { useAtom } from 'jotai'
import { userProgressAtom } from '@/lib/stores/hudStore'

function MapPage() {
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [userProgress] = useAtom(userProgressAtom)
  const [oldLevel, setOldLevel] = useState(userProgress.level)
  
  // Watch for level changes
  useEffect(() => {
    if (userProgress.level > oldLevel) {
      setShowLevelUp(true)
    }
  }, [userProgress.level, oldLevel])
  
  const handleLevelUpComplete = () => {
    setShowLevelUp(false)
    setOldLevel(userProgress.level)
    // Optional: Award bonus XP, unlock features, etc.
  }
  
  return (
    <>
      <HUD />
      
      <LevelUpSequence
        isVisible={showLevelUp}
        oldLevel={oldLevel}
        newLevel={userProgress.level}
        phase={userProgress.phase}
        isPhaseTransition={userProgress.level % 15 === 0} // Every 15 levels
        onComplete={handleLevelUpComplete}
        onSkip={handleLevelUpComplete}
      />
    </>
  )
}
```

### Badge Award Sequence

```typescript
import { BadgeAwardSequence } from '@/components/animations'

function MapPage() {
  const [showBadge, setShowBadge] = useState(false)
  const [currentBadge, setCurrentBadge] = useState<Badge | null>(null)
  
  // Example: Award badge when checkpoint completed
  const awardBadge = (badgeData: Badge) => {
    setCurrentBadge(badgeData)
    setShowBadge(true)
  }
  
  return (
    <>
      <BadgeAwardSequence
        isVisible={showBadge}
        badge={currentBadge}
        onComplete={() => {
          setShowBadge(false)
          // Navigate to badge collection page
          router.push('/profile/badges')
        }}
        onSkip={() => {
          setShowBadge(false)
        }}
      />
    </>
  )
}
```

### Badge Rarity Examples

```typescript
// Common badge (auto-dismiss after 4s)
const commonBadge = {
  id: 'first-checkpoint',
  name: 'First Steps',
  description: 'Complete your first checkpoint',
  icon: '🎯',
  rarity: 'common' as const
}

// Legendary badge (persistent, requires claim)
const legendaryBadge = {
  id: 'venture-master',
  name: 'Venture Master',
  description: 'Complete all 36 checkpoints with gold status',
  icon: '👑',
  rarity: 'legendary' as const
}

awardBadge(legendaryBadge) // Shows persistent modal with particle burst
```

### Checkpoint Animation Overlay

```typescript
import { CheckpointAnimationOverlay } from '@/components/animations'

function MapPage() {
  const [showCheckpointAnim, setShowCheckpointAnim] = useState(false)
  const [currentCheckpoint, setCurrentCheckpoint] = useState<CheckpointState | null>(null)
  
  return (
    <>
      <CheckpointAnimationOverlay
        isVisible={showCheckpointAnim}
        checkpoint={currentCheckpoint}
        onComplete={() => {
          setShowCheckpointAnim(false)
          // Navigate to checkpoint detail
        }}
        onSkip={() => {
          setShowCheckpointAnim(false)
        }}
      />
    </>
  )
}
```

---

## 🗄️ State Management Patterns

### Reading State

```typescript
import { useAtom } from 'jotai'
import { userProgressAtom, audioSettingsAtom } from '@/lib/stores/hudStore'

function MyComponent() {
  // Read-only (doesn't re-render on write)
  const userProgress = useAtomValue(userProgressAtom)
  
  // Read + Write
  const [audio, setAudio] = useAtom(audioSettingsAtom)
  
  return (
    <div>
      <p>Level: {userProgress.level}</p>
      <button onClick={() => setAudio(prev => ({ ...prev, muted: !prev.muted }))}>
        Toggle Mute
      </button>
    </div>
  )
}
```

### Updating State

```typescript
import { useSetAtom } from 'jotai'
import { userProgressAtom } from '@/lib/stores/hudStore'

function AwardXP() {
  const setUserProgress = useSetAtom(userProgressAtom)
  
  const handleTaskComplete = (xpAmount: number) => {
    setUserProgress(prev => ({
      ...prev,
      xp: prev.xp + xpAmount
    }))
  }
  
  return <button onClick={() => handleTaskComplete(50)}>Complete Task</button>
}
```

### Derived State

```typescript
import { atom } from 'jotai'
import { userProgressAtom } from '@/lib/stores/hudStore'

// Derived atom: Calculate XP percentage
export const xpPercentageAtom = atom((get) => {
  const progress = get(userProgressAtom)
  return (progress.xp / progress.xpToNextLevel) * 100
})

// Usage
function XPDisplay() {
  const percentage = useAtomValue(xpPercentageAtom)
  return <div>XP: {percentage.toFixed(1)}%</div>
}
```

---

## 🎮 Phaser Integration Patterns

### Event Bridge Communication

```typescript
// Send event from Phaser to React
import { eventBridge } from '@/lib/phaser/utils/event-bridge'

// In Phaser Scene
eventBridge.dispatchToReact({
  type: 'CHECKPOINT_CLICKED',
  checkpointId: 'cp_123',
  stage: 1,
  checkpoint: 1
})

// In React
useEffect(() => {
  const handleCheckpointClick = (event: { checkpointId: string }) => {
    console.log('Checkpoint clicked:', event.checkpointId)
    // Show checkpoint detail modal
  }
  
  eventBridge.onReact('CHECKPOINT_CLICKED', handleCheckpointClick)
  
  return () => {
    eventBridge.off('CHECKPOINT_CLICKED', handleCheckpointClick)
  }
}, [])
```

### Syncing Convex → Phaser

```typescript
// In map/page.tsx
useEffect(() => {
  if (!phaserReady || !worldMapData) return
  
  const { eventBridge } = await import('@/lib/phaser/utils/event-bridge')
  
  // Send checkpoint states to Phaser
  eventBridge.dispatchToPhaser({
    type: 'UPDATE_CHECKPOINTS',
    checkpoints: worldMapData.checkpoints.map(cp => ({
      id: cp._id,
      stage: cp.stage,
      checkpoint: cp.checkpoint,
      status: cp.status,
      t1: cp.t1Completed,
      t2: cp.t2Completed,
      t3: cp.t3Completed
    }))
  })
}, [phaserReady, worldMapData])
```

---

## 🎨 Customization

### Custom HUD Component

```typescript
// src/components/hud/CustomMetric.tsx
'use client'

import { motion } from 'framer-motion'
import { useAtom } from 'jotai'
import { corruptionAtom } from '@/lib/stores/hudStore'

export function CorruptionMeter() {
  const [corruption] = useAtom(corruptionAtom)
  
  return (
    <motion.div
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-900/20 border border-red-500/30"
      whileHover={{ scale: 1.05 }}
    >
      <span className="text-xs text-red-400">Corruption</span>
      <div className="w-20 h-2 bg-red-950 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-red-600 to-red-400"
          animate={{ width: `${corruption}%` }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        />
      </div>
      <span className="text-xs font-mono text-red-300">{corruption}%</span>
    </motion.div>
  )
}
```

### Add to HUD

```typescript
// src/components/hud/HUD.tsx
import { CorruptionMeter } from './CorruptionMeter'

export function HUD() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center justify-between">
        {/* Existing components */}
        <CorruptionMeter /> {/* Add custom component */}
      </div>
    </div>
  )
}
```

### Custom Animation

```typescript
// src/lib/phaser/scenes/animations/CustomAnimation.ts
import { BaseCheckpointAnimation, AnimationConfig } from './BaseCheckpointAnimation'

export class CustomAnimation extends BaseCheckpointAnimation {
  constructor(scene: Phaser.Scene, config: AnimationConfig) {
    super(scene, config)
  }
  
  create(): void {
    // Your custom animation logic
    const circle = this.scene.add.circle(0, 0, 50, this.getPrimaryColor())
    this.container.add(circle)
    
    this.scene.tweens.add({
      targets: circle,
      scale: { from: 0, to: 1 },
      duration: this.duration,
      ease: 'Back.easeOut',
      onComplete: () => this.complete()
    })
  }
}
```

---

## 🐛 Troubleshooting

### HUD Not Showing

```typescript
// Check if HUD is visible
const [hudVisible] = useAtom(hudVisibleAtom)
console.log('HUD visible:', hudVisible)

// Force HUD to show
const [, setHudVisible] = useAtom(hudVisibleAtom)
setHudVisible(true)
```

### Animations Not Playing

```typescript
// Ensure Phaser scene is ready
console.log('Phaser ready:', phaserReady)

// Check animation config
const animation = createCheckpointAnimation(scene, 'seal_break', {
  x: 640,
  y: 360,
  variant: 'standard',
  onComplete: () => console.log('✅ Animation complete'),
  onSkip: () => console.log('⏭️ Animation skipped')
})

// Verify animation was created
console.log('Animation:', animation)
animation.play()
```

### State Not Updating

```typescript
// Debug Jotai atoms
import { useAtomValue } from 'jotai'
import { userProgressAtom } from '@/lib/stores/hudStore'

function DebugState() {
  const progress = useAtomValue(userProgressAtom)
  
  useEffect(() => {
    console.log('User progress updated:', progress)
  }, [progress])
  
  return <pre>{JSON.stringify(progress, null, 2)}</pre>
}
```

### Performance Issues

```typescript
// Check FPS
const [fps] = useState(60)

useEffect(() => {
  const fpsInterval = setInterval(() => {
    console.log('Current FPS:', game?.loop.actualFps)
  }, 1000)
  
  return () => clearInterval(fpsInterval)
}, [game])

// Optimize animations
// - Reduce particle count
// - Use object pooling
// - Disable animations on low-end devices
```

---

## ✅ Best Practices

### 1. Always Clean Up Event Listeners

```typescript
useEffect(() => {
  const handler = (event) => console.log(event)
  eventBridge.onReact('SOME_EVENT', handler)
  
  return () => {
    eventBridge.off('SOME_EVENT', handler) // ✅ Clean up
  }
}, [])
```

### 2. Use Derived Atoms for Computed Values

```typescript
// ❌ Don't
const percentage = (xp / maxXP) * 100

// ✅ Do
const xpPercentageAtom = atom((get) => {
  const { xp, xpToNextLevel } = get(userProgressAtom)
  return (xp / xpToNextLevel) * 100
})
```

### 3. Handle Animation Edge Cases

```typescript
const animation = createCheckpointAnimation(scene, type, {
  x: checkpoint.x,
  y: checkpoint.y,
  variant: isGold ? 'gold' : 'standard',
  onComplete: () => {
    // ✅ Always handle completion
    updateDatabase()
    navigateToNextCheckpoint()
  },
  onSkip: () => {
    // ✅ Handle skip separately if needed
    updateDatabase()
    navigateToNextCheckpoint()
  }
})
```

### 4. Graceful Degradation

```typescript
// Handle missing data
const stageName = stageInfo?.stageName || 'Unknown Stage'
const stageIcon = stageInfo?.stageIcon || '❓'

// Fallback for failed animations
try {
  animation.play()
} catch (error) {
  console.error('Animation failed:', error)
  // Continue without animation
  onComplete()
}
```

### 5. Type Safety

```typescript
// ✅ Use proper types
import type { CheckpointState } from '@/lib/phaser/utils/event-bridge'
import type { Badge } from '@/lib/stores/hudStore'

const handleCheckpoint = (checkpoint: CheckpointState) => {
  // TypeScript will catch errors
}

// ❌ Don't use 'any'
const handleCheckpoint = (checkpoint: any) => {
  // No type safety
}
```

---

## 📚 Common Patterns

### Pattern: Queue Multiple Animations

```typescript
const animationQueue: Array<() => void> = []
let isPlayingAnimation = false

const queueAnimation = (animFn: () => void) => {
  animationQueue.push(animFn)
  processQueue()
}

const processQueue = () => {
  if (isPlayingAnimation || animationQueue.length === 0) return
  
  isPlayingAnimation = true
  const nextAnim = animationQueue.shift()!
  
  nextAnim() // Play animation with onComplete calling processNext
}

const processNext = () => {
  isPlayingAnimation = false
  processQueue()
}

// Usage
queueAnimation(() => playLevelUp(() => processNext()))
queueAnimation(() => playBadgeAward(() => processNext()))
queueAnimation(() => playCheckpoint(() => processNext()))
```

### Pattern: Conditional HUD Display

```typescript
const [hudVisible, setHudVisible] = useAtom(hudVisibleAtom)

// Hide HUD during cutscenes
useEffect(() => {
  if (isCutscenePlaying) {
    setHudVisible(false)
  } else {
    setHudVisible(true)
  }
}, [isCutscenePlaying])
```

### Pattern: Animation Chaining

```typescript
const playAnimationSequence = async () => {
  // Play checkpoint animation
  await new Promise(resolve => {
    animation.play()
    animation.onComplete = resolve
  })
  
  // Award XP
  setUserProgress(prev => ({ ...prev, xp: prev.xp + 100 }))
  
  // Check for level up
  if (shouldLevelUp) {
    await new Promise(resolve => {
      setShowLevelUp(true)
      levelUpOnComplete = resolve
    })
  }
  
  // Award badge
  await new Promise(resolve => {
    setShowBadge(true)
    badgeOnComplete = resolve
  })
}
```

---

## 🔗 Additional Resources

- [Phaser 3 Tweens Documentation](https://newdocs.phaser.io/docs/3.80.0/Phaser.Tweens)
- [Framer Motion API](https://www.framer.com/motion/)
- [Jotai Documentation](https://jotai.org/)
- [Week 1 Complete](./WEEK_1_COMPLETE.md)
- [Week 2 Complete](./WEEK_2_COMPLETE.md)
- [Week 3 Complete](./WEEK3_COMPLETE.md)
- [Week 3 Architecture](./WEEK3_ARCHITECTURE.md)

---

**Happy Coding!** 🚀

For issues or questions, refer to the troubleshooting section or check the comprehensive documentation files.