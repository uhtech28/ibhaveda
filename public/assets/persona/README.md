# Persona Sprite Sheets

This directory contains sprite sheet assets for the Interactive Ideas persona/avatar system.

## Required Sprite Sheets

### Specifications
- **Native Size**: 32×48 pixels per frame
- **Render Scale**: 3× (96×144px) with nearest-neighbor filtering
- **Format**: PNG with transparency
- **Variants**: Male and Female

### Sprite Sheets Needed

#### 1. Male Idle Animation
**Filename**: `male_idle.png`
- **Dimensions**: 128×48px (4 frames × 32px width, 48px height)
- **Frame Count**: 4 frames
- **Frame Layout**: Horizontal strip (frames go left to right)
- **Animation**: Subtle breathing/hovering idle motion
- **Frame Duration**: ~200-300ms per frame

#### 2. Male Walk Animation
**Filename**: `male_walk.png`
- **Dimensions**: 192×48px (6 frames × 32px width, 48px height)
- **Frame Count**: 6 frames
- **Frame Layout**: Horizontal strip (frames go left to right)
- **Animation**: Full walk cycle (left foot forward → middle → right foot forward → middle)
- **Frame Duration**: ~100-150ms per frame

#### 3. Female Idle Animation
**Filename**: `female_idle.png`
- **Dimensions**: 128×48px (4 frames × 32px width, 48px height)
- **Frame Count**: 4 frames
- **Frame Layout**: Horizontal strip
- **Animation**: Subtle breathing/hovering idle motion
- **Frame Duration**: ~200-300ms per frame

#### 4. Female Walk Animation
**Filename**: `female_walk.png`
- **Dimensions**: 192×48px (6 frames × 32px width, 48px height)
- **Frame Count**: 6 frames
- **Frame Layout**: Horizontal strip
- **Animation**: Full walk cycle
- **Frame Duration**: ~100-150ms per frame

## Current Status

**Status**: ⚠️ PLACEHOLDER SPRITES IN USE

The system currently uses programmatically generated placeholder sprite sheets (colored rectangles with frame numbers). These are generated in `src/lib/phaser/utils/asset-loader.ts` via the `createPersonaSpriteSheets()` method.

### Placeholder Details
- Male sprites use BLUE frames
- Female sprites use PINK frames
- Each frame is labeled with its frame number for debugging
- Idle animations: 4 frames cycling
- Walk animations: 6 frames cycling

## Design Notes

### Character Design
- **Male Persona**: "The Founder" - Business casual with backpack
- **Female Persona**: "The Visionary" - Professional attire with accessories
- **Style**: Pixel art, retro game aesthetic
- **Perspective**: Side view or 3/4 view for walk animations
- **Shadow**: System automatically adds an elliptical shadow below the character

### Animation Guidelines
1. **Idle Animation**: Gentle up-down motion (breathing effect)
   - Frame 1: Neutral pose
   - Frame 2: Slightly raised
   - Frame 3: Peak height
   - Frame 4: Return to neutral
   
2. **Walk Animation**: Side-view walk cycle
   - Frame 1: Contact (foot touches ground)
   - Frame 2: Recoil (weight shifts)
   - Frame 3: Passing (legs cross)
   - Frame 4: High point (pushing off)
   - Frame 5: Contact (opposite foot)
   - Frame 6: Recoil (return to start)

## Integration

These sprite sheets are loaded in `src/lib/phaser/utils/asset-loader.ts` and used by `src/lib/phaser/entities/Persona.ts`.

The Persona class uses Phaser's animation system:
- `persona_male_idle` - Male idle animation (4 frames, looping)
- `persona_male_walk` - Male walk animation (6 frames, looping)
- `persona_female_idle` - Female idle animation (4 frames, looping)
- `persona_female_walk` - Female walk animation (6 frames, looping)

## Replacing Placeholders

When final sprite sheets are ready:
1. Add PNG files to this directory with the exact filenames above
2. Update `AssetLoader.preloadAssets()` to load the sprite sheets
3. Remove the `createPersonaSpriteSheets()` method from AssetLoader
4. Test animations in WorldMapScene

No code changes to Persona.ts should be needed - it will automatically use the new sprites.