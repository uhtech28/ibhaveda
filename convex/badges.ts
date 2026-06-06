import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import {
  BADGE_DEFINITIONS,
  getVentureBadgeEmoji,
  LEVEL_DEFINITIONS,
} from "./ventureConstants";
import {
  LEGACY_STAGE_BADGE_EQUIVALENTS,
  LEGACY_STAGE_BADGE_IDS,
  STAGE_BADGE_DEFINITIONS,
  type StageBadgeTemplate,
} from "./stageBadgeDefinitions";
import { getCheckpointDefinitions, type TemplateId } from "./templateEngine";

const DISABLED_BADGE_IDS = new Set([43, 44, 45, 46, 62, ...LEGACY_STAGE_BADGE_IDS]);

function canonicalBadgeId(badgeId: number) {
  return LEGACY_STAGE_BADGE_EQUIVALENTS.get(badgeId) ?? badgeId;
}

function isDisplayableBadgeId(badgeId: number) {
  return !DISABLED_BADGE_IDS.has(badgeId) || LEGACY_STAGE_BADGE_EQUIVALENTS.has(badgeId);
}

function normalizeVentureTemplate(value: unknown): StageBadgeTemplate {
  if (value === "academic" || value === "lab" || value === "creative") return value;
  if (value === "experimental") return "lab";
  return "venture";
}

function findStageBadge(
  template: StageBadgeTemplate,
  stage: number,
  badgeType: "A" | "B" | "C",
) {
  return STAGE_BADGE_DEFINITIONS.find(
    (badge) =>
      badge.template === template &&
      badge.stage === stage &&
      badge.badgeType === badgeType,
  );
}

const INITIAL_BADGES = [
  {
    slug: "first-idea",
    name: "First Spark",
    description: "Created your first idea",
    icon: "Lightbulb",
    category: "creation",
    criteria: { type: "idea_count", threshold: 1 },
  },
  {
    slug: "idea-machine",
    name: "Idea Machine",
    description: "Created 5 ideas",
    icon: "Zap",
    category: "creation",
    criteria: { type: "idea_count", threshold: 5 },
  },
  {
    slug: "trendsetter",
    name: "Trendsetter",
    description: "Received 10 sparks on a single idea",
    icon: "Flame",
    category: "social",
    criteria: { type: "spark_count_single", threshold: 10 },
  },
  {
    slug: "collaborator",
    name: "Collaborator",
    description: "Accepted a contribution request",
    icon: "Users",
    category: "collaboration",
    criteria: { type: "contribution_accepted", threshold: 1 },
  },
  {
    slug: "chatterbox",
    name: "Chatterbox",
    description: "Left 5 comments on ideas",
    icon: "MessageSquare",
    category: "social",
    criteria: { type: "comment_count", threshold: 5 },
  },
  {
    slug: "legendary-venture-completion",
    name: "Legendary Completion",
    description: "Completed a venture with every stage ending in gold",
    icon: "Crown",
    category: "aspirational",
    criteria: { type: "manual_award", threshold: 1 },
  },
];

// Seed initial badges (idempotent)
export const seedBadges = mutation({
  args: {},
  handler: async (ctx) => {
    for (const badge of INITIAL_BADGES) {
      const existing = await ctx.db
        .query("badges")
        .withIndex("by_slug", (q) => q.eq("slug", badge.slug))
        .first();

      if (!existing) {
        await ctx.db.insert("badges", badge);
      } else {
        // Optional: Update definition if needed
        // await ctx.db.patch(existing._id, badge);
      }
    }
  },
});

export const getBadges = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("badges").collect();
  },
});

export const getUserBadges = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const userBadges = await ctx.db
      .query("userBadges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Fetch details for each badge
    const badgeDetails = await Promise.all(
      userBadges.map(async (ub) => {
        const badge = await ctx.db.get(ub.badgeId);
        return badge ? { ...badge, awardedAt: ub.awardedAt } : null;
      }),
    );

    return badgeDetails.filter((b) => b !== null);
  },
});

/**
 * Get all badges for the currently authenticated user, sorted by award time
 * descending. Used by the map page to detect newly awarded badges and trigger
 * the BadgeAwardSequence overlay via a client-side subscription.
 *
 * Returns an empty array when unauthenticated.
 */
export const getMyBadges = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return [];

    const userBadges = await ctx.db
      .query("userBadges")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Sort newest first so the client can detect additions at index 0
    userBadges.sort((a, b) => b.awardedAt - a.awardedAt);

    const enriched = await Promise.all(
      userBadges.map(async (ub) => {
        const badge = await ctx.db.get(ub.badgeId);
        if (!badge) return null;
        return {
          _id: ub._id,
          badgeId: ub.badgeId,
          awardedAt: ub.awardedAt,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          // Map category ? rarity for the BadgeAwardSequence component
          rarity: categoryToRarity(badge.category),
        };
      }),
    );

    return enriched.filter((b): b is NonNullable<typeof b> => b !== null);
  },
});

/**
 * Map the internal badge category string to a rarity tier understood by
 * BadgeAwardSequence.
 */
function categoryToRarity(
  category: string,
): "common" | "uncommon" | "rare" | "epic" | "legendary" {
  switch (category.toLowerCase()) {
    case "legendary":
    case "aspirational":
      return "legendary";
    case "epic":
      return "epic";
    case "rare":
    case "milestones":
      return "rare";
    case "uncommon":
    case "community":
    case "consistency":
      return "uncommon";
    default:
      return "common";
  }
}

