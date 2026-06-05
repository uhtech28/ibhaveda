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
import { ChannelMembersDialog } from "./ChannelMembersDialog";


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
  const sendImageMessage = useMutation(api.chatImages.sendImageMessage);
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
  // PRD §10 AC6 — channel members popup, reusing the §8 popup pattern.
  const [showMembers, setShowMembers] = useState(false);

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

  /**
   * Send a message. `ChatInput` hands us `{ text, image? }`.
   *
   * Branching:
   *   - image alone or image+text → `sendImageMessage` (the caption
   *     carries the text; the server creates/finds the conversation
   *     so brand-new DMs work on the first send without any
   *     placeholder text).
   *   - text alone → legacy `sendMessage`.
   */
  const handleSendMessage = useCallback(async (
    payload:
      | string
      | { text: string; image?: { storageId: string; width: number; height: number } | null }
  ) => {
    // Back-compat: legacy callers may still pass a raw string.
    const text = typeof payload === "string" ? payload : (payload.text ?? "");
    const image = typeof payload === "string" ? null : payload.image ?? null;
    const trimmed = text.trim();

    if (!currentUserId) return;
    if (!trimmed && !image) return;

    setSendError(null);

    // Infer a receiverId for DMs from visible messages when neither
    // prop nor explicit selection is set.
    let inferredReceiverId: Id<"users"> | null = receiverId ?? null;
    if (!inferredReceiverId && !ideaId && displayedMessages && displayedMessages.length > 0) {
      const firstMessage = displayedMessages[0];
      inferredReceiverId =
        (firstMessage.senderId === currentUserId
          ? firstMessage.receiverId
          : firstMessage.senderId) ?? null;
    }

    try {
      if (image) {
        // Image (with optional caption) — single round trip.
        await sendImageMessage({
          conversationId: activeConversationId ?? undefined,
          receiverId: !activeConversationId && !ideaId ? inferredReceiverId ?? undefined : undefined,
          ideaId: !activeConversationId && ideaId ? ideaId : undefined,
          storageId: image.storageId as unknown as Id<"_storage">,
          width: image.width,
          height: image.height,
          caption: trimmed || undefined,
        });
      } else {
        // Text only.
        if (ideaId) {
          await sendMessage({
            content: trimmed,
            conversationId: activeConversationId || undefined,
            ideaId,
          });
        } else if (inferredReceiverId) {
          await sendMessage({
            receiverId: inferredReceiverId,
            content: trimmed,
            conversationId: activeConversationId || undefined,
          });
        } else {
          setSendError("Cannot determine chat context");
          return;
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setSendError("Failed to send message. Please try again.");
    }
  }, [
    sendMessage,
    sendImageMessage,
    displayedMessages,
    currentUserId,
    receiverId,
    activeConversationId,
    ideaId,
  ]);

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
    <div className="flex flex-col h-full bg-background max-w-full">
      <div className="px-4 py-3 border-b flex items-center justify-between bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 -ml-2 hover:bg-muted/50 shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          {!ideaId && otherUser && (
            <Avatar className="h-7 w-7 shrink-0 ring-1 ring-indigo-500/30">
              <AvatarImage src={otherUser.avatar} alt={headerTitle} />
              <AvatarFallback className="bg-indigo-500/20 text-indigo-200 text-[11px]">
                {(otherUser.displayName || otherUser.username || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
          <div className="min-w-0">
            <h3 className="font-semibold text-sm text-foreground truncate">{headerTitle}</h3>
            {headerSubtitle && (
              <p className="text-[11px] text-muted-foreground truncate leading-tight">{headerSubtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {ideaId && activeConversationId && (
            <>
              {/* Members pill — opens read-only members popup; admins
               * see a "Manage" link to drill into ChannelSettingsDialog.
               * Reuses the §8 ResponsivePopup pattern (PRD §10 AC6). */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMembers(true)}
                className="h-8 gap-1.5 px-2.5 text-xs"
                aria-label="See channel members"
                title="See channel members"
              >
                <Users className="w-3.5 h-3.5" />
                <span className="tabular-nums">{groupMembers?.length ?? 0}</span>
              </Button>
              
              {/* Video Call button (User change) */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => window.open(`https://meet.jit.si/InteractiveVenture_${ideaId}`, '_blank')} 
                className="h-8 w-8 hover:bg-muted/50"
                title="Start Video Call"
              >
                <Video className="w-4 h-4" />
              </Button>

              <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)} className="h-8 w-8 hover:bg-muted/50" aria-label="Channel settings" title="Channel settings">
                <Settings className="w-4 h-4" />
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 -mr-2 hover:bg-muted/50">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="flex-1 p-4 max-w-full overflow-y-auto" ref={scrollAreaRef}>
        <div className="space-y-4 max-w-full overflow-x-auto pb-2">
          {displayedMessages === undefined ? (
            receiverId && !conversationId && directConversationId === undefined ? (
              <div className="text-center text-muted-foreground mt-8 text-sm">
                Loading conversation...
              </div>
            ) : receiverId && !conversationId && directConversationId === null ? (
              <div className="text-center text-muted-foreground mt-8 text-sm">
                No messages yet. Start the conversation!
              </div>
            ) : (
              <div className="text-center text-muted-foreground mt-8 text-sm">
                Loading messages...
              </div>
            )
          ) : displayedMessages.length === 0 ? (
            <div className="text-center text-muted-foreground mt-8 text-sm">
              No messages yet. Start the conversation!
            </div>
          ) : (
            displayedMessages.map((message) => {
              const senderUser = users?.find(u => u.id === message.senderId);
              // Image messages carry imageStorageId/Width/Height on the
              // server row; pass them through so MessageBubble can render
              // the picture instead of an empty bubble.
              const msgWithImage = message as typeof message & {
                imageStorageId?: Id<"_storage">;
                imageWidth?: number;
                imageHeight?: number;
              };
              const image = msgWithImage.imageStorageId
                ? {
                    storageId: msgWithImage.imageStorageId,
                    width: msgWithImage.imageWidth ?? 0,
                    height: msgWithImage.imageHeight ?? 0,
                  }
                : null;
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
                    image,
                  }}
                />
              );
            })
          )}
        </div>
      </div>
      {sendError && (
        <div className="px-4 py-2 bg-destructive/10 text-destructive text-xs border-t">
          {sendError}
        </div>
      )}
      <div className="p-3 border-t bg-card/50 backdrop-blur-sm">
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

      {/* PRD §10 AC6 — read-only members popup (reuses §8 pattern).
       *  The "Manage members" footer link drops admins into the
       *  existing ChannelSettingsDialog for add/remove. */}
      <ChannelMembersDialog
        conversationId={showMembers ? activeConversationId ?? null : null}
        canManage={!!ideaId && !!activeConversationId}
        onOpenChange={(open) => setShowMembers(open)}
        onManageMembers={() => setShowSettings(true)}
      />
    </div>
  );
});

ChatThread.displayName = "ChatThread";

export default ChatThread;