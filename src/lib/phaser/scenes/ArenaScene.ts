/**
 * @file ArenaScene.ts
 * @description Stage 3 (Validation · The Arena) map scene.
 *  Mirrors Forest/Harbor/Artisans structure.  Arena bosses are live:
 *  Judge of False Precedent (CP0) · Masked Challenger (CP1) · Oracle
 *  of Doubt (CP2) · Advocate of Comfortable Lies (super).  Sprites
 *  ship under /assets/bosses/arena/*.  Roster in stage-bosses.ts
 *  STAGE_3_ARENA; this scene reads them via getStageMiniBosses(3) /
 *  getStageSuperBoss(3) with no per-CP wiring.
 *
 *  Setting: The Arena — a small-town amphitheatre where assumptions
 *  go on public trial.  Emotional register: ceremonial, high-stakes.
 *
 *  Registered under scene key "ArenaScene" and started via
 *  `game.scene.start("ArenaScene")` when the user progresses from
 *  Stage 2 (Forest) or navigates to ?stage=3.
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

const MAP_ASSET = "/assets/maps-v2/arena/arena-map.png";
const MAP_WIDTH = 2624;
const MAP_HEIGHT = 1630;

// Arena walkability blockers — authored via the in-map editor
// (?editZones=1). Rectangles are in map-image pixel coords (2624×1630).
const BLOCKED_ZONES: readonly { x: number; y: number; w: number; h: number }[] = [];

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
// Village-parity: persona spawns TOP-LEFT of the CP marker so it doesn't
// overlap the boss (which sits at spriteXOffset=0 on the disc). See
// VillageMapScene.ts:330-331 for the origin of these values.
const CHAR_X_OFFSET = -60;
const CHAR_Y_OFFSET = -45;

/**
 * The Arena has 4 CPs per venture spec (Validation stage).
 *
 * Narrative arc:
 *   CP1 The Naming Post   — assumptions dragged into public light
 *   CP2 The Sand          — trial method chosen, arena floor prepared
 *   CP3 The Judges' Bench — validation trial run under witness
 *   CP4 The Verdict Pillar — evidence-based decision declared
 *
 * Positions placed on visible ground tiles in the composited map so
 * the character sprite lands on sand/path, not on stone walls or the
 * arcane portal.
 */
interface Checkpoint {
  index: number;
  x: number;
  y: number;
  label: string;
}
const CHECKPOINTS: readonly Checkpoint[] = [
  { index: 0, x: 280,  y: 600,  label: "The Naming Post" },     // left angel-statue entrance
  { index: 1, x: 1300, y: 800,  label: "The Sand" },            // center of the arena floor
  { index: 2, x: 1950, y: 420,  label: "The Judges' Bench" },   // top-right raised platform
  { index: 3, x: 2280, y: 1150, label: "The Verdict Pillar" },  // bottom-right mystical portal
];

// BOSS_OFFSETS retained for backwards-reference; the moving-boss model
// uses per-boss spriteScale/spriteXOffset/spriteYOffset from
// stage-bosses.ts instead of this table.
const _BOSS_OFFSETS_LEGACY: readonly { x: number; y: number; scale: number }[] = [
  { x: 105, y: -30, scale: 1.5 },
];
void _BOSS_OFFSETS_LEGACY;

const WALK_DURATION_MS = 1800;

export class ArenaScene extends Phaser.Scene {
  private currentIndex = 0;
  private personaHandle: PersonaHandle | null = null;
  private isAnimating = false;
  private checkpointNodes: Phaser.GameObjects.Arc[] = [];
  /** Village-parity: ONE moving boss walks the whole map, retreating
   *  east/west on advance until it dies at the final CP. */
  private movingBoss: MovingBossHandle | null = null;
  private superBoss: MovingBossHandle | null = null;
  private superBossHpBar: BossHpBar | null = null;
  private superBossRevealed = false;
  private todController: TimeOfDayController | null = null;
  private vfxController: AmbientVFXController | null = null;
  private _corruption: CorruptionOverlay | null = null;
  private _lastCheckpointStates: CheckpointState[] = [];

  constructor() {
    super({ key: "ArenaScene" });
  }

