import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Get list of communities (Ideas) the user is part of
export const getUserCommunities = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user) return [];

        // 1. Get ideas authored by user
        const authoredIdeas = await ctx.db
            .query("ideas")
            .withIndex("by_author", (q) => q.eq("authorId", user._id))
            .collect();

        // 2. Get ideas where user is an accepted contributor
        const acceptedRequests = await ctx.db
            .query("contributionRequests")
            .withIndex("by_contributor_status", (q) =>
                q.eq("contributorId", user._id).eq("status", "accepted")
            )
            .collect();

        const uniqueContributedIdeaIds = Array.from(new Set(acceptedRequests.map(r => r.ideaId)));

        // Fetch unique contributed ideas (that are not already in authored)
        const contributedIdeas = [];
        for (const ideaId of uniqueContributedIdeaIds) {
            if (authoredIdeas.some(i => i._id === ideaId)) continue;
            const idea = await ctx.db.get(ideaId);
            if (idea && !idea.isDeleted) contributedIdeas.push(idea);
        }

        const allIdeasRaw = [...authoredIdeas, ...contributedIdeas];

        // Map to community metadata, deduplicating by _id as a final safety measure
        const allIdeasMap = new Map();
        allIdeasRaw.forEach(idea => {
            if (!idea.isDeleted) {
                allIdeasMap.set(idea._id, {
                    _id: idea._id,
                    name: idea.title,
                    description: idea.description,
                });
            }
        });

        return Array.from(allIdeasMap.values());
    },
});

// Get channels for a specific community (Idea)
export const getChannels = query({
    args: { ideaId: v.id("ideas") },
    handler: async (ctx, args) => {
        // Check if user has access to this idea? 
        // For public ideas, maybe everyone can see channels? 
        // For now, let's assume if you can call this, you see the channels. 
        // Realistically we should check membership.

        const channels = await ctx.db
            .query("conversations")
            .withIndex("by_idea", (q) => q.eq("ideaId", args.ideaId))
            .collect();

        return channels.map(c => ({
            _id: c._id,
            name: c.name || "Unnamed Channel",
            type: c.type,
            lastMessageAt: c.updatedAt,
            unreadCount: c.unreadCount || 0, // This needs user-specific logic actually
        }));
    },
});

// Create a new channel in a community
export const createChannel = mutation({
    args: {
        ideaId: v.id("ideas"),
        name: v.string(),
        description: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user) throw new Error("User not found");

        // Validate membership (Author or Contributor)
        // ... simplified for now ...

        const channelId = await ctx.db.insert("conversations", {
            ideaId: args.ideaId,
            name: args.name,
            type: "group", // Default to group for channels
            creatorId: user._id,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            participant1: user._id, // Add creator as participant
        });

        // Add to members
        await ctx.db.insert("conversationMembers", {
            conversationId: channelId,
            userId: user._id,
            role: "admin",
            joinedAt: Date.now(),
        });

        return channelId;
    },
});

// Send a message
export const sendMessage = mutation({
    args: {
        conversationId: v.id("conversations"),
        content: v.string(),
        type: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user) throw new Error("User not found");

        const messageId = await ctx.db.insert("messages", {
            senderId: user._id,
            conversationId: args.conversationId,
            content: args.content,
            createdAt: Date.now(),
            read: false,
            messageType: args.type || "text",
        });

        // Update conversation updated_at
        await ctx.db.patch(args.conversationId, {
            updatedAt: Date.now(),
            lastMessageId: messageId,
        });

        return messageId;
    },
});

// Get messages for a channel
export const getMessages = query({
    args: {
        conversationId: v.id("conversations"),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit || 50;
        const messages = await ctx.db
            .query("messages")
            .withIndex("by_conversation_created", (q) => q.eq("conversationId", args.conversationId))
            .order("desc") // Newest first
            .take(limit);

        // Enhance with sender info
        const enhancedMessages = await Promise.all(messages.map(async (msg) => {
            const sender = await ctx.db.get(msg.senderId);
            return {
                ...msg,
                senderName: sender?.displayName || sender?.username || "Unknown",
                senderAvatar: sender?.avatar,
            };
        }));

        return enhancedMessages.reverse(); // Return oldest first for chat view
    },
});
