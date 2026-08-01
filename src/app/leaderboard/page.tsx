"use client";

/**
 * @file /leaderboard — full gamification leaderboard surface (PRD §Leaderboard).
 *
 * Three tabs, one engine:
 *   - Daily     — points earned since 00:00 IST today.
 *   - Weekly    — rolling 7-day window (used by the community-page podium).
 *   - All-time  — wallet-balance ranking, ever.
 *
 * Layout per tab:
 *   1. Podium (top 3, reused styling from /community).
 *   2. Ranks 4-10 as a compact table.
 *   3. "Your rank" card at the bottom — always shows the viewer's row,
 *      even when they're below the top 10. Suppressed for unauthenticated
 *      or unranked users.
 *
 * Data is reactive via useQuery, so the board updates live as XP is
 * earned across the platform. No manual refresh button needed.
 */

import React from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { HeroHeader } from "@/components/header";
import FooterSection from "@/components/footer";
import { FloatingChatButton } from "@/components/chat/FloatingChatButton";
import { Trophy, Flame, Calendar, Crown } from "lucide-react";

type Period = "daily" | "weekly" | "allTime";

type Row = {
  _id: string;
  displayName: string;
  username: string;
  avatar?: string | null;
  points: number;
  level: number;
  rank: number;
};

type MyRankResult = {
  rank: number;
  points: number;
  displayName: string;
  username: string;
  avatar?: string | null;
  level: number;
};

const PERIOD_META: Record<
  Period,
  { label: string; short: string; description: string; Icon: React.ComponentType<{ className?: string }>; resetCopy: string }
> = {
  daily: {
    label: "Today",
    short: "Daily",
    description: "Top XP earners since midnight IST.",
    Icon: Flame,
    resetCopy: "Resets 00:00 IST",
  },
  weekly: {
    label: "This Week",
    short: "Weekly",
    description: "Points earned in the last 7 days.",
    Icon: Calendar,
    resetCopy: "Rolling 7-day window",
  },
  allTime: {
    label: "All-Time",
    short: "All-Time",
    description: "Highest wallet balances on the platform.",
    Icon: Crown,
    resetCopy: "Lifetime XP",
  },
};

