import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { createContributionRequest, updateRequestStatus, getRequestsByIdea, getIncomingRequests } from "./contributionRequests";

// Create a new idea (root or with parent) with proper authorization checks
export const createIdea = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.string(),
    visibility: v.string(),
    parentId: v.optional(v.id("ideas")),
  },
  handler: async (ctx, args) => {
    // Get authenticated user from Clerk
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Validate input
    if (!args.title.trim()) {
      throw new Error("Title is required");
    }

    if (!args.description.trim()) {
      throw new Error("Description is required");
    }

    if (args.title.length > 100) {
      throw new Error("Title must be 100 characters or less");
    }

    if (args.description.length > 1200) {
      throw new Error("Description must be 1200 characters or less");
    }

    if (!['public', 'private'].includes(args.visibility)) {
      throw new Error("Invalid visibility setting");
    }

    // Find user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // If parentId is provided, validate it and check authorization
    if (args.parentId) {
      const parentIdea = await ctx.db.get(args.parentId);
      if (!parentIdea) {
        throw new Error("Parent idea not found");
      }

      // Check if parent idea is deleted
      if (parentIdea.isDeleted) {
        throw new Error("Cannot create sub-idea under a deleted idea");
      }

      // Check authorization: user must be author of parent OR have accepted contribution request
      const isAuthor = parentIdea.authorId === user._id;
      if (!isAuthor) {
        // Check for accepted contribution request
        const acceptedRequests = await ctx.db
          .query("contributionRequests")
          .withIndex("by_contributor_status", (q) =>
            q.eq("contributorId", user._id).eq("status", "accepted")
          )
          .collect();

        // Filter to find accepted request for this specific parent
        const validRequest = acceptedRequests.find(request => request.ideaId === args.parentId);

        if (!validRequest) {
          throw new Error("You are not authorized to add ideas under this parent. You must be the author or have an accepted contribution request.");
        }
      }
    }

    const now = Date.now();

    // Create the idea
    const ideaData: any = {
      authorId: user._id,
      title: args.title.trim(),
      description: args.description.trim(),
      category: args.category,
      visibility: args.visibility,
      sparkCount: 0,
      commentCount: 0,
      contributionRequestCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    // Include parentId if provided
    if (args.parentId) {
      ideaData.parentId = args.parentId;
    }

    const ideaId = await ctx.db.insert("ideas", ideaData);

    return { ideaId, message: "Idea created successfully" };
  },
});

// Get all root public ideas (for feed) - excludes sub-ideas
export const getPublicIdeas = query({
  handler: async (ctx) => {
    const ideas = await ctx.db
      .query("ideas")
      .withIndex("by_visibility", (q) => q.eq("visibility", "public"))
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .filter((q) => q.or(q.eq(q.field("parentId"), undefined), q.eq(q.field("parentId"), null)))
      .order("desc")
      .take(20);

    // Get author information and contribution count for each idea
    const ideasWithAuthors = await Promise.all(
      ideas.map(async (idea) => {
        let author = null;
        try {
          author = await ctx.db.get(idea.authorId);
        } catch (e) {
          console.error("Error fetching author for idea:", idea._id, e);
        }

        // Count accepted contribution requests
        let contributionCount = 0;
        try {
          const acceptedContributions = await ctx.db
            .query("contributionRequests")
            .withIndex("by_idea_status_created", (q) =>
              q.eq("ideaId", idea._id).eq("status", "accepted")
            )
            .collect();
          contributionCount = acceptedContributions.length;
        } catch (e) {
          console.error("Error fetching contribution count for idea:", idea._id, e);
        }

        return {
          ...idea,
          author: author ? {
            ...author,
            // These fields should match the schema naming
            name: author.displayName,
            username: author.username,
          } : null,
          contributionCount: contributionCount,
        };
      })
    );

    return ideasWithAuthors;
  },
});

