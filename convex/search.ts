import { v } from "convex/values";
import { query } from "./_generated/server";

export const searchEverything = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { query, limit = 20, offset = 0 } = args;

    if (!query.trim()) {
      return {
        ideas: [],
        users: [],
        totalCount: 0
      };
    }

    const searchTerm = query.toLowerCase().trim();

    // Get authenticated user for visibility checks
    const identity = await ctx.auth.getUserIdentity();
    let currentUser = null;
    if (identity) {
      currentUser = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .unique();
    }

    // Search IDEAS
    // Get all public ideas and user's private ideas
    let ideas = await ctx.db
      .query("ideas")
      .withIndex("by_visibility", (q) => q.eq("visibility", "public"))
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .filter((q) => q.or(q.eq(q.field("parentId"), undefined), q.eq(q.field("parentId"), null)))
      .collect();

    // Add user's private ideas if logged in
    if (currentUser) {
      const userIdeas = await ctx.db
        .query("ideas")
        .withIndex("by_author", (q) => q.eq("authorId", currentUser._id))
        .filter((q) => q.eq(q.field("visibility"), "private"))
        .filter((q) => q.neq(q.field("isDeleted"), true))
        .filter((q) => q.or(q.eq(q.field("parentId"), undefined), q.eq(q.field("parentId"), null)))
        .collect();
      ideas = [...ideas, ...userIdeas];
    }

    // Filter ideas by search term
    const filteredIdeas = ideas.filter((idea: any) => {
      const titleMatch = idea.title.toLowerCase().includes(searchTerm);
      const descMatch = idea.description.toLowerCase().includes(searchTerm);
      const categoryMatch = idea.category.toLowerCase().includes(searchTerm);
      const industriesMatch = idea.industries && idea.industries.toLowerCase().includes(searchTerm);

      return titleMatch || descMatch || categoryMatch || industriesMatch;
    });

    // Sort ideas by relevance
    filteredIdeas.sort((a: any, b: any) => {
      const aTitleMatch = a.title.toLowerCase().includes(searchTerm);
      const bTitleMatch = b.title.toLowerCase().includes(searchTerm);

      // Prioritize exact title matches
      if (aTitleMatch && !bTitleMatch) return -1;
      if (!aTitleMatch && bTitleMatch) return 1;

      // Then by spark count
      return b.sparkCount - a.sparkCount;
    });

    // Search USERS
    const allUsers = await ctx.db
      .query("users")
      .withIndex("by_is_active", (q) => q.eq("isActive", true))
      .collect();

    // Filter users by search term
    const filteredUsers = allUsers.filter((user: any) => {
      const displayNameMatch = user.displayName.toLowerCase().includes(searchTerm);
      const usernameMatch = user.username.toLowerCase().includes(searchTerm);
      const bioMatch = user.bio && user.bio.toLowerCase().includes(searchTerm);
      const industryMatch = (user.industry && user.industry.toLowerCase().includes(searchTerm)) ||
        (user.industries && user.industries.some((ind: string) => ind.toLowerCase().includes(searchTerm)));

      // Check skills
      const skillsMatch = user.skills && user.skills.some((skill: string) =>
        skill.toLowerCase().includes(searchTerm)
      );

      // Check location
      const locationMatch = user.location && user.location.toLowerCase().includes(searchTerm);

      return displayNameMatch || usernameMatch || bioMatch || industryMatch || skillsMatch || locationMatch;
    });

    // Get user stats for ranking
    const usersWithStats = await Promise.all(
      filteredUsers.map(async (user: any) => {
        // Count ideas created
        const ideasCreated = await ctx.db
          .query("ideas")
          .withIndex("by_author", (q) => q.eq("authorId", user._id))
          .filter((q) => q.neq(q.field("isDeleted"), true))
          .collect();

        // Count ideas sparked
        const ideasSparked = await ctx.db
          .query("userIdeaSparks")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect();

        return {
          ...user,
          ideasCreated: ideasCreated.length,
          ideasSparked: ideasSparked.length,
        };
      })
    );

    // Sort users by relevance (ideas created + sparked)
    usersWithStats.sort((a: any, b: any) => {
      const aRelevance = a.ideasCreated + a.ideasSparked;
      const bRelevance = b.ideasCreated + b.ideasSparked;
      return bRelevance - aRelevance;
    });

    // Apply pagination to each type separately
    const paginatedIdeas = filteredIdeas.slice(offset, offset + Math.ceil(limit / 2));
    const paginatedUsers = usersWithStats.slice(offset, offset + Math.floor(limit / 2));

    // Get author information for ideas
    const ideasWithAuthors = await Promise.all(
      paginatedIdeas.map(async (idea: any) => {
        const author = await ctx.db.get(idea.authorId);
        return {
          ...idea,
          author: author ? {
            ...author,
            name: (author as any).displayName,
            username: (author as any).username,
            avatar: (author as any).avatar,
          } : null,
        };
      })
    );

    return {
      ideas: ideasWithAuthors,
      users: paginatedUsers,
      totalCount: filteredIdeas.length + filteredUsers.length,
      hasMore: offset + limit < filteredIdeas.length + filteredUsers.length,
    };
  },
});

