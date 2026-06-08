"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { audioManager } from "@/lib/audio/audioManager";
import { Shield, Gem, Trophy, Coins, Flame, Check, X, ArrowRight, ArrowLeft, TrendingUp } from "lucide-react";

interface InterCheckpointOverlayProps {
  isOpen: boolean;
  events: Array<"henchman" | "treasure" | "shield" | "insight" | "clear">;
  templateId: "venture" | "academic" | "lab" | "creative";
  stage: number;
  checkpoint: number;
  ventureId: Id<"ventures">;
  checkpointId?: Id<"ventureCheckpoints">;
  onComplete: () => void;
  onClose: () => void;
  // Boss combat gate props (mandatory combat at every checkpoint)
  isBossCombat?: boolean;
  isLastCheckpointInStage?: boolean;
  isGoldCheckpoint?: boolean;
  onBossVictory?: () => void;
  onBossSkip?: () => void;
  onBossRetreat?: () => void;
}

const HENCHMAN_THEMES: Record<string, Record<number, { name: string; represents: string; intro: string; victory: string; retreat: string; icon: string }>> = {
  venture: {
    1: { name: "Doubt Imp", represents: "Vague doubts about the idea", intro: "A small shadow imp blocks your path, whispering doubts about your concept.", victory: "You banished the imp of doubt!", retreat: "The imp slipped away into the shadows.", icon: "😈" },
    2: { name: "Biased Survey", represents: "Self-fulfilling user feedback", intro: "A mirage of biased surveys appears, promising false validation.", victory: "You dissolved the false validation!", retreat: "The survey skewed your perspective.", icon: "📊" },
    3: { name: "Comforting Lie", represents: "Ignoring real feedback", intro: "A smiling figure offers you a warm, comforting lie about your progress.", victory: "You shattered the illusion with truth!", retreat: "You accepted the comforting lie.", icon: "🤥" },
    4: { name: "Unfinished Spec", represents: "Half-baked offer designs", intro: "An unfinished scroll of specifications begins to unravel around you.", victory: "You neatly organized the specifications!", retreat: "You got tangled in the specs.", icon: "📜" },
    5: { name: "Scope Creep Sprout", represents: "Adding unnecessary features", intro: "A rapidly growing sprout of feature requests blocks the trail.", victory: "You pruned the scope creep successfully!", retreat: "The scope creep grew out of control.", icon: "🌱" },
    6: { name: "Hesitant Whisper", represents: "Fear of launching", intro: "A chilling whisper warns you that you are not ready to launch.", victory: "You ignored the whisper and pushed forward!", retreat: "The hesitation slowed your momentum.", icon: "🤫" },
    7: { name: "Stagnant Loop", represents: "Refusing to adapt", intro: "A closed loop of repetitive iteration traps your movement.", victory: "You broke the loop with a pivot!", retreat: "You remained stuck in the loop.", icon: "🔄" },
    8: { name: "Chaos Gremlin", represents: "Scaling issues", intro: "A chaotic gremlin starts disconnecting your scaling systems.", victory: "You stabilized the scaling systems!", retreat: "The gremlin caused database drift.", icon: "👾" },
  },
  academic: {
    1: { name: "Lost Premise", represents: "Fuzzy research goals", intro: "A floating scroll with a faded, contradictory premise appears.", victory: "You refined the research question into clarity!", retreat: "You wandered down a theoretical dead end.", icon: "📜" },
    2: { name: "Plagiarism Sprite", represents: "Poor citation habits", intro: "A sprite of copied text attempts to steal your original thoughts.", victory: "You documented every source meticulously!", retreat: "You copy-pasted without proper context.", icon: "📝" },
    3: { name: "Uncalibrated Sensor", represents: "Flawed methodology", intro: "A ticking device clicks erratically, producing noisy data.", victory: "You calibrated the research instruments!", retreat: "Your data was corrupted by noise.", icon: "⚙️" },
    4: { name: "Typo Imp", represents: "Spelling and grammar block", intro: "A small creature is rearranging your draft's letters.", victory: "You polished the prose to perfection!", retreat: "The draft was riddled with typos.", icon: "✍️" },
    5: { name: "Pedantic Reviewer", represents: "Hyper-critical reviews", intro: "A spectral figure demands an explanation for your third citation.", victory: "You addressed the peer review with confidence!", retreat: "The critique made you doubt your work.", icon: "🕵️" },
    6: { name: "Formatting Error", represents: "Rejection by style guides", intro: "A wall of strict margins and citation styles blocks your submission.", victory: "You aligned the paper to the style guide!", retreat: "The submission was formatted incorrectly.", icon: "📐" },
  },
  lab: {
    1: { name: "Outlier Data", represents: "Skewed test results", intro: "A rogue data point is inflating your averages.", victory: "You filtered the outlier with sound logic!", retreat: "The outlier skewed the hypothesis.", icon: "📈" },
    2: { name: "Confounding Variable", represents: "Uncontrolled external factors", intro: "An unexpected variable sneaks into your experimental design.", victory: "You controlled for all confounding factors!", retreat: "The external factor polluted the results.", icon: "🧪" },
    3: { name: "Spilled Sample", represents: "Accidental loss of material", intro: "A vial of liquid is tipping over the edge of the desk.", victory: "You caught the sample before it spilled!", retreat: "The experiment was delayed by a spill.", icon: "🧪" },
    4: { name: "Spurious Correlation", represents: "False associations", intro: "A chart claims that ice cream sales cause forest fires.", victory: "You disproved the spurious correlation!", retreat: "You mistook correlation for causation.", icon: "📊" },
    5: { name: "Confirmation Bias", represents: "Ignoring negative results", intro: "A mirror shows you only the data points you wanted to see.", victory: "You embraced the negative results!", retreat: "You fell for the confirmation bias.", icon: "🪞" },
    6: { name: "Unsaved Draft", represents: "Hardware failure", intro: "The computer terminal flickers and threatens to shut down.", victory: "You saved and backed up the research log!", retreat: "You lost the last hour of records.", icon: "💻" },
    7: { name: "Corrupted Log", represents: "Replication failure", intro: "A digital block of code is scrambled and unreadable.", victory: "You recovered the experimental steps!", retreat: "The experiment was unreplicable.", icon: "💾" },
  },
  creative: {
    1: { name: "Creative Block", represents: "No inspiration", intro: "A grey, featureless monolith blocks all creative flow.", victory: "You smashed the block with a spark of genius!", retreat: "The blank page stared back at you.", icon: "🧱" },
    2: { name: "Scribble Sprite", represents: "Messy draft lines", intro: "A sprite of chaotic ink scribbles over your draft layout.", victory: "You refined the sketch into clean lines!", retreat: "The canvas became a muddy mess.", icon: "🎨" },
    3: { name: "Out of Tune Note", represents: "Clashing elements", intro: "A screeching sound wave disrupts your composition.", victory: "You tuned the harmonies into alignment!", retreat: "The chord remained dissonant.", icon: "🎵" },
    4: { name: "Muted Color", represents: "Lack of visual contrast", intro: "A grey mist settles over your painting, draining its color.", victory: "You boosted the vibrancy and contrast!", retreat: "The artwork felt flat and uninspired.", icon: "🖌️" },
    5: { name: "Empty Gallery", represents: "Fear of showing work", intro: "A silent gallery with empty frames makes you hesitate.", victory: "You hung your work with pride!", retreat: "You hid the pieces in the back room.", icon: "🖼️" },
    6: { name: "Pirate Copy", represents: "Derivative works", intro: "A shadowy copycat is mimicking your style.", victory: "You proved your unique creative voice!", retreat: "Your work felt derivative.", icon: "👥" },
  },
};

