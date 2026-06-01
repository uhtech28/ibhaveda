"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Trophy, Sparkles, Rocket, Calendar } from "lucide-react";

const PAGE_SIZE = 20;

// ============================================================================
// TYPES
// ============================================================================

type FeedItem = {
  _id: Id<"notifications">;
  type: string;
  message: string;
  createdAt: number;
  isRead: boolean;
  user: {
    _id: Id<"users">;
    displayName: string;
    username: string;
    avatar?: string;
  } | null;
  venture: {
    _id: Id<"ventures">;
    name: string;
    ideaId: Id<"ideas">;
    userId: Id<"users">;
  } | null;
};

// ============================================================================
// VENTURE FEED COMPONENT
// ============================================================================

interface VentureFeedProps {
  /** Fetch feed for a specific venture */
  ventureId?: Id<"ventures">;
  /** Fetch feed for all ventures in an idea/project */
  ideaId?: Id<"ideas">;
  /** Fetch user's personal venture feed */
  userFeed?: boolean;
  /** Fetch community-wide feed */
  communityFeed?: boolean;
  /** Maximum number of items to show */
  limit?: number;
  /** Show compact cards (smaller) */
  compact?: boolean;
}

export function VentureFeed({
  ventureId,
  ideaId,
  userFeed,
  communityFeed,
  limit: _initialLimit,
  compact = false,
}: VentureFeedProps) {
  // `requestedLimit` is what we've asked the backend for.
  // `feed.length < requestedLimit` (once feed is defined) means we've reached the end.
  const [requestedLimit, setRequestedLimit] = useState(_initialLimit ?? PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const ventureFeedData = useQuery(
    api.socialFeed.getVentureFeed,
    ventureId ? { ventureId, limit: requestedLimit } : "skip"
  );
  const ideaFeedData = useQuery(
    api.socialFeed.getIdeaFeed,
    ideaId ? { ideaId, limit: requestedLimit } : "skip"
  );
  const userFeedData = useQuery(
    api.socialFeed.getUserVentureFeed,
    userFeed ? { limit: requestedLimit } : "skip"
  );
  const communityFeedData = useQuery(
    api.socialFeed.getCommunityVentureFeed,
    communityFeed ? { limit: requestedLimit } : "skip"
  );

  const feed = ventureFeedData ?? ideaFeedData ?? userFeedData ?? communityFeedData;

  // True while Convex hasn't yet returned data for the current requestedLimit.
  // Convex keeps serving stale data during re-fetch, so we detect "loading more"
  // by checking whether the returned count is still equal to the *previous* page size.
  const prevLimit = requestedLimit - PAGE_SIZE;
  const isLoadingMore =
    feed !== undefined &&
    feed.length === prevLimit &&
    requestedLimit > PAGE_SIZE;

  // Whether there are likely more items to load
  const hasMore = feed !== undefined && feed.length >= requestedLimit;

  // Infinite scroll: when the sentinel enters the viewport, bump the limit
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          setRequestedLimit((l) => l + PAGE_SIZE);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore]);

  // Initial loading state
  if (feed === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading activity...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (feed.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <Sparkles className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No activity yet</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Complete tasks and checkpoints to see your progress here!
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-${compact ? "3" : "4"}`}>
      {(feed as FeedItem[]).map((item) => (
        <FeedCard key={item._id} item={item as FeedItem} compact={compact} />
      ))}

      {/* Sentinel div — sits just below the last card; triggers next page when visible */}
      <div ref={sentinelRef} className="h-1" />

      {/* Spinner shown while the next batch is in-flight */}
      {isLoadingMore && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// FEED CARD COMPONENT
// ============================================================================

interface FeedCardProps {
  item: FeedItem;
  compact?: boolean;
}

function FeedCard({ item, compact = false }: FeedCardProps) {
  const isGoldCheckpoint = item.type === "gold_checkpoint";
  const isStageComplete = item.type === "venture_stage_complete";
  const isVentureComplete = item.type === "venture_complete";

  // Determine card styling based on type
  const cardStyles = isGoldCheckpoint
    ? "bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-300/50 dark:from-yellow-950/20 dark:to-amber-950/20 dark:border-yellow-700/50"
    : isStageComplete
    ? "bg-gradient-to-br from-purple-50 to-pink-50 border-purple-300/50 dark:from-purple-950/20 dark:to-pink-950/20 dark:border-purple-700/50"
    : isVentureComplete
    ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-300/50 dark:from-green-950/20 dark:to-emerald-950/20 dark:border-green-700/50"
    : "bg-card border-border";

  const iconComponent = isGoldCheckpoint ? (
    <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
  ) : isStageComplete ? (
    <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
  ) : isVentureComplete ? (
    <Rocket className="h-5 w-5 text-green-600 dark:text-green-400" />
  ) : null;

  const timeAgo = formatTimeAgo(item.createdAt);

  return (
    <Card className={`${cardStyles} transition-all hover:shadow-md`}>
      <CardContent className={compact ? "p-4" : "p-6"}>
        {/* Header: User Info */}
        <div className="flex items-start gap-3 mb-3">
          <Avatar className={compact ? "h-8 w-8" : "h-10 w-10"}>
            <AvatarImage src={item.user?.avatar} alt={item.user?.displayName} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {item.user?.displayName?.charAt(0)?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className={`font-semibold ${compact ? "text-sm" : "text-base"}`}>
                {item.user?.displayName || "Unknown User"}
              </p>
              {iconComponent && (
                <span className="flex items-center gap-1">
                  {iconComponent}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              @{item.user?.username || "unknown"}
            </p>
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{timeAgo}</span>
          </div>
        </div>

        {/* Message */}
        <div className={`${compact ? "text-sm" : "text-base"} mb-3`}>
          <p className="leading-relaxed">{item.message}</p>
        </div>

        {/* Footer: Venture Info */}
        {item.venture && (
          <div className="pt-3 border-t border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <p className="text-xs font-medium text-muted-foreground truncate">
                  {item.venture.name}
                </p>
              </div>

              {isGoldCheckpoint && (
                <span className="text-xs font-bold text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded-full">
                  🏆 GOLD
                </span>
              )}

              {isStageComplete && (
                <span className="text-xs font-bold text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-full">
                  ✨ STAGE COMPLETE
                </span>
              )}

              {isVentureComplete && (
                <span className="text-xs font-bold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                  🚀 VENTURE COMPLETE
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
