"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAtom } from "jotai";
import { motion, AnimatePresence } from "framer-motion";
import { XPBar } from "./XPBar";
import { StageInfo } from "./StageInfo";
import { QuestList } from "./QuestList";
import { BossHPBar } from "./BossHPBar";

import {
  hudVisibleAtom,
  hudExpandedAtom,
  activeVentureAtom,
  userProgressAtom,
  stageInfoAtom,
  corruptionStateAtom,
} from "@/lib/stores/hudStore";
import { Sparkles, Crown } from "lucide-react";

const HUDComponent = () => {
  const [hudVisible] = useAtom(hudVisibleAtom);
  const [hudExpanded, setHudExpanded] = useAtom(hudExpandedAtom);
  const [activeVenture] = useAtom(activeVentureAtom);
  const [userProgress] = useAtom(userProgressAtom);
  const [stageInfo] = useAtom(stageInfoAtom);
  const [corruption] = useAtom(corruptionStateAtom);
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

  const glitchAnimation = { y: 0, opacity: 1 };

  const glitchTransition = { type: "spring", stiffness: 300, damping: 30 };

  if (!hudVisible) return null;

  return (
    <>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={glitchAnimation}
        exit={{ y: -100, opacity: 0 }}
        transition={glitchTransition as any}
        className="fixed left-2 right-2 top-2 z-50 flex justify-center md:left-3 md:right-3 md:top-3"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
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
                    className="no-scrollbar mx-auto flex w-full items-center justify-start gap-1.5 overflow-x-auto rounded-2xl border px-2 py-1.5 sm:gap-2 sm:px-3 md:justify-center"
                    style={{
                      borderColor: "rgba(255, 255, 255, 0.05)",
                      background: "rgba(255, 255, 255, 0.02)",
                    }}
                  >
                    {/* Stage icon + biome name */}
                    <div className="shrink-0">
                      <StageInfo
                        stageName={stageInfo.stageName}
                        stageIcon={stageInfo.stageIcon}
                        biomeName={stageInfo.biomeName}
                        stage={stageInfo.stage}
                        currentCheckpoint={stageInfo.currentCheckpoint}
                        totalCheckpointsInStage={
                          stageInfo.totalCheckpointsInStage
                        }
                        compact={true}
                      />
                    </div>


                    <div className="hidden h-6 w-px shrink-0 bg-[#c8b47a]/15 sm:block" />

                    {/* XP / VS-boss bar — fills remaining space */}
                    <div className="min-w-0 flex-1">
                      <XPBar
                        currentXP={userProgress.xp}
                        maxXP={userProgress.xpToNextLevel}
                        compact={true}
                        bossHp={corruption.bossHp}
                        bossBaseHp={corruption.bossBaseHp}
                        bossName={corruption.bossName}
                      />
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
            className="absolute left-2 top-full mt-2 flex items-center gap-2 overflow-hidden rounded-lg border px-2.5 py-1.5 shadow-[0_4px_15px_rgba(0,0,0,0.3)] sm:left-3 sm:px-3"
            style={{
              borderColor: "rgba(196, 175, 120, 0.28)",
              background:
                "linear-gradient(180deg, rgba(72, 68, 44, 0.96), rgba(58, 54, 35, 0.96))",
              maxWidth: isMobile ? "60vw" : "280px",
            }}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span className="max-w-[170px] truncate text-xs font-medium text-[#f5ead0] sm:text-sm">
              {activeVenture.name}
            </span>
          </motion.div>
        )}

        {showMentorBadge && !isMobile && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute right-3 top-full mt-2 hidden items-center gap-2 rounded-lg border px-3 py-1.5 shadow-[0_4px_15px_rgba(99,102,241,0.2)] sm:flex"
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

      {/* Quest List removed per user request */}

      {/* Boss HP Bar - shows when corruption > 60% */}
      <BossHPBar />
    </>
  );
};

// Memoize HUD to prevent unnecessary re-renders
// Only re-render when Jotai atom values actually change
export const HUD = React.memo(HUDComponent);
