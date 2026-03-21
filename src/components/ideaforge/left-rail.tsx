"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { Flame, Home, Lightbulb, Sparkles, Tag, TrendingUp, Users } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { api } from "@convex/_generated/api";
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

const navItems = [
  { key: "feed", label: "Feed", icon: Home },
  { key: "ideas", label: "My Ideas", icon: Lightbulb },
  { key: "hot", label: "Trending", icon: TrendingUp },
  { key: "saved", label: "Saved", icon: Sparkles },
  { key: "community", label: "Community", icon: Users },
] as const;

export function IdeaForgeLeftRail({
  currentUser,
  mode,
  userIdeas,
  onOpenComposer,
  onTagSelect,
  onOpenFeedTab,
  onOpenMyIdeasTab,
}: {
  currentUser: CurrentUserProfile | null | undefined;
  mode: "feed" | "my-ideas";
  userIdeas: IdeaForgeIdea[];
  onOpenComposer: () => void;
  onTagSelect: (value: string) => void;
  onOpenFeedTab: (key: "for-you" | "latest" | "hot" | "following") => void;
  onOpenMyIdeasTab: (key: "ideas" | "saved" | "drafts" | "analytics") => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const wallet = useQuery(api.gamification.getWallet);
  const streak = useQuery(api.gamification.getStreak);

  const ideasPosted = userIdeas.length;
  const totalSparks = userIdeas.reduce((sum, idea) => sum + (idea.sparkCount || 0), 0);
  const xp = currentUser?.xp || 0;
  const level = currentUser?.level || Math.max(1, Math.floor(xp / 100) + 1);
  const progress = Math.min(100, Math.max(8, xp % 100 === 0 && xp > 0 ? 100 : xp % 100));
  const activeTags = Array.from(
    new Set(
      [
        ...(currentUser?.skills || []),
        ...userIdeas.flatMap((idea) => parseTags(idea.category)),
      ].filter(Boolean)
    )
  ).slice(0, 8);

  const handleNav = (key: (typeof navItems)[number]["key"]) => {
    if (key === "community") {
      router.push("/community");
      return;
    }

    if (key === "feed") {
      if (mode === "feed") {
        onOpenFeedTab("for-you");
      } else {
        router.push("/feed");
      }
      return;
    }

    if (key === "ideas") {
      if (mode === "my-ideas") {
        onOpenMyIdeasTab("ideas");
      } else {
        router.push("/my-ideas");
      }
      return;
    }

    if (key === "hot") {
      if (mode === "feed") {
        onOpenFeedTab("hot");
      } else {
        router.push("/feed");
      }
      return;
    }

    if (key === "saved") {
      if (mode === "my-ideas") {
        onOpenMyIdeasTab("saved");
      } else {
        router.push("/my-ideas");
      }
    }
  };

  return (
    <aside className="hidden xl:block xl:w-[240px] xl:flex-shrink-0">
      <div className="sticky top-28 space-y-4">
        <section className={cn(cardSurface, "relative overflow-hidden p-5")}>
          <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.45),transparent_45%),linear-gradient(135deg,rgba(17,24,39,0.98),rgba(31,41,55,0.92))]" />
          <div className="relative">
            <Avatar className="h-14 w-14 ring-2 ring-[#6366F1] ring-offset-4 ring-offset-[#111827]">
              <AvatarImage src={currentUser?.avatar} alt={currentUser?.displayName} />
              <AvatarFallback className="bg-[#1B2440] text-white">{getInitials(currentUser?.displayName)}</AvatarFallback>
            </Avatar>
            <div className="mt-4">
              <h2 className={cn(displayFontClass, "text-lg font-semibold text-[#F9FAFB]")}>{currentUser?.displayName || "InteractiveIdeas Member"}</h2>
              <div className="mt-2 inline-flex items-center rounded-full border border-[#6366F1]/30 bg-[#6366F1]/12 px-3 py-1 text-[11px] font-medium text-[#C7D2FE]">
                {currentUser?.role === "admin" ? "AI Curator" : "Builder"}
              </div>
            </div>

            <div className="mt-5 rounded-[14px] border border-white/8 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between text-sm text-[#F9FAFB]">
                <span>Level {level}</span>
                <span className="text-[#9CA3AF]">{xp} XP</span>
              </div>
              <Progress value={progress} className="mt-3 h-2.5 bg-[#20293B] [&>div]:bg-[linear-gradient(90deg,#6366F1,#8B5CF6)]" />
              <div className="mt-3 flex items-center justify-between text-xs text-[#9CA3AF]">
                <span>{wallet?.balance || 0} sparks banked</span>
                <span>{streak?.currentStreak || 0} day streak</span>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 rounded-[14px] border border-white/8 bg-[#0A0D12]/70 p-4 text-sm">
              <div>
                <div className="text-[#F9FAFB]">{ideasPosted}</div>
                <div className="text-xs text-[#9CA3AF]">Ideas Posted</div>
              </div>
              <div>
                <div className="text-[#F9FAFB]">{totalSparks}</div>
                <div className="text-xs text-[#9CA3AF]">Upvotes</div>
              </div>
            </div>
          </div>
        </section>

        <section className={cn(cardSurface, "p-3")}>
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                (item.key === "feed" && pathname === "/feed" && mode === "feed") ||
                (item.key === "ideas" && pathname?.startsWith("/my-ideas") && mode === "my-ideas") ||
                (item.key === "community" && pathname?.startsWith("/community"));

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleNav(item.key)}
                  className={cn(
                    transitionBase,
                    "flex w-full items-center gap-3 rounded-[14px] px-3 py-3 text-left text-sm",
                    isActive
                      ? "bg-[#6366F1]/14 text-white shadow-[inset_0_0_0_1px_rgba(99,102,241,0.28)]"
                      : "text-[#9CA3AF] hover:bg-white/[0.03] hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </section>

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
              <p className="text-sm text-[#9CA3AF]">Post a few ideas and your strongest topics will show up here.</p>
            )}
          </div>
        </section>

        <Button
          type="button"
          onClick={onOpenComposer}
          className="h-11 w-full rounded-[10px] bg-[#6366F1] text-white shadow-[0_8px_32px_rgba(99,102,241,0.15)] hover:bg-[#8B5CF6]"
        >
          <Flame className="mr-2 h-4 w-4" />
          Invite a Builder
        </Button>
      </div>
    </aside>
  );
}


