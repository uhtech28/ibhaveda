// Counts the FeedTutorial uses to detect when a user has performed
// the real action behind an action-gated step (PRD §6 AC2).

import { query, type QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

export const getMySparkCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await maybeUser(ctx);
    if (!user) return 0;
    const rows = await ctx.db
      .query("userIdeaSparks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    return rows.length;
  },
});

export const getMyCommentCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await maybeUser(ctx);
    if (!user) return 0;
    const rows = await ctx.db
      .query("comments")
      .withIndex("by_author", (q) => q.eq("authorId", user._id))
      .collect();
    return rows.length;
  },
});

async function maybeUser(ctx: QueryCtx): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .first();
}
