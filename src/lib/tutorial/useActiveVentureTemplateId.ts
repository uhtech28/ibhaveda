"use client";

/**
 * @file useActiveVentureTemplateId.ts
 * @description Resolves the templateId of the user's active venture from
 *   whichever source is currently populated:
 *
 *     1. The Jotai `activeVentureAtom` — populated only while the user
 *        is on the map surface. When the user is on `/feed` or elsewhere
 *        this atom is null.
 *     2. Convex `getUserVentures` query — always available for signed-in
 *        users, so it covers the /feed step of the tutorial where the
 *        atom hasn't been hydrated.
 *
 *   Returns `null` for signed-out users, users who haven't created a
 *   venture yet, or during the query's first render tick. Callers pass
 *   the result to `resolveTutorialCopy(templateId)` — that helper
 *   falls back to the Venture vocabulary on null, so the tutorial
 *   never renders a blank Sparky bubble waiting for this hook.
 *
 *   Priority favours the atom because it reflects the venture the user
 *   is actively looking at on the map (which may not be the most
 *   recently created one). When the atom is empty we prefer the most
 *   recently updated venture from Convex — that's the same "active
 *   venture" heuristic map/world/page.tsx uses.
 */

import { useMemo } from "react";
import { useAtomValue } from "jotai";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { activeVentureAtom } from "@/lib/stores/hudStore";
import type { TemplateId } from "@/config/templates/templateTypes";

export function useActiveVentureTemplateId(): TemplateId | null {
  const atomVenture = useAtomValue(activeVentureAtom);
  // getUserVentures returns [] for signed-out users and ventures[] for
  // signed-in users. Skipping is not needed — the query is cheap and
  // Convex auto-caches so subsequent hook mounts (Step2 → Step3 →
  // Step4) reuse the same subscription without extra network hits.
  const ventures = useQuery(api.ventures.getUserVentures, {});

  return useMemo<TemplateId | null>(() => {
    const fromAtom = atomVenture?.templateId as TemplateId | undefined;
    if (fromAtom) return fromAtom;
    if (!ventures || ventures.length === 0) return null;
    // Most-recently-updated wins — mirrors the map's active-venture
    // resolution when the user has multiple ventures.
    const sorted = [...ventures].sort(
      (a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0),
    );
    const tid = sorted[0]?.templateId as TemplateId | undefined;
    return tid ?? null;
  }, [atomVenture?.templateId, ventures]);
}
