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
  HelpCircle
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
  onOpenPanel: (tab: "tools" | "calendar" | "kanban" | "roadmap") => void;
  className?: string;
}

export function LeftSidebar({ onOpenPanel, className }: LeftSidebarProps) {
  const navItems = [
    { id: "tools", icon: Grid, label: "All Tools", color: "text-indigo-400" },
    { id: "calendar", icon: Calendar, label: "Calendar", color: "text-amber-400" },
    { id: "kanban", icon: LayoutDashboard, label: "Kanban Board", color: "text-emerald-400" },
    { id: "roadmap", icon: Map, label: "Launch Roadmap", color: "text-cyan-400" },
  ] as const;

  return (
    <TooltipProvider delayDuration={0}>
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className={cn(
          "flex flex-col items-center py-6 px-3 z-[55] bg-card/40 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl gap-4",
          className
        )}
      >
        {/* Top Logo / Branding Area */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-2">
          <span className="text-white font-black text-lg">I</span>
        </div>

        <div className="w-8 h-px bg-white/10 my-2" />

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
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 hover:bg-white/10 hover:scale-110 active:scale-95 group relative"
                >
                  <item.icon className={cn("w-5 h-5 transition-colors", item.color)} />
                  <div className="absolute inset-0 rounded-xl bg-current opacity-0 group-hover:opacity-5 transition-opacity" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="ml-2 bg-slate-900 border-white/10 text-white font-bold text-[10px] uppercase tracking-widest px-3 py-1.5">
                <p>{item.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        <div className="mt-auto flex flex-col gap-3">
          <div className="w-8 h-px bg-white/10 my-2" />
          
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-all">
                <Settings className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="ml-2 bg-slate-900 border-white/10 text-white font-bold text-[10px] uppercase tracking-widest px-3 py-1.5">
              <p>Settings</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-all">
                <HelpCircle className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="ml-2 bg-slate-900 border-white/10 text-white font-bold text-[10px] uppercase tracking-widest px-3 py-1.5">
              <p>Help Center</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </motion.div>
    </TooltipProvider>
  );
}
