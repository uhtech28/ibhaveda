// Venture system constants — stages, checkpoints, tasks, bosses, levels, badges
// These are immutable definitions that drive the entire progression system.
import { STAGE_BADGE_DEFINITIONS } from "./stageBadgeDefinitions";

// ─────────────────────────────────────────────────────────────────────────────
// TOOL TYPES
// ─────────────────────────────────────────────────────────────────────────────
export const TOOL_TYPES = [
  "write",
  "table",
  "spreadsheet",
  "map",
  "survey",
  "poll",
  "link",
  "upload",
  "self_report",
  "journal",
  "kanban",
  "calendar",
] as const;
export type ToolType = (typeof TOOL_TYPES)[number];

export const TOOL_INFO: Record<ToolType, { name: string; icon: string }> = {
  write: { name: "Text Editor", icon: "✍️" },
  table: { name: "Data Table", icon: "📊" },
  // "spreadsheet" is the Excel-like jspreadsheet-ce editor used for
  // tasks that need real grid editing (formulas, copy-paste from Excel,
  // resizable rows/cols). Preferred for competitor grids, financial
  // rows, market overview, SWOT. See SpreadsheetTool.
  spreadsheet: { name: "Spreadsheet", icon: "🧮" },
  map: { name: "Mind Map", icon: "🗺️" },
  survey: { name: "Survey Builder", icon: "📋" },
  poll: { name: "Quick Poll", icon: "📊" },
  link: { name: "Link Collector", icon: "🔗" },
  upload: { name: "File Upload", icon: "📎" },
  self_report: { name: "Self Report", icon: "📝" },
  journal: { name: "Journal", icon: "📓" },
  kanban: { name: "Kanban Board", icon: "📌" },
  calendar: { name: "Calendar", icon: "📅" },
};

