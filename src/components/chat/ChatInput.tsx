"use client";

import React, { memo, useCallback, useState } from "react";
import { Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export interface SendPayload {
  text: string;
}

interface Props {
  onSend: (payload: SendPayload) => void;
  typingUsers: string[];
  placeholder?: string;
}

const ChatInput: React.FC<Props> = memo(({
  onSend,
  typingUsers,
  placeholder = "Type a message…",
}) => {
  const [message, setMessage] = useState("");

  const handleSubmit = useCallback(() => {
    const trimmed = message.trim();
    if (!trimmed) return;
    onSend({ text: trimmed });
    setMessage("");
  }, [message, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  return (
    <div className="flex h-full w-full flex-col justify-center bg-[#0B101B] px-4 py-0">
      {typingUsers.length > 0 && (
        <div className="mb-2 text-sm text-muted-foreground">
          {typingUsers.join(", ")}{" "}
          {typingUsers.length === 1 ? "is" : "are"} typing…
        </div>
      )}
      <div className="relative rounded-[22px] border border-white/10 bg-[#0A0D12] transition-colors focus-within:border-[#6366F1]/45 focus-within:bg-[#111827]">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="block max-h-[72px] min-h-[38px] w-full resize-none rounded-[22px] border-0 bg-transparent py-2 pl-4 pr-14 text-sm leading-5 text-white placeholder:text-[#6B7280] shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
          rows={1}
        />

        <Button
          onClick={handleSubmit}
          size="icon"
          className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-[#4F46E5] text-white hover:bg-[#6366F1] disabled:opacity-40 disabled:hover:bg-[#4F46E5]"
          disabled={!message.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
});

ChatInput.displayName = "ChatInput";

export default ChatInput;
