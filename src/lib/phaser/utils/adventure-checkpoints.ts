/**
 * adventure-checkpoints.ts
 * 
 * Adventure-themed checkpoint marker textures for each biome.
 * Replaces the Among Us task-style icons with fantasy markers.
 */

import Phaser from "phaser";

/**
 * Checkpoint marker types for each biome
 */
export const CHECKPOINT_MARKER_TYPES = {
  forest: "flag",        // Wooden flag post
  desert: "pillar",      // Stone pillar
  dungeon: "orb",        // Crystal orb
  tundra: "campfire",    // Campfire
  mine: "pickaxe",       // Pickaxe in rock
  harbour: "anchor",     // Ship anchor
  floatingIsle: "rune",  // Rune stone
  capital: "crown",      // Crown pedestal
};

/**
 * Create adventure-themed checkpoint textures
 */
export class AdventureCheckpointCreator {
  /**
   * Create all adventure checkpoint textures
   */
  static createAllAdventureCheckpoints(scene: Phaser.Scene): void {
    // Forest checkpoints
    AdventureCheckpointCreator.createForestCheckpoints(scene);

    // Desert checkpoints
    AdventureCheckpointCreator.createDesertCheckpoints(scene);

    // Dungeon checkpoints
    AdventureCheckpointCreator.createDungeonCheckpoints(scene);

    // Tundra checkpoints
    AdventureCheckpointCreator.createTundraCheckpoints(scene);

    // Mine checkpoints
    AdventureCheckpointCreator.createMineCheckpoints(scene);

    // Harbour checkpoints
    AdventureCheckpointCreator.createHarbourCheckpoints(scene);

    // Floating Isle checkpoints
    AdventureCheckpointCreator.createFloatingIsleCheckpoints(scene);

    // Capital checkpoints
    AdventureCheckpointCreator.createCapitalCheckpoints(scene);
  }

  /**
   * Forest: Wooden flag markers
   */
  static createForestCheckpoints(scene: Phaser.Scene): void {
    const SIZE = 64;

    // Locked
    const lockedGfx = scene.add.graphics();
    AdventureCheckpointCreator.drawFlag(lockedGfx, SIZE, 0x6b4423, 0x4a5a62, 0.5);
    lockedGfx.generateTexture("cp_forest_locked", SIZE, SIZE);
    lockedGfx.destroy();

    // Active
    const activeGfx = scene.add.graphics();
    AdventureCheckpointCreator.drawFlag(activeGfx, SIZE, 0x6b4423, 0xf39c12, 1);
    activeGfx.generateTexture("cp_forest_active", SIZE, SIZE);
    activeGfx.destroy();

    // Completed
    const completedGfx = scene.add.graphics();
    AdventureCheckpointCreator.drawFlag(completedGfx, SIZE, 0x6b4423, 0x4caf50, 1);
    completedGfx.generateTexture("cp_forest_completed", SIZE, SIZE);
    completedGfx.destroy();

    // Gold
    const goldGfx = scene.add.graphics();
    AdventureCheckpointCreator.drawFlag(goldGfx, SIZE, 0x6b4423, 0xffd700, 1);
    goldGfx.generateTexture("cp_forest_gold", SIZE, SIZE);
    goldGfx.destroy();
  }

  /**
   * Desert: Stone pillar markers
   */
  static createDesertCheckpoints(scene: Phaser.Scene): void {
    const SIZE = 64;

    // Locked
    const lockedGfx = scene.add.graphics();
    AdventureCheckpointCreator.drawPillar(lockedGfx, SIZE, 0x8b7355, 0.5);
    lockedGfx.generateTexture("cp_desert_locked", SIZE, SIZE);
    lockedGfx.destroy();

    // Active
    const activeGfx = scene.add.graphics();
    AdventureCheckpointCreator.drawPillar(activeGfx, SIZE, 0xf39c12, 1);
    activeGfx.generateTexture("cp_desert_active", SIZE, SIZE);
    activeGfx.destroy();

    // Completed
    const completedGfx = scene.add.graphics();
    AdventureCheckpointCreator.drawPillar(completedGfx, SIZE, 0x4caf50, 1);
    completedGfx.generateTexture("cp_desert_completed", SIZE, SIZE);
    completedGfx.destroy();

    // Gold
    const goldGfx = scene.add.graphics();
    AdventureCheckpointCreator.drawPillar(goldGfx, SIZE, 0xffd700, 1);
    goldGfx.generateTexture("cp_desert_gold", SIZE, SIZE);
    goldGfx.destroy();
  }

