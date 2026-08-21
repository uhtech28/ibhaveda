"use client";

/**
 * /dev/paint-zones — Standalone blocker painter for Academic / Lab /
 * Creative maps (which don't have dedicated Phaser scenes yet).
 *
 * UI: template + stage dropdowns. On selection change, spins up a
 * fresh Phaser game with just the picked map + zone editor. HUD is
 * provided by zoneEditor (top-right: count, copy JSON, clear, close).
 *
 * The URL keeps ?editZones=1 baked in so zoneEditor auto-activates.
 * Blockers persist per-map in localStorage under
 * `ibhaveda-zones-<templateId>-stage<N>`.
 *
 * Not linked from anywhere — dev tool only. Send yourself
 * `/dev/paint-zones` directly.
 */

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface MapDef {
  stage: number;
  name: string;
  mapPath: string;
  mapWidth: number;
  mapHeight: number;
}

type TemplateId = "academic" | "lab" | "creative" | "venture";

const ACADEMIC: MapDef[] = [
  { stage: 1, name: "The Ancient Library",       mapPath: "/assets/maps-v2/academic/library-map.png",             mapWidth: 1540, mapHeight: 1156 },
  { stage: 2, name: "The Ruins",                 mapPath: "/assets/maps-v2/academic/ruins-map.png",               mapWidth: 1540, mapHeight: 1156 },
  { stage: 3, name: "The Cartographer's Tower",  mapPath: "/assets/maps-v2/academic/cartographer-tower-map.png",  mapWidth: 1412, mapHeight: 1156 },
  { stage: 4, name: "The Scriptorium",           mapPath: "/assets/maps-v2/academic/scriptorium-map.png",         mapWidth: 1156, mapHeight: 1412 },
  { stage: 5, name: "The Council Chamber",       mapPath: "/assets/maps-v2/academic/council-chamber-map.png",     mapWidth: 1412, mapHeight: 1156 },
  { stage: 6, name: "The Grand Archive",         mapPath: "/assets/maps-v2/academic/grand-archive-map.png",       mapWidth: 1412, mapHeight: 1156 },
];

const LAB: MapDef[] = [
  { stage: 1, name: "The Observatory",              mapPath: "/assets/maps-v2/lab/observatory-map.png",              mapWidth: 1412, mapHeight: 1156 },
  { stage: 2, name: "The Ancient Library (Lab)",    mapPath: "/assets/maps-v2/lab/library-map.png",                  mapWidth: 1284, mapHeight: 1156 },
  { stage: 3, name: "The Cartographer's Tower (Lab)", mapPath: "/assets/maps-v2/lab/cartographer-tower-map.png",     mapWidth: 1412, mapHeight: 1156 },
  { stage: 4, name: "The Forge",                    mapPath: "/assets/maps-v2/lab/forge-map.png",                    mapWidth: 1412, mapHeight: 1156 },
  { stage: 5, name: "The Alchemist's Laboratory",   mapPath: "/assets/maps-v2/lab/alchemists-laboratory-map.png",    mapWidth: 1412, mapHeight: 1028 },
  { stage: 6, name: "The Crossroads Town (Lab)",    mapPath: "/assets/maps-v2/lab/crossroads-map.png",               mapWidth: 1412, mapHeight: 1156 },
  { stage: 7, name: "The Grand Hall",               mapPath: "/assets/maps-v2/lab/grand-hall-map.png",               mapWidth: 1412, mapHeight: 1156 },
];

const CREATIVE: MapDef[] = [
  { stage: 1, name: "The Sacred Grove",         mapPath: "/assets/maps-v2/forest/forest-map.png",           mapWidth: 1412, mapHeight: 1156 },
  { stage: 2, name: "The Gallery of Echoes",    mapPath: "/assets/maps-v2/academic/grand-archive-map.png",  mapWidth: 1412, mapHeight: 1156 },
  { stage: 3, name: "The Wilderness",           mapPath: "/assets/maps-v2/forest/forest-map.png",           mapWidth: 1412, mapHeight: 1156 },
  { stage: 4, name: "The Village Square",       mapPath: "/assets/maps-v2/village-painted/village-map.png", mapWidth: 1536, mapHeight: 1024 },
  { stage: 5, name: "The Artisan's Workshop",   mapPath: "/assets/maps-v2/artisans/artisans-map.png",       mapWidth: 1536, mapHeight: 1152 },
  { stage: 6, name: "The Harbour",              mapPath: "/assets/maps-v2/golden-harbor/harbor-map.png",    mapWidth: 1664, mapHeight: 1024 },
];

const MAPS: Record<Exclude<TemplateId, "venture">, MapDef[]> = {
  academic: ACADEMIC,
  lab: LAB,
  creative: CREATIVE,
};

