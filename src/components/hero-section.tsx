"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Building2,
  CheckCheck,
  Eye,
  GraduationCap,
  LockKeyhole,
  MapPinned,
  Plus,
  ShieldCheck,
  Sparkles,
  SquarePen,
  Star,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";
import { useAuthModal } from "@/components/auth/auth-modal";
// Landing-page styles. These used to be an 814-line template literal
// rendered as `<style>{LANDING_STYLES}</style>` inside the component,
// which caused three separate problems:
//
//   1. HYDRATION. A <style> tag whose body is a JS string renders as a
//      React TEXT NODE, so any skew between the server and client copies
//      of this module was reported as a hydration mismatch on the
//      stylesheet itself. In dev that fires on nearly every edit.
//   2. A stray backtick anywhere in the string — including inside a CSS
//      comment — silently terminated the literal and dropped every rule
//      after it. The page then rendered with default typography and no
//      media queries, with no error of any kind. That happened twice
//      while working on this file.
//   3. ~25 KB of unminified CSS was inlined into every HTML response
//      rather than served as a cacheable, minified asset.
//
// As a real stylesheet none of those are possible.
import "./hero-section.css";

const SELECTED_ROLE_KEY = "ii.selectedRole";

type RoleKey = "student" | "investor" | "founder" | "incubator";

type Role = {
  key: RoleKey;
  label: string;
  eyebrow: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  glow: string;
};

type Tile = {
  word: string;
  role: string;
  accent: string;
  icon: React.ComponentType<{ className?: string }>;
  backTitle: string;
  backBody: string;
};

type QuestionSlide = {
  question: string;
  nextPrompt: string;
  gif: string;
  gifAlt: string;
  left: [Tile, Tile];
  right: [Tile, Tile];
};

const ROLES: Role[] = [
  {
    key: "student",
    label: "Student",
    eyebrow: "Ideate",
    icon: GraduationCap,
    color: "#60A5FA",
    glow: "rgba(96,165,250,0.14)",
  },
  {
    key: "investor",
    label: "Investor",
    eyebrow: "Discover",
    icon: TrendingUp,
    color: "#34D399",
    glow: "rgba(52,211,153,0.14)",
  },
  {
    key: "founder",
    label: "Founder",
    eyebrow: "Build",
    icon: Sparkles,
    color: "#C084FC",
    glow: "rgba(192,132,252,0.14)",
  },
  {
    key: "incubator",
    label: "Incubator",
    eyebrow: "Scale",
    icon: BarChart3,
    color: "#FBBF24",
    glow: "rgba(251,191,36,0.14)",
  },
];

