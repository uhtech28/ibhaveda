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

const fallback = (outline: string): GeneratedDraft => ({
  title: "",
  description: outline,
  industries: [],
  skills: [],
  visibility: "public",
});

// Shared prompt used by both providers — keeps output consistent
// regardless of which one runs.
const buildPrompt = (outline: string) => `You help builders post ideas on a startup-collaboration platform.

Given this free-text outline from a user, generate a structured JSON object that EXPANDS on what they wrote — don't just copy it back. Add a real catchy title, rewrite the description so it's clearer and more concrete, and infer the most relevant industry + skill tags from the content.

Return ONLY a JSON object in this exact shape (no markdown, no code fences, no prose around it):

{
  "title": "Catchy, specific title (e.g. 'AI Recipe Generator for Diabetics'). MUST be present, <= 80 chars, NOT empty.",
  "description": "2-4 sentences. Concrete and clear. Expand on the outline — describe what the idea does, who it helps, and what makes it different. Do NOT copy the outline verbatim.",
  "industries": ["1 to 3 short industry tags. Examples: Software, Healthcare, Education, Fintech, AI/ML, Consumer, Climate"],
  "skills": ["1 to 4 short skill tags. Examples: Design, Backend, Frontend, Product Management, Marketing, Mobile, Data Science"],
  "visibility": "public"
}

User's outline:
"""
${outline}
"""`;

// Defensive parser — strips markdown fences and validates types/sizes.
function parseDraft(raw: string, outline: string): GeneratedDraft | null {
  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  if (!cleaned) return null;

  let parsed: Partial<GeneratedDraft>;
  try {
    parsed = JSON.parse(cleaned) as Partial<GeneratedDraft>;
  } catch (e) {
    console.error(`[ai] JSON parse failed. Cleaned text was: ${cleaned.slice(0, 500)}`);
    return null;
  }

  const onlyStrings = (xs: unknown): string[] =>
    Array.isArray(xs)
      ? xs
          .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
          .map((s) => s.trim())
      : [];

  return {
    title:
      typeof parsed.title === "string" ? parsed.title.slice(0, 100).trim() : "",
    description:
      typeof parsed.description === "string" &&
      parsed.description.trim().length > 0
        ? parsed.description.slice(0, 1200).trim()
        : outline,
    industries: onlyStrings(parsed.industries).slice(0, 3),
    skills: onlyStrings(parsed.skills).slice(0, 4),
    visibility: parsed.visibility === "private" ? "private" : "public",
  };
}

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
