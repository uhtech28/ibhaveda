import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  VENTURE_STAGES,
  POINT_VALUES,
  CHECKPOINT_DEFINITIONS,
} from "./ventureConstants";
import { Id } from "./_generated/dataModel";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pre-computed brightness values returned alongside world map data.
 * These drive the Phaser post-FX pipeline — no further math required client-side.
 */
export interface BrightnessResult {
  /** Contribution from fully-completed stages. Range: 0–60. */
  accumulatedBase: number;
  /** Contribution from task progress within the current stage. Range: 0–40. */
  stageLayer: number;
  /** Total world brightness percentage fed to Phaser. Range: 0–100. */
  worldBrightness: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// BRIGHTNESS CALCULATION (inline — cannot cross the Convex / src boundary)
//
// Formula (two-layer):
//   accumulated base  = completedStages × (60 / 7)  — capped at 60%
//   stage layer       = (tasksDone / tasksTotal) × 40%
//   world brightness  = accumulated base + stage layer   (0–100%)
//
// Worked examples:
//   Stage 1 start          →  0      ×(60/7) +  0/12 ×40 =  0%
//   Entering Stage 2       →  1      ×(60/7) +  0    ×40 ≈  8.57%
//   Mid-Stage 5 (50% done) →  4      ×(60/7) + 0.5   ×40 ≈ 54.28%
//   All 8 stages complete  →  min(7×(60/7), 60) + 40     = 100%
// ─────────────────────────────────────────────────────────────────────────────

const PER_STAGE_CONTRIBUTION = 60 / 7; // ≈ 8.5714…% per completed stage
const MAX_ACCUMULATED = 60;
const MAX_STAGE_LAYER = 40;

/**
 * Derive brightness inputs from raw ventureCheckpoints rows and the venture's
 * currentStage, then return the three-part BrightnessResult.
 *
 * A "completed stage" is one where every checkpoint for that stage has
 * status === "completed" (or "skipped") and the stage precedes currentStage.
 *
 * Tasks done in the current stage = Σ (t1Completed + t2Completed + t3Completed)
 * across all checkpoints that belong to currentStage.
 */
function computeBrightness(
  checkpoints: Array<{
    stage: number;
    checkpoint: number;
    status: string;
    t1Completed: boolean;
    t2Completed: boolean;
    t3Completed: boolean;
  }>,
  currentStage: number,
): BrightnessResult {
  // ── 1. Count fully-completed prior stages ──────────────────────────────────
  let completedStages = 0;

  for (const stageDef of VENTURE_STAGES) {
    if (stageDef.id >= currentStage) break; // only look at stages before current

    const stageCheckpoints = checkpoints.filter(
      (cp) => cp.stage === stageDef.id,
    );

    // A stage is "complete" when every one of its checkpoints is done.
    // We guard against the edge-case where rows don't exist yet (e.g. fresh venture).
    const allPresent = stageCheckpoints.length >= stageDef.checkpoints;
    const allCompleted = stageCheckpoints.every(
      (cp) => cp.status === "completed" || cp.status === "skipped",
    );

    if (allPresent && allCompleted) {
      completedStages++;
    }
  }

  // ── 2. Count tasks done/total in the current stage ────────────────────────
  const currentStageDef = VENTURE_STAGES.find((s) => s.id === currentStage);
  const totalTasksInCurrentStage = (currentStageDef?.checkpoints ?? 0) * 3; // 3 tasks per checkpoint

  const currentStageCheckpoints = checkpoints.filter(
    (cp) => cp.stage === currentStage,
  );
  let tasksDoneInCurrentStage = 0;
  for (const cp of currentStageCheckpoints) {
    if (cp.t1Completed) tasksDoneInCurrentStage++;
    if (cp.t2Completed) tasksDoneInCurrentStage++;
    if (cp.t3Completed) tasksDoneInCurrentStage++;
  }

  // ── 3. Apply formula ───────────────────────────────────────────────────────
  const accumulatedBase = Math.min(
    completedStages * PER_STAGE_CONTRIBUTION,
    MAX_ACCUMULATED,
  );

  const stageLayer =
    totalTasksInCurrentStage > 0
      ? (tasksDoneInCurrentStage / totalTasksInCurrentStage) * MAX_STAGE_LAYER
      : 0;

  const worldBrightness = Math.min(accumulatedBase + stageLayer, 100);

  return {
    accumulatedBase: Math.round(accumulatedBase * 100) / 100,
    stageLayer: Math.round(stageLayer * 100) / 100,
    worldBrightness: Math.round(worldBrightness * 100) / 100,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// QUERIES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch everything the Phaser WorldMap scene needs for a single venture:
 *  - The venture document (stage, checkpoint, status, bosses)
 *  - All ventureCheckpoint rows (one per checkpoint across all 8 stages)
 *  - Pre-computed brightness breakdown (accumulatedBase / stageLayer / worldBrightness)
 *
 * The caller does NOT need to re-implement the brightness formula — simply
 * forward `brightness.worldBrightness` straight to the `EventBridge`.
 *
 * Returns `null` if the venture does not exist.
 */
export const getWorldMapData = query({
  args: {
    ventureId: v.id("ventures"),
  },
  handler: async (ctx, args) => {
    // ── Venture ───────────────────────────────────────────────────────────────
    const venture = await ctx.db.get(args.ventureId);
    if (!venture) return null;

    // ── Idea title (venture name shown in HUD) ────────────────────────────────
    const idea = await ctx.db.get(venture.ideaId);
    const ideaTitle = idea?.title ?? "Unnamed Venture";

    // ── Checkpoints ───────────────────────────────────────────────────────────
    const checkpoints = await ctx.db
      .query("ventureCheckpoints")
      .withIndex("by_venture", (q) => q.eq("ventureId", args.ventureId))
      .collect();

    // ── Tasks (one batch — keyed by checkpointId) ────────────────────────────
    // We need task _ids so the map page can call markTaskComplete without
    // a separate lookup.
    const allTasks = await ctx.db.query("ventureTasks").collect();
    const tasksByCheckpoint = new Map<string, typeof allTasks>();
    for (const task of allTasks) {
      const key = task.checkpointId as string;
      const existing = tasksByCheckpoint.get(key) ?? [];
      existing.push(task);
      tasksByCheckpoint.set(key, existing);
    }

    // Attach task rows to each checkpoint, enriched with real prompt text
    // from CHECKPOINT_DEFINITIONS so the map panel shows the actual task prompt.
    const checkpointsWithTasks = checkpoints.map((cp) => {
      const cpDef = CHECKPOINT_DEFINITIONS.find(
        (d) => d.stage === cp.stage && d.checkpoint === cp.checkpoint,
      );

      const tasks = (tasksByCheckpoint.get(cp._id as string) ?? [])
        .sort((a, b) => {
          const order: Record<string, number> = { t1: 0, t2: 1, t3: 2 };
          return (order[a.taskLevel] ?? 0) - (order[b.taskLevel] ?? 0);
        })
        .map((task) => {
          // Pull the real prompt from the constant definitions
          const promptKey = task.taskLevel as "t1" | "t2" | "t3";
          const prompt = cpDef?.[promptKey]?.prompt ?? "";
          return { ...task, prompt };
        });

      return {
        ...cp,
        // Expose checkpoint outcome so the panel can display it
        outcome: cpDef?.outcome ?? "",
        checkpointName: cpDef?.name ?? `Checkpoint ${cp.checkpoint}`,
        tasks,
      };
    });

    // ── Brightness ────────────────────────────────────────────────────────────
    const brightness = computeBrightness(checkpoints, venture.currentStage);

    return {
      venture,
      ideaTitle,
      checkpoints: checkpointsWithTasks,
      brightness,
    };
  },
});

/**
 * Return all ventures that belong to the currently authenticated user.
 *
 * Auth flow:
 *   1. Resolve Clerk identity from the request.
 *   2. Look up the internal user doc via the `by_clerk_id` index.
 *   3. Query the `ventures` table via the `by_user` index.
 *
 * Returns an empty array for unauthenticated requests or users who have
 * not yet completed onboarding (i.e. no matching user row).
 */
// ─────────────────────────────────────────────────────────────────────────────
// MUTATIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lightweight task-completion mutation used by the world-map panel.
 *
 * Marks one task (t1 / t2 / t3) on a checkpoint as done, creates a minimal
 * self-report evidence record, updates the checkpoint flags, and awards the
 * appropriate points.  Does NOT gate on evidence content — the world-map UX
 * treats task toggling as a quick acknowledgement rather than a full submission.
 *
 * Idempotent: calling it a second time for an already-completed task is a no-op.
 */
export const markTaskComplete = mutation({
  args: {
    checkpointId: v.id("ventureCheckpoints"),
    taskLevel: v.union(v.literal("t1"), v.literal("t2"), v.literal("t3")),
  },
  handler: async (ctx, args) => {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const checkpoint = await ctx.db.get(args.checkpointId);
    if (!checkpoint) throw new Error("Checkpoint not found");

    // ── Idempotency guard ─────────────────────────────────────────────────────
    const flagField =
      args.taskLevel === "t1"
        ? "t1Completed"
        : args.taskLevel === "t2"
          ? "t2Completed"
          : "t3Completed";

    if (checkpoint[flagField]) return { alreadyDone: true };

    // ── Ownership ─────────────────────────────────────────────────────────────
    const venture = await ctx.db.get(checkpoint.ventureId);
    if (!venture) throw new Error("Venture not found");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");
    if (venture.userId !== user._id) throw new Error("Not your venture");

    // ── Find the task row ────────────────────────────────────────────────────
    const task = await ctx.db
      .query("ventureTasks")
      .filter((q) =>
        q.and(
          q.eq(q.field("checkpointId"), args.checkpointId),
          q.eq(q.field("taskLevel"), args.taskLevel),
        ),
      )
      .first();

    if (!task)
      throw new Error(`Task ${args.taskLevel} not found for checkpoint`);

    const now = Date.now();

    // ── Create minimal evidence (self-report) ─────────────────────────────────
    const evidenceId = await ctx.db.insert("ventureEvidence", {
      taskId: task._id,
      userId: user._id,
      toolType: "self_report",
      content: { note: "Marked complete from world map", completedAt: now },
      createdAt: now,
    });

    // ── Mark task done ────────────────────────────────────────────────────────
    await ctx.db.patch(task._id, {
      status: "completed",
      evidenceId,
      completedAt: now,
    });

    // ── Update checkpoint flag (and check for gold) ───────────────────────────
    const updatedFlags = {
      t1Completed: checkpoint.t1Completed,
      t2Completed: checkpoint.t2Completed,
      t3Completed: checkpoint.t3Completed,
      [flagField]: true,
    };

    const allThreeDone =
      updatedFlags.t1Completed &&
      updatedFlags.t2Completed &&
      updatedFlags.t3Completed;

    const cpPatch: Record<string, unknown> = {
      [flagField]: true,
      status: "in_progress",
    };

    if (allThreeDone && !checkpoint.goldBonusEarned) {
      cpPatch.goldBonusEarned = true;
      // Award gold bonus points via wallet/level pipeline
      await ctx.db
        .insert("transactions", {
          walletId: (
            await ctx.db
              .query("wallets")
              .withIndex("by_user", (q) => q.eq("userId", user._id))
              .first()
          )?._id as Id<"wallets">,
          amount: POINT_VALUES.gold_checkpoint_bonus,
          type: "gold_checkpoint",
          description: "Gold checkpoint bonus — all 3 tasks complete",
          relatedId: venture._id,
          createdAt: now,
        })
        .catch(() => {
          /* wallet may not exist yet — non-fatal */
        });

      // Create social feed notification for gold checkpoint
      const idea = await ctx.db.get(venture.ideaId);
      const stageName =
        VENTURE_STAGES[checkpoint.stage - 1]?.name ||
        `Stage ${checkpoint.stage}`;
      const checkpointDef = CHECKPOINT_DEFINITIONS.find(
        (cp) =>
          cp.stage === checkpoint.stage &&
          cp.checkpoint === checkpoint.checkpoint,
      );
      const checkpointName =
        checkpointDef?.name || `Checkpoint ${checkpoint.checkpoint}`;
      const ventureName = idea?.title || "Your Venture";

      await ctx.db.insert("notifications", {
        recipientId: user._id,
        senderId: user._id,
        type: "gold_checkpoint",
        message: `🏆 ${ventureName} - ${stageName}: ${checkpointName} - Gold Checkpoint! All 3 tasks completed. +${POINT_VALUES.gold_checkpoint_bonus} points`,
        relatedId: venture.ideaId,
        isRead: false,
        createdAt: now,
      });
    }

    await ctx.db.patch(args.checkpointId, cpPatch);

    // ── Award task points ─────────────────────────────────────────────────────
    const pointKey =
      `task_${args.taskLevel}_complete` as keyof typeof POINT_VALUES;
    const pts = POINT_VALUES[pointKey] as number | undefined;

    if (pts) {
      const wallet = await ctx.db
        .query("wallets")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();

      if (wallet) {
        await ctx.db.insert("transactions", {
          walletId: wallet._id,
          amount: pts,
          type: `${args.taskLevel}_task_complete`,
          description: `Task ${args.taskLevel.toUpperCase()} completed`,
          relatedId: venture._id,
          createdAt: now,
        });
        await ctx.db.patch(wallet._id, {
          balance: wallet.balance + pts,
          updatedAt: now,
        });

        // Propagate to userLevels
        const userLevel = await ctx.db
          .query("userLevels")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .first();

        if (userLevel) {
          await ctx.db.patch(userLevel._id, {
            totalPoints: userLevel.totalPoints + pts,
            titlePoints: userLevel.titlePoints + pts,
            updatedAt: now,
          });
        }
      }
    }

    return {
      success: true,
      goldEarned: allThreeDone && !checkpoint.goldBonusEarned,
    };
  },
});

export const getVenturesByUser = query({
  args: {},
  handler: async (ctx) => {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const clerkId = identity.subject;

    // ── User lookup ───────────────────────────────────────────────────────────
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) return [];

    // ── Ventures ──────────────────────────────────────────────────────────────
    const ventures = await ctx.db
      .query("ventures")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return ventures;
  },
});

export const savePersonaGender = mutation({
  args: {
    ventureId: v.id("ventures"),
    gender: v.union(v.literal("male"), v.literal("female")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const venture = await ctx.db.get(args.ventureId);
    if (!venture) throw new Error("Venture not found");
    await ctx.db.patch(args.ventureId, {
      personaGender: args.gender,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

/**
 * Submit actual content for a task (replaces simple checkbox toggle).
 * 
 * This mutation:
 * 1. Validates content (minimum 50 words)
 * 2. Creates evidence record with actual content
 * 3. Marks task as complete
 * 4. Updates checkpoint flags
 * 5. Awards points
 * 6. Checks for gold checkpoint completion
 */
export const submitTaskContent = mutation({
  args: {
    checkpointId: v.id("ventureCheckpoints"),
    taskLevel: v.union(v.literal("t1"), v.literal("t2"), v.literal("t3")),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    // ── Validate content ──────────────────────────────────────────────────────
    const wordCount = args.content.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount < 50) {
      throw new Error("Content must be at least 50 words");
    }

    // ── Get checkpoint ────────────────────────────────────────────────────────
    const checkpoint = await ctx.db.get(args.checkpointId);
    if (!checkpoint) throw new Error("Checkpoint not found");

    // ── Verify ownership ──────────────────────────────────────────────────────
    const venture = await ctx.db.get(checkpoint.ventureId);
    if (!venture) throw new Error("Venture not found");
    if (venture.userId !== user._id) throw new Error("Not your venture");

    // ── Check if already completed ────────────────────────────────────────────
    const flagField =
      args.taskLevel === "t1"
        ? "t1Completed"
        : args.taskLevel === "t2"
          ? "t2Completed"
          : "t3Completed";

    if (checkpoint[flagField]) {
      throw new Error("Task already completed");
    }

    // ── Find task row ─────────────────────────────────────────────────────────
    const task = await ctx.db
      .query("ventureTasks")
      .filter((q) =>
        q.and(
          q.eq(q.field("checkpointId"), args.checkpointId),
          q.eq(q.field("taskLevel"), args.taskLevel),
        ),
      )
      .first();

    if (!task) throw new Error(`Task ${args.taskLevel} not found`);

    const now = Date.now();

    // ── Create evidence with actual content ───────────────────────────────────
    const evidenceId = await ctx.db.insert("ventureEvidence", {
      taskId: task._id,
      userId: user._id,
      toolType: task.toolType,
      content: {
        text: args.content,
        wordCount,
        submittedAt: now,
      },
      createdAt: now,
    });

    // ── Mark task complete ────────────────────────────────────────────────────
    await ctx.db.patch(task._id, {
      status: "completed",
      evidenceId,
      completedAt: now,
    });

    // ── Update checkpoint flags ───────────────────────────────────────────────
    const updatedFlags = {
      t1Completed: checkpoint.t1Completed,
      t2Completed: checkpoint.t2Completed,
      t3Completed: checkpoint.t3Completed,
      [flagField]: true,
    };

    const allThreeDone =
      updatedFlags.t1Completed &&
      updatedFlags.t2Completed &&
      updatedFlags.t3Completed;

    const cpPatch: Record<string, unknown> = {
      [flagField]: true,
      status: "in_progress",
    };

    // ── Check for gold checkpoint ─────────────────────────────────────────────
    if (allThreeDone && !checkpoint.goldBonusEarned) {
      cpPatch.goldBonusEarned = true;

      // Award gold bonus
      const wallet = await ctx.db
        .query("wallets")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();

      if (wallet) {
        await ctx.db.insert("transactions", {
          walletId: wallet._id,
          amount: POINT_VALUES.gold_checkpoint_bonus,
          type: "gold_checkpoint",
          description: "Gold checkpoint bonus — all 3 tasks complete",
          relatedId: venture._id,
          createdAt: now,
        });

        await ctx.db.patch(wallet._id, {
          balance: wallet.balance + POINT_VALUES.gold_checkpoint_bonus,
          updatedAt: now,
        });
      }

      // Create notification
      const idea = await ctx.db.get(venture.ideaId);
      const stageName =
        VENTURE_STAGES[checkpoint.stage - 1]?.name ||
        `Stage ${checkpoint.stage}`;
      const checkpointDef = CHECKPOINT_DEFINITIONS.find(
        (cp) =>
          cp.stage === checkpoint.stage &&
          cp.checkpoint === checkpoint.checkpoint,
      );
      const checkpointName =
        checkpointDef?.name || `Checkpoint ${checkpoint.checkpoint}`;
      const ventureName = idea?.title || "Your Venture";

      await ctx.db.insert("notifications", {
        recipientId: user._id,
        senderId: user._id,
        type: "gold_checkpoint",
        message: `🏆 ${ventureName} - ${stageName}: ${checkpointName} - Gold Checkpoint! All 3 tasks completed. +${POINT_VALUES.gold_checkpoint_bonus} points`,
        relatedId: venture.ideaId,
        isRead: false,
        createdAt: now,
      });
    }

    await ctx.db.patch(args.checkpointId, cpPatch);

    // ── Award task points ─────────────────────────────────────────────────────
    const pointKey =
      `task_${args.taskLevel}_complete` as keyof typeof POINT_VALUES;
    const pts = POINT_VALUES[pointKey] as number | undefined;

    if (pts) {
      const wallet = await ctx.db
        .query("wallets")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();

      if (wallet) {
        await ctx.db.insert("transactions", {
          walletId: wallet._id,
          amount: pts,
          type: `${args.taskLevel}_task_complete`,
          description: `Task ${args.taskLevel.toUpperCase()} completed`,
          relatedId: venture._id,
          createdAt: now,
        });

        await ctx.db.patch(wallet._id, {
          balance: wallet.balance + pts,
          updatedAt: now,
        });

        // Update user level
        const userLevel = await ctx.db
          .query("userLevels")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .first();

        if (userLevel) {
          await ctx.db.patch(userLevel._id, {
            totalPoints: userLevel.totalPoints + pts,
            titlePoints: userLevel.titlePoints + pts,
            updatedAt: now,
          });
        }
      }
    }

    return {
      success: true,
      goldEarned: allThreeDone && !checkpoint.goldBonusEarned,
      pointsAwarded: pts || 0,
    };
  },
});
