"use client";

import { motion } from "framer-motion";
import { TrendingUp, DollarSign } from "lucide-react";

interface QualityScoreProps {
  qualityScore: number;
  valuationScore: number;
}

export function QualityScore({ qualityScore, valuationScore }: QualityScoreProps) {
  const getQualityTier = (score: number) => {
    if (score >= 9) return { label: "High", color: "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]", bg: "bg-emerald-500/10 border-emerald-500/30", icon: "text-emerald-400" };
    if (score >= 5) return { label: "Standard", color: "text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.4)]", bg: "bg-indigo-500/10 border-indigo-500/30", icon: "text-indigo-400" };
    return { label: "Low", color: "text-gray-400", bg: "bg-gray-500/10 border-gray-500/30", icon: "text-gray-400" };
  };

  const tier = getQualityTier(qualityScore);

  return (
    <div className="flex items-center gap-3 font-sans">
      <motion.div
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${tier.bg} backdrop-blur-md shadow-[0_2px_10px_rgba(0,0,0,0.2)]`}
        whileHover={{ scale: 1.05 }}
      >
        <TrendingUp className={`w-3.5 h-3.5 ${tier.icon}`} />
        <div className="flex items-baseline gap-0.5">
          <span className={`text-[13px] font-black leading-none ${tier.color}`}>{qualityScore}</span>
          <span className="text-[10px] text-slate-500 font-semibold uppercase">/12</span>
        </div>
      </motion.div>

      <motion.div
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/40 border border-emerald-500/20 backdrop-blur-md shadow-[0_2px_10px_rgba(0,0,0,0.2)]"
        whileHover={{ scale: 1.05, borderColor: "rgba(52,211,153,0.4)" }}
      >
        <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center">
          <DollarSign className="w-3.5 h-3.5 text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]" />
        </div>
        <span className="text-[14px] font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-emerald-500 tracking-wide drop-shadow-[0_0_8px_rgba(52,211,153,0.2)]">
          {valuationScore.toLocaleString()}
        </span>
      </motion.div>
    </div>
  );
}