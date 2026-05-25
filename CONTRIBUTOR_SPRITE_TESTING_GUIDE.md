# Contributor Sprite System - Testing Guide

## Overview
This guide will help you verify that the dynamic contributor companion sprite system is working correctly in your application.

## Prerequisites
Before testing, ensure:
1. You have at least one venture/idea with **accepted contributors**
2. The venture is active and loaded in the map view
3. You're logged in and have proper authentication

---

## Testing Checklist

### ✅ Phase 1: Backend Data Verification

**Test 1.1: Check Accepted Contributors Query**
```typescript
// Open browser DevTools Console on the map page
// Run this to see the raw contributor data:
```

**Expected Result:**
- Should return an array of contributor objects with fields:
  - `userId`, `displayName`, `username`, `avatar`
  - `personaGender` (male/female)
  - `role` (owner/admin/moderator/contributor)
  - `level`, `xp`
  - `isOnline` (boolean - true if logged in within last 5 minutes)

**How to verify:**
1. Navigate to `/map/world` page
2. Open browser DevTools (F12)
3. Go to the "Network" tab
4. Filter by "convex"
5. Look for requests to `getAcceptedContributors`
6. Check the response payload

---

### ✅ Phase 2: React → Phaser Event Bridge

**Test 2.1: Verify Event Dispatch**

**Location:** `src/app/map/world/MapPageInner.tsx` (lines ~2165-2185)

**What to check:**
1. Open DevTools Console
2. Add a temporary console.log in the useEffect:

```typescript
useEffect(() => {
  if (!acceptedContributors || acceptedContributors.length === 0) return;
  
  console.log("🎮 Dispatching contributors to Phaser:", acceptedContributors);
  
  eventBridge.dispatchToPhaser({
    type: "UPDATE_CONTRIBUTORS",
    contributors: acceptedContributors,
  });
}, [acceptedContributors]);
```

**Expected Result:**
- Console should log the contributor array whenever it changes
- Should fire when the page loads and when contributors are accepted/removed

---

### ✅ Phase 3: Phaser Scene Reception

**Test 3.1: Verify Event Handler Registration**

**Location:** `src/lib/phaser/scenes/WorldMapScene.ts` (line ~5310)

**What to check:**
1. The `UPDATE_CONTRIBUTORS` event listener should be registered in `setupEventListeners()`
2. Add a temporary console.log in `handleUpdateContributors`:

```typescript
private handleUpdateContributors(event: { contributors: ContributorData[] }): void {
  console.log("🎨 Phaser received contributors:", event.contributors);
  // ... rest of the method
}
```

**Expected Result:**
- Console should show Phaser receiving the contributor data
- Should match the data dispatched from React

---

### ✅ Phase 4: Companion Sprite Creation

**Test 4.1: Verify Sprite Instantiation**

**What to check:**
1. Companions should appear as small pixel art sprites near the player character
2. Each companion should have:
   - Correct gender-based sprite (male/female persona)
   - Shadow ellipse underneath
   - Smooth idle animation

**Visual indicators:**
- Male sprites: Blue/cyan colored character
- Female sprites: Pink/magenta colored character
- All sprites should be scaled to 0.6x (smaller than main player)

**How to verify:**
1. Navigate to the map view
2. Look for small animated sprites following your main character
3. Count them - should match the number of accepted contributors

---

### ✅ Phase 5: Companion Movement & Following

**Test 5.1: Path Following Behavior**

**What to check:**
1. Move your main character around the map
2. Companions should follow in a "train" formation
3. Each companion maintains a fixed offset behind the previous one

**Expected Behavior:**
- Companion 1: Follows player at ~80px distance
- Companion 2: Follows companion 1 at ~80px distance
- Companion 3+: Continue the chain

**Movement characteristics:**
- Smooth LERP interpolation (not instant teleport)
- Companions should walk/run when moving
- Companions should face the direction they're moving
- Companions should idle when stationary

---

### ✅ Phase 6: Interactive Hover State

**Test 6.1: Hover Tooltip**

**What to check:**
1. Hover your mouse over a companion sprite
2. A tooltip should appear showing:
   - Display name
   - Username
   - Level
   - Role (with colored border)

**Visual indicators:**
- Tooltip has dark glassmorphic background
- Role colors:
  - Owner: Gold border
  - Admin: Purple border
  - Moderator: Sky blue border
  - Contributor: Teal border

**How to verify:**
1. Move mouse over each companion sprite
2. Tooltip should appear within 200ms
3. Tooltip should disappear when mouse leaves

---

### ✅ Phase 7: Click Interaction

**Test 7.1: Open Contributor Preview Dialog**

**What to check:**
1. Click on a companion sprite
2. Should open the `ContributorPreviewDialog` modal
3. Modal should display:
   - Contributor's avatar
   - Display name and username
   - Level and XP progress bar
   - Online/offline status indicator
   - Role badge with colored glow
   - Earned badges (if any)
   - "View Full Profile" link

