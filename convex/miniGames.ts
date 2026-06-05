/**
 * Mini-game easter eggs — session lifecycle.
 *
 * Public surface:
 *   query    getAvailableSpawnsForVenture  spawns the user hasn't completed
 *   query    getMyCompletedSpawnIds        which spawns have been cleared
 *   mutation startSession                  create a session for a spawn
 *   mutation completeSession               record completion + award reward
 *   mutation abandonSession                user closed the panel
 *
 * Design:
 *   - One row per session in `miniGameSessions` (active / completed / abandoned)
 *   - One row per (user, spawn) win in `miniGameCompletions` — exists =
 *     spawn is consumed; subsequent `startSession` calls refuse with
 *     `spawn_already_completed`.
 *   - Anti-cheat: minimum plausible duration per archetype. A
 *     completion faster than the floor is flagged (`integrityFlagged`)
 *     and the reward is suppressed. No auto-ban — this is easter-egg
 *     content, not a competitive ladder.
 *   - Reward emission goes through `internal.gamification.internalAwardXP`
 *     so XP, levels, and leagues all stay coordinated.
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
  computeXpReward,
  getSpawnConfig,
  MIN_PLAUSIBLE_DURATION_MS,
  MINIGAME_ARCHETYPES,
  type MiniGameArchetype,
} from "./miniGameConstants";
import type { MiniGameReward } from "./miniGameTypes";

// ─────────────────────────────────────────────────────────────────────
// Validators
// ─────────────────────────────────────────────────────────────────────

const archetypeValidator = v.union(
  v.literal("pattern_match"),
  v.literal("reflex_tap"),
  v.literal("decrypt"),
);

const difficultyValidator = v.union(
  v.literal(1),
  v.literal(2),
  v.literal(3),
  v.literal(4),
  v.literal(5),
);

const sceneResultValidator = v.object({
  completed: v.boolean(),
  score: v.number(),
  maxScore: v.number(),
  durationMs: v.number(),
  extra: v.union(
    v.object({
      archetype: v.literal("pattern_match"),
      sequenceLength: v.number(),
      stepsCompleted: v.number(),
    }),
    v.object({
      archetype: v.literal("reflex_tap"),
      targetsHit: v.number(),
      targetsMissed: v.number(),
      targetsTotal: v.number(),
    }),
    v.object({
      archetype: v.literal("decrypt"),
      cipherLength: v.number(),
      guessesUsed: v.number(),
      maxGuesses: v.number(),
    }),
  ),
});

// ─────────────────────────────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────────────────────────────

/**
 * Spawn point ids the current user has already completed. The world
 * map uses this to hide the relevant spawn entities.
 */
export const getMyCompletedSpawnIds = query({
  args: {},
  handler: async (ctx): Promise<string[]> => {
    const userId = await maybeUserId(ctx);
    if (!userId) return [];
    const rows = await ctx.db
      .query("miniGameCompletions")
      .withIndex("by_user_completed", (q) => q.eq("userId", userId))
      .collect();
    return rows.map((r) => r.spawnPointId);
  },
});

/**
 * Active session for the current user, if any. Used to resume a
 * mid-game refresh.
 */
export const getActiveSession = query({
  args: {},
  handler: async (ctx) => {
    const userId = await maybeUserId(ctx);
    if (!userId) return null;
    const row = await ctx.db
      .query("miniGameSessions")
      .withIndex("by_user_active", (q) =>
        q.eq("userId", userId).eq("status", "active"),
      )
      .first();
    if (!row) return null;
    return {
      _id: row._id,
      spawnPointId: row.spawnPointId,
      archetype: row.archetype,
      difficulty: row.difficulty,
      ventureId: row.ventureId ?? null,
      startedAt: row.startedAt,
      status: row.status,
    };
  },
});

// ─────────────────────────────────────────────────────────────────────
// Mutations — lifecycle
// ─────────────────────────────────────────────────────────────────────

export const startSession = mutation({
  args: {
    spawnPointId: v.string(),
    ventureId: v.optional(v.id("ventures")),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);

    const spawn = getSpawnConfig(args.spawnPointId);
    if (!spawn) {
      throw new Error(`Unknown spawn point: ${args.spawnPointId}`);
    }

    // Refuse if already completed.
    const completion = await ctx.db
      .query("miniGameCompletions")
      .withIndex("by_user_spawn", (q) =>
        q.eq("userId", userId).eq("spawnPointId", args.spawnPointId),
      )
      .first();
    if (completion) {
      throw new Error("spawn_already_completed");
    }

    // If another session is active, resume it rather than creating a duplicate.
    const existingActive = await ctx.db
      .query("miniGameSessions")
      .withIndex("by_user_active", (q) =>
        q.eq("userId", userId).eq("status", "active"),
      )
      .first();
    if (existingActive) {
      if (existingActive.spawnPointId === args.spawnPointId) {
        return { sessionId: existingActive._id, resumed: true };
      }
      // Different spawn — abandon the old session before starting fresh.
      await ctx.db.patch(existingActive._id, {
        status: "abandoned",
        endedAt: Date.now(),
      });
    }

    const sessionId = await ctx.db.insert("miniGameSessions", {
      userId,
      spawnPointId: args.spawnPointId,
      archetype: spawn.archetype,
      difficulty: spawn.difficulty,
      ventureId: args.ventureId,
      status: "active",
      startedAt: Date.now(),
    });
    return { sessionId, resumed: false };
  },
});

