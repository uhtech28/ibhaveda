"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Spinner } from "@/components/ui/spinner";
import { IncomingRequestCard } from "./IncomingRequestCard";
import { ContributionRequestModal } from "./ContributionRequestModal";
import { useAuth } from "@clerk/nextjs";

interface ContributionDashboardProps {
  ideaId: Id<"ideas">;
  ideaTitle: string;
  authorId: string;
  authorName?: string;
  isAuthor: boolean;
  onClose: () => void;
  /** When true, render bare list without outer card wrapper or section heading.
   * Useful when this is rendered inside a tab panel. */
  embedded?: boolean;
}

export const ContributionDashboard: React.FC<ContributionDashboardProps> = ({
  ideaId,
  ideaTitle,
  authorName,
  isAuthor,
  onClose,
  embedded = false,
}) => {
  const { userId } = useAuth();
  const incomingRequests = useQuery(api.contributionRequests.getRequestsByIdea, { ideaId });

  if (isAuthor) {
    const list = (
      <>
        {incomingRequests === undefined ? (
          <div className="text-center py-4">
            <Spinner size={24} />
            <p className="text-muted-foreground mt-2">Loading requests...</p>
          </div>
        ) : incomingRequests && incomingRequests.length > 0 ? (
          <div className="space-y-4">
            {incomingRequests.map((request) => (
              <IncomingRequestCard key={request._id} request={request} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground py-4 text-sm">
            No contribution requests received yet.
          </p>
        )}
      </>
    );

    if (embedded) return list;

    return (
      <div className="max-w-4xl mx-auto mt-8">
        <div className="bg-card border border-border rounded-xl p-6 transition-colors">
          <h3 className="text-lg font-semibold mb-4">Incoming Requests</h3>
          {list}
        </div>
      </div>
    );
  }

  // For non-authors (contributors)
  if (!userId) return null;

  return (
    <ContributionRequestModal
      ideaId={ideaId}
      ideaTitle={ideaTitle}
      authorName={authorName}
      onClose={onClose}
    />
  );
};
