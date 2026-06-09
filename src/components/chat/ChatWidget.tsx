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
  "rounded-2xl",
  "border",
  "border-white/10",
  "bg-[#0B101B]",
  "shadow-[0_24px_80px_rgba(0,0,0,0.55)]",
  "transition-all",
  "duration-300",
  "ease-in-out",
  "overflow-hidden",
  "md:h-[min(760px,calc(100vh-48px))]",
  "md:w-[420px]",
  "md:max-w-[calc(100vw-32px)]",
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

  const positionClass = "fixed inset-3 z-[60] flex items-center justify-center md:inset-y-6 md:right-6 md:left-auto md:justify-end";

  if (authLoading || !isAuthenticated || !user) {
    return null;
  }

  if (!isOpen) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close chat"
        onPointerDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          handleClose();
        }}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        className={BACKDROP_CLASS}
      />

      <div
        className={positionClass}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
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
