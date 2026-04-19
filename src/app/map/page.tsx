/**
 * World Map Page
 *
 * React page component that mounts the Phaser canvas and manages
 * two-way communication between React/Convex state and Phaser game state.
 *
 * Features:
 * - Phaser game lifecycle management with proper cleanup
 * - Convex data synchronization to Phaser
 * - Event bridge for bidirectional communication
 * - FPS monitoring and debug HUD
 * - Touch-friendly canvas configuration
 *
 * @module app/map/page
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { IntroScreen } from "@/components/map/IntroScreen";
import { MapHUD } from "@/components/map/MapHUD";
import type { CheckpointState } from "@/lib/phaser/utils/event-bridge";

/**
 * Maps numeric boss IDs (1-12) to string slugs for Phaser
 */
function mapBossIdToSlug(bossId: number): string {
  const mapping: Record<number, string> = {
    1: "unraveller",
    2: "pale_architect",
    3: "hollow_king",
    4: "thornwarden",
    5: "mirror_witch",
    6: "ashen_drake",
    7: "tide_caller",
    8: "gravemind",
    9: "rusted_oracle",
    10: "wraith_council",
    11: "stonecaller",
    12: "veilwalker",
  };
  return mapping[bossId] || "unknown";
}

/**
 * Maps Convex checkpoint status to Phaser-compatible status
 */
function mapCheckpointStatus(
  convexStatus: "not_started" | "in_progress" | "completed" | "skipped",
  t1: boolean,
  t2: boolean,
  t3: boolean,
): CheckpointState["status"] {
  // All tasks completed = gold
  if (t1 && t2 && t3) return "gold";

  // Check Convex status
  if (convexStatus === "completed") return "completed";
  if (convexStatus === "in_progress") return "in_progress";
  if (convexStatus === "skipped") return "locked";
  if (convexStatus === "not_started") return "locked";

  return "locked";
}

/**
 * World Map Page Component
 *
 * Displays the interactive world map using Phaser game engine.
 * Syncs venture progress data from Convex to the Phaser scene.
 *
 * @returns The world map page with embedded Phaser canvas
 */
