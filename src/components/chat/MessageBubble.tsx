"use client";

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
  variant?: "direct" | "group";
}

const MessageBubble: React.FC<Props> = memo(({ message, variant = "direct" }) => {
  const { text, sender, timestamp, isCurrentUser, image } = message;

  const timestampStr = format(timestamp, "HH:mm");
  const showSenderName = variant === "group" && !isCurrentUser;

  return (
    <div
      className={cn(
        "flex w-full max-w-full min-w-0 items-start gap-2",
        isCurrentUser ? "justify-end" : "justify-start"
      )}
    >
      {!isCurrentUser && (
        <Avatar className="mt-0.5 h-8 w-8 flex-shrink-0 ring-2 ring-indigo-500/20">
          <AvatarImage src={sender.avatar || undefined} alt={sender.name} />
          <AvatarFallback className="bg-indigo-500/20 text-indigo-200 text-xs">
            {sender.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          "max-w-[18rem] rounded-2xl shadow-sm",
          image && !text ? "p-1.5" : "px-3 py-2",
          isCurrentUser
            ? "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-br-sm"
            : "bg-[#1a2030] text-foreground border border-white/[0.06] rounded-bl-sm"
        )}
      >
        {showSenderName && (
          <div className="mb-0.5 text-[11px] font-semibold leading-4 text-indigo-300/90">
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
              "text-sm whitespace-pre-wrap break-words overflow-hidden leading-5",
              image ? "mt-2" : "",
            )}
          >
            {text}
            <span
              className={cn(
                "ml-2 inline-block translate-y-[1px] whitespace-nowrap text-[9px] leading-none",
                isCurrentUser ? "text-white/65" : "text-muted-foreground"
              )}
            >
              {timestampStr}
            </span>
          </div>
        )}

        {!text && image && (
          <div
            className={cn(
              "mt-1 px-1 text-[9px] leading-none",
              isCurrentUser ? "text-white/65 text-right" : "text-muted-foreground text-left"
            )}
          >
            {timestampStr}
          </div>
        )}
      </div>

      {isCurrentUser && (
        <Avatar className="mt-0.5 h-8 w-8 flex-shrink-0 ring-2 ring-indigo-500/30">
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

export default MessageBubble;

// Image thumbnail in a chat bubble. Capped to a compact rectangle; tap to
// open the full-resolution ImageLightbox.
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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const url = useQuery(api.chatImages.getImageUrl, { storageId });

  const aspect = width > 0 && height > 0 ? width / height : 1;
  const cellW = Math.min(THUMB_MAX_W, Math.round(THUMB_MAX_H * aspect));
  const cellH = Math.min(THUMB_MAX_H, Math.round(cellW / Math.max(aspect, 0.01)));

  if (!url) {
    return (
      <div
        className="rounded-xl bg-white/[0.04] animate-pulse"
        style={{ width: cellW, height: cellH }}
      />
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        className="block overflow-hidden rounded-xl"
        style={{ width: cellW, height: cellH }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={alt}
          width={cellW}
          height={cellH}
          className="h-full w-full object-cover"
        />
      </button>
      {lightboxOpen && (
        <ImageLightbox
          url={url}
          alt={alt}
          width={width}
          height={height}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}
