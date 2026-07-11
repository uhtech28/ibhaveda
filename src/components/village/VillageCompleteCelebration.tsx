"use client";

/**
 * @file VillageCompleteCelebration.tsx
 * @description Full-screen celebration overlay that fires after the Village
 *  Unraveller reveal to close the emotional arc of Stage 1.
 *
 * Renders on top of the map (z-[10025], above the Sparky mascot) and:
 *   1. Locks scroll while visible
 *   2. Plays the level-up fanfare on mount
 *   3. Auto-dismisses after AUTO_DISMISS_MS if the user does nothing
 *   4. Fires `onContinue` when the user clicks the CTA (or Enter/Space)
 *
 * Visual composition:
 *   - Dark rgba backdrop w/ 8px blur
 *   - 24 orbiting/rising gold particles (framer-motion, GPU compositor only)
 *   - Central card with pulsing gold ring, Trophy icon, "STAGE 1 COMPLETE"
 *     title, tagline, stat rows, narrative line and continue button
 *
 * Wire this into `/map/world/page.tsx` by subscribing to the eventBridge
 * event `VILLAGE_COMPLETE` and toggling `open`.
 */

import { useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Check, Sparkles, ArrowRight } from "lucide-react";
import { audioManager } from "@/lib/audio/audioManager";
import { acquireBodyScrollLock } from "@/lib/ui/bodyScrollLock";

export interface VillageCompleteCelebrationProps {
  /** Toggle to show/hide the overlay. */
  open: boolean;
  /** Number of checkpoints cleared this stage. Rendered in the stat row. */
  checkpointsCleared: number;
  /** Total task submissions accepted this stage. */
  tasksCompleted: number;
  /** Called when the user clicks Continue (or auto-dismiss fires). */
  onContinue: () => void;
}

const AUTO_DISMISS_MS = 12_000;
const PARTICLE_COUNT = 24;

/**
 * Random-ish deterministic values for the confetti burst. `useMemo` freezes
 * them so re-renders don't reshuffle particle positions mid-animation.
 */
function useConfettiSeeds() {
  return useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      // Even distribution around the ring with slight jitter
      const baseAngle = (i / PARTICLE_COUNT) * Math.PI * 2;
      const jitter = (Math.sin(i * 12.9898) * 43758.5453) % 1;
      const angle = baseAngle + jitter * 0.4;
      const distance = 220 + Math.abs(jitter) * 180;
      return {
        id: i,
        dx: Math.cos(angle) * distance,
        dy: Math.sin(angle) * distance - 80, // lift upward
        delay: (i % 8) * 0.04,
        size: 6 + (i % 4) * 2,
        tint: [
          "#ffe066",
          "#ffd93b",
          "#fffbe0",
          "#f59e0b",
        ][i % 4],
      };
    });
  }, []);
}

