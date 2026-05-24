"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { eventBridge } from "@/lib/phaser/utils/event-bridge";

interface FirstCheckpointPulseProps {
  onCheckpointClick: () => void;
}

export function FirstCheckpointPulse({
  onCheckpointClick,
}: FirstCheckpointPulseProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePosition = (e: { x: number; y: number; visible: boolean }) => {
      if (containerRef.current) {
        containerRef.current.style.left = `${e.x}px`;
        containerRef.current.style.top = `${e.y}px`;
        containerRef.current.style.display = e.visible ? "block" : "none";
      }
    };

    const unsub = eventBridge.onReact("TUTORIAL_PULSE_POSITION", handlePosition);
    return unsub;
  }, []);

  return (
    <>
      {/* CSS Keyframes */}
      <style jsx>{`
        @keyframes pulse-ring {
          0% {
            transform: scale(0.8);
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.6;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }

        @keyframes pulse-glow {
          0%,
          100% {
            opacity: 0.4;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.1);
          }
        }

        .pulse-ring {
          animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>

      {/* Positioned overlay for Checkpoint 1 */}
      <div
        ref={containerRef}
        className="fixed z-40 pointer-events-none"
        style={{
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          display: "none",
        }}
      >
        {/* Pulsing Rings */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Ring 1 */}
          <div
            className="pulse-ring absolute w-32 h-32 rounded-full"
            style={{
              border: "3px solid rgba(99, 102, 241, 0.6)",
              boxShadow: "0 0 30px rgba(99, 102, 241, 0.4)",
            }}
          />

          {/* Ring 2 - Delayed */}
          <div
            className="pulse-ring absolute w-32 h-32 rounded-full"
            style={{
              border: "3px solid rgba(168, 85, 247, 0.6)",
              boxShadow: "0 0 30px rgba(168, 85, 247, 0.4)",
              animationDelay: "0.5s",
            }}
          />

          {/* Ring 3 - More Delayed */}
          <div
            className="pulse-ring absolute w-32 h-32 rounded-full"
            style={{
              border: "3px solid rgba(139, 92, 246, 0.6)",
              boxShadow: "0 0 30px rgba(139, 92, 246, 0.4)",
              animationDelay: "1s",
            }}
          />

          {/* Central Glow */}
          <div
            className="pulse-glow absolute w-20 h-20 rounded-full blur-xl"
            style={{
              background:
                "radial-gradient(circle, rgba(99, 102, 241, 0.6), transparent)",
            }}
          />
        </div>

        {/* Rotating Particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: "rgba(99, 102, 241, 0.6)",
              boxShadow: "0 0 10px rgba(99, 102, 241, 0.8)",
              left: "50%",
              top: "50%",
            }}
            animate={{
              x: [
                Math.cos((i * Math.PI * 2) / 6) * 60,
                Math.cos(((i * Math.PI * 2) / 6) + Math.PI * 2) * 60,
              ],
              y: [
                Math.sin((i * Math.PI * 2) / 6) * 60,
                Math.sin(((i * Math.PI * 2) / 6) + Math.PI * 2) * 60,
              ],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "linear",
              delay: i * 0.3,
            }}
          />
        ))}
      </div>
    </>
  );
}
