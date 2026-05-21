"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ArrowRight } from "lucide-react";
import { audioManager } from "@/lib/audio/audioManager";

// Generate random particle data
function generateParticles(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    angle: (360 / count) * i + Math.random() * (360 / count),
    distance: 100 + Math.random() * 200,
    size: 4 + Math.random() * 8,
    duration: 0.4 + Math.random() * 0.3,
    delay: Math.random() * 0.1,
  }));
}

// Legendary Full-Screen Gold Particle Burst
function LegendaryParticleBurst() {
  const particles = generateParticles(30);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 pointer-events-none overflow-hidden"
    >
      {/* White flash overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.1, times: [0, 0.5, 1], delay: 0.4 }}
        className="absolute inset-0 bg-white z-20"
      />

      {/* Gold radial gradient background */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: [0, 0.8, 0], scale: [0.5, 1.5, 2] }}
        transition={{ duration: 0.5, times: [0, 0.3, 1] }}
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at center, rgba(251,191,36,0.6) 0%, rgba(245,158,11,0.4) 30%, rgba(217,119,6,0.2) 60%, transparent 100%)",
        }}
      />

      {/* Particles radiating from center */}
      {particles.map((particle) => {
        const centerX = 50; // center percentage
        const centerY = 50;
        const endX =
          centerX +
          (Math.cos((particle.angle * Math.PI) / 180) * particle.distance) / 5;
        const endY =
          centerY +
          (Math.sin((particle.angle * Math.PI) / 180) * particle.distance) / 5;

        return (
          <motion.div
            key={particle.id}
            initial={{
              left: `${centerX}%`,
              top: `${centerY}%`,
              opacity: 0,
              scale: 0,
            }}
            animate={{
              left: `${endX}%`,
              top: `${endY}%`,
              opacity: [0, 1, 0.8, 0],
              scale: [0, 1.2, 1, 0.5],
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              ease: "easeOut",
            }}
            className="absolute rounded-full"
            style={{
              width: particle.size,
              height: particle.size,
              background:
                "radial-gradient(circle, rgba(251,191,36,1) 0%, rgba(245,158,11,0.8) 50%, rgba(217,119,6,0.4) 100%)",
              boxShadow: "0 0 10px rgba(251,191,36,0.8)",
            }}
          />
        );
      })}

      {/* Additional sparkle particles */}
      {Array.from({ length: 15 }, (_, i) => {
        const angle = (360 / 15) * i;
        const distance = 150 + Math.random() * 150;
        const centerX = 50;
        const centerY = 50;
        const endX =
          centerX + (Math.cos((angle * Math.PI) / 180) * distance) / 5;
        const endY =
          centerY + (Math.sin((angle * Math.PI) / 180) * distance) / 5;

        return (
          <motion.div
            key={`sparkle-${i}`}
            initial={{
              left: `${centerX}%`,
              top: `${centerY}%`,
              opacity: 0,
              rotate: 0,
            }}
            animate={{
              left: `${endX}%`,
              top: `${endY}%`,
              opacity: [0, 1, 0],
              rotate: 360,
            }}
            transition={{
              duration: 0.5,
              delay: 0.1 + Math.random() * 0.2,
              ease: "easeOut",
            }}
            className="absolute"
            style={{
              width: 6,
              height: 6,
            }}
          >
            <Star
              className="w-full h-full text-amber-300"
              fill="currentColor"
            />
          </motion.div>
        );
      })}
    </motion.div>
  );
}

// Rare Badge Blue Particle Burst (on badge land)
function RareParticleBurst() {
  const particles = generateParticles(20);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 pointer-events-none"
    >
      {particles.map((particle) => {
        const angle = (360 / particles.length) * particle.id;
        const endX =
          Math.cos((angle * Math.PI) / 180) * (particle.distance / 2);
        const endY =
          Math.sin((angle * Math.PI) / 180) * (particle.distance / 2);

        return (
          <motion.div
            key={particle.id}
            initial={{
              x: 0,
              y: 0,
              opacity: 0,
              scale: 0,
            }}
            animate={{
              x: endX,
              y: endY,
              opacity: [0, 1, 0.7, 0],
              scale: [0, 1.5, 1, 0.3],
            }}
            transition={{
              duration: 0.3,
              delay: particle.delay,
              ease: "easeOut",
            }}
            className="absolute left-1/2 top-1/2 rounded-full"
            style={{
              width: particle.size,
              height: particle.size,
              background:
                "radial-gradient(circle, rgba(59,130,246,1) 0%, rgba(37,99,235,0.8) 50%, rgba(29,78,216,0.4) 100%)",
              boxShadow: "0 0 8px rgba(59,130,246,0.9)",
            }}
          />
        );
      })}
    </motion.div>
  );
}

