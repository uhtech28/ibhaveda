/**
 * Flare system — community help requests.
 *
 * A user fires a Flare when they're stuck on something concrete and
 * want a quick read from the wider community. Anyone can respond.
 * The flare owner can mark a response as helpful (rewards the
 * responder with a helpful-response credit on their level row) and
 * resolve the flare (closes it to new responses).
 *
 * This file replaces the previous `convex/flares.ts`. The new
 * additions over the prior version:
 *   - Notification triggers on response + helpful mark
 *   - `getFlareDetail` query — flare + owner + responses + responder
 *     names in a single round trip for the detail dialog
 *   - `getMyOpenFlares` query — current user's active flares
 *   - `getResponseCount` query — for card previews
 *   - `respondToFlare` and `markResponseHelpful` updated to emit the
 *     new notification types
 *
 * Notification types introduced:
 *   - "flare_response_received" — owner pinged when someone responds
 *   - "flare_response_helpful"  — responder pinged when marked helpful
 */

import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";

// XP rewards for flare loop.  Kept modest — mentorship should feel
// meaningful but shouldn't be a level-farming path.  Fills gap #4 in
// the gamification audit ("flare counters exist but nothing reads them
// into XP or leagues").
const FLARE_XP = {
  fire: 5,
  respond: 10,
  markedHelpful: 25,
  resolve: 15,
} as const;

// ─────────────────────────────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────────────────────────────

/**
 * Fire a flare — open a new help request.
 */
export const fireFlare = mutation({
  args: {
    description: v.string(),
    expertiseTag: v.optional(v.string()),
    ventureId: v.optional(v.id("ventures")),
    checkpointId: v.optional(v.id("ventureCheckpoints")),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const trimmed = args.description.trim();
    if (trimmed.length === 0) {
      throw new Error("Flare description cannot be empty");
    }

    // Normalise the expertise tag — lowercased + trimmed, dropped if
    // empty. Keeps feed filtering consistent later.
    const tagRaw = (args.expertiseTag ?? "").trim();
    const expertiseTag = tagRaw.length > 0
      ? tagRaw.slice(0, 60) // hard cap so it can't be abused as a title
      : undefined;

    const now = Date.now();
    const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

    const flareId = await ctx.db.insert("flares", {
      userId: user._id,
      ventureId: args.ventureId,
      checkpointId: args.checkpointId,
      description: trimmed,
      expertiseTag,
      status: "open",
      createdAt: now,
      // Auto-expires in 7 days. The expireOldFlares cron flips
      // status to "expired" when this passes; the feed query
      // already filters expired flares out as a defence in depth.
      expiresAt: now + ONE_WEEK_MS,
    });

    // Streak v2 — firing a flare counts as a meaningful action.
    try {
      await ctx.scheduler.runAfter(0, internal.streaks.recordAction, {
        userId: user._id,
        actionType: "fired_flare",
      });
    } catch { /* streak failure must never block primary mutation */ }

    // Small XP grant for engagement — asking for help IS the action.
    try {
      await ctx.scheduler.runAfter(0, internal.gamification.internalAwardXP, {
        userId: user._id,
        amount: FLARE_XP.fire,
        action: "flare_fired",
      });
    } catch { /* XP failure non-blocking */ }

    // Daily challenge progress
    try {
      await ctx.scheduler.runAfter(0, internal.dailyChallenges.bumpProgress, {
        userId: user._id,
        actionType: "fire_flare",
      });
    } catch { /* non-blocking */ }

    return flareId;
  },
});

/**
 * Respond to an open flare. Refuses if the flare is already resolved
 * or if the responder is the flare owner (self-response is noise).
 * Emits a `flare_response_received` notification to the owner.
 */
