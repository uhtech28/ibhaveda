/**
 * Persona Dialogue
 *
 * Per-persona contextual lines fired on key game events. Each persona's
 * voice descriptor (set in `personas.ts`) shapes the tone of every line
 * — the Arcanist's lines lean analytical and abstract, the Drifter's
 * lean wry and opportunistic, the Sage's reflective, etc.
 *
 * One line is picked at random from the available pool when the event
 * fires. Pools intentionally have 2-3 variants so the persona doesn't
 * repeat the same line back-to-back across a long venture.
 *
 * Events covered:
 *   - checkpoint_gold       Player just completed 3/3 tasks
 *   - stage_clear           Final checkpoint of a stage was crossed
 *   - corruption_warning    Corruption hit the 75% (heavy) threshold
 *   - boss_revealed         Super boss progressed to "foreground"
 *   - venture_complete      All stages cleared
 *   - idle                  Long stretch with no activity (fallback)
 *
 * Adding events: extend `PersonaDialogueEvent` and add a pool key in
 * each persona's LINES record. Missing event pools fall back to the
 * persona's idle line.
 */

import type { PersonaId } from "./personas";

export type PersonaDialogueEvent =
  | "checkpoint_gold"
  | "stage_clear"
  | "corruption_warning"
  | "boss_revealed"
  | "venture_complete"
  | "idle";

type DialoguePools = Partial<Record<PersonaDialogueEvent, readonly string[]>>;

const ARCANIST: DialoguePools = {
  checkpoint_gold: [
    "Three constraints satisfied. The proof holds.",
    "All conditions met — the model is now provably consistent.",
    "Every variable accounted for. We move with full information.",
  ],
  stage_clear: [
    "Stage resolved. Notice how each piece informs the next.",
    "The whole now exceeds the sum of its parts. Onward.",
    "We have closed the loop. The work compounds from here.",
  ],
  corruption_warning: [
    "Entropy is winning faster than we are. Focus.",
    "The signal is degrading. We must act before noise dominates.",
    "Our decision space is collapsing. Choose now.",
  ],
  boss_revealed: [
    "The adversary has resolved itself into something we can study.",
    "Now we can name what we are fighting. Half the battle.",
    "The unknown has become a problem. Problems we can solve.",
  ],
  venture_complete: [
    "From first principles to a working whole. This is craft.",
    "Every part proven, every part assembled. We have done it.",
  ],
  idle: ["The next move is already implied. We need only see it."],
};

const RANGER: DialoguePools = {
  checkpoint_gold: [
    "All three. Clean shot.",
    "Three out of three. The trail is clear.",
    "Every task. No half measures.",
  ],
  stage_clear: [
    "Stage's behind us. Next ridge.",
    "Cleared. Don't look back.",
    "On to the next country.",
  ],
  corruption_warning: [
    "Storm closing fast. Move.",
    "Tracks are getting cold. Push.",
    "We are losing the light.",
  ],
  boss_revealed: [
    "There it is. I can see it now.",
    "Quarry spotted. We close in.",
    "Out from cover at last.",
  ],
  venture_complete: [
    "Made it through. Every trail walked.",
    "Long road. We're at the end of it.",
  ],
  idle: ["Quiet right now. Use it."],
};

const ALCHEMIST: DialoguePools = {
  checkpoint_gold: [
    "Full reaction. All three ingredients balanced.",
    "Clean precipitate. No impurities to filter.",
    "Three of three. A reproducible result.",
  ],
  stage_clear: [
    "The experiment converged. Time for the next one.",
    "Process complete. We have something to build on.",
    "Variables understood. We move with confidence.",
  ],
  corruption_warning: [
    "Reaction is destabilising. We need an intervention.",
    "The system is veering. Recalibrate or lose it.",
    "Failure is becoming the likelier outcome.",
  ],
  boss_revealed: [
    "Now we can isolate the cause. Methodically.",
    "The variable that has been ruining the runs — there it is.",
    "Adversary identified. Now we study it.",
  ],
  venture_complete: [
    "Hypothesis confirmed. The journey was the proof.",
    "Every test mattered. We have an answer.",
  ],
  idle: ["Always more to test. Always more to learn."],
};

