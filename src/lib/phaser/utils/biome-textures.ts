/**
 * biome-textures.ts
 * 
 * Adventure-style biome texture generators for the 8 stages.
 * Each biome has unique visual characteristics matching the adventure theme.
 */

import Phaser from "phaser";

/**
 * Biome color palettes for consistent theming
 */
export const BIOME_PALETTES = {
  forest: {
    primary: 0x2d5016,    // Deep forest green
    secondary: 0x4a7c2f,  // Grass green
    accent: 0x8bc34a,     // Light green
    path: 0x6b4423,       // Dirt brown
    decoration: 0x1b3a0f, // Dark green
  },
  desert: {
    primary: 0xd4a574,    // Sand
    secondary: 0xc19a6b,  // Dark sand
    accent: 0xf4e4c1,     // Light sand
    path: 0xa67c52,       // Packed sand
    decoration: 0x8b7355, // Rock brown
  },
  dungeon: {
    primary: 0x2c2c3e,    // Dark stone
    secondary: 0x1a1a2e,  // Darker stone
    accent: 0x4a4a6a,     // Light stone
    path: 0x3a3a4a,       // Stone floor
    decoration: 0x5555ff, // Blue crystal
  },
  tundra: {
    primary: 0xe8f4f8,    // Snow white
    secondary: 0xb8d4e8,  // Ice blue
    accent: 0x7fb3d5,     // Deep ice
    path: 0xc8d8e8,       // Packed snow
    decoration: 0x4fc3f7, // Ice crystal
  },
  mine: {
    primary: 0x3e2723,    // Dark rock
    secondary: 0x5d4037,  // Brown rock
    accent: 0xffa726,     // Gem glow (amber)
    path: 0x4e342e,       // Mine floor
    decoration: 0xff6f00, // Orange gem
  },
  harbour: {
    primary: 0x1565c0,    // Deep water
    secondary: 0x1976d2,  // Water
    accent: 0x64b5f6,     // Light water
    path: 0x8d6e63,       // Wooden dock
    decoration: 0x795548, // Wood
  },
  floatingIsle: {
    primary: 0x81c784,    // Sky grass
    secondary: 0x66bb6a,  // Isle green
    accent: 0xe1f5fe,     // Sky blue
    path: 0x9e9e9e,       // Stone path
    decoration: 0xb39ddb, // Purple rune
  },
  capital: {
    primary: 0xffd54f,    // Gold
    secondary: 0xffb300,  // Deep gold
    accent: 0xffe082,     // Light gold
    path: 0xbcaaa4,       // Marble
    decoration: 0xffffff, // White marble
  },
};

/**
 * Create all biome tile textures
 */
export class BiomeTextureCreator {
  /**
   * Create all 8 biome tile sets
   */
  static createAllBiomeTiles(scene: Phaser.Scene): void {
    BiomeTextureCreator.createForestTiles(scene);
    BiomeTextureCreator.createDesertTiles(scene);
    BiomeTextureCreator.createDungeonTiles(scene);
    BiomeTextureCreator.createTundraTiles(scene);
    BiomeTextureCreator.createMineTiles(scene);
    BiomeTextureCreator.createHarbourTiles(scene);
    BiomeTextureCreator.createFloatingIsleTiles(scene);
    BiomeTextureCreator.createCapitalTiles(scene);
  }

  /**
   * Stage 1: Forest - Green grassy area with trees
   */
  static createForestTiles(scene: Phaser.Scene): void {
    const gfx = scene.add.graphics();
    const SIZE = 64;
    const palette = BIOME_PALETTES.forest;

    // Base grass tile
    gfx.fillStyle(palette.primary, 1);
    gfx.fillRect(0, 0, SIZE, SIZE);

    // Grass texture (random blades)
    gfx.fillStyle(palette.secondary, 0.6);
    for (let i = 0; i < 25; i++) {
      const x = Math.random() * SIZE;
      const y = Math.random() * SIZE;
      gfx.fillRect(x, y, 2, 4);
    }

    // Light grass highlights
    gfx.fillStyle(palette.accent, 0.3);
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * SIZE;
      const y = Math.random() * SIZE;
      gfx.fillRect(x, y, 3, 2);
    }

    // Flowers (yellow spots)
    gfx.fillStyle(0xffeb3b, 1);
    for (let i = 0; i < 3; i++) {
      const x = Math.random() * SIZE;
      const y = Math.random() * SIZE;
      gfx.fillCircle(x, y, 2);
    }

