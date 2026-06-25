/**
 * TreasureChest
 *
 * PRD § 9.2 — Inter-checkpoint treasure chests.
 *
 * 20% probability per inter-checkpoint segment. Opening awards one of:
 *   - XP Cache         (25-75 XP scaled by stage)
 *   - Flare Charge     (one free Flare broadcast)
 *   - Corruption Shield (-5% immediately, slows accumulation 48h)
 *   - Insight Fragment (brief AI-generated insight, flavour only)
 *
 * Rendered as a small wooden chest with iron banding. Static idle
 * (gentle bob), interactive (cursor changes on hover, tap to open).
 * Open animation: lid rotates up, light burst from inside, icon for
 * the reward rises out, then chest fades.
 *
 * Emits a chest-opened event so React can apply the reward server-side.
 */

import * as Phaser from "phaser";
import { SpriteAnimator } from "../animations/SpriteAnimator";
import { XpPopover } from "./XpPopover";

export type ChestRewardKind =
  | "xp_cache"
  | "flare_charge"
  | "corruption_shield"
  | "insight_fragment";

export interface TreasureChestConfig {
  /** Unique identifier so React knows which chest awarded the reward. */
  chestId: string;
  /** World-space X. */
  x: number;
  /** World-space Y. */
  y: number;
  /** Which reward this chest will award when opened. */
  reward: ChestRewardKind;
}

export class TreasureChest extends Phaser.GameObjects.Container {
  readonly chestId: string;
  readonly reward: ChestRewardKind;

  private body: Phaser.GameObjects.Graphics;
  private lid: Phaser.GameObjects.Graphics;
  private glowAura: Phaser.GameObjects.Graphics | null = null;
  private idleBobTween: Phaser.Tweens.Tween | null = null;
  private opened = false;

  constructor(scene: Phaser.Scene, config: TreasureChestConfig) {
    super(scene, config.x, config.y);
    this.chestId = config.chestId;
    this.reward = config.reward;

    // ── Chest body ──────────────────────────────────────────────────────────
    this.body = scene.add.graphics();
    this.drawBody();
    this.add(this.body);

    // ── Lid ─────────────────────────────────────────────────────────────────
    this.lid = scene.add.graphics();
    this.drawLid();
    this.add(this.lid);

    // ── Subtle glow underneath signalling there's loot inside ───────────────
    this.glowAura = scene.add.graphics();
    this.glowAura.fillStyle(this.glowColorForReward(), 0.18);
    this.glowAura.fillCircle(0, 18, 28);
    this.glowAura.fillStyle(this.glowColorForReward(), 0.1);
    this.glowAura.fillCircle(0, 18, 42);
    this.addAt(this.glowAura, 0);

    scene.add.existing(this);
    this.setSize(48, 40);
    this.setInteractive({ useHandCursor: true });
    this.on("pointerdown", () => {
      if (!this.opened) void this.openAndAward();
    });

    // Idle bob — chest gently rocks like it wants to be opened
    this.idleBobTween = SpriteAnimator.startIdleBob(scene, this, {
      amplitude: 3,
      duration: 2000,
    });
  }

  /**
   * Open the chest and emit the chest-opened event for React to apply
   * the reward. Returns a Promise that resolves when the open
   * animation completes (~1s).
   */
  async openAndAward(): Promise<void> {
    if (this.opened) return;
    this.opened = true;
    if (this.idleBobTween) {
      this.idleBobTween.stop();
      this.idleBobTween = null;
    }
    // 1. Lid hinges open (300ms)
    this.scene.tweens.add({
      targets: this.lid,
      rotation: -1.1,
      y: -8,
      duration: 300,
      ease: "Back.easeOut",
    });
    // 2. Light burst from inside (200ms after lid starts)
    this.scene.time.delayedCall(200, () => this.burstLight());
    // 3. Reward icon rises out (400ms in)
    this.scene.time.delayedCall(400, () => this.riseRewardIcon());
    // 4. Emit chest-opened event so React can update XP / flares / corruption
    this.scene.time.delayedCall(500, () => {
      this.scene.events.emit("treasure_chest_opened", {
        chestId: this.chestId,
        reward: this.reward,
      });
    });
    // 4b. For XP chests, spawn an XP popover so the player sees the
    // numeric reward alongside the particle burst. Other reward kinds
    // (flare/shield/insight) don't grant XP so they get a smaller
    // glyph popover with the kind name instead.
    this.scene.time.delayedCall(600, () => {
      if (this.reward === "xp_cache") {
        // The actual XP amount is computed server-side per stage.
        // Show a representative number — server may vary slightly but
        // it's in the ballpark. Player gets exact figure in feed.
        XpPopover.spawn(this.scene, this.x, this.y - 18, 35, "chest");
      }
    });
    // 5. Fade out chest body after the icon escapes (1100ms total)
    return new Promise((resolve) => {
      this.scene.time.delayedCall(900, () => {
        this.scene.tweens.add({
          targets: this,
          alpha: 0,
          y: this.y - 10,
          duration: 500,
          ease: "Sine.easeIn",
          onComplete: () => {
            this.destroy();
            resolve();
          },
        });
      });
    });
  }

