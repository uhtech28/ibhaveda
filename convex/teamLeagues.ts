// Project league — same engine as convex/leagues.ts but the entity
// is an idea (not a user) and the weekly tally is the trailing 7-day
// sum from the projectWeeklyPoints ledger. See PRD §4.

import { v } from "convex/values";
import {
  internalMutation,
  mutation,
  query,
  type QueryCtx,
} from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { isCreatedProfileIdea } from "./ideaFilters";
import {
  ACTIVE_LEAGUE_COUNT,
  highestActiveTier,
  isSingleTierMode,
  nextWeekStartUtcMs,
  type LeagueTierId,
} from "./leagueConstants";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// Award path
// ─────────────────────────────────────────────────────────────────────

/**
 * Append a project-lane points award. Called from the same flows that
 * grant individual XP — e.g. a contribution being accepted, a task
 * completing, or a flare being answered on the project. The amount
 * is the points value (caller chooses; the Team board treats them
 * as opaque integers).
 *
 * Safe to call from any context — the row insert is idempotent at the
 * caller level (each event should produce at most one award).
 */
export const bumpProjectWeeklyPoints = internalMutation({
  args: {
    ideaId: v.id("ideas"),
    contributorId: v.optional(v.id("users")),
    amount: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.amount <= 0) return null;
    return await ctx.db.insert("projectWeeklyPoints", {
      ideaId: args.ideaId,
      contributorId: args.contributorId,
      amount: args.amount,
      awardedAt: Date.now(),
      reason: args.reason,
    });
  },
});

// ─────────────────────────────────────────────────────────────────────
// Read path
// ─────────────────────────────────────────────────────────────────────

export interface TeamLadderEntry {
  rank: number;
  ideaId: Id<"ideas">;
  title: string;
  authorId: Id<"users">;
  authorDisplayName: string;
  weeklyPoints: number;
  isViewerProject: boolean;
  isInPromotionZone: boolean;
  isInRelegationZone: boolean;
}

/**
 * Top N projects by trailing-7-day points (PRD §4 AC5). When the
 * viewer is signed in, their own projects' rows are tagged so the UI
 * can highlight them.
 *
 * Sorted by points desc; tiebreak (PRD §4) is the project with the
 * earlier first-points-this-week (smaller earliest awardedAt within
 * the window). Falls back to idea _creationTime if no events.
 *
 * `fillToLimit` (opt-in): when the trailing-7-day window has fewer than
 * `limit` projects, expand the lookback window one week at a time (up to
 * 52 weeks) until the podium fills — mirroring the user leaderboard's
 * `getWeeklyLeaderboard` fallback. The /leagues Team board leaves this
 * off so it stays a strict weekly competition; the community podium
 * turns it on so it never renders empty when history exists.
 */
export const getTopTeamLadder = query({
  args: {
    limit: v.optional(v.number()),
    fillToLimit: v.optional(v.boolean()),
  },
  handler: async (
    ctx,
    { limit, fillToLimit },
  ): Promise<TeamLadderEntry[]> => {
    const viewer = await maybeAuthedUser(ctx);
    const now = Date.now();

    // Aggregate all project-lane events awarded since `since`, ranked by
    // total points desc (tiebreak: earlier first-award wins, PRD §4).
    const rankWindow = async (since: number) => {
      const events = await ctx.db
        .query("projectWeeklyPoints")
        .withIndex("by_awarded", (q) => q.gte("awardedAt", since))
        .collect();

      const byIdea = new Map<string, { total: number; earliest: number }>();
      for (const e of events) {
        const prev = byIdea.get(String(e.ideaId));
        if (prev) {
          prev.total += e.amount;
          if (e.awardedAt < prev.earliest) prev.earliest = e.awardedAt;
        } else {
          byIdea.set(String(e.ideaId), { total: e.amount, earliest: e.awardedAt });
        }
      }

      return Array.from(byIdea.entries()).sort((a, b) => {
        if (b[1].total !== a[1].total) return b[1].total - a[1].total;
        return a[1].earliest - b[1].earliest;
      });
    };

    // Strict trailing-7-day window by default. With `fillToLimit`, keep
    // expanding the window a week at a time until it holds at least
    // `limit` projects (or we hit the 52-week cap). Each expansion is a
    // superset, so ranking only ever gains projects.
    const target = limit ?? 0;
    const maxLookbackWeeks = fillToLimit ? 52 : 1;
    let ranked: Array<[string, { total: number; earliest: number }]> = [];
    for (let weeks = 1; weeks <= maxLookbackWeeks; weeks++) {
      ranked = await rankWindow(now - weeks * SEVEN_DAYS_MS);
      if (ranked.length >= target) break;
    }

    if (ranked.length === 0) return [];

    const cap = Math.min(ranked.length, limit ?? ranked.length);

    // Determine zones — collapsed in single-tier mode.
    const hideZones = isSingleTierMode();

    const out: TeamLadderEntry[] = [];
    for (let i = 0; i < cap; i++) {
      const [ideaIdStr, agg] = ranked[i];
      const ideaId = ideaIdStr as unknown as Id<"ideas">;
      const idea = await ctx.db.get(ideaId);
      if (!idea) continue;
      if (!isCreatedProfileIdea(idea)) continue;
      const author = await ctx.db.get(idea.authorId);
      if (author?.isActive === false) continue;
      const isViewerProject =
        !!viewer && (idea.authorId === viewer._id);

      out.push({
        rank: i + 1,
        ideaId,
        title: idea.title ?? "Untitled project",
        authorId: idea.authorId,
        authorDisplayName: author?.displayName ?? "Anonymous",
        weeklyPoints: agg.total,
        isViewerProject,
        isInPromotionZone: false,
        isInRelegationZone: hideZones ? false : false, // future expansion
      });
    }
    return out;
  },
});

