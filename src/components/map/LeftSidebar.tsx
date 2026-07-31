"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { audioManager } from "@/lib/audio/audioManager";
import { PixelIcon, type PixelIconName } from "@/components/ui/PixelIcon";

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
      | "minigames"
      | "settings"
      | "help",
  ) => void;
  className?: string;
  ventureName?: string;
}

export function LeftSidebar({ onOpenPanel, className, ventureName }: LeftSidebarProps) {
  // Sidebar mapped to fantasy pixel icons — matches the game world's
  // visual language. See /public/assets/ui/icons/ (sliced from the 2D
  // Game Symbol Reference sheet).
  const navItems: readonly {
    id:
      | "feed"
      | "chat"
      | "contributors"
      | "hierarchy"
      | "calendar"
      | "kanban"
      | "journal";
    pixelIcon: PixelIconName;
    label: string;
    bgClass: string;
    borderClass: string;
  }[] = [
    {
      id: "feed",
      pixelIcon: "scroll-approved",   // Contributions ledger
      label: "Contributions",
      bgClass: "bg-indigo-500/10 hover:bg-indigo-500/20",
      borderClass: "border-indigo-500/20 hover:border-indigo-500/40",
    },
    {
      id: "chat",
      pixelIcon: "crystal-ball-purple",
      label: "Group Chat",
      bgClass: "bg-blue-500/10 hover:bg-blue-500/20",
      borderClass: "border-blue-500/20 hover:border-blue-500/40",
    },
    {
      id: "contributors",
      pixelIcon: "guild-crest-gold-eagle",
      label: "Contributors",
      bgClass: "bg-sky-500/10 hover:bg-sky-500/20",
      borderClass: "border-sky-500/20 hover:border-sky-500/40",
    },
    {
      id: "hierarchy",
      pixelIcon: "map-region",
      label: "Hierarchy",
      bgClass: "bg-pink-500/10 hover:bg-pink-500/20",
      borderClass: "border-pink-500/20 hover:border-pink-500/40",
    },
    {
      id: "calendar",
      pixelIcon: "hourglass-blue",
      label: "Calendar",
      bgClass: "bg-amber-500/10 hover:bg-amber-500/20",
      borderClass: "border-amber-500/20 hover:border-amber-500/40",
    },
    {
      id: "kanban",
      pixelIcon: "rune-stone",
      label: "Kanban Board",
      bgClass: "bg-emerald-500/10 hover:bg-emerald-500/20",
      borderClass: "border-emerald-500/20 hover:border-emerald-500/40",
    },
    {
      id: "journal",
      pixelIcon: "journal",
      label: "Journal",
      bgClass: "bg-violet-500/10 hover:bg-violet-500/20",
      borderClass: "border-violet-500/20 hover:border-violet-500/40",
    },
    // Mini Games button removed from sidebar per product decision — the
    // mini-game spawn points now live directly on the map as easter-eggs
    // that users discover by exploring. Sidebar entry point retired.
  ] as const;

  return (
    <>
      <TooltipProvider delayDuration={0}>
        <motion.div
          // Was `x: -20` slide-in — layout-affecting transform that
          // counts toward CLS (saw 0.464 on first render). Opacity is
          // composited so it doesn't register as a layout shift while
          // still giving the user a fade-in cue.
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
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
                    <PixelIcon
                      name={item.pixelIcon}
                      size={24}
                      alt={item.label}
                      className="transition-transform group-hover:scale-105"
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

          {/* Settings pinned to the bottom — separated by a thin divider
              so it visually reads as a "system" action distinct from the
              venture-scoped tabs above. */}
          <div className="mt-auto pt-3 border-t border-white/10 flex flex-col gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => {
                    audioManager.playUI("click");
                    onOpenPanel("settings");
                  }}
                  onMouseEnter={() => audioManager.playUI("hover")}
                  className={cn(
                    "h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 group relative border",
                    "bg-slate-500/10 hover:bg-slate-500/20",
                    "border-slate-500/20 hover:border-slate-500/40",
                  )}
                >
                  <PixelIcon
                    name="saddlebag-backpack"
                    size={24}
                    alt="Settings"
                    className="transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 rounded-xl bg-white/5 opacity-0 group-hover:opacity-10 transition-opacity" />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                className="ml-2 bg-slate-900 border-white/10 text-white font-bold text-[10px] uppercase tracking-widest px-3 py-1.5"
              >
                <p>Settings</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </motion.div>
      </TooltipProvider>
    </>
  );
}
