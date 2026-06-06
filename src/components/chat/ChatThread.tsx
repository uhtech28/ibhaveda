"use client";

import React, { memo, useEffect, useRef, useCallback, useState } from "react";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, X, Settings, Video, Users } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import { ChannelSettingsDialog } from "./ChannelSettingsDialog";


interface ChatThreadProps {
  conversationId: Id<"conversations"> | null;
  onBack: () => void;
  onClose: () => void;
  receiverId?: Id<"users"> | null;
  ideaId?: Id<"ideas"> | null;
}

const ChatThread: React.FC<ChatThreadProps> = memo(({ conversationId, onBack, onClose, receiverId, ideaId }) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { isAuthenticated } = useConvexAuth();

  // Resolve conversation ID for direct chats if not provided
  const directConversationId = useQuery(api.chat.getDirectConversationId, isAuthenticated && receiverId && !conversationId ? { receiverId } : "skip");

  // Resolve conversation ID for group chats if not provided
  const groupChannels = useQuery(
    api.communities.getChannels,
    isAuthenticated && ideaId && !conversationId ? { ideaId } : "skip"
  );
  const resolvedGroupConversationId = groupChannels && groupChannels.length > 0
    ? (groupChannels[0]._id as Id<"conversations">)
    : null;

  const activeConversationId = conversationId || directConversationId || resolvedGroupConversationId;

  const messages = useQuery(api.chat.getConversationMessages, isAuthenticated && activeConversationId ? { conversationId: activeConversationId } : "skip");
  const displayedMessages = messages !== undefined
    ? messages
    : (ideaId && groupChannels && groupChannels.length === 0)
      ? []
      : undefined;

  const sendMessage = useMutation(api.chat.sendMessage);
  const users = useQuery(api.chat.getAllUsers, isAuthenticated ? {} : "skip");
  const currentUserDoc = useQuery(api.chat.getUserByClerkId, isAuthenticated ? {} : "skip");
  // For group chats — pull the idea title so the header reads "<idea title>"
  const ideaForHeader = useQuery(
    api.ideas.getIdeaById,
    isAuthenticated && ideaId ? { ideaId } : "skip"
  );

  // Add loading and error states
  const [sendError, setSendError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Live member count for group chats — surfaces add/remove flow as a
  // visible Members pill in the header rather than just a settings cog.
  const groupMembers = useQuery(
    api.chat.getGroupMembers,
    isAuthenticated && ideaId && activeConversationId ? { conversationId: activeConversationId } : "skip"
  );

  useEffect(() => {
    // Auto scroll to bottom on new messages
    if (scrollAreaRef.current) {
      const element = scrollAreaRef.current;
      element.scrollTop = element.scrollHeight;
    }
  }, [displayedMessages]);

  const currentUserId = currentUserDoc?._id as Id<"users">;

  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !currentUserId) return;

    setSendError(null);

    try {
      if (ideaId) {
        // Group chat
        await sendMessage({
          content,
          conversationId: activeConversationId || undefined,
          ideaId: ideaId,
        });
      } else if (receiverId) {
        // Direct chat
        await sendMessage({
          receiverId,
          content,
          conversationId: activeConversationId || undefined,
        });
      } else {
        // Try to infer context from existing messages if no explicit context
        let recId = receiverId;
        if (!recId && displayedMessages && displayedMessages.length > 0) {
          const firstMessage = displayedMessages[0];
          recId = firstMessage.senderId === currentUserId
            ? firstMessage.receiverId
            : firstMessage.senderId;
        }

        if (recId) {
          await sendMessage({
            receiverId: recId,
            content,
            conversationId: activeConversationId || undefined,
          });
        } else {
          setSendError("Cannot determine chat context");
          return;
        }
      }
      // Message sent successfully
    } catch (error) {
      console.error("Failed to send message:", error);
      setSendError("Failed to send message. Please try again.");
    } finally {
    }
  }, [sendMessage, displayedMessages, currentUserId, receiverId, activeConversationId, ideaId]);

  // Resolve the header — show the recipient's name for DMs, or the idea
  // title for group/channel chats. Falls back to "Conversation" only as
  // an absolute last resort while data loads.
  // NOTE: api.chat.getAllUsers maps _id -> id, so we match against u.id.
  const otherUser = (() => {
    if (ideaId) return null;
    if (!users) return null;
    if (receiverId) {
      return users.find((u) => u.id === receiverId) || null;
    }
    if (messages && messages.length > 0 && currentUserId) {
      const first = messages[0];
      const otherId = first.senderId === currentUserId ? first.receiverId : first.senderId;
      if (otherId) return users.find((u) => u.id === otherId) || null;
    }
    return null;
  })();

  const headerTitle = ideaId
    ? ideaForHeader?.title || "Channel"
    : otherUser
      ? otherUser.displayName || otherUser.username || "Direct message"
      : "Conversation";
  const headerSubtitle = !ideaId && otherUser?.username ? `@${otherUser.username}` : null;

  return (
    <div className="flex flex-col h-full bg-[#0B101B] max-w-full overflow-hidden">
      <div className="relative flex h-16 shrink-0 items-center border-b border-white/10 bg-[#0B101B] px-4 py-0">
        <div className="absolute inset-y-0 left-4 flex items-center">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 hover:bg-white/[0.08] shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </div>

        <div className="mx-auto flex h-full min-w-0 max-w-[240px] items-center justify-center gap-2 text-center">
          {!ideaId && otherUser && (
            <Avatar className="h-8 w-8 shrink-0 ring-1 ring-indigo-500/30">
              <AvatarImage src={otherUser.avatar} alt={headerTitle} />
              <AvatarFallback className="bg-indigo-500/20 text-indigo-200 text-[11px]">
                {(otherUser.displayName || otherUser.username || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
          <div className="min-w-0 text-center">
            <h3 className="font-semibold text-sm text-foreground truncate">{headerTitle}</h3>
            {headerSubtitle && (
              <p className="text-[11px] text-muted-foreground truncate leading-tight">{headerSubtitle}</p>
            )}
          </div>
        </div>

        <div className="absolute inset-y-0 right-4 flex items-center gap-1">
          {ideaId && activeConversationId && (
            <>
              {/* Visible Members pill (Co-dev change) */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(true)}
                className="h-8 gap-1.5 px-2.5 text-xs border-white/10 bg-white/[0.03] hover:bg-white/[0.07]"
                aria-label="Manage members"
                title="Manage members"
              >
                <Users className="w-3.5 h-3.5" />
                <span className="tabular-nums">{groupMembers?.length ?? 0}</span>
              </Button>
              
              {/* Video Call button (User change) */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => window.open(`https://meet.jit.si/InteractiveVenture_${ideaId}`, '_blank')} 
                className="h-8 w-8 hover:bg-white/[0.08]"
                title="Start Video Call"
              >
                <Video className="w-4 h-4" />
              </Button>

              <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)} className="h-8 w-8 hover:bg-white/[0.08]" aria-label="Channel settings" title="Channel settings">
                <Settings className="w-4 h-4" />
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 hover:bg-white/[0.08]">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="flex-1 max-w-full overflow-y-auto bg-[#0B101B]" ref={scrollAreaRef}>
        <div className="flex min-h-full max-w-full overflow-x-auto">
          {displayedMessages === undefined ? (
            receiverId && !conversationId && directConversationId === undefined ? (
              <div className="flex flex-1 items-center justify-center text-center text-muted-foreground text-sm">
                Loading conversation...
              </div>
            ) : receiverId && !conversationId && directConversationId === null ? (
              <div className="flex flex-1 items-center justify-center text-center text-muted-foreground text-sm">
                No messages yet. Start the conversation!
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center text-center text-muted-foreground text-sm">
                Loading messages...
              </div>
            )
          ) : displayedMessages.length === 0 ? (
            <div className="flex flex-1 items-center justify-center text-center text-muted-foreground text-sm">
              No messages yet. Start the conversation!
            </div>
          ) : (
            <div className="w-full space-y-2.5 px-3.5 py-3">
              {displayedMessages.map((message) => {
                const senderUser = users?.find(u => u.id === message.senderId);
                return (
                  <MessageBubble
                    key={message._id}
                    variant={ideaId ? "group" : "direct"}
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
              })}
            </div>
          )}
        </div>
      </div>
      {sendError && (
        <div className="px-4 py-2 bg-destructive/10 text-destructive text-xs border-t">
          {sendError}
        </div>
      )}
      <div className="flex h-[72px] shrink-0 items-center border-t border-white/10 bg-[#0B101B]">
        <ChatInput
          onSend={handleSendMessage}
          typingUsers={[]}
        />
      </div>

      {showSettings && activeConversationId && ideaId && (
        <ChannelSettingsDialog
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          conversationId={activeConversationId}
          ideaId={ideaId}
          onChannelDeleted={onBack}
        />
      )}
    </div>
  );
});

ChatThread.displayName = "ChatThread";

export default ChatThread;
