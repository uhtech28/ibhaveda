"use client";

import React, { useEffect, useState } from "react";
import {
  Lightbulb,
  Sparkles,
  Search,
  ArrowRight,
  Check,
  Castle,
  Trees,
  Swords,
  Hammer,
  Pickaxe,
  Anchor,
} from "lucide-react";

const INTRO_FLAG = "ii.introSeen.v2";

/**
 * Cinematic 4-phase intro animation, blended with the existing landing
 * background (same #0A0D12 base + indigo radial glow). Plays once per
 * browser; returning visitors skip straight to the landing page.
 *
 * Phase 1 — The Hook
 *   Lightbulb glows in → "What if building your startup felt like
 *   playing a video game?" → struck-through pain points → "Interactive
 *   Ideas changes that." pill.
 *
 * Phase 2 — Platform Interface & Idea Submission
 *   Mock dashboard slides up (sidebar + profile + composer typing
 *   "AI-Powered Study Planner").
 *
 * Phase 3 — Collaborator Matchmaking
 *   "Scanning for matches…" → three suggested collaborator cards →
 *   "AI finds your dream team. You just connect."
 *
 * Phase 4 — Venture Quest Map
 *   Horizontal 6-stage map (Village → Forest → Arena → Artisan's Quarter
 *   → Mine → Harbour) with checkpoints lighting up.
 *
 * Closing
 *   Brand mark + tagline + stats (76+ Builders · Free to Join · 8 Quest
 *   Stages) + "Start Your Quest →" CTA, then fade out.
 */
