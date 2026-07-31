/**
 * @file convex/socialAutoPost.ts
 * @description Convex action that publishes a newly-created idea to
 * every social platform the user has connected + toggled on.
 *
 * Called by scheduler from `ideas.createIdea` after the idea is
 * persisted. Runs fire-and-forget — a provider failure never blocks
 * the primary idea-creation mutation.
 *
 * Per-platform posting logic lives in one helper per provider so
 * each one can evolve independently (LinkedIn UGC posts, X v2 tweets,
 * FB Graph feed posts, IG Business media containers).
 *
 * Silent-skip contract: if a connection doesn't exist OR the platform
 * env credentials aren't set OR the API returns a 401, we log an
 * attempt row with status=skipped/failed and move on. No exceptions
 * propagate back to the mutation.
 */

"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

type Platform = "linkedin" | "twitter" | "facebook" | "instagram";

interface PostResult {
  status: "ok" | "skipped" | "failed";
  providerPostId?: string;
  providerPostUrl?: string;
  errorMessage?: string;
}

// ─────────────────────────────────────────────────────────────────────
// The dispatcher — the only exported action.
// ─────────────────────────────────────────────────────────────────────

export const publishIdeaToConnectedSocials = internalAction({
  args: {
    userId: v.id("users"),
    ideaId: v.id("ideas"),
    title: v.string(),
    description: v.string(),
    ideaUrl: v.string(),
  },
  handler: async (
    ctx,
    { userId, ideaId, title, description, ideaUrl },
  ): Promise<{ attempted: number }> => {
    const connections = (await ctx.runQuery(
      internal.socialConnections.internalGetActiveConnectionsForUser,
      { userId },
    )) as Array<{
      _id: Id<"socialConnections">;
      platform: Platform;
      accessToken: string;
      refreshToken?: string;
      providerAccountId: string;
      expiresAt?: number;
      meta?: string;
    }>;

    if (connections.length === 0) return { attempted: 0 };

    // Compose the payload once — every provider gets the same base
    // text but adapts formatting (LinkedIn: paragraphs, X: 280-char
    // truncation, FB: full text).
    const payload = { title, description, ideaUrl };

    // Fan out in parallel — one provider failing doesn't block the
    // others. Each helper returns a PostResult which is recorded via
    // internalRecordAttempt.
    await Promise.all(
      connections.map(async (conn) => {
        let result: PostResult;
        try {
          switch (conn.platform) {
            case "linkedin":
              result = await postToLinkedIn(conn, payload);
              break;
            case "twitter":
              result = await postToTwitter(conn, payload);
              break;
            case "facebook":
              result = await postToFacebook(conn, payload);
              break;
            case "instagram":
              result = await postToInstagram(conn, payload);
              break;
            default:
              result = {
                status: "skipped",
                errorMessage: `Unknown platform: ${conn.platform}`,
              };
          }
        } catch (err) {
          result = {
            status: "failed",
            errorMessage:
              err instanceof Error ? err.message : String(err),
          };
        }
        await ctx.runMutation(
          internal.socialConnections.internalRecordAttempt,
          {
            userId,
            ideaId,
            platform: conn.platform,
            status: result.status,
            providerPostId: result.providerPostId,
            providerPostUrl: result.providerPostUrl,
            errorMessage: result.errorMessage,
          },
        );
      }),
    );

    return { attempted: connections.length };
  },
});

// ─────────────────────────────────────────────────────────────────────
// Per-provider posters
// Each returns a PostResult and NEVER throws — the caller catches
// unexpected throws but a well-behaved poster reports its own errors
// so the attempt log is precise.
// ─────────────────────────────────────────────────────────────────────

interface Payload {
  title: string;
  description: string;
  ideaUrl: string;
}

/**
 * LinkedIn — UGC posts via /v2/ugcPosts.
 * OAuth scopes needed: `w_member_social` (post as user) +
 * `openid profile email` (to know their URN at connect time).
 * Docs: https://learn.microsoft.com/en-us/linkedin/marketing/integrations/community-management/shares/ugc-post-api
 */
