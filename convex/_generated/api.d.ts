/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as academic_academicConstants from "../academic/academicConstants.js";
import type * as agent from "../agent.js";
import type * as agent_actions from "../agent_actions.js";
import type * as ai from "../ai.js";
import type * as aiScoring from "../aiScoring.js";
import type * as badges from "../badges.js";
import type * as chat from "../chat.js";
import type * as chatImages from "../chatImages.js";
import type * as combat from "../combat.js";
import type * as combatAiProvider from "../combatAiProvider.js";
import type * as combatAntiCheat from "../combatAntiCheat.js";
import type * as combatConstants from "../combatConstants.js";
import type * as combatTypes from "../combatTypes.js";
import type * as communities from "../communities.js";
import type * as contributionRequests from "../contributionRequests.js";
import type * as corruptionEngine from "../corruptionEngine.js";
import type * as creative_creativeConstants from "../creative/creativeConstants.js";
import type * as crons from "../crons.js";
import type * as cumulativeVentureScore from "../cumulativeVentureScore.js";
import type * as debug from "../debug.js";
import type * as emailReengagement from "../emailReengagement.js";
import type * as emailTemplates from "../emailTemplates.js";
import type * as emailTest from "../emailTest.js";
import type * as engagement from "../engagement.js";
import type * as flares from "../flares.js";
import type * as gamification from "../gamification.js";
import type * as hierarchy from "../hierarchy.js";
import type * as ideas from "../ideas.js";
import type * as interCheckpoint from "../interCheckpoint.js";
import type * as invitations from "../invitations.js";
import type * as lab_labConstants from "../lab/labConstants.js";
import type * as leaderboard from "../leaderboard.js";
import type * as leagueConstants from "../leagueConstants.js";
import type * as leagues from "../leagues.js";
import type * as levels from "../levels.js";
import type * as meetings from "../meetings.js";
import type * as mentorship from "../mentorship.js";
import type * as miniGameConstants from "../miniGameConstants.js";
import type * as miniGameTypes from "../miniGameTypes.js";
import type * as miniGames from "../miniGames.js";
import type * as notifications from "../notifications.js";
import type * as resend from "../resend.js";
import type * as search from "../search.js";
import type * as skillBadges from "../skillBadges.js";
import type * as socialFeed from "../socialFeed.js";
import type * as socialProof from "../socialProof.js";
import type * as stageBadgeDefinitions from "../stageBadgeDefinitions.js";
import type * as streaks from "../streaks.js";
import type * as teamLeagues from "../teamLeagues.js";
import type * as templateBadges from "../templateBadges.js";
import type * as templateEngine from "../templateEngine.js";
import type * as templateMetrics from "../templateMetrics.js";
import type * as templateScoring from "../templateScoring.js";
import type * as todos from "../todos.js";
import type * as tutorial from "../tutorial.js";
import type * as tutorial_metrics from "../tutorial_metrics.js";
import type * as users from "../users.js";
import type * as ventureConstants from "../ventureConstants.js";
import type * as ventures from "../ventures.js";
import type * as videos from "../videos.js";
import type * as worldMap from "../worldMap.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "academic/academicConstants": typeof academic_academicConstants;
  agent: typeof agent;
  agent_actions: typeof agent_actions;
  ai: typeof ai;
  aiScoring: typeof aiScoring;
  badges: typeof badges;
  chat: typeof chat;
  chatImages: typeof chatImages;
  combat: typeof combat;
  combatAiProvider: typeof combatAiProvider;
  combatAntiCheat: typeof combatAntiCheat;
  combatConstants: typeof combatConstants;
  combatTypes: typeof combatTypes;
  communities: typeof communities;
  contributionRequests: typeof contributionRequests;
  corruptionEngine: typeof corruptionEngine;
  "creative/creativeConstants": typeof creative_creativeConstants;
  crons: typeof crons;
  cumulativeVentureScore: typeof cumulativeVentureScore;
  debug: typeof debug;
  emailReengagement: typeof emailReengagement;
  emailTemplates: typeof emailTemplates;
  emailTest: typeof emailTest;
  engagement: typeof engagement;
  flares: typeof flares;
  gamification: typeof gamification;
  hierarchy: typeof hierarchy;
  ideas: typeof ideas;
  interCheckpoint: typeof interCheckpoint;
  invitations: typeof invitations;
  "lab/labConstants": typeof lab_labConstants;
  leaderboard: typeof leaderboard;
  leagueConstants: typeof leagueConstants;
  leagues: typeof leagues;
  levels: typeof levels;
  meetings: typeof meetings;
  mentorship: typeof mentorship;
  miniGameConstants: typeof miniGameConstants;
  miniGameTypes: typeof miniGameTypes;
  miniGames: typeof miniGames;
  notifications: typeof notifications;
  resend: typeof resend;
  search: typeof search;
  skillBadges: typeof skillBadges;
  socialFeed: typeof socialFeed;
  socialProof: typeof socialProof;
  stageBadgeDefinitions: typeof stageBadgeDefinitions;
  streaks: typeof streaks;
  teamLeagues: typeof teamLeagues;
  templateBadges: typeof templateBadges;
  templateEngine: typeof templateEngine;
  templateMetrics: typeof templateMetrics;
  templateScoring: typeof templateScoring;
  todos: typeof todos;
  tutorial: typeof tutorial;
  tutorial_metrics: typeof tutorial_metrics;
  users: typeof users;
  ventureConstants: typeof ventureConstants;
  ventures: typeof ventures;
  videos: typeof videos;
  worldMap: typeof worldMap;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
