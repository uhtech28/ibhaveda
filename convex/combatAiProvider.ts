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
      ? "You are a Tier-1 VC partner (Sequoia / a16z / YC) doing due diligence on this founder. Be incisive, direct, and unsparing. You have heard 10,000 pitches and you can smell hand-wave answers from a mile away. Ask the question that exposes the weakest assumption in their submission. Be rigorous, never cruel — but never polite either."
      : "You are a seasoned founder-mentor (think Paul Graham, Marc Lore). Ask the Socratic question that forces the user to confront the gap in their reasoning. Encouraging tone, but the question must hurt to answer well.";

  return `You are conducting a STARTUP-INVESTOR-GRADE cross-examination of a user's checkpoint work.

${personaInstruction}

═══════════════════════════════════════════════════════
THE USER'S ACTUAL SUBMISSION (this is what you must probe):
═══════════════════════════════════════════════════════
"""
${input.submissionText}
"""

Their prior task answers (for context, NOT the focus of your question):
"""
${priorAnswers}
"""

ABSOLUTE RULES FOR YOUR QUESTION:

1. ❌ DO NOT just rephrase the task as a question. ("Tell me about your users" → "Who are your users?" is BANNED.)
2. ❌ DO NOT ask generic startup-101 questions ("What's your TAM?", "Who's your competition?") unless their submission contains a specific claim about it that you can probe.
3. ✅ DO quote or paraphrase a SPECIFIC claim from their submission, then probe it.
4. ✅ DO point at numbers they gave and ask where they came from, OR point at the absence of numbers and ask for one.
5. ✅ DO surface the assumption their answer depends on — and ask them to defend it.
6. ✅ DO ask the question a Series-A check would die on.

EXAMPLE OF A BAD QUESTION (don't do this):
  "Can you tell me more about your target audience?"
  ← This is task-rephrasing, not cross-examination.

EXAMPLE OF A GOOD QUESTION:
  "You said your target user is 'busy professionals aged 25-45'. That's 800 million people globally. Which 1,000 of them have you actually talked to, and what did they tell you that changed your product spec?"
  ← Quotes their claim, exposes the gap, asks for evidence.

CRITICAL: The user has already been asked these questions (do not repeat or paraphrase any of them):
${askedList}

Generate ONE question. It must:
  - Reference SPECIFIC content from their submission above (quote a phrase, a number, or a claim).
  - Expose a specific assumption, gap, or weakness in what they wrote.
  - Be answerable in 1-3 paragraphs of substance.
  - Sound like an investor, not a teacher.
  - Be in English.

Complexity tier:
  - "low"    → quick clarification on one specific phrase they used (1-2 sentence answer)
  - "medium" → probe one assumption hard (1-2 short paragraphs)
  - "high"   → synthesis-level — force them to reconcile two parts of their submission (2-3 paragraphs)

Preferred complexity: ${input.preferredComplexity}. You may shift one tier if the user's submission warrants it.

Return ONLY a JSON object, no prose around it, in this exact shape:

{
  "prompt": "the question text",
  "complexityTier": "low" | "medium" | "high"
}`;
}

function buildScoringPrompt(input: ScoreAnswerInput): string {
  return `You are a Tier-1 VC partner scoring a founder's answer during due diligence. Be BRUTALLY HONEST. You hand out 4s and 5s only when the founder genuinely impresses you. Most answers from real founders are 2s. The default expectation is mediocrity — you reward substance, specificity, and intellectual honesty.

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

BRUTALLY HONEST 1-5 SCORING RUBRIC (default to lower scores):

  1 — Garbage. Non-answer, off-topic, empty, evasive, or pure buzzwords. The kind of answer that ends the meeting early.
       Examples: "We're disrupting the industry", "Our users love it", "We'll figure it out", anything generic.

  2 — Weak. Attempts to engage but is vague, hand-wavy, generic, or hides behind jargon. No real specifics, no numbers, no named customers, no actual reasoning.
       This is where MOST real-world founder answers land. Default to 2 unless the answer earns more.

  3 — Adequate. Addresses the question with at least one specific (a number, a name, a concrete observation). Shows the founder has thought about it but the thinking is shallow.
       Acceptable but not investable on this answer alone.

  4 — Strong. Multiple specifics, clear reasoning chain, surfaces a non-obvious insight, or honestly acknowledges what they don't know. The kind of answer that makes a partner lean forward.

  5 — Exceptional. Reframes the question, exposes second-order effects, demonstrates the founder has thought about this harder than you have. Genuinely rare.

HARD RULES:
  - Reward SPECIFICITY (numbers, named entities, concrete observations). Punish abstraction.
  - Reward INTELLECTUAL HONESTY ("I don't know but here's how I'd find out" is a 3 minimum). Punish hand-waving.
  - Do NOT reward word count. A sharp 2-sentence answer beats a vague 3-paragraph one.
  - Do NOT reward agreement with the question's framing. Reward the founder challenging it IF they back it up.
  - If you can't tell what they actually mean → it's a 2.
  - If they restate the question without answering it → it's a 1.
  - If they use the phrase "leverage", "synergy", "disrupt", or "ecosystem" without specifics → automatic -1 from whatever you were going to give.

The rationale must be one sentence that names the SPECIFIC strength or weakness — not "good answer" or "needs work".

Return ONLY a JSON object, no prose around it:

{
  "score": 1 | 2 | 3 | 4 | 5,
  "rationale": "one sentence naming the specific strength or weakness"
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
