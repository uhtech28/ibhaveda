"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, X } from "lucide-react";

interface GoldCheckpointPopupProps {
  isVisible: boolean;
  ventureName: string;
  stageName: string;
  checkpoint: number;
  onDismiss: () => void;
}

export function GoldCheckpointPopup({
  isVisible,
  ventureName,
  stageName,
  checkpoint,
  onDismiss,
}: GoldCheckpointPopupProps) {
  // Auto-dismiss after 4 seconds
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onDismiss]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] pointer-events-auto"
        >
          <div className="relative bg-gradient-to-br from-amber-950/95 via-yellow-950/95 to-amber-900/95 backdrop-blur-xl rounded-2xl border-2 border-amber-500/50 shadow-2xl shadow-amber-500/20 overflow-hidden">
            {/* Animated background glow */}
            <motion.div
              animate={{
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 bg-gradient-radial from-amber-400/20 to-transparent"
            />

            {/* Sparkle effects */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                    x: [0, Math.random() * 100 - 50],
                    y: [0, Math.random() * 100 - 50],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.3,
                    ease: "easeOut",
                  }}
                  className="absolute top-1/2 left-1/2"
                  style={{
                    width: 4,
                    height: 4,
                    background: "#fbbf24",
                    borderRadius: "50%",
                    boxShadow: "0 0 10px #fbbf24",
                  }}
                />
              ))}
            </div>

            {/* Content */}
            <div className="relative px-6 py-4 flex items-start gap-4">
              {/* Trophy icon */}
              <motion.div
                animate={{
                  rotate: [0, -10, 10, -10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  repeatDelay: 2,
                }}
                className="flex-shrink-0 mt-1"
              >
                <div className="relative">
                  <Trophy className="w-8 h-8 text-amber-400" />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="absolute inset-0 bg-amber-400/20 rounded-full blur-md"
                  />
                </div>
              </motion.div>

              {/* Text content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  </motion.div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-amber-400">
                    Gold Checkpoint!
                  </h3>
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: 0.75,
                    }}
                  >
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  </motion.div>
                </div>

                <p className="text-base font-bold text-amber-100 mb-1">
                  {ventureName}
                </p>
                <p className="text-sm text-amber-200/80">
                  {stageName} • Checkpoint {checkpoint}
                </p>
              </div>

              {/* Close button */}
              <button
                onClick={onDismiss}
                className="flex-shrink-0 p-1 rounded-lg hover:bg-amber-500/20 transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="w-5 h-5 text-amber-300" />
              </button>
            </div>

            {/* Progress bar for auto-dismiss */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 4, ease: "linear" }}
              className="h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 origin-left"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
