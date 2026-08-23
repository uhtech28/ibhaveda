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

const MAP_ASSET = "/assets/maps-v2/forest/forest-map.png";
// Sized to the actual painted area of the new LDtk delivery (was
// 2304×1440 for the previous forest painting). Cropped from 2624×1630
// LDtk canvas down to 1412×1156. All 5 CPs rescaled proportionally.
const MAP_WIDTH = 1412;
const MAP_HEIGHT = 1156;

/** Persona sprite reused from Village so it stays visually consistent. */
const CHAR_IDLE_ASSET = "/assets/fan-tasy/Character_Idle.webp";
const CHAR_WALK_ASSET = "/assets/fan-tasy/Character_Walk.webp";
// Village-parity persona spawn offset (top-left of CP disc).
const CHAR_X_OFFSET = -60;
const CHAR_Y_OFFSET = -45;

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
// CPs rescaled to the new 1412×1156 painted area (from 2304×1440).
// Tune positions in-editor with ?showZones=1 once you eyeball the new
// map — these are proportional placeholders anchored on the west→east
// path arc that flows through most forest layouts.
const CHECKPOINTS: readonly Checkpoint[] = [
  { index: 0, x: 210, y: 720, label: "West Threshold" },
  { index: 1, x: 480, y: 580, label: "Whispering Grove" },
  { index: 2, x: 740, y: 440, label: "Moonlit Clearing" },
  { index: 3, x: 950, y: 800, label: "Boss Glade" },
  { index: 4, x: 1220, y: 380, label: "East Exit" },
];

