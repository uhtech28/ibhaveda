"use node";

/**
 * AI provider abstraction for Cross-Question Combat.
 *
 * Per PRD 3.4 the combat layer uses the cheap open-weight model for
 * both free and Pro tiers. In production we route to Meta's Llama 3
 * via Replicate; in development/testing we route to Gemini 2.5 Flash
 * because it is faster to iterate against without consuming Replicate
 * credits.
 *
 * Selection is env-driven:
 *   COMBAT_AI_PRIMARY=llama   → Replicate (default in production)
 *   COMBAT_AI_PRIMARY=gemini  → Google Gemini (testing default)
 *
 * Both providers conform to the `CombatAi` interface so the rest of
 * the combat pipeline never inspects which one is in use.
 *
 * Required env vars (deployment-scoped):
 *   REPLICATE_API_TOKEN              for llama
 *   GOOGLE_GENERATIVE_AI_API_KEY     for gemini
 */

import Replicate from "replicate";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type {
  CombatPersona,
  GeneratedQuestion,
} from "./combatTypes";
import type { ComplexityTier } from "./combatConstants";

// ─────────────────────────────────────────────────────────────────────
// Interface
// ─────────────────────────────────────────────────────────────────────

export interface CombatAi {
  /**
   * Produce the next cross-examination question given the user's
   * original submission, the answers to all previous combat questions,
   * and the list of question prompts already asked (so we can avoid
   * repetition).
   */
  generateQuestion(input: GenerateQuestionInput): Promise<GeneratedQuestion>;

  /**
   * Score the user's answer to a single question on a 1-5 scale, with
   * a short justification stored only in evaluator logs.
   */
  scoreAnswer(input: ScoreAnswerInput): Promise<AnswerScore>;

  /**
   * Classify a piece of text as AI-generated vs. human-written. Returns
   * a confidence value 0-1 (higher = more likely AI-generated).
   * Used as one signal in the composite anti-cheat score.
   */
  classifyAiGenerated(text: string): Promise<number>;
}

export interface GenerateQuestionInput {
  submissionText: string;
  /** Previous task answers being cross-examined (the 3 standard tasks). */
  priorTaskAnswers: readonly string[];
  /** Combat questions already asked in this round (to dedupe). */
  questionsAlreadyAsked: readonly string[];
  /** Combat answers given so far in this round, indexed-aligned with above. */
  answersGivenSoFar: readonly string[];
  /** Persona register to use for this question. */
  persona: CombatPersona;
  /** Suggested complexity tier; the AI may downgrade or upgrade by one. */
  preferredComplexity: ComplexityTier;
}

export interface ScoreAnswerInput {
  questionPrompt: string;
  userAnswer: string;
  submissionContext: string;
}

export interface AnswerScore {
  /** Integer 1-5 inclusive. */
  score: number;
  /** Short rationale for evaluator logs (never shown to user). */
  rationale: string;
}

// ─────────────────────────────────────────────────────────────────────
// Selector
// ─────────────────────────────────────────────────────────────────────

const LLAMA_MODEL = "meta/meta-llama-3-8b-instruct";
const GEMINI_MODEL = "gemini-2.5-flash";

export function getCombatAi(): CombatAi {
  const primary = (process.env.COMBAT_AI_PRIMARY ?? "llama").toLowerCase();

  if (primary === "gemini") {
    const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!key) {
      throw new Error(
        "COMBAT_AI_PRIMARY=gemini requires GOOGLE_GENERATIVE_AI_API_KEY",
      );
    }
    return new GeminiCombatAi(key);
  }

  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    throw new Error(
      "COMBAT_AI_PRIMARY=llama requires REPLICATE_API_TOKEN",
    );
  }
  return new LlamaCombatAi(token);
}

// ─────────────────────────────────────────────────────────────────────
// Prompts (shared between providers — same instructions, different runners)
// ─────────────────────────────────────────────────────────────────────

