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
    <div className="flex items-center gap-3">
      {/* XP Icon with pixel-art frame */}
      <div
        className="relative w-8 h-8 bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border-2 border-indigo-500/40 rounded-none flex items-center justify-center"
        style={{
          boxShadow:
            "2px 2px 0px rgba(0, 0, 0, 0.8), inset 1px 1px 0px rgba(255, 255, 255, 0.1)",
        }}
      >
        <Zap className="w-4 h-4 text-indigo-400" fill="currentColor" />
        {/* Pixel corners */}
        <div className="absolute top-0 left-0 w-1 h-1 bg-indigo-400/60" />
        <div className="absolute top-0 right-0 w-1 h-1 bg-indigo-400/60" />
        <div className="absolute bottom-0 left-0 w-1 h-1 bg-indigo-400/60" />
        <div className="absolute bottom-0 right-0 w-1 h-1 bg-indigo-400/60" />
      </div>

      {/* XP Bar Container */}
      <div className="flex flex-col gap-1">
        {/* Label */}
        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold leading-none">
          Experience
        </span>

        {/* Bar with pixel-art styling */}
        <div className="relative w-32 h-4 bg-[#0f1419] border-2 border-white/20 rounded-none overflow-hidden">
          {/* Pixel-art depth effect */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              boxShadow: "inset 2px 2px 0px rgba(0, 0, 0, 0.6)",
            }}
          />

          {/* Inner shadow border */}
          <div className="absolute inset-0 border border-black/40 pointer-events-none" />

          {/* Animated XP Fill */}
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 rounded-none"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 20,
            }}
            style={{
              boxShadow: "inset 0 1px 0px rgba(255, 255, 255, 0.3)",
            }}
          />

          {/* Shine effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/20 pointer-events-none" />

          {/* Pixel segments (retro look) */}
          <div className="absolute inset-0 flex pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="flex-1 border-r border-black/20"
                style={{ borderRightWidth: i === 7 ? 0 : 1 }}
              />
            ))}
          </div>

          {/* Nearly full pulse effect */}
          {isNearlyFull && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"
              animate={{
                x: ["-100%", "200%"],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          )}

          {/* Pixel-art corner accents */}
          <div className="absolute top-0 left-0 w-1 h-1 bg-white/40 pointer-events-none" />
          <div className="absolute top-0 right-0 w-1 h-1 bg-white/40 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-1 h-1 bg-white/40 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-1 h-1 bg-white/40 pointer-events-none" />
        </div>
      </div>

      {/* XP Numbers with pixel font styling */}
      <motion.div
        key={currentXP}
        initial={{ scale: 1.2, opacity: 0.5 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="text-xs text-gray-400 font-mono min-w-[65px] tabular-nums"
        style={{
          textShadow: "1px 1px 0px rgba(0, 0, 0, 0.8)",
        }}
      >
        <span className={isNearlyFull ? "text-indigo-400" : ""}>
          {currentXP}
        </span>
        <span className="text-gray-600">/</span>
        <span>{maxXP}</span>
      </motion.div>
    </div>
  );
}
