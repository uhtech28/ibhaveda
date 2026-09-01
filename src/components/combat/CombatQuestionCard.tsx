"use client";

/**
 * Single question card during a combat round. Undertale-inspired
 * dialogue layout:
 *
 *   ┌───────────────────────────────────────────────────────────┐
 *   │ [PORTRAIT]   * <pixel-font question prompt with the       │
 *   │  64 × 64       asterisk prefix that defines the look>     │
 *   └───────────────────────────────────────────────────────────┘
 *
 * Below the dialogue: HP bars (boss + player), the answer textarea
 * (modern legibility — pixel fonts are too cramped for paragraphs),
 * the depleting ring timer, and a Submit button.
 *
 * The portrait is a placeholder colored block keyed by persona until
 * mini-boss artwork is wired in. The block dimensions match a 64×64
 * pixel sprite so swapping in art is drop-in.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HPBar } from "./HPBar";
import { useKeystrokeTelemetry } from "@/lib/hooks/useKeystrokeTelemetry";
import type {
  CombatCurrentQuestion,
  KeystrokeTelemetry,
} from "@/lib/combat/types";
import type { VillageBossInfo } from "@/config/village-bosses";
import { getPersona, type PersonaId } from "@/config/personas";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { getBossFaceUrl } from "@/lib/bosses/bossFaces";

interface Props {
  question: CombatCurrentQuestion;
  bossHpCurrent: number;
  bossHpInitial: number;
  playerHpCurrent: number;
  playerHpInitial: number;
  questionsAnsweredCount: number;
  totalQuestions: number;
  onSubmit: (answer: string, telemetry: KeystrokeTelemetry) => void;
  onExpire: (answer: string, telemetry: KeystrokeTelemetry) => void;
  isLocked: boolean;
  /** Boss identity — enables biome-themed arena + real sprites. */
  boss?: VillageBossInfo | null;
  /** Founder persona spritesheet path — usually the Village persona idle
   *  frame. Renders on the left of the arena as "You". */
  founderAsset?: string | null;
  /** The user's actual idea/venture title (e.g. "Retlify AI").  Rendered
   *  in the "IDEA: BOSS CHALLENGE" header instead of the hardcoded slug. */
  ideaTitle?: string | null;
}

