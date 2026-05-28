"use client";

import { useCallback, useEffect, useState } from "react";
import LandingIntroSandbox from "@/components/landing-intro-sandbox";

const INTRO_FLAG = "ii.introSeen.v3";

export default function LandingIntro() {
  const [active, setActive] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      setActive(!window.localStorage.getItem(INTRO_FLAG));
    } catch {
      setActive(true);
    }
  }, []);

  const finish = useCallback(() => {
    try {
      window.localStorage.setItem(INTRO_FLAG, "1");
    } catch {
      // Ignore storage failures; the intro can still close for this session.
    }
    setActive(false);
  }, []);

  if (active !== true) return null;

  return <LandingIntroSandbox ariaLabel="Ibhaveda intro" onComplete={finish} />;
}
