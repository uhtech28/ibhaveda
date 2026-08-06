"use client";

import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type ContributionRequest = {
  _id: Id<"contributionRequests">;
  status: 'pending' | 'accepted' | 'rejected';
  message: string;
  contributor: { name: string; username: string; } | null;
};

export const IncomingRequestCard: React.FC<{ request: ContributionRequest }> = ({ request }) => {
  const updateStatusMutation = useMutation(api.contributionRequests.updateRequestStatus);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusUpdate = async (status: "accepted" | "rejected") => {
    try {
      setIsUpdating(true);
      await updateStatusMutation({ requestId: request._id, status });
    } catch (error) {
      console.error("Failed to update request status:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="border border-border rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarFallback>
              {request.contributor?.name?.charAt(0).toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{request.contributor?.name || "Unknown"}</p>
            <p className="text-sm text-muted-foreground">@{request.contributor?.username || "unknown"}</p>
          </div>
        </div>
        <Badge variant={request.status === "accepted" ? "default" : request.status === "rejected" ? "destructive" : "secondary"}>
          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
        </Badge>
      </div>
      <p className="text-sm mt-2">{request.message}</p>
      {request.status === "pending" && (
        <div className="flex gap-2 mt-3">
          <Button
            size="sm"
            onClick={() => handleStatusUpdate("accepted")}
            disabled={isUpdating}
            className="bg-green-600 hover:bg-green-700"
          >
            {isUpdating ? <Spinner size={14} /> : "Accept"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleStatusUpdate("rejected")}
            disabled={isUpdating}
          >
            {isUpdating ? <Spinner size={14} /> : "Reject"}
          </Button>
        </div>
      )}
    </div>
  );
};
