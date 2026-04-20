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
    name: "IDEATION",
    biomeName: "Ideation Hub",
    subtitle: "Stage 1 · Brainstorm & Validate Ideas",
    x: 200,
    y: 250,
    width: 600,
    height: 450,
    biomeType: "ideation",
    checkpoints: 4,
    challenges: ["Market Research", "Problem Definition", "Solution Fit"],
    milestones: [
      "Define Problem Statement",
      "Identify Target Market",
      "Sketch Initial Solution",
      "Validate Core Assumption"
    ],
    pathColor: 0x6366F1, // Interactive Ideas primary indigo
    visualElements: ["lightbulbs", "sketches", "notes"],
    icon: "💡",
  },
  {
    id: 2,
    name: "RESEARCH",
    biomeName: "Research Lab",
    subtitle: "Stage 2 · Data Analysis & Market Insights",
    x: 900,
    y: 200,
    width: 650,
    height: 500,
    biomeType: "research",
    checkpoints: 5,
    challenges: ["Competitive Analysis", "User Research", "Market Sizing"],
    milestones: [
      "Complete Market Analysis",
      "Interview 20 Potential Users",
      "Map Competitive Landscape",
      "Calculate TAM/SAM/SOM",
      "Document Key Insights"
    ],
    pathColor: 0x10B981,
    visualElements: ["charts", "graphs", "data"],
    icon: "📊",
  },
  {
    id: 3,
    name: "VALIDATION",
    biomeName: "Validation Center",
    subtitle: "Stage 3 · Test Assumptions & Get Feedback",
    x: 1650,
    y: 300,
    width: 550,
    height: 450,
    biomeType: "validation",
    checkpoints: 4,
    challenges: ["User Testing", "Feedback Loop", "Pivot Decision"],
    milestones: [
      "Run User Tests",
      "Collect Feedback",
      "Validate Core Features",
      "Confirm Product-Market Fit"
    ],
    pathColor: 0x8B5CF6,
    visualElements: ["checkmarks", "feedback", "tests"],
    icon: "✓",
  },
  {
    id: 4,
    name: "OFFER DESIGN",
    biomeName: "Product Studio",
    subtitle: "Stage 4 · Design & Prototype",
    x: 2300,
    y: 150,
    width: 650,
    height: 500,
    biomeType: "design",
    checkpoints: 5,
    challenges: ["UX Design", "Feature Prioritization", "Prototype Testing"],
    milestones: [
      "Create Wireframes",
      "Design User Flows",
      "Build Interactive Prototype",
      "Conduct Usability Tests",
      "Finalize Design System"
    ],
    pathColor: 0xF59E0B,
    visualElements: ["designs", "prototypes", "mockups"],
    icon: "🎨",
  },
  {
    id: 5,
    name: "BUILD & DELIVER",
    biomeName: "Development Zone",
    subtitle: "Stage 5 · Code, Build & Deploy",
    x: 3050,
    y: 250,
    width: 700,
    height: 550,
    biomeType: "development",
    checkpoints: 6,
    challenges: ["Technical Debt", "Infrastructure", "Quality Assurance"],
    milestones: [
      "Set Up Development Environment",
      "Build Core Features",
      "Implement Testing Suite",
      "Deploy to Staging",
      "Security Audit",
      "Production Ready"
    ],
    pathColor: 0x3B82F6,
    visualElements: ["code", "servers", "pipelines"],
    icon: "⚙️",
  },
  {
    id: 6,
    name: "LAUNCH",
    biomeName: "Launch Pad",
    subtitle: "Stage 6 · Go Live & Acquire Users",
    x: 3850,
    y: 200,
    width: 550,
    height: 450,
    biomeType: "launch",
    checkpoints: 3,
    challenges: ["User Acquisition", "Marketing", "First Customers"],
    milestones: [
      "Launch Marketing Campaign",
      "Acquire First 100 Users",
      "Monitor System Performance"
    ],
    pathColor: 0xEF4444,
    visualElements: ["rockets", "growth", "users"],
    icon: "🚀",
  },
  {
    id: 7,
    name: "ITERATION",
    biomeName: "Growth Engine",
    subtitle: "Stage 7 · Optimize & Scale",
    x: 4500,
    y: 100,
    width: 600,
    height: 500,
    biomeType: "growth",
    checkpoints: 4,
    challenges: ["Retention", "Conversion", "Optimization"],
    milestones: [
      "Implement Analytics",
      "Run A/B Tests",
      "Optimize Conversion Funnel",
      "Improve Key Metrics"
    ],
    pathColor: 0x06B6D4,
    visualElements: ["metrics", "graphs", "optimization"],
    icon: "📈",
  },
  {
    id: 8,
    name: "SCALE",
    biomeName: "Unicorn Valley",
    subtitle: "Stage 8 · Fundraise & Expand",
    x: 5200,
    y: 200,
    width: 700,
    height: 500,
    biomeType: "scale",
    checkpoints: 5,
    challenges: ["Fundraising", "Team Building", "Market Expansion"],
    milestones: [
      "Prepare Pitch Deck",
      "Meet with Investors",
      "Close Funding Round",
      "Expand Team",
      "Enter New Markets"
    ],
    pathColor: 0xFBBF24,
    visualElements: ["funding", "growth", "success"],
    icon: "🏆",
  },
];

