"use client";

/**
 * /dev/corruption — Corruption-overlay gallery for client review.
 *
 * Renders every corruption profile the game ships (12 super-boss + 27
 * stage-monster) as a tile swatch, with each swatch shown across the
 * 5 corruption-phase opacities (calm → creeping → desaturated →
 * urgent → critical). Mirrors /dev/bosses in spirit: one URL the
 * client can open to review the entire model at a glance.
 *
 * Not linked from anywhere in-product — share the link directly.
 */

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  SUPER_BOSS_CORRUPTION_PROFILES,
  STAGE_BOSS_CORRUPTION_PROFILES,
  type CorruptionProfile,
} from "@/config/bossCorruptionProfiles";
import { CorruptionOverlayCanvas } from "@/components/corruption/CorruptionOverlayCanvas";

// Five corruption phases the runtime engine uses (map/world/page.tsx).
// Values are the opacities the CorruptionViewportWash applies at each
// tier — the same numbers the map uses in production.
// Keep this ladder in sync with map/world/page.tsx opacityByPhase.
// Bumped 2026-08-16 to match the denser production wash.
const PHASES = [
  { key: "calm",         label: "Calm",         range: "0–24",   opacity: 0.35 },
  { key: "creeping",     label: "Creeping",     range: "25–49",  opacity: 0.45 },
  { key: "desaturated",  label: "Desaturated",  range: "50–74",  opacity: 0.55 },
  { key: "urgent",       label: "Urgent",       range: "75–89",  opacity: 0.65 },
  { key: "critical",     label: "Critical",     range: "90–100", opacity: 0.75 },
] as const;

type SectionId = "super-pool" | "stage-bosses";

const SECTIONS: {
  id: SectionId;
  title: string;
  subtitle: string;
  accent: string;
  profiles: readonly (CorruptionProfile & { templateId?: string; stage?: number })[];
}[] = [
  {
    id: "super-pool",
    title: "SUPER-BOSS POOL · 12 PROJECT-SCOPED VILLAINS",
    subtitle:
      "One randomly assigned per venture at creation. Renders as the viewport-wash tint over the whole map when corruption is high.",
    accent: "text-pink-300",
    profiles: SUPER_BOSS_CORRUPTION_PROFILES,
  },
  {
    id: "stage-bosses",
    title: "STAGE MONSTERS · 27 (VENTURE 8 · ACADEMIC 6 · LAB 7 · CREATIVE 6)",
    subtitle:
      "One per template × stage — swap in when the player enters that stage's biome. Each renders as the per-CP tile and the biome-band overlay.",
    accent: "text-sky-300",
    profiles: STAGE_BOSS_CORRUPTION_PROFILES,
  },
];

