"use client";

/**
 * /dev/maps — Biome map gallery for client review.
 *
 * Shows every painted stage map in the game with checkpoint markers
 * overlaid at their in-scene positions. Same CP coordinates the Phaser
 * scenes use, scaled to fit the preview card so what you see here
 * mirrors the actual placement in-game.
 *
 * Not linked from anywhere — send the client `/dev/maps` directly.
 * Optional `?bg=light` for a white backdrop.
 */

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";

interface Checkpoint {
  index: number;
  x: number;
  y: number;
  label: string;
}

interface MapDef {
  stage: number;
  displayName: string;
  boss: string;
  mapPath: string;
  mapWidth: number;
  mapHeight: number;
  checkpoints: Checkpoint[];
  /** Optional note shown below the card (e.g., "no PNG yet"). */
  note?: string;
  /** CSS color painted beneath the PNG. Use for maps whose asset has
   *  transparent regions (e.g., Forest — 76% empty in the current
   *  teammate delivery). Also mirrored in-scene as a Phaser rectangle
   *  so the game view matches this preview. */
  backdropColor?: string;
  /** Optional inline warning banner shown at the top of the card. */
  warning?: string;
}

const MAPS: MapDef[] = [
  {
    stage: 1,
    displayName: "The Village",
    boss: "Fog of Vagueness",
    mapPath: "/assets/maps-v2/village-painted/village-map.png",
    mapWidth: 1536,
    mapHeight: 1024,
    checkpoints: [
      { index: 0, x: 173, y: 215, label: "The Signboard" },
      { index: 1, x: 587, y: 633, label: "The Bridge" },
      { index: 2, x: 1177, y: 662, label: "The Barn" },
      { index: 3, x: 1304, y: 325, label: "The Well" },
    ],
  },
  {
    stage: 2,
    displayName: "The Forest",
    boss: "Pathwarden Wraith",
    mapPath: "/assets/maps-v2/forest/forest-map.png",
    mapWidth: 1412,
    mapHeight: 1156,
    checkpoints: [
      { index: 0, x: 210, y: 720, label: "West Threshold" },
      { index: 1, x: 480, y: 580, label: "Whispering Grove" },
      { index: 2, x: 740, y: 440, label: "Moonlit Clearing" },
      { index: 3, x: 950, y: 800, label: "Boss Glade" },
      { index: 4, x: 1220, y: 380, label: "East Exit" },
    ],
    warning: "New LDtk delivery cropped to 1412×1156 (was 2304×1440). CPs rescaled proportionally — tune positions in-scene if landmarks moved.",
  },
  {
    stage: 3,
    displayName: "The Arena",
    boss: "Advocate of Comfortable Lies",
    mapPath: "/assets/maps-v2/arena/arena-map.png",
    mapWidth: 2624,
    mapHeight: 1630,
    checkpoints: [
      { index: 0, x: 280, y: 600, label: "The Naming Post" },
      { index: 1, x: 1300, y: 800, label: "The Sand" },
      { index: 2, x: 1950, y: 420, label: "The Judges' Bench" },
      { index: 3, x: 2280, y: 1150, label: "The Verdict Pillar" },
    ],
  },
  {
    stage: 4,
    displayName: "The Artisan's Quarter",
    boss: "Unfinished Golem",
    mapPath: "/assets/maps-v2/artisans/artisans-map.png",
    mapWidth: 1536,
    mapHeight: 1152,
    checkpoints: [
      { index: 0, x: 300, y: 780, label: "Craft Workshop" },
      { index: 1, x: 700, y: 600, label: "Weaver's Alley" },
      { index: 2, x: 1050, y: 420, label: "Potter's Kiln" },
      { index: 3, x: 900, y: 900, label: "Jeweller's Row" },
      { index: 4, x: 1400, y: 320, label: "Master's Forge" },
    ],
    warning: "Painted area cropped to 1536×1152 (original 2624×1630 canvas had ~60% unpainted grey). CP4 & CP5 moved into painted bounds. Re-paint the rest and re-export to restore full canvas.",
  },
  {
    stage: 5,
    displayName: "The Mine",
    boss: "Collapse Specter",
    mapPath: "/assets/maps-v2/mine/mine-map.png",
    mapWidth: 1536,
    mapHeight: 1024,
    checkpoints: [
      { index: 0, x: 270, y: 220, label: "Mine Head" },
      { index: 1, x: 1400, y: 260, label: "Tool Yard" },
      { index: 2, x: 600, y: 550, label: "First Shaft" },
      { index: 3, x: 1050, y: 620, label: "Support Beam" },
      { index: 4, x: 770, y: 900, label: "Pilot Chamber" },
      { index: 5, x: 1420, y: 820, label: "Loading Bay" },
    ],
  },
  {
    stage: 6,
    displayName: "The Golden Harbour",
    boss: "Harbourmaster of Hesitation",
    mapPath: "/assets/maps-v2/golden-harbor/harbor-map.png",
    mapWidth: 1664,
    mapHeight: 1024,
    checkpoints: [
      { index: 0, x: 320, y: 650, label: "Dockside Arrival" },
      { index: 1, x: 900, y: 400, label: "Market Square" },
      { index: 2, x: 1350, y: 760, label: "Warehouse District" },
    ],
    warning: "Painted area cropped to 1664×1024 (original 2624×1630 canvas had ~60% unpainted grey). CP3 moved into painted bounds. Re-paint the LDtk canvas + re-export to restore full size.",
  },
  {
    stage: 7,
    displayName: "The Crossroads Town",
    boss: "Babel Merchant",
    mapPath: "/assets/maps-v2/crossroads/crossroads-map.png",
    mapWidth: 1408,
    mapHeight: 1152,
    checkpoints: [
      { index: 0, x: 500, y: 400, label: "The Inn Yard" },
      { index: 1, x: 920, y: 620, label: "The Signpost" },
      { index: 2, x: 1200, y: 780, label: "The Roadworks" },
      { index: 3, x: 700, y: 900, label: "The Milestone Marker" },
    ],
    warning: "Painted area cropped to 1408×1152 (original 2624×1630 canvas had ~50% unpainted grey). All 4 CPs fit inside painted bounds — no reposition needed.",
  },
  {
    stage: 8,
    displayName: "The Capital",
    boss: "Iron Bureaucrat",
    mapPath: "",
    mapWidth: 0,
    mapHeight: 0,
    checkpoints: [],
    note: "Painted map pending — only .ldtk source shipped so far.",
  },
];

