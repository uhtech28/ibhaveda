import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

// Create a new todo for an idea
export const createTodo = mutation({
  args: {
    ideaId: v.id("ideas"),
    title: v.string(),
    assignedTo: v.optional(v.id("users")),
    deadline: v.optional(v.number()),
    completionTarget: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Validate input
    if (!args.title.trim()) {
      throw new Error("Todo title is required");
    }

    if (args.title.length > 200) {
      throw new Error("Todo title must be 200 characters or less");
    }

    // Validate assignedTo if provided
    if (args.assignedTo) {
      const assignedUser = await ctx.db.get(args.assignedTo);
      if (!assignedUser) {
        throw new Error("Assigned user does not exist");
      }
    }

    // Validate deadline if provided (must be today or future)
    if (args.deadline !== undefined) {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (args.deadline < startOfToday.getTime()) {
        throw new Error("Deadline must be today or in the future");
      }
    }

    // Validate completionTarget if provided
    if (args.completionTarget && args.completionTarget.length > 500) {
      throw new Error("Completion target must be 500 characters or less");
    }

    // Find user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if idea exists and get idea details for authorization
    const idea = await ctx.db.get(args.ideaId);
    if (!idea) {
      throw new Error("Idea not found");
    }

    // Check if idea is deleted
    if (idea.isDeleted) {
      throw new Error("Cannot add todos to deleted ideas");
    }

    // Check authorization: user must be author of idea OR have accepted contribution request
    const isAuthor = idea.authorId === user._id;
    if (!isAuthor) {
      // Check for accepted contribution request
      const acceptedRequests = await ctx.db
        .query("contributionRequests")
        .withIndex("by_contributor_status", (q) =>
          q.eq("contributorId", user._id).eq("status", "accepted")
        )
        .collect();

      // Filter to find accepted request for this specific idea
      const validRequest = acceptedRequests.find(request => request.ideaId === args.ideaId);

      if (!validRequest) {
        throw new Error("You are not authorized to add todos to this idea. You must be the author or have an accepted contribution request.");
      }
    }

    // Get the highest order value for this idea to maintain ordering
    const existingTodos = await ctx.db
      .query("todos")
      .withIndex("by_idea", (q) => q.eq("ideaId", args.ideaId))
      .collect();

    const maxOrder = existingTodos.length > 0
      ? Math.max(...existingTodos.map(todo => todo.order || 0))
      : 0;

    const now = Date.now();

    // Create the todo
    const todoData: any = {
      ideaId: args.ideaId,
      authorId: user._id,
      title: args.title.trim(),
      status: "todo",
      order: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    };

    if (args.assignedTo) {
      todoData.assignedTo = args.assignedTo;
    }

    if (args.deadline !== undefined) {
      todoData.deadline = args.deadline;
    }

    if (args.completionTarget) {
      todoData.completionTarget = args.completionTarget.trim();
    }

    const todoId = await ctx.db.insert("todos", todoData);

    return { todoId, message: "Todo created successfully" };
  },
});

