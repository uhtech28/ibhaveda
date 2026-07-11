/**
 * @file CrossroadsScene.ts
 * @description Stage 7 (Iteration · The Crossroads Town) map scene.
 *  Uses the delivered "Crossroads Town" painted map (1536×1024 after
 *  autumn-lit village junction with the Copper Kettle inn, a signpost
 *  bearing directions to Northfield/Riverdale/Stonehollow/Westmere/
 *  Greenhollow, a market cart, a windmill farm, and a road-repair
 *  crew.
 *
 *  Setting: Reflection stage — collect feedback, choose one road,
 *  ship improvements, measure impact.
 *  Boss (art pending): The Babel Merchant (arcane family) — gives a
 *    different map to every traveller.
 *
 *  Registered under scene key "CrossroadsScene" and started via
 *  `game.scene.start("CrossroadsScene")` when the user progresses
 *  from Stage 6 (Harbour) or navigates to ?stage=7.
 */

import * as Phaser from "phaser";
import { eventBridge } from "../utils/event-bridge";
import { addBossHpBar, type BossHpBar } from "../animations/bossAnimator";
import { getStageMiniBosses, getStageSuperBoss } from "@/config/stage-bosses";
import { attachTimeOfDay, type TimeOfDayController } from "../utils/time-of-day";
import { attachAmbientVFX, type AmbientVFXController } from "../utils/ambient-vfx";
import { playCpClearBurst } from "../utils/cp-clear-burst";

const MAP_ASSET = "/assets/maps-v2/crossroads/crossroads-map.png";
// The crossroads-map.png painted region is 1536×1024. LDtk simplified
// export previously padded to 2400×1600 with grey filler which let the
// camera pan into a grey void and left CPs orphaned outside the art.
// PNG has been cropped to painted-only dims; bounds match exactly.
const MAP_WIDTH = 1536;
const MAP_HEIGHT = 1024;

const CHAR_IDLE_ASSET = "/assets/fan-tasy/Character_Idle.webp";
const CHAR_WALK_ASSET = "/assets/fan-tasy/Character_Walk.webp";
const CHAR_SCALE = 2.2;
const CHAR_Y_OFFSET = 18;

/**
 * Crossroads has 4 CPs per venture spec (Iteration stage).
 * Narrative arc = "listen → decide → ship → measure":
 *   CP1 The Inn Yard         — feedback collected from every traveller
 *   CP2 The Signpost         — one road chosen from evidence
 *   CP3 The Roadworks        — improvements delivered
 *   CP4 The Milestone Marker — impact measured
 *
 * Placements sit on the visible cobblestone paths connecting the
 * landmarks so the character sprite always lands on walkable ground.
 */
interface Checkpoint {
  index: number;
  x: number;
  y: number;
  label: string;
}
// CP coords rebalanced for the CROPPED 1536×1024 painted region.
// Previously CP3 sat at y=1100 which was 76px past the bottom of the
// art in grey padding; y=900 puts it on the bottom-centre milestone
// gateway.
const CHECKPOINTS: readonly Checkpoint[] = [
  { index: 0, x: 500,  y: 400,  label: "The Inn Yard" },       // outside The Copper Kettle, tables & lanterns
  { index: 1, x: 920,  y: 620,  label: "The Signpost" },       // wooden multi-arrow post at road junction
  { index: 2, x: 1200, y: 780,  label: "The Roadworks" },      // repair crew laying fresh cobbles
  { index: 3, x: 700,  y: 900,  label: "The Milestone Marker" }, // stone gateway with westmere milestone
];

const BOSS_OFFSETS: readonly { x: number; y: number; scale: number }[] = [
  { x: 105, y: -30, scale: 1.5 },
  { x: -110, y: -30, scale: 1.5 },
  { x: 105, y: -30, scale: 1.6 },
  { x: -105, y: -30, scale: 1.7 },
];

const WALK_DURATION_MS = 1800;

export class CrossroadsScene extends Phaser.Scene {
  private currentIndex = 0;
  private character: Phaser.GameObjects.Sprite | null = null;
  private characterShadow: Phaser.GameObjects.Ellipse | null = null;
  private isAnimating = false;
  private checkpointNodes: Phaser.GameObjects.Arc[] = [];
  private miniBossSprites: (Phaser.GameObjects.Sprite | null)[] = [];
  private miniBossHpBars: (BossHpBar | null)[] = [];
  private superBossSprite: Phaser.GameObjects.Sprite | null = null;
  private superBossHpBar: BossHpBar | null = null;
  private superBossRevealed = false;
  private todController: TimeOfDayController | null = null;
  private vfxController: AmbientVFXController | null = null;

