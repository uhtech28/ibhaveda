"use client";

/**
 * "Who's on this team" popup. Triggered from the contributor counter
 * on an idea card or venture page. Shows the author first, then every
 * accepted contributor in acceptance order.
 *
 * Wired to the `getIdeaContributors` query. Renders as a bottom sheet
 * on mobile and a centered modal on desktop (PRD §8 AC5) via
 * `ResponsivePopup`.
 */

import React from "react";
import { Loader2, Users } from "lucide-react";
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

export function ContributorsDialog({ ideaId, onOpenChange }: Props) {
  const team = useQuery(
    api.engagement.getIdeaContributors,
    ideaId ? { ideaId } : "skip",
  );

  const headerSubtext =
    team === undefined
      ? "Loading…"
      : team.length === 0
        ? "No one on this team yet."
        : team.length === 1
          ? "Solo idea — author only"
          : `${team.length} on the team`;

  return (
    <ResponsivePopup
      open={ideaId !== null}
      onOpenChange={onOpenChange}
      title={
        <span className="flex items-center gap-2">
          <Users className="h-5 w-5 text-emerald-300" />
          On this idea
        </span>
      }
      description={headerSubtext}
    >
      {team === undefined ? (
        <LoadingState />
      ) : team.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="max-h-[60vh] divide-y divide-white/5 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10">
          {team.map((entry) => (
            <li key={entry.user._id} className="py-1">
              <UserListItem
                user={entry.user}
                badge={entry.role === "author" ? "Author" : undefined}
                subtext={
                  entry.role === "author"
                    ? "Started this idea"
                    : `Joined ${formatDistanceToNow(entry.joinedAt, { addSuffix: true })}`
                }
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
      Loading team…
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.015] p-6 text-center">
      <Users className="mx-auto h-5 w-5 text-white/30" />
      <p className="mt-2 text-sm text-white/60">No one on this team yet.</p>
    </div>
  );
}
