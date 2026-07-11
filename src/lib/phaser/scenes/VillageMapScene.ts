/**
 * VillageMapScene — quest-progression map (character-less version)
 * ----------------------------------------------------------------
 * Design:
 *   - No character on the map (will be added when user provides sprites).
 *   - 4 checkpoints painted onto the composite village PNG.
 *   - Checkpoint states:
 *       completed  = small green disc with ✓
 *       active     = gold pulsing disc with number
 *       locked     = grey disc with 🔒
 *   - User drags the map to explore.
 *   - Clicking the ACTIVE checkpoint fires CHECKPOINT_CLICKED.
 *   - React calls scene.advanceToNextCheckpoint() when task completes →
 *     camera pans to next CP + state updates.
 *
 * Public API:
 *   scene.getCurrentIndex()          → number  (0..3)
 *   scene.advanceToNextCheckpoint()  → void    (pans camera + advances)
 *   scene.setCurrentIndex(i)         → void    (jump without animation)
 *
 * Events emitted:
 *   CHECKPOINT_CLICKED  { id, title, x, y }
 *   CHECKPOINT_REACHED  { id, title }
 *   VILLAGE_COMPLETE    { }
 */

import * as Phaser from "phaser";
import { eventBridge } from "../utils/event-bridge";
import { audioManager } from "@/lib/audio/audioManager";
import {
  dispelBoss,
  revealBoss,
  weakenBoss,
  bossFaceTarget,
  startTauntLoop,
  startAmbientTendrils,
  addAuraRing,
  showBossTaunt,
  addBossHpBar,
  tagBossFamily,
  retreatBoss,
  type BossFamily,
  type BossHpBar,
} from "../animations/bossAnimator";
import { CompassCalibrationAnimation } from "./animations/CompassCalibrationAnimation";
import { MiniGameSpawnPoint } from "../entities/MiniGameSpawnPoint";
import { spawnsForStage } from "@convex/miniGameConstants";

const MAP_ASSET = "/assets/maps-v2/village-painted/village-map.png";
// Sahit's pixel-art character spritesheets — 160×192 with 32×48 frames
// arranged as 5 cols × 4 rows (rows = down/left/right/up, cols = anim frames).
const CHAR_IDLE_ASSET = "/assets/fan-tasy/Character_Idle.webp";
const CHAR_WALK_ASSET = "/assets/fan-tasy/Character_Walk.webp";
const CHAR_FRAME_W = 32;
const CHAR_FRAME_H = 48;

// ── Village bosses — PixelLab-generated painted sprites ─────────────────
// Each boss frame is 92×92 (Quadruped/humanoid model export).
const BOSS_FRAME = 92;
const FOG_IDLE_ASSET = "/assets/bosses/village/fog/idle.png";
const FOG_RUN_ASSET = "/assets/bosses/village/fog/running.png"; // 6 frames
const FOG_ATTACK_ASSET = "/assets/bosses/village/fog/attack.png"; // 6 frames
const WRAITH_IDLE_ASSET = "/assets/bosses/village/wraith/idle.png";
const WRAITH_WALK_ASSET = "/assets/bosses/village/wraith/walk.png"; // 8 frames
const UNRAVELLER_IDLE_ASSET = "/assets/bosses/village/unraveller/idle.png";
// CP2 + CP3 dedicated sprites — Specter (4-armed shadowy humanoid) reaches
// for every customer segment; Automaton (mechanical golem) endlessly stamps
// out new features. Static rotations only, no animation frames yet.
const CHIMERA_IDLE_ASSET = "/assets/bosses/village/chimera/idle.png";
const AUTOMATON_IDLE_ASSET = "/assets/bosses/village/automaton/idle.png";

/** Per-checkpoint mini-boss assignments (Village = Stage 1). */
interface VillageBossDef {
  /** Which checkpoint index (0-based) this boss guards. */
  checkpointIndex: number;
  /** Boss display name (matches Convex config). */
  name: string;
  /** Family drives dispel/aura VFX palettes in bossAnimator. */
  family: BossFamily;
  /** Sprite-sheet texture keys. */
  idleKey: string;
  loopKey: string | null; // walk/run animation, null = still image
  loopFrameCount: number;
  /** Optional attack animation (played via taunt loop). */
  attackKey: string | null;
  attackFrameCount: number;
  /** Boss size scale — bigger for stage-final, smaller for early. */
  scale: number;
  /** Y offset from checkpoint marker (negative = above the marker). */
  yOffset: number;
  /** X offset from checkpoint marker (positive = east, negative = west).
   *  Bosses stand LATERALLY adjacent to the CP rather than on top of it,
   *  so the persona standing on the marker doesn't overlap them. */
  offsetX: number;
  /** Taunt lines shown periodically. */
  taunts: readonly string[];
}

const VILLAGE_MINI_BOSSES: readonly VillageBossDef[] = [
  {
    checkpointIndex: 0,
    name: "Fog of Vagueness",
    family: "mist",
    idleKey: "boss-fog-idle",
    loopKey: "boss-fog-run",
    loopFrameCount: 6,
    attackKey: "boss-fog-attack",
    attackFrameCount: 6,
    scale: 2.2,
    yOffset: -30,
    offsetX: 105, // east of CP1 — persona stands on marker facing east

    taunts: [
      "Your idea has no edges...",
      "Who is it for? Anyone? Everyone?",
      "Vague dreams die vague deaths.",
    ],
  },
  {
    // CP2 — 4-armed Specter: reaches for every customer segment at once.
    // "Building for everyone" trap embodied. No walk anim yet, but the bob
    // + aura + tendrils sell the vibe.
    checkpointIndex: 1,
    name: "Everyone Chimera",
    family: "undead",
    idleKey: "boss-chimera-idle",
    loopKey: null,
    loopFrameCount: 0,
    attackKey: null,
    attackFrameCount: 0,
    scale: 2.2,
    yOffset: -30,
    offsetX: -110, // west of CP2 (path bends east so guardian sits west)

    taunts: [
      "One arm for gamers, one for parents...",
      "You'll build for everyone?",
      "That means no one at all.",
      "Pick a direction. I dare you.",
    ],
  },
  {
    // CP3 — Feature Automaton: mechanical golem that endlessly stamps out
    // new features. Renamed from "Feature Hydra" since automaton fits the
    // mechanical / factory metaphor better than a snake-hydra.
    checkpointIndex: 2,
    name: "Feature Automaton",
    family: "machine",
    idleKey: "boss-automaton-idle",
    loopKey: null,
    loopFrameCount: 0,
    attackKey: null,
    attackFrameCount: 0,
    scale: 2.2,
    yOffset: -30,
    offsetX: 105, // east of CP3

    taunts: [
      "Add one more feature. Just one.",
      "Building. Always building.",
      "The MVP grows every day.",
      "One more toggle. One more.",
    ],
  },
  {
    checkpointIndex: 3,
    name: "Assumption Wraith",
    family: "undead",
    idleKey: "boss-wraith-idle",
    loopKey: "boss-wraith-walk",
    loopFrameCount: 8,
    attackKey: null,
    attackFrameCount: 0,
    scale: 2.3,
    yOffset: -30,
    offsetX: -105, // west of CP4 — Unraveller lives east so Wraith guards west approach

    taunts: [
      "You assume they'll pay.",
      "You assume they'll care.",
      "Prove it.",
    ],
  },
];

/** Village super-boss — appears at east edge with progressive reveal. */
const UNRAVELLER_POS = { x: 1480, y: 512 };

/** Weather variant driven by the time-of-day cycle. */
type WeatherVariant = "clear" | "mist" | "rain" | "dense_mist";

/** Time-of-day cycle phases. Colors + alpha lerp between adjacent phases
 *  every TOD_PHASE_MS to give the village a living day/night cycle. Each
 *  phase also carries a weather variant so the village feels responsive
 *  to the hour. */
interface TimeOfDayPhase {
  name: string;
  color: number; // RGB hex
  alpha: number; // Overlay opacity
  weather: WeatherVariant;
}
const TOD_PHASES: readonly TimeOfDayPhase[] = [
  { name: "dawn", color: 0xffb887, alpha: 0.18, weather: "rain" },
  { name: "noon", color: 0xffffff, alpha: 0.02, weather: "clear" },
  { name: "dusk", color: 0xff7a3a, alpha: 0.28, weather: "mist" },
  { name: "night", color: 0x1a2c5c, alpha: 0.42, weather: "dense_mist" },
];
const TOD_PHASE_MS = 20_000; // 20s per phase → 80s full cycle
const TOD_FADE_MS = 3_000; // Crossfade duration between phases

const MAP_WIDTH = 1536;
const MAP_HEIGHT = 1024;
// Scale factor for the 32×48 pixel-art sprite. At 2.4x the character
// shows as ~77×115 world pixels — visible on both mobile (0.7x zoom
// gives ~54px on screen) and desktop (1.4x zoom = 107px on screen).
const CHAR_SCALE = 2.4;
// Character stands ON the checkpoint marker — origin is bottom-center
// so feet land exactly on the marker's y position. No offset needed.
// +18 so the persona's feet land visually ON the marker disc rather than
// at its geometric center (marker is drawn with radius ~30 from cp.y).
const CHAR_Y_OFFSET = 18;

interface CheckpointDef {
  id: number;
  x: number;
  y: number;
  title: string;
}

interface CheckpointVisual {
  def: CheckpointDef;
  glow: Phaser.GameObjects.Arc;
  overlay: Phaser.GameObjects.Arc; // dims the painted number when locked/completed
  stateBadge: Phaser.GameObjects.Text; // ✓ or 🔒 stamped over the number
  hitZone: Phaser.GameObjects.Zone;
  glowTween?: Phaser.Tweens.Tween;
  /** Three orbiting stars — 12/4/8 o'clock — that light up amber as tasks
   *  land on this checkpoint. Represent the 3 tasks (T1/T2/T3). */
  taskStars: Phaser.GameObjects.Arc[];
  /** Halo behind each star that grows + glows when filled. */
  taskStarHalos: Phaser.GameObjects.Arc[];
}

