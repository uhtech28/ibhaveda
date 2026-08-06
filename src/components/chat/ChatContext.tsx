"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { Id } from "../../../convex/_generated/dataModel";

interface ChatContextType {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  toggleChat: () => void;
  selectedConversationId: Id<"conversations"> | null;
  selectedIdeaId: Id<"ideas"> | null;
  selectedReceiverId: Id<"users"> | null;
  openChatWithUser: (userId: Id<"users">) => void;
  openGroupChat: (ideaId: Id<"ideas">, conversationId?: Id<"conversations">) => void;
  closeChat: () => void;
  resetSelection: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<Id<"conversations"> | null>(null);
  const [selectedIdeaId, setSelectedIdeaId] = useState<Id<"ideas"> | null>(null);
  const [selectedReceiverId, setSelectedReceiverId] = useState<Id<"users"> | null>(null);

  const toggleChat = useCallback(() => setIsOpen((prev) => !prev), []);

  const openChatWithUser = useCallback((userId: Id<"users">) => {
    setSelectedReceiverId(userId);
    setSelectedConversationId(null);
    setSelectedIdeaId(null);
    setIsOpen(true);
  }, []);

  const openGroupChat = useCallback((ideaId: Id<"ideas">, conversationId?: Id<"conversations">) => {
    setSelectedIdeaId(ideaId);
    setSelectedConversationId(conversationId || null);
    setSelectedReceiverId(null);
    setIsOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
    setSelectedConversationId(null);
    setSelectedIdeaId(null);
    setSelectedReceiverId(null);
  }, []);

  const resetSelection = useCallback(() => {
    setSelectedConversationId(null);
    setSelectedIdeaId(null);
    setSelectedReceiverId(null);
  }, []);

  return (
    <ChatContext.Provider value={{ 
      isOpen, 
      setIsOpen, 
      toggleChat,
      selectedConversationId,
      selectedIdeaId,
      selectedReceiverId,
      openChatWithUser,
      openGroupChat,
      closeChat,
      resetSelection
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
