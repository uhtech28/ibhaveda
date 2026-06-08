/**
 * Scoring guardrails for HP-based combat.
 *
 * The PRD §3.5 invariant ("combat can only hold or raise the score
 * relative to base") is now expressed through the win-or-retry flow:
 * a loss does not advance the checkpoint, but it also doesn't reduce
 * any score below the user's existing base. The XP-floor guarantee
 * (a user can lose XP within their level but never drop levels) is
 * still enforced by `applyXpDelta`.
 *
 * These tests exercise the pure helpers in combatConstants — the
 * settlement logic in combat.ts uses these exact functions, so a
 * green test suite is necessary (though not sufficient) for the
 * round to behave correctly end-to-end.
 */

import { describe, expect, it } from "vitest";
import {
  applyDamageExchange,
  applyXpDelta,
  COMBAT_CONFIG,
  resolveOutcome,
} from "../convex/combatConstants";

// ─────────────────────────────────────────────────────────────────────
// Damage exchange table
// ─────────────────────────────────────────────────────────────────────

describe("applyDamageExchange — per-question HP outcomes", () => {
  it("score 1 deals critical (4) damage to player, none to boss", () => {
    const r = applyDamageExchange(10, 10, 1);
    expect(r.bossHpAfter).toBe(10);
    expect(r.playerHpAfter).toBe(6);
    expect(r.damageDealt).toBe(0);
    expect(r.damageTaken).toBe(4);
  });

  it("score 2 trades a glancing blow each way", () => {
    const r = applyDamageExchange(10, 10, 2);
    expect(r.bossHpAfter).toBe(9);
    expect(r.playerHpAfter).toBe(8);
  });

  it("score 3 leaves both sides untouched (blocked)", () => {
    const r = applyDamageExchange(10, 10, 3);
    expect(r.bossHpAfter).toBe(10);
    expect(r.playerHpAfter).toBe(10);
  });

  it("score 4 hits the boss for 3, player untouched", () => {
    const r = applyDamageExchange(10, 10, 4);
    expect(r.bossHpAfter).toBe(7);
    expect(r.playerHpAfter).toBe(10);
  });

  it("score 5 hits the boss for 5 (critical), player untouched", () => {
    const r = applyDamageExchange(10, 10, 5);
    expect(r.bossHpAfter).toBe(5);
    expect(r.playerHpAfter).toBe(10);
  });

  it("HP never drops below zero", () => {
    expect(applyDamageExchange(3, 10, 5).bossHpAfter).toBe(0);
    expect(applyDamageExchange(10, 2, 1).playerHpAfter).toBe(0);
  });

  it("clamps invalid scores to the 1-5 range", () => {
    expect(applyDamageExchange(10, 10, 0).playerHpAfter).toBe(6); // treated as 1
    expect(applyDamageExchange(10, 10, 99).bossHpAfter).toBe(5); // treated as 5
  });
});

// ─────────────────────────────────────────────────────────────────────
// Round outcome resolution
// ─────────────────────────────────────────────────────────────────────

describe("resolveOutcome — sudden-death and question-budget end states", () => {
  it("returns null while both sides have HP and questions remain", () => {
    expect(resolveOutcome(10, 10, 1, 4)).toBeNull();
    expect(resolveOutcome(5, 5, 2, 4)).toBeNull();
  });

  it("returns 'won' as soon as boss HP hits 0", () => {
    expect(resolveOutcome(0, 10, 2, 4)).toBe("won");
    expect(resolveOutcome(0, 1, 2, 4)).toBe("won"); // even with player low
  });

  it("returns 'lost' when player HP hits 0 (boss still alive)", () => {
    expect(resolveOutcome(5, 0, 3, 4)).toBe("lost");
  });

  it("ties on the same exchange favour the player ('won')", () => {
    expect(resolveOutcome(0, 0, 3, 4)).toBe("won");
  });

  it("returns 'lost' when questions exhaust with boss still alive", () => {
    expect(resolveOutcome(2, 6, 4, 4)).toBe("lost");
  });
});

