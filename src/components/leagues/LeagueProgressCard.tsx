"use client";

/**
 * Compact league status card. Shows the user's current tier, rank,
 * weekly XP, and a one-line status:
 *
 *   - "Top 3 promote on Sunday — you're #2, on track"        (in zone)
 *   - "Top 3 promote — you're #6, need +45 XP to reach"      (close)
 *   - "Bottom 3 relegate — you're #18, +20 XP to escape"     (in danger)
 *
 * Designed for the HUD / sidebar. The full ranked list lives in
 * `LeagueLadder.tsx`.
 */

import React from "react";
import { TrendingDown, TrendingUp, Trophy } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { getTier } from "@convex/leagueConstants";
import { LeagueBadge } from "./LeagueBadge";

export function LeagueProgressCard() {
  const status = useQuery(api.leagues.getMyLeagueStatus, {});

  if (status === undefined) {
    return <LoadingState />;
  }
  if (status === null) {
    return <UnrankedState />;
  }

  const tierMeta = getTier(status.tier);
  const lineCopy = statusCopy(status);

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Trophy
            className="h-4 w-4"
            style={{ color: tierMeta.color }}
            aria-hidden="true"
          />
          <span className="font-mono text-[10px] uppercase tracking-widest text-white/50">
            League
          </span>
        </div>
        <LeagueBadge tier={status.tier} size="sm" />
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <div>
          <p className="text-3xl font-bold text-white">
            #{status.rank}
            <span className="ml-1 text-sm font-normal text-white/40">
              / {status.population}
            </span>
          </p>
          <p className="mt-0.5 text-xs text-white/50">
            {status.weeklyXp.toLocaleString()} XP this week
          </p>
        </div>
        <ZoneIcon
          inPromotion={status.inPromotionZone}
          inRelegation={status.inRelegationZone}
        />
      </div>

      <p className="mt-3 text-xs leading-relaxed text-white/60">{lineCopy}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Subcomponents
// ─────────────────────────────────────────────────────────────────────

function ZoneIcon({
  inPromotion,
  inRelegation,
}: {
  inPromotion: boolean;
  inRelegation: boolean;
}) {
  if (inPromotion) {
    return (
      <span
        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300"
        aria-label="In promotion zone"
      >
        <TrendingUp className="h-4 w-4" />
      </span>
    );
  }
  if (inRelegation) {
    return (
      <span
        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-500/20 text-red-300"
        aria-label="In relegation zone"
      >
        <TrendingDown className="h-4 w-4" />
      </span>
    );
  }
  return null;
}

function LoadingState() {
  return (
    <div className="h-[140px] animate-pulse rounded-lg border border-white/10 bg-white/[0.02]" />
  );
}

function UnrankedState() {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 text-center">
      <p className="text-sm text-white/60">
        Earn your first XP to enter the Bronze league.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Status-line copy
// ─────────────────────────────────────────────────────────────────────

interface StatusPayload {
  tier: ReturnType<typeof getTier> extends infer T ? T extends never ? never : ReturnType<typeof getTier>["id"] : never;
  rank: number;
  population: number;
  zones: { promotionCount: number; relegationStartAt: number };
  inPromotionZone: boolean;
  inRelegationZone: boolean;
  xpToPromotion: number;
  canPromote: boolean;
  canRelegate: boolean;
}

function statusCopy(s: StatusPayload): string {
  const { zones, rank, population } = s;
  const relegationCount = population - zones.relegationStartAt;

  if (s.inPromotionZone && s.canPromote) {
    return `Top ${zones.promotionCount} promote on Sunday — you're #${rank}, on track.`;
  }
  if (s.inPromotionZone && !s.canPromote) {
    return `Diamond is the top tier. Hold #${rank} until Sunday.`;
  }
  if (s.inRelegationZone && s.canRelegate) {
    return `Bottom ${relegationCount} relegate on Sunday — you're at risk.`;
  }
  if (s.inRelegationZone && !s.canRelegate) {
    return `Bronze has no relegation — keep grinding.`;
  }
  if (s.canPromote && s.xpToPromotion > 0) {
    return `Top ${zones.promotionCount} promote on Sunday — need +${s.xpToPromotion} XP to reach the zone.`;
  }
  return `Stay sharp — Sunday brings the weekly reset.`;
}
