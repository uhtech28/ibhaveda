"use client";

/**
 * @file useCrossPostPreferences.ts
 * @description Persistent cross-post preferences (a.k.a. "double posting").
 *
 * Stores the user's default share targets in localStorage so the idea
 * composer no longer needs to prompt on every post. The composer shows
 * only a single "Also post to social platforms" checkbox; the per-platform
 * granular selection lives in Settings.
 *
 * Shape (persisted as JSON):
 *   {
 *     enabled: boolean,               // master toggle
 *     platforms: {
 *       twitter: boolean,
 *       linkedin: boolean,
 *       instagram: boolean,
 *       facebook: boolean,
 *     }
 *   }
 *
 * Default on first ever load: enabled=true, all platforms=true.
 * Once the user changes anything, it persists until they change it again.
 */

import { useCallback, useEffect, useState } from "react";
import type { SharePlatform } from "@/lib/share/types";

const STORAGE_KEY = "share.crossPostPreferences";

export interface CrossPostPreferences {
  enabled: boolean;
  platforms: Record<SharePlatform, boolean>;
}

const DEFAULT_PREFERENCES: CrossPostPreferences = {
  enabled: true,
  platforms: {
    twitter: true,
    linkedin: true,
    instagram: true,
    facebook: true,
  },
};

/** Read once from localStorage; safe for SSR (returns defaults on server). */
function readFromStorage(): CrossPostPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<CrossPostPreferences>;
    return {
      enabled: parsed.enabled ?? DEFAULT_PREFERENCES.enabled,
      platforms: {
        ...DEFAULT_PREFERENCES.platforms,
        ...(parsed.platforms ?? {}),
      },
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

function writeToStorage(prefs: CrossPostPreferences): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    // Broadcast so other open tabs / other hook consumers see the change.
    window.dispatchEvent(
      new CustomEvent("cross-post-preferences-changed", { detail: prefs }),
    );
  } catch {
    /* quota / private mode — silently ignore */
  }
}

/**
 * Read + update the cross-post preferences. Re-renders every consumer
 * when any tab updates the value (via CustomEvent broadcast).
 */
export function useCrossPostPreferences() {
  const [prefs, setPrefs] = useState<CrossPostPreferences>(DEFAULT_PREFERENCES);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from storage on first client render.
  useEffect(() => {
    setPrefs(readFromStorage());
    setHydrated(true);
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<CrossPostPreferences>).detail;
      if (detail) setPrefs(detail);
    };
    window.addEventListener("cross-post-preferences-changed", handler);
    return () => {
      window.removeEventListener("cross-post-preferences-changed", handler);
    };
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    setPrefs((prev) => {
      const next = { ...prev, enabled };
      writeToStorage(next);
      return next;
    });
  }, []);

  const setPlatform = useCallback(
    (platform: SharePlatform, on: boolean) => {
      setPrefs((prev) => {
        const next = {
          ...prev,
          platforms: { ...prev.platforms, [platform]: on },
        };
        writeToStorage(next);
        return next;
      });
    },
    [],
  );

  /** Compute the effective target set — only if enabled AND platform is on. */
  const activePlatforms = new Set<SharePlatform>();
  if (prefs.enabled) {
    for (const [key, on] of Object.entries(prefs.platforms) as [
      SharePlatform,
      boolean,
    ][]) {
      if (on) activePlatforms.add(key);
    }
  }

  return {
    prefs,
    hydrated,
    setEnabled,
    setPlatform,
    activePlatforms,
  };
}
