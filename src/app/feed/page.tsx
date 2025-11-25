"use client";

import React, { useState, useRef, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { HeroHeader } from "@/components/header";
import FooterSection from "@/components/footer";
import { Button } from "@/components/ui/button";
import { MessageCircle, Users, AlertCircle } from "lucide-react";
import Image from "next/image";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useProfileCompletion } from "@/lib/hooks/use-profile-completion";
import { useToast } from "@/components/ui/use-toast";
import { RightSidebar } from "@/components/RightSidebar";


type ConvexIdea = {
  _id: string;
  title: string;
  description: string;
  category: string;
  visibility: string;
  sparkCount: number;
  commentCount: number;
  createdAt: number;
  updatedAt: number;
  authorId: string;
  author?: {
    _id: string;
    name?: string;
    username?: string;
    avatar?: string;
  } | null;
  contributionCount?: number;
  industries?: string;
}

// Grid Card Component for the grid layout
const IdeaGridCard: React.FC<{
  idea: ConvexIdea;
  onClick?: () => void;
  onSpark?: (ideaId: string) => void;
  contributorsCount?: number;
  innerRef?: React.Ref<HTMLDivElement>;
}> = ({ idea, onClick, onSpark, contributorsCount = 0, innerRef }) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Parse categories (skills) and industries
  const skills = idea.category ? idea.category.split(',').map(s => s.trim()) : [];
  const industries = idea.industries ? idea.industries.split(',').map(i => i.trim()) : [];

  return (
    <div
      ref={innerRef}
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card text-card-foreground transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-1 flex flex-col h-full"
    >
      {/* Image or Gradient Background */}
      {/* Image or Gradient Background */}
      <div className="relative h-48 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 flex items-center justify-center group-hover:scale-105 transition-transform duration-700 ease-out">
          <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-4xl font-bold text-foreground/80 shadow-2xl ring-1 ring-white/30">
            {idea.title.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Tags - Top Left - Clean & Minimal */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[90%]">
          {/* Combine and limit tags to reduce clutter */}
          {[...industries, ...skills].slice(0, 2).map((tag, i) => (
            <span key={`tag-${i}`} className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-background/40 backdrop-blur-md text-foreground/90 border border-white/10 shadow-sm">
              {tag}
            </span>
          ))}
          {([...industries, ...skills].length > 2) && (
            <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-background/20 backdrop-blur-md text-foreground/80 border border-white/10">
              +{([...industries, ...skills].length - 2)}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        {/* Title */}
        <h3 className="text-lg font-bold mb-2 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
          {idea.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-3 mb-6 leading-relaxed flex-1">
          {idea.description}
        </p>

        {/* Footer: Author (Left) and Actions (Right) */}
        <div className="flex items-end justify-between mt-auto pt-4 border-t border-border/50">
          
          {/* Bottom Left: Author */}
          <div className="flex items-center space-x-2">
            {idea.author?.avatar ? (
              <Image
                src={idea.author.avatar}
                alt={idea.author?.name || idea.author?.username || 'User'}
                className="w-8 h-8 rounded-full object-cover border border-border"
                width={32}
                height={32}
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-bold border border-border">
                {getInitials(idea.author?.name || idea.author?.username || 'Unknown')}
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground">
                {idea.author?.name || idea.author?.username || 'Unknown'}
              </span>
              <span className="text-[10px] text-muted-foreground">
                @{idea.author?.username || 'user'}
              </span>
            </div>
          </div>

          {/* Bottom Right: Actions (Icons & Numbers separated) */}
          <div className="flex items-center gap-3">
            
            {/* Sparks */}
            <div className="flex flex-col items-center gap-0.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSpark?.(idea._id);
                }}
                className="p-1.5 rounded-full hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                title="Spark this idea"
              >
                <span className="text-lg">✨</span>
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: Show list of sparkers
                }}
                className="text-[10px] font-bold text-muted-foreground hover:text-foreground hover:underline"
              >
                {idea.sparkCount || 0}
              </button>
            </div>

            {/* Comments */}
            <div className="flex flex-col items-center gap-0.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: Open comments
                }}
                className="p-1.5 rounded-full hover:bg-blue-50 text-muted-foreground hover:text-blue-500 transition-colors"
                title="View comments"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: Show list of comments
                }}
                className="text-[10px] font-bold text-muted-foreground hover:text-foreground hover:underline"
              >
                {idea.commentCount || 0}
              </button>
            </div>

            {/* Contributors */}
            <div className="flex flex-col items-center gap-0.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: Send contribution request
                }}
                className="p-1.5 rounded-full hover:bg-purple-50 text-muted-foreground hover:text-purple-500 transition-colors"
                title="Contribute"
              >
                <Users className="w-4 h-4" />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: Show list of contributors
                }}
                className="text-[10px] font-bold text-muted-foreground hover:text-foreground hover:underline"
              >
                {contributorsCount}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default function FeedPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // Profile completion check
  const { isComplete: isProfileComplete, isLoading: isProfileLoading } = useProfileCompletion();

  // Filter states
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Pagination state
  const [limit, setLimit] = useState(20);
  
  // Fetch ideas from Convex with manual pagination (limit)
  const ideasResult = useQuery(api.ideas.getPublicIdeas, { limit });
  
  // State to hold displayed ideas to prevent blinking when limit changes (and query becomes undefined)
  const [displayedIdeas, setDisplayedIdeas] = useState<ConvexIdea[]>([]);
  const [hasMore, setHasMore] = useState(true);

  // Update displayed ideas only when we have a valid result
  React.useEffect(() => {
    if (ideasResult !== undefined) {
      setDisplayedIdeas(ideasResult);
      // If we got fewer items than the limit, we've reached the end
      if (ideasResult.length < limit) {
        setHasMore(false);
      } else {
        // If we got exactly the limit, we might have more, or exactly that many.
        // We'll assume we have more until we prove otherwise by fetching next page.
        // But if we are already at a high limit and count didn't increase, maybe we should check?
        // For simple limit-based pagination, checking length < limit is the standard way.
        setHasMore(true);
      }
    }
  }, [ideasResult, limit]);

  const ideas = displayedIdeas;
  const isLoadingMore = ideasResult === undefined && displayedIdeas.length > 0;
  const isInitialLoading = ideasResult === undefined && displayedIdeas.length === 0;
  
  const toggleSparkMutation = useMutation(api.ideas.toggleSpark);

  // Infinite Scroll Observer
  const observer = useRef<IntersectionObserver | null>(null);
  const lastIdeaElementRef = useCallback((node: HTMLDivElement) => {
    if (isInitialLoading || isLoadingMore) return; // Don't trigger while loading
    if (ideas.length === 0) return; // Don't trigger if no ideas
    if (!hasMore) return; // Don't trigger if no more items
    
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        // Load more when bottom element is visible
        setLimit(prev => prev + 20);
      }
    });
    if (node) observer.current.observe(node);
  }, [ideas.length, isInitialLoading, isLoadingMore, hasMore]);

  // Redirect if not authenticated
  React.useEffect(() => {
    if (isLoaded && !userId) {
      router.push('/');
    }
  }, [isLoaded, userId, router]);

  // Show toast if profile is incomplete
  React.useEffect(() => {
    if (isLoaded && userId && !isProfileLoading && !isProfileComplete) {
      toast({
        title: "Complete Your Profile",
        description: "Please complete your profile setup to fully participate in the community. Missing: display name, avatar, bio (50+ chars), industry, and at least 3 skills.",
        action: <Button size="sm" onClick={() => router.push('/profile-setup')}>Complete Profile</Button>,
        duration: 8000,
      });
    }
  }, [isLoaded, userId, isProfileComplete, isProfileLoading, toast, router]);

  if (!isLoaded || !userId) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <HeroHeader />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </main>
        <FooterSection />
      </div>
    );
  }

  const handleSpark = async (ideaId: string) => {
    try {
      await toggleSparkMutation({ ideaId: ideaId as Id<"ideas"> });
    } catch (error) {
      console.error('Error toggling spark:', error);
    }
  };

  const handleIdeaClick = (ideaId: string) => {
    router.push(`/idea/${ideaId}`);
  };

  // Filter ideas based on selected categories
  const filteredIdeas = ideas.filter((idea) => {
    if (selectedCategories.length === 0) return true;
    // Assuming category is comma-separated string
    const ideaCategories = idea.category ? idea.category.split(',').map(c => c.trim()) : [];
    return selectedCategories.some(selected => ideaCategories.includes(selected));
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <HeroHeader />
      
      <RightSidebar 
        filterOpen={filterOpen}
        setFilterOpen={setFilterOpen}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
      />

      <main className="flex-1 container mx-auto px-4 py-12 pt-20 pr-20"> {/* Added pr-20 for sidebar */}
        <div className="max-w-7xl mx-auto">
          {/* Header Section - Simplified */}
          <div className="flex flex-col gap-2 mb-12">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Discover Ideas
            </h1>
            <p className="text-muted-foreground">Explore innovative concepts from our creative community</p>
          </div>

          {/* Profile Incomplete Banner */}
          {(!isProfileLoading && !isProfileComplete) && (
            <div className="mb-8 p-6 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-amber-600" />
                <div>
                  <h3 className="font-semibold text-amber-800">Complete Your Profile</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    Your profile needs more details to fully participate. Add your display name, avatar, bio (50+ characters), industry, and at least 3 skills.
                  </p>
                </div>
              </div>
              <Button onClick={() => router.push('/profile-setup')} className="bg-amber-600 hover:bg-amber-700">
                Complete Profile
              </Button>
            </div>
          )}

          {/* Ideas Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> {/* Max 3 columns */}
            {isInitialLoading ? (
              // Initial Loading state
              <div className="col-span-full text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading ideas...</p>
              </div>
            ) : filteredIdeas.length > 0 ? (
              filteredIdeas.map((idea, index) => {
                if (index === filteredIdeas.length - 1) {
                  return (
                    <IdeaGridCard
                      innerRef={lastIdeaElementRef}
                      key={idea._id}
                      idea={idea}
                      onClick={() => handleIdeaClick(idea._id)}
                      onSpark={handleSpark}
                      contributorsCount={idea.contributionCount || 0}
                    />
                  );
                } else {
                  return (
                    <IdeaGridCard
                      key={idea._id}
                      idea={idea}
                      onClick={() => handleIdeaClick(idea._id)}
                      onSpark={handleSpark}
                      contributorsCount={idea.contributionCount || 0}
                    />
                  );
                }
              })
            ) : selectedCategories.length > 0 ? (
              // No ideas matching filter
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground mb-4">No ideas found for selected categories. Try different filters.</p>
                <Button variant="outline" onClick={() => setSelectedCategories([])}>
                  Clear Filters
                </Button>
              </div>
            ) : (
              // No ideas state
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground mb-4">No ideas yet. Be the first to share your brilliant concept!</p>
              </div>
            )}
          </div>

          {/* Loading More Indicator */}
          {isLoadingMore && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            </div>
          )}
       
        </div>
      </main>

      <FooterSection />
    </div>
  );
}
