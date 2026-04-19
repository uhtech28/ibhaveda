/**
 * asset-loader.ts
 *
 * Programmatic Phaser texture creation for Interactive Ideas — Week 1.
 *
 * All game textures are painted at runtime via Phaser's Graphics API so that
 * zero external image files are required during Week 1 development.
 *
 * Call `AssetLoader.createAllTextures(scene)` from your Scene's `create()`
 * method before any sprites are instantiated.
 *
 * ─── Texture registry ────────────────────────────────────────────────────────
 *  Checkpoints : cp_locked | cp_active | cp_in_progress | cp_completed | cp_gold
 *  Personas    : persona_male | persona_female   (32×48 px pixel art)
 *  Tiles       : path_tile                       (32×32 px)
 *  Particles   : particle_glow                   (16×16 px)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import Phaser from "phaser";

// ─────────────────────────────────────────────────────────────────────────────
// Module-level draw helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fill a solid rectangular block on a Graphics object.
 * @param gfx   Target Graphics instance.
 * @param color 24-bit packed RGB integer, e.g. `0xFF0000`.
 * @param x     Left edge (pixels).
 * @param y     Top edge (pixels).
 * @param w     Width in pixels.
 * @param h     Height in pixels.
 * @param alpha Optional opacity, 0–1. Default `1`.
 */
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

/**
 * Fill a single 1×1 pixel on a Graphics object.
 * @param gfx   Target Graphics instance.
 * @param color 24-bit packed RGB integer.
 * @param x     Column (pixel).
 * @param y     Row (pixel).
 */
function P(
  gfx: Phaser.GameObjects.Graphics,
  color: number,
  x: number,
  y: number,
): void {
  gfx.fillStyle(color, 1);
  gfx.fillRect(x, y, 1, 1);
}

/**
 * Compute the vertices of an N-pointed star polygon.
 *
 * Returns alternating outer-radius / inner-radius vertices, starting at
 * the 12-o'clock position (−90° from the positive X axis).
 *
 * @param cx      Centre X.
 * @param cy      Centre Y.
 * @param points  Number of star points (e.g. 5 for a standard star).
 * @param outerR  Outer (tip) radius.
 * @param innerR  Inner (valley) radius.
 */
function starPolygon(
  cx: number,
  cy: number,
  points: number,
  outerR: number,
  innerR: number,
): { x: number; y: number }[] {
  const verts: { x: number; y: number }[] = [];
  const total = points * 2;
  for (let i = 0; i < total; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    verts.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
  }
  return verts;
}

// ─────────────────────────────────────────────────────────────────────────────
// AssetLoader
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Static factory that generates all programmatic Phaser textures.
 *
 * @example
 * // In your Scene's create():
 * AssetLoader.createAllTextures(this);
 */
export class AssetLoader {
  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Creates every texture group in one call.
   * Safe to call multiple times — existing textures will be overwritten.
   */
  static createAllTextures(scene: Phaser.Scene): void {
    AssetLoader.createCheckpointTextures(scene);
    AssetLoader.createPersonaTextures(scene);
    AssetLoader.createPathTextures(scene);
    AssetLoader.createParticleTextures(scene);
    AssetLoader.createDecorationTextures(scene);
  }

  /**
   * Preloads external image assets that cannot be generated procedurally
   */
  static preloadAssets(scene: Phaser.Scene): void {
    scene.load.image("skeld_floor", "/assets/skeld/floor.png");
    scene.load.image("guide_male", "/assets/skeld/guide_male.png");
    scene.load.image("guide_female", "/assets/skeld/guide_female.png");
  }

  // ── Checkpoint textures ────────────────────────────────────────────────────

  /**
   * Creates five 64×64 checkpoint node textures:
   * `cp_locked` | `cp_active` | `cp_in_progress` | `cp_completed` | `cp_gold`
   */
  static createCheckpointTextures(scene: Phaser.Scene): void {
    AssetLoader.createLockedTexture(scene);
    AssetLoader.createActiveTexture(scene);
    AssetLoader.createInProgressTexture(scene);
    AssetLoader.createCompletedTexture(scene);
    AssetLoader.createGoldTexture(scene);
  }

