"use client";

import React from "react";
import { motion } from "framer-motion";

interface LevelDisplayProps {
  score: number;
  compact?: boolean;
  onClick?: () => void;
}

function getVentureScoreLabel(score: number): string {
  if (score >= 9.0) return "Exceptional";
  if (score >= 8.0) return "Strong";
  if (score >= 7.0) return "Solid";
  if (score >= 5.0) return "Developing";
  if (score >= 3.0) return "Early";
  return "Nascent";
}

const getTierColors = (score: number) => {
  if (score >= 9) {
    return {
      label: "High",
      primary: "bg-emerald-500/20",
      border: "border-emerald-500/30",
      text: "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]",
      glow: "rgba(52,211,153,0.5)",
    };
  }
  if (score >= 5) {
    return {
      label: "Standard",
      primary: "bg-indigo-500/20",
      border: "border-indigo-500/30",
      text: "text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]",
      glow: "rgba(99,102,241,0.5)",
    };
  }
  return {
    label: "Low",
    primary: "bg-zinc-500/20",
    border: "border-zinc-500/30",
    text: "text-zinc-400 drop-shadow-[0_0_8px_rgba(156,163,175,0.6)]",
    glow: "rgba(156,163,175,0.3)",
  };
};

const LevelDisplayComponent = ({
  score,
  compact = false,
  onClick,
}: LevelDisplayProps) => {
  const tier = getTierColors(score);
  const ventureLabel = getVentureScoreLabel(score);
  // Execution score derived — slightly scaled, capped at 10
  const executionScore = Math.min(score * 1.05, 10);

  const displayScore = Number.isInteger(score) ? String(score) : score.toFixed(1);

  if (compact) {
    return (
      <div
        className={`flex items-center gap-2 font-sans transition-all active:scale-95 ${onClick ? "cursor-pointer hover:opacity-80" : ""}`}
        onClick={onClick}
      >
        {/* Score badge */}
        <motion.div
          key={score}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-zinc-950/60 ${tier.primary}`}
          style={{ boxShadow: `0 0 10px ${tier.glow}` }}
        >
          <span className={`text-[13px] font-black tracking-tighter leading-none ${tier.text}`}>
            {displayScore}
          </span>
        </motion.div>

        {/* Multi-line score info */}
        <div className="hidden sm:flex flex-col gap-[1px]">
          <motion.span
            key={`ps-${score}`}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="text-[7px] text-zinc-400 font-bold leading-none"
          >
            Project Score:{" "}
            <span className={`font-black ${tier.text}`}>{displayScore}</span>
          </motion.span>
          <span className="text-[6.5px] text-zinc-500 font-bold leading-none">
            Venture:{" "}
            <span className={`font-black ${tier.text}`}>{ventureLabel}</span>
          </span>
          <span className="text-[6.5px] text-zinc-500 font-bold leading-none">
            Execution:{" "}
            <span className={`font-black ${tier.text}`}>
              {executionScore.toFixed(1)}
            </span>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-2.5 font-sans group transition-all active:scale-95 ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
    >
      <motion.div
        className="relative"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <div
          className={`relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-zinc-950/50 ${tier.primary} shadow-lg backdrop-blur-xl transition-all group-hover:border-indigo-500/50`}
          style={{ boxShadow: `0 0 16px ${tier.glow}` }}
        >
          <motion.span
            key={score}
            initial={{ scale: 0.5, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className={`text-[17px] font-black tracking-tighter ${tier.text}`}
          >
            {score}
          </motion.span>

          {/* Subtle inner glow */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
        </div>
      </motion.div>

      {/* Score info */}
      <div className="flex flex-col justify-center gap-0.5">
        <span className="text-[9px] text-zinc-500 tracking-[0.2em] font-black leading-none">
          Project Score
        </span>
        <span className="text-[8px] text-zinc-500 font-bold leading-none">
          Venture:{" "}
          <span className={`font-black ${tier.text}`}>{ventureLabel}</span>
        </span>
        <span className="text-[8px] text-zinc-500 font-bold leading-none">
          Execution:{" "}
          <span className={`font-black ${tier.text}`}>
            {executionScore.toFixed(1)}
          </span>
        </span>
      </div>
    </div>
  );
};

// Memoize to prevent re-renders when score hasn't changed
export const LevelDisplay = React.memo(LevelDisplayComponent);
