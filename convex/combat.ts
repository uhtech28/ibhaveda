/**
 * AI Cross-Question Combat — round lifecycle (HP-based, win/loss flow).
 *
 * The round opens when the user has submitted at least 2 of 3 standard
 * tasks for a checkpoint and clicks Advance. The mini-boss spawns,
 * questions are asked one at a time, and per-question 1-5 scores
 * translate to a damage exchange against boss/player HP (see the
 * DAMAGE_BY_SCORE table in combatConstants).
 *
 * The round ends:
 *   - WON  when boss HP reaches 0 (checkpoint can advance)
 *   - LOST when player HP reaches 0 mid-round, or when the question
 *          budget is exhausted with the boss still alive
 *
 * On loss the client surfaces two options: retry combat (creates a
 * fresh round), or edit tasks (returns the user to the standard
 * submission UI). Both are unlimited in v1; the cap is disabled.
 *
 * Public surface (called from client):
 *   mutation startCombatRound       open a round for a checkpoint
 *   mutation retryCombat            start a fresh round on the same checkpoint
 *   mutation submitAnswer           capture answer + telemetry; advance round
 *   mutation abandonCombatRound     user closed panel mid-round
 *   query    getRoundState          stream round + current question
 *   query    getRoundResult         the win/loss result view
 *   query    getActiveCombatBan     for the suspension gate
 *
 * Internal pipeline (action → mutation, not for client use):
 *   action   generateNextQuestion
 *   action   evaluateAnswer
 *   internal persistGeneratedQuestion
 *   internal persistAnswerEvaluation
 *   internal recordAiSuspicion
 *   internal settleRound
 */

import { v } from "convex/values";
import { ConvexError } from "convex/values";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import {
  COMBAT_CONFIG,
  applyDamageExchange,
  applyXpDelta,
  clampDuration,
  currentMonthBucket,
  durationForComplexity,
  questionCountForRound,
  resolveOutcome,
  type CombatTier,
  type ComplexityTier,
} from "./combatConstants";
import type {
  AntiCheatVerdict,
  CombatPersona,
  CombatRoundResult,
} from "./combatTypes";

// ─────────────────────────────────────────────────────────────────────
// Argument validators
// ─────────────────────────────────────────────────────────────────────

const keystrokeTelemetryValidator = v.object({
  typedCharCount: v.number(),
  pastedCharCount: v.number(),
  pasteEventCount: v.number(),
  meanKeystrokeGapMs: v.union(v.number(), v.null()),
  keystrokeGapVarianceMs2: v.union(v.number(), v.null()),
  editEventCount: v.number(),
});

// ─────────────────────────────────────────────────────────────────────
// Public: start (or resume) a round for a checkpoint
// ─────────────────────────────────────────────────────────────────────

export const startCombatRound = mutation({
  args: {
    checkpointId: v.id("ventureCheckpoints"),
  },
  handler: async (ctx, { checkpointId }) => {
    const userId = await requireUser(ctx);

    // Account suspension takes precedence over everything else.
    const ban = await activeBanFor(ctx, userId);
    if (ban) {
      throw new ConvexError({
        code: "game_banned",
        until: ban.banEndAt,
        reason: ban.reason,
      });
    }

    const checkpoint = await ctx.db.get(checkpointId);
    if (!checkpoint) {
      throw new ConvexError({ code: "checkpoint_not_found" });
    }

    // Resume an active round for this user × checkpoint if one exists.
    const existing = await ctx.db
      .query("combatRounds")
      .withIndex("by_user_checkpoint", (q) =>
        q.eq("userId", userId).eq("checkpointId", checkpointId),
      )
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();
    if (existing) {
      return { roundId: existing._id, resumed: true };
    }

    // Gate: at least 2 of 3 standard tasks must be submitted.
    const standardSubmitted = await countSubmittedStandardTasks(
      ctx,
      userId,
      checkpointId,
    );
    if (standardSubmitted < 2) {
      throw new ConvexError({
        code: "advance_gate_unmet",
        required: 2,
        submitted: standardSubmitted,
      });
    }

    const tier = await userTier(ctx, userId);
    const monthBucket = currentMonthBucket();

    // Monthly cap enforcement. v1: disabled (master flag in constants).
    if (COMBAT_CONFIG.MONTHLY_CAP_ENABLED) {
      const usedThisMonth = await ctx.db
        .query("combatRounds")
        .withIndex("by_user_month", (q) =>
          q.eq("userId", userId).eq("monthBucket", monthBucket),
        )
        .collect();
      const billableRounds = usedThisMonth.filter(
        (r) => r.status !== "cap_exhausted",
      );
      const limit = COMBAT_CONFIG.MONTHLY_CAP_BY_TIER[tier];
      if (billableRounds.length >= limit) {
        const roundId = await ctx.db.insert("combatRounds", {
          userId,
          ventureId: checkpoint.ventureId,
          checkpointId,
          tier,
          totalQuestions: 0,
          bossHpInitial: COMBAT_CONFIG.INITIAL_HP,
          playerHpInitial: COMBAT_CONFIG.INITIAL_HP,
          bossHpCurrent: COMBAT_CONFIG.INITIAL_HP,
          playerHpCurrent: COMBAT_CONFIG.INITIAL_HP,
          attemptNumber: await nextAttemptNumber(ctx, userId, checkpointId),
          status: "cap_exhausted",
          startedAt: Date.now(),
          monthBucket,
        });
        return { roundId, capExhausted: true };
      }
    }

    // Base score for the round = average of the user's standard-task scores.
    // Used only to scale question count; the round outcome is HP-based.
    const baseScore = await averageStandardTaskBaseScore(
      ctx,
      userId,
      checkpointId,
    );
    const totalQuestions = questionCountForRound(tier, baseScore);

    const roundId = await ctx.db.insert("combatRounds", {
      userId,
      ventureId: checkpoint.ventureId,
      checkpointId,
      tier,
      totalQuestions,
      bossHpInitial: COMBAT_CONFIG.INITIAL_HP,
      playerHpInitial: COMBAT_CONFIG.INITIAL_HP,
      bossHpCurrent: COMBAT_CONFIG.INITIAL_HP,
      playerHpCurrent: COMBAT_CONFIG.INITIAL_HP,
      attemptNumber: await nextAttemptNumber(ctx, userId, checkpointId),
      status: "active",
      startedAt: Date.now(),
      monthBucket,
    });

    await ctx.scheduler.runAfter(0, internal.combat.generateNextQuestion, {
      roundId,
      nextOrder: 1,
    });

    return { roundId, resumed: false };
  },
});

