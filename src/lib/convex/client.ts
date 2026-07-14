"use client"

import { ConvexReactClient } from "convex/react"

// Try-catch guarded Convex client. If URL is missing OR ConvexReactClient
// throws during init (e.g. hidden char in env var, unsupported URL format,
// version mismatch), we fall back to null and the provider skips itself.
// Prevents "Invalid deployment address" from crashing the whole React tree
// during hydration.
export const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

function initConvexClient(): ConvexReactClient | null {
  if (!convexUrl) {
    console.warn(
      "[convex/client] NEXT_PUBLIC_CONVEX_URL missing - Convex disabled.",
    );
    return null;
  }
  try {
    // Strip any whitespace / stray quotes that might have snuck in from
    // env var copy-paste in dashboards.
    const cleaned = convexUrl.trim().replace(/^["']|["']$/g, "");
    return new ConvexReactClient(cleaned);
  } catch (err) {
    console.error(
      "[convex/client] Failed to init ConvexReactClient - disabling. Error:",
      err,
    );
    return null;
  }
}

const convex = initConvexClient();

export default convex;
