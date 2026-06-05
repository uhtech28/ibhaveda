// Orchestrates daily re-engagement emails for users who have not opened the site
// in at least 20 days.
//
// Inactivity window:
//   • INACTIVE_AFTER_MS (20d) — lower bound; users active more recently are ignored.
//   • CHURN_AFTER_MS    (90d) — upper bound for regular emails; beyond this a single
//     farewell email is sent instead, then that user is excluded from all future runs.
//
// Staggering rules:
//   • SEND_CAP (300) total emails per cron run (farewell + regular combined).
//   • Farewell emails are processed first and are always one-time — no stagger check.
//   • Regular emails: eligible only if never sent OR last sent ≥ RESEND_WINDOW_MS (14d) ago.
//   • Within the regular pool, never-emailed users sort first, then oldest-emailed first,
//     ensuring everyone gets a turn before anyone gets a second email.
//   • New users crossing the 20-day threshold appear automatically in the next run
//     with lastEmailedAt = 0 (front of queue) — no special handling needed.

import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { buildReengagementEmail, buildFarewellEmail } from "./emailTemplates";

// ─────────────────────────────────────────────────────────────────────────────
// Tunable constants — change these freely without touching any logic below
// ─────────────────────────────────────────────────────────────────────────────

const SEND_CAP          = 300;
const RESEND_WINDOW_MS  = 14 * 24 * 60 * 60 * 1000; // min gap between regular emails
const INACTIVE_AFTER_MS = 20 * 24 * 60 * 60 * 1000; // "inactive" threshold
const CHURN_AFTER_MS    = 90 * 24 * 60 * 60 * 1000; // switch to farewell email beyond this

// ─────────────────────────────────────────────────────────────────────────────
// Clerk API types
// ─────────────────────────────────────────────────────────────────────────────

interface ClerkEmailAddress {
  id: string;
  email_address: string;
}

interface ClerkUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email_addresses: ClerkEmailAddress[];
  last_active_at: number | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal queries
// ─────────────────────────────────────────────────────────────────────────────

export const getUserByClerkId = internalQuery({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    return ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();
  },
});

export const getUnreadNotifications = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return ctx.db
      .query("notifications")
      .withIndex("by_recipient_read", (q) =>
        q.eq("recipientId", userId).eq("isRead", false)
      )
      .order("desc")
      .take(20);
  },
});

export const getSparkedVentureUpdates = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const sparks = await ctx.db
      .query("userIdeaSparks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(50);

    const results: {
      ventureName: string;
      currentStage: number;
      currentCheckpoint: number;
    }[] = [];

    for (const spark of sparks) {
      const venture = await ctx.db
        .query("ventures")
        .withIndex("by_idea", (q) => q.eq("ideaId", spark.ideaId))
        .first();
      if (!venture) continue;

      const idea = await ctx.db.get(spark.ideaId as Id<"ideas">);
      if (!idea) continue;

      results.push({
        ventureName: idea.title,
        currentStage: venture.currentStage,
        currentCheckpoint: venture.currentCheckpoint,
      });
    }

    return results;
  },
});

export const getNewVenturesThisWeek = internalQuery({
  args: {},
  handler: async (ctx) => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const activeVentures = await ctx.db
      .query("ventures")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
    return activeVentures.filter((v) => v.createdAt >= oneWeekAgo).length;
  },
});

/**
 * Returns the most-recent REGULAR (non-farewell) re-engagement email for a user,
 * used to enforce the 14-day resend window.
 * Farewell emails are intentionally excluded — they don't reset the stagger clock.
 */
export const getLastRegularEmailForUser = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return ctx.db
      .query("reengagementLog")
      .withIndex("by_user_type_sent", (q) =>
        q.eq("userId", userId).eq("type", "reengagement")
      )
      .order("desc")
      .first();
  },
});

/**
 * Returns true if a farewell email has already been sent to this user.
 * Once true, this user is permanently excluded from all future email runs.
 */
export const hasFarewellEmailBeenSent = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const log = await ctx.db
      .query("reengagementLog")
      .withIndex("by_user_type_sent", (q) =>
        q.eq("userId", userId).eq("type", "farewell")
      )
      .first();
    return log !== null;
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Internal mutation
// ─────────────────────────────────────────────────────────────────────────────

