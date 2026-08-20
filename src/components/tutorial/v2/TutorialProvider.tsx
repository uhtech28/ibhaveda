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
import { usePathname } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { TutorialProgressBar } from "./TutorialProgressBar";
import { Step1Welcome } from "./steps/Step1Welcome";
import { Step2TemplatePick } from "./steps/Step2TemplatePick";
import { Step3MapGuide } from "./steps/Step3MapGuide";
import { Step4Contribute } from "./steps/Step4Contribute";
// SwordDropCelebration was removed from the mount tree per product
// request. The file is kept in the repo (unused) in case we want to
// re-enable a completion cinematic later.
import {
  TutorialContext,
  TUTORIAL_TOTAL_STEPS,
  type TutorialBackendState,
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
  // Returns null while loading or for signed-out users.
  const remote = useQuery(api.tutorial.getMyFeedTutorialState, {});

  // ── Mutations ───────────────────────────────────────────────────────────
  const advanceMutation = useMutation(api.tutorial.advanceFeedTutorial);
  const skipMutation = useMutation(api.tutorial.skipFeedTutorial);
  const completeMutation = useMutation(api.tutorial.completeFeedTutorial);
  const restartMutation = useMutation(api.tutorial.restartFeedTutorial);

  // ── Local optimistic mirror ─────────────────────────────────────────────
  const [optimisticStep, setOptimisticStep] = useState<TutorialStep | null>(null);
  const [optimisticState, setOptimisticState] =
    useState<TutorialBackendState | null>(null);
  // The overlay can be force-hidden without persisting (e.g. user navigates
  // to a page where we want Sparky to disappear briefly without losing
  // their step).
  const [activeOverride, setActiveOverride] = useState<boolean | null>(null);

  // Resolve the effective state — optimistic wins over remote, remote
  // wins over default.
  const backendState: TutorialBackendState =
    optimisticState ?? (remote?.state as TutorialBackendState | undefined) ?? "not_started";

  const step: TutorialStep =
    optimisticStep ?? ((remote?.step ?? 0) as TutorialStep);

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
  const remoteLoaded = remote !== undefined;
  const baseActive =
    remoteLoaded &&
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
  const active = activeOverride != null ? activeOverride : (baseActive || debugActive);
  // Effective step — debug override, else real step, else 1 if user
  // is "not_started" (new signup — Step 1 component needs to mount).
  const effectiveStep = debugActive
    ? (debugStep as TutorialStep)
    : (backendState === "not_started" && step === 0 ? (1 as TutorialStep) : step);

  // ── Actions ─────────────────────────────────────────────────────────────
  const goTo = useCallback(
    async (next: TutorialStep) => {
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
    setOptimisticState("in_progress");
    setOptimisticStep(1 as TutorialStep);
    try {
      await restartMutation({});
    } catch (err) {
      console.warn("[tutorial] restart failed", err);
      setOptimisticState(null);
      setOptimisticStep(null);
    }
  }, [restartMutation]);

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

  // (Post-tutorial sword-drop celebration removed — tutorial now
  // ends silently once the contribute step completes.)

  // ── Context value (stable identity for memoization downstream) ──────────
  const value = useMemo(
    () => ({
      backendState,
      step: effectiveStep as TutorialStep,
      active,
      advance,
      goTo,
      skip,
      complete,
      restart,
      setActive,
    }),
    [backendState, effectiveStep, active, advance, goTo, skip, complete, restart, setActive],
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
      {/* Step 1 mounts on /profile-setup when tutorial step === 1. */}
      <Step1Welcome />
      {/* Step 2 mounts on /feed when tutorial step === 2. */}
      <Step2TemplatePick />
      {/* Step 3 mounts on /map/world (covers combat + flare) */}
      <Step3MapGuide />
      {/* Step 4 mounts on /feed at step 10 (contribution flow) */}
      <Step4Contribute />
      {/* Universal stuck-watchdog — a small "Skip this step" chip that
          appears when the same tutorial step has been active for >45s
          without advancing. Product feedback 2026-08-20: "a few
          people are facing bugs during the tutorial - it gets stuck
          at some random points". Skipping unblocks the user without
          them having to hunt for the top-right × on the progress bar. */}
      <TutorialStuckEscape
        active={active}
        step={effectiveStep}
        onSkip={skip}
        onAdvance={advance}
      />
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
 */
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
