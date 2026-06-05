import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

export const createContributionRequest = mutation({
  args: {
    ideaId: v.id("ideas"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) throw new Error("Authentication required: Please sign in to continue");

      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .unique();
      if (!user) {
        console.error("User lookup failed for Clerk ID:", identity.subject);
        throw new Error("User profile not found: Please complete your profile setup");
      }

      const idea = await ctx.db.get(args.ideaId);
      if (!idea) {
        console.error("Idea lookup failed for ID:", args.ideaId);
        throw new Error("Idea not found or has been removed");
      }
      if (idea.isDeleted) {
        throw new Error("Cannot create contribution request for a deleted idea");
      }
      if (user._id === idea.authorId) {
        throw new Error("You cannot request contribution to your own idea");
      }
      if (!args.message?.trim()) throw new Error("Message is required");
      if (args.message.length > 1200) throw new Error("Message must be 1200 characters or less");

      const now = Date.now();

      const existingRequest = await ctx.db
        .query("contributionRequests")
        .withIndex("by_idea_contributor", (q) =>
          q.eq("ideaId", args.ideaId).eq("contributorId", user._id)
        )
        .unique();
      if (existingRequest) {
        throw new Error("You've already sent a contribution request for this idea");
      }

      const existingInvitation = await ctx.db
        .query("invitations")
        .withIndex("by_invitee_status", (q) =>
          q.eq("inviteeId", user._id).eq("status", "pending")
        )
        .collect()
        .then((invitations) => invitations.find((inv) => inv.ideaId === args.ideaId));
      if (existingInvitation) {
        throw new Error("An invitation is already pending for you on this idea");
      }

      const requestId = await ctx.db.insert("contributionRequests", {
        ideaId: args.ideaId,
        contributorId: user._id,
        authorId: idea.authorId,
        message: args.message.trim(),
        status: "pending",
        createdAt: now,
        updatedAt: now,
      });

      await ctx.db.patch(idea._id, {
        contributionRequestCount: (idea.contributionRequestCount || 0) + 1,
        updatedAt: now,
      });

      // BUG FIX: relatedId is now the IDEA id (was the request id) so
      // clicking the notification reliably drills into the idea page.
      if (idea.authorId !== user._id) {
        await ctx.db.insert("notifications", {
          recipientId: idea.authorId,
          senderId: user._id,
          type: "contribution_request_received",
          message: `${user.displayName} requested to contribute to your idea "${idea.title}"`,
          relatedId: args.ideaId,
          isRead: false,
          createdAt: now,
        });
      }

      await ctx.scheduler.runAfter(0, internal.gamification.internalAwardXP, {
        userId: user._id,
        amount: 1,
        action: "contribution_request_sent",
      });
      await ctx.scheduler.runAfter(0, internal.gamification.internalAwardPoints, {
        userId: user._id,
        amount: 1,
        type: "contribution_request_sent",
        description: "Sent contribution request",
      });

      const pointsForAuthor = idea.visibility === "public" ? 3 : 1;
      await ctx.scheduler.runAfter(0, internal.gamification.internalAwardXP, {
        userId: idea.authorId,
        amount: pointsForAuthor,
        action: "contribution_request_received",
      });
      await ctx.scheduler.runAfter(0, internal.gamification.internalAwardPoints, {
        userId: idea.authorId,
        amount: pointsForAuthor,
        type: "contribution_request_received",
        description: `Received contribution request on ${idea.visibility} idea`,
      });

      return { requestId, message: "Contribution request created successfully" };
    } catch (error) {
      console.error("Error in createContributionRequest:", error);
      throw error;
    }
  },
});

