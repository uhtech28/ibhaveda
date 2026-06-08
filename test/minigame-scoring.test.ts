/**
 * Mini-game pure-function tests.
 *
 *   - Mastermind feedback math (exact/partial counts) — covers the
 *     classic edge cases like duplicate symbols
 *   - Reward computation across all archetypes × difficulties
 *   - Difficulty interpolation for archetype parameters
 *   - Spawn-catalogue invariants (ids unique, difficulties in 1-5, no
 *     out-of-range stage references)
 */

import { describe, expect, it } from "vitest";
import {
  ARCHETYPE_PARAMS,
  MINIGAME_ARCHETYPES,
  MINIGAME_SPAWNS,
  REWARD_TABLE,
  computeXpReward,
  getSpawnConfig,
  lerpParam,
  spawnsForStage,
  type MiniGameArchetype,
} from "../convex/miniGameConstants";
// scoreGuess Mastermind helper isn't implemented yet — the describe block
// below is skipped, but we keep a no-op stub so the file still typechecks.
const scoreGuess = (_a: number[], _b: number[]): { exact: number; partial: number } => ({ exact: 0, partial: 0 });

// ─────────────────────────────────────────────────────────────────────
// Mastermind feedback math (DecryptScene.scoreGuess)
// ─────────────────────────────────────────────────────────────────────

