/**
 * @file ArtisansScene.ts
 * @description Stage 4 (Artisans District) map scene — MVP walkable stage.
 *  Mirrors ForestMapScene/GoldenHarborScene structure. Bosses/VFX/TOD
 *  deferred to later chunks.
 *
 *  Registered under scene key "ArtisansScene" and started via
 *  `game.scene.start("ArtisansScene")` when the user progresses from
 *  Stage 3.
 */

import * as Phaser from "phaser";
import { eventBridge } from "../utils/event-bridge";
import { addBossHpBar, type BossHpBar } from "../animations/bossAnimator";
import { getStageMiniBosses, getStageSuperBoss } from "@/config/stage-bosses";
import { attachTimeOfDay, type TimeOfDayController } from "../utils/time-of-day";
import { attachAmbientVFX, type AmbientVFXController } from "../utils/ambient-vfx";
import { playCpClearBurst } from "../utils/cp-clear-burst";
// Corruption overlay disabled — only the type import remains for
// the `_corruption: CorruptionOverlay | null` field. Pattern
// helpers (ensureCorruptionPattern / motifForStage / OverlayCheckpoint)
// were used by the now-removed `new CorruptionOverlay(...)` block.
import { CorruptionOverlay } from "@/lib/phaser/systems/corruptionOverlay";
import type { CheckpointState } from "@/lib/phaser/utils/event-bridge";
import { attachZoneEditor, type Rect as ZoneRect } from "@/lib/phaser/systems/zoneEditor";
import { attachEditorTestWalk } from "@/lib/phaser/systems/editorTestWalk";
import {
  getCurrentPersonaId,
  loadPersonaSprites,
  personaSpriteKey,
} from "@/lib/phaser/persona-assets";

const MAP_ASSET = "/assets/maps-v2/artisans/artisans-map.png";
const MAP_WIDTH = 1536;
const MAP_HEIGHT = 1152;

