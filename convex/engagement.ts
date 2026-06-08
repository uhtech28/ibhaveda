/**
 * Engagement queries — hydrated lists for the "who sparked this" and
 * "who's contributing" popups.
 *
 * The underlying data (sparks in `userIdeaSparks`, contributions in
 * `contributionRequests`) already exists. This module is a thin read
 * layer that joins those rows against `users` so the dialogs render
 * with one round-trip instead of N+1 user lookups on the client.
 *
 * Both queries respect idea privacy: private ideas refuse to expose
 * their engagement to anyone outside the author + accepted contributors.
 */

import { v } from "convex/values";
import { query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

interface UserLite {
  _id: Id<"users">;
  displayName: string;
  username: string | null;
  avatar: string | null;
}

export interface SparkerEntry {
  user: UserLite;
  sparkedAt: number;
}

export interface ContributorEntry {
  user: UserLite;
  role: "author" | "contributor";
  /** Timestamp of acceptance for contributors, or idea creation for the author. */
  joinedAt: number;
}

// ─────────────────────────────────────────────────────────────────────
// Sparkers
// ─────────────────────────────────────────────────────────────────────

/**
 * People who sparked a given idea, newest first.
 *
 * Returns an empty list (not an error) when the idea is private and
 * the viewer doesn't have access — the UI doesn't reveal that
 * sparks exist on a private idea they can't see.
 */
export const getIdeaSparkers = query({
  args: {
    ideaId: v.id("ideas"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { ideaId, limit }): Promise<SparkerEntry[]> => {
    const idea = await ctx.db.get(ideaId);
    if (!idea) return [];

    if (!(await canViewEngagement(ctx, idea))) return [];

    const rows = await ctx.db
      .query("userIdeaSparks")
      .withIndex("by_idea", (q) => q.eq("ideaId", ideaId))
      .order("desc")
      .take(limit ?? 100);

    const entries = await Promise.all(
      rows.map(async (r) => ({
        user: await userLite(ctx, r.userId),
        sparkedAt: r.createdAt,
      })),
    );

    // Filter rows where the user no longer exists (rare; defensive).
    return entries.filter((e): e is SparkerEntry => e.user !== null);
  },
});

// ─────────────────────────────────────────────────────────────────────
// Contributors
// ─────────────────────────────────────────────────────────────────────

/**
 * Team on an idea — the author plus every accepted contributor.
 * Author is always first; contributors are ordered by acceptance time.
 *
 * Returns an empty list when the viewer can't see the idea.
 */
export const getIdeaContributors = query({
  args: { ideaId: v.id("ideas") },
  handler: async (ctx, { ideaId }): Promise<ContributorEntry[]> => {
    const idea = await ctx.db.get(ideaId);
    if (!idea) return [];

    if (!(await canViewEngagement(ctx, idea))) return [];

    const author = await userLite(ctx, idea.authorId);
    if (!author) return [];

    const accepted = await ctx.db
      .query("contributionRequests")
      .withIndex("by_idea_status_created", (q) =>
        q.eq("ideaId", ideaId).eq("status", "accepted"),
      )
      .collect();

    const contributorEntries = await Promise.all(
      accepted.map(async (req) => {
        const user = await userLite(ctx, req.contributorId);
        if (!user) return null;
        return {
          user,
          role: "contributor" as const,
          joinedAt: req.updatedAt,
        };
      }),
    );

    const team: ContributorEntry[] = [
      {
        user: author,
        role: "author",
        joinedAt: (idea as { createdAt?: number; _creationTime: number })
          .createdAt ?? idea._creationTime,
      },
      ...contributorEntries.filter(
        (e): e is NonNullable<typeof e> => e !== null,
      ),
    ];

    return team;
  },
});

// ─────────────────────────────────────────────────────────────────────
// Privacy gate
// ─────────────────────────────────────────────────────────────────────

/**
 * The engagement list of a public idea is visible to everyone. For
 * private ideas, only the author and accepted contributors can see it.
 */
async function canViewEngagement(
  ctx: any,
  idea: Doc<"ideas">,
): Promise<boolean> {
  const visibility = (idea as { visibility?: string }).visibility ?? "public";
  if (visibility === "public") return true;

  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return false;
  const viewer = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q: any) =>
      q.eq("clerkId", identity.subject),
    )
    .first();
  if (!viewer) return false;

  if (idea.authorId === viewer._id) return true;

  const accepted = await ctx.db
    .query("contributionRequests")
    .withIndex("by_idea_contributor", (q: any) =>
      q.eq("ideaId", idea._id).eq("contributorId", viewer._id),
    )
    .first();

  return accepted?.status === "accepted";
}

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

async function userLite(
  ctx: any,
  userId: Id<"users">,
): Promise<UserLite | null> {
  const u = await ctx.db.get(userId);
  if (!u) return null;
  return {
    _id: u._id,
    displayName: u.displayName ?? "Anonymous",
    username: u.username ?? null,
    avatar: u.avatar ?? null,
  };
}
