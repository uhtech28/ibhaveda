// /**
//  * asset-loader.ts
//  *
//  * Programmatic Phaser texture creation for Ibhaveda — Week 1.
//  *
//  * All game textures are painted at runtime via Phaser's Graphics API so that
//  * zero external image files are required during Week 1 development.
//  *
//  * Call `AssetLoader.createAllTextures(scene)` from your Scene's `create()`
//  * method before any sprites are instantiated.
//  *
//  * ─── Texture registry ────────────────────────────────────────────────────────
//  *  Checkpoints : cp_locked | cp_active | cp_in_progress | cp_completed | cp_gold
//  *  Personas    : persona_male | persona_female   (32×48 px pixel art)
//  *  Tiles       : path_tile                       (32×32 px)
//  *  Particles   : particle_glow                   (16×16 px)
//  * ─────────────────────────────────────────────────────────────────────────────
//  */

// import * as Phaser from "phaser";
// import { BiomeTextureCreator } from "./biome-textures";
// import { AdventureCheckpointCreator } from "./adventure-checkpoints";

// // ─────────────────────────────────────────────────────────────────────────────
// // Module-level draw helpers
// // ─────────────────────────────────────────────────────────────────────────────

// /**
//  * Fill a solid rectangular block on a Graphics object.
//  * @param gfx   Target Graphics instance.
//  * @param color 24-bit packed RGB integer, e.g. `0xFF0000`.
//  * @param x     Left edge (pixels).
//  * @param y     Top edge (pixels).
//  * @param w     Width in pixels.
//  * @param h     Height in pixels.
//  * @param alpha Optional opacity, 0–1. Default `1`.
//  */
// function B(
//   gfx: Phaser.GameObjects.Graphics,
//   color: number,
//   x: number,
//   y: number,
//   w: number,
//   h: number,
//   alpha = 1,
// ): void {
//   gfx.fillStyle(color, alpha);
//   gfx.fillRect(x, y, w, h);
// }

// /**
//  * Fill a single 1×1 pixel on a Graphics object.
//  * @param gfx   Target Graphics instance.
//  * @param color 24-bit packed RGB integer.
//  * @param x     Column (pixel).
//  * @param y     Row (pixel).
//  */
// function P(
//   gfx: Phaser.GameObjects.Graphics,
//   color: number,
//   x: number,
//   y: number,
// ): void {
//   gfx.fillStyle(color, 1);
//   gfx.fillRect(x, y, 1, 1);
// }

// /**
//  * Compute the vertices of an N-pointed star polygon.
//  *
//  * Returns alternating outer-radius / inner-radius vertices, starting at
//  * the 12-o'clock position (−90° from the positive X axis).
//  *
//  * @param cx      Centre X.
//  * @param cy      Centre Y.
//  * @param points  Number of star points (e.g. 5 for a standard star).
//  * @param outerR  Outer (tip) radius.
//  * @param innerR  Inner (valley) radius.
//  */
// function starPolygon(
//   cx: number,
//   cy: number,
//   points: number,
//   outerR: number,
//   innerR: number,
// ): { x: number; y: number }[] {
//   const verts: { x: number; y: number }[] = [];
//   const total = points * 2;
//   for (let i = 0; i < total; i++) {
//     const r = i % 2 === 0 ? outerR : innerR;
//     const angle = (i * Math.PI) / points - Math.PI / 2;
//     verts.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
//   }
//   return verts;
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // AssetLoader
// // ─────────────────────────────────────────────────────────────────────────────

// /**
//  * Static factory that generates all programmatic Phaser textures.
//  *
//  * @example
//  * // In your Scene's create():
//  * AssetLoader.createAllTextures(this);
//  */
// export class AssetLoader {
//   // ── Public API ─────────────────────────────────────────────────────────────

//   /**
//    * Creates every texture group in one call.
//    * Safe to call multiple times — existing textures will be overwritten.
//    */
//   static createAllTextures(scene: Phaser.Scene): void {
//     AssetLoader.createCheckpointTextures(scene);
//     AssetLoader.createPersonaTextures(scene);
//     AssetLoader.createPersonaSpriteSheets(scene);
//     AssetLoader.createPathTextures(scene);
//     AssetLoader.createParticleTextures(scene);
//     AssetLoader.createDecorationTextures(scene);
//     AssetLoader.createBiomeTiles(scene);
//     AssetLoader.createAdventureCheckpointTextures(scene);
//     AssetLoader.createEnemyTextures(scene);
//   }

//   /**
//    * Preloads external image assets that cannot be generated procedurally
//    */
//   static preloadAssets(scene: Phaser.Scene): void {
//     scene.load.image("skeld_floor", "/assets/skeld/floor.png");
//     scene.load.image("guide_male", "/assets/skeld/guide_male.png");
//     scene.load.image("guide_female", "/assets/skeld/guide_female.png");

//     // Keys for sprite sheets that may not exist on disk.
//     // If Phaser fails to load them we remove the broken texture entry so that
//     // createPersonaSpriteSheets() can generate procedural placeholders instead.
//     const optionalSheetKeys = new Set([
//       "persona_male_idle_sheet",
//       "persona_male_walk_sheet",
//       "persona_female_idle_sheet",
//       "persona_female_walk_sheet",
//     ]);

//     // Silence the browser 404 by intercepting Phaser's loaderror event.
//     const onLoadError = (file: { key: string }) => {
//       if (optionalSheetKeys.has(file.key)) {
//         // Remove the broken __MISSING texture so the placeholder generator runs
//         if (scene.textures.exists(file.key)) {
//           scene.textures.remove(file.key);
//         }
//       }
//     };
//     scene.load.on("loaderror", onLoadError);
//     // Clean up listener once loading finishes
//     scene.load.once("complete", () => {
//       scene.load.off("loaderror", onLoadError);
//     });

//     // Try to load persona sprite sheets (will fall back to placeholders on 404)
//     scene.load.spritesheet(
//       "persona_male_idle_sheet",
//       "/assets/persona/male_idle.png",
//       {
//         frameWidth: 32,
//         frameHeight: 48,
//       },
//     );
//     scene.load.spritesheet(
//       "persona_male_walk_sheet",
//       "/assets/persona/male_walk.png",
//       {
//         frameWidth: 32,
//         frameHeight: 48,
//       },
//     );
//     scene.load.spritesheet(
//       "persona_female_idle_sheet",
//       "/assets/persona/female_idle.png",
//       {
//         frameWidth: 32,
//         frameHeight: 48,
//       },
//     );
//     scene.load.spritesheet(
//       "persona_female_walk_sheet",
//       "/assets/persona/female_walk.png",
//       {
//         frameWidth: 32,
//         frameHeight: 48,
//       },
//     );
//   }

//   // ── Persona sprite sheets ─────────────────────────────────────────────────


//   /**
//    * Creates five 80×80 checkpoint node textures (pirate island glossy buttons):
//    * `cp_locked` | `cp_active` | `cp_in_progress` | `cp_completed` | `cp_gold`
//    */
//   static createCheckpointTextures(scene: Phaser.Scene): void {
//     AssetLoader.createLockedTexture(scene);
//     AssetLoader.createActiveTexture(scene);
//     AssetLoader.createInProgressTexture(scene);
//     AssetLoader.createCompletedTexture(scene);
//     AssetLoader.createGoldTexture(scene);
//   }

//   // ── Shared helper: draw a glossy circular button ──────────────────────────

//   /**
//    * Draw a pirate-style glossy circular button on `gfx`.
//    * @param gfx         Graphics object
//    * @param size        Canvas size (button is centred in it)
//    * @param bodyColor   Main fill colour for the button body
//    * @param rimColor    Outer rim / border colour
//    * @param glowColor   Optional outer glow (0 = skip)
//    * @param glowAlpha   Alpha for the outer glow
//    */
//   private static drawGlossyButton(
//     gfx: Phaser.GameObjects.Graphics,
//     size: number,
//     bodyColor: number,
//     rimColor: number,
//     glowColor: number = 0,
//     glowAlpha: number = 0,
//   ): void {
//     const cx = size / 2;
//     const cy = size / 2;
//     const outerR = size * 0.42;
//     const innerR = outerR - 4;

//     // Optional outer glow
//     if (glowColor && glowAlpha > 0) {
//       gfx.fillStyle(glowColor, glowAlpha);
//       gfx.fillCircle(cx, cy, outerR + 10);
//     }

//     // Dark drop shadow
//     gfx.fillStyle(0x000000, 0.5);
//     gfx.fillCircle(cx + 3, cy + 5, outerR);

//     // Thick white / coloured rim
//     gfx.lineStyle(5, rimColor, 1);
//     gfx.strokeCircle(cx, cy, outerR);

//     // Body (inside rim)
//     gfx.fillStyle(bodyColor, 1);
//     gfx.fillCircle(cx, cy, innerR);

//     // Lower dark band (gives 3-D depth)
//     const darkBodyColor = Phaser.Display.Color.IntegerToColor(bodyColor);
//     darkBodyColor.darken(25);
//     gfx.fillStyle(darkBodyColor.color, 1);
//     gfx.beginPath();
//     gfx.arc(cx, cy, innerR, 0, Math.PI, false); // bottom half
//     gfx.fillPath();

//     // Top glossy highlight semicircle
//     gfx.fillStyle(0xffffff, 0.38);
//     gfx.beginPath();
//     gfx.arc(cx, cy - 4, innerR * 0.7, Math.PI, 0, false);
//     gfx.fillPath();

//     // Small bright specular highlight (top-left sparkle)
//     gfx.fillStyle(0xffffff, 0.65);
//     gfx.fillCircle(cx - innerR * 0.3, cy - innerR * 0.4, innerR * 0.14);
//   }

//   // ── Checkpoint: cp_locked ──────────────────────────────────────────────────

//   /**
//    * **cp_locked** — 80×80
//    * Dim grey glossy button
//    */
//   private static createLockedTexture(scene: Phaser.Scene): void {
//     const gfx = scene.add.graphics();
//     const size = 80;
//     AssetLoader.drawGlossyButton(gfx, size, 0x64748b, 0xb0bec5);
//     gfx.generateTexture("cp_locked", size, size);
//     gfx.destroy();
//   }

//   /**
//    * **cp_active** — 80×80
//    * Shiny Crimson Button — current target, pulsing
//    */
//   private static createActiveTexture(scene: Phaser.Scene): void {
//     const gfx = scene.add.graphics();
//     const size = 80;
//     AssetLoader.drawGlossyButton(gfx, size, 0xe8003d, 0xffffff, 0xff4081, 0.35);
//     gfx.generateTexture("cp_active", size, size);
//     gfx.destroy();
//   }

//   /**
//    * **cp_in_progress** — 80×80
//    * Amber orange button
//    */
//   private static createInProgressTexture(scene: Phaser.Scene): void {
//     const gfx = scene.add.graphics();
//     const size = 80;
//     AssetLoader.drawGlossyButton(gfx, size, 0xf59e0b, 0xffffff, 0xfcd34d, 0.2);
//     gfx.generateTexture("cp_in_progress", size, size);
//     gfx.destroy();
//   }

//   /**
//    * **cp_completed** — 80×80
//    * Deep red button with gold rim
//    */
//   private static createCompletedTexture(scene: Phaser.Scene): void {
//     const gfx = scene.add.graphics();
//     const size = 80;
//     AssetLoader.drawGlossyButton(gfx, size, 0xc2003a, 0xffd700);
//     gfx.generateTexture("cp_completed", size, size);
//     gfx.destroy();
//   }

//   /**
//    * **cp_gold** — 80×80
//    * Radiant Gold Button
//    */
//   private static createGoldTexture(scene: Phaser.Scene): void {
//     const gfx = scene.add.graphics();
//     const size = 80;
//     AssetLoader.drawGlossyButton(gfx, size, 0xfbc02d, 0xffffff, 0xffd700, 0.45);
//     gfx.generateTexture("cp_gold", size, size);
//     gfx.destroy();
//   }