// ─── Academic template (6 stages) ────────────────────────────────────────
// Separate template from Venture. Maps hand-painted in LDtk, cropped to
// actual painted area. Scene routing not yet wired — these are preview
// only on /dev/maps for the client to review the art.
const ACADEMIC_MAPS: MapDef[] = [
  {
    stage: 1,
    displayName: "The Ancient Library",
    boss: "Librarian of Lost Questions",
    mapPath: "/assets/maps-v2/academic/library-map.png",
    mapWidth: 1540,
    mapHeight: 1156,
    checkpoints: [
      { index: 0, x: 400, y: 600, label: "Reading Hall" },
      { index: 1, x: 770, y: 350, label: "The Catalogue" },
      { index: 2, x: 1200, y: 600, label: "Rare Manuscripts" },
    ],
  },
  {
    stage: 2,
    displayName: "The Ruins",
    boss: "Keeper of Incomplete Records",
    mapPath: "/assets/maps-v2/academic/ruins-map.png",
    mapWidth: 1540,
    mapHeight: 1156,
    checkpoints: [
      { index: 0, x: 400, y: 400, label: "West Chamber" },
      { index: 1, x: 770, y: 600, label: "The Bridge" },
      { index: 2, x: 1200, y: 400, label: "East Observatory" },
    ],
  },
  {
    stage: 3,
    displayName: "The Cartographer's Tower",
    boss: "Cartographer of Crooked Maps",
    mapPath: "/assets/maps-v2/academic/cartographer-tower-map.png",
    mapWidth: 1412,
    mapHeight: 1156,
    checkpoints: [
      { index: 0, x: 400, y: 500, label: "Map Table" },
      { index: 1, x: 700, y: 400, label: "The Tower" },
      { index: 2, x: 1000, y: 500, label: "The Telescope" },
    ],
  },
  {
    stage: 4,
    displayName: "The Scriptorium",
    boss: "Blank Page Wraith",
    mapPath: "/assets/maps-v2/academic/scriptorium-map.png",
    mapWidth: 1156,
    mapHeight: 1412,
    checkpoints: [
      { index: 0, x: 580, y: 300, label: "The First Lectern" },
      { index: 1, x: 580, y: 700, label: "The Middle Row" },
      { index: 2, x: 580, y: 1100, label: "The Deep Table" },
    ],
  },
  {
    stage: 5,
    displayName: "The Council Chamber",
    boss: "Councillor of False Consensus",
    mapPath: "/assets/maps-v2/academic/council-chamber-map.png",
    mapWidth: 1412,
    mapHeight: 1156,
    checkpoints: [
      { index: 0, x: 350, y: 500, label: "Left Bench" },
      { index: 1, x: 700, y: 550, label: "The Round Table" },
      { index: 2, x: 1050, y: 500, label: "Right Bench" },
    ],
  },
  {
    stage: 6,
    displayName: "The Grand Archive",
    boss: "Gatekeeper of Unearned Entry",
    mapPath: "/assets/maps-v2/academic/grand-archive-map.png",
    mapWidth: 1412,
    mapHeight: 1156,
    checkpoints: [
      { index: 0, x: 400, y: 550, label: "Left Reading Desk" },
      { index: 1, x: 700, y: 400, label: "The Compass Rose" },
      { index: 2, x: 1000, y: 550, label: "Right Archive Row" },
    ],
  },
];