// Get a single idea by ID
export const getIdeaById = query({
  args: {
    ideaId: v.id("ideas"),
  },
  handler: async (ctx, args) => {
    const idea = await ctx.db.get(args.ideaId);
    if (!idea) {
      return null;
    }

    // Check if idea is deleted
    if (idea.isDeleted) {
      // Get authenticated user to check if they are the author of the deleted idea
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        return null; // Deleted ideas are private to anonymous users
      }

      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .unique();

      if (!user || user._id !== idea.authorId) {
        return null; // Only the author can see their own deleted ideas
      }
    }

    // Get author information
    const author = await ctx.db.get(idea.authorId);

    // Check if current user has sparked this idea and is author
    let hasSparked = false;
    let isAuthor = false;
    const identity = await ctx.auth.getUserIdentity();
    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .unique();

      if (user) {
        const spark = await ctx.db
          .query("userIdeaSparks")
          .withIndex("by_user_idea", (q) =>
            q.eq("userId", user._id).eq("ideaId", args.ideaId)
          )
          .unique();
        hasSparked = spark !== null;

        // Check if current user is the author
        isAuthor = user._id === idea.authorId;
      }
    }

    return {
      ...idea,
      author: author ? {
        ...author,
        name: author.displayName,
        username: author.username,
      } : null,
      hasSparked,
      isAuthor,
    };
  },
});

// Check if current user has sparked an idea
export const hasSparked = query({
  args: {
    ideaId: v.id("ideas"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return false;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return false;
    }

    const spark = await ctx.db
      .query("userIdeaSparks")
      .withIndex("by_user_idea", (q) =>
        q.eq("userId", user._id).eq("ideaId", args.ideaId)
      )
      .unique();

    return spark !== null;
  },
});

// Toggle spark for an idea (add/remove spark)
export const toggleSpark = mutation({
  args: {
    ideaId: v.id("ideas"),
  },
  handler: async (ctx, args) => {
    // Check authentication
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

    // Check if idea exists
    const idea = await ctx.db.get(args.ideaId);
    if (!idea) {
      throw new Error("Idea not found");
    }

    // Check if spark already exists
    const existingSpark = await ctx.db
      .query("userIdeaSparks")
      .withIndex("by_user_idea", (q) =>
        q.eq("userId", user._id).eq("ideaId", args.ideaId)
      )
      .unique();

    if (existingSpark) {
      // Remove spark
      await ctx.db.delete(existingSpark._id);

      // Decrement spark count
      await ctx.db.patch(idea._id, {
        sparkCount: Math.max(0, idea.sparkCount - 1),
        updatedAt: Date.now(),
      });

      return { action: "removed", sparkCount: Math.max(0, idea.sparkCount - 1) };
    } else {
      // Add spark
      const now = Date.now();
      await ctx.db.insert("userIdeaSparks", {
        userId: user._id,
        ideaId: args.ideaId,
        createdAt: now,
      });

      // Increment spark count
      await ctx.db.patch(idea._id, {
        sparkCount: idea.sparkCount + 1,
        updatedAt: now,
      });

      return { action: "added", sparkCount: idea.sparkCount + 1 };
    }
  },
});