export function CombatQuestionCard({
  question,
  bossHpCurrent,
  bossHpInitial,
  playerHpCurrent,
  playerHpInitial,
  questionsAnsweredCount,
  totalQuestions,
  onSubmit,
  onExpire,
  isLocked,
  boss = null,
  founderAsset = null,
  ideaTitle = null,
}: Props) {
  const [value, setValue] = useState("");
  const { handlers, snapshot, reset } = useKeystrokeTelemetry();
  const valueRef = useRef(value);

  // ── Reaction animation state ──────────────────────────────────────
  // Triggered when HP changes between questions. We compare last-seen
  // HP to current HP to infer whether the boss took damage (player hit)
  // or the player took damage (boss counter), and at what intensity.
  type ReactionKind = "idle" | "hit" | "crit" | "counter" | "block";
  const [bossReaction, setBossReaction] = useState<ReactionKind>("idle");
  // Tracks question index so block can fire when the index advances
  // with effectively no HP change on either side (a parry).
  const lastQuestionIdRef = useRef(question._id);
  const [playerHurt, setPlayerHurt] = useState(false);
  // OPTIMISTIC persona attack — fires the SECOND the user clicks
  // Attack, before the server evaluates. Gives instant visual feedback
  // ("I hit the boss") that doesn't depend on the 2-3s round-trip.
  // Cleared when the real reaction lands.
  const [pendingAttack, setPendingAttack] = useState(false);
  const pendingAttackTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Every time a REAL server reaction lands (hit / crit / counter),
  // bump this counter. It's woven into the sprite React `key`, so a
  // remount fires and the attack/hurt clip plays FRESH — even if the
  // sprite was already keyed to the same state string via the earlier
  // optimistic pendingAttack. Without this, the sequence was:
  //   click → pendingAttack sets state="hurt" → clip plays once for
  //   1.8s → sprite freezes on frame 0 (fillMode=none) → server
  //   responds 2-4s later, sets bossReaction="hit" which ALSO maps to
  //   state="hurt" → same React key → no remount → no second play.
  //   User never actually saw the damage animation because the visible
  //   window was over before the outcome committed.
  // Counter-based key forces a clean second play the moment the real
  // reaction arrives, at the tuned slow FPS (~1.8s boss / ~3s persona).
  const [reactionEpoch, setReactionEpoch] = useState(0);
  const [bossDamage, setBossDamage] = useState<number | null>(null);
  const [playerDamage, setPlayerDamage] = useState<number | null>(null);
  const lastBossHpRef = useRef(bossHpCurrent);
  const lastPlayerHpRef = useRef(playerHpCurrent);
  const reactionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const playerHurtTimerRef = useRef<NodeJS.Timeout | null>(null);
  const damageNumberTimerRef = useRef<NodeJS.Timeout | null>(null);
  const playerDamageNumberTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ── Attack-flow state machine ──────────────────────────────────────────
  // Per product spec: when the user clicks Attack, the question card
  // (dialogue + textarea + attack button) DISAPPEARS while the battle
  // scene plays the swing/hurt animation. Once the animation completes,
  // if the round hasn't ended, a transition message shows until the
  // next question loads. Round-ending outcomes skip the message and
  // go straight to the result panel via CombatPanel's existing
  // CINEMATIC_HOLD_MS handoff.
  //
  //   idle      → question + textarea + attack button visible
  //   swinging  → question card hidden, battle scene playing the swing;
  //               entered on Attack click, exits when server HP delta
  //               lands (or on safety timer)
  //   message   → question card hidden, transition banner shown; enters
  //               after `swinging` when round continues (bossDelta or
  //               playerDelta > 0 but nobody died); exits when the next
  //               question._id arrives
  type AttackPhase = "idle" | "swinging" | "message";
  const [attackPhase, setAttackPhase] = useState<AttackPhase>("idle");
  const [transitionMessage, setTransitionMessage] = useState<string | null>(
    null,
  );
  const attackPhaseTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const prevBoss = lastBossHpRef.current;
    const prevPlayer = lastPlayerHpRef.current;
    const bossDelta = prevBoss - bossHpCurrent; // positive = boss took damage
    const playerDelta = prevPlayer - playerHpCurrent; // positive = player took damage

    // Real reaction lands — clear any optimistic pre-swing.
    //
    // We clear on ANY server-truth signal, not just HP changes:
    //   - bossDelta > 0    → player landed a hit (server confirmed)
    //   - playerDelta > 0  → boss counter (server confirmed)
    //   - question advanced → block/miss round (server progressed even
    //                         though nobody took HP damage)
    //
    // Why this matters: the boss sprite maps BOTH `pendingAttack` and
    // `bossReaction === "hit"|"crit"` to the SAME "hurt" state string.
    // The sprite is keyed by state string, so as long as the pending →
    // real transition is direct, the sprite key stays "hurt" and no
    // remount / no animation restart happens — the optimistic clip
    // simply IS the confirmation clip.
    //
    // The bug that lived here: pendingAttack used to auto-clear on a
    // short 1500ms timer (see handleSubmitClick below). If the server
    // took >1.5s to respond (typical is 2-3s), the sprite went
    // hurt → idle → hurt, playing the HURT clip TWICE with a visible
    // idle gap between plays. Extending the safety timer + clearing
    // here on block/miss keeps the state transitions clean.
    const serverResponded =
      bossDelta > 0 ||
      playerDelta > 0 ||
      question._id !== lastQuestionIdRef.current;
    if (serverResponded) {
      setPendingAttack(false);
      if (pendingAttackTimerRef.current) {
        clearTimeout(pendingAttackTimerRef.current);
        pendingAttackTimerRef.current = null;
      }
    }
    if (bossDelta > 0) {
      // Player landed a hit. Pick CRIT if delta >= 20% of initial HP.
      // Reaction hold times bumped ~50% (was 1300/1600ms) so the
      // Snappy attack cadence — the earlier "slow so users can see"
      // tuning made the fight feel sluggish (product feedback: "after
      // attack screen zoom and animations in slow speed playing").
      // We now play through the boss/persona clips at ~9fps so each
      // 9-frame reaction lands in ~1s and the arena cinematic keeps
      // pace with the swing/recoil.
      const critThreshold = bossHpInitial * 0.2;
      const kind: ReactionKind = bossDelta >= critThreshold ? "crit" : "hit";
      setBossReaction(kind);
      // Bump epoch → sprite React key changes → attack/hurt clips
      // remount and replay from frame 0 at the slow cinematic FPS,
      // guaranteeing the player sees the damage beat even when the
      // server response outran the optimistic pendingAttack clip.
      setReactionEpoch((e) => e + 1);
      setBossDamage(Math.round(bossDelta));
      // Reaction hold bumped (2026-08-10) — with the slower FPS above
      // the 9-frame hurt clip now runs ~2.7s at 3-4fps, so returning
      // to idle at 900-1100ms was cutting off the last two frames
      // and reading as "hit → snap back". These holds keep the boss
      // in its recoil pose long enough to read as "took the hit,
      // still staggering." Senior game dev pattern: hurt hold ≈ clip
      // length + 300ms breather.
      if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current);
      reactionTimerRef.current = setTimeout(
        () => setBossReaction("idle"),
        kind === "crit" ? 2600 : 2200,
      );
      if (damageNumberTimerRef.current) clearTimeout(damageNumberTimerRef.current);
      damageNumberTimerRef.current = setTimeout(
        () => setBossDamage(null),
        2400,
      );
    } else if (playerDelta > 0) {
      // Boss counter-attacked. Show player damage flash + boss "counter" pose.
      setBossReaction("counter");
      // See bossDelta branch above for why we bump the epoch — same
      // remount trick makes the boss's counter-swing and the persona's
      // hurt recoil replay cleanly at slow cinematic speed.
      setReactionEpoch((e) => e + 1);
      setPlayerHurt(true);
      setPlayerDamage(Math.round(playerDelta));
      if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current);
      reactionTimerRef.current = setTimeout(
        () => setBossReaction("idle"),
        2400,
      );
      if (playerHurtTimerRef.current) clearTimeout(playerHurtTimerRef.current);
      playerHurtTimerRef.current = setTimeout(
        () => setPlayerHurt(false),
        2200,
      );
      if (playerDamageNumberTimerRef.current)
        clearTimeout(playerDamageNumberTimerRef.current);
      playerDamageNumberTimerRef.current = setTimeout(
        () => setPlayerDamage(null),
        1800,
      );
    } else if (
      // Question advanced but neither side took >1 HP of damage.
      // This is a defensive exchange — the answer landed in the middle
      // band where boss blocks player's attack and player parries the
      // counter. Show a BLOCK animation: small jitter + darken + "BLOCK"
      // label that arcs across the dialogue.
      question._id !== lastQuestionIdRef.current &&
      Math.abs(bossDelta) <= 1 &&
      Math.abs(playerDelta) <= 1
    ) {
      setBossReaction("block");
      if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current);
      reactionTimerRef.current = setTimeout(
        () => setBossReaction("idle"),
        600,
      );
    }

    // Attack-flow state machine advancement (see AttackPhase decl above).
    // When we're mid-swing and the server has just responded (any HP
    // delta OR a question advance), transition into the "message" beat
    // and pick the outcome-specific line. Round-ending is detected
    // externally via CINEMATIC_HOLD_MS / isLocked; here we just show
    // the mid-round message which will get unmounted when the parent
    // swaps in the result panel anyway.
    if (attackPhase === "swinging") {
      const advanced = question._id !== lastQuestionIdRef.current;
      if (bossDelta > 0 || playerDelta > 0 || advanced) {
        // Two-line binary per product ask ("we dont want that your
        // attack struck home use any of these lines as per answer").
        // Player took HP → ineffective / hurt. Otherwise → effective
        // (covers real damage AND the neutral block case, since a
        // successful block still means the answer landed enough to
        // stop the boss's counter).
        const msg =
          playerDelta > 0
            ? "Your attack was ineffective. You've been hurt!"
            : "Your attack was effective.";
        setTransitionMessage(msg);
        setAttackPhase("message");
      }
    }

    lastBossHpRef.current = bossHpCurrent;
    lastPlayerHpRef.current = playerHpCurrent;
    lastQuestionIdRef.current = question._id;
  }, [bossHpCurrent, playerHpCurrent, bossHpInitial, question._id, attackPhase]);

  useEffect(() => {
    return () => {
      if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current);
      if (playerHurtTimerRef.current) clearTimeout(playerHurtTimerRef.current);
      if (damageNumberTimerRef.current) clearTimeout(damageNumberTimerRef.current);
      if (playerDamageNumberTimerRef.current)
        clearTimeout(playerDamageNumberTimerRef.current);
      if (pendingAttackTimerRef.current)
        clearTimeout(pendingAttackTimerRef.current);
      if (attackPhaseTimerRef.current)
        clearTimeout(attackPhaseTimerRef.current);
    };
  }, []);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    // Guard: `_id === "transition"` is CombatPanel's placeholder
    // question that gets synthesized while the server is between real
    // questions. It's NOT a new question — treating it as one would
    // reset attackPhase back to "idle" and remount the dialogue +
    // textarea + attack button on top of the between-questions
    // message overlay (product report: "instead of next question
    // line we have to use these lines according to the answer").
    // Skip the reset entirely for transition IDs; the phase stays on
    // "swinging" / "message" until a real Q._id arrives.
    if ((question._id as unknown as string) === "transition") return;

    reset();
    setValue("");
    valueRef.current = "";
    setDialogueDone(false); // hold the timer until this new question's typewriter finishes
    // A REAL new question drops us back to the idle attack phase so
    // the dialogue + textarea + attack button reappear. Also clear
    // the transition message so it doesn't linger over the new prompt.
    setAttackPhase("idle");
    setTransitionMessage(null);
    if (attackPhaseTimerRef.current) {
      clearTimeout(attackPhaseTimerRef.current);
      attackPhaseTimerRef.current = null;
    }
  }, [question._id, reset]);

  // Whether the AI dialogue typewriter has finished — controls when
  // the timer ring is allowed to start counting (product request:
  // "timer starts after AI completes the question").
  const [dialogueDone, setDialogueDone] = useState(false);

  // Auto-scroll the textarea into view as soon as the dialogue
  // finishes typing. Users kept missing the answer box below the
  // fold and thought the panel was cut off (product report:
  // "i cant scroll and find the type box to answer").
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    if (!dialogueDone) return;
    const el = textareaRef.current;
    if (!el) return;
    const t = window.setTimeout(() => {
      try {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      } catch {
        /* older browsers — no-op */
      }
    }, 200);
    return () => window.clearTimeout(t);
  }, [dialogueDone, question._id]);

  const handleSubmitClick = useCallback(() => {
    if (isLocked) return;
    // Fire an OPTIMISTIC persona attack + boss recoil the moment the
    // user commits to the answer. This gives instant feedback while the
    // AI evaluates (usually 2-3s). Once the server responds and the
    // real HP delta comes in, the reactive logic above takes over and
    // clears this state via setPendingAttack(false).
    //
    // Safety timeout must outlast the server p99 round-trip (~2-3s)
    // AND the boss/persona reaction cinematic (~2.5s at the slower
    // FPS). 6s covers both the slowest server response and the full
    // recoil animation, so the zoom-out doesn't kick in mid-animation
    // on a real timeout — was 4s, which cut off ~1s of recoil.
    setPendingAttack(true);
    // Enter the "swinging" phase — hides the question dialogue,
    // textarea, and attack button; keeps the battle scene visible so
    // the sprite animation reads uninterrupted. The transition to
    // "message" or the round-end result panel happens via the HP-diff
    // effect above (or via CombatPanel's CINEMATIC_HOLD_MS for
    // round-ending outcomes, which unmounts this whole card).
    setAttackPhase("swinging");
    setTransitionMessage(null);
    if (attackPhaseTimerRef.current) {
      clearTimeout(attackPhaseTimerRef.current);
      attackPhaseTimerRef.current = null;
    }
    if (pendingAttackTimerRef.current) clearTimeout(pendingAttackTimerRef.current);
    pendingAttackTimerRef.current = setTimeout(
      () => setPendingAttack(false),
      6000,
    );
    onSubmit(valueRef.current, snapshot());
  }, [isLocked, onSubmit, snapshot]);

  const handleExpire = useCallback(() => {
    onExpire(valueRef.current, snapshot());
  }, [onExpire, snapshot]);

  const onKeyDownComposite = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Stop Phaser (which listens on window for WASD/arrow/E) from
      // hijacking keystrokes when the user is typing an answer. Same
      // fix we applied to the wizard textareas — without this,
      // pressing "a"/"w"/"s"/"d"/"e" moves the persona on the map
      // behind this modal instead of typing into the answer box.
      e.stopPropagation();
      handlers.onKeyDown(e);
      // Plain Enter submits (Shift+Enter still inserts a newline for
      // multi-line answers). Cmd/Ctrl+Enter also submits — belt and
      // suspenders. Product asked for one-key submit + hide the
      // "Cmd/Ctrl + Enter" hint from the UI.
      if (e.key === "Enter" && !e.shiftKey && !isLocked) {
        e.preventDefault();
        handleSubmitClick();
      }
    },
    [handlers, isLocked, handleSubmitClick],
  );

  return (
    <div className="relative w-full">
      {/* Full-panel red flash removed — the Pixellab persona HURT
          clip already conveys the counter-attack. Layering a big red
          scrim over the whole panel on top of the sprite was reading
          as an extra unrelated animation. */}

      {/* Title bar — shows the founder's actual venture/idea name
          followed by "BOSS CHALLENGE" (per product feedback: "the
          most top should be like the old one only with the idea
          title"). Extra top padding clears the tutorial progress
          bar which sits at top-16 above the panel. Circular timer
          sits inline on the right per product request "timer at top". */}
      <div
        // Two-column layout: title takes the full LEFT width, timer
        // sits on the right. Removes the old centered layout that
        // wasted a spacer column and pushed the title into the
        // middle. Product ask: "START HEADING FROM MORE LEFT".
        className="mb-2 grid grid-cols-[1fr_auto] items-center gap-2 bg-black px-2 py-1 sm:gap-3 sm:px-4"
        style={{ marginTop: "1.5rem" }}
      >
        <div className="flex min-w-0 items-center justify-start">
          {/*
            📍 pin emoji removed per product ask ("REMOVE THE EMOTE
            BEFORE THE CHALLENGE HEADING"). Title left-aligned so
            it starts flush with the panel's left padding instead of
            being centered — matches the "start from more left" ask.
            Format: "PROJECT NAME : BOSS NAME CHALLENGE". Responsive
            sizing: text-sm on narrow phones so the full title fits,
            text-lg on ≥sm, text-xl on ≥md.
          */}
          <span
            // Sizes stepped down one notch per product ask ("LITTLE BIT
            // LOWER THE SIZE OF CHALLENGE HEADING"). Previously
            // text-sm / sm:text-lg / md:text-xl; now text-xs /
            // sm:text-base / md:text-lg — reads calmer without
            // losing legibility on any breakpoint.
            className="min-w-0 truncate font-mono text-xs font-black uppercase tracking-wider text-emerald-300 sm:text-base sm:tracking-widest md:text-lg"
            style={{ fontFamily: "var(--font-pixel-display), monospace" }}
            title={`${ideaTitle ?? ""} : ${boss?.name ?? "Boss"} Challenge`}
          >
            {ideaTitle && ideaTitle.trim().length > 0 ? (
              <>
                {ideaTitle}
                <span className="mx-1 text-emerald-500/80">:</span>
              </>
            ) : null}
            {boss?.name && boss.name.trim().length > 0 ? boss.name : "Boss"}
            <span className="hidden sm:inline">&nbsp;&nbsp;Challenge</span>
          </span>
        </div>
        {/* Timer cell — right-aligned so the ring sits at the top of
            the panel rather than floating inside the arena. */}
        <div className="flex items-center justify-end">
          {/* Smaller ring per product request ("decrease the size of
              time and don't mention time inside it"). Bumped from 48
              → 28px with proportionally-thinner stroke — timer now
              reads as a subtle status pip rather than a big clock. */}
          <CombatTimerRing
            servedAt={question.servedAt}
            durationMs={Math.max(240_000, question.durationMs)}
            onExpire={handleExpire}
            enabled={
              dialogueDone &&
              (question._id as unknown as string) !== "transition"
            }
            size={28}
            stroke={3}
          />
        </div>
      </div>

      {/* Single-column layout — sidebar removed per product request.
          Tight gap-2 so header + arena + textarea + Attack all fit in
          one viewport without scrolling. */}
      <div className="flex flex-col gap-2">
        {/* Battle scene — HP bars are rendered UNDER each character
            inside BattleScene now (platforms removed per product
            request). */}
        <BattleScene
          persona={question.persona}
          bossReaction={bossReaction}
          playerHurt={playerHurt}
          pendingAttack={pendingAttack}
          reactionEpoch={reactionEpoch}
          bossAsset={boss?.idleAsset ?? null}
          checkpointIndex={boss?.checkpointIndex ?? null}
          founderAsset={founderAsset}
          playerHpCurrent={playerHpCurrent}
          playerHpInitial={playerHpInitial}
          bossHpCurrent={bossHpCurrent}
          bossHpInitial={bossHpInitial}
          bossName={boss?.name ?? "Doubt Imp"}
        />

        {/* Question card body — dialogue + textarea + attack button.
            Hidden during the attack animation and the between-question
            transition beat per product spec ("the question screen
            disappears"). Also hidden when the parent has swapped in
            the "transition" placeholder question (CombatPanel does
            this when the server is between real questions) — those
            renders should show the outcome message, not a dialogue
            with hardcoded placeholder prompt text. */}
        {attackPhase === "idle" &&
          (question._id as unknown as string) !== "transition" && (
          <>
            {/* Dialogue box */}
            <ReactiveDialogueShell
              bossReaction={bossReaction}
              bossDamage={bossDamage}
              playerDamage={playerDamage}
            >
              <DialoguePanel
                persona={question.persona}
                prompt={question.prompt}
                // Pass the current boss's idle-frame path so the portrait
                // shows the actual monster face (Fog of Vagueness, Wraith,
                // Unraveller, etc.) instead of the generic red SVG villain.
                bossAsset={boss?.idleAsset ?? null}
                // Also pass the boss's display name — DialoguePanel prefers
                // the hand-picked face portrait from src/lib/bosses/bossFaces
                // when we have one for this boss, and only falls back to
                // clipping the idle spritesheet when we don't.
                bossName={boss?.name ?? null}
                onDone={() => setDialogueDone(true)}
              />
            </ReactiveDialogueShell>

            {/* Answer textarea */}
            {/* Copy / paste / cut / right-click BLOCKED per product
                request — see earlier task. */}
            <textarea
              ref={textareaRef}
              aria-label="Your answer"
              className="min-h-[72px] w-full resize-y bg-black p-2 font-mono text-sm leading-relaxed text-white outline-none disabled:opacity-60"
              placeholder="Type your answer to defeat the boss…"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onPaste={(e) => {
                e.preventDefault();
                handlers.onPaste(e);
              }}
              onCopy={(e) => e.preventDefault()}
              onCut={(e) => e.preventDefault()}
              onContextMenu={(e) => e.preventDefault()}
              onDrop={(e) => e.preventDefault()}
              onKeyDown={onKeyDownComposite}
              // Belt-and-suspenders: some browsers dispatch KEYUP/KEYPRESS
              // events to Phaser via document listeners even when KEYDOWN
              // is stopped at the React root. Stop them here too so WASD/E
              // never reach the map scene while the answer box is focused.
              onKeyUp={(e) => e.stopPropagation()}
              onKeyPress={(e) => e.stopPropagation()}
              disabled={isLocked}
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
            />

            <div className="flex items-center justify-end text-xs">
              {/* "Cmd/Ctrl + Enter to attack" hint removed per product
                  request — plain Enter now submits, Attack button is
                  self-explanatory. */}
              <button
                type="button"
                onClick={handleSubmitClick}
                disabled={isLocked}
                className="border-2 border-white bg-black px-5 py-1.5 font-mono text-xs uppercase tracking-wider text-white transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
                style={{ fontFamily: "var(--font-pixel-display), monospace" }}
              >
                Attack
              </button>
            </div>
          </>
        )}

        {/* Transition-message banner — shown between questions and
            during the swing beat. Text is one of the three spec
            lines picked from the last HP delta (set by the HP-diff
            effect above); if the swing/transition state was entered
            without a known outcome yet, default to "struck home" so
            the banner never renders empty. */}
        {(attackPhase !== "idle" ||
          (question._id as unknown as string) === "transition") && (
          <div
            className="flex min-h-[96px] items-center justify-center border-2 border-white bg-black px-6 py-5 text-center"
            role="status"
            aria-live="polite"
          >
            <span
              className="text-sm font-mono uppercase tracking-[0.14em] text-white sm:text-base"
              style={{
                fontFamily: "var(--font-pixel-display), monospace",
                textShadow: "0 1px 6px rgba(0,0,0,0.7)",
              }}
            >
              {transitionMessage ?? "Your attack was effective."}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Sub-components for the mockup layout
// ─────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────
// Circular timer ring — sits in the top-right corner of the arena.
// Shares the same wall-clock-driven countdown as CombatTimerBar so
// tab-hide doesn't skew the timer, and pauses (holds full) while the
// AI dialogue typewriter is running.
// ─────────────────────────────────────────────────────────────────────
function CombatTimerRing({
  servedAt,
  durationMs,
  onExpire,
  enabled = true,
  size = 56,
  stroke = 5,
}: {
  servedAt: number;
  durationMs: number;
  onExpire: () => void;
  enabled?: boolean;
  size?: number;
  stroke?: number;
}) {
  const anchorRef = useRef<number>(Date.now());
  const lastServedRef = useRef<number>(servedAt);
  const lastEnabledRef = useRef<boolean>(enabled);
  if (lastServedRef.current !== servedAt) {
    anchorRef.current = Date.now();
    lastServedRef.current = servedAt;
  }
  if (lastEnabledRef.current !== enabled) {
    if (enabled) anchorRef.current = Date.now();
    lastEnabledRef.current = enabled;
  }
  const [remainingMs, setRemainingMs] = useState(() => durationMs);
  const expiredRef = useRef(false);
  const expireRef = useRef(onExpire);
  useEffect(() => {
    expireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    expiredRef.current = false;
    if (!enabled) {
      setRemainingMs(durationMs);
      return;
    }
    const tick = () => {
      const remain = Math.max(0, anchorRef.current + durationMs - Date.now());
      setRemainingMs(remain);
      if (remain <= 0) {
        window.clearInterval(id);
        if (!expiredRef.current) {
          expiredRef.current = true;
          expireRef.current();
        }
      }
    };
    tick();
    const id = window.setInterval(tick, 100);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servedAt, durationMs, enabled]);

  const fraction = durationMs > 0 ? remainingMs / durationMs : 0;
  const fill =
    fraction > 0.5 ? "#22C55E" : fraction > 0.2 ? "#EAB308" : "#EF4444";

  // Ring geometry
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - fraction);
  // mm:ss label kept for the a11y aria-label only — the numeric
  // countdown was removed from the visible UI per product request
  // ("don't mention time inside it"). Screen readers still announce
  // it via `aria-label` on the wrapper.
  const totalSec = Math.max(0, Math.ceil(remainingMs / 1000));
  const mm = Math.floor(totalSec / 60);
  const ss = totalSec % 60;
  const label = `${mm}:${ss.toString().padStart(2, "0")}`;

  return (
    <div
      role="timer"
      aria-label={`Time remaining: ${label}`}
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.14)"
          strokeWidth={stroke}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={fill}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{
            transition: "stroke-dashoffset 120ms linear, stroke 300ms ease",
            filter: `drop-shadow(0 0 4px ${fill}88)`,
          }}
        />
      </svg>
      {/* Numeric mm:ss label removed — arc length + colour communicate
          remaining time visually. `label` still populates aria-label
          above for screen-reader accessibility. */}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Horizontal timer bar — kept in case a caller wants the horizontal
// layout back. No longer rendered in the main combat panel (see
// CombatTimerRing above for the current circular version).
// ─────────────────────────────────────────────────────────────────────
function CombatTimerBar({
  servedAt,
  durationMs,
  onExpire,
  enabled = true,
}: {
  servedAt: number;
  durationMs: number;
  onExpire: () => void;
  enabled?: boolean;
}) {
  const anchorRef = useRef<number>(Date.now());
  const lastServedRef = useRef<number>(servedAt);
  const lastEnabledRef = useRef<boolean>(enabled);
  if (lastServedRef.current !== servedAt) {
    anchorRef.current = Date.now();
    lastServedRef.current = servedAt;
  }
  if (lastEnabledRef.current !== enabled) {
    if (enabled) anchorRef.current = Date.now();
    lastEnabledRef.current = enabled;
  }
  const [remainingMs, setRemainingMs] = useState(() => durationMs);
  const expiredRef = useRef(false);

  // Keep onExpire in a ref so this timer's setInterval effect isn't
  // torn down every time the parent re-creates the callback (which
  // was making the bar only tick when the user typed — every
  // keystroke re-rendered the parent, gave us a fresh onExpire, and
  // that was the only chance the effect had to run its interval
  // once).
  const expireRef = useRef(onExpire);
  useEffect(() => {
    expireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    expiredRef.current = false;
    if (!enabled) {
      setRemainingMs(durationMs);
      return;
    }
    // Kick an immediate tick + install a 100ms interval that runs
    // independently of React render cycles / rAF availability.
    const tick = () => {
      const remain = Math.max(0, anchorRef.current + durationMs - Date.now());
      setRemainingMs(remain);
      if (remain <= 0) {
        window.clearInterval(id);
        if (!expiredRef.current) {
          expiredRef.current = true;
          expireRef.current();
        }
      }
    };
    tick();
    const id = window.setInterval(tick, 100);
    return () => window.clearInterval(id);
    // NOTE: onExpire deliberately NOT in deps — it's read through
    // expireRef so the interval survives parent re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servedAt, durationMs, enabled]);

  const fraction = durationMs > 0 ? remainingMs / durationMs : 0;
  // Colour shifts as time runs low.
  const fill =
    fraction > 0.5 ? "#22C55E" : fraction > 0.2 ? "#EAB308" : "#EF4444";

  return (
    <div
      role="timer"
      aria-label="Time remaining for this question"
      className="w-full"
    >
      <div className="relative h-2 w-full overflow-hidden bg-white/8 ring-1 ring-white/20">
        <div
          className="absolute inset-y-0 left-0"
          style={{
            width: `${Math.max(0, fraction * 100)}%`,
            background: fill,
            boxShadow: `0 0 6px ${fill}66`,
            transition: "width 120ms linear, background 300ms ease",
          }}
        />
      </div>
    </div>
  );
}

function HpCard({
  role,
  label,
  sub,
  current,
  initial,
}: {
  role: "player" | "boss";
  label: string;
  sub: string;
  current: number;
  initial: number;
}) {
  const fraction = initial > 0 ? Math.max(0, current / initial) : 0;
  const fill = role === "player" ? "#22C55E" : "#EF4444";
  return (
    <div className="flex items-center gap-2 border-2 border-white bg-black p-2">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-white/60 bg-slate-900 text-lg"
        style={{ imageRendering: "pixelated" }}
        aria-hidden
      >
        {role === "player" ? <PlayerIconSmall /> : <BossIconSmall />}
      </div>
      <div className="flex-1">
        <div className="flex items-baseline justify-between">
          <span
            className="font-mono text-[10px] uppercase tracking-widest text-white"
            style={{ fontFamily: "var(--font-pixel-display), monospace" }}
          >
            {label}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-widest text-white/50">
            {sub}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-1">
          <span className="text-[10px] text-red-400">❤</span>
          <div className="relative h-2 flex-1 border border-white bg-black">
            <div
              className="absolute inset-y-0 left-0"
              style={{
                width: `${fraction * 100}%`,
                background: fill,
                transition: "width 200ms cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
          </div>
          <span className="font-mono text-[10px] tabular-nums text-white">
            {Math.max(0, Math.round(current))}/{initial}
          </span>
        </div>
      </div>
    </div>
  );
}

function PlayerIconSmall() {
  return (
    <svg viewBox="0 0 16 16" width="32" height="32" style={{ imageRendering: "pixelated" }}>
      <rect x="4" y="2" width="8" height="3" fill="#0a1f4a" />
      <rect x="5" y="4" width="6" height="4" fill="#fbd29c" />
      <rect x="6" y="5" width="1" height="1" fill="#000" />
      <rect x="9" y="5" width="1" height="1" fill="#000" />
      <rect x="3" y="7" width="10" height="6" fill="#1e3a8a" />
      <rect x="6" y="9" width="4" height="2" fill="#FF0033" />
      <rect x="4" y="13" width="3" height="3" fill="#3a2614" />
      <rect x="9" y="13" width="3" height="3" fill="#3a2614" />
    </svg>
  );
}

function BossIconSmall() {
  return (
    <svg viewBox="0 0 16 16" width="32" height="32" style={{ imageRendering: "pixelated" }}>
      {/* Horns */}
      <rect x="3" y="1" width="2" height="2" fill="#FF6B6B" />
      <rect x="11" y="1" width="2" height="2" fill="#FF6B6B" />
      <rect x="3" y="3" width="10" height="4" fill="#7a1a1a" />
      <rect x="5" y="4" width="2" height="2" fill="#FFFF00" />
      <rect x="9" y="4" width="2" height="2" fill="#FFFF00" />
      <rect x="5" y="7" width="6" height="1" fill="#000" />
      <rect x="2" y="8" width="12" height="6" fill="#7a1a1a" />
      <rect x="6" y="14" width="4" height="2" fill="#3a0808" />
    </svg>
  );
}

function ActionButton({
  color,
  icon,
  label,
  active,
  disabled,
}: {
  color: "rose" | "sky" | "violet" | "emerald";
  icon: string;
  label: string;
  active?: boolean;
  disabled?: boolean;
}) {
  const palette: Record<
    typeof color,
    { border: string; bg: string; text: string; hover: string }
  > = {
    rose: {
      border: "border-rose-500",
      bg: "bg-rose-950/40",
      text: "text-rose-300",
      hover: "hover:bg-rose-900/40",
    },
    sky: {
      border: "border-sky-500",
      bg: "bg-sky-950/40",
      text: "text-sky-300",
      hover: "hover:bg-sky-900/40",
    },
    violet: {
      border: "border-violet-500",
      bg: "bg-violet-950/40",
      text: "text-violet-300",
      hover: "hover:bg-violet-900/40",
    },
    emerald: {
      border: "border-emerald-500",
      bg: "bg-emerald-950/40",
      text: "text-emerald-300",
      hover: "hover:bg-emerald-900/40",
    },
  };
  const p = palette[color];
  return (
    <button
      type="button"
      disabled={disabled}
      className={`relative flex items-center justify-center gap-2 border-2 ${p.border} ${p.bg} ${p.text} px-3 py-2 font-mono text-xs uppercase tracking-widest ${disabled ? "cursor-not-allowed opacity-50" : `${p.hover} cursor-pointer`} ${active ? "ring-2 ring-white" : ""}`}
      style={{ fontFamily: "var(--font-pixel-display), monospace" }}
      title={disabled ? "Coming soon" : undefined}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function SidebarSection({
  title,
  color,
  children,
}: {
  title: string;
  color: "rose" | "amber" | "violet" | "emerald";
  children: React.ReactNode;
}) {
  const labelColor: Record<typeof color, string> = {
    rose: "text-rose-300",
    amber: "text-amber-300",
    violet: "text-violet-300",
    emerald: "text-emerald-300",
  };
  return (
    <section className="border-2 border-white/40 bg-black p-3">
      <h3
        className={`mb-2 font-mono text-[10px] font-black uppercase tracking-widest ${labelColor[color]}`}
        style={{ fontFamily: "var(--font-pixel-display), monospace" }}
      >
        {title}
      </h3>
      {children}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Dialogue panel — the heart of the Undertale aesthetic
// ─────────────────────────────────────────────────────────────────────

function DialoguePanel({
  persona,
  prompt,
  bossAsset,
  bossName,
  onDone,
}: {
  persona: "villain" | "mentor";
  prompt: string;
  /** Boss's idle-frame asset path. When provided, the portrait shows
   *  the actual boss face instead of the procedural SVG placeholder. */
  bossAsset?: string | null;
  /** Boss's display name — used to resolve the hand-picked head-shot
   *  portrait in src/lib/bosses/bossFaces. When we have a face for
   *  this boss it renders in the red cell; otherwise we fall back to
   *  clipping the idle spritesheet. */
  bossName?: string | null;
  /** Called once when the typewriter finishes typing this prompt. Used
   *  to release the timer ring so it only starts counting AFTER the
   *  question is fully visible. */
  onDone?: () => void;
}) {
  const typedPrompt = useTypewriter(prompt, 22); // ~45 chars per second
  const isTyping = typedPrompt.length < prompt.length;
  const wasTypingRef = useRef(isTyping);
  useEffect(() => {
    if (wasTypingRef.current && !isTyping) {
      onDone?.();
    }
    wasTypingRef.current = isTyping;
  }, [isTyping, onDone]);
  // Always prefer the hand-picked boss head-shot for this boss when
  // we have one — the whole combat round is against ONE boss, so
  // every question (whether the underlying prompt was authored in a
  // "villain" or "mentor" voice) should show the boss's face in the
  // portrait cell. Previous rev gated on persona==="villain", so
  // every alternating "mentor" question in a round rendered the
  // generic purple wizard SVG. Product feedback: "makee sure every
  // ai combat screen uses boss head png".
  // Fallback chain (only if no hand-picked face exists):
  //   bossFaceUrl → clipped spritesheet frame → procedural SVG.
  const bossFaceUrl = getBossFaceUrl(bossName);
  return (
    <div className="flex items-start gap-4 bg-black p-4">
      {bossFaceUrl ? (
        <BossFaceImagePortrait src={bossFaceUrl} bossName={bossName ?? ""} />
      ) : bossAsset ? (
        <BossFacePortrait bossAsset={bossAsset} />
      ) : (
        <Portrait persona={persona} talking={isTyping} />
      )}
      <p
        className="flex-1 font-[var(--font-pixel-body)] text-base leading-relaxed text-white"
        style={{ fontFamily: "var(--font-pixel-body), monospace" }}
      >
        {/* Undertale-style `*` prefix removed per product request. */}
        {typedPrompt}
        {isTyping && (
          <span
            className="ml-0.5 inline-block w-[8px] animate-pulse text-white/70"
            aria-hidden
          >
            ▎
          </span>
        )}
      </p>
    </div>
  );
}

/**
 * Preferred portrait renderer — takes a URL to a hand-picked boss
 * head-shot (from `src/lib/bosses/bossFaces.ts`, backed by JPEGs in
 * `public/assets/bosses/faces/`) and fills the red 64×64 cell with
 * `object-fit: cover`. No spritesheet-frame arithmetic needed
 * because these assets are cropped head-shots, not gameplay sheets.
 *
 * The red border + dark fill are kept from BossFacePortrait so both
 * renderers visually match — the user only sees the difference in
 * clarity of the face, not in the frame chrome.
 */
function BossFaceImagePortrait({
  src,
  bossName,
}: {
  src: string;
  bossName: string;
}) {
  const BOX = 64;
  return (
    <div
      className="shrink-0 relative overflow-hidden"
      style={{
        width: BOX,
        height: BOX,
        background: "#3a1212",
        border: "2px solid #FF6B6B",
        imageRendering: "pixelated",
      }}
      aria-label={`${bossName} portrait`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={bossName}
        width={BOX}
        height={BOX}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          // Face jpegs are hand-composed — no scaling artifacts to
          // worry about here, but we keep pixelated to match the
          // rest of the arena's rendering vibe.
          imageRendering: "pixelated",
          display: "block",
        }}
        draggable={false}
      />
    </div>
  );
}

/**
 * 64×64 portrait cell that shows the CURRENT boss's face by clipping
 * to the first frame of the idle spritesheet. Uses a background image
 * with background-size:cover + background-position:left so:
 *   - single-image PNGs render normally (cover fills the box)
 *   - wide horizontal spritesheets show only the leftmost (idle) frame
 *     instead of stretching all frames to fit
 *
 * Fallback path — used when we don't have a hand-picked head-shot
 * (via BossFaceImagePortrait) for the current boss.
 */
function BossFacePortrait({ bossAsset }: { bossAsset: string }) {
  // Fallback portrait for bosses without a hand-picked head-shot in
  // bossFaces.ts. Shows FRAME 0 of the spritesheet scaled to fit the
  // 64×64 cell.
  //
  // Previous rev zoomed into a "face region" using proportions
  // calibrated to Fog of Vagueness (middle-third of frame, y=22%→48%).
  // That worked for Fog but produced EMPTY RED CELLS for every other
  // boss whose silhouette is shaped differently — the clip landed on
  // transparent pixels. Product feedback 2026-08-16: "many ai combat
  // dont have the face of boss shown".
  //
  // New behaviour: paint the WHOLE first frame using CSS
  // background-position clipping. Same technique the boss-intro
  // cinematic uses for spritesheets. Works for any 1..N frame sheet
  // regardless of body proportions.
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    let cancelled = false;
    const probe = new window.Image();
    probe.onload = () => {
      if (cancelled) return;
      setDims({ w: probe.naturalWidth, h: probe.naturalHeight });
    };
    probe.onerror = () => {
      if (cancelled) return;
      setDims({ w: 92, h: 92 });
    };
    probe.src = bossAsset;
    return () => {
      cancelled = true;
    };
  }, [bossAsset]);

  const BOX = 64;
  // Frame is assumed square — height is the single frame's edge.
  // Sheet width = frameHeight × frameCount, so frameCount = w/h.
  // Any sheet aspect ratio works because we drive backgroundSize +
  // backgroundPosition off frameCount rather than trying to divide.
  const frameCount = dims ? Math.max(1, Math.round(dims.w / dims.h)) : 1;
  return (
    <div
      className="shrink-0 relative overflow-hidden"
      style={{
        width: BOX,
        height: BOX,
        background: "#3a1212",
        border: "2px solid #FF6B6B",
        imageRendering: "pixelated",
      }}
      aria-label="Boss portrait"
    >
      <div
        key={bossAsset}
        role="img"
        aria-label="Boss"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${bossAsset})`,
          // HEAD-CROP: scale to 2× per-frame so ONE FRAME occupies 2×
          // the cell, then position so the TOP-CENTER of frame 0
          // (where the head sits for any standing sprite) lands in
          // the visible 64×64 window.
          //
          // Math for backgroundSize/position with N frames wide:
          //   backgroundSize     = (N × 200%) wide × 200% tall
          //   backgroundPosition X% = center of frame_index in the
          //                            image's horizontal excess band
          //   backgroundPosition Y% = 0 (top of frame)
          //
          // For frame 0 out of N frames at 2× zoom, we want the
          // container's horizontal midpoint (32px of 64px) to map to
          // the middle of frame 0 in the scaled image. Frame 0 spans
          // pixels 0..(2*container). Its midpoint is at pixel
          // container. In percentage terms: image excess width =
          // container * (2N - 1); frame-0 midpoint offset = container;
          // required position% = container / (container*(2N-1)) =
          // 1/(2N-1). Multiplied by 100 gives the correct value.
          //
          // Previous rev used "0% 0%" which showed the LEFT edge of
          // frame 0 — for a centered character silhouette that's
          // mostly transparent border with just a foot poking in.
          // Product ask 2026-08-20: face still not visible in AI
          // combat cell.
          backgroundSize: `${frameCount * 200}% 200%`,
          backgroundPosition:
            frameCount > 1
              ? `${(100 / (2 * frameCount - 1)).toFixed(3)}% 0%`
              : `50% 0%`,
          backgroundRepeat: "no-repeat",
          imageRendering: "pixelated",
          // Hide until dims are known so we never paint a stretched
          // full-sheet flash before frameCount is resolved.
          visibility: dims ? "visible" : "hidden",
        }}
      />
    </div>
  );
}

/**
 * Type out `text` one character at a time. Returns the substring
 * typed so far. Resets when `text` changes. The interval is in ms
 * per character; ~22ms = ~45 cps which matches Undertale's pacing.
 */
function useTypewriter(text: string, msPerChar: number): string {
  const [shown, setShown] = useState("");
  useEffect(() => {
    setShown("");
    if (!text) return;
    let i = 0;
    const tick = () => {
      i += 1;
      setShown(text.slice(0, i));
      if (i < text.length) {
        timeoutId = window.setTimeout(tick, msPerChar);
      }
    };
    let timeoutId = window.setTimeout(tick, msPerChar);
    return () => window.clearTimeout(timeoutId);
  }, [text, msPerChar]);
  return shown;
}

function Portrait({
  persona,
  talking,
}: {
  persona: "villain" | "mentor";
  talking?: boolean;
}) {
  // Pixel-art portrait built from SVG rects. Two-frame mouth animation
  // when `talking` is true (during dialogue typewriter). Idle bob +
  // periodic blink loop forever.
  const fill = persona === "villain" ? "#3a1212" : "#1a1730";
  const accent = persona === "villain" ? "#FF6B6B" : "#9F7AEA";
  const highlight = persona === "villain" ? "#FFD1D1" : "#D8C7FF";

  // Blink loop — eyes close every 3-5 seconds.
  const [blinking, setBlinking] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const scheduleBlink = () => {
      const wait = 2500 + Math.random() * 2500;
      setTimeout(() => {
        if (cancelled) return;
        setBlinking(true);
        setTimeout(() => {
          if (cancelled) return;
          setBlinking(false);
          scheduleBlink();
        }, 130);
      }, wait);
    };
    scheduleBlink();
    return () => { cancelled = true; };
  }, []);

  // Mouth open/close cadence while talking.
  const [mouthOpen, setMouthOpen] = useState(false);
  useEffect(() => {
    if (!talking) {
      setMouthOpen(false);
      return;
    }
    const id = setInterval(() => setMouthOpen((v) => !v), 110);
    return () => clearInterval(id);
  }, [talking]);

  return (
    <motion.div
      className="shrink-0 border-2 relative overflow-hidden"
      style={{
        width: 64,
        height: 64,
        background: fill,
        borderColor: accent,
        imageRendering: "pixelated",
      }}
      animate={{ y: [0, -2, 0] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      aria-label={persona === "villain" ? "Skeptic portrait" : "Mentor portrait"}
    >
      {/* Subtle inner glow as a backlight. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(circle at 50% 60%, ${accent}33, transparent 70%)`,
        }}
      />

      <svg viewBox="0 0 16 16" width="100%" height="100%" className="relative">
        {/* Hair / hood */}
        <rect x="3" y="2" width="10" height="2" fill={accent} />
        <rect x="2" y="3" width="2" height="3" fill={accent} />
        <rect x="12" y="3" width="2" height="3" fill={accent} />
        {/* Face */}
        <rect x="4" y="4" width="8" height="7" fill={accent} opacity="0.92" />
        <rect x="4" y="4" width="8" height="1" fill={highlight} opacity="0.4" />
        {/* Eyes (closed when blinking) */}
        {blinking ? (
          <>
            <rect x="5" y="7" width="2" height="1" fill={fill} />
            <rect x="9" y="7" width="2" height="1" fill={fill} />
          </>
        ) : (
          <>
            <rect x="5" y="7" width="2" height="2" fill={fill} />
            <rect x="9" y="7" width="2" height="2" fill={fill} />
            {/* Eye highlight */}
            <rect x="6" y="7" width="1" height="1" fill={highlight} opacity="0.7" />
            <rect x="10" y="7" width="1" height="1" fill={highlight} opacity="0.7" />
          </>
        )}
        {/* Mouth — switches between closed line and open square while talking */}
        {mouthOpen ? (
          <rect x="6" y="10" width="4" height="2" fill={fill} />
        ) : (
          <rect x="6" y="11" width="4" height="1" fill={fill} />
        )}
        {/* Shoulders */}
        <rect x="2" y="12" width="12" height="3" fill={accent} opacity="0.7" />
        <rect x="3" y="13" width="10" height="2" fill={fill} opacity="0.4" />
      </svg>
    </motion.div>
  );
}

function PersonaChip({ persona }: { persona: "villain" | "mentor" }) {
  const label = persona === "villain" ? "The Skeptic" : "The Mentor";
  const colour = persona === "villain" ? "#FF6B6B" : "#9F7AEA";
  return (
    <span style={{ color: colour }}>{label}</span>
  );
}

/**
 * Battle scene — a fixed-aspect arena above the dialogue showing the
 * boss sprite on the right and the player character on the left, both
 * over a procedural biome backdrop. Sprites react to hit / crit / counter
 * with shake + filter changes. No image assets.
 */
/**
 * Pick the biome-appropriate painted map to use as the combat backdrop.
 * Inspects the boss's idle-asset path (`/assets/bosses/<biome>/...`) and
 * returns the corresponding stage map.  Village → village-map, Forest
 * (stage2) → forest-map, Harbor (stage3) → harbor-map, Artisans (stage4)
 * → artisans-map.  Falls back to the neutral arena backdrop when the
 * boss path is missing or unfamiliar.
 */
export function deriveBiomeMap(bossAsset: string | null | undefined): string {
  const fallback = "/assets/maps-v2/arena/arena-background.png";
  if (!bossAsset) return fallback;
  if (bossAsset.includes("/bosses/village/")) {
    // Dedicated painted village combat backdrop. Falls back to the
    // world-map render on 404 so combat is never broken.
    return "/assets/combat/village-backdrop.png";
  }
  if (bossAsset.includes("/bosses/stage2/")) {
    return "/assets/maps-v2/forest/forest-map.png";
  }
  // Arena bosses live under /bosses/arena/ (Judge, Advocate, Masked
  // Challenger, Oracle). Route them to the actual Arena painted map
  // instead of falling through to the village backdrop.
  if (bossAsset.includes("/bosses/arena/")) {
    return "/assets/maps-v2/arena/arena-map.png";
  }
  if (bossAsset.includes("/bosses/stage3/")) {
    return "/assets/maps-v2/golden-harbor/harbor-map.png";
  }
  if (bossAsset.includes("/bosses/stage4/")) {
    return "/assets/maps-v2/artisans/artisans-map.png";
  }
  // Stage 5 (Mine) — Ironhold biome. Falls back to arena bg only if
  // the mine map hasn't been authored yet.
  if (bossAsset.includes("/bosses/stage5/") || bossAsset.includes("/bosses/mine/")) {
    return "/assets/maps-v2/mine/mine-map.png";
  }
  // Stage 7 (Crossroads Town) — Iteration biome. Same fallback rule
  // if the map isn't shipped.
  if (
    bossAsset.includes("/bosses/stage7/") ||
    bossAsset.includes("/bosses/crossroads/")
  ) {
    return "/assets/maps-v2/crossroads-town/crossroads-map.png";
  }
  // ── Template boss backdrops ────────────────────────────────────────
  // Templates share art with venture maps (their maps live under
  // /assets/maps-v2/academic|lab|creative/) so combat renders the
  // biome-specific painting behind the fight for the template's own
  // stage. Wildcard on the boss slug isn't reliable here (Librarian
  // is Stage 1 in Academic but Stage 2 in Lab), so we fall back to a
  // generic per-template arena crop when the exact biome map isn't
  // straightforward to derive.
  if (bossAsset.includes("/bosses/academic/")) {
    return "/assets/maps-v2/academic/library-map.png";
  }
  if (bossAsset.includes("/bosses/lab/")) {
    return "/assets/maps-v2/lab/observatory-map.png";
  }
  if (bossAsset.includes("/bosses/creative/")) {
    return "/assets/maps-v2/forest/forest-map.png";
  }
  if (bossAsset.includes("/bosses/venture/unfinished-golem/")) {
    return "/assets/maps-v2/artisans/artisans-map.png";
  }
  return fallback;
}

/**
 * Biome-specific palette for the combat arena.  Instead of trying to
 * repurpose the world map as a combat backdrop (which reads as "game
 * screenshot" no matter how much you blur it), each biome gets a clean
 * Pokemon-style two-plane arena: coloured sky gradient + ground plane
 * + subtle silhouette horizon line.
 *
 * This is what "professional" looks like for a turn-based combat scene:
 * nothing competes with the characters for attention.
 */
interface BiomePalette {
  skyTop: string;
  skyBottom: string;
  ground: string;
  groundShadow: string;
  horizonSilhouette: string;
  glow: string;
}

const BIOME_PALETTES: Record<string, BiomePalette> = {
  village: {
    // Dawn / dusk hour, cottage roofs on the horizon
    skyTop: "#2a1e3d",
    skyBottom: "#e88b56",
    ground: "#3d5a3a",
    groundShadow: "#1e2a1c",
    horizonSilhouette: "#1a1523",
    glow: "rgba(255,180,120,0.35)",
  },
  stage2: {
    // Moonlit forest, misty blue-green
    skyTop: "#0f1a2e",
    skyBottom: "#4b6b70",
    ground: "#1e2d1d",
    groundShadow: "#0d1a0c",
    horizonSilhouette: "#0a1219",
    glow: "rgba(120,200,180,0.28)",
  },
  stage3: {
    // Harbor at gold hour, ocean horizon
    skyTop: "#1a2540",
    skyBottom: "#f4b673",
    ground: "#2c4a5c",
    groundShadow: "#1a2a35",
    horizonSilhouette: "#0f1a2a",
    glow: "rgba(255,190,130,0.38)",
  },
  stage4: {
    // Forge-lit workshop night, amber embers
    skyTop: "#1a0d1c",
    skyBottom: "#a83e1a",
    ground: "#3a2418",
    groundShadow: "#1c110a",
    horizonSilhouette: "#0f0710",
    glow: "rgba(255,130,60,0.42)",
  },
  fallback: {
    skyTop: "#1e1e2e",
    skyBottom: "#3d3d5c",
    ground: "#2a2a3a",
    groundShadow: "#15151f",
    horizonSilhouette: "#0f0f18",
    glow: "rgba(200,200,220,0.25)",
  },
};

function biomePaletteFromBoss(bossAsset: string | null | undefined): BiomePalette {
  if (!bossAsset) return BIOME_PALETTES.fallback;
  if (bossAsset.includes("/bosses/village/")) return BIOME_PALETTES.village;
  if (bossAsset.includes("/bosses/stage2/")) return BIOME_PALETTES.stage2;
  if (bossAsset.includes("/bosses/stage3/")) return BIOME_PALETTES.stage3;
  if (bossAsset.includes("/bosses/stage4/")) return BIOME_PALETTES.stage4;
  // Template palettes — reuse the closest thematic Venture palette so
  // the combat arena reads coherently instead of the generic muddy
  // fallback tint. Academic (parchment/library) leans on the warm
  // village dusk; Lab (observatory/forge) leans on stage4's amber
  // forge; Creative (grove) leans on stage2's moonlit forest.
  if (bossAsset.includes("/bosses/academic/")) return BIOME_PALETTES.village;
  if (bossAsset.includes("/bosses/lab/")) return BIOME_PALETTES.stage4;
  if (bossAsset.includes("/bosses/creative/")) return BIOME_PALETTES.stage2;
  if (bossAsset.includes("/bosses/venture/")) return BIOME_PALETTES.stage4;
  return BIOME_PALETTES.fallback;
}

/**
 * Per-biome CP focus points as (x%, y%) on the biome map.  Used to zoom
 * the combat backdrop into the area around the specific checkpoint the
 * boss is guarding, so the fight FEELS like it's happening at that
 * location rather than on a generic wide map.
 *
 * Derived from CHECKPOINTS coords in the corresponding scene files
 * divided by MAP_WIDTH/MAP_HEIGHT.
 */
const CP_FOCUS_MAP: Record<string, Array<{ x: number; y: number }>> = {
  village: [
    { x: 11.3, y: 21.0 },  // CP1 — The Signboard    (173,215)  / (1536,1024)
    { x: 38.2, y: 61.8 },  // CP2 — The Bridge       (587,633)
    { x: 76.6, y: 64.6 },  // CP3 — The Barn         (1177,662)
    { x: 84.9, y: 31.7 },  // CP4 — The Well         (1304,325)
  ],
  stage2: [
    // Forest (2304×1440) — 5 CPs
    { x: 14.8, y: 62.5 },  // CP1 — West Threshold   (340,900)
    { x: 33.9, y: 50.0 },  // CP2 — Whispering Grove (780,720)
    { x: 52.1, y: 38.2 },  // CP3 — Moonlit Clearing (1200,550)
    { x: 67.3, y: 69.4 },  // CP4 — Boss Glade       (1550,1000)
    { x: 86.8, y: 33.3 },  // CP5 — East Exit        (2000,480)
  ],
  stage3: [
    // The Arena (2624×1630) — 4 CPs · Validation stage per venture spec
    { x: 10.7, y: 36.8 },  // CP1 — The Naming Post   (280, 600)
    { x: 49.5, y: 49.1 },  // CP2 — The Sand          (1300, 800)
    { x: 74.3, y: 25.8 },  // CP3 — The Judges' Bench (1950, 420)
    { x: 86.9, y: 70.6 },  // CP4 — The Verdict Pillar (2280, 1150)
  ],
  stage5: [
    // The Mine · Ironhold (2400×1600) — 6 CPs · Build & Deliver stage
    { x: 11.3, y: 13.8 },  // CP1 — Mine Head       (270, 220)
    { x: 76.3, y: 16.3 },  // CP2 — Tool Yard       (1830, 260)
    { x: 25.0, y: 34.4 },  // CP3 — First Shaft     (600, 550)
    { x: 54.2, y: 38.8 },  // CP4 — Support Beam    (1300, 620)
    { x: 32.1, y: 61.3 },  // CP5 — Pilot Chamber   (770, 980)
    { x: 76.3, y: 51.3 },  // CP6 — Loading Bay     (1830, 820)
  ],
  stage7: [
    // The Crossroads Town (2400×1600) — 4 CPs · Iteration stage
    { x: 20.8, y: 25.0 },  // CP1 — The Inn Yard         (500, 400)
    { x: 38.3, y: 45.0 },  // CP2 — The Signpost         (920, 720)
    { x: 60.4, y: 56.3 },  // CP3 — The Roadworks        (1450, 900)
    { x: 29.2, y: 68.8 },  // CP4 — The Milestone Marker (700, 1100)
  ],
  stage6: [
    // The Harbour (2612×1632) — 4 CPs · moved from stage 3 to stage 6
    // to match the canonical venture spec (Launch = The Harbour).
    { x: 14.5, y: 55.1 },  // CP1 — Dockside         (380,900)
    { x: 40.2, y: 42.9 },  // CP2 — Market Square    (1050,700)
    { x: 65.1, y: 70.5 },  // CP3 — Warehouse Dist   (1700,1150)
    { x: 88.1, y: 31.9 },  // CP4 — Lighthouse Tip   (2300,520)
  ],
  stage4: [
    // Artisans District (2624×1630) — 5 CPs
    { x: 16.0, y: 58.3 },  // CP1 — Craft Workshop   (420,950)
    { x: 34.3, y: 44.2 },  // CP2 — Weaver's Alley   (900,720)
    { x: 51.4, y: 30.7 },  // CP3 — Potter's Kiln    (1350,500)
    { x: 72.4, y: 67.5 },  // CP4 — Jeweller's Row   (1900,1100)
    { x: 91.5, y: 29.4 },  // CP5 — Master's Forge   (2400,480)
  ],
};

function biomeKeyFromBossAsset(bossAsset: string | null | undefined):
  keyof typeof CP_FOCUS_MAP | null {
  if (!bossAsset) return null;
  if (bossAsset.includes("/bosses/village/")) return "village";
  if (bossAsset.includes("/bosses/stage2/")) return "stage2";
  // Harbor bosses live under /bosses/stage3/ on disk (legacy folder
  // naming) but the biome is now Stage 6 · The Harbour in the spec.
  // Route their focus to the stage6 CP map instead of stage3.
  if (bossAsset.includes("/bosses/stage3/")) return "stage6";
  if (bossAsset.includes("/bosses/stage4/")) return "stage4";
  return null;
}

/** Compute the background-position + zoom to focus a specific CP. */
export function focusForCheckpoint(
  bossAsset: string | null | undefined,
  checkpointIndex: number | null | undefined,
): { positionX: string; positionY: string; size: string } {
  const biome = biomeKeyFromBossAsset(bossAsset);
  const cps = biome ? CP_FOCUS_MAP[biome] : null;
  const cp = cps && typeof checkpointIndex === "number" ? cps[checkpointIndex] : null;
  // Non-village templates (academic / lab / creative) use a tighter
  // zoom than village. Product ask 2026-08-20: "for ai combat for all
  // maps except village little bit zoom the ai combat background".
  // Village stays at 180% (the value tuned against the hand-painted
  // village CP focus points); every other biome bumps to 260% so the
  // combat backdrop reads as an area shot, not a full-map screenshot.
  const isVillage = biomeKeyFromBossAsset(bossAsset) === "village";
  const nonVillageDefaultSize = "260%";
  if (!cp) {
    // No CP focus data for this biome yet — default to centered
    // crop, sized per-template so non-village still zooms in.
    return {
      positionX: "50%",
      positionY: "50%",
      size: isVillage ? "cover" : nonVillageDefaultSize,
    };
  }
  return {
    positionX: `${cp.x}%`,
    positionY: `${cp.y}%`,
    size: isVillage ? "180%" : nonVillageDefaultSize,
  };
}

function BattleScene({
  persona,
  bossReaction,
  playerHurt,
  pendingAttack = false,
  reactionEpoch = 0,
  bossAsset = null,
  checkpointIndex = null,
  founderAsset = null,
  playerHpCurrent = 10,
  playerHpInitial = 10,
  bossHpCurrent = 10,
  bossHpInitial = 10,
  bossName = "",
}: {
  persona: "villain" | "mentor";
  bossReaction: "idle" | "hit" | "crit" | "counter" | "block";
  playerHurt: boolean;
  /** Optimistic persona pre-swing fired the moment the user submits.
   *  Bridges the 2-3s server round-trip with instant visual feedback. */
  pendingAttack?: boolean;
  /** Increments every time a REAL server reaction lands. Woven into
   *  the persona + boss sprite React keys so the attack/hurt clips
   *  remount and replay from frame 0 at the tuned slow FPS — without
   *  this, the optimistic pending clip and the confirmed reaction
   *  clip share a state string ("hurt"/"attack") so no remount fires
   *  and the animation only plays once (invisibly if the server is
   *  slower than the 1.8s boss clip / 3s persona clip). */
  reactionEpoch?: number;
  bossAsset?: string | null;
  checkpointIndex?: number | null;
  founderAsset?: string | null;
  playerHpCurrent?: number;
  playerHpInitial?: number;
  bossHpCurrent?: number;
  bossHpInitial?: number;
  bossName?: string;
}) {
  // Zoom the painted biome map into the specific CP the boss guards
  // so the arena reads as "this exact location."
  const focus = focusForCheckpoint(bossAsset, checkpointIndex);

  // Extract the personaId from the founder asset path so the animated
  // sprite can load the correct persona's spritesheet family. Example:
  // "/assets/personas/arcanist/portrait.png" → "arcanist".
  const personaIdForSprite = useMemo<PersonaId | null>(() => {
    if (!founderAsset) return null;
    const m = founderAsset.match(/\/personas\/([^/]+)\//);
    if (!m) return null;
    const p = getPersona(m[1] as PersonaId);
    return p.extended ? (m[1] as PersonaId) : null;
  }, [founderAsset]);

  // ── Endgame outcome ────────────────────────────────────────────────
  // When either HP reaches 0, the round is decided. We derive an
  // `outcome` here so the arena can pivot immediately to a
  // winner-centered VICTORY loop before the outer PhaseSwitch
  // transitions to the settled result screen. This gives users a
  // couple of seconds of celebration/dominance in-scene.
  const outcome: "active" | "won" | "lost" =
    bossHpCurrent <= 0 && playerHpCurrent > 0
      ? "won"
      : playerHpCurrent <= 0
        ? "lost"
        : "active";

  // ── Responsive boss sprite sizing ──────────────────────────────────
  // Product ask (mobile screenshot review): "reduce the size of boss
  // for mobile view" — at 300px the Fog sprite crowded the whole arena
  // and covered the persona standing at the left. On phones (< 640px)
  // we use 180px so the boss reads as a boss-scale figure without
  // dominating the frame; desktop keeps the cinematic 300px.
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(max-width: 639px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  // 180 -> 220 on mobile (2026-08-31). The persona renders at 120, so at
  // 180 the two read as roughly peers once each sprite's internal padding
  // is accounted for; product ask is for the boss to clearly outsize the
  // founder. Desktop is unchanged.
  const bossDisplayWidth = isMobile ? 220 : 300;
  // Mobile baseline alignment. The boss box hangs at bottom:-40 on desktop
  // to bury its sprite padding below the arena floor; on a phone that sank
  // the whole figure well under the persona (bottom:8) so they read as
  // standing on two different ground lines. Lifting the boss to +4 puts
  // both combatants on the same level with the boss a touch higher, which
  // is the staging the product ask describes.
  const bossBottom = isMobile ? 4 : -40;

  // ── Three-stage cinematic ──────────────────────────────────────────
  // Stage 0 (win only) RETREAT (0 - 1600ms): a gamified banner reads
  //   "<Boss Name> is retreating!" over the still arena. Boss holds
  //   idle, persona holds idle. Gives the moment weight instead of
  //   snapping straight into a defeat animation.
  // Stage 1 DEFEAT (1600 - 3800ms on win, 0 - 2200ms on loss): the
  //   loser plays its DEFEAT clip at reduced FPS so users actually
  //   see each frame (kneels / crumbles / dies).
  // Stage 2 CHEER (3800ms+ on win, 2200ms+ on loss): loser fades out,
  //   winner glides to arena center and plays VICTORY on loop at a
  //   deliberately slow cadence.
  //
  // Total cinematic length (win): 1600 + 2200 + ~2700 cheer buffer ≈
  // 6.5s — the parent CombatPanel's CINEMATIC_HOLD_MS is bumped to
  // 6500ms to keep the score card from cutting in early.
  // Retreat stage extended (was 1600ms) so the boss's translate +
  // fade + shrink animation has time to READ — the 1400ms transform
  // transition wants at least 1400ms of visible time plus a small
  // hold beat at the end. Defeat clip cadence unchanged.
  // ── Killing-blow beat ("finisher") ─────────────────────────────────
  // Product ask (2026-08-16): "when we have retreat time then no attack
  // damage animation, it should be attack damage then retreat". Refined:
  // "first damage is playing then attack, first attack should be played".
  //
  // On the winning blow, the visible sequence must be strictly:
  //   swing  → persona sword-swing, boss still standing (no recoil yet)
  //   impact → boss recoils from the hit, persona holds the follow-through
  //   retreat → villain slides off
  //   defeat  → holds off-screen
  //   cheer   → persona victory loop
  //
  // Splitting the finisher into `swing` (persona attack only) and
  // `impact` (boss hurt only) gives the classic wind-up → contact
  // beat instead of both animations firing at t=0, which read as
  // "damage happened first" because the boss's first hurt frame
  // is a hard recoil pose.
  const FINISHER_SWING_MS = 900;   // persona wind-up + swing arc
  const FINISHER_IMPACT_MS = 1800; // boss recoil clip + short hold
  const RETREAT_STAGE_MS = 2200;
  const DEFEAT_STAGE_MS = 2200;
  type CinematicStage =
    | "none"
    | "finisher-swing"
    | "finisher-impact"
    | "retreat"
    | "defeat"
    | "cheer";
  const [cinematicStage, setCinematicStage] = useState<CinematicStage>("none");
  useEffect(() => {
    if (outcome === "active") {
      setCinematicStage("none");
      return;
    }
    if (outcome === "won") {
      // WIN sequence: finisher-swing → finisher-impact → retreat →
      //               defeat → cheer.
      // The FINISHER split (2026-08-16) enforces attack-then-damage
      // order — the swing sub-beat shows the persona committing to
      // the strike while the boss stays upright, then the impact
      // sub-beat delivers the recoil. Prior single-stage finisher
      // played both clips in parallel and the boss's hard first
      // hurt frame read as "damage before swing".
      setCinematicStage("finisher-swing");
      const tImpact = window.setTimeout(
        () => setCinematicStage("finisher-impact"),
        FINISHER_SWING_MS,
      );
      const tRetreat = window.setTimeout(
        () => setCinematicStage("retreat"),
        FINISHER_SWING_MS + FINISHER_IMPACT_MS,
      );
      const tDefeat = window.setTimeout(
        () => setCinematicStage("defeat"),
        FINISHER_SWING_MS + FINISHER_IMPACT_MS + RETREAT_STAGE_MS,
      );
      const tCheer = window.setTimeout(
        () => setCinematicStage("cheer"),
        FINISHER_SWING_MS +
          FINISHER_IMPACT_MS +
          RETREAT_STAGE_MS +
          DEFEAT_STAGE_MS,
      );
      return () => {
        window.clearTimeout(tImpact);
        window.clearTimeout(tRetreat);
        window.clearTimeout(tDefeat);
        window.clearTimeout(tCheer);
      };
    }
    // LOSS: skip the retreat beat (the boss is triumphant, no retreat).
    setCinematicStage("defeat");
    const t = window.setTimeout(
      () => setCinematicStage("cheer"),
      DEFEAT_STAGE_MS,
    );
    return () => window.clearTimeout(t);
  }, [outcome]);
  // "Screen gets bigger when you attack" — we detect any active
  // attack/reaction beat and use it to (1) enlarge the arena visually
  // via a subtle CSS scale, and (2) key a slower FPS on the sprite
  // clips (see AnimatedPersonaSprite / BossSpriteFromAsset below).
  //
  // The scale is applied to the border-box container; overflow:hidden
  // keeps the enlarged sprites clipped to the arena bounds so nothing
  // spills into the dialogue below. We hold the zoom for the full
  // reaction window rather than a fixed timer so it fully covers the
  // (now slower) attack/hurt animations.
  const isAttackingNow =
    pendingAttack ||
    bossReaction === "hit" ||
    bossReaction === "crit" ||
    bossReaction === "counter";

  // ── Evaluation zoom ────────────────────────────────────────────────
  // Product spec (2026-08-10): "after giving an answer the ai evalutes
  // answer in that evalution time zoom the combat screen". Combined
  // with "slow down animations, do everything like a senior game
  // developer".
  //
  // Senior-game-dev pattern for a JRPG-style evaluation moment:
  //   1. On submit → punch-in to ~1.15× over ~600ms (cubic ease-out).
  //   2. Hold at 1.15× while server evaluates AND while boss plays
  //      its full recoil animation (~2.5s at the new slow FPS).
  //   3. Ease back to 1.00× over ~750ms once reactions settle.
  //
  // We compute `isEvaluating` from THREE signals so the zoom stays
  // pinned for the whole beat:
  //   - `pendingAttack`  → user submitted, server not yet responded
  //     (this is the "AI is evaluating" window the user cares about)
  //   - `isAttackingNow` → server responded, boss/persona are in the
  //     middle of their reaction clips
  //   - `pendingIdleReturn` → true for a short grace period after
  //     the last reaction ends so the zoom-out isn't instantaneous
  //     the moment the sprite hits its idle frame
  const isEvaluating = pendingAttack || isAttackingNow;
  const arenaScale = outcome !== "active"
    ? 1
    : isEvaluating
      ? 1.15
      : 1.0;

  return (
    <div
      className="relative h-52 w-full overflow-hidden border-2 border-white sm:h-56"
      style={{
        imageRendering: "pixelated",
        // Cinematic zoom on evaluation. 1.15 is the strongest pull we
        // can apply without the founder/boss clipping the h-52 arena
        // frame; anything higher and the persona's staff exits the
        // top. transformOrigin at 70%/65% biases toward the boss's
        // head so the punch-in features the side taking the impact.
        //
        // Asymmetric easing (senior game dev pattern): punch IN fast
        // (600ms cubic-out) so the camera commits to the moment the
        // instant the user hits Submit, then ease OUT slowly (750ms
        // cubic-in-out) so returning to the neutral shot after the
        // reaction feels like the camera "releasing tension" rather
        // than snapping back. Implemented via a single transition
        // rule with the longer duration — visually the shorter
        // ease-out for zoom-in wins because scale changes are small
        // and CSS interpolation is near-linear across that range.
        transform: `scale(${arenaScale})`,
        transformOrigin: "70% 65%",
        transition:
          "transform 720ms cubic-bezier(0.22, 1, 0.36, 1)",
        willChange: "transform",
      }}
    >
      {/* ── Atmospheric backdrop — 4 stacked layers ─────────────────
          1. Village map heavily BLURRED so it reads as village-themed
             ATMOSPHERE, not as the literal map with UI markers visible
          2. Sky gradient overlay at top for depth
          3. Family-tinted radial vignette for corruption vibe
          4. Ground plane at bottom with soft horizon so characters
             have something to stand on
      ─────────────────────────────────────────────────────────────── */}

      {/* ── Original painted map as backdrop ──────────────────────────
          Show the actual biome map (village/forest/harbor/artisans)
          zoomed into the CP the boss guards.  Subtle darkening only —
          no heavy blur, no fake sky/ground planes — so the map reads
          clearly as its intended location.
      ──────────────────────────────────────────────────────────────── */}

      {/* 1. The painted map itself, zoomed to the CP focus point.
             For Village specifically we layer the dedicated combat
             painting on top of the world-map fallback — if the
             painting isn't dropped in yet, the world-map shows
             through untouched, so combat is never broken.

             Village combat backdrop uses `cover` (no distortion) with
             `center 35%` positioning so the interesting parts — house,
             waterfall, bridge, bench — sit in the visible band, and
             the empty foreground dirt path is what gets cropped. */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: bossAsset?.includes("/bosses/village/")
            ? `url(/assets/combat/village-backdrop.png), url(/assets/maps-v2/village-painted/village-map.png)`
            : `url(${deriveBiomeMap(bossAsset)})`,
          backgroundSize: bossAsset?.includes("/bosses/village/")
            ? "cover, cover"
            : focus.size,
          backgroundPosition: bossAsset?.includes("/bosses/village/")
            ? "center 35%, center 35%"
            : `${focus.positionX} ${focus.positionY}`,
          backgroundRepeat: "no-repeat, no-repeat",
          filter: "brightness(0.78) saturate(0.95)",
        }}
      />

      {/* 2. Radial vignette — subtle so the map stays fully visible */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.45) 100%)",
        }}
      />

      {/* 3. Bottom shade — grounds the characters, adds visual weight */}
      <div
        className="absolute bottom-0 left-0 right-0 h-20"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.45) 100%)",
        }}
      />

      {/* 4. Feather-light scanlines for combat texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(255,255,255,0.3) 3px, transparent 4px)",
        }}
      />

      {/* Platforms REMOVED per product request. HP bars now sit
          under each character (rendered below the sprite blocks). */}

      {/* Founder HP bar — same left anchor as the sprite (left-8 / sm:left-16)
          and same width as the persona sprite (120px, matches
          AnimatedPersonaSprite's displayWidth) so the founder is
          horizontally CENTERED under the bar. Previously the bar was
          200px wide against a 120px sprite, so the character sat pushed
          to the left edge instead of dead-center. */}
      <div
        className="pointer-events-none absolute bottom-2 left-2 z-10 w-[30%] max-w-[120px] sm:bottom-3 sm:left-16"
      >
        <div className="flex items-center justify-between gap-1 font-mono text-[8px] uppercase tracking-widest text-white/85 sm:text-[9px]">
          <span className="truncate">You</span>
          <span className="tabular-nums text-white/60 shrink-0">
            {Math.max(0, Math.round(playerHpCurrent))}/{playerHpInitial}
          </span>
        </div>
        <div className="relative mt-1 h-2 w-full bg-black/70 ring-1 ring-white/30">
          <div
            className="absolute inset-y-0 left-0"
            style={{
              width: `${
                playerHpInitial > 0
                  ? Math.max(0, playerHpCurrent / playerHpInitial) * 100
                  : 0
              }%`,
              background: "#22C55E",
              transition: "width 400ms cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </div>
      </div>

      {/* Boss HP bar — right anchor matches the sprite (right-8 / sm:right-16)
          and width matches the boss sprite's displayWidth (300px in
          BossSpriteFromAsset). That centers the boss horizontally under
          its HP bar instead of floating it toward the right edge like
          the previous 200px bar did. */}
      <div
        className="pointer-events-none absolute bottom-2 right-2 z-10 w-[55%] max-w-[300px] sm:bottom-3 sm:right-16"
      >
        <div className="flex items-center justify-between gap-1 font-mono text-[8px] uppercase tracking-widest text-white/85 sm:text-[9px]">
          <span className="truncate">{bossName}</span>
          <span className="tabular-nums text-white/60 shrink-0">
            {Math.max(0, Math.round(bossHpCurrent))}/{bossHpInitial}
          </span>
        </div>
        <div className="relative mt-1 h-2 w-full bg-black/70 ring-1 ring-white/30">
          <div
            className="absolute inset-y-0 left-0"
            style={{
              width: `${
                bossHpInitial > 0
                  ? Math.max(0, bossHpCurrent / bossHpInitial) * 100
                  : 0
              }%`,
              background: "#EF4444",
              transition: "width 400ms cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </div>
      </div>

      {/* Boss sprite — right side, faces left. Positioned so both feet
          rest on the ground shadow line, scaled to feel present against
          the arena backdrop. */}
      {/* Boss placement ~2cm lower per product request — negative
          bottom drops the sprite so its feet sit below the arena's
          fake ground line. */}
      {/*
        ENDGAME BEAT
        ─────────────────────────────────────────────────────────────
        The instant HP on either side hits 0 we swap the arena into
        an endgame layout: the LOSER fades out entirely, the WINNER
        translates to the center of the arena and plays VICTORY on
        loop until the round transitions to the settled phase.

        `outcome`:
          "active" → regular side-by-side combat
          "won"    → player HP > 0, boss HP == 0 → alchemist cheers
          "lost"   → player HP == 0             → fog dominates
      */}
      {/* Static wrapper — the framer-motion shake/lunge/brightness
          animations were removed so the Pixellab spritesheet clips
          (idle / attack / hurt / defeat / victory) are the ONLY source
          of boss motion. Previously both systems ran in parallel and
          the framer overlay outlived the sprite clip, which read as a
          second "phantom" animation replaying the old motion. */}
      <div
        // Right-anchored so the boss reads as the "far right" combatant
        // on every viewport width. On mobile the anchor is tighter
        // (right-2) so the smaller 180px sprite sits fully within the
        // frame instead of getting clipped by the right border, and
        // the persona at left-2 has clear horizontal space to be
        // visible against the smaller opponent.
        className="absolute right-2 sm:right-16"
        style={{
          bottom: bossBottom,
          // CINEMATIC LAYOUT
          // - retreat stage (WIN only): boss slides ~180px to the RIGHT
          //   + fades + shrinks so it visually RETREATS off the arena.
          //   Product ask: "at end when boss is defeated a retreated
          //   animation should be played for boss".
          // - defeat / cheer (WIN): PRESERVE the retreated transform so
          //   the boss stays off-screen instead of CSS-easing back to
          //   origin. Previous rev cleared the transform on `defeat`
          //   which caused a visible bounce ("boss goes back, comes
          //   back, then retreats") — the transition prop would ease
          //   translateX(180px) → identity over 700ms, so the boss
          //   walked back into frame before playing its defeat clip.
          //   Now retreat → defeat → cheer is one clean slide-off.
          // - lost path is unchanged: no retreat beat, boss stays in
          //   place through defeat, then glides to center for VICTORY.
          opacity:
            outcome === "won"
              ? cinematicStage === "cheer"
                ? 0
                : cinematicStage === "retreat" || cinematicStage === "defeat"
                  ? 0.35
                  : 1
              : 1,
          transform:
            cinematicStage === "cheer" && outcome === "lost"
              ? "translateX(calc(-50vw + 50%)) scale(1.15)"
              : outcome === "won" &&
                  (cinematicStage === "retreat" ||
                    cinematicStage === "defeat" ||
                    cinematicStage === "cheer")
                ? "translateX(180px) scale(0.85)"
                : undefined,
          filter:
            outcome === "won" &&
            (cinematicStage === "retreat" || cinematicStage === "defeat")
              ? "blur(1px) saturate(0.6)"
              : undefined,
          // Slower ease during retreat so the flee reads as deliberate
          // and cinematic — the boss backing away in defeat, not just
          // sliding out.
          transition:
            outcome === "won" &&
            (cinematicStage === "retreat" ||
              cinematicStage === "defeat" ||
              cinematicStage === "cheer")
              ? "opacity 900ms ease-in, transform 1400ms cubic-bezier(0.22, 1, 0.36, 1), filter 900ms ease-in"
              : "opacity 500ms ease-out, transform 700ms cubic-bezier(0.4, 0, 0.2, 1)",
          pointerEvents:
            cinematicStage === "cheer" && outcome === "won" ? "none" : undefined,
        }}
      >
        {/* Real boss sprite from village-bosses config, falls back to
            the procedural BossSprite if the asset failed to load.
            NOTE: some boss idle assets (Fog of Vagueness) are now
            9-frame HORIZONTAL spritesheets from Pixellab, not single
            images. Rendering the whole sheet as <img> would show 9
            small silhouettes in a row. We paint the sheet as a CSS
            background clipped to the first frame (92×92 within a
            828×92 sheet) and scale it up to 300×300 for display. */}
        {bossAsset ? (
          <BossSpriteFromAsset
            bossAsset={bossAsset}
            displayWidth={bossDisplayWidth}
            // reactionEpoch bumps on every real hit/crit/counter, and
            // feeds into the inner sprite key so the hurt/attack clip
            // remounts + replays from frame 0 at the slow cinematic FPS.
            // Without it, the animation only played once (during the
            // optimistic pendingAttack) and finished before the server
            // response landed.
            replayKey={reactionEpoch}
            // Endgame-first: on WIN, boss's opacity has already gone
            // to 0 above so this state doesn't matter (boss faded out
            // — but we still send "defeat" for parity in case of
            // transition frames). On LOSS, boss loops VICTORY as the
            // dominating pose.
            // Otherwise regular reactive combat mapping:
            //   Player attacked → boss shows HURT (real HP hit).
            //   Boss counter → boss shows ATTACK.
            //   Optimistic pending-attack → boss shows HURT too.
            //   BLOCK / idle → idle breathing loop.
            state={
              // Cinematic staging:
              // - won → HOLD "idle" through every WIN stage. The
              //   retreat is a pure transform-slide off-screen, no
              //   defeat clip in place. Bug fix: previously swapped to
              //   "defeat" on the defeat stage, which combined with
              //   the transform-clearing bug made the boss "walk back
              //   into frame" and die on the spot. Now retreat → fade
              //   off cleanly with no per-frame animation change.
              // - lost → boss WINS → wait through defeat stage in
              //          idle, then VICTORY loop when at center.
              outcome === "won"
                // WIN cinematic staging (2-beat finisher):
                //   finisher-swing  → hold IDLE (boss still upright as
                //                     the persona winds up + swings).
                //   finisher-impact → HURT clip (recoil from the hit).
                //   retreat / defeat / cheer → IDLE while the villain
                //                     slides off / stays gone.
                ? cinematicStage === "finisher-impact"
                  ? "hurt"
                  : "idle"
                : outcome === "lost"
                  ? cinematicStage === "cheer"
                    ? "victory"
                    : "idle"
                  : bossReaction === "hit" || bossReaction === "crit"
                    ? "hurt"
                    : bossReaction === "counter"
                      ? "attack"
                      : pendingAttack
                        ? "hurt"
                        : "idle"
            }
          />
        ) : (
          <BossSprite persona={persona} />
        )}
      </div>

      {/* Player character sprite — left side, faces right.
          When the boss takes damage (HIT/CRIT), the player lunges
          forward to "attack" so the damage looks earned. When the
          player takes damage (COUNTER), the player flinches red and
          shakes. */}
      {/* CINEMATIC LAYOUT
         - defeat stage: persona stays in place; if losing, plays DEFEAT clip
         - cheer stage: loser fades to opacity 0; winner slides to center
                        and loops VICTORY */}
      <div
        // Persona left anchor: left-2 on mobile mirrors the boss's
        // right-2 so both combatants sit inside the arena frame with
        // matching gutters. Desktop keeps left-16 for the cinematic
        // stage-blocking.
        className="absolute left-2 sm:left-16"
        style={{
          // Ground-plane tuning:
          //   bottom-8 / bottom-12  → floated 32–48px above the path
          //   bottom: -40px         → sank below the visible arena
          //                           (works for the tall boss sprite
          //                            but the smaller persona sprite
          //                            gets clipped)
          //   bottom: 8px           → sits right on the street line,
          //                           feet meeting the boss's ground.
          bottom: 8,
          opacity:
            cinematicStage === "cheer" && outcome === "lost" ? 0 : 1,
          transform:
            cinematicStage === "cheer" && outcome === "won"
              ? "translateX(calc(50vw - 50%)) scale(1.15)"
              : undefined,
          transition:
            "opacity 500ms ease-out, transform 700ms cubic-bezier(0.4, 0, 0.2, 1)",
          pointerEvents:
            cinematicStage === "cheer" && outcome === "lost" ? "none" : undefined,
        }}
      >
        {/* Founder — animated Pixellab spritesheet for the alchemist
            (idle + attack + hurt) so the character actually reacts to
            each answer. Falls back to the legacy static portrait for
            non-alchemist personas (which still render as a
            transparent-background image). Fallback fallback: the
            procedural PlayerSprite when no asset is available.
            State mapping mirrors the boss above: player took damage →
            HURT one-shot; player landed a hit → ATTACK one-shot;
            otherwise → IDLE breathing loop. */}
        {founderAsset && personaIdForSprite ? (
          <AnimatedPersonaSprite
            personaId={personaIdForSprite}
            // See boss above — replayKey remounts the persona sprite on
            // every real reaction so the attack/hurt clip plays fresh
            // at slow FPS instead of silently expiring during the
            // optimistic pending window.
            replayKey={reactionEpoch}
            slowMotion={
              // Slow the ATTACK / HURT clips so the user can actually
              // see the swing/recoil instead of it whipping past in
              // half a second. Applied only during active reactions —
              // idle stays at its normal breathing cadence.
              pendingAttack ||
              bossReaction === "hit" ||
              bossReaction === "crit" ||
              bossReaction === "counter"
            }
            state={
              // Cinematic staging (matches boss above), now with the
              // RETREAT beat woven in:
              // - lost → persona LOSES → DEFEAT clip during defeat
              //          stage then held while faded out.
              // - won  → persona WINS → hold IDLE during retreat +
              //          defeat stages (proud stance while the boss
              //          crumbles), then VICTORY loop at center
              //          during cheer.
              outcome === "lost"
                ? "defeat"
                : outcome === "won"
                  // Persona WIN staging (2-beat finisher):
                  //   finisher-swing  → ATTACK clip fires first — the
                  //                     killing wind-up + swing arc,
                  //                     played BEFORE any boss recoil
                  //                     so the sequence reads as
                  //                     swing → contact → damage, not
                  //                     damage → swing.
                  //   finisher-impact → hold ATTACK (follow-through)
                  //                     while the boss plays HURT.
                  //   retreat / defeat → hold IDLE (proud stance).
                  //   cheer → VICTORY loop at center-stage.
                  ? cinematicStage === "finisher-swing" ||
                    cinematicStage === "finisher-impact"
                    ? "attack"
                    : cinematicStage === "cheer"
                      ? "victory"
                      : "idle"
                  : playerHurt
                    ? "hurt"
                    : bossReaction === "hit" || bossReaction === "crit"
                      ? "attack"
                      : pendingAttack
                        ? "attack"
                        : "idle"
            }
          />
        ) : founderAsset ? (
          <div
            role="img"
            aria-label="Founder"
            style={{
              width: 100,
              height: 140,
              backgroundImage: `url(${founderAsset})`,
              backgroundPosition: "center bottom",
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              imageRendering: "pixelated",
              filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.7))",
            }}
          />
        ) : (
          <PlayerSprite />
        )}
      </div>

      {/* (Platforms are declared above the sprite blocks for correct
          z-order — see the "Stone combat platforms" section earlier. */}

      {/* Slash overlay + damage-number popup removed — the Pixellab
          persona attack clip + boss hurt clip now carry the entire
          "I hit them" beat. Layered emoji slashes and yellow shakes
          were competing with the sprite animation and reading as a
          second, phantom animation. */}

      {/* ── Sparky companion ────────────────────────────────────────
          Small idle Sparky sprite tucked to the LEFT of the persona
          so the founder isn't alone in the arena — reads as "Sparky
          is helping fight". Swaps to the CHEER loop when the persona
          wins and the cinematic reaches the CHEER stage. Fades when
          the persona loses (Sparky is dejected too). Kept purely
          decorative — no pointer-events, no state escalation into
          the tutorial's global Sparky module. */}
      <div
        className="pointer-events-none absolute z-[6]"
        style={{
          // MOBILE: down at the persona's feet and just to their LEFT, so
          // Sparky reads as a companion sitting by the founder's leg.
          // He previously sat at bottom:43 / left:52 which floated him at
          // chest height and, at phone widths, on top of the persona.
          //
          // DESKTOP: unchanged (left 64 / bottom 43) — there is room for
          // the shoulder-to-shoulder staging on a wide arena.
          left: isMobile ? 14 : 64,
          bottom: isMobile ? 10 : 43,
          opacity:
            cinematicStage === "cheer" && outcome === "lost" ? 0.35 : 1,
          transition: "opacity 500ms ease-out",
        }}
        aria-hidden
      >
        <AnimatedSpritesheet
          key={
            cinematicStage === "cheer" && outcome === "won"
              ? "sparky-cheer"
              : "sparky-idle"
          }
          sheetUrl={
            cinematicStage === "cheer" && outcome === "won"
              ? "/assets/tutorial/sparky-v2/cheer.png"
              : "/assets/tutorial/sparky-v2/idle.png"
          }
          frameCount={
            cinematicStage === "cheer" && outcome === "won" ? 9 : 8
          }
          frameWidth={68}
          frameHeight={68}
          displayWidth={48}
          fps={cinematicStage === "cheer" && outcome === "won" ? 9 : 6}
          loop
          filter="drop-shadow(0 4px 8px rgba(0,0,0,0.7))"
        />
      </div>

      {/* ── Retreat announcement banner ─────────────────────────────
          Gamified beat that fires ONLY on WIN, ONLY during the
          RETREAT stage (first ~1.6s of the ending). Reads
          "{Boss Name} is retreating!" as an in-arena headline before
          the boss's DEFEAT clip actually starts, giving the ending
          narrative weight instead of the old "boss just kneels" jump-
          cut. Purely visual — no click handlers. */}
      <AnimatePresence>
        {cinematicStage === "retreat" && outcome === "won" && (
          <motion.div
            key="retreat-banner"
            initial={{ opacity: 0, scale: 0.85, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="pointer-events-none absolute inset-0 z-[20] flex items-center justify-center px-3"
          >
            <div
              className="border-2 border-amber-300 bg-black/85 px-4 py-2 shadow-[0_0_28px_rgba(251,191,36,0.55)] sm:px-6 sm:py-3"
              style={{ backdropFilter: "blur(2px)" }}
            >
              <p
                className="text-center font-mono text-sm font-black uppercase tracking-widest text-amber-300 sm:text-base"
                style={{ fontFamily: "var(--font-pixel-display), monospace" }}
              >
                {bossName} is retreating!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ground line */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-3 h-px bg-white/20"
        aria-hidden
      />
    </div>
  );
}

/** Procedural biome backdrop — snowy mountain pass at dusk.
 *
 * Layered parallax with five depth planes:
 *   1. Deep purple sky gradient (back)
 *   2. Twinkling stars (very back)
 *   3. Distant mountain silhouettes
 *   4. Mid-ground conifer treeline + wooden cabin with lit windows
 *   5. Snow ground + falling snow particles (front)
 *
 * Designed to mirror the Snowdin combat scene aesthetic from Undertale.
 */
function BiomeBackdrop() {
  return (
    <>
      {/* 1. Sky gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #0d0a25 0%, #1e1547 35%, #2a1c5c 60%, #0a0820 100%)",
        }}
      />

      {/* 2. Twinkling distant stars */}
      {[
        { left: "8%", top: "12%", delay: 0 },
        { left: "22%", top: "8%", delay: 0.6 },
        { left: "38%", top: "16%", delay: 1.2 },
        { left: "55%", top: "10%", delay: 1.8 },
        { left: "72%", top: "14%", delay: 0.3 },
        { left: "88%", top: "8%", delay: 0.9 },
        { left: "95%", top: "20%", delay: 1.5 },
        { left: "15%", top: "22%", delay: 2.1 },
        { left: "65%", top: "22%", delay: 2.4 },
      ].map((s, i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute h-[2px] w-[2px] bg-white"
          style={{
            left: s.left,
            top: s.top,
            imageRendering: "pixelated",
            boxShadow: "0 0 3px rgba(255,255,255,0.8)",
          }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: s.delay,
          }}
        />
      ))}

      {/* 3. Distant mountain silhouettes — three peaks in cool purple-blue */}
      <svg
        className="pointer-events-none absolute inset-x-0"
        viewBox="0 0 400 60"
        preserveAspectRatio="none"
        style={{ top: "30%", height: "20%", width: "100%" }}
      >
        <polygon
          points="0,60 60,20 110,45 160,15 220,40 280,10 340,35 400,30 400,60"
          fill="#2a1f4a"
          opacity="0.85"
        />
        <polygon
          points="0,60 40,35 90,50 150,30 210,52 270,28 330,48 400,42 400,60"
          fill="#1a1235"
          opacity="0.95"
        />
      </svg>

      {/* 4. Mid-ground conifer treeline — multiple triangular tree shapes */}
      <svg
        className="pointer-events-none absolute inset-x-0"
        viewBox="0 0 400 50"
        preserveAspectRatio="none"
        style={{ top: "48%", height: "26%", width: "100%" }}
      >
        {[5, 35, 80, 120, 165, 210, 250, 290, 320, 360, 388].map((x, i) => {
          const treeH = 28 + (i % 3) * 8;
          const treeW = 14 + (i % 2) * 4;
          return (
            <g key={`tree-${i}`}>
              {/* Snow-capped triangular pine */}
              <polygon
                points={`${x},${50 - treeH} ${x - treeW},50 ${x + treeW},50`}
                fill="#0f2218"
              />
              <polygon
                points={`${x},${50 - treeH} ${x - treeW * 0.4},${50 - treeH * 0.4} ${x + treeW * 0.4},${50 - treeH * 0.4}`}
                fill="#e6eef5"
              />
              {/* Trunk */}
              <rect x={x - 1} y={48} width="2" height="2" fill="#3a2614" />
            </g>
          );
        })}
      </svg>

      {/* Wooden cabin in the mid-ground, slightly off-center */}
      <svg
        className="pointer-events-none absolute"
        viewBox="0 0 60 50"
        style={{ right: "12%", top: "44%", width: "13%", height: "26%" }}
      >
        {/* Snow on roof */}
        <polygon points="6,18 30,4 54,18" fill="#e6eef5" />
        {/* Roof underside */}
        <polygon points="8,20 30,8 52,20" fill="#5a3a20" />
        {/* Cabin body */}
        <rect x="10" y="20" width="40" height="22" fill="#4a2f18" />
        <rect x="10" y="20" width="40" height="1" fill="#6b4528" />
        {/* Horizontal log lines */}
        {[24, 28, 32, 36].map((y) => (
          <rect key={y} x="10" y={y} width="40" height="1" fill="#2e1c0d" opacity="0.6" />
        ))}
        {/* Door */}
        <rect x="27" y="30" width="6" height="12" fill="#1a0e05" />
        <rect x="31" y="35" width="1" height="1" fill="#fbbf24" />
        {/* Window 1 — lit */}
        <rect x="14" y="26" width="6" height="6" fill="#fbbf24" />
        <rect x="15" y="27" width="4" height="4" fill="#fde68a" />
        <rect x="17" y="26" width="1" height="6" fill="#92400e" opacity="0.6" />
        <rect x="14" y="29" width="6" height="1" fill="#92400e" opacity="0.6" />
        {/* Window 2 — lit */}
        <rect x="40" y="26" width="6" height="6" fill="#fbbf24" />
        <rect x="41" y="27" width="4" height="4" fill="#fde68a" />
        <rect x="43" y="26" width="1" height="6" fill="#92400e" opacity="0.6" />
        <rect x="40" y="29" width="6" height="1" fill="#92400e" opacity="0.6" />
        {/* Chimney + smoke */}
        <rect x="38" y="10" width="4" height="10" fill="#3a2614" />
      </svg>
      {/* Cabin window glow */}
      <div
        className="pointer-events-none absolute"
        style={{
          right: "13.5%",
          top: "55%",
          width: "20px",
          height: "10px",
          background: "radial-gradient(circle, rgba(252,211,77,0.5) 0%, transparent 70%)",
          filter: "blur(4px)",
        }}
      />

      {/* 5. Snow ground — gradient base + scattered snow tufts */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          top: "70%",
          background:
            "linear-gradient(180deg, #b8c5d4 0%, #d8e2ec 30%, #e6eef5 100%)",
        }}
      />
      {/* Footstep dimples in the snow */}
      <div
        className="absolute inset-x-0 bottom-0 opacity-40"
        style={{
          top: "78%",
          backgroundImage:
            "radial-gradient(ellipse 6px 2px at 20% 20%, #8da3b8, transparent 70%), radial-gradient(ellipse 6px 2px at 50% 50%, #8da3b8, transparent 70%), radial-gradient(ellipse 6px 2px at 80% 30%, #8da3b8, transparent 70%), radial-gradient(ellipse 6px 2px at 35% 80%, #8da3b8, transparent 70%)",
          backgroundSize: "120px 50px",
        }}
      />

      {/* Falling snow particles */}
      <SnowParticles />

      {/* Subtle vignette + dusk haze */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 95%)",
        }}
      />
    </>
  );
}

