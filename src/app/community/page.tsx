"use client";

import React from "react";
import { useQuery } from "convex/react";
import Link from "next/link";
import { api } from "../../../convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, MapPin, Globe, AlertCircle } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { HeroHeader } from "@/components/header";
import { Spinner } from "@/components/ui/spinner";
import FooterSection from "@/components/footer";
import { InvitationButton } from "@/components/requests/invitation-button";

import { UserProfile } from "../../../convex/users";

// User profile interface
// interface UserProfile {
//   _id: string;
//   clerkId: string;
//   username: string;
//   displayName: string;
//   bio?: string;
//   avatar?: string;
//   location?: string;
//   website?: string;
//   skills: string[];
//   industry?: string;
//   completedOnboarding: boolean;
//   isActive: boolean;
//   role: string;
//   followersCount: number;
//   followingCount: number;
//   lastLoginAt?: number;
//   createdAt: number;
//   updatedAt: number;
//   ideasCreated?: number;
//   ideasSparked?: number;
//   ideasContributed?: number;
// }

export default function CommunityPage() {
  const { isLoaded: isClerkUserLoaded, user: clerkUser } = useUser();

  // Convex data
  const users = useQuery(api.users.getAllUsers);

  // Loading state
  if (!isClerkUserLoaded || users === undefined) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <HeroHeader />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <Spinner />
            <p className="text-muted-foreground mt-4">Loading community...</p>
          </div>
        </main>
        <FooterSection />
      </div>
    );
  }

  // Error state
  if (users === null) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <HeroHeader />
        <main className="flex-1 flex items-center justify-center px-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
                <h3 className="text-lg font-semibold mb-2">
                  Failed to Load Community
                </h3>
                <p className="text-muted-foreground mb-4">
                  Unable to fetch community data. Please try refreshing the
                  page.
                </p>
                <Button onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <FooterSection />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <HeroHeader />

      <main className="flex-1 container mx-auto px-4 py-12 pt-20">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Community
            </h1>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              Discover amazing creators and innovators in our community
            </p>
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-muted/50 rounded-full">
              <Users className="w-5 h-5" />
              <span className="text-sm font-medium">
                {users?.filter(user => user.clerkId !== clerkUser?.id).length || 0} Members
              </span>
            </div>
          </div>

          {/* Users Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {users?.filter(user => user.clerkId !== clerkUser?.id).map((user: UserProfile) => (
              <UserCard
                key={user._id}
                user={user}
                currentUserId={clerkUser?.id}
              />
            ))}
          </div>

          {users?.length === 0 && (
            <div className="text-center py-20">
              <Users className="w-16 h-16 mx-auto text-muted-foreground mb-6" />
              <h3 className="text-2xl font-semibold mb-4">No users yet</h3>
              <p className="text-muted-foreground text-lg">
                Be the first to join our community!
              </p>
            </div>
          )}
        </div>
      </main>

      <FooterSection />
    </div>
  );
}

// User Card Component
interface UserCardProps {
  user: UserProfile;
  currentUserId?: string;
}

const UserCard: React.FC<UserCardProps> = ({ user, currentUserId }) => {
  const isCurrentUser = currentUserId === user.clerkId;

  return (
    <Card className="hover:shadow-lg transition-shadow flex flex-col h-full">
      <Link
        href={`/profile/${encodeURIComponent(user.username)}`}
        className="flex-1"
      >
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <Avatar className="w-12 h-12 flex-shrink-0">
              <AvatarImage src={user.avatar} alt={user.displayName} />
              <AvatarFallback>
                {user.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold truncate">{user.displayName}</h3>
              <p className="text-sm text-muted-foreground truncate">
                @{user.username}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0 pb-3">
          {/* Bio */}
          {user.bio && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {user.bio}
            </p>
          )}

          {/* Industry */}
          {user.industry && (
            <Badge variant="secondary" className="text-xs mb-3">
              {user.industry}
            </Badge>
          )}

          {/* Skills */}
          {user.skills.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {user.skills.slice(0, 3).map((skill) => (
                <Badge key={skill} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {user.skills.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{user.skills.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Dynamic Metrics */}
          {(user.ideasCreated || user.ideasSparked || user.ideasContributed) && (
            <div className="flex gap-4 text-xs text-muted-foreground mb-3">
              {user.ideasCreated !== undefined && user.ideasCreated > 0 && (
                <div className="flex items-center gap-1">
                  <span className="font-medium text-primary">{user.ideasCreated}</span>
                  <span>ideas</span>
                </div>
              )}
              {user.ideasSparked !== undefined && user.ideasSparked > 0 && (
                <div className="flex items-center gap-1">
                  <span className="font-medium text-primary">{user.ideasSparked}</span>
                  <span>sparked</span>
                </div>
              )}
              {user.ideasContributed !== undefined && user.ideasContributed > 0 && (
                <div className="flex items-center gap-1">
                  <span className="font-medium text-primary">{user.ideasContributed}</span>
                  <span>contributed</span>
                </div>
              )}
            </div>
          )}

          {/* Location & Website */}
          {(user.location || user.website) && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {user.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{user.location}</span>
                </div>
              )}
              {user.website && (
                <div className="flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  <span>Website</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Link>

      {/* Action buttons - outside the Link */}
      {!isCurrentUser && (
        <div className="px-6 pb-4" onClick={(e) => e.stopPropagation()}>
          <InvitationButton
            targetUser={{
              _id: user._id,
              username: user.username,
              displayName: user.displayName,
            }}
          />
        </div>
      )}
    </Card>
  );
};