// Get idea tree (recursive hierarchical structure)
export const getIdeaTree = query({
  args: {
    rootIdeaId: v.id("ideas"),
  },
  handler: async (ctx, args) => {
    // Get authenticated user for authorization checks
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity ? identity.subject : null;

    // Find user by Clerk ID if authenticated
    let user = null;
    if (userId) {
      user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", userId))
        .unique();
    }

    // Recursive function to build the tree
    const buildIdeaTree = async (ideaId: Id<"ideas">): Promise<any> => {
      const idea = await ctx.db.get(ideaId);
      if (!idea) return null;

      // Check if idea is deleted
      if (idea.isDeleted) {
        return null;
      }

      // Check visibility and authorization
      if (idea.visibility === 'private') {
        // Private ideas: only author can see
        if (!user || user._id !== idea.authorId) {
          return null;
        }
      } else {
        // Public ideas: accessible, but contribution-restricted ideas might have additional checks
        // For now, public ideas are visible (additional logic could be added for contribution restrictions)
      }

      // Get author information
      const author = await ctx.db.get(idea.authorId);
      if (!author) return null;

      // Get children recursively
      const childrenIdeas = await ctx.db
        .query("ideas")
        .withIndex("by_parent", (q) => q.eq("parentId", ideaId))
        .filter((q) => q.neq(q.field("isDeleted"), true))
        .collect();

      // Build children tree
      const children = [];
      for (const child of childrenIdeas) {
        const childTree = await buildIdeaTree(child._id);
        if (childTree) {
          children.push(childTree);
        }
      }

      // Sort children by creation date (newest first)
      children.sort((a, b) => b.createdAt - a.createdAt);

      return {
        ...idea,
        author: {
          ...author,
          name: author.displayName,
          username: author.username,
          avatar: author.avatar,
        },
        children: children,
        childrenCount: children.length,
        // Additional processing for user context
        isAuthor: user ? user._id === idea.authorId : false,
      };
    };

    // Build the root of the tree
    const rootIdea = await buildIdeaTree(args.rootIdeaId);

    if (!rootIdea) {
      return null;
    }

    return rootIdea;
  },
});

// Get comments for an idea
export const getComments = query({
  args: {
    ideaId: v.id("ideas"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_idea_created", (q) => q.eq("ideaId", args.ideaId))
      .order("asc")
      .take(limit);

    // Get author information for each comment
    const commentsWithAuthors = await Promise.all(
      comments.map(async (comment) => {
        const author = await ctx.db.get(comment.authorId);
        return {
          ...comment,
          author: author ? {
            ...author,
            name: author.displayName,
            username: author.username,
            avatar: author.avatar,
          } : null,
        };
      })
    );

    return commentsWithAuthors;
  },
});

// Add a comment to an idea
export const addComment = mutation({
  args: {
    ideaId: v.id("ideas"),
    content: v.string(),
    parentCommentId: v.optional(v.id("comments")),
  },
  handler: async (ctx, args) => {
    // Check authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Validate input
    if (!args.content.trim()) {
      throw new Error("Comment content is required");
    }

    if (args.content.length > 1200) {
      throw new Error("Comment must be 1200 characters or less");
    }

    // Find user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if idea exists
    const idea = await ctx.db.get(args.ideaId);
    if (!idea) {
      throw new Error("Idea not found");
    }

    const now = Date.now();

    // Create the comment
    const commentId = await ctx.db.insert("comments", {
      ideaId: args.ideaId,
      authorId: user._id,
      content: args.content.trim(),
      createdAt: now,
      parentCommentId: args.parentCommentId,
    });

    // Increment comment count
    await ctx.db.patch(idea._id, {
      commentCount: idea.commentCount + 1,
      updatedAt: now,
    });

    return { commentId, message: "Comment added successfully" };
  },
});

// Delete a comment (if needed)
export const deleteComment = mutation({
  args: {
    commentId: v.id("comments"),
  },
  handler: async (ctx, args) => {
    // Check authentication
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

    // Get the comment
    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    // Check if user is the author
    if (comment.authorId !== user._id) {
      throw new Error("Not authorized to delete this comment");
    }

    // Delete the comment
    await ctx.db.delete(args.commentId);

    // Get the idea to decrement count
    const idea = await ctx.db.get(comment.ideaId);
    if (idea) {
      await ctx.db.patch(idea._id, {
        commentCount: Math.max(0, idea.commentCount - 1),
        updatedAt: Date.now(),
      });
    }

    // Note: Nested comments should be handled by frontend (e.g., gray out replies)

    return { message: "Comment deleted successfully" };
  },
});

// Update an idea
export const updateIdea = mutation({
  args: {
    ideaId: v.id("ideas"),
    title: v.string(),
    description: v.string(),
    category: v.string(),
    visibility: v.string(),
  },
  handler: async (ctx, args) => {
    // Check authentication
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

    // Validate input
    if (!args.title.trim()) {
      throw new Error("Title is required");
    }

    if (!args.description.trim()) {
      throw new Error("Description is required");
    }

    if (args.title.length > 100) {
      throw new Error("Title must be 100 characters or less");
    }

    if (args.description.length > 1200) {
      throw new Error("Description must be 1200 characters or less");
    }

    if (!['public', 'private'].includes(args.visibility)) {
      throw new Error("Invalid visibility setting");
    }

    // Get the idea
    const idea = await ctx.db.get(args.ideaId);
    if (!idea) {
      throw new Error("Idea not found");
    }

    // Check if user is the author
    if (idea.authorId !== user._id) {
      throw new Error("Not authorized to update this idea");
    }

    // Update the idea
    await ctx.db.patch(idea._id, {
      title: args.title.trim(),
      description: args.description.trim(),
      category: args.category,
      visibility: args.visibility,
      updatedAt: Date.now(),
    });

    return { message: "Idea updated successfully" };
  },
});

// Get ideas created by the current user
export const getUserIdeas = query({
  handler: async (ctx) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      console.log("getUserIdeas: No authentication identity");
      throw new Error("Not authenticated");
    }

    console.log("getUserIdeas: Auth identity subject:", identity.subject);

    // Find user by Clerk ID
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
          .unique();
    
        console.log("getUserIdeas: User lookup result:", user ? "found" : "not found");
        if (user) {
          console.log("getUserIdeas: User ID:", user._id);
        } else {
          console.log("getUserIdeas: User not found for Clerk ID:", identity.subject);
          return []; // Return empty array instead of throwing
        }

    // Get user's ideas, excluding deleted ones
    const userIdeas = await ctx.db
      .query("ideas")
      .withIndex("by_author", (q) => q.eq("authorId", user._id))
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .order("desc")
      .take(50);

    // Get author information is included but should be consistent
    const ideasWithDetails = await Promise.all(
      userIdeas.map(async (idea) => {
        // Count active contribution requests (not including rejected/deleted related)
        const activeRequestsCount = await ctx.db
          .query("contributionRequests")
          .withIndex("by_idea_status_created", (q) =>
            q.eq("ideaId", idea._id).eq("status", "pending")
          )
          .collect();

        return {
          ...idea,
          activeContributions: activeRequestsCount.length,
        };
      })
    );

    return ideasWithDetails;
  },
});