function normalizeTemplateCategory(category: unknown) {
  if (typeof category !== "string") return "";

  const normalized = category.trim().toLowerCase();
  if (normalized === "lab" || normalized === "experimental") {
    return "experimental";
  }
  if (
    normalized === "venture" ||
    normalized === "academic" ||
    normalized === "creative"
  ) {
    return normalized;
  }

  return normalized;
}

function checkpointTaskCount(checkpoint: {
  t1Completed?: boolean;
  t2Completed?: boolean;
  t3Completed?: boolean;
}) {
  return [
    checkpoint.t1Completed,
    checkpoint.t2Completed,
    checkpoint.t3Completed,
  ].filter(Boolean).length;
}

function isCheckpointComplete(checkpoint: {
  status?: string;
  t1Completed?: boolean;
  t2Completed?: boolean;
  t3Completed?: boolean;
}) {
  return checkpoint.status === "completed" || checkpointTaskCount(checkpoint) >= 2;
}

const REQUIRED_TEMPLATE_CATEGORIES = [
  "venture",
  "academic",
  "creative",
  "experimental",
] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensureGeneralBadgeDefinition(ctx: any, slug: string) {
  let badge = await ctx.db
    .query("badges")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex("by_slug", (q: any) => q.eq("slug", slug))
    .first();

  if (badge) return badge;

  const fallback = INITIAL_BADGES.find((entry) => entry.slug === slug);
  if (!fallback) return null;

  const badgeId = await ctx.db.insert("badges", fallback);
  badge = await ctx.db.get(badgeId);
  return badge;
}

// Internal: Award a badge if not already owned
export const awardBadge = internalMutation({
  args: {
    userId: v.id("users"),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const badge = await ensureGeneralBadgeDefinition(ctx, args.slug);
    if (!badge) return;

    const existing = await ctx.db
      .query("userBadges")
      .withIndex("by_user_badge", (q) =>
        q.eq("userId", args.userId).eq("badgeId", badge._id),
      )
      .first();

    if (!existing) {
      await ctx.db.insert("userBadges", {
        userId: args.userId,
        badgeId: badge._id,
        awardedAt: Date.now(),
      });
      // TODO: Here we could trigger a notification
    }
  },
});

// Internal: Check badge conditions based on triggers
export const checkBadges = internalMutation({
  args: {
    userId: v.id("users"),
    trigger: v.string(), // 'create_idea', 'spark', 'comment', 'accept_contribution'
  },
  handler: async (ctx, args) => {
    const { userId, trigger } = args;

    if (trigger === "create_idea") {
      const ideas = await ctx.db
        .query("ideas")
        .withIndex("by_author", (q) => q.eq("authorId", userId))
        .collect();

      const count = ideas.length;
      if (count >= 1) await checkAndAward(ctx, userId, "first-idea");
      if (count >= 5) await checkAndAward(ctx, userId, "idea-machine");
    }

    if (trigger === "comment") {
      const comments = await ctx.db
        .query("comments")
        .withIndex("by_author", (q) => q.eq("authorId", userId))
        .collect();

      if (comments.length >= 5) await checkAndAward(ctx, userId, "chatterbox");
    }

    if (trigger === "accept_contribution") {
      // Check if user has accepted at least one contribution as author
      // Fallback using existing index
      const contributions = await ctx.db
        .query("contributionRequests")
        .withIndex("by_author_created", (q) => q.eq("authorId", userId))
        .collect();

      const acceptedCount = contributions.filter(
        (c) => c.status === "accepted",
      ).length;

      if (acceptedCount >= 1) {
        await checkAndAward(ctx, userId, "collaborator");
      }
    }

    if (trigger === "spark") {
      // Check if any of the user's ideas have 10+ sparks
      // Optimally we'd check the specific idea, but broad check works for MVP
      const ideas = await ctx.db
        .query("ideas")
        .withIndex("by_author", (q) => q.eq("authorId", userId))
        .collect();

      const hasTrendsetter = ideas.some((idea) => idea.sparkCount >= 10);

      if (hasTrendsetter) {
        await checkAndAward(ctx, userId, "trendsetter");
      }
    }

    // Call the comprehensive recalculator helper to sync all badges
    await recalculateAndAwardBadgesHelper(ctx, userId);
  },
});

// Helper for awarding
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function checkAndAward(ctx: any, userId: Id<"users">, slug: string) {
  const badge = await ensureGeneralBadgeDefinition(ctx, slug);
  if (!badge) return;

  const existing = await ctx.db
    .query("userBadges")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex("by_user_badge", (q: any) =>
      q.eq("userId", userId).eq("badgeId", badge._id),
    )
    .first();

  if (!existing) {
    await ctx.db.insert("userBadges", {
      userId: userId,
      badgeId: badge._id,
      awardedAt: Date.now(),
    });

    // Trigger notification
    await ctx.db.insert("notifications", {
      recipientId: userId,
      senderId: userId, // System notification, self-sent or we could have a system user
      type: "badge_awarded",
      message: `You earned the "${badge.name}" badge!`,
      relatedId: badge._id,
      isRead: false,
      createdAt: Date.now(),
    });
  }
}

