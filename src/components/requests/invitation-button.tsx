"use client";

import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { api } from "@convex/_generated/api";
import { useToast } from "@/components/ui/use-toast";
import { Id } from "@convex/_generated/dataModel";
import { UserPlus, Check, X, Clock, UserCheck } from "lucide-react";

interface InvitationButtonProps {
  targetUser: {
    _id: string;
    username: string;
    displayName: string;
  };
  iconOnly?: boolean;
}

export const InvitationButton: React.FC<InvitationButtonProps> = ({ targetUser, iconOnly }) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [invitationMessage, setInvitationMessage] = useState("");

  const [selectedIdeas, setSelectedIdeas] = useState<Id<"ideas">[]>([]);
  const [isSending, setIsSending] = useState(false);

  const { toast } = useToast();

  // Get current user's ideas
  const myIdeas = useQuery(api.ideas.getUserIdeas);

  // Get current user to check for existing invitations
  const currentUser = useQuery(api.users.getCurrentUser);

  // Check for existing invitations to this user
  const existingInvitations = useQuery(
    api.invitations.getInvitationsByInviterAndInvitee,
    currentUser ? { inviterId: currentUser._id as Id<"users">, inviteeId: targetUser._id as Id<"users"> } : "skip"
  );

  // Detect the most relevant existing invitation so we can render a
  // disabled state instead of hiding the button outright.
  const invitationState: "pending" | "accepted" | null = (() => {
    if (!existingInvitations || existingInvitations.length === 0) return null;
    if (existingInvitations.some((inv) => inv.status === "accepted")) return "accepted";
    if (existingInvitations.some((inv) => inv.status === "pending")) return "pending";
    // "rejected" intentionally falls through — user should be able to retry.
    return null;
  })();

  // Send invitation mutation
  const sendInvitationMutation = useMutation(api.invitations.sendInvitation);

  const handleSendInvitations = async () => {
    if (selectedIdeas.length === 0) return;

    setIsSending(true);
    try {
      await Promise.all(
        selectedIdeas.map(ideaId =>
          sendInvitationMutation({
            ideaId,
            username: targetUser.username,
            message: invitationMessage.trim() || undefined,
          })
        )
      );

      toast({
        title: "Invitations sent!",
        description: `Successfully invited ${targetUser.displayName} to collaborate on ${selectedIdeas.length} idea(s).`,
      });

      // Reset state
      setIsPopoverOpen(false);
      setInvitationMessage("");
      setSelectedIdeas([]);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: "Failed to send invitation(s)",
        description: message || "An error occurred while sending the invitations.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const toggleIdeaSelection = (ideaId: Id<"ideas">) => {
    setSelectedIdeas(prev =>
      prev.includes(ideaId) ? prev.filter(id => id !== ideaId) : [...prev, ideaId]
    );
  };

  if (!myIdeas) {
    return (
      <Button variant="outline" size={iconOnly ? "icon" : "sm"} disabled className={iconOnly ? "h-8 w-8 rounded-full flex-shrink-0" : "w-full"}>
        <Spinner size={14} className={iconOnly ? "" : "mr-2"} />
        {!iconOnly && "Loading..."}
      </Button>
    );
  }

  // If there's already an active (pending or accepted) invitation, show a
  // greyed-out, disabled button so the user knows the invite has been sent
  // — the button no longer disappears.
  if (invitationState === "pending") {
    return (
      <Button
        variant="outline"
        size={iconOnly ? "icon" : "sm"}
        disabled
        title="Invitation pending"
        aria-label="Invitation pending"
        className={
          iconOnly
            ? "h-8 w-8 rounded-full flex-shrink-0 opacity-60 cursor-not-allowed"
            : "w-full opacity-60 cursor-not-allowed"
        }
      >
        <Clock className={`w-4 h-4 ${!iconOnly ? "mr-2" : ""}`} />
        {!iconOnly && "Invited"}
      </Button>
    );
  }

  if (invitationState === "accepted") {
    return (
      <Button
        variant="outline"
        size={iconOnly ? "icon" : "sm"}
        disabled
        title="Already collaborating"
        aria-label="Already collaborating"
        className={
          iconOnly
            ? "h-8 w-8 rounded-full flex-shrink-0 opacity-60 cursor-not-allowed"
            : "w-full opacity-60 cursor-not-allowed"
        }
      >
        <UserCheck className={`w-4 h-4 ${!iconOnly ? "mr-2" : ""}`} />
        {!iconOnly && "Collaborating"}
      </Button>
    );
  }

  if (myIdeas.length === 0) {
    return (
      <Button
        variant="outline"
        size={iconOnly ? "icon" : "sm"}
        disabled
        title="Create an idea first to send invitations"
        className={iconOnly ? "h-8 w-8 rounded-full flex-shrink-0" : "w-full"}
      >
        <UserPlus className={`w-4 h-4 ${!iconOnly ? "mr-2" : ""}`} />
        {!iconOnly && "Send Invitation"}
      </Button>
    );
  }

  return (
    <>
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size={iconOnly ? "icon" : "sm"}
            className={iconOnly ? "h-8 w-8 rounded-full flex-shrink-0" : "w-full"}
            title="Send Invitation"
          >
            <UserPlus className={`w-4 h-4 ${!iconOnly ? "mr-2" : ""}`} />
            {!iconOnly && "Send Invitation"}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="relative w-[min(92vw,384px)] max-h-[80vh] overflow-y-auto pr-3 pt-3" align="start">
          <button
            type="button"
            onClick={() => setIsPopoverOpen(false)}
            aria-label="Close invitation"
            className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="space-y-4">
            <div className="pr-8">
              <h4 className="font-medium text-sm mb-2">Invite {targetUser.displayName} to collaborate</h4>
              <p className="text-xs text-muted-foreground mb-4">
                Select one or more of your ideas that you'd like {targetUser.displayName} to contribute to.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Select ideas:
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {myIdeas.map((idea) => {
                  const isSelected = selectedIdeas.includes(idea._id);
                  return (
                    <div
                      key={idea._id}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors hover:border-primary/50 ${isSelected ? 'border-primary bg-primary/5' : 'border-border'}`}
                      onClick={() => toggleIdeaSelection(idea._id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-sm pr-2">{idea.title}</h4>
                            <Badge
                              variant={idea.visibility === "public" ? "default" : "outline"}
                              className="text-[10px] py-0 h-4 flex-shrink-0"
                            >
                              {idea.visibility}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {idea.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 border border-purple-500/20">
                              {idea.category}
                            </span>
                          </div>
                        </div>
                        <div className={`mt-1 h-4 w-4 rounded-sm border flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-input bg-background'}`}>
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Invitation message (optional):
              </label>
              <textarea
                className="w-full p-3 border border-border rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
                placeholder={`Hi ${targetUser.displayName}, I'd love for you to contribute to this idea...`}
                value={invitationMessage}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInvitationMessage(e.target.value)}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {invitationMessage.length}/500 characters
              </p>
            </div>

            <Button
              className="w-full mt-2"
              onClick={handleSendInvitations}
              disabled={selectedIdeas.length === 0 || isSending}
            >
              {isSending ? (
                <>
                  <Spinner size={14} className="mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>

          </div>
        </PopoverContent>
      </Popover>
    </>
  );
};