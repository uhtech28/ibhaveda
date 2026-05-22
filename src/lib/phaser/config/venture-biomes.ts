// /**
//  * venture-biomes.ts
//  *
//  * Startup ecosystem stage configurations for the 8 venture stages.
//  * Professional platform design for founders and investors.
//  */

// import { BIOME_PALETTES } from "../utils/biome-textures";

// /**
//  * Venture stage configuration type
//  */
// export type VentureBiome = {
//   id: number;
//   name: string;
//   biomeName: string;
//   subtitle: string;
//   x: number;
//   y: number;
//   width: number;
//   height: number;
//   biomeType: keyof typeof BIOME_PALETTES;
//   checkpoints: number;
//   challenges: string[];
//   milestones: string[];
//   pathColor: number;
//   visualElements: string[];
//   icon: string;
// };

// /**
//  * Startup ecosystem stage layout for 8 stages
//  *
//  * Layout flows left-to-right representing the founder journey:
//  * Ideation Hub → Research Lab → Validation Center → Product Studio →
//  * Development Zone → Launch Pad → Growth Engine → Unicorn Valley
//  *
//  * THEME: Interactive Ideas - Modern dark tech platform
//  * Primary: #6366F1 (Indigo), Accent: #8B5CF6 (Purple), Cyan: #06B6D4
//  */
// export const VENTURE_BIOMES: VentureBiome[] = [
//   {
//     id: 1,
//     name: "IDEATION",
//     biomeName: "Ideation",
//     subtitle: "Stage 1 · Birth of Ideas",
//     x: 0,
//     y: 0,
//     width: 1600,
//     height: 700,
//     biomeType: "garage",
//     checkpoints: 8, // Stages 1-2: 4+4 checkpoints
//     challenges: ["Finding Direction", "Validating Assumptions"],
//     milestones: ["Define Problem", "Sketch Solution"],
//     pathColor: 0x6366f1, // Indigo
//     visualElements: ["circles", "gradients", "glows"],
//     icon: "💡",
//   },
//   {
//     id: 2,
//     name: "RESEARCH",
//     biomeName: "Research",
//     subtitle: "Stage 2 · Climb to Knowledge",
//     x: 1600,
//     y: 0,
//     width: 1800,
//     height: 700,
//     biomeType: "summit",
//     checkpoints: 9, // Stages 3-4: 4+5 checkpoints
//     challenges: ["Data Collection", "Analysis Paralysis"],
//     milestones: ["Market Analysis", "User Interviews", "Competitive Landscape"],
//     pathColor: 0x8b5cf6, // Purple
//     visualElements: ["triangles", "lines", "nodes"],
//     icon: "🔍",
//   },
// ];

// /**
//  * Get biome configuration by stage number
//  * Stages 1-2: Ideation Archipelago
//  * Stages 3-4: Research Mountains
//  * Stages 5-8: Falls back to last biome (to be implemented later)
//  */
// export function getBiomeForStage(stage: number): VentureBiome {
//   if (stage <= 2) {
//     return VENTURE_BIOMES[0]; // Ideation Archipelago
//   } else if (stage <= 4) {
//     return VENTURE_BIOMES[1]; // Research Mountains
//   }
//   // Fallback for stages 5-8 (to be implemented in future phases)
//   return VENTURE_BIOMES[1];
// }

// /**
//  * Get total map width (for camera bounds)
//  */
// export function getTotalMapWidth(): number {
//   const lastBiome = VENTURE_BIOMES[VENTURE_BIOMES.length - 1];
//   return lastBiome.x + lastBiome.width; // No padding needed for infinite seamless effect
// }

// /**
//  * Get total map height (for camera bounds)
//  */
// export function getTotalMapHeight(): number {
//   let maxHeight = 0;
//   for (const biome of VENTURE_BIOMES) {
//     const biomeBottom = biome.y + biome.height;
//     if (biomeBottom > maxHeight) {
//       maxHeight = biomeBottom;
//     }
//   }
//   return maxHeight + 200; // Add padding
// }

