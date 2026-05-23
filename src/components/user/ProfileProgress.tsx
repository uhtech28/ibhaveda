"use client";

import React, { useEffect, useRef } from "react";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Trophy, Flame } from "lucide-react";

// Mirrors convex/ventureConstants.ts and the official "level_table_with_flare"
// spec — single source of truth for level → title / threshold / phase. Lv 1-3
// are purely task-gated (titlePoints = 0); Lv 4 onward needs accumulating pts.
type Phase = "Tutorial" | "Early" | "Mid" | "Senior" | "Mentor";
const LEVEL_TABLE: Array<{ level: number; title: string; pts: number; phase: Phase }> = [
  { level:  1, title: "Newcomer",     pts:      0, phase: "Tutorial" },
  { level:  2, title: "Explorer",     pts:      0, phase: "Tutorial" },
  { level:  3, title: "Thinker",      pts:      0, phase: "Tutorial" },
  { level:  4, title: "Connector",    pts:     50, phase: "Tutorial" },
  { level:  5, title: "Contributor",  pts:    150, phase: "Tutorial" },
  { level:  6, title: "Initiator",    pts:    300, phase: "Tutorial" },
  { level:  7, title: "Spark",        pts:    500, phase: "Early" },
  { level:  8, title: "Kindler",      pts:    800, phase: "Early" },
  { level:  9, title: "Surveyor",     pts:   1200, phase: "Early" },
  { level: 10, title: "Pathfinder",   pts:   1700, phase: "Early" },
  { level: 11, title: "Builder",      pts:   2300, phase: "Early" },
  { level: 12, title: "Artisan",      pts:   3000, phase: "Early" },
  { level: 13, title: "Cultivator",   pts:   3800, phase: "Early" },
  { level: 14, title: "Shaper",       pts:   4400, phase: "Early" },
  { level: 15, title: "Strategist",   pts:   5000, phase: "Early" },
  { level: 16, title: "Pioneer",      pts:   6000, phase: "Mid" },
  { level: 17, title: "Catalyst",     pts:   7200, phase: "Mid" },
  { level: 18, title: "Luminary",     pts:   8600, phase: "Mid" },
  { level: 19, title: "Vanguard",     pts:  10200, phase: "Mid" },
  { level: 20, title: "Architect",    pts:  12000, phase: "Mid" },
  { level: 21, title: "Trailblazer",  pts:  14000, phase: "Mid" },
  { level: 22, title: "Visionary",    pts:  16200, phase: "Mid" },
  { level: 23, title: "Navigator",    pts:  18600, phase: "Mid" },
  { level: 24, title: "Forger",       pts:  21200, phase: "Mid" },
  { level: 25, title: "Innovator",    pts:  24000, phase: "Mid" },
  { level: 26, title: "Magnate",      pts:  27000, phase: "Mid" },
  { level: 27, title: "Curator",      pts:  30200, phase: "Mid" },
  { level: 28, title: "Orchestrator", pts:  33600, phase: "Mid" },
  { level: 29, title: "Sage",         pts:  37200, phase: "Senior" },
  { level: 30, title: "Maven",        pts:  41000, phase: "Senior" },
  { level: 31, title: "Pillar",       pts:  45000, phase: "Senior" },
  { level: 32, title: "Champion",     pts:  49200, phase: "Senior" },
  { level: 33, title: "Exemplar",     pts:  53600, phase: "Senior" },
  { level: 34, title: "Harbinger",    pts:  58200, phase: "Senior" },
  { level: 35, title: "Virtuoso",     pts:  63000, phase: "Senior" },
  { level: 36, title: "Elder",        pts:  68000, phase: "Senior" },
  { level: 37, title: "Sovereign",    pts:  73200, phase: "Senior" },
  { level: 38, title: "Luminary",     pts:  78600, phase: "Senior" },
  { level: 39, title: "Legend",       pts:  84200, phase: "Senior" },
  { level: 40, title: "Mentor",       pts:  90000, phase: "Mentor" },
  { level: 41, title: "Guide",        pts:  96000, phase: "Mentor" },
  { level: 42, title: "Steward",      pts: 102200, phase: "Mentor" },
  { level: 43, title: "Luminary",     pts: 108600, phase: "Mentor" },
  { level: 44, title: "Pillar",       pts: 115200, phase: "Mentor" },
  { level: 45, title: "Oracle",       pts: 122000, phase: "Mentor" },
  { level: 46, title: "Paragon",      pts: 129000, phase: "Mentor" },
  { level: 47, title: "Titan",        pts: 136200, phase: "Mentor" },
  { level: 48, title: "Legend",       pts: 143600, phase: "Mentor" },
  { level: 49, title: "Icon",         pts: 151200, phase: "Mentor" },
  { level: 50, title: "Visionary",    pts: 159000, phase: "Mentor" },
];

