"use client";

/**
 * ExcalidrawTool — professional whiteboard for problem-space mapping,
 * journey diagrams, and other "map it out" checkpoint tasks.
 *
 * Wraps the Excalidraw React component with:
 *   - SSR-safe dynamic import (Excalidraw uses window/document at
 *     module load)
 *   - Dark theme to match the app
 *   - Serialisation to JSON on submit so backend contract mirrors the
 *     old MapTool (onSubmit receives an object with an `elements`
 *     array; anything the new tool captures — Excalidraw's full scene
 *     JSON — is stored under `elements` for backward compat, plus
 *     `excalidraw: true` and `raw` for the full scene payload)
 *   - Loads `initialContent.raw` if the user is editing a previously
 *     submitted board
 *
 * Install note: this file depends on `@excalidraw/excalidraw`. Add
 * `@excalidraw/excalidraw` to package.json and run
 *   npm install --legacy-peer-deps
 * once. Excalidraw has a peer-dep on React 18 while the app runs
 * React 19 — legacy-peer-deps papers over that; runtime is compatible.
 */

import { useCallback, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Loader2, Check } from "lucide-react";

// Excalidraw 0.18+ ships its stylesheet as a separate file that must
// be imported explicitly. Without this the canvas renders as
// unstyled DOM (toolbar text stacks vertically, icons balloon to
// full size). Static top-level import lets Turbopack bundle the CSS
// alongside the app bundle.
import "@excalidraw/excalidraw/index.css";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRef = any;

// Dynamic import — Excalidraw touches `window` at module init, so it
// cannot run during SSR. The empty SSR skeleton keeps hydration stable.
//
// NOTE on CSS: Excalidraw 0.17+ bundles its stylesheet with the main
// entry point (no separate index.css to import). Older 0.15/0.16
// versions shipped CSS separately; the old `.catch()` trick still
// broke Turbopack's static analysis at build time because the module
// specifier was resolved before runtime. Since we're on ^0.17.6, no
// separate CSS import is needed.
const Excalidraw = dynamic(
  async () => {
    const mod = await import("@excalidraw/excalidraw");
    return mod.Excalidraw;
  },
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[420px] w-full items-center justify-center rounded-lg border border-white/10 bg-white/[0.02]">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
        <span className="ml-2 text-sm text-white/60">Loading whiteboard…</span>
      </div>
    ),
  },
);

interface ExcalidrawScene {
  elements: unknown[];
  appState?: Record<string, unknown>;
  files?: Record<string, unknown>;
}

interface ExcalidrawToolProps {
  prompt: string;
  onSubmit: (content: {
    elements: unknown[];
    excalidraw: true;
    raw: ExcalidrawScene;
  }) => void;
  initialContent?: {
    elements?: unknown[];
    excalidraw?: boolean;
    raw?: ExcalidrawScene;
  };
  isSubmitting?: boolean;
  /** Optional fixed height. Defaults to 360 so the canvas + prompt +
   *  Submit row all fit inside the compact task modal without the
   *  Submit button falling off the bottom edge. */
  height?: number;
}

