/**
 * Streak v2 — action-based engagement streaks (PRD §9).
 *
 * The v1 streak (still living in `convex/gamification.ts`) incremented
 * on session start, which meant any user who opened the tab once a
 * day was "active." Streaks lost their meaning.
 *
 * v2 increments the streak only when the user does something
 * meaningful. Per PRD §9.2, the qualifying-action set is exactly:
 *
 *   - makes a contribution to a project    → "made_contribution"
 *   - completes a task                      → "submitted_task"
 *   - fires a flare                         → "fired_flare"
 *   - answers a flare                       → "responded_to_flare"
 *
 * Plain logins do not count. Posting an idea, sparking, commenting,
 * winning combat, or clearing a checkpoint do not advance the streak
 * either — they are real engagement, but the PRD intentionally
 * narrows streak credit to actions that build *for someone else*.
 *
 * Schema:
 *   - `userStreaks.lastActionDate` is the source of truth in v2.
 *   - `userStreaks.lastLoginDate` (legacy) is kept for backward
 *     compatibility — it's read as a fallback when `lastActionDate`
 *     is absent and is no longer written by this module.
 *   - `userStreaks.timezone` (new in PRD §9) caches the user's IANA
 *     zone, e.g. "America/New_York". Day boundaries are computed
 *     against this zone (AC4). Falls back to UTC when absent.
 *
 * Wiring:
 *   - The `recordAction` internalMutation below is the only entry
 *     point that bumps a streak. Call it from any mutation that
 *     represents a meaningful action (see `MeaningfulActionType`).
 *   - The `setMyTimezone` mutation is called once from the client on
 *     app load so future streak credit lands in the user's local day.
 *
 * Rewards:
 *   - 10 XP + 10 points are awarded the first time the streak
 *     advances for a given local-day. Repeat actions on the same day
 *     are no-ops on the streak (idempotent — calling 12 times on the
 *     same day still only awards once). Per PRD §9 edge cases:
 *     two devices firing at the day boundary still produce one
 *     advance because the same `lastActionDate` is written.
 */

import { v } from "convex/values";
import {
  internalMutation,
  mutation,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";

/**
 * Closed set of action types that bump the streak (PRD §9.2).
 * Adding to this union is a single-line change here plus the schema
 * union in `convex/schema.ts` plus the call-site addition.
 *
 * Centralised per PRD §9 AC5 — adding/removing an action requires
 * only this constants change (and a schema-union update).
 */
export const MEANINGFUL_ACTION_TYPES = [
  "made_contribution",
  "submitted_task",
  "fired_flare",
  "responded_to_flare",
] as const;
export type MeaningfulActionType = (typeof MEANINGFUL_ACTION_TYPES)[number];

const meaningfulActionValidator = v.union(
  v.literal("made_contribution"),
  v.literal("submitted_task"),
  v.literal("fired_flare"),
  v.literal("responded_to_flare"),
);

const STREAK_DAY_XP = 10;
const STREAK_DAY_POINTS = 10;

// ─────────────────────────────────────────────────────────────────────
// Public query
// ─────────────────────────────────────────────────────────────────────

/**
 * Current authenticated user's streak. Reads `lastActionDate` first,
 * falls back to `lastLoginDate` for any pre-migration rows.
 */
export const getMyStreak = query({
  args: {},
  handler: async (ctx) => {
    const user = await maybeUser(ctx);
    if (!user) {
      return { currentStreak: 0, longestStreak: 0, lastActionDate: null };
    }

    const row = await ctx.db
      .query("userStreaks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!row) {
      return { currentStreak: 0, longestStreak: 0, lastActionDate: null };
    }

    return {
      currentStreak: row.currentStreak,
      longestStreak: row.longestStreak,
      lastActionDate: row.lastActionDate ?? row.lastLoginDate ?? null,
    };
  },
});

/**
 * Any user's streak, by id. Used on profile pages.
 */
export const getStreakForUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const row = await ctx.db
      .query("userStreaks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!row) {
      return { currentStreak: 0, longestStreak: 0, lastActionDate: null };
    }
    return {
      currentStreak: row.currentStreak,
      longestStreak: row.longestStreak,
      lastActionDate: row.lastActionDate ?? row.lastLoginDate ?? null,
    };
  },
});

