"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { IntroScreen } from "@/components/map/IntroScreen";
import { WelcomeOverlay } from "@/components/map/WelcomeOverlay";
import { MapIntroOverlay } from "@/components/map/MapIntroOverlay";
import { motion, AnimatePresence } from "framer-motion";

type TutorialStep = "gender" | "welcome" | "map-intro" | "complete";

export default function MapIntroPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [tutorialStep, setTutorialStep] = useState<TutorialStep | null>(null);

  // Fetch user's saved gender from database
  const savedGender = useQuery(api.users.getPersonaGender);
  const updateGender = useMutation(api.users.updatePersonaGender);

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
  }, []);

  useEffect(() => {
    if (!mounted || savedGender === undefined) return;

    // If gender already saved in database, skip to stages
    if (savedGender === "male" || savedGender === "female") {
      // Sync to localStorage for backward compatibility
      if (typeof window !== "undefined") {
        localStorage.setItem("selectedGender", savedGender);
      }
      
      // Check if tutorial has been completed before
      const tutorialCompleted =
        typeof window !== "undefined"
          ? localStorage.getItem("tutorial_completed") === "true"
          : false;

      if (tutorialCompleted) {
        // Skip directly to stages for returning users
        router.push("/map/stages");
      } else {
        // Show tutorial for first-time users
        setTutorialStep("welcome");
      }
    } else {
      // No gender saved, show selection screen
      setTutorialStep("gender");
    }
  }, [mounted, savedGender, router]);

  const handleStart = async (gender: "male" | "female") => {
    // Save to database (one-time)
    await updateGender({ gender });
    
    // Also save to localStorage for backward compatibility
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

  if (!mounted || tutorialStep === null) {
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
