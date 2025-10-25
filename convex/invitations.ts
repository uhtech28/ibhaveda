import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Send invitation to user by username
export const sendInvitation = mutation({
  args: {
    ideaId: v.id("ideas"),
    username: v.string(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      // Get authenticated user from Clerk
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        throw new Error("Authentication required: Please sign in to continue");
      }

      // Find inviter user by Clerk ID
      const inviter = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .unique();

      if (!inviter) {
        console.error("User lookup failed for Clerk ID:", identity.subject);
        throw new Error("User profile not found: Please complete your profile setup");
      }

      // Check if idea exists and get author
      const idea = await ctx.db.get(args.ideaId);
      if (!idea) {
        console.error("Idea lookup failed for ID:", args.ideaId);
        throw new Error("Idea not found or has been removed");
      }

      // Check if idea is deleted
      if (idea.isDeleted) {
        console.error("Attempt to send invitation for deleted idea:", args.ideaId);
        throw new Error("Cannot send invitation for a deleted idea");
      }

      // Check if idea is a root idea (no parent)
      if (idea.parentId) {
        console.error("Attempt to send invitation for sub-idea:", args.ideaId);
        throw new Error("Invitations can only be sent for root ideas, not sub-ideas");
      }

      // Only author can send invitations
      if (inviter._id !== idea.authorId) {
        throw new Error("Only the idea author can send invitations");
      }

      // Find invitee by username
      const invitee = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", args.username))
        .unique();

      if (!invitee) {
        throw new Error("User not found with that username");
      }

      // Prevent self-invitations
      if (invitee._id === inviter._id) {
        throw new Error("You cannot invite yourself to contribute");
      }

      // Validate message
      if (args.message && args.message.length > 1200) {
        throw new Error("Message must be 1200 characters or less");
      }

      const now = Date.now();

      // Check for existing invitation to prevent duplicates
      const existingInvitation = await ctx.db
        .query("invitations")
        .withIndex("by_invitee_status", (q) =>
          q.eq("inviteeId", invitee._id).eq("status", "pending")
        )
        .collect()
        .then(invitations =>
          invitations.find(inv => inv.ideaId === args.ideaId)
        );

      if (existingInvitation) {
        throw new Error("An invitation is already pending for this user on this idea");
      }

      // Check for existing active contribution request to prevent duplicates
      const existingRequest = await ctx.db
        .query("contributionRequests")
        .withIndex("by_idea_contributor", (q) =>
          q.eq("ideaId", args.ideaId).eq("contributorId", invitee._id)
        )
        .unique();

      if (existingRequest && (existingRequest.status === "pending" || existingRequest.status === "accepted")) {
        throw new Error("A contribution request already exists for this user on this idea");
      }

      // Create the invitation
      const invitationId = await ctx.db.insert("invitations", {
        ideaId: args.ideaId,
        inviterId: inviter._id,
        inviteeId: invitee._id,
        status: "pending",
        message: args.message?.trim(),
        createdAt: now,
        updatedAt: now,
      });

      console.log("Created invitation:", invitationId, "by user:", inviter.username, "to user:", invitee.username, "for idea:", args.ideaId);

      // Create notification for the invitee
       await ctx.db.insert("notifications", {
         recipientId: invitee._id,
         senderId: inviter._id,
         type: "invitation_received",
         message: `${inviter.displayName} invited you to contribute to "${idea.title}"`,
         relatedId: args.ideaId,
         isRead: false,
         createdAt: now,
       });

      return { invitationId, message: "Invitation sent successfully" };
    } catch (error) {
      console.error("Error in sendInvitation:", error);
      throw error; // Re-throw to maintain original error messages
    }
  },
});

// Get all invitations for an idea (for the author)
export const getInvitationsForIdea = query({
  args: {
    ideaId: v.id("ideas"),
  },
  handler: async (ctx, args) => {
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        throw new Error("Authentication required: Please sign in to access invitations");
      }

      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .unique();

      if (!user) {
        console.log("User profile not found for Clerk ID:", identity.subject, "- returning empty array");
        return []; // Return empty array for users without profile
      }

      // Check if idea exists and is not deleted
      const idea = await ctx.db.get(args.ideaId);
      if (!idea) {
        console.log("Idea lookup failed for ID:", args.ideaId, "by user:", user.username);
        throw new Error("Idea not found or has been removed");
      }

      if (idea.isDeleted) {
        console.log("Attempt to view invitations for deleted idea:", args.ideaId, "by user:", user.username);
        return []; // Return empty array for deleted ideas
      }

      // Check if user is the author - return empty for unauthorized
      if (idea.authorId !== user._id) {
        return [];
      }

      const invitations = await ctx.db
        .query("invitations")
        .withIndex("by_idea", (q) => q.eq("ideaId", args.ideaId))
        .order("desc")
        .take(50);

      // Get inviter and invitee information for each invitation with error handling
      const invitationsWithUsers = await Promise.all(
        invitations.map(async (invitation) => {
          try {
            const inviter = await ctx.db.get(invitation.inviterId);
            const invitee = await ctx.db.get(invitation.inviteeId);
            return {
              ...invitation,
              inviter: inviter ? {
                name: inviter.displayName,
                username: inviter.username,
              } : null,
              invitee: invitee ? {
                name: invitee.displayName,
                username: invitee.username,
              } : null,
            };
          } catch (error) {
            console.error("Error fetching user data for invitation:", invitation._id, error);
            return {
              ...invitation,
              inviter: null,
              invitee: null,
            };
          }
        })
      );

      return invitationsWithUsers;
    } catch (error) {
      console.error("Error in getInvitationsForIdea:", error);
      throw error;
    }
  },
});

