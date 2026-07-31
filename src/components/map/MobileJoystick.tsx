"use client";

/**
 * MobileJoystick — a lightweight virtual joystick for touch devices.
 *
 * Rendered as a fixed overlay in the bottom-left of the viewport on
 * touch screens only. Emits normalised {x, y} vectors in [-1, 1] via
 * eventBridge on every pointer move; VillageMapScene reads the vector
 * from update() and applies it to character velocity.
 *
 * Zero deps — pure pointer events. Works on iOS, Android, and any
 * pointer-capable device. Auto-hides on non-touch clients so desktop
 * doesn't see a dead control.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { eventBridge } from "@/lib/phaser/utils/event-bridge";

// Base + knob dimensions in CSS pixels.
const BASE_SIZE = 130;
const KNOB_SIZE = 58;
const RADIUS = (BASE_SIZE - KNOB_SIZE) / 2;

interface Props {
  /** Hide the joystick regardless of touch capability (e.g. during
   *  modals). Defaults to false. */
  hidden?: boolean;
}

export function MobileJoystick({ hidden = false }: Props) {
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const [supported, setSupported] = useState(false);
  // Live drag state kept in refs so pointer-move doesn't re-render.
  const activePointerId = useRef<number | null>(null);
  const centerRef = useRef<{ cx: number; cy: number }>({ cx: 0, cy: 0 });

  // Detect touch support only on the client. SSR renders nothing.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isTouch =
      "ontouchstart" in window ||
      (typeof navigator !== "undefined" && navigator.maxTouchPoints > 0);
    setSupported(isTouch);
  }, []);

  const resetKnob = useCallback(() => {
    if (!knobRef.current) return;
    knobRef.current.style.transform = `translate3d(0, 0, 0)`;
  }, []);

  const emit = useCallback((x: number, y: number) => {
    eventBridge.dispatchToPhaser({
      type: "JOYSTICK_MOVE",
      x,
      y,
    } as unknown as { type: "JOYSTICK_MOVE" });
  }, []);

  const emitStop = useCallback(() => {
    // Null vector = joystick released, character should stop.
    // We reuse the JOYSTICK_MOVE type; scene checks for null payload.
    eventBridge.dispatchToPhaser({
      type: "JOYSTICK_MOVE",
      x: 0,
      y: 0,
      released: true,
    } as unknown as { type: "JOYSTICK_MOVE" });
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const base = baseRef.current;
      if (!base) return;
      const rect = base.getBoundingClientRect();
      centerRef.current = {
        cx: rect.left + rect.width / 2,
        cy: rect.top + rect.height / 2,
      };
      activePointerId.current = e.pointerId;
      base.setPointerCapture(e.pointerId);
      // Snap knob to touch point on first contact for immediate response.
      updateKnob(e.clientX, e.clientY);
      e.preventDefault();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const updateKnob = (clientX: number, clientY: number) => {
    const knob = knobRef.current;
    if (!knob) return;
    const { cx, cy } = centerRef.current;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > RADIUS) {
      dx = (dx / dist) * RADIUS;
      dy = (dy / dist) * RADIUS;
    }
    knob.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
    // Normalise to [-1, 1] for the scene.
    emit(dx / RADIUS, dy / RADIUS);
  };

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (activePointerId.current !== e.pointerId) return;
      updateKnob(e.clientX, e.clientY);
      e.preventDefault();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (activePointerId.current !== e.pointerId) return;
      activePointerId.current = null;
      const base = baseRef.current;
      if (base) {
        try {
          base.releasePointerCapture(e.pointerId);
        } catch {
          // Some browsers throw if capture was already released; ignore.
        }
      }
      resetKnob();
      emitStop();
      e.preventDefault();
    },
    [resetKnob, emitStop],
  );

  if (!supported || hidden) return null;

  return (
    <div
      ref={baseRef}
      className="mobile-joystick-base"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      aria-label="Movement joystick"
      role="button"
    >
      <div ref={knobRef} className="mobile-joystick-knob" />
      <style jsx>{`
        .mobile-joystick-base {
          position: fixed;
          left: 24px;
          bottom: 96px;
          width: ${BASE_SIZE}px;
          height: ${BASE_SIZE}px;
          border-radius: 50%;
          background:
            radial-gradient(circle at 50% 40%, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.03) 60%, transparent 75%),
            rgba(15, 20, 35, 0.55);
          border: 1.5px solid rgba(255, 255, 255, 0.18);
          box-shadow:
            0 12px 32px -12px rgba(0, 0, 0, 0.6),
            inset 0 0 20px rgba(0, 0, 0, 0.35);
          touch-action: none;
          user-select: none;
          -webkit-user-select: none;
          -webkit-tap-highlight-color: transparent;
          z-index: 70;
          backdrop-filter: blur(8px);
        }
        .mobile-joystick-knob {
          position: absolute;
          left: ${(BASE_SIZE - KNOB_SIZE) / 2}px;
          top: ${(BASE_SIZE - KNOB_SIZE) / 2}px;
          width: ${KNOB_SIZE}px;
          height: ${KNOB_SIZE}px;
          border-radius: 50%;
          background: linear-gradient(155deg, #a5b4fc, #6366f1 55%, #4338ca);
          border: 1.5px solid rgba(255, 255, 255, 0.55);
          box-shadow:
            0 8px 18px -6px rgba(0, 0, 0, 0.6),
            0 0 24px rgba(99, 102, 241, 0.35);
          pointer-events: none;
          transition: transform 60ms ease-out;
          transform: translate3d(0, 0, 0);
        }
      `}</style>
    </div>
  );
}