  /**
   * Dungeon: Crystal orb markers
   */
  static createDungeonCheckpoints(scene: Phaser.Scene): void {
    const SIZE = 64;

    // Locked
    const lockedGfx = scene.add.graphics();
    AdventureCheckpointCreator.drawOrb(lockedGfx, SIZE, 0x4a4a6a, 0.5);
    lockedGfx.generateTexture("cp_dungeon_locked", SIZE, SIZE);
    lockedGfx.destroy();

    // Active
    const activeGfx = scene.add.graphics();
    AdventureCheckpointCreator.drawOrb(activeGfx, SIZE, 0x5555ff, 1);
    activeGfx.generateTexture("cp_dungeon_active", SIZE, SIZE);
    activeGfx.destroy();

    // Completed
    const completedGfx = scene.add.graphics();
    AdventureCheckpointCreator.drawOrb(completedGfx, SIZE, 0x4caf50, 1);
    completedGfx.generateTexture("cp_dungeon_completed", SIZE, SIZE);
    completedGfx.destroy();

    // Gold
    const goldGfx = scene.add.graphics();
    AdventureCheckpointCreator.drawOrb(goldGfx, SIZE, 0xffd700, 1);
    goldGfx.generateTexture("cp_dungeon_gold", SIZE, SIZE);
    goldGfx.destroy();
  }

  /**
   * Tundra: Campfire markers
   */
  static createTundraCheckpoints(scene: Phaser.Scene): void {
    const SIZE = 64;

    // Locked
    const lockedGfx = scene.add.graphics();
    AdventureCheckpointCreator.drawCampfire(lockedGfx, SIZE, 0x4a5a62, 0.5);
    lockedGfx.generateTexture("cp_tundra_locked", SIZE, SIZE);
    lockedGfx.destroy();

    // Active
    const activeGfx = scene.add.graphics();
    AdventureCheckpointCreator.drawCampfire(activeGfx, SIZE, 0xff6f00, 1);
    activeGfx.generateTexture("cp_tundra_active", SIZE, SIZE);
    activeGfx.destroy();

    // Completed
    const completedGfx = scene.add.graphics();
    AdventureCheckpointCreator.drawCampfire(completedGfx, SIZE, 0x4caf50, 1);
    completedGfx.generateTexture("cp_tundra_completed", SIZE, SIZE);
    completedGfx.destroy();

    // Gold
    const goldGfx = scene.add.graphics();
    AdventureCheckpointCreator.drawCampfire(goldGfx, SIZE, 0xffd700, 1);
    goldGfx.generateTexture("cp_tundra_gold", SIZE, SIZE);
    goldGfx.destroy();
  }

  /**
   * Mine: Pickaxe markers
   */
  static createMineCheckpoints(scene: Phaser.Scene): void {
    const SIZE = 64;

    // Locked
    const lockedGfx = scene.add.graphics();
    AdventureCheckpointCreator.drawPickaxe(lockedGfx, SIZE, 0x4a5a62, 0.5);
    lockedGfx.generateTexture("cp_mine_locked", SIZE, SIZE);
    lockedGfx.destroy();

    // Active
    const activeGfx = scene.add.graphics();
    AdventureCheckpointCreator.drawPickaxe(activeGfx, SIZE, 0xffa726, 1);
    activeGfx.generateTexture("cp_mine_active", SIZE, SIZE);
    activeGfx.destroy();

    // Completed
    const completedGfx = scene.add.graphics();
    AdventureCheckpointCreator.drawPickaxe(completedGfx, SIZE, 0x4caf50, 1);
    completedGfx.generateTexture("cp_mine_completed", SIZE, SIZE);
    completedGfx.destroy();

    // Gold
    const goldGfx = scene.add.graphics();
    AdventureCheckpointCreator.drawPickaxe(goldGfx, SIZE, 0xffd700, 1);
    goldGfx.generateTexture("cp_mine_gold", SIZE, SIZE);
    goldGfx.destroy();
  }

