"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Award, Filter, ArrowUpDown, Star, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { BadgeCard, BadgeItem, getNormalizedRarity, getVentureBadgeEmoji } from "../badges/BadgeCard";
import { BadgeDetailModal } from "../badges/BadgeDetailModal";
import { AchievementUnlockModal } from "../badges/AchievementUnlockModal";
import { cn } from "@/lib/utils";
import { PremiumIcon } from "@/components/ui/PremiumIcon";

interface ProfileBadgesProps {
  userId: Id<"users">;
  isOwner: boolean;
  profile: any; // UserProfile from parent
}

const GENERAL_BADGES_DEFS = [
  { slug: "first-idea", name: "First Spark", description: "Created your first idea", icon: "💡", category: "onboarding", requirement: "Create your first idea" },
  { slug: "idea-machine", name: "Idea Machine", description: "Created 5 ideas", icon: "⚡", category: "onboarding", requirement: "Create 5 ideas" },
  { slug: "trendsetter", name: "Trendsetter", description: "Received 10 sparks on a single idea", icon: "🔥", category: "milestones", requirement: "Receive 10 sparks on a single idea" },
  { slug: "collaborator", name: "Collaborator", description: "Accepted a contribution request", icon: "👥", category: "milestones", requirement: "Accept a contribution request" },
  { slug: "chatterbox", name: "Chatterbox", description: "Left 5 comments on ideas", icon: "💬", category: "onboarding", requirement: "Leave 5 comments on ideas" },
  { slug: "legendary-venture-completion", name: "Legendary Completion", description: "Completed a venture with every stage ending in gold", icon: "👑", category: "aspirational", requirement: "Complete a venture with all gold checkpoints" },
];

const DISABLED_BADGE_REQUIREMENT_PATTERN = /\b(?:league|leagues|monument|monuments)\b/i;
const DISABLED_BADGE_IDS = new Set([
  "venture_9",
  "venture_10",
  "venture_11",
  "venture_12",
  "venture_13",
  "venture_14",
  "venture_15",
  "venture_16",
  "venture_17",
  "venture_18",
  "venture_19",
  "venture_20",
  "venture_43",
  "venture_44",
  "venture_45",
  "venture_46",
  "venture_62",
  "venture_71",
  "venture_72",
  "venture_73",
  "venture_74",
  "venture_75",
  "venture_76",
  "venture_77",
  "venture_78",
]);

const normalizeSparkCopy = (text?: string) =>
  text
    ?.replace(/\bupvoted\b/g, "Sparked")
    .replace(/\bUpvoted\b/g, "Sparked")
    .replace(/\bupvotes\b/g, "Sparks")
    .replace(/\bUpvotes\b/g, "Sparks")
    .replace(/\bupvote\b/g, "Spark")
    .replace(/\bUpvote\b/g, "Spark");

const shouldHideDisabledBadge = (badge: Partial<BadgeItem>) =>
  (badge.id ? DISABLED_BADGE_IDS.has(badge.id) : false) ||
  [badge.requirement, badge.description, badge.tagline].some((text) =>
    DISABLED_BADGE_REQUIREMENT_PATTERN.test(text || "")
  );

const isLockedHiddenBadge = (badge: BadgeItem) =>
  !badge.awardedAt && (badge.category === "hidden" || badge.rarity === "hidden");

