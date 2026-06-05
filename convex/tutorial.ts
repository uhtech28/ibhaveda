// Feed walkthrough state — see PRD §6.

import { v } from "convex/values";
import { mutation, query, type QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

export const getMyFeedTutorialState = query({
  args: {},
  handler: async (ctx) => {
    const user = await maybeUser(ctx);
    if (!user) return null;
    return {
      state: (user.feedTutorialState ?? "not_started") as
        | "not_started"
        | "in_progress"
        | "completed"
        | "skipped",
      step: user.feedTutorialStep ?? 0,
    };
  },
});

export const advanceFeedTutorial = mutation({
  args: { step: v.number() },
  handler: async (ctx, { step }) => {
    const user = await maybeUser(ctx);
    if (!user) return null;
    const next = Math.max(0, Math.floor(step));
    await ctx.db.patch(user._id, {
      feedTutorialState: "in_progress",
      feedTutorialStep: next,
      updatedAt: Date.now(),
    });
    return { state: "in_progress", step: next };
  },
});

export const completeFeedTutorial = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await maybeUser(ctx);
    if (!user) return null;
    await ctx.db.patch(user._id, {
      feedTutorialState: "completed",
      updatedAt: Date.now(),
    });
    return { state: "completed" };
  },
});

export const skipFeedTutorial = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await maybeUser(ctx);
    if (!user) return null;
    await ctx.db.patch(user._id, {
      feedTutorialState: "skipped",
      updatedAt: Date.now(),
    });
    return { state: "skipped" };
  },
});

export const restartFeedTutorial = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await maybeUser(ctx);
    if (!user) return null;
    await ctx.db.patch(user._id, {
      feedTutorialState: "in_progress",
      feedTutorialStep: 0,
      updatedAt: Date.now(),
    });
    return { state: "in_progress", step: 0 };
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
