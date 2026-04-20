/**
 * venture-biomes.ts
 *
 * Startup ecosystem stage configurations for the 8 venture stages.
 * Professional platform design for founders and investors.
 */

import { BIOME_PALETTES } from "../utils/biome-textures";

/**
 * Venture stage configuration type
 */
export type VentureBiome = {
  id: number;
  name: string;
  biomeName: string;
  subtitle: string;
  x: number;
  y: number;
  width: number;
  height: number;
  biomeType: keyof typeof BIOME_PALETTES;
  checkpoints: number;
  challenges: string[];
  milestones: string[];
  pathColor: number;
  visualElements: string[];
  icon: string;
};

/**
 * Startup ecosystem stage layout for 8 stages
 *
 * Layout flows left-to-right representing the founder journey:
 * Ideation Hub → Research Lab → Validation Center → Product Studio →
 * Development Zone → Launch Pad → Growth Engine → Unicorn Valley
 *
 * THEME: Interactive Ideas - Modern startup platform with glassmorphism
 * Primary: #6366F1 (Indigo), Accent: #8B5CF6 (Purple)
 */
export const VENTURE_BIOMES: VentureBiome[] = [
  {
    id: 1,
    name: "ARCHIPELAGO",
    biomeName: "The Ocean of Ideas",
    subtitle: "Stages 1-8 · Great Voyage",
    x: 0,
    y: 0,
    width: 1800,
    height: 700,
    biomeType: "garage", // Note: The map scene overrides rendering, so this enum doesn't strictly matter
    checkpoints: 8,
    challenges: ["Navigation"],
    milestones: ["Reach the Finish"],
    pathColor: 0x8d6e63, // Bridge wood color
    visualElements: ["islands", "ships", "sharks"],
    icon: "🗺️",
  },
];

/**
 * Get biome configuration by stage number
 * Everything maps to the grand ocean now for seamless snaking path
 */
export function getBiomeForStage(stage: number): VentureBiome {
  return VENTURE_BIOMES[0];
}

/**
 * Get total map width (for camera bounds)
 */
export function getTotalMapWidth(): number {
  const lastBiome = VENTURE_BIOMES[VENTURE_BIOMES.length - 1];
  return lastBiome.x + lastBiome.width; // No padding needed for infinite seamless effect
}

/**
 * Get total map height (for camera bounds)
 */
export function getTotalMapHeight(): number {
  let maxHeight = 0;
  for (const biome of VENTURE_BIOMES) {
    const biomeBottom = biome.y + biome.height;
    if (biomeBottom > maxHeight) {
      maxHeight = biomeBottom;
    }
  }
  return maxHeight + 200; // Add padding
}

/**
 * Challenge type definitions (replacing enemies)
 */
export const CHALLENGE_TYPES = [
  {
    id: "market_research",
    name: "Market Research Gap",
    stage: 1,
    color: 0x6366f1,
    description: "Insufficient market understanding",
    texture: "challenge_research",
  },
  {
    id: "competitive_pressure",
    name: "Competitive Pressure",
    stage: 2,
    color: 0x10b981,
    description: "Strong existing competitors",
    texture: "challenge_competition",
  },
  {
    id: "validation_failure",
    name: "Validation Failure",
    stage: 3,
    color: 0x8b5cf6,
    description: "Assumptions not validated",
    texture: "challenge_validation",
  },
  {
    id: "design_complexity",
    name: "Design Complexity",
    stage: 4,
    color: 0xf59e0b,
    description: "Overly complex user experience",
    texture: "challenge_design",
  },
  {
    id: "technical_debt",
    name: "Technical Debt",
    stage: 5,
    color: 0x3b82f6,
    description: "Accumulating code issues",
    texture: "challenge_technical",
  },
  {
    id: "user_acquisition",
    name: "User Acquisition Challenge",
    stage: 6,
    color: 0xef4444,
    description: "Difficulty finding customers",
    texture: "challenge_acquisition",
  },
  {
    id: "retention_issue",
    name: "Retention Issue",
    stage: 7,
    color: 0x06b6d4,
    description: "Users not sticking around",
    texture: "challenge_retention",
  },
  {
    id: "funding_gap",
    name: "Funding Gap",
    stage: 8,
    color: 0xfbbf24,
    description: "Insufficient capital to scale",
    texture: "challenge_funding",
  },
];

/**
 * Milestone definitions for each checkpoint
 */
export const MILESTONE_DEFINITIONS: Record<
  string,
  {
    title: string;
    objectives: string[];
  }
> = {
  // Stage 1: Ideation Hub
  "1_1": {
    title: "Define Problem Statement",
    objectives: [
      "Identify a clear problem worth solving",
      "Research existing pain points",
      "Validate problem significance",
    ],
  },
  "1_2": {
    title: "Identify Target Market",
    objectives: [
      "Define ideal customer profile",
      "Segment potential users",
      "Estimate market size",
    ],
  },
  "1_3": {
    title: "Sketch Initial Solution",
    objectives: [
      "Brainstorm solution approaches",
      "Create concept sketches",
      "Outline core features",
    ],
  },
  "1_4": {
    title: "Validate Core Assumption",
    objectives: [
      "Test key hypothesis",
      "Gather initial feedback",
      "Refine value proposition",
    ],
  },

  // Stage 2: Research Lab
  "2_1": {
    title: "Complete Market Analysis",
    objectives: [
      "Research industry trends",
      "Analyze market dynamics",
      "Document findings",
    ],
  },
  "2_2": {
    title: "Interview Potential Users",
    objectives: [
      "Conduct 20 user interviews",
      "Document pain points",
      "Identify patterns",
    ],
  },
  "2_3": {
    title: "Map Competitive Landscape",
    objectives: [
      "Identify direct competitors",
      "Analyze indirect alternatives",
      "Find differentiation opportunities",
    ],
  },
  "2_4": {
    title: "Calculate Market Size",
    objectives: [
      "Estimate TAM (Total Addressable Market)",
      "Calculate SAM (Serviceable Available Market)",
      "Define SOM (Serviceable Obtainable Market)",
    ],
  },
  "2_5": {
    title: "Document Key Insights",
    objectives: [
      "Synthesize research findings",
      "Create insight report",
      "Share with stakeholders",
    ],
  },

  // Stage 3: Validation Center
  "3_1": {
    title: "Run User Tests",
    objectives: [
      "Design test scenarios",
      "Recruit test participants",
      "Execute testing sessions",
    ],
  },
  "3_2": {
    title: "Collect Feedback",
    objectives: [
      "Gather qualitative feedback",
      "Measure quantitative metrics",
      "Identify improvement areas",
    ],
  },
  "3_3": {
    title: "Validate Core Features",
    objectives: [
      "Test feature usability",
      "Measure feature value",
      "Prioritize feature set",
    ],
  },
  "3_4": {
    title: "Confirm Product-Market Fit",
    objectives: [
      "Measure user satisfaction",
      "Assess willingness to pay",
      "Validate retention potential",
    ],
  },

  // Continue for remaining stages...
};