// /**
//  * Challenge type definitions (replacing enemies)
//  */
// export const CHALLENGE_TYPES = [
//   {
//     id: "market_research",
//     name: "Market Research Gap",
//     stage: 1,
//     color: 0x6366f1,
//     description: "Insufficient market understanding",
//     texture: "challenge_research",
//   },
//   {
//     id: "competitive_pressure",
//     name: "Competitive Pressure",
//     stage: 2,
//     color: 0x10b981,
//     description: "Strong existing competitors",
//     texture: "challenge_competition",
//   },
//   {
//     id: "validation_failure",
//     name: "Validation Failure",
//     stage: 3,
//     color: 0x8b5cf6,
//     description: "Assumptions not validated",
//     texture: "challenge_validation",
//   },
//   {
//     id: "design_complexity",
//     name: "Design Complexity",
//     stage: 4,
//     color: 0xf59e0b,
//     description: "Overly complex user experience",
//     texture: "challenge_design",
//   },
//   {
//     id: "technical_debt",
//     name: "Technical Debt",
//     stage: 5,
//     color: 0x3b82f6,
//     description: "Accumulating code issues",
//     texture: "challenge_technical",
//   },
//   {
//     id: "user_acquisition",
//     name: "User Acquisition Challenge",
//     stage: 6,
//     color: 0xef4444,
//     description: "Difficulty finding customers",
//     texture: "challenge_acquisition",
//   },
//   {
//     id: "retention_issue",
//     name: "Retention Issue",
//     stage: 7,
//     color: 0x06b6d4,
//     description: "Users not sticking around",
//     texture: "challenge_retention",
//   },
//   {
//     id: "funding_gap",
//     name: "Funding Gap",
//     stage: 8,
//     color: 0xfbbf24,
//     description: "Insufficient capital to scale",
//     texture: "challenge_funding",
//   },
// ];

// /**
//  * Milestone definitions for each checkpoint
//  */
// export const MILESTONE_DEFINITIONS: Record<
//   string,
//   {
//     title: string;
//     objectives: string[];
//   }
// > = {
//   // Stage 1: Ideation Hub
//   "1_1": {
//     title: "Define Problem Statement",
//     objectives: [
//       "Identify a clear problem worth solving",
//       "Research existing pain points",
//       "Validate problem significance",
//     ],
//   },
//   "1_2": {
//     title: "Identify Target Market",
//     objectives: [
//       "Define ideal customer profile",
//       "Segment potential users",
//       "Estimate market size",
//     ],
//   },
//   "1_3": {
//     title: "Sketch Initial Solution",
//     objectives: [
//       "Brainstorm solution approaches",
//       "Create concept sketches",
//       "Outline core features",
//     ],
//   },
//   "1_4": {
//     title: "Validate Core Assumption",
//     objectives: [
//       "Test key hypothesis",
//       "Gather initial feedback",
//       "Refine value proposition",
//     ],
//   },

//   // Stage 2: Research Lab
//   "2_1": {
//     title: "Complete Market Analysis",
//     objectives: [
//       "Research industry trends",
//       "Analyze market dynamics",
//       "Document findings",
//     ],
//   },
//   "2_2": {
//     title: "Interview Potential Users",
//     objectives: [
//       "Conduct 20 user interviews",
//       "Document pain points",
//       "Identify patterns",
//     ],
//   },
//   "2_3": {
//     title: "Map Competitive Landscape",
//     objectives: [
//       "Identify direct competitors",
//       "Analyze indirect alternatives",
//       "Find differentiation opportunities",
//     ],
//   },
//   "2_4": {
//     title: "Calculate Market Size",
//     objectives: [
//       "Estimate TAM (Total Addressable Market)",
//       "Calculate SAM (Serviceable Available Market)",
//       "Define SOM (Serviceable Obtainable Market)",
//     ],
//   },
//   "2_5": {
//     title: "Document Key Insights",
//     objectives: [
//       "Synthesize research findings",
//       "Create insight report",
//       "Share with stakeholders",
//     ],
//   },

