/**
 * Persona.ts
 *
 * Persona — a Phaser Container representing the user's avatar character on the
 * Ibhaveda world-map. Supports male/female variants with idle float
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
  /** World pixels covered by one full 8-frame walk cycle at timeScale 1 (16 fps → 0.5s/cycle at ~80px). */
  private static readonly WALK_STRIDE_PX = 80;
  private static readonly WALK_ANIM_FRAMES = 8;
  private static readonly WALK_ANIM_FPS = 16;

  // ── Public readonly ───────────────────────────────────────────────────────

  readonly gender: PersonaGender;

  // ── Private state ─────────────────────────────────────────────────────────

  private sprite: Phaser.GameObjects.Sprite | null = null;
  private shadowEllipse: Phaser.GameObjects.Ellipse;
  private shadowTween: Phaser.Tweens.Tween | null = null;
  private walkTween: Phaser.Tweens.Tween | null = null;
  private walkProgressTween: Phaser.Tweens.Tween | null = null;
  private currentAnimation: "idle" | "walk" | null = null;
  private isWalking = false;
  private idleFacingRight = true;

  // User avatar and speech bubble
  private userAvatar: Phaser.GameObjects.Image | null = null;
  private avatarContainer: Phaser.GameObjects.Container | null = null;
  private avatarBobTween: Phaser.Tweens.Tween | null = null;
  private avatarWalkTween: Phaser.Tweens.Tween | null = null;
  private speechBubble: Phaser.GameObjects.Container | null = null;
  private userName: string = "";
  private userImageUrl: string = "";

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
   * @param userName Optional user name for speech bubble.
   * @param userImageUrl Optional user profile image URL.
   */
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    gender: PersonaGender,
    userName?: string,
    userImageUrl?: string,
  ) {
    super(scene, x, y);

    this.gender = gender;
    this.userName = userName || "";
    this.userImageUrl = userImageUrl || "";

    // ── Shadow ellipse (below persona feet) ─────────────────────────────────
    this.shadowEllipse = new Phaser.GameObjects.Ellipse(
      scene,
      0,
      0,
      48,
      14,
      0x000000,
      0.25,
    );

    // ── Pixel-Art Sprite (Always loaded for maximum RPG aesthetics!) ───────────────────────────
    const spriteSheetKey =
      gender === "male"
        ? "persona_male_idle_sheet"
        : "persona_female_idle_sheet";

    this.sprite = new Phaser.GameObjects.Sprite(scene, 0, 0, spriteSheetKey, 0);
    this.sprite.setOrigin(0.5, 40 / 48);
    this.sprite.setScale(3);
    this.add(this.sprite);

    // ── Integrated User Avatar Badge (Mini gold circular crown floating above head) ────────────
    // Disabled at user request to remove the circular avatar floating icon above the character.

    // ── Assemble container ──────────────────────────────────────────────────
    this.add(this.shadowEllipse);
    this.sendToBack(this.shadowEllipse);

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
    this.stopWalkTweens();
    this.isWalking = false;

    this.x = x;
    this.y = y;
    // Keep configured idle facing direction when instantly positioned.
    // Safe-check because super() constructor calls setPosition before sprite is initialized.
    if (this.sprite) {
      this.sprite.setFlipX(this.idleFacingRight);
      this.sprite.y = 0;
      this.sprite.setAngle(0);
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
    if (!this.isWalking) {
      if (this.sprite) {
        this.sprite.setFlipX(this.idleFacingRight);
      }
      if (this.avatarContainer) {
        this.avatarContainer.scaleX = this.idleFacingRight ? 1 : -1;
        // Re-align the bob tween parameters if running
        if (this.avatarBobTween) {
          this.playIdle();
        }
      }
    }
  }

  moveAlongPath(points: { x: number; y: number }[], duration = 1200): void {
    if (!this.scene) return;

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

    const segments = this.buildPathSegments(route);
    if (segments.length === 0) {
      this.playIdle();
      return;
    }

    const totalPathDistance = segments.reduce((sum, segment) => sum + segment.length, 0);
    this.beginWalk(totalPathDistance, duration);
    this.followPathSegments(segments, totalPathDistance, duration, () => {
      const last = segments[segments.length - 1]?.end;
      if (last) {
        this.x = last.x;
        this.y = last.y;
      }
      this.finishWalk();
    });
  }

  /**
   * Resume idle state — persona stands perfectly still at current checkpoint.
   * All movement and floating tweens are stopped; sprite shows static frame 0
   * with NO animation cycling, creating a completely still standing position.
   * Shows speech bubble with greeting when idle.
   */
  playIdle(): void {
    if (this.currentAnimation === "idle" && !this.isWalking && this.avatarBobTween) {
      return;
    }
    this.currentAnimation = "idle";
    this.isWalking = false;

    // ── Stop all active movement tweens ────────────────────────────────────
    this.stopWalkTweens();

    // ── Stop shadow pulse so shadow stays at fixed size ─────────────────────
    if (this.shadowTween) {
      this.shadowTween.stop();
      this.shadowTween = null;
    }
    // Reset shadow to its natural scale (no drift)
    this.shadowEllipse.setScale(1, 1);

    // ── Stop walk waddle tween on avatar container and reset ───────────────────
    if (this.avatarWalkTween) {
      this.avatarWalkTween.stop();
      this.avatarWalkTween = null;
    }
    if (this.avatarContainer) {
      this.avatarContainer.setAngle(0);
      this.avatarContainer.y = -100;
      this.avatarContainer.scaleX = this.idleFacingRight ? 1 : -1;
      this.avatarContainer.scaleY = 1;
    }

    if (this.sprite) {
      this.sprite.y = 0;
      this.sprite.setAngle(0);
      if (this.sprite.anims) {
        this.sprite.anims.timeScale = 1;
      }
    }

    // ── Start gorgeous breathing bob/pulse loop on avatarContainer ──────────
    if (this.avatarContainer && this.scene) {
      if (this.avatarBobTween) {
        this.avatarBobTween.stop();
        this.avatarBobTween = null;
      }
      this.avatarBobTween = this.scene.tweens.add({
        targets: this.avatarContainer,
        y: -104,
        scaleY: 1.03,
        scaleX: this.idleFacingRight ? 1.03 : -1.03,
        duration: 1500,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });
    }

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

    // Show speech bubble with greeting
    this.showSpeechBubble();
  }

  /**
   * Show a speech bubble with "Hi [Username]!" message
   */
  private showSpeechBubble(): void {
    if (!this.scene) return;

    // Remove existing speech bubble
    if (this.speechBubble) {
      this.speechBubble.destroy();
      this.speechBubble = null;
    }

    if (!this.userName) return;

    const message = `Hi ${this.userName}!`;
    const bubbleWidth = Math.max(140, message.length * 9 + 40);
    const bubbleHeight = 48;
    const bubbleX = 0;
    const bubbleY = -160; // Adjusted for full body character (avatar badge removed)

    // Create speech bubble container
    this.speechBubble = this.scene.add.container(bubbleX, bubbleY);

    // Outer shadow (larger, more diffused)
    const outerShadow = this.scene.add.graphics();
    outerShadow.fillStyle(0x000000, 0.08);
    outerShadow.fillRoundedRect(-bubbleWidth / 2 - 2, -2, bubbleWidth + 4, bubbleHeight + 4, 16);
    this.speechBubble.add(outerShadow);

    // Inner shadow (closer, darker)
    const innerShadow = this.scene.add.graphics();
    innerShadow.fillStyle(0x000000, 0.12);
    innerShadow.fillRoundedRect(-bubbleWidth / 2 + 1, 1, bubbleWidth, bubbleHeight, 14);
    this.speechBubble.add(innerShadow);

    // Main bubble background (white with subtle gradient effect)
    const bubble = this.scene.add.graphics();
    bubble.fillStyle(0xFFFFFF, 1);
    bubble.fillRoundedRect(-bubbleWidth / 2, 0, bubbleWidth, bubbleHeight, 14);

    // Subtle inner highlight for depth
    bubble.fillStyle(0xFFFFFF, 0.5);
    bubble.fillRoundedRect(-bubbleWidth / 2 + 4, 4, bubbleWidth - 8, 12, 8);

    // Bubble border (very subtle)
    bubble.lineStyle(1.5, 0xE8E8E8, 1);
    bubble.strokeRoundedRect(-bubbleWidth / 2, 0, bubbleWidth, bubbleHeight, 14);

    this.speechBubble.add(bubble);

    // Speech bubble tail (pointing down to avatar)
    const tail = this.scene.add.graphics();
    tail.fillStyle(0xFFFFFF, 1);
    tail.beginPath();
    tail.moveTo(-10, bubbleHeight);
    tail.lineTo(10, bubbleHeight);
    tail.lineTo(0, bubbleHeight + 12);
    tail.closePath();
    tail.fillPath();

    // Tail border
    tail.lineStyle(1.5, 0xE8E8E8, 1);
    tail.beginPath();
    tail.moveTo(-10, bubbleHeight);
    tail.lineTo(0, bubbleHeight + 12);
    tail.lineTo(10, bubbleHeight);
    tail.strokePath();

    this.speechBubble.add(tail);

    // Message text with better styling
    const text = this.scene.add.text(-10, bubbleHeight / 2, message, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
      fontSize: '18px',
      color: '#1A1A1A',
      fontStyle: '600',
      align: 'center',
    });
    text.setOrigin(0.5);
    this.speechBubble.add(text);

    // Wave emoji with slight animation
    const wave = this.scene.add.text(bubbleWidth / 2 - 24, bubbleHeight / 2, '👋', {
      fontSize: '22px',
    });
    wave.setOrigin(0.5);
    this.speechBubble.add(wave);

    // Animate wave emoji
    this.scene.tweens.add({
      targets: wave,
      angle: { from: -15, to: 15 },
      duration: 400,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: 2,
      delay: 300,
    });

    // Add to persona container
    this.add(this.speechBubble);

    // Animate bubble entrance with bounce
    this.speechBubble.setScale(0);
    this.speechBubble.setAlpha(0);
    this.scene.tweens.add({
      targets: this.speechBubble,
      scale: 1,
      alpha: 1,
      duration: 400,
      ease: 'Back.easeOut',
    });

    // Auto-hide after 5 seconds with fade
    this.scene.time.delayedCall(5000, () => {
      if (this.speechBubble) {
        this.scene.tweens.add({
          targets: this.speechBubble,
          alpha: 0,
          y: this.speechBubble.y - 10,
          duration: 300,
          ease: 'Sine.easeIn',
          onComplete: () => {
            if (this.speechBubble) {
              this.speechBubble.destroy();
              this.speechBubble = null;
            }
          },
        });
      }
    });
  }

  /**
   * Hide the speech bubble
   */
  hideSpeechBubble(): void {
    if (this.speechBubble) {
      this.speechBubble.destroy();
      this.speechBubble = null;
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
    if (!this.scene) return;

    if (
      Phaser.Math.Distance.Between(this.x, this.y, targetX, targetY) <=
      Persona.ARRIVAL_EPSILON
    ) {
      this.x = targetX;
      this.y = targetY;
      this.playIdle();
      return;
    }

    const start = new Phaser.Math.Vector2(this.x, this.y);
    const end = new Phaser.Math.Vector2(targetX, targetY);
    const distance = start.distance(end);

    this.beginWalk(distance, duration);
    this.followPathSegments(
      [{ start, end, length: distance }],
      distance,
      duration,
      () => {
        this.x = targetX;
        this.y = targetY;
        this.finishWalk();
      },
    );
  }

  // ── Private: animations ───────────────────────────────────────────────────

  private buildPathSegments(
    points: { x: number; y: number }[],
  ): Array<{ start: Phaser.Math.Vector2; end: Phaser.Math.Vector2; length: number }> {
    const segments: Array<{
      start: Phaser.Math.Vector2;
      end: Phaser.Math.Vector2;
      length: number;
    }> = [];

    let previous = new Phaser.Math.Vector2(this.x, this.y);
    for (const point of points) {
      const next = new Phaser.Math.Vector2(point.x, point.y);
      const length = previous.distance(next);
      if (length > Persona.ARRIVAL_EPSILON) {
        segments.push({ start: previous.clone(), end: next, length });
        previous = next;
      }
    }

    return segments;
  }

  private beginWalk(totalDistance: number, duration: number): void {
    if (!this.scene) return;

    this.hideSpeechBubble();
    this.stopWalkTweens();

    this.currentAnimation = "walk";
    this.isWalking = true;

    if (this.shadowTween) {
      this.shadowTween.stop();
      this.shadowTween = null;
    }

    if (this.sprite) {
      const walkAnimKey =
        this.gender === "male" ? "persona_male_walk" : "persona_female_walk";
      this.playSpriteAnimation(walkAnimKey);
      this.syncWalkAnimationSpeed(totalDistance, duration);
    }

    this.shadowEllipse.setScale(1, 1);

    if (this.avatarBobTween) {
      this.avatarBobTween.stop();
      this.avatarBobTween = null;
    }
    if (this.avatarContainer && this.scene) {
      if (this.avatarWalkTween) {
        this.avatarWalkTween.stop();
        this.avatarWalkTween = null;
      }
      this.avatarContainer.y = -100;
      const bobDuration = this.getWalkCycleDurationMs(duration, totalDistance) * 0.5;
      this.avatarWalkTween = this.scene.tweens.add({
        targets: this.avatarContainer,
        y: { from: -100, to: -112 },
        angle: { from: -6, to: 6 },
        duration: bobDuration,
        ease: "Sine.easeInOut",
        yoyo: true,
        repeat: -1,
      });
    }
  }

  private followPathSegments(
    segments: Array<{ start: Phaser.Math.Vector2; end: Phaser.Math.Vector2; length: number }>,
    totalDistance: number,
    duration: number,
    onComplete: () => void,
  ): void {
    if (!this.scene || totalDistance <= 0) {
      onComplete();
      return;
    }

    const progress = { t: 0 };
    let lastX = this.x;

    this.walkProgressTween = this.scene.tweens.add({
      targets: progress,
      t: 1,
      duration: Math.max(16, duration),
      ease: "Linear",
      onUpdate: () => {
        const traveled = progress.t * totalDistance;
        let accumulated = 0;

        for (const segment of segments) {
          if (accumulated + segment.length >= traveled || segment === segments[segments.length - 1]) {
            const localT =
              segment.length > 0
                ? Phaser.Math.Clamp((traveled - accumulated) / segment.length, 0, 1)
                : 0;
            const nextX = Phaser.Math.Linear(segment.start.x, segment.end.x, localT);
            const nextY = Phaser.Math.Linear(segment.start.y, segment.end.y, localT);

            this.x = nextX;
            this.y = nextY;

            const deltaX = nextX - lastX;
            if (Math.abs(deltaX) > 0.05) {
              const facingRight = deltaX > 0;
              this.idleFacingRight = facingRight;
              if (this.sprite) {
                this.sprite.setFlipX(facingRight);
              }
              if (this.avatarContainer) {
                this.avatarContainer.scaleX = facingRight ? 1 : -1;
              }
            }
            lastX = nextX;

            this.updateWalkVisuals(traveled);
            break;
          }
          accumulated += segment.length;
        }
      },
      onComplete,
    });
  }

  private finishWalk(): void {
    this.isWalking = false;
    this.currentAnimation = "idle";
    this.stopWalkTweens();
    this.playIdle();
  }

  private stopWalkTweens(): void {
    if (this.walkTween) {
      this.walkTween.stop();
      this.walkTween = null;
    }
    if (this.walkProgressTween) {
      this.walkProgressTween.stop();
      this.walkProgressTween = null;
    }
  }

  private getWalkCycleDurationMs(duration: number, distance: number): number {
    const speedPxPerSec = distance / (duration / 1000);
    const baseCycleSpeed =
      Persona.WALK_STRIDE_PX / (Persona.WALK_ANIM_FRAMES / Persona.WALK_ANIM_FPS);
    const timeScale = Phaser.Math.Clamp(speedPxPerSec / baseCycleSpeed, 1.0, 3.5);
    return (Persona.WALK_ANIM_FRAMES / Persona.WALK_ANIM_FPS) * 1000 / timeScale;
  }

  private syncWalkAnimationSpeed(distancePx: number, durationMs: number): void {
    if (!this.sprite?.anims) return;

    const speedPxPerSec = distancePx / (durationMs / 1000);
    const baseCycleSpeed =
      Persona.WALK_STRIDE_PX / (Persona.WALK_ANIM_FRAMES / Persona.WALK_ANIM_FPS);
    const timeScale = Phaser.Math.Clamp(speedPxPerSec / baseCycleSpeed, 1.0, 3.5);

    if (this.sprite.anims.isPlaying) {
      this.sprite.anims.timeScale = timeScale;
    }
  }

  private updateWalkVisuals(distanceTraveled: number): void {
    const phase = (distanceTraveled / Persona.WALK_STRIDE_PX) * Math.PI * 2;

    if (this.sprite) {
      // Stronger vertical bob for a confident, weighty stride
      this.sprite.y = Math.abs(Math.sin(phase)) * -5.0;
      // Slight lateral lean into each step
      this.sprite.setAngle(Math.sin(phase) * 2.5);
    }

    // Shadow pulses tighter when foot is lifted, wider when planted
    const liftPhase = Math.abs(Math.sin(phase));
    this.shadowEllipse.setScale(
      Phaser.Math.Linear(1.05, 0.7, liftPhase),
      Phaser.Math.Linear(1.0, 0.6, liftPhase),
    );
  }

  private playSpriteAnimation(animationKey: string): void {
    if (!this.scene || !this.sprite || !this.sprite.active) return;

    const animState = this.sprite.anims;
    if (!animState) return;

    const animationExists =
      this.scene.anims.exists(animationKey) ||
      animState.animationManager?.exists(animationKey);

    if (!animationExists) return;

    this.sprite.play(animationKey, true);
  }

  /**
   * Create a fallback avatar when image loading fails
   */
  private createFallbackAvatar(
    scene: Phaser.Scene,
    placeholder: Phaser.GameObjects.Shape,
    container: Phaser.GameObjects.Container
  ): void {
    // Use a nice gradient color based on first letter
    const colors = [
      0x4A90E2, // Blue
      0xE94B9C, // Pink
      0x50C878, // Green
      0xF59E0B, // Orange
      0x8B5CF6, // Purple
      0xEC4899, // Rose
      0x06B6D4, // Cyan
      0xF97316, // Amber
    ];
    const charCode = this.userName.charCodeAt(0) || 65;
    const colorIndex = charCode % colors.length;

    placeholder.setFillStyle(colors[colorIndex]);

    const fallbackText = scene.add.text(0, 0, this.userName.charAt(0).toUpperCase(), {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
      fontSize: '48px',
      color: '#FFFFFF',
      fontStyle: 'bold',
    });
    fallbackText.setOrigin(0.5);
    container.add(fallbackText);

    // Add pulse animation to fallback too
    scene.tweens.add({
      targets: container,
      scale: { from: 1, to: 1.05 },
      duration: 2000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
  }
}
