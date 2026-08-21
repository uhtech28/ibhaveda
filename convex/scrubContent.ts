// One-off remediation: strip any HTML/tags already stored in user-supplied
// free-text fields (from before write-time sanitization existed). Idempotent —
// safe to run more than once; only patches documents that actually change.
//
// Run against production from the Convex dashboard, or:
//   npx convex run scrubContent:scrubExistingContent --prod

import { internalMutation } from "./_generated/server";
import { sanitizeUserText } from "./sanitize";

export const scrubExistingContent = internalMutation({
  args: {},
  handler: async (ctx) => {
    let usersScrubbed = 0;
    let ideasScrubbed = 0;

    const users = await ctx.db.query("users").collect();
    for (const user of users) {
      const patch: Record<string, string> = {};

      const cleanName = sanitizeUserText(user.displayName);
      if (cleanName !== user.displayName) patch.displayName = cleanName;

      if (user.bio !== undefined) {
        const cleanBio = sanitizeUserText(user.bio);
        if (cleanBio !== user.bio) patch.bio = cleanBio;
      }

      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(user._id, patch);
        usersScrubbed++;
      }
    }

    const ideas = await ctx.db.query("ideas").collect();
    for (const idea of ideas) {
      const patch: Record<string, string> = {};

      const cleanTitle = sanitizeUserText(idea.title);
      if (cleanTitle !== idea.title) patch.title = cleanTitle;

      const cleanDesc = sanitizeUserText(idea.description);
      if (cleanDesc !== idea.description) patch.description = cleanDesc;

      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(idea._id, patch);
        ideasScrubbed++;
      }
    }

    console.log(
      `Scrub complete — users patched: ${usersScrubbed}, ideas patched: ${ideasScrubbed}`,
    );
    return { usersScrubbed, ideasScrubbed };
  },
});
