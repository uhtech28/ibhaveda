"use client";

/**
 * Team (project) league board — PRD §4.2.
 *
 * Mirrors the Individual board's structure but the competing entity
 * is a project, not a person. The "weekly score" is the project's
 * trailing-7-day points total (PRD §4 AC5) read from the shared
 * `projectWeeklyPoints` ledger.
 *
 * In single-tier mode (`ACTIVE_LEAGUE_COUNT = 1`) the board reads as
 * one cohort: no zones, no chevrons — just the projects ranked by
 * trailing 7-day points with a reset countdown.
 *
 * Surfaces the viewer's own projects' totals prominently at the top
 * since contributors specifically asked to see that number.
 */

import React from "react";
import Link from "next/link";
import { Trophy, Users } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

export function TeamLeagueBoard() {
  const myStatus = useQuery(api.teamLeagues.getMyTeamLeagueStatus, {});
  const ladder = useQuery(api.teamLeagues.getTopTeamLadder, { limit: 50 });

  if (myStatus === undefined || ladder === undefined) {
    return <LoadingState />;
  }

  const hasOwnProjects = myStatus && myStatus.ideas.length > 0;
  const isEmpty = ladder.length === 0;

  return (
    <section className="space-y-6">
      {/* My-projects summary — only when the viewer owns at least one
       *  project that's eligible to appear on the team board. */}
      {hasOwnProjects && (
        <div className="space-y-3">
          <header className="flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-300" />
            <h2 className="font-mono text-sm uppercase tracking-widest text-white/70">
              Your projects · trailing 7 days
            </h2>
          </header>
          <ul className="space-y-2">
            {myStatus.ideas.map((idea) => (
              <li
                key={idea.ideaId}
                className="rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <Link
                    href={`/idea/${idea.ideaId}`}
                    className="truncate text-sm font-medium text-white hover:text-emerald-300"
                  >
                    {idea.title}
                  </Link>
                  <span className="font-mono text-xs tabular-nums text-white/40">
                    {idea.population > 0
                      ? `#${idea.rank} of ${idea.population}`
                      : "no events yet"}
                  </span>
                </div>
                <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-emerald-300">
                  {idea.weeklyPoints.toLocaleString()}
                  <span className="ml-1 text-xs font-normal text-white/40">
                    points this week
                  </span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Ladder */}
      <div className="space-y-3">
        <header className="flex items-baseline justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-300" />
            <h2 className="font-mono text-sm uppercase tracking-widest text-white/70">
              Team ladder · trailing 7 days
            </h2>
          </div>
          {!isEmpty && (
            <span className="text-xs text-white/40">
              {ladder.length} project{ladder.length === 1 ? "" : "s"}
            </span>
          )}
        </header>

        {isEmpty ? (
          <div className="rounded-lg border border-white/10 bg-white/[0.015] p-6 text-center">
            <p className="text-sm text-white/60">
              No project-lane points awarded in the last seven days yet.
            </p>
            <p className="mt-1 text-xs text-white/40">
              Projects start showing up here as contributors accept
              requests and complete work.
            </p>
          </div>
        ) : (
          <ol className="space-y-1.5">
            {ladder.map((row) => (
              <li
                key={row.ideaId}
                className={`flex items-center gap-3 rounded-md border border-white/10 border-l-2 border-l-white/10 bg-white/[0.02] px-3 py-2 ${
                  row.isViewerProject ? "ring-1 ring-indigo-500/50" : ""
                }`}
              >
                <span className="w-8 shrink-0 text-center font-mono text-sm font-medium text-white/60">
                  {row.rank}
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/idea/${row.ideaId}`}
                    className="block truncate text-sm font-medium text-white hover:text-emerald-300"
                  >
                    {row.title}
                    {row.isViewerProject && (
                      <span className="ml-1.5 rounded bg-white/10 px-1 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/60">
                        Yours
                      </span>
                    )}
                  </Link>
                  <p className="truncate text-[11px] text-white/40">
                    by {row.authorDisplayName}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-sm tabular-nums text-white/80">
                  {row.weeklyPoints.toLocaleString()}
                </span>
              </li>
            ))}
          </ol>
        )}

        {myStatus?.singleTierMode && (
          <p className="text-xs text-white/40">
            One weekly cohort while the community is small. Tier promotion
            will switch on automatically as more projects compete.
          </p>
        )}
      </div>
    </section>
  );
}

function LoadingState() {
  return (
    <div className="h-[300px] animate-pulse rounded-lg border border-white/10 bg-white/[0.015]" />
  );
}
