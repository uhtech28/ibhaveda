/**
 * Sprite sheet warming + readiness tracking.
 *
 * WHY THIS EXISTS
 * ---------------
 * The combat sprite player (`AnimatedSpritesheet`) is a pure CSS
 * `background-image` + `steps()` animation. CSS animations start the
 * instant the element is inserted and NEVER wait for the image. Each
 * combat state is its own file, so the FIRST time a boss swings, the
 * browser begins downloading `attack.png` while the clip is already
 * running -- and if the bytes land after the clip has finished, the
 * user sees a blank sprite and then a snap back to idle. The SECOND
 * attack hits a warm cache and plays perfectly.
 *
 * That is the long-standing "first attack has no animation, second one
 * does" report, and why it varied by boss and template: only `idle.png`
 * is ever loaded ahead of time (by the resting clip), so every other
 * state races the animation on its first use.
 *
 * Two things were wrong with the previous fix, which warmed sheets with
 * a bare `new Image(); img.src = url`:
 *
 *  1. NOTHING HELD THE REFERENCE. An HTMLImageElement that is not in the
 *     document and has no live JS reference is eligible for GC, and
 *     browsers may abort its in-flight fetch when it is collected. The
 *     warm silently did nothing some fraction of the time -- which is
 *     exactly the intermittent, template-dependent behaviour reported.
 *
 *  2. FETCHED IS NOT PAINTABLE. Landing the bytes is not enough; the
 *     image still has to be DECODED before it can be painted as a
 *     background, and decode is asynchronous. `decode()` forces it and
 *     resolves only when the frame can actually be drawn.
 *
 * So: keep a hard reference until the decode settles, and expose a
 * synchronous `isSpriteReady` the player can use to hold the animation
 * back until the sheet can be painted.
 */

/** URLs whose bytes have arrived AND decoded (or failed -- see below). */
const ready = new Set<string>();

/** In-flight warms, deduped by URL. */
const inFlight = new Map<string, Promise<void>>();

/**
 * Hard references to the Image elements being warmed. Without this the
 * elements are collectable mid-fetch and the load can be aborted. Each
 * entry is dropped as soon as its decode settles -- by then the browser
 * has the decoded frame in its own cache and no longer needs ours.
 */
const keepAlive = new Set<HTMLImageElement>();

/**
 * True when `url` can be painted right now with no network or decode
 * work. Synchronous by design: the player calls it during render to
 * decide whether it can start the clip immediately (the common case,
 * once a sheet has been used) or must wait a beat.
 */
export function isSpriteReady(url: string): boolean {
  return ready.has(url);
}

/**
 * Fetch and DECODE a sprite sheet. Resolves when the image is paintable.
 *
 * Failures resolve rather than reject, and mark the URL ready. A missing
 * or corrupt sheet must not leave the player waiting forever -- better
 * to run the clip against a broken image (the sprite is invisible for
 * that one beat, exactly as it is today) than to freeze combat.
 */
export function warmSprite(url: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (ready.has(url)) return Promise.resolve();
  const existing = inFlight.get(url);
  if (existing) return existing;

  const img = new window.Image();
  keepAlive.add(img);
  // Combat sheets are small (tens of KB) but they compete with map
  // textures that run to several MB. Without a priority hint the browser
  // queues the sheet behind them and a slow connection can still miss the
  // clip window. "high" moves it to the front; the sheets are tiny enough
  // that this costs the page nothing.
  img.fetchPriority = "high";
  // Hint the decoder without depending on it -- see below.
  img.decoding = "async";
  // Not `crossOrigin` -- these are same-origin assets, and setting it
  // would force a CORS preflight-style request that the CDN answers
  // without the header, failing the load outright.
  img.src = url;

  const settle = () => {
    ready.add(url);
    inFlight.delete(url);
    keepAlive.delete(img);
  };

  // RESOLVE ON LOAD, NOT ON decode().
  //
  // decode() is the API that promises "paintable", and this used to await
  // it. Measured in Chrome, on a DETACHED image -- which every warm here
  // is, since the element is never inserted -- decode() simply never
  // settles: the image reaches complete=true with naturalWidth 864 and
  // the promise is still pending seconds later. Its decode is tied to a
  // rendering opportunity the element never gets.
  //
  // The cost of that was not "the warm is useless", it was worse than
  // doing nothing: isSpriteReady stayed false forever, so every clip fell
  // through to the player's timeout before starting. The clip then began
  // AFTER the reaction window had closed, which reads as no animation at
  // all -- the exact bug this file was added to fix.
  //
  // The load event is reliable for detached images. Once loaded the frame
  // is in the browser's memory cache and painting it as a background is
  // immediate in practice; the earlier measurement showed the delay that
  // actually loses the clip is the FETCH (seconds), not the decode.
  //
  // decode() is still kicked off for its side effect, unawaited, so a
  // browser that does honour it has the frame ready even sooner.
  const p = new Promise<void>((resolve) => {
    if (img.complete && img.naturalWidth > 0) {
      resolve();
      return;
    }
    img.onload = () => resolve();
    img.onerror = () => resolve();
  }).then(settle);

  if (typeof img.decode === "function") {
    void img.decode().catch(() => {
      /* best effort; never gates readiness */
    });
  }

  inFlight.set(url, p);
  return p;
}

/** Warm several sheets at once. Order is a hint, not a guarantee. */
export function warmSprites(urls: readonly string[]): void {
  for (const u of urls) void warmSprite(u);
}
