"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Zap, Crown, Sparkles } from "lucide-react";
import { TOOL_INFO, LEVEL_DEFINITIONS } from "../../../convex/ventureConstants";
import { audioManager } from "@/lib/audio/audioManager";

interface LevelUpSequenceProps {
  isVisible: boolean;
  oldLevel?: number;
  newLevel: number;
  phase?: number;
  isPhaseTransition?: boolean;
  unlockedTools?: string[];
  onComplete?: () => void;
  onSkip?: () => void;
}

const PHASE_NAMES = ["Apprentice", "Journeyer", "Master"];
const PHASE_ICONS = [Shield, Zap, Crown];

function getLevelTitle(level: number): string {
  const levelDef = LEVEL_DEFINITIONS.find((def) => def.level === level);
  return levelDef?.title ?? `Level ${level}`;
}

/**
 * Animated slot-machine style rolling counter from oldValue to newValue
 * Rolls through all intermediate numbers with bounce easing (500ms duration)
 */
function RollingCounter({ from, to }: { from: number; to: number }) {
  const [displayValue, setDisplayValue] = useState(from);

  useEffect(() => {
    // If from and to are the same, no animation needed
    if (from === to) {
      setDisplayValue(to);
      return;
    }

    // Calculate animation parameters
    const levelsToRoll = Math.abs(to - from);
    const totalDuration = 500; // 500ms as per PRD §7.2
    const timePerLevel = totalDuration / levelsToRoll;
    const direction = to > from ? 1 : -1;

    let currentLevel = from;

    // Roll through each intermediate number
    const interval = setInterval(() => {
      currentLevel += direction;

      if (
        (direction > 0 && currentLevel >= to) ||
        (direction < 0 && currentLevel <= to)
      ) {
        currentLevel = to;
        setDisplayValue(to);
        clearInterval(interval);
      } else {
        setDisplayValue(currentLevel);
      }
    }, timePerLevel);

    return () => clearInterval(interval);
  }, [from, to]);

  return (
    <motion.span
      key={displayValue}
      initial={{
        scale: 0.8,
        y: -20,
        opacity: 0,
      }}
      animate={{
        scale: 1,
        y: 0,
        opacity: 1,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 15,
        mass: 0.5,
        bounce: 0.5, // Bounce easing as per requirements
      }}
      className="tabular-nums font-black text-white inline-block"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {displayValue}
    </motion.span>
  );
}

