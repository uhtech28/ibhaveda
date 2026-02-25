"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
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
}

export const ContributionDashboard: React.FC<ContributionDashboardProps> = ({
  ideaId,
  ideaTitle,
  authorName,
  isAuthor,
  onClose,
}) => {
  const { userId } = useAuth();
  const incomingRequests = useQuery(api.contributionRequests.getRequestsByIdea, { ideaId });

  if (isAuthor) {
    return (
      <div className="max-w-4xl mx-auto mt-8">
        <div className="bg-card border border-border rounded-xl p-6 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Incoming Requests</h3>
            <Link href={`/profile/contribution-requests/${ideaId}`}>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                View All
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </Button>
            </Link>
          </div>
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
            <p className="text-muted-foreground py-4">
              No contribution requests received yet.
            </p>
          )}
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
