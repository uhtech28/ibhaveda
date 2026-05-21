"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Lock, Award, Trophy, Compass, Code, Info, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { BadgeAwardSequence } from "@/components/animations/BadgeAwardSequence";
import { cn } from "@/lib/utils";

interface ProfileBadgesProps {
  userId: Id<"users">;
  isOwner: boolean;
}

interface DisplayBadge {
  id: string;
  name: string;
  description: string;
  category: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary" | "hidden";
  shape: string;
  primaryColor: string;
  secondaryColor: string;
  tagline: string;
  requirement: string;
  awardedAt?: number;
  earned: boolean;
  type: "general" | "venture" | "skill";
  icon: string;
}

const GENERAL_BADGES_DEFS = [
  { slug: "first-idea", name: "First Spark", description: "Created your first idea", icon: "💡", category: "onboarding", requirement: "Create your first idea" },
  { slug: "idea-machine", name: "Idea Machine", description: "Created 5 ideas", icon: "⚡", category: "onboarding", requirement: "Create 5 ideas" },
  { slug: "trendsetter", name: "Trendsetter", description: "Received 10 sparks on a single idea", icon: "🔥", category: "milestones", requirement: "Receive 10 sparks on a single idea" },
  { slug: "collaborator", name: "Collaborator", description: "Accepted a contribution request", icon: "👥", category: "milestones", requirement: "Accept a contribution request" },
  { slug: "chatterbox", name: "Chatterbox", description: "Left 5 comments on ideas", icon: "💬", category: "onboarding", requirement: "Leave 5 comments on ideas" },
  { slug: "legendary-venture-completion", name: "Legendary Completion", description: "Completed a venture with every stage ending in gold", icon: "👑", category: "aspirational", requirement: "Complete a venture with all gold checkpoints" },
];

export function getVentureBadgeEmoji(badgeId: number, name: string): string {
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
  if (badgeId === 27) return "👂";
  if (badgeId === 28) return "📣";
  if (badgeId === 29) return "📝";
  if (badgeId === 30) return "🗣️";
  if (badgeId === 31) return "🤝";
  if (badgeId === 32) return "👥";

  const n = name.toLowerCase();
  if (n.includes("gold") || n.includes("gilded")) return "🏆";
  if (n.includes("silver")) return "🥈";
  if (n.includes("bronze") || n.includes("branze")) return "🥉";
  if (n.includes("checkpoint") || n.includes("point")) return "📍";
  if (n.includes("stage") || n.includes("road")) return "🗺️";
  if (n.includes("comment") || n.includes("word") || n.includes("listen")) return "💬";
  if (n.includes("idea") || n.includes("seed") || n.includes("light")) return "💡";
  if (n.includes("collaborat") || n.includes("ally") || n.includes("friend")) return "👥";
  if (n.includes("boss") || n.includes("slayer") || n.includes("combat")) return "⚔️";
  if (n.includes("streak") || n.includes("daily") || n.includes("burn")) return "🔥";

  return "🏅";
}

const RARITY_GRADIENTS = {
  common: "from-slate-500/10 via-slate-600/5 to-transparent border-slate-700/50 shadow-slate-950/20",
  uncommon: "from-green-500/10 via-green-600/5 to-transparent border-green-700/40 shadow-green-950/25 glow-green",
  rare: "from-blue-500/15 via-blue-600/5 to-transparent border-blue-600/50 shadow-blue-950/30 glow-blue",
  epic: "from-purple-500/20 via-purple-600/5 to-transparent border-purple-500/60 shadow-purple-950/40 glow-purple animate-pulse-slow",
  legendary: "from-amber-500/25 via-yellow-600/10 to-transparent border-amber-400/80 shadow-amber-950/50 glow-gold animate-glow-pulse",
  hidden: "from-slate-800/10 via-slate-900/5 to-transparent border-slate-800 shadow-slate-950/20",
};

const RARITY_TEXTS = {
  common: "text-slate-400 border-slate-500/20 bg-slate-500/10",
  uncommon: "text-green-400 border-green-500/20 bg-green-500/10",
  rare: "text-blue-400 border-blue-500/20 bg-blue-500/10",
  epic: "text-purple-400 border-purple-500/20 bg-purple-500/10",
  legendary: "text-amber-400 border-amber-500/20 bg-amber-500/10",
  hidden: "text-slate-500 border-slate-700/20 bg-slate-800/20",
};

