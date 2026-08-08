"use client";

/**
 * @file spreadsheet-tool.tsx
 * @description SpreadsheetTool — a self-contained React spreadsheet
 *   for structured table-building tasks (persona cards, competitor
 *   comparisons, SWOT, market overview, financial rows, etc.).
 *
 * Design decision: previous rev tried to wrap `jspreadsheet-ce` (a
 * third-party grid). The dynamic import path was fragile in this
 * project's Next.js + Turbopack + npm install --legacy-peer-deps
 * stack — users kept seeing the empty placeholder table because the
 * chunk never mounted. Product ask (verbatim): "STILL SAME IMPLEMENT
 * THAT PLATFORM".
 *
 * The reliable fix is to own the spreadsheet ourselves — pure React,
 * no third-party runtime dependency, native browser inputs. Features:
 *   - Fully editable cells (click/tab into any cell, type)
 *   - Keyboard nav: Tab / Shift-Tab / Enter / Shift-Enter / Arrow keys
 *   - Paste from Excel / Google Sheets — the browser hands us a
 *     tab-separated string on paste; we split it across cells starting
 *     at the current selection
 *   - Add / remove rows and columns
 *   - Full round-trip: initialContent.raw is re-hydrated so a founder
 *     editing a previously submitted table sees exactly what they
 *     submitted
 *   - onSubmit payload matches the pre-existing contract shape:
 *     { rows, cols, headers, data, spreadsheet: true, raw }
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Check, Plus, X } from "lucide-react";

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

function defaultHeader(i: number): string {
  // A, B, C, ..., Z, AA, AB, ... — Excel-style column headers.
  let name = "";
  let n = i;
  while (n >= 0) {
    name = String.fromCharCode(65 + (n % 26)) + name;
    n = Math.floor(n / 26) - 1;
  }
  return `Column ${name}`;
}

function makeEmptyGrid(rows: number, cols: number): (string | number | null)[][] {
  return Array.from({ length: rows }, () =>
    Array<string | number | null>(cols).fill(""),
  );
}

export function SpreadsheetTool({
  prompt,
  onSubmit,
  initialContent,
  isSubmitting = false,
  initialRows = 8,
  initialCols = 4,
  hidePrompt = false,
}: SpreadsheetToolProps) {
  // Resolve initial grid state — new / editing existing / legacy TableTool.
  const initial = useMemo<SpreadsheetSnapshot>(() => {
    if (initialContent?.raw) {
      return {
        headers:
          initialContent.raw.headers ??
          Array.from({ length: initialCols }, (_, i) => defaultHeader(i)),
        data: initialContent.raw.data ?? makeEmptyGrid(initialRows, initialCols),
      };
    }
    if (initialContent?.headers && initialContent?.data) {
      return {
        headers: initialContent.headers,
        data: initialContent.data,
      };
    }
    if (initialContent?.rows && Array.isArray(initialContent.rows)) {
      const rows = initialContent.rows as (string | number | null)[][];
      const colsN = Math.max(...rows.map((r) => r.length), initialCols);
      return {
        headers: Array.from({ length: colsN }, (_, i) => defaultHeader(i)),
        data: rows,
      };
    }
    return {
      headers: Array.from({ length: initialCols }, (_, i) => defaultHeader(i)),
      data: makeEmptyGrid(initialRows, initialCols),
    };
    // Intentionally only recompute on prop identity change — the user's
    // ongoing edits below are stored in `data`/`headers` state and would
    // be blown away if we recomputed every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [headers, setHeaders] = useState<string[]>(initial.headers);
  const [data, setData] = useState<(string | number | null)[][]>(initial.data);
  const [selection, setSelection] = useState<{ row: number; col: number } | null>(
    null,
  );
  const cellRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const cellCount = useMemo(
    () =>
      data.reduce(
        (n, row) => n + row.filter((c) => c !== "" && c != null).length,
        0,
      ),
    [data],
  );

  const focusCell = useCallback((row: number, col: number) => {
    const el = cellRefs.current.get(`${row}:${col}`);
    if (el) {
      el.focus();
      el.select?.();
    }
  }, []);

  const setCell = useCallback(
    (row: number, col: number, value: string | number | null) => {
      setData((prev) => {
        const next = prev.map((r) => r.slice());
        // Extend rows/cols on-demand if the user pasted past the edge.
        while (next.length <= row) {
          next.push(Array<string | number | null>(headers.length).fill(""));
        }
        while (next[row].length <= col) {
          next[row].push("");
        }
        next[row][col] = value;
        return next;
      });
    },
    [headers.length],
  );

  const addRow = useCallback(() => {
    setData((prev) => [
      ...prev,
      Array<string | number | null>(headers.length).fill(""),
    ]);
  }, [headers.length]);

  const addCol = useCallback(() => {
    setHeaders((prev) => [...prev, defaultHeader(prev.length)]);
    setData((prev) => prev.map((r) => [...r, ""]));
  }, []);

  const removeRow = useCallback((row: number) => {
    setData((prev) => {
      if (prev.length <= 1) return prev; // keep at least one row
      const next = prev.slice();
      next.splice(row, 1);
      return next;
    });
  }, []);

  const removeCol = useCallback((col: number) => {
    setHeaders((prev) => {
      if (prev.length <= 1) return prev; // keep at least one col
      const next = prev.slice();
      next.splice(col, 1);
      return next;
    });
    setData((prev) =>
      prev.map((r) => {
        if (r.length <= 1) return r;
        const next = r.slice();
        next.splice(col, 1);
        return next;
      }),
    );
  }, []);

  // Paste handler — supports Excel / Google Sheets tab-separated text.
  const handlePaste = useCallback(
    (row: number, col: number, e: React.ClipboardEvent<HTMLInputElement>) => {
      const text = e.clipboardData?.getData("text");
      if (!text) return;
      // Excel / Sheets: rows split by \n, cells split by \t.
      const lines = text.replace(/\r/g, "").split("\n");
      // If a single cell was pasted (no tab, single line), let the
      // default browser paste happen — no need to expand.
      if (lines.length === 1 && !lines[0].includes("\t")) return;
      e.preventDefault();
      lines.forEach((line, ri) => {
        // Drop trailing empty line if the copied range had a newline.
        if (ri === lines.length - 1 && line === "") return;
        const cells = line.split("\t");
        cells.forEach((val, ci) => {
          setCell(row + ri, col + ci, val);
        });
      });
    },
    [setCell],
  );

  const handleKeyDown = useCallback(
    (row: number, col: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      const maxRow = data.length - 1;
      const maxCol = headers.length - 1;
      if (e.key === "Tab") {
        e.preventDefault();
        const nextCol = e.shiftKey ? col - 1 : col + 1;
        if (nextCol > maxCol) {
          focusCell(row + 1 > maxRow ? 0 : row + 1, 0);
        } else if (nextCol < 0) {
          focusCell(row - 1 < 0 ? 0 : row - 1, maxCol);
        } else {
          focusCell(row, nextCol);
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        const nextRow = e.shiftKey ? row - 1 : row + 1;
        if (nextRow > maxRow) {
          // Auto-append a row if the user hits Enter on the last row.
          addRow();
          focusCell(row + 1, col);
        } else if (nextRow < 0) {
          focusCell(0, col);
        } else {
          focusCell(nextRow, col);
        }
      } else if (e.key === "ArrowUp" && !e.shiftKey) {
        // Only intercept when the cursor is at the start — otherwise
        // let the native input handle in-cell navigation.
        const el = e.currentTarget;
        if (el.selectionStart === 0 && el.selectionEnd === 0) {
          e.preventDefault();
          if (row > 0) focusCell(row - 1, col);
        }
      } else if (e.key === "ArrowDown" && !e.shiftKey) {
        const el = e.currentTarget;
        if (
          el.selectionStart === el.value.length &&
          el.selectionEnd === el.value.length
        ) {
          e.preventDefault();
          if (row < maxRow) focusCell(row + 1, col);
        }
      }
    },
    [data.length, headers.length, focusCell, addRow],
  );

  const handleSubmit = useCallback(() => {
    onSubmit({
      rows: data.length,
      cols: headers.length,
      headers,
      data,
      spreadsheet: true,
      raw: { headers, data },
    });
  }, [onSubmit, data, headers]);

  // Attach a ref helper for cell inputs.
  const attachRef = useCallback(
    (row: number, col: number) => (el: HTMLInputElement | null) => {
      const key = `${row}:${col}`;
      if (el) cellRefs.current.set(key, el);
      else cellRefs.current.delete(key);
    },
    [],
  );

  useEffect(() => {
    void selection; // reserved for future selection-range features
  }, [selection]);

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
          Copy-paste from Excel supported · Tab / Enter to navigate
        </span>
      </div>

      <div className="w-full flex-1 overflow-auto rounded-lg border border-white/15 bg-[#0D111A]">
        <table className="border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-20 min-w-[42px] border border-white/25 bg-[#1e2a44] p-0" />
              {headers.map((h, colIdx) => (
                <th
                  key={colIdx}
                  className="group relative min-w-[140px] border border-white/25 bg-[#1e2a44] px-2 py-2 text-left"
                >
                  <input
                    type="text"
                    value={h}
                    onChange={(e) =>
                      setHeaders((prev) =>
                        prev.map((x, i) => (i === colIdx ? e.target.value : x)),
                      )
                    }
                    className="w-full bg-transparent text-[12px] font-bold uppercase tracking-wider text-white outline-none focus:ring-1 focus:ring-indigo-400/60"
                    aria-label={`Header column ${colIdx + 1}`}
                  />
                  {headers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCol(colIdx)}
                      className="absolute right-1 top-1 hidden h-4 w-4 items-center justify-center rounded text-[10px] text-white/50 hover:bg-white/10 hover:text-red-300 group-hover:flex"
                      aria-label={`Delete column ${colIdx + 1}`}
                      title="Remove column"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIdx) => (
              <tr key={rowIdx} className="group">
                <td className="sticky left-0 z-10 min-w-[42px] border border-white/25 bg-[#1a2033] text-center text-[11px] font-semibold text-white/60">
                  <div className="relative flex items-center justify-center">
                    <span>{rowIdx + 1}</span>
                    {data.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRow(rowIdx)}
                        className="ml-1 hidden h-4 w-4 items-center justify-center rounded text-[10px] text-white/50 hover:bg-white/10 hover:text-red-300 group-hover:flex"
                        aria-label={`Delete row ${rowIdx + 1}`}
                        title="Remove row"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </div>
                </td>
                {headers.map((_, colIdx) => {
                  const val = row[colIdx];
                  return (
                    <td
                      key={colIdx}
                      className="border border-white/20 bg-[#0D111A] p-0"
                      style={{ height: 34 }}
                    >
                      <input
                        ref={attachRef(rowIdx, colIdx)}
                        type="text"
                        value={val == null ? "" : String(val)}
                        onChange={(e) =>
                          setCell(rowIdx, colIdx, e.target.value)
                        }
                        onFocus={() => setSelection({ row: rowIdx, col: colIdx })}
                        onKeyDown={(e) => handleKeyDown(rowIdx, colIdx, e)}
                        onPaste={(e) => handlePaste(rowIdx, colIdx, e)}
                        className="h-full w-full bg-transparent px-2 py-2 text-[13px] leading-tight text-white outline-none focus:bg-indigo-500/15 focus:ring-2 focus:ring-inset focus:ring-indigo-400/80"
                        aria-label={`Row ${rowIdx + 1} column ${colIdx + 1}`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="sticky bottom-0 z-10 -mx-3 mt-auto flex items-center justify-between gap-3 border-t border-white/8 bg-[#111827] px-3 py-2 sm:-mx-5 sm:px-5">
        <span className="text-[11px] text-white/50">
          {cellCount} filled cell{cellCount === 1 ? "" : "s"} ·{" "}
          {data.length}×{headers.length}
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
    </div>
  );
}
