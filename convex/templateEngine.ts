/**
 * templateEngine.ts
 *
 * Config-driven template routing layer for Convex.
 *
 * Responsibilities:
 *  1. Resolve the correct checkpoint definitions for a given template
 *  2. Create template-specific ventures (extends the existing createVenture flow)
 *  3. Query checkpoint/task data using the correct constants per template
 *  4. Calculate quality metrics in a direction-aware way
 *
 * INVARIANT: This module only ROUTES to existing engines.
 *   It does not reimplement the checkpoint, progression, boss, or XP engines.
 */

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import {
  CHECKPOINT_DEFINITIONS,
  VENTURE_STAGES,
  BOSS_DEFINITIONS,
} from "./ventureConstants";
import { ACADEMIC_CHECKPOINT_DEFINITIONS, ACADEMIC_STAGES } from "./academic/academicConstants";
import { LAB_CHECKPOINT_DEFINITIONS, LAB_STAGES } from "./lab/labConstants";
import { CREATIVE_CHECKPOINT_DEFINITIONS, CREATIVE_STAGES } from "./creative/creativeConstants";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type TemplateId = "venture" | "academic" | "lab" | "creative";

interface CheckpointDef {
  stage: number;
  checkpoint: number;
  name: string;
  outcome: string;
  t1: { prompt: string; tool: string };
  t2: { prompt: string; tool: string };
  t3: { prompt: string; tool: string };
}

