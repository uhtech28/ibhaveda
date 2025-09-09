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

    const allConvos = [...convos1, ...convos2].sort((a, b) => b.updatedAt - a.updatedAt); // Sort by updatedAt desc

    // Enhance with last message preview
    const enhancedConvos = await Promise.all(
      allConvos.map(async (convo) => {
        const lastMessage = convo.lastMessageId
          ? await ctx.db.get(convo.lastMessageId)
          : null;

        const otherParticipantId =
          convo.participant1 === userId ? convo.participant2 : convo.participant1;

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

    return enhancedConvos;
  },
});

export const getConversationMessages = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    // Note: Simple implementation, return all messages
    // For production, implement pagination with cursor
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_created", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("asc")
      .collect();

    return messages;
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
    receiverId: v.id("users"),
    content: v.string(),
    messageType: v.optional(v.string()),
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

    // Check if conversation exists
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
          q.eq("participant1", args.receiverId).eq("participant2", userId)
        )
        .first();
    }

    let conversationId: Id<"conversations">;
    if (!convoDoc) {
      // Create new conversation
      conversationId = await ctx.db.insert("conversations", {
        participant1: userId,
        participant2: args.receiverId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    } else {
      conversationId = convoDoc._id;
    }

    // Create message
    const messageId = await ctx.db.insert("messages", {
      senderId: userId,
      receiverId: args.receiverId,
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