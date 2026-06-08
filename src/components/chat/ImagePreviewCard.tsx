"use client";

/**
 * Inline preview of a staged image waiting to be sent. Shown in the
 * compose area beneath/above the textarea. Click the × to discard.
 *
 * Keeps the aspect ratio of the original so the user can confirm
 * the right image is queued before they hit send. Uploading state is
 * surfaced as a subtle overlay so the X stays usable.
 */

import React, { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";

interface Props {
  file: File;
  uploading: boolean;
  onRemove: () => void;
}

export function ImagePreviewCard({ file, uploading, onRemove }: Props) {
  const url = useObjectUrl(file);

  return (
    <div className="relative inline-block max-w-[180px] overflow-hidden rounded-md border border-white/15 bg-black/40">
      {url && (
        // Plain <img> is correct here — local blob URL, no Next image loader.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={file.name}
          className="block max-h-[120px] w-auto object-contain"
        />
      )}

      {uploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Loader2 className="h-4 w-4 animate-spin text-white" />
        </div>
      )}

      <button
        type="button"
        onClick={onRemove}
        disabled={uploading}
        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full border border-white/30 bg-black/70 text-white transition hover:bg-black disabled:opacity-50"
        aria-label="Remove staged image"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

/**
 * Manage the lifetime of a File-backed object URL so it's revoked
 * when the component unmounts or the file reference changes. Without
 * this you leak blob URLs every time the user adds and removes a file.
 */
function useObjectUrl(file: File | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => {
      URL.revokeObjectURL(next);
    };
  }, [file]);

  return url;
}
