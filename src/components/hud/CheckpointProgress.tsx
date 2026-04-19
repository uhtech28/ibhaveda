"use client";

import { motion } from "framer-motion";
import { Flag, Medal } from "lucide-react";

interface CheckpointProgressProps {
  completed: number;
  total: number;
  goldCount: number;
}

export function CheckpointProgress({ completed, total, goldCount }: CheckpointProgressProps) {
  const percentage = Math.min((completed / total) * 100, 100);

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 text-sm">
        <Flag className="w-4 h-4 text-[#6366f1]" />
        <span className="text-gray-300">
          <span className="font-semibold text-white">{completed}</span>
          <span className="text-gray-500">/{total}</span>
        </span>
      </div>

      {goldCount > 0 && (
        <div className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-[#f59e0b]/20 to-[#d97706]/20 rounded-full border border-[#f59e0b]/30">
          <Medal className="w-3 h-3 text-[#f59e0b]" />
          <span className="text-xs font-medium text-[#f59e0b]">{goldCount}</span>
        </div>
      )}

      <div className="hidden sm:block w-20 h-1.5 bg-[#1e293b] rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        />
      </div>
    </div>
  );
}