"use client";

import React from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Eye, Lightbulb, Users, Sparkles, Heart, MapPin, Link2 } from "lucide-react"

interface UserProfile {
  _id: string;
  username: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  industry?: string;
  skills?: string[];
  location?: string;
  website?: string;
  ideasCreated?: number;
  ideasSparked?: number;
  ideasContributed?: number;
}

interface Idea {
  _id: string;
  title: string;
  description: string;
  visibility: string;
  category?: string;
  createdAt: number;
  sparkCount?: number;
  contributionCount?: number;
}

interface CompactProfileViewProps {
  profile: UserProfile;
  publicIdeas?: Idea[];
  onInvite?: () => void;
}

export const CompactProfileView: React.FC<CompactProfileViewProps> = ({ 
  profile, 
  publicIdeas,
  onInvite 
}) => {
  const metrics = {
    ideasCreated: profile.ideasCreated || 0,
    ideasSparked: profile.ideasSparked || 0,
    ideasContributed: profile.ideasContributed || 0,
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pb-12">
      {/* Compact Header with Overlapping Avatar */}
      <div className="relative mb-12">
        {/* Banner */}
        <div className="h-32 w-full bg-gradient-to-r from-primary/10 to-primary/5 rounded-b-3xl border-b border-border/50"></div>
        
        {/* Profile Info Container - Overlapping Design */}
        <div className="relative -mt-16 px-4 md:px-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Avatar with Online Status */}
            <div className="relative shrink-0">
              <div className="rounded-full p-1 bg-background shadow-xl">
                <Avatar className="w-28 h-28 md:w-32 md:h-32 border-4 border-background shadow-sm">
                  <AvatarImage src={profile.avatar} alt={profile.displayName} className="object-cover" />
                  <AvatarFallback className="text-4xl bg-primary/10 text-primary">
                    {profile.displayName?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-background"></div>
            </div>

            {/* Name, Bio, and Meta - Side by Side with Avatar */}
            <div className="flex-1 pt-8 md:pt-12">
              <div className="flex flex-col gap-4">
                <div className="flex-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{profile.displayName}</h1>
                  <p className="text-muted-foreground font-medium mb-3">@{profile.username}</p>
                  
                  {/* Bio */}
                  {profile.bio && (
                    <p className="text-foreground/80 leading-relaxed mb-3">{profile.bio}</p>
                  )}
                  
                  {/* Location and Links */}
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground items-center mb-3">
                    {profile.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {profile.location}
                      </div>
                    )}
                    {profile.website && (
                      <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
                        <Link2 className="w-3.5 h-3.5" />
                        Website
                      </a>
                    )}
                  </div>

                  {/* Skills and Industry - Below Bio with Different Colors */}
                  <div className="flex flex-wrap gap-2">
                    {profile.industry && (
                      <Badge className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20 hover:bg-purple-500/20">
                        {profile.industry}
                      </Badge>
                    )}
                    {profile.skills && profile.skills.map((skill: string, index: number) => (
                      <Badge 
                        key={index} 
                        className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20 hover:bg-blue-500/20"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Invitation Button */}
                {onInvite && (
                  <div className="w-full md:w-auto">
                    <Button onClick={onInvite} className="w-full md:w-auto">
                      Send Invitation
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-8">
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

      {/* Public Ideas Section - List Format */}
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
            <div className="space-y-3">
              {publicIdeas.slice(0, 6).map((idea) => (
                <Card key={idea._id} className="hover:shadow-md transition-all duration-200 hover:border-primary/30">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-lg mb-1 truncate">{idea.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {idea.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {idea.visibility === "public" ? "Public" : "Private"}
                          </Badge>
                          {idea.category && (
                            <Badge variant="secondary" className="text-xs">
                              {idea.category}
                            </Badge>
                          )}
                          <span>•</span>
                          <span>{new Date(idea.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground shrink-0">
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                          <span>{idea.sparkCount || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{idea.contributionCount || 0}</span>
                        </div>
                      </div>
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
      ) : (
        <Card className="mb-6 shadow-lg">
          <CardContent className="text-center py-12">
            <Eye className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">No public ideas yet</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}