// Update a todo (change title, order, assignee, deadline, completionTarget)
export const updateTodo = mutation({
  args: {
    todoId: v.id("todos"),
    title: v.optional(v.string()),
    order: v.optional(v.number()),
    assignedTo: v.optional(v.id("users")),
    deadline: v.optional(v.number()),
    completionTarget: v.optional(v.string()),
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

    // Get the todo
    const todo = await ctx.db.get(args.todoId);
    if (!todo) {
      throw new Error("Todo not found");
    }

    // Check authorization
    const isTodoAuthor = todo.authorId === user._id;

    // Get idea to check if user is idea author
    const idea = await ctx.db.get(todo.ideaId);
    if (!idea) {
      throw new Error("Associated idea not found");
    }

    const isIdeaAuthor = idea.authorId === user._id;

    // Check if user is currently assigned to this todo
    const isAssignedUser = todo.assignedTo === user._id;

    // For assignment-related updates, allow idea authors or currently assigned users
    if (args.assignedTo !== undefined && !isIdeaAuthor && !isAssignedUser) {
      throw new Error("Only idea authors or assigned users can update task assignments");
    }

    // For other updates, only todo author is allowed
    if (args.title !== undefined || args.order !== undefined || args.deadline !== undefined || args.completionTarget !== undefined) {
      if (!isTodoAuthor) {
        throw new Error("Not authorized to update this todo");
      }
    }

    // Validate title if provided
    if (args.title !== undefined) {
      if (!args.title.trim()) {
        throw new Error("Todo title is required");
      }
      if (args.title.length > 200) {
        throw new Error("Todo title must be 200 characters or less");
      }
    }

    // Validate assignedTo if provided
    if (args.assignedTo !== undefined) {
      if (args.assignedTo) {
        const assignedUser = await ctx.db.get(args.assignedTo);
        if (!assignedUser) {
          throw new Error("Assigned user does not exist");
        }
      }
    }

    // Validate deadline if provided (must be today or future)
    if (args.deadline !== undefined) {
      if (args.deadline) {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (args.deadline < startOfToday.getTime()) {
          throw new Error("Deadline must be today or in the future");
        }
      }
    }

    // Validate completionTarget if provided
    if (args.completionTarget !== undefined) {
      if (args.completionTarget && args.completionTarget.length > 500) {
        throw new Error("Completion target must be 500 characters or less");
      }
    }

    // Prepare update object
    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) {
      updateData.title = args.title.trim();
    }

    if (args.order !== undefined) {
      updateData.order = args.order;
    }

    if (args.assignedTo !== undefined) {
      updateData.assignedTo = args.assignedTo || undefined; // Set to undefined if null to clear assignment
    }

    if (args.deadline !== undefined) {
      updateData.deadline = args.deadline || undefined;
    }

    if (args.completionTarget !== undefined) {
      updateData.completionTarget = args.completionTarget ? args.completionTarget.trim() : undefined;
    }

    // Update the todo
    await ctx.db.patch(todo._id, updateData);

    return { message: "Todo updated successfully" };
  },
});

// Toggle completion status of a todo
export const toggleTodoComplete = mutation({
  args: {
    todoId: v.id("todos"),
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

    // Get the todo
    const todo = await ctx.db.get(args.todoId);
    if (!todo) {
      throw new Error("Todo not found");
    }

    // Check if idea exists and user is authorized
    const idea = await ctx.db.get(todo.ideaId);
    if (!idea) {
      throw new Error("Associated idea not found");
    }

    // Check authorization: user must be author of idea OR todo author OR have accepted contribution request
    const isAuthor = idea.authorId === user._id;
    const isTodoAuthor = todo.authorId === user._id;
    let isAcceptedContributor = false;

    if (!isAuthor && !isTodoAuthor) {
      // Check for accepted contribution request
      const acceptedRequests = await ctx.db
        .query("contributionRequests")
        .withIndex("by_contributor_status", (q) =>
          q.eq("contributorId", user._id).eq("status", "accepted")
        )
        .collect();

      // Filter to find accepted request for this specific idea
      const validRequest = acceptedRequests.find(request => request.ideaId === todo.ideaId);

      if (!validRequest) {
        throw new Error("You are not authorized to modify todos for this idea.");
      }
      isAcceptedContributor = true;
    }

    // Cycle status: todo -> in_progress -> done -> todo
    let newStatus: "todo" | "in_progress" | "done";
    switch (todo.status) {
      case "todo":
        newStatus = "in_progress";
        break;
      case "in_progress":
        newStatus = "done";
        break;
      case "done":
        newStatus = "todo";
        break;
      default:
        newStatus = "todo"; // fallback
    }

    await ctx.db.patch(todo._id, {
      status: newStatus,
      updatedAt: Date.now(),
    });

    return { status: newStatus, message: "Todo status updated successfully" };
  },
});