  /**
   * Harbour: Anchor markers
   */
  static createHarbourCheckpoints(scene: Phaser.Scene): void {
    const SIZE = 64;

    // Locked
    const lockedGfx = scene.add.graphics();
    AdventureCheckpointCreator.drawAnchor(lockedGfx, SIZE, 0x4a5a62, 0.5);
    lockedGfx.generateTexture("cp_harbour_locked", SIZE, SIZE);
    lockedGfx.destroy();

    // Active
    const activeGfx = scene.add.graphics();
    AdventureCheckpointCreator.drawAnchor(activeGfx, SIZE, 0x64b5f6, 1);
    activeGfx.generateTexture("cp_harbour_active", SIZE, SIZE);
    activeGfx.destroy();

    // Completed
    const completedGfx = scene.add.graphics();
    AdventureCheckpointCreator.drawAnchor(completedGfx, SIZE, 0x4caf50, 1);
    completedGfx.generateTexture("cp_harbour_completed", SIZE, SIZE);
    completedGfx.destroy();

    // Gold
    const goldGfx = scene.add.graphics();
    AdventureCheckpointCreator.drawAnchor(goldGfx, SIZE, 0xffd700, 1);
    goldGfx.generateTexture("cp_harbour_gold", SIZE, SIZE);
    goldGfx.destroy();
  }

  /**
   * Floating Isle: Rune stone markers
   */
  static createFloatingIsleCheckpoints(scene: Phaser.Scene): void {
    const SIZE = 64;

    // Locked
    const lockedGfx = scene.add.graphics();
    AdventureCheckpointCreator.drawRune(lockedGfx, SIZE, 0x4a5a62, 0.5);
    lockedGfx.generateTexture("cp_floating_isle_locked", SIZE, SIZE);
    lockedGfx.destroy();

    // Active
    const activeGfx = scene.add.graphics();
    AdventureCheckpointCreator.drawRune(activeGfx, SIZE, 0xb39ddb, 1);
    activeGfx.generateTexture("cp_floating_isle_active", SIZE, SIZE);
    activeGfx.destroy();

    // Completed
    const completedGfx = scene.add.graphics();
    AdventureCheckpointCreator.drawRune(completedGfx, SIZE, 0x4caf50, 1);
    completedGfx.generateTexture("cp_floating_isle_completed", SIZE, SIZE);
    completedGfx.destroy();

    // Gold
    const goldGfx = scene.add.graphics();
    AdventureCheckpointCreator.drawRune(goldGfx, SIZE, 0xffd700, 1);
    goldGfx.generateTexture("cp_floating_isle_gold", SIZE, SIZE);
    goldGfx.destroy();
  }

  /**
   * Capital: Crown pedestal markers
   */
  static createCapitalCheckpoints(scene: Phaser.Scene): void {
    const SIZE = 64;

    // Locked
    const lockedGfx = scene.add.graphics();
    AdventureCheckpointCreator.drawCrown(lockedGfx, SIZE, 0x4a5a62, 0.5);
    lockedGfx.generateTexture("cp_capital_locked", SIZE, SIZE);
    lockedGfx.destroy();

    // Active
    const activeGfx = scene.add.graphics();
    AdventureCheckpointCreator.drawCrown(activeGfx, SIZE, 0xffd54f, 1);
    activeGfx.generateTexture("cp_capital_active", SIZE, SIZE);
    activeGfx.destroy();

    // Completed
    const completedGfx = scene.add.graphics();
    AdventureCheckpointCreator.drawCrown(completedGfx, SIZE, 0x4caf50, 1);
    completedGfx.generateTexture("cp_capital_completed", SIZE, SIZE);
    completedGfx.destroy();

    // Gold
    const goldGfx = scene.add.graphics();
    AdventureCheckpointCreator.drawCrown(goldGfx, SIZE, 0xffd700, 1);
    goldGfx.generateTexture("cp_capital_gold", SIZE, SIZE);
    goldGfx.destroy();
  }

