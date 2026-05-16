import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
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

export const getUserConversations = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const userDoc = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!userDoc) return [];
    const userId = userDoc._id;

    const convos1 = await ctx.db
      .query("conversations")
      .withIndex("by_participant1", (q) => q.eq("participant1", userId))
      .collect();

    const convos2 = await ctx.db
      .query("conversations")
      .withIndex("by_participant2", (q) => q.eq("participant2", userId))
      .collect();

    const allConvos = [...convos1, ...convos2]
      .filter((c) => c.type !== "group")
      .sort((a, b) => b.updatedAt - a.updatedAt);

    const enhancedConvos = await Promise.all(
      allConvos.map(async (convo) => {
        const lastMessage = convo.lastMessageId ? await ctx.db.get(convo.lastMessageId) : null;
        const otherParticipantId = convo.participant1 === userId ? convo.participant2 : convo.participant1;
        if (!otherParticipantId) return null;
        const otherUser = await ctx.db.get(otherParticipantId);
        return {
          ...convo,
          lastMessage: lastMessage ? { content: lastMessage.content, createdAt: lastMessage.createdAt, senderId: lastMessage.senderId } : null,
          otherUser: otherUser ? { id: otherUser._id, username: otherUser.username, displayName: otherUser.displayName, avatar: otherUser.avatar } : null,
        };
      })
    );
    return enhancedConvos.filter((c) => c !== null);
  },
});

export const getGroupConversationsList = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const userDoc = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!userDoc) return [];
    const userId = userDoc._id;

    const authoredIdeas = await ctx.db
      .query("ideas")
      .withIndex("by_author", (q) => q.eq("authorId", userId))
      .collect();

    const contributions = await ctx.db
      .query("contributionRequests")
      .withIndex("by_contributor_status", (q) => q.eq("contributorId", userId).eq("status", "accepted"))
      .collect();

    const allRelatedIdeaIds = new Set<string>();
    for (const idea of authoredIdeas) {
      if (!idea.isDeleted) allRelatedIdeaIds.add(String(idea._id));
    }
    for (const c of contributions) {
      allRelatedIdeaIds.add(String(c.ideaId));
    }

    const rootMap = new Map<string, Doc<"ideas">>();
    for (const idStr of allRelatedIdeaIds) {
      const startIdea = await ctx.db.get(idStr as Id<"ideas">);
      if (!startIdea || startIdea.isDeleted) continue;
      const root = startIdea.parentId ? await findRootIdea(ctx, startIdea._id) : startIdea;
      if (!root || root.isDeleted) continue;
      const rootKey = String(root._id);
      if (!rootMap.has(rootKey)) rootMap.set(rootKey, root);
    }

    const groupsFormatted = await Promise.all(
      Array.from(rootMap.values()).map(async (root) => {
        const convos = await ctx.db
          .query("conversations")
          .withIndex("by_idea", (q) => q.eq("ideaId", root._id))
          .filter((q) => q.eq(q.field("type"), "group"))
          .collect();

        const implicit = convos.filter((c) => !c.creatorId);
        const canonical = implicit.length > 0
          ? implicit.reduce((oldest, c) => (c.createdAt < oldest.createdAt ? c : oldest))
          : null;

        let lastMessage: Doc<"messages"> | null = null;
        if (canonical?.lastMessageId) {
          lastMessage = await ctx.db.get(canonical.lastMessageId);
        }

        return {
          ideaId: root._id,
          conversationId: canonical?._id ?? null,
          name: root.title,
          avatar: null,
          lastMessage: lastMessage ? { content: lastMessage.content, createdAt: lastMessage.createdAt, senderId: lastMessage.senderId } : null,
          unreadCount: canonical?.unreadCount || 0,
          isSubGroup: false,
        };
      })
    );

    return groupsFormatted.sort((a, b) => (b.lastMessage?.createdAt || 0) - (a.lastMessage?.createdAt || 0));
  },
});

export const getConversationMessages = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_created", (q) => q.eq("conversationId", args.conversationId))
      .order("asc")
      .collect();

    const enhancedMessages = await Promise.all(messages.map(async (msg) => {
      const sender = await ctx.db.get(msg.senderId);
      return { ...msg, senderName: sender?.displayName, senderAvatar: sender?.avatar };
    }));
    return enhancedMessages;
  },
});

