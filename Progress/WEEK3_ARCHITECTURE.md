# Week 3 Architecture: Animations & HUD System

Visual architecture and flow diagrams for Week 3 implementation.

---

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         INTERACTIVE IDEAS MAP                            │
│                         (React + Phaser Integration)                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
          ┌─────────▼─────────┐         ┌──────────▼──────────┐
          │   REACT LAYER     │         │   PHASER LAYER      │
          │   (Week 3 HUD)    │         │  (Week 3 Anims)     │
          └─────────┬─────────┘         └──────────┬──────────┘
                    │                               │
        ┌───────────┴──────────┐         ┌─────────┴──────────┐
        │                      │         │                    │
   ┌────▼────┐          ┌─────▼─────┐  ┌▼──────────┐  ┌─────▼─────┐
   │  HUD    │          │ Framer    │  │ Checkpoint│  │  Event    │
   │ System  │          │  Motion   │  │ Animations│  │  Bridge   │
   └────┬────┘          │   Anims   │  └───────────┘  └───────────┘
        │               └───────────┘
        │
   ┌────▼────────────────────────────┐
   │      JOTAI STATE STORE          │
   │  (Shared React/Phaser State)    │
   └─────────────────────────────────┘
```

---

## 📦 Component Hierarchy

```
app/map/page.tsx (Map Page)
│
├── HUD (Fixed Overlay)
│   │
│   ├── StageInfo
│   │   ├── Stage Icon (Emoji)
│   │   └── Biome Name
│   │
│   ├── CheckpointProgress
│   │   ├── Counter (X/36)
│   │   ├── Gold Medal Badge
│   │   └── Progress Bar
│   │
│   ├── StreakCounter
│   │   ├── Flame Icon (Animated)
│   │   └── Day Count
│   │
│   ├── QualityScore
│   │   ├── Quality (0-12)
│   │   └── Valuation ($)
│   │
│   ├── LevelDisplay
│   │   ├── Level Number
│   │   └── Phase Icon
│   │
│   ├── XPBar
│   │   ├── Progress Bar
│   │   └── Current/Max XP
│   │
│   └── AudioControls
│       ├── Mute Button
│       └── Volume Bar
│
├── LevelUpSequence (Modal)
│   ├── Burst Effect
│   ├── Level Card (3D)
│   ├── Phase Info (Conditional)
│   └── Skip Button
│
├── BadgeAwardSequence (Modal)
│   ├── Flash Effect
│   ├── Badge Card (Rarity-based)
│   ├── Particle Burst (Legendary)
│   └── Action Buttons
│
└── CheckpointAnimationOverlay (Modal)
    ├── Dark Backdrop
    ├── Phaser Animation Wrapper
    ├── Animation Label
    └── Close Button
```

---

## 🎬 Checkpoint Animation Architecture

```
BaseCheckpointAnimation (Abstract Class)
│
├── Properties
│   ├── scene: Phaser.Scene
│   ├── config: AnimationConfig
│   ├── container: Container
│   ├── isComplete: boolean
│   ├── isSkipped: boolean
│   └── duration: number (2s/3s)
│
├── Methods
│   ├── create() → abstract
│   ├── play() → void
│   ├── skip() → void
│   ├── complete() → void
│   ├── destroy() → void
│   ├── getPrimaryColor() → number
│   ├── getSecondaryColor() → number
│   └── getGlowColor() → number
│
└── Implementations (6 Patterns)
    │
    ├── SealBreakAnimation
    │   ├── createSeal()
    │   ├── createCrackPattern()
    │   ├── playSealBreak()
    │   ├── animateCracks()
    │   └── animateSealShatter()
    │
    ├── RuneInscriptionAnimation
    │   ├── createGlowRing()
    │   ├── createRuneBase()
    │   ├── createRuneSymbols()
    │   ├── playRuneInscription()
    │   └── animateRuneActivation()
    │
    ├── BeaconLightingAnimation
    │   ├── createBeaconBase()
    │   ├── createLightRays()
    │   ├── createFlame()
    │   ├── animateLightRays()
    │   └── animateFlame()
    │
    ├── BridgeRepairAnimation
    │   ├── createBridgeBase()
    │   ├── createPlanks()
    │   ├── createRopes()
    │   ├── animatePlanks()
    │   └── animateRopeAttach()
    │
    ├── CompassCalibrationAnimation
    │   ├── createCompassBase()
    │   ├── createCardinalPoints()
    │   ├── createNeedle()
    │   ├── animateNeedleSpin()
    │   └── animateCalibrationComplete()
    │
    └── WardPlacementAnimation
        ├── createWardBase()
        ├── createProtectionCircles()
        ├── createRuneIcons()
        ├── animateProtectionCircles()
        └── animateShieldFormation()
