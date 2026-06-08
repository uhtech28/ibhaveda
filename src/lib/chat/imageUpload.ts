"use client";

/**
 * Client-side image preparation + upload for chat.
 *
 * Pipeline:
 *   1. Validate file type and size before we touch it.
 *   2. Decode → draw to canvas at a max dimension → re-encode as
 *      WebP (with PNG/JPEG fallback for older browsers).
 *      Result: smaller payload, faster upload, lower storage cost,
 *      and a known-good format on the wire.
 *   3. POST the compressed blob to the Convex-issued upload URL.
 *   4. Return the resulting storage id along with the post-compression
 *      width and height the server records.
 *
 * The compression step is skipped for very small files (< 200KB) and
 * GIFs (which we preserve as-is so animation is retained).
 */

import { useCallback } from "react";
import { useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

export const CHAT_IMAGE_CONSTRAINTS = {
  MAX_BYTES: 5 * 1024 * 1024, // 5 MB
  ALLOWED_MIME: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  MAX_DIMENSION_PX: 1920,
  COMPRESSION_SKIP_BELOW_BYTES: 200 * 1024,
  WEBP_QUALITY: 0.85,
} as const;

export interface PreparedImage {
  blob: Blob;
  mimeType: string;
  width: number;
  height: number;
  bytes: number;
  /** True if the original was returned as-is (small / GIF). */
  uncompressed: boolean;
}

// ─────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────

export class ChatImageValidationError extends Error {
  constructor(
    public readonly code:
      | "wrong_type"
      | "too_large"
      | "decode_failed"
      | "no_canvas",
    message: string,
  ) {
    super(message);
    this.name = "ChatImageValidationError";
  }
}

export function validateChatImage(file: File): void {
  if (!CHAT_IMAGE_CONSTRAINTS.ALLOWED_MIME.includes(file.type as any)) {
    throw new ChatImageValidationError(
      "wrong_type",
      `Only JPG, PNG, WebP, and GIF are allowed (got ${file.type || "unknown"})`,
    );
  }
  if (file.size > CHAT_IMAGE_CONSTRAINTS.MAX_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    throw new ChatImageValidationError(
      "too_large",
      `Image is ${mb} MB — keep it under 5 MB`,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────
// Compression
// ─────────────────────────────────────────────────────────────────────

/**
 * Resize + re-encode an image to fit within `MAX_DIMENSION_PX` on the
 * longest side and emit WebP (or the original format if WebP is not
 * supported by the canvas). GIFs are passed through unchanged so
 * animation is preserved.
 *
 * Falls back to returning the original file if any step fails — the
 * upload still succeeds (just larger).
 */
export async function prepareChatImage(file: File): Promise<PreparedImage> {
  validateChatImage(file);

  // GIFs: preserve animation. Read native dimensions via Image element.
  if (file.type === "image/gif") {
    const { width, height } = await readDimensions(file);
    return {
      blob: file,
      mimeType: "image/gif",
      width,
      height,
      bytes: file.size,
      uncompressed: true,
    };
  }

  // Very small files: skip compression overhead.
  if (file.size <= CHAT_IMAGE_CONSTRAINTS.COMPRESSION_SKIP_BELOW_BYTES) {
    const { width, height } = await readDimensions(file);
    return {
      blob: file,
      mimeType: file.type,
      width,
      height,
      bytes: file.size,
      uncompressed: true,
    };
  }

  try {
    const compressed = await compressViaCanvas(file);
    return compressed;
  } catch (err) {
    console.warn(
      "[chat-image] compression failed, falling back to original:",
      err instanceof Error ? err.message : err,
    );
    const { width, height } = await readDimensions(file);
    return {
      blob: file,
      mimeType: file.type,
      width,
      height,
      bytes: file.size,
      uncompressed: true,
    };
  }
}

async function compressViaCanvas(file: File): Promise<PreparedImage> {
  const bitmap = await createImageBitmapOrThrow(file);
  const { width, height } = fitWithinMaxDimension(
    bitmap.width,
    bitmap.height,
    CHAT_IMAGE_CONSTRAINTS.MAX_DIMENSION_PX,
  );

  const canvas =
    typeof OffscreenCanvas !== "undefined"
      ? new OffscreenCanvas(width, height)
      : Object.assign(document.createElement("canvas"), { width, height });
  const ctx = canvas.getContext("2d") as
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D
    | null;
  if (!ctx) {
    throw new ChatImageValidationError(
      "no_canvas",
      "Browser canvas unavailable",
    );
  }

  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob: Blob = await (canvas instanceof OffscreenCanvas
    ? canvas.convertToBlob({
        type: "image/webp",
        quality: CHAT_IMAGE_CONSTRAINTS.WEBP_QUALITY,
      })
    : new Promise<Blob>((resolve, reject) => {
        (canvas as HTMLCanvasElement).toBlob(
          (b) => (b ? resolve(b) : reject(new Error("toBlob returned null"))),
          "image/webp",
          CHAT_IMAGE_CONSTRAINTS.WEBP_QUALITY,
        );
      }));

  bitmap.close?.();

  return {
    blob,
    mimeType: "image/webp",
    width,
    height,
    bytes: blob.size,
    uncompressed: false,
  };
}

function fitWithinMaxDimension(
  w: number,
  h: number,
  max: number,
): { width: number; height: number } {
  if (w <= max && h <= max) return { width: w, height: h };
  const scale = w >= h ? max / w : max / h;
  return {
    width: Math.round(w * scale),
    height: Math.round(h * scale),
  };
}

async function createImageBitmapOrThrow(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file);
  } catch (err) {
    throw new ChatImageValidationError(
      "decode_failed",
      "Couldn't read this image file",
    );
  }
}

async function readDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  try {
    const bitmap = await createImageBitmap(file);
    const dims = { width: bitmap.width, height: bitmap.height };
    bitmap.close?.();
    return dims;
  } catch {
    return { width: 0, height: 0 };
  }
}

// ─────────────────────────────────────────────────────────────────────
// Upload via React hook
// ─────────────────────────────────────────────────────────────────────

export interface UploadedImage {
  storageId: Id<"_storage">;
  width: number;
  height: number;
  bytes: number;
}

/**
 * Hook that returns an async uploader. The uploader handles
 * compression, upload-URL retrieval, the POST, and returns the
 * storage id ready to be passed to `sendImageMessage`.
 *
 * Throws `ChatImageValidationError` on bad input; throws plain Error
 * on network or storage failures so callers can surface a generic
 * "couldn't send" toast.
 */
export function useChatImageUpload(): (file: File) => Promise<UploadedImage> {
  const generateUploadUrl = useAction(api.chatImages.generateUploadUrl);

  return useCallback(
    async (file: File): Promise<UploadedImage> => {
      const prepared = await prepareChatImage(file);

      const uploadUrl = await generateUploadUrl({});
      const resp = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": prepared.mimeType },
        body: prepared.blob,
      });
      if (!resp.ok) {
        throw new Error(`Upload failed: ${resp.status} ${resp.statusText}`);
      }

      const { storageId } = (await resp.json()) as {
        storageId: Id<"_storage">;
      };

      return {
        storageId,
        width: prepared.width,
        height: prepared.height,
        bytes: prepared.bytes,
      };
    },
    [generateUploadUrl],
  );
}
