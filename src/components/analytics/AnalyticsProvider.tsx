"use client";
import { useEffect } from "react";
import { useQuery } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { api } from "@convex/_generated/api";
import { initPostHog } from "@/lib/analytics/posthog";
import { useAnalytics } from "@/lib/analytics/useAnalytics";

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  // PERF: this provider is mounted in the root layout, so it fires on the
  // marketing landing page too. Previously we unconditionally called
  // `useQuery(api.users.getCurrentUser)` even for unauthenticated visitors,
  // which triggers a Convex round-trip that always returns null. Skip the
  // query until Clerk confirms the user is signed in.
  const { isSignedIn, isLoaded } = useAuth();
  const convexUser = useQuery(
    api.users.getCurrentUser,
    isLoaded && isSignedIn ? {} : "skip",
  );

  useEffect(() => {
    // Defer PostHog init to the next idle callback so it never blocks
    // the initial paint / hydration on the landing page.
    const idle = (cb: () => void) =>
      typeof window !== "undefined" && "requestIdleCallback" in window
        ? (window as Window & { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback(cb)
        : window.setTimeout(cb, 1);
    idle(() => initPostHog());
  }, []);

  useAnalytics(convexUser?._id);

  return <>{children}</>;
}
