"use client";

import React from "react";
import { motion } from "framer-motion";

interface LevelDisplayProps {
  level: number;
  phase: number;
  compact?: boolean;
  onClick?: () => void;
}

const LevelDisplayComponent = ({ level, phase, compact = false, onClick }: LevelDisplayProps) => {
  const getPhaseColors = (phase: number) => {
    switch (phase) {
      case 1:
        return {
          primary: "bg-blue-500/20",
          border: "border-blue-500/30",
          text: "text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]",
        };
      case 2:
        return {
          primary: "bg-indigo-500/20",
          border: "border-indigo-500/30",
          text: "text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]",
        };
      case 3:
        return {
          primary: "bg-violet-500/20",
          border: "border-violet-500/30",
          text: "text-violet-400 drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]",
        };
      case 4:
        return {
          primary: "bg-purple-500/20",
          border: "border-purple-500/30",
          text: "text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]",
        };
      case 5:
        return {
          primary: "bg-amber-500/20",
          border: "border-amber-500/30",
          text: "text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]",
        };
      default:
        return {
          primary: "bg-indigo-500/20",
          border: "border-indigo-500/30",
          text: "text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]",
        };
    }
  };

  const phaseStyle = getPhaseColors(phase);
  const isMentor = level >= 40;

  const phaseNames: Record<number, string> = {
    1: "Tutorial",
    2: "Early",
    3: "Mid",
    4: "Senior",
    5: "Mentor",
  };

  if (compact) {
    return (
      <div 
        className={`flex items-center gap-2 font-sans transition-all active:scale-95 ${onClick ? "cursor-pointer hover:opacity-80" : ""}`}
        onClick={onClick}
      >
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-zinc-950/50 ${phaseStyle.primary}`}>
          <span className={`text-[15px] font-black tracking-tighter ${phaseStyle.text}`}>
            {level}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[7px] text-zinc-500 uppercase tracking-widest font-black leading-none mb-0.5">
            Level
          </span>
          <span className={`text-[8px] font-black uppercase leading-none tracking-widest ${phaseStyle.text}`}>
            {phaseNames[phase] || `Phase ${phase}`}
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
          className={`relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-zinc-950/50 ${phaseStyle.primary} shadow-lg backdrop-blur-xl transition-all group-hover:border-indigo-500/50`}
        >
          <motion.span
            key={level}
            initial={{ scale: 0.5, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className={`text-[17px] font-black tracking-tighter ${phaseStyle.text}`}
          >
            {level}
          </motion.span>

          {/* Subtle inner glow */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
        </div>

        {/* Mentor crown badge */}
        {isMentor && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-md border border-amber-300 bg-gradient-to-br from-amber-400 to-amber-600 shadow-[0_4px_12px_rgba(245,158,11,0.5)]"
          >
            <svg
              className="h-3 w-3 text-white"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
            </svg>
          </motion.div>
        )}
      </motion.div>

      {/* Level info */}
      <div className="flex flex-col justify-center">
        <span className="text-[9px] text-zinc-500 uppercase tracking-[0.2em] font-black leading-none mb-1">
          Player Level
        </span>

        <div
          className={`px-2 py-0.5 rounded-md bg-zinc-950/40 border border-white/5 ${phaseStyle.border}`}
        >
          <span
            className={`text-[9px] font-black uppercase leading-none tracking-[0.18em] ${phaseStyle.text}`}
          >
            {phaseNames[phase] || `Phase ${phase}`}
          </span>
        </div>
      </div>
    </div>
  );
};

// Memoize to prevent re-renders when level/phase haven't changed
export const LevelDisplay = React.memo(LevelDisplayComponent);
