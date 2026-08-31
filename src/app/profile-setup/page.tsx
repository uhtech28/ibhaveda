"use client";

import React, { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { HeroHeader } from "@/components/header";
import FooterSection from "@/components/footer";
import { AvatarUpload } from "@/components/user/avatar-upload";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { IndustriesMultiSelect } from "@/components/IndustriesMultiSelect";
import { SkillsMultiSelect } from "@/components/SkillsMultiSelect";
import { useTutorial } from "@/components/tutorial/v2";
import { WelcomeSplash } from "@/components/onboarding/WelcomeSplash";
import { GateOfIbhavedaIntro } from "@/components/onboarding/GateOfIbhavedaIntro";
import { PersonaSelector } from "@/components/persona/PersonaSelector";
import type { PersonaId } from "@/config/personas";
// Import PERSONAS directly so we can EAGERLY preload the 8 portrait
// PNGs the moment the signup page mounts (see effect below). Without
// this, the persona picker's <img> tags fired 8 cold network fetches
// on mount and users saw an empty picker for 500-1500ms while the
// portraits streamed in — the "slow persona screen" bug.
import { PERSONAS } from "@/config/personas";
// UserSettingsBody = the shared Persona / Social / Audio tabs the
// map's saddlebag menu used to open in its own dialog. Now rendered
// inline here so all three settings live in one place: the profile
// pencil (Edit Profile). Product feedback: "all these three options
// of settings — move them in the edit pencil in profile".
import { UserSettingsBody } from "@/components/map/MapSettingsDialog";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[\s\/\\?#&=:@<>"'`]+/g, "")
    .slice(0, 30);
}

export default function ProfileSetupPage() {
  return (
    <Suspense fallback={null}>
      <ProfileSetupPageInner />
    </Suspense>
  );
}

function ProfileSetupPageInner() {
  const { isLoaded, userId } = useAuth();
  const { toast } = useToast();
  const { user } = useUser();
  const router = useRouter();
  // Explicit-edit flag — set to true only when the profile pencil in
  // CompactProfileView pushed here with `?edit=1`. Any other arrival
  // on /profile-setup (fresh signup, back-nav, deep-link) is treated
  // as onboarding and routes returning users away instead of showing
  // the Edit Your Profile form.
  const searchParams = useSearchParams();
  const isExplicitEdit = searchParams?.get("edit") === "1";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [profilePopulated, setProfilePopulated] = useState(false);
  // ── Post-signup intro video gate ─────────────────────────────────
  // TRI-STATE, deliberately. This used to be a plain `false` boolean,
  // which caused the "username form flashes for ~2s, then the intro
  // video replaces it" bug:
  //
  //   Convex `useQuery` returns `undefined` while in flight, and
  //   `undefined` is falsy — so the `if (!existingProfile)` branch
  //   below fired BEFORE we knew whether this user was new, painting
  //   the name/username form. Only once getCurrentUser resolved to
  //   `null` did the effect flip the boolean and swap in the video.
  //   The form's visible lifetime was exactly the Convex round-trip.
  //
  // With three states the form simply cannot paint before the
  // decision is made: "pending" renders the black curtain (which
  // matches the video's own background, so signup → video reads as
  // one continuous beat), and only "skip" ever reaches the form.
  const [splashState, setSplashState] = useState<
    "pending" | "show" | "skip"
  >("pending");

  // ── Persona portrait preloader ────────────────────────────────────
  // Fires 8 detached <Image>() requests the moment this page mounts so
  // every persona portrait is warm in the browser cache by the time
  // the user submits their name/username and the picker mounts.
  //
  // Fixes "persona screen takes some time to load after signup" —
  // previously the 8 <img> tags in PersonaSelector fired network
  // requests only on mount, and the picker painted with empty 96×96
  // cells for 500–1500ms while portraits streamed in.
  //
  // `new Image()` (instead of <link rel="preload">) is safer here
  // because it works from a client component without touching <head>
  // and cleans up automatically when the page unmounts.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const probes: HTMLImageElement[] = [];
    for (const p of PERSONAS) {
      const img = new window.Image();
      img.src = p.assets.portrait;
      probes.push(img);
    }
    // No cleanup necessary — the browser holds the cached bytes even
    // if we drop our references. Keeping `probes` in scope for a beat
    // just makes it obvious what we're preloading in devtools.
    void probes;
  }, []);

  // "Gate of Ibhaveda" onboarding intro — plays once ever, right
  // after signup, before the name/username form (per creative brief).
  // Convex-backed via hasSeenGateIntro so returning users skip it.
  const gateIntroSeen = useQuery(api.users.getMyGateIntroSeen, {});
  const markGateSeen = useMutation(api.users.markGateIntroSeen);
  const [gateDismissed, setGateDismissed] = useState(false);
  const shouldShowGate = gateIntroSeen === false && !gateDismissed;

  const [usernameValidation, setUsernameValidation] = useState({
    checking: false,
    available: null as boolean | null,
    error: '',
    suggestions: [] as string[],
  });

  const [validationUsername, setValidationUsername] = useState('');
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const availabilityQuery = useQuery(
    api.users.checkUsernameAvailability,
    validationUsername ? { username: validationUsername } : 'skip'
  );

  const suggestionsQuery = useQuery(
    api.users.generateUsernameSuggestions,
    (validationUsername && usernameValidation.available === false) ? { baseUsername: validationUsername, count: 3 } : 'skip'
  );

  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    bio: '',
    avatar: '',
    industry: '',
    industries: [] as string[],
    skills: [] as string[],
  });

  const createUserProfile = useMutation(api.users.createUserProfile);
  const updateUserProfile = useMutation(api.users.updateUserProfile);
  const updatePersonaId = useMutation(api.users.updatePersonaId);
  const existingProfile = useQuery(api.users.getCurrentUser);

  // Persona picker state — flipped to true after the user submits
  // their name+username on the first-time form. Selecting a persona
  // fires updatePersonaId then completes the redirect to /feed.
  const [showPersonaSelector, setShowPersonaSelector] = useState(false);
  const [personaSubmitting, setPersonaSubmitting] = useState(false);

  // ── Resolve the intro-video decision ─────────────────────────────
  // Runs the moment we have BOTH a Clerk session and a settled Convex
  // answer. Every path assigns a terminal state, so the curtain below
  // can never hang: fresh signup → "show", everyone else → "skip".
  // The sessionStorage gate stops the video re-firing on refresh.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isLoaded || !userId) return;
    if (existingProfile === undefined) return; // wait for Convex
    if (existingProfile) {
      setSplashState("skip"); // returning user — straight past
      return;
    }
    let alreadyPlayed = false;
    try {
      alreadyPlayed = sessionStorage.getItem("welcomeSplashShown") === "1";
      if (!alreadyPlayed) sessionStorage.setItem("welcomeSplashShown", "1");
    } catch {
      /* private mode — play the intro rather than dead-end */
    }
    setSplashState(alreadyPlayed ? "skip" : "show");
  }, [isLoaded, userId, existingProfile]);

  // Warm the intro video while Clerk and Convex are still resolving.
  // The clips are 1.5-2.6 MB and were previously fetched only once
  // <WelcomeSplash> mounted, so the user sat on black while it
  // buffered. Starting the fetch here means the bytes are usually in
  // the HTTP cache by the time the element mounts, and playback
  // begins on the first frame instead of after a stall.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isExplicitEdit) return; // editing a profile — no intro coming
    const portrait =
      window.innerWidth <= 768 || window.innerHeight > window.innerWidth;
    const sources = portrait
      ? [
          "/assets/videos/welcome-intro-mobile.webm",
          "/assets/videos/welcome-intro-mobile.mp4",
        ]
      : [
          "/assets/videos/welcome-intro-desktop.webm",
          "/assets/videos/welcome-intro-desktop.mp4",
        ];
    const links = sources.map((href) => {
      const el = document.createElement("link");
      el.rel = "prefetch";
      el.as = "video";
      el.href = href;
      document.head.appendChild(el);
      return el;
    });
    return () => {
      for (const el of links) el.remove();
    };
  }, [isExplicitEdit]);
  // Tutorial context — used on submit to advance from the (now-hidden)
  // profile-setup phase to Step 3 on /feed. Was previously handled
  // inside Step1Welcome, but that component is disabled per product
  // request (no Sparky on profile-setup).
  const tutorial = useTutorial();

  useEffect(() => {
    if (!validationUsername) {
      setUsernameValidation({ checking: false, available: null, error: '', suggestions: [] });
      return;
    }
    if (availabilityQuery === undefined) {
      setUsernameValidation(prev => ({ ...prev, checking: true, error: '' }));
      return;
    }
    if (availabilityQuery.available) {
      setUsernameValidation({ checking: false, available: true, error: '', suggestions: [] });
    } else {
      setUsernameValidation({ checking: false, available: false, error: 'This username is already taken', suggestions: suggestionsQuery || [] });
    }
  }, [availabilityQuery, suggestionsQuery, validationUsername]);

  const validateUsername = useCallback((username: string) => {
    if (!username.trim()) {
      setUsernameValidation({ checking: false, available: null, error: '', suggestions: [] });
      setValidationUsername('');
      return;
    }
    if (username.length < 3) {
      setUsernameValidation({ checking: false, available: null, error: 'Username must be 3-30 characters', suggestions: [] });
      setValidationUsername('');
      return;
    }
    // Allow letters, numbers, and a broad set of special chars.
    // Disallows whitespace and URL-routing chars (/ ? # & = : @ < > " ' \ space).
    const regexTest = /^[^\s\/\\?#&=:@<>"'`]+$/.test(username);
    if (!regexTest) {
      setUsernameValidation({ checking: false, available: null, error: 'Username can\'t contain spaces or URL chars (/ ? # & = : @ < > " \')', suggestions: [] });
      setValidationUsername('');
      return;
    }
    setValidationUsername(username);
  }, []);

  const handleUsernameChange = useCallback((username: string) => {
    // Strip disallowed chars but keep everything else (special chars OK).
    const normalizedUsername = username
      .toLowerCase()
      .replace(/[\s\/\\?#&=:@<>"'`]/g, '');
    setFormData(prev => ({ ...prev, username: normalizedUsername }));
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    // Reduced from 500ms -> 200ms for snappier "available" feedback.
    // Convex handles rapid queries fine; the debounce is only there to
    // avoid firing on every keystroke.
    debounceTimer.current = setTimeout(() => { validateUsername(normalizedUsername); }, 200);
  }, [validateUsername]);

  useEffect(() => {
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, []);

  // Prefetch /persona-setup so the soft-nav after submit lands
  // instantly — no cold JS load, no "Setting up your persona…" flash.
  // /feed is also prefetched for the returning-user redirect path
  // (see the useEffect below that bounces users away from this page
  // when they already have a persona).
  useEffect(() => {
    router.prefetch("/persona-setup");
    router.prefetch("/feed");
  }, [router]);

  // Returning users bounce OUT of /profile-setup — this page is
  // ONLY for first-time onboarding (name + username → persona
  // picker). Any user with an existing profile row who lands here
  // without an explicit ?edit=1 gets sent somewhere useful:
  //
  //   - No persona picked yet   → /persona-setup (dedicated picker)
  //   - Persona already picked  → /feed
  //
  // The explicit ?edit=1 param (set by the profile-page pencil
  // button in CompactProfileView) opts INTO the Edit Profile form
  // that lives at the bottom of this file.
  //
  // GUARD: skip the redirect while the persona picker is actively
  // showing here (i.e. the user is mid-signup and just submitted
  // name/username). Without the guard the optimistic
  // createUserProfile call from handleFirstTimeSubmit would resolve,
  // populate `existingProfile`, and kick the user out mid-picker —
  // the "persona → feed → persona flash" bug from earlier.
  const personaIdRaw = useQuery(api.users.getMyPersonaId, {});
  const hasPersona = typeof personaIdRaw === "string";
  useEffect(() => {
    if (showPersonaSelector) return;
    if (isExplicitEdit) return;
    // Guard: while the first-time submit handler is mid-flight
    // (`loading===true`), the mutation is awaiting a server response.
    // The reactive existingProfile query can populate first and trip
    // this redirect BEFORE handleFirstTimeSubmit's own hard-nav to
    // /persona-setup fires, causing the user to briefly land on /feed
    // (via the router.replace path on line 273 when a stale
    // hasPersona=true snapshot briefly returns). Product report:
    // "after username setup it first redirect for 2 seconds to feed
    // then comes to persona selection". Skipping the redirect while
    // the handler owns navigation makes the transition instant.
    if (loading) return;
    // Any existing profile row → redirect. We DON'T require
    // .username to be truthy here — an edge case where the Convex
    // row exists with an empty username was falling through both
    // guards and rendering the Edit Profile form (the bug user
    // reported: "again this screen is there... we don't want edit
    // profile screen"). Any signed-up user should be routed to the
    // persona picker (if no persona) or the feed (if persona set),
    // never to the Edit form unless they explicitly clicked the
    // pencil (?edit=1).
    if (!existingProfile) return;
    // Wait for the persona query to resolve so we route to the
    // correct destination on the first hop instead of bouncing
    // /feed → /persona-setup.
    if (personaIdRaw === undefined) return;
    // If the user just finished the persona picker in this tab, we
    // set `personaPickerDismissed=1` right before navigating to
    // /feed. If a stale render of /profile-setup somehow re-mounts
    // (e.g. router race during window.location.replace), respect the
    // flag and go straight to /feed — never bounce back through
    // /persona-setup after the user has already picked.
    if (
      typeof window !== "undefined" &&
      sessionStorage.getItem("personaPickerDismissed") === "1"
    ) {
      // User already picked a persona in this tab — safe to bounce
      // straight to /feed. Only hits this branch for RETURNING users
      // who reload /profile-setup; fresh signups clear this flag in
      // handleFirstTimeSubmit so they never take this path.
      router.replace("/feed");
      return;
    }
    // Any other fallthrough goes to /persona-setup. We used to route
    // hasPersona===true users to /feed here, but a stale Convex
    // client cache (personaIdRaw briefly returning an old id from a
    // prior sign-in in the same tab) tripped that branch mid-submit
    // and caused the "/feed flashes for 2 seconds then persona
    // selection" bug. /persona-setup itself will bounce anyone with
    // a real persona onward to /feed via its own effect at
    // persona-setup/page.tsx:96-105 — so we lose nothing by always
    // routing here, and we eliminate the flash class of races.
    router.replace("/persona-setup");
  }, [
    existingProfile,
    router,
    showPersonaSelector,
    isExplicitEdit,
    hasPersona,
    personaIdRaw,
  ]);

  useEffect(() => {
    if (user) {
      // Product ask: NO prefill of name/username — both fields start
      // empty and show their placeholder hints ("Your name" /
      // "username") so the user types their own. We still silently
      // pull the Clerk avatar (not a visible form field) so first-time
      // setup doesn't have to ask for a photo upload.
      const clerkAvatar = user.imageUrl || "";
      if (clerkAvatar) {
        setFormData(prev => ({
          ...prev,
          avatar: prev.avatar || clerkAvatar,
        }));
      }
    }
  }, [user, userId]);

  useEffect(() => {
    if (existingProfile && !profilePopulated) {
      setFormData(prev => ({
        ...prev,
        username: existingProfile.username || prev.username,
        displayName: existingProfile.displayName || prev.displayName,
        bio: existingProfile.bio || prev.bio,
        avatar: existingProfile.avatar || prev.avatar,
        industry: existingProfile.industry || prev.industry,
        industries: existingProfile.industries || (existingProfile.industry ? [existingProfile.industry] : []) || prev.industries,
        skills: existingProfile.skills || prev.skills,
      }));
      setProfilePopulated(true);
    }
  }, [existingProfile, profilePopulated]);

  const validateForm = () => {
    const errors: string[] = [];
    if (!formData.username.trim()) {
      errors.push("Username is required");
      toast({ title: "Username required", description: "Please enter a username to continue.", variant: "destructive", duration: 4000 });
    } else if (!/^[a-z0-9_]+$/.test(formData.username)) {
      errors.push("Username can only contain lowercase letters, numbers, and underscores");
      toast({ title: "Invalid username", description: "Username can only contain lowercase letters, numbers, and underscores.", variant: "destructive", duration: 4000 });
    } else if (formData.username.length < 3) {
      errors.push("Username must be at least 3 characters");
      toast({ title: "Username too short", description: "Your username must be at least 3 characters long.", variant: "destructive", duration: 4000 });
    }
    if (existingProfile && !formData.displayName.trim()) {
      errors.push("Display name is required");
      toast({ title: "Display name required", description: "Please enter your full name to continue.", variant: "destructive", duration: 4000 });
    }
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!existingProfile && usernameValidation.available === false) {
      setError("Username is already taken. Please choose a different username.");
      toast({ title: "Username unavailable", description: "This username is already taken. Please choose one of the suggestions or try a different username.", variant: "destructive", duration: 5000 });
      return;
    }
    if (!existingProfile && usernameValidation.checking) {
      toast({ title: "Please wait", description: "Checking username availability...", duration: 2000 });
      return;
    }
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(". "));
      return;
    }
    if (!userId) return;
    setLoading(true);
    setError("");
    const finalDisplayName = formData.displayName.trim() || formData.username;
    const mutationArgs = {
      displayName: finalDisplayName,
      bio: formData.bio || undefined,
      avatar: formData.avatar || undefined,
      industry: formData.industries.length > 0 ? formData.industries[0] : undefined,
      industries: formData.industries,
      skills: formData.skills,
    };

    // OPTIMISTIC NAVIGATION - fire the mutation but don't await it.
    // Convex will process the write in the background while the user
    // is already looking at /feed. Errors surface via toast after the
    // fact. This saves the ~800ms-2s round-trip wait the user
    // previously endured before seeing any progress.
    const mutationPromise = existingProfile
      ? updateUserProfile(mutationArgs)
      : createUserProfile({ ...mutationArgs, username: formData.username });

    // Advance the tutorial state so Sparky appears at Step 3 on /feed.
    // Fire-and-forget; failure is non-blocking (tutorial recovers via
    // its own Convex subscription on next reconciliation).
    void tutorial.goTo(3);

    // Kick off navigation immediately (feed was prefetched on mount).
    toast({
      title: "Profile completed!",
      description: "Welcome to the community!",
      duration: 3000,
    });
    router.push("/feed");

    // Track the mutation in the background - surface errors if it fails
    // while the user is on /feed.
    mutationPromise.catch((err: unknown) => {
      const errorMessage =
        err instanceof Error
          ? err.message
          : `Failed to ${existingProfile ? "update" : "create"} profile`;
      toast({
        title: `Failed to ${existingProfile ? "update" : "create"} profile`,
        description: errorMessage,
        variant: "destructive",
        duration: 6000,
      });
    });
  };

  const handleCancel = () => { router.push('/'); };

  const UsernameValidationStatus = () => {
    if (!formData.username || existingProfile) return null;
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          {usernameValidation.checking ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Checking availability…</span>
            </>
          ) : usernameValidation.available === true ? (
            <>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs text-emerald-500 font-medium">Available</span>
            </>
          ) : usernameValidation.available === false ? (
            <>
              <XCircle className="w-3.5 h-3.5 text-destructive" />
              <span className="text-xs text-destructive font-medium">Taken</span>
            </>
          ) : null}
        </div>
        {usernameValidation.error && !usernameValidation.suggestions.length && (
          <p className="text-xs text-destructive leading-tight">{usernameValidation.error}</p>
        )}
        {usernameValidation.available === false && usernameValidation.suggestions.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Try one of these:</span>
            {usernameValidation.suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleUsernameChange(suggestion)}
                className="px-2 py-0.5 text-xs bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-md transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (!isLoaded || !userId) {
    // Someone who clicked the profile pencil is expecting a form, so
    // give them a normal chrome-and-spinner wait. A fresh signup is
    // about to get the intro video, so give them the black curtain
    // instead — a spinner card followed by a black video reads as two
    // separate loads of two different things.
    if (isExplicitEdit) {
      return (
        <div className="min-h-screen flex flex-col bg-background">
          <HeroHeader />
          <main className="flex-1 flex items-center justify-center px-4">
            <Card className="max-w-md w-full">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p>Loading your profile setup...</p>
                </div>
              </CardContent>
            </Card>
          </main>
          <FooterSection />
        </div>
      );
    }
    return <OnboardingCurtain />;
  }

  // If an existing profile row is present (returning user, OR the
  // mutation that JUST resolved a first-time submit), we NEVER render
  // the Edit form here. Show a lightweight loading state while the
  // useEffect redirect above pushes us to /feed. Fixes the ~2s flash
  // of "Edit Your Profile" that appeared between mutation-success
  // and router.push completing.
  //
  // GUARD: same as the redirect effect above — when the persona
  // picker is up, the user's profile row has just been created by our
  // optimistic dispatch. If we bail into this loading state here the
  // picker unmounts and the user sees "Loading your feed…" briefly
  // before being kicked to /feed → /persona-setup. Skipping this
  // branch while showPersonaSelector is true keeps the picker mounted
  // continuously until the user picks a persona.
  // Loading state for returning users while the redirect useEffect
  // above is in-flight. Skipped when:
  //   - the persona picker is currently showing (mid-signup)
  //   - the user came here explicitly to edit (?edit=1 from pencil)
  // In both those cases we intentionally stay on this page and render
  // the appropriate UI (picker or Edit form) below.
  // Any existing profile → render Loading while the redirect above
  // completes. `.username` predicate dropped so profiles with empty
  // usernames also trigger the redirect (edge case that let the
  // Edit form leak through).
  // Post-submit interstitial branch REMOVED per product ask: "we
  // dont want loading after username setup direct persona". After
  // handleFirstTimeSubmit fires (fire-and-forget mutation +
  // synchronous router.replace to /persona-setup) the useEffect on
  // line 246 will also route to /persona-setup within a tick. During
  // that ~50ms transition window we return null — nothing paints,
  // no "Loading" card, no spinner, no HeroHeader. The user's next
  // visible paint is the persona picker.
  if (
    existingProfile &&
    !showPersonaSelector &&
    !isExplicitEdit
  ) {
    return null;
  }

  // Convex hasn't answered yet, so we do NOT know whether this is a
  // fresh signup (intro video first) or a returning user (redirect
  // out). Falling through here is what used to flash the username
  // form: `undefined` is falsy, so the first-time branch below fired
  // while the answer was still in flight. Hold the curtain instead.
  if (existingProfile === undefined && !isExplicitEdit) {
    return <OnboardingCurtain />;
  }

  if (!existingProfile) {
    // "Gate of Ibhaveda" onboarding intro — DISABLED per product
    // request. The scaffold component + Convex flag + mutation are
    // still in the repo (GateOfIbhavedaIntro.tsx, hasSeenGateIntro,
    // markGateIntroSeen). Re-enable by uncommenting the block below
    // once real pixel-art / audio replace the placeholder scene.
    //
    // if (shouldShowGate) {
    //   return (
    //     <GateOfIbhavedaIntro
    //       onDone={() => {
    //         setGateDismissed(true);
    //         void markGateSeen({}).catch(() => {});
    //       }}
    //     />
    //   );
    // }
    void shouldShowGate;
    void markGateSeen;

    // ORDER MATTERS, and it is enforced here rather than by timing.
    // "pending" means the effect above hasn't decided yet — keep the
    // curtain up. Only "show" plays the video, and only "skip" is
    // allowed to reach the name/username form underneath. There is
    // no state in which the form can paint ahead of the video.
    if (splashState === "pending") {
      return <OnboardingCurtain />;
    }
    if (splashState === "show") {
      // No `durationMs` prop — WelcomeSplash is video-driven and
      // dismisses ONLY on the user clicking after the video ends
      // (or on video error). Passing the old 3000ms would trigger
      // the safety-valve timeout and skip the video after 3s.
      return <WelcomeSplash onDone={() => setSplashState("skip")} />;
    }
    const usernameReady =
      formData.username.length >= 3 &&
      usernameValidation.available !== false &&
      !usernameValidation.checking;
    const nameReady = formData.displayName.trim().length >= 2;

    const handleFirstTimeSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!nameReady) {
        toast({ title: "Add your name to continue", variant: "destructive" });
        return;
      }
      if (!usernameReady) {
        toast({ title: "Pick an available username", variant: "destructive" });
        return;
      }
      if (!userId) return;
      setError("");
      // Clear any stale session flags so /feed's early-bounce logic +
      // /profile-setup's redirect useEffect don't take stale-cache paths.
      if (typeof window !== "undefined") {
        try {
          sessionStorage.removeItem("personaPickerDismissed");
          sessionStorage.setItem("skipFeedGoToPersona", "1");
          // Signal to /persona-setup that a createUserProfile call is
          // already in flight from here — its auto-provision effect
          // should NOT fire a second mutation with the Clerk-suggested
          // username, or we race and one of them fails with a
          // "username already taken" error.
          sessionStorage.setItem("profileProvisionInFlight", "1");
        } catch {
          /* no-op */
        }
      }

      // Product ask (verbatim): "we dont want loading after username
      // setup direct persona". Zero-wait strategy:
      //   1. Fire createUserProfile WITHOUT awaiting — Convex reactive
      //      queries on /persona-setup will pick up the new row within
      //      a tick as soon as the server ACKs (~200-500ms).
      //   2. Immediately router.replace("/persona-setup") — SOFT nav,
      //      not window.location.replace. Soft nav preserves the
      //      Clerk auth context + Convex client + Next.js router state,
      //      so /persona-setup mounts in ~50-100ms with warm caches
      //      instead of the ~1-2s cold reload that hard-nav needs.
      //   3. /persona-setup is prefetched on mount below, so the JS
      //      bundle is already parsed by the time we navigate.
      //   4. If the mutation fails, we surface the error via toast +
      //      a session flag; persona-setup will show a "please try
      //      again" state instead of a broken picker.
      void createUserProfile({
        username: formData.username,
        displayName: formData.displayName.trim(),
        avatar: formData.avatar || undefined,
        skills: [],
        industries: [],
      }).then(() => {
        if (typeof window !== "undefined") {
          try {
            sessionStorage.removeItem("profileProvisionInFlight");
          } catch {
            /* no-op */
          }
        }
      }).catch((err) => {
        if (typeof window !== "undefined") {
          try {
            sessionStorage.removeItem("profileProvisionInFlight");
          } catch {
            /* no-op */
          }
        }
        const msg = err instanceof Error ? err.message : "Setup failed";
        toast({
          title: "Setup failed",
          description: msg,
          variant: "destructive",
        });
      });

      // Nav is instant — no await, no loading state, no interstitial.
      router.replace("/persona-setup");
    };

    const handlePersonaConfirm = async (personaId: PersonaId) => {
      if (personaSubmitting) return;
      setPersonaSubmitting(true);
      // AWAIT the persona write BEFORE navigating.
      //
      // The previous (fire-and-forget) implementation caused a
      // three-stage flicker for every fresh signup:
      //   1. Persona picker renders on /profile-setup (1-2 s).
      //   2. router.push("/feed") fires immediately — mutation still
      //      in flight, so /feed's `personaIdRaw` query resolves to
      //      NULL, triggering /feed → /persona-setup redirect (1-2 s
      //      of feed showing before the redirect lands).
      //   3. /persona-setup mounts, picker renders AGAIN.
      // Awaiting the mutation eliminates the race — by the time
      // navigation kicks off, the persona query has the new value on
      // its next fetch, /feed's redirect guard sees it, and there's
      // no bounce. Also seed sessionStorage so any surviving race
      // path (e.g. Convex query cache lag) doesn't loop us back
      // through the picker.
      try {
        await updatePersonaId({ personaId });
        if (typeof window !== "undefined") {
          sessionStorage.setItem("personaPickerDismissed", "1");
        }
        toast({
          title: "Welcome!",
          description: "Loading your feed…",
          duration: 3000,
        });
        // Hard replace() — the persona picker + profile-setup form
        // should never be reachable by back-button once this succeeds.
        // Also use window.location for the hop so the whole app tree
        // re-mounts fresh (avoids stale Convex query snapshots
        // holding onto the pre-persona view of the user row).
        if (typeof window !== "undefined") {
          window.location.replace("/feed");
        } else {
          router.replace("/feed");
        }
      } catch (err) {
        setPersonaSubmitting(false);
        const msg = err instanceof Error ? err.message : "Persona save failed";
        toast({
          title: "Persona save failed",
          description: msg,
          variant: "destructive",
        });
      }
    };

    if (showPersonaSelector) {
      return (
        <>
          <PersonaSelector
            onConfirm={handlePersonaConfirm}
            submitting={personaSubmitting}
          />
          {personaSubmitting && (
            <div className="fixed inset-0 z-[100002] flex items-center justify-center bg-black">
              <Loader2 className="h-8 w-8 animate-spin text-white/80" />
            </div>
          )}
        </>
      );
    }

    return (
      <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
        <HeroHeader />
        {/* flex-col + `my-auto` on the inner block vertically centers the
            form when there's room (keyboard closed) but degrades to a
            normal top-anchored, scrollable layout when the on-screen
            keyboard shrinks the viewport — so the "Start Building" button
            stays reachable instead of being trapped below the keyboard.
            Reduced mobile top padding (pt-20 vs desktop pt-32) keeps the
            heading clear of the 56px fixed header instead of clipping. */}
        <main className="flex-1 flex flex-col px-4 pt-20 pb-8 md:pt-32 md:pb-12 w-full">
          <div className="mx-auto my-auto w-full max-w-2xl">
            <div className="text-center mb-6 md:mb-8">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Let&apos;s set up your profile
              </h1>
              <p className="mt-2 text-sm md:text-base text-muted-foreground">
                Your name and a username people can find you by.
              </p>
            </div>
            <Card className="border-border/50 shadow-xl">
              <CardContent className="p-6 md:p-10">
                <form onSubmit={handleFirstTimeSubmit} className="space-y-4">
                  <div data-tutorial="name-block">
                    <Input
                      id="displayName"
                      aria-label="Your name"
                      value={formData.displayName}
                      onChange={(e) => {
                        const v = e.target.value;
                        setFormData((prev) => ({ ...prev, displayName: v }));
                        if (
                          !formData.username ||
                          formData.username === slugify(formData.displayName)
                        ) {
                          const suggested = slugify(v);
                          setFormData((prev) => ({
                            ...prev,
                            username: suggested,
                          }));
                          if (suggested.length >= 3) {
                            if (debounceTimer.current)
                              clearTimeout(debounceTimer.current);
                            debounceTimer.current = setTimeout(() => {
                              validateUsername(suggested);
                            }, 400);
                          }
                        }
                      }}
                      // Stop keydown bubbling so no parent handler (Phaser
                      // WASD/E/SPACE captures warmed by /feed pre-imports,
                      // tutorial mascot listeners, etc.) can swallow the
                      // keystrokes before the input receives them.
                      onKeyDown={(e) => e.stopPropagation()}
                      onKeyUp={(e) => e.stopPropagation()}
                      onKeyPress={(e) => e.stopPropagation()}
                      placeholder="Your name"
                      className="h-11"
                      autoFocus
                      maxLength={60}
                    />
                  </div>
                  <div className="space-y-2" data-tutorial="username-block">
                    <Input
                      id="username"
                      aria-label="Username"
                      value={formData.username}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                      onKeyUp={(e) => e.stopPropagation()}
                      onKeyPress={(e) => e.stopPropagation()}
                      placeholder="username"
                      className="h-11"
                      maxLength={30}
                    />
                    <UsernameValidationStatus />
                  </div>
                  {error && <p className="text-xs text-destructive">{error}</p>}
                  <Button
                    type="submit"
                    disabled={!nameReady || !usernameReady || loading}
                    className="w-full h-11"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Setting up…
                      </>
                    ) : (
                      "Start Building"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
        <FooterSection />
      </div>
    );
  }

  // FINAL RETURN — nuclear fallback.
  //
  // If execution ever reaches here it means all the earlier gates
  // (first-time signup form, persona picker branch, existing-profile
  // Loading state) fell through. That should never happen for a
  // returning user, but if it does we render a minimal "Loading..."
  // frame and hard-redirect to /feed instead of the old Edit Profile
  // form. Product feedback: "we don't want edit profile screen" —
  // this route is onboarding-only, never a profile editor.
  // Nuclear fallback — no visible content, just the redirector.
  // Previously showed a "Redirecting…" spinner card which the user
  // reported as another loading state. Return null instead so the
  // FallbackRedirect fires silently and the next paint is the
  // destination page (/persona-setup).
  return <FallbackRedirect />;
}

