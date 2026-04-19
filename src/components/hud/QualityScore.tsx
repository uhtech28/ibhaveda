"use client";

import { motion } from "framer-motion";
import { TrendingUp, DollarSign } from "lucide-react";

interface QualityScoreProps {
  qualityScore: number;
  valuationScore: number;
}

export function QualityScore({ qualityScore, valuationScore }: QualityScoreProps) {
  const getQualityTier = (score: number) => {
    if (score >= 9) return { label: "High", color: "text-emerald-400", bg: "bg-emerald-500/20" };
    if (score >= 5) return { label: "Standard", color: "text-blue-400", bg: "bg-blue-500/20" };
    return { label: "Low", color: "text-gray-400", bg: "bg-gray-500/20" };
  };

  const tier = getQualityTier(qualityScore);

  return (
    <div className="flex items-center gap-3">
      <motion.div
        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${tier.bg}`}
        whileHover={{ scale: 1.05 }}
      >
        <TrendingUp className={`w-3.5 h-3.5 ${tier.color}`} />
        <span className={`text-xs font-semibold ${tier.color}`}>{qualityScore}</span>
        <span className="text-xs text-gray-500">/12</span>
      </motion.div>

      <motion.div
        className="flex items-center gap-1"
        whileHover={{ scale: 1.05 }}
      >
        <DollarSign className="w-4 h-4 text-emerald-400" />
        <span className="text-sm font-bold text-white">
          ${valuationScore.toLocaleString()}
        </span>
      </motion.div>
    </div>
  );
}