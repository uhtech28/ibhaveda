"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { BarChart3, Grid2X2, LayoutList, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { api } from "@convex/_generated/api";
import { cn } from "@/lib/utils";
import { ComposerModal } from "@/components/ideaforge/composer-modal";
import { CategorySelectorModal } from "@/components/ideaforge/category-selector-modal";
import {
  CompactIdeaCard,
  EmptyState,
  FeedComposer,
  FilterTabs,
  feedTabs,
  IdeaCardSkeleton,
  IdeaStoryCard,
  myIdeaTabs,
} from "@/components/ideaforge/idea-cards";
import { IdeaForgeLeftRail } from "@/components/ideaforge/left-rail";
import { IdeaForgeNavbar } from "@/components/ideaforge/navbar";
import { IdeaForgeRightRail } from "@/components/ideaforge/right-rail";
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
const DRAFT_STORAGE_KEY = "ideaforge-composer-draft";

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
}) {
  const router = useRouter();
  const userIdeas = useQuery(api.ideas.getUserIdeas) || [];
  const publicIdeas = useQuery(api.ideas.getPublicIdeas, { limit: 60 }) || [];
  const [categorySelectorOpen, setCategorySelectorOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerDraft, setComposerDraft] = useState<Partial<ComposerDraft>>({});
  const [feedTab, setFeedTab] = useState<FeedTabKey>("for-you");
  const [myIdeasTab, setMyIdeasTab] = useState<MyIdeasTabKey>("ideas");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [savedIdeaIds, setSavedIdeaIds] = usePersistentIds(SAVED_STORAGE_KEY);
  const [localDraft, setLocalDraft] = useState<Partial<ComposerDraft> | null>(null);

  useEffect(() => {
    const syncDraft = () => {
      try {
        const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
        setLocalDraft(raw ? JSON.parse(raw) : null);
      } catch {
        setLocalDraft(null);
      }
    };

    syncDraft();
    window.addEventListener("storage", syncDraft);
    return () => window.removeEventListener("storage", syncDraft);
  }, []);

  useEffect(() => {
    if (!composerOpen) {
      try {
        const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
        setLocalDraft(raw ? JSON.parse(raw) : null);
      } catch {
        setLocalDraft(null);
      }
    }
  }, [composerOpen]);

  const filteredFeedIdeas = useMemo(() => {
    const searchable = ideas.filter((idea) => matchesSearch(idea, searchQuery));

    if (feedTab === "latest") {
      return [...searchable].sort((a, b) => b.createdAt - a.createdAt);
    }

    if (feedTab === "hot") {
      return [...searchable].sort((a, b) => (b.sparkCount || 0) - (a.sparkCount || 0) || b.createdAt - a.createdAt);
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

  const savedIdeas = useMemo(() => {
    return publicIdeas.filter((idea) => savedIdeaIds.includes(idea._id));
  }, [publicIdeas, savedIdeaIds]);

  const searchedMyIdeas = useMemo(() => {
    return ideas.filter((idea) => matchesSearch(idea, searchQuery));
  }, [ideas, searchQuery]);

  const analytics = useMemo(() => {
    const totalSparks = ideas.reduce((sum, idea) => sum + (idea.sparkCount || 0), 0);
    const totalComments = ideas.reduce((sum, idea) => sum + (idea.commentCount || 0), 0);
    const averageSparks = ideas.length > 0 ? Math.round(totalSparks / ideas.length) : 0;
    const strongestIdea = [...ideas].sort((a, b) => (b.sparkCount || 0) - (a.sparkCount || 0))[0];

    return { totalSparks, totalComments, averageSparks, strongestIdea };
  }, [ideas]);

  const currentIdeas = mode === "feed" ? filteredFeedIdeas : searchedMyIdeas;

  const toggleSaved = (ideaId: string) => {
    if (savedIdeaIds.includes(ideaId)) {
      setSavedIdeaIds(savedIdeaIds.filter((entry) => entry !== ideaId));
      return;
    }
    setSavedIdeaIds([...savedIdeaIds, ideaId]);
  };

  const openCategorySelector = () => {
    setCategorySelectorOpen(true);
  };

  const handleCategorySelect = (category: string) => {
    setCategorySelectorOpen(false);
    // Capitalize first letter to match the format
    const formattedCategory = category.charAt(0).toUpperCase() + category.slice(1);
    setComposerDraft({ category: formattedCategory });
    setComposerOpen(true);
  };

  const openComposerWithDraft = (draft?: Partial<ComposerDraft>) => {
    setComposerDraft(draft || {});
    setComposerOpen(true);
  };

  const profileStats = [
    { label: "Ideas", value: ideas.length },
    { label: "Sparks", value: analytics.totalSparks },
    { label: "Followers", value: currentUser?.followersCount || 0 },
    { label: "Following", value: currentUser?.followingCount || 0 },
  ];

  return (
    <div className="min-h-screen bg-[#0A0D12] pb-28 text-[#F9FAFB]">
      <IdeaForgeNavbar currentUser={currentUser} searchQuery={searchQuery} onSearchChange={onSearchChange} onOpenComposer={openCategorySelector} />

      <main className={cn(shellMax, "px-4 pb-12 pt-28 sm:px-6 xl:px-8") }>
        <div className="flex items-start gap-6">
          <IdeaForgeLeftRail
            currentUser={currentUser}
            mode={mode}
            userIdeas={userIdeas as IdeaForgeIdea[]}
            onOpenComposer={openCategorySelector}
            onTagSelect={onSearchChange}
            onOpenFeedTab={setFeedTab}
            onOpenMyIdeasTab={setMyIdeasTab}
          />

          <section className="min-w-0 flex-1">
            <div className="mx-auto max-w-[680px] space-y-5">
              {mode === "feed" ? (
                <>
                  <FeedComposer currentUser={currentUser} onOpenComposer={openCategorySelector} />
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
                  <section className="overflow-hidden rounded-[22px] border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.42),transparent_28%),radial-gradient(circle_at_78%_0%,rgba(139,92,246,0.32),transparent_26%),linear-gradient(135deg,#111827,#131c30_62%,#0a0d12)]">
                    <div className="h-36 border-b border-white/8" />
                    <div className="px-6 pb-6">
                      <div className="-mt-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                          <div className="flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-[#6366F1] bg-[#111827] text-2xl font-semibold text-white shadow-[0_18px_42px_rgba(3,7,18,0.5)]">
                            {(currentUser?.displayName || "I").charAt(0).toUpperCase()}
                          </div>
                          <div className="mt-4 flex flex-wrap items-center gap-3">
                            <h1 className={cn(displayFontClass, "text-3xl font-semibold text-white")}>{currentUser?.displayName || "Your profile"}</h1>
                            <span className="rounded-full border border-[#6366F1]/30 bg-[#6366F1]/12 px-3 py-1 text-[11px] text-[#C7D2FE]">{currentUser?.role === "admin" ? "AI Curator" : "Builder"}</span>
                          </div>
                        </div>
                        <Button type="button" onClick={() => router.push("/profile-setup")} className="rounded-[10px] bg-[#111827] text-white hover:bg-[#1f2937]">
                          Edit Profile
                        </Button>
                      </div>
                      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {profileStats.map((item) => (
                          <div key={item.label} className="rounded-[14px] border border-white/8 bg-black/20 px-4 py-3">
                            <div className="text-lg font-semibold text-white">{item.value}</div>
                            <div className="text-xs text-[#9CA3AF]">{item.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                  <div className="flex flex-col gap-4 rounded-[16px] border border-white/7 bg-[#111827]/82 p-4 md:flex-row md:items-center md:justify-between">
                    <FilterTabs tabs={myIdeaTabs} activeKey={myIdeasTab} onChange={setMyIdeasTab} />
                    <div className="flex items-center gap-2 self-end">
                      <button type="button" onClick={() => setViewMode("grid")} className={cn(transitionBase, "rounded-[10px] p-2", viewMode === "grid" ? "bg-[#6366F1]/14 text-[#C7D2FE]" : "text-[#9CA3AF] hover:bg-white/[0.04] hover:text-white")} aria-label="Grid view">
                        <Grid2X2 className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => setViewMode("list")} className={cn(transitionBase, "rounded-[10px] p-2", viewMode === "list" ? "bg-[#6366F1]/14 text-[#C7D2FE]" : "text-[#9CA3AF] hover:bg-white/[0.04] hover:text-white")} aria-label="List view">
                        <LayoutList className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}

              {isLoading ? (
                <div className="space-y-5">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <IdeaCardSkeleton key={index} />
                  ))}
                </div>
              ) : mode === "feed" ? (
                currentIdeas.length > 0 ? (
                  <div className="space-y-5">
                    {currentIdeas.map((idea) => (
                      <IdeaStoryCard
                        key={idea._id}
                        idea={idea}
                        saved={savedIdeaIds.includes(idea._id)}
                        onToggleSave={toggleSaved}
                        onOpenIdea={onIdeaClick}
                        onSpark={onSpark}
                        onComment={onCommentClick}
                        onContribute={onContributeClick}
                        onRepost={openComposerWithDraft}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="Nothing matched this feed yet"
                    description="Try another search, switch to a different feed tab, or post the spark that should exist here."
                    actionLabel="+ Post an Idea"
                    onAction={openCategorySelector}
                  />
                )
              ) : myIdeasTab === "analytics" ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className={cn(cardSurface, "p-5")}>
                    <div className="flex items-center gap-2 text-[#C7D2FE]"><BarChart3 className="h-4 w-4" /><span className={cn(displayFontClass, "text-lg font-semibold text-white")}>Reach Snapshot</span></div>
                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-[14px] border border-white/8 bg-white/[0.03] p-4"><div className="text-2xl font-semibold text-white">{analytics.totalSparks}</div><div className="mt-1 text-xs text-[#9CA3AF]">Total sparks</div></div>
                      <div className="rounded-[14px] border border-white/8 bg-white/[0.03] p-4"><div className="text-2xl font-semibold text-white">{analytics.totalComments}</div><div className="mt-1 text-xs text-[#9CA3AF]">Comments earned</div></div>
                      <div className="rounded-[14px] border border-white/8 bg-white/[0.03] p-4"><div className="text-2xl font-semibold text-white">{analytics.averageSparks}</div><div className="mt-1 text-xs text-[#9CA3AF]">Average sparks / idea</div></div>
                      <div className="rounded-[14px] border border-white/8 bg-white/[0.03] p-4"><div className="text-2xl font-semibold text-white">{ideas.length}</div><div className="mt-1 text-xs text-[#9CA3AF]">Published concepts</div></div>
                    </div>
                  </div>
                  <div className={cn(cardSurface, "p-5")}>
                    <h2 className={cn(displayFontClass, "text-lg font-semibold text-white")}>Strongest Idea</h2>
                    {analytics.strongestIdea ? (
                      <div className="mt-4 rounded-[16px] border border-white/8 bg-white/[0.03] p-4">
                        <p className={cn(displayFontClass, "text-xl font-semibold text-white")}>{analytics.strongestIdea.title}</p>
                        <p className="mt-2 text-sm leading-6 text-[#9CA3AF]">{analytics.strongestIdea.description}</p>
                        <div className="mt-4 flex items-center gap-4 text-sm text-[#CBD5E1]">
                          <span>{analytics.strongestIdea.sparkCount || 0} sparks</span>
                          <span>{analytics.strongestIdea.commentCount || 0} comments</span>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-[#9CA3AF]">Publish a few ideas and we&apos;ll surface your best-performing concept here.</p>
                    )}
                  </div>
                </div>
              ) : myIdeasTab === "drafts" ? (
                localDraft?.title || localDraft?.description ? (
                  <div className={cn(cardSurface, "p-6")}>
                    <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[11px] text-amber-300">Draft</span>
                    <h2 className={cn(displayFontClass, "mt-4 text-2xl font-semibold text-white")}>{localDraft.title || "Untitled draft"}</h2>
                    <p className="mt-3 text-sm leading-7 text-[#9CA3AF]">{localDraft.description || "Your saved draft is waiting for final details and a publish push."}</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {(localDraft.tags || []).map((tag) => (
                        <span key={tag} className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-xs text-[#CBD5E1]">{tag}</span>
                      ))}
                    </div>
                    <Button type="button" onClick={() => openComposerWithDraft(localDraft)} className="mt-6 rounded-[10px] bg-[#6366F1] text-white hover:bg-[#8B5CF6]">
                      Continue Draft
                    </Button>
                  </div>
                ) : (
                  <EmptyState
                    title="No drafts yet"
                    description="Start a concept in the composer and save it here when you want to polish it later."
                    actionLabel="Start a Draft"
                    onAction={openCategorySelector}
                  />
                )
              ) : ((myIdeasTab === "saved" ? savedIdeas : currentIdeas).length > 0 ? (
                viewMode === "grid" ? (
                  <div className="grid gap-5 md:grid-cols-2">
                    {(myIdeasTab === "saved" ? savedIdeas : currentIdeas).map((idea) => (
                      <CompactIdeaCard
                        key={idea._id}
                        idea={idea}
                        saved={savedIdeaIds.includes(idea._id)}
                        onOpenIdea={onIdeaClick}
                        onDelete={myIdeasTab === "ideas" ? onDeleteIdea : undefined}
                        onRepost={openComposerWithDraft}
                        onToggleSave={toggleSaved}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-5">
                    {(myIdeasTab === "saved" ? savedIdeas : currentIdeas).map((idea) => (
                      <IdeaStoryCard
                        key={idea._id}
                        idea={idea}
                        saved={savedIdeaIds.includes(idea._id)}
                        onToggleSave={toggleSaved}
                        onOpenIdea={onIdeaClick}
                        onSpark={onSpark}
                        onComment={onCommentClick}
                        onRepost={openComposerWithDraft}
                        ownerAction={
                          myIdeasTab === "ideas" ? (
                            <button type="button" onClick={() => onIdeaClick(idea._id)} className="rounded-[10px] border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-[#D1D5DB] hover:border-[#6366F1]/35 hover:text-white" aria-label="Edit idea">
                              Edit
                            </button>
                          ) : undefined
                        }
                      />
                    ))}
                  </div>
                )
              ) : (
                <EmptyState
                  title={myIdeasTab === "saved" ? "Nothing saved yet" : "No ideas yet. Your first idea could change everything."}
                  description={myIdeasTab === "saved" ? "Save promising concepts from the feed and they&apos;ll be waiting here for your next building session." : "Draft the startup thought you keep circling back to and give it a home in InteractiveIdeas."}
                  actionLabel="+ Post Your First Idea"
                  onAction={openCategorySelector}
                />
              ))}
            </div>
          </section>

          <IdeaForgeRightRail currentUser={currentUser} publicIdeas={publicIdeas as IdeaForgeIdea[]} />
        </div>
      </main>

      <button
        type="button"
        onClick={openCategorySelector}
        aria-label="Post idea"
        className="fixed bottom-24 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#6366F1] text-white shadow-[0_18px_42px_rgba(99,102,241,0.3)] transition-all duration-200 hover:scale-[1.02] hover:bg-[#8B5CF6] md:bottom-8 md:right-8"
      >
        <Plus className="h-6 w-6" />
      </button>

      <CategorySelectorModal 
        open={categorySelectorOpen} 
        onOpenChange={setCategorySelectorOpen}
        onSelectCategory={handleCategorySelect}
      />
      <ComposerModal open={composerOpen} onOpenChange={setComposerOpen} initialDraft={composerDraft} />
    </div>
  );
}


