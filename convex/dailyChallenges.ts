/**
 * @file dailyChallenges.ts
 * @description Daily challenge system — small engagement loop that
 *  gives every user 3 rotating challenges per local day. Fills the
 *  "no daily challenges" gap in the gamification audit.
 *
 * Design:
 *   - 7 challenge templates, one rotation per day of week (deterministic
 *     so the whole community sees the same challenges on a given day)
 *   - Each day the user gets 3 challenges: 1 easy, 1 medium, 1 aspirational
 *   - Progress increments live via `bumpProgress` internalMutation called
 *     from qualifying action mutations (submitTaskContent, fireFlare,
 *     respondToFlare, sendMessage, advanceCheckpoint)
 *   - Per-challenge XP awarded automatically when target hit
 *   - "All three complete" bonus (75 XP) claimable via `claimDailyBonus`
 *   - Challenges auto-generate on first `getMyDailyChallenges` per day
 *     — no cron needed; lazy creation on read
 *
 * Trade-offs:
 *   - Rotation is deterministic (per day-of-week) which is simple but
 *     means Monday always shows the same set. Fine for demo; add
 *     randomised per-user seeding later if farming becomes an issue.
 */

import { v } from "convex/values";
import {
  internalMutation,
  mutation,
  query,
  type QueryCtx,
  type MutationCtx,
} from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";

// ─────────────────────────────────────────────────────────────
// Challenge template catalog
// ─────────────────────────────────────────────────────────────

interface ChallengeTemplate {
  id: string;
  label: string;
  actionType: string;      // must match the string passed to bumpProgress
  target: number;
  xpReward: number;
  difficulty: "easy" | "medium" | "hard";
}

const TEMPLATES: readonly ChallengeTemplate[] = [
  // Easy — one-and-done actions
  { id: "fire_flare_1",     label: "Fire a flare",              actionType: "fire_flare",     target: 1, xpReward: 15, difficulty: "easy" },
  { id: "send_chat_1",      label: "Start a conversation",      actionType: "send_chat",      target: 1, xpReward: 10, difficulty: "easy" },
  { id: "clear_checkpoint_1", label: "Clear a checkpoint",       actionType: "clear_checkpoint", target: 1, xpReward: 20, difficulty: "easy" },

  // Medium — a small streak of the same action
  { id: "submit_tasks_3",   label: "Submit 3 tasks",             actionType: "submit_task",    target: 3, xpReward: 40, difficulty: "medium" },
  { id: "chat_messages_5",  label: "Send 5 meaningful messages", actionType: "send_chat",      target: 5, xpReward: 30, difficulty: "medium" },
  { id: "respond_flares_2", label: "Help 2 flares",              actionType: "respond_flare",  target: 2, xpReward: 40, difficulty: "medium" },

  // Hard — aspirational
  { id: "submit_tasks_5",     label: "Submit 5 tasks",           actionType: "submit_task",     target: 5, xpReward: 75, difficulty: "hard" },
  { id: "clear_checkpoints_2", label: "Clear 2 checkpoints",     actionType: "clear_checkpoint", target: 2, xpReward: 60, difficulty: "hard" },
];

const DAILY_BONUS_XP = 75;
const EASY_TEMPLATES = TEMPLATES.filter((t) => t.difficulty === "easy");
const MEDIUM_TEMPLATES = TEMPLATES.filter((t) => t.difficulty === "medium");
const HARD_TEMPLATES = TEMPLATES.filter((t) => t.difficulty === "hard");

/**
 * Deterministic rotation — pick 1 easy + 1 medium + 1 hard using the
 * day's ordinal so all users see the same set on the same day.
 */
function pickTemplates(dateKey: string): ChallengeTemplate[] {
  const dayOrd = dateKeyToOrdinal(dateKey);
  return [
    EASY_TEMPLATES[dayOrd % EASY_TEMPLATES.length],
    MEDIUM_TEMPLATES[dayOrd % MEDIUM_TEMPLATES.length],
    HARD_TEMPLATES[dayOrd % HARD_TEMPLATES.length],
  ];
}

function dateKeyToOrdinal(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  if (!y || !m || !d) return 0;
  // Days since epoch, rough — good enough for rotation.
  return Math.floor((Date.UTC(y, m - 1, d) / (24 * 60 * 60 * 1000)));
}

function localDateString(ms: number, tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date(ms));
    const y = parts.find((p) => p.type === "year")?.value ?? "";
    const m = parts.find((p) => p.type === "month")?.value ?? "";
    const d = parts.find((p) => p.type === "day")?.value ?? "";
    return `${y}-${m}-${d}`;
  } catch {
    return new Date(ms).toISOString().slice(0, 10);
  }
}

// ─────────────────────────────────────────────────────────────
// Auth helper
// ─────────────────────────────────────────────────────────────

async function maybeUser(ctx: QueryCtx): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .first();
}

async function getUserTimezone(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
): Promise<string> {
  const streakRow = await ctx.db
    .query("userStreaks")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();
  return streakRow?.timezone ?? "UTC";
}

// ─────────────────────────────────────────────────────────────
// Queries + mutations
// ─────────────────────────────────────────────────────────────

/**
 * Fetch today's daily challenges for the authed user.  If no row
 * exists for today (yet), returns a "not-yet-created" shape — the
 * `ensureTodayChallenges` mutation will lazily create it on the
 * first qualifying action or explicit call.
 */
