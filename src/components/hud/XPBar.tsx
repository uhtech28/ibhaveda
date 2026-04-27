"use client";

import React from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";

interface XPBarProps {
  currentXP: number;
  maxXP: number;
  compact?: boolean;
}

const XPBarComponent = ({ currentXP, maxXP, compact = false }: XPBarProps) => {
  const percentage = Math.min((currentXP / maxXP) * 100, 100);
  const isNearlyFull = percentage >= 90;

  if (compact) {
    return (
      <div className="flex items-center gap-2 font-sans group">
        <div className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-zinc-900/40 shadow-sm backdrop-blur-md">
          <Zap
            className="h-3.5 w-3.5 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]"
            fill="currentColor"
          />
        </div>

        <div className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between">
            <span className="text-[7px] text-zinc-500 uppercase tracking-widest font-black leading-none">
              XP
            </span>
            <span className="text-[7px] text-cyan-400/80 font-bold">
              {Math.round(percentage)}%
            </span>
          </div>

          <div className="relative h-1.5 w-24 overflow-hidden rounded-full border border-white/5 bg-black/40">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-600 to-indigo-500"
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5 font-sans group">
      <div className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-zinc-900/40 shadow-[0_4px_20px_rgba(0,0,0,0.4)] backdrop-blur-md transition-transform group-hover:scale-105">
        <Zap
          className="h-4 w-4 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]"
          fill="currentColor"
        />
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-500/10 to-transparent pointer-events-none" />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-black leading-none">
            Experience
          </span>
          <span className="text-[10px] text-cyan-400/80 font-bold tabular-nums">
            {Math.round(percentage)}%
          </span>
        </div>

        <div className="relative flex h-3 w-28 items-center overflow-hidden rounded-full border border-white/5 bg-black/40 p-[1px] shadow-[inset_0_1px_4px_rgba(255,255,255,0.05)] backdrop-blur-sm sm:w-36 lg:w-40">
          <motion.div
            className="h-full rounded-full relative overflow-hidden"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 15,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-indigo-500 to-cyan-400" />
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full h-full"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            <div className="absolute inset-x-0 top-0 h-[1px] bg-white/20 rounded-full" />
          </motion.div>

          {isNearlyFull && (
            <motion.div
              className="absolute inset-0 bg-cyan-400/20 pointer-events-none rounded-full"
              animate={{
                opacity: [0, 0.4, 0],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}
        </div>
      </div>

      <div className="mt-1 hidden min-w-[62px] flex-col items-end sm:flex">
        <div className="text-[12px] font-black tracking-tight text-white tabular-nums leading-none">
          {currentXP.toLocaleString()}
        </div>
        <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-tighter mt-1">
          / {maxXP.toLocaleString()} XP
        </div>
      </div>
    </div>
  );
};

// Memoize to prevent re-renders when XP values haven't changed
export const XPBar = React.memo(XPBarComponent);
