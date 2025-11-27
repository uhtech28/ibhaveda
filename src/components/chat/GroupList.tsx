"use client";

import React, { memo } from "react";
import { useQuery } from "convex/react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { X, Users } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface GroupListProps {
  onSelectGroup: (conversationId: Id<"conversations"> | undefined, ideaId: Id<"ideas">) => void;
  onClose: () => void;
}

const GroupList: React.FC<GroupListProps> = memo(({
  onSelectGroup,
  onClose,
}) => {
  const groups = useQuery(api.chat.getGroupConversationsList);

  return (
    <div className="w-full h-full bg-background flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Idea Groups</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 w-full">
        <div className="p-2">
          {groups === undefined ? (
             <div className="text-center text-muted-foreground mt-8">Loading groups...</div>
          ) : groups.length === 0 ? (
            <div className="text-center text-muted-foreground mt-8">
              No idea groups found. Create an idea or join one to start chatting!
            </div>
          ) : (
            groups.map((group) => (
              <Button
                key={group.ideaId}
                variant="ghost"
                className="w-full flex items-center gap-3 p-3 hover:bg-accent focus:bg-accent border-0 h-auto"
                onClick={() => onSelectGroup(group.conversationId, group.ideaId)}
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={undefined} alt={group.name} />
                  <AvatarFallback><Users className="w-5 h-5" /></AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left min-w-0">
                  <div className="font-medium text-sm text-foreground truncate">
                    {group.name}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {group.lastMessage?.content || 'No messages yet'}
                  </div>
                </div>
              </Button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
});

GroupList.displayName = 'GroupList';

export default GroupList;