  constructor() {
    super({ key: "CrossroadsScene" });
  }

  init(data: { startIndex?: number }): void {
    if (typeof data?.startIndex === "number") {
      this.currentIndex = Math.max(0, Math.min(CHECKPOINTS.length - 1, data.startIndex));
    }
  }

  preload(): void {
    this.load.image("crossroads-composite", MAP_ASSET);
    if (!this.textures.exists("village-persona-idle")) {
      this.load.spritesheet("village-persona-idle", CHAR_IDLE_ASSET, {
        frameWidth: 32,
        frameHeight: 48,
      });
    }
    if (!this.textures.exists("village-persona-walk")) {
      this.load.spritesheet("village-persona-walk", CHAR_WALK_ASSET, {
        frameWidth: 32,
        frameHeight: 48,
      });
    }
    // Boss art for Stage 7 (Babel Merchant + minis) pending — loops
    // no-op until a STAGE_7_CROSSROADS roster lands in stage-bosses.ts.
    for (const boss of getStageMiniBosses(7)) {
      this.load.image(`crossroads-boss-${boss.checkpointIndex}`, boss.idleAsset);
    }
    const superBoss = getStageSuperBoss(7);
    if (superBoss) {
      this.load.image("crossroads-super-boss", superBoss.idleAsset);
    }
  }

