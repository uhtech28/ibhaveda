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

    // ── Anti-regression guards ──────────────────────────────────────────
    // The tutorial state machine is MONOTONIC-FORWARD only. Any call
    // that would regress a user (send them back to an earlier step or
    // resurrect a terminal state) is silently ignored — the only
    // legitimate way to reset tutorial state is `restartFeedTutorial`.
    //
    // Why this lives on the server: a stale client (e.g. a Step3 effect
    // that fires goTo(7) during the Convex-still-loading window before
    // remoteLoaded flips true) would otherwise write "in_progress + step
    // 7" over a completed user's record and restart the tour on refresh.
    // The provider now guards on `remoteLoaded`, but a bad build or a
    // third-party integration hitting the mutation directly must not be
    // able to reopen the tour either.
    const currentState = user.feedTutorialState ?? "not_started";
    const currentStep = user.feedTutorialStep ?? 0;
    const next = Math.max(0, Math.floor(step));

    // (1) Terminal states are sticky. A completed user stays completed.
    // A skipped user stays skipped. Only `restartFeedTutorial` clears
    // these — advance MUST NOT.
    if (currentState === "completed" || currentState === "skipped") {
      return { state: currentState, step: currentStep };
    }

    // (2) Monotonic forward. A lower step arriving from a stale client
    // (or from a race between two step components) is a no-op. Equal
    // is also a no-op — no need for a DB write.
    if (next <= currentStep) {
      return { state: currentState, step: currentStep };
    }

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
      // Persist the terminal step (11) so nothing can re-open the
      // tutorial at step 10 (flare) by regressing the step field alone.
      feedTutorialStep: 11,
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
