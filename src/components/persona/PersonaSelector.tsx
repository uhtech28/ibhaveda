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
          <p className="persona-eyebrow">Step 2 of 2 — pick your builder</p>
          <h1 className="persona-title">Choose your persona</h1>
          <p className="persona-sub">
            The archetype you pick shapes how the world sees you and
            what your character looks like on the venture map. You can
            change this later from your profile.
          </p>
        </header>

        <div className="persona-grid" role="radiogroup" aria-label="Persona">
          {PERSONAS.map((p) => {
            const active = p.id === selectedId;
            return (
              <motion.button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setSelectedId(p.id)}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className={`persona-card ${active ? "is-active" : ""}`}
                style={
                  {
                    "--accent": p.accent,
                  } as React.CSSProperties
                }
                data-persona={p.id}
              >
                <div className="persona-portrait-wrap">
                  {/* Real portrait art — falls back to the emoji chip if
                      the asset 404s. */}
                  <img
                    src={p.assets.portrait}
                    alt=""
                    className="persona-portrait"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display =
                        "none";
                      const fallback = (
                        e.currentTarget as HTMLImageElement
                      ).nextElementSibling as HTMLElement | null;
                      if (fallback) fallback.style.display = "flex";
                    }}
                  />
                  <div className="persona-portrait-fallback" aria-hidden>
                    <span>{p.emoji}</span>
                  </div>
                </div>
                <div className="persona-card-body">
                  <div className="persona-name">{p.displayName}</div>
                  <div className="persona-tag">{p.tagline}</div>
                </div>
                {active && (
                  <motion.div
                    className="persona-active-ring"
                    layoutId="persona-active-ring"
                    transition={{ type: "spring", stiffness: 340, damping: 26 }}
                  />
                )}
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
            {submitting ? "Entering…" : "Enter the world →"}
          </button>
        </div>
      </div>

      <style jsx>{`
        .persona-splash {
          position: fixed;
          inset: 0;
          z-index: 100000;
          color: #f6f4fa;
          font-family: "Inter", system-ui, sans-serif;
          overflow-y: auto;
          background:
            radial-gradient(ellipse 900px 600px at 50% -5%, rgba(143, 92, 232, 0.2), transparent 60%),
            radial-gradient(ellipse 700px 500px at 85% 15%, rgba(226, 115, 154, 0.1), transparent 60%),
            radial-gradient(ellipse 700px 500px at 10% 30%, rgba(246, 178, 94, 0.08), transparent 60%),
            linear-gradient(180deg, #07050c 0%, #0d0a17 45%, #140f22 100%);
          animation: personaFadeIn 0.35s ease-out;
        }
        .persona-wrap {
          max-width: 1080px;
          margin: 0 auto;
          padding: 56px 24px 96px;
          display: flex;
          flex-direction: column;
          gap: 36px;
        }
        .persona-header {
          text-align: center;
        }
        .persona-eyebrow {
          font-size: 11px;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: #c9a45c;
          font-weight: 700;
          margin-bottom: 10px;
        }
        .persona-title {
          font-family: "Space Grotesk", "Inter", sans-serif;
          font-weight: 700;
          font-size: clamp(30px, 5vw, 44px);
          line-height: 1.1;
          letter-spacing: -0.4px;
          color: #f6f4fa;
          margin-bottom: 12px;
        }
        .persona-sub {
          color: #a49bc0;
          font-size: 14.5px;
          line-height: 1.6;
          max-width: 560px;
          margin: 0 auto;
        }
        .persona-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }
        @media (max-width: 780px) {
          .persona-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        .persona-card {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 20px 14px 18px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.035);
          border: 1px solid rgba(255, 255, 255, 0.08);
          cursor: pointer;
          transition: border-color 0.22s ease, background 0.22s ease,
            box-shadow 0.22s ease;
          font-family: inherit;
          color: inherit;
          text-align: center;
        }
        .persona-card:hover {
          border-color: color-mix(in srgb, var(--accent) 50%, transparent);
          background: rgba(255, 255, 255, 0.055);
          box-shadow: 0 12px 32px -14px color-mix(in srgb, var(--accent) 55%, transparent);
        }
        .persona-card.is-active {
          border-color: var(--accent);
          box-shadow:
            0 0 0 1px var(--accent),
            0 16px 40px -14px color-mix(in srgb, var(--accent) 65%, transparent);
          background: rgba(255, 255, 255, 0.06);
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
          gap: 24px;
          padding: 20px 22px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(12px);
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
          color: #f6f4fa;
          margin-bottom: 4px;
        }
        .persona-preview-desc {
          font-size: 12.5px;
          color: #a49bc0;
          line-height: 1.55;
        }
        .persona-preview-desc.muted {
          color: #786e96;
        }
        .persona-cta {
          flex-shrink: 0;
          padding: 12px 22px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(120deg, #f6b25e, #e2739a 55%, #8f5ce8);
          background-size: 180% 180%;
          color: #160b23;
          font-family: inherit;
          font-weight: 700;
          font-size: 14px;
          letter-spacing: 0.2px;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease,
            background-position 0.6s ease;
          box-shadow: 0 12px 30px -10px rgba(226, 115, 154, 0.45);
        }
        .persona-cta:hover:not(:disabled) {
          background-position: 100% 50%;
          transform: translateY(-2px);
          box-shadow: 0 16px 36px -10px rgba(226, 115, 154, 0.6);
        }
        .persona-cta:disabled {
          opacity: 0.5;
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
