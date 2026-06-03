"use client";

import React from "react";
import { useQuery } from "convex/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
import { FloatingChatButton } from "@/components/chat/FloatingChatButton";
import { ProfileStatsDialog } from "@/components/user/ProfileStatsDialog";

import { UserProfile } from "../../../convex/users";
import { Id } from "../../../convex/_generated/dataModel";

// Error Boundary to prevent leaderboard failures from crashing the page
class LeaderboardErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
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
  const searchParams = useSearchParams();
  const initialQuery = searchParams?.get("q") ?? "";
  const [searchQuery, setSearchQuery] = React.useState(initialQuery);

  // If the URL `?q=` changes (e.g., user clicks a different tag), update state.
  React.useEffect(() => {
    setSearchQuery(searchParams?.get("q") ?? "");
  }, [searchParams]);

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

      <FloatingChatButton />
      <FooterSection />
    </div>
  );
}

// Weekly Leaderboard Component
type LeaderboardUser = {
  _id: string;
  username: string;
  displayName: string;
  avatar?: string | null;
  points: number;
};

const RANK_STYLES = {
  1: {
    border: "border-yellow-500/50",
    bg: "bg-yellow-500/5",
    accent: "bg-yellow-500",
    avatarRing: "border-yellow-500/30",
    pointsText: "text-yellow-400",
  },
  2: {
    border: "border-gray-400/50",
    bg: "bg-gray-400/5",
    accent: "bg-gray-400",
    avatarRing: "border-gray-400/30",
    pointsText: "text-gray-300",
  },
  3: {
    border: "border-orange-700/50",
    bg: "bg-orange-700/5",
    accent: "bg-orange-700",
    avatarRing: "border-orange-700/30",
    pointsText: "text-orange-400",
  },
} as const;