// -----------------------------------------------------------------------------
// VENTURE BADGES (62-badge system)
// -----------------------------------------------------------------------------

export const awardVentureBadge = mutation({
  args: {
    userId: v.id("users"),
    badgeId: v.number(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const badgeDef = BADGE_DEFINITIONS.find((b) => b.id === args.badgeId);
    if (!badgeDef) throw new Error(`Badge ${args.badgeId} not found`);

    const existing = await ctx.db
      .query("ventureBadges")
      .withIndex("by_user_badge", (q) =>
        q.eq("userId", args.userId).eq("badgeId", args.badgeId),
      )
      .first();

    if (existing) return existing._id;

    const now = Date.now();

    const badgeRecordId = await ctx.db.insert("ventureBadges", {
      userId: args.userId,
      badgeId: args.badgeId,
      awardedAt: now,
      isHidden: badgeDef.rarity === "hidden",
      metadata: args.metadata ?? {},
    });

    await ctx.db.insert("badgeEvaluations", {
      badgeId: args.badgeId,
      userId: args.userId,
      condition: badgeDef.requirement,
      lastChecked: now,
      isAwarded: true,
      awardedAt: now,
    });

    return badgeRecordId;
  },
});

export const getVentureBadges = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const badges = await ctx.db
      .query("ventureBadges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const seen = new Set<number>();

    return badges
      .filter((badge) => isDisplayableBadgeId(badge.badgeId))
      .map((badge) => {
      const badgeId = canonicalBadgeId(badge.badgeId);
      if (seen.has(badgeId)) return null;
      seen.add(badgeId);

      const def = BADGE_DEFINITIONS.find((b) => b.id === badgeId);
      if (!def) return { ...badge, definition: undefined };

      let shape = def.shape;
      if (def.category === "idea_milestones") {
        shape = "shield";
      }

      return {
        ...badge,
        badgeId,
        definition: {
          ...def,
          shape,
        }
      };
    })
    .filter((badge) => badge !== null);
  },
});

export const getAllVentureBadges = query({
  args: {},
  handler: async () => BADGE_DEFINITIONS.filter((def) => !DISABLED_BADGE_IDS.has(def.id)),
});

export const getVentureBadgeProgress = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const earnedBadges = await ctx.db
      .query("ventureBadges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const earnedIds = new Set(earnedBadges.map((b) => canonicalBadgeId(b.badgeId)));

    return BADGE_DEFINITIONS.filter((def) => !DISABLED_BADGE_IDS.has(def.id)).map((def) => {
      const earned = earnedIds.has(def.id);
      const record = earnedBadges.find((b) => canonicalBadgeId(b.badgeId) === def.id);

      let shape = def.shape;
      if (def.category === "idea_milestones") {
        shape = "shield";
      }

      return {
        ...def,
        shape,
        icon: getVentureBadgeEmoji(def.id, def.name),
        earned,
        awardedAt: record?.awardedAt,
      };
    });
  },
});

// Helper to award points/XP when a badge is unlocked and handle level up
async function awardBadgePoints(ctx: any, userId: Id<"users">, amount: number, badgeName: string) {
  const now = Date.now();

  // Find or create wallet
  let wallet = await ctx.db
    .query("wallets")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .first();

  if (!wallet) {
    const walletId = await ctx.db.insert("wallets", {
      userId,
      balance: 0,
      updatedAt: now,
    });
    wallet = await ctx.db.get(walletId);
  }

  if (!wallet) return;

  // Create transaction
  await ctx.db.insert("transactions", {
    walletId: wallet._id,
    amount,
    type: "badge_unlock_bonus",
    description: `Badge Unlock: ${badgeName}`,
    createdAt: now,
  });

  // Update wallet balance
  await ctx.db.patch(wallet._id, {
    balance: wallet.balance + amount,
    updatedAt: now,
  });

  // Update user level tracking
  const userLevel = await ctx.db
    .query("userLevels")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .first();

  if (userLevel) {
    const newTitlePoints = userLevel.titlePoints + amount;
    const newTotalPoints = userLevel.totalPoints + amount;

    await ctx.db.patch(userLevel._id, {
      totalPoints: newTotalPoints,
      titlePoints: newTitlePoints,
      updatedAt: now,
    });

    // Check for level up
    const currentLevel = userLevel.currentLevel;
    const targetLevel = Math.min(
      50,
      LEVEL_DEFINITIONS.reduce((currentLevel: number, def: any) => {
        return newTitlePoints >= def.titlePoints ? def.level : currentLevel;
      }, 1)
    );

    if (targetLevel > currentLevel) {
      await ctx.db.patch(userLevel._id, {
        currentLevel: targetLevel,
        updatedAt: now,
      });

      // Award level up bonuses
      for (let lvl = currentLevel + 1; lvl <= targetLevel; lvl++) {
        const levelUpPoints = lvl * 5;
        await ctx.db.patch(wallet._id, {
          balance: wallet.balance + levelUpPoints,
          updatedAt: now,
        });
        await ctx.db.insert("transactions", {
          walletId: wallet._id,
          amount: levelUpPoints,
          type: "level_up_bonus",
          description: `Level Up Bonus for Level ${lvl}`,
          createdAt: now,
        });
      }
    }
  }
}

