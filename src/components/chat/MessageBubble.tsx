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
}

const MessageBubble: React.FC<MessageBubbleProps> = memo(({ message }) => {
  const { text, sender, timestamp, isCurrentUser } = message;

  const timestampStr = format(timestamp, "HH:mm");

  return (
    <div
      className={cn(
        "flex w-full mb-4 max-w-full min-w-0",
        isCurrentUser ? "justify-end" : "justify-start"
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
          "max-w-[15rem] px-4 py-2.5 rounded-2xl relative shadow-sm",
          isCurrentUser
            ? "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white mr-2 rounded-br-sm"
            : "bg-[#1a2030] text-foreground border border-white/[0.06] ml-2 rounded-bl-sm"
        )}
      >
        {!isCurrentUser && (
          <div className="text-xs font-semibold mb-1 text-indigo-300/90">
            {sender.name}
          </div>
        )}
        <div className="text-sm whitespace-pre-wrap break-words overflow-hidden leading-relaxed">
          {text}
        </div>
        <div
          className={cn(
            "text-[10px] mt-1",
            isCurrentUser
              ? "text-white/70 text-right"
              : "text-muted-foreground text-left"
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

export default MessageBubble;
