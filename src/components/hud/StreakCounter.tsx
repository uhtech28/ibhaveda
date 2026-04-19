"use client";

import { motion } from "framer-motion";
import { Flame } from "lucide-react";

interface StreakCounterProps {
  streak: number;
}

export function StreakCounter({ streak }: StreakCounterProps) {
  return (
    <motion.div
      className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20"
      whileHover={{ scale: 1.05 }}
    >
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
      >
        <Flame className="w-4 h-4 text-orange-500" />
      </motion.div>
      <span className="text-sm font-semibold text-orange-400">{streak}</span>
      <span className="text-xs text-gray-500">day{streak !== 1 ? "s" : ""}</span>
    </motion.div>
  );
}