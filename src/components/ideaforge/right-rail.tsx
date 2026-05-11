"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "convex/react";
import { ArrowUpRight, Flame, MessageCircle } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { useChat } from "@/components/chat/ChatContext";
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
  const builderId = (builder._id || builder.id) as Id<"users"> | undefined;
  const { openChatWithUser } = useChat();

  return (
    <div className="flex items-center gap-3 rounded-[14px] border border-white/7 bg-white/[0.03] p-3">
      <Link href={profileHref} className="shrink-0" aria-label={`View ${displayName}'s profile`}>
        <Avatar className="h-11 w-11">
          <AvatarImage src={builder.avatar} alt={displayName} />
          <AvatarFallback className="bg-[#1B2440] text-white">{getInitials(displayName)}</AvatarFallback>
        </Avatar>
      </Link>
      <Link href={profileHref} className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[#F9FAFB] hover:text-[#C7D2FE] transition-colors">{displayName}</p>
        <p className="truncate text-xs text-[#9CA3AF]">{primarySkill}</p>
      </Link>
      <Button
        type="button"
        size="sm"
        onClick={() => { if (builderId) openChatWithUser(builderId); }}
        disabled={!builderId}
        aria-label={`Message ${displayName}`}
        title={`Message ${displayName}`}
        className="h-8 rounded-[10px] bg-[#6366F1]/15 px-3 text-[#C7D2FE] hover:bg-[#6366F1] hover:text-white inline-flex items-center gap-1.5 disabled:opacity-50"
      >
        <MessageCircle className="h-3.5 w-3.5" />
        <span>Message</span>
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

  // Top-3 trending — kept tight so the right rail's vertical length matches
  // the left feed column at roughly the same scroll position.
  const TRENDING_LIMIT = 3;
  const trendingIdeas = useMemo(() => {
    return [...publicIdeas]
      .sort(
        (a, b) =>
          (b.sparkCount || 0) - (a.sparkCount || 0) ||
          b.createdAt - a.createdAt
      )
      .slice(0, TRENDING_LIMIT);
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
          <div className="mt-3 space-y-2">
            {trendingIdeas.length > 0 ? (
              trendingIdeas.map((idea, index) => (
                <Link
                  key={idea._id}
                  href={`/idea/${idea._id}`}
                  className={cn(
                    transitionBase,
                    "flex items-start gap-3 rounded-[12px] border border-transparent px-2 py-1.5 hover:border-[#6366F1]/35 hover:bg-white/[0.03]"
                  )}
                >
                  <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#6366F1]/14 text-[11px] font-semibold text-[#C7D2FE]">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium text-[#F9FAFB]">{idea.title}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[#9CA3AF]">
                      <span>{idea.sparkCount || 0} sparks</span>
                      <span className="h-1 w-1 rounded-full bg-[#4B5563]" />
                      <span className="truncate">{parseTags(idea.category)[0] || getDisplayName(idea.author)}</span>
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
      </div>
    </aside>
  );
}