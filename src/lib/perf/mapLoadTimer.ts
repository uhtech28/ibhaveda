const KEY = "__map_load_start__";

export function startMapLoadTimer() {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(KEY, String(performance.now()));
}

/**
 * Call once when the map is fully rendered.
 * Returns elapsed ms (or null if no timer was started), and logs to console.
 */
export function measureMapLoad(label = "Map load"): number | null {
  if (typeof sessionStorage === "undefined") return null;
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  sessionStorage.removeItem(KEY);
  const elapsed = Math.round(performance.now() - parseFloat(raw));
  // eslint-disable-next-line no-console
  console.log(`%c⏱ ${label}: ${elapsed}ms`, "color:#fbbf24;font-weight:bold;font-size:14px");
  return elapsed;
}
