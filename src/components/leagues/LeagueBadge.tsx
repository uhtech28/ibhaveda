"use client";

/**
 * Small tier badge — used inline anywhere we want to show a user's
 * league at a glance (profile pages, comment author rows, the HUD).
 *
 * The tier name and brand colour come from `leagueConstants`. The
 * badge is purely visual — no interactivity, no popover.
 */

import React from "react";
import { Trophy } from "lucide-react";
import {
  getTier,
  type LeagueTierId,
} from "@convex/leagueConstants";

interface Props {
  tier: LeagueTierId;
  size?: "sm" | "md";
  /** When true, only the icon renders — useful in tight spaces. */
  iconOnly?: boolean;
}

export function LeagueBadge({ tier, size = "sm", iconOnly = false }: Props) {
  const t = getTier(tier);

  const padding = size === "sm" ? "px-1.5 py-0.5" : "px-2.5 py-1";
  const text = size === "sm" ? "text-[10px]" : "text-xs";
  const iconSize = size === "sm" ? "h-2.5 w-2.5" : "h-3.5 w-3.5";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium uppercase tracking-wider ${padding} ${text}`}
      style={{
        borderColor: t.color,
        background: t.bg,
        color: t.color,
      }}
      aria-label={`${t.name} league`}
    >
      <Trophy className={iconSize} />
      {!iconOnly && t.name}
    </span>
  );
}
