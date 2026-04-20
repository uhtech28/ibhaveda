"use client";

import { motion } from "framer-motion";
import { Zap } from "lucide-react";

interface XPBarProps {
  currentXP: number;
  maxXP: number;
}

export function XPBar({ currentXP, maxXP }: XPBarProps) {
  const percentage = Math.min((currentXP / maxXP) * 100, 100);
  const isNearlyFull = percentage >= 90;

  return (
    <div className="flex items-center gap-3 font-sans">
      {/* XP Icon with modern frame */}
      <div
        className="relative w-9 h-9 bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center shadow-[0_4px_15px_rgba(0,0,0,0.3)]"
      >
        <Zap className="w-4.5 h-4.5 text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]" fill="currentColor" />
        {/* Subtle inner glow */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      </div>

      {/* XP Bar Container */}
      <div className="flex flex-col gap-1.5">
        {/* Label */}
        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold leading-none">
          Experience
        </span>

        {/* Bar with modern styling */}
        <div className="relative w-36 h-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full overflow-hidden shadow-inner flex items-center p-[2px]">
          {/* Animated XP Fill */}
          <motion.div
            className="absolute inset-[2px] rounded-full overflow-hidden"
            initial={{ width: 0 }}
            animate={{ width: `calc(${percentage}% - 4px)` }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 20,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400 w-[140px] shadow-[0_0_15px_rgba(99,102,241,0.6)]" />
          </motion.div>

          {/* Shine effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-full" />

          {/* Nearly full pulse effect */}
          {isNearlyFull && (
            <motion.div
              className="absolute inset-0 bg-indigo-400/20 pointer-events-none rounded-full"
              animate={{
                opacity: [0, 0.5, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}
        </div>
      </div>

      {/* XP Numbers */}
      <motion.div
        key={currentXP}
        initial={{ scale: 1.1, opacity: 0.5 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="text-[11px] font-semibold min-w-[65px] tabular-nums mt-3 text-slate-300"
      >
        <span className={isNearlyFull ? "text-indigo-400 font-bold" : "text-white"}>
          {currentXP}
        </span>
        <span className="text-slate-500 mx-0.5">/</span>
        <span className="text-slate-400">{maxXP}</span>
      </motion.div>
    </div>
  );
}
