/**
 * @file stage-bosses.ts
 * @description Boss roster for every Venture stage. Expanded from the
 *  original village-only `village-bosses.ts` to cover stages 1-4 now
 *  that art is available.
 *
 *  Each stage has 4 mini-bosses (one per checkpoint) + 1 super-boss
 *  (the stage-final encounter).
 *
 *  The `village-bosses.ts` module still exists for backwards-compat and
 *  re-exports the Village entries from here.
 *
 *  ── ANIMATION METADATA (added for map-parity work) ────────────────
 *  Each boss now optionally carries `attackAsset` / `hurtAsset` /
 *  `defeatAsset` / `victoryAsset` paths + a Pixellab frame descriptor
 *  (`frameCount` + `frameWidth`/`frameHeight`). Scenes read these via
 *  the shared `stageMapAnimations` helper to spawn a full state
 *  machine (idle → attack → hurt → defeat → victory) with graceful
 *  fallback (defeat missing → hurt; victory missing → attack).
 *  Bosses without any of these fields fall back to a static image at
 *  the idleAsset path, matching the pre-parity behavior.
 */

import type { VillageBossFamily, VillageBossInfo } from "./village-bosses";

/**
 * Animation clip descriptor. When `frameCount > 1` the loader will
 * request a spritesheet with `frameWidth`/`frameHeight` (Pixellab
 * sheets are 92×92×9 or 88×88×9). When `frameCount === 1` OR the
 * fields are omitted, the asset is treated as a single-frame image.
 */
export interface BossClipMeta {
  asset: string;
  frameCount: number;
  frameWidth?: number;
  frameHeight?: number;
  /** Frames per second when the clip plays. Idle defaults to 6, combat
   *  one-shots default to 10 (feels punchy). */
  fps?: number;
}

/** Extends VillageBossInfo with the concept of super-boss vs mini,
 *  plus optional per-clip Pixellab spritesheet metadata. */
export interface StageBoss extends Omit<VillageBossInfo, "checkpointIndex"> {
  /** Which checkpoint (0-based) this boss guards. -1 = super-boss. */
  checkpointIndex: number;
  /** True for the stage-final super-boss encounter. */
  isSuper?: boolean;
  /** 3 thematic questions for the super-boss combat (only used when isSuper). */
  questions?: readonly SuperBossQuestion[];
  /** Family-thematic taunt shown between question phases. */
  midFightTaunts?: readonly string[];
  // ── Animation metadata (opt-in) ─────────────────────────────────
  /** Idle clip. When omitted, `idleAsset` is loaded as a single image. */
  idleClip?: BossClipMeta;
  attackClip?: BossClipMeta;
  hurtClip?: BossClipMeta;
  defeatClip?: BossClipMeta;
  victoryClip?: BossClipMeta;
  /** Sprite scale on the map. Defaults to 1.9 (Village parity). */
  spriteScale?: number;
  /** Y offset from CP marker. Defaults to 62 (Village parity). */
  spriteYOffset?: number;
  /** X offset from CP marker. Defaults to 0 (on the disc). */
  spriteXOffset?: number;
  /** Short taunt lines shown periodically. Purely cosmetic. */
  taunts?: readonly string[];
}

/** A single question in the super-boss combat sequence. */
export interface SuperBossQuestion {
  /** Displayed to the player. */
  prompt: string;
  /** Short label above the prompt (e.g., "The doubt whispers"). */
  framing: string;
  /** Minimum characters required to accept the answer. */
  minLength?: number;
}

// Pixellab clip helpers — most sheets from the /assets/bosses/ pipeline
// are 92×92×9 (Fog / Arena / Stage2 / Harbourmaster / Collapse Specter /
// Babel Merchant / Iron Bureaucrat / super-pool). A few Village frames
// are 88×88×9 (personas). All defaults below can be overridden per-clip.
const PX_92: Pick<BossClipMeta, "frameCount" | "frameWidth" | "frameHeight"> =
  { frameCount: 9, frameWidth: 92, frameHeight: 92 };

function pxClip(asset: string, fps?: number): BossClipMeta {
  return { asset, ...PX_92, fps };
}

// Thematic super-boss question banks. These are meaningful founder prompts
// disguised as boss combat — answering them symbolises the founder facing
// down that stage's core doubt.

