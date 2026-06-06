"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "convex/react";
import { ArrowUpRight, Flame, MessageCircle } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BadgeItem, getNormalizedRarity, getVentureBadgeEmoji } from "@/components/badges/BadgeCard";
import { PremiumIcon } from "@/components/ui/PremiumIcon";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { useChat } from "@/components/chat/ChatContext";
import {
  BuilderSuggestion,
  cardSurface,
  CurrentUserProfile,
  displayFontClass,
  getInitials,
  IdeaForgeIdea,
  isAgentRole,
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

const rarityRank: Record<string, number> = {
  mythic: 6,
  legendary: 5,
  hidden: 5,
  diamond: 4,
  epic: 4,
  gold: 3,
  rare: 3,
  silver: 2,
  uncommon: 2,
  bronze: 1,
  common: 1,
};

function SuggestedBuilderCard({ builder }: { builder: BuilderSuggestion }) {
  const displayName = builder.displayName || builder.username || "Builder";
  const profileHref = builder.username ? `/profile/${builder.username}` : "/community";
  const builderId = (builder._id || builder.id) as Id<"users"> | undefined;
  const { openChatWithUser } = useChat();

  return (
    <div className="flex items-center gap-2 py-1">
      <Link href={profileHref} className="shrink-0" aria-label={`View ${displayName}'s profile`}>
        <Avatar className="h-8 w-8">
          <AvatarImage src={builder.avatar} alt={displayName} />
          <AvatarFallback className="bg-[#1B2440] text-xs text-white">{getInitials(displayName)}</AvatarFallback>
        </Avatar>
      </Link>
      <Link href={profileHref} className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[#F9FAFB] transition-colors hover:text-[#C7D2FE]">{displayName}</p>
      </Link>
      <Button
        type="button"
        size="icon"
        onClick={() => { if (builderId) openChatWithUser(builderId); }}
        disabled={!builderId}
        aria-label={`Message ${displayName}`}
        title={`Message ${displayName}`}
        className="h-8 w-8 rounded-[9px] border border-white/8 bg-white/[0.04] p-0 text-[#AEB7D8] shadow-none hover:border-[#6366F1]/25 hover:bg-[#6366F1]/10 hover:text-[#E0E7FF] disabled:opacity-50"
      >
        <MessageCircle className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function IdeaForgeLeftRail({
  currentUser,
}: {
  currentUser: CurrentUserProfile | null | undefined;
  userIdeas: IdeaForgeIdea[];
  onTagSelect: (value: string) => void;
}) {
  // Real, live backend data
  const levelProgress = useQuery(
    api.levels.getUserLevelProgress,
    currentUser?._id ? { userId: currentUser._id as any } : "skip"
  );

  const streak = useQuery(
    api.gamification.getUserStreak,
    currentUser?._id ? { userId: currentUser._id as any } : "skip"
  );

  const earnedBadges = useQuery(
    api.badges.getUserProfileBadges,
    currentUser?._id ? { userId: currentUser._id as any } : "skip"
  );

  // Level / title — prefer backend, fall back to local table & XP heuristic.
  const xp = currentUser?.xp || 0;
  const level = levelProgress?.level ?? currentUser?.level ?? Math.max(1, Math.floor(xp / 100) + 1);
  const title = (levelProgress?.title && levelProgress.title !== "Unknown")
    ? levelProgress.title
    : titleFor(level);
  const titlePoints = levelProgress?.titlePoints ?? 0;
  const nextLevelPoints = levelProgress?.nextLevelPoints ?? null;
  const xpDetail = levelProgress === undefined
    ? "Loading..."
    : nextLevelPoints && nextLevelPoints > 0
      ? `${titlePoints} / ${nextLevelPoints} XP`
      : `${titlePoints} XP`;
  const xpProgress = levelProgress?.progress ?? 0;
  const currentStreak = streak?.currentStreak ?? 0;
  const streakDetail = streak === undefined
    ? "Loading..."
    : currentStreak > 0
      ? `${currentStreak} ${currentStreak === 1 ? "day" : "days"}`
      : "1 Day Streak";
  const suggested = useQuery(api.users.getSuggestedCollaborators, currentUser
    ? {
        skills: currentUser.skills || [],
        industries: currentUser.industries || (currentUser.industry ? [currentUser.industry] : []),
        limit: 8,
        excludeUserId: currentUser.clerkId,
      }
    : "skip");
  const allUsers = useQuery(api.users.getAllUsers);

  const builders = useMemo(() => {
    const isNonAgent = (user: BuilderSuggestion | CurrentUserProfile) => !isAgentRole(user.role);

    if (suggested && suggested.length > 0) {
      return suggested.filter(isNonAgent).slice(0, 5);
    }
    return (allUsers || [])
      .filter((user) => user._id !== currentUser?._id && isNonAgent(user))
      .slice(0, 5)
      .map((user) => ({
        _id: user._id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        skills: user.skills,
        role: user.role,
      }));
  }, [allUsers, currentUser?._id, suggested]);

  const profileBadges = useMemo(() => {
    if (!earnedBadges) return [] as BadgeItem[];

    const equippedBadgeIds = currentUser?.equippedBadges || [];
    const equipped = earnedBadges.filter((badge) => equippedBadgeIds.includes(badge.id));
    const list = [...equipped];

    if (list.length < 3) {
      const remaining = earnedBadges
        .filter((badge) => !equipped.some((equippedBadge) => equippedBadge.id === badge.id))
        .sort((a, b) => {
          const rankA = rarityRank[a.rarity] || 0;
          const rankB = rarityRank[b.rarity] || 0;
          if (rankA !== rankB) return rankB - rankA;
          return (b.awardedAt || 0) - (a.awardedAt || 0);
        });

      list.push(...remaining.slice(0, 3 - list.length));
    }

    return list.slice(0, 3) as BadgeItem[];
  }, [currentUser?.equippedBadges, earnedBadges]);

  return (
    <aside className="hidden xl:block xl:w-[280px] xl:flex-shrink-0">
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
        <section className={cn(cardSurface, "relative overflow-hidden p-3.5")}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.22),transparent_38%),linear-gradient(135deg,rgba(17,24,39,0.98),rgba(17,24,39,0.92))]" />
          <div className="relative">
            <div className="flex items-start gap-3">
              <Link
                href={currentUser?.username ? `/profile/${currentUser.username}` : "/profile-setup"}
                className="shrink-0 group focus:outline-none"
                aria-label="Open my profile"
              >
                <div className="relative">
                  <Avatar className="h-14 w-14 border-2 border-black/70 ring-2 ring-[#6D5DF6] transition-transform duration-200 group-hover:scale-[1.03]">
                    <AvatarImage src={currentUser?.avatar} alt={currentUser?.displayName} />
                    <AvatarFallback className="bg-[#4D2DB5] text-2xl text-white">
                      {getInitials(currentUser?.displayName).slice(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-1.5">
                  <Link
                    href={currentUser?.username ? `/profile/${currentUser.username}` : "/profile-setup"}
                    className="min-w-0 group focus:outline-none"
                    aria-label="Open my profile"
                  >
                    <h2 className={cn(displayFontClass, "truncate text-base font-semibold text-[#F9FAFB] group-hover:text-white")}>
                      {currentUser?.displayName || "Ibhaveda Member"}
                    </h2>
                  </Link>
                </div>
                <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
                  {currentUser?.username && (
                    <p className="min-w-0 truncate text-xs text-[#9CA3AF]">@{currentUser.username}</p>
                  )}
                  {profileBadges.length > 0 && (
                    <div className="flex shrink-0 items-center gap-1">
                      {profileBadges.map((badge) => {
                        const norm = getNormalizedRarity(badge.rarity);
                        const accentColor = badge.secondaryColor || norm.accentColor;

                        return (
                          <span
                            key={badge.id}
                            title={`${badge.name}: ${badge.description}`}
                            className="inline-flex h-4 w-4 items-center justify-center rounded-[5px]"
                            style={{
                              backgroundColor: `${accentColor}20`,
                              border: `1px solid ${accentColor}80`,
                              color: accentColor,
                              boxShadow: `0 0 6px ${accentColor}35`,
                            }}
                          >
                            <PremiumIcon
                              name={badge.icon || getVentureBadgeEmoji(badge.id, badge.name)}
                              className="h-2.5 w-2.5"
                              strokeWidth={1.7}
                            />
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {currentUser?.bio && (
              <p className="mt-2.5 truncate text-sm text-[#D1D5DB]">
                {currentUser.bio}
              </p>
            )}

            <div className="mt-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-black">
                    {level}
                  </span>
                  <span className="truncate text-sm font-semibold text-[#F9FAFB]">{title}</span>
                </div>
                <span className="shrink-0 text-[11px] text-[#9CA3AF] tabular-nums">{xpDetail}</span>
              </div>
              <Progress
                value={Math.min(100, Math.round((xpProgress / 100) * 100))}
                className="mt-2 h-1.5 bg-white/[0.06] [&>div]:bg-[linear-gradient(90deg,#FBBF24,#F97316,#FDE047)]"
              />
            </div>

            <div className="mt-2.5 flex items-center justify-end gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-orange-500/15 ring-1 ring-orange-500/30">
                <Flame className="h-3 w-3 text-orange-300" />
              </span>
              <span className="text-sm font-semibold text-orange-200 tabular-nums">{streakDetail}</span>
            </div>
          </div>
        </section>

        {/* Navigation menu removed — navbar covers Feed / My Ideas / Community. */}

        {/* Suggested builders */}
        <section className={cn(cardSurface, "p-4")}>
          <div className="flex items-center justify-between">
            <h3 className={cn(displayFontClass, "text-base font-semibold text-[#F9FAFB]")}>Suggested Builders</h3>
            <ArrowUpRight className="h-4 w-4 text-[#9CA3AF]" />
          </div>
          <div className="mt-3 space-y-1">
            {builders.length > 0 ? builders.map((builder) => (
              <SuggestedBuilderCard key={builder._id?.toString() || builder.username} builder={builder as BuilderSuggestion} />
            )) : (
              <p className="text-sm text-[#9CA3AF]">We are lining up collaborators based on your profile and recent ideas.</p>
            )}
          </div>
        </section>
      </div>
    </aside>
  );
}
