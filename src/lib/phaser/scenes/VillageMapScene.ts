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
import {
  getCurrentPersonaId,
  loadPersonaSprites,
  registerPersonaAnimations,
  personaSpriteKey,
  personaAnimKey,
  personaHasExtended,
  directionalWalkAnimKey,
} from "../persona-assets";
import { getPersona } from "@/config/personas";
import { SUPER_BOSS_POOL, type SuperBossPoolEntry } from "@/config/templates/venture.config";
import { attachZoneEditor, type Rect as ZoneRect } from "@/lib/phaser/systems/zoneEditor";
// Corruption overlay + pattern helpers imports kept for the TYPE
// (`CorruptionOverlay | null` on the private field below) but the
// runtime constructor + pattern builders are no longer called —
// the corruption mechanism was pulled per product request. The
// files stay on disk so re-enabling is a matter of restoring the
// `new CorruptionOverlay(...)` block in create().
import { CorruptionOverlay } from "@/lib/phaser/systems/corruptionOverlay";
import type { CheckpointState } from "@/lib/phaser/utils/event-bridge";

const MAP_ASSET = "/assets/maps-v2/village-painted/village-map.png";
// Legacy fantasy sprite paths kept only as a fallback if the persona
// system isn't wired yet (e.g. running the scene from a dev script).
// Real player art now comes from persona-assets.ts using whichever
// persona React set via setCurrentPersonaId() before boot.
const CHAR_IDLE_ASSET = "/assets/fan-tasy/Character_Idle.webp";
const CHAR_WALK_ASSET = "/assets/fan-tasy/Character_Walk.webp";
const CHAR_FRAME_W = 32;
const CHAR_FRAME_H = 48;

// ── Village bosses — PixelLab-generated painted sprites ─────────────────
// Each boss frame is 92×92 (Quadruped/humanoid model export).
const BOSS_FRAME = 92;
// Fog sheets — the *new* Pixellab pipeline (9 frames × 92×92 each) for
// idle/attack/hurt/defeat/victory. Legacy `running.png` (6 frames) stays
// loaded as a fallback loopKey for the old MINI_BOSSES entry but is not
// used by the new state machine (bosses have no walking mechanism).
const FOG_IDLE_ASSET = "/assets/bosses/village/fog/idle.png"; // 9-frame Pixellab
const FOG_ATTACK_ASSET = "/assets/bosses/village/fog/attack.png"; // 9-frame Pixellab
const FOG_HURT_ASSET = "/assets/bosses/village/fog/hurt.png"; // 9-frame Pixellab
const FOG_DEFEAT_ASSET = "/assets/bosses/village/fog/defeat.png"; // 9-frame Pixellab
const FOG_VICTORY_ASSET = "/assets/bosses/village/fog/victory.png"; // 9-frame Pixellab
// Wraith / Chimera / Automaton — Pixellab pipeline sheets from the
// second-wave boss pack (all 92×92 × 9 frames, same as Fog). Some
// clips are missing (e.g. no defeat sheet); the boss config below
// falls back to `hurt` for defeat where needed.
const WRAITH_IDLE_ASSET = "/assets/bosses/village/wraith/idle.png";
const WRAITH_ATTACK_ASSET = "/assets/bosses/village/wraith/attack.png";
const WRAITH_HURT_ASSET = "/assets/bosses/village/wraith/hurt.png";
const WRAITH_VICTORY_ASSET = "/assets/bosses/village/wraith/victory.png";
const WRAITH_WALK_ASSET = "/assets/bosses/village/wraith/walk.png"; // legacy 8-frame
const CHIMERA_IDLE_ASSET = "/assets/bosses/village/chimera/idle.png";
const CHIMERA_ATTACK_ASSET = "/assets/bosses/village/chimera/attack.png";
const CHIMERA_HURT_ASSET = "/assets/bosses/village/chimera/hurt.png";
const AUTOMATON_IDLE_ASSET = "/assets/bosses/village/automaton/idle.png";
const AUTOMATON_ATTACK_ASSET = "/assets/bosses/village/automaton/attack.png";
const AUTOMATON_HURT_ASSET = "/assets/bosses/village/automaton/hurt.png";
const AUTOMATON_VICTORY_ASSET = "/assets/bosses/village/automaton/victory.png";
const UNRAVELLER_IDLE_ASSET = "/assets/bosses/village/unraveller/idle.png";

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
  /** How many frames the idle sheet has. 1 = static image; >1 = looping breathing anim. */
  idleFrameCount: number;
  /** Optional attack animation (played via taunt loop). */
  attackKey: string | null;
  attackFrameCount: number;
  /** Optional hurt animation (played on weaken). */
  hurtKey?: string | null;
  hurtFrameCount?: number;
  /** Optional defeat animation (played on dispel). */
  defeatKey?: string | null;
  defeatFrameCount?: number;
  /** Optional victory animation (boss dominating pose after player defeat). */
  victoryKey?: string | null;
  victoryFrameCount?: number;
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
    // No walking mechanism for bosses (per spec) — idle is the loop.
    loopKey: null,
    loopFrameCount: 0,
    idleFrameCount: 9,
    attackKey: "boss-fog-attack",
    attackFrameCount: 9,
    hurtKey: "boss-fog-hurt",
    hurtFrameCount: 9,
    defeatKey: "boss-fog-defeat",
    defeatFrameCount: 9,
    victoryKey: "boss-fog-victory",
    victoryFrameCount: 9,
    // Pixellab sheet packs the character into ~46/92 of the frame height,
    // so the OLD 2.2 scale ended up rendering the boss ~200px tall and
    // clipping the top off the visible camera. 1.5 gives ~140px on screen,
    // which fits and reads clean.
    scale: 1.9,
    // Sprite origin (0.5, 1) puts the frame's bottom-edge at yOffset.
    // Trimmed from +80 → +62 per product ask ("monster just half cm
    // upward") — half a centimetre on a typical monitor is ~18px, so
    // pulling the offset back by that amount lifts the boss just
    // enough for its feet to sit on the CP disc's northern half
    // rather than crushing into its centre.
    yOffset: 62,
    // All Village bosses now sit at a small +30 east offset from
    // their CP marker so they appear ON the checkpoint while leaving
    // just enough gap on the LEFT for the persona to stand there
    // without overlapping. Product request: "bosses should be on
    // checkpoint, make character stand on left side."
    // Zeroed — boss sits EXACTLY on the CP marker per product ask
    // ("boss exact on check point"). Persona now stands at the CP's
    // top-left (see CHAR_X_OFFSET / CHAR_Y_OFFSET), which keeps the
    // two sprites separate without needing to nudge the boss.
    offsetX: 0,

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
    idleFrameCount: 9,
    attackKey: "boss-chimera-attack",
    attackFrameCount: 9,
    hurtKey: "boss-chimera-hurt",
    hurtFrameCount: 9,
    // No dedicated defeat sheet — fall back to hurt so the KO frame still reads.
    defeatKey: "boss-chimera-hurt",
    defeatFrameCount: 9,
    // No dedicated victory sheet — fall back to attack pose.
    victoryKey: "boss-chimera-attack",
    victoryFrameCount: 9,
    // Match Fog's tuned scale/yOffset — Pixellab bosses fill more of
    // their 92-frame than the old single-image bosses did.
    scale: 1.9,
    yOffset: 62, // Unified with CP1 — sprite feet on the CP disc.
    offsetX: 0, // ON the CP marker — persona sits at CP top-left (unified with CP1).

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
    idleFrameCount: 9,
    attackKey: "boss-automaton-attack",
    attackFrameCount: 9,
    hurtKey: "boss-automaton-hurt",
    hurtFrameCount: 9,
    // Missing defeat sheet — fall back to hurt.
    defeatKey: "boss-automaton-hurt",
    defeatFrameCount: 9,
    victoryKey: "boss-automaton-victory",
    victoryFrameCount: 9,
    scale: 1.9,
    yOffset: 62, // Unified with CP1 — sprite feet on the CP disc.
    offsetX: 0, // ON the CP marker — persona sits at CP top-left (unified with CP1).

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
    // Legacy walk sheet still exists but the new Pixellab idle takes
    // precedence — bosses don't have a walking mechanism.
    loopKey: null,
    loopFrameCount: 0,
    idleFrameCount: 9,
    attackKey: "boss-wraith-attack",
    attackFrameCount: 9,
    hurtKey: "boss-wraith-hurt",
    hurtFrameCount: 9,
    // Missing defeat sheet — fall back to hurt.
    defeatKey: "boss-wraith-hurt",
    defeatFrameCount: 9,
    victoryKey: "boss-wraith-victory",
    victoryFrameCount: 9,
    scale: 1.9,
    yOffset: 62, // Unified with CP1 — sprite feet on the CP disc.
    offsetX: 0, // ON the CP marker — persona sits at CP top-left (unified with CP1).

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
const CHAR_SCALE = 2.05;
// Character stands ON the checkpoint marker — origin is bottom-center
// Character spawns at the TOP-LEFT of the checkpoint marker on
// every map. Product spec ("make sure where i have placed the
// character, default all character at this map and all will be
// here only at starting position") — regardless of which persona
// the user picked, they land here on first mount and every
// subsequent CP arrival. This is the "starting position" contract
// for the whole world map. The boss occupies the CP disc itself
// (offsetX: 0 in VILLAGE_MINI_BOSSES), so top-left keeps the two
// sprites from overlapping while still reading as "at CP1".
const CHAR_X_OFFSET = -60;
const CHAR_Y_OFFSET = -45;

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
/** Fast point-in-rects test for the walkability system.
 *  Checks both the hardcoded BLOCKED_ZONES AND any custom zones the
 *  user is currently drawing via the in-map editor (`?editZones=1`). */
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

