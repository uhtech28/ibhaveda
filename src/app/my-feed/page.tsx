"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";

import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { IdeaForgeExperience } from "@/components/ideaforge/experience";
import { IdeaForgeIdea } from "@/components/ideaforge/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { MobilePopup } from "@/components/ui/mobile-popup";
import { MessageCircle, X } from "lucide-react";
import { CommentsSection } from "@/components/comments/CommentsSection";
import { ContributionRequestModal } from "@/components/requests/ContributionRequestModal";
import { useToast } from "@/components/ui/use-toast";
import { useProfileCompletion } from "@/lib/hooks/use-profile-completion";
import { useMobilePopupMode, useMobileVisualViewport } from "@/lib/hooks/use-mobile-visual-viewport";

export const dynamic = "force-dynamic";

export default function MyFeedPage() {
  useMobileVisualViewport();
  const isMobilePopup = useMobilePopupMode();

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
  const [commentsKeyboardOpen, setCommentsKeyboardOpen] = useState(false);
  const [contributionKeyboardOpen, setContributionKeyboardOpen] = useState(false);

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
          return await toggleSpark({ ideaId: ideaId as Id<"ideas"> });
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

      {isMobilePopup && activeCommentIdea && (
        <MobilePopup
          onClose={() => {
            setActiveCommentIdea(null);
            setCommentsKeyboardOpen(false);
          }}
          className="grid min-w-0 grid-rows-[auto_1fr] gap-0 overflow-hidden bg-[#0A0D12] p-0 text-white"
          style={{ height: commentsKeyboardOpen ? 'var(--app-vv-comments-keyboard-height, min(82dvh, 28rem))' : 'var(--app-vv-comments-height, min(76dvh, 43rem))' }}
        >
          <header className="flex min-w-0 items-center gap-3 border-b border-white/8 bg-gradient-to-b from-[#141B2D] to-[#0F1524] px-4 py-0 h-14">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#6366F1]/25 to-[#8B5CF6]/15 ring-1 ring-[#6366F1]/30">
              <MessageCircle className="h-5 w-5 text-[#C7D2FE]" />
            </div>
            <h2 className="min-w-0 flex-1 truncate text-base font-semibold leading-tight text-white">
              <Link
                href={`/idea/${activeCommentIdea._id}`}
                className="block max-w-full truncate transition-colors hover:text-[#C7D2FE]"
                onClick={() => setActiveCommentIdea(null)}
              >
                {activeCommentIdea.title}
              </Link>
            </h2>
            <button
              type="button"
              onClick={() => {
                setActiveCommentIdea(null);
                setCommentsKeyboardOpen(false);
              }}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-white/65 transition hover:bg-white/10 hover:text-white"
              aria-label="Close comments"
            >
              <X className="h-4 w-4" />
            </button>
          </header>
          <div
            className="min-h-0 min-w-0 overflow-hidden px-4 py-3"
            onFocus={(event) => {
              if (event.target instanceof HTMLTextAreaElement) setCommentsKeyboardOpen(true);
            }}
            onBlur={(event) => {
              if (event.target instanceof HTMLTextAreaElement) setCommentsKeyboardOpen(false);
            }}
          >
            <CommentsSection
              ideaId={activeCommentIdea._id as Id<"ideas">}
              commentCount={activeCommentIdea.commentCount || 0}
            />
          </div>
        </MobilePopup>
      )}

      {!isMobilePopup && (
      <Dialog
        open={!!activeCommentIdea}
        onOpenChange={(open) => {
          if (!open) {
            setActiveCommentIdea(null);
            setCommentsKeyboardOpen(false);
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          onFocus={(event) => {
            if (event.target instanceof HTMLTextAreaElement) setCommentsKeyboardOpen(true);
          }}
          onBlur={(event) => {
            if (event.target instanceof HTMLTextAreaElement) setCommentsKeyboardOpen(false);
          }}
          className={`
            mobile-comments-dialog
            ${commentsKeyboardOpen ? "mobile-comments-dialog--keyboard" : ""}
            grid min-w-0 grid-rows-[auto_1fr] gap-0 overflow-hidden border-white/10 bg-[#0A0D12] p-0 text-white shadow-[0_24px_80px_rgba(3,7,18,0.65)]
            w-full max-w-[640px] sm:w-[min(calc(100vw-2rem),640px)]
            h-[100dvh] max-h-[100dvh] rounded-none
            sm:h-[min(85dvh,720px)] sm:max-h-[85dvh] sm:rounded-2xl
          `}
        >
          <header className="flex min-w-0 items-center gap-3 border-b border-white/8 bg-gradient-to-b from-[#141B2D] to-[#0F1524] px-5 py-4 max-sm:h-14 max-sm:px-4 max-sm:py-0">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#6366F1]/25 to-[#8B5CF6]/15 ring-1 ring-[#6366F1]/30 max-sm:h-9 max-sm:w-9">
              <MessageCircle className="h-5 w-5 text-[#C7D2FE]" />
            </div>
            <DialogTitle className="min-w-0 flex-1 truncate text-base font-semibold leading-tight text-white">
              {activeCommentIdea && (
                <Link
                  href={`/idea/${activeCommentIdea._id}`}
                  className="block max-w-full truncate transition-colors hover:text-[#C7D2FE]"
                  onClick={() => setActiveCommentIdea(null)}
                >
                  {activeCommentIdea.title}
                </Link>
              )}
            </DialogTitle>
            <DialogClose className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-white/65 transition hover:bg-white/10 hover:text-white" aria-label="Close comments">
              <X className="h-4 w-4" />
            </DialogClose>
          </header>
          <div className="min-h-0 min-w-0 overflow-hidden px-5 py-4 max-sm:px-4 max-sm:py-3">
            {activeCommentIdea && (
              <CommentsSection
                ideaId={activeCommentIdea._id as Id<"ideas">}
                commentCount={activeCommentIdea.commentCount || 0}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
      )}

      {isMobilePopup && activeContributeIdea && (
        <MobilePopup
          onClose={() => {
            setActiveContributeIdea(null);
            setContributionKeyboardOpen(false);
          }}
          className={`mobile-contribution-request-dialog ${
            contributionKeyboardOpen ? "mobile-contribution-request-dialog--keyboard" : ""
          } overflow-y-auto border-white/10 bg-[#111827] p-6 text-white`}
          style={{ maxHeight: contributionKeyboardOpen ? 'var(--app-vv-contribution-keyboard-height, min(90dvh, 24.375rem))' : 'var(--app-vv-contribution-height, min(78dvh, 34rem))' }}
        >
          <div
            onFocus={(event) => {
              if (event.target instanceof HTMLTextAreaElement) setContributionKeyboardOpen(true);
            }}
            onBlur={(event) => {
              if (event.target instanceof HTMLTextAreaElement) setContributionKeyboardOpen(false);
            }}
          >
            <ContributionRequestModal
              ideaId={activeContributeIdea._id as Id<"ideas">}
              ideaTitle={activeContributeIdea.title}
              authorName={activeContributeIdea.author?.displayName || activeContributeIdea.author?.name || activeContributeIdea.author?.username}
              authorUsername={activeContributeIdea.author?.username}
              authorAvatar={activeContributeIdea.author?.avatar}
              onClose={() => {
                setActiveContributeIdea(null);
                setContributionKeyboardOpen(false);
              }}
            />
          </div>
        </MobilePopup>
      )}

      {!isMobilePopup && (
      <Dialog
        open={!!activeContributeIdea}
        onOpenChange={(open) => {
          if (!open) {
            setActiveContributeIdea(null);
            setContributionKeyboardOpen(false);
          }
        }}
      >
        <DialogContent
          onFocus={(event) => {
            if (event.target instanceof HTMLTextAreaElement) setContributionKeyboardOpen(true);
          }}
          onBlur={(event) => {
            if (event.target instanceof HTMLTextAreaElement) setContributionKeyboardOpen(false);
          }}
          className={`mobile-contribution-request-dialog ${contributionKeyboardOpen ? "mobile-contribution-request-dialog--keyboard" : ""} w-[min(92vw,560px)] max-w-[560px] overflow-hidden border-white/10 bg-[#111827] text-white`}
        >
          {activeContributeIdea && (
            <ContributionRequestModal
              ideaId={activeContributeIdea._id as Id<"ideas">}
              ideaTitle={activeContributeIdea.title}
              authorName={activeContributeIdea.author?.displayName || activeContributeIdea.author?.name || activeContributeIdea.author?.username}
              authorUsername={activeContributeIdea.author?.username}
              authorAvatar={activeContributeIdea.author?.avatar}
              onClose={() => {
                setActiveContributeIdea(null);
                setContributionKeyboardOpen(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      )}
    </>
  );
}