export const getRequestsByIdea = query({
  args: { ideaId: v.id("ideas") },
  handler: async (ctx, args) => {
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) throw new Error("Authentication required: Please sign in to access requests");

      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .unique();
      if (!user) return [];

      const idea = await ctx.db.get(args.ideaId);
      if (!idea) throw new Error("Idea not found or has been removed");
      if (idea.isDeleted) return [];
      if (idea.authorId !== user._id) return [];

      const requests = await ctx.db
        .query("contributionRequests")
        .withIndex("by_idea_status_created", (q) => q.eq("ideaId", args.ideaId))
        .order("desc")
        .take(50);

      const requestsWithUsers = await Promise.all(
        requests.map(async (request) => {
          try {
            const contributor = await ctx.db.get(request.contributorId);
            const author = await ctx.db.get(request.authorId);
            return {
              ...request,
              contributor: contributor
                ? { name: contributor.displayName, username: contributor.username }
                : null,
              author: author
                ? { name: author.displayName, username: author.username }
                : null,
            };
          } catch (error) {
            console.error("Error fetching user data for request:", request._id, error);
            return { ...request, contributor: null, author: null };
          }
        })
      );
      return requestsWithUsers;
    } catch (error) {
      console.error("Error in getRequestsByIdea:", error);
      throw error;
    }
  },
});

export const getMyRequests = query({
  handler: async (ctx) => {
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) return [];

      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .unique();
      if (!user) return [];

      const requests = await ctx.db
        .query("contributionRequests")
        .withIndex("by_contributor_status", (q) => q.eq("contributorId", user._id))
        .order("desc")
        .take(50);

      const requestsWithInfo = await Promise.all(
        requests.map(async (request) => {
          try {
            const idea = await ctx.db.get(request.ideaId);
            const author = await ctx.db.get(request.authorId);
            let ideaInfo = null;
            if (idea && (!idea.isDeleted || (user && user._id === idea.authorId))) {
              ideaInfo = {
                title: idea.title,
                _id: idea._id,
                isDeleted: idea.isDeleted,
              };
            }
            return {
              ...request,
              idea: ideaInfo,
              author: author
                ? { displayName: author.displayName, username: author.username }
                : null,
            };
          } catch (error) {
            console.error("Error fetching data for request:", request._id, error);
            return { ...request, idea: null, author: null };
          }
        })
      );
      return requestsWithInfo;
    } catch (error) {
      console.error("Error in getMyRequests:", error);
      throw error;
    }
  },
});

export const getIncomingRequests = query({
  handler: async (ctx) => {
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) throw new Error("Authentication required");

      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .unique();
      if (!user) return [];

      const requests = await ctx.db
        .query("contributionRequests")
        .withIndex("by_author_created", (q) => q.eq("authorId", user._id))
        .order("desc")
        .take(50);

      const requestsWithInfo = await Promise.all(
        requests.map(async (request) => {
          try {
            const idea = await ctx.db.get(request.ideaId);
            const contributor = await ctx.db.get(request.contributorId);
            let ideaInfo = null;
            if (idea && (!idea.isDeleted || (user && user._id === idea.authorId))) {
              ideaInfo = {
                title: idea.title,
                description: idea.description,
                _id: idea._id,
                isDeleted: idea.isDeleted,
                isAuthor: true,
              };
            }
            return {
              ...request,
              idea: ideaInfo,
              contributor: contributor
                ? {
                    avatar: contributor.avatar,
                    displayName: contributor.displayName,
                    username: contributor.username,
                  }
                : null,
            };
          } catch (error) {
            console.error("Error fetching data for request:", request._id, error);
            return { ...request, idea: null, contributor: null };
          }
        })
      );
      return requestsWithInfo;
    } catch (error) {
      console.error("Error in getIncomingRequests:", error);
      throw error;
    }
  },
});

