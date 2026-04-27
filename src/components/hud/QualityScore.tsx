"use client";

import { motion } from "framer-motion";
import { TrendingUp, DollarSign } from "lucide-react";

interface QualityScoreProps {
  qualityScore: number;
  valuationScore: number;
  compact?: boolean;
}

export function QualityScore({ qualityScore, valuationScore, compact = false }: QualityScoreProps) {
  const getQualityTier = (score: number) => {
    if (score >= 9) return { label: "High", color: "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]", bg: "bg-emerald-500/10 border-emerald-500/30", icon: "text-emerald-400" };
    if (score >= 5) return { label: "Standard", color: "text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.4)]", bg: "bg-indigo-500/10 border-indigo-500/30", icon: "text-indigo-400" };
    return { label: "Low", color: "text-gray-400", bg: "bg-gray-500/10 border-gray-500/30", icon: "text-gray-400" };
  };

  const tier = getQualityTier(qualityScore);

  if (compact) {
    return (
      <div className="flex items-center gap-2 font-sans">
        <div className="flex flex-col">
          <span className="text-[7px] text-zinc-500 uppercase tracking-widest font-black leading-none mb-0.5">
            Build
          </span>
          <div className="flex items-baseline gap-0.5">
            <span className={`text-[13px] font-black leading-none ${tier.color}`}>{qualityScore}</span>
            <span className="text-[8px] text-zinc-600 font-bold">/12</span>
          </div>
        </div>
        <div className="h-4 w-px bg-white/10" />
        <div className="flex flex-col">
          <span className="text-[7px] text-zinc-500 uppercase tracking-widest font-black leading-none mb-0.5">
            Value
          </span>
          <div className="flex items-center gap-0.5 text-emerald-400">
            <span className="text-[9px] font-black">$</span>
            <span className="text-[13px] font-black leading-none">{valuationScore.toLocaleString()}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 font-sans group">
      <motion.div
        className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${tier.bg} shadow-lg backdrop-blur-xl transition-all group-hover:border-emerald-500/50`}
        whileHover={{ scale: 1.02 }}
      >
        <div className="flex flex-col">
          <span className="text-[9px] text-zinc-500 uppercase tracking-[0.2em] font-black leading-none mb-1">
            Build Quality
          </span>
          <div className="flex items-baseline gap-1">
            <span className={`text-[15px] font-black leading-none ${tier.color}`}>{qualityScore}</span>
            <span className="text-[10px] text-zinc-500 font-bold uppercase">/12</span>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-zinc-950/40 px-3 py-2 shadow-lg backdrop-blur-xl transition-all hover:border-emerald-500/50"
        whileHover={{ scale: 1.02 }}
      >
        <div className="flex flex-col">
          <span className="text-[9px] text-zinc-500 uppercase tracking-[0.2em] font-black leading-none mb-1">
            Market Value
          </span>
          <div className="flex items-center gap-1.5">
            <DollarSign className="h-3 w-3 text-emerald-400" />
            <span className="text-[15px] font-black leading-none tracking-tight tabular-nums text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-500">
              {valuationScore.toLocaleString()}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
