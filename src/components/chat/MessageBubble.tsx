"use client";

/**
 * Message bubble with optional image rendering.
 *
 * Text-only messages render identically to the previous version.
 * Image messages render the image first (with the natural aspect
 * ratio reserved via the stored width/height so there's no layout
 * shift when it loads) and the optional caption beneath.
 *
 * Image clicks open the `ImageLightbox`. The image URL is fetched
 * lazily from the `getImageUrl` query so deleted storage objects
 * surface as a placeholder rather than a broken image icon.
 */

import React, { memo, useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { ImageLightbox } from "./ImageLightbox";

interface Message {
  id: string;
  text: string;
  sender: {
    id: string;
    name: string;
    avatar: string | null;
  };
  timestamp: Date;
  isCurrentUser: boolean;
  image?: {
    storageId: Id<"_storage">;
    width: number;
    height: number;
  } | null;
}

interface Props {
  message: Message;
}

const MessageBubble: React.FC<Props> = memo(({ message }) => {
  const { text, sender, timestamp, isCurrentUser, image } = message;
  const timestampStr = format(timestamp, "HH:mm");

  return (
    <div
      className={cn(
        "flex w-full mb-4 max-w-full min-w-0",
        isCurrentUser ? "justify-end" : "justify-start",
      )}
    >
      {!isCurrentUser && (
        <Avatar className="w-8 h-8 mr-2 flex-shrink-0 ring-2 ring-indigo-500/20">
          <AvatarImage src={sender.avatar || undefined} alt={sender.name} />
          <AvatarFallback className="bg-indigo-500/20 text-indigo-200 text-xs">
            {sender.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          "max-w-[18rem] rounded-2xl relative shadow-sm",
          // Image-only messages get a slim padding so the bubble hugs
          // the thumbnail; mixed image+text and text-only bubbles keep
          // the comfortable text padding.
          image && !text ? "p-1.5" : "px-4 py-2.5",
          isCurrentUser
            ? "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white mr-2 rounded-br-sm"
            : "bg-[#1a2030] text-foreground border border-white/[0.06] ml-2 rounded-bl-sm",
        )}
      >
        {!isCurrentUser && (
          <div className="text-xs font-semibold mb-1 text-indigo-300/90">
            {sender.name}
          </div>
        )}

        {image && (
          <MessageImage
            storageId={image.storageId}
            width={image.width}
            height={image.height}
            alt={text || `Image from ${sender.name}`}
          />
        )}

        {text && (
          <div
            className={cn(
              "text-sm whitespace-pre-wrap break-words overflow-hidden leading-relaxed",
              image ? "mt-2" : "",
            )}
          >
            {text}
          </div>
        )}

        <div
          className={cn(
            "text-[10px] mt-1",
            isCurrentUser
              ? "text-white/70 text-right"
              : "text-muted-foreground text-left",
          )}
        >
          {timestampStr}
        </div>
      </div>

      {isCurrentUser && (
        <Avatar className="w-8 h-8 ml-2 flex-shrink-0 ring-2 ring-indigo-500/30">
          <AvatarImage src={sender.avatar || undefined} alt={sender.name} />
          <AvatarFallback className="bg-indigo-500/30 text-indigo-100 text-xs">
            {sender.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
});

MessageBubble.displayName = "MessageBubble";

// ─────────────────────────────────────────────────────────────────────
// Image cell + lightbox
// ─────────────────────────────────────────────────────────────────────

/**
 * Instagram-style image thumbnail in chat:
 *   - Capped to a compact rectangle (max 220×260) in the bubble.
 *   - Natural aspect ratio preserved via `object-cover` — portrait
 *     images crop slightly inside the cell rather than stretching
 *     the bubble tall, landscape images fit naturally.
 *   - Tap/click opens the full-resolution `ImageLightbox`.
 */
const THUMB_MAX_W = 220;
const THUMB_MAX_H = 260;

function MessageImage({
  storageId,
  width,
  height,
  alt,
}: {
  storageId: Id<"_storage">;
  width: number;
  height: number;
  alt: string;
}) {
  const url = useQuery(api.chatImages.getImageUrl, { storageId });
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Fit the image inside the THUMB_MAX_W × THUMB_MAX_H rectangle
  // preserving its aspect ratio. If we don't have dimensions, fall
  // back to a square so the thumbnail still has a reasonable footprint.
  const { w, h } = (() => {
    if (!width || !height) {
      return { w: THUMB_MAX_W, h: THUMB_MAX_H };
    }
    const scale = Math.min(THUMB_MAX_W / width, THUMB_MAX_H / height, 1);
    return {
      w: Math.round(width * scale) || THUMB_MAX_W,
      h: Math.round(height * scale) || THUMB_MAX_H,
    };
  })();

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (url) setLightboxOpen(true);
        }}
        disabled={!url}
        className="block overflow-hidden rounded-lg border border-white/10 bg-black/30 transition hover:opacity-90 disabled:cursor-default disabled:opacity-100"
        style={{ width: `${w}px`, height: `${h}px` }}
        aria-label="View image full-size"
      >
        {url === undefined ? (
          <div className="flex h-full w-full items-center justify-center text-xs text-white/40">
            Loading…
          </div>
        ) : url === null ? (
          <div className="flex h-full w-full items-center justify-center text-xs text-white/40">
            Image unavailable
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={alt}
            className="h-full w-full object-cover"
          />
        )}
      </button>

      <ImageLightbox
        url={lightboxOpen ? url ?? null : null}
        alt={alt}
        width={width}
        height={height}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}

export default MessageBubble;
