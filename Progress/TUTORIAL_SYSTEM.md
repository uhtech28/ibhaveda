# Interactive Ideas Tutorial System

## Overview

The tutorial system provides a guided onboarding experience for new users navigating the Interactive Ideas venture map. It consists of three main components that progressively introduce users to the platform.

## Tutorial Flow

```
┌──────────────────────┐
│  Gender Selection    │  /map
│   (IntroScreen)      │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Welcome Overlay     │  Auto-dismiss after 3s
│  "Welcome to..."     │  or click to skip
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Map Intro Overlay   │  3-step tutorial
│  Interactive Guide   │  Click to advance
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│   Stage Selection    │  /map/stages
│                      │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│   World Map          │  /map/world
│ + First Checkpoint   │
│   Pulse Indicator    │
└──────────────────────┘
```

## Components

### 1. WelcomeOverlay (`src/components/map/WelcomeOverlay.tsx`)

**Purpose**: Full-screen welcome message that appears immediately after gender selection.

**Features**:
- Displays venture name prominently
- Welcome message: "You're about to validate your startup idea"
- Auto-dismisses after 3 seconds
- Can be skipped by clicking anywhere
- Progress bar animation
- Animated stars and pulsing rings background
- Smooth fade in/out with Framer Motion

**Props**:
```typescript
interface WelcomeOverlayProps {
  ventureName: string;
  onComplete: () => void;
}
```

**Z-index**: 60 (above all map elements)

---

### 2. MapIntroOverlay (`src/components/map/MapIntroOverlay.tsx`)

**Purpose**: Interactive 3-step tutorial explaining the map functionality.

**Features**:
- **Step 1**: "This is your venture map" - Explains navigation
- **Step 2**: "Each checkpoint validates your idea" - Explains checkpoints
- **Step 3**: "Complete tasks to progress" - Explains progression system
- Click "Next" to advance through steps
- Skip button in top-right corner
- Progress dots showing current step
- Smooth transitions between steps
- Sets `tutorial_completed` localStorage flag on completion

**Props**:
```typescript
interface MapIntroOverlayProps {
  onComplete: () => void;
}
```

**Z-index**: 50 (above map, below welcome)

**Tutorial Steps**:
```typescript
const TUTORIAL_STEPS = [
  {
    id: 1,
    title: "This is your venture map",
    description: "Navigate through industrial stages...",
    icon: Map,
    highlight: "map-area",
  },
  {
    id: 2,
    title: "Each checkpoint validates your idea",
    description: "Complete strategic tasks...",
    icon: Target,
    highlight: "checkpoint-area",
  },
  {
    id: 3,
    title: "Complete tasks to progress",
    description: "Earn Gold status...",
    icon: CheckCircle,
    highlight: "progress-area",
  },
];
```

---

### 3. FirstCheckpointPulse (`src/components/map/FirstCheckpointPulse.tsx`)

**Purpose**: Animated visual indicator directing users to the first checkpoint.

**Features**:
- Pulsing concentric rings around Checkpoint 1
- Floating "Start Here!" text with icon
- Animated arrow pointing down
- Rotating particle effects
- CSS keyframe animations for optimal performance
- Persists until user clicks any checkpoint
- Sets `first_checkpoint_pulse_shown` localStorage flag when dismissed

**Props**:
```typescript
interface FirstCheckpointPulseProps {
  onCheckpointClick: () => void;
}
```