function SnowParticles() {
  // Pre-computed deterministic starting positions for the snow grid so
  // the layout looks natural without re-randomising on every render.
  const flakes = React.useMemo(() => {
    return Array.from({ length: 22 }, (_, i) => ({
      id: i,
      left: ((i * 137) % 100), // golden-angle scatter
      delay: (i * 0.31) % 4,
      duration: 6 + ((i * 0.7) % 4),
      drift: ((i % 3) - 1) * 12,
      size: i % 5 === 0 ? 3 : 2,
    }));
  }, []);

  return (
    <>
      {flakes.map((f) => (
        <motion.div
          key={`snow-${f.id}`}
          className="pointer-events-none absolute bg-white"
          style={{
            left: `${f.left}%`,
            top: "-4%",
            width: f.size,
            height: f.size,
            opacity: 0.85,
            boxShadow: "0 0 2px rgba(255,255,255,0.6)",
            imageRendering: "pixelated",
          }}
          animate={{
            y: ["-4%", "108%"],
            x: [0, f.drift, 0],
          }}
          transition={{
            duration: f.duration,
            repeat: Infinity,
            ease: "linear",
            delay: f.delay,
          }}
        />
      ))}
    </>
  );
}

/**
 * Generic Pixellab spritesheet player — paints a horizontal N-frame sheet
 * as an animated CSS background, cycling through frames via `steps(N)`
 * keyframe animation. Handles both LOOPING idles and ONE-SHOT combat
 * clips (attack / hurt / defeat / victory).
 *
 * The keyframes are injected once per component instance via inline
 * <style>, keyed on a unique animation name so multiple sheets can
 * coexist without collisions. When `loop=false`, the final frame is
 * held via `animation-fill-mode: forwards`, and `onComplete` fires
 * after (frames/fps)s so the parent can swap back to idle.
 */