// ─── Lab Experiment template (7 stages) ──────────────────────────────────
// 6 of 7 painted. Observatory (Stage 1) still pending from artist. Each
// biome is a fresh Lab paint even where the name overlaps with Academic
// (library / cartographer-tower) or Venture (crossroads) — Lab has its
// own tuning independent of the other templates.
const LAB_MAPS: MapDef[] = [
  {
    stage: 1,
    displayName: "The Observatory",
    boss: "Mirage Lens",
    mapPath: "/assets/maps-v2/lab/observatory-map.png",
    mapWidth: 1412,
    mapHeight: 1156,
    checkpoints: [
      { index: 0, x: 380, y: 500, label: "The Telescope" },
      { index: 1, x: 700, y: 400, label: "Central Dome" },
      { index: 2, x: 1020, y: 500, label: "Star Charts" },
    ],
  },
  {
    stage: 2,
    displayName: "The Ancient Library (Lab)",
    boss: "Librarian of Lost Questions",
    mapPath: "/assets/maps-v2/lab/library-map.png",
    mapWidth: 1284,
    mapHeight: 1156,
    checkpoints: [
      { index: 0, x: 340, y: 600, label: "Reading Hall" },
      { index: 1, x: 640, y: 350, label: "The Catalogue" },
      { index: 2, x: 970, y: 600, label: "Rare Manuscripts" },
    ],
  },
  {
    stage: 3,
    displayName: "The Cartographer's Tower (Lab)",
    boss: "Cartographer of Crooked Maps",
    mapPath: "/assets/maps-v2/lab/cartographer-tower-map.png",
    mapWidth: 1412,
    mapHeight: 1156,
    checkpoints: [
      { index: 0, x: 400, y: 500, label: "Map Table" },
      { index: 1, x: 700, y: 400, label: "The Tower" },
      { index: 2, x: 1000, y: 500, label: "The Telescope" },
    ],
  },
  {
    stage: 4,
    displayName: "The Forge",
    boss: "Saboteur of the Forge",
    mapPath: "/assets/maps-v2/lab/forge-map.png",
    mapWidth: 1412,
    mapHeight: 1156,
    checkpoints: [
      { index: 0, x: 380, y: 500, label: "The Anvil" },
      { index: 1, x: 700, y: 400, label: "The Furnace" },
      { index: 2, x: 1020, y: 500, label: "The Contraption" },
    ],
  },
  {
    stage: 5,
    displayName: "The Alchemist's Laboratory",
    boss: "Alchemist of Wishful Results",
    mapPath: "/assets/maps-v2/lab/alchemists-laboratory-map.png",
    mapWidth: 1412,
    mapHeight: 1028,
    checkpoints: [
      { index: 0, x: 380, y: 460, label: "Distillery" },
      { index: 1, x: 700, y: 380, label: "The Alembic" },
      { index: 2, x: 1020, y: 460, label: "Testing Desk" },
    ],
  },
  {
    stage: 6,
    displayName: "The Crossroads Town (Lab)",
    boss: "Babel Merchant",
    mapPath: "/assets/maps-v2/lab/crossroads-map.png",
    mapWidth: 1412,
    mapHeight: 1156,
    checkpoints: [
      { index: 0, x: 400, y: 400, label: "The Inn Yard" },
      { index: 1, x: 700, y: 550, label: "The Signpost" },
      { index: 2, x: 1000, y: 700, label: "Roadworks" },
    ],
  },
  {
    stage: 7,
    displayName: "The Grand Hall",
    boss: "Silencer of Findings",
    mapPath: "/assets/maps-v2/lab/grand-hall-map.png",
    mapWidth: 1412,
    mapHeight: 1156,
    checkpoints: [
      { index: 0, x: 380, y: 500, label: "The Podium" },
      { index: 1, x: 700, y: 400, label: "Center Stage" },
      { index: 2, x: 1020, y: 500, label: "Audience Bench" },
    ],
  },
];

