/**
 * Pixel-font loaders for the combat panel.
 *
 * Uses Next.js's font system so the fonts are self-hosted at build
 * time (no client-side flash, no third-party CDN dependency). Two
 * variables are exported as CSS custom properties so Tailwind utility
 * classes can reference them.
 *
 * Wire-up:
 *   1. Import `combatFonts` from this file in `src/app/layout.tsx`.
 *   2. Add `combatFonts.variables` to the top-level <html> className.
 *   3. The combat components reference `font-pixel-display` and
 *      `font-pixel-body` classes (defined in tailwind.config or via
 *      arbitrary properties — see Tailwind class usage in the
 *      combat components).
 */

import { Press_Start_2P, Pixelify_Sans } from "next/font/google";

const pixelDisplay = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-pixel-display",
  display: "swap",
});

const pixelBody = Pixelify_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-pixel-body",
  display: "swap",
});

export const combatFonts = {
  /** Concatenated CSS variable class names — apply to <html>. */
  variables: `${pixelDisplay.variable} ${pixelBody.variable}`,
  pixelDisplay,
  pixelBody,
};
