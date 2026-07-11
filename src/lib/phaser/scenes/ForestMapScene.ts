/**
 * @file ForestMapScene.ts
 * @description Stage 2 (Forest of Perfectionism) map scene.
 *  Lean MVP compared to VillageMapScene — focuses on the walkable
 *  fundamentals: painted map + drag/keyboard camera + persona walk
 *  between 4 CPs + eventBridge protocol so React handles tasks/combat
 *  the same way as Village.
 *
 *  Deferred (add in follow-up chunks):
 *    - 4 forest bosses + HP bars + aura rings
 *    - Time-of-day cycle + weather
 *    - Ambient VFX (fireflies / mist / falling leaves)
 *    - Interact gesture on arrival
 *    - Mini-game spawns
 *    - Compass Calibration animation
 *
 *  Registered under scene key "ForestMapScene". /map/world/page.tsx
 *  picks this scene when the active venture's currentStage === 2.
 */

import * as Phaser from "phaser";
import { eventBridge } from "../utils/event-bridge";
import { addBossHpBar, type BossHpBar } from "../animations/bossAnimator";
import { getStageMiniBosses, getStageSuperBoss } from "@/config/stage-bosses";
import { attachTimeOfDay, type TimeOfDayController } from "../utils/time-of-day";
import { attachAmbientVFX, type AmbientVFXController } from "../utils/ambient-vfx";
import { playCpClearBurst } from "../utils/cp-clear-burst";

const MAP_ASSET = "/assets/maps-v2/forest/forest-map.png";
const MAP_WIDTH = 2304;
const MAP_HEIGHT = 1440;

/** Persona sprite reused from Village so it stays visually consistent. */
const CHAR_IDLE_ASSET = "/assets/fan-tasy/Character_Idle.webp";
const CHAR_WALK_ASSET = "/assets/fan-tasy/Character_Walk.webp";
const CHAR_SCALE = 2.2;
const CHAR_Y_OFFSET = 18;

/**
 * Forest checkpoint layout — 4 nodes hand-picked on the 2304×1440 map.
 * Rough intent: west entrance → deeper clearing → boss glade → east
 * exit toward Stage 3. Position tuned so nodes sit on visible ground
 * (clearings, path junctions), not inside canopy or water.
 */
interface Checkpoint {
  index: number;
  x: number;
  y: number;
  label: string;
}
// Stage 2 in the venture template has 5 CPs — laid out so nodes track
// the painted forest path west→east with a detour to the Boss Glade.
const CHECKPOINTS: readonly Checkpoint[] = [
  { index: 0, x: 340, y: 900, label: "West Threshold" },
  { index: 1, x: 780, y: 720, label: "Whispering Grove" },
  { index: 2, x: 1200, y: 550, label: "Moonlit Clearing" },
  { index: 3, x: 1550, y: 1000, label: "Boss Glade" },
  { index: 4, x: 2000, y: 480, label: "East Exit" },
];

/** Boss lateral offset per CP — alternates east/west so the boss doesn't
 *  overlap the character standing on the marker. Stage 2 has 4 mini bosses
 *  spread across CPs 0-3; CP4 (East Exit) is boss-free and triggers the
 *  super-boss reveal instead. */
const BOSS_OFFSETS: readonly { x: number; y: number; scale: number }[] = [
  { x: 105, y: -30, scale: 1.5 },
  { x: -110, y: -30, scale: 1.5 },
  { x: 105, y: -30, scale: 1.5 },
  { x: -105, y: -30, scale: 1.6 },
  { x: 0, y: 0, scale: 1 }, // CP4 — no mini-boss here
];

const WALK_DURATION_MS = 1800;

