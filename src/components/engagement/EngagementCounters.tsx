"use client";

/**
 * Convenience pair of clickable counter pills — spark count + contributor
 * count for an idea. Wraps both dialogs so any page that wants engagement
 * popups can drop in a single component instead of wiring state + two
 * dialogs separately.
 *
 * If you only want one of the two counters, use `SparkersDialog` or
 * `ContributorsDialog` directly.
 */

import React, { useState } from "react";
import { Sparkles, Users } from "lucide-react";
import type { Id } from "@convex/_generated/dataModel";
import { SparkersDialog } from "./SparkersDialog";
import { ContributorsDialog } from "./ContributorsDialog";

interface Props {
  ideaId: Id<"ideas">;
  sparkCount: number;
  contributorCount: number;
  /** Visual scale — "compact" for inline use in cards, "default" for page chrome. */
  size?: "compact" | "default";
}

export function EngagementCounters({
  ideaId,
  sparkCount,
  contributorCount,
  size = "default",
}: Props) {
  const [sparkersOpen, setSparkersOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);

  const sizeClass =
    size === "compact"
      ? "text-[11px] gap-1 px-1.5 py-0.5"
      : "text-xs gap-1.5 px-2 py-1";
  const iconSize = size === "compact" ? "h-3 w-3" : "h-3.5 w-3.5";

  return (
    <>
      <div className="inline-flex items-center gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (sparkCount > 0) setSparkersOpen(true);
          }}
          disabled={sparkCount === 0}
          className={`inline-flex items-center rounded-md text-white/60 transition hover:text-amber-300 disabled:cursor-default disabled:opacity-60 disabled:hover:text-white/60 ${sizeClass}`}
          aria-label="Show people who sparked this idea"
        >
          <Sparkles className={iconSize} />
          {sparkCount}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setTeamOpen(true);
          }}
          className={`inline-flex items-center rounded-md text-white/60 transition hover:text-emerald-300 ${sizeClass}`}
          aria-label="Show people contributing to this idea"
        >
          <Users className={iconSize} />
          {contributorCount}
        </button>
      </div>

      <SparkersDialog
        ideaId={sparkersOpen ? ideaId : null}
        onOpenChange={(next) => {
          if (!next) setSparkersOpen(false);
        }}
      />
      <ContributorsDialog
        ideaId={teamOpen ? ideaId : null}
        onOpenChange={(next) => {
          if (!next) setTeamOpen(false);
        }}
      />
    </>
  );
}