    gfx.generateTexture("biome_forest", SIZE, SIZE);
    gfx.destroy();
  }

  /**
   * Stage 2: Desert - Sandy wasteland with rocks
   */
  static createDesertTiles(scene: Phaser.Scene): void {
    const gfx = scene.add.graphics();
    const SIZE = 64;
    const palette = BIOME_PALETTES.desert;

    // Base sand
    gfx.fillStyle(palette.primary, 1);
    gfx.fillRect(0, 0, SIZE, SIZE);

    // Sand texture (darker patches)
    gfx.fillStyle(palette.secondary, 0.5);
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * SIZE;
      const y = Math.random() * SIZE;
      const size = Math.random() * 8 + 4;
      gfx.fillCircle(x, y, size);
    }

    // Light sand highlights
    gfx.fillStyle(palette.accent, 0.4);
    for (let i = 0; i < 10; i++) {
      const x = Math.random() * SIZE;
      const y = Math.random() * SIZE;
      gfx.fillCircle(x, y, 3);
    }

    // Small rocks
    gfx.fillStyle(palette.decoration, 1);
    for (let i = 0; i < 5; i++) {
      const x = Math.random() * SIZE;
      const y = Math.random() * SIZE;
      gfx.fillRect(x, y, 3, 3);
    }

    gfx.generateTexture("biome_desert", SIZE, SIZE);
    gfx.destroy();
  }

  /**
   * Stage 3: Dungeon - Dark stone maze
   */
  static createDungeonTiles(scene: Phaser.Scene): void {
    const gfx = scene.add.graphics();
    const SIZE = 64;
    const palette = BIOME_PALETTES.dungeon;

    // Base dark stone
    gfx.fillStyle(palette.primary, 1);
    gfx.fillRect(0, 0, SIZE, SIZE);

    // Stone blocks
    gfx.lineStyle(1, palette.secondary, 1);
    for (let x = 0; x < SIZE; x += 16) {
      for (let y = 0; y < SIZE; y += 16) {
        gfx.strokeRect(x, y, 16, 16);
      }
    }

    // Cracks
    gfx.lineStyle(1, palette.secondary, 0.8);
    for (let i = 0; i < 5; i++) {
      const x1 = Math.random() * SIZE;
      const y1 = Math.random() * SIZE;
      const x2 = x1 + (Math.random() - 0.5) * 20;
      const y2 = y1 + (Math.random() - 0.5) * 20;
      gfx.lineBetween(x1, y1, x2, y2);
    }

    // Blue crystal glow
    gfx.fillStyle(palette.decoration, 0.2);
    for (let i = 0; i < 3; i++) {
      const x = Math.random() * SIZE;
      const y = Math.random() * SIZE;
      gfx.fillCircle(x, y, 8);
    }

    gfx.generateTexture("biome_dungeon", SIZE, SIZE);
    gfx.destroy();
  }

  /**
   * Stage 4: Tundra - Snowy plains with ice
   */
  static createTundraTiles(scene: Phaser.Scene): void {
    const gfx = scene.add.graphics();
    const SIZE = 64;
    const palette = BIOME_PALETTES.tundra;

    // Base snow
    gfx.fillStyle(palette.primary, 1);
    gfx.fillRect(0, 0, SIZE, SIZE);

    // Snow texture (ice patches)
    gfx.fillStyle(palette.secondary, 0.6);
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * SIZE;
      const y = Math.random() * SIZE;
      const size = Math.random() * 10 + 5;
      gfx.fillCircle(x, y, size);
    }

    // Ice crystals
    gfx.fillStyle(palette.accent, 0.8);
    for (let i = 0; i < 8; i++) {
      const x = Math.random() * SIZE;
      const y = Math.random() * SIZE;
      gfx.fillRect(x, y, 2, 2);
    }

    // Sparkles
    gfx.fillStyle(0xffffff, 0.9);
    for (let i = 0; i < 10; i++) {
      const x = Math.random() * SIZE;
      const y = Math.random() * SIZE;
      gfx.fillCircle(x, y, 1);
    }

    gfx.generateTexture("biome_tundra", SIZE, SIZE);
    gfx.destroy();
  }

  /**
   * Stage 5: Mine - Gem-lit caverns
   */
  static createMineTiles(scene: Phaser.Scene): void {
    const gfx = scene.add.graphics();
    const SIZE = 64;
    const palette = BIOME_PALETTES.mine;

    // Base dark rock
    gfx.fillStyle(palette.primary, 1);
    gfx.fillRect(0, 0, SIZE, SIZE);

    // Rock texture
    gfx.fillStyle(palette.secondary, 0.7);
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * SIZE;
      const y = Math.random() * SIZE;
      const size = Math.random() * 6 + 3;
      gfx.fillCircle(x, y, size);
    }

    // Gem veins (orange glow)
    gfx.fillStyle(palette.accent, 0.4);
    for (let i = 0; i < 5; i++) {
      const x = Math.random() * SIZE;
      const y = Math.random() * SIZE;
      gfx.fillCircle(x, y, 6);
    }

    // Gem crystals
    gfx.fillStyle(palette.decoration, 1);
    for (let i = 0; i < 4; i++) {
      const x = Math.random() * SIZE;
      const y = Math.random() * SIZE;
      gfx.fillRect(x, y, 3, 3);
    }

    gfx.generateTexture("biome_mine", SIZE, SIZE);
    gfx.destroy();
  }

  /**
   * Stage 6: Harbour - Ocean docks
   */
  static createHarbourTiles(scene: Phaser.Scene): void {
    const gfx = scene.add.graphics();
    const SIZE = 64;
    const palette = BIOME_PALETTES.harbour;

    // Base water
    gfx.fillStyle(palette.primary, 1);
    gfx.fillRect(0, 0, SIZE, SIZE);

    // Water waves
    gfx.fillStyle(palette.secondary, 0.6);
    for (let y = 0; y < SIZE; y += 8) {
      const offset = Math.sin(y * 0.1) * 4;
      gfx.fillRect(offset, y, SIZE, 4);
    }

    // Light water highlights
    gfx.fillStyle(palette.accent, 0.3);
    for (let i = 0; i < 10; i++) {
      const x = Math.random() * SIZE;
      const y = Math.random() * SIZE;
      gfx.fillCircle(x, y, 4);
    }

    // Wooden planks (for dock areas)
    gfx.fillStyle(palette.decoration, 0.5);
    for (let x = 0; x < SIZE; x += 16) {
      gfx.fillRect(x, 0, 12, SIZE);
    }

    gfx.generateTexture("biome_harbour", SIZE, SIZE);
    gfx.destroy();
  }

  /**
   * Stage 7: Floating Isle - Sky ruins
   */
  static createFloatingIsleTiles(scene: Phaser.Scene): void {
    const gfx = scene.add.graphics();
    const SIZE = 64;
    const palette = BIOME_PALETTES.floatingIsle;

    // Base sky grass
    gfx.fillStyle(palette.primary, 1);
    gfx.fillRect(0, 0, SIZE, SIZE);

    // Grass texture
    gfx.fillStyle(palette.secondary, 0.6);
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * SIZE;
      const y = Math.random() * SIZE;
      gfx.fillRect(x, y, 2, 3);
    }

    // Sky blue patches
    gfx.fillStyle(palette.accent, 0.2);
    for (let i = 0; i < 8; i++) {
      const x = Math.random() * SIZE;
      const y = Math.random() * SIZE;
      gfx.fillCircle(x, y, 10);
    }

    // Purple runes
    gfx.fillStyle(palette.decoration, 0.7);
    for (let i = 0; i < 3; i++) {
      const x = Math.random() * SIZE;
      const y = Math.random() * SIZE;
      gfx.fillCircle(x, y, 3);
    }

    gfx.generateTexture("biome_floating_isle", SIZE, SIZE);
    gfx.destroy();
  }

  /**
   * Stage 8: Capital - Golden city
   */
  static createCapitalTiles(scene: Phaser.Scene): void {
    const gfx = scene.add.graphics();
    const SIZE = 64;
    const palette = BIOME_PALETTES.capital;

    // Base gold
    gfx.fillStyle(palette.primary, 1);
    gfx.fillRect(0, 0, SIZE, SIZE);

    // Gold texture
    gfx.fillStyle(palette.secondary, 0.7);
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * SIZE;
      const y = Math.random() * SIZE;
      const size = Math.random() * 8 + 4;
      gfx.fillCircle(x, y, size);
    }

    // Light gold highlights
    gfx.fillStyle(palette.accent, 0.5);
    for (let i = 0; i < 10; i++) {
      const x = Math.random() * SIZE;
      const y = Math.random() * SIZE;
      gfx.fillCircle(x, y, 3);
    }

    // Marble tiles
    gfx.lineStyle(2, palette.decoration, 0.3);
    for (let x = 0; x < SIZE; x += 16) {
      for (let y = 0; y < SIZE; y += 16) {
        gfx.strokeRect(x, y, 16, 16);
      }
    }

    gfx.generateTexture("biome_capital", SIZE, SIZE);
    gfx.destroy();
  }

  /**
   * Create organic path textures for adventure theme
   */
  static createOrganicPathTextures(scene: Phaser.Scene): void {
    const gfx = scene.add.graphics();
    const WIDTH = 64;
    const HEIGHT = 32;

    // Dirt path base
    gfx.fillStyle(0x6b4423, 1);
    gfx.fillRect(0, 0, WIDTH, HEIGHT);

    // Edge grass (organic, not straight)
    gfx.fillStyle(0x4a7c2f, 0.8);
    for (let x = 0; x < WIDTH; x += 4) {
      const leftEdge = Math.sin(x * 0.2) * 3 + 4;
      const rightEdge = HEIGHT - Math.sin(x * 0.2) * 3 - 4;
      gfx.fillRect(x, 0, 4, leftEdge);
      gfx.fillRect(x, rightEdge, 4, HEIGHT - rightEdge);
    }

    // Pebbles
    gfx.fillStyle(0x5a3a1a, 0.7);
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * WIDTH;
      const y = Math.random() * HEIGHT;
      gfx.fillCircle(x, y, Math.random() * 2 + 1);
    }

    // Grass tufts on edges
    gfx.fillStyle(0x2d5016, 0.6);
    for (let i = 0; i < 8; i++) {
      const x = Math.random() * WIDTH;
      const y = Math.random() < 0.5 ? Math.random() * 8 : HEIGHT - Math.random() * 8;
      gfx.fillRect(x, y, 2, 4);
    }

    gfx.generateTexture("organic_path", WIDTH, HEIGHT);
    gfx.destroy();
  }
}
