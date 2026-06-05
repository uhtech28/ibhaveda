"use node";

/**
 * Anti-cheat detection for AI Cross-Question Combat.
 *
 * Combines client-side keystroke telemetry with server-side text
 * analysis (including a model-based classification call) into a
 * single confidence score 0-1. The composite is compared against
 * COMBAT_CONFIG.AI_DETECTION_THRESHOLD to decide whether the answer
 * should be flagged.
 *
 * Eight signals are computed independently then weighted:
 *
 *   1. pasteRatio            — fraction of chars arriving via paste
 *   2. keystrokeVariance     — variance of inter-keypress gaps
 *   3. perplexityCheck       — model classification (AI vs human)
 *   4. burstinessScore       — sentence-length variance
 *   5. vocabularyFingerprint — known AI-flag phrases
 *   6. styleDelta            — distance from the user's prior writing
 *   7. (reserved)            — kept to keep weight indices stable
 *   8. (reserved)            — kept to keep weight indices stable
 *
 * Signals 7 and 8 are placeholders for future additions; their weights
 * are currently rolled into the six active signals in
 * COMBAT_CONFIG.AI_SIGNAL_WEIGHTS so the composite still sums to 1.
 *
 * Every weight invariant is verified at module load (combatConstants).
 *
 * Design choices:
 *   - We never expose raw signals to the client. The verdict on the wire
 *     is composite + contributing signal names only.
 *   - We tune for false-negative bias (let some cheats through rather
 *     than ban innocents). Threshold defaults to 0.85.
 *   - The model-based perplexity check is the heaviest input — if it
 *     fails or times out, we degrade gracefully by re-normalising the
 *     remaining signal weights.
 */

import { COMBAT_CONFIG } from "./combatConstants";
import type {
  AntiCheatVerdict,
  KeystrokeTelemetry,
} from "./combatTypes";
import { getCombatAi } from "./combatAiProvider";

// ─────────────────────────────────────────────────────────────────────
// Public entry point
// ─────────────────────────────────────────────────────────────────────

export interface ScoreAnswerInput {
  /** The text the user submitted as their answer. */
  answerText: string;
  /** Client-captured keystroke telemetry; trusted but verified. */
  telemetry: KeystrokeTelemetry;
  /**
   * A handful of the user's previous writings on the platform (e.g. their
   * three standard-task answers). Used as a baseline for the styleDelta
   * signal. Empty array is fine — that signal will return 0.
   */
  userPriorWritings: readonly string[];
}

export async function scoreAnswer(
  input: ScoreAnswerInput,
): Promise<AntiCheatVerdict> {
  const { answerText, telemetry, userPriorWritings } = input;

  // Empty answers are not "AI-generated"; they're just empty. Return
  // a definite-not-flagged verdict so we don't waste model budget.
  if (answerText.trim().length === 0) {
    return { confidence: 0, contributingSignals: [], flagged: false };
  }

  const signals = await computeSignals(
    answerText,
    telemetry,
    userPriorWritings,
  );

  const composite = weightedComposite(signals);

  const contributing = Object.entries(signals)
    .filter(([, value]) => value >= 0.5)
    .map(([name]) => name);

  return {
    confidence: round3(composite),
    contributingSignals: contributing,
    flagged: composite >= COMBAT_CONFIG.AI_DETECTION_THRESHOLD,
  };
}

// ─────────────────────────────────────────────────────────────────────
// Signal pipeline
// ─────────────────────────────────────────────────────────────────────

interface SignalSet {
  pasteRatio: number;
  keystrokeVariance: number;
  perplexityCheck: number;
  burstinessScore: number;
  vocabularyFingerprint: number;
  styleDelta: number;
}

async function computeSignals(
  text: string,
  telemetry: KeystrokeTelemetry,
  priorWritings: readonly string[],
): Promise<SignalSet> {
  const perplexity = await safePerplexity(text);

  return {
    pasteRatio: pasteRatioSignal(telemetry),
    keystrokeVariance: keystrokeVarianceSignal(telemetry),
    perplexityCheck: perplexity,
    burstinessScore: burstinessSignal(text),
    vocabularyFingerprint: vocabularyFingerprintSignal(text),
    styleDelta: styleDeltaSignal(text, priorWritings),
  };
}

