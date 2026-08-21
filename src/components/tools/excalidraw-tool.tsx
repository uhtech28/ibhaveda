"use client";

import { MapTool } from "@/components/tools/map-tool";

type MapElement = Parameters<typeof MapTool>[0]["initialContent"] extends {
  elements: infer Elements;
}
  ? Elements[number]
  : never;

interface ExcalidrawToolProps {
  prompt: string;
  onSubmit: (content: {
    type: "excalidraw";
    elements: MapElement[];
    scene: { elements: MapElement[] };
  }) => void;
  initialContent?: {
    elements?: MapElement[];
    scene?: { elements?: MapElement[] };
  };
  isSubmitting?: boolean;
  hidePrompt?: boolean;
}

export function ExcalidrawTool({
  prompt,
  onSubmit,
  initialContent,
  isSubmitting,
}: ExcalidrawToolProps) {
  const elements =
    initialContent?.scene?.elements ??
    initialContent?.elements ??
    [];

  return (
    <MapTool
      prompt={prompt}
      initialContent={{ elements }}
      isSubmitting={isSubmitting}
      onSubmit={(content) =>
        onSubmit({
          type: "excalidraw",
          elements: content.elements,
          scene: { elements: content.elements },
        })
      }
    />
  );
}

export default ExcalidrawTool;
