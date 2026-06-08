/**
 * Shared visual constants for the combat UI.
 *
 * Pulled out of individual components so palette/timing changes never
 * require touching multiple files. Colours match the existing
 * dark-purple-gold-red aesthetic from PRD 3.0.
 */

export const COMBAT_THEME = {
  /** Phase colours for the depleting ring — Undertale-flavoured palette:
   *  pure white default, yellow at half time, red in the final stretch. */
  ring: {
    full: "#FFFFFF",     // pure white — plenty of time
    warning: "#FFFF00",  // bright yellow — running low
    danger: "#FF0000",   // bright red — final stretch
  },

  /** Thresholds (fraction of time remaining) where the ring shifts colour. */
  ringPhase: {
    warningAt: 0.5,
    dangerAt: 0.2,
  },

  /** When ring is in the final ~10%, pulse subtly. */
  pulseAt: 0.1,

  /** Border / panel colours. Pure white-on-black per Undertale convention. */
  panel: {
    bg: "#000000",
    border: "#FFFFFF",
    bracketAccent: "#FFFFFF",
  },

  /** Per-question score animation (final reveal). */
  scoreReveal: {
    durationMs: 1200,
    stagger: 180,
  },
} as const;

export type RingPhase = "full" | "warning" | "danger";

/** Map a normalised remaining-fraction (0-1) to the active ring phase. */
export function phaseFor(remaining: number): RingPhase {
  if (remaining <= COMBAT_THEME.ringPhase.dangerAt) return "danger";
  if (remaining <= COMBAT_THEME.ringPhase.warningAt) return "warning";
  return "full";
}

export function ringColor(phase: RingPhase): string {
  return COMBAT_THEME.ring[phase];
}
