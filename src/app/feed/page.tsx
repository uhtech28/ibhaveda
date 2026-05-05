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
import { MessageCircle } from "lucide-react";
import { CommentsSection } from "@/components/comments/CommentsSection";
import { ContributionRequestModal } from "@/components/requests/ContributionRequestModal";
import { useToast } from "@/components/ui/use-toast";
import { useProfileCompletion } from "@/lib/hooks/use-profile-completion";

export default function FeedPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { isComplete: isProfileComplete, isLoading: isProfileLoading } = useProfileCompletion();
  const currentUser = useQuery(api.users.getCurrentUser);
  const ideasQuery = useQuery(api.ideas.getPublicIdeas, { limit: 60 });
  const toggleSpark = useMutation(api.ideas.toggleSpark);

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
        description: "Add a bit more context so builders can discover and trust your ideas.",
        action: <Button size="sm" onClick={() => router.push("/profile-setup")}>Complete Profile</Button>,
        duration: 8000,
      });
    }
  }, [isLoaded, isProfileComplete, isProfileLoading, router, toast, userId]);

  const ideas = useMemo(() => (ideasQuery || []) as IdeaForgeIdea[], [ideasQuery]);

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
        mode="feed"
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
        isProfileComplete={isProfileComplete}
        onCompleteProfile={() => router.push("/profile-setup")}
      />

      <Dialog open={!!activeCommentIdea} onOpenChange={(open) => !open && setActiveCommentIdea(null)}>
        <DialogContent
          className="
            grid grid-rows-[auto_1fr] gap-0 overflow-hidden border-white/10 bg-[#0A0D12] p-0 text-white shadow-[0_24px_80px_rgba(3,7,18,0.65)]
            w-full max-w-[640px]
            h-[100dvh] max-h-[100dvh] rounded-none
            sm:h-[min(85dvh,720px)] sm:max-h-[85dvh] sm:rounded-2xl
          "
        >
          {/* Header */}
          <header className="flex items-center gap-3 border-b border-white/8 bg-gradient-to-b from-[#141B2D] to-[#0F1524] px-5 py-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#6366F1]/25 to-[#8B5CF6]/15 ring-1 ring-[#6366F1]/30">
              <MessageCircle className="h-4.5 w-4.5 text-[#C7D2FE]" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="flex items-center gap-2 text-base font-semibold leading-tight text-white">
                <span>Comments</span>
                {activeCommentIdea && (
                  <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] font-medium text-[#9CA3AF]">
                    {activeCommentIdea.commentCount ?? 0}
                  </span>
                )}
              </DialogTitle>
              <p className="mt-0.5 truncate text-xs text-[#9CA3AF]">
                on <span className="text-[#E5E7EB]">{activeCommentIdea?.title}</span>
              </p>
            </div>
          </header>

          {/* Body — min-h-0 lets it shrink when keyboard appears */}
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
