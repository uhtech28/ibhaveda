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
import { type BossHpBar } from "../animations/bossAnimator";
import { getStageMiniBosses, getStageSuperBoss } from "@/config/stage-bosses";
import { attachTimeOfDay, type TimeOfDayController } from "../utils/time-of-day";
import { attachAmbientVFX, type AmbientVFXController } from "../utils/ambient-vfx";
import { playCpClearBurst } from "../utils/cp-clear-burst";
import { CorruptionOverlay } from "@/lib/phaser/systems/corruptionOverlay";
import { attachCorruptionMapTintWithBridge } from "@/lib/phaser/systems/corruptionMapTint";
import type { CheckpointState } from "@/lib/phaser/utils/event-bridge";
import { attachZoneEditor, type Rect as ZoneRect } from "@/lib/phaser/systems/zoneEditor";
import { attachEditorTestWalk } from "@/lib/phaser/systems/editorTestWalk";
import {
  getCurrentPersonaId,
  loadPersonaSprites,
  registerPersonaAnimations,
} from "@/lib/phaser/persona-assets";
import {
  loadBossAssets,
  registerBossAnimations,
  spawnMovingBoss,
  retreatBossTo,
  dissolveBoss,
  spawnPersonaCharacter,
  walkPersonaTo,
  revealSuperBoss as revealSuperBossHelper,
  playBossState,
  playPersonaState,
  playPersonaVictoryPose,
  type MovingBossHandle,
  type PersonaHandle,
} from "@/lib/phaser/animations/stageMapAnimations";
import { getResponsiveZoom } from "@/lib/phaser/utils/responsive-zoom";

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
// Village-parity persona spawn offset (top-left of CP disc).
const CHAR_X_OFFSET = -60;
const CHAR_Y_OFFSET = -45;

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

const WALK_DURATION_MS = 1800;

