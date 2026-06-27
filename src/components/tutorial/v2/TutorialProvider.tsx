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

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { TutorialProgressBar } from "./TutorialProgressBar";
import { Step1Welcome } from "./steps/Step1Welcome";
import { Step2TemplatePick } from "./steps/Step2TemplatePick";
import {
  TutorialContext,
  TUTORIAL_TOTAL_STEPS,
  type TutorialBackendState,
  type TutorialStep,
} from "./useTutorial";

// Routes where the tutorial progress bar should NEVER appear, even if
// the tutorial is technically active. Public/marketing surfaces only.
const PROGRESS_BAR_BLOCKED_ROUTES = ["/", "/sign-in", "/sign-up", "/login", "/register"];

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
  //  - backend says in_progress or not_started
  //  - AND user hasn't completed/skipped
  //  - AND step is 1..7 (0 = pre-start, 8 = done)
  //  - AND no explicit override hides it
  // FIX — new users have backendState="not_started" AND step=0, which
  // failed the `step >= 1` check so Sparky never showed up after
  // signup. Treat the "not_started + step 0" combination as step 1
  // active so the dog appears on /profile-setup.
  const baseActive =
    (backendState === "in_progress" || backendState === "not_started") &&
    ((step >= 1 && step <= 7) || (backendState === "not_started" && step === 0));
  // Debug: `?tutorial_debug=N` in URL forces the overlay open at step N (1-7).
  // Read after hydration only — accessing window during SSR causes a
  // hydration mismatch with the progress-bar markup.
  const [debugStep, setDebugStep] = useState(0);
  useEffect(() => {
    const n = Number(
      new URLSearchParams(window.location.search).get("tutorial_debug"),
    );
    if (Number.isFinite(n) && n >= 1 && n <= 7) setDebugStep(n);
  }, []);
  const debugActive = debugStep >= 1 && debugStep <= 7;
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
      setOptimisticStep(8 as TutorialStep);
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
    setOptimisticStep(8 as TutorialStep);
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
    setOptimisticStep(8 as TutorialStep);
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

  const setActive = useCallback((nextActive: boolean) => {
    setActiveOverride(nextActive);
  }, []);

  // Reset override when the underlying state changes — prevents an
  // override from sticking around after the user navigates away.
  useEffect(() => {
    if (backendState === "completed" || backendState === "skipped") {
      setActiveOverride(null);
    }
  }, [backendState]);

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
        visible={active}
        step={Math.max(1, Math.min(effectiveStep, TUTORIAL_TOTAL_STEPS))}
        totalSteps={TUTORIAL_TOTAL_STEPS}
        onSkip={skip}
      />
      {/* Step 1 mounts on /profile-setup when tutorial step === 1. */}
      <Step1Welcome />
      {/* Step 2 mounts on /feed when tutorial step === 2. */}
      <Step2TemplatePick />
    </TutorialContext.Provider>
  );
}
