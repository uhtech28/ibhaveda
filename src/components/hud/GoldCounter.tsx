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
          initial={{ scale: 1.2, color: "#818cf8" }} // Indigo 400
          animate={{ scale: 1, color: "#ffffff" }}
          transition={{ duration: 0.3 }}
          className="text-sm font-bold text-white font-sans tracking-wide"
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
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="relative font-sans"
    >
      {/* Main container with modern glassmorphism */}
      <div
        className="relative flex items-center gap-3 px-4 py-2.5 bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-full"
        style={{
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.05)",
        }}
      >
        {/* Coin sprite - modern styling */}
        <div className="relative">
          <motion.div
            animate={
              isIncreasing
                ? {
                  scale: [1, 1.2, 1],
                  rotate: [0, 360],
                }
                : {}
            }
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative w-8 h-8"
          >
            {/* Outer coin border - Indigo gradient */}
            <div
              className="absolute inset-0 bg-gradient-to-br from-indigo-400 via-indigo-500 to-indigo-600 rounded-full border-[1.5px] border-indigo-300/50 shadow-lg shadow-indigo-500/20"
            />
            {/* Inner coin detail */}
            <div className="absolute inset-[3px] bg-gradient-to-br from-[#0f1420] to-[#0a0d14] rounded-full flex items-center justify-center border border-indigo-500/30">
              <span className="text-sm font-black text-indigo-400">V</span>
            </div>
            {/* Shine effect */}
            <div className="absolute top-1 left-1.5 w-2 h-2.5 bg-white/40 rounded-full blur-[2px] rotate-45" />
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
        <div className="flex flex-col pr-2">
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
            Points
          </span>
          <motion.div
            key={gold}
            initial={{ scale: 1.1, y: -2 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className="text-[17px] font-black text-white leading-none tracking-wide"
            style={{
              textShadow: "0 2px 10px rgba(99, 102, 241, 0.3)",
            }}
          >
            {gold.toLocaleString()}
          </motion.div>
        </div>
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
              className="px-3 py-1 bg-indigo-500/90 border border-indigo-400/50 backdrop-blur-md rounded-full whitespace-nowrap shadow-[0_4px_15px_rgba(99,102,241,0.5)]"
            >
              <span className="text-xs font-black text-white tracking-wide">
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
            className="absolute inset-0 bg-indigo-500/10 rounded-full pointer-events-none"
            style={{
              boxShadow: "0 0 30px rgba(99, 102, 241, 0.4)",
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
