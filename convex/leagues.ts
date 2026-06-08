/**
 * League system — queries, weekly cron handler, and the XP hook.
 *
 * Public surface (client):
 *   query getMyLeagueStatus       current tier + rank + promotion/relegation zones
 *   query getLadderForMyTier      ranked users in the viewer's current tier
 *   query getMyLatestHistory      most recent week's finish for "last week" UI
 *
 * Internal:
 *   internalMutation bumpWeeklyXp        called from the XP pipeline
 *   internalMutation runWeeklyPromotion  cron handler — runs every Sunday UTC
 *
 * Design choices:
 *   - Weekly XP lives on the existing `userLevels` row, not a separate
 *     ledger, to keep the hot-path mutation cheap.
 *   - History is recorded once per user per week in `leagueWeeklyHistory`
 *     so the UI can show last week's finish without re-running the
 *     promotion math.
 *   - The cron handler is idempotent — running it twice on the same
 *     week is a no-op (it checks `lastLeagueResetAt`).
 *   - Promotion / relegation never throws on the XP hook side. A
 *     failure inside the league module cannot block an XP award.
 */

import { v } from "convex/values";
import {
  internalMutation,
  mutation,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import {
  computeZones,
  getTier,
  LEAGUE_TIERS,
  tierAbove,
  tierBelow,
  weekStartUtcMs,
  nextWeekStartUtcMs,
  isSingleTierMode,
  isTierActive,
  highestActiveTier,
  ACTIVE_LEAGUE_COUNT,
  type LeagueTierId,
} from "./leagueConstants";

const tierLiteral = v.union(
  v.literal("bronze"),
  v.literal("silver"),
  v.literal("gold"),
  v.literal("platinum"),
  v.literal("diamond"),
);

// ─────────────────────────────────────────────────────────────────────
// Public queries
// ─────────────────────────────────────────────────────────────────────

/**
 * Current user's league status. Returns null when the user has no
 * `userLevels` row yet (brand-new user; the row is created on first
 * XP award).
 */
export const getMyLeagueStatus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await maybeAuthedUserId(ctx);
    if (!userId) return null;

    const levelRow = await ctx.db
      .query("userLevels")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!levelRow) return null;

    const tier = (levelRow.currentLeagueTier ?? "bronze") as LeagueTierId;
    const weeklyXp = levelRow.weeklyLeagueXp ?? 0;

    const tierPopulation = await ctx.db
      .query("userLevels")
      .filter((q) => q.eq(q.field("currentLeagueTier"), tier))
      .collect();
    // Rank by descending weeklyXp; ties broken by earlier _creationTime
    // so the leaderboard is deterministic.
    const ranked = [...tierPopulation].sort((a, b) => {
      const xa = a.weeklyLeagueXp ?? 0;
      const xb = b.weeklyLeagueXp ?? 0;
      if (xb !== xa) return xb - xa;
      return a._creationTime - b._creationTime;
    });
    const rankIndex = ranked.findIndex((r) => r.userId === userId);
    const rank = rankIndex >= 0 ? rankIndex + 1 : ranked.length;

    // PRD §4 AC2 — in single-tier mode the zones collapse so the UI
    // can render the board as a flat weekly cohort with a reset timer
    // (no promotion / relegation chevrons or legend).
    const hideZones = isSingleTierMode();
    const rawZones = computeZones(ranked.length);
    const zones = hideZones
      ? { promotionCount: 0, relegationStartAt: ranked.length }
      : rawZones;

    const inPromotionZone =
      !hideZones && rankIndex >= 0 && rankIndex < zones.promotionCount;
    const inRelegationZone =
      !hideZones && rankIndex >= 0 && rankIndex >= zones.relegationStartAt;

    // XP needed to overtake the user currently at the bottom of the
    // promotion zone. 0 if already there, if zones are hidden, or if
    // the zone doesn't fire for this population.
    let xpToPromotion = 0;
    if (
      !hideZones &&
      !inPromotionZone &&
      zones.promotionCount > 0 &&
      ranked.length > zones.promotionCount
    ) {
      const cutoffXp = ranked[zones.promotionCount - 1].weeklyLeagueXp ?? 0;
      xpToPromotion = Math.max(0, cutoffXp + 1 - weeklyXp);
    }

    return {
      tier,
      rank,
      population: ranked.length,
      weeklyXp,
      zones: {
        promotionCount: zones.promotionCount,
        relegationStartAt: zones.relegationStartAt,
      },
      // PRD §4 — single-tier-mode flag drives UI; activeLeagueCount
      // tells the page how many tiers are live for any "ladder is
      // configuring" copy.
      hideZones,
      singleTierMode: hideZones,
      activeLeagueCount: ACTIVE_LEAGUE_COUNT,
      nextResetAtMs: nextWeekStartUtcMs(Date.now()),
      inPromotionZone,
      inRelegationZone,
      xpToPromotion,
      canPromote: !hideZones && tierAbove(tier) !== null && isTierActive(tierAbove(tier) as LeagueTierId),
      canRelegate: !hideZones && tierBelow(tier) !== null,
    };
  },
});