```

---

## 🗂️ State Management Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   JOTAI STATE ATOMS                         │
│                   (src/lib/stores/hudStore.ts)              │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ HUD Atoms     │   │ Progress      │   │ Audio Atoms   │
├───────────────┤   │ Atoms         │   ├───────────────┤
│ hudVisible    │   ├───────────────┤   │ masterVolume  │
│ hudExpanded   │   │ userProgress  │   │ musicVolume   │
│ activeVenture │   │ xp            │   │ sfxVolume     │
└───────────────┘   │ level         │   │ muted         │
                    │ phase         │   └───────────────┘
                    │ streak        │
                    │ qualityScore  │
                    │ valuationScore│
                    └───────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ HUD.tsx       │   │ LevelDisplay  │   │ AudioControls │
│ (Consumer)    │   │ (Consumer)    │   │ (Consumer)    │
└───────────────┘   └───────────────┘   └───────────────┘
```

---

## ⚡ Animation Timeline Diagrams

### **Seal Break Animation (2s/3s)**

```
Time: 0ms ──────────────────────────────────────────────────────→ 2000ms

0ms         400ms        1000ms       1500ms       2000ms
│            │            │            │            │
▼            ▼            ▼            ▼            ▼
Seal        Rune         Crack        Particle    Complete
Appear      Lines        Spread       Explosion   Fadeout
(Scale)     (FadeIn)     (Anim)       (Burst)     (Alpha)

└─────┬─────┘
      Skippable starts at 500ms (ESC / Click)
```

### **Level-Up Sequence (2s)**

```
Time: 0ms ──────────────────────────────────────────────────────→ 2000ms

0ms    100ms   300ms   500ms   800ms   1000ms  2000ms
│       │       │       │       │       │       │
▼       ▼       ▼       ▼       ▼       ▼       ▼
Fade    Burst   Card    Level   Phase   Skip    Auto
In      Effect  Rotate  Number  Info    Button  Dismiss
                (3D)    Appear  (Cond)  Active

└──────────────┬──────────────┘
               Skippable after 500ms
```

### **Badge Award Sequence (4s / Persistent)**

```
Time: 0ms ──────────────────────────────────────────────────────→ 4000ms

0ms    100ms   200ms   800ms   1000ms       4000ms
│       │       │       │       │            │
▼       ▼       ▼       ▼       ▼            ▼
Flash   Flash   Badge   Reveal  Particles   Auto-Dismiss
Effect  Out     Rotate  Details (Legend)    (Non-Legend)
                (3D)

Legendary Badges:
├── Particle Burst (50 particles)
├── Rotating Glow Ring
└── Persistent Modal (Manual Dismiss)

Common-Epic Badges:
└── Auto-Dismiss after 4s
```

---

## 🎨 Color System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    COLOR SYSTEM                             │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
        ▼                                       ▼
┌───────────────────┐                 ┌───────────────────┐
│ STANDARD VARIANT  │                 │   GOLD VARIANT    │
├───────────────────┤                 ├───────────────────┤
│ Primary: #3B82F6  │                 │ Primary: #F59E0B  │
│ Secondary:#60A5FA │                 │ Secondary:#FEF08A │
│ Glow: #6366F1     │                 │ Glow: #FFD700     │
│ Accent: #8B5CF6   │                 │ Accent: #D97706   │
└───────────────────┘                 └───────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
        ▼                                       ▼
