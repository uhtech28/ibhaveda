"use client";

import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id, Doc } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { MessageCircle, CheckCircle2, Clock, XCircle } from "lucide-react";
import { notifyRequestSent } from "@/components/requests/notification-toast";

interface ContributionRequestModalProps {
  ideaId: Id<"ideas">;
  ideaTitle: string;
  authorName?: string;
  onClose: () => void;
}

export const ContributionRequestModal: React.FC<ContributionRequestModalProps> = ({ 
  ideaId, 
  ideaTitle, 
  authorName,
  onClose 
}) => {
  const createRequestMutation = useMutation(api.contributionRequests.createContributionRequest);
  const userRequests = useQuery(api.contributionRequests.getMyRequests);
  
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [existingRequest, setExistingRequest] = useState<Doc<"contributionRequests"> | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSubmitting) return;

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
      pending: { color: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: Clock },
      accepted: { color: "bg-green-100 text-green-800 border-green-300", icon: CheckCircle2 },
      rejected: { color: "bg-red-100 text-red-800 border-red-300", icon: XCircle },
    }[status as "pending" | "accepted" | "rejected"] || { color: "bg-gray-100", icon: Clock };

    const StatusIcon = statusConfig.icon;

    return (
      <div className="space-y-6">
        <DialogHeader>
          <DialogTitle>Contribution Status</DialogTitle>
          <DialogDescription>
            You have already requested to contribute to "{ideaTitle}".
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
            <div className={`p-4 rounded-xl border ${statusConfig.color} flex items-center gap-3`}>
                <StatusIcon className="w-5 h-5" />
                <div className="flex-1">
                    <p className="font-semibold capitalize">{status}</p>
                    <p className="text-xs opacity-90">
                        {status === 'pending' && "Waiting for author's response."}
                        {status === 'accepted' && "You are now a contributor!"}
                        {status === 'rejected' && "Your request was declined."}
                    </p>
                </div>
            </div>

            <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <DialogHeader>
        <DialogTitle>Request to Contribute</DialogTitle>
        <DialogDescription>
          Let {authorName || 'the author'} know how you'd like to help with "{ideaTitle}".
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="message" className="text-sm font-medium">
            How can you help?
          </label>
          <Textarea
            id="message"
            placeholder="I can help with frontend development..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[120px] resize-none"
            maxLength={1200}
            autoFocus
            required
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{error && <span className="text-destructive">{error}</span>}</span>
            <span>{message.length}/1200</span>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={!message.trim() || isSubmitting}>
          {isSubmitting ? <div className="mr-2"><Spinner size={16} /></div> : <MessageCircle className="w-4 h-4 mr-2" />}
          Send Request
        </Button>
      </DialogFooter>
    </form>
  );
};
