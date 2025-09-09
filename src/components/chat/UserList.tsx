"use client";

import React, { useState, memo, useCallback } from "react";
import { useQuery } from "convex/react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { X, Users, MessageCircle } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface LastMessage {
  content: string;
  createdAt: number;
  senderId: Id<"users">;
}

interface UserListProps {
  onSelectUser: (userId: Id<"users">) => void;
  onSelectConversation: (conversationId: Id<"conversations">) => void;
  conversations: Conversation[];
  onClose: () => void;
  currentUserId: Id<"users"> | null;
}

interface Conversation {
  _id: Id<"conversations">;
  lastMessage: LastMessage | null;
  otherUser: {
    id: Id<"users">;
    username: string;
    displayName: string;
    avatar: string | undefined;
  } | null;
}

const UserList: React.FC<UserListProps> = memo(({
  onSelectUser,
  onSelectConversation,
  conversations,
  onClose,
  currentUserId
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'conversations'>('conversations');
  const users = useQuery(api.chat.getAllUsers);

  const handleUserSelect = useCallback((userId: Id<"users">) => {
    onSelectUser(userId);
    setActiveTab('conversations');
  }, [onSelectUser]);

  const handleConversationSelect = useCallback((conversationId: Id<"conversations">) => {
    onSelectConversation(conversationId);
    setActiveTab('conversations');
  }, [onSelectConversation]);

  const filteredUsers = users?.filter(user => user.id !== currentUserId) || [];

  return (
    <div className="w-full h-full bg-background">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Messages</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b">
        <Button
          variant={activeTab === 'conversations' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('conversations')}
          className="flex-1 rounded-none border-0"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Conversations
        </Button>
        <Button
          variant={activeTab === 'users' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('users')}
          className="flex-1 rounded-none border-0"
        >
          <Users className="w-4 h-4 mr-2" />
          Users
        </Button>
      </div>

      <ScrollArea className="flex-1 max-w-full">
        {activeTab === 'conversations' ? (
          <div className="p-2">
            {conversations.length === 0 ? (
              <div className="text-center text-muted-foreground mt-8">
                No conversations yet. Select a user to start chatting!
              </div>
            ) : (
              conversations.map((conversation) => (
                <ConversationItem
                  key={conversation._id}
                  conversation={conversation}
                  onClick={() => handleConversationSelect(conversation._id)}
                />
              ))
            )}
          </div>
        ) : (
          <div className="p-2">
            {filteredUsers.length === 0 ? (
              <div className="text-center text-muted-foreground mt-8">
                No users available to chat with.
              </div>
            ) : (
              filteredUsers.map((user) => (
                <UserItem
                  key={user.id}
                  user={user}
                  onClick={() => handleUserSelect(user.id)}
                />
              ))
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
});

UserList.displayName = 'UserList';

interface ConversationItemProps {
  conversation: Conversation;
  onClick: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = memo(({ conversation, onClick }) => (
  <Button
    variant="ghost"
    className="w-full flex items-center gap-3 p-3 hover:bg-accent focus:bg-accent border-0 h-auto"
    onClick={onClick}
  >
    <Avatar className="w-10 h-10">
      <AvatarImage src={conversation.otherUser?.avatar || undefined} alt={conversation.otherUser?.displayName || 'Unknown'} />
      <AvatarFallback>{conversation.otherUser?.displayName.charAt(0) || 'U'}</AvatarFallback>
    </Avatar>
    <div className="flex-1 text-left min-w-0">
      <div className="font-medium text-sm text-foreground truncate">
        {conversation.otherUser?.displayName || 'Unknown'}
      </div>
      <div className="text-xs text-muted-foreground truncate">
        {conversation.lastMessage?.content || 'No messages yet'}
      </div>
    </div>
  </Button>
));

ConversationItem.displayName = 'ConversationItem';

interface UserItemProps {
  user: {
    id: Id<"users">;
    username: string;
    displayName: string;
    avatar: string | undefined;
  };
  onClick: () => void;
}

const UserItem: React.FC<UserItemProps> = memo(({ user, onClick }) => (
  <Button
    variant="ghost"
    className="w-full flex items-center gap-3 p-3 hover:bg-accent focus:bg-accent border-0 h-auto"
    onClick={onClick}
  >
    <Avatar className="w-10 h-10">
      <AvatarImage src={user.avatar || undefined} alt={user.displayName} />
      <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
    </Avatar>
    <div className="flex-1 text-left min-w-0">
      <div className="font-medium text-sm text-foreground truncate">
        {user.displayName}
      </div>
      <div className="text-xs text-muted-foreground truncate">
        @{user.username}
      </div>
    </div>
  </Button>
));

UserItem.displayName = 'UserItem';

export default UserList;