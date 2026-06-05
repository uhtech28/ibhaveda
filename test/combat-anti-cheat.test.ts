/**
 * Anti-cheat signal tests. We exercise the deterministic, pure
 * signal functions (paste, keystroke variance, burstiness,
 * vocabulary, style delta). The model-based perplexity signal is
 * covered separately via its degradation behaviour — exercising
 * it here would require mocking the AI client.
 */

import { describe, expect, it } from "vitest";
import {
  burstinessSignal,
  keystrokeVarianceSignal,
  pasteRatioSignal,
  styleDeltaSignal,
  vocabularyFingerprintSignal,
} from "../convex/combatAntiCheat";
import type { KeystrokeTelemetry } from "../convex/combatTypes";

function tel(partial: Partial<KeystrokeTelemetry>): KeystrokeTelemetry {
  return {
    typedCharCount: 0,
    pastedCharCount: 0,
    pasteEventCount: 0,
    meanKeystrokeGapMs: null,
    keystrokeGapVarianceMs2: null,
    editEventCount: 0,
    ...partial,
  };
}

describe("pasteRatioSignal", () => {
  it("returns 0 when nothing was typed or pasted", () => {
    expect(pasteRatioSignal(tel({}))).toBe(0);
  });

  it("returns 0 for trivial inline paste (< 5%)", () => {
    expect(pasteRatioSignal(tel({ typedCharCount: 200, pastedCharCount: 5 })))
      .toBe(0);
  });

  it("returns 1 when 60%+ of chars came from paste", () => {
    expect(pasteRatioSignal(tel({ typedCharCount: 40, pastedCharCount: 60 })))
      .toBe(1);
    expect(pasteRatioSignal(tel({ typedCharCount: 0, pastedCharCount: 500 })))
      .toBe(1);
  });

  it("interpolates linearly between 5% and 60%", () => {
    // 30% paste -> (0.30 - 0.05) / (0.60 - 0.05) ≈ 0.4545
    const v = pasteRatioSignal(
      tel({ typedCharCount: 70, pastedCharCount: 30 }),
    );
    expect(v).toBeGreaterThan(0.4);
    expect(v).toBeLessThan(0.5);
  });
});

describe("keystrokeVarianceSignal", () => {
  it("returns 0 when no keystrokes were captured", () => {
    expect(keystrokeVarianceSignal(tel({}))).toBe(0);
  });

  it("returns 0 for healthy human-like variance (CV >= 0.7)", () => {
    // mean=100ms, stddev=80ms -> CV=0.8
    expect(
      keystrokeVarianceSignal(
        tel({
          typedCharCount: 100,
          meanKeystrokeGapMs: 100,
          keystrokeGapVarianceMs2: 80 * 80,
        }),
      ),
    ).toBe(0);
  });

  it("returns 1 for near-zero variance (CV <= 0.2)", () => {
    // mean=100ms, stddev=10ms -> CV=0.1
    expect(
      keystrokeVarianceSignal(
        tel({
          typedCharCount: 100,
          meanKeystrokeGapMs: 100,
          keystrokeGapVarianceMs2: 10 * 10,
        }),
      ),
    ).toBe(1);
  });
});

describe("burstinessSignal", () => {
  it("returns 0 for very short text", () => {
    expect(burstinessSignal("Hi.")).toBe(0);
  });

  it("returns higher signal for uniformly long, polished sentences", () => {
    const aiLike =
      "The platform provides comprehensive solutions for modern users. " +
      "Each feature has been carefully designed to enhance experience. " +
      "The team continues to iterate based on user feedback regularly. " +
      "Future updates will further refine these core capabilities.";
    expect(burstinessSignal(aiLike)).toBeGreaterThan(0.3);
  });

  it("returns lower signal for human-like bursty writing", () => {
    const human =
      "Yeah. The thing is, we keep hitting the same wall: nobody actually " +
      "buys the cheap tier. So we tried raising prices last week — landed " +
      "two big customers, lost a few small ones. Net was up. Surprising! " +
      "Need more data though.";
    expect(burstinessSignal(human)).toBeLessThan(0.5);
  });
});

describe("vocabularyFingerprintSignal", () => {
  it("returns 0 for text with no flag phrases", () => {
    expect(vocabularyFingerprintSignal("we shipped the thing yesterday"))
      .toBe(0);
  });

  it("returns higher signal as more flag phrases appear", () => {
    const oneHit = "Furthermore, we should ship faster.";
    const twoHits = "Furthermore, it is important to note we ship faster.";
    const fourHits =
      "Furthermore, it is important to note we delve into the " +
      "comprehensive understanding of our paradigm shift. Moreover.";
    expect(vocabularyFingerprintSignal(oneHit)).toBeGreaterThan(0);
    expect(vocabularyFingerprintSignal(twoHits)).toBeGreaterThan(
      vocabularyFingerprintSignal(oneHit),
    );
    expect(vocabularyFingerprintSignal(fourHits)).toBe(1);
  });

  it("is case-insensitive", () => {
    expect(vocabularyFingerprintSignal("FURTHERMORE")).toBeGreaterThan(0);
  });
});

describe("styleDeltaSignal", () => {
  it("returns 0 when there are no prior writings to compare to", () => {
    expect(styleDeltaSignal("some answer text here", [])).toBe(0);
  });

  it("returns 0 for very short candidate text", () => {
    expect(styleDeltaSignal("ok.", ["plenty of prior text here for context"]))
      .toBe(0);
  });

  it("returns higher signal for drastic style change", () => {
    const prior = [
      "yo i tried the thing tho it didnt work right",
      "lol fixed it now, ships tonight",
      "no clue why convex barfed earlier — figured it out",
    ];
    const verySimilar = "tested the new flow, kinda jank but it works";
    const veryDifferent =
      "Furthermore, the architectural decisions we have made " +
      "demonstrate a comprehensive understanding of the platform's " +
      "underlying paradigms and engineering principles.";

    const similarScore = styleDeltaSignal(verySimilar, prior);
    const differentScore = styleDeltaSignal(veryDifferent, prior);
    expect(differentScore).toBeGreaterThan(similarScore);
  });
});
