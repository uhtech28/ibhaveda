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
import type { LucideIcon } from "lucide-react";
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
  // Renamed from "leaderboard" per product request — this menu item
  // now routes to the /community hub (which owns Top Contributors +
  // Top Projects) instead of a separate leaderboard page. Panel-id
  // kept short so the switch statement in `map/world/page.tsx` reads
  // cleanly.
  | "community"
  | "minigames"
  | "settings"
  | "help"
  // Flare tile in the menu — opens the FlareComposeDialog directly
  // (a "signal fire" the founder throws when stuck). Panel-id is
  // handled in map/world/page.tsx which owns the compose dialog's
  // open state.
  | "flare";

interface MapMenuPopoverProps {
  onOpenPanel: (tab: MapMenuPanelId) => void;
  className?: string;
}

// Each entry can render either a pixel-art icon (PixelIcon) or a
// lucide icon component. Community uses the same lucide `Users`
// icon the header nav uses for /community, per product feedback that
// the menu icon should match the site's Community symbol.
const MENU_ITEMS: readonly {
  id: MapMenuPanelId;
  label: string;
  pixelIcon?: PixelIconName;
  lucideIcon?: LucideIcon;
  accent: string;
}[] = [
  // Contributions now uses the pixel-art hammer icon per product
  // request — "contributions" reads as builder-work-in-progress and
  // the hammer matches that mental model better than the scroll.
  // Contributions tile — user-supplied menu PNG. Opens the Team &
  // Contributors panel (Incoming Requests + Invite Contributors
  // tabs, both with skill-tag filtering).
  // Contributions tile — swapped from v2 (map-scroll) to v3 (hammer)
  // per user upload. The tile still opens the ContributionRequestModal
  // (with skill tags) via handleSidebarOpenPanel; only the artwork
  // changed.
  { id: "contributors", label: "Contributions", pixelIcon: "menu-contributions-v3",   accent: "border-indigo-500/25 hover:border-indigo-500/60 hover:bg-indigo-500/10" },
  // Quests tile — user-supplied menu PNG. Wired to the existing
  // minigames panel-id (product treats the two as the same "extras"
  // surface).
  { id: "minigames",    label: "Quests",        pixelIcon: "menu-quests-v2",          accent: "border-teal-500/25 hover:border-teal-500/60 hover:bg-teal-500/10" },
  { id: "chat",         label: "Group Chat",    pixelIcon: "crystal-ball-purple",     accent: "border-blue-500/25 hover:border-blue-500/60 hover:bg-blue-500/10" },
  // Guild tile — pixel-art guild-crest icon, opens the Team &
  // Contributors panel (Incoming Requests + Invite Contributors
  // tabs) that used to open from the Contributions tile. Product
  // rename: was "Community" routing to /community; now it's
  // "Guild" and it fires the `community` panel-id which the map
  // page's handleSidebarOpenPanel now maps to
  // setIsContributorsOpen(true). Kept the internal id as
  // "community" to avoid a wider MapMenuPanelId union rename.
  { id: "community",    label: "Guild",         pixelIcon: "menu-community-v2",       accent: "border-yellow-500/25 hover:border-yellow-500/60 hover:bg-yellow-500/10" },
  // Hierarchy now uses the treasure-map scroll icon per product
  // request — reads better as a "map of your idea tree" than the
  // generic map-region tile that was there before.
  { id: "hierarchy",    label: "Hierarchy",     pixelIcon: "menu-hierarchy-v2",       accent: "border-pink-500/25 hover:border-pink-500/60 hover:bg-pink-500/10" },
  { id: "calendar",     label: "Calendar",      pixelIcon: "menu-calendar-v2",        accent: "border-amber-500/25 hover:border-amber-500/60 hover:bg-amber-500/10" },
  { id: "kanban",       label: "Kanban Board",  pixelIcon: "menu-kanban-v2",          accent: "border-emerald-500/25 hover:border-emerald-500/60 hover:bg-emerald-500/10" },
  { id: "journal",      label: "Journal",       pixelIcon: "journal",                 accent: "border-violet-500/25 hover:border-violet-500/60 hover:bg-violet-500/10" },
  // Flare tile replaces Settings in the 9th grid slot per product
  // request — Settings is still one click away via the saddlebag
  // icon-button pinned next to the × in the header, and Flare
  // deserves top-level menu placement because it's the founder's
  // "I'm stuck, help" signal fire. Uses the shipped pixel-art
  // campfire icon so the visual matches the FlareTriggerButton
  // rendered inside the CheckpointPanel.
  { id: "flare",        label: "Flare",         pixelIcon: "menu-flare-v2",           accent: "border-amber-500/25 hover:border-amber-500/60 hover:bg-amber-500/10" },
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

  // External open hook — tool panels (Journal, Calendar, Kanban,
  // Group Chat, Idea Hierarchy, Contributors) render a saddlebag
  // button next to their × close via <PanelCloseCluster>. Clicking
  // it fires a `map-menu:open` window event which this listener
  // catches and flips `open=true`. Keeps the panels decoupled from
  // this component's internal state.
  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener("map-menu:open", handleOpen);
    return () => window.removeEventListener("map-menu:open", handleOpen);
  }, []);


  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        // Tutorial hook — the saddlebag onboarding step highlights
        // this button so the user knows to open the Adventurer's Menu
        // (which now contains Flare after the CheckpointPanel Flare
        // button was moved).
        data-tutorial="saddlebag-button"
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
                  // max-h + scroll guard so the modal never grows past
                  // the viewport (with 9 tiles in a 3x3 the previous
                  // aspect-square tiles pushed the last row past the
                  // screen edge on typical laptops).
                  className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0A0D12]/95 p-6 shadow-2xl sm:p-8"
                >
                  {/* Saddlebag/Settings button next to × removed per
                      product request — the Adventurer's Menu now
                      only surfaces the × close button. Settings
                      lives elsewhere (profile-setup edit page +
                      map's other entry points). */}

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

                  {/* 3x3 grid on desktop — 9 tiles fit exactly. Mobile
                      stays 2-column so the tiles don't get too small. */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                    {MENU_ITEMS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        role="menuitem"
                        // Tutorial hook — the saddlebag onboarding
                        // step highlights the Flare tile after the
                        // Adventurer's Menu opens.
                        data-tutorial={`menu-tile-${item.id}`}
                        onClick={() => {
                          audioManager.playUI("click");
                          setOpen(false);
                          onOpenPanel(item.id);
                        }}
                        onMouseEnter={() => audioManager.playUI("hover")}
                        className={cn(
                          // Fixed compact tile size — was `aspect-square`
                          // which produced ~200px×200px tiles at the 3-col
                          // grid width, pushing the last row off-screen.
                          // Now a fixed 128px min-height so the whole
                          // menu (title + 3x3) fits inside a laptop
                          // viewport without scrolling.
                          "flex min-h-[128px] flex-col items-center justify-center gap-2 rounded-xl border bg-white/[0.02] px-3 py-4 transition-all hover:-translate-y-0.5",
                          item.accent,
                        )}
                      >
                        {item.pixelIcon ? (
                          // Icon size bumped 44 → 72 per product
                          // request ("increase their size"). The
                          // user's custom PNGs read much better at
                          // the larger scale — the built-in pixel
                          // icons still look sharp because they're
                          // 128px source.
                          <PixelIcon
                            name={item.pixelIcon}
                            size={72}
                            alt={item.label}
                          />
                        ) : item.lucideIcon ? (
                          <item.lucideIcon
                            className="h-16 w-16 text-yellow-300/90"
                            strokeWidth={1.5}
                            aria-label={item.label}
                          />
                        ) : null}
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