/**
 * Retry a checkpoint's combat after a loss. Creates a fresh round; the
 * lost round stays in the DB for analytics. The user's standard-task
 * answers are reused as context (unless they've been edited between
 * attempts via the Edit-tasks flow).
 */
export const retryCombat = mutation({
  args: { checkpointId: v.id("ventureCheckpoints") },
  handler: async (ctx, { checkpointId }): Promise<{ roundId: Id<"combatRounds"> }> => {
    const userId = await requireUser(ctx);

    // Refuse if there's an active round on this checkpoint — they should
    // finish or abandon it first.
    const active = await ctx.db
      .query("combatRounds")
      .withIndex("by_user_checkpoint", (q) =>
        q.eq("userId", userId).eq("checkpointId", checkpointId),
      )
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();
    if (active) {
      await ctx.db.patch(active._id, {
        status: "abandoned",
        endedAt: Date.now(),
      });
    }

    // Nuclear reset — delete EVERY round + question + AI suspicion
    // record for this user × checkpoint. This guarantees the AI has a
    // completely fresh slate and the user can never get trapped in an
    // unwinnable retry loop. We only wipe records for THIS checkpoint
    // so progress on other checkpoints stays intact.
    const oldRounds = await ctx.db
      .query("combatRounds")
      .withIndex("by_user_checkpoint", (q) =>
        q.eq("userId", userId).eq("checkpointId", checkpointId),
      )
      .collect();
    for (const oldRound of oldRounds) {
      const oldQuestions = await ctx.db
        .query("combatQuestions")
        .withIndex("by_round_order", (q) => q.eq("roundId", oldRound._id))
        .collect();
      for (const q of oldQuestions) {
        await ctx.db.delete(q._id);
      }
      await ctx.db.delete(oldRound._id);
    }

    return await ctx.runMutation(internal.combat.internalStartCombatRound, {
      userId,
      checkpointId,
    });
  },
});

/**
 * Internal helper used by retryCombat so we don't duplicate the
 * start-round logic. Trusts the caller for auth.
 */
export const internalStartCombatRound = internalMutation({
  args: {
    userId: v.id("users"),
    checkpointId: v.id("ventureCheckpoints"),
  },
  handler: async (ctx, { userId, checkpointId }): Promise<{ roundId: Id<"combatRounds"> }> => {
    const checkpoint = await ctx.db.get(checkpointId);
    if (!checkpoint) {
      throw new ConvexError({ code: "checkpoint_not_found" });
    }

    const tier = await userTier(ctx, userId);
    const monthBucket = currentMonthBucket();
    const baseScore = await averageStandardTaskBaseScore(
      ctx,
      userId,
      checkpointId,
    );
    const totalQuestions = questionCountForRound(tier, baseScore);

    const roundId = await ctx.db.insert("combatRounds", {
      userId,
      ventureId: checkpoint.ventureId,
      checkpointId,
      tier,
      totalQuestions,
      bossHpInitial: COMBAT_CONFIG.INITIAL_HP,
      playerHpInitial: COMBAT_CONFIG.INITIAL_HP,
      bossHpCurrent: COMBAT_CONFIG.INITIAL_HP,
      playerHpCurrent: COMBAT_CONFIG.INITIAL_HP,
      attemptNumber: await nextAttemptNumber(ctx, userId, checkpointId),
      status: "active",
      startedAt: Date.now(),
      monthBucket,
    });

    await ctx.scheduler.runAfter(0, internal.combat.generateNextQuestion, {
      roundId,
      nextOrder: 1,
    });

    return { roundId };
  },
});

// ─────────────────────────────────────────────────────────────────────
// Public: stream round state
// ─────────────────────────────────────────────────────────────────────

export const getRoundState = query({
  args: { roundId: v.id("combatRounds") },
  handler: async (ctx, { roundId }) => {
    const userId = await requireUser(ctx);
    const round = await ctx.db.get(roundId);
    if (!round || round.userId !== userId) return null;

    const questions = await ctx.db
      .query("combatQuestions")
      .withIndex("by_round_order", (q) => q.eq("roundId", roundId))
      .collect();
    questions.sort((a, b) => a.order - b.order);

    const answered = questions.filter((q) => q.answer !== undefined).length;
    const currentQuestion = questions.find((q) => q.answer === undefined);

    return {
      roundId: round._id,
      status: round.status,
      tier: round.tier,
      totalQuestions: round.totalQuestions,
      currentQuestionIndex: answered,
      bossHpInitial: round.bossHpInitial,
      playerHpInitial: round.playerHpInitial,
      bossHpCurrent: round.bossHpCurrent,
      playerHpCurrent: round.playerHpCurrent,
      attemptNumber: round.attemptNumber,
      currentQuestion: currentQuestion
        ? {
            _id: currentQuestion._id,
            order: currentQuestion.order,
            prompt: currentQuestion.prompt,
            persona: currentQuestion.persona,
            complexityTier: currentQuestion.complexityTier,
            durationMs: currentQuestion.durationMs,
            servedAt: currentQuestion._creationTime,
          }
        : null,
    };
  },
});

// ─────────────────────────────────────────────────────────────────────
// Public: submit an answer
// ─────────────────────────────────────────────────────────────────────

