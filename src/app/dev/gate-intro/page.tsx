"use client";

/**
 * Dev preview: /dev/gate-intro
 *
 * Renders GateOfIbhavedaIntroV2 in isolation so we can review the
 * cinematic before wiring it into the real signup flow. Provides:
 *   - Replay button (remounts the component with a fresh key)
 *   - Beat log strip on the right so we can see cue timings fire live
 *   - Total-runtime slider so we can preview faster iterations
 *
 * The V2 component is NOT wired into profile-setup or anywhere else
 * in the app yet — only mounted here. Do that swap when the user
 * approves.
 */

import { useCallback, useState } from "react";
import {
  GateOfIbhavedaIntroV2,
  type GateIntroBeat,
} from "@/components/onboarding/GateOfIbhavedaIntroV2";

export default function GateIntroDevPreview() {
  const [runId, setRunId] = useState(0);
  const [runtimeMs, setRuntimeMs] = useState(23_600);
  const [log, setLog] = useState<{ t: number; beat: GateIntroBeat }[]>([]);
  const [done, setDone] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  const handleBeat = useCallback(
    (b: GateIntroBeat) => {
      const now = performance.now();
      const t = startedAt == null ? 0 : now - startedAt;
      if (startedAt == null) setStartedAt(now);
      setLog((prev) => [...prev, { t, beat: b }]);
    },
    [startedAt],
  );

  const handleDone = useCallback(() => {
    setDone(true);
  }, []);

  const replay = () => {
    setLog([]);
    setDone(false);
    setStartedAt(null);
    setRunId((n) => n + 1);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Controls bar */}
      <div className="sticky top-0 z-[10001] flex flex-wrap items-center gap-3 border-b border-white/10 bg-black/80 px-4 py-3 backdrop-blur">
        <h1 className="mr-4 text-sm font-semibold uppercase tracking-widest text-white/70">
          Gate Intro V2 — Preview
        </h1>
        <button
          type="button"
          onClick={replay}
          className="rounded-md border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-white hover:border-white/40 hover:bg-white/10"
        >
          Replay
        </button>
        <label className="flex items-center gap-2 text-xs text-white/70">
          Runtime:
          <input
            type="range"
            min={8_000}
            max={30_000}
            step={500}
            value={runtimeMs}
            onChange={(e) => setRuntimeMs(Number(e.target.value))}
            className="w-40"
          />
          <span className="font-mono tabular-nums text-white">
            {(runtimeMs / 1000).toFixed(1)}s
          </span>
        </label>
        <span className="ml-auto text-[10px] uppercase tracking-widest text-white/40">
          {done ? "Dismissed" : "Playing…"}
        </span>
      </div>

      {/* Stage — the cinematic mounts here as a fixed overlay */}
      <div className="relative min-h-[calc(100vh-56px)]">
        <GateOfIbhavedaIntroV2
          key={runId}
          onDone={handleDone}
          onBeat={handleBeat}
          totalRuntimeMs={runtimeMs}
        />

        {/* Beat log — shown after dismiss so it doesn't cover the cinematic */}
        {done && (
          <div className="mx-auto max-w-2xl p-6">
            <h2 className="mb-3 text-lg font-semibold">Beat log</h2>
            <ol className="rounded-lg border border-white/10 bg-white/5 p-4">
              {log.length === 0 && (
                <li className="text-sm text-white/60">
                  No beats captured — replay the cinematic.
                </li>
              )}
              {log.map((row, i) => {
                const prev = i === 0 ? 0 : log[i - 1].t;
                const delta = row.t - prev;
                return (
                  <li
                    key={i}
                    className="flex items-center gap-3 border-b border-white/5 py-1.5 text-sm last:border-b-0"
                  >
                    <span className="w-16 shrink-0 font-mono tabular-nums text-white/60">
                      {(row.t / 1000).toFixed(2)}s
                    </span>
                    <span className="w-16 shrink-0 font-mono tabular-nums text-white/40">
                      +{(delta / 1000).toFixed(2)}s
                    </span>
                    <span className="font-mono text-amber-300">
                      {row.beat}
                    </span>
                  </li>
                );
              })}
            </ol>
            <p className="mt-4 text-xs text-white/50">
              Target timings from brief: 2.3 · 3.9 · 5.5 · 9.5 · 11.5 · 13.7 ·
              17.5 · 23.6s
            </p>
            <button
              type="button"
              onClick={replay}
              className="mt-4 rounded-md border border-amber-400/40 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-300 hover:border-amber-400/70 hover:bg-amber-500/20"
            >
              Replay ▸
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
