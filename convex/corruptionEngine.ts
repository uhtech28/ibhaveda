/**
 * corruptionEngine.ts
 *
 * Full corruption engine for the Interactive Ideas platform.
 *
 * Implements the PRD corruption mechanics:
 *   - +5% per day of inactivity
 *   - +10% per stalled checkpoint (no task submitted in 3+ days)
 *   - Visual thresholds: calm → creeping → desaturated → urgent → critical
 *   - Boss emergence at 80%+
 *   - Audio corruption layering
 *   - Corruption shield mechanic
 *
 * Works for ALL templates (Venture, Academic, Lab, Creative).
 * The corruption level (0–100) is template-agnostic.
 */

import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

/** Per-day inactivity corruption increase */
const INACTIVITY_CORRUPTION_PER_DAY = 5;

/** Per-stalled-checkpoint corruption (no task in 3+ days) */
const STALL_CORRUPTION_PER_CHECKPOINT = 10;

/** Number of days without task submission = "stalled" */
const STALL_THRESHOLD_DAYS = 3;

/** Boss emergence threshold */
const BOSS_EMERGENCE_THRESHOLD = 80;

/** Maximum corruption level */
const MAX_CORRUPTION = 100;

/** Corruption phase thresholds */
export const CORRUPTION_THRESHOLDS = {
  calm: 0,       // 0–20
  creeping: 21,  // 21–40
  desaturated: 41, // 41–60
  urgent: 61,    // 61–80
  critical: 81,  // 81–100
} as const;

export type CorruptionPhase = "calm" | "creeping" | "desaturated" | "urgent" | "critical";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export function getCorruptionPhase(level: number): CorruptionPhase {
  if (level >= 81) return "critical";
  if (level >= 61) return "urgent";
  if (level >= 41) return "desaturated";
  if (level >= 21) return "creeping";
  return "calm";
}

export function getCorruptionOverlayOpacity(level: number): number {
  // Smooth opacity curve: 0 at level 0, 0.8 at level 100
  return Math.min(0.8, (level / 100) * 0.8);
}

export function getCorruptionDesaturation(level: number): number {
  // CSS filter grayscale: 0% at 0, 100% at 100
  return Math.min(100, level);
}

