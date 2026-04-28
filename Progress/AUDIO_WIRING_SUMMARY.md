# 🔊 Audio Manager Wiring - Complete

**Status:** ✅ All tasks complete  
**Files Modified:** 2  
**New Errors:** 0  
**Ready for:** Audio asset delivery  

---

## What Was Done

### ✅ Task 1: Initialize AudioManager on Game Start
**File:** `src/lib/phaser/scenes/WorldMapScene.ts`  
**Lines:** 7, 158-160, 234-235

- Added import for audioManager
- Called `init()` in `create()` method
- Called `unlock()` on first pointer interaction

### ✅ Task 2: Play Ambience on Stage Change
**File:** `src/lib/phaser/scenes/WorldMapScene.ts`  
**Lines:** 418-422

- Triggers in `handleSetActiveVenture()` when stage is set
- Plays biome-specific ambience based on stage (1-8)
- Crossfades smoothly between different biomes

### ✅ Task 3: Play Checkpoint SFX on Animation
**File:** `src/lib/phaser/scenes/WorldMapScene.ts`  
**Lines:** 1437-1439

- Triggers in `playCheckpointAnimation()` method
- Maps animation type + variant → SFX ID
- Example: `seal_break_gold`, `rune_inscription_standard`

### ✅ Task 4: Play Level-Up Sound
**File:** `src/app/map/world/page.tsx`  
**Lines:** 964-967

- **Already wired!** Just added debug logging
- Triggers when level increases
- Uses `prevLevelRef` to detect changes

### ✅ Task 5: Play Badge SFX
**File:** `src/app/map/world/page.tsx`  
**Lines:** 1043-1046

- **Already wired!** Just added debug logging
- Triggers on badge award events
- Plays rarity-specific SFX (common → legendary)

---

## How to Verify

1. **Start dev server:** `npm run dev`
2. **Open console:** F12
3. **Navigate to world map:** `/map/world`
4. **Click anywhere** to unlock audio
5. **Check for logs:**
   - `[WorldMapScene] AudioManager initialized`
   - `[AudioManager] Audio unlocked`
   - `[WorldMapScene] Playing ambience for stage X`

---

## Expected Console Output

```
[WorldMapScene] AudioManager initialized
[AudioManager] Initialized
[AudioManager] Audio unlocked (user interaction)
[WorldMapScene] Playing ambience for stage 1
[AudioManager] Playing ambience: village
[AudioManager] Warning: Audio file not found: /audio/ambience/village.mp3
```

**Note:** Warnings are expected until audio files are delivered.

---

## Audio Files Needed

Place in `/public/audio/`:

### Ambience (8 files)
- `ambience/village.mp3`
- `ambience/forest.mp3`
- `ambience/arena.mp3`
- `ambience/artisan.mp3`
- `ambience/mine.mp3`
- `ambience/harbour.mp3`
- `ambience/crossroads.mp3`
- `ambience/capital.mp3`

### Checkpoint SFX (12 files)
- `sfx/seal_break_standard.mp3`
- `sfx/seal_break_gold.mp3`
- `sfx/rune_inscription_standard.mp3`
- `sfx/rune_inscription_gold.mp3`
- `sfx/beacon_lighting_standard.mp3`
- `sfx/beacon_lighting_gold.mp3`
- `sfx/bridge_repair_standard.mp3`
- `sfx/bridge_repair_gold.mp3`
- `sfx/compass_calibration_standard.mp3`
- `sfx/compass_calibration_gold.mp3`
- `sfx/ward_placement_standard.mp3`
- `sfx/ward_placement_gold.mp3`

### Progression SFX (6 files)
- `sfx/level_up.mp3`
- `sfx/badge_common.mp3`
- `sfx/badge_uncommon.mp3`
- `sfx/badge_rare.mp3`
- `sfx/badge_epic.mp3`
- `sfx/badge_legendary.mp3`

---

## Key Features

✅ **Graceful degradation** - Missing files log warnings, don't crash  
✅ **Browser compliance** - Audio unlocks on first user interaction  
✅ **Debug logging** - All audio events logged to console  
✅ **Volume persistence** - Settings saved to localStorage  
✅ **Smooth crossfades** - 3-second transitions between ambience  
✅ **Deduplication** - Badge queue prevents duplicate plays  

---

## Testing Commands

```javascript
// In browser console:

// Play ambience manually
audioManager.playAmbience('village')

// Play checkpoint SFX
audioManager.playCheckpointSFX('seal_break_gold')

// Play level-up
audioManager.playLevelUp()

// Play badge SFX
audioManager.playBadgeSFX('legendary')

// Check volumes
audioManager.getVolumes()

// Mute all
audioManager.toggleMute()
```

---

## Files Modified

1. **`src/lib/phaser/scenes/WorldMapScene.ts`**
   - Import audioManager
   - Initialize in create()
   - Unlock on interaction
   - Play ambience on stage change
   - Play SFX on checkpoint animation

2. **`src/app/map/world/page.tsx`**
   - Add debug logs for level-up
   - Add debug logs for badges
   - (Audio calls were already present!)

---

## Next Steps

1. ✅ Audio system fully wired
2. ⏳ Waiting on audio asset delivery
3. 📦 Once delivered, drop files in `/public/audio/`
4. 🎵 Audio will work immediately—no code changes needed!

---

**See also:**
- `AUDIO_INTEGRATION_COMPLETE.md` - Detailed implementation docs
- `AUDIO_TESTING_GUIDE.md` - Step-by-step testing instructions