"use client";

/**
 * @file MapMenuPopover.tsx
 * @description Menu button + popup that replaces the standalone
 *   LeftSidebar column. Trigger lives on the left edge of the bottom
 *   HUD bar; popup is portalled to document.body so it escapes the
 *   HUD wrapper's `contain: layout paint` (which was clipping it and
 *   making the popup invisible).
 */

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { audioManager } from "@/lib/audio/audioManager";
import { PixelIcon, type PixelIconName } from "@/components/ui/PixelIcon";
import { cn } from "@/lib/utils";

export type MapMenuPanelId =
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
  | "help";

interface MapMenuPopoverProps {
  onOpenPanel: (tab: MapMenuPanelId) => void;
  className?: string;
}

const MENU_ITEMS: readonly {
  id: MapMenuPanelId;
  label: string;
  pixelIcon: PixelIconName;
  accent: string;
}[] = [
  { id: "feed",         label: "Contributions", pixelIcon: "scroll-approved",         accent: "border-indigo-500/25 hover:border-indigo-500/60 hover:bg-indigo-500/10" },
  { id: "chat",         label: "Group Chat",    pixelIcon: "crystal-ball-purple",     accent: "border-blue-500/25 hover:border-blue-500/60 hover:bg-blue-500/10" },
  { id: "contributors", label: "Contributors",  pixelIcon: "guild-crest-gold-eagle",  accent: "border-sky-500/25 hover:border-sky-500/60 hover:bg-sky-500/10" },
  { id: "hierarchy",    label: "Hierarchy",     pixelIcon: "map-region",              accent: "border-pink-500/25 hover:border-pink-500/60 hover:bg-pink-500/10" },
  { id: "calendar",     label: "Calendar",      pixelIcon: "hourglass-blue",          accent: "border-amber-500/25 hover:border-amber-500/60 hover:bg-amber-500/10" },
  { id: "kanban",       label: "Kanban Board",  pixelIcon: "rune-stone",              accent: "border-emerald-500/25 hover:border-emerald-500/60 hover:bg-emerald-500/10" },
  { id: "journal",      label: "Journal",       pixelIcon: "journal",                 accent: "border-violet-500/25 hover:border-violet-500/60 hover:bg-violet-500/10" },
  { id: "settings",     label: "Settings",      pixelIcon: "saddlebag-backpack",      accent: "border-slate-500/25 hover:border-slate-500/60 hover:bg-slate-500/10" },
];

// Modal now covers the center of the screen (like the persona picker)
// rather than a small popover anchored to the button. Kept the const
// names to minimise diff, but they're no longer used for positioning.

export function MapMenuPopover({ onOpenPanel, className }: MapMenuPopoverProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Portal target only available client-side.
  useEffect(() => {
    setMounted(true);
  }, []);

  // Dismiss on Esc. Outside-click closes via the scrim's own onClick;
  // no positioning tracking needed — modal is viewport-centered.
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open]);


  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => {
          audioManager.playUI("click");
          setOpen((v) => !v);
        }}
        onMouseEnter={() => audioManager.playUI("hover")}
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-all",
          "border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]",
          open && "border-amber-400/50 bg-amber-500/10",
          className,
        )}
      >
        <PixelIcon name="saddlebag-backpack" size={22} alt="Menu" />
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                key="map-menu-modal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                role="dialog"
                aria-modal="true"
                aria-label="Adventurer's Menu"
                onClick={() => setOpen(false)}
                className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
              >
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.96 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0A0D12]/95 p-6 shadow-2xl sm:p-8"
                >
                  {/* Close button (top-right) — mirrors persona-picker style */}
                  <button
                    type="button"
                    aria-label="Close menu"
                    onClick={() => {
                      audioManager.playUI("click");
                      setOpen(false);
                    }}
                    className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-white/60 transition-all hover:border-white/30 hover:bg-white/[0.08] hover:text-white"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>

                  <header className="mb-5 pr-10">
                    <p
                      className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-amber-400/80"
                      style={{
                        fontFamily: "var(--font-pixel-display), monospace",
                      }}
                    >
                      Adventurer's Menu
                    </p>
                    <h2 className="mt-1 text-xl font-semibold text-white sm:text-2xl">
                      Choose your path
                    </h2>
                  </header>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                    {MENU_ITEMS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          audioManager.playUI("click");
                          setOpen(false);
                          onOpenPanel(item.id);
                        }}
                        onMouseEnter={() => audioManager.playUI("hover")}
                        className={cn(
                          "flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border bg-white/[0.02] px-3 py-4 transition-all hover:-translate-y-0.5",
                          item.accent,
                        )}
                      >
                        <PixelIcon
                          name={item.pixelIcon}
                          size={44}
                          alt={item.label}
                        />
                        <span className="text-center text-[11px] font-semibold uppercase tracking-wider text-white/85 sm:text-xs">
                          {item.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