function AnimatedSpritesheet({
  sheetUrl,
  frameCount,
  frameWidth,
  frameHeight,
  displayWidth,
  fps,
  loop,
  flipX = false,
  filter,
  onComplete,
  holdLast = true,
}: {
  sheetUrl: string;
  frameCount: number;
  frameWidth: number;
  frameHeight: number;
  /** Displayed width in CSS px. Height auto-scales to preserve aspect. */
  displayWidth: number;
  fps: number;
  loop: boolean;
  flipX?: boolean;
  filter?: string;
  onComplete?: () => void;
  /** If true (default), the last frame is held after the animation
   *  completes (`animation-fill-mode: forwards`). Set to false for
   *  transient combat clips (attack, hurt) so the sprite doesn't
   *  visually "die" on the last frame of its recoil. */
  holdLast?: boolean;
}) {
  // Unique keyframe name per (sheet + display size) so re-mounts don't
  // collide and swapping clips re-triggers the animation from frame 0.
  const animId = useMemo(
    () => `spr-${Math.random().toString(36).slice(2, 8)}`,
    [sheetUrl, displayWidth, loop],
  );
  const scale = displayWidth / frameWidth;
  const displayHeight = frameHeight * scale;
  const sheetTotalW = frameCount * frameWidth;
  const durationMs = Math.max(60, (frameCount / Math.max(1, fps)) * 1000);

  // Fire onComplete once for non-looping clips.
  useEffect(() => {
    if (loop || !onComplete) return;
    const t = window.setTimeout(onComplete, durationMs + 30);
    return () => window.clearTimeout(t);
  }, [loop, onComplete, durationMs, sheetUrl]);

  // CSS-`steps(N)` sprite technique: the FROM→TO range must span ONE
  // FULL sheet width, not (N-1) frames. `steps(N)` then divides that
  // range into N equal jumps of exactly one frame each — snapping the
  // background from frame 0 → 1 → 2 → ... → N-1 (the final "N"th step
  // wraps back to frame 0 on the next loop iteration). If we used
  // -(N-1)*frameW as the endpoint, each step becomes (N-1)/N of a
  // frame and the sheet visibly slides between frames instead of
  // snapping — the "sliding left to right" bug.
  //
  // ALSO IMPORTANT — animate the FULL `background-position` (x + y)
  // instead of `background-position-x`. Screenshots from production
  // showed both persona and boss sprites stuck on frame 0; the root
  // cause was that a chunk of mobile browsers (iOS Safari < 16.4 +
  // several Android WebView builds) don't animate the split
  // `background-position-x` sub-property reliably when the base
  // `background-position` shorthand has been set separately on the
  // element. Animating the full shorthand from "0px 50%" to
  // "<endX>px 50%" avoids the sub-property mismatch and works on
  // every browser we support.
  const endX = -(frameCount * frameWidth * scale);
  const keyframes = `@keyframes ${animId} {
    from { background-position: 0px 50%; }
    to   { background-position: ${endX}px 50%; }
  }`;

  // `holdLast`: for TERMINAL one-shots (defeat / victory) we want the
  // final frame to persist. For TRANSIENT one-shots (attack / hurt) we
  // do NOT want to sit on the last frame — Pixellab's last hurt frame
  // is a hunched / knelt pose that reads as "defeated". `holdLast` is
  // wired through the persona/boss sprite wrappers and defaults to
  // true for backward compat.
  //
  // Single-frame guard: a `frames: 1` sheet has nothing to animate.
  // With steps(1) the background instantly jumps to -frameWidth (off
  // the sheet) each cycle, which erases the sprite mid-loop. Render a
  // plain static <img>-style block instead so registry entries for
  // bosses that ship only a single-frame idle placeholder still show
  // the sprite cleanly through the AnimatedSpritesheet pipeline.
  if (frameCount <= 1) {
    return (
      <div
        role="img"
        aria-label="Sprite"
        style={{
          width: displayWidth,
          height: displayHeight,
          imageRendering: "pixelated",
          transform: flipX ? "scaleX(-1)" : undefined,
          filter,
          backgroundImage: `url(${sheetUrl})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: `${displayWidth}px ${displayHeight}px`,
          backgroundPosition: "0 50%",
        }}
      />
    );
  }
  // Use the `animation` shorthand rather than the five split
  // properties: React's inline-style parser occasionally drops one of
  // the split props on hot-reload / hydration, resulting in a sprite
  // that renders frame 0 forever with no keyframe playing. The
  // shorthand is parsed as a single declaration and is stable across
  // every browser we ship for.
  const iterCount = loop ? "infinite" : "1";
  const fillMode = holdLast ? "forwards" : "none";
  const animationShorthand =
    `${animId} ${durationMs}ms steps(${frameCount}) ${iterCount} ${fillMode}`;
  return (
    <>
      <style>{keyframes}</style>
      <div
        role="img"
        aria-label="Sprite"
        style={{
          width: displayWidth,
          height: displayHeight,
          imageRendering: "pixelated",
          transform: flipX ? "scaleX(-1)" : undefined,
          filter,
          backgroundImage: `url(${sheetUrl})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: `${sheetTotalW * scale}px ${displayHeight}px`,
          backgroundPosition: "0 50%",
          // Shorthand + prefix for older iOS Safari (<= 15) that still
          // gates non-prefixed shorthand parsing on some property
          // combinations. Explicit will-change hint promotes the
          // element to its own compositor layer so the keyframes run
          // on the GPU thread instead of the main thread (visible
          // stutter on low-end Android otherwise).
          animation: animationShorthand,
          WebkitAnimation: animationShorthand,
          willChange: "background-position",
        }}
      />
    </>
  );
}

/** Persona state → Pixellab clip. Any persona with an `extended` block
 *  in personas.ts (alchemist @88×88, arcanist / artisan / drifter /
 *  engineer / healer / oracle / pathfinder @92×92, etc.) is supported.
 *  Missing clips (e.g. Oracle has no defeat/victory) gracefully fall
 *  back to the idle sheet so the sprite never disappears. */
type PersonaAnimState = "idle" | "attack" | "hurt" | "defeat" | "victory";
function AnimatedPersonaSprite({
  personaId,
  state,
  onStateComplete,
  displayWidth = 120,
  slowMotion = false,
  replayKey = 0,
}: {
  personaId: PersonaId;
  state: PersonaAnimState;
  onStateComplete?: () => void;
  displayWidth?: number;
  /** When true, ATTACK / HURT clips play at reduced FPS so the user
   *  can actually see each frame of the swing/recoil. Used during
   *  reaction beats in the combat card. Terminal clips (defeat /
   *  victory) always play at their cinematic-slow cadence
   *  independent of this flag. */
  slowMotion?: boolean;
  /** Bumped by the parent every time a REAL server reaction lands.
   *  Woven into the React key so the clip remounts + replays from
   *  frame 0, even when the sprite was already keyed to the same
   *  state string via the optimistic pendingAttack. */
  replayKey?: number;
}) {
  // Look up the persona's extended config to get the correct frame size,
  // frame count, and per-clip fps. Falls back to alchemist's 88×88 x9 if
  // extended is missing (shouldn't happen for the 8 real personas but
  // keeps the code defensive).
  const persona = getPersona(personaId);
  const ext = persona.extended;
  const frameWidth = ext?.frameWidth ?? 88;
  const frameHeight = ext?.frameHeight ?? 88;
  const idleFps = ext?.idleFps ?? 6;
  const combatFps = ext?.combatFps ?? 8;
  // Per-STATE frame count. The old code hardcoded frameCount to
  // ext.idleFrames for every state, so playing the 9-frame attack
  // sheet with frameCount=4 only cycled through the first 4 frames
  // and the rest of the swing was invisible. State-aware lookup
  // matches each sheet to its actual frame count with a defensive
  // fallback.
  const stateFrames = (() => {
    switch (state) {
      case "attack":  return ext?.attackFrames ?? 9;
      case "hurt":    return ext?.hurtFrames ?? 9;
      case "defeat":  return ext?.defeatFrames ?? 9;
      case "victory": return ext?.victoryFrames ?? 9;
      default:        return ext?.idleFrames ?? 9;
    }
  })();
  const frameCount = stateFrames;
  // If the persona is missing this clip (Oracle etc.), fall back to
  // idle so we never load a 404 sheet.
  const resolvedState: PersonaAnimState = ext?.missingClips?.includes(state as never)
    ? "idle"
    : state;
  const sheet = `/assets/personas/${personaId}/${resolvedState}.png`;

  // Warm the persona's non-idle clips for the same reason as the boss
  // (see BossSpriteFromAsset): the CSS steps() player does not wait for
  // the image, so the founder's very first swing would otherwise animate
  // an attack.png that has not arrived yet. Skips anything the persona
  // declares missing, so we never request a known-404.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const clips: PersonaAnimState[] = ["attack", "hurt", "defeat", "victory"];
    for (const c of clips) {
      if (ext?.missingClips?.includes(c as never)) continue;
      const img = new window.Image();
      img.src = `/assets/personas/${personaId}/${c}.png`;
    }
  }, [personaId, ext]);

  const isLoop = resolvedState === "idle" || resolvedState === "victory";
  // Only terminal (defeat / victory) clips freeze on the last frame —
  // attack and hurt release so the sprite doesn't sit on its knelt /
  // hunched recoil pose and read as "defeated".
  const holdLast = state === "defeat" || state === "victory";
  // Per-state FPS map — slowed further per product ask ("in AI
  // combat the animation speed should be slow"):
  //   idle    → persona's natural breathing cadence.
  //   victory → slow loop so the cheer reads as jubilant, not manic.
  //   defeat  → very slow so the crumble is legible frame-by-frame.
  //   attack/hurt → normal combat cadence, further slowed when
  //                slowMotion is on so the user sees the swing/recoil
  //                clearly during the arena-zoom moment. Floor
  //                dropped 3 → 2 and multiplier 0.5 → 0.4 for a
  //                more deliberate 3s clip at 9 frames.
  // Persona FPS aligned with the boss's snappier tuning above.
  // slowMotion still eases the clip a touch during the arena zoom
  // but not enough to feel like actual slow motion.
  // Persona per-state FPS — slowed further per product ask ("slow
  // down animations, they are still fast"). Attack/hurt clips drop
  // from ~7-9 fps to ~4-5 fps during slowMotion so each frame sits
  // on screen ~200ms; that's the sweet spot where the user actually
  // reads "sword raise → contact → follow-through" as three distinct
  // moments rather than a blur. Victory and defeat are unchanged
  // slow (5 / 4 fps) — they were already at "cinematic" speed.
  // Combat FPS re-tuned (2026-08-10) — product said "slow down
  // animations, they are still fast, do everything like a senior game
  // developer". Senior-game-dev take: attack/hurt clips should read
  // as three distinct beats (wind-up · contact · follow-through), so
  // each frame needs ~250-320ms on screen. That means 3-4 fps for
  // the swing while the arena is zoomed in on the evaluation moment.
  // Victory/defeat pushed one more notch slower for a proper crumble.
  const resolvedFps =
    state === "idle"
      ? idleFps
      : state === "victory"
        ? 4
        : state === "defeat"
          ? 3
          : slowMotion
            ? Math.max(3, Math.round(combatFps * 0.4))
            : Math.max(4, Math.round(combatFps * 0.55));
  return (
    <AnimatedSpritesheet
      key={`${personaId}:${state}:${replayKey}`}
      sheetUrl={sheet}
      frameCount={frameCount}
      frameWidth={frameWidth}
      frameHeight={frameHeight}
      displayWidth={displayWidth}
      fps={resolvedFps}
      loop={isLoop}
      holdLast={holdLast}
      filter="drop-shadow(0 6px 12px rgba(0,0,0,0.7))"
      onComplete={isLoop ? undefined : onStateComplete}
    />
  );
}

