"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAtom } from "jotai";
import { motion, AnimatePresence } from "framer-motion";
import { XPBar } from "./XPBar";
import { LevelDisplay } from "./LevelDisplay";
import { StageInfo } from "./StageInfo";
import { CheckpointProgress } from "./CheckpointProgress";
import { AudioControls } from "./AudioControls";
import { QuestList } from "./QuestList";
import { GoldCounter } from "./GoldCounter";
import { CorruptionMeter } from "./CorruptionMeter";

import {
  hudVisibleAtom,
  hudExpandedAtom,
  activeVentureAtom,
  userProgressAtom,
  stageInfoAtom,
  checkpointProgressAtom,
  corruptionStateAtom,
  submittingTaskAtom,
  activeTaskAtom,
} from "@/lib/stores/hudStore";
import { ChevronDown, ChevronUp, Sparkles, Crown } from "lucide-react";

const HUDComponent = () => {
  const [hudVisible] = useAtom(hudVisibleAtom);
  const [hudExpanded, setHudExpanded] = useAtom(hudExpandedAtom);
  const [activeVenture] = useAtom(activeVentureAtom);
  const [userProgress] = useAtom(userProgressAtom);
  const [stageInfo] = useAtom(stageInfoAtom);
  const [checkpointProgress] = useAtom(checkpointProgressAtom);
  const [corruptionState] = useAtom(corruptionStateAtom);
  const [, setSubmittingTask] = useAtom(submittingTaskAtom);
  const [activeTask] = useAtom(activeTaskAtom);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const toggleExpanded = useCallback(() => {
    setHudExpanded(!hudExpanded);
  }, [hudExpanded, setHudExpanded]);

  const showMentorBadge = useMemo(
    () => userProgress.level >= 40,
    [userProgress.level],
  );

  if (!hudVisible) return null;

  return (
    <>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed top-2 left-2 right-2 z-50 flex justify-center md:top-3 md:left-3 md:right-3"
      >
        <div
          className="w-full max-w-6xl overflow-hidden rounded-[24px] border shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
          style={{
            borderColor: "rgba(99, 102, 241, 0.2)",
            background:
              "linear-gradient(180deg, rgba(15, 23, 42, 0.9), rgba(2, 6, 23, 0.98))",
            backdropFilter: "blur(20px)",
          }}
        >
          <AnimatePresence mode="wait">
            {true && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-2 py-1.5 sm:px-3 sm:py-2">
                  <div
                    className="mx-auto flex items-center justify-center gap-2 sm:gap-4 rounded-2xl border px-2 py-1.5 sm:px-4"
                    style={{
                      borderColor: "rgba(255, 255, 255, 0.05)",
                      background:
                        "rgba(255, 255, 255, 0.02)",
                    }}
                  >
                    <StageInfo
                      stageName={stageInfo.stageName}
                      stageIcon={stageInfo.stageIcon}
                      biomeName={stageInfo.biomeName}
                      stage={stageInfo.stage}
                      currentCheckpoint={stageInfo.currentCheckpoint}
                      totalCheckpointsInStage={stageInfo.totalCheckpointsInStage}
                      compact={true}
                    />
                    
                    <div className="h-6 w-px bg-[#c8b47a]/15" />
                    
                    <GoldCounter compact={true} />
                    <CheckpointProgress
                      completed={checkpointProgress.completed}
                      total={checkpointProgress.total}
                      goldCount={checkpointProgress.goldCount}
                      compact={true}
                      onClick={() => {
                        if (activeTask) {
                          setSubmittingTask(activeTask);
                        }
                      }}
                    />

                    <div className="h-6 w-px bg-white/5" />

                    <CorruptionMeter
                      level={corruptionState.level}
                      phase={corruptionState.phase}
                      bossName={corruptionState.bossName}
                      bossHp={corruptionState.bossHp}
                      bossBaseHp={corruptionState.bossBaseHp}
                      compact={true}
                    />

                    <div className="h-6 w-px bg-white/5" />

                    <LevelDisplay
                      level={userProgress.level}
                      phase={userProgress.phase}
                      compact={true}
                      onClick={() => {
                        if (activeTask) {
                          setSubmittingTask(activeTask);
                        }
                      }}
                    />
                    <XPBar
                      currentXP={userProgress.xp}
                      maxXP={userProgress.xpToNextLevel}
                      compact={true}
                    />
                    <div className="ml-1">
                      <AudioControls />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>


        </div>

        {activeVenture && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute left-3 top-full mt-2 flex items-center gap-2 overflow-hidden rounded-lg border px-3 py-1.5 shadow-[0_4px_15px_rgba(0,0,0,0.3)]"
            style={{
              borderColor: "rgba(196, 175, 120, 0.28)",
              background:
                "linear-gradient(180deg, rgba(72, 68, 44, 0.96), rgba(58, 54, 35, 0.96))",
            }}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span className="max-w-[150px] truncate text-sm font-medium text-[#f5ead0]">
              {activeVenture.name}
            </span>
          </motion.div>
        )}

        {showMentorBadge && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute right-3 top-full mt-2 flex items-center gap-2 rounded-lg border px-3 py-1.5 shadow-[0_4px_15px_rgba(99,102,241,0.2)]"
            style={{
              borderColor: "rgba(196, 175, 120, 0.28)",
              background:
                "linear-gradient(180deg, rgba(72, 68, 44, 0.96), rgba(58, 54, 35, 0.96))",
            }}
          >
            <Crown className="w-4 h-4 text-amber-300" />
            <span className="text-sm font-semibold text-[#f5ead0]">Mentor</span>
          </motion.div>
        )}
      </motion.div>

      {/* Quest List - floating top-right panel (manages own positioning) */}
      <QuestList />

    </>
  );
};

// Memoize HUD to prevent unnecessary re-renders
// Only re-render when Jotai atom values actually change
export const HUD = React.memo(HUDComponent);
