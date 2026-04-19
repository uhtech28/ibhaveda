"use client";

import { useAtom } from "jotai";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Sparkles } from "lucide-react";
import { atom } from "jotai";
import { useState, useEffect } from "react";

// Atom for gold count
export const goldCountAtom = atom<number>(0);

interface GoldCounterProps {
  compact?: boolean;
}

export function GoldCounter({ compact = false }: GoldCounterProps) {
  const [gold] = useAtom(goldCountAtom);
  const [previousGold, setPreviousGold] = useState(gold);
  const [isIncreasing, setIsIncreasing] = useState(false);
  const [gainAmount, setGainAmount] = useState(0);

  useEffect(() => {
    if (gold > previousGold) {
      setIsIncreasing(true);
      setGainAmount(gold - previousGold);

      const timer = setTimeout(() => {
        setIsIncreasing(false);
        setGainAmount(0);
      }, 1500);

      setPreviousGold(gold);
      return () => clearTimeout(timer);
    } else if (gold !== previousGold) {
      setPreviousGold(gold);
    }
  }, [gold, previousGold]);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="relative w-6 h-6">
          <motion.div
            animate={isIncreasing ? { scale: [1, 1.2, 1], rotate: [0, 360] } : {}}
            transition={{ duration: 0.5 }}
            className="w-6 h-6 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full border-2 border-amber-300 flex items-center justify-center"
          >
            <span className="text-xs">💰</span>
          </motion.div>
        </div>
        <motion.span
          key={gold}
          initial={{ scale: 1.2, color: "#fbbf24" }}
          animate={{ scale: 1, color: "#ffffff" }}
          transition={{ duration: 0.3 }}
          className="text-sm font-bold text-white font-mono"
        >
          {gold.toLocaleString()}
        </motion.span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="relative"
    >
      {/* Main container with pixel-art border */}
      <div
        className="relative flex items-center gap-3 px-3 py-2 bg-[#0f1419] border-2 border-amber-500/40 rounded-none"
        style={{
          boxShadow: "3px 3px 0px rgba(0, 0, 0, 0.8), inset 1px 1px 0px rgba(255, 255, 255, 0.1)",
        }}
      >
        {/* Coin sprite with pixel-art style */}
        <div className="relative">
          <motion.div
            animate={
              isIncreasing
                ? {
                  scale: [1, 1.3, 1],
                  rotate: [0, 360],
                }
                : {}
            }
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative w-8 h-8"
          >
            {/* Outer coin border */}
            <div
              className="absolute inset-0 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 rounded-full border-2 border-amber-300"
              style={{
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.5), inset 0 -2px 2px rgba(0, 0, 0, 0.3)",
              }}
            />
            {/* Inner coin detail */}
            <div className="absolute inset-1 bg-gradient-to-br from-amber-300 to-amber-500 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-amber-900">G</span>
            </div>
            {/* Shine effect */}
            <div className="absolute top-1 left-1 w-2 h-2 bg-white/60 rounded-full blur-[1px]" />
          </motion.div>

          {/* Sparkle effect when increasing */}
          <AnimatePresence>
            {isIncreasing && (
              <>
                <motion.div
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 border-2 border-amber-400 rounded-full"
                />
                <Sparkles
                  className="absolute -top-1 -right-1 w-3 h-3 text-amber-400"
                  style={{
                    filter: "drop-shadow(0 0 2px rgba(251, 191, 36, 0.8))",
                  }}
                />
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Gold amount with animated counter */}
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
            Gold
          </span>
          <motion.div
            key={gold}
            initial={{ scale: 1.2, y: -5 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className="text-lg font-bold text-amber-400 font-mono leading-none"
            style={{
              textShadow: "0 2px 4px rgba(0, 0, 0, 0.8), 0 0 8px rgba(251, 191, 36, 0.3)",
            }}
          >
            {gold.toLocaleString()}
          </motion.div>
        </div>

        {/* Pixel-art corner decorations */}
        <div className="absolute -top-1 -left-1 w-2 h-2 bg-amber-400 border border-amber-300" />
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 border border-amber-300" />
        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-amber-400 border border-amber-300" />
        <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-amber-400 border border-amber-300" />
      </div>

      {/* Floating gain indicator */}
      <AnimatePresence>
        {isIncreasing && gainAmount > 0 && (
          <motion.div
            initial={{ y: 0, opacity: 1, scale: 0.8 }}
            animate={{ y: -30, opacity: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute -top-8 left-1/2 -translate-x-1/2 pointer-events-none"
          >
            <div
              className="px-2 py-1 bg-amber-500 border-2 border-amber-300 rounded-none whitespace-nowrap"
              style={{
                boxShadow: "2px 2px 0px rgba(0, 0, 0, 0.8)",
              }}
            >
              <span className="text-xs font-bold text-white">
                +{gainAmount.toLocaleString()}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Glow effect when active */}
      <AnimatePresence>
        {isIncreasing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, repeat: 2 }}
            className="absolute inset-0 bg-amber-400/20 rounded-none pointer-events-none"
            style={{
              boxShadow: "0 0 20px rgba(251, 191, 36, 0.6)",
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