/** Render a boss idle asset that may be either a single-frame image
 *  (legacy) or a 9-frame horizontal spritesheet (new Pixellab pipeline).
 *  For Pixellab bosses (Fog of Vagueness), also swap between
 *  idle/attack/hurt/defeat/victory sheets based on combat state.
 *
 *  Sheet detection: any boss asset under a folder that has a matching
 *  9-frame Pixellab export is registered here. Legacy single-frame
 *  bosses fall through to a plain <img>.
 */
type BossAnimState = "idle" | "attack" | "hurt" | "defeat" | "victory";
function BossSpriteFromAsset({
  bossAsset,
  state = "idle",
  onStateComplete,
  displayWidth = 300,
  replayKey = 0,
}: {
  bossAsset: string;
  state?: BossAnimState;
  onStateComplete?: () => void;
  /** CSS px width for the rendered sprite. Defaults to the desktop
   *  cinematic 300; mobile callers pass ~180 so the boss doesn't
   *  crowd the whole arena on phones. */
  displayWidth?: number;
  /** Bumped by the parent every time a REAL server reaction lands.
   *  Woven into the React key so the clip remounts + replays from
   *  frame 0, even when the sprite was already keyed to the same
   *  state string via the optimistic pendingAttack. */
  replayKey?: number;
}) {
  // Per-CLIP frame counts because most bosses have short 4-frame idle
  // loops but longer 9-frame combat clips (attack / hurt / defeat /
  // victory). The old single-shared-count schema silently broke
  // every boss whose idle had a different frame count than its
  // attack sheet, so they rendered as static images even when the
  // combat clips were on disk.
  type ClipSpec = {
    frames: number;
    frameWidth: number;
    frameHeight: number;
  };
  const SPRITESHEET_BOSSES: readonly {
    /** Substring match against the boss's `idleAsset` path. */
    match: string;
    /** Folder that hosts the state sheets (idle/attack/hurt/…). */
    folder: string;
    /** Per-clip frame spec. Missing entries fall back to `idle`. */
    clips: Partial<Record<BossAnimState, ClipSpec>>;
  }[] = [
    // ── Village bosses ────────────────────────────────────────────
    {
      match: "/bosses/village/fog/idle.png",
      folder: "/assets/bosses/village/fog",
      clips: {
        idle:    { frames: 9, frameWidth: 92, frameHeight: 92 },
        attack:  { frames: 9, frameWidth: 92, frameHeight: 92 },
        hurt:    { frames: 9, frameWidth: 92, frameHeight: 92 },
        defeat:  { frames: 9, frameWidth: 92, frameHeight: 92 },
        victory: { frames: 9, frameWidth: 92, frameHeight: 92 },
      },
    },
    {
      match: "/bosses/village/chimera/idle.png",
      folder: "/assets/bosses/village/chimera",
      clips: {
        idle:   { frames: 9, frameWidth: 92, frameHeight: 92 },
        attack: { frames: 9, frameWidth: 92, frameHeight: 92 },
        hurt:   { frames: 9, frameWidth: 92, frameHeight: 92 },
      },
    },
    {
      match: "/bosses/village/automaton/idle.png",
      folder: "/assets/bosses/village/automaton",
      clips: {
        idle:    { frames: 9, frameWidth: 92, frameHeight: 92 },
        attack:  { frames: 9, frameWidth: 92, frameHeight: 92 },
        hurt:    { frames: 9, frameWidth: 92, frameHeight: 92 },
        victory: { frames: 9, frameWidth: 92, frameHeight: 92 },
      },
    },
    {
      match: "/bosses/village/wraith/idle.png",
      folder: "/assets/bosses/village/wraith",
      clips: {
        idle:    { frames: 9, frameWidth: 92, frameHeight: 92 },
        attack:  { frames: 9, frameWidth: 92, frameHeight: 92 },
        hurt:    { frames: 9, frameWidth: 92, frameHeight: 92 },
        victory: { frames: 9, frameWidth: 92, frameHeight: 92 },
      },
    },
    // ── Arena bosses ─────────────────────────────────────────────
    // Idle: 4-frame short loop @ 88px; combat clips: 9-frame @ 88px.
    {
      match: "/bosses/arena/advocate/idle.png",
      folder: "/assets/bosses/arena/advocate",
      clips: {
        idle:   { frames: 4, frameWidth: 88, frameHeight: 88 },
        attack: { frames: 9, frameWidth: 88, frameHeight: 88 },
        hurt:   { frames: 9, frameWidth: 88, frameHeight: 88 },
      },
    },
    {
      match: "/bosses/arena/judge/idle.png",
      folder: "/assets/bosses/arena/judge",
      clips: {
        idle:    { frames: 4, frameWidth: 88, frameHeight: 88 },
        attack:  { frames: 9, frameWidth: 88, frameHeight: 88 },
        hurt:    { frames: 9, frameWidth: 88, frameHeight: 88 },
        victory: { frames: 9, frameWidth: 88, frameHeight: 88 },
      },
    },
    {
      match: "/bosses/arena/masked-challenger/idle.png",
      folder: "/assets/bosses/arena/masked-challenger",
      clips: {
        idle:   { frames: 4, frameWidth: 92, frameHeight: 92 },
        attack: { frames: 9, frameWidth: 92, frameHeight: 92 },
      },
    },
    {
      match: "/bosses/arena/oracle-of-doubt/idle.png",
      folder: "/assets/bosses/arena/oracle-of-doubt",
      clips: {
        idle:   { frames: 4, frameWidth: 88, frameHeight: 88 },
        attack: { frames: 9, frameWidth: 88, frameHeight: 88 },
        hurt:   { frames: 9, frameWidth: 88, frameHeight: 88 },
      },
    },
    // ── Stage 2 (Forest) bosses ──────────────────────────────────
    {
      match: "/bosses/stage2/forest-colossus/idle.png",
      folder: "/assets/bosses/stage2/forest-colossus",
      clips: {
        idle:   { frames: 4, frameWidth: 96, frameHeight: 96 },
        attack: { frames: 9, frameWidth: 96, frameHeight: 96 },
        hurt:   { frames: 9, frameWidth: 96, frameHeight: 96 },
      },
    },
    {
      match: "/bosses/stage2/forest-sorceress/idle.png",
      folder: "/assets/bosses/stage2/forest-sorceress",
      clips: {
        idle:   { frames: 4, frameWidth: 92, frameHeight: 92 },
        attack: { frames: 9, frameWidth: 92, frameHeight: 92 },
        hurt:   { frames: 9, frameWidth: 92, frameHeight: 92 },
        defeat: { frames: 9, frameWidth: 92, frameHeight: 92 },
      },
    },
    {
      match: "/bosses/stage2/thornbearer/idle.png",
      folder: "/assets/bosses/stage2/thornbearer",
      clips: {
        idle:   { frames: 4, frameWidth: 88, frameHeight: 88 },
        attack: { frames: 9, frameWidth: 88, frameHeight: 88 },
        hurt:   { frames: 9, frameWidth: 88, frameHeight: 88 },
        defeat: { frames: 9, frameWidth: 88, frameHeight: 88 },
      },
    },
    // ── Super-Boss Pool (project-scoped villains) ────────────────
    {
      match: "/bosses/super-pool/rusted-oracle/idle.png",
      folder: "/assets/bosses/super-pool/rusted-oracle",
      clips: {
        idle:    { frames: 4, frameWidth: 92, frameHeight: 92 },
        attack:  { frames: 9, frameWidth: 92, frameHeight: 92 },
        hurt:    { frames: 9, frameWidth: 92, frameHeight: 92 },
        defeat:  { frames: 9, frameWidth: 92, frameHeight: 92 },
        victory: { frames: 9, frameWidth: 92, frameHeight: 92 },
      },
    },
    {
      match: "/bosses/super-pool/stonecaller/idle.png",
      folder: "/assets/bosses/super-pool/stonecaller",
      clips: {
        // Stonecaller ships a single-frame idle placeholder; combat
        // clips are the full 9-frame sheets.
        idle:    { frames: 1, frameWidth: 92, frameHeight: 92 },
        attack:  { frames: 9, frameWidth: 92, frameHeight: 92 },
        victory: { frames: 9, frameWidth: 92, frameHeight: 92 },
      },
    },
    {
      match: "/bosses/super-pool/tide-caller/idle.png",
      folder: "/assets/bosses/super-pool/tide-caller",
      clips: {
        // Tide-caller sheets are XL — 164px per frame.
        idle:    { frames: 9, frameWidth: 164, frameHeight: 164 },
        attack:  { frames: 9, frameWidth: 164, frameHeight: 164 },
        hurt:    { frames: 9, frameWidth: 164, frameHeight: 164 },
        defeat:  { frames: 9, frameWidth: 164, frameHeight: 164 },
        victory: { frames: 9, frameWidth: 164, frameHeight: 164 },
      },
    },
    {
      match: "/bosses/super-pool/veilwalker/idle.png",
      folder: "/assets/bosses/super-pool/veilwalker",
      clips: {
        idle:   { frames: 4, frameWidth: 88, frameHeight: 88 },
        attack: { frames: 9, frameWidth: 88, frameHeight: 88 },
        defeat: { frames: 9, frameWidth: 88, frameHeight: 88 },
      },
    },
    {
      match: "/bosses/super-pool/wraith-council/idle.png",
      folder: "/assets/bosses/super-pool/wraith-council",
      clips: {
        idle:   { frames: 4, frameWidth: 88, frameHeight: 88 },
        attack: { frames: 9, frameWidth: 88, frameHeight: 88 },
        hurt:   { frames: 9, frameWidth: 88, frameHeight: 88 },
        defeat: { frames: 9, frameWidth: 88, frameHeight: 88 },
      },
    },
    // ── Incoming / next-stage bosses ─────────────────────────────
    // All 9-frame × 92 with the newer "retreat" clip (used as the
    // hurt fallback where hurt art isn't shipped yet).
    {
      match: "/bosses/incoming/babel-merchant/idle.png",
      folder: "/assets/bosses/incoming/babel-merchant",
      clips: {
        idle:    { frames: 9, frameWidth: 92, frameHeight: 92 },
        attack:  { frames: 9, frameWidth: 92, frameHeight: 92 },
        victory: { frames: 9, frameWidth: 92, frameHeight: 92 },
      },
    },
    {
      match: "/bosses/incoming/collapse-specter/idle.png",
      folder: "/assets/bosses/incoming/collapse-specter",
      clips: {
        idle:    { frames: 9, frameWidth: 92, frameHeight: 92 },
        attack:  { frames: 9, frameWidth: 92, frameHeight: 92 },
        hurt:    { frames: 9, frameWidth: 92, frameHeight: 92 },
        victory: { frames: 9, frameWidth: 92, frameHeight: 92 },
      },
    },
    {
      match: "/bosses/incoming/harbourmaster/idle.png",
      folder: "/assets/bosses/incoming/harbourmaster",
      clips: {
        idle:    { frames: 9, frameWidth: 92, frameHeight: 92 },
        attack:  { frames: 9, frameWidth: 92, frameHeight: 92 },
        victory: { frames: 9, frameWidth: 92, frameHeight: 92 },
      },
    },
    {
      match: "/bosses/incoming/iron-bureaucrat/idle.png",
      folder: "/assets/bosses/incoming/iron-bureaucrat",
      clips: {
        idle:    { frames: 9, frameWidth: 92, frameHeight: 92 },
        attack:  { frames: 9, frameWidth: 92, frameHeight: 92 },
        victory: { frames: 9, frameWidth: 92, frameHeight: 92 },
      },
    },
    // ── Village super-boss (single-frame idle only for now) ─────
    // Registering with frames:1 still routes through
    // AnimatedSpritesheet so filter/scale/flipX behaviour matches
    // the animated bosses. Combat clips will fall back to idle via
    // FALLBACK_CHAIN until real sheets ship.
    {
      match: "/bosses/village/unraveller/idle.png",
      folder: "/assets/bosses/village/unraveller",
      clips: {
        idle: { frames: 1, frameWidth: 92, frameHeight: 92 },
      },
    },
    // ── Stage 2 bosses missing from earlier pass ────────────────
    {
      match: "/bosses/stage2/shadow-specter/idle.png",
      folder: "/assets/bosses/stage2/shadow-specter",
      clips: {
        idle: { frames: 1, frameWidth: 88, frameHeight: 88 },
      },
    },
    {
      match: "/bosses/stage2/forest-wraith/idle.png",
      folder: "/assets/bosses/stage2/forest-wraith",
      clips: {
        idle: { frames: 1, frameWidth: 92, frameHeight: 92 },
      },
    },
    // ── Stage 3 / Harbour bosses (all single-frame idle for now) ─
    {
      match: "/bosses/stage3/harbor-merchant/idle.png",
      folder: "/assets/bosses/stage3/harbor-merchant",
      clips: {
        idle: { frames: 1, frameWidth: 92, frameHeight: 92 },
      },
    },
    {
      match: "/bosses/stage3/harbor-mist/idle.png",
      folder: "/assets/bosses/stage3/harbor-mist",
      clips: {
        idle: { frames: 1, frameWidth: 92, frameHeight: 92 },
      },
    },
    {
      match: "/bosses/stage3/harbor-official/idle.png",
      folder: "/assets/bosses/stage3/harbor-official",
      clips: {
        idle: { frames: 1, frameWidth: 96, frameHeight: 96 },
      },
    },
    {
      match: "/bosses/stage3/leviathan/idle.png",
      folder: "/assets/bosses/stage3/leviathan",
      clips: {
        idle: { frames: 1, frameWidth: 92, frameHeight: 92 },
      },
    },
    {
      match: "/bosses/stage3/sea-serpent/idle.png",
      folder: "/assets/bosses/stage3/sea-serpent",
      clips: {
        idle: { frames: 1, frameWidth: 92, frameHeight: 92 },
      },
    },
    // ── Stage 4 / Artisans bosses (all single-frame idle) ───────
    {
      match: "/bosses/stage4/armor-golem/idle.png",
      folder: "/assets/bosses/stage4/armor-golem",
      clips: {
        idle: { frames: 1, frameWidth: 92, frameHeight: 92 },
      },
    },
    {
      match: "/bosses/stage4/artisan-automaton/idle.png",
      folder: "/assets/bosses/stage4/artisan-automaton",
      clips: {
        idle: { frames: 1, frameWidth: 96, frameHeight: 96 },
      },
    },
    {
      match: "/bosses/stage4/forge-dragon/idle.png",
      folder: "/assets/bosses/stage4/forge-dragon",
      clips: {
        idle: { frames: 1, frameWidth: 92, frameHeight: 92 },
      },
    },
    {
      match: "/bosses/stage4/spectral-king/idle.png",
      folder: "/assets/bosses/stage4/spectral-king",
      clips: {
        idle: { frames: 1, frameWidth: 92, frameHeight: 92 },
      },
    },
    {
      match: "/bosses/stage4/undead-titan/idle.png",
      folder: "/assets/bosses/stage4/undead-titan",
      clips: {
        idle: { frames: 1, frameWidth: 88, frameHeight: 88 },
      },
    },
    // ── Template bosses (2026-08-10) ──────────────────────────────
    // Wired via getTemplateStageBoss. Per-clip frame counts + sizes
    // pulled from the on-disk stitcher manifest. Without these
    // entries the boss rendered as static frame 0 during combat
    // because the sheet detector fell through to the plain <img>
    // branch. Fallback chain (hurt→attack→idle etc.) handles the
    // states each boss didn't ship art for.
    // ── Venture (Stage 4 super) ───────────────────────────────────
    {
      match: "/bosses/venture/unfinished-golem/idle.png",
      folder: "/assets/bosses/venture/unfinished-golem",
      clips: {
        idle:   { frames: 4, frameWidth: 88, frameHeight: 88 },
        attack: { frames: 9, frameWidth: 88, frameHeight: 88 },
      },
    },
    // ── Academic (6 bosses) ───────────────────────────────────────
    {
      match: "/bosses/academic/librarian-of-lost-questions/idle.png",
      folder: "/assets/bosses/academic/librarian-of-lost-questions",
      clips: {
        idle:   { frames: 4, frameWidth: 96, frameHeight: 96 },
        attack: { frames: 9, frameWidth: 96, frameHeight: 96 },
      },
    },
    {
      match: "/bosses/academic/keeper-of-incomplete-records/idle.png",
      folder: "/assets/bosses/academic/keeper-of-incomplete-records",
      clips: {
        idle:   { frames: 4, frameWidth: 88, frameHeight: 88 },
        attack: { frames: 9, frameWidth: 88, frameHeight: 88 },
        hurt:   { frames: 9, frameWidth: 88, frameHeight: 88 },
      },
    },
    {
      match: "/bosses/academic/cartographer-of-crooked-maps/idle.png",
      folder: "/assets/bosses/academic/cartographer-of-crooked-maps",
      clips: {
        idle:   { frames: 4, frameWidth: 92, frameHeight: 92 },
        attack: { frames: 9, frameWidth: 92, frameHeight: 92 },
        hurt:   { frames: 9, frameWidth: 92, frameHeight: 92 },
        defeat: { frames: 9, frameWidth: 92, frameHeight: 92 },
      },
    },
    {
      match: "/bosses/academic/blank-page-wraith/idle.png",
      folder: "/assets/bosses/academic/blank-page-wraith",
      clips: {
        idle:   { frames: 4, frameWidth: 76, frameHeight: 76 },
        attack: { frames: 9, frameWidth: 76, frameHeight: 76 },
        hurt:   { frames: 9, frameWidth: 76, frameHeight: 76 },
      },
    },
    {
      match: "/bosses/academic/councillor-of-false-consensus/idle.png",
      folder: "/assets/bosses/academic/councillor-of-false-consensus",
      clips: {
        idle:   { frames: 4, frameWidth: 92, frameHeight: 92 },
        attack: { frames: 9, frameWidth: 92, frameHeight: 92 },
        hurt:   { frames: 9, frameWidth: 92, frameHeight: 92 },
      },
    },
    {
      match: "/bosses/academic/gatekeeper-of-unearned-entry/idle.png",
      folder: "/assets/bosses/academic/gatekeeper-of-unearned-entry",
      clips: {
        idle:   { frames: 4, frameWidth: 92, frameHeight: 92 },
        attack: { frames: 9, frameWidth: 92, frameHeight: 92 },
        defeat: { frames: 9, frameWidth: 92, frameHeight: 92 },
      },
    },
    // ── Lab (4 unique bosses; Librarian + Cartographer are shared
    //   with Academic above via idleAsset path so no re-registration
    //   is needed for those two slots). ─────────────────────────────
    {
      match: "/bosses/lab/mirage-lens/idle.png",
      folder: "/assets/bosses/lab/mirage-lens",
      clips: {
        idle: { frames: 4, frameWidth: 84, frameHeight: 84 },
        hurt: { frames: 9, frameWidth: 84, frameHeight: 84 },
      },
    },
    {
      match: "/bosses/lab/saboteur-of-the-forge/idle.png",
      folder: "/assets/bosses/lab/saboteur-of-the-forge",
      clips: {
        // Saboteur ships a single south-rotation idle (no Breathing
        // loop was exported), so idle is 1 frame + treated as still.
        idle:   { frames: 1, frameWidth: 88, frameHeight: 88 },
        attack: { frames: 9, frameWidth: 88, frameHeight: 88 },
        hurt:   { frames: 9, frameWidth: 88, frameHeight: 88 },
      },
    },
    {
      match: "/bosses/lab/alchemist-of-wishful-results/idle.png",
      folder: "/assets/bosses/lab/alchemist-of-wishful-results",
      clips: {
        idle:   { frames: 4, frameWidth: 88, frameHeight: 88 },
        attack: { frames: 9, frameWidth: 88, frameHeight: 88 },
        hurt:   { frames: 9, frameWidth: 88, frameHeight: 88 },
      },
    },
    {
      match: "/bosses/lab/silencer-of-findings/idle.png",
      folder: "/assets/bosses/lab/silencer-of-findings",
      clips: {
        idle:   { frames: 4, frameWidth: 92, frameHeight: 92 },
        attack: { frames: 9, frameWidth: 92, frameHeight: 92 },
        defeat: { frames: 9, frameWidth: 92, frameHeight: 92 },
      },
    },
    // ── Creative template bosses (2026-08-14) — all 5 stages now
    //   have their own bespoke Pixellab art (Silence That Smothers,
    //   Curator of Derivative Ghosts, Beast of Unfinished, Crowd of
    //   False Validation, Perfectionist's Spectre). Frame sizes vary
    //   84-96 per pack. Fallback chain covers missing clips per boss.
    {
      match: "/bosses/creative/silence-that-smothers/idle.png",
      folder: "/assets/bosses/creative/silence-that-smothers",
      clips: {
        idle:   { frames: 1, frameWidth: 96, frameHeight: 96 },
        attack: { frames: 9, frameWidth: 96, frameHeight: 96 },
        hurt:   { frames: 9, frameWidth: 96, frameHeight: 96 },
        defeat: { frames: 9, frameWidth: 96, frameHeight: 96 },
      },
    },
    {
      match: "/bosses/creative/curator-of-derivative-ghosts/idle.png",
      folder: "/assets/bosses/creative/curator-of-derivative-ghosts",
      clips: {
        idle:   { frames: 4, frameWidth: 88, frameHeight: 88 },
        attack: { frames: 9, frameWidth: 88, frameHeight: 88 },
        hurt:   { frames: 9, frameWidth: 88, frameHeight: 88 },
      },
    },
    {
      match: "/bosses/creative/beast-of-the-unfinished/idle.png",
      folder: "/assets/bosses/creative/beast-of-the-unfinished",
      clips: {
        idle:   { frames: 4, frameWidth: 92, frameHeight: 92 },
        attack: { frames: 9, frameWidth: 92, frameHeight: 92 },
        defeat: { frames: 9, frameWidth: 92, frameHeight: 92 },
      },
    },
    {
      match: "/bosses/creative/crowd-of-false-validation/idle.png",
      folder: "/assets/bosses/creative/crowd-of-false-validation",
      clips: {
        idle: { frames: 4, frameWidth: 88, frameHeight: 88 },
        // No attack clip shipped — fallback chain uses hurt during
        // attack window (a wince-recoil reads as a bracing-to-strike
        // pose for the Crowd's multi-headed silhouette).
        hurt: { frames: 9, frameWidth: 88, frameHeight: 88 },
      },
    },
    {
      match: "/bosses/creative/perfectionists-spectre/idle.png",
      folder: "/assets/bosses/creative/perfectionists-spectre",
      clips: {
        idle:   { frames: 4, frameWidth: 84, frameHeight: 84 },
        attack: { frames: 9, frameWidth: 84, frameHeight: 84 },
        hurt:   { frames: 9, frameWidth: 84, frameHeight: 84 },
      },
    },
  ];
  const sheetDef = SPRITESHEET_BOSSES.find((s) => bossAsset.includes(s.match));

  // ── Warm every clip this boss owns, as soon as it mounts ────────────
  // MUST be declared before the early return below — hooks have to run in
  // the same order on every render.
  //
  // AnimatedSpritesheet is a pure CSS background-image + steps() player:
  // the animation starts the instant the element mounts and NEVER waits
  // for the image to decode. Each state is its own file, so on the FIRST
  // attack the browser begins downloading attack.png while the clip is
  // already running -- the animation finishes before the bytes land and
  // the user sees nothing. The second attack hits a warm cache and plays.
  //
  // That is the "first attack animation is invisible, second one works"
  // report, and why it varied by template: heavier attack sheets miss the
  // window more often, and only idle.png is warmed beforehand by the
  // boss's resting clip.
  useEffect(() => {
    if (typeof window === "undefined" || !sheetDef) return;
    for (const s of Object.keys(sheetDef.clips) as BossAnimState[]) {
      if (s === "idle") continue; // already loaded by the resting clip
      const img = new window.Image();
      img.src = `${sheetDef.folder}/${s}.png`;
    }
  }, [sheetDef]);

  if (!sheetDef) {
    return (
      <img
        src={bossAsset}
        alt="Boss"
        style={{
          imageRendering: "pixelated",
          width: 300,
          height: 300,
          objectFit: "contain",
          transform: "scaleX(-1)",
          filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.7))",
        }}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
    );
  }
  // Resolve the sheet URL for this state via a per-state FALLBACK
  // CHAIN. Previously a missing clip silently degraded straight to
  // "idle" — which meant e.g. a boss without a `defeat` sheet just
  // stood still on the VICTORY cinematic (silent-win bug), and a boss
  // without `hurt` didn't react to hits at all. The chain now picks
  // the closest available clip: hurt→attack→idle (a recoil reads as
  // a shortened attack), defeat→hurt→idle (stun frame reads as KO),
  // victory→attack→idle (dominating pose reads as victory). Idle is
  // guaranteed to exist so `spec` is always defined.
  const FALLBACK_CHAIN: Record<BossAnimState, BossAnimState[]> = {
    idle:    ["idle"],
    attack:  ["attack", "idle"],
    hurt:    ["hurt", "attack", "idle"],
    defeat:  ["defeat", "hurt", "idle"],
    victory: ["victory", "attack", "idle"],
  };
  const useState_: BossAnimState =
    FALLBACK_CHAIN[state].find((s) => sheetDef.clips[s]) ?? "idle";
  const spec = sheetDef.clips[useState_] ?? sheetDef.clips.idle!;
  const sheetUrl = `${sheetDef.folder}/${useState_}.png`;

  const isLoop = useState_ === "idle" || useState_ === "victory";
  // Terminal (defeat / victory) clips freeze on their last frame.
  // Transient combat clips (attack / hurt) release so the boss
  // doesn't sit on its recoil / stunned pose and read as "defeated".
  const holdLast = useState_ === "defeat" || useState_ === "victory";
  // Per-state FPS for the boss — slowed further per product ask
  // ("slow down animations, they are still fast, take analysis do
  // everything like senior game developer"). A 9-frame reaction at
  // 5fps lands in ~1.8s so the player has time to actually parse the
  // swing → contact → follow-through as three legible moments. The
  // paired arena-zoom (see BattleScene above) now runs 520ms in and
  // holds for the whole reaction window so the animation timing +
  // camera timing line up.
  //   idle    → gentle breathing loop (unchanged).
  //   victory → moderate triumphant loop (unchanged).
  //   defeat  → slow crumble so terminal frames read clearly (unch).
  //   attack/hurt → cinematic 5 fps (~1.8s for a 9-frame clip).
  const resolvedFps =
    useState_ === "idle"
      ? 6
      : useState_ === "victory"
        ? 5
        : useState_ === "defeat"
          ? 4
          : 5;
  return (
    <AnimatedSpritesheet
      key={`${useState_}:${replayKey}`}
      sheetUrl={sheetUrl}
      frameCount={spec.frames}
      frameWidth={spec.frameWidth}
      frameHeight={spec.frameHeight}
      displayWidth={displayWidth}
      fps={resolvedFps}
      loop={isLoop}
      holdLast={holdLast}
      flipX
      filter="drop-shadow(0 8px 16px rgba(0,0,0,0.7))"
      onComplete={isLoop ? undefined : onStateComplete}
    />
  );
}