  // ========== Drawing Helper Methods ==========

  /**
   * Draw a flag marker
   */
  private static drawFlag(
    gfx: Phaser.GameObjects.Graphics,
    size: number,
    poleColor: number,
    flagColor: number,
    alpha: number
  ): void {
    const cx = size / 2;
    const cy = size / 2;

    // Pole
    gfx.fillStyle(poleColor, alpha);
    gfx.fillRect(cx - 3, cy - 10, 6, 30);

    // Flag
    gfx.fillStyle(flagColor, alpha);
    gfx.fillTriangle(
      cx, cy - 10,
      cx, cy + 10,
      cx + 20, cy
    );

    // Flag border
    gfx.lineStyle(2, 0x000000, alpha * 0.5);
    gfx.strokeTriangle(
      cx, cy - 10,
      cx, cy + 10,
      cx + 20, cy
    );
  }

  /**
   * Draw a stone pillar marker
   */
  private static drawPillar(
    gfx: Phaser.GameObjects.Graphics,
    size: number,
    color: number,
    alpha: number
  ): void {
    const cx = size / 2;
    const cy = size / 2;

    // Base
    gfx.fillStyle(0x5a4a3a, alpha * 0.8);
    gfx.fillRect(cx - 12, cy + 10, 24, 8);

    // Pillar body
    gfx.fillStyle(color, alpha);
    gfx.fillRect(cx - 8, cy - 15, 16, 25);

    // Top cap
    gfx.fillStyle(color, alpha);
    gfx.fillRect(cx - 10, cy - 18, 20, 3);

    // Border
    gfx.lineStyle(2, 0x000000, alpha * 0.5);
    gfx.strokeRect(cx - 8, cy - 15, 16, 25);
  }

  /**
   * Draw a crystal orb marker
   */
  private static drawOrb(
    gfx: Phaser.GameObjects.Graphics,
    size: number,
    color: number,
    alpha: number
  ): void {
    const cx = size / 2;
    const cy = size / 2;

    // Pedestal
    gfx.fillStyle(0x3a3a4a, alpha * 0.8);
    gfx.fillRect(cx - 10, cy + 8, 20, 8);

    // Orb glow
    gfx.fillStyle(color, alpha * 0.3);
    gfx.fillCircle(cx, cy, 16);

    // Orb
    gfx.fillStyle(color, alpha);
    gfx.fillCircle(cx, cy, 12);

    // Highlight
    gfx.fillStyle(0xffffff, alpha * 0.6);
    gfx.fillCircle(cx - 4, cy - 4, 4);

    // Border
    gfx.lineStyle(2, 0x000000, alpha * 0.5);
    gfx.strokeCircle(cx, cy, 12);
  }

  /**
   * Draw a campfire marker
   */
  private static drawCampfire(
    gfx: Phaser.GameObjects.Graphics,
    size: number,
    color: number,
    alpha: number
  ): void {
    const cx = size / 2;
    const cy = size / 2;

    // Logs
    gfx.fillStyle(0x6b4423, alpha);
    gfx.fillRect(cx - 12, cy + 8, 24, 4);
    gfx.fillRect(cx - 10, cy + 4, 20, 4);

    // Flames
    gfx.fillStyle(color, alpha);
    gfx.fillTriangle(
      cx, cy - 12,
      cx - 8, cy + 4,
      cx + 8, cy + 4
    );

    // Inner flame
    gfx.fillStyle(0xffeb3b, alpha * 0.8);
    gfx.fillTriangle(
      cx, cy - 6,
      cx - 4, cy + 2,
      cx + 4, cy + 2
    );
  }

