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

  private sprite: Phaser.GameObjects.Sprite;
  private shadowEllipse: Phaser.GameObjects.Ellipse;
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
    // Use sprite sheets for frame-based animations
    // The sprite sheets are 32×48px per frame, rendered at 3× scale (96×144px)
    // Origin is set to (0.5, 1.0) to allow for the character's feet to be at y=0
    const spriteSheetKey =
      gender === "male"
        ? "persona_male_idle_sheet"
        : "persona_female_idle_sheet";

    this.sprite = new Phaser.GameObjects.Sprite(scene, 0, 0, spriteSheetKey, 0);
    this.sprite.setOrigin(0.5, 1.0);
    this.sprite.setScale(3); // 32×48px → 96×144px with nearest-neighbor

    // ── Assemble container ──────────────────────────────────────────────────
    // Shadow is added first so it renders behind the sprite
    this.add([this.shadowEllipse, this.sprite]);

    // Register with scene
    scene.add.existing(this);

    // Start idle animation
    this.playIdle();
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
   * Resume idle animation (sprite-based animation)
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

    // Play idle sprite animation
    const idleAnimKey =
      this.gender === "male" ? "persona_male_idle" : "persona_female_idle";
    this.sprite.play(idleAnimKey, true);

    // Start subtle shadow pulse for idle
    this.startIdleShadowPulse();
  }

  /**
   * Start walk animation (sprite-based animation)
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

    // Stop idle shadow animation
    if (this.shadowTween) {
      this.shadowTween.stop();
      this.shadowTween = null;
    }

    // Play walk sprite animation
    const walkAnimKey =
      this.gender === "male" ? "persona_male_walk" : "persona_female_walk";
    this.sprite.play(walkAnimKey, true);

    // Move the container
    this.walkTween = this.scene.tweens.add({
      targets: this,
      x: targetX,
      y: targetY,
      duration: duration,
      ease: "Linear",
      onComplete: () => {
        this.currentAnimation = "idle";
        this.playIdle();
      },
    });
  }

  // ── Private: animations ───────────────────────────────────────────────────

  /**
   * Starts a subtle shadow pulse during idle animation.
   * Shadow scales slightly to create a hovering effect.
   */
  private startIdleShadowPulse(): void {
    // Stop any existing shadow animation
    if (this.shadowTween) {
      this.shadowTween.stop();
    }

    // Subtle shadow pulse during idle
    this.shadowTween = this.scene.tweens.add({
      targets: this.shadowEllipse,
      scaleX: 0.85,
      scaleY: 0.85,
      duration: 1200,
      ease: Phaser.Math.Easing.Sine.InOut,
      yoyo: true,
      repeat: -1,
    });
  }
}
