"use client";

/**
 * Leagues page (PRD §4).
 *
 * Two boards under one engine:
 *   - Individual: existing 5-tier (Bronze→Diamond) weekly ladder.
 *   - Team:       trailing-7-day project leaderboard.
 *
 * The same league engine drives both — they differ only by the
 * competing entity (user vs idea) and the point lane that feeds the
 * weekly tally. When `ACTIVE_LEAGUE_COUNT = 1`, both boards collapse
 * to a single weekly cohort (zones hidden).
 */

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeagueLadder } from "@/components/leagues/LeagueLadder";
import { LeagueProgressCard } from "@/components/leagues/LeagueProgressCard";
import { TeamLeagueBoard } from "@/components/leagues/TeamLeagueBoard";

export default function LeaguesPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-white">Leagues</h1>
        <p className="text-sm text-white/60">
          Climb the weekly ladder. Promotions and relegations process every Monday at 00:00 UTC.
        </p>
      </header>

      <Tabs defaultValue="individual" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="individual">Individual</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        <TabsContent value="individual" className="space-y-6 pt-4">
          <LeagueProgressCard />
          <LeagueLadder />
        </TabsContent>

        <TabsContent value="team" className="space-y-6 pt-4">
          <TeamLeagueBoard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
