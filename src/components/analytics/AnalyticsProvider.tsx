"use client";
import { useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { initPostHog } from "@/lib/analytics/posthog";
import { useAnalytics } from "@/lib/analytics/useAnalytics";

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const convexUser = useQuery(api.users.getCurrentUser);

  useEffect(() => {
    initPostHog();
  }, []);

  useAnalytics(convexUser?._id);

  return <>{children}</>;
}
