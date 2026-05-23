"use client";

/**
 * TemplateHUD.tsx
 *
 * Template-aware HUD overlay.
 *
 * Reads templateIdAtom and templateMetricAtom from the Jotai store.
 * Renders the correct metric label, icon, color scheme, and progression bar
 * for the active template (Venture, Academic, Lab, Creative).
 *
 * INVARIANT: This component does NOT render Venture-specific code.
 * It is driven entirely by the templateMetricAtom and stageInfoAtom.
 */

import { useAtomValue } from "jotai";
import { motion, AnimatePresence } from "framer-motion";
import {
  templateIdAtom,
  templateMetricAtom,
  corruptionStateAtom,
  stageInfoAtom,
  checkpointProgressAtom,
} from "@/lib/stores/hudStore";
import { getTemplate } from "@/config/templates";
import type { TemplateId } from "@/config/templates";

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE COLOR SCHEMES
// ─────────────────────────────────────────────────────────────────────────────

const TEMPLATE_COLORS: Record<TemplateId, {
  primary: string;
  secondary: string;
  bg: string;
  metricGlow: string;
  progressGradient: string;
}> = {
  venture: {
    primary: "#6366f1",
    secondary: "#818cf8",
    bg: "rgba(15, 15, 26, 0.9)",
    metricGlow: "0 0 20px rgba(99, 102, 241, 0.4)",
    progressGradient: "linear-gradient(90deg, #6366f1, #8b5cf6)",
  },
  academic: {
    primary: "#d4a853",
    secondary: "#8b6914",
    bg: "rgba(26, 20, 8, 0.92)",
    metricGlow: "0 0 20px rgba(212, 168, 83, 0.4)",
    progressGradient: "linear-gradient(90deg, #8b6914, #d4a853, #f0c040)",
  },
  lab: {
    primary: "#06d6a0",
    secondary: "#1a6b8a",
    bg: "rgba(2, 13, 20, 0.92)",
    metricGlow: "0 0 20px rgba(6, 214, 160, 0.4)",
    progressGradient: "linear-gradient(90deg, #1a6b8a, #06d6a0)",
  },
  creative: {
    primary: "#ffd166",
    secondary: "#e8b4d0",
    bg: "rgba(7, 5, 12, 0.9)",
    metricGlow: "0 0 20px rgba(255, 209, 102, 0.4)",
    progressGradient: "linear-gradient(90deg, #e8b4d0, #ffd166, #90e0a0)",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// METRIC DISPLAY
// ─────────────────────────────────────────────────────────────────────────────

function MetricDisplay() {
  const metric = useAtomValue(templateMetricAtom);
  const templateId = useAtomValue(templateIdAtom);
  const corruption = useAtomValue(corruptionStateAtom);
  const colors = TEMPLATE_COLORS[templateId];

  const isHighCorruption = corruption.level >= 75;
  const isWarningCorruption = corruption.level >= 50;

  // Determine if the metric direction indicator should be up or down
  const isImproving = metric.direction === "lower_is_better"
    ? metric.value < 0.5  // Lab: getting closer to significance
    : metric.value > 0;   // Others: going up

  return (
    <div className="flex items-center gap-2">
      <div
        className="text-2xl select-none"
        style={{ filter: isHighCorruption ? "drop-shadow(0 0 10px rgba(239, 68, 68, 0.6))" : `drop-shadow(${colors.metricGlow})` }}
      >
        {isHighCorruption ? "☠" : metric.icon}
      </div>
      <div className="flex flex-col">
        <span
          className="text-xs font-medium uppercase tracking-widest"
          style={{
            color: isHighCorruption ? "#ef4444" : isWarningCorruption ? "#f59e0b" : colors.secondary,
            fontFamily: "monospace",
          }}
        >
          {isHighCorruption ? "SYSTEM COMPROMISED" : metric.label}
        </span>
        <motion.span
          key={metric.displayValue}
          initial={{ scale: 1.1, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-lg font-bold leading-none"
          style={{
            color: isHighCorruption ? "#ef4444" : colors.primary,
            fontFamily: templateId === "lab" ? "Share Tech Mono, monospace" : "inherit",
            textShadow: isHighCorruption ? "0 0 15px rgba(239, 68, 68, 0.7)" : colors.metricGlow,
          }}
        >
          {metric.displayValue}
          {/* Direction arrow for Lab (lower is better) */}
          {metric.direction === "lower_is_better" && (
            <span className="ml-1 text-xs" style={{ color: isImproving ? "#06d6a0" : "#ef4444" }}>
              {isImproving ? "▼" : "▲"}
            </span>
          )}
        </motion.span>
        <span
          className="text-xs mt-0.5 capitalize"
          style={{
            color: metric.qualityTier === "high" ? "#fbbf24"
              : metric.qualityTier === "standard" ? colors.primary
              : "#6b7280",
          }}
        >
          {metric.qualityTier === "high" ? "✦ High Impact" : metric.qualityTier === "standard" ? "Standard" : "Developing"}
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CORRUPTION METER
// ─────────────────────────────────────────────────────────────────────────────

function CorruptionMeter() {
  const corruption = useAtomValue(corruptionStateAtom);
  const isWarning = corruption.level >= 60;
  const isCritical = corruption.level >= 80;

  if (corruption.level === 0) return null;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-widest text-red-400/70">
          ☠ Corruption
        </span>
        <span className="text-xs font-mono" style={{ color: isCritical ? "#ef4444" : isWarning ? "#f59e0b" : "#6b7280" }}>
          {corruption.level}%
        </span>
      </div>
      <div className="relative h-1.5 rounded-full overflow-hidden bg-white/10">
        <motion.div
          className="h-full rounded-full"
          style={{
            width: `${corruption.level}%`,
            background: isCritical
              ? "linear-gradient(90deg, #7f1d1d, #ef4444)"
              : isWarning
              ? "linear-gradient(90deg, #78350f, #f59e0b)"
              : "linear-gradient(90deg, #3b0060, #8b5cf6)",
          }}
          animate={isCritical ? {
            opacity: [1, 0.7, 1],
          } : {}}
          transition={{ repeat: Infinity, duration: 1.5 }}
        />
      </div>
      {isCritical && (
        <motion.p
          className="text-xs text-red-400 font-medium"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          ⚠ Boss emerging — complete tasks to purge
        </motion.p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE INFO
// ─────────────────────────────────────────────────────────────────────────────

function StageInfo() {
  const stageInfo = useAtomValue(stageInfoAtom);
  const progress = useAtomValue(checkpointProgressAtom);
  const templateId = useAtomValue(templateIdAtom);
  const colors = TEMPLATE_COLORS[templateId];

  const pct = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-lg">{stageInfo.stageIcon}</span>
        <div className="flex flex-col">
          <span className="text-xs text-white/50 uppercase tracking-widest font-mono">
            Stage {stageInfo.stage}
          </span>
          <span className="text-sm font-semibold text-white leading-tight">
            {stageInfo.stageName}
          </span>
          <span className="text-xs text-white/40">{stageInfo.biomeName}</span>
        </div>
      </div>

      {/* Checkpoint progress bar */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between">
          <span className="text-xs text-white/40">
            CP {stageInfo.currentCheckpoint}/{stageInfo.totalCheckpointsInStage}
          </span>
          <span className="text-xs font-mono" style={{ color: colors.primary }}>
            {progress.completed}/{progress.total}
          </span>
        </div>
        <div className="relative h-1 rounded-full overflow-hidden bg-white/10">
          <motion.div
            className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{ background: colors.progressGradient }}
          />
        </div>
        {progress.goldCount > 0 && (
          <span className="text-xs text-yellow-400/80">
            ✦ {progress.goldCount} gold
          </span>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN TEMPLATE HUD
// ─────────────────────────────────────────────────────────────────────────────

export function TemplateHUD() {
  const templateId = useAtomValue(templateIdAtom);
  const template = getTemplate(templateId);
  const colors = TEMPLATE_COLORS[templateId];
  const corruption = useAtomValue(corruptionStateAtom);

  const isWarningCorruption = corruption.level >= 50;
  const isHighCorruption = corruption.level >= 75;

  // Corruption visual filter applied to the HUD background
  const hudFilter = corruption.level > 40
    ? `brightness(${1 - (corruption.level - 40) / 200}) saturate(${1 - (corruption.level - 40) / 150})`
    : "none";

  // Glitch motion animation for container when corruption is high
  const glitchAnimation = isHighCorruption
    ? {
        x: [0, -3, 3, 0, -1.5, 1.5, 0],
        y: [0, 1.5, -1.5, 0, 3, -3, 0],
        skewX: [0, -4, 4, 0, -2, 2, 0],
        opacity: [1, 0.75, 1, 0.9, 1, 0.85, 1],
      }
    : { opacity: 1, x: 0, y: 0 };

  const glitchTransition = isHighCorruption
    ? {
        repeat: Infinity,
        duration: 0.35,
        ease: "easeInOut",
        repeatDelay: Math.random() * 2.5 + 0.8,
      }
    : { duration: 0.4, ease: "easeOut" };

  return (
    <motion.div
      className="fixed top-4 left-4 z-50 flex flex-col gap-3 p-4 rounded-xl backdrop-blur-md select-none animate-pulse-slow"
      style={{
        background: isHighCorruption ? "rgba(28, 5, 5, 0.94)" : colors.bg,
        border: isHighCorruption ? "1px solid #ef4444dd" : isWarningCorruption ? "1px solid #f59e0b88" : `1px solid ${colors.primary}33`,
        boxShadow: isHighCorruption ? "0 0 25px rgba(239, 68, 68, 0.45)" : colors.metricGlow,
        minWidth: 220,
        filter: hudFilter,
      }}
      initial={{ opacity: 0, x: -20 }}
      animate={glitchAnimation}
      transition={glitchTransition as any}
    >
      {/* Template badge */}
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
          style={{
            background: `${colors.primary}22`,
            color: colors.primary,
            border: `1px solid ${colors.primary}44`,
          }}
        >
          {template.name}
        </span>
        <span className="text-xs text-white/30 font-mono">
          {template.totalCheckpoints} CP total
        </span>
      </div>

      {/* Stage Info */}
      <StageInfo />

      {/* Divider */}
      <div className="h-px bg-white/10" />

      {/* Quality Metric */}
      <MetricDisplay />

      {/* Corruption Meter (only shown when > 0) */}
      <AnimatePresence>
        {corruption.level > 0 && (
          <motion.div
            key="corruption"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="h-px bg-white/10 mb-3" />
            <CorruptionMeter />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default TemplateHUD;
