"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { IntroScreen } from "@/components/map/IntroScreen";
import { WelcomeOverlay } from "@/components/map/WelcomeOverlay";
import { MapIntroOverlay } from "@/components/map/MapIntroOverlay";
import { motion, AnimatePresence } from "framer-motion";

type TutorialStep = "gender" | "welcome" | "map-intro" | "complete";

export default function MapIntroPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [tutorialStep, setTutorialStep] = useState<TutorialStep>("gender");

  // Fetch venture name for the intro screen from Convex (real-time)
  const ventures = useQuery(api.worldMap.getVenturesByUser);
  const activeVenture = ventures?.[0] ?? null;

  const ideaQuery = useQuery(
    api.worldMap.getWorldMapData,
    activeVenture ? { ventureId: activeVenture._id } : "skip",
  );

  const ventureName = ideaQuery?.ideaTitle ?? "Your Venture";

  useEffect(() => {
    setMounted(true);
    // If gender already chosen (returning user), skip straight to stages
    if (typeof window !== "undefined") {
      const existingGender = localStorage.getItem("selectedGender");
      if (existingGender === "male" || existingGender === "female") {
        // Don't auto-skip — let user always choose character on /map
      }
    }
  }, []);

  const handleStart = (gender: "male" | "female") => {
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedGender", gender);
    }

    // Check if tutorial has been completed before
    const tutorialCompleted =
      typeof window !== "undefined"
        ? localStorage.getItem("tutorial_completed") === "true"
        : false;

    if (tutorialCompleted) {
      // Skip tutorial for returning users
      router.push("/map/stages");
    } else {
      // Show tutorial for new users
      setTutorialStep("welcome");
    }
  };

  const handleWelcomeComplete = () => {
    setTutorialStep("map-intro");
  };

  const handleMapIntroComplete = () => {
    setTutorialStep("complete");
    router.push("/map/stages");
  };

  if (!mounted) {
    return (
      <div className="fixed inset-0 bg-[#050810] flex items-center justify-center">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-xs tracking-[0.3em] uppercase font-black text-indigo-400"
        >
          Loading…
        </motion.div>
      </div>
    );
  }

  return (
    <>
      {tutorialStep === "gender" && (
        <IntroScreen ventureName={ventureName} onStart={handleStart} />
      )}

      <AnimatePresence>
        {tutorialStep === "welcome" && (
          <WelcomeOverlay
            ventureName={ventureName}
            onComplete={handleWelcomeComplete}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {tutorialStep === "map-intro" && (
          <MapIntroOverlay onComplete={handleMapIntroComplete} />
        )}
      </AnimatePresence>
    </>
  );
}
