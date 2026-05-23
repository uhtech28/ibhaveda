import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  resolveQualityTier,
  getMetricDelta,
  applyMetricDelta,
  getStartingMetricValue,
} from "./templateEngine";

// ─────────────────────────────────────────────────────────────────────────────
// INLINE SCORING CONFIGS (mirrors templateTypes.ts AIScoringConfig)
// ─────────────────────────────────────────────────────────────────────────────

interface ScoringDimension {
  id: string;
  label: string;
  rubric: string;
  weight: number;
}

interface InlineScoringConfig {
  dimensions: [ScoringDimension, ScoringDimension, ScoringDimension, ScoringDimension];
  evaluatorPersona: string;
  workContext: string;
}

const ACADEMIC_SCORING: InlineScoringConfig = {
  dimensions: [
    { id: "evidence", label: "Evidence Quality", weight: 1.5, rubric: "Are claims supported by cited sources, empirical data, or peer-reviewed literature? (0=unsupported, 1=anecdotal, 2=partial evidence, 3=rigorous cited evidence)" },
    { id: "rigor", label: "Academic Rigor", weight: 1.5, rubric: "Is the methodology sound? Are assumptions stated? Are limitations acknowledged? (0=no rigor, 1=basic structure, 2=mostly rigorous, 3=fully rigorous)" },
    { id: "citation_quality", label: "Citation Quality", weight: 1, rubric: "Are sources properly cited, peer-reviewed, and relevant? (0=no citations, 1=web sources only, 2=some peer-reviewed, 3=high-quality peer-reviewed)" },
    { id: "originality", label: "Original Contribution", weight: 1, rubric: "Does the work contribute something new? (0=purely derivative, 1=slight variation, 2=moderate contribution, 3=clear original contribution)" },
  ],
  evaluatorPersona: "You are a rigorous academic peer reviewer assessing a researcher's submission for scholarly merit.",
  workContext: "academic research and publication",
};

const LAB_SCORING: InlineScoringConfig = {
  dimensions: [
    { id: "reproducibility", label: "Reproducibility", weight: 1.5, rubric: "Could another researcher replicate this experiment exactly from the documentation provided? (0=cannot replicate, 1=partially documented, 2=mostly reproducible, 3=fully reproducible)" },
    { id: "experimental_rigor", label: "Experimental Rigor", weight: 1.5, rubric: "Are controls established? Is the methodology scientifically sound? (0=no rigor, 1=basic controls, 2=mostly rigorous, 3=fully rigorous)" },
    { id: "technical_depth", label: "Technical Depth", weight: 1, rubric: "Is the technical implementation detailed and precise? (0=vague, 1=some detail, 2=mostly detailed, 3=fully specified)" },
    { id: "measurable_validation", label: "Measurable Validation", weight: 1, rubric: "Are results quantified with appropriate metrics? Is statistical significance addressed? (0=no metrics, 1=basic counts, 2=meaningful metrics, 3=statistically validated)" },
  ],
  evaluatorPersona: "You are a rigorous experimental scientist peer-reviewing a lab submission for methodological soundness and reproducibility.",
  workContext: "experimental research and laboratory science",
};

const CREATIVE_SCORING: InlineScoringConfig = {
  dimensions: [
    { id: "originality", label: "Originality", weight: 1.5, rubric: "Does the creative work present a genuinely unique voice, concept, or execution? (0=derivative/copied, 1=influenced but recognizable, 2=mostly original, 3=clearly distinctive and original)" },
    { id: "emotional_impact", label: "Emotional Impact", weight: 1.5, rubric: "Does the work evoke a clear emotional response? (0=no emotional resonance, 1=mild effect, 2=clear emotion, 3=powerful and intentional emotional impact)" },
    { id: "execution_quality", label: "Execution Quality", weight: 1, rubric: "Is the craft evident in the work? Does the execution match the intention? (0=rough/incomplete, 1=developing craft, 2=competent execution, 3=polished and purposeful)" },
    { id: "audience_resonance", label: "Audience Resonance", weight: 1, rubric: "Is there evidence the work connects with its intended audience? (0=no audience data, 1=anecdotal, 2=some documented reactions, 3=clear documented resonance)" },
  ],
  evaluatorPersona: "You are a creative director and arts critic evaluating a creative project submission for artistic merit and audience connection.",
  workContext: "creative project production and publication",
};

function getScoringConfig(templateId: "academic" | "lab" | "creative"): InlineScoringConfig {
  switch (templateId) {
    case "academic": return ACADEMIC_SCORING;
    case "lab":      return LAB_SCORING;
    case "creative": return CREATIVE_SCORING;
  }
}



// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type TemplateId = "venture" | "academic" | "lab" | "creative";

