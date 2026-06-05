"use client";

/**
 * "Who sparked this idea" popup. Triggered from the spark counter on
 * an idea card. Shows newest sparkers first with relative-time
 * subtext.
 *
 * Wired to the `getIdeaSparkers` query, which respects private-idea
 * privacy: viewers without access see an empty list rather than an
 * error.
 *
 * Renders as a bottom sheet on mobile and a centered modal on desktop
 * (PRD §8 AC5) via `ResponsivePopup`.
 */

import React from "react";
import { Loader2, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { ResponsivePopup } from "./ResponsivePopup";
import { UserListItem } from "./UserListItem";

interface Props {
  ideaId: Id<"ideas"> | null;
  onOpenChange: (next: boolean) => void;
}

export function SparkersDialog({ ideaId, onOpenChange }: Props) {
  const sparkers = useQuery(
    api.engagement.getIdeaSparkers,
    ideaId ? { ideaId, limit: 100 } : "skip",
  );

  const subtext =
    sparkers === undefined
      ? "Loading…"
      : sparkers.length === 0
        ? "No sparks yet."
        : sparkers.length === 1
          ? "1 person liked this idea"
          : `${sparkers.length} people liked this idea`;

  return (
    <ResponsivePopup
      open={ideaId !== null}
      onOpenChange={onOpenChange}
      title={
        <span className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-400" />
          People who sparked this
        </span>
      }
      description={subtext}
    >
      {sparkers === undefined ? (
        <LoadingState />
      ) : sparkers.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="max-h-[60vh] divide-y divide-white/5 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10">
          {sparkers.map((entry) => (
            <li key={entry.user._id} className="py-1">
              <UserListItem
                user={entry.user}
                subtext={formatDistanceToNow(entry.sparkedAt, {
                  addSuffix: true,
                })}
              />
            </li>
          ))}
        </ul>
      )}
    </ResponsivePopup>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center gap-2 px-2 py-6 text-sm text-white/40">
      <Loader2 className="h-4 w-4 animate-spin" />
      Loading sparkers…
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
