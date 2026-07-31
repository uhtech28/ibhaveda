/**
 * @file convex/socialConnections.ts
 * @description Queries + mutations for the socialConnections table.
 *
 * Third-party token storage for the auto-cross-post ("double posting")
 * feature. Rows are written by the OAuth callback route
 * (`/api/social/[provider]/callback`) after the user grants access,
 * and read by:
 *   - the Settings dialog (to render "Connected as <name>" state)
 *   - the auto-post action (to look up the token + refresh if needed)
 *
 * Tokens are stored raw right now — before shipping this to prod,
 * wrap read/write in Convex env-secret-based AES-GCM so a DB dump
 * can't be used to hijack accounts.
 */

import { v } from "convex/values";
import { mutation, query, internalQuery, internalMutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

const PLATFORMS = v.union(
  v.literal("linkedin"),
  v.literal("twitter"),
  v.literal("facebook"),
  v.literal("instagram"),
);

// ─────────────────────────────────────────────────────────────────────
// Public queries
// ─────────────────────────────────────────────────────────────────────

/**
 * Every connection for the current user (masked — never returns raw
 * tokens to the client). Used by the Settings dialog to render the
 * per-platform "Connected as <name>" chips.
 */
export const listMyConnections = query({
  args: {},
  handler: async ({ db, auth }) => {
    const identity = await auth.getUserIdentity();
    if (!identity) return [] as const;
    const me = await db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
      .first();
    if (!me) return [] as const;
    const rows = await db
      .query("socialConnections")
      .withIndex("by_user", (q) => q.eq("userId", me._id))
      .collect();
    // Strip tokens before returning to client. The token is only ever
    // needed server-side inside the auto-post action.
    return rows.map((r) => ({
      _id: r._id,
      platform: r.platform,
      providerAccountId: r.providerAccountId,
      providerDisplayName: r.providerDisplayName,
      autoPost: r.autoPost,
      connectedAt: r.connectedAt,
      lastPostedAt: r.lastPostedAt,
      expiresAt: r.expiresAt,
    }));
  },
});

// ─────────────────────────────────────────────────────────────────────
// Public mutations
// ─────────────────────────────────────────────────────────────────────

/**
 * Toggle the per-platform autoPost flag without disconnecting. Called
 * from the Settings dialog switch.
 */
export const setAutoPost = mutation({
  args: {
    connectionId: v.id("socialConnections"),
    autoPost: v.boolean(),
  },
  handler: async ({ db, auth }, { connectionId, autoPost }) => {
    const identity = await auth.getUserIdentity();
    if (!identity) throw new Error("Not signed in");
    const me = await db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
      .first();
    if (!me) throw new Error("User not found");
    const row = await db.get(connectionId);
    if (!row) throw new Error("Connection not found");
    if (row.userId !== me._id) throw new Error("Not your connection");
    await db.patch(connectionId, { autoPost });
    return { ok: true } as const;
  },
});

/**
 * Delete a connection — revokes auto-posting on that platform.
 * Note: does NOT call the provider's revoke endpoint. That's a
 * platform-specific follow-up (LinkedIn: DELETE /revoke, X: POST
 * /oauth2/revoke). For MVP we just drop the row; the user's third-
 * party app management still has to be used to fully revoke access.
 */
export const disconnect = mutation({
  args: { connectionId: v.id("socialConnections") },
  handler: async ({ db, auth }, { connectionId }) => {
    const identity = await auth.getUserIdentity();
    if (!identity) throw new Error("Not signed in");
    const me = await db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
      .first();
    if (!me) throw new Error("User not found");
    const row = await db.get(connectionId);
    if (!row) return { ok: true } as const;
    if (row.userId !== me._id) throw new Error("Not your connection");
    await db.delete(connectionId);
    return { ok: true } as const;
  },
});

// ─────────────────────────────────────────────────────────────────────
// Internal — used by OAuth callbacks + auto-post action
// ─────────────────────────────────────────────────────────────────────

/**
 * Upsert a connection after the OAuth callback exchanges a code for
 * tokens. Called from the Next.js API route via the Convex HTTP
 * client with the internal function token.
 */
export const internalUpsertConnection = internalMutation({
  args: {
    userId: v.id("users"),
    platform: PLATFORMS,
    providerAccountId: v.string(),
    providerDisplayName: v.optional(v.string()),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    scope: v.optional(v.string()),
    meta: v.optional(v.string()),
  },
  handler: async ({ db }, args) => {
    const existing = await db
      .query("socialConnections")
      .withIndex("by_user_platform", (q) =>
        q.eq("userId", args.userId).eq("platform", args.platform),
      )
      .first();
    if (existing) {
      await db.patch(existing._id, {
        providerAccountId: args.providerAccountId,
        providerDisplayName: args.providerDisplayName,
        accessToken: args.accessToken,
        refreshToken: args.refreshToken ?? existing.refreshToken,
        expiresAt: args.expiresAt,
        scope: args.scope,
        meta: args.meta ?? existing.meta,
        // Reconnecting a platform re-enables auto-post — user probably
        // reconnected because they wanted it working again.
        autoPost: true,
      });
      return existing._id;
    }
    return await db.insert("socialConnections", {
      userId: args.userId,
      platform: args.platform,
      providerAccountId: args.providerAccountId,
      providerDisplayName: args.providerDisplayName,
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      expiresAt: args.expiresAt,
      scope: args.scope,
      meta: args.meta,
      autoPost: true,
      connectedAt: Date.now(),
    });
  },
});

/**
 * Read all active auto-post-enabled connections for a user. Called by
 * the auto-post action to know which platforms to publish to.
 */
export const internalGetActiveConnectionsForUser = internalQuery({
  args: { userId: v.id("users") },
  handler: async ({ db }, { userId }) => {
    const rows = await db
      .query("socialConnections")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return rows.filter((r) => r.autoPost === true);
  },
});

/**
 * Record the outcome of an auto-post attempt. Called by the action
 * after each provider POST completes (or errors). Also patches the
 * connection's `lastPostedAt` on success so the Settings dialog can
 * show a "last used" timestamp.
 */
export const internalRecordAttempt = internalMutation({
  args: {
    userId: v.id("users"),
    ideaId: v.id("ideas"),
    platform: PLATFORMS,
    status: v.union(
      v.literal("ok"),
      v.literal("skipped"),
      v.literal("failed"),
    ),
    providerPostId: v.optional(v.string()),
    providerPostUrl: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  },
  handler: async ({ db }, args) => {
    await db.insert("socialAutoPostAttempts", {
      userId: args.userId,
      ideaId: args.ideaId,
      platform: args.platform,
      status: args.status,
      providerPostId: args.providerPostId,
      providerPostUrl: args.providerPostUrl,
      errorMessage: args.errorMessage,
      attemptedAt: Date.now(),
    });
    if (args.status === "ok") {
      const conn = await db
        .query("socialConnections")
        .withIndex("by_user_platform", (q) =>
          q.eq("userId", args.userId).eq("platform", args.platform),
        )
        .first();
      if (conn) await db.patch(conn._id, { lastPostedAt: Date.now() });
    }
    return null;
  },
});

/**
 * After a provider refresh flow gives us a new accessToken, patch the
 * connection row in place so subsequent calls use the fresh token.
 */
export const internalUpdateTokens = internalMutation({
  args: {
    connectionId: v.id("socialConnections"),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  },
  handler: async ({ db }, args) => {
    await db.patch(args.connectionId, {
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      expiresAt: args.expiresAt,
    });
  },
});

// Type export used by the socialAutoPost action.
export type ActiveConnection = {
  _id: Id<"socialConnections">;
  userId: Id<"users">;
  platform: "linkedin" | "twitter" | "facebook" | "instagram";
  providerAccountId: string;
  providerDisplayName?: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  autoPost: boolean;
  meta?: string;
};
