"use client";

/**
 * Test route for the HP-based Cross-Question Combat.
 *
 * Lists your ventures + checkpoints, lets you start a combat round on
 * any of them, and mounts the real CombatPanel. This is a temporary
 * entry point for QA — the production wiring lives behind the Advance
 * button on the checkpoint detail page (deferred follow-up task).
 */

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { CombatPanel } from "@/components/combat/CombatPanel";

export default function TestCombatPage() {
  const ventures = useQuery(api.ventures.getUserVentures, {});
  const startRound = useMutation(api.combat.startCombatRound);

  const [activeRound, setActiveRound] = useState<{
    roundId: Id<"combatRounds">;
    checkpointId: Id<"ventureCheckpoints">;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyCheckpoint, setBusyCheckpoint] = useState<string | null>(null);

  const startCombat = async (checkpointId: Id<"ventureCheckpoints">) => {
    setError(null);
    setBusyCheckpoint(checkpointId);
    try {
      const result = await startRound({ checkpointId });
      setActiveRound({ roundId: result.roundId, checkpointId });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyCheckpoint(null);
    }
  };

  if (activeRound) {
    return (
      <CombatPanel
        roundId={activeRound.roundId}
        checkpointId={activeRound.checkpointId}
        onAdvanceCheckpoint={() => setActiveRound(null)}
        onClose={() => setActiveRound(null)}
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6 text-white">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">AI Combat — Test Harness</h1>
        <p className="text-sm text-white/60">
          Pick any checkpoint below to launch a real HP-based combat round.
          Tasks should have at least one standard-task submission first so the
          AI has context to generate questions from.
        </p>
      </header>

      {error && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {ventures === undefined && (
        <div className="text-white/50">Loading your ventures…</div>
      )}

      {ventures && ventures.length === 0 && (
        <div className="rounded-md border border-white/10 bg-white/5 p-4 text-sm text-white/60">
          You don't have any ventures yet. Create one from the home screen first.
        </div>
      )}

      {ventures && ventures.length > 0 && (
        <div className="space-y-4">
          {ventures.map((v) => (
            <VentureSection
              key={v._id}
              ventureId={v._id}
              ventureName={(v as { name?: string }).name ?? "Untitled venture"}
              onStart={startCombat}
              busyCheckpoint={busyCheckpoint}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function VentureSection({
  ventureId,
  ventureName,
  onStart,
  busyCheckpoint,
}: {
  ventureId: Id<"ventures">;
  ventureName: string;
  onStart: (checkpointId: Id<"ventureCheckpoints">) => void;
  busyCheckpoint: string | null;
}) {
  const venture = useQuery(api.ventures.getVenture, { ventureId });
  if (venture === undefined) return null;
  if (venture === null) return null;

  const checkpoints = venture.checkpoints ?? [];
  if (checkpoints.length === 0) return null;

  return (
    <section className="rounded-lg border border-white/10 bg-white/5 p-4">
      <h2 className="mb-3 text-sm font-medium text-white">{ventureName}</h2>
      <ul className="space-y-1.5">
        {checkpoints.map((cp) => (
          <li
            key={cp._id}
            className="flex items-center justify-between gap-3 rounded-md border border-white/5 bg-black/30 px-3 py-2 text-xs"
          >
            <span className="text-white/70">
              Stage {cp.stage} · Checkpoint {cp.checkpoint}{" "}
              <span className="text-white/40">({cp.status})</span>
            </span>
            <button
              type="button"
              onClick={() => onStart(cp._id)}
              disabled={busyCheckpoint !== null}
              className="rounded border border-rose-400/40 bg-rose-500/15 px-3 py-1 text-rose-200 transition hover:bg-rose-500/25 disabled:opacity-40"
            >
              {busyCheckpoint === cp._id ? "Starting…" : "Start Combat"}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
