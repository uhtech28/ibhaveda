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

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CombatRing } from "./CombatRing";
import { HPBar } from "./HPBar";
import { useKeystrokeTelemetry } from "@/lib/hooks/useKeystrokeTelemetry";
import type {
  CombatCurrentQuestion,
  KeystrokeTelemetry,
} from "@/lib/combat/types";

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

    if (bossDelta > 0) {
      // Player landed a hit. Pick CRIT if delta >= 20% of initial HP.
      const critThreshold = bossHpInitial * 0.2;
      const kind: ReactionKind = bossDelta >= critThreshold ? "crit" : "hit";
      setBossReaction(kind);
      setBossDamage(Math.round(bossDelta));
      if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current);
      reactionTimerRef.current = setTimeout(
        () => setBossReaction("idle"),
        kind === "crit" ? 900 : 700,
      );
      if (damageNumberTimerRef.current) clearTimeout(damageNumberTimerRef.current);
      damageNumberTimerRef.current = setTimeout(
        () => setBossDamage(null),
        1100,
      );
    } else if (playerDelta > 0) {
      // Boss counter-attacked. Show player damage flash + boss "counter" pose.
      setBossReaction("counter");
      setPlayerHurt(true);
      setPlayerDamage(Math.round(playerDelta));
      if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current);
      reactionTimerRef.current = setTimeout(
        () => setBossReaction("idle"),
        700,
      );
      if (playerHurtTimerRef.current) clearTimeout(playerHurtTimerRef.current);
      playerHurtTimerRef.current = setTimeout(
        () => setPlayerHurt(false),
        500,
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
    };
  }, []);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    reset();
    setValue("");
    valueRef.current = "";
  }, [question._id, reset]);

  const handleSubmitClick = useCallback(() => {
    if (isLocked) return;
    onSubmit(valueRef.current, snapshot());
  }, [isLocked, onSubmit, snapshot]);

  const handleExpire = useCallback(() => {
    onExpire(valueRef.current, snapshot());
  }, [onExpire, snapshot]);

  const onKeyDownComposite = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      handlers.onKeyDown(e);
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !isLocked) {
        e.preventDefault();
        handleSubmitClick();
      }
    },
    [handlers, isLocked, handleSubmitClick],
  );

  return (
    <div className="relative w-full">
      {/* Full-panel red flash when the player takes damage (counter-attack). */}
      <AnimatePresence>
        {playerHurt && (
          <motion.div
            key="player-hurt"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.55, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, times: [0, 0.25, 1] }}
            className="pointer-events-none absolute -inset-2 z-30 bg-red-500/40 mix-blend-overlay"
          />
        )}
      </AnimatePresence>

      {/* Title bar — matches the "RETLIFY: BOSS CHALLENGE" header in the mockup. */}
      <div className="mb-4 flex items-center gap-2 border-2 border-emerald-400 bg-black px-4 py-2">
        <span className="text-base text-emerald-400">📍</span>
        <span
          className="font-mono text-sm font-black uppercase tracking-widest text-emerald-300"
          style={{ fontFamily: "var(--font-pixel-display), monospace" }}
        >
          RETLIFY:&nbsp;&nbsp;BOSS CHALLENGE
        </span>
      </div>

      {/* Main 2-column layout: arena + sidebar */}
      <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
        {/* ── LEFT COLUMN — arena + dialogue + actions ── */}
        <div className="flex flex-col gap-3">
          {/* HP cards row */}
          <motion.div
            className="grid grid-cols-2 gap-3"
            animate={
              playerHurt
                ? { x: [0, -6, 6, -4, 4, 0] }
                : { x: 0 }
            }
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <HpCard
              role="player"
              label="You"
              sub="Lv 1"
              current={playerHpCurrent}
              initial={playerHpInitial}
            />
            <HpCard
              role="boss"
              label="Doubt Imp"
              sub={
                question.persona === "villain" ? "The Skeptic" : "The Mentor"
              }
              current={bossHpCurrent}
              initial={bossHpInitial}
            />
          </motion.div>

          {/* Battle scene */}
          <BattleScene
            persona={question.persona}
            bossReaction={bossReaction}
            playerHurt={playerHurt}
          />

          {/* Question count chip above dialogue */}
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-white/60">
            <span>
              Question {questionsAnsweredCount + 1} / {totalQuestions}
            </span>
            <PersonaChip persona={question.persona} />
          </div>

          {/* Dialogue box */}
          <ReactiveDialogueShell
            bossReaction={bossReaction}
            bossDamage={bossDamage}
            playerDamage={playerDamage}
          >
            <DialoguePanel persona={question.persona} prompt={question.prompt} />
          </ReactiveDialogueShell>

          {/* Answer textarea */}
          <textarea
            aria-label="Your answer"
            className="min-h-[120px] w-full resize-y border-2 border-white/30 bg-black p-3 font-mono text-sm leading-relaxed text-white outline-none focus:border-white disabled:opacity-60"
            placeholder="Type your answer to defeat the boss…"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onPaste={handlers.onPaste}
            onKeyDown={onKeyDownComposite}
            disabled={isLocked}
            spellCheck={false}
          />

          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-white/40">
              Cmd/Ctrl + Enter to submit
            </span>
            <button
              type="button"
              onClick={handleSubmitClick}
              disabled={isLocked}
              className="border-2 border-white bg-black px-6 py-2 font-mono text-xs uppercase tracking-wider text-white transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
              style={{ fontFamily: "var(--font-pixel-display), monospace" }}
            >
              Submit Answer
            </button>
          </div>
        </div>

        {/* ── RIGHT COLUMN — sidebar with objective, score, timer, answer preview ── */}
        <aside className="flex flex-col gap-3">
          <SidebarSection title="Objective" color="rose">
            <p className="text-xs leading-relaxed text-white/85">
              Defeat the boss by validating your startup answer with concrete,
              specific reasoning.
            </p>
          </SidebarSection>

          <SidebarSection title="Damage Dealt" color="amber">
            <div className="flex items-baseline gap-2">
              <span className="text-amber-300">⚔</span>
              <span
                className="font-mono text-2xl font-black text-emerald-300"
                style={{ fontFamily: "var(--font-pixel-display), monospace" }}
              >
                {Math.max(0, bossHpInitial - bossHpCurrent)}
              </span>
              <span className="font-mono text-xs text-white/60">
                / {bossHpInitial}
              </span>
            </div>
          </SidebarSection>

          <SidebarSection title="Time Left" color="rose">
            <div className="flex items-center justify-center">
              <CombatRing
                servedAt={question.servedAt}
                durationMs={question.durationMs}
                onExpire={handleExpire}
                size={88}
                strokeWidth={6}
              />
            </div>
          </SidebarSection>

        </aside>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Sub-components for the mockup layout
