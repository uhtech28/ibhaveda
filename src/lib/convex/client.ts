"use client"

import { ConvexReactClient } from "convex/react"

// Always return a ConvexReactClient so useQuery / useMutation calls
// downstream don't throw "Could not find Convex client!" errors. If
// the real URL is missing OR init throws, fall back to a placeholder
// URL. Queries will fail against that placeholder (no backend), but
// components will render loading/empty states instead of crashing the
// whole React tree.
const FALLBACK_URL = "https://placeholder-demo.convex.cloud";

export const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

function initConvexClient(): ConvexReactClient {
  const raw = convexUrl?.trim().replace(/^["']|["']$/g, "") || "";
  const url = raw || FALLBACK_URL;
  if (!raw) {
    console.warn(
      "[convex/client] NEXT_PUBLIC_CONVEX_URL missing - using placeholder. " +
      "Queries will fail but the app will render.",
    );
  }
  try {
    return new ConvexReactClient(url);
  } catch (err) {
    console.error(
      "[convex/client] init failed even with fallback - falling back to placeholder retry:",
      err,
    );
    // Last-resort: guaranteed-valid URL
    return new ConvexReactClient(FALLBACK_URL);
  }
}

const convex = initConvexClient();

export default convex;