const ARTISAN: DialoguePools = {
  checkpoint_gold: [
    "All three. The piece sings now.",
    "Every detail attended to. You can feel it.",
    "Three of three — and it shows in the work.",
  ],
  stage_clear: [
    "Finished. Set it down carefully and look at it.",
    "Stage's done. The next one's already in mind.",
    "Out of the workshop with this one. Time to make.",
  ],
  corruption_warning: [
    "We're rushing. The work is suffering.",
    "Hands are tired. We push past it carefully.",
    "Time pressure is bleeding into the craft. Steady.",
  ],
  boss_revealed: [
    "I can see what's been undoing our work.",
    "There — that's the thing that keeps breaking pieces.",
    "Now we can address it directly.",
  ],
  venture_complete: [
    "It's done. It's beautiful. It's ours.",
    "Every hand that touched this can be proud.",
  ],
  idle: ["The next stitch waits for the right moment."],
};

const DRIFTER: DialoguePools = {
  checkpoint_gold: [
    "Three for three. Don't get used to it.",
    "Clean. Let's not make a big deal of it.",
    "All three. Lucky us. Or not luck.",
  ],
  stage_clear: [
    "Out the other side. Keep walking.",
    "Stage done. The good news ends here.",
    "Through it. Don't slow down.",
  ],
  corruption_warning: [
    "Heat's coming. Time to move.",
    "We've stayed in one place too long.",
    "The walls are getting interested in us.",
  ],
  boss_revealed: [
    "There's the big shadow. Knew it was there.",
    "Not so invisible now, is it.",
    "Out of the dark. Good. I prefer fair fights.",
  ],
  venture_complete: [
    "Made it. Didn't think we would. Don't tell anyone I said that.",
    "Out the other side. With everything.",
  ],
  idle: ["Always be looking for the exit. Even when you don't need one."],
};

const ORACLE: DialoguePools = {
  checkpoint_gold: [
    "All three completed. The pattern is now whole.",
    "Three of three. The shape was always there — we found it.",
    "Every thread followed. The picture clarifies.",
  ],
  stage_clear: [
    "This chapter closes. Listen for the next one's opening.",
    "A passage complete. The signs say we continue.",
    "Stage resolved. The next is already calling.",
  ],
  corruption_warning: [
    "The signal is becoming hard to hear. Quiet now.",
    "Confusion grows. We must listen harder.",
    "The pattern is breaking up. Refocus.",
  ],
  boss_revealed: [
    "I have been hearing it all along. Now you can too.",
    "The shape behind the noise — it shows itself.",
    "It was always there. Now it is named.",
  ],
  venture_complete: [
    "The story was always going to end like this.",
    "We followed the signal all the way home.",
  ],
  idle: ["Wait. The next thing is forming."],
};

const ENGINEER: DialoguePools = {
  checkpoint_gold: [
    "Three of three. Spec met in full.",
    "All tasks. No partial deliveries.",
    "Complete to specification.",
  ],
  stage_clear: [
    "Stage shipped. Audit complete.",
    "Closed out. On to the next milestone.",
    "Stage done. Tooling moves forward.",
  ],
  corruption_warning: [
    "Tech debt is now blocking. Address it.",
    "We are out of buffer. No more slip.",
    "System integrity is compromised. Stop and fix.",
  ],
  boss_revealed: [
    "The root cause. Finally visible.",
    "Bottleneck identified. We engineer around it.",
    "The constraint shows itself. Good.",
  ],
  venture_complete: [
    "Shipped, audited, in production. Done.",
    "End-to-end. Every requirement met.",
  ],
  idle: ["Next requirement is up. Read carefully."],
};

