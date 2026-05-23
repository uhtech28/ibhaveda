"use client";

import { motion, AnimatePresence } from "framer-motion";

interface StreakCounterProps {
  streak: number;
  compact?: boolean;
}

export function StreakCounter({ streak, compact = false }: StreakCounterProps) {
  const hasStreak = streak > 0;

  if (compact) {
    return (
      <div className="flex items-center gap-2 font-sans group">
        <div className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-zinc-950/40">
           <svg 
            className="h-3.5 w-3.5" 
            viewBox="0 0 24 24" 
            fill={hasStreak ? "url(#lightningGradientPremium)" : "none"}
            stroke={hasStreak ? "none" : "#3f3f46"}
            strokeWidth={2}
          >
            <defs>
              <linearGradient id="lightningGradientPremium" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="text-[7px] text-zinc-500 uppercase tracking-widest font-black leading-none mb-0.5">
            Streak
          </span>
          <div className="flex items-baseline gap-1">
            <span className={`text-[13px] font-black leading-none ${hasStreak ? "text-sky-400" : "text-zinc-600"}`}>
              {streak}
            </span>
            <span className="text-[8px] font-bold text-zinc-500 lowercase">d</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-zinc-950/40 px-3 py-2 font-sans shadow-lg backdrop-blur-xl transition-all hover:border-sky-500/30 group"
      whileHover={hasStreak ? { scale: 1.02, transition: { type: "spring", stiffness: 400, damping: 20 } } : {}}
    >
      {/* Animated lightning icon */}
      <div className="relative">
        <motion.div
          animate={hasStreak ? { 
            scale: [1, 1.1, 1],
            rotate: [-5, 5, -5],
          } : {}}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="relative z-10"
        >
          <svg 
            className="h-4 w-4 drop-shadow-[0_0_10px_rgba(56,189,248,0.6)]" 
            viewBox="0 0 24 24" 
            fill={hasStreak ? "url(#lightningGradientPremium)" : "none"}
            stroke={hasStreak ? "none" : "#3f3f46"}
            strokeWidth={2}
          >
            <defs>
              <linearGradient id="lightningGradientPremium" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />    {/* Sky 400 */}
                <stop offset="50%" stopColor="#6366f1" />    {/* Indigo 500 */}
                <stop offset="100%" stopColor="#a855f7" />   {/* Purple 500 */}
              </linearGradient>
            </defs>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </motion.div>
        
        {/* Glow effect when active */}
        <AnimatePresence>
          {hasStreak && (
            <motion.div
              className="absolute inset-0 blur-xl bg-sky-500/30 -z-10 rounded-full"
              animate={{ opacity: [0.2, 0.5, 0.2], scale: [0.8, 1.3, 0.8] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            />
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col pr-1">
        <span className="text-[9px] text-zinc-500 uppercase tracking-[0.25em] font-black leading-none mb-1">
          Streak
        </span>
        <div className="flex items-baseline gap-1.5">
          <span className={`text-[15px] font-black leading-none tracking-tight tabular-nums ${hasStreak ? "text-transparent bg-clip-text bg-gradient-to-br from-sky-400 to-indigo-500 drop-shadow-sm" : "text-zinc-600"}`}>
            {streak}
          </span>
          <span className={`text-[9px] uppercase tracking-widest font-black ${hasStreak ? "text-sky-400/80" : "text-zinc-700"}`}>
            {streak === 1 ? "Day" : "Days"}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
