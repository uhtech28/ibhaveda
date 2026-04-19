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
    <>
      {/* Top Bar - Main HUD */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="absolute top-0 left-0 right-0 z-40 pointer-events-none"
      >
        <div className="bg-gradient-to-b from-black/90 via-black/70 to-transparent backdrop-blur-md px-6 py-4 border-b border-white/10">
          <div className="flex items-center justify-between max-w-7xl mx-auto gap-6">
            
            {/* Left: Stage Info */}
            <div className="flex items-center gap-4 pointer-events-auto">
              <motion.div 
                className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] px-5 py-3 rounded-xl border border-[#6366f1]/30 shadow-lg shadow-[#6366f1]/20"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-3">
                  <div className="text-3xl">
                    {getStageIcon(props.currentStage)}
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                      Stage {props.currentStage}/8
                    </div>
                    <div className="text-lg font-bold text-white leading-tight">
                      {props.stageName}
                    </div>
                    <div className="text-xs text-[#6366f1] font-medium">
                      {props.biomeName}
                    </div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] px-5 py-3 rounded-xl border border-emerald-500/30 shadow-lg shadow-emerald-500/20"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-3">
                  <Target className="w-6 h-6 text-emerald-400" />
                  <div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                      Progress
                    </div>
                    <div className="text-2xl font-bold text-white leading-tight">
                      {props.checkpointsCompleted}<span className="text-gray-500">/{props.checkpointsTotal}</span>
                    </div>
                    <div className="w-32 h-1.5 bg-gray-700/50 rounded-full overflow-hidden mt-1">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercentage}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>

              {props.goldCheckpoints > 0 && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="bg-gradient-to-br from-[#f59e0b] to-[#d97706] px-4 py-2 rounded-lg shadow-lg shadow-amber-500/30"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-white" />
                    <div>
                      <div className="text-xs text-amber-100 font-semibold">Gold</div>
                      <div className="text-xl font-bold text-white">{props.goldCheckpoints}</div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
            
            {/* Right: User Info */}
            <div className="flex items-center gap-4 pointer-events-auto">
              <motion.div 
                className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] px-5 py-3 rounded-xl border border-purple-500/30 shadow-lg shadow-purple-500/20"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-purple-400" />
                  <div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                      Level
                    </div>
                    <div className="text-2xl font-bold text-white leading-tight">
                      {props.level}
                    </div>
                    <div className="w-32 h-2 bg-gray-700/50 rounded-full overflow-hidden mt-1">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-[#6366f1] to-[#8b5cf6]"
                        initial={{ width: 0 }}
                        animate={{ width: `${xpPercentage}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {props.xp}/{props.xpToNext} XP
                    </div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] px-4 py-3 rounded-xl border border-white/20 shadow-lg"
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-center">
                  <div className="text-4xl mb-1">
                    {props.personaGender === "male" ? "👨" : "👩"}
                  </div>
                  <div className="text-xs text-gray-400 font-semibold">
                    {props.personaGender === "male" ? "Founder" : "Visionary"}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Bottom Left: System Info */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="absolute bottom-6 left-6 bg-black/80 backdrop-blur-sm px-4 py-3 rounded-lg border border-white/10 text-xs font-mono text-white/70 pointer-events-none z-40"
      >
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-3 h-3 text-green-400" />
          <span className="text-green-400 font-semibold">FPS: {props.fps}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-yellow-400" />
          <span>Brightness: {props.brightness.toFixed(1)}%</span>
        </div>
      </motion.div>
      
      {/* Bottom Right: Controls Help */}
      <motion.div
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-6 right-6 bg-black/80 backdrop-blur-sm px-5 py-4 rounded-lg border border-white/10 text-sm text-white/90 pointer-events-none z-40"
      >
        <div className="font-semibold mb-3 text-white flex items-center gap-2">
          <span className="text-lg">🎮</span>
          Controls
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-blue-400">🖱️</span>
            <span>Drag to pan camera</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400">🎯</span>
            <span>Click checkpoint to focus</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-purple-400">⌨️</span>
            <span>Arrow keys to scroll</span>
          </div>
        </div>
      </motion.div>

      {/* Top Right: Quick Stats */}
      <motion.div
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="absolute top-24 right-6 bg-black/80 backdrop-blur-sm px-4 py-3 rounded-lg border border-white/10 text-xs text-white/80 pointer-events-none z-40"
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-400">Completed:</span>
            <span className="font-bold text-emerald-400">{props.checkpointsCompleted}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-400">Remaining:</span>
            <span className="font-bold text-blue-400">{props.checkpointsTotal - props.checkpointsCompleted}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-400">Gold Bonus:</span>
            <span className="font-bold text-amber-400">{props.goldCheckpoints}</span>
          </div>
          <div className="h-px bg-white/10 my-2" />
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-400">Completion:</span>
            <span className="font-bold text-white">{progressPercentage.toFixed(0)}%</span>
          </div>
        </div>
      </motion.div>
    </>
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
