"use client";

import React, { useState } from "react"
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Lightbulb, Users, Sparkles, MapPin, Link2, ChevronRight, Edit2, MessageCircle } from "lucide-react"
import { ProfileStatsDialog } from "./ProfileStatsDialog";
import { Id } from "@convex/_generated/dataModel";
import { RequestStatusCard, ContributionRequest } from "@/components/requests/request-status-card"
import { useChat } from "@/components/chat/ChatContext";
import { InvitationButton } from "@/components/requests/invitation-button";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Flame, Star, Trophy } from "lucide-react";
import { LevelBadge } from "@/components/levels/level-badge";
import { BadgeGrid } from "@/components/badges/badge-grid";
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

  const userWallet = useQuery(api.gamification.getUserWallet, { userId: profile._id as Id<"users"> });
  const userStreak = useQuery(api.gamification.getUserStreak, { userId: profile._id as Id<"users"> });
  const levelInfo = useQuery(api.gamification.getLevelProgress, { xp: profile.xp || 0 });

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
                    <h1 className="text-xl font-bold text-foreground leading-tight">{profile.displayName}</h1>
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

                {/* Skills & Industries */}
                <div className="pt-1.5 space-y-2">
                  {(profile.industry || (profile.skills && profile.skills.length > 0)) && (
                    <div className="flex flex-wrap gap-1.5">
                      {profile.industry && (
                        <Badge variant="outline" className="rounded-md px-2.5 py-0 text-[10px] font-medium h-5 bg-purple-500/10 text-purple-600 border border-purple-500/20 hover:bg-purple-500/20">
                          {profile.industry}
                        </Badge>
                      )}
                      {profile.skills && profile.skills.slice(0, 5).map((skill, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="rounded-md px-2.5 py-0 text-[10px] font-medium h-5 bg-blue-500/10 text-blue-600 border border-blue-500/20 hover:bg-blue-500/20"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* V2 Skill Mastery */}
                  <SkillMasteryList userId={profile._id} />

                  {/* Gamification Stats */}
                  <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border/40">
                    <div className="flex items-center gap-2" title="Current Level">
                      <div className="p-1.5 bg-primary/10 rounded-md">
                        <Trophy className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold leading-none">Level {levelInfo?.level || profile.level || 1}</span>
                        <span className="text-[10px] text-muted-foreground">{profile.xp || 0} XP</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2" title="Total Points">
                      <div className="p-1.5 bg-yellow-500/10 rounded-md">
                        <Star className="w-4 h-4 text-yellow-500" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold leading-none">{userWallet?.balance || 0}</span>
                        <span className="text-[10px] text-muted-foreground">Points</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2" title="Current Login Streak">
                      <div className="p-1.5 bg-orange-500/10 rounded-md">
                        <Flame className="w-4 h-4 text-orange-500" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold leading-none">{userStreak?.currentStreak || 0}</span>
                        <span className="text-[10px] text-muted-foreground">Day Streak</span>
                      </div>
                    </div>
                  </div>
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

        {/* 1.5 Badges (Span 2) */}
        {/* Removed Gamification BadgeList */}

        {/* Venture System Integration */}
        <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <LevelBadge userId={profile._id} />
          <BadgeGrid userId={profile._id} />
        </div>

      </div>

      {/* Contribution Requests (Only visible to owner) */}
      {isOwner && (
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

