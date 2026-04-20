import { v } from "convex/values";
import { query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Get social feed posts for a specific venture
 * Shows gold checkpoints, stage completions, and other venture milestones
 * Visible to all collaborators on the venture
 */
export const getVentureFeed = query({
  args: {
    ventureId: v.id("ventures"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    // Get the venture
    const venture = await ctx.db.get(args.ventureId);
    if (!venture) return [];

    // Get all notifications related to this venture
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_related", (q) => q.eq("relatedId", args.ventureId))
      .order("desc")
      .take(limit);

    // Filter for venture-related feed types
    const feedTypes = [
      "gold_checkpoint",
      "venture_stage_complete",
      "venture_complete",
    ];

    const feedItems = notifications.filter((n) => feedTypes.includes(n.type));

    // Enrich with user and venture data
    const enrichedItems = await Promise.all(
      feedItems.map(async (item) => {
        const user = await ctx.db.get(item.senderId);
        const idea = await ctx.db.get(venture.ideaId);

        return {
          ...item,
          user: user
            ? {
                _id: user._id,
                displayName: user.displayName,
                username: user.username,
                avatar: user.avatar,
              }
            : null,
          venture: {
            _id: venture._id,
            name: idea?.title || "Venture",
            ideaId: venture.ideaId,
          },
        };
      })
    );

    return enrichedItems;
  },
});

/**
 * Get social feed for an idea/project
 * Shows activity from all ventures associated with this idea
 */
export const getIdeaFeed = query({
  args: {
    ideaId: v.id("ideas"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    // Get all ventures for this idea
    const ventures = await ctx.db
      .query("ventures")
      .withIndex("by_idea", (q) => q.eq("ideaId", args.ideaId))
      .collect();

    if (ventures.length === 0) return [];

    const ventureIds = ventures.map((v) => v._id);

    // Get all notifications for these ventures
    const allNotifications = await Promise.all(
      ventureIds.map(async (ventureId) => {
        const notifications = await ctx.db
          .query("notifications")
          .withIndex("by_related", (q) => q.eq("relatedId", ventureId))
          .collect();
        return notifications;
      })
    );

    // Flatten and sort
    const flatNotifications = allNotifications.flat();
    const sorted = flatNotifications.sort((a, b) => b.createdAt - a.createdAt);

    // Filter for venture-related feed types
    const feedTypes = [
      "gold_checkpoint",
      "venture_stage_complete",
      "venture_complete",
    ];

    const feedItems = sorted.filter((n) => feedTypes.includes(n.type)).slice(0, limit);

    // Enrich with user and venture data
    const enrichedItems = await Promise.all(
      feedItems.map(async (item) => {
        const user = await ctx.db.get(item.senderId);
        const venture = ventures.find((v) => v._id === item.relatedId);
        const idea = await ctx.db.get(args.ideaId);

        return {
          ...item,
          user: user
            ? {
                _id: user._id,
                displayName: user.displayName,
                username: user.username,
                avatar: user.avatar,
              }
            : null,
          venture: venture
            ? {
                _id: venture._id,
                name: idea?.title || "Venture",
                ideaId: venture.ideaId,
                userId: venture.userId,
              }
            : null,
        };
      })
    );

    return enrichedItems;
  },
});

/**
 * Get community-wide venture feed
 * Shows all public venture milestones across the platform
 */
export const getCommunityVentureFeed = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    // Get all venture-related notifications
    const feedTypes = [
      "gold_checkpoint",
      "venture_stage_complete",
      "venture_complete",
    ];

    // Get recent notifications of these types
    const allNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_type", (q) => q.eq("type", feedTypes[0]))
      .order("desc")
      .take(limit * 3);

    // Also get stage completions and venture completions
    const stageCompletions = await ctx.db
      .query("notifications")
      .withIndex("by_type", (q) => q.eq("type", feedTypes[1]))
      .order("desc")
      .take(limit * 3);

    const ventureCompletions = await ctx.db
      .query("notifications")
      .withIndex("by_type", (q) => q.eq("type", feedTypes[2]))
      .order("desc")
      .take(limit * 3);

    // Combine and sort
    const combined = [...allNotifications, ...stageCompletions, ...ventureCompletions];
    const sorted = combined.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);

    // Enrich with user and venture data
    const enrichedItems = await Promise.all(
      sorted.map(async (item) => {
        const user = await ctx.db.get(item.senderId);

        // Get venture and idea details
        let ventureData = null;
        if (item.relatedId) {
          const venture = await ctx.db.get(item.relatedId as Id<"ventures">);
          if (venture) {
            const idea = await ctx.db.get(venture.ideaId);
            ventureData = {
              _id: venture._id,
              name: idea?.title || "Venture",
              ideaId: venture.ideaId,
              userId: venture.userId,
              visibility: idea?.visibility || "private",
            };
          }
        }

        // Only include public ventures in community feed
        if (!ventureData || ventureData.visibility === "private") {
          return null;
        }

        return {
          ...item,
          user: user
            ? {
                _id: user._id,
                displayName: user.displayName,
                username: user.username,
                avatar: user.avatar,
              }
            : null,
          venture: ventureData,
        };
      })
    );

    // Filter out nulls (private ventures)
    return enrichedItems.filter((item) => item !== null);
  },
});

