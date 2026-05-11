import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// Walk parent links until we hit an idea with no parentId — that's the root.
// Used so sub-ideas the user is part of are reported under their root idea
// (community) instead of appearing as separate communities.
async function findRootIdea(
  ctx: { db: { get: (id: Id<"ideas">) => Promise<Doc<"ideas"> | null> } },
  ideaId: Id<"ideas">
): Promise<Doc<"ideas"> | null> {
  let current = await ctx.db.get(ideaId);
  let safety = 0;
  while (current && current.parentId && safety < 100) {
    const parent = await ctx.db.get(current.parentId);
    if (!parent) break;
    current = parent;
    safety += 1;
  }
  return current;
}

// Collect all descendants (sub-ideas, sub-sub-ideas, …) of a given idea.
async function collectDescendants(
  ctx: { db: any },
  rootId: Id<"ideas">
): Promise<Doc<"ideas">[]> {
  const out: Doc<"ideas">[] = [];
  const queue: Id<"ideas">[] = [rootId];
  const seen = new Set<string>();
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (seen.has(String(id))) continue;
    seen.add(String(id));
    const children = await ctx.db
      .query("ideas")
      .withIndex("by_parent", (q: any) => q.eq("parentId", id))
      .collect();
    for (const c of children) {
      if (c.isDeleted) continue;
      out.push(c);
      queue.push(c._id);
    }
  }
  return out;
}

// Communities = ROOT ideas the user is part of (authored or contributing to).
// Sub-ideas don't appear as their own communities — they show up as channels
// under their root idea once the user enters the community.
//
// BUG FIX (round 2b): previous version had subtle dedup holes that caused
// the same idea to render multiple times in the chat sidebar when it had
// multiple contributors. Now uses String() keys + a single Map so dedup is
// bulletproof against ID-type quirks and orphaned sub-ideas.
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

    const authoredIdeas = await ctx.db
      .query("ideas")
      .withIndex("by_author", (q) => q.eq("authorId", user._id))
      .collect();

    const acceptedRequests = await ctx.db
      .query("contributionRequests")
      .withIndex("by_contributor_status", (q) =>
        q.eq("contributorId", user._id).eq("status", "accepted")
      )
      .collect();

    // Step 1 — collect every idea id the user is connected to (authored or
    // accepted-contribution), deduped by stringified id.
    const relatedIdeaIdStrings = new Set<string>();
    for (const idea of authoredIdeas) {
      if (idea.isDeleted) continue;
      relatedIdeaIdStrings.add(String(idea._id));
    }
    for (const req of acceptedRequests) {
      relatedIdeaIdStrings.add(String(req.ideaId));
    }

    // Step 2 — resolve each to its ROOT and collect into a Map keyed by the
    // root's stringified id. Map guarantees one entry per unique root.
    const rootMap = new Map<string, Doc<"ideas">>();
    for (const idStr of relatedIdeaIdStrings) {
      const startIdea = await ctx.db.get(idStr as Id<"ideas">);
      if (!startIdea || startIdea.isDeleted) continue;

      const root = startIdea.parentId
        ? await findRootIdea(ctx, startIdea._id)
        : startIdea;
      if (!root || root.isDeleted) continue;

      const rootKey = String(root._id);
      if (!rootMap.has(rootKey)) {
        rootMap.set(rootKey, root);
      }
    }

    // Step 3 — return one entry per root.
    return Array.from(rootMap.values()).map((idea) => ({
      _id: idea._id,
      name: idea.title,
      description: idea.description,
    }));
  },
});

// Channels for a community (root idea):
//   1. Real "conversations" rows tied to the root idea or any descendant.
//   2. A virtual channel for each descendant sub-idea that doesn't yet have
//      a conversation, so the sub-idea is still browsable as a channel.
//
// `_id` here is the conversation id when one exists. For virtual entries it's
// "virtual:<ideaId>" — the front-end detects this prefix and calls
// `ensureSubIdeaChannel` before opening so the conversation is created on
// demand.
export const getChannels = query({
  args: { ideaId: v.id("ideas") },
  handler: async (ctx, args) => {
    const root = await ctx.db.get(args.ideaId);
    if (!root || root.isDeleted) return [];

    const descendants = await collectDescendants(ctx, args.ideaId);

    type ChannelEntry = {
      _id: string;
      name: string;
      type: string;
      lastMessageAt: number | undefined;
      unreadCount: number;
      ideaId: Id<"ideas">;
      virtual: boolean;
    };
    const out: ChannelEntry[] = [];

    // Root-level conversations show up as "general", "design", … channels.
    const rootConversations = await ctx.db
      .query("conversations")
      .withIndex("by_idea", (q) => q.eq("ideaId", args.ideaId))
      .collect();
    for (const c of rootConversations) {
      out.push({
        _id: String(c._id),
        name: c.name || "general",
        type: c.type ?? "group",
        lastMessageAt: c.updatedAt,
        unreadCount: c.unreadCount || 0,
        ideaId: c.ideaId ?? args.ideaId,
        virtual: false,
      });
    }

    // Each descendant sub-idea becomes a single channel — its own
    // conversation (if any), otherwise a virtual entry that creates the
    // conversation on first click.
    for (const sub of descendants) {
      const subConversation = await ctx.db
        .query("conversations")
        .withIndex("by_idea", (q) => q.eq("ideaId", sub._id))
        .first();
      if (subConversation) {
        out.push({
          _id: String(subConversation._id),
          name: subConversation.name || sub.title,
          type: subConversation.type ?? "group",
          lastMessageAt: subConversation.updatedAt,
          unreadCount: subConversation.unreadCount || 0,
          ideaId: sub._id,
          virtual: false,
        });
      } else {
        out.push({
          _id: `virtual:${String(sub._id)}`,
          name: sub.title,
          type: "group",
          lastMessageAt: undefined,
          unreadCount: 0,
          ideaId: sub._id,
          virtual: true,
        });
      }
    }

    return out;
  },
});

// Idempotent — make sure a default conversation exists for the given idea,
// returning its id. Used when a user clicks a sub-idea entry under a
// community and we want to drop them straight into a chat for it.
export const ensureSubIdeaChannel = mutation({
  args: { ideaId: v.id("ideas") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const idea = await ctx.db.get(args.ideaId);
    if (!idea || idea.isDeleted) throw new Error("Idea not found");

    // Already has a conversation? Reuse the first one.
    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_idea", (q) => q.eq("ideaId", args.ideaId))
      .first();
    if (existing) return existing._id;

    const channelId = await ctx.db.insert("conversations", {
      ideaId: args.ideaId,
      name: idea.title,
      type: "group",
      creatorId: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      participant1: user._id,
    });

    await ctx.db.insert("conversationMembers", {
      conversationId: channelId,
      userId: user._id,
      role: "admin",
      joinedAt: Date.now(),
    });

    return channelId;
  },
});

// Create a new (named) channel inside a community.
export const createChannel = mutation({
  args: {
    ideaId: v.id("ideas"),
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const channelId = await ctx.db.insert("conversations", {
      ideaId: args.ideaId,
      name: args.name,
      type: "group",
      creatorId: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      participant1: user._id,
    });

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
      .withIndex("by_conversation_created", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("desc")
      .take(limit);

    const enhancedMessages = await Promise.all(
      messages.map(async (msg) => {
        const sender = await ctx.db.get(msg.senderId);
        return {
          ...msg,
          senderName: sender?.displayName || sender?.username || "Unknown",
          senderAvatar: sender?.avatar,
        };
      })
    );

    return enhancedMessages.reverse();
  },
});