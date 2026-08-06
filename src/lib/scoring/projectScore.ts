/**
 * Client-side re-export of the Project Score spec engine.
 *
 * The single source of truth lives in `convex/projectScoreSpec.ts` so
 * server handlers and the UI can never drift on constants, formulas,
 * or display rounding. Keep this file thin — only re-exports.
 *
 * See `convex/projectScoreSpec.ts` for the full spec commentary.
 */

export {
  TEMPLATE_CONFIG,
  TASK_TIER_WEIGHT,
  QUALITY_FLOOR,
  QUALITY_CEIL,
  getTemplateConfig,
  tierWeight,
  ceilingAtStage,
  qualityMultiplier,
  taskSubmissionDelta,
  goldBonusDelta,
  applyDelta,
  roundToDisplayGrid,
  formatProjectScore,
} from "@convex/projectScoreSpec";

export type {
  TemplateId,
  Direction,
  TaskLevel,
  TemplateConfig,
} from "@convex/projectScoreSpec";
