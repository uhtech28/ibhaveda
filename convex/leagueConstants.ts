/**
 * League system — configuration constants.
 *
 * Single source of truth for the tier list, promotion / relegation
 * percentages, and the weekly reset schedule. Both the cron handler
 * and the UI read from this file so they can't drift apart.
 */

export type LeagueTierId =
  | "bronze"
  | "silver"
  | "gold"
  | "platinum"
  | "diamond";

export interface LeagueTier {
  id: LeagueTierId;
  /** Display name. */
  name: string;
  /** Hex colour for the tier badge. */
  color: string;
  /** Soft secondary tint for badge backgrounds. */
  bg: string;
  /** Numeric rank — higher = better. Used by the promotion math. */
  order: number;
}

/**
 * Ordered tier list from lowest (Bronze) to highest (Diamond). Tier
 * `order` indexes match array position + 1; do not reorder this array
 * without also bumping a schema version.
 */
export const LEAGUE_TIERS: readonly LeagueTier[] = [
  { id: "bronze", name: "Bronze", color: "#cd7f32", bg: "rgba(205,127,50,0.12)", order: 1 },
  { id: "silver", name: "Silver", color: "#c0c0c0", bg: "rgba(192,192,192,0.12)", order: 2 },
  { id: "gold", name: "Gold", color: "#ffd700", bg: "rgba(255,215,0,0.12)", order: 3 },
  { id: "platinum", name: "Platinum", color: "#e5e4e2", bg: "rgba(229,228,226,0.15)", order: 4 },
  { id: "diamond", name: "Diamond", color: "#b9f2ff", bg: "rgba(185,242,255,0.12)", order: 5 },
] as const;

/** Top fraction of each tier promotes at week's end. */
export const PROMOTION_TOP_FRACTION = 0.2;

/** Bottom fraction of each tier relegates at week's end (except Bronze). */
export const RELEGATION_BOTTOM_FRACTION = 0.2;

/** UTC day-of-week for the weekly reset (0 = Sunday). */
export const RESET_DAY_OF_WEEK_UTC = 0;

/** UTC hour for the weekly reset. */
export const RESET_HOUR_UTC = 0;

/** Minimum number of users in a tier for promotion/relegation to fire. */
export const MIN_TIER_POPULATION_FOR_PROMOTIONS = 3;

// ─────────────────────────────────────────────────────────────────────
// PRD §4 — active-tier gating
// ─────────────────────────────────────────────────────────────────────

/**
 * How many of the LEAGUE_TIERS above are actually surfaced to users.
 *
 * v1 starts at 1: the population is small, so a single weekly cohort is
 * more motivating than a sparse ladder. The remaining tiers are dormant
 * — the schema and engine support them, but they're invisible until
 * this number is raised. PRD §4.3 AC3.
 *
 * Raise this value (no schema change, no code deploy beyond the const
 * bump) and the next weekly roll will begin distributing entities into
 * the newly active tiers via promotion / relegation.
 *
 * The "highest active tier" is the tier whose `order` equals
 * `ACTIVE_LEAGUE_COUNT`. When v1 ships with this set to 1 only Bronze
 * is active — everyone competes there. Setting to 5 activates the full
 * Bronze → Diamond ladder.
 */
export const ACTIVE_LEAGUE_COUNT = 1;

/**
 * Target population per competing cohort. When a tier's population
 * exceeds `COHORT_SIZE`, additional same-tier cohorts are created. v1
 * uses a conservative value because the user base is small; bump as
 * the population grows.
 */
export const COHORT_SIZE = 30;

/**
 * Deterministic tiebreak for ranks at promotion/relegation boundaries.
 *
 * Rule (PRD §4 edge case): if two entities have identical weekly XP,
 * the one that *attained* that XP earlier wins (i.e. the row whose
 * `lastWeeklyXpAtMs` is smaller). The implementation falls back to
 * `_creationTime` if the per-row timestamp is absent.
 */
export const TIEBREAK_RULE = "weekly_xp_desc__earlier_attainment_wins" as const;

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

export function getTier(id: LeagueTierId): LeagueTier {
  const t = LEAGUE_TIERS.find((tier) => tier.id === id);
  if (!t) throw new Error(`Unknown league tier: ${id}`);
  return t;
}

/**
 * Subset of LEAGUE_TIERS that's currently surfaced per
 * `ACTIVE_LEAGUE_COUNT`. Always returns at least the first tier so the
 * UI has somewhere to render even if the value is misconfigured.
 */
