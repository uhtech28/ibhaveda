"use node";

// Convex action that drafts a full idea form from a free-text outline
// using OpenAI (ChatGPT). Used by the 3-step "AI wizard" flow on the
// Feed + button: user describes their idea in 1-3 sentences, we return
// a fully pre-filled (but editable) form for them to review and post.
//
// Requires `OPENAI_API_KEY` on the Convex deployment:
//   npx convex env set OPENAI_API_KEY sk-...
//
// Uses `gpt-4o-mini` for speed + cost (~$0.0001 per generation, ~1-2 sec
// response). Swap the model name below if you want a stronger one.
//
// Falls back gracefully (drops user into an empty form with their
// outline as the description starter) if the key is missing, the
// account is out of quota, or the model returns unparseable output —
// so the user is never blocked from posting manually.

import { v } from "convex/values";
import { action } from "./_generated/server";
import OpenAI from "openai";

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

export const generateIdeaFromOutline = action({
  args: { outline: v.string() },
  handler: async (_ctx, { outline }): Promise<GeneratedDraft> => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn("[ai] OPENAI_API_KEY not set; returning manual-fill fallback");
      return fallback(outline);
    }

    try {
      const openai = new OpenAI({ apiKey });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        // Forces a valid JSON object — saves us from regex-stripping
        // markdown fences. The prompt also has to mention "JSON" for
        // this mode to be allowed.
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You help builders post ideas on a startup-collaboration platform. Reply with a JSON object only — no markdown, no prose.",
          },
          {
            role: "user",
            content: `Given this free-text outline, return ONLY a JSON object with these fields:

{
  "title": "...",          // Catchy, specific, <= 80 chars
  "description": "...",    // 2-4 sentences, concrete and clear
  "industries": [...],     // 1-3 short industry tags (e.g. "Software", "Healthcare", "Education")
  "skills": [...],         // 1-4 short skill tags (e.g. "Design", "Backend", "Product Management")
  "visibility": "public"
}

Outline:
"""
${outline}
"""

Return ONLY the raw JSON object.`,
          },
        ],
      });

      const raw = completion.choices[0]?.message?.content ?? "";
      if (!raw) return fallback(outline);

      const parsed = JSON.parse(raw) as Partial<GeneratedDraft>;

      // Defensive: validate types and sizes before handing back to the UI.
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
          typeof parsed.description === "string" && parsed.description.trim().length > 0
            ? parsed.description.slice(0, 1200).trim()
            : outline,
        industries: onlyStrings(parsed.industries).slice(0, 3),
        skills: onlyStrings(parsed.skills).slice(0, 4),
        visibility: parsed.visibility === "private" ? "private" : "public",
      };
    } catch (err) {
      // Common failure modes — logged so the admin can diagnose, but
      // the user is dropped into an editable form with the outline so
      // they can post manually.
      //   - 401: invalid API key
      //   - 429: account out of quota / rate-limited
      //   - 400 model_not_found: account doesn't have access to gpt-4o-mini
      const status = (err as { status?: number }).status;
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[ai] generateIdeaFromOutline failed${status ? ` (status ${status})` : ""}: ${message}`);
      return fallback(outline);
    }
  },
});
