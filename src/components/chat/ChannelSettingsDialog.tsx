import React, { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Loader2, UserMinus, UserPlus, Settings, Trash2, LogOut, Search, Shield } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";

interface ChannelSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: Id<"conversations">;
  ideaId: Id<"ideas">;
  onChannelDeleted?: () => void;
}

export const ChannelSettingsDialog: React.FC<ChannelSettingsDialogProps> = ({
  isOpen,
  onClose,
  conversationId,
  ideaId,
  onChannelDeleted,
}) => {
  const { isAuthenticated } = useConvexAuth();
  const { toast } = useToast();
  const currentUserDoc = useQuery(api.chat.getUserByClerkId, isAuthenticated ? {} : "skip");

  const members = useQuery(api.chat.getGroupMembers, isOpen ? { conversationId } : "skip");
  const potentialMembers = useQuery(api.chat.getPotentialGroupMembers, isOpen ? { ideaId } : "skip");

  const removeMember = useMutation(api.chat.removeGroupMember);
  const addMember = useMutation(api.chat.addGroupMember);
  const deleteGroup = useMutation(api.chat.deleteGroupConversation);

  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState("");

  const currentUserId = currentUserDoc?._id;
  const currentUserMembership = members?.find((m) => m.id === currentUserId);
  const isAdmin = currentUserMembership?.role === "admin";

  const availableToAdd = useMemo(() => {
    if (!potentialMembers || !members) return [];
    return potentialMembers
      .filter((pm) => !members.some((m) => m.id === pm.id))
      .filter((pm) =>
        filter.trim() ? (pm.displayName || "").toLowerCase().includes(filter.toLowerCase()) : true
      );
  }, [potentialMembers, members, filter]);

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRemoveMember = async (userId: Id<"users">) => {
    setIsProcessing(true);
    try {
      await removeMember({ conversationId, userId });
      toast({ description: "User removed from channel" });
      if (userId === currentUserId) {
        onChannelDeleted?.();
        onClose();
      }
    } catch (error: any) {
      toast({ description: error.message || "Failed to remove user", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddSelected = async () => {
    if (selectedIds.size === 0) return;
    setIsProcessing(true);
    const ids = Array.from(selectedIds);
    let succeeded = 0;
    const failures: string[] = [];

    for (const id of ids) {
      try {
        await addMember({ conversationId, userId: id as Id<"users"> });
        succeeded += 1;
      } catch (err: any) {
        failures.push(err?.message ?? "Failed");
      }
    }

    setIsProcessing(false);
    setSelectedIds(new Set());

    if (succeeded > 0 && failures.length === 0) {
      toast({ description: `Added ${succeeded} ${succeeded === 1 ? "user" : "users"} to the channel` });
    } else if (succeeded > 0 && failures.length > 0) {
      toast({ description: `Added ${succeeded}, ${failures.length} failed`, variant: "destructive" });
    } else {
      toast({ description: failures[0] || "Could not add users", variant: "destructive" });
    }
  };

  const handleDeleteChannel = async () => {
    if (!window.confirm("Are you sure you want to delete this channel? All messages will be lost forever.")) return;
    setIsProcessing(true);
    try {
      await deleteGroup({ conversationId });
      toast({ description: "Channel deleted" });
      onChannelDeleted?.();
      onClose();
    } catch (error: any) {
      toast({ description: error.message || "Failed to delete channel", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Channel Settings
          </DialogTitle>
          <DialogDescription>
            {isAdmin
              ? "You are the admin. Select members to add, or remove existing ones."
              : "Channel membership is managed by the channel admin."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6 py-4">
          {isAdmin && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5" />
                  Add Members
                </h4>
                <span className="text-[11px] text-muted-foreground">
                  {selectedIds.size > 0 ? `${selectedIds.size} selected` : `${availableToAdd.length} available`}
                </span>
              </div>

              {potentialMembers === undefined ? (
                <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
              ) : availableToAdd.length === 0 && !filter ? (
                <p className="text-xs text-muted-foreground py-2">Everyone in the community is already a member of this channel.</p>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      placeholder="Search contributors..."
                      className="pl-9 h-9 text-sm"
                      disabled={isProcessing}
                    />
                  </div>

                  <ScrollArea className="h-[180px] rounded-md border border-border/60">
                    <div className="p-1.5 space-y-0.5">
                      {availableToAdd.length === 0 ? (
                        <p className="text-xs text-muted-foreground p-3 text-center">No matches.</p>
                      ) : (
                        availableToAdd.map((user) => {
                          const selected = selectedIds.has(user.id);
                          return (
                            <button
                              key={user.id}
                              type="button"
                              onClick={() => toggleSelected(user.id)}
                              disabled={isProcessing}
                              className={`w-full flex items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors ${selected ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-muted/60"} disabled:opacity-50`}
                            >
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => toggleSelected(user.id)}
                                onClick={(e) => e.stopPropagation()}
                                className="h-3.5 w-3.5 accent-primary"
                              />
                              <Avatar className="w-7 h-7">
                                <AvatarImage src={user.avatar || undefined} />
                                <AvatarFallback className="text-[10px]">{user.displayName?.[0] || "?"}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm flex-1 truncate">{user.displayName}</span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>

                  <div className="flex items-center justify-between gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedIds(new Set())}
                      disabled={isProcessing || selectedIds.size === 0}
                      className="text-xs h-8"
                    >
                      Clear
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAddSelected}
                      disabled={isProcessing || selectedIds.size === 0}
                      className="gap-1.5"
                    >
                      {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                      Add {selectedIds.size > 0 ? `${selectedIds.size}` : ""} {selectedIds.size === 1 ? "user" : "users"}
                    </Button>
                  </div>
                </>
              )}

              <p className="text-[10px] text-muted-foreground">
                Only the channel admin can add or remove members. Only accepted contributors of this idea can be added.
              </p>
            </div>
          )}

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground border-b pb-2">Current Members ({members?.length || 0})</h4>
            <ScrollArea className="h-[180px]">
              <div className="space-y-2 pr-4">
                {members === undefined ? (
                  <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
                ) : members.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No members found.</p>
                ) : (
                  members.map((member) => (
                    <div key={member.id} className="flex flex-row items-center justify-between p-2 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarImage src={member.avatar || undefined} />
                          <AvatarFallback>{member.displayName?.[0] || "?"}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium truncate">
                            {member.displayName} {member.id === currentUserId && <span className="text-muted-foreground">(You)</span>}
                          </span>
                          <span className="text-[10px] text-muted-foreground capitalize flex items-center gap-1">
                            {member.role === "admin" && <Shield className="h-2.5 w-2.5 text-primary" />}
                            {member.role}
                          </span>
                        </div>
                      </div>
                      {isAdmin && member.id !== currentUserId ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleRemoveMember(member.id)}
                          disabled={isProcessing}
                          aria-label="Remove member"
                          title="Remove from channel"
                        >
                          <UserMinus className="w-4 h-4" />
                        </Button>
                      ) : member.id === currentUserId && !isAdmin ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleRemoveMember(member.id)}
                          title="Leave channel"
                          disabled={isProcessing}
                        >
                          <LogOut className="w-4 h-4" />
                        </Button>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {isAdmin && (
            <div className="space-y-3 pt-2">
              <h4 className="text-sm font-semibold text-destructive border-b border-destructive/20 pb-2">Danger Zone</h4>
              <div className="flex items-center justify-between p-3 rounded-lg border border-destructive/20 bg-destructive/5">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-destructive">Delete Channel</span>
                  <span className="text-[10px] text-destructive/80">This action cannot be undone.</span>
                </div>
                <Button size="sm" variant="destructive" onClick={handleDeleteChannel} disabled={isProcessing}>
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                  Delete
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};