# Badge Animation Integration Test Plan

**Target:** World Map Badge Award System  
**Priority:** P0 - Critical  
**Test Type:** Integration & Manual QA  
**Estimated Time:** 30-45 minutes

---

## Overview

This test plan validates that badge award animations trigger correctly for both:
1. **Legacy system** - `userBadges` table (already working)
2. **Venture system** - `ventureBadges` table (newly fixed)

---

## Prerequisites

### Environment Setup
- [ ] Dev environment running with Convex backend
- [ ] User account created and authenticated
- [ ] Access to Convex dashboard for manual mutations
- [ ] Browser console open (check for errors)
- [ ] Audio enabled (to test SFX)

### Required User Data
- Your User ID: `___________________________`
- Current venture created: `[ ] Yes [ ] No`

---

## Test Suite 1: Venture Badge System (NEW FIX)

### Test 1.1: Single Venture Badge Award
**Goal:** Verify basic venture badge animation triggers

**Steps:**
1. Navigate to world map (`/map`)
2. Open Convex dashboard
3. Run mutation:
   ```javascript
   api.badges.awardVentureBadge({
     userId: "<your-user-id>",
     badgeId: 1  // "First Light"
   })
   ```
4. Switch back to map page

**Expected Results:**
- ✅ Badge animation overlay appears within 1-2 seconds
- ✅ Shows badge name: "First Light"
- ✅ Shows tagline: "Every great fire begins with a single flame."
- ✅ Audio SFX plays (common rarity)
- ✅ Animation completes and dismisses
- ✅ No console errors

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: `_________________`

---

### Test 1.2: Multiple Venture Badges Sequential
**Goal:** Verify badge queue displays badges one at a time

**Steps:**
1. Stay on map page
2. In Convex dashboard, run mutations rapidly (within 5 seconds):
   ```javascript
   api.badges.awardVentureBadge({ userId: "<id>", badgeId: 6 })  // The Seedling
   api.badges.awardVentureBadge({ userId: "<id>", badgeId: 9 })  // First Checkpoint
   api.badges.awardVentureBadge({ userId: "<id>", badgeId: 10 }) // Gilded
   ```

**Expected Results:**
- ✅ First badge appears immediately
- ✅ User can dismiss or wait for auto-dismiss
- ✅ Second badge appears after first completes
- ✅ Third badge appears after second completes
- ✅ All three badges show in sequence (not overlapping)
- ✅ Audio plays for each badge

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: `_________________`

---

### Test 1.3: Deduplication
**Goal:** Verify same badge doesn't animate twice

**Steps:**
1. Award a new badge:
   ```javascript
   api.badges.awardVentureBadge({ userId: "<id>", badgeId: 11 })
   ```
2. Wait for animation to complete
3. Award the SAME badge again:
   ```javascript
   api.badges.awardVentureBadge({ userId: "<id>", badgeId: 11 })
   ```

**Expected Results:**
- ✅ First award: Animation appears
- ✅ Second award: NO animation (already owned)
- ✅ Check Convex dashboard - badge only exists once in `ventureBadges` table
- ✅ No console errors

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: `_________________`

---

### Test 1.4: Hidden Badges Filtered
**Goal:** Verify hidden badges don't show animation

**Steps:**
1. Find a hidden badge in `BADGE_DEFINITIONS` (rarity: "hidden")
   - Example: Check `convex/ventureConstants.ts` for badges with `rarity: "hidden"`
2. Award the hidden badge:
   ```javascript
   api.badges.awardVentureBadge({ userId: "<id>", badgeId: <hidden-badge-id> })
   ```

**Expected Results:**
- ✅ NO animation appears
- ✅ Badge exists in database (check Convex dashboard)
- ✅ Badge marked with `isHidden: true`
- ✅ No console errors

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: `_________________`

---

### Test 1.5: Rarity Audio Variation
**Goal:** Verify different rarities play different SFX

