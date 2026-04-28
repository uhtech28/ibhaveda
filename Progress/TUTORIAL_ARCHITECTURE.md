# Tutorial System Architecture

## 🏗️ System Overview

The tutorial system is a progressive onboarding flow that guides new users through the Interactive Ideas venture map. It consists of three primary components that appear sequentially, with state management handled through React hooks and localStorage persistence.

## 📐 Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Tutorial System                             │
│                                                                 │
│  ┌───────────────┐    ┌────────────────┐    ┌────────────────┐ │
│  │ WelcomeOverlay│───▶│MapIntroOverlay │───▶│FirstCheckpoint │ │
│  │   (3 seconds) │    │   (3 steps)    │    │     Pulse      │ │
│  │   Z-index: 60 │    │   Z-index: 50  │    │  Z-index: 40   │ │
│  └───────────────┘    └────────────────┘    └────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                         User Journey                             │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │      /map (MapIntroPage)            │
        │  - IntroScreen (gender selection)   │
        │  - tutorialStep state               │
        └─────────────────┬───────────────────┘
                          │
                          │ User selects gender
                          ▼
        ┌─────────────────────────────────────┐
        │     Check localStorage              │
        │  tutorial_completed === "true"?     │
        └─────────────────┬───────────────────┘
                          │
           ┌──────────────┴──────────────┐
           │                             │
          YES                           NO
           │                             │
           ▼                             ▼
    ┌─────────────┐          ┌──────────────────┐
    │ Skip to     │          │ Show             │
    │ /map/stages │          │ WelcomeOverlay   │
    └─────────────┘          └────────┬─────────┘
                                      │
                                      │ 3s or click
                                      ▼
                          ┌──────────────────────┐
                          │ Show                 │
                          │ MapIntroOverlay      │
                          │ (Step 1/3)           │
                          └────────┬─────────────┘
                                   │
                                   │ Click "Next"
                                   ▼
                          ┌──────────────────────┐
                          │ MapIntroOverlay      │
                          │ (Step 2/3)           │
                          └────────┬─────────────┘
                                   │
                                   │ Click "Next"
                                   ▼
                          ┌──────────────────────┐
                          │ MapIntroOverlay      │
                          │ (Step 3/3)           │
                          └────────┬─────────────┘
                                   │
                                   │ Click "Get Started"
                                   │ Set tutorial_completed
                                   ▼
                          ┌──────────────────────┐
                          │ Navigate to          │
                          │ /map/stages          │
                          └────────┬─────────────┘
                                   │
                                   │ User selects stage
                                   ▼
        ┌───────────────────────────────────────────┐
        │      /map/world (MapPage)                 │
        │  - Phaser canvas                          │
        │  - showFirstCheckpointPulse state         │
        └─────────────────┬─────────────────────────┘
                          │
                          │ Check conditions
                          ▼
        ┌─────────────────────────────────────┐
        │  tutorial_completed === "true" AND  │
        │  first_checkpoint_pulse_shown !== "true"? │
        └─────────────────┬───────────────────┘
                          │
           ┌──────────────┴──────────────┐
           │                             │
          YES                           NO
           │                             │
           ▼                             ▼
    ┌─────────────────┐          ┌──────────────┐
    │ Show            │          │ Normal map   │
    │ FirstCheckpoint │          │ view         │
    │ Pulse           │          └──────────────┘
    └────────┬────────┘
             │
             │ User clicks checkpoint
             │ Set first_checkpoint_pulse_shown
             ▼
    ┌─────────────────┐
    │ Hide pulse      │
    │ Continue normal │
    │ gameplay        │
    └─────────────────┘
```

## 🧩 Component Hierarchy

```
App Root
│
├── /map (MapIntroPage)
│   ├── IntroScreen (character selection)
│   │   └── CharacterCard × 2
│   │
│   ├── WelcomeOverlay (conditional)
│   │   ├── AnimatedIcon
│   │   ├── ProgressBar
│   │   └── StarfieldBackground
│   │
│   └── MapIntroOverlay (conditional)
│       ├── TutorialCard
│       │   ├── StepIcon
│       │   ├── StepTitle
│       │   ├── StepDescription
│       │   └── ProgressDots
│       ├── NextButton
│       └── SkipButton
│
└── /map/world (MapPage)
    ├── Phaser Canvas (Z-index: 0)
    ├── HUD (Z-index: 10-20)
    ├── CheckpointPanel (conditional, Z-index: 30)
    └── FirstCheckpointPulse (conditional, Z-index: 40)
        ├── PulsingRings × 3
        ├── FloatingText
        ├── BouncingArrow
        └── RotatingParticles × 6