//   // Stage 3: Validation Center
//   "3_1": {
//     title: "Run User Tests",
//     objectives: [
//       "Design test scenarios",
//       "Recruit test participants",
//       "Execute testing sessions",
//     ],
//   },
//   "3_2": {
//     title: "Collect Feedback",
//     objectives: [
//       "Gather qualitative feedback",
//       "Measure quantitative metrics",
//       "Identify improvement areas",
//     ],
//   },
//   "3_3": {
//     title: "Validate Core Features",
//     objectives: [
//       "Test feature usability",
//       "Measure feature value",
//       "Prioritize feature set",
//     ],
//   },
//   "3_4": {
//     title: "Confirm Product-Market Fit",
//     objectives: [
//       "Measure user satisfaction",
//       "Assess willingness to pay",
//       "Validate retention potential",
//     ],
//   },

//   // Continue for remaining stages...
// };




/**
 * venture-biomes.ts
 *
 * Startup ecosystem stage configurations for the 8 venture stages.
 * Theme: Dark Tech Platform — Indigo / Purple / Cyan
 * Primary: #6366F1 (Indigo), Accent: #8B5CF6 (Purple), Highlight: #06B6D4 (Cyan)
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
 * Ideation Hub → Research Lab → Validation Center → Offer Design Studio →
 * Build & Deliver Zone → Launch Pad → Iteration Engine → Scale Summit
 *
 * THEME: Dark Tech Platform
 * Primary: #6366F1 (Indigo)  Accent: #8B5CF6 (Purple)  Highlight: #06B6D4 (Cyan)
 * Background: #0F0F1A (Deep Space Navy)  Surface: #1A1A2E
 * Stage 1 (Ideation)  — 4  checkpoints  biomeType: "ideation"
 * Stage 2 (Research)  — 5  checkpoints  biomeType: "research"
 */
export const VENTURE_BIOMES: VentureBiome[] = [
  {
    id: 1,
    name: "IDEATION",
    biomeName: "Ideation Hub",
    subtitle: "Stage 1 · Birth of Ideas",
    x: 0,
    y: 0,
    width: 1400,
    height: 700,
    biomeType: "ideation",
    checkpoints: 4,   // PRD Stage 1: 4 checkpoints
    challenges: ["Finding Direction", "Validating Assumptions"],
    milestones: ["Define Problem", "Sketch Solution", "Validate Core", "Idea Worth Pursuing"],
    pathColor: 0x6366f1,   // Indigo — brand primary
    visualElements: ["hex-grid", "circuit-nodes", "indigo-glow"],
    icon: "💡",
  },
  {
    id: 2,
    name: "RESEARCH",
    biomeName: "Research Lab",
    subtitle: "Stage 2 · Climb to Knowledge",
    x: 1400,
    y: 0,
    width: 1600,
    height: 700,
    biomeType: "research",
    checkpoints: 5,   // PRD Stage 2: 5 checkpoints
    challenges: ["Data Collection", "Analysis Paralysis"],
    milestones: ["Market Landscape", "Competitive Intel", "Deep Customer", "Trends", "Synthesis"],
    pathColor: 0x8b5cf6,   // Purple — stage 2 accent
    visualElements: ["data-streams", "graph-nodes", "purple-glow"],
    icon: "🔍",
  },
  // Stages 3-8 follow same pattern — to be implemented in future phases
];

/**
 * Get biome configuration by stage number
 * Stage 1: Ideation Hub        (4  checkpoints)
 * Stage 2: Research Lab        (5  checkpoints)
 * Stages 3-8: placeholder (fallback to last defined biome)
 */
export function getBiomeForStage(stage: number): VentureBiome {
  if (stage <= 2) {
    return VENTURE_BIOMES[stage - 1];
  }
  return VENTURE_BIOMES[VENTURE_BIOMES.length - 1];
}

/**
 * Get total map width (for camera bounds)
 */
export function getTotalMapWidth(): number {
  const lastBiome = VENTURE_BIOMES[VENTURE_BIOMES.length - 1];
  return lastBiome.x + lastBiome.width;
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
  return maxHeight + 200;
}

/**
 * Challenge type definitions (replacing enemies)
 * Colors aligned to website palette.
 */
