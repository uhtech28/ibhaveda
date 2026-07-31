"use client";

import { useState, type ReactElement } from "react";
import { AnimatedSparky } from "@/components/tutorial/v2/puppy/AnimatedSparky";

const CONVERSATIONS = [
  "Hi! I'm Sparky, your tutorial buddy 🐕",
  "Let me help you get started with your first venture!",
  "Type your idea in the box below when you're ready.",
  "Great job! You're doing amazing 🎉",
  "Ready for the next step? Just click Continue!",
];

export function SparkyAnimClient(): ReactElement {
  const [step, setStep] = useState(0);
  const [loadingSpeech, setLoadingSpeech] = useState(false);
  const [speech, setSpeech] = useState<string | null>(null);
  const [cheerTick, setCheerTick] = useState(0);

  const startTalking = () => {
    setLoadingSpeech(true);
    const line = CONVERSATIONS[step % CONVERSATIONS.length];
    setSpeech(line);
    // Simulate "text loading" — the dog talks the whole time speech is set.
    // For a real backend stream, keep speech set while the stream is open,
    // clear it (setSpeech(null)) when the stream ends.
    window.setTimeout(() => {
      setSpeech(null);
      setLoadingSpeech(false);
    }, 3500);
  };

  const handleContinue = () => {
    setStep((s) => s + 1);
    setCheerTick((n) => n + 1); // triggers CHEER animation once
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
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 40,
      }}
    >
      <header style={{ textAlign: "center", maxWidth: 700 }}>
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
          🐕 Sparky Animation State Machine
        </h1>
        <p style={{ opacity: 0.7, marginTop: 8, fontSize: 14 }}>
          Talk while loading · Idle when quiet · Roll if you're inactive 4s · Cheer on Continue
        </p>
      </header>

      {/* The dog */}
      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20,
          padding: "80px 40px 40px 40px",
          minWidth: 480,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <AnimatedSparky
          size={220}
          speech={speech}
          cheerTick={cheerTick}
          autoRoll={true}
        />
      </div>

      {/* Controls */}
      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <button
          onClick={startTalking}
          disabled={loadingSpeech}
          style={{
            background: loadingSpeech
              ? "rgba(255,255,255,0.1)"
              : "linear-gradient(180deg,#4f46e5,#4338ca)",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.15)",
            padding: "12px 20px",
            borderRadius: 10,
            cursor: loadingSpeech ? "not-allowed" : "pointer",
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          {loadingSpeech ? "📡 Loading text..." : "▶ Play next message (talk)"}
        </button>
        <button
          onClick={handleContinue}
          style={{
            background: "linear-gradient(180deg,#f97316,#ea580c)",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.15)",
            padding: "12px 20px",
            borderRadius: 10,
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          ✅ Continue (cheer)
        </button>
      </div>

      {/* Info */}
      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 12,
          padding: 20,
          maxWidth: 640,
          fontSize: 13,
          lineHeight: 1.7,
        }}
      >
        <div
          style={{
            fontSize: 11,
            opacity: 0.5,
            letterSpacing: 1.4,
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Rules
        </div>
        <ol style={{ margin: 0, paddingLeft: 20 }}>
          <li>Click <b>Play next message</b> → dog plays <b>TALK</b> for 3.5s while text is showing.</li>
          <li>Text ends → dog returns to <b>IDLE</b>.</li>
          <li>Don't move mouse or touch keyboard for <b>4 seconds</b> → dog plays <b>ROLL</b>.</li>
          <li>Click <b>Continue</b> → dog plays <b>CHEER</b> once, then back to idle.</li>
        </ol>
        <div style={{ marginTop: 12, opacity: 0.6, fontSize: 12 }}>
          Current step: {step} • cheerTick: {cheerTick}
        </div>
      </div>
    </div>
  );
}
