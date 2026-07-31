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

  const priorAnswers = input.priorTaskAnswers.length
    ? input.priorTaskAnswers
        .map((a, i) => `PRIOR TASK ${i + 1} ANSWER (verbatim):\n"""\n${a}\n"""`)
        .join("\n\n")
    : "(the user has not submitted any prior task answers yet)";

  // Progress-in-round + performance so the AI can pivot: if the user is
  // dodging, probe harder; if they're crushing it, hit the assumption
  // stack rather than the surface claim.
  const answersSoFar = input.answersGivenSoFar.length
    ? input.answersGivenSoFar
        .map((a, i) => `Their answer to Q${i + 1}:\n"""\n${a}\n"""`)
        .join("\n\n")
    : "(this is the first question in the round)";

  const personaInstruction =
    input.persona === "villain"
      ? "You are a Tier-1 VC partner (Sequoia / a16z / YC / Benchmark) three years into your career. You've sat through 10,000 pitches. You can smell hand-wave answers from a mile away. Your job is to expose the single weakest assumption in this founder's thinking. Rigorous, direct, unsparing. Never cruel — never polite either."
      : "You are a seasoned founder-mentor in the tradition of Paul Graham, Marc Andreessen, and Naval Ravikant. Ask the Socratic question that forces the founder to confront the gap in their reasoning. Warm tone — but the question must hurt to answer well. You are not here to make them feel good; you are here to make them think.";

  return `You are conducting a STARTUP-INVESTOR-GRADE cross-examination of a founder. This is a real due-diligence session, not a friendly chat.

${personaInstruction}

═══════════════════════════════════════════════════════
THE FOUNDER'S CURRENT CHECKPOINT SUBMISSION (primary probe target):
═══════════════════════════════════════════════════════
"""
${input.submissionText}
"""

═══════════════════════════════════════════════════════
THE FOUNDER'S PRIOR TASK ANSWERS (build on these — critical context):
═══════════════════════════════════════════════════════
${priorAnswers}

═══════════════════════════════════════════════════════
COMBAT SO FAR (your job is to escalate on what they've already said):
═══════════════════════════════════════════════════════
${answersSoFar}

═══════════════════════════════════════════════════════
GROUNDING RULE — READ CAREFULLY
═══════════════════════════════════════════════════════
Your NEXT question MUST be built on top of ONE of these two anchors, in this order of preference:

  ANCHOR A (STRONGLY PREFERRED): Take a specific phrase, number, claim, or assumption from their PRIOR TASK ANSWERS above and probe it. Quote the phrase. Then ask the question that a real investor would ask right after reading it.

  ANCHOR B: If prior task answers are empty or too vague, quote from their current submission.

  ANCHOR C (LAST RESORT — only if both A and B are truly unusable): Ask a top-tier entrepreneur-mindset question drawn from the list below, but STILL frame it in terms of THEIR idea.

═══════════════════════════════════════════════════════
ENTREPRENEUR MINDSET QUESTION BANK — the categories a great investor probes
═══════════════════════════════════════════════════════
Use these categories to CHOOSE the angle of attack. Do not paste one verbatim; adapt it to the founder's actual content.

  • Customer specificity — Who is the FIRST person who will pay, by name, industry, and situation?
  • Willingness-to-pay evidence — Has anyone said they'd pay? How much? Cash or LOI or just verbal?
  • Now-not-later — What has changed in the world in the last 24 months that makes this idea viable NOW?
  • Founder-market fit — What in your history makes you the RIGHT person to build this, vs. everyone else in the pitch line?
  • Distribution insight — Do you have a repeatable, cheap way to reach your first 1,000 users, or are you praying for virality?
  • Unit economics — What does one customer cost to acquire, and what do they pay over their lifetime? Show the math.
  • Wedge — What is the smallest, sharpest opening you can drive into the market with a v1, and what does v2 unlock that v1 does not?
  • Kill criteria — What single piece of evidence, if you saw it in the next 30 days, would make you SHUT THIS DOWN?
  • Second-order thinking — If this works, what does the world look like in 3 years? What does the incumbent's response look like?
  • Non-consensus & right — What do you believe about your market that most smart people would disagree with, and why are you right?
  • Speed of iteration — What is the fastest, cheapest test you could run this WEEK to invalidate your riskiest assumption?
  • Focus — What are you deliberately NOT building? What did you decide to say no to, and why?
  • Real number vs. story — Ask for one number they haven't given yet. Retention, CAC, conversion, WoW growth, active users. Any real number.

═══════════════════════════════════════════════════════
ABSOLUTE RULES FOR YOUR QUESTION
═══════════════════════════════════════════════════════
1. ❌ DO NOT just rephrase the task as a question.
2. ❌ DO NOT ask generic startup-101 questions ("What's your TAM?", "Who is your competition?") UNLESS you're anchoring on a specific claim they made.
3. ❌ DO NOT repeat, paraphrase, or semantically overlap any question already asked (list below).
4. ❌ DO NOT ask a question that lets them answer with buzzwords (leverage, synergy, disrupt, ecosystem).
5. ✅ DO quote a specific phrase or number from their submission or a prior task answer.
6. ✅ DO expose ONE crisp assumption and ask them to defend it with evidence.
7. ✅ DO reward specificity by asking for it — "give me one number", "give me one name", "give me the specific date you talked to them".
8. ✅ DO connect this question to something they SAID BEFORE — this is why they hired the investor: for continuity of thought.

═══════════════════════════════════════════════════════
GOOD EXAMPLE (from a prior task answer)
═══════════════════════════════════════════════════════
Prior task answer contained: "Our early users are indie game devs frustrated with Steam's payout schedule."
GOOD next question: "You said your early users are indie game devs frustrated with Steam's payout schedule. Name three of them. What did each one tell you when you offered them your solution — did any of them try to pay you right there?"

═══════════════════════════════════════════════════════
QUESTIONS ALREADY ASKED — DO NOT REPEAT OR PARAPHRASE
═══════════════════════════════════════════════════════
${askedList}

═══════════════════════════════════════════════════════
YOUR TASK
═══════════════════════════════════════════════════════
Generate ONE question that:
  - Anchors on their actual submitted content (Anchor A > B > C).
  - Uses one of the entrepreneur-mindset categories as the angle of attack.
  - Is DIFFERENT (topic + phrasing) from every question already asked.
  - Is answerable in 1-3 paragraphs of substance.
  - Sounds like an investor, not a teacher.
  - Is in English.
  - Uses a WARM but DIRECT tone if you are the mentor persona; a COOL and RIGOROUS tone if you are the villain persona.

Complexity tier guidance:
  - "low"    → quick clarification / one-number ask (1-2 sentence answer expected)
  - "medium" → probe ONE assumption hard (1-2 short paragraphs expected)
  - "high"   → force them to reconcile two parts of their story (2-3 paragraphs expected)

Preferred complexity: ${input.preferredComplexity}. You may shift ONE tier if the founder's material warrants it.

Return ONLY a JSON object, no prose around it, in this exact shape:

{
  "prompt": "the question text",
  "complexityTier": "low" | "medium" | "high"
}`;
}

