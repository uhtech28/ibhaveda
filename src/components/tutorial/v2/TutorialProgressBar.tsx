"use client";

/**
 * TutorialProgressBar
 *
 * Top-of-screen progress indicator. Duolingo-style — a thin green
 * bar with rounded corners that smoothly fills as the user advances
 * through steps.
 *
 * Sticks to the top of the viewport (just below the navbar) and
 * gracefully animates fill on step change. Hidden when no tutorial
 * is active.
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TutorialProgressBarProps {
  /** Whether the tutorial overlay is currently active. */
  visible: boolean;
  /** Current step 1..totalSteps. */
  step: number;
  /** Total number of steps in the tutorial (default 7). */
  totalSteps?: number;
  /** Optional skip handler — renders a small "Skip" button in the right margin. */
  onSkip?: () => void;
}

export function TutorialProgressBar({
  visible,
  step,
  totalSteps = 7,
  onSkip,
}: TutorialProgressBarProps) {
  const pct = Math.max(0, Math.min(1, step / totalSteps));

  // Hydration guard — server doesn't have the Convex tutorial state,
  // so visible is always false on first render. Don't render anything
  // until after mount to keep the server + first client paint matching.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <AnimatePresence>
      {mounted && visible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.25 }}
          className="fixed top-16 left-0 right-0 z-[110] flex items-center justify-center px-4 pointer-events-none"
        >
          <div
            className="flex items-center gap-3 pointer-events-auto rounded-full px-3 py-1.5 border border-white/8"
            style={{
              background: "rgba(10, 13, 18, 0.85)",
              boxShadow: "0 8px 24px -8px rgba(0,0,0,0.55)",
            }}
          >
            {/* ── Bar ──────────────────────────────────────────────────── */}
            <div className="relative h-1.5 w-[min(360px,60vw)] rounded-full bg-white/10 overflow-hidden">
              {/* Fill — site theme indigo→violet, not loud green. */}
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)",
                  boxShadow: "0 0 10px rgba(139, 92, 246, 0.45)",
                }}
                animate={{ width: `${pct * 100}%` }}
                transition={{ type: "spring", stiffness: 220, damping: 30 }}
              />
            </div>

            {/* ── Step label ───────────────────────────────────────────── */}
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/60 select-none tabular-nums">
              {step}/{totalSteps}
            </div>

            {/* ── Skip ─────────────────────────────────────────────────── */}
            {onSkip && (
              <button
                type="button"
                onClick={onSkip}
                className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40 hover:text-white/80 transition-colors"
                aria-label="Skip tutorial"
              >
                Skip
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
