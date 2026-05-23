"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface IntroScreenProps {
  ventureName?: string;
  onStart: (gender: "male" | "female") => void;
}

export function IntroScreen({
  ventureName = "Your Venture",
  onStart,
}: IntroScreenProps) {
  const [selectedGender, setSelectedGender] = useState<
    "male" | "female" | null
  >(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleStart = () => {
    if (selectedGender) {
      onStart(selectedGender);
    }
  };

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#050810] font-sans">
      {/* ── Background: Parallax Galactic Starfield ─────────────────────────── */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Deep Space Gradient */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#050810] via-[#0a0f25] to-[#050810]" />

        {/* Nebula Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#6366F1]/10 blur-[120px] rounded-full animate-pulse" />
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#8B5CF6]/10 blur-[120px] rounded-full animate-pulse"
          style={{ animationDelay: "2s" }}
        />

        {/* Moving Stars (Layer 1 - Distant) */}
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

        {/* Orbits / Circular Accents */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/5 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] border border-white/[0.03] rounded-full" />
      </div>

      {/* ── Main content scrollable container ─────────────────────────────── */}
      <div className="absolute inset-0 overflow-y-auto no-scrollbar flex">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 w-full max-w-5xl m-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col items-center min-h-[min-content]"
        >
          {/* Header Section */}
          <div className="text-center mb-8 sm:mb-14 mt-4">
            <motion.h1
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black text-white mb-3 sm:mb-4 tracking-tighter uppercase italic"
              style={{ textShadow: "0 0 40px rgba(99, 102, 241, 0.4)" }}
            >
              Welcome to Your Journey
            </motion.h1>
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm sm:text-lg md:text-xl text-indigo-300/80 font-medium tracking-wide bg-white/5 px-6 sm:px-8 py-1.5 sm:py-2 rounded-full backdrop-blur-sm border border-white/10 uppercase shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                {ventureName}
              </p>
              <div className="mt-4 sm:mt-6 flex items-center gap-3 sm:gap-4">
                <div className="h-[1px] w-12 sm:w-24 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
                <span className="text-[8px] sm:text-[10px] text-indigo-400 font-black tracking-[0.2em] sm:tracking-[0.3em] uppercase whitespace-nowrap">
                  2 Stages • 8 Checkpoints
                </span>
                <div className="h-[1px] w-12 sm:w-24 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
              </div>
            </div>
          </div>

          {/* Character Selection Grid */}
          <div className="w-full mb-10 sm:mb-14">
            <h2 className="text-[10px] sm:text-[11px] md:text-sm font-black text-white/40 text-center uppercase tracking-[0.4em] sm:tracking-[0.6em] mb-6 sm:mb-10">
              Choose Your Character
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 md:gap-10 lg:gap-12 max-w-4xl mx-auto px-2 sm:px-4">
              {/* Male character card */}
              <CharacterCard
                gender="male"
                selected={selectedGender === "male"}
                onSelect={() => setSelectedGender("male")}
                imageSrc="/assets/personas/male_founder.png"
                title="Male"
                tagline="The Strategic Engineer"
                description="Strong and determined builder focused on architectural excellence."
                themeColor="rgba(59, 130, 246, 1)" // Blue
              />

              {/* Female character card */}
              <CharacterCard
                gender="female"
                selected={selectedGender === "female"}
                onSelect={() => setSelectedGender("female")}
                imageSrc="/assets/personas/female_founder.png"
                title="Female"
                tagline="The Visionary Lead"
                description="Creative and innovative leader driving product-led growth."
                themeColor="rgba(168, 85, 247, 1)" // Purple
              />
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex flex-col items-center gap-6 sm:gap-8 w-full shrink-0">
            {/* Instructions toggle */}
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="group relative flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 hover:text-white transition-all"
            >
              <span className="w-4 h-[1px] bg-white/10 group-hover:bg-indigo-500 group-hover:w-8 transition-all" />
              {showInstructions ? "Hide" : "Show"} Game Manual
              <span className="w-4 h-[1px] bg-white/10 group-hover:bg-indigo-500 group-hover:w-8 transition-all" />
            </button>

            {/* Instructions Panel (Glassy) */}
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
                      text="Navigate through 2 industrial stages"
                    />
                    <InstructionItem
                      num="02"
                      text="Complete 8 strategic checkpoints"
                    />
                    <InstructionItem
                      num="03"
                      text="Earn Gold status for excellence"
                    />
                    <InstructionItem
                      num="04"
                      text="Unlock stages by defeating room bosses"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Launch Button */}
            <motion.div
              className="mt-2 mb-8 sm:mb-0"
              animate={selectedGender ? { scale: [1, 1.02, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Button
                onClick={handleStart}
                disabled={!selectedGender}
                className={`h-16 sm:h-20 px-10 sm:px-16 text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] rounded-full transition-all duration-500 overflow-hidden relative group ${
                  selectedGender
                    ? "bg-white text-black hover:tracking-[0.6em] shadow-[0_0_50px_rgba(255,255,255,0.2)] hover:shadow-[0_0_80px_rgba(255,255,255,0.4)]"
                    : "bg-white/5 text-white/20 border border-white/5 cursor-not-allowed"
                }`}
              >
                {selectedGender && (
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
                {selectedGender ? "Initiate Journey" : "Select Character"}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ── Internal Component: CharacterCard ────────────────────────────────────

interface CharacterCardProps {
  gender: string;
  selected: boolean;
  onSelect: () => void;
  imageSrc: string;
  title: string;
  tagline: string;
  description: string;
  themeColor: string;
}

function CharacterCard({
  selected,
  onSelect,
  imageSrc,
  title,
  tagline,
  description,
  themeColor,
}: CharacterCardProps) {
  return (
    <motion.button
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`group relative h-[360px] sm:h-[420px] md:h-[480px] lg:h-[500px] rounded-3xl sm:rounded-[40px] transition-all duration-500 overflow-hidden flex flex-col ${
        selected
          ? "w-[102%] sm:w-[110%] -mx-[1%] sm:-mx-[5%] z-20"
          : "w-full z-10"
      }`}
    >
      {/* Dynamic Glass Base */}
      <div
        className={`absolute inset-0 transition-all duration-500 ${
          selected
            ? "bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_0_60px_-15px_rgba(255,255,255,0.15)]"
            : "bg-white/[0.02] backdrop-blur-sm border border-white/5 grayscale group-hover:grayscale-0 group-hover:bg-white/[0.05]"
        }`}
      />

      {/* Selected Inner Glow */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-white/10 to-transparent pointer-events-none"
          />
        )}
      </AnimatePresence>

      <div className="relative h-full p-6 sm:p-8 lg:p-10 flex flex-col items-center justify-between">
        {/* Image Container with Glow */}
        <div className="relative w-full flex-1 min-h-[140px] flex items-center justify-center mb-4 sm:mb-6">
          {selected && (
            <motion.div
              layoutId={`glow-${title}`}
              className="absolute inset-0 rounded-full blur-[40px] sm:blur-[60px]"
              style={{ background: themeColor, opacity: 0.2 }}
            />
          )}

          <div
            className={`relative w-full h-full flex items-center justify-center transition-all duration-500 ease-out ${selected ? "scale-105 sm:scale-110 -translate-y-2" : "scale-100 opacity-60 group-hover:opacity-100 group-hover:scale-105"}`}
          >
            <div className="relative w-full h-full max-w-[200px] sm:max-w-[240px] md:max-w-[280px]">
              <Image
                src={imageSrc}
                alt={title}
                fill
                sizes="(max-width: 640px) 200px, (max-width: 768px) 240px, 280px"
                className="object-contain drop-shadow-2xl object-bottom"
                priority
              />
            </div>
          </div>
        </div>

        {/* Text Details */}
        <div className="text-center w-full z-10 shrink-0">
          <span
            className={`text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] transition-colors duration-500 block mb-1.5 sm:mb-2 ${selected ? "text-white" : "text-white/30 group-hover:text-white/50"}`}
          >
            {tagline}
          </span>
          <h3
            className={`text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tighter m-0 leading-none transition-all duration-500 ${selected ? "text-white scale-110" : "text-white/40 group-hover:text-white/70"}`}
          >
            {title}
          </h3>
          <AnimatePresence>
            {selected && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: 10 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: 10 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <p className="text-[10px] sm:text-xs text-white/60 w-full mt-4 leading-relaxed max-w-[260px] mx-auto">
                  {description}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Selected Checkmark */}
        {selected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-4 sm:top-6 right-4 sm:right-6 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center shadow-xl z-20"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-black"
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
