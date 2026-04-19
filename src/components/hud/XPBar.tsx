"use client";

import { motion } from "framer-motion";

interface XPBarProps {
  currentXP: number;
  maxXP: number;
}

export function XPBar({ currentXP, maxXP }: XPBarProps) {
  const percentage = Math.min((currentXP / maxXP) * 100, 100);

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-24 h-3 bg-[#1e293b] rounded-full overflow-hidden border border-white/10">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
      </div>
      <span className="text-xs text-gray-400 font-mono min-w-[60px]">
        {currentXP}/{maxXP} XP
      </span>
    </div>
  );
}