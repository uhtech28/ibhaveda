import { v } from "convex/values";
import { query } from "./_generated/server";

export const searchIdeas = query({
  args: {
    query: v.string(),
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    sortBy: v.optional(v.union(v.literal("relevance"), v.literal("createdAt"), v.literal("popularity"))),
  },
  handler: async (ctx, args) => {
    const { query, category, limit = 20, offset = 0, sortBy = "relevance" } = args;

    if (!query.trim()) {
      return { results: [], totalCount: 0 };
    }

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
    if (category) {
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
    const searchTerm = query.toLowerCase().trim();
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
    if (sortBy === "relevance") {
      const searchTerm = query.toLowerCase().trim();
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
    } else if (sortBy === "createdAt") {
      results.sort((a: any, b: any) => b.createdAt - a.createdAt);
    } else if (sortBy === "popularity") {
      results.sort((a: any, b: any) => b.sparkCount - a.sparkCount);
    }

    // Apply pagination
    const paginatedResults = results.slice(offset, offset + limit);

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
      hasMore: offset + limit < results.length,
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