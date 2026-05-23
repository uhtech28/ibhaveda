"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface StageSelectionScreenProps {
  onSelectStage: (stageId: number) => void;
  onBack?: () => void;
}

const STAGES = [
  {
    id: 1,
    name: "Ideation",
    subtitle: "Stage 1",
    description: "The spark of creation. Define the problem, brainstorm solutions, and map out your initial vision.",
    icon: "💡",
    checkpoints: 4,
    themeColor: "rgba(129, 140, 248, 1)", // Indigo
    glowColor: "#818cf8",
  },
  {
    id: 2,
    name: "Research",
    subtitle: "Stage 2",
    description: "Dive deep into the market. Analyze competitors, interview users, and validate your assumptions.",
    icon: "🔬",
    checkpoints: 4,
    themeColor: "rgba(167, 139, 250, 1)", // Violet
    glowColor: "#a78bfa",
  },
];

export function StageSelectionScreen({ onSelectStage, onBack }: StageSelectionScreenProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#050810] font-sans">
      {/* Background identical to IntroScreen for seamless transition */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-tr from-[#050810] via-[#0a0f25] to-[#050810]" />

        {/* Nebula Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#6366F1]/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#8B5CF6]/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />

        {/* Moving Stars (Layer 1 - Distant) */}
        {[...Array(60)].map((_, i) => (
          <motion.div
            key={`star-${i}`}
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/5 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] border border-white/[0.03] rounded-full" />
      </div>

      {/* Main content scrollable container */}
      <div className="absolute inset-0 overflow-y-auto no-scrollbar flex">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 w-full max-w-6xl m-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col items-center min-h-[min-content]"
        >
          {/* Back Button */}
          {onBack && (
            <button
              onClick={onBack}
              className="absolute top-4 left-4 sm:top-8 sm:left-8 group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white transition-all z-20"
            >
              <span className="w-6 h-[1px] bg-white/20 group-hover:bg-indigo-500 transition-all" />
              Back
            </button>
          )}

          {/* Header Section */}
          <div className="text-center mb-10 sm:mb-16 mt-8 sm:mt-4">
            <motion.h1
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 tracking-tighter uppercase italic"
              style={{ textShadow: "0 0 40px rgba(99, 102, 241, 0.4)" }}
            >
              Select Venture Stage
            </motion.h1>
            <p className="text-sm sm:text-base text-indigo-300/60 font-medium tracking-wide max-w-xl mx-auto px-4">
              Choose your current phase. Each stage contains critical checkpoints to validate your startup ideas.
            </p>
          </div>

          {/* Stages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 w-full max-w-4xl mx-auto px-2 sm:px-4">
            {STAGES.map((stage, index) => (
              <motion.button
                key={stage.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectStage(stage.id)}
                className="group relative h-[320px] sm:h-[380px] rounded-3xl sm:rounded-[40px] transition-all duration-500 overflow-hidden flex flex-col text-left w-full border border-white/10 bg-white/[0.02] backdrop-blur-sm hover:bg-white/[0.05]"
              >
                {/* Hover Glow Background */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `radial-gradient(circle at center, ${stage.glowColor}15 0%, transparent 70%)` }}
                />

                {/* Accent border at top */}
                <div
                  className="absolute top-0 left-0 right-0 h-1 opacity-50 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ backgroundColor: stage.glowColor }}
                />

                <div className="relative h-full p-8 sm:p-10 flex flex-col">
                  <div className="flex justify-between items-start mb-6">
                    <div
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl border border-white/10 shadow-lg relative transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3"
                      style={{ backgroundColor: `${stage.glowColor}10` }}
                    >
                      <span className="relative z-10">{stage.icon}</span>
                      <div className="absolute inset-0 rounded-2xl opacity-40 blur-lg transition-opacity duration-500 group-hover:opacity-80" style={{ backgroundColor: stage.glowColor }} />
                    </div>
                    <span className="text-[10px] sm:text-xs font-black tracking-[0.3em] uppercase px-4 py-2 rounded-full border border-white/10 bg-white/5 text-white/50 group-hover:text-white/80 group-hover:border-white/20 transition-all">
                      {stage.checkpoints} Levels
                    </span>
                  </div>

                  <div className="mt-auto">
                    <h3 className="text-[10px] sm:text-xs font-black text-white/40 uppercase tracking-[0.4em] mb-2 group-hover:text-white/60 transition-colors">
                      {stage.subtitle}
                    </h3>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 tracking-tight group-hover:text-white transition-colors"
                        style={{ textShadow: `0 0 20px ${stage.glowColor}40` }}>
                      {stage.name}
                    </h2>
                    <p className="text-sm sm:text-base text-white/50 leading-relaxed font-medium group-hover:text-white/70 transition-colors">
                      {stage.description}
                    </p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

        </motion.div>
      </div>
    </div>
  );
}