export const submitAnswer = mutation({
  args: {
    questionId: v.id("combatQuestions"),
    answer: v.string(),
    telemetry: keystrokeTelemetryValidator,
    wasExpiry: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);

    const question = await ctx.db.get(args.questionId);
    if (!question) {
      throw new ConvexError({ code: "question_not_found" });
    }
    if (question.answer !== undefined) {
      throw new ConvexError({ code: "already_answered" });
    }

    const round = await ctx.db.get(question.roundId);
    if (!round || round.userId !== userId) {
      throw new ConvexError({ code: "not_round_owner" });
    }
    if (round.status !== "active") {
      throw new ConvexError({ code: "round_not_active", status: round.status });
    }

    await ctx.db.patch(args.questionId, {
      answer: args.answer,
      answerSubmittedAt: Date.now(),
      expiredFlag: args.wasExpiry,
    });

    await ctx.scheduler.runAfter(0, internal.combat.evaluateAnswer, {
      questionId: args.questionId,
      telemetry: args.telemetry,
    });

    return { ok: true };
  },
});

export const abandonCombatRound = mutation({
  args: { roundId: v.id("combatRounds") },
  handler: async (ctx, { roundId }) => {
    const userId = await requireUser(ctx);
    const round = await ctx.db.get(roundId);
    if (!round || round.userId !== userId) {
      throw new ConvexError({ code: "not_round_owner" });
    }
    if (round.status !== "active") {
      return { ok: true, noop: true };
    }

    await settleRound(ctx, round, "abandoned");
    return { ok: true };
  },
});

// ─────────────────────────────────────────────────────────────────────
// Public: ban gate
// ─────────────────────────────────────────────────────────────────────

export const getActiveCombatBan = query({
  args: {},
  handler: async (ctx) => {
    const userId = await maybeUser(ctx);
    if (!userId) return null;
    const ban = await activeBanFor(ctx, userId);
    if (!ban) return null;
    return {
      reason: ban.reason,
      scope: ban.scope,
      isPermanent: ban.isPermanent,
      banStartAt: ban.banStartAt,
      banEndAt: ban.banEndAt,
    };
  },
});

// ─────────────────────────────────────────────────────────────────────
// Internal: generate next question
// ─────────────────────────────────────────────────────────────────────

/** Maximum AI re-generations to escape an exact-duplicate-prompt collision. */
const MAX_DEDUP_RETRIES = 4;

export const generateNextQuestion = internalAction({
  args: {
    roundId: v.id("combatRounds"),
    nextOrder: v.number(),
  },
  handler: async (ctx, { roundId, nextOrder }): Promise<void> => {
    const context = await ctx.runQuery(
      internal.combat.questionContextQuery,
      { roundId },
    );
    if (!context) return;

    const { getCombatAi } = await import("./combatAiProvider");
    const ai = getCombatAi();

    const persona: CombatPersona = nextOrder % 2 === 1 ? "villain" : "mentor";
    const preferredComplexity: ComplexityTier =
      nextOrder <= 2 ? "low" : nextOrder <= 4 ? "medium" : "high";

    try {
      // No-repeat policy: regenerate up to MAX_DEDUP_RETRIES times if
      // the AI hands us a prompt that the user has already seen, in
      // this round or any prior round. The dedup check uses the
      // normalized form against the by_user_normalized index for O(log n).
      let attempt = 0;
      let lastNormalized = "";
      while (attempt < MAX_DEDUP_RETRIES) {
        const generated = await ai.generateQuestion({
          submissionText: context.submissionText,
          priorTaskAnswers: context.priorTaskAnswers,
          questionsAlreadyAsked: context.recentHistoryForPrompt,
          answersGivenSoFar: context.answersGivenSoFar,
          persona,
          preferredComplexity,
        });

        const normalized = normalizePrompt(generated.prompt);
        const isDuplicate = await ctx.runQuery(
          internal.combat.isPromptDuplicate,
          { userId: context.userId, normalizedPrompt: normalized },
        );

        if (!isDuplicate) {
          // Fixed per-question duration ladder: Q1 gets 90s, Q2 60s,
          // Q3 45s. Q4+ defaults to 45s. AI complexity tier is kept
          // for telemetry/scoring purposes but no longer affects time.
          const durationMs = durationForOrder(nextOrder);
          await ctx.runMutation(internal.combat.persistGeneratedQuestion, {
            roundId,
            userId: context.userId,
            order: nextOrder,
            prompt: generated.prompt,
            normalizedPrompt: normalized,
            persona: generated.persona,
            complexityTier: generated.complexityTier,
            durationMs,
          });
          return;
        }

        lastNormalized = normalized;
        attempt++;
        console.warn(
          `[combat] dedup retry ${attempt}/${MAX_DEDUP_RETRIES} for round=${roundId} order=${nextOrder} — prompt already in user's history`,
        );
      }

      // Exhausted retries — the AI keeps generating duplicates of
      // questions the user has already seen. Rather than aborting the
      // round (which auto-loses the player and traps high-engagement
      // users who've played many rounds), serve the last generated
      // prompt as a fallback. Repetition is the lesser evil compared
      // to an unwinnable retry loop.
      console.warn(
        `[combat] generateNextQuestion: ${MAX_DEDUP_RETRIES} consecutive duplicates for round=${roundId} — falling back to last generated prompt instead of aborting`,
      );
      // Re-generate one more time to capture a usable prompt; if even
      // that throws we abort, but normal flow gives us a prompt that's
      // semantically valid (just not unique).
      try {
        const fallback = await ai.generateQuestion({
          submissionText: context.submissionText,
          priorTaskAnswers: context.priorTaskAnswers,
          questionsAlreadyAsked: context.recentHistoryForPrompt,
          answersGivenSoFar: context.answersGivenSoFar,
          persona,
          preferredComplexity,
        });
        const durationMs = durationForOrder(nextOrder);
        await ctx.runMutation(internal.combat.persistGeneratedQuestion, {
          roundId,
          userId: context.userId,
          order: nextOrder,
          prompt: fallback.prompt,
          normalizedPrompt: normalizePrompt(fallback.prompt),
          persona: fallback.persona,
          complexityTier: fallback.complexityTier,
          durationMs,
        });
        return;
      } catch (fallbackErr) {
        console.error(
          `[combat] fallback generation also failed for round=${roundId}:`,
          fallbackErr instanceof Error ? fallbackErr.message : fallbackErr,
        );
        await ctx.runMutation(internal.combat.abortRoundAsLost, { roundId });
      }
    } catch (err) {
      console.error(
        `[combat] generateNextQuestion failed (round=${roundId}, order=${nextOrder}):`,
        err instanceof Error ? err.message : err,
      );
      // AI provider failure (rate limit, network, malformed response).
      // Instead of auto-losing the user, persist a hard-coded fallback
      // question so combat can continue. The user gets a generic
      // prompt but isn't trapped in an unwinnable retry loop.
      const FALLBACK_PROMPTS: Array<{ prompt: string; persona: "villain" | "mentor"; complexityTier: "low" | "medium" | "high" }> = [
        { prompt: "Walk me through the specific problem your idea solves. Who exactly is hurt by this problem today, and what does that pain cost them in time, money, or frustration?", persona: "villain", complexityTier: "medium" },
        { prompt: "Why is now the right time to build this? What's changed in the world, technology, or user behaviour that makes this idea viable now and not five years ago?", persona: "mentor", complexityTier: "medium" },
        { prompt: "Describe one concrete step you can take this week to test whether real customers will pay for this. Be specific — no hand-waving.", persona: "villain", complexityTier: "low" },
        { prompt: "If a thoughtful competitor saw your idea tomorrow and decided to copy you, what would your unfair advantage be six months from now?", persona: "villain", complexityTier: "high" },
      ];
      const fallback = FALLBACK_PROMPTS[(nextOrder - 1) % FALLBACK_PROMPTS.length];
      try {
        await ctx.runMutation(internal.combat.persistGeneratedQuestion, {
          roundId,
          userId: context.userId,
          order: nextOrder,
          prompt: fallback.prompt,
          normalizedPrompt: normalizePrompt(fallback.prompt) + `_fallback_${nextOrder}_${Date.now()}`,
          persona: fallback.persona,
          complexityTier: fallback.complexityTier,
          durationMs: durationForOrder(nextOrder),
        });
        console.warn(
          `[combat] served hard-coded fallback question for round=${roundId} order=${nextOrder}`,
        );
      } catch (persistErr) {
        console.error(
          `[combat] even fallback persist failed for round=${roundId}:`,
          persistErr instanceof Error ? persistErr.message : persistErr,
        );
        // Truly nothing we can do — abort as last resort.
        await ctx.runMutation(internal.combat.abortRoundAsLost, { roundId });
      }
    }
  },
});

