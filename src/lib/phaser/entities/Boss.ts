/**
 * Boss.ts
 *
 * BossSilhouette — a Phaser Container representing a boss enemy on the
 * Interactive Ideas world-map. Renders a menacing humanoid silhouette with
 * status-based alpha transitions.
 */

import * as Phaser from "phaser";

// ─────────────────────────────────────────────────────────────────────────────
// Exported types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The five possible visual states for a boss encounter.
 */
export type BossStatus =
  | "silhouette"
  | "present"
  | "foreground"
  | "slain"
  | "retreated";

/**
 * Configuration data required to construct a {@link BossSilhouette}.
 */
export interface BossConfig {
  /** Unique identifier for this boss. */
  bossId: string;

  /** Optional display name (shown on nameplate). */
  bossName?: string;

  /** Initial visual status. */
  status: BossStatus;

  /** World-space X coordinate. */
  x: number;

  /** World-space Y coordinate. */
  y: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// BossSilhouette
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A Phaser Container that renders a boss silhouette on the world map.
 *
 * Features:
 * - Menacing humanoid silhouette (~96×128px) with jagged crown/horns
 * - Glowing red eyes
 * - Status-based alpha (silhouette: 0.15, present: 0.5, foreground: 1.0)
 * - Optional nameplate text
 * - Smooth alpha transitions via tween
 *
 * @example
 * const boss = new BossSilhouette(this, {
 *   bossId: 'boss_001',
 *   bossName: 'The Gatekeeper',
 *   status: 'silhouette',
 *   x: 800,
 *   y: 400,
 * });
 */
export class BossSilhouette extends Phaser.GameObjects.Container {
  // ── Identity ──────────────────────────────────────────────────────────────

  readonly bossId: string;

  // ── Private state ─────────────────────────────────────────────────────────

  private status: BossStatus;
  private config: BossConfig;
  private silhouetteGraphics: Phaser.GameObjects.Graphics;
  private namePlate: Phaser.GameObjects.Text;

  // ── Constructor ───────────────────────────────────────────────────────────

