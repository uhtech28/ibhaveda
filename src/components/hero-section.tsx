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
  const { isSignedIn } = useUser();
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

  const handleRoleSelect = useCallback(
    (role: RoleKey) => {
      setSelectedRole(role);
      if (isSignedIn) {
        router.push("/feed");
        return;
      }
      openSignUp();
    },
    [isSignedIn, openSignUp, router, setSelectedRole],
  );

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
      <style>{LANDING_STYLES}</style>
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

const LANDING_STYLES = `
  .lp-page {
    --bg: #070a0f;
    --panel: #0b111a;
    --line: rgba(255,255,255,0.12);
    --muted: #a8b2c6;
    --gold: #f7d66d;
    --blue: #60a5fa;
    --green: #34d399;
    --purple: #c084fc;
    --yellow: #fbbf24;
    --white: #f8fafc;
    /* LCP FIX 2026-08-21: dropped JetBrains Mono (via --font-code) in favor
       of a pure system-mono stack. Waiting for the web font to download
       pushed H1's final paint to ~5s on slow mobile and Chrome re-fired LCP
       at the font-swap moment. System stack paints at FCP time. */
    --rpg-display: ui-monospace, "SFMono-Regular", Menlo, Consolas, "Liberation Mono", monospace;
    position: relative;
    height: 100dvh;
    overflow: hidden;
    background:
      radial-gradient(circle at 50% 18%, rgba(247,214,109,0.08), transparent 26%),
      radial-gradient(circle at 76% 74%, rgba(124,58,237,0.12), transparent 30%),
      radial-gradient(circle at 24% 60%, rgba(228,138,166,0.06), transparent 26%),
      var(--bg);
    color: var(--white);
  }

  .lp-grid {
    pointer-events: none;
    position: absolute;
    inset: 0;
    opacity: 0.055;
    background-image:
      linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px);
    background-size: 42px 42px;
  }

  .lp-pixel {
    position: absolute;
    width: 7px;
    height: 7px;
    opacity: 0;
    animation: lp-drift 5.2s ease-in-out infinite;
  }

  .lp-pixel-1 { left: 7%; top: 18%; background: var(--gold); animation-delay: 0ms; }
  .lp-pixel-2 { left: 18%; top: 77%; background: #e48aa6; animation-delay: 330ms; }
  .lp-pixel-3 { left: 41%; top: 12%; background: #45d5ff; animation-delay: 740ms; }
  .lp-pixel-4 { left: 63%; top: 80%; background: var(--green); animation-delay: 1080ms; }
  .lp-pixel-5 { left: 78%; top: 19%; background: var(--purple); animation-delay: 1450ms; }
  .lp-pixel-6 { left: 91%; top: 58%; background: var(--gold); animation-delay: 1880ms; }
  .lp-pixel-7 { left: 12%; top: 48%; background: var(--green); animation-delay: 420ms; }
  .lp-pixel-8 { left: 27%; top: 31%; background: var(--purple); animation-delay: 980ms; }
  .lp-pixel-9 { left: 52%; top: 69%; background: #e48aa6; animation-delay: 1320ms; }
  .lp-pixel-10 { left: 69%; top: 39%; background: var(--gold); animation-delay: 1760ms; }
  .lp-pixel-11 { left: 84%; top: 83%; background: #45d5ff; animation-delay: 2140ms; }
  .lp-pixel-12 { left: 36%; top: 88%; background: var(--green); animation-delay: 2520ms; }

  .lp-deck {
    height: 100dvh;
    transition: transform 760ms cubic-bezier(0.76, 0, 0.24, 1);
    will-change: transform;
  }

  .lp-whoosh .lp-scene-main,
  .lp-whoosh .lp-auth-core {
    filter: blur(3px);
    transform: translateY(-10px) scale(0.985);
  }

  .lp-slide {
    position: relative;
    height: 100dvh;
    display: grid;
    place-items: center;
    padding: clamp(14px, 3vw, 42px);
    overflow: hidden;
  }

  .lp-shell {
    position: relative;
    z-index: 2;
    width: min(1180px, 100%);
    height: min(820px, calc(100dvh - 28px));
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
    align-items: center;
  }

  .lp-top { min-height: 44px; }

  .lp-brand {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }

  .lp-logo {
    width: 48px;
    height: 48px;
    overflow: hidden;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: #000;
    box-shadow: 0 0 60px rgba(247,214,109,0.13);
    animation: lp-logo-pulse 2.4s ease-in-out infinite;
  }

  .lp-logo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .lp-brand-text,
  .lp-path-label,
  .lp-role-kicker,
  .lp-tile-role {
    font-family: var(--font-body), ui-sans-serif, system-ui, sans-serif;
    letter-spacing: 0.34em;
    text-transform: uppercase;
  }

  .lp-brand-text {
    margin: 0;
    color: var(--gold);
    font-size: 10px;
    font-weight: 900;
  }

  .lp-auth-core,
  .lp-scene-main {
    transition: filter 420ms ease, transform 420ms ease, opacity 520ms ease;
  }

  .lp-auth-core {
    display: grid;
    gap: clamp(12px, 2.4vw, 24px);
    justify-items: center;
    text-align: center;
    transform: translateY(-22px);
  }

  .lp-member {
    background: transparent;
    color: var(--muted);
    cursor: pointer;
    font-size: 14px;
  }

  .lp-member strong { color: var(--gold); }

  .lp-page h1,
  .lp-page h2 {
    margin: 0;
    font-family: var(--rpg-display);
    font-weight: 700;
    letter-spacing: 0;
    line-height: 1.1;
    text-shadow: 0 2px 0 rgba(0,0,0,0.72), 1px 0 0 rgba(96,165,250,0.2);
  }

  .lp-page h1 {
    max-width: 850px;
    font-size: clamp(34px, 7vw, 78px);
  }

  .lp-page h2 {
    max-width: 920px;
    font-size: clamp(28px, 5vw, 58px);
    text-align: center;
  }

  .lp-sub {
    margin: -12px 0 0;
    color: #cbd5e1;
    font-size: clamp(14px, 1.8vw, 17px);
    line-height: 1.5;
  }

  .lp-path-label {
    display: flex;
    align-items: center;
    gap: 13px;
    width: min(520px, 100%);
    color: var(--gold);
    font-size: 10px;
    font-weight: 900;
  }

  .lp-path-label::before,
  .lp-path-label::after {
    content: "";
    height: 1px;
    flex: 1;
    background: rgba(255,255,255,0.1);
  }

  .lp-roles {
    width: min(900px, 100%);
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }

  .lp-role {
    position: relative;
    aspect-ratio: 1;
    overflow: hidden;
    border: 1px solid var(--line);
    border-radius: 20px;
    background: var(--panel);
    cursor: pointer;
    color: white;
    padding: 16px;
    /* LCP FIX 2026-08-21: previous animation faded from opacity 0 which made
       these cards (the largest above-fold painted elements on mobile) invisible
       until after React hydration finished. On slow 4G + Moto G Power that
       pushed LCP to 5.6s. Transform-only entry keeps polish without gating
       LCP on the hydration + animation clock. */
    animation: lp-card-in-transform 480ms ease both;
  }

  .lp-role:nth-child(2) { animation-delay: 80ms; }
  .lp-role:nth-child(3) { animation-delay: 160ms; }
  .lp-role:nth-child(4) { animation-delay: 240ms; }

  .lp-role::before,
  .lp-flip-card::before {
    content: "";
    position: absolute;
    inset: 0;
    opacity: 0.09;
    background-image:
      linear-gradient(rgba(255,255,255,0.09) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.09) 1px, transparent 1px);
    background-size: 18px 18px;
  }

  .lp-role::after {
    content: "";
    position: absolute;
    width: 70%;
    aspect-ratio: 1;
    right: -26%;
    top: -18%;
    border-radius: 50%;
    background: var(--glow);
    filter: blur(22px);
  }

  .lp-role:hover,
  .lp-role:focus-visible {
    outline: none;
    border-color: color-mix(in srgb, var(--accent) 72%, white 6%);
    box-shadow: 0 0 28px color-mix(in srgb, var(--accent) 26%, transparent);
    transform: translateY(-3px);
  }

  .lp-role-inner {
    position: relative;
    z-index: 1;
    display: grid;
    place-items: center;
    height: 100%;
    text-align: center;
  }

  .lp-role-icon {
    display: grid;
    place-items: center;
    width: 46px;
    height: 46px;
    margin: 0 auto 24px;
    border: 1px solid color-mix(in srgb, var(--accent) 28%, white 8%);
    border-radius: 14px;
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 14%, transparent);
  }

  .lp-role-kicker {
    margin: 0 0 8px;
    color: var(--accent);
    font-size: 10px;
    font-weight: 900;
  }

  .lp-role-name {
    margin: 0;
    font-family: var(--rpg-display);
    font-size: clamp(20px, 2.4vw, 28px);
    font-weight: 700;
    line-height: 1;
  }

  .lp-scene-header {
    display: grid;
    place-items: center;
    min-height: 110px;
  }

  .lp-scene-header::after {
    content: "";
    width: 9px;
    height: 9px;
    margin-top: 18px;
    background: #45d5ff;
  }

  .lp-scene-main {
    display: grid;
    grid-template-columns: minmax(220px, 1fr) minmax(220px, 300px) minmax(220px, 1fr);
    align-items: center;
    gap: clamp(16px, 3vw, 34px);
  }

  .lp-card-stack {
    display: grid;
    gap: 14px;
  }

  .lp-capture {
    position: relative;
    width: min(300px, 26vw);
    aspect-ratio: 9 / 16;
    margin: 0;
    overflow: hidden;
    border: 1px solid var(--line);
    border-radius: 22px;
    background: #05070b;
    box-shadow: 0 28px 90px rgba(0,0,0,0.45), 0 0 70px rgba(124,58,237,0.12);
  }

  .lp-capture img,
  .lp-capture video,
  .lp-capture-media {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .lp-capture-placeholder {
    display: block;
    width: min(300px, 26vw);
    aspect-ratio: 9 / 16;
  }

  .lp-flip-card {
    display: block;
    position: relative;
    width: 100%;
    min-height: 138px;
    perspective: 900px;
    border-radius: 18px;
    cursor: pointer;
    background: transparent;
    color: white;
    padding: 0;
    text-align: left;
  }

  .lp-hint { animation: lp-tap-hint 1.75s ease-in-out 3; }

  .lp-flip-inner {
    display: block;
    position: relative;
    z-index: 1;
    width: 100%;
    min-height: 138px;
    border-radius: 18px;
    transition: transform 420ms cubic-bezier(0.2, 0.8, 0.2, 1);
    transform-style: preserve-3d;
  }

  .lp-flip-card:hover .lp-flip-inner,
  .lp-flip-card:focus-visible .lp-flip-inner,
  .lp-flip-card.is-flipped .lp-flip-inner {
    transform: rotateY(180deg);
  }

  .lp-flip-face {
    position: absolute;
    inset: 0;
    display: grid;
    align-content: center;
    justify-items: center;
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 18px;
    background:
      radial-gradient(circle at 78% 20%, color-mix(in srgb, var(--accent) 20%, transparent), transparent 36%),
      rgba(11,17,26,0.86);
    overflow: hidden;
    opacity: 1;
    visibility: visible;
    pointer-events: none;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
    padding: 16px;
  }

  .lp-flip-front {
    z-index: 2;
    transform: rotateY(0deg);
  }

  .lp-flip-face::before {
    content: "";
    position: absolute;
    inset: 0;
    opacity: 0.08;
    background-image:
      linear-gradient(rgba(255,255,255,0.09) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.09) 1px, transparent 1px);
    background-size: 18px 18px;
  }

  .lp-flip-back {
    z-index: 3;
    align-content: center;
    justify-items: center;
    text-align: center;
    transform: rotateY(180deg);
    background:
      radial-gradient(circle at 50% 18%, color-mix(in srgb, var(--accent) 18%, transparent), transparent 38%),
      #0b111a;
  }

  .lp-tile-icon {
    position: relative;
    z-index: 1;
    width: 42px;
    height: 42px;
    margin-bottom: 12px;
    color: var(--accent);
    filter: drop-shadow(0 0 12px color-mix(in srgb, var(--accent) 32%, transparent));
  }

  .lp-tile-word {
    position: relative;
    z-index: 1;
    display: block;
    font-family: var(--rpg-display);
    font-size: clamp(26px, 2.8vw, 38px);
    font-weight: 700;
    line-height: 1;
    text-align: center;
  }

  .lp-tile-role {
    position: relative;
    z-index: 1;
    display: block;
    margin-top: 8px;
    color: var(--accent);
    font-size: 8px;
    font-weight: 900;
  }

  .lp-flip-back strong {
    position: relative;
    z-index: 1;
    color: var(--accent);
    font-family: var(--rpg-display);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0;
    text-align: center;
    text-transform: uppercase;
  }

  .lp-flip-back span {
    position: relative;
    z-index: 1;
    display: block;
    max-width: 28ch;
    margin-top: 10px;
    color: #f8fafc;
    font-family: var(--rpg-display);
    font-size: 13px;
    font-weight: 500;
    line-height: 1.36;
    text-align: center;
  }

  .lp-bottom-question {
    display: grid;
    justify-items: center;
    align-content: end;
    min-height: 104px;
    gap: 2px;
    transform: translateY(-10px);
  }

  .lp-bottom-question p {
    margin: 0;
    font-family: var(--rpg-display);
    font-size: clamp(24px, 3.4vw, 38px);
    font-weight: 700;
    line-height: 1.05;
    text-align: center;
    text-shadow: 0 3px 0 rgba(0,0,0,0.42);
  }

  .lp-chevron {
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    color: #f8fafc;
    background: transparent;
    cursor: pointer;
    animation: lp-bounce 1.25s ease-in-out infinite;
  }

  .lp-chevron svg {
    width: 26px;
    height: 26px;
  }

  .lp-chevron:hover,
  .lp-chevron:focus-visible {
    outline: none;
    color: var(--gold);
  }

  @keyframes lp-drift {
    from { opacity: 0.26; transform: translate3d(0,0,0) scale(1); }
    50% { opacity: 0.78; }
    to { opacity: 0; transform: translate3d(28px,-44px,0) scale(0.78); }
  }

  @keyframes lp-logo-pulse {
    0%,100% { box-shadow: 0 0 0 rgba(247,214,109,0), 0 0 60px rgba(124,58,237,0.12); }
    50% { box-shadow: 0 0 36px rgba(247,214,109,0.12), 0 0 100px rgba(124,58,237,0.20); }
  }

  @keyframes lp-card-in {
    from { opacity: 0; transform: translateY(10px) scale(0.97); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  /* LCP FIX: transform-only entry — keeps polish, doesn't gate LCP on the
     hydration+animation clock. Cards paint at opacity: 1 immediately. */
  @keyframes lp-card-in-transform {
    from { transform: translateY(6px) scale(0.985); }
    to { transform: translateY(0) scale(1); }
  }

  @keyframes lp-bounce {
    0%, 100% { transform: translateY(-2px); opacity: 0.82; }
    50% { transform: translateY(3px); opacity: 1; }
  }

  @keyframes lp-tap-hint {
    0%, 100% { transform: translateY(0) scale(1); }
    45% { transform: translateY(-5px) scale(1.025); }
  }

  @media (max-width: 980px) {
    .lp-roles { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .lp-role { aspect-ratio: 1.28; }
  }

  @media (max-width: 860px) {
    .lp-slide { padding: 4px 12px; }
    .lp-shell {
      height: 100dvh;
      grid-template-rows: auto minmax(0, 1fr) auto;
      /* NOTE: no backticks in these comments — this whole block lives
         inside a styled-jsx template literal, so one would terminate
         the string and silently drop every rule after it.

         Was inheriting align-items:center from the base rule. On a
         short viewport the auth-core stack (brand + headline + sub +
         path label + 2x2 role grid) is TALLER than its 1fr track, and
         a centered grid item overflows its track symmetrically: half
         above, half below. That put the role cards on top of the
         "What is Ibhaveda?" prompt and simultaneously clipped the
         "Already a member?" link off the top edge. Stretching pins the
         item to its track so the overflow rule below can contain it. */
      align-items: stretch;
    }
    .lp-top { min-height: 8px; }
    .lp-auth-core {
      gap: clamp(8px, 1.7dvh, 14px);
      /* min-height:0 lets the 1fr track actually shrink this item —
         without it the track floors at min-content and pushes past the
         shell no matter what align-items says. align-content keeps the
         stack optically centred now that the box fills its row. */
      min-height: 0;
      /* "safe" is load-bearing: plain center on an overflowing grid
         clips BOTH ends, which is what cut the "Already a member?"
         line off the top. safe centre falls back to start the moment
         the content stops fitting, so overflow only ever goes one way
         (downward, into the scroll area) and nothing is unreachable.
         Plain center first as the fallback for older engines. */
      align-content: center;
      align-content: safe center;
      /* Safety net for viewports too short even for the height-aware
         type scale below: the stack scrolls WITHIN its own row rather
         than spilling onto its neighbours. Scrollbar hidden so it
         reads as a hero, not a scroll pane. */
      overflow-y: auto;
      overscroll-behavior: contain;
      scrollbar-width: none;
      /* Optical nudge no longer needed — align-content centres it, and
         the -8px was pushing the top line under the viewport edge. */
      transform: none;
    }
    .lp-auth-core::-webkit-scrollbar { display: none; }
    .lp-member { font-size: 13px; }
    .lp-logo { width: 48px; height: 48px; }
    /* Sized off WIDTH only (12vw) before, which is why a short phone
       still rendered a ~47px headline wrapping to 3-4 lines and blew
       the height budget. min() adds a height ceiling so the headline
       scales down on short viewports instead of pushing the stack
       into the prompt below. */
    .lp-page h1 {
      font-size: clamp(30px, min(12vw, 7.4dvh), 56px);
      max-width: 520px;
    }
    .lp-sub { max-width: 310px; font-weight: 800; text-align: center; }
    .lp-path-label { width: 100%; font-size: 9px; gap: 10px; }
    .lp-roles { width: 100%; gap: 12px; }
    .lp-role { aspect-ratio: 1.45; border-radius: 16px; padding: 12px; }
    .lp-role-inner > span { transform: translateY(-6px); }
    .lp-role-icon { width: 40px; height: 40px; margin-bottom: 8px; }
    .lp-role-kicker { margin-bottom: 5px; }
    .lp-role-name { font-size: 22px; line-height: 1; }
    .lp-scene-header {
      min-height: 112px;
      align-content: center;
      transform: translateY(14px);
    }
    .lp-scene-header::after { width: 8px; height: 8px; margin-top: 15px; }
    .lp-page h2 { font-size: clamp(32px, 8.5vw, 46px); }
    .lp-scene-main {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
      align-content: center;
      transform: translateY(-6px);
    }
    .lp-card-stack { display: contents; }
    .lp-left { order: 1; }
    .lp-right { order: 2; }
    .lp-capture,
    .lp-capture-placeholder {
      order: 1;
      width: min(215px, 56vw);
      max-height: 36dvh;
      display: none;
    }
    .lp-flip-card,
    .lp-flip-inner { min-height: clamp(152px, 23dvh, 196px); }
    .lp-flip-face { border-radius: 14px; padding: 12px; }
    .lp-tile-icon { width: 34px; height: 34px; margin-bottom: 8px; }
    .lp-tile-word { font-size: 24px; }
    .lp-tile-role {
      margin-top: 6px;
      font-size: 7px;
      letter-spacing: 0.16em;
    }
    .lp-flip-back strong {
      font-size: 9px;
      letter-spacing: 0.13em;
    }
    .lp-flip-back span {
      margin-top: 8px;
      font-size: 12px;
      line-height: 1.24;
    }
    .lp-bottom-question {
      min-height: 118px;
      gap: 0;
      align-content: center;
      transform: translateY(-20px);
    }
    .lp-bottom-question p { font-size: clamp(23px, 6.5vw, 29px); }
    .lp-slide:first-child .lp-bottom-question {
      min-height: 96px;
      /* Was translateY(-8px), which lifted the prompt 8px INTO the
         role cards above it — the last 8px of the collision. The row
         is already tight; it doesn't need pulling closer. */
      transform: none;
    }
  }

  @media (max-width: 380px) {
    .lp-capture,
    .lp-capture-placeholder { width: min(195px, 54vw); }
    .lp-flip-card,
    .lp-flip-inner { min-height: clamp(118px, 18dvh, 142px); }
    .lp-scene-header {
      min-height: 94px;
      transform: translateY(10px);
    }
    .lp-bottom-question {
      min-height: 98px;
      gap: 0;
      transform: translateY(-20px);
    }
    .lp-slide:first-child .lp-bottom-question {
      min-height: 82px;
      transform: translateY(-16px);
    }
    .lp-role-inner > span { transform: translateY(-8px); }
    .lp-role-icon { width: 34px; height: 34px; margin-bottom: 6px; }
    .lp-role-kicker { margin-bottom: 4px; font-size: 7px; }
    .lp-role-name { font-size: 19px; line-height: 1; }
    .lp-tile-word { font-size: 20px; }
    .lp-flip-back span {
      font-size: 9.5px;
      line-height: 1.16;
      margin-top: 5px;
    }
    .lp-flip-back strong {
      font-size: 7.5px;
      letter-spacing: 0.1em;
    }
  }

  /* SHORT viewports, any phone width. This is the case the mobile
     breakpoint alone missed: a phone in Safari with its address bar
     showing has the full ~390px of width but only ~660px of height,
     so every width-based clamp above still renders at full size and
     the stack overflows its row. Symptom was the role cards landing
     on top of the "What is Ibhaveda?" prompt.

     The containment rules further up mean overflow can no longer
     collide with anything, but scrolling a hero is a poor substitute
     for fitting. So trim the two biggest height contributors, the
     headline and the role tiles, and the stack fits outright.
     Placed last so it wins over the width-only blocks above. */
  @media (max-width: 860px) and (max-height: 720px) {
    .lp-page h1 { font-size: clamp(28px, min(11vw, 6.2dvh), 44px); }
    .lp-sub { font-size: 13px; }
    /* max-width matters on WIDE-but-short viewports (a tablet in
       landscape, a resized desktop window). The tiles are sized by
       aspect-ratio, so at 768px the grid gave each one 366px of width
       and therefore ~205px of height — two rows of that do not fit in
       700px and the bottom row got cut. Capping the grid keeps the
       tiles phone-sized regardless of how wide the window is. No
       effect on real phones, which are narrower than the cap. */
    .lp-roles { gap: 10px; max-width: 420px; margin-inline: auto; }
    .lp-role { aspect-ratio: 1.78; padding: 10px; }
    .lp-role-icon { width: 34px; height: 34px; margin-bottom: 6px; }
    .lp-role-kicker { margin-bottom: 4px; }
    .lp-role-name { font-size: 19px; }
    .lp-bottom-question,
    .lp-slide:first-child .lp-bottom-question {
      min-height: 78px;
      transform: none;
    }
  }
`;
