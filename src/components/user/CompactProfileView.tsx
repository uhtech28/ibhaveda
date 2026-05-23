"use client";

import React, { useState } from "react"
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Lightbulb, Users, Sparkles, MapPin, Link2, ChevronRight, Edit2, MessageCircle } from "lucide-react"
import { ProfileStatsDialog } from "./ProfileStatsDialog";
import { ProfileProgress } from "./ProfileProgress";
import { ProfileBadges } from "./ProfileBadges";
import { Id } from "@convex/_generated/dataModel";
import { ContributionRequest } from "@/components/requests/request-status-card"
import { useChat } from "@/components/chat/ChatContext";
import { InvitationButton } from "@/components/requests/invitation-button";
import { getVentureBadgeEmoji } from "@/components/badges/BadgeCard";
import { useQuery } from "convex/react";
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

  const earnedBadges = useQuery(api.badges.getUserProfileBadges, { userId: profile._id });
  const equippedBadgeIds = profile.equippedBadges || [];
  const equippedBadgesList = earnedBadges?.filter((b) => equippedBadgeIds.includes(b.id)) || [];

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
                      {equippedBadgesList.slice(0, 3).map((badge) => (
                        <span
                          key={badge.id}
                          title={`${badge.name}: ${badge.description}`}
                          className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-yellow-500/10 border border-yellow-500/40 text-yellow-400 text-sm select-none shadow-[0_0_8px_rgba(234,179,8,0.2)] animate-pulse hover:scale-115 transition-transform duration-200 cursor-pointer"
                          style={{ animationDuration: "3s" }}
                        >
                          {(badge as any).icon || getVentureBadgeEmoji(badge.id, badge.name)}
                        </span>
                      ))}
                    </h1>
                    <p className="text-muted-foreground font-medium text-sm">@{profile.username}</p>
                  </div>
                  {isOwner ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEditProfile}
                      className="gap-2 h-8"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit Profile
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

                {/* Skills & Industries — clickable, navigates to a filtered community page */}
                <div className="pt-1.5 space-y-2">
                  {(profile.industry || (profile.skills && profile.skills.length > 0)) && (
                    <div className="flex flex-wrap gap-1.5">
                      {profile.industry && (
                        <Link
                          href={`/community?q=${encodeURIComponent(profile.industry)}`}
                          aria-label={`Browse community filtered by ${profile.industry}`}
                          title={`See others in ${profile.industry}`}
                        >
                          <Badge
                            variant="outline"
                            className="cursor-pointer rounded-md px-2.5 py-0 text-[10px] font-medium h-5 bg-purple-500/10 text-purple-600 border border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/40 transition-colors"
                          >
                            {profile.industry}
                          </Badge>
                        </Link>
                      )}
                      {profile.skills && profile.skills.slice(0, 5).map((skill, index) => (
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
                  <Users className="w-4 h-4 text-green-500" />
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

      {/* Badges & Achievements Section */}
      <ProfileBadges userId={profile._id} isOwner={isOwner} profile={profile} />

      {/* Contribution Requests (Only visible to owner) — single button to dedicated page */}
      {isOwner && (
        <div className="mt-6 pt-6 border-t lg:mt-10 lg:pt-8">
          <Link
            href="/profile/contribution-requests"
            className="block max-w-md"
            aria-label="Open contribution requests"
          >
            <Button
              type="button"
              variant="outline"
              className="h-14 w-full justify-between gap-3 rounded-xl px-4"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Users className="h-4 w-4" />
                </span>
                <span className="flex flex-col items-start leading-tight">
                  <span className="text-sm font-semibold">Contribution Requests</span>
                  <span className="text-[11px] text-muted-foreground">
                    {(myRequests?.length || 0) + (incomingRequests?.length || 0) > 0
                      ? `${(myRequests?.length || 0) + (incomingRequests?.length || 0)} active — Manage Requests`
                      : "No active requests — Manage Requests"}
                  </span>
                </span>
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>
          </Link>
        </div>
      )}

      <ProfileStatsDialog
        userId={profile._id as Id<"users">}
        type={dialogType}
        isOpen={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}

