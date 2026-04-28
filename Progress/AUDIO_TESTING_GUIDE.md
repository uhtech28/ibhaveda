# 🔊 Audio Manager Testing Guide

Quick reference for testing all audio features in the Interactive Ideas world map.

---

## Quick Start

1. **Launch the app:**
   ```bash
   npm run dev
   ```

2. **Navigate to world map:**
   - Login via Clerk
   - Click "Continue Adventure" or create a new venture
   - You should be on `/map/world`

3. **Open browser console:**
   - Chrome/Edge: `F12` or `Ctrl+Shift+J`
   - Firefox: `F12` or `Ctrl+Shift+K`
   - Safari: `Cmd+Option+I`

4. **Look for initialization message:**
   ```
   [WorldMapScene] AudioManager initialized
   [AudioManager] Initialized
   ```

5. **Click anywhere on the map:**
   - This unlocks audio (browser autoplay policy)
   - Look for: `[AudioManager] Audio unlocked`

---

## Test 1: Stage Ambience

**What it does:** Plays looping background ambience based on current venture stage.

**How to trigger:**
- Load a venture (happens automatically on page load)
- Switch to a different venture with a different stage

**Expected console output:**
```
[WorldMapScene] Playing ambience for stage 1
[AudioManager] Playing ambience: village
[AudioManager] Warning: Audio file not found: /audio/ambience/village.mp3
```

**Stage-to-Biome mapping:**
- Stage 1 → Village
- Stage 2 → Forest
- Stage 3 → Arena
- Stage 4 → Artisan
- Stage 5 → Mine
- Stage 6 → Harbour
- Stage 7 → Crossroads
- Stage 8 → Capital

**Notes:**
- Ambience crossfades smoothly (3s transition)
- Only plays if stage changes
- Stops if you navigate away from map

---

## Test 2: Checkpoint Animation SFX

**What it does:** Plays a sound effect when a checkpoint completes and the animation plays.

**How to trigger:**

### Option A: Complete a checkpoint naturally
1. Navigate to an active checkpoint
2. Complete all 3 tasks
3. Return to world map
4. Animation + SFX should play automatically

### Option B: Trigger via event bridge (manual)
1. Open browser console
2. Run:
   ```javascript
   window.eventBridge.dispatchToPhaser({
     type: 'PLAY_CHECKPOINT_ANIMATION',
     checkpointId: 'your-checkpoint-id',
     stage: 1,
     variant: 'gold'  // or 'standard'
   })
   ```

**Expected console output:**
```
[WorldMapScene] Playing checkpoint SFX: seal_break_gold
[AudioManager] Playing SFX: seal_break_gold
[AudioManager] Warning: Audio file not found: /audio/sfx/seal_break_gold.mp3
```

**Animation type by stage:**
| Stage | Animation Type | SFX ID |
|-------|----------------|--------|
| 1 | Seal Break | `seal_break_standard` / `seal_break_gold` |
| 2 | Rune Inscription | `rune_inscription_standard` / `rune_inscription_gold` |
| 3 | Beacon Lighting | `beacon_lighting_standard` / `beacon_lighting_gold` |
| 4 | Bridge Repair | `bridge_repair_standard` / `bridge_repair_gold` |
| 5 | Compass Calibration | `compass_calibration_standard` / `compass_calibration_gold` |
| 6 | Ward Placement | `ward_placement_standard` / `ward_placement_gold` |
| 7 | Beacon Lighting | `beacon_lighting_standard` / `beacon_lighting_gold` |
| 8 | Seal Break | `seal_break_standard` / `seal_break_gold` |

**Notes:**
- `gold` variant plays if all 3 tasks completed
- `standard` variant plays if only some tasks completed
- SFX plays BEFORE animation starts

---

## Test 3: Level-Up Fanfare

**What it does:** Plays a celebratory sound when you level up.

**How to trigger:**

### Option A: Earn XP naturally
1. Complete checkpoints to gain XP
2. When you hit a level threshold, level-up triggers

### Option B: Award XP via Convex (manual)
1. Open browser console
2. Get your user ID:
   ```javascript
   // In the console, if authenticated
   document.cookie
   ```
3. Open Convex dashboard → Functions
4. Run a mutation to award XP (if available)

**Expected console output:**
```
[MapPage] Playing level-up audio: 4 → 5
[AudioManager] Playing SFX: level_up
[AudioManager] Warning: Audio file not found: /audio/sfx/level_up.mp3
```

**Visual cues:**
- `LevelUpSequence` component should animate
- Gold particles and level number display
- Phase transition effects at levels 7, 16, 29, 40

**Notes:**
- Audio plays concurrently with animation
- Only triggers on level INCREASE (not decrease)
- Uses `prevLevelRef` to detect changes

---

## Test 4: Badge Award SFX

**What it does:** Plays a rarity-specific sound when you earn a badge.

**How to trigger:**

### Via Convex Dashboard (Recommended)
1. Open Convex dashboard
2. Go to Functions → Mutations
3. Find `badges:awardVentureBadge`
4. Click "Run mutation"
5. Enter:
   ```json
   {
     "userId": "user_xxxxxxxxxxxxx",
     "badgeId": 1
   }
   ```
6. Click "Run"
7. Switch back to the world map tab

**Badge IDs by rarity:**
- Common: 1, 2, 3, 4, 5
- Uncommon: 6, 7, 8, 9, 10
- Rare: 11, 12, 13, 14
- Epic: 15, 16, 17, 18
- Legendary: 19, 20

**Expected console output:**
```
[MapPage] Playing badge SFX: First Light (common)
[AudioManager] Playing SFX: badge_common
[AudioManager] Warning: Audio file not found: /audio/sfx/badge_common.mp3
```

