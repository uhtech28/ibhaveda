"use client";

import { useEffect, useState, type ReactElement } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { TutorialSpeechBubble } from "./TutorialSpeechBubble";
import { SparkyPixelDog, type DogMood } from "./puppy/SparkyPixelDog";

export type SparkyMood = "idle" | "talking" | "pointing" | "celebrating";

interface TutorialMascotProps {
  visible: boolean;
  text: string;
  mood?: SparkyMood;
  primaryAction?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
  anchor?: "bottom-right" | "bottom-center" | "bottom-left";
}

const POSE_GLOW: Record<SparkyMood, string> = {
  idle:        "rgba(255, 255, 255, 0.20)",
  talking:     "rgba(56, 189, 248, 0.45)",
  pointing:    "rgba(99, 102, 241, 0.55)",
  celebrating: "rgba(251, 191, 36, 0.65)",
};

export function TutorialMascot({
  visible,
  text,
  mood = "talking",
  primaryAction,
  secondaryAction,
  anchor = "bottom-right",
}: TutorialMascotProps): ReactElement | null {
  const anchorClass =
    anchor === "bottom-right"
      ? "right-4 sm:right-6"
      : anchor === "bottom-center"
        ? "left-1/2 -translate-x-1/2"
        : "left-4 sm:left-6";

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const portal = createPortal(
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className={`fixed bottom-4 sm:bottom-6 ${anchorClass} z-[10010]`}
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <div className="flex flex-col items-end gap-2">
            <div className="pointer-events-auto">
              <TutorialSpeechBubble
                text={text}
                primaryAction={primaryAction}
                secondaryAction={secondaryAction}
                side="bottom"
              />
            </div>
            <SparkyMascotImage mood={mood} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
  return portal as unknown as ReactElement;
}

function SparkyMascotImage({ mood }: { mood: SparkyMood }) {
  return (
    <div
      style={{
        width: 170,
        height: 170,
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: `radial-gradient(circle at 50% 65%, ${POSE_GLOW[mood]}, transparent 70%)`,
          filter: "blur(6px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <SparkyPixelDog mood={mood as DogMood} size={150} />
      </div>
    </div>
  );
}
