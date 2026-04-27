"use client";

import React from "react";
import { motion } from "framer-motion";

interface StageInfoProps {
  stageName: string;
  stageIcon: string;
  biomeName: string;
  centered?: boolean;
  stage?: number;
  currentCheckpoint?: number;
  totalCheckpointsInStage?: number;
  compact?: boolean;
}

const StageInfoComponent = ({
  stageName,
  stageIcon,
  biomeName,
  centered = false,
  stage = 1,
  currentCheckpoint = 1,
  totalCheckpointsInStage = 4,
  compact = false,
}: StageInfoProps) => {
  const visibleCheckpoints = Math.max(4, totalCheckpointsInStage);

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
        <div className="relative px-12 py-6 bg-zinc-950/60 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex flex-col items-center">
          {/* Biome icon with animated pulse */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2">
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="w-20 h-20 bg-zinc-900/90 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
            >
              <span className="text-4xl drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
                {stageIcon}
              </span>
            </motion.div>
            <div className="absolute inset-0 rounded-full bg-indigo-500/30 blur-xl -z-10 animate-pulse" />
          </div>

          {/* Title with premium spacing */}
          <div className="text-center mt-6">
            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.4em] mb-2 block">
              Entering Stage {stage}
            </span>
            <h2 className="text-3xl font-black text-white uppercase tracking-[0.2em] mb-2 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
              {biomeName}
            </h2>
            <div className="h-[2px] w-12 bg-indigo-500 mx-auto my-3 rounded-full" />
            <p className="text-[12px] text-zinc-400 font-bold uppercase tracking-widest leading-none">
              {stageName}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (compact) {
    return (
      <motion.div
        className="flex items-center gap-2.5 font-sans group"
        initial={{ x: -10, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
      >
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#d1bd89]/20 bg-[#3d3a24] shadow-md">
          <span className="text-[18px]">
            {stageIcon}
          </span>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#f7e7b0]/10 to-transparent pointer-events-none" />
        </div>

        <div className="flex flex-col justify-center gap-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[8px] font-black uppercase tracking-wider text-[#a79a72]">
              Stage {stage}
            </span>
            <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-500">
              {stageName}
            </span>
          </div>
          <span className="truncate text-[12px] font-black uppercase tracking-tight text-[#f7f0db]">
            {biomeName}
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
             <div className="flex items-center gap-1">
              {Array.from({ length: visibleCheckpoints }).map((_, index) => {
                const checkpointNumber = index + 1;
                const isUnlocked = checkpointNumber <= currentCheckpoint;
                const isCurrent = checkpointNumber === currentCheckpoint;

                return (
                  <div
                    key={checkpointNumber}
                    className={`h-1.5 rounded-full transition-all ${
                      isCurrent
                        ? "w-4 bg-amber-300"
                        : isUnlocked
                          ? "w-1.5 bg-emerald-400"
                          : "w-1.5 bg-white/10"
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="flex items-center gap-3 font-sans group"
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.1 }}
    >
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#d1bd89]/20 bg-[#3d3a24] shadow-lg transition-transform group-hover:scale-105">
        <span className="text-[22px] drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
          {stageIcon}
        </span>
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#f7e7b0]/10 to-transparent pointer-events-none" />
      </div>

      <div className="flex min-w-0 flex-col justify-center gap-1">
        <div className="flex items-center gap-2">
          <span className="rounded-md border border-[#d1bd89]/30 bg-[#75693c]/45 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-[#f2dfab]">
            Stage {stage}
          </span>
          <span className="truncate text-[9px] font-bold uppercase tracking-[0.18em] text-[#a79a72]">
            {stageName}
          </span>
        </div>
        <span className="truncate text-[14px] font-black uppercase tracking-[0.14em] leading-none text-[#f7f0db] drop-shadow-sm">
          {biomeName}
        </span>

        <div className="flex items-center gap-2">
          <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#a79a72]">
            Route
          </span>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: visibleCheckpoints }).map((_, index) => {
              const checkpointNumber = index + 1;
              const isUnlocked = checkpointNumber <= currentCheckpoint;
              const isCurrent = checkpointNumber === currentCheckpoint;

              return (
                <div
                  key={checkpointNumber}
                  className={`h-2.5 rounded-full border transition-all ${
                    isCurrent
                      ? "w-6 border-amber-300 bg-gradient-to-r from-amber-300 to-orange-400 shadow-[0_0_10px_rgba(251,191,36,0.45)]"
                      : isUnlocked
                        ? "w-2.5 border-emerald-300/80 bg-emerald-300"
                        : "w-2.5 border-white/10 bg-white/10"
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Memoize to prevent re-renders when props haven't changed
export const StageInfo = React.memo(StageInfoComponent);
