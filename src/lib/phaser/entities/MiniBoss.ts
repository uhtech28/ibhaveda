/**
 * MiniBoss.ts
 *
 * MiniBoss — a Phaser Container representing stage-specific mini-boss enemies
 * that progressively weaken as the player completes checkpoints within a stage.
 *
 * Supported Types:
 * - Fog of Vagueness (Stage 1 - Ideation): Gray fog cloud with eyes
 * - Pathwarden Wraith (Stage 2 - Research): Dark hooded figure with sigils
 */

import * as Phaser from "phaser";

// ─────────────────────────────────────────────────────────────────────────────
// Exported types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The two mini-boss types corresponding to venture stages
 */
export type MiniBossType = "fog_of_vagueness" | "pathwarden_wraith";

/**
 * Configuration data required to construct a {@link MiniBoss}.
 */
export interface MiniBossConfig {
  /** Unique identifier for this mini-boss. */
  bossId: string;

  /** Boss type determines visual appearance. */
  bossType: MiniBossType;

  /** World-space X coordinate. */
  x: number;

  /** World-space Y coordinate. */
  y: number;

  /** Stage number (1-8) this boss guards. */
  stage: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// MiniBoss
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A Phaser Container that renders a stage-specific mini-boss on the world map.
 *
 * Features:
 * - Progressive weakening as checkpoints are completed
 * - Type-specific visual designs (fog cloud vs hooded wraith)
 * - Dramatic slay animation when stage is completed
 * - Procedural graphics (no sprite assets required)
 *
 * @example
 * const boss = new MiniBoss(this, {
 *   bossId: 'fog_of_vagueness',
 *   bossType: 'fog_of_vagueness',
 *   x: 800,
 *   y: 300,
 *   stage: 1
 * });
 * boss.weaken(2, 4); // 2 out of 4 checkpoints complete
 * boss.slay(); // Stage complete, destroy boss
 */
export class MiniBoss extends Phaser.GameObjects.Container {
  // ── Identity ──────────────────────────────────────────────────────────────

  readonly bossId: string;
  readonly bossType: MiniBossType;
  readonly stage: number;

  // ── Private state ─────────────────────────────────────────────────────────

  private bossGraphics: Phaser.GameObjects.Graphics;
  private cracksGraphics: Phaser.GameObjects.Graphics;
  private namePlate: Phaser.GameObjects.Text;
  private eyeLeft: Phaser.GameObjects.Arc | null = null;
  private eyeRight: Phaser.GameObjects.Arc | null = null;
  private currentWeakness: number = 0; // 0 = full strength, 1 = fully weakened

  // ── Constructor ───────────────────────────────────────────────────────────

