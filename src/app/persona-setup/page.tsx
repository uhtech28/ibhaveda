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
import { useTutorialOptional } from "@/components/tutorial/v2/useTutorial";
// Real animated Sparky puppy sprite — same one TutorialMascot uses
// on /feed. Product ask (2026-08-16, 4th time): "after selecting
// persona this is coming instead of our original sparky". Previous
// inline overlay drew a static "chat bubble with eyes" placeholder
// glyph; users expect the actual pixel-art puppy from the rest of
// the tutorial for visual consistency.
import { AnimatedSparky } from "@/components/tutorial/v2/puppy/AnimatedSparky";

export default function PersonaSetupPage() {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const tutorial = useTutorialOptional();

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
  // Post-mutation Sparky intro takes over the whole screen so the
  // user NEVER navigates to /feed until they click "Let's go".
  // This eliminates the SSR flash of feed markup that the previous
  // sessionStorage-based gate couldn't cover — /feed's HTML was being
  // painted server-side before any client-side flag check could
  // return a black backdrop. Now the black scrim + Sparky bubble
  // render RIGHT HERE on /persona-setup; the redirect only fires
  // from the "Let's go" click. Zero cross-route flash possible.
  const [showSparkyIntro, setShowSparkyIntro] = useState(false);

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
  // soft redirect mid-navigation. Gated on !showSparkyIntro so once
  // the user has just picked and we're showing the intro overlay,
  // this effect doesn't fire a second redirect underneath it.
  useEffect(() => {
    if (showSparkyIntro) return;
    if (personaIdRaw === undefined || personaIdRaw === null) return;
    const t = window.setTimeout(() => {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("personaPickerDismissed", "1");
      }
      router.replace("/feed");
    }, 600);
    return () => window.clearTimeout(t);
  }, [personaIdRaw, router, showSparkyIntro]);

  const handleConfirm = useCallback(
    (id: PersonaId) => {
      if (submitting) return;
      setSubmitting(true);
      // Product ask 2026-08-20: "AFTER SELECTING PERSONA SPARKY COMES
      // OF BLACK SCREEN WHEN WE CLICK LETS GO IT TELL TO REDIRECT
      // AFTER THAT MAIN SPARKY COMES REMOVE THIS STARTING DOUBLE
      // SPARKY".
      //
      // Rewrite: skip the intermediate SparkyIntroOverlay entirely.
      // On persona pick, immediately advance tutorial + navigate to
      // /feed where Step2TemplatePick's REAL tutorial mascot takes
      // over. Bridge flag ensures Step2 mounts synchronously without
      // waiting for Convex tutorial-state hydration, so users see
      // ONE Sparky (the tutorial one) instead of two.
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("personaPickerDismissed", "1");
          sessionStorage.setItem("sparkyBridgeFromPersonaSetup", "1");
        } catch {
          /* no-op */
        }
      }
      // Advance tutorial past the intro (step 3 = "click +").
      if (tutorial && tutorial.step < 3) {
        void tutorial.goTo(3);
      }
      // Fire-and-forget the persona mutation. Convex reactive query
      // on /feed picks up the new persona within a tick either way.
      void updatePersonaId({ personaId: id }).catch(() => {
        // /feed guard bounces the user back here if the write
        // failed. Silent on transient hiccups.
      });
      // Navigate — window.location.replace is faster + drops all
      // React state so /feed mounts clean.
      if (typeof window !== "undefined") {
        window.location.replace("/feed");
      } else {
        router.replace("/feed");
      }
    },
    [submitting, updatePersonaId, tutorial, router],
  );

  // Deprecated — old SparkyIntroOverlay handler kept in the file
  // only to satisfy any lingering references. `showSparkyIntro` is
  // never set true anymore so this is unreachable in practice.
  const handleSparkyContinue = useCallback(async () => {
    if (typeof window !== "undefined") {
      window.location.replace("/feed");
    } else {
      router.replace("/feed");
    }
  }, [router]);

  // Loading state — ONLY block on Clerk auth resolving. Previously we
  // also gated on personaIdRaw + existingProfile Convex queries, which
  // stacked 3-4 sequential round-trips (auth → profile query → persona
  // query → auto-provision mutation) and left users staring at a spinner
  // for 5-10 seconds on Convex cold starts. The picker itself is safe
  // to render even while those queries hydrate — the useEffect above
  // handles the already-picked redirect and the auto-provision runs in
  // the background, so a brief flash of the picker during nav is fine.
  const loading = !isLoaded || !userId;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
      </div>
    );
  }

  // Sparky intro takes over the whole screen after persona pick.
  // Renders here so no /feed navigation happens until the user clicks
  // "Let's go" — eliminates the SSR flash of feed markup that any
  // client-side gate on /feed can't cover.
  if (showSparkyIntro) {
    return <SparkyIntroOverlay onContinue={handleSparkyContinue} />;
  }

  return (
    <PersonaSelector
      onConfirm={handleConfirm}
      submitting={submitting}
    />
  );
}