const FOREST_COLOSSUS_QUESTIONS: readonly SuperBossQuestion[] = [
  {
    framing: "The Colossus whispers",
    prompt:
      "When was perfectionism the enemy of your progress? Name a specific moment.",
    minLength: 20,
  },
  {
    framing: "It presses harder",
    prompt:
      "What would 'good enough to ship' mean for your current work? Be specific.",
    minLength: 20,
  },
  {
    framing: "Final breath",
    prompt:
      "What is one thing you'll ship this week without polishing further?",
    minLength: 15,
  },
];

const LEVIATHAN_QUESTIONS: readonly SuperBossQuestion[] = [
  {
    framing: "The Leviathan speaks",
    prompt:
      "Describe a time the market said no to you. What did you actually learn?",
    minLength: 20,
  },
  {
    framing: "Waves rise",
    prompt:
      "Who are the three specific customers you will pitch to next, and why them?",
    minLength: 20,
  },
  {
    framing: "The deep churns",
    prompt:
      "If your first ten prospects all reject the pitch, what will you change?",
    minLength: 20,
  },
];

const ADVOCATE_QUESTIONS: readonly SuperBossQuestion[] = [
  {
    framing: "The Advocate cross-examines",
    prompt:
      "Which assumption about your customer are you still treating as fact without evidence? Name it plainly.",
    minLength: 20,
  },
  {
    framing: "He tables the evidence",
    prompt:
      "What is the cheapest, fastest test you could run this week to confirm or kill that assumption?",
    minLength: 20,
  },
  {
    framing: "The verdict looms",
    prompt:
      "If the test comes back negative, what concretely will you change about your offer or your pitch?",
    minLength: 20,
  },
];

const FORGE_DRAGON_QUESTIONS: readonly SuperBossQuestion[] = [
  {
    framing: "The Dragon roars",
    prompt:
      "What craft in your work are you still hiding behind — pretending to master?",
    minLength: 20,
  },
  {
    framing: "Flames rise",
    prompt:
      "What would 'mastery' look like in your domain six months from now?",
    minLength: 20,
  },
  {
    framing: "Final ember",
    prompt:
      "What is the one habit you will change this week to close that gap?",
    minLength: 15,
  },
];

const COLLAPSE_SPECTER_QUESTIONS: readonly SuperBossQuestion[] = [
  {
    framing: "The Specter murmurs",
    prompt:
      "Where has scope crept into your build this week — name the exact feature or corner you didn't plan for.",
    minLength: 20,
  },
  {
    framing: "The mine trembles",
    prompt:
      "What is the smallest deliverable that still proves the whole system works end-to-end?",
    minLength: 20,
  },
  {
    framing: "Final tremor",
    prompt:
      "If the ceiling collapsed tomorrow, which single piece would you fight to save?",
    minLength: 15,
  },
];

const BABEL_MERCHANT_QUESTIONS: readonly SuperBossQuestion[] = [
  {
    framing: "The Merchant grins",
    prompt:
      "Which piece of user feedback have you been avoiding acting on? Name it plainly.",
    minLength: 20,
  },
  {
    framing: "Coins clatter",
    prompt:
      "What is the ONE change you'd make this week if every user asked for it in unison?",
    minLength: 20,
  },
  {
    framing: "The bazaar quiets",
    prompt:
      "Which loud request will you deliberately ignore, and why?",
    minLength: 15,
  },
];

export interface StageRoster {
  stage: number;
  stageName: string;
  bosses: readonly StageBoss[];
}

// ─────────────────────────────────────────────────────────────────────
// STAGE 1 — Village (already wired via village-bosses.ts + VillageMapScene
//   inlines its own metadata). Full Pixellab clips shipped for Fog +
//   Chimera + Automaton + Wraith.
// ─────────────────────────────────────────────────────────────────────

