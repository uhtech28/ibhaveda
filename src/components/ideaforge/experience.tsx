"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "convex/react";
import {
  BarChart3,
  Eye,
  Flame,
  Globe,
  Grid2X2,
  LayoutList,
  Lightbulb,
  Lock,
  Map,
  Compass,
  Loader2,
  MessageSquare,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { api } from "@convex/_generated/api";
import { cn } from "@/lib/utils";

import {
  EmptyState,
  FilterTabs,
  feedTabs,
  IdeaCardSkeleton,
  IdeaStoryCard,
  myIdeaTabs,
} from "@/components/ideaforge/idea-cards";
import { IdeaForgeLeftRail } from "@/components/ideaforge/left-rail";
import { IdeaForgeNavbar } from "@/components/ideaforge/navbar";
import { IdeaForgeRightRail } from "@/components/ideaforge/right-rail";
import { FloatingChatButton } from "@/components/chat/FloatingChatButton";
import { IdeaWizard } from "@/components/ideas/IdeaWizard";
import {
  cardSurface,
  ComposerDraft,
  CurrentUserProfile,
  displayFontClass,
  FeedTabKey,
  IdeaForgeIdea,
  matchesSearch,
  MyIdeasTabKey,
  shellMax,
  transitionBase,
  ViewMode,
} from "@/components/ideaforge/shared";

const SAVED_STORAGE_KEY = "ideaforge-saved-ideas";

function usePersistentIds(key: string) {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setIds(parsed.filter((entry) => typeof entry === "string"));
        }
      }
    } catch {
      setIds([]);
    }
  }, [key]);

  const update = (next: string[]) => {
    setIds(next);
    window.localStorage.setItem(key, JSON.stringify(next));
  };

  return [ids, update] as const;
}

function useDelayedLoading(isLoading: boolean, delayMs = 400) {
  const [showSkeleton, setShowSkeleton] = useState(false);
  useEffect(() => {
    if (!isLoading) { setShowSkeleton(false); return; }
    const timer = setTimeout(() => setShowSkeleton(true), delayMs);
    return () => clearTimeout(timer);
  }, [isLoading, delayMs]);
  return showSkeleton;
}

