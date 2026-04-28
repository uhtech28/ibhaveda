"use client";

import { motion, AnimatePresence } from "framer-motion";

interface CheckpointProgressProps {
  completed: number;
  total: number;
  goldCount: number;
  compact?: boolean;
  onClick?: () => void;
}

export function CheckpointProgress({
  completed,
  total,
  goldCount,
  compact = false,
  onClick,
}: CheckpointProgressProps) {
  const percentage = Math.min((completed / total) * 100, 100);

  if (compact) {
    return (
      <div 
        className={`flex items-center gap-2 font-sans group transition-all active:scale-95 ${onClick ? "cursor-pointer hover:opacity-80" : ""}`}
        onClick={onClick}
      >
        <div className="flex flex-col">
          <span className="text-[7px] text-zinc-500 uppercase tracking-widest font-black leading-none mb-0.5">
            Progress
          </span>
          <div className="flex items-baseline gap-0.5">
            <span className="text-[13px] font-black leading-none text-white">{completed}</span>
            <span className="text-[8px] font-bold text-zinc-500">/{total}</span>
          </div>
        </div>

        <div className="relative h-1.5 w-16 overflow-hidden rounded-full border border-white/5 bg-black/40">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>

        <AnimatePresence>
          {goldCount > 0 && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1 rounded-md border border-amber-500/20 bg-amber-500/5 px-1 py-0.5 ml-1"
            >
              <svg className="h-2 w-2 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <span className="text-[9px] font-black text-amber-400">{goldCount}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div 
      className={`flex items-center gap-2.5 font-sans group transition-all active:scale-95 ${onClick ? "cursor-pointer hover:opacity-80" : ""}`}
      onClick={onClick}
    >
      <div className="flex flex-col">
        <span className="mb-1 text-[8px] font-black uppercase leading-none tracking-[0.24em] text-zinc-500">
          Progress
        </span>
        <div className="flex items-center gap-2">
          <div className="flex h-[18px] w-[18px] items-center justify-center rounded-md border border-indigo-400/20 bg-indigo-500/20">
            <svg className="w-3 h-3 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
              <line x1="4" y1="22" x2="4" y2="15"/>
            </svg>
          </div>
          <div className="flex items-baseline gap-0.5">
            <span className="text-[13px] font-black leading-none text-white">{completed}</span>
            <span className="text-[9px] font-bold text-zinc-500">/{total}</span>
          </div>
        </div>
      </div>

      <div className="relative mt-4 h-2 w-20 overflow-hidden rounded-full border border-white/5 bg-black/40 shadow-inner backdrop-blur-sm sm:w-24">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-400 rounded-full relative"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: "spring", stiffness: 150, damping: 20 }}
        >
          {/* Inner highlight */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-white/20 rounded-full" />
        </motion.div>
      </div>

      <AnimatePresence>
        {goldCount > 0 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, x: -10 }}
            animate={{ scale: 1, opacity: 1, x: 0 }}
            className="flex flex-col items-center mt-0.5"
          >
            <span className="mb-0.5 text-[7px] font-black uppercase tracking-[0.2em] text-amber-500/80">Gold</span>
            <div className="flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-1.5 py-1 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
              <svg className="h-2.5 w-2.5 text-amber-400 drop-shadow-[0_0_3px_rgba(245,158,11,0.5)]" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <span className="text-[10px] font-black leading-none tabular-nums text-amber-400">{goldCount}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
