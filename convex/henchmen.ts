/**
 * convex/henchmen.ts
 *
 * PRD § 9.1 — XP reward application for inline path henchmen.
 *
 * The Phaser side spawns thematic henchmen and emits HENCHMAN_DEFEATED
 * (full XP) or HENCHMAN_FLED (half XP). React calls applyHenchmanReward
 * with the spawnId + xp + stage context.
 *
 * Idempotent by spawnId — a given henchman can only award XP once.
 */

import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const applyHenchmanReward = mutation({
  args: {
    spawnId: v.string(),
    henchmanId: v.string(),
    xpAwarded: v.number(),
    stage: v.number(),
    resolution: v.union(v.literal("defeated"), v.literal("fled")),
    ventureId: v.id("ventures"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User row not found");

    // Idempotency — one row per (user, spawn). Re-submission is silent
    // success.
    const existing = await ctx.db
      .query("henchmanResolutions")
      .withIndex("by_user_spawn", (q) =>
        q.eq("userId", user._id).eq("spawnId", args.spawnId),
      )
      .first();
    if (existing) {
      return { ok: true, alreadyClaimed: true as const };
    }

    // Apply XP — patch userLevels with the awarded amount, clamped to
    // positive values.
    const xpClamped = Math.max(0, Math.floor(args.xpAwarded));
    if (xpClamped > 0) {
      const userLevel = await ctx.db
        .query("userLevels")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();
      if (userLevel) {
        await ctx.db.patch(userLevel._id, {
          titlePoints: (userLevel.titlePoints ?? 0) + xpClamped,
          totalPoints: (userLevel.totalPoints ?? 0) + xpClamped,
        });
      }
    }

    // Record the resolution
    await ctx.db.insert("henchmanResolutions", {
      userId: user._id,
      spawnId: args.spawnId,
      henchmanId: args.henchmanId,
      ventureId: args.ventureId,
      stage: args.stage,
      resolution: args.resolution,
      xpAwarded: xpClamped,
      resolvedAt: Date.now(),
    });

    return {
      ok: true,
      alreadyClaimed: false as const,
      xpAwarded: xpClamped,
    };
  },
});