export const respondToFlare = mutation({
  args: {
    flareId: v.id("flares"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const flare = await ctx.db.get(args.flareId);
    if (!flare) throw new Error("Flare not found");
    if (flare.status !== "open") throw new Error("Flare is not open");
    if (flare.userId === user._id) {
      throw new Error("You can't respond to your own flare");
    }
    // Reject responses to flares that have aged past the 7-day window
    // even if the daily cron hasn't run yet. Defence in depth.
    if (flare.expiresAt && flare.expiresAt < Date.now()) {
      throw new Error("This flare has expired");
    }

    // One response per user per flare. Each individual gets a single
    // slot to propose their solution — this prevents thread spam and
    // matches the spec ("each person can add 1 post after that").
    const existing = await ctx.db
      .query("flareResponses")
      .withIndex("by_flare", (q) => q.eq("flareId", args.flareId))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .first();
    if (existing) {
      throw new Error("You've already responded to this flare");
    }

    const trimmed = args.content.trim();
    if (trimmed.length === 0) {
      throw new Error("Response cannot be empty");
    }

    const responseId = await ctx.db.insert("flareResponses", {
      flareId: args.flareId,
      userId: user._id,
      content: trimmed,
      createdAt: Date.now(),
    });

    // Notify the flare owner. Short preview of the response in the message.
    const preview = trimmed.length > 80 ? `${trimmed.slice(0, 77)}…` : trimmed;
    await ctx.db.insert("notifications", {
      recipientId: flare.userId,
      senderId: user._id,
      type: "flare_response_received",
      message: `${user.displayName ?? "Someone"} responded to your flare: "${preview}"`,
      relatedId: args.flareId,
      isRead: false,
      createdAt: Date.now(),
    });

    // Streak v2 — responding to a flare counts as a meaningful action.
    try {
      await ctx.scheduler.runAfter(0, internal.streaks.recordAction, {
        userId: user._id,
        actionType: "responded_to_flare",
      });
    } catch { /* streak failure must never block primary mutation */ }

    // Reward the responder — mentorship is real work.
    try {
      await ctx.scheduler.runAfter(0, internal.gamification.internalAwardXP, {
        userId: user._id,
        amount: FLARE_XP.respond,
        action: "flare_responded",
      });
    } catch { /* XP failure non-blocking */ }

    // Daily challenge progress
    try {
      await ctx.scheduler.runAfter(0, internal.dailyChallenges.bumpProgress, {
        userId: user._id,
        actionType: "respond_flare",
      });
    } catch { /* non-blocking */ }

    return responseId;
  },
});

/**
 * Mark a response as helpful. Owner-only. Awards the responder a
 * helpful-response credit on their level row (Sahi's existing
 * convention) and pings them with a notification.
 */
export const markResponseHelpful = mutation({
  args: {
    responseId: v.id("flareResponses"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const response = await ctx.db.get(args.responseId);
    if (!response) throw new Error("Response not found");
    if (response.isHelpful) {
      // Idempotent — second click is a no-op rather than an error.
      return { alreadyMarked: true };
    }

    const flare = await ctx.db.get(response.flareId);
    if (!flare) throw new Error("Flare not found");
    if (flare.userId !== user._id) {
      throw new Error("Only the flare owner can mark responses helpful");
    }

    await ctx.db.patch(args.responseId, { isHelpful: true });

    // Credit the responder's level row.
    const responderLevel = await ctx.db
      .query("userLevels")
      .withIndex("by_user", (q) => q.eq("userId", response.userId))
      .first();
    if (responderLevel) {
      await ctx.db.patch(responderLevel._id, {
        helpfulFlareResponses: (responderLevel.helpfulFlareResponses ?? 0) + 1,
        updatedAt: Date.now(),
      });
    }

    // Notify the responder.
    await ctx.db.insert("notifications", {
      recipientId: response.userId,
      senderId: user._id,
      type: "flare_response_helpful",
      message: `${user.displayName ?? "Someone"} marked your flare response as helpful`,
      relatedId: response.flareId,
      isRead: false,
      createdAt: Date.now(),
    });

    // Larger XP reward — being genuinely helpful is the aspirational
    // behaviour the community should optimize for.
    try {
      await ctx.scheduler.runAfter(0, internal.gamification.internalAwardXP, {
        userId: response.userId,
        amount: FLARE_XP.markedHelpful,
        action: "flare_marked_helpful",
      });
    } catch { /* XP failure non-blocking */ }

    return { alreadyMarked: false };
  },
});

/**
 * Resolve a flare. Owner-only. Closes the flare to new responses;
 * existing responses are preserved. Credits the owner's level row.
 */
export const resolveFlare = mutation({
  args: { flareId: v.id("flares") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const flare = await ctx.db.get(args.flareId);
    if (!flare) throw new Error("Flare not found");
    if (flare.userId !== user._id) {
      throw new Error("Only the flare owner can resolve it");
    }
    if (flare.status === "resolved") {
      return { alreadyResolved: true };
    }

    await ctx.db.patch(args.flareId, {
      status: "resolved",
      resolvedAt: Date.now(),
    });

    const userLevel = await ctx.db
      .query("userLevels")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();
    if (userLevel) {
      await ctx.db.patch(userLevel._id, {
        flaresResolved: (userLevel.flaresResolved ?? 0) + 1,
        updatedAt: Date.now(),
      });
    }

    // Reward the resolver — closing the loop matters for community health.
    try {
      await ctx.scheduler.runAfter(0, internal.gamification.internalAwardXP, {
        userId: user._id,
        amount: FLARE_XP.resolve,
        action: "flare_resolved",
      });
    } catch { /* XP failure non-blocking */ }

    return { alreadyResolved: false };
  },
});

// ─────────────────────────────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────────────────────────────

/**
 * Open flares for the community feed, newest first. Each row is
 * hydrated with the owner's display name + avatar so the card can
 * render without a second query per flare.
 */
export const getOpenFlares = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const now = Date.now();
    const flares = await ctx.db
      .query("flares")
      .withIndex("by_status_created", (q) => q.eq("status", "open"))
      .order("desc")
      .take((args.limit ?? 20) * 2); // fetch extra in case some are expired

    // Filter out flares whose expiresAt has passed but the cron hasn't
    // touched them yet. Defence in depth — the cron will catch them
    // eventually but the feed should never show stale flares.
    const fresh = flares.filter((f) =>
      f.expiresAt === undefined || f.expiresAt > now,
    );
    const trimmed = fresh.slice(0, args.limit ?? 20);

    return await Promise.all(
      trimmed.map(async (flare) => ({
        ...flare,
        owner: await ownerLite(ctx, flare.userId),
        responseCount: await responseCountFor(ctx, flare._id),
      })),
    );
  },
});

