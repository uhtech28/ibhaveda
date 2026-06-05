"use client";

/**
 * Single open-flare preview card. Click anywhere on the card to open
 * the detail dialog. Visually compact — owner avatar + name + relative
 * time, the description (truncated to two lines), and a response-count
 * pill on the right.
 *
 * Owned-by-current-user variant: shows a "You" tag so the user can
 * quickly find their own flares in the feed.
 */

import React from "react";
import { Radio, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Id } from "@convex/_generated/dataModel";

interface Props {
  flare: {
    _id: Id<"flares">;
    description: string;
    createdAt: number;
    status: "open" | "resolved";
    owner: {
      _id: Id<"users">;
      displayName: string;
      avatar: string | null;
    };
    responseCount: number;
  };
  isOwn?: boolean;
  onClick: () => void;
}

export function FlareCard({ flare, isOwn, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex w-full flex-col gap-3 rounded-lg border border-white/10 bg-white/[0.015] p-4 text-left transition hover:border-amber-500/40 hover:bg-amber-500/[0.04]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar
            url={flare.owner.avatar}
            name={flare.owner.displayName}
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">
              {flare.owner.displayName}
              {isOwn && (
                <span className="ml-1.5 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/60">
                  You
                </span>
              )}
            </p>
            <p className="text-xs text-white/40">
              {formatDistanceToNow(flare.createdAt, { addSuffix: true })}
            </p>
          </div>
        </div>
        <StatusPill status={flare.status} />
      </div>

      <p className="line-clamp-2 text-sm leading-relaxed text-white/80">
        {flare.description}
      </p>

      <div className="flex items-center justify-between border-t border-white/5 pt-3">
        <span className="inline-flex items-center gap-1.5 text-xs text-white/50">
          <MessageSquare className="h-3.5 w-3.5" />
          {flare.responseCount === 0
            ? "No responses yet"
            : flare.responseCount === 1
            ? "1 response"
            : `${flare.responseCount} responses`}
        </span>
        <span className="text-xs text-amber-300/70 opacity-0 transition group-hover:opacity-100">
          View →
        </span>
      </div>
    </button>
  );
}

function StatusPill({ status }: { status: "open" | "resolved" }) {
  if (status === "open") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-300">
        <Radio className="h-2.5 w-2.5" />
        Open
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-300">
      Resolved
    </span>
  );
}

function Avatar({ url, name }: { url: string | null; name: string }) {
  if (url) {
    return (
      // Plain <img> intentional — avatars are tiny and pre-sized; next/image
      // adds overhead with no payoff at this scale.
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
