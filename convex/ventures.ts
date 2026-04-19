import { v } from "convex/values";
import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";
import {
  CHECKPOINT_DEFINITIONS,
  BOSS_DEFINITIONS,
  POINT_VALUES,
  VENTURE_STAGES,
} from "./ventureConstants";
import { Id } from "./_generated/dataModel";

// ─────────────────────────────────────────────────────────────────────────────
// MUTATIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a URL for uploading files to Convex storage.
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Create a new venture from an existing idea.
 * Initializes all checkpoints and tasks for all 8 stages.
 * Randomly assigns 1-2 bosses from the pool.
 */
export const createVenture = mutation({
  args: {
    ideaId: v.id("ideas"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const clerkId = identity.subject;

    // Look up user by clerkId
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) throw new Error("User not found");

    // Verify the idea exists and belongs to this user
    const idea = await ctx.db.get(args.ideaId);
    if (!idea) throw new Error("Idea not found");
    if (idea.authorId !== user._id) {
      throw new Error("Only the idea author can create a venture");
    }

    // Check if a venture already exists for this idea
    const existing = await ctx.db
      .query("ventures")
      .withIndex("by_idea", (q) => q.eq("ideaId", args.ideaId))
      .first();

    if (existing) return existing._id;

    const now = Date.now();

    // Create the venture
    const ventureId = await ctx.db.insert("ventures", {
      ideaId: args.ideaId,
      userId: user._id,
      currentStage: 1,
      currentCheckpoint: 1,
      status: "active",
      assignedBosses: [],
      createdAt: now,
      updatedAt: now,
    });

    // Initialize all checkpoints and tasks for all 8 stages
    for (const cpDef of CHECKPOINT_DEFINITIONS) {
      const checkpointId = await ctx.db.insert("ventureCheckpoints", {
        ventureId,
        stage: cpDef.stage,
        checkpoint: cpDef.checkpoint,
        status: "not_started",
        t1Completed: false,
        t2Completed: false,
        t3Completed: false,
        goldBonusEarned: false,
      });

      // Create T1 task
      await ctx.db.insert("ventureTasks", {
        checkpointId,
        taskLevel: "t1",
        toolType: cpDef.t1.tool,
        status: "not_started",
      });

      // Create T2 task
      await ctx.db.insert("ventureTasks", {
        checkpointId,
        taskLevel: "t2",
        toolType: cpDef.t2.tool,
        status: "not_started",
      });

      // Create T3 task
      await ctx.db.insert("ventureTasks", {
        checkpointId,
        taskLevel: "t3",
        toolType: cpDef.t3.tool,
        status: "not_started",
      });
    }

    // Assign 1-2 random bosses
    const bossCount = Math.random() < 0.5 ? 1 : 2;
    const bossIds = shuffle(BOSS_DEFINITIONS.map((b) => b.id)).slice(
      0,
      bossCount,
    );

    for (const bossId of bossIds) {
      await ctx.db.insert("ventureBosses", {
        ventureId,
        bossId,
        status: "active",
        corruptionLevel: 20,
        bossSpecificCounters: {},
        assignedAt: now,
      });
    }

    // Update venture with assigned bosses
    await ctx.db.patch(ventureId, {
      assignedBosses: bossIds,
      updatedAt: now,
    });

    // Award points for creating a venture
    await awardPoints(
      ctx,
      user._id,
      POINT_VALUES.create_idea,
      "venture_created",
      ventureId,
    );

    return ventureId;
  },
});

/**
 * Start working on a checkpoint — transitions from not_started to in_progress.
 */