// ─────────────────────────────────────────────────────────────────────────────
// VENTURE STAGES
// ─────────────────────────────────────────────────────────────────────────────
export const VENTURE_STAGES = [
  { id: 1, name: "Ideation", checkpoints: 4 },
  { id: 2, name: "Research", checkpoints: 5 },
  { id: 3, name: "Validation", checkpoints: 4 },
  { id: 4, name: "Offer Design", checkpoints: 5 },
  { id: 5, name: "Build & Deliver", checkpoints: 6 },
  { id: 6, name: "Launch", checkpoints: 3 },
  { id: 7, name: "Iteration", checkpoints: 4 },
  { id: 8, name: "Scale", checkpoints: 5 },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// CHECKPOINT DEFINITIONS
// Each checkpoint has a stage, number within stage, and 3 tasks (t1/t2/t3)
// ─────────────────────────────────────────────────────────────────────────────
interface TaskDef {
  prompt: string;
  tool: ToolType;
  /** Fantasy-flavored task title (v3 spec) — shown in the checkpoint
   *  panel and task modal header. Optional so legacy consumers can
   *  fall back to `prompt`. */
  title?: string;
  /** Fantasy subheader shown under the task title in the modal. */
  subheader?: string;
}

interface CheckpointDef {
  stage: number;
  checkpoint: number;
  /** Plain checkpoint key used by Convex rows (e.g. "Problem identified"). */
  name: string;
  /** Plain outcome description shown on legacy surfaces. */
  outcome: string;
  /** Fantasy-flavored checkpoint title (v3 spec) — shown on the map HUD
   *  and checkpoint panel header. */
  title?: string;
  /** Fantasy subheader shown under the title. */
  subheader?: string;
  /** Tagline shown when 2/3 tasks complete. */
  standardTagline?: string;
  /** Tagline shown when 3/3 tasks (gold) complete. */
  goldTagline?: string;
  t1: TaskDef;
  t2: TaskDef;
  t3: TaskDef;
}

export const CHECKPOINT_DEFINITIONS: CheckpointDef[] = [
  {
    stage: 1,
    checkpoint: 1,
    name: "Problem identified",
    outcome: "A specific, real pain point is clearly articulated — grounded in who experiences it, when, and what it costs them.",
    title: "Pierce the Fog of Vagueness",
    subheader: "The village can't fight what it can't see. Identify the real pain point and exactly who suffers it.",
    standardTagline: "The village has named its affliction. The fog has a face.",
    goldTagline: "The affliction is named, witnessed, and carved into the village stone. None shall forget what was wrong here.",
    t1: {
      prompt: "Describe the problem you are solving in a short statement — who experiences it, when it occurs, and what it costs them in time, money, or frustration.",
      tool: "write",
      title: "Speak Its Name",
      subheader: "The fog feeds on what goes unnamed. Write a short statement of the problem: who feels it, when it strikes, and what it costs them in time, money, or peace of mind.",
    },
    t2: {
      prompt: "Map out the problem space on the canvas — showing who is affected, what triggers the problem, and what currently happens as a result, without proposing a solution yet.",
      tool: "map",
      title: "Chart the Affliction",
      subheader: "Before any cure, map where the sickness spreads. On the canvas, show who is affected, what triggers the problem, and what currently happens as a result. No solutions yet.",
    },
    t3: {
      prompt: "Find three real-world examples of this problem — from forums, reviews, news, interviews, or direct observation. Add each as a link or upload with a note on what it reveals.",
      tool: "link",
      title: "Gather the Witnesses",
      subheader: "A claim needs those who will swear to it. Find three real-world examples of this problem from forums, reviews, news, or direct observation, and link each with a note on what it reveals.",
    },
  },
  {
    stage: 1,
    checkpoint: 2,
    name: "Problem owner defined",
    outcome: "A specific person or customer who experiences the problem is documented — with enough context to design for them.",
    title: "Find the Burdened Soul",
    subheader: "Every quest is undertaken for someone. Document the specific person who carries this problem daily.",
    standardTagline: "The quest has found its first true soul — the one who carries this burden daily.",
    goldTagline: "The soul is known completely. Their burden, their face, their hour of need — all recorded in the party's tome.",
    t1: {
      prompt: "Write a profile of your target customer — their context, their goals, and the specific moment in their life or work when this problem hits them hardest.",
      tool: "write",
      title: "Name the One Who Suffers",
      subheader: "Write a profile of the soul you are fighting for: their context, their goals, and the exact moment in their life or work when this problem strikes hardest.",
    },
    t2: {
      prompt: "Build a persona card using the table tool — including name, role or context, key frustrations, current workarounds, and what a good solution would feel like to them.",
      tool: "table",
      title: "Carve Their Likeness",
      subheader: "Set their portrait in the party's tome so no one forgets. Build a persona card with their name, role or context, key frustrations, current workarounds, and what a good solution would feel like.",
    },
    t3: {
      prompt: "Create a short survey and share it with at least three real people who fit your target profile — document what they told you about how they currently deal with this problem.",
      tool: "survey",
      title: "Hear Them Speak",
      subheader: "A portrait drawn from imagination lies. Send a short survey to at least three real people who fit your target, and record in their own words how they deal with this problem today.",
    },
  },
  {
    stage: 1,
    checkpoint: 3,
    name: "Solution concept formed",
    outcome: "A proposed approach to the problem for the defined customer exists — described in terms of what it does for them, not how it works.",
    title: "Imagine the Weapon",
    subheader: "Before the forge, the blade must exist in the mind. Describe the solution by what it does, not how it works.",
    standardTagline: "A weapon has been imagined. The forge has not yet touched it, but the shape is known.",
    goldTagline: "The weapon's design is complete. Its purpose is clear. The smith awaits only the order to begin.",
    t1: {
      prompt: "Describe your solution in two or three sentences — what it does for the customer and what problem it removes or reduces, without explaining the mechanics.",
      tool: "write",
      title: "Forge It in the Mind",
      subheader: "In two or three sentences, describe your solution by what it does for the customer and the problem it removes. Name no mechanics yet, only the outcome it delivers.",
    },
    t2: {
      prompt: "Sketch how your solution works on the canvas — showing the core experience from the customer's perspective, what they do, what happens, and what they get.",
      tool: "map",
      title: "Trace Its Edge",
      subheader: "Show how the weapon is wielded, from the customer's side. On the canvas, sketch the core experience: what they do, what happens, and what they walk away with.",
    },
    t3: {
      prompt: "Create a poll asking your target audience which of two or three solution directions appeals most — share it and document the result.",
      tool: "poll",
      title: "Test the Balance",
      subheader: "A weapon ill-suited to the hand fails in battle. Put two or three solution directions to your target audience in a poll, share it, and record which one they reach for.",
    },
  },
  {
    stage: 1,
    checkpoint: 4,
    name: "Idea worth pursuing",
    outcome: "An honest first-pass judgment on viability is documented — covering both the case for and the case against.",
    title: "Accept the Quest",
    subheader: "No worthy party marches blind. Make an honest first call on whether this idea is worth the journey.",
    standardTagline: "The party has weighed the quest and chosen to accept it. The road ahead is long but the cause is just.",
    goldTagline: "The quest is accepted with full eyes open — every risk counted, every reason weighed. The journey begins.",
    t1: {
      prompt: "Write an honest case for and against pursuing this idea — at least three reasons it is worth doing and two reasons it might not work.",
      tool: "write",
      title: "Weigh the Cause",
      subheader: "Write the honest case both ways: at least three reasons this idea is worth pursuing, and two reasons it may not work. Both sides matter.",
    },
    t2: {
      prompt: "Build a quick comparison table of at least two existing alternatives to your idea — showing what they do, who they serve, and where they fall short.",
      tool: "table",
      title: "Survey the Rival Roads",
      subheader: "Others have walked toward this problem before you. Build a comparison table of at least two existing alternatives, showing what they do, who they serve, and where they fall short.",
    },
    t3: {
      prompt: "Write a one-page vision for this idea three years from now if it succeeds — what it does, who it serves, and why it exists — connected directly to the problem and customer you have defined.",
      tool: "write",
      title: "Read the Far Horizon",
      subheader: "See the village as it could be once the fog lifts. Write a one-page vision of this idea three years from now: what it does, who it serves, and why it exists, tied directly to the problem and soul you have named.",
    },
  },
  {
    stage: 2,
    checkpoint: 1,
    name: "Market landscape mapped",
    outcome: "The size, shape, and dynamics of the market this venture operates in are understood.",
    title: "Chart the Forest",
    subheader: "The Pathwarden Wraith hides the forest's true size. Map the market before you march into it.",
    standardTagline: "The territory has been surveyed. The party knows how large the forest truly is.",
    goldTagline: "The forest is fully charted. Every path, every clearing, every shadow mapped in faithful detail.",
    t1: {
      prompt: "Write a summary of the market your idea operates in — covering the rough size, who the main players are, and whether it is growing or contracting.",
      tool: "write",
      title: "Survey the Treeline",
      subheader: "Write a summary of the market your idea operates in: its rough size, the main players, and whether it is growing or contracting.",
    },
    t2: {
      prompt: "Build a market overview table — including market size estimate, growth rate, key demand drivers, and your source for each figure.",
      tool: "table",
      title: "Measure the Canopy",
      subheader: "Pace the forest in honest figures. Build a market overview table with a size estimate, growth rate, key demand drivers, and your source for each number.",
    },
    t3: {
      prompt: "Find and link at least two credible industry reports or research pieces that support your market understanding — add a note on what each one confirms or challenges about your assumptions.",
      tool: "link",
      title: "Consult the Old Maps",
      subheader: "Trust no trail unchecked against another's record. Find and link at least two credible industry reports, with a note on what each confirms or challenges about your assumptions.",
    },
  },
  {
    stage: 2,
    checkpoint: 2,
    name: "Competitors and alternatives analysed",
    outcome: "Existing solutions — products, services, or behaviours — and their strengths and weaknesses are documented.",
    title: "Track the Other Wanderers",
    subheader: "You are not alone in this forest. Document existing solutions and map exactly where each falls short.",
    standardTagline: "The other wanderers in this forest have been found and their paths recorded. None were the answer.",
    goldTagline: "Every rival's camp has been studied. Their strengths honoured, their weaknesses marked. The gap is visible.",
    t1: {
      prompt: "List at least four direct or indirect competitors — products, services, approaches, or habits that your target customer currently uses to deal with this problem.",
      tool: "write",
      title: "Spot the Rival Camps",
      subheader: "List at least four direct or indirect competitors: the products, services, approaches, or habits your customer already uses to deal with this problem.",
    },
    t2: {
      prompt: "Build a competitor comparison table — covering what each one offers, who they target, what they charge or cost, and where they fall short for your target customer.",
      tool: "table",
      title: "Study Their Fires",
      subheader: "Build a competitor comparison table covering what each offers, who they target, what they charge or cost, and where they fall short for your customer.",
    },
    t3: {
      prompt: "Map the competitive landscape on the canvas — positioning each competitor by two dimensions that matter most to your customer, such as price versus quality or convenience versus depth — and mark where your idea would sit.",
      tool: "map",
      title: "Mark the Open Clearing",
      subheader: "On the canvas, position each competitor along the two dimensions your customer cares about most, such as price against depth, and mark where your idea would stand.",
    },
  },
  {
    stage: 2,
    checkpoint: 3,
    name: "Target customer understood deeply",
    outcome: "A rich portrait of the customer is built from research, not assumption.",
    title: "Walk in Their Footsteps",
    subheader: "To find the true trail you must walk it as they do. Build a real portrait of the customer from evidence, not assumption.",
    standardTagline: "The one for whom this quest is undertaken has been truly heard. Their voice is in the party's memory.",
    goldTagline: "Their voice, their days, their unspoken wishes — all inscribed. The party carries them into every decision.",
    t1: {
      prompt: "Write a day-in-the-life description of your target customer — focusing on the moments where your problem and solution become most relevant.",
      tool: "write",
      title: "Trace a Day in Their Life",
      subheader: "Write a day-in-the-life of your target customer, lingering on the moments where your problem and your solution are most relevant.",
    },
    t2: {
      prompt: "Design and run a short survey for your target audience — asking about their current behaviour, their frustrations, and what they have already tried. Document the key themes from at least five responses.",
      tool: "survey",
      title: "Send Out the Scouts",
      subheader: "Run a short survey asking your target audience about their current behaviour, frustrations, and what they have already tried. Record key themes from at least five responses.",
    },
    t3: {
      prompt: "Conduct at least three conversations with real target customers and upload a summary or note from each — including the most surprising thing each person told you.",
      tool: "upload",
      title: "Sit at Their Fire",
      subheader: "Nothing replaces real conversation. Hold at least three conversations with real target customers and upload a summary note from each, including the most surprising thing each person told you.",
    },
  },
  {
    stage: 2,
    checkpoint: 4,
    name: "Trends and timing assessed",
    outcome: "External forces shaping the opportunity right now are understood — making the case that this is the right moment for this idea.",
    title: "Read the Changing Winds",
    subheader: "The forest moves with the seasons, and so does opportunity. Name the forces that make now the right moment.",
    standardTagline: "The winds have been read. The season is understood. The time to move is now, or not for years.",
    goldTagline: "The winds and tides are fully read. Every external force is mapped. The moment is confirmed.",
    t1: {
      prompt: "Identify at least two trends — technological, social, regulatory, economic, or behavioural — that make this problem more acute or your solution more possible right now.",
      tool: "write",
      title: "Feel the Season Turn",
      subheader: "Identify at least two trends, technological, social, regulatory, economic, or behavioural, that make this problem sharper or your solution more possible right now.",
    },
    t2: {
      prompt: "Build a trends table — listing each trend, its relevance to your idea, whether it helps or hurts you, and a source for each.",
      tool: "table",
      title: "Log the Omens",
      subheader: "Build a trends table listing each trend, its relevance to your idea, whether it helps or hurts you, and a source for each.",
    },
    t3: {
      prompt: "Find and link a comparable venture that succeeded or failed partly because of timing — and write a specific lesson from that case for your own idea.",
      tool: "link",
      title: "Heed the Fallen",
      subheader: "Others have read these winds before, some to ruin. Find and link a comparable venture that rose or fell partly on timing, and draw one specific lesson from it for your own idea.",
    },
  },
  {
    stage: 2,
    checkpoint: 5,
    name: "Research synthesised",
    outcome: "All findings pulled into a single coherent picture that will directly inform validation.",
    title: "Assemble the True Map",
    subheader: "Scattered findings keep you lost. Pull everything into one coherent picture that points to the opportunity.",
    standardTagline: "The fragments of the forest have been assembled into a single true map. The party knows where it stands.",
    goldTagline: "The map is complete and certain. Every finding connects. The way forward is clear and well-founded.",
    t1: {
      prompt: "Write a one-page research summary — covering the market, competition, customer, and timing in a single connected narrative that leads to a clear implication for your idea.",
      tool: "write",
      title: "Bind the Fragments",
      subheader: "Write a one-page research summary tying market, competition, customer, and timing into one connected story that leads to a clear implication for your idea.",
    },
    t2: {
      prompt: "Build a SWOT table for your idea based specifically on what your research revealed — not on general intuition.",
      tool: "table",
      title: "Weigh Strength and Shadow",
      subheader: "Build a SWOT table for your idea drawn specifically from what your research revealed, not from general intuition.",
    },
    t3: {
      prompt: "Map your research findings on the canvas — showing how market context, competitor gaps, customer needs, and timing connect to create the specific opportunity your idea is addressing.",
      tool: "map",
      title: "Show the Path Through",
      subheader: "On the canvas, map how market context, competitor gaps, customer needs, and timing connect to form the specific opportunity your idea addresses.",
    },
  },
  {
    stage: 3,
    checkpoint: 1,
    name: "Assumptions documented",
    outcome: "The key beliefs the idea rests on are written down and ranked by risk.",
    title: "Name Your Gambles",
    subheader: "The Advocate of Comfortable Lies thrives on beliefs you never examine. Drag every assumption into the light and rank the dangerous ones.",
    standardTagline: "The party has named its gambles. The most dangerous bets are marked in red.",
    goldTagline: "Every gamble named, ranked, and inscribed. The party faces its risks with open eyes.",
    t1: {
      prompt: "List at least eight assumptions your idea currently relies on — about the customer, the market, the solution, the delivery model, or the economics.",
      tool: "write",
      title: "Confess the Bets",
      subheader: "List at least eight assumptions your idea currently relies on, spanning the customer, market, solution, delivery model, and economics.",
    },
    t2: {
      prompt: "Build a risk ranking table for your assumptions — for each one, rate how likely it is to be wrong and how damaging it would be if it were, then sort by combined risk.",
      tool: "table",
      title: "Mark the Deadliest",
      subheader: "Build a risk ranking table rating each assumption on how likely it is to be wrong and how damaging that would be, then sort by combined risk.",
    },
    t3: {
      prompt: "Map your top three riskiest assumptions on the canvas — showing what depends on each one and what would collapse if it were wrong.",
      tool: "map",
      title: "Trace What Would Fall",
      subheader: "On the canvas, map your three riskiest assumptions and show what depends on each one and what collapses if it proves false.",
    },
  },
  {
    stage: 3,
    checkpoint: 2,
    name: "Validation method chosen",
    outcome: "A concrete plan for testing the highest-risk assumptions exists — appropriate to the type of venture.",
    title: "Design the Trial",
    subheader: "A fair contest needs rules set before the champion enters. Plan a concrete test for your highest-risk assumption.",
    standardTagline: "The trial has been designed. The arena is prepared. The test will be fair.",
    goldTagline: "The trial is precisely designed. The champion of truth is ready. No assumption will escape unexamined.",
    t1: {
      prompt: "Describe the method you will use to test your most critical assumption — what you will do, who you will involve, and what you will measure or observe.",
      tool: "write",
      title: "Set the Rules of Combat",
      subheader: "Describe the method you will use to test your most critical assumption: what you will do, who you will involve, and what you will measure or observe.",
    },
    t2: {
      prompt: "Build a validation plan table — listing each assumption being tested, the method, the success threshold, and the failure threshold.",
      tool: "table",
      title: "Define Victory and Defeat",
      subheader: "Build a validation plan table listing each assumption being tested, the method, the success threshold, and the failure threshold. Decide what counts as a win before the trial begins.",
    },
    t3: {
      prompt: "Create the simplest possible artefact that lets you put your idea in front of a real potential customer — a one-pager, a sample, a service offer, a landing page, or a conversation guide — and link or upload it here.",
      tool: "upload",
      title: "Forge the Test Blade",
      subheader: "Create the simplest possible artefact that puts your idea in front of a real potential customer: a one-pager, sample, service offer, landing page, or conversation guide. Upload it here.",
    },
  },
  {
    stage: 3,
    checkpoint: 3,
    name: "Validation run",
    outcome: "The test has been executed with real people or real market conditions and raw results exist.",
    title: "Enter the Arena",
    subheader: "The arena answers whether or not you wished it to. Run the test and record exactly what happened, nothing softened.",
    standardTagline: "The trial is complete. The arena has spoken, whether we wished it to or not.",
    goldTagline: "The trial was run in full. Every assumption met the arena. The results stand unaltered.",
    t1: {
      prompt: "Document the raw results of your validation — numbers, quotes, behaviours, and observations exactly as they occurred, unfiltered.",
      tool: "write",
      title: "Record the Blows",
      subheader: "Document the raw results of your validation: the numbers, quotes, behaviours, and observations exactly as they occurred, unfiltered.",
    },
    t2: {
      prompt: "Build a results table — showing each person or data point in your validation, what they said or did, and whether it supported or contradicted your assumption.",
      tool: "table",
      title: "Tally Each Strike",
      subheader: "Build a results table showing each person or data point, what they said or did, and whether it supported or contradicted your assumption.",
    },
    t3: {
      prompt: "Upload evidence from your validation — conversation notes, survey exports, order confirmations, sign-up screenshots, or any artefact that proves the test happened and captures what it found.",
      tool: "upload",
      title: "Show the Witnesses' Mark",
      subheader: "Upload evidence that the test happened: conversation notes, survey exports, order confirmations, or sign-up screenshots that prove it ran and capture what it found.",
    },
  },
  {
    stage: 3,
    checkpoint: 4,
    name: "Pivot or proceed decision made",
    outcome: "A clear, evidence-based direction is documented — proceed, pivot, or stop.",
    title: "Deliver the Verdict",
    subheader: "The crowd waits. Choose your direction from the evidence: proceed, pivot, or stop, and let the proof command.",
    standardTagline: "The evidence has been read and a path chosen. The party marches — in one direction.",
    goldTagline: "The verdict is declared and carved in stone. The evidence commands. The party obeys its truth.",
    t1: {
      prompt: "Write a clear decision statement — proceed, pivot, or stop — and explain in two or three sentences what specific evidence led you there.",
      tool: "write",
      title: "Declare the Judgment",
      subheader: "Write a clear decision statement, proceed, pivot, or stop, and explain in two or three sentences the specific evidence that led you there.",
    },
    t2: {
      prompt: "Build a before-and-after table showing your original assumptions and what validation proved, disproved, or left uncertain about each.",
      tool: "table",
      title: "Set Belief Against Truth",
      subheader: "Build a before-and-after table showing your original assumptions alongside what validation confirmed, disproved, or left uncertain about each.",
    },
    t3: {
      prompt: "Use the canvas to show what changed in your understanding of the problem, customer, or solution, now that validation has taught you what it has.",
      tool: "map",
      title: "Redraw the Idea",
      subheader: "On the canvas, show what changed in your understanding of the problem, customer, or solution, now that validation has taught you what it has.",
    },
  },
  {
    stage: 4,
    checkpoint: 1,
    name: "Customer journey mapped",
    outcome: "The end-to-end experience of a customer discovering, choosing, receiving, and getting value from this venture is documented.",
    title: "Walk the Quarter's Path",
    subheader: "The Unfinished Golem breaks things at the seams. Walk the customer's full journey before it does.",
    standardTagline: "The path through the quarter has been walked end to end. Every step is known.",
    goldTagline: "Every stone placed and every turning signed. The traveller will not be lost.",
    t1: {
      prompt: "Describe the core customer journey in five to eight steps — from first encountering your venture to getting the core value from it, regardless of whether that value is a product, service, or experience.",
      tool: "write",
      title: "Lay the Stones",
      subheader: "Describe the core customer journey in five to eight steps, from first encountering your venture to receiving its core value, whatever form that takes.",
    },
    t2: {
      prompt: "Map the full customer journey on the canvas — showing each step, the customer's emotional state at each point, and the key moments where they might drop off or lose trust.",
      tool: "map",
      title: "Map Every Turning",
      subheader: "On the canvas, map the full journey showing the customer's emotional state at each step and the moments where they might drop off or lose trust.",
    },
    t3: {
      prompt: "Identify the two or three most critical moments in the journey — where the experience succeeds or fails — and for each one describe what must happen and what would go wrong if it does not.",
      tool: "write",
      title: "Guard the Critical Joints",
      subheader: "A few joints bear the whole structure. Identify the two or three most critical moments in the journey and describe what must happen at each, and what goes wrong if it does not.",
    },
  },
  {
    stage: 4,
    checkpoint: 2,
    name: "Offer defined in detail",
    outcome: "What is being sold or delivered — and exactly how it works from the customer's perspective — is documented precisely.",
    title: "Specify the Work",
    subheader: "The Golem finds gaps in what is unspecified. Document exactly what is delivered and how the customer experiences every part of it.",
    standardTagline: "The work has a precise shape. The quarter knows exactly what is being made.",
    goldTagline: "Every component is specified and accounted for. The Golem can find no gap to break.",
    t1: {
      prompt: "Describe your offer in specific terms — what the customer receives, in what form, over what timeframe, and at what price or exchange — as if explaining it to someone ready to buy.",
      tool: "write",
      title: "State What Is Made",
      subheader: "Describe your offer in specific terms: what the customer receives, in what form, over what timeframe, and at what price or exchange, as if explaining it to someone ready to buy.",
    },
    t2: {
      prompt: "Build an offer specification table — listing every component of what you are delivering, how each component is produced or sourced, and what the customer experiences at each touchpoint.",
      tool: "table",
      title: "Itemise the Components",
      subheader: "Build an offer specification table listing each component you deliver, how each is produced or sourced, and what the customer experiences at each touchpoint.",
    },
    t3: {
      prompt: "Create the simplest possible representation of your offer — a menu, a product sheet, a service blueprint, a physical sample description, or a one-page spec — and upload it here.",
      tool: "upload",
      title: "Display the Sample",
      subheader: "Create the simplest possible representation of your offer, a menu, product sheet, service blueprint, sample description, or one-page spec, and upload it here.",
    },
  },
  {
    stage: 4,
    checkpoint: 3,
    name: "Identity and positioning established",
    outcome: "The look, feel, tone, and market position of the venture exists and is documented.",
    title: "Raise the Maker's Mark",
    subheader: "A venture is known by its mark. Define the look, feel, tone, and position that will make yours unmistakable.",
    standardTagline: "The maker's mark is raised. The venture will be known by its feel and its place.",
    goldTagline: "The mark is complete in voice, look, and position. None will mistake it for another.",
    t1: {
      prompt: "Write a brand brief for your venture — three words that describe how it should feel, the tone of voice it uses, and the single clearest statement of what makes it different from alternatives.",
      tool: "write",
      title: "Strike the Brand Brief",
      subheader: "Write a brand brief: three words for how your venture should feel, the tone of voice it uses, and the single clearest statement of what makes it different from alternatives.",
    },
    t2: {
      prompt: "Build a positioning table — showing at least three competitors or alternatives and marking how your venture differs from each on the dimensions your customer cares most about.",
      tool: "table",
      title: "Stand Apart in the Quarter",
      subheader: "Build a positioning table showing at least three competitors or alternatives and marking how your venture differs from each on the dimensions your customer cares about most.",
    },
    t3: {
      prompt: "Use the canvas to build a visual mood board — collecting references, colour directions, and aesthetic examples that represent the look and feel of this venture.",
      tool: "map",
      title: "Compose the Look",
      subheader: "On the canvas, build a visual mood board collecting references, colour directions, and aesthetic examples that capture the look and feel of this venture.",
    },
  },
  {
    stage: 4,
    checkpoint: 4,
    name: "Offer tested with real customers",
    outcome: "The offer — in whatever form it exists — has been put in front of real potential customers and their response is documented.",
    title: "Put It in Real Hands",
    subheader: "The Golem fears work that has been gripped and truly tested. Place the offer before real customers and record honestly what happens.",
    standardTagline: "Real hands have gripped the work. Their reactions are recorded faithfully.",
    goldTagline: "Many hands have tested it and every reaction noted. The true design shows itself.",
    t1: {
      prompt: "Document what happened when at least three target customers encountered your offer — what each person did, what they asked, what they hesitated on, and what they said.",
      tool: "write",
      title: "Watch Them Handle It",
      subheader: "Document what happened when at least three target customers encountered your offer: what each person did, asked, hesitated on, and said.",
    },
    t2: {
      prompt: "Build a feedback table from your offer tests — for each person, record what they were shown, whether they expressed intent to buy or use, where they had doubts, and any direct quote worth keeping.",
      tool: "table",
      title: "Log Intent and Doubt",
      subheader: "Build a feedback table recording for each person what they were shown, whether they expressed intent to buy or use, where they had doubts, and any quote worth keeping.",
    },
    t3: {
      prompt: "Upload a recording, photo set, or written transcript from at least one real offer test session — showing a customer engaging with the offer in some form.",
      tool: "upload",
      title: "Capture the Session",
      subheader: "Upload a recording, photo set, or written transcript from at least one real offer test session showing a customer engaging with the offer.",
    },
  },
  {
    stage: 4,
    checkpoint: 5,
    name: "Offer finalised",
    outcome: "Feedback has been incorporated and the offer is defined clearly enough to deliver.",
    title: "Still the Golem",
    subheader: "The Golem stops only when the work is truly finished. Rule on every note from testing and lock the offer for delivery.",
    standardTagline: "The Golem is stilled. The offer is sealed and ready to deliver.",
    goldTagline: "The offer is locked. Every note ruled on, every step of handover mapped.",
    t1: {
      prompt: "Build a feedback resolution table — listing every piece of feedback from offer testing and marking each as incorporated, rejected, or deferred, with a brief reason for each decision.",
      tool: "table",
      title: "Rule on Every Note",
      subheader: "Build a feedback resolution table. List every piece of feedback from offer testing and mark each as incorporated, rejected, or deferred, with a brief reason for each decision.",
    },
    t2: {
      prompt: "Write the final offer description — the version that will be used in all customer-facing communication — and confirm it reflects everything learned from testing.",
      tool: "write",
      title: "Seal the Final Form",
      subheader: "Write the final offer description, the version used in all customer-facing communication, and confirm it reflects everything testing taught you.",
    },
    t3: {
      prompt: "Write a delivery or fulfilment note covering every step required to get the offer from its current state to the customer's hands — and flag any step that is not yet resolved.",
      tool: "write",
      title: "Map the Handover",
      subheader: "Write a delivery or fulfilment note covering every step needed to get the offer from its current state to the customer's hands, and flag any step not yet resolved.",
    },
  },
  {
    stage: 5,
    checkpoint: 1,
    name: "Delivery model and operations designed",
    outcome: "The end-to-end process for producing and delivering the offer — whether manufacturing, service staffing, software build, or supply chain — is documented and agreed.",
    title: "Plan the Mineworks",
    subheader: "The Collapse Specter thrives where the dig is unplanned. Map every shaft, support, and dependency before the first cut.",
    standardTagline: "The mineworks are planned. Every shaft and support is laid out before the dig.",
    goldTagline: "The full architecture is drawn. Every dependency named, every weak tunnel marked.",
    t1: {
      prompt: "Write a short operations brief covering how the offer will be produced or sourced, how it will reach the customer, and what the key steps are between receiving an order and fulfilling it.",
      tool: "write",
      title: "Brief the Dig",
      subheader: "Write a short operations brief covering how the offer is produced or sourced, how it reaches the customer, and the key steps between receiving an order and fulfilling it.",
    },
    t2: {
      prompt: "Build an operations architecture table — listing each component of your delivery model, the approach chosen, the reason for that choice, and the biggest risk associated with it.",
      tool: "table",
      title: "Chart the Supports",
      subheader: "Build an operations architecture table listing each component of your delivery model, the approach chosen, the reason for that choice, and the biggest risk attached to it.",
    },
    t3: {
      prompt: "Map your delivery model on the canvas — showing how each part of your operation connects, where dependencies exist, and which parts are most vulnerable to failure.",
      tool: "map",
      title: "Find the Weak Tunnel",
      subheader: "On the canvas, map how each part of your operation connects, where the dependencies lie, and which parts are most vulnerable to failure.",
    },
  },
  {
    stage: 5,
    checkpoint: 2,
    name: "Build environment set up",
    outcome: "All tools, suppliers, platforms, team members, and workflows needed to deliver the offer are in place and confirmed ready.",
    title: "Light the Shafts",
    subheader: "No miner descends into a dark, untooled shaft. Get every tool, supplier, platform, and workflow in place and confirmed before the dig begins.",
    standardTagline: "The shafts are lit and tooled. Every miner is briefed and the work can begin.",
    goldTagline: "The mine is fully prepared. Every tool in place, every system tested before the first cut.",
    t1: {
      prompt: "Confirm your core delivery infrastructure is set up and describe the workflow your team will use — covering how work gets assigned, how progress is tracked, and how quality is checked.",
      tool: "write",
      title: "Ready the Workings",
      subheader: "Confirm your core delivery infrastructure is set up and describe the team workflow: how work gets assigned, how progress is tracked, and how quality is checked.",
    },
    t2: {
      prompt: "Build a team and tools access table — listing every person involved in delivery, their role, and confirming they have access to every resource, platform, or supplier they need.",
      tool: "table",
      title: "Brief Every Miner",
      subheader: "Build a team and tools access table listing each person involved in delivery, their role, and confirming they have access to every resource, platform, or supplier they need.",
    },
    t3: {
      prompt: "Set up a Kanban board for your delivery workflow — with columns covering what is to be built or sourced, what is in progress, what is ready for quality check, and what is done — and populate it with your first delivery tasks.",
      tool: "kanban",
      title: "Set the Dig Order",
      subheader: "Set up a Kanban board for your delivery workflow with columns for to-build or source, in progress, ready for quality check, and done, and populate it with your first delivery tasks.",
    },
  },
  {
    stage: 5,
    checkpoint: 3,
    name: "Core offer built or sourced",
    outcome: "The minimum version of the offer that could be delivered to a real customer exists and functions as intended.",
    title: "Reach the Vein",
    subheader: "The mine is real only when ore comes to surface. Build or source the minimum version of the offer that can be delivered to a real customer.",
    standardTagline: "The vein is reached. A real, deliverable offer exists and has left the mine once.",
    goldTagline: "The vein runs deep and true. Every promised component is struck and accounted for.",
    t1: {
      prompt: "Build a component readiness table — listing each component of your minimum offer and confirming it is built, sourced, or ready, even if rough, with a note on anything still outstanding.",
      tool: "table",
      title: "Account for the Ore",
      subheader: "Build a component readiness table listing each component of your minimum offer, confirming it is built, sourced, or ready, even if rough, and noting anything still outstanding.",
    },
    t2: {
      prompt: "Upload evidence that your core offer exists in a deliverable state — a photo of the product, a recording of the service being delivered, a working demo, or a supplier confirmation.",
      tool: "upload",
      title: "Bring It to Surface",
      subheader: "Upload evidence that your core offer exists in a deliverable state: a product photo, a recording of the service, a working demo, or a supplier confirmation.",
    },
    t3: {
      prompt: "Deliver the offer to one real person outside your team — a friend, a test customer, or a pilot participant — and document exactly what happened from handover to receipt.",
      tool: "self_report",
      title: "First Delivery to Daylight",
      subheader: "Carry the first load all the way out. Deliver the offer to one real person outside your team and document exactly what happened from handover to receipt.",
    },
  },
  {
    stage: 5,
    checkpoint: 4,
    name: "Internal quality check complete",
    outcome: "The offer has been reviewed by the team and every known issue is documented — with a clear decision on what to fix before launch.",
    title: "Shore the Tunnels",
    subheader: "Find the cracks before the Specter does. Review the offer as a team and decide what must be fixed before the doors open.",
    standardTagline: "The tunnels have been shored by those who dug them. The weak points are known.",
    goldTagline: "Every fault found and ruled on. The mine is sound by its builders' own verdict.",
    t1: {
      prompt: "Build a quality log table — listing each issue found during internal review, its severity, which part of the offer it affects, and whether it has been resolved.",
      tool: "table",
      title: "Log Every Fault",
      subheader: "Build a quality log table listing each issue found in internal review, its severity, which part of the offer it affects, and whether it has been resolved.",
    },
    t2: {
      prompt: "Upload evidence of the offer being tested or reviewed in conditions as close as possible to real customer use — a recording, a photo, a test report, or a written walkthrough.",
      tool: "upload",
      title: "Test Under Real Load",
      subheader: "Upload evidence of the offer being tested in conditions as close as possible to real customer use: a recording, photo, test report, or written walkthrough.",
    },
    t3: {
      prompt: "Write a quality summary — covering what was tested, what passed, what failed, and what you decided to fix before launch versus what you decided to defer.",
      tool: "write",
      title: "Rule Fix from Defer",
      subheader: "Write a quality summary covering what was tested, what passed, what failed, and what you will fix before launch versus defer.",
    },
  },
  {
    stage: 5,
    checkpoint: 5,
    name: "Pilot or beta complete",
    outcome: "Real customers outside the team have received or experienced the offer and their feedback is collected.",
    title: "Send in the First Crews",
    subheader: "The mine holds only when real crews have walked it. Let real customers outside the team experience the offer and gather their honest accounts.",
    standardTagline: "Real crews have walked the works. Their accounts are recorded and rated.",
    goldTagline: "Every crew heard, every fault rated. The shaft has held under real weight.",
    t1: {
      prompt: "Document what your pilot or beta customers experienced — covering at least five participants, where each came from, and what they reported.",
      tool: "write",
      title: "Record the Crew's Account",
      subheader: "Document what your pilot or beta customers experienced, covering at least five participants, where each came from, and what they reported.",
    },
    t2: {
      prompt: "Build a pilot feedback table — listing each participant, the issues they encountered, any direct quotes, and a severity rating for each issue.",
      tool: "table",
      title: "Rate Every Fault Found",
      subheader: "Build a pilot feedback table listing each participant, the issues they encountered, any direct quotes, and a severity rating for each issue.",
    },
    t3: {
      prompt: "Create a short survey for your pilot or beta customers and share the compiled results here — showing how they rate the experience and what they most want improved.",
      tool: "survey",
      title: "Poll the Returning Miners",
      subheader: "Create a short survey for your pilot or beta customers and share the compiled results, showing how they rate the experience and what they most want improved.",
    },
  },
  {
    stage: 5,
    checkpoint: 6,
    name: "Launch-ready",
    outcome: "All pre-launch conditions are met and the venture is ready to serve its first real customers.",
    title: "Load the Cart",
    subheader: "Nothing leaves the mine unchecked. Confirm every pre-launch condition is met and the venture is ready to serve its first real customers.",
    standardTagline: "The cart is loaded and inspected. The mine has done its work.",
    goldTagline: "Every item passes, a stranger has walked it clean, and the manifest is signed.",
    t1: {
      prompt: "Build a pre-launch checklist table — covering offer quality, delivery readiness, pricing confirmed, legal requirements, customer communication, and any venture-specific conditions — with a pass or fail for each.",
      tool: "table",
      title: "Run the Final Inspection",
      subheader: "Build a pre-launch checklist table covering offer quality, delivery readiness, pricing, legal requirements, and customer communication, with a pass or fail for each item.",
    },
    t2: {
      prompt: "Ask someone outside your team to go through the full customer journey from first contact to receiving or accessing the offer — without your help — and note every issue they encountered.",
      tool: "self_report",
      title: "Send a Stranger Through",
      subheader: "Ask someone outside your team to complete the full customer journey from first contact to receiving the offer, with no help from you, and note every issue they encounter.",
    },
    t3: {
      prompt: "Confirm in writing that every item on your pre-launch checklist is passing and the venture is ready to serve paying customers — including the date of this confirmation.",
      tool: "write",
      title: "Sign the Manifest",
      subheader: "Confirm in writing that every checklist item is passing and the venture is ready to serve paying customers, including the date of this confirmation.",
    },
  },
  {
    stage: 6,
    checkpoint: 1,
    name: "Launch assets prepared",
    outcome: "Everything needed to go public and reach the first customers is created and ready.",
    title: "Rig the Sails",
    subheader: "The Harbourmaster demands everything in order before the gate opens. Create every asset needed to go public and reach first customers.",
    standardTagline: "The harbour master has the manifests. The sails are rigged. The cargo is aboard.",
    goldTagline: "Every manifest signed, every sail rigged to full trim, every item of cargo confirmed aboard.",
    t1: {
      prompt: "Write the core launch message — a headline, a two-sentence description of what you offer, and a clear call to action — for the primary channel you are launching through.",
      tool: "write",
      title: "Write the Departure Call",
      subheader: "Write the core launch message for your primary channel: a headline, a two-sentence description of what you offer, and a clear call to action.",
    },
    t2: {
      prompt: "Build a launch asset checklist table — listing every piece of content or material needed across all launch channels and confirming each is complete.",
      tool: "table",
      title: "Check Every Line",
      subheader: "Build a launch asset checklist table listing every piece of content or material needed across all launch channels, confirming each is complete.",
    },
    t3: {
      prompt: "Upload your launch kit — a short document or folder containing your offer description, key facts, pricing, visuals, and any founder or team context — ready to share with anyone who asks.",
      tool: "upload",
      title: "Stow the Cargo",
      subheader: "Upload your launch kit: a short document or folder containing your offer description, key facts, pricing, visuals, and any founder or team context, ready to share with anyone who asks.",
    },
  },
  {
    stage: 6,
    checkpoint: 2,
    name: "Venture live and announced",
    outcome: "The venture is publicly reachable and the launch has been made across chosen channels.",
    title: "Cast Off",
    subheader: "The Harbourmaster runs out of objections the moment the gate opens. Go publicly live and announce across your channels.",
    standardTagline: "The ship has left the harbour. The world has seen the sails. There is no returning this to port.",
    goldTagline: "The fleet has sailed in full formation. Every channel announced. The world cannot unsee us.",
    t1: {
      prompt: "Confirm the venture is live and link directly to where customers can find, access, or contact you — so it can be reached by anyone.",
      tool: "link",
      title: "Open the Harbour Gate",
      subheader: "Confirm the venture is live and link directly to where customers can find, access, or contact you.",
    },
    t2: {
      prompt: "Document your launch announcement — link or upload the post, email, message, or event where you announced — and note the initial response in the first 48 hours.",
      tool: "upload",
      title: "Sound the Departure",
      subheader: "Document your launch announcement, link or upload the post, email, message, or event, and note the initial response in the first 48 hours.",
    },
    t3: {
      prompt: "Build a launch channel table — listing every channel used, the reach of each, and the number of leads, enquiries, or customers each produced in the first week.",
      tool: "table",
      title: "Log the Outbound Channels",
      subheader: "Build a launch channel table listing every channel used, the reach of each, and the leads, enquiries, or customers each produced in the first week.",
    },
  },
  {
    stage: 6,
    checkpoint: 3,
    name: "First customers acquired",
    outcome: "Real people outside the team have purchased, signed up, or committed to the offer and initial data exists.",
    title: "Take On Passengers",
    subheader: "The voyage is real once souls board by choice. Win real customers who commit and capture your first data.",
    standardTagline: "The first true sailors have found the ship and boarded of their own will. The voyage has passengers.",
    goldTagline: "The ship sails full. Real souls aboard by choice. The voyage has begun in earnest.",
    t1: {
      prompt: "Build a first-customers table — documenting your first ten customers: where each came from, when they engaged, what they purchased or signed up for, and whether they completed the core journey.",
      tool: "table",
      title: "Name the First Aboard",
      subheader: "Build a first-customers table documenting your first ten customers: where each came from, when they engaged, what they purchased or signed up for, and whether they completed the core journey.",
    },
    t2: {
      prompt: "Build a channel attribution table — showing which launch channel drove the most customers and which drove the highest-quality engagement based on your first week of data.",
      tool: "table",
      title: "Chart the Best Currents",
      subheader: "Build a channel attribution table showing which launch channel drove the most customers and which drove the highest-quality engagement in your first week of data.",
    },
    t3: {
      prompt: "Upload evidence of real customer activity — a screenshot of transactions, sign-ups, orders, or enquiries — from your first week.",
      tool: "upload",
      title: "Show the Full Deck",
      subheader: "Upload evidence of real customer activity from your first week: screenshots of transactions, sign-ups, orders, or enquiries.",
    },
  },
  {
    stage: 7,
    checkpoint: 1,
    name: "Feedback collected",
    outcome: "Structured input from real customers exists across multiple channels.",
    title: "Hear the Travellers",
    subheader: "The crossroads is loud with the Babel Merchant's contradictions. Gather structured feedback across every channel and find the signal in the noise.",
    standardTagline: "The crossroads has spoken. The travellers have shared what the roads were like.",
    goldTagline: "Every traveller has been heard. Every road condition recorded. The crossroads holds all truths.",
    t1: {
      prompt: "Write a summary of the feedback collected since launch — covering the main themes across all sources.",
      tool: "write",
      title: "Gather the Road Reports",
      subheader: "Write a summary of the feedback collected since launch, covering the main themes across all sources.",
    },
    t2: {
      prompt: "Build a feedback log table — listing each piece of feedback, its source, whether it is a complaint, a feature or improvement request, or a general observation, and how frequently it appears.",
      tool: "table",
      title: "Log Every Voice",
      subheader: "Build a feedback log table listing each piece of feedback, its source, whether it is a complaint, a request, or a general observation, and how frequently it appears.",
    },
    t3: {
      prompt: "Create a structured feedback survey and document the compiled results — showing how customers rate their experience and what they most want changed.",
      tool: "survey",
      title: "Send a Straight Question",
      subheader: "Create a structured feedback survey and document the compiled results, showing how customers rate their experience and what they most want changed.",
    },
  },
  {
    stage: 7,
    checkpoint: 2,
    name: "Priorities set",
    outcome: "A clear, evidence-based decision on what to address first is documented.",
    title: "Choose the True Road",
    subheader: "The Merchant offers a different map to every traveller. Pick one road from the evidence and commit to it.",
    standardTagline: "Of all the roads discussed, one has been chosen first. The party moves with purpose.",
    goldTagline: "The road is chosen with full evidence. Every alternative weighed and set aside. One direction.",
    t1: {
      prompt: "Group your feedback into themes and write a prioritised list of improvements — ranked by frequency of the issue and the impact of fixing it.",
      tool: "write",
      title: "Rank the Roads",
      subheader: "Group your feedback into themes and write a prioritised list of improvements, ranked by how often each issue appears and the impact of fixing it.",
    },
    t2: {
      prompt: "Build a priority matrix table — listing each improvement, its frequency in feedback, its estimated impact, its estimated effort, and your priority ranking.",
      tool: "table",
      title: "Weigh Each Route",
      subheader: "Build a priority matrix table listing each improvement, its frequency in feedback, its estimated impact, its estimated effort, and your priority ranking.",
    },
    t3: {
      prompt: "Write an iteration brief — describing what you are going to work on, why you chose it over other options, and what specific outcome you expect to move as a result.",
      tool: "write",
      title: "Commit to the Direction",
      subheader: "Write an iteration brief describing what you will work on, why you chose it over the alternatives, and the specific outcome you expect to move.",
    },
  },
  {
    stage: 7,
    checkpoint: 3,
    name: "Improvements delivered",
    outcome: "The prioritised changes have been made and the updated offer or operation is live.",
    title: "Repair the Road",
    subheader: "The road is only repaired when travellers can use it. Build and ship the prioritised changes.",
    standardTagline: "The road has been repaired. Those who travel it next will find it better than those who came before.",
    goldTagline: "The road is rebuilt to a higher standard than it was first made. The improvement is permanent.",
    t1: {
      prompt: "Confirm the changes are live and link or upload evidence of the updated offer, process, or communication from this checkpoint.",
      tool: "upload",
      title: "Open the New Road",
      subheader: "Confirm the changes are live and upload or link evidence of the updated offer, process, or communication.",
    },
    t2: {
      prompt: "Build a changes table — listing each improvement delivered, what feedback drove it, and what specifically changed in the offer or operation.",
      tool: "table",
      title: "Record the Works",
      subheader: "Build a changes table listing each improvement delivered, the feedback that drove it, and what specifically changed in the offer or operation.",
    },
    t3: {
      prompt: "Upload evidence showing the improvement in effect — a photo, recording, or customer-facing artefact demonstrating what changed.",
      tool: "upload",
      title: "Show the Smooth Path",
      subheader: "Upload evidence showing the improvement in effect: a photo, recording, or customer-facing artefact demonstrating what changed.",
    },
  },
  {
    stage: 7,
    checkpoint: 4,
    name: "Impact measured",
    outcome: "The effect of changes on customer behaviour and key metrics is documented.",
    title: "Measure the Difference",
    subheader: "Walk the new road and the old and judge honestly. Document the real effect of your changes on the metrics that matter.",
    standardTagline: "The new road has been walked. The difference has been measured. The crossroads knows its work.",
    goldTagline: "The impact of every repair is measured and inscribed. The crossroads improves with full knowledge.",
    t1: {
      prompt: "Write a before-and-after comparison for your key metric — what it was before the changes, what it is now, and what you think caused the difference.",
      tool: "write",
      title: "Compare the Crossings",
      subheader: "Write a before-and-after comparison for your key metric: what it was before the changes, what it is now, and what you think caused the difference.",
    },
    t2: {
      prompt: "Build a metrics table — showing each metric tracked, its value before the changes, its value after, and whether it moved in the direction expected.",
      tool: "table",
      title: "Tally the Movement",
      subheader: "Build a metrics table showing each metric tracked, its value before the changes, its value after, and whether it moved in the direction expected.",
    },
    t3: {
      prompt: "Upload a screenshot or export from your tracking tool showing the metric movement — with the period before and after the change clearly visible.",
      tool: "upload",
      title: "Show the Proof of Travel",
      subheader: "Upload a screenshot or export from your tracking tool showing the metric movement, with the period before and after the change clearly visible.",
    },
  },
  {
    stage: 8,
    checkpoint: 1,
    name: "Growth channels identified",
    outcome: "The channels through which new customers can be acquired reliably are tested and ranked.",
    title: "Scout the Roads to the Capital",
    subheader: "Many roads lead to the capital but not all are worth the march. Test and rank the channels that reliably bring new customers.",
    standardTagline: "The roads to the capital have been scouted. The fastest and truest routes are known.",
    goldTagline: "Every road to the capital is mapped, graded, and ranked. The most certain route is confirmed.",
    t1: {
      prompt: "Describe at least four channels through which you could acquire new customers and what the effort, cost, and reach of each involves.",
      tool: "write",
      title: "Name the Routes",
      subheader: "Describe at least four channels through which you could acquire new customers, and the effort, cost, and reach of each.",
    },
    t2: {
      prompt: "Build a channel testing table — showing each channel tested, the input in time or money, the output in customers or leads, and the cost per customer.",
      tool: "table",
      title: "Test Each Road",
      subheader: "Build a channel testing table showing each channel tested, the input in time or money, the output in customers or leads, and the cost per customer.",
    },
    t3: {
      prompt: "Map your growth model on the canvas — showing current acquisition rate per channel and what each would produce if you doubled investment in it.",
      tool: "map",
      title: "Model the Doubling",
      subheader: "On the canvas, map your growth model showing the current acquisition rate per channel and what each would yield if you doubled investment in it.",
    },
  },
  {
    stage: 8,
    checkpoint: 2,
    name: "Revenue model validated",
    outcome: "The way the venture makes money has been tested with real customers and the economics are understood.",
    title: "Win the Merchants' Coin",
    subheader: "The Iron Bureaucrat demands proof the coin is real. Test how the venture makes money with real, paying customers.",
    standardTagline: "The capital's merchants have been approached. They have paid. The exchange is real.",
    goldTagline: "The merchants have paid in full, at price, without hesitation. The revenue model is proven true.",
    t1: {
      prompt: "Describe your revenue model and identify the single biggest assumption it relies on that you have not yet fully tested.",
      tool: "write",
      title: "Name the Untested Bet",
      subheader: "Describe your revenue model and identify the single biggest assumption it relies on that you have not yet fully tested.",
    },
    t2: {
      prompt: "Build a revenue evidence table — documenting each instance of a real customer paying or committing to pay, what motivated them, and what price point or package they chose.",
      tool: "table",
      title: "Record Each Payment",
      subheader: "Build a revenue evidence table documenting each real customer paying or committing to pay, what motivated them, and the price point or package they chose.",
    },
    t3: {
      prompt: "Upload evidence of real payment or commitment — a transaction screenshot, a signed agreement, or a documented willingness-to-pay conversation at a specific price.",
      tool: "upload",
      title: "Show the Treasury Proof",
      subheader: "Upload evidence of real payment or commitment: a transaction screenshot, a signed agreement, or a documented willingness-to-pay conversation at a specific price.",
    },
  },
  {
    stage: 8,
    checkpoint: 3,
    name: "Operations scaled",
    outcome: "The team, infrastructure, and processes can support significantly more volume without breaking.",
    title: "Widen the Gates",
    subheader: "Find what breaks first when the crowd doubles, then fix it. Make team, infrastructure, and process hold far greater volume.",
    standardTagline: "The capital's gates have been widened. What could hold a hundred now holds a thousand.",
    goldTagline: "The gates, the halls, the systems — all expanded to full scale. The capital is ready for its people.",
    t1: {
      prompt: "Identify the three biggest bottlenecks in your current operations — the things that would break first if your customer base doubled tomorrow.",
      tool: "write",
      title: "Find the Choke Points",
      subheader: "Identify the three biggest bottlenecks in your current operations: the things that would break first if your customer base doubled tomorrow.",
    },
    t2: {
      prompt: "Build a scaling readiness table — listing each bottleneck, what you have done to address it, and your current capacity versus what you would need at ten times current volume.",
      tool: "table",
      title: "Plan the Expansion",
      subheader: "Build a scaling readiness table listing each bottleneck, what you have done to address it, and your current capacity against what you would need at ten times volume.",
    },
    t3: {
      prompt: "Upload evidence of a stress or load test — a report, screenshot, or documented pilot run showing your operation handling significantly higher volume than your current baseline.",
      tool: "upload",
      title: "Prove It Holds",
      subheader: "Upload evidence of a stress or load test showing your operation handling significantly higher volume than your current baseline.",
    },
  },
  {
    stage: 8,
    checkpoint: 4,
    name: "Partnerships or distribution secured",
    outcome: "At least one external relationship that meaningfully accelerates growth is in place.",
    title: "Sign the Treaty",
    subheader: "Some roads open only through alliance. Secure at least one external relationship that meaningfully accelerates your growth.",
    standardTagline: "A treaty has been signed. The capital now has an ally whose roads lead somewhere ours do not.",
    goldTagline: "The treaty is sealed and active. The ally's roads are open to us. Our reach extends beyond ourselves.",
    t1: {
      prompt: "Identify at least three potential partners, distributors, or collaborators whose reach or capability would accelerate your growth — and explain why each is a strong fit.",
      tool: "write",
      title: "Name the Allies",
      subheader: "Identify at least three potential partners, distributors, or collaborators whose reach or capability would accelerate your growth, and explain why each is a strong fit.",
    },
    t2: {
      prompt: "Build a partnership pipeline table — listing each potential partner, the status of the conversation, what has been proposed, and the expected impact if they agree.",
      tool: "table",
      title: "Track the Negotiations",
      subheader: "Build a partnership pipeline table listing each potential partner, the status of the conversation, what has been proposed, and the expected impact if they agree.",
    },
    t3: {
      prompt: "Upload a signed agreement, confirmation email, or formal record of at least one partnership or distribution relationship that is now active.",
      tool: "upload",
      title: "Seal the Pact",
      subheader: "Upload a signed agreement, confirmation email, or formal record of at least one partnership or distribution relationship that is now active.",
    },
  },
  {
    stage: 8,
    checkpoint: 5,
    name: "Sustainability assessed",
    outcome: "The long-term health of the venture is honestly evaluated — covering finances, team, and risk.",
    title: "Read the Kingdom's Books",
    subheader: "A kingdom stands or falls on its ledgers. Honestly evaluate the venture's long-term health across finances, team, and risk.",
    standardTagline: "The capital's books have been read honestly. The kingdom will stand — if we tend it with care.",
    goldTagline: "The books are fully read and the verdict is given with clear eyes. The kingdom's future is mapped.",
    t1: {
      prompt: "Write an honest assessment of your current position — runway or cash flow, monthly costs, and how long you can operate before needing more revenue, investment, or resource.",
      tool: "write",
      title: "Count the Treasury",
      subheader: "Write an honest assessment of your current position: runway or cash flow, monthly costs, and how long you can operate before needing more revenue, investment, or resource.",
    },
    t2: {
      prompt: "Build a 12-month plan table — covering growth targets, key hires or resources needed, major risks, and the milestones that would tell you the venture is on track.",
      tool: "table",
      title: "Chart the Year Ahead",
      subheader: "Build a 12-month plan table covering growth targets, key hires or resources needed, major risks, and the milestones that tell you the venture is on track.",
    },
    t3: {
      prompt: "Map the three biggest threats to the venture's survival on the canvas — showing what would trigger each one, what the impact would be, and what your response plan is.",
      tool: "map",
      title: "Name the Threats to the Throne",
      subheader: "On the canvas, map the three biggest threats to the venture's survival, showing what would trigger each, its impact, and your response plan.",
    },
  },
];
// ─────────────────────────────────────────────────────────────────────────────
// BOSS DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────
export interface BossDef {
  id: number;
  name: string;
  type: string;
  corruption: string;
  represents: string;
  defeatMethod: string;
  retreatOutcome: string;
  slayOutcome: string;
}

export const BOSS_DEFINITIONS: BossDef[] = [
  {
    id: 1,
    name: "The Unraveller",
    type: "Ancient Void Serpent",
    corruption:
      "Pulls threads from the fabric of reality — walls crack, roads dissolve, plans collapse into incoherence",
    represents:
      "Doubt and loss of direction — the fear that the idea has no shape",
    defeatMethod:
      "Weave the final stage's outcome into a coherent whole, sealing the threads it pulled loose",
    retreatOutcome: "Idea staggers forward half-formed",
    slayOutcome:
      "The world knits back together, every stage outcome visibly connected",
  },
  {
    id: 2,
    name: "The Pale Architect",
    type: "Undead Perfectionist Titan",
    corruption:
      "Freezes progress in amber — everything looks almost right but nothing can move forward",
    represents: "Paralysis and perfectionism — the enemy of done",
    defeatMethod:
      "Ship something imperfect. The act of completing despite flaws destroys its power",
    retreatOutcome: "One stage remains frozen",
    slayOutcome: "The amber cracks and the world breathes again",
  },
  {
    id: 3,
    name: "The Hollow King",
    type: "Spectral Sovereign",
    corruption:
      "Drains meaning from actions — tasks complete but feel empty, the world greyscales",
    represents: "Loss of purpose — doing the work without knowing why",
    defeatMethod:
      "Reconnect to the original impulse. The final stage forces a statement of intent that restores colour",
    retreatOutcome: "World remains muted",
    slayOutcome: "Colour floods back stage by stage in reverse order",
  },
  {
    id: 4,
    name: "The Thornwarden",
    type: "Ancient Forest Colossus",
    corruption:
      "Overgrows paths with thorns — every checkpoint requires twice the effort to reach",
    represents:
      "Bureaucracy and friction — the systems that slow good ideas down",
    defeatMethod:
      "Cut through with decisive action. Each gold checkpoint clears a path the Thornwarden can't regrow",
    retreatOutcome: "One path remains thorned",
    slayOutcome: "The forest opens and a clear road appears between all stages",
  },
  {
    id: 5,
    name: "The Mirror Witch",
    type: "Illusionist Sorceress",
    corruption:
      "Replaces real progress with reflections — users see what they want to see rather than what is true",
    represents:
      "Confirmation bias and self-deception — building for yourself rather than for others",
    defeatMethod:
      "Each validation or feedback task breaks a mirror. Enough mirrors broken dispels the illusion entirely",
    retreatOutcome: "One illusion remains",
    slayOutcome:
      "The world sharpens into clear focus, all assumptions resolved",
  },
  {
    id: 6,
    name: "The Ashen Drake",
    type: "Fire Dragon of Entropy",
    corruption:
      "Burns completed work to ash if left untouched — idle stages decay visually",
    represents: "Abandonment and inertia — the slow death of the unfinished",
    defeatMethod:
      "Consistent forward motion. The Drake cannot burn what is actively being built",
    retreatOutcome: "Ash marks remain on one stage",
    slayOutcome: "The ash transforms into gold dust on every completed stage",
  },
  {
    id: 7,
    name: "The Tide Caller",
    type: "Oceanic Leviathan",
    corruption:
      "Floods the landscape with noise — too many directions, too many voices, priorities submerged",
    represents:
      "Distraction and scope creep — the idea that tries to be everything",
    defeatMethod:
      "Each prioritisation or synthesis task drains the flood. Focus restores the landscape",
    retreatOutcome: "Watermarks remain",
    slayOutcome:
      "The tide recedes completely revealing solid ground beneath every stage",
  },
  {
    id: 8,
    name: "The Gravemind",
    type: "Necromantic Hive Intelligence",
    corruption:
      "Raises the corpses of abandoned ideas to block progress — past failures crowd the path",
    represents: "Fear of failure and the weight of previous attempts",
    defeatMethod:
      "Each completed checkpoint buries a corpse permanently. A full run clears the graveyard entirely",
    retreatOutcome: "One corpse remains at the gate",
    slayOutcome: "The graveyard transforms into a garden of monuments",
  },
  {
    id: 9,
    name: "The Rusted Oracle",
    type: "Corrupted Mechanical Prophet",
    corruption:
      "Speaks only outdated truths — research feels stale, validation seems pointless, everything feels already done",
    represents:
      "Imposter syndrome and the belief that nothing new can be created",
    defeatMethod:
      "Each original insight or finding silences one of its voices. A full run breaks the Oracle entirely",
    retreatOutcome: "One voice continues to whisper",
    slayOutcome:
      "The Oracle shatters and its gears become the monument's clockwork",
  },
  {
    id: 10,
    name: "The Wraith Council",
    type: "Parliament of Failed Founders",
    corruption:
      "Seven spectral figures who argue endlessly — every decision is contested, every direction disputed",
    represents:
      "Decision paralysis and committee thinking — the idea killed by consensus",
    defeatMethod:
      "Each decisive checkpoint completion dismisses one councillor. A full run dissolves the council",
    retreatOutcome: "Two councillors remain",
    slayOutcome: "The chamber empties and becomes the idea's own council hall",
  },
  {
    id: 11,
    name: "The Stonecaller",
    type: "Mountain Elemental Warlord",
    corruption:
      "Petrifies momentum — stages feel impossibly heavy, each checkpoint like moving a boulder",
    represents:
      "Overwhelm and the sense that the task is too large to complete",
    defeatMethod:
      "Each small completion proves the mountain movable. Momentum is the counter-spell",
    retreatOutcome: "One stage remains stone",
    slayOutcome: "The mountain becomes the foundation the monument stands on",
  },
  {
    id: 12,
    name: "The Veilwalker",
    type: "Interdimensional Shadow Predator",
    corruption:
      "Makes the idea invisible to others — no feedback comes, no community engages, work feels unseen",
    represents: "Isolation and the fear of irrelevance — building in a vacuum",
    defeatMethod:
      "Each collaboration or community task tears the veil. A full run makes the idea fully visible in the world",
    retreatOutcome: "A thin veil remains",
    slayOutcome:
      "The veil becomes a banner visible across the shared world map",
  },
];

export const CORRUPTION_RULES = {
  dailyInactivityIncrease: 5,
  partialCheckpointIncrease: 10,
  partialCheckpointDecayDays: 5,
  standardCheckpointClearReduction: 12,
  goldCheckpointClearReduction: 25,
  contributionUpdateReduction: 5,
  inactivityCap: 80,
  max: 100,
  thresholds: [25, 50, 75, 90] as const,
} as const;

export const BOSS_BASE_HP = 100;

export type StageOutcome =
  | "not_started"
  | "in_progress"
  | "partial_stage"
  | "stage_clear"
  | "gold_stage";

export type ProjectOutcome =
  | "in_progress"
  | "partial_project"
  | "project_complete"
  | "project_perfect";

type StageCheckpointState = {
  stage: number;
  checkpoint: number;
  status: string;
  goldBonusEarned?: boolean;
};

export function getStageOutcome(
  stageId: number,
  checkpoints: StageCheckpointState[],
): {
  outcome: StageOutcome;
  total: number;
  completed: number;
  gold: number;
  finalCheckpointCompleted: boolean;
  finalCheckpointGold: boolean;
  monsterState: "active" | "retreated" | "slain";
} {
  const stageCheckpoints = checkpoints.filter((checkpoint) => checkpoint.stage === stageId);

  if (stageCheckpoints.length === 0) {
    return {
      outcome: "not_started",
      total: 0,
      completed: 0,
      gold: 0,
      finalCheckpointCompleted: false,
      finalCheckpointGold: false,
      monsterState: "active",
    };
  }

  const total = stageCheckpoints.length;
  const completed = stageCheckpoints.filter(
    (checkpoint) => checkpoint.status === "completed",
  ).length;
  const gold = stageCheckpoints.filter((checkpoint) => checkpoint.goldBonusEarned).length;
  const finalCheckpoint = [...stageCheckpoints].sort(
    (left, right) => right.checkpoint - left.checkpoint,
  )[0];
  const finalCheckpointCompleted = finalCheckpoint?.status === "completed";
  const finalCheckpointGold = !!finalCheckpoint?.goldBonusEarned;
  const halfThreshold = Math.ceil(total / 2);

  let outcome: StageOutcome = "not_started";
  if (finalCheckpointCompleted && finalCheckpointGold) {
    outcome = "gold_stage";
  } else if (finalCheckpointCompleted) {
    outcome = "stage_clear";
  } else if (completed >= halfThreshold) {
    outcome = "partial_stage";
  } else if (completed > 0) {
    outcome = "in_progress";
  }

  const monsterState =
    outcome === "gold_stage" || outcome === "stage_clear"
      ? "slain"
      : outcome === "partial_stage"
        ? "retreated"
        : "active";

  return {
    outcome,
    total,
    completed,
    gold,
    finalCheckpointCompleted,
    finalCheckpointGold,
    monsterState,
  };
}

export function getProjectOutcome(
  stageOutcomes: Array<{ outcome: StageOutcome }>,
  ventureStatus?: string,
): ProjectOutcome {
  if (ventureStatus !== "completed") {
    return "in_progress";
  }

  const resolvedStages = stageOutcomes.filter(
    (stage) =>
      stage.outcome === "partial_stage" ||
      stage.outcome === "stage_clear" ||
      stage.outcome === "gold_stage",
  );

  const allStagesCleared =
    stageOutcomes.length > 0 &&
    stageOutcomes.every(
      (stage) =>
        stage.outcome === "stage_clear" || stage.outcome === "gold_stage",
    );
  const allStagesGold =
    stageOutcomes.length > 0 &&
    stageOutcomes.every((stage) => stage.outcome === "gold_stage");
  const hasPartialStage = stageOutcomes.some(
    (stage) => stage.outcome === "partial_stage",
  );

  if (allStagesGold) {
    return "project_perfect";
  }

  if (allStagesCleared) {
    return "project_complete";
  }

  if (hasPartialStage || resolvedStages.length > 0) {
    return "partial_project";
  }

  return "in_progress";
}

const BOSS_SLUG_BY_ID: Record<number, string> = {
  1: "the_unraveller",
  2: "the_pale_architect",
  3: "the_hollow_king",
  4: "the_thornwarden",
  5: "the_mirror_witch",
  6: "the_ashen_drake",
  7: "the_tide_caller",
  8: "the_gravemind",
  9: "the_rusted_oracle",
  10: "the_wraith_council",
  11: "the_stonecaller",
  12: "the_veilwalker",
};

export function getBossSlug(bossId: number): string {
  return BOSS_SLUG_BY_ID[bossId] ?? "super_boss";
}

export type CorruptionPhase =
  | "calm"
  | "creeping"
  | "desaturated"
  | "urgent"
  | "critical";

export function getCorruptionPhase(corruptionLevel: number): CorruptionPhase {
  if (corruptionLevel >= 90) return "critical";
  if (corruptionLevel >= 75) return "urgent";
  if (corruptionLevel >= 50) return "desaturated";
  if (corruptionLevel >= 25) return "creeping";
  return "calm";
}

export function getBossVisualStatus(corruptionLevel: number) {
  if (corruptionLevel >= 90) return "foreground" as const;
  if (corruptionLevel >= 25) return "present" as const;
  return "silhouette" as const;
}

export function getBossHpFromQuality(averageQualityScore: number) {
  const normalized = Math.max(0, Math.min(12, averageQualityScore));
  const hpReduction = Math.round((normalized / 12) * 40);
  return {
    baseHp: BOSS_BASE_HP,
    currentHp: Math.max(35, BOSS_BASE_HP - hpReduction),
    qualityModifier: hpReduction,
  };
}

export function getBossEncounterStyle(averageQualityScore: number) {
  if (averageQualityScore >= 9) return "swift_shatter" as const;
  if (averageQualityScore >= 5) return "steady_withering" as const;
  return "long_retreat" as const;
}

// ─────────────────────────────────────────────────────────────────────────────
// LEVEL DEFINITIONS (50 levels)
// ─────────────────────────────────────────────────────────────────────────────
export interface LevelDef {
  level: number;
  title: string;
  phase: "tutorial" | "early" | "mid" | "senior" | "mentor";
  titlePoints: number;
  requirements: string[];
  unlockedTools?: ToolType[];
}

export const LEVEL_DEFINITIONS: LevelDef[] = [
  {
    level: 1,
    title: "Newcomer",
    phase: "tutorial",
    titlePoints: 0,
    requirements: [
      "Create your account",
      "Upload a profile photo",
      "Add at least 2 skills and 1 industry interest",
    ],
  },
  {
    level: 2,
    title: "Explorer",
    phase: "tutorial",
    titlePoints: 0,
    requirements: [
      "Browse the idea feed",
      "Like at least 3 ideas",
      "Leave your first comment on any idea",
    ],
  },
  {
    level: 3,
    title: "Thinker",
    phase: "tutorial",
    titlePoints: 0,
    requirements: [
      "Create your first idea",
      "Fill in the idea title, description and type",
      "Complete the first checkpoint on your idea",
    ],
    unlockedTools: ["write"],
  },
  {
    level: 4,
    title: "Connector",
    phase: "tutorial",
    titlePoints: 50,
    requirements: [
      "Send your first collaboration invite",
      "Follow 3 other users",
      "Earn 50 points",
    ],
  },
  {
    level: 5,
    title: "Contributor",
    phase: "tutorial",
    titlePoints: 150,
    requirements: [
      "Leave a detailed comment on 2 ideas (min. 30 words each)",
      "Receive at least 1 spark on any comment",
      "Complete 2 checkpoints on your first idea",
      "Earn 150 points",
      "Resolve at least 1 flare you fired",
    ],
    unlockedTools: ["survey", "table"],
  },
  {
    level: 6,
    title: "Initiator",
    phase: "tutorial",
    titlePoints: 300,
    requirements: [
      "Complete your first idea's first full stage",
      "Earn 300 points total",
      "Have at least 1 collaborator join any idea",
    ],
  },
  {
    level: 7,
    title: "Spark",
    phase: "early",
    titlePoints: 500,
    requirements: ["550 points", "Posted at least 2 ideas"],
    unlockedTools: ["map", "link"],
  },
  {
    level: 8,
    title: "Kindler",
    phase: "early",
    titlePoints: 800,
    requirements: ["900 points", "Completed Stage 2 on any idea"],
  },
  {
    level: 9,
    title: "Surveyor",
    phase: "early",
    titlePoints: 1200,
    requirements: [
      "1,350 points",
      "Left 10 total comments across any ideas",
      "Respond helpfully to at least 1 flare from another user",
    ],
    unlockedTools: ["poll", "upload"],
  },
  {
    level: 10,
    title: "Pathfinder",
    phase: "early",
    titlePoints: 1700,
    requirements: [
      "1,900 points",
      "Completed Stage 3 on any idea",
      "Recruited at least 1 collaborator",
    ],
  },
  {
    level: 11,
    title: "Builder",
    phase: "early",
    titlePoints: 2300,
    requirements: ["2,600 points", "Completed Stage 4 on any idea"],
  },
  {
    level: 12,
    title: "Artisan",
    phase: "early",
    titlePoints: 3000,
    requirements: ["3,400 points", "Earned at least 1 gold checkpoint"],
    unlockedTools: ["journal", "self_report"],
  },
  {
    level: 13,
    title: "Cultivator",
    phase: "early",
    titlePoints: 3800,
    requirements: ["4,400 points", "Active on at least 2 different idea types"],
  },
  {
    level: 14,
    title: "Shaper",
    phase: "early",
    titlePoints: 4400,
    requirements: ["5,500 points", "Completed Stage 5 on any idea"],
  },
  {
    level: 15,
    title: "Strategist",
    phase: "early",
    titlePoints: 5000,
    requirements: [
      "6,800 points",
      "At least 1 idea reached Stage 6 (Launch)",
      "Earned 3 gold checkpoints",
    ],
    unlockedTools: ["kanban", "calendar"],
  },
  {
    level: 16,
    title: "Pioneer",
    phase: "mid",
    titlePoints: 6000,
    requirements: ["8,500 points", "Successfully launched 1 idea"],
  },
  {
    level: 17,
    title: "Catalyst",
    phase: "mid",
    titlePoints: 7200,
    requirements: ["10,500 points", "Any idea received 15+ sparks"],
  },
  {
    level: 18,
    title: "Luminary",
    phase: "mid",
    titlePoints: 8600,
    requirements: [
      "13,000 points",
      "Given 25 sparked comments or reviews",
      "Respond helpfully to at least 5 flares",
    ],
  },
  {
    level: 19,
    title: "Vanguard",
    phase: "mid",
    titlePoints: 10200,
    requirements: ["16,000 points", "Completed Stage 7 on any launched idea"],
  },
  {
    level: 20,
    title: "Architect",
    phase: "mid",
    titlePoints: 12000,
    requirements: [
      "19,500 points",
      "Had 5 collaborators across all ideas",
      "Earned 8 gold checkpoints",
    ],
  },
  {
    level: 21,
    title: "Trailblazer",
    phase: "mid",
    titlePoints: 14000,
    requirements: [
      "23,500 points",
      "Posted ideas across 3 different idea types",
    ],
  },
  {
    level: 22,
    title: "Visionary",
    phase: "mid",
    titlePoints: 16200,
    requirements: ["28,000 points", "Any idea reached Stage 8 (Scale)"],
  },
  {
    level: 23,
    title: "Navigator",
    phase: "mid",
    titlePoints: 18600,
    requirements: [
      "33,000 points",
      "Collaborated on someone else's idea through 3 full stages",
    ],
  },
  {
    level: 24,
    title: "Forger",
    phase: "mid",
    titlePoints: 21200,
    requirements: ["38,500 points", "Earned 15 gold checkpoints"],
  },
  {
    level: 25,
    title: "Innovator",
    phase: "mid",
    titlePoints: 24000,
    requirements: ["44,500 points", "Have 2 ideas at Launch stage or beyond"],
  },
  {
    level: 26,
    title: "Magnate",
    phase: "mid",
    titlePoints: 27000,
    requirements: [
      "51,000 points",
      "Recruited 10 collaborators across all ideas",
    ],
  },
  {
    level: 27,
    title: "Curator",
    phase: "mid",
    titlePoints: 30200,
    requirements: [
      "58,000 points",
      "Reviews you gave helped 5 ideas advance a checkpoint",
      "Have at least 3 of your own flares resolved by the community",
    ],
  },
  {
    level: 28,
    title: "Orchestrator",
    phase: "mid",
    titlePoints: 33600,
    requirements: [
      "65,500 points",
      "Completed a full idea lifecycle (Stage 1 → Stage 8)",
      "Earned 20 gold checkpoints",
    ],
  },
  {
    level: 29,
    title: "Sage",
    phase: "senior",
    titlePoints: 37200,
    requirements: ["73,500 points", "Active across all 4 idea types"],
  },
  {
    level: 30,
    title: "Maven",
    phase: "senior",
    titlePoints: 41000,
    requirements: ["82,000 points", "Have 3 ideas at Launch or beyond"],
  },
  {
    level: 31,
    title: "Pillar",
    phase: "senior",
    titlePoints: 45000,
    requirements: ["91,000 points", "Collaborated on 5 other users' ideas"],
  },
  {
    level: 32,
    title: "Champion",
    phase: "senior",
    titlePoints: 49200,
    requirements: ["100,500 points", "Any idea earned 50+ total sparks"],
  },
  {
    level: 33,
    title: "Exemplar",
    phase: "senior",
    titlePoints: 53600,
    requirements: ["110,500 points", "Earned 30 gold checkpoints"],
  },
  {
    level: 34,
    title: "Harbinger",
    phase: "senior",
    titlePoints: 58200,
    requirements: [
      "121,000 points",
      "Recruited 20 collaborators across all ideas",
    ],
  },
  {
    level: 35,
    title: "Virtuoso",
    phase: "senior",
    titlePoints: 63000,
    requirements: ["132,000 points", "2 ideas reached Scale stage"],
  },
  {
    level: 36,
    title: "Elder",
    phase: "senior",
    titlePoints: 68000,
    requirements: [
      "143,500 points",
      "Given 75 sparked reviews or comments",
      "Respond helpfully to at least 20 flares total",
    ],
  },
  {
    level: 37,
    title: "Sovereign",
    phase: "senior",
    titlePoints: 73200,
    requirements: ["155,500 points", "Completed 2 full idea lifecycles"],
  },
  {
    level: 38,
    title: "Luminary",
    phase: "senior",
    titlePoints: 78600,
    requirements: [
      "168,000 points",
      "Earned 40 gold checkpoints",
      "At least 1 idea has 5+ collaborators",
    ],
  },
  {
    level: 39,
    title: "Legend",
    phase: "senior",
    titlePoints: 84200,
    requirements: [
      "181,000 points",
      "3 full idea lifecycles completed",
      "Reviews helped 15 ideas advance",
      "Active on platform for at least 6 months",
    ],
  },
  {
    level: 40,
    title: "Mentor",
    phase: "mentor",
    titlePoints: 90000,
    requirements: [
      "195,000 points",
      "Mentor track unlocked",
      "Accept your first mentee",
      "Complete mentor onboarding",
    ],
  },
  {
    level: 41,
    title: "Guide",
    phase: "mentor",
    titlePoints: 96000,
    requirements: [
      "210,000 points",
      "Actively mentoring at least 2 users",
      "Mentees advanced 5 checkpoints combined",
    ],
  },
  {
    level: 42,
    title: "Steward",
    phase: "mentor",
    titlePoints: 102200,
    requirements: [
      "226,000 points",
      "Curated 10 ideas",
      "Mentees advanced 15 checkpoints combined",
    ],
  },
  {
    level: 43,
    title: "Luminary",
    phase: "mentor",
    titlePoints: 108600,
    requirements: [
      "243,000 points",
      "1 mentee reached Level 15+",
      "Earned 50 gold checkpoints",
    ],
  },
  {
    level: 44,
    title: "Pillar",
    phase: "mentor",
    titlePoints: 115200,
    requirements: [
      "261,000 points",
      "Mentoring 5+ users simultaneously",
      "3 ideas you collaborated on fully launched",
    ],
  },
  {
    level: 45,
    title: "Oracle",
    phase: "mentor",
    titlePoints: 122000,
    requirements: [
      "280,000 points",
      "2 mentees reached Level 20+",
      "Completed 4 full idea lifecycles",
    ],
  },
  {
    level: 46,
    title: "Paragon",
    phase: "mentor",
    titlePoints: 129000,
    requirements: [
      "300,000 points",
      "Earned 60 gold checkpoints",
      "Mentees collectively earned 1,000 points",
    ],
  },
  {
    level: 47,
    title: "Titan",
    phase: "mentor",
    titlePoints: 136200,
    requirements: [
      "321,000 points",
      "5 ideas you contributed to reached Scale",
      "Mentored 10+ users over your career",
    ],
  },
  {
    level: 48,
    title: "Legend",
    phase: "mentor",
    titlePoints: 143600,
    requirements: [
      "343,000 points",
      "3 mentees reached Level 25+",
      "Earned 75 gold checkpoints",
    ],
  },
  {
    level: 49,
    title: "Icon",
    phase: "mentor",
    titlePoints: 151200,
    requirements: [
      "366,000 points",
      "Completed 5 full idea lifecycles",
      "Mentees collectively launched 3 ideas",
    ],
  },
  {
    level: 50,
    title: "Visionary",
    phase: "mentor",
    titlePoints: 159000,
    requirements: [
      "390,000 points",
      "Earned 100 gold checkpoints",
      "At least 5 mentees reached Level 30+",
      "3 ideas you created reached Scale",
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// BADGE DEFINITIONS (62 badges)
// ─────────────────────────────────────────────────────────────────────────────
export interface BadgeDef {
  id: number;
  name: string;
  category:
    | "onboarding"
    | "idea_milestones"
    | "community"
    | "consistency"
    | "hidden"
    | "aspirational";
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary" | "hidden";
  shape: string;
  primaryColor: string;
  secondaryColor: string;
  iconDescription: string;
  tagline: string;
  requirement: string;
}

export const BADGE_DEFINITIONS: BadgeDef[] = [
  // Onboarding (8)
  {
    id: 1,
    name: "First Light",
    category: "onboarding",
    rarity: "common",
    shape: "circle",
    primaryColor: "#E0F2FE",
    secondaryColor: "#0369A1",
    iconDescription: "A single candle flame on a dark background",
    tagline: "Every great fire begins with a single flame.",
    requirement: "Create your account",
  },
  {
    id: 2,
    name: "The Face Behind the Name",
    category: "onboarding",
    rarity: "common",
    shape: "shield",
    primaryColor: "#ECFDF5",
    secondaryColor: "#059669",
    iconDescription: "A simple portrait silhouette inside a shield outline",
    tagline: "A name means little. A face means everything.",
    requirement: "Upload a profile photo",
  },
  {
    id: 3,
    name: "Marked by Trade",
    category: "onboarding",
    rarity: "common",
    shape: "scroll",
    primaryColor: "#EEEDFE",
    secondaryColor: "#7F77DD",
    iconDescription: "A scroll with two tool icons and a map pin",
    tagline: "Every adventurer is known by their craft.",
    requirement: "Add at least 2 skills and 1 industry to your profile",
  },
  {
    id: 4,
    name: "The Wanderer",
    category: "onboarding",
    rarity: "common",
    shape: "hexagon",
    primaryColor: "#FFF7ED",
    secondaryColor: "#B45309",
    iconDescription: "A boot print on a winding road",
    tagline: "You have walked the road. Now you know where it leads.",
    requirement: "Browse the idea feed and like at least 3 ideas",
  },
  {
    id: 5,
    name: "First Word",
    category: "onboarding",
    rarity: "common",
    shape: "circle",
    primaryColor: "#E0F2FE",
    secondaryColor: "#0369A1",
    iconDescription: "A speech bubble containing a single glowing rune",
    tagline: "The first word spoken changes the silence forever.",
    requirement: "Leave your first comment on any idea",
  },
  {
    id: 6,
    name: "The Seedling",
    category: "onboarding",
    rarity: "uncommon",
    shape: "diamond",
    primaryColor: "#ECFDF5",
    secondaryColor: "#059669",
    iconDescription: "A small green shoot emerging from dark soil",
    tagline: "From the smallest seed, the oldest oak.",
    requirement: "Create your first idea",
  },
  {
    id: 7,
    name: "The Outstretched Hand",
    category: "onboarding",
    rarity: "uncommon",
    shape: "shield",
    primaryColor: "#EEEDFE",
    secondaryColor: "#7F77DD",
    iconDescription:
      "Two hands reaching toward each other, fingertips almost touching",
    tagline: "No quest was ever completed alone.",
    requirement: "Send your first collaboration invite",
  },
  {
    id: 8,
    name: "Gate Crossed",
    category: "onboarding",
    rarity: "uncommon",
    shape: "arch",
    primaryColor: "#FEF3C7",
    secondaryColor: "#92400E",
    iconDescription: "An open stone gate with light pouring through",
    tagline: "The tutorial is behind you. The world is ahead.",
    requirement: "Complete all tutorial levels (Level 1–6)",
  },
  // Idea Milestones (18)
  {
    id: 9,
    name: "The First Checkpoint",
    category: "idea_milestones",
    rarity: "common",
    shape: "star",
    primaryColor: "#E0F2FE",
    secondaryColor: "#0369A1",
    iconDescription:
      "A single five-pointed star with a checkmark at its centre",
    tagline: "One gate crossed. Many await.",
    requirement: "Complete your first checkpoint on any idea",
  },
  {
    id: 10,
    name: "Gilded",
    category: "idea_milestones",
    rarity: "uncommon",
    shape: "star",
    primaryColor: "#FDE68A",
    secondaryColor: "#92400E",
    iconDescription: "A five-pointed star in gold with a crown at its centre",
    tagline: "You did not stop at enough. You reached for all.",
    requirement:
      "Complete your first gold checkpoint (all 3 tasks at a single checkpoint)",
  },
  {
    id: 11,
    name: "The First Gate Falls",
    category: "idea_milestones",
    rarity: "common",
    shape: "ribbon",
    primaryColor: "#ECFDF5",
    secondaryColor: "#059669",
    iconDescription:
      "A vertical ribbon with a stage number at the centre and a tick at the base",
    tagline:
      "The first stage falls. The road ahead grows longer and more worthy.",
    requirement: "Complete your first full stage on any idea",
  },
  {
    id: 12,
    name: "The Long Road",
    category: "idea_milestones",
    rarity: "uncommon",
    shape: "scroll",
    primaryColor: "#EEEDFE",
    secondaryColor: "#7F77DD",
    iconDescription:
      "A long winding road visible through a round cartographer's lens",
    tagline: "You have come further than most will ever go.",
    requirement: "Reach Stage 4 on any idea",
  },
  {
    id: 13,
    name: "The Heartland",
    category: "idea_milestones",
    rarity: "rare",
    shape: "shield",
    primaryColor: "#FCE7F3",
    secondaryColor: "#9D174D",
    iconDescription:
      "A shield with a heart at its centre, split diagonally between two colours",
    tagline: "You reached the core of what you set out to build.",
    requirement: "Complete Stage 5 (the longest/hardest stage) on any idea",
  },
  {
    id: 14,
    name: "The Launcher",
    category: "idea_milestones",
    rarity: "rare",
    shape: "rocket",
    primaryColor: "#FEF3C7",
    secondaryColor: "#92400E",
    iconDescription: "A ship leaving a harbour at dawn, sails catching wind",
    tagline: "What was imagined is now real. What was planned now sails.",
    requirement: "Complete the Launch stage on any Venture idea",
  },
  {
    id: 15,
    name: "The Full Circle",
    category: "idea_milestones",
    rarity: "epic",
    shape: "ring",
    primaryColor: "#FCE7F3",
    secondaryColor: "#9D174D",
    iconDescription:
      "A complete ring made of stage symbols, each section a different colour",
    tagline: "You began and you finished. Most only begin.",
    requirement:
      "Complete a full idea lifecycle — all stages from first to last",
  },
  {
    id: 16,
    name: "The Gilded Path",
    category: "idea_milestones",
    rarity: "epic",
    shape: "crown",
    primaryColor: "#FDE68A",
    secondaryColor: "#92400E",
    iconDescription:
      "A crown made of checkpoint markers, alternating standard and gold",
    tagline: "Not merely finished. Finished with excellence at every gate.",
    requirement:
      "Complete a full idea lifecycle with gold checkpoints at every stage's final checkpoint",
  },
  {
    id: 17,
    name: "The Archaeologist",
    category: "idea_milestones",
    rarity: "uncommon",
    shape: "shovel",
    primaryColor: "#E0F2FE",
    secondaryColor: "#0C4A6E",
    iconDescription:
      "A trowel crossing a magnifying glass over a layer of strata",
    tagline:
      "You dug until you found the answer. Others stopped at the surface.",
    requirement: "Complete a full Academic idea lifecycle",
  },
  {
    id: 18,
    name: "The Artificer",
    category: "idea_milestones",
    rarity: "uncommon",
    shape: "cog",
    primaryColor: "#ECFDF5",
    secondaryColor: "#064E3B",
    iconDescription:
      "A cog with a small flask at its centre — craft meets science",
    tagline: "You built a thing that answered a question. Few manage both.",
    requirement: "Complete a full Experimental idea lifecycle",
  },
  {
    id: 19,
    name: "The Author",
    category: "idea_milestones",
    rarity: "uncommon",
    shape: "quill",
    primaryColor: "#E0F2FE",
    secondaryColor: "#0369A1",
    iconDescription: "A quill pen writing the final word on a scroll",
    tagline: "The last word has been written. The work is complete.",
    requirement: "Complete a full Creative idea lifecycle",
  },
  {
    id: 20,
    name: "The Founder",
    category: "idea_milestones",
    rarity: "uncommon",
    shape: "flag",
    primaryColor: "#EEEDFE",
    secondaryColor: "#3C3489",
    iconDescription: "A flag planted on a hill, banner catching wind",
    tagline:
      "You built it. You launched it. You made something exist that did not before.",
    requirement: "Complete a full Venture idea lifecycle",
  },
  {
    id: 21,
    name: "The Polymath",
    category: "idea_milestones",
    rarity: "rare",
    shape: "four_quadrant_shield",
    primaryColor: "#F8F7FF",
    secondaryColor: "#2D2B55",
    iconDescription:
      "A shield divided into four quadrants, each with a different template symbol",
    tagline: "No single domain could contain you.",
    requirement: "Complete at least one idea in each of the four templates",
  },
  {
    id: 22,
    name: "The Cartographer",
    category: "idea_milestones",
    rarity: "rare",
    shape: "map",
    primaryColor: "#FEF3C7",
    secondaryColor: "#B45309",
    iconDescription: "A partially unrolled map with four marked locations",
    tagline:
      "You have drawn the edges of your world and found them wider than you thought.",
    requirement: "Post at least one idea in each of the four templates",
  },
  {
    id: 23,
    name: "Twice-Born",
    category: "idea_milestones",
    rarity: "uncommon",
    shape: "phoenix",
    primaryColor: "#FEF3C7",
    secondaryColor: "#78350F",
    iconDescription: "A small phoenix rising from stylised flames",
    tagline: "One completion proves you can. Two proves you will.",
    requirement: "Complete 2 full idea lifecycles (any template)",
  },
  {
    id: 24,
    name: "The Ten",
    category: "idea_milestones",
    rarity: "epic",
    shape: "roman_numeral_x",
    primaryColor: "#FDE68A",
    secondaryColor: "#92400E",
    iconDescription: "A bold Roman numeral X with a subtle crown above",
    tagline: "Ten ideas carried. Ten worlds begun.",
    requirement: "Post 10 ideas across any combination of templates",
  },
  {
    id: 25,
    name: "The Gold Standard",
    category: "idea_milestones",
    rarity: "epic",
    shape: "gold_bar",
    primaryColor: "#FDE68A",
    secondaryColor: "#92400E",
    iconDescription: "A stylised gold ingot with a star stamped on its face",
    tagline: "Excellence was not occasional. It was the standard.",
    requirement: "Earn 25 gold checkpoints across any ideas",
  },
  {
    id: 26,
    name: "Century",
    category: "idea_milestones",
    rarity: "legendary",
    shape: "shield_with_c",
    primaryColor: "#FDE68A",
    secondaryColor: "#92400E",
    iconDescription:
      "A large Roman numeral C on a gilded shield with ornate borders",
    tagline: "One hundred gates of gold. The record speaks for itself.",
    requirement: "Earn 100 gold checkpoints across any ideas",
  },
  // Community (12)
  {
    id: 27,
    name: "The Listener",
    category: "community",
    rarity: "common",
    shape: "ear",
    primaryColor: "#E0F2FE",
    secondaryColor: "#0369A1",
    iconDescription: "A stylised ear with a small sound wave emanating from it",
    tagline: "Before you can help, you must hear.",
    requirement: "Leave 10 comments across any ideas",
  },
  {
    id: 28,
    name: "The Advocate",
    category: "community",
    rarity: "common",
    shape: "raised_hand",
    primaryColor: "#ECFDF5",
    secondaryColor: "#059669",
    iconDescription:
      "An open upward-facing hand with a small star above the palm",
    tagline: "You saw something worth backing and you backed it.",
    requirement: "Spark 25 ideas",
  },
  {
    id: 29,
    name: "The Critic",
    category: "community",
    rarity: "uncommon",
    shape: "magnifying_glass",
    primaryColor: "#EEEDFE",
    secondaryColor: "#3C3489",
    iconDescription: "A magnifying glass over a scroll — closer examination",
    tagline:
      "Honest eyes are the most valuable gift you can give a fellow maker.",
    requirement:
      "Give 10 reviews or detailed comments that receive at least one spark",
  },
  {
    id: 30,
    name: "The Trusted Voice",
    category: "community",
    rarity: "rare",
    shape: "seal",
    primaryColor: "#EEEDFE",
    secondaryColor: "#3C3489",
    iconDescription:
      "A wax seal with a quill at its centre — the mark of the trusted correspondent",
    tagline: "Your words carry weight. Others wait to hear them.",
    requirement: "Give 50 sparked reviews or comments",
  },
  {
    id: 31,
    name: "The Ally",
    category: "community",
    rarity: "uncommon",
    shape: "linked_rings",
    primaryColor: "#ECFDF5",
    secondaryColor: "#059669",
    iconDescription:
      "Two interlocked rings, one larger, one smaller — alliance",
    tagline: "You joined someone else's cause and made it stronger.",
    requirement: "Join another user's idea as a collaborator",
  },
  {
    id: 32,
    name: "The Assembler",
    category: "community",
    rarity: "rare",
    shape: "table_and_chairs",
    primaryColor: "#EEEDFE",
    secondaryColor: "#7F77DD",
    iconDescription:
      "A round table with four chairs, one clearly the head of table",
    tagline: "You did not wait for a party. You built one.",
    requirement: "Recruit 5 collaborators across all your ideas",
  },
  {
    id: 33,
    name: "The Catalyst",
    category: "community",
    rarity: "rare",
    shape: "spark",
    primaryColor: "#FEF3C7",
    secondaryColor: "#92400E",
    iconDescription:
      "A small lightning bolt striking a gear, setting it in motion",
    tagline: "Your review moved something that was standing still.",
    requirement: "Have 5 reviews you gave marked as helpful by an idea owner",
  },
  {
    id: 34,
    name: "The Followed",
    category: "community",
    rarity: "common",
    shape: "footprints",
    primaryColor: "#E0F2FE",
    secondaryColor: "#0C4A6E",
    iconDescription:
      "A trail of footprints, the last pair slightly larger than those following",
    tagline: "Others have decided your path is worth watching.",
    requirement: "Gain 10 followers",
  },
  {
    id: 35,
    name: "The Celebrated",
    category: "community",
    rarity: "uncommon",
    shape: "laurel_wreath",
    primaryColor: "#0EA5E9",
    secondaryColor: "#0284C7",
    iconDescription: "A clean trophy mark for a celebrated idea",
    tagline: "The community has spoken. Your idea deserved to rise.",
    requirement: "Have an idea receive 25 sparks",
  },
  {
    id: 36,
    name: "The Beloved",
    category: "community",
    rarity: "rare",
    shape: "heart_and_crown",
    primaryColor: "#FCE7F3",
    secondaryColor: "#9D174D",
    iconDescription: "A crown sitting above a heart — beloved by the community",
    tagline: "Fifty voices, one direction. They all pointed at your work.",
    requirement: "Have an idea receive 50 sparks",
  },
  {
    id: 37,
    name: "The Draw",
    category: "community",
    rarity: "epic",
    shape: "magnet",
    primaryColor: "#EEEDFE",
    secondaryColor: "#3C3489",
    iconDescription: "A horseshoe magnet with sparks at its poles",
    tagline: "Your idea pulled people in before it was even half-built.",
    requirement: "Have an idea receive 10 collaboration requests",
  },
  {
    id: 38,
    name: "The Connector",
    category: "community",
    rarity: "uncommon",
    shape: "bridge",
    primaryColor: "#E0F2FE",
    secondaryColor: "#0369A1",
    iconDescription: "A simple arch bridge connecting two landmasses",
    tagline: "You brought two ideas together and both were better for it.",
    requirement: "Collaborate on ideas created by 3 different users",
  },
  // Consistency (8)
  {
    id: 39,
    name: "The Regular",
    category: "consistency",
    rarity: "common",
    shape: "calendar",
    primaryColor: "#E0F2FE",
    secondaryColor: "#0369A1",
    iconDescription: "A simple calendar page with 7 days marked",
    tagline: "You came back. That matters more than most people know.",
    requirement:
      "Visit the platform and take at least one action on 7 consecutive days",
  },
  {
    id: 40,
    name: "The Devoted",
    category: "consistency",
    rarity: "uncommon",
    shape: "flame",
    primaryColor: "#FEF3C7",
    secondaryColor: "#92400E",
    iconDescription:
      "A steady flame — not dramatic, not wavering, just burning",
    tagline: "A flame that does not gutter. A builder who does not stop.",
    requirement: "Maintain a 30-day activity streak",
  },
  {
    id: 41,
    name: "The Unbroken",
    category: "consistency",
    rarity: "rare",
    shape: "chain",
    primaryColor: "#EEEDFE",
    secondaryColor: "#3C3489",
    iconDescription: "An unbroken chain of links in a circle — no weak point",
    tagline: "Ninety days. Not a single day unaccounted for.",
    requirement: "Maintain a 90-day activity streak",
  },
  {
    id: 42,
    name: "The Seasonal",
    category: "consistency",
    rarity: "uncommon",
    shape: "four_leaf_circle",
    primaryColor: "#ECFDF5",
    secondaryColor: "#064E3B",
    iconDescription: "A circle divided into four seasonal quadrants",
    tagline: "You were here in every season. The platform grew with you.",
    requirement:
      "Be active on the platform in all four calendar quarters of a single year",
  },
  // League-based badges are disabled until league mechanics are finalized.
  /*
  {
    id: 43,
    name: "The Weekly Champion",
    category: "consistency",
    rarity: "common",
    shape: "trophy",
    primaryColor: "#FDE68A",
    secondaryColor: "#92400E",
    iconDescription: "A small trophy with a number 1 on its base",
    tagline: "This week, no one worked harder. The league agrees.",
    requirement: "Finish in the top 5 of your league in any single week",
  },
  {
    id: 44,
    name: "The Promoted",
    category: "consistency",
    rarity: "uncommon",
    shape: "arrow_through_tiers",
    primaryColor: "#EEEDFE",
    secondaryColor: "#7F77DD",
    iconDescription:
      "An upward arrow passing through three horizontal bands of increasing colour intensity",
    tagline: "You earned your way up. The league moved with you.",
    requirement: "Earn a league promotion",
  },
  {
    id: 45,
    name: "The Diamond",
    category: "consistency",
    rarity: "rare",
    shape: "diamond_gem",
    primaryColor: "#E0F2FE",
    secondaryColor: "#0369A1",
    iconDescription: "A cut diamond gem with light refracting from its facets",
    tagline: "The highest league. The sharpest competition. You belong here.",
    requirement: "Reach Diamond league",
  },
  {
    id: 46,
    name: "The Immovable",
    category: "consistency",
    rarity: "epic",
    shape: "anchor",
    primaryColor: "#2D2B55",
    secondaryColor: "#FFFFFF",
    iconDescription:
      "A ship's anchor with a small crown above — steadfast and senior",
    tagline: "Others rose and fell. You held.",
    requirement: "Remain in Diamond league for 4 consecutive weeks",
  },
  */
  // Hidden (8)
  {
    id: 47,
    name: "The Midnight Oil",
    category: "hidden",
    rarity: "hidden",
    shape: "lantern",
    primaryColor: "#1A1A2E",
    secondaryColor: "#E94560",
    iconDescription: "A single lantern burning in complete darkness",
    tagline: "Some fires burn when no one is watching.",
    requirement:
      "Complete a checkpoint between midnight and 5am local time (any 3 occasions)",
  },
  {
    id: 48,
    name: "The Patient One",
    category: "hidden",
    rarity: "hidden",
    shape: "hourglass",
    primaryColor: "#1A1A2E",
    secondaryColor: "#E94560",
    iconDescription:
      "An hourglass where the sand is almost entirely in the bottom half",
    tagline: "You did not rush. The work knew it.",
    requirement:
      "Spend more than 30 days on a single stage before completing it",
  },
  {
    id: 49,
    name: "The Perfectionist",
    category: "hidden",
    rarity: "hidden",
    shape: "three_gold_stars",
    primaryColor: "#1A1A2E",
    secondaryColor: "#E94560",
    iconDescription:
      "Three gold stars arranged in a triangle, each perfectly identical",
    tagline: "You could have stopped. You didn't. Three times in a row.",
    requirement:
      "Complete 3 consecutive gold checkpoints with no standard completions in between",
  },
  {
    id: 50,
    name: "The Contrarian",
    category: "hidden",
    rarity: "hidden",
    shape: "inverted_triangle",
    primaryColor: "#1A1A2E",
    secondaryColor: "#E94560",
    iconDescription: "A triangle pointing downward — the unusual direction",
    tagline: "You chose the harder path before you chose the easier one.",
    requirement:
      "Complete Task 3 (stretch) before completing Task 1 or 2 on any checkpoint",
  },
  {
    id: 51,
    name: "The Renaissance",
    category: "hidden",
    rarity: "hidden",
    shape: "four_interlocked_circles",
    primaryColor: "#1A1A2E",
    secondaryColor: "#E94560",
    iconDescription: "Four overlapping circles in the four template colours",
    tagline:
      "The old word for someone who could not be contained by one discipline.",
    requirement: "Have an active idea in all four templates simultaneously",
  },
  {
    id: 52,
    name: "The Ghost",
    category: "hidden",
    rarity: "hidden",
    shape: "faint_silhouette",
    primaryColor: "#1A1A2E",
    secondaryColor: "#E94560",
    iconDescription:
      "A very faint translucent figure — present but barely visible",
    tagline: "You were here more than anyone knew.",
    requirement:
      "Complete 50 sparks given without receiving a single spark on your own content",
  },
  {
    id: 53,
    name: "Full Moon",
    category: "hidden",
    rarity: "hidden",
    shape: "moon",
    primaryColor: "#1A1A2E",
    secondaryColor: "#E94560",
    iconDescription: "A perfect full moon in a dark sky",
    tagline: "You were here when the platform was new enough to remember.",
    requirement:
      "Complete at least one action in every calendar month of the platform's first year",
  },
  {
    id: 54,
    name: "The Comeback",
    category: "hidden",
    rarity: "hidden",
    shape: "broken_chain",
    primaryColor: "#1A1A2E",
    secondaryColor: "#E94560",
    iconDescription:
      "A chain with a visible break and a bright new link connecting the two halves",
    tagline: "The streak broke. You came back anyway. That is harder.",
    requirement:
      "Return to an idea that has been inactive for 60+ days and complete a checkpoint",
  },
  // Aspirational (8)
  {
    id: 55,
    name: "The Visionary",
    category: "aspirational",
    rarity: "legendary",
    shape: "eye_with_star",
    primaryColor: "#0F172A",
    secondaryColor: "#F59E0B",
    iconDescription:
      "An open eye with a golden star as its pupil, radiating light",
    tagline: "Level 50. The apex. The one who saw it all the way through.",
    requirement: "Reach Level 50 (Visionary)",
  },
  {
    id: 56,
    name: "The Lorekeeper",
    category: "aspirational",
    rarity: "legendary",
    shape: "ancient_tome",
    primaryColor: "#0F172A",
    secondaryColor: "#F59E0B",
    iconDescription:
      "A thick ancient book with a glowing lock and ornate cover",
    tagline: "Five complete journeys. Five worlds brought into being.",
    requirement: "Complete 5 full idea lifecycles across any templates",
  },
  {
    id: 57,
    name: "The Realm Builder",
    category: "aspirational",
    rarity: "legendary",
    shape: "walled_city",
    primaryColor: "#0F172A",
    secondaryColor: "#F59E0B",
    iconDescription:
      "A miniature walled city viewed from above, complete with towers and gates",
    tagline: "You did not just complete ideas. You built a world.",
    requirement: "Complete 3 full Venture idea lifecycles",
  },
  {
    id: 58,
    name: "The Elder Scholar",
    category: "aspirational",
    rarity: "legendary",
    shape: "open_book_with_light",
    primaryColor: "#0F172A",
    secondaryColor: "#F59E0B",
    iconDescription: "An open book emitting light from its pages",
    tagline: "The library knew you before you finished reading it.",
    requirement: "Complete 3 full Academic idea lifecycles",
  },
  {
    id: 59,
    name: "The Grand Artificer",
    category: "aspirational",
    rarity: "legendary",
    shape: "clockwork_engine",
    primaryColor: "#0F172A",
    secondaryColor: "#F59E0B",
    iconDescription:
      "A complex clockwork mechanism — gears within gears, all turning in harmony",
    tagline: "Three experiments completed. Three truths added to the record.",
    requirement: "Complete 3 full Experimental idea lifecycles",
  },
  {
    id: 60,
    name: "The Master",
    category: "aspirational",
    rarity: "legendary",
    shape: "quill_and_sword",
    primaryColor: "#0F172A",
    secondaryColor: "#F59E0B",
    iconDescription:
      "A quill and a sword crossed at their centres — craft and courage",
    tagline: "Three complete creative works. Not attempts. Works.",
    requirement: "Complete 3 full Creative idea lifecycles",
  },
  {
    id: 61,
    name: "The Thousand",
    category: "aspirational",
    rarity: "legendary",
    shape: "1000_in_roman",
    primaryColor: "#0F172A",
    secondaryColor: "#F59E0B",
    iconDescription:
      "The Roman numeral M (1000) engraved on dark stone with gold inlay",
    tagline: "One thousand voices helped. One thousand ideas moved forward.",
    requirement: "Give 1,000 sparked reviews or comments across the platform",
  },
  // Monument-based badges are disabled until monument mechanics are finalized.
  /*
  {
    id: 62,
    name: "The Architect of Ages",
    category: "aspirational",
    rarity: "legendary",
    shape: "monument_silhouette",
    primaryColor: "#0F172A",
    secondaryColor: "#F59E0B",
    iconDescription:
      "The silhouette of a grand monument — the kind that outlasts its builder",
    tagline:
      "You have left something in the world that will outlast the making of it.",
    requirement: "Have 10 monuments placed on the shared world map",
  },
  */
  {
    id: 71,
    name: "The Spark Struck",
    category: "idea_milestones",
    rarity: "common",
    shape: "medal",
    primaryColor: "#ECFDF5",
    secondaryColor: "#059669",
    iconDescription: "A shining lightbulb medal",
    tagline: "You shaped the raw spark of an idea.",
    requirement: "Complete Stage 1: Ideation on any venture",
  },
  {
    id: 72,
    name: "The Map Drawn",
    category: "idea_milestones",
    rarity: "common",
    shape: "medal",
    primaryColor: "#ECFDF5",
    secondaryColor: "#059669",
    iconDescription: "A magnifying glass medal",
    tagline: "You searched the depths to find the truth.",
    requirement: "Complete Stage 2: Research on any venture",
  },
  {
    id: 73,
    name: "The World Answered",
    category: "idea_milestones",
    rarity: "common",
    shape: "medal",
    primaryColor: "#ECFDF5",
    secondaryColor: "#059669",
    iconDescription: "A checkmark seal medal",
    tagline: "You tested your dreams against reality.",
    requirement: "Complete Stage 3: Validation on any venture",
  },
  {
    id: 74,
    name: "The Shape of Things",
    category: "idea_milestones",
    rarity: "common",
    shape: "medal",
    primaryColor: "#ECFDF5",
    secondaryColor: "#059669",
    iconDescription: "A palette and brush medal",
    tagline: "You turned ideas into a compelling design.",
    requirement: "Complete Stage 4: Offer Design on any venture",
  },
  {
    id: 75,
    name: "The Forge Emptied",
    category: "idea_milestones",
    rarity: "common",
    shape: "medal",
    primaryColor: "#ECFDF5",
    secondaryColor: "#059669",
    iconDescription: "A hammer and anvil medal",
    tagline: "You forged the solution with your own hands.",
    requirement: "Complete Stage 5: Build & Deliver on any venture",
  },
  {
    id: 76,
    name: "The Harbour Left",
    category: "idea_milestones",
    rarity: "common",
    shape: "medal",
    primaryColor: "#ECFDF5",
    secondaryColor: "#059669",
    iconDescription: "A soaring rocket medal",
    tagline: "You launched your ship into the open sea.",
    requirement: "Complete Stage 6: Launch on any venture",
  },
  {
    id: 77,
    name: "The Second Shaping",
    category: "idea_milestones",
    rarity: "common",
    shape: "medal",
    primaryColor: "#ECFDF5",
    secondaryColor: "#059669",
    iconDescription: "A circular arrow loop medal",
    tagline: "You listened, adapted, and improved.",
    requirement: "Complete Stage 7: Iteration on any venture",
  },
  {
    id: 78,
    name: "The Kingdom Grows",
    category: "idea_milestones",
    rarity: "common",
    shape: "medal",
    primaryColor: "#ECFDF5",
    secondaryColor: "#059669",
    iconDescription: "A golden fortress crown medal",
    tagline: "You built a fortress that stands the test of time.",
    requirement: "Complete Stage 8: Scale on any venture",
  },
  ...STAGE_BADGE_DEFINITIONS,
];

// ─────────────────────────────────────────────────────────────────────────────
// POINT VALUES
// ─────────────────────────────────────────────────────────────────────────────
export const POINT_VALUES = {
  // Venture task completion
  task_t1_complete: 20,
  task_t2_complete: 20,
  task_t3_complete: 35,
  gold_checkpoint_bonus: 25,
  stage_complete_bonus: 50,
  venture_complete_bonus: 200,

  // Boss defeat
  boss_retreat: 25,
  boss_slay: 100,

  // Existing (from gamification.ts)
  create_idea: 50,
  spark_idea: 1,
  comment_idea: 1,
  daily_login: 10,

  // Flare system
  fire_flare: 0,
  respond_to_flare: 2,
  flare_marked_helpful: 5,
  flare_resolved: 10,

  // Mentor system
  accept_mentee: 20,
  mentee_checkpoint_advance: 3,
  mentee_level_up: 50,
} as const;

export function getVentureBadgeEmoji(badgeId: number, name: string): string {
  if (badgeId === 1) return "🕯️";
  if (badgeId === 2) return "👤";
  if (badgeId === 3) return "🛠️";
  if (badgeId === 4) return "🥾";
  if (badgeId === 5) return "💬";
  if (badgeId === 6) return "🌱";
  if (badgeId === 7) return "✉️";
  if (badgeId === 8) return "🚪";
  if (badgeId === 9) return "🎯";
  if (badgeId === 10) return "🪙";
  if (badgeId === 11) return "🚩";
  if (badgeId === 12) return "🛣️";
  if (badgeId === 13) return "❤️";
  if (badgeId === 14) return "🚀";
  if (badgeId === 15) return "🔄";
  if (badgeId === 16) return "👑";
  if (badgeId === 17) return "🎓";
  if (badgeId === 18) return "🔬";
  if (badgeId === 19) return "✍️";
  if (badgeId === 20) return "💼";
  if (badgeId === 21) return "🧠";
  if (badgeId === 22) return "🗺️";
  if (badgeId === 23) return "✨";
  if (badgeId === 24) return "🔟";
  if (badgeId === 25) return "🏆";
  if (badgeId === 26) return "💯";
  if (badgeId === 27) return "👂";
  if (badgeId === 28) return "📣";
  if (badgeId === 29) return "📝";
  if (badgeId === 30) return "🗣️";
  if (badgeId === 31) return "🤝";
  if (badgeId === 32) return "👥";
  if (badgeId === 33) return "⚡";
  if (badgeId === 34) return "📣";
  if (badgeId === 35) return "Trophy";
  if (badgeId === 36) return "❤️";
  if (badgeId === 37) return "🧲";
  if (badgeId === 38) return "🔗";
  if (badgeId === 39) return "📅";
  if (badgeId === 40) return "🔥";
  if (badgeId === 41) return "🛡️";
  if (badgeId === 42) return "🍂";
  // League-based badges are disabled until league mechanics are finalized.
  // if (badgeId === 43) return "🏆";
  // if (badgeId === 44) return "📈";
  // if (badgeId === 45) return "💎";
  // if (badgeId === 46) return "🧱";
  if (badgeId === 47) return "🌙";
  if (badgeId === 48) return "⏳";
  if (badgeId === 49) return "⭐";
  if (badgeId === 50) return "🌀";
  if (badgeId === 51) return "🎨";
  if (badgeId === 52) return "👻";
  if (badgeId === 53) return "🌕";
  if (badgeId === 54) return "🔄";
  if (badgeId === 55) return "👁️";
  if (badgeId === 56) return "📚";
  if (badgeId === 57) return "🏰";
  if (badgeId === 58) return "📖";
  if (badgeId === 59) return "⚙️";
  if (badgeId === 60) return "⚔️";
  if (badgeId === 61) return "👑";
  if (badgeId === 62) return "🏛️";
  if (badgeId === 71) return "💡";
  if (badgeId === 72) return "🔍";
  if (badgeId === 73) return "✅";
  if (badgeId === 74) return "🎨";
  if (badgeId === 75) return "🛠️";
  if (badgeId === 76) return "🚀";
  if (badgeId === 77) return "🔄";
  if (badgeId === 78) return "🏰";

  const n = name.toLowerCase();
  if (n.includes("gold") || n.includes("gilded")) return "🏆";
  if (n.includes("silver")) return "🥈";
  if (n.includes("bronze") || n.includes("branze")) return "🥉";
  if (n.includes("checkpoint") || n.includes("point")) return "📍";
  if (n.includes("stage") || n.includes("road")) return "🗺️";
  if (n.includes("comment") || n.includes("word") || n.includes("listen")) return "💬";
  if (n.includes("idea") || n.includes("seed") || n.includes("light")) return "💡";
  if (n.includes("collaborat") || n.includes("ally") || n.includes("friend")) return "👥";
  if (n.includes("boss") || n.includes("slayer") || n.includes("combat")) return "⚔️";
  if (n.includes("streak") || n.includes("daily") || n.includes("burn")) return "🔥";

  return "🏅";
}

