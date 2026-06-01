import { v } from "convex/values";
import { internalMutation, internalQuery, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// ── Internal queries ───────────────────────────────────────────────────────────

export const getIdeaForProof = internalQuery({
  args: { ideaId: v.id("ideas") },
  handler: async (ctx, { ideaId }) => ctx.db.get(ideaId),
});

export const getAuthorForProof = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => ctx.db.get(userId),
});

export const getTotalUserCount = internalQuery({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.length;
  },
});

export const getActiveSchedules = internalQuery({
  args: {},
  handler: async (ctx) => {
    return ctx.db
      .query("socialProofSchedules")
      .withIndex("by_complete", (q) => q.eq("isComplete", false))
      .collect();
  },
});

// ── Internal mutations ─────────────────────────────────────────────────────────

export const createSchedule = internalMutation({
  args: {
    ideaId: v.id("ideas"),
    authorId: v.id("users"),
    capCount: v.number(),
    capPercent: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("socialProofSchedules", {
      ideaId: args.ideaId,
      authorId: args.authorId,
      createdAt: Date.now(),
      capCount: args.capCount,
      capPercent: args.capPercent,
      sparksDelivered: 0,
      isComplete: false,
    });
  },
});

export const markScheduleComplete = internalMutation({
  args: { scheduleId: v.id("socialProofSchedules") },
  handler: async (ctx, { scheduleId }) => {
    await ctx.db.patch(scheduleId, { isComplete: true });
  },
});

/**
 * Tries to fire one seeded spark for an idea.
 * Returns true if a spark was fired, false if capped or no eligible likers.
 * This is the only place that touches userIdeaSparks for seeded sparks —
 * goes through the same table/notification path as real user sparks.
 */
export const tryFireOneSpark = internalMutation({
  args: { ideaId: v.id("ideas") },
  handler: async (ctx, { ideaId }) => {
    // Load schedule — abort if missing or complete
    const schedule = await ctx.db
      .query("socialProofSchedules")
      .withIndex("by_idea", (q) => q.eq("ideaId", ideaId))
      .first();
    if (!schedule || schedule.isComplete) return false;

    // Cap check
    if (schedule.sparksDelivered >= schedule.capCount) {
      await ctx.db.patch(schedule._id, { isComplete: true });
      return false;
    }

    // Idea must still be public and not deleted
    const idea = await ctx.db.get(ideaId);
    if (!idea || idea.isDeleted || idea.visibility !== "public") {
      await ctx.db.patch(schedule._id, { isComplete: true });
      return false;
    }

    // Build exclusion set: author + anyone who already sparked
    const existingSparks = await ctx.db
      .query("userIdeaSparks")
      .withIndex("by_idea", (q) => q.eq("ideaId", ideaId))
      .collect();
    const excluded = new Set<string>([
      String(schedule.authorId),
      ...existingSparks.map((s) => String(s.userId)),
    ]);

    // Eligible likers = all users (agents + real) not in exclusion set
    const allUsers = await ctx.db.query("users").collect();
    const eligible = allUsers.filter((u) => !excluded.has(String(u._id)));

    if (eligible.length === 0) {
      await ctx.db.patch(schedule._id, { isComplete: true });
      return false;
    }

    // Pick a random liker
    const liker = eligible[Math.floor(Math.random() * eligible.length)];
    const now = Date.now();

    // Insert spark — same table as organic sparks, flagged seeded for analytics
    await ctx.db.insert("userIdeaSparks", {
      userId: liker._id,
      ideaId,
      createdAt: now,
      seeded: true,
    });

    // Increment sparkCount on the idea (same as toggleSpark)
    await ctx.db.patch(ideaId, {
      sparkCount: idea.sparkCount + 1,
      updatedAt: now,
    });

    // Fire notification to the author — identical to the organic spark notification
    await ctx.db.insert("notifications", {
      recipientId: schedule.authorId,
      senderId: liker._id,
      type: "spark_received",
      message: `${liker.displayName} sparked your idea "${idea.title}"`,
      relatedId: ideaId,
      isRead: false,
      createdAt: now,
    });

    // Update delivered count
    const newDelivered = schedule.sparksDelivered + 1;
    await ctx.db.patch(schedule._id, {
      sparksDelivered: newDelivered,
      isComplete: newDelivered >= schedule.capCount,
    });

    return true;
  },
});

// ── Internal actions ───────────────────────────────────────────────────────────

/**
 * Called immediately after a new public non-agent idea is created.
 * - Calculates a random cap (75–95 % of total users)
 * - Stores the schedule
 * - Schedules the initial burst (3–6 sparks) within the first 5 minutes
 */
