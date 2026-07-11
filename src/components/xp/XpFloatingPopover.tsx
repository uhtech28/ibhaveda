"use client";

/**
 * @file XpFloatingPopover.tsx
 * @description Floating "+N XP" popovers that reward the user visually
 *  for task submissions, checkpoint clears, and boss defeats.
 *
 * Design:
 *  - Listens to `XP_AWARDED` events on the shared event bridge.
 *  - Maintains a queue of active popups. Each popup carries its own id,
 *    amount, optional label, and horizontal jitter so simultaneous events
 *    (task submit + CP clear firing near-simultaneously) don't overlap.
 *  - Each popup floats upward 80px and fades out over 1.6s, then removes
 *    itself from the queue.
 *  - Positioned at 20% from top-center of the viewport — high enough to
 *    stay above the checkpoint panel but low enough to still feel tied
 *    to the world.
 *  - No new deps beyond framer-motion.
 *
 * Mount once at the /map/world layout level. It handles its own
 * subscription lifecycle.
 */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { eventBridge } from "@/lib/phaser/utils/event-bridge";

interface XpPopup {
  id: number;
  amount: number;
  label?: string;
  jitterX: number;
}

const POPUP_DURATION_MS = 1600;

export default function XpFloatingPopover() {
  const [queue, setQueue] = useState<XpPopup[]>([]);
  const nextIdRef = useRef(1);

  useEffect(() => {
    const handleXp = (event: { amount: number; label?: string }) => {
      if (!event || typeof event.amount !== "number" || event.amount <= 0) {
        return;
      }
      const id = nextIdRef.current++;
      // Small horizontal jitter (-40 → +40px) so overlapping popups fan out.
      const jitterX = (Math.random() - 0.5) * 80;
      setQueue((q) => [...q, { id, amount: event.amount, label: event.label, jitterX }]);

      // Auto-cleanup after the animation window closes.
      window.setTimeout(() => {
        setQueue((q) => q.filter((p) => p.id !== id));
      }, POPUP_DURATION_MS + 100);
    };

    eventBridge.onReact("XP_AWARDED", handleXp);
    return () => eventBridge.off("XP_AWARDED", handleXp);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[10015] flex justify-center overflow-visible">
      <div className="relative w-full max-w-md" style={{ top: "20%" }}>
        <AnimatePresence>
          {queue.map((p) => (
            <XpPopupItem key={p.id} popup={p} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function XpPopupItem({ popup }: { popup: XpPopup }) {
  // Larger XP amounts get bigger, brighter treatment.
  const scale = popup.amount >= 200 ? 1.35 : popup.amount >= 50 ? 1.15 : 1;
  const isBig = popup.amount >= 200;

  return (
    <motion.div
      initial={{ opacity: 0, y: 0, scale: scale * 0.6 }}
      animate={{
        opacity: [0, 1, 1, 0],
        y: [0, -20, -60, -85],
        scale: [scale * 0.6, scale * 1.1, scale, scale * 0.95],
      }}
      exit={{ opacity: 0 }}
      transition={{
        duration: POPUP_DURATION_MS / 1000,
        ease: "easeOut",
        times: [0, 0.15, 0.6, 1],
      }}
      className="absolute left-1/2 -translate-x-1/2 select-none whitespace-nowrap font-black tabular-nums"
      style={{
        left: `calc(50% + ${popup.jitterX}px)`,
        fontSize: isBig ? "44px" : "32px",
        fontFamily: "var(--font-pixel-display), monospace",
        letterSpacing: "0.02em",
        color: "transparent",
        backgroundImage:
          "linear-gradient(180deg, #fef3c7 0%, #fbbf24 50%, #d97706 100%)",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        textShadow: isBig
          ? "0 0 24px rgba(251,191,36,0.85), 0 0 48px rgba(251,191,36,0.5), 0 2px 0 rgba(120,53,15,0.85)"
          : "0 0 12px rgba(251,191,36,0.8), 0 2px 0 rgba(120,53,15,0.85)",
        filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.55))",
      }}
    >
      +{popup.amount} XP
      {popup.label ? (
        <span
          className="ml-2 text-white/85"
          style={{
            fontSize: isBig ? "22px" : "16px",
            textShadow: "0 2px 4px rgba(0,0,0,0.6)",
            WebkitTextFillColor: "rgba(255,255,255,0.85)",
          }}
        >
          · {popup.label}
        </span>
      ) : null}
    </motion.div>
  );
}
