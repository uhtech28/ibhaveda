"use client";

/**
 * Single response inside the flare detail dialog.
 *
 * Displays the responder's avatar, name, relative time, and the
 * response content. Shows a "Helpful" badge when the flare owner has
 * marked it. Owners viewing their own flare see an inline "Mark
 * helpful" button on each unmarked response.
 */

import React, { useCallback, useState } from "react";
import { CheckCircle2, Loader2, ThumbsUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

interface Props {
  response: {
    _id: Id<"flareResponses">;
    content: string;
    createdAt: number;
    isHelpful?: boolean;
    responder: {
      _id: Id<"users">;
      displayName: string;
      avatar: string | null;
    };
  };
  /** True if the viewer is the flare owner — enables the mark-helpful action. */
  viewerIsOwner: boolean;
  /** True if the flare itself is resolved — disables the action. */
  flareIsResolved: boolean;
}

export function FlareResponseItem({
  response,
  viewerIsOwner,
  flareIsResolved,
}: Props) {
  const [pending, setPending] = useState(false);
  const markHelpful = useMutation(api.flares.markResponseHelpful);

  const handleMarkHelpful = useCallback(async () => {
    if (pending) return;
    setPending(true);
    try {
      await markHelpful({ responseId: response._id });
    } finally {
      setPending(false);
    }
  }, [markHelpful, pending, response._id]);

  return (
    <div className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-3">
      <Avatar
        url={response.responder.avatar}
        name={response.responder.displayName}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-medium text-white">
            {response.responder.displayName}
          </span>
          <span className="shrink-0 text-xs text-white/40">
            {formatDistanceToNow(response.createdAt, { addSuffix: true })}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-white/80">
          {response.content}
        </p>

        <div className="mt-1 flex items-center justify-between">
          {response.isHelpful ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Marked helpful
            </span>
          ) : (
            <span />
          )}

          {viewerIsOwner && !response.isHelpful && !flareIsResolved && (
            <button
              type="button"
              onClick={handleMarkHelpful}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 px-2.5 py-1 text-xs font-medium text-emerald-300 transition hover:border-emerald-400 hover:bg-emerald-500/10 disabled:opacity-50"
            >
              {pending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <ThumbsUp className="h-3 w-3" />
              )}
              Mark helpful
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Avatar({ url, name }: { url: string | null; name: string }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        className="h-8 w-8 shrink-0 rounded-full border border-white/10 object-cover"
      />
    );
  }
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs font-medium text-white/70">
      {initials || "?"}
    </div>
  );
}