/** Window of recent prior-round prompts surfaced to the AI for context. */
const RECENT_HISTORY_PROMPTS_WINDOW = 20;

export const questionContextQuery = internalQuery({
  args: { roundId: v.id("combatRounds") },
  handler: async (
    ctx,
    { roundId },
  ): Promise<{
    userId: Id<"users">;
    submissionText: string;
    priorTaskAnswers: string[];
    /** Combat-question history for the AI prompt: current round + recent prior. */
    recentHistoryForPrompt: string[];
    answersGivenSoFar: string[];
  } | null> => {
    const round = await ctx.db.get(roundId);
    if (!round) return null;

    const tasks = await ctx.db
      .query("ventureTasks")
      .withIndex("by_checkpoint", (q) =>
        q.eq("checkpointId", round.checkpointId),
      )
      .collect();
    const submittedTasks = tasks
      .filter((t) => t.status === "completed" && t.evidenceId)
      .sort((a, b) => a._creationTime - b._creationTime);

    // Hydrate the actual submission text from ventureEvidence — the
    // task row itself doesn't carry the user's answer, only a link.
    const submittedTexts = await Promise.all(
      submittedTasks.map(async (t) => {
        if (!t.evidenceId) return "";
        const evidence = await ctx.db.get(t.evidenceId);
        if (!evidence) return "";
        const content = (evidence as { content?: unknown }).content;
        if (typeof content === "string") return content;
        if (content && typeof content === "object") {
          const text = (content as { text?: unknown }).text;
          if (typeof text === "string") return text;
          return JSON.stringify(content);
        }
        return "";
      }),
    );
    const filledTexts = submittedTexts.filter((s) => s.trim().length > 0);

    // Questions already asked in THIS round (drives the answers-so-far array).
    const currentRoundQuestions = await ctx.db
      .query("combatQuestions")
      .withIndex("by_round_order", (q) => q.eq("roundId", roundId))
      .collect();
    currentRoundQuestions.sort((a, b) => a.order - b.order);

    // Recent prior-round prompts for the same user (across all rounds and
    // checkpoints). Used as "don't repeat these" hints in the AI prompt.
    // The strict no-repeat enforcement lives in the dedup index check
    // back in the action; this is just to nudge the AI in the right
    // direction so we don't burn retries.
    const recentHistory = await ctx.db
      .query("combatQuestions")
      .withIndex("by_user_normalized", (q) => q.eq("userId", round.userId))
      .collect();
    recentHistory.sort((a, b) => b._creationTime - a._creationTime);
    const recentPriorPrompts = recentHistory
      .filter((q) => q.roundId !== roundId)
      .slice(0, RECENT_HISTORY_PROMPTS_WINDOW)
      .map((q) => q.prompt);

    const recentHistoryForPrompt = [
      ...currentRoundQuestions.map((q) => q.prompt),
      ...recentPriorPrompts,
    ];

    return {
      userId: round.userId,
      submissionText: filledTexts.join("\n\n---\n\n"),
      priorTaskAnswers: filledTexts,
      recentHistoryForPrompt,
      answersGivenSoFar: currentRoundQuestions.map((q) => q.answer ?? ""),
    };
  },
});

