"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { audioManager } from "@/lib/audio/audioManager";
import { Shield, Gem, Trophy, Coins, Flame, Check, X, ArrowRight } from "lucide-react";

interface InterCheckpointOverlayProps {
  isOpen: boolean;
  events: Array<"henchman" | "treasure" | "shield" | "insight" | "clear">;
  templateId: "venture" | "academic" | "lab" | "creative";
  stage: number;
  checkpoint: number;
  ventureId: Id<"ventures">;
  onComplete: () => void;
  onClose: () => void;
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

export function InterCheckpointOverlay({
  isOpen,
  events,
  templateId,
  stage,
  checkpoint,
  ventureId,
  onComplete,
  onClose,
}: InterCheckpointOverlayProps) {
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [phase, setPhase] = useState<"intro" | "action" | "result">("intro");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Combat slider state
  const [sliderPos, setSliderPos] = useState(0);
  const [sliderDirection, setSliderDirection] = useState(1);
  const requestRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);

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

  // Run combat slider animation loop
  useEffect(() => {
    if (activeEvent === "henchman" && phase === "action") {
      const animate = (time: number) => {
        if (previousTimeRef.current !== null) {
          const delta = time - previousTimeRef.current;
          // Speed of slider (adjust multiplier for difficulty)
          const speed = 0.15; 
          setSliderPos((prev) => {
            let next = prev + sliderDirection * speed * delta;
            if (next >= 100) {
              next = 100;
              setSliderDirection(-1);
            } else if (next <= 0) {
              next = 0;
              setSliderDirection(1);
            }
            return next;
          });
        }
        previousTimeRef.current = time;
        requestRef.current = requestAnimationFrame(animate);
      };
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
      previousTimeRef.current = null;
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [activeEvent, phase, sliderDirection]);

  if (!isOpen || activeEvent === "clear") return null;

  const handleFight = async () => {
    // Stop the slider
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }

    // Success zone is 40% to 60%
    const isHit = sliderPos >= 40 && sliderPos <= 60;
    const outcome = isHit ? "victory" : "retreat";

    setIsSubmitting(true);
    setError(null);

    try {
      if (isHit) {
        audioManager.playUI("confirm");
      } else {
        audioManager.playUI("error");
      }

      const res = await resolveHenchman({
        ventureId,
        stage,
        checkpoint,
        outcome,
        henchmanName: henchmanInfo.name,
      });

      if (res) {
        setResultData({
          outcome,
          xpEarned: res.xpEarned,
          corruptionReduction: res.corruptionReduction,
          message: isHit ? henchmanInfo.victory : henchmanInfo.retreat,
        });
        setPhase("result");
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
          message: `Paid 5 gold coins to slip past the ${henchmanInfo.name}.`,
        });
        setPhase("result");
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
    if (currentEventIndex + 1 < events.length) {
      setCurrentEventIndex((prev) => prev + 1);
      setPhase("intro");
      setResultData(null);
      setError(null);
      setSliderPos(0);
    } else {
      onComplete();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{ type: "spring", damping: 25, stiffness: 180 }}
          className={`relative w-full max-w-lg overflow-hidden rounded-2xl border bg-gradient-to-b ${theme.bg} ${theme.border} p-6 shadow-2xl backdrop-blur-xl`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-6">
            <span className="text-xs font-bold uppercase tracking-widest text-white/40">
              Passage Event {currentEventIndex + 1} of {events.length}
            </span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
              <Coins className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-xs font-mono text-yellow-400">{walletBalance} gold</span>
            </div>
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
                  <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <button
                      onClick={() => {
                        audioManager.playUI("click");
                        setPhase("action");
                      }}
                      className="flex-1 py-3 rounded-xl font-bold bg-white text-black hover:bg-white/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      <Flame className="w-4 h-4" /> Engage Enemy
                    </button>
                    <button
                      onClick={handleSkip}
                      disabled={isSubmitting || walletBalance < 5}
                      className="py-3 px-6 rounded-xl font-bold border border-yellow-500/50 hover:bg-yellow-500/10 active:scale-[0.98] text-yellow-400 disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center gap-2"
                    >
                      Skip (5 Gold)
                    </button>
                  </div>
                </>
              )}

              {phase === "action" && (
                <div className="w-full flex flex-col items-center">
                  <div className="text-4xl mb-4 select-none">{henchmanInfo.icon}</div>
                  <h4 className="text-lg font-bold text-white mb-2">Align the Strike!</h4>
                  <p className="text-xs text-white/50 mb-6">
                    Stop the slider in the green zone to defeat the {henchmanInfo.name}.
                  </p>

                  {/* Bouncing slider visual */}
                  <div className="relative w-full h-10 rounded-xl bg-white/5 border border-white/10 overflow-hidden mb-8">
                    {/* Success Zone */}
                    <div className="absolute inset-y-0 left-[40%] right-[40%] bg-emerald-500/30 border-x-2 border-emerald-500 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-emerald-400 tracking-widest uppercase">Target</span>
                    </div>

                    {/* Slider pin */}
                    <div
                      className="absolute inset-y-0 w-2 bg-white shadow-[0_0_10px_#fff] transition-all duration-75"
                      style={{ left: `${sliderPos}%` }}
                    />
                  </div>

                  <button
                    onClick={handleFight}
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-xl font-extrabold text-lg bg-red-600 hover:bg-red-500 text-white shadow-lg active:scale-[0.98] transition-all uppercase tracking-wider"
                  >
                    Strike!
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
              <p className="text-sm text-gray-300 mb-6 leading-relaxed">
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
                    <span className="text-xs text-white/50">Experience</span>
                    <span className="text-lg font-bold text-emerald-400 font-mono">+{resultData.xpEarned} XP</span>
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

              <button
                onClick={handleNext}
                className={`w-full py-3 rounded-xl font-bold bg-white text-black hover:bg-white/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2`}
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
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