//   /**
//    * Draw a star shape at specified position
//    */
//   private static drawStar(
//     g: Phaser.GameObjects.Graphics,
//     x: number,
//     y: number,
//     points: number,
//     outer: number,
//     inner: number,
//     color: number,
//   ): void {
//     g.fillStyle(color, 1);
//     g.beginPath();
//     for (let i = 0; i < points * 2; i++) {
//       const radius = i % 2 === 0 ? outer : inner;
//       const angle = (i * Math.PI) / points - Math.PI / 2;
//       const px = x + Math.cos(angle) * radius;
//       const py = y + Math.sin(angle) * radius;
//       if (i === 0) g.moveTo(px, py);
//       else g.lineTo(px, py);
//     }
//     g.closePath();
//     g.fillPath();
//   }

//   /**
//    * Draw a crown shape at specified position
//    */
//   private static drawCrown(
//     g: Phaser.GameObjects.Graphics,
//     x: number,
//     y: number,
//     color: number,
//   ): void {
//     g.fillStyle(color, 1);
//     g.fillTriangle(x - 8, y, x - 6, y - 8, x - 4, y);
//     g.fillTriangle(x - 2, y, x, y - 10, x + 2, y);
//     g.fillTriangle(x + 4, y, x + 6, y - 8, x + 8, y);
//     g.fillRect(x - 10, y, 20, 4);
//   }

//   // ── Persona textures ───────────────────────────────────────────────────────

//   /**
//    * Creates two 32×48 pixel-art persona sprites:
//    * - `persona_male`   — "The Founder" (purple/indigo theme)
//    * - `persona_female` — "The Visionary" (cyan/pink theme)
//    *
//    * Intended to be rendered at 3× scale → 96×144 display pixels.
//    */
//   static createPersonaTextures(scene: Phaser.Scene): void {
//     // Note: Persona textures are now loaded from external files via preloadAssets()
//     // but we keep these as fallbacks or for legacy support if needed.
//     // However, the main Persona class will now prefer the loaded images.

//     // Male ─────────────────────────────────────────────────────────────────
//     if (!scene.textures.exists("persona_male_pixel")) {
//       const gfx = scene.add.graphics();
//       AssetLoader.drawMalePersona(gfx);
//       gfx.generateTexture("persona_male_pixel", 32, 48);
//       gfx.destroy();
//     }

//     // Female ───────────────────────────────────────────────────────────────
//     if (!scene.textures.exists("persona_female_pixel")) {
//       const gfx = scene.add.graphics();
//       AssetLoader.drawFemalePersona(gfx);
//       gfx.generateTexture("persona_female_pixel", 32, 48);
//       gfx.destroy();
//     }
//   }

//   // ── Persona: Male "The Founder" ────────────────────────────────────────────

//   /**
//    * Paints the male "Founder" pixel-art sprite onto `gfx` at origin (0, 0).
//    *
//    * Layout (32 × 48 px):
//    * ```
//    * Rows  0– 6  Hair
//    * Rows  4–14  Head / face  (overlaps hair bottom)
//    * Rows 15–25  Shirt        (purple)
//    * Rows 26–28  Belt + buckle
//    * Rows 29–40  Pants        (dark navy)
//    * Rows 41–47  Boots        (brown)
//    * ```
//    *
//    * All drawing is done with `fillRect` (block fills for large areas,
//    * single-pixel calls for fine details such as eye shine and mouth).
//    */
//   private static drawMalePersona(gfx: Phaser.GameObjects.Graphics): void {
//     // ── Palette ─────────────────────────────────────────────────────────────
//     const HAIR = 0x1e1b4b; // dark indigo
//     const HAIR_HL = 0x4f46e5; // side-part highlight
//     const SKIN = 0xffdcab;
//     const SKIN_SH = 0xd4a373; // face shadow / ear / nose
//     const EYE = 0x111827; // dark iris
//     const EYE_SH = 0xf8fafc; // eye shine pixel
//     const SHIRT = 0x7c3aed; // purple
//     const SHIRT_SH = 0x5b21b6; // shirt depth shadow
//     const SHIRT_DT = 0xc4b5fd; // shirt shoulder highlight
//     const BELT = 0x78350f; // dark brown
//     const BUCKLE = 0xf59e0b; // gold
//     const PANTS = 0x1e1b4b; // dark navy
//     const PANTS_HL = 0x3730a3; // knee highlight
//     const BOOT = 0x92400e; // warm brown
//     const SOLE = 0x451a03; // very dark brown
//     const OUTLINE = 0x0a0a14; // near-black

//     // ── Hair (rows 0–6) ─────────────────────────────────────────────────────
//     // Main hair block — slightly wider than the face
//     B(gfx, HAIR, 8, 0, 16, 7); // x 8..23, y 0..6
//     // Side-part highlight (left-of-centre stripe, rows 0–4)
//     B(gfx, HAIR_HL, 12, 0, 3, 5);

//     // ── Head / face (rows 4–14) ─────────────────────────────────────────────
//     // Face skin — overwrites the bottom 3 rows of the hair block in the centre
//     B(gfx, SKIN, 9, 4, 14, 11); // x 9..22, y 4..14
//     // Shadow on the cheek sides
//     B(gfx, SKIN_SH, 9, 8, 2, 6); // left cheek shadow
//     B(gfx, SKIN_SH, 21, 8, 2, 6); // right cheek shadow
//     // Premium shading: Add a jawline shadow
//     B(gfx, SKIN_SH, 11, 14, 10, 1);
//     // Ears (1 px outside face, sits at hair-bottom level)
//     B(gfx, SKIN_SH, 8, 7, 1, 4); // left ear
//     B(gfx, SKIN_SH, 23, 7, 1, 4); // right ear

//     // ── Eyes (rows 7–8) ─────────────────────────────────────────────────────
//     B(gfx, EYE, 11, 7, 2, 2); // left eye
//     B(gfx, EYE, 19, 7, 2, 2); // right eye
//     P(gfx, EYE_SH, 12, 7); // left shine  (top-right corner of eye)
//     P(gfx, EYE_SH, 20, 7); // right shine

//     // ── Nose + mouth ────────────────────────────────────────────────────────
//     P(gfx, SKIN_SH, 16, 10); // nose tip (single shadow pixel)
//     B(gfx, SKIN_SH, 14, 12, 4, 1); // mouth line

//     // ── Neck (rows 15–16) ───────────────────────────────────────────────────
//     B(gfx, SKIN, 13, 15, 6, 2);

//     // ── Shirt (rows 15–25) ──────────────────────────────────────────────────
//     B(gfx, SHIRT_DT, 7, 15, 18, 1); // shoulder highlight stripe (top)
//     B(gfx, SHIRT, 7, 16, 18, 10); // main shirt body  x 7..24, y 16..25
//     B(gfx, SHIRT_SH, 7, 16, 3, 10); // left depth shadow
//     B(gfx, SHIRT_SH, 22, 16, 3, 10); // right depth shadow
//     // Premium accessory: Founder's Cross-body Satchel Strap
//     gfx.lineStyle(2, BELT, 0.6);
//     gfx.strokeLineShape(new Phaser.Geom.Line(7, 15, 24, 25));
//     // Arms (extend 2 px beyond shirt body at mid-height)
//     B(gfx, SHIRT_SH, 5, 17, 2, 9); // left arm
//     B(gfx, SHIRT_SH, 25, 17, 2, 9); // right arm
//     // White collar V-shape (two pixels per side, spreading downward)
//     P(gfx, 0xffffff, 15, 16);
//     P(gfx, 0xffffff, 16, 16);
//     P(gfx, 0xffffff, 14, 17);
//     P(gfx, 0xffffff, 17, 17);

//     // ── Belt (rows 26–28) ───────────────────────────────────────────────────
//     B(gfx, BELT, 7, 26, 18, 3); // belt body
//     B(gfx, BUCKLE, 14, 26, 4, 3); // centre gold buckle

//     // ── Pants / legs (rows 29–40) ───────────────────────────────────────────
//     B(gfx, PANTS, 8, 29, 7, 12); // left leg   x  8..14
//     B(gfx, PANTS, 17, 29, 7, 12); // right leg  x 17..23
//     B(gfx, OUTLINE, 15, 29, 2, 12); // inner-leg gap / deep shadow
//     // Knee highlights
//     B(gfx, PANTS_HL, 11, 35, 2, 3); // left knee
//     B(gfx, PANTS_HL, 19, 35, 2, 3); // right knee

//     // ── Boots (rows 41–47) ──────────────────────────────────────────────────
//     // Boots extend 1 px beyond the leg width on each outer edge
//     B(gfx, BOOT, 7, 41, 8, 6); // left boot
//     B(gfx, BOOT, 17, 41, 8, 6); // right boot
//     B(gfx, SOLE, 7, 47, 8, 1); // left sole
//     B(gfx, SOLE, 17, 47, 8, 1); // right sole

//     // ── Silhouette outline touches ───────────────────────────────────────────
//     // Left and right body edges add depth against light backgrounds
//     B(gfx, OUTLINE, 6, 16, 1, 32); // left body outline
//     B(gfx, OUTLINE, 25, 16, 1, 32); // right body outline
//     // Hair top edge
//     B(gfx, OUTLINE, 8, 0, 1, 7); // left hair edge
//     B(gfx, OUTLINE, 23, 0, 1, 7); // right hair edge
//     // Head top
//     B(gfx, OUTLINE, 9, 3, 14, 1); // crown
//   }

//   // ── Persona: Female "The Visionary" ───────────────────────────────────────

//   /**
//    * Paints the female "Visionary" pixel-art sprite onto `gfx` at origin (0, 0).
//    *
//    * Layout (32 × 48 px):
//    * ```
//    * Rows  0– 8  Hair (2 rows longer than male, with side-swept look)
//    * Rows  6–16  Head / face
//    * Rows 17–27  Top / shirt  (cyan)
//    * Rows 28–30  Belt + buckle
//    * Rows 31–41  Pants        (purple)
//    * Rows 42–47  Boots        (dark purple)
//    * ```
//    *
//    * Notable additions vs the male:
//    * - Pink eyebrows (1 px, row 9)
//    * - Gold star hair accessory at (22, 2)
//    * - Light-pink highlight stripe in hair (right side)
//    * - Longer side locks hanging below the main hair block
//    */
//   private static drawFemalePersona(gfx: Phaser.GameObjects.Graphics): void {
//     // ── Palette ─────────────────────────────────────────────────────────────
//     const HAIR = 0xdb2777; // hot pink
//     const HAIR_HL = 0xf9a8d4; // light pink highlight
//     const HAIR_ACC = 0xf59e0b; // gold star accessory
//     const SKIN = 0xffdcab;
//     const SKIN_SH = 0xd4a373;
//     const EYE = 0x111827;
//     const EYE_SH = 0xf8fafc;
//     const BROW = 0xdb2777; // pink eyebrow
//     const TOP = 0x0ea5e9; // sky blue
//     const TOP_SH = 0x0369a1; // top shadow
//     const TOP_AC = 0x7dd3fc; // top shoulder accent
//     const BELT = 0x78350f;
//     const BUCKLE = 0xf59e0b;
//     const PANTS = 0x7c3aed; // purple
//     const PANTS_HL = 0xa78bfa; // purple highlight
//     const BOOT = 0x4c1d95; // dark purple
//     const SOLE = 0x2e1065;
//     const OUTLINE = 0x0a0a14;

//     // ── Hair (rows 0–8) — 2 rows taller than male ──────────────────────────
//     B(gfx, HAIR, 8, 0, 16, 9); // main hot-pink block  x 8..23, y 0..8
//     B(gfx, HAIR_HL, 19, 0, 4, 8); // light-pink highlight stripe (right side)
//     // Side locks that hang below the main block
//     B(gfx, HAIR, 8, 9, 3, 4); // left side lock
//     B(gfx, HAIR, 21, 9, 3, 4); // right side lock
//     // Gold star hair accessory (row 2, near right shoulder region)
//     P(gfx, HAIR_ACC, 22, 2);