```

## 💾 State Management

### React State (Ephemeral)

```
┌─────────────────────────────────────┐
│  /map/page.tsx (MapIntroPage)       │
├─────────────────────────────────────┤
│  tutorialStep:                      │
│    - "gender"                       │
│    - "welcome"                      │
│    - "map-intro"                    │
│    - "complete"                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  /map/world/page.tsx (MapPage)      │
├─────────────────────────────────────┤
│  showFirstCheckpointPulse: boolean  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  WelcomeOverlay                     │
├─────────────────────────────────────┤
│  progress: number (0-100)           │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  MapIntroOverlay                    │
├─────────────────────────────────────┤
│  currentStep: number (0-2)          │
└─────────────────────────────────────┘
```

### LocalStorage (Persistent)

```
┌─────────────────────────────────────┐
│  Browser LocalStorage               │
├─────────────────────────────────────┤
│  tutorial_completed: "true"         │
│  first_checkpoint_pulse_shown: "true"│
│  selectedGender: "male" | "female"  │
└─────────────────────────────────────┘
```

## 🎯 Event Flow

```
┌──────────────────┐
│  User Action     │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────┐
│  Event Handler           │
│  - onClick               │
│  - setTimeout            │
│  - useEffect             │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  State Update            │
│  - setState              │
│  - localStorage.setItem  │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  Re-render / Navigation  │
│  - Component update      │
│  - router.push()         │
└──────────────────────────┘
```

## 🎨 Animation Architecture

### Layer 1: CSS Keyframes (Base Performance)
```
@keyframes pulse-ring       → Expanding rings
@keyframes pulse-glow       → Glow effect
@keyframes float            → Floating motion
@keyframes bounce-arrow     → Bouncing arrow
```

### Layer 2: Framer Motion (Smooth Transitions)
```
<motion.div>
  initial   → Entry state
  animate   → Active state
  exit      → Removal state
  transition → Easing & duration
</motion.div>
```

### Layer 3: JavaScript Intervals (Progress)
```
setInterval → Progress bar animation (WelcomeOverlay)
setTimeout  → Auto-dismiss timer
```

## 🔐 Persistence Strategy

```
┌────────────────────────────────────────────────────┐
│             Persistence Layer                      │
├────────────────────────────────────────────────────┤
│                                                    │
│  On Tutorial Complete:                             │
│  ✓ localStorage.setItem("tutorial_completed", "true") │
│                                                    │
│  On Pulse Dismiss:                                 │
│  ✓ localStorage.setItem("first_checkpoint_pulse_shown", "true") │
│                                                    │
│  On Gender Select:                                 │
│  ✓ localStorage.setItem("selectedGender", gender)  │
│                                                    │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│             Retrieval Strategy                     │
├────────────────────────────────────────────────────┤
│                                                    │
│  Check on page load (useEffect):                   │
│  ✓ const completed = localStorage.getItem(...)     │
│  ✓ if (completed === "true") skip tutorial         │
│                                                    │
└────────────────────────────────────────────────────┘
```

## 🚦 Conditional Rendering Logic

```typescript
// /map/page.tsx
{tutorialStep === "gender" && <IntroScreen />}
{tutorialStep === "welcome" && <WelcomeOverlay />}
{tutorialStep === "map-intro" && <MapIntroOverlay />}

// /map/world/page.tsx
{showFirstCheckpointPulse && <FirstCheckpointPulse />}
```

## 📡 Communication Patterns

### Parent → Child (Props)
```
MapIntroPage
  ├─→ ventureName (string)
  │   └─→ WelcomeOverlay
  │
  └─→ onComplete (callback)
      ├─→ WelcomeOverlay
      └─→ MapIntroOverlay
```

### Child → Parent (Callbacks)
```
WelcomeOverlay
  └─→ onComplete() ─→ handleWelcomeComplete()

MapIntroOverlay
  └─→ onComplete() ─→ handleMapIntroComplete()

FirstCheckpointPulse
  └─→ onCheckpointClick() ─→ setShowFirstCheckpointPulse(false)
