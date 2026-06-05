/**
 * Mini-game easter eggs — configuration constants.
 *
 * Single source of truth for the three archetypes, their reward
 * tables, anti-cheat time floors, and the spawn-point catalogue.
 *
 * The spawn catalogue is keyed by venture stage so individual
 * checkpoints don't bleed into the wrong stage. Each spawn point has
 * a stable id (used by `miniGameCompletions.spawnPointId`) so
 * shuffling the order or renaming entries does not invalidate
 * completion records.
 */

export const MINIGAME_ARCHETYPES = [
  "pattern_match",
  "reflex_tap",
  "decrypt",
] as const;
export type MiniGameArchetype = (typeof MINIGAME_ARCHETYPES)[number];

export interface MiniGameSpawnConfig {
  /** Stable id. Never change for an existing spawn. */
  id: string;
  /** Stage (1-8) on which this spawn lives. */
  stage: number;
  /** Archetype that triggers when the player enters this spawn. */
  archetype: MiniGameArchetype;
  /** World-coords in the Phaser scene. */
  x: number;
  y: number;
  /** Visual difficulty 1-5. Affects sequence length / target size / cipher length. */
  difficulty: 1 | 2 | 3 | 4 | 5;
  /** Optional flavour for the prompt dialog. */
  flavorText?: string;
}

/**
 * Master catalogue. Adding a row enables a new spawn anywhere in the
 * map. Removing one hides it from spawning but old completion rows
 * remain valid.
 */
export const MINIGAME_SPAWNS: readonly MiniGameSpawnConfig[] = [
  // Stage 1 — Ideation: discover by exploring the starting biome.
  {
    id: "s1-pm-east-grove",
    stage: 1,
    archetype: "pattern_match",
    x: 1380,
    y: 720,
    difficulty: 1,
    flavorText: "A pattern of lights pulses in the grass.",
  },
  {
    id: "s1-rt-bridge",
    stage: 1,
    archetype: "reflex_tap",
    x: 1080,
    y: 920,
    difficulty: 1,
    flavorText: "Fireflies dart across the bridge.",
  },

  // Stage 3 — Validation: a cipher hides inside a market stall.
  {
    id: "s3-dc-market",
    stage: 3,
    archetype: "decrypt",
    x: 1820,
    y: 1240,
    difficulty: 2,
    flavorText: "An old vendor leaves a scrap of code on the counter.",
  },

  // Stage 5 — Build & Deliver: harder pattern in the artisan district.
  {
    id: "s5-pm-artisan",
    stage: 5,
    archetype: "pattern_match",
    x: 2160,
    y: 1480,
    difficulty: 3,
  },

  // Stage 7 — Iteration: rapid reflex challenge in the bazaar.
  {
    id: "s7-rt-bazaar",
    stage: 7,
    archetype: "reflex_tap",
    x: 2440,
    y: 1640,
    difficulty: 4,
  },

  // Stage 8 — Scale: a master cipher in the high terrace.
  {
    id: "s8-dc-terrace",
    stage: 8,
    archetype: "decrypt",
    x: 2680,
    y: 1780,
    difficulty: 5,
    flavorText: "A vault prompts you for the founder's seven-symbol key.",
  },
] as const;

// ─────────────────────────────────────────────────────────────────────
// Per-archetype parameters
// ─────────────────────────────────────────────────────────────────────

/**
 * Game-balance parameters per archetype. The mini-game scenes read
 * these to size their state at session start; difficulty 1-5 scales
 * the values linearly between min and max.
 */
