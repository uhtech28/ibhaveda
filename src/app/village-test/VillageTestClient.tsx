"use client";

/**
 * VillageTestClient — quest-progression village demo.
 *
 * Sparky is locked to the current checkpoint. Map is drag-pan scrollable.
 * Click the active gold checkpoint → task modal appears with Complete button.
 * Click Complete → Sparky auto-walks from CP N to CP N+1.
 */

import { useEffect, useRef, useState, type ReactElement } from "react";

interface CheckpointClickPayload {
  id: number;
  title: string;
  x: number;
  y: number;
}

// Match the scene's CHECKPOINT order
const CHECKPOINT_TITLES = [
  "The Signboard",
  "The Bridge",
  "The Barn",
  "The Well",
] as const;

export function VillageTestClient(): ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<unknown | null>(null);
  const sceneRef = useRef<{
    advanceToNextCheckpoint: () => void;
    getCurrentIndex: () => number;
  } | null>(null);

  const [status, setStatus] = useState("Loading Phaser…");
  const [taskModal, setTaskModal] =
    useState<CheckpointClickPayload | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let cleanupHandler: (() => void) | null = null;

    (async () => {
      try {
        const Phaser = await import("phaser");
        const { VillageMapScene } = await import(
          "@/lib/phaser/scenes/VillageMapScene"
        );
        if (cancelled || !containerRef.current) return;

        const scene = new VillageMapScene();

        const config: Phaser.Types.Core.GameConfig = {
          type: Phaser.AUTO,
          parent: containerRef.current,
          backgroundColor: "#1a2a1a",
          scale: {
            mode: Phaser.Scale.RESIZE,
            width: "100%",
            height: "100%",
          },
          physics: {
            default: "arcade",
            arcade: {
              gravity: { x: 0, y: 0 },
              debug: false,
            },
          },
          scene: [scene],
          fps: {
            target: 60,
            forceSetTimeOut: true,
          },
          render: {
            pixelArt: false,
            antialias: true,
          },
        };

        const game = new Phaser.Game(config);
        gameRef.current = game;
        sceneRef.current = scene;

        setStatus("Click gold checkpoint to open task · drag map to explore");

        const onCheckpoint = (payload: CheckpointClickPayload) => {
          setTaskModal(payload);
        };
        const onReached = (payload: { id: number; title: string }) => {
          setStatus(`Reached ${payload.title}`);
          setCurrentIndex(scene.getCurrentIndex());
        };
        const onComplete = () => {
          setComplete(true);
          setStatus("🎉 Village complete!");
        };

        game.events.on("CHECKPOINT_CLICKED", onCheckpoint);
        game.events.on("CHECKPOINT_REACHED", onReached);
        game.events.on("VILLAGE_COMPLETE", onComplete);

        cleanupHandler = () => {
          game.events.off("CHECKPOINT_CLICKED", onCheckpoint);
          game.events.off("CHECKPOINT_REACHED", onReached);
          game.events.off("VILLAGE_COMPLETE", onComplete);
          game.destroy(true);
        };
      } catch (err) {
        console.error("[VillageTest] boot failed", err);
        if (!cancelled) setStatus("Failed to load Phaser scene");
      }
    })();

    return () => {
      cancelled = true;
      if (cleanupHandler) cleanupHandler();
      gameRef.current = null;
      sceneRef.current = null;
    };
  }, []);

  const handleComplete = () => {
    setTaskModal(null);
    sceneRef.current?.advanceToNextCheckpoint();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        background: "#0e1a12",
      }}
    >
      {/* Phaser canvas */}
      <div
        ref={containerRef}
        style={{ position: "absolute", inset: 0 }}
        aria-label="Village test map"
      />

      {/* Top-left status */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          background: "rgba(0,0,0,0.65)",
          color: "#fff",
          padding: "8px 14px",
          borderRadius: 999,
          fontFamily: "system-ui, sans-serif",
          fontSize: 13,
          pointerEvents: "none",
          zIndex: 10,
        }}
      >
        {status}
      </div>

      {/* Top-right progress pill */}
      <div
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          background: "rgba(0,0,0,0.65)",
          color: "#ffd166",
          padding: "8px 14px",
          borderRadius: 999,
          fontFamily: "system-ui, sans-serif",
          fontSize: 13,
          fontWeight: 700,
          pointerEvents: "none",
          zIndex: 10,
        }}
      >
        Quest {Math.min(currentIndex + 1, 4)} / 4
      </div>

      {/* Bottom instructions */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(0,0,0,0.6)",
          color: "#ffd166",
          padding: "8px 16px",
          borderRadius: 8,
          fontFamily: "system-ui, sans-serif",
          fontSize: 13,
          pointerEvents: "none",
          zIndex: 10,
          letterSpacing: 1,
        }}
      >
        🖱️ Drag to explore · Click gold checkpoint to start task
      </div>

      {/* Task modal — appears when the active checkpoint is clicked */}
      {taskModal && !complete && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 20,
          }}
        >
          <div
            style={{
              background: "linear-gradient(180deg,#241a10 0%,#12100c 100%)",
              border: "2px solid #ffd166",
              borderRadius: 14,
              padding: "26px 28px",
              minWidth: 340,
              maxWidth: 480,
              boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
              fontFamily: "system-ui, sans-serif",
              color: "#fff",
            }}
          >
            <div
              style={{
                fontSize: 12,
                letterSpacing: 2,
                color: "#ffd166",
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              Checkpoint {taskModal.id} of 4
            </div>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 800,
                margin: "0 0 10px 0",
                color: "#ffd166",
              }}
            >
              {taskModal.title}
            </h2>
            <p style={{ fontSize: 14, opacity: 0.9, marginBottom: 20 }}>
              This is where your real task would appear (writing prompt, AI
              cross-questioning, submission, etc). For now this is a demo —
              click complete to advance Sparky to the next checkpoint.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => setTaskModal(null)}
                style={{
                  background: "transparent",
                  color: "#ffd166",
                  border: "1px solid #ffd166",
                  padding: "10px 16px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                Not now
              </button>
              <button
                onClick={handleComplete}
                style={{
                  background: "#ffd166",
                  color: "#1a1208",
                  border: "none",
                  padding: "10px 18px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 800,
                  fontSize: 13,
                }}
              >
                Complete task →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Final win celebration */}
      {complete && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 30,
            fontFamily: "system-ui, sans-serif",
            color: "#ffd166",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ fontSize: 48, fontWeight: 900 }}>🎉 Village Cleared!</div>
          <div style={{ fontSize: 16, opacity: 0.9 }}>
            All 4 checkpoints complete
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 12,
              background: "#ffd166",
              color: "#1a1208",
              border: "none",
              padding: "10px 22px",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            Play again
          </button>
        </div>
      )}

      {/* Checkpoint titles reference (small legend, top-center) */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(0,0,0,0.6)",
          color: "#fff",
          padding: "6px 12px",
          borderRadius: 8,
          fontFamily: "system-ui, sans-serif",
          fontSize: 12,
          pointerEvents: "none",
          zIndex: 10,
          display: "flex",
          gap: 12,
        }}
      >
        {CHECKPOINT_TITLES.map((title, i) => (
          <span
            key={title}
            style={{
              color:
                i < currentIndex
                  ? "#4ade80"
                  : i === currentIndex
                    ? "#ffd166"
                    : "#666",
              fontWeight: i === currentIndex ? 700 : 400,
            }}
          >
            {i + 1}. {title}
          </span>
        ))}
      </div>
    </div>
  );
}
