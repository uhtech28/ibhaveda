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
  { id: 1, name: "Concept & Inspiration", checkpoints: 3, biomeName: "Sacred Grove" },
  { id: 2, name: "References & Influences", checkpoints: 4, biomeName: "Gallery of Echoes" },
  { id: 3, name: "Drafting & Creation", checkpoints: 6, biomeName: "Wilderness" },
  { id: 4, name: "Feedback & Critique", checkpoints: 3, biomeName: "Village Square" },
  { id: 5, name: "Refinement & Polish", checkpoints: 4, biomeName: "Artisan's Workshop" },
  { id: 6, name: "Release & Sharing", checkpoints: 3, biomeName: "Harbour" },
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

interface CreativeCheckpointDef {
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

export const CREATIVE_CHECKPOINT_DEFINITIONS: CreativeCheckpointDef[] = [
  // Stage 1: Concept & Inspiration — The Sacred Grove · The Silence That Smothers
  {
    stage: 1,
    checkpoint: 1,
    name: "Creative impulse identified",
    outcome: "The raw energy or feeling driving the work is named",
    title: "Break the Silence That Smothers",
    subheader: "The silence makes the creative impulse feel foolish before you have named it. Speak the raw energy driving this work aloud and give it shape.",
    standardTagline: "Something in the grove has spoken. The maker has heard it and named it aloud.",
    goldTagline: "The impulse is named and inscribed in the grove's bark. It cannot be unfelt or forgotten.",
    t1: {
      prompt: "Can you describe the impulse, feeling, experience, or question driving you to make this piece — not polished, just honest?",
      tool: "write",
      title: "Name What Stirred",
      subheader: "Something in the grove has spoken. Write a short description of the creative impulse driving this work: what it is, where it came from, and why it will not leave you alone.",
    },
    t2: {
      prompt: "Can you use the canvas to capture the emotional territory of what you want to make — images, words, colours, textures — anything that maps the feeling rather than describes it?",
      tool: "map",
      title: "Choose the Vessel",
      subheader: "The impulse needs a form to live in. In two sentences, state the form and medium you are working in and why they suit what you are trying to make.",
    },
    t3: {
      prompt: "Can you write a stream-of-consciousness page about what's driving this piece and then highlight the two or three sentences that feel most true?",
      tool: "write",
      title: "Define the Piece",
      subheader: "Give the work a precise description: what it is, what it is about, and what you want it to do or make someone feel. Specific enough that the piece knows what it must become.",
    },
  },
  {
    stage: 1,
    checkpoint: 2,
    name: "Form and medium chosen",
    outcome: "What kind of thing is being made and what it will be made from is decided",
    title: "Choose the Form",
    subheader: "A creative impulse without a vessel stays formless. Commit to the form, medium, and specific concept this work will take.",
    standardTagline: "The grove has suggested a shape. The maker has accepted it. The form is chosen.",
    goldTagline: "The form is chosen with full understanding of its constraints. The impulse and the vessel are matched.",
    t1: {
      prompt: "Can you name the form and medium of your piece and write a sentence explaining why this form feels right for what you want to express?",
      tool: "write",
      title: "Accept the Shape",
      subheader: "Write one sentence stating the form and medium of your piece and a second confirming why that combination suits the impulse you have named.",
    },
    t2: {
      prompt: "Can you build a form comparison table — showing how your creative impulse would work in at least two different forms, and making a deliberate argument for why your chosen form is superior?",
      tool: "table",
      title: "Describe the Piece in Full",
      subheader: "Write a specific description of the piece: what it is, what it is about, and what you want it to do or make a reader or viewer feel.",
    },
    t3: {
      prompt: "Can you identify at least one constraint your chosen form imposes — a word limit, a duration, a physical dimension — and write a note on how that constraint will shape what you make?",
      tool: "write",
      title: "Name What It Must Become",
      subheader: "Write a short note on what success looks like for this piece: the specific effect it should have when it reaches its audience.",
    },
  },
  {
    stage: 1,
    checkpoint: 3,
    name: "Concept defined",
    outcome: "A specific, directional description of what the piece is exists",
    title: "Name It in the Grove",
    subheader: "The silence breaks entirely once the concept has a name. Define the piece precisely enough that it exists before a single word or stroke is made.",
    standardTagline: "The piece has a name and a purpose. It knows what it is, even before it exists.",
    goldTagline: "The concept is defined with clarity and intention. The piece knows exactly what it must become.",
    t1: {
      prompt: "Can you describe your piece in three sentences — what it is about, what form it takes, and what you want someone to feel or think after experiencing it?",
      tool: "write",
      title: "Give It a Name",
      subheader: "Write a working title or name for the piece and a one-sentence description of what it is.",
    },
    t2: {
      prompt: "Can you use the canvas to map the concept — its central tension or question, its emotional arc, and the key moments or elements it will contain?",
      tool: "map",
      title: "State the Concept",
      subheader: "Write a specific description of the piece: what it is, what it is about, and the core feeling or idea at its centre.",
    },
    t3: {
      prompt: "Can you write a one-paragraph artist's statement for the piece as if it were already finished — describing what it is, what it explores, and why you made it?",
      tool: "write",
      title: "Confirm the Intent",
      subheader: "Write a short note on what success looks like when this piece reaches its audience: the specific response or effect you are working toward.",
    },
  },
  // Stage 2: References & Influences — The Gallery of Echoes · The Curator of Derivative Ghosts
  {
    stage: 2,
    checkpoint: 1,
    name: "Influences gathered",
    outcome: "A set of relevant existing works has been collected",
    title: "Enter the Gallery",
    subheader: "The Curator has filled the gallery with copies of copies. Walk past the imitations and find the works that genuinely illuminate what you are making.",
    standardTagline: "The gallery has been entered. The works of those who came before surround the maker.",
    goldTagline: "The gallery is fully populated with genuine influence. Every piece earned its place on the wall.",
    t1: {
      prompt: "Can you list at least six works — in any medium — that feel relevant to what you're making, with a sentence on what each one has in common with your concept?",
      tool: "write",
      title: "Gather the Influences",
      subheader: "List at least five existing works, whether books, films, albums, artworks, or other pieces, that you are drawing on or responding to, with a sentence on why each matters to your work.",
    },
    t2: {
      prompt: "Can you use the canvas to build an influence map — collecting images, excerpts, or references organised by what quality of your concept each one speaks to?",
      tool: "map",
      title: "Study What Each Does",
      subheader: "Build an influences table listing each work, the specific craft decision you are learning from it, and how that decision is relevant to your piece.",
    },
    t3: {
      prompt: "Can you link at least three of your influences — to a streaming platform, an archive, a digital edition, or any accessible source — so they can be experienced directly?",
      tool: "link",
      title: "Find Your Position",
      subheader: "Write a short statement of where your piece sits relative to its influences: what it takes from them, what it departs from, and what it does that none of them do.",
    },
  },
  {
    stage: 2,
    checkpoint: 2,
    name: "Influences analysed",
    outcome: "The craft decisions in the gathered works are examined and documented",
    title: "Examine the Craft",
    subheader: "The Curator fills the gallery with imitations that look like influences but teach nothing. Study the genuine works as a student of craft, not an admirer.",
    standardTagline: "The maker has studied the gallery's works, not as an admirer, but as a student of craft.",
    goldTagline: "Every craft decision understood. The maker can name what each influence does and how.",
    t1: {
      prompt: "Can you pick your three most relevant influences and describe specifically how each one achieves its effect — what choices the creator made and what you can learn from them?",
      tool: "write",
      title: "Analyse One Influence",
      subheader: "Choose one influence and write a close analysis of a specific craft decision it makes: how it opens, how it builds, how it uses its form. What does it do and how does it do it?",
    },
    t2: {
      prompt: "Can you build a craft analysis table — listing each influence, the specific technique or decision you're studying, and how you could adapt it for your own piece?",
      tool: "table",
      title: "Compare Two Approaches",
      subheader: "Choose two influences that handle a similar challenge differently and build a table comparing their approaches, noting what each achieves and what each sacrifices.",
    },
    t3: {
      prompt: "Can you write a detailed craft analysis of one influence — examining how it works, what choices it makes, and why those choices are effective — long enough to reveal something you hadn't noticed before?",
      tool: "write",
      title: "Name What Only You Can Make",
      subheader: "Based on your analysis, write a paragraph defining your creative position: what your piece inherits from these works and what it does that they do not.",
    },
  },
  {
    stage: 2,
    checkpoint: 3,
    name: "Your creative position defined",
    outcome: "Where your piece sits relative to its influences is articulated",
    title: "Clear the Gallery of Ghosts",
    subheader: "The Curator's imitations dilute everything they touch. Replace every derivative ghost with a genuine influence that you actually understand.",
    standardTagline: "The maker has found their place in the gallery — next to some, apart from others, between none.",
    goldTagline: "The position is stated with confidence. The maker knows what is theirs alone to make.",
    t1: {
      prompt: "Can you describe what your piece shares with its influences and what it does differently — naming at least one similarity and one deliberate departure?",
      tool: "write",
      title: "Confirm the Genuine Works",
      subheader: "Review your list of influences and confirm each is a work you have actually engaged with, not one you are referencing by reputation. Note any you need to go back and read, watch, or listen to.",
    },
    t2: {
      prompt: "Can you map your creative position on the canvas — placing your influences around the space and marking where your piece sits relative to them?",
      tool: "map",
      title: "Replace Any Ghost",
      subheader: "If any influence in your list is one you know only by reputation, replace it with a work you genuinely know, and update your influences table accordingly.",
    },
    t3: {
      prompt: "Can you write a positioning statement — describing your piece in relation to at least two influences and making clear what makes it its own thing?",
      tool: "write",
      title: "State the Full Position",
      subheader: "Write a complete creative position statement: the works you are drawing from, what each contributes, and the specific gap or opportunity your piece is working into.",
    },
  },
  {
    stage: 2,
    checkpoint: 4,
    name: "Style and tone decided",
    outcome: "Concrete aesthetic decisions about the piece are documented",
    title: "Hang the Final Gallery",
    subheader: "Every piece in the gallery must earn its wall space. Decide on concrete aesthetic choices for style and tone, and confirm the gallery is authentic.",
    standardTagline: "The maker's hand has found its particular mark. The work will be recognisable as theirs.",
    goldTagline: "The style guide is complete. Every decision is made. The work will be consistent throughout.",
    t1: {
      prompt: "Can you describe the voice, tone, and pace of your piece in five adjectives — and write a sentence for each explaining what it means in practice?",
      tool: "write",
      title: "Decide the Style",
      subheader: "Write a style note for your piece: the specific aesthetic decisions you are committing to in tone, register, pacing, or visual approach.",
    },
    t2: {
      prompt: "Can you build a style guide table — listing at least three concrete decisions about structure, language, visual language, or sound, with a note on how each one serves the concept?",
      tool: "table",
      title: "Build the Style Guide",
      subheader: "Build a style guide table listing each major aesthetic decision, the reason for it, and how it relates to the influences that shaped it.",
    },
    t3: {
      prompt: "Can you use the canvas to create a mood board for your piece — capturing the aesthetic character through images, colours, textures, and references rather than words?",
      tool: "map",
      title: "Confirm the Gallery Is Genuine",
      subheader: "Review every reference and influence you have listed and confirm the gallery as a whole reflects where your piece actually comes from. Write a short note confirming it is complete and authentic.",
    },
  },
  // Stage 3: Drafting & Creation — The Wilderness · The Beast of the Unfinished
  {
    stage: 3,
    checkpoint: 1,
    name: "Structure planned",
    outcome: "The architecture of the piece is mapped before creation begins",
    title: "Map the Wilderness",
    subheader: "The Beast grows on abandoned drafts. Map the architecture of the piece before you enter, so you know which way the path goes even when it twists.",
    standardTagline: "The wilderness has been roughly mapped. The maker knows which way the path goes, even if it twists.",
    goldTagline: "The map is complete and the arc is clear. The maker walks into the wilderness with direction.",
    t1: {
      prompt: "Can you map the structure of your piece on the canvas — its sections, movements, scenes, or components — with a note on what each one does and why it's in that position?",
      tool: "map",
      title: "Sketch the Shape",
      subheader: "Map or outline the overall structure of your piece: its major sections, movements, or chapters, and the rough arc from opening to close.",
    },
    t2: {
      prompt: "Can you write a note tracing the emotional arc through the structure — how you want the audience to feel at the opening, the middle, and the end?",
      tool: "write",
      title: "Trace the Arc",
      subheader: "Write a short description of the emotional or narrative arc: what the piece does to a reader or viewer from start to finish, and how each section serves that movement.",
    },
    t3: {
      prompt: "Can you identify the single most important structural decision you've made and write a paragraph defending why it's the right choice for this piece?",
      tool: "write",
      title: "Name the Hardest Ground",
      subheader: "Identify the part of the piece you are most uncertain about, structurally or creatively, and write a short note on your current thinking for how to cross it.",
    },
  },
  {
    stage: 3,
    checkpoint: 2,
    name: "Opening created",
    outcome: "The beginning of the piece exists in draft form",
    title: "Take the First Step",
    subheader: "The Beast feeds on the unbegun. Write the opening and make the piece real before anything else.",
    standardTagline: "The first step into the wilderness has been taken and recorded. The journey has begun.",
    goldTagline: "The opening is made and it earns the rest. It begins with the right note in the right voice.",
    t1: {
      prompt: "Can you create the opening of your piece and upload it here — the first scene, verse, image, or sequence in whatever format is native to your medium?",
      tool: "upload",
      title: "Write the Opening",
      subheader: "Write the opening of your piece, the first scene, stanza, paragraph, sequence, or movement, however rough.",
    },
    t2: {
      prompt: "Can you write a note on what your opening needs to do — what it must set up for the rest of the piece to work — and check that your draft does those things?",
      tool: "write",
      title: "Read It Back",
      subheader: "Read what you have written and write a short note on what it establishes, what it promises the reader or viewer, and whether it earns what follows.",
    },
    t3: {
      prompt: "Can you create two alternative openings, upload both, and write a short explanation of why one works better?",
      tool: "upload",
      title: "Revise Once",
      subheader: "Make one round of revisions to the opening based on your own assessment. Note the specific change you made and why.",
    },
  },
  {
    stage: 3,
    checkpoint: 3,
    name: "Core of the piece created",
    outcome: "The main body of the piece exists in draft form",
    title: "Cross the Deepest Ground",
    subheader: "The Beast is largest where the work is hardest. Draft the core of the piece and get through the middle.",
    standardTagline: "The deepest part of the wilderness has been traversed. The hardest ground is crossed.",
    goldTagline: "The core is made and it sustains. The middle does not collapse. The highest stakes are met.",
    t1: {
      prompt: "Can you create the middle section of your piece and upload it here — the bulk of the content — following the structure you planned?",
      tool: "upload",
      title: "Draft the Core",
      subheader: "Write the main body of your piece: the middle sections, the central argument, the sustained movement, or the bulk of the work. It does not need to be finished, but it needs to exist.",
    },
    t2: {
      prompt: "Can you identify the moment in your piece where the emotional stakes are highest and write a note confirming it exists in your draft and describing where it falls?",
      tool: "write",
      title: "Check the Tension",
      subheader: "Read what you have drafted and write a note on whether the middle holds its energy or loses it, and what the most significant problem in the draft currently is.",
    },
    t3: {
      prompt: "Can you review the core of your piece, identify the single section that isn't working yet, rewrite it, and upload the revised version alongside the original?",
      tool: "upload",
      title: "Address the Biggest Problem",
      subheader: "Make one targeted revision to the part of the core you identified as weakest, and note what you changed and why.",
    },
  },
  {
    stage: 3,
    checkpoint: 4,
    name: "Ending created",
    outcome: "The conclusion or resolution of the piece exists in draft form",
    title: "Reach the Other Side",
    subheader: "The wilderness is only crossed when you have written the ending. Complete it even if it is not yet right.",
    standardTagline: "The wilderness has been crossed. The other side has been reached. The ending is real.",
    goldTagline: "The ending earns everything that came before it. It was not easy and it is right.",
    t1: {
      prompt: "Can you create the ending of your piece and upload it here — the conclusion, resolution, or final movement?",
      tool: "upload",
      title: "Write the Ending",
      subheader: "Write the closing of your piece, the final scene, stanza, paragraph, sequence, or movement, however rough.",
    },
    t2: {
      prompt: "Can you write a note on how the ending responds to what the opening set up — and whether it earns what came before it?",
      tool: "write",
      title: "Assess the Ending",
      subheader: "Read your ending and write a short note on whether it earns what came before it, and what it currently does not yet do.",
    },
    t3: {
      prompt: "Can you create two alternative endings, upload both, and write a short argument for why one is the right conclusion for this piece?",
      tool: "upload",
      title: "Revise the Ending Once",
      subheader: "Make one round of revisions to the ending. Note the specific change and why you made it.",
    },
  },
  {
    stage: 3,
    checkpoint: 5,
    name: "Full draft assembled",
    outcome: "The complete first draft exists as a single whole",
    title: "Assemble the Whole",
    subheader: "A piece is not complete until it has been read as a whole. Assemble the full draft and see if it holds.",
    standardTagline: "The wilderness has been fully traversed. The creature of the unfinished has starved.",
    goldTagline: "The draft is assembled and complete. It is read as a whole for the first time and it holds.",
    t1: {
      prompt: "Can you upload the complete assembled draft — all sections combined into a single file in whatever format is native to your medium?",
      tool: "upload",
      title: "Assemble the Draft",
      subheader: "Put together all sections into a single complete draft and read it through from beginning to end for the first time.",
    },
    t2: {
      prompt: "Can you experience your piece as an audience member would and write an honest note on your first reaction to it as a whole?",
      tool: "write",
      title: "Write the First Whole-Draft Assessment",
      subheader: "Write a short note on how the piece reads as a whole: what works, what does not, and what the single most important thing to address in revision is.",
    },
    t3: {
      prompt: "Can you share the assembled draft with one trusted person and document their reaction before you explain anything about your intentions?",
      tool: "self_report",
      title: "Name What the Beast Still Threatens",
      subheader: "Identify the part of the draft most at risk of being abandoned or unresolved, and write a short note on your plan for addressing it in revision.",
    },
  },
  {
    stage: 3,
    checkpoint: 6,
    name: "First self-review complete",
    outcome: "The draft has been read critically by its creator and weaknesses noted",
    title: "Starve the Beast",
    subheader: "The Beast starves when the last section is completed. Read your full draft as a stranger would and record what you see.",
    standardTagline: "The maker has looked at the work as a stranger would. What was seen has been recorded without mercy.",
    goldTagline: "Every weakness named, every strength identified. The maker sees the work with clear eyes.",
    t1: {
      prompt: "Can you list at least five specific things in the draft that aren't working — being precise about where each issue occurs and what the problem is?",
      tool: "write",
      title: "Read It as a Stranger",
      subheader: "Read the full draft as if you did not write it and write a short note on your honest first impression: what landed, what did not, and what confused you.",
    },
    t2: {
      prompt: "Can you build a self-review table — listing each issue, its location in the piece, what type of problem it is (structural, tonal, pacing, missing element), and your proposed approach to fixing it?",
      tool: "table",
      title: "List What Needs Work",
      subheader: "Make a list of at least five specific things you want to address in revision, being precise about where each issue occurs in the draft.",
    },
    t3: {
      prompt: "Can you review the draft against the concept you defined in Stage 1 and write a note on any place where the piece has drifted — and whether the drift is a problem or an improvement?",
      tool: "write",
      title: "Confirm the Draft Is Complete",
      subheader: "Confirm in writing that every section of the piece exists in draft form, even if rough, and that nothing has been skipped or left entirely blank.",
    },
  },
  // Stage 4: Feedback & Critique — The Village Square · The Crowd of False Validation
  {
    stage: 4,
    checkpoint: 1,
    name: "Feedback sought",
    outcome: "The draft has been shared with at least one trusted reader",
    title: "Leave the Wilderness",
    subheader: "The Crowd of False Validation applauds everything. Bring the work into the village square and seek feedback that will actually tell you something.",
    standardTagline: "The work has left the wilderness and entered the village square. Other eyes have seen it.",
    goldTagline: "The work was shared with the right people and the right question was asked. The exposure was intentional.",
    t1: {
      prompt: "Can you confirm you've shared your draft with at least one person and write a note on what specific question you asked them to focus on?",
      tool: "self_report",
      title: "Share the Work",
      subheader: "Share the draft with at least one reader, viewer, or listener outside your own head, and document who you shared it with and in what form.",
    },
    t2: {
      prompt: "Can you write a brief context note for your reader — describing what you were trying to do — and document the specific question you asked them to answer?",
      tool: "write",
      title: "Ask the Right Question",
      subheader: "Write a short note on what specific aspect of the piece you most need feedback on, and confirm that is what you asked your reader to focus on.",
    },
    t3: {
      prompt: "Can you share your draft with two people whose perspectives are genuinely different and write a note on what you asked each of them and why you chose them?",
      tool: "self_report",
      title: "Choose the Right Reader",
      subheader: "Write a short note on who you shared the work with and why they are the right person to give you useful feedback on this piece at this stage.",
    },
  },
  {
    stage: 4,
    checkpoint: 2,
    name: "Feedback received and documented",
    outcome: "Feedback is collected and organised by theme",
    title: "Silence the False Crowd",
    subheader: "The false crowd drowns out every real voice. Record every piece of feedback exactly as it was given, before the crowd can drown it.",
    standardTagline: "Every word spoken in the square has been recorded — the welcome and the unwelcome alike.",
    goldTagline: "Every response faithfully documented, grouped, and preserved. Nothing was filtered before recording.",
    t1: {
      prompt: "Can you write down everything your reader said — including the things that surprised you or that you didn't agree with — without filtering or defending?",
      tool: "write",
      title: "Document All Feedback",
      subheader: "Write up or collect every piece of feedback you received, including the parts that were uncomfortable, exactly as they were offered.",
    },
    t2: {
      prompt: "Can you build a feedback log table — listing each piece of feedback, who gave it, what aspect of the piece it addresses, and whether it resonates with you?",
      tool: "table",
      title: "Organise by Type",
      subheader: "Build a feedback table listing each piece of feedback, who gave it, and whether it relates to overall impact, structure, specific moments, or craft details.",
    },
    t3: {
      prompt: "Can you collect feedback from two readers and build a comparison table — showing where they agree, where they diverge, and what that difference tells you about your piece?",
      tool: "table",
      title: "Separate Signal from Noise",
      subheader: "Write a short note on which pieces of feedback you heard from more than one source and which were unique to one reader, and what that pattern tells you.",
    },
  },
  {
    stage: 4,
    checkpoint: 3,
    name: "Feedback interpreted",
    outcome: "The feedback has been processed and a clear sense of what to do with it exists",
    title: "Hear the Real Voices",
    subheader: "Once the false crowd disperses, the real responses can be heard. Interpret the feedback and decide what it means for the work.",
    standardTagline: "The maker has decided what the square's voices mean and what to do with what was heard.",
    goldTagline: "The interpretation is made with judgment. The maker knows what to take and what to leave.",
    t1: {
      prompt: "Can you write a revision plan based on your interpreted feedback — a list of specific changes you intend to make in priority order with a reason for each?",
      tool: "write",
      title: "Interpret the Feedback",
      subheader: "Write a paragraph on what the feedback, taken as a whole, is telling you about the piece: what is working, what is not, and what the most important thing to address is.",
    },
    t2: {
      prompt: "Can you build an interpretation table — marking each piece of feedback as: address it, acknowledge but keep as is, or disagree and why?",
      tool: "table",
      title: "Decide What to Take",
      subheader: "Build a table listing each piece of feedback and marking whether you will act on it, set it aside, or hold it for consideration, with a brief reason for each decision.",
    },
    t3: {
      prompt: "Can you identify the single hardest piece of feedback to hear but most likely to improve the piece — and write a short note on how you'll address it?",
      tool: "write",
      title: "Name the Hardest Note",
      subheader: "Identify the piece of feedback that is hardest to hear but most likely to be right, and write a short note on why it is probably true and what you will do about it.",
    },
  },
  // Stage 5: Refinement & Polish — The Artisan's Workshop · The Perfectionist's Spectre
  {
    stage: 5,
    checkpoint: 1,
    name: "Revision plan made",
    outcome: "A clear decision about what to change, keep and cut exists",
    title: "Open the Workshop",
    subheader: "The Perfectionist's Spectre whispers that nothing is ever good enough. Make a clear revision plan and commit to finishing, not perfecting.",
    standardTagline: "The workshop has a task list. The maker knows what to touch first and what to leave alone.",
    goldTagline: "The plan is complete and prioritised. Every change has a reason. Nothing is random revision.",
    t1: {
      prompt: "Can you write a revision list with at least five specific changes — ordered from largest structural change to smallest detail?",
      tool: "write",
      title: "Write the Revision Plan",
      subheader: "Write a list of every change you intend to make in revision, organised from the most structural to the most fine-grained.",
    },
    t2: {
      prompt: "Can you build a revision plan table — listing each change, its type (structural/tonal/line-level/cut), and the feedback or self-observation that prompted it?",
      tool: "table",
      title: "Prioritise the Work",
      subheader: "Build a revision plan table listing each change, its type such as structural or line-level, its priority, and the feedback or self-assessment that prompted it.",
    },
    t3: {
      prompt: "Can you share your revision plan with your reader and document whether they feel the proposed changes address what they flagged?",
      tool: "self_report",
      title: "Set the Finishing Condition",
      subheader: "Write a short note defining what done looks like for this piece: the specific conditions that will tell you the revision is complete and you are ready to release.",
    },
  },
  {
    stage: 5,
    checkpoint: 2,
    name: "Structural revisions made",
    outcome: "Large-scale changes to the piece have been made first",
    title: "Move the Heavy Timbers",
    subheader: "Structural problems cannot be polished away. Address the large-scale changes first, before the fine-grained work begins.",
    standardTagline: "The heaviest timbers have been moved. The workshop floor is rearranged. The shape is better.",
    goldTagline: "The structural work is done decisively. The piece is stronger at its bones than it was at first making.",
    t1: {
      prompt: "Can you upload the revised version of your piece after structural changes — and write a note describing what you changed and what it did to the piece?",
      tool: "upload",
      title: "Make the Structural Changes",
      subheader: "Make every structural revision on your list: reorder sections, cut or expand major parts, address the overall arc. Document each change you made.",
    },
    t2: {
      prompt: "Can you write a note confirming the structural changes haven't created new inconsistencies — where the piece now contradicts itself or loses its thread?",
      tool: "self_report",
      title: "Confirm the Structure Holds",
      subheader: "Read the piece after structural revision and write a short note confirming the overall arc now works and the major problems have been addressed.",
    },
    t3: {
      prompt: "Can you document what you cut from the piece — listing each removed element and why its removal strengthens the whole?",
      tool: "write",
      title: "Note What Structural Work Remains",
      subheader: "If any structural issue remains unresolved, name it and write a short note on your plan for addressing it before moving to line-level polish.",
    },
  },
  {
    stage: 5,
    checkpoint: 3,
    name: "Line-level polish complete",
    outcome: "Every detail of the piece has been refined",
    title: "Apply the Finest Tools",
    subheader: "The Spectre haunts the bench and whispers of unresolved details. Finish the line-level polish and silence it.",
    standardTagline: "The workshop's finest tools have been applied. Every surface is smooth. Every joint is tight.",
    goldTagline: "Every element is at its finest. The maker has reached the limit of what can be improved at this scale.",
    t1: {
      prompt: "Can you upload the polished version of your piece — after going through line by line, element by element, refining everything that can be sharper or more precise?",
      tool: "upload",
      title: "Polish Every Line",
      subheader: "Work through the piece line by line or detail by detail, refining the language, pacing, or craft elements until each is at its best.",
    },
    t2: {
      prompt: "Can you identify the three weakest moments in the polished piece and upload a revised version of each — showing the before and after?",
      tool: "upload",
      title: "Check for Consistency",
      subheader: "Read the full revised piece and build a short checklist confirming consistency of voice, tense, style, and any recurring element across the whole work.",
    },
    t3: {
      prompt: "Can you record yourself reading or performing the piece aloud and upload the recording — using what you hear to catch anything that doesn't sound right that you couldn't catch by reading silently?",
      tool: "upload",
      title: "Make the Final Cuts",
      subheader: "Identify anything in the piece that does not earn its place, a line, a moment, a detail, and remove or rework it. Write a note on what you cut and why.",
    },
  },
  {
    stage: 5,
    checkpoint: 4,
    name: "Final piece complete",
    outcome: "The piece exists in its intended final form",
    title: "Still the Workshop",
    subheader: "The Spectre dissolves when you decide the work is done. Complete the final piece and let it go.",
    standardTagline: "The workshop is quiet. The piece is done. The maker has let it go. It is enough.",
    goldTagline: "The piece is complete and released from revision. It stands as the fullest expression of the maker's intent.",
    t1: {
      prompt: "Can you upload the final version of your piece — the version that represents your fullest creative intention at this stage?",
      tool: "upload",
      title: "Complete the Final Version",
      subheader: "Make your final revisions and confirm the piece exists in the form you intend to release. Write a note confirming this is the final version.",
    },
    t2: {
      prompt: "Can you write a short note to yourself documenting what this piece taught you — about the subject, about your craft, about the process?",
      tool: "write",
      title: "Read It Once More",
      subheader: "Read the final piece through one last time and write a short note confirming it is ready: that it does what you intended and that further revision would not improve it.",
    },
    t3: {
      prompt: "Can you share the final piece with someone who hasn't seen it before and document what they said they experienced — without you explaining anything?",
      tool: "self_report",
      title: "Write the Release Note",
      subheader: "Write a short note on what this piece is, what it is trying to do, and why you made it, in the form you would share with an audience when you release it.",
    },
  },
  // Stage 6: Release & Sharing — The Harbour · The Harbourmaster of Hesitation
  {
    stage: 6,
    checkpoint: 1,
    name: "Release format prepared",
    outcome: "The piece is packaged in the form it will reach its audience",
    title: "Prepare the Cargo",
    subheader: "The Harbourmaster of Hesitation cites missing packaging and uncertain audiences to keep the work in port. Prepare the release format and choose the audience before a single objection can be raised.",
    standardTagline: "The cargo is wrapped and labelled. It is ready for the harbour in the form the world will receive it.",
    goldTagline: "Two formats prepared and both confirmed correct. The work is packaged for every audience.",
    t1: {
      prompt: "Can you upload the piece in its release format — formatted, exported, or packaged in the form your audience will receive it?",
      tool: "upload",
      title: "Choose the Format",
      subheader: "Decide on the format in which you will release or share the piece and write a short note confirming it is the right form for the audience you have in mind.",
    },
    t2: {
      prompt: "Can you confirm the release format is correct and complete by experiencing it the way your audience will — write a note on anything you found that needed fixing?",
      tool: "self_report",
      title: "Prepare the Release File",
      subheader: "Prepare the piece in its final release format: the document, audio, video, image, or link that you will share. Confirm it is correct and complete.",
    },
    t3: {
      prompt: "Can you prepare a second release format — a digital and print version, or a high-resolution and web-optimised version — and upload both?",
      tool: "upload",
      title: "Name the Audience",
      subheader: "Write a short note on who you are releasing this work to, why they are the right audience for this piece, and what you want them to do or feel when they encounter it.",
    },
  },
  {
    stage: 6,
    checkpoint: 2,
    name: "Audience and channel identified",
    outcome: "Where and to whom the piece will be released is decided",
    title: "Choose the Sea",
    subheader: "The Harbourmaster demands a destination before the gate opens. Name the channel and the audience, and the objection disappears.",
    standardTagline: "The harbour knows which ship and which sea. The work has a destination and a people.",
    goldTagline: "The destination is chosen with full knowledge of the audience and the channel. The fit is right.",
    t1: {
      prompt: "Can you describe the specific audience for this piece and write a note on where that audience currently discovers new work in this form?",
      tool: "write",
      title: "Name the Channel",
      subheader: "Identify the specific platform, venue, community, or context where you will share this piece and write a sentence on why it is the right fit.",
    },
    t2: {
      prompt: "Can you build a channel comparison table — listing at least three possible release channels, the audience each gives you access to, and your reasoning for which to prioritise?",
      tool: "table",
      title: "Confirm the Audience",
      subheader: "Write a short note on who you expect to encounter the work in this channel and what you hope they take from it.",
    },
    t3: {
      prompt: "Can you link the specific platform, publication, or venue you've chosen — and confirm it is the right fit for both the piece and its intended audience?",
      tool: "link",
      title: "Plan the Sharing",
      subheader: "Write a short plan for how you will share the work: when, in what form, with what accompanying message or context, and how you will know it has been received.",
    },
  },
  {
    stage: 6,
    checkpoint: 3,
    name: "Piece released and shared",
    outcome: "The work is publicly available and has been actively shared",
    title: "Let the Ship Sail",
    subheader: "The Harbourmaster bows when the work is in the world. Release the piece and let it go.",
    standardTagline: "The ship has sailed. The work is in the world. The maker watches from the harbour until it disappears.",
    goldTagline: "The work is released, actively shared, and received. The maker has done everything possible. It belongs to the world now.",
    t1: {
      prompt: "Can you link the released piece from this checkpoint — so it is publicly accessible and findable?",
      tool: "link",
      title: "Release the Work",
      subheader: "Share the piece in the channel and format you have prepared. Confirm it has been released and link or upload the evidence.",
    },
    t2: {
      prompt: "Can you document who you shared the piece with — at least ten people actively reached, not just posted and waiting — and write a note on how each responded?",
      tool: "write",
      title: "Document the Initial Response",
      subheader: "Write a short note on the initial response to the work: who saw it, what they said, and how it landed.",
    },
    t3: {
      prompt: "Can you write a short reflection on the release — what happened when the piece met its audience, what surprised you, and what you would do differently in how you shared it?",
      tool: "write",
      title: "Write the Maker's Note",
      subheader: "Write a short reflection on releasing this piece: what it felt like to let it go, what you learned from making it, and what you would do differently next time.",
    },
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
export const CREATIVE_TOTAL_CHECKPOINTS = 23; // 3+4+6+3+4+3
