import React from "react"
import { useMutation } from "convex/react"
import { Id } from "../../../convex/_generated/dataModel"
import { api } from "../../../convex/_generated/api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { CheckCircle, XCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface ContributionRequest {
  _id: Id<"contributionRequests">;
  contributor: {
    avatar?: string;
    displayName: string;
    username: string;
  } | null;
  status: "accepted" | "rejected" | "pending";
  createdAt: number;
  idea: {
    title: string;
  } | null;
  message: string;
}

interface IncomingRequestCardProps {
  request: ContributionRequest;
}

export const IncomingRequestCard: React.FC<IncomingRequestCardProps> = ({ request }) => {
  const updateStatusMutation = useMutation(api.contributionRequests.updateRequestStatus);
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = React.useState(false);

  const handleStatusUpdate = async (status: "accepted" | "rejected") => {
    try {
      setIsUpdating(true);
      await updateStatusMutation({ requestId: request._id, status });
      toast({
        title: status === "accepted" ? "Request Accepted" : "Request Rejected",
        description: `The contribution request has been ${status} successfully.`,
        variant: status === "accepted" ? "default" : "destructive",
      });
    } catch (error) {
      console.error("Failed to update request status:", error);
      toast({
        title: "Error",
        description: "Failed to update request status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="border border-border rounded-lg p-4 bg-card">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={request.contributor?.avatar} alt={request.contributor?.displayName} />
            <AvatarFallback>
              {request.contributor?.displayName?.charAt(0).toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{request.contributor?.displayName || "Unknown"}</p>
            <p className="text-sm text-muted-foreground">@{request.contributor?.username || "unknown"}</p>
            <p className="text-xs text-muted-foreground">{formatDate(request.createdAt)}</p>
          </div>
        </div>
        <Badge
          variant={
            request.status === "accepted" ? "default" :
            request.status === "rejected" ? "destructive" : "secondary"
          }
        >
          {request.status === "accepted" && <CheckCircle className="w-3 h-3 mr-1" />}
          {request.status === "rejected" && <XCircle className="w-3 h-3 mr-1" />}
          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
        </Badge>
      </div>

      <div className="mt-3">
        <p className="text-sm font-medium mb-1">Request for: {request.idea?.title || "Idea"}</p>
        <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
          {request.message}
        </p>
      </div>

      {request.status === "pending" && (
        <div className="flex gap-2 mt-3">
          <Button
            size="sm"
            onClick={() => {
              if (confirm("Are you sure you want to accept this contribution request?")) {
                handleStatusUpdate("accepted");
              }
            }}
            disabled={isUpdating}
            className="bg-green-600 hover:bg-green-700"
          >
            {isUpdating ? <Spinner size={14} /> : "Accept"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (confirm("Are you sure you want to reject this contribution request?")) {
                handleStatusUpdate("rejected");
              }
            }}
            disabled={isUpdating}
          >
            {isUpdating ? <Spinner size={14} /> : "Reject"}
          </Button>
        </div>
      )}
    </div>
  );
};