// ─────────────────────────────────────────────────────────────────────
// Public: timezone setup (PRD §9 AC4)
// ─────────────────────────────────────────────────────────────────────

/**
 * Cache the authenticated user's IANA timezone (e.g. "Asia/Kolkata")
 * so subsequent `recordAction` calls evaluate day boundaries in the
 * user's local time. Idempotent — the client may call this on every
 * app load; we only write when the value differs.
 *
 * Called from the client on app load:
 *   `setMyTimezone({ timezone: Intl.DateTimeFormat().resolvedOptions().timeZone })`
 */
export const setMyTimezone = mutation({
  args: { timezone: v.string() },
  handler: async (ctx, { timezone }) => {
    const user = await maybeUser(ctx);
    if (!user) return { ok: false as const, reason: "unauthenticated" };

    // Defensive validation — `timezone` is taken from the browser; if
    // it's nonsense, fall back to UTC silently rather than persisting
    // garbage that would later break date formatting.
    if (!isValidTimeZone(timezone)) {
      return { ok: false as const, reason: "invalid-timezone" };
    }

    const row = await ctx.db
      .query("userStreaks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!row) {
      // Row will be created on first qualifying action; the next
      // `recordAction` will read the timezone we already passed.
      // We persist a minimal row so the TZ is available immediately.
      await ctx.db.insert("userStreaks", {
        userId: user._id,
        currentStreak: 0,
        longestStreak: 0,
        lastLoginDate: "",
        lastStreakUpdate: Date.now(),
        timezone,
      });
      return { ok: true as const, created: true };
    }

    if (row.timezone === timezone) {
      return { ok: true as const, created: false, changed: false };
    }

    await ctx.db.patch(row._id, { timezone });
    return { ok: true as const, created: false, changed: true };
  },
});

// ─────────────────────────────────────────────────────────────────────
// Internal: the one entry point that bumps a streak
// ─────────────────────────────────────────────────────────────────────

/**
 * Record a meaningful action for `userId`. Updates the streak according
 * to the rules:
 *
 *   - First record ever → create the row, currentStreak = 1, award.
 *   - Action on same local day as last action → no-op, no award.
 *   - Action on the next local day → increment streak, update longest,
 *     award.
 *   - Action more than one day after last action → reset streak to 1,
 *     award (today counts as a new day-one).
 *
 * Idempotent: repeat calls on the same local day for the same user
 * leave the row unchanged and skip the reward. The action type is
 * recorded on the row as `lastActionType` for analytics.
 *
 * Designed to be called from any meaningful mutation via
 * `ctx.runMutation(internal.streaks.recordAction, { userId, actionType })`.
 * The mutation never throws — it logs and returns on any unexpected
 * state so streak failures cannot block the primary mutation.
 */
