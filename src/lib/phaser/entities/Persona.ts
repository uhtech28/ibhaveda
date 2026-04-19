/**
 * Persona.ts
 *
 * Persona — a Phaser Container representing the user's avatar character on the
 * Interactive Ideas world-map. Supports male/female variants with idle float
 * animation and movement capabilities.
 */

import * as Phaser from "phaser";

// ─────────────────────────────────────────────────────────────────────────────
// Exported types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The gender variant for the persona sprite.
 */
export type PersonaGender = "male" | "female";

// ─────────────────────────────────────────────────────────────────────────────
// Persona
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A Phaser Container that renders the user's persona (avatar) character.
 *
 * Features:
 * - Male ("The Founder") or Female ("The Visionary") pixel-art sprite at 3× scale
 * - Idle floating animation with shadow pulse
 * - Movement tweening capability
 * - Walk animation stub (full implementation in Week 2)
 *
 * @example
 * const persona = new Persona(this, 400, 300, 'female');
 * this.add.existing(persona);
 * persona.moveToPosition(600, 400, 1000);
 */
export class Persona extends Phaser.GameObjects.Container {
  // ── Public readonly ───────────────────────────────────────────────────────

  readonly gender: PersonaGender;

  // ── Private state ─────────────────────────────────────────────────────────

  private sprite: Phaser.GameObjects.Image;
  private shadowEllipse: Phaser.GameObjects.Ellipse;
  private floatTween: Phaser.Tweens.Tween | null = null;
  private shadowTween: Phaser.Tweens.Tween | null = null;
  private walkTween: Phaser.Tweens.Tween | null = null;
  private currentAnimation: "idle" | "walk" = "idle";
  private isWalking = false;

  // ── Constructor ───────────────────────────────────────────────────────────

  /**
   * @param scene  The Phaser Scene this persona belongs to.
   * @param x      Initial world X position.
   * @param y      Initial world Y position.
   * @param gender Gender variant ('male' or 'female').
   */
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    gender: PersonaGender,
  ) {
    super(scene, x, y);

    this.gender = gender;

    // ── Shadow ellipse (below persona feet) ─────────────────────────────────
    // 48×14 ellipse, black with 25% opacity, positioned at (0, 66) relative
    // to container origin (which is at persona's feet when sprite origin is
    // bottom-center)
    this.shadowEllipse = new Phaser.GameObjects.Ellipse(
      scene,
      0,
      66,
      48,
      14,
      0x000000,
      0.25,
    );

    // ── Sprite ──────────────────────────────────────────────────────────────
    // The high-resolution guide textures are large PNGs (e.g. 1024x1024).
    // We scale them down to roughly 120-150px height for the map view.
    // Origin is set to (0.5, 0.9) to allow for the character's feet to be at y=0
    // while leaving room for the backpack/head.
    const textureKey = gender === "male" ? "guide_male" : "guide_female";
    const fallbackKey = gender === "male" ? "persona_male_pixel" : "persona_female_pixel";

    // Try to use the high-fidelity guide texture first, fallback to pixel art
    const activeKey = scene.textures.exists(textureKey) ? textureKey : fallbackKey;

    this.sprite = new Phaser.GameObjects.Image(scene, 0, 0, activeKey);
    this.sprite.setOrigin(0.5, 0.95);

    if (activeKey === textureKey) {
      // Scale for high-res images (aim for ~140px height)
      this.sprite.setScale(0.14);
    } else {
      // Legacy scale for pixel art
      this.sprite.setScale(3);
    }

    // ── Assemble container ──────────────────────────────────────────────────
    // Shadow is added first so it renders behind the sprite
    this.add([this.shadowEllipse, this.sprite]);

    // Register with scene
    scene.add.existing(this);

    // Start idle animation
    this.setupFloatAnimation();
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Instantly position persona at checkpoint without animation
   *
   * @param x Target world X coordinate.
   * @param y Target world Y coordinate.
   * @returns This persona instance for chaining.
   */
  override setPosition(x: number, y: number): this {
    this.x = x;
    this.y = y;
    return this;
  }

  /**
   * Smoothly move persona to checkpoint (used during stage transitions)
   *
   * @param targetX Target world X coordinate.
   * @param targetY Target world Y coordinate.
   * @param duration Movement duration in milliseconds (default: 1000ms).
   */
  moveToPosition(targetX: number, targetY: number, duration = 1000): void {
    this.playWalk(targetX, targetY, duration);
  }

  /**
   * Resume idle animation (floating motion)
   */
  playIdle(): void {
    if (this.currentAnimation === "idle") return;

    this.currentAnimation = "idle";
    this.isWalking = false;

    // Stop walk animation if active
    if (this.walkTween) {
      this.walkTween.stop();
      this.walkTween = null;
    }

    // Resume float animation
    if (this.floatTween) {
      this.floatTween.resume();
    } else {
      this.setupFloatAnimation();
    }

    // Resume shadow animation
    if (this.shadowTween) {
      this.shadowTween.resume();
    }
  }

  /**
   * Start walk animation
   * Moves persona to target position with walking animation
   *
   * @param targetX Target world X coordinate.
   * @param targetY Target world Y coordinate.
   * @param duration Movement duration in milliseconds (default: 1000ms).
   */
  playWalk(targetX: number, targetY: number, duration = 1000): void {
    if (this.currentAnimation === "walk") return;

    this.currentAnimation = "walk";
    this.isWalking = true;

    // Stop idle animation
    if (this.floatTween) {
      this.floatTween.pause();
    }
    if (this.shadowTween) {
      this.shadowTween.pause();
    }

    // Reset sprite y to 0 (no float offset)
    this.sprite.y = 0;

    // Add slight bob during walk (smaller than idle float)
    const bobTween = this.scene.tweens.add({
      targets: this.sprite,
      y: { from: 0, to: -4 },
      duration: 200,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: Math.floor(duration / 400),
    });

    // Move the container
    this.walkTween = this.scene.tweens.add({
      targets: this,
      x: targetX,
      y: targetY,
      duration: duration,
      ease: "Linear",
      onComplete: () => {
        bobTween.stop();
        this.currentAnimation = "idle";
        this.playIdle();
      },
    });
  }

  // ── Private: animations ───────────────────────────────────────────────────

  /**
   * Sets up the idle floating animation.
   *
   * Creates two synchronized tweens:
   * 1. Sprite y-position oscillates from 0 to -8 pixels (upward float)
   * 2. Shadow scaleX shrinks from 1.0 to 0.7 (simulating distance from ground)
   *
   * Both tweens run continuously with yoyo enabled.
   */
  private setupFloatAnimation(): void {
    // Float the sprite up and down
    this.floatTween = this.scene.tweens.add({
      targets: this.sprite,
      y: -8,
      duration: 1200,
      ease: Phaser.Math.Easing.Sine.InOut,
      yoyo: true,
      repeat: -1,
    });

    // Shrink shadow as sprite floats up (simulating height change)
    this.shadowTween = this.scene.tweens.add({
      targets: this.shadowEllipse,
      scaleX: 0.7,
      duration: 1200,
      ease: Phaser.Math.Easing.Sine.InOut,
      yoyo: true,
      repeat: -1,
    });
  }
}
