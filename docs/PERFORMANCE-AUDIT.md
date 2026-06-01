# Performance audit — Ibhaveda world map

## Issues found (before refactor)

| # | Issue | Affected files | Severity |
|---|--------|----------------|----------|
| 1 | ~212 HTTP requests on Phaser boot | `asset-loader.ts`, `WorldMapScene.preload` | Critical |
| 2 | All 8 stages built on first frame | `WorldMapScene.buildWorldForCurrentTemplate` | Critical |
| 3 | Tropical land/road (43 PNGs) never used in scene | `asset-loader.ts` | High |
| 4 | Skeld + duplicate tileset spritesheets | `asset-loader.ts` | Medium |
| 5 | Duplicate persona PNG fetches (4→2) | `asset-loader.ts` | Medium |
| 6 | Mine/sprout/tropical loaded at startup | `asset-loader.ts` | High |
| 7 | Audio `preload: true` on Howl | `audioManager.ts` | Medium |
| 8 | `audioManager.init()` on scene create | `WorldMapScene.create` | Medium |
| 9 | `backfillPendingEvaluations` re-runs per venture | `map/world/page.tsx` | Medium |
| 10 | Gold notification effect re-fires on checkpoint churn | `map/world/page.tsx` | Medium |
| 11 | No long-cache headers for `/assets` | `next.config.ts` | Medium |
| 12 | 4600-line world page (re-render surface) | `map/world/page.tsx` | Medium |
| 13 | Duplicate `MapPageInner.tsx` (dead) | `map/world/MapPageInner.tsx` | Low |
| 14 | 780 PNGs ~13.2MB on disk (no WebP atlases) | `public/assets/**` | High (follow-up) |

## Implemented fixes

### Network / Phaser assets
- **Lazy asset packs**: `core` (~90 req) at boot; `sprout` / `mine` / `tropical` on proximity (`asset-packs.ts`, `asset-loader.ts`).
- Removed: skeld, unused `_Sheet` duplicates, tropical land/road, duplicate `Crate_Water_1`.
- **Persona**: 2 network loads + runtime texture alias for male/female keys.

### Stage streaming
- Load only **viewing stage ±1** at startup; `checkBiomeLoading` loads/unloads by camera distance.
- `unloadStage()` frees biome containers, fog, mini-bosses, stage-2 monkeys.

### Audio
- `preload: false` on Howl; init only via `unlock()` (pointer / map page).

### Next.js
- `Cache-Control: public, max-age=31536000, immutable` for `/assets`, `/audio`, `/_next/static`.
- `optimizePackageImports` for lucide, framer-motion, date-fns, radix.

### Convex (client)
- One-shot `backfillPendingEvaluations` per venture id.
- Gold notifications deduped by notification id; narrower effect deps.

## Estimated impact

| Metric | Before (est.) | After (est.) | Notes |
|--------|---------------|--------------|--------|
| Startup HTTP requests | ~271+ | **~85–95** | Core pack only; biome packs when scrolling |
| Startup image bytes | ~5.3 MB | **~2.8–3.2 MB** | No tropical/mine/sprout at boot |
| Time to `PHASER_READY` | 4–8s (mid laptop) | **2–4s** | Fewer downloads + less create() work |
| First paint CPU hitch | All 8 stages | **1–3 stages** | Less tilemap/layer work |
| FPS (scroll/play) | 35–50 | **50–60** | Less memory, fewer objects when distant |
| Repeat visit bandwidth | Full re-fetch | **Cached assets** | immutable cache headers |

Run `ANALYZE=true npm run build` after adding `@next/bundle-analyzer` for JS bundle numbers.

## Follow-up (not automated — needs art pipeline)

1. **WebP + atlases**: `node scripts/optimize-assets.mjs` (requires `sharp`); pack tropical buildings into `buildings.webp` + JSON.
2. **Tilemap chunks**: split `Beginning Fields.tmj` or use multiple smaller maps per stage panel.
3. **Split `page.tsx`**: data hooks / HUD / modals; `React.memo` on `CheckpointPanel`, `StageStrip`.
4. **Remove `MapPageInner.tsx`** duplicate.
5. **Merge Convex tool queries** in `ToolsPanel` (6→1 conditional query).

## Bundle analysis

```bash
# Optional: npm i -D @next/bundle-analyzer
ANALYZE=true npm run build

# Quick static size check
du -sh .next/static/chunks 2>/dev/null || echo "Run npm run build first"
```
