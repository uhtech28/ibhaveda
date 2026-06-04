"use client";

import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id, Doc } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle2, Clock, XCircle, UserPlus } from "lucide-react";
import { notifyRequestSent } from "@/components/requests/notification-toast";
import Link from "next/link";

interface ContributionRequestModalProps {
  ideaId: Id<"ideas">;
  ideaTitle: string;
  authorName?: string;
  authorUsername?: string;
  authorAvatar?: string;
  onClose: () => void;
}

export const ContributionRequestModal: React.FC<ContributionRequestModalProps> = ({ 
  ideaId, 
  ideaTitle, 
  authorName,
  authorUsername,
  authorAvatar,
  onClose 
}) => {
  const createRequestMutation = useMutation(api.contributionRequests.createContributionRequest);
  const userRequests = useQuery(api.contributionRequests.getMyRequests);
  
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [existingRequest, setExistingRequest] = useState<Doc<"contributionRequests"> | null>(null);
  const isOverMessageLimit = message.length > 1200;
  const displayAuthorName = authorName || "the author";
  const initials = (authorName || authorUsername || "U")
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const profileHref = authorUsername ? `/profile/${authorUsername}` : undefined;
  const ideaHref = `/idea/${ideaId}`;

  useEffect(() => {
    if (userRequests) {
      const request = userRequests.find(req => req.ideaId === ideaId);
      setExistingRequest(request || null);
    }
  }, [userRequests, ideaId]);

  // Pull the human-readable line out of a Convex server error string.
  // Convex format: "[CONVEX M(...)] [Request ID: ...] Server Error Uncaught Error: <real message> at handler ..."
  const friendlyError = (raw: string): string => {
    const match = raw.match(/Uncaught Error:\s*(.+?)\s*at handler/i);
    if (match && match[1]) return match[1];
    return raw.replace(/^\[CONVEX[^\]]*\]\s*\[[^\]]*\]\s*Server Error\s*/i, "").split("\n")[0];
  };

  const projectProfileHeader = (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 overflow-hidden rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
      <Link
        href={ideaHref}
        className="min-w-0 truncate text-sm font-semibold text-white transition-colors hover:text-[#C7D2FE]"
        title={ideaTitle}
      >
        {ideaTitle}
      </Link>
      {profileHref ? (
        <Link
          href={profileHref}
          className="shrink-0 rounded-full transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/50"
          aria-label={`Open ${displayAuthorName}'s profile`}
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src={authorAvatar} alt={displayAuthorName} />
            <AvatarFallback className="bg-[#1B2440] text-xs text-white">{initials || "U"}</AvatarFallback>
          </Avatar>
        </Link>
      ) : (
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarImage src={authorAvatar} alt={displayAuthorName} />
          <AvatarFallback className="bg-[#1B2440] text-xs text-white">{initials || "U"}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSubmitting || isOverMessageLimit) return;

    setIsSubmitting(true);
    setError("");

    try {
      await createRequestMutation({
        ideaId,
        message: message.trim(),
      });

      setMessage("");
      notifyRequestSent();
      onClose();
    } catch (err: unknown) {
      console.error("Failed to send contribution request:", err);
      const raw = err instanceof Error ? err.message : "Failed to send contribution request.";
      setError(friendlyError(raw));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (existingRequest) {
    const status = existingRequest.status;
    const statusConfig = {
      pending: {
        color: "border-amber-400/30 bg-amber-400/10 text-amber-200",
        icon: Clock,
        message: "Waiting for author's response.",
      },
      accepted: {
        color: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
        icon: CheckCircle2,
        message: "You are now a contributor!",
      },
      rejected: {
        color: "border-rose-400/30 bg-rose-400/10 text-rose-200",
        icon: XCircle,
        message: "Your request was declined.",
      },
    }[status as "pending" | "accepted" | "rejected"] || {
      color: "border-white/10 bg-white/[0.03] text-white",
      icon: Clock,
      message: "",
    };

    const StatusIcon = statusConfig.icon;

    return (
      <div className="space-y-6">
        <DialogHeader>
          <DialogTitle>Contribution Status</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
            {projectProfileHeader}

            <div className={`rounded-xl border px-3 py-2 ${statusConfig.color} flex items-center gap-2.5`}>
                <StatusIcon className="h-4 w-4 shrink-0" />
                <p className="min-w-0 text-xs leading-5">
                  <span className="font-semibold capitalize">{status}</span>
                  {statusConfig.message && (
                    <span className="ml-2 opacity-85">{statusConfig.message}</span>
                  )}
                </p>
            </div>

            <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Your Message</p>
                <p className="text-sm italic text-foreground/80">"{existingRequest.message}"</p>
            </div>
        </div>

        <DialogFooter>
            {status === "rejected" ? (
                <div className="flex w-full justify-end gap-2">
                     <Button variant="outline" onClick={onClose}>Close</Button>
                     {/* Allow resubmitting if rejected? Logic for that would need to be handled, maybe delete old request? For now just close. */}
                </div>
            ) : (
                <Button onClick={onClose} className="w-full sm:w-auto">Close</Button>
            )}
        </DialogFooter>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full min-w-0 space-y-6 overflow-hidden">
      <DialogHeader>
        <DialogTitle>Request to Contribute</DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        {projectProfileHeader}

        <div>
          <div
            className={`relative rounded-[22px] border bg-[#0A0D12] transition-colors focus-within:bg-[#111827] ${
              isOverMessageLimit
                ? "border-rose-500/80 focus-within:border-rose-400"
                : "border-white/10 focus-within:border-[#6366F1]/45"
            }`}
          >
            <textarea
              id="message"
              placeholder={`Tell ${displayAuthorName} how you can help!`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="block min-h-[120px] w-full resize-none rounded-[22px] bg-transparent p-4 text-sm leading-5 text-white placeholder:text-[#6B7280] outline-none focus:ring-0"
              autoFocus
              required
            />
          </div>
          {isOverMessageLimit && (
            <p className="mt-1.5 pl-3 text-[11px] font-medium text-rose-400">
              Max character count reached
            </p>
          )}
          {error && <p className="mt-2 pl-3 text-[11px] text-rose-400">{error}</p>}
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={!message.trim() || isSubmitting || isOverMessageLimit} className="gap-2">
          {isSubmitting ? <Spinner size={16} /> : <UserPlus className="w-4 h-4" />}
          Send Request
        </Button>
      </DialogFooter>
    </form>
  );
};
