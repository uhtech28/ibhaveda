/**
 * Henchman — PRD § 9.1 inline path enemy.
 *
 * Small, fully procedural (no asset files) creature that floats on the
 * inter-checkpoint path. Player taps to defeat for full XP, or lets
 * it flee for half XP after autoFleeSeconds.
 *
 * Five visual archetypes cover all PRD types via simple shape language:
 *   wisp   — soft glowing orb with trailing tendrils
 *   sprite — angular fairy-like silhouette with sparkles
 *   shade  — translucent draped figure with hollow eyes
 *   imp    — squat lumpy form with glowing eyes + horns
 *   clerk  — boxy bureaucrat with scroll
 *
 * On tap-to-defeat: brief flash + particle burst + fades out and emits
 * a `henchman_defeated` scene event with the henchman id + reward.
 * On auto-flee: drifts off + dissolves and emits a `henchman_fled`
 * event with 50% reward.
 */

import * as Phaser from "phaser";
import { SpriteAnimator } from "../animations/SpriteAnimator";
import { XpPopover } from "./XpPopover";
import type {
  HenchmanDefinition,
  HenchmanInteractionKind,
} from "@/config/henchmen";

export interface HenchmanConfig {
  /** Unique id so React knows which henchman awarded XP. */
  spawnId: string;
  /** World-space X / Y. */
  x: number;
  y: number;
  /** Pulled from HENCHMAN_DEFINITIONS for the active stage. */
  definition: HenchmanDefinition;
}

export class Henchman extends Phaser.GameObjects.Container {
  readonly spawnId: string;
  readonly definition: HenchmanDefinition;

  // @ts-expect-error - Phaser Container has a body property of different type
  private body: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;
  private idleBobTween: Phaser.Tweens.Tween | null = null;
  private fleeTimer: Phaser.Time.TimerEvent | null = null;
  private resolved = false;

  constructor(scene: Phaser.Scene, config: HenchmanConfig) {
    super(scene, config.x, config.y);
    this.spawnId = config.spawnId;
    this.definition = config.definition;

    this.body = scene.add.graphics();
    this.drawForStyle(config.definition.visualStyle);
    this.add(this.body);

    // Small nameplate beneath. Hidden by default — only shows on
    // hover to avoid cluttering the map.
    this.label = scene.add.text(0, 18, config.definition.name, {
      fontSize: "10px",
      fontFamily: "Georgia, serif",
      color: "#e2e8f0",
      align: "center",
      stroke: "#0a0a14",
      strokeThickness: 3,
    });
    this.label.setOrigin(0.5, 0);
    this.label.setAlpha(0);
    this.add(this.label);

    // @ts-expect-error - Container/GameObject duplicate React types
    scene.add.existing(this);
    this.setSize(34, 34);
    this.setInteractive({ useHandCursor: true });

    // Hover — show name
    this.on("pointerover", () => {
      this.scene.tweens.add({
        targets: this.label,
        alpha: 1,
        duration: 180,
      });
    });
    this.on("pointerout", () => {
      this.scene.tweens.add({
        targets: this.label,
        alpha: 0,
        duration: 180,
      });
    });

    // Tap to defeat — interaction kind drives whether we accept the
    // first tap or require a sequence. For MVP we accept the first
    // tap for all kinds; quick_tap / dodge_then_tap polish can come
    // later with a tiny tap-sequence overlay.
    this.on("pointerdown", () => {
      if (!this.resolved) void this.defeat();
    });

    // Idle bob — gentle float
    // @ts-expect-error - AnimatableTarget cast
    this.idleBobTween = SpriteAnimator.startIdleBob(scene, this, {
      amplitude: 4,
      duration: 1800,
    });

    // Auto-flee timer
    this.fleeTimer = scene.time.delayedCall(
      config.definition.autoFleeSeconds * 1000,
      () => {
        if (!this.resolved) void this.flee();
      },
    );
  }

