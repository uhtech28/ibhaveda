/**
 * ProjectCompleteCinematic
 *
 * PRD § 5.5 — the apex moment. Plays when the player clears the final
 * stage of their venture.
 *
 * Two variants:
 *  - "complete" (some stages were 2/3): "PROJECT COMPLETE" — solid
 *    stone monument, persona engraved. Standard celebration.
 *  - "perfect" (every final CP was 3/3): "PROJECT PERFECT" — gold
 *    monument transformation, legendary aura, extra particle sweep.
 *
 * Total duration: ~4s. Sequence:
 *   0.0s   full-screen blackout fades in (300ms)
 *   0.3s   monument silhouette rises from bottom (700ms)
 *   1.0s   monument detail draws on
 *   1.3s   persona figure engraved at the monument base
 *   1.7s   title slams in from above with golden trim
 *   2.2s   subtitle fades in below ("X stages cleared")
 *   2.6s   (perfect only) monument transforms to gold with sweep
 *   3.5s   prompt to dismiss appears
 *
 * Caller can await play() and then show their own dismiss UI.
 */

import * as Phaser from "phaser";

export interface ProjectCompleteConfig {
  variant: "complete" | "perfect";
  ventureName: string;
  stagesCleared: number;
  goldCheckpointsEarned?: number;
  /** PersonaId of the engraved figure. */
  personaId?: string;
}

export class ProjectCompleteCinematic {
  private scene: Phaser.Scene;
  private layer: Phaser.GameObjects.Container;

