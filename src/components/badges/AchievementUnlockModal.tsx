"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { audioManager } from "@/lib/audio/audioManager";
import { cn } from "@/lib/utils";
import { getNormalizedRarity, getVentureBadgeEmoji, BadgeItem } from "./BadgeCard";
import { Sparkles, Trophy, Plus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AchievementUnlockModalProps {
  badge: BadgeItem | null;
  reason?: string;
  xpEarned?: number;
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
  if (name.includes("Clear") || name.includes("Stage") || name.includes("Checkpoint") || name.includes("—")) {
    const stageSpeeches = [
      "Incredible checkpoint clear! You're writing startup history! 🚀",
      "Boom! Another milestone crushed. The momentum is real! 🔥",
      "Fabulous progress! Keep this pace up and you'll conquer the map! 🗺️",
      "Stellar work! That is what I call clean, visionary execution! ✨"
    ];
    return stageSpeeches[Math.floor(Math.random() * stageSpeeches.length)];
  }

  const speeches = {
    legendary: [
      "Whoa! Legendary execution! You've set the absolute gold standard here. 🌟",
      "Phenomenal! That was pure start-up magic. Keep soaring! 🚀",
      "Outstanding! You're making this look easy. Absolute legend! 👑"
    ],
    rare: [
      "Sweet! A solid silver finish. You're building massive momentum! 💫",
      "Awesome job! That's high-quality output right there. 🥈",
      "Brilliant! Milestone cleared with style. Keep up the hustle! ⚡"
    ],
    uncommon: [
      "Woohoo! You made it through! Every milestone is a step forward. 🌱",
      "Nice one! Got the bronze. Ready for the next challenge? 💪",
      "Boom! Task complete. Let's keep this fire burning! 🔥"
    ],
    default: [
      "Incredible milestone unlocked! You're leveling up fast! 🎓",
      "Hooray! Another notch on your journey. You got this! 🌟",
      "Awesome achievement! The community is cheering you on! 👥"
    ]
  };
  
  const pool = r.includes("legendary") || r.includes("gold") ? speeches.legendary
             : r.includes("rare") || r.includes("silver") ? speeches.rare
             : r.includes("uncommon") || r.includes("bronze") ? speeches.uncommon
             : speeches.default;
             
  return pool[Math.floor(Math.random() * pool.length)];
};

export const AchievementUnlockModal: React.FC<AchievementUnlockModalProps> = ({
  badge,
  reason,
  xpEarned = 500,
  isOpen,
  onClose,
  onViewBadge
}) => {
  const [activeStep, setActiveStep] = useState<"backdrop" | "silhouette" | "burst" | "show">("backdrop");
  const [xpDisplay, setXpDisplay] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (isOpen && badge) {
      setActiveStep("backdrop");
      setXpDisplay(0);

      // 1. Enter Silhouette: t=300ms
      const silTimer = setTimeout(() => {
        setActiveStep("silhouette");
      }, 300);

      // 2. Trigger Burst: t=1300ms (dramatic unlock)
      const burstTimer = setTimeout(() => {
        setActiveStep("burst");
        
        // Play SFX matching rarity
        const sfxRarity = ["common", "uncommon", "rare", "epic", "legendary"].includes(badge.rarity)
          ? badge.rarity
          : badge.rarity === "bronze" ? "common"
          : badge.rarity === "silver" ? "uncommon"
          : badge.rarity === "gold" ? "rare"
          : badge.rarity === "diamond" ? "epic"
          : "legendary";
        
        try {
          audioManager.playBadgeSFX(sfxRarity as any);
        } catch (e) {
          console.warn("Audio play failed:", e);
        }

        // Generate customized particles based on rarity
        const norm = getNormalizedRarity(badge.rarity);
        const particleColors = 
          norm.key === "gold" ? ["#FBBF24", "#F59E0B", "#FFFDF5", "#92400E"] :
          norm.key === "silver" ? ["#CBD5E1", "#94A3B8", "#FFFFFF", "#475569"] :
          norm.key === "bronze" ? ["#D97706", "#B45309", "#FFF7ED", "#78350F"] :
          norm.key === "diamond" ? ["#22D3EE", "#06B6D4", "#E0F7FA", "#0891B2"] :
          norm.key === "legendary" ? ["#A855F7", "#D946EF", "#F3E8FF", "#7E22CE", "#FBBF24"] :
          ["#F43F5E", "#EC4899", "#818CF8", "#FFFFFF", "#FBBF24"]; // Mythic / default cosmic colors

        // Generate fluttery paper confetti
        const generated: Particle[] = Array.from({ length: 85 }).map((_, i) => {
          const angle = (Math.random() * 360 * Math.PI) / 180;
          const velocity = 80 + Math.random() * 240;
          const x = Math.cos(angle) * velocity;
          const y = Math.sin(angle) * velocity - (30 + Math.random() * 90); // arc upwards
          const size = Math.random() * 11 + 5;
          const delay = Math.random() * 0.12;
          const duration = Math.random() * 1.5 + 1.3;
          const rotate = Math.random() * 720 - 360;
          const color = particleColors[Math.floor(Math.random() * particleColors.length)];
          const shapeSeed = Math.random();
          const shape = shapeSeed < 0.4 ? "circle" : shapeSeed < 0.8 ? "rect" : "sparkle";
          
          return { id: i, x, y, size, delay, duration, rotate, color, shape };
        });
        setParticles(generated);
      }, 1200);

      // 3. Enter Show (text + XP countup + buttons): t=1600ms
      const showTimer = setTimeout(() => {
        setActiveStep("show");
        
        let currentXp = 0;
        const interval = setInterval(() => {
          currentXp += Math.ceil(xpEarned / 12);
          if (currentXp >= xpEarned) {
            currentXp = xpEarned;
            clearInterval(interval);
          }
          setXpDisplay(currentXp);
        }, 30);
      }, 1600);

      return () => {
        clearTimeout(silTimer);
        clearTimeout(burstTimer);
        clearTimeout(showTimer);
      };
    }
  }, [isOpen, badge, xpEarned]);

  if (!isOpen || !badge) return null;

  const norm = getNormalizedRarity(badge.rarity);
  const emoji = badge.icon || getVentureBadgeEmoji(badge.id, badge.name);
  const badgeColor = badge.secondaryColor || norm.accentColor;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden">
        {/* Backdrop: Glassmorphic Dark Blur Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/85 backdrop-blur-xl"
          onClick={activeStep === "show" ? onClose : undefined}
        />

        {/* Confetti Flutter Layer (Swaying gravity simulation) */}
        {(activeStep === "burst" || activeStep === "show") && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
            {particles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
                animate={{
                  // Flutter / sway horizontally using sine offsets
                  x: [0, p.x * 0.4, p.x * 0.8, p.x + Math.sin(p.id) * 35, p.x - Math.sin(p.id) * 20],
                  // Accelerate downwards representing gravity pull
                  y: [0, p.y * 0.6, p.y, p.y + 120, p.y + 260],
                  scale: [0, 1.4, 1.4, 1.0, 0],
                  opacity: [1, 1, 1, 0.7, 0],
                  rotate: [0, p.rotate * 0.3, p.rotate * 0.6, p.rotate, p.rotate + 180],
                }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  ease: "easeOut",
                }}
                className={cn(
                  "absolute",
                  p.shape === "circle" && "rounded-full",
                  p.shape === "rect" && "rounded-sm",
                  p.shape === "sparkle" && "clip-path-sparkle"
                )}
                style={{
                  width: p.size,
                  height: p.size,
                  backgroundColor: p.shape !== "sparkle" ? p.color : undefined,
                  borderLeft: p.shape === "sparkle" ? `5px solid transparent` : undefined,
                  borderRight: p.shape === "sparkle" ? `5px solid transparent` : undefined,
                  borderBottom: p.shape === "sparkle" ? `10px solid ${p.color}` : undefined,
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                }}
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
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className="flex flex-col items-center"
                >
                  <span className="text-yellow-400 font-extrabold tracking-widest text-xs uppercase flex items-center gap-1.5 drop-shadow-[0_2px_8px_rgba(234,179,8,0.25)] animate-pulse">
                    <Trophy className="w-3.5 h-3.5" />
                    Achievement Unlocked
                  </span>
                  <h2 className="text-3xl font-black text-white mt-1 leading-tight tracking-tight">
                    CONGRATULATIONS!
                  </h2>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Badge Display Stage */}
          <div className="relative w-72 h-72 flex items-center justify-center my-6">
            
            {/* Ambient Radial Backlight Glow */}
            <motion.div
              animate={activeStep === "silhouette" 
                ? { scale: 0.9, opacity: 0.15 } 
                : ["burst", "show"].includes(activeStep)
                ? { scale: [1, 1.25, 1], opacity: [0.6, 0.95, 0.7] }
                : { scale: 0, opacity: 0 }
              }
              transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
              className="absolute inset-0 rounded-full blur-[45px] pointer-events-none z-0"
              style={{
                background: `radial-gradient(circle, ${badgeColor}40 0%, transparent 70%)`
              }}
            />

            {/* Flash Effect during burst */}
            <AnimatePresence>
              {activeStep === "burst" && (
                <motion.div
                  initial={{ scale: 0.3, opacity: 0 }}
                  animate={{ scale: 2.5, opacity: [0, 1, 1, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45 }}
                  className="absolute w-40 h-40 rounded-full bg-white blur-xl mix-blend-screen z-20 pointer-events-none"
                />
              )}
            </AnimatePresence>

            {/* The Badge: Duo-style Squash & Stretch Physics */}
            <motion.div
              initial={{ scale: 0, rotate: -35 }}
              animate={
                activeStep === "silhouette"
                  ? { scale: 0.95, rotate: 0, y: 0, filter: "brightness(0.0) contrast(2)" }
                  : ["burst", "show"].includes(activeStep)
                  ? { 
                      scale: [0.2, 1.25, 0.85, 1.08, 0.96, 1],
                      rotate: [0, -12, 6, -3, 0],
                      y: [30, -25, 10, -5, 0],
                      filter: "brightness(1) contrast(1)",
                    }
                  : { scale: 0, rotate: -35 }
              }
              transition={{
                duration: 0.85,
                ease: "easeOut",
              }}
              className={cn(
                "relative w-52 h-52 rounded-[32px] border bg-slate-900/60 backdrop-blur-md flex flex-col items-center justify-center p-6 z-10 transition-all duration-300",
                "border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)]",
                activeStep === "show" && norm.glowClass,
                activeStep === "show" && "hover:scale-105 duration-200 cursor-pointer"
              )}
              style={{
                borderColor: ["burst", "show"].includes(activeStep) ? `${badgeColor}80` : "rgba(255,255,255,0.05)"
              }}
            >
              {/* Rotating Dashed Ring */}
              {activeStep === "show" && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                  className="absolute inset-2 rounded-[26px] border border-dashed opacity-35"
                  style={{ borderColor: badgeColor }}
                />
              )}

              {/* Emoji Sphere */}
              <div 
                className={cn(
                  "w-24 h-24 rounded-full bg-slate-950/80 border border-white/5 flex items-center justify-center text-5.5xl shadow-inner z-10",
                  activeStep === "show" && "animate-bounce"
                )}
                style={{ 
                  animationDuration: "2.5s",
                  color: activeStep === "show" ? badgeColor : "#334155" 
                }}
              >
                {activeStep === "silhouette" ? "❓" : emoji}
              </div>

              {/* Sparkle attachments */}
              {activeStep === "show" && ["gold", "diamond", "legendary", "mythic"].includes(norm.key) && (
                <>
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                    className="absolute top-4 right-4 text-yellow-400"
                  >
                    <Sparkles className="w-4 h-4" />
                  </motion.div>
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: 0.8 }}
                    className="absolute bottom-4 left-4 text-cyan-400"
                  >
                    <Sparkles className="w-4.5 h-4.5" />
                  </motion.div>
                </>
              )}
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

          {/* Main Info Stage: Name, description, XP */}
          <div className="space-y-4 w-full">
            
            {/* Badge Name */}
            <div className="h-10 overflow-hidden">
              <AnimatePresence>
                {activeStep === "show" && (
                  <motion.h3
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                    className="text-2xl font-black tracking-tight"
                    style={{ color: badgeColor }}
                  >
                    {badge.name}
                  </motion.h3>
                )}
              </AnimatePresence>
            </div>

            {/* Description / Lore */}
            <div className="h-16 overflow-hidden">
              <AnimatePresence>
                {activeStep === "show" && (
                  <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col items-center"
                  >
                    <p className="text-slate-200 text-sm font-medium max-w-sm">
                      "{badge.tagline || badge.description}"
                    </p>
                    {reason && (
                      <p className="text-slate-400 text-xs mt-1 bg-slate-900/40 px-3 py-1 rounded-full border border-white/5 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        {reason}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Reward Points Box (Dopamine counter) */}
            <div className="h-16 flex justify-center items-center">
              <AnimatePresence>
                {activeStep === "show" && (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.35, type: "spring", damping: 12 }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-extrabold shadow-[0_4px_20px_rgba(234,179,8,0.1)]"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span className="text-2xl font-black tabular-nums">{xpDisplay}</span>
                    <span className="text-sm font-extrabold tracking-widest uppercase">XP Earned</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Actions Button Bar */}
            <div className="h-14 pt-2 flex items-center justify-center gap-3">
              <AnimatePresence>
                {activeStep === "show" && (
                  <>
                    {onViewBadge && (
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
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
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Button
                        onClick={onClose}
                        className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950 font-black px-8 py-5 rounded-xl hover:shadow-[0_0_20px_rgba(234,179,8,0.4)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                      >
                        Continue Quest
                      </Button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>

        {/* Sparky Mascot Companion (Bounces and displays interactive humanish thoughts) */}
        <AnimatePresence>
          {activeStep === "show" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.6, y: 60, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.6, y: 60 }}
              transition={{ type: "spring", stiffness: 220, damping: 14, delay: 0.65 }}
              className="absolute bottom-6 left-6 z-30 hidden md:flex items-center gap-3.5 bg-slate-950/90 border border-white/15 p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] max-w-xs backdrop-blur-md"
            >
              {/* Bouncing Mascot Bubble */}
              <div 
                className="relative w-12 h-12 rounded-xl bg-gradient-to-tr from-yellow-400 to-amber-500 flex items-center justify-center text-3xl shadow-md shrink-0 animate-bounce" 
                style={{ animationDuration: "1.8s" }}
              >
                ✨
                <div className="absolute inset-0 rounded-xl border border-white/30 animate-ping opacity-40" style={{ animationDuration: "2.2s" }} />
              </div>
              
              {/* Speech Box */}
              <div className="flex flex-col text-left">
                <span className="text-[9px] text-yellow-400 font-extrabold uppercase tracking-wider">Sparky</span>
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
        .clip-path-sparkle {
          clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
        }
      `}</style>
    </AnimatePresence>
  );
};
