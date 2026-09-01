"use client";

/**
 * TutorialProvider
 *
 * Central state machine for the Duolingo-style tutorial. Wraps the
 * app so any page/component can render Sparky + speech + progress bar.
 *
 * Responsibilities:
 *  1. Subscribe to Convex tutorial state via `api.tutorial.getMyFeedTutorialState`
 *  2. Mirror it into local React state with optimistic-update support
 *  3. Provide `advance / goTo / skip / complete / restart` actions
 *  4. Mount the global UI chrome — TutorialProgressBar at the top of
 *     every page (when active). Steps render their own Mascot bubbles.
 *
 * The provider does NOT render Sparky directly — each step component
 * mounts its own `<TutorialMascot>` so the dialogue, mood, and
 * actions can be step-specific. The provider just owns the
 * state-machine + the persistent chrome.
 *
 * Mount this once at the root layout level (above `<main>` so the
 * progress bar can paint over the navbar shadow).
 */

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { api } from "@convex/_generated/api";
import { TutorialProgressBar } from "./TutorialProgressBar";
// MOBILE PERF: these Step components are only ever active for signed-in users
// running the guided tutorial. A landing-page visitor on a Moto G4 doesn't need
// their JS parsed/executed. Loading via next/dynamic (with ssr:false so we skip
// the hydration cost too) shifts the code into separate chunks that only fetch
// when the tutorial actually mounts. This is a major TBT win because Step3 pulls
// in Convex mutations, the mascot, highlight overlays, and template config.
const Step1Welcome = dynamic(
  () => import("./steps/Step1Welcome").then((m) => m.Step1Welcome),
  { ssr: false, loading: () => null },
);
const Step2TemplatePick = dynamic(
  () => import("./steps/Step2TemplatePick").then((m) => m.Step2TemplatePick),
  { ssr: false, loading: () => null },
);
const Step3MapGuide = dynamic(
  () => import("./steps/Step3MapGuide").then((m) => m.Step3MapGuide),
  { ssr: false, loading: () => null },
);
const Step4Contribute = dynamic(
  () => import("./steps/Step4Contribute").then((m) => m.Step4Contribute),
  { ssr: false, loading: () => null },
);
// SwordDropCelebration was removed from the mount tree per product
// request. The file is kept in the repo (unused) in case we want to
// re-enable a completion cinematic later.
import {
  TutorialContext,
  TUTORIAL_TOTAL_STEPS,
  type TutorialBackendState,
  type TutorialMilestone,
  type TutorialStep,
} from "./useTutorial";

// Routes where the tutorial progress bar should NEVER appear, even if
// the tutorial is technically active. Public/marketing surfaces only.
const PROGRESS_BAR_BLOCKED_ROUTES = [
  "/",
  "/sign-in",
  "/sign-up",
  "/login",
  "/register",
  // /profile-setup no longer participates in the tutorial (Step1Welcome
  // is disabled). Hiding the 1/8 progress bar keeps that screen quiet
  // so returning users editing their profile don't see stale tutorial
  // chrome.
  "/profile-setup",
  // /persona-setup: after the user picks a persona, an inline Sparky
  // intro overlay takes over the whole screen (see persona-setup/page.tsx
  // SparkyIntroOverlay). The global 1/8 progress bar rendering on top
  // of that overlay read as a broken chrome layer — reported as the
  // "1/8 bar floating over the Sparky black scrim" glitch. Blocking
  // this route keeps the persona pick + intro visually clean.
  "/persona-setup",
];

function TutorialProgressBarGate(props: {
  visible: boolean;
  step: number;
  totalSteps: number;
  onSkip: () => void;
}) {
  const pathname = usePathname();
  // Hide on home/landing/sign-in/sign-up — those are public surfaces
  // and a progress bar would clutter them.
  if (pathname && PROGRESS_BAR_BLOCKED_ROUTES.includes(pathname)) {
    return null;
  }
  return <TutorialProgressBar {...props} />;
}

interface TutorialProviderProps {
  children: ReactNode;
}

