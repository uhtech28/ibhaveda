/**
 * SpriteAnimator
 *
 * Reusable procedural animation toolkit for painted sprites. Designed
 * for assets that are STILL portraits / 4-direction reference sheets
 * (no walk-cycle frames). Builds game-feel through tweened transforms,
 * tints, and particle bursts.
 *
 * Used by Persona (idle bob), MiniBoss (damage / retreat / slay), and
 * super boss reveal cinematics. Every method returns a Tween or
 * Promise so cinematic sequences can be chained / awaited.
 *
 * PRD references:
 *  - § 6.2 Corruption Visual Thresholds (boss progressive reveal)
 *  - § 7 Checkpoint Crossing Animations (consistent timing standards)
 *  - § 14.1 Animation Timing Standards
 */

import * as Phaser from "phaser";

export type AnimatableTarget =
  | Phaser.GameObjects.Image
  | Phaser.GameObjects.Sprite
  | Phaser.GameObjects.Container;

export interface IdleBobOptions {
  /** Vertical travel in px (peak above baseline). Default 4. */
  amplitude?: number;
  /** Full cycle duration in ms. Default 2200. */
  duration?: number;
  /** Optional phase offset so multiple sprites don't bob in sync. */
  delay?: number;
}

export interface DamageFlashOptions {
  /** Hex color for the flash. Default 0xff4040. */
  color?: number;
  /** Shake distance in px. Default 6. */
  shake?: number;
  /** Total flash duration in ms. Default 320. */
  duration?: number;
}

export interface DriftRetreatOptions {
  /** X delta — positive drifts right, negative left. Default 120. */
  driftX?: number;
  /** Y delta — slight upward float. Default -30. */
  driftY?: number;
  /** Duration in ms. Default 900. */
  duration?: number;
}

export interface SlayOptions {
  /** Rotation in radians. Default Math.PI / 3 (~60 deg). */
  rotation?: number;
  /** Particle burst count. Default 24. */
  particleCount?: number;
  /** Particle color. Default 0xffd700 (gold). */
  particleColor?: number;
  /** Duration in ms. Default 1100. */
  duration?: number;
}

export class SpriteAnimator {
  /**
   * Continuous idle "breathing" — gentle Y bob + slight scale pulse.
   * Returns the tween so callers can pause/kill it on cleanup.
   *
   * Safe to call once per sprite. The tween repeats forever and
   * yoyo's so the sprite ends up at its base position between cycles.
   */
  static startIdleBob(
    scene: Phaser.Scene,
    target: AnimatableTarget,
    opts: IdleBobOptions = {},
  ): Phaser.Tweens.Tween {
    const amplitude = opts.amplitude ?? 4;
    const duration = opts.duration ?? 2200;
    const baseY = target.y;
    return scene.tweens.add({
      targets: target,
      y: baseY - amplitude,
      duration,
      yoyo: true,
      repeat: -1,
      delay: opts.delay ?? Math.random() * 600,
      ease: "Sine.easeInOut",
    });
  }

  /**
   * One-shot damage flash. Tints red, shakes horizontally, returns
   * to baseline color. Useful when a checkpoint clear hits a stage
   * monster — provides instant feedback that the player's work landed.
   *
   * Returns a Promise that resolves when the flash completes.
   */
  static damageFlash(
    scene: Phaser.Scene,
    target: AnimatableTarget,
    opts: DamageFlashOptions = {},
  ): Promise<void> {
    return new Promise((resolve) => {
      const color = opts.color ?? 0xff4040;
      const shake = opts.shake ?? 6;
      const duration = opts.duration ?? 320;
      const baseX = target.x;

      // Tint — only supported on Image/Sprite, not Container
      const isTintable =
        target instanceof Phaser.GameObjects.Image ||
        target instanceof Phaser.GameObjects.Sprite;
      if (isTintable) {
        (target as Phaser.GameObjects.Image).setTint(color);
      }

      // Shake — 4 quick alternating jolts
      const jolts = 4;
      const joltDuration = duration / (jolts + 1);
      let phase = 0;

      const doJolt = () => {
        const dir = phase % 2 === 0 ? 1 : -1;
        scene.tweens.add({
          targets: target,
          x: baseX + dir * shake,
          duration: joltDuration / 2,
          yoyo: true,
          ease: "Sine.easeInOut",
          onComplete: () => {
            phase += 1;
            if (phase < jolts) {
              doJolt();
            } else {
              // Restore baseline tint + position
              if (isTintable) {
                (target as Phaser.GameObjects.Image).clearTint();
              }
              target.x = baseX;
              resolve();
            }
          },
        });
      };

      doJolt();
    });
  }

