"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Crown, Medal, Sparkles, Trophy } from "lucide-react";

export type StageMedalTier = "gold" | "silver" | "bronze";

interface StageClearModalProps {
  show: boolean;
  stageNumber: number;
  stageName: string;
  isGold: boolean;
  medalTier?: StageMedalTier;
  fromBiome?: string;
  nextStageName?: string;
  nextBiome?: string;
  onComplete?: () => void;
}

const STAGE_COLORS = {
  1: { primary: "#10b981", secondary: "#059669", glow: "#34d399" }, // Village
  2: { primary: "#22c55e", secondary: "#16a34a", glow: "#4ade80" }, // Forest
  3: { primary: "#a855f7", secondary: "#9333ea", glow: "#c084fc" }, // Arena
  4: { primary: "#f59e0b", secondary: "#d97706", glow: "#fbbf24" }, // Artisan
  5: { primary: "#71717a", secondary: "#52525b", glow: "#a1a1aa" }, // Mine
  6: { primary: "#3b82f6", secondary: "#2563eb", glow: "#60a5fa" }, // Harbour
  7: { primary: "#8b5cf6", secondary: "#7c3aed", glow: "#a78bfa" }, // Crossroads
  8: { primary: "#eab308", secondary: "#ca8a04", glow: "#facc15" }, // Capital
};

const MEDAL_CONFIG: Record<
  StageMedalTier,
  {
    label: string;
    title: string;
    emoji: string;
    primary: string;
    secondary: string;
    deep: string;
    glow: string;
    text: string;
    particle: string[];
  }
> = {
  gold: {
    label: "Gold",
    title: "Gold Medal",
    emoji: "🥇",
    primary: "#FBBF24",
    secondary: "#F59E0B",
    deep: "#92400E",
    glow: "#FACC15",
    text: "text-yellow-200",
    particle: ["🥇", "👑", "✨", "🌟"],
  },
  silver: {
    label: "Silver",
    title: "Silver Medal",
    emoji: "🥈",
    primary: "#E2E8F0",
    secondary: "#94A3B8",
    deep: "#334155",
    glow: "#CBD5E1",
    text: "text-slate-100",
    particle: ["🥈", "✨", "◆", "✦"],
  },
  bronze: {
    label: "Bronze",
    title: "Bronze Medal",
    emoji: "🥉",
    primary: "#F59E0B",
    secondary: "#B45309",
    deep: "#78350F",
    glow: "#D97706",
    text: "text-orange-100",
    particle: ["🥉", "🔥", "✦", "◆"],
  },
};

interface CeremonyParticle {
  id: number;
  x: number;
  delay: number;
  char: string;
  scale: number;
  rotation: number;
  speed: number;
}

