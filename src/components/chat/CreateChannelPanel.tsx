"use client";

import React, { useState } from "react";
import { useMutation } from "convex/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Hash, Plus, X } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface CreateChannelPanelProps {
  ideaId: Id<"ideas">;
  onBack: () => void;
  onClose: () => void;
  onCreated: (conversationId: Id<"conversations">) => void;
}

const SUGGESTIONS = ["general", "design", "engineering", "marketing", "research", "ideas"];

/**
 * Inline "Create Channel" panel that lives inside the chat sheet (no portal,
 * so no z-index conflicts with the parent sheet at z-[60]).
 *
 * On submit it calls `api.chat.createGroupConversation` with the parent idea
 * and the channel name. The backend enforces author/contributor permission.
 */
export const CreateChannelPanel: React.FC<CreateChannelPanelProps> = ({
  ideaId,
  onBack,
  onClose,
  onCreated,
}) => {
  const createGroup = useMutation(api.chat.createGroupConversation);
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = name.trim();
  const canSubmit = trimmed.length > 0 && !isLoading;

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setIsLoading(true);
    try {
      const conversationId = await createGroup({ ideaId, name: trimmed });
      onCreated(conversationId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create channel.";
      // Surface a friendlier message for permission errors.
      if (msg.toLowerCase().includes("permission") || msg.toLowerCase().includes("contributor")) {
        setError("Only the idea owner or accepted contributors can create channels.");
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full bg-background flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 border-b flex items-center justify-between shrink-0 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-1 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            disabled={isLoading}
            className="h-8 w-8 shrink-0"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm truncate">
            <Hash className="w-3.5 h-3.5 text-primary" />
            New Channel
          </h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          disabled={isLoading}
          className="h-8 w-8"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col">
        <div className="px-4 py-4 space-y-4 flex-1 overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="channel-name" className="text-xs">Channel name</Label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                id="channel-name"
                autoFocus
                placeholder="design"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                maxLength={40}
                className="pl-9"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Channels group conversations by topic. Anyone in the community can join.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Quick picks</Label>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setName(s)}
                  disabled={isLoading}
                  className="rounded-full border border-border/60 bg-background hover:bg-accent/60 px-3 py-1 text-xs text-foreground transition-colors disabled:opacity-50"
                >
                  #{s}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {error}
            </div>
          )}
        </div>

        <div className="border-t border-border/40 p-3 flex items-center justify-end gap-2 shrink-0 bg-card/30">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onBack}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={!canSubmit}>
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Create channel
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateChannelPanel;
