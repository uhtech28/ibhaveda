"use client";

/**
 * /dev/icons — Preview all sliced UI pixel icons.
 * Verify the alpha-cut worked and each icon is centered before wiring
 * them into the sidebar / task panel / contribution flow.
 */

import Image from "next/image";

const GROUPS: {
  title: string;
  accent: string;
  icons: { name: string; role: string }[];
}[] = [
  {
    title: "QUESTS",
    accent: "text-amber-300",
    icons: [
      { name: "quest-scroll-open", role: "Task — open" },
      { name: "quest-scroll-sealed", role: "Task — completed" },
    ],
  },
  {
    title: "NAVIGATION",
    accent: "text-sky-300",
    icons: [
      { name: "map-scroll-x", role: "Stage marker" },
      { name: "map-region", role: "World Map nav" },
    ],
  },
  {
    title: "RECORDS",
    accent: "text-purple-300",
    icons: [{ name: "journal", role: "Feed / My Ventures" }],
  },
  {
    title: "INVENTORY",
    accent: "text-orange-300",
    icons: [
      { name: "saddlebag-satchel", role: "Menu quick-open" },
      { name: "saddlebag-backpack", role: "Settings / full menu" },
    ],
  },
  {
    title: "TIME",
    accent: "text-yellow-300",
    icons: [
      { name: "hourglass-blue", role: "Safe timer / normal" },
      { name: "hourglass-red", role: "Urgent / expiring" },
    ],
  },
  {
    title: "MAGIC — CRYSTAL BALL (4 STATES)",
    accent: "text-purple-400",
    icons: [
      { name: "crystal-ball-purple", role: "Chat default" },
      { name: "crystal-ball-green", role: "Chat — new msgs" },
      { name: "crystal-ball-blue", role: "Chat — busy" },
      { name: "crystal-ball-cyan", role: "Chat — muted" },
    ],
  },
  {
    title: "TASKS",
    accent: "text-cyan-300",
    icons: [{ name: "rune-stone", role: "Kanban / task board" }],
  },
  {
    title: "GUILD & KINGDOM — 4 CRESTS",
    accent: "text-amber-400",
    icons: [
      { name: "guild-crest-red-wolf", role: "Crest option 1" },
      { name: "guild-crest-gold-eagle", role: "Crest option 2" },
      { name: "guild-crest-wooden-round", role: "Crest option 3" },
      { name: "guild-crest-blue-swords", role: "Crest option 4" },
    ],
  },
  {
    title: "CRAFTING — CONTRIBUTION 4-STATE LIFECYCLE",
    accent: "text-green-300",
    icons: [
      { name: "hammer", role: "CTA — start contribution" },
      { name: "anvil-forge", role: "Contribution in progress" },
      { name: "scroll-pending", role: "Submitted — awaiting review" },
      { name: "scroll-approved", role: "Approved / merged" },
    ],
  },
];

export default function IconsPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 font-mono text-2xl font-bold text-amber-300">
          UI ICONS · sliced from 2D GAME SYMBOL REFERENCE
        </h1>
        <p className="mb-8 text-sm text-white/60">
          22 icons at 128×128 with alpha-cut transparency. Files under{" "}
          <code className="rounded bg-black/50 px-1">
            /public/assets/ui/icons/
          </code>
          . Verify each icon is centered, cleanly cut, and reads at small
          size before wiring them into the sidebar / task list / etc.
        </p>

        {GROUPS.map((g) => (
          <section key={g.title} className="mb-10">
            <h2
              className={`mb-4 font-mono text-sm font-bold uppercase tracking-wider ${g.accent}`}
            >
              {g.title}
            </h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
              {g.icons.map((ic) => (
                <div
                  key={ic.name}
                  className="rounded-lg border border-white/10 bg-white/[0.02] p-3"
                >
                  <div className="mb-2 flex h-32 items-center justify-center overflow-hidden rounded bg-neutral-900/60">
                    <Image
                      src={`/assets/ui/icons/${ic.name}.png`}
                      alt={ic.name}
                      width={96}
                      height={96}
                      style={{ imageRendering: "pixelated" }}
                    />
                  </div>
                  <div className="font-mono text-xs text-white/70">
                    {ic.name}
                  </div>
                  <div className="mt-1 text-xs text-white/50">{ic.role}</div>
                </div>
              ))}
            </div>
          </section>
        ))}

        <section className="mt-12 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
          <h3 className="mb-2 font-mono text-sm font-bold text-amber-300">
            NEXT STEPS
          </h3>
          <ol className="ml-5 list-decimal space-y-1 text-sm text-white/70">
            <li>
              If any icon looks wrong (miscropped, hard edges, wrong alpha),
              tell me which one and I'll re-slice.
            </li>
            <li>
              Pick a Phase 1 rollout: sidebar swap OR contribution
              4-state OR checkpoint task icons.
            </li>
            <li>
              I'll build a shared <code>&lt;PixelIcon name=&quot;...&quot;&nbsp;/&gt;</code>{" "}
              component so every reuse is one line.
            </li>
          </ol>
        </section>
      </div>
    </div>
  );
}