export function TutorialProvider({ children }: TutorialProviderProps) {
  // ── Convex subscription ─────────────────────────────────────────────────
  // MOBILE PERF: this provider mounts in the root layout, so it renders on
  // the landing page too. Previously we fired `getMyFeedTutorialState`
  // unconditionally, which meant every anonymous marketing visit paid for a
  // Convex round-trip that always returned "not signed in". Gate the query
  // on Clerk's `isSignedIn` so signed-out landing visitors don't touch the
  // Convex socket at all — they get the placeholder default and none of the
  // tutorial machinery activates.
  const { isSignedIn, isLoaded } = useAuth();
  const remote = useQuery(
    api.tutorial.getMyFeedTutorialState,
    isLoaded && isSignedIn ? {} : "skip",
  );

  // ── Mutations ───────────────────────────────────────────────────────────
  const advanceMutation = useMutation(api.tutorial.advanceFeedTutorial);
  const skipMutation = useMutation(api.tutorial.skipFeedTutorial);
  const completeMutation = useMutation(api.tutorial.completeFeedTutorial);
  const restartMutation = useMutation(api.tutorial.restartFeedTutorial);
  const markMilestoneMutation = useMutation(api.tutorial.markTutorialMilestone);

  // ── Local optimistic mirror ─────────────────────────────────────────────
  const [optimisticStep, setOptimisticStep] = useState<TutorialStep | null>(null);
  const [optimisticState, setOptimisticState] =
    useState<TutorialBackendState | null>(null);
  // The overlay can be force-hidden without persisting (e.g. user navigates
  // to a page where we want Sparky to disappear briefly without losing
  // their step).
  const [activeOverride, setActiveOverride] = useState<boolean | null>(null);
  // Locally-marked beats, unioned over the server's list. Keeps the guard
  // effective on the render immediately after markMilestone() rather than
  // only after the Convex round-trip lands — that gap is exactly when a
  // remount would otherwise replay the beat we just finished.
  const [localMilestones, setLocalMilestones] = useState<
    readonly TutorialMilestone[]
  >([]);

  // Resolve the effective state — optimistic wins over remote, remote
  // wins over default.
  const backendState: TutorialBackendState =
    optimisticState ?? (remote?.state as TutorialBackendState | undefined) ?? "not_started";

  const step: TutorialStep =
    optimisticStep ?? ((remote?.step ?? 0) as TutorialStep);

  // Server list ∪ locally-marked. A terminal user is treated as having
  // finished every beat regardless of what the array says, so no step
  // component can find something left to replay for them.
  const milestones = useMemo<readonly TutorialMilestone[]>(() => {
    const fromServer = (remote?.milestones ?? []) as TutorialMilestone[];
    const merged = new Set<TutorialMilestone>([
      ...fromServer,
      ...localMilestones,
    ]);
    if (remote?.state === "completed" || remote?.state === "skipped") {
      merged.add("map_task_done");
      merged.add("combat_done");
      merged.add("flare_done");
      merged.add("contribute_done");
    }
    return Array.from(merged);
  }, [remote?.milestones, remote?.state, localMilestones]);
  const milestonesLoaded = remote !== undefined;

  // Reconcile optimistic state with remote once they match — prevents
  // stale optimistic values from sticking around.
  useEffect(() => {
    if (
      optimisticStep != null &&
      remote &&
      remote.step === optimisticStep &&
      remote.state === optimisticState
    ) {
      setOptimisticStep(null);
      setOptimisticState(null);
    }
  }, [remote, optimisticStep, optimisticState]);

  // Terminal-lock reconciliation: if the server says the user is
  // completed or skipped but a racing step-file effect wrote optimistic
  // in_progress before our action-level guards were in place (or before
  // remote hydrated), CLEAR that optimistic immediately. Without this,
  // the optimistic values would linger — the normal reconcile effect
  // above only clears when remote matches optimistic, so a permanent
  // mismatch (in_progress vs completed) would keep the tutorial visible
  // forever. This is the last line of defence for the "completed user
  // sees tutorial for one frame after refresh" bug.
  useEffect(() => {
    if (
      remote &&
      (remote.state === "completed" || remote.state === "skipped") &&
      (optimisticState !== null || optimisticStep !== null) &&
      optimisticState !== remote.state
    ) {
      setOptimisticStep(null);
      setOptimisticState(null);
    }
  }, [remote, optimisticState, optimisticStep]);

  // ── Derived flags ───────────────────────────────────────────────────────
  // The tutorial is "active" when:
  //  - Convex query has RESOLVED (remote !== undefined) — critical to
  //    avoid the initial-render "not_started + step 0" false positive
  //    that used to clobber completed users' state. Step3MapGuide would
  //    fire goTo(7) during the load window and persist in_progress back
  //    to Convex, restarting the tutorial after refresh.
  //  - backend says in_progress or not_started
  //  - AND user hasn't completed/skipped
  //  - AND step is 1..10 (0 = pre-start, 11 = done)
  //  - AND no explicit override hides it
  // FIX — new users have backendState="not_started" AND step=0, which
  // failed the `step >= 1` check so Sparky never showed up after
  // signup. Treat the "not_started + step 0" combination as step 1
  // active so the dog appears on /profile-setup.
  // `undefined` = query in flight. `null` = the query ran but
  // getMyFeedTutorialState found no user row, which it returns whenever
  // ctx.auth.getUserIdentity() is not resolved yet -- i.e. the window
  // after a reload before Convex's auth token propagates.
  //
  // Treating null as "loaded" was the cause of the "completed tutorial
  // reappears for 1-2 seconds on reload" bug: null made remoteLoaded
  // true, remoteTerminal false (null?.state is undefined), backendState
  // fall back to "not_started" and step to 0 -- every condition for
  // baseActive. The tour switched itself on for a finished user and only
  // switched off once the token landed and the real state arrived.
  //
  // Both null and undefined now mean "we do not know yet", so nothing
  // activates until the server has actually answered for a real user.
  const remoteLoaded = remote !== undefined && remote !== null;
  // REMOTE-authoritative terminal check. A completed / skipped user must
  // NEVER see the tutorial — even for a single frame — regardless of
  // what optimistic state some racing step effect wrote. We deliberately
  // key off `remote.state` (not the merged `backendState`) so a stray
  // optimistic "in_progress" from a step-file goTo cannot reopen the
  // tour for someone the server has already marked terminal.
  // LATCH. Once the server has told us this session that the user is
  // finished, that is permanent for the lifetime of the page -- a later
  // null (auth token refresh, a dropped socket, a transient query error)
  // must never be read as "maybe they can start again".
  //
  // remoteLoaded already stops the reload-time flash; this stops the
  // same thing happening mid-session, where there is no page load to
  // re-derive state from.
  const sawTerminalRef = useRef(false);
  if (
    remote != null &&
    (remote.state === "completed" || remote.state === "skipped")
  ) {
    sawTerminalRef.current = true;
  }

  const remoteTerminal =
    sawTerminalRef.current ||
    (remoteLoaded &&
      (remote?.state === "completed" || remote?.state === "skipped"));
  const baseActive =
    remoteLoaded &&
    !remoteTerminal &&
    (backendState === "in_progress" || backendState === "not_started") &&
    ((step >= 1 && step <= 10) || (backendState === "not_started" && step === 0));
  // Debug: `?tutorial_debug=N` in URL forces the overlay open at step N (1-7).
  // Read after hydration only — accessing window during SSR causes a
  // hydration mismatch with the progress-bar markup.
  const [debugStep, setDebugStep] = useState(0);
  useEffect(() => {
    const n = Number(
      new URLSearchParams(window.location.search).get("tutorial_debug"),
    );
    if (Number.isFinite(n) && n >= 1 && n <= 10) setDebugStep(n);
  }, []);
  const debugActive = debugStep >= 1 && debugStep <= 10;
  // TERMINAL LOCK: a completed/skipped user (per the remote truth) can
  // NEVER see the tutorial via the normal path. `?tutorial_debug=N` is
  // still honoured because QA needs a way to preview steps against real
  // user accounts, but the natural `baseActive` and any transient
  // `activeOverride(true)` are forced off. Fixes the completed-user
  // "tour briefly flashes then disappears" regression.
  const active = remoteTerminal
    ? debugActive
    : activeOverride != null
      ? activeOverride
      : (baseActive || debugActive);
  // Effective step — debug override, else real step, else 1 if user
  // is "not_started" (new signup — Step 1 component needs to mount).
  const effectiveStep = debugActive
    ? (debugStep as TutorialStep)
    : (backendState === "not_started" && step === 0 ? (1 as TutorialStep) : step);

  // ── Actions ─────────────────────────────────────────────────────────────
  // Ref-mirror of the REMOTE terminal-state check so action callbacks
  // don't need to be re-memoised each time remote changes (which would
  // break their stable identity in step-file effect deps and cause
  // extra re-runs). A step effect can capture a stale `goTo` closure
  // and fire it after the user hits completed — reading the current
  // remote through this ref means the callback still short-circuits.
  const remoteTerminalRef = useRef(remoteTerminal);
  remoteTerminalRef.current = remoteTerminal;
  const remoteStepRef = useRef<number>(0);
  remoteStepRef.current = remote?.step ?? 0;

  const goTo = useCallback(
    async (next: TutorialStep) => {
      // Terminal-lock: never allow a step-file effect to reopen the
      // tour for a completed / skipped user. Server also enforces this
      // (advanceFeedTutorial refuses if state is terminal), but we
      // short-circuit here to prevent the optimistic mirror from
      // briefly flipping the UI to "in_progress" before the server ack
      // rolls it back — which is exactly the "tutorial flashes for a
      // frame after refresh" bug.
      if (remoteTerminalRef.current) return;
      // Monotonic-forward on the client too — matches the server guard
      // so we don't fire a doomed round-trip when a stale effect asks
      // for a lower step than the user has already reached.
      if (next <= remoteStepRef.current) return;
      setOptimisticStep(next);
      setOptimisticState("in_progress");
      try {
        await advanceMutation({ step: next });
      } catch (err) {
        console.warn("[tutorial] advance failed", err);
        // Roll back optimistic on failure
        setOptimisticStep(null);
        setOptimisticState(null);
      }
    },
    [advanceMutation],
  );

  const advance = useCallback(async () => {
    // Same terminal-lock — nothing advances a terminal user forward
    // except an explicit restart (below).
    if (remoteTerminalRef.current) return;
    const next = Math.min(step + 1, TUTORIAL_TOTAL_STEPS + 1) as TutorialStep;
    if (next > TUTORIAL_TOTAL_STEPS) {
      // Moving past the last step completes the tutorial.
      setOptimisticStep(11 as TutorialStep);
      setOptimisticState("completed");
      try {
        await completeMutation({});
      } catch (err) {
        console.warn("[tutorial] complete failed", err);
        setOptimisticStep(null);
        setOptimisticState(null);
      }
      return;
    }
    await goTo(next);
  }, [step, goTo, completeMutation]);

  const skip = useCallback(async () => {
    setOptimisticState("skipped");
    setOptimisticStep(11 as TutorialStep);
    try {
      await skipMutation({});
    } catch (err) {
      console.warn("[tutorial] skip failed", err);
      setOptimisticState(null);
      setOptimisticStep(null);
    }
  }, [skipMutation]);

  const complete = useCallback(async () => {
    setOptimisticState("completed");
    setOptimisticStep(11 as TutorialStep);
    try {
      await completeMutation({});
    } catch (err) {
      console.warn("[tutorial] complete failed", err);
      setOptimisticState(null);
      setOptimisticStep(null);
    }
  }, [completeMutation]);

  const restart = useCallback(async () => {
    // Release the terminal latch -- restart is the one deliberate way
    // back in, and without this the guard above would block it forever.
    sawTerminalRef.current = false;
    setOptimisticState("in_progress");
    setOptimisticStep(1 as TutorialStep);
    // Restart is the only path that un-marks beats — drop the local
    // mirror too, or it would keep suppressing them after the reset.
    setLocalMilestones([]);
    try {
      await restartMutation({});
    } catch (err) {
      console.warn("[tutorial] restart failed", err);
      setOptimisticState(null);
      setOptimisticStep(null);
    }
  }, [restartMutation]);

  const markMilestone = useCallback(
    (key: TutorialMilestone) => {
      // Local first so the very next render already sees the beat as
      // done. The server call is fire-and-forget and idempotent; if it
      // fails the user simply keeps the in-memory guard for this session
      // and the mutation is retried the next time the beat completes.
      setLocalMilestones((prev) =>
        prev.includes(key) ? prev : [...prev, key],
      );
      void markMilestoneMutation({ key }).catch((err) => {
        console.warn("[tutorial] milestone mark failed", key, err);
      });
    },
    [markMilestoneMutation],
  );

  const milestonesRef = useRef<readonly TutorialMilestone[]>(milestones);
  milestonesRef.current = milestones;
  // Reads through a ref so the callback identity stays stable — step
  // effects put it in dep arrays.
  const hasMilestone = useCallback(
    (key: TutorialMilestone) => milestonesRef.current.includes(key),
    [],
  );

  // `null` clears the override (natural baseActive takes over again).
  // `true` / `false` force-show / force-hide respectively. See the
  // TutorialActions.setActive JSDoc for the "why" and the bug this
  // three-valued API prevents.
  const setActive = useCallback((nextActive: boolean | null) => {
    setActiveOverride(nextActive);
  }, []);

  // Reset override when the underlying state changes — prevents an
  // override from sticking around after the user navigates away.
  useEffect(() => {
    if (backendState === "completed" || backendState === "skipped") {
      setActiveOverride(null);
    }
  }, [backendState]);

  // ── Self-healing completion ─────────────────────────────────────────
  // Completion used to depend entirely on the user pressing Continue on
  // Step4's finale card. Anyone who sent their contribution request and
  // then closed the tab was left at `in_progress` / step 10 forever, and
  // the tour re-mounted on every subsequent visit — the "it keeps coming
  // back even after I finished it" report.
  //
  // Every beat being marked IS the definition of finished, so persist it
  // rather than waiting on a button. Runs once per session (ref guard),
  // only on a hydrated non-terminal record.
  const autoCompleteFiredRef = useRef(false);
  useEffect(() => {
    if (autoCompleteFiredRef.current) return;
    if (!remoteLoaded || remoteTerminal) return;
    const allDone = (
      [
        "map_task_done",
        "combat_done",
        "flare_done",
        "contribute_done",
      ] as const
    ).every((k) => milestones.includes(k));
    if (!allDone) return;
    autoCompleteFiredRef.current = true;
    setOptimisticState("completed");
    setOptimisticStep(11 as TutorialStep);
    void completeMutation({}).catch((err) => {
      console.warn("[tutorial] auto-complete failed", err);
      autoCompleteFiredRef.current = false;
      setOptimisticState(null);
      setOptimisticStep(null);
    });
  }, [remoteLoaded, remoteTerminal, milestones, completeMutation]);

  // (Post-tutorial sword-drop celebration removed — tutorial now
  // ends silently once the contribute step completes.)

  // ── Context value (stable identity for memoization downstream) ──────────
  const value = useMemo(
    () => ({
      backendState,
      step: effectiveStep as TutorialStep,
      active,
      milestones,
      milestonesLoaded,
      advance,
      goTo,
      skip,
      complete,
      restart,
      setActive,
      markMilestone,
      hasMilestone,
    }),
    [
      backendState,
      effectiveStep,
      active,
      milestones,
      milestonesLoaded,
      advance,
      goTo,
      skip,
      complete,
      restart,
      setActive,
      markMilestone,
      hasMilestone,
    ],
  );

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <TutorialContext.Provider value={value}>
      {children}
      {/* Persistent progress bar — visible only on tutorial pages,
          NOT on the landing / public marketing pages. */}
      <TutorialProgressBarGate
        // Also hide the bar while the user is still watching Sparky's
        // intro pitch (before they've hit "Let's go"). At that moment
        // effectiveStep is still 1 — the guided flow hasn't begun —
        // and showing "1/8" made the persona picker feel counted as
        // step 1. The bar reappears the instant Step2 bumps to step 3.
        visible={active && effectiveStep >= 3}
        // Display renumber: internal steps 1..2 are the invisible
        // name/username capture during signup. The user-visible
        // journey starts at internal step 3 ("create first post"),
        // which they perceive as step 1. Subtract 2 from the internal
        // step and cap total at 8 so the bar reads 1/8 → 8/8 through
        // the actual guided flow. Floor at 0 (not 1) so any race
        // where the bar renders before the visibility gate updates
        // still displays 0 instead of a fake 1/8.
        step={Math.max(0, Math.min(effectiveStep - 2, 8))}
        totalSteps={8}
        onSkip={skip}
      />
      {/*
        MOBILE PERF: only mount the tutorial step components once Clerk has
        confirmed the user is signed in. Each Step is loaded via next/dynamic,
        so gating the mount here also gates the chunk download — anonymous
        landing-page visitors on cellular never fetch this JS at all.
        Signed-in users pay the download once on first authenticated page load.
      */}
      {isLoaded && isSignedIn ? (
        <>
          {/* Step 1 mounts on /profile-setup when tutorial step === 1. */}
          <Step1Welcome />
          {/* Step 2 mounts on /feed when tutorial step === 2. */}
          <Step2TemplatePick />
          {/* Step 3 mounts on /map/world (covers combat + flare) */}
          <Step3MapGuide />
          {/* Step 4 mounts on /feed at step 10 (contribution flow) */}
          <Step4Contribute />
        </>
      ) : null}
      {/* REMOVED per product 2026-08-31: the "Stuck? Skip this step"
          watchdog chip. It was firing on perfectly healthy steps — any
          beat where the user spends >45s reading, typing an idea, or
          fighting a boss surfaced it — so it read as the tutorial
          admitting it was broken. The × on the progress bar remains the
          escape hatch. TutorialStuckEscape is kept below (unused) so the
          behaviour can be restored by re-mounting this one element if
          real stuck reports come back. */}
    </TutorialContext.Provider>
  );
}

