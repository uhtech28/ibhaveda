/**
 * Native video posts — upload, feed, and lifecycle.
 *
 * Client flow:
 *   1. `generateUploadUrl` — mint a Convex storage URL for the video binary
 *   2. `generatePosterUploadUrl` — mint a Convex storage URL for the poster image
 *   3. Client uploads both binaries directly to storage
 *   4. `createVideoPost` — record the post with both storage ids + metadata
 *   5. `getFeed` returns the global feed; `getMyVideos` returns the user's own posts
 *
 * Validation is duplicated between client and server: the client gives
 * instant feedback ("too long, trim and retry"); the server enforces
 * the same limits so a malicious client can't bypass.
 *
 * Soft delete: `deleteVideo` sets `isDeleted = true`. Storage objects
 * stay around until a separate purge cron clears them (out of scope
 * for v1).
 */

import { v } from "convex/values";
import {
  action,
  mutation,
  query,
} from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

// ─────────────────────────────────────────────────────────────────────
// Limits (mirrored in src/lib/video/videoUpload.ts)
// ─────────────────────────────────────────────────────────────────────

// PRD §5.2 — caps deliberately tight for v1.
// Easily widened later by changing these constants — pipeline does not
// assume them anywhere else, so per-tier caps can be layered on top.
const VIDEO_MAX_BYTES = 25 * 1024 * 1024; // 25 MB
const VIDEO_MAX_DURATION_MS = 30_000; // 30 s
const VIDEO_MAX_DIMENSION_PX = 1920;
const VIDEO_ALLOWED_MIME = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const;

// ─────────────────────────────────────────────────────────────────────
// Upload URL minting
// ─────────────────────────────────────────────────────────────────────

export const generateUploadUrl = action({
  args: {},
  handler: async (ctx): Promise<string> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    return await ctx.storage.generateUploadUrl();
  },
});

export const generatePosterUploadUrl = action({
  args: {},
  handler: async (ctx): Promise<string> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    return await ctx.storage.generateUploadUrl();
  },
});

// ─────────────────────────────────────────────────────────────────────
// Record a new video post
// ─────────────────────────────────────────────────────────────────────

export const createVideoPost = mutation({
  args: {
    storageId: v.id("_storage"),
    posterStorageId: v.id("_storage"),
    durationMs: v.number(),
    width: v.number(),
    height: v.number(),
    mimeType: v.string(),
    bytes: v.number(),
    caption: v.optional(v.string()),
    ideaId: v.optional(v.id("ideas")),
    ventureId: v.optional(v.id("ventures")),
    visibility: v.optional(v.union(v.literal("public"), v.literal("unlisted"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    // Validate metadata before committing the row.
    if (args.durationMs <= 0 || args.durationMs > VIDEO_MAX_DURATION_MS) {
      throw new Error(
        `Video must be between 1ms and ${VIDEO_MAX_DURATION_MS}ms`,
      );
    }
    if (args.bytes <= 0 || args.bytes > VIDEO_MAX_BYTES) {
      throw new Error(`Video must be under ${VIDEO_MAX_BYTES} bytes`);
    }
    if (
      args.width <= 0 ||
      args.height <= 0 ||
      args.width > VIDEO_MAX_DIMENSION_PX ||
      args.height > VIDEO_MAX_DIMENSION_PX
    ) {
      throw new Error("Video dimensions out of allowed range");
    }
    if (!VIDEO_ALLOWED_MIME.includes(args.mimeType as any)) {
      throw new Error(`Unsupported video format: ${args.mimeType}`);
    }

    // Confirm both storage objects resolve — catches a bad upload
    // before the post is published.
    const videoUrl = await ctx.storage.getUrl(args.storageId);
    if (!videoUrl) throw new Error("Uploaded video not found in storage");
    const posterUrl = await ctx.storage.getUrl(args.posterStorageId);
    if (!posterUrl) throw new Error("Uploaded poster not found in storage");

    const now = Date.now();
    const videoId = await ctx.db.insert("videos", {
      uploaderId: user._id,
      provider: "convex",
      storageId: args.storageId,
      posterStorageId: args.posterStorageId,
      processingStatus: "ready",
      durationMs: args.durationMs,
      width: args.width,
      height: args.height,
      mimeType: args.mimeType,
      bytes: args.bytes,
      caption: args.caption?.trim(),
      ideaId: args.ideaId,
      ventureId: args.ventureId,
      visibility: args.visibility ?? "public",
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    });

    return videoId;
  },
});

// ─────────────────────────────────────────────────────────────────────
// Managed-service entrypoints (PRD §5.3 — Mux / Cloudflare Stream)
// ─────────────────────────────────────────────────────────────────────

/**
 * Mint a direct-upload URL from the configured managed video service
 * (Mux or Cloudflare Stream). The client uploads its file straight to
 * the service, not through this app's infrastructure (AC3).
 *
 * Configuration via env vars on the Convex deployment:
 *   VIDEO_PROVIDER         "mux" | "cloudflare"   — pick the service
 *   MUX_TOKEN_ID, MUX_TOKEN_SECRET                — Mux credentials
 *   CLOUDFLARE_STREAM_ACCOUNT_ID, CLOUDFLARE_STREAM_TOKEN
 *
 * Returns `{ uploadUrl, uploadId, provider }`. The client uploads to
 * `uploadUrl`, then calls `createVideoPostFromManagedService` with
 * `uploadId` once upload completes.
 */
export const generateDirectUploadUrl = action({
  args: {},
  handler: async (
    ctx,
  ): Promise<{
    uploadUrl: string;
    uploadId: string;
    provider: "mux" | "cloudflare";
  }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const provider = (process.env.VIDEO_PROVIDER ?? "").toLowerCase();
    if (provider === "mux") {
      const id = process.env.MUX_TOKEN_ID;
      const secret = process.env.MUX_TOKEN_SECRET;
      if (!id || !secret) {
        throw new Error(
          "MUX_TOKEN_ID and MUX_TOKEN_SECRET must be set to use the Mux provider.",
        );
      }
      // Mux Direct Uploads API. The client PUTs the file to `data.url`,
      // then the service emits a webhook + the upload row gets a
      // playback id we can poll for via the Mux Asset API.
      const auth = Buffer.from(`${id}:${secret}`).toString("base64");
      const resp = await fetch("https://api.mux.com/video/v1/uploads", {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cors_origin: "*",
          new_asset_settings: {
            playback_policy: ["public"],
            max_resolution_tier: "1080p",
          },
        }),
      });
      if (!resp.ok) {
        throw new Error(`Mux upload create failed: ${resp.status} ${await resp.text()}`);
      }
      const json = (await resp.json()) as {
        data: { id: string; url: string };
      };
      return { uploadUrl: json.data.url, uploadId: json.data.id, provider: "mux" };
    }

    if (provider === "cloudflare") {
      const accountId = process.env.CLOUDFLARE_STREAM_ACCOUNT_ID;
      const token = process.env.CLOUDFLARE_STREAM_TOKEN;
      if (!accountId || !token) {
        throw new Error(
          "CLOUDFLARE_STREAM_ACCOUNT_ID and CLOUDFLARE_STREAM_TOKEN must be set.",
        );
      }
      const resp = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/direct_upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            maxDurationSeconds: 30,
            expiry: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          }),
        },
      );
      if (!resp.ok) {
        throw new Error(
          `Cloudflare Stream upload create failed: ${resp.status} ${await resp.text()}`,
        );
      }
      const json = (await resp.json()) as {
        result: { uploadURL: string; uid: string };
      };
      return {
        uploadUrl: json.result.uploadURL,
        uploadId: json.result.uid,
        provider: "cloudflare",
      };
    }

    throw new Error(
      "No managed video provider configured. Set VIDEO_PROVIDER=mux or cloudflare on the Convex deployment.",
    );
  },
});