const TEMPLATE_LABEL: Record<Exclude<TemplateId, "venture">, string> = {
  academic: "Academic",
  lab: "Lab Experiment",
  creative: "Creative",
};

export default function PaintZonesPage() {
  return (
    <Suspense fallback={null}>
      <PaintZonesPageInner />
    </Suspense>
  );
}

function PaintZonesPageInner() {
  const router = useRouter();
  const search = useSearchParams();
  const templateId = (search.get("template") ?? "academic") as Exclude<TemplateId, "venture">;
  const stage = Number(search.get("stage") ?? "1");

  const maps = MAPS[templateId] ?? MAPS.academic;
  const currentMap = maps.find((m) => m.stage === stage) ?? maps[0];

  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<import("phaser").Game | null>(null);
  const [loading, setLoading] = useState(true);

  // Ensure ?editZones=1 is always present so the editor activates.
  useEffect(() => {
    if (search.get("editZones") !== "1") {
      const params = new URLSearchParams(search.toString());
      params.set("editZones", "1");
      if (!params.get("template")) params.set("template", "academic");
      if (!params.get("stage")) params.set("stage", "1");
      router.replace(`/dev/paint-zones?${params.toString()}`);
    }
  }, [search, router]);

  // Boot / rebuild Phaser whenever the selected map changes.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      const [{ default: Phaser }, { createPaintZoneScene }] = await Promise.all([
        import("phaser"),
        import("@/lib/phaser/scenes/PaintZoneScene"),
      ]);
      if (cancelled || !containerRef.current) return;

      // Tear down any existing game first so a fresh scene runs.
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }

      const mapKey = `paint-${templateId}-stage${stage}`;
      const storageKey = `${templateId}-stage${stage}`;
      const SceneCls = createPaintZoneScene({
        mapKey,
        mapPath: currentMap.mapPath,
        mapWidth: currentMap.mapWidth,
        mapHeight: currentMap.mapHeight,
        storageKey,
      });

      gameRef.current = new Phaser.Game({
        type: Phaser.AUTO,
        parent: containerRef.current,
        width: window.innerWidth,
        height: window.innerHeight - 64,
        backgroundColor: "#1a1a1a",
        scale: { mode: Phaser.Scale.RESIZE },
        scene: [SceneCls as unknown as typeof Phaser.Scene],
        pixelArt: true,
      });
      setLoading(false);
    })();

    return () => {
      cancelled = true;
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [templateId, stage, currentMap.mapPath, currentMap.mapWidth, currentMap.mapHeight]);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(search.toString());
    params.set(key, value);
    params.set("editZones", "1");
    router.replace(`/dev/paint-zones?${params.toString()}`);
  };

  const templateOptions = useMemo(
    () => (Object.keys(TEMPLATE_LABEL) as (keyof typeof TEMPLATE_LABEL)[]),
    [],
  );

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="flex items-center gap-3 border-b border-white/10 bg-neutral-900 px-4 py-3">
        <h1 className="mr-4 font-mono text-sm font-bold tracking-wide">
          PAINT ZONES
        </h1>

        <label className="text-xs uppercase tracking-wider text-white/60">
          Template
        </label>
        <select
          value={templateId}
          onChange={(e) => {
            const t = e.target.value as Exclude<TemplateId, "venture">;
            const params = new URLSearchParams();
            params.set("template", t);
            params.set("stage", "1");
            params.set("editZones", "1");
            router.replace(`/dev/paint-zones?${params.toString()}`);
          }}
          className="rounded border border-white/10 bg-neutral-800 px-2 py-1 text-sm"
        >
          {templateOptions.map((t) => (
            <option key={t} value={t}>
              {TEMPLATE_LABEL[t]}
            </option>
          ))}
        </select>

        <label className="ml-4 text-xs uppercase tracking-wider text-white/60">
          Stage
        </label>
        <select
          value={stage}
          onChange={(e) => updateParam("stage", e.target.value)}
          className="rounded border border-white/10 bg-neutral-800 px-2 py-1 text-sm"
        >
          {maps.map((m) => (
            <option key={m.stage} value={m.stage}>
              Stage {m.stage} · {m.name}
            </option>
          ))}
        </select>

        <div className="ml-4 font-mono text-xs text-white/50">
          {currentMap.mapWidth}×{currentMap.mapHeight} · key{" "}
          <span className="text-cyan-300">
            ibhaveda-zones-{templateId}-stage{stage}
          </span>
        </div>

        <div className="ml-auto text-xs text-white/60">
          Left-drag = draw · Right-drag = pan · Del = delete selected ·
          WASD = pan
        </div>
      </div>

      <div ref={containerRef} className="relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-white/60">
            Loading map…
          </div>
        )}
      </div>
    </div>
  );
}
