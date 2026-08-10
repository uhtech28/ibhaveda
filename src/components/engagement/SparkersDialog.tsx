"use client";

/**
 * "Who sparked this idea" popup. Triggered from the spark counter on
 * an idea card. Shows newest sparkers first with compact relative-time
 * subtext.
 *
 * Wired to the `getIdeaSparkers` query, which respects private-idea
 * privacy: viewers without access see an empty list rather than an
 * error.
 *
 * Renders as a bottom sheet on mobile and a centered modal on desktop
 * (PRD section 8 AC5) via `ResponsivePopup`.
 */

import React from "react";
import { Loader2, Sparkles } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { ResponsivePopup } from "./ResponsivePopup";
import { UserListItem } from "./UserListItem";

interface Props {
  ideaId: Id<"ideas"> | null;
  sparkCount?: number;
  onOpenChange: (next: boolean) => void;
}

export function SparkersDialog({
  ideaId,
  sparkCount: providedSparkCount,
  onOpenChange,
}: Props) {
  const sparkers = useQuery(
    api.engagement.getIdeaSparkers,
    ideaId ? { ideaId, limit: 100 } : "skip",
  );

  const sparkCount = providedSparkCount ?? sparkers?.length ?? 0;
  const subtext =
    sparkers === undefined
      ? "Loading..."
      : sparkCount === 0
        ? "No sparks yet."
        : sparkCount === 1
          ? "1 person liked this idea"
          : `${sparkCount} people liked this idea`;

  return (
    <ResponsivePopup
      open={ideaId !== null}
      onOpenChange={onOpenChange}
      title={
        <span className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-400" />
          {sparkCount} Sparks
        </span>
      }
      description={subtext}
      descriptionClassName="pl-7"
      mobilePresentation="modal"
    >
      {sparkers === undefined ? (
        <LoadingState />
      ) : sparkers.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="max-h-[52vh] divide-y divide-white/5 overflow-y-auto sm:max-h-[60vh] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10">
          {sparkers.map((entry) => (
            <li key={entry.user._id} className="py-1">
              <UserListItem
                user={entry.user}
                subtext={formatCompactAge(entry.sparkedAt)}
              />
            </li>
          ))}
        </ul>
      )}
    </ResponsivePopup>
  );
}

function formatCompactAge(timestamp: number) {
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);

  if (elapsedMinutes < 1) return "now";
  if (elapsedMinutes < 60) return `${elapsedMinutes}m`;

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours}h`;

  const elapsedDays = Math.floor(elapsedHours / 24);
  if (elapsedDays < 7) return `${elapsedDays}d`;

  const elapsedWeeks = Math.floor(elapsedDays / 7);
  if (elapsedDays < 30) return `${elapsedWeeks}w`;

  const elapsedMonths = Math.floor(elapsedDays / 30);
  if (elapsedDays < 365) return `${elapsedMonths}m`;

  return `${Math.floor(elapsedDays / 365)}y`;
}

function LoadingState() {
  return (
    <div className="flex items-center gap-2 px-2 py-6 text-sm text-white/40">
      <Loader2 className="h-4 w-4 animate-spin" />
      Loading sparkers...
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.015] p-6 text-center">
      <Sparkles className="mx-auto h-5 w-5 text-white/30" />
      <p className="mt-2 text-sm text-white/60">No sparks yet.</p>
      <p className="mt-1 text-xs text-white/40">
        Be the first to spark this idea.
      </p>
    </div>
  );
}
