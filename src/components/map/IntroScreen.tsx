"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface IntroScreenProps {
  ventureName?: string;
  onStart: (gender: "male" | "female") => void;
}

export function IntroScreen({ ventureName = "Your Venture", onStart }: IntroScreenProps) {
  const [selectedGender, setSelectedGender] = useState<"male" | "female" | null>(null);
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
    <div className="fixed inset-0 z-50 bg-[#050810] flex items-center justify-center overflow-hidden font-sans">
      {/* ── Background: Parallax Galactic Starfield ─────────────────────────── */}
      <div className="absolute inset-0 z-0">
        {/* Deep Space Gradient */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#050810] via-[#0a0f25] to-[#050810]" />
        
        {/* Nebula Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#6366F1]/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#8B5CF6]/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />

        {/* Moving Stars (Layer 1 - Distant) */}
        {[...Array(80)].map((_, i) => (
          <motion.div
            key={`s1-${i}`}
            className="absolute w-0.5 h-0.5 bg-white rounded-full"
            initial={{ 
              x: Math.random() * 100 + "%", 
              y: Math.random() * 100 + "%",
              opacity: Math.random() * 0.5 
            }}
            animate={{ 
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.2, 1] 
            }}
            transition={{ 
              duration: 2 + Math.random() * 3, 
              repeat: Infinity,
              delay: Math.random() * 2
            }}
          />
        ))}

        {/* Orbits / Circular Accents */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/5 rounded-full pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] border border-white/[0.03] rounded-full pointer-events-none" />
      </div>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-5xl mx-auto px-6 py-12 flex flex-col items-center"
      >
        {/* Header Section */}
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-6xl font-black text-white mb-4 tracking-tighter uppercase italic"
            style={{ textShadow: "0 0 40px rgba(99, 102, 241, 0.4)" }}
          >
            Welcome to Your Journey
          </motion.h1>
          <div className="flex flex-col items-center gap-2">
            <p className="text-2xl text-indigo-300/80 font-medium tracking-wide bg-white/5 px-6 py-1 rounded-full backdrop-blur-sm border border-white/10 uppercase text-xs">
              {ventureName}
            </p>
            <div className="mt-6 flex items-center gap-4">
              <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
              <span className="text-[10px] text-indigo-400 font-black tracking-[0.3em] uppercase">8 Stages • 36 Checkpoints</span>
              <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
            </div>
          </div>
        </div>

        {/* Character Selection Grid */}
        <div className="w-full mb-16">
          <h2 className="text-sm font-black text-white/40 text-center uppercase tracking-[0.5em] mb-10">
            Choose Your Character
          </h2>

          <div className="grid grid-cols-2 gap-10 max-w-4xl mx-auto">
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
        <div className="flex flex-col items-center gap-8 w-full">
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
                className="w-full max-w-xl p-8 rounded-3xl bg-white/[0.03] border border-white/5 backdrop-blur-xl"
              >
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-[11px] text-white/60">
                  <InstructionItem num="01" text="Navigate through 8 industrial stages" />
                  <InstructionItem num="02" text="Complete 36 strategic checkpoints" />
                  <InstructionItem num="03" text="Earn Gold status for excellence" />
                  <InstructionItem num="04" text="Unlock stages by defeating room bosses" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Launch Button */}
          <motion.div 
            className="mt-4"
            animate={selectedGender ? { scale: [1, 1.02, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Button
              onClick={handleStart}
              disabled={!selectedGender}
              className={`h-20 px-16 text-xs font-black uppercase tracking-[0.4em] rounded-full transition-all duration-500 overflow-hidden relative group ${
                selectedGender
                  ? "bg-white text-black hover:tracking-[0.6em] shadow-[0_0_50px_rgba(255,255,255,0.2)]"
                  : "bg-white/5 text-white/20 border border-white/5 cursor-not-allowed"
              }`}
            >
              {selectedGender && (
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
              )}
              {selectedGender ? "Initiate Journey" : "Select Character"}
            </Button>
          </motion.div>
        </div>
      </motion.div>
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

function CharacterCard({ selected, onSelect, imageSrc, title, tagline, description, themeColor }: CharacterCardProps) {
  return (
    <motion.button
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`group relative h-[450px] rounded-[40px] transition-all duration-500 overflow-hidden ${
        selected 
          ? "w-[110%] -mx-[5%]" 
          : "w-full"
      }`}
    >
      {/* Dynamic Glass Base */}
      <div className={`absolute inset-0 transition-all duration-500 ${
        selected 
          ? "bg-white/10 backdrop-blur-2xl border-2 border-white/20 shadow-[0_0_80px_-20px_rgba(255,255,255,0.1)]" 
          : "bg-white/[0.02] backdrop-blur-sm border border-white/5 grayscale group-hover:grayscale-0 group-hover:bg-white/[0.05]"
      }`} />

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

      <div className="relative h-full p-10 flex flex-col items-center">
        {/* Image Container with Glow */}
        <div className="relative w-full aspect-square mb-6">
          {selected && (
            <motion.div 
              layoutId={`glow-${title}`}
              className="absolute inset-0 rounded-full blur-[60px]"
              style={{ background: themeColor, opacity: 0.2 }}
            />
          )}
          
          <div className={`relative w-full h-full flex items-center justify-center transition-all duration-500 ${selected ? "scale-110" : "scale-100 opacity-60 group-hover:opacity-100"}`}>
            <div className="relative w-[300px] h-[300px]">
               <Image
                src={imageSrc}
                alt={title}
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>

        {/* Text Details */}
        <div className="text-center mt-auto">
          <span className={`text-[10px] font-black uppercase tracking-[0.3em] transition-colors duration-500 ${selected ? "text-white" : "text-white/30"}`}>
            {tagline}
          </span>
          <h3 className={`text-4xl font-black uppercase tracking-tighter mt-1 transition-all duration-500 ${selected ? "text-white scale-110" : "text-white/40"}`}>
            {title}
          </h3>
          {selected && (
            <motion.p 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[11px] text-white/50 w-full mt-4 leading-relaxed max-w-[240px]"
            >
              {description}
            </motion.p>
          )}
        </div>

        {/* Selected Checkmark */}
        {selected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-8 right-8 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-xl"
          >
            <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
        )}
      </div>
    </motion.button>
  );
}

function InstructionItem({ num, text }: { num: string; text: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-indigo-500 font-black font-mono">{num}</span>
      <span className="leading-tight">{text}</span>
    </div>
  );
}
