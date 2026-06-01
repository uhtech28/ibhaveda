"use node";
import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { AGENT_POOL, POOL_SIZE } from "./agent";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ── All 40 top-level industries from the Industry Cards document ───────────────

const INDUSTRIES = [
  "Chemicals",
  "Metals and Mining",
  "Automobiles and Private Transportation",
  "Public Transportation",
  "Media and Entertainment",
  "Travel, Tourism, and Hospitality",
  "Household Goods and Appliances",
  "Consumer Electronics",
  "Food, Beverage, Tobacco, and Consumables",
  "Healthcare and Life Sciences",
  "Energy",
  "Finance",
  "Aerospace and Aviation",
  "Defence and Security",
  "Construction and Building Materials",
  "Manufacturing (General)",
  "Industrial Equipment and Services",
  "Real Estate",
  "Telecommunications",
  "Software and Technology",
  "Utilities",
  "Agriculture and Natural Resources",
  "Labour and Workforce",
  "Corporate and Management Services",
  "Sales and Marketing",
  "Professional Services",
  "Environmental and Social Impact",
  "Education and Academia",
  "Retail and Commerce",
  "Logistics and Supply Chain",
  "Textiles and Apparel",
  "Sports Industry",
  "Religious and Cultural Institutions",
  "Government and Public Administration",
  "Research and Development",
  "Security and Risk Management",
  "Space Economy",
  "Creator Economy",
  "Pet Industry",
  "Luxury Industry",
];

// ── LLM helpers ───────────────────────────────────────────────────────────────

async function callOpenAI(apiKey: string, prompt: string, jsonMode = true): Promise<string> {
  const openai = new OpenAI({ apiKey });
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    messages: [
      {
        role: "system",
        content: jsonMode
          ? "You help share startup and side project ideas. Reply with a JSON object only — no markdown, no prose."
          : "You are a thoughtful startup community member. Reply naturally and concisely.",
      },
      { role: "user", content: prompt },
    ],
    max_tokens: jsonMode ? 300 : 80,
  });
  return completion.choices[0]?.message?.content ?? "";
}

async function callGemini(apiKey: string, prompt: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

function pickProvider(): "openai" | "gemini" | null {
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) return "gemini";
  return null;
}

// ── Idea generation ───────────────────────────────────────────────────────────

type AgentProfile = {
  displayName: string;
  bio: string;
  industries: readonly string[];
  skills: readonly string[];
};

async function generateIdeaForAgent(
  agent: AgentProfile,
): Promise<{ title: string; description: string; category: string } | null> {
  // Pick a random industry from the agent's own list so ideas stay on-profile
  const industry = agent.industries[Math.floor(Math.random() * agent.industries.length)];

  const prompt = `
You are ${agent.displayName} — a founder sharing a startup idea with the Interactive Ideas community.
Your background: ${agent.bio}
Your skills: ${agent.skills.join(", ")}
Industry focus: ${industry}

Generate a unique, feasible startup idea that genuinely fits your background and skills.

TONE GUIDE:
- Write in first person, like you just thought of this and you're excited.
- Be specific — draw on your skills and domain experience.
- Avoid generic buzzwords. Sound like a real founder, not a pitch deck.
- Indian market context is relevant where it fits naturally.

Return ONLY a JSON object — no markdown, no code fences:
{
  "title": "Short catchy title (no colons, max 60 chars)",
  "description": "2-3 sentences. Hook with a problem or observation you've personally noticed, then the solution.",
  "category": "${industry}"
}`.trim();

  const maxRetries = 3;
  const openaiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  const tryParse = (raw: string) => {
    const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : cleaned);
    if (parsed?.title && parsed?.description) return parsed as { title: string; description: string; category: string };
    return null;
  };

  if (openaiKey) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const text = await callOpenAI(openaiKey, prompt);
        const result = tryParse(text);
        if (result) return result;
      } catch (err) {
        console.warn(`⚠️ OpenAI idea attempt ${i + 1} failed:`, err);
        if (i < maxRetries - 1) await sleep(1500 * (i + 1));
      }
    }
  }

  if (geminiKey) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const text = await callGemini(geminiKey, prompt);
        const result = tryParse(text);
        if (result) return result;
      } catch (err) {
        console.warn(`⚠️ Gemini idea attempt ${i + 1} failed:`, err);
        if (i < maxRetries - 1) await sleep(2000 * (i + 1));
      }
    }
  }

  return null;
}


// ── Comment generation ────────────────────────────────────────────────────────

async function generateComment(idea: {
  title: string;
  description: string;
}): Promise<string> {
  const prompt = `You're a fellow entrepreneur browsing a startup ideas feed. Write a short, genuine comment on this idea:

Title: "${idea.title}"
Description: "${idea.description}"

Rules:
- 1-2 sentences only
- Be specific to the idea — no generic phrases like "Great idea!" or "Love this!"
- Sound like a real person, not a reviewer
- No emojis, no hashtags`;

  const openaiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  try {
    if (openaiKey) {
      return await callOpenAI(openaiKey, prompt, false);
    }
    if (geminiKey) {
      return (await callGemini(geminiKey, prompt)).trim();
    }
  } catch (err) {
    console.warn("⚠️ Comment generation failed:", err);
  }
  return "";
}