export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.map((user) => ({ id: user._id, username: user.username, displayName: user.displayName, avatar: user.avatar }));
  },
});

export const getUserByClerkId = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await ctx.db.query("users").withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject)).first();
  },
});

export const sendMessage = mutation({
  args: {
    receiverId: v.optional(v.id("users")),
    content: v.string(),
    messageType: v.optional(v.string()),
    conversationId: v.optional(v.id("conversations")),
    ideaId: v.optional(v.id("ideas")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const userDoc = await ctx.db.query("users").withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject)).first();
    if (!userDoc) throw new Error("User not found");
    const userId = userDoc._id;

    let conversationId = args.conversationId;

    if (args.ideaId) {
      if (!conversationId) {
        const existing = await ctx.db
          .query("conversations")
          .withIndex("by_idea", (q) => q.eq("ideaId", args.ideaId))
          .filter((q) => q.eq(q.field("type"), "group"))
          .collect();

        const implicit = existing.filter((c) => !c.creatorId);
        const canonical = implicit.length > 0
          ? implicit.reduce((oldest, c) => (c.createdAt < oldest.createdAt ? c : oldest))
          : null;

        if (canonical) {
          conversationId = canonical._id;
        } else {
          conversationId = await ctx.db.insert("conversations", {
            type: "group",
            ideaId: args.ideaId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        }
      }
    } else if (args.receiverId && !conversationId) {
      let convoDoc = await ctx.db
        .query("conversations")
        .withIndex("by_participants", (q) => q.eq("participant1", userId).eq("participant2", args.receiverId))
        .first();
      if (!convoDoc) {
        convoDoc = await ctx.db
          .query("conversations")
          .withIndex("by_participants", (q) => q.eq("participant1", args.receiverId!).eq("participant2", userId))
          .first();
      }
      if (convoDoc) {
        conversationId = convoDoc._id;
      } else {
        conversationId = await ctx.db.insert("conversations", {
          participant1: userId,
          participant2: args.receiverId,
          type: "direct",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }

    if (!conversationId) throw new Error("Could not determine conversation");

    const messageId = await ctx.db.insert("messages", {
      senderId: userId,
      receiverId: args.receiverId,
      content: args.content,
      createdAt: Date.now(),
      read: false,
      conversationId,
      messageType: args.messageType || "text",
    });

    await ctx.db.patch(conversationId, { updatedAt: Date.now(), lastMessageId: messageId });
    return messageId;
  },
});

export const createConversation = mutation({
  args: { receiverId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const userDoc = await ctx.db.query("users").withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject)).first();
    if (!userDoc) throw new Error("User not found");
    const userId = userDoc._id;

    let convoDoc = await ctx.db
      .query("conversations")
      .withIndex("by_participants", (q) => q.eq("participant1", userId).eq("participant2", args.receiverId))
      .first();
    if (!convoDoc) {
      convoDoc = await ctx.db
        .query("conversations")
        .withIndex("by_participants", (q) => q.eq("participant1", args.receiverId).eq("participant2", userId))
        .first();
    }
    if (convoDoc) return convoDoc._id;

    return await ctx.db.insert("conversations", {
      participant1: userId,
      participant2: args.receiverId,
      type: "direct",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const markMessagesRead = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const userId = identity.subject as Id<"users">;

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) => q.and(q.eq("receiverId", userId as any), q.eq(q.field("read"), false)))
      .collect();

    await Promise.all(messages.map((msg) => ctx.db.patch(msg._id, { read: true })));
  },
});

export const getDirectConversationId = query({
  args: { receiverId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const userDoc = await ctx.db.query("users").withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject)).first();
    if (!userDoc) return null;
    const userId = userDoc._id;

    let convoDoc = await ctx.db
      .query("conversations")
      .withIndex("by_participants", (q) => q.eq("participant1", userId).eq("participant2", args.receiverId))
      .first();
    if (!convoDoc) {
      convoDoc = await ctx.db
        .query("conversations")
        .withIndex("by_participants", (q) => q.eq("participant1", args.receiverId).eq("participant2", userId))
        .first();
    }
    return convoDoc?._id || null;
  },
});