// Cancel a pending invitation (by inviter)
export const cancelInvitation = mutation({
  args: {
    invitationId: v.id("invitations"),
  },
  handler: async (ctx, args) => {
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        throw new Error("Authentication required: Please sign in to continue");
      }

      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .unique();

      if (!user) {
        console.error("User lookup failed for Clerk ID:", identity.subject);
        throw new Error("User profile not found: Please complete your profile setup");
      }

      const invitation = await ctx.db.get(args.invitationId);
      if (!invitation) {
        console.error("Invitation lookup failed for ID:", args.invitationId);
        throw new Error("Invitation not found");
      }

      // Only inviter can cancel
      if (invitation.inviterId !== user._id) {
        throw new Error("Not authorized to cancel this invitation");
      }

      // Only pending invitations can be cancelled
      if (invitation.status !== "pending") {
        throw new Error(`Cannot cancel an invitation that is ${invitation.status}`);
      }

      console.log("Cancelling invitation:", args.invitationId, "by user:", user.username);

      await ctx.db.patch(args.invitationId, {
        status: "cancelled",
        updatedAt: Date.now(),
      });

      return { message: "Invitation cancelled successfully" };
    } catch (error) {
      console.error("Error in cancelInvitation:", error);
      throw error;
    }
  },
});

// Accept invitation (converts to contribution request)
export const acceptInvitation = mutation({
  args: {
    invitationId: v.id("invitations"),
  },
  handler: async (ctx, args) => {
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        throw new Error("Authentication required: Please sign in to continue");
      }

      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .unique();

      if (!user) {
        console.error("User lookup failed for Clerk ID:", identity.subject);
        throw new Error("User profile not found: Please complete your profile setup");
      }

      const invitation = await ctx.db.get(args.invitationId);
      if (!invitation) {
        console.error("Invitation lookup failed for ID:", args.invitationId);
        throw new Error("Invitation not found");
      }

      // Only invitee can accept
      if (invitation.inviteeId !== user._id) {
        throw new Error("Not authorized to accept this invitation");
      }

      // Only pending invitations can be accepted
      if (invitation.status !== "pending") {
        throw new Error(`Cannot accept an invitation that is ${invitation.status}`);
      }

      const now = Date.now();

      console.log("Accepting invitation:", args.invitationId, "by user:", user.username);

      // Update invitation status
      await ctx.db.patch(args.invitationId, {
        status: "accepted",
        updatedAt: now,
      });

      // Create contribution request with accepted status (skip author approval)
      const requestId = await ctx.db.insert("contributionRequests", {
        ideaId: invitation.ideaId,
        contributorId: user._id,
        authorId: invitation.inviterId,
        message: invitation.message?.trim() || "Invitation accepted - ready to contribute!",
        status: "accepted", // Direct acceptance for invitations
        createdAt: now,
        updatedAt: now,
      });

      console.log("Created accepted contribution request:", requestId, "from accepted invitation:", args.invitationId);

      // Get idea title for notification
      const idea = await ctx.db.get(invitation.ideaId);
      const ideaTitle = idea ? idea.title : "the idea";

      // Create notification for the invitee (invitation accepted confirmation)
       await ctx.db.insert("notifications", {
         recipientId: user._id,
         senderId: invitation.inviterId,
         type: "contribution_request_accepted",
         message: `You are now a contributor to "${ideaTitle}"`,
         relatedId: invitation.ideaId,
         isRead: false,
         createdAt: now,
       });

      // Note: Contributor count increment is handled elsewhere (e.g., when request status changes)

      // Create notification for the inviter
       await ctx.db.insert("notifications", {
         recipientId: invitation.inviterId,
         senderId: user._id,
         type: "invitation_accepted",
         message: `${user.displayName} accepted your invitation to contribute`,
         relatedId: invitation.ideaId,
         isRead: false,
         createdAt: now,
       });

      return { message: "Invitation accepted successfully" };
    } catch (error) {
      console.error("Error in acceptInvitation:", error);
      throw error;
    }
  },
});

