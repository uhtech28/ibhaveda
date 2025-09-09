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
        <Avatar className="w-8 h-8 mr-2 flex-shrink-0">
          <AvatarImage src={sender.avatar || undefined} alt={sender.name} />
          <AvatarFallback>{sender.name.charAt(0)}</AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          "max-w-[15rem] px-4 py-2 rounded-lg relative",
          isCurrentUser
            ? "bg-primary text-primary-foreground mr-2"
            : "bg-accent text-accent-foreground ml-2"
        )}
      >
        {!isCurrentUser && (
          <div className="text-xs font-semibold mb-1 text-accent-foreground/70">
            {sender.name}
          </div>
        )}
        <div className="text-sm whitespace-pre-wrap break-words overflow-hidden">{text}</div>
        <div
          className={cn(
            "text-xs mt-1",
            isCurrentUser
              ? "text-primary-foreground/70 text-right"
              : "text-accent-foreground/70 text-left"
          )}
        >
          {timestampStr}
        </div>
      </div>

      {isCurrentUser && (
        <Avatar className="w-8 h-8 ml-2 flex-shrink-0">
          <AvatarImage src={sender.avatar || undefined} alt={sender.name} />
          <AvatarFallback>{sender.name.charAt(0)}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
});

MessageBubble.displayName = "MessageBubble";

export default MessageBubble;