import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get notifications for the current user
export const getNotifications = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Find user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return [];
    }

    const limit = args.limit || 50;

    // Get user's notifications with sender information
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_recipient_created", (q) => q.eq("recipientId", user._id))
      .order("desc")
      .take(limit);

    // Get sender information for each notification
    const notificationsWithSenders = await Promise.all(
      notifications.map(async (notification) => {
        const sender = await ctx.db.get(notification.senderId);
        return {
          ...notification,
          sender: sender ? {
            ...sender,
            name: sender.displayName,
            username: sender.username,
          } : null,
        };
      })
    );

    return notificationsWithSenders;
  },
});

// Mark a notification as read
export const markAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Find user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Get the notification
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) {
      throw new Error("Notification not found");
    }

    // Check if user owns this notification
    if (notification.recipientId !== user._id) {
      throw new Error("Not authorized to update this notification");
    }

    // Mark as read
    await ctx.db.patch(args.notificationId, {
      isRead: true,
    });

    return { message: "Notification marked as read" };
  },
});

// Mark all notifications as read for the current user
export const markAllAsRead = mutation({
  handler: async (ctx) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Find user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return { message: "User not found" };
    }

    // Get all unread notifications for this user
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_recipient_read", (q) => q.eq("recipientId", user._id).eq("isRead", false))
      .collect();

    // Mark all as read
    const updatePromises = unreadNotifications.map(notification =>
      ctx.db.patch(notification._id, { isRead: true })
    );

    await Promise.all(updatePromises);

    return {
      message: "All notifications marked as read",
      count: unreadNotifications.length
    };
  },
});

// Get count of unread notifications
export const getUnreadCount = query({
  handler: async (ctx) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return 0;
    }

    // Find user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return 0;
    }

    // Get count of unread notifications
    const unreadCount = await ctx.db
      .query("notifications")
      .withIndex("by_recipient_read", (q) =>
        q.eq("recipientId", user._id).eq("isRead", false)
      )
      .collect();

    return unreadCount.length;
  },
});