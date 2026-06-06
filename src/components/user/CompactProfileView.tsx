"use client";

import React, { useState } from "react"
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Lightbulb, UserPlus, Sparkles, MapPin, Link2, ChevronRight, Edit2, MessageCircle, Trophy } from "lucide-react"
import { ProfileStatsDialog } from "./ProfileStatsDialog";
import { ProfileProgress } from "./ProfileProgress";
import { Id } from "@convex/_generated/dataModel";
import { ContributionRequest } from "@/components/requests/request-status-card"
import { useChat } from "@/components/chat/ChatContext";
import { InvitationButton } from "@/components/requests/invitation-button";
import { getNormalizedRarity, getVentureBadgeEmoji, BadgeItem } from "@/components/badges/BadgeCard";
import { BadgeDetailModal } from "@/components/badges/BadgeDetailModal";
import { PremiumIcon } from "@/components/ui/PremiumIcon";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";

export interface UserProfile {
  _id: Id<"users">;
  displayName: string;
  username: string;
  bio?: string;
  avatar?: string;
  coverImage?: string;
  location?: string;
  website?: string;
  twitter?: string;
  linkedin?: string;
  github?: string;
  skills?: string[];
  industry?: string;
  industries?: string[];
  ideasCreated?: number;
  ideasSparked?: number;
  ideasContributed?: number;
  xp?: number;
  level?: number;
  equippedBadges?: string[];
}

interface SkillProfileItem {
  _id: Id<"userSkillLevels">;
  skill: string;
  level: number;
  badgeCount: number;
}

const SkillMasteryList = ({ userId }: { userId: Id<"users"> }) => {
  const skillProfile = useQuery(api.skillBadges.getSkillProfile, { userId });

  if (!skillProfile || skillProfile.length === 0) return null;

  return (
    <div className="mt-2 text-xs">
      <div className="text-[10px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Top Masteries</div>
      <div className="flex flex-wrap gap-2">
        {skillProfile.slice(0, 3).map((sp: SkillProfileItem) => (
          <div key={sp._id} className="flex items-center gap-1.5 bg-primary/5 border border-primary/10 rounded-full pl-2 pr-3 py-0.5" title={`${sp.badgeCount} badges earned`}>
            <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary">
              {sp.level}
            </div>
            <span className="font-medium text-foreground/80">{sp.skill}</span>
          </div>
        ))}
      </div>
    </div>
  );
};


interface CompactProfileViewProps {
  profile: UserProfile;
  isOwner: boolean;
  onInvite?: () => void;
  myRequests?: ContributionRequest[];
  incomingRequests?: ContributionRequest[];
}

