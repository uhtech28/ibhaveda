"use client";

import React from "react";
import { useAuth, RedirectToSignIn } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  User,
  ExternalLink,
  Filter,
} from "lucide-react";

// Type for the request data from our query
interface ContributionRequest {
  _id: Id<"contributionRequests">;
  message: string;
  status: string;
  createdAt: number;
  updatedAt: number;
  ideaId: Id<"ideas">;
  contributor: {
    avatar?: string;
    name: string;
    username: string;
  } | null;
  author: {
    name: string;
    username: string;
  } | null;
}


export default function ContributionRequestsByIdeaPage({
  params
}: {
  params: Promise<{ ideaId: string }>
}) {
  const { isSignedIn, isLoaded, userId } = useAuth();
  const router = useRouter();
  const resolvedParams = React.use(params);
  const { ideaId } = resolvedParams;
  const { toast } = useToast();

  // State for filtering
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // State for rejection dialog
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionMessage, setRejectionMessage] = useState("");
  const [currentRequestId, setCurrentRequestId] = useState<Id<"contributionRequests"> | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Mutations
  const updateRequestStatus = useMutation(api.contributionRequests.updateRequestStatus);

  // Queries
  const ideaQuery = useQuery(api.ideas.getIdeaById, { ideaId: ideaId as Id<"ideas"> });
  const requestsQuery = useQuery(api.contributionRequests.getRequestsByIdea, { ideaId: ideaId as Id<"ideas"> });

  // Computed values
  const filteredRequests = requestsQuery
    ? requestsQuery.filter((request: ContributionRequest) =>
        statusFilter === 'all' || request.status === statusFilter
      )
    : [];

  console.log("DEBUG: isAuthor check", {
    userId: userId,
    ideaAuthorId: ideaQuery?.authorId,
    ideaId: ideaId
  });
  const isAuthor = ideaQuery && ideaQuery.authorId === userId;

  // Redirect if not authenticated
  if (!isLoaded) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  // Handle access control
  if (ideaQuery === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-muted-foreground mb-2">Idea Not Found</h2>
          <p className="text-muted-foreground mb-6">The idea you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!isAuthor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-muted-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-6">Only the idea author can manage contribution requests.</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/idea/${ideaId}`}>
                <ExternalLink className="w-4 h-4 mr-2" />
                View Idea
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleAccept = async (requestId: Id<"contributionRequests">) => {
    setLoadingAction(requestId);
    try {
      await updateRequestStatus({ requestId, status: "accepted" });
      toast({
        title: "Request Accepted",
        description: "The contribution request has been accepted successfully.",
      });
    } catch (error: unknown) {
      console.error("Failed to accept request:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? (error.message || "Failed to accept request. Please try again.") : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReject = async (requestId: Id<"contributionRequests">) => {
    if (rejectDialogOpen) {
      setLoadingAction(requestId);
      try {
        await updateRequestStatus({ requestId, status: "rejected" });
        setRejectDialogOpen(false);
        setRejectionMessage("");
        setCurrentRequestId(null);
        toast({
          title: "Request Rejected",
          description: "The contribution request has been rejected.",
        });
      } catch (error: unknown) {
        console.error("Failed to reject request:", error);
        toast({
          title: "Error",
          description: error instanceof Error ? (error.message || "Failed to reject request. Please try again.") : "An unknown error occurred",
          variant: "destructive",
        });
      } finally {
        setLoadingAction(null);
      }
    } else {
      setCurrentRequestId(requestId);
      setRejectDialogOpen(true);
    }
  };

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

  // Filter options
  const filterOptions = [
    { value: 'all', label: 'All Requests' },
    { value: 'pending', label: 'Pending' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          {ideaQuery && (
            <div className="mb-6">
              <Link href={`/idea/${ideaId}`}>
                <Button variant="outline" size="sm" className="flex items-center gap-2 mb-4">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Idea
                </Button>
              </Link>
              <div className="flex items-center gap-2 mb-2">
                <Link href={`/idea/${ideaId}`}>
                  <h1 className="text-2xl font-bold hover:underline cursor-pointer">
                    {ideaQuery.title}
                  </h1>
                </Link>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                Manage contribution requests for this idea
              </p>
            </div>
          )}

          {/* Filter Buttons */}
          <div className="flex items-center gap-2 mb-6">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground mr-2">Filter:</span>
            {filterOptions.map(({ value, label }) => (
              <Button
                key={value}
                variant={statusFilter === value ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(value)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Requests List */}
        {(requestsQuery && filteredRequests.length > 0) ? (
          <div className="space-y-4">
            {filteredRequests.map((request: ContributionRequest) => (
              <Card key={request._id} className="w-full hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {request.contributor && (
                        <>
                          <Avatar className="w-10 h-10">
                            <AvatarImage
                              src={request.contributor.avatar}
                              alt={request.contributor.name}
                            />
                            <AvatarFallback>
                              {request.contributor.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-lg">{request.contributor.name}</p>
                            <p className="text-sm text-muted-foreground">
                              @{request.contributor.username}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(request.status)}
                      <span className="text-sm text-muted-foreground">
                        {formatDate(request.createdAt)}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Request Message */}
                    <div>
                      <p className="text-sm font-medium mb-2">Contribution Request:</p>
                      <div className="bg-muted/50 p-4 rounded-lg border">
                        <p className="text-sm">{request.message}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {request.status === "pending" && (
                      <div className="flex gap-3 pt-3 border-t">
                        <Button
                          onClick={() => handleAccept(request._id)}
                          disabled={loadingAction === request._id}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                        >
                          {loadingAction === request._id ? <Spinner size={16} /> : <CheckCircle className="w-4 h-4" />}
                          {loadingAction === request._id ? "Accepting..." : "Accept Request"}
                        </Button>
                        <Button
                          onClick={() => handleReject(request._id)}
                          disabled={loadingAction === request._id}
                          className="flex-1 flex items-center gap-2"
                          variant="destructive"
                        >
                          {loadingAction === request._id ? <Spinner size={16} /> : <XCircle className="w-4 h-4" />}
                          {loadingAction === request._id ? "Rejecting..." : "Reject"}
                        </Button>
                      </div>
                    )}

                    {request.status !== "pending" && (
                      <div className="flex items-center justify-center gap-2 pt-3 border-t text-muted-foreground">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          Request {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                        {request.updatedAt !== request.createdAt && (
                          <span className="text-xs">
                            {formatDate(request.updatedAt)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : requestsQuery ? (
          /* Empty State */
          <div className="text-center py-12">
            <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-muted-foreground mb-2">
              {statusFilter === 'all'
                ? "No contribution requests yet"
                : `No ${statusFilter} requests ${statusFilter !== 'pending' ? 'yet' : ''}`
              }
            </h2>
            <p className="text-muted-foreground">
              {statusFilter === 'all'
                ? "When contributors request to help with this idea, they will appear here."
                : `No ${statusFilter} contribution requests for this idea yet.`
              }
            </p>
            {statusFilter !== 'all' && (
              <Button
                variant="outline"
                onClick={() => setStatusFilter('all')}
                className="mt-4"
              >
                Show All Requests
              </Button>
            )}
          </div>
        ) : (
          /* Loading State */
          <div className="flex items-center justify-center py-12">
            <Spinner size={40} />
            <p className="ml-4 text-muted-foreground">Loading requests...</p>
          </div>
        )}

        {/* Rejection Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Contribution Request</DialogTitle>
              <DialogDescription>
                Are you sure you want to reject this contribution request? Providing a reason is optional but helps the contributor understand your decision.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <label htmlFor="rejection-reason" className="text-sm font-medium mb-2 block">
                Rejection Reason (Optional)
              </label>
              <Textarea
                id="rejection-reason"
                placeholder="Let them know why you're declining their request..."
                value={rejectionMessage}
                onChange={(e) => setRejectionMessage(e.target.value)}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setRejectDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleReject(currentRequestId!)}
                disabled={loadingAction !== null}
                className="flex items-center gap-2"
              >
                {loadingAction ? <Spinner size={16} /> : <XCircle className="w-4 h-4" />}
                {loadingAction ? "Rejecting..." : "Reject Request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}