// Helper: Recalculate all stats and award both general and venture badges in real-time
export async function recalculateAndAwardBadgesHelper(ctx: any, userId: Id<"users">) {
  const now = Date.now();

  const user = await ctx.db.get(userId);
  if (!user) return;

  let userLevel = await ctx.db
    .query("userLevels")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .first();
  
  if (!userLevel) {
    // If userLevels record does not exist, initialize it
    const levelId = await ctx.db.insert("userLevels", {
      userId,
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
    userLevel = await ctx.db.get(levelId);
  }

  if (!userLevel) return;

  // 1. Get existing badges to prevent duplicates
  const existingVentureBadges = await ctx.db
    .query("ventureBadges")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .collect();
  const existingVentureIds = new Set(
    existingVentureBadges.map((b: any) => canonicalBadgeId(b.badgeId)),
  );

  const existingUserBadges = await ctx.db
    .query("userBadges")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .collect();
  const existingUserBadgeIds = new Set(existingUserBadges.map((b: any) => b.badgeId));

  // 2. Fetch direct db counts for reliability
  const ideas = await ctx.db
    .query("ideas")
    .withIndex("by_author", (q: any) => q.eq("authorId", userId))
    .collect();
  const ideasCreated = ideas.length;

  const comments = await ctx.db
    .query("comments")
    .withIndex("by_author", (q: any) => q.eq("authorId", userId))
    .collect();
  const commentsCount = comments.length;

  const sparkCount = await ctx.db
    .query("userIdeaSparks")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .collect();

  const invites = await ctx.db
    .query("contributionRequests")
    .withIndex("by_contributor_status", (q: any) => q.eq("contributorId", userId))
    .collect();

  // Query ventures of this user
  const ventures = await ctx.db
    .query("ventures")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .collect();

  let completedCheckpoints = 0;
  let goldCheckpoints = 0;
  let maxStage = 1;
  let highestCompletedStage = 0;
  let completedStages = 0;
  let hasVentureStage6 = false;
  let lifecyclesCompleted = 0;
  let perfectLifecycles = 0;

  let academicLifecycles = 0;
  let experimentalLifecycles = 0;
  let creativeLifecycles = 0;
  let ventureLifecycles = 0;
  const completedCategories = new Set<string>();
  const allCompletedCheckpoints: any[] = [];
  const allCheckpointIds: any[] = [];
  const completedStageNumbers = new Set<number>();
  const stageBadgeAwardIds = new Set<number>();

  for (const venture of ventures) {
    if ((venture.currentStage ?? 1) > maxStage) {
      maxStage = venture.currentStage;
    }

    const cpList = await ctx.db
      .query("ventureCheckpoints")
      .withIndex("by_venture", (q: any) => q.eq("ventureId", venture._id))
      .collect();

    const cpCompleted = cpList.filter((c: any) => isCheckpointComplete(c));
    completedCheckpoints += cpCompleted.length;
    allCompletedCheckpoints.push(...cpCompleted);
    allCheckpointIds.push(...cpList.map((cp: any) => cp._id));

    const gpCompleted = cpList.filter((c: any) => c.goldBonusEarned || (c.t1Completed && c.t2Completed && c.t3Completed));
    goldCheckpoints += gpCompleted.length;

    const templateId = normalizeVentureTemplate(venture.templateId);
    const checkpointDefinitions = getCheckpointDefinitions(templateId as TemplateId);
    const stageCheckpointCounts = new Map<number, number>();
    for (const checkpointDef of checkpointDefinitions) {
      const currentCount = stageCheckpointCounts.get(checkpointDef.stage) ?? 0;
      stageCheckpointCounts.set(
        checkpointDef.stage,
        Math.max(currentCount, checkpointDef.checkpoint),
      );
    }

    // Check completed stages for this venture
    let completedStagesForVenture = 0;
    let perfectStagesForVenture = 0;
    for (const [s, reqCount] of stageCheckpointCounts) {
      const stageCps = cpList.filter((c: any) => c.stage === s);
      const firstCheckpoint = stageCps.find((c: any) => c.checkpoint === 1);
      if (firstCheckpoint?.t1Completed) {
        const badge = findStageBadge(templateId, s, "A");
        if (badge) stageBadgeAwardIds.add(badge.id);
      }

      if (stageCps.length >= reqCount && stageCps.every((c: any) => isCheckpointComplete(c))) {
        completedStagesForVenture++;
        completedStages++;
        completedStageNumbers.add(s);
        if (s > highestCompletedStage) highestCompletedStage = s;
        if (templateId === "venture" && s >= 6) hasVentureStage6 = true;
        const clearBadge = findStageBadge(templateId, s, "B");
        if (clearBadge) stageBadgeAwardIds.add(clearBadge.id);
        
        if (stageCps.every((c: any) => checkpointTaskCount(c) === 3)) {
          perfectStagesForVenture++;
          const perfectBadge = findStageBadge(templateId, s, "C");
          if (perfectBadge) stageBadgeAwardIds.add(perfectBadge.id);
        }
      }
    }

    if (completedStagesForVenture >= stageCheckpointCounts.size) {
      lifecyclesCompleted++;
      
      const idea = await ctx.db.get(venture.ideaId);
      const ideaCategory = normalizeTemplateCategory(idea?.category) || "venture";
      completedCategories.add(ideaCategory);

      if (ideaCategory === "academic") academicLifecycles++;
      else if (ideaCategory === "experimental") experimentalLifecycles++;
      else if (ideaCategory === "creative") creativeLifecycles++;
      else if (ideaCategory === "venture") ventureLifecycles++;

      if (perfectStagesForVenture >= stageCheckpointCounts.size) {
        perfectLifecycles++;
      }
    }
  }

  // 1b. Additional helper calculations for remaining 62 badges
  const postedCategories = new Set<string>(
    ideas
      .map((idea: any) => normalizeTemplateCategory(idea.category))
      .filter(Boolean),
  );

  const contributionRequests = await ctx.db
    .query("contributionRequests")
    .withIndex("by_author_created", (q: any) => q.eq("authorId", userId))
    .collect();
  
  const requestsPerIdea: Record<string, number> = {};
  for (const req of contributionRequests) {
    requestsPerIdea[req.ideaId] = (requestsPerIdea[req.ideaId] || 0) + 1;
  }
  const hasDraw = Object.values(requestsPerIdea).some((count) => count >= 10);

  const acceptedCollaborations = await ctx.db
    .query("contributionRequests")
    .withIndex("by_contributor_status", (q: any) => q.eq("contributorId", userId).eq("status", "accepted"))
    .collect();
  const collaboratedAuthors = new Set(acceptedCollaborations.map((c: any) => c.authorId));

  const streakRecord = await ctx.db
    .query("userStreaks")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .first();
  const currentStreak = streakRecord?.currentStreak ?? 0;
  const longestStreak = streakRecord?.longestStreak ?? 0;

  const wallet = await ctx.db
    .query("wallets")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .first();
  const userTransactions = wallet 
    ? await ctx.db
        .query("transactions")
        .withIndex("by_wallet", (q: any) => q.eq("walletId", wallet._id))
        .collect()
    : [];

  const quartersByYear: Record<number, Set<number>> = {};
  for (const tx of userTransactions) {
    const d = new Date(tx.createdAt);
    const y = d.getFullYear();
    const q = Math.floor(d.getMonth() / 3) + 1;
    if (!quartersByYear[y]) quartersByYear[y] = new Set();
    quartersByYear[y].add(q);
  }
  const hasSeasonal = Object.values(quartersByYear).some((qs) => qs.size >= 4);

  // League-based badges are disabled until league mechanics are finalized.
  // const leaderboardWins = await ctx.db
  //   .query("dailyLeaderboardWinners")
  //   .withIndex("by_user", (q: any) => q.eq("userId", userId))
  //   .collect();

  // Midnight Oil
  let midnightOilCount = 0;
  for (const cp of allCompletedCheckpoints) {
    if (cp.completedAt) {
      const hours = new Date(cp.completedAt).getHours();
      if (hours >= 0 && hours < 5) {
        midnightOilCount++;
      }
    }
  }
  const hasMidnightOil = midnightOilCount >= 3;

  // Patient One
  let hasPatientOne = false;
  for (const cp of allCompletedCheckpoints) {
    if (cp.partialStartedAt && cp.completedAt) {
      const days = (cp.completedAt - cp.partialStartedAt) / (1000 * 60 * 60 * 24);
      if (days >= 30) {
        hasPatientOne = true;
        break;
      }
    }
  }

  // Perfectionist
  const sortedCompletedCps = [...allCompletedCheckpoints].sort((a: any, b: any) => (a.completedAt ?? 0) - (b.completedAt ?? 0));
  let consecutiveGold = 0;
  let hasPerfectionist = false;
  for (const cp of sortedCompletedCps) {
    const isGold = cp.goldBonusEarned || (cp.t1Completed && cp.t2Completed && cp.t3Completed);
    if (isGold) {
      consecutiveGold++;
      if (consecutiveGold >= 3) {
        hasPerfectionist = true;
      }
    } else {
      consecutiveGold = 0;
    }
  }

  // Contrarian
  const allTasks: any[] = [];
  for (const cpId of allCheckpointIds) {
    const tasks = await ctx.db
      .query("ventureTasks")
      .withIndex("by_checkpoint", (q: any) => q.eq("checkpointId", cpId))
      .collect();
    allTasks.push(...tasks);
  }

  let hasContrarian = false;
  for (const checkpointId of allCheckpointIds) {
    const tasksForCp = allTasks.filter((t: any) => t.checkpointId === checkpointId);
    const t1 = tasksForCp.find((t: any) => t.taskLevel === "t1");
    const t2 = tasksForCp.find((t: any) => t.taskLevel === "t2");
    const t3 = tasksForCp.find((t: any) => t.taskLevel === "t3");
    if (t3 && t3.status === "completed" && t3.completedAt) {
      const t1Time = t1 && t1.status === "completed" && t1.completedAt ? t1.completedAt : Infinity;
      const t2Time = t2 && t2.status === "completed" && t2.completedAt ? t2.completedAt : Infinity;
      if (t3.completedAt < t1Time && t3.completedAt < t2Time) {
        hasContrarian = true;
        break;
      }
    }
  }

  // Renaissance
  const activeIdeas = ideas.filter((idea: any) => !idea.isDeleted);
  const activeCategories = new Set(
    activeIdeas
      .map((idea: any) => normalizeTemplateCategory(idea.category))
      .filter(Boolean),
  );
  const hasRenaissance = REQUIRED_TEMPLATE_CATEGORIES.every((category) =>
    activeCategories.has(category),
  );

  // Ghost
  const hasGhost = sparkCount.length >= 50 && ideas.every((idea: any) => (idea.sparkCount ?? 0) === 0);

  // Full Moon
  const activeMonths = new Set<string>();
  for (const tx of userTransactions) {
    const d = new Date(tx.createdAt);
    activeMonths.add(`${d.getFullYear()}-${d.getMonth()}`);
  }
  const hasFullMoon = activeMonths.size >= 12;

  // Comeback
  let hasComeback = false;
  for (const cp of allCompletedCheckpoints) {
    if (cp.completedAt) {
      const ventureCps = allCompletedCheckpoints.filter((c: any) => c.ventureId === cp.ventureId && c.completedAt < cp.completedAt);
      if (ventureCps.length > 0) {
        const lastCp = ventureCps.reduce((latest: any, current: any) => (current.completedAt > latest.completedAt ? current : latest), ventureCps[0]);
        const diffDays = (cp.completedAt - lastCp.completedAt) / (1000 * 60 * 60 * 24);
        if (diffDays >= 60) {
          hasComeback = true;
          break;
        }
      } else {
        const ventureForCp = ventures.find((v: any) => v._id === cp.ventureId);
        if (ventureForCp && cp.completedAt - ventureForCp.createdAt >= 60 * 1000 * 60 * 60 * 24) {
          hasComeback = true;
          break;
        }
      }
    }
  }

  // 3. Evaluate general badges (from userBadges)
  const generalBadgesToAward = [];
  if (ideasCreated >= 1) generalBadgesToAward.push("first-idea");
  if (ideasCreated >= 5) generalBadgesToAward.push("idea-machine");
  if (commentsCount >= 5) generalBadgesToAward.push("chatterbox");
  if (userLevel.collaboratorsJoined >= 1) generalBadgesToAward.push("collaborator");
  
  // Trendsetter: check if any idea has sparkCount >= 10
  const hasTrendsetter = ideas.some((idea: any) => idea.sparkCount >= 10);
  if (hasTrendsetter) generalBadgesToAward.push("trendsetter");

  for (const slug of generalBadgesToAward) {
    const badge = await ensureGeneralBadgeDefinition(ctx, slug);

    if (badge && !existingUserBadgeIds.has(badge._id)) {
      await ctx.db.insert("userBadges", {
        userId,
        badgeId: badge._id,
        awardedAt: now,
      });

      // Award 20 points/XP
      await awardBadgePoints(ctx, userId, 20, badge.name);

      // Trigger notification
      await ctx.db.insert("notifications", {
        recipientId: userId,
        senderId: userId,
        type: "badge_awarded",
        message: `You earned the "${badge.name}" badge!`,
        relatedId: badge._id,
        isRead: false,
        createdAt: now,
      });
    }
  }

  // 4. Evaluate venture badges (from ventureBadges)
  const ventureConditions = [
    { id: 1, shouldAward: true }, // First Light: created account
    { id: 2, shouldAward: !!user.avatar }, // The Face Behind the Name
    { id: 3, shouldAward: (user.skills?.length ?? 0) >= 2 && (user.industries?.length ?? 0) >= 1 }, // Marked by Trade
    { id: 4, shouldAward: sparkCount.length >= 3 }, // The Wanderer
    { id: 5, shouldAward: commentsCount >= 1 }, // First Word
    { id: 6, shouldAward: ideasCreated >= 1 }, // The Seedling
    { id: 7, shouldAward: invites.length >= 1 }, // The Outstretched Hand
    { id: 8, shouldAward: userLevel.currentLevel >= 7 }, // Gate Crossed (passed tutorial levels 1-6)
    // Legacy stage badges (9-20) are replaced by the spreadsheet stage badges.
    // Existing earned copies are displayed through LEGACY_STAGE_BADGE_EQUIVALENTS.
    // { id: 9, shouldAward: completedCheckpoints >= 1 }, // The First Checkpoint
    // { id: 10, shouldAward: goldCheckpoints >= 1 }, // Gilded
    // { id: 11, shouldAward: completedStages >= 1 }, // Stage Clear
    // { id: 12, shouldAward: maxStage >= 4 }, // The Long Road
    // { id: 13, shouldAward: highestCompletedStage >= 5 }, // The Heartland
    // { id: 14, shouldAward: hasVentureStage6 }, // The Launcher
    // { id: 15, shouldAward: lifecyclesCompleted >= 1 }, // The Full Circle
    // { id: 16, shouldAward: perfectLifecycles >= 1 }, // The Gilded Path
    
    // Legacy stage-specific medals (71-78) are replaced by the spreadsheet stage badges.
    // { id: 71, shouldAward: completedStageNumbers.has(1) },
    // { id: 72, shouldAward: completedStageNumbers.has(2) },
    // { id: 73, shouldAward: completedStageNumbers.has(3) },
    // { id: 74, shouldAward: completedStageNumbers.has(4) },
    // { id: 75, shouldAward: completedStageNumbers.has(5) },
    // { id: 76, shouldAward: completedStageNumbers.has(6) },
    // { id: 77, shouldAward: completedStageNumbers.has(7) },
    // { id: 78, shouldAward: completedStageNumbers.has(8) },
    
    // Templates (17-22)
    // { id: 17, shouldAward: academicLifecycles >= 1 }, // The Archaeologist
    // { id: 18, shouldAward: experimentalLifecycles >= 1 }, // The Artificer
    // { id: 19, shouldAward: creativeLifecycles >= 1 }, // The Author
    // { id: 20, shouldAward: ventureLifecycles >= 1 }, // The Founder
    { id: 21, shouldAward: REQUIRED_TEMPLATE_CATEGORIES.every((category) => postedCategories.has(category) && completedCategories.has(category)) }, // The Polymath
    { id: 22, shouldAward: REQUIRED_TEMPLATE_CATEGORIES.every((category) => postedCategories.has(category)) }, // The Cartographer
    
    // Milestones (23-26)
    { id: 23, shouldAward: lifecyclesCompleted >= 2 }, // Twice-Born
    { id: 24, shouldAward: ideasCreated >= 10 }, // The Ten
    { id: 25, shouldAward: goldCheckpoints >= 25 }, // The Gold Standard
    { id: 26, shouldAward: goldCheckpoints >= 100 }, // Century
    
    // Community (27-38)
    { id: 27, shouldAward: commentsCount >= 10 }, // The Listener
    { id: 28, shouldAward: sparkCount.length >= 25 }, // The Advocate
    { id: 29, shouldAward: userLevel.upvotedCommentsCount >= 10 }, // The Critic
    { id: 30, shouldAward: userLevel.upvotedCommentsCount >= 50 }, // The Trusted Voice
    { id: 31, shouldAward: userLevel.collaboratorsJoined >= 1 }, // The Ally
    { id: 32, shouldAward: userLevel.collaboratorsRecruited >= 5 }, // The Recruiter (Assembler)
    { id: 33, shouldAward: userLevel.helpfulFlareResponses >= 5 }, // The Catalyst
    { id: 34, shouldAward: (user.followersCount ?? 0) >= 10 }, // The Followed
    { id: 35, shouldAward: ideas.some((idea: any) => idea.sparkCount >= 25) }, // The Celebrated
    { id: 36, shouldAward: ideas.some((idea: any) => idea.sparkCount >= 50) }, // The Beloved
    { id: 37, shouldAward: hasDraw }, // The Draw
    { id: 38, shouldAward: collaboratedAuthors.size >= 3 }, // The Connector
    
    // Consistency (39-46)
    { id: 39, shouldAward: longestStreak >= 7 || currentStreak >= 7 }, // The Regular
    { id: 40, shouldAward: longestStreak >= 30 || currentStreak >= 30 }, // The Devoted
    { id: 41, shouldAward: longestStreak >= 90 || currentStreak >= 90 }, // The Unbroken
    { id: 42, shouldAward: hasSeasonal }, // The Seasonal
    // League-based badges are disabled until league mechanics are finalized.
    // { id: 43, shouldAward: leaderboardWins.some((w: any) => w.rank <= 5) || userLevel.currentLevel >= 12 }, // The Weekly Champion
    // { id: 44, shouldAward: userLevel.currentLevel >= 5 }, // The Promoted
    // { id: 45, shouldAward: userLevel.currentLevel >= 25 }, // The Diamond
    // { id: 46, shouldAward: userLevel.currentLevel >= 35 }, // The Immovable
    
    // Hidden (47-54)
    { id: 47, shouldAward: hasMidnightOil }, // The Midnight Oil
    { id: 48, shouldAward: hasPatientOne }, // The Patient One
    { id: 49, shouldAward: hasPerfectionist }, // The Perfectionist
    { id: 50, shouldAward: hasContrarian }, // The Contrarian
    { id: 51, shouldAward: hasRenaissance }, // The Renaissance
    { id: 52, shouldAward: hasGhost }, // The Ghost
    { id: 53, shouldAward: hasFullMoon }, // Full Moon
    { id: 54, shouldAward: hasComeback }, // The Comeback
    
    // Aspirational (55-62)
    { id: 55, shouldAward: userLevel.currentLevel >= 50 }, // The Visionary
    { id: 56, shouldAward: lifecyclesCompleted >= 5 }, // The Lorekeeper
    { id: 57, shouldAward: ventureLifecycles >= 3 }, // The Realm Builder
    { id: 58, shouldAward: academicLifecycles >= 3 }, // The Elder Scholar
    { id: 59, shouldAward: experimentalLifecycles >= 3 }, // The Grand Artificer
    { id: 60, shouldAward: creativeLifecycles >= 3 }, // The Master
    { id: 61, shouldAward: commentsCount >= 1000 }, // The Thousand
    // Monument-based badges are disabled until monument mechanics are finalized.
    // { id: 62, shouldAward: goldCheckpoints >= 50 || userLevel.currentLevel >= 45 }, // The Architect of Ages / Walled City
    ...STAGE_BADGE_DEFINITIONS.map((badge) => ({
      id: badge.id,
      shouldAward: stageBadgeAwardIds.has(badge.id),
    })),
  ];

  // Find the active venture's corruption level to store at the time of award
  const sortedVentures = [...ventures].sort((a: any, b: any) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
  const activeVenture = sortedVentures[0];
  const corruptionLevel = activeVenture ? (activeVenture.corruptionLevel ?? 0) : 0;

  for (const { id, shouldAward } of ventureConditions) {
    if (shouldAward && !existingVentureIds.has(id)) {
      const badgeDef = BADGE_DEFINITIONS.find((b: any) => b.id === id);
      if (!badgeDef) continue;

      await ctx.db.insert("ventureBadges", {
        userId,
        badgeId: id,
        awardedAt: now,
        isHidden: badgeDef.rarity === "hidden",
        metadata: { 
          awardedBy: "realtime_recalculate",
          corruptionLevel: corruptionLevel
        },
      });

      // Award 20 points/XP
      await awardBadgePoints(ctx, userId, 20, badgeDef.name);

      await ctx.db.insert("badgeEvaluations", {
        badgeId: id,
        userId,
        condition: badgeDef.requirement,
        lastChecked: now,
        isAwarded: true,
        awardedAt: now,
      });

      // Insert notification so frontend and notification streams get notified
      await ctx.db.insert("notifications", {
        recipientId: userId,
        senderId: userId,
        type: "badge_awarded",
        message: `You earned the "${badgeDef.name}" badge!`,
        isRead: false,
        createdAt: now,
      });
    }
  }
}

// Client mutation to force a check and award of badges (e.g., on profile page load)
export const recalculateUserBadges = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await recalculateAndAwardBadgesHelper(ctx, args.userId);
  },
});

