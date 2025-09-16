"use client"

import { useAuth, RedirectToSignIn } from "@clerk/nextjs";

export const dynamic = 'force-dynamic';
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useState } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";

// Type for the request data from our query
interface ContributionRequest {
  _id: Id<"contributionRequests">;
  message: string;
  status: string;
  createdAt: number;
  updatedAt: number;
  idea: {
    title: string;
    description: string;
    _id: Id<"ideas">;
  } | null;
  contributor: {
    avatar?: string;
    displayName: string;
    username: string;
  } | null;
}

export default function ContributionRequestsPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  const { toast } = useToast();

  // Mutation for updating request status
  const updateRequestStatus = useMutation(api.contributionRequests.updateRequestStatus);

  // Query for incoming requests
  const incomingRequests = useQuery(api.contributionRequests.getIncomingRequests);

  // State for rejection dialog
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionMessage, setRejectionMessage] = useState("");
  const [currentRequestId, setCurrentRequestId] = useState<Id<"contributionRequests"> | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // If auth is still loading
  if (!isLoaded) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  // Redirect to sign in if not authenticated
  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  const handleAccept = async (requestId: Id<"contributionRequests">) => {
    setLoadingAction(requestId);
    try {
      await updateRequestStatus({ requestId, status: "accepted" });
      // The query will automatically re-fetch due to Convex's reactive nature
    } catch (error) {
      console.error("Failed to accept request:", error);
      toast({
        title: "Error",
        description: "Failed to accept request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReject = async (requestId: Id<"contributionRequests">) => {
    setCurrentRequestId(requestId);

    // Show confirmation dialog for rejection
    if (!rejectDialogOpen) {
      setRejectDialogOpen(true);
      return;
    }

    // If dialog was open, proceed with rejection
    setLoadingAction(requestId);
    try {
      await updateRequestStatus({ requestId, status: "rejected" });
      setRejectDialogOpen(false);
      setRejectionMessage("");
      setCurrentRequestId(null);
    } catch (error) {
      console.error("Failed to reject request:", error);
      toast({
        title: "Error",
        description: "Failed to reject request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRejectConfirm = () => {
    if (currentRequestId) {
      handleReject(currentRequestId);
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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">My Contribution Requests</h1>
            <p className="text-muted-foreground">
              Manage incoming contribution requests to your ideas
            </p>
          </div>
        </div>

        {/* Requests List */}
        {incomingRequests && incomingRequests.length > 0 ? (
          <div className="space-y-4">
            {incomingRequests.map((request: ContributionRequest) => (
              <Card key={request._id} className="w-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {request.contributor && (
                        <>
                          <Avatar className="w-8 h-8">
                            <AvatarImage
                              src={request.contributor.avatar}
                              alt={request.contributor.displayName}
                            />
                            <AvatarFallback>
                              {request.contributor.displayName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{request.contributor.displayName}</p>
                            <p className="text-sm text-muted-foreground">
                              @{request.contributor.username}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(request.status)}
                      <span className="text-sm text-muted-foreground">
                        {formatDate(request.createdAt)}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Idea Info */}
                    {request.idea && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium">Request for:</p>
                        <p className="text-sm font-semibold text-primary">
                          {request.idea.title}
                        </p>
                        {request.idea.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {request.idea.description.length > 100
                              ? `${request.idea.description.substring(0, 100)}...`
                              : request.idea.description
                            }
                          </p>
                        )}
                      </div>
                    )}

                    {/* Request Message */}
                    <div>
                      <p className="text-sm font-medium mb-1">Message:</p>
                      <p className="text-sm bg-muted p-3 rounded-lg">
                        {request.message}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    {request.status === "pending" && (
                      <div className="flex gap-2 pt-3 border-t">
                        <Button
                          onClick={() => handleAccept(request._id)}
                          disabled={loadingAction === request._id}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                        >
                          {loadingAction === request._id ? <Spinner size={16} /> : <CheckCircle className="w-4 h-4" />}
                          {loadingAction === request._id ? "Accepting..." : "Accept"}
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
                      <div className="flex items-center justify-center gap-2 pt-3 border-t">
                        <CheckCircle className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Request {request.status}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-12">
            <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-muted-foreground mb-2">
              No contribution requests yet
            </h2>
            <p className="text-muted-foreground">
              When contributors request to help with your ideas, they will appear here.
            </p>
          </div>
        )}

        {/* Rejection Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Contribution Request</DialogTitle>
              <DialogDescription>
                Are you sure you want to reject this contribution request? You can provide an optional reason below.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Textarea
                placeholder="Optional reason for rejection..."
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
                onClick={handleRejectConfirm}
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