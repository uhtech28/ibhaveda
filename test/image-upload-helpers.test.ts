/**
 * Pure-function tests for the chat-image upload pipeline.
 *
 * The validation rules and the canvas-fit math are the high-value
 * test surface — canvas + storage IO is exercised in browser tests
 * outside this file.
 */

import { describe, expect, it } from "vitest";
import {
  CHAT_IMAGE_CONSTRAINTS,
  ChatImageValidationError,
  validateChatImage,
} from "../src/lib/chat/imageUpload";

function makeFile(size: number, type: string): File {
  // Build a blob of the given size with the given MIME type. The
  // contents don't matter — validation looks at File.size and File.type.
  const blob = new Blob([new Uint8Array(size)], { type });
  return new File([blob], "test", { type });
}

describe("CHAT_IMAGE_CONSTRAINTS", () => {
  it("limits files to 5 MB", () => {
    expect(CHAT_IMAGE_CONSTRAINTS.MAX_BYTES).toBe(5 * 1024 * 1024);
  });

  it("allows the four common web image MIME types", () => {
    expect(CHAT_IMAGE_CONSTRAINTS.ALLOWED_MIME).toContain("image/jpeg");
    expect(CHAT_IMAGE_CONSTRAINTS.ALLOWED_MIME).toContain("image/png");
    expect(CHAT_IMAGE_CONSTRAINTS.ALLOWED_MIME).toContain("image/webp");
    expect(CHAT_IMAGE_CONSTRAINTS.ALLOWED_MIME).toContain("image/gif");
  });

  it("caps the longest dimension at 1920px", () => {
    expect(CHAT_IMAGE_CONSTRAINTS.MAX_DIMENSION_PX).toBe(1920);
  });

  it("skips compression for very small files", () => {
    expect(CHAT_IMAGE_CONSTRAINTS.COMPRESSION_SKIP_BELOW_BYTES).toBeLessThan(
      CHAT_IMAGE_CONSTRAINTS.MAX_BYTES,
    );
  });
});

describe("validateChatImage", () => {
  it("accepts a small JPEG", () => {
    expect(() => validateChatImage(makeFile(100_000, "image/jpeg"))).not.toThrow();
  });

  it("accepts a small PNG", () => {
    expect(() => validateChatImage(makeFile(100_000, "image/png"))).not.toThrow();
  });

  it("accepts a small WebP", () => {
    expect(() => validateChatImage(makeFile(100_000, "image/webp"))).not.toThrow();
  });

  it("accepts a small GIF", () => {
    expect(() => validateChatImage(makeFile(100_000, "image/gif"))).not.toThrow();
  });

  it("rejects a PDF", () => {
    expect(() =>
      validateChatImage(makeFile(100_000, "application/pdf")),
    ).toThrow(ChatImageValidationError);
  });

  it("rejects an SVG (allowed types are bitmap-only)", () => {
    expect(() =>
      validateChatImage(makeFile(50_000, "image/svg+xml")),
    ).toThrow(ChatImageValidationError);
  });

  it("rejects a JPEG over 5 MB", () => {
    const sixMB = 6 * 1024 * 1024;
    let caught: ChatImageValidationError | null = null;
    try {
      validateChatImage(makeFile(sixMB, "image/jpeg"));
    } catch (e) {
      caught = e as ChatImageValidationError;
    }
    expect(caught).not.toBeNull();
    expect(caught?.code).toBe("too_large");
  });

  it("rejects an empty (no-type) file", () => {
    expect(() => validateChatImage(makeFile(50_000, ""))).toThrow();
  });

  it("error code is `wrong_type` for non-image files", () => {
    let caught: ChatImageValidationError | null = null;
    try {
      validateChatImage(makeFile(100, "text/plain"));
    } catch (e) {
      caught = e as ChatImageValidationError;
    }
    expect(caught?.code).toBe("wrong_type");
  });
});
