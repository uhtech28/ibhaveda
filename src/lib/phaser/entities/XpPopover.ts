/**
 * XpPopover
 *
 * Self-contained floating "+N XP" text that rises and fades. Used as
 * the numeric companion to particle bursts on:
 *   - TreasureChest open (xp_cache reward)
 *   - Henchman defeat / flee
 *   - Mini-game completion
 *   - AI task scoring
 *
 * Static helper for one-shot use:
 *   XpPopover.spawn(scene, x, y, amount);
 *
 * The text rises ~50px and fades over 1.4s, with a brief scale-up
 * bounce at the start so the eye catches it. Color scales with amount:
 *   1-5    white
 *   6-15   amber-200
 *   16-49  amber-400 (gold)
 *   50+    rose-400 (legendary feel)
 *
 * Bonus: if `kind` is provided, prefixes a small descriptor like
 * "CHEST" or "DEFEAT" above the amount so the source is legible.
 */

import * as Phaser from "phaser";

export type XpPopoverKind =
  | "chest"
  | "defeat"
  | "flee"
  | "task"
  | "minigame"
  | "bonus";

const KIND_LABEL: Record<XpPopoverKind, string> = {
  chest: "CHEST",
  defeat: "DEFEAT",
  flee: "ESCAPE",
  task: "TASK",
  minigame: "MINIGAME",
  bonus: "BONUS",
};

function colorForAmount(amount: number): string {
  if (amount >= 50) return "#fb7185"; // rose-400
  if (amount >= 16) return "#fbbf24"; // amber-400 (gold)
  if (amount >= 6) return "#fde68a"; // amber-200
  return "#ffffff";
}

export class XpPopover extends Phaser.GameObjects.Container {
  /**
   * Convenience entry point — spawns a popover, returns the
   * container so callers can attach it to a layer if needed.
   */
  static spawn(
    scene: Phaser.Scene,
    x: number,
    y: number,
    amount: number,
    kind?: XpPopoverKind,
  ): XpPopover {
    return new XpPopover(scene, x, y, amount, kind);
  }

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    amount: number,
    kind?: XpPopoverKind,
  ) {
    super(scene, x, y);

    const color = colorForAmount(amount);
    const fontSize = amount >= 50 ? "28px" : amount >= 16 ? "22px" : "18px";

    // Main amount text
    const amountText = scene.add.text(0, 0, `+${amount} XP`, {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize,
      color,
      align: "center",
      stroke: "#0a0a14",
      strokeThickness: 4,
      fontStyle: "bold",
    });
    amountText.setOrigin(0.5, 0.5);
    this.add(amountText);

    // Kind label above (optional)
    if (kind) {
      const label = scene.add.text(0, -22, KIND_LABEL[kind], {
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: "9px",
        color: "#cbd5e1",
        align: "center",
        letterSpacing: 4,
        stroke: "#0a0a14",
        strokeThickness: 3,
        fontStyle: "bold",
      } as Phaser.Types.GameObjects.Text.TextStyle);
      label.setOrigin(0.5, 1);
      this.add(label);
    }

    this.setDepth(1500);
    scene.add.existing(this);

    // Animate — brief bounce up, then drift higher with fade
    this.setScale(0.6);
    this.setAlpha(0);
    scene.tweens.add({
      targets: this,
      scale: 1.15,
      alpha: 1,
      duration: 200,
      ease: "Back.easeOut",
      onComplete: () => {
        scene.tweens.add({
          targets: this,
          scale: 1.0,
          duration: 100,
          ease: "Sine.easeIn",
        });
        scene.tweens.add({
          targets: this,
          y: y - 60,
          alpha: 0,
          duration: 1200,
          ease: "Cubic.easeIn",
          onComplete: () => this.destroy(),
        });
      },
    });
  }
}
