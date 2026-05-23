/**
 * templateMetrics.ts
 *
 * Phase 20 — Template Metric Queries
 *
 * Provides real-time template-specific quality metrics for the HUD.
 * Each template tracks a different metric:
 * - Venture: Valuation Score (₹)
 * - Academic: JIF Score (impact factor)
 * - Lab: p-value (statistical significance)
 * - Creative: Fan Score (audience engagement)
 */

import { v } from "convex/values";
import { query } from "./_generated/server";
import type { TemplateId } from "./templateEngine";

/**
 * Get the current template metric for a venture.
 * Returns formatted display value and quality tier.
 */
export const getTemplateMetric = query({
  args: {
    ventureId: v.id("ventures"),
  },
  handler: async (ctx, args) => {
    const venture = await ctx.db.get(args.ventureId);
    if (!venture) return null;

    const templateId: TemplateId = venture.templateId ?? "venture";

    // Get all completed checkpoints
    const checkpoints = await ctx.db
      .query("ventureCheckpoints")
      .withIndex("by_venture", (q) => q.eq("ventureId", args.ventureId))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .collect();

    // Get all completed tasks
    const allTasks = await Promise.all(
      checkpoints.map(async (cp) => {
        return await ctx.db
          .query("ventureTasks")
          .withIndex("by_checkpoint", (q) => q.eq("checkpointId", cp._id))
          .filter((q) => q.eq(q.field("status"), "completed"))
          .collect();
      }),
    );

    const completedTasks = allTasks.flat();

    // Calculate metric based on template
    switch (templateId) {
      case "venture":
        return calculateVentureMetric(
          completedTasks.length,
          checkpoints.length,
        );

      case "academic":
        return calculateAcademicMetric(
          completedTasks.length,
          checkpoints.length,
        );

      case "lab":
        return calculateLabMetric(completedTasks.length, checkpoints.length);

      case "creative":
        return calculateCreativeMetric(
          completedTasks.length,
          checkpoints.length,
        );

      default:
        return null;
    }
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// METRIC CALCULATORS
// ─────────────────────────────────────────────────────────────────────────────

function calculateVentureMetric(
  completedTasks: number,
  completedCheckpoints: number,
) {
  // Valuation Score: ₹10L per checkpoint + ₹5L per task
  const baseValue = completedCheckpoints * 10; // lakhs
  const taskBonus = completedTasks * 5; // lakhs
  const totalValue = baseValue + taskBonus;

  // Quality tier based on completion density
  const density =
    completedCheckpoints > 0 ? completedTasks / completedCheckpoints : 0;
  const qualityTier: "low" | "standard" | "high" =
    density >= 2.5 ? "high" : density >= 2.0 ? "standard" : "low";

  return {
    templateId: "venture" as TemplateId,
    label: "Valuation",
    icon: "💰",
    value: totalValue,
    displayValue: `₹${totalValue}L`,
    direction: "higher_is_better" as const,
    qualityTier,
    accentColor: "#6366f1",
  };
}

function calculateAcademicMetric(
  completedTasks: number,
  completedCheckpoints: number,
) {
  // JIF Score: 0.5 per checkpoint + 0.2 per task (max ~15 for perfect paper)
  const baseScore = completedCheckpoints * 0.5;
  const taskBonus = completedTasks * 0.2;
  const jifScore = Math.min(15, baseScore + taskBonus);

  // Quality tier based on JIF thresholds
  const qualityTier: "low" | "standard" | "high" =
    jifScore >= 8 ? "high" : jifScore >= 4 ? "standard" : "low";

  return {
    templateId: "academic" as TemplateId,
    label: "JIF Score",
    icon: "📊",
    value: jifScore,
    displayValue: jifScore.toFixed(2),
    direction: "higher_is_better" as const,
    qualityTier,
    accentColor: "#d4a853",
  };
}

function calculateLabMetric(
  completedTasks: number,
  completedCheckpoints: number,
) {
  // p-value: Starts at 0.99, decreases with task completion (LOWER IS BETTER)
  // Target: < 0.05 for statistical significance
  const totalPossibleTasks = completedCheckpoints * 3; // assume 3 tasks per checkpoint
  const completionRatio =
    totalPossibleTasks > 0 ? completedTasks / totalPossibleTasks : 0;

  // p-value decreases as you complete tasks
  const pValue = Math.max(0.001, 0.99 - completionRatio * 0.95);

  // Quality tier (INVERTED: lower is better)
  const qualityTier: "low" | "standard" | "high" =
    pValue <= 0.05 ? "high" : pValue <= 0.2 ? "standard" : "low";

  return {
    templateId: "lab" as TemplateId,
    label: "p-value",
    icon: "⚗️",
    value: pValue,
    displayValue: `p=${pValue.toFixed(3)}`,
    direction: "lower_is_better" as const,
    qualityTier,
    accentColor: "#06d6a0",
  };
}

function calculateCreativeMetric(
  completedTasks: number,
  completedCheckpoints: number,
) {
  // Fan Score: 100 per checkpoint + 50 per task
  const baseScore = completedCheckpoints * 100;
  const taskBonus = completedTasks * 50;
  const fanScore = baseScore + taskBonus;

  // Quality tier based on audience engagement
  const qualityTier: "low" | "standard" | "high" =
    fanScore >= 800 ? "high" : fanScore >= 400 ? "standard" : "low";

  return {
    templateId: "creative" as TemplateId,
    label: "Fan Score",
    icon: "🎨",
    value: fanScore,
    displayValue: fanScore.toLocaleString(),
    direction: "higher_is_better" as const,
    qualityTier,
    accentColor: "#ffd166",
  };
}