export function StageClearModal({
  show,
  stageNumber,
  stageName,
  isGold,
  medalTier,
  fromBiome,
  nextStageName,
  nextBiome,
  onComplete,
}: StageClearModalProps) {
  const [particles, setParticles] = useState<CeremonyParticle[]>([]);

  const stageColors =
    STAGE_COLORS[stageNumber as keyof typeof STAGE_COLORS] || STAGE_COLORS[1];
  const tier: StageMedalTier = medalTier ?? (isGold ? "gold" : "bronze");
  const medal = MEDAL_CONFIG[tier];
  const hasNextStage = Boolean(nextStageName || nextBiome);

  useEffect(() => {
    if (!show) return;

    const newParticles = Array.from({ length: 72 }, (_, i) => {
      const stageParticle = (() => {
        switch (stageNumber) {
          case 1:
          case 2:
            return ["🍃", "🌿", "🌱", "🍁"][Math.floor(Math.random() * 4)];
          case 3:
            return "⚔️";
          case 4:
            return "🎨";
          case 5:
            return "💎";
          case 6:
            return "🌊";
          case 7:
            return "📍";
          case 8:
            return "🌟";
          default:
            return "✨";
        }
      })();

      const medalParticle =
        medal.particle[Math.floor(Math.random() * medal.particle.length)];

      return {
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.9,
        char: Math.random() > 0.45 ? medalParticle : stageParticle,
        scale: 0.55 + Math.random() * 1.05,
        rotation: Math.random() * 360,
        speed: 2.4 + Math.random() * 2.1,
      };
    });

    setParticles(newParticles);

    const timer = window.setTimeout(() => {
      onComplete?.();
    }, 5200);

    return () => window.clearTimeout(timer);
  }, [show, onComplete, stageNumber, medal.particle]);

  return (
    <AnimatePresence>
      {show && (
        <div className="pointer-events-none fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"
            style={{
              background: `radial-gradient(circle at center, ${medal.glow}24 0%, ${stageColors.primary}14 34%, rgba(2,6,23,0.92) 76%)`,
            }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.75 }}
            animate={{ opacity: [0.35, 0.75, 0.35], scale: [0.92, 1.14, 0.92] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute h-[34rem] w-[34rem] rounded-full blur-3xl"
            style={{ backgroundColor: `${medal.glow}22` }}
          />

          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{
                y: -80,
                x: `${particle.x}%`,
                opacity: 0,
                scale: 0,
                rotate: particle.rotation,
              }}
              animate={{
                y:
                  typeof window !== "undefined"
                    ? window.innerHeight + 120
                    : 900,
                x: [
                  `${particle.x}%`,
                  `${particle.x + Math.sin(particle.id) * 10}%`,
                  `${particle.x - Math.cos(particle.id) * 10}%`,
                  `${particle.x}%`,
                ],
                opacity: [0, 1, 1, 0],
                scale: [0, particle.scale, particle.scale, 0],
                rotate: particle.rotation + 420,
              }}
              transition={{
                duration: particle.speed,
                delay: particle.delay,
                ease: "linear",
              }}
              className="absolute select-none text-xl"
            >
              {particle.char}
            </motion.div>
          ))}

          <motion.div
            initial={{ y: 80, opacity: 0, scale: 0.9, rotateX: -18 }}
            animate={{ y: 0, opacity: 1, scale: 1, rotateX: 0 }}
            exit={{ y: 32, opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", damping: 18, stiffness: 180 }}
            className="relative mx-4 w-[min(92vw,680px)]"
            style={{ transformStyle: "preserve-3d" }}
          >
            <div
              className="relative overflow-hidden rounded-[2rem] border p-1 shadow-2xl"
              style={{
                borderColor: `${medal.primary}AA`,
                boxShadow: `0 0 80px ${medal.glow}55, 0 24px 80px rgba(0,0,0,0.65)`,
                background: `linear-gradient(135deg, ${medal.primary} 0%, ${medal.secondary} 42%, ${medal.deep} 100%)`,
              }}
            >
              <div className="relative overflow-hidden rounded-[1.75rem] border border-white/20 bg-slate-950/78 px-7 py-8 text-center backdrop-blur-xl sm:px-12 sm:py-10">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 18,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute -inset-36 opacity-30"
                  style={{
                    background: `conic-gradient(from 0deg, transparent, ${medal.primary}, transparent, ${stageColors.glow}, transparent)`,
                  }}
                />

                <motion.div
                  initial={{ x: "-120%", opacity: 0 }}
                  animate={{ x: "220%", opacity: [0, 1, 0] }}
                  transition={{ duration: 1.6, delay: 0.35, ease: "easeInOut" }}
                  className="absolute inset-y-0 left-0 w-36 skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/35 to-transparent"
                />

                <div className="relative z-10">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{
                      scale: [0, 1.18, 0.94, 1],
                      rotate: [-180, 18, -8, 0],
                    }}
                    transition={{ delay: 0.15, duration: 0.9, ease: "easeOut" }}
                    className="mx-auto mb-5 flex h-32 w-32 items-center justify-center rounded-full border border-white/25 bg-white/10 shadow-2xl backdrop-blur-sm"
                    style={{
                      boxShadow: `inset 0 0 28px rgba(255,255,255,0.12), 0 0 44px ${medal.glow}88`,
                    }}
                  >
                    <div
                      className="flex h-24 w-24 items-center justify-center rounded-full border-4 text-5xl shadow-inner"
                      style={{
                        borderColor: `${medal.primary}DD`,
                        background: `linear-gradient(135deg, ${medal.primary}, ${medal.secondary})`,
                      }}
                    >
                      {tier === "gold" ? (
                        <Crown className="h-12 w-12 text-white drop-shadow-lg" />
                      ) : tier === "silver" ? (
                        <Medal className="h-12 w-12 text-white drop-shadow-lg" />
                      ) : (
                        <Trophy className="h-12 w-12 text-white drop-shadow-lg" />
                      )}
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                  >
                    <div
                      className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.22em]"
                      style={{
                        borderColor: `${medal.primary}66`,
                        backgroundColor: `${medal.primary}18`,
                        color: medal.primary,
                      }}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Stage Medal Ceremony
                    </div>

                    <h1 className="text-4xl font-black uppercase tracking-tight text-white drop-shadow-lg sm:text-6xl">
                      {medal.title}
                    </h1>

                    <p className="mt-2 text-sm font-extrabold uppercase tracking-[0.24em] text-white/65">
                      Stage {stageNumber}: {stageName} Clear
                    </p>

                    <div className="mx-auto mt-5 flex w-fit items-center gap-3 rounded-2xl border border-white/10 bg-white/7 px-5 py-3 text-left shadow-lg backdrop-blur-md">
                      <span className="text-4xl" aria-hidden>
                        {medal.emoji}
                      </span>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
                          Rank Awarded
                        </p>
                        <p
                          className={`text-lg font-black uppercase ${medal.text}`}
                        >
                          {medal.label} Prestige
                        </p>
                      </div>
                    </div>

                    {hasNextStage ? (
                      <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="mx-auto mt-6 max-w-xl rounded-2xl border border-white/10 bg-slate-950/60 p-4 shadow-inner"
                      >
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200/80">
                          New Stage Unlocked
                        </p>
                        <div className="mt-3 flex flex-col items-center justify-center gap-3 text-sm font-black text-white sm:flex-row">
                          <span className="rounded-full bg-white/10 px-4 py-2">
                            {fromBiome || stageName}
                          </span>
                          <ArrowRight className="h-4 w-4 text-white/45" />
                          <span
                            className="rounded-full px-4 py-2"
                            style={{
                              backgroundColor: `${stageColors.glow}22`,
                              color: stageColors.glow,
                            }}
                          >
                            {nextBiome || nextStageName}
                          </span>
                        </div>
                        {nextStageName && (
                          <p className="mt-3 text-xs font-semibold text-white/60">
                            Next questline:{" "}
                            <span className="text-white">{nextStageName}</span>
                          </p>
                        )}
                      </motion.div>
                    ) : (
                      <p className="mt-6 text-sm font-semibold text-white/60">
                        Final stage cleared. Your completed journey is ready to
                        be celebrated.
                      </p>
                    )}

                    {isGold && tier !== "gold" && (
                      <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-yellow-200/80">
                        ✨ Final checkpoint completed at gold standard
                      </p>
                    )}
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