// Update todo status directly (for Kanban drag-drop)
export const updateTodoStatus = mutation({
  args: {
    todoId: v.id("todos"),
    status: v.union(v.literal("todo"), v.literal("in_progress"), v.literal("done")),
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

    // Get the todo
    const todo = await ctx.db.get(args.todoId);
    if (!todo) {
      throw new Error("Todo not found");
    }

    // Check if idea exists and user is authorized
    const idea = await ctx.db.get(todo.ideaId);
    if (!idea) {
      throw new Error("Associated idea not found");
    }

    // Check authorization: user must be author of idea OR todo author OR have accepted contribution request
    const isAuthor = idea.authorId === user._id;
    const isTodoAuthor = todo.authorId === user._id;
    let isAcceptedContributor = false;

    if (!isAuthor && !isTodoAuthor) {
      // Check for accepted contribution request
      const acceptedRequests = await ctx.db
        .query("contributionRequests")
        .withIndex("by_contributor_status", (q) =>
          q.eq("contributorId", user._id).eq("status", "accepted")
        )
        .collect();

      // Filter to find accepted request for this specific idea
      const validRequest = acceptedRequests.find(request => request.ideaId === todo.ideaId);

      if (!validRequest) {
        throw new Error("You are not authorized to modify todos for this idea.");
      }
      isAcceptedContributor = true;
    }

    // No need to validate status as it's already union-typed

    await ctx.db.patch(todo._id, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return { status: args.status, message: "Todo status updated successfully" };
  },
});

// Delete a todo
export const deleteTodo = mutation({
  args: {
    todoId: v.id("todos"),
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

    // Get the todo
    const todo = await ctx.db.get(args.todoId);
    if (!todo) {
      throw new Error("Todo not found");
    }

    // Check if user is the author of the todo
    if (todo.authorId !== user._id) {
      throw new Error("Not authorized to delete this todo");
    }

    // Delete the todo
    await ctx.db.delete(args.todoId);

    return { message: "Todo deleted successfully" };
  },
});

// Get todos for an idea with authorization check
export const getTodosForIdea = query({
  args: {
    ideaId: v.id("ideas"),
  },
  handler: async (ctx, args) => {
    // Check authentication (optional for viewing, but required for editing)
    const identity = await ctx.auth.getUserIdentity();

    // Check if idea exists and is not deleted
    const idea = await ctx.db.get(args.ideaId);
    if (!idea) {
      return [];
    }

    if (idea.isDeleted) {
      return [];
    }

    let currentUser = null;
    let isAuthor = false;
    let isAcceptedContributor = false;

    if (identity) {
      currentUser = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .unique();

      if (currentUser) {
        isAuthor = idea.authorId === currentUser._id;

        if (!isAuthor) {
          // Check for accepted contribution request
          const acceptedRequests = await ctx.db
            .query("contributionRequests")
            .withIndex("by_contributor_status", (q) =>
              q.eq("contributorId", currentUser!._id).eq("status", "accepted")
            )
            .collect();

          // Filter to find accepted request for this specific idea
          isAcceptedContributor = acceptedRequests.some(request => request.ideaId === args.ideaId);
        }
      }
    }

    // Get todos for the idea
    const todos = await ctx.db
      .query("todos")
      .withIndex("by_idea", (q) => q.eq("ideaId", args.ideaId))
      .order("asc") // Order by creation time (or we could sort by order field)
      .collect();

    // Get author information for each todo and add authorization info
    const todosWithAuthors = await Promise.all(
      todos.map(async (todo) => {
        const author = await ctx.db.get(todo.authorId);
        const assignedUser = todo.assignedTo ? await ctx.db.get(todo.assignedTo) : null;
        return {
          ...todo,
          author: author ? {
            _id: author._id,
            name: author.displayName,
            username: author.username,
            avatar: author.avatar,
          } : null,
          assignedTo: assignedUser ? {
            _id: assignedUser._id,
            name: assignedUser.displayName,
            username: assignedUser.username,
            avatar: assignedUser.avatar,
          } : null,
          canEdit: currentUser
            ? currentUser._id === todo.authorId
            : false,
          canDelete: currentUser
            ? currentUser._id === todo.authorId
            : false,
        };
      })
    );

    return todosWithAuthors;
  },
});

// Get todos grouped by completion status for an idea
export const getTodosGroupedByStatus = query({
  args: {
    ideaId: v.id("ideas"),
  },
  handler: async (ctx, args) => {
    // Check authentication (optional for viewing, but required for editing)
    const identity = await ctx.auth.getUserIdentity();

    // Check if idea exists and is not deleted
    const idea = await ctx.db.get(args.ideaId);
    if (!idea) {
      return { pending: [], completed: [] };
    }

    if (idea.isDeleted) {
      return { pending: [], completed: [] };
    }

    let currentUser = null;
    let isAuthor = false;
    let isAcceptedContributor = false;

    if (identity) {
      currentUser = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .unique();

      if (currentUser) {
        isAuthor = idea.authorId === currentUser._id;

        if (!isAuthor) {
          // Check for accepted contribution request
          const acceptedRequests = await ctx.db
            .query("contributionRequests")
            .withIndex("by_contributor_status", (q) =>
              q.eq("contributorId", currentUser!._id).eq("status", "accepted")
            )
            .collect();

          // Filter to find accepted request for this specific idea
          isAcceptedContributor = acceptedRequests.some(request => request.ideaId === args.ideaId);
        }
      }
    }

    // Get todos for the idea
    const todos = await ctx.db
      .query("todos")
      .withIndex("by_idea", (q) => q.eq("ideaId", args.ideaId))
      .order("asc")
      .collect();

    // Group todos by status
    const todo: any[] = [];
    const in_progress: any[] = [];
    const done: any[] = [];

    for (const todoItem of todos) {
      const author = await ctx.db.get(todoItem.authorId);
      const todoWithAuthor = {
        ...todoItem,
        author: author ? {
          _id: author._id,
          name: author.displayName,
          username: author.username,
          avatar: author.avatar,
        } : null,
        canEdit: currentUser
          ? currentUser._id === todoItem.authorId
          : false,
        canDelete: currentUser
          ? currentUser._id === todoItem.authorId
          : false,
      };

      if (todoItem.status === "todo") {
        todo.push(todoWithAuthor);
      } else if (todoItem.status === "in_progress") {
        in_progress.push(todoWithAuthor);
      } else {
        done.push(todoWithAuthor);
      }
    }

    return {
      todo,
      in_progress,
      done,
    };
  },
});

// Get todos assigned to current user, ordered by deadline
export const getMyAssignedTodos = query({
  handler: async (ctx) => {
    // Check authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // Find user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return [];
    }

    // Get todos assigned to this user
    const assignedTodos = await ctx.db
      .query("todos")
      .withIndex("by_assigned_to", (q) => q.eq("assignedTo", user._id))
      .collect();

    // Get unique idea IDs to fetch ideas
    const ideaIds = [...new Set(assignedTodos.map(todo => todo.ideaId))];
    const ideas = await Promise.all(ideaIds.map(id => ctx.db.get(id)));

    // Create idea map for quick lookup
    const ideaMap = new Map(ideas.filter(Boolean).map(idea => [idea!._id, idea]));

    // Enrich todos with idea and author info, filter out deleted ideas, sort by deadline
    const enrichedTodos = await Promise.all(
      assignedTodos
        .filter(todo => {
          const idea = ideaMap.get(todo.ideaId);
          return idea && !idea.isDeleted && todo.status !== "done";
        })
        .map(async (todo) => {
          const idea = ideaMap.get(todo.ideaId)!;
          const author = await ctx.db.get(todo.authorId);

          return {
            ...todo,
            idea: {
              _id: idea._id,
              title: idea.title,
              authorId: idea.authorId,
            },
            author: author ? {
              _id: author._id,
              name: author.displayName,
              username: author.username,
              avatar: author.avatar,
            } : null,
          };
        })
    );

    // Sort by deadline (null deadlines go to the end)
    return enrichedTodos.sort((a, b) => {
      if (a.deadline && b.deadline) {
        return a.deadline - b.deadline;
      }
      if (a.deadline) return -1;
      if (b.deadline) return 1;
      return 0;
    });
  },
});

