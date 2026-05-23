import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { LEVEL_DEFINITIONS } from "./ventureConstants";
import type { MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { recalculateAndAwardBadgesHelper } from "./badges";

function deriveLevelFromTitlePoints(titlePoints: number) {
  return LEVEL_DEFINITIONS.reduce((currentLevel, def) => {
    return titlePoints >= def.titlePoints ? def.level : currentLevel;
  }, 1);
}

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

      // Recalculate and award badges in real-time
      await recalculateAndAwardBadgesHelper(ctx, args.userId);
    }
  },
});

/**
 * Validate that the user meets the task-gate requirements for advancing to a
 * given target level. Levels 1–6 are task-gated per the PDF; level 7+ is purely
 * points-based, so this returns true once titlePoints clears the threshold.
 *
 * Uses fields tracked on userLevels: ideasCreated, commentsCount,
 * collaboratorsRecruited, collaboratorsJoined, goldCheckpoints, etc.
 */
export function meetsLevelRequirements(targetLevel: number, userLevel: any): boolean {
  const ideas = userLevel.ideasCreated || 0
  const comments = userLevel.commentsCount || 0
  const collaborators = (userLevel.collaboratorsRecruited || 0) + (userLevel.collaboratorsJoined || 0)
  const gold = userLevel.goldCheckpoints || 0
  const points = userLevel.titlePoints || 0

  switch (targetLevel) {
    case 2: // Explorer — must have engaged: 1 comment OR 1 idea
      return comments >= 1 || ideas >= 1
    case 3: // Thinker — must have created their first idea
      return ideas >= 1
    case 4: // Connector — 50 pts + 1 idea + (1 comment OR 1 collaborator)
      return points >= 50 && ideas >= 1 && (comments >= 1 || collaborators >= 1)
    case 5: // Contributor — 150 pts + at least 2 comments
      return points >= 150 && comments >= 2
    case 6: // Initiator — 300 pts + 1 collaborator
      return points >= 300 && collaborators >= 1
    default:
      // Levels 7–50 are purely points-based; titlePoints check happens in caller
      return true
  }
}

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
  const targetLevel = Math.min(
    50,
    deriveLevelFromTitlePoints(userLevel.titlePoints),
  );
  if (targetLevel <= currentLevel) return;

  await ctx.db.patch(userLevelId as Id<"userLevels">, {
    currentLevel: targetLevel,
    updatedAt: Date.now(),
  });

  for (let level = currentLevel + 1; level <= targetLevel; level++) {
    const levelDef = LEVEL_DEFINITIONS.find((l) => l.level === level);
    if (!levelDef) continue;

    // Levels 1–6 have task-gated requirements (PDF spec). 7+ is points only.
    if (level <= 6 && !meetsLevelRequirements(level, userLevel)) {
      // User hasn't finished the tasks required for this level yet,
      // so we stop the jump here.
      break;
    }

    // Award points and update level record
    await ctx.db.patch(userLevelId, {
      currentLevel: level,
      updatedAt: Date.now(),
    });

    const levelUpPoints = level * 5;
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
        description: `Reached level ${level}: ${levelDef.title}`,
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

    // Always return real, fully-resolved level info — even before the user has
    // earned a point — so the UI can render "Level 1 — Newcomer" out of the box.
    const currentLevel = userLevel?.currentLevel ?? 1;
    const titlePoints = userLevel?.titlePoints ?? 0;
    const totalPoints = userLevel?.totalPoints ?? 0;

    const currentDef = LEVEL_DEFINITIONS.find((l) => l.level === currentLevel);
    const nextDef = LEVEL_DEFINITIONS.find((l) => l.level === currentLevel + 1);

    return {
      level: currentLevel,
      title: currentDef?.title ?? "Newcomer",
      phase: currentDef?.phase ?? "tutorial",
      titlePoints,
      totalPoints,
      nextLevel: nextDef?.level ?? null,
      nextLevelTitle: nextDef?.title ?? null,
      nextLevelPoints: nextDef?.titlePoints ?? null,
      progress: nextDef && nextDef.titlePoints > 0
        ? Math.min(100, Math.round((titlePoints / nextDef.titlePoints) * 100))
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