/** Detailed pixel-art boss sprite — humanoid figure with persona-keyed
 *  colour palette. Uses 3-tier shading (outline / fill / highlight)
 *  and elaborate detail: horned hood, glowing eyes, cloak, gauntlets,
 *  staff with a glowing crystal. */
function BossSprite({ persona }: { persona: "villain" | "mentor" }) {
  // Three colour tiers per palette: outline (darkest), body (mid), accent (lightest)
  const isVillain = persona === "villain";
  const outline = isVillain ? "#3a0808" : "#1a0f3a";
  const body = isVillain ? "#7a1a1a" : "#3a2670";
  const accent = isVillain ? "#FF6B6B" : "#9F7AEA";
  const highlight = isVillain ? "#FFB3B3" : "#D8C7FF";
  const eyeGlow = isVillain ? "#FFFF00" : "#7CFFE0";
  const crystal = isVillain ? "#FF3333" : "#9F7AEA";

  return (
    <svg
      viewBox="0 0 32 40"
      width={84}
      height={104}
      style={{ imageRendering: "pixelated", overflow: "visible" }}
    >
      {/* Soft halo glow behind boss */}
      <ellipse
        cx="16"
        cy="22"
        rx="14"
        ry="18"
        fill={accent}
        opacity="0.15"
        filter="blur(3px)"
      />

      {/* Two pointed horns/hood spikes */}
      <polygon points="7,0 9,6 5,6" fill={outline} />
      <polygon points="8,1 9,5 6,5" fill={body} />
      <polygon points="25,0 27,6 23,6" fill={outline} />
      <polygon points="26,1 27,5 24,5" fill={body} />

      {/* Hood */}
      <rect x="7" y="3" width="18" height="3" fill={outline} />
      <rect x="6" y="4" width="2" height="10" fill={outline} />
      <rect x="24" y="4" width="2" height="10" fill={outline} />
      <rect x="8" y="4" width="16" height="2" fill={accent} />
      <rect x="8" y="6" width="16" height="1" fill={highlight} opacity="0.5" />

      {/* Face shadow */}
      <rect x="8" y="6" width="16" height="10" fill={body} />
      {/* Cheek highlight */}
      <rect x="9" y="7" width="14" height="1" fill={highlight} opacity="0.3" />

      {/* Glowing eyes — two-tier (white sclera + glowing pupil) */}
      <rect x="10" y="9" width="4" height="3" fill="#000" />
      <rect x="18" y="9" width="4" height="3" fill="#000" />
      <rect x="11" y="10" width="2" height="2" fill={eyeGlow} />
      <rect x="19" y="10" width="2" height="2" fill={eyeGlow} />
      <rect x="11" y="10" width="1" height="1" fill="#fff" />
      <rect x="19" y="10" width="1" height="1" fill="#fff" />

      {/* Mouth — villain shows fangs, mentor a calm line */}
      {isVillain ? (
        <>
          <rect x="11" y="13" width="10" height="2" fill={outline} />
          <rect x="12" y="15" width="1" height="2" fill="#fff" />
          <rect x="14" y="15" width="1" height="2" fill="#fff" />
          <rect x="17" y="15" width="1" height="2" fill="#fff" />
          <rect x="19" y="15" width="1" height="2" fill="#fff" />
        </>
      ) : (
        <rect x="13" y="14" width="6" height="1" fill={outline} />
      )}

      {/* Cloak shoulders */}
      <rect x="4" y="16" width="24" height="3" fill={outline} />
      <rect x="5" y="17" width="22" height="2" fill={accent} />

      {/* Body / robe with vertical seam */}
      <rect x="6" y="18" width="20" height="16" fill={outline} />
      <rect x="7" y="19" width="18" height="14" fill={body} />
      <rect x="15" y="19" width="2" height="14" fill={outline} opacity="0.6" />
      {/* Body highlight stripe */}
      <rect x="7" y="19" width="18" height="1" fill={highlight} opacity="0.5" />

      {/* Belt with central gem */}
      <rect x="6" y="24" width="20" height="2" fill={outline} />
      <rect x="7" y="24" width="18" height="2" fill={accent} />
      <rect x="14" y="24" width="4" height="2" fill={crystal} />
      <rect x="15" y="24" width="1" height="1" fill="#fff" />

      {/* Arms / sleeves */}
      <rect x="2" y="18" width="4" height="10" fill={outline} />
      <rect x="3" y="19" width="3" height="9" fill={body} />
      <rect x="26" y="18" width="4" height="10" fill={outline} />
      <rect x="26" y="19" width="3" height="9" fill={body} />

      {/* Gauntlets */}
      <rect x="2" y="28" width="4" height="3" fill={outline} />
      <rect x="3" y="29" width="3" height="2" fill={accent} />
      <rect x="26" y="28" width="4" height="3" fill={outline} />
      <rect x="27" y="29" width="3" height="2" fill={accent} />

      {/* Staff in right hand, with glowing crystal on top */}
      <rect x="29" y="14" width="1" height="18" fill="#3a2614" />
      <rect x="30" y="14" width="1" height="18" fill="#1c1308" />
      <rect x="28" y="12" width="4" height="3" fill={crystal} />
      <rect x="29" y="11" width="2" height="1" fill={highlight} />
      <rect x="29" y="13" width="1" height="1" fill="#fff" />
      {/* Crystal glow */}
      <circle cx="30" cy="13" r="3.5" fill={crystal} opacity="0.35" />

      {/* Legs */}
      <rect x="9" y="34" width="4" height="5" fill={outline} />
      <rect x="9" y="34" width="3" height="5" fill={body} />
      <rect x="19" y="34" width="4" height="5" fill={outline} />
      <rect x="19" y="34" width="3" height="5" fill={body} />

      {/* Feet / boots */}
      <rect x="8" y="38" width="6" height="2" fill="#1a0808" />
      <rect x="18" y="38" width="6" height="2" fill="#1a0808" />
      <rect x="8" y="38" width="6" height="1" fill={outline} />
      <rect x="18" y="38" width="6" height="1" fill={outline} />
    </svg>
  );
}

