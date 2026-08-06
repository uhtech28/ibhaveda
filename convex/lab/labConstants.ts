/**
 * labConstants.ts
 *
 * Lab (Experimental) template — stage, checkpoint, and task definitions.
 *
 * 7 stages, 25 total checkpoints.
 * Quality Metric: p-value (LOWER IS BETTER — starts ~0.9, target ≤0.05)
 */

// ─────────────────────────────────────────────────────────────────────────────
// STAGES
// ─────────────────────────────────────────────────────────────────────────────

export const LAB_STAGES = [
  { id: 1, name: "Brief & Question", checkpoints: 3, biomeName: "Observatory" },
  { id: 2, name: "Research & Background", checkpoints: 3, biomeName: "Ancient Library" },
  { id: 3, name: "Design & Planning", checkpoints: 4, biomeName: "Cartographer's Tower" },
  { id: 4, name: "Build & Execute", checkpoints: 4, biomeName: "Forge" },
  { id: 5, name: "Test & Evaluate", checkpoints: 5, biomeName: "Alchemist's Laboratory" },
  { id: 6, name: "Iterate & Refine", checkpoints: 3, biomeName: "Crossroads Town" },
  { id: 7, name: "Document & Present", checkpoints: 3, biomeName: "Grand Hall" },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// CHECKPOINT DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

import type { ToolType } from "../ventureConstants";

interface TaskDef {
  prompt: string;
  tool: ToolType;
  title?: string;
  subheader?: string;
}

interface LabCheckpointDef {
  stage: number;
  checkpoint: number;
  name: string;
  outcome: string;
  title?: string;
  subheader?: string;
  standardTagline?: string;
  goldTagline?: string;
  t1: TaskDef;
  t2: TaskDef;
  t3: TaskDef;
}

export const LAB_CHECKPOINT_DEFINITIONS: LabCheckpointDef[] = [
  {
    stage: 1,
    checkpoint: 1,
    name: "Work defined",
    outcome: "A clear, bounded description of what this Lab is trying to achieve exists — whether a question to answer, a skill to demonstrate, or a prototype to build.",
    title: "Focus the Lens",
    subheader: "The Mirage Lens shows investigators what they want to see. Define the work clearly and precisely before it distorts your view.",
    standardTagline: "The Observatory has its first true object. The investigation has a shape.",
    goldTagline: "The work is defined precisely. The lens is pointed at something real.",
    t1: {
      prompt: "Describe what you are setting out to do in this Lab in two or three sentences — what you will build, test, or demonstrate, and what a successful outcome looks like to you.",
      tool: "write",
      title: "State What You Are Building",
      subheader: "Describe what you are setting out to do in two or three sentences: what you will build, test, or demonstrate, and what a successful outcome looks like.",
    },
    t2: {
      prompt: "Map out the scope of your Lab on the canvas — showing what is inside the work, what is deliberately outside it, and what the end state looks like.",
      tool: "map",
      title: "Map the Scope",
      subheader: "On the canvas, show what is inside this Lab, what is deliberately outside it, and what the end state looks like.",
    },
    t3: {
      prompt: "If this Lab was set by an institution or brief, upload or link the original brief here — and write a short note confirming your interpretation of what it is asking.",
      tool: "upload",
      title: "Upload the Brief",
      subheader: "If this Lab was set by an institution or brief, upload or link the original here and write a short note confirming your interpretation of what it is asking.",
    },
  },
  {
    stage: 1,
    checkpoint: 2,
    name: "Central question or goal stated",
    outcome: "A specific, answerable question or demonstrable goal is written down — precise enough to judge whether the Lab has succeeded.",
    title: "Train the Telescope",
    subheader: "A question that shows investigators what they want to see is not a question at all. Write one precise, answerable goal that the Lab will genuinely test.",
    standardTagline: "The telescope is trained. The question is sharp enough to be answered or refused.",
    goldTagline: "The question is precisely formed. The Lab cannot lie to it.",
    t1: {
      prompt: "Write your central question or goal in a single sentence — specific enough that someone reading it could tell whether your finished Lab answers or achieves it.",
      tool: "write",
      title: "Write the Central Question",
      subheader: "Write your central question or goal in a single sentence, specific enough that someone reading it could tell whether your finished Lab answers or achieves it.",
    },
    t2: {
      prompt: "Test your question or goal against two criteria in a table: is it achievable within your constraints of time, materials, and access — and is the outcome genuinely open or uncertain? Note your assessment and any refinements.",
      tool: "table",
      title: "Test Its Precision",
      subheader: "In a table, assess your question against two criteria: is it achievable within your constraints of time, materials, and access, and is the outcome genuinely open or uncertain? Note your assessment and any refinements.",
    },
    t3: {
      prompt: "Write a short note on what success and failure look like for this Lab — the specific conditions that would tell you the work is done and the conditions that would tell you it has not worked.",
      tool: "write",
      title: "Define Success and Failure",
      subheader: "Write a short note on what success and failure look like for this Lab: the specific conditions that would tell you the work is done, and those that tell you it has not worked.",
    },
  },
  {
    stage: 1,
    checkpoint: 3,
    name: "Hypothesis or design intent formed",
    outcome: "A prediction, directional bet, or design intention is stated — something the Lab is oriented toward proving, disproving, or demonstrating.",
    title: "Make the Prediction",
    subheader: "The Mirage Lens corrupts the hypothesis before the work begins. State your prediction clearly enough that the Lab could prove it wrong.",
    standardTagline: "A prediction has been made. The universe has been challenged. Let it answer.",
    goldTagline: "The prediction is stated precisely and falsifiably. The experiment is designed to find the truth.",
    t1: {
      prompt: "State your hypothesis, design intent, or working assumption — what you expect to find, build, or demonstrate, and the reasoning behind that expectation.",
      tool: "write",
      title: "State the Hypothesis",
      subheader: "State your hypothesis, design intent, or working assumption: what you expect to find, build, or demonstrate, and the reasoning behind that expectation.",
    },
    t2: {
      prompt: "Build a table showing your stated hypothesis or intent alongside the two or three most likely alternative outcomes — and note what evidence or result would lead to each.",
      tool: "table",
      title: "Name the Alternatives",
      subheader: "Build a table showing your stated hypothesis alongside the two or three most likely alternative outcomes, and note what evidence or result would lead to each.",
    },
    t3: {
      prompt: "Identify what would prove your hypothesis or intent wrong — and confirm in a short note that your Lab is capable of producing that result if it exists.",
      tool: "write",
      title: "Confirm It Can Be Falsified",
      subheader: "Identify what would prove your hypothesis wrong, and confirm in a short note that your Lab is capable of producing that result if it exists.",
    },
  },
  {
    stage: 2,
    checkpoint: 1,
    name: "Prior work and context gathered",
    outcome: "What is already known, built, or attempted in this area is documented — giving the Lab a foundation to build from rather than repeat.",
    title: "Search the Misfiled Stacks",
    subheader: "The Librarian hid the methods and findings you need in the wrong sections. Find the prior work that gives your Lab a foundation to build from rather than repeat.",
    standardTagline: "The library has been searched. The prior expeditions are on the table.",
    goldTagline: "Every prior attempt found and studied. Nothing reinvented without cause.",
    t1: {
      prompt: "List at least four sources — papers, tutorials, project reports, documentation, or examples — that relate to your Lab, with a sentence on what each one contributes to your understanding.",
      tool: "write",
      title: "List the Prior Work",
      subheader: "List at least four sources, papers, tutorials, project reports, or examples, that relate to your Lab, with a sentence on what each contributes to your understanding.",
    },
    t2: {
      prompt: "Build a prior work table — listing each source, what it did or found, its relevance to your specific question or goal, and one thing it leaves unanswered or unbuilt.",
      tool: "table",
      title: "Build the Prior Work Table",
      subheader: "Build a prior work table listing each source, what it did or found, its relevance to your question or goal, and one thing it leaves unanswered or unbuilt.",
    },
    t3: {
      prompt: "Link the two most directly relevant sources — the closest existing work to what you are doing — and write a note on exactly where your Lab picks up where they left off.",
      tool: "link",
      title: "Link the Closest Work",
      subheader: "Link the two most directly relevant sources and write a note on exactly where your Lab picks up where they left off.",
    },
  },
  {
    stage: 2,
    checkpoint: 2,
    name: "Methods and approaches reviewed",
    outcome: "How others have approached similar work is understood — including what worked, what failed, and why.",
    title: "Study the Other Expeditions",
    subheader: "Learn what other investigators tried, what held, and what broke, before you set out on the same ground.",
    standardTagline: "The methods of those who came before have been examined. Their tools are understood.",
    goldTagline: "Every prior method studied in full. The best elements identified.",
    t1: {
      prompt: "Describe at least two methods or approaches used by others to tackle something similar to your Lab — and note the key strength and limitation of each.",
      tool: "write",
      title: "Describe the Approaches",
      subheader: "Describe at least two methods or approaches used by others to tackle something similar to your Lab, and note the key strength and limitation of each.",
    },
    t2: {
      prompt: "Build a methods comparison table — listing each approach, what it produces, what it misses, and how it compares to what you are planning.",
      tool: "table",
      title: "Compare the Methods",
      subheader: "Build a methods comparison table listing each approach, what it produces, what it misses, and how it compares to your planned approach.",
    },
    t3: {
      prompt: "Map the landscape of existing approaches on the canvas — positioning each by how well it fits your specific question or goal — and mark where your planned approach sits relative to them.",
      tool: "map",
      title: "Map the Landscape",
      subheader: "On the canvas, position each existing approach by how well it fits your specific question or goal, and mark where your planned approach sits relative to them.",
    },
  },
  {
    stage: 2,
    checkpoint: 3,
    name: "Resources and requirements identified",
    outcome: "Everything needed to do the Lab — materials, tools, software, space, time — is listed and its availability confirmed.",
    title: "Stock the Expedition",
    subheader: "No investigation begins without its provisions. List everything needed to run this Lab and confirm each item is within reach.",
    standardTagline: "The expedition is provisioned. Every item needed is listed and its availability confirmed.",
    goldTagline: "The list is complete and specific. Every item accounted for, every specification noted.",
    t1: {
      prompt: "List every resource you will need to complete this Lab — materials, equipment, software, datasets, or space — being specific about quantities and specifications.",
      tool: "write",
      title: "List the Requirements",
      subheader: "List every resource you will need to complete this Lab, materials, equipment, software, datasets, or space, being specific about quantities and specifications.",
    },
    t2: {
      prompt: "Build a resources table — listing each item, whether you already have it, where you will get it if not, and any constraint or risk around accessing it.",
      tool: "table",
      title: "Build the Resources Table",
      subheader: "Build a resources table listing each item, whether you already have it, where you will get it if not, and any constraint or risk around accessing it.",
    },
    t3: {
      prompt: "Set up a Kanban board with columns for resources still to acquire, resources in hand, and resources confirmed and tested — and populate it with every item from your list.",
      tool: "kanban",
      title: "Set Up the Kanban Board",
      subheader: "Set up a Kanban board with columns for resources still to acquire, resources in hand, and resources confirmed and tested, and populate it with every item from your list.",
    },
  },
  {
    stage: 3,
    checkpoint: 1,
    name: "Approach chosen and justified",
    outcome: "A specific method, technique, or design strategy is selected and the reasoning for choosing it over alternatives is documented.",
    title: "Choose the True Instrument",
    subheader: "The Cartographer's crooked instruments corrupt the results before the work begins. Choose your approach and justify it honestly against the alternatives.",
    standardTagline: "The instrument of inquiry has been chosen. The experiment will proceed this way.",
    goldTagline: "The method is chosen with full justification. Every alternative considered and set aside.",
    t1: {
      prompt: "Describe the approach you will take and explain in two sentences why it is the right choice for your specific question or goal.",
      tool: "write",
      title: "Name the Approach",
      subheader: "Describe the approach you will take and explain in two sentences why it is the right choice for your specific question or goal.",
    },
    t2: {
      prompt: "Build a decision table — listing your chosen approach alongside the two most obvious alternatives, and explaining why your choice is more appropriate than each alternative for this specific Lab.",
      tool: "table",
      title: "Compare the Alternatives",
      subheader: "Build a decision table listing your chosen approach alongside the two most obvious alternatives and explaining why your choice is more appropriate for this specific Lab.",
    },
    t3: {
      prompt: "Write a paragraph defending your approach — including what kind of evidence or output it produces and why that kind of evidence is right for what you are trying to show.",
      tool: "write",
      title: "Defend the Method",
      subheader: "Write a paragraph defending your approach, including what kind of evidence or output it produces and why that kind of evidence is right for what you are trying to show.",
    },
  },
  {
    stage: 3,
    checkpoint: 2,
    name: "Process mapped in detail",
    outcome: "The step-by-step plan for carrying out the Lab is written in enough detail that someone else could follow it.",
    title: "Draw the True Map",
    subheader: "A crooked map sends expeditions in the wrong direction without them ever knowing. Write your procedure in enough detail that another could follow it exactly.",
    standardTagline: "The steps have been written. Another hand could follow them and arrive at the same place.",
    goldTagline: "The procedure is written to replication standard.",
    t1: {
      prompt: "Write the procedure or process for your Lab in numbered steps — detailed enough that someone not involved could follow it and arrive at a comparable result.",
      tool: "write",
      title: "Write the Procedure",
      subheader: "Write the procedure or process for your Lab in numbered steps, detailed enough that someone not involved could follow it and arrive at a comparable result.",
    },
    t2: {
      prompt: "Map the process on the canvas — showing each phase, the dependencies between them, and the points where something could go wrong or require a decision.",
      tool: "map",
      title: "Map the Process",
      subheader: "On the canvas, map each phase, the dependencies between them, and the points where something could go wrong or require a decision.",
    },
    t3: {
      prompt: "Ask someone who has not been involved to read your procedure and identify any step that is unclear, ambiguous, or missing — document what they found and how you adjusted.",
      tool: "self_report",
      title: "Send a Stranger Through",
      subheader: "Ask someone not involved to read your procedure and identify any step that is unclear or missing. Document what they found and how you adjusted.",
    },
  },
  {
    stage: 3,
    checkpoint: 3,
    name: "Variables, parameters, or constraints defined",
    outcome: "The specific inputs, outputs, boundaries, and controlled conditions of the Lab are precisely identified.",
    title: "Set the Calibration",
    subheader: "A measurement off by a little leads every finding astray. Name every variable, parameter, and constraint precisely before you begin.",
    standardTagline: "The levers have been named. What will move, what will be measured, what will be held still.",
    goldTagline: "Every variable precisely named and defined. The experiment's logic is without ambiguity.",
    t1: {
      prompt: "Name the key input you are changing or testing and describe exactly what you will vary, build, or demonstrate — in what form and to what specification.",
      tool: "write",
      title: "Name the Key Input",
      subheader: "Name the key input you are changing or testing and describe exactly what you will vary, build, or demonstrate, in what form and to what specification.",
    },
    t2: {
      prompt: "Build a parameters table — listing every variable, constraint, or condition in your Lab, how each will be set or controlled, and what would happen to your results if it changed unexpectedly.",
      tool: "table",
      title: "Build the Parameters Table",
      subheader: "Build a parameters table listing every variable, constraint, or condition in your Lab, how each will be set or controlled, and what would happen to your results if it changed unexpectedly.",
    },
    t3: {
      prompt: "Build a timeline on the calendar tool — mapping each major phase of your Lab against available time, and flagging any constraint that could affect whether you finish on schedule.",
      tool: "calendar",
      title: "Build the Timeline",
      subheader: "Map each major phase of your Lab against available time on the calendar tool, and flag any constraint that could affect whether you finish on schedule.",
    },
  },
  {
    stage: 3,
    checkpoint: 4,
    name: "Safety, ethics, and feasibility confirmed",
    outcome: "The Lab has been assessed as safe, ethical, and practically achievable within the given constraints.",
    title: "Clear the Lab for Work",
    subheader: "The forge must be safe before the fire is lit. Confirm the Lab is safe, ethical, and achievable within your constraints.",
    standardTagline: "The forge master has inspected the plan. The fire will not get out of hand.",
    goldTagline: "Safety, ethics, and feasibility all confirmed. The experiment may proceed.",
    t1: {
      prompt: "Identify any safety, ethical, or feasibility concern in your Lab and describe specifically how you will address each one.",
      tool: "write",
      title: "Name the Concerns",
      subheader: "Identify any safety, ethical, or feasibility concern in your Lab and describe specifically how you will address each one.",
    },
    t2: {
      prompt: "Build a feasibility checklist table — confirming you have access to all required resources, space, time, and any necessary permissions or approvals, with a pass or fail against each.",
      tool: "table",
      title: "Run the Feasibility Check",
      subheader: "Build a feasibility checklist table confirming you have access to all required resources, space, time, and any necessary permissions or approvals, with a pass or fail against each.",
    },
    t3: {
      prompt: "Confirm in a journal entry that your Lab meets all relevant safety and ethical requirements for your context — noting any condition that is still unresolved and your plan to resolve it.",
      tool: "journal",
      title: "Write the Safety Confirmation",
      subheader: "Confirm in a journal entry that your Lab meets all relevant safety and ethical requirements for your context, noting any condition still unresolved and your plan to resolve it.",
    },
  },
  {
    stage: 4,
    checkpoint: 1,
    name: "Setup complete and verified",
    outcome: "Everything needed to begin the Lab is in place, tested, and confirmed ready — materials acquired, environment prepared, tools working.",
    title: "Light the Forge",
    subheader: "The Saboteur hides in equipment that was never properly tested. Confirm every item is in place, working, and ready before the work begins.",
    standardTagline: "The forge is laid out. Every component is in position and the fire is ready to be lit.",
    goldTagline: "The setup is exact. Every component in its true position. The experiment awaits the signal.",
    t1: {
      prompt: "Confirm every item on your resources list has been obtained and set up — document any substitutions made and why, and confirm everything has been tested and is working.",
      tool: "self_report",
      title: "Confirm the Setup",
      subheader: "Confirm every item on your resources list has been obtained and set up. Document any substitutions and confirm everything has been tested and is working.",
    },
    t2: {
      prompt: "Build an acquisition and setup confirmation table — listing each item, whether it was obtained and set up as planned or substituted, and whether it has been tested and confirmed functioning.",
      tool: "table",
      title: "Build the Setup Confirmation Table",
      subheader: "Build a confirmation table listing each item, whether it was obtained and set up as planned or substituted, and whether it has been tested and confirmed functioning.",
    },
    t3: {
      prompt: "Upload a photo or screenshot documenting your setup before the Lab begins — as a record of the starting state.",
      tool: "upload",
      title: "Photograph the Starting State",
      subheader: "Upload a photo or screenshot documenting your setup before the Lab begins, as a record of the state from which everything runs.",
    },
  },
  {
    stage: 4,
    checkpoint: 2,
    name: "Trial or pilot run completed",
    outcome: "A small-scale or preliminary run has been completed and any issues with the setup or process have been identified before full execution.",
    title: "Run the Trial Heat",
    subheader: "The Saboteur reveals itself at low heat before it can ruin the full run. Complete a trial and surface every flaw before full execution begins.",
    standardTagline: "The forge has been tested at low heat. What was weak has been found before it could break.",
    goldTagline: "The trial revealed every flaw before it mattered. The full run begins from solid ground.",
    t1: {
      prompt: "Describe what happened during your trial or pilot run — including anything that did not go as planned, any gap in your process, and how the setup performed.",
      tool: "write",
      title: "Describe the Trial Run",
      subheader: "Describe what happened during your trial or pilot run: anything that did not go as planned, any gap in your process, and how the setup performed.",
    },
    t2: {
      prompt: "Build a trial findings table — listing each issue or unexpected result from the pilot, its likely cause, and the specific change you will make before the full run.",
      tool: "table",
      title: "Log the Trial Findings",
      subheader: "Build a trial findings table listing each issue or unexpected result from the pilot, its likely cause, and the specific change you will make before the full run.",
    },
    t3: {
      prompt: "Upload a photo, screenshot, or recording from the trial run — showing the Lab in progress and capturing any issues that occurred.",
      tool: "upload",
      title: "Upload Evidence from the Trial",
      subheader: "Upload a photo, screenshot, or recording from the trial run showing the Lab in progress and capturing any issues that occurred.",
    },
  },
  {
    stage: 4,
    checkpoint: 3,
    name: "Adjustments made and process locked",
    outcome: "Everything learned from the trial has been incorporated and the final procedure is confirmed before full execution begins.",
    title: "Drive Out the Saboteur",
    subheader: "Flush every hidden flaw before the full run begins. Incorporate every lesson from the trial and lock the procedure.",
    standardTagline: "The forge has been adjusted. The trial's lessons are built into the setup.",
    goldTagline: "Every adjustment made and verified. The trial's lessons are fully incorporated.",
    t1: {
      prompt: "Document every change you made following the trial — explaining what problem each change addresses and confirming the procedure is now final.",
      tool: "write",
      title: "Document the Changes",
      subheader: "Document every change made following the trial, explaining what problem each change addresses and confirming the procedure is now final.",
    },
    t2: {
      prompt: "Update your Kanban board to reflect the revised process — moving resolved issues to done and flagging anything still open before full execution.",
      tool: "kanban",
      title: "Update the Kanban Board",
      subheader: "Update your Kanban board to reflect the revised process, moving resolved issues to done and flagging anything still open before full execution.",
    },
    t3: {
      prompt: "Ask someone not involved to review your updated setup or procedure against your original plan and confirm the changes are sound — document their confirmation and any final issues flagged.",
      tool: "self_report",
      title: "Get Outside Confirmation",
      subheader: "Ask someone not involved to review your updated setup or procedure against your original plan and confirm the changes are sound. Document their confirmation and any final issues flagged.",
    },
  },
  {
    stage: 4,
    checkpoint: 4,
    name: "Full Lab executed and raw output recorded",
    outcome: "The complete Lab has been carried out following the confirmed procedure, and all results, observations, or artefacts are captured in their raw form.",
    title: "Fire at Full Heat",
    subheader: "Run the complete Lab following the confirmed procedure and capture everything it produces, exactly as it happens.",
    standardTagline: "The forge has fired at full heat. The experiment is done. What it produced is in our hands.",
    goldTagline: "The experiment ran in full without deviation. Every measurement recorded at every moment.",
    t1: {
      prompt: "Confirm the full Lab was run following your procedure — note any deviations that occurred, whether they were intentional, and whether they might affect the results or output.",
      tool: "self_report",
      title: "Confirm the Full Run",
      subheader: "Confirm the full Lab was run following your procedure. Note any deviations, whether they were intentional, and whether they might affect the results or output.",
    },
    t2: {
      prompt: "Record all raw output from the full run in a structured format — a data table, observation log, or artefact inventory — capturing what happened at each step.",
      tool: "table",
      title: "Record All Raw Output",
      subheader: "Record all raw output from the full run in a structured format, a data table, observation log, or artefact inventory, capturing what happened at each step.",
    },
    t3: {
      prompt: "Upload a photo, recording, or file from the full execution — showing the Lab in progress and confirming it was completed as planned.",
      tool: "upload",
      title: "Upload Evidence of the Full Run",
      subheader: "Upload a photo, recording, or file from the full execution showing the Lab in progress and confirming it was completed as planned.",
    },
  },
  {
    stage: 5,
    checkpoint: 1,
    name: "Output organised and ready for evaluation",
    outcome: "Raw results, data, or artefacts are structured, labelled, and cleaned — ready to be analysed or assessed without ambiguity.",
    title: "Separate Ore from Slag",
    subheader: "The Alchemist corrupts results that are handled carelessly. Organise and label every output before a single interpretation is drawn.",
    standardTagline: "The ore has been separated from the slag. What remains is true and ready to be read.",
    goldTagline: "Every result documented faithfully, organised precisely. Nothing hidden and nothing lost.",
    t1: {
      prompt: "Describe every decision you made in organising your raw output — what you kept, what you set aside, and why — so the evaluation can be traced back to the original execution.",
      tool: "write",
      title: "Describe the Organisation",
      subheader: "Describe every decision you made in organising your raw output: what you kept, what you set aside, and why, so the evaluation can be traced back to the original execution.",
    },
    t2: {
      prompt: "Build an output inventory table — listing every result, data point, artefact, or observation from the full run, with a label, its source step in the procedure, and its format.",
      tool: "table",
      title: "Build the Output Inventory",
      subheader: "Build an output inventory table listing every result, data point, artefact, or observation from the full run, with a label, its source step, and its format.",
    },
    t3: {
      prompt: "Upload your organised output as a file — a structured dataset, an annotated artefact set, or a labelled results document — in a form that can be evaluated without needing to ask you anything.",
      tool: "upload",
      title: "Upload the Organised Output",
      subheader: "Upload your organised output as a file, a structured dataset, annotated artefact set, or labelled results document, in a form that can be evaluated without needing to ask you anything.",
    },
  },
  {
    stage: 5,
    checkpoint: 2,
    name: "Analysis or assessment method applied",
    outcome: "The appropriate method for making sense of the output has been used — whether statistical analysis, functional testing, structured critique, or qualitative assessment.",
    title: "Apply the True Test",
    subheader: "The Alchemist of Wishful Results adjusts measurements just enough to tell the story you want. Apply the analysis method rigorously and let the output speak.",
    standardTagline: "The alchemist has applied the test. The result is in the vessel.",
    goldTagline: "The analysis is complete and rigorous. The method was appropriate. The result is defensible.",
    t1: {
      prompt: "Describe the method you used to evaluate or analyse your output and confirm it is appropriate for what your Lab was trying to show.",
      tool: "write",
      title: "Describe the Analysis Method",
      subheader: "Describe the method you used to evaluate or analyse your output and confirm it is appropriate for what your Lab was trying to show.",
    },
    t2: {
      prompt: "Build an analysis or assessment output table — showing the result of your evaluation in a structured format that clearly communicates what the output shows.",
      tool: "table",
      title: "Build the Analysis Output Table",
      subheader: "Build an analysis or assessment output table showing the result of your evaluation in a structured format that communicates clearly what the output shows.",
    },
    t3: {
      prompt: "Upload a visualisation, annotated artefact, or structured comparison that makes the key finding or evaluation result visible without needing to read through raw data.",
      tool: "upload",
      title: "Upload a Visualisation",
      subheader: "Upload a visualisation, annotated artefact, or structured comparison that makes the key finding or evaluation result visible without needing to read through raw data.",
    },
  },
  {
    stage: 5,
    checkpoint: 3,
    name: "Results documented as observed facts",
    outcome: "Findings are written up clearly as what was observed or measured — without interpretation or explanation, just what the Lab produced.",
    title: "Record What the Forge Produced",
    subheader: "State the results as plain observed facts before any interpretation is drawn. The Alchemist cannot corrupt what has been faithfully recorded.",
    standardTagline: "What the alchemist found has been written down exactly. No interpretation yet. Only what is.",
    goldTagline: "Every result documented in plain terms with a direct line to the data that produced it.",
    t1: {
      prompt: "Write a results section that states what your output shows in plain terms — numbers, patterns, functional behaviours, or observable qualities — without yet explaining what they mean.",
      tool: "write",
      title: "Write the Results",
      subheader: "Write a results section stating what your output shows in plain terms: numbers, patterns, functional behaviours, or observable qualities. No explanation yet, only what the Lab produced.",
    },
    t2: {
      prompt: "Build a results summary table — listing each key finding or observation, the specific output or data point it comes from, and its location in your organised results.",
      tool: "table",
      title: "Build the Results Summary Table",
      subheader: "Build a results summary table listing each key finding or observation, the specific output or data point it comes from, and its location in your organised results.",
    },
    t3: {
      prompt: "Create a poll for anyone who has seen your output — asking them to rate one specific quality of the result on a defined scale — and document the responses.",
      tool: "poll",
      title: "Poll the Observers",
      subheader: "Create a poll for anyone who has seen your output, asking them to rate one specific quality of the result on a defined scale, and document the responses.",
    },
  },
  {
    stage: 5,
    checkpoint: 4,
    name: "Results interpreted against the hypothesis or goal",
    outcome: "A clear judgment is made on whether the Lab achieved what it set out to — supported by specific evidence from the results.",
    title: "Read the Alchemical Verdict",
    subheader: "Let the results answer the hypothesis honestly. State clearly whether the Lab confirmed, partially confirmed, or refuted what you set out to show.",
    standardTagline: "The alchemist has named what the result means. The hypothesis has met its verdict.",
    goldTagline: "The interpretation is drawn with precision. The hypothesis is confirmed, partially confirmed, or refuted.",
    t1: {
      prompt: "Write your interpretation — stating clearly whether your results support, partially support, or contradict your original hypothesis or goal, with the specific evidence that leads you to that conclusion.",
      tool: "write",
      title: "Write the Interpretation",
      subheader: "State clearly whether your results support, partially support, or contradict your original hypothesis or goal, with the specific evidence that leads you to that conclusion.",
    },
    t2: {
      prompt: "Build a comparison table showing your results alongside at least two prior examples or benchmarks from your background research — noting where your output agrees, diverges, or adds something new.",
      tool: "table",
      title: "Compare Against Prior Work",
      subheader: "Build a comparison table showing your results alongside at least two prior examples or benchmarks from your background research, noting where your output agrees, diverges, or adds something new.",
    },
    t3: {
      prompt: "Map the implications of your finding on the canvas — showing what it means for the original question or goal, what it confirms, what it opens up, and what it leaves unresolved.",
      tool: "map",
      title: "Map the Implications",
      subheader: "On the canvas, map what your finding means for the original question or goal: what it confirms, what it opens up, and what it leaves unresolved.",
    },
  },
  {
    stage: 5,
    checkpoint: 5,
    name: "Limitations honestly assessed",
    outcome: "An honest account of what could have affected the results — in the setup, execution, or method — is documented.",
    title: "Weigh the Vessel Honestly",
    subheader: "The Alchemist hides what the vessel could not measure. Name every limitation before the findings are taken as certain.",
    standardTagline: "The alchemist has named what the vessel could not perfectly measure. The result is honest.",
    goldTagline: "Every limitation named, classified, and assessed. The finding carries its appropriate weight.",
    t1: {
      prompt: "Identify at least three limitations of your Lab and describe how each one might have affected your results or output.",
      tool: "write",
      title: "Name the Limitations",
      subheader: "Identify at least three limitations of your Lab and describe how each might have affected your results or output.",
    },
    t2: {
      prompt: "Build a limitations table — listing each limitation, whether it was avoidable or structural, its likely impact on the results, and what a stronger version of this Lab would do differently.",
      tool: "table",
      title: "Build the Limitations Table",
      subheader: "Build a limitations table listing each limitation, whether it was avoidable or structural, its likely impact on the results, and what a stronger version of this Lab would do differently.",
    },
    t3: {
      prompt: "Write a description of what a stronger version of this Lab would look like — the specific changes you would make to reduce the limitations and improve confidence in the output.",
      tool: "write",
      title: "Describe the Stronger Version",
      subheader: "Write a description of what a stronger version of this Lab would look like: the specific changes you would make to reduce the limitations and improve confidence in the output.",
    },
  },
  {
    stage: 6,
    checkpoint: 1,
    name: "Verdict on the Lab stated",
    outcome: "A clear, evidence-based conclusion on whether the Lab succeeded — and to what degree — is written and ready to carry into documentation.",
    title: "State the Verdict",
    subheader: "The Babel Merchant offers three incompatible verdicts. Choose the one the evidence actually supports and commit to it in writing.",
    standardTagline: "The verdict is in. The crossroads knows what this expedition found.",
    goldTagline: "The verdict is stated with full evidence. The degree of confidence is honest.",
    t1: {
      prompt: "Write a one-paragraph conclusion — whether the Lab confirmed, partially confirmed, or refuted the hypothesis or goal — citing the two or three most important pieces of evidence.",
      tool: "write",
      title: "Write the Conclusion",
      subheader: "Write a one-paragraph conclusion stating whether the Lab confirmed, partially confirmed, or refuted the hypothesis or goal, citing the two or three most important pieces of evidence.",
    },
    t2: {
      prompt: "Build a verdict table — showing your original hypothesis or goal, what the results showed, the degree of success or confirmation, and your confidence level in the conclusion.",
      tool: "table",
      title: "Build the Verdict Table",
      subheader: "Build a verdict table showing your original hypothesis or goal, what the results showed, the degree of success or confirmation, and your confidence level in the conclusion.",
    },
    t3: {
      prompt: "Write the conclusion in a form suitable for your final report or submission — precise, evidence-based, and honest about the degree of confidence it warrants.",
      tool: "write",
      title: "Write It for the Record",
      subheader: "Write the conclusion in a form suitable for your final report or submission: precise, evidence-based, and honest about the degree of confidence it warrants.",
    },
  },
  {
    stage: 6,
    checkpoint: 2,
    name: "Refinements identified",
    outcome: "Specific, actionable changes that would make a second version of this Lab stronger are documented.",
    title: "Map the Better Route",
    subheader: "The crossroads becomes useful once you know which paths lead nowhere. Document the specific changes that would make a second version of this Lab stronger.",
    standardTagline: "The next expedition knows what this one could not see. The road ahead is better mapped.",
    goldTagline: "Every refinement documented in specific terms. The follow-up is already better planned.",
    t1: {
      prompt: "List at least three specific changes you would make if you ran or built this Lab again — to the design, procedure, materials, measurement approach, or execution.",
      tool: "write",
      title: "List the Refinements",
      subheader: "List at least three specific changes you would make if you ran or built this Lab again, to the design, procedure, materials, measurement approach, or execution.",
    },
    t2: {
      prompt: "Build a refinements table — listing each change, what problem or limitation it addresses, and what improvement in the output you would expect from it.",
      tool: "table",
      title: "Build the Refinements Table",
      subheader: "Build a refinements table listing each change, what problem or limitation it addresses, and what improvement in the output you would expect from it.",
    },
    t3: {
      prompt: "Write a follow-up Lab proposal — a short description of what you would do next, why, and what you would expect to find or build — based specifically on what this Lab revealed.",
      tool: "write",
      title: "Write the Follow-Up Proposal",
      subheader: "Write a short follow-up Lab proposal describing what you would do next, why, and what you would expect to find or build, based specifically on what this Lab revealed.",
    },
  },
  {
    stage: 6,
    checkpoint: 3,
    name: "Refinement applied or design updated",
    outcome: "Either an improved version has been run or built, or the design and conclusions have been formally updated to reflect what was learned.",
    title: "Take the Better Road",
    subheader: "One road leads forward and the Merchant cannot sell a map against what has already been built. Apply the refinement or formally update the design.",
    standardTagline: "The second attempt has been made or the first honestly updated. The work is improved.",
    goldTagline: "The refinement is complete. The two versions stand side by side for honest comparison.",
    t1: {
      prompt: "Document the specific change you made — whether you revised the design, updated the procedure, or ran a follow-up — and explain what triggered that decision.",
      tool: "write",
      title: "Document the Change Made",
      subheader: "Document the specific change you made, whether you revised the design, updated the procedure, or ran a follow-up, and explain what triggered that decision.",
    },
    t2: {
      prompt: "Build a comparison table showing the outcome of your refined run or updated design versus the original — noting what changed and whether it resolved the issue you set out to address.",
      tool: "table",
      title: "Compare the Two Versions",
      subheader: "Build a comparison table showing the outcome of your refined run or updated design versus the original, noting what changed and whether it resolved the issue you set out to address.",
    },
    t3: {
      prompt: "Upload the output or documentation from your refined version — so the two versions can be directly compared side by side.",
      tool: "upload",
      title: "Upload the Refined Output",
      subheader: "Upload the output or documentation from your refined version so the two versions can be directly compared side by side.",
    },
  },
  {
    stage: 7,
    checkpoint: 1,
    name: "Full Lab report written",
    outcome: "A complete written record of the Lab exists as a single document — covering all stages from brief to conclusion.",
    title: "Fill the Grand Hall with Sound",
    subheader: "The Silencer absorbs every finding that goes unwritten. Compile the full Lab report so nothing the work produced is lost.",
    standardTagline: "The expedition's full account has been written. Every stage of the journey is in the record.",
    goldTagline: "The report is complete and coherent. A stranger could read it and understand what was done.",
    t1: {
      prompt: "Compile all documented sections into a single report with consistent structure and clear headings — confirming it tells the full story of the Lab in order from brief to conclusion.",
      tool: "write",
      title: "Compile the Full Report",
      subheader: "Compile all documented sections into a single report with consistent structure and clear headings, confirming it tells the full story of the Lab in order from brief to conclusion.",
    },
    t2: {
      prompt: "Build a report completeness table — listing every required section, confirming it is present, and noting its approximate length or depth.",
      tool: "table",
      title: "Check the Report's Completeness",
      subheader: "Build a report completeness table listing every required section, confirming it is present, and noting its approximate length or depth.",
    },
    t3: {
      prompt: "Upload the complete report as a file — the final version that could be submitted or shared as is.",
      tool: "upload",
      title: "Upload the Final Report",
      subheader: "Upload the complete report as a file, the final version that could be submitted or shared as is.",
    },
  },
  {
    stage: 7,
    checkpoint: 2,
    name: "Presentation or demonstration prepared",
    outcome: "An audience-facing format of the Lab is ready — whether a slide deck, physical exhibit, demo, or walkthrough.",
    title: "Prepare the Presentation",
    subheader: "The Silencer makes demonstrations fail and voices inaudible. Shape your findings for an audience that was not there.",
    standardTagline: "The grand hall has been prepared. The findings have been shaped for those who were not there.",
    goldTagline: "The presentation is ready for the largest audience. Every finding is clear.",
    t1: {
      prompt: "Describe your presentation or demonstration — what format it takes, how many sections or slides it has, and what each one covers.",
      tool: "write",
      title: "Write the Presentation Plan",
      subheader: "Write a short plan for your presentation or demonstration: what you will show, in what order, and how long each section will take.",
    },
    t2: {
      prompt: "Upload your presentation file, a photo of your physical exhibit, or a screen recording of your demo — so it exists here as a record before you present.",
      tool: "upload",
      title: "Send the Presentation",
      subheader: "Upload your presentation file, a photo of your physical exhibit, or a screen recording of your demo, so it exists here as a record before you present.",
    },
    t3: {
      prompt: "Run through your presentation or demo and log any moment where you couldn't explain something clearly without reading from your notes — then fix those moments and confirm in a journal entry.",
      tool: "journal",
      title: "Confirm It Runs Clean",
      subheader: "Run through your presentation or demo and log any moment where you could not explain something clearly without reading from your notes. Fix those moments and confirm in a journal entry.",
    },
  },
  {
    stage: 7,
    checkpoint: 3,
    name: "Lab shared and questions engaged with",
    outcome: "The work has been communicated to at least one audience — evaluator, peer group, or external viewer — and questions or feedback have been received and responded to.",
    title: "Make the Hall Ring",
    subheader: "The Silencer shatters when the findings are heard clearly by real people. Share your work and answer every question until it lives in the community's memory.",
    standardTagline: "The hall has heard. Questions have been answered. The work is part of the record.",
    goldTagline: "Every question answered, every response documented. The work lives in the community's memory.",
    t1: {
      prompt: "Document at least three questions or comments you received when you shared or presented the Lab — and write your response to each.",
      tool: "write",
      title: "Confirm the Work Was Shared",
      subheader: "Confirm how and where you shared your Lab, who the audience was, and how they engaged with it.",
    },
    t2: {
      prompt: "Build a feedback log table from your presentation or sharing — noting who gave each piece of feedback, what they said, whether it was about the method, the result, or the presentation, and how you responded.",
      tool: "table",
      title: "Document the Questions and Responses",
      subheader: "Build a table listing the main questions or challenges raised during sharing and how you responded to each.",
    },
    t3: {
      prompt: "Write a reflection on how the audience responded — what surprised you, what you could not fully answer, and what you would address differently in how you ran or presented this Lab next time.",
      tool: "write",
      title: "Reflect on the Response",
      subheader: "Write a short reflection on how the audience received the work: what they found most significant, what they challenged, and what you would communicate differently next time.",
    },
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
  low: 0.02,
  standard: 0.08,
  high: 0.15,
} as const;

/** Total lab checkpoints */
export const LAB_TOTAL_CHECKPOINTS = 25; // 3+3+4+4+5+3+3
