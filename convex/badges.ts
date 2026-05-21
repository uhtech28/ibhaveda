import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { BADGE_DEFINITIONS, getVentureBadgeEmoji } from "./ventureConstants";

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
          // Map category → rarity for the BadgeAwardSequence component
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

// Internal: Award a badge if not already owned
export const awardBadge = internalMutation({
  args: {
    userId: v.id("users"),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    let badge = await ctx.db
      .query("badges")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!badge) {
      const fallback = INITIAL_BADGES.find((entry) => entry.slug === args.slug);
      if (!fallback) return;
      const badgeId = await ctx.db.insert("badges", fallback);
      badge = await ctx.db.get(badgeId);
      if (!badge) return;
    }

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
  const badge = await ctx.db
    .query("badges")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex("by_slug", (q: any) => q.eq("slug", slug))
    .first();

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

// ─────────────────────────────────────────────────────────────────────────────
// VENTURE BADGES (62-badge system)
// ─────────────────────────────────────────────────────────────────────────────

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

    const ventures = await ctx.db
      .query("ventures")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .collect();
    const sortedVentures = [...ventures].sort((a: any, b: any) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
    const activeVenture = sortedVentures[0];
    const fallbackCorruption = activeVenture ? (activeVenture.corruptionLevel ?? 0) : 0;

    return badges.map((badge) => {
      const def = BADGE_DEFINITIONS.find((b) => b.id === badge.badgeId);
      if (!def) return { ...badge, definition: undefined };

      const isLevelBadge = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20].includes(badge.badgeId);
      const isTaskBadge = def.category === "idea_milestones" && !isLevelBadge;

      let shape = def.shape;
      if (isTaskBadge) {
        shape = "shield";
      }

      let name = def.name;
      let rarity = def.rarity;
      let primaryColor = def.primaryColor;
      let secondaryColor = def.secondaryColor;

      if (isLevelBadge) {
        const corr = badge.metadata?.corruptionLevel !== undefined ? badge.metadata.corruptionLevel : fallbackCorruption;
        if (corr <= 30) {
          name = `${def.name} (Gold)`;
          rarity = "legendary";
          primaryColor = "#FBBF24";
          secondaryColor = "#92400E";
        } else if (corr <= 70) {
          name = `${def.name} (Silver)`;
          rarity = "rare";
          primaryColor = "#94A3B8";
          secondaryColor = "#334155";
        } else {
          name = `${def.name} (Bronze)`;
          rarity = "common";
          primaryColor = "#F59E0B";
          secondaryColor = "#78350F";
        }
      }

      return {
        ...badge,
        definition: {
          ...def,
          name,
          rarity,
          shape,
          primaryColor,
          secondaryColor,
        }
      };
    });
  },
});

export const getAllVentureBadges = query({
  args: {},
  handler: async () => BADGE_DEFINITIONS,
});

