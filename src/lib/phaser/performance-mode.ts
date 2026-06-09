/**
 * Phaser performance-mode detection + override.
 *
 * Auto-detects low-spec devices using navigator.deviceMemory and
 * navigator.hardwareConcurrency. On low-end devices we skip the
 * expensive ambient visuals (parallax clouds/mountains, atmospheric
 * dust, gold shimmer, persona float, boss aura) so the map stays
 * smooth even on cheap laptops + budget Android phones.
 *
 * Users can also force the mode on/off via localStorage:
 *   localStorage.setItem("phaserLiteMode", "true")  // force on
 *   localStorage.setItem("phaserLiteMode", "false") // force off
 *   localStorage.removeItem("phaserLiteMode")       // auto-detect
 */

const STORAGE_KEY = "phaserLiteMode";

let cached: boolean | null = null;

function detectAutomatic(): boolean {
  if (typeof navigator === "undefined") return false;

  // Tightened thresholds — earlier 4GB / 4-core cut was too aggressive
  // and was matching most mid-range laptops, stripping their visuals
  // unnecessarily. Now only fires for genuinely budget hardware.
  const memoryGb = (navigator as { deviceMemory?: number }).deviceMemory;
  if (typeof memoryGb === "number" && memoryGb > 0 && memoryGb < 2) {
    return true;
  }

  const cores = navigator.hardwareConcurrency;
  if (typeof cores === "number" && cores > 0 && cores < 4) {
    return true;
  }

  // Slow-2g / 2g only — 3G is fine for our payload sizes.
  const conn = (
    navigator as { connection?: { effectiveType?: string } }
  ).connection;
  if (
    conn?.effectiveType === "slow-2g" ||
    conn?.effectiveType === "2g"
  ) {
    return true;
  }

  return false;
}

export function isLiteMode(): boolean {
  if (cached !== null) return cached;
  if (typeof window === "undefined") {
    cached = false;
    return false;
  }

  // Manual override wins.
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "true") {
    cached = true;
    return true;
  }
  if (stored === "false") {
    cached = false;
    return false;
  }

  cached = detectAutomatic();
  return cached;
}

export function setLiteMode(enabled: boolean | null): void {
  if (typeof window === "undefined") return;
  if (enabled === null) {
    window.localStorage.removeItem(STORAGE_KEY);
  } else {
    window.localStorage.setItem(STORAGE_KEY, enabled ? "true" : "false");
  }
  cached = null; // re-evaluate on next read
}