export default function LeaderboardPage() {
  const [period, setPeriod] = React.useState<Period>("daily");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <HeroHeader />
      <main className="flex-1 container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-4xl mx-auto">
          <header className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-3">
              <Trophy className="w-7 h-7 text-yellow-500" />
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                Leaderboard
              </h1>
              <Trophy className="w-7 h-7 text-yellow-500" />
            </div>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              Every task, spark, and flare earns XP. Climb the ranks — top 3 daily
              win a permanent medal on their profile.
            </p>
          </header>

          <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-6">
              {(Object.keys(PERIOD_META) as Period[]).map((p) => {
                const { short, Icon } = PERIOD_META[p];
                return (
                  <TabsTrigger key={p} value={p} className="gap-1.5">
                    <Icon className="h-3.5 w-3.5" />
                    <span>{short}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {(Object.keys(PERIOD_META) as Period[]).map((p) => (
              <TabsContent key={p} value={p} className="space-y-6 focus-visible:outline-none">
                <LeaderboardBody period={p} />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </main>
      <FloatingChatButton />
      <FooterSection />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Body — podium + list + your-rank
// ─────────────────────────────────────────────────────────────────────────────

function LeaderboardBody({ period }: { period: Period }) {
  const meta = PERIOD_META[period];

  // Pick the right Convex query per period. Each returns the same shape:
  //   Row[] with rank already assigned.
  const daily = useQuery(
    api.leaderboard.getDailyTopN,
    period === "daily" ? { limit: 10 } : "skip",
  ) as Row[] | undefined;
  const weekly = useQuery(
    api.leaderboard.getWeeklyTopN,
    period === "weekly" ? { limit: 10 } : "skip",
  ) as Row[] | undefined;
  const allTime = useQuery(
    api.leaderboard.getAllTimeLeaderboard,
    period === "allTime" ? { limit: 10 } : "skip",
  ) as Row[] | undefined;

  const rows = period === "daily" ? daily : period === "weekly" ? weekly : allTime;
  const myRank = useQuery(api.leaderboard.getMyRank, { period }) as
    | MyRankResult
    | null
    | undefined;

  // Loading — reactive queries return undefined before first result lands.
  if (rows === undefined) {
    return <SkeletonBoard />;
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/50 p-10 text-center">
        <meta.Icon className="h-8 w-8 mx-auto mb-3 text-muted-foreground/60" />
        <p className="text-sm font-medium text-foreground">
          No XP earned yet in this window
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Be the first — complete a task or fire a flare to claim rank #1.
        </p>
      </div>
    );
  }

  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <div className="space-y-6">
      <p className="text-center text-xs text-muted-foreground uppercase tracking-widest">
        {meta.resetCopy}
      </p>

      {podium.length > 0 && <Podium rows={podium} />}

      {rest.length > 0 && <RankList rows={rest} />}

      {myRank && <YourRankCard row={myRank} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Podium (top 3)
// ─────────────────────────────────────────────────────────────────────────────

const RANK_STYLES = {
  1: {
    border: "border-yellow-500/50",
    bg: "bg-yellow-500/5",
    accent: "bg-yellow-500",
    avatarRing: "border-yellow-500/30",
    pointsText: "text-yellow-400",
  },
  2: {
    border: "border-gray-400/50",
    bg: "bg-gray-400/5",
    accent: "bg-gray-400",
    avatarRing: "border-gray-400/30",
    pointsText: "text-gray-300",
  },
  3: {
    border: "border-orange-700/50",
    bg: "bg-orange-700/5",
    accent: "bg-orange-700",
    avatarRing: "border-orange-700/30",
    pointsText: "text-orange-400",
  },
} as const;

function Podium({ rows }: { rows: Row[] }) {
  const first = rows[0];
  const second = rows[1];
  const third = rows[2];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-end">
      {/* Rank 2 — left on desktop, second in DOM on mobile */}
      <div className="md:order-1">
        {second ? <PodiumCard user={second} rank={2} /> : <div className="hidden md:block" />}
      </div>
      {/* Rank 1 — centered + elevated */}
      <div className="md:order-2">{first && <PodiumCard user={first} rank={1} />}</div>
      {/* Rank 3 — right on desktop, third in DOM on mobile */}
      <div className="md:order-3">
        {third ? <PodiumCard user={third} rank={3} /> : <div className="hidden md:block" />}
      </div>
    </div>
  );
}

function PodiumCard({ user, rank }: { user: Row; rank: 1 | 2 | 3 }) {
  const styles = RANK_STYLES[rank];
  const isFirst = rank === 1;
  const heightClass =
    rank === 1 ? "md:min-h-[300px]" : rank === 2 ? "md:min-h-[240px]" : "md:min-h-[210px]";

  return (
    <Card
      className={`relative overflow-hidden border-2 ${styles.border} ${styles.bg} ${heightClass} shadow-lg flex flex-col items-center justify-center text-center transition-transform duration-300 hover:scale-[1.03] ${
        isFirst ? "p-6 md:p-8" : "p-4 md:p-5"
      }`}
    >
      <div
        className={`absolute top-0 left-0 w-full ${isFirst ? "h-1.5" : "h-1"} ${styles.accent}`}
      />
      <div
        className={`flex items-center justify-center rounded-full text-white font-bold shadow-md ${styles.accent} ${
          isFirst ? "w-12 h-12 text-lg -mt-2 mb-3" : "w-9 h-9 text-sm -mt-1 mb-2"
        }`}
        aria-label={`Rank ${rank}`}
      >
        #{rank}
      </div>

      <Link
        href={`/profile/${encodeURIComponent(user.username)}`}
        className="w-full flex flex-col items-center"
      >
        <Avatar
          className={`shadow-md border-4 ${styles.avatarRing} ${
            isFirst ? "w-24 h-24 mb-4" : "w-16 h-16 mb-3"
          }`}
        >
          <AvatarImage src={user.avatar ?? undefined} alt={user.displayName} />
          <AvatarFallback
            className={`font-semibold bg-background ${isFirst ? "text-2xl" : "text-lg"}`}
          >
            {user.displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <h3
          className={`font-bold text-foreground truncate w-full hover:text-primary transition-colors ${
            isFirst ? "text-xl" : "text-base"
          }`}
        >
          {user.displayName}
        </h3>
        <p
          className={`text-muted-foreground ${
            isFirst ? "text-xs mb-4" : "text-[11px] mb-3"
          }`}
        >
          @{user.username}
        </p>

        <div
          className={`bg-background rounded-full border border-border/50 flex items-center gap-1.5 ${
            isFirst ? "px-4 py-1.5" : "px-3 py-1"
          }`}
        >
          <span
            className={`font-bold font-mono ${styles.pointsText} ${isFirst ? "text-base" : "text-sm"}`}
          >
            {user.points.toLocaleString()}
          </span>
          <span
            className={`text-muted-foreground font-medium uppercase tracking-wider ${
              isFirst ? "text-xs" : "text-[10px]"
            }`}
          >
            XP
          </span>
        </div>
      </Link>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Ranks 4-10 list
// ─────────────────────────────────────────────────────────────────────────────

function RankList({ rows }: { rows: Row[] }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm overflow-hidden">
      <ul className="divide-y divide-border/40">
        {rows.map((row) => (
          <RankListRow key={row._id} row={row} />
        ))}
      </ul>
    </div>
  );
}

function RankListRow({ row, highlight = false }: { row: Row; highlight?: boolean }) {
  return (
    <li
      className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
        highlight ? "bg-primary/5" : "hover:bg-white/[0.02]"
      }`}
    >
      <span className="w-8 shrink-0 text-center font-mono text-sm font-semibold text-muted-foreground">
        {row.rank}
      </span>
      <Link
        href={`/profile/${encodeURIComponent(row.username)}`}
        className="flex items-center gap-3 flex-1 min-w-0 group"
      >
        <Avatar className="h-8 w-8 shrink-0 border border-border/50">
          <AvatarImage src={row.avatar ?? undefined} alt={row.displayName} />
          <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
            {row.displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground group-hover:text-primary transition-colors">
            {row.displayName}
            {highlight && (
              <span className="ml-1.5 rounded bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                You
              </span>
            )}
          </p>
          <p className="text-[10px] text-muted-foreground truncate">@{row.username}</p>
        </div>
      </Link>
      <div className="shrink-0 flex items-baseline gap-1">
        <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
          {row.points.toLocaleString()}
        </span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">XP</span>
      </div>
    </li>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// "Your rank" card
// ─────────────────────────────────────────────────────────────────────────────

function YourRankCard({ row }: { row: MyRankResult }) {
  const { rank, points, displayName, username, avatar } = row;

  return (
    <div className="rounded-xl border-2 border-primary/40 bg-primary/5 backdrop-blur-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
          Your Standing
        </p>
        <span className="text-[10px] text-muted-foreground">
          {rank <= 10 ? "You're in the top 10 — keep pushing!" : "Climb the ladder — each task moves you up"}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center rounded-lg bg-primary text-white font-bold shadow-md w-11 h-11 text-base shrink-0">
          #{rank}
        </div>
        <Avatar className="h-10 w-10 shrink-0 border-2 border-primary/40">
          <AvatarImage src={avatar ?? undefined} alt={displayName} />
          <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
            {displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-foreground">{displayName}</p>
          <p className="text-[10px] text-muted-foreground truncate">@{username}</p>
        </div>
        <div className="shrink-0 flex items-baseline gap-1">
          <span className="font-mono text-lg font-bold tabular-nums text-primary">
            {points.toLocaleString()}
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            XP
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────────────────────

function SkeletonBoard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-end">
        <div className="md:order-1 h-40 md:h-56 rounded-xl border border-border/40 bg-card/30 animate-pulse" />
        <div className="md:order-2 h-52 md:h-72 rounded-xl border border-border/40 bg-card/30 animate-pulse" />
        <div className="md:order-3 h-36 md:h-48 rounded-xl border border-border/40 bg-card/30 animate-pulse" />
      </div>
      <div className="rounded-xl border border-border/40 bg-card/30 h-64 animate-pulse" />
    </div>
  );
}
