"use client";

/**
 * @file MyFlaresSection.tsx
 * @description Profile-page section listing a user's flares, grouped by
 *   status (open / resolved / expired). Only rendered on the profile
 *   owner's own page so private state (expired flares, resolved history)
 *   isn't leaked to visitors.
 *
 * Uses the `getUserFlares` query which returns raw flare rows for a
 * given userId. We group by status client-side for display.
 */

import React, { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { Radio, CheckCircle2, Clock, XCircle } from "lucide-react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { FlareDetailDialog } from "./FlareDetailDialog";

interface Props {
  userId: Id<"users">;
}

type FlareStatus = "open" | "resolved" | "expired" | "closed";

export function MyFlaresSection({ userId }: Props) {
  const flares = useQuery(api.flares.getUserFlares, { userId });
  const [openFlareId, setOpenFlareId] = useState<Id<"flares"> | null>(null);

  const grouped = useMemo(() => {
    const groups: Record<FlareStatus, typeof flares> = {
      open: [],
      resolved: [],
      expired: [],
      closed: [],
    };
    if (!flares) return groups;
    for (const flare of flares) {
      const g = groups[flare.status as FlareStatus];
      if (g) g.push(flare);
    }
    // Sort each group newest first
    for (const key of Object.keys(groups) as FlareStatus[]) {
      groups[key]?.sort((a, b) => b.createdAt - a.createdAt);
    }
    return groups;
  }, [flares]);

  if (flares === undefined) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6 text-center text-sm text-white/50">
        Loading your flares…
      </div>
    );
  }

  if (flares.length === 0) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6 text-center">
        <Radio className="mx-auto mb-2 h-6 w-6 text-amber-400/60" />
        <p className="text-sm text-white/70">You haven&apos;t fired any flares yet</p>
        <p className="mt-1 text-xs text-white/40">
          Stuck on something? Fire a Flare from the feed or a checkpoint.
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <header className="flex items-baseline gap-3">
        <h2 className="flex shrink-0 items-center gap-2 text-sm font-medium uppercase tracking-wider text-white/70">
          <Radio className="h-4 w-4 text-amber-400" />
          My Flares
        </h2>
        <span className="text-xs text-white/40">
          {flares.length} total &middot; {grouped.open.length} open &middot; {grouped.resolved.length} resolved
        </span>
      </header>

      <StatusGroup
        label="Open"
        icon={<Clock className="h-4 w-4 text-amber-400" />}
        accent="border-amber-500/30 bg-amber-500/5"
        items={grouped.open}
        onSelect={setOpenFlareId}
      />
      <StatusGroup
        label="Resolved"
        icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />}
        accent="border-emerald-500/30 bg-emerald-500/5"
        items={grouped.resolved}
        onSelect={setOpenFlareId}
      />
      <StatusGroup
        label="Expired"
        icon={<XCircle className="h-4 w-4 text-white/40" />}
        accent="border-white/10 bg-white/[0.02]"
        items={grouped.expired}
        onSelect={setOpenFlareId}
      />

      <FlareDetailDialog
        flareId={openFlareId}
        currentUserId={userId}
        onOpenChange={(next) => {
          if (!next) setOpenFlareId(null);
        }}
      />
    </section>
  );
}

function StatusGroup({
  label,
  icon,
  accent,
  items,
  onSelect,
}: {
  label: string;
  icon: React.ReactNode;
  accent: string;
  items: Array<{
    _id: Id<"flares">;
    description: string;
    createdAt: number;
    expertiseTag?: string;
    status: string;
  }>;
  onSelect: (id: Id<"flares">) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/50">
        {icon}
        <span>{label}</span>
        <span className="text-white/30">({items.length})</span>
      </div>
      <div className="grid gap-2">
        {items.map((flare) => (
          <button
            key={flare._id}
            type="button"
            onClick={() => onSelect(flare._id)}
            className={`w-full rounded-lg border ${accent} px-4 py-3 text-left transition hover:brightness-125`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="line-clamp-2 text-sm text-white/90">
                {flare.description}
              </p>
              <time className="shrink-0 text-[10px] uppercase tracking-wide text-white/40">
                {formatRelativeDate(flare.createdAt)}
              </time>
            </div>
            {flare.expertiseTag && (
              <div className="mt-2 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/60">
                {flare.expertiseTag}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function formatRelativeDate(ts: number): string {
  const diff = Date.now() - ts;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}