/**
 * The viewer's own projects' team-board status. Returns one summary
 * row per project the viewer authors, so the page can render
 * "Project X scored 240 points this week, ranked #3 of 12".
 */
export const getMyTeamLeagueStatus = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await maybeAuthedUser(ctx);
    if (!viewer) return null;

    const myIdeas = await ctx.db
      .query("ideas")
      .withIndex("by_author", (q) => q.eq("authorId", viewer._id))
      .collect();

    if (myIdeas.length === 0) {
      return {
        ideas: [] as Array<{
          ideaId: Id<"ideas">;
          title: string;
          weeklyPoints: number;
          rank: number;
          population: number;
        }>,
        tier: highestActiveTier() as LeagueTierId,
        singleTierMode: isSingleTierMode(),
        activeLeagueCount: ACTIVE_LEAGUE_COUNT,
        nextResetAtMs: nextWeekStartUtcMs(Date.now()),
      };
    }

    const since = Date.now() - SEVEN_DAYS_MS;
    const events = await ctx.db
      .query("projectWeeklyPoints")
      .withIndex("by_awarded", (q) => q.gte("awardedAt", since))
      .collect();

    // Aggregate same as the ladder.
    const byIdea = new Map<string, { total: number; earliest: number }>();
    for (const e of events) {
      const prev = byIdea.get(String(e.ideaId));
      if (prev) {
        prev.total += e.amount;
        if (e.awardedAt < prev.earliest) prev.earliest = e.awardedAt;
      } else {
        byIdea.set(String(e.ideaId), { total: e.amount, earliest: e.awardedAt });
      }
    }

    const ranked = Array.from(byIdea.entries()).sort((a, b) => {
      if (b[1].total !== a[1].total) return b[1].total - a[1].total;
      return a[1].earliest - b[1].earliest;
    });
    const population = ranked.length;
    const rankByIdea = new Map(ranked.map(([id], i) => [id, i + 1]));

    const ideaSummaries = myIdeas.map((idea: Doc<"ideas">) => {
      const key = String(idea._id);
      const agg = byIdea.get(key);
      return {
        ideaId: idea._id,
        title: idea.title ?? "Untitled project",
        weeklyPoints: agg?.total ?? 0,
        rank: rankByIdea.get(key) ?? population + 1,
        population,
      };
    });

    return {
      ideas: ideaSummaries,
      tier: highestActiveTier() as LeagueTierId,
      singleTierMode: isSingleTierMode(),
      activeLeagueCount: ACTIVE_LEAGUE_COUNT,
      nextResetAtMs: nextWeekStartUtcMs(Date.now()),
    };
  },
});

// ─────────────────────────────────────────────────────────────────────
// Public dev/staging trigger — useful for seeding test data
// ─────────────────────────────────────────────────────────────────────

/**
 * Append a project-lane points event from the client. Gated to the
 * project's author so a random client can't pump up an idea's score.
 * Mostly here for local testing — production point grants go through
 * the internal mutation above.
 */
