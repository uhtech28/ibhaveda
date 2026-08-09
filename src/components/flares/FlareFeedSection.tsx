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
          {/* Header label trimmed from "Open flares" → "Flares"
              per product request — the OPEN badge on each card
              already communicates status, so the section label just
              names the surface. */}
          <h2 className="flex shrink-0 items-center gap-2 text-sm font-medium uppercase tracking-wider text-white/70">
            <Radio className="h-4 w-4 text-amber-400" />
            Flares
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
        // Fixed-height scroll window — reserves the visual space of
        // ONE flare card + a small peek so the section always occupies
        // the same amount of viewport regardless of how many flares
        // exist. Product spec: "keep space for 1 flare visible, make
        // sure its all constant for all pc devices all android ios
        // mobile".
        //
        // Why a single fixed pixel value across every breakpoint:
        //  - Desktop grid-cols-2 lays out two cards per row (~230px
        //    tall including padding + gap), so 260px shows exactly one
        //    row plus ~30px peek of the next — enough to signal "there
        //    is more below" without stealing more of the feed.
        //  - Mobile single-column: one card ≈ 200px tall, 260px shows
        //    ~1.3 cards — same "one full flare + peek" behaviour.
        //  - Using a single px height (not svh/dvh/vh) keeps the
        //    layout identical whether the mobile browser's URL bar is
        //    expanded or collapsed and immune to iOS Safari's
        //    100vh-includes-toolbar quirk that shifts the whole feed.
        //
        // `pr-1` reserves space so the scrollbar doesn't overlap the
        // right-hand card border. `flare-scroll` (styles below) gives
        // a subtle amber-tinted scrollbar instead of the browser
        // default chunky grey one — same rendering on WebKit / Blink /
        // Gecko.
        <div className="flare-scroll max-h-[260px] overflow-y-auto pr-1">
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
          <style jsx>{`
            .flare-scroll {
              /* Same amber-tinted thin scrollbar on Firefox + WebKit
                 so the visual is identical on desktop & mobile. */
              scrollbar-width: thin;
              scrollbar-color: rgba(251, 191, 36, 0.35) transparent;
              /* Prevent overscroll from bubbling up to the page —
                 without this, flick-scrolling past the last flare on
                 iOS/Android rubber-bands the WHOLE feed and can even
                 dismiss the mobile browser toolbar (pushes chrome
                 up/down mid-scroll), which was jarring. */
              overscroll-behavior: contain;
              /* Momentum scrolling on iOS. Chrome ignores harmlessly. */
              -webkit-overflow-scrolling: touch;
            }
            .flare-scroll::-webkit-scrollbar {
              width: 6px;
            }
            .flare-scroll::-webkit-scrollbar-track {
              background: transparent;
            }
            .flare-scroll::-webkit-scrollbar-thumb {
              background: rgba(251, 191, 36, 0.35);
              border-radius: 3px;
            }
            .flare-scroll::-webkit-scrollbar-thumb:hover {
              background: rgba(251, 191, 36, 0.55);
            }
          `}</style>
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