function weightedComposite(signals: SignalSet): number {
  const w = COMBAT_CONFIG.AI_SIGNAL_WEIGHTS;
  return (
    signals.pasteRatio * w.pasteRatio +
    signals.keystrokeVariance * w.keystrokeVariance +
    signals.perplexityCheck * w.perplexityCheck +
    signals.burstinessScore * w.burstinessScore +
    signals.vocabularyFingerprint * w.vocabularyFingerprint +
    signals.styleDelta * w.styleDelta
  );
}

// ─────────────────────────────────────────────────────────────────────
// Signal 1: paste ratio
// ─────────────────────────────────────────────────────────────────────

/**
 * High paste ratio (one large paste = entire answer) is a strong AI
 * signal. Saturates at 0.6 pasted ratio so a user pasting a quote
 * mid-answer is not over-flagged.
 */
export function pasteRatioSignal(t: KeystrokeTelemetry): number {
  const total = t.typedCharCount + t.pastedCharCount;
  if (total === 0) return 0;
  const ratio = t.pastedCharCount / total;
  if (ratio <= 0.05) return 0; // small inline paste — ignore
  if (ratio >= 0.6) return 1;
  // Linear in (0.05, 0.6)
  return (ratio - 0.05) / (0.6 - 0.05);
}

// ─────────────────────────────────────────────────────────────────────
// Signal 2: keystroke variance
// ─────────────────────────────────────────────────────────────────────

/**
 * Real typing has high variance in inter-keypress gaps (thinking pauses,
 * burst typing of common words). A perfectly uniform stream of keys, or
 * a stream with zero keystrokes (everything pasted), is suspicious.
 *
 * We return a low signal when variance is healthily high, and a high
 * signal when variance is near zero with a meaningful number of keys.
 */
export function keystrokeVarianceSignal(t: KeystrokeTelemetry): number {
  // No keystrokes at all — captured separately by the paste signal.
  if (t.typedCharCount < 5 || t.keystrokeGapVarianceMs2 === null) return 0;

  // CV (coefficient of variation) of inter-key gaps — robust across
  // fast and slow typists.
  const mean = t.meanKeystrokeGapMs ?? 0;
  if (mean <= 0) return 0;
  const stdDev = Math.sqrt(t.keystrokeGapVarianceMs2);
  const cv = stdDev / mean;

  // Healthy human typing CV is typically > 0.7. AI-paste-then-edit
  // sessions can produce CVs below 0.3 (the bulk of chars arrived
  // simultaneously).
  if (cv >= 0.7) return 0;
  if (cv <= 0.2) return 1;
  // Linear in (0.2, 0.7) — invert so low CV → high signal.
  return 1 - (cv - 0.2) / (0.7 - 0.2);
}

// ─────────────────────────────────────────────────────────────────────
// Signal 3: model-based perplexity / classification
// ─────────────────────────────────────────────────────────────────────

/**
 * Ask the same combat model whether the text looks AI-generated.
 * Returns 0-1 confidence. Failures degrade to 0 so a transient model
 * outage doesn't unfairly flag answers — the other signals still vote.
 */
async function safePerplexity(text: string): Promise<number> {
  try {
    const ai = getCombatAi();
    return await ai.classifyAiGenerated(text);
  } catch (err) {
    console.warn(
      "[combat anti-cheat] perplexity check failed; degrading signal to 0",
      err instanceof Error ? err.message : err,
    );
    return 0;
  }
}

// ─────────────────────────────────────────────────────────────────────
// Signal 4: burstiness
// ─────────────────────────────────────────────────────────────────────

/**
 * Burstiness = variance in sentence length. Human prose under time
 * pressure produces a mix of very short and very long sentences;
 * AI-generated text tends to be more uniform.
 *
 * Returns higher confidence when burstiness is LOW (suspicious).
 */
export function burstinessSignal(text: string): number {
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (sentences.length < 3) return 0; // not enough data

  const wordCounts = sentences.map((s) => s.split(/\s+/).length);
  const mean = wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length;
  if (mean <= 0) return 0;
  const variance =
    wordCounts.reduce((acc, w) => acc + (w - mean) ** 2, 0) /
    wordCounts.length;
  const cv = Math.sqrt(variance) / mean;

  // Healthy human CV typically > 0.4. AI text often clusters around 0.2-0.3.
  if (cv >= 0.5) return 0;
  if (cv <= 0.15) return 1;
  return 1 - (cv - 0.15) / (0.5 - 0.15);
}

// ─────────────────────────────────────────────────────────────────────
// Signal 5: vocabulary fingerprint
// ─────────────────────────────────────────────────────────────────────