// Get root ideas (no parent) for the current user
export const getUserRootIdeas = query({
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
      return []; // User profile not created yet
    }

    // Get user's root ideas (no parent)
    const rootIdeas = await ctx.db
      .query("ideas")
      .withIndex("by_author", (q) => q.eq("authorId", user._id))
      .filter((q) => q.or(q.eq(q.field("parentId"), undefined), q.eq(q.field("parentId"), null)))
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .order("desc")
      .take(50);

    // Get author information is included but should be consistent
    const ideasWithDetails = await Promise.all(
      rootIdeas.map(async (idea) => {
        // Count active contribution requests (not including rejected/deleted related)
        const activeRequestsCount = await ctx.db
          .query("contributionRequests")
          .withIndex("by_idea_status_created", (q) =>
            q.eq("ideaId", idea._id).eq("status", "pending")
          )
          .collect();

        // Get children count
        const childrenCount = await ctx.db
          .query("ideas")
          .withIndex("by_parent", (q) => q.eq("parentId", idea._id))
          .filter((q) => q.neq(q.field("isDeleted"), true))
          .collect();

        return {
          ...idea,
          activeContributions: activeRequestsCount.length,
          childrenCount: childrenCount.length,
        };
      })
    );

    return ideasWithDetails;
  },
});