/**
 * TutorialStuckEscape
 *
 * Fires only when the tutorial has sat on the same step for >45s.
 * Renders a tiny bottom-right chip: "Stuck? Skip this step" that
 * gives the user an obvious escape valve without having to find the
 * × on the progress bar. First tap advances one step (soft-skip);
 * second tap ends the tutorial entirely (skip mutation).
 *
 * The 45s dwell time is long enough that a user reading a Sparky
 * bubble never sees it, but short enough that a real stuck state
 * (Convex mutation failed silently, Phaser scene didn't dispatch
 * PHASER_READY, boss combat didn't spawn, etc.) surfaces the escape
 * within a minute.
 *
 * Timer resets on every step change so bumping steps quickly (which
 * is what a working tutorial does) never surfaces the chip.
 *
 * CURRENTLY UNMOUNTED — see the note where it used to render above.
 * Kept intact so restoring it is a one-line change.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function TutorialStuckEscape({
  active,
  step,
  onSkip,
  onAdvance,
}: {
  active: boolean;
  step: TutorialStep;
  onSkip: () => void;
  onAdvance: () => void;
}) {
  const [showChip, setShowChip] = useState(false);
  const [tapCount, setTapCount] = useState(0);

  useEffect(() => {
    // Reset any pending "you look stuck" prompt whenever the step
    // actually moves — a working tutorial never surfaces this chip.
    setShowChip(false);
    setTapCount(0);
    if (!active) return;
    if (step < 1 || step > 10) return; // only during the guided window
    const t = window.setTimeout(() => setShowChip(true), 45_000);
    return () => window.clearTimeout(t);
  }, [active, step]);

  if (!active || !showChip) return null;

  const label = tapCount === 0 ? "Stuck? Skip this step" : "Stuck? Skip tutorial";

  return (
    <button
      type="button"
      onClick={() => {
        if (tapCount === 0) {
          // First tap → advance one step (soft-skip). If we're
          // already on the final step this becomes a hard skip via
          // the advance mutation which caps at complete.
          onAdvance();
          setTapCount(1);
          // Re-arm the watchdog on the NEW step in case the advance
          // landed on another stuck screen.
          window.setTimeout(() => setShowChip(true), 15_000);
          setShowChip(false);
        } else {
          // Second tap → skip the whole tutorial. Persists via
          // skipFeedTutorial mutation, provider un-mounts the steps.
          onSkip();
          setShowChip(false);
        }
      }}
      // Fixed to bottom-right of viewport with a high z-index so it
      // sits above every tutorial scrim / bubble / Phaser canvas but
      // below top-level modals. Same visual language as the app's
      // ghost-button chips so it doesn't scream "error UI".
      className="fixed bottom-4 right-4 z-[400] rounded-full border border-white/15 bg-black/70 px-3 py-1.5 text-[11px] font-medium tracking-wide text-white/80 shadow-lg backdrop-blur-sm transition hover:bg-black/85 hover:text-white active:scale-[0.98]"
      aria-label={label}
    >
      {label}
    </button>
  );
}