function buildQuestionPrompt(input: GenerateQuestionInput): string {
  const askedList = input.questionsAlreadyAsked.length
    ? input.questionsAlreadyAsked.map((q, i) => `Q${i + 1}: ${q}`).join("\n")
    : "(none yet)";

  const priorAnswers = input.priorTaskAnswers
    .map((a, i) => `Task ${i + 1} answer:\n${a}`)
    .join("\n\n");

  const personaInstruction =
    input.persona === "villain"
      ? "Adopt the voice of a sharp, skeptical VC partner. Be incisive and direct. Push on weak claims. Do not be cruel — be rigorous."
      : "Adopt the voice of a Socratic mentor. Ask the question that genuinely advances the user's thinking. Be encouraging in tone but rigorous in substance.";

  return `You are conducting a cross-examination of a user's checkpoint work in a startup-building learning platform.

${personaInstruction}

The user's most recent submission:
"""
${input.submissionText}
"""

Their answers to the three standard tasks leading up to this submission:
"""
${priorAnswers}
"""

CRITICAL: this user has already been asked the following questions during combat (current round PLUS any prior rounds they've ever played). Your generated question MUST be substantively different from every one of them. Do not paraphrase, do not flip the polarity, do not change a single noun and call it new. Pick a genuinely fresh angle.

Already asked:
${askedList}

Generate exactly ONE next question to ask. Pick the angle that is most useful for testing the user's understanding given their previous answers. The question must be:
  - Specific to this user's actual content, not generic.
  - Substantively different from every previously-asked question above.
  - Answerable in 1-3 paragraphs.
  - In English.

Also choose a complexity tier:
  - "low"    → quick clarification, expected answer 1-2 sentences
  - "medium" → standard probing question, expected answer 1-2 short paragraphs
  - "high"   → deep question requiring genuine synthesis, 2-3 paragraphs

Preferred complexity: ${input.preferredComplexity}. You may downgrade to "low" if the round is going well, or upgrade to "high" if you want to push harder, but stay within one tier of the preferred.

Return ONLY a JSON object, no prose around it, in this exact shape:

{
  "prompt": "the question text",
  "complexityTier": "low" | "medium" | "high"
}`;
}

function buildScoringPrompt(input: ScoreAnswerInput): string {
  return `You are evaluating a user's answer to a cross-examination question on a startup-building platform.

Context for the question (the user's original submission):
"""
${input.submissionContext}
"""

The question asked:
"""
${input.questionPrompt}
"""

The user's answer:
"""
${input.userAnswer}
"""

Score the answer on a 1-5 scale based on substance, specificity, and how well it actually addresses the question:

  1 — Non-answer, off-topic, or empty. Avoids the question entirely.
  2 — Attempts to address but is vague, contradictory, or surface-level. Weak.
  3 — Addresses the question with reasonable substance. Adequate.
  4 — Strong answer with specifics and clear reasoning. Above the bar.
  5 — Exceptional answer that adds new insight or addresses second-order concerns.

Score on substance only. Do not reward verbosity, do not penalise brevity if the brevity is sharp. Be a fair but tough evaluator.

Return ONLY a JSON object, no prose around it:

{
  "score": 1 | 2 | 3 | 4 | 5,
  "rationale": "one sentence on why you scored this way"
}`;
}

function buildAiDetectionPrompt(text: string): string {
  return `Analyse the following text and decide whether it appears to have been generated by an AI language model (such as ChatGPT, Claude, or Gemini) rather than written by a human in a real-time conversation.

Signals of AI generation include:
  - Overly uniform sentence structure
  - Formulaic transition phrases ("Furthermore", "It is important to note", "In conclusion")
  - Hedge-and-balance patterns ("On one hand... on the other hand...")
  - Lack of personal voice, specifics, or first-person grounding
  - Polished, near-error-free prose that does not match a fast typed answer
  - Generic content that could apply to many users

Signals of human writing under time pressure:
  - Typos, abbreviations, fragmented sentences
  - Personal specifics, references to their own situation
  - Uneven pacing, sentences of very different lengths
  - Direct, unhedged opinions

Text to analyse:
"""
${text}
"""

Return ONLY a JSON object, no prose around it:

{
  "aiGeneratedConfidence": <integer 0-100, where 0 = certainly human, 100 = certainly AI>,
  "topSignals": ["..."]
}`;
}

// ─────────────────────────────────────────────────────────────────────
// JSON extraction shared helper
// ─────────────────────────────────────────────────────────────────────

function extractJson<T>(raw: string): T | null {
  const cleaned = raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  if (!cleaned) return null;
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Sometimes the model adds prose before/after the object — try to
    // locate the first { and last } and parse the substring.
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1)) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}

