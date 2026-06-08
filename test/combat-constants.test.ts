import { describe, expect, it } from "vitest";
import {
  applyXpDelta,
  clampDuration,
  COMBAT_CONFIG,
  currentMonthBucket,
  durationForComplexity,
  questionCountForRound,
} from "../convex/combatConstants";

describe("COMBAT_CONFIG invariants", () => {
  it("anti-cheat signal weights sum to exactly 1.0", () => {
    const sum = Object.values(COMBAT_CONFIG.AI_SIGNAL_WEIGHTS).reduce(
      (a, b) => a + b,
      0,
    );
    expect(Math.abs(sum - 1)).toBeLessThan(1e-6);
  });

  it("score floor is at the documented value", () => {
    expect(COMBAT_CONFIG.SCORE_FLOOR).toBe(0.4);
  });

  it("initial HP equals 10 for both sides", () => {
    expect(COMBAT_CONFIG.INITIAL_HP).toBe(10);
  });

  it("damage table — score 1 is critical but not auto-fatal", () => {
    const dmg = COMBAT_CONFIG.DAMAGE_BY_SCORE[1];
    expect(dmg.toPlayer).toBeGreaterThan(0);
    expect(dmg.toPlayer).toBeLessThan(COMBAT_CONFIG.INITIAL_HP);
  });

  it("damage table — two perfect 5/5 answers can defeat the boss", () => {
    const perfectDmg = COMBAT_CONFIG.DAMAGE_BY_SCORE[5].toBoss * 2;
    expect(perfectDmg).toBeGreaterThanOrEqual(COMBAT_CONFIG.INITIAL_HP);
  });

  it("damage table — three critical 1/1/1 answers defeat the player", () => {
    const tripleCrit = COMBAT_CONFIG.DAMAGE_BY_SCORE[1].toPlayer * 3;
    expect(tripleCrit).toBeGreaterThanOrEqual(COMBAT_CONFIG.INITIAL_HP);
  });

  it("damage table — two critical hits leave the player alive", () => {
    const doubleCrit = COMBAT_CONFIG.DAMAGE_BY_SCORE[1].toPlayer * 2;
    expect(doubleCrit).toBeLessThan(COMBAT_CONFIG.INITIAL_HP);
  });

  it("monthly cap is currently disabled (v1)", () => {
    expect(COMBAT_CONFIG.MONTHLY_CAP_ENABLED).toBe(false);
  });

  it("monthly cap placeholder values are sensible when enabled later", () => {
    expect(COMBAT_CONFIG.MONTHLY_CAP_BY_TIER.free).toBeGreaterThan(0);
    expect(COMBAT_CONFIG.MONTHLY_CAP_BY_TIER.pro).toBeGreaterThan(
      COMBAT_CONFIG.MONTHLY_CAP_BY_TIER.free,
    );
  });

  it("every duration band has floor <= default <= ceiling", () => {
    for (const tier of Object.values(COMBAT_CONFIG.DURATION_BANDS_MS)) {
      expect(tier.floor).toBeLessThanOrEqual(tier.default);
      expect(tier.default).toBeLessThanOrEqual(tier.ceiling);
    }
  });

  it("score 1 deducts xp, scores 2-5 award xp", () => {
    const tbl = COMBAT_CONFIG.INDIVIDUAL_XP_PER_SCORE;
    expect(tbl[1]).toBeLessThan(0);
    expect(tbl[2]).toBeGreaterThan(0);
    expect(tbl[3]).toBeGreaterThan(tbl[2]);
    expect(tbl[4]).toBeGreaterThan(tbl[3]);
    expect(tbl[5]).toBeGreaterThan(tbl[4]);
  });
});

describe("questionCountForRound", () => {
  it("returns the band minimum for a perfect base score", () => {
    expect(questionCountForRound("free", 1.0)).toBe(2);
    expect(questionCountForRound("pro", 1.0)).toBe(5);
  });

  it("returns the band maximum for a zero base score", () => {
    expect(questionCountForRound("free", 0)).toBe(4);
    expect(questionCountForRound("pro", 0)).toBe(8);
  });

  it("scales linearly across the band", () => {
    // Free: 2-4, span=2. baseScore=0.5 -> weakness=0.5 -> 2 + 1 = 3
    expect(questionCountForRound("free", 0.5)).toBe(3);
    // Pro:  5-8, span=3. baseScore=0.5 -> weakness=0.5 -> 5 + 1.5 -> rounded -> 7
    expect(questionCountForRound("pro", 0.5)).toBe(7);
  });

  it("clamps invalid base scores", () => {
    expect(questionCountForRound("free", -10)).toBe(4); // treated as 0
    expect(questionCountForRound("free", 99)).toBe(2); // treated as 1
    expect(questionCountForRound("free", Number.NaN)).toBe(4); // treated as 0
  });
});

describe("durationForComplexity / clampDuration", () => {
  it("returns the default duration for the named tier", () => {
    expect(durationForComplexity("low")).toBe(45_000);
    expect(durationForComplexity("medium")).toBe(90_000);
    expect(durationForComplexity("high")).toBe(180_000);
  });

  it("falls back to medium when tier is undefined", () => {
    expect(durationForComplexity(undefined)).toBe(90_000);
  });

  it("clampDuration enforces floor and ceiling", () => {
    expect(clampDuration("low", 5_000)).toBe(30_000); // below floor
    expect(clampDuration("low", 60_000)).toBe(60_000); // at ceiling
    expect(clampDuration("low", 999_999)).toBe(60_000); // above ceiling
    expect(clampDuration("high", 150_000)).toBe(150_000); // within band
  });
});

describe("currentMonthBucket", () => {
  it("formats UTC year-month as YYYY-MM", () => {
    const dec2024 = Date.UTC(2024, 11, 15, 10, 0, 0);
    expect(currentMonthBucket(dec2024)).toBe("2024-12");

    const jan2025 = Date.UTC(2025, 0, 1, 0, 0, 0);
    expect(currentMonthBucket(jan2025)).toBe("2025-01");

    const jun2026 = Date.UTC(2026, 5, 30, 23, 59, 59);
    expect(currentMonthBucket(jun2026)).toBe("2026-06");
  });
});

describe("applyXpDelta — level-floor guard", () => {
  it("adds xp normally for positive deltas (uncapped)", () => {
    expect(applyXpDelta(6000, 5000, 50)).toBe(6050);
    expect(applyXpDelta(6000, 5000, 100_000)).toBe(106_000);
  });

  it("deducts xp within the current level's buffer", () => {
    expect(applyXpDelta(6000, 5000, -100)).toBe(5900);
    expect(applyXpDelta(6000, 5000, -1000)).toBe(5000);
  });

  it("clamps at the level minimum on overflow downward", () => {
    // User on L6 with only a tiny buffer can't drop below L6 floor.
    expect(applyXpDelta(5050, 5000, -200)).toBe(5000);
    expect(applyXpDelta(5000, 5000, -200)).toBe(5000);
    expect(applyXpDelta(5000, 5000, -99_999)).toBe(5000);
  });

  it("zero delta is a no-op", () => {
    expect(applyXpDelta(6000, 5000, 0)).toBe(6000);
  });
});
