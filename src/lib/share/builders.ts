/**
 * Share-intent URL builders.
 *
 * Pure functions only. Each builder takes a normalised `ShareablePayload`
 * and returns a fully-encoded URL the browser can navigate to. We use
 * each platform's official intent endpoint so no OAuth is required —
 * the user lands in their own composer with the post pre-filled.
 *
 * Platform compose-window character limits are enforced here so that
 * a long-form idea description doesn't silently get truncated by the
 * target site (X is particularly merciless about this).
 */

import type { ShareablePayload, SharePlatform } from "./types";

/** Hard limits the target platforms enforce on the composer text. */
const COMPOSER_LIMITS_CHARS: Record<SharePlatform, number> = {
  twitter: 240, // 280 minus ~40 for the auto-appended URL
  linkedin: 700,
  instagram: 2200, // Instagram caption hard cap
  whatsapp: 4000,
  facebook: 600,
  email: 5000,
  copy: Number.POSITIVE_INFINITY,
  native: Number.POSITIVE_INFINITY,
};

// ─────────────────────────────────────────────────────────────────────
// Public: builder dispatch
// ─────────────────────────────────────────────────────────────────────

/**
 * Build the share URL for a given platform. For `copy` and `native`,
 * returns `null` — those flows do not navigate.
 */
export function buildShareUrl(
  platform: SharePlatform,
  payload: ShareablePayload,
): string | null {
  switch (platform) {
    case "twitter":
      return twitterIntent(payload);
    case "linkedin":
      return linkedinIntent(payload);
    case "instagram":
      return instagramIntent(payload);
    case "whatsapp":
      return whatsappIntent(payload);
    case "facebook":
      return facebookIntent(payload);
    case "email":
      return emailIntent(payload);
    case "copy":
    case "native":
      return null;
  }
}

// ─────────────────────────────────────────────────────────────────────
// Platform builders
// ─────────────────────────────────────────────────────────────────────

function twitterIntent(payload: ShareablePayload): string {
  // X's intent endpoint appends the URL automatically; supplying it
  // both in `text` and `url` would double up. We pass them separately.
  const text = composeText(payload, "twitter");
  const params = new URLSearchParams();
  params.set("text", text);
  if (payload.url) params.set("url", payload.url);
  if (payload.hashtags?.length) {
    params.set("hashtags", payload.hashtags.join(","));
  }
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

function linkedinIntent(payload: ShareablePayload): string {
  // LinkedIn's modern share endpoint takes only the URL — its preview
  // is driven by the target page's Open Graph tags. We still expose a
  // `text` param for older surface area.
  const params = new URLSearchParams();
  if (payload.url) params.set("url", payload.url);
  return `https://www.linkedin.com/sharing/share-offsite/?${params.toString()}`;
}

function instagramIntent(_payload: ShareablePayload): string {
  // Instagram has no public web share-intent endpoint. The closest
  // honest path is: open Instagram's "create" page in a new tab so
  // the user can paste the caption they've already had us copy to
  // their clipboard (see crossPost.ts — instagram path triggers a
  // navigator.clipboard.writeText before opening the URL).
  //
  // On mobile devices with the Instagram app installed, this URL
  // typically deep-links to Instagram via the OS scheme handler.
  return "https://www.instagram.com/";
}

function whatsappIntent(payload: ShareablePayload): string {
  // Mobile and desktop WhatsApp Web both accept the wa.me intent.
  const text = composeText(payload, "whatsapp", { includeUrl: true });
  const params = new URLSearchParams();
  params.set("text", text);
  return `https://wa.me/?${params.toString()}`;
}

function facebookIntent(payload: ShareablePayload): string {
  // Facebook's sharer is driven by the URL's OG tags; `quote` is
  // accepted but is increasingly ignored — kept for completeness.
  const params = new URLSearchParams();
  if (payload.url) params.set("u", payload.url);
  if (payload.text) params.set("quote", payload.text);
  return `https://www.facebook.com/sharer/sharer.php?${params.toString()}`;
}

function emailIntent(payload: ShareablePayload): string {
  const subject = payload.title ?? "Take a look at this";
  const body = composeText(payload, "email", { includeUrl: true });
  const params = new URLSearchParams();
  params.set("subject", subject);
  params.set("body", body);
  return `mailto:?${params.toString()}`;
}

// ─────────────────────────────────────────────────────────────────────
// Text composition
// ─────────────────────────────────────────────────────────────────────

interface ComposeOpts {
  /** Append the URL to the text body. Default false (some platforms
   *  append URL via a separate field). */
  includeUrl?: boolean;
}

/**
 * Combine title + text + (optionally) URL within the platform's limit.
 * Order of truncation:
 *   1. Drop the description body
 *   2. Keep title and URL
 *   3. Fall back to URL alone
 *
 * The platform limit is conservative so the user never sees a "too
 * long" error in the destination composer.
 */
export function composeText(
  payload: ShareablePayload,
  platform: SharePlatform,
  opts: ComposeOpts = {},
): string {
  const limit = COMPOSER_LIMITS_CHARS[platform];
  const payloadUrl = payload.url ?? "";
  const includeUrlInline = opts.includeUrl ?? false;

  const parts: string[] = [];
  if (payload.title) parts.push(payload.title);
  if (payload.text) parts.push(payload.text);
  if (includeUrlInline && payloadUrl) parts.push(payloadUrl);

  const joined = parts.filter(Boolean).join("\n\n");
  if (joined.length <= limit) return joined;

  // Drop the body and try again.
  const withoutBody = [payload.title, includeUrlInline ? payloadUrl : null]
    .filter(Boolean)
    .join("\n\n");
  if (withoutBody.length <= limit) return withoutBody;

  // Drop the title; URL only (always falls back to URL when available).
  if (payloadUrl && payloadUrl.length <= limit) return payloadUrl;

  // URL itself is too long — truncate (extreme edge).
  return payloadUrl.slice(0, limit);
}

// ─────────────────────────────────────────────────────────────────────
// Capability detection
// ─────────────────────────────────────────────────────────────────────

/**
 * Whether the current browser supports the Web Share API. True on
 * most mobile browsers and Safari on macOS; false on most desktop
 * browsers. Use in components to swap "Share to…" tiles for a single
 * native "Share" button when available.
 */
export function canUseWebShare(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function"
  );
}
