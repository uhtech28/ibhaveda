# 🔊 Audio Events Quick Reference

One-page cheat sheet for all audio triggers in Interactive Ideas.

---

## 🎮 Game Events (Phaser)

| Event | Trigger | Audio Call | File |
|-------|---------|------------|------|
| **Game Start** | Scene created | `audioManager.init()` | N/A |
| **First Click** | User interaction | `audioManager.unlock()` | N/A |
| **Stage Change** | Venture loaded | `audioManager.playAmbienceForStage(stage)` | `ambience/{biome}.mp3` |
| **Checkpoint Complete** | Animation plays | `audioManager.playCheckpointSFX(sfxId)` | `sfx/{type}_{variant}.mp3` |

---

## 🎯 React Events (UI)

| Event | Trigger | Audio Call | File |
|-------|---------|------------|------|
| **Level Up** | XP threshold reached | `audioManager.playLevelUp()` | `sfx/level_up.mp3` |
| **Badge Earned** | Award mutation fired | `audioManager.playBadgeSFX(rarity)` | `sfx/badge_{rarity}.mp3` |

---

## 📍 Where Audio Calls Happen

### WorldMapScene.ts (Phaser)
```typescript
create() {
  audioManager.init()           // Line 158
  audioManager.unlock()          // Line 234 (on click)
}

handleSetActiveVenture() {
  audioManager.playAmbienceForStage(stage)  // Line 418
}

playCheckpointAnimation() {
  audioManager.playCheckpointSFX(sfxId)     // Line 1438
}
```

### page.tsx (React)
```typescript
// Level-up detection (Line 964)
useEffect(() => {
  if (level > prevLevel) {
    audioManager.playLevelUp()
  }
}, [level])

// Badge event listener (Line 1043)
useEffect(() => {
  const handleBadge = (event) => {
    audioManager.playBadgeSFX(event.rarity)
  }
  eventBridge.onReact("BADGE_AWARDED", handleBadge)
}, [])
```

---

## 🎵 Audio File Mapping

### Ambience (Looping)
```
Stage 1 → village.mp3
Stage 2 → forest.mp3
Stage 3 → arena.mp3
Stage 4 → artisan.mp3
Stage 5 → mine.mp3
Stage 6 → harbour.mp3
Stage 7 → crossroads.mp3
Stage 8 → capital.mp3
```

### Checkpoint SFX (One-shot)
```
Stage 1,8 → seal_break_{standard|gold}.mp3
Stage 2   → rune_inscription_{standard|gold}.mp3
Stage 3,7 → beacon_lighting_{standard|gold}.mp3
Stage 4   → bridge_repair_{standard|gold}.mp3
Stage 5   → compass_calibration_{standard|gold}.mp3
Stage 6   → ward_placement_{standard|gold}.mp3
```

### Progression SFX (One-shot)
```
Level up → level_up.mp3
Badge    → badge_{common|uncommon|rare|epic|legendary}.mp3
```

---

## 🧪 Testing in Console

```javascript
// Check status
audioManager.initialized  // true/false
audioManager.unlocked     // true/false
audioManager.getVolumes() // { master: 1, music: 0.7, sfx: 1, ui: 1, muted: false }

// Play manually
audioManager.playAmbience('village')
audioManager.playCheckpointSFX('seal_break_gold')
audioManager.playLevelUp()
audioManager.playBadgeSFX('legendary')

// Volume controls
audioManager.setMasterVolume(0.5)
audioManager.setSFXVolume(0.8)
audioManager.toggleMute()

// Trigger events manually
eventBridge.dispatchToPhaser({
  type: 'PLAY_CHECKPOINT_ANIMATION',
  checkpointId: 'cp_xxxxx',
  stage: 1,
  variant: 'gold'
})
```

---

## 📊 Expected Console Logs

```
[WorldMapScene] AudioManager initialized
[AudioManager] Initialized
[AudioManager] Audio unlocked (user interaction)
[WorldMapScene] Playing ambience for stage 1
[AudioManager] Playing ambience: village
[WorldMapScene] Playing checkpoint SFX: seal_break_gold
[AudioManager] Playing SFX: seal_break_gold
[MapPage] Playing level-up audio: 4 → 5
[AudioManager] Playing SFX: level_up
[MapPage] Playing badge SFX: First Light (common)
[AudioManager] Playing SFX: badge_common
```

---

## ⚠️ Troubleshooting

| Issue | Solution |
|-------|----------|
| No logs appear | Check console filter, ensure not set to "Errors only" |
| "Audio file not found" | Expected! Files pending delivery |
| "Autoplay blocked" | Click anywhere to unlock audio |
| No sound plays | Check volumes with `audioManager.getVolumes()` |
| Multiple ambience playing | Should auto-stop previous, file bug if happens |

---

## 📦 Required Audio Assets

**Total:** 26 files (8 ambience + 12 checkpoint + 6 progression)

Place in `/public/audio/`:
- `ambience/` → 8 files
- `sfx/` → 18 files

See `AUDIO_INTEGRATION_COMPLETE.md` for full file list.

---

**Status:** ✅ All audio wiring complete  
**Last Updated:** January 2025