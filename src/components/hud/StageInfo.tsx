"use client";

import { motion } from "framer-motion";

interface StageInfoProps {
  stageName: string;
  stageIcon: string;
  biomeName: string;
}

export function StageInfo({ stageName, stageIcon, biomeName }: StageInfoProps) {
  return (
    <motion.div
      className="flex items-center gap-3"
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.1 }}
    >
      <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-white/10 flex items-center justify-center overflow-hidden">
        <span className="text-2xl">{stageIcon}</span>
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-white">{stageName}</span>
        <span className="text-xs text-gray-500">{biomeName}</span>
      </div>
    </motion.div>
  );
}