/**
 * OnboardingCurtain — the black frame that holds the signup flow
 * together while Clerk and Convex resolve.
 *
 * It is the same #000 as <WelcomeSplash>'s backdrop, deliberately:
 * the intro video mounts straight into this ground, so the handoff
 * from "waiting" to "video playing" has no visible seam. Previously
 * this window rendered a spinner card with the site header and
 * footer, then the username form, then the video — three distinct
 * screens where the product intends one.
 *
 * The spinner fades in only after 1.2s, so a fast connection sees a
 * clean black beat rather than a spinner flash, while a slow or
 * broken one still gets feedback that something is happening.
 */
function OnboardingCurtain() {
  const [showSpinner, setShowSpinner] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setShowSpinner(true), 1200);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-black"
      role="status"
      aria-label="Preparing your welcome"
    >
      <Loader2
        className="h-7 w-7 animate-spin text-white/40 transition-opacity duration-500 motion-reduce:animate-none"
        style={{ opacity: showSpinner ? 1 : 0 }}
      />
    </div>
  );
}

/**
 * Nuclear fallback — kicks the browser to /persona-setup the moment
 * it mounts. Previously routed to /feed, which was the OTHER source
 * of the "feed flashes for 2s during signup" bug: any state that
 * fell through the earlier branches (form / persona picker /
 * post-submit interstitial) hit this and soft-nav'd to /feed, which
 * then had its own persona-null detector bounce back after ~2s.
 * Routing straight to /persona-setup makes the fallthrough safe.
 */
function FallbackRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/persona-setup");
  }, [router]);
  return null;
}
