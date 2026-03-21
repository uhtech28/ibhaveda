"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "convex/react";
import { ArrowUpRight, Flame, Trophy, Zap } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { api } from "@convex/_generated/api";
import { cn } from "@/lib/utils";
import {
  BuilderSuggestion,
  cardSurface,
  CurrentUserProfile,
  displayFontClass,
  getDisplayName,
  getInitials,
  IdeaForgeIdea,
  parseTags,
  transitionBase,
} from "@/components/ideaforge/shared";

function SuggestedBuilderCard({ builder }: { builder: BuilderSuggestion }) {
  const displayName = builder.displayName || builder.username || "Builder";
  const primarySkill = builder.skills?.[0] || "Creative strategy";
  const profileHref = builder.username ? `/profile/${builder.username}` : "/community";

  return (
    <div className="flex items-center gap-3 rounded-[14px] border border-white/7 bg-white/[0.03] p-3">
      <Avatar className="h-11 w-11">
        <AvatarImage src={builder.avatar} alt={displayName} />
        <AvatarFallback className="bg-[#1B2440] text-white">{getInitials(displayName)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[#F9FAFB]">{displayName}</p>
        <p className="truncate text-xs text-[#9CA3AF]">{primarySkill}</p>
      </div>
      <Button asChild size="sm" className="h-8 rounded-[10px] bg-[#6366F1]/12 px-3 text-[#C7D2FE] hover:bg-[#6366F1] hover:text-white">
        <Link href={profileHref}>Follow</Link>
      </Button>
    </div>
  );
}

export function IdeaForgeRightRail({
  currentUser,
  publicIdeas,
}: {
  currentUser: CurrentUserProfile | null | undefined;
  publicIdeas: IdeaForgeIdea[];
}) {
  const suggested = useQuery(api.users.getSuggestedCollaborators, currentUser
    ? {
        skills: currentUser.skills || [],
        industries: currentUser.industries || (currentUser.industry ? [currentUser.industry] : []),
        limit: 3,
        excludeUserId: currentUser.clerkId,
      }
    : "skip");
  const allUsers = useQuery(api.users.getAllUsers);

  const trendingIdeas = useMemo(() => {
    return [...publicIdeas]
      .sort((a, b) => (b.sparkCount || 0) - (a.sparkCount || 0) || b.createdAt - a.createdAt)
      .slice(0, 5);
  }, [publicIdeas]);

  const builders = useMemo(() => {
    if (suggested && suggested.length > 0) {
      return suggested.slice(0, 3);
    }

    return (allUsers || [])
      .filter((user) => user._id !== currentUser?._id)
      .slice(0, 3)
      .map((user) => ({
        _id: user._id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        skills: user.skills,
      }));
  }, [allUsers, currentUser?._id, suggested]);

  return (
    <aside className="hidden xl:block xl:w-[280px] xl:flex-shrink-0">
      <div className="sticky top-28 space-y-4">
        <section className={cn(cardSurface, "p-5")}>
          <div className="flex items-center justify-between">
            <h3 className={cn(displayFontClass, "text-base font-semibold text-[#F9FAFB]")}>Trending Ideas This Week</h3>
            <Flame className="h-4 w-4 text-[#F59E0B]" />
          </div>
          <div className="mt-4 space-y-3">
            {trendingIdeas.length > 0 ? (
              trendingIdeas.map((idea, index) => (
                <Link
                  key={idea._id}
                  href={`/idea/${idea._id}`}
                  className={cn(
                    transitionBase,
                    "flex items-start gap-3 rounded-[14px] border border-transparent px-2 py-2 hover:border-[#6366F1]/35 hover:bg-white/[0.03]"
                  )}
                >
                  <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#6366F1]/14 text-xs font-semibold text-[#C7D2FE]">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium text-[#F9FAFB]">{idea.title}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-[#9CA3AF]">
                      <span>{idea.sparkCount || 0} sparks</span>
                      <span className="h-1 w-1 rounded-full bg-[#4B5563]" />
                      <span>{parseTags(idea.category)[0] || getDisplayName(idea.author)}</span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-[#9CA3AF]">Trending ideas will show up here as the feed warms up.</p>
            )}
          </div>
        </section>

        <section className={cn(cardSurface, "p-5")}>
          <div className="flex items-center justify-between">
            <h3 className={cn(displayFontClass, "text-base font-semibold text-[#F9FAFB]")}>Suggested Builders</h3>
            <ArrowUpRight className="h-4 w-4 text-[#9CA3AF]" />
          </div>
          <div className="mt-4 space-y-3">
            {builders.length > 0 ? builders.map((builder) => <SuggestedBuilderCard key={builder._id || builder.id || builder.username} builder={builder} />) : (
              <p className="text-sm text-[#9CA3AF]">We are lining up collaborators based on your profile and recent ideas.</p>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-[16px] border border-[#10B981]/18 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.24),transparent_36%),linear-gradient(160deg,#101826,#111827_62%,#0b1220)] p-5 shadow-[0_14px_42px_rgba(16,185,129,0.08)]">
          <div className="flex items-center gap-2 text-[#A7F3D0]">
            <Trophy className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em]">Active Challenge</span>
          </div>
          <h3 className={cn(displayFontClass, "mt-4 text-xl font-semibold text-white")}>Build in Public Sprint</h3>
          <p className="mt-2 text-sm leading-6 text-[#D1FAE5]/78">
            Share one polished idea update, spark three founders, and leave one actionable comment to unlock this week&apos;s bonus.
          </p>
          <div className="mt-5 flex items-center justify-between rounded-[14px] border border-white/8 bg-black/20 px-4 py-3">
            <div>
              <p className="text-xs text-[#A7F3D0]">Reward</p>
              <p className="text-lg font-semibold text-white">+120 XP</p>
            </div>
            <div className="rounded-full bg-[#10B981]/12 p-3 text-[#34D399]">
              <Zap className="h-5 w-5" />
            </div>
          </div>
        </section>
      </div>
    </aside>
  );
}