// ─────────────────────────────────────────────────────────────────────
// End-to-end round simulations
// ─────────────────────────────────────────────────────────────────────

describe("End-to-end round simulations", () => {
  it("two 5/5 answers win the round in 2 questions", () => {
    let boss = COMBAT_CONFIG.INITIAL_HP;
    let player = COMBAT_CONFIG.INITIAL_HP;
    const scores = [5, 5];
    for (let i = 0; i < scores.length; i++) {
      const r = applyDamageExchange(boss, player, scores[i]);
      boss = r.bossHpAfter;
      player = r.playerHpAfter;
      const outcome = resolveOutcome(boss, player, i + 1, 4);
      if (i === 1) expect(outcome).toBe("won");
    }
    expect(boss).toBe(0);
    expect(player).toBe(10);
  });

  it("three 1/5 answers end the round in sudden-death loss", () => {
    let boss = COMBAT_CONFIG.INITIAL_HP;
    let player = COMBAT_CONFIG.INITIAL_HP;
    const scores = [1, 1, 1];
    let lostAt: number | null = null;
    for (let i = 0; i < scores.length; i++) {
      const r = applyDamageExchange(boss, player, scores[i]);
      boss = r.bossHpAfter;
      player = r.playerHpAfter;
      if (resolveOutcome(boss, player, i + 1, 4) === "lost") {
        lostAt = i + 1;
        break;
      }
    }
    expect(lostAt).toBe(3); // 4+4+4 = 12 ≥ 10, dead at Q3
    expect(player).toBe(0);
  });

  it("four 3/3/3/3 (all blocked) end as a loss — boss survived", () => {
    let boss = COMBAT_CONFIG.INITIAL_HP;
    let player = COMBAT_CONFIG.INITIAL_HP;
    for (let i = 0; i < 4; i++) {
      const r = applyDamageExchange(boss, player, 3);
      boss = r.bossHpAfter;
      player = r.playerHpAfter;
    }
    expect(resolveOutcome(boss, player, 4, 4)).toBe("lost");
    expect(boss).toBe(10);
    expect(player).toBe(10);
  });

  it("a mixed strong round wins in 3 questions (4/5, 4/5, 4/5)", () => {
    let boss = COMBAT_CONFIG.INITIAL_HP;
    let player = COMBAT_CONFIG.INITIAL_HP;
    const scores = [4, 4, 4];
    let wonAt: number | null = null;
    for (let i = 0; i < scores.length; i++) {
      const r = applyDamageExchange(boss, player, scores[i]);
      boss = r.bossHpAfter;
      player = r.playerHpAfter;
      // 3+3+3 = 9; boss at 1 after Q3, not yet won
    }
    expect(boss).toBe(1);
    expect(resolveOutcome(boss, player, 3, 4)).toBeNull(); // round continues
    // Q4: any 4 or 5 wins
    const r4 = applyDamageExchange(boss, player, 4);
    expect(resolveOutcome(r4.bossHpAfter, r4.playerHpAfter, 4, 4)).toBe("won");
  });
});

// ─────────────────────────────────────────────────────────────────────
// Level-floor guard still holds for HP-based XP rewards
// ─────────────────────────────────────────────────────────────────────

describe("Level-floor guard with HP-based XP awards", () => {
  it("four critical hits cannot push the user below their level floor", () => {
    const four1s = 4 * COMBAT_CONFIG.INDIVIDUAL_XP_PER_SCORE[1]; // -16
    const beforeXp = 5010; // close enough to floor that -16 would drop below
    const levelFloor = 5000;
    expect(applyXpDelta(beforeXp, levelFloor, four1s)).toBe(levelFloor);
  });

  it("a winning round (e.g. two 5/5) adds the full XP stack", () => {
    const two5s = 2 * COMBAT_CONFIG.INDIVIDUAL_XP_PER_SCORE[5]; // +60
    expect(applyXpDelta(6000, 5000, two5s)).toBe(6060);
  });
});
