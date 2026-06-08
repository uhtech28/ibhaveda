/**
 * Shared TypeScript contracts between the combat server and client.
 *
 * Hand-written (not derived from convex/values) because client code
 * reads them in places where the auto-generated Doc shape is either
 * unnecessary or incomplete — e.g. the AI's question payload before
 * persistence, and the round-result view post-settlement.
 */

import type { Id } from "./_generated/dataModel";
import type { CombatTier, ComplexityTier } from "./combatConstants";

/** Persona voice for a question — reuses the existing evaluator registers. */
export type CombatPersona = "villain" | "mentor";

/**
 * Round lifecycle status.
 *
 *   active        — questions still being asked
 *   won           — boss HP reached 0; checkpoint can advance
 *   lost          — player HP hit 0 OR question budget exhausted with boss alive
 *   abandoned     — user closed the panel mid-round (treated as lost)
 *   cap_exhausted — tier monthly cap blocked the round (v1: cap disabled)
 */
export type CombatRoundStatus =
  | "active"
  | "won"
  | "lost"
  | "abandoned"
  | "cap_exhausted";

/** Action taken on a confirmed AI-detection event. */
export type AntiCheatAction = "warning" | "ban";

/**
 * Raw question payload returned by the AI provider before persistence.
 * Used internally by `generateNextQuestion`; clients receive the
 * persisted form via `getRoundState`.
 */
export interface GeneratedQuestion {
  prompt: string;
  persona: CombatPersona;
  complexityTier: ComplexityTier;
  /** Optional duration override; clamped to band floor/ceiling on persist. */
  durationMsHint?: number;
}

/**
 * Client-side keystroke instrumentation captured during answer entry.
 * Bundled with the answer submission so the server can run anti-cheat
 * signals without trusting the client's own classification.
 */
export interface KeystrokeTelemetry {
  typedCharCount: number;
  pastedCharCount: number;
  pasteEventCount: number;
  meanKeystrokeGapMs: number | null;
  keystrokeGapVarianceMs2: number | null;
  editEventCount: number;
}

/**
 * Composite anti-cheat result for a single answer.
 */
export interface AntiCheatVerdict {
  confidence: number;
  contributingSignals: string[];
  flagged: boolean;
}

/**
 * Public-facing combat round shape exposed to the client.
 * Excludes internal fields like raw anti-cheat signals.
 */
export interface CombatRoundView {
  _id: Id<"combatRounds">;
  status: CombatRoundStatus;
  tier: CombatTier;
  totalQuestions: number;
  currentQuestionIndex: number;
  bossHpInitial: number;
  playerHpInitial: number;
  bossHpCurrent: number;
  playerHpCurrent: number;
  attemptNumber: number;
}

/**
 * Public-facing question shape exposed to the client during the round.
 */
export interface CombatQuestionView {
  _id: Id<"combatQuestions">;
  order: number;
  prompt: string;
  persona: CombatPersona;
  complexityTier: ComplexityTier;
  durationMs: number;
  /** Server time (ms) when the question was served — for client ring sync. */
  servedAt: number;
  answered: boolean;
}

/**
 * Aggregate result returned at the end of the round; drives the
 * win/loss screen, the boss reaction stack, and the optional
 * checkpoint-advance call.
 */
export interface CombatRoundResult {
  outcome: "won" | "lost";
  bossHpFinal: number;
  playerHpFinal: number;
  perQuestionScores: number[];
  /** HP timeline keyed to questions — for replay animation. */
  hpTimeline: Array<{
    bossHpAfter: number;
    playerHpAfter: number;
  }>;
  /** Animation keys per question, passed to MiniBoss event-bridge. */
  bossReactionKeys: string[];
  individualPointsAwarded: number;
  attemptNumber: number;
}