  // ── Checkpoint: cp_locked ──────────────────────────────────────────────────

  /**
   * **cp_locked** — 48×48
   * Gray square with lock icon (Among Us task style)
   */
  private static createLockedTexture(scene: Phaser.Scene): void {
    const gfx = scene.add.graphics();
    const size = 48;

    // Main square background
    gfx.fillStyle(0x4a5a62, 1);
    gfx.fillRoundedRect(0, 0, size, size, 8);

    // Border
    gfx.lineStyle(2, 0x6b7b82, 1);
    gfx.strokeRoundedRect(0, 0, size, size, 8);

    // Lock icon - shackle
    gfx.lineStyle(3, 0xffffff, 1);
    gfx.strokeCircle(size / 2, size / 2 - 4, 8);

    // Lock icon - body
    gfx.fillStyle(0xffffff, 1);
    gfx.fillRect(size / 2 - 6, size / 2 + 4, 12, 10);

    gfx.generateTexture("cp_locked", size, size);
    gfx.destroy();
  }

  // ── Checkpoint: cp_active ──────────────────────────────────────────────────

  /**
   * **cp_active** — 48×48
   * Yellow/orange task icon with exclamation mark (Among Us style)
   */
  private static createActiveTexture(scene: Phaser.Scene): void {
    const gfx = scene.add.graphics();
    const size = 48;

    // Main orange/yellow square
    gfx.fillStyle(0xf39c12, 1);
    gfx.fillRoundedRect(0, 0, size, size, 8);

    // Bright border
    gfx.lineStyle(3, 0xffd93d, 1);
    gfx.strokeRoundedRect(0, 0, size, size, 8);

    // Exclamation mark - line
    gfx.fillStyle(0xffffff, 1);
    gfx.fillRect(size / 2 - 3, 12, 6, 18);

    // Exclamation mark - dot
    gfx.fillCircle(size / 2, 36, 3);

    gfx.generateTexture("cp_active", size, size);
    gfx.destroy();
  }

  // ── Checkpoint: cp_in_progress ─────────────────────────────────────────────

  /**
   * **cp_in_progress** — 48×48
   * Orange progress square with star (Among Us task style)
   */
  private static createInProgressTexture(scene: Phaser.Scene): void {
    const gfx = scene.add.graphics();
    const size = 48;

    // Main orange square
    gfx.fillStyle(0xf59e0b, 1);
    gfx.fillRoundedRect(0, 0, size, size, 8);

    // Progress indicator (lighter overlay on right half)
    gfx.fillStyle(0xfcd34d, 0.5);
    gfx.fillRoundedRect(size / 2, 0, size / 2, size, 8);

    // Border
    gfx.lineStyle(2, 0xffa500, 1);
    gfx.strokeRoundedRect(0, 0, size, size, 8);

    // Star in center
    AssetLoader.drawStar(gfx, size / 2, size / 2, 5, 8, 4, 0xffffff);

    gfx.generateTexture("cp_in_progress", size, size);
    gfx.destroy();
  }

  // ── Checkpoint: cp_completed ───────────────────────────────────────────────

  /**
   * **cp_completed** — 48×48
   * Green checkmark square (Among Us task style)
   */
  private static createCompletedTexture(scene: Phaser.Scene): void {
    const gfx = scene.add.graphics();
    const size = 48;

    // Main green square
    gfx.fillStyle(0x27ae60, 1);
    gfx.fillRoundedRect(0, 0, size, size, 8);

    // Border
    gfx.lineStyle(2, 0x2ecc71, 1);
    gfx.strokeRoundedRect(0, 0, size, size, 8);

    // Big checkmark
    gfx.lineStyle(4, 0xffffff, 1);
    gfx.beginPath();
    gfx.moveTo(12, size / 2);
    gfx.lineTo(size / 2 - 4, size - 14);
    gfx.lineTo(size - 12, 14);
    gfx.strokePath();

    gfx.generateTexture("cp_completed", size, size);
    gfx.destroy();
  }

