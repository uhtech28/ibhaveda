"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, X, Map, Target, CheckCircle } from "lucide-react";

interface MapIntroOverlayProps {
  onComplete: () => void;
}

const TUTORIAL_STEPS = [
  {
    id: 1,
    title: "This is your venture map",
    description:
      "Navigate through industrial stages and discover opportunities to validate your startup idea.",
    icon: Map,
    highlight: "map-area",
  },
  {
    id: 2,
    title: "Each checkpoint validates your idea",
    description:
      "Complete strategic tasks at each checkpoint to build confidence in your business concept.",
    icon: Target,
    highlight: "checkpoint-area",
  },
  {
    id: 3,
    title: "Complete tasks to progress",
    description:
      "Earn Gold status by completing all tasks with excellence. Unlock new stages and advance your journey.",
    icon: CheckCircle,
    highlight: "progress-area",
  },
];

export function MapIntroOverlay({ onComplete }: MapIntroOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("tutorial_completed", "true");
    }
    onComplete();
  };

  const handleSkip = () => {
    handleComplete();
  };

  const step = TUTORIAL_STEPS[currentStep];
  const Icon = step.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: "rgba(5, 8, 16, 0.85)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Skip Button */}
      <button
        onClick={handleSkip}
        className="absolute top-6 right-6 z-10 group flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 hover:scale-105"
        style={{
          background: "rgba(255, 255, 255, 0.05)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(8px)",
        }}
      >
        <span className="text-xs font-medium text-white/60 group-hover:text-white/90 uppercase tracking-wider">
          Skip Tutorial
        </span>
        <X className="w-4 h-4 text-white/60 group-hover:text-white/90" />
      </button>

      {/* Tutorial Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative max-w-2xl mx-4"
        >
          <Card
            className="border-0 overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, rgba(10, 15, 30, 0.95), rgba(15, 20, 35, 0.95))",
              backdropFilter: "blur(20px)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            }}
          >
            <CardContent className="p-8 sm:p-12">
              {/* Icon with Glow */}
              <div className="flex justify-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="relative"
                >
                  <div
                    className="absolute inset-0 blur-2xl opacity-50"
                    style={{
                      background:
                        "radial-gradient(circle, rgba(99, 102, 241, 0.4), transparent)",
                    }}
                  />
                  <div
                    className="relative w-20 h-20 rounded-2xl flex items-center justify-center"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(79, 70, 229, 0.1))",
                      border: "1px solid rgba(99, 102, 241, 0.3)",
                      boxShadow: "0 0 30px rgba(99, 102, 241, 0.2)",
                    }}
                  >
                    <Icon className="w-10 h-10 text-indigo-400" />
                  </div>
                </motion.div>
              </div>

              {/* Title */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl sm:text-4xl font-black text-white text-center mb-4 tracking-tight"
              >
                {step.title}
              </motion.h2>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-base sm:text-lg text-white/70 text-center leading-relaxed mb-8 max-w-lg mx-auto"
              >
                {step.description}
              </motion.p>

              {/* Progress Dots */}
              <div className="flex justify-center gap-2 mb-8">
                {TUTORIAL_STEPS.map((_, index) => (
                  <motion.div
                    key={index}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="rounded-full transition-all duration-300"
                    style={{
                      width: index === currentStep ? "32px" : "8px",
                      height: "8px",
                      background:
                        index === currentStep
                          ? "rgba(99, 102, 241, 1)"
                          : "rgba(255, 255, 255, 0.2)",
                      boxShadow:
                        index === currentStep
                          ? "0 0 20px rgba(99, 102, 241, 0.5)"
                          : "none",
                    }}
                  />
                ))}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-center gap-4">
                <Button
                  onClick={handleNext}
                  className="group relative h-14 px-8 text-sm font-black uppercase tracking-[0.2em] rounded-full overflow-hidden transition-all duration-300 hover:tracking-[0.3em] hover:scale-105"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(99, 102, 241, 1), rgba(79, 70, 229, 1))",
                    border: "none",
                    color: "white",
                    boxShadow: "0 10px 30px rgba(99, 102, 241, 0.3)",
                  }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                  <span className="relative z-10 flex items-center gap-2">
                    {currentStep < TUTORIAL_STEPS.length - 1 ? (
                      <>
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </>
                    ) : (
                      "Get Started"
                    )}
                  </span>
                </Button>
              </div>

              {/* Step Counter */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-6 text-center"
              >
                <span className="text-xs font-mono text-white/40 tracking-wider">
                  {currentStep + 1} / {TUTORIAL_STEPS.length}
                </span>
              </motion.div>
            </CardContent>
          </Card>

          {/* Decorative Arrow Pointing Down (on last step) */}
          {currentStep === TUTORIAL_STEPS.length - 1 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 10 }}
              transition={{
                delay: 0.8,
                duration: 1.5,
                repeat: Infinity,
                repeatType: "reverse",
              }}
              className="absolute -bottom-16 left-1/2 -translate-x-1/2"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                className="text-indigo-400/60"
              >
                <path
                  d="M12 5v14m0 0l7-7m-7 7l-7-7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Background Stars */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
