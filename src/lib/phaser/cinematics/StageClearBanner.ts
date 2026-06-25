/**
 * StageClearBanner
 *
 * Arcade-style victory banner that drops from the top of the screen
 * when the player clears a stage. PRD § 5.4 — Stage Final Checkpoint
 * States.
 *
 * Two variants:
 *  - Standard Clear (2/3 final CP): "STAGE CLEAR" + monster slain
 *    line. Tinted white-on-red. Plays the existing MiniBoss.slay
 *    animation in parallel.
 *  - Gold Stage (3/3 final CP): "GOLD STAGE" + biome transformation
 *    flavour line. Gold-on-deep-purple. Adds particle burst + brief
 *    color flood across the visible camera viewport so the world
 *    feels like it has been transformed.
 *
 * The banner sits as a fixed-position overlay (scrollFactor=0) so it
 * stays anchored while the game camera continues to track the persona.
 */

import * as Phaser from "phaser";

export interface StageClearBannerConfig {
  stageNumber: number;
  stageName: string;
  monsterName?: string;
  variant: "standard" | "gold";
}

export class StageClearBanner {
  private scene: Phaser.Scene;
  private layer: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.layer = scene.add.container(0, 0);
    this.layer.setScrollFactor(0);
    this.layer.setDepth(2100);
  }

  /**
   * Run the full banner sequence. Returns a Promise that resolves
   * when the banner finishes retracting (~3s total).
   */
  async play(config: StageClearBannerConfig): Promise<void> {
    return new Promise((resolve) => {
      const scene = this.scene;
      const camera = scene.cameras.main;
      const viewW = camera.width;
      const viewH = camera.height;
      const isGold = config.variant === "gold";

      // Step 1: brief camera flash for impact
      camera.flash(180, isGold ? 255 : 220, isGold ? 215 : 80, isGold ? 0 : 40, false);

      // Step 2: gold variant — colour flood across the viewport
      if (isGold) {
        this.playColorFlood();
      }

      // Step 3: banner drops in from top
      const banner = this.createBanner(config);
      banner.setPosition(viewW / 2, -120);
      this.layer.add(banner);
      scene.tweens.add({
        targets: banner,
        y: viewH * 0.32,
        duration: 700,
        ease: "Back.easeOut",
      });

      // Step 4: monster slain line slides in beneath the banner
      let monsterLine: Phaser.GameObjects.Container | null = null;
      if (config.monsterName) {
        scene.time.delayedCall(800, () => {
          monsterLine = this.createMonsterLine(config);
          monsterLine.setPosition(viewW / 2, viewH * 0.32 + 70);
          monsterLine.setAlpha(0);
          this.layer.add(monsterLine);
          scene.tweens.add({
            targets: monsterLine,
            alpha: 1,
            y: viewH * 0.32 + 60,
            duration: 500,
            ease: "Cubic.easeOut",
          });
        });
      }

      // Step 5: gold variant — particle burst around the banner
      if (isGold) {
        scene.time.delayedCall(600, () => {
          this.playGoldParticleBurst(viewW / 2, viewH * 0.32);
        });
      }

      // Step 6: hold for 1.5s, then retract upward
      const holdDuration = isGold ? 2000 : 1400;
      scene.time.delayedCall(700 + holdDuration, () => {
        scene.tweens.add({
          targets: banner,
          y: -180,
          alpha: 0.3,
          duration: 500,
          ease: "Cubic.easeIn",
        });
        if (monsterLine) {
          scene.tweens.add({
            targets: monsterLine,
            alpha: 0,
            duration: 400,
            ease: "Cubic.easeIn",
          });
        }
      });

      // Step 7: cleanup + resolve
      scene.time.delayedCall(700 + holdDuration + 600, () => {
        this.destroy();
        resolve();
      });
    });
  }

  private createBanner(config: StageClearBannerConfig): Phaser.GameObjects.Container {
    const isGold = config.variant === "gold";
    const banner = this.scene.add.container(0, 0);

    const bgWidth = 480;
    const bgHeight = 110;

    // Outer glow
    const glow = this.scene.add.rectangle(
      0,
      0,
      bgWidth + 14,
      bgHeight + 14,
      isGold ? 0xffd700 : 0xdc2626,
      0.25,
    );
    banner.add(glow);

    // Main panel
    const panelColor = isGold ? 0x1a0e2e : 0x0a0c1a;
    const panelStroke = isGold ? 0xffd700 : 0xfbbf24;
    const bg = this.scene.add.rectangle(0, 0, bgWidth, bgHeight, panelColor, 0.96);
    bg.setStrokeStyle(3, panelStroke, 1);
    banner.add(bg);

    // Stage number — small uppercase
    const stageLabel = this.scene.add.text(
      0,
      -32,
      `STAGE ${config.stageNumber} — ${config.stageName}`,
      {
        fontFamily: '"Courier New", monospace',
        fontSize: "12px",
        color: isGold ? "#fde68a" : "#fbbf24",
        align: "center",
        letterSpacing: 4,
        fontStyle: "bold",
      } as Phaser.Types.GameObjects.Text.TextStyle,
    );
    stageLabel.setOrigin(0.5, 0.5);
    banner.add(stageLabel);

    // Main title
    const title = isGold ? "GOLD STAGE" : "STAGE CLEAR";
    const titleLabel = this.scene.add.text(0, 6, title, {
      fontFamily: "Georgia, serif",
      fontSize: "40px",
      color: isGold ? "#ffd700" : "#ffffff",
      align: "center",
      stroke: isGold ? "#7a4d00" : "#dc2626",
      strokeThickness: 3,
      fontStyle: "bold",
    });
    titleLabel.setOrigin(0.5, 0.5);
    banner.add(titleLabel);

    // Bottom trim
    const trim = this.scene.add.rectangle(
      0,
      bgHeight / 2 - 6,
      bgWidth - 40,
      2,
      isGold ? 0xffd700 : 0xdc2626,
      1,
    );
    banner.add(trim);

    // Pulse the glow ring during hold
    this.scene.tweens.add({
      targets: glow,
      alpha: 0.5,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    return banner;
  }

  private createMonsterLine(config: StageClearBannerConfig): Phaser.GameObjects.Container {
    const isGold = config.variant === "gold";
    const line = this.scene.add.container(0, 0);

    const text = this.scene.add.text(
      0,
      0,
      isGold
        ? `${config.monsterName ?? "Monster"} — slain entirely. The biome transforms.`
        : `${config.monsterName ?? "Monster"} retreats — your work has driven it back.`,
      {
        fontFamily: "Georgia, serif",
        fontSize: "15px",
        color: isGold ? "#fde68a" : "#e2e8f0",
        align: "center",
        stroke: "#0a0a14",
        strokeThickness: 3,
        fontStyle: "italic",
      },
    );
    text.setOrigin(0.5, 0.5);
    line.add(text);

    return line;
  }

  private playColorFlood(): void {
    const camera = this.scene.cameras.main;
    const viewW = camera.width;
    const viewH = camera.height;

    const flood = this.scene.add.rectangle(viewW / 2, viewH / 2, viewW, viewH, 0xffd700, 0);
    flood.setScrollFactor(0);
    flood.setDepth(2050);

    this.scene.tweens.add({
      targets: flood,
      alpha: 0.35,
      duration: 400,
      ease: "Sine.easeOut",
      onComplete: () => {
        this.scene.tweens.add({
          targets: flood,
          alpha: 0,
          duration: 900,
          ease: "Sine.easeIn",
          onComplete: () => flood.destroy(),
        });
      },
    });
  }

  private playGoldParticleBurst(cx: number, cy: number): void {
    const particles: Phaser.GameObjects.Graphics[] = [];
    const burstCount = 36;
    for (let i = 0; i < burstCount; i++) {
      const p = this.scene.add.graphics();
      p.setScrollFactor(0);
      p.setDepth(2080);
      p.fillStyle(0xffd700, 1);
      p.fillCircle(0, 0, 3 + Math.random() * 3);
      p.setPosition(cx, cy);
      particles.push(p);

      const a = (i / burstCount) * Math.PI * 2 + Math.random() * 0.3;
      const speed = 80 + Math.random() * 110;
      this.scene.tweens.add({
        targets: p,
        x: cx + Math.cos(a) * speed,
        y: cy + Math.sin(a) * speed - Math.random() * 40,
        alpha: 0,
        scale: 0.3,
        duration: 1100 + Math.random() * 500,
        ease: "Cubic.easeOut",
        onComplete: () => p.destroy(),
      });
    }
  }

  private destroy(): void {
    this.layer.destroy();
  }
}
