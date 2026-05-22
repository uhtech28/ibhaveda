/**
 * brightness-calculator.ts
 *
 * Pure TypeScript utility that implements the two-layer world brightness formula
 * for the Interactive Ideas Phaser game engine integration.
 *
 * The brightness model has two independent layers that sum to a 0–100% value:
 *
 *   1. Accumulated Base  — rewards completed stages  (0–60%)
 *   2. Stage Layer       — rewards progress inside the current stage (0–40%)
 *
 * This keeps the world visibly darker at stage starts while giving continuous
 * visual feedback as the player completes tasks within each stage.
 *
 * ─── Formula ────────────────────────────────────────────────────────────────
 *
 *   PER_STAGE_BASE   = 60 / 7  ≈ 8.571 % per completed stage
 *   accumulatedBase  = min( completedStages × PER_STAGE_BASE, 60 )
 *   stageLayer       = ( tasksDoneInCurrentStage / totalTasksInCurrentStage ) × 40
 *   worldBrightness  = accumulatedBase + stageLayer     (always ≤ 100)
 *
 * ─── Worked Examples ─────────────────────────────────────────────────────────
 *
 *   Stage 1 start  : completedStages=0, tasks=0/12  →  0.00% + 0.00%  =  0.00%
 *   Entering Stage 2: completedStages=1, tasks=0/15  →  8.57% + 0.00%  =  8.57%
 *   Mid-Stage 5 (50% tasks): completedStages=4, tasks=50%  →  34.28% + 20.00% = 54.28%
 *   Final stage complete:    completedStages=7, tasks=all  →  60.00% + 40.00% = 100.00%
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Percentage of accumulated base awarded per fully completed stage. */
const PER_STAGE_BASE_PCT = 60 / 7 // ≈ 8.5714…

/** Maximum accumulated base contribution (reached after 7 completed stages). */
const MAX_BASE_PCT = 60

/** Maximum stage-layer contribution (reached when all tasks in stage are done). */
const MAX_LAYER_PCT = 40

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

/**
 * The inputs needed to compute world brightness.
 *
 * All values are derived from the venture's checkpoint data and do NOT need
 * to reflect the Phaser scene state — the scene reads the result.
 */
export interface BrightnessInput {
  /**
   * Number of stages that have been *fully* completed before the current one.
   * Range: 0–7 (there are 8 stages; the 8th fully complete puts us at 100%).
   */
  completedStages: number

  /**
   * Count of individual tasks (t1 + t2 + t3 across all checkpoints) that have
   * been finished inside the current stage.
   */
  tasksDoneInCurrentStage: number

  /**
   * Total number of individual tasks available inside the current stage.
   * Equals (checkpoints in stage) × 3.
   */
  totalTasksInCurrentStage: number
}

/**
 * The decomposed brightness result, useful for debug overlays and analytics.
 *
 * All values are expressed as **percentages** (0–100 scale, not 0–1).
 */
export interface BrightnessResult {
  /** Contribution from completed stages. Range: 0–60. */
  accumulatedBase: number

  /** Contribution from tasks completed inside the current stage. Range: 0–40. */
  stageLayer: number

  /**
   * Final world brightness percentage fed to Phaser's post-FX pipeline.
   * Range: 0–100.
   */
  worldBrightness: number
}

// ---------------------------------------------------------------------------
// Core calculation
// ---------------------------------------------------------------------------

/**
 * Compute the two-layer world brightness from raw progress inputs.
 *
 * @example
 * // Entering Stage 2 (Stage 1 fully done, no tasks started yet)
 * calculateBrightness({ completedStages: 1, tasksDoneInCurrentStage: 0, totalTasksInCurrentStage: 15 })
 * // → { accumulatedBase: 8.57, stageLayer: 0, worldBrightness: 8.57 }
 *
 * @example
 * // Mid-Stage 5, half the tasks done
 * calculateBrightness({ completedStages: 4, tasksDoneInCurrentStage: 9, totalTasksInCurrentStage: 18 })
 * // → { accumulatedBase: 34.29, stageLayer: 20, worldBrightness: 54.29 }
 */
export function calculateBrightness(input: BrightnessInput): BrightnessResult {
  const { completedStages, tasksDoneInCurrentStage, totalTasksInCurrentStage } = input

  // Layer 1 — accumulated base: each completed stage contributes ~8.57%, hard-capped at 60%
  const rawBase = completedStages * PER_STAGE_BASE_PCT
  const accumulatedBase = Math.min(rawBase, MAX_BASE_PCT)

  // Layer 2 — stage layer: linear interpolation over tasks done in the current stage
  const stageLayer =
    totalTasksInCurrentStage > 0
      ? (Math.min(tasksDoneInCurrentStage, totalTasksInCurrentStage) / totalTasksInCurrentStage) *
        MAX_LAYER_PCT
      : 0

  // Sum, never exceeding 100%
  const worldBrightness = Math.min(accumulatedBase + stageLayer, 100)

  return {
    accumulatedBase: round2(accumulatedBase),
    stageLayer: round2(stageLayer),
    worldBrightness: round2(worldBrightness),
  }
}