export const scheduleForNewIdea = internalAction({
  args: { ideaId: v.id("ideas") },
  handler: async (ctx, { ideaId }) => {
    const api = internal as any;

    const idea = await ctx.runQuery(api.socialProof.getIdeaForProof, { ideaId });
    if (!idea) return;

    // Only public root ideas by non-agents
    if (
      idea.visibility !== "public" ||
      idea.isDeleted ||
      idea.parentId
    ) return;

    const author = await ctx.runQuery(api.socialProof.getAuthorForProof, { userId: idea.authorId });
    if (!author || author.role === "agent") return;

    const totalUsers = await ctx.runQuery(api.socialProof.getTotalUserCount, {});
    if (totalUsers < 2) return;

    const capPercent = 75 + Math.floor(Math.random() * 21); // 75–95 inclusive
    const capCount = Math.max(1, Math.floor((totalUsers * capPercent) / 100));

    await ctx.runMutation(api.socialProof.createSchedule, {
      ideaId,
      authorId: idea.authorId,
      capCount,
      capPercent,
    });

    // Initial burst: 3–6 sparks, each at a random moment within 5 minutes
    const burstCount = 3 + Math.floor(Math.random() * 4); // 3–6
    for (let i = 0; i < burstCount; i++) {
      const delayMs = Math.floor(Math.random() * 5 * 60_000); // 0–5 min
      await ctx.scheduler.runAfter(delayMs, api.socialProof.tryFireOneSpark, { ideaId });
    }

    console.log(
      `🌱 Social proof scheduled for idea ${ideaId}: cap=${capCount} (${capPercent}%), burst=${burstCount}`
    );
  },
});

/**
 * Daily evaluator (run by cron at midnight UTC).
 * For each incomplete schedule, decides how many sparks to fire today
 * based on how old the post is, then spreads them randomly across the day.
 */
export const runDailyEvaluator = internalAction({
  args: {},
  handler: async (ctx) => {
    const api = internal as any;
    const now = Date.now();

    const schedules = await ctx.runQuery(api.socialProof.getActiveSchedules, {});
    console.log(`🌱 Social proof evaluator: ${schedules.length} active schedule(s)`);

    for (const schedule of schedules) {
      const remaining = schedule.capCount - schedule.sparksDelivered;
      if (remaining <= 0) {
        await ctx.runMutation(api.socialProof.markScheduleComplete, {
          scheduleId: schedule._id,
        });
        continue;
      }

      const daysOld = Math.floor(
        (now - schedule.createdAt) / (24 * 60 * 60 * 1000)
      );

      const todayCount = decideDailyCount(daysOld, remaining);
      if (todayCount === 0) continue;

      // Spread sparks across a random window during the day (0–20 h from now)
      for (let i = 0; i < todayCount; i++) {
        const delayMs = Math.floor(Math.random() * 20 * 60 * 60_000);
        await ctx.scheduler.runAfter(delayMs, api.socialProof.tryFireOneSpark, {
          ideaId: schedule.ideaId,
        });
      }

      console.log(
        `🌱 Scheduled ${todayCount} spark(s) for idea ${schedule.ideaId} (day ${daysOld}, ${remaining} remaining)`
      );
    }
  },
});

// ── Distribution helper ────────────────────────────────────────────────────────

/**
 * Decides how many sparks to fire on a given day for a post.
 * Front-weighted: higher volume and probability early, tapering off over time.
 * Random "spike" days (5 % chance) can occur at any age.
 */
function decideDailyCount(daysOld: number, remaining: number): number {
  let maxToday: number;
  let fireProbability: number;

  if      (daysOld === 1)   { maxToday = 12; fireProbability = 0.90; }
  else if (daysOld === 2)   { maxToday = 8;  fireProbability = 0.70; }
  else if (daysOld === 3)   { maxToday = 6;  fireProbability = 0.50; }
  else if (daysOld <= 7)    { maxToday = 4;  fireProbability = 0.35; }
  else if (daysOld <= 14)   { maxToday = 3;  fireProbability = 0.20; }
  else                      { maxToday = 2;  fireProbability = 0.10; }

  // 5 % spike chance — override probability and boost max
  if (Math.random() < 0.05) {
    maxToday += Math.floor(Math.random() * 6) + 3;
    fireProbability = 1;
  }

  if (Math.random() > fireProbability) return 0;

  const cap = Math.min(remaining, maxToday);
  if (cap <= 0) return 0;

  // sqrt bias: e.g. for cap=10, values cluster toward higher end (7–10 more likely than 1–3)
  return Math.max(1, Math.ceil(Math.sqrt(Math.random()) * cap));
}
