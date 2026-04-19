"use client";

import { motion } from "framer-motion";

interface StreakCounterProps {
  streak: number;
}

export function StreakCounter({ streak }: StreakCounterProps) {
  const hasStreak = streak > 0;

  return (
    <motion.div
      className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-800/50 border border-orange-500/15"
      whileHover={hasStreak ? { scale: 1.05 } : {}}
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
            className="w-4 h-4" 
            viewBox="0 0 24 24" 
            fill={hasStreak ? "url(#flameGradient)" : "none"}
            stroke={hasStreak ? "none" : "#6B7280"}
            strokeWidth={2}
          >
            <defs>
              <linearGradient id="flameGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#F97316" />
                <stop offset="50%" stopColor="#EF4444" />
                <stop offset="100%" stopColor="#FCD34D" />
              </linearGradient>
            </defs>
            <path d="M12 2C10.5 5 8 7.5 8 10.5C8 13.5 10 16 12 16C14 16 16 13.5 16 10.5C16 7.5 13.5 5 12 2Z" />
            <path d="M12 8C11 9.5 10 11 10 12.5C10 14 10.5 15 12 15C13.5 15 14 14 14 12.5C14 11 13 9.5 12 8Z" />
          </svg>
        </motion.div>
        
        {/* Glow effect when active */}
        {hasStreak && (
          <motion.div
            className="absolute inset-0 blur-md bg-orange-500/50 -z-10"
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          />
        )}
      </div>

      <div className="flex items-baseline gap-1">
        <span className={`text-sm font-bold font-mono ${hasStreak ? "text-orange-400" : "text-slate-500"}`}>
          {streak}
        </span>
        <span className="text-[10px] text-slate-500 uppercase tracking-wider">
          {streak === 1 ? "day" : "days"}
        </span>
      </div>
    </motion.div>
  );
}