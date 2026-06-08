/**
 * AI Cross-Question Combat — configuration constants.
 *
 * Single source of truth for combat tunables: caps, timing bands,
 * scoring tables, anti-cheat thresholds, and animation key mappings.
 *
 * Coordinate changes here with:
 *   convex/combat.ts                          (server enforcement)
 *   convex/combatAntiCheat.ts                 (signal weights)
 *   src/components/combat/                    (UI ring duration, animation triggers)
 *   src/lib/phaser/entities/MiniBoss.ts       (animation key matching)
 */

export type CombatTier = "free" | "pro";
export type ComplexityTier = "low" | "medium" | "high";

export const COMBAT_CONFIG = {
  /**
   * Question-count band by user tier. The exact count within the band
   * scales with submission weakness — weaker base scores yield more
   * questions, up to the tier ceiling. See `questionCountForRound`.
   *
   * v1 ships free-tier only. The `pro` band is retained so the future
   * introduction of paid tiers needs no schema or constants migration —
   * flip the body of `userTier()` in combat.ts and Pro becomes live.
   */
  QUESTIONS_PER_ROUND: {
    free: { min: 2, max: 4 },
    pro: { min: 5, max: 8 },
  } as const,

  /**
   * Master switch for the monthly cap enforcement. v1 ships with the
   * cap DISABLED — final tier limits are still TBD. When false, the
   * server skips the cap check entirely; the `monthBucket` column on
   * `combatRounds` is still populated so the data is available for
   * analytics and so re-enabling later is a one-line flip.
   */
  MONTHLY_CAP_ENABLED: false,

  /**
   * Per-month combat-round cap by tier. Values are placeholders kept
   * here so the eventual tier-limit decision is a single edit. They
   * are read only when `MONTHLY_CAP_ENABLED` is true.
   *
   * Independent of the base-evaluator budget — base scoring still runs
   * on every submission even when the combat cap is exhausted.
   */
  MONTHLY_CAP_BY_TIER: {
    free: 10,
    pro: Number.POSITIVE_INFINITY,
  } as const,

  /**
   * Lower bound for the final project-of-record score after combat.
   * A combat round can only hold or raise the score relative to base.
   */
  SCORE_FLOOR: 0.4,

  /**
   * Starting HP for both the player and the mini-boss at round start.
   * Tuned so 2 perfect answers (5/5 each) can defeat the boss and 3
   * critical hits (1/5 each) defeat the player — the "2-4 questions,
   * maybe 2" feel.
   */
  INITIAL_HP: 10,

  /**
   * Damage exchange table per 1-5 answer score.
   *
   *   1 → critical hit on player (4 dmg), not lethal in one shot.
   *       Two criticals leave the player at 2 HP (panic zone).
   *       Three criticals end the round in a sudden-death loss.
   *   2 → glancing blow both ways (2 to player, 1 to boss).
   *   3 → exchange blocked — no HP change either side.
   *   4 → solid hit on the boss (3 dmg).
   *   5 → critical hit on the boss (5 dmg). Two of these finish the
   *       boss for a 2-question win.
   *
   * Numbers are tuned together; do not change one without checking
   * the others against the test cases in combat-scoring.test.ts.
   */
  DAMAGE_BY_SCORE: {
    1: { toPlayer: 4, toBoss: 0 },
    2: { toPlayer: 2, toBoss: 1 },
    3: { toPlayer: 0, toBoss: 0 },
    4: { toPlayer: 0, toBoss: 3 },
    5: { toPlayer: 0, toBoss: 5 },
  } as const,

  /**
   * Status filed onto combatRounds at round-end. `won` means the boss
   * HP reached 0 first; `lost` means the player HP reached 0 first OR
   * the question budget ran out with the boss still alive.
   *
   * Constants are exported so client and tests can reference them
   * without stringly-typed comparisons.
   */
  STATUS: {
    ACTIVE: "active",
    WON: "won",
    LOST: "lost",
    ABANDONED: "abandoned",
    CAP_EXHAUSTED: "cap_exhausted",
  } as const,

  /**
   * Per-question duration bands in milliseconds. The AI returns a
   * complexity tier alongside each question; the client maps tier →
   * `default` duration, clamped to `[floor, ceiling]`.
   */
  DURATION_BANDS_MS: {
    low: { floor: 30_000, ceiling: 60_000, default: 45_000 },
    medium: { floor: 60_000, ceiling: 120_000, default: 90_000 },
    high: { floor: 120_000, ceiling: 240_000, default: 180_000 },
  } as const,

  /**
   * Boss reaction animation key for each 1-5 answer score. These keys
   * must match the animation registrations in `MiniBoss.ts`.
   */
  BOSS_REACTIONS: {
    1: "player_defeated",
    2: "player_solid_hit",
    3: "attack_blocked",
    4: "minor_damage",
    5: "major_damage",
  } as const,

  /**
   * Individual XP delta per question score (1-5). Negative values are
   * deductions and are applied after the level-floor guard — see
   * `applyXpDelta` for the clamping rule (a user can lose XP within
   * their current level but never drop below the level threshold).
   */
  INDIVIDUAL_XP_PER_SCORE: {
    1: -4,
    2: 3,
    3: 8,
    4: 18,
    5: 30,
  } as const,

  /** XP awarded when the user skips or abandons the combat round. */
  XP_BASELINE_FOR_SKIP: 2,

  /**
   * Composite anti-cheat score above which an answer is flagged as
   * AI-generated. Tuned conservatively — we'd rather miss some real
   * cheats than ban innocent users on a false positive.
   */
  AI_DETECTION_THRESHOLD: 0.85,

  /**
   * Anti-cheat enforcement policy.
   *
   * First detected offense → permanent warning on the user's record.
   *   The warning never expires; it stays on file for the lifetime
   *   of the account.
   *
   * Second (or later) detected offense → permanent account suspension.
   *   No time window. If the user receives a warning today and trips
   *   the detector again three years later, the second event still
   *   escalates to a permanent suspension.
   *
   * This policy is intentionally strict — combat is a low-traffic
   * feature, the threshold is already conservative (0.85), and an
   * appeal route exists out-of-band for false positives.
   */
  AI_BAN_IS_PERMANENT: true,

  /**
   * Sentinel timestamp used as `banEndAt` for permanent suspensions.
   * Far enough in the future that "active until this date" reads as
   * "active forever" to every consumer. UTC year 9999, Jan 1.
   */
  PERMANENT_SUSPENSION_END_AT_MS: Date.UTC(9999, 0, 1),

  /**
   * Weights for the composite anti-cheat score. Must sum to 1.0;
   * verified at module load via `assertSignalWeightsSumToOne`.
   */
  AI_SIGNAL_WEIGHTS: {
    pasteRatio: 0.25,
    keystrokeVariance: 0.15,
    perplexityCheck: 0.3,
    burstinessScore: 0.1,
    vocabularyFingerprint: 0.1,
    styleDelta: 0.1,
  } as const,
} as const;