/**
 * Finalize a managed-service upload — store playback metadata.
 * Called by the client after the upload finishes. The actual `ready`
 * state may be deferred (transcoding); PRD §5.4 says the card shows
 * the processing state until ready.
 */
export const createVideoPostFromManagedService = mutation({
  args: {
    provider: v.union(v.literal("mux"), v.literal("cloudflare")),
    uploadId: v.string(),
    playbackId: v.string(),
    playbackUrl: v.string(),
    thumbnailUrl: v.string(),
    durationMs: v.number(),
    width: v.number(),
    height: v.number(),
    bytes: v.number(),
    mimeType: v.string(),
    caption: v.optional(v.string()),
    ideaId: v.optional(v.id("ideas")),
    ventureId: v.optional(v.id("ventures")),
    visibility: v.optional(v.union(v.literal("public"), v.literal("unlisted"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    if (args.durationMs <= 0 || args.durationMs > VIDEO_MAX_DURATION_MS) {
      throw new Error(`Video must be ≤ ${VIDEO_MAX_DURATION_MS}ms`);
    }
    if (args.bytes <= 0 || args.bytes > VIDEO_MAX_BYTES) {
      throw new Error(`Video must be ≤ ${VIDEO_MAX_BYTES} bytes`);
    }

    const now = Date.now();
    const videoId = await ctx.db.insert("videos", {
      uploaderId: user._id,
      provider: args.provider,
      playbackId: args.playbackId,
      playbackUrl: args.playbackUrl,
      thumbnailUrl: args.thumbnailUrl,
      processingStatus: "processing",
      durationMs: args.durationMs,
      width: args.width,
      height: args.height,
      mimeType: args.mimeType,
      bytes: args.bytes,
      caption: args.caption?.trim(),
      ideaId: args.ideaId,
      ventureId: args.ventureId,
      visibility: args.visibility ?? "public",
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    });
    return videoId;
  },
});

/** Mark a managed-service upload as ready. Called either by a webhook
 *  handler or by client polling once the service reports completion. */
export const markVideoReady = mutation({
  args: {
    videoId: v.id("videos"),
    thumbnailUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.videoId, {
      processingStatus: "ready",
      ...(args.thumbnailUrl ? { thumbnailUrl: args.thumbnailUrl } : {}),
      updatedAt: Date.now(),
    });
  },
});

// ─────────────────────────────────────────────────────────────────────
// Feed queries
// ─────────────────────────────────────────────────────────────────────

export interface FeedVideo {
  _id: Id<"videos">;
  durationMs: number;
  width: number;
  height: number;
  mimeType: string;
  caption: string | null;
  createdAt: number;
  posterUrl: string | null;
  videoUrl: string | null;
  /** Mux / Cloudflare HLS .m3u8 URL when provider is a managed service. */
  playbackUrl: string | null;
  provider: "convex" | "mux" | "cloudflare" | null;
  processingStatus: "uploading" | "processing" | "ready" | "errored" | null;
  uploader: {
    _id: Id<"users">;
    displayName: string;
    username: string | null;
    avatar: string | null;
  };
  isOwnedByViewer: boolean;
}

/**
 * Global public video feed, newest first.
 */
export const getFeed = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }): Promise<FeedVideo[]> => {
    const viewerId = await maybeViewerId(ctx);
    const cap = Math.min(limit ?? 20, 50);

    const rows = await ctx.db
      .query("videos")
      .withIndex("by_visibility_created", (q) => q.eq("visibility", "public"))
      .order("desc")
      .take(cap * 2); // overfetch a bit so deleted rows don't shrink the page

    const visible = rows.filter((r) => !r.isDeleted).slice(0, cap);
    return await Promise.all(visible.map((r) => hydrate(ctx, r, viewerId)));
  },
});

