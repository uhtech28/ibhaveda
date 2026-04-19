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
        return { primary: "#3B82F6", gradient: "from-blue-500 to-blue-600", bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400" };
      case 2:
        return { primary: "#8B5CF6", gradient: "from-violet-500 to-purple-600", bg: "bg-violet-500/10", border: "border-violet-500/30", text: "text-violet-400" };
      case 3:
        return { primary: "#F59E0B", gradient: "from-amber-500 to-orange-600", bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400" };
      case 4:
        return { primary: "#10B981", gradient: "from-emerald-500 to-green-600", bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400" };
      default:
        return { primary: "#3B82F6", gradient: "from-blue-500 to-blue-600", bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400" };
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
    <div className="flex items-center gap-2">
      {/* Level badge - sleek modern design */}
      <motion.div
        className="relative"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <div className={`relative w-11 h-11 rounded-xl bg-gradient-to-br ${phaseStyle.gradient} flex items-center justify-center shadow-lg shadow-${phaseStyle.primary}/20`}>
          <motion.span
            key={level}
            initial={{ scale: 0.5, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className="text-xl font-bold text-white"
          >
            {level}
          </motion.span>
          
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl pointer-events-none" />
          
          {/* Subtle inner glow */}
          <div className="absolute inset-0 rounded-xl shadow-[inset_0_-2px_4px_rgba(0,0,0,0.2)]" />
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
      <div className="flex flex-col gap-0.5">
        <span className="text-[9px] text-slate-500 uppercase tracking-widest font-medium">
          Level
        </span>
        
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md ${phaseStyle.bg} border ${phaseStyle.border}`}>
          <span className={`text-[10px] font-semibold ${phaseStyle.text} uppercase tracking-wide`}>
            {phaseNames[phase] || `Phase ${phase}`}
          </span>
        </div>
      </div>
    </div>
  );
}