  // ── Checkpoint: cp_gold ────────────────────────────────────────────────────

  /**
   * **cp_gold** — 48×48
   * Golden star task square (Among Us style)
   */
  private static createGoldTexture(scene: Phaser.Scene): void {
    const gfx = scene.add.graphics();
    const size = 48;

    // Main gold square
    gfx.fillStyle(0xf1c40f, 1);
    gfx.fillRoundedRect(0, 0, size, size, 8);

    // Border glow
    gfx.lineStyle(3, 0xffd700, 1);
    gfx.strokeRoundedRect(0, 0, size, size, 8);

    // Star in center
    AssetLoader.drawStar(gfx, size / 2, size / 2, 5, 12, 6, 0xffffff);

    // Corner sparkles
    gfx.fillStyle(0xffffff, 0.8);
    gfx.fillCircle(8, 8, 2);
    gfx.fillCircle(size - 8, 8, 2);
    gfx.fillCircle(8, size - 8, 2);
    gfx.fillCircle(size - 8, size - 8, 2);

    gfx.generateTexture("cp_gold", size, size);
    gfx.destroy();
  }

  /**
   * Draw a star shape at specified position
   */
  private static drawStar(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    points: number,
    outer: number,
    inner: number,
    color: number,
  ): void {
    g.fillStyle(color, 1);
    g.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outer : inner;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.closePath();
    g.fillPath();
  }

  /**
   * Draw a crown shape at specified position
   */
  private static drawCrown(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    color: number,
  ): void {
    g.fillStyle(color, 1);
    g.fillTriangle(x - 8, y, x - 6, y - 8, x - 4, y);
    g.fillTriangle(x - 2, y, x, y - 10, x + 2, y);
    g.fillTriangle(x + 4, y, x + 6, y - 8, x + 8, y);
    g.fillRect(x - 10, y, 20, 4);
  }

  // ── Persona textures ───────────────────────────────────────────────────────

  /**
   * Creates two 32×48 pixel-art persona sprites:
   * - `persona_male`   — "The Founder" (purple/indigo theme)
   * - `persona_female` — "The Visionary" (cyan/pink theme)
   *
   * Intended to be rendered at 3× scale → 96×144 display pixels.
   */
  static createPersonaTextures(scene: Phaser.Scene): void {
    // Note: Persona textures are now loaded from external files via preloadAssets()
    // but we keep these as fallbacks or for legacy support if needed.
    // However, the main Persona class will now prefer the loaded images.

    // Male ─────────────────────────────────────────────────────────────────
    if (!scene.textures.exists("persona_male_pixel")) {
      const gfx = scene.add.graphics();
      AssetLoader.drawMalePersona(gfx);
      gfx.generateTexture("persona_male_pixel", 32, 48);
      gfx.destroy();
    }

    // Female ───────────────────────────────────────────────────────────────
    if (!scene.textures.exists("persona_female_pixel")) {
      const gfx = scene.add.graphics();
      AssetLoader.drawFemalePersona(gfx);
      gfx.generateTexture("persona_female_pixel", 32, 48);
      gfx.destroy();
    }
  }

  // ── Persona: Male "The Founder" ────────────────────────────────────────────

