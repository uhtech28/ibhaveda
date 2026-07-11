"use client"

import { ConvexReactClient } from "convex/react"

// Convex client is nullable at module level. When NEXT_PUBLIC_CONVEX_URL
// is missing (e.g. Vercel Preview without full env) we skip creating
// the client entirely -- the previous `localhost:3000` placeholder
// caused ConvexProviderWithClerk to throw during hydration because
// the URL was unreachable.
export const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  console.warn(
    "[convex/client] NEXT_PUBLIC_CONVEX_URL is not defined. Convex will be disabled for this session.",
  );
}

const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

export default convex