export const logReengagementEmail = internalMutation({
  args: {
    userId: v.id("users"),
    type: v.union(v.literal("reengagement"), v.literal("farewell")),
  },
  handler: async (ctx, { userId, type }) => {
    await ctx.db.insert("reengagementLog", {
      userId,
      sentAt: Date.now(),
      type,
    });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Main action
// ─────────────────────────────────────────────────────────────────────────────

export const sendReengagementEmails = internalAction({
  args: {},
  handler: async (ctx) => {
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    if (!clerkSecretKey) throw new Error("CLERK_SECRET_KEY is not configured");

    // ── 1. Fetch all users from Clerk ────────────────────────────────────────
    const clerkResponse = await fetch(
      "https://api.clerk.com/v1/users?limit=500",
      {
        headers: {
          Authorization: `Bearer ${clerkSecretKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!clerkResponse.ok) {
      const body = await clerkResponse.text();
      throw new Error(`Clerk API error ${clerkResponse.status}: ${body}`);
    }

    const clerkUsers = (await clerkResponse.json()) as ClerkUser[];
    const now = Date.now();

    // ── 2. Split into two pools ───────────────────────────────────────────────
    // Pool A — FAREWELL: inactive ≥ 90 days (one-time goodbye email)
    // Pool B — REGULAR:  inactive 20–89 days (staggered re-engagement)
    const farewellClerkUsers: ClerkUser[] = [];
    const regularClerkUsers: ClerkUser[] = [];

    for (const user of clerkUsers) {
      if (!user.last_active_at) continue;
      const elapsed = now - user.last_active_at;
      if (elapsed >= CHURN_AFTER_MS) {
        farewellClerkUsers.push(user);
      } else if (elapsed >= INACTIVE_AFTER_MS) {
        regularClerkUsers.push(user);
      }
    }

    console.log(
      `Re-engagement run — total: ${clerkUsers.length}, ` +
        `regular inactive (20–89d): ${regularClerkUsers.length}, ` +
        `farewell eligible (90d+): ${farewellClerkUsers.length}`
    );

    // Pre-fetch platform stat — shared across all emails this run
    const newVenturesThisWeek = await ctx.runQuery(
      internal.emailReengagement.getNewVenturesThisWeek,
      {}
    );

    let successCount = 0;
    let failCount = 0;
    let remainingCap = SEND_CAP;

    // ── 3. Process farewell pool ──────────────────────────────────────────────
    // Farewell emails are sent once-ever and take priority in the cap.
    // After this, the user is permanently excluded from all future runs.
    for (const clerkUser of farewellClerkUsers) {
      if (remainingCap <= 0) break;

      const email = clerkUser.email_addresses[0]?.email_address;
      if (!email) continue;

      try {
        const convexUser = await ctx.runQuery(
          internal.emailReengagement.getUserByClerkId,
          { clerkId: clerkUser.id }
        );
        if (!convexUser) continue;

        // Skip if farewell was already sent (permanent exclusion)
        const alreadySentFarewell = await ctx.runQuery(
          internal.emailReengagement.hasFarewellEmailBeenSent,
          { userId: convexUser._id }
        );
        if (alreadySentFarewell) continue;

        const firstName = clerkUser.first_name ?? "Innovator";
        const inactiveDays = Math.floor(
          (now - clerkUser.last_active_at!) / (1000 * 60 * 60 * 24)
        );

        const [unreadNotifications, sparkedVentureUpdates] = await Promise.all([
          ctx.runQuery(internal.emailReengagement.getUnreadNotifications, {
            userId: convexUser._id,
          }),
          ctx.runQuery(internal.emailReengagement.getSparkedVentureUpdates, {
            userId: convexUser._id,
          }),
        ]);

        const html = buildFarewellEmail(
          firstName,
          inactiveDays,
          unreadNotifications.map((n: { message: string; type: string }) => ({ message: n.message, type: n.type })),
          sparkedVentureUpdates,
          { newVenturesThisWeek }
        );

        await ctx.runAction(internal.resend.sendEmail, {
          to: email,
          subject: `We won't email you again, ${firstName} — but here's what you're missing`,
          html,
        });

        await ctx.runMutation(internal.emailReengagement.logReengagementEmail, {
          userId: convexUser._id,
          type: "farewell",
        });

        console.log(
          `✓ Farewell sent to ${email} (clerkId: ${clerkUser.id}, inactive ${inactiveDays}d)`
        );
        successCount++;
        remainingCap--;
      } catch (err) {
        console.log(`✗ Farewell failed for ${email} (clerkId: ${clerkUser.id}): ${err}`);
        failCount++;
      }
    }

    // ── 4. Build regular candidate list with stagger filtering ───────────────
    type Candidate = {
      clerkUser: ClerkUser;
      convexUserId: Id<"users">;
      inactiveDays: number;
      lastEmailedAt: number; // 0 = never
    };

    const candidates: Candidate[] = [];

    for (const clerkUser of regularClerkUsers) {
      const email = clerkUser.email_addresses[0]?.email_address;
      if (!email) continue;

      const convexUser = await ctx.runQuery(
        internal.emailReengagement.getUserByClerkId,
        { clerkId: clerkUser.id }
      );
      if (!convexUser) continue;

      const lastLog = await ctx.runQuery(
        internal.emailReengagement.getLastRegularEmailForUser,
        { userId: convexUser._id }
      );

      const lastEmailedAt = lastLog?.sentAt ?? 0;

      // Skip if emailed within the resend window
      if (lastEmailedAt > 0 && now - lastEmailedAt < RESEND_WINDOW_MS) continue;

      const inactiveDays = Math.floor(
        (now - clerkUser.last_active_at!) / (1000 * 60 * 60 * 24)
      );

      candidates.push({
        clerkUser,
        convexUserId: convexUser._id,
        inactiveDays,
        lastEmailedAt,
      });
    }

    // Sort: never-emailed first, then by oldest last-email date
    candidates.sort((a, b) => a.lastEmailedAt - b.lastEmailedAt);

    const batch = candidates.slice(0, remainingCap);

    console.log(
      `Regular pool — eligible after stagger filter: ${candidates.length}, ` +
        `sending: ${batch.length} (remaining cap after farewell: ${remainingCap}).`
    );

    // ── 5. Send regular emails ────────────────────────────────────────────────
    for (const { clerkUser, convexUserId, inactiveDays } of batch) {
      const email = clerkUser.email_addresses[0]!.email_address;
      const firstName = clerkUser.first_name ?? "Innovator";

      try {
        const [unreadNotifications, sparkedVentureUpdates] = await Promise.all([
          ctx.runQuery(internal.emailReengagement.getUnreadNotifications, {
            userId: convexUserId,
          }),
          ctx.runQuery(internal.emailReengagement.getSparkedVentureUpdates, {
            userId: convexUserId,
          }),
        ]);

        const html = buildReengagementEmail(
          firstName,
          inactiveDays,
          unreadNotifications.map((n: { message: string; type: string }) => ({ message: n.message, type: n.type })),
          sparkedVentureUpdates,
          { newVenturesThisWeek }
        );

        await ctx.runAction(internal.resend.sendEmail, {
          to: email,
          subject: `${firstName}, here's what you missed on Ibhaveda`,
          html,
        });

        await ctx.runMutation(internal.emailReengagement.logReengagementEmail, {
          userId: convexUserId,
          type: "reengagement",
        });

        console.log(
          `✓ Re-engagement sent to ${email} (clerkId: ${clerkUser.id}, inactive ${inactiveDays}d)`
        );
        successCount++;
      } catch (err) {
        console.log(
          `✗ Regular email failed for ${email} (clerkId: ${clerkUser.id}): ${err}`
        );
        failCount++;
      }
    }

    console.log(
      `Run complete — sent: ${successCount} (farewell + regular), ` +
        `failed: ${failCount}, ` +
        `skipped (rate-limited or already farewelled): ${clerkUsers.length - successCount - failCount}.`
    );
  },
});