const CHECKPOINTS: readonly CheckpointDef[] = [
  { id: 1, x: 173, y: 215, title: "The Signboard" },
  { id: 2, x: 587, y: 633, title: "The Bridge" },
  { id: 3, x: 1177, y: 662, title: "The Barn" },
  { id: 4, x: 1304, y: 325, title: "The Well" },
];

/**
 * Hand-defined obstacles the character cannot walk through.
 * Each entry is an axis-aligned rectangle in map-space pixels
 * (map is 1536×1024). Feet of the character are checked; if the
 * proposed X or Y move puts them inside a rect, that axis is
 * rejected (letting the player slide along walls).
 *
 * Approximate zones for the Village painted map:
 *  - Streams / water bodies
 *  - Barn footprint, cottages, well platform
 * Tune visually with `?showZones=1` on `/map/world`.
 * Task #213 (FREE-ROAM 2 — walkability).
 */
// Village walkability blockers — authored via the in-map editor
// (?editZones=1) and pasted here. To edit: reopen the editor, redraw
// the ones you want to change, COPY JSON, replace this array.
const BLOCKED_ZONES: readonly { x: number; y: number; w: number; h: number }[] = [
  { x: 350, y: 119, w: 78, h: 74 },
  { x: 513, y: 69, w: 143, h: 166 },
  { x: 818, y: 47, w: 356, h: 206 },
  { x: 1175, y: 252, w: 80, h: 81 },
  { x: 723, y: 226, w: 90, h: 33 },
  { x: 703, y: 60, w: 52, h: 71 },
  { x: 662, y: 136, w: 76, h: 47 },
  { x: 176, y: 332, w: 95, h: 51 },
  { x: 17, y: 417, w: 96, h: 55 },
  { x: 62, y: 474, w: 51, h: 56 },
  { x: 201, y: 492, w: 136, h: 109 },
  { x: 87, y: 817, w: 113, h: 124 },
  { x: 726, y: 871, w: 84, h: 111 },
  { x: 591, y: 850, w: 82, h: 90 },
  { x: 112, y: 416, w: 207, h: 99 },
  { x: 115, y: 516, w: 89, h: 60 },
  { x: 324, y: 458, w: 73, h: 111 },
  { x: 398, y: 488, w: 66, h: 114 },
  { x: 466, y: 506, w: 40, h: 152 },
  { x: 358, y: 571, w: 40, h: 55 },
  { x: 400, y: 606, w: 61, h: 49 },
  { x: 368, y: 630, w: 30, h: 28 },
  { x: 407, y: 746, w: 99, h: 112 },
  { x: 511, y: 787, w: 34, h: 91 },
  { x: 421, y: 860, w: 165, h: 97 },
  { x: 435, y: 927, w: 119, h: 33 },
  { x: 438, y: 967, w: 133, h: 50 },
  { x: 970, y: 832, w: 139, h: 26 },
  { x: 761, y: 580, w: 233, h: 191 },
  { x: 1112, y: 778, w: 42, h: 91 },
  { x: 1233, y: 741, w: 62, h: 66 },
  { x: 1261, y: 809, w: 90, h: 93 },
  { x: 1298, y: 903, w: 158, h: 51 },
  { x: 1356, y: 825, w: 141, h: 70 },
  { x: 1460, y: 905, w: 40, h: 46 },
  { x: 1395, y: 954, w: 114, h: 63 },
  { x: 1246, y: 953, w: 156, h: 69 },
  { x: 1347, y: 669, w: 109, h: 115 },
  { x: 1406, y: 575, w: 89, h: 106 },
  { x: 1362, y: 550, w: 91, h: 49 },
  { x: 1380, y: 342, w: 115, h: 204 },
  { x: 1463, y: 552, w: 36, h: 25 },
  { x: 1356, y: 288, w: 144, h: 51 },
  { x: 1189, y: 47, w: 101, h: 40 },
  { x: 1226, y: 93, w: 70, h: 73 },
  { x: 630, y: 383, w: 41, h: 22 },
  { x: 642, y: 348, w: 59, h: 36 },
  { x: 69, y: 104, w: 21, h: 64 },
  { x: 21, y: 128, w: 44, h: 42 },
  { x: 134, y: 46, w: 76, h: 40 },
  { x: 41, y: 46, w: 60, h: 54 },
  { x: 683, y: 832, w: 99, h: 29 },
  { x: 67, y: 537, w: 75, h: 286 },
  { x: 144, y: 714, w: 54, h: 116 },
  { x: 201, y: 757, w: 24, h: 89 },
  { x: 144, y: 578, w: 29, h: 80 },
  { x: 666, y: 713, w: 28, h: 118 },
  { x: 800, y: 834, w: 62, h: 59 },
  { x: 1285, y: 171, w: 69, h: 60 },
  { x: 1332, y: 289, w: 23, h: 24 },
  { x: 1313, y: 233, w: 186, h: 56 },
  { x: 1044, y: 478, w: 45, h: 48 },
  { x: 719, y: 378, w: 121, h: 20 },
  { x: 639, y: 302, w: 78, h: 44 },
  { x: 622, y: 190, w: 111, h: 53 },
];

export class VillageMapScene extends Phaser.Scene {
  private currentIndex = 0;
  private visuals: CheckpointVisual[] = [];
  private isAnimating = false;
  private character: Phaser.GameObjects.Sprite | null = null;
  private characterShadow: Phaser.GameObjects.Ellipse | null = null;
  // Resolved persona animation clip keys. Written in spawnCharacter()
  // based on whether the persona sheet loaded (persona-anim:<id>:*)
  // or we fell back to the legacy fantasy sheet (persona-idle/walk).
  private _personaIdleAnimKey: string | null = null;
  private _personaWalkAnimKey: string | null = null;
  // True when the loaded persona has the full Pixellab set (4-dir walk
  // + combat one-shots). Governs whether update() plays directional
  // walks and whether playPersonaState() is a no-op.
  private _personaUsesExtended = false;
  // Last-played anim key so update() only calls play() when the anim
  // actually changes — Phaser restarts on repeat play(), freezing frame 0.
  private _currentPersonaAnimKey: string | null = null;
  // True while a one-shot combat animation (attack/hurt/defeat/victory)
  // is playing — update() yields free-roam input during this window
  // and returns to idle when the anim completes.
  private _personaAnimBusy = false;
  // Safety-net timer that force-clears the busy flag if the natural
  // ANIMATION_COMPLETE event never fires (Phaser interrupt edge cases).
  private _personaAnimBusyTimer: number | null = null;

