"use client";

import React, { useState, memo, lazy, Suspense, useCallback } from "react";
import { useConvexAuth } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { Card } from "@/components/ui/card";

import { Id } from "../../../convex/_generated/dataModel";
import { useChat } from "./ChatContext";

const ChatThread = lazy(() => import("./ChatThread"));
const GroupList = lazy(() => import("./GroupList"));

const ChatWidget: React.FC = () => {
  const { isOpen, setIsOpen } = useChat();
  const [selectedConversationId, setSelectedConversationId] = useState<Id<"conversations"> | null>(null);
  const [selectedIdeaId, setSelectedIdeaId] = useState<Id<"ideas"> | null>(null);

  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { user } = useUser();
  const pathname = usePathname();

  const handleSelectGroup = useCallback((conversationId: Id<"conversations"> | undefined, ideaId: Id<"ideas">) => {
    setSelectedIdeaId(ideaId);
    if (conversationId) {
      setSelectedConversationId(conversationId);
    } else {
      setSelectedConversationId(null);
    }
  }, []);

  const handleBackToGroups = useCallback(() => {
    setSelectedConversationId(null);
    setSelectedIdeaId(null);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSelectedConversationId(null);
    setSelectedIdeaId(null);
  }, [setIsOpen]);

  // Determine positioning class based on page
  // On profile pages, move to the left (as requested "to the left part a bit")
  // On other pages, keep default behavior (left on mobile, right on desktop)
  const isProfilePage = pathname?.includes('/profile') || pathname?.includes('/profile-setup');
  const positionClass = isProfilePage 
    ? "fixed bottom-20 left-4 z-50" 
    : "fixed bottom-20 left-4 md:left-auto md:right-20 z-50";

  if (authLoading || !isAuthenticated || !user) {
    return null;
  }

  // Only render the chat window if open. The trigger button is now in RightSidebar.
  if (!isOpen) return null;

  return (
    <div className={positionClass}>
      <Card className="w-80 h-96 shadow-lg bg-card border transition-all duration-300 ease-in-out overflow-hidden">
        <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
          {selectedIdeaId || selectedConversationId ? (
              <ChatThread
                conversationId={selectedConversationId}
                onBack={handleBackToGroups}
                onClose={handleClose}
                ideaId={selectedIdeaId}
              />
            ) : (
            <GroupList
              onSelectGroup={handleSelectGroup}
              onClose={handleClose}
            />
          )}
        </Suspense>
      </Card>
    </div>
  );
};

export default memo(ChatWidget);