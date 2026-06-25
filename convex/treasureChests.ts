/**
 * convex/treasureChests.ts
 *
 * PRD § 9.2 — inter-checkpoint treasure chest reward application.
 *
 * The Phaser side spawns chests with random rewards and emits a
 * TREASURE_CHEST_OPENED event when the player taps one. React calls
 * applyChestReward with the chestId + reward kind + venture context.
 *
 * Rewards (per PRD):
 *   xp_cache          — 25-75 XP scaled by stage number (later stages
 *                       award more)
 *   flare_charge      — grants a free Flare on the venture
 *   corruption_shield — reduces corruption -5% immediately and slows
 *                       accumulation for 48h
 *   insight_fragment  — flavour-only; logs an event row for the feed
 *
 * Mutation is idempotent by chestId — a chest may only be claimed once
 * per user. Re-attempts return `{ok: true, alreadyClaimed: true}`.
 */

import { v } from "convex/values";
import { mutation } from "./_generated/server";

const REWARD_KINDS = [
  v.literal("xp_cache"),
  v.literal("flare_charge"),
  v.literal("corruption_shield"),
  v.literal("insight_fragment"),
] as const;

/** XP range per stage — later stages award more (PRD: 25-75 across 8 stages). */
function xpForStage(stage: number): number {
  const base = 20;
  const perStage = 7;
  const min = base + perStage * Math.max(0, stage - 1);
  // Random within [min, min+15] so two chests at the same stage feel
  // distinct.
  return min + Math.floor(Math.random() * 16);
}

export const applyChestReward = mutation({
  args: {
    chestId: v.string(),
    reward: v.union(...REWARD_KINDS),
    ventureId: v.id("ventures"),
    /** Stage in which the chest was spawned — drives xp_cache amount. */
    stage: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) {
      throw new Error("User row not found");
    }

    // Idempotency — if this chestId was already claimed by this user
    // return a no-op success so the Phaser event can fire freely.
    const existing = await ctx.db
      .query("treasureChestClaims")
      .withIndex("by_user_chest", (q) =>
        q.eq("userId", user._id).eq("chestId", args.chestId),
      )
      .first();
    if (existing) {
      return { ok: true, alreadyClaimed: true as const };
    }

    // Apply the reward per kind. Each reward path is intentionally
    // small so the audit reads cleanly.
    let xpAwarded = 0;
    if (args.reward === "xp_cache") {
      xpAwarded = xpForStage(args.stage);
      // Patch the user's title points (used by the level system).
      const userLevel = await ctx.db
        .query("userLevels")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();
      if (userLevel) {
        await ctx.db.patch(userLevel._id, {
          titlePoints: (userLevel.titlePoints ?? 0) + xpAwarded,
          totalPoints: (userLevel.totalPoints ?? 0) + xpAwarded,
        });
      }
    } else if (args.reward === "flare_charge") {
      // Grant a single free flare credit on the venture. We store this
      // as an unused flare credit count on the venture row. If the
      // field doesn't exist yet (legacy ventures), patch it in.
      const venture = await ctx.db.get(args.ventureId);
      if (venture) {
        const prev = (venture as { freeFlareCredits?: number }).freeFlareCredits ?? 0;
        await ctx.db.patch(args.ventureId, {
          freeFlareCredits: prev + 1,
        } as Partial<typeof venture>);
      }
    } else if (args.reward === "corruption_shield") {
      // -5% corruption immediately. Slow-accumulation window of 48h
      // is tracked via a shield-expires-at timestamp the corruption
      // engine reads when applying decay.
      const venture = await ctx.db.get(args.ventureId);
      if (venture) {
        const newLevel = Math.max(
          0,
          (venture.corruptionLevel ?? 0) - 5,
        );
        const SHIELD_MS = 48 * 60 * 60 * 1000;
        await ctx.db.patch(args.ventureId, {
          corruptionLevel: newLevel,
          corruptionShieldExpiresAt: Date.now() + SHIELD_MS,
        } as Partial<typeof venture>);
      }
    } else if (args.reward === "insight_fragment") {
      // Flavour-only — no state mutation. The feed-event row written
      // below is the entire payoff.
    }

    // Record the claim — idempotency + a feed row so the activity
    // graph shows the player picked up something.
    await ctx.db.insert("treasureChestClaims", {
      userId: user._id,
      chestId: args.chestId,
      ventureId: args.ventureId,
      reward: args.reward,
      stage: args.stage,
      xpAwarded: args.reward === "xp_cache" ? xpAwarded : undefined,
      claimedAt: Date.now(),
    });

    return {
      ok: true,
      alreadyClaimed: false as const,
      xpAwarded,
    };
  },
});
