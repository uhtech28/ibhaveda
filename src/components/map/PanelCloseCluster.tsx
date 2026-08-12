"use client";

/**
 * @file PanelCloseCluster.tsx
 * @description Reusable "saddlebag + ×" button pair shown in the
 * top-right corner of every tool panel (Journal, Calendar, Kanban,
 * Group Chat, Idea Hierarchy, Contributors, etc.). The saddlebag
 * reopens the Adventurer's Menu so users can jump between panels
 * without going back through the bottom-HUD menu button; the × is
 * the normal panel close.
 *
 * The menu-open action fires a `map-menu:open` window event that
 * `MapMenuPopover` listens for — no shared state / context needed.
 * Panels using this component just call `onClose` for the × click
 * and don't have to know anything about the menu.
 */

import { PixelIcon } from "@/components/ui/PixelIcon";
import { X } from "lucide-react";

/** Fire this event to reopen the Adventurer's Menu from anywhere. */
export const MAP_MENU_OPEN_EVENT = "map-menu:open" as const;

interface PanelCloseClusterProps {
  /** Called when the user clicks the × close button. */
  onClose: () => void;
  /**
   * Optional Tailwind class for the button colors so panels with a
   * strong accent can tune the hover/border. Defaults to slate-neutral.
   */
  className?: string;
  showSaddlebag?: boolean;
}

/**
 * Renders [saddlebag] [×] in a horizontal cluster. Position via the
 * parent's absolute layout (`className` on wrapper).
 */
export function PanelCloseCluster({
  onClose,
  className,
  showSaddlebag = true,
}: PanelCloseClusterProps) {
  const openMenu = () => {
    // Close the current panel first so the menu opens on top of a
    // clean map view, then dispatch the event on the next frame so
    // MapMenuPopover's listener sees it after the parent's close
    // state has propagated.
    onClose();
    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        window.dispatchEvent(new Event(MAP_MENU_OPEN_EVENT));
      }, 0);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      {showSaddlebag && (
        <button
          type="button"
          onClick={openMenu}
          aria-label="Open Adventurer's Menu"
          title="Open menu"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-400/25 bg-white/[0.03] text-white/70 transition-all hover:border-amber-400/60 hover:bg-amber-500/10 hover:text-white"
        >
          <PixelIcon name="saddlebag-backpack" size={20} alt="Menu" />
        </button>
      )}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close panel"
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-white/70 transition-all hover:border-white/30 hover:bg-white/[0.08] hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
