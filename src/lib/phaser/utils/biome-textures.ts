// /**
//  * biome-textures.ts
//  *
//  * Pirate Island Hopping biome texture generators for the world map.
//  * Vibrant tropical ocean theme matching the reference image.
//  */

// import * as Phaser from "phaser";

// /**
//  * Biome color palettes - tropical pirate island theme
//  */
// export const BIOME_PALETTES = {
//   garage: {
//     primary: 0x1ab8cc,    // Tropical ocean blue
//     secondary: 0x22d3ee,  // Lighter ocean
//     accent: 0xf59e0b,     // Sandy gold accent
//     path: 0x92400e,       // Wooden bridge brown
//     decoration: 0x16a34a, // Palm green
//   },
//   summit: {
//     primary: 0x0ea5e9,    // Deeper ocean
//     secondary: 0x38bdf8,  // Lighter water
//     accent: 0xfde68a,     // Gold treasure
//     path: 0x78350f,       // Dark wood
//     decoration: 0x15803d, // Deep green
//   },
// };

// /**
//  * Create all biome tile textures
//  */
// export class BiomeTextureCreator {
//   /**
//    * Create all biome tile sets
//    */
//   static createAllBiomeTiles(scene: Phaser.Scene): void {
//     BiomeTextureCreator.createGarageTiles(scene);
//     BiomeTextureCreator.createSummitTiles(scene);
//   }

//   /**
//    * Ocean Biome - Tropical ocean tile
//    */
//   static createGarageTiles(scene: Phaser.Scene): void {
//     const gfx = scene.add.graphics();
//     const SIZE = 64;

//     // Ocean blue base
//     gfx.fillStyle(0x1ab8cc, 1);
//     gfx.fillRect(0, 0, SIZE, SIZE);

//     // Subtle wave pattern
//     gfx.lineStyle(1, 0x22d3ee, 0.4);
//     gfx.lineBetween(0, 16, SIZE, 16);
//     gfx.lineBetween(0, 32, SIZE, 32);
//     gfx.lineBetween(0, 48, SIZE, 48);

//     // Small foam dots
//     gfx.fillStyle(0xffffff, 0.15);
//     gfx.fillCircle(12, 12, 3);
//     gfx.fillCircle(40, 28, 2);
//     gfx.fillCircle(20, 50, 3);

//     gfx.generateTexture("biome_garage", SIZE, SIZE);
//     gfx.destroy();
//   }

//   /**
//    * Deep Ocean Biome - Slightly darker water
//    */
//   static createSummitTiles(scene: Phaser.Scene): void {
//     const gfx = scene.add.graphics();
//     const SIZE = 64;

//     // Deep ocean blue
//     gfx.fillStyle(0x0891b2, 1);
//     gfx.fillRect(0, 0, SIZE, SIZE);

//     // Wave ripples
//     gfx.lineStyle(1, 0x0ea5e9, 0.5);
//     gfx.lineBetween(0, 20, SIZE, 20);
//     gfx.lineBetween(0, 44, SIZE, 44);

//     // Shark fin hints
//     gfx.fillStyle(0x0369a1, 0.3);
//     gfx.fillTriangle(30, 10, 35, 0, 40, 10);

//     gfx.generateTexture("biome_summit", SIZE, SIZE);
//     gfx.destroy();
//   }

//   /**
//    * Create wooden bridge path texture
//    */
//   static createOrganicPathTextures(scene: Phaser.Scene): void {
//     const gfx = scene.add.graphics();
//     const WIDTH = 64;
//     const HEIGHT = 32;

//     // Wood plank base
//     gfx.fillStyle(0x92400e, 1);
//     gfx.fillRect(0, 0, WIDTH, HEIGHT);

//     // Plank lines
//     gfx.lineStyle(1, 0x78350f, 0.8);
//     gfx.lineBetween(0, HEIGHT / 2, WIDTH, HEIGHT / 2);
//     gfx.lineBetween(16, 0, 16, HEIGHT);
//     gfx.lineBetween(32, 0, 32, HEIGHT);
//     gfx.lineBetween(48, 0, 48, HEIGHT);

//     // Wood grain highlight
//     gfx.fillStyle(0xb45309, 0.4);
//     gfx.fillRect(0, 2, WIDTH, 4);
//     gfx.fillRect(0, 18, WIDTH, 4);

