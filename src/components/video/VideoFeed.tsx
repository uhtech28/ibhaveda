"use client";

/**
 * Scrollable video feed. Renders a vertical list of `VideoCard`s
 * with newest first. Each card autoplays when it scrolls into view
 * (handled internally by `VideoCard` via IntersectionObserver).
 *
 * The feed is embeddable — drop into the existing community / feed
 * page rather than a dedicated route.
 *
 * Optional `compose` prop renders a "Post a video" trigger above the
 * list so users can post from the feed itself.
 */

import React, { useState } from "react";
import { Film, Loader2 } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { VideoCard } from "./VideoCard";
import { VideoComposer } from "./VideoComposer";

interface Props {
  /** Show the "Post a video" CTA above the feed. */
  compose?: boolean;
  limit?: number;
}

export function VideoFeed({ compose = true, limit = 20 }: Props) {
  const videos = useQuery(api.videos.getFeed, { limit });
  const [composerOpen, setComposerOpen] = useState(false);

  return (
    <section className="space-y-3">
      <header className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-white/70">
          <Film className="h-4 w-4 text-indigo-400" />
          Videos
        </h2>
        {compose && (
          <button
            type="button"
            onClick={() => setComposerOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-indigo-500 bg-indigo-500/20 px-3 py-1.5 text-xs font-medium text-indigo-100 transition hover:bg-indigo-500/40"
          >
            <Film className="h-3.5 w-3.5" />
            Post a video
          </button>
        )}
      </header>

      {videos === undefined ? (
        <LoadingState />
      ) : videos.length === 0 ? (
        <EmptyState onCompose={() => setComposerOpen(true)} compose={compose} />
      ) : (
        <div className="space-y-4">
          {videos.map((video) => (
            <VideoCard key={video._id} video={video} />
          ))}
        </div>
      )}

      <VideoComposer
        open={composerOpen}
        onOpenChange={setComposerOpen}
      />
    </section>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.015] p-6 text-sm text-white/40">
      <Loader2 className="h-4 w-4 animate-spin" />
      Loading videos…
    </div>
  );
}

function EmptyState({
  onCompose,
  compose,
}: {
  onCompose: () => void;
  compose: boolean;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.015] p-10 text-center">
      <Film className="mx-auto h-6 w-6 text-white/30" />
      <p className="mt-3 text-sm text-white/60">No videos yet.</p>
      {compose && (
        <button
          type="button"
          onClick={onCompose}
          className="mt-3 text-xs text-indigo-300 underline-offset-4 hover:underline"
        >
          Post the first one
        </button>
      )}
    </div>
  );
}