export const createGroupConversation = mutation({
  args: { ideaId: v.id("ideas"), name: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const userDoc = await ctx.db.query("users").withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject)).first();
    if (!userDoc) throw new Error("User not found");
    const userId = userDoc._id;

    const idea = await ctx.db.get(args.ideaId);
    if (!idea) throw new Error("Idea not found");

    const isAuthor = idea.authorId === userId;
    let isContributor = false;
    if (!isAuthor) {
      const contribution = await ctx.db
        .query("contributionRequests")
        .withIndex("by_idea_contributor", (q) => q.eq("ideaId", args.ideaId).eq("contributorId", userId))
        .filter((q) => q.eq(q.field("status"), "accepted"))
        .first();
      isContributor = !!contribution;
    }
    if (!isAuthor && !isContributor) throw new Error("Only contributors can create sub-groups");

    const conversationId = await ctx.db.insert("conversations", {
      type: "group",
      ideaId: args.ideaId,
      name: args.name,
      creatorId: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("conversationMembers", {
      conversationId,
      userId,
      role: "admin",
      joinedAt: Date.now(),
    });

    return conversationId;
  },
});

export const addGroupMember = mutation({
  args: { conversationId: v.id("conversations"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const hasUser = await ctx.db.query("users").withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject)).first();
    if (!hasUser) throw new Error("User not found");
    const currentUserId = hasUser._id;

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.type !== "group") throw new Error("Invalid group");

    const userMembership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user_conversation", (q) => q.eq("userId", currentUserId).eq("conversationId", args.conversationId))
      .first();

    const isCreator = conversation.creatorId === currentUserId;
    const isMember = !!userMembership;
    if (!isCreator && !isMember) throw new Error("You must be a member of the group to add others");

    const targetMembership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user_conversation", (q) => q.eq("userId", args.userId).eq("conversationId", args.conversationId))
      .first();
    if (targetMembership) throw new Error("User is already a member");

    await ctx.db.insert("conversationMembers", {
      conversationId: args.conversationId,
      userId: args.userId,
      role: "member",
      joinedAt: Date.now(),
    });
  },
});

export const getPotentialGroupMembers = query({
  args: { ideaId: v.id("ideas") },
  handler: async (ctx, args) => {
    const idea = await ctx.db.get(args.ideaId);
    if (!idea) return [];
    const author = await ctx.db.get(idea.authorId);

    const contributions = await ctx.db
      .query("contributionRequests")
      .withIndex("by_idea_status_created", (q) => q.eq("ideaId", args.ideaId).eq("status", "accepted"))
      .collect();

    const contributorIds = contributions.map((c) => c.contributorId);
    const contributors = await Promise.all(contributorIds.map((id) => ctx.db.get(id)));

    const allUsers = [author, ...contributors].filter((u) => u !== null);
    const uniqueUsers = Array.from(new Map(allUsers.map((item) => [item._id, item])).values());

    return uniqueUsers.map((u) => ({ id: u._id, displayName: u.displayName, avatar: u.avatar }));
  },
});

// Implicit channels (no creatorId) = community-wide membership.
// Explicit named channels = per-channel membership in conversationMembers.
export const getGroupMembers = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return [];

    if (!conversation.creatorId) {
      if (!conversation.ideaId) return [];
      const idea = await ctx.db.get(conversation.ideaId);
      if (!idea || idea.isDeleted) return [];

      const synthesized: Array<{
        id: Id<"users">;
        username: string | undefined;
        displayName: string | undefined;
        avatar: string | undefined;
        role: string;
        joinedAt: number;
      }> = [];

      const author = await ctx.db.get(idea.authorId);
      if (author) {
        synthesized.push({
          id: author._id,
          username: author.username,
          displayName: author.displayName,
          avatar: author.avatar,
          role: "admin",
          joinedAt: idea.createdAt,
        });
      }

      const acceptedRequests = await ctx.db
        .query("contributionRequests")
        .withIndex("by_idea_status_created", (q) => q.eq("ideaId", conversation.ideaId!).eq("status", "accepted"))
        .collect();

      for (const req of acceptedRequests) {
        if (req.contributorId === idea.authorId) continue;
        const contributor = await ctx.db.get(req.contributorId);
        if (!contributor) continue;
        synthesized.push({
          id: contributor._id,
          username: contributor.username,
          displayName: contributor.displayName,
          avatar: contributor.avatar,
          role: "member",
          joinedAt: req.updatedAt || req.createdAt,
        });
      }

      return synthesized;
    }

    const memberships = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    const members = await Promise.all(memberships.map(async (m) => {
      const user = await ctx.db.get(m.userId);
      if (!user) return null;
      return { id: user._id, username: user.username, displayName: user.displayName, avatar: user.avatar, role: m.role, joinedAt: m.joinedAt };
    }));

    return members.filter((m): m is NonNullable<typeof m> => m !== null);
  },
});