  // ── Free-roam state ────────────────────────────────────────────────
  /** WASD + arrow-key handles. Set in create(). */
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private wasd: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
    E: Phaser.Input.Keyboard.Key;
    SPACE: Phaser.Input.Keyboard.Key;
  } | null = null;
  /** Whether the character is currently animating (walk cycle vs idle). */
  private isWalking = false;
  /** Whether a script (walkCharacterTo) has control over the character.
   *  When true, free-roam input is ignored so the two systems don't fight. */
  private scriptedMovement = false;
  /** Handle to the active walk tween so we can kill the prior one when a
   *  new walk starts (prevents onComplete-loss stalls that would strand
   *  scriptedMovement=true and freeze WASD forever). */
  private _walkTween: Phaser.Tweens.Tween | null = null;
  /** Per-CP corruption overlay (opacity-driven tile strips + weakened
   *  monster sprite at 2/3 + shatter burst at 3/3). Implements the model
   *  from Ibhaveda_boss_corruption_table. Instantiated once in create(). */
  private _corruption: CorruptionOverlay | null = null;
  /** Latest CheckpointState snapshot from React — cached so weakenActiveBoss
   *  can call updateSegment with the freshest known state. */
  private _lastCheckpointStates: CheckpointState[] = [];
  /** Nearest checkpoint within interact range, or null. */
  private nearestInteractCp: number | null = null;
  /** Interact-hint ring positioned above the CP marker when in range. */
  private interactHint: Phaser.GameObjects.Container | null = null;
  /** Joystick vector from mobile nipplejs — {x, y} in [-1, 1] range, null when idle. */
  private joystickVector: { x: number; y: number } | null = null;
  /** Handler ref for the joystick event so we can unbind on shutdown. */
  private joystickHandler:
    | ((e: { x: number; y: number } | null) => void)
    | null = null;
  /** Player movement speed in world pixels per second. */
  private static readonly PLAYER_SPEED = 220;
  /** Distance (world px) within which the interact prompt shows. */
  private static readonly INTERACT_RADIUS = 90;
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
  // Per-boss animation keys resolved during spawn (idle / hurt / defeat /
  // victory / attack). Nullable when the sheet wasn't present. Used by
  // playBossState() to swap one-shots on combat events.
  private miniBossAnimKeys: Array<{
    idle: string | null;
    attack: string | null;
    hurt: string | null;
    defeat: string | null;
    victory: string | null;
  } | null> = [];
  // Super boss silhouette + reveal state. Defaults to the Unraveller
  // per the original demo, but `assignedPoolBoss` overrides at runtime
  // once the venture's random pool assignment is known — see
  // `setAssignedPoolBoss` + `fullRevealSuperBoss` below.
  private superBossSprite: Phaser.GameObjects.Sprite | null = null;
  private superBossBobTween: Phaser.Tweens.Tween | null = null;
  private superBossTendrilStopper: (() => void) | null = null;
  private superBossRevealed = false;
  /** Which of the 12 pool bosses the current venture drew. Set by the
   *  React map page from `venture.assignedBosses[0]` (Convex — the
   *  boss id in that array maps 1..12 → SUPER_BOSS_POOL index). Null
   *  when the query hasn't resolved yet — reveal falls back to
   *  Unraveller (the default silhouette + taunt). */
  private assignedPoolBoss: SuperBossPoolEntry | null = null;

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
    // Fog of Vagueness — Pixellab pipeline: idle + combat state one-shots
    // (attack / hurt / defeat / victory), all 9 frames × 92×92.
    // Bosses have no walking mechanism (user spec), so no run sheet is
    // loaded — the sprite plays idle on the map, then swaps to attack/
    // hurt/defeat/victory in reaction to combat events.
    this.load.spritesheet("boss-fog-idle", FOG_IDLE_ASSET, {
      frameWidth: BOSS_FRAME,
      frameHeight: BOSS_FRAME,
    });
    this.load.spritesheet("boss-fog-attack", FOG_ATTACK_ASSET, {
      frameWidth: BOSS_FRAME,
      frameHeight: BOSS_FRAME,
    });
    this.load.spritesheet("boss-fog-hurt", FOG_HURT_ASSET, {
      frameWidth: BOSS_FRAME,
      frameHeight: BOSS_FRAME,
    });
    this.load.spritesheet("boss-fog-defeat", FOG_DEFEAT_ASSET, {
      frameWidth: BOSS_FRAME,
      frameHeight: BOSS_FRAME,
    });
    this.load.spritesheet("boss-fog-victory", FOG_VICTORY_ASSET, {
      frameWidth: BOSS_FRAME,
      frameHeight: BOSS_FRAME,
    });
    // Assumption Wraith — Pixellab pipeline (idle + attack + hurt + victory),
    // 9 frames × 92×92. Missing defeat sheet — config falls back to hurt.
    this.load.spritesheet("boss-wraith-idle", WRAITH_IDLE_ASSET, {
      frameWidth: BOSS_FRAME, frameHeight: BOSS_FRAME,
    });
    this.load.spritesheet("boss-wraith-attack", WRAITH_ATTACK_ASSET, {
      frameWidth: BOSS_FRAME, frameHeight: BOSS_FRAME,
    });
    this.load.spritesheet("boss-wraith-hurt", WRAITH_HURT_ASSET, {
      frameWidth: BOSS_FRAME, frameHeight: BOSS_FRAME,
    });
    this.load.spritesheet("boss-wraith-victory", WRAITH_VICTORY_ASSET, {
      frameWidth: BOSS_FRAME, frameHeight: BOSS_FRAME,
    });
    this.load.spritesheet("boss-wraith-walk", WRAITH_WALK_ASSET, {
      frameWidth: BOSS_FRAME, frameHeight: BOSS_FRAME,
    });
    // The Unraveller — static rotation (no anim frames available yet).
    this.load.image("boss-unraveller-idle", UNRAVELLER_IDLE_ASSET);
    // Preload every pool super-boss's idle + all animation clips so
    // we can swap the super-boss sprite texture AND play the full
    // state machine on reveal based on the current venture's random
    // assignment (venture.assignedBosses[0] maps 1..12 →
    // SUPER_BOSS_POOL[id-1]). Two texture keys per boss:
    //   `pool-boss-idle:<id>` = static idle for the pre-reveal
    //      silhouette swap (setAssignedPoolBoss / fullRevealSuperBoss)
    //   `pool-boss-anim:<id>:<state>` = spritesheet for the state
    //      machine (loaded ONLY if the entry ships a matching
    //      idleClip / attackClip / hurtClip / defeatClip / victoryClip)
    // Total cold-cost across all 12: ~1-2 MB (mostly the Tide Caller
    // 164×164 sheets). Preloading upfront avoids a network stall
    // between the reveal cinematic and the anim first play.
    for (const entry of SUPER_BOSS_POOL) {
      // 1) Static idle for the silhouette
      const staticPath = entry.idleAsset ?? entry.idleClip?.asset;
      if (staticPath) {
        const key = `pool-boss-idle:${entry.id}`;
        if (!this.textures.exists(key)) this.load.image(key, staticPath);
      }
      // 2) Anim clips — every state with a clip block
      const clips: Array<[string, typeof entry.idleClip]> = [
        ["idle", entry.idleClip],
        ["attack", entry.attackClip],
        ["hurt", entry.hurtClip],
        ["defeat", entry.defeatClip],
        ["victory", entry.victoryClip],
      ];
      for (const [state, clip] of clips) {
        if (!clip) continue;
        const animKey = `pool-boss-anim:${entry.id}:${state}`;
        if (this.textures.exists(animKey)) continue;
        if (clip.frameCount > 1 && clip.frameWidth && clip.frameHeight) {
          this.load.spritesheet(animKey, clip.asset, {
            frameWidth: clip.frameWidth,
            frameHeight: clip.frameHeight,
          });
        } else {
          this.load.image(animKey, clip.asset);
        }
      }
    }
    // Everyone Chimera (CP2) — Pixellab pipeline: idle + attack + hurt.
    // Missing victory / defeat — config falls back to hurt for defeat.
    this.load.spritesheet("boss-chimera-idle", CHIMERA_IDLE_ASSET, {
      frameWidth: BOSS_FRAME, frameHeight: BOSS_FRAME,
    });
    this.load.spritesheet("boss-chimera-attack", CHIMERA_ATTACK_ASSET, {
      frameWidth: BOSS_FRAME, frameHeight: BOSS_FRAME,
    });
    this.load.spritesheet("boss-chimera-hurt", CHIMERA_HURT_ASSET, {
      frameWidth: BOSS_FRAME, frameHeight: BOSS_FRAME,
    });
    // Feature Automaton (CP3) — Pixellab pipeline: idle + attack + hurt + victory.
    this.load.spritesheet("boss-automaton-idle", AUTOMATON_IDLE_ASSET, {
      frameWidth: BOSS_FRAME, frameHeight: BOSS_FRAME,
    });
    this.load.spritesheet("boss-automaton-attack", AUTOMATON_ATTACK_ASSET, {
      frameWidth: BOSS_FRAME, frameHeight: BOSS_FRAME,
    });
    this.load.spritesheet("boss-automaton-hurt", AUTOMATON_HURT_ASSET, {
      frameWidth: BOSS_FRAME, frameHeight: BOSS_FRAME,
    });
    this.load.spritesheet("boss-automaton-victory", AUTOMATON_VICTORY_ASSET, {
      frameWidth: BOSS_FRAME, frameHeight: BOSS_FRAME,
    });
    // Persona spritesheets ────────────────────────────────────────────────
    // New pipeline: load the user's chosen persona under the shared
    // `persona:<id>:{idle,walk}` keys. Legacy fantasy sprites still
    // loaded as fallback under the old keys in case a scene consumer
    // hasn't been migrated yet.
    loadPersonaSprites(this, getCurrentPersonaId());
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

    // Register pool boss animations for every SUPER_BOSS_POOL entry
    // whose clips loaded in preload(). Anim keys mirror the texture
    // keys from preload: `pool-boss-anim:<id>:<state>`. Idempotent —
    // Phaser skips if the key already exists. Attack/hurt/defeat/
    // victory play once; idle loops.
    for (const entry of SUPER_BOSS_POOL) {
      const clips: Array<[string, typeof entry.idleClip, number]> = [
        ["idle",    entry.idleClip,    -1],
        ["attack",  entry.attackClip,   0],
        ["hurt",    entry.hurtClip,     0],
        ["defeat",  entry.defeatClip,   0],
        ["victory", entry.victoryClip,  0],
      ];
      for (const [state, clip, repeat] of clips) {
        if (!clip || clip.frameCount <= 1) continue;
        const texKey = `pool-boss-anim:${entry.id}:${state}`;
        const animKey = `pool-boss-anim-key:${entry.id}:${state}`;
        if (!this.textures.exists(texKey)) continue;
        if (this.anims.exists(animKey)) continue;
        this.anims.create({
          key: animKey,
          frames: this.anims.generateFrameNumbers(texKey, {
            start: 0,
            end: Math.max(0, clip.frameCount - 1),
          }),
          frameRate: clip.fps ?? (state === "idle" ? 6 : 10),
          repeat,
        });
      }
    }

    // 2. Camera — centered on first checkpoint, drag-to-pan.
    // Adaptive zoom by viewport width so mobile shows more of the map.
    // Desktop stays untouched at 1.4x.
    //
    // Mobile brackets brought in line with the other stage scenes
    // (Arena/Forest/Artisans etc.) after product feedback that the
    // village view was cropping too tightly around the character on
    // phones. Previous values (0.7/0.9/1.15) were noticeably higher
    // than every other scene's mobile zoom.
    const cam = this.cameras.main;
    cam.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    const vw =
      typeof window !== "undefined"
        ? window.innerWidth
        : this.scale.width || 1920;
    let initialZoom: number;
    if (vw < 480) {
      initialZoom = 0.55; // small phones — show most of the map width
    } else if (vw < 768) {
      initialZoom = 0.7; // large phones
    } else if (vw < 1024) {
      initialZoom = 1.0; // tablets
    } else {
      initialZoom = 1.4; // desktop — untouched
    }
    cam.setZoom(initialZoom);
    const start = CHECKPOINTS[0];
    cam.centerOn(start.x, start.y);

    // Lock native touch gestures on the canvas so iOS Safari doesn't
    // intercept our Phaser drag-to-pan with page pan / pinch-zoom /
    // double-tap zoom. Without this the map jitters on iPhones during
    // a drag and the whole page can rubber-band. Android Chrome
    // honours the same rule — no downside.
    try {
      const canvas = this.game.canvas as HTMLCanvasElement | undefined;
      if (canvas) {
        canvas.style.touchAction = "none";
        // Also kill the gray tap-flash on iOS.
        canvas.style.webkitTapHighlightColor = "transparent";
      }
    } catch {
      /* no-op — canvas may not be available in headless test envs */
    }

    // 3. Drag-to-pan (works for mouse + touch on mobile via Phaser's
    // pointer abstraction).
    //
    // ── Ghost-drag fix ────────────────────────────────────────────────
    // Bug seen in the wild: opening the CheckpointPanel by clicking a
    // marker sometimes left `dragging = true` forever. Repro: mouse
    // DOWN on the Phaser canvas → React mounts the panel → mouse
    // UP happens over the panel's DOM, which stops event propagation
    // so Phaser's `pointerup` never fires → the next mouse MOVE (with
    // no button held) still passes the `if (!dragging) return` guard
    // and pans the camera. User perceives this as "the map moves as
    // the mouse pointer moves" whenever the CP panel is open.
    //
    // Two-layer fix:
    //   (a) In pointermove, verify `p.isDown` — a real drag requires a
    //       held button. If nothing is pressed, force-release dragging.
    //   (b) Add a window-level pointerup listener so button-release
    //       outside the canvas (e.g. on the CP panel) also resets the
    //       flag. Cleaned up on scene shutdown.
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
      // Guard (a): if we THINK we're dragging but no button is
      // actually held, the pointerup was swallowed by an overlay
      // (CheckpointPanel, tools sheet, etc.). Reset and bail so the
      // camera stops chasing the cursor.
      if (dragging && !p.isDown) {
        dragging = false;
        return;
      }
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
    // Guard (b): mouseup / touchend anywhere on the page (including on
    // top of React overlays) also clears the drag flag.
    const releaseDrag = () => {
      dragging = false;
    };
    if (typeof window !== "undefined") {
      window.addEventListener("mouseup", releaseDrag);
      window.addEventListener("touchend", releaseDrag);
      window.addEventListener("touchcancel", releaseDrag);
      window.addEventListener("blur", releaseDrag);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        window.removeEventListener("mouseup", releaseDrag);
        window.removeEventListener("touchend", releaseDrag);
        window.removeEventListener("touchcancel", releaseDrag);
        window.removeEventListener("blur", releaseDrag);
      });
    }

    // 3b. Keyboard capture — arrow keys + WASD drive the CHARACTER
    //     (free-roam), not the camera. E / Space open the nearest CP.
    //     The actual per-frame movement runs in `update()` so it uses
    //     delta-time and stays framerate-independent. Camera follows
    //     the character (see spawnCharacter's startFollow call).
    const keyboard = this.input.keyboard;
    if (keyboard) {
      this.cursors = keyboard.createCursorKeys();
      this.wasd = {
        W: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        E: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
        SPACE: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      };
      // E and SPACE open the nearest CP if one is in range. Wired as
      // one-shot keydown handlers rather than polled in update() so a
      // single tap doesn't fire multiple opens. Viewer-mode blocks the
      // open — spectators can't submit tasks against someone else's CP.
      const openIfInRange = () => {
        if (this.registry?.get?.("viewerMode") === true) return;
        if (this.nearestInteractCp !== null) {
          this.openCheckpointFromKey(this.nearestInteractCp);
        }
      };
      this.wasd.E.on("down", openIfInRange);
      this.wasd.SPACE.on("down", openIfInRange);
    }

    // 3c. Mobile joystick bridge — the React MobileJoystick component
    //     emits { x, y } vectors in [-1, 1] via eventBridge on drag,
    //     and { x: 0, y: 0, released: true } on release. We consume the
    //     vector in update(). Cast is intentional: eventBridge's typed
    //     payload doesn't yet include JOYSTICK_MOVE.
    this.joystickHandler = ((
      e: { x: number; y: number; released?: boolean } | null,
    ) => {
      if (!e || e.released) {
        this.joystickVector = null;
        return;
      }
      this.joystickVector = { x: e.x, y: e.y };
    }) as unknown as (e: { x: number; y: number } | null) => void;
    eventBridge.onPhaser("JOYSTICK_MOVE", this.joystickHandler);

    // 4. Checkpoints
    for (const cp of CHECKPOINTS) {
      this.visuals.push(this.buildCheckpoint(cp));
    }
    this.refreshCheckpointStates();

    // 4b. Corruption overlay — DISABLED per product ask ("remove
    // the corruption mechanism for now WHATEVER U HAVE ADDED").
    // The CorruptionOverlay class + `corruptionPatterns` helpers
    // are still on disk (see systems/corruptionOverlay.ts) — we
    // just don't instantiate them here anymore, so no procedural
    // cracks / atmosphere dim / particles / spore emitters render
    // on the Village map. `_corruption` stays null, and every
    // `this._corruption?.…` callsite silently no-ops. Re-enable
    // by restoring this block.
    this._corruption = null;

    // 4c. Debug overlay for walkability blocked zones — enabled via
    // ?showZones=1 URL parameter. Red translucent rectangles let you
    // tune the BLOCKED_ZONES coordinates visually against the map.
    try {
      const showZones =
        typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).get("showZones") === "1";
      if (showZones) {
        const g = this.add.graphics();
        g.setDepth(50); // above map, below characters
        g.fillStyle(0xff0000, 0.35);
        g.lineStyle(2, 0xff2222, 1);
        BLOCKED_ZONES.forEach((z) => {
          g.fillRect(z.x, z.y, z.w, z.h);
          g.strokeRect(z.x, z.y, z.w, z.h);
        });
      }
    } catch { /* URL parse fail — skip overlay */ }

    // 4d. In-map zone editor — enabled via ?editZones=1. Lets you
    // drag-draw new blocked rectangles right on the map, then copy
    // the JSON into BLOCKED_ZONES. Zones drawn here also block
    // movement LIVE while editing.
    const editor = attachZoneEditor(this, "village");
    _customZonesGetter = editor.getCustomZones;
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      _customZonesGetter = () => [];
    });

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
    //     Wrap in try so a missing spawn asset doesn't stop PHASER_READY.
    try {
      this.spawnMiniGamePoints();
    } catch (e) {
      console.warn("[VillageMapScene] spawnMiniGamePoints failed:", e);
    }

    // 8. Notify React that the scene is ready. The /map/world page.tsx
    // waits for this event before hiding the "Entering the world..."
    // loading screen. **This MUST always fire** even if some spawn calls
    // above threw silently -- otherwise the loading screen hangs forever
    // on production when a single asset 404s.
    eventBridge.dispatchToReact({ type: "PHASER_READY" });

    // 9. React → Phaser: after the "Stage 1 Complete" overlay closes we
    //    pan east to preview the next biome.
    this.previewStageHandler = (e: { stage: number }) => {
      this.previewNextStage(e.stage);
    };
    eventBridge.onPhaser("PREVIEW_NEXT_STAGE", this.previewStageHandler);
  }

  // ─────────────────────────────────────────────────────────────────────
  // Free-roam update loop
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Called by Phaser every frame. Handles free-roam character movement
   * from keyboard + joystick input, plays the correct walk/idle animation,
   * flips the sprite to face the direction of travel, and refreshes the
   * interact-hint ring on whichever CP is closest.
   *
   * Scripted movement (walkCharacterTo) sets `scriptedMovement=true`
   * so this loop yields to the tween while a scripted walk is running.
   */
  update(_time: number, delta: number): void {
    const char = this.character;
    if (!char) return;

    // Viewer mode: we're spectating someone else's map. Persona stays
    // parked; no keyboard/joystick input applied. Interact hint is also
    // skipped since there's nothing to interact with (task modal is
    // owner-only).
    const viewerMode = this.registry?.get?.("viewerMode") === true;
    if (viewerMode) {
      // Keep shadow glued to the parked character.
      if (this.characterShadow && char) {
        this.characterShadow.setPosition(char.x, char.y + 4);
      }
      return;
    }

    // Read directional input FIRST so we can use it to detect "player
    // wants control" before the scripted/busy gates below. Keyboard is
    // polled; joystick vector was pushed via eventBridge in create's
    // handler.
    let dx = 0;
    let dy = 0;
    if (this.cursors && this.wasd) {
      if (this.cursors.left?.isDown || this.wasd.A.isDown) dx -= 1;
      if (this.cursors.right?.isDown || this.wasd.D.isDown) dx += 1;
      if (this.cursors.up?.isDown || this.wasd.W.isDown) dy -= 1;
      if (this.cursors.down?.isDown || this.wasd.S.isDown) dy += 1;
    }
    if (this.joystickVector) {
      dx += this.joystickVector.x;
      dy += this.joystickVector.y;
    }

    const magnitude = Math.hypot(dx, dy);
    const moving = magnitude > 0.05;

    // PLAYER-INTENT OVERRIDE — if the user is actively pressing a
    // movement key (WASD / arrows / joystick), release ANY stuck
    // scripted-walk or combat-anim lock and let them regain control.
    // Bug seen in the wild: character frozen at a checkpoint because a
    // walk tween lost its onComplete (scene remount race after opening
    // the CheckpointPanel) or a persona victory anim's complete event
    // never fired — the watchdogs eventually clear these, but "press
    // WASD → move" should be instant, not delayed. This override IS
    // the recovery path.
    if (moving) {
      if (this.scriptedMovement) {
        if (this._walkTween) {
          try { this._walkTween.stop(); } catch { /* tween already gone */ }
          try { this._walkTween.remove(); } catch { /* already removed */ }
          this._walkTween = null;
        }
        this.scriptedMovement = false;
        this.isWalking = false;
      }
      if (this._personaAnimBusy) {
        this._personaAnimBusy = false;
        if (this._personaAnimBusyTimer !== null) {
          window.clearTimeout(this._personaAnimBusyTimer);
          this._personaAnimBusyTimer = null;
        }
      }
    }

    // Yield to scripted walks (tween-driven checkpoint transitions).
    if (this.scriptedMovement) {
      // Watchdog: if we think a scripted walk is running but no tween
      // is actually alive, the tween was interrupted (scene pause /
      // remount race / combat overlay teardown) and lost its
      // onComplete. Release the lock so free-roam input works again.
      if (!this._walkTween || !this._walkTween.isPlaying?.()) {
        this.scriptedMovement = false;
        this.isWalking = false;
        this._walkTween = null;
      } else {
        this.updateInteractHint();
        return;
      }
    }

    // Don't accept free-roam input while a persona combat one-shot
    // (attack/hurt/defeat/victory) is mid-play — otherwise the anim
    // is restarted on the next frame and never resolves. The
    // player-intent override above already released this flag if the
    // user is actively pressing a movement key, so this gate now only
    // catches the "combat plays out with no input" case.
    if (this._personaAnimBusy) {
      // Keep shadow glued to character even during the busy anim.
      if (this.characterShadow) {
        this.characterShadow.setPosition(char.x, char.y + 4);
      }
      this.updateInteractHint();
      return;
    }

    if (moving) {
      // Normalise so diagonal movement isn't faster than orthogonal.
      const inv = magnitude > 1 ? 1 / magnitude : 1;
      const nx = dx * inv;
      const ny = dy * inv;
      const speed = VillageMapScene.PLAYER_SPEED * (delta / 1000);
      const targetX = char.x + nx * speed;
      const targetY = char.y + ny * speed;

      // Walkability — hand-defined BLOCKED_ZONES (water bodies +
      // building footprints) + edge clamp. Axis-separated: if only X
      // would enter a zone, block X and allow Y (character slides
      // along walls). Escape-valve: if already inside a zone somehow
      // (spawn glitch), allow any move so player isn't permanently
      // trapped. Feet-hit-point is (x, y+4) since sprite origin is at
      // (0.5, 0.75) — the feet sit just below sprite center.
      const insetX = 30;
      const insetY = 60;
      const clampedX = Phaser.Math.Clamp(targetX, insetX, MAP_WIDTH - insetX);
      const clampedY = Phaser.Math.Clamp(targetY, insetY, MAP_HEIGHT - insetY);
      const feetOffsetY = 4;
      const alreadyBlocked = pointInAnyBlockedZone(char.x, char.y + feetOffsetY);
      if (alreadyBlocked) {
        // Trapped — allow any move to escape.
        char.x = clampedX;
        char.y = clampedY;
      } else {
        // Try X first, then Y — axis-separated so player slides along walls.
        if (!pointInAnyBlockedZone(clampedX, char.y + feetOffsetY)) {
          char.x = clampedX;
        }
        if (!pointInAnyBlockedZone(char.x, clampedY + feetOffsetY)) {
          char.y = clampedY;
        }
      }

      // Pick the correct walk animation based on the dominant axis.
      // Extended personas get 4 directional walk sheets; legacy personas
      // fall back to the single walk sheet + horizontal flip trick.
      const walkKey = this._personaUsesExtended
        ? directionalWalkAnimKey(getCurrentPersonaId(), nx, ny)
        : (this._personaWalkAnimKey ?? "persona-walk");

      if (!this._personaUsesExtended) {
        // Legacy: sprites face right; flip when moving left.
        if (Math.abs(nx) > 0.05) char.setFlipX(nx < 0);
      } else {
        // Extended sheets already contain the correct facing for
        // walk-east / walk-west, so keep flipX off.
        char.setFlipX(false);
      }

      // Swap to walk animation only if the KEY has actually changed —
      // otherwise Phaser restarts the clip every frame and freezes at
      // frame 0, killing the illusion of walking. Guard the play() call
      // so a missing animation clip (persona sheet loaded but anim not
      // registered — happens on legacy personas without the extended
      // directional walk keys) doesn't throw and break the update loop;
      // position updates above already ran regardless.
      if (this._currentPersonaAnimKey !== walkKey) {
        if (this.anims.exists(walkKey)) {
          try { char.play(walkKey); } catch { /* anim glitch — skip */ }
          this._currentPersonaAnimKey = walkKey;
        }
        this.isWalking = true;
      }
    } else if (this.isWalking) {
      const idleKey = this._personaIdleAnimKey ?? "persona-idle";
      if (this.anims.exists(idleKey)) {
        try { char.play(idleKey); } catch { /* anim glitch — skip */ }
        this._currentPersonaAnimKey = idleKey;
      }
      this.isWalking = false;
    }

    // Keep the ground shadow glued to the character.
    if (this.characterShadow) {
      this.characterShadow.setPosition(char.x, char.y + 4);
    }

    // Refresh proximity to the nearest interactable CP.
    this.updateInteractHint();
  }

  /**
   * Compute nearest CP within INTERACT_RADIUS and toggle the interact
   * hint ring on that CP. Also updates `nearestInteractCp` so the E/Space
   * handler knows which CP to open.
   */
  private updateInteractHint(): void {
    const char = this.character;
    if (!char) {
      this.nearestInteractCp = null;
      this.setInteractHintVisible(null);
      return;
    }

    let nearestIdx: number | null = null;
    let nearestDist = VillageMapScene.INTERACT_RADIUS;
    for (let i = 0; i < CHECKPOINTS.length; i++) {
      const cp = CHECKPOINTS[i];
      const d = Phaser.Math.Distance.Between(char.x, char.y, cp.x, cp.y);
      if (d < nearestDist) {
        nearestDist = d;
        nearestIdx = i;
      }
    }

    if (nearestIdx !== this.nearestInteractCp) {
      this.nearestInteractCp = nearestIdx;
      this.setInteractHintVisible(nearestIdx);
    }
  }

  /**
   * Position / show / hide the interact-hint ring. Lazily builds the
   * container on first show so we don't pay the cost until it's needed.
   */
  private setInteractHintVisible(cpIdx: number | null): void {
    if (cpIdx === null) {
      if (this.interactHint) this.interactHint.setVisible(false);
      return;
    }
    const cp = CHECKPOINTS[cpIdx];
    if (!this.interactHint) {
      // Ring wraps the CHECKPOINT MARKER itself (roughly the size of
      // the painted disc) so it reads as "activate this checkpoint",
      // not as a UFO hovering above it. Label sits just above the ring.
      const ring = this.add.circle(0, 0, 28, 0xfde047, 0);
      ring.setStrokeStyle(2.5, 0xfde047, 0.95);
      // "PRESS E" label removed per product ask ("remove press E
      // written"). The pulsing amber ring alone communicates "this
      // CP is interactable" — the E key still works, we just no
      // longer paint the hint text over the boss sprite.
      // Container anchored ON the CP marker (cp.x, cp.y), not floating
      // above it. Previously used cp.y - 40 which lifted the whole
      // hint way above the marker and read as unrelated to it.
      const container = this.add.container(cp.x, cp.y, [ring]);
      container.setDepth(150);
      this.tweens.add({
        targets: ring,
        scale: { from: 1, to: 1.25 },
        alpha: { from: 0.95, to: 0.4 },
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
      this.interactHint = container;
    }
    this.interactHint.setPosition(cp.x, cp.y);
    this.interactHint.setVisible(true);
  }

  /**
   * Bridge E/Space keydown to the existing checkpoint-click handler.
   * Reuses onCheckpointClicked so the React side sees the exact same
   * event it would from a mouse click on the marker.
   */
  private openCheckpointFromKey(cpIdx: number): void {
    const cp = CHECKPOINTS[cpIdx];
    if (!cp) return;
    this.onCheckpointClicked(cp);
  }

  // ─────────────────────────────────────────────────────────────────────
  // Boss spawn / management
  // ─────────────────────────────────────────────────────────────────────

  private spawnMiniBosses(): void {
    // NEW BOSS CONTINUITY MODEL (per product spec):
    // ONE stage boss (Fog of Vagueness for the Village) walks the whole
    // path — it starts at CP1, RETREATS to CP2 when CP1's tasks are
    // done, retreats to CP3 when CP2's tasks are done, retreats to CP4
    // when CP3's are done, and finally DIES on CP4 when its tasks are
    // done. That means we only spawn ONE physical sprite (the first
    // def in VILLAGE_MINI_BOSSES = Fog) and reposition it on advance;
    // the remaining boss defs (Chimera / Doubt Imp / Metric Ghost) stay
    // in the config for boss-name lookups and taunt copy but their
    // sprites are not instantiated on the world map.
    //
    // See `advanceToNextCheckpoint` for the retreat tween; see
    // `refreshMiniBossVisibility` for the "only render the moving boss"
    // rule that replaces the old per-CP visibility gating.
    for (let idx = 0; idx < VILLAGE_MINI_BOSSES.length; idx += 1) {
      const def = VILLAGE_MINI_BOSSES[idx];
      // Only CP1 (idx 0) actually spawns a sprite — the moving boss.
      // Other CPs push nulls so downstream array-index math is safe.
      const isMovingBoss = idx === 0;
      const cp = CHECKPOINTS[def.checkpointIndex];
      if (!isMovingBoss || !cp || !this.textures.exists(def.idleKey)) {
        this.miniBossSprites.push(null);
        this.miniBossBobTweens.push(null);
        this.miniBossTendrilStoppers.push(null);
        this.miniBossTauntStoppers.push(null);
        this.miniBossHpBars.push(null);
        this.miniBossAuras.push(null);
        this.miniBossTauntFired.push(false);
        this.miniBossAnimKeys.push(null);
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

      // Register idle-loop anim — prefer the multi-frame idle sheet
      // (Pixellab pipeline) over the legacy walk/run loop. Falls back
      // to loopKey for legacy bosses whose idle is a single frame.
      let idleAnimKey: string | null = null;
      if (def.idleFrameCount > 1) {
        idleAnimKey = `${def.idleKey}-idleLoop`;
        if (!this.anims.exists(idleAnimKey)) {
          this.anims.create({
            key: idleAnimKey,
            frames: this.anims.generateFrameNumbers(def.idleKey, {
              start: 0,
              end: def.idleFrameCount - 1,
            }),
            frameRate: 6,
            repeat: -1,
          });
        }
        sprite.play(idleAnimKey);
      } else if (useLoop) {
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
            frameRate: 10,
            repeat: 0,
          });
        }
      }

      // Register hurt / defeat / victory one-shots when the sheets are
      // present (Pixellab pipeline). Each plays once then holds the last
      // frame; playBossState() handles the return-to-idle behavior.
      let hurtAnimKey: string | null = null;
      if (def.hurtKey && this.textures.exists(def.hurtKey)) {
        hurtAnimKey = `${def.hurtKey}-hurt`;
        if (!this.anims.exists(hurtAnimKey)) {
          this.anims.create({
            key: hurtAnimKey,
            frames: this.anims.generateFrameNumbers(def.hurtKey, {
              start: 0,
              end: (def.hurtFrameCount ?? 1) - 1,
            }),
            frameRate: 10,
            repeat: 0,
          });
        }
      }
      let defeatAnimKey: string | null = null;
      if (def.defeatKey && this.textures.exists(def.defeatKey)) {
        defeatAnimKey = `${def.defeatKey}-defeat`;
        if (!this.anims.exists(defeatAnimKey)) {
          this.anims.create({
            key: defeatAnimKey,
            frames: this.anims.generateFrameNumbers(def.defeatKey, {
              start: 0,
              end: (def.defeatFrameCount ?? 1) - 1,
            }),
            frameRate: 8,
            repeat: 0,
          });
        }
      }
      let victoryAnimKey: string | null = null;
      if (def.victoryKey && this.textures.exists(def.victoryKey)) {
        victoryAnimKey = `${def.victoryKey}-victory`;
        if (!this.anims.exists(victoryAnimKey)) {
          this.anims.create({
            key: victoryAnimKey,
            frames: this.anims.generateFrameNumbers(def.victoryKey, {
              start: 0,
              end: (def.victoryFrameCount ?? 1) - 1,
            }),
            frameRate: 8,
            repeat: 0,
          });
        }
      }

      // Product decision — bosses stand STATIC on the map. No bob, no
      // ambient tendrils, no taunt loop. Bosses only animate during
      // combat / weaken / defeat events. Reads as a threat waiting for
      // you rather than a busy background element.
      const bob = this.tweens.add({
        targets: sprite,
        y: sprite.y, // no delta — tween exists purely so the ref shape
        duration: 1,
        repeat: 0,
      });
      bob.stop(); // static from the moment it spawns

      // Tendrils/aura are ambient VFX around the boss — disabled to
      // keep the boss reading as a stone-still threat. Nulls make
      // downstream `if (aura) …` guards skip the animation calls
      // cleanly, so no other code path needs to change.
      const tendrilStop: (() => void) | null = null;
      const aura = null;
      // Boss HP bar above the sprite removed on the world map per
      // product ask ("you can remove fog of vagueness XP bar on the
      // map"). The same HP is still shown in the bottom HUD's
      // PROJECT vs BOSS bar and inside CombatPanel, so no gameplay
      // information is lost — this only strips the floating red
      // sliver that was crowding the boss sprite. The array slot
      // still gets a `null` push below so downstream index math
      // (miniBossHpBars[i], setHp guarded by `if (hp) …`) keeps
      // working unchanged.
      const hpBar = null;

      // No taunt loop — boss stands still.
      const tauntStop: (() => void) | null = null;

      this.miniBossSprites.push(sprite);
      this.miniBossBobTweens.push(bob);
      this.miniBossTendrilStoppers.push(tendrilStop);
      this.miniBossTauntStoppers.push(tauntStop);
      this.miniBossHpBars.push(hpBar);
      this.miniBossAuras.push(aura);
      this.miniBossTauntFired.push(false);
      this.miniBossAnimKeys.push({
        idle: idleAnimKey,
        attack: attackAnimKey,
        hurt: hurtAnimKey,
        defeat: defeatAnimKey,
        victory: victoryAnimKey,
      });
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
    // New model: there's only ONE physical boss sprite (index 0 — the
    // moving stage boss). It stays visible for the whole stage — its
    // POSITION changes on advance (see retreatBossTo). Cleared / final
    // state (boss dispelled) is enforced by the dispel path, not by
    // this method. Other array slots hold nulls, so setVisible loops
    // just no-op them.
    for (let i = 0; i < VILLAGE_MINI_BOSSES.length; i++) {
      const sprite = this.miniBossSprites[i];
      if (!sprite) continue;
      // The moving boss lives at index 0 and is always visible until
      // the final CP is cleared. Every other slot is either null
      // (skipped above) or a legacy sprite that shouldn't render.
      const isMovingBoss = i === 0;
      sprite.setVisible(isMovingBoss);
      const aura = this.miniBossAuras[i];
      if (aura) aura.setVisible(isMovingBoss);
      const hpBar = this.miniBossHpBars[i];
      if (hpBar) hpBar.setVisible(isMovingBoss);
    }
    // Super Boss (Unraveller) — kept hidden for now per demo constraint.
    // The updateSuperBossReveal is still called so the code path stays
    // exercised; if the super boss sprite is present it will update alpha.
    this.updateSuperBossReveal();
  }

  /**
   * Retreat the (single) moving stage boss from its current checkpoint
   * to the target checkpoint. Called by advanceToNextCheckpoint when
   * the user clears a non-final CP — the boss backs away toward the
   * next CP marker (with its aura + HP bar dragged along) so the map
   * reads as "the boss just retreated" instead of "the boss died and a
   * new one popped up". On the FINAL CP we don't call this — we
   * dispelMiniBoss(0) so the boss dies on-screen.
   */
  private retreatBossTo(targetCpIdx: number): void {
    const sprite = this.miniBossSprites[0];
    const def = VILLAGE_MINI_BOSSES[0];
    if (!sprite || !def) return;
    const target = CHECKPOINTS[targetCpIdx];
    if (!target) return;

    const targetX = target.x + def.offsetX;
    const targetY = target.y + def.yOffset;
    // Face the direction of retreat (flipX flip while moving east).
    const movingEast = targetX > sprite.x;
    sprite.setFlipX(!movingEast); // face AWAY from the direction of travel
    // Aura, HP bar, and any lingering fx should track the sprite too.
    const aura = this.miniBossAuras[0];
    const hpBar = this.miniBossHpBars[0];
    const RETREAT_MS = 1400;

    this.tweens.add({
      targets: sprite,
      x: targetX,
      y: targetY,
      duration: RETREAT_MS,
      ease: "Sine.easeInOut",
      onComplete: () => {
        // Face the character again once retreat lands.
        sprite.setFlipX(def.offsetX > 0);
      },
    });
    if (aura) {
      this.tweens.add({
        targets: aura,
        x: targetX,
        y: targetY - sprite.displayHeight * 0.5,
        duration: RETREAT_MS,
        ease: "Sine.easeInOut",
      });
    }
    // HP bar tracks the sprite via its own follow loop, so no manual
    // tween is required — moving the sprite is enough.
    void hpBar;
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
    // Boss taunt bubbles ("Your idea has no edges…", etc.) DISABLED
    // per product ask ("REMOVE TEXT" — screenshot showed the taunt
    // hovering over the Fog boss on the map). Kept the method as a
    // no-op so the two call sites (delayedCall + advance handler)
    // continue to work without touching them. Re-enable by uncommenting
    // the original block below.
    const idx = this.currentIndex;
    this.miniBossTauntFired[idx] = true;
    return;
    /*
    const sprite = this.miniBossSprites[idx];
    const def = VILLAGE_MINI_BOSSES[idx];
    if (!sprite || !sprite.visible || !def) return;
    if (this.miniBossTauntFired[idx]) return;
    if (def.taunts.length === 0) return;
    const line = def.taunts[Math.floor(Math.random() * def.taunts.length)];
    showBossTaunt(this, sprite, line, 3600);
    this.miniBossTauntFired[idx] = true;
    */
  }

  /**
   * P0 #4 — visually weaken the active checkpoint's mini-boss as tasks
   * complete. Called from React on task submission. tasksDone in [0..3].
   * Also updates the HP bar AND lights up the corresponding task-fill
   * star on the checkpoint marker.
   */
  /**
   * Called by the React map page as soon as it knows which of the 12
   * pool super bosses this venture drew (from Convex
   * `venture.assignedBosses[0]` → SUPER_BOSS_POOL index). The scene
   * stores the entry and swaps the super-boss silhouette texture +
   * taunt copy at reveal time (see `fullRevealSuperBoss`). Safe to
   * call multiple times — the reveal path re-reads this field on each
   * invocation, and it's a no-op if the reveal already happened.
   */
  public setAssignedPoolBoss(entry: SuperBossPoolEntry | null): void {
    this.assignedPoolBoss = entry;
    // If the reveal hasn't fired yet and the sprite is already
    // placed (silhouette phase, alpha 0.12), pre-swap the texture
    // so users see the correct silhouette while still faded.
    // Swapping AFTER reveal is a no-op — reveal already applied
    // the assigned texture in fullRevealSuperBoss.
    if (this.superBossRevealed) return;
    if (!this.superBossSprite || !entry) return;
    // Prefer the idle animation if it's registered (breathing loop),
    // else fall back to the static texture. The reveal call will
    // re-issue the same swap under the same rules so this
    // pre-swap is purely a "correct silhouette while faded" nicety.
    const idleAnimKey = `pool-boss-anim-key:${entry.id}:idle`;
    const staticKey = `pool-boss-idle:${entry.id}`;
    if (this.anims.exists(idleAnimKey)) {
      this.superBossSprite.play(idleAnimKey);
    } else if (this.textures.exists(staticKey)) {
      this.superBossSprite.setTexture(staticKey);
    }
  }

  public weakenActiveBoss(tasksDone: number, tasksTotal: number = 3): void {
    const idx = this.currentIndex;
    const sprite = this.miniBossSprites[idx];
    if (sprite && sprite.visible) {
      weakenBoss(this, sprite, tasksDone, tasksTotal);
      const hp = this.miniBossHpBars[idx];
      if (hp) hp.setHp(1 - tasksDone / tasksTotal);
      // Bosses face the player character while taking damage.
      if (this.character) bossFaceTarget(sprite, this.character.x);
      // Fire the Pixellab hurt animation if the boss has one; this is
      // what makes the mist "recoil" visually. Persona swings attack.
      this.playBossState(idx, "hurt");
    }
    // Persona attack swing — tracks each task landing.
    this.playPersonaState("attack");
    // Fill the task-progress stars on the checkpoint marker regardless of
    // whether the boss is visible.
    this.setCheckpointTaskFill(idx, tasksDone);
    // Update the corruption overlay for THIS CP's segment. 2/3 → 10%
    // opacity + weakened monster; 3/3 → 0% + shatter burst.
    this._corruption?.updateSegment(idx, tasksDone);
    // Subtle confirm click on each hit so the user feels the damage land.
    try { audioManager.playUI("confirm"); } catch { /* audio not critical */ }
  }

  /**
   * Public: apply a full CheckpointState[] snapshot to the corruption
   * overlay. Called from the React map page whenever CP progress data
   * changes (initial load + realtime Convex updates).
   *
   * States must be ordered by checkpoint number (matches CHECKPOINTS array).
   * Extra states past CHECKPOINTS.length are ignored (belong to other stages).
   */
  public applyCorruptionState(states: CheckpointState[]): void {
    this._lastCheckpointStates = states;
    this._corruption?.applyCheckpointStates(states);
  }

  /**
   * Play a one-shot combat state animation on the persona sprite.
   *   idle    → return to breathing loop (also clears defeat KO pose)
   *   attack  → one-shot; auto-returns to idle
   *   hurt    → one-shot; auto-returns to idle
   *   defeat  → one-shot; HOLDS last frame until playPersonaState("idle")
   *   victory → one-shot; auto-returns to idle
   *
   * Silently no-ops when the persona doesn't have the extended set or
   * the requested clip isn't registered.
   */
  public playPersonaState(
    state: "idle" | "attack" | "hurt" | "defeat" | "victory",
  ): void {
    const char = this.character;
    if (!char || !this._personaUsesExtended) return;
    // Clear any prior safety timeout — new state wins.
    if (this._personaAnimBusyTimer !== null) {
      window.clearTimeout(this._personaAnimBusyTimer);
      this._personaAnimBusyTimer = null;
    }
    if (state === "idle") {
      this._personaAnimBusy = false;
      const idleKey = this._personaIdleAnimKey;
      if (idleKey && this.anims.exists(idleKey)) {
        char.play(idleKey);
        this._currentPersonaAnimKey = idleKey;
      }
      return;
    }
    const key = personaAnimKey(getCurrentPersonaId(), state);
    if (!this.anims.exists(key)) return;
    this._personaAnimBusy = true;
    char.play(key);
    this._currentPersonaAnimKey = key;
    // ── SAFETY-NET ────────────────────────────────────────────────
    // The ANIMATION_COMPLETE handler in spawnCharacter() normally
    // clears _personaAnimBusy after the clip ends. But if the sprite
    // is interrupted or the event misfires (rare Phaser edge cases),
    // the busy flag can get stuck TRUE and freeze the character
    // forever — no idle, no walk. Belt-and-braces: force-clear after
    // 1600ms (longer than any one-shot clip at 8-12fps × 9 frames)
    // and drop back to idle. Defeat is exempt — it's supposed to
    // hold its last frame until explicitly revived.
    if (state !== "defeat") {
      this._personaAnimBusyTimer = window.setTimeout(() => {
        this._personaAnimBusyTimer = null;
        if (!this._personaAnimBusy) return;
        this._personaAnimBusy = false;
        const idleKey = this._personaIdleAnimKey;
        if (this.character && idleKey && this.anims.exists(idleKey)) {
          this.character.play(idleKey);
          this._currentPersonaAnimKey = idleKey;
        }
      }, 1600);
    }
  }

  /**
   * Play a boss state on the given checkpoint's mini-boss sprite.
   * Uses the animation keys populated during spawnMiniBosses. Auto-returns
   * to idle for hurt/attack/victory; holds last frame for defeat.
   */
  public playBossState(
    checkpointIndex: number,
    state: "idle" | "attack" | "hurt" | "defeat" | "victory",
  ): void {
    const sprite = this.miniBossSprites[checkpointIndex];
    const keys = this.miniBossAnimKeys[checkpointIndex];
    if (!sprite || !keys) return;

    if (state === "idle") {
      if (keys.idle && this.anims.exists(keys.idle)) sprite.play(keys.idle);
      return;
    }

    const targetKey = keys[state];
    if (!targetKey || !this.anims.exists(targetKey)) return;
    sprite.play(targetKey);
    // Attach a one-shot completion handler that returns to idle unless
    // this was "defeat" (KO — hold last frame) or "victory" (dominating
    // pose — hold last frame briefly then return to idle for map).
    const returnToIdle = () => {
      if (state === "defeat") return; // hold KO pose
      if (keys.idle && this.anims.exists(keys.idle)) sprite.play(keys.idle);
    };
    sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, returnToIdle);
  }

  /** Convenience wrappers for React → Phaser combat events. */
  public onCombatVictory(): void {
    this.playPersonaState("victory");
    this.playBossState(this.currentIndex, "defeat");
  }
  public onCombatDefeat(): void {
    this.playPersonaState("defeat");
    this.playBossState(this.currentIndex, "victory");
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
   * P0 #3 — fully reveal the venture's assigned super boss and shake
   * the world. Called when the last checkpoint is cleared. If the
   * venture has an assigned pool boss (React page called
   * setAssignedPoolBoss before this fires), the silhouette texture
   * + taunt copy swap to that boss's identity. Falls back to The
   * Unraveller (original hardcoded reveal) when no assignment.
   */
  private async fullRevealSuperBoss(): Promise<void> {
    const sprite = this.superBossSprite;
    if (!sprite || this.superBossRevealed) return;
    this.superBossRevealed = true;
    if (this.superBossBobTween) this.superBossBobTween.stop();

    // Swap the silhouette texture to the assigned pool boss if we
    // have one AND its idle texture actually preloaded. Otherwise
    // keep the default Unraveller silhouette.
    //
    // If the assigned boss ships an animated idle sheet (registered
    // in create() as `pool-boss-anim-key:<id>:idle`), we swap to
    // THAT animation on reveal so the boss breathes/loops instead
    // of holding a single static frame. Static-only bosses fall
    // back to the plain texture swap. Both paths preserve the
    // family tint so bossAnimator VFX stay coherent.
    const assigned = this.assignedPoolBoss;
    if (assigned) {
      const idleAnimKey = `pool-boss-anim-key:${assigned.id}:idle`;
      const staticKey = `pool-boss-idle:${assigned.id}`;
      if (this.anims.exists(idleAnimKey)) {
        // Play the breathing/idle loop — Phaser handles the texture
        // swap internally via the animation frames.
        sprite.play(idleAnimKey);
      } else if (this.textures.exists(staticKey)) {
        sprite.setTexture(staticKey);
      }
      tagBossFamily(sprite, "serpent");
    }

    // Ensure sprite is at least somewhat visible before the pan starts
    sprite.setAlpha(Math.max(sprite.alpha, 0.4));
    // Swap to the Unraveller's own music track for the reveal moment.
    // stage_village fades under boss_unraveller so the pan/shake lands
    // with a new sonic identity. Kept for every pool boss — pool
    // bosses inherit the Unraveller theme until per-boss tracks ship.
    try {
      audioManager.playMusic("boss_unraveller", 0.55);
    } catch { /* audio not critical */ }

    // Fire the persona's heroic victory pose in parallel with the reveal.
    // Delayed slightly (~200ms) so the pan is already underway when the
    // character reacts to the boss — cinematic beat.
    this.time.delayedCall(200, () => this.playPersonaVictoryPose());

    await revealBoss(this, sprite, {
      panDurationMs: 900,
      shakeIntensity: 0.011,
    });
    // Ominous line — per-boss taunt when we have one, else the classic
    // Unraveller vagueness line.
    const tauntLine = assigned
      ? `The ${assigned.name} watches. ${assigned.represents}. Come find me.`
      : "So you've unraveled the vagueness. Come find me.";
    showBossTaunt(this, sprite, tauntLine, 4000);
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

    // ── Persona-aware sprite keys ─────────────────────────────────────
    // Prefer the persona picked in the picker (via getCurrentPersonaId
    // read at preload). If that texture didn't load (art missing, path
    // 404, etc.), fall through to the legacy village-persona-* keys
    // pointing at the fantasy character so the scene still renders.
    const personaId = getCurrentPersonaId();
    const personaIdleKey = personaSpriteKey(personaId, "idle");
    const personaWalkKey = personaSpriteKey(personaId, "walk");
    const idleTextureKey = this.textures.exists(personaIdleKey)
      ? personaIdleKey
      : "village-persona-idle";
    const walkTextureKey = this.textures.exists(personaWalkKey)
      ? personaWalkKey
      : "village-persona-walk";
    if (!this.textures.exists(idleTextureKey)) return;

    // Register persona animations if the persona sheet loaded — this
    // creates `persona-anim:<id>:{idle,walk}` clips scoped to the
    // per-persona frame count/fps. When falling back to the legacy
    // sheet, we keep the older `persona-idle` / `persona-walk` keys
    // so no other code has to change.
    registerPersonaAnimations(this, personaId);

    // HD pixel-art: force NEAREST filter on both spritesheets so the
    // 32×48 pixel art stays crisp when scaled instead of blurring
    // through linear interpolation.
    this.textures.get(idleTextureKey).setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.textures.get(walkTextureKey).setFilter(Phaser.Textures.FilterMode.NEAREST);

    // Compute the animation clip keys we're going to play. Persona
    // keys when the persona sheet is live, legacy keys otherwise.
    const persona = getPersona(personaId);
    const usingPersonaSheet = idleTextureKey === personaIdleKey;
    const idleAnimKey = usingPersonaSheet
      ? personaAnimKey(personaId, "idle")
      : "persona-idle";
    const walkAnimKey = usingPersonaSheet
      ? personaAnimKey(personaId, "walk")
      : "persona-walk";
    // Store the resolved keys on the scene so walk/idle transitions
    // downstream (walkCharacterTo, tween onComplete) can use them.
    this._personaIdleAnimKey = idleAnimKey;
    this._personaWalkAnimKey = walkAnimKey;
    this._personaUsesExtended = usingPersonaSheet && personaHasExtended(personaId);

    // Legacy fallback animation clips — only registered if we're on
    // the fantasy sprite (i.e. persona sheet wasn't found).
    if (!usingPersonaSheet && !this.anims.exists("persona-idle")) {
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
    if (!usingPersonaSheet && !this.anims.exists("persona-walk")) {
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
    void persona; // reserved for future accent-color usage

    // Persistent soft ground shadow so the character feels planted on the
    // marker instead of floating. Sits BELOW the character sprite depth so
    // it renders under their feet. Uses the same (CHAR_X_OFFSET,
    // CHAR_Y_OFFSET) as the sprite so it tracks the top-left standpoint.
    this.characterShadow = this.add.ellipse(
      active.x + CHAR_X_OFFSET,
      active.y + CHAR_Y_OFFSET + 4,
      54,
      14,
      0x000000,
      0.42,
    );
    this.characterShadow.setDepth(95); // just under character (100)

    this.character = this.add.sprite(
      active.x + CHAR_X_OFFSET,
      active.y + CHAR_Y_OFFSET,
      idleTextureKey,
    );
    // Bottom-center origin so setPosition(cp.x, cp.y) lands the character's
    // feet EXACTLY on the checkpoint marker — no offset math needed.
    // For extended (Pixellab) personas the character body sits in the
    // MIDDLE of the 88×88 frame (feet around row 65), so anchor at 0.75
    // instead of 1.0 to plant the visible feet on the marker rather
    // than the transparent bottom edge of the frame.
    if (this._personaUsesExtended) {
      this.character.setOrigin(0.5, 0.75);
    } else {
      this.character.setOrigin(0.5, 1);
    }
    // Extended (88×88) sheets: the Pixellab character silhouette usually
    // occupies only the middle ~30×45px of the 88-frame with the rest
    // being transparent padding. Scale accordingly so the visible
    // character reads at roughly the same size as the legacy 32×48
    // sprite (~76×115 world px at CHAR_SCALE=2.4).
    if (this._personaUsesExtended) {
      // Alchemist frames are 88×88; second-wave personas (arcanist etc.)
      // are 92×92. Compensate so the on-screen character stays roughly
      // the same size regardless of the source frame size — target a
      // ~150px displayed height across all personas.
      const persona = getPersona(personaId);
      const frameH = persona.extended?.frameHeight ?? 88;
      this.character.setScale(150 / frameH);
    } else {
      this.character.setScale(CHAR_SCALE);
    }
    this.character.setDepth(100); // above painted map + checkpoint marker
    this.character.play(idleAnimKey);
    this._currentPersonaAnimKey = idleAnimKey;

    // When any one-shot combat anim ends, drop back to idle and clear
    // the busy flag so update() resumes accepting free-roam input.
    // Defeat clips are the ONLY exception — they hold their final KO
    // frame until playPersonaState("idle") explicitly revives.
    this.character.on(
      Phaser.Animations.Events.ANIMATION_COMPLETE,
      (anim: Phaser.Animations.Animation) => {
        const key = anim.key;
        // Ignore idle-loop completion events (idle never actually
        // "completes" but Phaser can fire a spurious complete on
        // interrupt — guard against it clearing the state wrongly).
        if (this._personaIdleAnimKey && key === this._personaIdleAnimKey) {
          return;
        }
        if (key.endsWith(":defeat")) {
          this._personaAnimBusy = false;
          if (this._personaAnimBusyTimer !== null) {
            window.clearTimeout(this._personaAnimBusyTimer);
            this._personaAnimBusyTimer = null;
          }
          return; // hold last frame
        }
        // Any other one-shot (attack/hurt/victory) finished → drop
        // to idle unconditionally. Don't gate on _personaAnimBusy —
        // if the flag somehow got out of sync, we still want the
        // sprite to return to a playable state.
        this._personaAnimBusy = false;
        if (this._personaAnimBusyTimer !== null) {
          window.clearTimeout(this._personaAnimBusyTimer);
          this._personaAnimBusyTimer = null;
        }
        if (this.character && this._personaIdleAnimKey) {
          this.character.play(this._personaIdleAnimKey);
          this._currentPersonaAnimKey = this._personaIdleAnimKey;
        }
      },
    );

    // ── Free-roam camera follow ────────────────────────────────────
    // Camera softly tracks the character as they walk around instead
    // of snapping to CP markers. Deadzone keeps the sprite roughly in
    // the center third so tiny movements don't jitter the whole view.
    const cam = this.cameras.main;
    cam.startFollow(this.character, true, 0.08, 0.08);
    const dzW = Math.min(220, this.scale.width * 0.24);
    const dzH = Math.min(160, this.scale.height * 0.24);
    cam.setDeadzone(dzW, dzH);

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
      this.walkCharacterTo(cp.x + CHAR_X_OFFSET, cp.y + CHAR_Y_OFFSET);
    } else {
      this.character.setPosition(cp.x + CHAR_X_OFFSET, cp.y + CHAR_Y_OFFSET);
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
    // Pick the correct walk animation for the scripted direction of
    // travel — extended personas get their 4-directional sheet; legacy
    // personas fall back to the flip-horizontal trick.
    const dx = x - char.x;
    const dy = y - char.y;
    let walkKey: string;
    if (this._personaUsesExtended) {
      walkKey = directionalWalkAnimKey(getCurrentPersonaId(), dx, dy);
      char.setFlipX(false);
    } else {
      walkKey = this._personaWalkAnimKey ?? "persona-walk";
      char.setFlipX(x < char.x);
    }
    char.play(walkKey);
    this._currentPersonaAnimKey = walkKey;
    this.scriptedMovement = true;
    this.isWalking = true;
    // Kill any prior walk tween FIRST. Phaser will silently drop the
    // old tween's onComplete if we just add a second one on the same
    // target, which strands scriptedMovement=true forever and freezes
    // WASD input. Explicit removal guarantees cleanup.
    if (this._walkTween && this._walkTween.isPlaying?.()) {
      this._walkTween.stop();
      this._walkTween.remove();
    }
    this._walkTween = this.tweens.add({
      targets: char,
      x,
      y,
      duration: VillageMapScene.WALK_DURATION_MS,
      ease: "Sine.easeInOut",
      onComplete: () => {
        if (!this._personaUsesExtended) char.setFlipX(false); // face down on arrival
        const idleKey = this._personaIdleAnimKey ?? "persona-idle";
        char.play(idleKey);
        this._currentPersonaAnimKey = idleKey;
        this.scriptedMovement = false;
        this.isWalking = false;
        this._walkTween = null;
        // Small beat then run the "inspect" gesture on the checkpoint
        // the character just arrived at (nearest to their current pos).
        this.time.delayedCall(180, () => this.playInteractGesture());
      },
      onStop: () => {
        // If Phaser stopped the tween for any reason (scene pause,
        // new walk starting, sprite destroyed), release the lock so
        // free-roam input can resume immediately.
        this.scriptedMovement = false;
        this.isWalking = false;
        this._walkTween = null;
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
    // Snapshot BEFORE incrementing — decides retreat vs. dispel.
    const isFinalCp = this.currentIndex >= CHECKPOINTS.length - 1;
    this.playCompassCalibration(from.x, from.y, gold, () => {
      // Boss behaviour:
      //   - Non-final CP (1, 2, 3): the ONE stage boss RETREATS to the
      //     next CP. It's still alive, just backed away.
      //   - Final CP (4): the boss dies here. Play the dispel VFX +
      //     shatter and free the sprite for good.
      if (isFinalCp) {
        this.dispelMiniBoss(0);
      } else {
        this.retreatBossTo(this.currentIndex + 1);
      }
      // Reward — checkpoint clear grants a bigger XP burst than a task.
      // Gold clears (all 3 tasks perfect) give +75 vs. the standard +50.
      eventBridge.dispatchToReact({
        type: "XP_AWARDED",
        amount: gold ? 75 : 50,
        label: gold ? "Gold Checkpoint" : "Checkpoint",
      });
      if (isFinalCp) {
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

      // Walk the character from previous CP to this one — landing on
      // the top-left standpoint of the new CP (see CHAR_X_OFFSET).
      if (this.character) {
        this.walkCharacterTo(to.x + CHAR_X_OFFSET, to.y + CHAR_Y_OFFSET);
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
    // Viewer mode: reading someone else's map — CP clicks are inert.
    if (this.registry?.get?.("viewerMode") === true) return;
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
