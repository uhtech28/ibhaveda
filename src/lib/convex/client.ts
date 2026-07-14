"use client"

import { ConvexReactClient } from "convex/react"

// Hardcoded real Convex URL as fallback. Even if the env var isn't
// baked into the bundle (build ran before env was set / cached build /
// etc.), the client still connects to the actual working backend.
// This makes the app FUNCTIONAL regardless of Vercel env var timing.
//
// If you change your Convex deployment, update BOTH this fallback AND
// the NEXT_PUBLIC_CONVEX_URL env var in Vercel.
const HARDCODED_FALLBACK = "https://grateful-canary-901.convex.cloud";

export const convexUrl =
  process.env.NEXT_PUBLIC_CONVEX_URL || HARDCODED_FALLBACK;

function initConvexClient(): ConvexReactClient {
  const raw = convexUrl.trim().replace(/^["']|["']$/g, "");
  // Basic validation: must be a valid Convex URL format
  const url = /^https?:\/\/[a-z]+-[a-z]+-\d+\.convex\.cloud/.test(raw)
    ? raw
    : HARDCODED_FALLBACK;
  try {
    return new ConvexReactClient(url);
  } catch (err) {
    console.error(
      "[convex/client] init failed - falling back to hardcoded URL:",
      err,
    );
    return new ConvexReactClient(HARDCODED_FALLBACK);
  }
}

const convex = initConvexClient();

export default convex;