export class ForestMapScene extends Phaser.Scene {
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
    super({ key: "ForestMapScene" });
  }

  init(data: { startIndex?: number }): void {
    if (typeof data?.startIndex === "number") {
      this.currentIndex = Math.max(0, Math.min(CHECKPOINTS.length - 1, data.startIndex));
    }
  }

  preload(): void {
    this.load.image("forest-composite", MAP_ASSET);
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
    // Load Stage 2 mini-boss idle sprites
    for (const boss of getStageMiniBosses(2)) {
      const key = `forest-boss-${boss.checkpointIndex}`;
      this.load.image(key, boss.idleAsset);
    }
    // Load Stage 2 super boss (Forest Colossus) — idle + back rotation for
    // the cinematic reveal (spawns facing away, turns to face the founder).
    const superBoss = getStageSuperBoss(2);
    if (superBoss) {
      this.load.image("forest-super-boss", superBoss.idleAsset);
      this.load.image(
        "forest-super-boss-back",
        "/assets/bosses/stage2/forest-colossus/rotations/north.png",
      );
    }
  }

  create(): void {
    // 1. Painted background
    this.add.image(0, 0, "forest-composite").setOrigin(0, 0).setDepth(0);

    // 2. Camera
    const cam = this.cameras.main;
    cam.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    const vw = typeof window !== "undefined" ? window.innerWidth : 1920;
    let zoom: number;
    if (vw < 480) zoom = 0.5;
    else if (vw < 768) zoom = 0.65;
    else if (vw < 1024) zoom = 0.85;
    else zoom = 1.0;
    cam.setZoom(zoom);
    const start = CHECKPOINTS[this.currentIndex];
    cam.centerOn(start.x, start.y);

    // 3. Drag-to-pan
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

    // 4. Keyboard arrow keys / WASD
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

    // 5. Checkpoint markers — simple gold discs with numbers, matching
    //    Village style visually so users recognise them.
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

    // 6. Character + shadow
    this.spawnCharacter();

    // 7. Bosses (spawn all 4, only show active-CP)
    this.spawnMiniBosses();
    this.refreshMiniBossVisibility();

    // 8. Time-of-day cycle — atmospheric tint that shifts dawn/noon/dusk/night
    this.todController = attachTimeOfDay(this, "forest", {
      mapWidth: MAP_WIDTH,
      mapHeight: MAP_HEIGHT,
      startIndex: 1, // start at noon
    });

    // 9. Ambient VFX — fireflies + drifting leaves for that magical-forest feel
    this.vfxController = attachAmbientVFX(this, "forest", {
      mapWidth: MAP_WIDTH,
      mapHeight: MAP_HEIGHT,
    });

    // 10. Notify React the scene is ready
    eventBridge.dispatchToReact({ type: "PHASER_READY" });
  }

  private spawnMiniBosses(): void {
    const bosses = getStageMiniBosses(2);
    for (const boss of bosses) {
      const cp = CHECKPOINTS[boss.checkpointIndex];
      const offset = BOSS_OFFSETS[boss.checkpointIndex];
      const key = `forest-boss-${boss.checkpointIndex}`;
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
        // Turn-to-face "startle" — when a mini-boss becomes active (player
        // just arrived at their CP), the boss visibly reacts. Simulates
        // "the boss notices you" without swapping rotation textures.
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
            onComplete: () => {
              sprite.setScale(originalScale);
            },
          });
        }
      }
      if (hpBar) hpBar.setVisible(isActive);
    }
  }

  /** Public — React calls this on task submit to drop the active boss HP. */
  public weakenActiveBoss(tasksDone: number, total: number = 3): void {
    const hpBar = this.miniBossHpBars[this.currentIndex];
    if (!hpBar) return;
    const pct = Math.max(0, 1 - tasksDone / total);
    hpBar.setHp(pct);
  }

  private spawnCharacter(): void {
    const active = CHECKPOINTS[this.currentIndex];
    if (!this.textures.exists("village-persona-idle")) return;

    // Character animations — reuse same keys as Village so no clash
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

    // Shadow (planted on ground, doesn't bob)
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

    // Shadow tracks X only
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
    // Emit the same event the village map uses so page.tsx CheckpointPanel
    // logic works unchanged — no need to duplicate the React flow.
    eventBridge.dispatchToReact({
      type: "CHECKPOINT_CLICKED",
      checkpointId: `forest-cp-${cp.index}`,
      stage: 2,
      checkpoint: cp.index + 1,
    });
  }

  /** Public API — page.tsx calls when the user advances a CP. */
  public advanceToNextCheckpoint(): void {
    if (this.isAnimating) return;
    if (this.currentIndex >= CHECKPOINTS.length - 1) {
      // Stage 2 fully cleared at the CP level → reveal the SUPER boss
      // (Forest Colossus) instead of firing STAGE_COMPLETE. React opens
      // CombatPanel against the super boss; on victory React fires
      // STAGE_COMPLETE which advances to Stage 3.
      if (!this.superBossRevealed) {
        this.revealSuperBoss();
      }
      return;
    }
    this.isAnimating = true;
    // Fire the "CP cleared" burst on the CP we just finished before walking
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

  /**
   * Dramatic super-boss reveal — spawns the Forest Colossus east of CP4
   * in a big, slow rise, pans the camera to it, and after ~2s notifies
   * React (SUPER_BOSS_ENCOUNTER) so CombatPanel opens.
   */
  /**
   * Dramatic super-boss reveal — spawns the Forest Colossus east of CP4
   * in a big, slow rise, pans the camera to it, and after ~2s notifies
   * React (SUPER_BOSS_ENCOUNTER) so CombatPanel opens.
   */
  private revealSuperBoss(): void {
    if (this.superBossRevealed) return;
    this.superBossRevealed = true;
    const cp4 = CHECKPOINTS[CHECKPOINTS.length - 1];
    const superX = cp4.x + 240;
    const superY = cp4.y - 40;

    this.cameras.main.pan(superX, superY, 1400, "Sine.easeInOut");

    if (this.textures.exists("forest-super-boss")) {
      const startTexture = this.textures.exists("forest-super-boss-back")
        ? "forest-super-boss-back"
        : "forest-super-boss";
      const sprite = this.add.sprite(superX, superY + 260, startTexture);
      sprite.setOrigin(0.5, 1);
      sprite.setScale(0);
      sprite.setDepth(70);
      sprite.setAlpha(0);
      this.superBossSprite = sprite;

      this.tweens.add({
        targets: sprite,
        y: superY,
        alpha: 1,
        scale: 2.4,
        duration: 1600,
        delay: 400,
        ease: "Sine.easeOut",
      });

      this.time.delayedCall(1900, () => {
        if (!this.textures.exists("forest-super-boss")) return;
        this.tweens.add({
          targets: sprite,
          scaleX: 2.4 * 0.15,
          duration: 90,
          ease: "Sine.easeIn",
          onComplete: () => {
            sprite.setTexture("forest-super-boss");
            this.tweens.add({
              targets: sprite,
              scaleX: 2.4,
              duration: 140,
              ease: "Back.easeOut",
            });
          },
        });
      });

      this.time.delayedCall(2500, () => {
        this.tweens.add({
          targets: sprite,
          y: superY - 10,
          duration: 1800,
          ease: "Sine.easeInOut",
          yoyo: true,
          repeat: -1,
        });
      });

      const superBoss = getStageSuperBoss(2);
      if (superBoss) {
        this.superBossHpBar = addBossHpBar(this, sprite, 1, superBoss.name);
      }
    }

    this.time.delayedCall(2200, () => {
      const superBoss = getStageSuperBoss(2);
      eventBridge.dispatchToReact({
        type: "SUPER_BOSS_ENCOUNTER",
        stage: 2,
        bossSlug: superBoss?.name,
      });
    });
  }

  /** Called by React after super-boss CombatPanel is won. */
  public defeatSuperBoss(): void {
    if (!this.superBossRevealed) {
      eventBridge.dispatchToReact({
        type: "STAGE_COMPLETE",
        stage: 2,
        nextStage: 3,
      });
      return;
    }
    if (this.superBossHpBar) this.superBossHpBar.setHp(0);
    if (this.superBossSprite) {
      this.tweens.add({
        targets: this.superBossSprite,
        alpha: 0,
        scale: 2.6,
        y: this.superBossSprite.y + 30,
        duration: 900,
        ease: "Sine.easeIn",
      });
    }
    this.time.delayedCall(1200, () => {
      eventBridge.dispatchToReact({
        type: "STAGE_COMPLETE",
        stage: 2,
        nextStage: 3,
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
    if (this.character) {
      this.character.setPosition(cp.x, cp.y + CHAR_Y_OFFSET);
    }
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
