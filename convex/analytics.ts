import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const logEvent = mutation({
  args: {
    userId: v.id("users"),
    sessionId: v.string(),
    eventName: v.string(),
    eventCategory: v.string(),
    properties: v.optional(v.any()),
    pageUrl: v.optional(v.string()),
    pageTitle: v.optional(v.string()),
    previousPageUrl: v.optional(v.string()),
    timestamp: v.number(),
    sequenceNumber: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("analytics_events", {
      ...args,
      serverTimestamp: Date.now(),
    });
  },
});

export const upsertSession = mutation({
  args: {
    userId: v.id("users"),
    sessionId: v.string(),
    startedAt: v.number(),
    entryPage: v.string(),
    isFirstSession: v.boolean(),
    device: v.optional(v.string()),
    os: v.optional(v.string()),
    browser: v.optional(v.string()),
    referrer: v.optional(v.string()),
    utmSource: v.optional(v.string()),
    utmMedium: v.optional(v.string()),
    utmCampaign: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("user_sessions")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .first();
    if (existing) return existing._id;
    await ctx.db.patch(args.userId, { lastSeenAt: args.startedAt });
    return await ctx.db.insert("user_sessions", {
      ...args,
      pageCount: 1,
      eventCount: 0,
      idleSeconds: 0,
    });
  },
});

export const updateSession = mutation({
  args: {
    sessionId: v.string(),
    exitPage: v.optional(v.string()),
    endedAt: v.optional(v.number()),
    incrementPage: v.optional(v.boolean()),
    incrementEvent: v.optional(v.boolean()),
    addIdleSeconds: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("user_sessions")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .first();
    if (!session) return;
    const patch: Record<string, unknown> = { lastActionAt: Date.now() };
    if (args.exitPage) patch.exitPage = args.exitPage;
    if (args.endedAt) {
      patch.endedAt = args.endedAt;
      patch.durationSeconds = Math.floor(
        (args.endedAt - session.startedAt) / 1000
      );
    }
    if (args.incrementPage) patch.pageCount = session.pageCount + 1;
    if (args.incrementEvent) patch.eventCount = session.eventCount + 1;
    if (args.addIdleSeconds)
      patch.idleSeconds = session.idleSeconds + args.addIdleSeconds;
    await ctx.db.patch(session._id, patch);
  },
});

export const logEmailEvent = mutation({
  args: {
    userId: v.optional(v.id("users")),
    resendEmailId: v.string(),
    campaignType: v.string(),
    event: v.string(),
    clickUrl: v.optional(v.string()),
    timestamp: v.number(),
    recipientEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("email_events", args);
  },
});

// ── Queries for the local dashboard ──────────────────────────────────────────

export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();
  },
});

export const adminGetUserCounts = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return {
      total: users.length,
      activated: users.filter((u) => u.isActivated).length,
      mau: users.filter(
        (u) => u.lastSeenAt && u.lastSeenAt > thirtyDaysAgo
      ).length,
      byStage: {
        new: users.filter(
          (u) => !u.lifecycleStage || u.lifecycleStage === "new"
        ).length,
        activated: users.filter((u) => u.lifecycleStage === "activated").length,
        retained: users.filter((u) => u.lifecycleStage === "retained").length,
        at_risk: users.filter((u) => u.lifecycleStage === "at_risk").length,
        churned: users.filter((u) => u.lifecycleStage === "churned").length,
        resurrected: users.filter((u) => u.lifecycleStage === "resurrected")
          .length,
      },
    };
  },
});

export const getDailyActiveUsers = query({
  args: { days: v.number() },
  handler: async (ctx, args) => {
    const since = new Date(Date.now() - args.days * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const snapshots = await ctx.db
      .query("retention_snapshots")
      .filter((q) => q.gte(q.field("snapshotDate"), since))
      .collect();
    const byDate: Record<string, number> = {};
    for (const s of snapshots) {
      if (s.wasActive)
        byDate[s.snapshotDate] = (byDate[s.snapshotDate] ?? 0) + 1;
    }
    return Object.entries(byDate).sort((a, b) => a[0].localeCompare(b[0]));
  },
});

export const getEventCounts = query({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.db.query("analytics_events").collect();
    const counts: Record<string, number> = {};
    for (const e of events) {
      counts[e.eventName] = (counts[e.eventName] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30);
  },
});

export const getLifecycleBreakdown = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return [
      "new",
      "activated",
      "retained",
      "at_risk",
      "churned",
      "resurrected",
    ].map((stage) => ({
      name: stage,
      value: users.filter((u) => (u.lifecycleStage ?? "new") === stage).length,
    }));
  },
});

export const getAllUsersForAdmin = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").order("desc").take(500);
    return users.map((u) => ({
      _id: u._id,
      email: u.email,
      name: u.displayName || u.username || "Unknown",
      lifecycleStage: u.lifecycleStage ?? "new",
      lastSeenAt: u.lastSeenAt,
      isActivated: u.isActivated ?? false,
      createdAt: u._creationTime,
      xp: u.xp ?? 0,
    }));
  },
});

export const getUserLifecycle = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    const sessions = await ctx.db
      .query("user_sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(20);
    const recentEvents = await ctx.db
      .query("analytics_events")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(100);
    const retentionHistory = await ctx.db
      .query("retention_snapshots")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(90);
    const emailHistory = await ctx.db
      .query("email_events")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(20);
    return { user, sessions, recentEvents, retentionHistory, emailHistory };
  },
});

export const reconstructSession = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("user_sessions")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .first();
    const events = await ctx.db
      .query("analytics_events")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("asc")
      .collect();
    return { session, events };
  },
});

export const getCohortRetention = query({
  args: {},
  handler: async (ctx) => {
    const snapshots = await ctx.db.query("retention_snapshots").collect();
    const cohorts: Record<
      string,
      Record<number, { active: number; total: number }>
    > = {};
    for (const s of snapshots) {
      if (!cohorts[s.signupCohort]) cohorts[s.signupCohort] = {};
      const week = Math.floor(s.daysSinceSignup / 7);
      if (!cohorts[s.signupCohort][week])
        cohorts[s.signupCohort][week] = { active: 0, total: 0 };
      cohorts[s.signupCohort][week].total++;
      if (s.wasActive) cohorts[s.signupCohort][week].active++;
    }
    return cohorts;
  },
});

export const getRecentEvents = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("analytics_events")
      .withIndex("by_timestamp")
      .order("desc")
      .take(args.limit ?? 200);
  },
});