const TEMPLATE_THEMES: Record<string, { primary: string; border: string; bg: string; text: string }> = {
  venture: { primary: "#6366f1", border: "border-indigo-500/30", bg: "from-indigo-950/40 to-slate-950/80", text: "text-indigo-400" },
  academic: { primary: "#d4a853", border: "border-amber-500/30", bg: "from-amber-950/40 to-stone-950/80", text: "text-amber-400" },
  lab: { primary: "#06d6a0", border: "border-emerald-500/30", bg: "from-emerald-950/40 to-zinc-950/80", text: "text-emerald-400" },
  creative: { primary: "#ffd166", border: "border-yellow-500/30", bg: "from-yellow-950/40 to-neutral-950/80", text: "text-yellow-400" },
};

const BOSS_CHALLENGE_QUESTIONS: Record<string, Record<number, string>> = {
  venture: {
    1: "How will you validate your startup idea to overcome doubts from users and investors?",
    2: "How will you ask unbiased, open-ended questions to avoid false validation from early testers?",
    3: "What metric or hard feedback will you track to keep yourself honest about your product's actual usage?",
    4: "What is the absolute core feature that must be working in your MVP specs before building?",
    5: "If you had to launch your product with only one button, what would that button do?",
    6: "What is the exact launch date you are committing to, and what is your plan if things break?",
    7: "If your primary value proposition fails, how would you pivot to capture an adjacent market?",
    8: "How will you design your systems or operations to support a 10x surge in active users?",
  },
  academic: {
    1: "How will you formulate a precise research question to clarify your faded thesis premise?",
    2: "Explain why rigorous citations are important to maintain scientific integrity in your research.",
    3: "What control group or calibration protocol will you set up to isolate noisy measurements?",
    4: "State three stylistic proofreading habits you will adopt to eliminate typos from your draft.",
    5: "How will you objectively incorporate peer criticisms to refine your thesis arguments?",
    6: "Outline your plan to format your paper correctly according to strict publishing guidelines.",
  },
  lab: {
    1: "Explain how you will mathematically justify identifying and filtering outlier data points.",
    2: "Describe the variable isolating methods you will employ to manage confounding variables.",
    3: "List two safety precautions you will practice to prevent accidental liquid spillages in the lab.",
    4: "How do you systematically distinguish correlation from direct causal links in test results?",
    5: "Explain why seeking contradictory evidence is crucial to bypass human confirmation bias.",
    6: "Describe your strategy for automated local backups to secure active laboratory draft files.",
    7: "What documentation standard will you use to make your experiments fully replicable?",
  },
  creative: {
    1: "What warm-up exercise will you practice to break through visual or narrative creative block?",
    2: "Explain your method for translating quick sketch guidelines into clean, final illustration inks.",
    3: "How do you resolve clashing harmonic key shifts or color palettes in your creative pieces?",
    4: "Describe your plan to improve color contrast and focus viewer attention in low-vibrancy zones.",
    5: "How will you conquer the fear of public exhibition and present your creations confidently?",
    6: "How do you protect your intellectual property while staying open to collaborative feedback?",
  }
};

function getBossChallengeQuestion(template: string, stageNum: number): string {
  const tMap = BOSS_CHALLENGE_QUESTIONS[template] || BOSS_CHALLENGE_QUESTIONS.venture;
  return tMap[stageNum] || "How will you ensure your venture maintains high quality and adapts to new challenges?";
}

