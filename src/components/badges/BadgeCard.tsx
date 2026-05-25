"use client";

import React from "react";
import { motion } from "framer-motion";
import { Lock, Check, ShieldAlert, Award, Star, Compass, Code, Flame, Users, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { PremiumIcon } from "@/components/ui/PremiumIcon";

export type BadgeRarity = "common" | "uncommon" | "rare" | "epic" | "legendary" | "hidden" | "bronze" | "silver" | "gold" | "diamond" | "mythic";

export interface BadgeItem {
  id: string; // e.g. "venture_1" or "general_chatterbox"
  name: string;
  description: string;
  category: string;
  rarity: BadgeRarity;
  shape?: string;
  primaryColor?: string;
  secondaryColor?: string;
  tagline?: string;
  requirement?: string;
  awardedAt?: number;
  icon?: string;
}

interface BadgeCardProps {
  badge: BadgeItem;
  state: "locked" | "unlocked" | "equipped";
  isOwner?: boolean;
  onEquipToggle?: () => void;
  onClick?: () => void;
  className?: string;
}

// Map database/legacy rarities to the 6 premium tiers
export function getNormalizedRarity(rarity: BadgeRarity): {
  key: string;
  label: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  pillClass: string;
  glowClass: string;
  accentColor: string;
} {
  const r = rarity.toLowerCase();
  
  if (r === "common" || r === "bronze") {
    return {
      key: "bronze",
      label: "🥉 Bronze",
      bgClass: "from-amber-900/20 via-amber-800/5 to-transparent",
      borderClass: "border-amber-700/40 group-hover:border-amber-600/70",
      textClass: "text-amber-500",
      pillClass: "text-amber-400 border-amber-500/20 bg-amber-500/10",
      glowClass: "shadow-[0_0_15px_-3px_rgba(217,119,6,0.15)] group-hover:shadow-[0_0_20px_-3px_rgba(217,119,6,0.3)]",
      accentColor: "#D97706"
    };
  }
  if (r === "uncommon" || r === "silver") {
    return {
      key: "silver",
      label: "🥈 Silver",
      bgClass: "from-slate-500/15 via-slate-600/5 to-transparent",
      borderClass: "border-slate-500/40 group-hover:border-slate-400/70",
      textClass: "text-slate-300",
      pillClass: "text-slate-300 border-slate-500/20 bg-slate-500/10",
      glowClass: "shadow-[0_0_15px_-3px_rgba(148,163,184,0.15)] group-hover:shadow-[0_0_20px_-3px_rgba(148,163,184,0.3)]",
      accentColor: "#94A3B8"
    };
  }
  if (r === "rare" || r === "gold") {
    return {
      key: "gold",
      label: "🥇 Gold",
      bgClass: "from-yellow-600/20 via-amber-500/5 to-transparent",
      borderClass: "border-yellow-500/50 group-hover:border-yellow-400/80",
      textClass: "text-yellow-400",
      pillClass: "text-yellow-400 border-yellow-500/20 bg-yellow-500/10",
      glowClass: "shadow-[0_0_20px_-3px_rgba(234,179,8,0.25)] group-hover:shadow-[0_0_25px_-3px_rgba(234,179,8,0.45)]",
      accentColor: "#EAB308"
    };
  }
  if (r === "epic" || r === "diamond") {
    return {
      key: "diamond",
      label: "💎 Diamond",
      bgClass: "from-cyan-500/20 via-blue-600/5 to-transparent",
      borderClass: "border-cyan-500/60 group-hover:border-cyan-400/90",
      textClass: "text-cyan-400",
      pillClass: "text-cyan-400 border-cyan-500/20 bg-cyan-500/10",
      glowClass: "shadow-[0_0_25px_-3px_rgba(6,182,212,0.35)] group-hover:shadow-[0_0_30px_-3px_rgba(6,182,212,0.55)]",
      accentColor: "#06B6D4"
    };
  }
  if (r === "legendary" || r === "hidden") {
    return {
      key: "legendary",
      label: "👑 Legendary",
      bgClass: "from-purple-600/25 via-fuchsia-700/5 to-transparent",
      borderClass: "border-purple-500/60 group-hover:border-purple-400/90",
      textClass: "text-purple-400",
      pillClass: "text-purple-400 border-purple-500/30 bg-purple-500/15",
      glowClass: "shadow-[0_0_30px_-5px_rgba(168,85,247,0.45)] group-hover:shadow-[0_0_35px_-5px_rgba(168,85,247,0.65)]",
      accentColor: "#A855F7"
    };
  }
  
  // Default to Mythic / Founder
  return {
    key: "mythic",
    label: "🔥 Mythic",
    bgClass: "from-rose-500/30 via-indigo-950/20 to-transparent",
    borderClass: "border-rose-500/70 group-hover:border-rose-400/90",
    textClass: "text-rose-400 font-extrabold",
    pillClass: "text-rose-400 border-rose-500/30 bg-rose-500/15",
    glowClass: "shadow-[0_0_35px_-5px_rgba(244,63,94,0.55)] group-hover:shadow-[0_0_40px_-5px_rgba(244,63,94,0.85)]",
    accentColor: "#F43F5E"
  };
}

export function getVentureBadgeEmoji(id: string | number, name: string): string {
  // Try to parse ID from e.g. "venture_12" or "12"
  const idStr = id.toString();
  const badgeId = parseInt(idStr.replace(/^\D+/g, ""), 10);
  
  const isLevelOrStageBadge = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 71, 72, 73, 74, 75, 76, 77, 78].includes(badgeId);
  if (isLevelOrStageBadge) {
    const n = name.toLowerCase();
    if (n.includes("gold") || n.includes("gilded")) return "🥇";
    if (n.includes("silver")) return "🥈";
    if (n.includes("bronze")) return "🥉";
  }

  if (badgeId === 1) return "🕯️";
  if (badgeId === 2) return "👤";
  if (badgeId === 3) return "🛠️";
  if (badgeId === 4) return "🥾";
  if (badgeId === 5) return "💬";
  if (badgeId === 6) return "🌱";
  if (badgeId === 7) return "✉️";
  if (badgeId === 8) return "🚪";
  if (badgeId === 9) return "🎯";
  if (badgeId === 10) return "🪙";
  if (badgeId === 11) return "🚩";
  if (badgeId === 12) return "🛣️";
  if (badgeId === 13) return "❤️";
  if (badgeId === 14) return "🚀";
  if (badgeId === 15) return "🔄";
  if (badgeId === 16) return "👑";
  if (badgeId === 17) return "🎓";
  if (badgeId === 18) return "🔬";
  if (badgeId === 19) return "✍️";
  if (badgeId === 20) return "💼";
  if (badgeId === 21) return "🧠";
  if (badgeId === 22) return "🗺️";
  if (badgeId === 23) return "✨";
  if (badgeId === 24) return "🔟";
  if (badgeId === 25) return "⚖️";
  if (badgeId === 26) return "🛡️";
  if (badgeId === 27) return "👂";
  if (badgeId === 28) return "📣";
  if (badgeId === 29) return "📝";
  if (badgeId === 30) return "🗣️";
  if (badgeId === 31) return "🤝";
  if (badgeId === 32) return "👥";
  if (badgeId === 33) return "⚡";
  if (badgeId === 34) return "👣";
  if (badgeId === 35) return "🏆";
  if (badgeId === 36) return "💖";
  if (badgeId === 37) return "🧲";
  if (badgeId === 38) return "🌉";
  if (badgeId === 39) return "📅";
  if (badgeId === 40) return "🔥";
  if (badgeId === 41) return "🔗";
  if (badgeId === 42) return "🌀";
  if (badgeId === 43) return "🏆";
  if (badgeId === 44) return "📈";
  if (badgeId === 45) return "💎";
  if (badgeId === 46) return "⚓";
  if (badgeId === 47) return "🏮";
  if (badgeId === 48) return "⏳";
  if (badgeId === 49) return "⭐";
  if (badgeId === 50) return "📐";
  if (badgeId === 51) return "🌐";
  if (badgeId === 52) return "👻";
  if (badgeId === 53) return "🌕";
  if (badgeId === 54) return "🩹";
  if (badgeId === 55) return "👁️";
  if (badgeId === 56) return "📖";
  if (badgeId === 57) return "🏰";
  if (badgeId === 58) return "📚";
  if (badgeId === 59) return "⚙️";
  if (badgeId === 60) return "✒️";
  if (badgeId === 61) return "🔤";
  if (badgeId === 62) return "🏛️";

  if (badgeId === 71) return "💡";
  if (badgeId === 72) return "🔬";
  if (badgeId === 73) return "✅";
  if (badgeId === 74) return "🎨";
  if (badgeId === 75) return "⚙️";
  if (badgeId === 76) return "🚀";
  if (badgeId === 77) return "🔄";
  if (badgeId === 78) return "👑";

  const n = name.toLowerCase();
  if (n.includes("gold") || n.includes("gilded")) return "🥇";
  if (n.includes("silver")) return "🥈";
  if (n.includes("bronze")) return "🥉";
  if (n.includes("diamond")) return "💎";
  if (n.includes("founder")) return "👑";
  if (n.includes("expert") || n.includes("expert")) return "⚡";
  if (n.includes("checkpoint") || n.includes("point")) return "📍";
  if (n.includes("stage") || n.includes("road")) return "🗺️";
  if (n.includes("comment") || n.includes("word") || n.includes("listener")) return "💬";
  if (n.includes("idea") || n.includes("seed") || n.includes("light")) return "💡";
  if (n.includes("collaborat") || n.includes("ally") || n.includes("friend")) return "👥";
  if (n.includes("boss") || n.includes("slayer") || n.includes("combat")) return "⚔️";
  if (n.includes("streak") || n.includes("daily") || n.includes("burn")) return "🔥";

  return "🏅";
}