function buildScoringPrompt(input: ScoreAnswerInput): string {
  return `You are a Tier-1 VC partner (Sequoia / a16z / YC / Benchmark) scoring a founder's answer during a live due-diligence session. Be BRUTALLY HONEST. Your job is to protect capital by giving a REAL score, not a polite one. Founders learn nothing from soft feedback. Grade like you'd write the memo.

Default expectation: MEDIOCRITY. Most founder answers are 2s. You hand out 4s only for answers that would make you take the meeting. 5s are RARE — reserved for answers a smart partner would want to memorize.

Context for the question (the founder's original submission):
"""
${input.submissionContext}
"""

The question you asked:
"""
${input.questionPrompt}
"""

The founder's answer:
"""
${input.userAnswer}
"""

═══════════════════════════════════════════════════════
BRUTALLY HONEST 1-5 SCORING RUBRIC — DEFAULT TO LOWER
═══════════════════════════════════════════════════════

  1 — GARBAGE. Non-answer, off-topic, empty, evasive, or pure buzzwords. The answer that ENDS the meeting.
       Examples: "We're disrupting the industry", "Our users love it", "We'll figure it out", "It's a huge market",
                 "We're building a platform", "We'll go viral", one-word answers, LMAO/idk/lol.
       ALSO 1: restating the question, dodging with "great question…", refusing to engage.

  2 — WEAK. Attempts to engage but is vague, hand-wavy, generic, or hides behind jargon. No real specifics: no numbers, no named customers, no actual reasoning. Uses "we believe" / "we think" without evidence.
       This is where MOST real founder answers land. DEFAULT TO 2 unless the answer earns higher.

  3 — ADEQUATE. Addresses the question with AT LEAST ONE specific (a real number, a name, a concrete observation, a dated event). Shows the founder has thought about it, but the thinking is shallow.
       Acceptable but you would not invest on this answer alone.

  4 — STRONG. MULTIPLE specifics, a clear reasoning chain, surfaces a non-obvious insight, OR honestly names what they don't know AND has a real plan to find out.
       This is the answer that makes a partner lean forward.

  5 — EXCEPTIONAL. Reframes the question, exposes second-order effects, or shows the founder has thought harder about this than you have. Genuinely rare — reserve for answers that would end up as a quote in the memo.

═══════════════════════════════════════════════════════
HARD RULES — APPLY THEM MECHANICALLY
═══════════════════════════════════════════════════════
  • Reward SPECIFICITY. Numbers, named entities, dated events, dollar amounts, concrete observations.
  • Punish ABSTRACTION. "Our users" / "many customers" / "the market" without a number is weak.
  • Reward INTELLECTUAL HONESTY. "I don't know, but here's the specific experiment I'll run in 7 days to find out" → 3 minimum.
  • Punish HAND-WAVING. "We'll figure that out later" → 1.
  • Do NOT reward word count. A sharp 2-sentence answer with a real number beats 5 vague paragraphs.
  • Do NOT reward agreement with the question's framing. Reward the founder CHALLENGING it — but only if they back it up.
  • If you can't tell what they actually mean → 2.
  • If they restate the question without answering → 1.
  • If they answer a DIFFERENT question than the one asked → 1.
  • If they beg / apologize / ask you to skip → 1.

═══════════════════════════════════════════════════════
AUTOMATIC DEDUCTIONS
═══════════════════════════════════════════════════════
Apply these AFTER you've settled on a base score. Deductions can drop the score to 1 but not below.

  −1 for each of the following words used without a specific quantitative claim attached: "leverage", "synergy", "disrupt", "disruptive", "ecosystem", "revolutionize", "seamless", "cutting-edge", "innovative", "AI-powered" (unless the model is named), "world-class", "best-in-class".
  −1 if answer contains the phrase "the market" or "the industry" without a size or trend number.
  −1 if answer is under 15 words AND lacks a specific fact.
  −1 if answer is over 250 words AND still contains no numbers or names.

═══════════════════════════════════════════════════════
RATIONALE — INTERNAL EVALUATOR NOTE
═══════════════════════════════════════════════════════
Must be ONE sentence naming the SPECIFIC strength or weakness. Never "good answer" or "needs work". Point at the actual line that earned or lost the score.

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