/**
 * Get biome configuration by stage number
 */
export function getBiomeForStage(stage: number): VentureBiome | undefined {
  return VENTURE_BIOMES.find(b => b.id === stage);
}

/**
 * Get total map width (for camera bounds)
 */
export function getTotalMapWidth(): number {
  const lastBiome = VENTURE_BIOMES[VENTURE_BIOMES.length - 1];
  return lastBiome.x + lastBiome.width + 200; // Add padding
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
    color: 0x6366F1,
    description: "Insufficient market understanding",
    texture: "challenge_research",
  },
  {
    id: "competitive_pressure",
    name: "Competitive Pressure",
    stage: 2,
    color: 0x10B981,
    description: "Strong existing competitors",
    texture: "challenge_competition",
  },
  {
    id: "validation_failure",
    name: "Validation Failure",
    stage: 3,
    color: 0x8B5CF6,
    description: "Assumptions not validated",
    texture: "challenge_validation",
  },
  {
    id: "design_complexity",
    name: "Design Complexity",
    stage: 4,
    color: 0xF59E0B,
    description: "Overly complex user experience",
    texture: "challenge_design",
  },
  {
    id: "technical_debt",
    name: "Technical Debt",
    stage: 5,
    color: 0x3B82F6,
    description: "Accumulating code issues",
    texture: "challenge_technical",
  },
  {
    id: "user_acquisition",
    name: "User Acquisition Challenge",
    stage: 6,
    color: 0xEF4444,
    description: "Difficulty finding customers",
    texture: "challenge_acquisition",
  },
  {
    id: "retention_issue",
    name: "Retention Issue",
    stage: 7,
    color: 0x06B6D4,
    description: "Users not sticking around",
    texture: "challenge_retention",
  },
  {
    id: "funding_gap",
    name: "Funding Gap",
    stage: 8,
    color: 0xFBBF24,
    description: "Insufficient capital to scale",
    texture: "challenge_funding",
  },
];

/**
 * Milestone definitions for each checkpoint
 */
export const MILESTONE_DEFINITIONS: Record<string, {
  title: string;
  objectives: string[];
}> = {
  // Stage 1: Ideation Hub
  "1_1": {
    title: "Define Problem Statement",
    objectives: [
      "Identify a clear problem worth solving",
      "Research existing pain points",
      "Validate problem significance"
    ]
  },
  "1_2": {
    title: "Identify Target Market",
    objectives: [
      "Define ideal customer profile",
      "Segment potential users",
      "Estimate market size"
    ]
  },
  "1_3": {
    title: "Sketch Initial Solution",
    objectives: [
      "Brainstorm solution approaches",
      "Create concept sketches",
      "Outline core features"
    ]
  },
  "1_4": {
    title: "Validate Core Assumption",
    objectives: [
      "Test key hypothesis",
      "Gather initial feedback",
      "Refine value proposition"
    ]
  },
  
  // Stage 2: Research Lab
  "2_1": {
    title: "Complete Market Analysis",
    objectives: [
      "Research industry trends",
      "Analyze market dynamics",
      "Document findings"
    ]
  },
  "2_2": {
    title: "Interview Potential Users",
    objectives: [
      "Conduct 20 user interviews",
      "Document pain points",
      "Identify patterns"
    ]
  },
  "2_3": {
    title: "Map Competitive Landscape",
    objectives: [
      "Identify direct competitors",
      "Analyze indirect alternatives",
      "Find differentiation opportunities"
    ]
  },
  "2_4": {
    title: "Calculate Market Size",
    objectives: [
      "Estimate TAM (Total Addressable Market)",
      "Calculate SAM (Serviceable Available Market)",
      "Define SOM (Serviceable Obtainable Market)"
    ]
  },
  "2_5": {
    title: "Document Key Insights",
    objectives: [
      "Synthesize research findings",
      "Create insight report",
      "Share with stakeholders"
    ]
  },
  
  // Stage 3: Validation Center
  "3_1": {
    title: "Run User Tests",
    objectives: [
      "Design test scenarios",
      "Recruit test participants",
      "Execute testing sessions"
    ]
  },
  "3_2": {
    title: "Collect Feedback",
    objectives: [
      "Gather qualitative feedback",
      "Measure quantitative metrics",
      "Identify improvement areas"
    ]
  },
  "3_3": {
    title: "Validate Core Features",
    objectives: [
      "Test feature usability",
      "Measure feature value",
      "Prioritize feature set"
    ]
  },
  "3_4": {
    title: "Confirm Product-Market Fit",
    objectives: [
      "Measure user satisfaction",
      "Assess willingness to pay",
      "Validate retention potential"
    ]
  },
  
  // Continue for remaining stages...
};
