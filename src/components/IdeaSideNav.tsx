"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { GitBranch, ListTodo, Calendar, GitBranchPlus } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface IdeaSideNavProps {
  onOpenHierarchy?: () => void;
  onOpenTodos?: () => void;
  onOpenCalendar?: () => void;
  todoCount?: number;
  className?: string;
  ideaId?: string;
  isContributor?: boolean;
  onCreateSubIdea?: () => void;
}

/**
 * Compact vertical side rail for an idea page — Sub-idea, Hierarchy, Todos, Calendar,
 * (and optional "Convert to Venture"). Renders identically on mobile and desktop;
 * the parent positions it (typically `fixed right-3 top-1/2 -translate-y-1/2`).
 */
export function IdeaSideNav({
  onOpenHierarchy,
  onOpenTodos,
  onOpenCalendar,
  todoCount = 0,
  className,
  ideaId,
  isContributor = false,
  onCreateSubIdea,
}: IdeaSideNavProps) {
  return (
    <div className={cn("flex flex-col items-center gap-1.5 lg:gap-2", className)}>
      <TooltipProvider delayDuration={0}>
        {/* Create Sub-Idea — contributor-only on this idea page */}
        {isContributor && onCreateSubIdea && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onCreateSubIdea}
                aria-label="Create Sub-Idea"
                className="rounded-xl w-9 h-9 lg:w-10 lg:h-10 hover:bg-primary/10 hover:text-primary transition-all duration-200"
              >
                <GitBranchPlus className="w-4 h-4 lg:w-5 lg:h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Create Sub-Idea</TooltipContent>
          </Tooltip>
        )}

        {/* Hierarchy */}
        {onOpenHierarchy && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onOpenHierarchy}
                aria-label="Hierarchy"
                className="rounded-xl w-9 h-9 lg:w-10 lg:h-10 hover:bg-primary/10 hover:text-primary transition-all duration-200"
              >
                <GitBranch className="w-4 h-4 lg:w-5 lg:h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Hierarchy</TooltipContent>
          </Tooltip>
        )}

        {/* Todos / Kanban */}
        {onOpenTodos && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onOpenTodos}
                aria-label="Todos"
                className="rounded-xl w-9 h-9 lg:w-10 lg:h-10 hover:bg-primary/10 hover:text-primary relative transition-all duration-200"
              >
                <ListTodo className="w-4 h-4 lg:w-5 lg:h-5" />
                {todoCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold border border-background">
                    {todoCount}
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Todos</TooltipContent>
          </Tooltip>
        )}

        {/* Calendar */}
        {onOpenCalendar && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onOpenCalendar}
                aria-label="Calendar"
                className="rounded-xl w-9 h-9 lg:w-10 lg:h-10 hover:bg-primary/10 hover:text-primary transition-all duration-200"
              >
                <Calendar className="w-4 h-4 lg:w-5 lg:h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Calendar</TooltipContent>
          </Tooltip>
        )}

        {/* Convert to Venture */}
      </TooltipProvider>
    </div>
  );
}
