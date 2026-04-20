"use client";

import { motion } from "framer-motion";

interface StreakCounterProps {
  streak: number;
}

export function StreakCounter({ streak }: StreakCounterProps) {
  const hasStreak = streak > 0;

  return (
    <motion.div
      className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-900/40 backdrop-blur-md border border-indigo-500/20 shadow-[0_2px_10px_rgba(0,0,0,0.2)] font-sans"
      whileHover={hasStreak ? { scale: 1.05, borderColor: "rgba(99,102,241,0.4)" } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {/* Animated flame */}
      <div className="relative">
        <motion.div
          animate={hasStreak ? { 
            scale: [1, 1.15, 1],
            rotate: [-2, 2, -2],
          } : {}}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          <svg 
            className="w-4.5 h-4.5 drop-shadow-[0_0_6px_rgba(56,189,248,0.5)]" 
            viewBox="0 0 24 24" 
            fill={hasStreak ? "url(#lightningGradient)" : "none"}
            stroke={hasStreak ? "none" : "#475569"}
            strokeWidth={1.5}
          >
            <defs>
              <linearGradient id="lightningGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />    {/* Sky 400 */}
                <stop offset="50%" stopColor="#6366f1" />    {/* Indigo 500 */}
                <stop offset="100%" stopColor="#a855f7" />   {/* Purple 500 */}
              </linearGradient>
            </defs>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </motion.div>
        
        {/* Glow effect when active */}
        {hasStreak && (
          <motion.div
            className="absolute inset-0 blur-md bg-indigo-500/40 -z-10 rounded-full"
            animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.9, 1.2, 0.9] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          />
        )}
      </div>

      <div className="flex items-baseline gap-1.5 pr-1">
        <span className={`text-[15px] font-black leading-none ${hasStreak ? "text-transparent bg-clip-text bg-gradient-to-br from-sky-400 to-indigo-500 drop-shadow-[0_0_8px_rgba(56,189,248,0.3)]" : "text-slate-500"}`}>
          {streak}
        </span>
        <span className={`text-[9px] uppercase tracking-widest font-bold ${hasStreak ? "text-indigo-300" : "text-slate-600"}`}>
          {streak === 1 ? "Day" : "Days"}
        </span>
      </div>
    </motion.div>
  );
}