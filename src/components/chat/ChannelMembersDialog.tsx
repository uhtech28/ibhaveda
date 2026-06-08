"use client";

/**
 * "Who's in this channel" popup. Triggered from the channel-members
 * pill in `ChatThread` header. Reuses the §8 `ResponsivePopup` +
 * `UserListItem` primitives so the row layout matches the sparkers
 * and contributors lists (PRD §10 AC6).
 *
 * Read-only by default. When the viewer is an admin (creator), a
 * "Manage members" link footer routes to `ChannelSettingsDialog`,
 * which owns the add/remove flows.
 */

import React from "react";
import { Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { ResponsivePopup, UserListItem } from "@/components/engagement";

interface Props {
  conversationId: Id<"conversations"> | null;
  /** Show a "Manage members" link footer (only for admins). */
  canManage?: boolean;
  onOpenChange: (next: boolean) => void;
  onManageMembers?: () => void;
}

export function ChannelMembersDialog({
  conversationId,
  canManage = false,
  onOpenChange,
  onManageMembers,
}: Props) {
  const members = useQuery(
    api.chat.getGroupMembers,
    conversationId ? { conversationId } : "skip",
  );

  const subtext =
    members === undefined
      ? "Loading…"
      : members.length === 1
        ? "1 member in this channel"
        : `${members.length} members in this channel`;

  return (
    <ResponsivePopup
      open={conversationId !== null}
      onOpenChange={onOpenChange}
      title={
        <span className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-300" />
          Channel members
        </span>
      }
      description={subtext}
    >
      {members === undefined ? (
        <div className="px-2 py-6 text-sm text-white/40">Loading…</div>
      ) : members.length === 0 ? (
        <div className="rounded-md border border-white/10 bg-white/[0.015] p-6 text-center">
          <Users className="mx-auto h-5 w-5 text-white/30" />
          <p className="mt-2 text-sm text-white/60">No members yet.</p>
        </div>
      ) : (
        <ul className="max-h-[60vh] divide-y divide-white/5 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10">
          {members.map((m) => (
            <li key={m.id} className="py-1">
              <UserListItem
                user={{
                  _id: m.id,
                  displayName: m.displayName ?? "Member",
                  username: m.username ?? null,
                  avatar: m.avatar ?? null,
                }}
                badge={m.role === "admin" ? "Admin" : undefined}
                subtext={
                  m.joinedAt
                    ? `Joined ${formatDistanceToNow(m.joinedAt, {
                        addSuffix: true,
                      })}`
                    : undefined
                }
              />
            </li>
          ))}
        </ul>
      )}

      {canManage && (
        <div className="mt-3 flex justify-end border-t border-white/8 pt-3">
          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
              onManageMembers?.();
            }}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-blue-300 transition hover:bg-blue-300/10"
          >
            Manage members →
          </button>
        </div>
      )}
    </ResponsivePopup>
  );
}
