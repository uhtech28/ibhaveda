import { v } from "convex/values";
import { internalMutation, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Helper to get or create the Agent User
async function getAgentUserId(ctx: MutationCtx): Promise<Id<"users">> {
    const agentClerkId = "internal_agent_007";
    const existing = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", agentClerkId))
        .first();

    const agentName = "Alex (AI Curator)";

    if (existing) {
        // Ensure name is up to date
        if (existing.displayName !== agentName) {
            await ctx.db.patch(existing._id, { displayName: agentName });
        }
        return existing._id;
    }

    // Create Agent if not exists
    const now = Date.now();
    const newId = await ctx.db.insert("users", {
        clerkId: agentClerkId,
        username: "interactive_ai",
        displayName: agentName,
        bio: "Curating the best startup ideas with a touch of AI magic. ⚡️",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=fluffy",
        completedOnboarding: true,
        role: "admin",
        createdAt: now,
        updatedAt: now,
        skills: ["Ideation", "Strategy", "Trends"],
        industry: "Tech",
        industries: ["Tech"],
    });
    return newId;
}

export const postIdea = internalMutation({
    args: {
        title: v.string(),
        description: v.string(),
        category: v.string(), // e.g., "Technology, AI"
    },
    handler: async (ctx, args) => {
        const agentId = await getAgentUserId(ctx);
        const now = Date.now();

        const ideaId = await ctx.db.insert("ideas", {
            authorId: agentId,
            title: args.title,
            description: args.description,
            category: args.category,
            visibility: "public",
            sparkCount: 0,
            commentCount: 0,
            createdAt: now,
            updatedAt: now,
        });

        console.log(`🤖 Agent posted idea: ${ideaId}`);
        return ideaId;
    },
});

export const spark = internalMutation({
    args: {
        ideaId: v.id("ideas"),
    },
    handler: async (ctx, args) => {
        const agentId = await getAgentUserId(ctx);

        // Check if already sparked
        const existing = await ctx.db
            .query("userIdeaSparks")
            .withIndex("by_user_idea", (q) => q.eq("userId", agentId).eq("ideaId", args.ideaId))
            .first();

        if (existing) return; // Already sparked

        await ctx.db.insert("userIdeaSparks", {
            userId: agentId,
            ideaId: args.ideaId,
            createdAt: Date.now(),
        });

        // Increment idea spark count
        const idea = await ctx.db.get(args.ideaId);
        if (idea) {
            await ctx.db.patch(args.ideaId, { sparkCount: idea.sparkCount + 1 });
        }
    },
});

export const comment = internalMutation({
    args: {
        ideaId: v.id("ideas"),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        const agentId = await getAgentUserId(ctx);
        const now = Date.now();

        await ctx.db.insert("comments", {
            authorId: agentId,
            ideaId: args.ideaId,
            content: args.content,
            createdAt: now,
        });

        // Increment idea comment count
        const idea = await ctx.db.get(args.ideaId);
        if (idea) {
            await ctx.db.patch(args.ideaId, { commentCount: (idea.commentCount || 0) + 1 });
        }

        console.log(`🤖 Agent commented on: ${args.ideaId}`);
    },
});
