#!/usr/bin/env node
/**
 * Asset optimization helper — run after installing sharp/cwebp:
 *   npm i -D sharp
 *   node scripts/optimize-assets.mjs --dry-run
 *
 * Converts PNGs under public/assets to WebP (keeps originals until verified).
 * For production atlases, use TexturePacker / free-tex-packer → buildings.webp + JSON.
 */
import { readdir, stat } from "node:fs/promises";
import path from "node:path";

const ASSETS_ROOT = path.join(process.cwd(), "public", "assets");
const DRY_RUN = process.argv.includes("--dry-run");

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) files.push(...(await walk(full)));
    else if (ent.name.endsWith(".png")) files.push(full);
  }
  return files;
}

async function main() {
  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    console.error("Install sharp: npm i -D sharp");
    process.exit(1);
  }

  const pngs = await walk(ASSETS_ROOT);
  let before = 0;
  let after = 0;

  for (const file of pngs) {
    const st = await stat(file);
    before += st.size;
    const out = file.replace(/\.png$/i, ".webp");
    if (DRY_RUN) {
      console.log("[dry-run]", path.relative(ASSETS_ROOT, file), "→", path.basename(out));
      continue;
    }
    await sharp(file).webp({ quality: 82, alphaQuality: 90 }).toFile(out);
    const webpStat = await stat(out);
    after += webpStat.size;
  }

  if (!DRY_RUN) {
    const saved = before > 0 ? ((1 - after / before) * 100).toFixed(1) : "0";
    console.log(`Processed ${pngs.length} PNGs. Est. savings: ${saved}% (${before} → ${after} bytes)`);
  } else {
    console.log(`Would process ${pngs.length} PNG files under public/assets`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
