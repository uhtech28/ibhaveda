"use client";

/**
 * Compose dialog for firing a new flare. Single description field,
 * with a soft character minimum so users don't fire one-word flares
 * that are useless to responders.
 *
 * Keeps the form local — no Convex query subscription — and submits
 * via `fireFlare`. Closes on success.
 */

import React, { useCallback, useEffect, useState } from "react";
import { Loader2, Radio, Send } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const MIN_DESCRIPTION_CHARS = 20;
const MAX_DESCRIPTION_CHARS = 600;

interface Props {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  ventureId?: Id<"ventures">;
  checkpointId?: Id<"ventureCheckpoints">;
}

export function FlareComposeDialog({
  open,
  onOpenChange,
  ventureId,
  checkpointId,
}: Props) {
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fireFlare = useMutation(api.flares.fireFlare);

  // Reset state every time the dialog reopens so a closed-and-reopened
  // dialog never shows stale text or an old error.
  useEffect(() => {
    if (open) {
      setDescription("");
      setError(null);
    }
  }, [open]);

  const trimmedLength = description.trim().length;
  const tooShort = trimmedLength > 0 && trimmedLength < MIN_DESCRIPTION_CHARS;
  const canSubmit = trimmedLength >= MIN_DESCRIPTION_CHARS && !submitting;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await fireFlare({
        description: description.trim(),
        ventureId,
        checkpointId,
      });
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't fire your flare. Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, description, fireFlare, ventureId, checkpointId, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-amber-400" />
            Fire a Flare
          </DialogTitle>
          <DialogDescription>
            Ask the community for help. Be specific about what's blocking
            you so people can respond usefully.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Textarea
            placeholder="What are you stuck on? Mention what you've tried so far if it helps."
            value={description}
            onChange={(e) =>
              setDescription(e.target.value.slice(0, MAX_DESCRIPTION_CHARS))
            }
            className="min-h-[140px] resize-none"
            disabled={submitting}
          />

          <div className="flex items-center justify-between text-xs">
            <span
              className={
                tooShort ? "text-amber-300" : "text-white/40"
              }
            >
              {tooShort
                ? `A bit more context helps — ${
                    MIN_DESCRIPTION_CHARS - trimmedLength
                  } more characters`
                : "Specific beats vague — what have you tried, what's blocking?"}
            </span>
            <span className="font-mono text-white/40">
              {trimmedLength} / {MAX_DESCRIPTION_CHARS}
            </span>
          </div>

          {error && (
            <p className="rounded-md border border-red-500/40 bg-red-500/10 p-2 text-sm text-red-300">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-md border border-white/20 px-3 py-2 text-sm text-white/70 transition hover:border-white/40 hover:text-white"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 rounded-md border border-amber-500 bg-amber-500/20 px-4 py-2 text-sm font-medium text-amber-100 transition hover:bg-amber-500/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Firing
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Fire Flare
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
