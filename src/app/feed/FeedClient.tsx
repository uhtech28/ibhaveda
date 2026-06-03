"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useMutation, usePreloadedQuery } from "convex/react";
import { Preloaded } from "convex/react";

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
import { useQuery } from "convex/react";

export function FeedClient({
  preloadedIdeas,
}: {
  preloadedIdeas: Preloaded<typeof api.ideas.getPublicIdeas>;
}) {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { isComplete: isProfileComplete, isLoading: isProfileLoading } = useProfileCompletion();
  const currentUser = useQuery(api.users.getCurrentUser);

  const PAGE_SIZE = 20;
  const [limit, setLimit] = useState(PAGE_SIZE);

  // usePreloadedQuery gives us the SSR data immediately, then stays live
  const ideasQuery = usePreloadedQuery(preloadedIdeas);
  const toggleSpark = useMutation(api.ideas.toggleSpark);

  const hasMore = ideasQuery !== undefined && ideasQuery.length >= limit;

  function loadMore() {
    if (hasMore) setLimit((l) => l + PAGE_SIZE);
  }

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

  return (
    <>
      <IdeaForgeExperience
        mode="feed"
        currentUser={currentUser || null}
        ideas={ideas}
        isLoading={false}
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
        onLoadMore={loadMore}
        hasMore={hasMore}
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
          <header className="flex items-center gap-3 border-b border-white/8 bg-gradient-to-b from-[#141B2D] to-[#0F1524] px-5 py-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#6366F1]/25 to-[#8B5CF6]/15 ring-1 ring-[#6366F1]/30">
              <MessageCircle className="h-5 w-5 text-[#C7D2FE]" />
            </div>
            <DialogTitle className="min-w-0 flex-1 truncate text-base font-semibold leading-tight text-white">
              {activeCommentIdea?.title}
            </DialogTitle>
          </header>
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
              authorName={activeContributeIdea.author?.displayName || activeContributeIdea.author?.name || activeContributeIdea.author?.username}
              authorUsername={activeContributeIdea.author?.username}
              authorAvatar={activeContributeIdea.author?.avatar}
              onClose={() => setActiveContributeIdea(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