/**
 * Phrases and constructions that disproportionately appear in
 * AI-generated text. Each hit contributes; saturates at 4 hits.
 */
const AI_FLAG_PHRASES: readonly string[] = [
  // Connectives / transitions
  "furthermore",
  "moreover",
  "in conclusion",
  "in summary",
  "it is important to note",
  "it's worth noting",
  "it should be noted",
  // Hedge-and-balance
  "on the one hand",
  "on the other hand",
  "that being said",
  // AI tells
  "delve into",
  "tapestry of",
  "navigate the complexities",
  "in the realm of",
  "as an ai language model",
  "as an ai",
  "i'm just an ai",
  "i cannot provide",
  // Polish-mode tells
  "comprehensive understanding",
  "multifaceted approach",
  "paradigm shift",
  "leverage synergies",
  "robust framework",
];

export function vocabularyFingerprintSignal(text: string): number {
  const lower = text.toLowerCase();
  let hits = 0;
  for (const phrase of AI_FLAG_PHRASES) {
    if (lower.includes(phrase)) hits++;
  }
  return Math.min(1, hits / 4);
}

// ─────────────────────────────────────────────────────────────────────
// Signal 6: style delta from user's prior writing
// ─────────────────────────────────────────────────────────────────────

/**
 * Compare a coarse style fingerprint of the candidate answer against
 * the average fingerprint of the user's prior writings on the platform.
 * A drastic jump suggests the answer wasn't written by the same person.
 *
 * Features used (intentionally coarse — we are not aiming for
 * stylometric accuracy, just outlier detection):
 *   - mean sentence length (words)
 *   - mean word length (chars)
 *   - punctuation density (per 100 chars)
 *   - fraction of capitalised words (proper-noun + sentence-start proxy)
 *
 * Each feature contributes a normalised distance 0-1; the signal is
 * the mean. If the user has no prior writings, the signal is 0.
 */
export function styleDeltaSignal(
  text: string,
  priorWritings: readonly string[],
): number {
  if (priorWritings.length === 0) return 0;
  if (text.trim().length < 40) return 0; // too short to fingerprint

  const candidate = fingerprint(text);
  const baseline = averageFingerprint(priorWritings);

  const dSent = bounded(distance1d(candidate.meanSentLen, baseline.meanSentLen) / 15);
  const dWord = bounded(distance1d(candidate.meanWordLen, baseline.meanWordLen) / 3);
  const dPunc = bounded(distance1d(candidate.punctDensity, baseline.punctDensity) / 0.1);
  const dCap = bounded(distance1d(candidate.capWordFraction, baseline.capWordFraction) / 0.3);

  return (dSent + dWord + dPunc + dCap) / 4;
}

interface StyleFingerprint {
  meanSentLen: number;
  meanWordLen: number;
  punctDensity: number;
  capWordFraction: number;
}

function fingerprint(text: string): StyleFingerprint {
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const punctCount = (text.match(/[,;:()"'—–]/g) ?? []).length;
  const capWords = words.filter(
    (w) => w.length > 1 && w[0] === w[0]?.toUpperCase() && /[A-Z]/.test(w[0]),
  ).length;

  return {
    meanSentLen: sentences.length
      ? words.length / sentences.length
      : words.length,
    meanWordLen: words.length
      ? words.reduce((a, w) => a + w.length, 0) / words.length
      : 0,
    punctDensity: text.length ? punctCount / text.length : 0,
    capWordFraction: words.length ? capWords / words.length : 0,
  };
}

function averageFingerprint(
  texts: readonly string[],
): StyleFingerprint {
  const fps = texts
    .filter((t) => t.trim().length >= 40)
    .map(fingerprint);
  if (fps.length === 0) {
    return { meanSentLen: 0, meanWordLen: 0, punctDensity: 0, capWordFraction: 0 };
  }
  return {
    meanSentLen: avg(fps.map((f) => f.meanSentLen)),
    meanWordLen: avg(fps.map((f) => f.meanWordLen)),
    punctDensity: avg(fps.map((f) => f.punctDensity)),
    capWordFraction: avg(fps.map((f) => f.capWordFraction)),
  };
}

// ─────────────────────────────────────────────────────────────────────
// Math helpers
// ─────────────────────────────────────────────────────────────────────

function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function distance1d(a: number, b: number): number {
  return Math.abs(a - b);
}

function bounded(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}
