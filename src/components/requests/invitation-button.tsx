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
import { UserPlus } from "lucide-react";

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

  // Check if there's already a pending/accepted/rejected invitation
  const hasActiveInvitation = existingInvitations && existingInvitations.length > 0 && existingInvitations.some(inv =>
    inv.status === "pending" || inv.status === "accepted" || inv.status === "rejected"
  );

  // Send invitation mutation
  const sendInvitationMutation = useMutation(api.invitations.sendInvitation);

  const handleSendInvitation = async (ideaId: Id<"ideas">) => {
    try {
      await sendInvitationMutation({
        ideaId,
        username: targetUser.username,
        message: invitationMessage.trim() || undefined,
      });

      toast({
        title: "Invitation sent!",
        description: `Successfully invited ${targetUser.displayName} to collaborate.`,
      });

      // Reset state
      setIsPopoverOpen(false);
      setInvitationMessage("");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: "Failed to send invitation",
        description: message || "An error occurred while sending the invitation.",
        variant: "destructive",
      });
    }
  };

  if (!myIdeas) {
    return (
      <Button variant="outline" size={iconOnly ? "icon" : "sm"} disabled className={iconOnly ? "h-8 w-8 rounded-full flex-shrink-0" : "w-full"}>
        <Spinner size={14} className={iconOnly ? "" : "mr-2"} />
        {!iconOnly && "Loading..."}
      </Button>
    );
  }

  // If there's already an active invitation, hide the button
  if (hasActiveInvitation) {
    return null; // Hide the button completely when there's an active invitation
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

        <PopoverContent className="w-96 max-h-[80vh] overflow-y-auto" align="start">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-2">Invite {targetUser.displayName} to collaborate</h4>
              <p className="text-xs text-muted-foreground mb-4">
                Select one of your ideas that you'd like {targetUser.displayName} to contribute to.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Select an idea:
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {myIdeas.map((idea) => (
                  <div
                    key={idea._id}
                    className="border rounded-lg p-3 cursor-pointer transition-colors border-border hover:border-primary/50"
                    onClick={() => handleSendInvitation(idea._id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm">{idea.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {idea.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge variant="secondary" className="text-xs">
                            {idea.category}
                          </Badge>
                          <Badge
                            variant={idea.visibility === "public" ? "default" : "outline"}
                            className="text-xs"
                          >
                            {idea.visibility}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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

          </div>
        </PopoverContent>
      </Popover>
    </>
  );
};