export function activeTiers(): readonly LeagueTier[] {
  const n = Math.max(1, Math.min(ACTIVE_LEAGUE_COUNT, LEAGUE_TIERS.length));
  return LEAGUE_TIERS.slice(0, n);
}

/**
 * The highest tier that is active. With `ACTIVE_LEAGUE_COUNT = 1`
 * this is Bronze; with 5 it's Diamond. Used as the "squash target"
 * for entities sitting above the active range — they collapse here
 * until additional tiers go live.
 */
export function highestActiveTier(): LeagueTierId {
  const tiers = activeTiers();
  return tiers[tiers.length - 1].id;
}

/**
 * Is a given tier currently surfaced? Tiers above
 * `ACTIVE_LEAGUE_COUNT` are dormant — entities assigned to them by
 * legacy data should be squashed into the highest active tier on the
 * next roll.
 */
export function isTierActive(id: LeagueTierId): boolean {
  const t = LEAGUE_TIERS.find((tier) => tier.id === id);
  if (!t) return false;
  return t.order <= ACTIVE_LEAGUE_COUNT;
}

/**
 * True when only one tier is active. The UI uses this to hide the
 * promotion / relegation zone styling — a single tier is just "the
 * weekly cohort" with a reset timer. PRD §4.5 AC2.
 */
export function isSingleTierMode(): boolean {
  return ACTIVE_LEAGUE_COUNT <= 1;
}

/**
 * Next-higher tier, or null if `id` is already the highest. Bronze →
 * Silver → Gold → Platinum → Diamond → null.
 */
export function tierAbove(id: LeagueTierId): LeagueTierId | null {
  const i = LEAGUE_TIERS.findIndex((t) => t.id === id);
  if (i < 0 || i === LEAGUE_TIERS.length - 1) return null;
  return LEAGUE_TIERS[i + 1].id;
}

/**
 * Next-lower tier, or null if `id` is already the lowest. Diamond →
 * Platinum → Gold → Silver → Bronze → null.
 */
export function tierBelow(id: LeagueTierId): LeagueTierId | null {
  const i = LEAGUE_TIERS.findIndex((t) => t.id === id);
  if (i <= 0) return null;
  return LEAGUE_TIERS[i - 1].id;
}

/**
 * Given a list of ranked users in a tier, the cutoff indices for the
 * promotion zone (top N) and relegation zone (bottom N). Returns
 * indices into the sorted list, both end-exclusive.
 *
 *   promotionCount    — count of users that promote (top of the list)
 *   relegationStartAt — index where the relegation zone begins
 *
 * Below MIN_TIER_POPULATION_FOR_PROMOTIONS the tier doesn't promote
 * or relegate at all — small populations can't run a meaningful
 * tournament.
 */
export function computeZones(populationSize: number): {
  promotionCount: number;
  relegationStartAt: number;
} {
  if (populationSize < MIN_TIER_POPULATION_FOR_PROMOTIONS) {
    return {
      promotionCount: 0,
      relegationStartAt: populationSize,
    };
  }
  const promotionCount = Math.max(
    1,
    Math.floor(populationSize * PROMOTION_TOP_FRACTION),
  );
  const relegationCount = Math.max(
    1,
    Math.floor(populationSize * RELEGATION_BOTTOM_FRACTION),
  );
  return {
    promotionCount,
    relegationStartAt: populationSize - relegationCount,
  };
}

// ─────────────────────────────────────────────────────────────────────
// Week boundary math
// ─────────────────────────────────────────────────────────────────────

/**
 * UTC millis at the start of the current league week — the most recent
 * Sunday 00:00 UTC at or before `now`.
 */
export function weekStartUtcMs(now: number = Date.now()): number {
  const d = new Date(now);
  const dayOfWeek = d.getUTCDay(); // 0 = Sunday
  const daysSinceReset =
    (dayOfWeek - RESET_DAY_OF_WEEK_UTC + 7) % 7;
  d.setUTCHours(RESET_HOUR_UTC, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - daysSinceReset);
  return d.getTime();
}

/**
 * UTC millis at the start of the next league week — the upcoming
 * Sunday 00:00 UTC strictly after `now`.
 */
export function nextWeekStartUtcMs(now: number = Date.now()): number {
  const current = weekStartUtcMs(now);
  return current + 7 * 24 * 60 * 60 * 1000;
}
