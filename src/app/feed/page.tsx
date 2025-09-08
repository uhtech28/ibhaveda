"use client";

import React, { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { HeroHeader } from "@/components/header";
import FooterSection from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CategoryMultiSelect } from "@/components/CategoryMultiSelect";
import { Plus, MessageCircle, Users, Filter } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";


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
}

// Grid Card Component for the grid layout
const IdeaGridCard: React.FC<{
  idea: ConvexIdea;
  onClick?: () => void;
  onSpark?: (ideaId: string) => void;
  contributorsCount?: number;
}> = ({ idea, onClick, onSpark, contributorsCount = 0 }) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateTimestamp: number) => {
    return new Date(dateTimestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card text-card-foreground transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-1"
    >
      {/* Image or Gradient Background */}
      <div className="relative h-48 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-2xl font-bold text-white">
            {idea.title.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-black/20 backdrop-blur-sm text-white border border-white/20">
            {idea.category || 'General'}
          </span>
        </div>

      </div>

      {/* Content */}
      <div className="p-6">
        {/* Title */}
        <h3 className="text-lg font-semibold mb-3 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
          {idea.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4 leading-relaxed">
          {idea.description}
        </p>

        {/* Author and Date */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            {idea.author?.avatar ? (
              <Image
                src={idea.author.avatar}
                alt={idea.author?.name || idea.author?.username || 'User'}
                className="w-6 h-6 rounded-full object-cover"
                width={24}
                height={24}
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-medium">
                {getInitials(idea.author?.name || idea.author?.username || 'Unknown')}
              </div>
            )}
            <span className="text-xs font-medium text-foreground">
              {idea.author?.name || idea.author?.username || 'Unknown'}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {formatDate(idea.createdAt)}
          </span>
        </div>

        {/* Stats and Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center space-x-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSpark?.(idea._id);
              }}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-white/40 backdrop-blur-sm border border-white/30 hover:bg-white/60 transition-all hover:shadow-sm text-foreground hover:text-red-600 font-medium text-sm"
            >
              <span className="text-sm">Sparks ✨ {idea.sparkCount || 0}</span>
            </button>

            <div className="flex items-center space-x-1 text-muted-foreground">
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm font-medium">{idea.commentCount || 0}</span>
            </div>
          </div>

          {contributorsCount >= 0 && (
            <div className="flex items-center space-x-1 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">{contributorsCount}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function FeedPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();

  // Filter states
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Fetch ideas from Convex
  const ideasQuery = useQuery(api.ideas.getPublicIdeas);
  const ideas = ideasQuery ?? [];

  const toggleSparkMutation = useMutation(api.ideas.toggleSpark);

  // Redirect if not authenticated
  React.useEffect(() => {
    if (isLoaded && !userId) {
      router.push('/');
    }
  }, [isLoaded, userId, router]);

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

      <main className="flex-1 container mx-auto px-4 py-12 pt-20">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  Discover Ideas
                </h1>
                <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      Filter
                      {selectedCategories.length > 0 && (
                        <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
                          {selectedCategories.length}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="start">
                    <CategoryMultiSelect
                      selectedCategories={selectedCategories}
                      onChange={setSelectedCategories}
                      placeholder="Select categories to filter..."
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <p className="text-muted-foreground">Explore innovative concepts from our creative community</p>
            </div>
            <div className="flex items-center gap-4">
              <Button asChild className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90">
                <Link href="/create-idea">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Idea
                </Link>
              </Button>
            </div>
          </div>

          {/* Ideas Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {ideasQuery === undefined ? (
              // Loading state
              <div className="col-span-full text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading ideas...</p>
              </div>
            ) : filteredIdeas.length > 0 ? (
              filteredIdeas.map((idea) => (
                <IdeaGridCard
                  key={idea._id}
                  idea={idea}
                  onClick={() => handleIdeaClick(idea._id)}
                  onSpark={handleSpark}
                  contributorsCount={idea.contributionCount || 0}
                />
              ))
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

          {/* Load More Section */}
          <div className="text-center mt-12">
            <Button 
              variant="outline" 
              className="px-8 py-3 rounded-full border-2 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300"
            >
              Load More Ideas
            </Button>
          </div>

       
        </div>
      </main>

      <FooterSection />
    </div>
  );
}
