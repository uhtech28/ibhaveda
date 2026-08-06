/**
 * Cumulative venture score/value helpers.
 *
 * Score and valuation grow stage-by-stage as the player progresses.
 * Each stage from 1..activeStage contributes to the HUD totals.
 */

export interface StageQualityRow {
  stageNumber: number;
  totalScore: number;
  valuationScore: number;
}

export const VENTURE_VALUATION_BY_TIER = {
  low: 100_000,
  standard: 500_000,
  high: 2_000_000,
} as const;

/** Baseline quality score credited when a stage is cleared without AI scoring. */
export const STAGE_COMPLETION_SCORE_FLOOR = 5;

export type QualityTier = keyof typeof VENTURE_VALUATION_BY_TIER;

export function getQualityTierFromScore(total: number): QualityTier {
  if (total >= 9) return "high";
  if (total >= 5) return "standard";
  return "low";
}

export function deriveStageValuation(
  totalScore: number,
  storedValuation?: number,
): number {
  if (storedValuation && storedValuation > 0) return storedValuation;
  if (totalScore <= 0) return 0;
  return VENTURE_VALUATION_BY_TIER[getQualityTierFromScore(totalScore)];
}

/**
 * Sum score + valuation for every stage from 1 through activeStage.
 * Completed stages (stage < activeStage) always contribute at least the floor.
 */
export function computeCumulativeVentureScores(
  stageScores: StageQualityRow[],
  activeStage: number,
): { qualityScore: number; valuationScore: number } {
  const byStage = new Map(stageScores.map((row) => [row.stageNumber, row]));
  let qualityScore = 0;
  let valuationScore = 0;
  const maxStage = Math.max(1, activeStage);

  for (let stage = 1; stage <= maxStage; stage += 1) {
    const row = byStage.get(stage);
    const rawScore = row?.totalScore ?? 0;
    const isCompletedStage = stage < activeStage;

    const stageScore = isCompletedStage
      ? Math.max(rawScore, STAGE_COMPLETION_SCORE_FLOOR)
      : rawScore;

    qualityScore += stageScore;
    valuationScore += deriveStageValuation(stageScore, row?.valuationScore);
  }

  return {
    qualityScore: Number(qualityScore.toFixed(1)),
    valuationScore,
  };
}

/** Finalize a completed stage row so it always carries tier-based valuation. */
export function finalizeCompletedStageScores(
  totalScore: number,
  valuationScore: number,
): { totalScore: number; valuationScore: number; qualityTier: QualityTier } {
  const finalizedScore = Math.max(totalScore, STAGE_COMPLETION_SCORE_FLOOR);
  const tier = getQualityTierFromScore(finalizedScore);
  return {
    totalScore: finalizedScore,
    valuationScore: Math.max(valuationScore, VENTURE_VALUATION_BY_TIER[tier]),
    qualityTier: tier,
  };
}
