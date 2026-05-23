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
  private static readonly ARRIVAL_EPSILON = 3;

  // ── Public readonly ───────────────────────────────────────────────────────

  readonly gender: PersonaGender;

  // ── Private state ─────────────────────────────────────────────────────────

  private sprite: Phaser.GameObjects.Sprite;
  private shadowEllipse: Phaser.GameObjects.Ellipse;
  private shadowTween: Phaser.Tweens.Tween | null = null;
  private walkTween: Phaser.Tweens.Tween | null = null;
  private currentAnimation: "idle" | "walk" | null = null;
  private isWalking = false;
  private idleFacingRight = true;

  /**
   * True while the persona is actively walking to a destination.
   * Read by WorldMapScene to avoid re-triggering scrollToCheckpoint movement.
   */
  get walking(): boolean {
    return this.isWalking;
  }

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
      0,
      48,
      14,
      0x000000,
      0.25,
    );

    // ── Sprite ──────────────────────────────────────────────────────────────
    // Use sprite sheets for frame-based animations
    // The sprite sheets are 32×48px per frame, rendered at 3× scale (96×144px)
    // Origin Y is set to 40 / 48 so that the visual feet row (at Y=40) aligns at y=0
    const spriteSheetKey =
      gender === "male"
        ? "persona_male_idle_sheet"
        : "persona_female_idle_sheet";

    this.sprite = new Phaser.GameObjects.Sprite(scene, 0, 0, spriteSheetKey, 0);
    this.sprite.setOrigin(0.5, 40 / 48);
    this.sprite.setScale(3); // 32x48px -> 96x144px (3× nearest-neighbour, per PRD §3.1)

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
   * Instantly position persona at checkpoint without animation.
   * Stops all movement tweens and resets to idle state.
   *
   * @param x Target world X coordinate.
   * @param y Target world Y coordinate.
   * @returns This persona instance for chaining.
   */
  override setPosition(x: number, y: number): this {
    // Stop any active movement
    if (this.walkTween) {
      this.walkTween.stop();
      this.walkTween = null;
    }
    this.isWalking = false;

    this.x = x;
    this.y = y;
    // Keep configured idle facing direction when instantly positioned.
    // Safe-check because super() constructor calls setPosition before sprite is initialized.
    if (this.sprite) {
      this.sprite.setFlipX(this.idleFacingRight);
    }
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
   * Sets preferred facing direction for idle state.
   */
  setIdleFacingRight(facingRight: boolean): void {
    this.idleFacingRight = facingRight;
    if (!this.isWalking && this.sprite) {
      this.sprite.setFlipX(this.idleFacingRight);
    }
  }

  moveAlongPath(points: { x: number; y: number }[], duration = 1200): void {
    const route = points.filter((point) => {
      if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return false;
      return (
        Phaser.Math.Distance.Between(this.x, this.y, point.x, point.y) >
        Persona.ARRIVAL_EPSILON
      );
    });
    if (route.length === 0) {
      this.playIdle();
      return;
    }

    if (this.walkTween) {
      this.walkTween.stop();
      this.walkTween = null;
    }

    this.currentAnimation = "walk";
    this.isWalking = true;

    if (this.shadowTween) {
      this.shadowTween.stop();
      this.shadowTween = null;
    }

    const walkAnimKey =
      this.gender === "male" ? "persona_male_walk" : "persona_female_walk";
    this.playSpriteAnimation(walkAnimKey);
    this.startWalkShadowPulse();

    const segmentDuration = Math.max(120, duration / route.length);
    let index = 0;

    const walkNextSegment = () => {
      const point = route[index];
      if (!point) {
        // Reached end of path - ensure we're in idle state
        this.isWalking = false;
        this.currentAnimation = "idle";
        this.playIdle();
        return;
      }

      if (
        Phaser.Math.Distance.Between(this.x, this.y, point.x, point.y) <=
        Persona.ARRIVAL_EPSILON
      ) {
        index += 1;
        walkNextSegment();
        return;
      }

      // Flip sprite based on movement direction
      // Default sprite faces left, so flipX=true when moving right, flipX=false when moving left
      if (point.x !== this.x) {
        const facingRight = point.x > this.x;
        this.sprite.setFlipX(facingRight);
        this.idleFacingRight = facingRight;
      }

      this.walkTween = this.scene.tweens.add({
        targets: this,
        x: point.x,
        y: point.y,
        duration: segmentDuration,
        ease: "Quad.easeOut", // Quad easeOut for smooth path segments
        onComplete: () => {
          index += 1;
          walkNextSegment();
        },
      });
    };

    walkNextSegment();
  }

  /**
   * Resume idle state — persona stands perfectly still at current checkpoint.
   * All movement and floating tweens are stopped; sprite shows static frame 0
   * with NO animation cycling, creating a completely still standing position.
   */
  playIdle(): void {
    this.currentAnimation = "idle";
    this.isWalking = false;

    // ── Stop all active movement tweens ────────────────────────────────────
    if (this.walkTween) {
      this.walkTween.stop();
      this.walkTween = null;
    }

    // ── Stop shadow pulse so shadow stays at fixed size ─────────────────────
    if (this.shadowTween) {
      this.shadowTween.stop();
      this.shadowTween = null;
    }
    // Reset shadow to its natural scale (no drift)
    this.shadowEllipse.setScale(1, 1);

    // ── Stop any playing animation and show static frame 0 ──────────────────
    // This prevents the "glitchy" appearance from animation frame cycling
    if (this.sprite && this.sprite.anims) {
      this.sprite.anims.stop();
      
      // Set to frame 0 of the idle sprite sheet for true static idle
      const spriteSheetKey =
        this.gender === "male"
          ? "persona_male_idle_sheet"
          : "persona_female_idle_sheet";
      this.sprite.setTexture(spriteSheetKey, 0);
    }

    // Keep stable configured facing direction while idle
    if (this.sprite) {
      this.sprite.setFlipX(this.idleFacingRight);
    }
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
    if (
      Phaser.Math.Distance.Between(this.x, this.y, targetX, targetY) <=
      Persona.ARRIVAL_EPSILON
    ) {
      this.x = targetX;
      this.y = targetY;
      this.playIdle();
      return;
    }

    if (this.walkTween) {
      this.walkTween.stop();
      this.walkTween = null;
    }

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
    this.playSpriteAnimation(walkAnimKey);
    this.startWalkShadowPulse();

    // Flip sprite based on movement direction
    if (targetX !== this.x) {
      const facingRight = targetX > this.x;
      this.sprite.setFlipX(facingRight);
      this.idleFacingRight = facingRight;
    }

    // Move the container
    this.walkTween = this.scene.tweens.add({
      targets: this,
      x: targetX,
      y: targetY,
      duration: duration,
      ease: "Sine.easeInOut",
      onComplete: () => {
        this.x = targetX;
        this.y = targetY;
        this.currentAnimation = "idle";
        this.playIdle();
      },
    });
  }

  // ── Private: animations ───────────────────────────────────────────────────

  /**
   * Plays a subtle shadow compression during walk to give a grounded feel.
   * Only active while the persona is walking; automatically stopped on idle.
   */
  private startWalkShadowPulse(): void {
    if (this.shadowTween) {
      this.shadowTween.stop();
    }
    this.shadowEllipse.setScale(1, 1);

    this.shadowTween = this.scene.tweens.add({
      targets: this.shadowEllipse,
      scaleX: { from: 1, to: 0.75 },
      scaleY: { from: 1, to: 0.75 },
      duration: 220,
      ease: Phaser.Math.Easing.Sine.InOut,
      yoyo: true,
      repeat: -1,
    });
  }

  private playSpriteAnimation(animationKey: string): void {
    if (!this.sprite.active) return;

    const animState = this.sprite.anims;
    if (!animState) return;

    const animationExists =
      this.scene.anims.exists(animationKey) ||
      animState.animationManager?.exists(animationKey);

    if (!animationExists) return;

    this.sprite.play(animationKey, true);
  }
}