export const updateRequestStatus = mutation({
  args: {
    requestId: v.id("contributionRequests"),
    status: v.union(v.literal("accepted"), v.literal("rejected")),
  },
  handler: async (ctx, args) => {
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) throw new Error("Authentication required");

      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .unique();
      if (!user) throw new Error("User profile not found");

      const request = await ctx.db.get(args.requestId);
      if (!request) throw new Error("Request not found or has been removed");
      if (request.authorId !== user._id) throw new Error("Not authorized to update this request");
      if (request.status !== "pending") {
        throw new Error(`Cannot ${args.status} a request that is already ${request.status}`);
      }

      await ctx.db.patch(args.requestId, { status: args.status, updatedAt: Date.now() });

      // Keep denormalized contributionRequestCount in sync
      const ideaForCount = await ctx.db.get(request.ideaId);
      if (ideaForCount) {
        const current = ideaForCount.contributionRequestCount ?? 0;
        if (args.status === "accepted") {
          await ctx.db.patch(request.ideaId, { contributionRequestCount: current + 1 });
        } else if (args.status === "rejected" && current > 0) {
          await ctx.db.patch(request.ideaId, { contributionRequestCount: current - 1 });
        }
      }

      const updatedRequest = await ctx.db.get(args.requestId);
      if (updatedRequest?.status !== args.status) {
        throw new Error("Request status update failed due to concurrent modification");
      }

      await ctx.db.insert("notifications", {
        recipientId: request.contributorId,
        senderId: user._id,
        type: args.status === "accepted" ? "contribution_request_accepted" : "contribution_request_rejected",
        message:
          args.status === "accepted"
            ? `${user.displayName} accepted your contribution request`
            : `${user.displayName} declined your contribution request`,
        relatedId: request.ideaId,
        isRead: false,
        createdAt: Date.now(),
      });

      const idea = await ctx.db.get(request.ideaId);
      if (idea) {
        const isPublic = idea.visibility === "public";
        if (args.status === "accepted") {
          const authorPoints = isPublic ? 4 : 2;
          await ctx.scheduler.runAfter(0, internal.gamification.internalAwardXP, {
            userId: user._id,
            amount: authorPoints,
            action: "request_accepted_author",
          });
          await ctx.scheduler.runAfter(0, internal.gamification.internalAwardPoints, {
            userId: user._id,
            amount: authorPoints,
            type: "request_accepted",
            description: "Accepted contribution request",
          });
          const contributorPoints = isPublic ? 10 : 5;
          await ctx.scheduler.runAfter(0, internal.gamification.internalAwardXP, {
            userId: request.contributorId,
            amount: contributorPoints,
            action: "request_accepted_contributor",
          });
          await ctx.scheduler.runAfter(0, internal.gamification.internalAwardPoints, {
            userId: request.contributorId,
            amount: contributorPoints,
            type: "contribution_accepted",
            description: "Contribution request accepted",
          });
          await ctx.scheduler.runAfter(0, internal.badges.checkBadges, {
            userId: user._id,
            trigger: "accept_contribution",
          });
          if (idea.category) {
            const skills = idea.category.split(",").map((s) => s.trim()).filter((s) => s);
            for (const skill of skills) {
              await ctx.scheduler.runAfter(0, internal.skillBadges.incrementSkillProgress, {
                userId: request.contributorId,
                ideaId: idea._id,
                skill,
                type: "contribution",
              });
            }
          }

          // PRD §9.2 — "Makes a contribution to a project" advances
          // the contributor's streak. Credit lands the moment the
          // contribution becomes real (the request is accepted), not
          // when it was first sent. Per §9 edge-case "backfilled or
          // queued action that resolves on a later day: streak credits
          // the day the action actually completed."
          try {
            await ctx.scheduler.runAfter(0, internal.streaks.recordAction, {
              userId: request.contributorId,
              actionType: "made_contribution",
            });
          } catch { /* streak failure must never block primary mutation */ }

          // PRD §4 — project-lane points feed the Team league board's
          // trailing-7-day total. Same `contributorPoints` figure used
          // above for individual XP so the two boards stay in sync.
          try {
            await ctx.scheduler.runAfter(
              0,
              internal.teamLeagues.bumpProjectWeeklyPoints,
              {
                ideaId: idea._id,
                contributorId: request.contributorId,
                amount: contributorPoints,
                reason: "Contribution accepted",
              },
            );
          } catch { /* team-points failure must never block primary mutation */ }
        } else if (args.status === "rejected") {
          const authorPoints = isPublic ? 1 : 0;
          if (authorPoints > 0) {
            await ctx.scheduler.runAfter(0, internal.gamification.internalAwardXP, {
              userId: user._id,
              amount: authorPoints,
              action: "request_rejected_author",
            });
            await ctx.scheduler.runAfter(0, internal.gamification.internalAwardPoints, {
              userId: user._id,
              amount: authorPoints,
              type: "request_rejected",
              description: "Rejected contribution request",
            });
          }
        }
      }

      return { message: "Request status updated successfully" };
    } catch (error) {
      console.error("Error in updateRequestStatus:", error);
      throw error;
    }
  },
});