  /**
   * Paints the male "Founder" pixel-art sprite onto `gfx` at origin (0, 0).
   *
   * Layout (32 × 48 px):
   * ```
   * Rows  0– 6  Hair
   * Rows  4–14  Head / face  (overlaps hair bottom)
   * Rows 15–25  Shirt        (purple)
   * Rows 26–28  Belt + buckle
   * Rows 29–40  Pants        (dark navy)
   * Rows 41–47  Boots        (brown)
   * ```
   *
   * All drawing is done with `fillRect` (block fills for large areas,
   * single-pixel calls for fine details such as eye shine and mouth).
   */
  private static drawMalePersona(gfx: Phaser.GameObjects.Graphics): void {
    // ── Palette ─────────────────────────────────────────────────────────────
    const HAIR = 0x1e1b4b; // dark indigo
    const HAIR_HL = 0x4f46e5; // side-part highlight
    const SKIN = 0xffdcab;
    const SKIN_SH = 0xd4a373; // face shadow / ear / nose
    const EYE = 0x111827; // dark iris
    const EYE_SH = 0xf8fafc; // eye shine pixel
    const SHIRT = 0x7c3aed; // purple
    const SHIRT_SH = 0x5b21b6; // shirt depth shadow
    const SHIRT_DT = 0xc4b5fd; // shirt shoulder highlight
    const BELT = 0x78350f; // dark brown
    const BUCKLE = 0xf59e0b; // gold
    const PANTS = 0x1e1b4b; // dark navy
    const PANTS_HL = 0x3730a3; // knee highlight
    const BOOT = 0x92400e; // warm brown
    const SOLE = 0x451a03; // very dark brown
    const OUTLINE = 0x0a0a14; // near-black

    // ── Hair (rows 0–6) ─────────────────────────────────────────────────────
    // Main hair block — slightly wider than the face
    B(gfx, HAIR, 8, 0, 16, 7); // x 8..23, y 0..6
    // Side-part highlight (left-of-centre stripe, rows 0–4)
    B(gfx, HAIR_HL, 12, 0, 3, 5);

    // ── Head / face (rows 4–14) ─────────────────────────────────────────────
    // Face skin — overwrites the bottom 3 rows of the hair block in the centre
    B(gfx, SKIN, 9, 4, 14, 11); // x 9..22, y 4..14
    // Shadow on the cheek sides
    B(gfx, SKIN_SH, 9, 8, 2, 6); // left cheek shadow
    B(gfx, SKIN_SH, 21, 8, 2, 6); // right cheek shadow
    // Ears (1 px outside face, sits at hair-bottom level)
    B(gfx, SKIN_SH, 8, 7, 1, 4); // left ear
    B(gfx, SKIN_SH, 23, 7, 1, 4); // right ear

    // ── Eyes (rows 7–8) ─────────────────────────────────────────────────────
    B(gfx, EYE, 11, 7, 2, 2); // left eye
    B(gfx, EYE, 19, 7, 2, 2); // right eye
    P(gfx, EYE_SH, 12, 7); // left shine  (top-right corner of eye)
    P(gfx, EYE_SH, 20, 7); // right shine

    // ── Nose + mouth ────────────────────────────────────────────────────────
    P(gfx, SKIN_SH, 16, 10); // nose tip (single shadow pixel)
    B(gfx, SKIN_SH, 14, 12, 4, 1); // mouth line

    // ── Neck (rows 15–16) ───────────────────────────────────────────────────
    B(gfx, SKIN, 13, 15, 6, 2);

    // ── Shirt (rows 15–25) ──────────────────────────────────────────────────
    B(gfx, SHIRT_DT, 7, 15, 18, 1); // shoulder highlight stripe (top)
    B(gfx, SHIRT, 7, 16, 18, 10); // main shirt body  x 7..24, y 16..25
    B(gfx, SHIRT_SH, 7, 16, 3, 10); // left depth shadow
    B(gfx, SHIRT_SH, 22, 16, 3, 10); // right depth shadow
    // Arms (extend 2 px beyond shirt body at mid-height)
    B(gfx, SHIRT_SH, 5, 17, 2, 9); // left arm
    B(gfx, SHIRT_SH, 25, 17, 2, 9); // right arm
    // White collar V-shape (two pixels per side, spreading downward)
    P(gfx, 0xffffff, 15, 16);
    P(gfx, 0xffffff, 16, 16);
    P(gfx, 0xffffff, 14, 17);
    P(gfx, 0xffffff, 17, 17);

    // ── Belt (rows 26–28) ───────────────────────────────────────────────────
    B(gfx, BELT, 7, 26, 18, 3); // belt body
    B(gfx, BUCKLE, 14, 26, 4, 3); // centre gold buckle

    // ── Pants / legs (rows 29–40) ───────────────────────────────────────────
    B(gfx, PANTS, 8, 29, 7, 12); // left leg   x  8..14
    B(gfx, PANTS, 17, 29, 7, 12); // right leg  x 17..23
    B(gfx, OUTLINE, 15, 29, 2, 12); // inner-leg gap / deep shadow
    // Knee highlights
    B(gfx, PANTS_HL, 11, 35, 2, 3); // left knee
    B(gfx, PANTS_HL, 19, 35, 2, 3); // right knee

    // ── Boots (rows 41–47) ──────────────────────────────────────────────────
    // Boots extend 1 px beyond the leg width on each outer edge
    B(gfx, BOOT, 7, 41, 8, 6); // left boot
    B(gfx, BOOT, 17, 41, 8, 6); // right boot
    B(gfx, SOLE, 7, 47, 8, 1); // left sole
    B(gfx, SOLE, 17, 47, 8, 1); // right sole

    // ── Silhouette outline touches ───────────────────────────────────────────
    // Left and right body edges add depth against light backgrounds
    B(gfx, OUTLINE, 6, 16, 1, 32); // left body outline
    B(gfx, OUTLINE, 25, 16, 1, 32); // right body outline
    // Hair top edge
    B(gfx, OUTLINE, 8, 0, 1, 7); // left hair edge
    B(gfx, OUTLINE, 23, 0, 1, 7); // right hair edge
    // Head top
    B(gfx, OUTLINE, 9, 3, 14, 1); // crown
  }

