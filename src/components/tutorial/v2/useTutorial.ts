"use client";

/**
 * useTutorial
 *
 * Hook into the TutorialProvider context. Returns the current step,
 * dialogue, mood, and advance/skip/restart actions.
 *
 * Why a separate hook file?
 *   - Lets steps + non-step components consume tutorial state without
 *     pulling the whole provider tree.
 *   - Keeps TutorialProvider focused on state-machine logic.
 *   - Provides a tidy place to attach typed helpers (currentStepKey,
 *     isAtStep, etc.) without bloating the provider.
 */

import { createContext, useContext } from "react";

// ── Step semantics ─────────────────────────────────────────────────────────
// 0 = not started   (default for new user; we trigger step 1 once profile loads)
// 1..10 = live tutorial steps (see mapping below)
// 11 = completed (terminal — never shown)
export type TutorialStep =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11;

// 10-step flow:
//   1 name → 2 username → 3 click + → 4 pick template → 5 write outline
//   → 6 posted / heading to map → 7 task (skipped in map tutorial)
//   → 8 combat / done → 9 fire a flare → 10 make a contribution
export const TUTORIAL_TOTAL_STEPS = 10;

export type TutorialBackendState =
  | "not_started"
  | "in_progress"
  | "completed"
  | "skipped";

/**
 * Durable per-user record of finished tutorial BEATS. Mirrors
 * TUTORIAL_MILESTONES in convex/tutorial.ts — keep the two in sync.
 *
 * `step` is one coarse number; each step contains a multi-beat sub-flow
 * that used to live only in a step component's local React state and so
 * replayed on every remount. These keys are what stop that.
 */
export type TutorialMilestone =
  | "map_task_done"
  | "combat_done"
  | "flare_done"
  | "contribute_done";

export interface TutorialState {
  /** Convex-backed state (persists across sessions). */
  backendState: TutorialBackendState;
  /** Current step (0..8). 0 = not started; 8 = completed. */
  step: TutorialStep;
  /** Whether the tutorial overlay is visible right now. */
  active: boolean;
  /** Beats this user has already finished. Empty until Convex resolves. */
  milestones: readonly TutorialMilestone[];
  /**
   * False until the Convex tutorial query has resolved. Step components
   * MUST NOT decide which beat to open before this is true, or they race
   * the milestone data and replay a finished beat for one render.
   */
  milestonesLoaded: boolean;
}

export interface TutorialActions {
  /** Move forward by one step. Persists to Convex. */
  advance: () => Promise<void>;
  /** Jump to an arbitrary step. Persists to Convex. */
  goTo: (step: TutorialStep) => Promise<void>;
  /** Skip the rest of the tutorial. Persists "skipped" to Convex. */
  skip: () => Promise<void>;
  /** Mark the tutorial completed. Persists to Convex. */
  complete: () => Promise<void>;
  /** Restart from step 1. Persists to Convex (and clears milestones). */
  restart: () => Promise<void>;
  /**
   * Record a finished beat so it never replays for this user, on any
   * device. Idempotent and append-only; safe to fire-and-forget. Updates
   * the local mirror synchronously so the guard is effective on the very
   * next render rather than after the server round-trip.
   */
  markMilestone: (key: TutorialMilestone) => void;
  /** Convenience predicate over `milestones`. */
  hasMilestone: (key: TutorialMilestone) => boolean;
  /**
   * Programmatically override the overlay's visibility without persisting.
   *   - `false` → force-hide (e.g. while a modal owns the screen)
   *   - `true`  → force-show (debug only; rarely correct)
   *   - `null`  → RELEASE the override so the natural completion / step
   *              logic (`baseActive`) decides visibility again.
   *
   * IMPORTANT: callers that only want to "un-hide" the overlay after a
   * temporary hide should pass `null`, NOT `true`. Passing `true` will
   * force the progress bar / Sparky back on screen for already-completed
   * users on every re-render, which is the bug fixed in task #344.
   */
  setActive: (active: boolean | null) => void;
}

export interface TutorialContextValue extends TutorialState, TutorialActions {}

export const TutorialContext = createContext<TutorialContextValue | null>(null);

export function useTutorial(): TutorialContextValue {
  const ctx = useContext(TutorialContext);
  if (!ctx) {
    throw new Error(
      "useTutorial() must be called inside <TutorialProvider>. " +
        "Did you forget to wrap your route?",
    );
  }
  return ctx;
}

/** Hook variant that returns null instead of throwing — for optional consumers. */
export function useTutorialOptional(): TutorialContextValue | null {
  return useContext(TutorialContext);
}