export function InterCheckpointOverlay({
  isOpen,
  events,
  templateId,
  stage,
  checkpoint,
  ventureId,
  checkpointId,
  onComplete,
  onClose,
  isBossCombat = false,
  isLastCheckpointInStage = false,
  isGoldCheckpoint = false,
  onBossVictory,
  onBossSkip,
  onBossRetreat,
}: InterCheckpointOverlayProps) {
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  // Boss combat goes straight to action phase (mandatory — no intro choice)
  const [phase, setPhase] = useState<"intro" | "action" | "result">(isBossCombat ? "action" : "intro");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Q/A Boss Challenge state
  const [timeLeft, setTimeLeft] = useState(90);
  const [answer, setAnswer] = useState("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ── Combat animation choreography ────────────────────────────────────────
  // Full reaction set mirrors the Phaser MiniBoss vocabulary plus the
  // counter-attack / damage / victory / defeat sequences that wrap
  // around the per-hit reactions.
  //
  // bossReaction         — short reaction on the boss icon (hit, crit, etc)
  // sequencePhase        — full-screen choreography (victory burst, defeat fade)
  // playerDamageFlash    — full-panel red flash for damage feedback
  type BossReactionKind =
    | "idle"
    | "hit"
    | "block"
    | "crit"
    | "counter"
    | "victory"
    | "defeated";
  type SequencePhase =
    | "idle"
    | "victory_burst"
    | "defeat_fade";

  const [bossReaction, setBossReaction] = useState<BossReactionKind>("idle");
  const [sequencePhase, setSequencePhase] = useState<SequencePhase>("idle");
  const [playerDamageFlash, setPlayerDamageFlash] = useState(false);
  const [damageNumber, setDamageNumber] = useState<number | null>(null);

  const reactionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sequenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const damageFlashTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerBossReaction = (
    kind: Exclude<BossReactionKind, "idle">,
    durationMs = 700,
  ) => {
    setBossReaction(kind);
    if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current);
    reactionTimerRef.current = setTimeout(
      () => setBossReaction("idle"),
      durationMs,
    );
  };

  /** Briefly flash a damage number above the boss icon. */
  const showDamageNumber = (amount: number, durationMs = 900) => {
    setDamageNumber(amount);
    if (damageFlashTimerRef.current) clearTimeout(damageFlashTimerRef.current);
    damageFlashTimerRef.current = setTimeout(
      () => setDamageNumber(null),
      durationMs,
    );
  };

  /** Trigger the full-panel red flash for player damage feedback. */
  const triggerPlayerDamage = (durationMs = 450) => {
    setPlayerDamageFlash(true);
    setTimeout(() => setPlayerDamageFlash(false), durationMs);
  };

  /** Multi-stage victory sequence: hit → boss falls → victory burst. */
  const playVictorySequence = (hitKind: "hit" | "crit", damage: number) => {
    triggerBossReaction(hitKind, 700);
    showDamageNumber(damage, 900);
    if (sequenceTimerRef.current) clearTimeout(sequenceTimerRef.current);
    sequenceTimerRef.current = setTimeout(() => {
      setBossReaction("victory");
      setSequencePhase("victory_burst");
      if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current);
      reactionTimerRef.current = setTimeout(() => {
        setBossReaction("idle");
        setSequencePhase("idle");
      }, 1100);
    }, 650);
  };

  /** Multi-stage defeat sequence: counter → player damage → defeat fade. */
  const playDefeatSequence = () => {
    triggerBossReaction("counter", 550);
    if (sequenceTimerRef.current) clearTimeout(sequenceTimerRef.current);
    sequenceTimerRef.current = setTimeout(() => {
      triggerPlayerDamage(500);
      setBossReaction("defeated");
      setSequencePhase("defeat_fade");
      if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current);
      reactionTimerRef.current = setTimeout(() => {
        setBossReaction("idle");
        setSequencePhase("idle");
      }, 1200);
    }, 500);
  };
  const onBossVictoryRef = useRef(onBossVictory);
  const onBossSkipRef = useRef(onBossSkip);

  useEffect(() => {
    onBossVictoryRef.current = onBossVictory;
    onBossSkipRef.current = onBossSkip;
  }, [onBossVictory, onBossSkip]);

  // Result state
  const [resultData, setResultData] = useState<{
    outcome: "victory" | "retreat" | "skipped" | "collected";
    xpEarned: number;
    corruptionReduction: number;
    goldDeducted?: number;
    message: string;
  } | null>(null);

  // Wallet and mutations
  const wallet = useQuery(api.gamification.getWallet);
  const walletBalance = wallet?.balance ?? 0;

  // User profile and level progress
  const currentUser = useQuery(api.users.getCurrentUser);
  const userLevel = useQuery(
    api.levels.getUserLevelProgress,
    currentUser?._id ? { userId: currentUser._id } : "skip"
  );
  const userScore = userLevel?.totalPoints ?? 0;

  // Venture/Project stage quality score
  const stageQuality = useQuery(
    api.aiScoring.getStageQualityScore,
    ventureId
      ? {
          ventureId,
          stageNumber: stage,
        }
      : "skip"
  );
  const projectScore = stageQuality?.totalScore ?? 0;

  // Per-checkpoint AI evaluation scores (sum of task evaluations in this checkpoint)
  const checkpointEvals = useQuery(
    api.aiScoring.getCheckpointEvaluationSummary,
    checkpointId ? { checkpointId } : "skip"
  );
  const checkpointScore = (() => {
    if (!checkpointEvals) return null;
    const evaluated = checkpointEvals.filter((e) => e.evaluation !== null);
    if (evaluated.length === 0) return null;
    const total = evaluated.reduce((sum, e) => sum + (e.evaluation?.totalScore ?? 0), 0);
    // Average per task so it stays within /12
    return total / evaluated.length;
  })();

  const resolveHenchman = useMutation(api.interCheckpoint.resolveHenchmanEncounter);
  const collectTreasure = useMutation(api.interCheckpoint.collectTreasureChest);
  const collectShield = useMutation(api.interCheckpoint.collectCorruptionShield);
  const collectInsight = useMutation(api.interCheckpoint.collectInsightFragment);

  const activeEvent = events[currentEventIndex] || "clear";
  const theme = TEMPLATE_THEMES[templateId] || TEMPLATE_THEMES.venture;

  // Get active henchman info
  const henchmanInfo = HENCHMAN_THEMES[templateId]?.[stage] ?? {
    name: "Corruptive Tendril",
    represents: "Doubt and stagnation",
    intro: "A dark anomaly blocks the bridge to the next checkpoint.",
    victory: "You cleared the anomaly!",
    retreat: "You backed off to formulate a better strategy.",
    icon: "👾",
  };

  const handleTimeout = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Player out of time → boss counter-attacks → player defeated.
    playDefeatSequence();

    setIsSubmitting(true);
    setError(null);

    try {
      audioManager.playUI("error");
      const res = await resolveHenchman({
        ventureId,
        stage,
        checkpoint,
        outcome: "retreat",
        henchmanName: henchmanInfo.name,
      });

      if (res) {
        setResultData({
          outcome: "retreat",
          xpEarned: res.xpEarned,
          corruptionReduction: res.corruptionReduction,
          message: `Time's up. The ${henchmanInfo.name} struck while you were still thinking. Try again with a sharper answer.`,
        });
        setPhase("result");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resolve encounter");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Run combat countdown timer loop
  useEffect(() => {
    if (activeEvent === "henchman" && phase === "action") {
      // 90 seconds (1.5 min) — enough time to think and write a meaningful
      // answer without making the encounter feel dragged out.
      setTimeLeft(90);
      setAnswer("");
      setError(null);

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [activeEvent, phase]);

  // Clean up reaction + sequence timers on unmount so stale setTimeouts
  // don't try to set state after the component is gone.
  useEffect(() => {
    return () => {
      if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current);
      if (sequenceTimerRef.current) clearTimeout(sequenceTimerRef.current);
      if (damageFlashTimerRef.current) clearTimeout(damageFlashTimerRef.current);
    };
  }, []);

  if (!isOpen || activeEvent === "clear") return null;

  const handleSubmitAnswer = async () => {
    if (!answer.trim() || answer.trim().length < 8) {
      setError("Please type a detailed answer (minimum 8 characters) to defeat the Boss!");
      return;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      audioManager.playUI("confirm");

      const res = await resolveHenchman({
        ventureId,
        stage,
        checkpoint,
        outcome: "victory",
        henchmanName: henchmanInfo.name,
        answerText: answer,
      });

      // Server-side anti-cheat caught an AI-generated submission.
      // Two outcomes: first strike → final warning. Second strike →
      // permanent account suspension (server already wrote the ban row).
      if (res && "aiDetected" in res && res.aiDetected) {
        playDefeatSequence();
        setResultData({
          outcome: "retreat",
          xpEarned: 0,
          corruptionReduction: 0,
          message: res.message,
        });
        setPhase("result");
        return;
      }

      if (res) {
        const answerWords = answer.trim().split(/\s+/).length;
        const relevance = Math.min(98, 72 + (answerWords * 2) + (timeLeft > 10 ? 8 : 4));
        const completeness = answer.trim().length > 35 ? "Exceptional" : "Proficient";
        const timeBonus = timeLeft * 10;

        // Reaction ladder mirrors MiniBoss reaction set:
        //   relevance >= 90  → critical strike → big victory burst
        //   relevance >= 80  → solid hit → standard victory burst
        //   relevance <  80  → blocked then counter-hit → still wins but shows struggle
        if (relevance >= 90) {
          // Damage is purely cosmetic — derived from the answer's
          // relevance + word count so the number on-screen feels
          // proportional to the strength of the answer.
          playVictorySequence("crit", Math.round(relevance + answerWords * 2));
        } else if (relevance >= 80) {
          playVictorySequence("hit", Math.round(relevance));
        } else {
          // Blocked first (boss parries), then player follows through.
          triggerBossReaction("block", 450);
          if (sequenceTimerRef.current) clearTimeout(sequenceTimerRef.current);
          sequenceTimerRef.current = setTimeout(() => {
            playVictorySequence("hit", Math.round(relevance));
          }, 480);
        }

        // Boss combat gate: determine victory message based on stage position
        const victoryMsg = isBossCombat
          ? isLastCheckpointInStage
            ? isGoldCheckpoint
              ? `⚔️ BOSS SLAIN!\n\nYou completed all tasks with gold mastery. The ${henchmanInfo.name} is destroyed for good!\n\n✏️ Answer: "${answer}"\n\n🎯 Relevance: ${relevance}% • ${completeness} • Time Bonus: +${timeBonus} Score`
              : `⚔️ BOSS DEFEATED!\n\nStage cleared — the ${henchmanInfo.name} retreats permanently from this stage!\n\n✏️ Answer: "${answer}"\n\n🎯 Relevance: ${relevance}% • ${completeness} • Time Bonus: +${timeBonus} Score`
            : `⚔️ BOSS RETREATS!\n\nYou forced the ${henchmanInfo.name} back to the stage boundary!\n\n✏️ Answer: "${answer}"\n\n🎯 Relevance: ${relevance}% • ${completeness} • Time Bonus: +${timeBonus} Score`
          : `Boss Defeated!\n\n✏️ Your Answer: "${answer}"\n\n🎯 AI Evaluation:\n• Relevance Score: ${relevance}%\n• Completion Standard: ${completeness}\n• Time Bonus: +${timeBonus} Score (${timeLeft}s remaining)`;

        setResultData({
          outcome: "victory",
          xpEarned: res.xpEarned + timeBonus,
          corruptionReduction: res.corruptionReduction,
          message: victoryMsg,
        });
        setPhase("result");
        if (isBossCombat) {
          window.setTimeout(() => onBossVictoryRef.current?.(), 320);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resolve encounter");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    if (walletBalance < 5) {
      audioManager.playUI("error");
      setError("Insufficient gold to skip this encounter");
      return;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      audioManager.playGoldGain();
      const res = await resolveHenchman({
        ventureId,
        stage,
        checkpoint,
        outcome: "skipped",
        henchmanName: henchmanInfo.name,
      });

      if (res) {
        setResultData({
          outcome: "skipped",
          xpEarned: res.xpEarned,
          corruptionReduction: res.corruptionReduction,
          goldDeducted: 5,
          message: isBossCombat
            ? `Paid 5 Gold to bypass the ${henchmanInfo.name}. The boss retreats — for now.`
            : `Paid 5 gold coins to slip past the ${henchmanInfo.name}.`,
        });
        setPhase("result");
        if (isBossCombat) {
          window.setTimeout(() => onBossSkipRef.current?.(), 280);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to skip encounter");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCollectTreasure = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      audioManager.playGoldGain();
      const res = await collectTreasure({
        ventureId,
        stage,
        checkpoint,
      });

      if (res) {
        setResultData({
          outcome: "collected",
          xpEarned: res.xpEarned,
          corruptionReduction: 0,
          message: res.alreadyCollected 
            ? "This chest has already been looted."
            : `You opened the ancient chest and discovered a burst of knowledge!`,
        });
        setPhase("result");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to collect chest");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCollectShield = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      audioManager.playUI("confirm");
      const res = await collectShield({
        ventureId,
        stage,
        checkpoint,
      });

      if (res) {
        setResultData({
          outcome: "collected",
          xpEarned: 0,
          corruptionReduction: 0,
          message: "Shield activated! It will absorb 50% of the next corruption wave.",
        });
        setPhase("result");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to collect shield");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCollectInsight = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      audioManager.playUI("confirm");
      const res = await collectInsight({
        ventureId,
        stage,
        checkpoint,
      });

      if (res) {
        setResultData({
          outcome: "collected",
          xpEarned: 30,
          corruptionReduction: 0,
          message: `Insight Fragment absorbed! Boss health reduced by 5%.`,
        });
        setPhase("result");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to collect insight");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    audioManager.playUI("click");
    // Boss combat gate: route to dedicated callbacks instead of onComplete
    if (isBossCombat && resultData) {
      if (resultData.outcome === "victory" && onBossVictory) { onBossVictory(); return; }
      if (resultData.outcome === "skipped" && onBossSkip) { onBossSkip(); return; }
    }
    if (currentEventIndex + 1 < events.length) {
      setCurrentEventIndex((prev) => prev + 1);
      setPhase("intro");
      setResultData(null);
      setError(null);
      setTimeLeft(20);
    } else {
      onComplete();
    }
  };

  return (
    <AnimatePresence>
      <div className={`fixed inset-0 z-[${isBossCombat ? 130 : 120}] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 8 }}
          transition={{ duration: 0.12, ease: "easeOut" }}
          className={`relative w-full max-w-lg overflow-hidden rounded-2xl border bg-gradient-to-b ${theme.bg} ${theme.border} p-6 shadow-2xl backdrop-blur-xl`}
        >
          {/* ── Full-panel choreography overlays ──────────────────────── */}
          {/* Player damage flash — red wash + brief shake on the dialog */}
          <AnimatePresence>
            {playerDamageFlash && (
              <motion.div
                key="player-damage"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.55, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, times: [0, 0.25, 1] }}
                className="pointer-events-none absolute inset-0 z-30 rounded-2xl bg-red-500 mix-blend-overlay"
              />
            )}
          </AnimatePresence>

          {/* Victory burst — green-gold radial flash + sparkles */}
          <AnimatePresence>
            {sequencePhase === "victory_burst" && (
              <>
                <motion.div
                  key="victory-flash"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: [0, 0.7, 0], scale: [0.6, 1.4, 1.6] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.05, ease: "easeOut" }}
                  className="pointer-events-none absolute inset-0 z-30 rounded-2xl"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(52,211,153,0.7) 0%, rgba(253,224,71,0.3) 40%, transparent 70%)",
                  }}
                />
                {/* Six radiating sparkle particles */}
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <motion.span
                    key={`spark-${i}`}
                    initial={{ opacity: 0, x: 0, y: 0, scale: 0.5 }}
                    animate={{
                      opacity: [0, 1, 0],
                      x: Math.cos((i * Math.PI) / 3) * 120,
                      y: Math.sin((i * Math.PI) / 3) * 120,
                      scale: [0.5, 1.2, 0.4],
                    }}
                    transition={{ duration: 0.95, ease: "easeOut" }}
                    className="pointer-events-none absolute left-1/2 top-1/2 z-30 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-200 shadow-[0_0_12px_#fde047]"
                  />
                ))}
              </>
            )}
          </AnimatePresence>

          {/* Defeat fade — heavy red vignette closing in from the edges */}
          <AnimatePresence>
            {sequencePhase === "defeat_fade" && (
              <motion.div
                key="defeat-vignette"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.75, 0.4] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.15, ease: "easeInOut" }}
                className="pointer-events-none absolute inset-0 z-30 rounded-2xl"
                style={{
                  background:
                    "radial-gradient(circle, transparent 30%, rgba(239,68,68,0.55) 90%)",
                }}
              />
            )}
          </AnimatePresence>

          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-6">
            <span className="text-xs font-bold uppercase tracking-widest text-white/40">
              {isBossCombat
                ? isLastCheckpointInStage
                  ? isGoldCheckpoint ? "⚔️ Final Boss — Gold Run" : "⚔️ Final Boss — Stage Clear"
                  : "⚔️ Boss Combat — Mid Stage"
                : `Passage Event ${currentEventIndex + 1} of ${events.length}`}
            </span>

          </div>

          {/* Event Content Switcher */}
          {activeEvent === "henchman" && (
            <div className="flex flex-col items-center text-center">
              {phase === "intro" && (
                <>
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                    className="text-6xl mb-4 select-none filter drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                  >
                    {henchmanInfo.icon}
                  </motion.div>
                  <h3 className="text-xl font-extrabold text-white mb-1">
                    Encounter: {henchmanInfo.name}
                  </h3>
                  <span className="text-xs font-semibold uppercase tracking-wider text-red-400 mb-4">
                    Represents: {henchmanInfo.represents}
                  </span>
                  <p className="text-sm text-gray-300 leading-relaxed mb-6">
                    {henchmanInfo.intro}
                  </p>

                  {/* Combat Stats Panel */}
                  <div className="flex justify-center gap-3 w-full mb-6">
                    <div className="p-2 px-4 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Project Score</span>
                      <span className="text-xs font-black text-emerald-400 mt-0.5">{Math.round(projectScore * 10) / 10}/12</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      audioManager.playUI("click");
                      setPhase("action");
                    }}
                    className="w-full py-3 rounded-xl font-bold bg-white text-black hover:bg-white/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <Flame className="w-4 h-4" /> Engage Boss
                  </button>
                </>
              )}

              {phase === "action" && (
                <div className="w-full flex flex-col items-stretch text-left">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 relative">
                      {/* Ambient aura ring — pulses behind the boss icon
                          so even the idle state has visible motion. */}
                      <motion.span
                        aria-hidden
                        className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-rose-500/20 blur-md"
                        animate={{
                          opacity: [0.35, 0.8, 0.35],
                          scale: [0.9, 1.15, 0.9],
                        }}
                        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                      />
                      {/* Two slow orbiting sparks for extra life signal */}
                      {[0, 1].map((i) => (
                        <motion.span
                          key={`spark-orbit-${i}`}
                          aria-hidden
                          className="pointer-events-none absolute left-3 top-1/2 h-1 w-1 rounded-full bg-amber-300 shadow-[0_0_6px_#fbbf24]"
                          animate={{
                            x: [
                              Math.cos(i * Math.PI) * 14,
                              Math.cos(i * Math.PI + Math.PI) * 14,
                              Math.cos(i * Math.PI + 2 * Math.PI) * 14,
                            ],
                            y: [
                              Math.sin(i * Math.PI) * 14,
                              Math.sin(i * Math.PI + Math.PI) * 14,
                              Math.sin(i * Math.PI + 2 * Math.PI) * 14,
                            ],
                            opacity: [0.4, 0.9, 0.4],
                          }}
                          transition={{
                            duration: 3 + i * 0.6,
                            repeat: Infinity,
                            ease: "linear",
                            delay: i * 0.5,
                          }}
                        />
                      ))}
                      <motion.span
                        className="text-2xl select-none inline-block relative z-10"
                        // Subtle idle breath + drop-shadow pulse — keeps
                        // the boss visually "alive" while the player is
                        // typing their answer. Suspends as soon as a
                        // reaction kicks in.
                        animate={
                          bossReaction === "idle"
                            ? {
                                y: [0, -3, 0],
                                scale: [1, 1.05, 1],
                                filter: [
                                  "drop-shadow(0 0 4px rgba(244,114,182,0.3))",
                                  "drop-shadow(0 0 10px rgba(244,114,182,0.55))",
                                  "drop-shadow(0 0 4px rgba(244,114,182,0.3))",
                                ],
                              }
                            : bossReaction === "hit"
                            ? {
                                x: [0, -6, 6, -4, 4, 0],
                                filter: ["brightness(1)", "brightness(1.6)", "brightness(1)"],
                              }
                            : bossReaction === "crit"
                              ? {
                                  x: [0, -10, 10, -8, 8, 0],
                                  rotate: [0, -8, 8, -6, 6, 0],
                                  scale: [1, 1.18, 1],
                                  filter: [
                                    "brightness(1)",
                                    "brightness(2) drop-shadow(0 0 12px #fb7185)",
                                    "brightness(1)",
                                  ],
                                }
                              : bossReaction === "block"
                                ? {
                                    x: [0, -2, 2, 0],
                                    filter: ["brightness(1)", "brightness(0.7)", "brightness(1)"],
                                  }
                                : bossReaction === "counter"
                                  ? {
                                      // Boss lunges to the right (toward player),
                                      // glowing red — classic counter-attack tell.
                                      x: [0, 18, -2, 0],
                                      scale: [1, 1.25, 1],
                                      filter: [
                                        "brightness(1)",
                                        "brightness(1.4) drop-shadow(0 0 8px #ef4444)",
                                        "brightness(1)",
                                      ],
                                    }
                                  : bossReaction === "victory"
                                    ? {
                                        // Boss is falling — slumps, rotates, fades.
                                        scale: [1, 1.1, 0.4],
                                        rotate: [0, 12, -90],
                                        opacity: [1, 1, 0],
                                        y: [0, 4, 18],
                                        filter: [
                                          "brightness(1)",
                                          "brightness(0.4)",
                                          "brightness(0.1)",
                                        ],
                                      }
                                    : bossReaction === "defeated"
                                      ? {
                                          // Boss roars in triumph — player got defeated.
                                          scale: [1, 1.35, 1.15],
                                          rotate: [0, -6, 6, 0],
                                          filter: [
                                            "brightness(1)",
                                            "brightness(1.8) drop-shadow(0 0 16px #ef4444)",
                                            "brightness(1.2)",
                                          ],
                                        }
                                      : { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1, filter: "brightness(1)" }
                        }
                        transition={
                          bossReaction === "idle"
                            ? {
                                // Idle breath loops forever at a calm cadence.
                                duration: 3,
                                ease: "easeInOut",
                                repeat: Infinity,
                              }
                            : {
                                duration:
                                  bossReaction === "victory"
                                    ? 1.1
                                    : bossReaction === "defeated"
                                      ? 0.9
                                      : bossReaction === "crit"
                                        ? 0.7
                                        : bossReaction === "counter"
                                          ? 0.55
                                          : 0.5,
                                ease: "easeOut",
                              }
                        }
                      >
                        {henchmanInfo.icon}

                        {/* Floating damage number — rises off the boss
                            with size and color tuned to the reaction.
                            Matches the Phaser MiniBoss damage-number cue. */}
                        <AnimatePresence>
                          {damageNumber !== null && (bossReaction === "hit" || bossReaction === "crit") && (
                            <motion.span
                              key={`dmg-${damageNumber}-${bossReaction}`}
                              initial={{ opacity: 0, y: 0, scale: 0.6 }}
                              animate={{ opacity: 1, y: -32, scale: bossReaction === "crit" ? 1.5 : 1.1 }}
                              exit={{ opacity: 0, y: -48 }}
                              transition={{ duration: 0.85, ease: "easeOut" }}
                              className={`pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 font-black font-mono ${
                                bossReaction === "crit"
                                  ? "text-rose-300 drop-shadow-[0_0_10px_#fb7185] text-sm"
                                  : "text-amber-300 drop-shadow-[0_0_6px_#fbbf24] text-xs"
                              }`}
                            >
                              -{damageNumber}{bossReaction === "crit" ? "!!" : ""}
                            </motion.span>
                          )}

                          {bossReaction === "block" && (
                            <motion.span
                              key="block"
                              initial={{ opacity: 0, scale: 0.8, y: 0 }}
                              animate={{ opacity: 1, scale: 1, y: -8 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.4 }}
                              className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 text-[10px] font-black font-mono text-slate-300 tracking-wider"
                            >
                              BLOCKED
                            </motion.span>
                          )}

                          {bossReaction === "counter" && (
                            <motion.span
                              key="counter"
                              initial={{ opacity: 0, scale: 0.6, x: 0 }}
                              animate={{ opacity: 1, scale: 1.1, x: 28 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.55, ease: "easeOut" }}
                              className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 text-[10px] font-black font-mono text-red-400 tracking-widest drop-shadow-[0_0_4px_#ef4444]"
                            >
                              COUNTER!
                            </motion.span>
                          )}

                          {bossReaction === "victory" && (
                            <motion.span
                              key="victory"
                              initial={{ opacity: 0, scale: 0.5, y: 0 }}
                              animate={{ opacity: 1, scale: 1.3, y: -22 }}
                              exit={{ opacity: 0, y: -36 }}
                              transition={{ duration: 0.9, ease: "easeOut" }}
                              className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 text-xs font-black font-mono text-emerald-300 tracking-widest drop-shadow-[0_0_10px_#34d399]"
                            >
                              VICTORY
                            </motion.span>
                          )}

                          {bossReaction === "defeated" && (
                            <motion.span
                              key="defeated"
                              initial={{ opacity: 0, scale: 0.6, y: 0 }}
                              animate={{ opacity: 1, scale: 1.2, y: -22 }}
                              exit={{ opacity: 0, y: -36 }}
                              transition={{ duration: 0.9, ease: "easeOut" }}
                              className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 text-xs font-black font-mono text-red-500 tracking-widest drop-shadow-[0_0_10px_#ef4444]"
                            >
                              DEFEAT
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.span>
                      <h4 className="text-sm font-extrabold text-white">Boss Challenge: {henchmanInfo.name}</h4>
                    </div>
                    {/* Real-time Ticking Timer */}
                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20">
                      <span className={`text-[11px] font-bold font-mono tracking-widest transition-all ${timeLeft <= 10 ? "text-red-500 animate-pulse scale-105" : "text-red-400"}`}>
                        ⏳ {timeLeft}s Left
                      </span>
                    </div>
                  </div>

                  {/* Timer Progress Bar */}
                  <div className="w-full h-1.5 rounded-full bg-white/5 border border-white/10 overflow-hidden mb-4">
                    <motion.div
                      initial={{ width: "100%" }}
                      animate={{ width: `${(timeLeft / 90) * 100}%` }}
                      transition={{ duration: 1, ease: "linear" }}
                      className={`h-full rounded-full transition-colors ${timeLeft <= 10 ? "bg-red-500 shadow-[0_0_8px_#ef4444]" : "bg-indigo-500"}`}
                    />
                  </div>

                  {/* Combat Stats Panel */}
                  <div className="flex justify-center gap-3 w-full mb-4">
                    <div className="p-2 px-4 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Project Score</span>
                      <span className="text-xs font-black text-emerald-400 mt-0.5">{Math.round(projectScore * 10) / 10}/12</span>
                    </div>
                  </div>

                  {/* Question Box */}
                  <div className="p-3.5 rounded-xl border border-white/10 bg-white/5 mb-4">
                    <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-1">Challenge Prompt</p>
                    <p className="text-xs font-semibold text-slate-200 leading-relaxed">
                      {getBossChallengeQuestion(templateId, stage)}
                    </p>
                  </div>

                  {/* Answer Input */}
                  <div className="space-y-1.5 mb-4">
                    <label htmlFor="boss-answer" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Your Strategy / Answer</label>
                    <textarea
                      id="boss-answer"
                      rows={3}
                      placeholder="Type your strategic response to defeat the Boss..."
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#0f172a]/60 p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-sans resize-none"
                    />
                    <div className="flex items-center justify-between text-[10px]">
                      <span className={answer.trim().length >= 8 ? "text-green-400 font-medium" : "text-slate-400"}>
                        {answer.trim().length >= 8 ? "✓ Minimum reached" : "Requires at least 8 characters"}
                      </span>
                      <span className="text-slate-500">{answer.trim().length} chars</span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={isSubmitting || answer.trim().length < 8}
                    className="w-full py-3 rounded-xl font-extrabold text-xs bg-gradient-to-r from-red-600 to-indigo-600 hover:from-red-500 hover:to-indigo-500 text-white shadow-lg active:scale-[0.98] transition-all uppercase tracking-wider disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {isSubmitting ? "Evaluating..." : "Submit to Evaluate!"}
                  </button>
                </div>
              )}
            </div>
          )}

          {activeEvent === "treasure" && phase === "intro" && (
            <div className="flex flex-col items-center text-center">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="text-6xl mb-4 select-none filter drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]"
              >
                🎁
              </motion.div>
              <h3 className="text-xl font-extrabold text-white mb-2">Treasure Found!</h3>
              <p className="text-sm text-gray-300 leading-relaxed mb-6">
                You stumbled upon an ancient chest lost between the checkpoints.
              </p>
              <button
                onClick={handleCollectTreasure}
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl font-bold bg-yellow-500 hover:bg-yellow-400 text-black shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Coins className="w-5 h-5" /> Open Chest
              </button>
            </div>
          )}

          {activeEvent === "shield" && phase === "intro" && (
            <div className="flex flex-col items-center text-center">
              <motion.div
                animate={{ rotateY: [0, 180, 360] }}
                transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                className="text-6xl mb-4 select-none filter drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]"
              >
                🛡️
              </motion.div>
              <h3 className="text-xl font-extrabold text-white mb-2">Shield Pick-up!</h3>
              <p className="text-sm text-gray-300 leading-relaxed mb-6">
                A barrier of creative energy protects you. Stack up to 2 shields to block 50% of the next corruption wave.
              </p>
              <button
                onClick={handleCollectShield}
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Shield className="w-5 h-5" /> Activate Shield
              </button>
            </div>
          )}

          {activeEvent === "insight" && phase === "intro" && (
            <div className="flex flex-col items-center text-center">
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                className="text-6xl mb-4 select-none filter drop-shadow-[0_0_15px_rgba(168,85,247,0.3)]"
              >
                🔮
              </motion.div>
              <h3 className="text-xl font-extrabold text-white mb-2">Insight Fragment!</h3>
              <p className="text-sm text-gray-300 leading-relaxed mb-6">
                A crystal containing deep wisdom. Each fragment collected permanently reduces the final boss health by 5%.
              </p>
              <button
                onClick={handleCollectInsight}
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Gem className="w-5 h-5" /> Absorb Fragment
              </button>
            </div>
          )}

          {/* Result Phase */}
          {phase === "result" && resultData && (
            <div className="flex flex-col items-center text-center">
              <div className="mb-4">
                {resultData.outcome === "victory" && (
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center">
                    <Check className="w-8 h-8 text-emerald-400" />
                  </div>
                )}
                {resultData.outcome === "retreat" && (
                  <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500 flex items-center justify-center">
                    <X className="w-8 h-8 text-red-400" />
                  </div>
                )}
                {resultData.outcome === "skipped" && (
                  <div className="w-16 h-16 rounded-full bg-yellow-500/20 border border-yellow-500 flex items-center justify-center">
                    <Coins className="w-8 h-8 text-yellow-400" />
                  </div>
                )}
                {resultData.outcome === "collected" && (
                  <div className="w-16 h-16 rounded-full bg-blue-500/20 border border-blue-500 flex items-center justify-center">
                    <Trophy className="w-8 h-8 text-blue-400" />
                  </div>
                )}
              </div>

              <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-wide">
                {resultData.outcome === "victory" ? "Victory!" 
                 : resultData.outcome === "retreat" ? "Encounter Retreat"
                 : resultData.outcome === "skipped" ? "Passed Safely"
                 : "Obtained!"}
              </h3>
              <p className="text-xs text-gray-300 mb-5 leading-relaxed whitespace-pre-line text-left max-w-sm mx-auto bg-white/5 border border-white/10 p-4 rounded-xl">
                {resultData.message}
              </p>

              {/* Feedbacks (XP, Corruption, etc.) */}
              <div className="flex justify-center gap-4 w-full mb-6">
                {resultData.xpEarned > 0 && (
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="flex-1 p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center"
                  >
                    <span className="text-xs text-white/50">Score</span>
                    <span className="text-lg font-bold text-emerald-400 font-mono">+{resultData.xpEarned} Score</span>
                  </motion.div>
                )}
                {resultData.corruptionReduction > 0 && (
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="flex-1 p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center"
                  >
                    <span className="text-xs text-white/50">Corruption Purged</span>
                    <span className="text-lg font-bold text-purple-400 font-mono">-{resultData.corruptionReduction}%</span>
                  </motion.div>
                )}
                {resultData.goldDeducted && (
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="flex-1 p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center"
                  >
                    <span className="text-xs text-white/50">Gold Spent</span>
                    <span className="text-lg font-bold text-yellow-500 font-mono">-{resultData.goldDeducted} Gold</span>
                  </motion.div>
                )}
              </div>

              {resultData.outcome === "retreat" ? (
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <button
                    onClick={() => {
                      audioManager.playUI("click");
                      setPhase("action");
                      setResultData(null);
                      setError(null);
                      setTimeLeft(20);
                      setAnswer("");
                    }}
                    className="flex-1 py-3 rounded-xl font-bold bg-white text-black hover:bg-white/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" /> Retry
                  </button>
                  <button
                    onClick={() => {
                      audioManager.playUI("click");
                      if (isBossCombat && onBossRetreat) { onBossRetreat(); return; }
                      onClose();
                    }}
                    className="flex-1 py-3 rounded-xl font-bold border border-white/20 hover:bg-white/5 active:scale-[0.98] text-white transition-all flex items-center justify-center gap-2"
                  >
                    Back to Map
                  </button>
                </div>
              ) : isBossCombat &&
                (resultData.outcome === "victory" ||
                  resultData.outcome === "skipped") ? (
                <div className="w-full py-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex flex-col items-center gap-1">
                  <span className="text-sm font-bold text-emerald-300">
                    {resultData.outcome === "victory" ? "Victory!" : "Passed!"}
                  </span>
                  <span className="text-[11px] text-emerald-200/80 animate-pulse">
                    {isLastCheckpointInStage
                      ? "Continuing to next stage..."
                      : "Continuing to next checkpoint..."}
                  </span>
                </div>
              ) : (
                <button
                  onClick={handleNext}
                  className={`w-full py-3 rounded-xl font-bold ${
                    isBossCombat && resultData.outcome === "victory"
                      ? isLastCheckpointInStage && isGoldCheckpoint
                        ? "bg-gradient-to-r from-yellow-500 to-amber-400 text-black"
                        : "bg-gradient-to-r from-emerald-600 to-teal-500 text-white"
                      : "bg-white text-black"
                  } hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2`}
                >
                  {isBossCombat && resultData.outcome === "victory"
                    ? isLastCheckpointInStage && isGoldCheckpoint
                      ? "🏆 Stage Conquered!"
                      : isLastCheckpointInStage
                      ? "✅ Stage Cleared!"
                      : "⚔️ Advance!"
                    : <>Continue <ArrowRight className="w-4 h-4" /></>}
                </button>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 text-center">
              {error}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
