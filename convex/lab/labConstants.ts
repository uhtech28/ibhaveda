/**
 * labConstants.ts
 *
 * Lab (Experimental) template — stage, checkpoint, and task definitions.
 *
 * 7 stages, 29 total checkpoints.
 * Quality Metric: p-value (LOWER IS BETTER — starts ~0.9, target ≤0.05)
 */

// ─────────────────────────────────────────────────────────────────────────────
// STAGES
// ─────────────────────────────────────────────────────────────────────────────

export const LAB_STAGES = [
  { id: 1, name: "Brief & Question",    checkpoints: 3, biomeName: "Observatory"             },
  { id: 2, name: "Background Research", checkpoints: 4, biomeName: "Ancient Library"          },
  { id: 3, name: "Design & Planning",   checkpoints: 4, biomeName: "Cartographer's Tower"     },
  { id: 4, name: "Build & Execute",     checkpoints: 5, biomeName: "The Forge"                },
  { id: 5, name: "Test & Evaluate",     checkpoints: 5, biomeName: "Alchemist's Laboratory"   },
  { id: 6, name: "Iterate & Refine",    checkpoints: 4, biomeName: "Crossroads Town"          },
  { id: 7, name: "Document & Present",  checkpoints: 4, biomeName: "Grand Hall"               },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// CHECKPOINT DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

import type { ToolType } from "../ventureConstants";

interface LabCheckpointDef {
  stage: number;
  checkpoint: number;
  name: string;
  outcome: string;
  t1: { prompt: string; tool: ToolType };
  t2: { prompt: string; tool: ToolType };
  t3: { prompt: string; tool: ToolType };
}

export const LAB_CHECKPOINT_DEFINITIONS: LabCheckpointDef[] = [

  // ── Stage 1: Brief & Question (Observatory) ───────────────────────────────

  {
    stage: 1, checkpoint: 1,
    name: "Experiment brief written",
    outcome: "The purpose, context, and expected output of the experiment are clearly stated",
    t1: { prompt: "Write a one-page experiment brief — what you are investigating, why it matters, what you expect to produce, and who will use the results.", tool: "write" },
    t2: { prompt: "Build a brief validation table — for each claim in your brief, identify whether it is assumption, observation, or prior-evidenced fact.", tool: "table" },
    t3: { prompt: "Find and link a published study with a similar brief — confirm your experiment isn't duplicating existing work without adding to it.", tool: "link" },
  },
  {
    stage: 1, checkpoint: 2,
    name: "Hypothesis formulated",
    outcome: "A testable, falsifiable hypothesis is written",
    t1: { prompt: "Write your hypothesis in formal notation: 'If [condition], then [outcome], because [reasoning].' State both null and alternative hypotheses.", tool: "write" },
    t2: { prompt: "Build a hypothesis evaluation table — rate your hypothesis on testability, falsifiability, specificity, and connection to theory.", tool: "table" },
    t3: { prompt: "Poll three colleagues or subject experts on whether your hypothesis is testable and clearly defined. Document their responses.", tool: "poll" },
  },
  {
    stage: 1, checkpoint: 3,
    name: "Scope and constraints defined",
    outcome: "The boundaries of what will and won't be tested are documented",
    t1: { prompt: "Write a scope statement — what is explicitly within scope, what is out of scope, and what are the practical constraints (time, budget, access, equipment).", tool: "write" },
    t2: { prompt: "Build a constraints table — each constraint, its impact on experimental design, and how you plan to mitigate or account for it.", tool: "table" },
    t3: { prompt: "Map the experiment scope — show what is included, excluded, and what sits on the boundary with a decision about which side it falls.", tool: "map" },
  },

  // ── Stage 2: Background Research (Ancient Library) ────────────────────────

  {
    stage: 2, checkpoint: 1,
    name: "Prior art surveyed",
    outcome: "Existing experiments and studies addressing the same or similar questions are documented",
    t1: { prompt: "Write a prior art summary — what experiments or studies have already investigated this question, what they found, and what remains unanswered.", tool: "write" },
    t2: { prompt: "Build a prior studies table — each relevant study: hypothesis, method, sample size, key finding, and limitation.", tool: "table" },
    t3: { prompt: "Link at least three prior studies directly relevant to your experiment — annotate each with what it contributes and where it falls short.", tool: "link" },
  },
  {
    stage: 2, checkpoint: 2,
    name: "Variables identified",
    outcome: "All independent, dependent, and confounding variables are named and defined",
    t1: { prompt: "List every variable in your experiment — independent (what you control), dependent (what you measure), and confounding (what could interfere).", tool: "write" },
    t2: { prompt: "Build a variable definition table — each variable, its type, how it will be operationalised and measured, and its unit.", tool: "table" },
    t3: { prompt: "Map variable relationships — show how independent variables influence dependent variables and where confounders could enter the system.", tool: "map" },
  },
  {
    stage: 2, checkpoint: 3,
    name: "Benchmarks established",
    outcome: "The performance or measurement baselines against which results will be compared are documented",
    t1: { prompt: "Write a benchmarks statement — what baseline performance, value, or behaviour will you compare your results against, and how is it established?", tool: "write" },
    t2: { prompt: "Build a benchmarks table — each metric you will measure, the baseline value, the source of the baseline, and the success threshold.", tool: "table" },
    t3: { prompt: "Link the original source for your baseline benchmarks — prior study, industry standard, or established protocol.", tool: "link" },
  },
  {
    stage: 2, checkpoint: 4,
    name: "Required resources inventoried",
    outcome: "All materials, equipment, data sources, and skills needed for the experiment are listed",
    t1: { prompt: "Write a resource requirements statement — what equipment, software, datasets, expertise, and access permissions you need to run this experiment.", tool: "write" },
    t2: { prompt: "Build a resource inventory table — each resource, whether you have it, where to source it if not, and what it will cost or take to acquire.", tool: "table" },
    t3: { prompt: "Upload evidence of access to your critical resources — procurement records, access approvals, dataset licences, or equipment booking confirmations.", tool: "upload" },
  },

  // ── Stage 3: Design & Planning (Cartographer's Tower) ─────────────────────

  {
    stage: 3, checkpoint: 1,
    name: "Experimental design chosen",
    outcome: "The overall experiment design (controlled, randomised, factorial, A/B, etc.) is documented and justified",
    t1: { prompt: "Describe your experimental design — what type it is, how it controls variables, and why it is the most appropriate design for your hypothesis.", tool: "write" },
    t2: { prompt: "Build a design comparison table — your chosen design vs. two alternatives: why yours controls for bias and confounders more effectively.", tool: "table" },
    t3: { prompt: "Map your experimental design — show the flow from conditions through data collection to analysis and output.", tool: "map" },
  },
  {
    stage: 3, checkpoint: 2,
    name: "Sample and conditions defined",
    outcome: "The sample size, selection criteria, and experimental conditions are specified",
    t1: { prompt: "Write a sample specification — how many participants, samples, trials, or data points you will use, how they will be selected, and why this size is sufficient.", tool: "write" },
    t2: { prompt: "Build a conditions matrix table — each experimental condition, its parameter settings, the expected sample in each, and how randomisation will be applied.", tool: "table" },
    t3: { prompt: "Show a power analysis or sample size justification — a calculation or reference showing your sample size is sufficient to detect the effect you expect.", tool: "upload" },
  },
  {
    stage: 3, checkpoint: 3,
    name: "Protocol written",
    outcome: "A step-by-step experimental protocol sufficient for another researcher to replicate the study exists",
    t1: { prompt: "Write your experimental protocol — every step of the procedure in the order it will be executed, specific enough that a competent researcher could run it without asking you any questions.", tool: "write" },
    t2: { prompt: "Build a protocol checklist table — each protocol step, what equipment or materials are needed, and estimated time.", tool: "table" },
    t3: { prompt: "Upload your protocol document — formatted as an official SOP (Standard Operating Procedure) or equivalent reproducibility artefact.", tool: "upload" },
  },
  {
    stage: 3, checkpoint: 4,
    name: "Data collection instruments validated",
    outcome: "All measurement tools, sensors, or instruments are tested and validated before the main experiment",
    t1: { prompt: "Write an instrument validation report — what tools you will use to collect data, how you tested each one, and what results from the pilot showed they measure accurately.", tool: "write" },
    t2: { prompt: "Build an instrument log table — each instrument, its measurement range, calibration date, accuracy tolerance, and validation result.", tool: "table" },
    t3: { prompt: "Upload your pilot test results — the raw data from a small test run confirming that instruments function correctly.", tool: "upload" },
  },

  // ── Stage 4: Build & Execute (The Forge) ──────────────────────────────────

  {
    stage: 4, checkpoint: 1,
    name: "Experiment environment set up",
    outcome: "All systems, equipment, and conditions are configured and ready",
    t1: { prompt: "Write an environment readiness report — confirm every system, device, software version, and physical condition is configured as specified in the protocol.", tool: "write" },
    t2: { prompt: "Build an environment setup checklist table — each component, expected configuration, actual state, and confirmation it matches the protocol.", tool: "table" },
    t3: { prompt: "Upload a screenshot, photo, or log file confirming the experiment environment is correctly configured and operational.", tool: "upload" },
  },
  {
    stage: 4, checkpoint: 2,
    name: "Data collection executed — Run 1",
    outcome: "The first experimental run is complete and data is recorded",
    t1: { prompt: "Document what happened during Run 1 — what you collected, any deviations from the protocol, and the initial data quality assessment.", tool: "journal" },
    t2: { prompt: "Build a run log table — each measurement taken, the condition it was taken under, the recorded value, and any anomaly flag.", tool: "table" },
    t3: { prompt: "Upload the raw data file from Run 1 — labelled with the run number, date, and conditions.", tool: "upload" },
  },
  {
    stage: 4, checkpoint: 3,
    name: "Data collection executed — Repeat runs",
    outcome: "Sufficient replicate runs are complete to establish reliability",
    t1: { prompt: "Document the repeat runs — how many you completed, any variation in conditions between runs, and early observations about consistency.", tool: "journal" },
    t2: { prompt: "Build a multi-run summary table — for each run: conditions, key measured values, and a consistency flag comparing it to Run 1.", tool: "table" },
    t3: { prompt: "Upload the raw data files from all runs — clearly labelled with run numbers and conditions.", tool: "upload" },
  },
  {
    stage: 4, checkpoint: 4,
    name: "Data quality verified",
    outcome: "The collected dataset is checked for completeness, consistency, and absence of systematic errors",
    t1: { prompt: "Write a data quality report — what checks you performed, what issues you found (missing data, outliers, inconsistencies), and how you addressed each.", tool: "write" },
    t2: { prompt: "Build a data quality table — each quality check run, what was assessed, any issues found, and the resolution.", tool: "table" },
    t3: { prompt: "Upload your cleaned dataset — after quality checks, clearly annotated to show what was retained, corrected, and excluded.", tool: "upload" },
  },
  {
    stage: 4, checkpoint: 5,
    name: "Dataset documented",
    outcome: "The final dataset is described in sufficient detail for reuse by other researchers",
    t1: { prompt: "Write a dataset description — what the dataset contains, how it was collected, how it is structured, and how another researcher would use it.", tool: "write" },
    t2: { prompt: "Build a data dictionary table — for each variable or column in the dataset: name, description, type, units, range, and any encoding.", tool: "table" },
    t3: { prompt: "Upload a README or codebook for the dataset — the document a researcher would need to open and understand the data without asking you.", tool: "upload" },
  },

  // ── Stage 5: Test & Evaluate (Alchemist's Laboratory) ────────────────────

  {
    stage: 5, checkpoint: 1,
    name: "Analysis method selected",
    outcome: "The statistical or analytical method is chosen and its appropriateness justified",
    t1: { prompt: "Describe the analysis method you will use — what it is, what it tests, and why it is appropriate for your data type, sample size, and hypothesis.", tool: "write" },
    t2: { prompt: "Build a method justification table — your chosen method vs. two alternatives: why yours is more appropriate given your data and research question.", tool: "table" },
    t3: { prompt: "Link the reference for your chosen analytical method — a textbook, published tutorial, or the original method paper.", tool: "link" },
  },
  {
    stage: 5, checkpoint: 2,
    name: "Analysis executed",
    outcome: "The statistical or computational analysis is run and results are produced",
    t1: { prompt: "Write an analysis execution report — the software you used, the steps you followed, and the initial output of the analysis.", tool: "write" },
    t2: { prompt: "Build a results table — each analytical output: the test statistic, degrees of freedom, p-value, effect size, and confidence interval.", tool: "table" },
    t3: { prompt: "Upload your analysis script or code — the exact steps used to produce the results, in a form that can be re-run.", tool: "upload" },
  },
  {
    stage: 5, checkpoint: 3,
    name: "Hypothesis tested",
    outcome: "The null and alternative hypotheses are formally evaluated against the results",
    t1: { prompt: "Write a hypothesis evaluation — state the result of the statistical test, whether it supports or rejects the null hypothesis, and what this means for your original question.", tool: "write" },
    t2: { prompt: "Build a hypothesis decision table — each hypothesis, the test result, the decision (reject/fail to reject), and the effect size.", tool: "table" },
    t3: { prompt: "Map the chain from hypothesis → data → test → result → interpretation — show the complete logical flow of your evaluation.", tool: "map" },
  },
  {
    stage: 5, checkpoint: 4,
    name: "Results visualised",
    outcome: "The key findings are represented in clear, accurate visualisations",
    t1: { prompt: "Write a figure descriptions document — for each chart or visualisation you will create, describe what it shows, why this format is appropriate, and what the reader should take from it.", tool: "write" },
    t2: { prompt: "Upload your visualisations — charts, graphs, or figures that represent the main results, properly labelled and formatted.", tool: "upload" },
    t3: { prompt: "Link an interactive version of your key visualisation — a web-based chart, interactive dashboard, or supplementary figure.", tool: "link" },
  },
  {
    stage: 5, checkpoint: 5,
    name: "Results interpreted",
    outcome: "A critical interpretation of what the results mean — including limitations — is documented",
    t1: { prompt: "Write a results interpretation — what your findings mean, how they relate to your hypothesis and your prior literature, and the most important limitations of the study.", tool: "write" },
    t2: { prompt: "Build a limitations table — each limitation, its impact on the validity of the conclusions, and whether or how it can be addressed in future work.", tool: "table" },
    t3: { prompt: "Map the implications — show how your results connect to the broader research field and what they suggest for future experiments.", tool: "map" },
  },

  // ── Stage 6: Iterate & Refine (Crossroads Town) ───────────────────────────

  {
    stage: 6, checkpoint: 1,
    name: "Iteration rationale written",
    outcome: "A clear, evidence-based case for why and how the experiment needs to be improved is documented",
    t1: { prompt: "Write an iteration brief — what the results revealed about the experiment's weaknesses, what specific aspects you will improve, and what outcome you expect from the revision.", tool: "write" },
    t2: { prompt: "Build an improvement plan table — each identified weakness, the proposed improvement, the expected impact on results quality, and the effort required.", tool: "table" },
    t3: { prompt: "Map the iteration — show what changed between the original design and the revised design, and why each change is justified by the results.", tool: "map" },
  },
  {
    stage: 6, checkpoint: 2,
    name: "Revised experiment executed",
    outcome: "The improved experiment has been run and new data is collected",
    t1: { prompt: "Write a revised run report — what changed in the execution, how the new data compares at a glance to the original run, and any new issues that emerged.", tool: "journal" },
    t2: { prompt: "Build a version comparison table — original experiment vs. revised experiment: key parameters, sample size, collection method, and preliminary results.", tool: "table" },
    t3: { prompt: "Upload the raw data from the revised experiment — clearly labelled as Version 2 (or subsequent iteration).", tool: "upload" },
  },
  {
    stage: 6, checkpoint: 3,
    name: "Improvement validated",
    outcome: "Evidence that the iteration improved the experiment's quality or reliability is documented",
    t1: { prompt: "Write a validation report — show quantitatively how the revised experiment improved over the original (better p-value, tighter confidence intervals, reduced variance).", tool: "write" },
    t2: { prompt: "Build an improvement metrics table — each key metric, its value in the original experiment, its value in the revised experiment, and the improvement magnitude.", tool: "table" },
    t3: { prompt: "Upload a side-by-side visualisation comparing original and revised results — demonstrating the improvement clearly.", tool: "upload" },
  },
  {
    stage: 6, checkpoint: 4,
    name: "Iteration history documented",
    outcome: "A full record of all experimental versions and their rationale is created",
    t1: { prompt: "Write a full iteration history — a chronological account of every version of the experiment, what changed, why, and what it produced.", tool: "write" },
    t2: { prompt: "Build a version history table — each version, the date run, the key changes from the previous version, the outcome, and the decision it led to.", tool: "table" },
    t3: { prompt: "Upload a version-controlled repository or experiment log showing the full history of changes — with commit messages or change annotations.", tool: "upload" },
  },

  // ── Stage 7: Document & Present (Grand Hall) ──────────────────────────────

  {
    stage: 7, checkpoint: 1,
    name: "Reproducibility package created",
    outcome: "All materials needed for another researcher to replicate the experiment exactly are assembled",
    t1: { prompt: "Write a reproducibility statement — what another researcher would need to exactly replicate your experiment, and confirm that each item is included in your package.", tool: "write" },
    t2: { prompt: "Build a reproducibility checklist — protocol, data, analysis code, instruments list, environment config — confirming each is complete and accessible.", tool: "table" },
    t3: { prompt: "Upload your complete reproducibility package — a ZIP or repository containing all artefacts needed for replication.", tool: "upload" },
  },
  {
    stage: 7, checkpoint: 2,
    name: "Full report written",
    outcome: "A complete experimental report in a standard scientific format is produced",
    t1: { prompt: "Write the abstract and conclusions of your experimental report — a 250-word abstract and a conclusions section summarising findings, limitations, and future directions.", tool: "write" },
    t2: { prompt: "Build a report completion checklist — each section of the report (Introduction, Method, Results, Discussion, Conclusions, References), confirming each is complete.", tool: "table" },
    t3: { prompt: "Upload your full experimental report as a formatted document — ready for peer review or institutional submission.", tool: "upload" },
  },
  {
    stage: 7, checkpoint: 3,
    name: "Presentation prepared",
    outcome: "A clear, well-structured presentation of the experiment and its findings is ready",
    t1: { prompt: "Write a presentation outline — the key messages for each section, what visuals will support each point, and how you will handle questions about limitations.", tool: "write" },
    t2: { prompt: "Build a slide structure table — each slide, its title, key content, and the visual or data element it will feature.", tool: "table" },
    t3: { prompt: "Upload your presentation deck — slides ready to present to a technical audience.", tool: "upload" },
  },
  {
    stage: 7, checkpoint: 4,
    name: "Findings shared publicly",
    outcome: "The experimental results are accessible to the relevant community",
    t1: { prompt: "Confirm the findings are publicly shared — document where you shared them (preprint server, conference, internal report, open repository), the date, and the access link.", tool: "write" },
    t2: { prompt: "Build a dissemination log table — each channel where findings were shared, the audience, the format, the date, and any initial responses.", tool: "table" },
    t3: { prompt: "Link your publicly published findings — the preprint, conference paper, internal report, or data repository where the work is accessible.", tool: "link" },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// P-VALUE SCORING CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * p-value tiers (LOWER IS BETTER).
 * Standard significance threshold: p ≤ 0.05.
 */
export const LAB_PVALUE_TIERS = {
  low: { threshold: 0.5, label: "Inconclusive", pValue: 0.9 },
  standard: { threshold: 0.1, label: "Marginal", pValue: 0.1 },
  high: { threshold: 0.05, label: "Significant", pValue: 0.03 },
} as const;

/** Maps quality tier to p-value reduction */
export const LAB_PVALUE_DELTA_MAP = {
  low: 0.02,      // Tiny improvement
  standard: 0.08, // Meaningful improvement
  high: 0.15,     // Significant reduction in p-value
} as const;

/** Total lab checkpoints */
export const LAB_TOTAL_CHECKPOINTS = 29; // 3+4+4+5+5+4+4