```

## 🛡️ Error Handling

```
┌────────────────────────────────────┐
│  Error Prevention Strategies       │
├────────────────────────────────────┤
│                                    │
│  ✓ Skip button on all components   │
│  ✓ Auto-dismiss fallback           │
│  ✓ localStorage checks (typeof window) │
│  ✓ Null coalescing (??)            │
│  ✓ Optional chaining (?.)          │
│  ✓ Default values                  │
│                                    │
└────────────────────────────────────┘
```

## 🔄 Lifecycle Hooks

### WelcomeOverlay
```typescript
useEffect(() => {
  // Auto-dismiss timer
  setTimeout(() => onComplete(), 3000);
  
  // Progress animation
  const interval = setInterval(() => {
    setProgress(prev => prev + 1);
  }, 30);
  
  return () => {
    clearTimeout(timer);
    clearInterval(interval);
  };
}, [onComplete]);
```

### FirstCheckpointPulse
```typescript
// Integrated into existing checkpoint click handler
useEffect(() => {
  const handleClick = (e) => {
    if (showFirstCheckpointPulse) {
      setShowFirstCheckpointPulse(false);
      localStorage.setItem("first_checkpoint_pulse_shown", "true");
    }
  };
  
  eventBridge.on("CHECKPOINT_CLICKED", handleClick);
  return () => eventBridge.off("CHECKPOINT_CLICKED", handleClick);
}, [showFirstCheckpointPulse]);
```

## 📦 Dependency Graph

```
WelcomeOverlay
├── framer-motion (AnimatePresence, motion)
├── lucide-react (Sparkles)
└── React (useState, useEffect)

MapIntroOverlay
├── framer-motion (AnimatePresence, motion)
├── lucide-react (ChevronRight, X, Map, Target, CheckCircle)
├── @/components/ui/button (shadcn)
├── @/components/ui/card (shadcn)
└── React (useState)

FirstCheckpointPulse
├── framer-motion (motion)
├── lucide-react (MousePointer2)
└── React (styled-jsx for keyframes)
```

## 🎯 Z-Index Strategy

```
┌─────────────────────────────────────┐
│  60  WelcomeOverlay (highest)       │  Full screen overlay
├─────────────────────────────────────┤
│  50  MapIntroOverlay                │  Tutorial cards
├─────────────────────────────────────┤
│  40  FirstCheckpointPulse           │  Visual indicator
├─────────────────────────────────────┤
│  30  CheckpointPanel                │  Task details
├─────────────────────────────────────┤
│  20  HUD                            │  UI chrome
├─────────────────────────────────────┤
│  10  StageStrip, AudioToggle        │  Map controls
├─────────────────────────────────────┤
│   0  Phaser Canvas (lowest)         │  Game world
└─────────────────────────────────────┘
```

## 🧪 Testing Architecture

```
┌──────────────────────────────────────┐
│  Testing Strategy                    │
├──────────────────────────────────────┤
│                                      │
│  Unit Tests:                         │
│  - Component rendering               │
│  - State transitions                 │
│  - Callback execution                │
│                                      │
│  Integration Tests:                  │
│  - Full tutorial flow                │
│  - LocalStorage persistence          │
│  - Navigation behavior               │
│                                      │
│  E2E Tests:                          │
│  - First-time user journey           │
│  - Returning user behavior           │
│  - Skip functionality                │
│                                      │
└──────────────────────────────────────┘
```

## 🔧 Configuration Points

```typescript
// Duration settings
WELCOME_DURATION = 3000ms
PROGRESS_INTERVAL = 30ms
TUTORIAL_STEPS = 3

// Storage keys
STORAGE_KEYS = {
  TUTORIAL_COMPLETED: "tutorial_completed",
  PULSE_SHOWN: "first_checkpoint_pulse_shown",
  SELECTED_GENDER: "selectedGender"
}

// Animation timings
PULSE_RING_DURATION = 2000ms
FLOAT_DURATION = 3000ms
BOUNCE_DURATION = 1500ms
```

## 🚀 Performance Considerations

```
┌────────────────────────────────────────┐
│  Optimization Strategies               │
├────────────────────────────────────────┤
│                                        │
│  ✓ CSS keyframes for continuous anims  │
│  ✓ Framer Motion for mount/unmount    │
│  ✓ Conditional rendering               │
│  ✓ useMemo for stable refs             │
│  ✓ LocalStorage caching                │
│  ✓ Lazy loading (via AnimatePresence)  │
│  ✓ Single event bridge integration     │
│                                        │
└────────────────────────────────────────┘
```

## 📊 Memory Management

```
Component Lifecycle:
┌────────┐    ┌────────┐    ┌────────┐
│ Mount  │ → │ Active │ → │Unmount │
└───┬────┘    └────────┘    └───┬────┘
    │                           │
    ├─ Set timers               ├─ Clear timers
    ├─ Add listeners            ├─ Remove listeners
    └─ Create animations        └─ Cleanup animations
```

## 🎉 Summary

The tutorial system follows a modular, composable architecture with:

- **Separation of Concerns**: Each component has a single responsibility
- **Progressive Enhancement**: Tutorial layers add on top of existing map
- **Persistence**: LocalStorage ensures tutorial shows only once
- **Performance**: CSS keyframes + selective re-renders
- **Accessibility**: Skip buttons and clear navigation
- **Maintainability**: Well-documented, type-safe code

Total Architecture:
- 3 React components
- 2 page integrations
- 3 localStorage keys
- 4 CSS animations
- Z-index layering strategy
- Event-driven communication