export interface LadderEntry {
  rank: number;
  userId: Id<"users">;
  displayName: string;
  avatar: string | null;
  weeklyXp: number;
  isViewer: boolean;
  isInPromotionZone: boolean;
  isInRelegationZone: boolean;
}

/**
 * Full ladder for the viewer's current tier. Used by `LeagueLadder.tsx`
 * to render the rank list with promotion / relegation zones marked.
 */
export const getLadderForMyTier = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }): Promise<LadderEntry[]> => {
    const viewerId = await maybeAuthedUserId(ctx);
    if (!viewerId) return [];

    const viewerRow = await ctx.db
      .query("userLevels")
      .withIndex("by_user", (q) => q.eq("userId", viewerId))
      .first();
    if (!viewerRow) return [];

    const tier = (viewerRow.currentLeagueTier ?? "bronze") as LeagueTierId;

    const all = await ctx.db
      .query("userLevels")
      .filter((q) => q.eq(q.field("currentLeagueTier"), tier))
      .collect();
    const ranked = [...all].sort((a, b) => {
      const xa = a.weeklyLeagueXp ?? 0;
      const xb = b.weeklyLeagueXp ?? 0;
      if (xb !== xa) return xb - xa;
      return a._creationTime - b._creationTime;
    });

    // PRD §4 AC2 — flatten zones in single-tier mode so the rendered
    // ladder doesn't mark any rows as promoting / relegating.
    const hideZones = isSingleTierMode();
    const zones = hideZones
      ? { promotionCount: 0, relegationStartAt: ranked.length }
      : computeZones(ranked.length);
    const cap = Math.min(ranked.length, limit ?? ranked.length);

    const entries: LadderEntry[] = [];
    for (let i = 0; i < cap; i++) {
      const row = ranked[i];
      const user = await ctx.db.get(row.userId);
      if (!user) continue;
      entries.push({
        rank: i + 1,
        userId: row.userId,
        displayName: user.displayName ?? user.displayName ?? "Anonymous",
        avatar: user.avatar ?? null,
        weeklyXp: row.weeklyLeagueXp ?? 0,
        isViewer: row.userId === viewerId,
        isInPromotionZone: !hideZones && i < zones.promotionCount,
        isInRelegationZone: !hideZones && i >= zones.relegationStartAt,
      });
    }
    return entries;
  },
});

/**
 * Most-recent finished week for the viewer — used to show
 * "Last week: 4th in Silver — held" or "promoted to Gold" on the
 * status card.
 */
export const getMyLatestHistory = query({
  args: {},
  handler: async (ctx) => {
    const userId = await maybeAuthedUserId(ctx);
    if (!userId) return null;
    const row = await ctx.db
      .query("leagueWeeklyHistory")
      .withIndex("by_user_week", (q) => q.eq("userId", userId))
      .order("desc")
      .first();
    if (!row) return null;
    return {
      weekStartAt: row.weekStartAt,
      tier: row.tier as LeagueTierId,
      rankInTier: row.rankInTier,
      weeklyXp: row.weeklyXp,
      outcome: row.outcome,
      nextTier: row.nextTier as LeagueTierId,
    };
  },
});

// ─────────────────────────────────────────────────────────────────────
// XP hook — called from the existing XP pipeline
// ─────────────────────────────────────────────────────────────────────

/**
 * Bump a user's weekly league XP by `amount`. Idempotent on missing
 * rows — silently no-ops rather than throwing — so XP awards never
 * break the calling mutation.
 *
 * Called from `gamification.internalAwardXP` (snippet in the
 * call-site patches file). Pass the same `amount` that was awarded
 * to lifetime XP; the league system uses it as-is.
 */
export const bumpWeeklyXp = internalMutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
  },
  handler: async (ctx, { userId, amount }) => {
    if (amount <= 0) return;
    const row = await ctx.db
      .query("userLevels")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!row) return;

    const current = row.weeklyLeagueXp ?? 0;
    await ctx.db.patch(row._id, {
      weeklyLeagueXp: current + amount,
      currentLeagueTier: row.currentLeagueTier ?? "bronze",
    });
  },
});

// ─────────────────────────────────────────────────────────────────────
// Cron handler — weekly promotion / relegation pass
// ─────────────────────────────────────────────────────────────────────

