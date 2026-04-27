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
      <div className="flex items-center gap-1.5">
        <div className="relative h-5 w-5">
          <motion.div
            animate={isIncreasing ? { scale: [1, 1.2, 1], rotate: [0, 360] } : {}}
            transition={{ duration: 0.5 }}
            className="flex h-5 w-5 items-center justify-center rounded-full border border-amber-300/80 bg-gradient-to-br from-amber-400 to-amber-600"
          >
            <span className="text-[10px]">💰</span>
          </motion.div>
        </div>
        <motion.span
          key={gold}
          initial={{ scale: 1.2, color: "#818cf8" }} // Indigo 400
          animate={{ scale: 1, color: "#ffffff" }}
          transition={{ duration: 0.3 }}
          className="text-[13px] font-bold text-white font-sans tracking-wide"
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
      className="relative font-sans group"
    >
      {/* Main container with modern glassmorphism */}
      <div
        className="relative flex items-center gap-3 px-4 py-2 bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all group-hover:border-amber-500/30"
      >
        {/* Coin / Icon with dramatic glow */}
        <div className="relative">
          <motion.div
            animate={
              isIncreasing
                ? {
                  scale: [1, 1.25, 1],
                  rotate: [0, 15, -15, 0],
                }
                : {}
            }
            transition={{ duration: 0.6, ease: "backOut" }}
            className="relative w-10 h-10 flex items-center justify-center bg-zinc-950/60 rounded-xl border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
          >
            <Coins className="w-5 h-5 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
            
            {/* Shimmer overlay */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-500/10 to-transparent pointer-events-none" />
          </motion.div>

          {/* Sparkle effect when increasing */}
          <AnimatePresence>
            {isIncreasing && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1.5, opacity: 1 }}
                exit={{ scale: 2, opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0 pointer-events-none"
              >
                <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-amber-300" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Gold amount with high-fidelity typography */}
        <div className="flex flex-col pr-1">
          <span className="text-[9px] text-zinc-500 uppercase tracking-[0.25em] font-black leading-none mb-1">
            Gold Coins
          </span>
          <div className="flex items-baseline gap-1">
            <motion.span
              key={gold}
              initial={{ scale: 1.2, color: "#fbbf24" }}
              animate={{ scale: 1, color: "#ffffff" }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="text-[18px] font-black text-white leading-none tracking-tight tabular-nums"
            >
              {gold.toLocaleString()}
            </motion.span>
          </div>
        </div>
        
        {/* Subtle radial background glow for the whole card */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none rounded-2xl" />
      </div>

      {/* Floating gain indicator */}
      <AnimatePresence>
        {isIncreasing && gainAmount > 0 && (
          <motion.div
            initial={{ y: 10, opacity: 0, scale: 0.5 }}
            animate={{ y: -45, opacity: 1, scale: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="absolute top-0 right-0 pointer-events-none"
          >
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500 rounded-full shadow-[0_4px_15px_rgba(245,158,11,0.5)] border border-amber-400/50">
              <Sparkles className="w-3 h-3 text-white animate-pulse" />
              <span className="text-[11px] font-black text-white">
                +{gainAmount.toLocaleString()}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
