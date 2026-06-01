"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Grid,
  Calendar,
  LayoutDashboard,
  Settings,
  HelpCircle,
  Rss,
  MessageSquare,
  Users,
  GitFork,
  Scroll,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { audioManager } from "@/lib/audio/audioManager";

interface LeftSidebarProps {
  onOpenPanel: (
    tab:
      | "tools"
      | "feed"
      | "chat"
      | "contributors"
      | "hierarchy"
      | "calendar"
      | "kanban"
      | "journal"
      | "settings"
      | "help",
  ) => void;
  className?: string;
  ventureName?: string;
}

export function LeftSidebar({ onOpenPanel, className, ventureName }: LeftSidebarProps) {
  const navItems = [
    {
      id: "feed",
      icon: Rss,
      label: "Contributions",
      colorClass: "text-indigo-300 group-hover:text-indigo-200",
      bgClass: "bg-indigo-500/10 hover:bg-indigo-500/20",
      borderClass: "border-indigo-500/20 hover:border-indigo-500/40",
    },
    {
      id: "chat",
      icon: MessageSquare,
      label: "Group Chat",
      colorClass: "text-blue-300 group-hover:text-blue-200",
      bgClass: "bg-blue-500/10 hover:bg-blue-500/20",
      borderClass: "border-blue-500/20 hover:border-blue-500/40",
    },
    {
      id: "contributors",
      icon: Users,
      label: "Contributors",
      colorClass: "text-sky-300 group-hover:text-sky-200",
      bgClass: "bg-sky-500/10 hover:bg-sky-500/20",
      borderClass: "border-sky-500/20 hover:border-sky-500/40",
    },
    {
      id: "hierarchy",
      icon: GitFork,
      label: "Hierarchy",
      colorClass: "text-pink-300 group-hover:text-pink-200",
      bgClass: "bg-pink-500/10 hover:bg-pink-500/20",
      borderClass: "border-pink-500/20 hover:border-pink-500/40",
    },
    {
      id: "calendar",
      icon: Calendar,
      label: "Calendar",
      colorClass: "text-amber-300 group-hover:text-amber-200",
      bgClass: "bg-amber-500/10 hover:bg-amber-500/20",
      borderClass: "border-amber-500/20 hover:border-amber-500/40",
    },
    {
      id: "kanban",
      icon: LayoutDashboard,
      label: "Kanban Board",
      colorClass: "text-emerald-300 group-hover:text-emerald-200",
      bgClass: "bg-emerald-500/10 hover:bg-emerald-500/20",
      borderClass: "border-emerald-500/20 hover:border-emerald-500/40",
    },
    {
      id: "journal",
      icon: Scroll,
      label: "Journal",
      colorClass: "text-violet-300 group-hover:text-violet-200",
      bgClass: "bg-violet-500/10 hover:bg-violet-500/20",
      borderClass: "border-violet-500/20 hover:border-violet-500/40",
    },
  ] as const;

  return (
    <>
      <TooltipProvider delayDuration={0}>
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className={cn(
            "flex flex-col items-center py-3 px-2 sm:py-6 sm:px-3 z-[55] bg-card/40 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl gap-2 sm:gap-4",
            className,
          )}
        >
          {/* Navigation Items */}
          <div className="flex flex-col gap-3">
            {navItems.map((item) => (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => {
                      audioManager.playUI("click");
                      onOpenPanel(item.id);
                    }}
                    onMouseEnter={() => audioManager.playUI("hover")}
                    className={cn(
                      "h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 group relative border",
                      item.bgClass,
                      item.borderClass,
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-5 w-5 sm:h-5.5 sm:w-5.5 transition-colors",
                        item.colorClass,
                      )}
                    />
                    <div className="absolute inset-0 rounded-xl bg-white/5 opacity-0 group-hover:opacity-10 transition-opacity" />
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="ml-2 bg-slate-900 border-white/10 text-white font-bold text-[10px] uppercase tracking-widest px-3 py-1.5"
                >
                  <p>{item.label}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>


        </motion.div>
      </TooltipProvider>
    </>
  );
}
