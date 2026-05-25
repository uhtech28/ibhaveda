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
  selector: string | null;
  fallbackSelector?: string | null;
  shape?: "circle" | "rect" | "none";
  rx?: number;
  padding?: number;
}

export function WorldMapTour({ show, onClose, ventureName }: WorldMapTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    rx: number;
    shape: "circle" | "rect" | "none";
  }>({ x: 0, y: 0, width: 0, height: 0, rx: 8, shape: "none" });

  const steps: TourStep[] = [
    {
      title: `Welcome to the Map of ${ventureName}!`,
      description: "This world map represents your journey to building a real startup venture. Let's guide you through the key elements of the interactive layout.",
      icon: <Compass className="w-8 h-8 text-yellow-400" />,
      sparkyTip: "Hey! I'm Sparky, your Venture Companion! ✨ Let's explore how we turn your raw ideas into a powerhouse!",
      selector: null,
      shape: "none",
    },
    {
      title: "Interactive Checkpoint Path",
      description: "The main path features interactive gemstone nodes. Red nodes are pending, glowing green nodes are completed, and golden stars represent prestige completions. Blinking nodes show your active quest goals. Click any node to view its detailed requirements!",
      icon: <Play className="w-8 h-8 text-emerald-400" />,
      sparkyTip: "Completing checkpoints advances your character and companion sprites along the trail!",
      selector: "canvas",
      shape: "circle",
    },
    {
      title: "Biome Navigation & Progress",
      description: "Your startup growth is tracked across 36 checkpoints. The bottom HUD panel displays your active Stage (Ideation to Scale), completed checkpoints count, current user Level, and XP progression.",
      icon: <Sparkles className="w-8 h-8 text-yellow-400" />,
      sparkyTip: "Unlock new biomes as you clear older ones! Each biome features unique graphic styles and ambient loops.",
      selector: "#bottom-hud-control",
      shape: "rect",
      rx: 16,
      padding: 10,
    },
    {
      title: "Venture Control Sidebar",
      description: "The left sidebar houses all utility buttons (All Tools, Kanban Board, Calendar, Settings, and Help). When you add contributors to your team, their companion sprites will automatically appear orbiting around your main character on the map!",
      icon: <Compass className="w-8 h-8 text-indigo-400" />,
      sparkyTip: "Hover over companion sprites on the map to see their username, role, and online/offline status!",
      selector: "#left-control-panel",
      shape: "rect",
      rx: 20,
      padding: 12,
    },
    {
      title: "Quest Log & Task Tiers",
      description: "This top-right panel shows your current quest objectives. Each checkpoint consists of Task Tiers (T1, T2, T3) that must be cleared to advance. Lock icons represent sequential tasks that unlock once previous tiers are completed.",
      icon: <Sparkles className="w-8 h-8 text-violet-400" />,
      sparkyTip: "Complete tasks using specific tool integrations to earn high-purity points!",
      selector: "#hud-quest-log",
      shape: "rect",
      rx: 16,
      padding: 8,
    },
    {
      title: "Purity & Boss Battles",
      description: "Keep an eye on the corruption level! Creeping corruption triggers boss encounters (like The Wraith Council). Completing tasks fast and clean deals damage to the boss, restoring purity to secure Prestige points.",
      icon: <AlertTriangle className="w-8 h-8 text-amber-500" />,
      sparkyTip: "Defeat corruption bosses to keep your venture healthy and secure shiny Completion Medals for your Profile Showcase!",
      selector: "#boss-hp-bar",
      fallbackSelector: "#bottom-hud-control",
      shape: "rect",
      rx: 20,
      padding: 12,
    },
  ];

  useEffect(() => {
    if (show) {
      setCurrentStep(0);
      audioManager.playLevelUp();
    }
  }, [show]);

  // Handle dynamic DOM measurements and responsive recalculations
  useEffect(() => {
    if (!show) return;

    const updateTargetRect = () => {
      const step = steps[currentStep];
      if (!step || !step.selector) {
        setTargetRect({ x: 0, y: 0, width: 0, height: 0, rx: 0, shape: "none" });
        return;
      }

      let element = document.querySelector(step.selector) as HTMLElement | null;
      
      // Fallback logic
      if (!element && step.fallbackSelector) {
        element = document.querySelector(step.fallbackSelector) as HTMLElement | null;
      }

      if (element) {
        const rect = element.getBoundingClientRect();
        const padding = step.padding ?? 8;
        const x = rect.left - padding;
        const y = rect.top - padding;
        const width = rect.width + padding * 2;
        const height = rect.height + padding * 2;
        const rx = step.rx ?? 16;
        
        setTargetRect({
          x,
          y,
          width,
          height,
          rx,
          shape: step.shape ?? "rect",
        });

        // Add glow class to targeted element
        element.classList.add("tour-glow-active");
        
        // Clean up previously active glow elements
        const allGlowElements = document.querySelectorAll(".tour-glow-active");
        allGlowElements.forEach((el) => {
          if (el !== element) {
            el.classList.remove("tour-glow-active");
          }
        });
      } else {
        // Fallback to center or default if selector is canvas/center
        if (step.selector === "canvas" || step.selector === "center") {
          const cx = window.innerWidth / 2;
          const cy = window.innerHeight / 2;
          const r = 130;
          setTargetRect({
            x: cx - r,
            y: cy - r,
            width: r * 2,
            height: r * 2,
            rx: r,
            shape: "circle",
          });
        } else {
          setTargetRect({ x: 0, y: 0, width: 0, height: 0, rx: 0, shape: "none" });
        }
      }
    };

    updateTargetRect();
    
    window.addEventListener("resize", updateTargetRect);
    window.addEventListener("scroll", updateTargetRect);
    
    // Interval polling for async mounted components
    const interval = setInterval(updateTargetRect, 250);

    return () => {
      window.removeEventListener("resize", updateTargetRect);
      window.removeEventListener("scroll", updateTargetRect);
      clearInterval(interval);
      
      const allGlowElements = document.querySelectorAll(".tour-glow-active");
      allGlowElements.forEach((el) => {
        el.classList.remove("tour-glow-active");
      });
    };
  }, [currentStep, show]);

  if (!show) return null;

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

  // Card layout positioning helper: keep card in the middle with previous layout size
  const getCardStyle = () => {
    return {
      width: "min(448px, 92%)",
    };
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9990] flex items-center justify-center overflow-hidden">
        {/* Dynamic global CSS injector for pulsing glow borders */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @keyframes tour-pulse-glow {
                0%, 100% {
                  box-shadow: 0 0 15px rgba(99, 102, 241, 0.5), 0 0 25px rgba(99, 102, 241, 0.25);
                  border-color: rgba(99, 102, 241, 0.6) !important;
                }
                50% {
                  box-shadow: 0 0 30px rgba(99, 102, 241, 0.9), 0 0 50px rgba(99, 102, 241, 0.45);
                  border-color: rgba(99, 102, 241, 1) !important;
                }
              }
              .tour-glow-active {
                animation: tour-pulse-glow 1.5s infinite ease-in-out !important;
                border-width: 1.5px !important;
                border-color: rgba(99, 102, 241, 0.8) !important;
                z-index: 9995 !important;
              }
            `
          }}
        />

        {/* SVG Spotlight Mask */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          <defs>
            <mask id="tour-spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              {targetRect.shape !== "none" && (
                <motion.rect
                  animate={{
                    x: targetRect.x,
                    y: targetRect.y,
                    width: targetRect.width,
                    height: targetRect.height,
                    rx: targetRect.shape === "circle" ? targetRect.width / 2 : targetRect.rx,
                  }}
                  transition={{ type: "spring", stiffness: 140, damping: 22 }}
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(5, 8, 16, 0.82)"
            mask="url(#tour-spotlight-mask)"
          />
        </svg>

        {/* Prevent background interaction during walkthrough */}
        <div className="absolute inset-0 z-0 pointer-events-auto" />

        {/* Tour Card Panel */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          style={getCardStyle()}
          className="relative z-20 bg-slate-900/90 border border-white/10 p-6 rounded-3xl shadow-2xl backdrop-blur-xl flex flex-col gap-6"
        >
          {/* Close button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 z-50 w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header & Icon */}
          <div className="flex gap-4 items-start">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-inner">
              {step.icon}
            </div>
            <div className="flex-1 min-w-0 pr-8">
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
