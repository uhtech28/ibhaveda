"use client";

import { motion } from "framer-motion";
import { MousePointer2 } from "lucide-react";

interface FirstCheckpointPulseProps {
  onCheckpointClick: () => void;
}

export function FirstCheckpointPulse({
  onCheckpointClick,
}: FirstCheckpointPulseProps) {
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

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes bounce-arrow {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-5px);
          }
        }

        .pulse-ring {
          animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        .float-text {
          animation: float 3s ease-in-out infinite;
        }

        .bounce-arrow {
          animation: bounce-arrow 1.5s ease-in-out infinite;
        }
      `}</style>

      {/* Positioned overlay for Checkpoint 1 */}
      <div
        className="fixed z-40 pointer-events-none"
        style={{
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
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

        {/* Floating "Start Here!" Text */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="absolute -top-28 left-1/2 -translate-x-1/2 pointer-events-auto"
        >
          <div className="float-text relative">
            {/* Background Glow */}
            <div
              className="absolute inset-0 blur-2xl opacity-60"
              style={{
                background:
                  "radial-gradient(ellipse, rgba(99, 102, 241, 0.5), transparent)",
              }}
            />

            {/* Card Container */}
            <div
              className="relative px-6 py-3 rounded-2xl"
              style={{
                background:
                  "linear-gradient(135deg, rgba(10, 15, 30, 0.95), rgba(15, 20, 35, 0.95))",
                border: "2px solid rgba(99, 102, 241, 0.4)",
                backdropFilter: "blur(12px)",
                boxShadow:
                  "0 10px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(99, 102, 241, 0.3)",
              }}
            >
              <div className="flex items-center gap-2">
                <MousePointer2
                  className="w-5 h-5 text-indigo-400 bounce-arrow"
                />
                <span className="text-lg font-black text-white uppercase tracking-wide whitespace-nowrap">
                  Start Here!
                </span>
              </div>

              {/* Sparkle Effect */}
              <motion.div
                className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-indigo-400"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [1, 0.5, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{
                  boxShadow: "0 0 10px rgba(99, 102, 241, 0.8)",
                }}
              />
            </div>

            {/* Arrow Pointing Down */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
              <motion.div
                animate={{
                  y: [0, 5, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-indigo-400/80"
                >
                  <path
                    d="M12 5v14m0 0l-7-7m7 7l7-7"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Hint Text Below */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="absolute top-24 left-1/2 -translate-x-1/2 pointer-events-none"
        >
          <div className="float-text">
            <p
              className="text-xs text-white/60 uppercase tracking-[0.3em] font-bold whitespace-nowrap text-center"
              style={{ animationDelay: "0.5s" }}
            >
              Click to begin
            </p>
          </div>
        </motion.div>

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
