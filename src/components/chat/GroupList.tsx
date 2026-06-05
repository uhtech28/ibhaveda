import React, { memo } from "react";
import { useQuery } from "convex/react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { X, Users, MessageSquare, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useChat } from "./ChatContext";
import { formatDistanceToNow } from "date-fns";
import { CreateGroupDialog } from "./CreateGroupDialog";
import { NewDirectMessagePanel } from "./NewDirectMessageDialog";

/**
 * Inbox preview text for a conversation's most-recent message.
 *
 * Plain text → "Hello there" / "You: Hello"
 * Image with caption → "📷 Caption text"
 * Image without caption → "📷 Photo"
 * Empty / missing → "No messages yet"
 */
function previewForLastMessage(
  m:
    | {
        content?: string | null;
        messageType?: string;
        isFromMe?: boolean;
      }
    | null
    | undefined,
): string {
  if (!m) return "No messages yet";
  const prefix = m.isFromMe ? "You: " : "";
  const trimmed = (m.content ?? "").trim();
  if (m.messageType === "image") {
    return `${prefix}📷 ${trimmed || "Photo"}`;
  }
  if (!trimmed) return "No messages yet";
  return `${prefix}${trimmed}`;
}

interface GroupListProps {
  onSelectGroup?: (conversationId: Id<"conversations"> | undefined, ideaId: Id<"ideas">) => void;
  onClose: () => void;
  ideaId?: Id<"ideas">;
}

const GroupList: React.FC<GroupListProps> = memo(({ onClose }) => {
  const communities = useQuery(api.communities.getUserCommunities);
  const directConversations = useQuery(api.chat.getUserConversations);
  const { openChatWithUser, openGroupChat, selectedIdeaId } = useChat();
  const [showCreateGroup, setShowCreateGroup] = React.useState(false);
  const [showNewDM, setShowNewDM] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"communities" | "direct">("communities");

  // When showing the new-DM panel, render it INSTEAD of the list. This
  // avoids any z-index conflicts with the chat sheet (which sits at z-[60]).
  if (showNewDM) {
    return (
      <NewDirectMessagePanel
        onBack={() => setShowNewDM(false)}
        onClose={onClose}
        onSelectUser={(userId) => {
          // openChatWithUser will swap the chat sheet over to ChatThread.
          openChatWithUser(userId);
        }}
      />
    );
  }

  return (
    <div className="w-full h-full bg-background flex flex-col">
      <div className="px-3 py-2 border-b flex items-center justify-between shrink-0 bg-card/50 backdrop-blur-sm">
        <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
          <MessageSquare className="w-3.5 h-3.5" />
          Chats
        </h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "communities" | "direct")}
        className="flex-1 flex flex-col min-h-0"
      >
        <div className="px-3 pt-2 shrink-0 space-y-2">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="communities">Communities</TabsTrigger>
            <TabsTrigger value="direct">Direct</TabsTrigger>
          </TabsList>

          {false && (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs h-8 dashed border-primary/50 text-primary hover:bg-primary/10"
              onClick={() => setShowCreateGroup(true)}
            >
              <Plus className="w-3 h-3 mr-2" />
              Create Sub-Group
            </Button>
          )}
        </div>

        <TabsContent value="communities" className="flex-1 min-h-0 mt-0">
          <ScrollArea className="h-full w-full">
            <div className="px-2 pb-2 space-y-1">
              {communities === undefined ? (
                <div className="text-center text-muted-foreground py-4 text-xs">Loading communities...</div>
              ) : communities.length === 0 ? (
                <div className="text-center text-muted-foreground py-6 text-sm px-4">
                  <div className="bg-muted/50 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-2">
                    <Users className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p>No communities yet.</p>
                  <p className="text-xs mt-1 opacity-70">Join an idea to start chatting!</p>
                </div>
              ) : (
                communities.map((community) => (
                  <Button
                    key={community._id}
                    variant="ghost"
                    className="w-full flex items-center gap-3 p-3 h-auto justify-start hover:bg-accent/50 transition-all duration-200 group relative overflow-hidden"
                    onClick={() => openGroupChat(community._id)}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm group-hover:shadow-md transition-all text-white font-bold text-lg">
                      {community.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 text-left min-w-0 flex flex-col gap-0.5">
                      <div className="flex justify-between items-baseline">
                        <span className="font-semibold text-sm text-foreground truncate pr-2">
                          {community.name}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground truncate opacity-70">
                        View Channels
                      </div>
                    </div>
                  </Button>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="direct" className="flex-1 min-h-0 mt-0 relative">
          <ScrollArea className="h-full w-full">
            <div className="px-2 pb-20 space-y-1">
              {directConversations === undefined ? (
                <div className="text-center text-muted-foreground py-4 text-xs">Loading messages...</div>
              ) : directConversations.length === 0 ? (
                <div className="text-center text-muted-foreground py-6 text-sm px-4">
                  <div className="bg-muted/50 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-2">
                    <MessageSquare className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p>No direct messages.</p>
                  <p className="text-xs mt-1 opacity-70">Tap the + button below to find people and start chatting.</p>
                </div>
              ) : (
                // Defensive dedupe — the server query already dedupes,
                // but if any legacy duplicate slips through (self-DM
                // rows can flip participant1/2), we still want a stable
                // unique key per row to avoid React warnings.
                Array.from(
                  new Map(directConversations.map((c) => [String(c._id), c])).values(),
                ).map((convo) => (
                  <Button
                    key={convo._id}
                    variant="ghost"
                    className="w-full flex items-center gap-3 p-3 h-auto justify-start hover:bg-accent/50 transition-all duration-200"
                    onClick={() => {
                      if (convo.otherUser) {
                        openChatWithUser(convo.otherUser.id as Id<"users">);
                      }
                    }}
                  >
                    <Avatar className="w-12 h-12 border shrink-0">
                      <AvatarImage src={convo.otherUser?.avatar} alt={convo.otherUser?.displayName} />
                      <AvatarFallback>{convo.otherUser?.displayName?.charAt(0) || "?"}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 text-left min-w-0 flex flex-col gap-0.5">
                      <div className="flex justify-between items-baseline">
                        <span className="font-semibold text-sm text-foreground truncate pr-2">
                          {convo.otherUser?.displayName || "Unknown User"}
                        </span>
                        {convo.lastMessage && (
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {formatDistanceToNow(convo.lastMessage.createdAt, { addSuffix: false }).replace('about ', '')}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {previewForLastMessage(convo.lastMessage)}
                      </div>
                    </div>
                  </Button>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Floating + button — opens the inline new-DM panel. */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowNewDM(true);
            }}
            aria-label="New direct message"
            title="New direct message"
            className="absolute bottom-4 right-4 z-10 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg ring-1 ring-black/10 hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center"
          >
            <Plus className="w-5 h-5" />
          </button>
        </TabsContent>
      </Tabs>

      {selectedIdeaId && (
        <CreateGroupDialog
          isOpen={showCreateGroup}
          onClose={() => setShowCreateGroup(false)}
          ideaId={selectedIdeaId!}
          onGroupCreated={(id) => openGroupChat(selectedIdeaId, id)}
        />
      )}
    </div>
  );
});

GroupList.displayName = 'GroupList';

export default GroupList;