/**
 * Idempotent weekly promotion pass.
 *
 * Process per tier:
 *   1. Collect every userLevels row in this tier.
 *   2. Sort by weeklyXp desc, then by _creationTime asc as a
 *      deterministic tiebreaker.
 *   3. Compute promotion + relegation zones from
 *      `computeZones(populationSize)`.
 *   4. For each user, write a history row recording finish position,
 *      tier, and outcome. Then patch `userLevels` with the new tier
 *      (or no change if held).
 *   5. Reset `weeklyLeagueXp` to 0 for everyone in the tier.
 *
 * The handler runs ALL tiers in a single transaction-equivalent
 * pass. The cron triggers it once a week at Sunday 00:00 UTC.
 *
 * Idempotency: each row's `lastLeagueResetAt` is checked against the
 * current `weekStartUtcMs`. Users already processed this week are
 * skipped — so re-running the handler (e.g. a cron retry) is safe.
 */
export const runWeeklyPromotion = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const weekStart = weekStartUtcMs(now);

    const summary: Record<
      LeagueTierId,
      { processed: number; promoted: number; relegated: number; held: number }
    > = {
      bronze: { processed: 0, promoted: 0, relegated: 0, held: 0 },
      silver: { processed: 0, promoted: 0, relegated: 0, held: 0 },
      gold: { processed: 0, promoted: 0, relegated: 0, held: 0 },
      platinum: { processed: 0, promoted: 0, relegated: 0, held: 0 },
      diamond: { processed: 0, promoted: 0, relegated: 0, held: 0 },
    };

    // PRD §4 AC2 — when only one tier is active, the engine collapses
    // to "everyone in one weekly cohort": no promotion / relegation,
    // just a flat reset, and any row sitting in a dormant tier is
    // squashed up into the highest active tier.
    const squashTarget = highestActiveTier();

    for (const tier of LEAGUE_TIERS) {
      const rows = await ctx.db
        .query("userLevels")
        .filter((q) => q.eq(q.field("currentLeagueTier"), tier.id))
        .collect();

      const ranked = [...rows].sort((a, b) => {
        const xa = a.weeklyLeagueXp ?? 0;
        const xb = b.weeklyLeagueXp ?? 0;
        if (xb !== xa) return xb - xa;
        // PRD §4 tiebreak — earlier attainment wins (deterministic).
        return a._creationTime - b._creationTime;
      });

      const tierIsActive = isTierActive(tier.id);
      // Zones only matter when more than one tier is live AND this
      // tier itself is active. In single-tier mode they collapse to
      // zero so the engine is a flat reset.
      const zones = isSingleTierMode() || !tierIsActive
        ? { promotionCount: 0, relegationStartAt: ranked.length }
        : computeZones(ranked.length);
      const above = tierAbove(tier.id);
      const below = tierBelow(tier.id);

      for (let i = 0; i < ranked.length; i++) {
        const row = ranked[i];
        if ((row.lastLeagueResetAt ?? 0) >= weekStart) {
          continue; // already processed this week
        }

        let outcome: "promoted" | "relegated" | "held" = "held";
        let nextTier: LeagueTierId = tier.id;

        if (!tierIsActive) {
          // Row lives in a dormant tier — squash to the highest active
          // tier on this roll. Counted as "held" in summary because no
          // promotion / relegation actually fired; the user simply
          // sees themselves rejoin the active cohort.
          nextTier = squashTarget;
          summary[tier.id].held += 1;
        } else if (i < zones.promotionCount && above !== null && isTierActive(above)) {
          outcome = "promoted";
          nextTier = above;
          summary[tier.id].promoted += 1;
        } else if (i >= zones.relegationStartAt && below !== null) {
          outcome = "relegated";
          nextTier = below;
          summary[tier.id].relegated += 1;
        } else {
          summary[tier.id].held += 1;
        }

        await ctx.db.insert("leagueWeeklyHistory", {
          userId: row.userId,
          weekStartAt: weekStart,
          tier: tier.id,
          rankInTier: i + 1,
          weeklyXp: row.weeklyLeagueXp ?? 0,
          outcome,
          nextTier,
        });

        await ctx.db.patch(row._id, {
          currentLeagueTier: nextTier,
          weeklyLeagueXp: 0,
          lastLeagueResetAt: weekStart,
        });
        summary[tier.id].processed += 1;
      }
    }

    return { weekStart, summary };
  },
});

/**
 * Public manual trigger — useful in development / staging. Production
 * uses the cron in convex/crons.ts. Requires the caller to be the user
 * with `clerkId === process.env.LEAGUES_ADMIN_CLERK_ID` so it can't
 * be called by random clients.
 */
export const runWeeklyPromotionManual = mutation({
  args: {},
  handler: async (ctx): Promise<unknown> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const admin = process.env.LEAGUES_ADMIN_CLERK_ID;
    if (!admin || identity.subject !== admin) {
      throw new Error("Forbidden");
    }
    return await ctx.runMutation(internal.leagues.runWeeklyPromotion, {});
  },
});

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

async function maybeAuthedUserId(ctx: any): Promise<Id<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
    .first();
  return user?._id ?? null;
}
