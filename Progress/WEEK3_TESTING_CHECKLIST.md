# Week 3 Testing Checklist & Validation Guide

**Purpose:** Comprehensive testing guide for Week 3 Animations & HUD System  
**Target:** QA Engineers, Developers, Product Managers  
**Status:** Ready for Testing  
**Last Updated:** 2024

---

## 📋 Quick Reference

- **Total Test Cases:** 150+
- **Critical Path Tests:** 35
- **Performance Benchmarks:** 8
- **Accessibility Tests:** 12
- **Responsive Tests:** 15

---

## 🎬 Checkpoint Animations Testing (6 Patterns × 2 Variants = 12 Tests)

### **1. Seal Break Animation (S1, S8)**

#### Standard Variant (Blue)
- [ ] Animation plays at checkpoint location
- [ ] Seal appears with scale animation (0 → 1)
- [ ] 8 rune lines fade in sequentially
- [ ] Crack pattern spreads from center
- [ ] Particle explosion occurs on shatter
- [ ] Seal fades out smoothly
- [ ] Total duration is ~2 seconds
- [ ] Color scheme is blue (#3B82F6, #60A5FA)
- [ ] No visual glitches or artifacts

#### Gold Variant (Amber)
- [ ] Color scheme is gold (#F59E0B, #FEF08A)
- [ ] Total duration is ~3 seconds
- [ ] All other animations match standard variant
- [ ] Gold particles have correct color

#### Skip Functionality
- [ ] Not skippable for first 500ms
- [ ] Skippable after 500ms via ESC key
- [ ] Skippable after 500ms via click
- [ ] Skip triggers onSkip callback
- [ ] Animation cleans up properly on skip
- [ ] No memory leaks after skip

#### Completion
- [ ] onComplete callback fires after duration
- [ ] Animation container is destroyed
- [ ] No orphaned game objects remain
- [ ] FPS remains stable (55-60 FPS)

---

### **2. Rune Inscription Animation (S2)**

#### Standard Variant
- [ ] Compass base appears with scale animation
- [ ] Triangle rune shape draws correctly
- [ ] Inner circle appears
- [ ] 8 runic symbols (ᚠ, ᚢ, ᚦ, ᚨ, ᚱ, ᚲ, ᚷ, ᚹ) appear sequentially
- [ ] Glow ring pulses correctly
- [ ] Activation wave expands outward
- [ ] Duration is ~2 seconds
- [ ] Purple/blue color scheme (#8B5CF6)

#### Gold Variant
- [ ] Gold color scheme (#F59E0B)
- [ ] Duration is ~3 seconds
- [ ] Enhanced glow effect visible

#### Skip & Completion
- [ ] Skip works after 500ms
- [ ] Completion callback fires
- [ ] Proper cleanup occurs

---

### **3. Beacon Lighting Animation (S3, S7)**

#### Standard Variant
- [ ] Beacon pillar rises from bottom
- [ ] Light beam shoots upward
- [ ] 12 radial light rays rotate
- [ ] Light rays pulse with intensity
- [ ] Flame particles rise continuously
- [ ] Flame flicker effect is realistic
- [ ] Duration is ~2 seconds

#### Gold Variant
- [ ] Gold flame colors
- [ ] Enhanced beam brightness
- [ ] Duration is ~3 seconds

#### Skip & Completion
- [ ] Skip functionality works
- [ ] Particles stop on completion
- [ ] No lingering particle emitters

---

### **4. Bridge Repair Animation (S4)**

#### Standard Variant
- [ ] Bridge base appears semi-transparent
- [ ] 6 planks appear sequentially (left to right)
- [ ] Each plank scales in with spring effect
- [ ] Rope attachments appear after plank
- [ ] Wavy rope animation is smooth
- [ ] Bridge completion bounce
- [ ] Duration is ~2 seconds
- [ ] Wooden texture colors correct

#### Gold Variant
- [ ] Gold accents on planks
- [ ] Enhanced rope glow
- [ ] Duration is ~3 seconds

---

### **5. Compass Calibration Animation (S5)**

#### Standard Variant
- [ ] Compass base scales in
- [ ] Cardinal points (N, E, S, W) appear sequentially
- [ ] North point is red (#FF4444)
- [ ] Other points are white
- [ ] Needle appears in center
- [ ] Needle spins 4 full rotations
- [ ] Indicator ring pulses during spin
- [ ] Needle locks to North at end
- [ ] Duration is ~2 seconds

#### Gold Variant
- [ ] Gold compass rim
- [ ] Enhanced glow during calibration
- [ ] Duration is ~3 seconds

---

### **6. Ward Placement Animation (S6)**

#### Standard Variant
- [ ] Ward base appears
- [ ] 3 concentric protection circles expand
- [ ] 6 rune icons appear around perimeter
- [ ] Shield graphic forms in center
- [ ] Protection circles pulse
- [ ] Ward completion effect
- [ ] Duration is ~2 seconds

#### Gold Variant
- [ ] Gold shield color
- [ ] Enhanced protection glow
- [ ] Duration is ~3 seconds

---

## 🎯 HUD System Testing (8 Components)

### **1. HUD Container**

#### Visibility
- [ ] HUD visible by default on map page
- [ ] HUD respects hudVisibleAtom state
- [ ] HUD animates in on mount (slide down)
- [ ] HUD animates out when hidden
- [ ] Background blur effect is present
- [ ] Border gradient is visible

#### Layout
- [ ] Desktop: Horizontal layout, all components visible
- [ ] Tablet: Compressed layout, some components hidden
- [ ] Mobile: Collapsed by default with expand button
- [ ] Components are properly aligned
- [ ] Spacing is consistent (gap-4)
- [ ] No layout shift on resize

#### Responsive Behavior
- [ ] Collapse/expand button appears on mobile
- [ ] Clicking button toggles hudExpandedAtom
- [ ] Smooth transition between states
- [ ] Active venture badge shows when present
- [ ] Mentor crown badge shows at level 40+

---

### **2. XPBar Component**

#### Display
- [ ] Shows current XP / max XP in text
- [ ] Progress bar fills to correct percentage
- [ ] Gradient colors: #6366F1 → #8B5CF6
- [ ] Text uses monospace font
- [ ] Bar has rounded corners

#### Animation
- [ ] Progress bar animates smoothly on XP change
- [ ] Spring physics feel natural (no jank)
- [ ] Bar doesn't overflow container
- [ ] Multiple rapid updates don't cause issues

#### Edge Cases
- [ ] Handles 0 XP correctly
- [ ] Handles max XP (100%) correctly
- [ ] Handles XP > max (overflow) gracefully

---

### **3. LevelDisplay Component**

#### Display
- [ ] Level number displays correctly
- [ ] Phase icon shows based on phase (Shield/Zap/Star)
- [ ] Phase 1: Blue (#3B82F6), Shield icon
- [ ] Phase 2: Purple (#8B5CF6), Zap icon
- [ ] Phase 3: Amber (#F59E0B), Star icon
- [ ] Gradient background on level box
- [ ] Border is visible

#### Interaction
- [ ] Hover scales component to 1.05
- [ ] Scale animation is smooth
- [ ] No layout shift on hover

---

### **4. StageInfo Component**

#### Display
- [ ] Stage icon (emoji) displays at correct size
- [ ] Stage name displays correctly
- [ ] Biome name displays in muted color
- [ ] Card has gradient background
- [ ] Glassmorphism effect is visible

#### Updates
- [ ] Updates when stageInfoAtom changes
- [ ] Entrance animation plays on mount
- [ ] No flicker on update

---

### **5. CheckpointProgress Component**

#### Display
- [ ] Completed/Total counter is accurate
- [ ] Flag icon is visible
- [ ] Completed number is bold white
- [ ] Total number is muted gray
- [ ] Progress bar shows correct percentage
- [ ] Bar has purple gradient

#### Gold Medals
- [ ] Gold medal badge appears when goldCount > 0
- [ ] Medal icon is visible
- [ ] Gold count number is correct
- [ ] Badge has gold gradient background
- [ ] Border has gold accent

#### Responsive
- [ ] Progress bar hidden on mobile
- [ ] Counter remains visible on mobile

---

### **6. StreakCounter Component**

#### Display
- [ ] Flame icon is visible
- [ ] Streak number displays correctly
- [ ] "day" vs "days" pluralization works
- [ ] Orange gradient background
- [ ] Border has orange accent

#### Animation
- [ ] Flame icon breathes (scale 1 → 1.2 → 1)
- [ ] Animation loops infinitely
- [ ] Hover scales entire component
- [ ] No performance impact from animation

---

### **7. QualityScore Component**

#### Display
- [ ] Quality score (0-12) displays
- [ ] Valuation score displays with $ icon
- [ ] TrendingUp icon visible
- [ ] DollarSign icon visible
- [ ] Numbers use correct font weight

#### Tier Colors
- [ ] Score 0-4: Gray theme
- [ ] Score 5-8: Blue theme
- [ ] Score 9-12: Emerald theme
- [ ] Tier label shows correctly
- [ ] Background color matches tier

#### Updates
- [ ] Updates when qualityScoreAtom changes
- [ ] Updates when valuationScoreAtom changes
- [ ] Tier transition is smooth

---

### **8. AudioControls Component**

#### Display
- [ ] Volume icon shows correct state (mute/low/high)
- [ ] Muted state shows VolumeX icon
- [ ] Volume < 50% shows Volume1 icon
- [ ] Volume >= 50% shows Volume2 icon
- [ ] Volume bar displays on desktop
- [ ] Volume percentage is accurate

#### Interaction
- [ ] Clicking button toggles mute
- [ ] Muted overlay appears when muted
- [ ] Volume bar fills to correct percentage
- [ ] Hover effect works
- [ ] Button press animation works

#### State Management
- [ ] audioSettingsAtom updates correctly
- [ ] Mute state persists
- [ ] Volume level persists

---

## 🎉 Progression Animations Testing

### **1. LevelUpSequence**

#### Animation Flow
- [ ] Fade-in background (0ms)
- [ ] Burst effect appears (300ms)
- [ ] Level card rotates in 3D (500ms)
- [ ] Level number appears (800ms)
- [ ] Skip button activates after 500ms
- [ ] Auto-dismiss after 2000ms

#### Display
- [ ] Background is dark with blur
- [ ] Burst effect is purple glow
- [ ] Level card has 3D layered effect
- [ ] Level number is large and bold
- [ ] "Level Up!" text is visible
- [ ] Skip button is disabled for 500ms

#### Phase Transition
- [ ] Phase icon appears when isPhaseTransition=true
- [ ] Phase name appears (Apprentice/Journeyer/Master)
- [ ] Phase text: "Phase X Unlocked!"
- [ ] Additional animation delay for phase

#### Skip
- [ ] ESC key skips after 500ms
- [ ] Click skips after 500ms
- [ ] onSkip callback fires
- [ ] Animation cleans up properly

#### Completion
- [ ] onComplete fires after 2s
- [ ] Modal dismisses smoothly
- [ ] No memory leaks

---

### **2. BadgeAwardSequence**

#### Animation Flow
- [ ] White flash (0ms)
- [ ] Flash fade-out (100ms)
- [ ] Badge materialize with rotation (200ms)
- [ ] Badge reveal animation (800ms)
- [ ] Auto-dismiss after 4s (non-legendary)

#### Display
- [ ] Background is dark with blur
- [ ] Badge card shows correct emoji icon
- [ ] Badge name displays
- [ ] Badge description displays
- [ ] Rarity label shows

#### Rarity Colors
- [ ] Common: Gray (#6B7280)
- [ ] Uncommon: Green (#10B981)
- [ ] Rare: Blue (#3B82F6)
- [ ] Epic: Purple (#8B5CF6)
- [ ] Legendary: Gold (#F59E0B)

#### Legendary Badges
- [ ] Particle burst appears (50 particles)
- [ ] Rotating dashed border animates
- [ ] Modal is persistent (no auto-dismiss)
- [ ] "Claim Reward" button appears
- [ ] Enhanced glow effect

#### Non-Legendary Badges
- [ ] Auto-dismiss after 4s
- [ ] "Dismiss" button appears
- [ ] "View Badge" button appears
- [ ] Click either button dismisses

#### Skip
- [ ] Click outside modal skips (non-legendary)
- [ ] Legendary requires button click
- [ ] onSkip callback fires

---

### **3. CheckpointAnimationOverlay**

#### Display
- [ ] Dark backdrop with blur
- [ ] Spinning loader ring (blue or gold)
- [ ] Animation type label displays
- [ ] Gold badge shows for gold variant
- [ ] Close button (X) in top-right
- [ ] Animation label at bottom

#### Integration
- [ ] Correctly wraps Phaser animations
- [ ] Phaser animation plays in background
- [ ] Auto-dismiss after 3s
- [ ] Close button dismisses immediately
- [ ] onComplete callback fires
- [ ] onSkip callback fires on close

---

## 🔧 State Management Testing

### **Jotai Atoms**

#### hudVisibleAtom
- [ ] Default value is true
- [ ] Updates trigger HUD visibility change
- [ ] Persists across component re-renders

#### hudExpandedAtom
- [ ] Default value is true
- [ ] Updates trigger mobile HUD expand/collapse
- [ ] Only affects mobile layout

#### userProgressAtom
- [ ] Contains all required fields (level, phase, xp, etc.)
- [ ] Updates trigger dependent component re-renders
- [ ] XP overflow handled correctly
- [ ] Level-up detected properly

#### activeVentureAtom
- [ ] Stores venture data correctly
- [ ] Updates trigger HUD venture badge
- [ ] Null state handled gracefully

#### audioSettingsAtom
- [ ] All volume settings stored
- [ ] Mute state toggles correctly
- [ ] Updates trigger AudioControls re-render

#### stageInfoAtom
- [ ] Stage name, icon, biome stored
- [ ] Updates trigger StageInfo re-render

#### checkpointProgressAtom
- [ ] Completed, total, goldCount tracked
- [ ] Updates trigger CheckpointProgress re-render
- [ ] Percentage calculated correctly

---

## ⚡ Performance Testing

### **FPS Benchmarks**

- [ ] Map page idle: 58-60 FPS
- [ ] Checkpoint animation playing: 55-60 FPS
- [ ] Level-up animation playing: 55-60 FPS
- [ ] Badge award animation: 55-60 FPS
- [ ] Multiple animations queued: 50-60 FPS
- [ ] HUD updates (rapid): 55-60 FPS

### **Memory Usage**

- [ ] No memory leaks on animation completion
- [ ] No memory leaks on component unmount
- [ ] Phaser objects properly destroyed
- [ ] React components properly cleaned up
- [ ] Event listeners removed on unmount

### **Bundle Size**

- [ ] HUD components: ~8 KB gzipped
- [ ] Animations: ~7 KB gzipped
- [ ] Total Week 3 impact: ~15 KB gzipped

### **Load Time**

- [ ] HUD renders in <100ms
- [ ] Animations load dynamically (code-splitting)
- [ ] No blocking on initial page load

---

## ♿ Accessibility Testing

### **Keyboard Navigation**

- [ ] ESC key skips animations
- [ ] Tab key navigates HUD components
- [ ] Enter/Space activate buttons
- [ ] Focus indicators visible
- [ ] Focus trap in modals

### **Screen Reader**

- [ ] HUD components have aria-labels
- [ ] Animation status announced
- [ ] Button roles correct
- [ ] Heading hierarchy correct

### **Contrast**

- [ ] Text meets WCAG AA (4.5:1)
- [ ] Icons meet WCAG AA (3:1)
- [ ] Hover states visible

### **Motion**

- [ ] Respect prefers-reduced-motion
- [ ] Disable auto-play if preferred
- [ ] Provide skip option

---

## 📱 Responsive Design Testing

### **Desktop (≥1024px)**

- [ ] All HUD components visible
- [ ] Horizontal layout
- [ ] No overflow
- [ ] Hover effects work
- [ ] Animations centered

### **Tablet (768px - 1023px)**

- [ ] Compressed HUD layout
- [ ] Some components hidden
- [ ] Touch targets 44px minimum
- [ ] Animations scaled appropriately

### **Mobile (<768px)**

- [ ] HUD collapsed by default
- [ ] Expand/collapse button visible
- [ ] Stacked vertical layout when expanded
- [ ] Touch targets adequate
- [ ] Animations scaled for screen

### **Orientation**

- [ ] Portrait mode works
- [ ] Landscape mode works
- [ ] Rotation handled gracefully

---

## 🔗 Integration Testing

### **Phaser ↔ React Communication**

- [ ] Event bridge forwards checkpoint clicks
- [ ] Event bridge receives state updates
- [ ] No event listener leaks
- [ ] Bidirectional communication works

### **Convex ↔ Jotai Sync**

- [ ] Convex data syncs to atoms
- [ ] Atom updates trigger mutations
- [ ] Real-time updates work
- [ ] Optimistic updates handled

### **Animation Chaining**

- [ ] Checkpoint → Level-Up chain works
- [ ] Level-Up → Badge chain works
- [ ] Multiple animations queue correctly
- [ ] No animation conflicts

---

## 🐛 Edge Cases & Error Handling

### **Missing Data**

- [ ] Missing venture data handled
- [ ] Missing checkpoint data handled
- [ ] Undefined XP/level handled
- [ ] Null badge handled

### **Rapid Actions**

- [ ] Rapid XP updates don't break UI
- [ ] Multiple quick animations handled
- [ ] Spam clicking doesn't crash

### **Network Issues**

- [ ] Offline mode graceful
- [ ] Slow network doesn't freeze
- [ ] Failed mutations retry

### **Browser Compatibility**

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Chrome
- [ ] Mobile Safari

---

## ✅ Acceptance Criteria

### **Critical Path (Must Pass)**

- [x] All 6 checkpoint animation patterns work
- [x] Standard and gold variants render correctly
- [x] HUD displays on map page
- [x] All HUD components show accurate data
- [x] Level-up animation triggers on level change
- [x] Badge award animation displays correctly
- [x] Animations are skippable after 500ms
- [x] No console errors
- [x] No TypeScript errors
- [x] 60 FPS maintained

### **High Priority (Should Pass)**

- [ ] Responsive design works on all screen sizes
- [ ] Keyboard navigation works
- [ ] State management is performant
- [ ] Animations clean up properly
- [ ] Event listeners removed on unmount

### **Medium Priority (Nice to Have)**

- [ ] Accessibility features complete
- [ ] Prefers-reduced-motion respected
- [ ] Analytics events fired
- [ ] Error boundaries catch issues

---

## 📊 Test Results Summary

**Date:** _____________  
**Tester:** _____________  
**Environment:** _____________

| Category | Total | Passed | Failed | Skipped |
|----------|-------|--------|--------|---------|
| Checkpoint Animations | 54 | ___ | ___ | ___ |
| HUD Components | 45 | ___ | ___ | ___ |
| Progression Animations | 25 | ___ | ___ | ___ |
| State Management | 10 | ___ | ___ | ___ |
| Performance | 8 | ___ | ___ | ___ |
| Accessibility | 12 | ___ | ___ | ___ |
| Responsive | 15 | ___ | ___ | ___ |
| Integration | 10 | ___ | ___ | ___ |
| **TOTAL** | **179** | ___ | ___ | ___ |

**Pass Rate:** ____%  
**Status:** ⬜ PASS | ⬜ FAIL | ⬜ NEEDS WORK

---

## 🚨 Known Issues

| ID | Issue | Severity | Status | Notes |
|----|-------|----------|--------|-------|
| 1  |       |          |        |       |
| 2  |       |          |        |       |
| 3  |       |          |        |       |

---

## 📝 Notes

_Add any additional observations, performance notes, or suggestions here._

---

**Testing Complete:** ⬜  
**Approved By:** _____________  
**Date:** _____________  
**Sign-off:** _____________