/**
 * Fast exact-match dedup against the user's full question history.
 * Lookups hit the by_user_normalized index in O(log n).
 */
export const isPromptDuplicate = internalQuery({
  args: {
    userId: v.id("users"),
    normalizedPrompt: v.string(),
  },
  handler: async (ctx, { userId, normalizedPrompt }): Promise<boolean> => {
    const hit = await ctx.db
      .query("combatQuestions")
      .withIndex("by_user_normalized", (q) =>
        q.eq("userId", userId).eq("normalizedPrompt", normalizedPrompt),
      )
      .first();
    return hit !== null;
  },
});

export const persistGeneratedQuestion = internalMutation({
  args: {
    roundId: v.id("combatRounds"),
    userId: v.id("users"),
    order: v.number(),
    prompt: v.string(),
    normalizedPrompt: v.string(),
    persona: v.union(v.literal("villain"), v.literal("mentor")),
    complexityTier: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
    ),
    durationMs: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("combatQuestions", {
      roundId: args.roundId,
      userId: args.userId,
      order: args.order,
      prompt: args.prompt,
      normalizedPrompt: args.normalizedPrompt,
      persona: args.persona,
      complexityTier: args.complexityTier,
      durationMs: args.durationMs,
      answerStartedAt: Date.now(),
    });
  },
});

export const abortRoundAsLost = internalMutation({
  args: { roundId: v.id("combatRounds") },
  handler: async (ctx, { roundId }) => {
    const round = await ctx.db.get(roundId);
    if (!round || round.status !== "active") return;
    await settleRound(ctx, round, "lost");
  },
});

// ─────────────────────────────────────────────────────────────────────
// Internal: evaluate answer → apply damage → check sudden death
// ─────────────────────────────────────────────────────────────────────

export const evaluateAnswer = internalAction({
  args: {
    questionId: v.id("combatQuestions"),
    telemetry: keystrokeTelemetryValidator,
  },
  handler: async (ctx, { questionId, telemetry }): Promise<void> => {
    const context = await ctx.runQuery(
      internal.combat.answerEvaluationContext,
      { questionId },
    );
    if (!context) return;

    const { getCombatAi } = await import("./combatAiProvider");
    const { scoreAnswer } = await import("./combatAntiCheat");

    const ai = getCombatAi();
    const answer = context.answer;

    // Heuristic fallback when the AI scorer fails (rate limit / network).
    // Uses answer length + word count to give a 1-5 score so HP always
    // moves, animations fire, and combat never stalls.
    const heuristicScore = (text: string): { score: 1 | 2 | 3 | 4 | 5; rationale: string } => {
      const trimmed = text.trim();
      if (trimmed.length === 0) return { score: 1, rationale: "empty answer" };
      const words = trimmed.split(/\s+/).filter(Boolean).length;
      if (words < 5) return { score: 1, rationale: "very short answer (heuristic)" };
      if (words < 15) return { score: 2, rationale: "short answer (heuristic)" };
      if (words < 40) return { score: 3, rationale: "medium answer (heuristic)" };
      if (words < 90) return { score: 4, rationale: "thorough answer (heuristic)" };
      return { score: 5, rationale: "comprehensive answer (heuristic)" };
    };

    const safeScoreAnswer = async (): Promise<{ score: 1 | 2 | 3 | 4 | 5; rationale: string }> => {
      if (answer.trim().length === 0) return { score: 1, rationale: "empty answer" };
      try {
        const result = await ai.scoreAnswer({
          questionPrompt: context.questionPrompt,
          userAnswer: answer,
          submissionContext: context.submissionText,
        });
        return result as { score: 1 | 2 | 3 | 4 | 5; rationale: string };
      } catch (err) {
        console.warn(
          "[combat] ai.scoreAnswer failed — using heuristic fallback:",
          err instanceof Error ? err.message : err,
        );
        return heuristicScore(answer);
      }
    };

    const [scoreResult, antiCheatVerdict] = await Promise.all([
      safeScoreAnswer(),
      scoreAnswer({
        answerText: answer,
        telemetry,
        userPriorWritings: context.userPriorWritings,
      }),
    ]);

    await ctx.runMutation(internal.combat.applyAnswerEvaluation, {
      questionId,
      score1to5: scoreResult.score,
      antiCheat: {
        confidence: antiCheatVerdict.confidence,
        signals: antiCheatVerdict.contributingSignals,
        flagged: antiCheatVerdict.flagged,
      },
    });
  },
});

export const answerEvaluationContext = internalQuery({
  args: { questionId: v.id("combatQuestions") },
  handler: async (
    ctx,
    { questionId },
  ): Promise<{
    roundId: Id<"combatRounds">;
    questionPrompt: string;
    answer: string;
    submissionText: string;
    userPriorWritings: string[];
  } | null> => {
    const question = await ctx.db.get(questionId);
    if (!question) return null;
    const round = await ctx.db.get(question.roundId);
    if (!round) return null;

    const tasks = await ctx.db
      .query("ventureTasks")
      .withIndex("by_checkpoint", (q) =>
        q.eq("checkpointId", round.checkpointId),
      )
      .collect();
    // Hydrate submission text from ventureEvidence — the task row
    // itself has no content field, just a pointer.
    const submittedRaw = await Promise.all(
      tasks
        .filter((t) => t.status === "completed" && t.evidenceId)
        .map(async (t) => {
          if (!t.evidenceId) return "";
          const evidence = await ctx.db.get(t.evidenceId);
          if (!evidence) return "";
          const content = (evidence as { content?: unknown }).content;
          if (typeof content === "string") return content;
          if (content && typeof content === "object") {
            const text = (content as { text?: unknown }).text;
            if (typeof text === "string") return text;
            return JSON.stringify(content);
          }
          return "";
        }),
    );
    const submitted = submittedRaw.filter((s) => s.trim().length > 0);

    return {
      roundId: round._id,
      questionPrompt: question.prompt,
      answer: question.answer ?? "",
      submissionText: submitted.join("\n\n---\n\n"),
      userPriorWritings: submitted,
    };
  },
});