export const getMyDailyChallenges = query({
  args: {},
  handler: async (ctx) => {
    const user = await maybeUser(ctx);
    if (!user) return null;

    const tz = await getUserTimezone(ctx, user._id);
    const today = localDateString(Date.now(), tz);

    const existing = await ctx.db
      .query("dailyChallenges")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", user._id).eq("dateKey", today),
      )
      .first();

    if (existing) {
      return {
        dateKey: today,
        challenges: existing.challenges,
        claimedAt: existing.claimedAt ?? null,
        allComplete: existing.challenges.every((c) => c.progress >= c.target),
        dailyBonusXp: DAILY_BONUS_XP,
      };
    }

    // Preview today's challenges (not yet persisted).  Client renders
    // them at 0 progress; first qualifying action creates the row.
    const templates = pickTemplates(today);
    return {
      dateKey: today,
      challenges: templates.map((t) => ({
        id: t.id,
        label: t.label,
        actionType: t.actionType,
        target: t.target,
        progress: 0,
        xpReward: t.xpReward,
      })),
      claimedAt: null,
      allComplete: false,
      dailyBonusXp: DAILY_BONUS_XP,
    };
  },
});

/**
 * Explicitly create today's challenge row for the authed user, if not
 * already present.  Idempotent — safe to call from client on load.
 */
export const ensureTodayChallenges = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await maybeUser(ctx);
    if (!user) return null;

    const tz = await getUserTimezone(ctx, user._id);
    const today = localDateString(Date.now(), tz);

    const existing = await ctx.db
      .query("dailyChallenges")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", user._id).eq("dateKey", today),
      )
      .first();
    if (existing) return { created: false };

    const templates = pickTemplates(today);
    await ctx.db.insert("dailyChallenges", {
      userId: user._id,
      dateKey: today,
      challenges: templates.map((t) => ({
        id: t.id,
        label: t.label,
        actionType: t.actionType,
        target: t.target,
        progress: 0,
        xpReward: t.xpReward,
      })),
      updatedAt: Date.now(),
    });

    return { created: true };
  },
});

/**
 * Internal: increment progress on any live challenge matching the
 * given actionType.  Called from qualifying action mutations
 * (submitTaskContent, fireFlare, respondToFlare, sendMessage,
 * advanceCheckpoint).  Auto-awards per-challenge XP when target hit.
 */
export const bumpProgress = internalMutation({
  args: {
    userId: v.id("users"),
    actionType: v.string(),
    amount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tz = await getUserTimezone(ctx, args.userId);
    const today = localDateString(Date.now(), tz);

    let row = await ctx.db
      .query("dailyChallenges")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", args.userId).eq("dateKey", today),
      )
      .first();

    // Lazy-create if the user's first qualifying action of the day
    // happens before ensureTodayChallenges was called.
    if (!row) {
      const templates = pickTemplates(today);
      const rowId = await ctx.db.insert("dailyChallenges", {
        userId: args.userId,
        dateKey: today,
        challenges: templates.map((t) => ({
          id: t.id,
          label: t.label,
          actionType: t.actionType,
          target: t.target,
          progress: 0,
          xpReward: t.xpReward,
        })),
        updatedAt: Date.now(),
      });
      row = await ctx.db.get(rowId);
      if (!row) return;
    }

    const delta = args.amount ?? 1;
    let anyBumped = false;
    const nextChallenges = row.challenges.map((c) => {
      if (c.actionType !== args.actionType) return c;
      if (c.progress >= c.target) return c; // already complete, cap
      const nextProgress = Math.min(c.target, c.progress + delta);
      anyBumped = true;
      // Auto-award XP when this challenge crosses the target for the
      // first time (before this bump progress was < target, now == target)
      if (nextProgress >= c.target) {
        ctx.scheduler.runAfter(
          0,
          internal.gamification.internalAwardXP,
          {
            userId: args.userId,
            amount: c.xpReward,
            action: `daily_challenge:${c.id}`,
          },
        );
      }
      return { ...c, progress: nextProgress };
    });

    if (!anyBumped) return;

    await ctx.db.patch(row._id, {
      challenges: nextChallenges,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Claim the "all three complete" bonus.  Grants an extra
 * DAILY_BONUS_XP on top of the per-challenge rewards.  Idempotent —
 * second call returns { alreadyClaimed: true }.
 */
export const claimDailyBonus = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await maybeUser(ctx);
    if (!user) throw new Error("Unauthenticated");

    const tz = await getUserTimezone(ctx, user._id);
    const today = localDateString(Date.now(), tz);

    const row = await ctx.db
      .query("dailyChallenges")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", user._id).eq("dateKey", today),
      )
      .first();
    if (!row) throw new Error("No challenges for today");

    if (row.claimedAt) {
      return { alreadyClaimed: true, bonus: 0 };
    }

    const allComplete = row.challenges.every((c) => c.progress >= c.target);
    if (!allComplete) {
      throw new Error(
        "Complete all three challenges before claiming the daily bonus.",
      );
    }

    const now = Date.now();
    await ctx.db.patch(row._id, {
      claimedAt: now,
      updatedAt: now,
    });

    // Bonus XP grant + notification
    try {
      await ctx.scheduler.runAfter(
        0,
        internal.gamification.internalAwardXP,
        {
          userId: user._id,
          amount: DAILY_BONUS_XP,
          action: "daily_challenge_bonus",
        },
      );
    } catch { /* non-blocking */ }

    await ctx.db.insert("notifications", {
      recipientId: user._id,
      senderId: user._id,
      type: "daily_bonus" as any,
      message: `🎯 Daily challenges cleared · +${DAILY_BONUS_XP} XP bonus`,
      isRead: false,
      createdAt: now,
    });

    return { alreadyClaimed: false, bonus: DAILY_BONUS_XP };
  },
});
