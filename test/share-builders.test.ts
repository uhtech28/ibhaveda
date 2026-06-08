/**
 * URL builders are pure functions — these tests pin down the exact
 * query-parameter encoding for each platform so an upstream encoding
 * regression surfaces immediately.
 */

import { describe, expect, it } from "vitest";
import { buildShareUrl, composeText } from "../src/lib/share/builders";
import type { ShareablePayload } from "../src/lib/share/types";

const payload: ShareablePayload = {
  title: "AI Recipe Generator for Diabetics",
  text:
    "An idea I'm working on — helping people with type 2 diabetes find tasty " +
    "meals that fit their constraints.",
  url: "https://theinteractiveideas.com/idea/abc123",
  hashtags: ["startup", "health"],
};

describe("buildShareUrl — platform routing", () => {
  it("returns null for `copy` (no navigation)", () => {
    expect(buildShareUrl("copy", payload)).toBeNull();
  });

  it("returns null for `native` (uses Web Share API)", () => {
    expect(buildShareUrl("native", payload)).toBeNull();
  });

  it("builds an X intent URL with text + url + hashtags", () => {
    const url = buildShareUrl("twitter", payload)!;
    const parsed = new URL(url);
    expect(parsed.hostname).toBe("twitter.com");
    expect(parsed.pathname).toBe("/intent/tweet");
    expect(parsed.searchParams.get("url")).toBe(payload.url);
    expect(parsed.searchParams.get("hashtags")).toBe("startup,health");
    expect(parsed.searchParams.get("text")?.length ?? 0).toBeGreaterThan(0);
  });

  it("builds a LinkedIn share-offsite URL", () => {
    const url = buildShareUrl("linkedin", payload)!;
    const parsed = new URL(url);
    expect(parsed.hostname).toBe("www.linkedin.com");
    expect(parsed.pathname).toBe("/sharing/share-offsite/");
    expect(parsed.searchParams.get("url")).toBe(payload.url);
  });

  it("builds a WhatsApp wa.me URL with text including the link", () => {
    const url = buildShareUrl("whatsapp", payload)!;
    const parsed = new URL(url);
    expect(parsed.hostname).toBe("wa.me");
    const text = parsed.searchParams.get("text") ?? "";
    expect(text).toContain(payload.url);
    expect(text).toContain("Diabetics");
  });

  it("builds a Facebook sharer URL", () => {
    const url = buildShareUrl("facebook", payload)!;
    const parsed = new URL(url);
    expect(parsed.hostname).toBe("www.facebook.com");
    expect(parsed.pathname).toBe("/sharer/sharer.php");
    expect(parsed.searchParams.get("u")).toBe(payload.url);
  });

  it("builds a mailto: link with subject + body", () => {
    const url = buildShareUrl("email", payload)!;
    expect(url.startsWith("mailto:?")).toBe(true);
    const query = new URLSearchParams(url.replace("mailto:?", ""));
    expect(query.get("subject")).toBe(payload.title);
    expect(query.get("body")).toContain(payload.url ?? "");
  });
});

describe("composeText — character-limit truncation", () => {
  it("returns the full composition when under the limit", () => {
    const out = composeText(payload, "linkedin");
    expect(out).toContain(payload.title);
    expect(out).toContain("type 2 diabetes");
  });

  it("drops the body to fit when over the X composer limit", () => {
    const long: ShareablePayload = {
      title: "Idea title",
      text: "lorem ipsum ".repeat(50), // > 240 chars
      url: "https://example.com",
    };
    const out = composeText(long, "twitter");
    expect(out).not.toContain("lorem ipsum lorem ipsum lorem ipsum");
    expect(out).toContain("Idea title");
  });

  it("falls back to URL-only when even title+url exceeds the limit", () => {
    const tightLimitTest: ShareablePayload = {
      title: "x".repeat(500),
      url: "https://example.com",
    };
    const out = composeText(tightLimitTest, "twitter");
    expect(out).toBe("https://example.com");
  });

  it("encodes the URL inline when includeUrl is true", () => {
    const out = composeText(payload, "whatsapp", { includeUrl: true });
    expect(out).toContain(payload.url ?? "");
  });
});

describe("Encoding correctness", () => {
  it("encodes ampersands and other URL-reserved chars in the body", () => {
    const tricky: ShareablePayload = {
      title: "A & B?",
      text: "use the q=foo&bar parser",
      url: "https://example.com/a?b=1",
    };
    const url = buildShareUrl("twitter", tricky)!;
    // URLSearchParams encodes & as %26, ? as %3F, etc. Make sure the
    // resulting URL is parseable round-trip and the values come back
    // intact.
    const parsed = new URL(url);
    expect(parsed.searchParams.get("url")).toBe(tricky.url);
    expect(parsed.searchParams.get("text")).toContain("A & B");
  });
});
