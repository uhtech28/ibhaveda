// Feed walkthrough state — see PRD §6.

import { v } from "convex/values";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";

// One-time reward for finishing the Sparky tutorial. Kept modest so it
// can't be farmed by restart abuse (each user can only claim once).
const TUTORIAL_COMPLETION_XP = 100;

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

    // First-time completion rewards. Guarded by the previous state so
    // restart + complete cycles don't double-award. Fixes gamification
    // audit gap #4 (tutorial completion grants nothing).
    const alreadyCompleted = user.feedTutorialState === "completed";
    const now = Date.now();

    await ctx.db.patch(user._id, {
      feedTutorialState: "completed",
      updatedAt: now,
    });

    if (!alreadyCompleted) {
      // Schedule an XP grant via the existing internal mutation so the
      // level ladder + weekly league also register the bonus.
      try {
        await ctx.scheduler.runAfter(
          0,
          internal.gamification.internalAwardXP,
          {
            userId: user._id,
            amount: TUTORIAL_COMPLETION_XP,
            action: "tutorial_complete",
          },
        );
      } catch (err) {
        console.warn("[tutorial] XP grant failed:", err);
      }

      // Try to award a "Founder Awakens" badge if present. If the slug
      // doesn't resolve, awardBadge is a no-op — so this is safe.
      try {
        await ctx.scheduler.runAfter(
          0,
          internal.badges.awardBadge,
          {
            userId: user._id,
            slug: "founder-awakens",
          },
        );
      } catch (err) {
        console.warn("[tutorial] badge grant failed:", err);
      }

      // Notification so the user has a record + the bell icon animates.
      await ctx.db.insert("notifications", {
        recipientId: user._id,
        senderId: user._id,
        type: "tutorial_complete" as any,
        message: `🎉 Founder Awakens · Tutorial complete · +${TUTORIAL_COMPLETION_XP} XP`,
        isRead: false,
        createdAt: now,
      });
    }

    return { state: "completed", rewarded: !alreadyCompleted };
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
