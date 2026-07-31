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
  const [bossDamage, setBossDamage] = useState<number | null>(null);
  const [playerDamage, setPlayerDamage] = useState<number | null>(null);
  const lastBossHpRef = useRef(bossHpCurrent);
  const lastPlayerHpRef = useRef(playerHpCurrent);
  const reactionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const playerHurtTimerRef = useRef<NodeJS.Timeout | null>(null);
  const damageNumberTimerRef = useRef<NodeJS.Timeout | null>(null);
  const playerDamageNumberTimerRef = useRef<NodeJS.Timeout | null>(null);

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
      const critThreshold = bossHpInitial * 0.2;
      const kind: ReactionKind = bossDelta >= critThreshold ? "crit" : "hit";
      setBossReaction(kind);
      setBossDamage(Math.round(bossDelta));
      if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current);
      reactionTimerRef.current = setTimeout(
        () => setBossReaction("idle"),
        kind === "crit" ? 1600 : 1300,
      );
      if (damageNumberTimerRef.current) clearTimeout(damageNumberTimerRef.current);
      damageNumberTimerRef.current = setTimeout(
        () => setBossDamage(null),
        1800,
      );
    } else if (playerDelta > 0) {
      // Boss counter-attacked. Show player damage flash + boss "counter" pose.
      setBossReaction("counter");
      setPlayerHurt(true);
      setPlayerDamage(Math.round(playerDelta));
      if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current);
      reactionTimerRef.current = setTimeout(
        () => setBossReaction("idle"),
        1400,
      );
      if (playerHurtTimerRef.current) clearTimeout(playerHurtTimerRef.current);
      playerHurtTimerRef.current = setTimeout(
        () => setPlayerHurt(false),
        1300,
      );
      if (playerDamageNumberTimerRef.current)
        clearTimeout(playerDamageNumberTimerRef.current);
      playerDamageNumberTimerRef.current = setTimeout(
        () => setPlayerDamage(null),
        1100,
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

    lastBossHpRef.current = bossHpCurrent;
    lastPlayerHpRef.current = playerHpCurrent;
    lastQuestionIdRef.current = question._id;
  }, [bossHpCurrent, playerHpCurrent, bossHpInitial, question._id]);

  useEffect(() => {
    return () => {
      if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current);
      if (playerHurtTimerRef.current) clearTimeout(playerHurtTimerRef.current);
      if (damageNumberTimerRef.current) clearTimeout(damageNumberTimerRef.current);
      if (playerDamageNumberTimerRef.current)
        clearTimeout(playerDamageNumberTimerRef.current);
      if (pendingAttackTimerRef.current)
        clearTimeout(pendingAttackTimerRef.current);
    };
  }, []);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    reset();
    setValue("");
    valueRef.current = "";
    setDialogueDone(false); // hold the timer until this new question's typewriter finishes
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
    // Safety timeout is intentionally LONGER than the server p99
    // round-trip. Previously this was 1500ms, but the server usually
    // takes 2-3s to score an answer — the safety timer was firing
    // BEFORE the server responded, dropping the sprite back to "idle"
    // and then remounting it as "hurt" a moment later when the real
    // reaction landed. That's the "hurt → pause → hurt again" glitch.
    // 8s is long enough that in a normal round the reactive useEffect
    // above always clears pendingAttack first; the timer only fires as
    // a safety net if the mutation genuinely never resolves.
    setPendingAttack(true);
    if (pendingAttackTimerRef.current) clearTimeout(pendingAttackTimerRef.current);
    pendingAttackTimerRef.current = setTimeout(
      () => setPendingAttack(false),
      8000,
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
          bar which sits at top-16 above the panel. */}
      <div
        className="mb-4 flex items-center justify-center gap-2 bg-black px-4 py-2"
        style={{ marginTop: "3.25rem" }}
      >
        <span className="text-base text-emerald-400">📍</span>
        <span
          className="min-w-0 truncate font-mono text-sm font-black uppercase tracking-widest text-emerald-300"
          style={{ fontFamily: "var(--font-pixel-display), monospace" }}
          title={ideaTitle ?? undefined}
        >
          {ideaTitle && ideaTitle.trim().length > 0 ? ideaTitle : "Your Venture"}
          :&nbsp;&nbsp;BOSS CHALLENGE
        </span>
      </div>

      {/* Single-column layout — sidebar removed per product request. */}
      <div className="flex flex-col gap-3">
        {/* Timer BAR — horizontal, professional layout. Sits above
            the arena. Only starts once (a) a REAL question is loaded
            (not the "transition" placeholder shown while the next
            question is being generated), AND (b) the AI dialogue
            typewriter has finished — otherwise the user watches
            their timer tick down while they're still reading the
            question. Prefixed with a "TIMER" label per product request. */}
        <div className="flex items-center gap-3">
          {/* Pixel hourglass — icon alone (label dropped per product).
              Bar fill itself signals green→yellow→red urgency. */}
          <PixelIcon
            name="hourglass-blue"
            size={22}
            alt="Timer"
            className="shrink-0"
          />
          <div className="flex-1">
            <CombatTimerBar
              servedAt={question.servedAt}
              durationMs={Math.max(240_000, question.durationMs)}
              onExpire={handleExpire}
              enabled={
                dialogueDone &&
                // Reject the placeholder question that we synthesize
                // while waiting for the server's next real question.
                // Its _id is the sentinel string "transition" (set in
                // PhaseSwitch's fallback), so we key off that.
                (question._id as unknown as string) !== "transition"
              }
            />
          </div>
        </div>

        {/* Battle scene — HP bars are rendered UNDER each character
            inside BattleScene now (platforms removed per product
            request). */}
        <BattleScene
          persona={question.persona}
          bossReaction={bossReaction}
          playerHurt={playerHurt}
          pendingAttack={pendingAttack}
          bossAsset={boss?.idleAsset ?? null}
          checkpointIndex={boss?.checkpointIndex ?? null}
          founderAsset={founderAsset}
          playerHpCurrent={playerHpCurrent}
          playerHpInitial={playerHpInitial}
          bossHpCurrent={bossHpCurrent}
          bossHpInitial={bossHpInitial}
          bossName={boss?.name ?? "Doubt Imp"}
        />

        {/* Dialogue box */}
        <ReactiveDialogueShell
          bossReaction={bossReaction}
          bossDamage={bossDamage}
          playerDamage={playerDamage}
        >
          <DialoguePanel
            persona={question.persona}
            prompt={question.prompt}
            onDone={() => setDialogueDone(true)}
          />
        </ReactiveDialogueShell>

        {/* Answer textarea */}
        {/* Copy / paste / cut / right-click BLOCKED per product
            request — see earlier task. */}
        <textarea
          ref={textareaRef}
          aria-label="Your answer"
          className="min-h-[120px] w-full resize-y bg-black p-3 font-mono text-sm leading-relaxed text-white outline-none disabled:opacity-60"
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
            className="border-2 border-white bg-black px-6 py-2 font-mono text-xs uppercase tracking-wider text-white transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
            style={{ fontFamily: "var(--font-pixel-display), monospace" }}
          >
            Attack
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Sub-components for the mockup layout
// ─────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────
// Horizontal timer bar — replaces the circular CombatRing at the top
// of the panel for a cleaner, more professional layout. Wall-clock
// driven so tab-hide doesn't skew the countdown. Holds full when
// `enabled` is false (used to pause the clock while the AI's
// dialogue is still typing).
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
                transition: "width 400ms cubic-bezier(0.4, 0, 0.2, 1)",
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
  onDone,
}: {
  persona: "villain" | "mentor";
  prompt: string;
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
  return (
    <div className="flex items-start gap-4 bg-black p-4">
      <Portrait persona={persona} talking={isTyping} />
      <p
        className="flex-1 font-[var(--font-pixel-body)] text-base leading-relaxed text-white"
        style={{ fontFamily: "var(--font-pixel-body), monospace" }}
      >
        <span className="mr-2 text-white/90">*</span>
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
function deriveBiomeMap(bossAsset: string | null | undefined): string {
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
  if (bossAsset.includes("/bosses/stage3/")) {
    return "/assets/maps-v2/golden-harbor/harbor-map.png";
  }
  if (bossAsset.includes("/bosses/stage4/")) {
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
function focusForCheckpoint(
  bossAsset: string | null | undefined,
  checkpointIndex: number | null | undefined,
): { positionX: string; positionY: string; size: string } {
  const biome = biomeKeyFromBossAsset(bossAsset);
  const cps = biome ? CP_FOCUS_MAP[biome] : null;
  const cp = cps && typeof checkpointIndex === "number" ? cps[checkpointIndex] : null;
  if (!cp) {
    // No CP focus available — default to centered arena crop
    return { positionX: "50%", positionY: "50%", size: "cover" };
  }
  // Zoom in on the CP by using a larger background-size and positioning
  // by the CP's (x%, y%).  180% size ≈ 1.8× zoom which frames the area
  // around a CP with more surrounding context — the wider view gives
  // more sense of the biome without turning into a full-map screenshot.
  return {
    positionX: `${cp.x}%`,
    positionY: `${cp.y}%`,
    size: "180%",
  };
}

function BattleScene({
  persona,
  bossReaction,
  playerHurt,
  pendingAttack = false,
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

  // ── Two-stage cinematic ────────────────────────────────────────────
  // Stage 1 (0-1500ms after HP hits 0): both sprites stay in place,
  //   LOSER plays DEFEAT one-shot (kneels / crumbles / dies).
  // Stage 2 (1500ms+): LOSER fades out, WINNER glides to arena center
  //   and plays VICTORY on loop until the outer buffer expires.
  const DEFEAT_STAGE_MS = 1500;
  const [cinematicStage, setCinematicStage] = useState<
    "none" | "defeat" | "cheer"
  >("none");
  useEffect(() => {
    if (outcome === "active") {
      setCinematicStage("none");
      return;
    }
    // Just entered an outcome — start with DEFEAT.
    setCinematicStage("defeat");
    const t = window.setTimeout(() => setCinematicStage("cheer"), DEFEAT_STAGE_MS);
    return () => window.clearTimeout(t);
  }, [outcome]);
  return (
    <div
      className="relative h-52 w-full overflow-hidden border-2 border-white sm:h-56"
      style={{ imageRendering: "pixelated" }}
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
          and same width as the sprite (100px), so it sits directly
          beneath the founder without floating left or right. */}
      <div
        className="pointer-events-none absolute bottom-2 left-8 z-10 sm:bottom-3 sm:left-16"
        style={{ width: 200 }}
      >
        <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-widest text-white/85">
          <span>You</span>
          <span className="tabular-nums text-white/60">
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
          and width matches the sprite's visible art (~200px inside its
          300px slot). Sits directly beneath the boss. */}
      <div
        className="pointer-events-none absolute bottom-2 right-8 z-10 sm:bottom-3 sm:right-16"
        style={{ width: 200 }}
      >
        <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-widest text-white/85">
          <span className="truncate pr-2">{bossName}</span>
          <span className="tabular-nums text-white/60">
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
        className="absolute right-8 sm:right-16"
        style={{
          bottom: "-40px",
          // CINEMATIC LAYOUT
          // - defeat stage: both sprites stay, loser is animated in-place
          // - cheer stage: loser (opacity 0) is gone, winner moved to center
          // - won → boss is the loser; lost → boss is the winner
          opacity:
            cinematicStage === "cheer" && outcome === "won" ? 0 : 1,
          transform:
            cinematicStage === "cheer" && outcome === "lost"
              ? "translateX(calc(-50vw + 50%)) scale(1.15)"
              : undefined,
          transition:
            "opacity 500ms ease-out, transform 700ms cubic-bezier(0.4, 0, 0.2, 1)",
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
              // - won → boss LOSES → DEFEAT then held while faded out
              // - lost → boss WINS → wait through defeat stage in idle,
              //                       then VICTORY loop when at center
              outcome === "won"
                ? "defeat"
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
        className="absolute left-8 bottom-8 sm:left-16 sm:bottom-12"
        style={{
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
            state={
              // Cinematic staging (matches boss above):
              // - lost → persona LOSES → DEFEAT clip during defeat stage
              //          then held while faded out
              // - won  → persona WINS → wait through defeat stage in idle,
              //          then VICTORY loop when at center
              outcome === "lost"
                ? "defeat"
                : outcome === "won"
                  ? cinematicStage === "cheer"
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
  const endX = -(frameCount * frameWidth * scale);
  const keyframes = `@keyframes ${animId} {
    from { background-position-x: 0px; }
    to   { background-position-x: ${endX}px; }
  }`;

  // `holdLast`: for TERMINAL one-shots (defeat / victory) we want the
  // final frame to persist. For TRANSIENT one-shots (attack / hurt) we
  // do NOT want to sit on the last frame — Pixellab's last hurt frame
  // is a hunched / knelt pose that reads as "defeated". `holdLast` is
  // wired through the persona/boss sprite wrappers and defaults to
  // true for backward compat.
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
          animationName: animId,
          animationDuration: `${durationMs}ms`,
          animationTimingFunction: `steps(${frameCount})`,
          animationIterationCount: loop ? "infinite" : 1,
          animationFillMode: holdLast ? "forwards" : "none",
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
}: {
  personaId: PersonaId;
  state: PersonaAnimState;
  onStateComplete?: () => void;
  displayWidth?: number;
}) {
  // Look up the persona's extended config to get the correct frame size,
  // frame count, and per-clip fps. Falls back to alchemist's 88×88 x9 if
  // extended is missing (shouldn't happen for the 8 real personas but
  // keeps the code defensive).
  const persona = getPersona(personaId);
  const ext = persona.extended;
  const frameWidth = ext?.frameWidth ?? 88;
  const frameHeight = ext?.frameHeight ?? 88;
  const frameCount = ext?.idleFrames ?? 9;
  const idleFps = ext?.idleFps ?? 6;
  const combatFps = ext?.combatFps ?? 8;
  // If the persona is missing this clip (Oracle etc.), fall back to
  // idle so we never load a 404 sheet.
  const resolvedState: PersonaAnimState = ext?.missingClips?.includes(state as never)
    ? "idle"
    : state;
  const sheet = `/assets/personas/${personaId}/${resolvedState}.png`;
  const isLoop = resolvedState === "idle" || resolvedState === "victory";
  // Only terminal (defeat / victory) clips freeze on the last frame —
  // attack and hurt release so the sprite doesn't sit on its knelt /
  // hunched recoil pose and read as "defeated".
  const holdLast = state === "defeat" || state === "victory";
  return (
    <AnimatedSpritesheet
      key={`${personaId}:${state}`}
      sheetUrl={sheet}
      frameCount={frameCount}
      frameWidth={frameWidth}
      frameHeight={frameHeight}
      displayWidth={displayWidth}
      fps={state === "idle" || state === "victory" ? idleFps : combatFps}
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
}: {
  bossAsset: string;
  state?: BossAnimState;
  onStateComplete?: () => void;
}) {
  const SPRITESHEET_BOSSES: readonly {
    /** Substring match against the boss's `idleAsset` path. */
    match: string;
    /** Folder that hosts the other state sheets (idle/attack/hurt/…). */
    folder: string;
    frames: number;
    frameWidth: number;
    frameHeight: number;
    /** Available state clips in this folder. Fallback to idle otherwise. */
    states: readonly BossAnimState[];
  }[] = [
    {
      match: "/bosses/village/fog/idle.png",
      folder: "/assets/bosses/village/fog",
      frames: 9,
      frameWidth: 92,
      frameHeight: 92,
      states: ["idle", "attack", "hurt", "defeat", "victory"],
    },
    {
      match: "/bosses/village/chimera/idle.png",
      folder: "/assets/bosses/village/chimera",
      frames: 9,
      frameWidth: 92,
      frameHeight: 92,
      // Chimera has idle/attack/hurt; missing clips fall back to idle
      // via the useState_ resolver in BossSpriteFromAsset.
      states: ["idle", "attack", "hurt"],
    },
    {
      match: "/bosses/village/automaton/idle.png",
      folder: "/assets/bosses/village/automaton",
      frames: 9,
      frameWidth: 92,
      frameHeight: 92,
      states: ["idle", "attack", "hurt", "victory"],
    },
    {
      match: "/bosses/village/wraith/idle.png",
      folder: "/assets/bosses/village/wraith",
      frames: 9,
      frameWidth: 92,
      frameHeight: 92,
      states: ["idle", "attack", "hurt", "victory"],
    },
  ];
  const sheetDef = SPRITESHEET_BOSSES.find((s) => bossAsset.includes(s.match));
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
  // Resolve the sheet URL for this state; fall back to idle if the state's
  // sheet isn't available for this boss.
  const useState_: BossAnimState = sheetDef.states.includes(state)
    ? state
    : "idle";
  const sheetUrl = `${sheetDef.folder}/${useState_}.png`;
  const isLoop = useState_ === "idle" || useState_ === "victory";
  // Terminal (defeat / victory) clips freeze on their last frame.
  // Transient combat clips (attack / hurt) release so the boss
  // doesn't sit on its recoil / stunned pose and read as "defeated".
  const holdLast = useState_ === "defeat" || useState_ === "victory";
  return (
    <AnimatedSpritesheet
      key={useState_}
      sheetUrl={sheetUrl}
      frameCount={sheetDef.frames}
      frameWidth={sheetDef.frameWidth}
      frameHeight={sheetDef.frameHeight}
      displayWidth={300}
      // 7fps for boss combat clips (~1.3s per attack/hurt/defeat/victory).
      // Slower on the boss than the persona because the boss is larger
      // and the pixel-art recoil reads better at a slightly gentler cadence.
      fps={useState_ === "idle" || useState_ === "victory" ? 6 : 7}
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
        duration:
          bossReaction === "crit"
            ? 0.7
            : bossReaction === "counter"
              ? 0.55
              : bossReaction === "block"
                ? 0.6
                : 0.5,
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
