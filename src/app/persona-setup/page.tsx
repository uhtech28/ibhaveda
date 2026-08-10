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
 *   updatePersonaId AWAITED, then window.location.replace("/feed")
 *     ↓
 *   /feed loads with persona already set → Sparky intro plays on
 *   its black scrim → tutorial continues
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

  // Already-picked → bounce to /feed. Small debounce so a rapid
  // picker → mutation → hard-reload sequence doesn't fire an extra
  // soft redirect mid-navigation.
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
      try {
        await updatePersonaId({ personaId: id });
        if (typeof window !== "undefined") {
          sessionStorage.setItem("personaPickerDismissed", "1");
          // Tutorial-intro flash guard. FeedClient reads this flag on
          // its first render and, when set, paints a solid black
          // backdrop instead of the full feed markup — so the user
          // sees a seamless black → Sparky intro instead of
          // feed-content-flash → black scrim. Cleared by Step2's
          // "Let's go" button handler (which advances the tutorial
          // past the intro dialogue). Also has a 5s safety self-clear
          // below in case the tutorial state never resolves.
          sessionStorage.setItem("gateFeedForTutorialIntro", "1");
          window.setTimeout(() => {
            try {
              sessionStorage.removeItem("gateFeedForTutorialIntro");
            } catch {
              /* no-op */
            }
          }, 5000);
        }
        // Hard reload into /feed rather than router.replace so the
        // whole client re-mounts with the fresh persona ID baked in.
        // A soft push occasionally raced with the Convex reactive
        // query cache (still returning null one tick after mutation
        // ack), which sent the user back through the /feed →
        // /persona-setup redirect — the picker flash bug.
        if (typeof window !== "undefined") {
          window.location.replace("/feed");
        } else {
          router.replace("/feed");
        }
      } catch {
        // If the mutation fails, unfreeze so the user can retry.
        setSubmitting(false);
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
