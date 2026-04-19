import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { LEVEL_DEFINITIONS } from "./ventureConstants";
import type { MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Initialize user level tracking record.
 * Called when a user completes onboarding or on first point award.
 */
export const initializeUserLevel = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userLevels")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) return existing._id;

    const now = Date.now();
    return await ctx.db.insert("userLevels", {
      userId: args.userId,
      currentLevel: 1,
      titlePoints: 0,
      totalPoints: 0,
      goldCheckpoints: 0,
      fullLifecycles: 0,
      helpfulFlareResponses: 0,
      flaresResolved: 0,
      menteesCount: 0,
      menteeCheckpointAdvances: 0,
      menteeLevelAchievements: 0,
      ideasLaunched: 0,
      ideasScaled: 0,
      collaboratorsRecruited: 0,
      collaboratorsJoined: 0,
      commentsCount: 0,
      upvotedCommentsCount: 0,
      ideasCreated: 0,
      ideasWithStage6: 0,
      ideasWithStage8: 0,
      activeIdeaTypes: [],
      updatedAt: now,
    });
  },
});

/**
 * Award points and check for level up.
 */
export const awardPoints = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    type: v.string(),
    relatedId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.amount <= 0) return;

    const now = Date.now();

    // Find or create wallet
    let wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!wallet) {
      const walletId = await ctx.db.insert("wallets", {
        userId: args.userId,
        balance: 0,
        updatedAt: now,
      });
      wallet = await ctx.db.get(walletId);
    }

    if (!wallet) return;

    // Create transaction
    await ctx.db.insert("transactions", {
      walletId: wallet._id,
      amount: args.amount,
      type: args.type,
      description: args.type.replace(/_/g, " "),
      relatedId: args.relatedId,
      createdAt: now,
    });

    // Update wallet
    await ctx.db.patch(wallet._id, {
      balance: wallet.balance + args.amount,
      updatedAt: now,
    });

    // Update user level tracking
    const userLevel = await ctx.db
      .query("userLevels")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (userLevel) {
      await ctx.db.patch(userLevel._id, {
        totalPoints: userLevel.totalPoints + args.amount,
        titlePoints: userLevel.titlePoints + args.amount,
        updatedAt: now,
      });

      // Check for level up
      await checkLevelUp(ctx, userLevel._id);
    }
  },
});

/**
 * Check if user qualifies for next level and advance if so.
 */
async function checkLevelUp(
  ctx: { db: MutationCtx["db"] },
  userLevelId: Id<"userLevels">,
) {
  const userLevel = await ctx.db.get(userLevelId);
  if (!userLevel) return;

  const currentLevel = userLevel.currentLevel;
  if (currentLevel >= 50) return;

  const nextLevelDef = LEVEL_DEFINITIONS.find(
    (l) => l.level === currentLevel + 1,
  );
  if (!nextLevelDef) return;

  // Check if user meets the titlePoints threshold
  if (userLevel.titlePoints >= nextLevelDef.titlePoints) {
    // Level up
    await ctx.db.patch(userLevelId as Id<"userLevels">, {
      currentLevel: currentLevel + 1,
      updatedAt: Date.now(),
    });

    // Award level-up points
    const levelUpPoints = (currentLevel + 1) * 5;
    let wl = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", userLevel.userId))
      .first();
    if (!wl) {
      const wId = await ctx.db.insert("wallets", {
        userId: userLevel.userId,
        balance: 0,
        updatedAt: Date.now(),
      });
      wl = await ctx.db.get(wId);
    }
    if (wl) {
      await ctx.db.insert("transactions", {
        walletId: wl._id,
        amount: levelUpPoints,
        type: "level_up",
        description: `Reached level ${currentLevel + 1}: ${nextLevelDef.title}`,
        createdAt: Date.now(),
      });
    }
  }
}

/**
 * Get user's level progress.
 */
export const getUserLevelProgress = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const userLevel = await ctx.db
      .query("userLevels")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!userLevel) return null;

    const currentDef = LEVEL_DEFINITIONS.find(
      (l) => l.level === userLevel.currentLevel,
    );
    const nextDef = LEVEL_DEFINITIONS.find(
      (l) => l.level === userLevel.currentLevel + 1,
    );

    return {
      level: userLevel.currentLevel,
      title: currentDef?.title ?? "Unknown",
      phase: currentDef?.phase ?? "tutorial",
      titlePoints: userLevel.titlePoints,
      totalPoints: userLevel.totalPoints,
      nextLevel: nextDef?.level ?? null,
      nextLevelTitle: nextDef?.title ?? null,
      nextLevelPoints: nextDef?.titlePoints ?? null,
      progress: nextDef
        ? Math.min(
            100,
            Math.round((userLevel.titlePoints / nextDef.titlePoints) * 100),
          )
        : 100,
      requirements: currentDef?.requirements ?? [],
    };
  },
});

/**
 * Get all level definitions.
 */
export const getAllLevels = query({
  args: {},
  handler: async () => {
    return LEVEL_DEFINITIONS;
  },
});
