/**
 * AnimationDemo.tsx
 *
 * Interactive demo component for testing all checkpoint animations.
 * Provides UI controls to trigger each of the 6 animation patterns
 * with both standard (blue) and gold (amber) variants.
 *
 * @usage
 * Import and render this component in your dev environment to test animations:
 * ```tsx
 * import { AnimationDemo } from '@/lib/phaser/scenes/animations/AnimationDemo'
 *
 * function DevPage() {
 *   return <AnimationDemo />
 * }
 * ```
 */

"use client";

import React, { useState, useEffect } from "react";
import { eventBridge } from "@/lib/phaser/utils/event-bridge";

interface AnimationPattern {
  id: number;
  name: string;
  description: string;
  stages: number[];
  icon: string;
}

const ANIMATION_PATTERNS: AnimationPattern[] = [
  {
    id: 1,
    name: "Seal Break",
    description: "Ancient seal shatters with crack lines and particle burst",
    stages: [1, 8],
    icon: "🔓",
  },
  {
    id: 2,
    name: "Rune Inscription",
    description: "Mystical runes appear and glow with magical energy",
    stages: [2],
    icon: "✨",
  },
  {
    id: 3,
    name: "Beacon Lighting",
    description: "Light beam shoots upward with rising particles",
    stages: [3, 7],
    icon: "🔥",
  },
  {
    id: 4,
    name: "Bridge Repair",
    description: "Wooden planks assemble with rope attachments",
    stages: [4],
    icon: "🌉",
  },
  {
    id: 5,
    name: "Compass Calibration",
    description: "Compass needle spins and locks to North",
    stages: [5],
    icon: "🧭",
  },
  {
    id: 6,
    name: "Ward Placement",
    description: "Protective barriers form with shield activation",
    stages: [6],
    icon: "🛡️",
  },
];

export function AnimationDemo() {
  const [lastPlayed, setLastPlayed] = useState<string | null>(null);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(false);
  const [autoPlayInterval, setAutoPlayInterval] = useState(4000);
  const [currentAutoIndex, setCurrentAutoIndex] = useState(0);

  const playAnimation = (stage: number, variant: "standard" | "gold") => {
    eventBridge.dispatchToPhaser({
      type: "PLAY_CHECKPOINT_ANIMATION",
      checkpointId: "demo_checkpoint",
      stage,
      variant,
    });

    const pattern = ANIMATION_PATTERNS.find((p) => p.stages.includes(stage));
    setLastPlayed(
      `${pattern?.name} - ${variant === "gold" ? "Gold" : "Standard"} (S${stage})`,
    );
  };

  const playAllSequentially = () => {
    let delay = 0;
    ANIMATION_PATTERNS.forEach((pattern) => {
      const stage = pattern.stages[0];

      // Play standard variant
      setTimeout(() => playAnimation(stage, "standard"), delay);
      delay += 2500;

      // Play gold variant
      setTimeout(() => playAnimation(stage, "gold"), delay);
      delay += 3500;
    });
  };

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlayEnabled) return;

    const allStages: Array<{ stage: number; variant: "standard" | "gold" }> = [
      ...ANIMATION_PATTERNS.flatMap((p) =>
        p.stages.map((stage) => ({ stage, variant: "standard" as const })),
      ),
      ...ANIMATION_PATTERNS.flatMap((p) =>
        p.stages.map((stage) => ({ stage, variant: "gold" as const })),
      ),
    ];

    const interval = setInterval(() => {
      const current = allStages[currentAutoIndex];
      if (current) {
        playAnimation(current.stage, current.variant);
      }
      setCurrentAutoIndex((prev) => (prev + 1) % allStages.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlayEnabled, currentAutoIndex, autoPlayInterval]);

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 rounded-lg border border-slate-700 bg-slate-900 p-4 shadow-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">🎬 Animation Demo</h2>
        <button
          onClick={() => setAutoPlayEnabled(!autoPlayEnabled)}
          className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
            autoPlayEnabled
              ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {autoPlayEnabled ? "⏸ Stop" : "▶ Auto"}
        </button>
      </div>

      {lastPlayed && (
        <div className="mb-3 rounded bg-slate-800 p-2 text-xs text-green-400">
          <span className="font-semibold">Last played:</span> {lastPlayed}
        </div>
      )}

      <div className="mb-3 space-y-2">
        <button
          onClick={playAllSequentially}
          className="w-full rounded bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700"
        >
          🎭 Play All (Sequential)
        </button>
      </div>

      <div className="mb-4 space-y-2">
        <label className="text-xs text-slate-400">
          Auto-play Interval: {autoPlayInterval}ms
        </label>
        <input
          type="range"
          min="2000"
          max="8000"
          step="500"
          value={autoPlayInterval}
          onChange={(e) => setAutoPlayInterval(Number(e.target.value))}
          className="w-full"
          disabled={autoPlayEnabled}
        />
      </div>

      <div className="max-h-96 space-y-3 overflow-y-auto pr-2">
        {ANIMATION_PATTERNS.map((pattern) => (
          <div
            key={pattern.id}
            className="rounded-lg border border-slate-700 bg-slate-800 p-3"
          >
            <div className="mb-2 flex items-start justify-between">
              <div className="flex-1">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                  <span className="text-lg">{pattern.icon}</span>
                  {pattern.name}
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  {pattern.description}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Stages: {pattern.stages.join(", ")}
                </p>
              </div>
            </div>

            <div className="mt-2 flex gap-2">
              <button
                onClick={() => playAnimation(pattern.stages[0], "standard")}
                className="flex-1 rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
              >
                💙 Standard (2s)
              </button>
              <button
                onClick={() => playAnimation(pattern.stages[0], "gold")}
                className="flex-1 rounded bg-amber-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-700"
              >
                ⭐ Gold (3s)
              </button>
            </div>

            {pattern.stages.length > 1 && (
              <div className="mt-2 flex gap-2">
                {pattern.stages.slice(1).map((stage) => (
                  <button
                    key={stage}
                    onClick={() => playAnimation(stage, "standard")}
                    className="flex-1 rounded bg-slate-700 px-2 py-1 text-xs text-slate-300 transition-colors hover:bg-slate-600"
                  >
                    S{stage}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 rounded bg-slate-800 p-3">
        <h4 className="mb-2 text-xs font-semibold text-slate-300">
          ⌨️ Keyboard Shortcuts
        </h4>
        <ul className="space-y-1 text-xs text-slate-400">
          <li>
            <code className="rounded bg-slate-700 px-1 py-0.5">ESC</code> - Skip
            animation (after 500ms)
          </li>
          <li>
            <code className="rounded bg-slate-700 px-1 py-0.5">Click</code> -
            Skip animation (after 500ms)
          </li>
        </ul>
      </div>

      <div className="mt-3 rounded bg-blue-900/30 p-2 text-xs text-blue-300">
        <strong>Note:</strong> Animations play at center of active checkpoint.
        Ensure WorldMapScene is loaded.
      </div>
    </div>
  );
}

/**
 * Compact version for embedding in dev tools
 */
export function AnimationDemoCompact() {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-4 right-4 z-50 rounded-full bg-purple-600 p-4 text-2xl shadow-lg transition-transform hover:scale-110"
        title="Open Animation Demo"
      >
        🎬
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsExpanded(false)}
        className="absolute -right-2 -top-2 z-50 rounded-full bg-red-600 p-2 text-white shadow-lg hover:bg-red-700"
        title="Close"
      >
        ✕
      </button>
      <AnimationDemo />
    </div>
  );
}
