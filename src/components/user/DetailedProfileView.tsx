"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserProfile } from "./CompactProfileView";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Edit2, MapPin, Link2, Lightbulb, Sparkles, Users, ChevronRight } from "lucide-react";
import { RequestStatusCard, ContributionRequest } from "@/components/requests/request-status-card";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { PremiumIcon } from "@/components/ui/PremiumIcon";
import { getNormalizedRarity, getVentureBadgeEmoji, BadgeItem } from "../badges/BadgeCard";
import { BadgeDetailModal } from "@/components/badges/BadgeDetailModal";

interface DetailedProfileViewProps {
  profile: UserProfile;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  formData: {
    displayName: string;
    bio: string;
    avatar: string;
    location: string;
    website: string;
    github: string;
    linkedin: string;
    twitter: string;
    industry: string;
    industries: string[];
    skills: string[];
    username: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    displayName: string;
    bio: string;
    avatar: string;
    location: string;
    website: string;
    github: string;
    linkedin: string;
    twitter: string;
    industry: string;
    industries: string[];
    skills: string[];
    username: string;
  }>>;
  myRequests?: ContributionRequest[];
  incomingRequests?: ContributionRequest[];
}

export const DetailedProfileView: React.FC<DetailedProfileViewProps> = ({
  profile,
  isEditing,
  setIsEditing,
  formData,
  setFormData,
  myRequests,
  incomingRequests
}) => {
  const router = useRouter();
  const [selectedBadge, setSelectedBadge] = useState<BadgeItem | null>(null);

  const earnedBadges = useQuery(api.badges.getUserProfileBadges, { userId: profile._id });
  const equippedBadgeIds = profile.equippedBadges || [];

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

  return (
    <TooltipProvider>
      <div className="max-w-6xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">

          {/* 1. Identity Card (Span 2) */}
          <Card className="md:col-span-2 shadow-sm border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden relative flex flex-col">
            <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent"></div>
            <CardContent className="p-5 pt-6 relative flex-1">
              <div className="flex flex-col sm:flex-row gap-5 items-start h-full">
                <div className="relative shrink-0">
                  <Avatar className="w-20 h-20 border-4 border-background shadow-md">
                    <AvatarImage src={profile.avatar} alt={profile.displayName} className="object-cover" />
                    <AvatarFallback className="text-xl bg-primary/10 text-primary">
                      {profile.displayName?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background"></div>
                </div>

                <div className="flex-1 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h1 className="text-xl font-bold text-foreground leading-tight flex items-center gap-2">
                        {profile.displayName}
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
                      </h1>
                      <p className="text-muted-foreground font-medium text-sm">@{profile.username}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEditProfile}
                      className="gap-2 h-8"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit Profile
                    </Button>
                  </div>

                  {profile.bio && (
                    <p className="text-foreground/80 text-sm leading-relaxed max-w-xl line-clamp-2">
                      {profile.bio}
                    </p>
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

                  <div className="pt-1.5 space-y-2">
                    {(profile.industry || (profile.skills && profile.skills.length > 0)) && (
                      <div className="flex flex-wrap gap-1.5">
                        {profile.industry && (
                          <Badge variant="secondary" className="rounded-md px-2 py-0 text-[10px] font-medium h-5">
                            {profile.industry}
                          </Badge>
                        )}
                        {profile.skills && profile.skills.slice(0, 5).map((skill, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="rounded-md px-2 py-0 text-[10px] font-normal bg-background/50 h-5"
                          >
                            {skill}
                          </Badge>
                        ))}
                        {profile.skills && profile.skills.length > 5 && (
                          <Badge variant="outline" className="rounded-md px-2 py-0 text-[10px] font-normal bg-background/50 h-5">
                            +{profile.skills.length - 5}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Stats Column (Span 1) */}
          <div className="md:col-span-1 grid grid-rows-3 gap-3">
            <Card className="shadow-sm border-border/40 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4 flex items-center justify-between h-full">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Lightbulb className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Created</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-foreground">{profile.ideasCreated || 0}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border/40 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4 flex items-center justify-between h-full">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/10 rounded-full">
                    <Sparkles className="w-4 h-4 text-orange-500" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Sparked</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-foreground">{profile.ideasSparked || 0}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border/40 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4 flex items-center justify-between h-full">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-full">
                    <Users className="w-4 h-4 text-green-500" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Contributed</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-foreground">{profile.ideasContributed || 0}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Contribution Requests (Only visible to owner) */}
        <div className="mt-16 pt-8 border-t">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Contribution Requests</h2>
            <Link href="/profile/contribution-requests">
              <Button variant="outline" size="sm" className="gap-2">
                Manage Requests
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Outgoing Requests */}
            {myRequests && myRequests.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">My Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {myRequests.slice(0, 3).map((request) => (
                      <RequestStatusCard key={request._id} request={request} />
                    ))}
                    {myRequests.length > 3 && (
                      <Button variant="link" className="w-full text-xs">View all {myRequests.length} requests</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Incoming Requests */}
            {incomingRequests && incomingRequests.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Incoming Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {incomingRequests.slice(0, 3).map((request) => (
                      <div key={request._id} className="border rounded-lg p-3 bg-muted/20 text-sm">
                        <p className="font-medium truncate">{request.idea?.title || "Idea"}</p>
                        <p className="text-muted-foreground truncate">{request.message}</p>
                      </div>
                    ))}
                    {incomingRequests.length > 3 && (
                      <Button variant="link" className="w-full text-xs">View all {incomingRequests.length} incoming</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {(!myRequests?.length && !incomingRequests?.length) && (
              <div className="col-span-full text-center py-8 text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                No active contribution requests.
              </div>
            )}
          </div>
        </div>
      </div>

      <BadgeDetailModal
        badge={selectedBadge}
        isOpen={selectedBadge !== null}
        onClose={() => setSelectedBadge(null)}
        isOwner={false} // Inline viewer header is read-only detail view
        isEquipped={selectedBadge ? equippedBadgeIds.includes(selectedBadge.id) : false}
      />
    </TooltipProvider>
  )
}