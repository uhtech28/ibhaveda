"use client";

/**
 * One row in a list of users (sparker, contributor, etc.). Renders
 * avatar + name + handle + optional right-aligned subtext (e.g.
 * "sparked 3 days ago"). Clicking the row navigates to the user's
 * profile via `next/link` if a username is available.
 *
 * Used by:
 *   - SparkersDialog
 *   - ContributorsDialog
 *
 * Designed as a button-or-link wrapper so the whole row is one
 * keyboard / screen-reader target.
 */

import React from "react";
import Link from "next/link";

interface User {
  _id: string;
  displayName: string;
  username: string | null;
  avatar: string | null;
}

interface Props {
  user: User;
  /** Right-aligned meta line — e.g. "sparked 3d ago", "contributor", "author". */
  subtext?: string;
  /** Optional badge to render next to the name (e.g. "Author"). */
  badge?: string;
}

export function UserListItem({ user, subtext, badge }: Props) {
  const linkHref = user.username ? `/profile/${user.username}` : null;

  const inner = (
    <div className="flex w-full items-center gap-3 rounded-md px-2 py-2 transition hover:bg-white/[0.04]">
      <Avatar url={user.avatar} name={user.displayName} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-white">
            {user.displayName}
          </span>
          {badge && (
            <span className="shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/60">
              {badge}
            </span>
          )}
        </div>
        {user.username && (
          <p className="truncate text-xs text-white/40">@{user.username}</p>
        )}
      </div>
      {subtext && (
        <span className="shrink-0 text-xs text-white/40">{subtext}</span>
      )}
    </div>
  );

  if (linkHref) {
    return (
      <Link href={linkHref} className="block">
        {inner}
      </Link>
    );
  }
  return <div className="block">{inner}</div>;
}

function Avatar({ url, name }: { url: string | null; name: string }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        className="h-9 w-9 shrink-0 rounded-full border border-white/10 object-cover"
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
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs font-medium text-white/70">
      {initials || "?"}
    </div>
  );
}
