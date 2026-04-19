"use client";

import { motion } from "framer-motion";

interface StageInfoProps {
  stageName: string;
  stageIcon: string;
  biomeName: string;
  centered?: boolean;
  stage?: number;
}

export function StageInfo({
  stageName,
  stageIcon,
  biomeName,
  centered = false,
  stage = 1,
}: StageInfoProps) {
  if (centered) {
    // Centered floating title variant for dramatic reveals
    return (
      <motion.div
        initial={{ y: -50, opacity: 0, scale: 0.8 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -50, opacity: 0, scale: 0.8 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="fixed top-24 left-1/2 -translate-x-1/2 z-50"
      >
        <div
          className="relative px-8 py-4 bg-[#0f1419] border-4 border-white/30 rounded-none"
          style={{
            boxShadow:
              "6px 6px 0px rgba(0, 0, 0, 0.9), inset 2px 2px 0px rgba(255, 255, 255, 0.15)",
          }}
        >
          {/* Biome icon */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2">
            <div
              className="w-14 h-14 bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border-4 border-white/30 rounded-none flex items-center justify-center"
              style={{
                boxShadow: "4px 4px 0px rgba(0, 0, 0, 0.9)",
              }}
            >
              <span className="text-3xl">{stageIcon}</span>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mt-2">
            <h2
              className="text-2xl font-bold text-white uppercase tracking-wider mb-1"
              style={{
                textShadow:
                  "3px 3px 0px rgba(0, 0, 0, 0.8), 0 0 10px rgba(255, 255, 255, 0.3)",
              }}
            >
              {biomeName}
            </h2>
            <p className="text-sm text-gray-400 uppercase tracking-widest">
              Stage {stage} · {stageName}
            </p>
          </div>

          {/* Pixel-art corner decorations */}
          <div className="absolute -top-2 -left-2 w-4 h-4 bg-white/30 border-2 border-white/50" />
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-white/30 border-2 border-white/50" />
          <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-white/30 border-2 border-white/50" />
          <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-white/30 border-2 border-white/50" />
        </div>
      </motion.div>
    );
  }

  // Standard HUD variant (compact, left-aligned)
  return (
    <motion.div
      className="flex items-center gap-3"
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.1 }}
    >
      {/* Biome icon with pixel-art frame */}
      <div
        className="relative w-12 h-12 bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border-2 border-white/20 rounded-none flex items-center justify-center overflow-hidden"
        style={{
          boxShadow:
            "3px 3px 0px rgba(0, 0, 0, 0.8), inset 1px 1px 0px rgba(255, 255, 255, 0.1)",
        }}
      >
        <span className="text-2xl">{stageIcon}</span>
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />

        {/* Pixel corner accents */}
        <div className="absolute top-0 left-0 w-1.5 h-1.5 bg-white/40" />
        <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-white/40" />
        <div className="absolute bottom-0 left-0 w-1.5 h-1.5 bg-white/40" />
        <div className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-white/40" />
      </div>

      {/* Text info - biome name is primary */}
      <div className="flex flex-col">
        <span
          className="text-sm font-bold text-white uppercase tracking-wide"
          style={{
            textShadow: "1px 1px 2px rgba(0, 0, 0, 0.8)",
          }}
        >
          Stage {stage}: {biomeName}
        </span>
        <span className="text-xs text-gray-500 uppercase tracking-wider">
          {stageName}
        </span>
      </div>
    </motion.div>
  );
}
