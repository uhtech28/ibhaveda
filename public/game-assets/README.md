# Interactive Ideas — Game Assets

This directory contains all game assets for the Phaser 3 world map system.

## Directory Structure (Week 2+)

```
/game-assets/
├── sprites/
│   ├── personas/
│   │   ├── male/          # 32x48px sprite sheets
│   │   └── female/        # 32x48px sprite sheets
│   ├── checkpoints/        # 64x64px node states
│   └── bosses/             # Boss silhouettes and animations
├── backgrounds/
│   ├── venture/            # 8 biome backgrounds at 2048x512px
│   ├── academic/           # (V2)
│   ├── lab/                # (V2)
│   └── creative/           # (V2)
├── audio/
│   ├── ambience/           # Biome loops (MP3 + OGG)
│   ├── sfx/                # Checkpoint and UI sounds
│   └── music/              # Boss themes
└── particles/              # Particle effect sprites
```

## Current Status (Week 1)

**All textures are procedurally generated** via `AssetLoader.createAllTextures()` - no external image files needed yet.

### Checkpoint Textures (64×64)
- ✅ `cp_locked` - Dark grey circle with lock symbol
- ✅ `cp_active` - Bright blue pulsing circle with diamond
- ✅ `cp_in_progress` - Amber circle with flame
- ✅ `cp_completed` - Green circle with checkmark
- ✅ `cp_gold` - Gold circle with star

### Persona Textures (32×48, displayed at 96×144)
- ✅ `persona_male` - "The Founder" (purple/indigo outfit)
- ✅ `persona_female` - "The Visionary" (cyan/pink outfit)

Both personas feature genuine pixel art with:
- Idle float animation (±8px vertical, 1200ms)
- Drop shadow (48×14 ellipse)
- 3× nearest-neighbor scaling for sharp pixels

### Path & Particles
- ✅ `path_tile` - 32×32 road texture
- ✅ `particle_glow` - 8×8 glow particle

## Week 2 Asset Requirements

See `docs/weekly-implementation-plan.md` for the full asset delivery schedule.

**Needed by Day 8:**
- Male persona sprite sheet: idle (4 frames) + walk (6 frames)
- Female persona sprite sheet: idle (4 frames) + walk (6 frames)

**Needed by Day 10:**
- 8 venture biome backgrounds (2048×512px each)
- Boss silhouettes (3 Super Bosses at 256×256px)

**Format Requirements:**
- Sprites: PNG with transparency, nearest-neighbor scaling
- Backgrounds: PNG or WebP, optimized for web
- Audio: MP3 primary, OGG fallback

## Development Notes

The `AssetLoader` class in `src/lib/phaser/utils/asset-loader.ts` contains the full procedural drawing code. This serves as both the Week 1 implementation and the **art direction reference** for the design team.

Colors, proportions, and styling in the procedural code should match any external assets delivered in Week 2+.