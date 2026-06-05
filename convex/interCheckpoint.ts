/**
 * interCheckpoint.ts
 *
 * Phase 10 — Inter-Checkpoint Gameplay Engine (Convex)
 *
 * Implements the gameplay events that occur between checkpoints:
 *   - Henchman encounters (mini-combat vs. the stage's monster)
 *   - Treasure chests (random XP reward 50–200)
 *   - Corruption shields (reduce next corruption gain by 50%)
 *   - Insight fragments (bonus XP, feed to boss HP reduction)
 *   - Optional skip flow (costs Gold coins)
 *
 * All events are template-agnostic — the monster name/lore comes from the
 * active template config, but the gameplay loop is identical.
 */

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCheckpointDefinitions, getStageDefinitions } from "./templateEngine";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

/** XP reward range for treasure chests */
const CHEST_XP_MIN = 50;
const CHEST_XP_MAX = 200;

/** Probability of each inter-checkpoint event (0–1) */
const EVENT_PROBABILITIES = {
  henchman: 0.4,      // 40% chance of a henchman encounter
  treasure: 0.3,      // 30% chance of a treasure chest
  shield: 0.2,        // 20% chance of a corruption shield
  insight: 0.25,      // 25% chance of an insight fragment
} as const;

/** Gold cost to skip an inter-checkpoint event */
const SKIP_COST_GOLD = 5;

/** Boss HP reduction per insight fragment */
const INSIGHT_BOSS_HP_REDUCTION = 0.05; // 5% per fragment, stacks up to 5

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type InterCheckpointEventType =
  | "henchman"
  | "treasure"
  | "shield"
  | "insight"
  | "clear";   // No event — free passage

export interface HenchmanEncounterResult {
  outcome: "victory" | "retreat" | "skipped";
  xpEarned: number;
  corruptionReduction: number;
  henchmanName: string;
}

export interface TreasureResult {
  xpEarned: number;
  gold: number;
}

export interface ShieldResult {
  shieldsActive: number;
}

export interface InsightResult {
  fragmentsCollected: number;
  bossHpReductionPct: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// EVENT GENERATOR (pure function — deterministic from seed)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Deterministically generate which inter-checkpoint events fire for a given
 * venture + stage + checkpoint pair, using a seeded RNG.
 *
 * Using a seed ensures the same events appear for the same user/stage/checkpoint
 * combination — prevents re-rolls on page refresh.
 */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0x100000000;
  };
}

