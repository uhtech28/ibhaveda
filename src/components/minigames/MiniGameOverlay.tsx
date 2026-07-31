"use client";

/**
 * Full-screen overlay that hosts the Phaser mini-game canvas while
 * the user plays. Responsible only for sizing the canvas, mounting
 * the Phaser instance via `launchMiniGame`, and forwarding the
 * resolved result back to the parent (which calls `completeSession`).
 *
 * Escape key abandons; the resulting null result is forwarded as an
 * abandon signal.
 */

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { LaunchHandle } from "@/lib/minigames/hostScene";
import type { MiniGameSpawnConfig } from "@convex/miniGameConstants";
import type { MiniGameSceneResult } from "@convex/miniGameTypes";
import { forceReleaseBodyScrollLock } from "@/lib/ui/bodyScrollLock";

interface Props {
  spawn: MiniGameSpawnConfig;
  onResult: (result: MiniGameSceneResult) => void;
  onAbandon: () => void;
}

const OVERLAY_MAX_WIDTH = 720;
const OVERLAY_MAX_HEIGHT = 540;

export function MiniGameOverlay({ spawn, onResult, onAbandon }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  // Compute the canvas size once at mount so it stays stable for the
  // round (resizing mid-round would invalidate Phaser's hit areas).
  const [dims] = React.useState(() => {
    if (typeof window === "undefined") {
      return { width: OVERLAY_MAX_WIDTH, height: OVERLAY_MAX_HEIGHT };
    }
    return {
      width: Math.min(OVERLAY_MAX_WIDTH, window.innerWidth - 64),
      height: Math.min(OVERLAY_MAX_HEIGHT, window.innerHeight - 160),
    };
  });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let handle: LaunchHandle | null = null;
    let cancelled = false;

    // Phaser is browser-only — its module evaluation touches `window`,
    // which crashes SSR. Defer the import until the effect runs (which
    // only fires after the component has mounted in the browser).
    import("@/lib/minigames/hostScene").then(({ launchMiniGame }) => {
      if (cancelled) return;
      handle = launchMiniGame({
        parent: host,
        archetype: spawn.archetype,
        difficulty: spawn.difficulty,
        width: dims.width,
        height: dims.height,
      });
      handle.done.then((result) => {
        if (cancelled) return;
        if (result) onResult(result);
        else onAbandon();
      });
    });

    return () => {
      cancelled = true;
      handle?.dispose();
      // Defensive: the mini-game sub-Phaser attaches global keyboard +
      // pointer listeners that in rare cases don't fully clean up. Force
      // any lingering body scroll lock to release AFTER the natural
      // release, and force-refocus the window so the main Phaser scene's
      // event loop takes back input.
      setTimeout(() => {
        forceReleaseBodyScrollLock();
        if (typeof window !== "undefined") {
          window.focus();
        }
      }, 50);
    };
    // We intentionally don't re-init when callbacks change identity —
    // the Phaser scene captures the initial pair via init data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spawn.archetype, spawn.difficulty, dims.width, dims.height]);

  // ESC key handler — was documented in the corner text ("Esc to abandon")
  // but never actually wired up. Users had no way to exit the mini-game
  // without completing it, which made the map appear "stuck" if they
  // opened a game they weren't ready to play.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onAbandon();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onAbandon]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mini-game"
      className="fixed inset-0 z-[85] flex items-center justify-center bg-black/85 backdrop-blur-sm"
      style={{ pointerEvents: "auto" }}
    >
      <div
        className="relative overflow-hidden rounded-lg border-2 border-white/20 bg-[#0E0C17] shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
        style={{
          width: dims.width,
          height: dims.height + 32,
          pointerEvents: "auto",
        }}
      >
        {/* Explicit close button — Escape key also works. Without this,
            users who open the game and change their mind had no exit
            path short of refreshing the page. */}
        <button
          type="button"
          onClick={onAbandon}
          aria-label="Close mini-game"
          className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-md border border-white/20 bg-black/60 text-white/70 transition hover:border-white/40 hover:bg-black/80 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
        <div
          ref={hostRef}
          style={{
            width: dims.width,
            height: dims.height,
            pointerEvents: "auto",
            // Ensure the canvas receives pointer events even if a
            // parent stylesheet sets touch-action: none.
            touchAction: "manipulation",
          }}
        />
        <p className="px-3 py-2 text-center font-mono text-[10px] uppercase tracking-widest text-white/40">
          Esc or × to abandon
        </p>
      </div>
    </div>
  );
}
