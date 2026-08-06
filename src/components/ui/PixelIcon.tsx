/**
 * @file PixelIcon.tsx
 * @description Tiny wrapper around the sliced pixel-art UI icons in
 *   /public/assets/ui/icons/. Preserves the crunchy pixel-art look via
 *   `imageRendering: pixelated` and forces integer scaling so the icon
 *   stays crisp at any display size.
 *
 * SCOPE: gamification surfaces only (checkpoint tasks, contribution
 *   states, combat timer, streak, guild crest). NOT for chrome nav
 *   (sidebar, header, settings, auth) — those keep lucide-react.
 *
 * Usage:
 *   <PixelIcon name="quest-scroll-open" size={20} />
 *   <PixelIcon name="hourglass-red" size={16} className="animate-pulse" />
 */

import Image from "next/image";

// Union of all sliced icon filenames (without .png). Keep in sync with
// /public/assets/ui/icons/. Compile-time typo protection.
export type PixelIconName =
  | "quest-scroll-open"
  | "quest-scroll-sealed"
  | "map-scroll-x"
  | "map-region"
  | "journal"
  | "saddlebag-satchel"
  | "saddlebag-backpack"
  | "hourglass-blue"
  | "hourglass-red"
  | "crystal-ball-purple"
  | "crystal-ball-green"
  | "crystal-ball-blue"
  | "crystal-ball-cyan"
  | "rune-stone"
  | "guild-crest-red-wolf"
  | "guild-crest-gold-eagle"
  | "guild-crest-wooden-round"
  | "guild-crest-blue-swords"
  | "hammer"
  | "anvil-forge"
  | "scroll-pending"
  | "scroll-approved"
  // Campfire flare icon shipped for the FlareTriggerButton — pixel
  // art of a wood pyre with three tongues of flame. Matches the
  // "signal fire" mental model for flares.
  | "flare-campfire"
  // v2 — center-cropped square version of flare-campfire so the icon
  // fills the tile properly at small sizes (the original was a wide
  // 1383×877 banner that shrank to a letterbox at 44px).
  | "flare-campfire-v2"
  // Custom Adventurer's Menu tiles — user-supplied PNGs shipped in
  // `/public/assets/ui/icons/menu-*-v1.png`. Suffix `-v1` because the
  // read-only mount forbids overwriting an existing file; bumping the
  // suffix is how we swap versions if the art needs iterating later
  // (same pattern used for sparky-v2 and flare-campfire-v2).
  | "menu-contributions-v1"
  | "menu-quests-v1"
  | "menu-community-v1"
  | "menu-hierarchy-v1"
  | "menu-calendar-v1"
  | "menu-kanban-v1"
  | "menu-flare-v1"
  // v2 — same art, but the slate-blue-gray background has been
  // flood-filled to transparent (via scipy label + border-connected
  // component detection). Icons now sit directly on the tile's dark
  // gradient instead of inside a blue square. Bump the suffix again
  // if the artwork needs revisions later.
  | "menu-contributions-v2"
  // v3 — user-supplied hammer icon that replaces the v2 map-scroll
  // for the Contributions tile. Ships alongside v2 rather than
  // overwriting so any surface still referencing v2 keeps working.
  | "menu-contributions-v3"
  | "menu-quests-v2"
  | "menu-community-v2"
  | "menu-hierarchy-v2"
  | "menu-calendar-v2"
  | "menu-kanban-v2"
  | "menu-flare-v2";

export interface PixelIconProps {
  name: PixelIconName;
  /** Rendered pixel size in CSS px. Defaults to 20. */
  size?: number;
  className?: string;
  alt?: string;
}

export function PixelIcon({ name, size = 20, className, alt }: PixelIconProps) {
  // Source is 128×128. Next/Image needs width+height for CLS reservation
  // but we scale it via style so integer-pixel scaling looks crunchy.
  return (
    <Image
      src={`/assets/ui/icons/${name}.png`}
      alt={alt ?? name}
      width={128}
      height={128}
      style={{
        width: size,
        height: size,
        imageRendering: "pixelated",
        // Prevent tint-inheritance from parent color (icons carry their
        // own art so no CSS filter should be applied by default).
        objectFit: "contain",
      }}
      className={className}
      draggable={false}
      unoptimized
    />
  );
}