export const removeGroupMember = mutation({
  args: { conversationId: v.id("conversations"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const hasUser = await ctx.db.query("users").withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject)).first();
    if (!hasUser) throw new Error("User not found");
    const currentUserId = hasUser._id;

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.type !== "group") throw new Error("Invalid group");

    const isCreator = conversation.creatorId === currentUserId;
    const isSelfRemove = currentUserId === args.userId;
    if (!isCreator && !isSelfRemove) throw new Error("You do not have permission to remove this user");
    if (isCreator && isSelfRemove) throw new Error("Creator cannot leave the group. Delete the group instead.");

    const targetMembership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user_conversation", (q) => q.eq("userId", args.userId).eq("conversationId", args.conversationId))
      .first();
    if (!targetMembership) throw new Error("User is not a member");
    await ctx.db.delete(targetMembership._id);
  },
});

export const deleteGroupConversation = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const hasUser = await ctx.db.query("users").withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject)).first();
    if (!hasUser) throw new Error("User not found");
    const currentUserId = hasUser._id;

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.type !== "group") throw new Error("Invalid group");
    if (!conversation.creatorId || conversation.creatorId !== currentUserId) {
      throw new Error("Only the creator of the group can delete it");
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_created", (q) => q.eq("conversationId", args.conversationId))
      .collect();
    await Promise.all(messages.map((m) => ctx.db.delete(m._id)));

    const memberships = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();
    await Promise.all(memberships.map((m) => ctx.db.delete(m._id)));

    await ctx.db.delete(args.conversationId);
  },
});

// One-shot cleanup. Safe to re-run.
export const mergeDuplicateMainConversations = mutation({
  args: {},
  handler: async (ctx) => {
    const allGroups = await ctx.db.query("conversations").filter((q) => q.eq(q.field("type"), "group")).collect();

    const buckets = new Map<string, Doc<"conversations">[]>();
    for (const c of allGroups) {
      if (c.creatorId) continue;
      if (!c.ideaId) continue;
      const key = String(c.ideaId);
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push(c);
    }

    let merged = 0;
    let deletedRows = 0;
    let reparentedMessages = 0;
    let reparentedMembers = 0;

    for (const [ideaKey, convos] of buckets) {
      if (convos.length <= 1) continue;
      convos.sort((a, b) => a.createdAt - b.createdAt);
      const canonical = convos[0];
      const duplicates = convos.slice(1);

      for (const dup of duplicates) {
        const messages = await ctx.db.query("messages").withIndex("by_conversation_created", (q) => q.eq("conversationId", dup._id)).collect();
        for (const msg of messages) {
          await ctx.db.patch(msg._id, { conversationId: canonical._id });
          reparentedMessages += 1;
        }

        const memberships = await ctx.db.query("conversationMembers").withIndex("by_conversation", (q) => q.eq("conversationId", dup._id)).collect();
        for (const mem of memberships) {
          const existingOnCanonical = await ctx.db
            .query("conversationMembers")
            .withIndex("by_user_conversation", (q) => q.eq("userId", mem.userId).eq("conversationId", canonical._id))
            .first();
          if (existingOnCanonical) {
            await ctx.db.delete(mem._id);
          } else {
            await ctx.db.patch(mem._id, { conversationId: canonical._id });
            reparentedMembers += 1;
          }
        }

        if (dup.lastMessageId && (!canonical.lastMessageId || (dup.updatedAt || 0) > (canonical.updatedAt || 0))) {
          await ctx.db.patch(canonical._id, { lastMessageId: dup.lastMessageId, updatedAt: dup.updatedAt });
        }

        await ctx.db.delete(dup._id);
        deletedRows += 1;
      }

      merged += 1;
      console.log(`[mergeDuplicateMainConversations] idea ${ideaKey}: kept ${canonical._id}, removed ${duplicates.length} duplicates`);
    }

    return { ideasMerged: merged, duplicatesDeleted: deletedRows, messagesReparented: reparentedMessages, membersReparented: reparentedMembers };
  },
});