const QUESTION_SLIDES: QuestionSlide[] = [
  {
    question: "What is Ibhaveda?",
    nextPrompt: "How does it work?",
    gif: "/landing-preview-assets/spark.gif",
    gifAlt: "Ibhaveda spark animation",
    left: [
      {
        word: "Proof",
        role: "Student",
        accent: "#60A5FA",
        icon: GraduationCap,
        backTitle: "Student",
        backBody:
          "Turn a rough idea into visible proof: feedback, teammates, badges, and experience you can actually show.",
      },
      {
        word: "Venture",
        role: "Founder",
        accent: "#C084FC",
        icon: Sparkles,
        backTitle: "Founder",
        backBody:
          "Give people one clear place to help, then turn interest into tracked progress on your venture.",
      },
    ],
    right: [
      {
        word: "Signal",
        role: "Investor",
        accent: "#34D399",
        icon: TrendingUp,
        backTitle: "Investor",
        backBody:
          "See traction before the pitch: who is helping, what is getting built, and where momentum is forming.",
      },
      {
        word: "Pipeline",
        role: "Incubator",
        accent: "#FBBF24",
        icon: BarChart3,
        backTitle: "Incubator",
        backBody:
          "Find coachable teams already taking action, so your support goes to progress instead of paperwork.",
      },
    ],
  },
  {
    question: "How does it work?",
    nextPrompt: "How can you benefit from it?",
    gif: "/landing-preview-assets/world-map.gif",
    gifAlt: "Ibhaveda world map gameplay interface",
    left: [
      {
        word: "Role",
        role: "Step 1",
        accent: "#60A5FA",
        icon: UserRound,
        backTitle: "Tell us who you are",
        backBody:
          "Student, founder, investor, or incubator. Ibhaveda then shows actions that match what you want to gain.",
      },
      {
        word: "Path",
        role: "Step 2",
        accent: "#C084FC",
        icon: MapPinned,
        backTitle: "Follow a guided path",
        backBody:
          "Your idea becomes simple stages with clear next moves, so you know what to do instead of guessing.",
      },
    ],
    right: [
      {
        word: "Prove",
        role: "Step 3",
        accent: "#34D399",
        icon: ShieldCheck,
        backTitle: "Earn trust",
        backBody:
          "Clear tasks with evidence. Proof makes collaborators, investors, and programs take you seriously.",
      },
      {
        word: "Unlock",
        role: "Step 4",
        accent: "#FBBF24",
        icon: LockKeyhole,
        backTitle: "Advance with momentum",
        backBody:
          "Stages open when signal is real, turning participation into visible venture growth.",
      },
    ],
  },
  {
    question: "How can you benefit from it?",
    nextPrompt: "How do you use it?",
    gif: "/landing-preview-assets/notifications-map.gif",
    gifAlt: "Ibhaveda notifications and map interface",
    left: [
      {
        word: "Cred",
        role: "Student",
        accent: "#60A5FA",
        icon: Star,
        backTitle: "Student upside",
        backBody:
          "Graduate with proof that you can spot problems, build, and contribute beyond coursework.",
      },
      {
        word: "Team",
        role: "Founder",
        accent: "#C084FC",
        icon: Users,
        backTitle: "Founder upside",
        backBody:
          "Stop building alone. Attract collaborators by showing exactly where help creates progress.",
      },
    ],
    right: [
      {
        word: "Edge",
        role: "Investor",
        accent: "#34D399",
        icon: Eye,
        backTitle: "Investor upside",
        backBody:
          "Get earlier access to ideas earning real activity, before the market sees a polished pitch.",
      },
      {
        word: "Cohort",
        role: "Incubator",
        accent: "#FBBF24",
        icon: Building2,
        backTitle: "Incubator upside",
        backBody:
          "Find teams already moving, then spend your support on momentum instead of paperwork.",
      },
    ],
  },
  {
    question: "How do you use it?",
    nextPrompt: "Ready to build with people?",
    gif: "/landing-preview-assets/fog-task.gif",
    gifAlt: "Ibhaveda task and challenge interface",
    left: [
      {
        word: "Start",
        role: "Path",
        accent: "#60A5FA",
        icon: Plus,
        backTitle: "Step one",
        backBody:
          "Choose your role. The experience starts with what you want to gain, not a blank feed.",
      },
      {
        word: "Post",
        role: "Idea",
        accent: "#C084FC",
        icon: SquarePen,
        backTitle: "Step two",
        backBody:
          "Post or join one idea. Ibhaveda turns attention into a concrete request for help.",
      },
    ],
    right: [
      {
        word: "Clear",
        role: "Tasks",
        accent: "#34D399",
        icon: CheckCheck,
        backTitle: "Step three",
        backBody:
          "Clear challenges with proof. Every action reduces doubt and increases your leverage.",
      },
      {
        word: "Level",
        role: "Up",
        accent: "#FBBF24",
        icon: ShieldCheck,
        backTitle: "Step four",
        backBody:
          "Return to the map to see progress, new signals, and the next move worth taking.",
      },
    ],
  },
];

function PixelField() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 12 }, (_, pixel) => (
        <span key={pixel} className={`lp-pixel lp-pixel-${pixel + 1}`} />
      ))}
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.4"
      />
    </svg>
  );
}

