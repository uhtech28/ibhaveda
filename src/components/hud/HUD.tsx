"use client";

import { useAtom } from "jotai";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XPBar } from "./XPBar";
import { LevelDisplay } from "./LevelDisplay";
import { StageInfo } from "./StageInfo";
import { CheckpointProgress } from "./CheckpointProgress";
import { StreakCounter } from "./StreakCounter";
import { QualityScore } from "./QualityScore";
import { AudioControls } from "./AudioControls";
import { QuestList } from "./QuestList";
import { GoldCounter } from "./GoldCounter";
import {
  hudVisibleAtom,
  hudExpandedAtom,
  activeVentureAtom,
  userProgressAtom,
  stageInfoAtom,
  checkpointProgressAtom,
} from "@/lib/stores/hudStore";
import { ChevronDown, ChevronUp, Sparkles, Crown } from "lucide-react";

export function HUD() {
  const [hudVisible] = useAtom(hudVisibleAtom);
  const [hudExpanded, setHudExpanded] = useAtom(hudExpandedAtom);
  const [activeVenture] = useAtom(activeVentureAtom);
  const [userProgress] = useAtom(userProgressAtom);
  const [stageInfo] = useAtom(stageInfoAtom);
  const [checkpointProgress] = useAtom(checkpointProgressAtom);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!hudVisible) return null;

  return (
    <>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        <div className="bg-[#0A0D12]/95 backdrop-blur-md border-b border-white/10">
          <AnimatePresence mode="wait">
            {(!isMobile || hudExpanded) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
                    <div className="flex items-center gap-6 flex-1 min-w-0">
                      <StageInfo
                        stageName={stageInfo.stageName}
                        stageIcon={stageInfo.stageIcon}
                        biomeName={stageInfo.biomeName}
                      />

                      <div className="hidden md:block w-px h-10 bg-white/10" />

                      <GoldCounter compact={false} />

                      <div className="hidden md:block w-px h-10 bg-white/10" />

                      <CheckpointProgress
                        completed={checkpointProgress.completed}
                        total={checkpointProgress.total}
                        goldCount={checkpointProgress.goldCount}
                      />
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0">
                      <StreakCounter streak={userProgress.streak} />

                      <QualityScore
                        qualityScore={userProgress.qualityScore}
                        valuationScore={userProgress.valuationScore}
                      />

                      <div className="hidden lg:block w-px h-10 bg-white/10" />

                      <LevelDisplay
                        level={userProgress.level}
                        phase={userProgress.phase}
                      />

                      <XPBar
                        currentXP={userProgress.xp}
                        maxXP={userProgress.xpToNextLevel}
                      />

                      <AudioControls />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {isMobile && (
            <button
              onClick={() => setHudExpanded(!hudExpanded)}
              className="w-full flex items-center justify-center gap-2 py-2 text-gray-400 hover:text-white transition-colors border-t border-white/5"
            >
              {hudExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              <span className="text-xs uppercase tracking-wider">
                {hudExpanded ? "Collapse" : "Expand"} HUD
              </span>
            </button>
          )}
        </div>

        {activeVenture && (
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="absolute left-4 top-full mt-2 flex items-center gap-2 px-3 py-1.5 bg-slate-900/60 backdrop-blur-md rounded-lg border border-white/10 shadow-[0_4px_15px_rgba(0,0,0,0.3)]"
          >
            <Sparkles className="w-4 h-4 text-indigo-400 drop-shadow-[0_0_5px_rgba(99,102,241,0.5)]" />
            <span className="text-sm text-white font-medium truncate max-w-[150px]">
              {activeVenture.name}
            </span>
          </motion.div>
        )}

        {userProgress.level >= 40 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute right-4 top-full mt-2 flex items-center gap-2 px-3 py-1.5 bg-indigo-500/20 backdrop-blur-md border border-indigo-400/30 rounded-lg shadow-[0_4px_15px_rgba(99,102,241,0.2)]"
          >
            <Crown className="w-4 h-4 text-indigo-400 drop-shadow-[0_0_5px_rgba(99,102,241,0.5)]" />
            <span className="text-sm text-white font-semibold">Mentor</span>
          </motion.div>
        )}
      </motion.div>

      {/* Quest List - floating top-right panel (manages own positioning) */}
      <QuestList />
    </>
  );
}