// Delete an idea (soft delete)
export const deleteIdea = mutation({
  args: {
    ideaId: v.id("ideas"),
  },
  handler: async (ctx, args) => {
    // Check authentication
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

    // Get the idea
    const idea = await ctx.db.get(args.ideaId);
    if (!idea) {
      throw new Error("Idea not found");
    }

    // Check if user is the author
    if (idea.authorId !== user._id) {
      throw new Error("Not authorized to delete this idea");
    }

    // Check if idea is already deleted
    if (idea.isDeleted) {
      throw new Error("This idea has already been deleted");
    }

    // Handle contribution requests cleanup
    // Get all pending contribution requests for this idea
    const pendingRequests = await ctx.db
      .query("contributionRequests")
      .withIndex("by_idea_status_created", (q) =>
        q.eq("ideaId", args.ideaId).eq("status", "pending")
      )
      .collect();

    // Update all pending requests for this idea to 'rejected' since idea is being deleted
    for (const request of pendingRequests) {
      await ctx.db.patch(request._id, {
        status: "rejected",
        updatedAt: Date.now(),
      });
    }

    const now = Date.now();

    // Soft delete the idea by setting isDeleted flag
    await ctx.db.patch(idea._id, {
      isDeleted: true,
      visibility: "private", // Set to private to hide from public feeds
      updatedAt: now,
    });

    // Note: We don't decrement comment/spark counts here as they're still valid
    // The frontend should handle showing deleted status appropriately
    // Attachment cleanup would need external file system handling if implemented

    return {
      message: "Idea deleted successfully",
      deletedRequests: pendingRequests.length,
    };
  },
});

// Add sub-idea to a parent idea
export const addSubIdea = mutation({
  args: {
    parentId: v.id("ideas"),
    title: v.string(),
    description: v.string(),
    category: v.string(),
    visibility: v.string(),
  },
  handler: async (ctx, args) => {
    // Get authenticated user from Clerk
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

    // Validate input
    if (!args.title.trim()) {
      throw new Error("Title is required");
    }

    if (!args.description.trim()) {
      throw new Error("Description is required");
    }

    if (args.title.length > 100) {
      throw new Error("Title must be 100 characters or less");
    }

    if (args.description.length > 1200) {
      throw new Error("Description must be 1200 characters or less");
    }

    if (!['public', 'private'].includes(args.visibility)) {
      throw new Error("Invalid visibility setting");
    }

    // Check if parent idea exists
    const parentIdea = await ctx.db.get(args.parentId);
    if (!parentIdea) {
      throw new Error("Parent idea not found");
    }

    // Check if parent idea is deleted
    if (parentIdea.isDeleted) {
      throw new Error("Cannot add sub-idea to a deleted idea");
    }

    // Check authorization: user must be author of parent OR have accepted contribution request
    const isAuthor = parentIdea.authorId === user._id;
    let isAcceptedContributor = false;

    if (!isAuthor) {
      // Check for accepted contribution request
      const acceptedRequests = await ctx.db
        .query("contributionRequests")
        .withIndex("by_contributor_status", (q) =>
          q.eq("contributorId", user._id).eq("status", "accepted")
        )
        .collect();

      // Filter to find accepted request for this specific idea
      const validRequest = acceptedRequests.find(request => request.ideaId === args.parentId);

      if (!validRequest) {
        throw new Error("You are not authorized to add sub-ideas to this idea. You must be the author or have an accepted contribution request.");
      }
      isAcceptedContributor = true;
    }

    const now = Date.now();

    // Create the sub-idea
    const subIdeaId = await ctx.db.insert("ideas", {
      authorId: user._id,
      title: args.title.trim(),
      description: args.description.trim(),
      category: args.category,
      visibility: args.visibility,
      parentId: args.parentId,
      sparkCount: 0,
      commentCount: 0,
      contributionRequestCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    return {
      ideaId: subIdeaId,
      message: "Sub-idea created successfully",
      parentId: args.parentId,
      authorId: user._id
    };
  },
});

// Request contribution (alias for frontend usage)
export const requestContribution = createContributionRequest;

// Accept contribution request
export const acceptContribution = mutation({
  args: {
    requestId: v.id("contributionRequests"),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required: Please sign in to continue");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Request not found");
    }

    // Only author can update status
    if (request.authorId !== user._id) {
      throw new Error("Not authorized to update this request");
    }

    // Validate status transition
    if (request.status !== "pending") {
      throw new Error(`Cannot accept a request that is already ${request.status}`);
    }

    // Update status
    await ctx.db.patch(args.requestId, {
      status: "accepted",
      updatedAt: Date.now(),
    });

    return { message: "Request accepted successfully" };
  },
});

