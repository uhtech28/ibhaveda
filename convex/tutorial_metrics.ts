// Counts the FeedTutorial uses to detect when a user has performed
// the real action behind an action-gated step (PRD §6 AC2).

import { query, type QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

export const getMySparkCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await maybeUser(ctx);
    if (!user) return 0;
    const rows = await ctx.db
      .query("userIdeaSparks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    return rows.length;
  },
});

export const getMyCommentCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await maybeUser(ctx);
    if (!user) return 0;
    const rows = await ctx.db
      .query("comments")
      .withIndex("by_author", (q) => q.eq("authorId", user._id))
      .collect();
    return rows.length;
  },
});

// Counts the new product-tour uses to detect when a user has hit each
// real-platform milestone (post an idea, complete a task, finish combat).
export const getMyIdeaCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await maybeUser(ctx);
    if (!user) return 0;
    const rows = await ctx.db
      .query("ideas")
      .withIndex("by_author", (q) => q.eq("authorId", user._id))
      .collect();
    return rows.filter((r) => !r.isDeleted).length;
  },
});

export const getMyCompletedTaskCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await maybeUser(ctx);
    if (!user) return 0;
    const ventures = await ctx.db
      .query("ventures")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    if (ventures.length === 0) return 0;
    const ventureIds = new Set(ventures.map((v) => v._id));
    let count = 0;
    for (const ventureId of ventureIds) {
      const checkpoints = await ctx.db
        .query("ventureCheckpoints")
        .withIndex("by_venture", (q) => q.eq("ventureId", ventureId))
        .collect();
      for (const cp of checkpoints) {
        const tasks = await ctx.db
          .query("ventureTasks")
          .withIndex("by_checkpoint", (q) => q.eq("checkpointId", cp._id))
          .collect();
        count += tasks.filter((t) => t.status === "completed").length;
      }
    }
    return count;
  },
});

export const getMyCombatCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await maybeUser(ctx);
    if (!user) return 0;
    // Count any *finished* round (won OR lost OR abandoned) so the
    // tour advances regardless of combat outcome — what matters for
    // the tutorial is that the user saw the combat flow once.
    const rounds = await ctx.db
      .query("combatRounds")
      .withIndex("by_user_status", (q) => q.eq("userId", user._id))
      .collect();
    return rounds.filter((r) => r.status !== "active").length;
  },
});

async function maybeUser(ctx: QueryCtx): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .first();
}
