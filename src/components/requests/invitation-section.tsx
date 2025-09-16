"use client";

import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { UserPlus, X } from "lucide-react";
import { SearchableUserDropdown } from "./searchable-user-dropdown";


type InvitationSectionProps = {
  idea: {
    _id: Id<"ideas">;
    isAuthor: boolean;
  };
};

export const InvitationSection: React.FC<InvitationSectionProps> = ({ idea }) => {
  const sendInvitationMutation = useMutation(api.invitations.sendInvitation);
  const cancelInvitationMutation = useMutation(api.invitations.cancelInvitation);
  const myInvitationsQuery = useQuery(api.invitations.getMyInvitations);
  const acceptInvitationMutation = useMutation(api.invitations.acceptInvitation);
  const rejectInvitationMutation = useMutation(api.invitations.rejectInvitation);
  const invitationsQuery = useQuery(api.invitations.getInvitationsForIdea, { ideaId: idea._id });

  // Always render to show invitations to recipients and sending UI to authors

  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || isSending) return;

    setIsSending(true);
    setError("");

    try {
      await sendInvitationMutation({
        ideaId: idea._id,
        username: username.trim(),
        message: message.trim() || undefined,
      });
      setUsername("");
      setMessage("");
    } catch (err: unknown) {
      console.error("Failed to send invitation:", err);
      setError(err instanceof Error ? err.message : "Failed to send invitation. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleCancelInvitation = async (invitationId: Id<"invitations">) => {
    if (!confirm("Are you sure you want to cancel this invitation?")) return;
    try {
      await cancelInvitationMutation({ invitationId });
    } catch (err) {
      console.error("Failed to cancel invitation:", err);
    }
  };

  const handleAcceptInvitation = async (invitationId: Id<"invitations">) => {
    try {
      await acceptInvitationMutation({ invitationId });
    } catch (err) {
      console.error("Failed to accept invitation:", err);
    }
  };

  const handleRejectInvitation = async (invitationId: Id<"invitations">) => {
    if (!confirm("Are you sure you want to decline this invitation?")) return;
    try {
      await rejectInvitationMutation({ invitationId });
    } catch (err) {
      console.error("Failed to reject invitation:", err);
    }
  };

  const pendingInvitations = invitationsQuery?.filter(inv => inv.status === "pending") || [];
  const myPendingInvitation = myInvitationsQuery?.find(inv => inv.idea?._id === idea._id) || null;

  return (
    <div className="max-w-4xl mx-auto mt-8">
      {/* Show pending invitation for current user */}
      {myPendingInvitation && (
        <div className="bg-card border border-border rounded-xl p-6 transition-colors mb-8">
          <h3 className="text-lg font-semibold mb-4">You've been invited to contribute!</h3>
          <div className="bg-muted/50 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3 mb-2">
              <Avatar className="w-10 h-10">
                <AvatarFallback>
                  {myPendingInvitation.inviter?.displayName?.charAt(0).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{myPendingInvitation.inviter?.displayName || "Unknown"}</p>
                <p className="text-sm text-muted-foreground">@{myPendingInvitation.inviter?.username || "unknown"}</p>
              </div>
            </div>
            {myPendingInvitation.message && (
              <p className="text-sm text-muted-foreground mt-2">{myPendingInvitation.message}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => handleAcceptInvitation(myPendingInvitation._id)}
              className="bg-green-600 hover:bg-green-700"
            >
              Accept Invitation
            </Button>
            <Button
              variant="outline"
              onClick={() => handleRejectInvitation(myPendingInvitation._id)}
            >
              Decline
            </Button>
          </div>
        </div>
      )}

      {/* Author invitation section */}
      {idea.isAuthor && (
        <div className="bg-card border border-border rounded-xl p-6 transition-colors">
          <h3 className="text-lg font-semibold mb-4">Invite Contributors</h3>

        {/* Send invitation form */}
        <form onSubmit={handleSendInvitation} className="space-y-4 mb-6">
          <div className="flex gap-2 flex-col sm:flex-row">
            <div className="flex-1">
              <SearchableUserDropdown
                value={username}
                onChange={setUsername}
                placeholder="Select contributor by username"
                disabled={isSending}
              />
            </div>
            <Button
              type="submit"
              disabled={!username.trim() || isSending}
              className="self-start sm:self-auto"
            >
              {isSending ? <Spinner size={16} /> : <UserPlus className="w-4 h-4 mr-2" />}
              Send Invitation
            </Button>
          </div>
          <div>
            <Input
              placeholder="Optional invitation message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={500}
              disabled={isSending}
            />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
        </form>

        {/* Pending invitations */}
        {invitationsQuery === undefined ? (
          <div className="text-center py-4">
            <Spinner size={24} />
            <p className="text-muted-foreground mt-2">Loading invitations...</p>
          </div>
        ) : pendingInvitations.length > 0 ? (
          <>
            <h4 className="text-md font-medium mb-3">Pending Invitations</h4>
            <div className="space-y-4">
              {pendingInvitations.map((invitation) => (
                <div key={invitation._id} className="border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>
                          {invitation.invitee?.name?.charAt(0).toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{invitation.invitee?.name || "Unknown"}</p>
                        <p className="text-sm text-muted-foreground">@{invitation.invitee?.username || "unknown"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Pending</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelInvitation(invitation._id)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {invitation.message && (
                    <p className="text-sm mt-2 text-muted-foreground">{invitation.message}</p>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-muted-foreground py-4">
            No pending invitations.
          </p>
        )}
        </div>
      )}
    </div>
  );
};