//     gfx.generateTexture("organic_path", WIDTH, HEIGHT);
//     gfx.destroy();
//   }
// }

/**
 * biome-textures.ts
 *
 * Dark Tech Platform biome texture generators for the world map.
 * Theme: Deep Space Navy background · Indigo · Purple · Cyan accents
 *
 * Stage 1 — Ideation Hub  : Indigo hex-grid with circuit nodes
 * Stage 2 — Research Lab  : Purple data-stream with graph nodes
 */

import * as Phaser from "phaser";

// ─────────────────────────────────────────────────────────────────────────────
// Website color palette — single source of truth
// ─────────────────────────────────────────────────────────────────────────────

export const SITE_COLORS = {
  bg: 0x0f0f1a, // Deep Space Navy — map background
  surface: 0x1a1a2e, // Elevated surface
  surface2: 0x16213e, // Card surface
  indigo: 0x6366f1, // Primary brand
  indigoLight: 0x818cf8, // Indigo light
  indigoGlow: 0x4f46e5, // Indigo deep
  purple: 0x8b5cf6, // Stage 2 accent
  purpleLight: 0xa78bfa, // Purple light
  purpleGlow: 0x7c3aed, // Purple deep
  cyan: 0x06b6d4, // Highlight / connections
  cyanLight: 0x22d3ee, // Cyan light
  amber: 0xf59e0b, // Gold reward state
  amberLight: 0xfcd34d, // Gold light
  white10: 0xffffff, // Used with low alpha
  textMuted: 0x64748b, // Slate-500
};

/**
 * Biome color palettes — keyed to VentureBiome.biomeType
 */