//     // ── Head / face (rows 6–16) ─────────────────────────────────────────────
//     B(gfx, SKIN, 9, 6, 14, 11); // face skin  y 6..16
//     B(gfx, SKIN_SH, 9, 10, 2, 6); // left cheek shadow
//     B(gfx, SKIN_SH, 21, 10, 2, 6); // right cheek shadow
//     B(gfx, SKIN_SH, 8, 9, 1, 4); // left ear
//     B(gfx, SKIN_SH, 23, 9, 1, 4); // right ear

//     // ── Eyebrows (row 8) — pink, 1 px tall ──────────────────────────────────
//     B(gfx, BROW, 11, 8, 2, 1); // left eyebrow
//     B(gfx, BROW, 19, 8, 2, 1); // right eyebrow

//     // ── Eyes (rows 9–10) ────────────────────────────────────────────────────
//     B(gfx, EYE, 11, 9, 2, 2);
//     B(gfx, EYE, 19, 9, 2, 2);
//     P(gfx, EYE_SH, 12, 9);
//     P(gfx, EYE_SH, 20, 9);

//     // ── Nose + mouth ────────────────────────────────────────────────────────
//     P(gfx, SKIN_SH, 16, 12); // nose tip
//     B(gfx, SKIN_SH, 14, 14, 4, 1); // mouth line

//     // ── Neck (rows 17–18) ───────────────────────────────────────────────────
//     B(gfx, SKIN, 13, 17, 6, 2);

//     // ── Top / shirt (rows 17–27) ────────────────────────────────────────────
//     B(gfx, TOP_AC, 7, 17, 18, 1); // shoulder accent line (lighter cyan)
//     B(gfx, TOP, 7, 18, 18, 10); // main top body
//     B(gfx, TOP_SH, 7, 18, 3, 10); // left depth shadow
//     B(gfx, TOP_SH, 22, 18, 3, 10); // right depth shadow
//     // Arms
//     B(gfx, TOP_SH, 5, 19, 2, 9); // left arm
//     B(gfx, TOP_SH, 25, 19, 2, 9); // right arm
//     // Open collar (skin pixels at neckline)
//     P(gfx, SKIN, 15, 18);
//     P(gfx, SKIN, 16, 18);
//     P(gfx, SKIN, 14, 19);
//     P(gfx, SKIN, 17, 19);
//     // Premium accessory: Visionary's Glowing Pendant
//     P(gfx, 0x06b6d4, 15, 20); // Cyan glow
//     P(gfx, 0xffffff, 16, 20); // Sparkle

//     // ── Belt (rows 28–30) ───────────────────────────────────────────────────
//     B(gfx, BELT, 7, 28, 18, 3);
//     B(gfx, BUCKLE, 14, 28, 4, 3);

//     // ── Pants / legs (rows 31–41) ───────────────────────────────────────────
//     B(gfx, PANTS, 8, 31, 7, 11); // left leg
//     B(gfx, PANTS, 17, 31, 7, 11); // right leg
//     B(gfx, OUTLINE, 15, 31, 2, 11); // inner-leg shadow
//     B(gfx, PANTS_HL, 11, 37, 2, 3); // left knee highlight
//     B(gfx, PANTS_HL, 19, 37, 2, 3); // right knee highlight

//     // ── Boots (rows 42–47) ──────────────────────────────────────────────────
//     B(gfx, BOOT, 7, 42, 8, 5); // left boot
//     B(gfx, BOOT, 17, 42, 8, 5); // right boot
//     B(gfx, SOLE, 7, 47, 8, 1); // left sole
//     B(gfx, SOLE, 17, 47, 8, 1); // right sole

//     // ── Silhouette outline touches ───────────────────────────────────────────
//     B(gfx, OUTLINE, 6, 18, 1, 30); // left body edge
//     B(gfx, OUTLINE, 25, 18, 1, 30); // right body edge
//     B(gfx, OUTLINE, 8, 0, 1, 9); // left hair edge
//     B(gfx, OUTLINE, 23, 0, 1, 9); // right hair edge
//     B(gfx, OUTLINE, 9, 5, 14, 1); // crown top
//   }

//   // ── Path tile texture ──────────────────────────────────────────────────────

//   /**
//    * Creates **path_tile** — a 32×32 dirt/road tile.
//    *
//    * Features a warm brown base with a lighter centre lane and random pebble
//    * details for visual texture.
//    */
//   static createPathTextures(scene: Phaser.Scene): void {
//     const gfx = scene.add.graphics();

//     // Base road colour
//     gfx.fillStyle(0x92400e);
//     gfx.fillRect(0, 0, 32, 32);

//     // Slightly lighter centre lane
//     gfx.fillStyle(0xa16207, 0.5);
//     gfx.fillRect(4, 0, 24, 32);

//     // Edge trim (dark border strips)
//     gfx.fillStyle(0x78350f);
//     gfx.fillRect(0, 0, 3, 32);
//     gfx.fillRect(29, 0, 3, 32);

//     // Subtle pebble specks for texture
//     gfx.fillStyle(0x6b4f3a, 0.8);
//     const pebbles: [number, number][] = [
//       [5, 4],
//       [13, 8],
//       [22, 5],
//       [8, 17],
//       [19, 22],
//       [26, 13],
//       [3, 27],
//       [14, 29],
//       [10, 14],
//       [25, 20],
//     ];
//     for (const [px, py] of pebbles) {
//       gfx.fillRect(px, py, 2, 2);
//     }

//     gfx.generateTexture("path_tile", 32, 32);
//     gfx.destroy();
//   }

//   // ── Particle glow texture ──────────────────────────────────────────────────

//   /**
//    * Creates **particle_glow** — a 16×16 soft radial glow texture.
//    *
//    * Built from five concentric white circles with increasing opacity toward
//    * the centre, producing a smooth falloff suitable for particle emitters.
//    */
//   static createParticleTextures(scene: Phaser.Scene): void {
//     const gfx = scene.add.graphics();
//     const SIZE = 16;
//     const CX = SIZE / 2;
//     const CY = SIZE / 2;

//     // Concentric layers: outer → inner, increasing alpha
//     const layers: { r: number; alpha: number }[] = [
//       { r: 8.0, alpha: 0.1 },
//       { r: 6.0, alpha: 0.25 },
//       { r: 4.0, alpha: 0.5 },
//       { r: 2.5, alpha: 0.78 },
//       { r: 1.2, alpha: 1.0 },
//     ];

//     for (const layer of layers) {
//       gfx.fillStyle(0xffffff, layer.alpha);
//       gfx.fillCircle(CX, CY, layer.r);
//     }

//     gfx.generateTexture("particle_glow", SIZE, SIZE);
//     gfx.destroy();
//   }

//   // ── Decoration textures ────────────────────────────────────────────────────

//   /**
//    * Creates miscellaneous Skeld textures:
//    * `skeld_vent` | `skeld_table` | `skeld_crate`
//    */
//   static createDecorationTextures(scene: Phaser.Scene): void {
//     AssetLoader.createVentTexture(scene);
//     AssetLoader.createTableTexture(scene);
//   }

//   /**
//    * Create all biome tile textures for adventure theme
//    */
//   static createBiomeTiles(scene: Phaser.Scene): void {
//     BiomeTextureCreator.createAllBiomeTiles(scene);
//     BiomeTextureCreator.createOrganicPathTextures(scene);
//   }

//   /**
//    * Create adventure-themed checkpoint markers
//    */
//   static createAdventureCheckpointTextures(scene: Phaser.Scene): void {
//     AdventureCheckpointCreator.createAllAdventureCheckpoints(scene);
//   }

//   /**
//    * Create enemy silhouette textures
//    */
//   static createEnemyTextures(scene: Phaser.Scene): void {
//     AssetLoader.createSlimeTexture(scene);
//     AssetLoader.createVultureTexture(scene);
//     AssetLoader.createUndeadTexture(scene);
//     AssetLoader.createFrostWraithTexture(scene);
//     AssetLoader.createGolemTexture(scene);
//     AssetLoader.createSeaSerpentTexture(scene);
//     AssetLoader.createHarpyTexture(scene);
//     AssetLoader.createBureaucratTexture(scene);
//   }

//   // ── Enemy Textures ─────────────────────────────────────────────────────────

//   /**
//    * Stage 1: Slime enemy
//    */
//   private static createSlimeTexture(scene: Phaser.Scene): void {
//     const gfx = scene.add.graphics();
//     const SIZE = 48;

//     // Slime body (green blob)
//     gfx.fillStyle(0x4caf50, 0.8);
//     gfx.fillEllipse(SIZE / 2, SIZE / 2 + 8, 20, 16);

//     // Eyes
//     gfx.fillStyle(0x000000, 1);
//     gfx.fillCircle(SIZE / 2 - 6, SIZE / 2, 3);
//     gfx.fillCircle(SIZE / 2 + 6, SIZE / 2, 3);

//     // Shine
//     gfx.fillStyle(0xffffff, 0.6);
//     gfx.fillCircle(SIZE / 2 - 4, SIZE / 2 - 2, 2);

//     gfx.generateTexture("enemy_slime", SIZE, SIZE);
//     gfx.destroy();
//   }

//   /**
//    * Stage 2: Vulture enemy
//    */
//   private static createVultureTexture(scene: Phaser.Scene): void {
//     const gfx = scene.add.graphics();
//     const SIZE = 48;

//     // Body
//     gfx.fillStyle(0x5d4037, 1);
//     gfx.fillEllipse(SIZE / 2, SIZE / 2 + 4, 12, 16);

//     // Head
//     gfx.fillCircle(SIZE / 2, SIZE / 2 - 8, 8);

//     // Beak
//     gfx.fillStyle(0xffa726, 1);
//     gfx.fillTriangle(
//       SIZE / 2 + 8,
//       SIZE / 2 - 8,
//       SIZE / 2 + 4,
//       SIZE / 2 - 10,
//       SIZE / 2 + 4,
//       SIZE / 2 - 6,
//     );

//     // Wings
//     gfx.fillStyle(0x3e2723, 0.8);
//     gfx.fillEllipse(SIZE / 2 - 12, SIZE / 2, 8, 12);
//     gfx.fillEllipse(SIZE / 2 + 12, SIZE / 2, 8, 12);

//     gfx.generateTexture("enemy_vulture", SIZE, SIZE);
//     gfx.destroy();
//   }

//   /**
//    * Stage 3: Undead enemy
//    */
//   private static createUndeadTexture(scene: Phaser.Scene): void {
//     const gfx = scene.add.graphics();
//     const SIZE = 48;

//     // Skull
//     gfx.fillStyle(0xeeeeee, 1);
//     gfx.fillCircle(SIZE / 2, SIZE / 2 - 4, 12);

//     // Eye sockets
//     gfx.fillStyle(0x000000, 1);
//     gfx.fillCircle(SIZE / 2 - 4, SIZE / 2 - 6, 3);
//     gfx.fillCircle(SIZE / 2 + 4, SIZE / 2 - 6, 3);

//     // Glowing eyes
//     gfx.fillStyle(0x5555ff, 0.8);
//     gfx.fillCircle(SIZE / 2 - 4, SIZE / 2 - 6, 2);
//     gfx.fillCircle(SIZE / 2 + 4, SIZE / 2 - 6, 2);

//     // Body (tattered robe)
//     gfx.fillStyle(0x424242, 0.8);
//     gfx.fillRect(SIZE / 2 - 8, SIZE / 2 + 8, 16, 12);

//     gfx.generateTexture("enemy_undead", SIZE, SIZE);
//     gfx.destroy();
//   }

//   /**
//    * Stage 4: Frost Wraith enemy
//    */
//   private static createFrostWraithTexture(scene: Phaser.Scene): void {
//     const gfx = scene.add.graphics();
//     const SIZE = 48;

//     // Ghostly body
//     gfx.fillStyle(0xb8d4e8, 0.7);
//     gfx.fillEllipse(SIZE / 2, SIZE / 2, 14, 20);

//     // Ice crystals
//     gfx.fillStyle(0x7fb3d5, 1);
//     gfx.fillRect(SIZE / 2 - 2, SIZE / 2 - 12, 4, 8);
//     gfx.fillRect(SIZE / 2 - 6, SIZE / 2 - 8, 4, 6);
//     gfx.fillRect(SIZE / 2 + 2, SIZE / 2 - 8, 4, 6);