/**
 * Full-screen black overlay with Sparky's intro pitch + "Let's go" CTA.
 *
 * Renders inline on /persona-setup so the transition is seamless:
 *   PersonaSelector picker (bright)
 *      ↓  (user clicks a persona)
 *   Sparky intro (black scrim, this component)
 *      ↓  (user clicks "Let's go")
 *   Hard-nav to /feed with tutorial step already at 3 (click_plus)
 *
 * Kept self-contained (no dependency on TutorialProvider's per-route
 * mount rules) so it works whether or not the tutorial state machine
 * has caught up to Convex.
 */
function SparkyIntroOverlay({ onContinue }: { onContinue: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center overflow-hidden"
      style={{
        // Deep-navy radial matching the rest of the platform's dark
        // scrims (feed / dialogs / boss intro all use this palette).
        background:
          "radial-gradient(ellipse 900px 600px at 50% 40%, rgba(99,102,241,0.10), transparent 60%), #05070f",
        // Safe-area padding so the CTA never sits under the iPhone
        // home-indicator + notch never crops the Sparky sprite.
        paddingTop: "max(1.5rem, env(safe-area-inset-top, 0px))",
        paddingBottom: "max(1.5rem, env(safe-area-inset-bottom, 0px))",
        fontFamily: "'Inter', system-ui, sans-serif",
        color: "#F9FAFB",
      }}
    >
      <div className="mx-auto flex w-full max-w-[540px] flex-col items-center gap-6 px-6 text-center">
        {/* Sparky bubble — white card with the intro pitch */}
        <div
          className="relative w-full rounded-2xl border-l-[4px] border-[#F5C542] bg-white px-6 py-5 text-left shadow-2xl"
          style={{
            color: "#111827",
            boxShadow:
              "0 40px 80px -20px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.02)",
          }}
        >
          {/* Template-neutral welcome — the persona-setup screen runs
              BEFORE the user picks a template, so "launching a real
              venture" was wrong for 3 of 4 users (academic → thesis,
              lab → experiment, creative → creation). Keeping this in
              sync with the neutral fallback in
              src/config/templates/tutorialCopy.ts VENTURE.welcomeLine. */}
          <p className="text-[15px] leading-relaxed sm:text-[16px]">
            Hi, I&apos;m Sparky! I&apos;ll walk you through your entire
            journey, from your first idea to shipping something real.
            Ready?
          </p>
        </div>

        {/* Real animated Sparky puppy — same sprite used across the
            tutorial on /feed, /map, and the persona-setup post-pick
            intro. Speech prop is set so the puppy plays TALK while
            the bubble text is on-screen (matches how TutorialMascot
            drives him elsewhere). showSpeechBubble={false} because
            the intro copy already renders in the card above — we
            don't want a second bubble. */}
        <div className="flex flex-shrink-0 items-center justify-center">
          <AnimatedSparky
            size={140}
            speech="intro"
            showSpeechBubble={false}
            autoRoll={false}
            ariaLabel="Sparky"
          />
        </div>

        <button
          type="button"
          onClick={onContinue}
          className="mt-2 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-8 py-3 text-[14px] font-semibold uppercase tracking-[0.14em] text-white shadow-lg shadow-[#6366F1]/25 transition hover:brightness-110 active:scale-[0.99]"
        >
          Let&apos;s go
        </button>
      </div>
    </div>
  );
}
