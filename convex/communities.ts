import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

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

    const relatedIdeaIdStrings = new Set<string>();
    for (const idea of authoredIdeas) {
      if (idea.isDeleted) continue;
      relatedIdeaIdStrings.add(String(idea._id));
    }
    for (const req of acceptedRequests) {
      relatedIdeaIdStrings.add(String(req.ideaId));
    }

    const rootMap = new Map<string, Doc<"ideas">>();
    for (const idStr of relatedIdeaIdStrings) {
      const startIdea = await ctx.db.get(idStr as Id<"ideas">);
      if (!startIdea || startIdea.isDeleted) continue;
      const root = startIdea.parentId
        ? await findRootIdea(ctx, startIdea._id)
        : startIdea;
      if (!root || root.isDeleted) continue;
      const rootKey = String(root._id);
      if (!rootMap.has(rootKey)) rootMap.set(rootKey, root);
    }

    return Array.from(rootMap.values()).map((idea) => ({
      _id: idea._id,
      name: idea.title,
      description: idea.description,
    }));
  },
});

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

    const rootConvos = await ctx.db
      .query("conversations")
      .withIndex("by_idea", (q) => q.eq("ideaId", args.ideaId))
      .collect();

    const rootImplicit = rootConvos.filter((c) => !c.creatorId);
    if (rootImplicit.length > 0) {
      const canonical = rootImplicit.reduce((oldest, c) =>
        c.createdAt < oldest.createdAt ? c : oldest
      );
      out.push({
        _id: String(canonical._id),
        name: canonical.name || "general",
        type: canonical.type ?? "group",
        lastMessageAt: canonical.updatedAt,
        unreadCount: canonical.unreadCount || 0,
        ideaId: canonical.ideaId ?? args.ideaId,
        virtual: false,
      });
    }

    const rootExplicit = rootConvos.filter((c) => c.creatorId);
    for (const c of rootExplicit) {
      out.push({
        _id: String(c._id),
        name: c.name || "channel",
        type: c.type ?? "group",
        lastMessageAt: c.updatedAt,
        unreadCount: c.unreadCount || 0,
        ideaId: c.ideaId ?? args.ideaId,
        virtual: false,
      });
    }

    for (const sub of descendants) {
      const subConvos = await ctx.db
        .query("conversations")
        .withIndex("by_idea", (q) => q.eq("ideaId", sub._id))
        .collect();

      const subImplicit = subConvos.filter((c) => !c.creatorId);
      const subCanonical = subImplicit.length > 0
        ? subImplicit.reduce((oldest, c) =>
            c.createdAt < oldest.createdAt ? c : oldest
          )
        : null;

      if (subCanonical) {
        out.push({
          _id: String(subCanonical._id),
          name: subCanonical.name || sub.title,
          type: subCanonical.type ?? "group",
          lastMessageAt: subCanonical.updatedAt,
          unreadCount: subCanonical.unreadCount || 0,
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

      const subExplicit = subConvos.filter((c) => c.creatorId);
      for (const c of subExplicit) {
        out.push({
          _id: String(c._id),
          name: c.name || "channel",
          type: c.type ?? "group",
          lastMessageAt: c.updatedAt,
          unreadCount: c.unreadCount || 0,
          ideaId: sub._id,
          virtual: false,
        });
      }
    }

    return out;
  },
});

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

    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_idea", (q) => q.eq("ideaId", args.ideaId))
      .collect();
    const implicit = existing.filter((c) => !c.creatorId && c.type === "group");
    if (implicit.length > 0) {
      const canonical = implicit.reduce((oldest, c) =>
        c.createdAt < oldest.createdAt ? c : oldest
      );
      return canonical._id;
    }

    const channelId = await ctx.db.insert("conversations", {
      ideaId: args.ideaId,
      name: idea.title,
      type: "group",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return channelId;
  },
});

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