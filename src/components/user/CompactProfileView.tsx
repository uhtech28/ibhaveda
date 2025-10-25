"use client";

import React, { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { InvitationButton } from "@/components/requests/invitation-button"
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Eye, Lightbulb, TrendingUp, Users, Sparkles, Heart } from "lucide-react"

// Interface matching the UserProfile from profile page
interface UserProfile {
  _id: string;
  clerkId: string;
  username: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  industry?: string;
  skills: string[];
  completedOnboarding: boolean;
  createdAt: number;
  updatedAt: number;
  ideasCreated?: number;
  ideasSparked?: number;
  ideasContributed?: number;
}

interface CompactProfileViewProps {
  profile: UserProfile;
}

export const CompactProfileView: React.FC<CompactProfileViewProps> = ({ profile }) => {
  // Fetch public ideas for this user (for community profile views)
  const publicIdeas = useQuery(api.ideas.getUserPublicIdeas, { userId: profile._id as any }); // eslint-disable-line @typescript-eslint/no-explicit-any

  // Use the dynamic metrics directly from profile data (now calculated in getUserProfile query)
  const metrics = {
    ideasCreated: profile.ideasCreated || 0,
    ideasSparked: profile.ideasSparked || 0,
    ideasContributed: profile.ideasContributed || 0,
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile Header - Enhanced */}
      <Card className="mb-6 shadow-lg bg-gradient-to-br from-card to-card/95">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="relative flex-shrink-0">
              <Avatar className="w-24 h-24 border-4 border-primary/10">
                <AvatarImage src={profile.avatar} alt={profile.displayName} />
                <AvatarFallback className="text-xl font-semibold">
                  {profile.displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-card"></div>
            </div>
            <div className="flex-1 min-w-0 w-full">
              <div className="flex flex-col gap-4">
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                    {profile.displayName}
                  </h1>
                  <p className="text-lg text-muted-foreground mb-2">@{profile.username}</p>
                  {profile.bio && (
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed max-w-2xl">
                      {profile.bio}
                    </p>
                  )}
                  {profile.industry && (
                    <Badge variant="secondary" className="mt-3 px-3 py-1 text-sm">
                      {profile.industry}
                    </Badge>
                  )}
                </div>
                <div className="w-full sm:w-auto">
                  <InvitationButton
                    targetUser={{
                      _id: profile._id,
                      username: profile.username,
                      displayName: profile.displayName,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Enhanced Metrics with Real-time Updates */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary/50">
          <CardContent className="text-center py-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-3">
              <Lightbulb className="w-6 h-6 text-primary" />
            </div>
            <div className="text-3xl font-bold text-primary mb-1">{metrics.ideasCreated}</div>
            <div className="text-sm text-muted-foreground font-medium">Ideas Created</div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-orange-500/50">
          <CardContent className="text-center py-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-500/10 rounded-full mb-3">
              <Sparkles className="w-6 h-6 text-orange-500" />
            </div>
            <div className="text-3xl font-bold text-orange-600 mb-1">{metrics.ideasSparked}</div>
            <div className="text-sm text-muted-foreground font-medium">Ideas Sparked</div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500/50">
          <CardContent className="text-center py-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-500/10 rounded-full mb-3">
              <Users className="w-6 h-6 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-green-600 mb-1">{metrics.ideasContributed}</div>
            <div className="text-sm text-muted-foreground font-medium">Contributed To</div>
          </CardContent>
        </Card>
      </div>

      {/* Public Ideas Section - Only for Community Profile Views */}
      {publicIdeas && publicIdeas.length > 0 ? (
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Public Ideas
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Ideas shared publicly by {profile.displayName}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
              {publicIdeas.slice(0, 6).map((idea: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                <Card key={idea._id} className="hover:shadow-md transition-shadow border-l-4 border-l-primary/30">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-lg mb-2 line-clamp-2">{idea.title}</h4>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                      {idea.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {idea.sparkCount || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {idea.contributionCount || 0}
                        </span>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/idea/${idea._id}`}>View Idea</a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {publicIdeas.length > 6 && (
              <div className="mt-4 text-center">
                <Button variant="outline" asChild>
                  <a href={`/profile/${profile.username}?tab=ideas`}>
                    View All {publicIdeas.length} Ideas
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : publicIdeas === undefined ? (
        <Card className="mb-6 shadow-lg">
          <CardContent className="text-center py-8">
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
            <p className="text-sm text-muted-foreground">Loading public ideas...</p>
          </CardContent>
        </Card>
      ) : null}

      {/* Skills - Enhanced */}
      {profile.skills.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Skills & Expertise
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {profile.skills.map((skill: string, index: number) => (
                <Badge key={index} variant="outline" className="px-3 py-1.5 text-sm hover:bg-primary/5 transition-colors">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}