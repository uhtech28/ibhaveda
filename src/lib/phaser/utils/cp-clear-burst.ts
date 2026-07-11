/**
 * @file cp-clear-burst.ts
 * @description Lightweight "checkpoint cleared" visual burst for stages
 *  2-4. Village uses the full CompassCalibrationAnimation class; the
 *  newer stage scenes get a compact version that reads as satisfying
 *  reward without the extra complexity.
 *
 *  The effect: a gold ring expands out from the CP marker, a burst of
 *  small stars fires outward, and the CP marker itself pulses.
 *
 *  Usage:
 *   ```ts
 *   playCpClearBurst(scene, cpX, cpY, "gold");
 *   ```
 */

import * as Phaser from "phaser";

export type BurstVariant = "standard" | "gold";

interface Palette {
  ringColor: number;
  starColor: number;
  glowColor: number;
}

const PALETTES: Record<BurstVariant, Palette> = {
  standard: {
    ringColor: 0xffd166,
    starColor: 0xffedb0,
    glowColor: 0xfff2a0,
  },
  gold: {
    ringColor: 0xfbbf24,
    starColor: 0xfef3c7,
    glowColor: 0xffcf40,
  },
};

/**
 * Plays a CP-cleared burst at the given world coordinates.
 * Auto-cleans up all objects when the animation finishes (~1400ms).
 */
export function playCpClearBurst(
  scene: Phaser.Scene,
  x: number,
  y: number,
  variant: BurstVariant = "standard",
): void {
  const palette = PALETTES[variant];

  // 1. Expanding ring — thick gold outline that grows out and fades
  const ring = scene.add
    .circle(x, y, 26, palette.ringColor, 0)
    .setStrokeStyle(4, palette.ringColor, 1)
    .setDepth(120)
    .setBlendMode(Phaser.BlendModes.ADD);

  scene.tweens.add({
    targets: ring,
    scale: variant === "gold" ? 6 : 4.5,
    alpha: 0,
    duration: 1000,
    ease: "Sine.easeOut",
    onComplete: () => ring.destroy(),
  });

  // 2. Radial glow flash — bright pulse under the ring
  const glow = scene.add
    .circle(x, y, 60, palette.glowColor, 0.7)
    .setDepth(118)
    .setBlendMode(Phaser.BlendModes.ADD);

  scene.tweens.add({
    targets: glow,
    scale: 2.2,
    alpha: 0,
    duration: 700,
    ease: "Sine.easeOut",
    onComplete: () => glow.destroy(),
  });

  // 3. Star burst — 8-12 small stars firing outward
  const starCount = variant === "gold" ? 14 : 10;
  for (let i = 0; i < starCount; i++) {
    const angle = (i / starCount) * Math.PI * 2 + Math.random() * 0.3;
    const distance = 60 + Math.random() * 80;
    const star = scene.add
      .star(x, y, 4, 2, 5, palette.starColor, 1)
      .setDepth(121)
      .setBlendMode(Phaser.BlendModes.ADD);

    scene.tweens.add({
      targets: star,
      x: x + Math.cos(angle) * distance,
      y: y + Math.sin(angle) * distance,
      scale: 0.2,
      alpha: 0,
      angle: 180,
      duration: 900 + Math.random() * 400,
      ease: "Sine.easeOut",
      onComplete: () => star.destroy(),
    });
  }

  // 4. Vertical column of light — brief gold beam rising skyward
  const beam = scene.add
    .rectangle(x, y - 40, 12, 80, palette.glowColor, 0.5)
    .setDepth(119)
    .setBlendMode(Phaser.BlendModes.ADD);

  scene.tweens.add({
    targets: beam,
    y: y - 120,
    scaleY: 1.6,
    alpha: 0,
    duration: 800,
    ease: "Sine.easeOut",
    onComplete: () => beam.destroy(),
  });
}