const titleFor = (lv: number) =>
  LEVEL_TABLE.find((l) => l.level === lv)?.title ?? "—";

// Streak milestones — show progress toward the next achievable goal.
const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100, 365];

function nextStreakMilestone(current: number) {
  for (const m of STREAK_MILESTONES) {
    if (current < m) return m;
  }
  return current; // already past 365 — fully filled
}

interface BarProps {
  icon: React.ReactNode;
  label: string;
  detail: string;
  value: number;
  max: number;
  /** Tailwind classes for the fill gradient. */
  fillClass: string;
  /** Tailwind classes for the soft glow halo behind the icon. */
  iconBgClass: string;
}

function ProgressBar({ icon, label, detail, value, max, fillClass, iconBgClass }: BarProps) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`grid place-items-center h-7 w-7 rounded-full shrink-0 ${iconBgClass}`}>
            {icon}
          </span>
          <span className="text-sm font-semibold text-foreground truncate">{label}</span>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums shrink-0">{detail}</span>
      </div>
      <div className="relative h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out ${fillClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

interface ProfileProgressProps {
  userId: Id<"users">;
}

export const ProfileProgress: React.FC<ProfileProgressProps> = ({ userId }) => {
  const { isAuthenticated } = useConvexAuth();
  const levelProgress = useQuery(api.levels.getUserLevelProgress, { userId });
  const streak = useQuery(api.gamification.getUserStreak, { userId });
  const ventureSummaries = useQuery(api.ventures.getUserVentureSummaries, { userId });

  // Silently tick the *viewer's* streak once auth is ready. Idempotent on the
  // server — only counts the day if not already counted. Retries on auth ready
  // because Clerk-Convex handshake may complete after first render.
  const updateStreak = useMutation(api.gamification.updateStreak);
  const hasTickedRef = useRef(false);
  useEffect(() => {
    if (!isAuthenticated || hasTickedRef.current) return;
    hasTickedRef.current = true;
    updateStreak().catch(() => {
      // Allow retry on next mount if auth wasn't actually ready.
      hasTickedRef.current = false;
    });
  }, [isAuthenticated, updateStreak]);

  // Resolve level + title locally so the label is correct even if the backend
  // hasn't been redeployed with the new query shape yet.
  const level = levelProgress?.level ?? 1;
  const localTitle = titleFor(level);
  const title = levelProgress?.title && levelProgress.title !== "Unknown"
    ? levelProgress.title
    : localTitle;

  // Calculate average progress across all user ideas/ventures
  const averageProgress = (() => {
    if (!ventureSummaries || ventureSummaries.length === 0) return 0;
    const totalPercentage = ventureSummaries.reduce((sum, v) => {
      const total = v.totalCheckpoints || 36;
      const completed = v.completedCheckpoints || 0;
      return sum + (completed / total) * 100;
    }, 0);
    return Math.round(totalPercentage / ventureSummaries.length);
  })();

  const currentStreak = streak?.currentStreak ?? 0;
  // Streak label — just show day count. Distinguish loading / first day / active.
  let streakDetail: string;
  if (streak === undefined) {
    streakDetail = "Loading…";
  } else if (currentStreak > 0) {
    streakDetail = `${currentStreak} ${currentStreak === 1 ? "day" : "days"}`;
  } else {
    streakDetail = isAuthenticated ? "Starts on your first sign-in today" : "Sign in to start";
  }

  return (
    <div className="pt-3 space-y-4">
      {/* Level — single combined bar with average progress of all ideas */}
      <ProgressBar
        icon={<Trophy className="w-3.5 h-3.5 text-amber-400" />}
        iconBgClass="bg-amber-500/15 ring-1 ring-amber-500/30"
        label={`Lv ${level} — ${title}`}
        detail={`${averageProgress}% Avg Progress`}
        value={averageProgress}
        max={100}
        fillClass="bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300 shadow-[0_0_8px_rgba(251,191,36,0.45)]"
      />

      {/* Streak — count only, no progress bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-orange-500/15 ring-1 ring-orange-500/30">
            <Flame className="w-3.5 h-3.5 text-orange-300" />
          </span>
          <span className="text-sm font-medium text-foreground truncate">Day Streak</span>
        </div>
        <span className="text-sm font-semibold text-orange-200 tabular-nums shrink-0">
          {streakDetail}
        </span>
      </div>
    </div>
  );
};
