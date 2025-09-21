import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Get notifications for the current user with filtering and sorting
export const getNotifications = query({
  args: {
    limit: v.optional(v.number()),
    filterType: v.optional(v.union(
      v.literal("all"),
      v.literal("interactions"),
      v.literal("requests")
    )),
    filterReadStatus: v.optional(v.union(
      v.literal("all"),
      v.literal("unread"),
      v.literal("read")
    )),
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
    const filterType = args.filterType || "all";
    const filterReadStatus = args.filterReadStatus || "all";

    // Define notification types for filtering
    const interactionTypes = ["spark_received", "comment_received"];
    const requestTypes = ["contribution_request_received", "invitation_received", "invitation_accepted", "invitation_rejected"];

    let query = ctx.db
      .query("notifications")
      .withIndex("by_recipient_created", (q) => q.eq("recipientId", user._id));

    // Apply type filter
    if (filterType === "interactions") {
      query = query.filter((q) => q.or(...interactionTypes.map(type => q.eq(q.field("type"), type))));
    } else if (filterType === "requests") {
      query = query.filter((q) => q.or(...requestTypes.map(type => q.eq(q.field("type"), type))));
    }

    // Apply read status filter
    if (filterReadStatus === "unread") {
      query = query.filter((q) => q.eq(q.field("isRead"), false));
    } else if (filterReadStatus === "read") {
      query = query.filter((q) => q.eq(q.field("isRead"), true));
    }

    // Get notifications with pagination and sorting (newest first)
    let notifications = await query
      .order("desc")
      .take(limit);

    // Filter out notifications for private ideas that the user cannot access
    const filteredNotifications = [];
    for (const notification of notifications) {
      let shouldInclude = true;

      // Check if notification is related to an idea and if that idea is private
      if (notification.relatedId && notification.type !== 'deadline_approaching' && notification.type !== 'deadline_overdue') {
        try {
          // Try to get the related idea if this is an idea-related notification
          let relatedIdea = null;
          if (notification.type === 'new_idea' || notification.type === 'spark_received' || notification.type === 'comment_received') {
            relatedIdea = await ctx.db.get(notification.relatedId as Id<"ideas">);
          }

          if (relatedIdea && relatedIdea.visibility === 'private') {
            // Check if user is authorized to see this private idea
            const isAuthor = relatedIdea.authorId === user._id;
            let hasAcceptedContribution = false;

            if (!isAuthor) {
              // Check for accepted contribution requests
              const acceptedRequests = await ctx.db
                .query("contributionRequests")
                .withIndex("by_contributor_status", (q) =>
                  q.eq("contributorId", user._id).eq("status", "accepted")
                )
                .collect();

              hasAcceptedContribution = acceptedRequests.some(req => req.ideaId === relatedIdea._id);
            }

            // Only include if user is authorized
            shouldInclude = isAuthor || hasAcceptedContribution;
          }
        } catch (error) {
          // If related item doesn't exist or other error, exclude the notification
          shouldInclude = false;
        }
      }

      if (shouldInclude) {
        filteredNotifications.push(notification);
      }
    }

    // Limit the filtered results to the requested limit
    const limitedNotifications = filteredNotifications.slice(0, limit);

    // Get sender information for each notification
    const notificationsWithSenders = await Promise.all(
      limitedNotifications.map(async (notification) => {
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

// Create a deadline notification
export const createDeadlineNotification = mutation({
  args: {
    recipientId: v.id("users"),
    senderId: v.id("users"),
    todoId: v.id("todos"),
    type: v.union(v.literal("deadline_approaching"), v.literal("deadline_overdue")),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Verify sender is authenticated user
    const sender = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!sender || sender._id !== args.senderId) {
      throw new Error("Not authorized to send this notification");
    }

    // Check if notification already exists for this todo and type
    const existingNotification = await ctx.db
      .query("notifications")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .collect()
      .then(notifications =>
        notifications.find(n =>
          n.recipientId === args.recipientId &&
          n.relatedId === args.todoId &&
          // Check if it's recent (within last 24 hours for approaching, within last week for overdue)
          n.createdAt > Date.now() - (args.type === "deadline_approaching" ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000)
        )
      );

    if (existingNotification) {
      // Return existing notification ID
      return { notificationId: existingNotification._id, message: "Notification already exists" };
    }

    // Create the notification
    const notificationId = await ctx.db.insert("notifications", {
      recipientId: args.recipientId,
      senderId: args.senderId,
      type: args.type,
      message: args.message,
      relatedId: args.todoId,
      isRead: false,
      createdAt: Date.now(),
    });

    return { notificationId, message: "Deadline notification created successfully" };
  },
});

// Dismiss a notification (delete it)
export const dismissNotification = mutation({
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
      throw new Error("Not authorized to dismiss this notification");
    }

    // Delete the notification
    await ctx.db.delete(args.notificationId);

    return { message: "Notification dismissed successfully" };
  },
});

// Bulk dismiss notifications
export const dismissAllNotifications = mutation({
  args: {
    filterType: v.optional(v.union(
      v.literal("all"),
      v.literal("interactions"),
      v.literal("requests")
    )),
    filterReadStatus: v.optional(v.union(
      v.literal("all"),
      v.literal("unread"),
      v.literal("read")
    )),
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
      return { message: "User not found", count: 0 };
    }

    const filterType = args.filterType || "all";
    const filterReadStatus = args.filterReadStatus || "all";

    // Define notification types for filtering
    const interactionTypes = ["spark_received", "comment_received"];
    const requestTypes = ["contribution_request_received", "invitation_received", "invitation_accepted", "invitation_rejected"];

    let query = ctx.db
      .query("notifications")
      .withIndex("by_recipient_created", (q) => q.eq("recipientId", user._id));

    // Apply type filter
    if (filterType === "interactions") {
      query = query.filter((q) => q.or(...interactionTypes.map(type => q.eq(q.field("type"), type))));
    } else if (filterType === "requests") {
      query = query.filter((q) => q.or(...requestTypes.map(type => q.eq(q.field("type"), type))));
    }

    // Apply read status filter
    if (filterReadStatus === "unread") {
      query = query.filter((q) => q.eq(q.field("isRead"), false));
    } else if (filterReadStatus === "read") {
      query = query.filter((q) => q.eq(q.field("isRead"), true));
    }

    // Get notifications to delete
    const notificationsToDelete = await query.collect();

    // Delete all matching notifications
    const deletePromises = notificationsToDelete.map(notification =>
      ctx.db.delete(notification._id)
    );

    await Promise.all(deletePromises);

    return {
      message: "Notifications dismissed successfully",
      count: notificationsToDelete.length
    };
  },
});