  async defeat(): Promise<void> {
    if (this.resolved) return;
    this.resolved = true;
    if (this.idleBobTween) {
      this.idleBobTween.stop();
      this.idleBobTween = null;
    }
    if (this.fleeTimer) {
      this.fleeTimer.destroy();
      this.fleeTimer = null;
    }

    // Damage flash before the burst
    // @ts-expect-error - Graphics vs Sprite AnimatableTarget cast
    await SpriteAnimator.damageFlash(this.scene, this.body, {
      color: 0xffd700,
      shake: 4,
      duration: 240,
    });

    // Spawn a burst of XP particles drifting upward
    const cx = this.x;
    const cy = this.y;
    for (let i = 0; i < 12; i++) {
      const p = this.scene.add.graphics();
      p.fillStyle(0xffd700, 1);
      p.fillCircle(0, 0, 2 + Math.random() * 2);
      p.setPosition(cx + (Math.random() - 0.5) * 18, cy);
      p.setDepth(this.depth + 1);
      const a = (i / 12) * Math.PI * 2 + Math.random() * 0.3;
      const speed = 40 + Math.random() * 30;
      this.scene.tweens.add({
        targets: p,
        x: cx + Math.cos(a) * speed,
        y: cy + Math.sin(a) * speed - 40,
        alpha: 0,
        duration: 800 + Math.random() * 300,
        ease: "Cubic.easeOut",
        onComplete: () => p.destroy(),
      });
    }

    // Emit defeated event with full reward
    this.scene.events.emit("henchman_defeated", {
      spawnId: this.spawnId,
      henchmanId: this.definition.id,
      xpAwarded: this.definition.xpReward,
      template: this.definition.template,
      stage: this.definition.stage,
    });
    // Numeric XP popover above the particle burst — gives the player
    // an exact count, complementing the visual confetti.
    XpPopover.spawn(
      this.scene,
      this.x,
      this.y - 18,
      this.definition.xpReward,
      "defeat",
    );

    // Fade out body
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: this,
        alpha: 0,
        scale: 0.6,
        duration: 400,
        ease: "Cubic.easeIn",
        onComplete: () => {
          this.destroy();
          resolve();
        },
      });
    });
  }

  private async flee(): Promise<void> {
    if (this.resolved) return;
    this.resolved = true;
    if (this.idleBobTween) {
      this.idleBobTween.stop();
      this.idleBobTween = null;
    }
    if (this.fleeTimer) {
      this.fleeTimer.destroy();
      this.fleeTimer = null;
    }
    const fleeXp = Math.max(1, Math.floor(this.definition.xpReward / 2));
    // Emit fled event with half reward
    this.scene.events.emit("henchman_fled", {
      spawnId: this.spawnId,
      henchmanId: this.definition.id,
      xpAwarded: fleeXp,
      template: this.definition.template,
      stage: this.definition.stage,
    });
    // Smaller popover with "ESCAPE" kind so the player sees they
    // got something but missed the bigger reward.
    XpPopover.spawn(this.scene, this.x, this.y - 18, fleeXp, "flee");
    // Drift off-screen + dissolve
    // @ts-expect-error - AnimatableTarget cast
    return SpriteAnimator.retreat(this.scene, this, {
      driftX: -60,
      driftY: -20,
      duration: 1000,
    }).then(() => this.destroy());
  }

  // ── Drawing ─────────────────────────────────────────────────────────────

  private drawForStyle(style: HenchmanDefinition["visualStyle"]): void {
    switch (style) {
      case "wisp":   this.drawWisp(); break;
      case "sprite": this.drawSprite(); break;
      case "shade":  this.drawShade(); break;
      case "imp":    this.drawImp(); break;
      case "clerk":  this.drawClerk(); break;
    }
  }

  private drawWisp(): void {
    // Soft glowing orb with trailing tendrils
    this.body.fillStyle(0xa5b4fc, 0.35);
    this.body.fillCircle(0, 0, 16);
    this.body.fillStyle(0xc4b5fd, 0.6);
    this.body.fillCircle(0, 0, 11);
    this.body.fillStyle(0xede9fe, 0.9);
    this.body.fillCircle(0, 0, 6);
    // Two eye dots
    this.body.fillStyle(0x111827, 1);
    this.body.fillCircle(-2, -1, 1.2);
    this.body.fillCircle(2, -1, 1.2);
    // Trailing tendrils below
    this.body.lineStyle(2, 0xc4b5fd, 0.7);
    this.body.beginPath();
    this.body.moveTo(-6, 6); this.body.lineTo(-3, 14); this.body.strokePath();
    this.body.beginPath();
    this.body.moveTo(0, 8); this.body.lineTo(2, 16); this.body.strokePath();
    this.body.beginPath();
    this.body.moveTo(6, 6); this.body.lineTo(8, 14); this.body.strokePath();
  }

  private drawSprite(): void {
    // Angular fairy silhouette with sparkles
    this.body.fillStyle(0xfde68a, 1);
    // Diamond body
    this.body.fillTriangle(0, -12, -7, 0, 7, 0);
    this.body.fillTriangle(-7, 0, 7, 0, 0, 11);
    // Wing slivers
    this.body.fillStyle(0xfef3c7, 0.5);
    this.body.fillTriangle(-7, -2, -16, -8, -10, 4);
    this.body.fillTriangle(7, -2, 16, -8, 10, 4);
    // Eyes
    this.body.fillStyle(0x111827, 1);
    this.body.fillCircle(-2, -4, 1);
    this.body.fillCircle(2, -4, 1);
    // Sparkles
    this.body.fillStyle(0xffffff, 0.9);
    this.body.fillCircle(-10, -10, 1.2);
    this.body.fillCircle(11, -8, 1);
    this.body.fillCircle(0, 14, 1);
  }

  private drawShade(): void {
    // Translucent draped figure with hollow eyes
    this.body.fillStyle(0x4b5563, 0.6);
    // Hood
    this.body.fillEllipse(0, -8, 18, 14);
    // Body drape — wavy bottom edge
    this.body.beginPath();
    this.body.moveTo(-10, -4);
    this.body.lineTo(-12, 12);
    this.body.lineTo(-7, 9);
    this.body.lineTo(-3, 13);
    this.body.lineTo(0, 9);
    this.body.lineTo(3, 13);
    this.body.lineTo(7, 9);
    this.body.lineTo(12, 12);
    this.body.lineTo(10, -4);
    this.body.closePath();
    this.body.fillPath();
    // Hollow glowing eyes
    this.body.fillStyle(0xfbbf24, 0.9);
    this.body.fillCircle(-3, -9, 1.6);
    this.body.fillCircle(3, -9, 1.6);
  }

  private drawImp(): void {
    // Squat lumpy form with glowing eyes + horns
    this.body.fillStyle(0x991b1b, 1);
    // Body — lumpy ellipse
    this.body.fillEllipse(0, 2, 22, 16);
    // Horns
    this.body.fillTriangle(-6, -6, -3, -14, -1, -6);
    this.body.fillTriangle(6, -6, 3, -14, 1, -6);
    // Eyes — glowing yellow
    this.body.fillStyle(0xfbbf24, 1);
    this.body.fillCircle(-4, 0, 2);
    this.body.fillCircle(4, 0, 2);
    // Mouth
    this.body.fillStyle(0x111827, 1);
    this.body.fillRect(-3, 5, 6, 2);
  }

  private drawClerk(): void {
    // Boxy bureaucrat with scroll
    this.body.fillStyle(0x1e293b, 1);
    // Body suit
    this.body.fillRoundedRect(-9, -3, 18, 18, 2);
    // Head
    this.body.fillStyle(0xfde68a, 1);
    this.body.fillCircle(0, -10, 7);
    // Eyes
    this.body.fillStyle(0x111827, 1);
    this.body.fillCircle(-2, -10, 0.9);
    this.body.fillCircle(2, -10, 0.9);
    // Scroll in hand
    this.body.fillStyle(0xfef3c7, 1);
    this.body.fillRect(8, 2, 6, 10);
    this.body.lineStyle(1, 0x92400e, 1);
    this.body.strokeRect(8, 2, 6, 10);
    // Tie
    this.body.fillStyle(0xdc2626, 1);
    this.body.fillTriangle(-2, -3, 2, -3, 0, 4);
  }
}

export type { HenchmanInteractionKind };
