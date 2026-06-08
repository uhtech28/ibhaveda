/**
 * No-repeat policy unit tests.
 *
 * The dedup index on combatQuestions.by_user_normalized enforces that
 * a user never sees the same question twice. The normalized form is
 * computed by `normalizePrompt` — these tests lock in its behaviour so
 * dedup stays consistent across deployments.
 */

import { describe, expect, it } from "vitest";
import { normalizePrompt } from "../convex/combat";

describe("normalizePrompt — canonical form for dedup", () => {
  it("strips trailing punctuation", () => {
    expect(normalizePrompt("Why did you choose this market?")).toBe(
      "why did you choose this market",
    );
  });

  it("collapses inner whitespace", () => {
    expect(normalizePrompt("Why   did    you  choose    this market?")).toBe(
      "why did you choose this market",
    );
  });

  it("treats different capitalisation as the same prompt", () => {
    const a = normalizePrompt("Why did you choose this market?");
    const b = normalizePrompt("WHY DID YOU CHOOSE THIS MARKET?");
    const c = normalizePrompt("why did you choose this market?");
    expect(a).toBe(b);
    expect(b).toBe(c);
  });

  it("treats punctuation variants as the same prompt", () => {
    const a = normalizePrompt("Why did you choose this market?");
    const b = normalizePrompt("Why did you choose this market.");
    const c = normalizePrompt("Why did you choose this market!!!");
    expect(a).toBe(b);
    expect(b).toBe(c);
  });

  it("treats leading/trailing whitespace as the same prompt", () => {
    const a = normalizePrompt("  Why did you choose this market?  ");
    const b = normalizePrompt("Why did you choose this market");
    expect(a).toBe(b);
  });

  it("does NOT collapse substantively different prompts", () => {
    const a = normalizePrompt("Why did you choose this market?");
    const b = normalizePrompt("How did you choose this market?");
    expect(a).not.toBe(b);
  });

  it("does NOT collapse prompts with different word order", () => {
    const a = normalizePrompt("Who is your target user?");
    const b = normalizePrompt("Your target user is who?");
    expect(a).not.toBe(b);
  });

  it("preserves numbers and meaningful tokens", () => {
    expect(normalizePrompt("Why do you target the 18-24 demographic?")).toBe(
      "why do you target the 1824 demographic",
    );
  });

  it("handles empty and whitespace-only input gracefully", () => {
    expect(normalizePrompt("")).toBe("");
    expect(normalizePrompt("   ")).toBe("");
    expect(normalizePrompt("???")).toBe("");
  });
});
