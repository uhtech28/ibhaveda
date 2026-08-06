"use client";

/**
 * PersonaSelector — full-screen picker shown right after the user
 * chooses their name + username. 2×4 grid of tinted portrait cards.
 * Hover / focus animates the accent glow. A single primary "Enter the
 * world" button submits the selection.
 *
 * Design intent (PRD §3.9): premium onboarding beat before Sparky
 * launches the tour — sets the emotional stakes of the game world.
 */

import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { PERSONAS, type Persona, type PersonaId } from "@/config/personas";

interface PersonaSelectorProps {
  /** Called with the picked persona id when the user confirms. */
  onConfirm: (personaId: PersonaId) => void | Promise<void>;
  /** Optional pre-selection (e.g. resuming from a partial signup). */
  initialPersonaId?: PersonaId | null;
  /** When true, the Confirm button shows a spinner. */
  submitting?: boolean;
}

export function PersonaSelector({
  onConfirm,
  initialPersonaId = null,
  submitting = false,
}: PersonaSelectorProps) {
  const [selectedId, setSelectedId] = useState<PersonaId | null>(
    initialPersonaId,
  );

  const selected = useMemo<Persona | null>(
    () => PERSONAS.find((p) => p.id === selectedId) ?? null,
    [selectedId],
  );

  const handleConfirm = useCallback(() => {
    if (!selectedId || submitting) return;
    void onConfirm(selectedId);
  }, [selectedId, submitting, onConfirm]);

  return (
    <div className="persona-splash">
      <div className="persona-wrap">
        <header className="persona-header">
          {/* "Step 2 of 2 — pick your builder" eyebrow removed per
              product request — the header now leads with the title. */}
          <h1 className="persona-title">Choose your persona</h1>
          <p className="persona-sub">
            The archetype you pick shapes how the world sees you and
            what your character looks like on the venture map. You can
            change this later from your profile.
          </p>
        </header>

        <div
          className="persona-grid"
          role="radiogroup"
          aria-label="Persona"
          // Grid layout + responsive breakpoints live in the .persona-grid
          // rule in <style jsx> below. Previously an inline
          // `gridTemplateColumns: repeat(4, minmax(0, 1fr))` was set here,
          // which stomped over the mobile media query (inline style beats
          // class-based rule specificity) and forced 4 columns on phones —
          // making each tile ~120px wide and mangling the taglines.
        >
          {PERSONAS.map((p) => {
            const active = p.id === selectedId;
            // Explicit inline styles so the card ALWAYS renders as a
            // bordered box regardless of styled-jsx compilation state.
            // Previous <style jsx> version worked in the header block
            // but not on the cards — swapping to inline eliminates the
            // ambiguity.
            const cardStyle: React.CSSProperties = {
              // Grid slot fills — every card same footprint so tagline
              // length variance doesn't warp row alignment.
              minHeight: 196,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: 14,
              padding: "22px 20px 20px",
              // Platform surface language: 18px radius, #0F1726 fill,
              // white/8 border. On select: switch to the platform
              // indigo (#6366F1) accent — same as the feed's
              // Contribute/Sub-ideas hover state.
              borderRadius: 18,
              cursor: "pointer",
              textAlign: "center",
              fontFamily: "inherit",
              color: "inherit",
              border: active
                ? "1px solid rgba(99, 102, 241, 0.7)"
                : "1px solid rgba(255, 255, 255, 0.08)",
              background: active
                ? "rgba(99, 102, 241, 0.08)"
                : "rgba(15, 23, 38, 0.85)",
              boxShadow: active
                ? "0 0 24px rgba(99, 102, 241, 0.22), 0 0 0 1px rgba(99, 102, 241, 0.5)"
                : "0 8px 24px rgba(0, 0, 0, 0.3)",
              transition:
                "border-color 0.22s ease, background 0.22s ease, box-shadow 0.22s ease",
            };
            return (
              <motion.button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setSelectedId(p.id)}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  ...cardStyle,
                  ["--accent" as string]: p.accent,
                }}
                data-persona={p.id}
              >
                {/* Portrait cell */}
                <div
                  style={{
                    position: "relative",
                    width: 96,
                    height: 96,
                    borderRadius: 12,
                    overflow: "hidden",
                    background: "rgba(0,0,0,0.4)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={p.assets.portrait}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      imageRendering: "pixelated",
                    }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display =
                        "none";
                      const fallback = (
                        e.currentTarget as HTMLImageElement
                      ).nextElementSibling as HTMLElement | null;
                      if (fallback) fallback.style.display = "flex";
                    }}
                  />
                  <div
                    aria-hidden
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "none",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 40,
                      background: `linear-gradient(155deg, ${p.accent}33 0%, transparent 60%)`,
                    }}
                  >
                    <span>{p.emoji}</span>
                  </div>
                </div>

                {/* Name + tagline — platform typography. Name uses
                    solid white like feed card titles, tagline uses
                    #9CA3AF muted like feed card descriptions. */}
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: "#ffffff",
                      marginBottom: 4,
                      letterSpacing: "0.2px",
                    }}
                  >
                    {p.displayName}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#9ca3af",
                      lineHeight: 1.4,
                      minHeight: 28,
                    }}
                  >
                    {p.tagline}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        <div className="persona-footer">
          <div className="persona-preview">
            {selected ? (
              <>
                <div className="persona-preview-name">{selected.displayName}</div>
                <div className="persona-preview-desc">
                  {selected.description}
                </div>
              </>
            ) : (
              <div className="persona-preview-desc muted">
                Pick a persona to see their story.
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedId || submitting}
            className="persona-cta"
          >
            {/* Label simplified from "Enter the world →" to just
                "Begin" (arrow removed) per product ask. Matches the
                calmer CTA voice used elsewhere on the platform. */}
            {submitting ? "Beginning…" : "Begin"}
          </button>
        </div>
      </div>

      <style jsx>{`
        /* All colors + radii aligned with the platform's feed-card
           design language (see idea-cards.tsx):
             surfaces  → #0F1726
             borders   → rgba(255,255,255,0.08)   (i.e. border-white/8)
             body text → #D1D5DB
             muted     → #9CA3AF
             accent    → #6366F1 (indigo)
             radii     → 18px cards, 12px pills
           So the persona picker reads as part of the same product as
           the feed rather than a bespoke onboarding surface. */
        .persona-splash {
          position: fixed;
          inset: 0;
          z-index: 100000;
          color: #f6f4fa;
          font-family: var(--font-sans, "Inter", system-ui, sans-serif);
          overflow-y: auto;
          background: #050810;
          animation: personaFadeIn 0.35s ease-out;
        }
        .persona-wrap {
          max-width: 1080px;
          margin: 0 auto;
          padding: 28px 24px 28px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .persona-header {
          text-align: center;
        }
        .persona-title {
          font-family: var(--font-display, "Space Grotesk", "Inter", sans-serif);
          font-weight: 700;
          font-size: clamp(24px, 3.5vw, 34px);
          line-height: 1.15;
          letter-spacing: -0.4px;
          color: #ffffff;
          margin-bottom: 8px;
        }
        .persona-sub {
          color: #9ca3af;
          font-size: 13px;
          line-height: 1.5;
          max-width: 540px;
          margin: 0 auto;
        }
        .persona-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }
        /* Tablet — 3 columns so the grid stays legible under 900px
           and doesn't jump straight to 2. */
        @media (max-width: 900px) {
          .persona-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        /* Mobile — 2 columns from 640px down. Anything above 640px is
           the tablet 3-col grid; below is the phone 2-col grid. Also
           tightens gap so the cards can breathe on narrow screens. */
        @media (max-width: 640px) {
          .persona-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }
        }
        .persona-card {
          /* Fixed min-height + justify-content:space-between so every
             card in the grid has the same footprint regardless of
             tagline word-count — otherwise "The tinker of odd
             combinations" stretches its cell taller than "Oracle / The
             visionary seer" and the row loses its baseline. */
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          gap: 14px;
          padding: 20px 14px 22px;
          min-height: 232px;
          border-radius: 18px;
          /* Card fill + border bumped from 3.5% / 8% white so each
             card actually reads as a card on the dark purple bg
             (previous values were basically invisible). */
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.18);
          cursor: pointer;
          transition: border-color 0.22s ease, background 0.22s ease,
            box-shadow 0.22s ease, transform 0.22s ease;
          font-family: inherit;
          color: inherit;
          text-align: center;
        }
        .persona-card:hover {
          border-color: color-mix(in srgb, var(--accent) 65%, transparent);
          background: rgba(255, 255, 255, 0.08);
          box-shadow: 0 12px 32px -14px color-mix(in srgb, var(--accent) 55%, transparent);
        }
        .persona-card.is-active {
          border-color: var(--accent);
          box-shadow:
            0 0 0 1px var(--accent),
            0 16px 40px -14px color-mix(in srgb, var(--accent) 65%, transparent);
          background: rgba(255, 255, 255, 0.09);
        }
        .persona-portrait-wrap {
          position: relative;
          width: 96px;
          height: 96px;
          border-radius: 14px;
          overflow: hidden;
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        :global(.persona-card .persona-portrait) {
          width: 100%;
          height: 100%;
          object-fit: contain;
          image-rendering: pixelated;
        }
        .persona-portrait-fallback {
          position: absolute;
          inset: 0;
          display: none;
          align-items: center;
          justify-content: center;
          font-size: 40px;
          background: linear-gradient(
            155deg,
            color-mix(in srgb, var(--accent) 22%, transparent),
            transparent 60%
          );
        }
        .persona-card-body {
          text-align: center;
        }
        .persona-name {
          font-size: 15px;
          font-weight: 700;
          color: #f6f4fa;
          margin-bottom: 3px;
          letter-spacing: 0.2px;
        }
        .persona-tag {
          font-size: 11.5px;
          color: #a49bc0;
          line-height: 1.4;
          min-height: 32px;
        }
        .persona-active-ring {
          position: absolute;
          inset: -3px;
          border-radius: 20px;
          pointer-events: none;
          border: 1.5px solid var(--accent);
          box-shadow: 0 0 24px color-mix(in srgb, var(--accent) 45%, transparent);
        }
        .persona-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 16px 20px;
          /* Same 18px radius, #0F1726 fill and white/8 border used on
             every feed card — the footer reads as a peer of the
             cards above, not a bespoke onboarding chrome. */
          border-radius: 18px;
          background: rgba(15, 23, 38, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(24px);
        }
        @media (max-width: 640px) {
          .persona-footer {
            flex-direction: column;
            align-items: stretch;
            text-align: center;
          }
        }
        .persona-preview {
          min-width: 0;
          flex: 1;
        }
        .persona-preview-name {
          font-size: 14px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 4px;
        }
        .persona-preview-desc {
          font-size: 13px;
          color: #d1d5db;
          line-height: 1.55;
        }
        .persona-preview-desc.muted {
          color: #9ca3af;
        }
        /* CTA now matches the platform's primary indigo action:
           #6366F1 fill, white text, 12px radius, subtle indigo glow —
           same treatment used on Post Idea, Send Request, and the
           Advance button in the CheckpointPanel. */
        .persona-cta {
          flex-shrink: 0;
          padding: 12px 26px;
          border-radius: 12px;
          border: 1px solid rgba(99, 102, 241, 0.5);
          background: #6366f1;
          color: #ffffff;
          font-family: inherit;
          font-weight: 600;
          font-size: 14px;
          letter-spacing: 0.1px;
          cursor: pointer;
          transition: background 0.18s ease, transform 0.18s ease,
            box-shadow 0.18s ease;
          box-shadow: 0 8px 24px -8px rgba(99, 102, 241, 0.5);
        }
        .persona-cta:hover:not(:disabled) {
          background: #7b7dff;
          transform: translateY(-1px);
          box-shadow: 0 12px 32px -8px rgba(99, 102, 241, 0.6);
        }
        .persona-cta:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        @keyframes personaFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