export const CHALLENGE_TYPES = [
  {
    id: "market_research",
    name: "Market Research Gap",
    stage: 1,
    color: 0x6366f1,   // Indigo
    description: "Insufficient market understanding",
    texture: "challenge_research",
  },
  {
    id: "competitive_pressure",
    name: "Competitive Pressure",
    stage: 2,
    color: 0x8b5cf6,   // Purple
    description: "Strong existing competitors",
    texture: "challenge_competition",
  },
  {
    id: "validation_failure",
    name: "Validation Failure",
    stage: 3,
    color: 0x06b6d4,   // Cyan
    description: "Assumptions not validated",
    texture: "challenge_validation",
  },
  {
    id: "design_complexity",
    name: "Design Complexity",
    stage: 4,
    color: 0xf59e0b,   // Amber
    description: "Overly complex user experience",
    texture: "challenge_design",
  },
  {
    id: "technical_debt",
    name: "Technical Debt",
    stage: 5,
    color: 0x3b82f6,   // Blue
    description: "Accumulating code issues",
    texture: "challenge_technical",
  },
  {
    id: "user_acquisition",
    name: "User Acquisition Challenge",
    stage: 6,
    color: 0xef4444,   // Red
    description: "Difficulty finding customers",
    texture: "challenge_acquisition",
  },
  {
    id: "retention_issue",
    name: "Retention Issue",
    stage: 7,
    color: 0x06b6d4,   // Cyan
    description: "Users not sticking around",
    texture: "challenge_retention",
  },
  {
    id: "funding_gap",
    name: "Funding Gap",
    stage: 8,
    color: 0xfbbf24,   // Gold
    description: "Insufficient capital to scale",
    texture: "challenge_funding",
  },
];

/**
 * Milestone definitions — Stage 1 (Ideation, 4 CPs) & Stage 2 (Research, 5 CPs)
 * Sourced from checkpoint_tasks_v3.xlsx Venture sheet.
 */
export const MILESTONE_DEFINITIONS: Record<string, { title: string; objectives: string[] }> = {
  // ── Stage 1: Ideation (4 checkpoints) ─────────────────────────────────────
  "1_1": {
    title: "Problem Identified",
    objectives: [
      "Write a clear problem statement — who, when, and what it costs",
      "Map the problem space on canvas without proposing a solution",
      "Find three real-world examples of the problem with evidence",
    ],
  },
  "1_2": {
    title: "Problem Owner Defined",
    objectives: [
      "Write a target customer profile with context and pain moments",
      "Build a persona card (name, role, frustrations, workarounds)",
      "Run a short survey with at least three real target-profile people",
    ],
  },
  "1_3": {
    title: "Solution Concept Formed",
    objectives: [
      "Describe the solution in 2-3 sentences (what it does, not how)",
      "Sketch core experience on canvas from the customer's view",
      "Poll target audience on two or three solution directions",
    ],
  },
  "1_4": {
    title: "Idea Worth Pursuing",
    objectives: [
      "Write an honest case for and against — 3 reasons for, 2 against",
      "Build a comparison table of at least two existing alternatives",
      "Write a one-page 3-year vision connected to problem and customer",
    ],
  },

  // ── Stage 2: Research (5 checkpoints) ──────────────────────────────────────
  "2_1": {
    title: "Market Landscape Mapped",
    objectives: [
      "Write a market summary — size, players, growth direction",
      "Build a market overview table with size, growth rate, and sources",
      "Link two credible industry reports with confirmation notes",
    ],
  },
  "2_2": {
    title: "Competitors and Alternatives Analysed",
    objectives: [
      "List at least four direct or indirect competitors",
      "Build a competitor comparison table (offer, target, price, gaps)",
      "Map competitive landscape on canvas by two customer-relevant axes",
    ],
  },
  "2_3": {
    title: "Target Customer Understood Deeply",
    objectives: [
      "Write a day-in-the-life description of the target customer",
      "Design and run a short survey; document key themes from 5+ responses",
      "Conduct three real customer conversations and upload summaries",
    ],
  },
  "2_4": {
    title: "Trends and Timing Assessed",
    objectives: [
      "Identify two or more trends making the problem acute or solvable now",
      "Build a trends table (trend, relevance, helps/hurts, source)",
      "Link a comparable venture and extract a timing lesson",
    ],
  },
  "2_5": {
    title: "Research Synthesised",
    objectives: [
      "Write a one-page research summary across market, competition, customer, timing",
      "Build a SWOT table grounded in research findings",
      "Map research findings on canvas showing how they connect",
    ],
  },
};