const PodiumCard: React.FC<{ user: LeaderboardUser; rank: 1 | 2 | 3 }> = ({ user, rank }) => {
  const styles = RANK_STYLES[rank];
  const isFirst = rank === 1;
  const heightClass = rank === 1 ? "md:min-h-[300px]" : rank === 2 ? "md:min-h-[240px]" : "md:min-h-[210px]";

  return (
    <Card
      className={`relative overflow-hidden border-2 ${styles.border} ${styles.bg} ${heightClass} shadow-lg flex flex-col items-center justify-center text-center transition-transform duration-300 hover:scale-[1.03] ${
        isFirst ? "p-6 md:p-8" : "p-4 md:p-5"
      }`}
    >
      <div className={`absolute top-0 left-0 w-full ${isFirst ? "h-1.5" : "h-1"} ${styles.accent}`} />

      {/* Rank badge — clearly visible at top */}
      <div
        className={`flex items-center justify-center rounded-full text-white font-bold shadow-md ${styles.accent} ${
          isFirst ? "w-12 h-12 text-lg -mt-2 mb-3" : "w-9 h-9 text-sm -mt-1 mb-2"
        }`}
        aria-label={`Rank ${rank}`}
      >
        #{rank}
      </div>

      <Link
        href={`/profile/${encodeURIComponent(user.username)}`}
        className="w-full flex flex-col items-center"
      >
        <Avatar
          className={`shadow-md border-4 ${styles.avatarRing} ${
            isFirst ? "w-24 h-24 mb-4" : "w-16 h-16 mb-3"
          }`}
        >
          <AvatarImage src={user.avatar ?? undefined} alt={user.displayName} />
          <AvatarFallback className={`font-semibold bg-background ${isFirst ? "text-2xl" : "text-lg"}`}>
            {user.displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <h3
          className={`font-bold text-foreground truncate w-full hover:text-primary transition-colors ${
            isFirst ? "text-xl" : "text-base"
          }`}
        >
          {user.displayName}
        </h3>
        <p
          className={`text-muted-foreground ${
            isFirst ? "text-xs mb-4" : "text-[11px] mb-3"
          }`}
        >
          @{user.username}
        </p>

        <div
          className={`bg-background rounded-full border border-border/50 flex items-center gap-1.5 ${
            isFirst ? "px-4 py-1.5" : "px-3 py-1"
          }`}
        >
          <span className={`font-bold font-mono ${styles.pointsText} ${isFirst ? "text-base" : "text-sm"}`}>
            {user.points}
          </span>
          <span className={`text-muted-foreground font-medium uppercase tracking-wider ${isFirst ? "text-xs" : "text-[10px]"}`}>
            XP
          </span>
        </div>
      </Link>
    </Card>
  );
};

const WeeklyLeaderboard = () => {
  const topUsers = useQuery(api.leaderboard.getWeeklyLeaderboard, { limit: 3 });

  if (topUsers === undefined) return null; // Loading silently
  if (topUsers === null || topUsers.length === 0) return null; // No one earned points this week

  // topUsers[0] is rank 1, [1] is rank 2, [2] is rank 3 (per leaderboard ordering).
  // Podium display order on screen: rank 2 (left) → rank 1 (center, elevated) → rank 3 (right).
  const first = topUsers[0];
  const second = topUsers[1];
  const third = topUsers[2];

  return (
    <div className="mb-16">
      <div className="flex items-center justify-center gap-3 mb-8">
        <Trophy className="w-8 h-8 text-yellow-500" />
        <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
          Weekly Top Contributors
        </h2>
        <Trophy className="w-8 h-8 text-yellow-500" />
      </div>

      {/* Podium grid.
       * Mobile (grid-cols-1): cards stack in DOM order — rank 1, 2, 3.
       * Desktop (md:grid-cols-3): podium layout via md:order-X — rank 2 on
       * the left, rank 1 elevated in the center, rank 3 on the right. */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto items-end">
        {/* Rank 1 — first in DOM (top on mobile), centered + elevated on desktop */}
        <div className="md:order-2">
          {first && <PodiumCard user={first} rank={1} />}
        </div>

        {/* Rank 2 — second in DOM, left column on desktop */}
        <div className="md:order-1">
          {second ? <PodiumCard user={second} rank={2} /> : <div className="hidden md:block" />}
        </div>

        {/* Rank 3 — third in DOM, right column on desktop */}
        <div className="md:order-3">
          {third ? <PodiumCard user={third} rank={3} /> : <div className="hidden md:block" />}
        </div>
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
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogType, setDialogType] = React.useState<"created" | "sparked" | "contributed">("created");

  const handleMessageClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openChatWithUser(user._id);
  };

  const openStatsDialog = (type: "created" | "sparked" | "contributed") => {
    setDialogType(type);
    setDialogOpen(true);
  };

  const profileHref = `/profile/${encodeURIComponent(user.username)}`;
  const industries = user.industries && user.industries.length > 0
    ? user.industries
    : user.industry
      ? user.industry.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
  const visibleIndustries = industries.slice(0, 1);
  const hiddenIndustryCount = Math.max(0, industries.length - visibleIndustries.length);
  const visibleSkills = user.skills.slice(0, 2);
  const hiddenSkillCount = Math.max(0, user.skills.length - visibleSkills.length);
  const bio = user.bio?.trim();
  const emptyProfileText = "No bio yet - this builder hasn't introduced themselves";

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 flex h-[268px] flex-col overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
      <div className="grid shrink-0 grid-rows-[42px_22px_24px_24px_42px] px-4 pb-0.5 pt-2">
        <Link href={profileHref} className="block">
          {/* Header: Avatar & Name */}
          <div className="flex items-center gap-3">
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

        </Link>

        <Link href={profileHref} className="block min-w-0">
          <p className="line-clamp-1 text-[10px] leading-5 text-muted-foreground">
            {bio || emptyProfileText}
          </p>
        </Link>

        <div className="flex min-w-0 flex-wrap items-start gap-1 overflow-hidden py-0.5">
          {visibleIndustries.map((ind, i) => (
            <span key={`ind-${i}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); onTagClick?.(ind); }} className="cursor-pointer truncate max-w-[112px] rounded-md border border-purple-500/20 bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-medium text-purple-600">
              {ind}
            </span>
          ))}
          {hiddenIndustryCount > 0 && (
            <Link
              href={profileHref}
              onClick={(e) => e.stopPropagation()}
              className="rounded-md border border-purple-500/20 bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-medium text-purple-600 transition-colors hover:border-purple-500/40 hover:bg-purple-500/20"
            >
              +{hiddenIndustryCount} more
            </Link>
          )}
        </div>

        <div className="flex min-w-0 flex-wrap items-start gap-1 overflow-hidden py-0.5">
          {visibleSkills.map((skill, i) => (
            <span key={`skill-${i}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); onTagClick?.(skill); }} className="cursor-pointer truncate max-w-[112px] rounded-md border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">
              {skill}
            </span>
          ))}
          {hiddenSkillCount > 0 && (
            <Link
              href={profileHref}
              onClick={(e) => e.stopPropagation()}
              className="rounded-md border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 transition-colors hover:border-blue-500/40 hover:bg-blue-500/20"
            >
              +{hiddenSkillCount} more
            </Link>
          )}
        </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-1 border-b border-t border-border/40 py-1">
            <button
              type="button"
              onClick={() => openStatsDialog("created")}
              className="flex flex-col items-center justify-center rounded-md py-1 text-center transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label={`${user.displayName} created ideas`}
            >
              <Lightbulb className="w-3 h-3 text-primary mb-0.5" />
              <span className="text-[9px] font-bold leading-none">{user.ideasCreated || 0}</span>
            </button>
            <button
              type="button"
              onClick={() => openStatsDialog("sparked")}
              className="flex flex-col items-center justify-center rounded-md border-l border-border/40 py-1 text-center transition-colors hover:bg-orange-500/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
              aria-label={`${user.displayName} sparked ideas`}
            >
              <Sparkles className="w-3 h-3 text-orange-500 mb-0.5" />
              <span className="text-[9px] font-bold leading-none">{user.ideasSparked || 0}</span>
            </button>
            <button
              type="button"
              onClick={() => openStatsDialog("contributed")}
              className="flex flex-col items-center justify-center rounded-md border-l border-border/40 py-1 text-center transition-colors hover:bg-green-500/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/40"
              aria-label={`${user.displayName} contributed ideas`}
            >
              <Users className="w-3 h-3 text-green-500 mb-0.5" />
              <span className="text-[9px] font-bold leading-none">{user.ideasContributed || 0}</span>
            </button>
          </div>
      </div>

      {/* Footer Actions */}
      {!isCurrentUser && currentUserId && (
        <div className="flex h-[48px] shrink-0 items-start gap-2 px-3 pt-2" onClick={(e) => e.stopPropagation()}>
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

      <ProfileStatsDialog
        userId={user._id as Id<"users">}
        type={dialogOpen ? dialogType : null}
        isOpen={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </Card>
  );
};
