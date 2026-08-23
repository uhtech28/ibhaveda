/**
 * @file GoldenHarborScene.ts
 * @description Stage 3 (Golden Harbor) map scene — MVP walkable stage.
 *  Mirrors ForestMapScene's structure. Bosses/VFX/TOD deferred.
 *
 *  Registered under scene key "GoldenHarborScene" and started via
 *  `game.scene.start("GoldenHarborScene")` when the user progresses
 *  from Stage 2.
 */

import * as Phaser from "phaser";
import { eventBridge } from "../utils/event-bridge";
import { type BossHpBar } from "../animations/bossAnimator";
import { getStageMiniBosses, getStageSuperBoss } from "@/config/stage-bosses";
import { attachTimeOfDay, type TimeOfDayController } from "../utils/time-of-day";
import { attachAmbientVFX, type AmbientVFXController } from "../utils/ambient-vfx";
import { playCpClearBurst } from "../utils/cp-clear-burst";
// Corruption overlay disabled — only the type import remains for
// the `_corruption: CorruptionOverlay | null` field. Pattern
// helpers (ensureCorruptionPattern / motifForStage / OverlayCheckpoint)
// were used by the now-removed `new CorruptionOverlay(...)` block.
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

const MAP_ASSET = "/assets/maps-v2/golden-harbor/harbor-map.png";
const MAP_WIDTH = 1664;
const MAP_HEIGHT = 1024;

