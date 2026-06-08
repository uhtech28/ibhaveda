"use client";

/**
 * Client-side video preparation + upload.
 *
 * Pipeline:
 *   1. Validate file type, size, and duration (peek metadata via a
 *      hidden <video> element before committing to the upload).
 *   2. Extract a poster frame at t=0.5s (avoids the black first frame
 *      that's common in user-recorded videos).
 *   3. Upload both binaries to Convex storage in parallel.
 *   4. Return the two storage ids and metadata for the mutation call.
 *
 * No transcoding — modern browsers play all the allowed formats
 * natively. If the user uploads something exotic, the server still
 * accepts it but playback may fail on some clients.
 */

import { useCallback } from "react";
import { useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

// PRD §5.2 — short-form caps: 30s, ~25MB, mp4/webm/mov only.
// Mirrored in convex/videos.ts; change in both places together.
export const VIDEO_CONSTRAINTS = {
  MAX_BYTES: 25 * 1024 * 1024,
  MAX_DURATION_MS: 30_000,
  MAX_DIMENSION_PX: 1920,
  ALLOWED_MIME: [
    "video/mp4",
    "video/webm",
    "video/quicktime",
  ] as const,
  POSTER_AT_SECONDS: 0.5,
  POSTER_QUALITY: 0.82,
} as const;

export class VideoValidationError extends Error {
  constructor(
    public readonly code:
      | "wrong_type"
      | "too_large"
      | "too_long"
      | "decode_failed"
      | "no_canvas",
    message: string,
  ) {
    super(message);
    this.name = "VideoValidationError";
  }
}

// ─────────────────────────────────────────────────────────────────────
// Metadata probe + validation
// ─────────────────────────────────────────────────────────────────────

export interface VideoMetadata {
  durationMs: number;
  width: number;
  height: number;
}

/**
 * Read duration and dimensions from a video file without uploading it.
 * Uses a hidden <video> element + the `loadedmetadata` event so we
 * don't have to decode the entire stream.
 */
export async function probeVideoMetadata(file: File): Promise<VideoMetadata> {
  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;

    // Attach listeners BEFORE setting src — otherwise a cached or
    // synchronously-decoded video can fire `loadedmetadata` before
    // the handler is registered and the Promise never resolves.
    const ready = new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () =>
        reject(
          new VideoValidationError(
            "decode_failed",
            "Couldn't read this video file",
          ),
        );
    });
    video.src = url;
    await ready;

    return {
      durationMs: Math.round(video.duration * 1000),
      width: video.videoWidth,
      height: video.videoHeight,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function validateVideoFile(file: File): void {
  if (!VIDEO_CONSTRAINTS.ALLOWED_MIME.includes(file.type as any)) {
    throw new VideoValidationError(
      "wrong_type",
      `Only MP4, WebM, MOV are allowed (got ${file.type || "unknown"})`,
    );
  }
  if (file.size > VIDEO_CONSTRAINTS.MAX_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(0);
    throw new VideoValidationError(
      "too_large",
      `Video is ${mb} MB — keep it under 50 MB`,
    );
  }
}

export function validateVideoMetadata(meta: VideoMetadata): void {
  if (meta.durationMs > VIDEO_CONSTRAINTS.MAX_DURATION_MS) {
    const s = (meta.durationMs / 1000).toFixed(0);
    throw new VideoValidationError(
      "too_long",
      `Video is ${s} seconds — keep it under 60 seconds`,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────
// Poster extraction
// ─────────────────────────────────────────────────────────────────────

/**
 * Extract a JPEG poster frame from the video at `POSTER_AT_SECONDS`.
 * The poster is what shows in the feed before the user taps play
 * (and after they scroll the video off-screen).
 */
export async function extractPoster(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.crossOrigin = "anonymous";

    // Attach listeners BEFORE setting src — see `probeVideoMetadata`
    // for the rationale.
    const ready = new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () =>
        reject(
          new VideoValidationError(
            "decode_failed",
            "Couldn't decode the video for poster extraction",
          ),
        );
    });
    video.src = url;
    await ready;

    // Seek to the target frame. Clamp to within the video duration so
    // very short clips still produce a poster.
    const target = Math.min(
      VIDEO_CONSTRAINTS.POSTER_AT_SECONDS,
      Math.max(0, video.duration - 0.05),
    );
    await new Promise<void>((resolve, reject) => {
      video.onseeked = () => resolve();
      video.onerror = () =>
        reject(
          new VideoValidationError(
            "decode_failed",
            "Seeking the video failed",
          ),
        );
      video.currentTime = target;
    });

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new VideoValidationError(
        "no_canvas",
        "Browser canvas unavailable",
      );
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) =>
          blob
            ? resolve(blob)
            : reject(
                new VideoValidationError(
                  "no_canvas",
                  "Poster encoding returned null",
                ),
              ),
        "image/jpeg",
        VIDEO_CONSTRAINTS.POSTER_QUALITY,
      );
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

// ─────────────────────────────────────────────────────────────────────
// Upload hook
// ─────────────────────────────────────────────────────────────────────

export interface PreparedVideo {
  storageId: Id<"_storage">;
  posterStorageId: Id<"_storage">;
  durationMs: number;
  width: number;
  height: number;
  mimeType: string;
  bytes: number;
}

/**
 * Returns an async preparer that handles the full upload pipeline:
 * validate → probe → extract poster → upload both → return ids.
 */
export function useVideoUpload(): (file: File) => Promise<PreparedVideo> {
  const generateVideoUrl = useAction(api.videos.generateUploadUrl);
  const generatePosterUrl = useAction(api.videos.generatePosterUploadUrl);

  return useCallback(
    async (file: File): Promise<PreparedVideo> => {
      validateVideoFile(file);
      const meta = await probeVideoMetadata(file);
      validateVideoMetadata(meta);

      const poster = await extractPoster(file);

      // Upload video + poster in parallel to halve the wall time.
      const [videoStorageId, posterStorageId] = await Promise.all([
        uploadBlob(file, await generateVideoUrl({})),
        uploadBlob(poster, await generatePosterUrl({})),
      ]);

      return {
        storageId: videoStorageId,
        posterStorageId: posterStorageId,
        durationMs: meta.durationMs,
        width: meta.width,
        height: meta.height,
        mimeType: file.type,
        bytes: file.size,
      };
    },
    [generateVideoUrl, generatePosterUrl],
  );
}

async function uploadBlob(blob: Blob, uploadUrl: string): Promise<Id<"_storage">> {
  const resp = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": blob.type || "application/octet-stream" },
    body: blob,
  });
  if (!resp.ok) {
    throw new Error(`Upload failed: ${resp.status} ${resp.statusText}`);
  }
  const { storageId } = (await resp.json()) as { storageId: Id<"_storage"> };
  return storageId;
}