export default function DevCorruptionPage() {
  const [bg, setBg] = useState<"dark" | "light">("dark");
  // View mode — grid (default swatch cards) or list (one boss per row,
  // 5 phases inline). Product ask 2026-08-20: "generate me a direct
  // link to see the corruption model of all maps line wise" →
  // ?view=list renders the compact single-line view.
  //
  // MUST default to "grid" on both server + client render passes,
  // otherwise the SSR HTML differs from the first client render and
  // React throws a hydration mismatch (turbopack red-screen). The
  // URL param is read post-hydration inside the effect below, which
  // is safe.
  const [view, setView] = useState<"grid" | "list">("grid");
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (
      new URLSearchParams(window.location.search).get("view") === "list"
    ) {
      setView("list");
    }
  }, []);
  const bgColor = bg === "dark" ? "#111017" : "#f4f2ee";
  const textPrimary = bg === "dark" ? "text-white" : "text-black";
  const textMuted = bg === "dark" ? "text-white/60" : "text-black/60";
  const cardBg = bg === "dark" ? "bg-black/40" : "bg-white/70";
  const border = bg === "dark" ? "border-white/10" : "border-black/10";

  const totalProfiles = useMemo(
    () =>
      SUPER_BOSS_CORRUPTION_PROFILES.length +
      STAGE_BOSS_CORRUPTION_PROFILES.length,
    [],
  );

  return (
    <main
      className={`min-h-screen w-full ${textPrimary}`}
      style={{ backgroundColor: bgColor, fontFamily: "system-ui, sans-serif" }}
    >
      {/* Header */}
      <header className={`sticky top-0 z-10 border-b ${border} backdrop-blur`}
        style={{ backgroundColor: `${bgColor}dd` }}>
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-baseline justify-between gap-3 px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Corruption Overlay Model
            </h1>
            <p className={`text-xs ${textMuted}`}>
              {totalProfiles} profiles · 14 procedural patterns · 5 phase tiers ·
              spec-locked to the client reference sheet (2026-08-14)
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className={textMuted}>View</span>
            <div className={`inline-flex overflow-hidden rounded-md border ${border}`}>
              <button
                type="button"
                onClick={() => setView("grid")}
                className={`px-3 py-1 ${view === "grid" ? (bg === "dark" ? "bg-white text-black" : "bg-black text-white") : ""}`}
              >
                Grid
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                className={`px-3 py-1 ${view === "list" ? (bg === "dark" ? "bg-white text-black" : "bg-black text-white") : ""}`}
              >
                Line
              </button>
            </div>
            <span className={textMuted}>Bg</span>
            <div className={`inline-flex overflow-hidden rounded-md border ${border}`}>
              <button
                type="button"
                onClick={() => setBg("dark")}
                className={`px-3 py-1 ${bg === "dark" ? "bg-white text-black" : ""}`}
              >
                Dark
              </button>
              <button
                type="button"
                onClick={() => setBg("light")}
                className={`px-3 py-1 ${bg === "light" ? "bg-black text-white" : ""}`}
              >
                Light
              </button>
            </div>
            <Link
              href="/dev/bosses"
              className={`underline underline-offset-4 ${textMuted}`}
            >
              → /dev/bosses
            </Link>
          </div>
        </div>
        {/* Phase legend — the 5 opacity tiers each tile is rendered at. */}
        <div className={`mx-auto flex max-w-[1400px] items-center gap-6 border-t ${border} px-6 py-2 text-[11px]`}>
          <span className={textMuted}>Phase → opacity</span>
          {PHASES.map((p) => (
            <span key={p.key} className={textMuted}>
              <span className={textPrimary}>{p.label}</span>{" "}
              <span className="opacity-60">
                (corruption {p.range} · opacity {p.opacity})
              </span>
            </span>
          ))}
        </div>
      </header>

      {/* Sections */}
      <div className="mx-auto max-w-[1400px] px-6 py-8 space-y-12">
        {SECTIONS.map((section) => (
          <section key={section.id} id={section.id}>
            <div className="mb-4">
              <h2 className={`text-sm font-semibold tracking-widest ${section.accent}`}>
                {section.title}
              </h2>
              <p className={`mt-1 text-xs ${textMuted}`}>{section.subtitle}</p>
            </div>

            {view === "list" ? (
              // ── LINE-WISE VIEW ─────────────────────────────────────
              // One boss per row: template · stage · name · pattern ·
              // color swatch · meta blurb · 5 phase tiles inline.
              // Compact enough to scan the whole model in one screen.
              <div className={`overflow-hidden rounded-lg border ${border} ${cardBg}`}>
                <div className={`grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-x-4 border-b ${border} px-4 py-2 text-[10px] uppercase tracking-widest ${textMuted}`}>
                  <span>Scope</span>
                  <span>Boss · Theme</span>
                  <span>Pattern</span>
                  <span>Color</span>
                  <span>Phases (calm → critical)</span>
                </div>
                {section.profiles.map((profile) => {
                  const scopeKey =
                    "templateId" in profile && profile.templateId
                      ? `${profile.templateId}:s${profile.stage}`
                      : "super";
                  const scopeLabel =
                    "templateId" in profile && profile.templateId
                      ? `${profile.templateId} · s${profile.stage}`
                      : "super-pool";
                  return (
                    <div
                      key={`row:${scopeKey}:${profile.slug}`}
                      className={`grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-x-4 border-b ${border} px-4 py-2 text-xs last:border-b-0`}
                    >
                      <span className={`font-mono text-[10px] ${textMuted} min-w-[120px]`}>
                        {scopeLabel}
                      </span>
                      <span className="min-w-0">
                        <span className={`font-semibold ${textPrimary}`}>{profile.label}</span>
                        <span className={`ml-2 ${textMuted}`}>· {profile.meta}</span>
                      </span>
                      <span className={`font-mono text-[10px] rounded px-1.5 py-0.5 ${textMuted}`} style={{ backgroundColor: bg === "dark" ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.05)" }}>
                        {profile.pattern}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span
                          className={`inline-block h-3 w-3 rounded border ${border}`}
                          style={{ backgroundColor: profile.color }}
                          aria-hidden
                        />
                        <span className={`font-mono text-[10px] ${textMuted}`}>{profile.color}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        {PHASES.map((phase) => (
                          <span
                            key={phase.key}
                            className={`overflow-hidden rounded border ${border}`}
                            style={{ width: 36, height: 36 }}
                            title={`${phase.label} (${phase.range}, opacity ${phase.opacity})`}
                          >
                            <CorruptionOverlayCanvas
                              profile={profile}
                              size={36}
                              opacity={phase.opacity}
                              bg={bgColor}
                              className="block"
                            />
                          </span>
                        ))}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {section.profiles.map((profile) => {
                const scopeKey =
                  "templateId" in profile && profile.templateId
                    ? `${profile.templateId}:s${profile.stage}`
                    : "super";
                return (
                  <article
                    key={`${scopeKey}:${profile.slug}`}
                    className={`rounded-lg border ${border} ${cardBg} p-3`}
                  >
                    {/* Boss label + meta */}
                    <header className="mb-2 flex items-baseline justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold">
                          {profile.label}
                        </h3>
                        <p className={`truncate text-[11px] ${textMuted}`}>
                          {profile.meta}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-mono ${textMuted}`}
                        style={{
                          backgroundColor:
                            bg === "dark" ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.05)",
                        }}
                      >
                        {profile.pattern}
                      </span>
                    </header>

                    {/* Meta line: slug + template/stage tag */}
                    <div
                      className={`mb-3 flex items-center justify-between font-mono text-[10px] ${textMuted}`}
                    >
                      <span className="truncate">{profile.slug}</span>
                      {"templateId" in profile && profile.templateId ? (
                        <span>
                          {profile.templateId} · stage {profile.stage}
                        </span>
                      ) : (
                        <span>super-pool</span>
                      )}
                    </div>

                    {/* 5-phase strip — one tile per phase */}
                    <div className="grid grid-cols-5 gap-1.5">
                      {PHASES.map((phase) => (
                        <figure key={phase.key} className="flex flex-col items-center gap-1">
                          <div
                            className={`overflow-hidden rounded border ${border}`}
                            style={{ width: 56, height: 56 }}
                          >
                            <CorruptionOverlayCanvas
                              profile={profile}
                              size={56}
                              opacity={phase.opacity}
                              bg={bgColor}
                              className="block"
                            />
                          </div>
                          <figcaption
                            className={`text-[9px] tracking-wider ${textMuted}`}
                          >
                            {phase.label.toUpperCase()}
                          </figcaption>
                        </figure>
                      ))}
                    </div>

                    {/* Color swatch — spec tint the pattern is drawn in */}
                    <div className="mt-3 flex items-center gap-2">
                      <span
                        className={`inline-block h-3 w-3 rounded border ${border}`}
                        style={{ backgroundColor: profile.color }}
                        aria-hidden
                      />
                      <span className={`font-mono text-[10px] ${textMuted}`}>
                        {profile.color}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
            )}
          </section>
        ))}
      </div>

      {/* Footer note */}
      <footer className={`mx-auto max-w-[1400px] border-t ${border} px-6 py-6 text-[11px] ${textMuted}`}>
        <p>
          Renderer: <code>src/components/corruption/CorruptionOverlayCanvas.tsx</code>{" "}
          · Data: <code>src/config/bossCorruptionProfiles.ts</code> · Consumed live by{" "}
          <code>src/app/map/world/page.tsx</code> via{" "}
          <code>getStageCorruptionProfile()</code> and{" "}
          <code>CorruptionViewportWash</code>.
        </p>
      </footer>
    </main>
  );
}