export interface TemplateScoringResult {
  dimension1: number; // 0–3
  dimension2: number; // 0–3
  dimension3: number; // 0–3
  dimension4: number; // 0–3
  totalScore: number; // 0–12
  qualityTier: "low" | "standard" | "high";
  feedback: string;
  modelUsed: string;
  metricDelta: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROMPT BUILDERS
// ─────────────────────────────────────────────────────────────────────────────

function buildTemplateScoringPrompt(
  content: string,
  checkpointOutcome: string,
  templateId: "academic" | "lab" | "creative",
): string {
  const config = getScoringConfig(templateId);
  const { dimensions, evaluatorPersona, workContext } = config;
  const [d1, d2, d3, d4] = dimensions;

  return `${evaluatorPersona}

CHECKPOINT OUTCOME BEING EVALUATED (${workContext}):
"${checkpointOutcome}"

SUBMISSION:
"${content}"

Score the submission on EXACTLY these four dimensions. Each dimension is scored 0, 1, 2, or 3.
Return ONLY a valid JSON object with no extra text.

SCORING RUBRIC:
- ${d1.id}: ${d1.rubric}
- ${d2.id}: ${d2.rubric}
- ${d3.id}: ${d3.rubric}
- ${d4.id}: ${d4.rubric}

Also write a single sentence of actionable feedback specific to ${workContext}.

RESPOND WITH ONLY THIS JSON (no markdown, no extra text):
{
  "${d1.id}": <0-3>,
  "${d2.id}": <0-3>,
  "${d3.id}": <0-3>,
  "${d4.id}": <0-3>,
  "feedback": "<one sentence of actionable feedback>"
}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// MOCK SCORER (for template-specific fallback)
// ─────────────────────────────────────────────────────────────────────────────

function mockTemplateScore(
  content: string,
  templateId: TemplateId,
): { d1: number; d2: number; d3: number; d4: number; feedback: string } {
  const words = content.trim().split(/\s+/).length;
  const hasNumbers = /\d+/.test(content);
  const hasLinks = /https?:\/\//.test(content);
  const hasQuotes = /"[^"]+"/.test(content);

  const base = words > 100 ? 3 : words > 50 ? 2 : words > 20 ? 1 : 0;
  const specific = (hasNumbers ? 1 : 0) + (words > 80 ? 1 : 0) + (hasLinks ? 1 : 0);

  const d1 = Math.min(3, base);
  const d2 = Math.min(3, specific);
  const d3 = Math.min(3, (hasLinks ? 2 : 0) + (hasQuotes ? 1 : 0));
  const d4 = Math.min(3, words > 60 ? 2 : words > 30 ? 1 : 0);

  const total = d1 + d2 + d3 + d4;
  const tier = total >= 9 ? "high" : total >= 5 ? "standard" : "low";

  const feedbackMap: Record<TemplateId, Record<"low" | "standard" | "high", string>> = {
    academic: {
      low: "Add peer-reviewed citations and more specific evidence to strengthen your academic submission.",
      standard: "Good foundation — include more rigorous evidence and clearly state your methodological choices.",
      high: "Strong academic work. Consider adding counter-arguments and directly citing your theoretical framework.",
    },
    lab: {
      low: "Specify your experimental parameters more precisely and document your measurement methodology.",
      standard: "Good experimental detail — ensure your protocol is reproducible and your variables are clearly isolated.",
      high: "Rigorous experimental design. Add statistical validation and confirm your results are reproducible.",
    },
    creative: {
      low: "Develop your original voice further and document specific audience reactions to strengthen this submission.",
      standard: "Good creative work — push for more emotional specificity and document external feedback.",
      high: "Strong creative execution. Consider documenting how the work has resonated with your intended audience.",
    },
    venture: {
      low: "Add specific names, numbers, and at least one external link.",
      standard: "Good start — include more concrete evidence like quotes, data sources, or user feedback.",
      high: "Strong submission. Consider adding direct quotes from users or competitors.",
    },
  };

  return {
    d1, d2, d3, d4,
    feedback: feedbackMap[templateId][tier],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// AI CALLER
// ─────────────────────────────────────────────────────────────────────────────

function parseTemplateScoringResponse(
  raw: string,
  templateId: "academic" | "lab" | "creative",
): { d1: number; d2: number; d3: number; d4: number; feedback: string; modelUsed: string } {
  const { dimensions } = getScoringConfig(templateId);

  const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`Could not parse JSON from AI response: ${raw.slice(0, 200)}`);

  const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
  const clamp = (v: unknown): number => Math.max(0, Math.min(3, Math.round(Number(v ?? 0))));

  return {
    d1: clamp(parsed[dimensions[0].id]),
    d2: clamp(parsed[dimensions[1].id]),
    d3: clamp(parsed[dimensions[2].id]),
    d4: clamp(parsed[dimensions[3].id]),
    feedback: String(parsed.feedback ?? "Continue refining your submission."),
    modelUsed: "unknown",
  };
}

async function scoreWithOpenAITemplate(
  content: string,
  checkpointOutcome: string,
  templateId: "academic" | "lab" | "creative",
  openAIApiKey: string,
): Promise<{ d1: number; d2: number; d3: number; d4: number; feedback: string; modelUsed: string }> {
  const prompt = buildTemplateScoringPrompt(content, checkpointOutcome, templateId);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAIApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      temperature: 0.1,
      max_tokens: 300,
      messages: [
        { role: "system", content: "You are a strict JSON-only evaluator. Respond only with valid JSON, no markdown fences." },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) throw new Error(`OpenAI API error ${response.status}`);
  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const raw = data?.choices?.[0]?.message?.content ?? "";
  const result = parseTemplateScoringResponse(raw, templateId);
  return { ...result, modelUsed: "gpt-4o" };
}

async function scoreWithClaudeTemplate(
  content: string,
  checkpointOutcome: string,
  templateId: "academic" | "lab" | "creative",
  anthropicApiKey: string,
): Promise<{ d1: number; d2: number; d3: number; d4: number; feedback: string; modelUsed: string }> {
  const prompt = buildTemplateScoringPrompt(content, checkpointOutcome, templateId);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": anthropicApiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-3-haiku-20240307",
      max_tokens: 1024,
      messages: [{ role: "user", content: `You are a strict JSON-only evaluator. Respond only with valid JSON, no markdown fences.\n\n${prompt}` }],
    }),
  });

  if (!response.ok) throw new Error(`Anthropic API error ${response.status}`);
  const data = await response.json() as { content?: Array<{ text?: string }> };
  const raw = data?.content?.[0]?.text ?? "";
  const result = parseTemplateScoringResponse(raw, templateId);
  return { ...result, modelUsed: "claude-3-haiku-20240307" };
}

// ─────────────────────────────────────────────────────────────────────────────
// CONVEX ACTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Template-aware task evaluation.
 * Used for Academic, Lab, and Creative templates.
 * Venture template continues to use the existing evaluateTaskSubmission in aiScoring.ts.
 */
export const evaluateTemplateTaskSubmission = action({
  args: {
    taskId: v.id("ventureTasks"),
    checkpointId: v.id("ventureCheckpoints"),
    ventureId: v.id("ventures"),
    stageNumber: v.number(),
    content: v.string(),
    checkpointOutcome: v.string(),
    templateId: v.union(
      v.literal("academic"),
      v.literal("lab"),
      v.literal("creative"),
    ),
    userTier: v.union(v.literal("free"), v.literal("pro")),
  },
  handler: async (ctx, args) => {
    const { content, checkpointOutcome, templateId, userTier } = args;

    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    let scored: { d1: number; d2: number; d3: number; d4: number; feedback: string; modelUsed: string };

    try {
      if (userTier === "pro" && ANTHROPIC_API_KEY) {
        scored = await scoreWithClaudeTemplate(content, checkpointOutcome, templateId, ANTHROPIC_API_KEY);
      } else if (OPENAI_API_KEY) {
        scored = await scoreWithOpenAITemplate(content, checkpointOutcome, templateId, OPENAI_API_KEY);
      } else {
        const mock = mockTemplateScore(content, templateId);
        scored = { ...mock, modelUsed: "mock" };
      }
    } catch (e) {
      console.error("[templateScoring] AI scoring failed, using mock:", e);
      const mock = mockTemplateScore(content, templateId);
      scored = { ...mock, modelUsed: "mock" };
    }

    const totalScore = scored.d1 + scored.d2 + scored.d3 + scored.d4;
    const qualityTier = resolveQualityTier(templateId, totalScore);
    const metricDelta = getMetricDelta(templateId, qualityTier);
    const startingValue = getStartingMetricValue(templateId);
    const metricValue = applyMetricDelta(templateId, startingValue, metricDelta);

    // Get dimension labels for storage
    const { dimensions: dims } = getScoringConfig(templateId);

    // Save to existing aiEvaluations table with template-specific dimension labels
    await ctx.runMutation(internal.aiScoring.saveEvaluationResult, {
      taskId: args.taskId,
      checkpointId: args.checkpointId,
      ventureId: args.ventureId,
      stageNumber: args.stageNumber,
      content,
      completeness: scored.d1,   // dimension 1 stored in completeness slot
      specificity: scored.d2,    // dimension 2 stored in specificity slot
      evidence: scored.d3,       // dimension 3 stored in evidence slot
      originality: scored.d4,    // dimension 4 stored in originality slot
      totalScore,
      qualityTier,
      valuationScore: metricValue,
      feedback: scored.feedback,
      modelUsed: scored.modelUsed,
    });

    return {
      dimension1: scored.d1,
      dimension2: scored.d2,
      dimension3: scored.d3,
      dimension4: scored.d4,
      dimension1Label: dims[0].label,
      dimension2Label: dims[1].label,
      dimension3Label: dims[2].label,
      dimension4Label: dims[3].label,
      totalScore,
      qualityTier,
      feedback: scored.feedback,
      modelUsed: scored.modelUsed,
      metricDelta,
      metricValue,
      templateId,
    };
  },
});