/**
 * Detail view for a single flare — flare, owner, all responses with
 * responder display info. One round trip drives the detail dialog.
 */
export const getFlareDetail = query({
  args: { flareId: v.id("flares") },
  handler: async (ctx, { flareId }) => {
    const flare = await ctx.db.get(flareId);
    if (!flare) return null;

    const responses = await ctx.db
      .query("flareResponses")
      .withIndex("by_flare_created", (q) => q.eq("flareId", flareId))
      .order("asc")
      .collect();

    const hydratedResponses = await Promise.all(
      responses.map(async (r) => ({
        ...r,
        responder: await ownerLite(ctx, r.userId),
      })),
    );

    return {
      ...flare,
      owner: await ownerLite(ctx, flare.userId),
      responses: hydratedResponses,
    };
  },
});

/**
 * Current user's open flares. Used for the "Your active flares"
 * section on the user's home / profile feed.
 */
export const getMyOpenFlares = query({
  args: {},
  handler: async (ctx) => {
    const user = await maybeUser(ctx);
    if (!user) return [];

    const flares = await ctx.db
      .query("flares")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const openFlares = flares
      .filter((f) => f.status === "open")
      .sort((a, b) => b.createdAt - a.createdAt);

    return await Promise.all(
      openFlares.map(async (f) => ({
        ...f,
        responseCount: await responseCountFor(ctx, f._id),
      })),
    );
  },
});

/**
 * Response count for a specific flare — cheap query for card previews
 * outside the full detail view.
 */
export const getResponseCount = query({
  args: { flareId: v.id("flares") },
  handler: async (ctx, { flareId }) => {
    return await responseCountFor(ctx, flareId);
  },
});

/**
 * Get flares owned by a user (used on profile pages).
 */
export const getUserFlares = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("flares")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

/**
 * Has the current user already responded to this flare?
 * Frontend uses this to hide the compose form + show their existing
 * response (or a "you've already replied" banner) on the detail view.
 */
export const hasMyResponse = query({
  args: { flareId: v.id("flares") },
  handler: async (ctx, { flareId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { responded: false, response: null };
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return { responded: false, response: null };
    const response = await ctx.db
      .query("flareResponses")
      .withIndex("by_flare", (q) => q.eq("flareId", flareId))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .first();
    return { responded: !!response, response };
  },
});

// ─────────────────────────────────────────────────────────────────────
// Background tasks
// ─────────────────────────────────────────────────────────────────────

/**
 * Internal sweep — flips any open flares with expiresAt < now to
 * status="expired". Called from a daily cron defined in crons.ts.
 *
 * Idempotent — running twice is a no-op since already-expired
 * flares are no longer status="open".
 */
export const expireOldFlares = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const candidates = await ctx.db
      .query("flares")
      .withIndex("by_status_expires", (q) => q.eq("status", "open"))
      .collect();
    let expired = 0;
    for (const flare of candidates) {
      if (flare.expiresAt && flare.expiresAt < now) {
        await ctx.db.patch(flare._id, { status: "expired" });
        expired += 1;
      }
    }
    return { scanned: candidates.length, expired };
  },
});

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

interface OwnerLite {
  _id: Id<"users">;
  displayName: string;
  username: string | null;
  avatar: string | null;
}

async function ownerLite(ctx: any, userId: Id<"users">): Promise<OwnerLite> {
  const u = await ctx.db.get(userId);
  if (!u) {
    return { _id: userId, displayName: "Unknown", username: null, avatar: null };
  }
  return {
    _id: u._id,
    displayName: u.displayName ?? "Anonymous",
    // Username enables /profile/{username} links from FlareResponseItem so
    // the flare owner can reach out directly to whoever proposed a solution.
    username: u.username ?? null,
    avatar: u.avatar ?? null,
  };
}

async function responseCountFor(
  ctx: any,
  flareId: Id<"flares">,
): Promise<number> {
  const rs = await ctx.db
    .query("flareResponses")
    .withIndex("by_flare_created", (q: any) => q.eq("flareId", flareId))
    .collect();
  return rs.length;
}

async function requireUser(ctx: any): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthenticated");
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
    .first();
  if (!user) throw new Error("User not found");
  return user;
}

async function maybeUser(ctx: any): Promise<Doc<"users"> | null> {
  try {
    return await requireUser(ctx);
  } catch {
    return null;
  }
}
