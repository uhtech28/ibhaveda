import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// 1. Get current Clerk ID (to copy-paste)
export const getMyIdentity = query({
  handler: async ({ auth }) => {
    const identity = await auth.getUserIdentity();
    return identity ? identity : "Not Logged In";
  },
});

// 2. Force reassign a username to the current logged-in user
// WARNING: distinct administration tool for dev use only
export const claimUsername = mutation({
  args: { username: v.string() },
  handler: async ({ db, auth }, { username }) => {
    const identity = await auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const normalizedUsername = username.toLowerCase().trim();

    // Find the "zombie" user
    const existingUser = await db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", normalizedUsername))
      .first();

    if (!existingUser) {
      return "Username not found. Nothing to claim.";
    }

    // Update the Clerk ID to the current user's ID
    await db.patch(existingUser._id, {
      clerkId: identity.subject,
      isActive: true, // Reactivate if dormant
    });

    return `Successfully reclaimed username '${normalizedUsername}' for Clerk ID ${identity.subject}`;
  },
});

// 3. Dev/admin migration: rewrite legacy OAuth task rows to PRD-supported Link tasks.
// Keep schema temporarily compatible with "oauth" until this returns migrated: 0.
export const migrateLegacyOauthTasksToLink = mutation({
  args: {
    dryRun: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async ({ db, auth }, { dryRun = true, limit = 100 }) => {
    const identity = await auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const tasks = await db.query("ventureTasks").collect();
    const legacyTasks = tasks
      .filter((task) => task.toolType === "oauth")
      .slice(0, Math.max(0, limit));

    if (!dryRun) {
      for (const task of legacyTasks) {
        await db.patch(task._id, { toolType: "link" });
      }
    }

    return {
      dryRun,
      scanned: tasks.length,
      matched: tasks.filter((task) => task.toolType === "oauth").length,
      processed: legacyTasks.length,
      migrated: dryRun ? 0 : legacyTasks.length,
      nextAction:
        dryRun && legacyTasks.length > 0
          ? "Run with dryRun: false to migrate this batch."
          : legacyTasks.length === limit
            ? "Run again to migrate the next batch."
            : "No further action required for this batch.",
    };
  },
});