// ─────────────────────────────────────────────────────────────────────

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
}: {
  persona: "villain" | "mentor";
  prompt: string;
}) {
  const typedPrompt = useTypewriter(prompt, 22); // ~45 chars per second
  const isTyping = typedPrompt.length < prompt.length;
  return (
    <div
      className="flex items-start gap-4 border-2 border-white bg-black p-4"
    >
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
function BattleScene({
  persona,
  bossReaction,
  playerHurt,
}: {
  persona: "villain" | "mentor";
  bossReaction: "idle" | "hit" | "crit" | "counter" | "block";
  playerHurt: boolean;
}) {
  return (
    <div
      className="relative h-56 w-full overflow-hidden border-2 border-white"
      style={{ imageRendering: "pixelated" }}
    >
      <BiomeBackdrop />

      {/* Boss sprite — right side, faces left */}
      <motion.div
        className="absolute right-12 top-1/2 -translate-y-1/2"
        animate={
          bossReaction === "hit"
            ? { x: [0, -8, 8, -4, 4, 0], filter: ["brightness(1)", "brightness(1.6)", "brightness(1)"] }
            : bossReaction === "crit"
              ? {
                  x: [0, -14, 14, -10, 10, 0],
                  rotate: [0, -5, 5, -3, 3, 0],
                  scale: [1, 1.1, 1],
                  filter: ["brightness(1)", "brightness(2) drop-shadow(0 0 18px #fb7185)", "brightness(1)"],
                }
              : bossReaction === "counter"
                ? {
                    x: [0, -28, -8, -16],
                    filter: ["brightness(1)", "brightness(1.5) drop-shadow(0 0 12px #ef4444)", "brightness(1)"],
                  }
                : bossReaction === "block"
                  ? {
                      x: [0, -2, 2, 0],
                      filter: ["brightness(1)", "brightness(0.8) drop-shadow(0 0 12px #60a5fa)", "brightness(1)"],
                    }
                  : { y: [0, -3, 0] }
        }
        transition={
          bossReaction === "idle"
            ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
            : { duration: bossReaction === "crit" ? 0.7 : 0.55, ease: "easeOut" }
        }
      >
        <BossSprite persona={persona} />
      </motion.div>

      {/* Player character sprite — left side, faces right.
          When the boss takes damage (HIT/CRIT), the player lunges
          forward to "attack" so the damage looks earned. When the
          player takes damage (COUNTER), the player flinches red and
          shakes. */}
      <motion.div
        className="absolute left-12 bottom-6"
        animate={
          playerHurt
            ? {
                x: [0, -4, 4, -2, 2, 0],
                filter: [
                  "brightness(1)",
                  "brightness(0.5) hue-rotate(320deg)",
                  "brightness(1)",
                ],
              }
            : bossReaction === "crit"
              ? {
                  // Big lunge forward for a critical hit.
                  x: [0, 60, 80, 30, 0],
                  y: [0, -8, -4, 0, 0],
                  scale: [1, 1.12, 1.08, 1, 1],
                  rotate: [0, 4, 2, 0, 0],
                  filter: [
                    "brightness(1)",
                    "brightness(1.5) drop-shadow(0 0 8px #fde047)",
                    "brightness(1.2)",
                    "brightness(1)",
                    "brightness(1)",
                  ],
                }
              : bossReaction === "hit"
                ? {
                    // Standard hit — short forward lunge.
                    x: [0, 30, 40, 10, 0],
                    y: [0, -4, 0, 0, 0],
                    scale: [1, 1.06, 1.04, 1, 1],
                    filter: [
                      "brightness(1)",
                      "brightness(1.3)",
                      "brightness(1)",
                      "brightness(1)",
                      "brightness(1)",
                    ],
                  }
                : bossReaction === "block"
                  ? {
                      // Parry stance — small step forward, then back.
                      x: [0, 12, -2, 0],
                      filter: [
                        "brightness(1)",
                        "brightness(1.1) drop-shadow(0 0 6px #60a5fa)",
                        "brightness(1)",
                      ],
                    }
                  : { y: [0, -2, 0] }
        }
        transition={
          playerHurt
            ? { duration: 0.45, ease: "easeOut" }
            : bossReaction === "crit"
              ? { duration: 0.75, ease: "easeOut" }
              : bossReaction === "hit"
                ? { duration: 0.55, ease: "easeOut" }
                : bossReaction === "block"
                  ? { duration: 0.5, ease: "easeOut" }
                  : { duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.4 }
        }
      >
        <PlayerSprite />
      </motion.div>

      {/* Slash effect — appears between player and boss during attacks */}
      <AnimatePresence>
        {(bossReaction === "hit" || bossReaction === "crit") && (
          <motion.div
            key={`slash-${bossReaction}`}
            initial={{ opacity: 0, scale: 0.5, x: 120 }}
            animate={{
              opacity: [0, 1, 0],
              scale: bossReaction === "crit" ? [0.5, 2, 2.5] : [0.5, 1.4, 1.6],
              x: [120, 200, 240],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-3xl font-black"
            style={{
              filter: bossReaction === "crit"
                ? "drop-shadow(0 0 16px #fde047) drop-shadow(0 0 8px #fb7185)"
                : "drop-shadow(0 0 10px #fbbf24)",
              color: bossReaction === "crit" ? "#fde047" : "#fbbf24",
            }}
            aria-hidden
          >
            ⚔
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

      {/* Floating damage / counter labels */}
      <AnimatePresence>
        {bossDamage !== null && (bossReaction === "hit" || bossReaction === "crit") && (
          <motion.span
            key={`dmg-${bossDamage}-${bossReaction}`}
            initial={{ opacity: 0, y: 0, scale: 0.6 }}
            animate={{
              opacity: 1,
              y: -42,
              scale: bossReaction === "crit" ? 1.6 : 1.2,
            }}
            exit={{ opacity: 0, y: -56 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className={`pointer-events-none absolute left-16 top-2 z-20 font-mono font-black ${
              bossReaction === "crit"
                ? "text-base text-rose-300 drop-shadow-[0_0_12px_#fb7185]"
                : "text-sm text-amber-300 drop-shadow-[0_0_8px_#fbbf24]"
            }`}
          >
            -{bossDamage}{bossReaction === "crit" ? "!!" : ""}
          </motion.span>
        )}

        {bossReaction === "counter" && playerDamage !== null && (
          <motion.span
            key={`counter-${playerDamage}`}
            initial={{ opacity: 0, scale: 0.6, x: 0 }}
            animate={{ opacity: 1, scale: 1.2, x: 32 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="pointer-events-none absolute left-16 top-2 z-20 text-xs font-black font-mono text-red-400 tracking-widest drop-shadow-[0_0_6px_#ef4444]"
          >
            COUNTER! -{playerDamage}
          </motion.span>
        )}

        {bossReaction === "block" && (
          <motion.span
            key="block-label"
            initial={{ opacity: 0, scale: 0.7, y: 0 }}
            animate={{ opacity: 1, scale: 1.1, y: -22 }}
            exit={{ opacity: 0, y: -34 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
            className="pointer-events-none absolute left-16 top-2 z-20 text-xs font-black font-mono text-sky-300 tracking-widest drop-shadow-[0_0_8px_#60a5fa]"
          >
            BLOCK
          </motion.span>
        )}
      </AnimatePresence>

      {/* Block sparks — two cool-blue glints when both sides parry. */}
      <AnimatePresence>
        {bossReaction === "block" && (
          <>
            {[0, 1].map((i) => (
              <motion.span
                key={`block-spark-${i}`}
                initial={{ opacity: 0, scale: 0.5, x: 0, y: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0.5, 1.2, 0.4],
                  x: i === 0 ? -22 : 22,
                  y: -12,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.08 }}
                className="pointer-events-none absolute left-1/2 top-1/2 z-20 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-300 shadow-[0_0_10px_#60a5fa]"
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
