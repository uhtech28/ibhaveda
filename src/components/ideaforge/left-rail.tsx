"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { Tag } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import {
  cardSurface,
  CurrentUserProfile,
  displayFontClass,
  getInitials,
  IdeaForgeIdea,
  parseTags,
  transitionBase,
} from "@/components/ideaforge/shared";

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

const titleFor = (lv: number) => LEVEL_TABLE.find((l) => l.level === lv)?.title ?? "—";

export function IdeaForgeLeftRail({
  currentUser,
  userIdeas,
  onTagSelect,
}: {
  currentUser: CurrentUserProfile | null | undefined;
  userIdeas: IdeaForgeIdea[];
  onTagSelect: (value: string) => void;
}) {
  // Real, live backend data
  const levelProgress = useQuery(
    api.levels.getUserLevelProgress,
    currentUser?._id ? { userId: currentUser._id as Id<"users"> } : "skip"
  );

  // Level / title — prefer backend, fall back to local table & XP heuristic.
  const xp = currentUser?.xp || 0;
  const level = levelProgress?.level ?? currentUser?.level ?? Math.max(1, Math.floor(xp / 100) + 1);
  const title = (levelProgress?.title && levelProgress.title !== "Unknown")
    ? levelProgress.title
    : titleFor(level);

  // Smart bar target: walk the level table forward to find the FIRST threshold
  // strictly greater than the user's current points. The bar always represents
  // a real, achievable next milestone — never stuck "full". (Lv 4 needs 50 pts
  // but also a task gate; if a user with 74 pts is still at Lv 3 because of
  // the gate, we show "74 / 150 XP" toward Lv 5 instead.)
  const titlePoints = levelProgress?.titlePoints ?? xp;
  const targetLevel = (() => {
    for (let lv = level + 1; lv <= 50; lv++) {
      const def = LEVEL_TABLE.find((l) => l.level === lv);
      if (def && def.pts > titlePoints) return def;
    }
    return null;
  })();
  const isApex = targetLevel === null;
  const progress = isApex
    ? 100
    : Math.min(100, Math.round((titlePoints / targetLevel!.pts) * 100));

  const activeTags = Array.from(
    new Set(
      [
        ...(currentUser?.skills || []),
        ...userIdeas.flatMap((idea) => parseTags(idea.category)),
      ].filter(Boolean)
    )
  ).slice(0, 8);

  return (
    <aside className="hidden lg:block lg:w-[240px] lg:flex-shrink-0">
      <div
        className="
          sticky top-24
          max-h-[calc(100vh-6rem)]
          overflow-y-auto overscroll-contain
          space-y-4 pr-1 -mr-1
          [&::-webkit-scrollbar]:w-1.5
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-thumb]:bg-white/10
          [&::-webkit-scrollbar-track]:bg-transparent
        "
      >
        {/* Profile card */}
        <section className={cn(cardSurface, "relative overflow-hidden p-5")}>
          <div className="absolute inset-x-0 top-0 h-14 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.45),transparent_45%),linear-gradient(135deg,rgba(17,24,39,0.98),rgba(31,41,55,0.92))]" />
          <div className="relative">
            <Link
              href={currentUser?.username ? `/profile/${currentUser.username}` : "/profile-setup"}
              className="block group focus:outline-none"
              aria-label="Open my profile"
            >
              <Avatar className="h-10 w-10 ring-2 ring-[#6366F1] ring-offset-2 ring-offset-[#111827] transition-transform duration-200 group-hover:scale-[1.03]">
                <AvatarImage src={currentUser?.avatar} alt={currentUser?.displayName} />
                <AvatarFallback className="bg-[#1B2440] text-white text-sm">
                  {getInitials(currentUser?.displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="mt-3">
                <h2 className={cn(displayFontClass, "text-base font-semibold text-[#F9FAFB] truncate group-hover:text-white")}>
                  {currentUser?.displayName || "InteractiveIdeas Member"}
                </h2>
              </div>
            </Link>

            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-[#F9FAFB]">
                <span className="flex flex-col">
                  <span className="font-semibold">Level {level}</span>
                  <span className="text-[10px] uppercase tracking-wider text-[#7C86A2]">
                    {title}
                  </span>
                </span>
                <span className="text-[#9CA3AF] tabular-nums text-xs">
                  {isApex
                    ? `${titlePoints.toLocaleString()} XP · Apex`
                    : `${titlePoints.toLocaleString()} / ${targetLevel!.pts.toLocaleString()} XP`}
                </span>
              </div>
              <Progress
                value={progress}
                className="mt-3 h-2 bg-[#20293B] [&>div]:bg-[linear-gradient(90deg,#6366F1,#8B5CF6)]"
              />
            </div>
          </div>
        </section>

        {/* Navigation menu removed — navbar covers Feed / My Ideas / Community. */}

        {/* Active tags */}
        <section className={cn(cardSurface, "p-4")}>
          <div className="flex items-center gap-2 text-sm text-[#F9FAFB]">
            <Tag className="h-4 w-4 text-[#6366F1]" />
            <span className={cn(displayFontClass, "font-semibold")}>Your Active Tags</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {activeTags.length > 0 ? (
              activeTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onTagSelect(tag)}
                  className={cn(
                    transitionBase,
                    "rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-[11px] text-[#C7D2FE] hover:border-[#6366F1]/40 hover:bg-[#6366F1]/10"
                  )}
                >
                  #{tag}
                </button>
              ))
            ) : (
              <p className="text-sm text-[#9CA3AF]">
                Post a few ideas and your strongest topics will show up here.
              </p>
            )}
          </div>
        </section>
      </div>
    </aside>
  );
}
