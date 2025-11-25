import React from "react";
import { Button } from "@/components/ui/button";
import { 
  GitBranch, 
  ListTodo, 
  Calendar, 
  MessageCircle, 
  Users
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


interface IdeaToolbarProps {
  onOpenHierarchy: () => void;
  onOpenRequests: () => void;
  onOpenTodos: () => void;
  onOpenCalendar: () => void;
  onOpenComments: () => void;

  requestCount?: number;
  commentCount?: number;
  todoCount?: number;
}

export function IdeaToolbar({
  onOpenHierarchy,
  onOpenRequests,
  onOpenTodos,
  onOpenCalendar,
  onOpenComments,

  requestCount = 0,
  commentCount = 0,
  todoCount = 0,
}: IdeaToolbarProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 p-1 bg-background/80 backdrop-blur-sm border border-border rounded-lg shadow-sm">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onOpenHierarchy} className="h-8 w-8">
              <GitBranch className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Hierarchy</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onOpenRequests} className="h-8 w-8 relative">
              <Users className="w-4 h-4" />
              {requestCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-destructive text-[8px] text-destructive-foreground font-bold">
                  {requestCount}
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Contribution Requests</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onOpenTodos} className="h-8 w-8 relative">
              <ListTodo className="w-4 h-4" />
              {todoCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-primary text-[8px] text-primary-foreground font-bold">
                  {todoCount}
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Todos / Kanban</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onOpenCalendar} className="h-8 w-8">
              <Calendar className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Calendar</TooltipContent>
        </Tooltip>

        <div className="w-px h-4 bg-border mx-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onOpenComments} className="h-8 w-8 relative">
              <MessageCircle className="w-4 h-4" />
              {commentCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-blue-500 text-[8px] text-white font-bold">
                  {commentCount}
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Comments</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
