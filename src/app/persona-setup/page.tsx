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
      // FIRE-AND-FORGET the mutation. Previously we awaited it before
      // flipping to the Sparky overlay — Convex round-trips can take
      // 500-2000ms on mobile networks, so users saw the picker freeze
      // for a beat then jump to black. Now the overlay renders in the
      // SAME TICK as the click; the mutation resolves in the background.
      //
      // Safety: the "Let's go" click waits ~200ms during handleSparkyContinue
      // if the mutation is still in flight (guaranteed to have started
      // 100s of ms earlier by then), and the /feed persona-guard
      // redirect will still bounce them back here if the write actually
      // failed. Realistically the mutation is always done long before
      // the user finishes reading Sparky's intro pitch.
      if (typeof window !== "undefined") {
        sessionStorage.setItem("personaPickerDismissed", "1");
      }
      void updatePersonaId({ personaId: id }).catch(() => {
        // Silent — if the mutation fails, the /feed guard redirects
        // back here and the user can retry. We deliberately don't
        // block the intro on this error because most failures are
        // transient network hiccups the user shouldn't have to notice.
      });
      // Overlay renders NOW — no wait on the network round-trip.
      setShowSparkyIntro(true);
    },
    [submitting, updatePersonaId],
  );

  // "Let's go" click on the Sparky intro overlay. Advances the
  // tutorial past the intro dialogue (step 3 = click_plus) so /feed
  // renders Step2TemplatePick with the "tap +" beat already active —
  // no intro dialogue on the /feed side, no double-scrim.
  const handleSparkyContinue = useCallback(async () => {
    // Fire tutorial advance BEFORE navigation. The mutation is
    // async but we don't await it (Convex reactive query on /feed
    // will pick up the new step within a tick either way).
    if (tutorial && tutorial.step < 3) {
      void tutorial.goTo(3);
    }
    // Hard reload rather than soft push so /feed remounts with the
    // fresh persona ID + tutorial step baked in. Soft push has raced
    // with the Convex query cache in the past.
    if (typeof window !== "undefined") {
      window.location.replace("/feed");
    } else {
      router.replace("/feed");
    }
  }, [tutorial, router]);

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
          <p className="text-[15px] leading-relaxed sm:text-[16px]">
            Hi, I&apos;m Sparky! I&apos;ll walk you through your entire
            journey, from your first idea to launching a real venture.
            Ready?
          </p>
        </div>

        {/* Sparky puppy sprite — same gold-outline glyph used elsewhere
            in the tutorial mascot, kept inline so we don't have to
            import the full animated component. Pixel-art pup at 96×96. */}
        <div
          className="grid h-[96px] w-[96px] flex-shrink-0 place-items-center rounded-full border border-[#F5C542]/40"
          style={{
            background:
              "radial-gradient(circle at 35% 35%, #fde68a 0%, #f5c542 55%, #b8790a 100%)",
            boxShadow: "0 0 24px rgba(245,197,66,0.35)",
          }}
          aria-hidden
        >
          <svg viewBox="0 0 24 24" width={56} height={56} fill="none">
            <path
              d="M6 10c0-3.5 2.7-6 6-6s6 2.5 6 6c0 1-.4 2-1 2.7l1 2.3-2.2-.6c-1 .7-2.3 1-3.8 1s-2.8-.3-3.8-1L6 15l1-2.3c-.6-.7-1-1.7-1-2.7Z"
              fill="#3a2412"
            />
            <circle cx="10" cy="10" r="1" fill="#fff2c8" />
            <circle cx="14" cy="10" r="1" fill="#fff2c8" />
            <circle cx="10" cy="10" r="0.5" fill="#3a2412" />
            <circle cx="14" cy="10" r="0.5" fill="#3a2412" />
            <path
              d="M11 12.5c.5.4 1.5.4 2 0"
              stroke="#3a2412"
              strokeWidth="0.6"
              strokeLinecap="round"
            />
          </svg>
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
