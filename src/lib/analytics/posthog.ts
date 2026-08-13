import posthog from "posthog-js";

export const initPostHog = () => {
  if (typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  const posthogWithLoaded = posthog as typeof posthog & { __loaded?: boolean };
  if (posthogWithLoaded.__loaded) return;
  posthog.init(key, {
    api_host: "https://eu.i.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: false,
    capture_pageleave: false,
    autocapture: false,
    persistence: "localStorage+cookie",
    session_recording: {
      maskAllInputs: true,
      maskInputOptions: { password: true, email: true },
    },
  });
};

export { posthog };