// ─── Creative template (6 stages) ────────────────────────────────────────
// Every stage reuses an existing painted map from Venture / Academic.
// No new painting required. CPs are re-anchored to the Creative
// narrative (silence, ghosts, unfinished beast, false validation,
// perfectionist spectre, harbour of hesitation).
const CREATIVE_MAPS: MapDef[] = [
  {
    stage: 1,
    displayName: "The Sacred Grove",
    boss: "Silence That Smothers",
    mapPath: "/assets/maps-v2/forest/forest-map.png",
    mapWidth: 1412,
    mapHeight: 1156,
    checkpoints: [
      { index: 0, x: 300, y: 560, label: "The Quiet Path" },
      { index: 1, x: 700, y: 480, label: "Silent Clearing" },
      { index: 2, x: 1050, y: 720, label: "The Old Altar" },
    ],
    note: "Reuses the Venture Forest painting — repurposed as a sacred quiet grove.",
  },
  {
    stage: 2,
    displayName: "The Gallery of Echoes",
    boss: "Curator of Derivative Ghosts",
    mapPath: "/assets/maps-v2/academic/grand-archive-map.png",
    mapWidth: 1412,
    mapHeight: 1156,
    checkpoints: [
      { index: 0, x: 400, y: 550, label: "Left Wing" },
      { index: 1, x: 700, y: 400, label: "The Central Frame" },
      { index: 2, x: 1000, y: 550, label: "Ghost Corridor" },
    ],
    note: "Reuses the Academic Grand Archive painting — repurposed as a gallery of curated echoes.",
  },
  {
    stage: 3,
    displayName: "The Wilderness",
    boss: "Beast of the Unfinished",
    mapPath: "/assets/maps-v2/forest/forest-map.png",
    mapWidth: 1412,
    mapHeight: 1156,
    checkpoints: [
      { index: 0, x: 210, y: 720, label: "Trail's End" },
      { index: 1, x: 550, y: 440, label: "Deep Bramble" },
      { index: 2, x: 920, y: 840, label: "The Beast's Hollow" },
      { index: 3, x: 1220, y: 380, label: "Untamed Ridge" },
    ],
    note: "Reuses the Venture Forest painting — repurposed as an untamed wilderness with the beast's hollow.",
  },
  {
    stage: 4,
    displayName: "The Village Square",
    boss: "Crowd of False Validation",
    mapPath: "/assets/maps-v2/village-painted/village-map.png",
    mapWidth: 1536,
    mapHeight: 1024,
    checkpoints: [
      { index: 0, x: 173, y: 215, label: "The Notice Board" },
      { index: 1, x: 587, y: 633, label: "The Crowd Bridge" },
      { index: 2, x: 1177, y: 662, label: "The Praise Barn" },
      { index: 3, x: 1304, y: 325, label: "The Well of Voices" },
    ],
    note: "Reuses the Venture Village painting — repurposed as a village square where the crowd's cheers ring false.",
  },
  {
    stage: 5,
    displayName: "The Artisan's Workshop",
    boss: "Perfectionist's Spectre",
    mapPath: "/assets/maps-v2/artisans/artisans-map.png",
    mapWidth: 1536,
    mapHeight: 1152,
    checkpoints: [
      { index: 0, x: 300, y: 780, label: "The Workbench" },
      { index: 1, x: 700, y: 600, label: "The Detail Loom" },
      { index: 2, x: 1050, y: 420, label: "The Polishing Kiln" },
      { index: 3, x: 1400, y: 320, label: "The Master's Corner" },
    ],
    note: "Reuses the Venture Artisan's Quarter painting — repurposed as a single workshop where the Perfectionist's Spectre lingers.",
  },
  {
    stage: 6,
    displayName: "The Harbour",
    boss: "Harbourmaster of Hesitation",
    mapPath: "/assets/maps-v2/golden-harbor/harbor-map.png",
    mapWidth: 1664,
    mapHeight: 1024,
    checkpoints: [
      { index: 0, x: 320, y: 650, label: "The Pier" },
      { index: 1, x: 900, y: 400, label: "The Anchor Post" },
      { index: 2, x: 1350, y: 760, label: "Ship Ready to Sail" },
    ],
    note: "Reuses the Venture Golden Harbour painting — same boss (Harbourmaster of Hesitation) as the Venture Launch stage. Release the work.",
  },
];

