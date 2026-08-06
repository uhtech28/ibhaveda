"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  // Post-signup congrats splash — real gating is in the effect below
  // once existingProfile has been declared. Initial state stays false
  // so returning users never see a flash.
  const [showSplash, setShowSplash] = useState(false);

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

  // ── Post-signup congrats splash ──────────────────────────────────────
  // Shown for ~2.5s the FIRST time a fresh signup lands here, then the
  // name/username form fades in. sessionStorage gate stops it from
  // re-firing on refresh, and it never runs for returning users (they
  // already have an existingProfile row).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isLoaded || !userId) return;
    if (existingProfile === undefined) return; // wait for Convex
    if (existingProfile) return; // returning user — no splash
    if (sessionStorage.getItem("welcomeSplashShown") === "1") return;
    sessionStorage.setItem("welcomeSplashShown", "1");
    setShowSplash(true);
  }, [isLoaded, userId, existingProfile]);
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

  // Prefetch /feed so the transition after submit is instant instead of
  // a cold Next.js page load. Fires once on mount, harmless if already
  // prefetched.
  useEffect(() => {
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
      router.replace("/feed");
      return;
    }
    router.replace(hasPersona ? "/feed" : "/persona-setup");
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
      const suggestedUsername = (user.username || user.firstName || 'user')
        .toLowerCase()
        .replace(/[\s\/\\?#&=:@<>"'`]/g, '');
      const suggestedName = user.fullName || suggestedUsername;
      // Auto-pull avatar from Clerk if available, so first-time setup
      // doesn't have to ask the user to upload one.
      const clerkAvatar = user.imageUrl || "";
      setFormData(prev => ({
        ...prev,
        displayName: prev.displayName || suggestedName,
        username: prev.username || suggestedUsername,
        avatar: prev.avatar || clerkAvatar,
      }));
      if (suggestedUsername && suggestedUsername.length >= 3) {
        setValidationUsername(suggestedUsername);
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
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Try one of these:</p>
            <div className="flex flex-wrap gap-1.5">
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
          </div>
        )}
      </div>
    );
  };

  if (!isLoaded || !userId) {
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
  if (
    existingProfile &&
    !showPersonaSelector &&
    !isExplicitEdit
  ) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <HeroHeader />
        <main className="flex-1 flex items-center justify-center px-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p>Loading your feed…</p>
              </div>
            </CardContent>
          </Card>
        </main>
        <FooterSection />
      </div>
    );
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
    // Congrats splash — takes over the whole viewport for ~2.5s,
    // then flips showSplash to false and the form below renders.
    if (showSplash) {
      return (
        <WelcomeSplash
          durationMs={3000}
          onDone={() => setShowSplash(false)}
        />
      );
    }
    const usernameReady =
      formData.username.length >= 3 &&
      usernameValidation.available !== false &&
      !usernameValidation.checking;
    const nameReady = formData.displayName.trim().length >= 2;

    const handleFirstTimeSubmit = async (e: React.FormEvent) => {
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
      setLoading(true);
      setError("");

      // AWAIT the profile-create mutation BEFORE navigating. Prior
      // fire-and-forget + inline-picker approach caused a
      // "picker → feed flash → picker" race because /profile-setup
      // was flipping to the persona picker while the mutation was
      // still in flight — subsequent Convex query snapshots on /feed
      // saw the pre-persona view of the user row and bounced back to
      // /persona-setup. Cleaner deterministic flow:
      //   sign up → /profile-setup form → /persona-setup picker
      //          → /feed (via hard-nav after persona picked)
      // No inline picker, no feed in between.
      try {
        await createUserProfile({
          username: formData.username,
          displayName: formData.displayName.trim(),
          avatar: formData.avatar || undefined,
          skills: [],
          industries: [],
        });
        setLoading(false);
        toast({
          title: "Profile created",
          description: "Now pick your persona.",
          duration: 2000,
        });
        // Hard nav so the fresh /persona-setup mount doesn't inherit
        // any stale query snapshot from this page's client cache.
        if (typeof window !== "undefined") {
          window.location.replace("/persona-setup");
        } else {
          router.replace("/persona-setup");
        }
      } catch (err) {
        setLoading(false);
        const msg = err instanceof Error ? err.message : "Setup failed";
        setError(msg);
        toast({
          title: "Setup failed",
          description: msg,
          variant: "destructive",
        });
      }
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
        <PersonaSelector
          onConfirm={handlePersonaConfirm}
          submitting={personaSubmitting}
        />
      );
    }

    return (
      <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
        <HeroHeader />
        <main className="flex-1 flex items-center justify-center px-4 py-12 pt-32 w-full">
          <div className="w-full max-w-2xl">
            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Let&apos;s set up your profile
              </h1>
              <p className="mt-2 text-sm md:text-base text-muted-foreground">
                Your name and a username people can find you by.
              </p>
            </div>
            <Card className="border-border/50 shadow-xl">
              <CardContent className="p-6 md:p-10">
                <form onSubmit={handleFirstTimeSubmit} className="space-y-5">
                  <div className="space-y-2" data-tutorial="name-block">
                    <Label htmlFor="displayName" className="text-sm font-medium">
                      Your name
                    </Label>
                    <Input
                      id="displayName"
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
                      placeholder="Your full name"
                      className="h-11"
                      autoFocus
                      maxLength={60}
                    />
                  </div>
                  <div className="space-y-2" data-tutorial="username-block">
                    <Label htmlFor="username" className="text-sm font-medium">
                      Username
                    </Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                      onKeyUp={(e) => e.stopPropagation()}
                      onKeyPress={(e) => e.stopPropagation()}
                      placeholder="yourname"
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
                      "Start building"
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
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">Redirecting…</p>
      </div>
      <FallbackRedirect />
    </div>
  );
}

/**
 * Kicks the browser to /feed the moment it mounts. Only rendered by
 * the nuclear fallback return above — we don't add it to the main
 * useEffect chain because it would race with the other, smarter
 * redirect that knows about persona state.
 */
function FallbackRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/feed");
  }, [router]);
  return null;
}
