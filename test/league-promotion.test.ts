/**
 * League system — pure-function tests.
 *
 * The state machine inside `runWeeklyPromotion` is driven entirely by
 * the helpers in `leagueConstants` (tier ordering + zone math) and
 * `weekStartUtcMs` (boundary detection). If those hold, the cron is
 * correct.
 */

import { describe, expect, it } from "vitest";
import {
  computeZones,
  getTier,
  LEAGUE_TIERS,
  MIN_TIER_POPULATION_FOR_PROMOTIONS,
  PROMOTION_TOP_FRACTION,
  RELEGATION_BOTTOM_FRACTION,
  tierAbove,
  tierBelow,
  weekStartUtcMs,
  nextWeekStartUtcMs,
} from "../convex/leagueConstants";

// ─────────────────────────────────────────────────────────────────────
// Tier ordering
// ─────────────────────────────────────────────────────────────────────

describe("tier ordering", () => {
  it("has five tiers in ascending order", () => {
    expect(LEAGUE_TIERS).toHaveLength(5);
    expect(LEAGUE_TIERS[0].id).toBe("bronze");
    expect(LEAGUE_TIERS[4].id).toBe("diamond");
    for (let i = 1; i < LEAGUE_TIERS.length; i++) {
      expect(LEAGUE_TIERS[i].order).toBeGreaterThan(LEAGUE_TIERS[i - 1].order);
    }
  });

  it("tierAbove returns the next tier or null at the top", () => {
    expect(tierAbove("bronze")).toBe("silver");
    expect(tierAbove("silver")).toBe("gold");
    expect(tierAbove("gold")).toBe("platinum");
    expect(tierAbove("platinum")).toBe("diamond");
    expect(tierAbove("diamond")).toBeNull();
  });

  it("tierBelow returns the previous tier or null at the bottom", () => {
    expect(tierBelow("diamond")).toBe("platinum");
    expect(tierBelow("platinum")).toBe("gold");
    expect(tierBelow("gold")).toBe("silver");
    expect(tierBelow("silver")).toBe("bronze");
    expect(tierBelow("bronze")).toBeNull();
  });

  it("getTier resolves the tier metadata", () => {
    expect(getTier("bronze").name).toBe("Bronze");
    expect(getTier("diamond").color).toMatch(/^#/);
  });
});

// ─────────────────────────────────────────────────────────────────────
// Zone math
// ─────────────────────────────────────────────────────────────────────

describe("computeZones", () => {
  it("no promotions or relegations for very small populations", () => {
    expect(computeZones(0).promotionCount).toBe(0);
    expect(computeZones(1).promotionCount).toBe(0);
    expect(computeZones(MIN_TIER_POPULATION_FOR_PROMOTIONS - 1).promotionCount).toBe(0);
  });

  it("at minimum population, both zones fire with one user each", () => {
    const z = computeZones(MIN_TIER_POPULATION_FOR_PROMOTIONS);
    expect(z.promotionCount).toBeGreaterThanOrEqual(1);
    expect(z.relegationStartAt).toBeLessThan(MIN_TIER_POPULATION_FOR_PROMOTIONS);
  });

  it("scales linearly with population", () => {
    const z = computeZones(100);
    expect(z.promotionCount).toBe(Math.floor(100 * PROMOTION_TOP_FRACTION));
    expect(100 - z.relegationStartAt).toBe(
      Math.floor(100 * RELEGATION_BOTTOM_FRACTION),
    );
  });

  it("promotion + relegation zones don't overlap for reasonable populations", () => {
    for (const n of [5, 10, 25, 100, 500]) {
      const z = computeZones(n);
      expect(z.promotionCount).toBeLessThan(z.relegationStartAt);
    }
  });

  it("rank #1 (index 0) is always in the promotion zone when zones fire", () => {
    const z = computeZones(50);
    expect(0 < z.promotionCount).toBe(true);
  });

  it("last-rank user is always in the relegation zone when zones fire", () => {
    const n = 50;
    const z = computeZones(n);
    expect(n - 1 >= z.relegationStartAt).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────
// Week boundary
// ─────────────────────────────────────────────────────────────────────

describe("week boundaries", () => {
  it("weekStartUtcMs returns the previous Sunday 00:00 UTC", () => {
    // Wednesday 2026-06-17 10:30 UTC
    const t = Date.UTC(2026, 5, 17, 10, 30, 0);
    const start = weekStartUtcMs(t);
    const d = new Date(start);
    expect(d.getUTCDay()).toBe(0);
    expect(d.getUTCHours()).toBe(0);
    expect(d.getUTCMinutes()).toBe(0);
    expect(d.getUTCFullYear()).toBe(2026);
    expect(d.getUTCMonth()).toBe(5); // June
    expect(d.getUTCDate()).toBe(14); // Sunday June 14
  });

  it("Sunday at 00:00 UTC is its own week-start", () => {
    const t = Date.UTC(2026, 5, 14, 0, 0, 0);
    expect(weekStartUtcMs(t)).toBe(t);
  });

  it("Sunday at 23:59 UTC still maps to that Sunday morning", () => {
    const t = Date.UTC(2026, 5, 14, 23, 59, 59);
    const start = weekStartUtcMs(t);
    expect(new Date(start).getUTCDate()).toBe(14);
  });

  it("Saturday 23:59 UTC belongs to the previous week", () => {
    const t = Date.UTC(2026, 5, 20, 23, 59, 59);
    const start = weekStartUtcMs(t);
    expect(new Date(start).getUTCDate()).toBe(14);
  });

  it("nextWeekStartUtcMs is exactly 7 days after current week start", () => {
    const t = Date.UTC(2026, 5, 17, 10, 30, 0);
    const current = weekStartUtcMs(t);
    const next = nextWeekStartUtcMs(t);
    expect(next - current).toBe(7 * 24 * 60 * 60 * 1000);
  });
});

// ─────────────────────────────────────────────────────────────────────
// End-to-end zone simulation
// ─────────────────────────────────────────────────────────────────────

describe("end-to-end: who promotes / relegates in a tier of 10", () => {
  const populationSize = 10;
  const zones = computeZones(populationSize);

  it("ranks 1 and 2 promote (top 20% of 10)", () => {
    expect(zones.promotionCount).toBe(2);
  });

  it("ranks 9 and 10 relegate (bottom 20% of 10)", () => {
    expect(populationSize - zones.relegationStartAt).toBe(2);
  });

  it("middle ranks 3-8 hold their tier", () => {
    for (let i = 2; i < zones.relegationStartAt; i++) {
      expect(i).toBeLessThan(zones.relegationStartAt);
      expect(i).toBeGreaterThanOrEqual(zones.promotionCount);
    }
  });
});