  /**
   * "Retreat" animation — sprite drifts off in the given direction,
   * fades to transparent. Used when a stage monster is partial-cleared
   * (2/3 tasks at the final checkpoint) — PRD calls for the monster
   * to retreat rather than die.
   */
  static retreat(
    scene: Phaser.Scene,
    target: AnimatableTarget,
    opts: DriftRetreatOptions = {},
  ): Promise<void> {
    return new Promise((resolve) => {
      const driftX = opts.driftX ?? 120;
      const driftY = opts.driftY ?? -30;
      const duration = opts.duration ?? 900;
      scene.tweens.add({
        targets: target,
        x: target.x + driftX,
        y: target.y + driftY,
        alpha: 0,
        duration,
        ease: "Cubic.easeIn",
        onComplete: () => resolve(),
      });
    });
  }

  /**
   * "Slay" animation — rotation + particle burst + fade. Used when a
   * stage monster is fully cleared (3/3 final checkpoint) — PRD calls
   * for the monster to be slain with a unique animation.
   *
   * The particle burst is graphics-based (no atlas required) so it
   * works without any extra asset pipeline.
   */
  static slay(
    scene: Phaser.Scene,
    target: AnimatableTarget,
    opts: SlayOptions = {},
  ): Promise<void> {
    return new Promise((resolve) => {
      const rotation = opts.rotation ?? Math.PI / 3;
      const particleCount = opts.particleCount ?? 24;
      const particleColor = opts.particleColor ?? 0xffd700;
      const duration = opts.duration ?? 1100;

      const cx = target.x;
      const cy = target.y;

      // Particle burst — 24 graphics points flying outward
      const particles: Phaser.GameObjects.Graphics[] = [];
      for (let i = 0; i < particleCount; i++) {
        const p = scene.add.graphics();
        p.fillStyle(particleColor, 1);
        p.fillCircle(0, 0, 3 + Math.random() * 2);
        p.setPosition(cx, cy);
        p.setDepth(1001);
        particles.push(p);
        const a = (i / particleCount) * Math.PI * 2 + Math.random() * 0.3;
        const speed = 60 + Math.random() * 60;
        scene.tweens.add({
          targets: p,
          x: cx + Math.cos(a) * speed,
          y: cy + Math.sin(a) * speed - Math.random() * 30,
          alpha: 0,
          scale: 0.3,
          duration: 900 + Math.random() * 400,
          ease: "Cubic.easeOut",
          onComplete: () => p.destroy(),
        });
      }

      // Sprite — rotate + scale up briefly + fade out
      scene.tweens.add({
        targets: target,
        rotation,
        scale: { from: 1, to: 1.15 },
        alpha: 0,
        duration,
        ease: "Cubic.easeOut",
        onComplete: () => resolve(),
      });
    });
  }

  /**
   * Tint pulse — useful for boss progressive reveal as corruption
   * rises. Cycles tint between two colours and back.
   */
  static tintPulse(
    scene: Phaser.Scene,
    target: AnimatableTarget,
    fromColor: number,
    toColor: number,
    duration = 1400,
  ): Phaser.Tweens.Tween | null {
    const isTintable =
      target instanceof Phaser.GameObjects.Image ||
      target instanceof Phaser.GameObjects.Sprite;
    if (!isTintable) return null;
    const img = target as Phaser.GameObjects.Image;
    img.setTint(fromColor);
    // Phaser doesn't tween tint directly — use an interpolation
    // counter that lerps between the two colors each frame.
    const fromR = (fromColor >> 16) & 0xff;
    const fromG = (fromColor >> 8) & 0xff;
    const fromB = fromColor & 0xff;
    const toR = (toColor >> 16) & 0xff;
    const toG = (toColor >> 8) & 0xff;
    const toB = toColor & 0xff;
    const obj = { t: 0 };
    return scene.tweens.add({
      targets: obj,
      t: 1,
      duration,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
      onUpdate: () => {
        const r = Math.round(fromR + (toR - fromR) * obj.t);
        const g = Math.round(fromG + (toG - fromG) * obj.t);
        const b = Math.round(fromB + (toB - fromB) * obj.t);
        img.setTint((r << 16) | (g << 8) | b);
      },
    });
  }

  /**
   * Camera "boom" — quick screen shake + brief white flash. Used to
   * punctuate boss manifestation, level-up, and final stage clear.
   */
  static cameraBoom(
    scene: Phaser.Scene,
    options: { shakeMs?: number; shakeIntensity?: number; flashMs?: number } = {},
  ): Promise<void> {
    return new Promise((resolve) => {
      const shakeMs = options.shakeMs ?? 350;
      const shakeIntensity = options.shakeIntensity ?? 0.012;
      const flashMs = options.flashMs ?? 220;
      const cam = scene.cameras.main;
      cam.shake(shakeMs, shakeIntensity);
      cam.flash(flashMs, 255, 255, 255, false, (_c: unknown, progress: number) => {
        if (progress >= 1) resolve();
      });
    });
  }
}
