import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Schedule: Daily Idea Generation at 9:00 AM UTC
const api = internal as any;

// Schedule: Daily Idea Generation at 9:00 AM UTC
crons.daily(
    "Generate Daily Idea",
    { hourUTC: 9, minuteUTC: 0 },
    api.agent_actions.generateDailyIdea
);

// Schedule: Hourly Engagement (Comment/Spark)
crons.interval(
    "Agent Engagement",
    { minutes: 60 },
    api.agent_actions.generateEngagement
);

// Schedule: Daily Leaderboard Reset (00:00 IST -> 18:30 UTC previous day)
crons.daily(
    "Finalize Daily Leaderboard",
    { hourUTC: 18, minuteUTC: 30 },
    api.leaderboard.finalizeDailyLeaderboard
);

export default crons;