// ---------------------------------------------------------------------------
// Phaser post-FX mapping
// ---------------------------------------------------------------------------

/**
 * Maps a world-brightness percentage (0–100) to Phaser-compatible post-FX
 * brightness and contrast values suitable for a `Phaser.FX.ColorMatrix` or
 * `PostFXPipeline` call.
 *
 * The mapping is a **linear interpolation** between:
 *
 *   | brightness% | Phaser brightness | Phaser contrast |
 *   |-------------|-------------------|-----------------|
 *   |     0%      |       0.15        |     −0.30       |
 *   |   100%      |       1.00        |      0.10       |
 *
 * At 0% the world appears very dark (but not completely black, to keep depth
 * visible). At 100% the world is fully lit with a slight contrast boost.
 *
 * @param brightness - World brightness percentage, clamped to [0, 100].
 * @returns Object with `brightness` and `contrast` ready for Phaser's pipeline.
 *
 * @example
 * // Completely dark world
 * brightnessToPhaser(0)   // → { brightness: 0.15, contrast: -0.30 }
 *
 * @example
 * // Half-lit world
 * brightnessToPhaser(50)  // → { brightness: 0.575, contrast: -0.10 }
 *
 * @example
 * // Fully lit world
 * brightnessToPhaser(100) // → { brightness: 1.00, contrast: 0.10 }
 */
export function brightnessToPhaser(brightness: number): { brightness: number; contrast: number } {
  // Clamp input to valid range
  const t = Math.max(0, Math.min(100, brightness)) / 100

  // Linear interpolation
  // brightness: 0.15 → 1.00   (range = 0.85)
  // contrast:  -0.30 → 0.10   (range = 0.40)
  return {
    brightness: round4(0.15 + t * 0.85),
    contrast: round4(-0.3 + t * 0.4),
  }
}

// ---------------------------------------------------------------------------
// Higher-level helper — derives brightness from venture DB data
// ---------------------------------------------------------------------------

/**
 * Derive the world brightness from the raw venture checkpoint array fetched
 * from Convex, without requiring the caller to manually compute task counts.
 *
 * @param checkpoints - All checkpoints for the venture (any status). Each
 *   item must include the stage number, status string, and the three task
 *   completion flags.
 * @param currentStage - The venture's `currentStage` field (1–8).
 * @param stages - Stage definitions array, e.g. `VENTURE_STAGES` from
 *   `convex/ventureConstants`. Each entry has `{ id, checkpoints }` where
 *   `checkpoints` is the number of checkpoint slots in that stage.
 * @returns A fully computed {@link BrightnessResult}.
 *
 * @example
 * // Venture just entered Stage 3 after completing Stages 1 and 2
 * getBrightnessFromVentureData(allCheckpoints, 3, VENTURE_STAGES)
 * // → { accumulatedBase: 17.14, stageLayer: 0, worldBrightness: 17.14 }
 */
export function getBrightnessFromVentureData(
  checkpoints: Array<{
    stage: number
    status: string
    t1Completed: boolean
    t2Completed: boolean
    t3Completed: boolean
  }>,
  currentStage: number,
  stages: Array<{ id: number; checkpoints: number }>,
): BrightnessResult {
  // ── 1. Count stages fully completed before the current one ────────────────
  let completedStages = 0

  for (const stageDef of stages) {
    // Only examine stages that come before the current stage
    if (stageDef.id >= currentStage) continue

    const stageCheckpoints = checkpoints.filter((cp) => cp.stage === stageDef.id)

    // A stage is "fully complete" when every expected checkpoint has been
    // completed (or skipped — treated as complete for brightness purposes).
    const allCompleted =
      stageCheckpoints.length >= stageDef.checkpoints &&
      stageCheckpoints.every(
        (cp) => cp.status === "completed" || cp.status === "skipped" || cp.status === "gold",
      )

    if (allCompleted) completedStages++
  }

  // ── 2. Count tasks done / total in the current stage ─────────────────────
  const currentStageDef = stages.find((s) => s.id === currentStage)
  const totalTasksInCurrentStage = (currentStageDef?.checkpoints ?? 0) * 3

  const currentStageCheckpoints = checkpoints.filter((cp) => cp.stage === currentStage)

  let tasksDoneInCurrentStage = 0
  for (const cp of currentStageCheckpoints) {
    if (cp.t1Completed) tasksDoneInCurrentStage++
    if (cp.t2Completed) tasksDoneInCurrentStage++
    if (cp.t3Completed) tasksDoneInCurrentStage++
  }

  // ── 3. Delegate to core formula ───────────────────────────────────────────
  return calculateBrightness({
    completedStages,
    tasksDoneInCurrentStage,
    // Guard against a missing stage definition to avoid NaN
    totalTasksInCurrentStage: totalTasksInCurrentStage > 0 ? totalTasksInCurrentStage : 1,
  })
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/** Round to 2 decimal places (used for percentage values). */
function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/** Round to 4 decimal places (used for Phaser float values). */
function round4(n: number): number {
  return Math.round(n * 10_000) / 10_000
}