/**
 * Choose how many questions a round should have for a given user
 * tier and base score. Weakness (1 - baseScore) scales linearly
 * across the tier's [min, max] band.
 */
export function questionCountForRound(
  tier: CombatTier,
  baseScore: number,
): number {
  const band = COMBAT_CONFIG.QUESTIONS_PER_ROUND[tier];
  const weakness = 1 - clamp01(baseScore);
  const span = band.max - band.min;
  return band.min + Math.round(span * weakness);
}

/**
 * Map an AI-emitted complexity tier to a question duration in ms.
 * If the AI omits a tier, falls back to the medium default so the
 * timer always has a valid value (per PRD 3.7.2).
 */
export function durationForComplexity(
  tier: ComplexityTier | undefined,
): number {
  const band = COMBAT_CONFIG.DURATION_BANDS_MS[tier ?? "medium"];
  return band.default;
}

/**
 * Clamp a candidate duration to its tier's floor/ceiling. Used when
 * the AI suggests an explicit duration override; we still respect
 * the configured band bounds.
 */
export function clampDuration(
  tier: ComplexityTier,
  candidateMs: number,
): number {
  const band = COMBAT_CONFIG.DURATION_BANDS_MS[tier];
  return Math.min(band.ceiling, Math.max(band.floor, candidateMs));
}

