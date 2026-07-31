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
import {
  CorruptionOverlay,
  type OverlayCheckpoint,
} from "@/lib/phaser/systems/corruptionOverlay";
import {
  ensureCorruptionPattern,
  motifForStage,
} from "@/lib/phaser/systems/corruptionPatterns";
import type { CheckpointState } from "@/lib/phaser/utils/event-bridge";
import { attachZoneEditor, type Rect as ZoneRect } from "@/lib/phaser/systems/zoneEditor";
import { attachEditorTestWalk } from "@/lib/phaser/systems/editorTestWalk";
import {
  getCurrentPersonaId,
  loadPersonaSprites,
  personaSpriteKey,
} from "@/lib/phaser/persona-assets";

const MAP_ASSET = "/assets/maps-v2/crossroads/crossroads-map.png";
// The crossroads-map.png painted region is 1536×1024. LDtk simplified
// export previously padded to 2400×1600 with grey filler which let the
// camera pan into a grey void and left CPs orphaned outside the art.
// PNG has been cropped to painted-only dims; bounds match exactly.
// Sized to the LDtk painted area (1408×1152) after cropping the void
// grey padding out of the 2624×1630 export. All 4 CPs already fit
// inside these bounds — no reposition needed.
const MAP_WIDTH = 1408;
const MAP_HEIGHT = 1152;

// Crossroads walkability blockers — authored via the in-map editor
// (?editZones=1). Rectangles are in map-image pixel coords (1408×1152).
const BLOCKED_ZONES: readonly { x: number; y: number; w: number; h: number }[] = [
  { x: 51, y: 67, w: 396, h: 192 },
  { x: 453, y: 144, w: 114, h: 24 },
  { x: 516, y: 168, w: 46, h: 48 },
  { x: 546, y: 168, w: 24, h: 163 },
  { x: 512, y: 244, w: 36, h: 69 },
  { x: 366, y: 308, w: 51, h: 20 },
  { x: 257, y: 305, w: 54, h: 27 },
  { x: 375, y: 371, w: 52, h: 31 },
  { x: 258, y: 371, w: 56, h: 29 },
  { x: 539, y: 328, w: 43, h: 46 },
  { x: 445, y: 397, w: 20, h: 45 },
  { x: 253, y: 529, w: 64, h: 156 },
  { x: 315, y: 657, w: 148, h: 28 },
  { x: 444, y: 593, w: 20, h: 86 },
  { x: 97, y: 527, w: 48, h: 171 },
  { x: 0, y: 607, w: 149, h: 84 },
  { x: 667, y: 451, w: 41, h: 187 },
  { x: 259, y: 758, w: 303, h: 177 },
  { x: 545, y: 981, w: 34, h: 168 },
  { x: 413, y: 979, w: 155, h: 34 },
  { x: 408, y: 1014, w: 42, h: 136 },
  { x: 196, y: 975, w: 48, h: 52 },
  { x: 4, y: 1074, w: 154, h: 37 },
  { x: 797, y: 768, w: 153, h: 173 },
  { x: 1106, y: 770, w: 238, h: 199 },
  { x: 1126, y: 1086, w: 279, h: 55 },
  { x: 820, y: 115, w: 140, h: 143 },
  { x: 1024, y: 107, w: 310, h: 156 },
  { x: 1338, y: 399, w: 37, h: 41 },
  { x: 962, y: 345, w: 26, h: 29 },
  { x: 896, y: 474, w: 105, h: 67 },
  { x: 1224, y: 618, w: 46, h: 31 },
  { x: 1351, y: 603, w: 51, h: 33 },
  { x: 1201, y: 666, w: 122, h: 24 },
  { x: 1253, y: 511, w: 61, h: 69 },
  { x: 1153, y: 654, w: 40, h: 34 },
  { x: 1129, y: 510, w: 34, h: 25 },
  { x: 1053, y: 486, w: 28, h: 21 },
  { x: 951, y: 628, w: 23, h: 23 },
  { x: 881, y: 1047, w: 81, h: 101 },
  { x: 105, y: 819, w: 23, h: 168 },
  { x: 15, y: 278, w: 71, h: 109 },
  { x: 17, y: 282, w: 86, h: 101 },
];

/** Live custom-zones getter — populated by the in-map editor when
 *  `?editZones=1` is on the URL. Zero-effect when the editor isn't
 *  attached. */