  create(): void {
    this.add.image(0, 0, "crossroads-composite").setOrigin(0, 0).setDepth(0);

    const cam = this.cameras.main;
    cam.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    const vw = typeof window !== "undefined" ? window.innerWidth : 1920;
    let zoom: number;
    if (vw < 480) zoom = 0.45;
    else if (vw < 768) zoom = 0.6;
    else if (vw < 1024) zoom = 0.8;
    else zoom = 0.95;
    cam.setZoom(zoom);
    const start = CHECKPOINTS[this.currentIndex];
    cam.centerOn(start.x, start.y);

    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      dragging = true;
      lastX = p.x;
      lastY = p.y;
    });
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (!dragging) return;
      cam.scrollX -= (p.x - lastX) / cam.zoom;
      cam.scrollY -= (p.y - lastY) / cam.zoom;
      lastX = p.x;
      lastY = p.y;
    });
    this.input.on("pointerup", () => {
      dragging = false;
    });

    const KEY_PAN_SPEED = 14;
    const keyboard = this.input.keyboard;
    if (keyboard) {
      const cursors = keyboard.createCursorKeys();
      const wasd = {
        W: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
      this.events.on("update", () => {
        const left = cursors.left?.isDown || wasd.A.isDown;
        const right = cursors.right?.isDown || wasd.D.isDown;
        const up = cursors.up?.isDown || wasd.W.isDown;
        const down = cursors.down?.isDown || wasd.S.isDown;
        const step = KEY_PAN_SPEED / cam.zoom;
        if (left) cam.scrollX -= step;
        if (right) cam.scrollX += step;
        if (up) cam.scrollY -= step;
        if (down) cam.scrollY += step;
      });
    }

    for (const cp of CHECKPOINTS) {
      const disc = this.add
        .circle(cp.x, cp.y, 26, 0xd4af37, 0.95)
        .setStrokeStyle(3, 0x7a4a10, 1)
        .setDepth(50)
        .setInteractive({ useHandCursor: true });
      this.add
        .text(cp.x, cp.y, String(cp.index + 1), {
          fontFamily: "monospace",
          fontSize: "22px",
          color: "#3a2010",
          fontStyle: "bold",
        } as unknown as Phaser.Types.GameObjects.Text.TextStyle)
        .setOrigin(0.5)
        .setDepth(51);
      disc.on("pointerdown", () => this.onCheckpointClicked(cp));
      this.checkpointNodes.push(disc);
    }

    this.spawnCharacter();
    this.spawnMiniBosses();
    this.refreshMiniBossVisibility();
    // No dedicated crossroads TOD/VFX palette yet — reuse the village
    // palette since both share warm-lantern-against-cottage aesthetics
    // and gentle ambient particles (fireflies read as harvest sparks).
    this.todController = attachTimeOfDay(this, "forest", {
      mapWidth: MAP_WIDTH,
      mapHeight: MAP_HEIGHT,
      startIndex: 2, // start at dusk for the autumn-sunset mood
    });
    this.vfxController = attachAmbientVFX(this, "forest", {
      mapWidth: MAP_WIDTH,
      mapHeight: MAP_HEIGHT,
    });
    eventBridge.dispatchToReact({ type: "PHASER_READY" });
  }

  private spawnMiniBosses(): void {
    for (const boss of getStageMiniBosses(7)) {
      const cp = CHECKPOINTS[boss.checkpointIndex];
      const offset = BOSS_OFFSETS[boss.checkpointIndex];
      const key = `crossroads-boss-${boss.checkpointIndex}`;
      if (!cp || !offset || !this.textures.exists(key)) {
        this.miniBossSprites.push(null);
        this.miniBossHpBars.push(null);
        continue;
      }
      const sprite = this.add.sprite(cp.x + offset.x, cp.y + offset.y, key);
      sprite.setOrigin(0.5, 1);
      sprite.setScale(offset.scale);
      sprite.setDepth(60);
      sprite.setFlipX(offset.x > 0);
      this.tweens.add({
        targets: sprite,
        y: sprite.y - 6,
        duration: 1400 + boss.checkpointIndex * 120,
        ease: "Sine.easeInOut",
        yoyo: true,
        repeat: -1,
      });
      const hpBar = addBossHpBar(this, sprite, 1, boss.name);
      this.miniBossSprites.push(sprite);
      this.miniBossHpBars.push(hpBar);
    }
  }

  private refreshMiniBossVisibility(): void {
    for (let i = 0; i < this.miniBossSprites.length; i++) {
      const sprite = this.miniBossSprites[i];
      const hpBar = this.miniBossHpBars[i];
      const isActive = i === this.currentIndex;
      if (sprite) {
        const wasVisible = sprite.visible;
        sprite.setVisible(isActive);
        if (isActive && !wasVisible) {
          const originalScale = sprite.scale;
          this.tweens.add({
            targets: sprite,
            scaleX: originalScale * 0.75,
            scaleY: originalScale * 1.15,
            duration: 130,
            ease: "Sine.easeIn",
            yoyo: true,
            repeat: 1,
            onComplete: () => sprite.setScale(originalScale),
          });
        }
      }
      if (hpBar) hpBar.setVisible(isActive);
    }
  }

  public weakenActiveBoss(tasksDone: number, total: number = 3): void {
    const hpBar = this.miniBossHpBars[this.currentIndex];
    if (!hpBar) return;
    hpBar.setHp(Math.max(0, 1 - tasksDone / total));
  }

  private spawnCharacter(): void {
    const active = CHECKPOINTS[this.currentIndex];
    if (!this.textures.exists("village-persona-idle")) return;

    if (!this.anims.exists("persona-idle")) {
      this.anims.create({
        key: "persona-idle",
        frames: this.anims.generateFrameNumbers("village-persona-idle", {
          start: 0,
          end: 1,
        }),
        frameRate: 2,
        repeat: -1,
      });
    }
    if (!this.anims.exists("persona-walk")) {
      this.anims.create({
        key: "persona-walk",
        frames: this.anims.generateFrameNumbers("village-persona-walk", {
          start: 10,
          end: 14,
        }),
        frameRate: 10,
        repeat: -1,
      });
    }

    const groundY = active.y + CHAR_Y_OFFSET + 4;
    this.characterShadow = this.add
      .ellipse(active.x, groundY, 54, 14, 0x000000, 0.42)
      .setDepth(95);

    this.character = this.add.sprite(
      active.x,
      active.y + CHAR_Y_OFFSET,
      "village-persona-idle",
    );
    this.character.setOrigin(0.5, 1);
    this.character.setScale(CHAR_SCALE);
    this.character.setDepth(100);
    this.character.play("persona-idle");

    this.time.addEvent({
      delay: 60,
      loop: true,
      callback: () => {
        if (!this.character || !this.characterShadow) return;
        this.characterShadow.setPosition(this.character.x, groundY);
      },
    });
  }

  private onCheckpointClicked(cp: Checkpoint): void {
    eventBridge.dispatchToReact({
      type: "CHECKPOINT_CLICKED",
      checkpointId: `crossroads-cp-${cp.index}`,
      stage: 7,
      checkpoint: cp.index + 1,
    });
  }

  public advanceToNextCheckpoint(): void {
    if (this.isAnimating) return;
    if (this.currentIndex >= CHECKPOINTS.length - 1) {
      // Stage 7 (Crossroads · Iteration) fully cleared → advance to
      // Stage 8 (The Capital · Scale).  When Babel Merchant art
      // arrives, this branch calls revealSuperBoss() instead.
      if (!this.superBossRevealed) {
        const superBoss = getStageSuperBoss(7);
        if (superBoss) {
          this.revealSuperBoss();
          return;
        }
      }
      eventBridge.dispatchToReact({
        type: "STAGE_COMPLETE",
        stage: 7,
        nextStage: 8,
      });
      return;
    }
    this.isAnimating = true;
    const clearedCp = CHECKPOINTS[this.currentIndex];
    if (clearedCp) playCpClearBurst(this, clearedCp.x, clearedCp.y, "standard");
    this.currentIndex += 1;
    this.refreshMiniBossVisibility();
    const to = CHECKPOINTS[this.currentIndex];
    if (this.character) this.walkCharacterTo(to.x, to.y + CHAR_Y_OFFSET);
    this.cameras.main.pan(to.x, to.y, WALK_DURATION_MS, "Sine.easeInOut");
    this.time.delayedCall(WALK_DURATION_MS + 100, () => {
      this.isAnimating = false;
    });
  }

  private revealSuperBoss(): void {
    if (this.superBossRevealed) return;
    this.superBossRevealed = true;
    const lastCp = CHECKPOINTS[CHECKPOINTS.length - 1];
    const superX = lastCp.x + 120;
    const superY = lastCp.y - 30;
    this.cameras.main.pan(superX, superY, 1400, "Sine.easeInOut");

    if (this.textures.exists("crossroads-super-boss")) {
      const sprite = this.add.sprite(superX, superY + 260, "crossroads-super-boss");
      sprite.setOrigin(0.5, 1);
      sprite.setScale(0);
      sprite.setDepth(70);
      sprite.setAlpha(0);
      this.superBossSprite = sprite;
      this.tweens.add({
        targets: sprite,
        y: superY,
        alpha: 1,
        scale: 2.6,
        duration: 1600,
        delay: 400,
        ease: "Sine.easeOut",
      });
      const superBoss = getStageSuperBoss(7);
      if (superBoss) {
        this.superBossHpBar = addBossHpBar(this, sprite, 1, superBoss.name);
      }
    }

    this.time.delayedCall(2200, () => {
      const superBoss = getStageSuperBoss(7);
      eventBridge.dispatchToReact({
        type: "SUPER_BOSS_ENCOUNTER",
        stage: 7,
        bossSlug: superBoss?.name,
      });
    });
  }

  /** Called by React after super-boss CombatPanel is won. */
  public defeatSuperBoss(): void {
    if (!this.superBossRevealed) {
      eventBridge.dispatchToReact({
        type: "STAGE_COMPLETE",
        stage: 7,
        nextStage: 8,
      });
      return;
    }
    if (this.superBossHpBar) this.superBossHpBar.setHp(0);
    if (this.superBossSprite) {
      this.tweens.add({
        targets: this.superBossSprite,
        alpha: 0,
        scale: 2.8,
        y: this.superBossSprite.y + 30,
        duration: 900,
        ease: "Sine.easeIn",
      });
    }
    this.time.delayedCall(1200, () => {
      eventBridge.dispatchToReact({
        type: "STAGE_COMPLETE",
        stage: 7,
        nextStage: 8,
      });
    });
  }

  private walkCharacterTo(x: number, y: number): void {
    const char = this.character;
    if (!char) return;
    char.setFlipX(x < char.x);
    char.play("persona-walk");
    this.tweens.add({
      targets: char,
      x,
      y,
      duration: WALK_DURATION_MS,
      ease: "Sine.easeInOut",
      onComplete: () => {
        char.setFlipX(false);
        char.play("persona-idle");
      },
    });
  }

  public getCurrentIndex(): number {
    return this.currentIndex;
  }

  public setCurrentIndex(i: number): void {
    this.currentIndex = Phaser.Math.Clamp(i, 0, CHECKPOINTS.length - 1);
    const cp = CHECKPOINTS[this.currentIndex];
    this.cameras.main.centerOn(cp.x, cp.y);
    if (this.character) this.character.setPosition(cp.x, cp.y + CHAR_Y_OFFSET);
  }

  shutdown(): void {
    this.todController?.dispose();
    this.todController = null;
    this.vfxController?.dispose();
    this.vfxController = null;
    this.tweens.killAll();
    this.input.removeAllListeners();
  }
}
