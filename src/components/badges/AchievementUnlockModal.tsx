"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  audioManager,
  type BadgeRarity as AudioBadgeRarity,
} from "@/lib/audio/audioManager";
import { cn } from "@/lib/utils";
import { BadgeCard, getNormalizedRarity, BadgeItem } from "./BadgeCard";
import { Sparkles, Trophy, Plus, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AchievementUnlockModalProps {
  badge: BadgeItem | null;
  reason?: string;
  scoreEarned?: number;
  isOpen: boolean;
  onClose: () => void;
  onViewBadge?: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  rotate: number;
  color: string;
  shape: "circle" | "rect" | "sparkle";
}

const getMascotSpeech = (rarity: string, name: string): string => {
  const r = rarity.toLowerCase();

  // Custom speech if it's a checkpoint clearance
  if (
    name.includes("Clear") ||
    name.includes("Stage") ||
    name.includes("Checkpoint") ||
    name.includes("—")
  ) {
    const stageSpeeches = [
      "Incredible checkpoint clear! You're writing startup history! 🚀",
      "Boom! Another milestone crushed. The momentum is real! 🔥",
      "Fabulous progress! Keep this pace up and you'll conquer the map! 🗺️",
      "Stellar work! That is what I call clean, visionary execution! ✨",
    ];
    return stageSpeeches[Math.floor(Math.random() * stageSpeeches.length)];
  }

  const speeches = {
    legendary: [
      "Whoa! Legendary execution! You've set the absolute gold standard here. 🌟",
      "Phenomenal! That was pure start-up magic. Keep soaring! 🚀",
      "Outstanding! You're making this look easy. Absolute legend! 👑",
    ],
    rare: [
      "Sweet! A solid silver finish. You're building massive momentum! 💫",
      "Awesome job! That's high-quality output right there. 🥈",
      "Brilliant! Milestone cleared with style. Keep up the hustle! ⚡",
    ],
    uncommon: [
      "Woohoo! You made it through! Every milestone is a step forward. 🌱",
      "Nice one! Got the bronze. Ready for the next challenge? 💪",
      "Boom! Task complete. Let's keep this fire burning! 🔥",
    ],
    default: [
      "Incredible milestone unlocked! Project score boosted! 🚀",
      "Hooray! Another notch on your journey. You got this! 🌟",
      "Awesome achievement! The community is cheering you on! 👥",
    ],
  };

  const pool =
    r.includes("legendary") || r.includes("gold")
      ? speeches.legendary
      : r.includes("rare") || r.includes("silver")
        ? speeches.rare
        : r.includes("uncommon") || r.includes("bronze")
          ? speeches.uncommon
          : speeches.default;

  return pool[Math.floor(Math.random() * pool.length)];
};

export const AchievementUnlockModal: React.FC<AchievementUnlockModalProps> = ({
  badge,
  reason,
  scoreEarned = 20,
  isOpen,
  onClose,
  onViewBadge,
}) => {
  const [activeStep, setActiveStep] = useState<
    "backdrop" | "silhouette" | "burst" | "show"
  >("backdrop");
  const [scoreDisplay, setScoreDisplay] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (isOpen && badge) {
      setActiveStep("backdrop");
      setScoreDisplay(0);

      // 1. Enter Silhouette: t=100ms (almost instant feedback)
      const silTimer = setTimeout(() => {
        setActiveStep("silhouette");
      }, 100);

      // 2. Trigger Burst: t=450ms (snappy dramatic unlock)
      const burstTimer = setTimeout(() => {
        setActiveStep("burst");

        // Play SFX matching rarity
        const sfxRarity: AudioBadgeRarity =
          badge.rarity === "common" || badge.rarity === "bronze"
            ? "common"
            : badge.rarity === "uncommon" || badge.rarity === "silver"
              ? "uncommon"
              : badge.rarity === "rare" || badge.rarity === "gold"
                ? "rare"
                : badge.rarity === "epic" || badge.rarity === "diamond"
                  ? "epic"
                  : "legendary";

        try {
          audioManager.playBadgeSFX(sfxRarity);
        } catch (e) {
          console.warn("Audio play failed:", e);
        }

        // Generate customized particles based on rarity
        const norm = getNormalizedRarity(badge.rarity);
        const particleColors =
          norm.key === "gold"
            ? ["#FBBF24", "#F59E0B", "#FFFDF5", "#92400E"]
            : norm.key === "silver"
              ? ["#CBD5E1", "#94A3B8", "#FFFFFF", "#475569"]
              : norm.key === "bronze"
                ? ["#D97706", "#B45309", "#FFF7ED", "#78350F"]
                : norm.key === "diamond"
                  ? ["#22D3EE", "#06B6D4", "#E0F7FA", "#0891B2"]
                  : norm.key === "legendary"
                    ? ["#A855F7", "#D946EF", "#F3E8FF", "#7E22CE", "#FBBF24"]
                    : ["#F43F5E", "#EC4899", "#818CF8", "#FFFFFF", "#FBBF24"]; // Mythic / default cosmic colors

        // Generate 36 clean confetti particles for excellent visual weight without lagging
        const generated: Particle[] = Array.from({ length: 36 }).map((_, i) => {
          const angle = (Math.random() * 360 * Math.PI) / 180;
          const velocity = 80 + Math.random() * 220;
          const x = Math.cos(angle) * velocity;
          const y = Math.sin(angle) * velocity - (30 + Math.random() * 80); // arc upwards
          const size = Math.random() * 10 + 4;
          const delay = Math.random() * 0.12;
          const duration = Math.random() * 1.2 + 0.8;
          const rotate = Math.random() * 360 - 180;
          const color =
            particleColors[Math.floor(Math.random() * particleColors.length)];
          const shapeSeed = Math.random();
          const shape =
            shapeSeed < 0.35 ? "circle" : shapeSeed < 0.7 ? "rect" : "sparkle";

          return { id: i, x, y, size, delay, duration, rotate, color, shape };
        });
        setParticles(generated);
      }, 450);

      // 3. Enter Show (text + score countup + buttons): t=750ms
      const showTimer = setTimeout(() => {
        setActiveStep("show");

        let currentScore = 0;
        const interval = setInterval(() => {
          currentScore += Math.ceil(scoreEarned / 8);
          if (currentScore >= scoreEarned) {
            currentScore = scoreEarned;
            clearInterval(interval);
          }
          setScoreDisplay(currentScore);
        }, 20);
      }, 750);

      return () => {
        clearTimeout(silTimer);
        clearTimeout(burstTimer);
        clearTimeout(showTimer);
      };
    }
  }, [isOpen, badge, scoreEarned]);

  if (!isOpen || !badge) return null;

  const norm = getNormalizedRarity(badge.rarity);
  const badgeColor = badge.secondaryColor || norm.accentColor;
  const isPremiumRarity = ["gold", "diamond", "legendary", "mythic"].includes(
    norm.key,
  );
  const displayBadge: BadgeItem = {
    ...badge,
    awardedAt: badge.awardedAt ?? Date.now(),
  };

  return (
    <AnimatePresence>
      <div key="unlock-modal-root" className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden">
        {/* Backdrop: Glassmorphic Dark Blur Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"
          onClick={activeStep === "show" ? onClose : undefined}
        />

        {/* Confetti Flutter Layer (Swaying gravity simulation) */}
        {(activeStep === "burst" || activeStep === "show") && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
            {particles.map((p) => (
              <div
                key={p.id}
                className={cn(
                  "absolute",
                  p.shape === "circle" && "rounded-full",
                  p.shape === "rect" && "rounded-sm",
                  p.shape === "sparkle" && "clip-path-sparkle",
                )}
                style={{
                  width: p.size,
                  height: p.size,
                  backgroundColor: p.shape !== "sparkle" ? p.color : undefined,
                  borderLeft:
                    p.shape === "sparkle" ? `5px solid transparent` : undefined,
                  borderRight:
                    p.shape === "sparkle" ? `5px solid transparent` : undefined,
                  borderBottom:
                    p.shape === "sparkle" ? `10px solid ${p.color}` : undefined,
                  top: "50%",
                  left: "50%",
                  marginTop: -p.size / 2,
                  marginLeft: -p.size / 2,
                  willChange: "transform, opacity",
                  // CSS variables for GPU execution
                  "--p-x": `${p.x}px`,
                  "--p-y": `${p.y}px`,
                  "--p-target-x": `${p.x + (p.id % 2 === 0 ? 25 : -25)}px`,
                  "--p-target-y": `${p.y + 160}px`,
                  "--p-rotate": `${p.rotate}deg`,
                  "--p-rotate-half": `${p.rotate / 2}deg`,
                  animation: `particle-fly ${p.duration}s ease-out ${p.delay}s forwards`,
                } as React.CSSProperties}
              />
            ))}
          </div>
        )}

        {/* Celebration Core Container */}
        <div className="relative w-full max-w-lg p-8 mx-4 z-20 flex flex-col items-center justify-center text-center">
          {/* Header Announcement */}
          <div className="h-14 overflow-hidden mb-2">
            <AnimatePresence>
              {activeStep === "show" && (
                <motion.div
                  key="header-announcement"
                  className="flex flex-col items-center"
                >
                  <motion.span
                    initial={{ letterSpacing: "0.1em", opacity: 0 }}
                    animate={{ letterSpacing: "0.2em", opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-yellow-400 font-extrabold text-xs uppercase flex items-center gap-1.5 drop-shadow-[0_2px_8px_rgba(234,179,8,0.25)] animate-pulse"
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    Achievement Unlocked
                  </motion.span>
                  <motion.h2
                    initial={{ scale: 0.9, opacity: 0, letterSpacing: "-0.05em" }}
                    animate={{ scale: 1, opacity: 1, letterSpacing: "0.02em" }}
                    transition={{ type: "spring", stiffness: 200, damping: 16, delay: 0.05 }}
                    className="text-3xl sm:text-4xl font-black text-white mt-1 leading-tight tracking-tight drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                  >
                    CONGRATULATIONS!
                  </motion.h2>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Badge Display Stage */}
          <div className="relative w-72 h-72 flex items-center justify-center my-6" style={{ perspective: 1200 }}>
            {/* Ambient Radial Backlight Glow */}
            <motion.div
              animate={
                activeStep === "silhouette"
                  ? { scale: 0.9, opacity: 0.15 }
                  : ["burst", "show"].includes(activeStep)
                    ? { scale: [1, 1.3, 1], opacity: [0.5, 0.95, 0.6] }
                    : { scale: 0, opacity: 0 }
              }
              transition={{
                duration: 1.8,
                repeat: Infinity,
                repeatType: "reverse",
              }}
              className="absolute inset-0 rounded-full blur-[50px] pointer-events-none z-0"
              style={{
                background: `radial-gradient(circle, ${badgeColor}50 0%, transparent 70%)`,
              }}
            />

            {/* Cosmic Rotating Beams / Rays */}
            {["burst", "show"].includes(activeStep) && (
              <div
                className="absolute top-1/2 left-1/2 w-[420px] h-[420px] pointer-events-none z-0"
                style={{
                  background: `conic-gradient(from 0deg, transparent, ${badgeColor}40, transparent, ${badgeColor}10, transparent, ${badgeColor}40, transparent)`,
                  borderRadius: "50%",
                  willChange: "transform",
                  animation: "spin-clockwise 25s linear infinite",
                  transform: "translate(-50%, -50%) scale(1.15)",
                }}
              />
            )}

            {/* Cosmic Rotating Beams (Counter-Rotating) */}
            {["burst", "show"].includes(activeStep) && (
              <div
                className="absolute top-1/2 left-1/2 w-[380px] h-[380px] pointer-events-none z-0"
                style={{
                  background: `conic-gradient(from 0deg, transparent, ${badgeColor}30, transparent, ${badgeColor}05, transparent, ${badgeColor}30, transparent)`,
                  borderRadius: "50%",
                  willChange: "transform",
                  animation: "spin-counter-clockwise 35s linear infinite",
                  transform: "translate(-50%, -50%) scale(1.1)",
                }}
              />
            )}

            {/* Expanding Shockwave Ring */}
            <AnimatePresence>
              {(activeStep === "burst" || activeStep === "show") && (
                <motion.div
                  initial={{ scale: 0.35, opacity: 1, borderWidth: "6px" }}
                  animate={{ scale: 2.2, opacity: 0, borderWidth: "0.5px" }}
                  transition={{ duration: 0.85, ease: "easeOut" }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none z-20"
                  style={{
                    width: "180px",
                    height: "180px",
                    borderColor: badgeColor,
                    borderStyle: "solid",
                    boxShadow: `0 0 40px ${badgeColor}`,
                  }}
                />
              )}
            </AnimatePresence>

            {/* Flash Effect during burst */}
            <AnimatePresence>
              {activeStep === "burst" && (
                <motion.div
                  key="burst-flash-effect"
                  initial={{ scale: 0.3, opacity: 0 }}
                  animate={{ scale: 2.8, opacity: [0, 1, 1, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-white blur-xl mix-blend-screen z-20 pointer-events-none"
                />
              )}
            </AnimatePresence>


            {/* Same profile badge card used by the collection grid */}
            <motion.div
              key={badge.id}
              initial={{ scale: 0, rotateY: -180, rotateX: 20, z: -200 }}
              animate={
                activeStep === "silhouette"
                  ? {
                      scale: 0.9,
                      rotateY: -180,
                      rotateX: 12,
                      y: [0, -8, 0],
                      z: 0,
                    }
                  : ["burst", "show"].includes(activeStep)
                    ? {
                        scale: 1,
                        rotateY: 0,
                        rotateX: 0,
                        rotateZ: 0,
                        y: [0, -6, 0],
                        z: 0,
                      }
                    : { scale: 0, rotateY: -180 }
              }
              whileHover={{
                scale: 1.08,
                rotateY: 8,
                rotateX: 6,
                transition: { duration: 0.25, ease: "easeOut" }
              }}
              transition={
                activeStep === "silhouette"
                  ? { 
                      y: { repeat: Infinity, duration: 2.2, ease: "easeInOut" },
                      scale: { duration: 0.4, ease: "easeOut" }
                    }
                  : ["burst"].includes(activeStep)
                    ? { 
                        scale: { type: "spring", stiffness: 140, damping: 11 },
                        rotateY: { type: "spring", stiffness: 100, damping: 12 },
                        rotateX: { type: "spring", stiffness: 100, damping: 12 },
                        rotateZ: { type: "spring", stiffness: 100, damping: 12 },
                      }
                    : {
                        y: { repeat: Infinity, duration: 2.8, ease: "easeInOut" }
                      }
              }
              className="relative z-10 h-64 w-52 sm:h-[17rem] sm:w-56 cursor-pointer"
              style={{
                transformStyle: "preserve-3d",
                filter: ["burst", "show"].includes(activeStep)
                  ? `drop-shadow(0 0 38px ${badgeColor}65)`
                  : undefined,
                willChange: "transform, filter",
              }}
            >
              {/* Back Face (Mystery Card Back with glowing Lock) */}
              <div 
                className="absolute inset-0 rounded-2xl p-6 flex flex-col items-center justify-center border bg-slate-950/95 overflow-hidden select-none"
                style={{
                  borderColor: `${badgeColor}40`,
                  boxShadow: `inset 0 0 20px rgba(0,0,0,0.85), 0 0 30px ${badgeColor}30`,
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
              >
                {/* Dynamic background pattern */}
                <div className="absolute inset-0 opacity-15 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-transparent to-rose-500/20" />
                  <div className="absolute -inset-[50%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent animate-pulse" />
                </div>

                {/* Corners */}
                <div className="absolute top-3 left-3 w-4 h-4 border-t border-l rounded-tl" style={{ borderColor: badgeColor }} />
                <div className="absolute top-3 right-3 w-4 h-4 border-t border-r rounded-tr" style={{ borderColor: badgeColor }} />
                <div className="absolute bottom-3 left-3 w-4 h-4 border-b border-l rounded-bl" style={{ borderColor: badgeColor }} />
                <div className="absolute bottom-3 right-3 w-4 h-4 border-b border-r rounded-br" style={{ borderColor: badgeColor }} />

                {/* Center glowing lock symbol */}
                <div className="relative flex items-center justify-center w-20 h-20 rounded-full border bg-black/40 shadow-inner"
                  style={{ borderColor: `${badgeColor}30` }}
                >
                  <div 
                    className="absolute inset-0 rounded-full blur-md opacity-40 animate-pulse"
                    style={{ background: badgeColor }}
                  />
                  <motion.div
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                    className="relative z-10"
                  >
                    <Lock className="w-8 h-8 text-white" style={{ filter: `drop-shadow(0 0 8px ${badgeColor})` }} />
                  </motion.div>
                </div>

                {/* Decorative text */}
                <div className="mt-4 flex flex-col items-center">
                  <span className="text-[9px] uppercase tracking-[0.3em] font-black text-white/40">Interactive</span>
                  <span className="text-[7px] uppercase tracking-[0.4em] font-bold text-white/20 mt-1">Idea Milestone</span>
                </div>
              </div>

              {/* Front Face (Unlocked Card Design) */}
              <div 
                className="absolute inset-0 h-full w-full"
                style={{
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transform: "rotateY(0deg)",
                }}
              >
                <BadgeCard
                  badge={displayBadge}
                  state="unlocked"
                  className="pointer-events-none h-full w-full"
                  customScore={scoreEarned}
                />

                {/* Shine Sweep Overlay */}
                {activeStep === "show" && (
                  <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none z-30">
                    <motion.div 
                      initial={{ x: "-100%" }}
                      animate={{ x: "200%" }}
                      transition={{
                        repeat: Infinity,
                        repeatDelay: 2.5,
                        duration: 1.5,
                        ease: "easeInOut",
                        delay: 0.8
                      }}
                      className="absolute top-0 bottom-0 w-2/3 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                      style={{ willChange: "transform" }}
                    />
                  </div>
                )}
                {activeStep === "show" && isPremiumRarity && (
                  <>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                      className="absolute top-4 right-4 z-30 text-yellow-400"
                    >
                      <Sparkles className="w-4 h-4" />
                    </motion.div>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 1.5, delay: 0.8 }}
                      className="absolute bottom-4 left-4 z-30 text-cyan-400"
                    >
                      <Sparkles className="w-4.5 h-4.5" />
                    </motion.div>
                  </>
                )}
              </div>
            </motion.div>
          </div>

          {/* Locked Silhouette State Label */}
          {activeStep === "silhouette" && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              className="text-slate-400 text-sm font-medium tracking-wide animate-pulse"
            >
              Unlocking your reward...
            </motion.p>
          )}

          {/* Main Info Stage: Score reward and Actions */}
          <div className="space-y-4 w-full">


            {/* Actions Button Bar */}
            <div className="h-14 pt-2 flex items-center justify-center gap-3">
              <AnimatePresence>
                {activeStep === "show" && (
                  <motion.div
                    key="actions-buttons-container"
                    className="flex items-center justify-center gap-3"
                  >
                    {onViewBadge && (
                      <motion.div
                        key="view-badge-btn"
                        initial={{ y: 25, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
                      >
                        <Button
                          variant="outline"
                          onClick={() => {
                            onViewBadge();
                            onClose();
                          }}
                          className="bg-slate-950/50 hover:bg-slate-900 border-white/10 hover:border-white/20 text-white font-extrabold px-6 py-5 rounded-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                        >
                          View Collection
                        </Button>
                      </motion.div>
                    )}

                    <motion.div
                      key="continue-quest-btn"
                      initial={{ y: 25, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.35 }}
                    >
                      <Button
                        onClick={onClose}
                        className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950 font-black px-8 py-5 rounded-xl hover:shadow-[0_0_20px_rgba(234,179,8,0.4)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                      >
                        Continue Quest
                      </Button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Sparky Mascot Companion (Bounces and displays interactive humanish thoughts) */}
        <AnimatePresence>
          {activeStep === "show" && (
            <motion.div
              key="sparky-mascot"
              initial={{ opacity: 0, scale: 0.6, y: 60, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.6, y: 60 }}
              transition={{
                type: "spring",
                stiffness: 220,
                damping: 14,
                delay: 0.65,
              }}
              className="absolute bottom-6 left-6 z-30 hidden md:flex items-center gap-3.5 bg-slate-950/90 border border-white/15 p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] max-w-xs backdrop-blur-md"
            >
              {/* Bouncing Mascot Bubble */}
              <div
                className="relative w-12 h-12 rounded-xl bg-gradient-to-tr from-yellow-400 to-amber-500 flex items-center justify-center text-3xl shadow-md shrink-0 animate-bounce"
                style={{ animationDuration: "1.8s" }}
              >
                ✨
                <div
                  className="absolute inset-0 rounded-xl border border-white/30 animate-ping opacity-40"
                  style={{ animationDuration: "2.2s" }}
                />
              </div>

              {/* Speech Box */}
              <div className="flex flex-col text-left">
                <span className="text-[9px] text-yellow-400 font-extrabold uppercase tracking-wider">
                  Sparky
                </span>
                <p className="text-white text-xs font-semibold leading-normal mt-0.5 max-w-[200px]">
                  {getMascotSpeech(badge.rarity, badge.name)}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* CSS style hook for custom sparkle clip-path */}
      <style jsx global>{`
        @keyframes particle-fly {
          0% {
            transform: translate(0, 0) scale(0) rotate(0deg);
            opacity: 1;
          }
          15% {
            transform: translate(var(--p-x), var(--p-y)) scale(1.2) rotate(var(--p-rotate-half));
            opacity: 1;
          }
          100% {
            transform: translate(var(--p-target-x), var(--p-target-y)) scale(0) rotate(var(--p-rotate));
            opacity: 0;
          }
        }
        @keyframes spin-clockwise {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes spin-counter-clockwise {
          from { transform: translate(-50%, -50%) rotate(360deg); }
          to { transform: translate(-50%, -50%) rotate(0deg); }
        }
        .clip-path-sparkle {
          clip-path: polygon(
            50% 0%,
            61% 35%,
            98% 35%,
            68% 57%,
            79% 91%,
            50% 70%,
            21% 91%,
            32% 57%,
            2% 35%,
            39% 35%
          );
        }
      `}</style>
    </AnimatePresence>
  );
};
