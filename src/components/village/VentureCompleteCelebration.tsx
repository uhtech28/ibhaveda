"use client";

/**
 * @file VentureCompleteCelebration.tsx
 * @description Full-screen finale overlay shown after the last stage
 *  (Artisans / Stage 4) is cleared. This is the venture-wide victory
 *  screen — not per-stage — closing the founder's entire arc from
 *  ideation through mastery.
 *
 * Mirrors VillageCompleteCelebration's shape but leans into a
 * crown/laurel motif and a longer narrative beat. Triggered from
 * `/map/world/page.tsx` when the STAGE_COMPLETE event fires with
 * `nextStage > 4`.
 */

import { useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Check, Sparkles, ArrowRight } from "lucide-react";
import { audioManager } from "@/lib/audio/audioManager";
import { acquireBodyScrollLock } from "@/lib/ui/bodyScrollLock";

export interface VentureCompleteCelebrationProps {
  /** Toggle to show/hide the overlay. */
  open: boolean;
  /** Number of stages cleared. Defaults to 4. */
  stagesCleared?: number;
  /** Total task submissions across the venture (best-effort). */
  totalTasksCompleted?: number;
  /** Called when the user acknowledges / auto-dismiss fires. */
  onContinue: () => void;
}

const AUTO_DISMISS_MS = 18_000;
const PARTICLE_COUNT = 36;

function useConfettiSeeds() {
  return useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const baseAngle = (i / PARTICLE_COUNT) * Math.PI * 2;
      const jitter = (Math.sin(i * 12.9898) * 43758.5453) % 1;
      const angle = baseAngle + jitter * 0.4;
      const distance = 260 + Math.abs(jitter) * 220;
      return {
        id: i,
        dx: Math.cos(angle) * distance,
        dy: Math.sin(angle) * distance - 110,
        delay: (i % 10) * 0.045,
        size: 6 + (i % 5) * 2,
        tint: [
          "#fef3c7",
          "#fbbf24",
          "#f59e0b",
          "#fcd34d",
          "#fde68a",
        ][i % 5],
      };
    });
  }, []);
}

export default function VentureCompleteCelebration({
  open,
  stagesCleared = 4,
  totalTasksCompleted,
  onContinue,
}: VentureCompleteCelebrationProps) {
  const seeds = useConfettiSeeds();

  useEffect(() => {
    if (!open) return;
    try {
      audioManager.playLevelUp();
    } catch {
      /* audio unlock may not have fired yet */
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const release = acquireBodyScrollLock();
    return release;
  }, [open]);

  const handleContinue = useCallback(() => {
    onContinue();
  }, [onContinue]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(handleContinue, AUTO_DISMISS_MS);
    return () => window.clearTimeout(t);
  }, [open, handleContinue]);

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
          key="venture-complete"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.4 } }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="fixed inset-0 z-[10025] flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="venture-complete-title"
          style={{
            backgroundColor: "rgba(2, 6, 23, 0.9)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
          }}
        >
          {/* Extended particle field — larger + slower than village to feel epic */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            {seeds.map((p) => (
              <motion.span
                key={p.id}
                initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
                animate={{
                  x: p.dx,
                  y: p.dy,
                  opacity: [0, 1, 0],
                  scale: [0.4, 1.3, 0.25],
                }}
                transition={{
                  duration: 3.2,
                  delay: p.delay,
                  ease: "easeOut",
                  repeat: Infinity,
                  repeatDelay: 1.5,
                }}
                className="absolute rounded-full"
                style={{
                  width: p.size,
                  height: p.size,
                  background: p.tint,
                  boxShadow: `0 0 ${p.size * 2.5}px ${p.tint}`,
                }}
              />
            ))}
          </div>

          <motion.div
            initial={{ scale: 0.82, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.88, opacity: 0 }}
            transition={{
              duration: 0.65,
              ease: [0.16, 1, 0.3, 1],
              delay: 0.2,
            }}
            className="relative mx-4 w-full max-w-[560px] overflow-hidden rounded-2xl border border-amber-500/50 bg-gradient-to-b from-slate-900/95 via-slate-950/95 to-black/95 p-5 shadow-[0_30px_80px_rgba(251,191,36,0.32),0_0_140px_rgba(251,191,36,0.18)] sm:p-9"
          >
            <div className="pointer-events-none absolute -top-28 left-1/2 -translate-x-1/2">
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.65, 0.4] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                className="h-56 w-56 rounded-full"
                style={{
                  background:
                    "radial-gradient(closest-side, rgba(251,191,36,0.55) 0%, rgba(251,191,36,0) 70%)",
                }}
              />
            </div>

            <div className="relative flex justify-center">
              <motion.div
                initial={{ scale: 0, rotate: -35 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 210,
                  damping: 13,
                  delay: 0.4,
                }}
                className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 shadow-[0_12px_36px_rgba(251,191,36,0.65)]"
              >
                <Crown className="h-12 w-12 text-white drop-shadow-md" strokeWidth={2.4} />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0"
                >
                  <Sparkles
                    className="absolute -right-2 -top-2 h-6 w-6 text-amber-200"
                    strokeWidth={2}
                  />
                  <Sparkles
                    className="absolute -bottom-2 -left-2 h-5 w-5 text-amber-100"
                    strokeWidth={2}
                  />
                </motion.div>
              </motion.div>
            </div>

            <motion.h2
              id="venture-complete-title"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.45 }}
              className="mt-6 break-words text-center text-2xl font-black uppercase tracking-[0.14em] text-transparent sm:mt-7 sm:tracking-[0.16em] md:text-4xl"
              style={{
                backgroundImage:
                  "linear-gradient(180deg, #fef3c7 0%, #fbbf24 45%, #d97706 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                textShadow: "0 0 50px rgba(251,191,36,0.4)",
              }}
            >
              Venture Complete
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.45 }}
              className="mt-1 text-center text-sm font-semibold uppercase tracking-[0.3em] text-amber-300/80"
            >
              Founder · Reborn
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.95, duration: 0.4 }}
              className="mt-7 grid grid-cols-2 gap-3"
            >
              <StatCard
                label="Stages Cleared"
                value={`${stagesCleared}/4`}
              />
              <StatCard
                label="Tasks Vanquished"
                value={
                  typeof totalTasksCompleted === "number"
                    ? String(totalTasksCompleted)
                    : "All"
                }
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.4 }}
              className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-300"
            >
              <Check className="h-4 w-4" strokeWidth={3} />
              Corruption cleansed from every biome
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3, duration: 0.5 }}
              className="mt-6 text-center text-sm leading-relaxed text-slate-300/90"
            >
              From doubt in a misted village, through the Forest of Second Guesses,
              across the Golden Harbor of Rejection, and into the Artisan's Forge —
              you carved a founder's path from ideation to mastery.
              <br />
              <span className="mt-2 inline-block text-amber-200/90">
                The realm remembers your name.
              </span>
            </motion.p>

            <motion.button
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.45, duration: 0.4 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleContinue}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 py-3 text-base font-bold uppercase tracking-wider text-slate-900 shadow-[0_10px_28px_rgba(251,191,36,0.45)] transition-shadow hover:shadow-[0_12px_34px_rgba(251,191,36,0.6)] focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-slate-900"
              autoFocus
            >
              Return to the World
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

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-3 text-center text-amber-300">
      <div className="text-[10px] font-semibold uppercase tracking-widest opacity-80">
        {label}
      </div>
      <div className="mt-0.5 text-xl font-black tabular-nums">{value}</div>
    </div>
  );
}
