"use client";

/**
 * StreakMilestoneCelebration
 *
 * PRD § 11 — daily streak progression. When the user's streak crosses
 * a milestone, this component renders a celebratory overlay: confetti
 * burst, milestone tier name, day count, and short flavour text.
 *
 * Milestones are tiered to give meaning over time:
 *
 *   3 days   "Kindling"          — the habit is forming
 *   7 days   "First Light"       — a real week of work
 *   14 days  "Two Weeks Deep"    — past the easy stretch
 *   30 days  "Month-Long Flame"  — most people quit before this
 *   60 days  "Forge"             — a true craftsperson cadence
 *   100 days "Centurion"         — a vanishingly rare consistency
 *   200 days "Steward of Time"
 *   365 days "Year of Fire"
 *
 * Caller passes the current streak day count + an `onDismiss` callback.
 * The component figures out which milestone tier this is (if any). If
 * the streak isn't on a milestone day, the component renders null.
 *
 * Caller is responsible for deduping — once a milestone has been
 * celebrated for a venture session, don't re-mount the component for
 * the same streak day until the user actually crosses the NEXT
 * milestone.
 */

import { useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface MilestoneTier {
  /** Required streak day count to qualify for this tier. */
  days: number;
  /** Display name shown in the big readout. */
  name: string;
  /** Brief flavour line shown beneath the name. */
  flavour: string;
  /** Hex tint applied to the confetti + title glow. */
  accent: string;
}

const MILESTONES: readonly MilestoneTier[] = [
  { days: 3,   name: "Kindling",          flavour: "The habit is forming.",                                  accent: "#fbbf24" },
  { days: 7,   name: "First Light",       flavour: "A full week of real work.",                              accent: "#f97316" },
  { days: 14,  name: "Two Weeks Deep",    flavour: "Past the easy stretch.",                                 accent: "#ec4899" },
  { days: 30,  name: "Month-Long Flame",  flavour: "Most people quit before this.",                          accent: "#8b5cf6" },
  { days: 60,  name: "Forge",             flavour: "The cadence of a true craftsperson.",                    accent: "#3b82f6" },
  { days: 100, name: "Centurion",         flavour: "A vanishingly rare consistency.",                        accent: "#10b981" },
  { days: 200, name: "Steward of Time",   flavour: "The work has become who you are.",                       accent: "#06b6d4" },
  { days: 365, name: "Year of Fire",      flavour: "A complete revolution. The compounding is undeniable.",  accent: "#fb7185" },
] as const;

/** Resolves which tier this streak day count satisfies, if any. */
export function getStreakMilestone(streakDays: number): MilestoneTier | null {
  for (const tier of MILESTONES) {
    if (tier.days === streakDays) return tier;
  }
  return null;
}

interface StreakMilestoneCelebrationProps {
  streakDays: number;
  onDismiss: () => void;
}

export function StreakMilestoneCelebration({
  streakDays,
  onDismiss,
}: StreakMilestoneCelebrationProps) {
  const tier = useMemo(() => getStreakMilestone(streakDays), [streakDays]);

  useEffect(() => {
    if (!tier) return;
    const t = window.setTimeout(() => onDismiss(), 4200);
    return () => window.clearTimeout(t);
  }, [tier, onDismiss]);

  return (
    <AnimatePresence>
      {tier && (
        <motion.div
          key={`streak-${streakDays}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="pointer-events-auto fixed inset-0 z-[95] flex items-center justify-center"
          onClick={onDismiss}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 50% 45%, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.85) 80%)",
            }}
          />

          {/* Confetti — 60 small drifting particles in the tier color */}
          <Confetti accent={tier.accent} />

          {/* Center cluster */}
          <div className="relative z-10 px-6 text-center max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="text-[11px] font-black uppercase tracking-[0.5em] mb-3"
              style={{ color: tier.accent, textShadow: `0 0 12px ${tier.accent}80` }}
            >
              Streak Milestone
            </motion.div>

            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: 0.25,
                duration: 0.55,
                type: "spring",
                stiffness: 220,
                damping: 18,
              }}
              className="flex items-center justify-center gap-3 sm:gap-5 mb-4"
            >
              <span
                className="text-7xl sm:text-8xl font-black italic"
                style={{
                  color: tier.accent,
                  fontFamily: "Georgia, serif",
                  textShadow: `0 0 32px ${tier.accent}, 0 6px 0 rgba(0,0,0,0.7)`,
                }}
              >
                {streakDays}
              </span>
              <span className="text-2xl sm:text-3xl font-black uppercase tracking-[0.3em] text-white/80">
                Days
              </span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white mb-3"
              style={{ fontFamily: "Georgia, serif" }}
            >
              {tier.name}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.85, duration: 0.4 }}
              className="text-base sm:text-lg italic text-white/70"
              style={{ fontFamily: "Georgia, serif" }}
            >
              {tier.flavour}
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4, duration: 0.5 }}
              className="mt-8 text-[10px] font-mono uppercase tracking-[0.4em] text-white/40"
            >
              Tap anywhere to continue
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Internal: Confetti ────────────────────────────────────────────────────

function Confetti({ accent }: { accent: string }) {
  // 60 small particles burst from the center
  const particles = useMemo(() => {
    return Array.from({ length: 60 }).map((_, i) => {
      const angle = (i / 60) * Math.PI * 2 + Math.random() * 0.6;
      const distance = 240 + Math.random() * 240;
      return {
        id: i,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        size: 4 + Math.random() * 6,
        rotate: Math.random() * 720 - 360,
        delay: Math.random() * 0.6,
        duration: 1.6 + Math.random() * 0.9,
        // Pick between accent and white for variety
        color: i % 3 === 0 ? "#ffffff" : accent,
      };
    });
  }, [accent]);

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          initial={{ x: 0, y: 0, opacity: 0, rotate: 0, scale: 0.4 }}
          animate={{
            x: p.x,
            y: p.y,
            opacity: [0, 1, 1, 0],
            rotate: p.rotate,
            scale: [0.4, 1, 1, 0.8],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "easeOut",
            times: [0, 0.1, 0.6, 1],
          }}
          className="absolute block"
          style={{
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: 1,
            boxShadow: `0 0 8px ${p.color}90`,
          }}
        />
      ))}
    </div>
  );
}
