"use client";

/**
 * Video upload dialog. Single file pick, local preview, optional
 * caption, then upload + post.
 *
 * The upload happens client-side via `useVideoUpload` (validates,
 * extracts a poster frame at t=0.5s, uploads both to Convex storage).
 * The mutation only records the post once both binaries are persisted.
 *
 * Errors surface as inline copy beneath the file input. The most
 * common errors are duration ("video is 87 seconds — keep it under
 * 60") and size — both are caught client-side before any upload
 * starts.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Film, Loader2, Send, X } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  VIDEO_CONSTRAINTS,
  VideoValidationError,
  useVideoUpload,
} from "@/lib/video/videoUpload";

const MAX_CAPTION_CHARS = 300;

interface Props {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  ideaId?: Id<"ideas">;
  ventureId?: Id<"ventures">;
  onPosted?: (videoId: Id<"videos">) => void;
}

export function VideoComposer({
  open,
  onOpenChange,
  ideaId,
  ventureId,
  onPosted,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useVideoUpload();
  const createVideoPost = useMutation(api.videos.createVideoPost);

  // Reset state when the dialog reopens.
  useEffect(() => {
    if (open) {
      setFile(null);
      setCaption("");
      setError(null);
    }
  }, [open]);

  const handlePick = useCallback((next: File | null) => {
    setError(null);
    if (!next) {
      setFile(null);
      return;
    }
    if (!VIDEO_CONSTRAINTS.ALLOWED_MIME.includes(next.type as any)) {
      setError("Only MP4, WebM, or MOV files.");
      return;
    }
    if (next.size > VIDEO_CONSTRAINTS.MAX_BYTES) {
      const mb = (next.size / 1024 / 1024).toFixed(0);
      setError(`Video is ${mb} MB — keep it under 50 MB.`);
      return;
    }
    setFile(next);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!file || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const prepared = await upload(file);
      const videoId = await createVideoPost({
        storageId: prepared.storageId,
        posterStorageId: prepared.posterStorageId,
        durationMs: prepared.durationMs,
        width: prepared.width,
        height: prepared.height,
        mimeType: prepared.mimeType,
        bytes: prepared.bytes,
        caption: caption.trim() || undefined,
        ideaId,
        ventureId,
        visibility: "public",
      });
      onPosted?.(videoId);
      onOpenChange(false);
    } catch (err) {
      if (err instanceof VideoValidationError) {
        setError(err.message);
      } else {
        setError("Couldn't post your video. Try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }, [
    file,
    submitting,
    upload,
    createVideoPost,
    caption,
    ideaId,
    ventureId,
    onPosted,
    onOpenChange,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Film className="h-5 w-5 text-indigo-400" />
            Post a video
          </DialogTitle>
          <DialogDescription>
            Up to 60 seconds, 50 MB. MP4 / WebM / MOV.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <input
            ref={inputRef}
            type="file"
            accept={VIDEO_CONSTRAINTS.ALLOWED_MIME.join(",")}
            className="hidden"
            onChange={(e) => handlePick(e.target.files?.[0] ?? null)}
          />

          {file ? (
            <StagedVideoPreview file={file} onRemove={() => setFile(null)} />
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-white/20 bg-white/[0.015] px-4 py-10 text-sm text-white/60 transition hover:border-white/40 hover:text-white"
            >
              <Film className="h-5 w-5" />
              Choose a video file
            </button>
          )}

          {error && (
            <p className="rounded-md border border-red-500/40 bg-red-500/10 p-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <Textarea
            placeholder="Add a caption (optional)"
            value={caption}
            onChange={(e) =>
              setCaption(e.target.value.slice(0, MAX_CAPTION_CHARS))
            }
            disabled={submitting}
            className="min-h-[80px] resize-none"
          />
          <div className="flex justify-end text-xs text-white/40">
            <span className="font-mono">
              {caption.length} / {MAX_CAPTION_CHARS}
            </span>
          </div>
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="rounded-md border border-white/20 px-3 py-2 text-sm text-white/70 transition hover:border-white/40 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!file || submitting}
            className="inline-flex items-center gap-2 rounded-md border border-indigo-500 bg-indigo-500/20 px-4 py-2 text-sm font-medium text-indigo-100 transition hover:bg-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Posting
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Post video
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Local staged preview
// ─────────────────────────────────────────────────────────────────────

function StagedVideoPreview({
  file,
  onRemove,
}: {
  file: File;
  onRemove: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => {
      URL.revokeObjectURL(next);
    };
  }, [file]);

  return (
    <div className="relative overflow-hidden rounded-md border border-white/15 bg-black">
      {url && (
        <video
          src={url}
          controls
          muted
          playsInline
          className="block max-h-[300px] w-full"
        />
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border border-white/30 bg-black/70 text-white transition hover:bg-black"
        aria-label="Remove staged video"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
