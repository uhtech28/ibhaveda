"use client";

/**
 * Detail view for a single flare, opened by clicking a card. Shows:
 *
 *   - Full description and owner attribution
 *   - Status pill (Open / Resolved) + resolve button for owner
 *   - Response thread, oldest first
 *   - Response composer (any non-owner can respond while flare is open)
 *
 * Data is loaded with `getFlareDetail` which returns the flare,
 * owner, all responses, and per-responder display info in a single
 * round trip.
 */

import React, { useCallback, useMemo, useState } from "react";
import { CheckCircle2, Loader2, MessageSquare, Radio, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { FlareResponseItem } from "./FlareResponseItem";

interface Props {
  flareId: Id<"flares"> | null;
  /** Pass the current user's id so we can hide self-response affordances. */
  currentUserId: Id<"users"> | null;
  onOpenChange: (next: boolean) => void;
}

export function FlareDetailDialog({
  flareId,
  currentUserId,
  onOpenChange,
}: Props) {
  const detail = useQuery(
    api.flares.getFlareDetail,
    flareId ? { flareId } : "skip",
  );

  const respondToFlare = useMutation(api.flares.respondToFlare);
  const resolveFlare = useMutation(api.flares.resolveFlare);

  const [responseText, setResponseText] = useState("");
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const viewerIsOwner = useMemo(
    () => Boolean(detail && currentUserId && detail.owner._id === currentUserId),
    [detail, currentUserId],
  );

  const flareIsResolved = detail?.status === "resolved";
  const canRespond =
    detail !== null &&
    !viewerIsOwner &&
    !flareIsResolved &&
    Boolean(currentUserId);

  const handleSubmitResponse = useCallback(async () => {
    if (!detail || !canRespond || responseText.trim().length === 0) return;
    setSubmittingResponse(true);
    setError(null);
    try {
      await respondToFlare({
        flareId: detail._id,
        content: responseText.trim(),
      });
      setResponseText("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't post your response.",
      );
    } finally {
      setSubmittingResponse(false);
    }
  }, [canRespond, detail, respondToFlare, responseText]);

  const handleResolve = useCallback(async () => {
    if (!detail || !viewerIsOwner || flareIsResolved) return;
    setResolving(true);
    try {
      await resolveFlare({ flareId: detail._id });
    } finally {
      setResolving(false);
    }
  }, [detail, viewerIsOwner, flareIsResolved, resolveFlare]);

  return (
    <Dialog open={flareId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        {detail === undefined ? (
          <LoadingState />
        ) : detail === null ? (
          <NotFoundState />
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <DialogTitle className="flex items-center gap-2">
                    <Radio className="h-5 w-5 text-amber-400" />
                    Flare from {detail.owner.displayName}
                  </DialogTitle>
                  <DialogDescription>
                    Fired{" "}
                    {formatDistanceToNow(detail.createdAt, { addSuffix: true })}
                  </DialogDescription>
                </div>
                {flareIsResolved ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-300">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    Resolved
                  </span>
                ) : (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-300">
                    <Radio className="h-2.5 w-2.5" />
                    Open
                  </span>
                )}
              </div>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-md border border-white/10 bg-black/30 p-4">
                <p className="whitespace-pre-line text-sm leading-relaxed text-white/90">
                  {detail.description}
                </p>
              </div>

              <ResponsesSection
                responses={detail.responses}
                viewerIsOwner={viewerIsOwner}
                flareIsResolved={flareIsResolved}
              />

              {canRespond && (
                <ResponseComposer
                  value={responseText}
                  onChange={setResponseText}
                  onSubmit={handleSubmitResponse}
                  submitting={submittingResponse}
                  error={error}
                />
              )}

              {viewerIsOwner && !flareIsResolved && (
                <div className="flex justify-end border-t border-white/10 pt-3">
                  <button
                    type="button"
                    onClick={handleResolve}
                    disabled={resolving}
                    className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/20 disabled:opacity-50"
                  >
                    {resolving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    Resolve flare
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Subcomponents
// ─────────────────────────────────────────────────────────────────────

function ResponsesSection({
  responses,
  viewerIsOwner,
  flareIsResolved,
}: {
  responses: NonNullable<
    ReturnType<typeof useQuery<typeof api.flares.getFlareDetail>>
  >["responses"];
  viewerIsOwner: boolean;
  flareIsResolved: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/50">
        <MessageSquare className="h-3.5 w-3.5" />
        {responses.length === 0
          ? "No responses yet"
          : responses.length === 1
          ? "1 response"
          : `${responses.length} responses`}
      </div>
      {responses.length > 0 && (
        <div className="space-y-2">
          {responses.map((r) => (
            <FlareResponseItem
              key={r._id}
              response={r}
              viewerIsOwner={viewerIsOwner}
              flareIsResolved={flareIsResolved}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ResponseComposer({
  value,
  onChange,
  onSubmit,
  submitting,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  error: string | null;
}) {
  const canSubmit = value.trim().length > 0 && !submitting;
  return (
    <div className="space-y-2 border-t border-white/10 pt-3">
      <Textarea
        placeholder="Share what you'd try, link to a resource, or offer to chat."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[100px] resize-none"
        disabled={submitting}
      />
      {error && (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 p-2 text-sm text-red-300">
          {error}
        </p>
      )}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="inline-flex items-center gap-1.5 rounded-md border border-amber-500 bg-amber-500/20 px-3.5 py-2 text-sm font-medium text-amber-100 transition hover:bg-amber-500/40 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Posting
            </>
          ) : (
            <>
              <Send className="h-3.5 w-3.5" />
              Post response
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center gap-2 py-10">
      <Loader2 className="h-5 w-5 animate-spin text-white/40" />
      <p className="text-xs text-white/40">Loading flare…</p>
    </div>
  );
}

function NotFoundState() {
  return (
    <div className="py-10 text-center">
      <p className="text-sm text-white/60">This flare is no longer available.</p>
    </div>
  );
}