export const CompactProfileView: React.FC<CompactProfileViewProps> = ({
  profile,
  isOwner,
  onInvite,
  myRequests,
  incomingRequests
}) => {
  const router = useRouter();
  const { openChatWithUser } = useChat();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"created" | "sparked" | "contributed">("created");
  const [selectedBadge, setSelectedBadge] = useState<BadgeItem | null>(null);

  const earnedBadges = useQuery(api.badges.getUserProfileBadges, { userId: profile._id });
  const equippedBadgeIds = profile.equippedBadges || [];

  const updateUserProfile = useMutation(api.users.updateUserProfile);

  const handleEquipToggle = async (badgeId: string) => {
    let currentEquipped = [...equippedBadgeIds];
    if (currentEquipped.includes(badgeId)) {
      currentEquipped = currentEquipped.filter((id) => id !== badgeId);
    } else {
      if (currentEquipped.length >= 3) return;
      currentEquipped.push(badgeId);
    }
    
    try {
      await updateUserProfile({ equippedBadges: currentEquipped });
    } catch (e) {
      console.error("Failed to update equipped badges:", e);
    }
  };

  // Resolve equipped list with a fallback/padding of the highest-rarity earned badges
  const equippedBadgesList = React.useMemo(() => {
    if (!earnedBadges) return [];

    // Start with explicitly equipped badges
    const equipped = earnedBadges.filter((b) => equippedBadgeIds.includes(b.id));
    const list = [...equipped];

    // If we have less than 3 display badges, pad them with the highest rarity/prestige earned badges
    if (list.length < 3) {
      const rarityRank: Record<string, number> = {
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
        common: 1,
      };

      const remainingBadges = earnedBadges.filter((b) => !equipped.some((eq) => eq.id === b.id));
      const sortedRemaining = [...remainingBadges].sort((a, b) => {
        const rankA = rarityRank[a.rarity] || 0;
        const rankB = rarityRank[b.rarity] || 0;
        if (rankA !== rankB) return rankB - rankA;
        return (b.awardedAt || 0) - (a.awardedAt || 0);
      });

      const needed = 3 - list.length;
      list.push(...sortedRemaining.slice(0, needed));
    }

    return list as BadgeItem[];
  }, [earnedBadges, equippedBadgeIds]);

  const handleEditProfile = () => {
    router.push("/profile-setup");
  };

  const openDialog = (type: "created" | "sparked" | "contributed") => {
    setDialogType(type);
    setDialogOpen(true);
  };

  const handleSendMessage = async () => {
    if (profile._id) {
      openChatWithUser(profile._id);
    }
  };

  const metrics = {
    ideasCreated: profile.ideasCreated || 0,
    ideasSparked: profile.ideasSparked || 0,
    ideasContributed: profile.ideasContributed || 0,
  };

  return (
    <div className="max-w-6xl mx-auto px-4 pb-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* 1. Identity Card (Span 2) */}
        <Card className="md:col-span-2 shadow-sm border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden relative flex flex-col">
          <CardContent className="p-5 pt-6 relative flex-1">
            <div className="flex flex-col gap-4 h-full">
              <div className="flex gap-5 items-start">
              <div className="relative shrink-0">
                <Avatar className="w-20 h-20 border-4 border-background shadow-md">
                  <AvatarImage src={profile.avatar} alt={profile.displayName} className="object-cover" />
                  <AvatarFallback className="text-xl bg-primary/10 text-primary">
                    {profile.displayName?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background"></div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div className="min-w-0">
                    <h1 className="text-xl font-bold text-foreground leading-tight">
                      {profile.displayName}
                    </h1>
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="text-muted-foreground font-medium text-sm truncate">@{profile.username}</p>
                      {equippedBadgesList.slice(0, 3).map((badge) => {
                        const norm = getNormalizedRarity(badge.rarity);
                        const accentColor = badge.secondaryColor || norm.accentColor;
                        return (
                          <span
                            key={badge.id}
                            title={`${badge.name}: ${badge.description} (Click to view details)`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBadge(badge as any);
                            }}
                            className="inline-flex items-center justify-center w-6 h-6 rounded-md text-sm select-none hover:scale-115 transition-transform duration-200 cursor-pointer"
                            style={{
                              backgroundColor: `${accentColor}20`,
                              borderColor: `${accentColor}80`,
                              borderWidth: "1px",
                              color: accentColor,
                              boxShadow: `0 0 12px ${accentColor}50`,
                            }}
                          >
                            <PremiumIcon name={(badge as any).icon || getVentureBadgeEmoji(badge.id, badge.name)} className="w-3.5 h-3.5" strokeWidth={1.5} />
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  {isOwner ? (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleEditProfile}
                      className="h-9 w-9 shrink-0 rounded-lg"
                      aria-label="Edit profile"
                      title="Edit profile"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  ) : (
                    <div className="flex gap-1.5">
                      <Button
                        variant="default"
                        size="icon"
                        onClick={handleSendMessage}
                        className="h-8 w-8 rounded-full flex-shrink-0"
                        title="Message"
                      >
                        <MessageCircle className="w-4 h-4 text-white" />
                        <span className="sr-only">Message</span>
                      </Button>
                      <InvitationButton
                        targetUser={{
                          _id: profile._id,
                          username: profile.username,
                          displayName: profile.displayName,
                        }}
                        iconOnly
                      />
                    </div>
                  )}
                </div>
              </div>
              </div>
              <div className="space-y-4 sm:ml-[6.25rem]">
                {profile.bio ? (
                  <p className="text-foreground/80 text-base leading-relaxed max-w-3xl line-clamp-3">
                    {profile.bio}
                  </p>
                ) : (
                  <div className="hidden min-h-[1.75rem] sm:block" aria-hidden="true" />
                )}

                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground items-center pt-0.5">
                  {profile.location && (
                    <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                      <MapPin className="w-3 h-3" />
                      {profile.location}
                    </div>
                  )}
                  {profile.website && (
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-primary transition-colors bg-muted/50 px-2 py-1 rounded-md">
                      <Link2 className="w-3 h-3" />
                      Website
                    </a>
                  )}
                </div>

                {/* Skills & Industries — clickable, navigates to a filtered community page */}
                <div className="pt-1.5 space-y-2">
                  {((profile.industries && profile.industries.length > 0) || (profile.industry) || (profile.skills && profile.skills.length > 0)) && (
                    <div className="space-y-1.5">
                      {/* Show all industries from the array, fall back to legacy single field */}
                      <div className="flex flex-wrap gap-1.5">
                        {(profile.industries && profile.industries.length > 0
                          ? profile.industries
                          : profile.industry ? [profile.industry] : []
                        ).map((ind: string, index: number) => (
                          <Link
                            key={index}
                            href={`/community?q=${encodeURIComponent(ind)}`}
                            aria-label={`Browse community filtered by ${ind}`}
                            title={`See others in ${ind}`}
                          >
                            <Badge
                              variant="outline"
                              className="cursor-pointer rounded-md px-2.5 py-0 text-[10px] font-medium h-5 bg-purple-500/10 text-purple-600 border border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/40 transition-colors"
                            >
                              {ind}
                            </Badge>
                          </Link>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {profile.skills && profile.skills.map((skill, index) => (
                          <Link
                            key={index}
                            href={`/community?q=${encodeURIComponent(skill)}`}
                            aria-label={`Browse community filtered by ${skill}`}
                            title={`See others with skill: ${skill}`}
                          >
                            <Badge
                              variant="outline"
                              className="cursor-pointer rounded-md px-2.5 py-0 text-[10px] font-medium h-5 bg-blue-500/10 text-blue-600 border border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/40 transition-colors"
                            >
                              {skill}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* V2 Skill Mastery */}
                  <SkillMasteryList userId={profile._id} />

                  {/* Level / Points / Day Streak progress bars */}
                  <ProfileProgress userId={profile._id} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Stats Column (Span 1) */}
        <div className="md:col-span-1 grid grid-rows-3 gap-3">
          <Card
            className="shadow-sm border-border/40 hover:bg-muted/30 transition-all cursor-pointer group active:scale-[0.98]"
            onClick={() => openDialog("created")}
          >
            <CardContent className="p-4 flex items-center justify-between h-full">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                  <Lightbulb className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Created</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-foreground">{metrics.ideasCreated}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
              </div>
            </CardContent>
          </Card>

          <Card
            className="shadow-sm border-border/40 hover:bg-muted/30 transition-all cursor-pointer group active:scale-[0.98]"
            onClick={() => openDialog("sparked")}
          >
            <CardContent className="p-4 flex items-center justify-between h-full">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-full group-hover:bg-orange-500/20 transition-colors">
                  <Sparkles className="w-4 h-4 text-orange-500" />
                </div>
                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Sparked</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-foreground">{metrics.ideasSparked}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
              </div>
            </CardContent>
          </Card>

          <Card
            className="shadow-sm border-border/40 hover:bg-muted/30 transition-all cursor-pointer group active:scale-[0.98]"
            onClick={() => openDialog("contributed")}
          >
            <CardContent className="p-4 flex items-center justify-between h-full">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-full group-hover:bg-green-500/20 transition-colors">
                  <UserPlus className="w-4 h-4 text-green-500" />
                </div>
                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Contributed</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-foreground">{metrics.ideasContributed}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Buttons & Actions (Badges and Awards + Contribution Requests) */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Badges and Awards button (Visible to everyone) */}
        <Link
          href={`/profile/${profile.username}/badges`}
          className="block w-full"
          aria-label="Open award showcase"
        >
          <Button
            type="button"
            variant="outline"
            className="h-14 w-full justify-between gap-3 rounded-xl px-4"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500/10 text-yellow-500">
                <Trophy className="h-4 w-4" />
              </span>
              <span className="text-sm font-semibold">Award Showcase</span>
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Button>
        </Link>

        {/* Contribution Requests (Only visible to owner) — single button to dedicated page */}
        {isOwner && (
          <Link
            href="/profile/contribution-requests"
            className="block w-full"
            aria-label="Manage contribution requests"
          >
            <Button
              type="button"
              variant="outline"
              className="h-14 w-full justify-between gap-3 rounded-xl px-4"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10 text-green-500">
                  <UserPlus className="h-4 w-4" />
                </span>
                <span className="text-sm font-semibold">Manage Contribution Requests</span>
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>
          </Link>
        )}
        </div>
      </div>

      <ProfileStatsDialog
        userId={profile._id as Id<"users">}
        type={dialogType}
        isOpen={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      <BadgeDetailModal
        badge={selectedBadge}
        isOpen={selectedBadge !== null}
        onClose={() => setSelectedBadge(null)}
        isOwner={isOwner}
        isEquipped={selectedBadge ? equippedBadgeIds.includes(selectedBadge.id) : false}
        canEquipMore={equippedBadgeIds.length < 3}
        onEquipToggle={selectedBadge ? () => handleEquipToggle(selectedBadge.id) : undefined}
      />
    </div>
  );
}