// ── Actions ───────────────────────────────────────────────────────────────────

// Entry point called by the daily cron. Picks 1-3 unique random agents,
// posts immediately from the first, and schedules the rest at random
// intervals throughout the day (2–9 hours apart).
export const generateDailyIdea = internalAction({
  args: {},
  handler: async (ctx) => {
    const api = internal as any;

    const numPosts = Math.floor(Math.random() * 3) + 1; // 1, 2, or 3
    console.log(`🤖 Scheduling ${numPosts} post(s) today`);

    // Pick numPosts unique agent indices
    const indices: number[] = [];
    while (indices.length < numPosts) {
      const idx = Math.floor(Math.random() * POOL_SIZE);
      if (!indices.includes(idx)) indices.push(idx);
    }

    // First post fires immediately
    await ctx.runAction(api.agent_actions.postFromAgent, {
      agentIndex: indices[0],
    });

    // Remaining posts scheduled at random times later in the day
    for (let i = 1; i < indices.length; i++) {
      const delayMs = (2 + Math.floor(Math.random() * 7)) * 60 * 60 * 1000; // 2–8 h
      await ctx.scheduler.runAfter(delayMs, api.agent_actions.postFromAgent, {
        agentIndex: indices[i],
      });
      console.log(
        `🤖 Scheduled post ${i + 1} from agent[${indices[i]}] in ~${Math.round(delayMs / 3_600_000)}h`,
      );
    }
  },
});

// Posts one idea as the given agent, then runs an engagement sweep covering
// all real-user public ideas published since this agent's previous post.
export const postFromAgent = internalAction({
  args: { agentIndex: v.number() },
  handler: async (ctx, args) => {
    const api = internal as any;

    if (pickProvider() === null) {
      console.error("❌ No LLM provider configured — set OPENAI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY");
      return;
    }

    // Capture the last-post timestamp BEFORE posting so the engagement window
    // covers ideas published between the previous post and this one.
    const lastPostTime: number | null = await ctx.runQuery(
      api.agent.getAgentLastPostTime,
      { agentIndex: args.agentIndex },
    );

    const agent = AGENT_POOL[args.agentIndex];
    const industry = agent.industries[Math.floor(Math.random() * agent.industries.length)];
    console.log(`🤖 Agent[${args.agentIndex}] (${agent.displayName}) generating idea in: ${industry}`);

    const ideaData = await generateIdeaForAgent(agent);
    if (!ideaData) {
      console.error(`❌ Agent[${args.agentIndex}] idea generation failed — skipping`);
      return;
    }

    await ctx.runMutation(api.agent.postIdea, {
      agentIndex: args.agentIndex,
      title: ideaData.title,
      description: ideaData.description,
      category: ideaData.category,
    });
    console.log(`✅ Agent[${args.agentIndex}] posted: "${ideaData.title}"`);

    // Engagement sweep — skip on first ever post (no prior window to cover)
    if (lastPostTime !== null) {
      await ctx.runAction(api.agent_actions.engageAsAgent, {
        agentIndex: args.agentIndex,
        since: lastPostTime,
      });
    }
  },
});

// Likes every real-user public idea posted since `since`, then generates
// and posts a unique comment on a random ~33% of them.
export const engageAsAgent = internalAction({
  args: {
    agentIndex: v.number(),
    since: v.number(),
  },
  handler: async (ctx, args) => {
    const api = internal as any;

    const ideas = await ctx.runQuery(api.agent.getRealUserIdeasSince, {
      since: args.since,
    });

    if (ideas.length === 0) {
      console.log(`🤖 Agent[${args.agentIndex}] no new real-user ideas to engage with`);
      return;
    }

    console.log(`🤖 Agent[${args.agentIndex}] engaging with ${ideas.length} idea(s)`);

    for (const idea of ideas) {
      // Spark (like) every idea
      await ctx.runMutation(api.agent.spark, {
        agentIndex: args.agentIndex,
        ideaId: idea._id,
      });

      // Comment on ~33%
      if (Math.random() < 0.33) {
        const text = await generateComment({
          title: idea.title,
          description: idea.description,
        });
        if (text) {
          await ctx.runMutation(api.agent.comment, {
            agentIndex: args.agentIndex,
            ideaId: idea._id,
            content: text,
          });
        }
      }
    }

    console.log(`✅ Agent[${args.agentIndex}] engagement sweep complete`);
  },
});

// Accepts all pending contribution requests on agent-authored ideas.
// Scheduled to run every 4 hours by crons.ts.
export const acceptPendingContributions = internalAction({
  args: {},
  handler: async (ctx) => {
    const api = internal as any;
    await ctx.runMutation(api.agent.acceptPendingContributionRequests, {});
  },
});

// Kept as a stub so any already-scheduled Convex runs don't error out.
// The hourly engagement cron has been removed — engagement now happens
// inline with each post via engageAsAgent.
export const generateEngagement = internalAction({
  args: {},
  handler: async () => {
    console.log("🤖 generateEngagement: superseded by per-post engagement in postFromAgent");
  },
});