export default function VillageCompleteCelebration({
  open,
  checkpointsCleared,
  tasksCompleted,
  onContinue,
}: VillageCompleteCelebrationProps) {
  const seeds = useConfettiSeeds();

  // ── Audio: play level-up fanfare on mount ────────────────────────────────
  useEffect(() => {
    if (!open) return;
    try {
      audioManager.playLevelUp();
    } catch {
      /* no-op — audio may be locked before user gesture */
    }
  }, [open]);

  // ── Scroll lock while overlay is visible — use reference-counted
  //     helper so nesting with the tutorial mascot / Radix dialogs stays
  //     safe. Previous naive save-and-restore corrupted state when the
  //     tutorial re-rendered while celebration was open.
  useEffect(() => {
    if (!open) return;
    const release = acquireBodyScrollLock();
    return release;
  }, [open]);

  // ── Auto-dismiss safety net ──────────────────────────────────────────────
  const handleContinue = useCallback(() => {
    onContinue();
  }, [onContinue]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(handleContinue, AUTO_DISMISS_MS);
    return () => window.clearTimeout(t);
  }, [open, handleContinue]);

  // ── Keyboard: Enter / Space / Escape all continue ────────────────────────
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
        e.preventDefault();
        handleContinue();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, handleContinue]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="village-complete"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.35 } }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="fixed inset-0 z-[10025] flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="village-complete-title"
          style={{
            backgroundColor: "rgba(2, 6, 23, 0.86)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
          }}
        >
          {/* Gold particle burst behind the card */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            {seeds.map((p) => (
              <motion.span
                key={p.id}
                initial={{ x: 0, y: 0, opacity: 0, scale: 0.5 }}
                animate={{
                  x: p.dx,
                  y: p.dy,
                  opacity: [0, 1, 0],
                  scale: [0.5, 1.2, 0.3],
                }}
                transition={{
                  duration: 2.6,
                  delay: p.delay,
                  ease: "easeOut",
                  repeat: Infinity,
                  repeatDelay: 1.2,
                }}
                className="absolute rounded-full"
                style={{
                  width: p.size,
                  height: p.size,
                  background: p.tint,
                  boxShadow: `0 0 ${p.size * 2}px ${p.tint}`,
                }}
              />
            ))}
          </div>

          {/* Central card */}
          <motion.div
            initial={{ scale: 0.85, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{
              duration: 0.55,
              ease: [0.16, 1, 0.3, 1],
              delay: 0.15,
            }}
            className="relative mx-4 w-full max-w-[520px] overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-b from-slate-900/95 via-slate-950/95 to-black/95 p-5 shadow-[0_25px_60px_rgba(251,191,36,0.25),0_0_120px_rgba(251,191,36,0.15)] sm:p-8"
          >
            {/* Pulsing gold ring behind trophy */}
            <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2">
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.55, 0.35] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                className="h-48 w-48 rounded-full"
                style={{
                  background:
                    "radial-gradient(closest-side, rgba(251,191,36,0.45) 0%, rgba(251,191,36,0) 70%)",
                }}
              />
            </div>

            {/* Trophy icon */}
            <div className="relative flex justify-center">
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 220,
                  damping: 14,
                  delay: 0.35,
                }}
                className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-[0_10px_30px_rgba(251,191,36,0.55)]"
              >
                <Trophy className="h-10 w-10 text-white drop-shadow-md" strokeWidth={2.4} />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0"
                >
                  <Sparkles
                    className="absolute -right-1 -top-1 h-5 w-5 text-amber-200"
                    strokeWidth={2}
                  />
                </motion.div>
              </motion.div>
            </div>

            {/* Title */}
            <motion.h2
              id="village-complete-title"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.4 }}
              className="mt-6 break-words text-center text-2xl font-black uppercase tracking-[0.14em] text-transparent sm:text-3xl sm:tracking-[0.18em]"
              style={{
                backgroundImage:
                  "linear-gradient(180deg, #fef3c7 0%, #fbbf24 50%, #d97706 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                textShadow: "0 0 40px rgba(251,191,36,0.35)",
              }}
            >
              Stage 1 Complete
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.75, duration: 0.4 }}
              className="mt-1 text-center text-sm font-semibold uppercase tracking-[0.32em] text-amber-300/80"
            >
              Ideation · Vanquished
            </motion.p>

            {/* Stats grid */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.4 }}
              className="mt-6 grid grid-cols-2 gap-3"
            >
              <StatCard
                label="Checkpoints"
                value={`${checkpointsCleared}/${checkpointsCleared}`}
                accent="amber"
              />
              <StatCard
                label="Tasks Done"
                value={`${tasksCompleted}/${tasksCompleted}`}
                accent="amber"
              />
            </motion.div>

            {/* Corruption cleared row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.05, duration: 0.4 }}
              className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-300"
            >
              <Check className="h-4 w-4" strokeWidth={3} />
              Corruption Cleared · Village Restored
            </motion.div>

            {/* Narrative flavor */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.5 }}
              className="mt-6 text-center text-sm leading-relaxed text-slate-300/90"
            >
              The Unraveller retreats east into the misted forest.
              <br />
              An older, colder perfectionist stirs beyond the trees…
            </motion.p>

            {/* Continue CTA */}
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.35, duration: 0.4 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleContinue}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 py-3 text-base font-bold uppercase tracking-wider text-slate-900 shadow-[0_8px_24px_rgba(251,191,36,0.4)] transition-shadow hover:shadow-[0_10px_30px_rgba(251,191,36,0.55)] focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-slate-900"
              autoFocus
            >
              Continue Your Quest
              <ArrowRight className="h-5 w-5" strokeWidth={2.6} />
            </motion.button>

            <p className="mt-3 text-center text-[10px] uppercase tracking-widest text-slate-500">
              Press Enter or Space to continue
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Small stat tile used inside the celebration card.
 */
function StatCard({
  label,
  value,
  accent = "amber",
}: {
  label: string;
  value: string;
  accent?: "amber" | "emerald";
}) {
  const ring =
    accent === "amber"
      ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  return (
    <div className={`rounded-xl border ${ring} px-3 py-3 text-center`}>
      <div className="text-[10px] font-semibold uppercase tracking-widest opacity-80">
        {label}
      </div>
      <div className="mt-0.5 text-xl font-black tabular-nums">{value}</div>
    </div>
  );
}
