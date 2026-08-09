/**
 * @file MineScene.ts
 * @description Stage 5 (Build & Deliver · The Mine) map scene.
 *  Uses the "Ironhold Mine" painted map (1536×1024, cropped from a
 *  LDtk composite render.  Cross-section view showing surface (mine
 *  head, supplies, cart crane) and 3 tiers of underground: main
 *  smelter chamber, crystal caverns, and deep magical/gem chambers.
 *
 *  Setting: The Mine · industrial dig with active labour.
 *  Boss (art pending): The Collapse Specter (undead family) — a
 *    tunnel-wraith that appears wherever the plan has gaps.
 *
 *  Registered under scene key "MineScene" and started via
 *  `game.scene.start("MineScene")` when the user progresses from
 *  Stage 4 (Artisan's Quarter) or navigates to ?stage=5.
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

const MAP_ASSET = "/assets/maps-v2/mine/mine-map.png";
// The mine-map.png painted region is 1536×1024. LDtk simplified export
// previously padded the canvas to 2400×1600 with grey filler which let
// the camera pan into a grey void and left CPs orphaned outside the art.
// PNG has been cropped to painted-only dims; bounds match exactly.
const MAP_WIDTH = 1536;
const MAP_HEIGHT = 1024;

// Mine walkability blockers — authored via the in-map editor
// (?editZones=1). Rectangles are in map-image pixel coords (1536×1024).
const BLOCKED_ZONES: readonly { x: number; y: number; w: number; h: number }[] = [
  { x: 4, y: 67, w: 194, h: 177 },
  { x: 218, y: 116, w: 37, h: 27 },
  { x: 179, y: 68, w: 112, h: 43 },
  { x: 309, y: 105, w: 53, h: 31 },
  { x: 386, y: 80, w: 42, h: 32 },
  { x: 427, y: 148, w: 114, h: 22 },
  { x: 478, y: 134, w: 63, h: 20 },
  { x: 514, y: 116, w: 29, h: 21 },
  { x: 604, y: 69, w: 299, h: 34 },
  { x: 853, y: 107, w: 67, h: 119 },
  { x: 800, y: 185, w: 29, h: 54 },
  { x: 796, y: 261, w: 81, h: 62 },
  { x: 2, y: 333, w: 691, h: 40 },
  { x: 535, y: 67, w: 92, h: 125 },
  { x: 664, y: 166, w: 185, h: 31 },
  { x: 799, y: 326, w: 733, h: 44 },
  { x: 6, y: 583, w: 451, h: 34 },
  { x: 454, y: 560, w: 189, h: 33 },
  { x: 755, y: 591, w: 367, h: 42 },
  { x: 1125, y: 611, w: 409, h: 39 },
  { x: 790, y: 807, w: 385, h: 23 },
  { x: 1317, y: 832, w: 34, h: 138 },
  { x: 1245, y: 954, w: 121, h: 67 },
  { x: 1182, y: 814, w: 122, h: 38 },
  { x: 1295, y: 840, w: 99, h: 21 },
  { x: 1349, y: 908, w: 182, h: 109 },
  { x: 1492, y: 653, w: 38, h: 244 },
  { x: 601, y: 806, w: 52, h: 21 },
  { x: 222, y: 779, w: 395, h: 36 },
  { x: 202, y: 774, w: 23, h: 122 },
  { x: 8, y: 981, w: 139, h: 34 },
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
 * Mine has 6 CPs per venture spec (Build & Deliver stage).
 * Narrative arc = "plan → equip → dig → shore → pilot → ship":
 *   CP1 Mine Head       — mineworks planned (blueprint table area)
 *   CP2 Tool Yard       — build environment set up (surface right, crane)
 *   CP3 First Shaft     — core offer built (upper cavern descent)
 *   CP4 Support Beam    — internal quality check (forge / mid cavern)
 *   CP5 Pilot Chamber   — real crews walk the works (deep chamber)
 *   CP6 Loading Bay     — cart loaded, launch-ready (bottom-right exit)
 *
 * Positions blend the artist's 4 placed CP badges (1, 2, 3, 4 on the
 * map) with 2 interpolated stops so the total matches the Convex
 * template's 6-CP count for this stage.  All placements sit on the
 * painted floor (rock ledges, catwalks) rather than empty voids.
 */
