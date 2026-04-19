/**
 * Event Bridge Tests
 *
 * Comprehensive unit tests for the bidirectional React ↔ Phaser event system.
 *
 * Test coverage:
 * - Basic subscription and emission
 * - Bidirectional communication (React → Phaser, Phaser → React)
 * - Namespace isolation (onPhaser, onReact)
 * - Unsubscribe mechanisms
 * - Multiple handlers for the same event
 * - Error handling and propagation
 * - Listener management utilities
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { eventBridge } from "../../src/lib/phaser/utils/event-bridge";
import type {
  ReactToPhaserEvent,
  PhaserToReactEvent,
} from "../../src/lib/phaser/utils/event-bridge";

describe("EventBridge - Core Functionality", () => {
  beforeEach(() => {
    // Clear all listeners before each test to ensure isolation
    eventBridge.removeAllListeners();
  });

  describe("Basic Subscription and Emission", () => {
    it("should register a handler and receive events via on()", () => {
      const handler = vi.fn();
      eventBridge.on("PHASER_READY", handler);

      eventBridge.emit("PHASER_READY", { type: "PHASER_READY" });

      // emit() fires to both PHASER and REACT namespaces, and on() registers to both
      expect(handler).toHaveBeenCalledTimes(2);
      expect(handler).toHaveBeenCalledWith({ type: "PHASER_READY" });
    });

    it("should handle multiple handlers for the same event", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      eventBridge.on("CHECKPOINT_CLICKED", handler1);
      eventBridge.on("CHECKPOINT_CLICKED", handler2);
      eventBridge.on("CHECKPOINT_CLICKED", handler3);

      const event = {
        type: "CHECKPOINT_CLICKED" as const,
        checkpointId: "cp123",
        stage: 3,
        checkpoint: 5,
      };

      eventBridge.emit("CHECKPOINT_CLICKED", event);

      expect(handler1).toHaveBeenCalledWith(event);
      expect(handler2).toHaveBeenCalledWith(event);
      expect(handler3).toHaveBeenCalledWith(event);
    });

    it("should deduplicate the same handler registered multiple times", () => {
      const handler = vi.fn();

      eventBridge.on("PHASER_READY", handler);
      eventBridge.on("PHASER_READY", handler);
      eventBridge.on("PHASER_READY", handler);

      eventBridge.emit("PHASER_READY", { type: "PHASER_READY" });

      // Should only be called twice (once per namespace) despite being registered 3 times
      // The Set deduplication prevents multiple calls per namespace
      expect(handler).toHaveBeenCalledTimes(2);
    });

    it("should not invoke handlers for different event types", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      eventBridge.on("PHASER_READY", handler1);
      eventBridge.on("SCENE_LOADED", handler2);

      eventBridge.emit("PHASER_READY", { type: "PHASER_READY" });

      // emit() fires to both namespaces, so handler1 is called twice
      expect(handler1).toHaveBeenCalledTimes(2);
      expect(handler2).not.toHaveBeenCalled();
    });
  });

  describe("Bidirectional Communication", () => {
    it("should dispatch React → Phaser events correctly", () => {
      const phaserHandler = vi.fn();
      eventBridge.on("UPDATE_BRIGHTNESS", phaserHandler);

      const event: ReactToPhaserEvent = {
        type: "UPDATE_BRIGHTNESS",
        brightness: 75,
      };

      eventBridge.dispatchToPhaser(event);

      expect(phaserHandler).toHaveBeenCalledWith(event);
      expect(phaserHandler).toHaveBeenCalledTimes(1);
    });

    it("should dispatch Phaser → React events correctly", () => {
      const reactHandler = vi.fn();
      eventBridge.on("CHECKPOINT_CLICKED", reactHandler);

      const event: PhaserToReactEvent = {
        type: "CHECKPOINT_CLICKED",
        checkpointId: "checkpoint_5_3",
        stage: 5,
        checkpoint: 3,
      };

      eventBridge.dispatchToReact(event);

      expect(reactHandler).toHaveBeenCalledWith(event);
      expect(reactHandler).toHaveBeenCalledTimes(1);
    });

    it("should handle complex event payloads", () => {
      const handler = vi.fn();
      eventBridge.on("SET_ACTIVE_VENTURE", handler);

      const event: ReactToPhaserEvent = {
        type: "SET_ACTIVE_VENTURE",
        ventureId: "venture_abc123",
        personaGender: "female",
        assignedBosses: ["boss_unraveller", "boss_gravemind"],
        currentStage: 4,
      };

      eventBridge.dispatchToPhaser(event);

      expect(handler).toHaveBeenCalledWith(event);
    });
  });

  describe("Namespace Isolation", () => {
    it("should allow onPhaser() handlers to receive only Phaser-bound events", () => {
      const phaserOnlyHandler = vi.fn();
      eventBridge.onPhaser("UPDATE_BRIGHTNESS", phaserOnlyHandler);

      // Dispatch to Phaser — should be received
      eventBridge.dispatchToPhaser({
        type: "UPDATE_BRIGHTNESS",
        brightness: 50,
      });
      expect(phaserOnlyHandler).toHaveBeenCalledTimes(1);

      // Dispatch to React — should NOT be received
      eventBridge.dispatchToReact({
        type: "UPDATE_BRIGHTNESS",
        brightness: 50,
      } as any);
      expect(phaserOnlyHandler).toHaveBeenCalledTimes(1); // Still only 1
    });

    it("should allow onReact() handlers to receive only React-bound events", () => {
      const reactOnlyHandler = vi.fn();
      eventBridge.onReact("PHASER_READY", reactOnlyHandler);

      // Dispatch to React — should be received
      eventBridge.dispatchToReact({ type: "PHASER_READY" });
      expect(reactOnlyHandler).toHaveBeenCalledTimes(1);

      // Dispatch to Phaser — should NOT be received
      eventBridge.dispatchToPhaser({ type: "PHASER_READY" } as any);
      expect(reactOnlyHandler).toHaveBeenCalledTimes(1); // Still only 1
    });

    it("should allow on() handlers to receive events from both directions", () => {
      const bidirectionalHandler = vi.fn();
      eventBridge.on("GAME_PAUSE", bidirectionalHandler);

      // From React to Phaser
      eventBridge.dispatchToPhaser({ type: "GAME_PAUSE" });
      expect(bidirectionalHandler).toHaveBeenCalledTimes(1);

      // From Phaser to React (hypothetically)
      eventBridge.dispatchToReact({ type: "GAME_PAUSE" } as any);
      expect(bidirectionalHandler).toHaveBeenCalledTimes(2);
    });
  });

  describe("Unsubscribe Mechanisms", () => {
    it("should unsubscribe using the returned function from on()", () => {
      const handler = vi.fn();
      const unsubscribe = eventBridge.on("PHASER_READY", handler);

      eventBridge.emit("PHASER_READY", { type: "PHASER_READY" });
      expect(handler).toHaveBeenCalledTimes(2); // Called twice (both namespaces)

      unsubscribe();

      eventBridge.emit("PHASER_READY", { type: "PHASER_READY" });
      expect(handler).toHaveBeenCalledTimes(2); // Not called again
    });

    it("should unsubscribe using off() method", () => {
      const handler = vi.fn();
      eventBridge.on("SCENE_LOADED", handler);

      eventBridge.emit("SCENE_LOADED", {
        type: "SCENE_LOADED",
        scene: "WorldMap",
      });
      expect(handler).toHaveBeenCalledTimes(2); // Called twice (both namespaces)

      eventBridge.off("SCENE_LOADED", handler);

      eventBridge.emit("SCENE_LOADED", {
        type: "SCENE_LOADED",
        scene: "WorldMap",
      });
      expect(handler).toHaveBeenCalledTimes(2); // Not called again
    });

    it("should handle off() for a handler that was never registered (no-op)", () => {
      const handler = vi.fn();

      // Should not throw
      expect(() => {
        eventBridge.off("NONEXISTENT_EVENT", handler);
      }).not.toThrow();
    });

    it("should unsubscribe only the specific handler, not all handlers", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      eventBridge.on("FPS_UPDATE", handler1);
      eventBridge.on("FPS_UPDATE", handler2);
      eventBridge.on("FPS_UPDATE", handler3);

      eventBridge.off("FPS_UPDATE", handler2);

      eventBridge.emit("FPS_UPDATE", { type: "FPS_UPDATE", fps: 60 });

      // emit() fires to both namespaces
      expect(handler1).toHaveBeenCalledTimes(2);
      expect(handler2).not.toHaveBeenCalled();
      expect(handler3).toHaveBeenCalledTimes(2);
    });

    it("should unsubscribe from both namespaces when using off()", () => {
      const handler = vi.fn();
      eventBridge.on("UPDATE_CHECKPOINTS", handler);

      eventBridge.off("UPDATE_CHECKPOINTS", handler);

      eventBridge.dispatchToPhaser({
        type: "UPDATE_CHECKPOINTS",
        checkpoints: [],
      });
      eventBridge.dispatchToReact({ type: "UPDATE_CHECKPOINTS" } as any);

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should catch errors thrown by handlers and continue executing remaining handlers", () => {
      const handler1 = vi.fn(() => {
        throw new Error("Handler 1 failed");
      });
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      eventBridge.on("ERROR", handler1);
      eventBridge.on("ERROR", handler2);
      eventBridge.on("ERROR", handler3);

      // Should throw the first error after all handlers run
      expect(() => {
        eventBridge.emit("ERROR", { type: "ERROR", message: "Test error" });
      }).toThrow("Handler 1 failed");

      // But all handlers should have been called
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(handler3).toHaveBeenCalledTimes(1);
    });

    it("should log additional errors to console when multiple handlers fail", () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const handler1 = vi.fn(() => {
        throw new Error("Error 1");
      });
      const handler2 = vi.fn(() => {
        throw new Error("Error 2");
      });
      const handler3 = vi.fn(() => {
        throw new Error("Error 3");
      });

      eventBridge.on("MULTIPLE_ERRORS", handler1);
      eventBridge.on("MULTIPLE_ERRORS", handler2);
      eventBridge.on("MULTIPLE_ERRORS", handler3);

      expect(() => {
        eventBridge.emit("MULTIPLE_ERRORS", { type: "MULTIPLE_ERRORS" });
      }).toThrow("Error 1");

      // Should log errors 2 and 3 to console
      expect(consoleErrorSpy).toHaveBeenCalledTimes(2);

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Listener Management Utilities", () => {
    it("should return correct listener count", () => {
      expect(eventBridge.listenerCount()).toBe(0);

      const handler1 = vi.fn();
      const handler2 = vi.fn();

      eventBridge.on("EVENT_A", handler1);
      expect(eventBridge.listenerCount()).toBe(2); // Registered in both namespaces

      eventBridge.on("EVENT_B", handler2);
      expect(eventBridge.listenerCount()).toBe(4); // 2 events × 2 namespaces

      eventBridge.off("EVENT_A", handler1);
      expect(eventBridge.listenerCount()).toBe(2);
    });

    it("should remove all listeners via removeAllListeners()", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      eventBridge.on("EVENT_1", handler1);
      eventBridge.on("EVENT_2", handler2);
      eventBridge.onPhaser("RESIZE", handler3);

      expect(eventBridge.listenerCount()).toBeGreaterThan(0);

      eventBridge.removeAllListeners();

      expect(eventBridge.listenerCount()).toBe(0);

      // Verify handlers are not called
      eventBridge.emit("EVENT_1", { type: "EVENT_1" });
      eventBridge.emit("EVENT_2", { type: "EVENT_2" });
      eventBridge.dispatchToPhaser({
        type: "UPDATE_BRIGHTNESS",
        brightness: 50,
      });

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
      expect(handler3).not.toHaveBeenCalled();
    });

    it("should list all registered event types", () => {
      eventBridge.on("PHASER_READY", vi.fn());
      eventBridge.on("CHECKPOINT_CLICKED", vi.fn());
      eventBridge.onPhaser("UPDATE_BRIGHTNESS", vi.fn());

      const types = eventBridge.registeredTypes();

      // Should include namespaced keys
      expect(types).toContain("PHASER:PHASER_READY");
      expect(types).toContain("REACT:PHASER_READY");
      expect(types).toContain("PHASER:CHECKPOINT_CLICKED");
      expect(types).toContain("REACT:CHECKPOINT_CLICKED");
      expect(types).toContain("PHASER:UPDATE_BRIGHTNESS");
    });
  });

  describe("Real-World Event Scenarios", () => {
    it("should handle brightness update from React to Phaser", () => {
      const phaserSceneHandler = vi.fn((event) => {
        // Simulate Phaser scene applying brightness
        expect(event.brightness).toBeGreaterThanOrEqual(0);
        expect(event.brightness).toBeLessThanOrEqual(100);
      });

      eventBridge.on("UPDATE_BRIGHTNESS", phaserSceneHandler);

      const event: ReactToPhaserEvent = {
        type: "UPDATE_BRIGHTNESS",
        brightness: 54.28,
      };

      eventBridge.dispatchToPhaser(event);

      expect(phaserSceneHandler).toHaveBeenCalledWith(event);
    });

    it("should handle checkpoint click from Phaser to React", () => {
      const reactComponentHandler = vi.fn((event) => {
        // Simulate React opening a modal
        expect(event.checkpointId).toBeDefined();
        expect(event.stage).toBeGreaterThan(0);
        expect(event.checkpoint).toBeGreaterThan(0);
      });

      eventBridge.on("CHECKPOINT_CLICKED", reactComponentHandler);

      const event: PhaserToReactEvent = {
        type: "CHECKPOINT_CLICKED",
        checkpointId: "checkpoint_3_7",
        stage: 3,
        checkpoint: 7,
      };

      eventBridge.dispatchToReact(event);

      expect(reactComponentHandler).toHaveBeenCalledWith(event);
    });

    it("should handle badge award sequence", () => {
      const reactBadgeUIHandler = vi.fn();
      eventBridge.on("BADGE_AWARDED", reactBadgeUIHandler);

      const event: PhaserToReactEvent = {
        type: "BADGE_AWARDED",
        id: "badge_first_checkpoint",
        name: "First Steps",
        description: "Complete your first checkpoint",
        icon: "🏆",
        rarity: "common",
      };

      eventBridge.dispatchToReact(event);

      expect(reactBadgeUIHandler).toHaveBeenCalledWith(event);
      expect(reactBadgeUIHandler.mock.calls[0][0].rarity).toBe("common");
    });

    it("should handle game pause/resume flow", () => {
      const phaserPauseHandler = vi.fn();
      const phaserResumeHandler = vi.fn();

      eventBridge.on("GAME_PAUSE", phaserPauseHandler);
      eventBridge.on("GAME_RESUME", phaserResumeHandler);

      eventBridge.dispatchToPhaser({ type: "GAME_PAUSE" });
      expect(phaserPauseHandler).toHaveBeenCalledTimes(1);
      expect(phaserResumeHandler).not.toHaveBeenCalled();

      eventBridge.dispatchToPhaser({ type: "GAME_RESUME" });
      expect(phaserPauseHandler).toHaveBeenCalledTimes(1);
      expect(phaserResumeHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe("Edge Cases", () => {
    it("should handle events with no listeners gracefully", () => {
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      eventBridge.emit("UNHANDLED_EVENT", { type: "UNHANDLED_EVENT" });

      // Should log a warning for unhandled events (first time only)
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it("should only warn once per unhandled event type", () => {
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      eventBridge.emit("NEW_UNHANDLED", { type: "NEW_UNHANDLED" });
      eventBridge.emit("NEW_UNHANDLED", { type: "NEW_UNHANDLED" });
      eventBridge.emit("NEW_UNHANDLED", { type: "NEW_UNHANDLED" });

      // Should only warn once
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);

      consoleWarnSpy.mockRestore();
    });

    it("should handle rapid subscribe/unsubscribe cycles", () => {
      const handler = vi.fn();

      for (let i = 0; i < 100; i++) {
        const unsub = eventBridge.on("RAPID_TEST", handler);
        unsub();
      }

      eventBridge.emit("RAPID_TEST", { type: "RAPID_TEST" });
      expect(handler).not.toHaveBeenCalled();
    });
  });
});