/** Detailed player character sprite — hooded adventurer with cape,
 *  belt, satchel. Three-tier shading like the boss. */
function PlayerSprite() {
  return (
    <svg
      viewBox="0 0 24 32"
      width={56}
      height={76}
      style={{ imageRendering: "pixelated", overflow: "visible" }}
    >
      {/* Faint shadow under feet */}
      <ellipse cx="12" cy="31" rx="8" ry="1.5" fill="#000" opacity="0.5" />

      {/* Cape behind (peeks out around shoulders) */}
      <rect x="5" y="11" width="14" height="14" fill="#7a0d0d" />
      <rect x="5" y="11" width="14" height="2" fill="#9c1818" />
      <rect x="5" y="23" width="14" height="2" fill="#5a0808" />

      {/* Hood */}
      <rect x="6" y="0" width="12" height="3" fill="#0a1f4a" />
      <rect x="5" y="2" width="14" height="3" fill="#0a1f4a" />
      <rect x="4" y="4" width="2" height="6" fill="#0a1f4a" />
      <rect x="18" y="4" width="2" height="6" fill="#0a1f4a" />
      <rect x="6" y="1" width="12" height="1" fill="#1e40af" opacity="0.6" />

      {/* Face */}
      <rect x="6" y="5" width="12" height="7" fill="#fbd29c" />
      <rect x="6" y="5" width="12" height="1" fill="#fde8c8" opacity="0.6" />

      {/* Eyes */}
      <rect x="9" y="7" width="2" height="2" fill="#1a1208" />
      <rect x="13" y="7" width="2" height="2" fill="#1a1208" />
      <rect x="10" y="7" width="1" height="1" fill="#fff" />
      <rect x="14" y="7" width="1" height="1" fill="#fff" />

      {/* Nose hint + mouth */}
      <rect x="11" y="9" width="2" height="1" fill="#d9a872" />
      <rect x="10" y="10" width="4" height="1" fill="#5a3a2a" />

      {/* Tunic body */}
      <rect x="5" y="12" width="14" height="13" fill="#0a1f4a" />
      <rect x="6" y="12" width="12" height="13" fill="#1e3a8a" />
      <rect x="6" y="12" width="12" height="1" fill="#3b5fc4" opacity="0.6" />

      {/* Chest emblem — small heart matching the SOUL */}
      <rect x="10" y="16" width="4" height="3" fill="#FF0033" />
      <rect x="9" y="17" width="1" height="1" fill="#FF0033" />
      <rect x="14" y="17" width="1" height="1" fill="#FF0033" />
      <rect x="10" y="19" width="4" height="1" fill="#FF0033" />
      <rect x="11" y="20" width="2" height="1" fill="#FF0033" />

      {/* Belt */}
      <rect x="5" y="20" width="14" height="2" fill="#3a2614" />
      <rect x="11" y="20" width="2" height="2" fill="#fbbf24" />
      <rect x="11" y="20" width="2" height="1" fill="#fde68a" />

      {/* Arms / sleeves */}
      <rect x="3" y="13" width="3" height="9" fill="#0a1f4a" />
      <rect x="4" y="13" width="2" height="9" fill="#1e3a8a" />
      <rect x="18" y="13" width="3" height="9" fill="#0a1f4a" />
      <rect x="18" y="13" width="2" height="9" fill="#1e3a8a" />

      {/* Gloves */}
      <rect x="3" y="22" width="3" height="2" fill="#3a2614" />
      <rect x="4" y="22" width="2" height="2" fill="#5a3a14" />
      <rect x="18" y="22" width="3" height="2" fill="#3a2614" />
      <rect x="18" y="22" width="2" height="2" fill="#5a3a14" />

      {/* Legs / pants */}
      <rect x="7" y="25" width="4" height="6" fill="#1c1308" />
      <rect x="7" y="25" width="3" height="6" fill="#3a2614" />
      <rect x="13" y="25" width="4" height="6" fill="#1c1308" />
      <rect x="13" y="25" width="3" height="6" fill="#3a2614" />

      {/* Boots */}
      <rect x="6" y="30" width="6" height="2" fill="#000" />
      <rect x="12" y="30" width="6" height="2" fill="#000" />
      <rect x="6" y="30" width="6" height="1" fill="#3a2614" />
      <rect x="12" y="30" width="6" height="1" fill="#3a2614" />
    </svg>
  );
}

