/**
 * BossDefeatChoreographer
 *
 * PRD § 6.3 — each of 12 super bosses has a unique narrative defeat.
 * This module maps bossSlug → a tailored cinematic that runs on the
 * painted BossSilhouette sprite when the boss is finally defeated.
 *
 * Defeats are decoupled from corruption/HP — they fire when the
 * React side dispatches BOSS_FINAL_OUTCOME with outcome "slay_gold"
 * or "retreat_permanent". Retreat plays a quieter exit; slay_gold
 * plays the unique cinematic below.
 *
 * Every defeat returns a Promise that resolves once the choreography
 * completes, so callers can chain a celebration banner after.
 */

import * as Phaser from "phaser";
import { SpriteAnimator } from "../animations/SpriteAnimator";

export type BossSlug =
  | "unraveller"
  | "pale-architect"
  | "hollow-king"
  | "thornwarden"
  | "mirror-witch"
  | "ashen-drake"
  | "tide-caller"
  | "gravemind"
  | "rusted-oracle"
  | "wraith-council"
  | "stonecaller"
  | "veilwalker";

export interface BossDefeatContext {
  scene: Phaser.Scene;
  /** The painted boss sprite image (rendered by BossSilhouette). */
  sprite: Phaser.GameObjects.Image | null;
  /** The container that holds the sprite — for camera-relative effects. */
  container: Phaser.GameObjects.Container;
  /** Optional procedural fallback graphics to fade alongside. */
  silhouette?: Phaser.GameObjects.Graphics;
}

export class BossDefeatChoreographer {
  /**
   * Run the boss-specific defeat cinematic. Falls back to a generic
   * shatter+fade if the bossSlug is unrecognised.
   */
  static async play(slug: BossSlug, ctx: BossDefeatContext): Promise<void> {
    switch (slug) {
      case "unraveller":
        return this.unraveller(ctx);
      case "pale-architect":
        return this.paleArchitect(ctx);
      case "hollow-king":
        return this.hollowKing(ctx);
      case "thornwarden":
        return this.thornwarden(ctx);
      case "mirror-witch":
        return this.mirrorWitch(ctx);
      case "ashen-drake":
        return this.ashenDrake(ctx);
      case "tide-caller":
        return this.tideCaller(ctx);
      case "gravemind":
        return this.gravemind(ctx);
      case "rusted-oracle":
        return this.rustedOracle(ctx);
      case "wraith-council":
        return this.wraithCouncil(ctx);
      case "stonecaller":
        return this.stonecaller(ctx);
      case "veilwalker":
        return this.veilwalker(ctx);
      default:
        return this.generic(ctx);
    }
  }

  /**
   * The Unraveller — "weave the final stage's outcome into a coherent
   * whole, sealing the threads it pulled loose". Defeat: threads of
   * golden light knit together over the sprite, then fade.
   */
  private static async unraveller(ctx: BossDefeatContext): Promise<void> {
    if (!ctx.sprite) return this.generic(ctx);
    const { scene, sprite } = ctx;
    const cx = sprite.x + ctx.container.x;
    const cy = sprite.y + ctx.container.y;

    // 16 golden thread lines knit from edges toward center
    const threads: Phaser.GameObjects.Graphics[] = [];
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const radius = 180;
      const sx = cx + Math.cos(angle) * radius;
      const sy = cy + Math.sin(angle) * radius;
      const thread = scene.add.graphics();
      thread.lineStyle(2, 0xffd700, 0.9);
      thread.lineBetween(sx, sy, sx, sy);
      thread.setDepth(2010);
      threads.push(thread);
      scene.tweens.add({
        targets: { t: 0 },
        t: 1,
        duration: 700,
        ease: "Sine.easeInOut",
        onUpdate: (tween) => {
          const t = (tween.targets[0] as { t: number }).t;
          const ex = sx + (cx - sx) * t;
          const ey = sy + (cy - sy) * t;
          thread.clear();
          thread.lineStyle(2, 0xffd700, 1);
          thread.lineBetween(sx, sy, ex, ey);
        },
        onComplete: () => {
          scene.tweens.add({
            targets: thread,
            alpha: 0,
            duration: 500,
            onComplete: () => thread.destroy(),
          });
        },
      });
    }

