"use client";

/**
 * /dev/spreadsheet — Preview + smoke test for the new SpreadsheetTool.
 * Renders the tool in isolation with a sample prompt so QA can verify
 * copy-paste from Excel, cell resizing, row/column insert, submit
 * payload structure, and dark-mode styling.
 *
 * Not linked from anywhere — dev-only, hit directly.
 */

import { useState } from "react";
import { SpreadsheetTool } from "@/components/tools/spreadsheet-tool";

export default function SpreadsheetDevPage() {
  const [submitted, setSubmitted] = useState<unknown>(null);
  const [seed, setSeed] = useState(0);

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="border-b border-white/10 bg-neutral-900 px-4 py-3">
        <h1 className="font-mono text-sm font-bold tracking-wide text-amber-300">
          SpreadsheetTool preview
        </h1>
        <p className="mt-1 text-xs text-white/60">
          jspreadsheet-ce · Excel-like grid · MIT · try pasting a range from
          Excel/Google Sheets to test copy-paste import.
        </p>
      </div>

      <div className="mx-auto flex max-w-5xl flex-col gap-4 p-6">
        <div className="rounded-xl border border-white/10 bg-neutral-900/60 p-4">
          <SpreadsheetTool
            key={seed}
            prompt="Sample task: Build a competitor comparison table — cover what each competitor offers, who they target, price point, and where they fall short for your customer."
            onSubmit={(payload) => setSubmitted(payload)}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setSubmitted(null);
              setSeed((s) => s + 1);
            }}
            className="rounded-md border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-white/70 hover:bg-white/[0.06]"
          >
            Reset grid
          </button>
        </div>

        {submitted ? (
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.05] p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-emerald-300">
              Submit payload (what would go to Convex)
            </p>
            <pre className="max-h-[300px] overflow-auto rounded bg-black/40 p-3 text-[11px] leading-relaxed text-white/80">
              {JSON.stringify(submitted, null, 2)}
            </pre>
          </div>
        ) : null}
      </div>
    </div>
  );
}