export const startCheckpoint = mutation({
  args: {
    checkpointId: v.id("ventureCheckpoints"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const checkpoint = await ctx.db.get(args.checkpointId);
    if (!checkpoint) throw new Error("Checkpoint not found");

    // Verify ownership
    const venture = await ctx.db.get(checkpoint.ventureId);
    if (!venture) throw new Error("Venture not found");

    const user = await getUserByClerkId(ctx, identity.subject);
    if (venture.userId !== user._id) {
      throw new Error("Not your venture");
    }

    if (checkpoint.status === "not_started") {
      await ctx.db.patch(args.checkpointId, {
        status: "in_progress",
      });
    }
  },
});

/**
 * Submit evidence for a task.
 * Creates the evidence record and links it to the task.
 */
export const submitEvidence = mutation({
  args: {
    taskId: v.id("ventureTasks"),
    content: v.any(),
    storageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    const checkpoint = await ctx.db.get(task.checkpointId);
    if (!checkpoint) throw new Error("Checkpoint not found");

    const venture = await ctx.db.get(checkpoint.ventureId);
    if (!venture) throw new Error("Venture not found");

    const user = await getUserByClerkId(ctx, identity.subject);
    if (venture.userId !== user._id) {
      throw new Error("Not your venture");
    }

    const now = Date.now();

    // Create evidence record
    const evidenceId = await ctx.db.insert("ventureEvidence", {
      taskId: args.taskId,
      userId: user._id,
      toolType: task.toolType,
      content: args.content,
      storageId: args.storageId,
      createdAt: now,
    });

    // Update task
    await ctx.db.patch(args.taskId, {
      status: "completed",
      evidenceId,
      completedAt: now,
    });

    // Update checkpoint completion flags
    const flagField = `${task.taskLevel}Completed` as
      | "t1Completed"
      | "t2Completed"
      | "t3Completed";
    await ctx.db.patch(checkpoint._id, {
      [flagField]: true,
      status: "in_progress",
    });

    // Re-read checkpoint to check if all three are now complete
    const updatedCheckpoint = await ctx.db.get(checkpoint._id);
    if (
      updatedCheckpoint &&
      updatedCheckpoint.t1Completed &&
      updatedCheckpoint.t2Completed &&
      updatedCheckpoint.t3Completed &&
      !updatedCheckpoint.goldBonusEarned
    ) {
      await ctx.db.patch(checkpoint._id, {
        goldBonusEarned: true,
      });

      // Award gold bonus points
      await awardPoints(
        ctx,
        user._id,
        POINT_VALUES.gold_checkpoint_bonus,
        "gold_checkpoint",
        venture._id,
      );
      await createNotification(
        ctx,
        user._id,
        user._id,
        "gold_checkpoint",
        `You earned a Gold Checkpoint! All 3 tasks completed. +${POINT_VALUES.gold_checkpoint_bonus} points`,
        venture._id,
      );
    }

    // Award task completion points
    const pointKey =
      `task_${task.taskLevel}_complete` as keyof typeof POINT_VALUES;
    await awardPoints(
      ctx,
      user._id,
      POINT_VALUES[pointKey],
      `${task.taskLevel}_task_complete`,
      venture._id,
    );

    return evidenceId;
  },
});

/**
 * Advance to the next checkpoint within the current stage.
 * Requires at least 2 of 3 tasks completed.
 */
export const advanceCheckpoint = mutation({
  args: {
    checkpointId: v.id("ventureCheckpoints"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const checkpoint = await ctx.db.get(args.checkpointId);
    if (!checkpoint) throw new Error("Checkpoint not found");

    const venture = await ctx.db.get(checkpoint.ventureId);
    if (!venture) throw new Error("Venture not found");

    const user = await getUserByClerkId(ctx, identity.subject);
    if (venture.userId !== user._id) {
      throw new Error("Not your venture");
    }

    // Count completed tasks
    const completedCount = [
      checkpoint.t1Completed,
      checkpoint.t2Completed,
      checkpoint.t3Completed,
    ].filter(Boolean).length;

    if (completedCount < 2) {
      throw new Error("At least 2 of 3 tasks must be completed to advance");
    }

    // Mark checkpoint as completed
    const now = Date.now();
    await ctx.db.patch(args.checkpointId, {
      status: "completed",
      completedAt: now,
    });

    // Find the next checkpoint in the same stage
    const nextCheckpoint = await ctx.db
      .query("ventureCheckpoints")
      .withIndex("by_venture_stage", (q) =>
        q.eq("ventureId", venture._id).eq("stage", checkpoint.stage),
      )
      .filter((q) => q.gt(q.field("checkpoint"), checkpoint.checkpoint))
      .order("asc")
      .first();

    if (nextCheckpoint) {
      // Move to next checkpoint
      await ctx.db.patch(venture._id, {
        currentCheckpoint: nextCheckpoint.checkpoint,
        updatedAt: now,
      });
    } else {
      // No more checkpoints in this stage — try to advance stage
      await tryAdvanceStage(ctx, venture, checkpoint.stage);
    }

    // Update boss corruption based on checkpoint completion
    await updateBossCorruptionOnProgress(ctx, venture._id);
  },
});

/**
 * Attempt to advance to the next stage.
 * Requires all checkpoints in current stage to be completed.
 */
export const advanceStage = mutation({
  args: {
    ventureId: v.id("ventures"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const venture = await ctx.db.get(args.ventureId);
    if (!venture) throw new Error("Venture not found");

    const user = await getUserByClerkId(ctx, identity.subject);
    if (venture.userId !== user._id) {
      throw new Error("Not your venture");
    }

    await tryAdvanceStage(ctx, venture, venture.currentStage);
  },
});

/**
 * Get a venture with all its checkpoints, tasks, and evidence.
 * Optimized: batches task and evidence queries to avoid N+1.
 */
export const getVenture = query({
  args: {
    ventureId: v.id("ventures"),
  },
  handler: async (ctx, args) => {
    const venture = await ctx.db.get(args.ventureId);
    if (!venture) return null;

    const checkpoints = await ctx.db
      .query("ventureCheckpoints")
      .withIndex("by_venture", (q) => q.eq("ventureId", args.ventureId))
      .collect();

    const bosses = await ctx.db
      .query("ventureBosses")
      .withIndex("by_venture", (q) => q.eq("ventureId", args.ventureId))
      .collect();

    // Batch fetch all tasks for all checkpoints
    const allTasks = await ctx.db.query("ventureTasks").collect();

    // Group tasks by checkpointId
    const tasksByCheckpoint = new Map();
    for (const task of allTasks) {
      if (task.checkpointId) {
        const existing = tasksByCheckpoint.get(task.checkpointId) || [];
        existing.push(task);
        tasksByCheckpoint.set(task.checkpointId, existing);
      }
    }

    // Batch fetch all evidence for tasks that have evidenceId
    const evidenceIds = new Set<string>();
    for (const task of allTasks) {
      if (task.evidenceId) {
        evidenceIds.add(task.evidenceId);
      }
    }

    const evidenceMap = new Map();
    for (const evidenceId of evidenceIds) {
      const evidence = await ctx.db.get(evidenceId as Id<"ventureEvidence">);
      if (evidence) {
        evidenceMap.set(evidenceId, evidence);
      }
    }

    // Enrich checkpoints with tasks
    const enrichedCheckpoints = checkpoints.map((cp) => {
      const tasks = tasksByCheckpoint.get(cp._id) || [];
      const enrichedTasks = tasks.map(
        (task: { evidenceId?: string; [key: string]: unknown }) => ({
          ...task,
          evidence: task.evidenceId
            ? evidenceMap.get(task.evidenceId) || null
            : null,
        }),
      );
      return { ...cp, tasks: enrichedTasks };
    });

    // Enrich bosses with definitions
    const enrichedBosses = bosses.map((boss) => {
      const def = BOSS_DEFINITIONS.find((b) => b.id === boss.bossId);
      return { ...boss, definition: def };
    });

    return {
      ...venture,
      checkpoints: enrichedCheckpoints,
      bosses: enrichedBosses,
    };
  },
});

/**
 * Lightweight venture summary for list views.
 * Does NOT fetch tasks or evidence — only venture + checkpoints + bosses.
 */
export const getVentureSummary = query({
  args: {
    ventureId: v.id("ventures"),
  },
  handler: async (ctx, args) => {
    const venture = await ctx.db.get(args.ventureId);
    if (!venture) return null;

    const checkpoints = await ctx.db
      .query("ventureCheckpoints")
      .withIndex("by_venture", (q) => q.eq("ventureId", args.ventureId))
      .collect();

    const bosses = await ctx.db
      .query("ventureBosses")
      .withIndex("by_venture", (q) => q.eq("ventureId", args.ventureId))
      .collect();

    const enrichedBosses = bosses.map((boss) => {
      const def = BOSS_DEFINITIONS.find((b) => b.id === boss.bossId);
      return { ...boss, definition: def };
    });

    // Calculate summary stats
    const completedCheckpoints = checkpoints.filter(
      (cp) => cp.status === "completed",
    ).length;
    const goldCheckpoints = checkpoints.filter(
      (cp) => cp.goldBonusEarned,
    ).length;

    return {
      ...venture,
      completedCheckpoints,
      goldCheckpoints,
      totalCheckpoints: checkpoints.length,
      bosses: enrichedBosses,
    };
  },
});

/**
 * Get venture summaries for all user ventures (for My Ventures page).
 * Lightweight — no tasks or evidence.
 */
export const getUserVentureSummaries = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await getUserByClerkId(ctx, identity.subject);

    const ventures = await ctx.db
      .query("ventures")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Batch fetch checkpoints for all ventures
    const allCheckpoints = await ctx.db.query("ventureCheckpoints").collect();

    const checkpointsByVenture = new Map<string, typeof allCheckpoints>();
    for (const cp of allCheckpoints) {
      const existing = checkpointsByVenture.get(cp.ventureId) || [];
      existing.push(cp);
      checkpointsByVenture.set(cp.ventureId, existing);
    }

    // Batch fetch bosses for all ventures
    const allBosses = await ctx.db.query("ventureBosses").collect();

    const bossesByVenture = new Map<string, typeof allBosses>();
    for (const boss of allBosses) {
      const existing = bossesByVenture.get(boss.ventureId) || [];
      existing.push(boss);
      bossesByVenture.set(boss.ventureId, existing);
    }

    return ventures.map((venture) => {
      const checkpoints = checkpointsByVenture.get(venture._id) || [];
      const bosses = bossesByVenture.get(venture._id) || [];

      const completedCheckpoints = checkpoints.filter(
        (cp) => cp.status === "completed",
      ).length;
      const goldCheckpoints = checkpoints.filter(
        (cp) => cp.goldBonusEarned,
      ).length;

      const enrichedBosses = bosses.map((boss) => {
        const def = BOSS_DEFINITIONS.find((b) => b.id === boss.bossId);
        return { ...boss, definition: def };
      });

      return {
        ...venture,
        completedCheckpoints,
        goldCheckpoints,
        totalCheckpoints: checkpoints.length,
        bosses: enrichedBosses,
      };
    });
  },
});

