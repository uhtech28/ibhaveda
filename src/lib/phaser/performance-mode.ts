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

  // Total RAM hint in GB (1, 0.5, 0.25 are valid). Anything < 4GB is
  // considered low-end. Safari and Firefox don't expose this, so we
  // fall back to hardwareConcurrency.
  const memoryGb = (navigator as { deviceMemory?: number }).deviceMemory;
  if (typeof memoryGb === "number" && memoryGb > 0 && memoryGb < 4) {
    return true;
  }

  // Logical CPU cores. <= 4 cores → likely budget device. Most modern
  // desktops have 8+, most phones have 6+. Cheap laptops + budget
  // Android often have 4 or fewer.
  const cores = navigator.hardwareConcurrency;
  if (typeof cores === "number" && cores > 0 && cores <= 4) {
    return true;
  }

  // Connection type — "slow-2g" / "2g" / "3g" implies a budget device
  // even if RAM/cores look fine.
  const conn = (
    navigator as { connection?: { effectiveType?: string } }
  ).connection;
  if (
    conn?.effectiveType === "slow-2g" ||
    conn?.effectiveType === "2g" ||
    conn?.effectiveType === "3g"
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