function AuthSlide({
  isFinal = false,
  onNext,
  onRoleSelect,
  onSignIn,
}: {
  isFinal?: boolean;
  onNext?: () => void;
  onRoleSelect: (role: RoleKey) => void;
  onSignIn: () => void;
}) {
  return (
    <div className="lp-shell">
      <div className="lp-top" />
      <div className="lp-auth-core">
        <button className="lp-member" type="button" onClick={onSignIn}>
          Already a member? <strong>Log in</strong>
        </button>
        <div className="lp-brand">
          <div className="lp-logo">
            <Image src="/ibhaveda-logo.jpg" alt="Ibhaveda" width={48} height={48} priority />
          </div>
          <p className="lp-brand-text">Ibhaveda</p>
        </div>
        <h1>Nobody&apos;s Building With You. Yet.</h1>
        <p className="lp-sub">Co-founders. Builders. Investors. Zero gatekeeping.</p>
        <div className="lp-path-label">Choose your path</div>
        <div className="lp-roles">
          {ROLES.map((role) => {
            const Icon = role.icon;

            return (
              <button
                key={role.key}
                className="lp-role"
                style={
                  {
                    "--accent": role.color,
                    "--glow": role.glow,
                  } as React.CSSProperties
                }
                type="button"
                aria-label={`Sign up as ${role.label}`}
                onClick={() => onRoleSelect(role.key)}
              >
                <span className="lp-role-inner">
                  <span>
                    <span className="lp-role-icon">
                      <Icon className="size-5" />
                    </span>
                    <p className="lp-role-kicker">{role.eyebrow}</p>
                    <p className="lp-role-name">{role.label}</p>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {!isFinal && (
        <div className="lp-bottom-question">
          <p>What is Ibhaveda?</p>
          <button className="lp-chevron" type="button" aria-label="Answer what is Ibhaveda" onClick={onNext}>
            <ChevronIcon />
          </button>
        </div>
      )}
    </div>
  );
}

function FlipTile({ tile, hint }: { tile: Tile; hint?: boolean }) {
  const [flipped, setFlipped] = useState(false);
  const Icon = tile.icon;

  return (
    <button
      className={`lp-flip-card ${flipped ? "is-flipped" : ""} ${hint ? "lp-hint" : ""}`}
      style={{ "--accent": tile.accent } as React.CSSProperties}
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        setFlipped((value) => !value);
      }}
    >
      <span className="lp-flip-inner">
        <span className="lp-flip-face lp-flip-front">
          <Icon className="lp-tile-icon" />
          <span className="lp-tile-word">{tile.word}</span>
          <span className="lp-tile-role">{tile.role}</span>
        </span>
        <span className="lp-flip-face lp-flip-back">
          <strong>{tile.backTitle}</strong>
          <span>{tile.backBody}</span>
        </span>
      </span>
    </button>
  );
}

function QuestionSlideView({
  slide,
  active,
  slideIndex,
  showGif,
  onNext,
}: {
  slide: QuestionSlide;
  active: boolean;
  slideIndex: number;
  showGif: boolean;
  onNext: () => void;
}) {
  return (
    <div className="lp-shell">
      <header className="lp-scene-header">
        <h2>{slide.question}</h2>
      </header>
      <div className="lp-scene-main">
        <div className="lp-card-stack lp-left">
          {slide.left.map((tile, index) => (
            <FlipTile key={`${slide.question}-${tile.word}`} tile={tile} hint={active && slideIndex === 0 && index === 0} />
          ))}
        </div>
        {showGif ? (
          <figure className="lp-capture">
            {/*
              PERF: These previews were 4 GIFs totalling 117 MB (world-map.gif
              alone is 63 MB), served un-optimized. We now render a <video>
              element pointing at MP4/WebM siblings that are ~5-10% of the
              GIF's size. When conversion has not been done yet the browser
              falls back to the .gif <img> in <picture>.

              To convert (run once on the host, then commit the mp4/webm):
                for f in public/landing-preview-assets/*.gif; do
                  ffmpeg -y -i "$f" -movflags +faststart -pix_fmt yuv420p \
                    -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -an \
                    "${f%.gif}.mp4"
                  ffmpeg -y -i "$f" -c:v libvpx-vp9 -b:v 0 -crf 34 -an \
                    "${f%.gif}.webm"
                done
              Expected weight: 117 MB → ~6 MB (95% reduction).
            */}
            <video
              key={slide.gif}
              className="lp-capture-media"
              width={300}
              height={533}
              autoPlay
              muted
              loop
              playsInline
              // DESKTOP PERF: was `preload="none"` which starved the
              // browser of dimensions + poster metadata until the user
              // interacted, so the media area briefly rendered black on
              // scroll-in and pushed LCP later. `metadata` fetches the
              // ~2 KB moov atom only — enough for the browser to hand
              // us a first frame — without pulling the full stream.
              preload="metadata"
              // Was `poster={slide.gif}` pointing at the ORIGINAL
              // multi-megabyte animated GIF (spark.gif 4.4 MB,
              // world-map.gif 63 MB before we converted them). Even
              // though preload="none" prevented the video body from
              // loading, the poster was still fetched full-size the
              // moment the <video> mounted. Swap to the .webp sibling
              // (5–40 KB typically) so the poster download itself
              // never dominates the page-weight budget.
              poster={slide.gif.replace(/\.gif$/, ".webp")}
              aria-label={slide.gifAlt}
            >
              <source src={slide.gif.replace(/\.gif$/, ".webm")} type="video/webm" />
              <source src={slide.gif.replace(/\.gif$/, ".mp4")} type="video/mp4" />
              {/* Fallback for browsers where MP4/WebM not yet converted. */}
              <Image src={slide.gif} alt={slide.gifAlt} width={300} height={533} unoptimized loading="lazy" />
            </video>
          </figure>
        ) : (
          <span className="lp-capture-placeholder" aria-hidden="true" />
        )}
        <div className="lp-card-stack lp-right">
          {slide.right.map((tile) => (
            <FlipTile key={`${slide.question}-${tile.word}`} tile={tile} />
          ))}
        </div>
      </div>
      <div className="lp-bottom-question">
        <p>{slide.nextPrompt}</p>
        <button className="lp-chevron" type="button" aria-label={`Continue to ${slide.nextPrompt}`} onClick={onNext}>
          <ChevronIcon />
        </button>
      </div>
    </div>
  );
}

export default function HeroSection() {
  const { isSignedIn, isLoaded } = useUser();
  const { openSignIn, openSignUp } = useAuthModal();
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [whoosh, setWhoosh] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const lockedRef = useRef(false);
  const touchStartRef = useRef(0);
  const slideCount = QUESTION_SLIDES.length + 2;

  useEffect(() => {
    const media = window.matchMedia("(max-width: 860px)");
    const sync = () => setIsCompact(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const setSelectedRole = useCallback((role: RoleKey) => {
    try {
      localStorage.setItem(SELECTED_ROLE_KEY, role);
    } catch {
      // Storage can be unavailable in strict browser modes.
    }
  }, []);

  // Clicks that arrived before Clerk answered, replayed once it does.
  const pendingRoleRef = useRef<RoleKey | null>(null);

  // All four cards run this same function -- there has never been any
  // per-role branching here, and the role we store is not read anywhere,
  // so it cannot change where anyone lands. What made this feel unreliable
  // for some cards and not others is a RACE, and it has nothing to do with
  // which card was pressed:
  //
  //   `useUser()` reports isSignedIn === undefined until Clerk finishes
  //   loading. Undefined is falsy, so a click landing in that window read
  //   as "signed out" and opened the sign-up modal at an already-signed-in
  //   user instead of sending them to the feed. Whether you hit that window
  //   depends only on how soon after page load you click.
  //
  // So: never decide while the answer is unknown. Remember the click and
  // replay it the moment Clerk reports, which also means the press is never
  // silently swallowed.
  const runRoleSelect = useCallback(
    (role: RoleKey, signedIn: boolean | undefined) => {
      if (signedIn) {
        router.push("/feed");
        return;
      }
      openSignUp();
    },
    [openSignUp, router],
  );

  const handleRoleSelect = useCallback(
    (role: RoleKey) => {
      // Store first either way -- the choice is worth keeping even if the
      // navigation has to wait a beat.
      setSelectedRole(role);
      if (!isLoaded) {
        pendingRoleRef.current = role;
        return;
      }
      runRoleSelect(role, isSignedIn);
    },
    [isLoaded, isSignedIn, runRoleSelect, setSelectedRole],
  );

  useEffect(() => {
    if (!isLoaded) return;
    const pending = pendingRoleRef.current;
    if (!pending) return;
    pendingRoleRef.current = null;
    runRoleSelect(pending, isSignedIn);
  }, [isLoaded, isSignedIn, runRoleSelect]);

  const go = useCallback(
    (next: number) => {
      const bounded = Math.max(0, Math.min(slideCount - 1, next));
      if (bounded === index || lockedRef.current) return;
      lockedRef.current = true;
      setWhoosh(true);
      setIndex(bounded);
      window.setTimeout(() => {
        setWhoosh(false);
        lockedRef.current = false;
      }, 820);
    },
    [index, slideCount],
  );

  const handleWheel = useCallback(
    (event: React.WheelEvent<HTMLElement>) => {
      if (Math.abs(event.deltaY) < 26) return;
      event.preventDefault();
      go(index + (event.deltaY > 0 ? 1 : -1));
    },
    [go, index],
  );

  const handleTouchStart = useCallback((event: React.TouchEvent<HTMLElement>) => {
    touchStartRef.current = event.touches[0]?.clientY ?? 0;
  }, []);

  const handleTouchEnd = useCallback(
    (event: React.TouchEvent<HTMLElement>) => {
      const delta = touchStartRef.current - (event.changedTouches[0]?.clientY ?? 0);
      if (Math.abs(delta) < 42) return;
      go(index + (delta > 0 ? 1 : -1));
    },
    [go, index],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (["ArrowDown", "PageDown", " "].includes(event.key)) {
        event.preventDefault();
        go(index + 1);
      }
      if (["ArrowUp", "PageUp"].includes(event.key)) {
        event.preventDefault();
        go(index - 1);
      }
    },
    [go, index],
  );

  const slides = useMemo(
    () => [
      <AuthSlide key="intro" onNext={() => go(1)} onRoleSelect={handleRoleSelect} onSignIn={openSignIn} />,
      ...QUESTION_SLIDES.map((slide, questionIndex) => (
        <QuestionSlideView
          key={slide.question}
          slide={slide}
          active={index === questionIndex + 1}
          slideIndex={questionIndex}
          // PERF: was `<= 1` which pre-loaded the neighboring slide's GIF
          // too — with 63MB world-map.gif that meant loading up to 88 MB
          // in advance. Now only the CURRENT slide's preview is fetched.
          showGif={!isCompact && index > 0 && index < slideCount - 1 && index === questionIndex + 1}
          onNext={() => go(questionIndex + 2)}
        />
      )),
      <AuthSlide key="final" isFinal onRoleSelect={handleRoleSelect} onSignIn={openSignIn} />,
    ],
    [go, handleRoleSelect, index, isCompact, openSignIn, slideCount],
  );

  return (
    <>
      {/* Styles now live in ./hero-section.css (imported at the top of
          this file) instead of an inline <style>{LANDING_STYLES}</style>.
          See that import for why. */}
      <main
        className="lp-page"
        aria-label="Ibhaveda landing page"
        tabIndex={-1}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onKeyDown={handleKeyDown}
      >
        <div className="lp-grid" />
        <PixelField />
        <div className={`lp-deck ${whoosh ? "lp-whoosh" : ""}`} style={{ transform: `translateY(${-index * 100}dvh)` }}>
          {slides.map((slide, slideIndex) => (
            <section key={slide.key ?? slideIndex} className={`lp-slide ${slideIndex === index ? "is-active" : ""}`}>
              {slide}
            </section>
          ))}
        </div>
      </main>
    </>
  );
}