function clampComplexity(t: unknown): ComplexityTier {
  if (t === "low" || t === "medium" || t === "high") return t;
  return "medium";
}

function clampScore1to5(s: unknown): number {
  const n = typeof s === "number" ? s : Number(s);
  if (!Number.isFinite(n)) return 3;
  return Math.max(1, Math.min(5, Math.round(n)));
}

function clampConfidence0to1(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return 0;
  if (v <= 1 && v >= 0) return v; // already 0-1
  if (v >= 0 && v <= 100) return v / 100; // 0-100 scale
  return Math.max(0, Math.min(1, v));
}

// ─────────────────────────────────────────────────────────────────────
// Llama 3 via Replicate
// ─────────────────────────────────────────────────────────────────────

class LlamaCombatAi implements CombatAi {
  private client: Replicate;

  constructor(token: string) {
    this.client = new Replicate({ auth: token });
  }

  private async run(prompt: string): Promise<string> {
    const output = await this.client.run(LLAMA_MODEL, {
      input: {
        prompt,
        temperature: 0.6,
        max_tokens: 400,
        system_prompt:
          "You are a precise JSON-emitting assistant. Reply with only the JSON object requested — no markdown, no prose, no code fences.",
      },
    });
    if (Array.isArray(output)) return output.join("");
    if (typeof output === "string") return output;
    return JSON.stringify(output ?? "");
  }

  async generateQuestion(input: GenerateQuestionInput): Promise<GeneratedQuestion> {
    const raw = await this.run(buildQuestionPrompt(input));
    const parsed = extractJson<{ prompt?: string; complexityTier?: string }>(raw);
    const prompt = parsed?.prompt?.trim();
    if (!prompt) {
      throw new Error("Llama returned an empty question prompt");
    }
    return {
      prompt,
      persona: input.persona,
      complexityTier: clampComplexity(parsed?.complexityTier),
    };
  }

  async scoreAnswer(input: ScoreAnswerInput): Promise<AnswerScore> {
    const raw = await this.run(buildScoringPrompt(input));
    const parsed = extractJson<{ score?: unknown; rationale?: string }>(raw);
    return {
      score: clampScore1to5(parsed?.score),
      rationale: typeof parsed?.rationale === "string" ? parsed.rationale : "",
    };
  }

  async classifyAiGenerated(text: string): Promise<number> {
    const raw = await this.run(buildAiDetectionPrompt(text));
    const parsed = extractJson<{ aiGeneratedConfidence?: unknown }>(raw);
    return clampConfidence0to1(parsed?.aiGeneratedConfidence);
  }
}

// ─────────────────────────────────────────────────────────────────────
// Gemini 2.5 Flash (testing fallback)
// ─────────────────────────────────────────────────────────────────────

class GeminiCombatAi implements CombatAi {
  private client: GoogleGenerativeAI;

  constructor(key: string) {
    this.client = new GoogleGenerativeAI(key);
  }

  private async run(prompt: string): Promise<string> {
    const model = this.client.getGenerativeModel({ model: GEMINI_MODEL });
    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  async generateQuestion(input: GenerateQuestionInput): Promise<GeneratedQuestion> {
    const raw = await this.run(buildQuestionPrompt(input));
    const parsed = extractJson<{ prompt?: string; complexityTier?: string }>(raw);
    const prompt = parsed?.prompt?.trim();
    if (!prompt) {
      throw new Error("Gemini returned an empty question prompt");
    }
    return {
      prompt,
      persona: input.persona,
      complexityTier: clampComplexity(parsed?.complexityTier),
    };
  }

  async scoreAnswer(input: ScoreAnswerInput): Promise<AnswerScore> {
    const raw = await this.run(buildScoringPrompt(input));
    const parsed = extractJson<{ score?: unknown; rationale?: string }>(raw);
    return {
      score: clampScore1to5(parsed?.score),
      rationale: typeof parsed?.rationale === "string" ? parsed.rationale : "",
    };
  }

  async classifyAiGenerated(text: string): Promise<number> {
    const raw = await this.run(buildAiDetectionPrompt(text));
    const parsed = extractJson<{ aiGeneratedConfidence?: unknown }>(raw);
    return clampConfidence0to1(parsed?.aiGeneratedConfidence);
  }
}
