"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * PremiumMapFrame - Decorative frame overlay for the world map
 * Adds corner ornaments, borders, and atmospheric vignette
 */
export function PremiumMapFrame() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[5]"
      style={{
        mixBlendMode: "normal",
      }}
    >
      {/* Vignette overlay for depth */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.4) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Top border with gradient */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, #fbbf24 20%, #6366f1 50%, #fbbf24 80%, transparent 100%)",
          boxShadow: "0 0 20px rgba(99, 102, 241, 0.5)",
        }}
      />

      {/* Bottom border with gradient */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, #fbbf24 20%, #6366f1 50%, #fbbf24 80%, transparent 100%)",
          boxShadow: "0 0 20px rgba(99, 102, 241, 0.5)",
        }}
      />

      {/* Left border with gradient */}
      <div
        className="absolute top-0 bottom-0 left-0 w-1"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, #fbbf24 20%, #6366f1 50%, #fbbf24 80%, transparent 100%)",
          boxShadow: "0 0 20px rgba(99, 102, 241, 0.5)",
        }}
      />

      {/* Right border with gradient */}
      <div
        className="absolute top-0 bottom-0 right-0 w-1"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, #fbbf24 20%, #6366f1 50%, #fbbf24 80%, transparent 100%)",
          boxShadow: "0 0 20px rgba(99, 102, 241, 0.5)",
        }}
      />

      {/* Top-left corner ornament */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="absolute top-4 left-4"
        style={{
          width: "80px",
          height: "80px",
        }}
      >
        <svg
          width="80"
          height="80"
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer arc */}
          <path
            d="M 10 70 Q 10 10 70 10"
            stroke="url(#corner-gradient)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          {/* Inner arc */}
          <path
            d="M 15 65 Q 15 15 65 15"
            stroke="url(#corner-gradient-light)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            opacity="0.6"
          />
          {/* Decorative dots */}
          <circle cx="10" cy="70" r="4" fill="#fbbf24" opacity="0.8" />
          <circle cx="70" cy="10" r="4" fill="#6366f1" opacity="0.8" />
          <circle cx="40" cy="40" r="2" fill="#fcd34d" opacity="0.6" />

          <defs>
            <linearGradient id="corner-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="50%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <linearGradient id="corner-gradient-light" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fcd34d" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      {/* Top-right corner ornament */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="absolute top-4 right-4"
        style={{
          width: "80px",
          height: "80px",
          transform: "scaleX(-1)",
        }}
      >
        <svg
          width="80"
          height="80"
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 10 70 Q 10 10 70 10"
            stroke="url(#corner-gradient-2)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 15 65 Q 15 15 65 15"
            stroke="url(#corner-gradient-light-2)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            opacity="0.6"
          />
          <circle cx="10" cy="70" r="4" fill="#fbbf24" opacity="0.8" />
          <circle cx="70" cy="10" r="4" fill="#6366f1" opacity="0.8" />
          <circle cx="40" cy="40" r="2" fill="#fcd34d" opacity="0.6" />

          <defs>
            <linearGradient id="corner-gradient-2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="50%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <linearGradient id="corner-gradient-light-2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fcd34d" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      {/* Bottom-left corner ornament */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="absolute bottom-4 left-4"
        style={{
          width: "80px",
          height: "80px",
          transform: "scaleY(-1)",
        }}
      >
        <svg
          width="80"
          height="80"
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 10 70 Q 10 10 70 10"
            stroke="url(#corner-gradient-3)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 15 65 Q 15 15 65 15"
            stroke="url(#corner-gradient-light-3)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            opacity="0.6"
          />
          <circle cx="10" cy="70" r="4" fill="#fbbf24" opacity="0.8" />
          <circle cx="70" cy="10" r="4" fill="#6366f1" opacity="0.8" />
          <circle cx="40" cy="40" r="2" fill="#fcd34d" opacity="0.6" />

          <defs>
            <linearGradient id="corner-gradient-3" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="50%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <linearGradient id="corner-gradient-light-3" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fcd34d" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      {/* Bottom-right corner ornament */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="absolute bottom-4 right-4"
        style={{
          width: "80px",
          height: "80px",
          transform: "scale(-1)",
        }}
      >
        <svg
          width="80"
          height="80"
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 10 70 Q 10 10 70 10"
            stroke="url(#corner-gradient-4)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 15 65 Q 15 15 65 15"
            stroke="url(#corner-gradient-light-4)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            opacity="0.6"
          />
          <circle cx="10" cy="70" r="4" fill="#fbbf24" opacity="0.8" />
          <circle cx="70" cy="10" r="4" fill="#6366f1" opacity="0.8" />
          <circle cx="40" cy="40" r="2" fill="#fcd34d" opacity="0.6" />

          <defs>
            <linearGradient id="corner-gradient-4" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="50%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <linearGradient id="corner-gradient-light-4" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fcd34d" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      {/* Floating ambient particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: "4px",
            height: "4px",
            background:
              i % 2 === 0
                ? "radial-gradient(circle, #fbbf24 0%, transparent 70%)"
                : "radial-gradient(circle, #6366f1 0%, transparent 70%)",
            left: `${10 + i * 12}%`,
            top: `${20 + (i % 3) * 25}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.7, 0.3],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.3,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Shimmering edge highlights */}
      <motion.div
        className="absolute top-0 left-1/4 w-1/2 h-0.5"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(251, 191, 36, 0.6) 50%, transparent 100%)",
          filter: "blur(2px)",
        }}
        animate={{
          opacity: [0.3, 0.8, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute bottom-0 left-1/4 w-1/2 h-0.5"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(99, 102, 241, 0.6) 50%, transparent 100%)",
          filter: "blur(2px)",
        }}
        animate={{
          opacity: [0.3, 0.8, 0.3],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      />
    </div>
  );
}