// Get todos with past deadlines that are not completed
export const getOverdueTodos = query({
  handler: async (ctx) => {
    // Check authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // Find user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return [];
    }

    const now = Date.now();

    // Get todos with past deadlines that are not done
    const overdueTodos = await ctx.db
      .query("todos")
      .withIndex("by_deadline", (q) => q.lt("deadline", now))
      .collect();

    // Filter to only include non-completed todos
    const nonCompletedOverdueTodos = overdueTodos.filter(todo => todo.status !== "done");

    // Get unique idea IDs
    const ideaIds = [...new Set(nonCompletedOverdueTodos.map(todo => todo.ideaId))];
    const ideas = await Promise.all(ideaIds.map(id => ctx.db.get(id)));

    // Create idea map
    const ideaMap = new Map(ideas.filter(Boolean).map(idea => [idea!._id, idea]));

    // Enrich todos with idea and author info, filter out deleted ideas
    const enrichedTodos = await Promise.all(
      nonCompletedOverdueTodos
        .filter(todo => {
          const idea = ideaMap.get(todo.ideaId);
          return idea && !idea.isDeleted;
        })
        .map(async (todo) => {
          const idea = ideaMap.get(todo.ideaId)!;
          const author = await ctx.db.get(todo.authorId);
          const assignedUser = todo.assignedTo ? await ctx.db.get(todo.assignedTo) : null;

          return {
            ...todo,
            idea: {
              _id: idea._id,
              title: idea.title,
              authorId: idea.authorId,
            },
            author: author ? {
              _id: author._id,
              name: author.displayName,
              username: author.username,
              avatar: author.avatar,
            } : null,
            assignedUser: assignedUser ? {
              _id: assignedUser._id,
              name: assignedUser.displayName,
              username: assignedUser.username,
              avatar: assignedUser.avatar,
            } : null,
          };
        })
    );

    // Sort by how overdue (most overdue first)
    return enrichedTodos.sort((a, b) => {
      if (a.deadline && b.deadline) {
        return a.deadline - b.deadline; // Earlier deadline first
      }
      return 0;
    });
  },
});