let _customZonesGetter: () => readonly ZoneRect[] = () => [];
function pointInAnyBlockedZone(x: number, y: number): boolean {
  for (const z of BLOCKED_ZONES) {
    if (x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) return true;
  }
  for (const z of _customZonesGetter()) {
    if (x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) return true;
  }
  return false;
}

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
  private _corruption: CorruptionOverlay | null = null;
  private _lastCheckpointStates: CheckpointState[] = [];

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
    loadPersonaSprites(this, getCurrentPersonaId());
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

    // Drag-to-pan — DISABLED while zone-editor is active so left-click
    // drag can draw rectangles without the map scrolling underneath.
    const zoneEditorActive =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("editZones") === "1";
    if (!zoneEditorActive) {
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
    }

    // WASD/arrow pan — suppressed while zone editor is active so
    // editorTestWalk can drive the persona for live blocker testing.
    if (!zoneEditorActive) {
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

    // Corruption overlay — one tile-strip per CP-to-CP segment.
    const crossroadsPattern = ensureCorruptionPattern(this, motifForStage(7));
    const overlayCps: OverlayCheckpoint[] = CHECKPOINTS.map((cp) => ({
      x: cp.x,
      y: cp.y,
    }));
    this._corruption = new CorruptionOverlay(this, {
      checkpoints: overlayCps,
      patternTextureKey: crossroadsPattern,
      tint: 0xa1a1aa, // grey/black-white — The Crossroads
      depth: 5,
    });

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
    // Walkability debug overlay — ?showZones=1 renders BLOCKED_ZONES in
    // red so they can be verified visually against the painted map.
    try {
      const showZones =
        typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).get("showZones") === "1";
      if (showZones) {
        void pointInAnyBlockedZone;
        const g = this.add.graphics();
        g.setDepth(50);
        g.fillStyle(0xff0000, 0.35);
        g.lineStyle(2, 0xff2222, 1);
        BLOCKED_ZONES.forEach((z) => {
          g.fillRect(z.x, z.y, z.w, z.h);
          g.strokeRect(z.x, z.y, z.w, z.h);
        });
      }
    } catch {
      /* SSR safety */
    }

    // In-map zone editor — enabled via ?editZones=1. Zones persist in
    // localStorage under "ibhaveda-zones-crossroads" (scene-scoped).
    const editor = attachZoneEditor(this, "crossroads");
    _customZonesGetter = editor.getCustomZones;
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      _customZonesGetter = () => [];
    });

    // Live test-walk while editing — WASD moves the persona, blockers
    // hard-stop it, camera follows. No-op unless ?editZones=1.
    attachEditorTestWalk(this, {
      getCharacter: () => this.character,
      isBlocked: (x, y) => pointInAnyBlockedZone(x, y),
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
    if (hpBar) {
      hpBar.setHp(Math.max(0, 1 - tasksDone / total));
    }
    // Update the corruption overlay for THIS CP's segment. 2/3 → 10%
    // opacity + weakened monster; 3/3 → 0% + shatter burst.
    this._corruption?.updateSegment(this.currentIndex, tasksDone);
  }

  /**
   * Public: apply a full CheckpointState[] snapshot to the corruption
   * overlay. Called from the React map page whenever CP progress data
   * changes (initial load + realtime Convex updates).
   */
  public applyCorruptionState(states: CheckpointState[]): void {
    this._lastCheckpointStates = states;
    this._corruption?.applyCheckpointStates(states);
  }

  private spawnCharacter(): void {
    const active = CHECKPOINTS[this.currentIndex];
    const personaId = getCurrentPersonaId();
    const personaIdleTex = personaSpriteKey(personaId, "idle");
    const personaWalkTex = personaSpriteKey(personaId, "walk");
    const idleTexKey = this.textures.exists(personaIdleTex)
      ? personaIdleTex
      : "village-persona-idle";
    const walkTexKey = this.textures.exists(personaWalkTex)
      ? personaWalkTex
      : "village-persona-walk";
    if (!this.textures.exists(idleTexKey)) return;

    // If a previous scene registered these anims against the OLD texture,
    // drop them so we rebind to the picked persona's sheet.
    if (this.anims.exists("persona-idle")) this.anims.remove("persona-idle");
    if (this.anims.exists("persona-walk")) this.anims.remove("persona-walk");

    const idleFrames = this.textures.get(idleTexKey).frameTotal;
    this.anims.create({
      key: "persona-idle",
      frames: this.anims.generateFrameNumbers(idleTexKey, {
        start: 0,
        end: Math.max(0, Math.min(idleFrames - 1, 3)),
      }),
      frameRate: 4,
      repeat: -1,
    });

    const walkFrames = this.textures.get(walkTexKey).frameTotal;
    const walkStart = walkTexKey === "village-persona-walk" ? 10 : 0;
    const walkEnd = walkTexKey === "village-persona-walk"
      ? Math.min(walkFrames - 1, 14)
      : Math.min(walkFrames - 1, 5);
    this.anims.create({
      key: "persona-walk",
      frames: this.anims.generateFrameNumbers(walkTexKey, {
        start: walkStart,
        end: walkEnd,
      }),
      frameRate: 10,
      repeat: -1,
    });

    const groundY = active.y + CHAR_Y_OFFSET + 4;
    this.characterShadow = this.add
      .ellipse(active.x, groundY, 54, 14, 0x000000, 0.42)
      .setDepth(95);

    this.character = this.add.sprite(
      active.x,
      active.y + CHAR_Y_OFFSET,
      idleTexKey,
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