interface StageDef {
  readonly id: number;
  readonly name: string;
  readonly checkpoints: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// RESOLVER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the checkpoint definitions for a template.
 * This is the single source of truth for routing template data.
 */
export function getCheckpointDefinitions(templateId: TemplateId): CheckpointDef[] {
  switch (templateId) {
    case "academic": return ACADEMIC_CHECKPOINT_DEFINITIONS as CheckpointDef[];
    case "lab":      return LAB_CHECKPOINT_DEFINITIONS as CheckpointDef[];
    case "creative": return CREATIVE_CHECKPOINT_DEFINITIONS as CheckpointDef[];
    case "venture":
    default:         return CHECKPOINT_DEFINITIONS as unknown as CheckpointDef[];
  }
}

/**
 * Returns the stage definitions for a template.
 */
export function getStageDefinitions(templateId: TemplateId): readonly StageDef[] {
  switch (templateId) {
    case "academic": return ACADEMIC_STAGES;
    case "lab":      return LAB_STAGES;
    case "creative": return CREATIVE_STAGES;
    case "venture":
    default:         return VENTURE_STAGES;
  }
}

/**
 * Resolve a single checkpoint definition.
 */
export function getCheckpointDef(
  templateId: TemplateId,
  stage: number,
  checkpoint: number,
): CheckpointDef | undefined {
  return getCheckpointDefinitions(templateId).find(
    (cp) => cp.stage === stage && cp.checkpoint === checkpoint,
  );
}

/**
 * Get total checkpoint count for a template.
 */
export function getTotalCheckpoints(templateId: TemplateId): number {
  return getStageDefinitions(templateId).reduce((sum, s) => sum + s.checkpoints, 0);
}

/**
 * Determine quality tier in a direction-aware way.
 *
 * For most templates: higher totalScore → better
 * For Lab (p-value): lower is better — the totalScore in [0–12] range
 * represents how close the p-value is to 0.05.
 */
export function resolveQualityTier(
  templateId: TemplateId,
  totalScore: number,
): "low" | "standard" | "high" {
  // All templates use the same 0–12 score internally
  // Lab's scoring dimensions are designed so higher score = more rigorous = lower p-value
  // So for Lab, a high score still maps to the "high" tier (best)
  if (totalScore >= 9) return "high";
  if (totalScore >= 5) return "standard";
  return "low";
}

/**
 * Map quality tier to the template-specific metric delta.
 * Returns how much the metric changes after a scored submission.
 */
export function getMetricDelta(
  templateId: TemplateId,
  tier: "low" | "standard" | "high",
): number {
  switch (templateId) {
    case "academic":
      return { low: 0.1, standard: 0.5, high: 1.2 }[tier];
    case "lab":
      // For p-value (lower is better): returns reduction amount
      return { low: 0.02, standard: 0.08, high: 0.15 }[tier];
    case "creative":
      return { low: 10, standard: 100, high: 500 }[tier];
    case "venture":
    default:
      return { low: 100_000, standard: 500_000, high: 2_000_000 }[tier];
  }
}

/**
 * Apply a metric delta to the current metric value.
 * For lower_is_better templates, subtracts; for others, adds.
 */
export function applyMetricDelta(
  templateId: TemplateId,
  currentValue: number,
  delta: number,
): number {
  if (templateId === "lab") {
    // p-value decreases toward significance
    return Math.max(0.001, currentValue - delta);
  }
  return currentValue + delta;
}

/**
 * Get the starting metric value for a template.
 */
export function getStartingMetricValue(templateId: TemplateId): number {
  switch (templateId) {
    case "lab":      return 0.9;  // p-value starts high
    case "academic": return 0;
    case "creative": return 0;
    case "venture":
    default:         return 0;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CONVEX QUERIES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get checkpoint definitions for a specific template, stage, and checkpoint.
 * Used by the HUD and task panel to show checkpoint context.
 */
export const getTemplateCheckpoint = query({
  args: {
    templateId: v.union(
      v.literal("venture"),
      v.literal("academic"),
      v.literal("lab"),
      v.literal("creative"),
    ),
    stage: v.number(),
    checkpoint: v.number(),
  },
  handler: async (_ctx, args) => {
    const def = getCheckpointDef(
      args.templateId as TemplateId,
      args.stage,
      args.checkpoint,
    );
    return def ?? null;
  },
});

/**
 * Get all stage definitions for a template.
 * Used by the world map scene to render stage labels and biome segments.
 */
export const getTemplateStages = query({
  args: {
    templateId: v.union(
      v.literal("venture"),
      v.literal("academic"),
      v.literal("lab"),
      v.literal("creative"),
    ),
  },
  handler: async (_ctx, args) => {
    return getStageDefinitions(args.templateId as TemplateId);
  },
});

/**
 * Get the metric state for a venture, formatted for the HUD.
 */
export const getVentureMetricState = query({
  args: {
    ventureId: v.id("ventures"),
  },
  handler: async (ctx, args) => {
    const venture = await ctx.db.get(args.ventureId);
    if (!venture) return null;

    const templateId = (venture.templateId ?? "venture") as TemplateId;
    const stages = getStageDefinitions(templateId);
    const totalCheckpoints = stages.reduce((sum, s) => sum + s.checkpoints, 0);

    // Get quality scores to derive metric value
    const qualityScores = await ctx.db
      .query("qualityScores")
      .withIndex("by_venture", (q) => q.eq("ventureId", args.ventureId))
      .collect();

    // Sum up metric deltas based on quality tiers
    let metricValue = getStartingMetricValue(templateId);
    for (const score of qualityScores) {
      const tier = resolveQualityTier(templateId, score.totalScore);
      const delta = getMetricDelta(templateId, tier);
      metricValue = applyMetricDelta(templateId, metricValue, delta);
    }

    const overallTier = resolveQualityTier(
      templateId,
      qualityScores.length > 0
        ? qualityScores.reduce((sum, s) => sum + s.totalScore, 0) / qualityScores.length
        : 0,
    );

    return {
      templateId,
      metricValue,
      qualityTier: overallTier,
      totalCheckpoints,
      completedStages: qualityScores.length,
      isLowerBetter: templateId === "lab",
    };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// MUTATIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new venture with a specific template.
 * Extends the existing venture creation flow with templateId.
 *
 * IMPORTANT: Does NOT replace ventures.ts createVenture.
 * This is a supplemental mutation for template-specific creation.
 */
export const createTemplatedVenture = mutation({
  args: {
    ideaId: v.id("ideas"),
    userId: v.id("users"),
    templateId: v.union(
      v.literal("venture"),
      v.literal("academic"),
      v.literal("lab"),
      v.literal("creative"),
    ),
    personaGender: v.optional(v.union(v.literal("male"), v.literal("female"))),
    skills: v.optional(v.array(v.string())),
    industries: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const templateId = args.templateId as TemplateId;

    // Assign bosses — all templates share the same 12 boss pool
    // Assign 3 random bosses from the pool
    const allBossIds = BOSS_DEFINITIONS.map((b) => b.id);
    const shuffled = allBossIds.sort(() => Math.random() - 0.5);
    const assignedBosses = shuffled.slice(0, 3);

    const ventureId = await ctx.db.insert("ventures", {
      ideaId: args.ideaId,
      userId: args.userId,
      templateId: templateId, // NEW FIELD
      currentStage: 1,
      currentCheckpoint: 1,
      corruptionLevel: 0,
      lastActivityAt: now,
      status: "active",
      assignedBosses,
      skills: args.skills,
      industries: args.industries,
      personaGender: args.personaGender,
      createdAt: now,
      updatedAt: now,
    });

    // Seed initial quality score with starting metric value
    await ctx.db.insert("qualityScores", {
      ventureId,
      stageNumber: 1,
      completeness: 0,
      specificity: 0,
      evidence: 0,
      originality: 0,
      totalScore: 0,
      qualityTier: "low",
      valuationScore: getStartingMetricValue(templateId),
      evaluatedAt: now,
    });

    return ventureId;
  },
});

/**
 * Seed all checkpoints for a new templated venture.
 * Called after createTemplatedVenture to initialize the checkpoint rows.
 */
export const seedTemplateCheckpoints = mutation({
  args: {
    ventureId: v.id("ventures"),
    templateId: v.union(
      v.literal("venture"),
      v.literal("academic"),
      v.literal("lab"),
      v.literal("creative"),
    ),
  },
  handler: async (ctx, args) => {
    const stages = getStageDefinitions(args.templateId as TemplateId);
    const checkpointIds: string[] = [];

    for (const stage of stages) {
      for (let cp = 1; cp <= stage.checkpoints; cp++) {
        const checkpointId = await ctx.db.insert("ventureCheckpoints", {
          ventureId: args.ventureId,
          stage: stage.id,
          checkpoint: cp,
          status: stage.id === 1 && cp === 1 ? "in_progress" : "not_started",
          t1Completed: false,
          t2Completed: false,
          t3Completed: false,
          goldBonusEarned: false,
        });
        checkpointIds.push(checkpointId);
      }
    }

    return { seeded: checkpointIds.length };
  },
});