// Get todos assigned to a specific user
export const getTodosByAssignee = query({
  args: {
    assigneeId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // Find current user
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser) {
      return [];
    }

    // Verify assignee exists
    const assignee = await ctx.db.get(args.assigneeId);
    if (!assignee) {
      return [];
    }

    // Get todos assigned to the specified user
    const assignedTodos = await ctx.db
      .query("todos")
      .withIndex("by_assigned_to", (q) => q.eq("assignedTo", args.assigneeId))
      .collect();

    // Get unique idea IDs
    const ideaIds = [...new Set(assignedTodos.map(todo => todo.ideaId))];
    const ideas = await Promise.all(ideaIds.map(id => ctx.db.get(id)));

    // Create idea map
    const ideaMap = new Map(ideas.filter(Boolean).map(idea => [idea!._id, idea]));

    // Enrich todos with idea and author info, filter out deleted ideas
    const enrichedTodos = await Promise.all(
      assignedTodos
        .filter(todo => {
          const idea = ideaMap.get(todo.ideaId);
          return idea && !idea.isDeleted;
        })
        .map(async (todo) => {
          const idea = ideaMap.get(todo.ideaId)!;
          const author = await ctx.db.get(todo.authorId);

          return {
            ...todo,
            idea: {
              _id: idea._id,
              title: idea.title,
              authorId: idea.authorId,
            },
            author: author ? {
              _id: author._id,
              name: author.displayName,
              username: author.username,
              avatar: author.avatar,
            } : null,
          };
        })
    );

    // Sort by deadline, then by creation date
    return enrichedTodos.sort((a, b) => {
      if (a.deadline && b.deadline) {
        return a.deadline - b.deadline;
      }
      if (a.deadline) return -1;
      if (b.deadline) return 1;
      return b.createdAt - a.createdAt; // Newest first if no deadline
    });
  },
});

// Get todos with deadlines for calendar (assigned to user)
export const getTodosForCalendar = query({
  handler: async (ctx) => {
    // Check authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // Find user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return [];
    }

    // Get todos with deadlines assigned to current user
    const assignedTodos = await ctx.db
      .query("todos")
      .withIndex("by_assigned_to", (q) => q.eq("assignedTo", user._id))
      .collect();

    // Filter to only include todos with deadlines and not completed
    const todosWithDeadlines = assignedTodos.filter(todo =>
      todo.deadline && todo.status !== "done"
    );

    // Get unique idea IDs
    const ideaIds = [...new Set(todosWithDeadlines.map(todo => todo.ideaId))];
    const ideas = await Promise.all(ideaIds.map(id => ctx.db.get(id)));

    // Create idea map
    const ideaMap = new Map(ideas.filter(Boolean).map(idea => [idea!._id, idea]));

    // Enrich todos with idea info, filter out deleted ideas
    const enrichedTodos = todosWithDeadlines
      .filter(todo => {
        const idea = ideaMap.get(todo.ideaId);
        return idea && !idea.isDeleted;
      })
      .map(todo => {
        const idea = ideaMap.get(todo.ideaId)!;
        return {
          id: todo._id,
          name: todo.title,
          startAt: todo.deadline!,
          endAt: todo.deadline!,
          status: {
            id: todo.status,
            name: todo.status === "todo" ? "Todo" : todo.status === "in_progress" ? "In Progress" : "Done",
            color: todo.status === "done" ? "#28a745" : todo.status === "in_progress" ? "#ffc107" : "#007bff"
          },
          ideaTitle: idea.title
        };
      });

    // Sort by deadline
    return enrichedTodos.sort((a, b) => a.startAt - b.startAt);
  },
});

