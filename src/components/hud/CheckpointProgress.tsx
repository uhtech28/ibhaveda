"use client";

import { motion } from "framer-motion";

interface CheckpointProgressProps {
  completed: number;
  total: number;
  goldCount: number;
}

export function CheckpointProgress({ completed, total, goldCount }: CheckpointProgressProps) {
  const percentage = Math.min((completed / total) * 100, 100);

  return (
    <div className="flex items-center gap-2.5">
      {/* Checkpoint count with icon */}
      <div className="flex items-center gap-1.5">
        <div className="w-5 h-5 rounded-md bg-indigo-500/20 flex items-center justify-center">
          <svg className="w-3 h-3 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
            <line x1="4" y1="22" x2="4" y2="15"/>
          </svg>
        </div>
        <span className="text-sm">
          <span className="font-semibold text-white">{completed}</span>
          <span className="text-slate-500">/{total}</span>
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        />
      </div>

      {/* Gold count badge */}
      {goldCount > 0 && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/15 rounded-md border border-amber-500/25"
        >
          <svg className="w-3 h-3 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          <span className="text-[10px] font-bold text-amber-400">{goldCount}</span>
        </motion.div>
      )}
    </div>
  );
}