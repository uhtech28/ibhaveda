"use client";

import React, { memo, useEffect, useRef, useCallback, useState } from "react";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Triangle } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";


interface ChatThreadProps {
  conversationId: Id<"conversations">;
  onBack: () => void;
  onClose: () => void;
  receiverId?: Id<"users"> | null;
}

const ChatThread: React.FC<ChatThreadProps> = memo(({ conversationId, onBack, onClose, receiverId }) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { isAuthenticated } = useConvexAuth();

  const messages = useQuery(api.chat.getConversationMessages, isAuthenticated ? { conversationId } : "skip");
  const sendMessage = useMutation(api.chat.sendMessage);
  const users = useQuery(api.chat.getAllUsers, isAuthenticated ? {} : "skip");
  const currentUserDoc = useQuery(api.chat.getUserByClerkId, isAuthenticated ? {} : "skip");

  // Add loading and error states
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    // Auto scroll to bottom on new messages
    if (scrollAreaRef.current) {
      const element = scrollAreaRef.current;
      element.scrollTop = element.scrollHeight;
    }
  }, [messages]);

  const currentUserId = currentUserDoc?._id as Id<"users">;

  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !currentUserId) return;

    let recId = receiverId;
    if (!recId && (!messages || messages.length === 0)) {
      setSendError("No active conversation found");
      return;
    } else if (!recId && messages && messages.length > 0) {
      const firstMessage = messages[0];
      recId = firstMessage.senderId === currentUserId
        ? firstMessage.receiverId
        : firstMessage.senderId;
    }

    if (!recId) {
      setSendError("Cannot determine receiver");
      return;
    }

    setSendError(null);

    try {
      await sendMessage({
        receiverId: recId,
        content,
      });
      // Message sent successfully - no need to clear anything as Convex will update
    } catch (error) {
      console.error("Failed to send message:", error);
      setSendError("Failed to send message. Please try again.");
    } finally {
    }
  }, [sendMessage, messages, currentUserId, receiverId]);

  return (
    <div className="flex flex-col h-full bg-background max-w-full">
      <div className="p-4 border-b flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h3 className="font-semibold text-foreground">Conversation</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <Triangle className="w-4 h-4 rotate-90" />
        </Button>
      </div>
      <div className="flex-1 p-4 max-w-full overflow-y-auto" ref={scrollAreaRef}>
        <div className="space-y-1 max-w-full overflow-x-auto">
          {!messages ? (
            <div className="text-center text-muted-foreground mt-8">
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground mt-8">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((message) => {
              const senderUser = users?.find(u => u.id === message.senderId);
              return (
                <MessageBubble
                  key={message._id}
                  message={{
                    id: message._id,
                    text: message.content,
                    sender: {
                      id: message.senderId,
                      name: senderUser?.displayName || "Unknown",
                      avatar: senderUser?.avatar || null,
                    },
                    timestamp: new Date(message.createdAt),
                    isCurrentUser: message.senderId === currentUserId,
                  }}
                />
              );
            })
          )}
        </div>
      </div>
      {sendError && (
        <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm border-t">
          {sendError}
        </div>
      )}
      <ChatInput
        onSend={handleSendMessage}
        typingUsers={[]}
      />
    </div>
  );
});

ChatThread.displayName = "ChatThread";

export default ChatThread;