  // ── Persona: Female "The Visionary" ───────────────────────────────────────

  /**
   * Paints the female "Visionary" pixel-art sprite onto `gfx` at origin (0, 0).
   *
   * Layout (32 × 48 px):
   * ```
   * Rows  0– 8  Hair (2 rows longer than male, with side-swept look)
   * Rows  6–16  Head / face
   * Rows 17–27  Top / shirt  (cyan)
   * Rows 28–30  Belt + buckle
   * Rows 31–41  Pants        (purple)
   * Rows 42–47  Boots        (dark purple)
   * ```
   *
   * Notable additions vs the male:
   * - Pink eyebrows (1 px, row 9)
   * - Gold star hair accessory at (22, 2)
   * - Light-pink highlight stripe in hair (right side)
   * - Longer side locks hanging below the main hair block
   */
  private static drawFemalePersona(gfx: Phaser.GameObjects.Graphics): void {
    // ── Palette ─────────────────────────────────────────────────────────────
    const HAIR = 0xdb2777; // hot pink
    const HAIR_HL = 0xf9a8d4; // light pink highlight
    const HAIR_ACC = 0xf59e0b; // gold star accessory
    const SKIN = 0xffdcab;
    const SKIN_SH = 0xd4a373;
    const EYE = 0x111827;
    const EYE_SH = 0xf8fafc;
    const BROW = 0xdb2777; // pink eyebrow
    const TOP = 0x0ea5e9; // sky blue
    const TOP_SH = 0x0369a1; // top shadow
    const TOP_AC = 0x7dd3fc; // top shoulder accent
    const BELT = 0x78350f;
    const BUCKLE = 0xf59e0b;
    const PANTS = 0x7c3aed; // purple
    const PANTS_HL = 0xa78bfa; // purple highlight
    const BOOT = 0x4c1d95; // dark purple
    const SOLE = 0x2e1065;
    const OUTLINE = 0x0a0a14;

    // ── Hair (rows 0–8) — 2 rows taller than male ──────────────────────────
    B(gfx, HAIR, 8, 0, 16, 9); // main hot-pink block  x 8..23, y 0..8
    B(gfx, HAIR_HL, 19, 0, 4, 8); // light-pink highlight stripe (right side)
    // Side locks that hang below the main block
    B(gfx, HAIR, 8, 9, 3, 4); // left side lock
    B(gfx, HAIR, 21, 9, 3, 4); // right side lock
    // Gold star hair accessory (row 2, near right shoulder region)
    P(gfx, HAIR_ACC, 22, 2);

    // ── Head / face (rows 6–16) ─────────────────────────────────────────────
    B(gfx, SKIN, 9, 6, 14, 11); // face skin  y 6..16
    B(gfx, SKIN_SH, 9, 10, 2, 6); // left cheek shadow
    B(gfx, SKIN_SH, 21, 10, 2, 6); // right cheek shadow
    B(gfx, SKIN_SH, 8, 9, 1, 4); // left ear
    B(gfx, SKIN_SH, 23, 9, 1, 4); // right ear

    // ── Eyebrows (row 8) — pink, 1 px tall ──────────────────────────────────
    B(gfx, BROW, 11, 8, 2, 1); // left eyebrow
    B(gfx, BROW, 19, 8, 2, 1); // right eyebrow

    // ── Eyes (rows 9–10) ────────────────────────────────────────────────────
    B(gfx, EYE, 11, 9, 2, 2);
    B(gfx, EYE, 19, 9, 2, 2);
    P(gfx, EYE_SH, 12, 9);
    P(gfx, EYE_SH, 20, 9);

    // ── Nose + mouth ────────────────────────────────────────────────────────
    P(gfx, SKIN_SH, 16, 12); // nose tip
    B(gfx, SKIN_SH, 14, 14, 4, 1); // mouth line

    // ── Neck (rows 17–18) ───────────────────────────────────────────────────
    B(gfx, SKIN, 13, 17, 6, 2);

    // ── Top / shirt (rows 17–27) ────────────────────────────────────────────
    B(gfx, TOP_AC, 7, 17, 18, 1); // shoulder accent line (lighter cyan)
    B(gfx, TOP, 7, 18, 18, 10); // main top body
    B(gfx, TOP_SH, 7, 18, 3, 10); // left depth shadow
    B(gfx, TOP_SH, 22, 18, 3, 10); // right depth shadow
    // Arms
    B(gfx, TOP_SH, 5, 19, 2, 9); // left arm
    B(gfx, TOP_SH, 25, 19, 2, 9); // right arm
    // Open collar (skin pixels at neckline)
    P(gfx, SKIN, 15, 18);
    P(gfx, SKIN, 16, 18);
    P(gfx, SKIN, 14, 19);
    P(gfx, SKIN, 17, 19);

    // ── Belt (rows 28–30) ───────────────────────────────────────────────────
    B(gfx, BELT, 7, 28, 18, 3);
    B(gfx, BUCKLE, 14, 28, 4, 3);

    // ── Pants / legs (rows 31–41) ───────────────────────────────────────────
    B(gfx, PANTS, 8, 31, 7, 11); // left leg
    B(gfx, PANTS, 17, 31, 7, 11); // right leg
    B(gfx, OUTLINE, 15, 31, 2, 11); // inner-leg shadow
    B(gfx, PANTS_HL, 11, 37, 2, 3); // left knee highlight
    B(gfx, PANTS_HL, 19, 37, 2, 3); // right knee highlight

    // ── Boots (rows 42–47) ──────────────────────────────────────────────────
    B(gfx, BOOT, 7, 42, 8, 5); // left boot
    B(gfx, BOOT, 17, 42, 8, 5); // right boot
    B(gfx, SOLE, 7, 47, 8, 1); // left sole
    B(gfx, SOLE, 17, 47, 8, 1); // right sole

    // ── Silhouette outline touches ───────────────────────────────────────────
    B(gfx, OUTLINE, 6, 18, 1, 30); // left body edge
    B(gfx, OUTLINE, 25, 18, 1, 30); // right body edge
    B(gfx, OUTLINE, 8, 0, 1, 9); // left hair edge
    B(gfx, OUTLINE, 23, 0, 1, 9); // right hair edge
    B(gfx, OUTLINE, 9, 5, 14, 1); // crown top
  }