export const awardProjectPointsManual = mutation({
  args: {
    ideaId: v.id("ideas"),
    amount: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const viewer = await maybeAuthedUser(ctx);
    if (!viewer) throw new Error("Not authenticated");
    const idea = await ctx.db.get(args.ideaId);
    if (!idea) throw new Error("Project not found");
    if (idea.authorId !== viewer._id) {
      throw new Error("Only the project author can award test points");
    }
    if (args.amount <= 0) throw new Error("Amount must be positive");
    return await ctx.db.insert("projectWeeklyPoints", {
      ideaId: args.ideaId,
      contributorId: viewer._id,
      amount: args.amount,
      awardedAt: Date.now(),
      reason: args.reason,
    });
  },
});

// ─────────────────────────────────────────────────────────────────────
// One-time backfill
// ─────────────────────────────────────────────────────────────────────

/** Marker written to `reason` so backfilled rows are identifiable and
 *  the migration is idempotent (re-running skips already-backfilled
 *  requests). Format: `${prefix}${contributionRequestId}`. */
const BACKFILL_REASON_PREFIX = "backfill:accepted-contribution:";

/**
 * Replay historically accepted contribution requests into the
 * projectWeeklyPoints ledger. The live bump wiring
 * (contributionRequests.updateStatus → bumpProjectWeeklyPoints) only
 * records events going forward, so the Team / Top Projects board has no
 * history to show. This migration reconstructs that history.
 *
 * Point value mirrors the live award exactly: 10 for public ideas, 5
 * for private (see contributionRequests.updateStatus). `awardedAt` uses
 * the request's `updatedAt` — the acceptance timestamp — so the
 * community podium's backward-fill dates each entry correctly.
 *
 * Batched + idempotent + resumable: processes one page per call and
 * returns `continueCursor`/`isDone`. Drive it to completion by calling
 * again with the returned cursor until `isDone` is true. Re-running is
 * safe — rows already backfilled (matched by the reason marker) are
 * skipped.
 *
 *   # dry run first (inserts nothing, just reports what it would do)
 *   npx convex run --prod teamLeagues:backfillProjectPointsFromAcceptedContributions '{"dryRun":true}'
 *   # then for real, following the cursor until isDone
 *   npx convex run --prod teamLeagues:backfillProjectPointsFromAcceptedContributions '{}'
 */
export const backfillProjectPointsFromAcceptedContributions = internalMutation({
  args: {
    cursor: v.optional(v.union(v.string(), v.null())),
    batchSize: v.optional(v.number()),
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? 100;
    const dryRun = args.dryRun ?? false;

    const page = await ctx.db
      .query("contributionRequests")
      .paginate({ cursor: args.cursor ?? null, numItems: batchSize });

    let scanned = 0;
    let inserted = 0;
    let skippedExisting = 0;
    let skippedNotAccepted = 0;
    let skippedNoIdea = 0;

    for (const req of page.page) {
      scanned++;
      if (req.status !== "accepted") {
        skippedNotAccepted++;
        continue;
      }

      const marker = `${BACKFILL_REASON_PREFIX}${req._id}`;

      // Idempotency — skip if this request was already backfilled. Scoped
      // to the idea via the by_idea_awarded index so the scan stays cheap.
      const existingForIdea = await ctx.db
        .query("projectWeeklyPoints")
        .withIndex("by_idea_awarded", (q) => q.eq("ideaId", req.ideaId))
        .collect();
      if (existingForIdea.some((e) => e.reason === marker)) {
        skippedExisting++;
        continue;
      }

      const idea = await ctx.db.get(req.ideaId);
      if (!idea) {
        skippedNoIdea++;
        continue;
      }

      // Mirror the live award in contributionRequests.updateStatus.
      const amount = idea.visibility === "public" ? 10 : 5;
      const awardedAt = req.updatedAt ?? req.createdAt ?? req._creationTime;

      if (!dryRun) {
        await ctx.db.insert("projectWeeklyPoints", {
          ideaId: req.ideaId,
          contributorId: req.contributorId,
          amount,
          awardedAt,
          reason: marker,
        });
      }
      inserted++;
    }

    return {
      dryRun,
      isDone: page.isDone,
      continueCursor: page.isDone ? null : page.continueCursor,
      batch: {
        scanned,
        inserted,
        skippedExisting,
        skippedNotAccepted,
        skippedNoIdea,
      },
    };
  },
});

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

async function maybeAuthedUser(
  ctx: QueryCtx,
): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .first();
}