**Z-index**: 40 (visible but doesn't block interaction)

**Animations**:
- `pulse-ring`: Expanding/fading rings (2s duration)
- `pulse-glow`: Central glow effect (2s duration)
- `float-text`: Floating text animation (3s duration)
- `bounce-arrow`: Bouncing arrow (1.5s duration)

---

## State Management

### Page: `/map` (MapIntroPage)

```typescript
type TutorialStep = "gender" | "welcome" | "map-intro" | "complete";
const [tutorialStep, setTutorialStep] = useState<TutorialStep>("gender");
```

**Flow Logic**:
1. User selects gender → `handleStart()`
2. Check if `tutorial_completed` exists in localStorage
   - If YES: Skip to `/map/stages`
   - If NO: Show `WelcomeOverlay` (tutorialStep = "welcome")
3. After 3s or click → `handleWelcomeComplete()` → Show `MapIntroOverlay`
4. After completing 3 steps → `handleMapIntroComplete()` → Navigate to `/map/stages`

### Page: `/map/world` (MapPage)

```typescript
const [showFirstCheckpointPulse, setShowFirstCheckpointPulse] = useState(false);
```

**Display Logic**:
```typescript
useEffect(() => {
  const tutorialCompleted = localStorage.getItem("tutorial_completed") === "true";
  const pulseShown = localStorage.getItem("first_checkpoint_pulse_shown") === "true";

  if (tutorialCompleted && !pulseShown && phaserReady && checkpoints.length > 0) {
    if (activeCP === 1) {
      setShowFirstCheckpointPulse(true);
    }
  }
}, [phaserReady, checkpoints, activeCP]);
```

**Hide Logic**:
- Automatically hides when any checkpoint is clicked
- Updates localStorage to prevent showing again

---

## LocalStorage Keys

| Key | Value | Purpose |
|-----|-------|---------|
| `tutorial_completed` | `"true"` | Set when user completes MapIntroOverlay |
| `first_checkpoint_pulse_shown` | `"true"` | Set when user clicks any checkpoint |
| `selectedGender` | `"male"` \| `"female"` | User's character selection |

---

## User Experience Flow

### First-Time User
1. Visits `/map` → Sees IntroScreen
2. Selects character (male/female)
3. Sees WelcomeOverlay (3s auto-dismiss)
4. Sees MapIntroOverlay (3 steps)
5. Navigates to `/map/stages`
6. Selects a stage
7. Arrives at `/map/world` with FirstCheckpointPulse visible
8. Clicks checkpoint → Pulse disappears

### Returning User
1. Visits `/map` → Sees IntroScreen
2. Selects character
3. **Skips WelcomeOverlay and MapIntroOverlay**
4. Goes directly to `/map/stages`
5. Arrives at `/map/world` without pulse (already completed)

---

## Customization Guide

### Change Tutorial Steps

Edit `MapIntroOverlay.tsx`:

```typescript
const TUTORIAL_STEPS = [
  {
    id: 1,
    title: "Your custom title",
    description: "Your custom description",
    icon: YourIcon, // from lucide-react
    highlight: "custom-area",
  },
  // Add more steps...
];
```

### Change Auto-Dismiss Duration

Edit `WelcomeOverlay.tsx`:

```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    onComplete();
  }, 5000); // Change from 3000 to 5000 for 5 seconds
  // ...
}, [onComplete]);
```

### Change Checkpoint Pulse Position

Edit `FirstCheckpointPulse.tsx` positioning:

```typescript
<div
  className="fixed z-40 pointer-events-none"
  style={{
    left: "50%",  // Change horizontal position
    top: "50%",   // Change vertical position
    transform: "translate(-50%, -50%)",
  }}
>
```

### Reset Tutorial for Testing

```javascript
localStorage.removeItem("tutorial_completed");
localStorage.removeItem("first_checkpoint_pulse_shown");
```

---

## Technical Details

### Dependencies
- **Framer Motion**: Animations and transitions
- **Lucide React**: Icons (Sparkles, Map, Target, CheckCircle, MousePointer2, etc.)
- **shadcn/ui**: Button, Card components
- **Tailwind CSS**: Styling

### Performance Considerations
- FirstCheckpointPulse uses CSS keyframes instead of JS animations for better performance
- Components are lazy-loaded with `AnimatePresence` for smooth mounting/unmounting
- LocalStorage checks prevent unnecessary re-renders

### Accessibility
- All overlays can be dismissed by clicking
- Skip buttons available on all timed components
- High contrast text on semi-transparent backgrounds
- Clear visual indicators for interactive elements

---

## Future Enhancements

Potential improvements:
- [ ] Add audio narration to tutorial steps
- [ ] Highlight specific map areas during tutorial
- [ ] Add swipe gestures for mobile
- [ ] Track tutorial completion analytics
- [ ] Allow users to replay tutorial from settings
- [ ] Localization support for multiple languages
- [ ] Add tooltips to specific UI elements during tutorial
- [ ] Create admin panel to customize tutorial content

---

## Troubleshooting

### Tutorial doesn't show
- Check localStorage keys
- Verify Phaser is ready (`phaserReady === true`)
- Ensure venture data is loaded

### Pulse doesn't appear
- Confirm `tutorial_completed === "true"`
- Check that user is on checkpoint 1 (`activeCP === 1`)
- Verify `first_checkpoint_pulse_shown` is not set

### Tutorial shows every time
- Check if localStorage is being cleared
- Verify `tutorial_completed` is being set properly
- Look for privacy mode or incognito browsing

---

## Contact

For questions or issues with the tutorial system, refer to the main project documentation or create an issue in the repository.