interface Checkpoint {
  index: number;
  x: number;
  y: number;
  label: string;
}
// CP coords rebalanced to the CROPPED 1536×1024 painted region.
// Previously x=1830 landed 300px past the right edge of the art;
// x=1400/1420 sit on the actual right-column landmarks (crane / crystals).
const CHECKPOINTS: readonly Checkpoint[] = [
  { index: 0, x: 270,  y: 220,  label: "Mine Head" },         // artist CP1 — surface entrance / blueprint table
  { index: 1, x: 1400, y: 260,  label: "Tool Yard" },         // artist CP4 — surface right, cart crane
  { index: 2, x: 600,  y: 550,  label: "First Shaft" },       // interpolated — upper cavern descent
  { index: 3, x: 1050, y: 620,  label: "Support Beam" },      // interpolated — forge & rail junction
  { index: 4, x: 770,  y: 900,  label: "Pilot Chamber" },     // artist CP2 — deep chamber, blue crystals
  { index: 5, x: 1420, y: 820,  label: "Loading Bay" },       // artist CP3 — bottom-right, purple crystals
];


const WALK_DURATION_MS = 1800;

export class MineScene extends Phaser.Scene {
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
    super({ key: "MineScene" });
  }

  init(data: { startIndex?: number }): void {
    if (typeof data?.startIndex === "number") {
      this.currentIndex = Math.max(0, Math.min(CHECKPOINTS.length - 1, data.startIndex));
    }
  }

  preload(): void {
    this.load.image("mine-composite", MAP_ASSET);
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
    // Boss art for Stage 5 (Collapse Specter + minis) pending — the
    // loops below no-op until a STAGE_5_MINE roster lands in
    // stage-bosses.ts.
    for (const boss of getStageMiniBosses(5)) loadBossAssets(this, 5, boss);
    const superBoss = getStageSuperBoss(5);
    if (superBoss) loadBossAssets(this, 5, superBoss);
  }

  create(): void {
    this.add.image(0, 0, "mine-composite").setOrigin(0, 0).setDepth(0);

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
    for (const b of getStageMiniBosses(5)) registerBossAnimations(this, 5, b);
    const sb = getStageSuperBoss(5);
    if (sb) registerBossAnimations(this, 5, sb);
    this.spawnCharacter();
    this.spawnMovingBoss();
    // Mine doesn't have its own TOD/VFX palette yet — reuse the artisan
    // palette since both biomes share the warm-torchlight-against-stone
    // aesthetic.  Swap to a dedicated "mine" palette when the biome
    // pass reaches this stage.
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
    // localStorage under "ibhaveda-zones-mine" (scene-scoped).
    const editor = attachZoneEditor(this, "mine");
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
    const bosses = getStageMiniBosses(5);
    if (bosses.length === 0) return;
    const first = bosses[Math.min(this.currentIndex, bosses.length - 1)];
    const cp = CHECKPOINTS[this.currentIndex];
    if (!cp) return;
    this.movingBoss = spawnMovingBoss(this, 5, first, cp, { showHpBar: true });
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
      checkpointId: `mine-cp-${cp.index}`,
      stage: 5,
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
      const bosses = getStageMiniBosses(5);
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

  private revealSuperBoss(): void {
    if (this.superBossRevealed) return;
    this.superBossRevealed = true;
    const superBoss = getStageSuperBoss(5);
    if (!superBoss) return;
    const finalCp = CHECKPOINTS[CHECKPOINTS.length - 1];
    const superX = finalCp.x + 200;
    const superY = finalCp.y - 30;

    if (this.personaHandle) {
      playPersonaVictoryPose(this, this.personaHandle, superX);
    }

    this.superBoss = revealSuperBossHelper(this, 5, superBoss, { x: superX, y: superY }, {
      panDurationMs: 1400,
    });
    this.superBossHpBar = this.superBoss.hpBar;

    this.time.delayedCall(2200, () => {
      eventBridge.dispatchToReact({
        type: "SUPER_BOSS_ENCOUNTER",
        stage: 5,
        bossSlug: superBoss.name,
      });
    });
  }

  /** Called by React after super-boss CombatPanel is won. */
  public defeatSuperBoss(): void {
    if (!this.superBossRevealed || !this.superBoss) {
      eventBridge.dispatchToReact({
        type: "STAGE_COMPLETE",
        stage: 5,
        nextStage: 6,
      });
      return;
    }
    dissolveBoss(this, this.superBoss, {
      onComplete: () => {
        eventBridge.dispatchToReact({
          type: "STAGE_COMPLETE",
          stage: 5,
          nextStage: 6,
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