export const ARCHETYPE_PARAMS = {
  pattern_match: {
    /** Sequence length at difficulty 1 → 5. */
    sequenceLength: { min: 3, max: 9 },
    /** Ms each step lights up at difficulty 1 → 5. */
    stepDurationMs: { min: 800, max: 400 },
    /** Overall round time budget in ms. */
    roundDurationMs: 45_000,
  },
  reflex_tap: {
    /**
     * Per-tier params (PRD §"Reflex Tap — Production-Level Design").
     * Tier 1 is index 0 — array is 0-indexed but UI difficulty is 1-5.
     *
     *   targetHits     hits needed for an instant win
     *   durationMs     overall round budget
     *   targetLifetimeMs  how long a target stays before despawning
     *   spawnIntervalMs   ms between new target spawns
     *   goldenChance   weighted spawn chance for ✦ (Tier 3+)
     *   corruptedChance weighted spawn chance for ☒ (Tier 4+)
     */
    tiers: [
      // Light slowdown from the original spec — each tier gets ~200ms
      // more reaction time per target and ~100ms slower spawn cadence.
      // Hit-count targets unchanged so completion still requires the
      // same number of taps.
      { targetHits: 8,  durationMs: 22_000, targetLifetimeMs: 1200, spawnIntervalMs: 1000, goldenChance: 0,    corruptedChance: 0    },
      { targetHits: 10, durationMs: 22_000, targetLifetimeMs: 1100, spawnIntervalMs: 900,  goldenChance: 0,    corruptedChance: 0    },
      { targetHits: 12, durationMs: 24_000, targetLifetimeMs: 1000, spawnIntervalMs: 800,  goldenChance: 0.10, corruptedChance: 0    },
      { targetHits: 15, durationMs: 26_000, targetLifetimeMs: 900,  spawnIntervalMs: 700,  goldenChance: 0.10, corruptedChance: 0.05 },
      { targetHits: 18, durationMs: 28_000, targetLifetimeMs: 800,  spawnIntervalMs: 600,  goldenChance: 0.10, corruptedChance: 0.05 },
    ] as const,
    /** Legacy fields — preserved so any caller that still reads them
     *  doesn't break. New code should read the `tiers` array. */
    targetSizePx: { min: 60, max: 56 },
    targetLifetimeMs: { min: 1000, max: 600 },
    targetCount: { min: 8, max: 18 },
    roundDurationMs: 25_000,
  },
  decrypt: {
    /**
     * Per-tier configs (PRD §"Decrypt — Production-Level Design").
     *
     *   gridSize       NxN piece grid
     *   modes          which mechanics are active
     *   lockedPieces   pieces fixed in correct slot+rotation (cannot move)
     *   hintAfterMs    when the auto-hint prompt surfaces
     */
    tiers: [
      { gridSize: 2, modes: { rotate: true,  swap: false }, lockedPieces: 0, hintAfterMs: 15_000 },
      { gridSize: 3, modes: { rotate: true,  swap: false }, lockedPieces: 0, hintAfterMs: 15_000 },
      { gridSize: 3, modes: { rotate: true,  swap: true  }, lockedPieces: 0, hintAfterMs: 18_000 },
      { gridSize: 4, modes: { rotate: true,  swap: true  }, lockedPieces: 0, hintAfterMs: 22_000 },
      { gridSize: 4, modes: { rotate: true,  swap: true  }, lockedPieces: 2, hintAfterMs: 26_000 },
    ] as const,
    /** Legacy fields — preserved so any caller that still reads them
     *  doesn't break. New code reads `tiers` directly. */
    cipherLength: { min: 4, max: 16 },
    vocabularySize: { min: 4, max: 6 },
    maxGuesses: 99,
    /** No-fail design — puzzle is untimed. User exits voluntarily. */
    roundDurationMs: 0,
  },
} as const;

// ─────────────────────────────────────────────────────────────────────
// Reward table
// ─────────────────────────────────────────────────────────────────────

/**
 * XP awarded on completion. Difficulty multiplier compounds with the
 * archetype base. v1 emits XP only; the reward shape is a typed union
 * (see miniGameTypes) so cosmetic and portal rewards can layer in
 * later without a schema migration.
 */
export const REWARD_TABLE = {
  base: {
    pattern_match: 25,
    reflex_tap: 25,
    decrypt: 35,
  },
  /** Multiplier applied to base. Index by difficulty - 1. */
  difficultyMultiplier: [1.0, 1.5, 2.0, 2.75, 4.0],
  /** Bonus for a perfect score (specific to each archetype). */
  perfectBonus: 50,
} as const;

/**
 * Compute the XP reward for a completed session. Pure — exposed for
 * the server mutation and for client-side preview before completion.
 */
export function computeXpReward(
  archetype: MiniGameArchetype,
  difficulty: 1 | 2 | 3 | 4 | 5,
  isPerfect: boolean,
): number {
  const base = REWARD_TABLE.base[archetype];
  const mult = REWARD_TABLE.difficultyMultiplier[difficulty - 1];
  const bonus = isPerfect ? REWARD_TABLE.perfectBonus : 0;
  return Math.round(base * mult + bonus);
}

// ─────────────────────────────────────────────────────────────────────
// Anti-cheat: minimum plausible completion times
// ─────────────────────────────────────────────────────────────────────

/**
 * Minimum time (ms) a real human could plausibly complete each
 * archetype in. Used by the server to flag completions that arrive
 * suspiciously fast.
 *
 * These are intentionally generous — we don't want to flag a fast
 * gamer. They exist to catch scripted "click 'complete' immediately"
 * abuse, not to grade reaction time.
 */
export const MIN_PLAUSIBLE_DURATION_MS = {
  pattern_match: (sequenceLength: number) => sequenceLength * 250,
  reflex_tap: (targetCount: number) => targetCount * 200,
  decrypt: () => 3_000,
} as const;

/** Helper used by the server to look up a spawn by id. */
export function getSpawnConfig(id: string): MiniGameSpawnConfig | null {
  return MINIGAME_SPAWNS.find((s) => s.id === id) ?? null;
}

/** Spawn points enabled for a given stage. */
export function spawnsForStage(
  stage: number,
): MiniGameSpawnConfig[] {
  return MINIGAME_SPAWNS.filter((s) => s.stage === stage);
}

/**
 * Linear interpolation across the difficulty range. Used by scenes
 * to compute their per-difficulty parameters.
 */
export function lerpParam(
  min: number,
  max: number,
  difficulty: 1 | 2 | 3 | 4 | 5,
): number {
  const t = (difficulty - 1) / 4;
  return Math.round(min + (max - min) * t);
}