/**
 * Get all ventures for the current user.
 */
export const getUserVentures = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await getUserByClerkId(ctx, identity.subject);

    const ventures = await ctx.db
      .query("ventures")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return ventures;
  },
});

/**
 * Get a specific checkpoint with its tasks and evidence.
 */
export const getCheckpoint = query({
  args: {
    checkpointId: v.id("ventureCheckpoints"),
  },
  handler: async (ctx, args) => {
    const checkpoint = await ctx.db.get(args.checkpointId);
    if (!checkpoint) return null;

    const tasks = await ctx.db
      .query("ventureTasks")
      .withIndex("by_checkpoint", (q) =>
        q.eq("checkpointId", args.checkpointId),
      )
      .collect();

    const enrichedTasks = await Promise.all(
      tasks.map(async (task) => {
        let evidence = null;
        if (task.evidenceId) {
          evidence = await ctx.db.get(task.evidenceId);
        }
        return { ...task, evidence };
      }),
    );

    // Get checkpoint definition
    const def = CHECKPOINT_DEFINITIONS.find(
      (d) =>
        d.stage === checkpoint.stage && d.checkpoint === checkpoint.checkpoint,
    );

    return {
      ...checkpoint,
      definition: def,
      tasks: enrichedTasks,
    };
  },
});

