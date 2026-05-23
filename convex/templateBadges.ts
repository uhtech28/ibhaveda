/**
 * templateBadges.ts
 *
 * Phase 15 — Template-Specific Badge Definitions
 *
 * Extends the existing badge system with template-specific achievement badges.
 * These badges are awarded for milestones specific to Academic, Lab, and Creative
 * template progressions, without modifying the existing ventureBadges table structure.
 *
 * Badge ID ranges:
 *   1–99   — Venture template (existing, unchanged)
 *   100–149 — Academic template badges
 *   150–199 — Lab template badges
 *   200–249 — Creative template badges
 *   250+    — Cross-template (earned across multiple templates)
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

// ─────────────────────────────────────────────────────────────────────────────
// BADGE DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

export type TemplateBadgeId = number;

export interface TemplateBadgeDef {
  id: TemplateBadgeId;
  name: string;
  description: string;
  icon: string;           // Emoji icon
  templateId: "academic" | "lab" | "creative" | "all";
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  condition: {
    type: "checkpoint_count" | "gold_count" | "quality_tier" | "stage_complete" | "corruption_survive" | "metric_threshold" | "boss_defeat";
    threshold: number;
    extra?: string;       // e.g. quality tier name, specific stage number
  };
}

export const ACADEMIC_BADGES: TemplateBadgeDef[] = [
  {
    id: 100,
    name: "First Citation",
    description: "Submit your first academic task with at least one cited source.",
    icon: "📖",
    templateId: "academic",
    rarity: "common",
    condition: { type: "checkpoint_count", threshold: 1 },
  },
  {
    id: 101,
    name: "Literature Surveyor",
    description: "Complete Stage 1 of the Academic journey — Literature Review.",
    icon: "🗺️",
    templateId: "academic",
    rarity: "common",
    condition: { type: "stage_complete", threshold: 1 },
  },
  {
    id: 102,
    name: "Protocol Established",
    description: "Complete Stage 2 — your Research Design is locked and documented.",
    icon: "📋",
    templateId: "academic",
    rarity: "common",
    condition: { type: "stage_complete", threshold: 2 },
  },
  {
    id: 103,
    name: "Data Alchemist",
    description: "Complete Stage 3 — Data Collection in the Monastery Scriptorium.",
    icon: "⚗️",
    templateId: "academic",
    rarity: "uncommon",
    condition: { type: "stage_complete", threshold: 3 },
  },
  {
    id: 104,
    name: "Rigorous Mind",
    description: "Achieve 10 Gold checkpoint completions in any Academic venture.",
    icon: "🏛️",
    templateId: "academic",
    rarity: "uncommon",
    condition: { type: "gold_count", threshold: 10 },
  },
  {
    id: 105,
    name: "Grand Archivist",
    description: "Complete all 6 stages of an Academic venture.",
    icon: "📜",
    templateId: "academic",
    rarity: "rare",
    condition: { type: "stage_complete", threshold: 6 },
  },
  {
    id: 106,
    name: "High Impact Scholar",
    description: "Achieve a JIF Score above 8.0 in an Academic venture.",
    icon: "⭐",
    templateId: "academic",
    rarity: "rare",
    condition: { type: "metric_threshold", threshold: 8.0 },
  },
  {
    id: 107,
    name: "Gatekeeper Slayer",
    description: "Defeat the Gatekeeper of Unearned Entry (Boss 9).",
    icon: "🔓",
    templateId: "academic",
    rarity: "epic",
    condition: { type: "boss_defeat", threshold: 9 },
  },
  {
    id: 108,
    name: "Nature Index",
    description: "Achieve a JIF Score above 15.0 — top-tier journal territory.",
    icon: "🌿",
    templateId: "academic",
    rarity: "legendary",
    condition: { type: "metric_threshold", threshold: 15.0 },
  },
  {
    id: 109,
    name: "Corruption Survivor: Academic",
    description: "Survive 80%+ corruption in an Academic venture and still complete a checkpoint.",
    icon: "☠️",
    templateId: "academic",
    rarity: "epic",
    condition: { type: "corruption_survive", threshold: 80 },
  },
];

export const LAB_BADGES: TemplateBadgeDef[] = [
  {
    id: 150,
    name: "Hypothesis Formed",
    description: "Submit your first Lab task with a clearly stated hypothesis.",
    icon: "🔬",
    templateId: "lab",
    rarity: "common",
    condition: { type: "checkpoint_count", threshold: 1 },
  },
  {
    id: 151,
    name: "Protocol Ready",
    description: "Complete Stage 2 — your Lab Protocol is documented and reproducible.",
    icon: "📊",
    templateId: "lab",
    rarity: "common",
    condition: { type: "stage_complete", threshold: 2 },
  },
  {
    id: 152,
    name: "Data Collected",
    description: "Complete Stage 3 — Experimentation complete in the Field Station.",
    icon: "🌡️",
    templateId: "lab",
    rarity: "common",
    condition: { type: "stage_complete", threshold: 3 },
  },
  {
    id: 153,
    name: "Statistically Significant",
    description: "Achieve a p-value below 0.05 in a Lab venture.",
    icon: "📉",
    templateId: "lab",
    rarity: "uncommon",
    condition: { type: "metric_threshold", threshold: 0.05 },
  },
  {
    id: 154,
    name: "Reproducibility Champion",
    description: "Achieve 10 Gold checkpoint completions in any Lab venture.",
    icon: "🔄",
    templateId: "lab",
    rarity: "uncommon",
    condition: { type: "gold_count", threshold: 10 },
  },
  {
    id: 155,
    name: "Alchemist Defeated",
    description: "Defeat the Alchemist of Wishful Results (Boss 10).",
    icon: "🧪",
    templateId: "lab",
    rarity: "epic",
    condition: { type: "boss_defeat", threshold: 10 },
  },
  {
    id: 156,
    name: "Grand Replicator",
    description: "Complete all 7 stages of a Lab venture including the Replication stage.",
    icon: "🔭",
    templateId: "lab",
    rarity: "rare",
    condition: { type: "stage_complete", threshold: 7 },
  },
  {
    id: 157,
    name: "p < 0.001",
    description: "Achieve a p-value below 0.001 — highly significant result.",
    icon: "💎",
    templateId: "lab",
    rarity: "legendary",
    condition: { type: "metric_threshold", threshold: 0.001 },
  },
  {
    id: 158,
    name: "Corruption Survivor: Lab",
    description: "Survive 80%+ corruption in a Lab venture and still complete a checkpoint.",
    icon: "☠️",
    templateId: "lab",
    rarity: "epic",
    condition: { type: "corruption_survive", threshold: 80 },
  },
];

export const CREATIVE_BADGES: TemplateBadgeDef[] = [
  {
    id: 200,
    name: "First Spark",
    description: "Submit your first Creative task — the blank page is defeated.",
    icon: "✨",
    templateId: "creative",
    rarity: "common",
    condition: { type: "checkpoint_count", threshold: 1 },
  },
  {
    id: 201,
    name: "Silence Broken",
    description: "Defeat the Silence That Smothers (Boss 11) and complete Stage 1.",
    icon: "🎵",
    templateId: "creative",
    rarity: "uncommon",
    condition: { type: "boss_defeat", threshold: 11 },
  },
  {
    id: 202,
    name: "Craft in Progress",
    description: "Complete Stage 3 — Craft & Iteration in the Artisan Market.",
    icon: "🖌️",
    templateId: "creative",
    rarity: "common",
    condition: { type: "stage_complete", threshold: 3 },
  },
  {
    id: 203,
    name: "Released!",
    description: "Complete Stage 4 — your creative work is out in the world.",
    icon: "🚀",
    templateId: "creative",
    rarity: "uncommon",
    condition: { type: "stage_complete", threshold: 4 },
  },
  {
    id: 204,
    name: "Fan Favourite",
    description: "Achieve a Fan Score above 10,000.",
    icon: "🌟",
    templateId: "creative",
    rarity: "rare",
    condition: { type: "metric_threshold", threshold: 10000 },
  },
  {
    id: 205,
    name: "Gold Craftsmanship",
    description: "Achieve 10 Gold checkpoint completions in any Creative venture.",
    icon: "🏆",
    templateId: "creative",
    rarity: "uncommon",
    condition: { type: "gold_count", threshold: 10 },
  },
  {
    id: 206,
    name: "Legacy Maker",
    description: "Complete all 6 stages of a Creative venture — your legacy is sealed.",
    icon: "👑",
    templateId: "creative",
    rarity: "rare",
    condition: { type: "stage_complete", threshold: 6 },
  },
  {
    id: 207,
    name: "Harbourmaster Vanquished",
    description: "Defeat the Harbourmaster of Hesitation (Boss 12) and ship your work.",
    icon: "⚓",
    templateId: "creative",
    rarity: "epic",
    condition: { type: "boss_defeat", threshold: 12 },
  },
  {
    id: 208,
    name: "Viral",
    description: "Achieve a Fan Score above 100,000 — viral creative reach.",
    icon: "💫",
    templateId: "creative",
    rarity: "legendary",
    condition: { type: "metric_threshold", threshold: 100000 },
  },
  {
    id: 209,
    name: "Corruption Survivor: Creative",
    description: "Survive 80%+ corruption in a Creative venture and still complete a checkpoint.",
    icon: "☠️",
    templateId: "creative",
    rarity: "epic",
    condition: { type: "corruption_survive", threshold: 80 },
  },
];

export const CROSS_TEMPLATE_BADGES: TemplateBadgeDef[] = [
  {
    id: 250,
    name: "Polymath",
    description: "Complete at least one venture in Academic, Lab, and Creative templates.",
    icon: "🧩",
    templateId: "all",
    rarity: "legendary",
    condition: { type: "stage_complete", threshold: 6 }, // All three complete
  },
  {
    id: 251,
    name: "Template Explorer",
    description: "Start a venture in all four templates.",
    icon: "🗺️",
    templateId: "all",
    rarity: "rare",
    condition: { type: "checkpoint_count", threshold: 1 },
  },
  {
    id: 252,
    name: "Boss Slayer",
    description: "Defeat at least one boss in each of the four templates.",
    icon: "⚔️",
    templateId: "all",
    rarity: "epic",
    condition: { type: "boss_defeat", threshold: 1 },
  },
];

/** Full registry of all template-specific badges */
export const ALL_TEMPLATE_BADGES: TemplateBadgeDef[] = [
  ...ACADEMIC_BADGES,
  ...LAB_BADGES,
  ...CREATIVE_BADGES,
  ...CROSS_TEMPLATE_BADGES,
];

