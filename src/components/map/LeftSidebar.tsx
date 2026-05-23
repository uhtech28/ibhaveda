"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Grid,
  Calendar,
  LayoutDashboard,
  Map,
  Settings,
  HelpCircle,
  Home,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { audioManager } from "@/lib/audio/audioManager";
import { useRouter } from "next/navigation";

interface LeftSidebarProps {
  onOpenPanel: (
    tab: "tools" | "calendar" | "kanban" | "roadmap" | "settings" | "help",
  ) => void;
  className?: string;
  ventureName?: string;
}

export function LeftSidebar({ onOpenPanel, className, ventureName }: LeftSidebarProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);

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

  const handleHomeClick = () => {
    audioManager.playUI("click");
    setShowConfirm(true);
  };

  const handleConfirmYes = () => {
    audioManager.playUI("confirm");
    setShowConfirm(false);
    router.push("/feed");
  };

  const handleConfirmNo = () => {
    audioManager.playUI("click");
    setShowConfirm(false);
  };

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
          {/* Home Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleHomeClick}
                onMouseEnter={() => audioManager.playUI("hover")}
                className="h-8 w-8 rounded-lg sm:h-10 sm:w-10 sm:rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-1 sm:mb-2 hover:from-indigo-400 hover:to-purple-500 hover:scale-110 active:scale-95 transition-all duration-200"
              >
                <Home className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              className="ml-2 bg-slate-900 border-white/10 text-white font-bold text-[10px] uppercase tracking-widest px-3 py-1.5"
            >
              <p>Go to Feed</p>
            </TooltipContent>
          </Tooltip>

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

      {/* ── Confirmation Dialog — matches screenshot style ─────────────────── */}
      <AnimatePresence>
        {showConfirm && (
          <>
            {/* Backdrop */}
            <motion.div
              key="confirm-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={handleConfirmNo}
              className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm"
            />

            {/* Compact card — centred, matching screenshot */}
            <motion.div
              key="confirm-card"
              initial={{ opacity: 0, scale: 0.92, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 8 }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
              className="fixed inset-0 z-[201] flex items-center justify-center p-6"
            >
              <div
                className="w-full max-w-[320px] rounded-2xl px-5 py-5 shadow-2xl"
                style={{
                  background: "rgba(18, 22, 38, 0.97)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
                }}
              >
                {/* Title */}
                <h3 className="text-base font-bold text-white mb-1">
                  Go to Feed?
                </h3>

                {/* Venture name subtitle */}
                {ventureName && (
                  <p className="text-sm text-slate-400 mb-5 leading-snug">
                    {ventureName}
                  </p>
                )}

                {/* Buttons */}
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleConfirmNo}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-300 transition-all duration-150 active:scale-95"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    No
                  </button>
                  <button
                    onClick={handleConfirmYes}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-150 active:scale-95 hover:brightness-110"
                    style={{
                      background: "linear-gradient(135deg, #6366f1, #7c3aed)",
                      boxShadow: "0 4px 16px rgba(99,102,241,0.35)",
                    }}
                  >
                    Yes
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