export class ArtisansScene extends Phaser.Scene {
  private currentIndex = 0;
  private personaHandle: PersonaHandle | null = null;
  private isAnimating = false;
  private checkpointNodes: Phaser.GameObjects.Arc[] = [];
  private movingBoss: MovingBossHandle | null = null;
  private superBoss: MovingBossHandle | null = null;
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
    for (const boss of getStageMiniBosses(4)) loadBossAssets(this, 4, boss);
    const superBoss = getStageSuperBoss(4);
    if (superBoss) loadBossAssets(this, 4, superBoss);
  }

  create(): void {
    this.add.image(0, 0, "artisans-composite").setOrigin(0, 0).setDepth(0);

    // In-scene corruption tint (color + pattern). Painted between the
    // map (depth 0) and sprites (persona/boss/CP disc >=50) so it
    // never washes the character sprites. Driven by CORRUPTION_STATE
    // events from map/world/page.tsx; auto-cleans on scene shutdown.
    attachCorruptionMapTintWithBridge(this, {
      profile: null,
      opacity: 0,
      mapWidth: MAP_WIDTH,
      mapHeight: MAP_HEIGHT,
      spriteDepth: 50,
    });

    const cam = this.cameras.main;
    cam.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    cam.setZoom(getResponsiveZoom());
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

    // Corruption overlay DISABLED per product ask ("remove the
    // corruption mechanism for now WHATEVER U HAVE ADDED"). The
    // CorruptionOverlay class stays on disk; we just don't
    // instantiate it. `this._corruption` stays null and every
    // `this._corruption?.…` callsite silently no-ops.
    this._corruption = null;

    registerPersonaAnimations(this, getCurrentPersonaId());
    for (const b of getStageMiniBosses(4)) registerBossAnimations(this, 4, b);
    const sb = getStageSuperBoss(4);
    if (sb) registerBossAnimations(this, 4, sb);
    this.spawnCharacter();
    this.spawnMovingBoss();
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

  /** Village-parity: ONE moving boss guards every CP in turn. */
  private spawnMovingBoss(): void {
    const bosses = getStageMiniBosses(4);
    if (bosses.length === 0) return;
    const first = bosses[Math.min(this.currentIndex, bosses.length - 1)];
    const cp = CHECKPOINTS[this.currentIndex];
    if (!cp) return;
    this.movingBoss = spawnMovingBoss(this, 4, first, cp, { showHpBar: false });
    this.movingBoss.cpIndex = this.currentIndex;
    this.movingBoss.sprite.setFlipX(true);
  }

  public weakenActiveBoss(tasksDone: number, total: number = 3): void {
    if (this.movingBoss?.hpBar) {
      this.movingBoss.hpBar.setHp(Math.max(0, 1 - tasksDone / total));
    }
    if (this.movingBoss) playBossState(this, this.movingBoss, "hurt");
    if (this.personaHandle) playPersonaState(this, this.personaHandle, "attack");
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
    this.personaHandle = spawnPersonaCharacter(this, active, {
      legacyIdleKey: "village-persona-idle",
      legacyWalkKey: "village-persona-walk",
      xOffset: CHAR_X_OFFSET,
      yOffset: CHAR_Y_OFFSET,
    });
  }

  private get character(): Phaser.GameObjects.Sprite | null {
    return this.personaHandle?.sprite ?? null;
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
      if (!this.superBossRevealed) {
        if (this.movingBoss) {
          dissolveBoss(this, this.movingBoss, {
            onComplete: () => this.revealSuperBoss(),
          });
        } else {
          this.revealSuperBoss();
        }
      }
      return;
    }
    this.isAnimating = true;
    const clearedCp = CHECKPOINTS[this.currentIndex];
    if (clearedCp) playCpClearBurst(this, clearedCp.x, clearedCp.y, "standard");
    this.currentIndex += 1;
    const to = CHECKPOINTS[this.currentIndex];

    if (this.movingBoss) {
      if (this.movingBoss.hpBar) this.movingBoss.hpBar.setHp(1);
      const bosses = getStageMiniBosses(4);
      const nextBossDef = bosses[this.currentIndex] ?? bosses[bosses.length - 1];
      if (nextBossDef) this.movingBoss.boss = nextBossDef;
      retreatBossTo(this, this.movingBoss, to, {
        durationMs: WALK_DURATION_MS,
        faceX: to.x + CHAR_X_OFFSET,
      });
      this.movingBoss.cpIndex = this.currentIndex;
    }
    if (this.personaHandle) {
      walkPersonaTo(
        this,
        this.personaHandle,
        { x: to.x + CHAR_X_OFFSET, y: to.y + CHAR_Y_OFFSET },
        { durationMs: WALK_DURATION_MS },
      );
    }
    this.cameras.main.pan(to.x, to.y, WALK_DURATION_MS, "Sine.easeInOut");
    this.time.delayedCall(WALK_DURATION_MS + 100, () => {
      this.isAnimating = false;
    });
  }

  /** Reveal the Forge Dragon super boss via the shared helper. */
  private revealSuperBoss(): void {
    if (this.superBossRevealed) return;
    this.superBossRevealed = true;
    const superBoss = getStageSuperBoss(4);
    if (!superBoss) return;
    const cp4 = CHECKPOINTS[CHECKPOINTS.length - 1];
    const superX = cp4.x + 200;
    const superY = cp4.y - 30;

    if (this.personaHandle) {
      playPersonaVictoryPose(this, this.personaHandle, superX);
    }

    this.superBoss = revealSuperBossHelper(this, 4, superBoss, { x: superX, y: superY }, {
      panDurationMs: 1400,
    });
    this.superBossHpBar = this.superBoss.hpBar;

    this.time.delayedCall(2200, () => {
      eventBridge.dispatchToReact({
        type: "SUPER_BOSS_ENCOUNTER",
        stage: 4,
        bossSlug: superBoss.name,
      });
    });
  }

  /** Called by React after super-boss CombatPanel is won. */
  public defeatSuperBoss(): void {
    if (!this.superBossRevealed || !this.superBoss) {
      eventBridge.dispatchToReact({
        type: "STAGE_COMPLETE",
        stage: 4,
        nextStage: 5,
      });
      return;
    }
    dissolveBoss(this, this.superBoss, {
      onComplete: () => {
        eventBridge.dispatchToReact({
          type: "STAGE_COMPLETE",
          stage: 4,
          nextStage: 5,
        });
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
    if (this.personaHandle) {
      this.personaHandle.sprite.setPosition(cp.x + CHAR_X_OFFSET, cp.y + CHAR_Y_OFFSET);
      this.personaHandle.groundY = cp.y + CHAR_Y_OFFSET + 4;
    }
    if (this.movingBoss) {
      const xOff = this.movingBoss.boss.spriteXOffset ?? 0;
      const yOff = this.movingBoss.boss.spriteYOffset ?? 62;
      this.movingBoss.sprite.setPosition(cp.x + xOff, cp.y + yOff);
      this.movingBoss.cpIndex = this.currentIndex;
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