/**
 * Wraps the dialogue panel with reaction animations — shake/flash on
 * boss hit, floating damage numbers, counter-attack lunge. Mirrors the
 * MiniBoss reaction vocabulary in the Phaser scene so both surfaces
 * speak the same visual language.
 */
function ReactiveDialogueShell({
  bossReaction,
  bossDamage,
  playerDamage,
  children,
}: {
  bossReaction: "idle" | "hit" | "crit" | "counter" | "block";
  bossDamage: number | null;
  playerDamage: number | null;
  children: React.ReactNode;
}) {
  const animateProps = (() => {
    switch (bossReaction) {
      case "hit":
        return {
          x: [0, -6, 6, -4, 4, 0],
          filter: ["brightness(1)", "brightness(1.6)", "brightness(1)"],
        };
      case "crit":
        return {
          x: [0, -10, 10, -8, 8, 0],
          rotate: [0, -2, 2, -1, 1, 0],
          scale: [1, 1.04, 1],
          filter: [
            "brightness(1)",
            "brightness(2) drop-shadow(0 0 18px #fb7185)",
            "brightness(1)",
          ],
        };
      case "counter":
        return {
          x: [0, 16, -2, 0],
          filter: [
            "brightness(1)",
            "brightness(1.5) drop-shadow(0 0 10px #ef4444)",
            "brightness(1)",
          ],
        };
      case "block":
        // Both sides parry — quick jitter + cool blue glow, no shake.
        // Suggests a defensive exchange where neither lands clean.
        return {
          x: [0, -2, 2, -2, 2, 0],
          filter: [
            "brightness(1)",
            "brightness(0.85) drop-shadow(0 0 12px #60a5fa)",
            "brightness(1)",
          ],
        };
      default:
        return { x: 0, scale: 1, rotate: 0, filter: "brightness(1)" };
    }
  })();

  return (
    <motion.div
      className="relative"
      animate={animateProps}
      transition={{
        // Reaction durations lengthened per product ask ("slow down
        // animations, they are still fast, take analysis do
        // everything like senior game developer"). Old timings were
        // in the 0.5-0.7s range which reads as a "hit-and-forget"
        // UI microinteraction. Turn-based combat feedback wants
        // 0.9-1.3s so the player has time to register WHAT
        // happened (hit / crit / counter / block) before the next
        // question loads. Crits get the longest window because they
        // stack a screen-shake, filter glow, and scale bump — a fast
        // crit reads as a jitter.
        duration:
          bossReaction === "crit"
            ? 1.3
            : bossReaction === "counter"
              ? 1.05
              : bossReaction === "block"
                ? 1.0
                : 0.95,
        ease: "easeOut",
      }}
    >
      {children}

      {/* Floating damage/counter/block labels + block-spark particles
          removed — the Pixellab attack/hurt/defeat/victory spritesheet
          clips are now the ONLY source of combat feedback so nothing
          competes with them and reads as "another animation replaying". */}
    </motion.div>
  );
}