**Expected Result:**
- Modal opens with smooth animation
- All data matches the clicked contributor
- Online status shows green ring if online, gray if offline
- XP bar shows correct progress percentage

**How to verify:**
1. Click each companion sprite
2. Verify the modal opens
3. Check that the data is correct
4. Close modal and try another companion

---

### ✅ Phase 8: Real-Time Updates

**Test 8.1: Dynamic Contributor Changes**

**What to check:**
1. Have another user accept a contribution request
2. The new companion should appear automatically
3. Have a contributor leave/be removed
4. Their companion sprite should disappear

**Expected Behavior:**
- New companions fade in smoothly
- Removed companions fade out and are destroyed
- Existing companions adjust their positions in the chain

**How to verify:**
1. Open two browser windows (different users)
2. Accept a contribution request in one window
3. Check if the companion appears in the other window
4. Reject/remove a contributor
5. Verify the sprite disappears

---

### ✅ Phase 9: Performance & Memory

**Test 9.1: No Memory Leaks**

**What to check:**
1. Open DevTools → Performance tab
2. Record for 30 seconds while moving around
3. Check for memory growth

**Expected Result:**
- Memory should remain stable
- No continuous growth
- Sprites should be properly destroyed when removed

**Test 9.2: Frame Rate**

**What to check:**
1. With 5+ companions, frame rate should remain stable
2. No stuttering or lag during movement

**Expected Result:**
- 60 FPS on desktop
- 30+ FPS on mobile

---

## Common Issues & Troubleshooting

### Issue 1: Companions Don't Appear
**Possible causes:**
- No accepted contributors in the venture
- Event bridge not dispatching
- Phaser scene not receiving events

**Debug steps:**
1. Check console for errors
2. Verify `getAcceptedContributors` returns data
3. Add console.logs to event handlers
4. Check if `handleUpdateContributors` is being called

---

### Issue 2: Companions Don't Follow Player
**Possible causes:**
- Update loop not running
- Persona position not available
- LERP calculation error

**Debug steps:**
1. Check if `update()` method is being called
2. Verify `this.persona` exists
3. Add console.log to companion update logic
4. Check companion `targetX` and `targetY` values

---

### Issue 3: Click Not Opening Modal
**Possible causes:**
- Event listener not registered
- React listener not set up
- Modal state not updating

**Debug steps:**
1. Check if `CONTRIBUTOR_SPRITE_CLICKED` event is dispatched
2. Verify React listener in `MapPageInner.tsx`
3. Check `clickedContributor` state
4. Verify `ContributorPreviewDialog` is rendered

---

### Issue 4: Wrong Sprite Gender/Appearance
**Possible causes:**
- `personaGender` field missing or incorrect
- Sprite sheet not loaded
- Animation not created

**Debug steps:**
1. Check contributor data has `personaGender` field
2. Verify sprite sheets are loaded in Phaser
3. Check if animations are created for both genders
4. Look for texture loading errors in console

---

## Quick Verification Script

Run this in the browser console on the map page:

```javascript
// Check if companions exist in Phaser scene
const scene = window.game?.scene?.scenes[0];
if (scene) {
  console.log("Companions Map:", scene.companions);
  console.log("Companion Count:", scene.companions?.size || 0);
  
  // List all companions
  scene.companions?.forEach((companion, key) => {
    console.log(`Companion ${key}:`, {
      name: companion.contributorData.displayName,
      position: { x: companion.x, y: companion.y },
      visible: companion.visible,
      active: companion.active
    });
  });
} else {
  console.error("Phaser scene not found");
}
```

---

## Success Criteria

The system is working correctly if:

✅ Accepted contributors appear as companion sprites  
✅ Companions follow the player in a train formation  
✅ Hover shows correct tooltip with contributor info  
✅ Click opens detailed preview modal  
✅ Real-time updates work (add/remove contributors)  
✅ No console errors or warnings  
✅ Performance remains smooth (60 FPS)  
✅ Memory usage is stable  

---

## Next Steps

If all tests pass:
1. Remove temporary console.logs
2. Test on different devices (mobile, tablet, desktop)
3. Test with varying numbers of contributors (1, 5, 10+)
4. Test edge cases (contributor goes offline, changes avatar, etc.)

If tests fail:
1. Review the error messages in console
2. Check the specific phase that failed
3. Follow the troubleshooting steps
4. Verify the code changes were applied correctly

---

## Additional Notes

- The system uses Convex real-time subscriptions, so updates should be instant
- Companion sprites are rendered in the Phaser `gameLayer` (depth 20)
- The preview dialog uses Convex queries for badges, so it requires authentication
- Online status is computed based on `lastLoginAt` timestamp (5-minute threshold)

---

**Happy Testing! 🎮✨**
