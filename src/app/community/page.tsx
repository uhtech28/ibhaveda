"use client";

import React from "react";
import { useQuery } from "convex/react";
import Link from "next/link";
import { api } from "../../../convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, AlertCircle, Lightbulb, Sparkles, Send, Trophy } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { HeroHeader } from "@/components/header";
import { Spinner } from "@/components/ui/spinner";
import FooterSection from "@/components/footer";
import { InvitationButton } from "@/components/requests/invitation-button";
import { useChat } from "@/components/chat/ChatContext";

import { UserProfile } from "../../../convex/users";

// Error Boundary to prevent leaderboard failures from crashing the page
class LeaderboardErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return null; // Silently hide if leaderboard fails
    return this.props.children;
  }
}


export default function CommunityPage() {
  const { isLoaded: isClerkUserLoaded, user: clerkUser } = useUser();
  const [searchQuery, setSearchQuery] = React.useState("");

  // Convex data
  const users = useQuery(api.users.getAllUsers);

  // Filter users based on search query
  const filteredUsers = React.useMemo(() => {
    if (!users) return [];
    const query = searchQuery.toLowerCase().trim();
    if (!query) return users;

    return users.filter((user) => {
      const nameMatch = user.displayName.toLowerCase().includes(query);
      const usernameMatch = user.username.toLowerCase().includes(query);
      const bioMatch = user.bio?.toLowerCase().includes(query);
      const industryMatch = user.industry?.toLowerCase().includes(query);
      const skillsMatch = user.skills.some(skill => skill.toLowerCase().includes(query));

      return nameMatch || usernameMatch || bioMatch || industryMatch || skillsMatch;
    });
  }, [users, searchQuery]);

  // Loading state
  if (!isClerkUserLoaded || users === undefined) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <HeroHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />
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
        <HeroHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />
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
      <HeroHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <main className="flex-1 container mx-auto px-4 py-12 pt-24">
        <div className="max-w-5xl mx-auto">
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
                {filteredUsers.filter(user => user.clerkId !== clerkUser?.id).length || 0} Members
              </span>
            </div>
          </div>

          <LeaderboardErrorBoundary>
            <WeeklyLeaderboard />
          </LeaderboardErrorBoundary>

          {/* Users Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.filter(user => user.clerkId !== clerkUser?.id).map((user: UserProfile) => (
              <UserCard
                key={user._id}
                user={user}
                currentUserId={clerkUser?.id}
                onTagClick={(tag) => setSearchQuery(tag)}
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

// Weekly Leaderboard Component
const WeeklyLeaderboard = () => {
  const topUsers = useQuery(api.leaderboard.getWeeklyLeaderboard, { limit: 3 });

  if (topUsers === undefined) return null; // Loading silently
  if (topUsers === null || topUsers.length === 0) return null; // No one earned points this week

  return (
    <div className="mb-16">
      <div className="flex items-center justify-center gap-3 mb-8">
        <Trophy className="w-8 h-8 text-yellow-500" />
        <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">Weekly Top Contributors</h2>
        <Trophy className="w-8 h-8 text-yellow-500" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {topUsers.map((user, index) => (
          <Card key={user._id} className={`relative overflow-hidden border-2 flex flex-col items-center p-6 text-center ${index === 0 ? 'border-yellow-500/50 bg-yellow-500/5 shadow-yellow-500/20' : index === 1 ? 'border-gray-400/50 bg-gray-400/5 shadow-gray-400/20' : 'border-orange-700/50 bg-orange-700/5 shadow-orange-700/20'} shadow-lg transform hover:scale-105 transition-transform duration-300`}>
            <div className={`absolute top-0 left-0 w-full h-1 ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-700'}`}></div>
            <div className={`absolute -top-4 -right-4 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg rotate-12 ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-700'}`}>
              #{index + 1}
            </div>
            
            <Link href={`/profile/${encodeURIComponent(user.username)}`} className="w-full flex flex-col items-center">
              <Avatar className={`w-20 h-20 mb-4 border-4 ${index === 0 ? 'border-yellow-500/20' : index === 1 ? 'border-gray-400/20' : 'border-orange-700/20'} shadow-md`}>
                <AvatarImage src={user.avatar ?? undefined} alt={user.displayName} />
                <AvatarFallback className="text-2xl font-semibold bg-background">{user.displayName.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              
              <h3 className="font-bold text-lg text-foreground truncate w-full hover:text-primary transition-colors">{user.displayName}</h3>
              <p className="text-xs text-muted-foreground mb-4">@{user.username}</p>
              
              <div className="bg-background rounded-full px-4 py-1.5 border border-border/50 flex items-center gap-1.5">
                <span className="font-bold font-mono text-primary text-sm">{user.points}</span>
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Points</span>
              </div>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
};

// User Card Component
interface UserCardProps {
  user: UserProfile;
  currentUserId?: string;
  onTagClick?: (tag: string) => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, currentUserId, onTagClick }) => {
  const isCurrentUser = currentUserId === user.clerkId;
  const { openChatWithUser } = useChat();

  const handleMessageClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openChatWithUser(user._id);
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 flex flex-col h-full overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
      <Link
        href={`/profile/${encodeURIComponent(user.username)}`}
        className="flex-1 flex flex-col"
      >
        <div className="p-3 flex-1 flex flex-col">
          {/* Header: Avatar & Name */}
          <div className="flex items-center gap-3 mb-2">
            <Avatar className="w-8 h-8 border-2 border-background shadow-sm shrink-0">
              <AvatarImage src={user.avatar} alt={user.displayName} className="object-cover" />
              <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                {user.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h3 className="font-bold text-sm leading-tight truncate group-hover:text-primary transition-colors">
                {user.displayName}
              </h3>
              <p className="text-[10px] text-muted-foreground truncate">
                @{user.username}
              </p>
            </div>
          </div>

          {/* Bio - Hidden if empty to save space, else truncated more aggressively */}
          {user.bio && (
            <p className="text-[10px] text-muted-foreground mb-2 line-clamp-1 leading-relaxed">
              {user.bio}
            </p>
          )}

          {/* Tags Section */}
          <div className="flex flex-col gap-1.5 mb-2 mt-auto">
            {/* Ind + Skills mixed or stacked compactly */}
            <div className="flex flex-wrap gap-1 items-center">
              {/* Industry */}
              {user.industry && user.industry.split(',').map(s => s.trim()).slice(0, 1).map((ind, i) => (
                <span key={`ind-${i}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); onTagClick?.(ind); }} className="cursor-pointer text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-600 border border-purple-500/20 truncate max-w-[80px]">
                  {ind}
                </span>
              ))}

              {/* Skills */}
              {user.skills.slice(0, 2).map((skill, i) => (
                <span key={`skill-${i}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); onTagClick?.(skill); }} className="cursor-pointer text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 border border-blue-500/20 truncate max-w-[80px]">
                  {skill}
                </span>
              ))}
              {(user.skills.length + (user.industry ? user.industry.split(',').length : 0)) > 3 && (
                <span className="text-[9px] px-1 py-0.5 text-muted-foreground">
                  +{(user.skills.length + (user.industry ? user.industry.split(',').length : 0)) - 3}
                </span>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-1 py-1.5 border-t border-b border-border/40 mb-1">
            <div className="flex flex-col items-center justify-center text-center">
              <Lightbulb className="w-3 h-3 text-primary mb-0.5" />
              <span className="text-[9px] font-bold leading-none">{user.ideasCreated || 0}</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center border-l border-border/40">
              <Sparkles className="w-3 h-3 text-orange-500 mb-0.5" />
              <span className="text-[9px] font-bold leading-none">{user.ideasSparked || 0}</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center border-l border-border/40">
              <Users className="w-3 h-3 text-green-500 mb-0.5" />
              <span className="text-[9px] font-bold leading-none">{user.ideasContributed || 0}</span>
            </div>
          </div>
        </div>
      </Link>

      {/* Footer Actions */}
      {!isCurrentUser && currentUserId && (
        <div className="px-3 pb-3 pt-0 flex items-center gap-2 mt-auto" onClick={(e) => e.stopPropagation()}>
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
            className="h-7 w-7 shrink-0 rounded-md border-border/60 hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all"
            onClick={handleMessageClick}
            title="Message"
          >
            <Send className="w-3 h-3" />
          </Button>
        </div>
      )}
    </Card>
  );
};