**Steps:**
1. Award badges of different rarities:
   ```javascript
   // Common
   api.badges.awardVentureBadge({ userId: "<id>", badgeId: 1 })
   
   // Uncommon
   api.badges.awardVentureBadge({ userId: "<id>", badgeId: 6 })
   
   // Rare
   api.badges.awardVentureBadge({ userId: "<id>", badgeId: 13 })
   
   // Epic
   api.badges.awardVentureBadge({ userId: "<id>", badgeId: 15 })
   
   // Legendary
   api.badges.awardVentureBadge({ userId: "<id>", badgeId: 19 })
   ```

**Expected Results:**
- ✅ Each rarity plays distinct audio SFX
- ✅ Higher rarities have more impressive sounds
- ✅ Audio doesn't overlap or glitch

**Actual Results:**
- Common: `__________________`
- Uncommon: `__________________`
- Rare: `__________________`
- Epic: `__________________`
- Legendary: `__________________`

**Overall:** [ ] PASS [ ] FAIL

---

### Test 1.6: Cron Job Awards
**Goal:** Verify weekly cron awards trigger animations

**Steps:**
1. Ensure user qualifies for auto-awards (check `convex/crons.ts` conditions)
2. Manually trigger cron:
   ```javascript
   api.crons.weeklyBadgeEvaluation()
   ```
3. Return to map page

**Expected Results:**
- ✅ Any newly awarded badges animate
- ✅ Badges awarded by cron appear in queue
- ✅ No duplicates if user already owns badges

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: `_________________`

---

## Test Suite 2: Legacy Badge System (REGRESSION)

### Test 2.1: Old System Still Works
**Goal:** Ensure fix didn't break existing badge system

**Steps:**
1. Trigger old badge system check:
   ```javascript
   api.badges.checkBadges({ userId: "<your-user-id>" })
   ```

**Expected Results:**
- ✅ Any qualifying old badges trigger animations
- ✅ Animation style matches venture badges
- ✅ No console errors

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: `_________________`

---

## Test Suite 3: Edge Cases

### Test 3.1: Page Refresh During Animation
**Steps:**
1. Award badge
2. While animation is playing, refresh the page (F5)

**Expected Results:**
- ✅ Page reloads cleanly
- ✅ Animation does NOT replay (badge already counted)
- ✅ No console errors

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: `_________________`

---

### Test 3.2: Award While On Different Page
**Steps:**
1. Navigate to home page or profile (NOT map)
2. Award a badge via Convex dashboard
3. Navigate back to map page

**Expected Results:**
- ✅ No animation on map (acceptable - missed it)
- ✅ Badge exists in database
- ✅ No console errors
- ⚠️ Future enhancement: Could show "missed badges" notification

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: `_________________`

---

### Test 3.3: Rapid Badge Spam (Stress Test)
**Steps:**
1. Award 10 badges simultaneously:
   ```javascript
   for (let i = 1; i <= 10; i++) {
     api.badges.awardVentureBadge({ userId: "<id>", badgeId: i })
   }
   ```

**Expected Results:**
- ✅ All 10 badges queue up
- ✅ Display one at a time in sequence
- ✅ No UI freezing or lag
- ✅ All animations complete
- ⚠️ May take 30-60 seconds to show all

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: `_________________`

---

### Test 3.4: Missing Badge Definition
**Steps:**
1. Award a badge ID that doesn't exist in `BADGE_DEFINITIONS`:
   ```javascript
   api.badges.awardVentureBadge({ userId: "<id>", badgeId: 999 })
   ```

**Expected Results:**
- ❌ Mutation fails with error (expected - invalid badge ID)
- OR
- ✅ Badge awarded but NO animation (filtered by `!b.definition`)
- ✅ No console errors or crashes

**Actual Results:**
- [ ] PASS
- [ ] FAIL - Reason: `_________________`

---

## Test Suite 4: Visual & UX Validation

### Test 4.1: Animation Quality
**Checklist:**
- [ ] Badge icon/description renders clearly
- [ ] Text is readable
- [ ] Colors match rarity theme
- [ ] Animation is smooth (60 FPS)
- [ ] No flickering or visual glitches
- [ ] Dismiss button is visible and clickable

