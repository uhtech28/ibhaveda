"use client";

/**
 * Single video in the feed. Autoplays muted when scrolled into view,
 * pauses when scrolled out. Tap the mute icon to enable / disable
 * sound — the preference is persisted across the session via
 * `useMutePreference`.
 *
 * Layout reserves the video's aspect ratio via the stored width and
 * height so the feed doesn't reflow when binaries arrive. The poster
 * shows under the playing video so the experience never feels blank.
 */

import React, { useEffect, useRef, useState } from "react";
import { Loader2, Maximize2, MoreHorizontal, Pause, Play, Trash2, Volume2, VolumeX } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { FeedVideo } from "@convex/videos";
import { useMutePreference } from "@/lib/video/useMutePreference";

interface Props {
  video: FeedVideo;
  /** When false, the card never autoplays (e.g. in a paused state during compose). */
  autoplayEnabled?: boolean;
  onDeleted?: () => void;
}

export function VideoCard({ video, autoplayEnabled = true, onDeleted }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = useMutePreference();
  const [isPlaying, setIsPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const deleteVideo = useMutation(api.videos.deleteVideo);

  // Autoplay when the card is at least 60% visible; pause when below.
  useEffect(() => {
    if (!autoplayEnabled) return;
    const el = wrapperRef.current;
    const v = videoRef.current;
    if (!el || !v) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.intersectionRatio >= 0.6) {
            v.play().then(() => setIsPlaying(true)).catch(() => {
              // Browser blocked autoplay (usually because the user
              // hasn't interacted with the page yet, or the video
              // isn't actually muted). Silent — the play button still
              // works on tap.
              setIsPlaying(false);
            });
          } else if (entry.intersectionRatio < 0.4) {
            v.pause();
            setIsPlaying(false);
          }
        }
      },
      { threshold: [0, 0.4, 0.6, 1] },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [autoplayEnabled]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      void v.play().then(() => setIsPlaying(true));
    } else {
      v.pause();
      setIsPlaying(false);
    }
  };

  const handleFullscreen = () => {
    const v = videoRef.current;
    if (!v) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void v.requestFullscreen?.();
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this video? This can't be undone.")) return;
    await deleteVideo({ videoId: video._id });
    onDeleted?.();
  };

  const aspectRatio =
    video.width > 0 && video.height > 0
      ? `${video.width} / ${video.height}`
      : undefined;

  return (
    <article
      ref={wrapperRef}
      className="overflow-hidden rounded-lg border border-white/10 bg-black"
    >
      {/* Video surface */}
      <div className="relative bg-black" style={{ aspectRatio }}>
        {video.processingStatus === "processing" ? (
          // PRD §5.4 + edge case: video still transcoding on the
          // managed service. Show the thumbnail + a processing pill.
          <div className="relative h-full min-h-[200px]">
            {video.posterUrl ? (
              <img
                src={video.posterUrl}
                alt=""
                className="h-full w-full object-cover opacity-70"
              />
            ) : null}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="rounded-full bg-black/70 px-3 py-1 text-xs font-mono uppercase tracking-widest text-white/80">
                Processing…
              </span>
            </div>
          </div>
        ) : video.playbackUrl ? (
          // Managed service (Mux / Cloudflare Stream) — HLS playback.
          <HlsVideo
            ref={videoRef}
            src={video.playbackUrl}
            poster={video.posterUrl ?? undefined}
            muted={muted}
            onWaiting={() => setBuffering(true)}
            onPlaying={() => setBuffering(false)}
            onClick={togglePlay}
          />
        ) : video.videoUrl ? (
          <video
            ref={videoRef}
            src={video.videoUrl}
            poster={video.posterUrl ?? undefined}
            muted={muted}
            loop
            playsInline
            preload="metadata"
            onWaiting={() => setBuffering(true)}
            onPlaying={() => setBuffering(false)}
            onClick={togglePlay}
            className="block h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full min-h-[200px] items-center justify-center text-sm text-white/40">
            Video unavailable
          </div>
        )}

        {buffering && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30">
            <Loader2 className="h-6 w-6 animate-spin text-white/80" />
          </div>
        )}

        {!isPlaying && video.videoUrl && (
          <button
            type="button"
            onClick={togglePlay}
            aria-label="Play video"
            className="absolute inset-0 flex items-center justify-center bg-black/20 transition hover:bg-black/30"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-black/50 text-white backdrop-blur-sm">
              <Play className="h-6 w-6" />
            </span>
          </button>
        )}

        {/* Bottom-right controls */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setMuted(!muted)}
            aria-label={muted ? "Unmute" : "Mute"}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70"
          >
            {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70"
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={handleFullscreen}
            aria-label="Fullscreen"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-start gap-3 p-3">
        <Avatar
          url={video.uploader.avatar}
          name={video.uploader.displayName}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-sm font-medium text-white">
              {video.uploader.displayName}
            </span>
            <span className="shrink-0 text-xs text-white/40">
              {formatDistanceToNow(video.createdAt, { addSuffix: true })}
            </span>
          </div>
          {video.caption && (
            <p className="mt-1 text-sm leading-relaxed text-white/80">
              {video.caption}
            </p>
          )}
        </div>
        {video.isOwnedByViewer && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Video actions"
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 transition hover:bg-white/5 hover:text-white"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full z-10 mt-1 min-w-[140px] rounded-md border border-white/10 bg-[#0E0C17] py-1 shadow-lg">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-300 transition hover:bg-red-500/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

/**
 * HLS-capable <video> wrapper. Safari plays .m3u8 natively. Other
 * browsers need hls.js — dynamically imported on first use so the
 * library only ships when a managed-service video appears.
 */
const HlsVideo = React.forwardRef<
  HTMLVideoElement,
  {
    src: string;
    poster?: string;
    muted: boolean;
    onWaiting: () => void;
    onPlaying: () => void;
    onClick: () => void;
  }
>(function HlsVideo({ src, poster, muted, onWaiting, onPlaying, onClick }, ref) {
  const localRef = useRef<HTMLVideoElement | null>(null);
  React.useImperativeHandle(ref, () => localRef.current as HTMLVideoElement);

  useEffect(() => {
    const video = localRef.current;
    if (!video) return;

    // Safari + iOS: native HLS support, just set src.
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      return;
    }

    // Other browsers: lazy-load hls.js.
    let hlsInstance: { destroy: () => void } | null = null;
    let cancelled = false;
    (async () => {
      try {
        // @ts-expect-error — hls.js is optional, loaded only if installed
        const mod = await import("hls.js");
        if (cancelled) return;
        const Hls = (mod as { default: any }).default ?? (mod as any);
        if (Hls.isSupported()) {
          const hls = new Hls({ enableWorker: true });
          hls.loadSource(src);
          hls.attachMedia(video);
          hlsInstance = hls;
        } else {
          // Last-ditch fallback — set src and let the browser try.
          video.src = src;
        }
      } catch {
        // hls.js not installed — set src directly.
        video.src = src;
      }
    })();

    return () => {
      cancelled = true;
      hlsInstance?.destroy();
    };
  }, [src]);

  return (
    <video
      ref={localRef}
      poster={poster}
      muted={muted}
      loop
      playsInline
      preload="metadata"
      onWaiting={onWaiting}
      onPlaying={onPlaying}
      onClick={onClick}
      className="block h-full w-full object-cover"
    />
  );
});

function Avatar({ url, name }: { url: string | null; name: string }) {
  if (url) {
    return (
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
