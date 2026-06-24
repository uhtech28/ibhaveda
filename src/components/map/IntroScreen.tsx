"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  PERSONA_DEFINITIONS,
  type PersonaDefinition,
  type PersonaId,
} from "@/config/personas";

interface IntroScreenProps {
  ventureName?: string;
  /**
   * Called when the user confirms their character selection.
   * Emits both the new `personaId` (PRD § 3.1) and a back-compat
   * `gender` so legacy code paths (Phaser sprite fallback,
   * existing mutations) keep working.
   */
  onStart: (selection: {
    personaId: PersonaId;
    gender: "male" | "female";
  }) => void;
}

/** A 9-of-10 grid renders cleanly as 5×2 on desktop / 2×5 on mobile.
 * (The PRD names 10 personas; the layout still works as 5×2.) */

export function IntroScreen({
  ventureName = "Your Venture",
  onStart,
}: IntroScreenProps) {
  const [selectedPersonaId, setSelectedPersonaId] =
    useState<PersonaId | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleStart = () => {
    if (!selectedPersonaId) return;
    const def = PERSONA_DEFINITIONS.find((p) => p.id === selectedPersonaId);
    if (!def) return;
    // Derive back-compat gender. "Nonbinary" personas randomly map to
    // either bucket — we lean male for stability so the legacy sprite
    // sheet stays consistent for that venture's existing data.
    const gender: "male" | "female" =
      def.class === "Female" ? "female" : "male";
    onStart({ personaId: selectedPersonaId, gender });
  };

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#050810] font-sans">
      {/* ── Background: Parallax Galactic Starfield ─────────────────────────── */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-tr from-[#050810] via-[#0a0f25] to-[#050810]" />
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#6366F1]/10 blur-[120px] rounded-full animate-pulse" />
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#8B5CF6]/10 blur-[120px] rounded-full animate-pulse"
          style={{ animationDelay: "2s" }}
        />
        {[...Array(80)].map((_, i) => (
          <motion.div
            key={`s1-${i}`}
            className="absolute w-0.5 h-0.5 bg-white rounded-full"
            initial={{
              x: Math.random() * 100 + "%",
              y: Math.random() * 100 + "%",
              opacity: Math.random() * 0.5,
            }}
            animate={{
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/5 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] border border-white/[0.03] rounded-full" />
      </div>

      {/* ── Main content scrollable container ─────────────────────────────── */}
      <div className="absolute inset-0 overflow-y-auto no-scrollbar flex">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 w-full max-w-6xl m-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col items-center min-h-[min-content]"
        >
          {/* Header Section */}
          <div className="text-center mb-8 sm:mb-12 mt-4">
            <motion.h1
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-3 sm:mb-4 tracking-tighter uppercase italic"
              style={{ textShadow: "0 0 40px rgba(99, 102, 241, 0.4)" }}
            >
              Choose Your Persona
            </motion.h1>
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm sm:text-lg md:text-xl text-indigo-300/80 font-medium tracking-wide bg-white/5 px-6 sm:px-8 py-1.5 sm:py-2 rounded-full backdrop-blur-sm border border-white/10 uppercase shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                {ventureName}
              </p>
              <div className="mt-4 sm:mt-6 flex items-center gap-3 sm:gap-4">
                <div className="h-[1px] w-12 sm:w-24 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
                <span className="text-[8px] sm:text-[10px] text-indigo-400 font-black tracking-[0.2em] sm:tracking-[0.3em] uppercase whitespace-nowrap">
                  10 Personas · Pick the one that fits your journey
                </span>
                <div className="h-[1px] w-12 sm:w-24 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
              </div>
            </div>
          </div>

          {/* Persona Selection Grid — 5×2 desktop, 3×4 tablet, 2×5 mobile */}
          <div className="w-full mb-10 sm:mb-12">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-5 max-w-6xl mx-auto px-2">
              {PERSONA_DEFINITIONS.map((p) => (
                <PersonaCard
                  key={p.id}
                  persona={p}
                  selected={selectedPersonaId === p.id}
                  onSelect={() => setSelectedPersonaId(p.id)}
                />
              ))}
            </div>
          </div>

          {/* Selected persona detail readout */}
          <AnimatePresence>
            {selectedPersonaId && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                className="mb-6 sm:mb-8 text-center max-w-xl"
              >
                {(() => {
                  const p = PERSONA_DEFINITIONS.find(
                    (x) => x.id === selectedPersonaId,
                  );
                  if (!p) return null;
                  return (
                    <>
                      <div className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-indigo-300 mb-2">
                        {p.archetype} · {p.class}
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
                        {p.name}
                      </h2>
                      <p className="text-sm sm:text-base text-white/60 italic">
                        &ldquo;{p.tagline}&rdquo;
                      </p>
                    </>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Actions */}
          <div className="flex flex-col items-center gap-6 sm:gap-8 w-full shrink-0">
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="group relative flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 hover:text-white transition-all"
            >
              <span className="w-4 h-[1px] bg-white/10 group-hover:bg-indigo-500 group-hover:w-8 transition-all" />
              {showInstructions ? "Hide" : "Show"} Game Manual
              <span className="w-4 h-[1px] bg-white/10 group-hover:bg-indigo-500 group-hover:w-8 transition-all" />
            </button>

            <AnimatePresence>
              {showInstructions && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  className="w-full max-w-xl p-6 sm:p-8 rounded-3xl bg-white/[0.03] border border-white/5 backdrop-blur-xl"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-[11px] text-white/60">
                    <InstructionItem
                      num="01"
                      text="Navigate the world map across multiple stages"
                    />
                    <InstructionItem
                      num="02"
                      text="Complete checkpoints to advance — 2 of 3 tasks"
                    />
                    <InstructionItem
                      num="03"
                      text="Earn Gold by completing all 3 tasks at a checkpoint"
                    />
                    <InstructionItem
                      num="04"
                      text="Defeat the stage monster to clear each region"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Launch Button */}
            <motion.div
              className="mt-2 mb-8 sm:mb-0"
              animate={selectedPersonaId ? { scale: [1, 1.02, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Button
                onClick={handleStart}
                disabled={!selectedPersonaId}
                className={`h-16 sm:h-20 px-10 sm:px-16 text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] rounded-full transition-all duration-500 overflow-hidden relative group ${
                  selectedPersonaId
                    ? "bg-white text-black hover:tracking-[0.6em] shadow-[0_0_50px_rgba(255,255,255,0.2)] hover:shadow-[0_0_80px_rgba(255,255,255,0.4)]"
                    : "bg-white/5 text-white/20 border border-white/5 cursor-not-allowed"
                }`}
              >
                {selectedPersonaId && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent"
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                )}
                {selectedPersonaId ? "Initiate Journey" : "Select Persona"}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ── Internal Component: PersonaCard ────────────────────────────────────

interface PersonaCardProps {
  persona: PersonaDefinition;
  selected: boolean;
  onSelect: () => void;
}

function PersonaCard({ persona, selected, onSelect }: PersonaCardProps) {
  return (
    <motion.button
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.97 }}
      onClick={onSelect}
      className="group relative aspect-[3/4] rounded-2xl transition-all duration-300 overflow-hidden flex flex-col"
    >
      {/* Glass base */}
      <div
        className={`absolute inset-0 transition-all duration-300 ${
          selected
            ? "bg-white/10 backdrop-blur-2xl border-2 border-indigo-400/80 shadow-[0_0_40px_-10px_rgba(99,102,241,0.6)]"
            : "bg-white/[0.025] backdrop-blur-sm border border-white/10 grayscale-[0.4] group-hover:grayscale-0 group-hover:bg-white/[0.06] group-hover:border-white/20"
        }`}
      />

      {/* Selected inner glow */}
      {selected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-indigo-500/15 to-transparent pointer-events-none"
        />
      )}

      <div className="relative h-full p-3 sm:p-4 flex flex-col items-center justify-between">
        {/* Portrait */}
        <div className="relative w-full flex-1 min-h-[100px] flex items-center justify-center mb-2">
          {selected && (
            <motion.div
              layoutId={`persona-glow-${persona.id}`}
              className="absolute inset-2 rounded-full blur-[30px] sm:blur-[40px]"
              style={{
                background: "rgba(99, 102, 241, 1)",
                opacity: 0.25,
              }}
            />
          )}
          <div
            className={`relative w-full h-full flex items-center justify-center transition-all duration-300 ${selected ? "scale-105" : "scale-100 opacity-80 group-hover:opacity-100 group-hover:scale-105"}`}
          >
            <div className="relative w-full h-full">
              <Image
                src={persona.spritePath}
                alt={persona.name}
                fill
                sizes="(max-width: 640px) 150px, (max-width: 1024px) 200px, 220px"
                className="object-contain drop-shadow-xl object-bottom"
                priority={false}
              />
            </div>
          </div>
        </div>

        {/* Text */}
        <div className="text-center w-full z-10 shrink-0">
          <span
            className={`text-[8px] sm:text-[9px] font-black uppercase tracking-[0.15em] transition-colors duration-300 block mb-0.5 ${selected ? "text-indigo-300" : "text-white/30 group-hover:text-white/50"}`}
          >
            {persona.archetype}
          </span>
          <h3
            className={`text-sm sm:text-base font-black uppercase tracking-tight leading-tight transition-all duration-300 ${selected ? "text-white" : "text-white/60 group-hover:text-white/90"}`}
          >
            {persona.name}
          </h3>
        </div>

        {/* Checkmark badge */}
        {selected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-indigo-400 flex items-center justify-center shadow-lg z-20"
          >
            <svg
              className="w-3 h-3 text-black"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </motion.div>
        )}
      </div>
    </motion.button>
  );
}

function InstructionItem({ num, text }: { num: string; text: string }) {
  return (
    <div className="flex items-center gap-3 sm:gap-4">
      <span className="text-indigo-500 font-black font-mono text-[10px] sm:text-xs">
        {num}
      </span>
      <span className="leading-tight text-[10px] sm:text-[11px]">{text}</span>
    </div>
  );
}
