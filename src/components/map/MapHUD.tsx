"use client";

import { motion } from "framer-motion";
import { Sparkles, Target, TrendingUp, Zap } from "lucide-react";

interface MapHUDProps {
  // Stage info
  currentStage: number;
  stageName: string;
  biomeName: string;
  
  // Progress
  checkpointsCompleted: number;
  checkpointsTotal: number;
  goldCheckpoints: number;
  
  // User info
  level: number;
  xp: number;
  xpToNext: number;
  personaGender: "male" | "female";
  
  // System
  brightness: number;
  fps: number;
}

export function MapHUD(props: MapHUDProps) {
  const xpPercentage = (props.xp / props.xpToNext) * 100;
  const progressPercentage = (props.checkpointsCompleted / props.checkpointsTotal) * 100;

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-3 left-3 right-3 z-50 flex justify-center pointer-events-none"
    >
      <div 
        className="w-full max-w-[1400px] flex items-center justify-between gap-4 px-4 py-2 rounded-2xl border border-white/10 bg-black/80 backdrop-blur-xl shadow-2xl pointer-events-auto"
      >
        {/* Left: Stage & Progress */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-transparent border border-indigo-500/30">
              <span className="text-xl">{getStageIcon(props.currentStage)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400">Stage {props.currentStage}/8</span>
              <span className="text-[13px] font-bold text-white leading-none">{props.stageName}</span>
              <span className="text-[9px] text-zinc-500 font-medium">{props.biomeName}</span>
            </div>
          </div>

          <div className="h-6 w-px bg-white/10" />

          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[7px] font-black uppercase tracking-widest text-emerald-400">Progress</span>
              <div className="flex items-baseline gap-1">
                <span className="text-[13px] font-black text-white">{props.checkpointsCompleted}</span>
                <span className="text-[8px] text-zinc-500">/{props.checkpointsTotal}</span>
              </div>
            </div>
            <div className="relative h-1.5 w-24 overflow-hidden rounded-full border border-white/5 bg-zinc-900">
              <motion.div 
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
          </div>

          {props.goldCheckpoints > 0 && (
            <div className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span className="text-[11px] font-black text-amber-400">{props.goldCheckpoints}</span>
            </div>
          )}
        </div>

        {/* Center: System Stats (Compact) */}
        <div className="hidden md:flex items-center gap-4 px-4 py-1 rounded-full bg-white/5 border border-white/5">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-green-400" />
            <span className="text-[10px] font-mono text-green-400">{props.fps} FPS</span>
          </div>
          <div className="h-3 w-px bg-white/10" />
          <span className="text-[10px] font-mono text-zinc-400">Bright: {props.brightness.toFixed(0)}%</span>
        </div>

        {/* Right: Level & XP */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-[7px] font-black uppercase tracking-widest text-purple-400">Level</span>
              <span className="text-[13px] font-black text-white">{props.level}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[7px] text-zinc-500 uppercase tracking-widest font-black leading-none">XP</span>
              <div className="relative h-1.5 w-24 overflow-hidden rounded-full border border-white/5 bg-zinc-900">
                <motion.div 
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${xpPercentage}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </div>
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5">
            <span className="text-xl">{props.personaGender === "male" ? "👨" : "👩"}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function getStageIcon(stage: number): string {
  const icons = [
    "💡", // Stage 1: Ideation
    "🔍", // Stage 2: Research
    "⚔️", // Stage 3: Validation
    "🎨", // Stage 4: Design
    "⚒️", // Stage 5: Development
    "🚀", // Stage 6: Launch
    "🔄", // Stage 7: Iteration
    "👑", // Stage 8: Scale
  ];
  return icons[stage - 1] || "📍";
}
