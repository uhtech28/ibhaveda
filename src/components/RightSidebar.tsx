"use client";

import React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { 
  Filter, 
  Plus, 
  User, 
  Palette, 
  LogOut
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

interface RightSidebarProps {
  filterOpen: boolean;
  setFilterOpen: (open: boolean) => void;
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
}

export function RightSidebar({ 
  filterOpen, 
  setFilterOpen, 
  selectedCategories, 
  setSelectedCategories 
}: RightSidebarProps) {
  const { theme, setTheme } = useTheme();
  const { signOut } = useClerk();


  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="fixed right-0 top-0 h-screen w-16 bg-card border-l border-border flex flex-col items-center py-6 z-50 shadow-lg">
      <div className="flex flex-col gap-6 mt-16">
        <TooltipProvider delayDuration={0}>
          
          {/* Create Idea */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button asChild variant="ghost" size="icon" className="rounded-full w-10 h-10 hover:bg-primary/10 hover:text-primary">
                <Link href="/create-idea">
                  <Plus className="w-5 h-5" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Create Idea</p>
            </TooltipContent>
          </Tooltip>

          {/* Filter */}
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button 
                    variant={selectedCategories.length > 0 ? "default" : "ghost"} 
                    size="icon" 
                    className={`rounded-full w-10 h-10 ${selectedCategories.length > 0 ? 'bg-primary text-primary-foreground' : 'hover:bg-primary/10 hover:text-primary'}`}
                  >
                    <Filter className="w-5 h-5" />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Filter Ideas</p>
              </TooltipContent>
            </Tooltip>
            <PopoverContent className="w-80 p-0 mr-4" align="start" side="left">
              <CategoryMultiSelect
                selectedCategories={selectedCategories}
                onChange={setSelectedCategories}
                placeholder="Select categories to filter..."
              />
            </PopoverContent>
          </Popover>

          {/* Theme Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full w-10 h-10 hover:bg-primary/10 hover:text-primary"
                onClick={toggleTheme}
              >
                <Palette className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Toggle Theme</p>
            </TooltipContent>
          </Tooltip>

          {/* Profile */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button asChild variant="ghost" size="icon" className="rounded-full w-10 h-10 hover:bg-primary/10 hover:text-primary">
                <Link href="/profile">
                  <User className="w-5 h-5" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Profile</p>
            </TooltipContent>
          </Tooltip>

        </TooltipProvider>
      </div>

      <div className="mt-auto flex flex-col gap-4">
         <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full w-10 h-10 hover:bg-red-50 hover:text-red-500"
                  onClick={() => signOut()}
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Sign Out</p>
              </TooltipContent>
            </Tooltip>
         </TooltipProvider>
      </div>
    </div>
  );
}