/** Look up a badge definition by ID */
export function getTemplateBadgeDef(id: number): TemplateBadgeDef | undefined {
  return ALL_TEMPLATE_BADGES.find((b) => b.id === id);
}

/** Get all badges for a specific template */
export function getBadgesForTemplate(
  templateId: "academic" | "lab" | "creative" | "all",
): TemplateBadgeDef[] {
  return ALL_TEMPLATE_BADGES.filter(
    (b) => b.templateId === templateId || b.templateId === "all",
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONVEX MUTATIONS — Template Badge Awarding
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Evaluate and award all eligible template badges for a user after a
 * checkpoint completion event. Called from the task submission flow.
 */
export const evaluateTemplateBadges = mutation({
  args: {
    userId: v.id("users"),
    ventureId: v.id("ventures"),
    templateId: v.union(
      v.literal("academic"),
      v.literal("lab"),
      v.literal("creative"),
    ),
    stageCompleted: v.optional(v.number()),
    bossDefeatedId: v.optional(v.number()),
    isGoldCheckpoint: v.optional(v.boolean()),
    currentMetricValue: v.optional(v.number()),
    currentCorruptionLevel: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const {
      userId, ventureId, templateId,
      stageCompleted, bossDefeatedId, isGoldCheckpoint,
      currentMetricValue, currentCorruptionLevel,
    } = args;

    // Get all template badges for this template
    const eligibleBadges = ALL_TEMPLATE_BADGES.filter(
      (b) => b.templateId === templateId || b.templateId === "all",
    );

    // Get existing earned badges
    const existingBadges = await ctx.db
      .query("ventureBadges")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const existingIds = new Set(existingBadges.map((b) => b.badgeId));

    // Get user level stats
    const userLevel = await ctx.db
      .query("userLevels")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const awarded: number[] = [];

    for (const badge of eligibleBadges) {
      if (existingIds.has(badge.id)) continue;

      let shouldAward = false;
      const { type, threshold } = badge.condition;

      switch (type) {
        case "checkpoint_count":
          shouldAward = (userLevel?.totalPoints ?? 0) > 0;
          break;
        case "gold_count":
          shouldAward = (userLevel?.goldCheckpoints ?? 0) >= threshold;
          break;
        case "stage_complete":
          shouldAward = stageCompleted !== undefined && stageCompleted >= threshold;
          break;
        case "boss_defeat":
          shouldAward = bossDefeatedId === threshold;
          break;
        case "metric_threshold":
          if (currentMetricValue !== undefined) {
            // Academic (JIF) and Creative (Fan Score): higher is better
            // Lab (p-value): lower is better
            shouldAward = templateId === "lab"
              ? currentMetricValue <= threshold
              : currentMetricValue >= threshold;
          }
          break;
        case "corruption_survive":
          shouldAward = (currentCorruptionLevel ?? 0) >= threshold && (isGoldCheckpoint ?? false);
          break;
      }

      if (shouldAward) {
        await ctx.db.insert("ventureBadges", {
          userId,
          badgeId: badge.id,
          awardedAt: now,
          isHidden: false,
          metadata: {
            awardedBy: "template_engine",
            templateId,
            ventureId: ventureId as string,
          },
        });

        await ctx.db.insert("badgeEvaluations", {
          badgeId: badge.id,
          userId,
          condition: `template_${templateId}_${badge.condition.type}`,
          lastChecked: now,
          isAwarded: true,
          awardedAt: now,
        });

        awarded.push(badge.id);
      }
    }

    return {
      awarded,
      count: awarded.length,
    };
  },
});

/**
 * Get all template badges earned by a user, with badge metadata.
 */
export const getUserTemplateBadges = query({
  args: {
    userId: v.id("users"),
    templateId: v.optional(v.union(
      v.literal("academic"),
      v.literal("lab"),
      v.literal("creative"),
    )),
  },
  handler: async (ctx, args) => {
    const earnedBadges = await ctx.db
      .query("ventureBadges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const templateBadgeIds = new Set(ALL_TEMPLATE_BADGES.map((b) => b.id));
    const earnedTemplateBadges = earnedBadges.filter((b) => templateBadgeIds.has(b.badgeId));

    return earnedTemplateBadges
      .map((earned) => {
        const def = getTemplateBadgeDef(earned.badgeId);
        if (!def) return null;
        if (args.templateId && def.templateId !== args.templateId && def.templateId !== "all") return null;
        return {
          ...earned,
          name: def.name,
          description: def.description,
          icon: def.icon,
          rarity: def.rarity,
          templateId: def.templateId,
        };
      })
      .filter(Boolean);
  },
});
