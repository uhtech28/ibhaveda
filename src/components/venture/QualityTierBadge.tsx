"use client";

import { motion } from "framer-motion";
import { TrendingUp, CheckCircle, Target, FileText, Lightbulb } from "lucide-react";

interface QualityTierBadgeProps {
  completeness: number;
  specificity: number;
  evidence: number;
  originality: number;
  totalScore: number;
  qualityTier: "low" | "standard" | "high";
  feedback?: string;
}

export function QualityTierBadge({
  completeness,
  specificity,
  evidence,
  originality,
  totalScore,
  qualityTier,
  feedback,
}: QualityTierBadgeProps) {
  const tierConfig = {
    low: {
      label: "Low Quality",
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      glow: "shadow-[0_0_15px_rgba(239,68,68,0.2)]",
    },
    standard: {
      label: "Standard Quality",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
      glow: "shadow-[0_0_15px_rgba(59,130,246,0.2)]",
    },
    high: {
      label: "High Quality",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      glow: "shadow-[0_0_15px_rgba(52,211,153,0.2)]",
    },
  };

  const config = tierConfig[qualityTier];

  const dimensions = [
    { label: "Complete", value: completeness, icon: CheckCircle, max: 3 },
    { label: "Specific", value: specificity, icon: Target, max: 3 },
    { label: "Evidence", value: evidence, icon: FileText, max: 3 },
    { label: "Original", value: originality, icon: Lightbulb, max: 3 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`mt-3 p-3 rounded-lg border backdrop-blur-md ${config.bg} ${config.border} ${config.glow}`}
    >
      {/* Tier Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className={`w-4 h-4 ${config.color}`} />
          <span className={`text-sm font-bold ${config.color}`}>
            {config.label}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className={`text-lg font-black ${config.color}`}>
            {totalScore}
          </span>
          <span className="text-xs text-gray-500 font-semibold">/12</span>
        </div>
      </div>

      {/* Dimension Breakdown */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        {dimensions.map((dim) => {
          const Icon = dim.icon;
          const percentage = (dim.value / dim.max) * 100;

          return (
            <div key={dim.label} className="flex items-center gap-2">
              <Icon className={`w-3.5 h-3.5 ${config.color} opacity-70`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs text-gray-400 font-medium">
                    {dim.label}
                  </span>
                  <span className={`text-xs font-bold ${config.color}`}>
                    {dim.value}/{dim.max}
                  </span>
                </div>
                <div className="h-1 bg-gray-800/50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className={`h-full ${
                      qualityTier === "high"
                        ? "bg-emerald-500"
                        : qualityTier === "standard"
                        ? "bg-blue-500"
                        : "bg-red-500"
                    }`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feedback */}
      {feedback && (
        <div className="mt-2 pt-2 border-t border-white/5">
          <p className="text-xs text-gray-400 leading-relaxed">{feedback}</p>
        </div>
      )}
    </motion.div>
  );
}
