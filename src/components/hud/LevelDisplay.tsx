"use client";

import React from "react";
import { motion } from "framer-motion";

interface LevelDisplayProps {
  score: number;
  compact?: boolean;
  onClick?: () => void;
}

const LevelDisplayComponent = ({ score, compact = false, onClick }: LevelDisplayProps) => {
  const getTierColors = (score: number) => {
    if (score >= 9) {
      return {
        label: "High",
        primary: "bg-emerald-500/20",
        border: "border-emerald-500/30",
        text: "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]",
      };
    }
    if (score >= 5) {
      return {
        label: "Standard",
        primary: "bg-indigo-500/20",
        border: "border-indigo-500/30",
        text: "text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]",
      };
    }
    return {
      label: "Low",
      primary: "bg-zinc-500/20",
      border: "border-zinc-500/30",
      text: "text-zinc-400 drop-shadow-[0_0_8px_rgba(156,163,175,0.6)]",
    };
  };

  const tier = getTierColors(score);

  if (compact) {
    return (
      <div 
        className={`flex items-center gap-2 font-sans transition-all active:scale-95 ${onClick ? "cursor-pointer hover:opacity-80" : ""}`}
        onClick={onClick}
      >
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-zinc-950/50 ${tier.primary}`}>
          <span className={`text-[15px] font-black tracking-tighter ${tier.text}`}>
            {score}
          </span>
        </div>
        <div className="hidden sm:flex flex-col">
          <span className="text-[7px] text-zinc-500 uppercase tracking-widest font-black leading-none mb-0.5">
            Score
          </span>
          <span className={`text-[8px] font-black uppercase leading-none tracking-widest ${tier.text}`}>
            {tier.label}
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
      <div className="flex flex-col justify-center">
        <span className="text-[9px] text-zinc-500 uppercase tracking-[0.2em] font-black leading-none mb-1">
          Project Score
        </span>

        <div
          className={`px-2 py-0.5 rounded-md bg-zinc-950/40 border border-white/5 ${tier.border}`}
        >
          <span
            className={`text-[9px] font-black uppercase leading-none tracking-[0.18em] ${tier.text}`}
          >
            {tier.label} Quality
          </span>
        </div>
      </div>
    </div>
  );
};

// Memoize to prevent re-renders when score hasn't changed
export const LevelDisplay = React.memo(LevelDisplayComponent);
