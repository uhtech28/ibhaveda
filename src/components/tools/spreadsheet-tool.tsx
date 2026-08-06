"use client";

/**
 * @file spreadsheet-tool.tsx
 * @description SpreadsheetTool — professional Excel-like grid for
 *   structured table-building tasks (persona cards, competitor
 *   comparisons, SWOT, market overview, financial rows, etc.).
 *
 * Wraps jspreadsheet-ce with:
 *   - SSR-safe dynamic import (jspreadsheet touches window / DOM at
 *     module load)
 *   - Dark-mode CSS variables applied to the standard jsuites theme
 *   - Native Excel copy/paste — users can paste a range straight from
 *     Microsoft Excel / Google Sheets and it lands in the grid
 *   - Full round-trip: initialContent.raw is re-hydrated so a founder
 *     editing a previously submitted table sees exactly what they
 *     submitted
 *   - onSubmit payload matches the ExcalidrawTool contract shape:
 *     { rows, cols, headers, data, spreadsheet: true, raw }
 *     — `rows`/`cols`/`data` mirror the shape the legacy TableTool
 *     produced so backend / AI evaluator code doesn't need branching.
 *
 * Install note: this file depends on `jspreadsheet-ce` + `jsuites`.
 * They're in package.json — run `npm install --legacy-peer-deps` once
 * after pulling. jspreadsheet-ce is MIT, ~50KB gzipped, and doesn't
 * carry the Handsontable / Fortune-Sheet toolbar weight — perfect
 * fit for founder-scale tables inside the task submission modal.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Loader2, Check, Plus } from "lucide-react";

// jspreadsheet-ce and jsuites ship their stylesheets separately — must
// be imported at module top so Turbopack bundles them alongside the
// component. Without this the grid renders unstyled (no borders, no
// resize handles, no dropdown).
import "jspreadsheet-ce/dist/jspreadsheet.css";
import "jsuites/dist/jsuites.css";

// Loose typing — jspreadsheet-ce ships its own JS-only types that
// don't play cleanly with TS strict mode. We narrow at usage points.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRef = any;

/** Dynamic import — jspreadsheet-ce touches `document` at init. */
const useJspreadsheet = () => {
  const [factory, setFactory] = useState<AnyRef>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const mod = await import("jspreadsheet-ce");
      if (!cancelled) setFactory(() => mod.default);
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return factory;
};

interface SpreadsheetSnapshot {
  headers: string[];
  data: (string | number | null)[][];
}

interface SpreadsheetToolProps {
  prompt: string;
  onSubmit: (content: {
    rows: number;
    cols: number;
    headers: string[];
    data: (string | number | null)[][];
    spreadsheet: true;
    raw: SpreadsheetSnapshot;
  }) => void;
  initialContent?: {
    headers?: string[];
    data?: (string | number | null)[][];
    spreadsheet?: boolean;
    raw?: SpreadsheetSnapshot;
    // legacy TableTool shape — if a task was submitted with the old
    // tool, we accept its payload too so switching a task's tool from
    // "table" → "spreadsheet" doesn't lose the user's prior draft.
    rows?: (string | number | null)[][];
  };
  isSubmitting?: boolean;
  /** Optional starting grid dims. Defaults to 5 cols × 8 rows —
   *  covers persona-card / SWOT / competitor-grid without scrolling. */
  initialRows?: number;
  initialCols?: number;
  /** When true, skip rendering the prompt banner above the grid —
   *  TaskSubmissionModal shows it in its header already. */
  hidePrompt?: boolean;
}

const DEFAULT_HEADERS = ["Column A", "Column B", "Column C", "Column D", "Column E"];