  // ── Path tile texture ──────────────────────────────────────────────────────

  /**
   * Creates **path_tile** — a 32×32 dirt/road tile.
   *
   * Features a warm brown base with a lighter centre lane and random pebble
   * details for visual texture.
   */
  static createPathTextures(scene: Phaser.Scene): void {
    const gfx = scene.add.graphics();

    // Base road colour
    gfx.fillStyle(0x92400e);
    gfx.fillRect(0, 0, 32, 32);

    // Slightly lighter centre lane
    gfx.fillStyle(0xa16207, 0.5);
    gfx.fillRect(4, 0, 24, 32);

    // Edge trim (dark border strips)
    gfx.fillStyle(0x78350f);
    gfx.fillRect(0, 0, 3, 32);
    gfx.fillRect(29, 0, 3, 32);

    // Subtle pebble specks for texture
    gfx.fillStyle(0x6b4f3a, 0.8);
    const pebbles: [number, number][] = [
      [5, 4],
      [13, 8],
      [22, 5],
      [8, 17],
      [19, 22],
      [26, 13],
      [3, 27],
      [14, 29],
      [10, 14],
      [25, 20],
    ];
    for (const [px, py] of pebbles) {
      gfx.fillRect(px, py, 2, 2);
    }

    gfx.generateTexture("path_tile", 32, 32);
    gfx.destroy();
  }