// Epic Badge Purple Particle Burst with Color Pulse (on badge land)
function EpicParticleBurst() {
  const particles = generateParticles(25);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 pointer-events-none"
    >
      {/* Pulsing glow ring */}
      <motion.div
        animate={{
          scale: [1, 1.4, 1.2],
          opacity: [0.8, 0.3, 0],
        }}
        transition={{
          duration: 0.5,
          ease: "easeOut",
        }}
        className="absolute inset-0 rounded-2xl"
        style={{
          boxShadow:
            "0 0 40px 10px rgba(168,85,247,0.8), inset 0 0 40px rgba(168,85,247,0.5)",
          border: "2px solid rgba(168,85,247,0.8)",
        }}
      />

      {/* Color pulse waves */}
      {[0, 0.15, 0.3].map((delay, idx) => (
        <motion.div
          key={`pulse-${idx}`}
          initial={{ scale: 1, opacity: 0 }}
          animate={{
            scale: [1, 1.8],
            opacity: [0.6, 0],
          }}
          transition={{
            duration: 0.5,
            delay,
            ease: "easeOut",
          }}
          className="absolute inset-0 rounded-2xl"
          style={{
            background:
              "radial-gradient(circle, rgba(168,85,247,0.4) 0%, rgba(147,51,234,0.2) 50%, transparent 100%)",
          }}
        />
      ))}

      {/* Particles */}
      {particles.map((particle) => {
        const angle = (360 / particles.length) * particle.id;
        const endX =
          Math.cos((angle * Math.PI) / 180) * (particle.distance / 1.8);
        const endY =
          Math.sin((angle * Math.PI) / 180) * (particle.distance / 1.8);

        return (
          <motion.div
            key={particle.id}
            initial={{
              x: 0,
              y: 0,
              opacity: 0,
              scale: 0,
            }}
            animate={{
              x: endX,
              y: endY,
              opacity: [0, 1, 0.8, 0],
              scale: [0, 1.5, 1.2, 0.4],
            }}
            transition={{
              duration: 0.5,
              delay: particle.delay,
              ease: "easeOut",
            }}
            className="absolute left-1/2 top-1/2 rounded-full"
            style={{
              width: particle.size,
              height: particle.size,
              background:
                "radial-gradient(circle, rgba(168,85,247,1) 0%, rgba(147,51,234,0.8) 50%, rgba(126,34,206,0.4) 100%)",
              boxShadow: "0 0 10px rgba(168,85,247,0.9)",
            }}
          />
        );
      })}
    </motion.div>
  );
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  shape?: string;
  /** When true, renders the full profile-page card style instead of the emoji box */
  isProfileStyle?: boolean;
  /** Used by profile-style cards for the rotating ring background */
  primaryColor?: string;
  secondaryColor?: string;
  /** Short flavour line shown on the card (tagline from ventureConstants) */
  tagline?: string;
}

interface BadgeAwardSequenceProps {
  isVisible: boolean;
  badge: Badge | null;
  onComplete?: () => void;
  onSkip?: () => void;
}

const BURST_COLORS = {
  common: "rgba(156, 163, 175, 0.8)",    // gray
  uncommon: "rgba(205, 127, 50, 0.8)",   // bronze
  rare: "rgba(59, 130, 246, 0.8)",       // silver-blue
  epic: "rgba(168, 85, 247, 0.8)",       // purple
  legendary: "rgba(251, 191, 36, 0.8)", // gold
};