// Reject invitation
export const rejectInvitation = mutation({
  args: {
    invitationId: v.id("invitations"),
  },
  handler: async (ctx, args) => {
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        throw new Error("Authentication required: Please sign in to continue");
      }

      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .unique();

      if (!user) {
        console.error("User lookup failed for Clerk ID:", identity.subject);
        throw new Error("User profile not found: Please complete your profile setup");
      }

      const invitation = await ctx.db.get(args.invitationId);
      if (!invitation) {
        console.error("Invitation lookup failed for ID:", args.invitationId);
        throw new Error("Invitation not found");
      }

      // Only invitee can reject
      if (invitation.inviteeId !== user._id) {
        throw new Error("Not authorized to reject this invitation");
      }

      // Only pending invitations can be rejected
      if (invitation.status !== "pending") {
        throw new Error(`Cannot reject an invitation that is ${invitation.status}`);
      }

      const now = Date.now();

      console.log("Rejecting invitation:", args.invitationId, "by user:", user.username);

      // Update invitation status
      await ctx.db.patch(args.invitationId, {
        status: "rejected",
        updatedAt: now,
      });

      // Create notification for the inviter
       await ctx.db.insert("notifications", {
         recipientId: invitation.inviterId,
         senderId: user._id,
         type: "invitation_rejected",
         message: `${user.displayName} declined your invitation to contribute`,
         relatedId: invitation.ideaId,
         isRead: false,
         createdAt: now,
       });

      return { message: "Invitation rejected successfully" };
    } catch (error) {
      console.error("Error in rejectInvitation:", error);
      throw error;
    }
  },
});

// Get invitations received by current user
export const getMyInvitations = query({
  handler: async (ctx) => {
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        throw new Error("Authentication required: Please sign in to access your invitations");
      }

      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .unique();

      if (!user) {
        console.log("User profile not found for Clerk ID:", identity.subject, "- returning empty array");
        return [];
      }

      const invitations = await ctx.db
        .query("invitations")
        .withIndex("by_invitee_status", (q) =>
          q.eq("inviteeId", user._id).eq("status", "pending")
        )
        .order("desc")
        .take(50);

      // Get inviter and idea info with error handling
      const invitationsWithInfo = await Promise.all(
        invitations.map(async (invitation) => {
          try {
            const inviter = await ctx.db.get(invitation.inviterId);
            const idea = await ctx.db.get(invitation.ideaId);

            // Only return idea info if it's not deleted
            let ideaInfo = null;
            if (idea && !idea.isDeleted) {
              ideaInfo = {
                title: idea.title,
                _id: idea._id,
              };
            }

            return {
              ...invitation,
              idea: ideaInfo,
              inviter: inviter ? {
                displayName: inviter.displayName,
                username: inviter.username,
              } : null,
            };
          } catch (error) {
            console.error("Error fetching data for invitation:", invitation._id, error);
            return {
              ...invitation,
              idea: null,
              inviter: null,
            };
          }
        })
      );

      return invitationsWithInfo;
    } catch (error) {
      console.error("Error in getMyInvitations:", error);
      throw error;
    }
  },
});

// Get invitations by inviter and invitee (for checking existing invitations)
export const getInvitationsByInviterAndInvitee = query({
  args: {
    inviterId: v.id("users"),
    inviteeId: v.id("users"),
  },
  handler: async (ctx, args) => {
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        throw new Error("Authentication required: Please sign in to continue");
      }

      const currentUser = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .unique();

      if (!currentUser) {
        console.log("User profile not found for Clerk ID:", identity.subject, "- returning empty array");
        return [];
      }

      // Only allow users to see their own invitations
      if (currentUser._id !== args.inviterId) {
        return [];
      }

      const invitations = await ctx.db
        .query("invitations")
        .withIndex("by_inviter", (q) => q.eq("inviterId", args.inviterId))
        .filter((q) => q.eq(q.field("inviteeId"), args.inviteeId))
        .collect();

      return invitations;
    } catch (error) {
      console.error("Error in getInvitationsByInviterAndInvitee:", error);
      throw error;
    }
  },
});
export const getInvitationById = query({
  args: { invitationId: v.id("invitations") },
  handler: async (ctx, args) => {
    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) return null;

    // Get users with error handling
    let inviter = null, invitee = null, idea = null;
    try { inviter = await ctx.db.get(invitation.inviterId); } catch {}
    try { invitee = await ctx.db.get(invitation.inviteeId); } catch {}
    try { idea = await ctx.db.get(invitation.ideaId); } catch {}

    return {
      ...invitation,
      inviter: inviter ? { displayName: inviter.displayName, username: inviter.username } : null,
      invitee: invitee ? { displayName: invitee.displayName, username: invitee.username } : null,
      idea: idea ? { title: idea.title, _id: idea._id, isDeleted: idea.isDeleted } : null,
    };
  },
});