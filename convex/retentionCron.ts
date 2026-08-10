import { internalMutation } from "./_generated/server";

export const takeRetentionSnapshot = internalMutation({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().slice(0, 10);
    const users = await ctx.db.query("users").collect();
    const dayStart = new Date(today).getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;

    for (const user of users) {
      const existing = await ctx.db
        .query("retention_snapshots")
        .withIndex("by_user_and_date", (q) =>
          q.eq("userId", user._id).eq("snapshotDate", today)
        )
        .first();
      if (existing) continue;

      const sessions = await ctx.db
        .query("user_sessions")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .filter((q) =>
          q.and(
            q.gte(q.field("startedAt"), dayStart),
            q.lt(q.field("startedAt"), dayEnd)
          )
        )
        .collect();

      const events = await ctx.db
        .query("analytics_events")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .filter((q) =>
          q.and(
            q.gte(q.field("timestamp"), dayStart),
            q.lt(q.field("timestamp"), dayEnd)
          )
        )
        .collect();

      const createdAt = user._creationTime;
      const daysSinceSignup = Math.floor(
        (dayStart - createdAt) / (24 * 60 * 60 * 1000)
      );
      const signupDate = new Date(createdAt);
      const signupCohort = `${signupDate.getFullYear()}-W${String(
        getISOWeek(signupDate)
      ).padStart(2, "0")}`;
      const projectsWorkedOn = new Set(
        events
          .map(
            (e) =>
              (e.properties as Record<string, unknown>)?.projectId as string
          )
          .filter(Boolean)
      ).size;

      await ctx.db.insert("retention_snapshots", {
        userId: user._id,
        snapshotDate: today,
        wasActive: sessions.length > 0,
        sessionsCount: sessions.length,
        eventsCount: events.length,
        daysSinceSignup,
        signupCohort,
        xpEarnedToday: 0,
        projectsWorkedOn,
      });

      const lastSeen = user.lastSeenAt ?? user._creationTime;
      const daysSinceLastSeen = Math.floor(
        (Date.now() - lastSeen) / (24 * 60 * 60 * 1000)
      );
      let stage = user.lifecycleStage ?? "new";
      if (
        sessions.length > 0 &&
        (stage === "churned" || stage === "at_risk")
      ) {
        stage = "resurrected";
      } else if (daysSinceLastSeen >= 30) {
        stage = "churned";
      } else if (daysSinceLastSeen >= 14) {
        stage = "at_risk";
      } else if (user.isActivated && daysSinceSignup >= 7) {
        stage = "retained";
      } else if (user.isActivated) {
        stage = "activated";
      }
      await ctx.db.patch(user._id, { lifecycleStage: stage });
    }
  },
});

function getISOWeek(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
