"use client";

/**
 * BossHPBar.tsx
 *
 * Phase 19 — Boss HP Display
 *
 * Shows boss health bar when corruption > 60%.
 * Displays boss name, current HP, and visual health indicator.
 */

import { motion, AnimatePresence } from "framer-motion";
import { useAtomValue } from "jotai";
import { corruptionStateAtom } from "@/lib/stores/hudStore";
import { Skull } from "lucide-react";

export function BossHPBar({ forceVisible = false }: { forceVisible?: boolean }) {
  const corruption = useAtomValue(corruptionStateAtom);

  // Show during checkpoint boss fights, or when corruption >= 60% (boss emerging)
  if (!forceVisible && corruption.level < 60) return null;

  const hpPercent = (corruption.bossHp / corruption.bossBaseHp) * 100;
  const isLowHP = hpPercent < 30;
  const isCriticalHP = hpPercent < 15;

  return (
    <AnimatePresence>
      <motion.div
        id="boss-hp-bar"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="fixed top-20 left-1/2 -translate-x-1/2 z-40"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div
          className="rounded-2xl border shadow-lg backdrop-blur-md px-6 py-3"
          style={{
            borderColor: isCriticalHP
              ? "rgba(239, 68, 68, 0.5)"
              : isLowHP
                ? "rgba(245, 158, 11, 0.5)"
                : "rgba(147, 51, 234, 0.3)",
            background: isCriticalHP
              ? "linear-gradient(180deg, rgba(127, 29, 29, 0.9), rgba(239, 68, 68, 0.2))"
              : isLowHP
                ? "linear-gradient(180deg, rgba(120, 53, 15, 0.9), rgba(245, 158, 11, 0.2))"
                : "linear-gradient(180deg, rgba(59, 7, 100, 0.9), rgba(147, 51, 234, 0.2))",
          }}
        >
          {/* Boss Name */}
          <div className="flex items-center gap-2 mb-2">
            <motion.div
              animate={
                isCriticalHP
                  ? {
                      scale: [1, 1.2, 1],
                      rotate: [0, 5, -5, 0],
                    }
                  : {}
              }
              transition={{
                repeat: isCriticalHP ? Infinity : 0,
                duration: 1,
              }}
            >
              <Skull
                className="w-5 h-5"
                style={{
                  color: isCriticalHP ? "#ef4444" : isLowHP ? "#f59e0b" : "#a855f7",
                }}
              />
            </motion.div>
            <span
              className="text-sm font-bold uppercase tracking-wider"
              style={{
                color: isCriticalHP ? "#fecaca" : isLowHP ? "#fed7aa" : "#e9d5ff",
              }}
            >
              {corruption.bossName}
            </span>
          </div>

          {/* HP Bar Container */}
          <div className="relative w-64 h-3 rounded-full overflow-hidden bg-black/40 border border-white/10">
            {/* HP Fill */}
            <motion.div
              className="h-full rounded-full"
              style={{
                width: `${hpPercent}%`,
                background: isCriticalHP
                  ? "linear-gradient(90deg, #7f1d1d, #ef4444, #fca5a5)"
                  : isLowHP
                    ? "linear-gradient(90deg, #78350f, #f59e0b, #fbbf24)"
                    : "linear-gradient(90deg, #581c87, #a855f7, #d8b4fe)",
              }}
              animate={
                isCriticalHP
                  ? {
                      opacity: [1, 0.7, 1],
                    }
                  : {}
              }
              transition={{
                repeat: isCriticalHP ? Infinity : 0,
                duration: 0.8,
              }}
            />

            {/* Shine Effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{
                x: ["-100%", "200%"],
              }}
              transition={{
                repeat: Infinity,
                duration: 2,
                ease: "linear",
              }}
            />
          </div>

          {/* HP Numbers */}
          <div className="flex items-center justify-between mt-1 text-xs font-mono">
            <span
              style={{
                color: isCriticalHP ? "#fca5a5" : isLowHP ? "#fde047" : "#c4b5fd",
              }}
            >
              {corruption.bossHp.toFixed(0)} / {corruption.bossBaseHp.toFixed(0)}
            </span>
            <span
              className="font-bold"
              style={{
                color: isCriticalHP ? "#ef4444" : isLowHP ? "#f59e0b" : "#a855f7",
              }}
            >
              {hpPercent.toFixed(1)}%
            </span>
          </div>

          {/* Warning Text */}
          {isCriticalHP && (
            <motion.div
              className="mt-2 text-center text-xs font-bold uppercase tracking-wide"
              style={{ color: "#ef4444" }}
              animate={{
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                repeat: Infinity,
                duration: 1.5,
              }}
            >
              ⚠ BOSS NEAR DEFEAT ⚠
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
