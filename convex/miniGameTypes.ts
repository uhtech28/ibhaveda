/**
 * Shared TypeScript contracts for the mini-game system. Hand-written
 * so client + server use the same shapes without round-tripping
 * through the Convex value system.
 */

import type { Id } from "./_generated/dataModel";
import type { MiniGameArchetype } from "./miniGameConstants";

/**
 * Reward payload returned from `completeSession`. The shape is a
 * discriminated union so future reward types (cosmetics, portal
 * destinations) layer in without breaking the existing `xp` branch.
 *
 * v1 emits only the `xp` variant; the `cosmetic` and `portal`
 * variants exist in the type so the server can start emitting them
 * later without a client release.
 */
export type MiniGameReward =
  | { kind: "xp"; amount: number }
  | { kind: "cosmetic"; cosmeticId: string; label: string }
  | { kind: "portal"; sceneKey: string; label: string };

/**
 * The result the Phaser scene returns to React when a session ends.
 * The React layer forwards this to the `completeSession` mutation.
 */
export interface MiniGameSceneResult {
  /** True if the user finished the win condition (not aborted, not timed out). */
  completed: boolean;
  /** Numeric score — meaning depends on the archetype. */
  score: number;
  /** Maximum possible score for this difficulty. */
  maxScore: number;
  /** Wall-clock duration in ms. */
  durationMs: number;
  /** Archetype-specific extra signals for anti-cheat analysis. */
  extra: PatternMatchExtra | ReflexTapExtra | DecryptExtra;
}

export interface PatternMatchExtra {
  archetype: "pattern_match";
  sequenceLength: number;
  stepsCompleted: number;
}

export interface ReflexTapExtra {
  archetype: "reflex_tap";
  targetsHit: number;
  targetsMissed: number;
  targetsTotal: number;
}

export interface DecryptExtra {
  archetype: "decrypt";
  cipherLength: number;
  guessesUsed: number;
  maxGuesses: number;
}

/**
 * Public-facing session shape exposed to the client during play.
 */
export interface MiniGameSessionView {
  _id: Id<"miniGameSessions">;
  spawnPointId: string;
  archetype: MiniGameArchetype;
  difficulty: 1 | 2 | 3 | 4 | 5;
  ventureId: Id<"ventures"> | null;
  startedAt: number;
  status: "active" | "completed" | "abandoned";
}

/**
 * Final outcome view returned by `completeSession`.
 */
export interface MiniGameCompletionView {
  sessionId: Id<"miniGameSessions">;
  spawnPointId: string;
  archetype: MiniGameArchetype;
  difficulty: 1 | 2 | 3 | 4 | 5;
  outcome: "won" | "lost";
  scoreNormalized: number;
  reward: MiniGameReward;
  flagged: boolean;
  flagReason: string | null;
}