const RARITY_COLORS = {
  common: {
    bg: "bg-gray-500/20",
    border: "border-gray-500",
    text: "text-gray-400",
    glow: "shadow-gray-500/20",
    label: "COMMON",
  },
  uncommon: {
    // Bronze
    bg: "bg-amber-900/30",
    border: "border-amber-700",
    text: "text-amber-600",
    glow: "shadow-amber-700/30",
    label: "BRONZE",
  },
  rare: {
    // Silver
    bg: "bg-slate-400/20",
    border: "border-slate-400",
    text: "text-slate-300",
    glow: "shadow-slate-400/20",
    label: "SILVER",
  },
  epic: {
    bg: "bg-purple-500/20",
    border: "border-purple-500",
    text: "text-purple-400",
    glow: "shadow-purple-500/20",
    label: "EPIC",
  },
  legendary: {
    // Gold
    bg: "bg-amber-500/20",
    border: "border-amber-400",
    text: "text-amber-400",
    glow: "shadow-amber-500/30",
    label: "GOLD",
  },
};

/** Trophy SVG rendered inside badge cards for Gold/Silver/Bronze tier badges */
function TrophyIcon({ rarity }: { rarity: "legendary" | "rare" | "uncommon" }) {
  const fill =
    rarity === "legendary"
      ? "#F59E0B"  // gold
      : rarity === "rare"
        ? "#CBD5E1" // silver
        : "#CD7F32"; // bronze
  const glow =
    rarity === "legendary"
      ? "drop-shadow(0 0 8px rgba(251,191,36,0.8))"
      : rarity === "rare"
        ? "drop-shadow(0 0 6px rgba(203,213,225,0.6))"
        : "drop-shadow(0 0 6px rgba(205,127,50,0.6))";

  return (
    <svg
      viewBox="0 0 64 64"
      className="w-16 h-16"
      style={{ filter: glow }}
      fill={fill}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Cup body */}
      <path d="M20 6h24v20c0 8.837-5.373 16-12 16S20 34.837 20 26V6z" />
      {/* Left handle */}
      <path d="M20 10H12a6 6 0 0 0 0 12h8" fill={fill} />
      {/* Right handle */}
      <path d="M44 10h8a6 6 0 0 1 0 12h-8" fill={fill} />
      {/* Stem */}
      <rect x="28" y="42" width="8" height="10" rx="2" fill={fill} />
      {/* Base */}
      <rect x="20" y="52" width="24" height="6" rx="3" fill={fill} />
    </svg>
  );
}
/**
 * Renders a badge card that matches the profile page design exactly:
 * - dark card with rarity gradient border/bg
 * - rotating diamond ring in primaryColor behind the icon
 * - emoji icon in an inner circle styled with secondaryColor
 * - badge name, tagline, and rarity pill
 */