export const getAcceptedContributors = query({
  args: { ideaId: v.id("ideas") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const requests = await ctx.db
      .query("contributionRequests")
      .withIndex("by_idea_status_created", (q) =>
        q.eq("ideaId", args.ideaId).eq("status", "accepted")
      )
      .collect();

    const contributorsWithUsers = await Promise.all(
      requests.map(async (req) => {
        const user = await ctx.db.get(req.contributorId);
        if (!user) return null;

        // Programmatic online status if user had login activity in last 5 minutes
        const isOnline = user.lastLoginAt ? (Date.now() - user.lastLoginAt < 5 * 60 * 1000) : false;

        return {
          requestId: req._id,
          userId: user._id,
          displayName: user.displayName,
          username: user.username,
          avatar: user.avatar || `https://api.dicebear.com/7.x/adventurer/png?seed=${user.username}&size=128&backgroundColor=transparent`,
          personaGender: user.personaGender || "male",
          role: user.role || "contributor",
          level: user.level || 1,
          xp: user.xp || 0,
          isOnline,
          createdAt: req.createdAt,
        };
      })
    );

    return contributorsWithUsers.filter((c) => c !== null);
  },
});

// ONE-SHOT MIGRATION — fix existing "contribution_request_received"
// notifications whose `relatedId` points at the request row instead of
// the idea. Safe to re-run.
export const repairReceivedNotificationLinks = mutation({
  args: {},
  handler: async (ctx) => {
    const notifs = await ctx.db
      .query("notifications")
      .filter((q) => q.eq(q.field("type"), "contribution_request_received"))
      .collect();

    let scanned = 0;
    let repaired = 0;
    let skipped = 0;
    let unresolvable = 0;

    for (const n of notifs) {
      scanned += 1;
      if (!n.relatedId) {
        unresolvable += 1;
        continue;
      }

      const asIdea = await ctx.db.get(n.relatedId as unknown as Id<"ideas">);
      if (asIdea && (asIdea as any).title !== undefined) {
        skipped += 1;
        continue;
      }

      const asRequest = await ctx.db.get(
        n.relatedId as unknown as Id<"contributionRequests">
      );
      if (asRequest && (asRequest as any).ideaId) {
        await ctx.db.patch(n._id, { relatedId: (asRequest as any).ideaId });
        repaired += 1;
      } else {
        unresolvable += 1;
      }
    }

    return { scanned, repaired, skipped, unresolvable };
  },
});

// ─────────────────────────────────────────────────────────────────────
// PRD §10.3 edge case — cascade-remove from channels
// ─────────────────────────────────────────────────────────────────────

/**
 * When a contributor is removed from a project, drop their channel
 * membership from every conversation owned by that project.
 *
 * No public mutation removes an accepted contributor today, so this
 * helper is unreferenced at deploy time. It exists so the future
 * removal endpoint can call it without re-implementing the cascade:
 *
 *   await ctx.runMutation(
 *     internal.contributionRequests.cascadeRemoveFromProjectChannels,
 *     { ideaId, userId },
 *   );
 *
 * Safe to call when the user has no channel memberships (no-op).
 * Idempotent.
 */
export const cascadeRemoveFromProjectChannels = internalMutation({
  args: {
    ideaId: v.id("ideas"),
    userId: v.id("users"),
  },
  handler: async (ctx, { ideaId, userId }) => {
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_idea", (q) => q.eq("ideaId", ideaId))
      .collect();

    let removed = 0;
    for (const conv of conversations) {
      const membership = await ctx.db
        .query("conversationMembers")
        .withIndex("by_user_conversation", (q) =>
          q.eq("userId", userId).eq("conversationId", conv._id),
        )
        .first();
      if (membership) {
        await ctx.db.delete(membership._id);
        removed += 1;
      }
    }
    return { removed, scannedConversations: conversations.length };
  },
});