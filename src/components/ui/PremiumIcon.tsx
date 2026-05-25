"use client";

import React from "react";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";

export const EMOJI_TO_LUCIDE_NAME: Record<string, string> = {
  // Stages & General
  "💡": "Lightbulb",
  "🔬": "Microscope",
  "✅": "CheckCircle2",
  "🎨": "Palette",
  "⚙️": "Settings",
  "🚀": "Rocket",
  "🔄": "RefreshCw",
  "📈": "TrendingUp",
  
  // Badges & Categories
  "🕯️": "Flame",
  "👤": "UserCheck",
  "🛠️": "Wrench",
  "🥾": "Compass",
  "💬": "MessageSquareCode",
  "🌱": "Leaf",
  "✉️": "Handshake",
  "🚪": "KeyRound",
  "🎯": "Target",
  "🪙": "Coins",
  "🚩": "Flag",
  "🛣️": "Milestone",
  "❤️": "Heart",
  "👑": "Crown",
  "🎓": "GraduationCap",
  "✍️": "PenTool",
  "💼": "Briefcase",
  "🧠": "Brain",
  "🗺️": "Map",
  "✨": "Sparkles",
  "🔟": "Layers",
  "⚖️": "Scale",
  "🛡️": "Shield",
  "👂": "Ear",
  "📣": "Megaphone",
  "📝": "FileText",
  "🗣️": "MessageCircle",
  "🤝": "Handshake",
  "👥": "Users",
  "⚡": "Zap",
  "👣": "Footprints",
  "🏆": "Trophy",
  "💖": "Heart",
  "🧲": "Magnet",
  "🌉": "Layers",
  "📅": "Calendar",
  "🔥": "Flame",
  "🔗": "Link",
  "🌀": "Loader",
  "💎": "Gem",
  "⚓": "Anchor",
  "🏮": "Lightbulb",
  "⏳": "Hourglass",
  "⭐": "Star",
  "📐": "GitFork",
  "🌐": "Globe",
  "👻": "Ghost",
  "🌕": "Moon",
  "🩹": "HeartPulse",
  "👁️": "Eye",
  "📖": "BookOpen",
  "🏰": "Building",
  "📚": "Library",
  "✒️": "Pen",
  "🔤": "Type",
  "🏛️": "Library",

  // Academic / Lab / Creative specific emojis
  "📋": "FileText",
  "⚗️": "FlaskConical",
  "📜": "Scroll",
  "🔓": "LockOpen",
  "🌿": "Leaf",
  "☠️": "ShieldAlert",
  "📊": "BarChart3",
  "🌡️": "Thermometer",
  "📉": "TrendingDown",
  "🧪": "FlaskConical",
  "🔭": "Telescope",
  "🎵": "Music",
  "🖌️": "Brush",
  "🌟": "Star",
  "💫": "Sparkles",
  "🧩": "Puzzle",
  "⚔️": "Swords",
  "🥇": "Trophy",
  "🥈": "Medal",
  "🥉": "Award",
  "🏅": "Medal",
};

interface PremiumIconProps {
  name: string;
  className?: string;
  strokeWidth?: number;
  fallback?: React.ReactNode;
}

export const PremiumIcon: React.FC<PremiumIconProps> = ({
  name,
  className,
  strokeWidth = 1.5,
  fallback = null,
}) => {
  if (!name) return fallback;

  // 1. Resolve from emoji mapping if it's an emoji
  const resolvedName = EMOJI_TO_LUCIDE_NAME[name] || name;

  // 2. Normalize casing to match Lucide export (e.g. "lightbulb" -> "Lightbulb")
  const keys = Object.keys(LucideIcons);
  const matchedKey = keys.find(
    (key) => key.toLowerCase() === resolvedName.toLowerCase()
  );

  if (matchedKey) {
    const IconComponent = LucideIcons[matchedKey as keyof typeof LucideIcons] as React.ComponentType<{
      className?: string;
      strokeWidth?: number;
      fill?: string;
      fillOpacity?: number;
    }>;
    return (
      <IconComponent
        className={cn(className, "transition-all duration-300 drop-shadow-[0_2px_8px_rgba(255,255,255,0.07)]")}
        strokeWidth={strokeWidth}
        fill="currentColor"
        fillOpacity={0.2}
      />
    );
  }

  // 3. Check if the string has any emoji character as a fallback
  const isEmoji = /\p{Emoji}/u.test(name);
  if (isEmoji) {
    return <span className={className}>{name}</span>;
  }

  // 4. Default fallback (e.g. HelpCircle)
  const DefaultIcon = LucideIcons.HelpCircle;
  return (
    <DefaultIcon
      className={cn(className, "transition-all duration-300")}
      strokeWidth={strokeWidth}
      fill="currentColor"
      fillOpacity={0.2}
    />
  );
};
