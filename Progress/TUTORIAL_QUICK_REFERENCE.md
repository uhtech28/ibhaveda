# Tutorial System - Quick Reference

## 📍 File Locations

```
src/components/map/
├── WelcomeOverlay.tsx          # 3s welcome screen
├── MapIntroOverlay.tsx         # 3-step tutorial
└── FirstCheckpointPulse.tsx    # Checkpoint indicator

src/app/map/
├── page.tsx                    # Tutorial flow control
└── world/page.tsx              # Pulse integration
```

## 🔑 LocalStorage Keys

```javascript
localStorage.getItem("tutorial_completed")              // "true" when done
localStorage.getItem("first_checkpoint_pulse_shown")    // "true" when dismissed
localStorage.getItem("selectedGender")                  // "male" | "female"
```

## 🎯 Component Props

### WelcomeOverlay
```typescript
<WelcomeOverlay
  ventureName={string}        // Venture name to display
  onComplete={() => void}     // Called after 3s or click
/>
```

### MapIntroOverlay
```typescript
<MapIntroOverlay
  onComplete={() => void}     // Called after step 3
/>
```

### FirstCheckpointPulse
```typescript
<FirstCheckpointPulse
  onCheckpointClick={() => void}  // Called when checkpoint clicked
/>
```

## 🔄 Tutorial Flow

```
/map (gender selection)
  → WelcomeOverlay (3s)
    → MapIntroOverlay (3 steps)
      → /map/stages
        → /map/world
          → FirstCheckpointPulse (until clicked)
```

## 🧪 Testing Commands

### Reset tutorial
```javascript
localStorage.removeItem("tutorial_completed");
localStorage.removeItem("first_checkpoint_pulse_shown");
location.reload();
```

### Check tutorial status
```javascript
console.log({
  tutorialCompleted: localStorage.getItem("tutorial_completed"),
  pulseShown: localStorage.getItem("first_checkpoint_pulse_shown"),
  gender: localStorage.getItem("selectedGender")
});
```

### Force tutorial complete
```javascript
localStorage.setItem("tutorial_completed", "true");
localStorage.setItem("first_checkpoint_pulse_shown", "true");
```

## ⚙️ Common Modifications

### Change welcome duration
**File:** `src/components/map/WelcomeOverlay.tsx:19`
```typescript
setTimeout(() => onComplete(), 3000); // Change 3000 to desired ms
```

### Add tutorial step
**File:** `src/components/map/MapIntroOverlay.tsx:13`
```typescript
const TUTORIAL_STEPS = [
  // ... existing steps
  {
    id: 4,
    title: "Your new step",
    description: "Description here",
    icon: YourIcon,
    highlight: "highlight-id",
  }
];
```

### Move pulse position
**File:** `src/components/map/FirstCheckpointPulse.tsx:84`
```typescript
style={{
  left: "50%",   // Horizontal
  top: "50%",    // Vertical
}}
```

## 🐛 Troubleshooting

### Tutorial shows every time
- Check if localStorage is disabled (private mode)
- Verify `tutorial_completed` is being set
- Check for localStorage.clear() calls

### Pulse doesn't appear
- Ensure `tutorial_completed === "true"`
- Verify user is on checkpoint 1 (`activeCP === 1`)
- Check `first_checkpoint_pulse_shown` is not set
- Confirm Phaser is ready (`phaserReady === true`)

### Tutorial stuck/won't advance
- Each component has skip button/click-to-skip
- Check browser console for errors
- Verify state management in `/map/page.tsx`

## 📊 State Management

### /map/page.tsx
```typescript
const [tutorialStep, setTutorialStep] = useState<TutorialStep>("gender");
// Values: "gender" | "welcome" | "map-intro" | "complete"
```

### /map/world/page.tsx
```typescript
const [showFirstCheckpointPulse, setShowFirstCheckpointPulse] = useState(false);
```

## 🎨 Z-Index Layers

```
60 - WelcomeOverlay (highest)
50 - MapIntroOverlay
40 - FirstCheckpointPulse
30 - Modal overlays
20 - HUD elements
10 - Map UI
0  - Phaser canvas (lowest)
```

## 📦 Dependencies

- **framer-motion** - Animations
- **lucide-react** - Icons
- **@/components/ui/button** - shadcn Button
- **@/components/ui/card** - shadcn Card

## 🚀 Quick Build Test

```bash
npm run build
# Should see: ✓ Compiled successfully
```

## 📞 Key Functions

### /map/page.tsx
```typescript
handleStart(gender)          // Gender selected → show tutorial or skip
handleWelcomeComplete()      // Welcome done → show map intro
handleMapIntroComplete()     // Tutorial done → navigate to stages
```

### /map/world/page.tsx
```typescript
useEffect()                  // Shows pulse if tutorial complete
handleClick()                // Hides pulse when checkpoint clicked
```

## 🔧 Animation Types

- **CSS Keyframes** - Pulse rings, float text (performance)
- **Framer Motion** - Entrance/exit, transitions (smooth)
- **Progress Bar** - Interval-based (WelcomeOverlay)

## 💡 Tips

1. Always test with cleared localStorage
2. Tutorial only shows once per browser
3. Skip buttons available on all components
4. Non-blocking - user can't get stuck
5. Responsive design - works on mobile/desktop

## 📖 Full Documentation

See `TUTORIAL_SYSTEM.md` for comprehensive documentation.