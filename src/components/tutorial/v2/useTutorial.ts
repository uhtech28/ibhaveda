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
// 1 = welcome + name/username form
// 2 = template picker on /feed compose
// 3 = outline form inside IdeaWizard
// 4 = map orientation on /map/world
// 5 = first task → AI evaluation → boss combat
// 6 = celebration recap
// 7 = exit watcher — auto-redirect to /profile-setup, optional
// 8 = completed (terminal — never shown)
export type TutorialStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export const TUTORIAL_TOTAL_STEPS = 7;

export type TutorialBackendState =
  | "not_started"
  | "in_progress"
  | "completed"
  | "skipped";

export interface TutorialState {
  /** Convex-backed state (persists across sessions). */
  backendState: TutorialBackendState;
  /** Current step (0..8). 0 = not started; 8 = completed. */
  step: TutorialStep;
  /** Whether the tutorial overlay is visible right now. */
  active: boolean;
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
  /** Restart from step 1. Persists to Convex. */
  restart: () => Promise<void>;
  /** Programmatically hide the overlay without persisting (rarely needed). */
  setActive: (active: boolean) => void;
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