/**
 * Get user's personal venture feed
 * Shows venture activity from all projects the user is involved in
 */
export const getUserVentureFeed = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return [];

    const limit = args.limit || 50;

    // Get all ideas where user is author or contributor
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

    const contributedIdeaIds = acceptedRequests.map((r) => r.ideaId);
    const allIdeaIds = [
      ...authoredIdeas.map((i) => i._id),
      ...contributedIdeaIds,
    ];

    // Get all ventures for these ideas
    const allVentures = await Promise.all(
      allIdeaIds.map(async (ideaId) => {
        const ventures = await ctx.db
          .query("ventures")
          .withIndex("by_idea", (q) => q.eq("ideaId", ideaId))
          .collect();
        return ventures;
      })
    );

    const flatVentures = allVentures.flat();
    const ventureIds = flatVentures.map((v) => v._id);

    if (ventureIds.length === 0) return [];

    // Get all notifications for these ventures
    const allNotifications = await Promise.all(
      ventureIds.map(async (ventureId) => {
        const notifications = await ctx.db
          .query("notifications")
          .withIndex("by_related", (q) => q.eq("relatedId", ventureId))
          .collect();
        return notifications;
      })
    );

    // Flatten and sort
    const flatNotifications = allNotifications.flat();
    const sorted = flatNotifications.sort((a, b) => b.createdAt - a.createdAt);

    // Filter for venture-related feed types
    const feedTypes = [
      "gold_checkpoint",
      "venture_stage_complete",
      "venture_complete",
    ];

    const feedItems = sorted.filter((n) => feedTypes.includes(n.type)).slice(0, limit);

    // Enrich with user and venture data
    const enrichedItems = await Promise.all(
      feedItems.map(async (item) => {
        const feedUser = await ctx.db.get(item.senderId);
        const venture = flatVentures.find((v) => v._id === item.relatedId);

        let ideaData = null;
        if (venture) {
          const idea = await ctx.db.get(venture.ideaId);
          ideaData = {
            _id: venture.ideaId,
            title: idea?.title || "Venture",
          };
        }

        return {
          ...item,
          user: feedUser
            ? {
                _id: feedUser._id,
                displayName: feedUser.displayName,
                username: feedUser.username,
                avatar: feedUser.avatar,
              }
            : null,
          venture: venture && ideaData
            ? {
                _id: venture._id,
                name: ideaData.title,
                ideaId: venture.ideaId,
                userId: venture.userId,
              }
            : null,
        };
      })
    );

    return enrichedItems;
  },
});
