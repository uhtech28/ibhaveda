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
  const [isCreatingVenture, setIsCreatingVenture] = useState(false);
  const [createdVentureId, setCreatedVentureId] = useState<string | null>(null);

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

  // Fetch idea details if we need to auto-create a venture for it
  const idea = useQuery(
    api.ideas.getIdeaById,
    ideaIdParam ? { ideaId: ideaIdParam } : "skip",
  );

  // Mutation to create a venture if one doesn't exist
  const createVenture = useMutation(api.ventures.createVenture);

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

    // Wait for queries to resolve if ideaIdParam is present
    if (ideaIdParam) {
      if (ventureByIdea === undefined) return;
      if (idea === undefined) return;
    }

    // Auto-create venture if missing
    if (ideaIdParam && idea && ventureByIdea === null && !isCreatingVenture && !createdVentureId) {
      setIsCreatingVenture(true);
      
      let skills: string[] = [];
      try {
        if (idea.category) {
          const parsed = JSON.parse(idea.category);
          if (Array.isArray(parsed)) {
            skills = parsed;
          } else {
            skills = [idea.category];
          }
        }
      } catch {
        if (idea.category) {
          skills = [idea.category];
        }
      }

      let industries: string[] = [];
      try {
        if (idea.industries) {
          const parsed = JSON.parse(idea.industries);
          if (Array.isArray(parsed)) {
            industries = parsed;
          } else {
            industries = [idea.industries];
          }
        }
      } catch {
        if (idea.industries) {
          industries = [idea.industries];
        }
      }

      createVenture({
        ideaId: ideaIdParam,
        skills,
        industries,
      })
        .then((vId) => {
          setCreatedVentureId(vId);
          setIsCreatingVenture(false);
        })
        .catch((err) => {
          console.error("Auto-creating venture failed:", err);
          setIsCreatingVenture(false);
        });
      return;
    }

    // Wait for the creation to finish if it's currently running
    if (ideaIdParam && idea && ventureByIdea === null && (isCreatingVenture || !createdVentureId)) {
      return;
    }

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
        const vId = createdVentureId || (activeVenture?._id as string | null);
        const destination = vId ? buildWorldMapUrl(vId) : "/map/world";
        router.push(destination);
      } else {
        setTutorialStep("welcome");
      }
    } else {
      setTutorialStep("gender");
    }
  }, [
    mounted,
    savedGender,
    router,
    ideaIdParam,
    ventureByIdea,
    activeVenture,
    idea,
    isCreatingVenture,
    createdVentureId,
    createVenture,
  ]);

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
      const vId = createdVentureId || (activeVenture?._id as string | null);
      const destination = vId ? buildWorldMapUrl(vId) : "/map/world";
      router.push(destination);
    } else {
      setTutorialStep("welcome");
    }
  };

  const handleWelcomeComplete = () => setTutorialStep("map-intro");

  const handleMapIntroComplete = () => {
    setTutorialStep("complete");
    const vId = createdVentureId || (activeVenture?._id as string | null);
    const destination = vId ? buildWorldMapUrl(vId) : "/map/world";
    router.push(destination);
  };

  if (!mounted || tutorialStep === null || isCreatingVenture) {
    return (
      <div className="fixed inset-0 bg-[#050810] flex flex-col items-center justify-center gap-4">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-xs tracking-[0.3em] uppercase font-black text-indigo-400"
        >
          {isCreatingVenture ? "Creating Venture Map…" : "Loading…"}
        </motion.div>
        {isCreatingVenture && (
          <div
            className="h-[3px] w-40 rounded-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            <motion.div
              className="h-full"
              style={{ background: "linear-gradient(90deg, #4f46e5, #818cf8)" }}
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        )}
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