// Coordinates auto-detected from composite PNG using TWO independent
// methods that agreed: (1) dark disc center-of-mass + gold ring check
// at r=24, (2) light number-text pixel center-of-mass on dark
// surround. Both methods returned identical (x, y) — precise centers
// of the painted 1/2/3/4 markers.
const CHECKPOINTS: readonly CheckpointDef[] = [
  { id: 1, x: 173, y: 215, title: "The Signboard" },
  { id: 2, x: 587, y: 633, title: "The Bridge" },
  { id: 3, x: 1177, y: 662, title: "The Barn" },
  { id: 4, x: 1304, y: 325, title: "The Well" },
];

export class VillageMapScene extends Phaser.Scene {
  private currentIndex = 0;
  private visuals: CheckpointVisual[] = [];
  private isAnimating = false;
  private character: Phaser.GameObjects.Sprite | null = null;
  private characterShadow: Phaser.GameObjects.Ellipse | null = null;
  private characterIdleTween: Phaser.Tweens.Tween | null = null;

  // Per-checkpoint mini-boss sprites (one Phaser.Sprite per checkpoint).
  private miniBossSprites: Array<Phaser.GameObjects.Sprite | null> = [];
  private miniBossBobTweens: Array<Phaser.Tweens.Tween | null> = [];
  // Per-boss ambient VFX handles so we can stop them on dispel.
  private miniBossTendrilStoppers: Array<(() => void) | null> = [];
  private miniBossTauntStoppers: Array<(() => void) | null> = [];
  private miniBossHpBars: Array<BossHpBar | null> = [];
  private miniBossAuras: Array<Phaser.GameObjects.Ellipse | null> = [];
  // Track which checkpoints have already had their reveal-taunt fired.
  private miniBossTauntFired: boolean[] = [];
  // Super boss (The Unraveller).
  private superBossSprite: Phaser.GameObjects.Sprite | null = null;
  private superBossBobTween: Phaser.Tweens.Tween | null = null;
  private superBossTendrilStopper: (() => void) | null = null;
  private superBossRevealed = false;

  // Village ambient VFX emitter handles (for shutdown cleanup)
  private ambientEmitters: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
  private ambientTimers: Phaser.Time.TimerEvent[] = [];

  // Time-of-day tint overlay (cycles dawn → noon → dusk → night)
  private todOverlay: Phaser.GameObjects.Rectangle | null = null;
  // Start at NOON (index 1) — neutral white tint at alpha 0.02 so the map
  // renders in its true painted colors. Dusk (orange) was giving demo
  // viewers the impression the map was "loading wrong".
  private todPhaseIndex = 1;
  private todTimer: Phaser.Time.TimerEvent | null = null;

  // Next-stage preview (fired from React after celebration overlay closes)
  private previewStageHandler: ((e: { stage: number }) => void) | null = null;
  private previewObjects: Phaser.GameObjects.GameObject[] = [];

  // Mini-game spawn points on the map (discoverable easter-eggs).
  private miniGameSpawns: MiniGameSpawnPoint[] = [];

  // Weather layer — synced to time-of-day phase.
  private currentWeather: WeatherVariant = "clear";
  private rainEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null =
    null;
  private mistObjects: Phaser.GameObjects.Ellipse[] = [];
  private mistTweens: Phaser.Tweens.Tween[] = [];

  constructor() {
    super({ key: "VillageMapScene" });
  }

  preload(): void {
    this.load.image("village-composite", MAP_ASSET);
    // ── Boss textures ─────────────────────────────────────────────────────
    // Fog of Vagueness — idle (single frame) + running loop (6 frames).
    this.load.image("boss-fog-idle", FOG_IDLE_ASSET);
    this.load.spritesheet("boss-fog-run", FOG_RUN_ASSET, {
      frameWidth: BOSS_FRAME,
      frameHeight: BOSS_FRAME,
    });
    this.load.spritesheet("boss-fog-attack", FOG_ATTACK_ASSET, {
      frameWidth: BOSS_FRAME,
      frameHeight: BOSS_FRAME,
    });
    // Assumption Wraith — idle + walk loop (8 frames).
    this.load.image("boss-wraith-idle", WRAITH_IDLE_ASSET);
    this.load.spritesheet("boss-wraith-walk", WRAITH_WALK_ASSET, {
      frameWidth: BOSS_FRAME,
      frameHeight: BOSS_FRAME,
    });
    // The Unraveller — static rotation (no anim frames available yet).
    this.load.image("boss-unraveller-idle", UNRAVELLER_IDLE_ASSET);
    // CP2 Everyone Chimera (Specter — 4-armed) and CP3 Feature Automaton.
    // Static rotations only for now — bob + aura + tendrils + face-flip
    // give them life without needing walk frames.
    this.load.image("boss-chimera-idle", CHIMERA_IDLE_ASSET);
    this.load.image("boss-automaton-idle", AUTOMATON_IDLE_ASSET);
    // Persona spritesheets ────────────────────────────────────────────────
    this.load.spritesheet("village-persona-idle", CHAR_IDLE_ASSET, {
      frameWidth: CHAR_FRAME_W,
      frameHeight: CHAR_FRAME_H,
    });
    this.load.spritesheet("village-persona-walk", CHAR_WALK_ASSET, {
      frameWidth: CHAR_FRAME_W,
      frameHeight: CHAR_FRAME_H,
    });
  }

