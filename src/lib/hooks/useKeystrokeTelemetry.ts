"use client";

/**
 * Capture keystroke and paste telemetry while the user answers a combat
 * question. The output ships back to the server alongside the answer
 * and is one input to the anti-cheat composite score.
 *
 * Telemetry tracked:
 *   - typed character count (from real keypresses)
 *   - pasted character count (from clipboard events)
 *   - count of paste events
 *   - mean and variance of inter-keypress intervals
 *   - count of backspace/delete operations
 *
 * We never block the user's input — instrumentation is purely
 * observational. Calling `reset()` clears state for the next question.
 */

import { useCallback, useMemo, useRef } from "react";
import type { KeystrokeTelemetry } from "@/lib/combat/types";

interface InternalState {
  typedCharCount: number;
  pastedCharCount: number;
  pasteEventCount: number;
  editEventCount: number;
  /** Timestamps (performance.now()) for each keypress that produced a char. */
  keystrokeTimes: number[];
}

const EDIT_KEYS = new Set(["Backspace", "Delete"]);

export interface TelemetryHandlers {
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onPaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
}

export interface UseKeystrokeTelemetry {
  handlers: TelemetryHandlers;
  /** Snapshot the current telemetry — call right before submitting. */
  snapshot: () => KeystrokeTelemetry;
  /** Clear all captured state. */
  reset: () => void;
}

export function useKeystrokeTelemetry(): UseKeystrokeTelemetry {
  const stateRef = useRef<InternalState>(emptyState());

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const s = stateRef.current;
    if (EDIT_KEYS.has(e.key)) {
      s.editEventCount += 1;
      return;
    }
    // Only count keys that would actually produce a character or whitespace.
    // We intentionally include Space and Enter; we exclude pure modifier/nav.
    if (e.key.length === 1 || e.key === "Enter") {
      s.typedCharCount += 1;
      s.keystrokeTimes.push(performance.now());
    }
  }, []);

  const onPaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const s = stateRef.current;
    const pastedText = e.clipboardData.getData("text") ?? "";
    s.pastedCharCount += pastedText.length;
    s.pasteEventCount += 1;
  }, []);

  const snapshot = useCallback((): KeystrokeTelemetry => {
    const s = stateRef.current;
    const gaps = computeGaps(s.keystrokeTimes);
    const mean = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : null;
    const variance =
      gaps.length && mean !== null
        ? gaps.reduce((acc, g) => acc + (g - mean) ** 2, 0) / gaps.length
        : null;

    return {
      typedCharCount: s.typedCharCount,
      pastedCharCount: s.pastedCharCount,
      pasteEventCount: s.pasteEventCount,
      meanKeystrokeGapMs: mean,
      keystrokeGapVarianceMs2: variance,
      editEventCount: s.editEventCount,
    };
  }, []);

  const reset = useCallback(() => {
    stateRef.current = emptyState();
  }, []);

  const handlers: TelemetryHandlers = useMemo(
    () => ({ onKeyDown, onPaste }),
    [onKeyDown, onPaste],
  );

  return { handlers, snapshot, reset };
}

function emptyState(): InternalState {
  return {
    typedCharCount: 0,
    pastedCharCount: 0,
    pasteEventCount: 0,
    editEventCount: 0,
    keystrokeTimes: [],
  };
}

function computeGaps(times: number[]): number[] {
  if (times.length < 2) return [];
  const gaps: number[] = [];
  for (let i = 1; i < times.length; i++) {
    gaps.push(times[i] - times[i - 1]);
  }
  return gaps;
}
