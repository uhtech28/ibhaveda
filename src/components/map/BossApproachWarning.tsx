"use client";

/**
 * BossApproachWarning
 *
 * PRD § 6.2 — fires when venture corruption crosses into the
 * "critical" band (90%+). A dramatic screen-anchored alert with red
 * pulsing edges + large drop-in title + boss name. Auto-dismisses
 * after 4s. The CorruptionEscalation in Phaser already darkens the
 * world; this is the explicit narrative cue that the boss is now
 * a threat.
 *
 * Renders nothing when `visible=false`. The parent controls visibility
 * via a ref-tracked corruption threshold so the same band crossing
 * doesn't re-fire the alert.
 */

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BossApproachWarningProps {
  visible: boolean;
  bossName?: string;
  onDismiss?: () => void;
}

export function BossApproachWarning({
  visible,
  bossName,
  onDismiss,
}: BossApproachWarningProps) {
  // Auto-dismiss after 4s — gives the player a beat to read the
  // headline without it becoming a permanent visual.
  useEffect(() => {
    if (!visible) return;
    const t = window.setTimeout(() => onDismiss?.(), 4000);
    return () => window.clearTimeout(t);
  }, [visible, onDismiss]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="boss-approach"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="pointer-events-none fixed inset-0 z-[90]"
        >
          {/* Pulsing red screen-edge border */}
          <div
            className="absolute inset-0 animate-pulse"
            style={{
              boxShadow:
                "inset 0 0 0 12px rgba(220, 38, 38, 0.55), inset 0 0 80px rgba(220, 38, 38, 0.3)",
            }}
          />

          {/* Subtle vignette to focus the eye on the title */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 50% 40%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.5) 70%, rgba(0,0,0,0.75) 100%)",
            }}
          />

          {/* Top-center title cluster */}
          <div className="absolute inset-x-0 top-[24%] flex flex-col items-center px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: -28, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                delay: 0.15,
                duration: 0.45,
                type: "spring",
                stiffness: 220,
                damping: 16,
              }}
              className="text-[10px] sm:text-xs font-black uppercase tracking-[0.5em] text-red-300/90 mb-3"
              style={{ textShadow: "0 0 8px rgba(220, 38, 38, 0.7)" }}
            >
              Corruption · Critical
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20, letterSpacing: "0.5em" }}
              animate={{ opacity: 1, y: 0, letterSpacing: "0.06em" }}
              transition={{ delay: 0.25, duration: 0.55, ease: "easeOut" }}
              className="text-4xl sm:text-5xl md:text-6xl font-black uppercase italic text-white"
              style={{
                fontFamily: "Georgia, serif",
                textShadow:
                  "0 0 22px rgba(220, 38, 38, 0.8), 0 4px 0 rgba(0,0,0,0.6)",
              }}
            >
              The Boss Approaches
            </motion.h2>

            {bossName && (
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.45 }}
                className="mt-4 text-base sm:text-lg italic text-red-200/90"
                style={{
                  fontFamily: "Georgia, serif",
                  textShadow: "0 2px 6px rgba(0,0,0,0.8)",
                }}
              >
                {bossName} draws near.
              </motion.p>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0, duration: 0.4 }}
              className="mt-6 text-[10px] font-black uppercase tracking-[0.4em] text-red-300/60"
            >
              Clear stages now to weaken it.
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
