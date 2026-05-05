"use client";

import { useAuth, RedirectToSignIn } from "@clerk/nextjs";

export const dynamic = "force-dynamic";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Inbox,
  Send,
} from "lucide-react";
import { HeroHeader } from "@/components/header";
import FooterSection from "@/components/footer";
import { cn } from "@/lib/utils";

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

type Tab = "incoming" | "mine";

export default function ContributionRequestsPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const updateRequestStatus = useMutation(api.contributionRequests.updateRequestStatus);
  // Gate the queries on Clerk auth so they don't fire before the JWT handshake completes
  const currentUser = useQuery(api.users.getCurrentUser);
  const incomingRequests = useQuery(
    api.contributionRequests.getIncomingRequests,
    currentUser ? {} : "skip"
  );
  const myRequests = useQuery(
    api.contributionRequests.getMyRequests,
    currentUser ? {} : "skip"
  );

  const [activeTab, setActiveTab] = useState<Tab>("incoming");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionMessage, setRejectionMessage] = useState("");
  const [currentRequestId, setCurrentRequestId] = useState<Id<"contributionRequests"> | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <HeroHeader />
        <main className="flex-1 flex items-center justify-center">
          <Spinner size={32} />
        </main>
        <FooterSection />
      </div>
    );
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  const handleAccept = async (requestId: Id<"contributionRequests">) => {
    setLoadingAction(requestId);
    try {
      await updateRequestStatus({ requestId, status: "accepted" });
    } catch (error) {
      console.error("Failed to accept request:", error);
      toast({ title: "Error", description: "Failed to accept request. Please try again.", variant: "destructive" });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReject = async (requestId: Id<"contributionRequests">) => {
    setCurrentRequestId(requestId);
    if (!rejectDialogOpen) {
      setRejectDialogOpen(true);
      return;
    }
    setLoadingAction(requestId);
    try {
      await updateRequestStatus({ requestId, status: "rejected" });
      setRejectDialogOpen(false);
      setRejectionMessage("");
      setCurrentRequestId(null);
    } catch (error) {
      console.error("Failed to reject request:", error);
      toast({ title: "Error", description: "Failed to reject request. Please try again.", variant: "destructive" });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRejectConfirm = () => {
    if (currentRequestId) handleReject(currentRequestId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-500/15 text-yellow-300 border border-yellow-500/30">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "accepted":
        return (
          <Badge variant="secondary" className="bg-green-500/15 text-green-300 border border-green-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Accepted
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="secondary" className="bg-red-500/15 text-red-300 border border-red-500/30">
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

  const formatDate = (timestamp: number) =>
    new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const renderRequestCard = (request: ContributionRequest, kind: Tab) => (
    <div
      key={request._id}
      className="rounded-2xl border border-white/[0.07] bg-[#111827]/80 backdrop-blur-xl p-5 sm:p-6 shadow-[0_1px_0_rgba(255,255,255,0.04)] transition-all hover:border-indigo-500/30 hover:bg-[#111827]"
    >
      {/* Top row */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          {request.contributor && (
            <>
              <Avatar className="w-11 h-11 shrink-0 ring-2 ring-indigo-500/20">
                <AvatarImage src={request.contributor.avatar} alt={request.contributor.displayName} />
                <AvatarFallback className="bg-indigo-500/20 text-indigo-300">
                  {request.contributor.displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-semibold truncate text-foreground">{request.contributor.displayName}</p>
                <p className="text-sm text-muted-foreground truncate">@{request.contributor.username}</p>
              </div>
            </>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {getStatusBadge(request.status)}
          <span className="text-xs text-muted-foreground">{formatDate(request.createdAt)}</span>
        </div>
      </div>

      {/* Idea card */}
      {request.idea && (
        <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 mb-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-300/80 mb-1.5">
            Request for
          </p>
          <p className="text-sm font-semibold text-foreground">{request.idea.title}</p>
          {request.idea.description && (
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
              {request.idea.description}
            </p>
          )}
        </div>
      )}

      {/* Message */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
          Message
        </p>
        <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
          {request.message}
        </p>
      </div>

      {/* Actions */}
      {kind === "incoming" && request.status === "pending" && (
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <Button
            onClick={() => handleAccept(request._id)}
            disabled={loadingAction === request._id}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 h-10"
          >
            {loadingAction === request._id ? <Spinner size={16} /> : <CheckCircle className="w-4 h-4" />}
            {loadingAction === request._id ? "Accepting…" : "Accept"}
          </Button>
          <Button
            onClick={() => handleReject(request._id)}
            disabled={loadingAction === request._id}
            variant="destructive"
            className="flex-1 flex items-center justify-center gap-2 h-10"
          >
            {loadingAction === request._id ? <Spinner size={16} /> : <XCircle className="w-4 h-4" />}
            {loadingAction === request._id ? "Rejecting…" : "Reject"}
          </Button>
        </div>
      )}

      {request.status !== "pending" && (
        <div className="flex items-center justify-center gap-2 pt-2 border-t border-white/5">
          <span className="text-xs text-muted-foreground capitalize">Request {request.status}</span>
        </div>
      )}
    </div>
  );

  const renderRequestList = (requests: ContributionRequest[] | undefined, kind: Tab) => {
    if (requests === undefined) {
      return (
        <div className="flex items-center justify-center py-20">
          <Spinner size={32} />
        </div>
      );
    }
    if (requests.length === 0) {
      return (
        <div className="text-center py-20">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-5">
            {kind === "incoming" ? (
              <Inbox className="w-9 h-9 text-indigo-300/80" />
            ) : (
              <Send className="w-9 h-9 text-indigo-300/80" />
            )}
          </div>
          <h2 className="text-xl font-semibold mb-2 text-foreground">
            {kind === "incoming" ? "No incoming requests yet" : "You haven't sent any requests"}
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
            {kind === "incoming"
              ? "When contributors ask to help on your ideas, they'll show up here."
              : "Browse the feed and offer to collaborate on ideas you find interesting."}
          </p>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {requests.map((request) => renderRequestCard(request, kind))}
      </div>
    );
  };

  const incomingCount = incomingRequests?.length ?? 0;
  const myCount = myRequests?.length ?? 0;
  const acceptedCount = (incomingRequests || []).filter((r) => r.status === "accepted").length;
  const pendingCount = (incomingRequests || []).filter((r) => r.status === "pending").length;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <HeroHeader />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-4 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground -ml-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                Contribution Requests
              </h1>
              <p className="mt-2 text-sm md:text-base text-muted-foreground max-w-2xl">
                Manage requests on your ideas and track the ones you&apos;ve sent.
              </p>
            </div>
            {/* Quick stats — desktop only */}
            <div className="hidden lg:flex items-center gap-3">
              <div className="rounded-xl border border-white/[0.07] bg-[#111827]/60 px-4 py-2.5 min-w-[88px]">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Pending</p>
                <p className="text-lg font-semibold text-yellow-300">{pendingCount}</p>
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-[#111827]/60 px-4 py-2.5 min-w-[88px]">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Accepted</p>
                <p className="text-lg font-semibold text-green-300">{acceptedCount}</p>
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-[#111827]/60 px-4 py-2.5 min-w-[88px]">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Sent</p>
                <p className="text-lg font-semibold text-indigo-300">{myCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs + Content shell */}
        <div className="rounded-2xl border border-white/[0.07] bg-[#0F1421]/60 backdrop-blur-xl p-4 sm:p-6 lg:p-8 shadow-[0_1px_0_rgba(255,255,255,0.04)]">
          {/* Tabs */}
          <div className="flex w-full sm:w-auto rounded-xl border border-white/[0.07] bg-[#0A0D12] p-1 mb-6">
            <button
              type="button"
              onClick={() => setActiveTab("incoming")}
              className={cn(
                "flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg text-sm font-medium transition-all",
                activeTab === "incoming"
                  ? "bg-indigo-500/15 text-indigo-200 ring-1 ring-indigo-500/30"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Inbox className="w-4 h-4" />
              <span>Incoming</span>
              <span
                className={cn(
                  "inline-flex h-5 min-w-5 items-center justify-center rounded-full text-[11px] px-1.5 font-semibold",
                  activeTab === "incoming"
                    ? "bg-indigo-500/30 text-indigo-100"
                    : "bg-muted-foreground/15 text-muted-foreground"
                )}
              >
                {incomingCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("mine")}
              className={cn(
                "flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg text-sm font-medium transition-all",
                activeTab === "mine"
                  ? "bg-indigo-500/15 text-indigo-200 ring-1 ring-indigo-500/30"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Send className="w-4 h-4" />
              <span>Outgoing</span>
              <span
                className={cn(
                  "inline-flex h-5 min-w-5 items-center justify-center rounded-full text-[11px] px-1.5 font-semibold",
                  activeTab === "mine"
                    ? "bg-indigo-500/30 text-indigo-100"
                    : "bg-muted-foreground/15 text-muted-foreground"
                )}
              >
                {myCount}
              </span>
            </button>
          </div>

          {activeTab === "incoming"
            ? renderRequestList(incomingRequests as ContributionRequest[] | undefined, "incoming")
            : renderRequestList(myRequests as ContributionRequest[] | undefined, "mine")}
        </div>

        {/* Rejection Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject contribution request</DialogTitle>
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
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectConfirm}
                disabled={loadingAction !== null}
                className="flex items-center gap-2"
              >
                {loadingAction ? <Spinner size={16} /> : <XCircle className="w-4 h-4" />}
                {loadingAction ? "Rejecting…" : "Reject Request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>

      <FooterSection />
    </div>
  );
}
