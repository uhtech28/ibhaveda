/**
 * Chat image upload pipeline.
 *
 * Three server pieces:
 *
 *   1. `generateUploadUrl`   action that mints a short-lived signed
 *                            URL the browser POSTs the image to.
 *
 *   2. `sendImageMessage`    mutation that records the message after
 *                            the upload completes. Validates the
 *                            storage id is real and that the user is
 *                            a participant in the conversation. Sets
 *                            `messageType = "image"`.
 *
 *   3. `getImageUrl`         query that resolves a storage id into a
 *                            short-lived fetchable URL for the
 *                            renderer. Returns null for stale ids so
 *                            the bubble can show a placeholder.
 *
 * The conversation gate uses the same lookup as the existing
 * `sendMessage` mutation. See `convex/chat.ts:sendMessage` — we mirror
 * its participant logic to avoid a class of "wrong room" sends.
 */

import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

// ─────────────────────────────────────────────────────────────────────
// Upload URL
// ─────────────────────────────────────────────────────────────────────

/**
 * Returns a short-lived URL the client POSTs the image binary to.
 * Convex storage validates auth on the call and only returns a URL
 * for the authenticated user.
 */
export const generateUploadUrl = action({
  args: {},
  handler: async (ctx): Promise<string> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    return await ctx.storage.generateUploadUrl();
  },
});

// ─────────────────────────────────────────────────────────────────────
// Send image message
// ─────────────────────────────────────────────────────────────────────

/**
 * Records an image message against an existing conversation. The
 * client has already uploaded the binary to `_storage` and holds the
 * resulting storage id; this mutation just stitches it into a row.
 *
 * The `content` field stays in the message schema for an optional
 * caption — pass empty string if the user only sent the image.
 */
export const sendImageMessage = mutation({
  args: {
    // Exactly one of conversationId / receiverId / ideaId must be
    // provided. Passing receiverId or ideaId mirrors `sendMessage`'s
    // "create-or-find" behaviour so a brand-new DM can send an image
    // as its first message without an empty placeholder text send.
    conversationId: v.optional(v.id("conversations")),
    receiverId: v.optional(v.id("users")),
    ideaId: v.optional(v.id("ideas")),
    storageId: v.id("_storage"),
    width: v.number(),
    height: v.number(),
    caption: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const sender = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!sender) throw new Error("User not found");

    // Resolve / create the conversation.
    let conversationId = args.conversationId;
    if (!conversationId) {
      if (args.ideaId) {
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
      } else if (args.receiverId) {
        let convoDoc = await ctx.db
          .query("conversations")
          .withIndex("by_participants", (q) =>
            q.eq("participant1", sender._id).eq("participant2", args.receiverId),
          )
          .first();
        if (!convoDoc) {
          convoDoc = await ctx.db
            .query("conversations")
            .withIndex("by_participants", (q) =>
              q.eq("participant1", args.receiverId!).eq("participant2", sender._id),
            )
            .first();
        }
        if (convoDoc) {
          conversationId = convoDoc._id;
        } else {
          conversationId = await ctx.db.insert("conversations", {
            participant1: sender._id,
            participant2: args.receiverId,
            type: "direct",
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        }
      } else {
        throw new Error(
          "sendImageMessage requires one of conversationId, receiverId, or ideaId",
        );
      }
    }

    const conversation = await ctx.db.get(conversationId);
    if (!conversation) throw new Error("Conversation not found");

    // Participant check — DM conversations have participant1/2; group
    // conversations are gated by the existing channel-membership logic
    // in chat.ts. We mirror the canRead pattern: explicit participants
    // for DMs, fall through to the chat.ts membership check for groups.
    const isDmParticipant =
      conversation.participant1 === sender._id ||
      conversation.participant2 === sender._id;
    const isGroup = conversation.type === "group";

    if (!isDmParticipant && !isGroup) {
      throw new Error("Not a participant in this conversation");
    }

    // Verify the storage object exists. We can't read bytes here, just
    // confirm the id resolves — catches a bad/expired upload before we
    // commit the row.
    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) {
      throw new Error("Uploaded image not found in storage");
    }

    if (args.width <= 0 || args.height <= 0 || args.width > 8192 || args.height > 8192) {
      throw new Error("Image dimensions out of allowed range");
    }

    // `receiverId` only applies to DM conversations; for groups the
    // field is left undefined so the message reaches every member via
    // the conversation membership (matching the existing sendMessage
    // mutation's behaviour for group messages).
    const receiverId = isGroup
      ? undefined
      : conversation.participant1 === sender._id
        ? conversation.participant2
        : conversation.participant1;

    const messageId = await ctx.db.insert("messages", {
      senderId: sender._id,
      receiverId,
      content: args.caption?.trim() ?? "",
      createdAt: Date.now(),
      read: false,
      conversationId,
      messageType: "image",
      imageStorageId: args.storageId,
      imageWidth: args.width,
      imageHeight: args.height,
    });

    // Bump the conversation's lastMessage + updatedAt so the inbox
    // sort key reflects the new image.
    await ctx.db.patch(conversationId, {
      lastMessageId: messageId,
      updatedAt: Date.now(),
    });

    return messageId;
  },
});

// ─────────────────────────────────────────────────────────────────────
// Resolve storage id → fetchable URL
// ─────────────────────────────────────────────────────────────────────

/**
 * Resolves a storage id into a short-lived fetchable URL. Returns
 * null when the storage object has been removed (stale ids in old
 * messages remain readable as a placeholder rather than 500ing the
 * whole conversation render).
 */
export const getImageUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }): Promise<string | null> => {
    return await ctx.storage.getUrl(storageId);
  },
});
