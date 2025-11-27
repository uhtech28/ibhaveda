"use client";

import React from "react";
import { useQuery } from "convex/react";
import Link from "next/link";
import { api } from "../../../convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, AlertCircle, Lightbulb, Sparkles, Send } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { HeroHeader } from "@/components/header";
import { Spinner } from "@/components/ui/spinner";
import FooterSection from "@/components/footer";
import { InvitationButton } from "@/components/requests/invitation-button";
import { useChat } from "@/components/chat/ChatContext";

import { UserProfile } from "../../../convex/users";

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

      <main className="flex-1 container mx-auto px-4 py-12 pt-24">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Community
            </h1>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              Discover amazing creators and innovators in our community
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full border border-border/50">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                {users?.filter(user => user.clerkId !== clerkUser?.id).length || 0} Members
              </span>
            </div>
          </div>

          {/* Users Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
  const { toggleChat } = useChat();

  const handleMessageClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleChat();
    // TODO: Implement direct messaging logic to open chat with specific user
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 flex flex-col h-full overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
      <Link
        href={`/profile/${encodeURIComponent(user.username)}`}
        className="flex-1 flex flex-col"
      >
        <div className="p-4 flex-1 flex flex-col">
          {/* Header: Avatar & Name */}
          <div className="flex items-start gap-3 mb-3">
            <Avatar className="w-10 h-10 border-2 border-background shadow-sm shrink-0">
              <AvatarImage src={user.avatar} alt={user.displayName} className="object-cover" />
              <AvatarFallback className="text-sm bg-primary/10 text-primary font-semibold">
                {user.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 pt-0.5">
              <h3 className="font-bold text-base leading-tight truncate group-hover:text-primary transition-colors">
                {user.displayName}
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                @{user.username}
              </p>
            </div>
          </div>

          {/* Bio */}
          {user.bio && (
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2 leading-relaxed h-8">
              {user.bio}
            </p>
          )}

          {/* Industry Badge */}
          <div className="mb-2">
             {user.industry ? (
               <Badge variant="secondary" className="rounded-md px-2 py-0 text-[10px] font-medium bg-muted text-muted-foreground hover:bg-muted/80 h-5">
                 {user.industry}
               </Badge>
             ) : (
               <div className="h-5"></div> // Spacer if no industry
             )}
          </div>

          {/* Skills */}
          <div className="flex flex-wrap gap-1 mb-4 h-10 content-start overflow-hidden">
            {user.skills.length > 0 ? (
              <>
                {user.skills.slice(0, 3).map((skill) => (
                  <Badge key={skill} variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-background/50">
                    {skill}
                  </Badge>
                ))}
                {user.skills.length > 3 && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-background/50">
                    +{user.skills.length - 3}
                  </Badge>
                )}
              </>
            ) : (
               <p className="text-[10px] text-muted-foreground italic">No skills listed</p>
            )}
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-1 py-2 border-t border-b border-border/40 mb-1">
             <div className="flex flex-col items-center justify-center text-center">
                <Lightbulb className="w-3.5 h-3.5 text-primary mb-0.5" />
                <span className="text-[10px] font-bold">{user.ideasCreated || 0}</span>
             </div>
             <div className="flex flex-col items-center justify-center text-center border-l border-border/40">
                <Sparkles className="w-3.5 h-3.5 text-orange-500 mb-0.5" />
                <span className="text-[10px] font-bold">{user.ideasSparked || 0}</span>
             </div>
             <div className="flex flex-col items-center justify-center text-center border-l border-border/40">
                <Users className="w-3.5 h-3.5 text-green-500 mb-0.5" />
                <span className="text-[10px] font-bold">{user.ideasContributed || 0}</span>
             </div>
          </div>
        </div>
      </Link>

      {/* Footer Actions */}
      {!isCurrentUser && (
        <div className="px-4 pb-4 pt-0 flex items-center gap-2 mt-auto" onClick={(e) => e.stopPropagation()}>
          <div className="flex-1">
            <InvitationButton
              targetUser={{
                _id: user._id,
                username: user.username,
                displayName: user.displayName,
              }}
            />
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8 shrink-0 rounded-md border-border/60 hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all"
            onClick={handleMessageClick}
            title="Message"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </Card>
  );
};
