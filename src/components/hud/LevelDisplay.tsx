"use client";

import { motion } from "framer-motion";

interface LevelDisplayProps {
  level: number;
  phase: number;
}

export function LevelDisplay({ level, phase }: LevelDisplayProps) {
  const getPhaseColors = (phase: number) => {
    switch (phase) {
      case 1:
        return { primary: "bg-blue-500/20", border: "border-blue-500/30", text: "text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]" };
      case 2:
        return { primary: "bg-indigo-500/20", border: "border-indigo-500/30", text: "text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]" };
      case 3:
        return { primary: "bg-violet-500/20", border: "border-violet-500/30", text: "text-violet-400 drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]" };
      case 4:
        return { primary: "bg-purple-500/20", border: "border-purple-500/30", text: "text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]" };
      case 5:
        return { primary: "bg-amber-500/20", border: "border-amber-500/30", text: "text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" };
      default:
        return { primary: "bg-indigo-500/20", border: "border-indigo-500/30", text: "text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]" };
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

  return (
    <div className="flex items-center gap-2.5 font-sans">
      {/* Level badge - sleek modern design */}
      <motion.div
        className="relative"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <div className={`relative w-11 h-11 rounded-xl bg-slate-900/60 backdrop-blur-md border border-white/10 ${phaseStyle.primary} flex items-center justify-center shadow-[0_4px_15px_rgba(0,0,0,0.3)]`}>
          <motion.span
            key={level}
            initial={{ scale: 0.5, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className={`text-[18px] font-black tracking-tight ${phaseStyle.text}`}
          >
            {level}
          </motion.span>
          
          {/* Subtle inner glow */}
          <div className="absolute inset-0 rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] pointer-events-none" />
        </div>

        {/* Mentor crown badge */}
        {isMentor && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg"
          >
            <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/>
            </svg>
          </motion.div>
        )}
      </motion.div>

      {/* Level info */}
      <div className="flex flex-col gap-0.5 justify-center">
        <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
          Level
        </span>
        
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 backdrop-blur-sm border ${phaseStyle.border}`}>
          <span className={`text-[10px] font-bold ${phaseStyle.text} uppercase tracking-widest`}>
            {phaseNames[phase] || `Phase ${phase}`}
          </span>
        </div>
      </div>
    </div>
  );
}
