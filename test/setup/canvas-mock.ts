/**
 * test/setup/canvas-mock.ts
 *
 * Canvas mock for Phaser test suites running in jsdom.
 *
 * jsdom does not implement HTMLCanvasElement.getContext(), which causes
 * Phaser's device detection code to throw at import time:
 *   TypeError: Cannot set properties of null (setting 'fillStyle')
 *
 * This file stubs the minimum Canvas 2D API that Phaser's CanvasFeatures
 * module probes during its initial `init()` call, allowing Phaser classes
 * to be imported in test files without a real browser context.
 *
 * Usage — referenced from vitest.config.ts:
 *   test: { setupFiles: ['./test/setup/canvas-mock.ts'] }
 */

// ─────────────────────────────────────────────────────────────────────────────
// Minimal CanvasRenderingContext2D stub
// Only the properties/methods that Phaser probes at module-load time need to
// be present. Everything else can be a no-op.
// ─────────────────────────────────────────────────────────────────────────────

const ctx2dStub: Partial<CanvasRenderingContext2D> = {
  // Properties read by CanvasFeatures.js
  fillStyle: "#000000" as string | CanvasGradient | CanvasPattern,
  globalAlpha: 1,
  globalCompositeOperation: "source-over" as GlobalCompositeOperation,
  imageSmoothingEnabled: false,
  shadowBlur: 0,
  shadowColor: "rgba(0,0,0,0)",
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  strokeStyle: "#000000" as string | CanvasGradient | CanvasPattern,

  // Methods called during feature detection
  save: () => {},
  restore: () => {},
  fillRect: () => {},
  clearRect: () => {},
  drawImage: () => {},
  beginPath: () => {},
  closePath: () => {},
  moveTo: () => {},
  lineTo: () => {},
  stroke: () => {},
  fill: () => {},
  arc: () => {},
  rect: () => {},
  clip: () => {},
  measureText: () => ({ width: 0 }) as TextMetrics,
  fillText: () => {},
  strokeText: () => {},
  setTransform: () => {},
  resetTransform: () => {},
  scale: () => {},
  rotate: () => {},
  translate: () => {},
  transform: () => {},
  createLinearGradient: () =>
    ({
      addColorStop: () => {},
    }) as CanvasGradient,
  createRadialGradient: () =>
    ({
      addColorStop: () => {},
    }) as CanvasGradient,
  createPattern: () => null,
  getImageData: () =>
    ({
      data: new Uint8ClampedArray(4),
      width: 1,
      height: 1,
      colorSpace: "srgb",
    }) as ImageData,
  putImageData: () => {},
  createImageData: () =>
    ({
      data: new Uint8ClampedArray(4),
      width: 1,
      height: 1,
      colorSpace: "srgb",
    }) as ImageData,
};

// ─────────────────────────────────────────────────────────────────────────────
// Minimal WebGLRenderingContext stub (used by Phaser's WebGL renderer probe)
// ─────────────────────────────────────────────────────────────────────────────

const webglStub = {
  getParameter: (_param: number) => null,
  getExtension: (_name: string) => null,
  getSupportedExtensions: () => [] as string[],
  createShader: () => null,
  createProgram: () => null,
  createBuffer: () => null,
  createTexture: () => null,
  createFramebuffer: () => null,
  createRenderbuffer: () => null,
  enable: () => {},
  disable: () => {},
  viewport: () => {},
  clear: () => {},
  clearColor: () => {},
  blendFunc: () => {},
  blendEquation: () => {},
  depthMask: () => {},
  isContextLost: () => false,
  canvas: null as unknown as HTMLCanvasElement,
  drawingBufferWidth: 0,
  drawingBufferHeight: 0,
};

// ─────────────────────────────────────────────────────────────────────────────
// Patch HTMLCanvasElement.prototype.getContext
// ─────────────────────────────────────────────────────────────────────────────

type ContextId =
  | "2d"
  | "webgl"
  | "experimental-webgl"
  | "webgl2"
  | "bitmaprenderer";

const originalGetContext = HTMLCanvasElement.prototype.getContext.bind(
  HTMLCanvasElement.prototype,
);

// @ts-expect-error — we are intentionally overriding the overloaded signature
// with a simplified stub for test environments.
HTMLCanvasElement.prototype.getContext = function (
  contextId: ContextId,
  _options?: unknown,
): RenderingContext | null {
  // Try the real implementation first (returns null in jsdom anyway).
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const real = originalGetContext(contextId as any, _options as any);
    if (real) return real;
  } catch {
    // jsdom throws on some context types — fall through to stub.
  }

  switch (contextId) {
    case "2d":
      // Return a stub context that also points back at this canvas element.
      return {
        ...ctx2dStub,
        canvas: this as HTMLCanvasElement,
      } as unknown as CanvasRenderingContext2D;

    case "webgl":
    case "experimental-webgl":
    case "webgl2":
      return {
        ...webglStub,
        canvas: this as HTMLCanvasElement,
      } as unknown as WebGLRenderingContext;

    default:
      return null;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Stub additional browser APIs that Phaser / Howler reference at import time
// ─────────────────────────────────────────────────────────────────────────────

// AudioContext — Howler.js checks for this at module load
if (typeof window !== "undefined" && !window.AudioContext) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).AudioContext = class MockAudioContext {
    createGain() {
      return {
        gain: { value: 1 },
        connect: () => {},
        disconnect: () => {},
      };
    }
    createBufferSource() {
      return {
        connect: () => {},
        disconnect: () => {},
        start: () => {},
        stop: () => {},
        buffer: null,
        loop: false,
      };
    }
    createDynamicsCompressor() {
      return { connect: () => {}, disconnect: () => {} };
    }
    decodeAudioData(_buf: ArrayBuffer, cb?: (buf: AudioBuffer) => void) {
      cb?.({} as AudioBuffer);
      return Promise.resolve({} as AudioBuffer);
    }
    get destination() {
      return { connect: () => {}, disconnect: () => {} };
    }
    get state() {
      return "running";
    }
    resume() {
      return Promise.resolve();
    }
    suspend() {
      return Promise.resolve();
    }
    close() {
      return Promise.resolve();
    }
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).webkitAudioContext = (window as any).AudioContext;
}

// requestAnimationFrame — not available in all jsdom versions
if (typeof window !== "undefined" && !window.requestAnimationFrame) {
  window.requestAnimationFrame = (cb: FrameRequestCallback) =>
    setTimeout(cb, 16) as unknown as number;
  window.cancelAnimationFrame = (id: number) => clearTimeout(id);
}

// URL.createObjectURL — used by some asset loaders
if (typeof URL !== "undefined" && !URL.createObjectURL) {
  URL.createObjectURL = () => "blob:mock-url";
  URL.revokeObjectURL = () => {};
}

// performance.now — Phaser uses this for its game loop
if (typeof performance === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).performance = { now: () => Date.now() };
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock phaser3spectorjs — optional Phaser debugging dependency
// ─────────────────────────────────────────────────────────────────────────────

// Phaser's WebGLRenderer tries to require 'phaser3spectorjs' at import time.
// This is an optional debugging tool (Spector.js integration for WebGL inspection).
// We mock it as a no-op module so Phaser can be imported in test environments.

// Use vi.mock from vitest to stub the module globally
import { vi } from "vitest";

vi.mock("phaser3spectorjs", () => ({
  default: {},
  SPECTOR: null,
}));
