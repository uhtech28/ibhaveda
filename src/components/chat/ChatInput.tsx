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
    <div className="p-4 border-t bg-background">
      {typingUsers.length > 0 && (
        <div className="mb-2 text-sm text-muted-foreground">
          {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
        </div>
      )}
      <div className="flex items-end gap-2">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="min-h-[40px] max-h-[120px] resize-none"
        />
        <Button
          onClick={handleSubmit}
          size="icon"
          className="mb-0 h-10 w-10"
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