// Forest walkability blockers — authored via the in-map zone editor
// (?editZones=1). Rectangles are in map-image pixel coords (1412×1156).
const BLOCKED_ZONES: readonly { x: number; y: number; w: number; h: number }[] = [
  { x: 242, y: 68, w: 74, h: 193 },
  { x: 257, y: 300, w: 57, h: 84 },
  { x: 288, y: 387, w: 62, h: 31 },
  { x: 351, y: 399, w: 48, h: 63 },
  { x: 328, y: 420, w: 21, h: 22 },
  { x: 400, y: 450, w: 34, h: 48 },
  { x: 376, y: 464, w: 26, h: 48 },
  { x: 383, y: 486, w: 35, h: 28 },
  { x: 364, y: 662, w: 43, h: 30 },
  { x: 329, y: 690, w: 53, h: 20 },
  { x: 344, y: 675, w: 34, h: 23 },
  { x: 242, y: 790, w: 42, h: 58 },
  { x: 250, y: 767, w: 49, h: 64 },
  { x: 263, y: 752, w: 50, h: 41 },
  { x: 279, y: 736, w: 51, h: 36 },
  { x: 287, y: 724, w: 57, h: 31 },
  { x: 318, y: 697, w: 62, h: 54 },
  { x: 296, y: 356, w: 56, h: 40 },
  { x: 157, y: 937, w: 85, h: 187 },
  { x: 225, y: 1048, w: 47, h: 105 },
  { x: 0, y: 1109, w: 253, h: 45 },
  { x: 876, y: 96, w: 200, h: 149 },
  { x: 1256, y: 492, w: 104, h: 118 },
  { x: 1160, y: 734, w: 63, h: 168 },
  { x: 926, y: 742, w: 95, h: 54 },
  { x: 902, y: 756, w: 38, h: 36 },
  { x: 923, y: 906, w: 57, h: 54 },
  { x: 951, y: 962, w: 108, h: 60 },
  { x: 966, y: 933, w: 41, h: 47 },
  { x: 988, y: 1012, w: 120, h: 67 },
  { x: 1026, y: 1058, w: 80, h: 89 },
  { x: 590, y: 405, w: 192, h: 133 },
  { x: 647, y: 504, w: 74, h: 106 },
  { x: 460, y: 99, w: 23, h: 64 },
  { x: 470, y: 104, w: 72, h: 25 },
  { x: 552, y: 834, w: 25, h: 52 },
  { x: 364, y: 836, w: 24, h: 58 },
  { x: 388, y: 796, w: 23, h: 44 },
  { x: 526, y: 792, w: 22, h: 50 },
  { x: 502, y: 877, w: 26, h: 40 },
  { x: 276, y: 1058, w: 989, h: 83 },
  { x: 814, y: 895, w: 25, h: 61 },
  { x: 752, y: 955, w: 26, h: 92 },
  { x: 896, y: 964, w: 20, h: 74 },
  { x: 846, y: 996, w: 32, h: 52 },
  { x: 796, y: 996, w: 32, h: 60 },
  { x: 314, y: 992, w: 20, h: 52 },
  { x: 341, y: 1031, w: 39, h: 20 },
  { x: 6, y: 64, w: 206, h: 72 },
  { x: 2, y: 146, w: 87, h: 172 },
  { x: 0, y: 318, w: 131, h: 29 },
  { x: 122, y: 348, w: 33, h: 91 },
  { x: 1, y: 350, w: 75, h: 308 },
  { x: 109, y: 589, w: 22, h: 67 },
  { x: 108, y: 772, w: 31, h: 124 },
  { x: 1, y: 662, w: 86, h: 238 },
  { x: 1333, y: 885, w: 71, h: 265 },
  { x: 1177, y: 1013, w: 219, h: 135 },
  { x: 1357, y: 614, w: 45, h: 288 },
  { x: 1288, y: 714, w: 84, h: 51 },
  { x: 1316, y: 766, w: 66, h: 64 },
  { x: 1248, y: 676, w: 32, h: 60 },
  { x: 1177, y: 637, w: 35, h: 53 },
  { x: 1101, y: 647, w: 27, h: 57 },
  { x: 1075, y: 698, w: 30, h: 71 },
  { x: 1028, y: 406, w: 24, h: 56 },
  { x: 894, y: 356, w: 23, h: 57 },
  { x: 1058, y: 351, w: 22, h: 56 },
  { x: 1168, y: 358, w: 22, h: 46 },
  { x: 1143, y: 424, w: 23, h: 34 },
  { x: 1292, y: 426, w: 27, h: 39 },
  { x: 1272, y: 360, w: 24, h: 50 },
  { x: 1375, y: 339, w: 27, h: 305 },
  { x: 722, y: 133, w: 33, h: 75 },
  { x: 2, y: 902, w: 134, h: 228 },
  { x: 391, y: 693, w: 37, h: 60 },
  { x: 234, y: 383, w: 22, h: 51 },
  { x: 178, y: 403, w: 26, h: 54 },
  { x: 162, y: 299, w: 33, h: 97 },
  { x: 114, y: 228, w: 22, h: 66 },
  { x: 104, y: 142, w: 28, h: 46 },
  { x: 372, y: 87, w: 28, h: 62 },
  { x: 335, y: 66, w: 74, h: 43 },
  { x: 333, y: 158, w: 23, h: 56 },
  { x: 382, y: 214, w: 30, h: 60 },
  { x: 436, y: 253, w: 28, h: 55 },
  { x: 706, y: 67, w: 80, h: 75 },
  { x: 862, y: 66, w: 42, h: 53 },
  { x: 1263, y: 72, w: 141, h: 211 },
  { x: 1348, y: 285, w: 32, h: 45 },
  { x: 479, y: 184, w: 33, h: 25 },
  { x: 496, y: 210, w: 26, h: 20 },
  { x: 606, y: 206, w: 28, h: 22 },
  { x: 630, y: 183, w: 20, h: 32 },
  { x: 552, y: 156, w: 24, h: 24 },
  { x: 528, y: 108, w: 35, h: 29 },
  { x: 226, y: 482, w: 72, h: 74 },
  { x: 230, y: 562, w: 31, h: 38 },
  { x: 196, y: 518, w: 38, h: 44 },
  { x: 459, y: 773, w: 39, h: 39 },
  { x: 492, y: 792, w: 30, h: 25 },
  { x: 207, y: 928, w: 50, h: 61 },
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

const WALK_DURATION_MS = 1800;

export class ForestMapScene extends Phaser.Scene {
  private currentIndex = 0;
  private personaHandle: PersonaHandle | null = null;
  private isAnimating = false;
  private checkpointNodes: Phaser.GameObjects.Arc[] = [];
  /** Village-parity: ONE moving boss walks the whole map, retreating
   *  between CPs. Its identity swaps to the roster entry for the CP it
   *  currently guards so combat name/family/taunt lookups stay correct. */
  private movingBoss: MovingBossHandle | null = null;
  private superBoss: MovingBossHandle | null = null;
  private superBossHpBar: BossHpBar | null = null;
  private superBossRevealed = false;
  private todController: TimeOfDayController | null = null;
  private vfxController: AmbientVFXController | null = null;
  private _corruption: CorruptionOverlay | null = null;
  private _lastCheckpointStates: CheckpointState[] = [];

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
    // Village-parity: pull every available anim clip for each Stage 2
    // boss via the shared helper. Missing clips fall back through
    // hurt→idle / attack→idle at play time.
    for (const boss of getStageMiniBosses(2)) loadBossAssets(this, 2, boss);
    const superBoss = getStageSuperBoss(2);
    if (superBoss) loadBossAssets(this, 2, superBoss);
  }

  create(): void {
    // 1. Painted background
    this.add.image(0, 0, "forest-composite").setOrigin(0, 0).setDepth(0);

    // 1b. In-scene corruption tint (color + pattern). Painted between
    // the map (depth 0) and sprites (persona/boss/CP disc >=50) so it
    // never washes the character sprites. Driven by CORRUPTION_STATE
    // events from map/world/page.tsx; auto-cleans on scene shutdown.
    attachCorruptionMapTintWithBridge(this, {
      profile: null,
      opacity: 0,
      mapWidth: MAP_WIDTH,
      mapHeight: MAP_HEIGHT,
      spriteDepth: 50,
    });

    // 2. Camera
    const cam = this.cameras.main;
    cam.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    cam.setZoom(getResponsiveZoom());
    const start = CHECKPOINTS[this.currentIndex];
    cam.centerOn(start.x, start.y);

    // 3. Drag-to-pan — DISABLED while zone-editor is active so the
    // left-click-drag can be used to draw rectangles without the map
    // scrolling underneath. Editor still allows right-click-drag pan.
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

    // 4. Keyboard arrow keys / WASD — pan the camera. Suppressed while
    //    the zone editor is active because editorTestWalk hijacks the
    //    same keys to move the persona for live blocker testing.
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

    // 5b. Corruption overlay — one tile-strip per CP-to-CP segment.
    // Implements Ibhaveda_boss_corruption_table spec: strips start at
    // full opacity, fade to ~10% when their owning CP hits 2/3 tasks,
    // and to 0% + shatter burst at 3/3. `applyCorruptionState` is
    // called from React whenever the CP data changes.
    // Corruption overlay DISABLED per product ask ("remove the
    // corruption mechanism for now WHATEVER U HAVE ADDED"). The
    // CorruptionOverlay class stays on disk; we just don't
    // instantiate it. `this._corruption` stays null and every
    // `this._corruption?.…` callsite silently no-ops.
    this._corruption = null;

    // 5c. Walkability debug overlay — ?showZones=1 in URL renders the
    // BLOCKED_ZONES rectangles in red so they can be tuned visually.
    // (Forest currently uses camera-pan movement, not free-roam WASD —
    // zones are stored for when free-roam gets enabled on this scene.)
    try {
      const showZones =
        typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).get("showZones") === "1";
      if (showZones) {
        void pointInAnyBlockedZone; // silence tree-shake / unused-warn
        const g = this.add.graphics();
        g.setDepth(50);
        g.fillStyle(0xff0000, 0.35);
        g.lineStyle(2, 0xff2222, 1);
        BLOCKED_ZONES.forEach((z) => {
          g.fillRect(z.x, z.y, z.w, z.h);
          g.strokeRect(z.x, z.y, z.w, z.h);
        });
      }
    } catch { /* URL parse fail — skip */ }

    // 5d. In-map zone editor — enabled via ?editZones=1. Same tool as
    // Village. Draws cyan rectangles + shows HUD in top-right. Custom
    // zones are also added to the live block-check via _customZonesGetter
    // so they'll take effect the moment Forest gets free-roam wiring.
    const editor = attachZoneEditor(this, "forest");
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

    // 6. Register persona + boss anims (must be AFTER loader completes).
    registerPersonaAnimations(this, getCurrentPersonaId());
    for (const b of getStageMiniBosses(2)) registerBossAnimations(this, 2, b);
    const sb = getStageSuperBoss(2);
    if (sb) registerBossAnimations(this, 2, sb);

    // 7. Character + shadow
    this.spawnCharacter();

    // 8. ONE moving boss (Village-parity moving-boss model)
    this.spawnMovingBoss();

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

  /**
   * Village-parity: ONE moving boss on the map. Its `boss` identity
   * swaps to the roster entry for whichever CP it currently guards, so
   * combat lookups always see the correct name/family/taunt copy.
   */
  private spawnMovingBoss(): void {
    const bosses = getStageMiniBosses(2);
    if (bosses.length === 0) return;
    const first = bosses[Math.min(this.currentIndex, bosses.length - 1)];
    const cp = CHECKPOINTS[this.currentIndex];
    if (!cp) return;
    this.movingBoss = spawnMovingBoss(this, 2, first, cp, { showHpBar: false });
    this.movingBoss.cpIndex = this.currentIndex;
    this.movingBoss.sprite.setFlipX(true); // face the persona (left of boss)
  }

  /** Public — React calls this on task submit to drop the active boss HP. */
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

  /** Back-compat: some external systems (attachEditorTestWalk) grab
   *  `this.character` directly. Alias to the persona handle's sprite. */
  private get character(): Phaser.GameObjects.Sprite | null {
    return this.personaHandle?.sprite ?? null;
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
      // Village-parity: dissolve the moving boss (dies at final CP)
      // then reveal the stage super-boss (Forest Colossus).
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

    // Move both the boss and the persona to the next CP in parallel.
    if (this.movingBoss) {
      if (this.movingBoss.hpBar) this.movingBoss.hpBar.setHp(1);
      const bosses = getStageMiniBosses(2);
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

  /**
   * Reveal the Forest Colossus super-boss via the shared helper (pan +
   * scale-in + HP bar) + persona victory pose. Fires
   * SUPER_BOSS_ENCOUNTER for React to open the combat panel.
   */
  private revealSuperBoss(): void {
    if (this.superBossRevealed) return;
    this.superBossRevealed = true;
    const superBoss = getStageSuperBoss(2);
    if (!superBoss) return;
    const cp4 = CHECKPOINTS[CHECKPOINTS.length - 1];
    const superX = cp4.x + 240;
    const superY = cp4.y - 40;

    if (this.personaHandle) {
      playPersonaVictoryPose(this, this.personaHandle, superX);
    }

    this.superBoss = revealSuperBossHelper(this, 2, superBoss, { x: superX, y: superY }, {
      panDurationMs: 1400,
    });
    this.superBossHpBar = this.superBoss.hpBar;

    this.time.delayedCall(2200, () => {
      eventBridge.dispatchToReact({
        type: "SUPER_BOSS_ENCOUNTER",
        stage: 2,
        bossSlug: superBoss.name,
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
    if (this.superBoss) {
      dissolveBoss(this, this.superBoss, {
        onComplete: () => {
          eventBridge.dispatchToReact({
            type: "STAGE_COMPLETE",
            stage: 2,
            nextStage: 3,
          });
        },
      });
    } else {
      eventBridge.dispatchToReact({
        type: "STAGE_COMPLETE",
        stage: 2,
        nextStage: 3,
      });
    }
  }

  public getCurrentIndex(): number {
    return this.currentIndex;
  }

  public setCurrentIndex(i: number): void {
    this.currentIndex = Phaser.Math.Clamp(i, 0, CHECKPOINTS.length - 1);
    const cp = CHECKPOINTS[this.currentIndex];
    this.cameras.main.centerOn(cp.x, cp.y);
    if (this.personaHandle) {
      this.personaHandle.sprite.setPosition(
        cp.x + CHAR_X_OFFSET,
        cp.y + CHAR_Y_OFFSET,
      );
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
