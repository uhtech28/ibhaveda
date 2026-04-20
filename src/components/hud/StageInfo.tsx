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
        className="fixed top-24 left-1/2 -translate-x-1/2 z-50 font-sans"
      >
        <div
          className="relative px-10 py-5 bg-slate-900/60 backdrop-blur-xl border border-white/20 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] flex flex-col items-center"
        >
          {/* Biome icon */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2">
            <div
              className="w-16 h-16 bg-slate-800/90 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(30,20,50,0.5)]"
            >
              <span className="text-3xl drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">{stageIcon}</span>
            </div>
            {/* Subtle glow behind icon */}
            <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-md -z-10" />
          </div>

          {/* Title */}
          <div className="text-center mt-4">
            <h2
              className="text-2xl font-black text-white uppercase tracking-[0.15em] mb-1.5 drop-shadow-[0_2px_10px_rgba(99,102,241,0.3)]"
            >
              {biomeName}
            </h2>
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-widest text-balance max-w-[200px] leading-tight mx-auto">
              Stage {stage} · {stageName}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="flex items-center gap-3.5 font-sans"
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.1 }}
    >
      {/* Biome icon with modern frame */}
      <div
        className="relative w-12 h-12 bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center shadow-[0_4px_15px_rgba(0,0,0,0.2)]"
      >
        <span className="text-[26px] drop-shadow-[0_0_6px_rgba(255,255,255,0.3)]">{stageIcon}</span>
        {/* Subtle inner glow */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none" />
      </div>

      {/* Text info - biome name is primary */}
      <div className="flex flex-col justify-center">
        <span
          className="text-[13px] font-black text-white uppercase tracking-wider leading-tight drop-shadow-[0_2px_8px_rgba(99,102,241,0.3)]"
        >
          Stage {stage}: {biomeName}
        </span>
        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-0.5">
          {stageName}
        </span>
      </div>
    </motion.div>
  );
}
