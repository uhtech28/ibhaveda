"use client";

import React, { useState, memo, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  typingUsers: string[];
  placeholder?: string;
}

const ChatInput: React.FC<ChatInputProps> = memo(({ onSend, typingUsers, placeholder = "Type a message..." }) => {
  const [message, setMessage] = useState("");

  const handleSubmit = useCallback(() => {
    const trimmedMessage = message.trim();
    if (trimmedMessage) {
      onSend(trimmedMessage);
      setMessage("");
    }
  }, [message, onSend]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex h-full w-full flex-col justify-center bg-[#0B101B] px-4 py-0">
      {typingUsers.length > 0 && (
        <div className="mb-2 text-sm text-muted-foreground">
          {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
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
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
});

ChatInput.displayName = "ChatInput";

export default ChatInput;