export const recalculateAllUserBadges = mutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();

    for (const user of users) {
      await recalculateAndAwardBadgesHelper(ctx, user._id);
    }

    return { processed: users.length };
  },
});

export const recalculateUserBadgesInternal = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await recalculateAndAwardBadgesHelper(ctx, args.userId);
  },
});

// Unified Profile Badges Query
export const getUserProfileBadges = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // 1. Fetch general badges
    const userBadges = await ctx.db
      .query("userBadges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const generalBadgesDetails = await Promise.all(
      userBadges.map(async (ub) => {
        const badge = await ctx.db.get(ub.badgeId);
        if (!badge) return null;
        return {
          id: `general_${badge.slug}`,
          name: badge.name,
          description: badge.description,
          category: badge.category || "onboarding",
          rarity: "common" as const,
          shape: "shield",
          primaryColor: "#E0F2FE",
          secondaryColor: "#0369A1",
          tagline: badge.description,
          requirement: "Initial creator milestone achieved",
          awardedAt: ub.awardedAt,
          type: "general" as const,
        };
      })
    );

    // 2. Fetch venture badges
    const ventureBadges = await ctx.db
      .query("ventureBadges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const seenVentureBadgeIds = new Set<number>();
    const ventureBadgesDetails = ventureBadges
      .filter((vb) => isDisplayableBadgeId(vb.badgeId))
      .map((vb) => {
        const badgeId = canonicalBadgeId(vb.badgeId);
        if (seenVentureBadgeIds.has(badgeId)) return null;
        seenVentureBadgeIds.add(badgeId);

        const def = BADGE_DEFINITIONS.find((b) => b.id === badgeId);
        if (!def) return null;

        let shape = def.shape;
        if (def.category === "idea_milestones" || def.category === "onboarding") {
          shape = "shield";
        }

        return {
          id: `venture_${def.id}`,
          name: def.name,
          description: def.tagline,
          category: def.category,
          rarity: def.rarity as "common" | "uncommon" | "rare" | "epic" | "legendary" | "hidden",
          shape,
          primaryColor: def.primaryColor,
          secondaryColor: def.secondaryColor,
          tagline: def.tagline,
          requirement: def.requirement,
          awardedAt: vb.awardedAt,
          type: "venture" as const,
          icon: getVentureBadgeEmoji(def.id, def.name),
        };
      })
      .filter((b) => b !== null);

    // 3. Fetch skill badges
    const skillBadges = await ctx.db
      .query("userSkillBadges")
      .withIndex("by_user_skill", (q) => q.eq("userId", args.userId))
      .collect();

    const badgeNames = ["", "Bronze", "Silver", "Gold", "Platinum"];
    const badgeRarities = ["common", "common", "uncommon", "rare", "epic"] as const;
    const badgeColors = [
      { primary: "#E2E8F0", secondary: "#475569" }, // Default
      { primary: "#F59E0B", secondary: "#78350F" }, // Bronze
      { primary: "#94A3B8", secondary: "#334155" }, // Silver
      { primary: "#FBBF24", secondary: "#92400E" }, // Gold
      { primary: "#38BDF8", secondary: "#0369A1" }, // Platinum
    ];

    const skillBadgesDetails = skillBadges.map((sb) => {
      const lvl = sb.badgeLeveL || 1;
      const colors = badgeColors[lvl] || badgeColors[0];
      return {
        id: `skill_${sb._id}`,
        name: `${badgeNames[lvl]} ${sb.skill} Badge`,
        description: `Earned for active participation and tasks in ${sb.skill}.`,
        category: "skill" as const,
        rarity: badgeRarities[lvl] as "common" | "uncommon" | "rare" | "epic" | "legendary",
        shape: "shield",
        primaryColor: colors.primary,
        secondaryColor: colors.secondary,
        tagline: `Demonstrated expertise in ${sb.skill}.`,
        requirement: `Complete tasks and contributions in ${sb.skill}`,
        awardedAt: sb.awardedAt,
        type: "skill" as const,
      };
    });

    const allBadges = [
      ...generalBadgesDetails.filter((b) => b !== null),
      ...ventureBadgesDetails,
      ...skillBadgesDetails,
    ];

    // Sort by awardedAt descending
    return allBadges.sort((a, b) => b.awardedAt - a.awardedAt);
  },
});
