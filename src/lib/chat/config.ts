/**
 * Chat configuration knobs (PRD §10).
 *
 * Centralised so the rules can be changed without grepping the
 * codebase. PRD §10.3 explicitly calls out "history-visibility rules
 * are defined in constants/config" — that lives here.
 *
 * NOTE: The image-upload constraints already live in
 * `src/lib/chat/imageUpload.ts` under `CHAT_IMAGE_CONSTRAINTS`. This
 * file covers everything else.
 */

export const CHAT_HISTORY_VISIBILITY = {
  /**
   * What a newly added channel member sees.
   *
   *   "from_join_forward" — only messages created at or after the
   *                         member's joinedAt are visible. PRD §10.3
   *                         default.
   *   "full_history"      — all messages in the channel are visible,
   *                         including those before they joined.
   *
   * Implemented in `convex/chat.ts` → `getConversationMessages`.
   */
  mode: "from_join_forward" as "from_join_forward" | "full_history",
} as const;

/**
 * Channel-membership rules (PRD §10.3).
 */
export const CHAT_CHANNEL_MEMBERSHIP = {
  /** Idempotent duplicate-add: silently no-op rather than error. */
  silentDuplicateAdd: true,

  /** Project author is always implicitly a channel member. */
  authorAlwaysMember: true,

  /**
   * When a contributor is removed from the parent project, remove
   * them from every channel of that project. Per PRD §10.3 edge
   * cases.
   */
  cascadeRemoveOnProjectRemoval: true,
} as const;