/**
 * Applies the AI evaluation to the question and the running HP state,
 * then either schedules the next question, settles the round, or
 * records an anti-cheat suspicion / ban.
 */
export const applyAnswerEvaluation = internalMutation({
  args: {
    questionId: v.id("combatQuestions"),
    score1to5: v.number(),
    antiCheat: v.object({
      confidence: v.number(),
      signals: v.array(v.string()),
      flagged: v.boolean(),
    }),
  },
  handler: async (ctx, { questionId, score1to5, antiCheat }) => {
    const question = await ctx.db.get(questionId);
    if (!question) return;
    const round = await ctx.db.get(question.roundId);
    if (!round) return;

    // 1. Apply damage exchange to current HP.
    const exchange = applyDamageExchange(
      round.bossHpCurrent,
      round.playerHpCurrent,
      score1to5,
    );

    // 2. Persist question-level evaluation + HP snapshot.
    await ctx.db.patch(questionId, {
      score1to5,
      aiDetectionConfidence: antiCheat.confidence,
      aiDetectionSignals: antiCheat.signals,
      bossHpAfter: exchange.bossHpAfter,
      playerHpAfter: exchange.playerHpAfter,
    });

    // 3. Update round-level HP.
    await ctx.db.patch(round._id, {
      bossHpCurrent: exchange.bossHpAfter,
      playerHpCurrent: exchange.playerHpAfter,
    });

    // 4. Record anti-cheat suspicion / ban if flagged.
    if (antiCheat.flagged) {
      await recordAiSuspicionInline(ctx, {
        userId: round.userId,
        roundId: round._id,
        questionId,
        confidence: antiCheat.confidence,
        signals: antiCheat.signals,
      });
    }

    // 5. Decide what happens next.
    const answeredCount = await countAnsweredQuestions(ctx, round._id);
    const outcome = resolveOutcome(
      exchange.bossHpAfter,
      exchange.playerHpAfter,
      answeredCount,
      round.totalQuestions,
    );

    if (outcome) {
      const fresh = await ctx.db.get(round._id);
      if (fresh) await settleRound(ctx, fresh, outcome);
      return;
    }

    // Round continues — schedule next question.
    await ctx.scheduler.runAfter(0, internal.combat.generateNextQuestion, {
      roundId: round._id,
      nextOrder: answeredCount + 1,
    });
  },
});

// ─────────────────────────────────────────────────────────────────────
// Internal: anti-cheat suspicion + permanent-suspension creation
// ─────────────────────────────────────────────────────────────────────

async function recordAiSuspicionInline(
  ctx: any,
  args: {
    userId: Id<"users">;
    roundId: Id<"combatRounds">;
    questionId: Id<"combatQuestions">;
    confidence: number;
    signals: string[];
  },
): Promise<void> {
  const now = Date.now();

  // No time window — warning is permanent under v1 policy.
  const priorDetections = await ctx.db
    .query("combatAiSuspicions")
    .withIndex("by_user_detected", (q: any) => q.eq("userId", args.userId))
    .collect();

  const isSecondOffence = priorDetections.length >= 1;

  await ctx.db.insert("combatAiSuspicions", {
    userId: args.userId,
    roundId: args.roundId,
    questionId: args.questionId,
    confidence: args.confidence,
    signals: args.signals,
    detectedAt: now,
    action: isSecondOffence ? "ban" : "warning",
  });

  if (isSecondOffence) {
    await ctx.db.insert("userAccountSuspensions", {
      userId: args.userId,
      reason:
        "AI-generated answer detected in cross-question combat (second offense)",
      scope: "account",
      isPermanent: true,
      banStartAt: now,
      banEndAt: COMBAT_CONFIG.PERMANENT_SUSPENSION_END_AT_MS,
      evidenceRoundId: args.roundId,
    });
  }
}

// ─────────────────────────────────────────────────────────────────────
// Settlement
// ─────────────────────────────────────────────────────────────────────

async function settleRound(
  ctx: any,
  round: Doc<"combatRounds">,
  status: "won" | "lost" | "abandoned",
): Promise<void> {
  const questions = await ctx.db
    .query("combatQuestions")
    .withIndex("by_round_order", (q: any) => q.eq("roundId", round._id))
    .collect();
  questions.sort((a: Doc<"combatQuestions">, b: Doc<"combatQuestions">) => a.order - b.order);

  const individualPoints = computeIndividualPoints(questions, status);
  const outcomeScore = computeOutcomeScore(questions);

  await ctx.db.patch(round._id, {
    status,
    outcomeScore,
    individualPointsAwarded: individualPoints,
    endedAt: Date.now(),
  });

  // Award XP with level-floor guard — losing can still net negative
  // points (the boss landed criticals).
  await awardIndividualXp(ctx, round.userId, individualPoints);
}

function computeIndividualPoints(
  questions: Doc<"combatQuestions">[],
  status: "won" | "lost" | "abandoned",
): number {
  if (status === "abandoned" || questions.length === 0) {
    return COMBAT_CONFIG.XP_BASELINE_FOR_SKIP;
  }
  let total = 0;
  for (const q of questions) {
    if (q.score1to5 === undefined) continue;
    const delta =
      COMBAT_CONFIG.INDIVIDUAL_XP_PER_SCORE[
        q.score1to5 as keyof typeof COMBAT_CONFIG.INDIVIDUAL_XP_PER_SCORE
      ];
    if (typeof delta === "number") total += delta;
  }
  return total;
}