  /** Click-to-dismiss callback, set after `play()` runs. */
  private dismissCallback: (() => void) | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.layer = scene.add.container(0, 0);
    this.layer.setScrollFactor(0);
    this.layer.setDepth(2200);
  }

  /** Register a callback that fires on user tap-to-dismiss. */
  onDismiss(cb: () => void): void {
    this.dismissCallback = cb;
  }

  async play(config: ProjectCompleteConfig): Promise<void> {
    return new Promise((resolve) => {
      const scene = this.scene;
      const camera = scene.cameras.main;
      const viewW = camera.width;
      const viewH = camera.height;
      const isPerfect = config.variant === "perfect";

      // ── 1. Full-screen blackout fades in (0.0-0.3s) ─────────────────
      const blackout = scene.add.rectangle(viewW / 2, viewH / 2, viewW, viewH, 0x000000, 0);
      blackout.setScrollFactor(0);
      this.layer.add(blackout);
      scene.tweens.add({
        targets: blackout,
        alpha: 0.85,
        duration: 300,
        ease: "Sine.easeIn",
      });

      // Aura glow behind the monument (perfect variant only)
      let aura: Phaser.GameObjects.Graphics | null = null;
      if (isPerfect) {
        aura = scene.add.graphics();
        aura.fillStyle(0xffd700, 0.15);
        aura.fillCircle(viewW / 2, viewH / 2 + 80, 280);
        aura.fillStyle(0xffd700, 0.08);
        aura.fillCircle(viewW / 2, viewH / 2 + 80, 380);
        aura.setAlpha(0);
        this.layer.add(aura);
        scene.tweens.add({
          targets: aura,
          alpha: 1,
          duration: 800,
          delay: 600,
          ease: "Sine.easeOut",
        });
      }

      // ── 2. Monument silhouette rises (0.3-1.0s) ─────────────────────
      const monument = this.buildMonument(viewW / 2, viewH + 200, isPerfect);
      this.layer.add(monument);
      scene.tweens.add({
        targets: monument,
        y: viewH / 2 + 30,
        duration: 700,
        delay: 300,
        ease: "Back.easeOut",
      });

      // ── 3. Title slams in (1.7-2.2s) ────────────────────────────────
      const title = isPerfect ? "PROJECT PERFECT" : "PROJECT COMPLETE";
      const titleText = scene.add.text(viewW / 2, -100, title, {
        fontFamily: "Georgia, serif",
        fontSize: "52px",
        color: isPerfect ? "#ffd700" : "#ffffff",
        align: "center",
        stroke: isPerfect ? "#7a4d00" : "#dc2626",
        strokeThickness: 4,
        fontStyle: "bold",
      });
      titleText.setOrigin(0.5, 0.5);
      titleText.setScrollFactor(0);
      this.layer.add(titleText);
      scene.tweens.add({
        targets: titleText,
        y: viewH * 0.18,
        duration: 500,
        delay: 1700,
        ease: "Back.easeOut",
      });

      // Title trim line beneath
      scene.time.delayedCall(2000, () => {
        const trim = scene.add.rectangle(
          viewW / 2,
          viewH * 0.18 + 38,
          0,
          3,
          isPerfect ? 0xffd700 : 0xdc2626,
          1,
        );
        trim.setScrollFactor(0);
        this.layer.add(trim);
        scene.tweens.add({
          targets: trim,
          width: 360,
          duration: 350,
          ease: "Cubic.easeOut",
        });
      });

      // ── 4. Venture name subtitle (2.2-2.6s) ─────────────────────────
      const subtitle = scene.add.text(
        viewW / 2,
        viewH * 0.18 + 60,
        config.ventureName.toUpperCase(),
        {
          fontFamily: '"Courier New", monospace',
          fontSize: "14px",
          color: isPerfect ? "#fde68a" : "#fbbf24",
          align: "center",
          letterSpacing: 6,
          fontStyle: "bold",
        } as Phaser.Types.GameObjects.Text.TextStyle,
      );
      subtitle.setOrigin(0.5, 0.5);
      subtitle.setScrollFactor(0);
      subtitle.setAlpha(0);
      this.layer.add(subtitle);
      scene.tweens.add({
        targets: subtitle,
        alpha: 1,
        duration: 400,
        delay: 2200,
        ease: "Sine.easeOut",
      });

      // ── 5. Stats line ───────────────────────────────────────────────
      const statsText = scene.add.text(
        viewW / 2,
        viewH * 0.78,
        isPerfect
          ? `Every checkpoint at gold · ${config.goldCheckpointsEarned ?? "Many"} gold marks earned`
          : `${config.stagesCleared} stages cleared · The work is done`,
        {
          fontFamily: "Georgia, serif",
          fontSize: "16px",
          color: "#e2e8f0",
          align: "center",
          stroke: "#0a0a14",
          strokeThickness: 3,
          fontStyle: "italic",
        },
      );
      statsText.setOrigin(0.5, 0.5);
      statsText.setScrollFactor(0);
      statsText.setAlpha(0);
      this.layer.add(statsText);
      scene.tweens.add({
        targets: statsText,
        alpha: 1,
        duration: 500,
        delay: 2400,
        ease: "Sine.easeOut",
      });

      // ── 6. Perfect-only: gold transformation sweep (2.6-3.4s) ───────
      if (isPerfect) {
        scene.time.delayedCall(2600, () => {
          this.playGoldTransformation(monument);
        });
      }

      // ── 7. Camera boom on title arrival ─────────────────────────────
      scene.time.delayedCall(1700, () => {
        camera.shake(280, 0.008);
        if (isPerfect) {
          camera.flash(300, 255, 215, 0, false);
        }
      });

      // ── 8. Dismiss prompt + click handler + resolve (3.5s) ──────────
      scene.time.delayedCall(3500, () => {
        const dismiss = scene.add.text(
          viewW / 2,
          viewH * 0.92,
          "Tap anywhere to continue",
          {
            fontFamily: '"Courier New", monospace',
            fontSize: "12px",
            color: "#94a3b8",
            align: "center",
            letterSpacing: 4,
          } as Phaser.Types.GameObjects.Text.TextStyle,
        );
        dismiss.setOrigin(0.5, 0.5);
        dismiss.setScrollFactor(0);
        dismiss.setAlpha(0);
        this.layer.add(dismiss);
        scene.tweens.add({
          targets: dismiss,
          alpha: 1,
          duration: 400,
          ease: "Sine.easeOut",
        });
        // Slow pulse on the dismiss prompt
        scene.tweens.add({
          targets: dismiss,
          alpha: 0.4,
          duration: 1100,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
          delay: 600,
        });
        // Make the blackout backdrop interactive — tap anywhere
        // fires the dismiss callback so React can clean up.
        blackout.setInteractive({ useHandCursor: true });
        blackout.on("pointerdown", () => {
          if (this.dismissCallback) {
            this.dismissCallback();
          } else {
            this.dismiss();
          }
        });
        resolve();
      });
    });
  }

  /**
   * Build a stylised monument graphic — base + column + capstone.
   * In `perfect` mode, the cap and trim default to gold; otherwise
   * they're solid stone.
   */
  private buildMonument(x: number, y: number, isPerfect: boolean): Phaser.GameObjects.Container {
    const monument = this.scene.add.container(x, y);

    const baseColor = isPerfect ? 0x4a3d2e : 0x5a5a5a;
    const trimColor = isPerfect ? 0xffd700 : 0x9ca3af;

    // Base — wide stone block
    const base = this.scene.add.rectangle(0, 80, 220, 30, baseColor, 1);
    base.setStrokeStyle(2, trimColor, 1);
    monument.add(base);

    // Column — tall
    const column = this.scene.add.rectangle(0, 10, 100, 130, baseColor, 1);
    column.setStrokeStyle(2, trimColor, 1);
    monument.add(column);

    // Capstone
    const cap = this.scene.add.rectangle(0, -65, 140, 20, baseColor, 1);
    cap.setStrokeStyle(2, trimColor, 1);
    monument.add(cap);

    // Engraved persona silhouette on the column (simple figure)
    const engrave = this.scene.add.graphics();
    engrave.fillStyle(trimColor, 0.85);
    engrave.fillCircle(0, -10, 10); // head
    engrave.fillRect(-12, 0, 24, 35); // body
    engrave.fillRect(-12, 35, 8, 30); // left leg
    engrave.fillRect(4, 35, 8, 30); // right leg
    monument.add(engrave);

    // Inscription bar below the figure
    const inscription = this.scene.add.rectangle(0, 70, 80, 4, trimColor, 1);
    monument.add(inscription);

    return monument;
  }

  private playGoldTransformation(monument: Phaser.GameObjects.Container): void {
    // Gold sweep — particle burst above the monument
    const cx = monument.x;
    const cy = monument.y - 60;
    for (let i = 0; i < 40; i++) {
      const p = this.scene.add.graphics();
      p.fillStyle(0xffd700, 1);
      p.fillCircle(0, 0, 3 + Math.random() * 2);
      p.setPosition(cx + (Math.random() - 0.5) * 200, cy);
      p.setScrollFactor(0);
      p.setDepth(2210);
      this.scene.tweens.add({
        targets: p,
        y: cy - 80 - Math.random() * 80,
        x: p.x + (Math.random() - 0.5) * 60,
        alpha: 0,
        scale: 0.4,
        duration: 1200 + Math.random() * 500,
        ease: "Cubic.easeOut",
        onComplete: () => p.destroy(),
      });
    }

    // Subtle scale pulse on the monument
    this.scene.tweens.add({
      targets: monument,
      scale: 1.06,
      duration: 600,
      yoyo: true,
      ease: "Sine.easeInOut",
    });
  }

  /** Manually dismiss + cleanup. */
  dismiss(): void {
    this.scene.tweens.add({
      targets: this.layer,
      alpha: 0,
      duration: 500,
      ease: "Sine.easeIn",
      onComplete: () => this.layer.destroy(),
    });
  }
}
