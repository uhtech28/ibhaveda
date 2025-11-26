"use client"

import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { notifyRequestAccepted, notifyRequestRejected } from "@/components/requests/notification-toast";
import {
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

// Type for the request data from our query
export interface ContributionRequest {
  _id: string;
  message: string;
  status: string;
  createdAt: number;
  updatedAt: number;
  idea: {
    title: string;
    _id: string;
  } | null;
  author?: {
    displayName: string;
    username: string;
  } | null;
  contributor?: {
    displayName: string;
    username: string;
    avatar?: string;
  } | null;
}

interface RequestStatusCardProps {
  request: ContributionRequest;
  type?: "outgoing" | "incoming";
}

export function RequestStatusCard({ request, type = "outgoing" }: RequestStatusCardProps) {
  const prevStatus = useRef<string | null>(null);

  useEffect(() => {
    if (prevStatus.current && prevStatus.current !== request.status) {
      if (request.status === "accepted") {
        notifyRequestAccepted();
      } else if (request.status === "rejected") {
        notifyRequestRejected();
      }
    }
    prevStatus.current = request.status;
  }, [request.status]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "accepted":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Accepted
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Unknown
          </Badge>
        );
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const displayUser = type === "outgoing" ? request.author : request.contributor;
  const userLabel = type === "outgoing" ? "by" : "from";
  const messageLabel = type === "outgoing" ? "Your message:" : "Message:";

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback>
                {displayUser?.displayName?.charAt(0).toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{request.idea?.title || "Idea"}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {userLabel} @{displayUser?.username || "unknown"}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {getStatusBadge(request.status)}
            <span className="text-xs text-muted-foreground">
              {formatDate(request.updatedAt)}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm font-medium">{messageLabel}</p>
          <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
            {request.message.length > 100
              ? `${request.message.substring(0, 100)}...`
              : request.message
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}