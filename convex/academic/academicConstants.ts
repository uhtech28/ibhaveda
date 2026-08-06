/**
 * academicConstants.ts
 *
 * Academic template — stage, checkpoint, and task definitions.
 * Mirrors the structure of ventureConstants.ts (CHECKPOINT_DEFINITIONS).
 *
 * 6 stages, 24 total checkpoints.
 * Each checkpoint has T1/T2/T3 tasks.
 *
 * Quality Metric: JIF Score (always increases, higher is better)
 */

// ─────────────────────────────────────────────────────────────────────────────
// STAGES
// ─────────────────────────────────────────────────────────────────────────────

export const ACADEMIC_STAGES = [
  { id: 1, name: "Topic & Question", checkpoints: 3, biomeName: "Ancient Library" },
  { id: 2, name: "Literature Review", checkpoints: 5, biomeName: "Ruins" },
  { id: 3, name: "Methodology", checkpoints: 3, biomeName: "Cartographer's Tower" },
  { id: 4, name: "Writing & Drafting", checkpoints: 6, biomeName: "Scriptorium" },
  { id: 5, name: "Review & Revision", checkpoints: 4, biomeName: "Council Chamber" },
  { id: 6, name: "Submission & Publication", checkpoints: 3, biomeName: "Grand Archive" },
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

interface AcademicCheckpointDef {
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

export const ACADEMIC_CHECKPOINT_DEFINITIONS: AcademicCheckpointDef[] = [
  {
    stage: 1,
    checkpoint: 1,
    name: "Area of interest identified",
    outcome: "A broad academic domain is named and justified",
    title: "Choose Your Wing of the Library",
    subheader: "The Librarian has misfiled centuries of questions. Step into the right section and name the broad area your work will inhabit.",
    standardTagline: "The scholar has entered the library and chosen a wing. The search has a home.",
    goldTagline: "The wing is chosen with full knowledge of its scope. The search begins from solid ground.",
    t1: {
      prompt: "Can you write a short paragraph describing the broad area you want to work in and what draws you to it?",
      tool: "write",
      title: "Enter the Stacks",
      subheader: "Write a short paragraph describing the broad area you want to work in and what draws you to it.",
    },
    t2: {
      prompt: "Can you build a topic exploration table — listing at least three specific sub-topics within your area, what makes each interesting, and what kind of question each might support?",
      tool: "table",
      title: "Survey the Wing",
      subheader: "Build a topic exploration table listing at least three specific sub-topics within your area, what makes each interesting, and what kind of question each might support.",
    },
    t3: {
      prompt: "Can you find and link at least three recent academic publications in your area — and for each one write a sentence on what debate or question it is contributing to?",
      tool: "link",
      title: "Read the Recent Accessions",
      subheader: "Find and link at least three recent academic publications in your area, and for each write a sentence on what debate or question it is contributing to.",
    },
  },
  {
    stage: 1,
    checkpoint: 2,
    name: "Gap in knowledge found",
    outcome: "Something not yet well understood or argued is located within the area",
    title: "Find the Missing Shelf",
    subheader: "The Librarian hides the truly interesting questions behind the mundane ones. Locate the genuine gap in what the library currently holds.",
    standardTagline: "A missing shelf has been found — a question the library does not yet hold an answer to.",
    goldTagline: "The missing shelf is precisely located and its absence documented. The gap is real and valuable.",
    t1: {
      prompt: "Can you describe a question, tension, or absence you've noticed in your area — something that doesn't seem to have a clear or satisfying answer yet?",
      tool: "write",
      title: "Spot the Absence",
      subheader: "Describe a question, tension, or absence you have noticed in your area: something that does not yet have a clear or satisfying answer.",
    },
    t2: {
      prompt: "Can you build a sources comparison table — listing at least three sources that approach your area from different angles and noting where they disagree, contradict each other, or leave something unexplored?",
      tool: "table",
      title: "Chart Where Scholars Disagree",
      subheader: "Build a sources comparison table listing at least three sources that approach your area from different angles, noting where they disagree, contradict each other, or leave something unexplored.",
    },
    t3: {
      prompt: "Can you write a gap statement — a paragraph that explains what is currently known, what is not known or contested, and why that gap matters to the field?",
      tool: "write",
      title: "Write the Gap Statement",
      subheader: "Write a paragraph explaining what is currently known, what is not known or contested, and why that gap matters to the field.",
    },
  },
  {
    stage: 1,
    checkpoint: 3,
    name: "Research question formed",
    outcome: "A precise, answerable research question exists",
    title: "Hone the Question",
    subheader: "A question blunt enough to be answered by anyone is too blunt for scholarship. Sharpen yours until only genuine inquiry can answer it.",
    standardTagline: "The question has been written on a clean page. It is sharp enough to cut through uncertainty.",
    goldTagline: "The question is honed to its finest edge. It could not be sharper. The library awaits its answer.",
    t1: {
      prompt: "Can you write your research question in a single clear sentence — specific enough to be answerable and open enough to require genuine inquiry?",
      tool: "write",
      title: "Write the Question",
      subheader: "Write your research question in a single clear sentence, specific enough to be answerable and open enough to require genuine inquiry.",
    },
    t2: {
      prompt: "Can you test your research question against three criteria in a table: is it researchable with available sources, is it specific enough to be answered, and is it genuinely open? Note your assessment for each.",
      tool: "table",
      title: "Test Its Edge",
      subheader: "In a table, test your question against three criteria: is it researchable with available sources, specific enough to be answered, and genuinely open? Note your assessment for each.",
    },
    t3: {
      prompt: "Can you write a significance paragraph — explaining what would be gained by answering this question and who would benefit from knowing the answer?",
      tool: "write",
      title: "Argue Its Worth",
      subheader: "Write a significance paragraph explaining what would be gained by answering this question and who would benefit from knowing the answer.",
    },
  },
  {
    stage: 2,
    checkpoint: 1,
    name: "Search strategy defined",
    outcome: "A clear plan for finding relevant sources is documented",
    title: "Draw the Search Map",
    subheader: "The Keeper of Incomplete Records hid half the archive. Plan your search strategy before the Ruins swallow your trail.",
    standardTagline: "The scholar has a map of the library and knows which shelves to search first.",
    goldTagline: "The map is precise and complete. Every shelf, every archive, every search term accounted for.",
    t1: {
      prompt: "Can you list the key search terms, phrases, and synonyms you will use — derived directly from your research question?",
      tool: "write",
      title: "Name the Search Terms",
      subheader: "List the key search terms, phrases, and synonyms you will use, derived directly from your research question.",
    },
    t2: {
      prompt: "Can you build a search strategy table — listing each database or archive you will search, the terms you will use in each, and any filters you will apply such as date range or peer-reviewed only?",
      tool: "table",
      title: "Map the Archive",
      subheader: "Build a search strategy table listing each database or archive you will search, the terms you will use in each, and any filters you will apply such as date range or peer-reviewed only.",
    },
    t3: {
      prompt: "Can you link the four databases or archives you've chosen and confirm you have access to each?",
      tool: "link",
      title: "Confirm the Access Points",
      subheader: "Link the four databases or archives you have chosen and confirm you have access to each.",
    },
  },
  {
    stage: 2,
    checkpoint: 2,
    name: "Core sources gathered",
    outcome: "The most relevant existing work is collected and documented",
    title: "Pull the Core Scrolls",
    subheader: "The Ruins hold the field's knowledge in fragments. Recover the most relevant existing work before the Keeper buries it again.",
    standardTagline: "The relevant scrolls have been pulled from their shelves and laid on the reading table.",
    goldTagline: "Every relevant scroll is found, retrieved, and arranged. The table holds the field's full weight.",
    t1: {
      prompt: "Can you list at least ten sources directly relevant to your research question — with a one-sentence note on what each one contributes?",
      tool: "write",
      title: "List the Relevant Works",
      subheader: "List at least ten sources directly relevant to your research question, with a one-sentence note on what each contributes.",
    },
    t2: {
      prompt: "Can you build a source log table — listing each source with its author, date, type, relevance rating (high/medium/low), and a note on its key argument?",
      tool: "table",
      title: "Build the Source Log",
      subheader: "Build a source log table listing each source with its author, date, type, relevance rating, and a note on its key argument.",
    },
    t3: {
      prompt: "Can you link the two anchor sources — the foundational works the conversation in your area keeps returning to — and write a paragraph explaining why each is considered important?",
      tool: "link",
      title: "Name the Anchor Texts",
      subheader: "Link the two foundational works the field keeps returning to, and write a paragraph explaining why each is considered central.",
    },
  },
  {
    stage: 2,
    checkpoint: 3,
    name: "Sources critically evaluated",
    outcome: "The quality, relevance and credibility of each source is assessed",
    title: "Separate Sound from Rubble",
    subheader: "The Keeper left only fragments, some true, some corrupted. Read each source with honest eyes and assess what it is actually worth.",
    standardTagline: "The scrolls have been read carefully. The sound ones are marked. The flawed ones are noted.",
    goldTagline: "Every scroll read with rigorous care. The sound are marked gold, the flawed annotated honestly.",
    t1: {
      prompt: "Can you review each source and classify it as highly relevant, somewhat relevant, or background only — with a brief reason for each?",
      tool: "write",
      title: "Sort by Relevance",
      subheader: "Review each source and classify it as highly relevant, somewhat relevant, or background only, with a brief reason for each.",
    },
    t2: {
      prompt: "Can you build an evaluation table for your top ten sources — covering argument, methodology, credibility, limitations, and relevance to your specific question?",
      tool: "table",
      title: "Evaluate the Best Ten",
      subheader: "Build an evaluation table for your top ten sources covering argument, methodology, credibility, limitations, and relevance to your specific question.",
    },
    t3: {
      prompt: "Can you identify at least two sources with significant limitations and write a paragraph on each explaining what those limitations mean for how you will use them?",
      tool: "write",
      title: "Name the Flawed Witnesses",
      subheader: "Identify at least two sources with significant limitations and write a paragraph on each explaining what those limitations mean for how you will use them.",
    },
  },
  {
    stage: 2,
    checkpoint: 4,
    name: "Themes and arguments mapped",
    outcome: "The major patterns and debates in the existing literature are visible",
    title: "See the Field's Shape",
    subheader: "The Ruins only reveal their true structure once the fragments are arranged. Map the major patterns and disputes in the literature.",
    standardTagline: "The scrolls have been arranged into their true groupings. The field's shape is visible.",
    goldTagline: "The arrangement is complete and the field's true shape — its agreements, its battles — is fully seen.",
    t1: {
      prompt: "Can you identify at least three major themes that run across your sources and write a short description of each?",
      tool: "write",
      title: "Name the Themes",
      subheader: "Identify at least three major themes that run across your sources and write a short description of each.",
    },
    t2: {
      prompt: "Can you map the literature on the canvas — grouping sources by theme, showing which ones agree, which disagree, and which build on others?",
      tool: "map",
      title: "Map the Landscape",
      subheader: "On the canvas, group sources by theme, showing which ones agree, which disagree, and which build on others.",
    },
    t3: {
      prompt: "Can you describe the main debate in your literature — the key disagreement between scholars — and build a table showing which sources sit on each side and why?",
      tool: "table",
      title: "Name the Central Dispute",
      subheader: "Describe the main debate in your literature and build a table showing which sources sit on each side and why.",
    },
  },
  {
    stage: 2,
    checkpoint: 5,
    name: "Your contribution positioned",
    outcome: "Where your work sits relative to existing literature is articulated",
    title: "Mark Your Desk in the Library",
    subheader: "Find your exact place among the existing work and articulate the specific contribution only you can make.",
    standardTagline: "The scholar has found their desk in the library — the exact place where their work belongs.",
    goldTagline: "The desk is placed with precision. The scholar's contribution is positioned in the field's full context.",
    t1: {
      prompt: "Can you write a paragraph that summarises the state of existing knowledge and ends by identifying the specific gap your work will address?",
      tool: "write",
      title: "Situate the Work",
      subheader: "Write a paragraph summarising the state of existing knowledge and ending by identifying the specific gap your work will address.",
    },
    t2: {
      prompt: "Can you map your contribution on the canvas — showing the existing landscape of arguments and marking exactly where your work sits relative to them?",
      tool: "map",
      title: "Place Yourself on the Map",
      subheader: "On the canvas, map the existing landscape of arguments and mark exactly where your work sits relative to them.",
    },
    t3: {
      prompt: "Can you write the opening paragraph of your literature review — the version that would appear in your finished piece — that situates your work and makes the case for your contribution?",
      tool: "write",
      title: "Write the Opening",
      subheader: "Write the opening paragraph of your literature review, the version that would appear in your finished piece, situating your work and making the case for your contribution.",
    },
  },
  {
    stage: 3,
    checkpoint: 1,
    name: "Research approach chosen",
    outcome: "A broad methodological direction is selected and justified",
    title: "Choose the Right Instrument",
    subheader: "The Cartographer of Crooked Maps sends every expedition the wrong way. Select a methodological approach that genuinely fits your question and justify that choice.",
    standardTagline: "The cartographer has chosen the instrument. The measurement will be made this way and no other.",
    goldTagline: "The instrument is chosen with full justification. Every alternative was considered and set aside.",
    t1: {
      prompt: "Can you write two sentences identifying your methodological approach — qualitative, quantitative, mixed, or theoretical — and explaining why it suits your research question?",
      tool: "write",
      title: "Name the Approach",
      subheader: "Write two sentences identifying your methodological approach, qualitative, quantitative, mixed, or theoretical, and explaining why it suits your research question.",
    },
    t2: {
      prompt: "Can you build a methods comparison table — showing the two or three most plausible approaches for your question, what each would produce, and why you chose yours over the alternatives?",
      tool: "table",
      title: "Compare the Alternatives",
      subheader: "Build a methods comparison table showing the two or three most plausible approaches for your question, what each would produce, and why you chose yours over the others.",
    },
    t3: {
      prompt: "Can you write a paragraph defending your methodological choice — explaining not just what approach you're taking but why alternative approaches would be less appropriate for this specific question?",
      tool: "write",
      title: "Defend the Choice",
      subheader: "Write a paragraph defending your methodological choice, explaining not just what you are doing but why the alternatives would be less appropriate for this specific question.",
    },
  },
  {
    stage: 3,
    checkpoint: 2,
    name: "Method designed in detail",
    outcome: "The specific method is fully planned and documented",
    title: "Calibrate the Instruments",
    subheader: "A slightly wrong instrument sends the expedition off course without it ever knowing. Plan your method in full, precise detail.",
    standardTagline: "The procedure is drawn. Every step, every measurement, every source — accounted for.",
    goldTagline: "The procedure is drawn to exact specification. Another scholar could follow it without a word of guidance.",
    t1: {
      prompt: "Can you describe your method step by step — what you will do, in what order, and what you will produce at each step?",
      tool: "write",
      title: "Write the Procedure",
      subheader: "Describe your method step by step: what you will do, in what order, and what you will produce at each stage.",
    },
    t2: {
      prompt: "Can you build a sources and materials table — listing the data sources, texts, or cases your method relies on, why each was chosen, and where it can be accessed?",
      tool: "table",
      title: "Name the Sources",
      subheader: "Build a sources and materials table listing the data sources, texts, or cases your method relies on, why each was chosen, and where it can be accessed.",
    },
    t3: {
      prompt: "Can you write a short ethics note — covering consent if applicable, potential biases in your sources or approach, and how you will handle each?",
      tool: "write",
      title: "Note the Ethical Conditions",
      subheader: "Write a short ethics note covering consent if applicable, potential biases in your sources or approach, and how you will handle each.",
    },
  },
  {
    stage: 3,
    checkpoint: 3,
    name: "Methodology justified",
    outcome: "A written argument for why this method is right for this question exists",
    title: "True the Map",
    subheader: "No expedition launches on a crooked map. Write the full methodology and have it tested by eyes other than your own.",
    standardTagline: "The cartographer has explained why this instrument and no other. The tower's council is satisfied.",
    goldTagline: "The justification is complete and withstands every challenge. The method is beyond reasonable doubt.",
    t1: {
      prompt: "Can you write your methodology section in full — covering your approach, your specific method, your sources, your analytical framework, and the limitations of your method?",
      tool: "write",
      title: "Write the Methodology Section",
      subheader: "Write your methodology section in full, covering your approach, specific method, sources, analytical framework, and the limitations of your method.",
    },
    t2: {
      prompt: "Can you link at least two sources from your literature review that use a similar method and write a note comparing your application to theirs?",
      tool: "link",
      title: "Find the Precedents",
      subheader: "Link at least two sources from your literature review that use a similar method, and write a note comparing your application to theirs.",
    },
    t3: {
      prompt: "Can you share your methodology section with one other person and ask them to identify any step that is unclear, ambiguous, or missing — then write a note on what they found and how you responded?",
      tool: "self_report",
      title: "Submit to Outside Eyes",
      subheader: "Share your methodology with one other person, ask them to identify any step that is unclear or missing, and write a note on what they found and how you responded.",
    },
  },
  {
    stage: 4,
    checkpoint: 1,
    name: "Structure outlined",
    outcome: "A detailed outline of the full piece exists",
    title: "Divide the Parchment",
    subheader: "The Blank Page Wraith grows stronger the longer the page stays empty. Break that silence by outlining the full structure before a single sentence is written.",
    standardTagline: "The blank parchment has been divided. Every section knows its purpose before a word is written.",
    goldTagline: "The outline is fully mapped. The argument's architecture is sound before a stone is laid.",
    t1: {
      prompt: "Can you write a section-by-section outline — listing every heading and sub-heading with one sentence describing what each section will argue or cover?",
      tool: "write",
      title: "Write the Outline",
      subheader: "Write a section-by-section outline listing every heading and sub-heading with one sentence describing what each will argue or cover.",
    },
    t2: {
      prompt: "Can you map the logical flow of your argument on the canvas — showing how each section leads to the next and how they all combine to answer your research question?",
      tool: "map",
      title: "Map the Argument's Flow",
      subheader: "On the canvas, map the logical flow of your argument, showing how each section leads to the next and how they combine to answer your research question.",
    },
    t3: {
      prompt: "Can you share your outline with one reader and ask them to identify any gaps, logical jumps, or unclear sections — then document what they found?",
      tool: "self_report",
      title: "Test the Structure",
      subheader: "Share your outline with one reader and ask them to identify any gaps, logical jumps, or unclear sections. Document what they found.",
    },
  },
  {
    stage: 4,
    checkpoint: 2,
    name: "Introduction drafted",
    outcome: "The opening section is written and contextualises the work",
    title: "Break the Silence",
    subheader: "Every word written diminishes the Wraith. Draft the introduction and set the reader's bearings before the parchment overwhelms you.",
    standardTagline: "The first words have been spoken into the silence. The scriptorium has broken its fast.",
    goldTagline: "The introduction is complete and compelling. The reader is drawn in from the first sentence.",
    t1: {
      prompt: "Can you draft an introduction that opens with broader context, narrows to your specific topic, states your research question, and signals your contribution?",
      tool: "write",
      title: "Draft the Opening",
      subheader: "Write an introduction that opens with broader context, narrows to your specific topic, states your research question, and signals your contribution.",
    },
    t2: {
      prompt: "Can you check your introduction against a table of requirements — context established, topic narrowed, question stated, contribution signalled, thesis clear — marking each as present or missing?",
      tool: "table",
      title: "Check the Requirements",
      subheader: "In a table, check your introduction against five criteria: context established, topic narrowed, question stated, contribution signalled, and thesis clear. Mark each present or missing.",
    },
    t3: {
      prompt: "Can you share your introduction with one reader and ask them whether a person reading only the first paragraph would understand the topic and significance — document their response?",
      tool: "self_report",
      title: "Test the First Impression",
      subheader: "Share your introduction with one reader and ask whether a person reading only the first paragraph would understand the topic and its significance. Document their response.",
    },
  },
  {
    stage: 4,
    checkpoint: 3,
    name: "Literature review section drafted",
    outcome: "The literature review is written as a coherent section of the piece",
    title: "Survey the Field in Prose",
    subheader: "The Wraith shrinks with every section filled. Draft the literature review as a coherent argument, not a procession of summaries.",
    standardTagline: "The field has been surveyed in prose. The scroll of existing knowledge is complete.",
    goldTagline: "The survey is written with full command. Every source placed correctly, every gap clearly named.",
    t1: {
      prompt: "Can you draft the literature review section — organising your sources into themes and writing a narrative that moves through those themes rather than summarising sources one by one?",
      tool: "write",
      title: "Write the Literature Review",
      subheader: "Draft the literature review section, organising your sources into themes and writing a narrative that moves through those themes rather than summarising each source in turn.",
    },
    t2: {
      prompt: "Can you check that your literature review ends by clearly articulating the gap your work addresses — write a note confirming how the final paragraph connects to your research question?",
      tool: "write",
      title: "Confirm the Bridge to Your Gap",
      subheader: "Check that your literature review ends by clearly articulating the gap your work addresses. Write a note confirming how the final paragraph connects to your research question.",
    },
    t3: {
      prompt: "Can you build a citation check table — listing every source cited in your literature review and confirming each one appears in your source log and is accurately described?",
      tool: "table",
      title: "Run the Citation Check",
      subheader: "Build a citation check table listing every source cited in your literature review and confirming each appears in your source log and is accurately described.",
    },
  },
  {
    stage: 4,
    checkpoint: 4,
    name: "Methodology section drafted",
    outcome: "The methodology section is written as a coherent section of the piece",
    title: "Inscribe the Method",
    subheader: "The Wraith cannot follow a scholar at work. Draft the methodology section with enough precision that another could follow every step.",
    standardTagline: "The procedure has been put into words. Another scholar could follow this map.",
    goldTagline: "The methodology section is written with the precision of a master cartographer. Nothing is assumed.",
    t1: {
      prompt: "Can you draft the methodology section — covering your approach, your specific method, and your data sources in clear, precise language?",
      tool: "write",
      title: "Write the Methodology",
      subheader: "Draft the methodology section covering your approach, your specific method, and your data sources in clear, precise language.",
    },
    t2: {
      prompt: "Can you write a limitations paragraph for your methodology section — identifying what could affect the credibility of your findings and how you have minimised each limitation?",
      tool: "write",
      title: "Write the Limitations Paragraph",
      subheader: "Write a limitations paragraph for your methodology section, identifying what could affect the credibility of your findings and how you have minimised each limitation.",
    },
    t3: {
      prompt: "Can you ask someone unfamiliar with your research to read your methodology and tell you whether they could follow what you did — document their response and any changes you made as a result?",
      tool: "self_report",
      title: "The Replication Test",
      subheader: "Ask someone unfamiliar with your research to read your methodology and say whether they could follow what you did. Document their response and any changes you made as a result.",
    },
  },
  {
    stage: 4,
    checkpoint: 5,
    name: "Core argument or findings drafted",
    outcome: "The intellectual heart of the piece is written",
    title: "Lay Down the Argument",
    subheader: "The heart of the work cannot stay unwritten. Draft the central analysis, argument, or findings that the whole piece has been building toward.",
    standardTagline: "The heart of the work has been committed to parchment. The argument breathes.",
    goldTagline: "The argument is written in full and stands without support. It is the work, fully alive.",
    t1: {
      prompt: "Can you draft the central section of your piece — the analysis, argument, or findings — following the structure you outlined and building directly on what the methodology produced?",
      tool: "write",
      title: "Write the Core",
      subheader: "Draft the central section of your piece, the analysis, argument, or findings, following the structure you outlined and building directly on what the methodology produced.",
    },
    t2: {
      prompt: "Can you build a claims and evidence table — listing each major claim in your core section and the specific evidence or source that supports it?",
      tool: "table",
      title: "Map Claims to Evidence",
      subheader: "Build a claims and evidence table listing each major claim in your core section and the specific evidence or source that supports it.",
    },
    t3: {
      prompt: "Can you identify the weakest part of your core argument — where the reasoning is least airtight — and write a revised version of that section with the gap addressed?",
      tool: "write",
      title: "Strengthen the Weakest Joint",
      subheader: "Identify the part of your core argument where the reasoning is least airtight, and write a revised version of that section with the gap addressed.",
    },
  },
  {
    stage: 4,
    checkpoint: 6,
    name: "Conclusion and full draft complete",
    outcome: "The conclusion is written and a complete draft of the piece exists",
    title: "Complete the Scroll",
    subheader: "The Wraith vanishes as the final word is written. Draft the conclusion and confirm the full piece holds together from first word to last.",
    standardTagline: "The scroll has been unrolled end to end. It is complete. It is imperfect. It is real.",
    goldTagline: "The scroll is complete and consistent from first word to last. The draft is worthy of the council.",
    t1: {
      prompt: "Can you write a conclusion that summarises what your piece argued, states clearly what it contributes, and opens a question for future research?",
      tool: "write",
      title: "Write the Conclusion",
      subheader: "Write a conclusion that summarises what your piece argued, states clearly what it contributes, and opens a question for future research.",
    },
    t2: {
      prompt: "Can you read the full draft and check consistency across all sections — write a note confirming that the introduction's promise, the methodology's approach, the argument's content, and the conclusion's summary all align?",
      tool: "self_report",
      title: "Check the Whole Scroll",
      subheader: "Read the full draft and confirm that the introduction's promise, the methodology's approach, the argument's content, and the conclusion's summary all align. Write a note confirming this.",
    },
    t3: {
      prompt: "Can you share the complete draft with at least one reader and ask them one question: does the piece answer the research question it sets out to answer? Document their response.",
      tool: "self_report",
      title: "The Final Question",
      subheader: "Share the complete draft with at least one reader and ask them one question: does the piece answer the research question it sets out to answer? Document their response.",
    },
  },
  {
    stage: 5,
    checkpoint: 1,
    name: "Self-review complete",
    outcome: "The draft has been critically read by its author and weaknesses identified",
    title: "Hear Your Own Council",
    subheader: "The Councillor of False Consensus silences genuine critique. Read your own work as a stranger would and name the weaknesses honestly.",
    standardTagline: "The scholar has read their own work as a stranger would. The weaknesses are not hidden.",
    goldTagline: "Every weakness found and named. The scholar sees their work clearly, without mercy or flattery.",
    t1: {
      prompt: "Can you list at least five specific things you want to improve — being precise about where each issue occurs and what the problem is?",
      tool: "write",
      title: "Name What Is Weak",
      subheader: "List at least five specific things you want to improve, being precise about where each issue occurs and what the problem is.",
    },
    t2: {
      prompt: "Can you build a self-review table — listing each issue, its location in the draft, its type (unsupported claim, logical gap, repetition, unclear writing), and your proposed fix?",
      tool: "table",
      title: "Build the Self-Review Table",
      subheader: "Build a self-review table listing each issue, its location in the draft, its type such as unsupported claim or logical gap, and your proposed fix.",
    },
    t3: {
      prompt: "Can you write the strongest objection a critical reviewer who disagrees with your argument could make — and assess whether your piece adequately answers it?",
      tool: "write",
      title: "Write the Hardest Objection",
      subheader: "Write the strongest objection a critical reviewer who disagrees with your argument could make, and assess whether your piece adequately answers it.",
    },
  },
  {
    stage: 5,
    checkpoint: 2,
    name: "Peer feedback received",
    outcome: "Structured feedback from at least one external reader exists",
    title: "Summon the Council",
    subheader: "The Councillor suppresses genuine critique. Bring in outside voices and record every word they offer, welcome and unwelcome alike.",
    standardTagline: "The council has spoken. Their words — welcome and unwelcome — have been recorded.",
    goldTagline: "Every councillor heard in full. The hardest words as faithfully recorded as the kinder ones.",
    t1: {
      prompt: "Can you share your draft with one person and document what they identified as the single most confusing part and the single strongest part?",
      tool: "self_report",
      title: "Share and Listen",
      subheader: "Share your draft with one person and document what they identified as the single most confusing part and the single strongest part.",
    },
    t2: {
      prompt: "Can you build a feedback log table — listing every piece of feedback you received, who gave it, and whether it relates to argument, structure, evidence, or writing quality?",
      tool: "table",
      title: "Log the Council's Words",
      subheader: "Build a feedback log table listing every piece of feedback received, who gave it, and whether it relates to argument, structure, evidence, or writing quality.",
    },
    t3: {
      prompt: "Can you share your draft with two readers from different backgrounds and document how their feedback differs — and what that difference tells you about your piece?",
      tool: "self_report",
      title: "Hear Two Councils",
      subheader: "Share your draft with two readers from different backgrounds and document how their feedback differs, and what that difference tells you about your piece.",
    },
  },
  {
    stage: 5,
    checkpoint: 3,
    name: "Revisions made",
    outcome: "The draft has been substantively improved based on review",
    title: "Rewrite Where It Needs It",
    subheader: "The scroll is only improved once the changes are actually made. Revise substantively and keep a record of every decision.",
    standardTagline: "The scroll has been rewritten where it needed to be. It is better than it was.",
    goldTagline: "The revisions are complete and documented. Every change made for a reason. The scroll is stronger.",
    t1: {
      prompt: "Can you describe the top three changes you made — what you changed, why, and what specific feedback or observation prompted each one?",
      tool: "write",
      title: "Name the Top Three Changes",
      subheader: "Describe the three most important changes you made: what you changed, why, and what specific feedback or observation prompted each.",
    },
    t2: {
      prompt: "Can you build a revision log table — listing every change made, its type (structural, argumentative, evidential, stylistic), and the feedback or observation that prompted it?",
      tool: "table",
      title: "Keep the Revision Log",
      subheader: "Build a revision log table listing every change made, its type such as structural or argumentative, and the feedback or observation that prompted it.",
    },
    t3: {
      prompt: "Can you confirm that every section of the piece has been revisited — not just the parts flagged in feedback — and describe the most significant change you made that was not prompted by external feedback?",
      tool: "write",
      title: "Revisit the Whole",
      subheader: "Confirm that every section of the piece has been revisited, not just the parts flagged in feedback, and describe the most significant change you made that no external reader prompted.",
    },
  },
  {
    stage: 5,
    checkpoint: 4,
    name: "Final proof and formatting complete",
    outcome: "The piece is line-edited, cited correctly, formatted and ready for submission",
    title: "Present It to the Archive",
    subheader: "The archive admits nothing that is not immaculate. Line-edit, verify every citation, and confirm every formatting requirement is met.",
    standardTagline: "The scroll is clean, the citations are true, the format is correct. It is ready to be filed.",
    goldTagline: "The scroll is immaculate. Every citation verified, every margin measured. It is beyond reproach.",
    t1: {
      prompt: "Can you confirm the piece has been read aloud or through a text-to-speech tool and every awkward sentence fixed — write a note confirming this was done?",
      tool: "self_report",
      title: "Read It Aloud",
      subheader: "Confirm the piece has been read aloud or through a text-to-speech tool and every awkward sentence fixed. Write a note confirming this was done.",
    },
    t2: {
      prompt: "Can you build a citation audit table — listing every in-text citation, confirming it has a corresponding reference entry, and confirming the formatting is consistent?",
      tool: "table",
      title: "Run the Citation Audit",
      subheader: "Build a citation audit table listing every in-text citation, confirming it has a corresponding reference entry, and confirming the formatting is consistent throughout.",
    },
    t3: {
      prompt: "Can you confirm the piece meets every formatting requirement of your target venue — write a checklist note covering margin size, font, spacing, word count, and reference style?",
      tool: "self_report",
      title: "Check Every Requirement",
      subheader: "Confirm the piece meets every formatting requirement of your target venue. Write a checklist note covering margin size, font, spacing, word count, and reference style.",
    },
  },
  {
    stage: 6,
    checkpoint: 1,
    name: "Target venue identified",
    outcome: "The right journal, platform or institution for submission is chosen",
    title: "Find the Right Section",
    subheader: "The Gatekeeper of Unearned Entry turns away work that does not belong. Identify the right venue for this piece before you approach the gate.",
    standardTagline: "The correct section of the grand archive has been identified. This is where the work belongs.",
    goldTagline: "The section is chosen with full knowledge of its scope and standards. The fit is exact.",
    t1: {
      prompt: "Can you describe at least three possible venues — journals, conferences, or platforms — and explain the audience, scope, and submission requirements of each?",
      tool: "write",
      title: "Name the Possibilities",
      subheader: "Describe at least three possible venues, journals, conferences, or platforms, and explain the audience, scope, and submission requirements of each.",
    },
    t2: {
      prompt: "Can you build a venue comparison table — listing each option, its fit with your argument, its submission requirements, its typical turnaround, and your ranking?",
      tool: "table",
      title: "Compare the Options",
      subheader: "Build a venue comparison table listing each option, its fit with your argument, its submission requirements, its typical turnaround, and your ranking.",
    },
    t3: {
      prompt: "Can you link at least three recently published pieces in your chosen venue and write a note confirming your work is consistent with their style, length, and depth?",
      tool: "link",
      title: "Confirm the Fit",
      subheader: "Link at least three recently published pieces in your chosen venue and write a note confirming your work is consistent with their style, length, and depth.",
    },
  },
  {
    stage: 6,
    checkpoint: 2,
    name: "Piece submitted",
    outcome: "The work has been formally submitted to the chosen venue",
    title: "Present the Scroll",
    subheader: "The Gatekeeper's objections vanish when everything is in order. Submit the work with every requirement met and nothing left incomplete.",
    standardTagline: "The scroll has been presented to the archive's keeper. What happens next is in their hands.",
    goldTagline: "The scroll is submitted with full documentation, correctly formatted, on time. Nothing is missing.",
    t1: {
      prompt: "Can you write a cover letter or submission statement — explaining what your piece argues, why it fits this venue, and what contribution it makes — in no more than three paragraphs?",
      tool: "write",
      title: "Write the Cover Letter",
      subheader: "Write a cover letter or submission statement explaining what your piece argues, why it fits this venue, and what contribution it makes, in no more than three paragraphs.",
    },
    t2: {
      prompt: "Can you build a submission checklist table — confirming word count, format, anonymisation if required, cover letter, and submission channel — with a pass or fail for each?",
      tool: "table",
      title: "Run the Submission Checklist",
      subheader: "Build a submission checklist table confirming word count, format, anonymisation if required, cover letter, and submission channel, with a pass or fail for each.",
    },
    t3: {
      prompt: "Can you upload the submission confirmation — an ID, date, or acknowledgement email — as proof the piece has been formally submitted?",
      tool: "upload",
      title: "Upload the Confirmation",
      subheader: "Upload the submission confirmation, an ID, date, or acknowledgement, as proof the piece has been formally submitted.",
    },
  },
  {
    stage: 6,
    checkpoint: 3,
    name: "Response addressed",
    outcome: "Feedback from reviewers or assessors has been received and acted on",
    title: "Answer the Gatekeeper",
    subheader: "The archive only opens fully for those who respond to scrutiny. Address the reviewer's feedback and bring the work to its final form.",
    standardTagline: "The archive's keeper has spoken. Their words have been answered, faithfully and completely.",
    goldTagline: "Every word of the keeper's response has been addressed. The work is better for their scrutiny.",
    t1: {
      prompt: "Can you write a summary of the reviewer or assessor feedback — identifying the top three things they are asking you to address and distinguishing mandatory changes from suggestions?",
      tool: "write",
      title: "Summarise the Verdict",
      subheader: "Write a summary of the reviewer or assessor feedback, identifying the top three things they ask you to address and distinguishing mandatory changes from suggestions.",
    },
    t2: {
      prompt: "Can you build a response table — listing every point raised by reviewers, what you changed in response, and why you didn't change anything you chose to leave as is?",
      tool: "table",
      title: "Build the Response Table",
      subheader: "Build a response table listing every point raised by reviewers, what you changed in response, and why you left anything you chose not to change.",
    },
    t3: {
      prompt: "Can you upload the revised submission or the acceptance confirmation — as proof the response process has been completed?",
      tool: "upload",
      title: "Submit the Final Version",
      subheader: "Upload the revised submission or acceptance confirmation as proof the response process has been completed.",
    },
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
export const ACADEMIC_TOTAL_CHECKPOINTS = 24; // 3+5+3+6+4+3