export function IdeaForgeExperience({
  mode,
  currentUser,
  ideas,
  isLoading,
  searchQuery,
  onSearchChange,
  onSpark,
  onIdeaClick,
  onCommentClick,
  onContributeClick,
  onDeleteIdea,
  isProfileComplete,
  onCompleteProfile,
  onLoadMore,
  hasMore = false,
  tutorialDraft,
  tutorialOpenCompose,
}: {
  mode: "feed" | "my-ideas";
  currentUser: CurrentUserProfile | null | undefined;
  ideas: IdeaForgeIdea[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSpark: (ideaId: string) => void;
  onIdeaClick: (ideaId: string) => void;
  onCommentClick: (ideaId: string) => void;
  onContributeClick?: (ideaId: string) => void;
  onDeleteIdea?: (ideaId: string) => void;
  isProfileComplete: boolean;
  onCompleteProfile: () => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  /** First-run tour draft. When the user opens the wizard during the
   *  tour's compose phase, this seeds the form and turns on the
   *  tutorial countdown / auto-submit. */
  tutorialDraft?: Partial<ComposerDraft>;
  tutorialOpenCompose?: boolean;
}) {
  const router = useRouter();
  const publicIdeas = useQuery(api.ideas.getPublicIdeas, { limit: 60 }) || [];
  const showSkeleton = useDelayedLoading(isLoading);

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasMoreRef = useRef(hasMore);
  const onLoadMoreRef = useRef(onLoadMore);
  hasMoreRef.current = hasMore;
  onLoadMoreRef.current = onLoadMore;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreRef.current) {
          onLoadMoreRef.current?.();
        }
      },
      { threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);
  
  // Real backend signals for the Analytics tab (Co-dev change)
  const wallet = useQuery(api.gamification.getWallet);
  const streak = useQuery(api.gamification.getStreak);

  // User UI Components state
  const [wizardDraft, setWizardDraft] = useState<Partial<ComposerDraft> | undefined>(undefined);
  
  const [feedTab, setFeedTab] = useState<FeedTabKey>("for-you");
  const [myIdeasTab, setMyIdeasTab] = useState<MyIdeasTabKey>("public");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [savedIdeaIds, setSavedIdeaIds] = usePersistentIds(SAVED_STORAGE_KEY);
  
  // Co-dev Wizard state
  const [showIdeaWizard, setShowIdeaWizard] = useState(false);
  // Set true when the wizard was opened during the first-run tour, so
  // tutorialMode (auto-submit countdown) is on. Cleared on close.
  const [wizardTutorialMode, setWizardTutorialMode] = useState(false);

  const filteredFeedIdeas = useMemo(() => {
    const searchable = ideas.filter((idea) => matchesSearch(idea, searchQuery));

    // "For You" — backend already returns ideas in the correct interleaved order
    // (human posts first, then mixed). Preserve that order; only filter by search.
    if (feedTab === "for-you") {
      return searchable;
    }

    if (feedTab === "latest") {
      return [...searchable].sort((a, b) => b.createdAt - a.createdAt);
    }

    if (feedTab === "following") {
      const interests = new Set([
        ...(currentUser?.skills || []),
        ...(currentUser?.industries || []),
        ...(currentUser?.industry ? [currentUser.industry] : []),
      ].map((entry) => entry.toLowerCase()));

      return [...searchable].sort((a, b) => {
        const aText = `${a.category} ${a.industries || ""}`.toLowerCase();
        const bText = `${b.category} ${b.industries || ""}`.toLowerCase();
        const aScore = Array.from(interests).some((interest) => aText.includes(interest)) ? 1 : 0;
        const bScore = Array.from(interests).some((interest) => bText.includes(interest)) ? 1 : 0;
        return bScore - aScore || b.createdAt - a.createdAt;
      });
    }

    return [...searchable].sort((a, b) => {
      const aScore = (a.sparkCount || 0) * 4 + Math.round((Date.now() - a.createdAt) / -3600000);
      const bScore = (b.sparkCount || 0) * 4 + Math.round((Date.now() - b.createdAt) / -3600000);
      return bScore - aScore;
    });
  }, [currentUser?.industry, currentUser?.industries, currentUser?.skills, feedTab, ideas, searchQuery]);

  const searchedMyIdeas = useMemo(() => {
    return ideas.filter((idea) => matchesSearch(idea, searchQuery));
  }, [ideas, searchQuery]);

  const currentIdeas = mode === "feed" ? filteredFeedIdeas : searchedMyIdeas;

  const toggleSaved = (ideaId: string) => {
    if (savedIdeaIds.includes(ideaId)) {
      setSavedIdeaIds(savedIdeaIds.filter((entry) => entry !== ideaId));
      return;
    }
    setSavedIdeaIds([...savedIdeaIds, ideaId]);
  };

  const openWizard = () => {
    // Tour compose phase: turn on tutorialMode so the wizard highlights
    // the outline textarea and the preview-step countdown auto-submits
    // once the AI has filled the form. We deliberately do NOT pre-fill
    // — the user types their own description, then lets the AI expand.
    setWizardDraft(undefined);
    setWizardTutorialMode(!!tutorialOpenCompose);
    setShowIdeaWizard(true);
  };

  const openComposerWithDraft = (draft?: Partial<ComposerDraft>) => {
    setWizardDraft(draft);
    setShowIdeaWizard(true);
  };

  return (
    <div className="min-h-screen bg-[#0A0D12] pb-28 text-[#F9FAFB]">
      <IdeaForgeNavbar 
        currentUser={currentUser} 
        searchQuery={searchQuery} 
        onSearchChange={onSearchChange} 
        onOpenComposer={openWizard} 
      />

      <main className={cn(shellMax, "px-4 pb-12 pt-16 sm:px-6 lg:pt-28 xl:px-8")}>
        <div className="flex items-start justify-center gap-6">
          <IdeaForgeLeftRail
            currentUser={currentUser}
            userIdeas={ideas}
            onTagSelect={onSearchChange}
          />

          <section className="min-w-0 w-full max-w-[720px] flex-none">
            <div className="w-full space-y-5">
              {mode === "feed" ? (
                <>
                  {!isProfileComplete && (
                    <section className="rounded-[16px] border border-[#F59E0B]/20 bg-[#2A1A07]/70 p-5 text-[#FCD34D]">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h2 className={cn(displayFontClass, "text-lg font-semibold text-[#F9FAFB]")}>Complete your profile</h2>
                          <p className="mt-2 text-sm leading-6 text-[#D1D5DB]">Add a bit more context to help builders trust your ideas and discover the right collaboration opportunities.</p>
                        </div>
                        <Button type="button" onClick={onCompleteProfile} className="rounded-[10px] bg-[#6366F1] text-white hover:bg-[#8B5CF6]">
                          Complete Profile
                        </Button>
                      </div>
                    </section>
                  )}
                  <FilterTabs tabs={feedTabs} activeKey={feedTab} onChange={setFeedTab} />
                </>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h1 className={cn(displayFontClass, "text-2xl font-semibold text-white")}>My Ideas</h1>
                      <p className="text-sm text-[#9CA3AF]">Your posted ideas, drafts, and saved concepts.</p>
                    </div>
                    <div className="hidden md:flex items-center gap-2">
                      <button type="button" onClick={() => setViewMode("grid")} className={cn(transitionBase, "rounded-[10px] p-2", viewMode === "grid" ? "bg-[#6366F1]/14 text-[#C7D2FE]" : "text-[#9CA3AF] hover:bg-white/[0.04] hover:text-white")} aria-label="Grid view">
                        <Grid2X2 className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => setViewMode("list")} className={cn(transitionBase, "rounded-[10px] p-2", viewMode === "list" ? "bg-[#6366F1]/14 text-[#C7D2FE]" : "text-[#9CA3AF] hover:bg-white/[0.04] hover:text-white")} aria-label="List view">
                        <LayoutList className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <FilterTabs tabs={myIdeaTabs} activeKey={myIdeasTab} onChange={setMyIdeasTab} />
                </>
              )}

              {showSkeleton ? (
                <div className="space-y-5">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <IdeaCardSkeleton key={index} />
                  ))}
                </div>
              ) : mode === "feed" ? (
                currentIdeas.length > 0 ? (
                  <div className="space-y-5">
                    {currentIdeas.map((idea) => {
                      const isMyIdea = idea.authorId === currentUser?._id;
                      return (
                        <IdeaStoryCard
                          key={idea._id}
                          idea={idea}
                          saved={savedIdeaIds.includes(idea._id)}
                          onToggleSave={toggleSaved}
                          onOpenIdea={onIdeaClick}
                          onSpark={onSpark}
                          onComment={onCommentClick}
                          onContribute={isMyIdea ? undefined : onContributeClick}
                          onRepost={openComposerWithDraft}
                          onSelectTag={onSearchChange}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState
                    title="Nothing matched this feed yet"
                    description="Try another search, switch to a different feed tab, or post the spark that should exist here."
                    actionLabel="+ Post an Idea"
                    onAction={openWizard}
                  />
                )
              ) : myIdeasTab === "analytics" ? (
                <MyIdeasAnalytics
                  ideas={ideas}
                  walletBalance={wallet?.balance || 0}
                  currentStreak={streak?.currentStreak || 0}
                  onOpenIdea={onIdeaClick}
                />
              ) : (() => {
                const visibleIdeas = currentIdeas.filter((idea) =>
                  myIdeasTab === "private"
                    ? idea.visibility === "private"
                    : idea.visibility === "public"
                );

                if (visibleIdeas.length === 0) {
                  return (
                    <EmptyState
                      title={
                        myIdeasTab === "private"
                          ? "No private ideas yet"
                          : "No public ideas yet"
                      }
                      description={
                        myIdeasTab === "private"
                          ? "Drafts you keep to yourself will live here. Save an idea as Private and it will show up."
                          : "Publish your first concept and it will show up here for the rest of the network to discover."
                      }
                      actionLabel="+ Post an Idea"
                      onAction={openWizard}
                    />
                  );
                }

                return (
                  <div className={cn(viewMode === "grid" ? "grid gap-5 md:grid-cols-2" : "space-y-5")}>
                    {visibleIdeas.map((idea) => (
                      <IdeaStoryCard
                        key={idea._id}
                        idea={idea}
                        saved={savedIdeaIds.includes(idea._id)}
                        onToggleSave={toggleSaved}
                        onOpenIdea={onIdeaClick}
                        onSpark={onSpark}
                        onComment={onCommentClick}
                        onRepost={openComposerWithDraft}
                        onSelectTag={onSearchChange}
                        hideAuthor
                      />
                    ))}
                  </div>
                );
              })()}
              {/* Infinite scroll — sentinel triggers next page; spinner shows while loading */}
              {mode === "feed" && (
                <>
                  <div ref={sentinelRef} className="h-4" />
                  {hasMore && (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-[#6366F1]" />
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          <IdeaForgeRightRail
            currentUser={currentUser}
            publicIdeas={publicIdeas as IdeaForgeIdea[]}
            ideas={ideas}
            onTagSelect={onSearchChange}
          />
        </div>
      </main>

      <FloatingChatButton />
      <IdeaWizard
        isOpen={showIdeaWizard}
        onOpenChange={(open) => {
          setShowIdeaWizard(open);
          if (!open) {
            setWizardDraft(undefined);
            setWizardTutorialMode(false);
          }
        }}
        initialDraft={wizardDraft}
        tutorialMode={wizardTutorialMode}
      />
    </div>
  );
}

function MyIdeasAnalytics({
  ideas,
  walletBalance,
  currentStreak,
  onOpenIdea,
}: {
  ideas: IdeaForgeIdea[];
  walletBalance: number;
  currentStreak: number;
  onOpenIdea: (ideaId: string) => void;
}) {
  const stats = useMemo(() => {
    const total = ideas.length;
    const publicCount = ideas.filter((idea) => idea.visibility === "public").length;
    const privateCount = ideas.filter((idea) => idea.visibility === "private").length;
    const totalSparks = ideas.reduce((sum, idea) => sum + (idea.sparkCount || 0), 0);
    const totalComments = ideas.reduce((sum, idea) => sum + (idea.commentCount || 0), 0);
    const totalContributors = ideas.reduce(
      (sum, idea) => sum + (idea.contributionCount || 0),
      0
    );
    const averageSparks = total > 0 ? Math.round(totalSparks / total) : 0;
    const top = [...ideas].sort(
      (a, b) => (b.sparkCount || 0) - (a.sparkCount || 0)
    )[0];
    return {
      total,
      publicCount,
      privateCount,
      totalSparks,
      totalComments,
      totalContributors,
      averageSparks,
      top,
    };
  }, [ideas]);

  if (stats.total === 0) {
    return (
      <div className={cn(cardSurface, "p-6 text-center")}>
        <p className="text-sm text-[#9CA3AF]">
          Post your first idea — analytics will start filling in as soon as it gets sparks, comments, or collaborators.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatTile
          icon={<Lightbulb className="h-4 w-4 text-[#C7D2FE]" />}
          label="Ideas posted"
          value={stats.total}
        />
        <StatTile
          icon={<Sparkles className="h-4 w-4 text-amber-300" />}
          label="Sparks earned"
          value={stats.totalSparks}
        />
        <StatTile
          icon={<MessageSquare className="h-4 w-4 text-emerald-300" />}
          label="Comments earned"
          value={stats.totalComments}
        />
        <StatTile
          icon={<Users className="h-4 w-4 text-fuchsia-300" />}
          label="Contributors"
          value={stats.totalContributors}
        />
        <StatTile
          icon={<BarChart3 className="h-4 w-4 text-sky-300" />}
          label="Avg sparks / idea"
          value={stats.averageSparks}
        />
        <StatTile
          icon={<Flame className="h-4 w-4 text-orange-300" />}
          label="Day streak"
          value={currentStreak}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className={cn(cardSurface, "p-5")}>
          <div className="flex items-center gap-2 text-[#C7D2FE]">
            <Eye className="h-4 w-4" />
            <span className={cn(displayFontClass, "text-sm font-semibold text-white")}>
              Visibility split
            </span>
          </div>
          <div className="mt-4 space-y-3 text-sm">
            <VisibilityBar
              icon={<Globe className="h-3.5 w-3.5 text-emerald-300" />}
              label="Public"
              count={stats.publicCount}
              total={stats.total}
              barClass="bg-gradient-to-r from-emerald-500 to-teal-400"
            />
            <VisibilityBar
              icon={<Lock className="h-3.5 w-3.5 text-amber-300" />}
              label="Private"
              count={stats.privateCount}
              total={stats.total}
              barClass="bg-gradient-to-r from-amber-500 to-orange-400"
            />
          </div>
        </div>

        <div className={cn(cardSurface, "p-5 flex flex-col")}>
          <div className="flex items-center gap-2 text-[#C7D2FE]">
            <Trophy className="h-4 w-4 text-amber-300" />
            <span className={cn(displayFontClass, "text-sm font-semibold text-white")}>
              Sparks banked
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className={cn(displayFontClass, "text-3xl font-bold text-white tabular-nums")}>
              {walletBalance.toLocaleString()}
            </span>
            <span className="text-xs text-[#9CA3AF]">total XP earned</span>
          </div>
          <p className="mt-2 text-xs leading-5 text-[#9CA3AF]">
            Counts every spark, comment, and milestone you&apos;ve earned across the platform.
          </p>
        </div>
      </div>

      <div className={cn(cardSurface, "p-5")}>
        <div className="flex items-center gap-2 text-[#C7D2FE]">
          <Sparkles className="h-4 w-4" />
          <span className={cn(displayFontClass, "text-sm font-semibold text-white")}>
            Strongest idea
          </span>
        </div>
        {stats.top ? (
          <button
            type="button"
            onClick={() => onOpenIdea(stats.top!._id)}
            className={cn(
              transitionBase,
              "mt-4 w-full rounded-[14px] border border-white/8 bg-white/[0.03] p-4 text-left hover:border-[#6366F1]/40 hover:bg-white/[0.05]"
            )}
          >
            <p className={cn(displayFontClass, "text-base font-semibold text-white truncate")}>
              {stats.top.title}
            </p>
            <p className="mt-1 text-xs leading-5 text-[#9CA3AF] line-clamp-2">
              {stats.top.description}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[#CBD5E1]">
              <span className="inline-flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-300" />
                {stats.top.sparkCount || 0} sparks
              </span>
              <span className="inline-flex items-center gap-1">
                <MessageSquare className="h-3 w-3 text-emerald-300" />
                {stats.top.commentCount || 0} comments
              </span>
              <span className="inline-flex items-center gap-1">
                <Users className="h-3 w-3 text-fuchsia-300" />
                {stats.top.contributionCount || 0} contributors
              </span>
              <span className="inline-flex items-center gap-1">
                {stats.top.visibility === "public" ? (
                  <Globe className="h-3 w-3 text-emerald-300" />
                ) : (
                  <Lock className="h-3 w-3 text-amber-300" />
                )}
                {stats.top.visibility}
              </span>
            </div>
          </button>
        ) : (
          <p className="mt-4 text-sm text-[#9CA3AF]">
            Once one of your ideas earns sparks, it&apos;ll surface here as your strongest concept.
          </p>
        )}
      </div>
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className={cn(cardSurface, "p-4 flex flex-col gap-2")}>
      <div className="flex items-center gap-2 text-[#9CA3AF] text-xs">
        {icon}
        <span>{label}</span>
      </div>
      <div className={cn(displayFontClass, "text-2xl font-semibold text-white tabular-nums")}>
        {value.toLocaleString()}
      </div>
    </div>
  );
}

function VisibilityBar({
  icon,
  label,
  count,
  total,
  barClass,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  total: number;
  barClass: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-1.5 text-[#D1D5DB]">
          {icon}
          {label}
        </span>
        <span className="text-[#9CA3AF] tabular-nums">
          {count} · {pct}%
        </span>
      </div>
      <div className="mt-1.5 h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", barClass)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
