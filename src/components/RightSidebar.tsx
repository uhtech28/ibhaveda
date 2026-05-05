"use client";

import React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { 
  Filter, 
  Plus,
  MessageCircle,
  Sun,
  Moon,
  X
} from "lucide-react";
import { useTheme } from "next-themes";
import { useClerk } from "@clerk/nextjs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CategoryMultiSelect } from "@/components/CategoryMultiSelect";
import { useChat } from "@/components/chat/ChatContext";

import { cn } from "@/lib/utils";

interface RightSidebarProps {
  filterOpen: boolean;
  setFilterOpen: (open: boolean) => void;
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
  className?: string;
}

export function RightSidebar({ 
  filterOpen, 
  setFilterOpen, 
  selectedCategories, 
  setSelectedCategories,
  className
}: RightSidebarProps) {
  const { theme, setTheme } = useTheme();
  const { } = useClerk();
  const { toggleChat, isOpen: isChatOpen } = useChat();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className={cn("flex flex-col items-center py-6 px-2 z-50 bg-card/80 backdrop-blur-md border border-border/50 shadow-2xl rounded-2xl gap-6", className)}>
        <TooltipProvider delayDuration={0}>
          
          {/* Create Idea - Moved to top */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="rounded-xl w-10 h-10 hover:bg-primary/10 hover:text-primary transition-all duration-200"
              >
                <Link href="/create-idea">
                  <Plus className="w-5 h-5" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="mr-2">
              <p>Create Idea</p>
            </TooltipContent>
          </Tooltip>

          <div className="w-8 h-[1px] bg-border/50 my-1" />

          {/* Filter */}
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button 
                    variant={selectedCategories.length > 0 ? "default" : "ghost"} 
                    size="icon" 
                    className={`rounded-xl w-10 h-10 transition-all duration-200 ${selectedCategories.length > 0 ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-primary/10 hover:text-primary'}`}
                  >
                    <Filter className="w-5 h-5" />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent side="left" className="mr-2">
                <p>Filter Ideas</p>
              </TooltipContent>
            </Tooltip>
            <PopoverContent className="w-80 p-0 mr-4" align="start" side="left">
              <CategoryMultiSelect
                selectedCategories={selectedCategories}
                onChange={setSelectedCategories}
                placeholder="Select categories to filter..."
                inline={true}
              />
            </PopoverContent>
          </Popover>



          {/* Chat Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant={isChatOpen ? "default" : "ghost"}
                size="icon" 
                className={`rounded-xl w-10 h-10 transition-all duration-200 ${isChatOpen ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-primary/10 hover:text-primary'}`}
                onClick={toggleChat}
              >
                {isChatOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <MessageCircle className="w-5 h-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="mr-2">
              <p>Chat</p>
            </TooltipContent>
          </Tooltip>

        </TooltipProvider>
    </div>
  );
}