export const BadgeCard: React.FC<BadgeCardProps> = ({
  badge,
  state,
  isOwner = false,
  onEquipToggle,
  onClick,
  className
}) => {
  const isLocked = state === "locked";
  const isEquipped = state === "equipped";
  const norm = getNormalizedRarity(badge.rarity);
  const iconEmoji = badge.icon || getVentureBadgeEmoji(badge.id, badge.name);

  const [rotateX, setRotateX] = React.useState(0);
  const [rotateY, setRotateY] = React.useState(0);
  const [glareX, setGlareX] = React.useState(50);
  const [glareY, setGlareY] = React.useState(50);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isLocked) return;
    const card = e.currentTarget;
    const box = card.getBoundingClientRect();
    const x = e.clientX - box.left;
    const y = e.clientY - box.top;
    const halfWidth = box.width / 2;
    const halfHeight = box.height / 2;
    
    // Smooth 3D tilt calculation
    const rX = -(y - halfHeight) / 8;
    const rY = (x - halfWidth) / 8;
    
    setRotateX(rX);
    setRotateY(rY);
    setGlareX((x / box.width) * 100);
    setGlareY((y / box.height) * 100);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setGlareX(50);
    setGlareY(50);
  };

  // Luxury high-end glassmorphism background style based on rarity and state
  const bgStyle = isLocked
    ? "bg-slate-950/25 border-slate-900/60 opacity-40 grayscale cursor-not-allowed"
    : cn(
        "bg-gradient-to-br bg-slate-950/80 backdrop-blur-xl cursor-pointer hover:-translate-y-1.5",
        norm.bgClass,
        norm.borderClass,
        norm.glowClass
      );

  const ringColor = badge.secondaryColor || norm.accentColor;
  const isMythic = norm.key === "mythic";
  const isLegendary = norm.key === "legendary";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{
        opacity: 1,
        rotateX,
        rotateY,
        scale: rotateX !== 0 ? 1.03 : 1,
      }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      onClick={isLocked ? undefined : onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: "preserve-3d",
        perspective: 1200,
      }}
      className={cn(
        "group relative flex flex-col items-center justify-between text-center p-6 rounded-2xl border transition-all duration-500 h-full w-full overflow-hidden select-none",
        bgStyle,
        isEquipped && "border-yellow-400/80 shadow-[0_0_30px_rgba(250,204,21,0.3)] ring-1 ring-yellow-400/50",
        className
      )}
    >
      {/* 3D Reflection Glare Overlay */}
      {!isLocked && (
        <div
          className="absolute inset-0 pointer-events-none z-20 mix-blend-color-dodge transition-opacity duration-300 opacity-0 group-hover:opacity-40"
          style={{
            background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.12) 0%, transparent 60%)`,
          }}
        />
      )}

      {/* Ambient Volumetric Rarity Glow Backdrop */}
      {!isLocked && (
        <div
          className="absolute w-40 h-40 rounded-full blur-3xl opacity-20 group-hover:opacity-35 transition-all duration-700 pointer-events-none -z-10 animate-pulse"
          style={{
            background: `radial-gradient(circle, ${ringColor} 0%, transparent 75%)`,
            top: "5%",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        />
      )}

      {/* Corner Filigree Brackets for luxury physical card look */}
      {!isLocked && (
        <>
          <div className="absolute top-2.5 left-2.5 w-2 h-2 border-t border-l border-white/10 rounded-tl-sm transition-all duration-500 group-hover:border-white/30" />
          <div className="absolute top-2.5 right-2.5 w-2 h-2 border-t border-r border-white/10 rounded-tr-sm transition-all duration-500 group-hover:border-white/30" />
          <div className="absolute bottom-2.5 left-2.5 w-2 h-2 border-b border-l border-white/10 rounded-bl-sm transition-all duration-500 group-hover:border-white/30" />
          <div className="absolute bottom-2.5 right-2.5 w-2 h-2 border-b border-r border-white/10 rounded-br-sm transition-all duration-500 group-hover:border-white/30" />
        </>
      )}

      {/* 1. Mythic / Founder Cosmic Space Particle Effect */}
      {!isLocked && isMythic && (
        <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(244,63,94,0.15)_0%,_rgba(0,0,0,0)_70%)] animate-pulse" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-10 bg-[conic-gradient(from_0deg,_transparent_0%,_rgba(244,63,94,0.1)_25%,_transparent_50%,_rgba(99,102,241,0.1)_75%,_transparent_100%)] rounded-full blur-lg"
          />
        </div>
      )}

      {/* 2. Shiny Sheen Sweeper Overlay for Gold, Diamond, Legendary, Mythic */}
      {!isLocked && ["gold", "diamond", "legendary", "mythic"].includes(norm.key) && (
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
          <motion.div
            animate={{ x: ["-150%", "250%"] }}
            transition={{
              repeat: Infinity,
              duration: norm.key === "mythic" ? 3 : 5,
              repeatDelay: norm.key === "mythic" ? 2 : 4,
              ease: "easeInOut",
            }}
            className="absolute top-0 bottom-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-12"
          />
        </div>
      )}

      {/* 3. Floating Lock / Equipped badge indicators */}
      {isLocked && (
        <div className="absolute top-3 right-3 bg-slate-950/80 border border-white/10 p-1.5 rounded-full z-20">
          <Lock className="w-3.5 h-3.5 text-slate-400" />
        </div>
      )}

      {isEquipped && (
        <div className="absolute top-3 left-3 bg-yellow-500 text-slate-950 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest shadow-md flex items-center gap-0.5 z-20 border border-yellow-400/40">
          <Check className="w-2.5 h-2.5 stroke-[3]" />
          Equipped
        </div>
      )}

      {/* 4. Category Indicator Icon floating top-right (unlocked) */}
      {!isLocked && (
        <div className="absolute top-3 right-3 opacity-30 group-hover:opacity-75 transition-opacity duration-300 z-10 text-white">
          {badge.category === "onboarding" && <Compass className="w-4 h-4" />}
          {badge.category === "community" && <Users className="w-4 h-4" />}
          {badge.category === "consistency" && <Flame className="w-4 h-4" />}
          {badge.category === "skill" && <Code className="w-4 h-4" />}
          {badge.category === "idea_milestones" && <Award className="w-4 h-4" />}
        </div>
      )}

      {/* 5. Badge Icon Canvas */}
      <div className="relative w-24 h-24 flex items-center justify-center mb-5 shrink-0 z-10">
        {/* Outer Rotating Halo for Legendary and Mythic */}
        {!isLocked && (isLegendary || isMythic) && (
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
            className={cn(
              "absolute inset-0 rounded-2xl border border-dashed opacity-35 group-hover:opacity-60 transition-opacity duration-500",
              isMythic ? "border-rose-400/60" : "border-purple-400/60"
            )}
          />
        )}

        {/* Diamond Ring Background (mirrors profile design but upgraded to glowing glass) */}
        <motion.div
          animate={isLocked ? {} : { rotate: 45 }}
          className={cn(
            "absolute inset-2 rounded-2xl border transition-all duration-500 backdrop-blur-sm shadow-[0_0_15px_rgba(255,255,255,0.02)]",
            isLocked ? "border-slate-800 bg-slate-900/60" : "group-hover:rotate-90 group-hover:scale-105"
          )}
          style={{
            backgroundColor: isLocked ? undefined : badge.primaryColor ? `${badge.primaryColor}1a` : `${ringColor}1a`,
            borderColor: isLocked ? undefined : `${ringColor}40`,
          }}
        />

        {/* Inner Canvas Circle */}
        <div
          className={cn(
            "relative w-16 h-16 flex items-center justify-center rounded-full z-10 transition-all duration-500 shadow-lg",
            isLocked
              ? "bg-slate-950/40 border-slate-900 text-slate-600"
              : "bg-slate-950/80 border border-white/10 shadow-inner group-hover:scale-110 group-hover:border-white/20 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]"
          )}
          style={{ color: isLocked ? undefined : ringColor }}
        >
          <span
            className={cn(
              "select-none filter drop-shadow-md flex items-center justify-center transition-all duration-500",
              !isLocked && "group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]"
            )}
            style={{ fontSize: "2.1rem" }}
          >
            {isLocked ? "❓" : <PremiumIcon name={iconEmoji} className="w-9 h-9" strokeWidth={1.5} />}
          </span>
        </div>
      </div>

      {/* 6. Details details */}
      <div className="space-y-1.5 flex-1 flex flex-col justify-between w-full z-10">
        <div>
          <h4
            className={cn(
              "font-extrabold text-base tracking-tight leading-tight transition-colors line-clamp-1 drop-shadow-sm",
              isLocked ? "text-slate-500" : "text-white"
            )}
          >
            {isLocked ? "Secret Achievement" : badge.name}
          </h4>
          <p className="text-[11px] text-slate-400 line-clamp-2 px-1 mt-1 leading-relaxed italic font-medium">
            {isLocked ? (badge.requirement || "Locked achievement") : `"${badge.tagline || badge.description}"`}
          </p>
        </div>

        {/* 7. Bottom Rarity Pill + Date / Lock Info */}
        <div className="pt-4 flex flex-col items-center gap-2 mt-auto">
          <Badge
            variant="outline"
            className={cn(
              "text-[9px] font-black tracking-widest uppercase rounded-full px-3.5 py-0.5 h-5 border border-solid shrink-0 shadow-sm transition-all duration-300",
              isLocked ? "text-slate-500 bg-slate-900/30 border-slate-800" : norm.pillClass
            )}
          >
            {isLocked ? "LOCKED" : norm.label}
          </Badge>

          {!isLocked && badge.awardedAt && (
            <span className="text-[9px] text-slate-500/80 flex items-center gap-1 font-medium transition-colors group-hover:text-slate-400">
              <Calendar className="w-2.5 h-2.5" />
              {new Date(badge.awardedAt).toLocaleDateString(undefined, {
                month: "short",
                year: "numeric",
              })}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};
