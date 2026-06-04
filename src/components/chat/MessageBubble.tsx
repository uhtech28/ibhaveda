"use client";

import React, { memo } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

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
}

interface MessageBubbleProps {
  message: Message;
  variant?: "direct" | "group";
}

const MessageBubble: React.FC<MessageBubbleProps> = memo(({ message, variant = "direct" }) => {
  const { text, sender, timestamp, isCurrentUser } = message;

  const timestampStr = format(timestamp, "HH:mm");
  const showSenderName = variant === "group" && !isCurrentUser;

  return (
    <div
      className={cn(
        "flex w-full max-w-full min-w-0 items-center gap-2",
        isCurrentUser ? "justify-end" : "justify-start"
      )}
    >
      {!isCurrentUser && (
        <Avatar className="h-8 w-8 flex-shrink-0 ring-2 ring-indigo-500/20">
          <AvatarImage src={sender.avatar || undefined} alt={sender.name} />
          <AvatarFallback className="bg-indigo-500/20 text-indigo-200 text-xs">
            {sender.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          "max-w-[15rem] rounded-2xl px-3.5 py-2.5 shadow-sm",
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
        <div className="text-sm whitespace-pre-wrap break-words overflow-hidden leading-relaxed">
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
      </div>

      {isCurrentUser && (
        <Avatar className="h-8 w-8 flex-shrink-0 ring-2 ring-indigo-500/30">
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
