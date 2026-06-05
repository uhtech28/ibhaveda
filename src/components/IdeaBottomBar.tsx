import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, Sparkles, UserPlus } from "lucide-react";
import ParticleButton from "@/components/kokonutui/particle-button";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useAuth } from "@clerk/nextjs";
import { Spinner } from "@/components/ui/spinner";
import { SparkersDialog, ContributorsDialog } from "@/components/engagement";


interface IdeaBottomBarProps {
  ideaId: string;
  initialSparkCount: number;
  initialHasSparked: boolean;
  commentCount: number;
  onOpenComments: () => void;
  onOpenRequests: () => void;
  isAuthor: boolean;
  requestCount?: number;
  variant?: "floating" | "inline";
}

export function IdeaBottomBar({
  ideaId,
  initialSparkCount,
  initialHasSparked,
  commentCount,
  onOpenComments,
  onOpenRequests,
  isAuthor,
  requestCount = 0,
  variant = "floating",
}: IdeaBottomBarProps) {
  const { userId } = useAuth();
  const toggleSparkMutation = useMutation(api.ideas.toggleSpark);

  // Live contributor count — same query the feed uses, so the number on the
  // detail page matches what users see on the idea card.
  const contributors = useQuery(api.contributionRequests.getAcceptedContributors, {
    ideaId: ideaId as Id<"ideas">,
  });
  const contributorCount = (contributors?.length ?? 0) + 1;

  const [isSparking, setIsSparking] = useState(false);
  const [currentSparkCount, setCurrentSparkCount] = useState(initialSparkCount);
  const [currentHasSparked, setCurrentHasSparked] = useState(initialHasSparked);

  // PRD §8 popups
  const [sparkersOpen, setSparkersOpen] = useState(false);
  const [contributorsOpen, setContributorsOpen] = useState(false);

  useEffect(() => {
    setCurrentSparkCount(initialSparkCount);
    setCurrentHasSparked(initialHasSparked);
  }, [initialHasSparked, initialSparkCount]);

  const handleSpark = async () => {
    if (!userId || isSparking) return;

    setIsSparking(true);

    try {
      const result = await toggleSparkMutation({ ideaId: ideaId as Id<"ideas"> });
      setCurrentSparkCount(result.sparkCount);
      setCurrentHasSparked(result.action === 'added');
    } catch (error) {
      console.error('Error toggling spark:', error);
    } finally {
      setIsSparking(false);
    }
  };

  const containerClasses = variant === "floating"
    ? "fixed bottom-6 left-1/2 -translate-x-1/2 bg-background/95 backdrop-blur-md border border-border/50 rounded-full shadow-2xl px-2 py-2 flex items-center gap-2 z-50 ring-1 ring-black/5"
    : "flex items-center justify-center gap-2 py-4 border-t border-border/50 bg-transparent";

  return (
    <div className={containerClasses}>
      {/* Spark cluster — icon sparks; count opens the sparkers popup (PRD §8 AC1) */}
      <div className="flex items-center gap-0.5">
        <ParticleButton
          variant="ghost"
          size="sm"
          onSuccess={handleSpark}
          disabled={!userId || isSparking}
          aria-label={currentHasSparked ? "Remove spark" : "Spark this idea"}
          title={currentHasSparked ? "Remove spark" : "Spark this idea"}
          className={`
            rounded-full h-10 w-10 p-0 transition-all duration-300
            ${currentHasSparked
              ? 'bg-[#111827] text-orange-300 shadow-[0_0_14px_rgba(251,146,60,0.12)] hover:bg-[#172033] hover:text-orange-200'
              : 'bg-transparent text-orange-300 hover:bg-[#111827] hover:text-orange-200'
            }
          `}
        >
          {isSparking ? (
            <Spinner size={16} className="text-orange-300" />
          ) : (
            <Sparkles className={`w-4 h-4 text-orange-300 ${currentHasSparked ? "fill-current" : ""}`} />
          )}
        </ParticleButton>
        <button
          type="button"
          onClick={() => {
            if (currentSparkCount > 0) setSparkersOpen(true);
          }}
          disabled={currentSparkCount === 0}
          title={currentSparkCount > 0 ? "See who sparked this" : undefined}
          className="rounded-full h-10 px-3 text-sm font-semibold text-orange-300 hover:bg-[#111827] hover:text-orange-200 hover:underline transition-colors disabled:cursor-default disabled:opacity-70 disabled:no-underline disabled:hover:bg-transparent disabled:hover:text-orange-300"
        >
          {currentSparkCount}
        </button>
      </div>

      <div className="w-px h-6 bg-border/40 mx-1" />

      {/* Comment Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onOpenComments}
        className="rounded-full px-4 h-10 gap-2 bg-[#111827] text-blue-300 hover:bg-[#172033] hover:text-blue-200 transition-colors"
      >
        <MessageCircle className="w-4 h-4 text-blue-300" />
        <span className="font-semibold text-sm">{commentCount}</span>
      </Button>

      <div className="w-px h-6 bg-border/40 mx-1" />

      {/* Contribute cluster — icon opens requests/contribute flow,
       * count opens the contributor popup (PRD §8 AC2). */}
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenRequests}
          aria-label={isAuthor ? "View contribution requests" : "Contribute"}
          title={isAuthor ? "Contribution requests" : "Contribute"}
          className="rounded-full h-10 w-10 p-0 bg-transparent text-emerald-300 hover:bg-[#111827] hover:text-emerald-200 transition-colors relative"
        >
          <UserPlus className="w-4 h-4 text-emerald-300" />
          {isAuthor && requestCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold ring-2 ring-background">
              {requestCount}
            </span>
          )}
        </Button>
        <button
          type="button"
          onClick={() => setContributorsOpen(true)}
          title="See who's contributing"
          className="rounded-full h-10 px-3 text-sm font-semibold text-emerald-300 hover:bg-[#111827] hover:text-emerald-200 hover:underline transition-colors"
        >
          {contributorCount}
        </button>
      </div>

      {/* PRD §8 popups */}
      <SparkersDialog
        ideaId={sparkersOpen ? (ideaId as Id<"ideas">) : null}
        onOpenChange={(open) => setSparkersOpen(open)}
      />
      <ContributorsDialog
        ideaId={contributorsOpen ? (ideaId as Id<"ideas">) : null}
        onOpenChange={(open) => setContributorsOpen(open)}
      />
    </div>
  );
}
