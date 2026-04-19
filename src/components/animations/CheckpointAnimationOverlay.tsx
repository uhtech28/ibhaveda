"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckpointState } from "@/lib/phaser/utils/event-bridge";
import { getAnimationTypeForStage } from "@/lib/phaser/scenes/animations";

interface CheckpointAnimationOverlayProps {
  isVisible: boolean;
  checkpoint: CheckpointState | null;
  onComplete?: () => void;
  onSkip?: () => void;
}

export function CheckpointAnimationOverlay({
  isVisible,
  checkpoint,
  onComplete,
  onSkip,
}: CheckpointAnimationOverlayProps) {
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (isVisible && checkpoint) {
      setShowAnimation(true);

      const timer = setTimeout(() => {
        setShowAnimation(false);
        setTimeout(() => {
          onComplete?.();
        }, 300);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, checkpoint, onComplete]);

  const handleSkip = () => {
    setShowAnimation(false);
    setTimeout(() => {
      onSkip?.();
    }, 200);
  };

  const animationType = checkpoint ? getAnimationTypeForStage(checkpoint.stage) : "seal_break";
  const isGold = checkpoint?.status === "gold";

  return (
    <AnimatePresence>
      {isVisible && showAnimation && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-[400px] h-[400px] flex items-center justify-center"
              >
                <motion.div
                  animate={{ 
                    rotate: 360,
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ 
                    rotate: { repeat: Infinity, duration: 8, ease: "linear" },
                    scale: { repeat: Infinity, duration: 2 }
                  }}
                  className={`w-24 h-24 rounded-full border-4 ${isGold ? 'border-[#f59e0b]' : 'border-[#6366f1]'} ${isGold ? 'bg-[#f59e0b]/20' : 'bg-[#6366f1]/20'}`}
                />
              </div>
            </div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="absolute bottom-[-80px] left-0 right-0 text-center"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#1e293b] rounded-lg border border-white/10">
                <span className="text-gray-400">Playing:</span>
                <span className="text-white font-medium capitalize">
                  {animationType.replace("_", " ")}
                </span>
                {isGold && (
                  <span className="px-2 py-0.5 bg-[#f59e0b]/20 text-[#f59e0b] text-xs rounded-full">
                    GOLD
                  </span>
                )}
              </div>
            </motion.div>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              onClick={handleSkip}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 text-gray-400 hover:text-white hover:bg-white/20 transition-colors flex items-center justify-center"
            >
              ✕
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}