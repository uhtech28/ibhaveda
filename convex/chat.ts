import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

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

    // Get conversations where user is participant1 or participant2
    const convos1 = await ctx.db
      .query("conversations")
      .withIndex("by_participant1", (q) => q.eq("participant1", userId))
      .collect();

    const convos2 = await ctx.db
      .query("conversations")
      .withIndex("by_participant2", (q) => q.eq("participant2", userId))
      .collect();

    // Filter out group conversations and sort
    const allConvos = [...convos1, ...convos2]
      .filter(c => c.type !== 'group')
      .sort((a, b) => b.updatedAt - a.updatedAt);

    // Enhance with last message preview
    const enhancedConvos = await Promise.all(
      allConvos.map(async (convo) => {
        const lastMessage = convo.lastMessageId
          ? await ctx.db.get(convo.lastMessageId)
          : null;

        const otherParticipantId =
          convo.participant1 === userId ? convo.participant2 : convo.participant1;

        if (!otherParticipantId) return null;

        const otherUser = await ctx.db.get(otherParticipantId);

        return {
          ...convo,
          lastMessage: lastMessage ? {
            content: lastMessage.content,
            createdAt: lastMessage.createdAt,
            senderId: lastMessage.senderId,
          } : null,
          otherUser: otherUser ? {
            id: otherUser._id,
            username: otherUser.username,
            displayName: otherUser.displayName,
            avatar: otherUser.avatar,
          } : null,
        };
      })
    );

    return enhancedConvos.filter(c => c !== null);
  },
});

// Get all group conversations for the user
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

    // 1. Get ideas where user is author
    const authoredIdeas = await ctx.db
      .query("ideas")
      .withIndex("by_author", (q) => q.eq("authorId", userId))
      .collect();

    // 2. Get ideas where user is accepted contributor
    const contributions = await ctx.db
      .query("contributionRequests")
      .withIndex("by_contributor_status", (q) => q.eq("contributorId", userId).eq("status", "accepted"))
      .collect();

    const contributedIdeaIds = contributions.map(c => c.ideaId);

    // Fetch contributed ideas details
    const contributedIdeas = await Promise.all(
      contributedIdeaIds.map(id => ctx.db.get(id))
    );

    const allIdeas = [...authoredIdeas, ...contributedIdeas].filter((idea): idea is NonNullable<typeof idea> => idea !== null);

    // Remove duplicates
    const uniqueIdeas = Array.from(new Map(allIdeas.map(item => [item._id, item])).values());

    // For each idea, find or create group conversation
    // Note: In a query we cannot create, so we just find. 
    // If it doesn't exist, the UI should probably trigger a mutation or we handle it differently.
    // For now, let's assume we just return the ideas and let the UI/mutation handle conversation creation if missing,
    // OR we can try to find existing conversations.

    const groups = await Promise.all(uniqueIdeas.map(async (idea) => {
      const convo = await ctx.db
        .query("conversations")
        .withIndex("by_idea", (q) => q.eq("ideaId", idea._id))
        .first();

      let lastMessage = null;
      if (convo?.lastMessageId) {
        lastMessage = await ctx.db.get(convo.lastMessageId);
      }

      return {
        ideaId: idea._id,
        conversationId: convo?._id,
        name: idea.title,
        // Use idea category or generic icon for avatar
        avatar: null,
        lastMessage: lastMessage ? {
          content: lastMessage.content,
          createdAt: lastMessage.createdAt,
          senderId: lastMessage.senderId,
        } : null,
        unreadCount: convo?.unreadCount || 0, // This logic needs refinement for groups
      };
    }));

    return groups;
  }
});

export const getConversationMessages = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_created", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("asc")
      .collect();

    // Enhance messages with sender details
    const enhancedMessages = await Promise.all(messages.map(async (msg) => {
      const sender = await ctx.db.get(msg.senderId);
      return {
        ...msg,
        senderName: sender?.displayName,
        senderAvatar: sender?.avatar,
      };
    }));

    return enhancedMessages;
  },
});

export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.map((user) => ({
      id: user._id,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
    }));
  },
});

export const getUserByClerkId = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
  },
});

export const sendMessage = mutation({
  args: {
    receiverId: v.optional(v.id("users")),
    content: v.string(),
    messageType: v.optional(v.string()),
    conversationId: v.optional(v.id("conversations")),
    ideaId: v.optional(v.id("ideas")), // For creating group chat on first message
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const userDoc = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!userDoc) throw new Error("User not found");
    const userId = userDoc._id;

    let conversationId = args.conversationId;

    // Handle Group Chat Creation/Retrieval
    if (args.ideaId) {
      const existingConvo = await ctx.db
        .query("conversations")
        .withIndex("by_idea", (q) => q.eq("ideaId", args.ideaId))
        .first();

      if (existingConvo) {
        conversationId = existingConvo._id;
      } else {
        // Create new group conversation
        conversationId = await ctx.db.insert("conversations", {
          type: 'group',
          ideaId: args.ideaId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }
    // Handle Direct Chat Creation/Retrieval
    else if (args.receiverId && !conversationId) {
      let convoDoc = await ctx.db
        .query("conversations")
        .withIndex("by_participants", (q) =>
          q.eq("participant1", userId).eq("participant2", args.receiverId)
        )
        .first();

      if (!convoDoc) {
        convoDoc = await ctx.db
          .query("conversations")
          .withIndex("by_participants", (q) =>
            q.eq("participant1", args.receiverId!).eq("participant2", userId)
          )
          .first();
      }

      if (convoDoc) {
        conversationId = convoDoc._id;
      } else {
        conversationId = await ctx.db.insert("conversations", {
          participant1: userId,
          participant2: args.receiverId,
          type: 'direct',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }

    if (!conversationId) throw new Error("Could not determine conversation");

    // Create message
    const messageId = await ctx.db.insert("messages", {
      senderId: userId,
      receiverId: args.receiverId, // Optional for group
      content: args.content,
      createdAt: Date.now(),
      read: false,
      conversationId,
      messageType: args.messageType || "text",
    });

    // Update conversation
    await ctx.db.patch(conversationId, {
      updatedAt: Date.now(),
      lastMessageId: messageId,
    });

    return messageId;
  },
});

export const createConversation = mutation({
  args: { receiverId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const userDoc = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!userDoc) throw new Error("User not found");

    const userId = userDoc._id;

    // Check if conversation already exists
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

    if (convoDoc) {
      return convoDoc._id;
    }

    // Create new conversation
    const conversationId = await ctx.db.insert("conversations", {
      participant1: userId,
      participant2: args.receiverId,
      type: 'direct',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return conversationId;
  },
});

export const markMessagesRead = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const userId = identity.subject as Id<"users">;

    // Get messages in conversation where receiver is current user and not read
    // Note: For group chats, 'read' status is more complex (per user). 
    // For now, we only mark direct messages as read or implement a simpler group read logic later.
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) => q.and(q.eq("receiverId", userId as any), q.eq(q.field("read"), false)))
      .collect();

    // Mark each as read
    await Promise.all(
      messages.map((msg) => ctx.db.patch(msg._id, { read: true }))
    );
  },
});