  /**
   * Draw a pickaxe marker
   */
  private static drawPickaxe(
    gfx: Phaser.GameObjects.Graphics,
    size: number,
    color: number,
    alpha: number
  ): void {
    const cx = size / 2;
    const cy = size / 2;

    // Rock
    gfx.fillStyle(0x5d4037, alpha * 0.8);
    gfx.fillRect(cx - 10, cy + 8, 20, 10);

    // Handle
    gfx.fillStyle(0x6b4423, alpha);
    gfx.fillRect(cx - 2, cy - 8, 4, 20);

    // Pickaxe head
    gfx.fillStyle(color, alpha);
    gfx.fillRect(cx - 12, cy - 12, 24, 6);

    // Border
    gfx.lineStyle(2, 0x000000, alpha * 0.5);
    gfx.strokeRect(cx - 12, cy - 12, 24, 6);
  }

  /**
   * Draw an anchor marker
   */
  private static drawAnchor(
    gfx: Phaser.GameObjects.Graphics,
    size: number,
    color: number,
    alpha: number
  ): void {
    const cx = size / 2;
    const cy = size / 2;

    // Anchor body
    gfx.fillStyle(color, alpha);
    gfx.fillRect(cx - 3, cy - 12, 6, 20);

    // Crossbar
    gfx.fillRect(cx - 12, cy - 6, 24, 4);

    // Flukes
    gfx.fillTriangle(
      cx - 12, cy + 8,
      cx - 12, cy + 16,
      cx - 6, cy + 12
    );
    gfx.fillTriangle(
      cx + 12, cy + 8,
      cx + 12, cy + 16,
      cx + 6, cy + 12
    );

    // Ring
    gfx.lineStyle(3, color, alpha);
    gfx.strokeCircle(cx, cy - 14, 4);
  }

  /**
   * Draw a rune stone marker
   */
  private static drawRune(
    gfx: Phaser.GameObjects.Graphics,
    size: number,
    color: number,
    alpha: number
  ): void {
    const cx = size / 2;
    const cy = size / 2;

    // Stone
    gfx.fillStyle(0x9e9e9e, alpha * 0.8);
    gfx.fillRect(cx - 10, cy - 12, 20, 28);

    // Rune glow
    gfx.fillStyle(color, alpha * 0.4);
    gfx.fillCircle(cx, cy, 14);

    // Rune symbol (simple cross)
    gfx.lineStyle(3, color, alpha);
    gfx.lineBetween(cx, cy - 8, cx, cy + 8);
    gfx.lineBetween(cx - 8, cy, cx + 8, cy);

    // Border
    gfx.lineStyle(2, 0x000000, alpha * 0.5);
    gfx.strokeRect(cx - 10, cy - 12, 20, 28);
  }

  /**
   * Draw a crown pedestal marker
   */
  private static drawCrown(
    gfx: Phaser.GameObjects.Graphics,
    size: number,
    color: number,
    alpha: number
  ): void {
    const cx = size / 2;
    const cy = size / 2;

    // Pedestal
    gfx.fillStyle(0xbcaaa4, alpha * 0.8);
    gfx.fillRect(cx - 12, cy + 8, 24, 8);
    gfx.fillRect(cx - 10, cy + 4, 20, 4);

    // Crown base
    gfx.fillStyle(color, alpha);
    gfx.fillRect(cx - 10, cy - 4, 20, 6);

    // Crown points
    gfx.fillTriangle(cx - 8, cy - 4, cx - 8, cy - 12, cx - 4, cy - 8);
    gfx.fillTriangle(cx, cy - 4, cx, cy - 14, cx + 4, cy - 10);
    gfx.fillTriangle(cx + 8, cy - 4, cx + 8, cy - 12, cx + 4, cy - 8);

    // Jewels
    gfx.fillStyle(0xff0000, alpha);
    gfx.fillCircle(cx - 6, cy - 8, 2);
    gfx.fillCircle(cx, cy - 10, 2);
    gfx.fillCircle(cx + 6, cy - 8, 2);
  }
}
