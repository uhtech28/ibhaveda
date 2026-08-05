"use client";

/**
 * /persona-setup — dedicated post-signup persona selection screen.
 *
 * Runs BETWEEN account creation (or profile-setup form completion) and
 * the first /feed visit. Sole job: get the user's persona chosen and
 * persisted before Sparky's onboarding tutorial ever mounts.
 *
 * Why a dedicated route (rather than a modal on /feed):
 *   - The tutorial provider auto-shows Sparky as soon as its own Convex
 *     query resolves. If the picker lives on /feed, there's a race
 *     between the tutorial-state query and the persona-id query — the
 *     tutorial usually wins, so Sparky briefly appears (1–2s) before
 *     the picker mounts over it. That "flash" is the glitch the user
 *     reported.
 *   - Isolating persona selection to its own route means /feed only
 *     renders after the persona is guaranteed set. No race, no flash.
 *
 * Gating:
 *   - Unauth → punt to /sign-in.
 *   - Already has persona → push to /feed (never gate-keep past this
 *     point).
 *   - Persona query still loading → skeleton.
 *
 * Post-confirm:
 *   - Persist persona via updatePersonaId, then router.replace("/feed").
 *   - Session-storage flag also set so a hard-refresh during the same
 *     tab doesn't loop us back here mid-nav.
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { PersonaSelector } from "@/components/persona/PersonaSelector";
import type { PersonaId } from "@/config/personas";

export default function PersonaSetupPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();

  const personaIdRaw = useQuery(
    api.users.getMyPersonaId,
    isLoaded && userId ? {} : "skip",
  );
  const updatePersonaId = useMutation(api.users.updatePersonaId);
  const [submitting, setSubmitting] = useState(false);

  // Bounce unauthenticated visitors.
  useEffect(() => {
    if (!isLoaded) return;
    if (!userId) {
      router.replace("/sign-in");
    }
  }, [isLoaded, userId, router]);

  // Bounce users who already picked — /persona-setup is one-shot.
  useEffect(() => {
    if (personaIdRaw === undefined || personaIdRaw === null) return;
    if (typeof window !== "undefined") {
      sessionStorage.setItem("personaPickerDismissed", "1");
    }
    router.replace("/feed");
  }, [personaIdRaw, router]);

  const handleConfirm = useCallback(
    async (id: PersonaId) => {
      if (submitting) return;
      setSubmitting(true);
      try {
        await updatePersonaId({ personaId: id });
        if (typeof window !== "undefined") {
          sessionStorage.setItem("personaPickerDismissed", "1");
        }
        // Use replace() so back-button doesn't bring the picker back.
        router.replace("/feed");
      } catch {
        // If the mutation fails, unfreeze so the user can retry.
        setSubmitting(false);
      }
    },
    [submitting, updatePersonaId, router],
  );

  // Loading state — auth still resolving OR persona query in flight.
  const loading =
    !isLoaded ||
    !userId ||
    personaIdRaw === undefined ||
    personaIdRaw !== null; // already-picked case triggers a redirect above

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
      </div>
    );
  }

  return (
    <PersonaSelector
      onConfirm={handleConfirm}
      submitting={submitting}
    />
  );
}
