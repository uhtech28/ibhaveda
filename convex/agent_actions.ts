"use node";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

export const generateDailyIdea = action({
    args: {},
    handler: async (ctx) => {
        try {
            // Using gemini-2.5-flash (Current 2026 Model)
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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

            const result = await model.generateContent(prompt);
            const response = result.response;
            const text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();

            console.log("🤖 Gemini Generated Idea:", text);
            const ideaData = JSON.parse(text);

            const api = internal as any;
            await ctx.runMutation(api.agent.postIdea, {
                title: ideaData.title,
                description: ideaData.description,
                category: ideaData.category,
            });

        } catch (error) {
            console.error("❌ Error generating daily idea:", error);
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
