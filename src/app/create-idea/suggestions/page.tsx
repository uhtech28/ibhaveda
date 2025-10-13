"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { HeroHeader } from "@/components/header";
import FooterSection from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompactProfileView } from "@/components/user/CompactProfileView";
import { ArrowLeft, Users, CheckCircle, Loader2 } from "lucide-react";

// Import UserProfile interface from CompactProfileView
interface UserProfile {
  _id: string;
  clerkId: string;
  username: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  industry?: string;
  skills: string[];
  completedOnboarding: boolean;
  createdAt: number;
  updatedAt: number;
  ideasCreated?: number;
  ideasSparked?: number;
  ideasContributed?: number;
}

export default function SuggestionsPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Extract skills and industries from URL params
  const skillsParam = searchParams.get('skills');
  const industriesParam = searchParams.get('industries');

  const skills = skillsParam ? skillsParam.split(',').map(s => s.trim()) : [];
  const industries = industriesParam ? industriesParam.split(',').map(i => i.trim()) : [];

  console.log('🎯 Suggestions page loaded with params:', {
    skillsParam,
    industriesParam,
    skills,
    industries
  });

  // State for suggestions
  const [isLoading, setIsLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<UserProfile[]>([]);

  // Fetch suggestions using Convex query
  const suggestedCollaborators = useQuery(
    api.users.getSuggestedCollaborators,
    skills.length > 0 || industries.length > 0
      ? {
          skills,
          industries,
          limit: 10,
          excludeUserId: userId || undefined // Exclude current user (Clerk ID)
        }
      : "skip"
  );

  // Update suggestions when query data changes
  useEffect(() => {
    if (suggestedCollaborators !== undefined) {
      setSuggestions(suggestedCollaborators);
      setIsLoading(false);
      console.log('👥 Suggestions loaded:', {
        count: suggestedCollaborators.length,
        suggestions: suggestedCollaborators.map(s => ({
          username: s.username,
          skills: s.skills,
          industry: s.industry
        }))
      });
    }
  }, [suggestedCollaborators]);

  // Redirect if not authenticated
  React.useEffect(() => {
    if (isLoaded && !userId) {
      router.push('/');
    }
  }, [isLoaded, userId, router]);

  // Handle finish - redirect to main feed
  const handleFinish = () => {
    router.push('/feed');
  };

  // Back to create idea
  const handleBack = () => {
    router.push('/create-idea');
  };

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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <HeroHeader />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header with Back Button and Finish */}
          <div className="flex items-center justify-between gap-4 mb-8 mt-6 md:mt-8">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Create Idea
            </Button>

            <Button onClick={handleFinish} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="w-4 h-4 mr-2" />
              Finish
            </Button>
          </div>

          {/* Main Content */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-3xl text-center flex items-center justify-center gap-2">
                <Users className="w-8 h-8" />
                Suggested Collaborators
              </CardTitle>
              <p className="text-center text-muted-foreground">
                Based on your idea's skills and industries, here are potential collaborators who might be interested in contributing.
              </p>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Finding great collaborators...</span>
                  </div>
                </div>
              ) : suggestions.length > 0 ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Found {suggestions.length} potential collaborator{suggestions.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                    {suggestions.map((profile) => (
                      <div key={profile._id} className="border rounded-lg p-4">
                        <CompactProfileView profile={profile} />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No suggestions found</h3>
                  <p className="text-muted-foreground mb-6">
                    We couldn't find any users matching your idea's skills and industries.
                    Try broadening your selections or check back later as more users join the platform.
                  </p>
                  <Button onClick={handleBack} variant="outline">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Adjust Idea Details
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <FooterSection />
    </div>
  );
}