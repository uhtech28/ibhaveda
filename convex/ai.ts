"use node";

// Convex action that drafts a full idea form from a free-text outline.
//
// Provider strategy (round 2c+):
//   1. Try OpenAI gpt-4o-mini if OPENAI_API_KEY is set
//   2. Fall back to Google Gemini if GOOGLE_GENERATIVE_AI_API_KEY is set
//   3. Fall back to manual-fill (outline as description) if neither works
//
// This way the team can use whichever provider has working billing,
// without code changes. Both keys can be set simultaneously — OpenAI
// wins as the primary because gpt-4o-mini is slightly more reliable at
// structured JSON output.
//
// Set keys on the deployment:
//   npx convex env set OPENAI_API_KEY sk-...
//   npx convex env set GOOGLE_GENERATIVE_AI_API_KEY <gemini-key>

import { v } from "convex/values";
import { action } from "./_generated/server";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

type GeneratedDraft = {
  title: string;
  description: string;
  industries: string[];
  skills: string[];
  visibility: "public" | "private";
};

// Keyword → industry/skill mappings used by the offline fallback.
// Hand-curated to cover the common startup categories in the platform's
// taxonomy. If no keyword matches, we leave the arrays empty (rather
// than guessing).
const INDUSTRY_KEYWORDS: ReadonlyArray<[RegExp, string]> = [
  [/\b(e[- ]?commerce|retail|shop|store|cart|checkout|merchant)\b/i, "E-commerce"],
  [/\b(saas|b2b|enterprise|cloud platform)\b/i, "SaaS"],
  [/\b(ai|artificial intelligence|machine learning|ml|llm|gpt|gemini)\b/i, "AI/ML"],
  [/\b(health|wellness|medical|clinic|patient|therapy|fitness)\b/i, "Healthcare"],
  [/\b(edu|education|learn|tutor|school|student|course)\b/i, "Education"],
  [/\b(fintech|finance|banking|payment|wallet|invest|crypto)\b/i, "Fintech"],
  [/\b(consumer|d2c|direct to consumer|lifestyle|community)\b/i, "Consumer"],
  [/\b(climate|sustainability|green|carbon|renewable)\b/i, "Climate"],
  [/\b(food|beverage|restaurant|delivery|cafe|dining)\b/i, "Food & Beverage"],
  [/\b(travel|tourism|hotel|booking|flight)\b/i, "Travel"],
  [/\b(real estate|property|housing|rent)\b/i, "Real Estate"],
  // Expanded keyword coverage per product feedback ("AI isn't giving
  // tags") — short outlines like "online game" / "dating app" now
  // resolve to a sensible industry instead of an empty tag array.
  [/\b(game|gaming|multiplayer|esport|arcade|puzzle)\b/i, "Gaming"],
  [/\b(social|network|feed|chat|messaging|friends|dating)\b/i, "Social"],
  [/\b(video|streaming|podcast|music|audio|entertainment|media)\b/i, "Media"],
  [/\b(productivity|todo|task|calendar|notes|workflow)\b/i, "Productivity"],
  [/\b(fashion|apparel|clothing|beauty|cosmetic)\b/i, "Consumer"],
  [/\b(logistics|shipping|supply chain|warehouse)\b/i, "Logistics"],
  [/\b(security|cyber|privacy|encryption)\b/i, "Security"],
];