/**
 * Current user's own videos, newest first. Includes both public and
 * unlisted, and shows deleted-but-not-purged rows so the owner can
 * undo.
 */
export const getMyVideos = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }): Promise<FeedVideo[]> => {
    const viewerId = await maybeViewerId(ctx);
    if (!viewerId) return [];
    const cap = Math.min(limit ?? 20, 50);

    const rows = await ctx.db
      .query("videos")
      .withIndex("by_uploader_created", (q) => q.eq("uploaderId", viewerId))
      .order("desc")
      .take(cap);

    return await Promise.all(rows.map((r) => hydrate(ctx, r, viewerId)));
  },
});

/**
 * Single video by id — used when a post URL is shared directly.
 */
export const getVideo = query({
  args: { videoId: v.id("videos") },
  handler: async (ctx, { videoId }) => {
    const row = await ctx.db.get(videoId);
    if (!row || row.isDeleted) return null;
    if (row.visibility !== "public") {
      const viewerId = await maybeViewerId(ctx);
      if (viewerId !== row.uploaderId) return null;
    }
    return await hydrate(ctx, row, await maybeViewerId(ctx));
  },
});

// ─────────────────────────────────────────────────────────────────────
// Owner actions
// ─────────────────────────────────────────────────────────────────────

export const deleteVideo = mutation({
  args: { videoId: v.id("videos") },
  handler: async (ctx, { videoId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const video = await ctx.db.get(videoId);
    if (!video) throw new Error("Video not found");
    if (video.uploaderId !== user._id) {
      throw new Error("Only the owner can delete this video");
    }

    await ctx.db.patch(videoId, {
      isDeleted: true,
      updatedAt: Date.now(),
    });
    return { ok: true };
  },
});

// ─────────────────────────────────────────────────────────────────────
// Hydration helpers
// ─────────────────────────────────────────────────────────────────────

async function hydrate(
  ctx: any,
  row: Doc<"videos">,
  viewerId: Id<"users"> | null,
): Promise<FeedVideo> {
  const uploader = await ctx.db.get(row.uploaderId);

  // Resolve playback assets based on provider. Managed-service videos
  // use the HLS URL + service-generated thumbnail directly. Convex-storage
  // videos resolve short-lived signed URLs through ctx.storage.
  let videoUrl: string | null = null;
  let posterUrl: string | null = null;
  let playbackUrl: string | null = null;

  if (row.provider === "mux" || row.provider === "cloudflare") {
    playbackUrl = row.playbackUrl ?? null;
    posterUrl = row.thumbnailUrl ?? null;
  } else {
    // Default + back-compat with existing rows (no provider field).
    if (row.storageId) {
      videoUrl = (await ctx.storage.getUrl(row.storageId)) ?? null;
    }
    if (row.posterStorageId) {
      posterUrl = (await ctx.storage.getUrl(row.posterStorageId)) ?? null;
    }
  }

  return {
    _id: row._id,
    durationMs: row.durationMs,
    width: row.width,
    height: row.height,
    mimeType: row.mimeType,
    caption: row.caption ?? null,
    createdAt: row.createdAt,
    posterUrl,
    videoUrl,
    playbackUrl,
    provider: row.provider ?? "convex",
    processingStatus: row.processingStatus ?? "ready",
    uploader: {
      _id: row.uploaderId,
      displayName: uploader?.displayName ?? "Anonymous",
      username: uploader?.username ?? null,
      avatar: uploader?.avatar ?? null,
    },
    isOwnedByViewer: viewerId !== null && row.uploaderId === viewerId,
  };
}

async function maybeViewerId(ctx: any): Promise<Id<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
    .first();
  return user?._id ?? null;
}