const STAGE_1_VILLAGE: StageRoster = {
  stage: 1,
  stageName: "The Village",
  bosses: [
    {
      checkpointIndex: 0, name: "Fog of Vagueness", family: "mist",
      idleAsset: "/assets/bosses/village/fog/idle.png",
      introLine: "* The Fog of Vagueness swirls around you.",
      idleClip: pxClip("/assets/bosses/village/fog/idle.png", 6),
      attackClip: pxClip("/assets/bosses/village/fog/attack.png", 10),
      hurtClip: pxClip("/assets/bosses/village/fog/hurt.png", 10),
      defeatClip: pxClip("/assets/bosses/village/fog/defeat.png", 8),
      victoryClip: pxClip("/assets/bosses/village/fog/victory.png", 8),
      spriteScale: 1.9, spriteYOffset: 62, spriteXOffset: 0,
      taunts: ["Your idea has no edges...", "Who is it for? Anyone? Everyone?", "Vague dreams die vague deaths."],
    },
    {
      checkpointIndex: 1, name: "Everyone Chimera", family: "undead",
      idleAsset: "/assets/bosses/village/chimera/idle.png",
      introLine: "* The Everyone Chimera reaches for all directions at once.",
      idleClip: pxClip("/assets/bosses/village/chimera/idle.png", 6),
      attackClip: pxClip("/assets/bosses/village/chimera/attack.png", 10),
      hurtClip: pxClip("/assets/bosses/village/chimera/hurt.png", 10),
      // Missing defeat/victory — fallback chain in helper resolves to hurt/attack.
      spriteScale: 1.9, spriteYOffset: 62, spriteXOffset: 0,
      taunts: ["One arm for gamers, one for parents...", "You'll build for everyone?", "That means no one at all.", "Pick a direction. I dare you."],
    },
    {
      checkpointIndex: 2, name: "Feature Automaton", family: "machine",
      idleAsset: "/assets/bosses/village/automaton/idle.png",
      introLine: "* The Feature Automaton stamps out another endless feature.",
      idleClip: pxClip("/assets/bosses/village/automaton/idle.png", 6),
      attackClip: pxClip("/assets/bosses/village/automaton/attack.png", 10),
      hurtClip: pxClip("/assets/bosses/village/automaton/hurt.png", 10),
      victoryClip: pxClip("/assets/bosses/village/automaton/victory.png", 8),
      spriteScale: 1.9, spriteYOffset: 62, spriteXOffset: 0,
      taunts: ["Add one more feature. Just one.", "Building. Always building.", "The MVP grows every day.", "One more toggle. One more."],
    },
    {
      checkpointIndex: 3, name: "Assumption Wraith", family: "undead",
      idleAsset: "/assets/bosses/village/wraith/idle.png",
      introLine: "* The Assumption Wraith whispers doubts in your ear.",
      idleClip: pxClip("/assets/bosses/village/wraith/idle.png", 6),
      attackClip: pxClip("/assets/bosses/village/wraith/attack.png", 10),
      hurtClip: pxClip("/assets/bosses/village/wraith/hurt.png", 10),
      victoryClip: pxClip("/assets/bosses/village/wraith/victory.png", 8),
      spriteScale: 1.9, spriteYOffset: 62, spriteXOffset: 0,
      taunts: ["You assume they'll pay.", "You assume they'll care.", "Prove it."],
    },
    {
      checkpointIndex: -1, name: "The Unraveller", family: "serpent",
      idleAsset: "/assets/bosses/village/unraveller/idle.png",
      isSuper: true,
      introLine: "* The Unraveller looms above the village.",
      // Single-frame image; no combat clips available.
      spriteScale: 2.4, spriteYOffset: 40, spriteXOffset: 0,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────
// STAGE 2 — Forest of Perfectionism
//   Theme: perfectionism, over-refinement, analysis paralysis.
//   Family palette skews plant/undead — nature turned corrupt.
//   Asset coverage: sorceress + thornbearer full Pixellab; wraith/shadow
//   idle-only; colossus attack+hurt but no defeat/victory.
// ─────────────────────────────────────────────────────────────────────

const STAGE_2_FOREST: StageRoster = {
  stage: 2,
  stageName: "Forest of Perfectionism",
  bosses: [
    {
      checkpointIndex: 0, name: "Shadow of Second-Guessing", family: "undead",
      idleAsset: "/assets/bosses/stage2/shadow-specter/idle.png",
      introLine: "* The Shadow of Second-Guessing flickers between the trees.",
      // Single-frame — no combat clips shipped.
      spriteScale: 1.9, spriteYOffset: 62, spriteXOffset: 0,
    },
    {
      checkpointIndex: 1, name: "Sorceress of Endless Iteration", family: "arcane",
      idleAsset: "/assets/bosses/stage2/forest-sorceress/idle.png",
      introLine: "* She whispers: 'Just one more version.'",
      idleClip: pxClip("/assets/bosses/stage2/forest-sorceress/idle.png", 6),
      attackClip: pxClip("/assets/bosses/stage2/forest-sorceress/attack.png", 10),
      hurtClip: pxClip("/assets/bosses/stage2/forest-sorceress/hurt.png", 10),
      defeatClip: pxClip("/assets/bosses/stage2/forest-sorceress/defeat.png", 8),
      spriteScale: 1.9, spriteYOffset: 62, spriteXOffset: 0,
    },
    {
      checkpointIndex: 2, name: "Thornbearer Champion", family: "plant",
      idleAsset: "/assets/bosses/stage2/thornbearer/idle.png",
      introLine: "* The Thornbearer blocks the path with elegant hesitation.",
      idleClip: pxClip("/assets/bosses/stage2/thornbearer/idle.png", 6),
      attackClip: pxClip("/assets/bosses/stage2/thornbearer/attack.png", 10),
      hurtClip: pxClip("/assets/bosses/stage2/thornbearer/hurt.png", 10),
      defeatClip: pxClip("/assets/bosses/stage2/thornbearer/defeat.png", 8),
      spriteScale: 1.9, spriteYOffset: 62, spriteXOffset: 0,
    },
    {
      checkpointIndex: 3, name: "Wraith of Almost-Ready", family: "undead",
      idleAsset: "/assets/bosses/stage2/forest-wraith/idle.png",
      introLine: "* It murmurs: 'Not quite yet. Not quite yet.'",
      spriteScale: 1.9, spriteYOffset: 62, spriteXOffset: 0,
    },
    {
      checkpointIndex: -1, name: "The Forest Colossus", family: "plant",
      idleAsset: "/assets/bosses/stage2/forest-colossus/idle.png",
      isSuper: true,
      introLine: "* The Forest Colossus wakes. Perfection incarnate.",
      questions: FOREST_COLOSSUS_QUESTIONS,
      idleClip: pxClip("/assets/bosses/stage2/forest-colossus/idle.png", 6),
      attackClip: pxClip("/assets/bosses/stage2/forest-colossus/attack.png", 10),
      hurtClip: pxClip("/assets/bosses/stage2/forest-colossus/hurt.png", 10),
      spriteScale: 2.6, spriteYOffset: 40, spriteXOffset: 0,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────
// STAGE 3 — The Arena (Validation)
//   Theme: assumptions dragged into public light, evidence over eloquence.
//   Asset coverage: judge full; advocate/oracle idle+attack+hurt;
//   masked-challenger idle+attack. Fallback chain handles the gaps.
// ─────────────────────────────────────────────────────────────────────

const STAGE_3_ARENA: StageRoster = {
  stage: 3,
  stageName: "The Arena",
  bosses: [
    {
      checkpointIndex: 0, name: "Judge of False Precedent", family: "arcane",
      idleAsset: "/assets/bosses/arena/judge/idle.png",
      introLine: "* The Judge cites a precedent that never was. Prove otherwise.",
      idleClip: pxClip("/assets/bosses/arena/judge/idle.png", 6),
      attackClip: pxClip("/assets/bosses/arena/judge/attack.png", 10),
      hurtClip: pxClip("/assets/bosses/arena/judge/hurt.png", 10),
      victoryClip: pxClip("/assets/bosses/arena/judge/victory.png", 8),
      spriteScale: 1.9, spriteYOffset: 62, spriteXOffset: 0,
    },
    {
      checkpointIndex: 1, name: "The Masked Challenger", family: "arcane",
      idleAsset: "/assets/bosses/arena/masked-challenger/idle.png",
      introLine: "* Two blades, no face. The Masked Challenger tests what you truly know.",
      idleClip: pxClip("/assets/bosses/arena/masked-challenger/idle.png", 6),
      attackClip: pxClip("/assets/bosses/arena/masked-challenger/attack.png", 10),
      spriteScale: 1.9, spriteYOffset: 62, spriteXOffset: 0,
    },
    {
      checkpointIndex: 2, name: "Oracle of Doubt", family: "arcane",
      idleAsset: "/assets/bosses/arena/oracle-of-doubt/idle.png",
      introLine: "* The blindfolded Oracle speaks three futures. Only evidence chooses one.",
      idleClip: pxClip("/assets/bosses/arena/oracle-of-doubt/idle.png", 6),
      attackClip: pxClip("/assets/bosses/arena/oracle-of-doubt/attack.png", 10),
      hurtClip: pxClip("/assets/bosses/arena/oracle-of-doubt/hurt.png", 10),
      spriteScale: 1.9, spriteYOffset: 62, spriteXOffset: 0,
    },
    {
      checkpointIndex: -1, name: "The Advocate of Comfortable Lies", family: "arcane",
      idleAsset: "/assets/bosses/arena/advocate/idle.png",
      isSuper: true,
      introLine: "* The Advocate rises, gavel gleaming. He will make your assumptions sound like law.",
      questions: ADVOCATE_QUESTIONS,
      idleClip: pxClip("/assets/bosses/arena/advocate/idle.png", 6),
      attackClip: pxClip("/assets/bosses/arena/advocate/attack.png", 10),
      hurtClip: pxClip("/assets/bosses/arena/advocate/hurt.png", 10),
      spriteScale: 2.6, spriteYOffset: 40, spriteXOffset: 0,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────
// STAGE 4 — Artisans District
//   Theme: craft mastery, dark automation, guild politics.
//   Asset coverage: all Stage 4 bosses are single-frame images (no
//   combat clips). The helper falls back to a static image with a
//   procedural "hit flash" tint for hurt/attack cues.
// ─────────────────────────────────────────────────────────────────────

const STAGE_4_ARTISANS: StageRoster = {
  stage: 4,
  stageName: "Artisans District",
  bosses: [
    {
      checkpointIndex: 0, name: "The Armored Perfectionist", family: "machine",
      idleAsset: "/assets/bosses/stage4/armor-golem/idle.png",
      introLine: "* Its armor is flawless. Its progress is zero.",
      spriteScale: 1.9, spriteYOffset: 62, spriteXOffset: 0,
    },
    {
      checkpointIndex: 1, name: "Automaton of Delegated Dreams", family: "machine",
      idleAsset: "/assets/bosses/stage4/artisan-automaton/idle.png",
      introLine: "* The Automaton produces work the way a factory makes noise.",
      spriteScale: 1.9, spriteYOffset: 62, spriteXOffset: 0,
    },
    {
      checkpointIndex: 2, name: "Titan of Old Habits", family: "undead",
      idleAsset: "/assets/bosses/stage4/undead-titan/idle.png",
      introLine: "* The Titan of Old Habits refuses to change with the times.",
      spriteScale: 1.9, spriteYOffset: 62, spriteXOffset: 0,
    },
    {
      checkpointIndex: 3, name: "The Spectral King of Feedback", family: "arcane",
      idleAsset: "/assets/bosses/stage4/spectral-king/idle.png",
      introLine: "* The Spectral King rules a court of contradictory notes.",
      spriteScale: 1.9, spriteYOffset: 62, spriteXOffset: 0,
    },
    {
      checkpointIndex: -1, name: "The Forge Dragon", family: "serpent",
      idleAsset: "/assets/bosses/stage4/forge-dragon/idle.png",
      isSuper: true,
      introLine: "* The Forge Dragon awakens. Only mastery survives its flame.",
      questions: FORGE_DRAGON_QUESTIONS,
      spriteScale: 2.4, spriteYOffset: 40, spriteXOffset: 0,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────
// STAGE 5 — The Mine (Build & Deliver)
//   Theme: scope creep, ceiling collapse, delivery pressure.
//   Boss art: Collapse Specter ships as full Pixellab in
//   /assets/bosses/incoming/collapse-specter/ (idle/attack/hurt/victory).
//   Mini-bosses reuse super-pool + village art since dedicated
//   Stage-5 mini art hasn't landed yet — this at least gives the map
//   a moving-boss to guard each CP instead of empty checkpoints.
// ─────────────────────────────────────────────────────────────────────

const STAGE_5_MINE: StageRoster = {
  stage: 5,
  stageName: "The Mine",
  bosses: [
    {
      checkpointIndex: 0, name: "Scope-Creep Serpent", family: "serpent",
      idleAsset: "/assets/bosses/super-pool/stonecaller/idle.png",
      introLine: "* The Serpent adds another tunnel to your plan.",
      idleClip: pxClip("/assets/bosses/super-pool/stonecaller/idle.png", 6),
      attackClip: pxClip("/assets/bosses/super-pool/stonecaller/attack.png", 10),
      victoryClip: pxClip("/assets/bosses/super-pool/stonecaller/victory.png", 8),
      spriteScale: 1.9, spriteYOffset: 62, spriteXOffset: 0,
    },
    {
      checkpointIndex: 1, name: "The Hollow Overseer", family: "undead",
      idleAsset: "/assets/bosses/super-pool/wraith-council/idle.png",
      introLine: "* The Overseer counts every unfinished shaft.",
      idleClip: pxClip("/assets/bosses/super-pool/wraith-council/idle.png", 6),
      attackClip: pxClip("/assets/bosses/super-pool/wraith-council/attack.png", 10),
      hurtClip: pxClip("/assets/bosses/super-pool/wraith-council/hurt.png", 10),
      defeatClip: pxClip("/assets/bosses/super-pool/wraith-council/defeat.png", 8),
      spriteScale: 1.9, spriteYOffset: 62, spriteXOffset: 0,
    },
    {
      checkpointIndex: 2, name: "Rusted Oracle of Delay", family: "machine",
      idleAsset: "/assets/bosses/super-pool/rusted-oracle/idle.png",
      introLine: "* The Rusted Oracle chants: 'One more sprint. Just one more.'",
      idleClip: pxClip("/assets/bosses/super-pool/rusted-oracle/idle.png", 6),
      attackClip: pxClip("/assets/bosses/super-pool/rusted-oracle/attack.png", 10),
      hurtClip: pxClip("/assets/bosses/super-pool/rusted-oracle/hurt.png", 10),
      defeatClip: pxClip("/assets/bosses/super-pool/rusted-oracle/defeat.png", 8),
      victoryClip: pxClip("/assets/bosses/super-pool/rusted-oracle/victory.png", 8),
      spriteScale: 1.9, spriteYOffset: 62, spriteXOffset: 0,
    },
    {
      checkpointIndex: 3, name: "Veilwalker of Unfinished Work", family: "arcane",
      idleAsset: "/assets/bosses/super-pool/veilwalker/idle.png",
      introLine: "* The Veilwalker drags half-finished features into the dark.",
      idleClip: pxClip("/assets/bosses/super-pool/veilwalker/idle.png", 6),
      attackClip: pxClip("/assets/bosses/super-pool/veilwalker/attack.png", 10),
      defeatClip: pxClip("/assets/bosses/super-pool/veilwalker/defeat.png", 8),
      spriteScale: 1.9, spriteYOffset: 62, spriteXOffset: 0,
    },
    {
      checkpointIndex: -1, name: "The Collapse Specter", family: "undead",
      idleAsset: "/assets/bosses/incoming/collapse-specter/idle.png",
      isSuper: true,
      introLine: "* The Collapse Specter walks the mine, waiting for the ceiling to fall.",
      questions: COLLAPSE_SPECTER_QUESTIONS,
      idleClip: pxClip("/assets/bosses/incoming/collapse-specter/idle.png", 6),
      attackClip: pxClip("/assets/bosses/incoming/collapse-specter/attack.png", 10),
      hurtClip: pxClip("/assets/bosses/incoming/collapse-specter/hurt.png", 10),
      victoryClip: pxClip("/assets/bosses/incoming/collapse-specter/victory.png", 8),
      spriteScale: 2.6, spriteYOffset: 40, spriteXOffset: 0,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────
// STAGE 6 — The Harbour (Launch)
//   Theme: distribution, sales, first customers.
//   Asset paths still reference /bosses/stage3/ because Harbour was
//   originally Stage 3 in the pre-realignment codebase. The folder was
//   never renamed; scenes read paths from this roster so the folder
//   name is cosmetic. Harbourmaster uses the newer /incoming/ pack.
// ─────────────────────────────────────────────────────────────────────

const STAGE_6_HARBOR: StageRoster = {
  stage: 6,
  stageName: "The Harbour",
  bosses: [
    {
      checkpointIndex: 0, name: "The Silver-Tongued Merchant", family: "arcane",
      idleAsset: "/assets/bosses/stage3/harbor-merchant/idle.png",
      introLine: "* 'Your price is wrong,' the merchant smirks.",
      spriteScale: 1.9, spriteYOffset: 62, spriteXOffset: 0,
    },
    {
      checkpointIndex: 1, name: "Harbormaster of Gatekeeping", family: "machine",
      idleAsset: "/assets/bosses/incoming/harbourmaster/idle.png",
      introLine: "* The Harbormaster demands proof you belong here.",
      idleClip: pxClip("/assets/bosses/incoming/harbourmaster/idle.png", 6),
      attackClip: pxClip("/assets/bosses/incoming/harbourmaster/attack.png", 10),
      // Retreat pack shipped as `retreat.png` — treat it as a hurt fallback.
      hurtClip: pxClip("/assets/bosses/incoming/harbourmaster/retreat.png", 10),
      victoryClip: pxClip("/assets/bosses/incoming/harbourmaster/victory.png", 8),
      spriteScale: 1.9, spriteYOffset: 62, spriteXOffset: 0,
    },
    {
      checkpointIndex: 2, name: "Colossal Sea Serpent", family: "serpent",
      idleAsset: "/assets/bosses/stage3/sea-serpent/idle.png",
      introLine: "* The serpent coils in the deep, guarding the shipping lanes.",
      spriteScale: 1.9, spriteYOffset: 62, spriteXOffset: 0,
    },
    {
      checkpointIndex: -1, name: "The Leviathan of Market Rejection", family: "serpent",
      idleAsset: "/assets/bosses/stage3/leviathan/idle.png",
      isSuper: true,
      introLine: "* The Leviathan rises. The market has spoken.",
      questions: LEVIATHAN_QUESTIONS,
      // Super boss uses tide-caller Pixellab pack for combat states (full set).
      idleClip: pxClip("/assets/bosses/super-pool/tide-caller/idle.png", 6),
      attackClip: pxClip("/assets/bosses/super-pool/tide-caller/attack.png", 10),
      hurtClip: pxClip("/assets/bosses/super-pool/tide-caller/hurt.png", 10),
      defeatClip: pxClip("/assets/bosses/super-pool/tide-caller/defeat.png", 8),
      victoryClip: pxClip("/assets/bosses/super-pool/tide-caller/victory.png", 8),
      spriteScale: 2.6, spriteYOffset: 40, spriteXOffset: 0,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────
// STAGE 7 — The Crossroads (Iteration)
//   Theme: user feedback overload, direction changes, tuning without
//   drift. Boss art: Babel Merchant ships as full Pixellab in
//   /assets/bosses/incoming/babel-merchant/ (idle/attack/retreat/victory).
//   Mini-bosses reuse super-pool sheets so the CP flow works today.
// ─────────────────────────────────────────────────────────────────────

const STAGE_7_CROSSROADS: StageRoster = {
  stage: 7,
  stageName: "The Crossroads",
  bosses: [
    {
      checkpointIndex: 0, name: "Herald of Loud Requests", family: "arcane",
      idleAsset: "/assets/bosses/super-pool/stonecaller/idle.png",
      introLine: "* The Herald reads every complaint aloud, at once.",
      idleClip: pxClip("/assets/bosses/super-pool/stonecaller/idle.png", 6),
      attackClip: pxClip("/assets/bosses/super-pool/stonecaller/attack.png", 10),
      victoryClip: pxClip("/assets/bosses/super-pool/stonecaller/victory.png", 8),
      spriteScale: 1.9, spriteYOffset: 62, spriteXOffset: 0,
    },
    {
      checkpointIndex: 1, name: "The Split-Path Twin", family: "undead",
      idleAsset: "/assets/bosses/super-pool/wraith-council/idle.png",
      introLine: "* The Twin points both ways. Pick one — or lose the road.",
      idleClip: pxClip("/assets/bosses/super-pool/wraith-council/idle.png", 6),
      attackClip: pxClip("/assets/bosses/super-pool/wraith-council/attack.png", 10),
      hurtClip: pxClip("/assets/bosses/super-pool/wraith-council/hurt.png", 10),
      defeatClip: pxClip("/assets/bosses/super-pool/wraith-council/defeat.png", 8),
      spriteScale: 1.9, spriteYOffset: 62, spriteXOffset: 0,
    },
    {
      checkpointIndex: 2, name: "Contradiction Oracle", family: "arcane",
      idleAsset: "/assets/bosses/super-pool/rusted-oracle/idle.png",
      introLine: "* Every prophecy contradicts the last. Pick the true one.",
      idleClip: pxClip("/assets/bosses/super-pool/rusted-oracle/idle.png", 6),
      attackClip: pxClip("/assets/bosses/super-pool/rusted-oracle/attack.png", 10),
      hurtClip: pxClip("/assets/bosses/super-pool/rusted-oracle/hurt.png", 10),
      defeatClip: pxClip("/assets/bosses/super-pool/rusted-oracle/defeat.png", 8),
      victoryClip: pxClip("/assets/bosses/super-pool/rusted-oracle/victory.png", 8),
      spriteScale: 1.9, spriteYOffset: 62, spriteXOffset: 0,
    },
    {
      checkpointIndex: 3, name: "The Iron Bureaucrat's Herald", family: "machine",
      idleAsset: "/assets/bosses/incoming/iron-bureaucrat/idle.png",
      introLine: "* Compliance forms rain from the sky.",
      idleClip: pxClip("/assets/bosses/incoming/iron-bureaucrat/idle.png", 6),
      attackClip: pxClip("/assets/bosses/incoming/iron-bureaucrat/attack.png", 10),
      victoryClip: pxClip("/assets/bosses/incoming/iron-bureaucrat/victory.png", 8),
      spriteScale: 1.9, spriteYOffset: 62, spriteXOffset: 0,
    },
    {
      checkpointIndex: -1, name: "The Babel Merchant", family: "arcane",
      idleAsset: "/assets/bosses/incoming/babel-merchant/idle.png",
      isSuper: true,
      introLine: "* The Babel Merchant offers a hundred paths — every one detours.",
      questions: BABEL_MERCHANT_QUESTIONS,
      idleClip: pxClip("/assets/bosses/incoming/babel-merchant/idle.png", 6),
      attackClip: pxClip("/assets/bosses/incoming/babel-merchant/attack.png", 10),
      hurtClip: pxClip("/assets/bosses/incoming/babel-merchant/retreat.png", 10),
      victoryClip: pxClip("/assets/bosses/incoming/babel-merchant/victory.png", 8),
      spriteScale: 2.6, spriteYOffset: 40, spriteXOffset: 0,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────────────────

export const STAGE_ROSTERS: readonly StageRoster[] = [
  STAGE_1_VILLAGE,
  STAGE_2_FOREST,
  STAGE_3_ARENA,
  STAGE_4_ARTISANS,
  STAGE_5_MINE,
  STAGE_6_HARBOR,
  STAGE_7_CROSSROADS,
  // Stage 8 (Scale · The Capital · The Iron Bureaucrat)
  //   — painted map + boss art both pending.
];

/** Look up the boss guarding a specific stage + checkpoint. */
export function getStageBoss(
  stage: number,
  checkpointIndex: number,
): StageBoss | null {
  const roster = STAGE_ROSTERS.find((r) => r.stage === stage);
  if (!roster) return null;
  return roster.bosses.find((b) => b.checkpointIndex === checkpointIndex) ?? null;
}

/** Look up the super-boss for a stage (checkpointIndex === -1). */
export function getStageSuperBoss(stage: number): StageBoss | null {
  return getStageBoss(stage, -1);
}

/** All mini-bosses (excludes super-boss) for a stage. */
export function getStageMiniBosses(stage: number): readonly StageBoss[] {
  const roster = STAGE_ROSTERS.find((r) => r.stage === stage);
  if (!roster) return [];
  return roster.bosses.filter((b) => !b.isSuper);
}

/** All stages that have full boss art available. */
export function getStagesWithBosses(): number[] {
  return STAGE_ROSTERS.map((r) => r.stage);
}

// Re-export the family type so consumers can import from here alone.
export type { VillageBossFamily };
