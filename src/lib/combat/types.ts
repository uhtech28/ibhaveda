/**
 * Client-side TypeScript contracts for combat. Mirror of the
 * `convex/combatTypes.ts` definitions so UI code never has to import
 * directly from the server module.
 */

export type CombatTier = "free" | "pro";
export type ComplexityTier = "low" | "medium" | "high";
export type CombatPersona = "villain" | "mentor";

export type CombatRoundStatus =
  | "active"
  | "won"
  | "lost"
  | "abandoned"
  | "cap_exhausted";

export interface KeystrokeTelemetry {
  typedCharCount: number;
  pastedCharCount: number;
  pasteEventCount: number;
  meanKeystrokeGapMs: number | null;
  keystrokeGapVarianceMs2: number | null;
  editEventCount: number;
}

export interface CombatCurrentQuestion {
  _id: string;
  order: number;
  prompt: string;
  persona: CombatPersona;
  complexityTier: ComplexityTier;
  durationMs: number;
  /** Server-side creation time (ms) — anchor for the ring timer. */
  servedAt: number;
}

export interface CombatRoundView {
  roundId: string;
  status: CombatRoundStatus;
  tier: CombatTier;
  totalQuestions: number;
  currentQuestionIndex: number;
  bossHpInitial: number;
  playerHpInitial: number;
  bossHpCurrent: number;
  playerHpCurrent: number;
  attemptNumber: number;
  currentQuestion: CombatCurrentQuestion | null;
}

export interface CombatRoundResult {
  outcome: "won" | "lost";
  bossHpFinal: number;
  playerHpFinal: number;
  perQuestionScores: number[];
  hpTimeline: Array<{ bossHpAfter: number; playerHpAfter: number }>;
  bossReactionKeys: string[];
  individualPointsAwarded: number;
  attemptNumber: number;
}