---

### Test 4.2: Responsive Design
**Test on multiple viewport sizes:**

**Desktop (1920x1080):**
- [ ] Animation centered correctly
- [ ] Overlay covers full screen
- [ ] Text readable

**Tablet (768x1024):**
- [ ] Animation scales appropriately
- [ ] No overflow or clipping

**Mobile (375x667):**
- [ ] Animation fits on screen
- [ ] Touch dismissal works

---

### Test 4.3: Accessibility
**Checklist:**
- [ ] Keyboard navigation works (ESC to dismiss)
- [ ] Focus trap on modal (can't tab to background)
- [ ] Screen reader announces badge name
- [ ] Color contrast sufficient for text
- [ ] Animation respects `prefers-reduced-motion`

---

## Performance Benchmarks

### Metrics to Monitor
1. **Time to Animation:** < 2 seconds from badge award
2. **FPS During Animation:** > 50 FPS
3. **Memory Usage:** No memory leaks after 10+ badges
4. **Network Requests:** Only Convex subscription updates

**Tools:**
- Chrome DevTools Performance tab
- Network tab (throttle to Fast 3G)
- Memory profiler

**Results:**
- Time to Animation: `________ seconds`
- FPS: `________ fps`
- Memory Leak: [ ] None [ ] Detected
- Network Overhead: `________ requests`

---

## Browser Compatibility

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

**Issues Found:**
`_____________________________________________`

---

## Console Error Check

**During all tests, monitor console for:**
- ❌ TypeScript errors
- ❌ React warnings
- ❌ Convex subscription errors
- ❌ Audio playback failures
- ❌ Animation frame drops

**Errors Found:**
`_____________________________________________`

---

## Sign-Off

### Test Results Summary

| Test Suite | Pass Rate | Critical Failures |
|------------|-----------|-------------------|
| Venture Badge System | ___/6 | _____________ |
| Legacy System Regression | ___/1 | _____________ |
| Edge Cases | ___/4 | _____________ |
| Visual & UX | ___/3 | _____________ |
| **TOTAL** | **___/14** | |

### Overall Status
- [ ] ✅ **PASS** - All tests passed, ready for production
- [ ] ⚠️ **PASS WITH NOTES** - Minor issues, deploy with monitoring
- [ ] ❌ **FAIL** - Critical issues, DO NOT DEPLOY

### Tester Information
- **Tester Name:** `_____________________`
- **Date:** `_____________________`
- **Environment:** `_____________________`
- **Build/Commit:** `_____________________`

### Notes & Observations
```
_____________________________________________
_____________________________________________
_____________________________________________
```

### Blocker Issues (if any)
```
_____________________________________________
_____________________________________________
```

### Recommended Actions
- [ ] Deploy to production
- [ ] Deploy to staging for extended testing
- [ ] Return to development
- [ ] File bug tickets for issues

---

## Appendix: Useful Badge IDs

Quick reference for testing:

| ID | Name | Rarity | Category | Use Case |
|----|------|--------|----------|----------|
| 1 | First Light | Common | Onboarding | Basic test |
| 6 | The Seedling | Uncommon | Onboarding | First idea badge |
| 9 | The First Checkpoint | Common | Milestones | Progress badge |
| 10 | Gilded | Uncommon | Milestones | Gold checkpoint |
| 15 | The Full Circle | Epic | Milestones | Full lifecycle |
| 19 | The Phoenix | Legendary | Aspirational | Rare achievement |

**Full list:** See `convex/ventureConstants.ts` → `BADGE_DEFINITIONS`

---

## Rollback Plan

If critical issues found:

1. **Immediate:** Disable badge animations via feature flag (if available)
2. **Short-term:** Revert `src/app/map/page.tsx` to previous commit
3. **Long-term:** Fix issues and re-test

**Rollback Command:**
```bash
git revert <commit-hash>
git push origin main
```

---

**End of Test Plan**