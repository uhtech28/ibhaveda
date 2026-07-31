"use client";

import { useState, type ReactElement } from "react";
import {
  InteractiveSparky,
  type SparkyEmote,
} from "@/components/tutorial/v2/puppy/InteractiveSparky";
import type { DogMood } from "@/components/tutorial/v2/puppy/SparkyPixelDog";

const MOODS: DogMood[] = ["idle", "talking", "pointing", "celebrating"];
const EMOTES: SparkyEmote[] = [
  "heart",
  "sparkle",
  "exclaim",
  "question",
  "dots",
  "star",
  "zzz",
];

const SPEECH_LINES = [
  "Hi! I'm Sparky, your tutorial buddy.",
  "Click me to make me bark! 🐶",
  "Try dragging me around the screen.",
  "Move your mouse — I follow you!",
  "Type your first idea and I'll cheer.",
  "You're doing amazing. Let's keep going!",
];

export function SparkyDemoClient(): ReactElement {
  const [mood, setMood] = useState<DogMood>("idle");
  const [speech, setSpeech] = useState<string | null>(SPEECH_LINES[0]);
  const [emote, setEmote] = useState<SparkyEmote | null>(null);
  const [barks, setBarks] = useState(0);

  const cycleSpeech = () => {
    const next =
      SPEECH_LINES[(SPEECH_LINES.indexOf(speech ?? "") + 1) % SPEECH_LINES.length];
    setSpeech(next);
  };

  const randomEmote = () => {
    const pick = EMOTES[Math.floor(Math.random() * EMOTES.length)];
    setEmote(pick);
    window.setTimeout(() => setEmote(null), 1500);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg,#0f0f1a 0%,#161629 50%,#0f0f1a 100%)",
        color: "#e5e5f0",
        fontFamily: "system-ui, sans-serif",
        padding: "40px 20px",
      }}
    >
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        {/* Header */}
        <header style={{ marginBottom: 32, textAlign: "center" }}>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 900,
              margin: 0,
              background:
                "linear-gradient(90deg,#f4c94b,#f97316,#f4c94b)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            🐕 Sparky — Interactive Demo
          </h1>
          <p style={{ opacity: 0.7, marginTop: 8, fontSize: 14 }}>
            Everything the tutorial mascot can do. Try every control.
          </p>
        </header>

        {/* Main Sparky */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 32,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 380,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 20,
              padding: 40,
              position: "relative",
            }}
          >
            <InteractiveSparky
              mood={mood}
              speech={speech}
              emote={emote}
              size={190}
              draggable={true}
              eyeTracking={true}
              clickable={true}
              onBark={() => setBarks((n) => n + 1)}
            />
            <div
              style={{
                position: "absolute",
                bottom: 12,
                right: 16,
                fontSize: 11,
                opacity: 0.5,
                letterSpacing: 1,
              }}
            >
              barks: {barks}
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <ControlGroup title="Mood">
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {MOODS.map((m) => (
                  <Chip
                    key={m}
                    active={m === mood}
                    onClick={() => setMood(m)}
                    label={m}
                  />
                ))}
              </div>
            </ControlGroup>

            <ControlGroup title="Speech bubble">
              <button
                onClick={cycleSpeech}
                style={btnStyle}
              >
                Next line
              </button>
              <button
                onClick={() => setSpeech(null)}
                style={{ ...btnStyle, background: "transparent" }}
              >
                Clear
              </button>
            </ControlGroup>

            <ControlGroup title="Emotes">
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {EMOTES.map((e) => (
                  <Chip
                    key={e}
                    active={e === emote}
                    onClick={() => {
                      setEmote(e);
                      window.setTimeout(() => setEmote(null), 1500);
                    }}
                    label={e}
                  />
                ))}
                <button onClick={randomEmote} style={btnStyle}>
                  🎲 Random
                </button>
              </div>
            </ControlGroup>

            <ControlGroup title="Interactions to try">
              <ul style={{ margin: 0, paddingLeft: 18, opacity: 0.85, fontSize: 13, lineHeight: 1.7 }}>
                <li>Move your mouse — Sparky's head tilts to follow</li>
                <li>Click Sparky — bark bounce + random emote</li>
                <li>Hover — wiggle</li>
                <li>Drag — reposition anywhere</li>
                <li>Change mood — pose + face updates</li>
              </ul>
            </ControlGroup>
          </div>
        </section>

        {/* Mood grid */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 18, marginBottom: 16, opacity: 0.85 }}>
            All moods side by side
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: 16,
            }}
          >
            {MOODS.map((m) => (
              <div
                key={m}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 14,
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <InteractiveSparky
                  mood={m}
                  size={110}
                  draggable={false}
                  eyeTracking={false}
                  clickable={true}
                />
                <div style={{ fontSize: 12, opacity: 0.7, textTransform: "uppercase", letterSpacing: 1 }}>
                  {m}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Sizes */}
        <section>
          <h2 style={{ fontSize: 18, marginBottom: 16, opacity: 0.85 }}>
            Sizes
          </h2>
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14,
              padding: 24,
              display: "flex",
              gap: 32,
              alignItems: "flex-end",
              justifyContent: "center",
            }}
          >
            {[64, 96, 128, 180, 240].map((s) => (
              <div key={s} style={{ textAlign: "center" }}>
                <InteractiveSparky
                  mood="talking"
                  size={s}
                  draggable={false}
                  eyeTracking={true}
                  clickable={true}
                />
                <div style={{ marginTop: 8, fontSize: 11, opacity: 0.6 }}>
                  {s}px
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Local UI bits
// ─────────────────────────────────────────────────────────────────────────────

const btnStyle: React.CSSProperties = {
  background: "linear-gradient(180deg,#4f46e5,#4338ca)",
  color: "#fff",
  border: "1px solid rgba(255,255,255,0.15)",
  padding: "8px 14px",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600,
};

function ControlGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 12,
        padding: 16,
      }}
    >
      <div
        style={{
          fontSize: 11,
          opacity: 0.55,
          letterSpacing: 1.4,
          textTransform: "uppercase",
          marginBottom: 10,
        }}
      >
        {title}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {children}
      </div>
    </div>
  );
}

function Chip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active
          ? "linear-gradient(180deg,#f4c94b,#f97316)"
          : "rgba(255,255,255,0.05)",
        color: active ? "#1a1208" : "#e5e5f0",
        border: `1px solid ${active ? "#f4c94b" : "rgba(255,255,255,0.12)"}`,
        padding: "6px 12px",
        borderRadius: 999,
        cursor: "pointer",
        fontSize: 12,
        fontWeight: 700,
        textTransform: "capitalize",
      }}
    >
      {label}
    </button>
  );
}