// Check deadlines and create notifications for approaching/overdue todos
export const checkDeadlinesAndNotify = mutation({
  handler: async (ctx): Promise<{
    message: string;
    approachingCount: number;
    overdueCount: number;
    todosChecked: number;
  }> => {
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

    const now = Date.now();
    const twentyFourHoursFromNow = now + (24 * 60 * 60 * 1000);

    // Get all todos with deadlines that are assigned to current user or where user is idea author
    const todosWithDeadlines = await ctx.db
      .query("todos")
      .withIndex("by_deadline", (q) => q.gte("deadline", now))
      .collect();

    // Filter to only include todos where user is assignee or idea author, and not completed
    const relevantTodos = await Promise.all(
      todosWithDeadlines
        .filter(todo => todo.status !== "done")
        .map(async (todo) => {
          const idea = await ctx.db.get(todo.ideaId);
          if (!idea || idea.isDeleted) return null;

          const isAssignee = todo.assignedTo === user._id;
          const isIdeaAuthor = idea.authorId === user._id;

          if (!isAssignee && !isIdeaAuthor) return null;

          return {
            ...todo,
            idea,
            isAssignee,
            isIdeaAuthor
          };
        })
    );

    const validTodos = relevantTodos.filter(Boolean) as any[];

    // Check for approaching deadlines (< 24 hours) and overdue deadlines
    const approachingDeadlines = validTodos.filter(todo =>
      todo.deadline <= twentyFourHoursFromNow && todo.deadline > now
    );

    const overdueDeadlines = validTodos.filter(todo =>
      todo.deadline <= now
    );

    // Create notifications for approaching deadlines
    const approachingNotifications: any[][] = await Promise.all(
      approachingDeadlines.map(async (todo): Promise<any[]> => {
        const deadline = new Date(todo.deadline).toLocaleString();
        const recipients = [];

        if (todo.isAssignee) {
          recipients.push({
            recipientId: user._id,
            message: `⚠️ Deadline approaching: "${todo.title}" is due on ${deadline}. Please complete this task soon.`,
            type: "deadline_approaching" as const
          });
        }

        if (todo.isIdeaAuthor) {
          recipients.push({
            recipientId: user._id,
            message: `⚠️ Task deadline approaching: "${todo.title}" for your idea "${todo.idea.title}" is due on ${deadline}.`,
            type: "deadline_approaching" as const
          });
        }

        // Create notifications for each recipient
        return Promise.all(
          recipients.map((recipient): Promise<any> =>
            ctx.runMutation(api.notifications.createDeadlineNotification, {
              recipientId: recipient.recipientId,
              senderId: user._id, // System notification from self
              todoId: todo._id,
              type: recipient.type,
              message: recipient.message
            })
          )
        );
      })
    );

    // Create notifications for overdue deadlines
    const overdueNotifications: any[][] = await Promise.all(
      overdueDeadlines.map(async (todo): Promise<any[]> => {
        const deadline = new Date(todo.deadline).toLocaleString();
        const recipients = [];

        if (todo.isAssignee) {
          recipients.push({
            recipientId: user._id,
            message: `🚨 Deadline overdue: "${todo.title}" was due on ${deadline}. Please complete this task immediately.`,
            type: "deadline_overdue" as const
          });
        }

        if (todo.isIdeaAuthor) {
          recipients.push({
            recipientId: user._id,
            message: `🚨 Task deadline overdue: "${todo.title}" for your idea "${todo.idea.title}" was due on ${deadline}.`,
            type: "deadline_overdue" as const
          });
        }

        // Create notifications for each recipient
        return Promise.all(
          recipients.map((recipient): Promise<any> =>
            ctx.runMutation(api.notifications.createDeadlineNotification, {
              recipientId: recipient.recipientId,
              senderId: user._id, // System notification from self
              todoId: todo._id,
              type: recipient.type,
              message: recipient.message
            })
          )
        );
      })
    );

    const totalApproachingNotifications: number = approachingNotifications.flat().length;
    const totalOverdueNotifications: number = overdueNotifications.flat().length;

    return {
      message: "Deadline notifications checked and created",
      approachingCount: totalApproachingNotifications,
      overdueCount: totalOverdueNotifications,
      todosChecked: validTodos.length
    };
  },
});