// Artisans walkability blockers — authored via the in-map editor
// (?editZones=1). Rectangles are in map-image pixel coords (1536×1152).
const BLOCKED_ZONES: readonly { x: number; y: number; w: number; h: number }[] = [
  { x: 4, y: 69, w: 55, h: 63 },
  { x: 229, y: 185, w: 254, h: 94 },
  { x: 389, y: 280, w: 79, h: 42 },
  { x: 207, y: 457, w: 117, h: 59 },
  { x: 396, y: 453, w: 106, h: 61 },
  { x: 483, y: 183, w: 48, h: 322 },
  { x: 305, y: 149, w: 257, h: 72 },
  { x: 529, y: 173, w: 99, h: 73 },
  { x: 505, y: 242, w: 53, h: 54 },
  { x: 539, y: 244, w: 46, h: 29 },
  { x: 629, y: 156, w: 59, h: 127 },
  { x: 689, y: 224, w: 77, h: 58 },
  { x: 605, y: 249, w: 179, h: 54 },
  { x: 592, y: 259, w: 215, h: 76 },
  { x: 560, y: 278, w: 277, h: 81 },
  { x: 535, y: 298, w: 61, h: 191 },
  { x: 600, y: 362, w: 214, h: 107 },
  { x: 683, y: 473, w: 62, h: 23 },
  { x: 856, y: 340, w: 56, h: 105 },
  { x: 913, y: 386, w: 21, h: 97 },
  { x: 858, y: 446, w: 67, h: 32 },
  { x: 937, y: 377, w: 58, h: 116 },
  { x: 935, y: 567, w: 63, h: 133 },
  { x: 1013, y: 537, w: 147, h: 163 },
  { x: 1166, y: 571, w: 36, h: 117 },
  { x: 1191, y: 619, w: 95, h: 72 },
  { x: 789, y: 68, w: 104, h: 299 },
  { x: 771, y: 143, w: 67, h: 158 },
  { x: 891, y: 207, w: 37, h: 123 },
  { x: 880, y: 217, w: 101, h: 94 },
  { x: 953, y: 208, w: 58, h: 103 },
  { x: 889, y: 182, w: 120, h: 41 },
  { x: 997, y: 234, w: 28, h: 81 },
  { x: 625, y: 68, w: 65, h: 40 },
  { x: 506, y: 109, w: 23, h: 39 },
  { x: 475, y: 139, w: 77, h: 21 },
  { x: 493, y: 124, w: 39, h: 34 },
  { x: 325, y: 134, w: 52, h: 34 },
  { x: 380, y: 133, w: 112, h: 40 },
  { x: 1062, y: 83, w: 86, h: 85 },
  { x: 990, y: 103, w: 81, h: 51 },
  { x: 1109, y: 463, w: 59, h: 42 },
  { x: 1277, y: 392, w: 117, h: 155 },
  { x: 1365, y: 514, w: 56, h: 44 },
  { x: 1304, y: 522, w: 60, h: 101 },
  { x: 1113, y: 67, w: 419, h: 341 },
  { x: 978, y: 381, w: 48, h: 102 },
  { x: 534, y: 567, w: 61, h: 249 },
  { x: 610, y: 547, w: 148, h: 174 },
  { x: 785, y: 556, w: 96, h: 95 },
  { x: 816, y: 634, w: 34, h: 61 },
  { x: 988, y: 568, w: 125, h: 312 },
  { x: 688, y: 794, w: 328, h: 62 },
  { x: 937, y: 561, w: 69, h: 245 },
  { x: 719, y: 829, w: 132, h: 135 },
  { x: 810, y: 816, w: 211, h: 122 },
  { x: 1157, y: 617, w: 87, h: 231 },
  { x: 1245, y: 689, w: 56, h: 79 },
  { x: 822, y: 712, w: 58, h: 67 },
  { x: 732, y: 744, w: 96, h: 54 },
  { x: 833, y: 780, w: 138, h: 39 },
  { x: 897, y: 572, w: 96, h: 223 },
  { x: 291, y: 555, w: 169, h: 112 },
  { x: 204, y: 187, w: 29, h: 187 },
  { x: 189, y: 218, w: 35, h: 186 },
  { x: 265, y: 354, w: 74, h: 64 },
  { x: 394, y: 354, w: 67, h: 54 },
  { x: 248, y: 288, w: 99, h: 49 },
  { x: 206, y: 379, w: 24, h: 114 },
  { x: 13, y: 338, w: 168, h: 148 },
  { x: 155, y: 294, w: 26, h: 92 },
  { x: 149, y: 406, w: 52, h: 91 },
  { x: 32, y: 560, w: 115, h: 133 },
  { x: 25, y: 677, w: 131, h: 129 },
  { x: 123, y: 749, w: 56, h: 88 },
  { x: 137, y: 727, w: 36, h: 49 },
  { x: 162, y: 779, w: 57, h: 91 },
  { x: 152, y: 747, w: 46, h: 74 },
  { x: 160, y: 707, w: 57, h: 104 },
  { x: 109, y: 568, w: 76, h: 179 },
  { x: 129, y: 605, w: 76, h: 169 },
  { x: 131, y: 808, w: 239, h: 66 },
  { x: 140, y: 851, w: 245, h: 54 },
  { x: 194, y: 893, w: 223, h: 41 },
  { x: 215, y: 920, w: 221, h: 27 },
  { x: 386, y: 867, w: 41, h: 51 },
  { x: 406, y: 926, w: 185, h: 42 },
  { x: 202, y: 937, w: 246, h: 37 },
  { x: 368, y: 912, w: 147, h: 41 },
  { x: 507, y: 939, w: 96, h: 26 },
  { x: 1236, y: 993, w: 47, h: 140 },
  { x: 16, y: 985, w: 66, h: 36 },
  { x: 17, y: 1010, w: 72, h: 69 },
  { x: 2, y: 881, w: 25, h: 102 },
  { x: 1289, y: 867, w: 54, h: 73 },
  { x: 1387, y: 621, w: 38, h: 158 },
  { x: 1359, y: 684, w: 46, h: 94 },
  { x: 1444, y: 683, w: 85, h: 224 },
  { x: 1331, y: 831, w: 76, h: 39 },
  { x: 1424, y: 1008, w: 105, h: 137 },
  { x: 1184, y: 831, w: 36, h: 42 },
  { x: 1066, y: 171, w: 93, h: 166 },
  { x: 1066, y: 338, w: 85, h: 51 },
  { x: 1087, y: 389, w: 69, h: 73 },
  { x: 417, y: 579, w: 94, h: 139 },
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
 * Artisans District CPs — hand-picked on the 2624×1630 painted map.
 * Narrative: craft workshop → potter's kiln → jeweller's row → master
 * artisan's forge. Nodes intended to sit on cobblestone streets and
 * workshop yards.
 */
interface Checkpoint {
  index: number;
  x: number;
  y: number;
  label: string;
}
// Stage 4 (Artisans) has 5 CPs in the venture template.
// Map was cropped from 2624×1630 down to 1536×1152 (the actual painted
// area from the LDtk delivery). CP4 and CP5 were originally outside the
// painted bounds — moved inside so both landmarks are visible and
// reachable. Update these positions after the artist paints more.
const CHECKPOINTS: readonly Checkpoint[] = [
  { index: 0, x: 300, y: 780, label: "Craft Workshop" },
  { index: 1, x: 700, y: 600, label: "Weaver's Alley" },
  { index: 2, x: 1050, y: 420, label: "Potter's Kiln" },
  { index: 3, x: 900, y: 900, label: "Jeweller's Row" },
  { index: 4, x: 1400, y: 320, label: "Master's Forge" },
];

const BOSS_OFFSETS: readonly { x: number; y: number; scale: number }[] = [
  { x: 105, y: -30, scale: 1.6 },
  { x: -110, y: -30, scale: 1.6 },
  { x: 105, y: -30, scale: 1.8 },
  { x: -105, y: -30, scale: 1.7 },
  { x: 0, y: 0, scale: 1 }, // CP4 — no mini-boss; super boss reveals east of here
];

const WALK_DURATION_MS = 1800;

export class ArtisansScene extends Phaser.Scene {
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
    super({ key: "ArtisansScene" });
  }

  init(data: { startIndex?: number }): void {
    if (typeof data?.startIndex === "number") {
      this.currentIndex = Math.max(0, Math.min(CHECKPOINTS.length - 1, data.startIndex));
    }
  }

  preload(): void {
    this.load.image("artisans-composite", MAP_ASSET);
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
    for (const boss of getStageMiniBosses(4)) {
      this.load.image(`artisans-boss-${boss.checkpointIndex}`, boss.idleAsset);
    }
    const superBoss = getStageSuperBoss(4);
    if (superBoss) {
      this.load.image("artisans-super-boss", superBoss.idleAsset);
      this.load.image(
        "artisans-super-boss-back",
        "/assets/bosses/stage4/forge-dragon/rotations/north.png",
      );
    }
  }

  create(): void {
    this.add.image(0, 0, "artisans-composite").setOrigin(0, 0).setDepth(0);

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

    // Drag-to-pan — DISABLED while zone-editor is active so the left-
    // click-drag is free to draw rectangles without the map scrolling
    // underneath. Right-click-drag still pans inside the editor.
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
          // WASD camera-pan disabled — the character-movement helper
          // (attachEditorTestWalk with force:true) now owns
          // WASD/arrows and centres the camera on the persona.
          // Keeping this handler as a no-op preserves the
          // surrounding block for future non-WASD input we
          // might want to attach here.
          const step = KEY_PAN_SPEED / cam.zoom;
          void step; void left; void right; void up; void down;
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
    const artisansPattern = ensureCorruptionPattern(this, motifForStage(4));
    const overlayCps: OverlayCheckpoint[] = CHECKPOINTS.map((cp) => ({
      x: cp.x,
      y: cp.y,
    }));
    // Corruption overlay DISABLED per product ask ("remove the
    // corruption mechanism for now WHATEVER U HAVE ADDED"). The
    // CorruptionOverlay class stays on disk; we just don't
    // instantiate it. `this._corruption` stays null and every
    // `this._corruption?.…` callsite silently no-ops.
    this._corruption = null;

    this.spawnCharacter();
    this.spawnMiniBosses();
    this.refreshMiniBossVisibility();
    this.todController = attachTimeOfDay(this, "artisan", {
      mapWidth: MAP_WIDTH,
      mapHeight: MAP_HEIGHT,
      startIndex: 1,
    });
    this.vfxController = attachAmbientVFX(this, "artisan", {
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
        void pointInAnyBlockedZone; // keep helper referenced
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

    // In-map zone editor — enabled via ?editZones=1. Draws cyan
    // rectangles + HUD in top-right. Zones persist in localStorage
    // under key "ibhaveda-zones-artisan" (scene-scoped, no bleed from
    // Village/Forest editors).
    const editor = attachZoneEditor(this, "artisan");
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
      // Force-enable free-roam movement on this stage scene
      // (previously WASD only worked with ?editZones=1). Restores
      // parity with VillageMapScene — user reported "characters are
      // not walking" on Forest/Arena/Crossroads/Artisans/Mine/GH.
      force: true,
    });

    eventBridge.dispatchToReact({ type: "PHASER_READY" });
  }

  private spawnMiniBosses(): void {
    for (const boss of getStageMiniBosses(4)) {
      const cp = CHECKPOINTS[boss.checkpointIndex];
      const offset = BOSS_OFFSETS[boss.checkpointIndex];
      const key = `artisans-boss-${boss.checkpointIndex}`;
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
    // For legacy Village sheet, useful walk frames are 10..14. For extended
    // personas, walk frames start at 0. Pick range based on which sheet.
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
      checkpointId: `artisans-cp-${cp.index}`,
      stage: 4,
      checkpoint: cp.index + 1,
    });
  }

  public advanceToNextCheckpoint(): void {
    if (this.isAnimating) return;
    if (this.currentIndex >= CHECKPOINTS.length - 1) {
      // Stage 4 fully cleared at the CP level → reveal super boss
      // (Forge Dragon). React runs combat; on victory STAGE_COMPLETE
      // fires with nextStage=5, which page.tsx uses to open the
      // venture-wide finale overlay (no stage 5 art exists).
      if (!this.superBossRevealed) {
        this.revealSuperBoss();
      }
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

  /** Reveal the Forge Dragon super boss east of CP4 with a fiery rise. */
  /** Reveal the Forge Dragon super boss east of CP4 with a fiery rise. */
  private revealSuperBoss(): void {
    if (this.superBossRevealed) return;
    this.superBossRevealed = true;
    const cp4 = CHECKPOINTS[CHECKPOINTS.length - 1];
    const superX = cp4.x + 200;
    const superY = cp4.y - 30;
    this.cameras.main.pan(superX, superY, 1400, "Sine.easeInOut");

    if (this.textures.exists("artisans-super-boss")) {
      const startTexture = this.textures.exists("artisans-super-boss-back")
        ? "artisans-super-boss-back"
        : "artisans-super-boss";
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
        scale: 2.8,
        duration: 1600,
        delay: 400,
        ease: "Sine.easeOut",
      });
      this.time.delayedCall(1900, () => {
        if (!this.textures.exists("artisans-super-boss")) return;
        this.tweens.add({
          targets: sprite,
          scaleX: 2.8 * 0.15,
          duration: 90,
          ease: "Sine.easeIn",
          onComplete: () => {
            sprite.setTexture("artisans-super-boss");
            this.tweens.add({
              targets: sprite,
              scaleX: 2.8,
              duration: 140,
              ease: "Back.easeOut",
            });
          },
        });
      });
      this.time.delayedCall(2500, () => {
        this.tweens.add({
          targets: sprite,
          y: superY - 12,
          duration: 1800,
          ease: "Sine.easeInOut",
          yoyo: true,
          repeat: -1,
        });
      });
      const superBoss = getStageSuperBoss(4);
      if (superBoss) {
        this.superBossHpBar = addBossHpBar(this, sprite, 1, superBoss.name);
      }
    }

    this.time.delayedCall(2200, () => {
      const superBoss = getStageSuperBoss(4);
      eventBridge.dispatchToReact({
        type: "SUPER_BOSS_ENCOUNTER",
        stage: 4,
        bossSlug: superBoss?.name,
      });
    });
  }

  /** Called by React after super-boss CombatPanel is won. */
  public defeatSuperBoss(): void {
    if (!this.superBossRevealed) {
      eventBridge.dispatchToReact({
        type: "STAGE_COMPLETE",
        stage: 4,
        nextStage: 5,
      });
      return;
    }
    if (this.superBossHpBar) this.superBossHpBar.setHp(0);
    if (this.superBossSprite) {
      this.tweens.add({
        targets: this.superBossSprite,
        alpha: 0,
        scale: 3.0,
        y: this.superBossSprite.y + 30,
        duration: 900,
        ease: "Sine.easeIn",
      });
    }
    this.time.delayedCall(1200, () => {
      eventBridge.dispatchToReact({
        type: "STAGE_COMPLETE",
        stage: 4,
        nextStage: 5,
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
