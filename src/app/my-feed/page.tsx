"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";

import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { IdeaForgeExperience } from "@/components/ideaforge/experience";
import { IdeaForgeIdea } from "@/components/ideaforge/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { CommentsSection } from "@/components/comments/CommentsSection";
import { ContributionRequestModal } from "@/components/requests/ContributionRequestModal";
import { useToast } from "@/components/ui/use-toast";
import { useProfileCompletion } from "@/lib/hooks/use-profile-completion";

export const dynamic = "force-dynamic";

export default function MyFeedPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { isComplete: isProfileComplete, isLoading: isProfileLoading } = useProfileCompletion();
  const currentUser = useQuery(api.users.getCurrentUser);
  const ideasQuery = useQuery(api.ideas.getUserIdeas);
  const toggleSpark = useMutation(api.ideas.toggleSpark);
  const deleteIdea = useMutation(api.ideas.deleteIdea);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCommentIdea, setActiveCommentIdea] = useState<IdeaForgeIdea | null>(null);
  const [activeContributeIdea, setActiveContributeIdea] = useState<IdeaForgeIdea | null>(null);

  useEffect(() => {
    if (isLoaded && !userId) {
      router.push("/");
    }
  }, [isLoaded, router, userId]);

  useEffect(() => {
    if (isLoaded && userId && !isProfileLoading && !isProfileComplete) {
      toast({
        title: "Complete your profile",
        description: "A fuller profile helps people understand who is building these ideas.",
        action: <Button size="sm" onClick={() => router.push("/profile-setup")}>Complete Profile</Button>,
        duration: 8000,
      });
    }
  }, [isLoaded, isProfileComplete, isProfileLoading, router, toast, userId]);

  const ideas = useMemo(() => {
    return ((ideasQuery || []) as IdeaForgeIdea[]).map((idea) => ({
      ...idea,
      author: currentUser
        ? {
            _id: currentUser._id,
            displayName: currentUser.displayName,
            name: currentUser.displayName,
            username: currentUser.username,
            avatar: currentUser.avatar,
            role: currentUser.role,
          }
        : idea.author,
    }));
  }, [currentUser, ideasQuery]);

  if (!isLoaded || !userId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0D12]">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-[#6366F1]" />
      </div>
    );
  }

  return (
    <>
      <IdeaForgeExperience
        mode="my-ideas"
        currentUser={currentUser || null}
        ideas={ideas}
        isLoading={ideasQuery === undefined}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSpark={async (ideaId) => {
          await toggleSpark({ ideaId: ideaId as Id<"ideas"> });
        }}
        onIdeaClick={(ideaId) => router.push(`/idea/${ideaId}`)}
        onCommentClick={(ideaId) => {
          const idea = ideas.find((entry) => entry._id === ideaId);
          if (idea) setActiveCommentIdea(idea);
        }}
        onContributeClick={(ideaId) => {
          const idea = ideas.find((entry) => entry._id === ideaId);
          if (idea) setActiveContributeIdea(idea);
        }}
        onDeleteIdea={async (ideaId) => {
          if (!window.confirm("Delete this idea? This keeps the record private and removes it from public feeds.")) {
            return;
          }
          await deleteIdea({ ideaId: ideaId as Id<"ideas"> });
        }}
        isProfileComplete={isProfileComplete}
        onCompleteProfile={() => router.push("/profile-setup")}
      />

      <Dialog open={!!activeCommentIdea} onOpenChange={(open) => !open && setActiveCommentIdea(null)}>
        <DialogContent
          className="
            grid grid-rows-[auto_1fr] gap-0 overflow-hidden border-white/10 bg-[#111827] p-0 text-white
            w-full max-w-[600px]
            h-[100dvh] max-h-[100dvh] rounded-none
            sm:h-[min(85dvh,720px)] sm:max-h-[85dvh] sm:rounded-2xl
          "
        >
          <div className="border-b border-white/8 px-5 py-4">
            <DialogTitle className="text-xl font-semibold">Comments</DialogTitle>
            <p className="mt-0.5 truncate text-sm text-[#9CA3AF]">{activeCommentIdea?.title}</p>
          </div>
          <div className="min-h-0 px-5 py-4 overflow-hidden">
            {activeCommentIdea && (
              <CommentsSection
                ideaId={activeCommentIdea._id as Id<"ideas">}
                commentCount={activeCommentIdea.commentCount || 0}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!activeContributeIdea} onOpenChange={(open) => !open && setActiveContributeIdea(null)}>
        <DialogContent className="max-w-[500px] border-white/10 bg-[#111827] text-white">
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
    </>
  );
}
