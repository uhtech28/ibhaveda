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
 */
export const getTopTeamLadder = query({
  args: { limit: v.optional(v.number()) },
  handler: async (
    ctx,
    { limit },
  ): Promise<TeamLadderEntry[]> => {
    const viewer = await maybeAuthedUser(ctx);

    const since = Date.now() - SEVEN_DAYS_MS;
    const events = await ctx.db
      .query("projectWeeklyPoints")
      .withIndex("by_awarded", (q) => q.gte("awardedAt", since))
      .collect();

    if (events.length === 0) return [];

    // Aggregate by idea.
    const byIdea = new Map<
      string,
      { total: number; earliest: number }
    >();
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
      // Tiebreak — earlier attainment wins (PRD §4 tiebreak rule).
      return a[1].earliest - b[1].earliest;
    });

    const cap = Math.min(ranked.length, limit ?? ranked.length);

    // Determine zones — collapsed in single-tier mode.
    const hideZones = isSingleTierMode();

    const out: TeamLadderEntry[] = [];
    for (let i = 0; i < cap; i++) {
      const [ideaIdStr, agg] = ranked[i];
      const ideaId = ideaIdStr as unknown as Id<"ideas">;
      const idea = await ctx.db.get(ideaId);
      if (!idea) continue;
      const author = await ctx.db.get(idea.authorId);
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
