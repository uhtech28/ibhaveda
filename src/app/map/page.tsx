"use client";

import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { IntroScreen } from "@/components/map/IntroScreen";
import { WelcomeOverlay } from "@/components/map/WelcomeOverlay";
import { MapIntroOverlay } from "@/components/map/MapIntroOverlay";
import { motion, AnimatePresence } from "framer-motion";

type TutorialStep = "gender" | "welcome" | "map-intro" | "complete";

// ── Inner component that reads searchParams (requires Suspense in Next.js App Router) ─
function MapIntroInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [tutorialStep, setTutorialStep] = useState<TutorialStep | null>(null);

  // Read ideaId from URL query param (e.g. /map?ideaId=abc123)
  const ideaIdParam = searchParams.get("ideaId") as Id<"ideas"> | null;

  // Fetch user's saved gender from database
  const savedGender = useQuery(api.users.getPersonaGender);
  const updateGender = useMutation(api.users.updatePersonaGender);

  // ── Venture resolution ──────────────────────────────────────────────────────
  // If we have an ideaId, look up the specific venture for that idea.
  // Otherwise, fall back to the user's first venture (backward compat).
  const ventureByIdea = useQuery(
    api.worldMap.getVentureByIdea,
    ideaIdParam ? { ideaId: ideaIdParam } : "skip",
  );

  const allVentures = useQuery(api.worldMap.getVenturesByUser);

  // Resolve which venture to open:
  // - If ideaId is in URL → use the venture for that idea (wait for query)
  // - Otherwise          → use the first venture
  const activeVenture = ideaIdParam
    ? (ventureByIdea ?? null)
    : (allVentures?.[0] ?? null);

  // Fetch venture name for the intro screen
  const ideaQuery = useQuery(
    api.worldMap.getWorldMapData,
    activeVenture ? { ventureId: activeVenture._id } : "skip",
  );

  const ventureName = ideaQuery?.ideaTitle ?? "Your Venture";

  // Helper: build the destination URL, always including ventureId
  const buildWorldMapUrl = (vId: string) => `/map/world?ventureId=${vId}`;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || savedGender === undefined) return;

    // Wait for venture-by-idea lookup to resolve before redirecting
    if (ideaIdParam && ventureByIdea === undefined) return;

    if (savedGender === "male" || savedGender === "female") {
      // Sync to localStorage for backward compatibility
      if (typeof window !== "undefined") {
        localStorage.setItem("selectedGender", savedGender);
      }

      const tutorialCompleted =
        typeof window !== "undefined"
          ? localStorage.getItem("tutorial_completed") === "true"
          : false;

      if (tutorialCompleted) {
        const destination = activeVenture
          ? buildWorldMapUrl(activeVenture._id)
          : "/map/world";
        router.push(destination);
      } else {
        setTutorialStep("welcome");
      }
    } else {
      setTutorialStep("gender");
    }
  }, [mounted, savedGender, router, ideaIdParam, ventureByIdea, activeVenture]);

  const handleStart = async (gender: "male" | "female") => {
    await updateGender({ gender });
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedGender", gender);
    }

    const tutorialCompleted =
      typeof window !== "undefined"
        ? localStorage.getItem("tutorial_completed") === "true"
        : false;

    if (tutorialCompleted) {
      const destination = activeVenture
        ? buildWorldMapUrl(activeVenture._id)
        : "/map/world";
      router.push(destination);
    } else {
      setTutorialStep("welcome");
    }
  };

  const handleWelcomeComplete = () => setTutorialStep("map-intro");

  const handleMapIntroComplete = () => {
    setTutorialStep("complete");
    const destination = activeVenture
      ? buildWorldMapUrl(activeVenture._id)
      : "/map/world";
    router.push(destination);
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

// ── Outer page wraps in Suspense (required by Next.js App Router for useSearchParams) ─
export default function MapIntroPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 bg-[#050810] flex items-center justify-center">
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-xs tracking-[0.3em] uppercase font-black text-indigo-400"
          >
            Loading…
          </motion.div>
        </div>
      }
    >
      <MapIntroInner />
    </Suspense>
  );
}
