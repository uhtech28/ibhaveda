import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { createContributionRequest, updateRequestStatus, getRequestsByIdea, getIncomingRequests } from "./contributionRequests";

// Create a new idea (root or with parent) with proper authorization checks
export const createIdea = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.string(),
    industries: v.optional(v.string()),
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
      industries: args.industries || undefined,
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

    // Create notifications based on idea visibility
    if (args.visibility === 'public') {
      // For public ideas, notify all users except the creator
      const allUsers = await ctx.db.query("users").collect();

      // Filter out the creator and create notifications
      const notificationPromises = allUsers
        .filter(u => u._id !== user._id) // Exclude the creator
        .map(recipient =>
          ctx.db.insert("notifications", {
            recipientId: recipient._id,
            senderId: user._id,
            type: "new_idea",
            message: `${user.displayName} shared a new idea: "${args.title.trim()}"`,
            relatedId: ideaId,
            isRead: false,
            createdAt: now,
          })
        );

      // Wait for all notifications to be created
      await Promise.all(notificationPromises);
    } else {
      // For private ideas, only notify the author (which is already excluded above)
      // Private ideas don't generate public notifications to maintain privacy
    }


    // Social proof engine: schedule seeded sparks for new public root ideas
    if (args.visibility === "public" && !args.parentId) {
      await ctx.scheduler.runAfter(0, internal.socialProof.scheduleForNewIdea, { ideaId });
    }

    // Gamification: Award XP and Coins for creating an idea
    await ctx.scheduler.runAfter(0, internal.gamification.internalAwardXP, {
      userId: user._id,
      amount: 50,
      action: "create_idea",
    });

    await ctx.scheduler.runAfter(0, internal.gamification.internalAwardPoints, {
      userId: user._id,
      amount: 50,
      type: "create_idea",
      description: "Created a new idea"
    });

    return { ideaId, message: "Idea created successfully" };
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const uploadUrl = await ctx.storage.generateUploadUrl();
    return { uploadUrl };
  },
});

export const attachFileToIdea = mutation({
  args: {
    ideaId: v.id("ideas"),
    storageId: v.string(),
    name: v.string(),
    type: v.string(),
    size: v.number(),
    uploadedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const idea = await ctx.db.get(args.ideaId);
    if (!idea) {
      throw new Error("Idea not found");
    }

    if (idea.authorId !== user._id) {
      throw new Error("Not authorized to attach files to this idea");
    }

    const existing = Array.isArray(idea.attachments) ? idea.attachments : [];
    if (existing.length >= 1) {
      throw new Error("Maximum 1 file per idea");
    }

    if (args.size > 50 * 1024 * 1024) {
      throw new Error("Total size limit exceeded (50MB)");
    }

    const lowerType = (args.type || "").toLowerCase();
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "video/mp4",
    ];

    const isAllowed = allowed.some((t) => lowerType === t);
    if (!isAllowed) {
      throw new Error("Unsupported file type");
    }

    if (lowerType === "video/mp4" && args.size > 25 * 1024 * 1024) {
      throw new Error("MP4 files must be 25MB or less");
    }

    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) {
      throw new Error("Convex storage error");
    }

    const attachment = {
      name: args.name,
      type: lowerType,
      size: args.size,
      url,
      fileId: args.storageId,
    };

    await ctx.db.patch(idea._id, {
      attachments: [...existing, attachment],
      updatedAt: Date.now(),
    });

    return { attachment };
  },
});