  /**
   * @param scene  The Phaser Scene this boss belongs to.
   * @param config Full boss configuration including position and status.
   */
  constructor(scene: Phaser.Scene, config: BossConfig) {
    super(scene, config.x, config.y);

    this.bossId = config.bossId;
    this.config = config;
    this.status = config.status;

    // ── Silhouette graphics ─────────────────────────────────────────────────
    // Draw at origin (0, 0) relative to container
    this.silhouetteGraphics = this.drawSilhouette(scene);

    // ── Nameplate ───────────────────────────────────────────────────────────
    const displayName = config.bossName ?? "???";
    this.namePlate = new Phaser.GameObjects.Text(scene, 0, 140, displayName, {
      fontSize: "14px",
      fontFamily: '"Courier New", Courier, monospace',
      color: "#DC2626",
      align: "center",
      stroke: "#0a0a14",
      strokeThickness: 4,
    });
    this.namePlate.setOrigin(0.5, 0);

    // ── Assemble container ──────────────────────────────────────────────────
    this.add([this.silhouetteGraphics, this.namePlate]);

    // Register with scene
    scene.add.existing(this);

    // Apply initial alpha based on status
    this.updateStatus(this.status, false);
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Update boss status with smooth opacity transition
   *
   * @param status - New boss status
   * @param smooth - Whether to animate the transition (default: true)
   */
  updateStatus(status: BossStatus, smooth: boolean = true): void {
    if (this.status === status) return;

    this.status = status;

    const targetAlpha = this.getAlphaForStatus(status);

    if (smooth) {
      this.scene.tweens.add({
        targets: this,
        alpha: targetAlpha,
        duration: 800,
        ease: "Sine.easeInOut",
      });
    } else {
      this.setAlpha(targetAlpha);
    }

    // Update name plate
    if (status === "foreground" && this.config.bossName) {
      this.namePlate.setText(this.config.bossName);
    }
  }

  // ── Private: drawing ──────────────────────────────────────────────────────

  /**
   * Draws the boss silhouette onto a Graphics object.
   *
   * The silhouette is a menacing humanoid shape approximately 96×128px,
   * drawn with origin at (48, 64) for center-based positioning.
   *
   * @param scene The scene to create the graphics in.
   * @returns A Graphics object containing the silhouette.
   */
  private drawSilhouette(scene: Phaser.Scene): Phaser.GameObjects.Graphics {
    const g = scene.add.graphics();

    // Offset to center the silhouette around (0, 0)
    // The drawing instructions assume (48, 0) as the center-top
    const offsetX = -48;
    const offsetY = -64;

    // ── Body (dark silhouette color) ────────────────────────────────────────
    g.fillStyle(0x1a0a2e);

    // ── Jagged crown / horns at top (3 triangles) ───────────────────────────
    // Left horn
    g.fillTriangle(
      offsetX + 18,
      offsetY + 0,
      offsetX + 28,
      offsetY - 30,
      offsetX + 38,
      offsetY + 0,
    );

    // Center crown (tallest)
    g.fillTriangle(
      offsetX + 43,
      offsetY + 0,
      offsetX + 48,
      offsetY - 40,
      offsetX + 53,
      offsetY + 0,
    );

    // Right horn
    g.fillTriangle(
      offsetX + 58,
      offsetY + 0,
      offsetX + 68,
      offsetY - 30,
      offsetX + 78,
      offsetY + 0,
    );

    // ── Massive shoulders ───────────────────────────────────────────────────
    g.fillRect(offsetX + 0, offsetY + 0, 96, 20);

    // ── Body core (torso) ───────────────────────────────────────────────────
    g.fillRect(offsetX + 20, offsetY + 20, 56, 60);

    // ── Lower body (legs, widening stance) ──────────────────────────────────
    // Left leg mass
    g.fillRect(offsetX + 16, offsetY + 70, 24, 40);

    // Right leg mass
    g.fillRect(offsetX + 56, offsetY + 70, 24, 40);

    // ── Glowing eyes (red/amber) ────────────────────────────────────────────
    g.fillStyle(0xff4400, 0.8);

    // Left eye
    g.fillRect(offsetX + 30, offsetY + 10, 6, 4);

    // Right eye
    g.fillRect(offsetX + 60, offsetY + 10, 6, 4);

    return g;
  }

  // ── Private: visual state ─────────────────────────────────────────────────

  /**
   * Get target alpha for each boss status
   *
   * @param status The boss status.
   * @returns Alpha value (0–1).
   */
  private getAlphaForStatus(status: BossStatus): number {
    switch (status) {
      case "silhouette":
        return 0.15;
      case "present":
        return 0.5;
      case "foreground":
        return 1.0;
      case "slain":
      case "retreated":
        return 0;
    }
  }

  /**
   * Play the entrance animation - boss materializes with dramatic effect.
   * Called when the player reaches stage 7+ and encounters the super boss.
   */
  entrance(): void {
    this.setAlpha(0);
    this.setScale(0.8);

    this.scene.tweens.add({
      targets: this,
      alpha: 0.5,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 800,
      ease: "Cubic.easeOut",
      onComplete: () => {
        this.scene.tweens.add({
          targets: this,
          scaleX: 1,
          scaleY: 1,
          duration: 400,
          ease: "Back.easeOut",
        });
      },
    });

    this.scene.tweens.add({
      targets: this,
      y: this.y + 15,
      duration: 600,
      ease: "Sine.easeOut",
      yoyo: true,
      repeat: 2,
    });
  }

  /**
   * Play the slay animation and destroy the boss.
   * Called when the player defeats the super boss.
   */
  slay(): void {
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.killTweensOf(this.silhouetteGraphics);
    this.scene.tweens.killTweensOf(this.namePlate);

    this.scene.tweens.add({
      targets: this.namePlate,
      alpha: 0,
      duration: 300,
      ease: "Sine.easeOut",
    });

    this.scene.tweens.add({
      targets: this.silhouetteGraphics,
      alpha: 0,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 1200,
      ease: "Cubic.easeIn",
    });

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 1.2,
      scaleY: 1.2,
      rotation: Math.PI * 0.5,
      duration: 2000,
      ease: "Cubic.easeOut",
      onComplete: () => {
        this.destroy();
      },
    });
  }
}