function MapCard({ map }: { map: MapDef }) {
  const has = map.mapPath !== "";
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="mb-3 flex items-baseline gap-3 flex-wrap">
        <span
          className="rounded bg-amber-500/20 px-2 py-0.5 font-mono text-xs font-bold text-amber-200"
          style={{ fontFamily: "var(--font-pixel-display), monospace" }}
        >
          STAGE {map.stage}
        </span>
        <h3 className="text-lg font-bold text-white">{map.displayName}</h3>
        <span className="text-xs text-white/50">Boss: {map.boss}</span>
        {has && (
          <span className="ml-auto text-[10px] font-mono text-white/30">
            {map.mapWidth}×{map.mapHeight} · {map.checkpoints.length} CP{map.checkpoints.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {map.warning && (
        <div className="mb-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          {map.warning}
        </div>
      )}
      {has ? (
        <div
          className="relative w-full overflow-hidden rounded-lg border border-white/10"
          style={{ backgroundColor: map.backdropColor ?? "#000" }}
        >
          {/* Aspect-ratio box keeps the map at its native proportions
              while the CP overlay's percentage positions stay accurate
              regardless of the container's actual pixel width. */}
          <div
            className="relative w-full"
            style={{ paddingTop: `${(map.mapHeight / map.mapWidth) * 100}%` }}
          >
            <img
              src={map.mapPath}
              alt={map.displayName}
              className="absolute inset-0 h-full w-full object-cover"
              style={{ imageRendering: "auto" }}
            />
            {/* Checkpoint markers — positioned as percentages so they
                scale with the container. */}
            {map.checkpoints.map((cp) => {
              const leftPct = (cp.x / map.mapWidth) * 100;
              const topPct = (cp.y / map.mapHeight) * 100;
              return (
                <div
                  key={cp.index}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                >
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-amber-300 bg-amber-500/80 font-mono text-sm font-black text-neutral-900 shadow-lg shadow-black/60">
                      {cp.index + 1}
                    </div>
                    <div className="mt-1 whitespace-nowrap rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-semibold text-amber-100">
                      {cp.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-white/10 bg-black/30">
          <p className="text-sm text-white/50">{map.note}</p>
        </div>
      )}

      {has && map.note && (
        <p className="mt-2 text-xs text-white/50">{map.note}</p>
      )}
      {has && (
        <p className="mt-2 text-[10px] font-mono text-white/30">{map.mapPath}</p>
      )}
    </div>
  );
}

export default function MapsGalleryPage() {
  return (
    <Suspense fallback={null}>
      <MapsGalleryPageInner />
    </Suspense>
  );
}

function MapsGalleryPageInner() {
  const search = useSearchParams();
  const bg = search?.get("bg") === "light"
    ? "bg-neutral-100 text-neutral-900"
    : "bg-neutral-950 text-white";

  return (
    <div className={`min-h-screen w-full p-6 sm:p-10 ${bg}`}>
      <header className="mb-8 max-w-6xl">
        <h1
          className="font-mono text-3xl font-black tracking-widest sm:text-4xl"
          style={{ fontFamily: "var(--font-pixel-display), monospace" }}
        >
          MAP GALLERY
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-white/60">
          Every painted stage biome in the venture arc, shown at native
          aspect ratio with checkpoint markers at their actual in-scene
          positions. Numbers on markers match the visit order the player
          walks through. Boss for each stage is called out in the header.
        </p>
        <p className="mt-1 text-xs text-white/40">
          Toggle backdrop: <code>?bg=light</code> · <code>?bg=dark</code> (default) ·
          Also see: <a href="/dev/bosses" className="text-amber-300 underline">/dev/bosses</a>
        </p>
      </header>

      <h2 className="mb-3 mt-2 font-mono text-xl font-bold tracking-widest text-amber-300">
        VENTURE TEMPLATE · 8 STAGES
      </h2>
      <div className="flex max-w-6xl flex-col gap-6">
        {MAPS.map((m) => (
          <MapCard key={`v-${m.stage}`} map={m} />
        ))}
      </div>

      <h2 className="mb-3 mt-12 font-mono text-xl font-bold tracking-widest text-sky-300">
        ACADEMIC TEMPLATE · 6 STAGES
      </h2>
      <p className="mb-4 max-w-3xl text-xs text-white/50">
        Fresh paintings from the LDtk delivery. Scene routing / free-roam
        gameplay not yet wired — this is preview-only for art review.
      </p>
      <div className="flex max-w-6xl flex-col gap-6">
        {ACADEMIC_MAPS.map((m) => (
          <MapCard key={`a-${m.stage}`} map={m} />
        ))}
      </div>

      <h2 className="mb-3 mt-12 font-mono text-xl font-bold tracking-widest text-emerald-300">
        LAB EXPERIMENT TEMPLATE · 7 STAGES
      </h2>
      <p className="mb-4 max-w-3xl text-xs text-white/50">
        Each stage is a fresh Lab paint — even the biomes that share a name
        with Academic (Library, Cartographer's Tower) or Venture
        (Crossroads) are independent Lab-tuned deliveries. Scene routing
        pending; preview-only for now.
      </p>
      <div className="flex max-w-6xl flex-col gap-6">
        {LAB_MAPS.map((m) => (
          <MapCard key={`l-${m.stage}`} map={m} />
        ))}
      </div>

      <h2 className="mb-3 mt-12 font-mono text-xl font-bold tracking-widest text-pink-300">
        CREATIVE TEMPLATE · 6 STAGES
      </h2>
      <p className="mb-4 max-w-3xl text-xs text-white/50">
        Reuses existing Venture / Academic paintings — no new art needed.
        CPs are re-anchored to Creative narrative beats. Scene routing
        pending; preview-only.
      </p>
      <div className="flex max-w-6xl flex-col gap-6">
        {CREATIVE_MAPS.map((m) => (
          <MapCard key={`c-${m.stage}`} map={m} />
        ))}
      </div>
    </div>
  );
}