┌───────────────────┐                 ┌───────────────────┐
│  HUD THEME        │                 │  BADGE RARITIES   │
├───────────────────┤                 ├───────────────────┤
│ BG: #0A0D12       │                 │ Common: Gray      │
│ Card: #1E293B     │                 │ Uncommon: Green   │
│ Border: #FFF/10%  │                 │ Rare: Blue        │
│ Text: #FFFFFF     │                 │ Epic: Purple      │
│ Muted: #64748B    │                 │ Legendary: Gold   │
└───────────────────┘                 └───────────────────┘
```

---

## 🔄 Event Flow Diagrams

### **Checkpoint Click → Animation Play**

```
User Clicks Checkpoint in Phaser
        │
        ▼
┌───────────────────┐
│ WorldMapScene     │
│ handleCheckpoint  │
│ Click()           │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ Event Bridge      │
│ CHECKPOINT_CLICKED│
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ React Page        │
│ map/page.tsx      │
│ Event Listener    │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ Determine         │
│ Animation Type    │
│ (Stage Mapping)   │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ Create Animation  │
│ Instance          │
│ (Factory Pattern) │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ Play Animation    │
│ animation.play()  │
└────────┬──────────┘
         │
         ├─── Skippable after 500ms
         │
         ▼
┌───────────────────┐
│ Animation         │
│ Complete/Skip     │
│ Callback          │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ Update Convex     │
│ Checkpoint Status │
└───────────────────┘
```

### **XP Gain → Level Up**

```
Task Completed
     │
     ▼
┌──────────────┐
│ Award XP     │
│ +50 XP       │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Update Atom  │
│ xpAtom += 50 │
└──────┬───────┘
       │
       ▼
┌──────────────┐     NO
│ XP >= Max?   ├─────────→ [End]
└──────┬───────┘
       │ YES
       ▼
┌──────────────┐
│ Increment    │
│ Level        │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Show         │
│ LevelUp      │
│ Sequence     │
└──────┬───────┘
       │
       ▼
┌──────────────┐     NO
│ Phase Change?├─────────→ [Continue]
└──────┬───────┘
       │ YES
       ▼
┌──────────────┐
│ Show Phase   │
│ Transition   │
└──────────────┘
```

---

## 📊 Stage → Animation Mapping

```
┌──────────┬────────────────────────┬───────────────┐
│  Stage   │   Animation Type       │   Variant     │
├──────────┼────────────────────────┼───────────────┤
│  S1      │  Seal Break            │  Std / Gold   │
│  S2      │  Rune Inscription      │  Std / Gold   │
│  S3      │  Beacon Lighting       │  Std / Gold   │
│  S4      │  Bridge Repair         │  Std / Gold   │
│  S5      │  Compass Calibration   │  Std / Gold   │
│  S6      │  Ward Placement        │  Std / Gold   │
│  S7      │  Beacon Lighting       │  Std / Gold   │
│  S8      │  Seal Break            │  Std / Gold   │
└──────────┴────────────────────────┴───────────────┘

Variant Selection Logic:
├── Standard: t1 OR t2 OR t3 completed
└── Gold: t1 AND t2 AND t3 completed
```

---

## 🏛️ Factory Pattern Implementation

```typescript
// Factory Function Architecture

createCheckpointAnimation(scene, type, config)
        │
        ├── Input: type (string)
        │   ├── "seal_break"
        │   ├── "rune_inscription"
        │   ├── "beacon_lighting"
        │   ├── "bridge_repair"
        │   ├── "compass_calibration"
        │   └── "ward_placement"
        │
        ├── Input: config (AnimationConfig)
        │   ├── x: number
        │   ├── y: number
        │   ├── variant: "standard" | "gold"
        │   ├── onComplete?: () => void
        │   └── onSkip?: () => void
        │
        └── Output: BaseCheckpointAnimation
            └── Specific Implementation Instance
```

---

## 🎯 Interaction Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERACTIONS                        │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ Keyboard      │   │ Mouse/Touch   │   │ Auto Events   │
├───────────────┤   ├───────────────┤   ├───────────────┤
│ ESC → Skip    │   │ Click → Skip  │   │ Timer →       │
│ (Animations)  │   │ (Animations)  │   │ Auto-Dismiss  │
└───────────────┘   │ Hover → Scale │   └───────────────┘
                    │ (HUD Buttons) │
                    └───────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ Event Handler │
                    └───────┬───────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ Update State  │   │ Trigger Anim  │   │ Navigate      │
│ (Jotai)       │   │ (Sequence)    │   │ (Router)      │
└───────────────┘   └───────────────┘   └───────────────┘
```

