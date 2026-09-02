/**
 * Generates src/config/boss-sprite-manifest.ts from the PNGs on disk.
 *
 * WHY THIS EXISTS
 * ---------------
 * Boss clip metadata (frameWidth / frameHeight / frameCount) used to be
 * hardcoded: `pxClip()` in stage-bosses.ts stamped 92x92x9 onto all 87 of
 * its call sites, and template-stage-bosses.ts carried a hand-maintained
 * `clips.size` per boss. Neither tracked what the artists actually
 * shipped, so ~39 clips declared the wrong frame size or count.
 *
 * That failure is SILENT and it is why "some animations don't work": the
 * CSS steps() player derives background-size from frameCount, so a wrong
 * count doesn't 404 — it slides through the wrong slice of the strip and
 * the boss appears frozen, jittery, or half-cropped.
 *
 * Every boss sheet is a horizontal strip of SQUARE frames, so the truth
 * is recoverable from the image header alone:
 *     frame size  = image height
 *     frame count = image width / image height
 *
 * Re-run after adding or re-exporting boss art:
 *     node scripts/gen-boss-sprite-manifest.mjs
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { inflateSync } from "node:zlib";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const PUBLIC = join(ROOT, "public");
const BOSSES = join(PUBLIC, "assets/bosses");
const OUT = join(ROOT, "src/config/boss-sprite-manifest.ts");

const CLIP_FILES = new Set([
  "idle.png",
  "attack.png",
  "hurt.png",
  "defeat.png",
  "victory.png",
]);

/** Read width/height straight out of the PNG IHDR chunk. */
function pngSize(file) {
  const b = readFileSync(file);
  if (b.length < 24) return null;
  // 8-byte signature, then IHDR length(4) + type(4), then width(4) height(4)
  if (b.readUInt32BE(12) !== 0x49484452) return null; // not "IHDR"
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

/**
 * Opaque bounding box of FRAME 0, in frame-local pixels.
 *
 * WHY AT BUILD TIME. This used to be computed in the browser: MinionSprite
 * drew frame 0 to a canvas and scanned the alpha channel. That works, but
 * it depends on canvas + getImageData succeeding at runtime, and when it
 * does not (a tainted canvas, a blocked image load, a CDN without CORS
 * headers) the component silently falls back to the UNTRIMMED frame --
 * which is precisely the unequal-sized bosses the trim exists to prevent,
 * with no error anywhere. Measuring here removes the runtime dependency
 * entirely: the browser just reads numbers.
 *
 * Decodes 8-bit PNGs with an alpha channel (colour types 6 = RGBA and
 * 4 = grey+alpha), non-interlaced -- which is what the sprite pipeline
 * emits. Anything else returns null and the caller keeps the untrimmed
 * geometry rather than guessing.
 */
function frameZeroBounds(file, frameW, frameH) {
  const buf = readFileSync(file);
  let pos = 8; // skip signature
  let bitDepth = 0, colorType = 0, interlace = 0, w = 0, h = 0;
  const idat = [];
  while (pos + 8 <= buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") {
      w = data.readUInt32BE(0);
      h = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      interlace = data[12];
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") break;
    pos += 12 + len; // len + type(4) + data + crc(4)
  }
  if (bitDepth !== 8 || interlace !== 0) return null;
  const channels = colorType === 6 ? 4 : colorType === 4 ? 2 : 0;
  if (!channels) return null; // no alpha channel -> nothing to trim against

  let raw;
  try {
    raw = inflateSync(Buffer.concat(idat));
  } catch {
    return null;
  }

  const bpp = channels;            // bytes per pixel (8-bit)
  const stride = w * bpp;
  const out = Buffer.alloc(h * stride);
  let rp = 0;
  for (let y = 0; y < h; y++) {
    const filter = raw[rp++];
    const row = raw.subarray(rp, rp + stride);
    rp += stride;
    const cur = out.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0;      // left
      const b = prev ? prev[x] : 0;               // up
      const c = prev && x >= bpp ? prev[x - bpp] : 0; // upper-left
      let v = row[x];
      switch (filter) {
        case 0: break;                       // None
        case 1: v = v + a; break;            // Sub
        case 2: v = v + b; break;            // Up
        case 3: v = v + ((a + b) >> 1); break; // Average
        case 4: {                            // Paeth
          const p = a + b - c;
          const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
          v = v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
          break;
        }
        default: return null;                // unknown filter
      }
      cur[x] = v & 0xff;
    }
  }

  // Scan the alpha of frame 0 only.
  const alphaOffset = bpp - 1;
  const maxX = Math.min(frameW, w);
  const maxY = Math.min(frameH, h);
  let minX = maxX, minY = maxY, mx = -1, my = -1;
  for (let y = 0; y < maxY; y++) {
    for (let x = 0; x < maxX; x++) {
      // alpha > 8 ignores the near-transparent fringe some exports carry
      if (out[y * stride + x * bpp + alphaOffset] > 8) {
        if (x < minX) minX = x;
        if (x > mx) mx = x;
        if (y < minY) minY = y;
        if (y > my) my = y;
      }
    }
  }
  if (mx < minX || my < minY) return null; // fully transparent
  return { x: minX, y: minY, w: mx - minX + 1, h: my - minY + 1 };
}