/**
 * UTC year-month bucket, e.g. "2026-06". Used to scope the free-tier
 * monthly cap so it resets cleanly at month boundaries regardless of
 * the user's local timezone.
 */
export function currentMonthBucket(now: number = Date.now()): string {
  const d = new Date(now);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Apply an XP delta with the level-floor guard. A negative delta can
 * reduce the user's XP within their current level but never below
 * the level's minimum XP threshold (per requirement: a user on level 6
 * cannot drop to level 5 via combat losses).
 *
 * @param currentXp        User's XP before the delta is applied.
 * @param levelMinXp       XP required to enter the user's current level
 *                         (the level's lower threshold).
 * @param delta            Signed XP change (positive or negative).
 * @returns                The new XP value, clamped at `levelMinXp` on
 *                         the downside, unbounded on the upside.
 */
export function applyXpDelta(
  currentXp: number,
  levelMinXp: number,
  delta: number,
): number {
  if (delta >= 0) return currentXp + delta;
  const proposed = currentXp + delta;
  return Math.max(levelMinXp, proposed);
}

/**
 * Apply a 1-5 answer score to the boss and player HP state. Pure —
 * returns the new HP pair and the per-question outcome that the UI
 * uses to drive the boss reaction animation.
 *
 * HP is clamped at 0 on the downside (no negative HP).
 */
export interface HpExchangeResult {
  bossHpAfter: number;
  playerHpAfter: number;
  damageDealt: number;
  damageTaken: number;
}

export function applyDamageExchange(
  bossHpBefore: number,
  playerHpBefore: number,
  score1to5: number,
): HpExchangeResult {
  const clampedScore = clampScoreKey(score1to5);
  const dmg = COMBAT_CONFIG.DAMAGE_BY_SCORE[clampedScore];
  return {
    bossHpAfter: Math.max(0, bossHpBefore - dmg.toBoss),
    playerHpAfter: Math.max(0, playerHpBefore - dmg.toPlayer),
    damageDealt: dmg.toBoss,
    damageTaken: dmg.toPlayer,
  };
}

/**
 * Resolve the current HP state into a round outcome, or null if the
 * round should continue. Boss-HP-0 takes precedence over player-HP-0
 * for ties — landing the killing blow wins even if you go down with
 * the boss in the same exchange.
 */
export function resolveOutcome(
  bossHp: number,
  playerHp: number,
  questionsAnswered: number,
  totalQuestions: number,
): "won" | "lost" | null {
  if (bossHp <= 0) return "won";
  if (playerHp <= 0) return "lost";
  if (questionsAnswered >= totalQuestions) return "lost";
  return null;
}

/** Narrow a free-form number to a known 1-5 key. */
function clampScoreKey(n: number): 1 | 2 | 3 | 4 | 5 {
  const r = Math.max(1, Math.min(5, Math.round(n))) as 1 | 2 | 3 | 4 | 5;
  return r;
}

/** Clamp a value to the inclusive range [0, 1]. */
function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

/**
 * Validate that the anti-cheat signal weights sum to 1.0 (within a
 * tiny epsilon for float arithmetic). Throws at module load if a
 * future edit accidentally breaks the invariant.
 */
function assertSignalWeightsSumToOne(): void {
  const weights = Object.values(COMBAT_CONFIG.AI_SIGNAL_WEIGHTS);
  const sum = weights.reduce((acc, w) => acc + w, 0);
  const epsilon = 1e-6;
  if (Math.abs(sum - 1) > epsilon) {
    throw new Error(
      `COMBAT_CONFIG.AI_SIGNAL_WEIGHTS must sum to 1.0; got ${sum}`,
    );
  }
}

assertSignalWeightsSumToOne();
