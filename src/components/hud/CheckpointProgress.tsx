"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useAtomValue } from "jotai";
import { activeVentureAtom } from "@/lib/stores/hudStore";

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
  const activeVenture = useAtomValue(activeVentureAtom);
  const ideaName = activeVenture?.name || "Progress";

  if (compact) {
    return (
      <div 
        className={`flex items-center gap-2 font-sans group transition-all active:scale-95 ${onClick ? "cursor-pointer hover:opacity-80" : ""}`}
        onClick={onClick}
      >
        <div className="flex flex-col">
          <span className="text-[10px] text-white uppercase tracking-widest font-black leading-none truncate max-w-[120px]" title={ideaName}>
            {ideaName}
          </span>
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
        <span className="text-[12px] font-black uppercase leading-none tracking-[0.15em] text-white truncate max-w-[150px]" title={ideaName}>
          {ideaName}
        </span>
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
