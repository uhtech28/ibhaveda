/**
 * creativeConstants.ts
 *
 * Creative template — stage, checkpoint, and task definitions.
 *
 * 6 stages, 23 total checkpoints.
 * Quality Metric: Fan Score (always increases, higher is better)
 */

// ─────────────────────────────────────────────────────────────────────────────
// STAGES
// ─────────────────────────────────────────────────────────────────────────────

export const CREATIVE_STAGES = [
  { id: 1, name: "Concept & Inspiration",    checkpoints: 3, biomeName: "Sacred Grove"        },
  { id: 2, name: "References & Influences",   checkpoints: 4, biomeName: "Gallery of Echoes"   },
  { id: 3, name: "Drafting & Creation",       checkpoints: 5, biomeName: "The Wilderness"      },
  { id: 4, name: "Feedback & Critique",       checkpoints: 4, biomeName: "Village Square"      },
  { id: 5, name: "Refinement & Polish",       checkpoints: 4, biomeName: "Artisan's Workshop"  },
  { id: 6, name: "Release & Sharing",         checkpoints: 3, biomeName: "Harbour"             },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// CHECKPOINT DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

import type { ToolType } from "../ventureConstants";

interface CreativeCheckpointDef {
  stage: number;
  checkpoint: number;
  name: string;
  outcome: string;
  t1: { prompt: string; tool: ToolType };
  t2: { prompt: string; tool: ToolType };
  t3: { prompt: string; tool: ToolType };
}

export const CREATIVE_CHECKPOINT_DEFINITIONS: CreativeCheckpointDef[] = [

  // ── Stage 1: Concept & Inspiration (Sacred Grove) ─────────────────────────

  {
    stage: 1, checkpoint: 1,
    name: "Creative impulse captured",
    outcome: "The initial creative idea is documented before it fades",
    t1: { prompt: "Write down your creative concept right now — what you want to make, the feeling you want it to create, and who it is for. Don't edit, just capture.", tool: "write" },
    t2: { prompt: "Build a concept brief — medium, target audience, core emotion or experience, and one sentence describing what makes it yours rather than someone else's.", tool: "table" },
    t3: { prompt: "Create a quick poll — show your concept to five people in your creative community and ask if it resonates. Document the responses.", tool: "poll" },
  },
  {
    stage: 1, checkpoint: 2,
    name: "Creative problem defined",
    outcome: "The artistic or creative challenge at the centre of the project is articulated",
    t1: { prompt: "Articulate the creative problem — what question is this work trying to answer? What tension is it exploring? What do you want the audience to feel or think that they don't currently?", tool: "write" },
    t2: { prompt: "Map the creative territory — what adjacent works, styles, or traditions is your project in conversation with? Where does it depart from them?", tool: "map" },
    t3: { prompt: "Find and link three existing works that are adjacent to yours — explain for each how your project differs from or builds on them.", tool: "link" },
  },
  {
    stage: 1, checkpoint: 3,
    name: "Vision statement written",
    outcome: "A clear statement of what the completed work will achieve exists",
    t1: { prompt: "Write a vision statement for the completed project — in one paragraph, describe what you will have made, how it will feel to experience it, and what it will mean to its audience.", tool: "write" },
    t2: { prompt: "Build a success criteria table — what would make this project a creative success (independent of commercial outcome)? List five criteria.", tool: "table" },
    t3: { prompt: "Share your vision with two or three people you trust creatively and ask if it's clear and compelling. Document their honest feedback.", tool: "survey" },
  },

  // ── Stage 2: References & Influences (Gallery of Echoes) ─────────────────

  {
    stage: 2, checkpoint: 1,
    name: "Influences mapped",
    outcome: "The creative works and artists that have shaped this project are documented",
    t1: { prompt: "Write a description of your three most important creative influences for this project — what each taught you and how it shows up in what you're making.", tool: "write" },
    t2: { prompt: "Build a reference map table — for each influence: who or what it is, what specifically you are drawing from it, and how you plan to transform it into something your own.", tool: "table" },
    t3: { prompt: "Link or upload examples of your key references — the actual works that are influencing you.", tool: "link" },
  },
  {
    stage: 2, checkpoint: 2,
    name: "Style and aesthetic defined",
    outcome: "The visual, sonic, narrative, or craft approach is documented and distinct",
    t1: { prompt: "Describe your aesthetic approach — the style, mood, texture, or tone you are aiming for, and how it differs from your references.", tool: "write" },
    t2: { prompt: "Build a moodboard description table — each element of your aesthetic direction: color palette, texture, tempo, imagery type, and what each communicates.", tool: "table" },
    t3: { prompt: "Upload a moodboard — visual collage, audio references, or descriptive document showing your aesthetic direction.", tool: "upload" },
  },
  {
    stage: 2, checkpoint: 3,
    name: "Audience profile created",
    outcome: "The intended audience is documented with enough specificity to guide creative decisions",
    t1: { prompt: "Write a profile of your intended audience — not a demographic bracket but a specific person: who they are, what they already love, and why this work is for them.", tool: "write" },
    t2: { prompt: "Build an audience needs table — what this audience currently lacks, what they are looking for, and how your project addresses that need.", tool: "table" },
    t3: { prompt: "Find three people who fit your audience profile and interview them briefly about what creative work they love and why. Document what you learned.", tool: "survey" },
  },
  {
    stage: 2, checkpoint: 4,
    name: "Production plan created",
    outcome: "A realistic plan for how the work will be made — with timeline and resources — exists",
    t1: { prompt: "Write a production plan — what you will make, in what order, using what resources, over what timeline. Include dependencies and potential blockers.", tool: "write" },
    t2: { prompt: "Build a production schedule table — each phase, key deliverables, deadline, and what is needed to complete it.", tool: "table" },
    t3: { prompt: "Map the production process — show the flow from brief through creation to release, with the major decision points and dependencies visible.", tool: "map" },
  },

  // ── Stage 3: Drafting & Creation (The Wilderness) ─────────────────────────

  {
    stage: 3, checkpoint: 1,
    name: "First draft / prototype created",
    outcome: "A rough, complete first version of the work exists",
    t1: { prompt: "Describe your first draft or prototype — what you made, how long it took, and your honest assessment of where it succeeds and where it falls short.", tool: "write" },
    t2: { prompt: "Upload your first draft or prototype — the actual creative work in its earliest complete form.", tool: "upload" },
    t3: { prompt: "List the ten most important things you want to improve before the next version — ranked by their impact on the overall work.", tool: "write" },
  },
  {
    stage: 3, checkpoint: 2,
    name: "Core creative challenge solved",
    outcome: "The hardest or most essential creative problem in the work is resolved",
    t1: { prompt: "Describe the core creative challenge you faced in making this — the thing you weren't sure how to solve — and explain how you resolved it.", tool: "write" },
    t2: { prompt: "Build a problem-solution table — the three hardest creative problems, how you tried to solve each, and whether the solution worked.", tool: "table" },
    t3: { prompt: "Upload evidence of the solved challenge — the specific passage, section, or piece of work where the problem became the solution.", tool: "upload" },
  },
  {
    stage: 3, checkpoint: 3,
    name: "Second draft / iteration complete",
    outcome: "A substantially improved version of the work exists",
    t1: { prompt: "Write a change log for the second draft — what specifically changed from Draft 1 and why each change makes the work stronger.", tool: "write" },
    t2: { prompt: "Build a draft comparison table — key elements in Draft 1 vs. Draft 2, and how each changed.", tool: "table" },
    t3: { prompt: "Upload Draft 2 of your work — the improved version.", tool: "upload" },
  },
  {
    stage: 3, checkpoint: 4,
    name: "Work structurally sound",
    outcome: "The overall architecture or structure of the work is coherent and effective",
    t1: { prompt: "Write a structural analysis of your work — how it is organised, why that organisation serves the creative intention, and where any structural weaknesses remain.", tool: "write" },
    t2: { prompt: "Build a structure map table — each major section or element, its purpose, its relationship to what comes before and after, and its current strength.", tool: "table" },
    t3: { prompt: "Map the full structure of your work — show its architecture visually, with the emotional or narrative arc visible.", tool: "map" },
  },
  {
    stage: 3, checkpoint: 5,
    name: "Complete working draft exists",
    outcome: "A full, end-to-end version of the work is ready for external feedback",
    t1: { prompt: "Write a working draft statement — confirm the work is complete enough to show others, and describe any parts that are deliberately left rough for now.", tool: "write" },
    t2: { prompt: "Build a readiness checklist table — each section or component, its completion status, and what would need to happen for it to be ready for public release.", tool: "table" },
    t3: { prompt: "Upload the complete working draft — everything needed for a reviewer to experience the whole work.", tool: "upload" },
  },

  // ── Stage 4: Feedback & Critique (Village Square) ─────────────────────────

  {
    stage: 4, checkpoint: 1,
    name: "Critique session held",
    outcome: "Real, honest feedback from qualified reviewers is obtained",
    t1: { prompt: "Document who reviewed your work, in what format (live session, written feedback, viewing), and the key themes in their responses.", tool: "write" },
    t2: { prompt: "Build a critique log table — each reviewer, their background or relationship to your work, the main feedback points, and your immediate reaction.", tool: "table" },
    t3: { prompt: "Upload the critique notes, recording, or written feedback — the raw input from your reviewers.", tool: "upload" },
  },
  {
    stage: 4, checkpoint: 2,
    name: "Feedback patterns identified",
    outcome: "Recurring themes and priority areas from the feedback are synthesised",
    t1: { prompt: "Write a feedback synthesis — what patterns emerged across reviewers, which feedback was most consistent, and which feedback was most surprising.", tool: "write" },
    t2: { prompt: "Build a feedback pattern table — each recurring theme, how many reviewers raised it, and your assessment of whether it represents a real problem with the work.", tool: "table" },
    t3: { prompt: "Map the feedback — show which areas of the work attracted the most positive and most critical responses.", tool: "map" },
  },
  {
    stage: 4, checkpoint: 3,
    name: "Critique responded to",
    outcome: "A decision has been made on each piece of feedback — what to change and what to keep",
    t1: { prompt: "Write a response to critique — address each major feedback theme, explaining what you will change, what you will keep, and why.", tool: "write" },
    t2: { prompt: "Build a feedback decision table — each significant piece of feedback, your decision (accept/reject/modify), and the reasoning.", tool: "table" },
    t3: { prompt: "Create a short survey and check your reasoning with at least one reviewer — did your decisions make sense to them? Document their response.", tool: "survey" },
  },
  {
    stage: 4, checkpoint: 4,
    name: "Audience test conducted",
    outcome: "The work has been experienced by someone from the intended audience and their response documented",
    t1: { prompt: "Document the audience test — who experienced your work, how, what their unprompted reaction was, and what it tells you about how the work is landing.", tool: "write" },
    t2: { prompt: "Build an audience response table — each tester, their first reaction, specific moments they responded to, and any unexpected responses.", tool: "table" },
    t3: { prompt: "Upload the audience response data — recorded reactions, written notes, or survey results from your audience test.", tool: "upload" },
  },

  // ── Stage 5: Refinement & Polish (Artisan's Workshop) ────────────────────

  {
    stage: 5, checkpoint: 1,
    name: "Revisions executed",
    outcome: "All planned revisions from the feedback stage are made",
    t1: { prompt: "Write a revision report — what changed in the revised version, compared to the draft that went into the critique stage.", tool: "write" },
    t2: { prompt: "Build a revision tracking table — each planned revision, whether it was implemented, and the specific result in the work.", tool: "table" },
    t3: { prompt: "Upload the revised version — the creative work after implementing critique-driven changes.", tool: "upload" },
  },
  {
    stage: 5, checkpoint: 2,
    name: "Technical quality achieved",
    outcome: "The craft elements of the work meet the technical standards appropriate to the medium",
    t1: { prompt: "Write a technical quality assessment — evaluate the work against the craft standards of your medium (e.g., audio mix quality, image resolution, prose clarity, code performance).", tool: "write" },
    t2: { prompt: "Build a technical checklist table — each technical criterion for your medium, the current state, and what is needed to reach the standard.", tool: "table" },
    t3: { prompt: "Upload evidence of technical quality checks — export settings, mastering reports, accessibility audit, or format validation.", tool: "upload" },
  },
  {
    stage: 5, checkpoint: 3,
    name: "Final touches applied",
    outcome: "The work is in its definitive state — nothing more added, nothing essential missing",
    t1: { prompt: "Write a finalization statement — confirm the work is done, describe what the final polish involved, and state clearly that it is ready for release.", tool: "write" },
    t2: { prompt: "Build a final review checklist — every element of the work reviewed one last time, with a pass/fail confirmation.", tool: "table" },
    t3: { prompt: "Upload the final, release-ready version of the work — the definitive file, document, or artefact.", tool: "upload" },
  },
  {
    stage: 5, checkpoint: 4,
    name: "Release package prepared",
    outcome: "Everything needed to share the work publicly is assembled",
    t1: { prompt: "Write a release brief — what you will release, where, when, and what you want the release to achieve.", tool: "write" },
    t2: { prompt: "Build a release package checklist — final work file, description text, promotional image or trailer, platform-specific formats — confirming each is ready.", tool: "table" },
    t3: { prompt: "Upload your complete release package — everything needed to publish the work across your chosen platforms.", tool: "upload" },
  },

  // ── Stage 6: Release & Sharing (Harbour) ─────────────────────────────────

  {
    stage: 6, checkpoint: 1,
    name: "Work published",
    outcome: "The creative work is publicly accessible to its intended audience",
    t1: { prompt: "Confirm the work is published — where, when, and how it can be accessed. Include the direct link.", tool: "write" },
    t2: { prompt: "Build a publication log table — each platform where the work is published, the date, the direct link, and the initial visibility settings.", tool: "table" },
    t3: { prompt: "Link to the published work — the live, publicly accessible version.", tool: "link" },
  },
  {
    stage: 6, checkpoint: 2,
    name: "Audience reached",
    outcome: "The work has been seen, heard, or experienced by real people and initial data exists",
    t1: { prompt: "Write a first-week report — how many people have experienced the work, where they came from, and what the early data shows about engagement.", tool: "write" },
    t2: { prompt: "Build an audience reach table — each channel, the number of people reached, engagement metric (plays, views, reads, shares), and the most common initial response.", tool: "table" },
    t3: { prompt: "Upload a screenshot of your analytics — showing real audience data from the first week after release.", tool: "upload" },
  },
  {
    stage: 6, checkpoint: 3,
    name: "Reception documented",
    outcome: "The audience's response to the work — including criticism — is recorded and reflected on",
    t1: { prompt: "Write a reception reflection — what the audience response has taught you about the work, what landed as intended, and what surprised you.", tool: "write" },
    t2: { prompt: "Build a reception log table — each significant piece of feedback (positive or negative), where it came from, and what it reveals.", tool: "table" },
    t3: { prompt: "Link or upload audience responses — reviews, comments, ratings, or messages that represent the reception of the work.", tool: "link" },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// FAN SCORE CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

/** Fan score tiers (higher is better) */
export const CREATIVE_FAN_SCORE_TIERS = {
  low: { min: 0, max: 100, label: "Emerging", displayScore: 50 },
  standard: { min: 100, max: 1000, label: "Growing", displayScore: 500 },
  high: { min: 1000, max: Infinity, label: "Resonating", displayScore: 5000 },
} as const;

/** Maps quality tier to Fan Score delta */
export const CREATIVE_FAN_SCORE_MAP = {
  low: 10,
  standard: 100,
  high: 500,
} as const;

/** Total creative checkpoints */
export const CREATIVE_TOTAL_CHECKPOINTS = 23; // 3+4+5+4+4+3