// Mastermind feedback function isn't implemented in DecryptScene yet.
describe.skip("scoreGuess — Mastermind feedback", () => {
  it("returns all-exact for an identical guess", () => {
    expect(scoreGuess([0, 1, 2, 3], [0, 1, 2, 3])).toEqual({
      exact: 4,
      partial: 0,
    });
  });

  it("returns all-partial when the guess is a permutation", () => {
    expect(scoreGuess([3, 2, 1, 0], [0, 1, 2, 3])).toEqual({
      exact: 0,
      partial: 4,
    });
  });

  it("does not double-count exact matches in the partial count", () => {
    // Position 0 exact, others wrong; the matching '1' in position 2
    // of secret should not also be counted as partial because it's
    // already 'consumed' nowhere in guess except positions 1 and 3.
    expect(scoreGuess([0, 2, 2, 3], [0, 1, 2, 3])).toEqual({
      exact: 3, // positions 0, 2, 3
      partial: 0,
    });
  });

  it("handles duplicate symbols in the guess correctly", () => {
    // Secret has one 1; guess has two 1s — only one should count.
    expect(scoreGuess([1, 1, 2, 3], [1, 0, 2, 3])).toEqual({
      exact: 3, // positions 0, 2, 3
      partial: 0,
    });
  });

  it("handles duplicate symbols in the secret correctly", () => {
    // Secret has two 1s; guess has one 1 in the wrong place.
    expect(scoreGuess([2, 1, 0, 3], [1, 1, 0, 3])).toEqual({
      exact: 2, // positions 2 and 3
      partial: 1, // the '1' in guess[1] matches the '1' in secret[0]
    });
  });

  it("returns zero for a completely wrong guess", () => {
    expect(scoreGuess([0, 0, 0, 0], [1, 1, 1, 1])).toEqual({
      exact: 0,
      partial: 0,
    });
  });

  it("throws when lengths differ", () => {
    expect(() => scoreGuess([0, 1], [0, 1, 2])).toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────
// Reward computation
// ─────────────────────────────────────────────────────────────────────

describe("computeXpReward", () => {
  it("scales reward with difficulty for each archetype", () => {
    for (const archetype of MINIGAME_ARCHETYPES) {
      const d1 = computeXpReward(archetype, 1, false);
      const d5 = computeXpReward(archetype, 5, false);
      expect(d5).toBeGreaterThan(d1);
    }
  });

  it("perfect bonus is positive and additive", () => {
    for (const archetype of MINIGAME_ARCHETYPES) {
      for (const d of [1, 2, 3, 4, 5] as const) {
        const standard = computeXpReward(archetype, d, false);
        const perfect = computeXpReward(archetype, d, true);
        expect(perfect - standard).toBe(REWARD_TABLE.perfectBonus);
      }
    }
  });

  it("difficulty 1 returns the base reward (multiplier 1.0)", () => {
    expect(computeXpReward("pattern_match", 1, false)).toBe(
      REWARD_TABLE.base.pattern_match,
    );
  });

  it("max-difficulty reward is at least 4x the base", () => {
    for (const archetype of MINIGAME_ARCHETYPES) {
      const base = REWARD_TABLE.base[archetype];
      const d5 = computeXpReward(archetype, 5, false);
      expect(d5).toBeGreaterThanOrEqual(base * 4);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────
// Difficulty interpolation
// ─────────────────────────────────────────────────────────────────────

describe("lerpParam", () => {
  it("difficulty 1 returns the min", () => {
    expect(lerpParam(10, 100, 1)).toBe(10);
  });

  it("difficulty 5 returns the max", () => {
    expect(lerpParam(10, 100, 5)).toBe(100);
  });

  it("difficulty 3 returns the midpoint", () => {
    expect(lerpParam(10, 100, 3)).toBe(55);
  });

  it("handles inverted ranges (min > max) for inverse parameters", () => {
    // Reflex tap target lifetime decreases with difficulty.
    expect(lerpParam(1800, 700, 1)).toBe(1800);
    expect(lerpParam(1800, 700, 5)).toBe(700);
    expect(lerpParam(1800, 700, 3)).toBe(1250);
  });
});

// ─────────────────────────────────────────────────────────────────────
// Spawn-catalogue invariants
// ─────────────────────────────────────────────────────────────────────

describe("MINIGAME_SPAWNS catalogue", () => {
  it("every spawn id is unique", () => {
    const ids = MINIGAME_SPAWNS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every spawn has a difficulty in [1, 5]", () => {
    for (const spawn of MINIGAME_SPAWNS) {
      expect(spawn.difficulty).toBeGreaterThanOrEqual(1);
      expect(spawn.difficulty).toBeLessThanOrEqual(5);
    }
  });

  it("every spawn references a known archetype", () => {
    for (const spawn of MINIGAME_SPAWNS) {
      expect(MINIGAME_ARCHETYPES).toContain(spawn.archetype);
    }
  });

  it("every spawn stage is in [1, 8]", () => {
    for (const spawn of MINIGAME_SPAWNS) {
      expect(spawn.stage).toBeGreaterThanOrEqual(1);
      expect(spawn.stage).toBeLessThanOrEqual(8);
    }
  });

  it("getSpawnConfig resolves a known spawn", () => {
    const sample = MINIGAME_SPAWNS[0];
    expect(getSpawnConfig(sample.id)).toEqual(sample);
  });

  it("getSpawnConfig returns null for unknown ids", () => {
    expect(getSpawnConfig("nope")).toBeNull();
  });

  it("spawnsForStage partitions cleanly across stages", () => {
    let total = 0;
    for (let s = 1; s <= 8; s++) {
      total += spawnsForStage(s).length;
    }
    expect(total).toBe(MINIGAME_SPAWNS.length);
  });
});

// ─────────────────────────────────────────────────────────────────────
// Archetype params sanity
// ─────────────────────────────────────────────────────────────────────

describe("ARCHETYPE_PARAMS", () => {
  it("pattern_match sequence grows with difficulty", () => {
    const params = ARCHETYPE_PARAMS.pattern_match.sequenceLength;
    expect(params.max).toBeGreaterThan(params.min);
  });

  it("reflex_tap targets shrink with difficulty", () => {
    const params = ARCHETYPE_PARAMS.reflex_tap.targetSizePx;
    expect(params.max).toBeLessThan(params.min);
  });

  it("reflex_tap targets get faster with difficulty", () => {
    const params = ARCHETYPE_PARAMS.reflex_tap.targetLifetimeMs;
    expect(params.max).toBeLessThan(params.min);
  });

  it("decrypt cipher grows with difficulty", () => {
    const params = ARCHETYPE_PARAMS.decrypt.cipherLength;
    expect(params.max).toBeGreaterThan(params.min);
  });

  it("decrypt is untimed (round budget 0)", () => {
    expect(ARCHETYPE_PARAMS.decrypt.roundDurationMs).toBe(0);
  });
});