export const getVentureBadgeProgress = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const earnedBadges = await ctx.db
      .query("ventureBadges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const earnedIds = new Set(earnedBadges.map((b) => b.badgeId));

    const ventures = await ctx.db
      .query("ventures")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .collect();
    const sortedVentures = [...ventures].sort((a: any, b: any) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
    const activeVenture = sortedVentures[0];
    const fallbackCorruption = activeVenture ? (activeVenture.corruptionLevel ?? 0) : 0;

    return BADGE_DEFINITIONS.map((def) => {
      const isLevelBadge = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20].includes(def.id);
      const isTaskBadge = def.category === "idea_milestones" && !isLevelBadge;
      const earned = earnedIds.has(def.id);
      const record = earnedBadges.find((b) => b.badgeId === def.id);

      let shape = def.shape;
      if (isTaskBadge) {
        shape = "shield";
      }

      let name = def.name;
      let rarity = def.rarity;
      let primaryColor = def.primaryColor;
      let secondaryColor = def.secondaryColor;
      let icon = "";

      if (isLevelBadge) {
        const corr = record?.metadata?.corruptionLevel !== undefined ? record.metadata.corruptionLevel : fallbackCorruption;
        if (corr <= 30) {
          name = `${def.name} (Gold)`;
          rarity = "legendary";
          primaryColor = "#FBBF24";
          secondaryColor = "#92400E";
          icon = "🏆";
        } else if (corr <= 70) {
          name = `${def.name} (Silver)`;
          rarity = "rare";
          primaryColor = "#94A3B8";
          secondaryColor = "#334155";
          icon = "🥈";
        } else {
          name = `${def.name} (Bronze)`;
          rarity = "common";
          primaryColor = "#F59E0B";
          secondaryColor = "#78350F";
          icon = "🥉";
        }
      }

      return {
        ...def,
        name,
        rarity,
        shape,
        primaryColor,
        secondaryColor,
        icon: icon || undefined,
        earned,
        awardedAt: record?.awardedAt,
      };
    });
  },
});

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
  const existingVentureIds = new Set(existingVentureBadges.map((b: any) => b.badgeId));

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
  let completedStages = 0;
  let hasVentureStage6 = false;
  let hasVentureStage8 = false;
  let lifecyclesCompleted = 0;
  let perfectLifecycles = 0;

  const STAGE_CHECKPOINTS = [0, 3, 4, 3, 5, 6, 5, 5, 5]; // 1-indexed

  for (const venture of ventures) {
    const cpList = await ctx.db
      .query("ventureCheckpoints")
      .withIndex("by_venture", (q: any) => q.eq("ventureId", venture._id))
      .collect();

    const cpCompleted = cpList.filter((c: any) => c.status === "completed");
    completedCheckpoints += cpCompleted.length;

    const gpCompleted = cpList.filter((c: any) => c.goldBonusEarned || (c.t1Completed && c.t2Completed && c.t3Completed));
    goldCheckpoints += gpCompleted.length;

    // Check completed stages for this venture
    let completedStagesForVenture = 0;
    let perfectStagesForVenture = 0;
    for (let s = 1; s <= 8; s++) {
      const stageCps = cpList.filter((c: any) => c.stage === s);
      const reqCount = STAGE_CHECKPOINTS[s];
      if (stageCps.length >= reqCount && stageCps.every((c: any) => c.status === "completed")) {
        completedStagesForVenture++;
        completedStages++;
        if (s > maxStage) maxStage = s;
        if (s >= 6) hasVentureStage6 = true;
        if (s >= 8) hasVentureStage8 = true;
        
        if (stageCps.every((c: any) => c.goldBonusEarned || (c.t1Completed && c.t2Completed && c.t3Completed))) {
          perfectStagesForVenture++;
        }
      }
    }

    if (completedStagesForVenture >= 8) {
      lifecyclesCompleted++;
      if (perfectStagesForVenture >= 8) {
        perfectLifecycles++;
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
    const badge = await ctx.db
      .query("badges")
      .withIndex("by_slug", (q: any) => q.eq("slug", slug))
      .first();

    if (badge && !existingUserBadgeIds.has(badge._id)) {
      await ctx.db.insert("userBadges", {
        userId,
        badgeId: badge._id,
        awardedAt: now,
      });

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
    { id: 9, shouldAward: completedCheckpoints >= 1 }, // The First Checkpoint
    { id: 10, shouldAward: goldCheckpoints >= 1 }, // Gilded
    { id: 11, shouldAward: completedStages >= 1 }, // Stage Clear
    { id: 12, shouldAward: maxStage >= 4 }, // The Long Road
    { id: 13, shouldAward: maxStage >= 5 }, // The Heartland
    { id: 14, shouldAward: hasVentureStage6 }, // The Launcher
    { id: 15, shouldAward: lifecyclesCompleted >= 1 }, // The Full Circle
    { id: 16, shouldAward: perfectLifecycles >= 1 }, // The Gilded Path
    { id: 23, shouldAward: lifecyclesCompleted >= 2 }, // Twice-Born
    { id: 24, shouldAward: ideasCreated >= 10 }, // The Ten
    { id: 25, shouldAward: goldCheckpoints >= 25 }, // The Gold Standard
    { id: 26, shouldAward: goldCheckpoints >= 100 }, // Century
    { id: 27, shouldAward: commentsCount >= 10 }, // The Listener
    { id: 28, shouldAward: sparkCount.length >= 25 }, // The Advocate
    { id: 30, shouldAward: userLevel.upvotedCommentsCount >= 50 }, // The Trusted Voice
    { id: 31, shouldAward: userLevel.collaboratorsJoined >= 1 }, // The Ally
    { id: 32, shouldAward: userLevel.collaboratorsRecruited >= 5 }, // The Recruiter
    { id: 55, shouldAward: userLevel.currentLevel >= 50 }, // Level 50+
    { id: 56, shouldAward: lifecyclesCompleted >= 5 }, // 5 lifecycles
    { id: 57, shouldAward: lifecyclesCompleted >= 3 }, // 3 lifecycles
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
          id: `general_${badge._id}`,
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

    const ventures = await ctx.db
      .query("ventures")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .collect();
    const sortedVentures = [...ventures].sort((a: any, b: any) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
    const activeVenture = sortedVentures[0];
    const fallbackCorruption = activeVenture ? (activeVenture.corruptionLevel ?? 0) : 0;

    const ventureBadgesDetails = ventureBadges
      .map((vb) => {
        const def = BADGE_DEFINITIONS.find((b) => b.id === vb.badgeId);
        if (!def) return null;

        const isLevelBadge = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20].includes(vb.badgeId);
        const isTaskBadge = (def.category === "idea_milestones" || def.category === "onboarding") && !isLevelBadge;

        let shape = def.shape;
        if (isTaskBadge) {
          shape = "shield";
        }

        let name = def.name;
        let rarity = def.rarity;
        let primaryColor = def.primaryColor;
        let secondaryColor = def.secondaryColor;
        let icon = getVentureBadgeEmoji(def.id, def.name);

        if (isLevelBadge) {
          const corr = vb.metadata?.corruptionLevel !== undefined ? vb.metadata.corruptionLevel : fallbackCorruption;
          if (corr <= 30) {
            name = `${def.name} (Gold)`;
            rarity = "legendary";
            primaryColor = "#FBBF24";
            secondaryColor = "#92400E";
            icon = "🏆";
          } else if (corr <= 70) {
            name = `${def.name} (Silver)`;
            rarity = "rare";
            primaryColor = "#94A3B8";
            secondaryColor = "#334155";
            icon = "🥈";
          } else {
            name = `${def.name} (Bronze)`;
            rarity = "common";
            primaryColor = "#F59E0B";
            secondaryColor = "#78350F";
            icon = "🥉";
          }
        }

        return {
          id: `venture_${vb._id}`,
          name,
          description: def.tagline,
          category: def.category,
          rarity: rarity as "common" | "uncommon" | "rare" | "epic" | "legendary" | "hidden",
          shape,
          primaryColor,
          secondaryColor,
          tagline: def.tagline,
          requirement: def.requirement,
          awardedAt: vb.awardedAt,
          type: "venture" as const,
          icon,
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