//     // Eyes
//     gfx.fillStyle(0x00ffff, 0.9);
//     gfx.fillCircle(SIZE / 2 - 4, SIZE / 2 - 4, 2);
//     gfx.fillCircle(SIZE / 2 + 4, SIZE / 2 - 4, 2);

//     gfx.generateTexture("enemy_frost_wraith", SIZE, SIZE);
//     gfx.destroy();
//   }

//   /**
//    * Stage 5: Golem enemy
//    */
//   private static createGolemTexture(scene: Phaser.Scene): void {
//     const gfx = scene.add.graphics();
//     const SIZE = 48;

//     // Body (rocky)
//     gfx.fillStyle(0x5d4037, 1);
//     gfx.fillRect(SIZE / 2 - 10, SIZE / 2 - 8, 20, 24);

//     // Head
//     gfx.fillRect(SIZE / 2 - 8, SIZE / 2 - 16, 16, 8);

//     // Gem core
//     gfx.fillStyle(0xffa726, 0.8);
//     gfx.fillCircle(SIZE / 2, SIZE / 2, 6);

//     // Eyes
//     gfx.fillStyle(0xff6f00, 1);
//     gfx.fillCircle(SIZE / 2 - 4, SIZE / 2 - 12, 2);
//     gfx.fillCircle(SIZE / 2 + 4, SIZE / 2 - 12, 2);

//     gfx.generateTexture("enemy_golem", SIZE, SIZE);
//     gfx.destroy();
//   }

//   /**
//    * Stage 6: Sea Serpent enemy
//    */
//   private static createSeaSerpentTexture(scene: Phaser.Scene): void {
//     const gfx = scene.add.graphics();
//     const SIZE = 48;

//     // Serpent body (wavy)
//     gfx.fillStyle(0x1565c0, 1);
//     for (let i = 0; i < 3; i++) {
//       const y = SIZE / 2 + i * 6;
//       gfx.fillEllipse(SIZE / 2, y, 12, 8);
//     }

//     // Head
//     gfx.fillEllipse(SIZE / 2, SIZE / 2 - 8, 10, 12);

//     // Eyes
//     gfx.fillStyle(0xffeb3b, 1);
//     gfx.fillCircle(SIZE / 2 - 3, SIZE / 2 - 10, 2);
//     gfx.fillCircle(SIZE / 2 + 3, SIZE / 2 - 10, 2);

//     // Fins
//     gfx.fillStyle(0x64b5f6, 0.8);
//     gfx.fillTriangle(
//       SIZE / 2 - 12,
//       SIZE / 2,
//       SIZE / 2 - 8,
//       SIZE / 2 - 4,
//       SIZE / 2 - 8,
//       SIZE / 2 + 4,
//     );
//     gfx.fillTriangle(
//       SIZE / 2 + 12,
//       SIZE / 2,
//       SIZE / 2 + 8,
//       SIZE / 2 - 4,
//       SIZE / 2 + 8,
//       SIZE / 2 + 4,
//     );

//     gfx.generateTexture("enemy_sea_serpent", SIZE, SIZE);
//     gfx.destroy();
//   }

//   /**
//    * Stage 7: Harpy enemy
//    */
//   private static createHarpyTexture(scene: Phaser.Scene): void {
//     const gfx = scene.add.graphics();
//     const SIZE = 48;

//     // Body
//     gfx.fillStyle(0x9c27b0, 1);
//     gfx.fillEllipse(SIZE / 2, SIZE / 2, 10, 14);

//     // Head
//     gfx.fillCircle(SIZE / 2, SIZE / 2 - 10, 6);

//     // Wings
//     gfx.fillStyle(0xb39ddb, 0.8);
//     gfx.fillEllipse(SIZE / 2 - 14, SIZE / 2 - 4, 10, 16);
//     gfx.fillEllipse(SIZE / 2 + 14, SIZE / 2 - 4, 10, 16);

//     // Eyes
//     gfx.fillStyle(0xff0000, 1);
//     gfx.fillCircle(SIZE / 2 - 2, SIZE / 2 - 10, 2);
//     gfx.fillCircle(SIZE / 2 + 2, SIZE / 2 - 10, 2);

//     gfx.generateTexture("enemy_harpy", SIZE, SIZE);
//     gfx.destroy();
//   }

//   /**
//    * Stage 8: Iron Bureaucrat enemy
//    */
//   private static createBureaucratTexture(scene: Phaser.Scene): void {
//     const gfx = scene.add.graphics();
//     const SIZE = 48;

//     // Body (armored)
//     gfx.fillStyle(0x757575, 1);
//     gfx.fillRect(SIZE / 2 - 8, SIZE / 2 - 4, 16, 20);

//     // Head (helmet)
//     gfx.fillRect(SIZE / 2 - 6, SIZE / 2 - 14, 12, 10);

//     // Visor
//     gfx.fillStyle(0xff0000, 0.8);
//     gfx.fillRect(SIZE / 2 - 4, SIZE / 2 - 10, 8, 2);

//     // Shoulders
//     gfx.fillStyle(0xffd54f, 1);
//     gfx.fillRect(SIZE / 2 - 12, SIZE / 2 - 4, 4, 6);
//     gfx.fillRect(SIZE / 2 + 8, SIZE / 2 - 4, 4, 6);

//     // Scroll (bureaucracy symbol)
//     gfx.fillStyle(0xffffff, 0.9);
//     gfx.fillRect(SIZE / 2 - 3, SIZE / 2 + 2, 6, 8);

//     gfx.generateTexture("enemy_bureaucrat", SIZE, SIZE);
//     gfx.destroy();
//   }

//   /**
//    * **skeld_vent** — 64×64
//    * Rounded rectangle with dark gray metallic slats
//    */
//   private static createVentTexture(scene: Phaser.Scene): void {
//     const gfx = scene.add.graphics();
//     const size = 64;

//     // Outer frame
//     gfx.fillStyle(0x3e4a50, 1);
//     gfx.fillRoundedRect(0, 0, size, size, 10);
//     gfx.lineStyle(2, 0x5f6f75, 1);
//     gfx.strokeRoundedRect(0, 0, size, size, 10);

//     // Dark inner area
//     gfx.fillStyle(0x1a1a1a, 1);
//     gfx.fillRect(8, 8, size - 16, size - 16);

//     // Slats
//     gfx.lineStyle(4, 0x4a5a62, 1);
//     for (let i = 16; i < size - 8; i += 12) {
//       gfx.lineBetween(12, i, size - 12, i);
//     }

//     gfx.generateTexture("skeld_vent", size, size);
//     gfx.destroy();
//   }

//   /**
//    * **skeld_table** — 100×60
//    * Rectangular metallic table with rivets
//    */
//   private static createTableTexture(scene: Phaser.Scene): void {
//     const gfx = scene.add.graphics();
//     const w = 100;
//     const h = 60;

//     // Table top
//     gfx.fillStyle(0x6b7b82, 1);
//     gfx.fillRect(0, 0, w, h);

//     // Beveled edge
//     gfx.lineStyle(4, 0x8b9aa3, 0.8);
//     gfx.strokeRect(0, 0, w, h);

//     // Rivets in corners
//     gfx.fillStyle(0x4a5a62, 1);
//     gfx.fillCircle(10, 10, 4);
//     gfx.fillCircle(w - 10, 10, 4);
//     gfx.fillCircle(10, h - 10, 4);
//     gfx.fillCircle(w - 10, h - 10, 4);

//     gfx.generateTexture("skeld_table", w, h);
//     gfx.destroy();
//   }
// }