export function LevelUpSequence({
  isVisible,
  oldLevel = 1,
  newLevel,
  phase = 1,
  isPhaseTransition = false,
  unlockedTools = [],
  onComplete,
  onSkip,
}: LevelUpSequenceProps) {
  const [step, setStep] = useState<
    "edge_burst" | "counter" | "title" | "cards" | "done"
  >("edge_burst");
  const [canSkip, setCanSkip] = useState(false);
  const timersRef = useRef<number[]>([]);
  const onCompleteRef = useRef(onComplete);
  const onSkipRef = useRef(onSkip);
  const lastAudioKeyRef = useRef<string | null>(null);

  const levelsGained = newLevel - oldLevel;
  const levelTitle = getLevelTitle(newLevel);
  const PhaseIcon = PHASE_ICONS[Math.min(phase - 1, 2)];
  const phaseName = PHASE_NAMES[Math.min(phase - 1, 2)];
  const unlockedToolsKey = unlockedTools.join("|");
  const sequenceKey = `${oldLevel}:${newLevel}:${phase}:${unlockedToolsKey}`;
  const hasToolUnlocks = unlockedTools.length > 0;

  useEffect(() => {
    onCompleteRef.current = onComplete;
    onSkipRef.current = onSkip;
  }, [onComplete, onSkip]);

  useEffect(() => {
    if (!isVisible) {
      lastAudioKeyRef.current = null;
      return;
    }

    if (lastAudioKeyRef.current !== sequenceKey) {
      audioManager.playLevelUp();
      lastAudioKeyRef.current = sequenceKey;
    }

    setStep("edge_burst");
    setCanSkip(false);

    // Clear any existing timers
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    const t1 = window.setTimeout(() => setStep("counter"), 300); // 0.3s: edge burst done
    const t2 = window.setTimeout(() => setCanSkip(true), 500); // 0.5s: can skip
    const t3 = window.setTimeout(() => setStep("title"), 800); // 0.8s: counter done

    // Show tool unlock cards if there are unlocked tools, otherwise skip to done
    const t4 = hasToolUnlocks
      ? window.setTimeout(() => setStep("cards"), 1200) // 1.2s: title done, show cards
      : null;

    const cardsDuration = hasToolUnlocks ? 800 : 0; // 800ms for card animations
    const t5 = window.setTimeout(
      () => {
        setStep("done");
        setTimeout(() => onCompleteRef.current?.(), 300);
      },
      hasToolUnlocks ? 2000 + cardsDuration : 2000,
    ); // Add cards duration if showing cards

    timersRef.current = t4 ? [t1, t2, t3, t4, t5] : [t1, t2, t3, t5];

    return () => timersRef.current.forEach(clearTimeout);
  }, [isVisible, sequenceKey, hasToolUnlocks]);

  const handleSkip = () => {
    if (!canSkip) return;
    timersRef.current.forEach(clearTimeout);
    setStep("done");
    setTimeout(() => onSkipRef.current?.(), 200);
  };

  return (
    <AnimatePresence>
      {isVisible && step !== "done" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleSkip}
          className="fixed inset-0 z-[100] flex items-center justify-center cursor-pointer"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          {/* ── Step 1: Full-viewport purple FLASH ── */}
          <AnimatePresence>
            {step === "edge_burst" && (
              <motion.div
                key="edge_burst"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, times: [0, 0.5, 1] }}
                className="fixed inset-0 bg-purple-500/40 pointer-events-none z-[101]"
              />
            )}
          </AnimatePresence>

          {/* Dark backdrop for content steps */}
          {(step === "counter" || step === "title" || step === "cards") && (
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
          )}

          {/* ── Step 2: Counter SPIN ── */}
          <AnimatePresence>
            {step === "counter" && (
              <motion.div
                key="counter"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.2, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="relative z-10 flex flex-col items-center gap-4"
              >
                <motion.p
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-indigo-300 text-sm font-semibold uppercase tracking-[0.3em]"
                >
                  {levelsGained > 1 ? `+${levelsGained} Levels!` : "Level Up!"}
                </motion.p>

                {/* Spinning number container */}
                <div className="relative w-36 h-36">
                  {/* Rotating glow rings */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute inset-0 rounded-full border-2 border-dashed border-indigo-500/40"
                  />
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute inset-2 rounded-full border border-purple-500/30"
                  />

                  {/* Level number box */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-[#1e1b4b] to-[#0f0a2e] border-2 border-indigo-500/50 shadow-[0_0_40px_rgba(99,102,241,0.4)] flex items-center justify-center">
                      {levelsGained > 1 && oldLevel ? (
                        <div className="flex items-center gap-2 px-2">
                          <span className="text-2xl font-bold text-gray-500">
                            {oldLevel}
                          </span>
                          <Sparkles className="w-4 h-4 text-indigo-400" />
                          <div className="text-3xl font-black text-white">
                            <RollingCounter from={oldLevel} to={newLevel} />
                          </div>
                        </div>
                      ) : (
                        <div className="text-6xl font-black text-white">
                          <RollingCounter from={oldLevel} to={newLevel} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {canSkip && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.4 }}
                    className="text-xs text-white/40 mt-2"
                  >
                    tap to skip
                  </motion.p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Step 3: Title REVEAL with gold glow ── */}
          <AnimatePresence>
            {step === "title" && (
              <motion.div
                key="title"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="relative z-10 flex flex-col items-center gap-3 text-center px-8"
              >
                {/* Level badge */}
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#1e1b4b] to-[#0f0a2e] border-2 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.3)] flex items-center justify-center mb-2">
                  <span className="text-4xl font-black text-white">
                    {newLevel}
                  </span>
                </div>

                {/* Level title with enhanced gold glow */}
                <motion.h2
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1, duration: 0.4, ease: "easeOut" }}
                  className="text-4xl md:text-5xl font-black tracking-tight"
                  style={{
                    background:
                      "linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    textShadow:
                      "0 0 30px rgba(251,191,36,0.8), 0 0 60px rgba(245,158,11,0.5), 0 0 90px rgba(217,119,6,0.3)",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    filter: "drop-shadow(0 4px 20px rgba(251,191,36,0.4))",
                  }}
                >
                  {levelTitle}
                </motion.h2>

                {/* Phase transition unlock */}
                {isPhaseTransition && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="flex items-center gap-2 mt-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30"
                  >
                    <PhaseIcon className="w-5 h-5 text-amber-400" />
                    <span className="text-amber-300 font-bold text-sm">
                      Phase Unlocked: {phaseName}
                    </span>
                  </motion.div>
                )}

                {canSkip && (
                  <p className="text-xs text-white/30 mt-4">
                    tap anywhere to skip
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Step 4: Tool UNLOCK CARDS ── */}
          <AnimatePresence>
            {step === "cards" && unlockedTools && unlockedTools.length > 0 && (
              <motion.div
                key="cards"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="relative z-10 flex flex-col items-center gap-4 text-center px-8"
              >
                <motion.p
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-emerald-400 text-sm font-semibold uppercase tracking-[0.3em]"
                >
                  🎉 New Tools Unlocked!
                </motion.p>

                {/* Tool unlock cards container with stagger */}
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.12,
                        delayChildren: 0.15,
                      },
                    },
                  }}
                  className="flex flex-col gap-3"
                >
                  {unlockedTools.map((toolType) => {
                    const toolInfo =
                      TOOL_INFO[toolType as keyof typeof TOOL_INFO];
                    if (!toolInfo) return null;

                    return (
                      <motion.div
                        key={toolType}
                        variants={{
                          hidden: {
                            opacity: 0,
                            y: 30,
                          },
                          visible: {
                            opacity: 1,
                            y: 0,
                            transition: {
                              duration: 0.8,
                              ease: "easeOut",
                            },
                          },
                        }}
                        className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border-2 border-emerald-500/40 backdrop-blur-sm shadow-[0_0_20px_rgba(16,185,129,0.2)] min-w-[280px]"
                      >
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/30 to-teal-500/30 border border-emerald-400/50 flex items-center justify-center text-2xl">
                          {toolInfo.icon}
                        </div>
                        <div className="text-left flex-1">
                          <p className="text-white font-bold text-base">
                            {toolInfo.name}
                          </p>
                          <p className="text-emerald-300 text-xs">
                            Now available for your ideas
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>

                {canSkip && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.3 }}
                    transition={{ delay: 0.5 }}
                    className="text-xs text-white/30 mt-4"
                  >
                    tap to continue
                  </motion.p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
