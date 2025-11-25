import React from "react";
import { Button } from "@/components/ui/button";
import { 
  GitBranch, 
  ListTodo, 
  Calendar, 
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface IdeaSideNavProps {
  onOpenHierarchy: () => void;
  onOpenTodos: () => void;
  onOpenCalendar: () => void;
  todoCount?: number;
}

export function IdeaSideNav({
  onOpenHierarchy,
  onOpenTodos,
  onOpenCalendar,
  todoCount = 0,
}: IdeaSideNavProps) {
  return (
    <TooltipProvider>
      <div className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 p-2 bg-card border border-border rounded-full shadow-lg z-50">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onOpenHierarchy} className="h-10 w-10 rounded-full hover:bg-primary/10 hover:text-primary">
              <GitBranch className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Hierarchy</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onOpenTodos} className="h-10 w-10 rounded-full hover:bg-primary/10 hover:text-primary relative">
              <ListTodo className="w-5 h-5" />
              {todoCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold border border-background">
                  {todoCount}
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Todos / Kanban</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onOpenCalendar} className="h-10 w-10 rounded-full hover:bg-primary/10 hover:text-primary">
              <Calendar className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Calendar</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
