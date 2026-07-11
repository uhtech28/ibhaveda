/**
 * @file bodyScrollLock.ts
 * @description Reference-counted document.body scroll lock.
 *
 * Problem this solves: multiple overlays (Tutorial mascot, Village
 * finale, Radix dialogs, custom modals) each want to prevent body
 * scrolling while they're open. The naive pattern of "save previous
 * overflow, set to hidden, restore on cleanup" breaks when overlays
 * NEST or when a component re-renders between another overlay's open
 * and close — the captured "previous" value goes stale, and body scroll
 * gets locked permanently until page refresh.
 *
 * Solution: a global counter tracked on the body via a data attribute.
 * First locker sets overflow:hidden; last unlocker restores. Everyone
 * in between just increments/decrements. Nesting is safe.
 *
 * Usage inside a React effect:
 *
 *   useEffect(() => {
 *     if (!shouldLock) return;
 *     const release = acquireBodyScrollLock();
 *     return release;
 *   }, [shouldLock]);
 */

const COUNT_ATTR = "data-body-scroll-locks";
const PREV_OVERFLOW_ATTR = "data-body-scroll-prev-overflow";
const PREV_HTML_OVERFLOW_ATTR = "data-body-scroll-prev-html-overflow";
const PREV_PAD_RIGHT_ATTR = "data-body-scroll-prev-pad-right";

/**
 * Increment the global lock count and (if this is the first lock)
 * set body overflow:hidden. Returns a release function that decrements
 * and (if this was the last lock) restores the original overflow.
 *
 * Safe to call during SSR (returns a no-op release).
 */
export function acquireBodyScrollLock(): () => void {
  if (typeof document === "undefined") return () => {};
  const body = document.body;
  const html = document.documentElement;

  const current = parseInt(body.getAttribute(COUNT_ATTR) ?? "0", 10) || 0;
  const next = current + 1;
  body.setAttribute(COUNT_ATTR, String(next));

  if (current === 0) {
    // First lock — capture originals and apply.
    body.setAttribute(PREV_OVERFLOW_ATTR, body.style.overflow);
    html.setAttribute(PREV_HTML_OVERFLOW_ATTR, html.style.overflow);
    body.setAttribute(PREV_PAD_RIGHT_ATTR, body.style.paddingRight);
    const scrollbarW = window.innerWidth - html.clientWidth;
    body.style.overflow = "hidden";
    html.style.overflow = "hidden";
    if (scrollbarW > 0) {
      body.style.paddingRight = `${scrollbarW}px`;
    }
  }

  let released = false;
  return () => {
    if (released) return; // idempotent — cleanup fires twice in strict mode
    released = true;
    const now = parseInt(body.getAttribute(COUNT_ATTR) ?? "1", 10) || 1;
    const after = Math.max(0, now - 1);
    if (after === 0) {
      // Last lock — restore.
      body.style.overflow = body.getAttribute(PREV_OVERFLOW_ATTR) ?? "";
      html.style.overflow = html.getAttribute(PREV_HTML_OVERFLOW_ATTR) ?? "";
      body.style.paddingRight = body.getAttribute(PREV_PAD_RIGHT_ATTR) ?? "";
      body.removeAttribute(COUNT_ATTR);
      body.removeAttribute(PREV_OVERFLOW_ATTR);
      html.removeAttribute(PREV_HTML_OVERFLOW_ATTR);
      body.removeAttribute(PREV_PAD_RIGHT_ATTR);
    } else {
      body.setAttribute(COUNT_ATTR, String(after));
    }
  };
}

/**
 * Emergency reset — call to force-unlock body scroll from anywhere.
 * Used as a defensive measure when something went wrong (e.g. an
 * overlay unmounted without triggering its release).
 */
export function forceReleaseBodyScrollLock(): void {
  if (typeof document === "undefined") return;
  const body = document.body;
  const html = document.documentElement;
  body.style.overflow = body.getAttribute(PREV_OVERFLOW_ATTR) ?? "";
  html.style.overflow = html.getAttribute(PREV_HTML_OVERFLOW_ATTR) ?? "";
  body.style.paddingRight = body.getAttribute(PREV_PAD_RIGHT_ATTR) ?? "";
  body.removeAttribute(COUNT_ATTR);
  body.removeAttribute(PREV_OVERFLOW_ATTR);
  html.removeAttribute(PREV_HTML_OVERFLOW_ATTR);
  body.removeAttribute(PREV_PAD_RIGHT_ATTR);
}
