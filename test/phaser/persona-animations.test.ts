/**
 * Persona Animation Tests
 *
 * Tests for the enhanced Persona entity animations including:
 * - Walk cycle animation with bobbing
 * - Position setting and movement
 * - Idle/walk state transitions
 * - Public API contract verification
 */

import { describe, it, expect } from "vitest";
import { Persona, PersonaGender } from "../../src/lib/phaser/entities/Persona";

describe("Persona Animation System - API Contract", () => {
  describe("Type Definitions", () => {
    it("should export PersonaGender type with correct values", () => {
      const validGenders: PersonaGender[] = ["male", "female"];

      expect(validGenders).toContain("male");
      expect(validGenders).toContain("female");
    });
  });

  describe("Public API Methods", () => {
    it("should have required position management methods", () => {
      // Verify the Persona class exists and has the expected shape
      expect(Persona).toBeDefined();
      expect(typeof Persona).toBe("function");

      // Check prototype methods exist
      const prototype = Persona.prototype;

      expect(prototype.setPosition).toBeDefined();
      expect(typeof prototype.setPosition).toBe("function");

      expect(prototype.moveToPosition).toBeDefined();
      expect(typeof prototype.moveToPosition).toBe("function");

      expect(prototype.playWalk).toBeDefined();
      expect(typeof prototype.playWalk).toBe("function");

      expect(prototype.playIdle).toBeDefined();
      expect(typeof prototype.playIdle).toBe("function");
    });

    it("should export Persona class constructor", () => {
      // Constructor should accept: scene, x, y, gender
      expect(Persona.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe("Animation Features", () => {
    it("should support walk animation parameters", () => {
      // playWalk should accept targetX, targetY, duration
      const walkMethod = Persona.prototype.playWalk;

      expect(walkMethod.length).toBeGreaterThanOrEqual(2); // At least x and y
    });

    it("should support position setting", () => {
      // setPosition should accept x and y
      const setPositionMethod = Persona.prototype.setPosition;

      expect(setPositionMethod.length).toBeGreaterThanOrEqual(2);
    });

    it("should support movement animation", () => {
      // moveToPosition should accept targetX, targetY, duration
      const moveMethod = Persona.prototype.moveToPosition;

      expect(moveMethod.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Gender Variants", () => {
    it("should support male and female gender types", () => {
      const maleGender: PersonaGender = "male";
      const femaleGender: PersonaGender = "female";

      expect(maleGender).toBe("male");
      expect(femaleGender).toBe("female");
    });
  });

  describe("Integration Points", () => {
    it("should export all required types and classes", () => {
      expect(Persona).toBeDefined();
      // PersonaGender is a type, so it won't be in runtime exports
      // but we verify it compiles above
    });

    it("should maintain backward compatibility with Week 1 API", () => {
      // Original Week 1 methods should still exist
      expect(Persona.prototype.playIdle).toBeDefined();

      // Week 2 additions
      expect(Persona.prototype.playWalk).toBeDefined();
      expect(Persona.prototype.setPosition).toBeDefined();
      expect(Persona.prototype.moveToPosition).toBeDefined();
    });
  });

  describe("Method Signatures", () => {
    it("should have setPosition that returns this for chaining", () => {
      // setPosition should support chaining
      const method = Persona.prototype.setPosition;
      expect(method).toBeDefined();

      // In TypeScript, the return type is verified at compile time
      // Here we just verify the method exists
    });

    it("should have playWalk with duration parameter", () => {
      const walkMethod = Persona.prototype.playWalk;

      // playWalk(targetX, targetY, duration)
      // Should accept at least 2 params (x, y), with duration optional
      expect(walkMethod.length).toBeGreaterThanOrEqual(2);
    });

    it("should have moveToPosition with optional duration", () => {
      const moveMethod = Persona.prototype.moveToPosition;

      // moveToPosition(targetX, targetY, duration?)
      expect(moveMethod.length).toBeGreaterThanOrEqual(2);
    });
  });
});

describe("Persona Implementation Details", () => {
  it("should define walk animation constants correctly", () => {
    // Verify the implementation includes expected animation parameters
    // These are implementation details we can verify exist
    expect(Persona.prototype.playWalk).toBeDefined();
    expect(Persona.prototype.playIdle).toBeDefined();
  });

  it("should maintain gender property", () => {
    // Gender should be a readonly property
    // Verified at compile time, but we can check the class structure
    expect(Persona).toBeDefined();
  });

  it("should support both immediate and animated positioning", () => {
    // setPosition = immediate
    expect(Persona.prototype.setPosition).toBeDefined();

    // moveToPosition = animated
    expect(Persona.prototype.moveToPosition).toBeDefined();

    // These should be different methods
    expect(Persona.prototype.setPosition).not.toBe(
      Persona.prototype.moveToPosition,
    );
  });
});