export const abandonSession = mutation({
  args: { sessionId: v.id("miniGameSessions") },
  handler: async (ctx, { sessionId }) => {
    const userId = await requireUserId(ctx);
    const session = await ctx.db.get(sessionId);
    if (!session || session.userId !== userId) {
      throw new Error("Not the session owner");
    }
    if (session.status !== "active") {
      return { ok: true, noop: true };
    }
    await ctx.db.patch(sessionId, {
      status: "abandoned",
      endedAt: Date.now(),
    });
    return { ok: true };
  },
});

export const completeSession = mutation({
  args: {
    sessionId: v.id("miniGameSessions"),
    result: sceneResultValidator,
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== userId) {
      throw new Error("Not the session owner");
    }
    if (session.status !== "active") {
      throw new Error(`Session already ${session.status}`);
    }

    const spawn = getSpawnConfig(session.spawnPointId);
    if (!spawn) {
      throw new Error("Spawn config gone — refusing to complete");
    }

    // Anti-cheat: minimum plausible duration.
    const flag = checkIntegrity(args.result, session);
    const isWin = args.result.completed && !flag;

    const scoreNormalized =
      args.result.maxScore > 0
        ? Math.max(0, Math.min(1, args.result.score / args.result.maxScore))
        : 0;

    await ctx.db.patch(args.sessionId, {
      status: "completed",
      endedAt: Date.now(),
      scoreNormalized,
      integrityFlagged: flag !== null,
      integrityFlagReason: flag ?? undefined,
    });

    if (isWin) {
      // Mark spawn as consumed (idempotent — `by_user_spawn` uniqueness
      // is enforced by the prior `startSession` check, but a duplicate
      // here is harmless).
      await ctx.db.insert("miniGameCompletions", {
        userId,
        spawnPointId: session.spawnPointId,
        sessionId: args.sessionId,
        completedAt: Date.now(),
        xpAwarded: computeXpReward(
          session.archetype,
          session.difficulty,
          scoreNormalized >= 0.95,
        ),
      });
    }

    const reward: MiniGameReward | null = isWin
      ? {
          kind: "xp",
          amount: computeXpReward(
            session.archetype,
            session.difficulty,
            scoreNormalized >= 0.95,
          ),
        }
      : null;

    if (reward && reward.kind === "xp") {
      await ctx.scheduler.runAfter(0, internal.gamification.internalAwardXP, {
        userId,
        amount: reward.amount,
        action: `minigame_${session.archetype}`,
      });
    }

    return {
      sessionId: args.sessionId,
      spawnPointId: session.spawnPointId,
      archetype: session.archetype,
      difficulty: session.difficulty,
      outcome: isWin ? ("won" as const) : ("lost" as const),
      scoreNormalized,
      reward: reward ?? ({ kind: "xp", amount: 0 } as MiniGameReward),
      flagged: flag !== null,
      flagReason: flag,
    };
  },
});

// ─────────────────────────────────────────────────────────────────────
// Anti-cheat
// ─────────────────────────────────────────────────────────────────────

/**
 * Returns a flag reason if the result looks tampered, or null if the
 * result is plausible. The function never auto-bans — flagging just
 * suppresses the reward and records the reason for analytics.
 */
/** Shape of the result payload after the Convex argument validator
 *  has already narrowed it at the mutation boundary. Kept as a local
 *  interface so the integrity check can reference fields directly
 *  without a `validator extends infer` dance. */
interface SceneResultPayload {
  durationMs: number;
  score: number;
  maxScore: number;
  extra: {
    archetype: MiniGameArchetype;
    sequenceLength?: number;
    stepsCompleted?: number;
    targetsTotal?: number;
    targetsHit?: number;
    cipherLength?: number;
    guessesUsed?: number;
    maxGuesses?: number;
  };
}

function checkIntegrity(
  result: SceneResultPayload,
  session: Doc<"miniGameSessions">,
): string | null {
  const r = result;

  if (r.durationMs < 0 || r.durationMs > 10 * 60_000) {
    return "duration_out_of_range";
  }
  if (r.score < 0 || r.score > r.maxScore + 1) {
    return "score_out_of_range";
  }

  if (r.extra.archetype !== session.archetype) {
    return "archetype_mismatch";
  }

  switch (r.extra.archetype) {
    case "pattern_match": {
      const len = r.extra.sequenceLength ?? 0;
      const min = MIN_PLAUSIBLE_DURATION_MS.pattern_match(len);
      if (r.durationMs < min) return "duration_below_floor";
      if ((r.extra.stepsCompleted ?? 0) > len) return "steps_overflow";
      return null;
    }
    case "reflex_tap": {
      const total = r.extra.targetsTotal ?? 0;
      const min = MIN_PLAUSIBLE_DURATION_MS.reflex_tap(total);
      if (r.durationMs < min) return "duration_below_floor";
      if ((r.extra.targetsHit ?? 0) > total) return "hits_overflow";
      return null;
    }
    case "decrypt": {
      const min = MIN_PLAUSIBLE_DURATION_MS.decrypt();
      if (r.durationMs < min) return "duration_below_floor";
      const used = r.extra.guessesUsed ?? 0;
      const max = r.extra.maxGuesses ?? 0;
      if (used > max + 1) return "guesses_overflow";
      return null;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

async function requireUserId(ctx: any): Promise<Id<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
    .first();
  if (!user) throw new Error("User not found");
  return user._id;
}

async function maybeUserId(ctx: any): Promise<Id<"users"> | null> {
  try {
    return await requireUserId(ctx);
  } catch {
    return null;
  }
}