/**
 * asset-loader.ts
 *
 * Programmatic Phaser texture creation for Ibhaveda.
 * Theme: Dark Tech Platform — Indigo · Purple · Cyan · Deep Navy
 *
 * ─── Texture registry ────────────────────────────────────────────────────────
 *  Checkpoints : cp_locked | cp_active | cp_in_progress | cp_completed | cp_gold
 *  Personas    : persona_male | persona_female   (32×48 px pixel art)
 *  Tiles       : path_tile                       (32×32 px)
 *  Particles   : particle_glow                   (16×16 px)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import * as Phaser from "phaser";
import { BiomeTextureCreator } from "./biome-textures";
import { AdventureCheckpointCreator } from "./adventure-checkpoints";

// ─────────────────────────────────────────────────────────────────────────────
// Module-level draw helpers
// ─────────────────────────────────────────────────────────────────────────────

function B(
  gfx: Phaser.GameObjects.Graphics,
  color: number,
  x: number,
  y: number,
  w: number,
  h: number,
  alpha = 1,
): void {
  gfx.fillStyle(color, alpha);
  gfx.fillRect(x, y, w, h);
}

function P(
  gfx: Phaser.GameObjects.Graphics,
  color: number,
  x: number,
  y: number,
): void {
  gfx.fillStyle(color, 1);
  gfx.fillRect(x, y, 1, 1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Website palette — matches SITE_COLORS in biome-textures.ts
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  bg: 0x0f0f1a,
  surface: 0x1a1a2e,
  surface2: 0x16213e,
  indigo: 0x6366f1,
  indigoLight: 0x818cf8,
  indigoDark: 0x4f46e5,
  purple: 0x8b5cf6,
  purpleLight: 0xa78bfa,
  cyan: 0x06b6d4,
  cyanLight: 0x22d3ee,
  amber: 0xf59e0b,
  amberLight: 0xfcd34d,
  slate: 0x475569,
  slateDark: 0x1e293b,
  white: 0xffffff,
  gold: 0xfbbf24,
};

// ─────────────────────────────────────────────────────────────────────────────
// AssetLoader
// ─────────────────────────────────────────────────────────────────────────────

export class AssetLoader {
  static createAllTextures(scene: Phaser.Scene): void {
    AssetLoader.createCheckpointTextures(scene);
    AssetLoader.createPersonaTextures(scene);
    AssetLoader.createPathTextures(scene);
    AssetLoader.createParticleTextures(scene);
    AssetLoader.createDecorationTextures(scene);
    AssetLoader.createBiomeTiles(scene);
    AssetLoader.createAdventureCheckpointTextures(scene);
    AssetLoader.createEnemyTextures(scene);
  }

  static preloadAssets(scene: Phaser.Scene): void {
    scene.load.image("skeld_floor", "/assets/skeld/floor.png");
    scene.load.image("guide_male", "/assets/skeld/guide_male.png");
    scene.load.image("guide_female", "/assets/skeld/guide_female.png");

    const optionalSheetKeys = new Set([
      "persona_male_idle_sheet",
      "persona_male_walk_sheet",
      "persona_female_idle_sheet",
      "persona_female_walk_sheet",
    ]);

    const onLoadError = (file: { key: string }) => {
      if (optionalSheetKeys.has(file.key) && scene.textures.exists(file.key)) {
        scene.textures.remove(file.key);
      }
    };
    scene.load.on("loaderror", onLoadError);
    scene.load.once("complete", () => {
      scene.load.off("loaderror", onLoadError);
    });

    scene.load.spritesheet(
      "persona_male_idle_sheet",
      "/assets/fan-tasy/Character_Idle.png",
      { frameWidth: 32, frameHeight: 48 },
    );
    scene.load.spritesheet(
      "persona_male_walk_sheet",
      "/assets/fan-tasy/Character_Walk.png",
      { frameWidth: 32, frameHeight: 48 },
    );
    scene.load.spritesheet(
      "persona_female_idle_sheet",
      "/assets/fan-tasy/Character_Idle.png",
      { frameWidth: 32, frameHeight: 48 },
    );
    scene.load.spritesheet(
      "persona_female_walk_sheet",
      "/assets/fan-tasy/Character_Walk.png",
      { frameWidth: 32, frameHeight: 48 },
    );

    // --- Fan-tasy Tileset Assets ---
    const fanTasyPath = "/assets/fan-tasy";
    const sproutPath = "/assets/sprout";

    // Core Tilesets
    scene.load.image("Tileset_Ground", `${fanTasyPath}/Tileset_Ground.png`);
    scene.load.spritesheet(
      "Tileset_Ground_Sheet",
      `${fanTasyPath}/Tileset_Ground.png`,
      { frameWidth: 16, frameHeight: 16 },
    );
    scene.load.image("Tileset_Water", `${fanTasyPath}/Tileset_Water.png`);
    scene.load.spritesheet(
      "Tileset_Water_Sheet",
      `${fanTasyPath}/Tileset_Water.png`,
      { frameWidth: 16, frameHeight: 16 },
    );
    scene.load.image("Tileset_RockSlope", `${fanTasyPath}/Tileset_RockSlope.png`);
    scene.load.image("Tileset_RockSlope_Simple", `${fanTasyPath}/Tileset_RockSlope_Simple.png`);
    scene.load.image("Tileset_Road", `${fanTasyPath}/Tileset_Road.png`);
    scene.load.spritesheet(
      "Tileset_Road_Sheet",
      `${fanTasyPath}/Tileset_Road.png`,
      { frameWidth: 16, frameHeight: 16 },
    );
    scene.load.image("Tileset_Shadow", `${fanTasyPath}/Tileset_Shadow.png`);

    // --- Sprout Lands forest biome sheets ---
    scene.load.spritesheet("sprout_grass_sheet", `${sproutPath}/grass.png`, {
      frameWidth: 16,
      frameHeight: 16,
    });
    scene.load.spritesheet("sprout_water_sheet", `${sproutPath}/water.png`, {
      frameWidth: 16,
      frameHeight: 16,
    });
    scene.load.spritesheet("sprout_hills_sheet", `${sproutPath}/hills.png`, {
      frameWidth: 16,
      frameHeight: 16,
    });
    scene.load.spritesheet(
      "sprout_forest_decor_sheet",
      `${sproutPath}/forest-decor.png`,
      { frameWidth: 16, frameHeight: 16 },
    );
    scene.load.spritesheet("sprout_plants_sheet", `${sproutPath}/plants.png`, {
      frameWidth: 16,
      frameHeight: 16,
    });
    scene.load.spritesheet("sprout_paths_sheet", `${sproutPath}/paths.png`, {
      frameWidth: 16,
      frameHeight: 16,
    });
    scene.load.spritesheet(
      "sprout_bridge_sheet",
      `${sproutPath}/wood-bridge.png`,
      { frameWidth: 16, frameHeight: 16 },
    );
    scene.load.spritesheet("sprout_fences_sheet", `${sproutPath}/fences.png`, {
      frameWidth: 16,
      frameHeight: 16,
    });

    // Atlases
    scene.load.image("Buildings", `${fanTasyPath}/Buildings.png`);
    scene.load.image("Props", `${fanTasyPath}/Props.png`);
    scene.load.image("Rocks", `${fanTasyPath}/Rocks.png`);
    scene.load.image("Trees_Bushes", `${fanTasyPath}/Trees_Bushes.png`);

    // Animations
    scene.load.image("Animation_Flowers_Red", `${fanTasyPath}/Flowers_Red.png`);
    scene.load.image("Animation_Flowers_White", `${fanTasyPath}/Flowers_White.png`);
    scene.load.image("Animation_Campfire", `${fanTasyPath}/Animation_Campfire.png`);

    // Image Collections (Individual objects)
    const objects = [
      "House_Hay_1", "House_Hay_2", "House_Hay_3", "House_Hay_4_Purple", "Forest_Hut_1",
      "CityWall_Gate_1", "Well_Hay_1", "Sign_1", "Sign_2", "Table_Medium_1",
      "Bench_1", "Bench_3", "Barrel_Small_Empty", "Basket_Empty",
      "Crate_Large_Empty", "Crate_Medium_Closed", "Crate_Water_1",
      "LampPost_3", "BulletinBoard_1", "HayStack_2", "Plant_2", "Sack_3",
      "Fireplace_1", "Crate_Water_1",
      "Rock_Brown_1", "Rock_Brown_2", "Rock_Brown_4", "Rock_Brown_6", "Rock_Brown_9",
      "Tree_Emerald_1", "Tree_Emerald_2", "Tree_Emerald_3", "Tree_Emerald_4",
      "Bush_Emerald_1", "Bush_Emerald_2", "Bush_Emerald_3", "Bush_Emerald_4",
      "Bush_Emerald_5", "Bush_Emerald_6", "Bush_Emerald_7",
      "Shadow_Round_16x16_Flat_Black", "Shadow_Round_16x16_Long_Black", "Shadow_Round_16x16_Medium_Black", "Shadow_Round_16x16_Short_Black",
      "Shadow_Round_16x32_Flat_Black", "Shadow_Round_16x32_Long_Black", "Shadow_Round_16x32_Medium_Black", "Shadow_Round_16x32_Short_Black",
      "Shadow_Round_24x24_Flat_Black", "Shadow_Round_24x24_Long_Black", "Shadow_Round_24x24_Medium_Black", "Shadow_Round_24x24_Short_Black",
      "Shadow_Round_24x48_Flat_Black", "Shadow_Round_24x48_Long_Black", "Shadow_Round_24x48_Medium_Black", "Shadow_Round_24x48_Short_Black",
      "Shadow_Round_32x16_Flat_Black", "Shadow_Round_32x16_Long_Black", "Shadow_Round_32x16_Medium_Black", "Shadow_Round_32x16_Short_Black",
      "Shadow_Round_32x32_Flat_Black", "Shadow_Round_32x32_Long_Black", "Shadow_Round_32x32_Medium_Black", "Shadow_Round_32x32_Short_Black",
      "Shadow_Round_40x40_Flat_Black", "Shadow_Round_40x40_Long_Black", "Shadow_Round_40x40_Medium_Black", "Shadow_Round_40x40_Short_Black",
      "Shadow_Round_48x24_Flat_Black", "Shadow_Round_48x24_Long_Black", "Shadow_Round_48x24_Medium_Black", "Shadow_Round_48x24_Short_Black",
      "Shadow_Round_48x48_Flat_Black", "Shadow_Round_48x48_Long_Black", "Shadow_Round_48x48_Medium_Black", "Shadow_Round_48x48_Short_Black"
    ];
    objects.forEach(obj => scene.load.image(obj, `${fanTasyPath}/${obj}.png`));

    // --- Deep Mine biome tiles ---
    const minePath = "/assets/mine";
    scene.load.image("mine_bg_cave", `${minePath}/bg_cave.png`);
    scene.load.image("mine_cave_rail", `${minePath}/tile_cave_rail.png`);
    scene.load.image("mine_cave_rock", `${minePath}/tile_cave_bg_rock.png`);
    scene.load.image("mine_street_light", `${minePath}/mine_street_light.png`);
    scene.load.image("mine_street_light_1", `${minePath}/mine_street_light_1.png`);
    scene.load.image("mine_street_light_2", `${minePath}/mine_street_light_2.png`);
    scene.load.image("mine_street_light_3", `${minePath}/mine_street_light_3.png`);
    scene.load.image("mine_truck_1", `${minePath}/mine_truck_1.png`);
    scene.load.image("mine_truck_2", `${minePath}/mine_truck_2.png`);
    scene.load.image("mine_truck_3", `${minePath}/mine_truck_3.png`);
    scene.load.image("mine_truck_red", `${minePath}/mine_truck_red.png`);



    // Load main Tilemap (JSON with embedded tilesets)
    scene.load.tilemapTiledJSON("beginning_fields", `${fanTasyPath}/Beginning Fields.tmj`);

    // --- Tropical Medieval City Tileset (Stage 8) ---
    const tropicalPath = "/assets/tropical-city";

    // Load buildings
    for (let i = 1; i <= 18; i++) {
      scene.load.image(`tropical_building_${i}`, `${tropicalPath}/buildings/building_${i}/building_1.png`);
    }

    // Load decorations
    for (let i = 1; i <= 18; i++) {
      scene.load.image(`tropical_decor_${i}`, `${tropicalPath}/decor/decor_${i}.png`);
    }

    // Load greenery
    for (let i = 1; i <= 5; i++) {
      scene.load.image(`tropical_greenery_${i}`, `${tropicalPath}/decor/greenery_${i}.png`);
    }

    // Load trees
    scene.load.image("tropical_tree_1", `${tropicalPath}/decor/tree_1.png`);
    scene.load.image("tropical_tree_2", `${tropicalPath}/decor/tree_2.png`);

    // Load land tiles
    for (let i = 1; i <= 26; i++) {
      scene.load.image(`tropical_land_${i}`, `${tropicalPath}/land/land_${i}.png`);
    }

    // Load road tiles
    for (let i = 1; i <= 17; i++) {
      scene.load.image(`tropical_road_${i}`, `${tropicalPath}/road/road_${i}.png`);
    }
  }

  // ── Persona sprite sheets ─────────────────────────────────────────────────

  /**
   * Generates procedural persona sprite sheets: 32×48 px per frame, 1px/pixel.
   *  - idle: 4 frames, gentle breathing bob
   *  - walk: 8 frames, full leg+arm swing cycle
   */
  static createPersonaSpriteSheets(scene: Phaser.Scene): void {
    const FW = 32, FH = 48;
    const sheets = [
      { key: 'persona_male_idle_sheet', frames: 4, gender: 'male', isWalk: false },
      { key: 'persona_male_walk_sheet', frames: 8, gender: 'male', isWalk: true },
      { key: 'persona_female_idle_sheet', frames: 4, gender: 'female', isWalk: false },
      { key: 'persona_female_walk_sheet', frames: 8, gender: 'female', isWalk: true },
    ];
    for (const sheet of sheets) {
      const pending = (scene.load.list as any)?.some?.((f: any) => f.key === sheet.key);
      if (scene.textures.exists(sheet.key) || pending) continue;
      const male = sheet.gender === 'male';
      const W = FW * sheet.frames;
      const gfx = scene.add.graphics();
      
      // RPG Colors
      const SKIN = 0xFFD4A3, SKIN_SH = 0xE8A87C, SKIN_HL = 0xFFF5E6;
      const EW = 0xFFFFFF, ESH = 0x1A1A2E, ESHINE = 0xFFFFFF, COL = 0xFFFFFF;
      const OUT = 0x0A0A18, BLUSH = 0xFF90A0;
      
      const p = (c: number, a: number, x: number, y: number, w = 1, h = 1) => {
        const rx = Math.round(x), ry = Math.round(y), rw = Math.max(1, Math.round(w)), rh = Math.max(1, Math.round(h));
        if (rx < 0 || ry < 0 || rx + rw > W || ry + rh > FH) return;
        gfx.fillStyle(c, a); gfx.fillRect(rx, ry, rw, rh);
      };

      for (let fi = 0; fi < sheet.frames; fi++) {
        const ox = fi * FW, t = fi / sheet.frames;
        let bob = 0, llY = 0, rlY = 0, llX = 0, rlX = 0, lA = 0, rA = 0, lF = 0, rF = 0;
        if (!sheet.isWalk) {
          bob = Math.round(Math.sin((fi / 4) * Math.PI * 2) * 0.8);
        } else {
          const ph = t * Math.PI * 2;
          const sinPh = Math.sin(ph);
          const cosPh = Math.cos(ph);
          bob = Math.round(Math.abs(Math.sin(ph * 2)) * -1.2);
          llY = Math.round(sinPh * 3.5);
          rlY = Math.round(-sinPh * 3.5);
          llX = Math.round(cosPh * 1.2);
          rlX = Math.round(-cosPh * 1.2);
          lA = Math.round(-sinPh * 2.2);
          rA = Math.round(sinPh * 2.2);
          lF = Math.round(cosPh * 1.2);
          rF = Math.round(-cosPh * 1.2);
        }
        const ht = 3 + bob;
        
        // ── HEAD AND HAIR/HOOD ────────────────────────────────────────────────
        if (male) {
          // Male: Blonde spiky anime hair
          const HAIR = 0xDF9F00, HMID = 0xFAC744, HHL = 0xFDFFB6, HDARK = 0x825E00;
          p(OUT, 1, ox + 8, ht - 2, 16, 1); p(HAIR, 1, ox + 9, ht - 2, 14, 1);
          p(OUT, 1, ox + 6, ht - 1, 2, 1); p(OUT, 1, ox + 24, ht - 1, 2, 1);
          p(HAIR, 1, ox + 7, ht - 1, 18, 6); 
          p(HDARK, 0.6, ox + 7, ht - 1, 2, 6); p(HDARK, 0.6, ox + 23, ht - 1, 2, 6);
          p(HMID, 1, ox + 10, ht, 10, 3); p(HHL, 0.9, ox + 13, ht, 5, 2);
          p(HAIR, 1, ox + 7, ht - 4, 5, 4); p(HAIR, 1, ox + 13, ht - 5, 7, 5); p(HAIR, 1, ox + 20, ht - 4, 5, 4);
          p(HMID, 1, ox + 14, ht - 4, 5, 3); p(HHL, 0.8, ox + 15, ht - 4, 3, 2);
          p(HAIR, 1, ox + 7, ht + 5, 2, 5); p(HAIR, 1, ox + 23, ht + 5, 2, 5);
        } else {
          // Female: Crimson Hood and Silver peeking fringe
          const HOOD = 0x5A0C25, HMID_HOOD = 0x8B1E3F, HHL_HOOD = 0xB23B5A;
          // Hood back cape background
          p(HOOD, 1, ox + 5, ht + 10, 22, 12);
          p(HMID_HOOD, 1, ox + 6, ht + 10, 20, 11);
          // Large curved outer hood
          p(OUT, 1, ox + 7, ht - 2, 18, 1);
          p(HMID_HOOD, 1, ox + 8, ht - 2, 16, 2);
          p(HHL_HOOD, 1, ox + 10, ht - 2, 12, 1);
          p(HMID_HOOD, 1, ox + 6, ht, 3, 11); p(OUT, 1, ox + 5, ht, 1, 11);
          p(HMID_HOOD, 1, ox + 23, ht, 3, 11); p(OUT, 1, ox + 26, ht, 1, 11);
          // Spiky silver/grey hair peeking from under hood
          p(0x9E9E9E, 1, ox + 9, ht + 3, 14, 2);
          p(0xE0E0E0, 1, ox + 10, ht + 3, 12, 1);
          p(0xFFFFFF, 1, ox + 12, ht + 3, 6, 1);
        }
        
        // Head Face base (Inside hair/hood overlay)
        const hy = ht + 5;
        p(OUT, 1, ox + 8, hy, 16, 1); p(OUT, 1, ox + 7, hy + 1, 1, 10); p(OUT, 1, ox + 24, hy + 1, 1, 10); p(OUT, 1, ox + 8, hy + 11, 16, 1);
        p(SKIN, 1, ox + 8, hy + 1, 16, 10); 
        p(SKIN_SH, 0.5, ox + 8, hy + 1, 2, 9); p(SKIN_SH, 0.5, ox + 22, hy + 1, 2, 9);
        p(SKIN_HL, 0.5, ox + 11, hy + 1, 10, 4);
        
        // Anime Sparkle Eyes
        const ey = hy + 3;
        const EP = male ? 0x2A3D66 : 0x8B1E3F;
        // Left Eye
        p(OUT, 1, ox + 9, ey - 1, 6, 1); p(OUT, 1, ox + 9, ey + 4, 6, 1); p(OUT, 1, ox + 9, ey, 1, 4); p(OUT, 1, ox + 14, ey, 1, 4);
        p(EW, 1, ox + 10, ey, 4, 4); p(EP, 1, ox + 11, ey + 1, 2, 2); p(ESH, 1, ox + 11, ey + 2, 2, 1); p(ESHINE, 1, ox + 12, ey + 1, 1, 1);
        // Right Eye
        p(OUT, 1, ox + 17, ey - 1, 6, 1); p(OUT, 1, ox + 17, ey + 4, 6, 1); p(OUT, 1, ox + 17, ey, 1, 4); p(OUT, 1, ox + 22, ey, 1, 4);
        p(EW, 1, ox + 18, ey, 4, 4); p(EP, 1, ox + 19, ey + 1, 2, 2); p(ESH, 1, ox + 19, ey + 2, 2, 1); p(ESHINE, 1, ox + 20, ey + 1, 1, 1);
        
        p(BLUSH, 0.35, ox + 9, ey + 5, 3, 2); p(BLUSH, 0.35, ox + 20, ey + 5, 3, 2);
        p(SKIN_SH, 0.6, ox + 15, ey + 6, 2, 1);
        
        // Neck and Collar
        const ny = hy + 11;
        p(OUT, 1, ox + 12, ny, 1, 4); p(OUT, 1, ox + 19, ny, 1, 4);
        p(SKIN, 1, ox + 13, ny, 6, 4); p(SKIN_SH, 0.5, ox + 13, ny + 2, 6, 2);
        
        // ── TORSO AND CLOTHING ────────────────────────────────────────────────
        const ty = ny + 4;
        p(COL, 1, ox + 12, ty, 8, 2);
        if (male) {
          // Male: Blue steel knight plate armor and dark wrap-around scarf
          const SHIRT = 0x2A3D66, SSH = 0x192231, SHL = 0x4F7CAC;
          p(SHIRT, 1, ox + 8, ty + 2, 16, 10);
          p(SSH, 1, ox + 8, ty + 2, 3, 10); p(SSH, 1, ox + 21, ty + 2, 3, 10);
          p(SHL, 0.6, ox + 13, ty + 2, 6, 5);
          p(OUT, 1, ox + 7, ty + 2, 1, 10); p(OUT, 1, ox + 24, ty + 2, 1, 10); p(OUT, 1, ox + 8, ty + 12, 16, 1);
          
          // Wrap-around neck scarf crossing chest
          const SCARF = 0x0A0F1D, SCARF_HL = 0x1F2A44;
          p(SCARF, 1, ox + 10, ny + 1, 12, 3);
          p(SCARF_HL, 1, ox + 12, ny + 1, 8, 1);
          p(SCARF, 1, ox + 8, ty, 3, 5); // Hanging scarf tail
        } else {
          // Female: Crimson archer tunic
          const SHIRT = 0x8B1E3F, SSH = 0x5A0C25, SHL = 0xB23B5A;
          p(SHIRT, 1, ox + 8, ty + 2, 16, 10);
          p(SSH, 1, ox + 8, ty + 2, 3, 10); p(SSH, 1, ox + 21, ty + 2, 3, 10);
          p(SHL, 0.6, ox + 13, ty + 2, 6, 5);
          p(OUT, 1, ox + 7, ty + 2, 1, 10); p(OUT, 1, ox + 24, ty + 2, 1, 10); p(OUT, 1, ox + 8, ty + 12, 16, 1);
          
          // Gold buckled archery cross strap
          p(0x3E2723, 1, ox + 10, ty + 2, 4, 8); // brown leather strap
          p(0xFFD700, 1, ox + 11, ty + 5, 2, 2); // gold strap buckle
        }
        
        // Arms
        const ay = ty + 2;
        const lax = ox + 5 + lA;
        const rax = ox + 24 + rA;
        const ARM_COLOR = male ? 0x2A3D66 : 0x8B1E3F;
        const ARM_SHADOW = male ? 0x192231 : 0x5A0C25;
        
        // Left arm
        p(ARM_COLOR, 1, lax, ay, 3, 8); p(ARM_SHADOW, 0.5, lax, ay, 1, 8);
        p(SKIN, 1, lax, ay + 8, 3, 3); p(OUT, 1, lax - 1, ay, 1, 11); p(OUT, 1, lax + 3, ay, 1, 11);
        
        // Right arm
        p(ARM_COLOR, 1, rax, ay, 3, 8); p(ARM_SHADOW, 0.5, rax + 2, ay, 1, 8);
        p(SKIN, 1, rax, ay + 8, 3, 3); p(OUT, 1, rax - 1, ay, 1, 11); p(OUT, 1, rax + 3, ay, 1, 11);
        
        // Archer Bow (Only for female)
        if (!male) {
          const bowX = ox + 2 + lA;
          p(0x8D6E63, 1, bowX, ty, 1, 12); // Wooden frame of bow
          p(0x8D6E63, 1, bowX - 1, ty - 1, 2, 1);
          p(0x8D6E63, 1, bowX - 1, ty + 12, 2, 1);
          p(0xE0E0E0, 1, bowX + 1, ty, 1, 12); // Bow string
        }
        
        // Belt
        const bly = ty + 12;
        p(OUT, 1, ox + 7, bly, 18, 1); 
        p(0x3E2723, 1, ox + 8, bly + 1, 16, 3); 
        p(0xFFD700, 1, ox + 14, bly + 1, 4, 3); 
        p(OUT, 1, ox + 7, bly + 4, 18, 1);
        
        // Legs (charcoal trousers vs Midnight Purple trousers)
        const lgt = bly + 4;
        const llx = ox + 9 + llX, lll = Math.max(3, 9 + llY);
        const PANTS = male ? 0x212121 : 0x4A148C;
        const PSH = male ? 0x0A0A0A : 0x311B92;
        p(PANTS, 1, llx, lgt, 6, lll); p(PSH, 1, llx, lgt, 2, lll);
        p(OUT, 1, llx - 1, lgt, 1, lll); p(OUT, 1, llx + 6, lgt, 1, lll);
        
        const rlx = ox + 17 + rlX, rll = Math.max(3, 9 + rlY);
        p(PANTS, 1, rlx, lgt, 6, rll); p(PSH, 1, rlx, lgt, 2, rll);
        p(OUT, 1, rlx - 1, lgt, 1, rll); p(OUT, 1, rlx + 6, lgt, 1, rll);
        p(OUT, 1, ox + 15, lgt, 2, 5);
        
        // Shoes
        const sby = lgt + 9;
        const lsx = ox + 8 + llX + lF, lsy = sby + llY;
        p(0x3E2723, 1, lsx, lsy, 8, 4); p(0x1A0A00, 1, lsx, lsy + 4, 8, 1);
        p(OUT, 1, lsx - 1, lsy, 1, 5); p(OUT, 1, lsx + 8, lsy, 1, 5); p(OUT, 1, lsx, lsy - 1, 8, 1); p(OUT, 1, lsx, lsy + 5, 8, 1);
        
        const rsx = ox + 16 + rlX + rF, rsy = sby + rlY;
        p(0x3E2723, 1, rsx, rsy, 8, 4); p(0x1A0A00, 1, rsx, rsy + 4, 8, 1);
        p(OUT, 1, rsx - 1, rsy, 1, 5); p(OUT, 1, rsx + 8, rsy, 1, 5); p(OUT, 1, rsx, rsy - 1, 8, 1); p(OUT, 1, rsx, rsy + 5, 8, 1);
      }
      gfx.generateTexture(sheet.key, W, FH);
      gfx.destroy();
      const tex = scene.textures.get(sheet.key);
      for (let f = 0; f < sheet.frames; f++) tex.add(f, 0, f * FW, 0, FW, FH);
    }
    AssetLoader.createPersonaAnimations(scene);
  }

  static createPersonaAnimations(scene: Phaser.Scene): void {
    const anims = [
      { key: 'persona_male_idle', sheet: 'persona_male_idle_sheet', frames: 4, fps: 5 },
      { key: 'persona_male_walk', sheet: 'persona_male_walk_sheet', frames: 8, fps: 10 },
      { key: 'persona_female_idle', sheet: 'persona_female_idle_sheet', frames: 4, fps: 5 },
      { key: 'persona_female_walk', sheet: 'persona_female_walk_sheet', frames: 8, fps: 10 },
    ];
    for (const anim of anims) {
      if (scene.anims.exists(anim.key) || !scene.textures.exists(anim.sheet)) continue;
      scene.anims.create({
        key: anim.key,
        frames: scene.anims.generateFrameNumbers(anim.sheet, { start: 0, end: anim.frames - 1 }),
        frameRate: anim.fps,
        repeat: -1,
      });
    }
  }

  // ── Checkpoint textures ────────────────────────────────────────────────────

  static createCheckpointTextures(scene: Phaser.Scene): void {
    AssetLoader.createLockedTexture(scene);
    AssetLoader.createActiveTexture(scene);
    AssetLoader.createInProgressTexture(scene);
    AssetLoader.createCompletedTexture(scene);
    AssetLoader.createGoldTexture(scene);
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  DARK TECH GLOSSY BUTTON HELPER
  //
  //  Creates a glassmorphism-style circular button matching the website UI:
  //  - Dark navy base with surface elevation
  //  - Colored rim / stroke that carries the biome's brand color
  //  - Subtle top-left glass highlight
  //  - Drop shadow for depth
  // ─────────────────────────────────────────────────────────────────────────

  private static drawTechButton(
    gfx: Phaser.GameObjects.Graphics,
    size: number,
    bodyColor: number, // main fill
    rimColor: number, // outer ring / border
    glowColor: number = 0, // optional soft outer glow (0 = skip)
    glowAlpha: number = 0,
  ): void {
    const cx = size / 2;
    const cy = size / 2;
    const outerR = size * 0.43;
    const innerR = outerR - 3;

    // Subtle outer glow bloom
    if (glowColor && glowAlpha > 0) {
      gfx.fillStyle(glowColor, glowAlpha * 0.35);
      gfx.fillCircle(cx, cy, outerR + 12);
      gfx.fillStyle(glowColor, glowAlpha * 0.15);
      gfx.fillCircle(cx, cy, outerR + 20);
    }

    // Drop shadow
    gfx.fillStyle(0x000000, 0.55);
    gfx.fillCircle(cx + 2, cy + 4, outerR);

    // Dark base layer (slightly larger than inner) — creates ring separation
    gfx.fillStyle(C.bg, 1);
    gfx.fillCircle(cx, cy, outerR + 1);

    // Colored rim (2-px stroke rendered as two circles)
    gfx.fillStyle(rimColor, 1);
    gfx.fillCircle(cx, cy, outerR);

    // Body fill
    gfx.fillStyle(bodyColor, 1);
    gfx.fillCircle(cx, cy, innerR);

    // Bottom-half darkening — gives 3D depth
    const dark = Phaser.Display.Color.IntegerToColor(bodyColor);
    dark.darken(30);
    gfx.fillStyle(dark.color, 0.5);
    gfx.beginPath();
    gfx.arc(cx, cy, innerR, 0, Math.PI, false);
    gfx.fillPath();

    // Top glass highlight (semicircle, very subtle on dark buttons)
    gfx.fillStyle(0xffffff, 0.12);
    gfx.beginPath();
    gfx.arc(cx, cy - 3, innerR * 0.65, Math.PI, 0, false);
    gfx.fillPath();

    // Small specular sparkle top-left
    gfx.fillStyle(0xffffff, 0.45);
    gfx.fillCircle(cx - innerR * 0.28, cy - innerR * 0.36, innerR * 0.12);
  }

  // ── cp_locked — muted slate button ──────────────────────────────────────

  private static createLockedTexture(scene: Phaser.Scene): void {
    const gfx = scene.add.graphics();
    const size = 80;
    AssetLoader.drawTechButton(gfx, size, C.slateDark, C.slate);
    // Lock icon — small padlock shape
    const cx = size / 2,
      cy = size / 2;
    gfx.lineStyle(3, C.slate, 0.7);
    gfx.strokeCircle(cx, cy - 4, 8);
    gfx.fillStyle(C.slate, 0.7);
    gfx.fillRect(cx - 7, cy + 2, 14, 10);
    gfx.generateTexture("cp_locked", size, size);
    gfx.destroy();
  }

  // ── cp_active — indigo glowing button ────────────────────────────────────

  private static createActiveTexture(scene: Phaser.Scene): void {
    const gfx = scene.add.graphics();
    const size = 80;
    AssetLoader.drawTechButton(
      gfx,
      size,
      C.indigo,
      C.indigoLight,
      C.indigo,
      0.55,
    );
    // Small play-arrow indicator at center-right
    const cx = size / 2,
      cy = size / 2;
    gfx.fillStyle(0xffffff, 0.25);
    gfx.fillTriangle(cx + 4, cy - 6, cx + 4, cy + 6, cx + 12, cy);
    gfx.generateTexture("cp_active", size, size);
    gfx.destroy();
  }

  // ── cp_in_progress — amber button ────────────────────────────────────────

  private static createInProgressTexture(scene: Phaser.Scene): void {
    const gfx = scene.add.graphics();
    const size = 80;
    AssetLoader.drawTechButton(gfx, size, C.amber, C.amberLight, C.amber, 0.35);
    // Half-circle progress arc overlay
    const cx = size / 2,
      cy = size / 2;
    gfx.lineStyle(4, 0xffffff, 0.2);
    gfx.beginPath();
    gfx.arc(cx, cy, 22, -Math.PI * 0.5, Math.PI * 0.5, false);
    gfx.strokePath();
    gfx.generateTexture("cp_in_progress", size, size);
    gfx.destroy();
  }

  // ── cp_completed — deep indigo button with cyan check ────────────────────

  private static createCompletedTexture(scene: Phaser.Scene): void {
    const gfx = scene.add.graphics();
    const size = 80;
    AssetLoader.drawTechButton(gfx, size, C.indigoDark, C.cyan);
    // Checkmark
    const cx = size / 2,
      cy = size / 2;
    gfx.lineStyle(4, C.cyanLight, 0.9);
    gfx.beginPath();
    gfx.moveTo(cx - 10, cy);
    gfx.lineTo(cx - 3, cy + 8);
    gfx.lineTo(cx + 10, cy - 8);
    gfx.strokePath();
    gfx.generateTexture("cp_completed", size, size);
    gfx.destroy();
  }

  // ── cp_gold — amber-gold radiant button ──────────────────────────────────

  private static createGoldTexture(scene: Phaser.Scene): void {
    const gfx = scene.add.graphics();
    const size = 80;
    AssetLoader.drawTechButton(gfx, size, C.amber, C.gold, C.gold, 0.55);
    // Star icon
    const cx = size / 2,
      cy = size / 2;
    gfx.fillStyle(0xffffff, 0.85);
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 13 : 6;
      const angle = (i * Math.PI) / 5 - Math.PI / 2;
      pts.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
    }
    gfx.beginPath();
    gfx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) gfx.lineTo(pts[i].x, pts[i].y);
    gfx.closePath();
    gfx.fillPath();
    gfx.generateTexture("cp_gold", size, size);
    gfx.destroy();
  }

  // ── Path tile ─────────────────────────────────────────────────────────────

  static createPathTextures(scene: Phaser.Scene): void {
    const gfx = scene.add.graphics();
    // Transparent tile (the path is drawn as Graphics in WorldMapScene)
    gfx.fillStyle(C.bg, 0);
    gfx.fillRect(0, 0, 32, 32);
    gfx.lineStyle(1, C.cyan, 0.4);
    gfx.lineBetween(0, 16, 32, 16);
    gfx.fillStyle(C.cyanLight, 0.7);
    gfx.fillCircle(16, 16, 2);
    gfx.generateTexture("path_tile", 32, 32);
    gfx.destroy();
  }

  // ── Particle glow ─────────────────────────────────────────────────────────

  static createParticleTextures(scene: Phaser.Scene): void {
    const gfx = scene.add.graphics();
    const SIZE = 16,
      CX = 8,
      CY = 8;
    const layers = [
      { r: 8.0, alpha: 0.08 },
      { r: 6.0, alpha: 0.2 },
      { r: 4.0, alpha: 0.45 },
      { r: 2.5, alpha: 0.75 },
      { r: 1.2, alpha: 1.0 },
    ];
    for (const l of layers) {
      gfx.fillStyle(C.indigoLight, l.alpha);
      gfx.fillCircle(CX, CY, l.r);
    }
    gfx.generateTexture("particle_glow", SIZE, SIZE);
    gfx.destroy();
  }

  // ── Decoration textures ────────────────────────────────────────────────────

  static createDecorationTextures(scene: Phaser.Scene): void {
    AssetLoader.createVentTexture(scene);
    AssetLoader.createTableTexture(scene);
  }

  static createBiomeTiles(scene: Phaser.Scene): void {
    BiomeTextureCreator.createAllBiomeTiles(scene);
    BiomeTextureCreator.createOrganicPathTextures(scene);
  }

  static createAdventureCheckpointTextures(scene: Phaser.Scene): void {
    AdventureCheckpointCreator.createAllAdventureCheckpoints(scene);
  }

  // ── Enemy textures (palette updated to dark-tech) ─────────────────────────

  static createEnemyTextures(scene: Phaser.Scene): void {
    AssetLoader.createChallengeTexture(scene, "enemy_slime", C.indigo, "S1");
    AssetLoader.createChallengeTexture(scene, "enemy_vulture", C.purple, "S2");
    AssetLoader.createChallengeTexture(scene, "enemy_undead", C.cyan, "S3");
    AssetLoader.createChallengeTexture(
      scene,
      "enemy_frost_wraith",
      C.cyanLight,
      "S4",
    );
    AssetLoader.createChallengeTexture(scene, "enemy_golem", C.amber, "S5");
    AssetLoader.createChallengeTexture(
      scene,
      "enemy_sea_serpent",
      C.indigoLight,
      "S6",
    );
    AssetLoader.createChallengeTexture(
      scene,
      "enemy_harpy",
      C.purpleLight,
      "S7",
    );
    AssetLoader.createChallengeTexture(
      scene,
      "enemy_bureaucrat",
      C.slateDark,
      "S8",
    );
  }

  /** Generic challenge-block silhouette in the website color palette */
  private static createChallengeTexture(
    scene: Phaser.Scene,
    key: string,
    color: number,
    label: string,
  ): void {
    const gfx = scene.add.graphics();
    const SIZE = 48;
    const cx = SIZE / 2,
      cy = SIZE / 2;

    // Dark surface circle
    gfx.fillStyle(C.surface, 1);
    gfx.fillCircle(cx, cy, 20);

    // Colored ring
    gfx.lineStyle(3, color, 0.85);
    gfx.strokeCircle(cx, cy, 20);

    // Two glowing "eyes"
    gfx.fillStyle(color, 0.9);
    gfx.fillCircle(cx - 6, cy - 3, 4);
    gfx.fillCircle(cx + 6, cy - 3, 4);
    gfx.fillStyle(0xffffff, 0.5);
    gfx.fillCircle(cx - 5, cy - 4, 1.5);
    gfx.fillCircle(cx + 7, cy - 4, 1.5);

    gfx.generateTexture(key, SIZE, SIZE);
    gfx.destroy();
  }

  // ── Persona textures ──────────────────────────────────────────────────────

  static createPersonaTextures(scene: Phaser.Scene): void {
    if (!scene.textures.exists("persona_male_pixel")) {
      const gfx = scene.add.graphics();
      AssetLoader.drawMalePersona(gfx);
      gfx.generateTexture("persona_male_pixel", 32, 48);
      gfx.destroy();
    }
    if (!scene.textures.exists("persona_female_pixel")) {
      const gfx = scene.add.graphics();
      AssetLoader.drawFemalePersona(gfx);
      gfx.generateTexture("persona_female_pixel", 32, 48);
      gfx.destroy();
    }
  }

  // ── Male persona ──────────────────────────────────────────────────────────
  //  Enhanced with better shading, detail, and modern pixel art techniques

  private static drawMalePersona(gfx: Phaser.GameObjects.Graphics): void {
    const HAIR = 0x4A2C6E;
    const HAIR_HL = 0x9B7FD4;
    const HAIR_DK = 0x2A1A4E;
    const SKIN = 0xFFD4A3;
    const SKIN_SH = 0xE8A87C;
    const SKIN_HL = 0xFFF5E6;
    const SKIN_DK = 0xC88A5C;
    const EYE = 0x1A1A2E;
    const EYE_SH = 0xFFFFFF;
    const ELID = 0xE8A87C;
    const SHIRT = 0x5AA0E9;
    const SHIRT_SH = 0x3B7FBE;
    const SHIRT_DT = 0x8CCBFF;
    const SHIRT_MID = 0x4A90D9;
    const BELT = 0x4B3A2A;
    const BUCKLE = 0xFFD060;
    const BUCKLE_SH = 0xD4A040;
    const PANTS = 0x3C4E70;
    const PANTS_HL = 0x5A7090;
    const PANTS_SH = 0x2A3550;
    const BOOT = 0x3A2A1A;
    const BOOT_HL = 0x6A5040;
    const SOLE = 0x2A1A10;
    const OUTLINE = 0x0A0A18;

    // Enhanced hair with volume
    B(gfx, HAIR, 8, 0, 16, 8);
    B(gfx, HAIR_DK, 8, 0, 2, 7);
    B(gfx, HAIR_DK, 22, 0, 2, 7);
    B(gfx, HAIR_HL, 12, 0, 6, 5);
    P(gfx, HAIR_HL, 14, 1);
    P(gfx, HAIR_HL, 15, 1);
    
    // Enhanced skin with better shading
    B(gfx, SKIN, 9, 5, 14, 12);
    B(gfx, SKIN_SH, 9, 9, 2, 7);
    B(gfx, SKIN_SH, 21, 9, 2, 7);
    B(gfx, SKIN_DK, 9, 12, 1, 4);
    B(gfx, SKIN_DK, 22, 12, 1, 4);
    B(gfx, SKIN_SH, 8, 8, 1, 5);
    B(gfx, SKIN_SH, 23, 8, 1, 5);
    B(gfx, SKIN_HL, 11, 5, 10, 4);
    B(gfx, SKIN_HL, 13, 6, 6, 2);
    
    // Enhanced eyes with detail
    B(gfx, ELID, 11, 7, 2, 1);
    B(gfx, ELID, 19, 7, 2, 1);
    B(gfx, EYE, 11, 8, 2, 2);
    B(gfx, EYE, 19, 8, 2, 2);
    P(gfx, EYE_SH, 12, 8);
    P(gfx, EYE_SH, 20, 8);
    P(gfx, SKIN_SH, 16, 11);
    B(gfx, SKIN_SH, 14, 13, 4, 1);
    
    // Enhanced neck
    B(gfx, SKIN, 13, 17, 6, 3);
    B(gfx, SKIN_SH, 13, 18, 6, 2);
    B(gfx, SKIN_HL, 14, 17, 4, 1);
    
    // Enhanced shirt with better shading
    B(gfx, SHIRT_DT, 7, 18, 18, 1);
    B(gfx, SHIRT, 7, 19, 18, 11);
    B(gfx, SHIRT_SH, 7, 19, 3, 11);
    B(gfx, SHIRT_SH, 22, 19, 3, 11);
    B(gfx, SHIRT_MID, 10, 20, 12, 9);
    B(gfx, SHIRT_SH, 5, 20, 2, 10);
    B(gfx, SHIRT_SH, 25, 20, 2, 10);
    B(gfx, SHIRT_DT, 13, 19, 6, 6);
    B(gfx, SHIRT_DT, 14, 20, 4, 4);
    P(gfx, 0xffffff, 15, 19);
    P(gfx, 0xffffff, 16, 19);
    P(gfx, 0xffffff, 14, 20);
    P(gfx, 0xffffff, 17, 20);
    
    // Enhanced belt
    B(gfx, BELT, 7, 30, 18, 4);
    B(gfx, BUCKLE, 14, 30, 4, 4);
    B(gfx, BUCKLE_SH, 14, 32, 4, 2);
    
    // Enhanced pants
    B(gfx, PANTS, 8, 34, 7, 13);
    B(gfx, PANTS, 17, 34, 7, 13);
    B(gfx, OUTLINE, 15, 34, 2, 13);
    B(gfx, PANTS_SH, 8, 34, 2, 13);
    B(gfx, PANTS_SH, 17, 34, 2, 13);
    B(gfx, PANTS_HL, 12, 38, 2, 5);
    B(gfx, PANTS_HL, 20, 38, 2, 5);
    
    // Enhanced boots
    B(gfx, BOOT, 7, 47, 8, 1);
    B(gfx, BOOT, 17, 47, 8, 1);
    B(gfx, BOOT_HL, 8, 47, 5, 1);
    B(gfx, BOOT_HL, 18, 47, 5, 1);
    B(gfx, SOLE, 7, 48, 8, 0);
    B(gfx, SOLE, 17, 48, 8, 0);
    
    // Enhanced outlines
    B(gfx, OUTLINE, 6, 19, 1, 29);
    B(gfx, OUTLINE, 25, 19, 1, 29);
    B(gfx, OUTLINE, 8, 0, 1, 8);
    B(gfx, OUTLINE, 23, 0, 1, 8);
    B(gfx, OUTLINE, 9, 4, 14, 1);
  }

  // ── Female persona ────────────────────────────────────────────────────────
  //  Enhanced with better shading, detail, and modern pixel art techniques

  private static drawFemalePersona(gfx: Phaser.GameObjects.Graphics): void {
    const HAIR = 0x8B4513;
    const HAIR_HL = 0xD4955F;
    const HAIR_MID = 0xB8733D;
    const HAIR_ACC = 0xFFD060;
    const SKIN = 0xFFD4A3;
    const SKIN_SH = 0xE8A87C;
    const SKIN_HL = 0xFFF5E6;
    const SKIN_DK = 0xC88A5C;
    const EYE = 0x1A1A2E;
    const EYE_SH = 0xFFFFFF;
    const BROW = 0xB8733D;
    const ELID = 0xE8A87C;
    const TOP = 0xF07BB8;
    const TOP_SH = 0xC85A97;
    const TOP_AC = 0xFFABD8;
    const TOP_MID = 0xE06BA8;
    const BELT = 0x4B3A2A;
    const BUCKLE = 0xFFD060;
    const BUCKLE_SH = 0xD4A040;
    const PANTS = 0x8B5FAE;
    const PANTS_HL = 0xAB7FCE;
    const PANTS_SH = 0x6B3F8E;
    const BOOT = 0x3A2A1A;
    const BOOT_HL = 0x6A5040;
    const SOLE = 0x2A1A10;
    const OUTLINE = 0x0A0A18;

    // Enhanced hair with volume and flow
    B(gfx, HAIR, 8, 0, 16, 10);
    B(gfx, HAIR_MID, 10, 1, 12, 8);
    B(gfx, HAIR_HL, 19, 0, 4, 9);
    B(gfx, HAIR_HL, 13, 1, 5, 4);
    B(gfx, HAIR, 8, 10, 3, 5);
    B(gfx, HAIR, 21, 10, 3, 5);
    B(gfx, HAIR_MID, 9, 11, 1, 3);
    B(gfx, HAIR_MID, 22, 11, 1, 3);
    P(gfx, HAIR_ACC, 22, 2);
    P(gfx, HAIR_ACC, 23, 2);
    P(gfx, HAIR_ACC, 22, 3);
    
    // Enhanced skin with better shading
    B(gfx, SKIN, 9, 7, 14, 12);
    B(gfx, SKIN_SH, 9, 11, 2, 7);
    B(gfx, SKIN_SH, 21, 11, 2, 7);
    B(gfx, SKIN_DK, 9, 14, 1, 4);
    B(gfx, SKIN_DK, 22, 14, 1, 4);
    B(gfx, SKIN_SH, 8, 10, 1, 5);
    B(gfx, SKIN_SH, 23, 10, 1, 5);
    B(gfx, SKIN_HL, 11, 7, 10, 4);
    B(gfx, SKIN_HL, 13, 8, 6, 2);
    
    // Enhanced eyebrows and eyes
    B(gfx, BROW, 11, 9, 2, 1);
    B(gfx, BROW, 19, 9, 2, 1);
    B(gfx, ELID, 11, 10, 2, 1);
    B(gfx, ELID, 19, 10, 2, 1);
    B(gfx, EYE, 11, 11, 2, 2);
    B(gfx, EYE, 19, 11, 2, 2);
    P(gfx, EYE_SH, 12, 11);
    P(gfx, EYE_SH, 20, 11);
    P(gfx, SKIN_SH, 16, 14);
    B(gfx, SKIN_SH, 14, 16, 4, 1);
    
    // Enhanced neck
    B(gfx, SKIN, 13, 19, 6, 3);
    B(gfx, SKIN_SH, 13, 20, 6, 2);
    B(gfx, SKIN_HL, 14, 19, 4, 1);
    
    // Enhanced top with better shading
    B(gfx, TOP_AC, 7, 20, 18, 1);
    B(gfx, TOP, 7, 21, 18, 11);
    B(gfx, TOP_SH, 7, 21, 3, 11);
    B(gfx, TOP_SH, 22, 21, 3, 11);
    B(gfx, TOP_MID, 10, 22, 12, 9);
    B(gfx, TOP_SH, 5, 22, 2, 10);
    B(gfx, TOP_SH, 25, 22, 2, 10);
    B(gfx, TOP_AC, 13, 21, 6, 6);
    B(gfx, TOP_AC, 14, 22, 4, 4);
    P(gfx, SKIN, 15, 21);
    P(gfx, SKIN, 16, 21);
    P(gfx, SKIN, 14, 22);
    P(gfx, SKIN, 17, 22);
    
    // Enhanced belt
    B(gfx, BELT, 7, 32, 18, 4);
    B(gfx, BUCKLE, 14, 32, 4, 4);
    B(gfx, BUCKLE_SH, 14, 34, 4, 2);
    
    // Enhanced pants
    B(gfx, PANTS, 8, 36, 7, 12);
    B(gfx, PANTS, 17, 36, 7, 12);
    B(gfx, OUTLINE, 15, 36, 2, 12);
    B(gfx, PANTS_SH, 8, 36, 2, 12);
    B(gfx, PANTS_SH, 17, 36, 2, 12);
    B(gfx, PANTS_HL, 12, 40, 2, 5);
    B(gfx, PANTS_HL, 20, 40, 2, 5);
    
    // Enhanced boots
    B(gfx, BOOT, 7, 48, 8, 0);
    B(gfx, BOOT, 17, 48, 8, 0);
    B(gfx, BOOT_HL, 8, 48, 5, 0);
    B(gfx, BOOT_HL, 18, 48, 5, 0);
    B(gfx, SOLE, 7, 48, 8, 0);
    B(gfx, SOLE, 17, 48, 8, 0);
    
    // Enhanced outlines
    B(gfx, OUTLINE, 6, 21, 1, 27);
    B(gfx, OUTLINE, 25, 21, 1, 27);
    B(gfx, OUTLINE, 8, 0, 1, 10);
    B(gfx, OUTLINE, 23, 0, 1, 10);
    B(gfx, OUTLINE, 9, 6, 14, 1);
  }

  // ── Decoration ────────────────────────────────────────────────────────────

  private static createVentTexture(scene: Phaser.Scene): void {
    const gfx = scene.add.graphics();
    const size = 64;
    gfx.fillStyle(C.surface, 1);
    gfx.fillRoundedRect(0, 0, size, size, 10);
    gfx.lineStyle(2, C.indigo, 0.5);
    gfx.strokeRoundedRect(0, 0, size, size, 10);
    gfx.fillStyle(C.bg, 1);
    gfx.fillRect(8, 8, size - 16, size - 16);
    gfx.lineStyle(3, C.slate, 0.7);
    for (let i = 16; i < size - 8; i += 12) {
      gfx.lineBetween(12, i, size - 12, i);
    }
    gfx.generateTexture("skeld_vent", size, size);
    gfx.destroy();
  }

  private static createTableTexture(scene: Phaser.Scene): void {
    const gfx = scene.add.graphics();
    const w = 100,
      h = 60;
    gfx.fillStyle(C.surface, 1);
    gfx.fillRect(0, 0, w, h);
    gfx.lineStyle(2, C.indigo, 0.4);
    gfx.strokeRect(0, 0, w, h);
    gfx.fillStyle(C.indigo, 0.6);
    gfx.fillCircle(10, 10, 4);
    gfx.fillCircle(w - 10, 10, 4);
    gfx.fillCircle(10, h - 10, 4);
    gfx.fillCircle(w - 10, h - 10, 4);
    gfx.generateTexture("skeld_table", w, h);
    gfx.destroy();
  }
}
