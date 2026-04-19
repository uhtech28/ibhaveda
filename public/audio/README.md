# Audio Assets for Interactive Ideas

This directory contains all audio files for the Interactive Ideas game. The audio system uses [Howler.js](https://howlerjs.com/) for cross-browser compatibility and graceful fallback handling.

## 📁 Directory Structure

```
audio/
├── ambience/      # Looping background ambience for each biome (16 files)
├── sfx/           # One-shot sound effects for gameplay events (18 files)
├── ui/            # UI interaction sounds (4 files)
├── music/         # Stage and boss battle music tracks (11 files)
└── README.md      # This file
```

**Total: 49 audio files required**

---

## 🎵 Required Files by Category

### 1. Ambience (16 files)

Looping background audio for each biome. Each biome requires both `.mp3` and `.ogg` formats for browser compatibility.

**Format:** Loop-friendly (seamless loop), stereo, ~128kbps

| Biome | Files Required |
|-------|----------------|
| Village | `ambience/village.mp3`, `ambience/village.ogg` |
| Forest | `ambience/forest.mp3`, `ambience/forest.ogg` |
| Arena | `ambience/arena.mp3`, `ambience/arena.ogg` |
| Artisan | `ambience/artisan.mp3`, `ambience/artisan.ogg` |
| Mine | `ambience/mine.mp3`, `ambience/mine.ogg` |
| Harbour | `ambience/harbour.mp3`, `ambience/harbour.ogg` |
| Crossroads | `ambience/crossroads.mp3`, `ambience/crossroads.ogg` |
| Capital | `ambience/capital.mp3`, `ambience/capital.ogg` |

**Audio Direction:**
- **Village:** Gentle, pastoral, chirping birds, distant bells
- **Forest:** Dense nature sounds, rustling leaves, wind through trees
- **Arena:** Echoing space, distant crowd murmurs, tension
- **Artisan:** Workshop sounds, subtle hammering, forge ambience
- **Mine:** Cavernous echoes, dripping water, occasional pickaxe sounds
- **Harbour:** Ocean waves, seagulls, creaking wood
- **Crossroads:** Crosswinds, mystical hum, ethereal atmosphere
- **Capital:** Grand city ambience, distant footsteps, ceremonial bells

---

### 2. Sound Effects (18 files)

One-shot sound effects triggered by gameplay events.

**Format:** MP3, mono or stereo, 0.5–2 seconds duration, normalized volume

#### Checkpoint Completion SFX (12 files)
Each of the 6 checkpoint types has both a `standard` (2/3 tasks) and `gold` (3/3 tasks) variant.

| Checkpoint Type | Standard Variant | Gold Variant |
|----------------|------------------|--------------|
| Seal Break | `sfx/seal_break_standard.mp3` | `sfx/seal_break_gold.mp3` |
| Rune Inscription | `sfx/rune_inscription_standard.mp3` | `sfx/rune_inscription_gold.mp3` |
| Beacon Lighting | `sfx/beacon_lighting_standard.mp3` | `sfx/beacon_lighting_gold.mp3` |
| Bridge Repair | `sfx/bridge_repair_standard.mp3` | `sfx/bridge_repair_gold.mp3` |
| Compass Calibration | `sfx/compass_calibration_standard.mp3` | `sfx/compass_calibration_gold.mp3` |
| Ward Placement | `sfx/ward_placement_standard.mp3` | `sfx/ward_placement_gold.mp3` |

**Audio Direction (Standard vs Gold):**
- **Standard:** Satisfying completion sound, positive, clear
- **Gold:** Enhanced version of standard — more resonant, sparkle/chime layer, celebratory

#### Progression SFX (6 files)
Achievement and reward sounds.

| Event | File |
|-------|------|
| Level Up | `sfx/level_up.mp3` |
| Common Badge Earned | `sfx/badge_common.mp3` |
| Uncommon Badge Earned | `sfx/badge_uncommon.mp3` |
| Rare Badge Earned | `sfx/badge_rare.mp3` |
| Epic Badge Earned | `sfx/badge_epic.mp3` |
| Legendary Badge Earned | `sfx/badge_legendary.mp3` |

**Audio Direction (Badge Rarity):**
- **Common:** Simple chime
- **Uncommon:** Brighter chime with slight reverb
- **Rare:** Rich chord with shimmer
- **Epic:** Powerful fanfare element
- **Legendary:** Full orchestral stinger, most impressive

---

### 3. UI Sounds (4 files)

Subtle interface feedback sounds.

**Format:** MP3, mono, 0.1–0.5 seconds, quiet mix (for layering)

| Interaction | File | Description |
|-------------|------|-------------|
| Click | `ui/click.mp3` | General button/link click |
| Confirm | `ui/confirm.mp3` | Confirmation action (submit, save) |
| Error | `ui/error.mp3` | Validation error or blocked action |
| Hover | `ui/hover.mp3` | Mouse hover over interactive element |

**Audio Direction:**
- **Click:** Soft, neutral tap
- **Confirm:** Positive, slightly brighter than click
- **Error:** Brief, low-pitched "thud" or warning tone
- **Hover:** Very subtle whoosh or tone shift

---

### 4. Music (11 files)

Background music for boss battles and stage exploration.

**Format:** MP3, stereo, 128–192kbps, loop-friendly

#### Boss Battle Themes (3 files)

| Boss | File | Description |
|------|------|-------------|
| The Unraveller | `music/boss_unraveller.mp3` | Tense, rhythmic, chaotic energy |
| Pale Architect | `music/boss_pale_architect.mp3` | Cold, methodical, architectural |
| Gravemind | `music/boss_gravemind.mp3` | Dark, heavy, oppressive atmosphere |

#### Stage Themes (8 files)

Each stage has a unique musical theme tied to its biome.

| Stage | Biome | File |
|-------|-------|------|
| Stage 1 | Village | `music/stage_village.mp3` |
| Stage 2 | Forest | `music/stage_forest.mp3` |
| Stage 3 | Arena | `music/stage_arena.mp3` |
| Stage 4 | Artisan | `music/stage_artisan.mp3` |
| Stage 5 | Mine | `music/stage_mine.mp3` |
| Stage 6 | Harbour | `music/stage_harbour.mp3` |
| Stage 7 | Crossroads | `music/stage_crossroads.mp3` |
| Stage 8 | Capital | `music/stage_capital.mp3` |

**Audio Direction (Stage Progression):**
- **Stages 1–2:** Gentle, exploratory, inviting
- **Stages 3–5:** Building tension, adventure, complexity
- **Stages 6–7:** Mystical, ethereal, high stakes
- **Stage 8:** Grand, triumphant, climactic

---

## 🔧 Technical Specifications

### File Formats
- **Primary:** MP3 (broad browser support)
- **Fallback:** OGG Vorbis (only required for ambience tracks)

### Audio Quality Guidelines
- **Ambience:** 128kbps stereo, seamless loop (trim silence, crossfade)
- **Music:** 128–192kbps stereo, loop-friendly (may have intro/outro sections)
- **SFX:** 96–128kbps, mono or stereo, normalized to -3dB peak
- **UI:** 64–96kbps, mono, normalized to -6dB (subtle mix)

### Looping Requirements
All ambience and music files must loop seamlessly. Use:
- **DAW crossfade** at loop point
- **Trim exact sample boundaries** to match tempo/bars
- **No tail silence** (Howler.js handles loop timing)

### Volume Normalization
The audio manager applies runtime volume control, but files should be pre-normalized:
- **Music/Ambience:** Peak at -3dB to allow headroom for crossfades
- **SFX:** Peak at -3dB for consistency
- **UI:** Peak at -6dB to avoid overpowering other sounds

---

## 🎨 Audio Production Notes

### Current Status
**⚠️ 0 of 49 files delivered** — The `audioManager` is configured to handle missing files gracefully (no runtime errors), but the product is completely silent until assets are provided.

### Placeholder Workflow (Optional)
To test the audio system without final assets:

1. Generate silent MP3 files (any DAW or CLI tool):
   ```bash
   ffmpeg -f lavfi -i anullsrc=r=44100:cl=stereo -t 10 -q:a 2 silent_10s.mp3
   ```

2. Copy to all required paths (preserves file structure for testing)

3. Replace with real assets as they're produced

### Integration Points
The audio system is managed by `src/lib/audio/audioManager.ts`:
- Automatically loads from `/audio/*` paths
- Handles missing files (logs warning, continues silently)
- Supports crossfading between tracks
- Persists volume settings to localStorage
- Provides per-category volume control (master, music, sfx, ui)

### Asset Delivery Checklist
- [ ] 16 ambience files (8 biomes × 2 formats)
- [ ] 18 SFX files (12 checkpoint + 6 progression)
- [ ] 4 UI sound files
- [ ] 11 music files (3 boss + 8 stage)
- [ ] All files tested for seamless looping (where applicable)
- [ ] All files normalized per guidelines above
- [ ] Cross-browser playback verified (Chrome, Firefox, Safari)

---

## 📞 Questions?

If you're providing these assets and have questions about:
- Specific audio direction or mood
- Technical format requirements
- Loop timing or integration

Contact the development team or open an issue in the project repository.