  init(data: { startIndex?: number }): void {
    if (typeof data?.startIndex === "number") {
      this.currentIndex = Math.max(0, Math.min(CHECKPOINTS.length - 1, data.startIndex));
    }
  }

  preload(): void {
    this.load.image("arena-composite", MAP_ASSET);
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
    // Village-parity: pull EVERY available clip (idle/attack/hurt/
    // defeat/victory) for each Stage-3 boss via the shared helper.
    // Missing clips are silently skipped and the state machine falls
    // back through hurt→idle / attack→idle at play time.
    for (const boss of getStageMiniBosses(3)) {
      loadBossAssets(this, 3, boss);
    }
    const superBoss = getStageSuperBoss(3);
    if (superBoss) loadBossAssets(this, 3, superBoss);
  }

  create(): void {
    this.add.image(0, 0, "arena-composite").setOrigin(0, 0).setDepth(0);

    const cam = this.cameras.main;
    cam.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    cam.setZoom(getResponsiveZoom());
    const start = CHECKPOINTS[this.currentIndex];
    cam.centerOn(start.x, start.y);

    // Drag-to-pan — DISABLED while zone-editor is active so left-click
    // drag can draw rectangles without the map scrolling underneath.
    // Right-click-drag still pans inside the editor.
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

    // Register persona + boss animations (must happen AFTER loader
    // finishes, i.e. in create(), not preload()). Idempotent.
    registerPersonaAnimations(this, getCurrentPersonaId());
    for (const b of getStageMiniBosses(3)) registerBossAnimations(this, 3, b);
    const sb = getStageSuperBoss(3);
    if (sb) registerBossAnimations(this, 3, sb);

    this.spawnCharacter();
    this.spawnMovingBoss();
    // Arena biome doesn't have its own TOD/VFX palette entry yet.  Use
    // the artisan palette temporarily since it reads warm-lit against
    // sandy floors and torch-lined walls.  Swap to a dedicated "arena"
    // palette when the sound + weather pass reaches this biome.
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

    // In-map zone editor — enabled via ?editZones=1. Zones persist in
    // localStorage under "ibhaveda-zones-arena" (scene-scoped).
    const editor = attachZoneEditor(this, "arena");
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

  /**
   * Village-parity spawn: ONE moving boss lives on the map. The FIRST
   * roster entry is the "walking boss" that retreats between CPs; the
   * remaining roster entries provide names + intro lines for combat
   * lookups but no sprite. When we `advanceToNextCheckpoint`, we
   * `retreatBossTo` the next CP AND swap the moving boss's identity to
   * the next roster entry (so name/intro/family line up with the CP the
   * player is now fighting at).
   */
  private spawnMovingBoss(): void {
    const bosses = getStageMiniBosses(3);
    if (bosses.length === 0) return;
    const first = bosses[0];
    const cp = CHECKPOINTS[this.currentIndex];
    if (!cp) return;
    this.movingBoss = spawnMovingBoss(this, 3, first, cp, {
      showHpBar: false,
    });
    this.movingBoss.cpIndex = this.currentIndex;
    // Face the character (persona spawns at CP top-left → left of boss)
    this.movingBoss.sprite.setFlipX(true);
  }

  public weakenActiveBoss(tasksDone: number, total: number = 3): void {
    if (this.movingBoss?.hpBar) {
      this.movingBoss.hpBar.setHp(Math.max(0, 1 - tasksDone / total));
    }
    // Play a "hurt" flash on the boss + "attack" on the persona to sell
    // the task completion as a combat hit. Idempotent — helper guards
    // busy state so rapid-fire clicks don't stomp on the animation.
    if (this.movingBoss) {
      playBossState(this, this.movingBoss, "hurt");
    }
    if (this.personaHandle) {
      playPersonaState(this, this.personaHandle, "attack");
    }
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
    // Village-parity spawn via shared helper — respects extended
    // Pixellab personas + falls back to the legacy fantasy sheet for
    // any persona that hasn't been re-generated yet.
    this.personaHandle = spawnPersonaCharacter(this, active, {
      legacyIdleKey: "village-persona-idle",
      legacyWalkKey: "village-persona-walk",
      xOffset: CHAR_X_OFFSET,
      yOffset: CHAR_Y_OFFSET,
    });
  }

  /** Compat accessor for other systems (e.g. attachEditorTestWalk) that
   *  still expect a `character` sprite reference. */
  private get character(): Phaser.GameObjects.Sprite | null {
    return this.personaHandle?.sprite ?? null;
  }

  private onCheckpointClicked(cp: Checkpoint): void {
    eventBridge.dispatchToReact({
      type: "CHECKPOINT_CLICKED",
      checkpointId: `arena-cp-${cp.index}`,
      stage: 3,
      checkpoint: cp.index + 1,
    });
  }

  public advanceToNextCheckpoint(): void {
    if (this.isAnimating) return;
    if (this.currentIndex >= CHECKPOINTS.length - 1) {
      // Village-parity: on the final CP, DISSOLVE the moving boss
      // (it "dies" at the last checkpoint per product spec), then
      // reveal the super boss so combat can begin.
      if (!this.superBossRevealed) {
        const superBoss = getStageSuperBoss(3);
        if (superBoss) {
          if (this.movingBoss) {
            dissolveBoss(this, this.movingBoss, {
              onComplete: () => this.revealSuperBoss(),
            });
          } else {
            this.revealSuperBoss();
          }
          return;
        }
      }
      eventBridge.dispatchToReact({
        type: "STAGE_COMPLETE",
        stage: 3,
        nextStage: 4,
      });
      return;
    }
    this.isAnimating = true;
    const clearedCp = CHECKPOINTS[this.currentIndex];
    if (clearedCp) playCpClearBurst(this, clearedCp.x, clearedCp.y, "standard");
    this.currentIndex += 1;
    const to = CHECKPOINTS[this.currentIndex];

    // Village-parity: retreat the moving boss to the next CP first,
    // then walk the character behind it. Both animations run in
    // parallel so the map feels alive rather than sequential.
    if (this.movingBoss) {
      // Refresh HP bar for the new "encounter" (next boss's fight)
      if (this.movingBoss.hpBar) this.movingBoss.hpBar.setHp(1);
      // Swap the boss identity to the roster entry for the new CP so
      // combat lookups pull the correct name/family/taunt copy.
      const bosses = getStageMiniBosses(3);
      const nextBossDef = bosses[this.currentIndex] ?? bosses[bosses.length - 1];
      if (nextBossDef) {
        this.movingBoss.boss = nextBossDef;
      }
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
   * Reveal the stage-3 super boss (Advocate of Comfortable Lies).
   * Delegates to the shared helper which does the rise/scale/pan
   * choreography AND the persona victory pose that Village uses.
   */
  private revealSuperBoss(): void {
    if (this.superBossRevealed) return;
    this.superBossRevealed = true;
    const superBoss = getStageSuperBoss(3);
    if (!superBoss) return;
    const cp4 = CHECKPOINTS[CHECKPOINTS.length - 1];
    const superX = cp4.x + 180;
    const superY = cp4.y - 40;

    // Persona reacts (gold aura + hop + victory pose) — Village parity
    if (this.personaHandle) {
      playPersonaVictoryPose(this, this.personaHandle, superX);
    }

    this.superBoss = revealSuperBossHelper(this, 3, superBoss, { x: superX, y: superY }, {
      panDurationMs: 1400,
    });
    this.superBossHpBar = this.superBoss.hpBar;

    this.time.delayedCall(2200, () => {
      eventBridge.dispatchToReact({
        type: "SUPER_BOSS_ENCOUNTER",
        stage: 3,
        bossSlug: superBoss.name,
      });
    });
  }

  /** Called by React after super-boss CombatPanel is won. */
  public defeatSuperBoss(): void {
    if (!this.superBossRevealed) {
      eventBridge.dispatchToReact({
        type: "STAGE_COMPLETE",
        stage: 3,
        nextStage: 4,
      });
      return;
    }
    if (this.superBoss) {
      dissolveBoss(this, this.superBoss, {
        onComplete: () => {
          eventBridge.dispatchToReact({
            type: "STAGE_COMPLETE",
            stage: 3,
            nextStage: 4,
          });
        },
      });
    } else {
      eventBridge.dispatchToReact({
        type: "STAGE_COMPLETE",
        stage: 3,
        nextStage: 4,
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