  create(): void {
    // 1. Painted village background
    this.add.image(0, 0, "village-composite").setOrigin(0, 0).setDepth(0);

    // 2. Camera — centered on first checkpoint, drag-to-pan.
    // Adaptive zoom by viewport width so mobile shows more of the map.
    // Desktop stays untouched at 1.4x.
    const cam = this.cameras.main;
    cam.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    const vw =
      typeof window !== "undefined"
        ? window.innerWidth
        : this.scale.width || 1920;
    let initialZoom: number;
    if (vw < 480) {
      initialZoom = 0.7; // small phones — show most of the map width
    } else if (vw < 768) {
      initialZoom = 0.9; // large phones
    } else if (vw < 1024) {
      initialZoom = 1.15; // tablets
    } else {
      initialZoom = 1.4; // desktop — untouched (same as before)
    }
    cam.setZoom(initialZoom);
    const start = CHECKPOINTS[0];
    cam.centerOn(start.x, start.y);

    // 3. Drag-to-pan (works for mouse + touch on mobile via Phaser's
    // pointer abstraction).
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let downX = 0;
    let downY = 0;
    let dragDistance = 0;
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      dragging = true;
      lastX = p.x;
      lastY = p.y;
      downX = p.x;
      downY = p.y;
      dragDistance = 0;
    });
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (!dragging) return;
      const dx = p.x - lastX;
      const dy = p.y - lastY;
      dragDistance += Math.abs(dx) + Math.abs(dy);
      cam.scrollX -= dx / cam.zoom;
      cam.scrollY -= dy / cam.zoom;
      lastX = p.x;
      lastY = p.y;
    });
    this.input.on("pointerup", () => {
      dragging = false;
    });

    // 3b. Keyboard arrow keys — pan the camera. Users on desktop naturally
    //     reach for arrow keys to explore a top-down map, so we hook them
    //     up in addition to drag-to-pan. `WASD` also works as a bonus.
    const KEY_PAN_SPEED = 12; // world px per frame at zoom=1
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

    // 4. Checkpoints
    for (const cp of CHECKPOINTS) {
      this.visuals.push(this.buildCheckpoint(cp));
    }
    this.refreshCheckpointStates();

    // 5. Character sprite at active checkpoint. Sits just below the
    // painted checkpoint marker with a gentle idle bob so the map feels
    // alive.
    this.spawnCharacter();

    // 6. Mini-boss sprites — one hovers over each checkpoint that isn't
    // yet cleared. Dispelled with a fade-out when its CP is completed.
    this.spawnMiniBosses();

    // 7. Super boss silhouette (The Unraveller) at the east edge of the
    // village, starts nearly invisible and reveals with corruption %.
    this.spawnSuperBoss();

    // 7b. Village ambient VFX — fireflies drifting across the map,
    // chimney smoke rising from painted houses, occasional leaves.
    this.spawnAmbientVFX();

    // 7c. Time-of-day tint overlay — dawn → noon → dusk → night cycle.
    // Adds mood without any assets. Starts at dusk for demo vibe.
    this.spawnTimeOfDayCycle();

    // 7d. Mini-game spawns — discoverable easter-eggs the user can click
    //     to trigger a mini-game. Replaces the sidebar Mini Games button.
    //     Reads from the shared Convex config so the same spawn list can
    //     be used across scenes + level definitions.
    this.spawnMiniGamePoints();

    // 8. Notify React that the scene is ready. The /map/world page.tsx
    // waits for this event before hiding the "Entering the world..."
    // loading screen. Without it, the page hangs on the loader.
    eventBridge.dispatchToReact({ type: "PHASER_READY" });

    // 9. React → Phaser: after the "Stage 1 Complete" overlay closes we
    //    pan east to preview the next biome.
    this.previewStageHandler = (e: { stage: number }) => {
      this.previewNextStage(e.stage);
    };
    eventBridge.onPhaser("PREVIEW_NEXT_STAGE", this.previewStageHandler);
  }

  // ─────────────────────────────────────────────────────────────────────
  // Boss spawn / management
  // ─────────────────────────────────────────────────────────────────────

  private spawnMiniBosses(): void {
    // Boss continuity flow (per product spec): each CP's boss is visible
    // ONLY when the persona is on that CP. Cleared CPs stay hidden,
    // future CPs stay hidden until reached. This keeps the map from
    // feeling cluttered and reinforces "this boss is your current
    // obstacle". Visibility is enforced in refreshMiniBossVisibility.
    for (const def of VILLAGE_MINI_BOSSES) {
      const cp = CHECKPOINTS[def.checkpointIndex];
      if (!cp || !this.textures.exists(def.idleKey)) {
        this.miniBossSprites.push(null);
        this.miniBossBobTweens.push(null);
        this.miniBossTendrilStoppers.push(null);
        this.miniBossTauntStoppers.push(null);
        this.miniBossHpBars.push(null);
        this.miniBossAuras.push(null);
        this.miniBossTauntFired.push(false);
        continue;
      }

      const useLoop =
        def.loopKey !== null && this.textures.exists(def.loopKey);
      const textureKey = useLoop ? def.loopKey! : def.idleKey;
      // Boss stands LATERALLY adjacent to CP marker so the persona standing
      // on the marker doesn't visually overlap them.
      const sprite = this.add.sprite(
        cp.x + def.offsetX,
        cp.y + def.yOffset,
        textureKey,
      );
      sprite.setOrigin(0.5, 1); // Bottom-center so boss's feet touch ground
      sprite.setScale(def.scale);
      sprite.setDepth(60);
      // Face the character (opposite of offsetX direction)
      sprite.setFlipX(def.offsetX > 0 ? true : false);
      tagBossFamily(sprite, def.family);

      // Contrast anchor — a wide, soft dark ellipse behind the sprite so
      // pale-palette bosses (Fog, Chimera) don't disappear against grass.
      // Sized 1.15x sprite width, tall enough to sit "behind" the whole
      // silhouette, dark navy at low alpha. Reads as body-shadow / aura.
      const anchorW = sprite.displayWidth * 1.15;
      const anchorH = sprite.displayHeight * 1.35;
      const anchor = this.add.ellipse(
        sprite.x,
        sprite.y - sprite.displayHeight * 0.5,
        anchorW,
        anchorH,
        0x0a0a1a,
        0.28,
      );
      anchor.setDepth(sprite.depth - 3);
      // Follow the sprite as it bobs (per-frame so no lag)
      this.time.addEvent({
        delay: 16,
        loop: true,
        callback: () => {
          if (!sprite.active) return;
          anchor.setPosition(sprite.x, sprite.y - sprite.displayHeight * 0.5);
          anchor.setVisible(sprite.visible);
        },
      });

      // HD pixel-art crisp filter
      const tex = sprite.texture;
      if (tex && "setFilter" in tex) {
        (tex as unknown as { setFilter: (f: number) => void }).setFilter(
          Phaser.Textures.FilterMode.NEAREST,
        );
      }

      // Register idle-loop anim
      let idleAnimKey: string | null = null;
      if (useLoop) {
        idleAnimKey = `${def.loopKey!}-loop`;
        if (!this.anims.exists(idleAnimKey)) {
          this.anims.create({
            key: idleAnimKey,
            frames: this.anims.generateFrameNumbers(def.loopKey!, {
              start: 0,
              end: def.loopFrameCount - 1,
            }),
            frameRate: 6,
            repeat: -1,
          });
        }
        sprite.play(idleAnimKey);
      }

      // Register attack anim if available
      let attackAnimKey: string | null = null;
      if (def.attackKey && this.textures.exists(def.attackKey)) {
        attackAnimKey = `${def.attackKey}-attack`;
        if (!this.anims.exists(attackAnimKey)) {
          this.anims.create({
            key: attackAnimKey,
            frames: this.anims.generateFrameNumbers(def.attackKey, {
              start: 0,
              end: def.attackFrameCount - 1,
            }),
            frameRate: 8,
            repeat: 0,
          });
        }
      }

      // Bob tween — kept subtle (3px) so the HP bar / aura / tendril
      // followers (see bossAnimator) don't visibly lag behind the sprite.
      const bob = this.tweens.add({
        targets: sprite,
        y: sprite.y - 3,
        duration: 2200 + def.checkpointIndex * 120,
        ease: "Sine.easeInOut",
        yoyo: true,
        repeat: -1,
      });

      // P1 #7 — ambient tendrils
      const tendrilStop = startAmbientTendrils(this, sprite, def.family);
      // P1 #8 — aura ring
      const aura = addAuraRing(this, sprite, def.family);
      // P2 #10 — HP bar (with boss name chip)
      const hpBar = addBossHpBar(this, sprite, 1, def.name);

      // P1 #6 — taunt loop (only if attack anim exists)
      let tauntStop: (() => void) | null = null;
      if (idleAnimKey && attackAnimKey) {
        tauntStop = startTauntLoop(this, sprite, idleAnimKey, attackAnimKey, 8000);
      }

      this.miniBossSprites.push(sprite);
      this.miniBossBobTweens.push(bob);
      this.miniBossTendrilStoppers.push(tendrilStop);
      this.miniBossTauntStoppers.push(tauntStop);
      this.miniBossHpBars.push(hpBar);
      this.miniBossAuras.push(aura);
      this.miniBossTauntFired.push(false);
    }
    this.refreshMiniBossVisibility();
    // Show the first boss's taunt on scene start after a short beat
    this.time.delayedCall(1200, () => this.maybeShowActiveBossTaunt());
  }

  private spawnSuperBoss(): void {
    // TEMPORARY: super-boss hidden for demo.
    if (VillageMapScene.HIDE_BOSSES) return;
    if (!this.textures.exists("boss-unraveller-idle")) return;
    const sprite = this.add.sprite(
      UNRAVELLER_POS.x,
      UNRAVELLER_POS.y,
      "boss-unraveller-idle",
    );
    sprite.setOrigin(0.5, 0.5);
    sprite.setScale(1.6);
    sprite.setDepth(55);
    sprite.setAlpha(0.12);
    sprite.setTint(0x1a0033);
    tagBossFamily(sprite, "serpent");

    const tex = sprite.texture;
    if (tex && "setFilter" in tex) {
      (tex as unknown as { setFilter: (f: number) => void }).setFilter(
        Phaser.Textures.FilterMode.NEAREST,
      );
    }

    this.superBossBobTween = this.tweens.add({
      targets: sprite,
      y: sprite.y - 12,
      duration: 3200,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });
    this.superBossSprite = sprite;

    // P1 #7 — ambient tendril VFX for the super boss (drives the "presence"
    // even at low alpha).
    this.superBossTendrilStopper = startAmbientTendrils(this, sprite, "serpent");
  }

  /**
   * Hide/show mini-bosses based on which checkpoints are already cleared.
   * Called after refreshCheckpointStates() so it reflects the latest.
   */
  private refreshMiniBossVisibility(): void {
    for (let i = 0; i < VILLAGE_MINI_BOSSES.length; i++) {
      const sprite = this.miniBossSprites[i];
      if (!sprite) continue;
      // Only show the boss at the CURRENT checkpoint. Cleared bosses
      // stay hidden (they've been defeated), and future bosses stay
      // hidden until the persona reaches them. Keeps the map focused
      // on "this is the obstacle in front of you right now".
      const isActive = i === this.currentIndex;
      sprite.setVisible(isActive);
      // Hide the boss's aura + HP bar in lockstep so the map is clean
      // for cleared/future checkpoints.
      const aura = this.miniBossAuras[i];
      if (aura) aura.setVisible(isActive);
      const hpBar = this.miniBossHpBars[i];
      if (hpBar) hpBar.setVisible(isActive);
    }
    // Super Boss (Unraveller) — kept hidden for now per demo constraint.
    // The updateSuperBossReveal is still called so the code path stays
    // exercised; if the super boss sprite is present it will update alpha.
    this.updateSuperBossReveal();
  }

  private updateSuperBossReveal(): void {
    if (!this.superBossSprite) return;
    const total = CHECKPOINTS.length;
    const progress = Math.min(1, this.currentIndex / total);
    // 0% cleared → 12% alpha, 100% cleared → 88% alpha
    const alpha = 0.12 + progress * 0.76;
    this.superBossSprite.setAlpha(alpha);
    // Also fade out the tint (silhouette → real color) as progress climbs.
    const tintR = Math.floor(0x1a + (0xff - 0x1a) * progress);
    const tintG = Math.floor(0x00 + (0xff - 0x00) * progress);
    const tintB = Math.floor(0x33 + (0xff - 0x33) * progress);
    this.superBossSprite.setTint((tintR << 16) | (tintG << 8) | tintB);
  }

  /**
   * Dispel a mini-boss using the bossAnimator's family-specific particle
   * burst. Called from advanceToNextCheckpoint() before the camera pans.
   */
  private dispelMiniBoss(index: number): void {
    const sprite = this.miniBossSprites[index];
    if (!sprite) return;

    // Stop all ambient VFX for this boss
    const bob = this.miniBossBobTweens[index];
    if (bob) bob.stop();
    const tendrils = this.miniBossTendrilStoppers[index];
    if (tendrils) tendrils();
    this.miniBossTendrilStoppers[index] = null;
    const taunt = this.miniBossTauntStoppers[index];
    if (taunt) taunt();
    this.miniBossTauntStoppers[index] = null;
    const hpBar = this.miniBossHpBars[index];
    if (hpBar) hpBar.destroy();
    this.miniBossHpBars[index] = null;
    const aura = this.miniBossAuras[index];
    if (aura) aura.destroy();
    this.miniBossAuras[index] = null;

    // Fire dispel VFX (family-specific particle burst + sprite puff + fade)
    const def = VILLAGE_MINI_BOSSES[index];
    const family: BossFamily = def?.family ?? "mist";
    // Dispel WHOOSH — use goldGain as a stand-in until we source a
    // dedicated whoosh SFX. Short pop that syncs well with the particle burst.
    try { audioManager.playGoldGain(); } catch { /* audio not critical */ }
    void dispelBoss(this, sprite, family);
  }

  /**
   * Show the active checkpoint's boss taunt (once per boss). Public so React
   * can call it on task open, checkpoint arrival, etc.
   */
  private maybeShowActiveBossTaunt(): void {
    const idx = this.currentIndex;
    const sprite = this.miniBossSprites[idx];
    const def = VILLAGE_MINI_BOSSES[idx];
    if (!sprite || !sprite.visible || !def) return;
    if (this.miniBossTauntFired[idx]) return;
    if (def.taunts.length === 0) return;
    const line = def.taunts[Math.floor(Math.random() * def.taunts.length)];
    showBossTaunt(this, sprite, line, 3600);
    this.miniBossTauntFired[idx] = true;
  }

  /**
   * P0 #4 — visually weaken the active checkpoint's mini-boss as tasks
   * complete. Called from React on task submission. tasksDone in [0..3].
   * Also updates the HP bar AND lights up the corresponding task-fill
   * star on the checkpoint marker.
   */
  public weakenActiveBoss(tasksDone: number, tasksTotal: number = 3): void {
    const idx = this.currentIndex;
    const sprite = this.miniBossSprites[idx];
    if (sprite && sprite.visible) {
      weakenBoss(this, sprite, tasksDone, tasksTotal);
      const hp = this.miniBossHpBars[idx];
      if (hp) hp.setHp(1 - tasksDone / tasksTotal);
      // Bosses face the player character while taking damage.
      if (this.character) bossFaceTarget(sprite, this.character.x);
    }
    // Fill the task-progress stars on the checkpoint marker regardless of
    // whether the boss is visible.
    this.setCheckpointTaskFill(idx, tasksDone);
    // Subtle confirm click on each hit so the user feels the damage land.
    try { audioManager.playUI("confirm"); } catch { /* audio not critical */ }
  }

  /**
   * Light up task-fill stars (0..3) on a given checkpoint marker. Called
   * both from weakenActiveBoss and directly by React so we stay in sync
   * even if the boss is hidden or dispelled.
   */
  public setCheckpointTaskFill(cpIndex: number, tasksDone: number): void {
    const vis = this.visuals[cpIndex];
    if (!vis) return;
    const clamped = Math.max(0, Math.min(vis.taskStars.length, tasksDone));
    for (let i = 0; i < vis.taskStars.length; i++) {
      const star = vis.taskStars[i];
      const halo = vis.taskStarHalos[i];
      const isFilled = i < clamped;
      // Colour + halo tween — brighter amber, larger halo when filled.
      const toColor = isFilled ? 0xffc36a : 0x505050;
      const toAlpha = isFilled ? 1 : 0.85;
      const toRadius = isFilled ? 10 : 8;
      this.tweens.add({
        targets: star,
        radius: toRadius,
        alpha: toAlpha,
        duration: 220,
        ease: "Back.easeOut",
      });
      star.fillColor = toColor;
      // Filled stars also get a warm border matching the fill.
      if (isFilled) {
        star.setStrokeStyle(2, 0x7a4a10, 1);
      } else {
        star.setStrokeStyle(2, 0x1a1a1a, 1);
      }
      this.tweens.add({
        targets: halo,
        alpha: isFilled ? 0.65 : 0,
        radius: isFilled ? 22 : 16,
        duration: 260,
      });
      // Pop-in kick when a star newly fills
      if (isFilled) {
        this.tweens.add({
          targets: star,
          scale: 1.6,
          duration: 130,
          yoyo: true,
          ease: "Sine.easeInOut",
        });
      }
    }
  }

  /**
   * P0 #3 — fully reveal The Unraveller and shake the world. Called when
   * the last checkpoint is cleared.
   */
  private async fullRevealSuperBoss(): Promise<void> {
    const sprite = this.superBossSprite;
    if (!sprite || this.superBossRevealed) return;
    this.superBossRevealed = true;
    if (this.superBossBobTween) this.superBossBobTween.stop();

    // Ensure sprite is at least somewhat visible before the pan starts
    sprite.setAlpha(Math.max(sprite.alpha, 0.4));
    // Swap to the Unraveller's own music track for the reveal moment.
    // stage_village fades under boss_unraveller so the pan/shake lands
    // with a new sonic identity.
    try {
      audioManager.playMusic("boss_unraveller", 0.55);
    } catch { /* audio not critical */ }

    // Fire the persona's heroic victory pose in parallel with the reveal.
    // Delayed slightly (~200ms) so the pan is already underway when the
    // character reacts to the Unraveller — cinematic beat.
    this.time.delayedCall(200, () => this.playPersonaVictoryPose());

    await revealBoss(this, sprite, {
      panDurationMs: 900,
      shakeIntensity: 0.011,
    });
    // Ominous line
    showBossTaunt(this, sprite, "So you've unraveled the vagueness. Come find me.", 4000);
    // Resume bob at new state
    this.superBossBobTween = this.tweens.add({
      targets: sprite,
      y: sprite.y - 14,
      duration: 2800,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });
  }

  /**
   * Persona reacts to the Unraveller reveal — face east, jump, gold aura
   * burst, defiant taunt. No new sprite frames needed. Uses the same
   * showBossTaunt bubble style for consistency.
   */
  private playPersonaVictoryPose(): void {
    const char = this.character;
    if (!char) return;

    // 1) Face east — walk sheet faces right by default, so unflip.
    char.setFlipX(false);

    // 2) Gold particle burst around the character (heroic aura).
    if (this.textures.exists("__bossPx")) {
      const auraEmitter = this.add.particles(char.x, char.y - 24, "__bossPx", {
        speed: { min: 60, max: 120 },
        angle: { min: 0, max: 360 },
        gravityY: -30,
        lifespan: 900,
        scale: { start: 1.4, end: 0 },
        alpha: { start: 0.9, end: 0 },
        tint: [0xffe066, 0xffd93b, 0xfffbe0],
        blendMode: Phaser.BlendModes.ADD,
      });
      auraEmitter.setDepth(char.depth + 1);
      auraEmitter.explode(24);
      this.time.delayedCall(1200, () => auraEmitter.destroy());
    }

    // 3) Vertical hop + scale-up kick — resolves quickly so we don't
    //    fight the Unraveller taunt bubble that lands ~1s after this.
    const startY = char.y;
    const startScale = char.scaleX; // uniform scale
    this.tweens.add({
      targets: char,
      y: startY - 60,
      duration: 260,
      ease: "Back.easeOut",
      yoyo: true,
      onYoyo: () => {
        // Land — small scale kick and settle
        this.tweens.add({
          targets: char,
          scale: startScale * 1.15,
          duration: 90,
          yoyo: true,
          ease: "Sine.easeInOut",
        });
      },
    });

    // 4) Brief flash tint to gold on the character during the peak of the hop
    char.setTintFill(0xffd93b);
    this.time.delayedCall(180, () => char.clearTint());

    // 5) Defiant speech bubble — ~600ms after the hop starts so it lands
    //    while the pose settles and BEFORE the Unraveller's taunt at ~900ms.
    this.time.delayedCall(600, () => {
      if (!this.character) return;
      showBossTaunt(this, this.character, "I see you now. Come at me.", 2600);
    });

    // 6) Bonus: play a confirm chime as an audio beat for the pose
    try {
      audioManager.playUI("confirm");
    } catch { /* audio not critical */ }
  }

  // ─────────────────────────────────────────────────────────────────────
  // Village ambient VFX — brings the map alive with fireflies drifting
  // over checkpoints, chimney smoke rising from painted houses, and an
  // occasional wind-blown leaf sweeping east. All procedural — no assets
  // required beyond the shared __ambientPx texture we generate here.
  // ─────────────────────────────────────────────────────────────────────

  private spawnAmbientVFX(): void {
    // TEMPORARY: ambient VFX hidden for demo — no fireflies, no chimney
    // smoke, no drifting leaves. Restore by removing the early return.
    if (VillageMapScene.HIDE_BOSSES) return;
    // Generate a soft 6×6 circle texture used by all three ambient layers.
    if (!this.textures.exists("__ambientPx")) {
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(3, 3, 3);
      g.generateTexture("__ambientPx", 6, 6);
      g.destroy();
    }

    // 1) FIREFLIES — soft glowing yellow dots that drift up + wiggle,
    //    alpha pulses so they look like they blink.
    //    Density biased toward checkpoint positions so the CPs feel alive.
    const fireflyEmitter = this.add.particles(0, 0, "__ambientPx", {
      x: { min: 0, max: MAP_WIDTH },
      y: { min: 100, max: MAP_HEIGHT - 100 },
      // Slow floaty drift — slight upward, slight random wiggle
      speedY: { min: -14, max: -4 },
      speedX: { min: -8, max: 8 },
      lifespan: { min: 5000, max: 8000 },
      scale: { start: 1.4, end: 2.4 },
      // Pulse alpha for the "blink" feel
      alpha: {
        start: 0.15,
        end: 0.85,
        ease: "Sine.easeInOut",
      },
      tint: [0xfff2a8, 0xffe066, 0xffd93b],
      frequency: 320, // spawn one every 320ms → ~24 concurrent at 8s lifespan
      blendMode: Phaser.BlendModes.ADD,
    });
    fireflyEmitter.setDepth(15); // above map (0), below character (60)
    this.ambientEmitters.push(fireflyEmitter);

    // Extra firefly clusters — one per checkpoint for concentrated glow.
    for (const cp of CHECKPOINTS) {
      const cluster = this.add.particles(cp.x, cp.y, "__ambientPx", {
        x: { min: -60, max: 60 },
        y: { min: -60, max: 60 },
        speedY: { min: -10, max: -2 },
        speedX: { min: -6, max: 6 },
        lifespan: { min: 3500, max: 5500 },
        scale: { start: 1.2, end: 2.0 },
        alpha: { start: 0.2, end: 0.7, ease: "Sine.easeInOut" },
        tint: 0xffd93b,
        frequency: 480,
        blendMode: Phaser.BlendModes.ADD,
      });
      cluster.setDepth(16);
      this.ambientEmitters.push(cluster);
    }

    // 2) CHIMNEY SMOKE — rising gray-white puffs from painted houses.
    //    Coordinates picked to sit above visible house-roof chimneys in
    //    the composite village PNG.
    const chimneys: Array<{ x: number; y: number }> = [
      { x: 1220, y: 235 }, // large house east of CP4
      { x: 1425, y: 260 }, // barn area / far east
      { x: 320, y: 190 },  // small house near CP1
    ];
    for (const c of chimneys) {
      const smoke = this.add.particles(c.x, c.y, "__ambientPx", {
        speedY: { min: -22, max: -12 },
        speedX: { min: -8, max: 8 },
        lifespan: { min: 3200, max: 4800 },
        scale: { start: 1.2, end: 5.5 },
        alpha: { start: 0.32, end: 0 },
        tint: [0xdedede, 0xc0c0c0, 0xb8b8b8],
        frequency: 550, // slow puffs, chimney vibe
        blendMode: Phaser.BlendModes.NORMAL,
      });
      smoke.setDepth(20);
      this.ambientEmitters.push(smoke);
    }

    // 3) DRIFTING LEAVES — occasional wind-blown leaves sweep east.
    //    Not a continuous emitter — bursts every 6-8s so it's sparse
    //    and doesn't overwhelm.
    const leafBurst = () => {
      const y = Phaser.Math.Between(150, MAP_HEIGHT - 200);
      const emitter = this.add.particles(-40, y, "__ambientPx", {
        speedX: { min: 40, max: 90 },
        speedY: { min: -6, max: 12 },
        lifespan: 12000,
        scale: { start: 1.6, end: 1.2 },
        alpha: { start: 0.65, end: 0 },
        tint: [0x8fbf5c, 0xa89250, 0xc7a76a, 0x6f8f3f],
        rotate: { min: 0, max: 360 },
        quantity: 1,
        blendMode: Phaser.BlendModes.NORMAL,
      });
      emitter.setDepth(18);
      // One-shot burst of 3-5 leaves
      emitter.explode(Phaser.Math.Between(3, 5));
      // Destroy the emitter after leaves finish their journey
      this.time.delayedCall(12500, () => emitter.destroy());
    };
    const leafTimer = this.time.addEvent({
      delay: Phaser.Math.Between(6000, 8000),
      loop: true,
      callback: () => {
        leafBurst();
        // Randomise next interval slightly for organic feel
        leafTimer.delay = Phaser.Math.Between(6000, 8500);
      },
    });
    this.ambientTimers.push(leafTimer);
    // Fire one immediately so the effect is visible on entry
    leafBurst();
  }

  // ─────────────────────────────────────────────────────────────────────
  // Time-of-day tint cycle — a soft full-map overlay that lerps between
  // dawn / noon / dusk / night colors on a timer. Starts at DUSK for the
  // demo so fireflies pop against a warm orange sky right on entry.
  // ─────────────────────────────────────────────────────────────────────

  private spawnTimeOfDayCycle(): void {
    const start = TOD_PHASES[this.todPhaseIndex];
    // Full-map rectangle at depth 8 → above map (0), below fireflies (15).
    // Origin (0,0) so the whole map is covered. scrollFactor default 1 so
    // it moves with the camera.
    this.todOverlay = this.add.rectangle(
      MAP_WIDTH / 2,
      MAP_HEIGHT / 2,
      MAP_WIDTH,
      MAP_HEIGHT,
      start.color,
      start.alpha,
    );
    this.todOverlay.setDepth(8);
    this.todOverlay.setBlendMode(Phaser.BlendModes.MULTIPLY);

    // Initial weather matches the starting TOD phase (default: dusk mist).
    this.setWeather(start.weather);

    // Kick off the phase timer — every TOD_PHASE_MS advance one phase.
    this.todTimer = this.time.addEvent({
      delay: TOD_PHASE_MS,
      loop: true,
      callback: () => this.advanceTimeOfDay(),
    });
    this.ambientTimers.push(this.todTimer);
  }

  private advanceTimeOfDay(): void {
    if (!this.todOverlay) return;
    this.todPhaseIndex = (this.todPhaseIndex + 1) % TOD_PHASES.length;
    const next = TOD_PHASES[this.todPhaseIndex];

    // Swap weather in sync — a slight delay so the color transition
    // registers first, then the new weather rolls in.
    if (next.weather !== this.currentWeather) {
      this.time.delayedCall(TOD_FADE_MS / 3, () => this.setWeather(next.weather));
    }

    // Lerp fillColor via a fake tween target — Phaser's Rectangle doesn't
    // support tweening fillColor directly, so we animate a proxy `{ t: 0..1 }`
    // and update fillColor + fillAlpha on each frame.
    const fromColor = this.todOverlay.fillColor;
    const fromAlpha = this.todOverlay.fillAlpha;
    const proxy = { t: 0 };
    this.tweens.add({
      targets: proxy,
      t: 1,
      duration: TOD_FADE_MS,
      ease: "Sine.easeInOut",
      onUpdate: () => {
        if (!this.todOverlay) return;
        this.todOverlay.fillColor = Phaser.Display.Color.Interpolate.ColorWithColor(
          Phaser.Display.Color.IntegerToColor(fromColor),
          Phaser.Display.Color.IntegerToColor(next.color),
          100,
          Math.floor(proxy.t * 100),
        ).color;
        this.todOverlay.fillAlpha = Phaser.Math.Linear(
          fromAlpha,
          next.alpha,
          proxy.t,
        );
      },
    });
  }

  // ─────────────────────────────────────────────────────────────────────
  // Weather layer — mist (dusk / night) and rain (dawn).
  // Rendered from Phaser primitives only — no new assets. The layer sits
  // above the map (depth 10) but below the character (100) and boss
  // sprites, so it reads as atmosphere rather than obstruction.
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Transition weather to the requested variant. Fades out any current
   * weather elements over ~800ms, then spawns the new variant's assets
   * with a matching fade-in.
   *
   * Public so external systems (tests, future stage transitions) can
   * force a weather variant, though normal usage is via TOD sync.
   */
  public setWeather(variant: WeatherVariant): void {
    if (variant === this.currentWeather) return;
    const prev = this.currentWeather;
    this.currentWeather = variant;

    // 1. Fade out the previous weather.
    if (prev === "rain" && this.rainEmitter) {
      const emitter = this.rainEmitter;
      this.rainEmitter = null;
      this.tweens.add({
        targets: emitter,
        alpha: 0,
        duration: 800,
        onComplete: () => {
          emitter.stop();
          emitter.destroy();
        },
      });
    }
    if (prev === "mist" || prev === "dense_mist") {
      const mistToKill = this.mistObjects.slice();
      const tweensToKill = this.mistTweens.slice();
      this.mistObjects = [];
      this.mistTweens = [];
      for (const t of tweensToKill) {
        try {
          t.stop();
        } catch {
          /* already killed */
        }
      }
      this.tweens.add({
        targets: mistToKill,
        alpha: 0,
        duration: 800,
        onComplete: () => {
          for (const m of mistToKill) m.destroy();
        },
      });
    }

    // 2. Spawn the new weather.
    if (variant === "rain") {
      this.spawnRain();
    } else if (variant === "mist") {
      this.spawnMist(8, 0.18);
    } else if (variant === "dense_mist") {
      this.spawnMist(12, 0.32);
    }
    // "clear" spawns nothing — the weakest atmospheric state.
  }

  /**
   * Vertical rain streaks falling across the full map with a slight
   * rightward wind slant. Uses the shared "__bossPx" 6×6 white texture
   * (already generated by bossAnimator) so no asset preload is needed.
   *
   * Falls back to a rectangle spawner if __bossPx is missing (defensive).
   */
  private spawnRain(): void {
    if (!this.textures.exists("__bossPx")) return;
    this.rainEmitter = this.add.particles(MAP_WIDTH / 2, -20, "__bossPx", {
      x: { min: 0, max: MAP_WIDTH },
      y: -20,
      speedY: { min: 480, max: 620 },
      speedX: { min: 40, max: 90 }, // slight wind slant
      lifespan: { min: 1800, max: 2400 },
      scaleX: 0.35, // stretch into a streak
      scaleY: 2.4,
      alpha: { start: 0, end: 0.55 },
      tint: [0x8ba6c9, 0xa5bfe0, 0xbcc9d6],
      blendMode: Phaser.BlendModes.SCREEN,
      frequency: 24, // roughly 42 particles/sec
    });
    this.rainEmitter.setDepth(10);
    this.rainEmitter.setAlpha(0);
    this.tweens.add({
      targets: this.rainEmitter,
      alpha: 1,
      duration: 900,
      ease: "Sine.easeIn",
    });
  }

  /**
   * Slow horizontal drifting ellipses hugging the ground — reads as low
   * fog / mist. Larger + more numerous for dense_mist.
   *
   * @param count number of mist blobs to spawn
   * @param baseAlpha peak alpha per blob
   */
  private spawnMist(count: number, baseAlpha: number): void {
    for (let i = 0; i < count; i++) {
      const startX = Phaser.Math.Between(-100, MAP_WIDTH + 100);
      // Concentrate near the ground line (y=700-950) — mist rolls low.
      const y = Phaser.Math.Between(680, 960);
      const width = Phaser.Math.Between(220, 380);
      const height = Phaser.Math.Between(60, 100);
      // Slightly cool bone-white → misty blue-gray
      const tints = [0xc5d4de, 0xd7dfe4, 0xb8c6d0];
      const tint = tints[i % tints.length];

      const blob = this.add
        .ellipse(startX, y, width, height, tint, baseAlpha)
        .setDepth(11)
        .setBlendMode(Phaser.BlendModes.SCREEN)
        .setAlpha(0);
      this.mistObjects.push(blob);

      // Fade in
      this.tweens.add({
        targets: blob,
        alpha: baseAlpha,
        duration: 1200,
        delay: (i % 4) * 150,
        ease: "Sine.easeOut",
      });

      // Long horizontal drift — wraps around the map. Direction alternates
      // per index so blobs don't all move in lockstep.
      const dir = i % 2 === 0 ? 1 : -1;
      const distance = MAP_WIDTH + 200;
      const duration = Phaser.Math.Between(28_000, 42_000);
      const tween = this.tweens.add({
        targets: blob,
        x: `+=${dir * distance}`,
        duration,
        repeat: -1,
        onRepeat: () => {
          // Reset to opposite side so the drift loops seamlessly.
          blob.x = dir > 0 ? -100 : MAP_WIDTH + 100;
        },
      });
      this.mistTweens.push(tween);
    }
  }

  /**
   * P2 #12 — retreat a boss eastward (toward the Unraveller). Used when
   * we want a boss to feel like it's fleeing, not just dying.
   */
  public retreatBossEast(index: number): void {
    const sprite = this.miniBossSprites[index];
    if (!sprite) return;
    void retreatBoss(this, sprite, UNRAVELLER_POS.x, 1100);
  }

  private spawnCharacter(): void {
    const active = CHECKPOINTS[this.currentIndex];
    if (!active) return;
    if (!this.textures.exists("village-persona-idle")) return;

    // HD pixel-art: force NEAREST filter on both spritesheets so the
    // 32×48 pixel art stays crisp when scaled instead of blurring
    // through linear interpolation.
    this.textures
      .get("village-persona-idle")
      .setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.textures
      .get("village-persona-walk")
      .setFilter(Phaser.Textures.FilterMode.NEAREST);

    // Register subtle idle + walk animations once (guard re-mount)
    if (!this.anims.exists("persona-idle")) {
      this.anims.create({
        key: "persona-idle",
        // Row 0 = facing down, very slow subtle breath (2 frames only)
        frames: this.anims.generateFrameNumbers("village-persona-idle", {
          start: 0,
          end: 1,
        }),
        frameRate: 2, // slow — feels stable, not jittery
        repeat: -1,
      });
    }
    if (!this.anims.exists("persona-walk")) {
      this.anims.create({
        key: "persona-walk",
        // Row 2 = facing right, 5-frame walk cycle
        frames: this.anims.generateFrameNumbers("village-persona-walk", {
          start: 10,
          end: 14,
        }),
        frameRate: 10,
        repeat: -1,
      });
    }

    // Persistent soft ground shadow so the character feels planted on the
    // marker instead of floating. Sits BELOW the character sprite depth so
    // it renders under their feet.
    this.characterShadow = this.add.ellipse(
      active.x,
      active.y + CHAR_Y_OFFSET + 4,
      54,
      14,
      0x000000,
      0.42,
    );
    this.characterShadow.setDepth(95); // just under character (100)

    this.character = this.add.sprite(
      active.x,
      active.y + CHAR_Y_OFFSET,
      "village-persona-idle",
    );
    // Bottom-center origin so setPosition(cp.x, cp.y) lands the character's
    // feet EXACTLY on the checkpoint marker — no offset math needed.
    this.character.setOrigin(0.5, 1);
    this.character.setScale(CHAR_SCALE);
    this.character.setDepth(100); // above painted map + checkpoint marker
    this.character.play("persona-idle");

    // Follow-loop: shadow tracks character X but stays at ground Y so it
    // doesn't bob with the sprite. Reads as a stable planted shadow.
    const groundY = active.y + CHAR_Y_OFFSET + 4;
    this.time.addEvent({
      delay: 60,
      loop: true,
      callback: () => {
        if (!this.character || !this.characterShadow) return;
        this.characterShadow.setPosition(this.character.x, groundY);
      },
    });
  }

  // ─── Public API ─────────────────────────────────────────

  public getCurrentIndex(): number {
    return this.currentIndex;
  }

  /** Medium-speed walk between adjacent checkpoints — 1800ms feels like a
   *  short journey rather than a teleport. */
  private static readonly WALK_DURATION_MS = 1800;

  /** TEMPORARY: hide all boss visuals (mini + super) so we can finalise the
   *  tutorial + CP progression flow with the client before polishing bosses.
   *  Flip to `false` to restore boss rendering.  */
  private static readonly HIDE_BOSSES = true;

  public setCurrentIndex(i: number): void {
    const prev = this.currentIndex;
    this.currentIndex = Phaser.Math.Clamp(i, 0, CHECKPOINTS.length - 1);
    this.refreshCheckpointStates();
    this.refreshMiniBossVisibility();
    const cp = CHECKPOINTS[this.currentIndex];
    this.cameras.main.centerOn(cp.x, cp.y);
    // If we're jumping by exactly one checkpoint (e.g. React state sync),
    // walk the character. Larger jumps (initial mount, URL param dive to
    // CP4) → teleport since a long walk mid-load would look janky.
    if (!this.character) return;
    if (Math.abs(this.currentIndex - prev) === 1) {
      this.walkCharacterTo(cp.x, cp.y + CHAR_Y_OFFSET);
    } else {
      this.character.setPosition(cp.x, cp.y + CHAR_Y_OFFSET);
    }
  }

  /**
   * Play the walk cycle while tweening the character sprite to (x, y).
   * Handles direction facing, animation swap, arrival cleanup. Idempotent —
   * safe to call while another walk is in progress (Phaser cancels the
   * conflicting tween).
   */
  private walkCharacterTo(x: number, y: number): void {
    const char = this.character;
    if (!char) return;
    // Face direction of travel — walk sheet frames face right by default,
    // so flip when moving left.
    char.setFlipX(x < char.x);
    char.play("persona-walk");
    this.tweens.add({
      targets: char,
      x,
      y,
      duration: VillageMapScene.WALK_DURATION_MS,
      ease: "Sine.easeInOut",
      onComplete: () => {
        char.setFlipX(false); // face down again on arrival
        char.play("persona-idle");
        // Small beat then run the "inspect" gesture on the checkpoint
        // the character just arrived at (nearest to their current pos).
        this.time.delayedCall(180, () => this.playInteractGesture());
      },
    });
  }

  /**
   * "Inspecting the site" gesture the persona plays on arrival at an
   * active checkpoint. Adds character depth — the persona looks like a
   * detective sizing up the corruption rather than a mannequin.
   *
   * Composition (~1.6s end-to-end):
   *   0     ─ persona crouches (scaleY 1 → 0.92) with a tiny -3px yOffset
   *   140   ─ persona pops back up + tiny scale-kick to 1.04
   *   0     ─ "?" thought bubble fades in above their head
   *   0     ─ 3 concentric gold reticle rings pulse outward from the CP
   *   900   ─ thought bubble drifts up + fades
   *   1200  ─ everything cleared
   *   audio ─ subtle UI "hover" chime on rings peak
   *
   * Idempotent — silently skips if there's no character or the current CP
   * is out of range.
   */
  private playInteractGesture(): void {
    // TEMPORARY: disabled for demo. The crouch yoyo tween was leaving the
    // character at slightly wrong Y between gestures, making them look
    // like they were drifting off the marker. Re-enable when we bring
    // bosses back and want the "hero inspects site" beat.
    if (VillageMapScene.HIDE_BOSSES) return;
    const char = this.character;
    if (!char) return;
    const cp = CHECKPOINTS[this.currentIndex];
    if (!cp) return;

    // 1. Crouch + bounce back — quick 260ms hop-in-place.
    const baseY = char.y;
    this.tweens.add({
      targets: char,
      scaleY: char.scaleY * 0.92,
      y: baseY - 3,
      duration: 140,
      ease: "Sine.easeIn",
      yoyo: true,
      onYoyo: () => {
        // On the return leg, brief scale kick then settle.
        this.tweens.add({
          targets: char,
          scaleY: char.scaleY * 1.04,
          duration: 90,
          yoyo: true,
          ease: "Sine.easeInOut",
        });
      },
    });

    // 2. Face the checkpoint marker if it's laterally offset (>4px)
    if (Math.abs(cp.x - char.x) > 4) {
      char.setFlipX(cp.x < char.x);
      this.time.delayedCall(1400, () => char?.setFlipX(false));
    }

    // 3. Three concentric gold reticle rings expanding from the CP.
    // Tween scale (not radius) — cheaper and works on every Phaser version.
    for (let i = 0; i < 3; i++) {
      const ring = this.add
        .circle(cp.x, cp.y, 20, 0x000000, 0)
        .setStrokeStyle(2, 0xffc36a, 0.9)
        .setDepth(char.depth - 1)
        .setScale(0.4);
      this.tweens.add({
        targets: ring,
        scale: 3.0,
        alpha: 0,
        duration: 900,
        delay: i * 180,
        ease: "Sine.easeOut",
        onComplete: () => ring.destroy(),
      });
    }

    // 4. "?" thought bubble above the persona's head.
    // Positioned at the character's origin.y=1 top — subtract sprite
    // display height minus 8px for a small gap.
    const bubbleX = char.x;
    const bubbleY = char.y - char.displayHeight - 10;

    // Rounded pill background (Phaser doesn't have rounded rect out of
    // the box — use a small container of Rectangle + Text).
    const bubbleBg = this.add
      .rectangle(bubbleX, bubbleY, 22, 22, 0xffffff, 0.95)
      .setStrokeStyle(2, 0x1f2937, 1)
      .setDepth(char.depth + 1)
      .setAlpha(0);
    const bubbleTail = this.add
      .triangle(
        bubbleX,
        bubbleY + 14,
        -4,
        0,
        4,
        0,
        0,
        6,
        0xffffff,
      )
      .setStrokeStyle(1, 0x1f2937, 1)
      .setDepth(char.depth + 1)
      .setAlpha(0);
    const bubbleText = this.add
      .text(bubbleX, bubbleY - 1, "?", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#1f2937",
        fontStyle: "bold",
      } as unknown as Phaser.Types.GameObjects.Text.TextStyle)
      .setOrigin(0.5)
      .setDepth(char.depth + 2)
      .setAlpha(0);

    // Fade in
    this.tweens.add({
      targets: [bubbleBg, bubbleTail, bubbleText],
      alpha: 1,
      duration: 220,
      ease: "Sine.easeOut",
    });
    // Drift up + fade out
    this.tweens.add({
      targets: [bubbleBg, bubbleTail, bubbleText],
      y: `-=8`,
      alpha: 0,
      duration: 480,
      delay: 900,
      ease: "Sine.easeIn",
      onComplete: () => {
        bubbleBg.destroy();
        bubbleTail.destroy();
        bubbleText.destroy();
      },
    });

    // 5. Subtle UI chime as the rings pulse.
    try {
      audioManager.playUI("hover");
    } catch {
      /* audio may be locked */
    }
  }

  public advanceToNextCheckpoint(gold: boolean = false): void {
    if (this.isAnimating) return;
    const from = CHECKPOINTS[this.currentIndex];
    // Village signature CP-clear animation: play Compass Calibration
    // centred on the just-cleared checkpoint. When it finishes, dispel
    // the boss, walk to the next CP, pan camera. Gold variant used for
    // 3/3 task completion (bigger, brighter).
    this.isAnimating = true;
    this.playCompassCalibration(from.x, from.y, gold, () => {
      // Now dispel the boss (after the compass has locked direction)
      this.dispelMiniBoss(this.currentIndex);
      // Reward — checkpoint clear grants a bigger XP burst than a task.
      // Gold clears (all 3 tasks perfect) give +75 vs. the standard +50.
      eventBridge.dispatchToReact({
        type: "XP_AWARDED",
        amount: gold ? 75 : 50,
        label: gold ? "Gold Checkpoint" : "Checkpoint",
      });
      if (this.currentIndex >= CHECKPOINTS.length - 1) {
        // Last checkpoint cleared → dramatic Unraveller reveal, then celebrate.
        void this.fullRevealSuperBoss().then(() => this.celebrate());
        return;
      }
      this.currentIndex += 1;
      const to = CHECKPOINTS[this.currentIndex];

      // Refresh states immediately so the newly-active CP starts pulsing
      this.refreshCheckpointStates();
      // Update super-boss reveal to reflect new progress.
      this.updateSuperBossReveal();
      // Show the new active boss's taunt after camera settles.
      this.time.delayedCall(VillageMapScene.WALK_DURATION_MS + 200, () =>
        this.maybeShowActiveBossTaunt(),
      );

      // Walk the character from previous CP to this one.
      if (this.character) {
        this.walkCharacterTo(to.x, to.y + CHAR_Y_OFFSET);
      }

      // Pan camera at the same speed so it stays roughly on the character.
      this.cameras.main.pan(
        to.x,
        to.y,
        VillageMapScene.WALK_DURATION_MS,
        "Sine.easeInOut",
      );
      this.time.delayedCall(VillageMapScene.WALK_DURATION_MS, () => {
        this.isAnimating = false;
        // Subtle "you're here" chime on arrival
        try { audioManager.playUI("hover"); } catch { /* audio not critical */ }
        this.game.events.emit("CHECKPOINT_REACHED", {
          id: to.id,
          title: to.title,
        });
      });
    });
  }

  /**
   * Village signature — Compass Calibration animation. Spins a compass
   * needle then locks direction. Runs at the checkpoint we're clearing.
   * Fires the onDone callback when the animation completes OR when the
   * skip window elapses (so we never wait forever).
   */
  private playCompassCalibration(
    x: number,
    y: number,
    gold: boolean,
    onDone: () => void,
  ): void {
    let calledDone = false;
    const done = () => {
      if (calledDone) return;
      calledDone = true;
      onDone();
    };
    // Play the compass SFX in sync with the visual
    try {
      audioManager.playCheckpointSFX(
        gold ? "compass_calibration_gold" : "compass_calibration_standard",
      );
    } catch { /* audio not critical */ }
    try {
      const anim = new CompassCalibrationAnimation(this, {
        x,
        y,
        variant: gold ? "gold" : "standard",
        onComplete: () => {
          anim.destroy();
          done();
        },
        onSkip: () => {
          anim.destroy();
          done();
        },
      });
      anim.play();
      // Belt-and-braces — force onDone after 1.4s in case animation
      // doesn't call back (e.g. missing texture) so the walk still fires.
      this.time.delayedCall(1400, done);
    } catch (err) {
      console.warn("[VillageMapScene] Compass animation failed", err);
      done();
    }
  }

  // ─── Internals ──────────────────────────────────────────

  private buildCheckpoint(cp: CheckpointDef): CheckpointVisual {
    // The user painted the CP numbers directly into the map. We enhance
    // the painted marker with a tight soft glow + state overlay.
    const radius = 22; // tight glow radius that hugs the painted marker

    // Soft pulsing glow centered exactly on the painted number
    const glow = this.add.circle(cp.x, cp.y, radius, 0xffd700, 0.4);
    glow.setDepth(85);
    glow.setBlendMode(Phaser.BlendModes.ADD);

    // Overlay disc — only visible in locked/completed states to dim the
    // painted number. Fully transparent for active state.
    const overlay = this.add.circle(cp.x, cp.y, radius - 3, 0x000000, 0);
    overlay.setDepth(91);

    // State badge — small ✓ or 🔒 or nothing overlaid on the number
    const stateBadge = this.add.text(cp.x, cp.y, "", {
      fontFamily: "Arial Black, Arial, sans-serif",
      fontSize: "20px",
      color: "#4ade80",
      fontStyle: "bold",
    });
    stateBadge.setOrigin(0.5, 0.5);
    stateBadge.setDepth(93);

    // Invisible hit zone — click target sized to marker
    const hitZone = this.add.zone(cp.x, cp.y, 52, 52);
    hitZone.setInteractive(
      new Phaser.Geom.Circle(26, 26, 26),
      Phaser.Geom.Circle.Contains,
    );
    hitZone.input!.cursor = "pointer";
    hitZone.on("pointerover", () => this.onHover(cp, true));
    hitZone.on("pointerout", () => this.onHover(cp, false));
    hitZone.on("pointerdown", () => this.onCheckpointClicked(cp));

    // ── Task-fill indicators — 3 stars orbiting at 12/4/8 o'clock ──
    // Empty state = small dim gray dot; filled state = amber with soft halo
    // + tiny pulse. Positions locked at fixed offsets from CP centre.
    const starRadius = 36; // orbit radius from checkpoint centre
    const angles = [-Math.PI / 2, Math.PI / 6, Math.PI * 5 / 6]; // 12, 4, 8 o'clock
    const taskStars: Phaser.GameObjects.Arc[] = [];
    const taskStarHalos: Phaser.GameObjects.Arc[] = [];
    for (const angle of angles) {
      const sx = cp.x + Math.cos(angle) * starRadius;
      const sy = cp.y + Math.sin(angle) * starRadius;
      // TEMPORARY: task-fill dots hidden for demo. Create them at alpha 0
      // so the array indexing (setCheckpointTaskFill) still works.
      const halo = this.add.circle(sx, sy, 16, 0xffc36a, 0);
      halo.setDepth(87);
      halo.setBlendMode(Phaser.BlendModes.ADD);
      halo.setVisible(false);
      taskStarHalos.push(halo);
      const star = this.add.circle(sx, sy, 8, 0x505050, 0);
      star.setDepth(88);
      star.setStrokeStyle(2, 0x1a1a1a, 0);
      star.setVisible(false);
      taskStars.push(star);
    }

    return {
      def: cp,
      glow,
      overlay,
      stateBadge,
      hitZone,
      taskStars,
      taskStarHalos,
    };
  }

  private onHover(cp: CheckpointDef, hovering: boolean): void {
    if (cp.id !== CHECKPOINTS[this.currentIndex].id) return;
    const vis = this.visuals[this.currentIndex];
    if (!vis) return;
    this.tweens.add({
      targets: [vis.glow],
      scale: hovering ? 1.25 : 1,
      duration: 140,
      ease: "Sine.easeOut",
    });
  }

  private onCheckpointClicked(cp: CheckpointDef): void {
    const activeCp = CHECKPOINTS[this.currentIndex];
    if (cp.id !== activeCp.id) return;

    // Fire on both channels so both consumers work:
    //   - game.events   → /village-test (VillageTestClient listens here)
    //   - eventBridge   → /map/world    (page.tsx listens here to open task
    //                                    panel via Convex venture data)
    this.game.events.emit("CHECKPOINT_CLICKED", {
      id: cp.id,
      title: cp.title,
      x: cp.x,
      y: cp.y,
    });

    // /map/world expects { checkpointId, stage, checkpoint }.
    // Our village demo lives entirely inside stage 1 — each numbered
    // marker is a distinct checkpoint within that stage.
    eventBridge.dispatchToReact({
      type: "CHECKPOINT_CLICKED",
      checkpointId: `village_stage1_cp${cp.id}`,
      stage: 1,
      checkpoint: cp.id,
    });

    const vis = this.visuals[this.currentIndex];
    this.tweens.add({
      targets: [vis.glow],
      scale: 1.4,
      duration: 90,
      yoyo: true,
    });
  }

  private refreshCheckpointStates(): void {
    this.visuals.forEach((vis, idx) => {
      const isCompleted = idx < this.currentIndex;
      const isActive = idx === this.currentIndex;

      // Kill any active pulse tween
      if (vis.glowTween) {
        vis.glowTween.stop();
        vis.glowTween = undefined;
      }
      vis.glow.setScale(1);

      if (isCompleted) {
        // Green glow around the painted number + green ✓ badge overlay
        vis.glow.setFillStyle(0x4ade80, 0.4);
        vis.glow.setAlpha(0.5);
        vis.overlay.setFillStyle(0x000000, 0.55); // dims the painted number
        vis.stateBadge.setText("✓");
        vis.stateBadge.setColor("#4ade80");
      } else if (isActive) {
        // Gold pulsing glow behind the painted number, no overlay dim
        vis.glow.setFillStyle(0xffd700, 0.55);
        vis.glow.setAlpha(0.8);
        vis.overlay.setFillStyle(0x000000, 0); // no dim
        vis.stateBadge.setText(""); // painted number shows through

        vis.glowTween = this.tweens.add({
          targets: vis.glow,
          scale: { from: 1, to: 1.2 },
          alpha: { from: 0.7, to: 0.2 },
          duration: 1300,
          ease: "Sine.easeInOut",
          yoyo: true,
          repeat: -1,
        });
      } else {
        // Locked — subtle dim of the painted number, no lock icon.
        // Painted marker stays visible but muted so user sees checkpoint
        // exists without a jarring 🔒 overlay.
        vis.glow.setFillStyle(0x555555, 0.05);
        vis.glow.setAlpha(0.1);
        vis.overlay.setFillStyle(0x000000, 0.35); // lighter dim
        vis.stateBadge.setText(""); // no lock icon
      }
    });
  }

  private celebrate(): void {
    // Emit on both channels so both React consumers work:
    //  - game.events → VillageTestClient direct Phaser listener
    //  - eventBridge → /map/world page.tsx (goes through the React bridge)
    this.game.events.emit("VILLAGE_COMPLETE", {});
    // Big XP burst — the "Stage 1 boss slain" reward. Fires immediately
    // (before the 4s wait for the celebration overlay) so the burst
    // lands during the Unraveller taunt window rather than colliding
    // with the celebration screen.  Amount matches the server-side
    // POINT_VALUES.stage_complete_bonus (50) so the popover no longer
    // lies about the reward — the old +500 placeholder was inflated
    // ~10x the real award.
    eventBridge.dispatchToReact({
      type: "XP_AWARDED",
      amount: 50,
      label: "Stage 1 Cleared",
    });
    // Delay slightly so the Unraveller's own taunt has ~2s of screen
    // time before the celebration overlay pops.
    this.time.delayedCall(4000, () => {
      eventBridge.dispatchToReact({
        type: "VILLAGE_COMPLETE",
        checkpointsCleared: CHECKPOINTS.length,
        tasksCompleted: CHECKPOINTS.length * 3,
      });
    });
    const cp = CHECKPOINTS[this.currentIndex];
    this.cameras.main.pan(cp.x, cp.y, 800, "Sine.easeInOut");
  }

  /**
   * "Coming next" — pan east past the Unraveller, dim the world, drop in a
   * silhouetted pine forest and a stage banner ("STAGE 2 · FOREST OF
   * PERFECTIONISM"), then fade everything back and recentre on the village.
   *
   * Fires from the `PREVIEW_NEXT_STAGE` React → Phaser event, which is
   * dispatched by /map/world/page.tsx immediately after the user dismisses
   * the Stage 1 Complete celebration overlay.
   *
   * Design notes:
   *  - No new assets — everything is drawn from Phaser primitives (rects,
   *    triangles, text). Keeps this shippable in 30 min.
   *  - Depth 900+ so the preview sits above the map + bosses + character
   *    but below tutorial React overlays.
   *  - Cleans up its own GameObjects at the end and centres the camera
   *    back on the current checkpoint so the map is usable again.
   */
  public previewNextStage(nextStage: number): void {
    // Guard: only Stage 2 for now (Village → Forest). Later stages reuse
    // the same plumbing but with different banner text / silhouettes.
    if (nextStage !== 2) return;
    if (this.previewObjects.length > 0) return; // already showing

    const cam = this.cameras.main;

    // 1. Dim vignette across the whole map — sets a moody mist tone.
    const dim = this.add
      .rectangle(
        MAP_WIDTH / 2,
        MAP_HEIGHT / 2,
        MAP_WIDTH,
        MAP_HEIGHT,
        0x0a1a0f,
        0,
      )
      .setDepth(900)
      .setAlpha(0);
    this.previewObjects.push(dim);
    this.tweens.add({
      targets: dim,
      alpha: 0.55,
      duration: 700,
      ease: "Sine.easeOut",
    });

    // 2. Real Stage 2 forest map preview — load the actual forest painted
    //    map as a texture and drop it just east of the village map edge so
    //    the camera pan reveals the real Stage 2 biome. Falls back to
    //    silhouetted procedural pines if the texture isn't loaded yet.
    const forestGroup: Phaser.GameObjects.GameObject[] = [];
    const FOREST_KEY = "forest-map-preview";
    if (!this.textures.exists(FOREST_KEY)) {
      // Lazy load — dispose the loader listener after this preview closes.
      this.load.image(FOREST_KEY, "/assets/maps-v2/forest/forest-map.png");
      this.load.once("filecomplete-image-" + FOREST_KEY, () => {
        this.spawnForestPreviewImage(FOREST_KEY, forestGroup);
      });
            this.load.start();
    } else {
      this.spawnForestPreviewImage(FOREST_KEY, forestGroup);
    }

    // 3. Camera pan east ~50% of the map width to reveal the preview.
    //    The user sees the village edge fade into the forest silhouette.
    this.time.delayedCall(600, () => {
      cam.pan(
        MAP_WIDTH * 0.85,
        MAP_HEIGHT * 0.5,
        3200,
        "Sine.easeInOut",
      );
    });

    // 4. Auto-dispose the preview after ~5.5s so the celebration overlay
    //    can advance to Stage 2 cleanly.
    this.time.delayedCall(5500, () => {
      for (const obj of this.previewObjects) {
        try { obj.destroy(); } catch { /* ignore */ }
      }
      this.previewObjects = [];
      for (const obj of forestGroup) {
        try { obj.destroy(); } catch { /* ignore */ }
      }
    });
  }

  /**
   * Drop the real forest map PNG into the scene as a Stage 2 preview.
   * Positioned east of the village edge so the camera pan reveals it.
   * Falls back gracefully if the texture failed to load.
   */
  private spawnForestPreviewImage(
    textureKey: string,
    forestGroup: Phaser.GameObjects.GameObject[],
  ): void {
    if (!this.textures.exists(textureKey)) return;
    const previewX = MAP_WIDTH + 400; // just east of village edge
    const previewY = MAP_HEIGHT / 2;
    const img = this.add
      .image(previewX, previewY, textureKey)
      .setOrigin(0.5, 0.5)
      .setDepth(910)
      .setAlpha(0)
      .setScale(0.55); // scaled down to fit inside camera view
    forestGroup.push(img);
    this.previewObjects.push(img);
    this.tweens.add({
      targets: img,
      alpha: 0.95,
      duration: 900,
      ease: "Sine.easeOut",
    });

    // Subtle vignette / mist band over the forest preview
    const mist = this.add
      .rectangle(previewX, previewY, MAP_WIDTH * 0.55, MAP_HEIGHT * 0.85, 0x1a2a1f, 0)
      .setDepth(915)
      .setAlpha(0)
      .setBlendMode(Phaser.BlendModes.MULTIPLY);
    forestGroup.push(mist);
    this.previewObjects.push(mist);
    this.tweens.add({
      targets: mist,
      alpha: 0.35,
      duration: 900,
      ease: "Sine.easeOut",
    });
  }
  /**
   * Spawn stage-1 mini-game easter-eggs on the Village map.
   *
   * Reads the shared MINIGAME_SPAWNS config so the same spawn list can
   * be used across scenes + level definitions.  Each spawn is created
   * as a MiniGameSpawnPoint entity (🎮 emoji) placed at the config's
   * (x, y).  Tapping the emoji fires the `MINIGAME_SPAWN_ACTIVATED`
   * event which React uses to open the mini-game prompt.
   *
   * Only Stage 1 spawns are placed here — Forest/Harbor/Artisans/etc.
   * are gated by stage number in the config and load with their own
   * scenes (or via WorldMapScene.syncMiniGameSpawns for the aggregate
   * view).
   */
  private spawnMiniGamePoints(): void {
    try {
      // Lazy-import so the constant module isn't required at scene boot
      // if it hasn't been generated yet.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { MINIGAME_SPAWNS } = require("@convex/miniGameConstants");
      const stageOne = (MINIGAME_SPAWNS as any[]).filter(
        (s) => s?.stage === 1,
      );
      for (const cfg of stageOne) {
        const spawn = new MiniGameSpawnPoint({
          config: cfg,
          scene: this,
          onActivate: (c) => {
            // Bubble activation up through the event bridge so React
            // handles the prompt dialog + Convex round creation.
            try {
              eventBridge.dispatchToReact({
                type: "MINIGAME_SPAWN_ACTIVATED",
                spawnPointId: c.id,
                stage: c.stage,
                archetype: c.archetype,
                difficulty: c.difficulty as 1 | 2 | 3 | 4 | 5,
                x: c.x,
                y: c.y,
                flavorText: c.flavorText,
              });
            } catch (err) {
              console.warn("[Village] mini-game activation failed", err);
            }
          },
        });
        this.miniGameSpawns.push(spawn);
      }
    } catch (err) {
      // Non-fatal — if the mini-game system fails to load, the rest of
      // the Village scene keeps working.  We just skip the easter eggs.
      console.warn("[Village] spawnMiniGamePoints skipped:", err);
    }
  }
}
