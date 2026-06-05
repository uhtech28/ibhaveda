/**
 * Pure-function tests for the video upload pipeline.
 *
 * The canvas + video-element operations require a real browser
 * (jsdom doesn't implement MediaError or video decoding). Those flows
 * are exercised in browser e2e. This file pins down the validation
 * rules and the constants.
 */

import { describe, expect, it } from "vitest";
import {
  VIDEO_CONSTRAINTS,
  VideoValidationError,
  validateVideoFile,
  validateVideoMetadata,
} from "../src/lib/video/videoUpload";

function makeFile(size: number, type: string): File {
  const blob = new Blob([new Uint8Array(size)], { type });
  return new File([blob], "test", { type });
}

describe("VIDEO_CONSTRAINTS", () => {
  it("caps at 60 seconds", () => {
    expect(VIDEO_CONSTRAINTS.MAX_DURATION_MS).toBe(60_000);
  });

  it("caps at 50 MB", () => {
    expect(VIDEO_CONSTRAINTS.MAX_BYTES).toBe(50 * 1024 * 1024);
  });

  it("allows the four common short-form formats", () => {
    expect(VIDEO_CONSTRAINTS.ALLOWED_MIME).toContain("video/mp4");
    expect(VIDEO_CONSTRAINTS.ALLOWED_MIME).toContain("video/webm");
    expect(VIDEO_CONSTRAINTS.ALLOWED_MIME).toContain("video/quicktime");
    expect(VIDEO_CONSTRAINTS.ALLOWED_MIME).toContain("video/x-m4v");
  });

  it("extracts the poster after the black-first-frame moment", () => {
    expect(VIDEO_CONSTRAINTS.POSTER_AT_SECONDS).toBeGreaterThan(0);
    expect(VIDEO_CONSTRAINTS.POSTER_AT_SECONDS).toBeLessThan(2);
  });
});

describe("validateVideoFile", () => {
  it("accepts a small MP4", () => {
    expect(() => validateVideoFile(makeFile(1_000_000, "video/mp4"))).not.toThrow();
  });

  it("accepts a small WebM", () => {
    expect(() => validateVideoFile(makeFile(1_000_000, "video/webm"))).not.toThrow();
  });

  it("accepts iOS-camera MOV", () => {
    expect(() =>
      validateVideoFile(makeFile(2_000_000, "video/quicktime")),
    ).not.toThrow();
  });

  it("rejects a JPEG", () => {
    expect(() => validateVideoFile(makeFile(100_000, "image/jpeg"))).toThrow(
      VideoValidationError,
    );
  });

  it("rejects audio-only", () => {
    expect(() => validateVideoFile(makeFile(100_000, "audio/mpeg"))).toThrow(
      VideoValidationError,
    );
  });

  it("rejects a 60 MB file as too_large", () => {
    let caught: VideoValidationError | null = null;
    try {
      validateVideoFile(makeFile(60 * 1024 * 1024, "video/mp4"));
    } catch (e) {
      caught = e as VideoValidationError;
    }
    expect(caught?.code).toBe("too_large");
  });

  it("rejects mkv", () => {
    let caught: VideoValidationError | null = null;
    try {
      validateVideoFile(makeFile(1_000_000, "video/x-matroska"));
    } catch (e) {
      caught = e as VideoValidationError;
    }
    expect(caught?.code).toBe("wrong_type");
  });
});

describe("validateVideoMetadata", () => {
  it("accepts a 30-second clip", () => {
    expect(() =>
      validateVideoMetadata({ durationMs: 30_000, width: 1080, height: 1920 }),
    ).not.toThrow();
  });

  it("accepts exactly 60 seconds", () => {
    expect(() =>
      validateVideoMetadata({ durationMs: 60_000, width: 1080, height: 1920 }),
    ).not.toThrow();
  });

  it("rejects 60.1 seconds as too_long", () => {
    let caught: VideoValidationError | null = null;
    try {
      validateVideoMetadata({
        durationMs: 60_100,
        width: 1080,
        height: 1920,
      });
    } catch (e) {
      caught = e as VideoValidationError;
    }
    expect(caught?.code).toBe("too_long");
  });

  it("rejects a 90-second clip with a helpful message", () => {
    let caught: VideoValidationError | null = null;
    try {
      validateVideoMetadata({
        durationMs: 90_000,
        width: 1080,
        height: 1920,
      });
    } catch (e) {
      caught = e as VideoValidationError;
    }
    expect(caught?.message).toContain("90");
    expect(caught?.message).toContain("60");
  });
});
