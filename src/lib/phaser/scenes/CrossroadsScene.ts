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
// Village-parity persona spawn offset (top-left of CP disc).
const CHAR_X_OFFSET = -60;
const CHAR_Y_OFFSET = -45;

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


const WALK_DURATION_MS = 1800;

export class CrossroadsScene extends Phaser.Scene {
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
    for (const boss of getStageMiniBosses(7)) loadBossAssets(this, 7, boss);
    const superBoss = getStageSuperBoss(7);
    if (superBoss) loadBossAssets(this, 7, superBoss);
  }

  create(): void {
    this.add.image(0, 0, "crossroads-composite").setOrigin(0, 0).setDepth(0);

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
    for (const b of getStageMiniBosses(7)) registerBossAnimations(this, 7, b);
    const sb = getStageSuperBoss(7);
    if (sb) registerBossAnimations(this, 7, sb);
    this.spawnCharacter();
    this.spawnMovingBoss();
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
    const bosses = getStageMiniBosses(7);
    if (bosses.length === 0) return;
    const first = bosses[Math.min(this.currentIndex, bosses.length - 1)];
    const cp = CHECKPOINTS[this.currentIndex];
    if (!cp) return;
    this.movingBoss = spawnMovingBoss(this, 7, first, cp, { showHpBar: true });
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
      checkpointId: `crossroads-cp-${cp.index}`,
      stage: 7,
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
      const bosses = getStageMiniBosses(7);
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
    const superBoss = getStageSuperBoss(7);
    if (!superBoss) return;
    const finalCp = CHECKPOINTS[CHECKPOINTS.length - 1];
    const superX = finalCp.x + 200;
    const superY = finalCp.y - 30;

    if (this.personaHandle) {
      playPersonaVictoryPose(this, this.personaHandle, superX);
    }

    this.superBoss = revealSuperBossHelper(this, 7, superBoss, { x: superX, y: superY }, {
      panDurationMs: 1400,
    });
    this.superBossHpBar = this.superBoss.hpBar;

    this.time.delayedCall(2200, () => {
      eventBridge.dispatchToReact({
        type: "SUPER_BOSS_ENCOUNTER",
        stage: 7,
        bossSlug: superBoss.name,
      });
    });
  }

  /** Called by React after super-boss CombatPanel is won. */
  public defeatSuperBoss(): void {
    if (!this.superBossRevealed || !this.superBoss) {
      eventBridge.dispatchToReact({
        type: "STAGE_COMPLETE",
        stage: 7,
        nextStage: 8,
      });
      return;
    }
    dissolveBoss(this, this.superBoss, {
      onComplete: () => {
        eventBridge.dispatchToReact({
          type: "STAGE_COMPLETE",
          stage: 7,
          nextStage: 8,
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