export function isBossEmerging(level: number): boolean {
  return level >= BOSS_EMERGENCE_THRESHOLD;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONVEX QUERIES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get the current corruption state for a venture.
 * Returns the full corruption breakdown for the HUD and Phaser scene.
 */
export const getCorruptionState = query({
  args: { ventureId: v.id("ventures") },
  handler: async (ctx, args) => {
    const venture = await ctx.db.get(args.ventureId);
    if (!venture) return null;

    const corruptionLevel = venture.corruptionLevel ?? 0;
    const lastActivityAt = venture.lastActivityAt ?? Date.now();
    const daysSinceActivity = Math.floor((Date.now() - lastActivityAt) / (1000 * 60 * 60 * 24));

    // Count stalled checkpoints (in_progress, no completion in 3+ days)
    const inProgressCheckpoints = await ctx.db
      .query("ventureCheckpoints")
      .withIndex("by_venture_status", (q) =>
        q.eq("ventureId", args.ventureId).eq("status", "in_progress"),
      )
      .collect();

    let stalledCount = 0;
    for (const cp of inProgressCheckpoints) {
      if (cp.partialStartedAt) {
        const daysSinceStart = (Date.now() - cp.partialStartedAt) / (1000 * 60 * 60 * 24);
        if (daysSinceStart >= STALL_THRESHOLD_DAYS) stalledCount++;
      }
    }

    const phase = getCorruptionPhase(corruptionLevel);
    const bossEmerging = isBossEmerging(corruptionLevel);

    return {
      level: corruptionLevel,
      phase,
      daysSinceActivity,
      stalledCheckpoints: stalledCount,
      bossEmerging,
      overlayOpacity: getCorruptionOverlayOpacity(corruptionLevel),
      desaturation: getCorruptionDesaturation(corruptionLevel),
      // Visual properties for Phaser scene
      visualEffects: {
        showCracks: corruptionLevel >= 40,
        showShadows: corruptionLevel >= 60,
        showFlicker: corruptionLevel >= 70,
        showBossGlow: corruptionLevel >= 80,
      },
    };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// CONVEX MUTATIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Record activity on a venture — resets inactivity timer.
 * Call this whenever a task is submitted or a checkpoint is visited.
 */
export const recordVentureActivity = mutation({
  args: { ventureId: v.id("ventures") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.ventureId, {
      lastActivityAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

/**
 * Apply inactivity corruption penalty.
 * Called by the daily cron job or when the venture is loaded.
 *
 * Applies +5% per day inactive since last activity.
 * Applies +10% per stalled checkpoint (in_progress, 3+ days).
 */
export const applyInactivityCorruption = mutation({
  args: {
    ventureId: v.id("ventures"),
    corruptionShields: v.optional(v.number()), // shields reduce next gain by 50%
  },
  handler: async (ctx, args) => {
    const venture = await ctx.db.get(args.ventureId);
    if (!venture || venture.status !== "active") return null;

    const corruptionLevel = venture.corruptionLevel ?? 0;
    const lastActivityAt = venture.lastActivityAt ?? Date.now();
    const daysSinceActivity = Math.floor(
      (Date.now() - lastActivityAt) / (1000 * 60 * 60 * 24),
    );

    if (daysSinceActivity < 1) {
      // No inactivity penalty if active within 24h
      return { corruptionLevel, delta: 0, reason: "active_within_24h" };
    }

    // Calculate inactivity penalty
    let delta = daysSinceActivity * INACTIVITY_CORRUPTION_PER_DAY;

    // Count stalled checkpoints
    const stalledCheckpoints = await ctx.db
      .query("ventureCheckpoints")
      .withIndex("by_venture_status", (q) =>
        q.eq("ventureId", args.ventureId).eq("status", "in_progress"),
      )
      .collect();

    let stalledCount = 0;
    for (const cp of stalledCheckpoints) {
      if (cp.partialStartedAt) {
        const daysSince = (Date.now() - cp.partialStartedAt) / (1000 * 60 * 60 * 24);
        if (daysSince >= STALL_THRESHOLD_DAYS) {
          stalledCount++;
          delta += STALL_CORRUPTION_PER_CHECKPOINT;
        }
      }
    }

    // Apply corruption shields (each shield reduces gain by 50%)
    const shields = Math.min(args.corruptionShields ?? 0, 2);
    const shieldReduction = shields * 0.5;
    delta = Math.round(delta * (1 - shieldReduction));

    const newLevel = Math.min(MAX_CORRUPTION, corruptionLevel + delta);

    await ctx.db.patch(args.ventureId, {
      corruptionLevel: newLevel,
      updatedAt: Date.now(),
    });

    const phase = getCorruptionPhase(newLevel);
    const bossNowEmerging = !isBossEmerging(corruptionLevel) && isBossEmerging(newLevel);

    return {
      corruptionLevel: newLevel,
      previousLevel: corruptionLevel,
      delta,
      daysSinceActivity,
      stalledCheckpoints: stalledCount,
      phase,
      bossNowEmerging,
      reason: "inactivity",
    };
  },
});

/**
 * Reduce corruption when a checkpoint is completed.
 * Gold checkpoints reduce more.
 */
export const reduceCorruptionOnCheckpoint = mutation({
  args: {
    ventureId: v.id("ventures"),
    isGold: v.boolean(),
    insightFragments: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const venture = await ctx.db.get(args.ventureId);
    if (!venture) return null;

    const currentLevel = venture.corruptionLevel ?? 0;
    if (currentLevel === 0) return { corruptionLevel: 0, delta: 0 };

    // Checkpoint completion: -5% standard, -12% gold
    let reduction = args.isGold ? 12 : 5;

    // Insight fragments bonus: each fragment reduces by 2% extra
    const fragments = Math.min(args.insightFragments ?? 0, 5);
    reduction += fragments * 2;

    const newLevel = Math.max(0, currentLevel - reduction);

    await ctx.db.patch(args.ventureId, {
      corruptionLevel: newLevel,
      lastActivityAt: Date.now(),
      updatedAt: Date.now(),
    });

    return {
      corruptionLevel: newLevel,
      previousLevel: currentLevel,
      delta: -reduction,
      phase: getCorruptionPhase(newLevel),
    };
  },
});

/**
 * Cron-callable internal mutation — apply inactivity corruption to all active ventures.
 * Called by convex/crons.ts on a daily schedule.
 */
export const applyDailyCorruptionToAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    const activeVentures = await ctx.db
      .query("ventures")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    let processed = 0;
    let bossEmergences = 0;

    for (const venture of activeVentures) {
      const corruptionLevel = venture.corruptionLevel ?? 0;
      const lastActivityAt = venture.lastActivityAt ?? Date.now();
      const daysSinceActivity = Math.floor(
        (Date.now() - lastActivityAt) / (1000 * 60 * 60 * 24),
      );

      if (daysSinceActivity >= 1) {
        const delta = daysSinceActivity * INACTIVITY_CORRUPTION_PER_DAY;
        const newLevel = Math.min(MAX_CORRUPTION, corruptionLevel + delta);

        await ctx.db.patch(venture._id, {
          corruptionLevel: newLevel,
          updatedAt: Date.now(),
        });

        if (!isBossEmerging(corruptionLevel) && isBossEmerging(newLevel)) {
          bossEmergences++;
        }

        processed++;
      }
    }

    console.info(`[CorruptionEngine] Daily cron: processed=${processed}, boss emergences=${bossEmergences}`);
    return { processed, bossEmergences };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// CORRUPTION VISUAL THEME DATA (for Phaser/CSS)
// ─────────────────────────────────────────────────────────────────────────────

export const CORRUPTION_VISUAL_PROFILES: Record<CorruptionPhase, {
  overlayColor: string;
  particleColor: number;
  vignetteIntensity: number;
  screenShake: boolean;
  ambientFilter: string;
}> = {
  calm: {
    overlayColor: "transparent",
    particleColor: 0x000000,
    vignetteIntensity: 0,
    screenShake: false,
    ambientFilter: "none",
  },
  creeping: {
    overlayColor: "rgba(20, 0, 40, 0.15)",
    particleColor: 0x4f0080,
    vignetteIntensity: 0.2,
    screenShake: false,
    ambientFilter: "saturate(0.85)",
  },
  desaturated: {
    overlayColor: "rgba(20, 0, 40, 0.3)",
    particleColor: 0x3b0060,
    vignetteIntensity: 0.4,
    screenShake: false,
    ambientFilter: "saturate(0.5) brightness(0.9)",
  },
  urgent: {
    overlayColor: "rgba(80, 0, 0, 0.35)",
    particleColor: 0x800000,
    vignetteIntensity: 0.6,
    screenShake: true,
    ambientFilter: "saturate(0.3) brightness(0.8) sepia(0.3)",
  },
  critical: {
    overlayColor: "rgba(120, 0, 0, 0.5)",
    particleColor: 0xff0000,
    vignetteIntensity: 0.8,
    screenShake: true,
    ambientFilter: "saturate(0) brightness(0.6) sepia(0.5) contrast(1.2)",
  },
};
