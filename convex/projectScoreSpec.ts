/**
 * projectScoreSpec.ts — Project Score engine (shared, pure, no deps)
 *
 * The single source of truth for the Ibhaveda Project Score system.
 * Imported by:
 *   - Convex handlers (this directory): to compute + persist deltas
 *   - Client (src/lib/scoring/projectScore.ts re-exports from here)
 *
 * Spec references:
 *   - "Ibhaveda — Project Score & Project XP" (Ibhaveda Scoring Spec.docx)
 *   - Ibhaveda_Scoring_Engine.xlsx (Constants sheet)
 *
 * Two systems live in that spec:
 *   - Project Score (this file): cumulative, never resets, denominated
 *     per-template in the template's native unit ($/JIF/p-value/fans),
 *     driven ONLY by AI quality assessment of checkpoint submissions.
 *     Contributor count NEVER affects it.
 *   - Project XP: trailing-7-day activity counter — NOT in this file.
 *
 * Core formula (spec §2):
 *   stage_progress   = (stage - 1) / (totalStages - 1)
 *   ceilingAtStage   = ceilingStage1 + stage_progress * (ceilingFinal - ceilingStage1)
 *   qualityMult      = 0.4 + 0.6 * (qualityTotal / 12)         // §2.5 floor
 *   perTaskDelta     = ceilingAtStage * TIER_WEIGHT[taskLevel] * qualityMult
 *   goldBonusDelta   = ceilingAtStage * 0.25 * qualityMult(avgOfTaskScores)
 *   cumulativeRaw   += (direction === "decrease") ? -delta : +delta
 *
 * Display: rounded per-template grid, direction-aware clamps.
 * Zero external dependencies — pure functions + constants.
 */

export type TemplateId = "venture" | "academic" | "lab" | "creative";
export type Direction = "increase" | "decrease";
export type TaskLevel = "t1" | "t2" | "t3";

// Spec §2.3 — task-tier weights (identical for XP and Score, all templates)
export const TASK_TIER_WEIGHT = {
  t1: 0.2,
  t2: 0.2,
  t3: 0.35,
  goldBonus: 0.25,
} as const;

// Spec §2.5 — quality-multiplier floor/ceiling
export const QUALITY_FLOOR = 0.4; // qualityTotal = 0
export const QUALITY_CEIL = 1.0; // qualityTotal = 12

export interface TemplateConfig {
  id: TemplateId;
  unit: string;
  startValue: number;
  goldCeilingStage1: number;
  goldCeilingFinal: number;
  direction: Direction;
  totalStages: number;
  floorValue?: number; // hard floor (Lab's 0.05 p-value)
  capValue?: number; // hard cap (Creative's ~10M, Venture's ~$100M)
  displayRounding: number;
  displayDecimals: number;
  displayLabel: string;
}

// Spec §2.7 — per-template constants (verified against xlsx Constants sheet)
export const TEMPLATE_CONFIG: Record<TemplateId, TemplateConfig> = {
  venture: {
    id: "venture",
    unit: "USD",
    startValue: 100_000,
    goldCeilingStage1: 793_000,
    goldCeilingFinal: 4_757_000,
    direction: "increase",
    totalStages: 8,
    capValue: 100_000_000,
    displayRounding: 10_000,
    displayDecimals: 0,
    displayLabel: "Valuation",
  },
  academic: {
    id: "academic",
    unit: "JIF",
    startValue: 0.1,
    goldCeilingStage1: 0.59,
    goldCeilingFinal: 3.56,
    direction: "increase",
    totalStages: 6,
    capValue: 49.9,
    displayRounding: 0.1,
    displayDecimals: 1,
    displayLabel: "JIF",
  },
  lab: {
    id: "lab",
    unit: "p",
    startValue: 1.0,
    goldCeilingStage1: 0.0108,
    goldCeilingFinal: 0.0645,
    direction: "decrease",
    totalStages: 7,
    floorValue: 0.05,
    displayRounding: 0.005,
    displayDecimals: 4,
    displayLabel: "p-value",
  },
  creative: {
    id: "creative",
    unit: "fans",
    startValue: 10_000,
    goldCeilingStage1: 126_500,
    goldCeilingFinal: 758_700,
    direction: "increase",
    totalStages: 6,
    capValue: 10_000_000,
    displayRounding: 1_000,
    displayDecimals: 0,
    displayLabel: "Reach",
  },
};

