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

    // Slower, more deliberate timing for humanistic feel
    const t1 = window.setTimeout(() => setStep("counter"), 800); // 0.8s: gentle fade in
    const t2 = window.setTimeout(() => setCanSkip(true), 1500); // 1.5s: can skip after appreciating
    const t3 = window.setTimeout(() => setStep("title"), 2500); // 2.5s: let counter breathe

    // Show tool unlock cards if there are unlocked tools, otherwise skip to done
    const t4 = hasToolUnlocks
      ? window.setTimeout(() => setStep("cards"), 4000) // 4s: smooth transition to cards
      : null;

    const cardsDuration = hasToolUnlocks ? 1500 : 0; // 1.5s for card animations to unfold
    const t5 = window.setTimeout(
      () => {
        setStep("done");
        setTimeout(() => onCompleteRef.current?.(), 500);
      },
      hasToolUnlocks ? 5500 + cardsDuration : 4500,
    ); // Let the moment sink in

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
          {/* ── Step 1: Gentle awakening - Soft fade instead of flash ── */}
          <AnimatePresence>
            {step === "edge_burst" && (
              <motion.div
                key="edge_burst"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.15, 0] }}
                exit={{ opacity: 0 }}
                transition={{ 
                  duration: 0.8, 
                  times: [0, 0.5, 1],
                  ease: [0.43, 0.13, 0.23, 0.96] // Smooth exponential
                }}
                className="fixed inset-0 bg-gradient-radial from-purple-500/20 via-indigo-500/10 to-transparent pointer-events-none z-[101]"
              />
            )}
          </AnimatePresence>

          {/* Softer, more atmospheric backdrop */}
          {(step === "counter" || step === "title" || step === "cards") && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-black/80 backdrop-blur-md" 
            />
          )}

          {/* ── Step 2: Counter - Slow, mesmerizing reveal ── */}
          <AnimatePresence>
            {step === "counter" && (
              <motion.div
                key="counter"
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: -10 }}
                transition={{ 
                  duration: 0.8,
                  ease: [0.16, 1, 0.3, 1] // Smooth ease-out
                }}
                className="relative z-10 flex flex-col items-center gap-6"
              >
                {/* Floating particles effect */}
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 bg-indigo-400/40 rounded-full"
                      style={{
                        left: `${20 + i * 10}%`,
                        top: `${30 + (i % 3) * 20}%`,
                      }}
                      animate={{
                        y: [-20, -60, -20],
                        opacity: [0, 0.6, 0],
                        scale: [0, 1, 0],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: i * 0.3,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
                </div>

                <motion.p
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="text-indigo-300/80 text-sm sm:text-base font-medium tracking-[0.2em] uppercase"
                >
                  {levelsGained > 1 ? `+${levelsGained} Levels` : "Level Up"}
                </motion.p>

                {/* Breathing, organic number container */}
                <div className="relative w-40 h-40 sm:w-48 sm:h-48">
                  {/* Slow rotating aura rings */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 20,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: "radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)",
                    }}
                  />
                  <motion.div
                    animate={{ 
                      rotate: -360,
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      rotate: { duration: 25, repeat: Infinity, ease: "linear" },
                      scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                    }}
                    className="absolute inset-2 rounded-full border border-indigo-500/20"
                  />
                  <motion.div
                    animate={{ 
                      rotate: 360,
                      scale: [1, 1.08, 1],
                    }}
                    transition={{
                      rotate: { duration: 30, repeat: Infinity, ease: "linear" },
                      scale: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
                    }}
                    className="absolute inset-4 rounded-full border border-purple-500/15"
                  />

                  {/* Glowing center with breathing effect */}
                  <motion.div
                    animate={{
                      boxShadow: [
                        "0 0 30px rgba(99, 102, 241, 0.3)",
                        "0 0 50px rgba(99, 102, 241, 0.5)",
                        "0 0 30px rgba(99, 102, 241, 0.3)",
                      ],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-3xl bg-gradient-to-br from-[#1e1b4b]/90 via-[#1e1b4b]/80 to-[#0f0a2e]/90 border border-indigo-500/30 backdrop-blur-sm flex items-center justify-center relative overflow-hidden">
                      {/* Subtle shimmer effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                        animate={{
                          x: ["-100%", "100%"],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                      
                      {levelsGained > 1 && oldLevel ? (
                        <div className="flex items-center gap-2 px-2 relative z-10">
                          <span className="text-xl sm:text-2xl font-bold text-gray-500/60">
                            {oldLevel}
                          </span>
                          <motion.div
                            animate={{ 
                              rotate: [0, 360],
                              scale: [1, 1.2, 1],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                          >
                            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400/70" />
                          </motion.div>
                          <div className="text-3xl sm:text-4xl font-black text-white">
                            <RollingCounter from={oldLevel} to={newLevel} />
                          </div>
                        </div>
                      ) : (
                        <div className="text-5xl sm:text-6xl font-black text-white relative z-10">
                          <RollingCounter from={oldLevel} to={newLevel} />
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>

                {canSkip && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.3, 0.3] }}
                    transition={{ duration: 1.5, times: [0, 0.5, 1] }}
                    className="text-xs sm:text-sm text-white/30 mt-2 font-light"
                  >
                    tap to skip
                  </motion.p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Step 3: Title - Elegant, story-like reveal ── */}
          <AnimatePresence>
            {step === "title" && (
              <motion.div
                key="title"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ 
                  duration: 1,
                  ease: [0.16, 1, 0.3, 1]
                }}
                className="relative z-10 flex flex-col items-center gap-4 text-center px-6 sm:px-8"
              >
                {/* Ambient light particles */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1.5 h-1.5 bg-amber-400/30 rounded-full blur-sm"
                      style={{
                        left: `${10 + i * 7}%`,
                        top: `${20 + (i % 4) * 20}%`,
                      }}
                      animate={{
                        y: [-30, -80, -30],
                        opacity: [0, 0.8, 0],
                        scale: [0.5, 1.5, 0.5],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        delay: i * 0.4,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
                </div>

                {/* Level badge with gentle pulse */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ 
                    scale: 1, 
                    rotate: 0,
                  }}
                  transition={{
                    duration: 0.8,
                    ease: [0.34, 1.56, 0.64, 1],
                  }}
                  className="relative"
                >
                  <motion.div
                    animate={{
                      boxShadow: [
                        "0 0 20px rgba(245, 158, 11, 0.2)",
                        "0 0 40px rgba(245, 158, 11, 0.4)",
                        "0 0 20px rgba(245, 158, 11, 0.2)",
                      ],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-[#1e1b4b]/80 via-[#1e1b4b]/70 to-[#0f0a2e]/80 border border-amber-500/40 backdrop-blur-sm flex items-center justify-center mb-3 relative overflow-hidden"
                  >
                    {/* Shimmer overlay */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/10 to-transparent"
                      animate={{
                        x: ["-100%", "100%"],
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        repeatDelay: 1,
                      }}
                    />
                    <span className="text-4xl sm:text-5xl font-black text-white relative z-10">
                      {newLevel}
                    </span>
                  </motion.div>
                </motion.div>

                {/* Title with cinematic reveal */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 1 }}
                  className="relative"
                >
                  <motion.h2
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ 
                      delay: 0.4, 
                      duration: 0.8, 
                      ease: [0.16, 1, 0.3, 1]
                    }}
                    className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight"
                    style={{
                      background:
                        "linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      filter: "drop-shadow(0 4px 20px rgba(251,191,36,0.3))",
                    }}
                  >
                    {levelTitle}
                  </motion.h2>
                  
                  {/* Subtle underline accent */}
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
                    className="h-0.5 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent mt-3 mx-auto"
                    style={{ width: "60%" }}
                  />
                </motion.div>

                {/* Phase transition with elegant entrance */}
                {isPhaseTransition && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ 
                      delay: 1,
                      duration: 0.8,
                      ease: [0.34, 1.56, 0.64, 1]
                    }}
                    className="flex items-center gap-3 mt-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 border border-amber-500/20 backdrop-blur-sm"
                  >
                    <motion.div
                      animate={{
                        rotate: [0, 360],
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <PhaseIcon className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
                    </motion.div>
                    <div className="text-left">
                      <p className="text-amber-300/60 text-[10px] sm:text-xs font-medium uppercase tracking-wider">
                        Phase Unlocked
                      </p>
                      <p className="text-amber-300 font-bold text-sm sm:text-base">
                        {phaseName}
                      </p>
                    </div>
                  </motion.div>
                )}

                {canSkip && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.3, 0.3] }}
                    transition={{ 
                      duration: 2,
                      times: [0, 0.5, 1],
                      delay: 1.2
                    }}
                    className="text-xs sm:text-sm text-white/30 mt-4 font-light"
                  >
                    tap anywhere to continue
                  </motion.p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Step 4: Tool UNLOCK - Slow, story-driven reveal ── */}
          <AnimatePresence>
            {step === "cards" && unlockedTools && unlockedTools.length > 0 && (
              <motion.div
                key="cards"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.8 }}
                className="relative z-10 flex flex-col items-center gap-8 text-center px-4 sm:px-8 max-w-2xl"
              >
                {/* Atmospheric particles */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {[...Array(15)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 bg-emerald-400/20 rounded-full blur-[1px]"
                      style={{
                        left: `${5 + i * 6}%`,
                        top: `${15 + (i % 5) * 15}%`,
                      }}
                      animate={{
                        y: [-40, -100, -40],
                        opacity: [0, 0.6, 0],
                        scale: [0.5, 1.2, 0.5],
                      }}
                      transition={{
                        duration: 5,
                        repeat: Infinity,
                        delay: i * 0.5,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
                </div>

                {/* Gentle, welcoming header */}
                <motion.div
                  initial={{ opacity: 0, y: -30 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                  }}
                  transition={{ 
                    duration: 1,
                    ease: [0.16, 1, 0.3, 1]
                  }}
                  className="flex flex-col items-center gap-3"
                >
                  {/* Breathing sparkle */}
                  <motion.div
                    animate={{ 
                      scale: [1, 1.15, 1],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="text-4xl sm:text-5xl mb-2"
                  >
                    ✨
                  </motion.div>
                  
                  <motion.h3 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="text-white/90 text-xl sm:text-2xl font-semibold tracking-tight"
                  >
                    Your toolkit just expanded
                  </motion.h3>
                  
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="text-white/50 text-sm sm:text-base font-normal max-w-md leading-relaxed"
                  >
                    New capabilities are now at your fingertips
                  </motion.p>
                </motion.div>

                {/* Tool cards - slow, elegant unfold */}
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.35,
                        delayChildren: 0.8,
                      },
                    },
                  }}
                  className="flex flex-col gap-4 w-full"
                >
                  {unlockedTools.map((toolType, index) => {
                    const toolInfo =
                      TOOL_INFO[toolType as keyof typeof TOOL_INFO];
                    if (!toolInfo) return null;

                    return (
                      <motion.div
                        key={toolType}
                        variants={{
                          hidden: {
                            opacity: 0,
                            x: -40,
                            scale: 0.9,
                          },
                          visible: {
                            opacity: 1,
                            x: 0,
                            scale: 1,
                            transition: {
                              duration: 1,
                              ease: [0.16, 1, 0.3, 1],
                            },
                          },
                        }}
                        whileHover={{
                          scale: 1.02,
                          x: 6,
                          transition: { duration: 0.3, ease: "easeOut" }
                        }}
                        className="group relative flex items-center gap-4 sm:gap-5 px-5 sm:px-6 py-5 sm:py-6 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-white/[0.02] border border-white/10 backdrop-blur-xl shadow-2xl hover:shadow-3xl transition-all duration-500 min-w-[280px] sm:min-w-[340px] cursor-default overflow-hidden"
                      >
                        {/* Ambient glow overlay */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/[0.07] to-teal-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                          initial={false}
                        />
                        
                        {/* Slow breathing border glow */}
                        <motion.div
                          className="absolute inset-0 rounded-2xl sm:rounded-3xl pointer-events-none"
                          animate={{ 
                            opacity: [0, 0.4, 0],
                            scale: [0.98, 1.01, 0.98]
                          }}
                          transition={{
                            duration: 5,
                            repeat: Infinity,
                            delay: index * 0.8,
                            ease: "easeInOut"
                          }}
                          style={{
                            boxShadow: "0 0 30px rgba(16, 185, 129, 0.3), inset 0 0 30px rgba(16, 185, 129, 0.1)"
                          }}
                        />

                        {/* Icon with organic pulse */}
                        <motion.div
                          animate={{ 
                            scale: [1, 1.1, 1],
                          }}
                          transition={{
                            duration: 4,
                            repeat: Infinity,
                            delay: index * 0.5,
                            ease: "easeInOut"
                          }}
                          className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-teal-500/20 border border-emerald-400/30 flex items-center justify-center text-3xl sm:text-4xl shadow-lg backdrop-blur-sm"
                        >
                          {toolInfo.icon}
                          
                          {/* Gentle sparkle */}
                          <motion.div
                            className="absolute -top-1.5 -right-1.5 w-3 h-3 sm:w-4 sm:h-4 bg-emerald-400 rounded-full blur-[1px]"
                            animate={{
                              scale: [0, 1.2, 0],
                              opacity: [0, 0.8, 0],
                            }}
                            transition={{
                              duration: 3,
                              repeat: Infinity,
                              delay: index * 0.6,
                              ease: "easeInOut",
                            }}
                          />
                        </motion.div>

                        {/* Text with graceful entrance */}
                        <motion.div
                          initial={{ opacity: 0, x: -15 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ 
                            delay: 0.3 + index * 0.35, 
                            duration: 0.8,
                            ease: [0.16, 1, 0.3, 1]
                          }}
                          className="relative z-10 text-left flex-1"
                        >
                          <p className="text-white font-semibold text-base sm:text-lg mb-1 leading-tight">
                            {toolInfo.name}
                          </p>
                          <p className="text-white/60 text-xs sm:text-sm font-normal leading-relaxed">
                            Ready to help you build better
                          </p>
                        </motion.div>

                        {/* Floating arrow */}
                        <motion.div
                          className="relative z-10 text-emerald-400/30 group-hover:text-emerald-400/60 transition-colors duration-500"
                          animate={{
                            x: [0, 6, 0],
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: index * 0.3,
                          }}
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 4l7 8-7 8" />
                          </svg>
                        </motion.div>
                      </motion.div>
                    );
                  })}
                </motion.div>

                {/* Soft, inviting call to action */}
                {canSkip && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.35, 0.35] }}
                    transition={{ 
                      duration: 2,
                      times: [0, 0.6, 1],
                      delay: 1.5
                    }}
                    className="text-xs sm:text-sm text-white/35 mt-2 font-light tracking-wide"
                  >
                    Tap anywhere to continue your journey
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
