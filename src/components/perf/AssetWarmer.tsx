"use client";

/**
 * @file AssetWarmer.tsx
 * @description Fires `<link rel="preload" as="image">` for the
 *   handful of assets that gate first-perceived-smoothness on the
 *   map + tutorial surfaces. Mount once at the top of the map route
 *   (or map layout) so browsers start fetching in parallel with
 *   React hydration + Convex queries instead of waiting for the
 *   consuming component to mount.
 *
 *   Why: user reported "icons, animations, victory board, sparky
 *   etc sometime takes time to load which can feel glitchy". Root
 *   cause is on-demand image fetching — the first time Sparky
 *   transitions from idle to celebrate, the celebrate frame downloads
 *   mid-transition and there's a visible pop. Same for the Victory
 *   panel's XP hexagon, and for the menu tile icons on the
 *   Adventurer's Menu first-open.
 *
 *   Preload cost is tiny (each PNG is <30KB, most are ~4-8KB) and
 *   the browser will still cache them, so subsequent renders read
 *   from disk instantly.
 *
 *   Purely a `<head>` injection — no DOM overhead, no re-renders,
 *   no runtime cost after the initial render.
 */

import React from "react";

// Sparky sprite frames — 4 tiny sheets, used everywhere the tutorial
// touches. Warming these kills the flicker when the puppy switches
// mood ("celebrating" during Victory, "pointing" on hover targets, etc).
const SPARKY_FRAMES = [
  "/assets/tutorial/sparky/idle.png",
  "/assets/tutorial/sparky/talk.png",
  "/assets/tutorial/sparky/cheer.png",
  "/assets/tutorial/sparky/roll.png",
];

// Adventurer's Menu tile icons — 9 tiles, each rendered as a
// PixelIcon with `unoptimized` set (bypasses Next.js Image cache).
// Warming them means the menu paints instantly on first open instead
// of showing empty placeholders for ~200-400ms while the icons stream.
const MENU_TILE_ICONS = [
  "/assets/ui/icons/menu-contributions-v3.png",
  "/assets/ui/icons/menu-quests-v2.png",
  "/assets/ui/icons/crystal-ball-purple.png",
  "/assets/ui/icons/menu-community-v2.png",
  "/assets/ui/icons/menu-hierarchy-v2.png",
  "/assets/ui/icons/menu-calendar-v2.png",
  "/assets/ui/icons/menu-kanban-v2.png",
  "/assets/ui/icons/journal.png",
  "/assets/ui/icons/menu-flare-v2.png",
  "/assets/ui/icons/saddlebag-backpack.png",
];

// Fog of Vagueness sprite frames — the first boss every venture user
// meets on stage 1. Preloading the full state machine (idle + attack
// + hurt + defeat + victory) means the AI combat panel has instant
// reactions instead of downloading the next frame mid-swing.
const FOG_BOSS_FRAMES = [
  "/assets/bosses/village/fog/idle.png",
  "/assets/bosses/village/fog/attack.png",
  "/assets/bosses/village/fog/hurt.png",
  "/assets/bosses/village/fog/defeat.png",
  "/assets/bosses/village/fog/victory.png",
];

const ALL_ASSETS = [...SPARKY_FRAMES, ...MENU_TILE_ICONS, ...FOG_BOSS_FRAMES];

export function AssetWarmer() {
  return (
    <>
      {ALL_ASSETS.map((href) => (
        <link
          key={href}
          rel="preload"
          as="image"
          href={href}
          // fetchpriority=low so the preloads don't compete with the
          // critical Next.js JS/CSS chunks + first-paint HTML. Browser
          // still queues them immediately — they arrive during idle
          // network time.
          // @ts-expect-error — `fetchpriority` is a valid attribute
          // supported by all modern browsers; React 18 types don't
          // include it yet.
          fetchpriority="low"
        />
      ))}
    </>
  );
}

export default AssetWarmer;
