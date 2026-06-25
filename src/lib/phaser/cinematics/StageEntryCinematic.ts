/**
 * StageEntryCinematic
 *
 * Plays a short 1.8s cinematic when the player crosses from one stage
 * into the next. PRD §§ 4 (Map Architecture), 5.4 (Stage Final
 * States), 6 (Boss & Corruption).
 *
 * Sequence:
 *  1. (0.0-0.4s) Cinematic letterbox bars slide in top + bottom,
 *     dimming the rest of the world to focus attention.
 *  2. (0.4-1.1s) Camera smoothly pans to the new stage's boss arena.
 *  3. (0.7-1.5s) Stage banner drops from the top: "Stage N — Name"
 *     in serif gold with a thin red underbar.
 *  4. (0.9-1.4s) Monster nameplate rises from below: "vs <monster>"
 *     in italic with the monster's narrative tagline.
 *  5. (1.5-1.8s) Letterbox bars retract, banner fades, camera holds.
 *
 * The cinematic is purely additive — it does not change game state.
 * Existing checkpoint/persona/HUD logic continues during the pan.
 */

import * as Phaser from "phaser";

export interface StageEntryCinematicConfig {
  stageNumber: number;
  stageName: string;
  monsterName?: string;
  /** Optional narrative tagline shown beneath the monster name. */
  tagline?: string;
  /** Camera target X — usually the boss arena's center. */
  cameraTargetX: number;
  /** Camera target Y — usually map middle for a horizontal sidescroller. */
  cameraTargetY: number;
}

export class StageEntryCinematic {
  private scene: Phaser.Scene;
  private layer: Phaser.GameObjects.Container;
  private topBar: Phaser.GameObjects.Rectangle;
  private bottomBar: Phaser.GameObjects.Rectangle;
  private banner: Phaser.GameObjects.Container | null = null;
  private monsterPlate: Phaser.GameObjects.Container | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const camera = scene.cameras.main;
    const viewW = camera.width;
    const viewH = camera.height;

    this.layer = scene.add.container(0, 0);
    this.layer.setScrollFactor(0); // overlay stays put while camera pans
    this.layer.setDepth(2000);

    const barHeight = viewH * 0.14;

    this.topBar = scene.add.rectangle(viewW / 2, -barHeight / 2, viewW, barHeight, 0x000000, 1);
    this.bottomBar = scene.add.rectangle(viewW / 2, viewH + barHeight / 2, viewW, barHeight, 0x000000, 1);