**Visual cues:**
- `BadgeAwardSequence` component should animate
- Badge icon and name display
- Rarity-specific particle effects
- Legendary badges have extra sparkle

**Notes:**
- Audio plays immediately (not waiting for animation)
- Deduplication prevents same badge from playing twice
- Queue system handles multiple badges sequentially

---

## Test 5: Volume Controls & Mute

**How to test:**

1. **Open HUD settings:**
   - Click the settings icon in HUD (if available)
   - Or access `audioManager` directly in console

2. **Test master volume:**
   ```javascript
   audioManager.setMasterVolume(0.5)  // 50%
   audioManager.setMasterVolume(1.0)  // 100%
   audioManager.setMasterVolume(0.0)  // Muted
   ```

3. **Test music volume:**
   ```javascript
   audioManager.setMusicVolume(0.3)  // 30%
   ```

4. **Test SFX volume:**
   ```javascript
   audioManager.setSFXVolume(0.8)  // 80%
   ```

5. **Test mute toggle:**
   ```javascript
   audioManager.toggleMute()  // Mutes all audio
   audioManager.toggleMute()  // Unmutes
   ```

6. **Check persistence:**
   - Change volumes
   - Refresh page
   - Volumes should be restored from localStorage

**Expected console output:**
```
[AudioManager] Master volume: 0.5
[AudioManager] Muted: true
```

---

## Troubleshooting

### No audio plays at all

**Possible causes:**
1. Audio files don't exist yet (expected - shows warnings)
2. Browser autoplay blocked → Click anywhere to unlock
3. Volume set to 0 or muted → Check `audioManager.getVolumes()`

**Check:**
```javascript
audioManager.getVolumes()
// Returns: { master: 1, music: 0.7, sfx: 1, ui: 1, muted: false }
```

### Console shows "Audio unlocked" but still no sound

**This is expected!** Audio files are pending delivery. The AudioManager will:
- Log warnings for missing files
- Continue working once files are added to `/public/audio/`
- NOT crash or break the game

### Animation plays but no SFX

**Check:**
1. Is `audioManager.playCheckpointSFX()` being called? (Check console)
2. Is SFX volume > 0?
3. Is master volume > 0?
4. Is audio unlocked?

### Multiple ambience tracks playing at once

**This shouldn't happen.** If it does:
1. Check for multiple `playAmbienceForStage()` calls
2. File a bug report with console logs

---

## Adding Real Audio Files

Once you receive audio assets:

1. **Create directory structure:**
   ```bash
   mkdir -p public/audio/ambience
   mkdir -p public/audio/sfx
   mkdir -p public/audio/music
   mkdir -p public/audio/ui
   ```

2. **Add files following naming convention:**
   ```
   public/
   └── audio/
       ├── ambience/
       │   ├── village.mp3
       │   ├── forest.mp3
       │   └── ... (8 total)
       ├── sfx/
       │   ├── seal_break_standard.mp3
       │   ├── seal_break_gold.mp3
       │   └── ... (18 total)
       └── music/
           ├── stage_1.mp3
           └── ... (11 total)
   ```

3. **Restart dev server:**
   ```bash
   # Stop with Ctrl+C
   npm run dev
   ```

4. **Test again:**
   - Warnings should disappear
   - Audio should play
   - Check browser network tab to confirm files load

---

## Advanced Testing

### Test crossfade between biomes

1. Switch between stages rapidly
2. Ambience should fade out/in smoothly (3s duration)
3. No audio glitches or pops

### Test audio on different browsers

- ✅ Chrome/Edge (best support)
- ✅ Firefox (good support)
- ✅ Safari (requires unlock, good support)
- ⚠️ Mobile browsers (may require user interaction)

### Test with slow network

1. Open DevTools → Network tab
2. Throttle to "Slow 3G"
3. Audio should still load (Howler.js handles streaming)

### Test memory usage

1. Open DevTools → Memory tab
2. Take heap snapshot
3. Play audio for 5+ minutes
4. Take another snapshot
5. Memory should stay stable (no leaks)

---

## Expected Behavior Summary

| Event | Audio | Duration | Notes |
|-------|-------|----------|-------|
| Stage change | Biome ambience | Looping | Crossfades smoothly |
| Checkpoint complete | Checkpoint SFX | 1-3s | Matches animation type |
| Level up | Fanfare | 2-3s | One-shot, celebratory |
| Badge earned | Rarity SFX | 0.5-2s | Varies by rarity |
| Button click | UI click | 50ms | Not yet wired |
| Boss encounter | Boss theme | Looping | Not yet wired |

---

## Console Commands Cheat Sheet

```javascript
// Check if AudioManager is initialized
audioManager.initialized

// Check if audio is unlocked
audioManager.unlocked

// Get current volumes
audioManager.getVolumes()

// Play specific ambience
audioManager.playAmbience('village')

// Play checkpoint SFX
audioManager.playCheckpointSFX('seal_break_gold')

// Play level-up
audioManager.playLevelUp()

// Play badge SFX
audioManager.playBadgeSFX('legendary')

// Stop all audio
audioManager.destroy()

// Trigger checkpoint animation manually
eventBridge.dispatchToPhaser({
  type: 'PLAY_CHECKPOINT_ANIMATION',
  checkpointId: 'cp_xxxxx',
  stage: 1,
  variant: 'gold'
})
```

---

## Questions?

- Check `AUDIO_INTEGRATION_COMPLETE.md` for implementation details
- Check browser console for detailed logs
- All audio events are logged with `[AudioManager]` prefix
- Missing files show warnings but don't break functionality

**Status:** ✅ Audio system fully wired and ready for assets!