// Get all root public ideas (for feed) - excludes sub-ideas with limit-based pagination
export const getPublicIdeas = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    // 1. Get Top 5 Leaderboard Users
    const topWallets = await ctx.db
      .query("wallets")
      .withIndex("by_balance")
      .order("desc")
      .take(5);

    const topUserIds = new Set(topWallets.map(w => w.userId));

    // 2. Get recent public ideas (General Feed)
    const generalIdeas = await ctx.db
      .query("ideas")
      .withIndex("by_visibility", (q) => q.eq("visibility", "public"))
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .filter((q) => q.or(q.eq(q.field("parentId"), undefined), q.eq(q.field("parentId"), null)))
      .order("desc")
      .take(limit);

    // 3. Get recent ideas from Top Users (Leader Boost)
    // We explicitly fetch their recent posts to ensure they appear
    const leaderIdeasPromises = Array.from(topUserIds).map(userId =>
      ctx.db.query("ideas")
        .withIndex("by_author_visibility", (q) => q.eq("authorId", userId).eq("visibility", "public"))
        .filter((q) => q.neq(q.field("isDeleted"), true))
        .filter((q) => q.or(q.eq(q.field("parentId"), undefined), q.eq(q.field("parentId"), null)))
        .order("desc")
        .take(3) // Take top 3 from each leader
    );

    const leaderIdeasArrays = await Promise.all(leaderIdeasPromises);
    const leaderIdeas = leaderIdeasArrays.flat();

    // 4. Merge and Deduplicate
    const allIdeas = [...leaderIdeas, ...generalIdeas];
    const uniqueIdeasMap = new Map();
    allIdeas.forEach(idea => {
      uniqueIdeasMap.set(idea._id, idea);
    });

    const uniqueIdeas = Array.from(uniqueIdeasMap.values());

    // 5. Sort with Boost
    // Boost score: +1 day equivalent (86400000 ms) if author is top leader, effectively pinning them higher vs same-day posts
    const BOOST_AMOUNT = 86400000;

    uniqueIdeas.sort((a, b) => {
      const scoreA = topUserIds.has(a.authorId) ? a.createdAt + BOOST_AMOUNT : a.createdAt;
      const scoreB = topUserIds.has(b.authorId) ? b.createdAt + BOOST_AMOUNT : b.createdAt;
      return scoreB - scoreA;
    });

    // 6. Limit
    const finalIdeas = uniqueIdeas.slice(0, limit);

    // Get author information and contribution count for each idea
    const ideasWithAuthors = await Promise.all(
      finalIdeas.map(async (idea) => {
        let author: any = null;
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

      // Create notification for idea author (if not the same user)
      if (idea.authorId !== user._id) {
        await ctx.db.insert("notifications", {
          recipientId: idea.authorId,
          senderId: user._id,
          type: "spark_received",
          message: `${user.displayName} sparked your idea "${idea.title}"`,
          relatedId: args.ideaId,
          isRead: false,
          createdAt: now,
        });
      }


      // Gamification: Award XP and Points for sparking

      // 0. Check Badges for Author (Trendsetter)
      if (idea.authorId !== user._id) {
        await ctx.scheduler.runAfter(0, internal.badges.checkBadges, {
          userId: idea.authorId,
          trigger: "spark",
        });
      }

      // 1. Award Sparker (Actor) - 1 Point
      await ctx.scheduler.runAfter(0, internal.gamification.internalAwardXP, {
        userId: user._id,
        amount: 1,
        action: "spark_idea",
      });
      await ctx.scheduler.runAfter(0, internal.gamification.internalAwardPoints, {
        userId: user._id,
        amount: 1,
        type: "spark_idea",
        description: "Sparked an idea"
      });

      // 2. Award Author - 3 Points (Public) or 1 Point (Private)
      if (idea.authorId !== user._id) {
        const pointsForAuthor = idea.visibility === 'public' ? 3 : 1;

        await ctx.scheduler.runAfter(0, internal.gamification.internalAwardXP, {
          userId: idea.authorId,
          amount: pointsForAuthor,
          action: "spark_received",
        });
        await ctx.scheduler.runAfter(0, internal.gamification.internalAwardPoints, {
          userId: idea.authorId,
          amount: pointsForAuthor,
          type: "spark_received",
          description: `Received spark on ${idea.visibility} idea`
        });
      }

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

    // Helper function to find the root parent of an idea
    const findRootIdea = async (ideaId: Id<"ideas">): Promise<any> => {
      let current = await ctx.db.get(ideaId);
      if (!current) return null;

      while (current.parentId) {
        current = await ctx.db.get(current.parentId);
        if (!current) break;
      }

      return current;
    };

    // Recursive function to build the tree
    const buildIdeaTree = async (ideaId: Id<"ideas">): Promise<any> => {
      const idea = await ctx.db.get(ideaId);
      if (!idea) {
        console.log("buildIdeaTree: idea not found for id:", ideaId);
        return null;
      }

      // Check if idea is deleted - authors can still see their deleted ideas
      if (idea.isDeleted && (!user || user._id !== idea.authorId)) {
        console.log("buildIdeaTree: idea is deleted and user is not author:", ideaId);
        return null;
      }

      // Check visibility and authorization based on root parent
      const rootIdea = await findRootIdea(ideaId);
      if (!rootIdea) {
        return null; // Invalid tree structure
      }

      // First check: if user is the root author, they can see everything under their root
      const isRootAuthor = user && user._id === rootIdea.authorId;
      console.log("buildIdeaTree: isRootAuthor:", isRootAuthor, "user._id:", user?._id, "rootIdea.authorId:", rootIdea.authorId);

      // Check if user has accepted contribution request for the root
      let hasAcceptedRequest = false;
      if (user) {
        const acceptedRequests = await ctx.db
          .query("contributionRequests")
          .withIndex("by_contributor_status", (q) =>
            q.eq("contributorId", user._id).eq("status", "accepted")
          )
          .collect();
        hasAcceptedRequest = acceptedRequests.some(req => req.ideaId === rootIdea._id);
      }

      const canSeeAsContributor = hasAcceptedRequest;
      console.log("buildIdeaTree: canSeeAsContributor:", canSeeAsContributor, "hasAcceptedRequest:", hasAcceptedRequest);

      if (isRootAuthor || canSeeAsContributor) {
        console.log("buildIdeaTree: allowing access - root author or contributor");
        // Root author or accepted contributor can see all sub-ideas regardless of visibility
      } else if (rootIdea.visibility === 'public') {
        console.log("buildIdeaTree: allowing access - public root");
        // Sub-ideas of public parents: visible to all users
        // No additional checks needed
      } else {
        console.log("buildIdeaTree: private root, checking further");
        // Private root: visible to root authors, accepted contributors, or sub-idea authors
        if (!user) {
          console.log("buildIdeaTree: denying access - no user");
          return null;
        }

        // Check if user is the author of this idea
        const isSubIdeaAuthor = user._id === idea.authorId;
        console.log("buildIdeaTree: isSubIdeaAuthor:", isSubIdeaAuthor, "idea.authorId:", idea.authorId);

        // Root authors and accepted contributors can see all sub-ideas under private roots too
        if (!isRootAuthor && !canSeeAsContributor && !isSubIdeaAuthor) {
          console.log("buildIdeaTree: denying access - not authorized");
          return null;
        }
        console.log("buildIdeaTree: allowing access - sub-idea author");
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

    // Walk up to the TRUE root before building. This way, when the caller
    // passes a sub-idea id, the hierarchy still renders the entire chain
    // (top-level ancestor → all descendants), not just the sub-tree under
    // the passed node. The UI can highlight the current node by id.
    const trueRoot = await findRootIdea(args.rootIdeaId);
    if (!trueRoot) return null;

    const rootIdea = await buildIdeaTree(trueRoot._id);
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
    const identity = await ctx.auth.getUserIdentity();
    const currentUser = identity
      ? await ctx.db
          .query("users")
          .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
          .unique()
      : null;

    const comments = await ctx.db
      .query("comments")
      .withIndex("by_idea_created", (q) => q.eq("ideaId", args.ideaId))
      .order("asc")
      .take(limit);

    // Get author information for each comment
    const commentsWithAuthors = await Promise.all(
      comments.map(async (comment) => {
        const author = await ctx.db.get(comment.authorId);
        const commentSparks = await ctx.db
          .query("userCommentSparks")
          .withIndex("by_comment", (q) => q.eq("commentId", comment._id))
          .collect();
        const userHasSparked = currentUser
          ? commentSparks.some((spark) => spark.userId === currentUser._id)
          : false;

        return {
          ...comment,
          sparkCount: comment.sparkCount ?? commentSparks.length,
          userHasSparked,
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
      sparkCount: 0,
    });

    // Increment comment count
    await ctx.db.patch(args.ideaId, {
      commentCount: (idea.commentCount || 0) + 1,
      updatedAt: now,
    });

    // Gamification: Badges Check (Chatterbox)
    await ctx.scheduler.runAfter(0, internal.badges.checkBadges, {
      userId: user._id,
      trigger: "comment",
    });

    // Gamification: Award XP and Points for commenting
    await ctx.db.patch(idea._id, {
      commentCount: idea.commentCount + 1,
      updatedAt: now,
    });

    // Create notification for idea author (if not the same user)
    if (idea.authorId !== user._id) {
      await ctx.db.insert("notifications", {
        recipientId: idea.authorId,
        senderId: user._id,
        type: "comment_received",
        message: `${user.displayName} commented on your idea "${idea.title}"`,
        relatedId: args.ideaId,
        isRead: false,
        createdAt: now,
      });
    }


    // Gamification: Award XP and Points for commenting

    // 1. Award Commenter (Actor) - 1 Point
    await ctx.scheduler.runAfter(0, internal.gamification.internalAwardXP, {
      userId: user._id,
      amount: 1,
      action: "comment",
    });
    await ctx.scheduler.runAfter(0, internal.gamification.internalAwardPoints, {
      userId: user._id,
      amount: 1,
      type: "comment",
      description: "Commented on an idea"
    });

    // 2. Award Author - 3 Points (Public) or 1 Point (Private)
    if (idea.authorId !== user._id) {
      const pointsForAuthor = idea.visibility === 'public' ? 3 : 1;

      await ctx.scheduler.runAfter(0, internal.gamification.internalAwardXP, {
        userId: idea.authorId,
        amount: pointsForAuthor,
        action: "comment_received",
      });
      await ctx.scheduler.runAfter(0, internal.gamification.internalAwardPoints, {
        userId: idea.authorId,
        amount: pointsForAuthor,
        type: "comment_received",
        description: `Received comment on ${idea.visibility} idea`
      });
    }

    return { commentId, message: "Comment added successfully" };
  },
});

// Toggle spark for a comment (used by comment-based badge requirements)
export const toggleCommentSpark = mutation({
  args: {
    commentId: v.id("comments"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    const existingSpark = await ctx.db
      .query("userCommentSparks")
      .withIndex("by_user_comment", (q) =>
        q.eq("userId", user._id).eq("commentId", args.commentId)
      )
      .unique();
    const commentSparks = await ctx.db
      .query("userCommentSparks")
      .withIndex("by_comment", (q) => q.eq("commentId", args.commentId))
      .collect();
    const nonAuthorSparkCount = commentSparks.filter(
      (spark) => spark.userId !== comment.authorId
    ).length;

    const currentSparkCount = Math.max(comment.sparkCount ?? 0, commentSparks.length);
    const now = Date.now();
    const shouldUpdateAuthorCounter = comment.authorId !== user._id;

    const updateCommentAuthorSparkedCount = async (delta: number) => {
      if (!shouldUpdateAuthorCounter) return;

      const authorLevel = await ctx.db
        .query("userLevels")
        .withIndex("by_user", (q) => q.eq("userId", comment.authorId))
        .unique();

      if (authorLevel) {
        await ctx.db.patch(authorLevel._id, {
          upvotedCommentsCount: Math.max(0, (authorLevel.upvotedCommentsCount || 0) + delta),
          updatedAt: now,
        });
      } else if (delta > 0) {
        await ctx.db.insert("userLevels", {
          userId: comment.authorId,
          currentLevel: 1,
          titlePoints: 0,
          totalPoints: 0,
          goldCheckpoints: 0,
          fullLifecycles: 0,
          helpfulFlareResponses: 0,
          flaresResolved: 0,
          menteesCount: 0,
          menteeCheckpointAdvances: 0,
          menteeLevelAchievements: 0,
          ideasLaunched: 0,
          ideasScaled: 0,
          collaboratorsRecruited: 0,
          collaboratorsJoined: 0,
          commentsCount: 0,
          upvotedCommentsCount: 1,
          ideasCreated: 0,
          ideasWithStage6: 0,
          ideasWithStage8: 0,
          activeIdeaTypes: [],
          updatedAt: now,
        });
      }
    };

    if (existingSpark) {
      await ctx.db.delete(existingSpark._id);
      const nextSparkCount = Math.max(0, currentSparkCount - 1);
      await ctx.db.patch(comment._id, { sparkCount: nextSparkCount });

      if (shouldUpdateAuthorCounter) {
        await updateCommentAuthorSparkedCount(-1);
      }

      await ctx.scheduler.runAfter(0, internal.badges.recalculateUserBadgesInternal, {
        userId: comment.authorId,
      });

      return { action: "removed", sparkCount: nextSparkCount };
    }

    await ctx.db.insert("userCommentSparks", {
      userId: user._id,
      commentId: args.commentId,
      createdAt: now,
    });

    const nextSparkCount = currentSparkCount + 1;
    await ctx.db.patch(comment._id, { sparkCount: nextSparkCount });

    if (shouldUpdateAuthorCounter) {
      await updateCommentAuthorSparkedCount(1);
    }

    if (shouldUpdateAuthorCounter) {
      await ctx.db.insert("notifications", {
        recipientId: comment.authorId,
        senderId: user._id,
        type: "comment_spark_received",
        message: `${user.displayName} sparked your comment`,
        relatedId: args.commentId,
        isRead: false,
        createdAt: now,
      });
    }

    await ctx.scheduler.runAfter(0, internal.badges.recalculateUserBadgesInternal, {
      userId: comment.authorId,
    });

    return { action: "added", sparkCount: nextSparkCount };
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

    const commentSparks = await ctx.db
      .query("userCommentSparks")
      .withIndex("by_comment", (q) => q.eq("commentId", args.commentId))
      .collect();
    const nonAuthorSparkCount = commentSparks.filter(
      (spark) => spark.userId !== comment.authorId
    ).length;

    for (const spark of commentSparks) {
      await ctx.db.delete(spark._id);
    }

    if (nonAuthorSparkCount > 0) {
      const authorLevel = await ctx.db
        .query("userLevels")
        .withIndex("by_user", (q) => q.eq("userId", comment.authorId))
        .unique();
      if (authorLevel) {
        await ctx.db.patch(authorLevel._id, {
          upvotedCommentsCount: Math.max(0, (authorLevel.upvotedCommentsCount || 0) - 1),
          updatedAt: Date.now(),
        });
      }
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
      return []; // Return empty array instead of throwing for profile-setup page
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

    // Get user's root ideas (originally created by user), excluding deleted ones and contributed ideas - include both public and private
    const userIdeas = await ctx.db
      .query("ideas")
      .withIndex("by_author", (q) => q.eq("authorId", user._id))
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .filter((q) => q.or(q.eq(q.field("parentId"), undefined), q.eq(q.field("parentId"), null)))
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

// Delete an idea (soft delete)
export const deleteIdea = mutation({
  args: {
    ideaId: v.id("ideas"),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

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
    industries: v.optional(v.string()),
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
      industries: args.industries || undefined,
      visibility: args.visibility,
      parentId: args.parentId,
      sparkCount: 0,
      commentCount: 0,
      contributionRequestCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Create notifications for all users except the creator (only for public sub-ideas)
    if (args.visibility === 'public') {
      const allUsers = await ctx.db.query("users").collect();

      // Filter out the creator and create notifications
      const notificationPromises = allUsers
        .filter(u => u._id !== user._id) // Exclude the creator
        .map(recipient =>
          ctx.db.insert("notifications", {
            recipientId: recipient._id,
            senderId: user._id,
            type: "new_idea",
            message: `${user.displayName} added a new idea branch: "${args.title.trim()}"`,
            relatedId: subIdeaId,
            isRead: false,
            createdAt: now,
          })
        );

      // Wait for all notifications to be created
      await Promise.all(notificationPromises);
    }

    return { subIdeaId, message: "Sub-idea added successfully" };
  },
});

// Get public ideas sparked by a specific user (for profile views)
export const getPublicSparkedIdeasForUser = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    // Find user to verify existence
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return [];
    }

    // Get ideas the user has sparked
    const userSparks = await ctx.db
      .query("userIdeaSparks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const ideaIds = userSparks.map(spark => spark.ideaId);

    if (ideaIds.length === 0) {
      return [];
    }

    // Get the ideas, checking visibility
    const ideas = await Promise.all(
      ideaIds
        .slice(0, limit)
        .map(async (ideaId) => {
          const idea = await ctx.db.get(ideaId);

          // Skip if idea doesn't exist, is deleted, is user's own, or is NOT public
          if (!idea || idea.isDeleted || idea.authorId === args.userId || idea.visibility !== "public") {
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
            sparkedAt: userSparks.find(s => s.ideaId === ideaId)?.createdAt,
          };
        })
    );

    // Filter out nulls and sort by spark timestamp
    return ideas
      .filter(idea => idea !== null)
      .sort((a, b) => (b.sparkedAt || 0) - (a.sparkedAt || 0));
  },
});

// Get public ideas contributed to by a specific user (for profile views)
export const getPublicContributedIdeasForUser = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    // Find user to verify existence
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return [];
    }

    // Get accepted contribution requests for this user
    const acceptedRequests = await ctx.db
      .query("contributionRequests")
      .withIndex("by_contributor_status", (q) =>
        q.eq("contributorId", args.userId).eq("status", "accepted")
      )
      .collect();

    // Extract unique idea IDs
    const ideaIds = [...new Set(acceptedRequests.map(req => req.ideaId))];

    if (ideaIds.length === 0) {
      return [];
    }

    // Get the ideas, checking visibility
    const ideas = await Promise.all(
      ideaIds
        .slice(0, limit)
        .map(async (ideaId) => {
          const idea = await ctx.db.get(ideaId);

          // Skip if idea doesn't exist, is deleted, or is NOT public
          if (!idea || idea.isDeleted || idea.visibility !== "public") {
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
            contributedAt: request?.updatedAt || request?.createdAt,
          };
        })
    );

    // Filter out nulls and sort by contribution timestamp
    return ideas
      .filter(idea => idea !== null)
      .sort((a, b) => (b.contributedAt || 0) - (a.contributedAt || 0));
  },
});

// Get public ideas for a specific user (for profile views)
export const getPublicIdeasForUser = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    // Find user to verify existence
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return [];
    }

    const userIdeas = await ctx.db
      .query("ideas")
      .withIndex("by_author", (q) => q.eq("authorId", args.userId))
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .filter((q) => q.eq(q.field("visibility"), "public"))
      .order("desc")
      .take(limit);

    return userIdeas;
  },
});

// Get ideas for a specific user profile (handles visibility for owner vs visitor)
export const getProfileIdeas = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const identity = await ctx.auth.getUserIdentity();

    // Check if viewer is the profile owner
    let isOwner = false;
    if (identity) {
      const viewer = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .unique();
      if (viewer && viewer._id === args.userId) {
        isOwner = true;
      }
    }

    let ideasQuery = ctx.db
      .query("ideas")
      .withIndex("by_author", (q) => q.eq("authorId", args.userId))
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .filter((q) => q.or(q.eq(q.field("parentId"), undefined), q.eq(q.field("parentId"), null)));

    // If not owner, filter by public visibility
    if (!isOwner) {
      ideasQuery = ideasQuery.filter((q) => q.eq(q.field("visibility"), "public"));
    }

    const ideas = await ideasQuery.order("desc").take(limit);

    return ideas;
  },
});
// Internal query for the AI agent to fetch recent ideas
export const getRecentIdeasInternal = internalQuery({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ideas")
      .withIndex("by_visibility", (q) => q.eq("visibility", "public"))
      .order("desc")
      .take(args.limit);
  },
});
