"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Grid,
  Calendar,
  LayoutDashboard,
  FileText,
  Files,
  Map,
  Settings,
  HelpCircle,
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
    tab: "tools" | "calendar" | "kanban" | "roadmap" | "settings" | "help",
  ) => void;
  className?: string;
}

export function LeftSidebar({ onOpenPanel, className }: LeftSidebarProps) {
  const navItems = [
    { id: "tools", icon: Grid, label: "All Tools", color: "text-indigo-400" },
    {
      id: "calendar",
      icon: Calendar,
      label: "Calendar",
      color: "text-amber-400",
    },
    {
      id: "kanban",
      icon: LayoutDashboard,
      label: "Kanban Board",
      color: "text-emerald-400",
    },
    {
      id: "roadmap",
      icon: Map,
      label: "Launch Roadmap",
      color: "text-cyan-400",
    },
  ] as const;

  return (
    <TooltipProvider delayDuration={0}>
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className={cn(
          "flex flex-col items-center py-3 px-2 sm:py-6 sm:px-3 z-[55] bg-card/40 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl gap-2 sm:gap-4",
          className,
        )}
      >
        {/* Top Logo / Branding Area */}
        <div className="h-8 w-8 rounded-lg sm:h-10 sm:w-10 sm:rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-1 sm:mb-2">
          <span className="text-sm sm:text-lg text-white font-black">I</span>
        </div>

        <div className="h-px w-6 sm:w-8 bg-white/10 my-1 sm:my-2" />

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
                  className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-300 hover:bg-white/10 hover:scale-110 active:scale-95 group relative"
                >
                  <item.icon
                    className={cn(
                      "h-4 w-4 sm:h-5 sm:w-5 transition-colors",
                      item.color,
                    )}
                  />
                  <div className="absolute inset-0 rounded-xl bg-current opacity-0 group-hover:opacity-5 transition-opacity" />
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

        <div className="mt-auto flex flex-col gap-3">
          <div className="h-px w-6 sm:w-8 bg-white/10 my-1 sm:my-2" />

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => {
                  audioManager.playUI("click");
                  onOpenPanel("settings");
                }}
                onMouseEnter={() => audioManager.playUI("hover")}
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all duration-300 hover:scale-110 active:scale-95 group relative"
              >
                <Settings className="h-4 w-4 sm:h-5 sm:w-5 transition-colors" />
                <div className="absolute inset-0 rounded-xl bg-indigo-400 opacity-0 group-hover:opacity-5 transition-opacity" />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              className="ml-2 bg-slate-900 border-white/10 text-white font-bold text-[10px] uppercase tracking-widest px-3 py-1.5"
            >
              <p>Settings</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => {
                  audioManager.playUI("click");
                  onOpenPanel("help");
                }}
                onMouseEnter={() => audioManager.playUI("hover")}
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all duration-300 hover:scale-110 active:scale-95 group relative"
              >
                <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 transition-colors" />
                <div className="absolute inset-0 rounded-xl bg-cyan-400 opacity-0 group-hover:opacity-5 transition-opacity" />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              className="ml-2 bg-slate-900 border-white/10 text-white font-bold text-[10px] uppercase tracking-widest px-3 py-1.5"
            >
              <p>Help Center</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </motion.div>
    </TooltipProvider>
  );
}
