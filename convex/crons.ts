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

export default crons;
