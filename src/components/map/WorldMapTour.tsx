"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, Sparkles, AlertTriangle, Play, ChevronRight, ChevronLeft, X } from "lucide-react";
import { audioManager } from "@/lib/audio/audioManager";

interface WorldMapTourProps {
  show: boolean;
  onClose: () => void;
  ventureName: string;
}

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  sparkyTip: string;
  // Mask cutout settings
  cutoutType: "none" | "circle" | "rect";
  cutoutData?: {
    cx?: string;
    cy?: string;
    r?: string;
    x?: string;
    y?: string;
    w?: string;
    h?: string;
    rx?: string;
  };
}

export function WorldMapTour({ show, onClose, ventureName }: WorldMapTourProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (show) {
      setCurrentStep(0);
      audioManager.playUI("levelUp");
    }
  }, [show]);

  if (!show) return null;

  const steps: TourStep[] = [
    {
      title: `Welcome to the Map of ${ventureName}!`,
      description: "This world map is your journey to building a real startup venture. Complete checkpoints along the path to grow your business.",
      icon: <Compass className="w-8 h-8 text-yellow-400" />,
      sparkyTip: "Hey! I'm Sparky, your Venture Companion! ✨ Let's explore how we turn your raw ideas into a powerhouse!",
      cutoutType: "none",
    },
    {
      title: "The 8 Stages of Growth",
      description: "Your journey starts at Stage 1 (Ideation) and advances step-by-step all the way to Stage 8 (Scale). Use the Stage selector at the bottom to view the entire biome map.",
      icon: <Sparkles className="w-8 h-8 text-emerald-400" />,
      sparkyTip: "Each biome represents a different phase of startup validation. Unlock new biomes as you clear older ones!",
      cutoutType: "rect",
      cutoutData: {
        x: "5%",
        y: "82%",
        w: "90%",
        h: "16%",
        rx: "24",
      },
    },
    {
      title: "Venture Control Panel",
      description: "The Left Sidebar tracks your current Quest goals and active tasks. Clicking any open flag on the map loads its details here.",
      icon: <Compass className="w-8 h-8 text-indigo-400" />,
      sparkyTip: "Make sure to check the active tasks checklist! Every task completed brings us closer to clearing the checkpoint.",
      cutoutType: "rect",
      cutoutData: {
        x: "16px",
        y: "80px",
        w: "350px",
        h: "83%",
        rx: "24",
      },
    },
    {
      title: "Corruption & Prestige Medals",
      description: "Watch the Corruption Meter in the top HUD! Submitting evidence clean and fast maintains a high purity score, awarding prestigious Gold Medals on checkpoint and stage completions.",
      icon: <AlertTriangle className="w-8 h-8 text-amber-500" />,
      sparkyTip: "If corruption climbs too high, your prestige drops from Gold to Silver or Bronze. Strive for excellence!",
      cutoutType: "rect",
      cutoutData: {
        x: "15%",
        y: "12px",
        w: "70%",
        h: "85px",
        rx: "35",
      },
    },
    {
      title: "Active Checkpoints & Flags",
      description: "Ready to make history? Click on any active blinking flag on the main path to submit evidence, play mini-games, and conquer your startup goals!",
      icon: <Play className="w-8 h-8 text-yellow-400" />,
      sparkyTip: "Go get them! Complete Stage 1 to unlock your first major Completion Medal in your Profile Showcase!",
      cutoutType: "circle",
      cutoutData: {
        cx: "50%",
        cy: "50%",
        r: "120",
      },
    },
  ];

  const step = steps[currentStep];

  const handleNext = () => {
    audioManager.playUI("click");
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      onClose();
    }
  };

  const handleBack = () => {
    audioManager.playUI("click");
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  };

  const handleSkip = () => {
    audioManager.playUI("click");
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9990] flex items-center justify-center overflow-hidden">
        {/* SVG Spotlight Mask */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          <defs>
            <mask id="tour-spotlight-mask">
              {/* White background: fully opaque overlay mask */}
              <rect width="100%" height="100%" fill="white" />
              {/* Black cutouts: transparent spotlights */}
              {step.cutoutType === "circle" && step.cutoutData && (
                <circle
                  cx={step.cutoutData.cx}
                  cy={step.cutoutData.cy}
                  r={step.cutoutData.r}
                  fill="black"
                />
              )}
              {step.cutoutType === "rect" && step.cutoutData && (
                <rect
                  x={step.cutoutData.x}
                  y={step.cutoutData.y}
                  width={step.cutoutData.w}
                  height={step.cutoutData.h}
                  rx={step.cutoutData.rx}
                  fill="black"
                />
              )}
            </mask>
          </defs>
          {/* Backdrop applying the mask */}
          <rect
            width="100%"
            height="100%"
            fill="rgba(5, 8, 16, 0.78)"
            mask="url(#tour-spotlight-mask)"
            className="transition-all duration-500 ease-in-out"
          />
        </svg>

        {/* Backdrop catcher to close or prevent clicking outside */}
        <div className="absolute inset-0 z-0 pointer-events-auto" />

        {/* Tour Card Panel */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.85, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 50 }}
          transition={{ type: "spring", damping: 25, stiffness: 220 }}
          className="relative z-20 max-w-md w-[92%] bg-slate-900/90 border border-white/10 p-6 rounded-3xl shadow-2xl backdrop-blur-xl flex flex-col gap-6"
        >
          {/* Close button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header & Icon */}
          <div className="flex gap-4 items-start">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-inner">
              {step.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-extrabold text-white leading-tight drop-shadow-md">
                {step.title}
              </h2>
              <div className="text-[11px] font-bold text-yellow-500/80 uppercase tracking-widest mt-1">
                Step {currentStep + 1} of {steps.length}
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-slate-300 leading-relaxed">
            {step.description}
          </p>

          {/* Sparky Speech Bubble */}
          <div className="bg-slate-950/50 border border-indigo-500/20 p-4 rounded-2xl flex gap-3 items-start relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
            <div className="text-2xl shrink-0 mt-0.5 animate-bounce select-none">✨</div>
            <div className="flex-1 text-xs text-indigo-200 leading-relaxed font-medium italic">
              {step.sparkyTip}
            </div>
          </div>

          {/* Navigation Bar */}
          <div className="flex justify-between items-center mt-2">
            <button
              onClick={handleSkip}
              className="text-xs font-bold text-slate-400 hover:text-white transition-colors"
            >
              Skip Tour
            </button>

            <div className="flex gap-2 items-center">
              {currentStep > 0 && (
                <button
                  onClick={handleBack}
                  className="h-9 px-3 rounded-xl border border-white/10 flex items-center justify-center gap-1 text-xs font-extrabold text-slate-300 hover:text-white hover:bg-white/5 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              )}
              <button
                onClick={handleNext}
                className="h-10 px-5 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:brightness-110 active:scale-95 transition-all"
              >
                {currentStep === steps.length - 1 ? "Start Adventure" : "Next"}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Step indicators */}
          <div className="flex gap-1.5 justify-center mt-1">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStep ? "w-6 bg-yellow-400" : "w-1.5 bg-white/20"
                }`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