function ProfileStyleBadgeCard({ badge, rarityStyle }: { badge: Badge; rarityStyle: typeof RARITY_COLORS[keyof typeof RARITY_COLORS] }) {
  const PROFILE_RARITY_GRADIENTS: Record<string, string> = {
    common: "from-slate-500/10 via-slate-600/5 to-transparent border-slate-700/50",
    uncommon: "from-amber-800/20 via-amber-900/10 to-transparent border-amber-700/50",
    rare: "from-slate-400/15 via-slate-500/5 to-transparent border-slate-500/60",
    epic: "from-purple-500/20 via-purple-600/5 to-transparent border-purple-500/60",
    legendary: "from-amber-500/25 via-yellow-600/10 to-transparent border-amber-400/80",
  };
  const PROFILE_RARITY_TEXTS: Record<string, string> = {
    common: "text-slate-400 border-slate-500/20 bg-slate-500/10",
    uncommon: "text-amber-600 border-amber-700/30 bg-amber-900/20",
    rare: "text-slate-300 border-slate-400/20 bg-slate-400/10",
    epic: "text-purple-400 border-purple-500/20 bg-purple-500/10",
    legendary: "text-amber-400 border-amber-500/20 bg-amber-500/10",
  };
  const ringStyle = {
    backgroundColor: badge.primaryColor || "#1E293B",
    borderColor: badge.secondaryColor || "#475569",
  };
  const iconColor = badge.secondaryColor || "#94A3B8";

  return (
    <motion.div
      initial={{ scale: 0.7, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 22, delay: 0.1 }}
      className={`relative overflow-hidden rounded-2xl border bg-[#0F1117]/90 backdrop-blur-md p-6 flex flex-col items-center text-center w-52 shadow-2xl bg-gradient-to-br ${PROFILE_RARITY_GRADIENTS[badge.rarity]}`}
    >
      {/* Sheen overlay for legendary/epic */}
      {(badge.rarity === "legendary" || badge.rarity === "epic") && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
      )}

      {/* Icon canvas — mirrored from profile page */}
      <div className="relative w-20 h-20 flex items-center justify-center mb-4">
        {/* Rotating diamond background ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
          className="absolute inset-0 rounded-2xl border-2 opacity-30"
          style={ringStyle}
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
          className="absolute inset-1 rounded-xl border opacity-20"
          style={ringStyle}
        />
        {/* Inner icon circle */}
        <div
          className="relative w-14 h-14 flex items-center justify-center rounded-full bg-zinc-900/70 border border-white/10 shadow-inner z-10"
          style={{ color: iconColor }}
        >
          <span className="text-3xl select-none" style={{ filter: `drop-shadow(0 0 6px ${iconColor}88)` }}>
            {badge.icon}
          </span>
        </div>
      </div>

      {/* Text */}
      <h4 className="font-bold text-base text-white mb-1 leading-tight">{badge.name}</h4>
      <p className="text-[11px] text-slate-400 mb-3 leading-snug line-clamp-2">
        {badge.tagline || badge.description}
      </p>

      {/* Rarity pill */}
      <span
        className={`text-[9px] font-bold tracking-widest uppercase rounded-full px-2.5 py-0.5 border ${PROFILE_RARITY_TEXTS[badge.rarity]}`}
      >
        {rarityStyle.label}
      </span>
    </motion.div>
  );
}


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
  const [showLegendaryBurst, setShowLegendaryBurst] = useState(false);
  const [showEdgeBurst, setShowEdgeBurst] = useState(false);
  const [showRareParticles, setShowRareParticles] = useState(false);
  const [showEpicParticles, setShowEpicParticles] = useState(false);

  useEffect(() => {
    if (isVisible && badge) {
      audioManager.playBadgeSFX(badge.rarity);
      setShowFlash(true);
      setShowBadge(false);
      setShowReveal(false);
      setShowLegendaryBurst(false);
      setShowEdgeBurst(false);
      setShowRareParticles(false);
      setShowEpicParticles(false);
      setIsLegendary(badge.rarity === "legendary");

      const isLegendaryBadge = badge.rarity === "legendary";
      const isRareBadge = badge.rarity === "rare";
      const isEpicBadge = badge.rarity === "epic";

      // Legendary: Full-screen gold particle burst BEFORE everything
      if (isLegendaryBadge) {
        setShowLegendaryBurst(true);
        setTimeout(() => setShowLegendaryBurst(false), 500);
      }

      if (isLegendaryBadge) {
        // Legendary: gold burst FIRST (0.5s), then normal sequence offset by 0.5s
        const flashTimer = setTimeout(() => setShowFlash(false), 600); // 0.1s flash starts at 0.5s
        const badgeTimer = setTimeout(() => {
          setShowBadge(true);
          setShowEdgeBurst(true);
        }, 700); // badge drops at 0.7s
        const edgeBurstTimer = setTimeout(() => setShowEdgeBurst(false), 900); // 200ms burst
        const revealTimer = setTimeout(() => setShowReveal(true), 1300); // reveal at 1.3s
        return () => {
          clearTimeout(flashTimer);
          clearTimeout(badgeTimer);
          clearTimeout(edgeBurstTimer);
          clearTimeout(revealTimer);
        };
      }

      const flashTimer = setTimeout(() => setShowFlash(false), 100);
      const badgeTimer = setTimeout(() => {
        setShowBadge(true);
        setShowEdgeBurst(true);

        // Trigger rare/epic particles on badge land
        if (isRareBadge) {
          setShowRareParticles(true);
          setTimeout(() => setShowRareParticles(false), 300);
        } else if (isEpicBadge) {
          setShowEpicParticles(true);
          setTimeout(() => setShowEpicParticles(false), 500);
        }
      }, 200);
      const edgeBurstTimer = setTimeout(() => setShowEdgeBurst(false), 400); // 200ms burst
      const revealTimer = setTimeout(() => setShowReveal(true), 800);

      const autoDismissTimer = setTimeout(() => {
        if (badge.rarity !== "legendary") {
          handleDismiss();
        }
      }, 3000);

      return () => {
        clearTimeout(flashTimer);
        clearTimeout(badgeTimer);
        clearTimeout(edgeBurstTimer);
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
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 42%, ${BURST_COLORS[badge.rarity]} 0%, transparent 28%), linear-gradient(180deg, rgba(15,23,42,0.58), rgba(0,0,0,0.84))`,
            }}
          />
          <motion.div
            className="absolute h-72 w-72 rounded-full border border-white/10 pointer-events-none"
            initial={{ opacity: 0, scale: 0.82 }}
            animate={{ opacity: [0.25, 0.55, 0.25], scale: [0.9, 1.05, 0.9] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute h-96 w-96 rounded-full border border-white/5 pointer-events-none"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: [0.15, 0.38, 0.15], scale: [1.04, 0.94, 1.04] }}
            transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Legendary Full-Screen Particle Burst */}
          <AnimatePresence>
            {showLegendaryBurst && <LegendaryParticleBurst />}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {showLegendaryBurst && (
              <motion.div
                key="legendary_burst"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0.8, 0] }}
                transition={{ duration: 0.5, times: [0, 0.2, 0.7, 1] }}
                className="absolute inset-0 pointer-events-none z-10"
                style={{
                  background:
                    "radial-gradient(ellipse at center, rgba(251,191,36,0.4) 0%, rgba(245,158,11,0.6) 50%, rgba(217,119,6,0.3) 100%)",
                  boxShadow: "inset 0 0 200px 100px rgba(251,191,36,0.3)",
                }}
              />
            )}

            {showFlash && (
              <motion.div
                key="flash"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.08 }}
                className="absolute inset-0 bg-white/80"
              />
            )}

            {showBadge && !showReveal && (
              <motion.div
                key="materialize"
                initial={{ scale: 0.45, rotate: -12, y: 18, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, y: 0, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 18 }}
                className="relative"
              >
                {/* Rare Badge Particles */}
                <AnimatePresence>
                  {showRareParticles && <RareParticleBurst />}
                </AnimatePresence>

                {/* Epic Badge Particles */}
                <AnimatePresence>
                  {showEpicParticles && <EpicParticleBurst />}
                </AnimatePresence>
                {/* Edge burst effect - 4 bursts emanating from corners */}
                <AnimatePresence>
                  {showEdgeBurst && (
                    <>
                      {/* Top-left burst */}
                      <motion.div
                        key="burst-tl"
                        initial={{ scale: 0, opacity: 1 }}
                        animate={{ scale: 3, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute -top-4 -left-4 w-8 h-8 rounded-full pointer-events-none"
                        style={{
                          background: `radial-gradient(circle, ${BURST_COLORS[badge.rarity]} 0%, transparent 70%)`,
                        }}
                      />
                      {/* Top-right burst */}
                      <motion.div
                        key="burst-tr"
                        initial={{ scale: 0, opacity: 1 }}
                        animate={{ scale: 3, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute -top-4 -right-4 w-8 h-8 rounded-full pointer-events-none"
                        style={{
                          background: `radial-gradient(circle, ${BURST_COLORS[badge.rarity]} 0%, transparent 70%)`,
                        }}
                      />
                      {/* Bottom-left burst */}
                      <motion.div
                        key="burst-bl"
                        initial={{ scale: 0, opacity: 1 }}
                        animate={{ scale: 3, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute -bottom-4 -left-4 w-8 h-8 rounded-full pointer-events-none"
                        style={{
                          background: `radial-gradient(circle, ${BURST_COLORS[badge.rarity]} 0%, transparent 70%)`,
                        }}
                      />
                      {/* Bottom-right burst */}
                      <motion.div
                        key="burst-br"
                        initial={{ scale: 0, opacity: 1 }}
                        animate={{ scale: 3, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute -bottom-4 -right-4 w-8 h-8 rounded-full pointer-events-none"
                        style={{
                          background: `radial-gradient(circle, ${BURST_COLORS[badge.rarity]} 0%, transparent 70%)`,
                        }}
                      />
                      {/* Center expanding ring burst */}
                      <motion.div
                        key="burst-ring"
                        initial={{ scale: 1, opacity: 1 }}
                        animate={{ scale: 1.6, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute inset-0 rounded-2xl pointer-events-none"
                        style={{
                          border: `2px solid ${BURST_COLORS[badge.rarity]}`,
                          boxShadow: `0 0 20px ${BURST_COLORS[badge.rarity]}`,
                        }}
                      />
                    </>
                  )}
                </AnimatePresence>

                <motion.div
                  animate={{
                    boxShadow: isLegendary
                      ? [
                          "0 0 0 rgba(245,158,11,0)",
                          "0 0 60px rgba(245,158,11,0.5)",
                          "0 0 40px rgba(245,158,11,0.3)",
                        ]
                      : [
                          "0 0 0 rgba(99,102,241,0)",
                          "0 0 30px rgba(99,102,241,0.3)",
                          "0 0 20px rgba(99,102,241,0.2)",
                        ],
                  }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className={`w-32 h-32 rounded-2xl ${rarityStyle.bg} ${rarityStyle.border} border-2 flex items-center justify-center relative z-10 overflow-hidden`}
                >
                  <motion.span
                    className="absolute inset-y-0 -left-10 w-8 rotate-12 bg-white/40 blur-md"
                    animate={{ x: [0, 180] }}
                    transition={{ duration: 1.1, repeat: Infinity, repeatDelay: 0.8, ease: "easeInOut" }}
                  />
                  {badge.shape === "trophy" && (badge.rarity === "legendary" || badge.rarity === "rare" || badge.rarity === "uncommon") ? (
                    <TrophyIcon rarity={badge.rarity} />
                  ) : (
                    <span className="relative text-5xl">{badge.icon}</span>
                  )}
                </motion.div>
              </motion.div>
            )}

            {showReveal && (
              <motion.div
                key="reveal"
                initial={{ scale: 0.92, opacity: 0, y: 16 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0, y: 12 }}
                transition={{ type: "spring", stiffness: 220, damping: 20 }}
                className="relative text-center"
              >
                <motion.div
                  initial={{ y: -30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="mb-4"
                >
                  <span
                    className={`text-sm font-semibold uppercase tracking-widest ${rarityStyle.text}`}
                  >
                    {rarityStyle.label} Badge Earned!
                  </span>
                </motion.div>

                {badge.isProfileStyle ? (
                  /* ── Profile-page card style (task submissions) ──── */
                  <div className="flex justify-center mb-6 relative">
                    {isLegendary && (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                        className="absolute w-64 h-64 rounded-full border-2 border-dashed border-amber-400/20 pointer-events-none"
                        style={{ top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}
                      />
                    )}
                    <ProfileStyleBadgeCard badge={badge} rarityStyle={rarityStyle} />
                  </div>
                ) : (
                  /* ── Standard trophy/emoji card (checkpoint badges) */
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
                          : badge.rarity === "rare"
                            ? "0 0 40px rgba(203,213,225,0.4)"
                            : badge.rarity === "uncommon"
                              ? "0 0 40px rgba(205,127,50,0.4)"
                              : "0 0 30px rgba(99,102,241,0.3)",
                      }}
                      className={`relative w-32 h-32 mx-auto overflow-hidden rounded-2xl ${rarityStyle.bg} ${rarityStyle.border} border-2 flex items-center justify-center shadow-lg ${rarityStyle.glow}`}
                    >
                      <motion.span
                        className="absolute inset-y-0 -left-10 w-8 rotate-12 bg-white/30 blur-md"
                        animate={{ x: [0, 180] }}
                        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1.4, ease: "easeInOut" }}
                      />
                      {badge.shape === "trophy" && (badge.rarity === "legendary" || badge.rarity === "rare" || badge.rarity === "uncommon") ? (
                        <TrophyIcon rarity={badge.rarity} />
                      ) : (
                        <span className="relative text-5xl">{badge.icon}</span>
                      )}
                    </motion.div>
                  </motion.div>
                )}

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mb-2"
                >
                  <h3 className="text-2xl font-bold text-white">
                    {badge.name}
                  </h3>
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
