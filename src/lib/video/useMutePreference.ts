"use client";

/**
 * Per-device persisted mute preference for the video feed.
 *
 * Browser autoplay policies require muted video for autoplay to work
 * at all. Once the user has interacted (clicked the unmute button),
 * we remember their preference for the rest of the session and
 * subsequent visits — they don't have to click unmute on every video.
 */

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "videoFeedMuted";

export function useMutePreference(): [boolean, (next: boolean) => void] {
  const [muted, setMuted] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw === "false") setMuted(false);
    } catch {
      // localStorage can throw in private-mode contexts — ignore.
    }
  }, []);

  const update = useCallback((next: boolean) => {
    setMuted(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      // ignore — non-persistent fallback is fine
    }
  }, []);

  return [muted, update];
}
