#!/usr/bin/env node
/**
 * compose-personas.mjs
 *
 * Take individual per-pose sprite PNGs dropped into
 *   public/assets/personas/_incoming/
 * and build the proper spritesheets for each persona:
 *   public/assets/personas/<id>/
 *     idle.png       ← horizontal strip of N idle frames (32x48 each)
 *     walk.png       ← horizontal strip of N walk frames (32x48 each)
 *     portrait.png   ← 128x128 fit-cropped portrait
 *
 * Naming convention inside _incoming/ (case-insensitive):
 *
 *   <persona-id>-idle-<frame>.png     e.g. arcanist-idle-0.png
 *   <persona-id>-walk-<frame>.png     e.g. arcanist-walk-3.png
 *   <persona-id>-portrait.png         e.g. arcanist-portrait.png
 *
 * Frame numbers can be 0-indexed or 1-indexed; the script sorts them
 * numerically. Missing frames are skipped and the sheet is padded so
 * the strip is contiguous (frame 0 leftmost, frame N-1 rightmost).
 *
 * Any unmatched files are logged and left in place so nothing is lost.
 *
 * Usage:
 *   node scripts/compose-personas.mjs
 *   npm run personas:compose
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PERSONAS_DIR = path.join(ROOT, "public", "assets", "personas");
const INCOMING_DIR = path.join(PERSONAS_DIR, "_incoming");

// Must match src/config/personas.ts
const PERSONA_IDS = [
  "arcanist",
  "alchemist",
  "artisan",
  "drifter",
  "engineer",
  "healer",
  "oracle",
  "pathfinder",
];

// Match the sprite spec in src/config/personas.ts (DEFAULT_SPRITE).
// Every frame gets normalised to these dimensions before tiling.
const FRAME_W = 32;
const FRAME_H = 48;
const PORTRAIT_SIZE = 128;

/** Fit an image into a FRAME_W x FRAME_H canvas without cropping.
 *  Preserves aspect ratio, transparent letterbox around edges. */
async function normaliseFrame(srcPath) {
  return sharp(srcPath)
    .resize(FRAME_W, FRAME_H, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: "nearest",
    })
    .png()
    .toBuffer();
}

/** Tile N buffers horizontally into a single strip. */
async function tileStrip(frameBuffers) {
  const width = frameBuffers.length * FRAME_W;
  const height = FRAME_H;
  const composite = frameBuffers.map((buf, i) => ({
    input: buf,
    left: i * FRAME_W,
    top: 0,
  }));
  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composite)
    .png()
    .toBuffer();
}

/** Build a 128x128 portrait from a source image (contain, no crop). */
async function buildPortrait(srcPath) {
  return sharp(srcPath)
    .resize(PORTRAIT_SIZE, PORTRAIT_SIZE, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: "nearest",
    })
    .png()
    .toBuffer();
}

/** Parse a filename against the convention. Returns null if unmatched. */
function parse(filename) {
  const base = filename.toLowerCase().replace(/\.png$/i, "");
  // <id>-portrait
  const portrait = base.match(/^([a-z]+)-portrait$/);
  if (portrait) {
    return { persona: portrait[1], kind: "portrait", frame: 0 };
  }
  // <id>-<idle|walk>-<n>
  const anim = base.match(/^([a-z]+)-(idle|walk)-(\d+)$/);
  if (anim) {
    return {
      persona: anim[1],
      kind: anim[2],
      frame: parseInt(anim[3], 10),
    };
  }
  return null;
}

async function main() {
  const exists = await fs
    .stat(INCOMING_DIR)
    .then(() => true)
    .catch(() => false);
  if (!exists) {
    console.error(
      `[compose-personas] no _incoming folder. Create it and drop files:\n  ${INCOMING_DIR}`,
    );
    process.exit(1);
  }

  const entries = await fs.readdir(INCOMING_DIR);
  const pngs = entries.filter((f) => f.toLowerCase().endsWith(".png"));

  if (pngs.length === 0) {
    console.log(
      `[compose-personas] no PNGs in _incoming/. See README.md there for the naming convention.`,
    );
    return;
  }

  // Group by persona + kind
  const groups = new Map(); // key: `${persona}:${kind}` → [{ frame, file }]
  const unmatched = [];

  for (const file of pngs) {
    const parsed = parse(file);
    if (!parsed) {
      unmatched.push(file);
      continue;
    }
    if (!PERSONA_IDS.includes(parsed.persona)) {
      unmatched.push(`${file} (unknown persona "${parsed.persona}")`);
      continue;
    }
    const key = `${parsed.persona}:${parsed.kind}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ frame: parsed.frame, file });
  }

  const summary = { built: [], skipped: [] };

  for (const persona of PERSONA_IDS) {
    const dstDir = path.join(PERSONAS_DIR, persona);
    await fs.mkdir(dstDir, { recursive: true });

    // Portrait
    const portraitGroup = groups.get(`${persona}:portrait`);
    if (portraitGroup && portraitGroup[0]) {
      const src = path.join(INCOMING_DIR, portraitGroup[0].file);
      const buf = await buildPortrait(src);
      await fs.writeFile(path.join(dstDir, "portrait.png"), buf);
      summary.built.push(`${persona}/portrait.png (from ${portraitGroup[0].file})`);
    } else {
      summary.skipped.push(`${persona}/portrait.png (no source)`);
    }

    // Idle + walk strips
    for (const kind of ["idle", "walk"]) {
      const group = groups.get(`${persona}:${kind}`);
      if (!group || group.length === 0) {
        summary.skipped.push(`${persona}/${kind}.png (no source)`);
        continue;
      }
      group.sort((a, b) => a.frame - b.frame);
      const buffers = [];
      for (const { file } of group) {
        buffers.push(await normaliseFrame(path.join(INCOMING_DIR, file)));
      }
      const stripBuf = await tileStrip(buffers);
      await fs.writeFile(path.join(dstDir, `${kind}.png`), stripBuf);
      summary.built.push(
        `${persona}/${kind}.png (${group.length} frame${group.length === 1 ? "" : "s"})`,
      );
    }
  }

  console.log("[compose-personas] built:");
  for (const line of summary.built) console.log(`  ✓ ${line}`);

  if (summary.skipped.length > 0) {
    console.log("\n[compose-personas] skipped (no source in _incoming/):");
    for (const line of summary.skipped) console.log(`  · ${line}`);
  }

  if (unmatched.length > 0) {
    console.log("\n[compose-personas] unmatched files (left in _incoming/):");
    for (const line of unmatched) console.log(`  ? ${line}`);
    console.log(
      "  Expected naming: <persona-id>-{idle|walk}-<frame>.png or <persona-id>-portrait.png",
    );
  }

  console.log("\n[compose-personas] done.");
}

main().catch((err) => {
  console.error("[compose-personas] failed:", err);
  process.exit(1);
});
