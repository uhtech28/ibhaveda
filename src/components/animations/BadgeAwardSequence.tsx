"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ArrowRight } from "lucide-react";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
}

interface BadgeAwardSequenceProps {
  isVisible: boolean;
  badge: Badge | null;
  onComplete?: () => void;
  onSkip?: () => void;
}

const RARITY_COLORS = {
  common: { bg: "bg-gray-500/20", border: "border-gray-500", text: "text-gray-400", glow: "shadow-gray-500/20" },
  uncommon: { bg: "bg-green-500/20", border: "border-green-500", text: "text-green-400", glow: "shadow-green-500/20" },
  rare: { bg: "bg-blue-500/20", border: "border-blue-500", text: "text-blue-400", glow: "shadow-blue-500/20" },
  epic: { bg: "bg-purple-500/20", border: "border-purple-500", text: "text-purple-400", glow: "shadow-purple-500/20" },
  legendary: { bg: "bg-amber-500/20", border: "border-amber-500", text: "text-amber-400", glow: "shadow-amber-500/20" },
};

export function BadgeAwardSequence({
  isVisible,
  badge,
  onComplete,
  onSkip,
}: BadgeAwardSequenceProps) {
  const [showFlash, setShowFlash] = useState(false);
  const [showBadge, setShowBadge] = useState(false);
  const [showReveal, setShowReveal] = useState(false);
  const [isLegendary, setIsLegendary] = useState(false);

  useEffect(() => {
    if (isVisible && badge) {
      setShowFlash(true);
      setShowBadge(false);
      setShowReveal(false);
      setIsLegendary(badge.rarity === "legendary");

      const flashTimer = setTimeout(() => setShowFlash(false), 100);
      const badgeTimer = setTimeout(() => setShowBadge(true), 200);
      const revealTimer = setTimeout(() => setShowReveal(true), 800);
      
      const autoDismissTimer = setTimeout(() => {
        if (badge.rarity !== "legendary") {
          handleDismiss();
        }
      }, 4000);

      return () => {
        clearTimeout(flashTimer);
        clearTimeout(badgeTimer);
        clearTimeout(revealTimer);
        clearTimeout(autoDismissTimer);
      };
    }
  }, [isVisible, badge]);

  const handleDismiss = () => {
    setShowBadge(false);
    setShowReveal(false);
    setTimeout(() => {
      onComplete?.();
    }, 200);
  };

  const handleSkip = () => {
    handleDismiss();
    onSkip?.();
  };

  if (!badge) return null;

  const rarityStyle = RARITY_COLORS[badge.rarity];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
        >
          <AnimatePresence mode="wait">
            {showFlash && (
              <motion.div
                key="flash"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white"
              />
            )}

            {showBadge && !showReveal && (
              <motion.div
                key="materialize"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="relative"
              >
                <motion.div
                  animate={{ 
                    boxShadow: isLegendary 
                      ? ["0 0 0 rgba(245,158,11,0)", "0 0 60px rgba(245,158,11,0.5)", "0 0 40px rgba(245,158,11,0.3)"]
                      : ["0 0 0 rgba(99,102,241,0)", "0 0 30px rgba(99,102,241,0.3)", "0 0 20px rgba(99,102,241,0.2)"]
                  }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className={`w-32 h-32 rounded-2xl ${rarityStyle.bg} ${rarityStyle.border} border-2 flex items-center justify-center`}
                >
                  <span className="text-5xl">{badge.icon}</span>
                </motion.div>
              </motion.div>
            )}

            {showReveal && (
              <motion.div
                key="reveal"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="text-center"
              >
                <motion.div
                  initial={{ y: -30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="mb-2"
                >
                  <span className={`text-sm font-semibold uppercase tracking-widest ${rarityStyle.text}`}>
                    Badge Earned!
                  </span>
                </motion.div>

                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                  className="relative mb-6"
                >
                  {isLegendary && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div className="w-40 h-40 rounded-full border-2 border-dashed border-amber-400/30" />
                    </motion.div>
                  )}
                  
                  <motion.div
                    animate={{ 
                      boxShadow: isLegendary 
                        ? "0 0 60px rgba(245,158,11,0.5)"
                        : "0 0 30px rgba(99,102,241,0.3)"
                    }}
                    className={`w-32 h-32 mx-auto rounded-2xl ${rarityStyle.bg} ${rarityStyle.border} border-2 flex items-center justify-center shadow-lg ${rarityStyle.glow}`}
                  >
                    <span className="text-5xl">{badge.icon}</span>
                  </motion.div>
                </motion.div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mb-2"
                >
                  <h3 className="text-2xl font-bold text-white">{badge.name}</h3>
                </motion.div>

                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-gray-400 text-sm mb-6 max-w-xs mx-auto"
                >
                  {badge.description}
                </motion.p>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center justify-center gap-2"
                >
                  {badge.rarity === "legendary" ? (
                    <button
                      onClick={handleDismiss}
                      className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 rounded-lg text-black font-semibold"
                    >
                      <Star className="w-4 h-4" />
                      Claim Reward
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleSkip}
                        className="px-4 py-2 bg-white/10 text-gray-400 rounded-lg hover:bg-white/20 transition-colors"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={handleDismiss}
                        className="flex items-center gap-2 px-4 py-2 bg-[#6366f1] text-white rounded-lg hover:bg-[#5558E3] transition-colors"
                      >
                        View Badge
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}