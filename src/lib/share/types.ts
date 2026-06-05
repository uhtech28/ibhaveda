/**
 * Shared TypeScript contracts for the share feature.
 */

export type SharePlatform =
  | "twitter"
  | "linkedin"
  | "instagram"
  | "facebook"
  | "whatsapp"
  | "email"
  | "copy"
  | "native";

/**
 * Normalised content payload passed to every share path.
 * Builders consume this; UI components produce it from domain
 * objects (idea, venture, etc.).
 */
export interface ShareablePayload {
  /** Short title — used as email subject, prefix of composer text. */
  title?: string;
  /** Longer description body. Truncated per platform limits. */
  text?: string;
  /** Canonical URL. Required for X/LinkedIn/Facebook previews. */
  url?: string;
  /** Optional hashtag list (no `#` prefix). Used by X only. */
  hashtags?: string[];
}