export function ExcalidrawTool({
  prompt,
  onSubmit,
  initialContent,
  isSubmitting = false,
  height = 320,
}: ExcalidrawToolProps) {
  const apiRef = useRef<AnyRef>(null);

  // Extract prior scene from initialContent (if user is editing a
  // previously submitted board). Falls back to an empty scene.
  const initialData = useMemo(() => {
    const raw = initialContent?.raw;
    return {
      elements: (raw?.elements ?? initialContent?.elements ?? []) as AnyRef[],
      appState: {
        theme: "dark" as const,
        viewBackgroundColor: "#0D111A",
        ...(raw?.appState ?? {}),
        // Force dark theme regardless of what was saved.
        theme: "dark",
        viewBackgroundColor: "#0D111A",
      },
      scrollToContent: true,
    };
  }, [initialContent]);

  const [elementCount, setElementCount] = useState<number>(
    (initialData.elements as AnyRef[]).length,
  );

  const handleChange = useCallback((elements: AnyRef) => {
    setElementCount(Array.isArray(elements) ? elements.length : 0);
  }, []);

  const handleSubmit = useCallback(() => {
    const api = apiRef.current;
    if (!api) return;
    // Convex accepts only JSON-serializable types — Excalidraw's
    // appState includes a `collaborators` Map, `snapLines` with
    // possible class instances, and other non-JSON values that blow
    // up the mutation. Round-trip through JSON with a replacer that
    // converts Map → plain object and Set → array, and strips
    // anything else non-serializable. Circular refs are handled with
    // a WeakSet.
    const sanitize = (value: unknown): unknown => {
      const seen = new WeakSet<object>();
      const walk = (v: unknown): unknown => {
        if (v === null || v === undefined) return v;
        const t = typeof v;
        if (t === "string" || t === "number" || t === "boolean") return v;
        if (t === "function" || t === "symbol" || t === "bigint") return undefined;
        if (v instanceof Date) return v.toISOString();
        if (v instanceof Map) {
          const o: Record<string, unknown> = {};
          for (const [k, val] of v as Map<unknown, unknown>) {
            o[String(k)] = walk(val);
          }
          return o;
        }
        if (v instanceof Set) return Array.from(v as Set<unknown>).map(walk);
        if (Array.isArray(v)) return v.map(walk);
        if (t === "object") {
          const obj = v as Record<string, unknown>;
          if (seen.has(obj)) return undefined;
          seen.add(obj);
          const out: Record<string, unknown> = {};
          for (const k of Object.keys(obj)) {
            const cleaned = walk(obj[k]);
            if (cleaned !== undefined) out[k] = cleaned;
          }
          return out;
        }
        return undefined;
      };
      return walk(value);
    };

    const elements = api.getSceneElements();
    const appState = api.getAppState();
    const files = api.getFiles();
    const safeElements = sanitize(elements) as unknown[];
    const safeAppState = sanitize(appState) as Record<string, unknown>;
    const safeFiles = sanitize(files) as Record<string, unknown>;
    onSubmit({
      elements: safeElements,
      excalidraw: true,
      raw: {
        elements: safeElements,
        appState: safeAppState,
        files: safeFiles,
      },
    });
  }, [onSubmit]);

  return (
    // Fill parent height so the sticky Submit row sits at the bottom
    // of the modal viewport rather than the bottom of the (tall)
    // scrolled content. `min-h-0` lets the flex canvas shrink inside
    // the modal's overflow-y-auto container.
    <div className="flex h-full min-h-0 flex-col gap-3">
      {prompt ? (
        <p className="rounded-md border border-white/8 bg-white/[0.02] px-3 py-2 text-xs leading-relaxed text-white/70">
          {prompt}
        </p>
      ) : null}

      <div
        className="excalidraw-wrapper w-full overflow-hidden rounded-xl border border-white/10 bg-[#0D111A]"
        style={{ height }}
      >
        <Excalidraw
          excalidrawAPI={(api: AnyRef) => {
            apiRef.current = api;
          }}
          initialData={initialData as AnyRef}
          theme="dark"
          onChange={handleChange as AnyRef}
          UIOptions={{
            canvasActions: {
              // Disable the default cloud/collab features — this is a
              // scoped, in-platform whiteboard, not a share portal.
              export: false,
              saveAsImage: false,
              saveToActiveFile: false,
              loadScene: false,
            },
          }}
        />
      </div>

      {/* Sticky footer — pinned to the bottom of the modal's scroll
          container (bottom-0) with the same dark surface behind it so
          long boards don't push Submit off the screen. */}
      <div className="sticky bottom-0 z-10 -mx-3 mt-auto flex items-center justify-between gap-3 border-t border-white/8 bg-[#111827] px-3 py-2 sm:-mx-5 sm:px-5">
        <span className="text-[11px] text-white/50">
          {elementCount} element{elementCount === 1 ? "" : "s"} on the board
        </span>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || elementCount === 0}
          size="sm"
          className="inline-flex items-center gap-1.5 bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Submitting…
            </>
          ) : (
            <>
              <Check className="h-3.5 w-3.5" />
              Submit board
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