export function SpreadsheetTool({
  prompt,
  onSubmit,
  initialContent,
  isSubmitting = false,
  initialRows = 8,
  initialCols = 5,
  hidePrompt = false,
}: SpreadsheetToolProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<AnyRef>(null);
  const factory = useJspreadsheet();
  const [cellCount, setCellCount] = useState(0);

  // Resolve initial grid state — new / editing existing / legacy TableTool.
  const initial = useMemo<SpreadsheetSnapshot>(() => {
    if (initialContent?.raw) {
      return {
        headers: initialContent.raw.headers ?? DEFAULT_HEADERS.slice(0, initialCols),
        data: initialContent.raw.data ?? [],
      };
    }
    if (initialContent?.headers && initialContent?.data) {
      return {
        headers: initialContent.headers,
        data: initialContent.data,
      };
    }
    // Legacy TableTool payload — { rows: [[...]] }
    if (initialContent?.rows && Array.isArray(initialContent.rows)) {
      const rows = initialContent.rows as (string | number | null)[][];
      const cols = Math.max(...rows.map((r) => r.length), initialCols);
      return {
        headers: DEFAULT_HEADERS.slice(0, cols),
        data: rows,
      };
    }
    // Fresh grid.
    return {
      headers: DEFAULT_HEADERS.slice(0, initialCols),
      data: Array.from({ length: initialRows }, () =>
        Array<string | number | null>(initialCols).fill(""),
      ),
    };
  }, [initialContent, initialRows, initialCols]);

  // Boot the spreadsheet once the factory has loaded.
  useEffect(() => {
    if (!factory || !containerRef.current) return;
    // Destroy any prior instance (StrictMode double-mount safety).
    if (instanceRef.current?.destroy) instanceRef.current.destroy();
    containerRef.current.innerHTML = "";

    const inst = factory(containerRef.current, {
      data: initial.data.length ? initial.data : [[""]],
      columns: initial.headers.map((h, i) => ({
        type: "text",
        title: h,
        width: i === 0 ? 160 : 140,
      })),
      minDimensions: [initialCols, initialRows],
      allowExport: false,
      allowManualInsertRow: true,
      allowManualInsertColumn: true,
      allowDeleteRow: true,
      allowDeleteColumn: true,
      about: false, // hide the vendor "About" footer link
      contextMenu: (obj: AnyRef, x: number, y: number, e: MouseEvent) => {
        // Use the default context menu but suppress the "About" item.
        const items = obj.getDefaultContextMenu?.(obj, x, y, e) ?? [];
        return items.filter((it: AnyRef) => it?.title !== "About");
      },
      onchange: () => {
        const data = inst.getData?.() ?? [];
        const count = data.reduce(
          (n: number, row: (string | number | null)[]) =>
            n + row.filter((c) => c !== "" && c != null).length,
          0,
        );
        setCellCount(count);
      },
    });
    instanceRef.current = inst;
    // Seed cell count on first paint.
    const seedData = inst.getData?.() ?? [];
    setCellCount(
      seedData.reduce(
        (n: number, row: (string | number | null)[]) =>
          n + row.filter((c) => c !== "" && c != null).length,
        0,
      ),
    );

    return () => {
      if (inst?.destroy) inst.destroy();
      instanceRef.current = null;
    };
  }, [factory, initial, initialCols, initialRows]);

  const addRow = useCallback(() => {
    instanceRef.current?.insertRow?.();
  }, []);
  const addCol = useCallback(() => {
    instanceRef.current?.insertColumn?.();
  }, []);

  const handleSubmit = useCallback(() => {
    const inst = instanceRef.current;
    if (!inst) return;
    const data = (inst.getData?.() ?? []) as (string | number | null)[][];
    const headers = (inst.getHeaders?.(true) ?? "")
      .toString()
      .split(",")
      .map((h: string) => h.trim());
    const rows = data.length;
    const cols = data[0]?.length ?? 0;
    onSubmit({
      rows,
      cols,
      headers,
      data,
      spreadsheet: true,
      raw: { headers, data },
    });
  }, [onSubmit]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {prompt && !hidePrompt ? (
        <p className="rounded-md border border-white/8 bg-white/[0.02] px-3 py-2 text-xs leading-relaxed text-white/70">
          {prompt}
        </p>
      ) : null}

      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={addRow}
          className="h-7 gap-1 border border-white/10 bg-white/[0.02] px-2 text-[11px] text-white/70 hover:bg-white/[0.06]"
        >
          <Plus className="h-3 w-3" /> Row
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={addCol}
          className="h-7 gap-1 border border-white/10 bg-white/[0.02] px-2 text-[11px] text-white/70 hover:bg-white/[0.06]"
        >
          <Plus className="h-3 w-3" /> Column
        </Button>
        <span className="ml-auto text-[10px] text-white/40">
          Copy-paste from Excel supported
        </span>
      </div>

      {/* Grid container — jspreadsheet mounts into this div directly.
          `spreadsheet-dark` scopes our CSS overrides so the light
          jsuites default doesn't leak app-wide. */}
      <div className="spreadsheet-dark w-full flex-1 overflow-auto rounded-lg border border-white/10 bg-[#0D111A] p-1">
        <div ref={containerRef} />
        {!factory && (
          <div className="flex h-[240px] items-center justify-center text-sm text-white/60">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading
            spreadsheet…
          </div>
        )}
      </div>

      <div className="sticky bottom-0 z-10 -mx-3 mt-auto flex items-center justify-between gap-3 border-t border-white/8 bg-[#111827] px-3 py-2 sm:-mx-5 sm:px-5">
        <span className="text-[11px] text-white/50">
          {cellCount} filled cell{cellCount === 1 ? "" : "s"}
        </span>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || cellCount === 0}
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
              Submit spreadsheet
            </>
          )}
        </Button>
      </div>

      {/* Dark-mode overrides for jsuites/jspreadsheet's default light
          theme. Scoped to `.spreadsheet-dark` so the styles don't
          leak into other jsuites usages elsewhere in the app. */}
      <style jsx global>{`
        .spreadsheet-dark .jexcel_container {
          background: transparent;
          color: #e5e7eb;
        }
        .spreadsheet-dark table.jexcel {
          background: #0d111a;
          color: #e5e7eb;
        }
        .spreadsheet-dark table.jexcel > thead > tr > td {
          background: #1a2033;
          color: #cbd5e1;
          border-color: rgba(255, 255, 255, 0.08);
          font-weight: 600;
        }
        .spreadsheet-dark table.jexcel > tbody > tr > td {
          background: #0d111a;
          color: #e5e7eb;
          border-color: rgba(255, 255, 255, 0.08);
        }
        .spreadsheet-dark table.jexcel > tbody > tr > td.highlight {
          background: rgba(99, 102, 241, 0.15);
        }
        .spreadsheet-dark table.jexcel > tbody > tr > td.selected {
          background: rgba(99, 102, 241, 0.25);
        }
        .spreadsheet-dark table.jexcel > tbody > tr > td[data-y="0"] {
          background: #14192a;
        }
        .spreadsheet-dark .jexcel_content {
          background: transparent;
        }
      `}</style>
    </div>
  );
}
