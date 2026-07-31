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
  | "scroll-approved";

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