export const searchIdeas = query({
  args: {
    query: v.string(),
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    sortBy: v.optional(v.union(v.literal("relevance"), v.literal("createdAt"), v.literal("popularity"))),
  },
  handler: async (ctx, args) => {
    // Get authenticated user for visibility checks
    const identity = await ctx.auth.getUserIdentity();
    let user = null;
    if (identity) {
      user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .unique();
    }

    // Get all public ideas (or user's private ideas)
    let ideas;
    if (args.category) {
      const category = args.category.trim();
      ideas = await ctx.db
        .query("ideas")
        .withIndex("by_category", (q) => q.eq("category", category))
        .collect();
    } else {
      ideas = await ctx.db
        .query("ideas")
        .withIndex("by_visibility", (q) => q.eq("visibility", "public"))
        .collect();
    }

    // Filter for visibility (include user's private ideas)
    if (user) {
      const userIdeas = await ctx.db
        .query("ideas")
        .withIndex("by_author", (q) => q.eq("authorId", user._id))
        .filter((q) => q.eq(q.field("visibility"), "private"))
        .collect();
      ideas = [...ideas, ...userIdeas];
    }

    // Filter for search term, not deleted, and root level
    const searchTerm = args.query.toLowerCase().trim();
    let results = ideas.filter((idea: any) => {
      // Skip deleted ideas
      if (idea.isDeleted) return false;

      // Skip sub-ideas (parentId exists)
      if (idea.parentId) return false;

      // Search in title or description
      const titleMatch = idea.title.toLowerCase().includes(searchTerm);
      const descMatch = idea.description.toLowerCase().includes(searchTerm);

      return titleMatch || descMatch;
    });

    // Sort results based on relevance
    if (args.sortBy === "relevance") {
      const searchTerm = args.query.toLowerCase().trim();
      results.sort((a: any, b: any) => {
        const aTitleMatch = a.title.toLowerCase().includes(searchTerm);
        const bTitleMatch = b.title.toLowerCase().includes(searchTerm);
        const aDescMatch = a.description.toLowerCase().includes(searchTerm);
        const bDescMatch = b.description.toLowerCase().includes(searchTerm);

        // Prioritize exact title matches
        if (aTitleMatch && !bTitleMatch) return -1;
        if (!aTitleMatch && bTitleMatch) return 1;

        // Then by description matches
        if (aDescMatch && !bDescMatch) return -1;
        if (!aDescMatch && bDescMatch) return 1;

        // Then by popularity (spark count)
        return b.sparkCount - a.sparkCount;
      });
    } else if (args.sortBy === "createdAt") {
      results.sort((a: any, b: any) => b.createdAt - a.createdAt);
    } else if (args.sortBy === "popularity") {
      results.sort((a: any, b: any) => b.sparkCount - a.sparkCount);
    }

    // Apply pagination
    const paginatedResults = results.slice(args.offset || 0, (args.offset || 0) + (args.limit || 20));

    // Get author information for each idea
    const ideasWithAuthors = await Promise.all(
      paginatedResults.map(async (idea: any) => {
        const author = await ctx.db.get(idea.authorId);
        return {
          ...idea,
          author: author ? {
            ...author,
            name: (author as any).displayName,
            username: (author as any).username,
            avatar: (author as any).avatar,
          } : null,
        };
      })
    );

    return {
      results: ideasWithAuthors,
      totalCount: results.length,
      hasMore: (args.offset || 0) + (args.limit || 20) < results.length,
    };
  },
});

// Get popular search suggestions
export const getSearchSuggestions = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 5;

    // Get popular ideas by spark count
    const popularIdeas = await ctx.db
      .query("ideas")
      .withIndex("by_visibility", (q) => q.eq("visibility", "public"))
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .filter((q) => q.or(q.eq(q.field("parentId"), undefined), q.eq(q.field("parentId"), null)))
      .order("desc")
      .take(limit);

    return popularIdeas.map(idea => ({
      id: idea._id,
      title: idea.title,
      category: idea.category,
      sparkCount: idea.sparkCount,
    }));
  },
});