    this.layer.add([this.topBar, this.bottomBar]);
  }

  /**
   * Run the full cinematic. Returns a Promise that resolves when
   * the letterbox bars finish retracting (~1.8s total).
   */
  async play(config: StageEntryCinematicConfig): Promise<void> {
    return new Promise((resolve) => {
      const scene = this.scene;
      const camera = scene.cameras.main;
      const viewW = camera.width;
      const viewH = camera.height;
      const barHeight = viewH * 0.14;

      // Step 1: letterbox bars slide in (400ms)
      scene.tweens.add({
        targets: this.topBar,
        y: barHeight / 2,
        duration: 400,
        ease: "Cubic.easeOut",
      });
      scene.tweens.add({
        targets: this.bottomBar,
        y: viewH - barHeight / 2,
        duration: 400,
        ease: "Cubic.easeOut",
      });

      // Step 2: camera pans to new boss arena (300-1000ms)
      scene.time.delayedCall(300, () => {
        camera.pan(
          config.cameraTargetX,
          config.cameraTargetY,
          700,
          "Cubic.easeInOut",
          false,
        );
      });

      // Step 3: stage banner drops from above (700ms)
      scene.time.delayedCall(700, () => {
        this.banner = this.createBanner(config);
        this.layer.add(this.banner);
        scene.tweens.add({
          targets: this.banner,
          y: viewH * 0.22,
          duration: 600,
          ease: "Back.easeOut",
        });
      });

      // Step 4: monster nameplate rises (900ms)
      if (config.monsterName) {
        scene.time.delayedCall(900, () => {
          this.monsterPlate = this.createMonsterPlate(config);
          this.layer.add(this.monsterPlate);
          scene.tweens.add({
            targets: this.monsterPlate,
            y: viewH * 0.72,
            alpha: 1,
            duration: 600,
            ease: "Cubic.easeOut",
          });
        });
      }

      // Step 5: retract — letterbox out, banner + plate fade (1500ms)
      scene.time.delayedCall(1500, () => {
        scene.tweens.add({
          targets: this.topBar,
          y: -barHeight / 2,
          duration: 300,
          ease: "Cubic.easeIn",
        });
        scene.tweens.add({
          targets: this.bottomBar,
          y: viewH + barHeight / 2,
          duration: 300,
          ease: "Cubic.easeIn",
        });
        if (this.banner) {
          scene.tweens.add({
            targets: this.banner,
            alpha: 0,
            duration: 300,
            ease: "Cubic.easeIn",
          });
        }
        if (this.monsterPlate) {
          scene.tweens.add({
            targets: this.monsterPlate,
            alpha: 0,
            duration: 300,
            ease: "Cubic.easeIn",
          });
        }
      });

      // Step 6: cleanup + resolve (1800ms)
      scene.time.delayedCall(1800, () => {
        this.destroy();
        resolve();
      });
    });
  }

  private createBanner(config: StageEntryCinematicConfig): Phaser.GameObjects.Container {
    const camera = this.scene.cameras.main;
    const viewW = camera.width;

    const banner = this.scene.add.container(viewW / 2, -80);

    // Background — wide gold band with red trim
    const bgWidth = Math.min(viewW * 0.7, 720);
    const bgHeight = 78;
    const bg = this.scene.add.rectangle(0, 0, bgWidth, bgHeight, 0x0a0c1a, 0.94);
    bg.setStrokeStyle(2, 0xffd700, 1);
    banner.add(bg);

    // Stage number — small uppercase
    const stageLabel = this.scene.add.text(
      0,
      -22,
      `STAGE ${config.stageNumber}`,
      {
        fontFamily: '"Courier New", monospace',
        fontSize: "12px",
        color: "#fbbf24",
        align: "center",
        letterSpacing: 4,
        fontStyle: "bold",
      } as Phaser.Types.GameObjects.Text.TextStyle,
    );
    stageLabel.setOrigin(0.5, 0.5);
    banner.add(stageLabel);

    // Stage name — large serif gold
    const nameLabel = this.scene.add.text(0, 10, config.stageName, {
      fontFamily: "Georgia, serif",
      fontSize: "26px",
      color: "#ffffff",
      align: "center",
      stroke: "#fbbf24",
      strokeThickness: 1,
      fontStyle: "bold",
    });
    nameLabel.setOrigin(0.5, 0.5);
    banner.add(nameLabel);

    // Red trim line beneath
    const trim = this.scene.add.rectangle(0, bgHeight / 2 - 4, bgWidth - 30, 2, 0xdc2626, 1);
    banner.add(trim);

    return banner;
  }

  private createMonsterPlate(config: StageEntryCinematicConfig): Phaser.GameObjects.Container {
    const camera = this.scene.cameras.main;
    const viewW = camera.width;
    const viewH = camera.height;

    const plate = this.scene.add.container(viewW / 2, viewH + 80);
    plate.setAlpha(0);

    // "vs <monster>" — italic serif
    const vsLabel = this.scene.add.text(0, 0, `vs  ${config.monsterName ?? "???"}`, {
      fontFamily: "Georgia, serif",
      fontSize: "22px",
      color: "#dc2626",
      align: "center",
      stroke: "#0a0a14",
      strokeThickness: 4,
      fontStyle: "italic bold",
    });
    vsLabel.setOrigin(0.5, 0.5);
    plate.add(vsLabel);

    // Optional tagline — smaller, italicised
    if (config.tagline) {
      const tag = this.scene.add.text(0, 26, config.tagline, {
        fontFamily: "Georgia, serif",
        fontSize: "12px",
        color: "#e2e8f0",
        align: "center",
        wordWrap: { width: viewW * 0.7 },
        stroke: "#0a0a14",
        strokeThickness: 3,
        fontStyle: "italic",
      });
      tag.setOrigin(0.5, 0);
      plate.add(tag);
    }

    return plate;
  }

  private destroy(): void {
    this.topBar.destroy();
    this.bottomBar.destroy();
    if (this.banner) this.banner.destroy();
    if (this.monsterPlate) this.monsterPlate.destroy();
    this.layer.destroy();
  }
}
