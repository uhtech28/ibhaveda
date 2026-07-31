"use client";

/**
 * Dev-only preview route for the Excalidraw whiteboard tool.
 * Open http://localhost:3000/dev/excalidraw to test in isolation.
 *
 * Not linked from any nav — this is a manual QA / integration
 * shortcut so we don't have to go through a task-submission flow
 * to eyeball the canvas.
 */

import { useState } from "react";
import { ExcalidrawTool } from "@/components/tools/excalidraw-tool";

export default function ExcalidrawPreviewPage() {
  const [submitted, setSubmitted] = useState<unknown>(null);
  return (
    <main className="min-h-screen bg-[#0A0E1A] p-6 text-white">
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        <header>
          <h1 className="text-lg font-semibold">Excalidraw preview</h1>
          <p className="text-xs text-white/60">
            Standalone test page — draw anything then hit Submit to see the
            serialized scene JSON printed below.
          </p>
        </header>

        <ExcalidrawTool
          prompt="Map out any problem, journey, or system — this is a scratchpad for eyeballing the whiteboard integration."
          onSubmit={(content) => setSubmitted(content)}
        />

        {submitted !== null && (
          <details
            open
            className="rounded-lg border border-white/10 bg-black/40 p-3 text-xs"
          >
            <summary className="cursor-pointer text-white/70">
              Submitted payload
            </summary>
            <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-words text-white/70">
              {JSON.stringify(submitted, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </main>
  );
}