const SKILL_KEYWORDS: ReadonlyArray<[RegExp, string]> = [
  [/\b(frontend|react|next\.?js|ui|html|css|tailwind)\b/i, "Frontend"],
  [/\b(backend|api|server|node|python|rust|go|java)\b/i, "Backend"],
  [/\b(design|ui\/?ux|figma|prototyp|wireframe)\b/i, "Design"],
  [/\b(product management|product manager|pm|roadmap)\b/i, "Product Management"],
  [/\b(marketing|growth|seo|content|copy|brand)\b/i, "Marketing"],
  [/\b(data|analytic|sql|warehouse|dashboard)\b/i, "Data Science"],
  [/\b(mobile|ios|android|react native|flutter|swift|kotlin)\b/i, "Mobile"],
  [/\b(devops|infrastructure|ci\/?cd|kubernetes|docker|cloud)\b/i, "DevOps"],
  [/\b(ml|machine learning|model|training|pytorch|tensorflow)\b/i, "Data Science"],
  // Broader skill coverage so short outlines still land at least one
  // relevant chip (users report "no tags at all" for 2-word inputs).
  [/\b(game|gaming|unity|unreal|godot)\b/i, "Game Development"],
  [/\b(app|application|software|website|web app|platform|tool)\b/i, "Frontend"],
  [/\b(online|internet|web|browser)\b/i, "Frontend"],
  [/\b(video|streaming|audio|music)\b/i, "Media"],
  [/\b(chat|messaging|social|community)\b/i, "Product Management"],
  [/\b(sales|business|revenue|customer)\b/i, "Sales"],
];

function detectFromKeywords(
  outline: string,
  mappings: ReadonlyArray<[RegExp, string]>,
  max: number,
): string[] {
  const hits = new Set<string>();
  for (const [re, label] of mappings) {
    if (re.test(outline)) hits.add(label);
    if (hits.size >= max) break;
  }
  return Array.from(hits);
}

/**
 * Title-case a short string so a fallback title like "online game"
 * renders as "Online Game" (matches what an AI would produce). Leaves
 * already-capitalized runs alone so acronyms (SaaS, AI, iOS) survive.
 */
function toTitleCase(s: string): string {
  return s
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => (/[A-Z]/.test(w) ? w : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}

const fallback = (outline: string): GeneratedDraft => {
  // Extract a basic title from the outline (first sentence or first 60 chars)
  const firstSentence = outline.split(/[.!?]/)[0].trim();
  const rawTitle =
    firstSentence.length > 0 && firstSentence.length <= 80
      ? firstSentence
      : outline.slice(0, 60).trim() + (outline.length > 60 ? "..." : "");

  // Title-case the fallback so "online game" → "Online Game" — feels
  // like a real AI suggestion rather than the raw outline echo.
  const basicTitle = toTitleCase(rawTitle) || "New Idea";

  // PRODUCT DECISION: description is the user's outline verbatim. AI
  // only proposes the title/tags — never rewrites what the user typed
  // into the description box.
  //
  // Guarantee at least one industry + one skill so the wizard never
  // shows an empty tag row (user complaint: "AI isn't giving tags").
  // Falls back to broad generic chips when no keywords hit.
  const industries = detectFromKeywords(outline, INDUSTRY_KEYWORDS, 3);
  const skills = detectFromKeywords(outline, SKILL_KEYWORDS, 4);
  if (industries.length === 0) industries.push("Consumer");
  if (skills.length === 0) skills.push("Product Management");

  return {
    title: basicTitle,
    description: outline.trim(),
    industries,
    skills,
    visibility: "public",
  };
};

// Shared prompt used by both providers — keeps output consistent
// regardless of which one runs.
//
// IMPORTANT: description is *always* the user's outline verbatim. We do
// NOT ask the AI to write it and we do NOT accept a description field
// back — see parseDraft where we hard-override with the outline. The
// AI's job here is title + tags only, per product decision (user
// complaint: "the description should be same as the user typed, the
// AI should only write the title, tags, etc.").
const buildPrompt = (outline: string) => `You are an AI assistant helping builders post ideas on a startup-collaboration platform.

Your task: read the user's outline and propose a punchy title + relevant tags for it. DO NOT rewrite or expand the user's description — that field stays exactly as they typed it.

CRITICAL REQUIREMENTS:
1. Title MUST be catchy, specific, and 5-80 characters (NEVER empty).
2. Industries MUST include 1-3 relevant tags.
3. Skills MUST include 1-4 relevant tags.

Return ONLY valid JSON (no markdown, no code fences, no extra text):

{
  "title": "Catchy Title Here (5-80 chars, REQUIRED)",
  "industries": ["Industry1", "Industry2"],
  "skills": ["Skill1", "Skill2", "Skill3"],
  "visibility": "public"
}

Industry examples: Software, Healthcare, Education, Fintech, AI/ML, Consumer, Climate, Food & Beverage, E-commerce, SaaS
Skill examples: Design, Backend, Frontend, Product Management, Marketing, Mobile, Data Science, DevOps, UI/UX

User's outline (do NOT rewrite this text — you're only proposing metadata for it):
"""
${outline}
"""

Generate the JSON now:`;

// Defensive parser — strips markdown fences and validates types/sizes.
function parseDraft(raw: string, outline: string): GeneratedDraft | null {
  // Remove markdown code fences and extra whitespace
  let cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  
  // Try to extract JSON if there's extra text around it
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }
  
  if (!cleaned) {
    console.error("[ai] Empty response after cleaning");
    return null;
  }

  let parsed: Partial<GeneratedDraft>;
  try {
    parsed = JSON.parse(cleaned) as Partial<GeneratedDraft>;
  } catch (e) {
    console.error(`[ai] JSON parse failed. Raw response: ${raw.slice(0, 300)}`);
    console.error(`[ai] Cleaned text: ${cleaned.slice(0, 300)}`);
    return null;
  }

  const onlyStrings = (xs: unknown): string[] =>
    Array.isArray(xs)
      ? xs
          .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
          .map((s) => s.trim())
      : [];

  // Validate that we have a proper title
  const title = typeof parsed.title === "string" && parsed.title.trim().length > 0
    ? parsed.title.slice(0, 100).trim()
    : "";
    
  // If no title, this is an invalid response
  if (!title) {
    console.error("[ai] Parsed JSON has no valid title:", parsed);
    return null;
  }

  // PRODUCT DECISION: description is ALWAYS the user's outline verbatim.
  // Whatever the AI returns for `description` is discarded — the user
  // owns that field. AI only proposes title + tags.
  const description = outline.trim().slice(0, 1200);

  return {
    title,
    description,
    industries: onlyStrings(parsed.industries).slice(0, 3),
    skills: onlyStrings(parsed.skills).slice(0, 4),
    visibility: parsed.visibility === "private" ? "private" : "public",
  };
}