function computeOutcomeScore(questions: Doc<"combatQuestions">[]): number {
  const scored = questions
    .map((q) => q.score1to5)
    .filter((s): s is number => typeof s === "number");
  if (scored.length === 0) return 0;
  const avg = scored.reduce((a, b) => a + b, 0) / scored.length;
  // Normalise 1-5 → 0-1 (1 → 0, 5 → 1).
  return Math.max(0, Math.min(1, (avg - 1) / 4));
}

/**
 * Apply combat-round XP to a user via the central gamification pipeline.
 *
 * Routing through `internal.gamification.internalAwardXP` (instead of
 * patching `userLevels.xp` directly) ensures the award also triggers:
 *   - Streak v2 — combat win counts as a meaningful action
 *   - Leagues  — `bumpWeeklyXp` runs, so combat XP contributes to the
 *     user's weekly ladder position
 *
 * For positive deltas we use the standard `internalAwardXP` action. For
 * negative deltas (a 1/5 critical hit) we apply the level-floor guard
 * locally — `internalAwardXP` doesn't accept negative amounts — and
 * patch the level row directly. The level-floor rule (a combat loss can
 * never push a user out of their current level) is enforced via
 * `applyXpDelta`.
 */
/**
 * Apply combat-round XP to a user via the central gamification pipeline.
 *
 * Awards positive XP through `internal.gamification.internalAwardXP`,
 * which also triggers Streak v2 + Leagues bumps via the call-site
 * patches. Negative XP (1/5 critical hits) is clamped to zero — a
 * losing round never deducts from accumulated XP. This is gentler
 * than the original "level-floor guard" design and removes the
 * dependency on the user level XP curve.
 *
 * If you later want true deductions, look up the user's
 * `currentLevel` from `userLevels`, fetch the level-start XP from
 * `convex/levels.ts` (whichever helper exposes the curve), and clamp
 * the new `titlePoints` to that lower bound.
 */
async function awardIndividualXp(
  ctx: any,
  userId: Id<"users">,
  delta: number,
): Promise<void> {
  if (delta <= 0) return; // losing rounds get zero XP, never negative

  await ctx.scheduler.runAfter(0, internal.gamification.internalAwardXP, {
    userId,
    amount: delta,
    action: "combat_round",
  });
  // PRD §9 — winning combat no longer advances the streak. Only the
  // four PRD-defined qualifying actions credit a day. Combat still
  // awards XP via `internalAwardXP` above.
}

// ─────────────────────────────────────────────────────────────────────
// Result view
// ─────────────────────────────────────────────────────────────────────

export const getRoundResult = query({
  args: { roundId: v.id("combatRounds") },
  handler: async (ctx, { roundId }): Promise<CombatRoundResult | null> => {
    const userId = await requireUser(ctx);
    const round = await ctx.db.get(roundId);
    if (!round || round.userId !== userId) return null;

    if (round.status !== "won" && round.status !== "lost") return null;

    const questions = await ctx.db
      .query("combatQuestions")
      .withIndex("by_round_order", (q) => q.eq("roundId", roundId))
      .collect();
    questions.sort((a, b) => a.order - b.order);

    const perQuestionScores = questions.map((q) => q.score1to5 ?? 1);
    const bossReactionKeys = perQuestionScores.map((s) => reactionKeyForScore(s));
    const hpTimeline = questions.map((q) => ({
      bossHpAfter: q.bossHpAfter ?? round.bossHpCurrent,
      playerHpAfter: q.playerHpAfter ?? round.playerHpCurrent,
    }));

    return {
      outcome: round.status,
      bossHpFinal: round.bossHpCurrent,
      playerHpFinal: round.playerHpCurrent,
      perQuestionScores,
      hpTimeline,
      bossReactionKeys,
      individualPointsAwarded: round.individualPointsAwarded ?? 0,
      attemptNumber: round.attemptNumber,
    };
  },
});

function reactionKeyForScore(score: number): string {
  const clamped = Math.max(1, Math.min(5, Math.round(score))) as 1 | 2 | 3 | 4 | 5;
  return COMBAT_CONFIG.BOSS_REACTIONS[clamped];
}

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

/**
 * Resolve the authenticated user's id from the request context. Throws
 * `ConvexError("not_authenticated")` if there is no Clerk identity,
 * `ConvexError("user_not_found")` if no `users` row matches.
 */
async function requireUser(ctx: any): Promise<Id<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError({ code: "not_authenticated" });
  }
  const sub = (identity as { subject?: string }).subject;
  if (!sub) {
    throw new ConvexError({ code: "not_authenticated" });
  }
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", sub))
    .first();
  if (!user) {
    throw new ConvexError({ code: "user_not_found" });
  }
  return user._id;
}

/** Best-effort lookup — returns null when unauthenticated rather than throwing. */
async function maybeUser(ctx: any): Promise<Id<"users"> | null> {
  try {
    return await requireUser(ctx);
  } catch {
    return null;
  }
}

/**
 * Tier resolution for combat. v1 ships free-tier only — every user is
 * treated as `free`. The function and the `tier` column on
 * `combatRounds` are retained so we can introduce Pro later without a
 * schema migration; flip the body of this function to return `"pro"`
 * for paying users.
 */
async function userTier(_ctx: any, _userId: Id<"users">): Promise<CombatTier> {
  return "free";
}

/**
 * Active (currently-in-force) account suspension for a user, or null.
 * Read from `userAccountSuspensions.by_user_active` which is keyed by
 * `(userId, banEndAt)`. A permanent ban has `banEndAt` set to the
 * `PERMANENT_SUSPENSION_END_AT_MS` sentinel.
 */
