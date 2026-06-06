"use client";

import React from "react";
import { motion } from "framer-motion";
import { Lock, Check, ShieldAlert, Award, Star, Compass, Code, Flame, UserPlus, Calendar } from "lucide-react";
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

const normalizeSparkCopy = (text?: string) =>
  text
    ?.replace(/\bupvoted\b/g, "Sparked")
    .replace(/\bUpvoted\b/g, "Sparked")
    .replace(/\bupvotes\b/g, "Sparks")
    .replace(/\bUpvotes\b/g, "Sparks")
    .replace(/\bupvote\b/g, "Spark")
    .replace(/\bUpvote\b/g, "Spark");

interface BadgeCardProps {
  badge: BadgeItem;
  state: "locked" | "unlocked" | "equipped";
  isOwner?: boolean;
  onEquipToggle?: () => void;
  onClick?: () => void;
  className?: string;
  customScore?: number;
}

// Map database/legacy rarities to the 6 premium tiers
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
  prestigeBonus: number;
} {
  const r = rarity.toLowerCase();
  
  if (r === "common" || r === "bronze" || r === "uncommon" || r === "silver") {
    // 1. Common / Gray
    return {
      key: "common",
      label: "🛡️ Common",
      bgClass: "from-slate-800/15 via-slate-900/5 to-transparent",
      borderClass: "border-slate-800/80 group-hover:border-slate-600/70",
      textClass: "text-slate-400",
      pillClass: "text-slate-400 border-slate-500/20 bg-slate-500/10",
      glowClass: "shadow-[0_0_15px_-3px_rgba(148,163,184,0.15)] group-hover:shadow-[0_0_20px_-3px_rgba(148,163,184,0.3)]",
      accentColor: "#94A3B8",
      prestigeBonus: 10
    };
  }
  
  if (r === "rare" || r === "gold") {
    // 2. Rare / Blue
    return {
      key: "rare",
      label: "✨ Rare",
      bgClass: "from-blue-900/15 via-slate-950/5 to-transparent",
      borderClass: "border-blue-800/40 group-hover:border-blue-600/70",
      textClass: "text-blue-400",
      pillClass: "text-blue-400 border-blue-500/20 bg-blue-500/10",
      glowClass: "shadow-[0_0_20px_-3px_rgba(59,130,246,0.25)] group-hover:shadow-[0_0_25px_-3px_rgba(59,130,246,0.45)]",
      accentColor: "#3B82F6",
      prestigeBonus: 20
    };
  }
  
  if (r === "epic" || r === "diamond") {
    // 3. Epic / Purple
    return {
      key: "epic",
      label: "💎 Epic",
      bgClass: "from-purple-900/20 via-slate-950/5 to-transparent",
      borderClass: "border-purple-800/50 group-hover:border-purple-600/80",
      textClass: "text-purple-400",
      pillClass: "text-purple-400 border-purple-500/20 bg-purple-500/10",
      glowClass: "shadow-[0_0_25px_-3px_rgba(168,85,247,0.35)] group-hover:shadow-[0_0_30px_-3px_rgba(168,85,247,0.55)]",
      accentColor: "#A855F7",
      prestigeBonus: 35
    };
  }
  
  // 4. Legendary / Gold
  return {
    key: "legendary",
    label: "👑 Legendary",
    bgClass: "from-yellow-900/25 via-slate-950/5 to-transparent",
    borderClass: "border-yellow-600/60 group-hover:border-yellow-400/90",
    textClass: "text-yellow-400",
    pillClass: "text-yellow-400 border-yellow-500/30 bg-yellow-500/15",
    glowClass: "shadow-[0_0_30px_-5px_rgba(234,179,8,0.45)] group-hover:shadow-[0_0_35px_-5px_rgba(234,179,8,0.65)]",
    accentColor: "#EAB308",
    prestigeBonus: 50
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
  className,
  customScore
}) => {
  const isLocked = state === "locked";
  const isEquipped = state === "equipped";
  const norm = getNormalizedRarity(badge.rarity);
  const iconEmoji = badge.icon || getVentureBadgeEmoji(badge.id, badge.name);
  const isHiddenAchievement = badge.category === "hidden" || badge.rarity === "hidden";
  const shouldMaskHiddenDetails = isLocked && isHiddenAchievement;
  const displayDescription = normalizeSparkCopy(badge.description) || badge.description;
  const displayTagline = normalizeSparkCopy(badge.tagline) || badge.tagline;
  const displayRequirement = normalizeSparkCopy(badge.requirement) || badge.requirement;

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
    
    card.style.setProperty("--rx", `${rX}deg`);
    card.style.setProperty("--ry", `${rY}deg`);
    card.style.setProperty("--sz", "1.03");
    card.style.setProperty("--glare-x", `${(x / box.width) * 100}%`);
    card.style.setProperty("--glare-y", `${(y / box.height) * 100}%`);
    card.style.setProperty("--glare-opacity", "0.4");
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    card.style.setProperty("--rx", "0deg");
    card.style.setProperty("--ry", "0deg");
    card.style.setProperty("--sz", "1");
    card.style.setProperty("--glare-opacity", "0");
  };

  // Luxury high-end glassmorphism background style based on rarity and state
  const canOpenDetails = !isLocked && !!onClick;
  const bgStyle = isLocked
    ? "bg-slate-950/25 border-slate-900/60 opacity-40 grayscale cursor-default"
    : cn(
        "bg-gradient-to-br bg-slate-950/80 backdrop-blur-xl hover:-translate-y-1.5",
        canOpenDetails ? "cursor-pointer" : "cursor-default",
        norm.bgClass,
        norm.borderClass,
        norm.glowClass
      );

  const ringColor = badge.secondaryColor || norm.accentColor;
  const isMythic = norm.key === "mythic";
  const isLegendary = norm.key === "legendary";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      onClick={canOpenDetails ? onClick : undefined}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: "preserve-3d",
        perspective: 1200,
        transform: "perspective(1200px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) scale(var(--sz, 1))",
        transition: "transform 0.12s cubic-bezier(0.25, 0.8, 0.25, 1), border-color 0.5s, box-shadow 0.5s",
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
          className="absolute inset-0 pointer-events-none z-20 mix-blend-color-dodge transition-opacity duration-200"
          style={{
            background: "radial-gradient(circle at var(--glare-x, 50%) var(--glare-y, 50%), rgba(255, 255, 255, 0.12) 0%, transparent 60%)",
            opacity: "var(--glare-opacity, 0)",
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
        <div className="absolute top-3 right-3 z-10 grid h-7 w-7 place-items-center rounded-full border border-white/10 bg-slate-950/70 text-violet-300 shadow-[0_0_14px_rgba(139,92,246,0.12)] transition-colors duration-300 group-hover:border-violet-400/35 group-hover:bg-violet-500/12 group-hover:text-violet-200">
          {badge.category === "onboarding" && <Compass className="w-3.5 h-3.5" />}
          {badge.category === "community" && <UserPlus className="w-3.5 h-3.5" />}
          {badge.category === "consistency" && <Flame className="w-3.5 h-3.5" />}
          {badge.category === "skill" && <Code className="w-3.5 h-3.5" />}
          {badge.category === "idea_milestones" && <Award className="w-3.5 h-3.5" />}
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
            {shouldMaskHiddenDetails ? "???" : isLocked ? "Secret Achievement" : badge.name}
          </h4>
          <p className="text-[11px] text-slate-400 line-clamp-2 px-1 mt-1 leading-relaxed italic font-medium">
            {shouldMaskHiddenDetails ? "???" : isLocked ? (displayRequirement || "Locked achievement") : `"${displayTagline || displayDescription}"`}
          </p>
        </div>

        {/* 7. Bottom Date / Lock Info */}
        <div className="pt-4 flex flex-col items-center gap-2 mt-auto">
          {!isLocked && badge.awardedAt ? (
            <span className="text-[9px] text-slate-500/80 flex items-center gap-1 font-medium transition-colors group-hover:text-slate-400">
              <Calendar className="w-2.5 h-2.5" />
              {new Date(badge.awardedAt).toLocaleDateString(undefined, {
                month: "short",
                year: "numeric",
              })}
            </span>
          ) : (
            <span className="text-[9px] text-slate-600 flex items-center gap-1 font-medium">
              <Lock className="w-2.5 h-2.5" /> Requirement details on hover
            </span>
          )}
        </div>
      </div>

      {/* Dynamic Slide-up Details Hover Drawer */}
      <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out flex flex-col justify-between p-5 z-30 rounded-2xl text-left border border-white/10 shadow-2xl">
        <div className="space-y-3">
          <div>
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block mb-0.5">
              Badge Title
            </span>
            <span className="text-sm font-bold text-white leading-tight block">
              {shouldMaskHiddenDetails ? "???" : badge.name}
            </span>
          </div>

          <div>
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block mb-0.5">
              Unlock Requirement
            </span>
            <p className="text-xs font-semibold text-slate-300 leading-relaxed">
              {shouldMaskHiddenDetails ? "???" : displayRequirement || "Achieve specific milestones to unlock this badge."}
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-white/5 flex items-center justify-center text-[10px] font-medium">
          {badge.awardedAt ? (
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <Check className="w-3 h-3 stroke-[3]" /> Earned
            </span>
          ) : (
            <span className="text-slate-500 flex items-center gap-1">
              <Lock className="w-3 h-3" /> Locked
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};