// (synthesizeDescription removed — description is now always the
// user's outline verbatim. See parseDraft above.)

// Try OpenAI gpt-4o-mini with strict JSON mode. Returns null on any error
// so the caller can decide whether to try Gemini next.
async function tryOpenAI(
  apiKey: string,
  outline: string
): Promise<GeneratedDraft | null> {
  try {
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You help builders post ideas on a startup-collaboration platform. Reply with a JSON object only — no markdown, no prose.",
        },
        { role: "user", content: buildPrompt(outline) },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const draft = parseDraft(raw, outline);
    if (draft && draft.title) {
      console.log(
        `[ai] OpenAI drafted OK — title: "${draft.title.slice(0, 50)}"`
      );
    }
    return draft;
  } catch (err) {
    const status = (err as { status?: number }).status;
    const message = err instanceof Error ? err.message : String(err);
    console.warn(
      `[ai] OpenAI failed${status ? ` (status ${status})` : ""}: ${message}`
    );
    return null;
  }
}

// Try Google Gemini 2.5 Flash. Returns null on any error.
async function tryGemini(
  apiKey: string,
  outline: string
): Promise<GeneratedDraft | null> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(buildPrompt(outline));
    const raw = result.response.text();
    const draft = parseDraft(raw, outline);
    if (draft && draft.title) {
      console.log(
        `[ai] Gemini drafted OK — title: "${draft.title.slice(0, 50)}"`
      );
    }
    return draft;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[ai] Gemini failed: ${message}`);
    return null;
  }
}

// Diagnostic — tells you which providers are configured + reachable.
// Run via: npx convex run ai:testGeminiConnection
export const testGeminiConnection = action({
  args: {},
  handler: async (): Promise<{
    openai: { configured: boolean; ok: boolean; detail?: string };
    gemini: { configured: boolean; ok: boolean; detail?: string };
  }> => {
    const openaiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    const openaiStatus = {
      configured: !!openaiKey,
      ok: false,
      detail: openaiKey ? undefined : "OPENAI_API_KEY not set",
    };
    const geminiStatus = {
      configured: !!geminiKey,
      ok: false,
      detail: geminiKey ? undefined : "GOOGLE_GENERATIVE_AI_API_KEY not set",
    };

    if (openaiKey) {
      try {
        const openai = new OpenAI({ apiKey: openaiKey });
        await openai.chat.completions.create({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            { role: "user", content: 'Return JSON: {"hello":"world"}' },
          ],
        });
        openaiStatus.ok = true;
      } catch (err) {
        const status = (err as { status?: number }).status;
        const msg = err instanceof Error ? err.message : String(err);
        openaiStatus.detail = `status ${status ?? "?"} — ${msg}`;
      }
    }

    if (geminiKey) {
      try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        await model.generateContent('Return JSON: {"hello":"world"}');
        geminiStatus.ok = true;
      } catch (err) {
        geminiStatus.detail = err instanceof Error ? err.message : String(err);
      }
    }

    return { openai: openaiStatus, gemini: geminiStatus };
  },
});

// Sample-idea seed used by the first-run tour. Builds an outline from
// the user's builder role + signup skills, then runs the same provider
// chain as generateIdeaFromOutline.
export const generateTutorialIdeaDraft = action({
  args: {
    role: v.optional(v.string()),
    skills: v.optional(v.array(v.string())),
  },
  handler: async (_ctx, { role, skills }): Promise<GeneratedDraft> => {
    const outline = personaOutlineFor(role, skills ?? []);
    const openaiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (openaiKey) {
      const draft = await tryOpenAI(openaiKey, outline);
      if (draft && draft.title) return draft;
    }
    if (geminiKey) {
      const draft = await tryGemini(geminiKey, outline);
      if (draft && draft.title) return draft;
    }
    return fallback(outline);
  },
});

function personaOutlineFor(role: string | undefined, skills: string[]): string {
  const skillSentence = skills.length
    ? `Skills they want to use: ${skills.slice(0, 5).join(", ")}.`
    : "";
  switch (role) {
    case "founder":
      return `A solo founder is launching a small SaaS that solves a daily annoyance for early-career builders. ${skillSentence} Generate a concrete, shippable v1 idea with one core feature and a clear who-it's-for.`;
    case "engineer":
      return `A software engineer wants to ship a developer-tools side project that saves teammates 30 minutes a day. ${skillSentence} Make it a focused single-purpose tool with a clear technical hook.`;
    case "designer":
      return `A product designer is exploring a small consumer app that makes a chore feel delightful. ${skillSentence} Make it visually distinctive and easy to demo.`;
    case "student":
      return `An engineering student is building a side project to learn in public and impress recruiters. ${skillSentence} Make it portfolio-worthy, scoped to a weekend MVP.`;
    case "researcher":
      return `A graduate researcher wants to turn their thesis topic into a public-facing tool that non-experts can use. ${skillSentence} Make the idea accessible and shareable.`;
    case "pm":
      return `A product manager is prototyping a workflow tool for cross-functional teams. ${skillSentence} Focus on the one workflow it nails before anything else.`;
    default:
      return `A new builder wants to ship their first public idea. ${skillSentence} Make it a small, focused project they can finish in a week or two.`;
  }
}

export const generateIdeaFromOutline = action({
  args: { outline: v.string() },
  handler: async (_ctx, { outline }): Promise<GeneratedDraft> => {
    const openaiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!openaiKey && !geminiKey) {
      console.warn(
        "[ai] No AI provider configured (set OPENAI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY); returning manual-fill fallback"
      );
      return fallback(outline);
    }

    // Try OpenAI first
    if (openaiKey) {
      const draft = await tryOpenAI(openaiKey, outline);
      if (draft && draft.title) return draft;
      console.warn("[ai] OpenAI returned empty/invalid draft; trying Gemini next");
    }

    // Fall back to Gemini
    if (geminiKey) {
      const draft = await tryGemini(geminiKey, outline);
      if (draft && draft.title) return draft;
    }

    console.warn("[ai] All providers failed; returning manual-fill fallback");
    return fallback(outline);
  },
});