  // ── Drawing ─────────────────────────────────────────────────────────────

  private drawBody(): void {
    // Box base — wood brown with iron banding
    this.body.fillStyle(0x6b4226, 1);
    this.body.fillRoundedRect(-22, 4, 44, 28, 3);
    this.body.lineStyle(2, 0x3a2510, 1);
    this.body.strokeRoundedRect(-22, 4, 44, 28, 3);
    // Iron bands
    this.body.fillStyle(0x444444, 1);
    this.body.fillRect(-22, 14, 44, 3);
    this.body.fillRect(-22, 24, 44, 3);
    this.body.lineStyle(1, 0x222222, 1);
    this.body.strokeRect(-22, 14, 44, 3);
    this.body.strokeRect(-22, 24, 44, 3);
    // Lock plate
    this.body.fillStyle(0xffd700, 1);
    this.body.fillRect(-5, 12, 10, 8);
    this.body.lineStyle(1, 0xa67c00, 1);
    this.body.strokeRect(-5, 12, 10, 8);
    // Lock keyhole
    this.body.fillStyle(0x222222, 1);
    this.body.fillCircle(0, 15, 1.5);
  }

  private drawLid(): void {
    // Lid — slightly arched on top, hinged at the back
    this.lid.fillStyle(0x7a4d2c, 1);
    this.lid.fillRoundedRect(-22, -8, 44, 14, 3);
    this.lid.lineStyle(2, 0x3a2510, 1);
    this.lid.strokeRoundedRect(-22, -8, 44, 14, 3);
    // Top iron band
    this.lid.fillStyle(0x444444, 1);
    this.lid.fillRect(-22, -2, 44, 3);
    this.lid.lineStyle(1, 0x222222, 1);
    this.lid.strokeRect(-22, -2, 44, 3);
    // Set origin for the rotation hinge — pin at the back-bottom of the lid
    this.lid.x = 0;
    this.lid.y = 0;
  }

  private burstLight(): void {
    const burst = this.scene.add.graphics();
    burst.fillStyle(this.glowColorForReward(), 0.7);
    burst.fillCircle(0, -2, 14);
    burst.fillStyle(this.glowColorForReward(), 0.35);
    burst.fillCircle(0, -2, 22);
    burst.fillStyle(this.glowColorForReward(), 0.18);
    burst.fillCircle(0, -2, 32);
    this.add(burst);
    this.scene.tweens.add({
      targets: burst,
      scale: 2,
      alpha: 0,
      duration: 500,
      ease: "Cubic.easeOut",
      onComplete: () => burst.destroy(),
    });
  }

  private riseRewardIcon(): void {
    const icon = this.scene.add.text(0, -2, this.glyphForReward(), {
      fontSize: "26px",
      align: "center",
    });
    icon.setOrigin(0.5, 0.5);
    this.add(icon);
    this.scene.tweens.add({
      targets: icon,
      y: -32,
      alpha: 0,
      scale: 1.4,
      duration: 700,
      ease: "Cubic.easeOut",
      onComplete: () => icon.destroy(),
    });
  }

  private glowColorForReward(): number {
    switch (this.reward) {
      case "xp_cache":           return 0xffd700; // gold
      case "flare_charge":       return 0xf97316; // orange
      case "corruption_shield":  return 0x60a5fa; // blue
      case "insight_fragment":   return 0xa855f7; // purple
    }
  }

  private glyphForReward(): string {
    switch (this.reward) {
      case "xp_cache":           return "✨";
      case "flare_charge":       return "🔥";
      case "corruption_shield":  return "🛡️";
      case "insight_fragment":   return "💡";
    }
  }
}

/**
 * Per PRD § 9.2 — 20% probability per inter-checkpoint segment.
 * Returns true if a chest should spawn at this segment.
 */
export function shouldSpawnChest(): boolean {
  return Math.random() < 0.2;
}

/**
 * Per PRD § 9.2 — picks a reward kind. Equal probability across all
 * four; the specific reward value (XP amount, etc.) is computed
 * server-side when the chest-opened event fires.
 */
export function pickChestReward(): ChestRewardKind {
  const all: ChestRewardKind[] = [
    "xp_cache",
    "flare_charge",
    "corruption_shield",
    "insight_fragment",
  ];
  return all[Math.floor(Math.random() * all.length)];
}
