"use client";

/**
 * /persona-setup — the SINGLE post-signup screen.
 *
 * All signup CTAs on the site now land users here directly. The
 * intermediate /profile-setup name/username form has been dropped
 * from the flow because it was racing with /feed's redirect guard
 * and producing the "picker → feed flash → picker" glitch.
 *
 * On first mount for a brand-new user we AUTO-PROVISION the Convex
 * profile row from Clerk data (Clerk username / fullName / imageUrl)
 * so the picker appears immediately without asking the user to
 * re-type what Clerk already collected. Once the row exists we
 * render the picker; once the user picks a persona we hard-reload
 * to /feed.
 *
 * Flow:
 *   Sign up (Clerk modal)
 *     ↓
 *   /persona-setup mounts, auto-provisions profile row
 *     ↓
 *   Picker renders (never leaves this screen until user picks)
 *     ↓
 *   Begin clicked → updatePersonaId AWAITED (Begin shows "Beginning…"),
 *   then window.location.replace("/feed")
 *     ↓
 *   /feed loads with persona already set → Sparky's own intro
 *   (Step2TemplatePick's "intro" beat — the pixel-dog hello) plays →
 *   tutorial continues
 *
 * NOTE: there is intentionally NO inline Sparky overlay on this screen.
 * An earlier version rendered a white-card "Hi, I'm Sparky" overlay here
 * between the pick and the /feed nav; it flashed for a frame and then got
 * clobbered by the loading spinner (personaIdRaw flipping non-null made
 * `loading` true and the redirect was gated off), stranding users on a
 * perpetual spinner. Navigating straight to /feed lets the tutorial's own
 * mascot own the intro, with no duplicate hello and no flash.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { PersonaSelector } from "@/components/persona/PersonaSelector";
import type { PersonaId } from "@/config/personas";

export default function PersonaSetupPage() {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const personaIdRaw = useQuery(
    api.users.getMyPersonaId,
    isLoaded && userId ? {} : "skip",
  );
  const existingProfile = useQuery(
    api.users.getCurrentUser,
    isLoaded && userId ? {} : "skip",
  );
  const updatePersonaId = useMutation(api.users.updatePersonaId);
  const createUserProfile = useMutation(api.users.createUserProfile);
  const [submitting, setSubmitting] = useState(false);

  // Bounce unauthenticated visitors.
  useEffect(() => {
    if (!isLoaded) return;
    if (!userId) {
      router.replace("/sign-in");
    }
  }, [isLoaded, userId, router]);

  // AUTO-PROVISION on first mount. If Clerk says we're logged in but
  // no Convex profile row exists, silently create one using Clerk's
  // suggested username / fullName / avatar. Guarded by a ref so a
  // React StrictMode double-mount can't fire the mutation twice.
  const provisionedRef = useRef(false);
  useEffect(() => {
    if (provisionedRef.current) return;
    if (!isLoaded || !userId || !user) return;
    if (existingProfile === undefined) return; // still loading
    if (existingProfile) return; // row already exists — nothing to do
    // If /profile-setup just fired its own createUserProfile without
    // awaiting (the fire-and-forget path added to eliminate the
    // post-submit loading flash), skip auto-provision so we don't
    // race with the in-flight mutation and hit "username already
    // taken". profileProvisionInFlight is cleared by profile-setup
    // once its own mutation resolves.
    if (
      typeof window !== "undefined" &&
      sessionStorage.getItem("profileProvisionInFlight") === "1"
    ) {
      return;
    }
    provisionedRef.current = true;
    const suggestedUsername = (user.username || user.firstName || "user")
      .toLowerCase()
      .replace(/[\s\/\\?#&=:@<>"'`]/g, "");
    const suggestedName = user.fullName || suggestedUsername;
    const avatar = user.imageUrl || "";
    void createUserProfile({
      username: suggestedUsername,
      displayName: suggestedName,
      avatar: avatar || undefined,
      skills: [],
      industries: [],
    }).catch(() => {
      // If provisioning fails (e.g. race on username uniqueness), we
      // fall through to the picker anyway once existingProfile settles.
      provisionedRef.current = false;
    });
  }, [isLoaded, userId, user, existingProfile, createUserProfile]);

  // Already-picked → bounce to /feed. Covers returning users who land
  // on /persona-setup with a persona already saved. A fresh pick goes
  // through handleConfirm below (which hard-navigates directly), so
  // this effect only ever fires for the already-had-a-persona case.
  useEffect(() => {
    if (personaIdRaw === undefined || personaIdRaw === null) return;
    const t = window.setTimeout(() => {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("personaPickerDismissed", "1");
      }
      router.replace("/feed");
    }, 600);
    return () => window.clearTimeout(t);
  }, [personaIdRaw, router]);

  const handleConfirm = useCallback(
    async (id: PersonaId) => {
      if (submitting) return;
      setSubmitting(true);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("personaPickerDismissed", "1");
      }
      // AWAIT the persona write before navigating. There is no persona
      // guard on /feed, so a hard reload that raced ahead of an
      // unfinished mutation could silently drop the user's choice. The
      // Begin button shows "Beginning…" for the round-trip, then we go
      // straight to /feed — where Sparky's own intro (Step2TemplatePick's
      // "intro" beat, the pixel-dog hello) plays. We deliberately do NOT
      // advance the tutorial step here so /feed opens on that intro
      // rather than skipping to the "tap +" step.
      try {
        await updatePersonaId({ personaId: id });
      } catch {
        // Transient failure — let the user retry rather than navigating
        // to a feed that would keep bouncing them through profile setup.
        setSubmitting(false);
        return;
      }
      // Hard reload rather than soft push so /feed remounts with the
      // fresh persona ID baked in. Soft push has raced with the Convex
      // query cache in the past.
      if (typeof window !== "undefined") {
        window.location.replace("/feed");
      } else {
        router.replace("/feed");
      }
    },
    [submitting, updatePersonaId, router],
  );

  // Loading state — auth still resolving, persona query in flight,
  // OR profile row still being auto-provisioned. All three land the
  // user on the spinner momentarily instead of the picker so we
  // never render an unmanaged partial state.
  const loading =
    !isLoaded ||
    !userId ||
    personaIdRaw === undefined ||
    personaIdRaw !== null || // already-picked case triggers redirect above
    existingProfile === undefined ||
    existingProfile === null; // provisioning in flight

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
