/**
 * academicConstants.ts
 *
 * Academic template — stage, checkpoint, and task definitions.
 * Mirrors the structure of ventureConstants.ts (CHECKPOINT_DEFINITIONS).
 *
 * 6 stages, 25 total checkpoints.
 * Each checkpoint has T1/T2/T3 tasks.
 *
 * Quality Metric: JIF Score (always increases, higher is better)
 */

// ─────────────────────────────────────────────────────────────────────────────
// STAGES
// ─────────────────────────────────────────────────────────────────────────────

export const ACADEMIC_STAGES = [
  { id: 1, name: "Topic & Question",         checkpoints: 4, biomeName: "Ancient Library"     },
  { id: 2, name: "Literature Review",         checkpoints: 5, biomeName: "The Ruins"           },
  { id: 3, name: "Methodology",               checkpoints: 4, biomeName: "Cartographer's Tower" },
  { id: 4, name: "Writing & Drafting",        checkpoints: 5, biomeName: "The Scriptorium"     },
  { id: 5, name: "Review & Revision",         checkpoints: 4, biomeName: "Council Chamber"     },
  { id: 6, name: "Submission & Publication",  checkpoints: 3, biomeName: "Grand Archive"       },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// CHECKPOINT DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

import type { ToolType } from "../ventureConstants";

interface AcademicCheckpointDef {
  stage: number;
  checkpoint: number;
  name: string;
  outcome: string;
  t1: { prompt: string; tool: ToolType };
  t2: { prompt: string; tool: ToolType };
  t3: { prompt: string; tool: ToolType };
}

export const ACADEMIC_CHECKPOINT_DEFINITIONS: AcademicCheckpointDef[] = [

  // ── Stage 1: Topic & Question (Ancient Library) ───────────────────────────

  {
    stage: 1, checkpoint: 1,
    name: "Research area identified",
    outcome: "A specific academic field and area of inquiry is chosen and justified",
    t1: { prompt: "Describe the research area you're entering — the broad field, why it matters, and where the current frontier of knowledge sits.", tool: "write" },
    t2: { prompt: "Map the research area — show the major sub-fields, key research groups, and where debates are most active.", tool: "map" },
    t3: { prompt: "Link two landmark papers in your chosen area and write a sentence explaining why each is foundational.", tool: "link" },
  },
  {
    stage: 1, checkpoint: 2,
    name: "Research gap identified",
    outcome: "An unanswered question or unresolved debate in the literature is documented",
    t1: { prompt: "Describe the gap you've identified — what question remains unanswered, what debate remains unresolved, and how you know the gap exists.", tool: "write" },
    t2: { prompt: "Build a gap analysis table — what exists in the literature, what is missing, and what your research could contribute.", tool: "table" },
    t3: { prompt: "Link a paper that explicitly notes the gap you've identified — confirm it exists in the peer-reviewed record.", tool: "link" },
  },
  {
    stage: 1, checkpoint: 3,
    name: "Research question formulated",
    outcome: "A clear, answerable, and bounded research question is written",
    t1: { prompt: "Write your research question. It must be specific (not general), answerable (within your resources), and bounded (scoped to a manageable study).", tool: "write" },
    t2: { prompt: "Build a question evaluation table — rate your question on specificity, answerability, scope, and significance.", tool: "table" },
    t3: { prompt: "Create a short survey asking 3–5 subject-matter experts or peers whether your question is meaningful and novel. Document their responses.", tool: "survey" },
  },
  {
    stage: 1, checkpoint: 4,
    name: "Research objectives set",
    outcome: "Three to five specific, measurable objectives aligned to the research question are documented",
    t1: { prompt: "Write three to five research objectives — what specifically you will investigate, produce, or test in order to answer your question.", tool: "write" },
    t2: { prompt: "Build a SMART objectives table — for each objective, confirm it is Specific, Measurable, Achievable, Relevant, and Time-bound.", tool: "table" },
    t3: { prompt: "Map how each objective connects to the research question — show the logical chain from gap to question to each objective.", tool: "map" },
  },

  // ── Stage 2: Literature Review (The Ruins) ────────────────────────────────

  {
    stage: 2, checkpoint: 1,
    name: "Search strategy executed",
    outcome: "A systematic search of the literature is documented and repeatable",
    t1: { prompt: "Document your search strategy — which databases you searched, which keywords you used, how many results each combination returned, and how you filtered to relevant papers.", tool: "write" },
    t2: { prompt: "Build a search log table — database, keyword string, date searched, results count, papers selected after filtering.", tool: "table" },
    t3: { prompt: "Link your search results export from at least one academic database (e.g., SCOPUS, Web of Science, Google Scholar CSV).", tool: "link" },
  },
  {
    stage: 2, checkpoint: 2,
    name: "Key papers synthesised",
    outcome: "The most important papers are read, summarised, and their contributions understood",
    t1: { prompt: "Write a synthesis of the ten most important papers in your area — not a list of summaries but a coherent account of what the field currently knows.", tool: "write" },
    t2: { prompt: "Build a paper summary table — for each key paper: author, year, method, finding, relevance to your question.", tool: "table" },
    t3: { prompt: "Map the key papers by theme — show how different papers cluster around sub-topics and how they relate to each other.", tool: "map" },
  },
  {
    stage: 2, checkpoint: 3,
    name: "Theoretical framework identified",
    outcome: "The theoretical or conceptual lens through which the research will be interpreted is documented",
    t1: { prompt: "Write a description of the theoretical framework you will use — what it is, where it comes from, and why it is appropriate for your research question.", tool: "write" },
    t2: { prompt: "Build a framework comparison table — list at least two competing frameworks and explain why you chose yours over the alternatives.", tool: "table" },
    t3: { prompt: "Link the original source paper or book chapter for your theoretical framework — confirm it is a recognised academic foundation.", tool: "link" },
  },
  {
    stage: 2, checkpoint: 4,
    name: "Debates and controversies mapped",
    outcome: "The main disagreements in the field are understood and documented",
    t1: { prompt: "Describe the two or three main debates or controversies in your research area — who holds each position and what evidence supports each side.", tool: "write" },
    t2: { prompt: "Build a debate table — each controversy, the main positions, key proponents, supporting evidence, and the current state of the debate.", tool: "table" },
    t3: { prompt: "Map the debate — show where your research sits in relation to the existing positions (supporting, challenging, or bridging them).", tool: "map" },
  },
  {
    stage: 2, checkpoint: 5,
    name: "Literature review written",
    outcome: "A coherent, critically evaluated narrative of the field is produced",
    t1: { prompt: "Write a structured literature review — organise by theme, not by paper. Show how knowledge has developed, where debates lie, and where your work will contribute.", tool: "write" },
    t2: { prompt: "Upload your literature review draft as a document — formatted with proper academic citations.", tool: "upload" },
    t3: { prompt: "Create a short survey and ask a peer or supervisor to review your draft — document their feedback on coverage, clarity, and criticality.", tool: "survey" },
  },

  // ── Stage 3: Methodology (Cartographer's Tower) ───────────────────────────

  {
    stage: 3, checkpoint: 1,
    name: "Research paradigm selected",
    outcome: "The epistemological and ontological foundations of the study are stated and justified",
    t1: { prompt: "Write a justification of your research paradigm — qualitative, quantitative, or mixed methods — and explain how it aligns with your research question and the nature of what you're studying.", tool: "write" },
    t2: { prompt: "Build a paradigm comparison table — qualitative vs. quantitative vs. mixed: strengths, weaknesses, and why yours fits your question.", tool: "table" },
    t3: { prompt: "Link a methodology textbook chapter or foundational paper that supports your chosen paradigm.", tool: "link" },
  },
  {
    stage: 3, checkpoint: 2,
    name: "Research design decided",
    outcome: "The overall design (experiment, survey, case study, ethnography, etc.) is documented and justified",
    t1: { prompt: "Describe your research design — what it is, how it works, and why it is the most appropriate design for answering your specific research question.", tool: "write" },
    t2: { prompt: "Build a design evaluation table — your chosen design vs. two alternatives: why yours is more appropriate given your question, resources, and context.", tool: "table" },
    t3: { prompt: "Map your research design — show how the design connects your question, data collection method, analysis approach, and intended output.", tool: "map" },
  },
  {
    stage: 3, checkpoint: 3,
    name: "Data collection method specified",
    outcome: "Who, what, where, when, and how data will be collected is documented in full",
    t1: { prompt: "Write a complete data collection protocol — sampling strategy, recruitment approach, data sources, instruments, and procedures.", tool: "write" },
    t2: { prompt: "Build a data collection plan table — each data type, collection method, target sample size, timeline, and potential obstacles.", tool: "table" },
    t3: { prompt: "Upload your data collection instrument — your interview guide, survey questionnaire, observation protocol, or data extraction sheet.", tool: "upload" },
  },
  {
    stage: 3, checkpoint: 4,
    name: "Ethics and validity addressed",
    outcome: "Ethical considerations and validity/reliability strategies are documented",
    t1: { prompt: "Write an ethics statement — how you will protect participants, obtain informed consent, store data securely, and comply with relevant regulations.", tool: "write" },
    t2: { prompt: "Build a validity/reliability table — potential threats to each, and the specific strategies in your design that address them.", tool: "table" },
    t3: { prompt: "Upload your ethics approval form, institutional consent, or if not required, a signed declaration that no ethics approval is needed and why.", tool: "upload" },
  },

  // ── Stage 4: Writing & Drafting (The Scriptorium) ────────────────────────

  {
    stage: 4, checkpoint: 1,
    name: "Data collected",
    outcome: "All planned data collection is complete and the dataset is ready for analysis",
    t1: { prompt: "Write a data collection summary — what you collected, how many participants or data points, any deviations from the original plan, and the final dataset description.", tool: "write" },
    t2: { prompt: "Build a dataset overview table — data type, number of records, collection date, any missing data or exclusions.", tool: "table" },
    t3: { prompt: "Upload your raw dataset or a representative sample — clearly labelled and in a format ready for analysis.", tool: "upload" },
  },
  {
    stage: 4, checkpoint: 2,
    name: "Analysis conducted",
    outcome: "The data has been systematically analysed and findings are documented",
    t1: { prompt: "Describe the analysis process — what analytical method you used, how you applied it, and what quality checks you performed.", tool: "write" },
    t2: { prompt: "Build a findings table — each significant finding, the evidence supporting it, and its relevance to your research question.", tool: "table" },
    t3: { prompt: "Upload your analysis outputs — coding summaries, statistical outputs, thematic maps, or model results.", tool: "upload" },
  },
  {
    stage: 4, checkpoint: 3,
    name: "Findings written",
    outcome: "A clear, evidence-grounded account of what the research found is produced",
    t1: { prompt: "Write your findings section — present what you found, organised by theme or research objective, supported by evidence from the data.", tool: "write" },
    t2: { prompt: "Upload your findings chapter draft — formatted with appropriate citations, figures, and tables.", tool: "upload" },
    t3: { prompt: "Map your findings to your research objectives — confirm each objective is addressed by at least one finding.", tool: "map" },
  },
  {
    stage: 4, checkpoint: 4,
    name: "Discussion written",
    outcome: "The findings are interpreted in relation to the literature and the research question",
    t1: { prompt: "Write your discussion — what do your findings mean? How do they relate to existing literature? What do they confirm, challenge, or extend?", tool: "write" },
    t2: { prompt: "Build a discussion table — each finding, its relationship to the literature (confirms / challenges / extends), and the implication.", tool: "table" },
    t3: { prompt: "Upload your discussion chapter draft — formatted with proper academic citations.", tool: "upload" },
  },
  {
    stage: 4, checkpoint: 5,
    name: "Full draft completed",
    outcome: "A complete first draft of the paper or thesis is produced",
    t1: { prompt: "Write your abstract — a 250-word summary of background, question, method, findings, and contribution.", tool: "write" },
    t2: { prompt: "Build a chapter completion checklist — each section, its word count, whether it is complete, and any sections still needing revision.", tool: "table" },
    t3: { prompt: "Upload your full first draft as a single document — including all sections from introduction through conclusions and references.", tool: "upload" },
  },

  // ── Stage 5: Review & Revision (Council Chamber) ─────────────────────────

  {
    stage: 5, checkpoint: 1,
    name: "Peer review received",
    outcome: "External feedback from at least one qualified peer is documented",
    t1: { prompt: "Document who reviewed your work, their qualifications, and the major feedback points they raised.", tool: "write" },
    t2: { prompt: "Build a peer review log table — each reviewer, the sections they reviewed, their main comments, and your initial assessment of each comment.", tool: "table" },
    t3: { prompt: "Upload the actual peer review document or feedback email — the raw reviewer comments.", tool: "upload" },
  },
  {
    stage: 5, checkpoint: 2,
    name: "Revisions made",
    outcome: "All peer review feedback has been considered and addressed",
    t1: { prompt: "Write a response to reviewers — address each comment, explaining what you changed and why, or why you chose not to make a specific change.", tool: "write" },
    t2: { prompt: "Build a revision tracking table — each reviewer comment, your action (accepted/rejected/modified), and where in the document the change appears.", tool: "table" },
    t3: { prompt: "Upload a tracked-changes version of the revised draft — showing what changed between the original and revised versions.", tool: "upload" },
  },
  {
    stage: 5, checkpoint: 3,
    name: "Internal quality check passed",
    outcome: "The paper meets academic writing standards across all key dimensions",
    t1: { prompt: "Write a self-assessment of your paper's quality — academic argumentation, evidence use, clarity of expression, and formatting compliance.", tool: "write" },
    t2: { prompt: "Build a quality checklist table — each academic writing criterion (argumentation, evidence, citations, clarity, formatting) with a pass/fail/needs-improvement rating.", tool: "table" },
    t3: { prompt: "Upload a plagiarism check report — from Turnitin or equivalent — confirming the originality score and any flagged sections.", tool: "upload" },
  },
  {
    stage: 5, checkpoint: 4,
    name: "Final version prepared",
    outcome: "The paper is in its final, submission-ready form",
    t1: { prompt: "Write a submission-readiness statement — confirm that all revisions are complete, all guidelines are met, and the paper is ready to submit.", tool: "write" },
    t2: { prompt: "Build a final submission checklist — each journal/venue requirement, and confirmation that each is satisfied.", tool: "table" },
    t3: { prompt: "Upload the final, clean version of the paper — formatted exactly to target journal or institution specifications.", tool: "upload" },
  },

  // ── Stage 6: Submission & Publication (Grand Archive) ────────────────────

  {
    stage: 6, checkpoint: 1,
    name: "Submission target chosen",
    outcome: "A specific journal, conference, or institution is selected and the submission rationale is documented",
    t1: { prompt: "Write the rationale for your chosen submission target — why this journal or venue, how it aligns with your work, and what its review process is.", tool: "write" },
    t2: { prompt: "Build a venue comparison table — three potential journals/conferences, their impact factor, scope fit, review timeline, and acceptance rates.", tool: "table" },
    t3: { prompt: "Link the journal's or venue's official author guidelines — confirm you have reviewed them.", tool: "link" },
  },
  {
    stage: 6, checkpoint: 2,
    name: "Paper submitted",
    outcome: "The final paper has been formally submitted through the official process",
    t1: { prompt: "Confirm the submission is complete — document the submission date, submission ID or confirmation number, and the journal/venue it was submitted to.", tool: "write" },
    t2: { prompt: "Build a submission record table — paper title, venue, date submitted, submission ID, current status.", tool: "table" },
    t3: { prompt: "Upload your submission confirmation — the receipt email or system-generated confirmation from the journal or conference.", tool: "upload" },
  },
  {
    stage: 6, checkpoint: 3,
    name: "Outcome received and documented",
    outcome: "The editorial or review outcome is recorded and next steps are planned",
    t1: { prompt: "Write a reflection on the outcome — accepted, revise and resubmit, or rejected — and what the feedback reveals about the paper's strengths and weaknesses.", tool: "write" },
    t2: { prompt: "Build a next-steps plan table — if accepted, dissemination activities; if R&R, specific revisions; if rejected, revised target venues.", tool: "table" },
    t3: { prompt: "Upload the formal decision letter or reviewer feedback from the journal — the official editorial communication.", tool: "upload" },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// QUALITY SCORING CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

/** JIF score tiers (higher is better) */
export const ACADEMIC_JIF_TIERS = {
  low: { min: 0, max: 1.0, label: "Developing", jif: 0.5 },
  standard: { min: 1.0, max: 3.0, label: "Established", jif: 2.0 },
  high: { min: 3.0, max: Infinity, label: "High Impact", jif: 5.0 },
} as const;

/** Maps quality tier to JIF score delta */
export const ACADEMIC_JIF_MAP = {
  low: 0.1,
  standard: 0.5,
  high: 1.2,
} as const;

/** Total academic checkpoints */
export const ACADEMIC_TOTAL_CHECKPOINTS = 25; // 4+5+4+5+4+3