async function postToLinkedIn(
  conn: { accessToken: string; providerAccountId: string },
  { title, description, ideaUrl }: Payload,
): Promise<PostResult> {
  if (!conn.providerAccountId || !conn.accessToken) {
    return { status: "skipped", errorMessage: "Missing LinkedIn credentials" };
  }
  const text = truncate(
    `${title}\n\n${description}\n\n${ideaUrl}`,
    3000,
  );
  const body = {
    author: `urn:li:person:${conn.providerAccountId}`,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text },
        shareMediaCategory: "ARTICLE",
        media: [
          {
            status: "READY",
            originalUrl: ideaUrl,
            title: { text: title.slice(0, 200) },
          },
        ],
      },
    },
    visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
  };
  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${conn.accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    return {
      status: "failed",
      errorMessage: `LinkedIn ${res.status}: ${await res.text().catch(() => "")}`,
    };
  }
  const postId = res.headers.get("x-restli-id") ?? undefined;
  return {
    status: "ok",
    providerPostId: postId,
    providerPostUrl: postId
      ? `https://www.linkedin.com/feed/update/${postId}/`
      : undefined,
  };
}

/**
 * X (Twitter) — /2/tweets with OAuth2 user context.
 * Scopes: `tweet.write` `users.read` `offline.access`.
 * Free tier: 1,500 tweets/user/month.
 * Docs: https://docs.x.com/x-api/posts/creation-of-a-post
 */
async function postToTwitter(
  conn: { accessToken: string },
  { title, description, ideaUrl }: Payload,
): Promise<PostResult> {
  if (!conn.accessToken) {
    return { status: "skipped", errorMessage: "Missing X credentials" };
  }
  // 280-char limit — leave room for the URL (23 chars via t.co) + gap.
  const bodyText = truncate(
    `${title}\n\n${description}`,
    280 - 26,
  );
  const text = `${bodyText}\n${ideaUrl}`;
  const res = await fetch("https://api.x.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${conn.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    return {
      status: "failed",
      errorMessage: `X ${res.status}: ${await res.text().catch(() => "")}`,
    };
  }
  const json = (await res.json().catch(() => ({}))) as {
    data?: { id?: string };
  };
  const tweetId = json.data?.id;
  return {
    status: "ok",
    providerPostId: tweetId,
    providerPostUrl: tweetId
      ? `https://x.com/i/web/status/${tweetId}`
      : undefined,
  };
}

/**
 * Facebook — POST /{page-id-or-me}/feed with a User Access Token
 * carrying `publish_actions` (deprecated) or `pages_manage_posts` for
 * Page posting. Personal profile posting is heavily restricted since
 * 2018 — most integrations end up posting to a Page instead.
 *
 * MVP: attempt personal feed post; if it fails with permission error,
 * user should reconnect via a Page.
 */
async function postToFacebook(
  conn: { accessToken: string; providerAccountId: string },
  { title, description, ideaUrl }: Payload,
): Promise<PostResult> {
  if (!conn.accessToken || !conn.providerAccountId) {
    return { status: "skipped", errorMessage: "Missing Facebook credentials" };
  }
  const message = `${title}\n\n${description}`;
  const params = new URLSearchParams({
    message,
    link: ideaUrl,
    access_token: conn.accessToken,
  });
  const res = await fetch(
    `https://graph.facebook.com/v19.0/${conn.providerAccountId}/feed?${params.toString()}`,
    { method: "POST" },
  );
  if (!res.ok) {
    return {
      status: "failed",
      errorMessage: `Facebook ${res.status}: ${await res.text().catch(() => "")}`,
    };
  }
  const json = (await res.json().catch(() => ({}))) as { id?: string };
  return {
    status: "ok",
    providerPostId: json.id,
    providerPostUrl: json.id
      ? `https://www.facebook.com/${json.id}`
      : undefined,
  };
}

/**
 * Instagram — only works for Business/Creator accounts via the Meta
 * Graph API. Requires a two-step flow: (1) create media container,
 * (2) publish it. And requires an image URL (Instagram doesn't allow
 * text-only posts). We'd need to render an OG-style image for each
 * idea, which is out of scope for MVP.
 *
 * For now, silently skip Instagram — the connection exists so the
 * user can be told "your IG is linked but text-only posts can't be
 * auto-published; use the Share panel to open the app manually."
 */
async function postToInstagram(
  _conn: { accessToken: string; providerAccountId: string },
  _payload: Payload,
): Promise<PostResult> {
  return {
    status: "skipped",
    errorMessage:
      "Instagram auto-post disabled: text-only posts unsupported. Use manual share.",
  };
}

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, Math.max(0, max - 1)).trimEnd() + "…";
}