// Golden Harbor walkability blockers — authored via the in-map editor
// (?editZones=1). Rectangles are in map-image pixel coords (1664×1024).
const BLOCKED_ZONES: readonly { x: number; y: number; w: number; h: number }[] = [
  { x: 0, y: 67, w: 685, h: 157 },
  { x: 119, y: 205, w: 552, h: 77 },
  { x: 779, y: 67, w: 71, h: 202 },
  { x: 152, y: 255, w: 439, h: 49 },
  { x: 189, y: 252, w: 411, h: 64 },
  { x: 213, y: 238, w: 461, h: 91 },
  { x: 248, y: 271, w: 423, h: 77 },
  { x: 269, y: 301, w: 357, h: 63 },
  { x: 305, y: 314, w: 311, h: 61 },
  { x: 207, y: 689, w: 153, h: 57 },
  { x: 348, y: 676, w: 47, h: 42 },
  { x: 375, y: 664, w: 38, h: 33 },
  { x: 227, y: 565, w: 68, h: 40 },
  { x: 191, y: 581, w: 75, h: 71 },
  { x: 447, y: 533, w: 27, h: 40 },
  { x: 456, y: 544, w: 39, h: 32 },
  { x: 436, y: 578, w: 34, h: 40 },
  { x: 411, y: 580, w: 40, h: 37 },
  { x: 412, y: 588, w: 57, h: 42 },
  { x: 375, y: 480, w: 31, h: 34 },
  { x: 407, y: 498, w: 28, h: 49 },
  { x: 415, y: 526, w: 56, h: 29 },
  { x: 259, y: 474, w: 126, h: 99 },
  { x: 365, y: 516, w: 76, h: 58 },
  { x: 381, y: 544, w: 97, h: 38 },
  { x: 241, y: 672, w: 135, h: 53 },
  { x: 278, y: 700, w: 86, h: 28 },
  { x: 213, y: 692, w: 136, h: 61 },
  { x: 194, y: 697, w: 148, h: 65 },
  { x: 223, y: 674, w: 112, h: 91 },
  { x: 242, y: 687, w: 83, h: 87 },
  { x: 255, y: 686, w: 61, h: 94 },
  { x: 273, y: 692, w: 35, h: 98 },
  { x: 115, y: 586, w: 68, h: 58 },
  { x: 91, y: 640, w: 59, h: 36 },
  { x: 242, y: 458, w: 63, h: 98 },
  { x: 165, y: 537, w: 97, h: 88 },
  { x: 181, y: 520, w: 94, h: 59 },
  { x: 198, y: 504, w: 100, h: 51 },
  { x: 227, y: 491, w: 60, h: 52 },
  { x: 101, y: 550, w: 128, h: 79 },
  { x: 4, y: 530, w: 124, h: 260 },
  { x: 2, y: 268, w: 63, h: 292 },
  { x: 0, y: 227, w: 56, h: 40 },
  { x: 558, y: 69, w: 476, h: 114 },
  { x: 945, y: 185, w: 225, h: 157 },
  { x: 1124, y: 165, w: 81, h: 226 },
  { x: 966, y: 72, w: 164, h: 131 },
  { x: 1562, y: 361, w: 97, h: 335 },
  { x: 1175, y: 478, w: 118, h: 218 },
  { x: 992, y: 500, w: 314, h: 89 },
  { x: 908, y: 512, w: 408, h: 86 },
  { x: 881, y: 531, w: 456, h: 66 },
  { x: 1192, y: 658, w: 183, h: 47 },
  { x: 1234, y: 695, w: 159, h: 27 },
  { x: 1299, y: 705, w: 139, h: 40 },
  { x: 1362, y: 750, w: 124, h: 165 },
  { x: 1378, y: 616, w: 155, h: 260 },
  { x: 1502, y: 593, w: 157, h: 347 },
  { x: 1353, y: 860, w: 215, h: 80 },
  { x: 866, y: 550, w: 378, h: 157 },
  { x: 596, y: 540, w: 98, h: 34 },
  { x: 632, y: 566, w: 97, h: 183 },
  { x: 561, y: 677, w: 192, h: 156 },
  { x: 728, y: 566, w: 35, h: 183 },
  { x: 455, y: 713, w: 327, h: 126 },
  { x: 467, y: 708, w: 124, h: 201 },
  { x: 407, y: 751, w: 392, h: 154 },
  { x: 391, y: 763, w: 164, h: 82 },
  { x: 374, y: 783, w: 136, h: 92 },
  { x: 342, y: 810, w: 193, h: 33 },
  { x: 356, y: 789, w: 136, h: 41 },
  { x: 419, y: 736, w: 154, h: 82 },
  { x: 445, y: 723, w: 135, h: 82 },
  { x: 335, y: 819, w: 92, h: 29 },
  { x: 371, y: 880, w: 467, h: 141 },
  { x: 1, y: 953, w: 483, h: 64 },
  { x: 807, y: 859, w: 340, h: 163 },
  { x: 1122, y: 874, w: 80, h: 144 },
  { x: 1202, y: 869, w: 108, h: 148 },
  { x: 1312, y: 874, w: 349, h: 145 },
  { x: 1217, y: 853, w: 58, h: 52 },
  { x: 1079, y: 638, w: 77, h: 204 },
  { x: 1015, y: 610, w: 61, h: 189 },
  { x: 946, y: 655, w: 144, h: 109 },
  { x: 832, y: 588, w: 181, h: 151 },
  { x: 761, y: 769, w: 99, h: 99 },
  { x: 818, y: 811, w: 107, h: 68 },
  { x: 926, y: 816, w: 56, h: 80 },
  { x: 941, y: 832, w: 60, h: 51 },
  { x: 937, y: 288, w: 81, h: 104 },
  { x: 905, y: 317, w: 22, h: 51 },
  { x: 681, y: 311, w: 28, h: 66 },
  { x: 638, y: 333, w: 38, h: 44 },
  { x: 713, y: 389, w: 28, h: 27 },
  { x: 953, y: 398, w: 37, h: 25 },
  { x: 1023, y: 466, w: 63, h: 68 },
  { x: 1089, y: 486, w: 89, h: 55 },
  { x: 965, y: 498, w: 93, h: 62 },
  { x: 1002, y: 489, w: 57, h: 58 },
  { x: 1006, y: 474, w: 34, h: 34 },
  { x: 989, y: 72, w: 319, h: 176 },
  { x: 1122, y: 69, w: 237, h: 274 },
  { x: 1360, y: 69, w: 302, h: 269 },
  { x: 1541, y: 339, w: 105, h: 79 },
  { x: 1241, y: 559, w: 220, h: 132 },
  { x: 1422, y: 581, w: 89, h: 84 },
  { x: 1508, y: 495, w: 92, h: 108 },
  { x: 653, y: 162, w: 87, h: 24 },
  { x: 646, y: 141, w: 72, h: 59 },
  { x: 637, y: 168, w: 66, h: 38 },
  { x: 937, y: 167, w: 38, h: 56 },
  { x: 918, y: 134, w: 23, h: 98 },
  { x: 893, y: 145, w: 21, h: 58 },
  { x: 864, y: 149, w: 22, h: 40 },
  { x: 933, y: 267, w: 22, h: 69 },
  { x: 708, y: 572, w: 155, h: 167 },
  { x: 448, y: 292, w: 189, h: 115 },
  { x: 1182, y: 193, w: 112, h: 180 },
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
 * Golden Harbor CPs — hand-picked on the 2612×1632 painted map.
 * Rough narrative arc: dockside arrival → market square → warehouse
 * district → lighthouse tip. Positioned so nodes sit on paths/docks,
 * not on water tiles.
 */
interface Checkpoint {
  index: number;
  x: number;
  y: number;
  label: string;
}
// CP count aligned to Convex venture template (Stage 6 Launch has 3 CPs:
// Launch assets prepared, Product live and announced, First users
// acquired). The 4th scene CP "Lighthouse Tip" was orphan — no task data
// for it in the template. Lighthouse now hosts the super-boss reveal only.
// Map cropped from 2624×1630 down to 1664×1024 (actual painted area
// from LDtk delivery). CP3 Warehouse District was outside painted
// bounds — moved inside. Repaint LDtk canvas to restore full size.
const CHECKPOINTS: readonly Checkpoint[] = [
  { index: 0, x: 320, y: 650, label: "Dockside Arrival" },
  { index: 1, x: 900, y: 400, label: "Market Square" },
  { index: 2, x: 1350, y: 760, label: "Warehouse District" },
];


// Super-boss (Leviathan) reveals near the lighthouse — this used to be
// a 4th CP but is now a landmark-only anchor for the reveal cinematic.
const SUPER_BOSS_ANCHOR = { x: 2300, y: 520 };

const WALK_DURATION_MS = 1800;

export class GoldenHarborScene extends Phaser.Scene {
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
    super({ key: "GoldenHarborScene" });
  }

  init(data: { startIndex?: number }): void {
    if (typeof data?.startIndex === "number") {
      this.currentIndex = Math.max(
        0,
        Math.min(CHECKPOINTS.length - 1, data.startIndex),
      );
    }
  }

  preload(): void {
    this.load.image("harbor-composite", MAP_ASSET);
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
    for (const boss of getStageMiniBosses(6)) {
      this.load.image(`harbor-boss-${boss.checkpointIndex}`, boss.idleAsset);
    }
    const superBoss = getStageSuperBoss(6);
    if (superBoss) {
      this.load.image("harbor-super-boss", superBoss.idleAsset);
      this.load.image(
        "harbor-super-boss-back",
        "/assets/bosses/stage3/leviathan/rotations/north.png",
      );
    }
  }

  create(): void {
    this.add.image(0, 0, "harbor-composite").setOrigin(0, 0).setDepth(0);

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
    for (const b of getStageMiniBosses(6)) registerBossAnimations(this, 6, b);
    const sb = getStageSuperBoss(6);
    if (sb) registerBossAnimations(this, 6, sb);
    this.spawnCharacter();
    this.spawnMovingBoss();
    this.todController = attachTimeOfDay(this, "harbor", {
      mapWidth: MAP_WIDTH,
      mapHeight: MAP_HEIGHT,
      startIndex: 1,
    });
    this.vfxController = attachAmbientVFX(this, "harbor", {
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
    // localStorage under "ibhaveda-zones-harbor" (scene-scoped).
    const editor = attachZoneEditor(this, "harbor");
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

  /** Village-parity: ONE moving boss guards each CP in turn. */
  private spawnMovingBoss(): void {
    const bosses = getStageMiniBosses(6);
    if (bosses.length === 0) return;
    const first = bosses[Math.min(this.currentIndex, bosses.length - 1)];
    const cp = CHECKPOINTS[this.currentIndex];
    if (!cp) return;
    this.movingBoss = spawnMovingBoss(this, 6, first, cp, { showHpBar: false });
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
      checkpointId: `harbor-cp-${cp.index}`,
      // Harbor is Stage 6 (Launch · The Harbour) per venture spec.
      stage: 6,
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
      const bosses = getStageMiniBosses(6);
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

  /** Reveal the Leviathan super boss east of CP4 with a rising splash. */
  /** Reveal the Leviathan super boss east of CP4 with a rising splash. */
  private revealSuperBoss(): void {
    if (this.superBossRevealed) return;
    this.superBossRevealed = true;
    const superBoss = getStageSuperBoss(6);
    if (!superBoss) return;
    const finalCp = CHECKPOINTS[CHECKPOINTS.length - 1];
    const superX = finalCp.x + 200;
    const superY = finalCp.y - 30;

    if (this.personaHandle) {
      playPersonaVictoryPose(this, this.personaHandle, superX);
    }

    this.superBoss = revealSuperBossHelper(this, 6, superBoss, { x: superX, y: superY }, {
      panDurationMs: 1400,
    });
    this.superBossHpBar = this.superBoss.hpBar;

    this.time.delayedCall(2200, () => {
      eventBridge.dispatchToReact({
        type: "SUPER_BOSS_ENCOUNTER",
        stage: 6,
        bossSlug: superBoss.name,
      });
    });
  }

  /** Called by React after super-boss CombatPanel is won. */
  public defeatSuperBoss(): void {
    if (!this.superBossRevealed || !this.superBoss) {
      eventBridge.dispatchToReact({
        type: "STAGE_COMPLETE",
        stage: 6,
        nextStage: 7,
      });
      return;
    }
    dissolveBoss(this, this.superBoss, {
      onComplete: () => {
        eventBridge.dispatchToReact({
          type: "STAGE_COMPLETE",
          stage: 6,
          nextStage: 7,
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
