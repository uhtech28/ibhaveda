"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";

import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { IdeaForgeExperience } from "@/components/ideaforge/experience";
import { IdeaForgeIdea } from "@/components/ideaforge/shared";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { MessageCircle } from "lucide-react";
import { CommentsSection } from "@/components/comments/CommentsSection";
import { ContributionRequestModal } from "@/components/requests/ContributionRequestModal";
import { useProfileCompletion } from "@/lib/hooks/use-profile-completion";
import { FeedTutorial } from "@/components/tutorial/FeedTutorial";
import { PERSONAS, type PersonaId } from "@/config/personas";
import { useTutorialOptional } from "@/components/tutorial/v2/useTutorial";

export function FeedClient() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const { isComplete: isProfileComplete, isLoading: isProfileLoading } = useProfileCompletion();
  const currentUser = useQuery(api.users.getCurrentUser);

  const PAGE_SIZE = 20;
  const [limit, setLimit] = useState(PAGE_SIZE);
  const seed = useMemo(() => Math.floor(Math.random() * 5), []);

  // ── Feed load performance timing ──────────────────────────────────────────
  const feedTimerRef = useRef<number | null>(null);
  const feedMeasuredRef = useRef(false);
  useEffect(() => {
    feedTimerRef.current = performance.now();
    feedMeasuredRef.current = false;
    console.log("%c⏱ [Feed] Query started", "color:#7dd3fc;font-weight:bold");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // PERF: warm the /map/world route the moment /feed mounts. Almost
  // every /feed user's next click will be either "post idea" (which
  // lands them on the map) or "go to map" directly, so paying the
  // Next.js RSC + client bundle download here instead of on click
  // shaves 1-3s off the perceived "map is loading…" wait later.
  useEffect(() => {
    router.prefetch("/map/world");
  }, [router]);

  // Auto-provision effect removed per product feedback — user wants the
  // simple name+username capture form for new signups, not silent
  // auto-provisioning with a derived username.

  // PERF: also warm-start the Phaser core + Village scene module while
  // the user is browsing /feed. These are the heaviest imports on
  // /map/world; kicking them off idle-time here means they're already
  // parsed by the time the user navigates. Guarded so we never race
  // against the map page's own boot.
  useEffect(() => {
    const idle =
      typeof window !== "undefined" &&
      "requestIdleCallback" in window
        ? (window as unknown as {
            requestIdleCallback: (
              cb: () => void,
              opts?: { timeout: number },
            ) => number;
          }).requestIdleCallback
        : (cb: () => void) => window.setTimeout(cb, 300);
    const cancel =
      typeof window !== "undefined" &&
      "cancelIdleCallback" in window
        ? (window as unknown as {
            cancelIdleCallback: (id: number) => void;
          }).cancelIdleCallback
        : (id: number) => window.clearTimeout(id);
    const id = idle(() => {
      // Fire-and-forget: dynamic imports are cached, so /map/world's
      // own boot will resolve these instantly.
      void import("phaser").catch(() => {});
      void import("@/lib/phaser/scenes/VillageMapScene").catch(() => {});
    }, { timeout: 2500 });
    return () => cancel(id as number);
  }, []);

  const ideasQuery = useQuery(api.ideas.getPublicIdeas, { limit, seed });
  const toggleSpark = useMutation(api.ideas.toggleSpark);

  const [stableIdeas, setStableIdeas] = useState<IdeaForgeIdea[]>([]);
  useEffect(() => {
    if (ideasQuery !== undefined) {
      setStableIdeas(ideasQuery as IdeaForgeIdea[]);
      if (!feedMeasuredRef.current && feedTimerRef.current !== null) {
        feedMeasuredRef.current = true;
        const ms = Math.round(performance.now() - feedTimerRef.current);
        const color = ms > 2000 ? "#f87171" : ms > 800 ? "#facc15" : "#4ade80";
        console.log(`%c⏱ [Feed] Data arrived: ${ms}ms (${ideasQuery.length} posts)`, `color:${color};font-weight:bold;font-size:13px`);
      }
    }
  }, [ideasQuery]);

  const isInitialLoading = ideasQuery === undefined && stableIdeas.length === 0;
  const hasMore = ideasQuery !== undefined && ideasQuery.length >= limit;

  function loadMore() {
    if (hasMore) setLimit((l) => l + PAGE_SIZE);
  }

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCommentIdea, setActiveCommentIdea] = useState<IdeaForgeIdea | null>(null);
  const [activeContributeIdea, setActiveContributeIdea] = useState<IdeaForgeIdea | null>(null);

  useEffect(() => {
    if (isLoaded && !userId) {
      router.push("/");
    }
  }, [isLoaded, router, userId]);

  // Auto-redirect to /profile-setup DISABLED per product request.
  // Users should never be pushed to the profile-setup screen
  // automatically — it only opens when they explicitly click a
  // "Complete Profile" affordance (e.g. the CTA on empty states).
  // Rationale: existing users kept getting bounced back to the
  // "Edit Your Profile" screen on every /feed visit, which felt
  // like a broken loop. Signup flow still lands on /profile-setup
  // via Clerk's afterSignUpUrl for first-time username capture; that
  // path is intentional and unaffected.
  //
  // Previously:
  //   useEffect(() => {
  //     if (isLoaded && userId && !isProfileLoading && !isProfileComplete) {
  //       router.push("/profile-setup");
  //     }
  //   }, [isLoaded, isProfileComplete, isProfileLoading, router, userId]);

  // ── First-time PERSONA picker ─────────────────────────────────────
  // Fires the FIRST time a signed-in, profile-complete user with NO
  // persona set lands on /feed. Once they confirm, the choice sticks
  // forever (persisted via api.users.updatePersonaId). Dismissed
  // sessions are remembered via sessionStorage so a hard-refresh
  // doesn't re-prompt in the same tab.
  const personaIdRaw = useQuery(api.users.getMyPersonaId, {});
  const updatePersonaId = useMutation(api.users.updatePersonaId);
  const [personaPickerOpen, setPersonaPickerOpen] = useState(false);
  const [personaSubmitting, setPersonaSubmitting] = useState(false);
  useEffect(() => {
    if (!isLoaded || !userId) return;
    if (personaIdRaw === undefined) return; // still loading
    if (personaIdRaw !== null) return; // already picked
    if (isProfileLoading) return;
    if (!isProfileComplete) return; // wait for username first
    if (typeof window !== "undefined" && sessionStorage.getItem("personaPickerDismissed") === "1") return;
    setPersonaPickerOpen(true);
  }, [isLoaded, userId, personaIdRaw, isProfileLoading, isProfileComplete]);
  const handlePersonaConfirm = useCallback(
    async (id: PersonaId) => {
      setPersonaSubmitting(true);
      try {
        await updatePersonaId({ personaId: id });
        if (typeof window !== "undefined") sessionStorage.setItem("personaPickerDismissed", "1");
        setPersonaPickerOpen(false);
      } finally {
        setPersonaSubmitting(false);
      }
    },
    [updatePersonaId],
  );

  // ── Hide Sparky / v2 tutorial while the persona picker is open ────
  // Sparky is mounted globally by TutorialProvider (in the layout);
  // it auto-shows for any user whose backend state is "not_started".
  // We flip the tutorial's `activeOverride` to false while the picker
  // is open, then RELEASE (null) it once persona is picked so the
  // provider's own `baseActive` computation (which correctly checks
  // the Convex `feedTutorialState === "completed"` flag) decides
  // visibility on its own.
  //
  // BUG FIX — this branch previously passed `true` in the else,
  // which force-showed the tutorial for ALREADY-COMPLETED users on
  // every re-render. That's why the "8/8" progress bar was sticky on
  // hard refresh even though the Convex completion flag was set. Task
  // #218 fixed Sparky's speech re-triggering but missed this override
  // path, so the bar kept coming back. Passing `null` releases the
  // override and lets `baseActive` (which is false when backendState
  // is "completed") hide the bar.
  const tutorial = useTutorialOptional();
  useEffect(() => {
    if (!tutorial) return;
    if (personaPickerOpen) {
      tutorial.setActive(false);
    } else {
      tutorial.setActive(null);
    }
  }, [personaPickerOpen, tutorial]);

  // First-run tour state.
  const tutorialState = useQuery(api.tutorial.getMyFeedTutorialState, {});
  const myIdeaCount = useQuery(api.tutorial_metrics.getMyIdeaCount, {});
  const [tutorialOpen, setTutorialOpen] = useState(false);
  // Stable callback so the memoized FeedTutorial doesn't re-render on
  // every parent tick.
  const closeFeedTutorial = useCallback(() => {
    setTutorialOpen(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("feedTourClosed", "1");
    }
  }, []);
  useEffect(() => {
    if (!tutorialState) return;
    // Hard local guard: once the user has explicitly dismissed the
    // tour this session, don't re-open it even if convex hasn't
    // finished propagating the completion mutation yet.
    if (
      typeof window !== "undefined" &&
      sessionStorage.getItem("feedTourClosed") === "1"
    ) {
      return;
    }
    // Don't start the tutorial UNTIL the user has picked a persona —
    // the picker takes priority as the very first UX beat on /feed
    // for new signups, and Sparky would otherwise overlap it.
    if (personaPickerOpen) return;
    if (personaIdRaw === undefined) return; // still resolving
    if (personaIdRaw === null) return; // picker will open shortly
    if (tutorialState.state === "not_started" || tutorialState.state === "in_progress") {
      const t = window.setTimeout(() => setTutorialOpen(true), 700);
      return () => window.clearTimeout(t);
    }
  }, [tutorialState, personaPickerOpen, personaIdRaw]);

  // Whether the user is currently in the tour's compose phase. Used to
  // light up the tutorial highlight on the + button and to switch the
  // wizard into tutorialMode once they open it.
  const tourActiveOrLoading =
    !tutorialState ||
    tutorialState.state === "in_progress" ||
    tutorialState.state === "not_started";
  const ideaCountKnown = typeof myIdeaCount === "number";
  const inComposePhase =
    tourActiveOrLoading && (!ideaCountKnown || myIdeaCount === 0);

  const ideas = stableIdeas;

  return (
    <>
      <IdeaForgeExperience
        mode="feed"
        currentUser={currentUser || null}
        ideas={ideas}
        isLoading={isInitialLoading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        tutorialOpenCompose={inComposePhase}
        onSpark={async (ideaId) => {
          return await toggleSpark({ ideaId: ideaId as Id<"ideas"> });
        }}
        onIdeaClick={(ideaId) => router.push(`/idea/${ideaId}`)}
        onCommentClick={(ideaId) => {
          const idea = ideas.find((entry) => entry._id === ideaId);
          if (idea) setActiveCommentIdea(idea);
        }}
        onContributeClick={(ideaId) => {
          const idea = ideas.find((entry) => entry._id === ideaId);
          if (idea) setActiveContributeIdea(idea);
        }}
        isProfileComplete={isProfileComplete}
        isProfileLoading={isProfileLoading}
        onCompleteProfile={() => router.push("/profile-setup")}
        onLoadMore={loadMore}
        hasMore={hasMore}
      />

      <Dialog open={!!activeCommentIdea} onOpenChange={(open) => !open && setActiveCommentIdea(null)}>
        <DialogContent
          className="
            grid grid-rows-[auto_1fr] gap-0 overflow-hidden border-white/10 bg-[#0A0D12] p-0 text-white shadow-[0_24px_80px_rgba(3,7,18,0.65)]
            w-full max-w-[640px]
            h-[100dvh] max-h-[100dvh] rounded-none
            sm:h-[min(85dvh,720px)] sm:max-h-[85dvh] sm:rounded-2xl
          "
        >
          <header className="flex items-center gap-3 border-b border-white/8 bg-gradient-to-b from-[#141B2D] to-[#0F1524] px-5 py-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#6366F1]/25 to-[#8B5CF6]/15 ring-1 ring-[#6366F1]/30">
              <MessageCircle className="h-5 w-5 text-[#C7D2FE]" />
            </div>
            <DialogTitle className="min-w-0 flex-1 truncate text-base font-semibold leading-tight text-white">
              {activeCommentIdea?.title}
            </DialogTitle>
          </header>
          <div className="min-h-0 px-5 py-4 overflow-hidden">
            {activeCommentIdea && (
              <CommentsSection
                ideaId={activeCommentIdea._id as Id<"ideas">}
                commentCount={activeCommentIdea.commentCount || 0}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!activeContributeIdea} onOpenChange={(open) => !open && setActiveContributeIdea(null)}>
        <DialogContent className="w-[min(92vw,560px)] max-w-[560px] overflow-hidden border-white/10 bg-[#111827] text-white">
          {activeContributeIdea && (
            <ContributionRequestModal
              ideaId={activeContributeIdea._id as Id<"ideas">}
              ideaTitle={activeContributeIdea.title}
              authorName={activeContributeIdea.author?.displayName || activeContributeIdea.author?.name || activeContributeIdea.author?.username}
              authorUsername={activeContributeIdea.author?.username}
              authorAvatar={activeContributeIdea.author?.avatar}
              onClose={() => setActiveContributeIdea(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* First-time user walkthrough. */}
      <FeedTutorial
        show={tutorialOpen}
        initialStep={tutorialState?.step ?? 0}
        onClose={closeFeedTutorial}
        myIdeaCount={myIdeaCount}
      />

      {/* First-time PERSONA picker — one-click. The very first thing
          new users see on /feed. Auto-confirms the moment they tap a
          card (no "Enter the world" step, no other CTAs) so the flow
          is: pick persona → picker closes → Sparky tutorial starts.
          Blocks the rest of the UI until they've picked. */}
      {personaPickerOpen && (
        <div
          className="fixed inset-0 z-[95] flex items-center justify-center overflow-y-auto bg-black/85 p-4 sm:p-8"
          onWheel={(e) => e.stopPropagation()}
        >
          <div className="my-auto w-full max-w-[900px] rounded-xl bg-[#0a0d12] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.7)] ring-1 ring-white/10">
            <div className="mb-6 text-center">
              <h2
                className="font-mono text-2xl font-black tracking-widest text-white sm:text-3xl"
                style={{ fontFamily: "var(--font-pixel-display), monospace" }}
              >
                Choose your persona
              </h2>
              <p className="mt-2 text-sm text-white/60">
                Your persona is your character throughout every venture.
                Pick one — you can change it later from your profile.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {PERSONAS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  disabled={personaSubmitting}
                  onClick={() => handlePersonaConfirm(p.id)}
                  className="group flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center transition hover:-translate-y-1 hover:border-white/40 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <div
                    className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg bg-black/40 ring-1 ring-white/10"
                    style={{ imageRendering: "pixelated" }}
                  >
                    <img
                      src={p.assets.portrait}
                      alt={p.displayName}
                      className="h-full w-full object-contain"
                      style={{ imageRendering: "pixelated" }}
                    />
                  </div>
                  <div className="text-sm font-bold text-white">{p.displayName}</div>
                  <div className="text-xs text-white/60">{p.tagline}</div>
                </button>
              ))}
            </div>
            {personaSubmitting && (
              <div className="mt-4 text-center text-xs text-white/60">
                Setting your persona…
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
