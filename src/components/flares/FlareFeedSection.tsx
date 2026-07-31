"use client";

/**
 * The flare feed, designed to be embedded inside the existing community
 * / feed page rather than living on its own route.
 *
 * Renders:
 *   - A header with the section title and the user's own active flares
 *     count (if any)
 *   - The list of open community flares as `FlareCard`s
 *   - Click on any card → opens `FlareDetailDialog` with that flare
 *
 * The owning user id is fetched once at the section level so cards
 * don't each do their own auth lookup.
 */

import React, { useEffect, useState } from "react";
import { Loader2, Radio } from "lucide-react";
import { useQuery } from "convex/react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { FlareCard } from "./FlareCard";
import { FlareDetailDialog } from "./FlareDetailDialog";

interface Props {
  limit?: number;
  /** When provided, the feed will render a "You" tag on this user's cards. */
  currentUserId?: Id<"users"> | null;
}

export function FlareFeedSection({ limit = 20, currentUserId = null }: Props) {
  const flares = useQuery(api.flares.getOpenFlares, { limit });
  const [openFlareId, setOpenFlareId] = useState<Id<"flares"> | null>(null);

  // Deep-link support: notification tap on a flare_response_* notif
  // navigates here with ?flare=<flareId> in the URL. On mount, if that
  // param is present, open the FlareDetailDialog for that flare and
  // strip the param so back-nav + refresh don't re-trigger.
  const searchParams = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    const flareParam = searchParams?.get("flare");
    if (flareParam) {
      setOpenFlareId(flareParam as Id<"flares">);
      const next = new URLSearchParams(searchParams?.toString() ?? "");
      next.delete("flare");
      const qs = next.toString();
      router.replace(qs ? `/feed?${qs}` : "/feed", { scroll: false });
    }
    // Only on first mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="space-y-3">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-3 min-w-0">
          <h2 className="flex shrink-0 items-center gap-2 text-sm font-medium uppercase tracking-wider text-white/70">
            <Radio className="h-4 w-4 text-amber-400" />
            Open flares
          </h2>
          {flares && flares.length > 0 && (
            <span className="text-xs text-white/40 truncate">
              {flares.length} {flares.length === 1 ? "person" : "people"} need a hand
            </span>
          )}
        </div>
        {/* "Fire a Flare" CTA intentionally NOT on the feed — flares
            can only be fired from inside a project on the map (the
            CheckpointPanel's flare button). Tutorial's flare step
            points at that map button, not this section. */}
      </header>

      {flares === undefined ? (
        <LoadingState />
      ) : flares.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {flares
            .filter((flare) => flare.status !== "closed")
            .map((flare) => (
            <FlareCard
              key={flare._id}
              flare={flare as typeof flare & { status: "open" | "resolved" }}
              isOwn={
                currentUserId !== null && flare.owner._id === currentUserId
              }
              onClick={() => setOpenFlareId(flare._id)}
            />
          ))}
        </div>
      )}

      <FlareDetailDialog
        flareId={openFlareId}
        currentUserId={currentUserId}
        onOpenChange={(next) => {
          if (!next) setOpenFlareId(null);
        }}
      />
    </section>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.015] p-6 text-sm text-white/40">
      <Loader2 className="h-4 w-4 animate-spin" />
      Loading flares…
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.015] p-8 text-center">
      <Radio className="mx-auto h-6 w-6 text-white/30" />
      <p className="mt-3 text-sm text-white/60">No open flares right now.</p>
      <p className="mt-1 text-xs text-white/40">
        When someone gets stuck, you'll see their request here.
      </p>
    </div>
  );
}