  /**
   * @param scene  The Phaser Scene this mini-boss belongs to.
   * @param config Full mini-boss configuration including position and type.
   */
  constructor(scene: Phaser.Scene, config: MiniBossConfig) {
    super(scene, config.x, config.y);

    this.bossId = config.bossId;
    this.bossType = config.bossType;
    this.stage = config.stage;

    // ── Boss graphics ───────────────────────────────────────────────────────
    this.bossGraphics = scene.add.graphics();

    // ── Cracks/damage overlay ───────────────────────────────────────────────
    this.cracksGraphics = scene.add.graphics();
    this.cracksGraphics.setAlpha(0);

    // Draw type-specific boss visuals
    if (this.bossType === "fog_of_vagueness") {
      this.drawFogOfVagueness();
    } else {
      this.drawPathwardenWraith();
    }

    // ── Nameplate ───────────────────────────────────────────────────────────
    const displayName = this.getBossName();
    this.namePlate = new Phaser.GameObjects.Text(scene, 0, 90, displayName, {
      fontSize: "12px",
      fontFamily: '"Courier New", Courier, monospace',
      color: "#DC2626",
      align: "center",
      stroke: "#0a0a14",
      strokeThickness: 3,
    });
    this.namePlate.setOrigin(0.5, 0);

    // ── Assemble container ──────────────────────────────────────────────────
    this.add([this.bossGraphics, this.cracksGraphics, this.namePlate]);
    if (this.eyeLeft) this.add([this.eyeLeft, this.eyeRight!]);

    // Register with scene
    scene.add.existing(this);
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Progressively weaken the boss based on checkpoint completion.
   *
   * @param checkpointsComplete - Number of checkpoints completed in this stage
   * @param totalCheckpoints - Total checkpoints in this stage
   */
  weaken(checkpointsComplete: number, totalCheckpoints: number): void {
    if (totalCheckpoints === 0) return;

    const weakness = checkpointsComplete / totalCheckpoints;
    this.currentWeakness = Phaser.Math.Clamp(weakness, 0, 1);

    if (this.bossType === "fog_of_vagueness") {
      // Fog dissipates by reducing opacity
      const targetAlpha = 1.0 - this.currentWeakness * 0.7; // 100% -> 30%
      this.scene.tweens.add({
        targets: this.bossGraphics,
        alpha: targetAlpha,
        duration: 600,
        ease: "Sine.easeOut",
      });

      // Eyes fade too
      if (this.eyeLeft) {
        this.scene.tweens.add({
          targets: [this.eyeLeft, this.eyeRight],
          alpha: targetAlpha,
          duration: 600,
          ease: "Sine.easeOut",
        });
      }
    } else {
      // Wraith shows progressive cracks
      this.drawCracks(this.currentWeakness);
      this.scene.tweens.add({
        targets: this.cracksGraphics,
        alpha: this.currentWeakness,
        duration: 600,
        ease: "Sine.easeOut",
      });
    }
  }

  /**
   * Play the slay animation and destroy the boss.
   * Called when the player completes the stage.
   */
  slay(): void {
    // Stop any ongoing tweens
    this.scene.tweens.killTweensOf([
      this,
      this.bossGraphics,
      this.cracksGraphics,
      this.eyeLeft,
      this.eyeRight,
      this.namePlate,
    ]);

    if (this.bossType === "fog_of_vagueness") {
      // Fog dissipates outward with scale and fade
      this.scene.tweens.add({
        targets: this,
        alpha: 0,
        scaleX: 1.5,
        scaleY: 1.5,
        duration: 2000,
        ease: "Cubic.easeOut",
        onComplete: () => {
          this.destroy();
        },
      });
    } else {
      // Wraith shatters and fades
      this.scene.tweens.add({
        targets: this.bossGraphics,
        alpha: 0,
        y: this.bossGraphics.y + 20,
        duration: 1500,
        ease: "Cubic.easeIn",
      });

      this.scene.tweens.add({
        targets: this.cracksGraphics,
        alpha: 1,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 1000,
        ease: "Back.easeOut",
      });

      this.scene.tweens.add({
        targets: this,
        alpha: 0,
        duration: 2000,
        ease: "Sine.easeOut",
        onComplete: () => {
          this.destroy();
        },
      });
    }
  }

  // ── Private: drawing methods ──────────────────────────────────────────────

  /**
   * Draw "Fog of Vagueness" - a gray fog cloud with glowing eyes.
   */
  private drawFogOfVagueness(): void {
    const g = this.bossGraphics;

    // Offset to center around (0, 0)
    const offsetX = -50;
    const offsetY = -40;

    // ── Fog body (multiple overlapping circles for cloud effect) ───────────
    g.fillStyle(0x6b7280, 0.8); // Gray-500

    // Main cloud mass
    g.fillCircle(offsetX + 50, offsetY + 30, 35);
    g.fillCircle(offsetX + 30, offsetY + 40, 28);
    g.fillCircle(offsetX + 70, offsetY + 40, 28);
    g.fillCircle(offsetX + 50, offsetY + 55, 30);

    // Upper puffs
    g.fillCircle(offsetX + 25, offsetY + 20, 20);
    g.fillCircle(offsetX + 75, offsetY + 20, 20);

    // Wispy edges
    g.fillStyle(0x9ca3af, 0.6); // Gray-400
    g.fillCircle(offsetX + 15, offsetY + 35, 15);
    g.fillCircle(offsetX + 85, offsetY + 35, 15);
    g.fillCircle(offsetX + 50, offsetY + 70, 18);

    // ── Eyes (glowing red circles, added as separate objects for animation) ─
    this.eyeLeft = new Phaser.GameObjects.Arc(
      this.scene,
      offsetX + 35,
      offsetY + 30,
      6,
      0,
      360,
      false,
      0xff4444,
    );
    this.eyeLeft.setStrokeStyle(2, 0xff0000, 0.8);

    this.eyeRight = new Phaser.GameObjects.Arc(
      this.scene,
      offsetX + 65,
      offsetY + 30,
      6,
      0,
      360,
      false,
      0xff4444,
    );
    this.eyeRight.setStrokeStyle(2, 0xff0000, 0.8);

    // Subtle eye glow pulse
    this.scene.tweens.add({
      targets: [this.eyeLeft, this.eyeRight],
      alpha: { from: 0.7, to: 1.0 },
      duration: 1200,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });
  }

  /**
   * Draw "Pathwarden Wraith" - a dark hooded figure with sigils.
   */
  private drawPathwardenWraith(): void {
    const g = this.bossGraphics;

    const offsetX = -40;
    const offsetY = -60;

    // ── Hood/cloak (dark shadowy figure) ────────────────────────────────────
    g.fillStyle(0x1a0a2e, 0.9); // Very dark purple

    // Hood shape (triangle-ish)
    g.beginPath();
    g.moveTo(offsetX + 40, offsetY + 10); // Top of hood
    g.lineTo(offsetX + 20, offsetY + 40); // Left side
    g.lineTo(offsetX + 60, offsetY + 40); // Right side
    g.closePath();
    g.fillPath();

    // ── Face void (darker) ──────────────────────────────────────────────────
    g.fillStyle(0x000000, 0.95);
    g.fillEllipse(offsetX + 40, offsetY + 30, 18, 22);

    // ── Cloak body ──────────────────────────────────────────────────────────
    g.fillStyle(0x2d1b4e, 0.85); // Dark purple
    g.fillRect(offsetX + 15, offsetY + 40, 50, 40);

    // Cloak bottom taper
    g.beginPath();
    g.moveTo(offsetX + 15, offsetY + 80);
    g.lineTo(offsetX + 25, offsetY + 100);
    g.lineTo(offsetX + 55, offsetY + 100);
    g.lineTo(offsetX + 65, offsetY + 80);
    g.closePath();
    g.fillPath();

    // ── Glowing sigils (protective wards) ───────────────────────────────────
    g.lineStyle(2, 0x8b5cf6, 0.8); // Purple-500

    // Left sigil (circle with rune)
    g.strokeCircle(offsetX + 25, offsetY + 55, 8);
    g.beginPath();
    g.moveTo(offsetX + 25, offsetY + 47);
    g.lineTo(offsetX + 25, offsetY + 63);
    g.strokePath();

    // Right sigil (circle with rune)
    g.strokeCircle(offsetX + 55, offsetY + 55, 8);
    g.beginPath();
    g.moveTo(offsetX + 55, offsetY + 47);
    g.lineTo(offsetX + 55, offsetY + 63);
    g.strokePath();

    // Center sigil (diamond)
    g.beginPath();
    g.moveTo(offsetX + 40, offsetY + 62);
    g.lineTo(offsetX + 45, offsetY + 68);
    g.lineTo(offsetX + 40, offsetY + 74);
    g.lineTo(offsetX + 35, offsetY + 68);
    g.closePath();
    g.strokePath();

    // ── Eyes (faint red glow in hood shadow) ───────────────────────────────
    this.eyeLeft = new Phaser.GameObjects.Arc(
      this.scene,
      offsetX + 33,
      offsetY + 28,
      3,
      0,
      360,
      false,
      0xdc2626,
      0.6,
    );

    this.eyeRight = new Phaser.GameObjects.Arc(
      this.scene,
      offsetX + 47,
      offsetY + 28,
      3,
      0,
      360,
      false,
      0xdc2626,
      0.6,
    );

    // Subtle eye pulse
    this.scene.tweens.add({
      targets: [this.eyeLeft, this.eyeRight],
      alpha: { from: 0.4, to: 0.8 },
      duration: 1500,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });
  }

  /**
   * Draw progressive cracks on the wraith based on weakness level.
   *
   * @param weakness - 0 to 1, where 1 is fully cracked
   */
  private drawCracks(weakness: number): void {
    this.cracksGraphics.clear();

    if (weakness <= 0) return;

    const offsetX = -40;
    const offsetY = -60;

    this.cracksGraphics.lineStyle(2, 0xffffff, 0.7);

    // Crack 1 (appears at 25% weakness)
    if (weakness >= 0.25) {
      this.cracksGraphics.beginPath();
      this.cracksGraphics.moveTo(offsetX + 25, offsetY + 40);
      this.cracksGraphics.lineTo(offsetX + 20, offsetY + 60);
      this.cracksGraphics.lineTo(offsetX + 15, offsetY + 75);
      this.cracksGraphics.strokePath();
    }

    // Crack 2 (appears at 50% weakness)
    if (weakness >= 0.5) {
      this.cracksGraphics.beginPath();
      this.cracksGraphics.moveTo(offsetX + 55, offsetY + 40);
      this.cracksGraphics.lineTo(offsetX + 60, offsetY + 60);
      this.cracksGraphics.lineTo(offsetX + 65, offsetY + 75);
      this.cracksGraphics.strokePath();
    }

    // Crack 3 (appears at 75% weakness)
    if (weakness >= 0.75) {
      this.cracksGraphics.beginPath();
      this.cracksGraphics.moveTo(offsetX + 40, offsetY + 45);
      this.cracksGraphics.lineTo(offsetX + 40, offsetY + 70);
      this.cracksGraphics.lineTo(offsetX + 35, offsetY + 85);
      this.cracksGraphics.strokePath();

      this.cracksGraphics.beginPath();
      this.cracksGraphics.moveTo(offsetX + 40, offsetY + 70);
      this.cracksGraphics.lineTo(offsetX + 45, offsetY + 85);
      this.cracksGraphics.strokePath();
    }

    // Additional shatter lines at full weakness
    if (weakness >= 1.0) {
      this.cracksGraphics.lineStyle(1, 0xffffff, 0.5);
      this.cracksGraphics.beginPath();
      this.cracksGraphics.moveTo(offsetX + 30, offsetY + 50);
      this.cracksGraphics.lineTo(offsetX + 50, offsetY + 55);
      this.cracksGraphics.strokePath();

      this.cracksGraphics.beginPath();
      this.cracksGraphics.moveTo(offsetX + 25, offsetY + 70);
      this.cracksGraphics.lineTo(offsetX + 55, offsetY + 65);
      this.cracksGraphics.strokePath();
    }
  }

  /**
   * Get display name for this boss type.
   */
  private getBossName(): string {
    switch (this.bossType) {
      case "fog_of_vagueness":
        return "Fog of Vagueness";
      case "pathwarden_wraith":
        return "Pathwarden Wraith";
      default:
        return "Mini-Boss";
    }
  }
}
