"use client";

import { motion } from "framer-motion";
import { Shield, Zap, Star } from "lucide-react";

interface LevelDisplayProps {
  level: number;
  phase: number;
}

export function LevelDisplay({ level, phase }: LevelDisplayProps) {
  const getPhaseIcon = (phase: number) => {
    switch (phase) {
      case 1:
        return <Shield className="w-3 h-3" />;
      case 2:
        return <Zap className="w-3 h-3" />;
      case 3:
        return <Star className="w-3 h-3" />;
      default:
        return <Shield className="w-3 h-3" />;
    }
  };

  const getPhaseColor = (phase: number) => {
    switch (phase) {
      case 1:
        return "text-blue-400";
      case 2:
        return "text-purple-400";
      case 3:
        return "text-amber-400";
      default:
        return "text-blue-400";
    }
  };

  return (
    <div className="flex items-center gap-2">
      <motion.div
        className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-white/10 flex items-center justify-center"
        whileHover={{ scale: 1.05 }}
      >
        <span className="text-lg font-bold text-white">{level}</span>
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-lg" />
      </motion.div>
      <div className="flex flex-col">
        <span className="text-xs text-gray-500 uppercase tracking-wider">
          Level
        </span>
        <div className={`flex items-center gap-1 text-xs font-medium ${getPhaseColor(phase)}`}>
          {getPhaseIcon(phase)}
          <span>Phase {phase}</span>
        </div>
      </div>
    </div>
  );
}