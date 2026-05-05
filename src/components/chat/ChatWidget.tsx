"use client";

import React, { memo, lazy, Suspense, useCallback, useEffect } from "react";
import { useConvexAuth } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { Card } from "@/components/ui/card";

import { Id } from "../../../convex/_generated/dataModel";
import { useChat } from "./ChatContext";

const ChatThread = lazy(() => import("./ChatThread"));
const GroupList = lazy(() => import("./GroupList"));
const ChannelList = lazy(() => import("./ChannelList"));

const CARD_CLASS = [
  "relative",
  "h-full",
  "w-full",
  "rounded-none",
  "border-0",
  "bg-card",
  "shadow-none",
  "transition-all",
  "duration-300",
  "ease-in-out",
  "overflow-hidden",
  "md:h-full",
  "md:w-[400px]",
  "md:max-w-md",
  "md:rounded-none",
  "md:border-l",
  "md:border-border/40",
  "md:shadow-2xl",
].join(" ");

const BACKDROP_CLASS = "fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm";

const ChatWidget: React.FC = () => {
  const {
    isOpen,
    selectedConversationId,
    selectedIdeaId,
    selectedReceiverId,
    closeChat,
    resetSelection,
    openGroupChat,
  } = useChat();

  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { user } = useUser();
  const pathname = usePathname();

  const handleSelectGroup = useCallback(
    (conversationId: Id<"conversations"> | undefined, ideaId: Id<"ideas">) => {
      openGroupChat(ideaId, conversationId);
    },
    [openGroupChat]
  );

  const handleSelectChannel = useCallback(
    (conversationId: Id<"conversations">) => {
      if (selectedIdeaId) {
        openGroupChat(selectedIdeaId, conversationId);
      }
    },
    [openGroupChat, selectedIdeaId]
  );

  const handleBack = useCallback(() => {
    if (selectedConversationId) {
      if (selectedIdeaId) {
        openGroupChat(selectedIdeaId, undefined);
      } else {
        resetSelection();
      }
    } else if (selectedIdeaId) {
      resetSelection();
    } else {
      resetSelection();
    }
  }, [selectedConversationId, selectedIdeaId, openGroupChat, resetSelection]);

  const handleClose = useCallback(() => {
    closeChat();
  }, [closeChat]);

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeChat();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, closeChat]);

  // Auto-close when navigating to a new page
  useEffect(() => {
    if (isOpen) closeChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Always anchor the chat to the right edge, full height — matches the GlobalChatSheet from the top nav.
  const positionClass = "fixed inset-0 z-[60] md:inset-y-0 md:right-0 md:left-auto md:top-0 md:bottom-0";

  if (authLoading || !isAuthenticated || !user) {
    return null;
  }

  if (!isOpen) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close chat"
        onClick={handleClose}
        className={BACKDROP_CLASS}
      />

      <div className={positionClass}>
        <Card className={CARD_CLASS}>
          <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
            {selectedConversationId || selectedReceiverId ? (
              <ChatThread
                conversationId={selectedConversationId}
                onBack={handleBack}
                onClose={handleClose}
                ideaId={selectedIdeaId}
                receiverId={selectedReceiverId}
              />
            ) : selectedIdeaId ? (
              <ChannelList
                ideaId={selectedIdeaId}
                onBack={handleBack}
                onSelectChannel={handleSelectChannel}
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
    </>
  );
};

export default memo(ChatWidget);