export const BIOME_PALETTES = {
  ideation: {
    primary: SITE_COLORS.indigo,
    secondary: SITE_COLORS.indigoLight,
    glow: SITE_COLORS.indigoGlow,
    bg: SITE_COLORS.bg,
    surface: SITE_COLORS.surface,
    path: SITE_COLORS.cyan,
    decoration: SITE_COLORS.purple,
  },
  research: {
    primary: SITE_COLORS.purple,
    secondary: SITE_COLORS.purpleLight,
    glow: SITE_COLORS.purpleGlow,
    bg: SITE_COLORS.bg,
    surface: SITE_COLORS.surface2,
    path: SITE_COLORS.indigo,
    decoration: SITE_COLORS.cyan,
  },
  // Legacy aliases kept so existing code referencing "garage"/"summit" still resolves
  garage: {
    primary: SITE_COLORS.indigo,
    secondary: SITE_COLORS.indigoLight,
    glow: SITE_COLORS.indigoGlow,
    bg: SITE_COLORS.bg,
    surface: SITE_COLORS.surface,
    path: SITE_COLORS.cyan,
    decoration: SITE_COLORS.purple,
  },
  summit: {
    primary: SITE_COLORS.purple,
    secondary: SITE_COLORS.purpleLight,
    glow: SITE_COLORS.purpleGlow,
    bg: SITE_COLORS.bg,
    surface: SITE_COLORS.surface2,
    path: SITE_COLORS.indigo,
    decoration: SITE_COLORS.cyan,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// BiomeTextureCreator
// ─────────────────────────────────────────────────────────────────────────────

export class BiomeTextureCreator {
  /**
   * Create all biome tile sets
   */
  static createAllBiomeTiles(scene: Phaser.Scene): void {
    BiomeTextureCreator.createIdeationTile(scene);
    BiomeTextureCreator.createResearchTile(scene);
    // legacy keys kept for backward-compat
    BiomeTextureCreator.createLegacyGarageTile(scene);
    BiomeTextureCreator.createLegacySummitTile(scene);
  }

  // ── Stage 1: Ideation — dark navy base + subtle indigo hex grid ──────────

  static createIdeationTile(scene: Phaser.Scene): void {
    const gfx = scene.add.graphics();
    const S = 64;

    // Deep navy base
    gfx.fillStyle(SITE_COLORS.bg, 1);
    gfx.fillRect(0, 0, S, S);

    // Subtle hex-cell outline (just three edges for tileability)
    gfx.lineStyle(1, SITE_COLORS.indigo, 0.18);
    // Horizontal band
    gfx.lineBetween(0, 21, S, 21);
    gfx.lineBetween(0, 42, S, 42);
    // Diagonal slashes for hex flavour
    gfx.lineBetween(0, 0, 21, 42);
    gfx.lineBetween(21, 0, 42, 42);
    gfx.lineBetween(42, 0, 64, 42);

    // Tiny node dot at intersections
    gfx.fillStyle(SITE_COLORS.indigo, 0.35);
    gfx.fillCircle(21, 21, 2);
    gfx.fillCircle(42, 42, 2);
    gfx.fillCircle(42, 0, 2);
    gfx.fillCircle(0, 42, 2);

    gfx.generateTexture("biome_ideation", S, S);
    gfx.destroy();
  }

  // ── Stage 2: Research — dark navy base + purple data-stream lines ────────

  static createResearchTile(scene: Phaser.Scene): void {
    const gfx = scene.add.graphics();
    const S = 64;

    // Dark surface base
    gfx.fillStyle(SITE_COLORS.surface2, 1);
    gfx.fillRect(0, 0, S, S);

    // Horizontal scan-line effect (very subtle)
    gfx.lineStyle(1, SITE_COLORS.purple, 0.12);
    for (let y = 8; y < S; y += 16) {
      gfx.lineBetween(0, y, S, y);
    }

    // Vertical data-column stripes
    gfx.lineStyle(1, SITE_COLORS.purpleLight, 0.08);
    gfx.lineBetween(16, 0, 16, S);
    gfx.lineBetween(32, 0, 32, S);
    gfx.lineBetween(48, 0, 48, S);

    // Graph node dots
    gfx.fillStyle(SITE_COLORS.purple, 0.4);
    gfx.fillCircle(16, 16, 2);
    gfx.fillCircle(48, 48, 2);
    gfx.fillStyle(SITE_COLORS.cyan, 0.3);
    gfx.fillCircle(32, 32, 2);

    gfx.generateTexture("biome_research", S, S);
    gfx.destroy();
  }

  // ── Legacy garage/summit aliases ─────────────────────────────────────────

  static createLegacyGarageTile(scene: Phaser.Scene): void {
    // Just re-use ideation tile under the old key
    const gfx = scene.add.graphics();
    gfx.fillStyle(SITE_COLORS.bg, 1);
    gfx.fillRect(0, 0, 64, 64);
    gfx.lineStyle(1, SITE_COLORS.indigo, 0.15);
    gfx.lineBetween(0, 21, 64, 21);
    gfx.lineBetween(0, 42, 64, 42);
    gfx.generateTexture("biome_garage", 64, 64);
    gfx.destroy();
  }

  static createLegacySummitTile(scene: Phaser.Scene): void {
    const gfx = scene.add.graphics();
    gfx.fillStyle(SITE_COLORS.surface2, 1);
    gfx.fillRect(0, 0, 64, 64);
    gfx.lineStyle(1, SITE_COLORS.purple, 0.12);
    for (let y = 8; y < 64; y += 16) gfx.lineBetween(0, y, 64, y);
    gfx.generateTexture("biome_summit", 64, 64);
    gfx.destroy();
  }

  // ── Organic path texture — cyan glowing circuit trace ────────────────────

  static createOrganicPathTextures(scene: Phaser.Scene): void {
    const gfx = scene.add.graphics();
    const W = 64;
    const H = 32;

    // Transparent base (path drawn procedurally in WorldMapScene)
    gfx.fillStyle(SITE_COLORS.bg, 0);
    gfx.fillRect(0, 0, W, H);

    // Cyan trace line (outer glow)
    gfx.lineStyle(8, SITE_COLORS.cyan, 0.15);
    gfx.lineBetween(0, H / 2, W, H / 2);

    // Core trace
    gfx.lineStyle(3, SITE_COLORS.cyan, 0.7);
    gfx.lineBetween(0, H / 2, W, H / 2);

    // Data-node dots along path
    gfx.fillStyle(SITE_COLORS.cyanLight, 0.9);
    gfx.fillCircle(W / 2, H / 2, 3);

    gfx.generateTexture("organic_path", W, H);
    gfx.destroy();
  }
}
