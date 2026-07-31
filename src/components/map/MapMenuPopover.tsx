"use client";

/**
 * @file MapMenuPopover.tsx
 * @description Menu button + popup that replaces the standalone
 *   LeftSidebar column. Trigger lives on the left edge of the bottom
 *   HUD bar; popup is portalled to document.body so it escapes the
 *   HUD wrapper's `contain: layout paint` (which was clipping it and
 *   making the popup invisible).
 */

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
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

const POPUP_WIDTH = 280;
const POPUP_GAP = 10;

export function MapMenuPopover({ onOpenPanel, className }: MapMenuPopoverProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [anchor, setAnchor] = useState<{ left: number; bottom: number } | null>(
    null,
  );
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Portal target only available client-side.
  useEffect(() => {
    setMounted(true);
  }, []);

  // Position the popup relative to the trigger button. Reruns on resize
  // / scroll so the popup stays glued to the button.
  const updateAnchor = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setAnchor({
      left: r.left,
      // `bottom` in fixed coords = distance from viewport bottom to
      // button's TOP edge (so the popup sits above the button).
      bottom: window.innerHeight - r.top + POPUP_GAP,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updateAnchor();
    window.addEventListener("resize", updateAnchor);
    window.addEventListener("scroll", updateAnchor, true);
    return () => {
      window.removeEventListener("resize", updateAnchor);
      window.removeEventListener("scroll", updateAnchor, true);
    };
  }, [open, updateAnchor]);

  // Dismiss on outside click / Esc.
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        (triggerRef.current && triggerRef.current.contains(t)) ||
        (popupRef.current && popupRef.current.contains(t))
      ) {
        return;
      }
      setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    // rAF so the click that opened the popup doesn't immediately close it.
    const raf = requestAnimationFrame(() => {
      window.addEventListener("mousedown", handleClick);
      window.addEventListener("keydown", handleKey);
    });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", handleKey);
    };
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
            {open && anchor && (
              <motion.div
                ref={popupRef}
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                role="menu"
                style={{
                  position: "fixed",
                  left: anchor.left,
                  bottom: anchor.bottom,
                  width: POPUP_WIDTH,
                  zIndex: 200,
                }}
                className="rounded-xl border border-white/10 bg-[#0A0D12]/95 p-2 shadow-2xl backdrop-blur-xl"
              >
                <div className="mb-1.5 border-b border-white/5 px-2 pb-1.5 pt-1">
                  <p
                    className="font-mono text-[9px] font-bold uppercase tracking-widest text-white/50"
                    style={{
                      fontFamily: "var(--font-pixel-display), monospace",
                    }}
                  >
                    Adventurer's Menu
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
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
                        "flex flex-col items-center gap-1.5 rounded-lg border bg-white/[0.02] px-2 py-2.5 transition-all",
                        item.accent,
                      )}
                    >
                      <PixelIcon
                        name={item.pixelIcon}
                        size={28}
                        alt={item.label}
                      />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-white/80">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
