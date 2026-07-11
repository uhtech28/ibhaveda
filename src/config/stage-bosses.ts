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
 */

import type { VillageBossFamily, VillageBossInfo } from "./village-bosses";

/** Extends VillageBossInfo with the concept of super-boss vs mini. */
export interface StageBoss extends Omit<VillageBossInfo, "checkpointIndex"> {
  /** Which checkpoint (0-based) this boss guards. -1 = super-boss. */
  checkpointIndex: number;
  /** True for the stage-final super-boss encounter. */
  isSuper?: boolean;
  /** 3 thematic questions for the super-boss combat (only used when isSuper). */
  questions?: readonly SuperBossQuestion[];
  /** Family-thematic taunt shown between question phases. */
  midFightTaunts?: readonly string[];
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

export interface StageRoster {
  stage: number;
  stageName: string;
  bosses: readonly StageBoss[];
}

// ─────────────────────────────────────────────────────────────────────
// STAGE 1 — Village (already wired via village-bosses.ts)
// ─────────────────────────────────────────────────────────────────────

const STAGE_1_VILLAGE: StageRoster = {
  stage: 1,
  stageName: "The Village",
  bosses: [
    { checkpointIndex: 0, name: "Fog of Vagueness", family: "mist", idleAsset: "/assets/bosses/village/fog/idle.png", introLine: "* The Fog of Vagueness swirls around you." },
    { checkpointIndex: 1, name: "Everyone Chimera", family: "undead", idleAsset: "/assets/bosses/village/chimera/idle.png", introLine: "* The Everyone Chimera reaches for all directions at once." },
    { checkpointIndex: 2, name: "Feature Automaton", family: "machine", idleAsset: "/assets/bosses/village/automaton/idle.png", introLine: "* The Feature Automaton stamps out another endless feature." },
    { checkpointIndex: 3, name: "Assumption Wraith", family: "undead", idleAsset: "/assets/bosses/village/wraith/idle.png", introLine: "* The Assumption Wraith whispers doubts in your ear." },
    { checkpointIndex: -1, name: "The Unraveller", family: "serpent", idleAsset: "/assets/bosses/village/unraveller/idle.png", isSuper: true, introLine: "* The Unraveller looms above the village." },
  ],
};

// ─────────────────────────────────────────────────────────────────────
// STAGE 2 — Forest of Perfectionism
//   Theme: perfectionism, over-refinement, analysis paralysis.
//   Family palette skews plant/undead — nature turned corrupt.
// ─────────────────────────────────────────────────────────────────────

const STAGE_2_FOREST: StageRoster = {
  stage: 2,
  stageName: "Forest of Perfectionism",
  bosses: [
    { checkpointIndex: 0, name: "Shadow of Second-Guessing", family: "undead", idleAsset: "/assets/bosses/stage2/shadow-specter/idle.png", introLine: "* The Shadow of Second-Guessing flickers between the trees." },
    { checkpointIndex: 1, name: "Sorceress of Endless Iteration", family: "arcane", idleAsset: "/assets/bosses/stage2/forest-sorceress/idle.png", introLine: "* She whispers: 'Just one more version.'" },
    { checkpointIndex: 2, name: "Thornbearer Champion", family: "plant", idleAsset: "/assets/bosses/stage2/thornbearer/idle.png", introLine: "* The Thornbearer blocks the path with elegant hesitation." },
    { checkpointIndex: 3, name: "Wraith of Almost-Ready", family: "undead", idleAsset: "/assets/bosses/stage2/forest-wraith/idle.png", introLine: "* It murmurs: 'Not quite yet. Not quite yet.'" },
    { checkpointIndex: -1, name: "The Forest Colossus", family: "plant", idleAsset: "/assets/bosses/stage2/forest-colossus/idle.png", isSuper: true, introLine: "* The Forest Colossus wakes. Perfection incarnate.", questions: FOREST_COLOSSUS_QUESTIONS },
  ],
};

// ─────────────────────────────────────────────────────────────────────
// STAGE 6 — The Harbour (Launch)
//   Theme: distribution, sales, first customers.
//   Family palette skews serpent/arcane — the water reveals hidden depths.
//   Asset paths still reference /bosses/stage3/ because Harbour was
//   originally Stage 3 in the pre-realignment codebase. The folder was
//   never renamed; scenes read paths from this roster so the folder
//   name is cosmetic.
//   NOTE: only 3 mini-bosses. The venture template (convex/ventureConstants.ts)
//   creates 3 checkpoints for Stage 6 (Launch assets prepared, Product live,
//   First users acquired) — a 4th mini-boss would be an orphan with no CP
//   to guard.
// ─────────────────────────────────────────────────────────────────────

const STAGE_6_HARBOR: StageRoster = {
  stage: 6,
  stageName: "The Harbour",
  bosses: [
    { checkpointIndex: 0, name: "The Silver-Tongued Merchant", family: "arcane", idleAsset: "/assets/bosses/stage3/harbor-merchant/idle.png", introLine: "* 'Your price is wrong,' the merchant smirks." },
    { checkpointIndex: 1, name: "Harbormaster of Gatekeeping", family: "machine", idleAsset: "/assets/bosses/stage3/harbor-official/idle.png", introLine: "* The Harbormaster demands proof you belong here." },
    { checkpointIndex: 2, name: "Colossal Sea Serpent", family: "serpent", idleAsset: "/assets/bosses/stage3/sea-serpent/idle.png", introLine: "* The serpent coils in the deep, guarding the shipping lanes." },
    { checkpointIndex: -1, name: "The Leviathan of Market Rejection", family: "serpent", idleAsset: "/assets/bosses/stage3/leviathan/idle.png", isSuper: true, introLine: "* The Leviathan rises. The market has spoken.", questions: LEVIATHAN_QUESTIONS },
  ],
};

// ─────────────────────────────────────────────────────────────────────
// STAGE 4 — Artisans District
//   Theme: craft mastery, dark automation, guild politics.
//   Family palette skews machine/undead/arcane.
// ─────────────────────────────────────────────────────────────────────

const STAGE_4_ARTISANS: StageRoster = {
  stage: 4,
  stageName: "Artisans District",
  bosses: [
    { checkpointIndex: 0, name: "The Armored Perfectionist", family: "machine", idleAsset: "/assets/bosses/stage4/armor-golem/idle.png", introLine: "* Its armor is flawless. Its progress is zero." },
    { checkpointIndex: 1, name: "Automaton of Delegated Dreams", family: "machine", idleAsset: "/assets/bosses/stage4/artisan-automaton/idle.png", introLine: "* The Automaton produces work the way a factory makes noise." },
    { checkpointIndex: 2, name: "Titan of Old Habits", family: "undead", idleAsset: "/assets/bosses/stage4/undead-titan/idle.png", introLine: "* The Titan of Old Habits refuses to change with the times." },
    { checkpointIndex: 3, name: "The Spectral King of Feedback", family: "arcane", idleAsset: "/assets/bosses/stage4/spectral-king/idle.png", introLine: "* The Spectral King rules a court of contradictory notes." },
    { checkpointIndex: -1, name: "The Forge Dragon", family: "serpent", idleAsset: "/assets/bosses/stage4/forge-dragon/idle.png", isSuper: true, introLine: "* The Forge Dragon awakens. Only mastery survives its flame.", questions: FORGE_DRAGON_QUESTIONS },
  ],
};

// ─────────────────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────────────────

export const STAGE_ROSTERS: readonly StageRoster[] = [
  STAGE_1_VILLAGE,
  STAGE_2_FOREST,
  // Stage 3 (Validation · The Arena · The Advocate of Comfortable Lies)
  //   — boss art pending. stages.config.ts marks bossArtPending:true.
  //   getStageSuperBoss(3) returns null so ArenaScene's reveal branch
  //   silently skips to STAGE_COMPLETE.
  STAGE_4_ARTISANS,
  // Stage 5 (Build & Deliver · The Mine · The Collapse Specter)
  //   — boss art pending. bossArtPending:true in stages.config.ts.
  STAGE_6_HARBOR,
  // Stage 7 (Iteration · The Crossroads Town · The Babel Merchant)
  //   — boss art pending. bossArtPending:true in stages.config.ts.
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