export const ProfileBadges: React.FC<ProfileBadgesProps> = ({ userId, isOwner, profile }) => {
  const [activeCategory, setActiveCategory] = useState<"all" | "onboarding" | "idea_milestones" | "community" | "consistency" | "skill" | "locked">("all");
  const [activeRarity, setActiveRarity] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"recent" | "prestige" | "name">("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBadge, setSelectedBadge] = useState<BadgeItem | null>(null);
  const [badgeQueue, setBadgeQueue] = useState<any[]>([]);
  const [equipSlotIndex, setEquipSlotIndex] = useState<number | null>(null);

  // Mutations
  const recalculateBadges = useMutation(api.badges.recalculateUserBadges);
  const updateUserProfile = useMutation(api.users.updateUserProfile);

  // Trigger recalculation on mount for owner
  useEffect(() => {
    if (isOwner) {
      recalculateBadges({ userId }).catch(console.error);
    }
  }, [userId, isOwner, recalculateBadges]);

  // Fetch earned badges (unified query)
  const earnedBadges = useQuery(api.badges.getUserProfileBadges, { userId });
  // Fetch venture badge progress (for locked outlines)
  const ventureBadgeProgress = useQuery(api.badges.getVentureBadgeProgress, { userId });

  // Keep track of badge count for live award animation
  const prevBadgeCountRef = useRef<number | null>(null);

  useEffect(() => {
    if (!earnedBadges) return;
    const count = earnedBadges.length;

    if (prevBadgeCountRef.current !== null && count > prevBadgeCountRef.current) {
      const newCount = count - prevBadgeCountRef.current;
      const newBadges = earnedBadges.slice(0, newCount);

      const payloads = newBadges.map((b) => {
        let emoji = (b as any).icon || "🏅";
        if (b.type === "general") {
          const matched = GENERAL_BADGES_DEFS.find((g) => g.slug === b.category);
          emoji = matched?.icon || emoji;
        } else if (b.type === "venture") {
          const matchedVenture = ventureBadgeProgress?.find((vp) => vp.name === b.name);
          emoji = (b as any).icon || (matchedVenture ? getVentureBadgeEmoji(matchedVenture.id.toString(), b.name) : emoji);
        } else if (b.type === "skill") {
          emoji = "⭐";
        }

        return {
          id: b.id,
          name: b.name,
          description: b.description,
          icon: emoji,
          rarity: b.rarity === "hidden" ? "legendary" : b.rarity,
          category: b.category,
        };
      });

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

  // 1. Compile complete list of badges
  const allBadgesList: BadgeItem[] = [];

  // General badges
  GENERAL_BADGES_DEFS.forEach((g) => {
    const earnedInstance = earnedBadges.find(
      (eb) => eb.type === "general" && eb.name.toLowerCase() === g.name.toLowerCase()
    );

    allBadgesList.push({
      id: `general_${g.slug}`,
      name: g.name,
      description: g.description,
      category: g.category,
      rarity: "common",
      shape: "shield",
      primaryColor: "#E0F2FE",
      secondaryColor: "#0369A1",
      tagline: g.description,
      requirement: g.requirement,
      awardedAt: earnedInstance?.awardedAt,
      icon: g.icon,
    });
  });

  // Venture badges
  ventureBadgeProgress.forEach((vp) => {
    allBadgesList.push({
      id: `venture_${vp.id}`,
      name: vp.name,
      description: vp.tagline,
      category: vp.category,
      rarity: vp.rarity as any,
      shape: vp.shape,
      primaryColor: vp.primaryColor,
      secondaryColor: vp.secondaryColor,
      tagline: vp.tagline,
      requirement: vp.requirement,
      awardedAt: vp.awardedAt,
      icon: vp.icon || getVentureBadgeEmoji(vp.id.toString(), vp.name),
    });
  });

  // Skill badges
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
        icon: "⭐",
      });
    });

  const displayBadgesList = allBadgesList
    .filter((badge) => !shouldHideDisabledBadge(badge))
    .map((badge) => ({
      ...badge,
      description: normalizeSparkCopy(badge.description) || badge.description,
      tagline: normalizeSparkCopy(badge.tagline) || badge.tagline,
      requirement: normalizeSparkCopy(badge.requirement) || badge.requirement,
    }));

  // 2. Equipped Badges resolution
  const equippedBadgeIds = profile?.equippedBadges || [];
  const equippedBadges = displayBadgesList.filter(
    (b) => b.awardedAt && equippedBadgeIds.includes(b.id)
  );

  // 3. Filtering logic
  const filteredBadges = displayBadgesList.filter((b) => {
    const isEarned = !!b.awardedAt;

    // Category Filter
    if (activeCategory === "locked") {
      if (isEarned) return false;
    } else if (activeCategory !== "all") {
      if (!isEarned || b.category !== activeCategory) return false;
    }

    // Rarity Filter
    if (activeRarity !== "all") {
      if (b.rarity !== activeRarity) return false;
    }

    // Search Query Filter
    if (searchQuery.trim() !== "") {
      if (isLockedHiddenBadge(b)) return false;

      const q = searchQuery.toLowerCase();
      const nameMatch = b.name.toLowerCase().includes(q);
      const descMatch = b.description.toLowerCase().includes(q);
      const reqMatch = (b.requirement || "").toLowerCase().includes(q);
      if (!nameMatch && !descMatch && !reqMatch) return false;
    }

    return true;
  });

  // 4. Sorting logic
  const sortedBadges = [...filteredBadges].sort((a, b) => {
    // Locked badges go to the end if mixed
    if (!!a.awardedAt !== !!b.awardedAt) {
      return a.awardedAt ? -1 : 1;
    }

    if (sortBy === "recent") {
      return (b.awardedAt || 0) - (a.awardedAt || 0);
    }

    if (sortBy === "prestige") {
      const rarityRank = {
        mythic: 6,
        legendary: 5,
        hidden: 5,
        diamond: 4,
        epic: 4,
        gold: 3,
        rare: 3,
        silver: 2,
        uncommon: 2,
        bronze: 1,
        common: 1
      };
      const rankA = rarityRank[a.rarity] || 0;
      const rankB = rarityRank[b.rarity] || 0;
      if (rankA !== rankB) return rankB - rankA;
      return (b.awardedAt || 0) - (a.awardedAt || 0);
    }

    // Alphabetical Name
    return a.name.localeCompare(b.name);
  });

  // Toggle Equip Mutator
  const handleEquipToggle = async (badgeId: string) => {
    let currentEquipped = [...equippedBadgeIds];
    if (currentEquipped.includes(badgeId)) {
      currentEquipped = currentEquipped.filter((id) => id !== badgeId);
    } else {
      if (currentEquipped.length >= 3) {
        // Showcase limit of 3
        return;
      }
      currentEquipped.push(badgeId);
    }

    try {
      await updateUserProfile({ equippedBadges: currentEquipped });
    } catch (e) {
      console.error("Failed to update equipped badges:", e);
    }
  };

  const totalEarnedCount = displayBadgesList.filter((b) => b.awardedAt).length;
  const totalPossibleCount = displayBadgesList.length;
  const activeAwardBadge = badgeQueue[0] || null;

  return (
    <Card className="mt-8 shadow-xl border-white/5 bg-slate-950/40 backdrop-blur-md overflow-hidden relative">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

      {/* Real-time dopamine modal trigger */}
      <AchievementUnlockModal
        isOpen={!!activeAwardBadge}
        badge={activeAwardBadge}
        reason={activeAwardBadge?.description}
        scoreEarned={500}
        onClose={() => setBadgeQueue((q) => q.slice(1))}
      />

      {/* Detailed badge inspection popup */}
      {selectedBadge && (
        <BadgeDetailModal
          badge={selectedBadge}
          isOpen={!!selectedBadge}
          onClose={() => setSelectedBadge(null)}
          isOwner={isOwner}
          isEquipped={equippedBadgeIds.includes(selectedBadge.id)}
          canEquipMore={equippedBadgeIds.length < 3}
          onEquipToggle={() => handleEquipToggle(selectedBadge.id)}
        />
      )}

      {/* Equip Badge Selection Dialog */}
      {isOwner && equipSlotIndex !== null && (
        <Dialog open={equipSlotIndex !== null} onOpenChange={(open) => !open && setEquipSlotIndex(null)}>
          <DialogContent className="sm:max-w-md bg-slate-950/95 border-white/10 backdrop-blur-xl text-white rounded-3xl overflow-hidden p-6 shadow-2xl">
            <DialogTitle className="text-xl font-extrabold text-white mb-2">Equip Badge to Showcase Slot {equipSlotIndex + 1}</DialogTitle>
            <DialogDescription className="text-xs text-slate-400 mb-4">
              Select one of your earned achievements to showcase on your profile.
            </DialogDescription>
            <div className="max-h-[300px] overflow-y-auto pr-1 space-y-2.5 custom-scrollbar">
              {displayBadgesList.filter(b => b.awardedAt && !equippedBadgeIds.includes(b.id)).length === 0 ? (
                <div className="text-center py-8 text-sm text-slate-500 font-semibold border border-dashed border-slate-800 rounded-2xl">
                  No unequipped achievements available.
                </div>
              ) : (
                displayBadgesList
                  .filter(b => b.awardedAt && !equippedBadgeIds.includes(b.id))
                  .map((badge) => {
                    const norm = getNormalizedRarity(badge.rarity);
                    return (
                      <div
                        key={badge.id}
                        onClick={() => {
                          handleEquipToggle(badge.id);
                          setEquipSlotIndex(null);
                        }}
                        className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/50 hover:bg-slate-900 border border-white/5 hover:border-yellow-500/30 cursor-pointer transition-all duration-200"
                      >
                        <div className="w-10 h-10 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-center text-white shrink-0">
                          <PremiumIcon name={badge.icon || getVentureBadgeEmoji(badge.id, badge.name)} className="w-6 h-6" strokeWidth={1.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-extrabold text-xs text-white truncate">{badge.name}</h5>
                          <p className="text-[10px] text-slate-400 truncate">{badge.tagline || badge.description}</p>
                        </div>
                        <Badge variant="outline" className={cn("text-[8px] border border-solid shrink-0", norm.pillClass)}>
                          {norm.label.split(" ")[1] || norm.label}
                        </Badge>
                      </div>
                    );
                  })
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      <CardHeader className="relative pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <CardTitle className="text-2xl font-black text-white">
              {profile.displayName}&apos;s Badge Showcase
            </CardTitle>
          </div>

          {/* Prestige Progress Stats */}
          <div className="bg-slate-900/60 border border-white/5 rounded-2xl px-5 py-3 flex items-center gap-4 self-start md:self-auto backdrop-blur-md shadow-lg">
            <Award className="w-6 h-6 text-yellow-400 animate-[bounce_3s_infinite]" />
            <div className="flex flex-col">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Badges Earned</span>
              <span className="text-2xl font-black text-white leading-tight">
                {totalEarnedCount} <span className="text-xs font-semibold text-slate-500">/ {totalPossibleCount}</span>
              </span>
            </div>
            {/* Circular Progress Gauge */}
            <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="22" cy="22" r="18" fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="4" />
                <circle
                  cx="22"
                  cy="22"
                  r="18"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-yellow-400 drop-shadow-[0_0_6px_rgba(234,179,8,0.4)]"
                  strokeDasharray={2 * Math.PI * 18}
                  strokeDashoffset={2 * Math.PI * 18 * (1 - totalEarnedCount / totalPossibleCount)}
                />
              </svg>
              <span className="absolute text-[10px] font-extrabold text-white">
                {Math.round((totalEarnedCount / totalPossibleCount) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-0 space-y-8 relative">

        {/* ============================================================== */}
        {/* EQUIPPED BADGES PROFILE HEADER SHOWCASE                         */}
        {/* ============================================================== */}
        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-transparent to-transparent pointer-events-none" />

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="bg-yellow-500/10 border border-yellow-500/30 p-1.5 rounded-lg text-yellow-400">
                <Star className="w-4 h-4 fill-yellow-400" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                  Featured Badges
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full font-bold">
                    {equippedBadges.length} / 3
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">These badges sit at the top of your public profile card.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, index) => {
              const b = equippedBadges[index];
              if (!b) {
                return (
                  <div
                    key={`empty_${index}`}
                    onClick={() => isOwner && setEquipSlotIndex(index)}
                    className={cn(
                      "border border-dashed bg-slate-950/20 rounded-2xl h-24 flex flex-col items-center justify-center text-center p-4 relative group transition-all duration-300",
                      isOwner
                        ? "border-slate-800 hover:border-yellow-500/40 hover:bg-slate-900/40 cursor-pointer"
                        : "border-slate-800/50"
                    )}
                  >
                    <Star className={cn(
                      "w-5 h-5 text-slate-800 transition-colors duration-300",
                      isOwner && "group-hover:text-yellow-500/55 group-hover:scale-110"
                    )} />
                    <span className={cn(
                      "text-[10px] font-bold mt-1.5 transition-colors duration-300",
                      isOwner
                        ? "text-slate-650 group-hover:text-yellow-500/70"
                        : "text-slate-700"
                    )}>
                      {isOwner ? "Equip Badge" : "Empty Showcase Slot"}
                    </span>
                  </div>
                );
              }

              const norm = getNormalizedRarity(b.rarity);
              const accentColor = b.secondaryColor || norm.accentColor;
              return (
                <motion.div
                  key={b.id}
                  whileHover={{ y: -3 }}
                  onClick={() => setSelectedBadge(b)}
                  className="relative bg-slate-950/60 rounded-2xl p-4 flex items-center gap-4 cursor-pointer overflow-hidden group select-none transition-all duration-300"
                  style={{
                    borderColor: `${accentColor}80`,
                    borderWidth: "1px",
                    boxShadow: `0 0 15px ${accentColor}15`,
                    outlineColor: `${accentColor}30`,
                    outlineStyle: "solid",
                    outlineWidth: "1px",
                    // We can also set custom properties for group hover target
                    ["--accent-hover" as any]: accentColor,
                  }}
                >
                  {/* Respective Sweep animation overlay */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                    <div
                      className="absolute top-0 bottom-0 left-0 w-1/3 skew-x-12 animate-[shine_3s_infinite]"
                      style={{
                        backgroundImage: `linear-gradient(to right, transparent, ${accentColor}20, transparent)`
                      }}
                    />
                  </div>

                  <div className="w-12 h-12 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center shrink-0 z-10 group-hover:scale-105 transition-transform duration-200 text-white">
                    <PremiumIcon name={b.icon || getVentureBadgeEmoji(b.id, b.name)} className="w-7 h-7" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0 z-10">
                    <h4 className="font-extrabold text-xs text-white truncate leading-tight transition-colors group-hover:text-[var(--accent-hover)]">
                      {b.name}
                    </h4>
                    <p className="text-[9.5px] text-slate-400 truncate mt-0.5">{b.tagline || b.description}</p>
                    <Badge variant="outline" className={cn("text-[7.5px] px-2 py-0 h-3.5 mt-2 border border-solid", norm.pillClass)}>
                      {norm.label}
                    </Badge>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ============================================================== */}
        {/* FILTERS & SEARCH CONTROLS                                      */}
        {/* ============================================================== */}
        <div className="flex flex-col gap-4 bg-slate-900/30 border border-white/5 p-4 rounded-3xl backdrop-blur-md">
          {/* Top Row: Search and Sorting */}
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search badges by title, lore, achievements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 bg-slate-950/60 border-white/5 text-white placeholder-slate-500 rounded-xl focus-visible:ring-yellow-500/40"
              />
            </div>

            <div className="flex gap-2 shrink-0">
              {/* Sort selector dropdown */}
              <div className="flex items-center gap-1.5 bg-slate-950/60 border border-white/5 rounded-xl px-3 h-10 text-xs text-slate-400 font-sans">
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span className="font-extrabold uppercase tracking-wide text-[10px] text-slate-500">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="bg-transparent border-none text-white focus:outline-none font-bold text-xs cursor-pointer pr-1 font-sans"
                >
                  <option value="recent" className="bg-slate-950 text-white font-sans">Recently Earned</option>
                  <option value="prestige" className="bg-slate-950 text-white font-sans">Highest Rarity</option>
                  <option value="name" className="bg-slate-950 text-white font-sans">Alphabetical (A-Z)</option>
                </select>
              </div>

              {/* Rarity filter dropdown */}
              <div className="flex items-center gap-1.5 bg-slate-950/60 border border-white/5 rounded-xl px-3 h-10 text-xs text-slate-400 font-sans">
                <Filter className="w-3.5 h-3.5" />
                <span className="font-extrabold uppercase tracking-wide text-[10px] text-slate-500">Rarity:</span>
                <select
                  value={activeRarity}
                  onChange={(e: any) => setActiveRarity(e.target.value)}
                  className="bg-transparent border-none text-white focus:outline-none font-bold text-xs cursor-pointer pr-1 font-sans"
                >
                  <option value="all" className="bg-slate-950 text-white font-sans">All Rarities</option>
                  <option value="common" className="bg-slate-950 text-white font-sans">🥉 Bronze</option>
                  <option value="uncommon" className="bg-slate-950 text-white font-sans">🥈 Silver</option>
                  <option value="rare" className="bg-slate-950 text-white font-sans">🥇 Gold</option>
                  <option value="epic" className="bg-slate-950 text-white font-sans">💎 Diamond</option>
                  <option value="legendary" className="bg-slate-950 text-white font-sans">👑 Legendary</option>
                  <option value="mythic" className="bg-slate-950 text-white font-sans">🔥 Mythic</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bottom Row: Tab categories selection */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 border-t border-white/5 pt-3">
            {[
              { id: "all", label: "All Achievements" },
              { id: "onboarding", label: "Onboarding" },
              { id: "idea_milestones", label: "Milestones" },
              { id: "community", label: "Community" },
              { id: "consistency", label: "Consistency" },
              { id: "skill", label: "Skills" },
              { id: "locked", label: "Locked" },
            ].map((tab) => (
              <Button
                key={tab.id}
                variant="ghost"
                size="sm"
                onClick={() => setActiveCategory(tab.id as any)}
                className={cn(
                  "h-8 w-full rounded-lg text-xs font-bold transition-all px-2",
                  activeCategory === tab.id
                    ? "bg-white text-slate-950 shadow-md font-black hover:bg-slate-100"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                <span className="truncate">{tab.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* ============================================================== */}
        {/* BADGES GRID DISPLAY                                             */}
        {/* ============================================================== */}
        <motion.div
          layout
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5"
        >
          <AnimatePresence mode="popLayout">
            {sortedBadges.map((badge) => {
              const isEarned = !!badge.awardedAt;
              const isEquipped = equippedBadgeIds.includes(badge.id);

              return (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  state={isEquipped ? "equipped" : isEarned ? "unlocked" : "locked"}
                  isOwner={isOwner}
                  onClick={() => setSelectedBadge(badge)}
                  onEquipToggle={() => handleEquipToggle(badge.id)}
                />
              );
            })}
          </AnimatePresence>
        </motion.div>

        {sortedBadges.length === 0 && (
          <div className="text-center py-16 border border-dashed border-slate-800 rounded-3xl bg-slate-950/20 flex flex-col items-center justify-center gap-3">
            <EyeOff className="w-8 h-8 text-slate-600" />
            <span className="text-sm font-extrabold text-slate-400">No achievements found matching those filters</span>
            <Button variant="link" onClick={() => { setActiveCategory("all"); setActiveRarity("all"); setSearchQuery(""); }} className="text-yellow-500 font-bold text-xs hover:text-yellow-400 mt-1">
              Reset Filters
            </Button>
          </div>
        )}

      </CardContent>
    </Card>
  );
};