// Reject contribution request
export const rejectContribution = mutation({
  args: {
    requestId: v.id("contributionRequests"),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required: Please sign in to continue");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Request not found");
    }

    // Only author can update status
    if (request.authorId !== user._id) {
      throw new Error("Not authorized to update this request");
    }

    // Validate status transition
    if (request.status !== "pending") {
      throw new Error(`Cannot reject a request that is already ${request.status}`);
    }

    // Update status
    await ctx.db.patch(args.requestId, {
      status: "rejected",
      updatedAt: Date.now(),
    });

    return { message: "Request rejected successfully" };
  },
});

// Get requests for an idea (for author)
export const getContributionRequests = getRequestsByIdea;

// Get incoming requests for current user
// Get ideas sparked by the current user (excluding their own ideas)
export const getUserSparkedIdeas = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

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
      return []; // User profile not created yet
    }

    // Get ideas the user has sparked
    const userSparks = await ctx.db
      .query("userIdeaSparks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Extract idea IDs
    const ideaIds = userSparks.map(spark => spark.ideaId);

    if (ideaIds.length === 0) {
      return [];
    }

    // Get the ideas, excluding user's own ideas
    const ideas = await Promise.all(
      ideaIds
        .slice(0, limit) // Limit the number of ideas to fetch
        .map(async (ideaId) => {
          const idea = await ctx.db.get(ideaId);

          // Skip if idea doesn't exist, is deleted, or is the user's own idea
          if (!idea || idea.isDeleted || idea.authorId === user._id) {
            return null;
          }

          // Get author information
          const author = await ctx.db.get(idea.authorId);

          return {
            ...idea,
            author: author ? {
              ...author,
              name: author.displayName,
              username: author.username,
            } : null,
            // Include spark timestamp
            sparkedAt: userSparks.find(s => s.ideaId === ideaId)?.createdAt,
          };
        })
    );

    // Filter out nulls and sort by spark timestamp (most recent first)
    return ideas
      .filter(idea => idea !== null)
      .sort((a, b) => (b.sparkedAt || 0) - (a.sparkedAt || 0));
  },
});

// Get ideas the user has contributed to (with accepted requests)
export const getUserContributedIdeas = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

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
      return []; // User profile not created yet
    }

    // Get accepted contribution requests for this user
    const acceptedRequests = await ctx.db
      .query("contributionRequests")
      .withIndex("by_contributor_status", (q) =>
        q.eq("contributorId", user._id).eq("status", "accepted")
      )
      .collect();

    // Extract unique idea IDs
    const ideaIds = [...new Set(acceptedRequests.map(req => req.ideaId))];

    if (ideaIds.length === 0) {
      return [];
    }

    // Get the ideas, excluding user's own ideas (shouldn't happen but safety check)
    const ideas = await Promise.all(
      ideaIds
        .slice(0, limit) // Limit the number of ideas to fetch
        .map(async (ideaId) => {
          const idea = await ctx.db.get(ideaId);

          // Skip if idea doesn't exist or is deleted
          if (!idea || idea.isDeleted) {
            return null;
          }

          // Get author information
          const author = await ctx.db.get(idea.authorId);

          // Find the contribution request to get the accepted timestamp
          const request = acceptedRequests.find(req => req.ideaId === ideaId);

          return {
            ...idea,
            author: author ? {
              ...author,
              name: author.displayName,
              username: author.username,
            } : null,
            // Include contribution accepted timestamp
            contributedAt: request?.updatedAt || request?.createdAt,
          };
        })
    );

    // Filter out nulls and sort by contribution timestamp (most recent first)
    return ideas
      .filter(idea => idea !== null)
      .sort((a, b) => (b.contributedAt || 0) - (a.contributedAt || 0));
  },
});
export const getIncomingContributionRequests = getIncomingRequests;