export const ProfileBadges: React.FC<ProfileBadgesProps> = ({ userId, isOwner }) => {
  const [activeTab, setActiveTab] = useState<"all" | "general" | "venture" | "skill" | "locked">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [badgeQueue, setBadgeQueue] = useState<any[]>([]);

  // Trigger recalculation on mount for the profile owner
  const recalculateBadges = useMutation(api.badges.recalculateUserBadges);
  useEffect(() => {
    if (isOwner) {
      recalculateBadges({ userId }).catch(console.error);
    }
  }, [userId, isOwner, recalculateBadges]);

  // Fetch earned badges (unified query)
  const earnedBadges = useQuery(api.badges.getUserProfileBadges, { userId });
  // Fetch venture badge progression (to show locked ones)
  const ventureBadgeProgress = useQuery(api.badges.getVentureBadgeProgress, { userId });

  // Keep track of badge count for live award animation
  const prevBadgeCountRef = useRef<number | null>(null);

  useEffect(() => {
    if (!earnedBadges) return;
    const count = earnedBadges.length;

    if (prevBadgeCountRef.current !== null && count > prevBadgeCountRef.current) {
      // Find the new badges that weren't in the list previously
      const newCount = count - prevBadgeCountRef.current;
      const newBadges = earnedBadges.slice(0, newCount);
      
      const payloads = newBadges.map((b) => {
        let emoji = "🏅";
        if (b.type === "general") {
          const matched = GENERAL_BADGES_DEFS.find((g) => g.slug === b.category);
          emoji = matched?.icon || "💡";
        } else if (b.type === "venture") {
          // extract badge number ID from query ID (e.g. venture_ID)
          const matchedVenture = ventureBadgeProgress?.find((vp) => vp.name === b.name);
          emoji = matchedVenture ? getVentureBadgeEmoji(matchedVenture.id, b.name) : "🏅";
        } else if (b.type === "skill") {
          emoji = "⭐";
        }
        
        return {
          id: b.id,
          name: b.name,
          description: b.description,
          icon: emoji,
          rarity: b.rarity === "hidden" ? "common" : b.rarity,
        };
      });

      console.log("[ProfileBadges] 🎖️ Live badge award triggered in Profile Page!", payloads);
      setBadgeQueue((q) => [...q, ...payloads]);
    }

    prevBadgeCountRef.current = count;
  }, [earnedBadges, ventureBadgeProgress]);

  if (!earnedBadges || !ventureBadgeProgress) {
    return (
      <div className="mt-8 flex justify-center py-12">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  // 1. Build list of ALL badges (both earned and locked)
  const allBadgesList: DisplayBadge[] = [];

  // Add General/Creator Badges
  GENERAL_BADGES_DEFS.forEach((g) => {
    const earnedInstance = earnedBadges.find(
      (eb) => eb.type === "general" && eb.name.toLowerCase() === g.name.toLowerCase()
    );

    allBadgesList.push({
      id: `general_${g.slug}`,
      name: g.name,
      description: g.description,
      category: "creator",
      rarity: "common",
      shape: "shield",
      primaryColor: "#E0F2FE",
      secondaryColor: "#0369A1",
      tagline: g.description,
      requirement: g.requirement,
      awardedAt: earnedInstance?.awardedAt,
      earned: !!earnedInstance,
      type: "general",
      icon: g.icon,
    });
  });

  // Add Venture Badges
  ventureBadgeProgress.forEach((vp) => {
    allBadgesList.push({
      id: `venture_${vp.id}`,
      name: vp.name,
      description: vp.tagline,
      category: "venture",
      rarity: vp.rarity as any,
      shape: vp.shape,
      primaryColor: vp.primaryColor,
      secondaryColor: vp.secondaryColor,
      tagline: vp.tagline,
      requirement: vp.requirement,
      awardedAt: vp.awardedAt,
      earned: vp.earned,
      type: "venture",
      icon: vp.icon || getVentureBadgeEmoji(vp.id, vp.name),
    });
  });

  // Add Skill Badges (earned only)
  earnedBadges
    .filter((b) => b.type === "skill")
    .forEach((s) => {
      allBadgesList.push({
        id: s.id,
        name: s.name,
        description: s.description,
        category: "skill",
        rarity: s.rarity as any,
        shape: s.shape,
        primaryColor: s.primaryColor,
        secondaryColor: s.secondaryColor,
        tagline: s.tagline,
        requirement: s.requirement,
        awardedAt: s.awardedAt,
        earned: true,
        type: "skill",
        icon: "⭐",
      });
    });

  // Filter based on Tab
  const tabFiltered = allBadgesList.filter((b) => {
    if (activeTab === "all") return true;
    if (activeTab === "locked") return !b.earned;
    if (activeTab === "general") return b.type === "general" && b.earned;
    if (activeTab === "venture") return b.type === "venture" && b.earned;
    if (activeTab === "skill") return b.type === "skill" && b.earned;
    return true;
  });

  // Filter based on Search Query
  const filteredBadges = tabFiltered.filter(
    (b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.requirement.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalEarnedCount = allBadgesList.filter((b) => b.earned).length;
  const totalPossibleCount = allBadgesList.filter((b) => b.type !== "skill").length; // Skills are dynamic

  const activeBadge = badgeQueue[0] || null;

  return (
    <Card className="mt-8 shadow-md border-border/40 bg-card/45 backdrop-blur-md overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none"></div>
      
      {/* Real-time Badge Award Sequence */}
      <BadgeAwardSequence
        isVisible={!!activeBadge}
        badge={activeBadge}
        onComplete={() => setBadgeQueue((q) => q.slice(1))}
        onSkip={() => setBadgeQueue((q) => q.slice(1))}
      />

      <CardHeader className="relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Badges & Achievements
            </CardTitle>
            <CardDescription className="text-sm">
              Track your development landmarks, milestones, and tech stack proficiencies.
            </CardDescription>
          </div>
          
          {/* Progress Tracker */}
          <div className="bg-muted/30 border border-border/30 rounded-xl px-4 py-2 flex items-center gap-3 self-start md:self-auto">
            <Award className="w-5 h-5 text-primary animate-pulse" />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Unlocked</span>
              <span className="text-lg font-extrabold text-foreground">
                {totalEarnedCount} <span className="text-xs font-medium text-muted-foreground">/ {totalPossibleCount}</span>
              </span>
            </div>
            {/* Tiny circular progress indicator */}
            <div className="relative w-8 h-8 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="16" cy="16" r="12" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                <circle
                  cx="16"
                  cy="16"
                  r="12"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-primary"
                  strokeDasharray={2 * Math.PI * 12}
                  strokeDashoffset={2 * Math.PI * 12 * (1 - totalEarnedCount / totalPossibleCount)}
                />
              </svg>
              <span className="absolute text-[8px] font-bold">
                {Math.round((totalEarnedCount / totalPossibleCount) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-0 space-y-6">
        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search badges by name, requirement..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background/50 border-border/50"
            />
          </div>
          
          {/* Tab Filter Pills */}
          <div className="flex flex-wrap gap-1 bg-muted/40 p-1 rounded-xl border border-border/20 self-start sm:self-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab("all")}
              className={cn(
                "h-8 rounded-lg text-xs font-semibold transition-all px-3",
                activeTab === "all" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab("general")}
              className={cn(
                "h-8 rounded-lg text-xs font-semibold transition-all px-3",
                activeTab === "general" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Onboarding
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab("venture")}
              className={cn(
                "h-8 rounded-lg text-xs font-semibold transition-all px-3",
                activeTab === "venture" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Milestones
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab("skill")}
              className={cn(
                "h-8 rounded-lg text-xs font-semibold transition-all px-3",
                activeTab === "skill" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Skills
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab("locked")}
              className={cn(
                "h-8 rounded-lg text-xs font-semibold transition-all px-3",
                activeTab === "locked" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Locked ({allBadgesList.filter(b => !b.earned).length})
            </Button>
          </div>
        </div>

        {/* Badge Grid with Framer Motion Stagger */}
        <motion.div
          layout
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredBadges.map((badge, idx) => (
              <motion.div
                key={badge.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.25, delay: Math.min(idx * 0.03, 0.3) }}
                className="group"
              >
                {/* Badge Card Wrapper */}
                <div
                  className={cn(
                    "h-full relative overflow-hidden rounded-2xl border bg-background/30 backdrop-blur-sm p-4 flex flex-col items-center text-center justify-between transition-all duration-300",
                    badge.earned
                      ? "hover:-translate-y-1.5 hover:shadow-lg"
                      : "opacity-40 grayscale hover:opacity-60",
                    badge.earned && RARITY_GRADIENTS[badge.rarity]
                  )}
                >
                  {/* Floating lock icon for locked items */}
                  {!badge.earned && (
                    <div className="absolute top-2 right-2 bg-slate-900/80 border border-slate-700/50 p-1 rounded-full">
                      <Lock className="w-3 h-3 text-slate-400" />
                    </div>
                  )}

                  {/* Shiny background particles glow (Legendaries/Epics) */}
                  {badge.earned && (badge.rarity === "legendary" || badge.rarity === "epic") && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shine pointer-events-none"></div>
                  )}

                  {/* Badge Icon Canvas */}
                  <div className="relative w-16 h-16 flex items-center justify-center mb-3">
                    {/* Badge Rarity Background Ring */}
                    <div
                      className={cn(
                        "absolute inset-0 rounded-2xl border opacity-20 transform rotate-45 transition-transform duration-500 group-hover:rotate-90",
                        badge.earned ? "border-foreground" : "border-slate-500"
                      )}
                      style={{
                        backgroundColor: badge.earned ? badge.primaryColor : "#334155",
                        borderColor: badge.earned ? badge.secondaryColor : "#475569",
                      }}
                    ></div>
                    
                    {/* Inner Shape */}
                    <div
                      className={cn(
                        "w-12 h-12 flex items-center justify-center z-10 transition-transform duration-300 group-hover:scale-110",
                        badge.shape === "shield" ? "clip-path-shield bg-zinc-900/60 border border-white/5 shadow-inner" : "rounded-full bg-zinc-900/40 border border-white/5"
                      )}
                      style={{
                        color: badge.earned ? badge.secondaryColor : "#64748B",
                      }}
                    >
                      <span className="text-3xl filter drop-shadow-sm select-none">{badge.icon}</span>
                    </div>
                  </div>

                  {/* Text details */}
                  <div className="space-y-1 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {badge.name}
                      </h4>
                      <p className="text-[10px] text-muted-foreground line-clamp-2 px-1">
                        {badge.earned ? badge.tagline : badge.requirement}
                      </p>
                    </div>

                    <div className="pt-2 flex flex-col items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[8px] font-bold tracking-widest uppercase rounded-full px-2 py-0 h-4 border border-solid",
                          RARITY_TEXTS[badge.rarity]
                        )}
                      >
                        {badge.rarity}
                      </Badge>
                      
                      {badge.earned && badge.awardedAt && (
                        <span className="text-[8px] text-muted-foreground/60 flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          {new Date(badge.awardedAt).toLocaleDateString(undefined, {
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tooltip trigger overlay with full instructions */}
                  <div className="absolute inset-0 z-20 opacity-0 hover:opacity-100 bg-slate-950/95 backdrop-blur-sm p-3.5 flex flex-col justify-between text-left transition-opacity duration-300 rounded-2xl pointer-events-none">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-extrabold tracking-wider uppercase text-primary">
                          {badge.type} Badge
                        </span>
                        <Badge
                          variant="outline"
                          className={cn("text-[8px] uppercase px-1.5 py-0 h-3.5", RARITY_TEXTS[badge.rarity])}
                        >
                          {badge.rarity}
                        </Badge>
                      </div>
                      <h5 className="font-bold text-xs text-white">{badge.name}</h5>
                      <p className="text-[10px] text-slate-300 leading-normal">{badge.description}</p>
                    </div>
                    
                    <div className="border-t border-slate-800/80 pt-2 text-[9px] text-slate-400">
                      <span className="font-semibold block text-slate-500 uppercase tracking-wider text-[8px] mb-0.5">
                        {badge.earned ? "Unlocked On" : "Requirement"}
                      </span>
                      {badge.earned && badge.awardedAt ? (
                        new Date(badge.awardedAt).toLocaleDateString(undefined, {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })
                      ) : (
                        <span className="text-amber-500/90 leading-tight block">{badge.requirement}</span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredBadges.length === 0 && (
          <div className="text-center py-12 border border-dashed rounded-2xl bg-muted/5 flex flex-col items-center justify-center gap-2">
            <Info className="w-6 h-6 text-muted-foreground" />
            <span className="text-sm font-semibold text-muted-foreground">No achievements found matching your filters</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
