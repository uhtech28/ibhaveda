"use client";

import React, { useState, memo, lazy, Suspense, useCallback } from "react";
import { useQuery, useConvexAuth, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

const ChatThread = lazy(() => import("./ChatThread"));
const UserList = lazy(() => import("./UserList"));

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<Id<"conversations"> | null>(null);
  const [selectedReceiverId, setSelectedReceiverId] = useState<Id<"users"> | null>(null);

  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { user } = useUser();

  const conversations = useQuery(api.chat.getUserConversations, isAuthenticated ? {} : "skip");
  const createConversation = useMutation(api.chat.createConversation);

  const handleSelectUser = useCallback((userId: string) => {
    const actualUserId = userId as Id<"users">;
    setSelectedReceiverId(actualUserId);
    const existingConvo = conversations?.find(convo => convo.otherUser?.id === actualUserId);
    if (existingConvo) {
      setSelectedConversationId(existingConvo._id);
    } else {
      (async () => {
        try {
          const convoId = await createConversation({ receiverId: actualUserId });
          setSelectedConversationId(convoId);
        } catch (error) {
          console.error("Failed to create conversation:", error);
          setSelectedReceiverId(null);
        }
      })();
    }
  }, [conversations, createConversation]);

  const handleBackToUsers = useCallback(() => {
    setSelectedConversationId(null);
  }, []);

  const handleSelectConversation = useCallback((conversationId: Id<"conversations">) => {
    setSelectedConversationId(conversationId);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSelectedConversationId(null);
    setSelectedReceiverId(null);
  }, []);

  if (authLoading) {
    return (
      <div className="fixed bottom-4 left-4 md:left-auto md:right-4 z-50">
        <Button
          size="icon"
          className="w-12 h-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg opacity-50"
          disabled
        >
          <ChatIcon />
        </Button>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // Don't show chat widget if not authenticated
  }

  return (
    <div className="fixed bottom-4 left-4 md:left-auto md:right-4 z-50">
      {isOpen && (
        <Card className="w-80 h-96 mb-2 shadow-lg bg-card border transition-all duration-300 ease-in-out overflow-hidden">
          <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
            {selectedConversationId ? (
               <ChatThread
                 conversationId={selectedConversationId}
                 onBack={handleBackToUsers}
                 onClose={handleClose}
                 receiverId={selectedReceiverId}
               />
             ) : (
              <UserList
                onSelectUser={handleSelectUser}
                onSelectConversation={handleSelectConversation}
                conversations={conversations || []}
                onClose={handleClose}
                currentUserId={user?.id as Id<"users"> || null}
              />
            )}
          </Suspense>
        </Card>
      )}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="icon"
        className="w-12 h-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
        aria-label="Toggle chat"
      >
        <ChatIcon />
      </Button>
    </div>
  );
};

const ChatIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
    />
  </svg>
);

export default memo(ChatWidget);