"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { Sparkles, Zap, Shield, Crown } from "lucide-react";

interface LevelUpSequenceProps {
  isVisible: boolean;
  oldLevel?: number;
  newLevel: number;
  phase?: number;
  isPhaseTransition?: boolean;
  onComplete?: () => void;
  onSkip?: () => void;
}

const PHASE_NAMES = ["Apprentice", "Journeyer", "Master"];
const PHASE_ICONS = [Shield, Zap, Crown];

export function LevelUpSequence({
  isVisible,
  oldLevel,
  newLevel,
  phase = 1,
  isPhaseTransition = false,
  onComplete,
  onSkip,
}: LevelUpSequenceProps) {
  const [showContent, setShowContent] = useState(false);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShowContent(false);
      setCanSkip(false);

      const contentTimer = setTimeout(() => setShowContent(true), 300);
      const skipTimer = setTimeout(() => setCanSkip(true), 500);

      const completeTimer = setTimeout(() => {
        setShowContent(false);
        setTimeout(() => {
          onComplete?.();
        }, 300);
      }, 2000);

      return () => {
        clearTimeout(contentTimer);
        clearTimeout(skipTimer);
        clearTimeout(completeTimer);
      };
    }
  }, [isVisible, onComplete]);

  const handleSkip = () => {
    if (canSkip) {
      setShowContent(false);
      setTimeout(() => {
        onSkip?.();
      }, 200);
    }
  };

  const PhaseIcon = PHASE_ICONS[Math.min(phase - 1, 2)];
  const phaseName = PHASE_NAMES[Math.min(phase - 1, 2)];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative"
          >
            <AnimatePresence mode="wait">
              {!showContent ? (
                <motion.div
                  key="burst"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="w-40 h-40 rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center"
                >
                  <Sparkles className="w-16 h-16 text-white" />
                </motion.div>
              ) : (
                <motion.div
                  key="content"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  className="text-center"
                >
                  <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="mb-4"
                  >
                    <span className="text-[#6366f1] text-lg font-semibold uppercase tracking-widest">
                      Level Up!
                    </span>
                  </motion.div>

                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="relative w-32 h-32 mx-auto mb-6"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] rounded-2xl rotate-6" />
                    <div className="absolute inset-0 bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] rounded-2xl -rotate-3" />
                    <div className="absolute inset-0 bg-[#1e1b4b] rounded-2xl flex items-center justify-center">
                      <span className="text-5xl font-bold text-white">
                        {newLevel}
                      </span>
                    </div>
                  </motion.div>

                  {isPhaseTransition && (
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="mb-6"
                    >
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <PhaseIcon className="w-6 h-6 text-amber-400" />
                        <span className="text-2xl font-bold text-white">
                          {phaseName}
                        </span>
                      </div>
                      <span className="text-gray-400">
                        Phase {phase} Unlocked!
                      </span>
                    </motion.div>
                  )}

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center justify-center gap-4"
                  >
                    <button
                      onClick={handleSkip}
                      disabled={!canSkip}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        canSkip
                          ? "bg-white/10 text-white hover:bg-white/20"
                          : "text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      {canSkip ? "Skip" : "..."}
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