function generateInterCheckpointEvents(
  ventureId: string,
  stage: number,
  checkpoint: number,
  corruptionLevel: number,
): InterCheckpointEventType[] {
  // Generate a deterministic seed from the IDs
  const seed = ventureId
    .split("")
    .reduce((acc, ch, i) => acc + ch.charCodeAt(0) * (i + 1), 0)
    + stage * 1000 + checkpoint * 100;

  const rng = seededRandom(seed);
  const events: InterCheckpointEventType[] = [];

  // Boss/Henchman is ALWAYS present in every checkpoint transition
  events.push("henchman");

  if (rng() < EVENT_PROBABILITIES.treasure) events.push("treasure");
  if (rng() < EVENT_PROBABILITIES.shield) events.push("shield");
  if (rng() < EVENT_PROBABILITIES.insight) events.push("insight");

  return events;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONVEX QUERIES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get the inter-checkpoint events for the upcoming passage between
 * (stage, checkpoint) → (stage, checkpoint + 1) or next stage.
 *
 * Returns an array of event types that will fire — the client uses this
 * to animate the map character movement with event encounters.
 */
export const getInterCheckpointEvents = query({
  args: {
    ventureId: v.id("ventures"),
    currentStage: v.number(),
    currentCheckpoint: v.number(),
  },
  handler: async (ctx, args) => {
    const venture = await ctx.db.get(args.ventureId);
    if (!venture) return null;

    const corruptionLevel = venture.corruptionLevel ?? 0;
    const events = generateInterCheckpointEvents(
      args.ventureId,
      args.currentStage,
      args.currentCheckpoint,
      corruptionLevel,
    );

    // Check existing inter-checkpoint state
    const existingState = await ctx.db
      .query("interCheckpointStates")
      .withIndex("by_venture_stage_cp", (q) =>
        q
          .eq("ventureId", args.ventureId)
          .eq("stage", args.currentStage)
          .eq("checkpoint", args.currentCheckpoint),
      )
      .first();

    return {
      events,
      corruptionLevel,
      existingState: existingState ?? null,
      skipCostGold: SKIP_COST_GOLD,
    };
  },
});

/**
 * Get the player's accumulated inter-checkpoint resources.
 */
export const getInterCheckpointResources = query({
  args: { ventureId: v.id("ventures") },
  handler: async (ctx, args) => {
    const states = await ctx.db
      .query("interCheckpointStates")
      .withIndex("by_venture", (q) => q.eq("ventureId", args.ventureId))
      .collect();

    const totalShields = states.reduce((sum, s) => sum + (s.shieldsEarned ?? 0), 0);
    const usedShields = states.reduce((sum, s) => sum + (s.shieldsUsed ?? 0), 0);
    const totalInsight = states.reduce((sum, s) => sum + (s.insightFragments ?? 0), 0);
    const totalHenchmenDefeated = states.reduce((sum, s) => sum + (s.henchmanVictories ?? 0), 0);
    const totalTreasures = states.reduce((sum, s) => sum + (s.treasuresFound ?? 0), 0);

    const activeShields = Math.min(2, totalShields - usedShields); // Max 2 active shields
    const bossHpReduction = Math.min(0.25, totalInsight * INSIGHT_BOSS_HP_REDUCTION);

    return {
      activeShields,
      insightFragments: totalInsight,
      bossHpReduction,
      henchmenDefeated: totalHenchmenDefeated,
      treasuresFound: totalTreasures,
    };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// CONVEX MUTATIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolve a henchman encounter.
 * outcome: "victory" — player defeated the henchman
 * outcome: "retreat" — player failed, no penalty (boss health unaffected)
 * outcome: "skipped" — player paid Gold to skip
 */
// ─────────────────────────────────────────────────────────────────────────────
// Prompt-security gate for henchman encounters.
// Mirrors the text-only signals from aiScoring so the boss challenge can't be
// trivially defeated with a copy-pasted ChatGPT paragraph.
// ─────────────────────────────────────────────────────────────────────────────

const HENCHMAN_AI_DETECTION_THRESHOLD = 0.4;

const HENCHMAN_AI_FLAG_PHRASES: readonly string[] = [
  "furthermore", "moreover", "in conclusion", "in summary",
  "it is important to note", "it's worth noting", "it should be noted",
  "on the one hand", "on the other hand", "that being said",
  "comprehensive understanding", "comprehensive suite",
  "multifaceted approach", "multifaceted needs",
  "paradigm shift", "leverage synergies", "leverages cutting-edge",
  "leveraging cutting-edge", "robust framework", "robust customer engagement",
  "user-centric approach", "user-centric design",
  "data-driven insights", "data-driven decisions",
  "harnessing the power", "harness the power",
  "cutting-edge artificial intelligence", "machine learning algorithms",
  "deliver exceptional value", "exceptional value to", "delivering exceptional",
  "rapidly evolving digital landscape", "rapidly evolving landscape",
  "ever-rising consumer expectations",
  "in today's competitive", "in today's rapidly evolving", "in today's digital",
  "in the realm of", "navigate the complexities", "tapestry of", "delve into",
  "unlock new growth", "unlock the potential",
  "streamline their workflows", "streamline operations",
  "thrive in an increasingly competitive", "commitment to excellence",
  "innovative platform", "innovative solution", "innovative approach",
  "revolutionize how", "transform the way",
];

function henchmanAiConfidence(text: string): number {
  const trimmed = text.trim();
  if (trimmed.length < 30) return 0;
  const lower = trimmed.toLowerCase();
  let hits = 0;
  for (const phrase of HENCHMAN_AI_FLAG_PHRASES) {
    if (lower.includes(phrase)) hits++;
  }
  const vocab = Math.min(1, hits / 4);
  const sentences = trimmed
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  let burstiness = 0;
  if (sentences.length >= 3) {
    const wordCounts = sentences.map((s) => s.split(/\s+/).length);
    const mean = wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length;
    if (mean > 0) {
      const variance =
        wordCounts.reduce((acc, w) => acc + (w - mean) ** 2, 0) /
        wordCounts.length;
      const cv = Math.sqrt(variance) / mean;
      if (cv <= 0.15) burstiness = 1;
      else if (cv < 0.5) burstiness = 1 - (cv - 0.15) / (0.5 - 0.15);
    }
  }
  return vocab * 0.6 + burstiness * 0.4;
}

export const resolveHenchmanEncounter = mutation({
  args: {
    ventureId: v.id("ventures"),
    stage: v.number(),
    checkpoint: v.number(),
    outcome: v.union(v.literal("victory"), v.literal("retreat"), v.literal("skipped")),
    henchmanName: v.string(),
    // Server-side anti-cheat — optional for backward compatibility with
    // older client builds, but new client sends it on every victory submit.
    answerText: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const venture = await ctx.db.get(args.ventureId);
    if (!venture) return null;

    // Prompt-security gate: if the user submits a "victory" with an
    // AI-generated paragraph, downgrade the outcome to a retreat with
    // a flag so the front-end can show the AntiCheatWarning.
    //
    // 2-strike policy mirrors the combat anti-cheat:
    //   strike 1 → warn user, no rewards
    //   strike 2 → permanent account suspension via userAccountSuspensions
    if (args.outcome === "victory" && args.answerText) {
      const confidence = henchmanAiConfidence(args.answerText);
      if (confidence >= HENCHMAN_AI_DETECTION_THRESHOLD) {
        // Check whether the user is already banned (defensive — the
        // client should already gate this, but a stale tab could try).
        const activeBan = await ctx.db
          .query("userAccountSuspensions")
          .withIndex("by_user_active", (q) => q.eq("userId", venture.userId))
          .order("desc")
          .first();
        if (
          activeBan &&
          (activeBan.isPermanent || activeBan.banEndAt > now)
        ) {
          return {
            xpEarned: 0,
            corruptionReduction: 0,
            aiDetected: true,
            aiConfidence: Math.round(confidence * 1000) / 1000,
            banned: true,
            message:
              "Your account is suspended for repeated AI-generated submissions. Contact support if you believe this is an error.",
          } as const;
        }

        // Count this user's prior AI-detection strikes (any henchman or
        // combat anti-cheat event). Re-use `combatAiSuspicions` as the
        // shared "strike record" table to keep policy unified.
        const priorStrikes = await ctx.db
          .query("combatAiSuspicions")
          .withIndex("by_user", (q) => q.eq("userId", venture.userId))
          .collect();
        const strikeNumber = priorStrikes.length + 1;

        // Record this offense in the shared strike table.
        await ctx.db.insert("combatAiSuspicions", {
          userId: venture.userId,
          source: "henchman_encounter",
          confidence,
          signals: ["vocabulary_fingerprint", "burstiness"],
          detectedAt: now,
          action: strikeNumber >= 2 ? "ban" : "warning",
          textSample: args.answerText.slice(0, 500),
        });

        if (strikeNumber >= 2) {
          // Permanent ban — matches combat anti-cheat second-offense policy.
          await ctx.db.insert("userAccountSuspensions", {
            userId: venture.userId,
            reason: `AI-generated submission detected — strike ${strikeNumber}. Confidence ${confidence.toFixed(3)}.`,
            scope: "account",
            isPermanent: true,
            banStartAt: now,
            banEndAt: now + 100 * 365 * 24 * 60 * 60 * 1000, // ~100 years
          });
          return {
            xpEarned: 0,
            corruptionReduction: 0,
            aiDetected: true,
            aiConfidence: Math.round(confidence * 1000) / 1000,
            banned: true,
            strikeNumber,
            message:
              "🛑 ACCOUNT PERMANENTLY SUSPENDED\n\n" +
              "This is your second confirmed AI-generated submission. Per the platform's prompt-security policy, your account has been suspended permanently.\n\n" +
              "All progress, ventures, and rewards are frozen. Contact support if you believe this is an error.",
          } as const;
        }

        return {
          xpEarned: 0,
          corruptionReduction: 0,
          aiDetected: true,
          aiConfidence: Math.round(confidence * 1000) / 1000,
          strikeNumber,
          message:
            "⚠️ FINAL WARNING — AI-generated submission detected\n\n" +
            "We use server-side prompt-security analysis to keep the platform fair. " +
            "Your submission matched the AI-generated profile (no original phrasing, uniform sentence structure, marketing-buzzword density).\n\n" +
            "Strike 1 of 2. " +
            "If we detect another AI-generated submission anywhere on the platform — combat, tasks, or boss encounters — your account will be PERMANENTLY SUSPENDED. " +
            "No second chances, no appeals.\n\n" +
            "Rewrite your answer in your own words: concrete, specific, grounded in your own experience or research.",
        } as const;
      }
    }

    const xpEarned = args.outcome === "victory" ? 75 : args.outcome === "skipped" ? 0 : 25; // retreat gives 25 XP for trying
    const corruptionReduction = args.outcome === "victory" ? 3 : 0;

    // Deduct gold if skipped
    if (args.outcome === "skipped") {
      const wallet = await ctx.db
        .query("wallets")
        .withIndex("by_user", (q) => q.eq("userId", venture.userId))
        .first();

      if (!wallet || wallet.balance < SKIP_COST_GOLD) {
        throw new Error("Insufficient gold to skip this encounter");
      }

      await ctx.db.patch(wallet._id, {
        balance: wallet.balance - SKIP_COST_GOLD,
        updatedAt: now,
      });

      await ctx.db.insert("transactions", {
        walletId: wallet._id,
        amount: -SKIP_COST_GOLD,
        type: "skip_encounter",
        description: `Skipped henchman encounter vs. ${args.henchmanName}`,
        createdAt: now,
      });
    }

    // Upsert inter-checkpoint state
    const existing = await ctx.db
      .query("interCheckpointStates")
      .withIndex("by_venture_stage_cp", (q) =>
        q.eq("ventureId", args.ventureId).eq("stage", args.stage).eq("checkpoint", args.checkpoint),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        henchmanOutcome: args.outcome,
        henchmanVictories: (existing.henchmanVictories ?? 0) + (args.outcome === "victory" ? 1 : 0),
        henchmanName: args.henchmanName,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("interCheckpointStates", {
        ventureId: args.ventureId,
        stage: args.stage,
        checkpoint: args.checkpoint,
        henchmanOutcome: args.outcome,
        henchmanVictories: args.outcome === "victory" ? 1 : 0,
        henchmanName: args.henchmanName,
        shieldsEarned: 0,
        shieldsUsed: 0,
        insightFragments: 0,
        treasuresFound: 0,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Award XP
    if (xpEarned > 0) {
      const userLevel = await ctx.db
        .query("userLevels")
        .withIndex("by_user", (q) => q.eq("userId", venture.userId))
        .first();
      if (userLevel) {
        await ctx.db.patch(userLevel._id, {
          totalPoints: (userLevel.totalPoints ?? 0) + xpEarned,
          updatedAt: now,
        });
      }
    }

    // Reduce corruption on victory
    if (corruptionReduction > 0) {
      const current = venture.corruptionLevel ?? 0;
      await ctx.db.patch(args.ventureId, {
        corruptionLevel: Math.max(0, current - corruptionReduction),
        lastActivityAt: now,
        updatedAt: now,
      });
    }

    return { xpEarned, corruptionReduction, outcome: args.outcome };
  },
});

/**
 * Collect a treasure chest.
 * Awards random XP between 50–200, seeded by venture+stage+checkpoint.
 */
export const collectTreasureChest = mutation({
  args: {
    ventureId: v.id("ventures"),
    stage: v.number(),
    checkpoint: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const venture = await ctx.db.get(args.ventureId);
    if (!venture) return null;

    // Deterministic XP based on seed
    const seed = args.ventureId
      .split("")
      .reduce((acc, ch, i) => acc + ch.charCodeAt(0) * (i + 1), 0)
      + args.stage * 777 + args.checkpoint * 333;
    const xpRange = CHEST_XP_MAX - CHEST_XP_MIN;
    const xpEarned = CHEST_XP_MIN + (seed % (xpRange + 1));

    // Check not already collected
    const existing = await ctx.db
      .query("interCheckpointStates")
      .withIndex("by_venture_stage_cp", (q) =>
        q.eq("ventureId", args.ventureId).eq("stage", args.stage).eq("checkpoint", args.checkpoint),
      )
      .first();

    if (existing?.treasuresFound && existing.treasuresFound > 0) {
      return { alreadyCollected: true, xpEarned: 0, gold: 0 };
    }

    if (existing) {
      await ctx.db.patch(existing._id, {
        treasuresFound: (existing.treasuresFound ?? 0) + 1,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("interCheckpointStates", {
        ventureId: args.ventureId,
        stage: args.stage,
        checkpoint: args.checkpoint,
        treasuresFound: 1,
        shieldsEarned: 0,
        shieldsUsed: 0,
        insightFragments: 0,
        henchmanVictories: 0,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Award XP
    const userLevel = await ctx.db
      .query("userLevels")
      .withIndex("by_user", (q) => q.eq("userId", venture.userId))
      .first();
    if (userLevel) {
      await ctx.db.patch(userLevel._id, {
        totalPoints: (userLevel.totalPoints ?? 0) + xpEarned,
        updatedAt: now,
      });
    }

    return { alreadyCollected: false, xpEarned, gold: 0 };
  },
});

/**
 * Collect a corruption shield.
 * Active shields reduce the next corruption gain by 50% each (max 2 stacked).
 */
export const collectCorruptionShield = mutation({
  args: {
    ventureId: v.id("ventures"),
    stage: v.number(),
    checkpoint: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const existing = await ctx.db
      .query("interCheckpointStates")
      .withIndex("by_venture_stage_cp", (q) =>
        q.eq("ventureId", args.ventureId).eq("stage", args.stage).eq("checkpoint", args.checkpoint),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        shieldsEarned: (existing.shieldsEarned ?? 0) + 1,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("interCheckpointStates", {
        ventureId: args.ventureId,
        stage: args.stage,
        checkpoint: args.checkpoint,
        shieldsEarned: 1,
        shieldsUsed: 0,
        insightFragments: 0,
        henchmanVictories: 0,
        treasuresFound: 0,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { shieldsActive: 1 };
  },
});

/**
 * Collect an insight fragment.
 * Each fragment reduces boss HP by 5% (max 25% total reduction from 5 fragments).
 */
export const collectInsightFragment = mutation({
  args: {
    ventureId: v.id("ventures"),
    stage: v.number(),
    checkpoint: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const xpBonus = 30;

    const venture = await ctx.db.get(args.ventureId);
    if (!venture) return null;

    const existing = await ctx.db
      .query("interCheckpointStates")
      .withIndex("by_venture_stage_cp", (q) =>
        q.eq("ventureId", args.ventureId).eq("stage", args.stage).eq("checkpoint", args.checkpoint),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        insightFragments: (existing.insightFragments ?? 0) + 1,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("interCheckpointStates", {
        ventureId: args.ventureId,
        stage: args.stage,
        checkpoint: args.checkpoint,
        insightFragments: 1,
        shieldsEarned: 0,
        shieldsUsed: 0,
        henchmanVictories: 0,
        treasuresFound: 0,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Award XP bonus
    const userLevel = await ctx.db
      .query("userLevels")
      .withIndex("by_user", (q) => q.eq("userId", venture.userId))
      .first();
    if (userLevel) {
      await ctx.db.patch(userLevel._id, {
        totalPoints: (userLevel.totalPoints ?? 0) + xpBonus,
        updatedAt: now,
      });
    }

    return { fragmentsCollected: 1, bossHpReductionPct: INSIGHT_BOSS_HP_REDUCTION };
  },
});
