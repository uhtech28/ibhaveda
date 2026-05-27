"use node";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const FALLBACK_IDEAS = [
    {
        title: "GitPulse",
        description: "An interactive dashboard that gamifies team git commits and tracks productivity metrics in real-time. Turn code reviews and merges into collaborative quests.",
        category: "Technology, Developer Tools"
    },
    {
        title: "EduQuest",
        description: "A platform that converts boring online textbook chapters into interactive, choice-driven text adventure games. Keep students engaged while learning complex topics.",
        category: "Education, Gaming"
    },
    {
        title: "EcoTrace",
        description: "A smart extension that calculates and offsets the carbon footprint of your digital subscriptions. Track server emissions and contribute directly to verified climate projects.",
        category: "Climate, SaaS"
    },
    {
        title: "DesignFlow",
        description: "A collaborative canvas tool that automatically generates clean UI component code from hand-drawn paper sketches. Bridge the gap between low-fi wireframing and frontend coding.",
        category: "Technology, Design"
    },
    {
        title: "SkillMap",
        description: "A visual, community-driven skill tree generator for learning new technologies. Developers can share their learning roadmaps and earn badges as they progress.",
        category: "Education, Developer Tools"
    },
    {
        title: "FitQuest",
        description: "A mobile RPG where your character levels up and gains attributes based on your real-world workouts and steps. Battle bosses with your friends by staying active.",
        category: "Health, Gaming"
    },
    {
        title: "LocalBites",
        description: "A micro-subscription service that delivers surprise chef-special dishes from independent local home kitchen businesses every week. Support neighborhood culinary talent.",
        category: "Food, E-commerce"
    },
    {
        title: "SubZero",
        description: "An intelligent, unified subscription manager that automatically pauses or cancels unused streaming services or software licenses. Never pay for forgotten free trials again.",
        category: "Finance, SaaS"
    },
    {
        title: "SoundScape",
        description: "A productivity app that dynamically creates generative ambient soundscapes tuned to your focus level and heart rate. Boost concentration and reduce stress.",
        category: "Productivity, Health"
    },
    {
        title: "CrowdSolve",
        description: "A localized civic engagement app where neighbors vote on local community improvement projects, and local governments or crowd-funders finance the top voted ideas.",
        category: "Social, Community"
    }
];

async function callOpenAI(apiKey: string, prompt: string): Promise<string> {
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
            {
                role: "system",
                content: "You help share startup and side project ideas. Reply with a JSON object only — no markdown, no prose.",
            },
            { role: "user", content: prompt },
        ],
    });
    return completion.choices[0]?.message?.content ?? "";
}

async function callGemini(apiKey: string, prompt: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    return result.response.text();
}

export const generateDailyIdea = action({
    args: {},
    handler: async (ctx) => {
        const prompt = `
        You are a creative entrepreneur sharing a cool side project idea with friends.
        Generate a unique, feasible, and specific startup idea / project concept.
        
        TONE GUIDE:
        - Write like a real person, not a bot.
        - Be casual, engaging, and avoid corporate buzzwords.
        - Use natural language (e.g., "Think of it like...", "What if we could...").
        
        Return ONLY a JSON object with the following fields:
        {
          "title": "Short catchy title (no colons, just a name)",
          "description": "2-3 sentences max. Engaging query or statement followed by the solution.",
          "category": "Technology, Education" (comma separated)
        }
        Do not include markdown code blocks. Just the raw JSON.
      `;

        let text = "";
        let success = false;
        const maxRetries = 3;

        // Try OpenAI first if configured
        const openaiKey = process.env.OPENAI_API_KEY;
        if (openaiKey) {
            for (let i = 0; i < maxRetries; i++) {
                try {
                    console.log(`🤖 Attempting to generate daily idea via OpenAI (Attempt ${i + 1}/${maxRetries})...`);
                    text = await callOpenAI(openaiKey, prompt);
                    if (text && text.trim()) {
                        success = true;
                        break;
                    }
                } catch (error) {
                    console.warn(`⚠️ OpenAI attempt ${i + 1} failed:`, error);
                    if (i < maxRetries - 1) await sleep(1500 * (i + 1));
                }
            }
        }

        // Try Gemini next if OpenAI wasn't used or failed
        const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!success && geminiKey) {
            for (let i = 0; i < maxRetries; i++) {
                try {
                    console.log(`🤖 Attempting to generate daily idea via Gemini (Attempt ${i + 1}/${maxRetries})...`);
                    text = await callGemini(geminiKey, prompt);
                    if (text && text.trim()) {
                        success = true;
                        break;
                    }
                } catch (error) {
                    console.warn(`⚠️ Gemini attempt ${i + 1} failed:`, error);
                    if (i < maxRetries - 1) await sleep(2000 * (i + 1)); // Backoff delay
                }
            }
        }

        let ideaData;
        if (success && text) {
            try {
                const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
                console.log("🤖 Raw generated idea text:", cleaned);
                ideaData = JSON.parse(cleaned);
            } catch (parseError) {
                console.error("❌ Failed to parse generated idea JSON:", parseError);
            }
        }

        // Fallback if AI failed or returned invalid JSON
        if (!ideaData || !ideaData.title || !ideaData.description) {
            console.warn("⚠️ AI generation/parsing failed completely. Using random fallback idea.");
            ideaData = FALLBACK_IDEAS[Math.floor(Math.random() * FALLBACK_IDEAS.length)];
        }

        try {
            const api = internal as any;
            await ctx.runMutation(api.agent.postIdea, {
                title: ideaData.title,
                description: ideaData.description,
                category: ideaData.category || "Technology",
            });
            console.log(`✅ Daily idea posted successfully: "${ideaData.title}"`);
        } catch (error) {
            console.error("❌ Error posting daily idea mutation:", error);
        }
    },
});

export const generateEngagement = action({
    args: {},
    handler: async (ctx) => {
        try {
            // Engagement now equals just "Sparking" (Liking) per user request.
            // No LLM generation needed for a simple like.

            const api = internal as any;
            const recentIdeas = await ctx.runQuery(api.ideas.getRecentIdeasInternal, { limit: 5 });

            if (!recentIdeas || recentIdeas.length === 0) {
                console.log("🤖 No ideas to engage with.");
                return;
            }

            // Pick one randomly
            const targetIdea = recentIdeas[Math.floor(Math.random() * recentIdeas.length)];

            console.log(`🤖 Sparking idea: ${targetIdea._id}`);

            const api2 = internal as any;
            await ctx.runMutation(api2.agent.spark, {
                ideaId: targetIdea._id,
            });
            console.log(`✅ Sparked idea: ${targetIdea._id}`);

        } catch (error) {
            console.error("❌ Error generating engagement:", error);
        }
    },
});