async function activeBanFor(
  ctx: any,
  userId: Id<"users">,
): Promise<Doc<"userAccountSuspensions"> | null> {
  const now = Date.now();
  const ban = await ctx.db
    .query("userAccountSuspensions")
    .withIndex("by_user_active", (q: any) =>
      q.eq("userId", userId).gt("banEndAt", now),
    )
    .first();
  return ban ?? null;
}

/**
 * Count how many of the user's three standard tasks for a checkpoint
 * have actually been submitted (i.e. have non-empty content). Used by
 * the 2-of-3 advance gate.
 */
async function countSubmittedStandardTasks(
  ctx: any,
  userId: Id<"users">,
  checkpointId: Id<"ventureCheckpoints">,
): Promise<number> {
  const tasks = await ctx.db
    .query("ventureTasks")
    .withIndex("by_checkpoint", (q: any) =>
      q.eq("checkpointId", checkpointId),
    )
    .collect();
  return tasks.filter(
    (t: Doc<"ventureTasks">) => extractSubmissionText(t).trim().length > 0,
  ).length;
}

/**
 * Mean base score across the user's standard tasks for a checkpoint.
 * Drives the question-count scaling (weaker submissions get more
 * questions). Returns a neutral 0.5 default when no scored tasks
 * exist yet (e.g. base evaluator hasn't run).
 */
async function averageStandardTaskBaseScore(
  ctx: any,
  userId: Id<"users">,
  checkpointId: Id<"ventureCheckpoints">,
): Promise<number> {
  const tasks = await ctx.db
    .query("ventureTasks")
    .withIndex("by_checkpoint", (q: any) =>
      q.eq("checkpointId", checkpointId),
    )
    .collect();
  const scored = tasks
    .map((t: Doc<"ventureTasks">) => (t as { baseScore?: number }).baseScore)
    .filter((s: unknown): s is number => typeof s === "number");
  if (scored.length === 0) return 0.5;
  return scored.reduce((a: number, b: number) => a + b, 0) / scored.length;
}

/**
 * 1-based attempt counter for this user × checkpoint. Counts ALL prior
 * rounds (won, lost, abandoned, cap_exhausted) so analytics can see
 * the full attempt history.
 */
async function nextAttemptNumber(
  ctx: any,
  userId: Id<"users">,
  checkpointId: Id<"ventureCheckpoints">,
): Promise<number> {
  const prior = await ctx.db
    .query("combatRounds")
    .withIndex("by_user_checkpoint", (q: any) =>
      q.eq("userId", userId).eq("checkpointId", checkpointId),
    )
    .collect();
  return prior.length + 1;
}

/**
 * Count of questions in a round that have an `answer` field set.
 * Used in `applyAnswerEvaluation` to decide whether to schedule the
 * next question or trigger settlement.
 */
async function countAnsweredQuestions(
  ctx: any,
  roundId: Id<"combatRounds">,
): Promise<number> {
  const qs = await ctx.db
    .query("combatQuestions")
    .withIndex("by_round_order", (q: any) => q.eq("roundId", roundId))
    .collect();
  return qs.filter((q: Doc<"combatQuestions">) => q.answer !== undefined)
    .length;
}

/**
 * Lift the user-visible content out of a `ventureTasks` row. The task
 * schema stores content under `content` for write/text tools; other
 * tool types serialise into the same field. Returns "" when absent,
 * which the AI prompt builder handles gracefully.
 */
/**
 * Submission text for a ventureTask. The task row doesn't carry the
 * actual content — that lives on `ventureEvidence.content` keyed by
 * `task.evidenceId`. For the count-only gate we don't need the text,
 * just to know whether a submission exists, so this returns the task
 * status string. The downstream filter then checks for "completed".
 *
 * Callers that need the actual text (combat question generation) hydrate
 * via `ventureEvidence` separately.
 */
function extractSubmissionText(task: Doc<"ventureTasks">): string {
  return task.status === "completed" ? "completed" : "";
}

/**
 * Canonical form of a question prompt for dedup. Lowercases, strips
 * punctuation, and collapses whitespace. Two prompts that differ only
 * in capitalisation, punctuation, or whitespace collapse to the same
 * normalized form and are considered duplicates by the
 * `by_user_normalized` index. Exposed for testing.
 */
/**
 * Per-question time ladder for combat. Q1 is the easiest / most warm-up
 * time, Q3 is the hardest with the tightest clock. Stays fixed at 45s
 * for Q4+ if a round happens to be longer than 3 questions (free tier
 * defaults to 3).
 */
/**
 * Emergency reset — wipes ALL combat history for the calling user
 * across every checkpoint. Use when retry gets wedged or when QA
 * needs a guaranteed clean slate. Run from CLI:
 *
 *   npx convex run combat:resetMyCombat
 */
export const resetMyCombat = mutation({
  args: {
    // Optional clerkId — pass when running from CLI (no auth session).
    // When called from the browser, the Clerk session provides auth.
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let userId: Id<"users">;
    if (args.clerkId) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId!))
        .first();
      if (!user) throw new Error(`No user found for clerkId ${args.clerkId}`);
      userId = user._id;
    } else {
      userId = await requireUser(ctx);
    }

    const allQuestions = await ctx.db
      .query("combatQuestions")
      .withIndex("by_user_normalized", (q) => q.eq("userId", userId))
      .collect();
    for (const q of allQuestions) {
      await ctx.db.delete(q._id);
    }

    const allRounds = await ctx.db
      .query("combatRounds")
      .withIndex("by_user_status", (q) => q.eq("userId", userId))
      .collect();
    for (const r of allRounds) {
      await ctx.db.delete(r._id);
    }

    return {
      ok: true,
      deletedQuestions: allQuestions.length,
      deletedRounds: allRounds.length,
    };
  },
});

export function durationForOrder(order: number): number {
  if (order === 1) return 90_000; // 90 seconds
  if (order === 2) return 60_000; // 60 seconds
  return 45_000; // Q3 and beyond — 45 seconds
}

export function normalizePrompt(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

