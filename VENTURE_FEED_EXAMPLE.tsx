"use client";

import React, { useState } from "react";
import { VentureFeed } from "@/components/feed/VentureFeed";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Sparkles, Globe, TrendingUp } from "lucide-react";

/**
 * EXAMPLE: Venture Feed Integration Page
 *
 * This demonstrates how to use the VentureFeed component in different contexts.
 * Choose the appropriate feed type based on your use case.
 */

// ============================================================================
// EXAMPLE 1: PROJECT ACTIVITY FEED
// Shows activity from all team members working on a project
// ============================================================================

export function ProjectActivityFeed({ ideaId }: { ideaId: Id<"ideas"> }) {
  const idea = useQuery(api.ideas.getIdeaById, { ideaId });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Team Activity</h1>
        <p className="text-muted-foreground">
          See what your team is accomplishing on {idea?.title || "this project"}
        </p>
      </div>

      {/* Feed for all ventures in this project/idea */}
      <VentureFeed ideaId={ideaId} limit={30} />
    </div>
  );
}

// ============================================================================
// EXAMPLE 2: MY VENTURES FEED
// Shows activity from all projects the current user is involved in
// ============================================================================

export function MyVenturesFeedPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            My Venture Progress
          </CardTitle>
          <CardDescription>
            Track milestones across all your projects in one place
          </CardDescription>
        </CardHeader>
      </Card>

      {/* User's personal feed */}
      <VentureFeed userFeed={true} limit={50} />
    </div>
  );
}

// ============================================================================
// EXAMPLE 3: COMMUNITY FEED
// Shows public venture milestones across the entire platform
// ============================================================================

export function CommunityVentureFeedPage() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Community Achievements
        </h1>
        <p className="text-muted-foreground text-lg">
          Celebrate milestones from builders across the platform
        </p>
      </div>

      {/* Platform-wide community feed */}
      <VentureFeed communityFeed={true} limit={100} />
    </div>
  );
}

// ============================================================================
// EXAMPLE 4: TABBED FEED LAYOUT
// Multiple feed views in one page with tabs
// ============================================================================

export function TabbedVentureFeedPage() {
  const [activeTab, setActiveTab] = useState("my-activity");

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Venture Activity</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3 mb-6">
          <TabsTrigger value="my-activity" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            My Activity
          </TabsTrigger>
          <TabsTrigger value="community" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Community
          </TabsTrigger>
          <TabsTrigger value="trending" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Trending
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-activity">
          <VentureFeed userFeed={true} limit={30} />
        </TabsContent>

        <TabsContent value="community">
          <VentureFeed communityFeed={true} limit={50} />
        </TabsContent>

        <TabsContent value="trending">
          <div className="text-center py-12">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              Trending feed coming soon! This could show most active projects, fastest completions, etc.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// EXAMPLE 5: SIDEBAR FEED (COMPACT)
// Compact feed for sidebar display
// ============================================================================

export function SidebarVentureFeed() {
  return (
    <Card className="w-80 h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          Recent Activity
        </CardTitle>
        <CardDescription className="text-xs">
          Latest team achievements
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Compact feed for sidebar */}
        <VentureFeed userFeed={true} limit={10} compact={true} />
      </CardContent>
    </Card>
  );
}

// ============================================================================
// EXAMPLE 6: SPECIFIC VENTURE FEED
// Feed for a single venture (useful in venture detail page)
// ============================================================================

export function VentureDetailFeedSection({ ventureId }: { ventureId: Id<"ventures"> }) {
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Progress History</h2>

      {/* Feed for this specific venture */}
      <VentureFeed ventureId={ventureId} limit={20} />
    </div>
  );
}

// ============================================================================
// EXAMPLE 7: FILTERED FEED WITH CUSTOM CONTROLS
// Feed with filter controls for event types
// ============================================================================

export function FilteredVentureFeed() {
  const [showGold, setShowGold] = useState(true);
  const [showStage, setShowStage] = useState(true);
  const [showComplete, setShowComplete] = useState(true);

  // Note: You would need to extend the VentureFeed component
  // to accept filter props, or implement filtering on the feed data

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Activity Feed</h1>

        <div className="flex gap-2">
          <Button
            variant={showGold ? "default" : "outline"}
            size="sm"
            onClick={() => setShowGold(!showGold)}
          >
            🏆 Gold
          </Button>
          <Button
            variant={showStage ? "default" : "outline"}
            size="sm"
            onClick={() => setShowStage(!showStage)}
          >
            ✨ Stages
          </Button>
          <Button
            variant={showComplete ? "default" : "outline"}
            size="sm"
            onClick={() => setShowComplete(!showComplete)}
          >
            🚀 Complete
          </Button>
        </div>
      </div>

      <VentureFeed userFeed={true} limit={30} />
    </div>
  );
}

// ============================================================================
// EXAMPLE 8: GRID LAYOUT FEED
// Display feed items in a grid instead of list
// ============================================================================

export function GridVentureFeed() {
  const feed = useQuery(api.socialFeed.getUserVentureFeed, { limit: 30 });

  if (!feed) return <div>Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Achievement Gallery</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {feed.map((item) => (
          <Card key={item._id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                {item.type === "gold_checkpoint" && <span className="text-2xl">🏆</span>}
                {item.type === "venture_stage_complete" && <span className="text-2xl">✨</span>}
                {item.type === "venture_complete" && <span className="text-2xl">🚀</span>}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">
                    {item.user?.displayName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {item.venture?.name}
                  </p>
                </div>
              </div>
              <p className="text-xs leading-relaxed line-clamp-3">
                {item.message}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// USAGE INSTRUCTIONS
// ============================================================================

/**
 * HOW TO USE THESE EXAMPLES:
 *
 * 1. Import the example component you need:
 *    import { MyVenturesFeedPage } from "@/path/to/VENTURE_FEED_EXAMPLE"
 *
 * 2. Use in your route:
 *    export default function FeedPage() {
 *      return <MyVenturesFeedPage />
 *    }
 *
 * 3. Or integrate into existing pages:
 *    <ProjectActivityFeed ideaId={yourIdeaId} />
 *
 * FEED TYPES:
 * - ventureId: Single venture feed
 * - ideaId: All ventures for a project/idea
 * - userFeed: User's personal feed
 * - communityFeed: Platform-wide public feed
 *
 * CUSTOMIZATION:
 * - limit: Number of items (default: 20)
 * - compact: Smaller cards for sidebars (default: false)
 */
