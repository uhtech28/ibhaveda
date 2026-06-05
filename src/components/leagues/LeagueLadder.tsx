"use client";

/**
 * Full ranked list of users in the viewer's current tier. Promotion
 * zone rows have a green left rule + chevron-up; relegation rows
 * have a red left rule + chevron-down. The viewer's own row is
 * highlighted with a subtle ring so they can find themselves at a
 * glance.
 *
 * Intended to drop into the existing Leaderboard surface as a new
 * tab or section. Pass `limit` to render only the top N rows when
 * embedding inside a tight space.
 */

import React from "react";
import { ChevronDown, ChevronUp, Trophy } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { LeagueBadge } from "./LeagueBadge";

interface Props {
  /** Cap the number of rendered rows. Default: render everyone in the tier. */
  limit?: number;
}

export function LeagueLadder({ limit }: Props) {
  const ladder = useQuery(api.leagues.getLadderForMyTier, { limit });
  const status = useQuery(api.leagues.getMyLeagueStatus, {});

  if (ladder === undefined || status === undefined) return <LoadingState />;
  if (status === null) return <UnrankedState />;
  if (ladder.length === 0) return <EmptyState />;

  // PRD §4 AC2 — when the engine is in single-tier mode the board is
  // just "the weekly cohort". The chevrons and the zone legend disappear.
  const hideZones = (status as { hideZones?: boolean }).hideZones ?? false;

  return (
    <section className="space-y-3">
      <header className="flex items-baseline justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-300" />
          <h2 className="font-mono text-sm uppercase tracking-widest text-white/70">
            This week's ladder
          </h2>
          <LeagueBadge tier={status.tier} size="sm" />
        </div>
        <span className="text-xs text-white/40">
          {status.population} {hideZones ? "this week" : "in tier"}
        </span>
      </header>

      <ol className="space-y-1.5">
        {ladder.map((row) => (
          <LadderRow key={row.userId} row={row} hideZones={hideZones} />
        ))}
      </ol>

      {!hideZones && (
        <ZoneLegend
          promotionCount={status.zones.promotionCount}
          relegationCount={status.population - status.zones.relegationStartAt}
          canPromote={status.canPromote}
          canRelegate={status.canRelegate}
        />
      )}
      {hideZones && (
        <p className="text-xs text-white/40">
          Compete in a single weekly cohort. Promotion / relegation will
          switch on automatically as the community grows.
        </p>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Row
// ─────────────────────────────────────────────────────────────────────

interface LadderRowProps {
  row: NonNullable<
    ReturnType<typeof useQuery<typeof api.leagues.getLadderForMyTier>>
  >[number];
  hideZones?: boolean;
}

function LadderRow({ row, hideZones = false }: LadderRowProps) {
  const accent = hideZones
    ? "border-l-white/10"
    : row.isInPromotionZone
      ? "border-l-emerald-400"
      : row.isInRelegationZone
        ? "border-l-red-400"
        : "border-l-white/10";
  const viewerRing = row.isViewer ? "ring-1 ring-indigo-500/50" : "";

  return (
    <li
      className={`flex items-center gap-3 rounded-md border border-white/10 border-l-2 bg-white/[0.02] px-3 py-2 ${accent} ${viewerRing}`}
    >
      <span className="w-8 shrink-0 text-center font-mono text-sm font-medium text-white/60">
        {row.rank}
      </span>
      <Avatar url={row.avatar} name={row.displayName} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">
          {row.displayName}
          {row.isViewer && (
            <span className="ml-1.5 rounded bg-white/10 px-1 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/60">
              You
            </span>
          )}
        </p>
      </div>
      <span className="shrink-0 font-mono text-sm tabular-nums text-white/80">
        {row.weeklyXp.toLocaleString()}
      </span>
      {!hideZones && row.isInPromotionZone && (
        <ChevronUp
          className="h-4 w-4 text-emerald-400"
          aria-label="Promotion zone"
        />
      )}
      {!hideZones && row.isInRelegationZone && (
        <ChevronDown
          className="h-4 w-4 text-red-400"
          aria-label="Relegation zone"
        />
      )}
    </li>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Subcomponents
// ─────────────────────────────────────────────────────────────────────

function ZoneLegend({
  promotionCount,
  relegationCount,
  canPromote,
  canRelegate,
}: {
  promotionCount: number;
  relegationCount: number;
  canPromote: boolean;
  canRelegate: boolean;
}) {
  if (promotionCount === 0 && relegationCount === 0) {
    return (
      <p className="text-xs text-white/40">
        Too few players this week — no promotions or relegations this Sunday.
      </p>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-white/50">
      {promotionCount > 0 && canPromote && (
        <span className="inline-flex items-center gap-1">
          <ChevronUp className="h-3 w-3 text-emerald-400" />
          Top {promotionCount} promote
        </span>
      )}
      {relegationCount > 0 && canRelegate && (
        <span className="inline-flex items-center gap-1">
          <ChevronDown className="h-3 w-3 text-red-400" />
          Bottom {relegationCount} relegate
        </span>
      )}
      <span className="text-white/40">Resets Sunday 00:00 UTC</span>
    </div>
  );
}

function Avatar({ url, name }: { url: string | null; name: string }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        className="h-7 w-7 shrink-0 rounded-full border border-white/10 object-cover"
      />
    );
  }
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[10px] font-medium text-white/70">
      {initials || "?"}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="h-[300px] animate-pulse rounded-lg border border-white/10 bg-white/[0.015]" />
  );
}

function UnrankedState() {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.015] p-6 text-center">
      <p className="text-sm text-white/60">
        Earn your first XP to enter the Bronze league.
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.015] p-6 text-center">
      <p className="text-sm text-white/60">No one in your tier yet this week.</p>
    </div>
  );
}
