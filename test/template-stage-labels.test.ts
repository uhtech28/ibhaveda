import { describe, expect, it } from "vitest";
import { getTemplate, type TemplateId } from "@/config/templates";

const expectedStageLabels: Record<TemplateId, string[]> = {
  venture: [
    "The Village",
    "The Forest",
    "Validation Center",
    "Offer Design Studio",
    "Build & Deliver Zone",
    "Launch Pad",
    "Iteration Engine",
    "Scale Summit",
  ],
  academic: [
    "Ancient Library",
    "The Ruins",
    "Cartographer's Tower",
    "The Scriptorium",
    "Council Chamber",
    "Grand Archive",
  ],
  lab: [
    "Observatory",
    "Ancient Library",
    "Cartographer's Tower",
    "The Forge",
    "Alchemist's Laboratory",
    "Crossroads Town",
    "Grand Hall",
  ],
  creative: [
    "Sacred Grove",
    "Gallery of Echoes",
    "The Wilderness",
    "Village Square",
    "Artisan's Workshop",
    "Harbour",
  ],
};

describe("template stage labels", () => {
  it("uses the in-game biome names for every template and stage", () => {
    for (const [templateId, expectedLabels] of Object.entries(expectedStageLabels) as Array<[TemplateId, string[]]>) {
      const labels = getTemplate(templateId).stages.map((stage) => stage.biomeName);
      expect(labels).toEqual(expectedLabels);
    }
  });
});