export const recordAction = internalMutation({
  args: {
    userId: v.id("users"),
    actionType: meaningfulActionValidator,
  },
  handler: async (ctx, { userId, actionType }) => {
    const row = await ctx.db
      .query("userStreaks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const tz = row?.timezone ?? "UTC";
    const today = localDateString(Date.now(), tz);
    const yesterday = localDateString(Date.now() - 24 * 60 * 60 * 1000, tz);

    if (!row) {
      await ctx.db.insert("userStreaks", {
        userId,
        currentStreak: 1,
        longestStreak: 1,
        // Mirror the action date into the legacy `lastLoginDate` so
        // any older code paths that still read it stay consistent.
        lastLoginDate: today,
        lastActionDate: today,
        lastActionType: actionType,
        lastStreakUpdate: Date.now(),
        recoveryAvailable: true,
        timezone: tz === "UTC" ? undefined : tz,
      });
      await awardDayReward(ctx, userId, actionType);
      return { status: "started", streak: 1 } as const;
    }

    const lastDate = row.lastActionDate ?? row.lastLoginDate ?? null;

    if (lastDate === today) {
      // Already counted today — no-op (AC3 idempotency).
      return {
        status: "maintained",
        streak: row.currentStreak,
      } as const;
    }

    if (lastDate === yesterday) {
      const newStreak = row.currentStreak + 1;
      await ctx.db.patch(row._id, {
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, row.longestStreak),
        lastActionDate: today,
        lastActionType: actionType,
        lastStreakUpdate: Date.now(),
      });
      await awardDayReward(ctx, userId, actionType);
      return { status: "incremented", streak: newStreak } as const;
    }

    // Missed at least one day → reset (AC6 — streak breaks).
    await ctx.db.patch(row._id, {
      currentStreak: 1,
      lastActionDate: today,
      lastActionType: actionType,
      lastStreakUpdate: Date.now(),
    });
    await awardDayReward(ctx, userId, actionType);
    return { status: "reset", streak: 1 } as const;
  },
});

// ─────────────────────────────────────────────────────────────────────
// One-shot migration
// ─────────────────────────────────────────────────────────────────────

/**
 * Copies `lastLoginDate` into `lastActionDate` for any row that has
 * the former but not the latter. Safe to run multiple times; safe to
 * run alongside live writes (writes the field only when absent).
 *
 * Run manually via:
 *   npx convex run streaks:migrateLastActionDate
 */
export const migrateLastActionDate = mutation({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("userStreaks").collect();
    let migrated = 0;
    for (const r of rows) {
      if (r.lastActionDate || !r.lastLoginDate) continue;
      await ctx.db.patch(r._id, { lastActionDate: r.lastLoginDate });
      migrated += 1;
    }
    return { migrated, total: rows.length };
  },
});

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

/**
 * Local "YYYY-MM-DD" string for `now` evaluated in IANA zone `tz`.
 * Uses `Intl.DateTimeFormat` which is supported by Convex's V8
 * runtime (ECMA-402). Falls back to UTC if the zone is invalid.
 *
 * PRD §9 AC4 — day boundary evaluated in the user's local timezone.
 * Edge case "action seconds before local midnight counts for that
 * day; seconds after counts for the next day" is satisfied because
 * the formatter resolves the calendar date at the wall-clock instant.
 */
export function localDateString(now: number, tz: string): string {
  try {
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    // en-CA emits "YYYY-MM-DD" natively.
    return fmt.format(new Date(now));
  } catch {
    return new Date(now).toISOString().slice(0, 10);
  }
}

/**
 * Returns true if `tz` is a valid IANA timezone string. Convex's V8
 * supports the full ECMA-402 zone database.
 */
function isValidTimeZone(tz: string): boolean {
  if (!tz || typeof tz !== "string") return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** UTC "YYYY-MM-DD" string for the current moment (legacy helper). */
export function todayUtcString(now: number = Date.now()): string {
  return new Date(now).toISOString().slice(0, 10);
}

/** UTC "YYYY-MM-DD" string for one day before `now` (legacy helper). */
export function yesterdayUtcString(now: number = Date.now()): string {
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

async function awardDayReward(
  ctx: any,
  userId: Id<"users">,
  actionType: MeaningfulActionType,
): Promise<void> {
  await ctx.scheduler.runAfter(0, internal.gamification.internalAwardXP, {
    userId,
    amount: STREAK_DAY_XP,
    action: "streak_day",
  });
  await ctx.scheduler.runAfter(0, internal.gamification.internalAwardPoints, {
    userId,
    amount: STREAK_DAY_POINTS,
    type: "streak_day",
    description: `Daily streak via ${actionType}`,
  });
}

async function maybeUser(ctx: any): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
    .first();
}
