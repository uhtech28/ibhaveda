"use client";

/**
 * LiveActivityFeed.tsx
 *
 * Phase 30 — Real-Time Presence
 *
 * Implements a template-aware real-time collaborator presence dashboard
 * and live activity feed. Periodically generates immersive RPG-style progress
 * feed events matching the current template's biome and checkpoint themes.
 */

import { useEffect, useState } from "react";
import { useAtomValue } from "jotai";
import { motion, AnimatePresence } from "framer-motion";
import { templateIdAtom } from "@/lib/stores/hudStore";
import { Users, Sparkles, Activity } from "lucide-react";

interface ActivityEvent {
  id: string;
  user: string;
  avatar: string;
  action: string;
  detail: string;
  timestamp: string;
}

const COLLABORATORS_POOL = [
  { name: "Elena Rostova", avatar: "👩‍💻", color: "from-pink-500 to-rose-500" },
  { name: "Marcus Thorne", avatar: "👨‍🎓", color: "from-amber-500 to-yellow-500" },
  { name: "Dr. Kenji Tanaka", avatar: "👨‍🔬", color: "from-emerald-500 to-teal-500" },
  { name: "Sarah Jenkins", avatar: "👩‍🎨", color: "from-violet-500 to-purple-500" },
  { name: "Alex Mercer", avatar: "👨‍💻", color: "from-blue-500 to-indigo-500" },
];

const TEMPLATE_UPDATES: Record<
  string,
  { actions: string[]; details: string[] }
> = {
  venture: {
    actions: ["validated target user", "submitted pitch slide", "completed market sizing", "slayed competition risk", "earned gold standard on"],
    details: ["Landing Page MVP", "Competitor Matrix", "Customer Interviews", "Financial Projections", "Pitch Deck Draft"],
  },
  academic: {
    actions: ["completed citation review", "drafted abstract", "reviewed methodology", "slayed thesis block on", "earned gold standard on"],
    details: ["Literature Review", "Research Question Definition", "Data Source Isolation", "Statistical Modeling", "Draft Introduction"],
  },
  lab: {
    actions: ["calibrated spectrometer", "isolated compound", "published test data", "slayed anomaly on", "earned gold standard on"],
    details: ["Replication Run #3", "Gel Electrophoresis", "Clean Room Protocol", "Spectroscopy Output", "Methodology Writeup"],
  },
  creative: {
    actions: ["sketched composition", "selected color palette", "finalized rough cut", "slayed creative block on", "earned gold standard on"],
    details: ["Concept Moodboard", "Storyboard Sequence", "Character Turnaround", "Acoustic Theme Track", "Post-production Grading"],
  },
};

export function LiveActivityFeed() {
  const templateId = useAtomValue(templateIdAtom);
  const [activeUsers, setActiveUsers] = useState<typeof COLLABORATORS_POOL>([]);
  const [feed, setFeed] = useState<ActivityEvent[]>([]);

  // Initialize active users
  useEffect(() => {
    // Select 3 random collaborators
    const shuffled = [...COLLABORATORS_POOL].sort(() => 0.5 - Math.random());
    setActiveUsers(shuffled.slice(0, 3));
  }, []);

  // Generate periodic updates matching active template
  useEffect(() => {
    const generator = setInterval(() => {
      const user = COLLABORATORS_POOL[Math.floor(Math.random() * COLLABORATORS_POOL.length)];
      const pool = TEMPLATE_UPDATES[templateId] ?? TEMPLATE_UPDATES.venture;
      const action = pool.actions[Math.floor(Math.random() * pool.actions.length)];
      const detail = pool.details[Math.floor(Math.random() * pool.details.length)];

      const newEvent: ActivityEvent = {
        id: Math.random().toString(),
        user: user.name,
        avatar: user.avatar,
        action,
        detail,
        timestamp: "Just now",
      };

      setFeed((prev) => [newEvent, ...prev.slice(0, 4)]);
    }, 9000); // New event every 9 seconds

    return () => clearInterval(generator);
  }, [templateId]);

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-3 max-w-sm pointer-events-auto">
      {/* Collaborators list */}
      <div className="flex flex-col gap-2 p-3 rounded-xl bg-slate-900/85 border border-white/10 backdrop-blur-md shadow-lg">
        <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2">
          <div className="flex items-center gap-1.5 text-white/80 font-semibold text-xs uppercase tracking-wider">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span>Active Collaborators</span>
          </div>
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE
          </span>
        </div>
        <div className="flex items-center gap-3">
          {activeUsers.map((user, idx) => (
            <div key={idx} className="flex items-center gap-1.5 group relative">
              <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${user.color} flex items-center justify-center text-sm shadow-md border border-white/20`}>
                {user.avatar}
              </div>
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block whitespace-nowrap bg-slate-950 text-white text-[10px] px-2 py-0.5 rounded border border-white/10 shadow-lg">
                {user.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Feed */}
      <div className="flex flex-col gap-2 p-3 rounded-xl bg-slate-900/85 border border-white/10 backdrop-blur-md shadow-lg min-h-[140px]">
        <div className="flex items-center gap-1.5 text-white/80 font-semibold text-xs uppercase tracking-wider border-b border-white/5 pb-2">
          <Activity className="w-3.5 h-3.5 text-rose-400" />
          <span>Real-time Activity</span>
        </div>

        <div className="flex flex-col gap-2.5 overflow-hidden">
          <AnimatePresence initial={false}>
            {feed.length === 0 ? (
              <div className="text-white/40 text-xs py-4 text-center font-mono">
                Monitoring world activity...
              </div>
            ) : (
              feed.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: 20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: "auto" }}
                  exit={{ opacity: 0, x: -20, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-start gap-2.5 text-xs text-white/90"
                >
                  <span className="text-sm select-none mt-0.5">{event.avatar}</span>
                  <div className="flex flex-col leading-tight">
                    <p className="font-semibold text-white/95">{event.user}</p>
                    <p className="text-white/60 text-[11px] mt-0.5">
                      {event.action}{" "}
                      <span className="text-indigo-300 font-medium">
                        {event.detail}
                      </span>
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
