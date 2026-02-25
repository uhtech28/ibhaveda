"use client";

import React, { useState } from "react";

export const dynamic = 'force-dynamic';
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { HeroHeader } from "@/components/header";
import FooterSection from "@/components/footer";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useProfileCompletion } from "@/lib/hooks/use-profile-completion";
import { useToast } from "@/components/ui/use-toast";
import { RightSidebar } from "@/components/RightSidebar";
import { IdeaGridCard, ConvexIdea } from "@/components/IdeaGridCard";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CommentsSection } from "@/components/comments/CommentsSection";
import { ContributionRequestModal } from "@/components/requests/ContributionRequestModal";

export default function MyFeedPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // Profile completion check
  const { isComplete: isProfileComplete, isLoading: isProfileLoading } = useProfileCompletion();

  // Filter states
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCommentIdea, setActiveCommentIdea] = useState<ConvexIdea | null>(null);
  const [activeContributeIdea, setActiveContributeIdea] = useState<ConvexIdea | null>(null);

  // Fetch user's ideas from Convex
  const ideasQuery = useQuery(api.ideas.getUserIdeas);

  const toggleSparkMutation = useMutation(api.ideas.toggleSpark);

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
  const ideas = ideasQuery || [];
  const filteredIdeas = ideas.filter((idea) => {
    if (selectedCategories.length === 0) return true;
    // Assuming category is comma-separated string
    const ideaCategories = idea.category ? idea.category.split(',').map(c => c.trim()) : [];
    return selectedCategories.some(selected => ideaCategories.includes(selected));
  });

  const isLoading = ideasQuery === undefined;

  const handleCommentClick = (ideaId: string) => {
    const idea = ideas.find(i => i._id === ideaId);
    if (idea) {
      // Construct full idea object for local user
      const fullIdea = {
        ...idea,
        author: {
          _id: userId,
          name: 'You',
          username: '',
        }
      } as unknown as ConvexIdea;
      setActiveCommentIdea(fullIdea);
    }
  };

  const handleContributeClick = (ideaId: string) => {
    const idea = ideas.find(i => i._id === ideaId);
    if (idea) {
      const fullIdea = {
        ...idea,
        author: {
          _id: userId,
          name: 'You',
          username: '',
        }
      } as unknown as ConvexIdea;
      setActiveContributeIdea(fullIdea);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <HeroHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <main className="flex-1 w-full py-12 pt-32">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">

          {/* Right Sidebar - Positioned relative to content */}
          <div className="absolute top-0 -right-24 h-full hidden xl:block z-50">
            <div className="sticky top-32">
              <RightSidebar
                filterOpen={filterOpen}
                setFilterOpen={setFilterOpen}
                selectedCategories={selectedCategories}
                setSelectedCategories={setSelectedCategories}
              />
            </div>
          </div>

          {/* Header Section - Simplified to match Feed */}
          <div className="flex flex-col gap-2 mb-12">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              My Ideas
            </h1>
            <p className="text-muted-foreground">Your personal collection of ideas and contributions</p>
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

          {/* Ideas Grid - Max 3 columns to match Feed */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {isLoading ? (
              // Loading state
              <div className="col-span-full text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading your ideas...</p>
              </div>
            ) : filteredIdeas.length > 0 ? (
              filteredIdeas.map((idea) => (
                <IdeaGridCard
                  key={idea._id}
                  idea={{
                    ...idea,
                    author: {
                      _id: userId,
                      name: 'You',
                      username: '',
                    }
                  }}
                  onClick={() => handleIdeaClick(idea._id)}
                  onSpark={handleSpark}
                  contributorsCount={idea.activeContributions || 0}
                  onTagClick={(tag) => setSearchQuery(tag)}
                  onCommentClick={handleCommentClick}
                  onContributeClick={handleContributeClick}
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
                <p className="text-muted-foreground mb-4">You haven't created any ideas yet. Start by sharing your brilliant concept!</p>
              </div>
            )}
          </div>

        </div>

        {/* Comments Dialog */}
        <Dialog open={!!activeCommentIdea} onOpenChange={(open) => !open && setActiveCommentIdea(null)}>
          <DialogContent className="sm:max-w-[600px] h-[85vh] flex flex-col p-4 sm:p-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold">Comments</h2>
              <p className="text-sm text-muted-foreground">
                {activeCommentIdea?.title}
              </p>
            </div>
            {activeCommentIdea && (
              <CommentsSection
                ideaId={activeCommentIdea._id as Id<"ideas">}
                commentCount={activeCommentIdea.commentCount || 0}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Contribution Request Dialog */}
        <Dialog open={!!activeContributeIdea} onOpenChange={(open) => !open && setActiveContributeIdea(null)}>
          <DialogContent className="sm:max-w-[500px]">
            {activeContributeIdea && (
              <ContributionRequestModal
                ideaId={activeContributeIdea._id as Id<"ideas">}
                ideaTitle={activeContributeIdea.title}
                authorName={activeContributeIdea.author?.name || activeContributeIdea.author?.username}
                onClose={() => setActiveContributeIdea(null)}
              />
            )}
          </DialogContent>
        </Dialog>
      </main>

      <FooterSection />
    </div>
  );
}