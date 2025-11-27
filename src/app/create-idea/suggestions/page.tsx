"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { HeroHeader } from "@/components/header";
import FooterSection from "@/components/footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, CheckCircle, Sparkles } from "lucide-react";
import { CollaboratorCard } from "./CollaboratorCard";
import { motion } from "framer-motion";

// Import UserProfile interface
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

  // State for suggestions
  const [isLoading, setIsLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<UserProfile[]>([]);
  const [invitedUsers, setInvitedUsers] = useState<Set<string>>(new Set());

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

  const handleInvite = (userId: string) => {
    // TODO: Implement actual invitation logic
    setInvitedUsers(prev => new Set(prev).add(userId));
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

      <main className="flex-1 container mx-auto px-4 py-12 pt-24">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12"
          >
            <div className="flex flex-col gap-2 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 text-primary font-medium mb-1">
                <Sparkles className="w-4 h-4" />
                <span>AI-Powered Suggestions</span>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Suggested Collaborators
              </h1>
              <p className="text-muted-foreground max-w-xl">
                We found these talented individuals based on your idea's requirements. 
                Connect with them to bring your vision to life.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleBack} className="rounded-full border-border/60">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleFinish} className="bg-primary hover:bg-primary/90 rounded-full shadow-lg shadow-primary/20 px-6">
                <CheckCircle className="w-4 h-4 mr-2" />
                Finish Setup
              </Button>
            </div>
          </motion.div>

          {/* Main Content */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-[300px] rounded-3xl bg-muted/20 animate-pulse border border-border/40" />
              ))}
            </div>
          ) : suggestions.length > 0 ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Found {suggestions.length} potential matches
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {suggestions.map((profile, index) => (
                  <motion.div
                    key={profile._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <CollaboratorCard 
                      profile={profile} 
                      onInvite={handleInvite}
                      isInvited={invitedUsers.has(profile._id)}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 bg-muted/10 rounded-3xl border border-border/40">
              <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">No matches found yet</h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                We couldn't find any users matching your specific criteria right now.
                Try adjusting your skills or industries to find more people.
              </p>
              <Button onClick={handleBack} variant="outline" className="rounded-full">
                Adjust Criteria
              </Button>
            </div>
          )}
        </div>
      </main>

      <FooterSection />
    </div>
  );
}