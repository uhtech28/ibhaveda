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
// Persona config no longer needed here — persona selection moved to
// the dedicated /persona-setup route.
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
  // Persona selection now lives on a dedicated /persona-setup route so
  // Sparky can't briefly flash between /feed mount and picker mount.
  // Here we only detect "no persona yet" and hard-navigate away — no
  // in-page modal, no picker mount on /feed.
  //
  // Guard order matters:
  //   1. Wait for auth + profile query to resolve.
  //   2. Only redirect once we know profile is complete (username exists).
  //   3. Skip the redirect if the user has already picked a persona OR
  //      already dismissed the picker in this browser session.
  const personaIdRaw = useQuery(api.users.getMyPersonaId, {});
  // Local flag that stays TRUE from the moment we know the user needs
  // to pick a persona through the router.replace() nav. Used below to
  // suppress Sparky during the redirect window so nothing renders on
  // /feed while we're on our way out.
  const personaMissing =
    personaIdRaw === null || personaIdRaw === undefined;
  useEffect(() => {
    if (!isLoaded || !userId) return;
    if (personaIdRaw === undefined) return; // still loading
    if (personaIdRaw !== null) return; // already picked — no redirect
    if (isProfileLoading) return;
    if (!isProfileComplete) return; // wait for username first
    if (
      typeof window !== "undefined" &&
      sessionStorage.getItem("personaPickerDismissed") === "1"
    ) {
      // User already saw the picker in this tab — don't loop them back.
      return;
    }
    // DEBOUNCE the redirect. The pre-fix "picker → feed → picker"
    // flicker was caused by /feed firing this redirect the moment its
    // personaIdRaw query resolved to null, even though an
    // updatePersonaId mutation was IN FLIGHT and about to land in the
    // very next tick. Delaying the redirect by ~1.2s lets any recent
    // mutation propagate through the Convex reactive query cache —
    // if it lands, `personaIdRaw` becomes a string, the guard at
    // the top of the effect returns early on the retry render, and
    // the timeout is cancelled by the cleanup below.
    const t = window.setTimeout(() => {
      // Re-check the session flag right before nav — the
      // profile-setup hard-reload path may have written it after
      // the current effect closure captured the old value.
      if (
        typeof window !== "undefined" &&
        sessionStorage.getItem("personaPickerDismissed") === "1"
      ) {
        return;
      }
      router.replace("/persona-setup");
    }, 1200);
    return () => window.clearTimeout(t);
  }, [
    isLoaded,
    userId,
    personaIdRaw,
    isProfileLoading,
    isProfileComplete,
    router,
  ]);

  // ── Hide Sparky / v2 tutorial until persona is chosen ─────────────
  // Sparky is mounted globally by TutorialProvider (in the layout);
  // it auto-shows for any user whose backend state is "not_started".
  //
  // We keep the tutorial suppressed while:
  //   - the persona query is still loading (undefined), OR
  //   - persona is null (user hasn't picked yet; redirect to
  //     /persona-setup is in flight).
  //
  // This covers the race window where /feed mounts, the tutorial-state
  // query resolves first, and Sparky would otherwise briefly render
  // before the persona-id query resolves and we can navigate away.
  //
  // Once persona is present we RELEASE (null) the override so the
  // provider's own `baseActive` computation (which correctly checks the
  // Convex `feedTutorialState === "completed"` flag) decides visibility.
  //
  // BUG FIX HISTORY — the else branch previously passed `true`, which
  // force-showed the tutorial for ALREADY-COMPLETED users on every
  // re-render, resurrecting the "8/8" progress bar on hard refresh
  // (task #218 fixed Sparky's speech but missed this override path).
  // Passing `null` releases the override cleanly.
  const tutorial = useTutorialOptional();
  useEffect(() => {
    if (!tutorial) return;
    if (personaMissing) {
      tutorial.setActive(false);
    } else {
      tutorial.setActive(null);
    }
  }, [personaMissing, tutorial]);

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
    // the persona-setup route takes priority as the very first UX beat
    // for new signups. If persona is missing, /feed will redirect out
    // anyway, so also skip opening the tutorial here.
    if (personaMissing) return;
    if (tutorialState.state === "not_started" || tutorialState.state === "in_progress") {
      const t = window.setTimeout(() => setTutorialOpen(true), 700);
      return () => window.clearTimeout(t);
    }
  }, [tutorialState, personaMissing]);

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

  // Belt-and-braces guard: if the user is here WITHOUT a persona and
  // the session dismissal flag isn't set, render a black loader
  // while the redirect useEffect above kicks them to /persona-setup.
  //
  // Critical difference from an earlier iteration: we require
  // `personaIdRaw === null` (definitely missing, query has landed),
  // NOT `personaMissing` (which is true while the query is still
  // undefined). Using the broader `personaMissing` here blackscreened
  // EVERY /feed mount for the ~200ms the persona query took to
  // resolve — and if `isProfileLoading` was still true, Sparky and
  // the feed never rendered at all. Users with a persona should see
  // the feed instantly, without a black flash.
  const showPersonaBlockingLoader =
    isLoaded &&
    !!userId &&
    personaIdRaw === null &&
    !isProfileLoading &&
    isProfileComplete &&
    !(
      typeof window !== "undefined" &&
      sessionStorage.getItem("personaPickerDismissed") === "1"
    );
  if (showPersonaBlockingLoader) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
      </div>
    );
  }

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

      {/* Persona picker used to live here as a modal overlay. It now
          runs on the dedicated /persona-setup route so Sparky can't
          briefly flash between /feed mount and picker mount. See the
          redirect effect above — new users get punted out before any
          feed content paints. */}
    </>
  );
}