const HEALER: DialoguePools = {
  checkpoint_gold: [
    "All three. The team's hand is in this work.",
    "Three out of three. Everyone gave something.",
    "Full completion. Hold this win lightly.",
  ],
  stage_clear: [
    "Stage cleared. Make sure everyone breathed.",
    "Done. Now we tend to those who did it.",
    "Through. Look around — who needs care?",
  ],
  corruption_warning: [
    "The team is fraying. We slow down.",
    "Exhaustion is the real enemy now. Rest.",
    "Hold the work — hold the people first.",
  ],
  boss_revealed: [
    "Now we know what has been hurting us.",
    "The wound has a face now.",
    "We can finally heal what this caused.",
  ],
  venture_complete: [
    "We finished it. Everyone is still here.",
    "Together. From start to finish. That is the win.",
  ],
  idle: ["Quiet moment. Use it to check in."],
};

const PATHFINDER: DialoguePools = {
  checkpoint_gold: [
    "All three paths walked. Good map now.",
    "Three of three. We can see the next route.",
    "Every option explored. We know which one is true.",
  ],
  stage_clear: [
    "This region is mapped. On to terra incognita.",
    "Pass cleared. Next country waits.",
    "Stage charted. The route is open.",
  ],
  corruption_warning: [
    "We are losing landmarks. Backtrack and pick up the trail.",
    "Visibility is dropping. We move more carefully.",
    "The map is going dark. Trust the next step.",
  ],
  boss_revealed: [
    "The obstacle on the horizon — finally legible.",
    "Now I can plan a route through it.",
    "We have a coordinate. We have a plan.",
  ],
  venture_complete: [
    "Mapped from start to finish. The journey is the artefact.",
    "Every route taken. The terrain is known.",
  ],
  idle: ["Reading the ground. The path will show itself."],
};

const SAGE: DialoguePools = {
  checkpoint_gold: [
    "All three. Notice what that took.",
    "Three of three. Sit with this for a moment.",
    "Complete. There is a lesson in how we got here.",
  ],
  stage_clear: [
    "A stage of the journey ends. What did it teach us?",
    "We have crossed. Look back once, then forward.",
    "Stage done. The wisdom of it is yours now.",
  ],
  corruption_warning: [
    "The work itself is asking us to slow down.",
    "Notice the pressure. Do not let it choose for you.",
    "There is a lesson here. Read it before acting.",
  ],
  boss_revealed: [
    "The shadow had a name. Now we say it aloud.",
    "Every venture has one of these. Now we meet ours.",
    "Now the real work begins. The kind that teaches you.",
  ],
  venture_complete: [
    "The lesson lives in you now. Carry it forward.",
    "What you built matters less than who you became.",
  ],
  idle: ["The quiet between actions is where most learning happens."],
};

const DIALOGUE_BY_PERSONA: Record<PersonaId, DialoguePools> = {
  arcanist: ARCANIST,
  ranger: RANGER,
  alchemist: ALCHEMIST,
  artisan: ARTISAN,
  drifter: DRIFTER,
  oracle: ORACLE,
  engineer: ENGINEER,
  healer: HEALER,
  pathfinder: PATHFINDER,
  sage: SAGE,
};

/**
 * Pick a dialogue line for the given persona + event. Returns one line
 * at random from the available pool. Falls back to the persona's idle
 * pool if no specific lines are defined for the event.
 *
 * Returns null only if the personaId is unrecognised (defensive — every
 * id from PERSONA_DEFINITIONS has a pool).
 */
export function pickPersonaLine(
  personaId: PersonaId,
  event: PersonaDialogueEvent,
): string | null {
  const pools = DIALOGUE_BY_PERSONA[personaId];
  if (!pools) return null;
  const pool = pools[event] ?? pools.idle;
  if (!pool || pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}