export default function LandingIntro() {
  const [active, setActive] = useState<boolean | null>(null);
  const [stage, setStage] = useState(0);
  const [closing, setClosing] = useState(false);

  // Decide whether to play. Returning visitors skip entirely.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      setActive(!window.localStorage.getItem(INTRO_FLAG));
    } catch {
      setActive(true);
    }
  }, []);

  // Stage timeline (ms from mount). Tight enough to keep attention.
  useEffect(() => {
    if (!active) return;
    const t: { at: number; s: number }[] = [
      { at: 200, s: 1 }, // P1: bulb in
      { at: 1200, s: 2 }, // P1: question in
      { at: 3800, s: 3 }, // P1: problems appear
      { at: 4600, s: 4 }, // P1: strike line 1
      { at: 5400, s: 5 }, // P1: strike line 2
      { at: 6200, s: 6 }, // P1: changes-that pill
      { at: 8800, s: 7 }, // P2: dashboard reveal
      { at: 11200, s: 8 }, // P2: composer focus + typing
      { at: 14400, s: 9 }, // P3: scanning
      { at: 15600, s: 10 }, // P3: collaborator cards
      { at: 18800, s: 11 }, // P3: tagline
      { at: 20800, s: 12 }, // P4: quest map
      { at: 22400, s: 13 }, // P4: stage progress 1
      { at: 23400, s: 14 }, // P4: stage progress 2
      { at: 24400, s: 15 }, // P4: stage progress 3
      { at: 25600, s: 16 }, // P4: tagline "Defeat monsters…"
      { at: 27600, s: 17 }, // Closing — briefly visible
      { at: 28200, s: 18 }, // Begin closing fade after ~600ms so users
                            // don't get a chance to click a fake CTA
    ];
    const timers = t.map(({ at, s }) =>
      window.setTimeout(() => setStage(s), at)
    );
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [active]);

  useEffect(() => {
    if (stage !== 18) return;
    setClosing(true);
    const id = window.setTimeout(() => finish(), 900);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  const finish = () => {
    try {
      window.localStorage.setItem(INTRO_FLAG, "1");
    } catch {
      /* noop */
    }
    setActive(false);
  };

  const skip = () => {
    setClosing(true);
    window.setTimeout(finish, 350);
  };

  if (active !== true) return null;

  // Match the body background (--color-background = #0A0D12) plus the
  // top indigo radial glow already used elsewhere on the site, so the
  // intro feels like a continuation of the landing page rather than a
  // separate splash screen.
  const backdrop =
    "radial-gradient(60% 45% at 50% 28%, rgba(99,102,241,0.18), transparent 60%), radial-gradient(50% 40% at 78% 78%, rgba(139,92,246,0.10), transparent 65%), linear-gradient(180deg, #0A0D12 0%, #060810 100%)";

  return (
    <div
      role="dialog"
      aria-label="Interactive Ideas intro"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: backdrop,
        opacity: closing ? 0 : 1,
        transition: "opacity 700ms cubic-bezier(0.4, 0, 0.2, 1)",
        pointerEvents: closing ? "none" : "auto",
        overflow: "hidden",
        fontFamily: "var(--font-display), system-ui, sans-serif",
        color: "#F9FAFB",
      }}
    >
      {/* Progress bar — bottom edge, tracks total runtime. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 2,
          background: "rgba(255,255,255,0.06)",
        }}
      >
        <div
          style={{
            height: "100%",
            width: "0%",
            background:
              "linear-gradient(90deg, #6366F1 0%, #8B5CF6 50%, #A78BFA 100%)",
            animation: "ii-progress 32s linear forwards",
            boxShadow: "0 0 12px rgba(99,102,241,0.6)",
          }}
        />
      </div>

      {/* Skip */}
      <button
        type="button"
        onClick={skip}
        style={{
          position: "absolute",
          top: 24,
          right: 24,
          zIndex: 10,
          padding: "8px 16px",
          borderRadius: 9999,
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(255,255,255,0.03)",
          color: "rgba(255,255,255,0.78)",
          fontSize: 13,
          fontWeight: 500,
          cursor: "pointer",
          backdropFilter: "blur(12px)",
          letterSpacing: "0.01em",
        }}
      >
        Skip intro →
      </button>

      {/* Stage container — pointer-events:none so it never blocks the skip button */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 20px",
          pointerEvents: "none",
        }}
      >
        {/* === PHASE 1: HOOK === */}
        {stage < 7 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 28,
              textAlign: "center",
              maxWidth: 880,
            }}
          >
            {stage < 3 && (
              <>
                <Bulb visible={stage >= 1} />
                <Headline visible={stage >= 2}>
                  <span style={{ color: "#F9FAFB" }}>
                    What if building your startup
                  </span>
                  <br />
                  <span style={GRADIENT_TEXT}>
                    felt like playing a video game?
                  </span>
                </Headline>
              </>
            )}

            {stage >= 3 && stage < 6 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  alignItems: "center",
                }}
              >
                <ProblemLine
                  visible={stage >= 3}
                  struck={stage >= 4}
                  text="Traditional incubators? Gatekept."
                />
                <ProblemLine
                  visible={stage >= 3}
                  struck={stage >= 5}
                  text="Ideas stuck in group chats. Going nowhere."
                />
              </div>
            )}

            {stage === 6 && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "16px 28px",
                  borderRadius: 14,
                  border: "1px solid rgba(99,102,241,0.45)",
                  background:
                    "linear-gradient(135deg, rgba(99,102,241,0.20), rgba(139,92,246,0.16))",
                  boxShadow:
                    "0 0 50px rgba(99,102,241,0.40), 0 0 120px rgba(99,102,241,0.18)",
                  animation: "ii-pop 700ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                }}
              >
                <Sparkles
                  style={{ width: 22, height: 22, color: "#C7D2FE" }}
                />
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: "clamp(20px, 3vw, 32px)",
                    background:
                      "linear-gradient(90deg, #C7D2FE, #DDD6FE 60%, #F0ABFC)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Interactive Ideas changes that.
                </span>
              </div>
            )}
          </div>
        )}

        {/* === PHASE 2: PLATFORM INTERFACE === */}
        {stage >= 7 && stage < 9 && <PlatformMockup typing={stage >= 8} />}

        {/* === PHASE 3: COLLABORATOR MATCHMAKING === */}
        {stage >= 9 && stage < 12 && (
          <MatchmakingPanel
            scanning={stage === 9}
            showCards={stage >= 10}
            showTagline={stage >= 11}
          />
        )}

        {/* === PHASE 4: VENTURE QUEST MAP === */}
        {stage >= 12 && stage < 17 && (
          <QuestMap completed={stage - 12} taglineVisible={stage >= 16} />
        )}

        {/* === CLOSING === */}
        {stage >= 17 && <ClosingCard />}
      </div>

      <style>{`
        @keyframes ii-pop {
          0% { opacity: 0; transform: scale(0.92); }
          60% { opacity: 1; transform: scale(1.03); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes ii-fade-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ii-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes ii-bulb-pulse {
          0%, 100% { box-shadow: 0 0 50px rgba(99,102,241,0.45), 0 0 120px rgba(99,102,241,0.18); }
          50%      { box-shadow: 0 0 70px rgba(99,102,241,0.65), 0 0 160px rgba(99,102,241,0.30); }
        }
        @keyframes ii-progress {
          from { width: 0%; }
          to   { width: 100%; }
        }
        @keyframes ii-caret {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        @keyframes ii-scan {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes ii-checkpoint-pop {
          0%   { transform: scale(0.4); opacity: 0; }
          60%  { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* =========================================================
   Shared style objects
   ========================================================= */

const GRADIENT_TEXT: React.CSSProperties = {
  background:
    "linear-gradient(90deg, #C7D2FE 0%, #DDD6FE 50%, #F0ABFC 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};

const CARD_SURFACE: React.CSSProperties = {
  background: "rgba(17, 24, 39, 0.65)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 16,
  backdropFilter: "blur(8px)",
  boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
};

/* =========================================================
   Phase 1 helpers
   ========================================================= */

function Bulb({ visible }: { visible: boolean }) {
  return (
    <div
      style={{
        width: 84,
        height: 84,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #6366F1 0%, #8B5CF6 60%, #A78BFA 100%)",
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1)" : "scale(0.6)",
        transition:
          "opacity 700ms cubic-bezier(0.34, 1.56, 0.64, 1), transform 700ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        animation: visible ? "ii-bulb-pulse 2400ms ease-in-out infinite" : undefined,
      }}
    >
      <Lightbulb style={{ width: 40, height: 40, color: "#FDE68A", fill: "#FBBF24" }} />
    </div>
  );
}

function Headline({
  visible,
  children,
}: {
  visible: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        fontWeight: 700,
        lineHeight: 1.18,
        letterSpacing: "-0.02em",
        fontSize: "clamp(28px, 4.5vw, 54px)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 700ms ease, transform 700ms ease",
        filter: visible ? "blur(0)" : "blur(8px)",
      }}
    >
      {children}
    </div>
  );
}

function ProblemLine({
  visible,
  struck,
  text,
}: {
  visible: boolean;
  struck: boolean;
  text: string;
}) {
  return (
    <div
      style={{
        position: "relative",
        display: "inline-block",
        fontWeight: 600,
        fontSize: "clamp(18px, 2.4vw, 28px)",
        color: struck ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.92)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(10px)",
        transition:
          "opacity 600ms ease, transform 600ms ease, color 500ms ease",
      }}
    >
      <span>{text}</span>
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: -4,
          right: -4,
          top: "52%",
          height: 2,
          background:
            "linear-gradient(90deg, rgba(248,113,113,0.0) 0%, #F87171 15%, #EC4899 50%, #F87171 85%, rgba(248,113,113,0.0) 100%)",
          borderRadius: 2,
          transform: struck ? "scaleX(1)" : "scaleX(0)",
          transformOrigin: "left center",
          transition: "transform 600ms cubic-bezier(0.65, 0, 0.35, 1)",
        }}
      />
    </div>
  );
}

/* =========================================================
   Phase 2: Platform mock-up
   ========================================================= */

function PlatformMockup({ typing }: { typing: boolean }) {
  const TYPED = "AI-Powered Study Planner";
  const [chars, setChars] = useState(0);
  // Collapse the sidebar on narrow screens so the mockup doesn't
  // overflow horizontally or get cropped on phones.
  const [isNarrow, setIsNarrow] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const m = window.matchMedia("(max-width: 640px)");
    const sync = () => setIsNarrow(m.matches);
    sync();
    m.addEventListener?.("change", sync);
    return () => m.removeEventListener?.("change", sync);
  }, []);
  useEffect(() => {
    if (!typing) return;
    setChars(0);
    const id = window.setInterval(() => {
      setChars((c) => {
        if (c >= TYPED.length) {
          window.clearInterval(id);
          return c;
        }
        return c + 1;
      });
    }, 70);
    return () => window.clearInterval(id);
  }, [typing]);

  return (
    <div
      style={{
        ...CARD_SURFACE,
        width: "min(960px, 94vw)",
        maxHeight: "82dvh",
        padding: 0,
        overflow: "hidden",
        animation: "ii-fade-up 700ms cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      {/* Window chrome */}
      <div
        style={{
          padding: "10px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          display: "flex",
          gap: 6,
          alignItems: "center",
        }}
      >
        <Dot color="#FF5F57" />
        <Dot color="#FEBC2E" />
        <Dot color="#28C840" />
        <span style={{ marginLeft: 12, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
          interactiveideas.app · Feed
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isNarrow ? "1fr" : "200px 1fr",
          minHeight: isNarrow ? 280 : 380,
        }}
      >
        {/* Sidebar — hidden on narrow screens to avoid cropping. */}
        <div
          style={{
            display: isNarrow ? "none" : "flex",
            borderRight: "1px solid rgba(255,255,255,0.06)",
            padding: 16,
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              borderRadius: 12,
              background:
                "linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.12))",
              border: "1px solid rgba(99,102,241,0.28)",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              A
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Abhinav</div>
              <div style={{ fontSize: 10, color: "#C7D2FE" }}>Level 1 · 0 XP</div>
            </div>
          </div>
          <SidebarItem label="Feed" active />
          <SidebarItem label="My Ideas" />
          <SidebarItem label="Saved" />
          <SidebarItem label="Community" />
        </div>

        {/* Composer */}
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
            Create New Idea
          </div>
          <div
            style={{
              border: "1px solid rgba(99,102,241,0.45)",
              borderRadius: 14,
              padding: 18,
              background: "rgba(10,13,18,0.6)",
              boxShadow: "0 0 24px rgba(99,102,241,0.15)",
            }}
          >
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>
              Title
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, minHeight: 32 }}>
              {typing ? TYPED.slice(0, chars) : ""}
              <span
                style={{
                  display: "inline-block",
                  width: 2,
                  height: 22,
                  background: "#A78BFA",
                  marginLeft: 2,
                  verticalAlign: "middle",
                  animation: "ii-caret 900ms steps(1) infinite",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 14,
                flexWrap: "wrap",
              }}
            >
              {["Edtech", "AI", "Productivity"].map((t) => (
                <span
                  key={t}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 9999,
                    fontSize: 11,
                    background: "rgba(99,102,241,0.14)",
                    border: "1px solid rgba(99,102,241,0.28)",
                    color: "#C7D2FE",
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div
              style={{
                padding: "10px 18px",
                borderRadius: 10,
                background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                fontWeight: 600,
                fontSize: 13,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              Post Idea <ArrowRight style={{ width: 14, height: 14 }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarItem({ label, active }: { label: string; active?: boolean }) {
  return (
    <div
      style={{
        padding: "8px 12px",
        borderRadius: 10,
        fontSize: 13,
        color: active ? "#F9FAFB" : "rgba(255,255,255,0.65)",
        background: active ? "rgba(99,102,241,0.14)" : "transparent",
        border: active ? "1px solid rgba(99,102,241,0.25)" : "1px solid transparent",
        fontWeight: active ? 600 : 500,
      }}
    >
      {label}
    </div>
  );
}

function Dot({ color }: { color: string }) {
  return (
    <div
      style={{
        width: 10,
        height: 10,
        borderRadius: "50%",
        background: color,
      }}
    />
  );
}

/* =========================================================
   Phase 3: Matchmaking
   ========================================================= */

const COLLABORATORS = [
  { name: "Riya Nair", role: "Chemical Engineer", initial: "R", color: "#6366F1" },
  { name: "Arjun Nair", role: "Mathematics", initial: "A", color: "#8B5CF6" },
  { name: "Unnati", role: "Educator", initial: "U", color: "#10B981" },
];

function MatchmakingPanel({
  scanning,
  showCards,
  showTagline,
}: {
  scanning: boolean;
  showCards: boolean;
  showTagline: boolean;
}) {
  return (
    <div
      style={{
        ...CARD_SURFACE,
        width: "min(820px, 94vw)",
        maxHeight: "82dvh",
        overflow: "auto",
        padding: "clamp(16px, 4vw, 28px)",
        animation: "ii-fade-up 700ms cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontSize: 13,
          color: "rgba(255,255,255,0.7)",
          marginBottom: 18,
        }}
      >
        <Search style={{ width: 16, height: 16, color: "#C7D2FE" }} />
        Scanning for matches…
      </div>

      {/* Scan bar */}
      <div
        style={{
          height: 3,
          borderRadius: 2,
          background: "rgba(255,255,255,0.06)",
          overflow: "hidden",
          marginBottom: 22,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, transparent, #6366F1 50%, transparent)",
            animation: scanning
              ? "ii-scan 1100ms ease-in-out infinite"
              : "ii-scan 1100ms ease-in-out 1",
          }}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
        }}
      >
        {COLLABORATORS.map((c, i) => (
          <div
            key={c.name}
            style={{
              padding: 14,
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.08)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
              opacity: showCards ? 1 : 0,
              transform: showCards ? "translateY(0)" : "translateY(10px)",
              transition: `opacity 500ms ${i * 150}ms ease, transform 500ms ${i * 150}ms ease`,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${c.color}, ${c.color}aa)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 16,
                flexShrink: 0,
              }}
            >
              {c.initial}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {c.name}
              </div>
              <div style={{ fontSize: 11, color: "#C7D2FE" }}>{c.role}</div>
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "4px 10px",
                borderRadius: 9999,
                background: "rgba(16,185,129,0.14)",
                color: "#6EE7B7",
                border: "1px solid rgba(16,185,129,0.28)",
              }}
            >
              Match
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 24,
          textAlign: "center",
          fontSize: "clamp(15px, 1.6vw, 18px)",
          fontWeight: 600,
          color: "rgba(255,255,255,0.85)",
          opacity: showTagline ? 1 : 0,
          transform: showTagline ? "translateY(0)" : "translateY(8px)",
          transition: "opacity 500ms ease, transform 500ms ease",
        }}
      >
        <span style={GRADIENT_TEXT}>AI finds your dream team.</span>{" "}
        <span style={{ color: "rgba(255,255,255,0.7)" }}>You just connect.</span>
      </div>
    </div>
  );
}

/* =========================================================
   Phase 4: Venture Quest Map
   ========================================================= */

const STAGES = [
  { name: "The Village", sub: "Ideation", icon: Castle },
  { name: "The Forest", sub: "Build the MVP", icon: Trees },
  { name: "The Arena", sub: "Testing", icon: Swords },
  { name: "Artisan's Quarter", sub: "Design / Launch", icon: Hammer },
  { name: "The Mine", sub: "Investment", icon: Pickaxe },
  { name: "The Harbour", sub: "Scaling", icon: Anchor },
];

function QuestMap({
  completed,
  taglineVisible,
}: {
  completed: number;
  taglineVisible: boolean;
}) {
  // Shrink the stage nodes on narrow screens so all 6 stages fit
  // without horizontal cropping or overflow.
  const [isNarrow, setIsNarrow] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const m = window.matchMedia("(max-width: 640px)");
    const sync = () => setIsNarrow(m.matches);
    sync();
    m.addEventListener?.("change", sync);
    return () => m.removeEventListener?.("change", sync);
  }, []);
  const nodeSize = isNarrow ? 36 : 56;
  const iconSize = isNarrow ? 16 : 22;
  return (
    <div
      style={{
        width: "min(1080px, 94vw)",
        maxHeight: "82dvh",
        overflow: "hidden",
        animation: "ii-fade-up 700ms cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      <div
        style={{
          fontSize: 12,
          letterSpacing: "0.18em",
          color: "#C7D2FE",
          textTransform: "uppercase",
          textAlign: "center",
          marginBottom: 8,
        }}
      >
        Venture Quest Map
      </div>
      <div
        style={{
          fontSize: "clamp(20px, 2.6vw, 30px)",
          fontWeight: 700,
          textAlign: "center",
          marginBottom: 32,
        }}
      >
        Six stages from <span style={GRADIENT_TEXT}>idea to scale</span>.
      </div>

      <div
        style={{
          ...CARD_SURFACE,
          padding: isNarrow ? "20px 8px" : "32px 20px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            justifyContent: "space-between",
            gap: isNarrow ? 2 : 8,
            position: "relative",
          }}
        >
          {/* Connector line behind nodes */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              left: "8%",
              right: "8%",
              top: nodeSize / 2,
              height: 2,
              background: "rgba(255,255,255,0.08)",
            }}
          />
          <div
            aria-hidden
            style={{
              position: "absolute",
              left: "8%",
              top: nodeSize / 2,
              height: 2,
              width: `${Math.min(completed, STAGES.length - 1) * (84 / (STAGES.length - 1))}%`,
              background:
                "linear-gradient(90deg, #6366F1, #8B5CF6, #A78BFA)",
              boxShadow: "0 0 12px rgba(99,102,241,0.6)",
              transition: "width 700ms cubic-bezier(0.4,0,0.2,1)",
            }}
          />

          {STAGES.map((s, i) => {
            const Icon = s.icon;
            const isDone = i < completed;
            const isActive = i === completed;
            return (
              <div
                key={s.name}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 10,
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <div
                  style={{
                    width: nodeSize,
                    height: nodeSize,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: isDone
                      ? "linear-gradient(135deg, #6366F1, #8B5CF6)"
                      : isActive
                        ? "rgba(99,102,241,0.18)"
                        : "rgba(255,255,255,0.04)",
                    border: isActive
                      ? "1.5px solid rgba(99,102,241,0.6)"
                      : isDone
                        ? "1.5px solid rgba(167,139,250,0.6)"
                        : "1.5px solid rgba(255,255,255,0.08)",
                    boxShadow: isDone
                      ? "0 0 20px rgba(99,102,241,0.45)"
                      : isActive
                        ? "0 0 16px rgba(99,102,241,0.28)"
                        : "none",
                    animation: isDone
                      ? "ii-checkpoint-pop 500ms cubic-bezier(0.34, 1.56, 0.64, 1)"
                      : undefined,
                    transition: "background 400ms ease, box-shadow 400ms ease",
                  }}
                >
                  {isDone ? (
                    <Check style={{ width: iconSize, height: iconSize, color: "#fff" }} />
                  ) : (
                    <Icon
                      style={{
                        width: iconSize,
                        height: iconSize,
                        color: isActive ? "#C7D2FE" : "rgba(255,255,255,0.55)",
                      }}
                    />
                  )}
                </div>
                <div style={{ textAlign: "center", minHeight: isNarrow ? 24 : 38, padding: isNarrow ? "0 2px" : 0 }}>
                  <div
                    style={{
                      fontSize: isNarrow ? 9 : 12,
                      fontWeight: 600,
                      color: isDone || isActive ? "#F9FAFB" : "rgba(255,255,255,0.6)",
                      lineHeight: 1.15,
                    }}
                  >
                    {s.name}
                  </div>
                  {!isNarrow && (
                    <div
                      style={{
                        fontSize: 10,
                        color: "rgba(255,255,255,0.45)",
                        marginTop: 2,
                      }}
                    >
                      {s.sub}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          marginTop: 22,
          textAlign: "center",
          fontSize: "clamp(13px, 1.4vw, 16px)",
          color: "rgba(255,255,255,0.7)",
          opacity: taglineVisible ? 1 : 0,
          transform: taglineVisible ? "translateY(0)" : "translateY(6px)",
          transition: "opacity 500ms ease, transform 500ms ease",
        }}
      >
        Complete checkpoints. Level up. Defeat monsters. Unlock the next stage.
      </div>
    </div>
  );
}

/* =========================================================
   Closing card
   ========================================================= */

function ClosingCard() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 18,
        textAlign: "center",
        animation: "ii-fade-up 700ms cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      <Bulb visible />
      <div
        style={{
          fontSize: "clamp(36px, 5vw, 56px)",
          fontWeight: 700,
          letterSpacing: "-0.02em",
          marginTop: 6,
        }}
      >
        Interactive Ideas
      </div>
      <div
        style={{
          fontSize: "clamp(14px, 1.5vw, 17px)",
          color: "rgba(255,255,255,0.7)",
          maxWidth: 620,
        }}
      >
        The Idea Incubator — designed as a social media,{" "}
        <span style={GRADIENT_TEXT}>played like a game.</span>
      </div>
      <div style={{ fontSize: 13, color: "#C7D2FE" }}>theinteractiveideas.com</div>

      <div
        style={{
          display: "flex",
          gap: 36,
          marginTop: 14,
        }}
      >
        <Stat value="76+" label="Builders" />
        <Stat value="Free" label="To Join" />
        <Stat value="8" label="Quest Stages" />
      </div>

      <div
        style={{
          marginTop: 16,
          padding: "14px 28px",
          borderRadius: 9999,
          background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
          fontWeight: 700,
          fontSize: 15,
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          boxShadow: "0 0 40px rgba(99,102,241,0.5)",
        }}
      >
        Start Your Quest <ArrowRight style={{ width: 16, height: 16 }} />
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
      <div
        style={{
          fontSize: 11,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.55)",
          marginTop: 2,
        }}
      >
        {label}
      </div>
    </div>
  );
}