export function getTemplateConfig(id: string | null | undefined): TemplateConfig {
  const key = (id ?? "venture") as TemplateId;
  return TEMPLATE_CONFIG[key] ?? TEMPLATE_CONFIG.venture;
}

/** Weight for a single task tier (spec §2.3). */
export function tierWeight(level: TaskLevel): number {
  return TASK_TIER_WEIGHT[level];
}

/** Straight-line stage interpolation (spec §2.4). */
export function ceilingAtStage(
  cfg: TemplateConfig,
  stageNumber: number,
): number {
  const stage = Math.max(1, Math.min(cfg.totalStages, Math.round(stageNumber)));
  if (cfg.totalStages <= 1) return cfg.goldCeilingFinal;
  const progress = (stage - 1) / (cfg.totalStages - 1);
  return (
    cfg.goldCeilingStage1 +
    progress * (cfg.goldCeilingFinal - cfg.goldCeilingStage1)
  );
}

/** Quality multiplier — 0.4 floor + 0.6 * (q/12) linear (spec §2.5). */
export function qualityMultiplier(qualityTotal: number): number {
  const clamped = Math.max(0, Math.min(12, qualityTotal));
  return QUALITY_FLOOR + (QUALITY_CEIL - QUALITY_FLOOR) * (clamped / 12);
}

/**
 * Delta magnitude for a single per-task submission event.
 * Unsigned — apply the template's direction externally.
 */
export function taskSubmissionDelta(
  cfg: TemplateConfig,
  stageNumber: number,
  taskLevel: TaskLevel,
  qualityTotal: number,
): number {
  return (
    ceilingAtStage(cfg, stageNumber) *
    tierWeight(taskLevel) *
    qualityMultiplier(qualityTotal)
  );
}

/** Delta magnitude for the +25% Gold-bonus slice (spec §2.3). */
export function goldBonusDelta(
  cfg: TemplateConfig,
  stageNumber: number,
  avgQualityTotal: number,
): number {
  return (
    ceilingAtStage(cfg, stageNumber) *
    TASK_TIER_WEIGHT.goldBonus *
    qualityMultiplier(avgQualityTotal)
  );
}

/**
 * Apply a signed delta magnitude to a running cumulative, respecting
 * the template's floor/cap + direction. Returns clamped raw.
 */
export function applyDelta(
  cfg: TemplateConfig,
  currentRaw: number | null | undefined,
  deltaMagnitude: number,
): number {
  const base = typeof currentRaw === "number" ? currentRaw : cfg.startValue;
  const signed = cfg.direction === "decrease" ? -deltaMagnitude : deltaMagnitude;
  const next = base + signed;
  if (cfg.direction === "decrease") {
    return Math.max(cfg.floorValue ?? 0, Math.min(cfg.startValue, next));
  }
  return Math.max(cfg.startValue, Math.min(cfg.capValue ?? Infinity, next));
}

/**
 * Round a raw value to the template's display grid. Direction-aware
 * for Lab so we don't cross the significance floor via rounding.
 */
export function roundToDisplayGrid(cfg: TemplateConfig, raw: number): number {
  const grid = cfg.displayRounding;
  if (grid <= 0) return raw;
  const q = raw / grid;
  return Math.round(q) * grid;
}

/**
 * Format a raw project-score value for the UI (spec §2.8):
 *   venture   → "$1,250,000"     (nearest $10,000)
 *   academic  → "12.3 JIF"       (1 decimal)
 *   lab       → "p = 0.0450"     (4 decimals, floored at 0.05)
 *   creative  → "235,000 fans"   (nearest 1,000)
 */
export function formatProjectScore(
  templateId: string | null | undefined,
  rawValue: number | null | undefined,
): string {
  const cfg = getTemplateConfig(templateId);
  const raw =
    typeof rawValue === "number" && Number.isFinite(rawValue)
      ? rawValue
      : cfg.startValue;
  const shown = roundToDisplayGrid(cfg, raw);
  const decimals = cfg.displayDecimals;

  switch (cfg.id) {
    case "venture": {
      const n = Math.max(0, Math.round(shown));
      return `$${n.toLocaleString("en-US")}`;
    }
    case "academic":
      return `${shown.toFixed(decimals)} JIF`;
    case "lab": {
      const clamped = Math.max(cfg.floorValue ?? 0, shown);
      return `p = ${clamped.toFixed(decimals)}`;
    }
    case "creative": {
      const n = Math.max(0, Math.round(shown));
      return `${n.toLocaleString("en-US")} fans`;
    }
  }
}
