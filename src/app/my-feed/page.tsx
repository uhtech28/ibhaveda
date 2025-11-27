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
import { IdeaGridCard } from "@/components/IdeaGridCard";

export default function MyFeedPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // Profile completion check
  const { isComplete: isProfileComplete, isLoading: isProfileLoading } = useProfileCompletion();

  // Filter states
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

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
        <div className="max-w-5xl mx-auto">
          {/* Header Section - Simplified to match Feed */}
          <div className="flex flex-col gap-2 mb-12">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              My Feed
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      </main>

      <FooterSection />
    </div>
  );
}