    await this.delay(scene, 800);
    return SpriteAnimator.slay(scene, sprite, {
      rotation: 0,
      particleCount: 32,
      particleColor: 0xffd700,
      duration: 1100,
    });
  }

  /**
   * The Pale Architect — "ship something imperfect. The act of
   * completing despite flaws destroys its power". Defeat: amber
   * casing cracks all over, then shatters into golden shards.
   */
  private static async paleArchitect(ctx: BossDefeatContext): Promise<void> {
    if (!ctx.sprite) return this.generic(ctx);
    const { scene, sprite } = ctx;
    const cx = sprite.x + ctx.container.x;
    const cy = sprite.y + ctx.container.y;

    // Brief amber tint pulse before shatter
    await SpriteAnimator.tintPulse(scene, sprite, 0xffd700, 0xff8c00, 600);
    await this.delay(scene, 200);

    // Shatter — many small shards burst outward as sprite spins + fades
    const shards: Phaser.GameObjects.Graphics[] = [];
    for (let i = 0; i < 40; i++) {
      const s = scene.add.graphics();
      const color = i % 3 === 0 ? 0xffd700 : i % 3 === 1 ? 0xffa726 : 0xffe082;
      s.fillStyle(color, 1);
      const w = 4 + Math.random() * 4;
      const h = 6 + Math.random() * 5;
      s.fillTriangle(0, -h / 2, -w / 2, h / 2, w / 2, h / 2);
      s.setPosition(cx, cy);
      s.setDepth(2020);
      s.setRotation(Math.random() * Math.PI * 2);
      shards.push(s);
      const a = (i / 40) * Math.PI * 2 + Math.random() * 0.4;
      const speed = 120 + Math.random() * 100;
      scene.tweens.add({
        targets: s,
        x: cx + Math.cos(a) * speed,
        y: cy + Math.sin(a) * speed + 80,
        rotation: s.rotation + Math.PI * 2,
        alpha: 0,
        duration: 1000,
        ease: "Cubic.easeOut",
        onComplete: () => s.destroy(),
      });
    }
    return SpriteAnimator.slay(scene, sprite, {
      rotation: Math.PI / 8,
      particleCount: 0,
      duration: 1100,
    });
  }

  /**
   * The Hollow King — "reconnect to the original impulse. Colour
   * floods back stage by stage in reverse order". Defeat: color
   * desaturate-to-resaturate flash + the king fades.
   */
  private static async hollowKing(ctx: BossDefeatContext): Promise<void> {
    if (!ctx.sprite) return this.generic(ctx);
    const { scene, sprite } = ctx;

    // Tint desaturates to gray, then floods back to white
    sprite.setTint(0x666666);
    await this.delay(scene, 300);
    scene.tweens.add({
      targets: { t: 0 },
      t: 1,
      duration: 600,
      ease: "Sine.easeOut",
      onUpdate: (tween) => {
        const t = (tween.targets[0] as { t: number }).t;
        const gray = Math.round(0x66 + (0xff - 0x66) * t);
        sprite.setTint((gray << 16) | (gray << 8) | gray);
      },
    });
    await this.delay(scene, 700);
    return SpriteAnimator.slay(scene, sprite, {
      particleColor: 0xffffff,
      duration: 1100,
    });
  }

  /**
   * The Thornwarden — "each gold checkpoint clears a path it can't
   * regrow". Defeat: green vines fall away from the sprite as it
   * collapses.
   */
  private static async thornwarden(ctx: BossDefeatContext): Promise<void> {
    if (!ctx.sprite) return this.generic(ctx);
    return SpriteAnimator.slay(ctx.scene, ctx.sprite, {
      rotation: Math.PI / 4,
      particleCount: 30,
      particleColor: 0x65a30d,
      duration: 1200,
    });
  }

  /**
   * The Mirror Witch — "each validation breaks a mirror. Enough
   * mirrors broken dispels the illusion entirely". Defeat: sprite
   * splits into 5 reflections that shatter outward.
   */
  private static async mirrorWitch(ctx: BossDefeatContext): Promise<void> {
    if (!ctx.sprite) return this.generic(ctx);
    const { scene, sprite } = ctx;
    const cx = sprite.x + ctx.container.x;
    const cy = sprite.y + ctx.container.y;

    // Clone sprite into 5 mirror images that drift outward
    const clones: Phaser.GameObjects.Image[] = [];
    for (let i = 0; i < 5; i++) {
      const clone = scene.add.image(cx, cy, sprite.texture.key);
      clone.setScale(sprite.scaleX, sprite.scaleY);
      clone.setOrigin(sprite.originX, sprite.originY);
      clone.setAlpha(0.7);
      clone.setTint(0xc4b5fd);
      clone.setDepth(2015);
      clones.push(clone);
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      scene.tweens.add({
        targets: clone,
        x: cx + Math.cos(a) * 140,
        y: cy + Math.sin(a) * 100,
        alpha: 0,
        rotation: (Math.random() - 0.5) * Math.PI / 4,
        scale: { from: sprite.scaleX, to: sprite.scaleX * 0.3 },
        duration: 900,
        ease: "Cubic.easeOut",
        onComplete: () => clone.destroy(),
      });
    }
    return SpriteAnimator.slay(scene, sprite, {
      particleCount: 26,
      particleColor: 0xc4b5fd,
      duration: 1100,
    });
  }

  /**
   * The Ashen Drake — "consistent forward motion. The ash transforms
   * into gold dust on every completed stage". Defeat: sprite turns
   * to embers then golden dust.
   */
  private static async ashenDrake(ctx: BossDefeatContext): Promise<void> {
    if (!ctx.sprite) return this.generic(ctx);
    const { scene, sprite } = ctx;
    // Tint to orange first (embers), then drift up as gold
    sprite.setTint(0xff8c00);
    await this.delay(scene, 400);
    return SpriteAnimator.slay(scene, sprite, {
      rotation: 0,
      particleCount: 50,
      particleColor: 0xffd700,
      duration: 1300,
    });
  }

  /**
   * The Tide Caller — "each prioritisation drains the flood. The
   * tide recedes completely revealing solid ground". Defeat: sprite
   * dissolves into blue water particles that drain downward.
   */
  private static async tideCaller(ctx: BossDefeatContext): Promise<void> {
    if (!ctx.sprite) return this.generic(ctx);
    const { scene, sprite } = ctx;
    const cx = sprite.x + ctx.container.x;
    const cy = sprite.y + ctx.container.y;
    for (let i = 0; i < 28; i++) {
      const p = scene.add.graphics();
      p.fillStyle(0x06b6d4, 0.9);
      p.fillCircle(0, 0, 3 + Math.random() * 2);
      p.setPosition(cx + (Math.random() - 0.5) * 100, cy + (Math.random() - 0.5) * 60);
      p.setDepth(2010);
      scene.tweens.add({
        targets: p,
        y: p.y + 200,
        x: p.x + (Math.random() - 0.5) * 40,
        alpha: 0,
        duration: 1100 + Math.random() * 400,
        ease: "Cubic.easeIn",
        onComplete: () => p.destroy(),
      });
    }
    return SpriteAnimator.slay(scene, sprite, {
      particleCount: 0,
      duration: 1100,
    });
  }

  /**
   * The Gravemind — "each completed checkpoint buries a corpse
   * permanently. A full run clears the graveyard". Defeat: sprite
   * sinks into the ground, then sprite + black particles rise as
   * the spirits are released.
   */
  private static async gravemind(ctx: BossDefeatContext): Promise<void> {
    if (!ctx.sprite) return this.generic(ctx);
    const { scene, sprite } = ctx;
    const baseY = sprite.y;
    scene.tweens.add({
      targets: sprite,
      y: baseY + 100,
      duration: 600,
      ease: "Cubic.easeIn",
    });
    await this.delay(scene, 700);
    return SpriteAnimator.slay(scene, sprite, {
      rotation: 0,
      particleCount: 40,
      particleColor: 0x8b5cf6,
      duration: 1200,
    });
  }

  /**
   * The Rusted Oracle — "each original insight silences one of its
   * voices". Defeat: sprite emits 6 voice waves that fade outward,
   * then sprite shatters into rust dust.
   */
  private static async rustedOracle(ctx: BossDefeatContext): Promise<void> {
    if (!ctx.sprite) return this.generic(ctx);
    const { scene, sprite } = ctx;
    const cx = sprite.x + ctx.container.x;
    const cy = sprite.y + ctx.container.y;
    for (let i = 0; i < 6; i++) {
      const ring = scene.add.graphics();
      ring.lineStyle(3, 0xb45309, 0.7);
      ring.strokeCircle(cx, cy, 20);
      ring.setDepth(2010);
      scene.tweens.add({
        targets: ring,
        scale: 4,
        alpha: 0,
        duration: 800,
        delay: i * 100,
        ease: "Cubic.easeOut",
        onComplete: () => ring.destroy(),
      });
    }
    await this.delay(scene, 700);
    return SpriteAnimator.slay(scene, sprite, {
      particleColor: 0xb45309,
      duration: 1100,
    });
  }

  /**
   * The Wraith Council — "each decisive checkpoint dismisses one
   * councillor". Defeat: 7 small wraith silhouettes split from the
   * sprite and fade upward.
   */
  private static async wraithCouncil(ctx: BossDefeatContext): Promise<void> {
    if (!ctx.sprite) return this.generic(ctx);
    const { scene, sprite } = ctx;
    const cx = sprite.x + ctx.container.x;
    const cy = sprite.y + ctx.container.y;
    for (let i = 0; i < 7; i++) {
      const w = scene.add.graphics();
      w.fillStyle(0x7c3aed, 0.7);
      w.fillCircle(0, 0, 18);
      w.setPosition(cx + (i - 3) * 22, cy);
      w.setDepth(2010);
      scene.tweens.add({
        targets: w,
        y: cy - 220,
        alpha: 0,
        scale: 0.3,
        duration: 1000,
        delay: i * 80,
        ease: "Cubic.easeOut",
        onComplete: () => w.destroy(),
      });
    }
    return SpriteAnimator.slay(scene, sprite, {
      particleColor: 0x7c3aed,
      duration: 1200,
    });
  }

  /**
   * The Stonecaller — "each small completion proves the mountain
   * movable. The mountain becomes the foundation". Defeat: sprite
   * cracks then crumbles downward into a stone pile.
   */
  private static async stonecaller(ctx: BossDefeatContext): Promise<void> {
    if (!ctx.sprite) return this.generic(ctx);
    const { scene, sprite } = ctx;
    const cx = sprite.x + ctx.container.x;
    const cy = sprite.y + ctx.container.y;
    for (let i = 0; i < 24; i++) {
      const s = scene.add.graphics();
      s.fillStyle(0x57534e, 1);
      s.fillRect(-4, -4, 8, 8);
      s.setPosition(cx + (Math.random() - 0.5) * 60, cy + (Math.random() - 0.5) * 40);
      s.setDepth(2010);
      scene.tweens.add({
        targets: s,
        y: s.y + 100 + Math.random() * 60,
        x: s.x + (Math.random() - 0.5) * 80,
        rotation: Math.random() * Math.PI,
        alpha: 0,
        duration: 1000,
        ease: "Cubic.easeIn",
        onComplete: () => s.destroy(),
      });
    }
    return SpriteAnimator.slay(scene, sprite, {
      rotation: -Math.PI / 4,
      particleCount: 0,
      duration: 1100,
    });
  }

  /**
   * The Veilwalker — "each collaboration tears the veil. The veil
   * becomes a banner visible across the shared world map". Defeat:
   * shadow veil unravels and disperses into golden motes.
   */
  private static async veilwalker(ctx: BossDefeatContext): Promise<void> {
    if (!ctx.sprite) return this.generic(ctx);
    const { scene, sprite } = ctx;
    // Tint from deep shadow to gold
    sprite.setTint(0x101020);
    scene.tweens.add({
      targets: { t: 0 },
      t: 1,
      duration: 700,
      ease: "Sine.easeOut",
      onUpdate: (tween) => {
        const t = (tween.targets[0] as { t: number }).t;
        const r = Math.round(0x10 + (0xff - 0x10) * t);
        const g = Math.round(0x10 + (0xd7 - 0x10) * t);
        const b = Math.round(0x20 + (0x00 - 0x20) * t);
        sprite.setTint((r << 16) | (g << 8) | b);
      },
    });
    await this.delay(scene, 800);
    return SpriteAnimator.slay(scene, sprite, {
      particleCount: 50,
      particleColor: 0xffd700,
      duration: 1300,
    });
  }

  /** Generic fallback for unrecognised bossSlug values. */
  private static async generic(ctx: BossDefeatContext): Promise<void> {
    if (!ctx.sprite) return;
    return SpriteAnimator.slay(ctx.scene, ctx.sprite, {
      rotation: Math.PI / 3,
      particleCount: 28,
      particleColor: 0xffd700,
      duration: 1100,
    });
  }

  private static delay(scene: Phaser.Scene, ms: number): Promise<void> {
    return new Promise((resolve) => {
      scene.time.delayedCall(ms, () => resolve());
    });
  }
}
