"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface WelcomeOverlayProps {
  ventureName: string;
  onComplete: () => void;
}

export function WelcomeOverlay({
  ventureName,
  onComplete,
}: WelcomeOverlayProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Auto-dismiss after 3 seconds
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);

    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1;
      });
    }, 30); // 3000ms / 100 steps = 30ms per step

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [onComplete]);

  const handleSkip = () => {
    onComplete();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      onClick={handleSkip}
      className="fixed inset-0 z-[60] flex items-center justify-center cursor-pointer"
      style={{
        background: "rgba(5, 8, 16, 0.98)",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Background Stars */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(40)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-0.5 h-0.5 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.1, 0.6, 0.1],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Central Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] blur-[100px] opacity-30"
        style={{
          background:
            "radial-gradient(circle, rgba(99, 102, 241, 0.4), transparent)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-3xl">
        {/* Icon with Animation */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 150 }}
          className="flex justify-center mb-8"
        >
          <div
            className="relative w-24 h-24 rounded-3xl flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(79, 70, 229, 0.2))",
              border: "1px solid rgba(99, 102, 241, 0.4)",
              boxShadow: "0 0 60px rgba(99, 102, 241, 0.3)",
            }}
          >
            <Sparkles className="w-12 h-12 text-indigo-300" />
          </div>
        </motion.div>

        {/* Welcome Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-white mb-6 tracking-tight">
            Welcome to{" "}
            <span
              className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent"
              style={{
                textShadow: "0 0 40px rgba(99, 102, 241, 0.3)",
              }}
            >
              {ventureName}
            </span>
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-xl sm:text-2xl text-white/80 mb-12 leading-relaxed font-medium"
        >
          You&apos;re about to validate your startup idea.
        </motion.p>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="max-w-md mx-auto"
        >
          <div
            className="h-1.5 rounded-full overflow-hidden mb-3"
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(8px)",
            }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                background:
                  "linear-gradient(90deg, rgba(99, 102, 241, 1), rgba(168, 85, 247, 1))",
                boxShadow: "0 0 20px rgba(99, 102, 241, 0.5)",
              }}
              initial={{ width: "0%" }}
              transition={{ duration: 0.1 }}
            />
          </div>
          <p className="text-xs text-white/50 uppercase tracking-[0.3em] font-bold">
            Click anywhere to skip
          </p>
        </motion.div>

        {/* Decorative Elements */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="absolute -bottom-20 left-1/2 -translate-x-1/2 flex gap-4"
        >
          <div
            className="h-[1px] w-24 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"
          />
        </motion.div>
      </div>

      {/* Pulsing Ring Effect */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1.5, opacity: 0 }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeOut",
        }}
      >
        <div
          className="w-[400px] h-[400px] rounded-full"
          style={{
            border: "2px solid rgba(99, 102, 241, 0.3)",
          }}
        />
      </motion.div>

      {/* Secondary Pulsing Ring */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1.8, opacity: 0 }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeOut",
          delay: 0.5,
        }}
      >
        <div
          className="w-[400px] h-[400px] rounded-full"
          style={{
            border: "2px solid rgba(168, 85, 247, 0.3)",
          }}
        />
      </motion.div>
    </motion.div>
  );
}
