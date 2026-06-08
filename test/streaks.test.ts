/**
 * Streak v2 — date helper unit tests.
 *
 * The rollover logic in `recordAction` depends entirely on the
 * `todayUtcString` and `yesterdayUtcString` helpers. If those agree
 * on day boundaries, the streak state machine is correct. These tests
 * lock the boundary behaviour in place so timezone-related regressions
 * surface immediately.
 *
 * The state-machine assertions for the full mutation are intentionally
 * omitted here — they would require a full Convex test harness with
 * scheduler mocking. The pure helpers are the high-value test surface.
 */

import { describe, expect, it } from "vitest";
import {
  todayUtcString,
  yesterdayUtcString,
} from "../convex/streaks";

describe("todayUtcString", () => {
  it("returns the date portion of an ISO UTC timestamp", () => {
    const fixed = Date.UTC(2026, 5, 15, 10, 30, 0); // 2026-06-15T10:30:00Z
    expect(todayUtcString(fixed)).toBe("2026-06-15");
  });

  it("returns the same string for any time within a UTC day", () => {
    const earlyMorning = Date.UTC(2026, 5, 15, 0, 0, 1);
    const lateEvening = Date.UTC(2026, 5, 15, 23, 59, 59);
    expect(todayUtcString(earlyMorning)).toBe(todayUtcString(lateEvening));
  });

  it("rolls over exactly at UTC midnight, not local midnight", () => {
    const justBefore = Date.UTC(2026, 5, 15, 23, 59, 59);
    const justAfter = Date.UTC(2026, 5, 16, 0, 0, 0);
    expect(todayUtcString(justBefore)).toBe("2026-06-15");
    expect(todayUtcString(justAfter)).toBe("2026-06-16");
  });
});

describe("yesterdayUtcString", () => {
  it("returns the day before today", () => {
    const fixed = Date.UTC(2026, 5, 15, 12, 0, 0);
    expect(yesterdayUtcString(fixed)).toBe("2026-06-14");
  });

  it("rolls back across month boundaries", () => {
    const firstOfJune = Date.UTC(2026, 5, 1, 10, 0, 0);
    expect(yesterdayUtcString(firstOfJune)).toBe("2026-05-31");
  });

  it("rolls back across year boundaries", () => {
    const newYearsDay = Date.UTC(2026, 0, 1, 1, 0, 0);
    expect(yesterdayUtcString(newYearsDay)).toBe("2025-12-31");
  });

  it("handles leap-day boundary correctly", () => {
    const mar1Leap = Date.UTC(2024, 2, 1, 10, 0, 0);
    expect(yesterdayUtcString(mar1Leap)).toBe("2024-02-29");

    const mar1Normal = Date.UTC(2026, 2, 1, 10, 0, 0);
    expect(yesterdayUtcString(mar1Normal)).toBe("2026-02-28");
  });

  it("is consistent with todayUtcString — yesterday(today) === today(today - 24h)", () => {
    const t = Date.UTC(2026, 5, 15, 12, 0, 0);
    const dayMs = 24 * 60 * 60 * 1000;
    expect(yesterdayUtcString(t)).toBe(todayUtcString(t - dayMs));
  });
});

describe("Streak rollover sequencing (date pairs)", () => {
  // These tests use the helpers to reason about what the mutation
  // logic will see as `lastDate` and `today`, without invoking the
  // mutation itself. They lock in that the three relevant date
  // relationships (same-day, day-after, gap) are distinguishable.

  it("same UTC day → maintained branch", () => {
    const t = Date.UTC(2026, 5, 15, 8, 0, 0);
    const tLater = Date.UTC(2026, 5, 15, 20, 0, 0);
    expect(todayUtcString(t)).toBe(todayUtcString(tLater));
  });

  it("consecutive UTC days → incremented branch", () => {
    const t = Date.UTC(2026, 5, 15, 8, 0, 0);
    const tNext = Date.UTC(2026, 5, 16, 8, 0, 0);
    expect(yesterdayUtcString(tNext)).toBe(todayUtcString(t));
  });

  it("non-consecutive days → reset branch", () => {
    const t = Date.UTC(2026, 5, 15, 8, 0, 0);
    const tPlusTwo = Date.UTC(2026, 5, 17, 8, 0, 0);
    expect(yesterdayUtcString(tPlusTwo)).not.toBe(todayUtcString(t));
  });
});