/**
 * Get venture progress summary.
 */
export const getVentureProgress = query({
  args: {
    ventureId: v.id("ventures"),
  },
  handler: async (ctx, args) => {
    const venture = await ctx.db.get(args.ventureId);
    if (!venture) return null;

    const checkpoints = await ctx.db
      .query("ventureCheckpoints")
      .withIndex("by_venture", (q) => q.eq("ventureId", args.ventureId))
      .collect();

    const totalCheckpoints = checkpoints.length;
    const completedCheckpoints = checkpoints.filter(
      (cp) => cp.status === "completed",
    ).length;
    const goldCheckpoints = checkpoints.filter(
      (cp) => cp.goldBonusEarned,
    ).length;

    const stageProgress = VENTURE_STAGES.map((stage) => {
      const stageCheckpoints = checkpoints.filter(
        (cp) => cp.stage === stage.id,
      );
      const stageCompleted = stageCheckpoints.filter(
        (cp) => cp.status === "completed",
      ).length;
      return {
        stage: stage.id,
        name: stage.name,
        total: stageCheckpoints.length,
        completed: stageCompleted,
        isComplete:
          stageCompleted === stageCheckpoints.length &&
          stageCheckpoints.length > 0,
      };
    });

    return {
      venture,
      totalCheckpoints,
      completedCheckpoints,
      goldCheckpoints,
      completionPercentage:
        totalCheckpoints > 0
          ? Math.round((completedCheckpoints / totalCheckpoints) * 100)
          : 0,
      stageProgress,
    };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────────────────────────────────────

type MutationDbCtx = MutationCtx["db"];
type QueryDbCtx = QueryCtx["db"];

/**
 * Attempt to advance to the next stage.
 * Checks if all checkpoints in the current stage are completed.
 */
async function tryAdvanceStage(
  ctx: { db: MutationDbCtx },
  venture: { _id: Id<"ventures">; userId: Id<"users">; currentStage: number },
  currentStage: number,
) {
  const now = Date.now();

  // Get all checkpoints for current stage
  const stageCheckpoints = await ctx.db
    .query("ventureCheckpoints")
    .withIndex("by_venture_stage", (q) =>
      q.eq("ventureId", venture._id).eq("stage", currentStage),
    )
    .collect();

  const allComplete = stageCheckpoints.every((cp) => cp.status === "completed");

  if (!allComplete) return;

  // Award stage completion bonus
  const user = await ctx.db.get(venture.userId);
  if (user) {
    await awardPoints(
      ctx,
      user._id,
      POINT_VALUES.stage_complete_bonus,
      `stage_${currentStage}_complete`,
      venture._id,
    );
    await createNotification(
      ctx,
      user._id,
      user._id,
      "venture_stage_complete",
      `You completed Stage ${currentStage} of your venture!`,
      venture._id,
    );
  }

  if (currentStage < 8) {
    // Advance to next stage
    const nextStage = currentStage + 1;
    const firstCheckpointOfNextStage = await ctx.db
      .query("ventureCheckpoints")
      .withIndex("by_venture_stage", (q) =>
        q.eq("ventureId", venture._id).eq("stage", nextStage),
      )
      .order("asc")
      .first();

    if (firstCheckpointOfNextStage) {
      await ctx.db.patch(venture._id, {
        currentStage: nextStage,
        currentCheckpoint: firstCheckpointOfNextStage.checkpoint,
        updatedAt: now,
      });
    }
  } else {
    // All 8 stages complete — venture is done
    await ctx.db.patch(venture._id, {
      status: "completed",
      updatedAt: now,
    });

    // Award venture completion bonus
    if (user) {
      await awardPoints(
        ctx,
        user._id,
        POINT_VALUES.venture_complete_bonus,
        "venture_complete",
        venture._id,
      );
      await createNotification(
        ctx,
        user._id,
        user._id,
        "venture_complete",
        `Congratulations! You've completed your venture! +${POINT_VALUES.venture_complete_bonus} points`,
        venture._id,
      );

      // Update user level tracking for full lifecycles
      const userLevel = await ctx.db
        .query("userLevels")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();

      if (userLevel) {
        await ctx.db.patch(userLevel._id, {
          fullLifecycles: (userLevel.fullLifecycles || 0) + 1,
          updatedAt: now,
        });
      }
    }
  }
}

/**
 * Award points to a user.
 * Creates a transaction and updates the wallet.
 */
async function awardPoints(
  ctx: { db: MutationDbCtx },
  userId: Id<"users">,
  amount: number,
  type: string,
  relatedId: string,
) {
  if (amount <= 0) return;

  const now = Date.now();

  // Find or create wallet
  let wallet = await ctx.db
    .query("wallets")
    .withIndex("by_user", (q) => q.eq("userId", userId))
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
    type,
    description: `Venture: ${type}`,
    relatedId,
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
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();

  if (userLevel) {
    await ctx.db.patch(userLevel._id, {
      totalPoints: (userLevel.totalPoints || 0) + amount,
      titlePoints: (userLevel.titlePoints || 0) + amount,
      updatedAt: now,
    });
  }
}

/**
 * Create a notification for a user.
 */
async function createNotification(
  ctx: { db: MutationDbCtx },
  recipientId: Id<"users">,
  senderId: Id<"users">,
  type: string,
  message: string,
  relatedId: string,
) {
  await ctx.db.insert("notifications", {
    recipientId,
    senderId,
    type,
    message,
    relatedId: relatedId as Id<"ideas">,
    isRead: false,
    createdAt: Date.now(),
  });
}

/**
 * Update boss corruption when progress is made.
 * Completing checkpoints reduces corruption for relevant bosses.
 */
async function updateBossCorruptionOnProgress(
  ctx: { db: MutationDbCtx },
  ventureId: Id<"ventures">,
) {
  const bosses = await ctx.db
    .query("ventureBosses")
    .withIndex("by_venture", (q) => q.eq("ventureId", ventureId))
    .filter((q) => q.eq(q.field("status"), "active"))
    .collect();

  for (const boss of bosses) {
    // Reduce corruption by 10 points per checkpoint completion
    const newCorruption = Math.max(0, boss.corruptionLevel - 10);

    if (newCorruption === 0) {
      // Boss is defeated (retreat)
      await ctx.db.patch(boss._id, {
        status: "retreated",
        corruptionLevel: 0,
        defeatedAt: Date.now(),
      });
    } else {
      await ctx.db.patch(boss._id, {
        corruptionLevel: newCorruption,
      });
    }
  }
}

/**
 * Look up a user by their Clerk ID.
 */
async function getUserByClerkId(
  ctx: { db: QueryDbCtx | MutationDbCtx },
  clerkId: string,
) {
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
    .first();

  if (!user) throw new Error("User not found");
  return user;
}

/**
 * Fisher-Yates shuffle — used for random boss assignment.
 */
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
