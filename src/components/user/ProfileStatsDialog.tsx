"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Sparkles, UserPlus, Lightbulb } from "lucide-react";
import { useRouter } from "next/navigation";

interface ProfileStatsDialogProps {
  userId: Id<"users">;
  type: "created" | "sparked" | "contributed" | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface IdeaWithDetails {
  _id: string;
  title: string;
  description: string;
  category?: string;
  createdAt: number;
  sparkCount?: number;
  contributionCount?: number;
  author?: {
    username: string;
    displayName: string;
  };
  sparkedAt?: number;
  contributedAt?: number;
}

export function ProfileStatsDialog({ userId, type, isOpen, onOpenChange }: ProfileStatsDialogProps) {
  const router = useRouter();

  // Determine which query to run based on type
  const createdIdeas = useQuery(api.ideas.getProfileIdeas, type === "created" ? { userId } : "skip");
  const sparkedIdeas = useQuery(api.ideas.getPublicSparkedIdeasForUser, type === "sparked" ? { userId } : "skip");
  const contributedIdeas = useQuery(api.ideas.getPublicContributedIdeasForUser, type === "contributed" ? { userId } : "skip");

  const ideas = (type === "created" ? createdIdeas : type === "sparked" ? sparkedIdeas : contributedIdeas) as IdeaWithDetails[] | undefined;
  const isLoading = ideas === undefined;

  const getTitle = () => {
    switch (type) {
      case "created": return "Created Ideas";
      case "sparked": return "Sparked Ideas";
      case "contributed": return "Contributed Ideas";
      default: return "";
    }
  };

  const handleIdeaClick = (ideaId: string) => {
    onOpenChange(false);
    router.push(`/idea/${ideaId}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-border/40">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            {getTitle()}
            {!isLoading && ideas && (
              <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-xs">
                {ideas.length}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-6 pt-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <div className="mb-4">
                <Spinner />
              </div>
              <p>Loading ideas...</p>
            </div>
          ) : ideas && ideas.length > 0 ? (
            <div className="space-y-2">
              {ideas.map((idea) => (
                <IdeaRow key={idea._id} idea={idea} onClick={() => handleIdeaClick(idea._id)} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/50">
              <div className="p-4 bg-muted/20 rounded-full mb-4">
                {type === 'created' ? <Lightbulb className="w-8 h-8 opacity-50" /> :
                 type === 'sparked' ? <Sparkles className="w-8 h-8 opacity-50" /> :
                 <UserPlus className="w-8 h-8 opacity-50" />}
              </div>
              <p className="text-base font-medium">No ideas found</p>
              <p className="text-sm max-w-xs text-center mt-1">
                {type === 'created' ? "This user hasn't created any public ideas yet." :
                 type === 'sparked' ? "This user hasn't sparked any public ideas yet." :
                 "This user hasn't contributed to any public ideas yet."}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Single row for an idea inside the stats dialog. Pulls live counts:
 * - sparks: from idea.sparkCount (denormalized into idea doc on toggle)
 * - contributors: from api.contributionRequests.getAcceptedContributors,
 *   the same query the feed uses, so the number is always accurate.
 */
function IdeaRow({
  idea,
  onClick,
}: {
  idea: IdeaWithDetails;
  onClick: () => void;
}) {
  const contributors = useQuery(api.contributionRequests.getAcceptedContributors, {
    ideaId: idea._id as Id<"ideas">,
  });
  // +1 to include the idea creator. Fall back to contributionCount (which the
  // backend already returns inclusive of the creator) while the live query loads.
  const contributorCount = contributors !== undefined
    ? contributors.length + 1
    : idea.contributionCount ?? 1;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full text-left flex items-center justify-between gap-3 p-3 rounded-lg border border-border/40 bg-card/40 hover:bg-muted/30 hover:border-primary/40 transition-all cursor-pointer"
    >
      <div className="flex flex-col min-w-0 flex-1">
        <h3 className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
          {idea.title || "Untitled"}
        </h3>
        {idea.author?.username && (
          <span className="text-xs text-muted-foreground truncate">
            @{idea.author.username}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span
          className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded-full"
          title="Sparks"
        >
          <Sparkles className="w-3 h-3 text-orange-500" />
          {idea.sparkCount ?? 0}
        </span>
        <span
          className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded-full"
          title="Contributors"
        >
          <UserPlus className="w-3 h-3 text-violet-500" />
          {contributorCount}
        </span>
      </div>
    </button>
  );
}