export default function MapPage() {
  /** Reference to the Phaser game instance */
  const gameRef = useRef<any | null>(null);

  /** Reference to the DOM container for the Phaser canvas */
  const containerRef = useRef<HTMLDivElement>(null);

  /** Whether Phaser scene is ready to receive events */
  const [phaserReady, setPhaserReady] = useState(false);

  /** Current frames per second for performance monitoring */
  const [fps, setFps] = useState(60);

  /** Router for navigation */
  const router = useRouter();

  /** Show intro screen for character selection */
  const [showIntro, setShowIntro] = useState(true);

  /** Selected persona gender */
  const [selectedGender, setSelectedGender] = useState<"male" | "female">("male");

  // Get user's ventures from Convex
  const ventures = useQuery(api.worldMap.getVenturesByUser);
  const activeVenture = ventures?.[0]; // First venture for demo

  // Get world map data for active venture
  const worldMapData = useQuery(
    api.worldMap.getWorldMapData,
    activeVenture ? { ventureId: activeVenture._id } : "skip",
  );

  /** Handle character selection and start journey */
  const handleStartJourney = (gender: "male" | "female") => {
    setSelectedGender(gender);
    setShowIntro(false);
  };

  /**
   * Mount and unmount Phaser game
   *
   * Effect runs once on component mount to:
   * 1. Create Phaser game instance
   * 2. Listen for ready and FPS events
   * 3. Clean up on unmount
   */
  useEffect(() => {
    if (!containerRef.current || gameRef.current || showIntro) return;

    // Dynamically import Phaser and game config only on client side
    let game: any = null;
    let eventBridge: any = null;

    const initPhaser = async () => {
      const Phaser = await import("phaser");
      const { createGameConfig } = await import("@/lib/phaser/game-config");
      const { eventBridge: bridge } = await import("@/lib/phaser/utils/event-bridge");

      eventBridge = bridge;

      // Create Phaser game
      game = new Phaser.Game(createGameConfig(containerRef.current!));
      gameRef.current = game;

      // Listen for Phaser ready signal
      const handleReady = () => setPhaserReady(true);
      const handleFPS = (event: { fps: number }) => setFps(event.fps);

      eventBridge.onReact("PHASER_READY", handleReady);
      eventBridge.onReact("FPS_UPDATE", handleFPS);

      // Store cleanup handlers
      return () => {
        eventBridge.off("PHASER_READY", handleReady);
        eventBridge.off("FPS_UPDATE", handleFPS);
        if (game) {
          game.destroy(true);
        }
      };
    };

    let cleanup: (() => void) | undefined;

    initPhaser().then((cleanupFn) => {
      cleanup = cleanupFn;
    });

    // Cleanup on unmount
    return () => {
      if (cleanup) cleanup();
      gameRef.current = null;
      setPhaserReady(false);
    };
  }, [showIntro]);

  /**
   * Send venture data to Phaser when ready
   *
   * Effect synchronizes Convex data to Phaser:
   * 1. Sets active venture and persona
   * 2. Updates checkpoint states
   * 3. Applies brightness adjustments
   */
  useEffect(() => {
    if (!phaserReady || !worldMapData) return;

    const syncData = async () => {
      const { eventBridge } = await import("@/lib/phaser/utils/event-bridge");

      const { venture, checkpoints, brightness } = worldMapData;

      // Send active venture to Phaser
      eventBridge.dispatchToPhaser({
        type: "SET_ACTIVE_VENTURE",
        ventureId: venture._id,
        personaGender: selectedGender, // Use selected gender from intro
        assignedBosses: venture.assignedBosses.map(mapBossIdToSlug),
        currentStage: venture.currentStage,
      });

      // Send checkpoint states to Phaser
      const checkpointStates: CheckpointState[] = checkpoints.map((cp) => ({
        id: cp._id,
        stage: cp.stage,
        checkpoint: cp.checkpoint,
        status: mapCheckpointStatus(
          cp.status,
          cp.t1Completed,
          cp.t2Completed,
          cp.t3Completed,
        ),
        t1: cp.t1Completed,
        t2: cp.t2Completed,
        t3: cp.t3Completed,
      }));

      eventBridge.dispatchToPhaser({
        type: "UPDATE_CHECKPOINTS",
        checkpoints: checkpointStates,
      });

      // Send brightness level to Phaser
      eventBridge.dispatchToPhaser({
        type: "UPDATE_BRIGHTNESS",
        brightness: brightness.worldBrightness,
      });
    };

    syncData();
  }, [phaserReady, worldMapData, selectedGender]);

  /**
   * Listen for checkpoint clicks from Phaser
   *
   * Effect handles user interactions in Phaser:
   * - Checkpoint clicks for navigation
   * - Future: Boss interactions, persona clicks, etc.
   */
  useEffect(() => {
    if (!phaserReady) return;

    const setupListeners = async () => {
      const { eventBridge } = await import("@/lib/phaser/utils/event-bridge");

      const handleCheckpointClick = (event: {
        checkpointId: string;
        stage: number;
        checkpoint: number;
      }) => {
        console.log("Checkpoint clicked:", event);
        // TODO: Navigate to checkpoint detail page
        // router.push(`/checkpoint/${event.checkpointId}`)
      };

      eventBridge.onReact("CHECKPOINT_CLICKED", handleCheckpointClick);

      return () => {
        eventBridge.off("CHECKPOINT_CLICKED", handleCheckpointClick);
      };
    };

    let cleanup: (() => void) | undefined;
    setupListeners().then((cleanupFn) => {
      cleanup = cleanupFn;
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, [phaserReady]);

  return (
    <>
      {/* Intro Screen - Show before map */}
      {showIntro && activeVenture && (
        <IntroScreen
          ventureName={activeVenture.ideaId || "Your Venture"}
          onStart={handleStartJourney}
        />
      )}

      {/* Main Map View */}
      {!showIntro && (
        <div className="relative w-full h-screen bg-[#0A0D12]">
          {/* Phaser canvas container */}
          <div
            ref={containerRef}
            className="w-full h-full"
            style={{ touchAction: "none" }} // Prevent mobile scroll interference
          />

          {/* MapHUD - Shows all progress and stats */}
          {phaserReady && worldMapData && (
            <MapHUD
              currentStage={worldMapData.venture.currentStage}
              stageName={getStageNameFromNumber(worldMapData.venture.currentStage)}
              biomeName={getBiomeNameFromStage(worldMapData.venture.currentStage)}
              checkpointsCompleted={worldMapData.checkpoints.filter(cp => 
                cp.status === "completed" || (cp.t1Completed && cp.t2Completed && cp.t3Completed)
              ).length}
              checkpointsTotal={worldMapData.checkpoints.length}
              goldCheckpoints={worldMapData.checkpoints.filter(cp => 
                cp.t1Completed && cp.t2Completed && cp.t3Completed
              ).length}
              level={activeVenture?.level || 1}
              xp={activeVenture?.xp || 0}
              xpToNext={activeVenture?.xpToNextLevel || 100}
              personaGender={selectedGender}
              brightness={worldMapData.brightness.worldBrightness}
              fps={fps}
            />
          )}

          {/* Loading overlay while Phaser initializes */}
          {!phaserReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0A0D12]/80 backdrop-blur-sm">
              <div className="text-center">
                <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#6366F1] mx-auto mb-4" />
                <div className="text-white text-lg">Loading world map...</div>
              </div>
            </div>
          )}

          {/* Error state if no venture found */}
          {phaserReady && !activeVenture && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0A0D12]/80 backdrop-blur-sm">
              <div className="text-white text-center bg-[#111827] p-8 rounded-lg border border-white/10">
                <p className="text-xl mb-2">No active venture</p>
                <p className="text-sm text-gray-400 mb-6">
                  Create a venture to see your world map
                </p>
                <Button
                  onClick={() => router.push('/venture/create')}
                  className="bg-[#6366F1] hover:bg-[#5558E3]"
                >
                  Create Venture
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

/**
 * Get stage name from stage number
 */
function getStageNameFromNumber(stage: number): string {
  const names = [
    "Ideation",
    "Research",
    "Validation",
    "Design",
    "Development",
    "Launch",
    "Iteration",
    "Scale",
  ];
  return names[stage - 1] || `Stage ${stage}`;
}

/**
 * Get biome name from stage number
 */
function getBiomeNameFromStage(stage: number): string {
  const biomes = [
    "The Village",
    "The Forest",
    "The Arena",
    "Artisan's Quarter",
    "The Mine",
    "The Harbour",
    "The Crossroads",
    "The Capital",
  ];
  return biomes[stage - 1] || "Unknown Biome";
}