const entries = [];
const warnings = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      walk(p);
      continue;
    }
    if (!CLIP_FILES.has(name)) continue;
    const size = pngSize(p);
    if (!size) {
      warnings.push(`unreadable PNG header: ${p}`);
      continue;
    }
    const url = "/" + relative(PUBLIC, p).replace(/\\/g, "/");
    const frames = size.w / size.h;
    if (!Number.isInteger(frames) || frames < 1) {
      // Not a square-framed strip — leave it out so the caller keeps its
      // hand-declared values rather than inheriting a bogus count.
      warnings.push(
        `skipped (not a square-frame strip): ${url} is ${size.w}x${size.h}`,
      );
      continue;
    }
    const bounds = frameZeroBounds(p, size.h, size.h);
    if (!bounds) {
      warnings.push(`no alpha bounds (kept untrimmed): ${url}`);
    }
    entries.push({ url, size: size.h, frames, bounds });
  }
}

if (!existsSync(BOSSES)) {
  console.error(`No boss art directory at ${BOSSES}`);
  process.exit(1);
}
walk(BOSSES);
entries.sort((a, b) => a.url.localeCompare(b.url));

const body = entries
  .map((e) => {
    const b = e.bounds
      ? `, bounds: { x: ${e.bounds.x}, y: ${e.bounds.y}, w: ${e.bounds.w}, h: ${e.bounds.h} }`
      : "";
    return `  "${e.url}": { size: ${e.size}, frames: ${e.frames}${b} },`;
  })
  .join("\n");

const file = `// AUTO-GENERATED by scripts/gen-boss-sprite-manifest.mjs — DO NOT EDIT BY HAND.
// Re-run that script after adding or re-exporting boss art.
//
// Measured frame geometry for every boss sprite sheet in
// public/assets/bosses. Boss sheets are horizontal strips of square
// frames, so \`size\` is the image height and \`frames\` is width / height.
//
// stage-bosses.ts and template-stage-bosses.ts consult this instead of
// trusting hand-written numbers — see the comment at the top of the
// generator for why the hand-written ones drifted and what breaks when
// they do.

export interface BossSpriteGeometry {
  /** Frame width AND height in px (boss frames are square). */
  size: number;
  /** Number of frames in the horizontal strip. */
  frames: number;
  /**
   * Opaque bounding box of FRAME 0, in frame-local px. Lets a caller
   * scale by the sprite's actual pixels instead of its frame, so bosses
   * drawn with different amounts of transparent padding still present at
   * the same visual size. Absent when the PNG could not be decoded, in
   * which case callers keep the untrimmed frame geometry.
   */
  bounds?: { x: number; y: number; w: number; h: number };
}

export const BOSS_SPRITE_MANIFEST: Readonly<
  Record<string, BossSpriteGeometry>
> = {
${body}
};

/**
 * Measured geometry for a boss sheet, or null when the asset isn't in the
 * manifest (missing file, or a sheet whose frames aren't square). Callers
 * fall back to their declared values so an unknown asset degrades to the
 * previous behaviour instead of rendering nothing.
 */
export function getBossSpriteGeometry(
  asset: string | null | undefined,
): BossSpriteGeometry | null {
  if (!asset) return null;
  return BOSS_SPRITE_MANIFEST[asset] ?? null;
}
`;

writeFileSync(OUT, file, "utf8");
console.log(`wrote ${entries.length} sheets -> ${relative(ROOT, OUT)}`);
for (const w of warnings) console.warn(`  warn: ${w}`);