  // ── Particle glow texture ──────────────────────────────────────────────────

  /**
   * Creates **particle_glow** — a 16×16 soft radial glow texture.
   *
   * Built from five concentric white circles with increasing opacity toward
   * the centre, producing a smooth falloff suitable for particle emitters.
   */
  static createParticleTextures(scene: Phaser.Scene): void {
    const gfx = scene.add.graphics();
    const SIZE = 16;
    const CX = SIZE / 2;
    const CY = SIZE / 2;

    // Concentric layers: outer → inner, increasing alpha
    const layers: { r: number; alpha: number }[] = [
      { r: 8.0, alpha: 0.1 },
      { r: 6.0, alpha: 0.25 },
      { r: 4.0, alpha: 0.5 },
      { r: 2.5, alpha: 0.78 },
      { r: 1.2, alpha: 1.0 },
    ];

    for (const layer of layers) {
      gfx.fillStyle(0xffffff, layer.alpha);
      gfx.fillCircle(CX, CY, layer.r);
    }

    gfx.generateTexture("particle_glow", SIZE, SIZE);
    gfx.destroy();
  }

  // ── Decoration textures ────────────────────────────────────────────────────

  /**
   * Creates miscellaneous Skeld textures:
   * `skeld_vent` | `skeld_table` | `skeld_crate`
   */
  static createDecorationTextures(scene: Phaser.Scene): void {
    AssetLoader.createVentTexture(scene);
    AssetLoader.createTableTexture(scene);
  }

  /**
   * **skeld_vent** — 64×64
   * Rounded rectangle with dark gray metallic slats
   */
  private static createVentTexture(scene: Phaser.Scene): void {
    const gfx = scene.add.graphics();
    const size = 64;

    // Outer frame
    gfx.fillStyle(0x3e4a50, 1);
    gfx.fillRoundedRect(0, 0, size, size, 10);
    gfx.lineStyle(2, 0x5f6f75, 1);
    gfx.strokeRoundedRect(0, 0, size, size, 10);

    // Dark inner area
    gfx.fillStyle(0x1a1a1a, 1);
    gfx.fillRect(8, 8, size - 16, size - 16);

    // Slats
    gfx.lineStyle(4, 0x4a5a62, 1);
    for (let i = 16; i < size - 8; i += 12) {
      gfx.lineBetween(12, i, size - 12, i);
    }

    gfx.generateTexture("skeld_vent", size, size);
    gfx.destroy();
  }

  /**
   * **skeld_table** — 100×60
   * Rectangular metallic table with rivets
   */
  private static createTableTexture(scene: Phaser.Scene): void {
    const gfx = scene.add.graphics();
    const w = 100;
    const h = 60;

    // Table top
    gfx.fillStyle(0x6b7b82, 1);
    gfx.fillRect(0, 0, w, h);

    // Beveled edge
    gfx.lineStyle(4, 0x8b9aa3, 0.8);
    gfx.strokeRect(0, 0, w, h);

    // Rivets in corners
    gfx.fillStyle(0x4a5a62, 1);
    gfx.fillCircle(10, 10, 4);
    gfx.fillCircle(w - 10, 10, 4);
    gfx.fillCircle(10, h - 10, 4);
    gfx.fillCircle(w - 10, h - 10, 4);

    gfx.generateTexture("skeld_table", w, h);
    gfx.destroy();
  }
}