---

## 📱 Responsive Layout Architecture

```
Desktop (≥1024px)
┌─────────────────────────────────────────────────────────────┐
│ [Stage Info] [Checkpoint] │ [Streak][Quality][Level][XP][🔊]│
└─────────────────────────────────────────────────────────────┘

Tablet (768px - 1023px)
┌─────────────────────────────────────────────────────────────┐
│ [Stage] [Checkpoint] │ [Streak][Level][XP][🔊]              │
└─────────────────────────────────────────────────────────────┘

Mobile (<768px) - Collapsed
┌─────────────────────────────────────────────────────────────┐
│                    [Expand HUD ▼]                           │
└─────────────────────────────────────────────────────────────┘

Mobile (<768px) - Expanded
┌─────────────────────────────────────────────────────────────┐
│ [Stage Info]                                                │
│ [Checkpoint Progress]                                       │
│ [Level] [XP] [Streak] [Quality]                            │
│                    [Collapse HUD ▲]                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Technical Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    TECHNOLOGY STACK                         │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ React 18      │   │ Phaser 3.80   │   │ Framer Motion │
│               │   │               │   │     12        │
├───────────────┤   ├───────────────┤   ├───────────────┤
│ - HUD Layer   │   │ - Animations  │   │ - Level Up    │
│ - Components  │   │ - Tweens      │   │ - Badge Award │
│ - Pages       │   │ - Graphics    │   │ - Overlays    │
└───────────────┘   └───────────────┘   └───────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ Jotai         │   │ TypeScript    │   │ Tailwind CSS  │
│ (State)       │   │ 5.0+ (Strict) │   │ 3.4+          │
├───────────────┤   ├───────────────┤   ├───────────────┤
│ - Atoms       │   │ - Type Safety │   │ - Utilities   │
│ - Derived     │   │ - Interfaces  │   │ - Responsive  │
│ - Async       │   │ - Generics    │   │ - Gradients   │
└───────────────┘   └───────────────┘   └───────────────┘
```

---

## 🎬 Animation Performance

```
Target: 60 FPS
│
├── Phaser Tweens (Hardware Accelerated)
│   ├── GPU: Transform, Opacity
│   ├── CPU: Color, Custom Properties
│   └── Optimization: Object Pooling
│
├── Framer Motion (React Animations)
│   ├── GPU: Scale, Translate, Opacity
│   ├── Layout Animations: will-change CSS
│   └── Optimization: AnimatePresence
│
└── Best Practices
    ├── Avoid Layout Thrashing
    ├── Use Transform over Position
    ├── Minimize Reflows
    └── Debounce Resize Events
```

---

## 🔒 Type Safety Architecture

```typescript
// Type System Hierarchy

AnimationConfig (Interface)
├── x: number
├── y: number
├── variant: "standard" | "gold"
├── onComplete?: () => void
└── onSkip?: () => void

CheckpointState (Interface)
├── id: string
├── stage: number (1-8)
├── checkpoint: number (1-6)
├── status: "locked" | "in_progress" | "completed" | "gold"
├── t1: boolean
├── t2: boolean
└── t3: boolean

UserProgress (Interface)
├── level: number
├── phase: number (1-3)
├── xp: number
├── xpToNextLevel: number
├── streak: number
├── qualityScore: number (0-12)
└── valuationScore: number
```

---

## 📈 Data Flow Summary

```
Convex DB
    ↓
React Query (useQuery)
    ↓
Jotai Atoms
    ↓
HUD Components (Subscribers)
    ↓
User Interactions
    ↓
Event Bridge
    ↓
Phaser Scene
    ↓
Animations Play
    ↓
Callbacks Fire
    ↓
Convex Mutations
    ↓
State Updates
    ↓
[Loop back to React Query]
```

---

**Architecture Status:** ✅ Complete  
**Performance:** ✅ 60 FPS Target  
**Type Safety:** ✅ Strict Mode  
**Accessibility:** ✅ Keyboard Nav  
**Responsive:** ✅ Mobile-First