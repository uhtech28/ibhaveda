"use client";

/**
 * LiveActivityFeed.tsx
 *
 * Real-time presence and activity feed showing actual user activity
 * from the database (ideas posted, sparks, comments, etc.)
 * Fully responsive for mobile, tablet, and desktop
 */

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Activity } from "lucide-react";
import { useRouter } from "next/navigation";
import { audioManager } from "@/lib/audio/audioManager";

interface ActivityEvent {
  id: string;
  user: string;
  avatar: string;
  action: string;
  detail: string;
  timestamp: string;
  color: string;
}

export function LiveActivityFeed() {
  const router = useRouter();
  
  // Fetch real active users (users who posted ideas recently)
  const recentIdeas = useQuery(api.ideas.getPublicIdeas, { 
    limit: 10
  });
  
  const [activeUsers, setActiveUsers] = useState<Array<{name: string, avatar: string, color: string}>>([]);
  const [feed, setFeed] = useState<ActivityEvent[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{ show: boolean; ideaId: string; title: string } | null>(null);

  // Extract unique active users from recent ideas
  useEffect(() => {
    if (!recentIdeas) return;
    
    const uniqueUsers = new Map();
    const colors = [
      "from-pink-500 to-rose-500",
      "from-amber-500 to-yellow-500", 
      "from-emerald-500 to-teal-500",
      "from-violet-500 to-purple-500",
      "from-blue-500 to-indigo-500",
    ];
    
    recentIdeas.forEach((idea) => {
      if (idea.author && !uniqueUsers.has(idea.author._id)) {
        uniqueUsers.set(idea.author._id, {
          name: idea.author.name || "Anonymous",
          avatar: idea.author.name?.charAt(0).toUpperCase() || "👤",
          color: colors[uniqueUsers.size % colors.length],
        });
      }
    });
    
    setActiveUsers(Array.from(uniqueUsers.values()).slice(0, 3));
  }, [recentIdeas]);

  // Convert recent ideas to activity feed
  useEffect(() => {
    if (!recentIdeas) return;
    
    const activities: ActivityEvent[] = recentIdeas.slice(0, 5).map((idea) => {
      const timeAgo = getTimeAgo(idea._creationTime);
      
      return {
        id: idea._id,
        user: idea.author?.name || "Anonymous",
        avatar: idea.author?.name?.charAt(0).toUpperCase() || "👤",
        action: "posted idea",
        detail: idea.title,
        timestamp: timeAgo,
        color: "from-indigo-500 to-purple-500",
      };
    });
    
    setFeed(activities);
  }, [recentIdeas]);

  const handleActivityClick = (ideaId: string, title: string) => {
    audioManager.playUI("click");
    setConfirmDialog({ show: true, ideaId, title });
  };

  const handleConfirm = () => {
    audioManager.playUI("confirm");
    if (confirmDialog) {
      router.push(`/idea/${confirmDialog.ideaId}`);
      setConfirmDialog(null);
    }
  };

  const handleCancel = () => {
    audioManager.playUI("click");
    setConfirmDialog(null);
  };

  return (
    <div className="fixed bottom-3 left-3 z-40 hidden sm:flex flex-col gap-2 pointer-events-auto sm:w-[260px]">
      {/* Collaborators list - Compact */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-1 p-2 rounded-lg bg-slate-900/95 border border-white/10 backdrop-blur-xl shadow-xl">
        <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-1">
          <div className="flex items-center gap-1 text-white/80 font-semibold text-[8px] uppercase tracking-wider">
            <Users className="w-2.5 h-2.5 text-indigo-400" />
            <span>Active</span>
          </div>
          <span className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[7px] font-mono font-bold">
            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
            LIVE
          </span>
        </div>
        <div className="flex items-center gap-1">
          {activeUsers.length > 0 ? (
            activeUsers.map((user, idx) => (
              <div key={idx} className="flex items-center group relative">
                <div className={`w-5 h-5 rounded-full bg-gradient-to-tr ${user.color} flex items-center justify-center text-[9px] shadow-md border border-white/20 font-semibold text-white`}>
                  {user.avatar}
                </div>
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block whitespace-nowrap bg-slate-950 text-white text-[8px] px-1.5 py-0.5 rounded border border-white/10 shadow-lg z-50">
                  {user.name}
                </span>
              </div>
            ))
          ) : (
            <div className="text-white/40 text-[8px] py-0.5">No active users</div>
          )}
        </div>
      </motion.div>

      {/* Activity Feed - Compact */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex flex-col gap-1 p-2 rounded-lg bg-slate-900/95 border border-white/10 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-1 text-white/80 font-semibold text-[8px] uppercase tracking-wider border-b border-white/5 pb-1">
          <Activity className="w-2.5 h-2.5 text-rose-400" />
          <span>Activity</span>
        </div>
        <div className="flex flex-col gap-1">
          <AnimatePresence initial={false}>
            {feed.length === 0 ? (
              <div className="text-white/40 text-[8px] py-1.5 text-center font-mono">
                No recent activity...
              </div>
            ) : (
              feed.slice(0, 3).map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => handleActivityClick(event.id, event.detail)}
                  className="flex items-start gap-1.5 text-[8px] text-white/90 cursor-pointer hover:bg-white/5 rounded p-1 -m-1 transition-colors"
                >
                  <span className="text-[9px] select-none mt-0.5 w-4 h-4 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-semibold text-white shrink-0">
                    {event.avatar}
                  </span>
                  <div className="flex flex-col leading-tight flex-1 min-w-0">
                    <p className="font-semibold text-white/95 truncate text-[9px]">{event.user}</p>
                    <p className="text-indigo-300 font-medium truncate text-[8px]">
                      {event.detail}
                    </p>
                    <p className="text-white/40 text-[7px] mt-0.5">{event.timestamp}</p>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ── Premium Confirmation Dialog ── */}
      <AnimatePresence>
        {confirmDialog?.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] flex items-center justify-center"
            style={{ backdropFilter: "blur(14px)", background: "rgba(5,8,20,0.72)" }}
            onClick={handleCancel}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 16 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-[320px] mx-4 rounded-2xl overflow-hidden"
              style={{
                background: "linear-gradient(145deg, rgba(15,18,35,0.98) 0%, rgba(10,13,25,0.99) 100%)",
                border: "1px solid rgba(99,102,241,0.25)",
                boxShadow: "0 0 0 1px rgba(99,102,241,0.08), 0 25px 60px rgba(0,0,0,0.7), 0 0 80px rgba(99,102,241,0.08)",
              }}
            >
              {/* Top gradient accent bar */}
              <div
                className="absolute inset-x-0 top-0 h-[2px]"
                style={{ background: "linear-gradient(90deg, #6366f1, #a855f7, #6366f1)" }}
              />

              {/* Glow orb behind icon */}
              <div
                className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 75%)" }}
              />

              <div className="relative px-6 pt-7 pb-6 flex flex-col items-center text-center gap-4">
                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-lg"
                  style={{
                    background: "linear-gradient(135deg, rgba(99,102,241,0.25), rgba(168,85,247,0.18))",
                    border: "1px solid rgba(99,102,241,0.3)",
                    boxShadow: "0 4px 20px rgba(99,102,241,0.2)",
                  }}
                >
                  💡
                </div>

                {/* Heading */}
                <div className="flex flex-col gap-1">
                  <h3
                    className="text-white font-bold text-base tracking-tight leading-snug"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    View this Idea?
                  </h3>
                  <p
                    className="text-sm leading-relaxed font-medium line-clamp-2"
                    style={{ color: "rgba(148,163,184,0.9)" }}
                  >
                    {confirmDialog.title}
                  </p>
                  <p className="text-[11px] mt-1" style={{ color: "rgba(99,102,241,0.8)" }}>
                    You&apos;ll leave the world map temporarily
                  </p>
                </div>

                {/* Divider */}
                <div className="w-full h-px" style={{ background: "rgba(255,255,255,0.06)" }} />

                {/* Buttons */}
                <div className="flex gap-3 w-full">
                  <button
                    onClick={handleCancel}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      color: "rgba(148,163,184,0.9)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.09)";
                      (e.currentTarget as HTMLElement).style.color = "#fff";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
                      (e.currentTarget as HTMLElement).style.color = "rgba(148,163,184,0.9)";
                    }}
                  >
                    Stay
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-200 relative overflow-hidden"
                    style={{
                      background: "linear-gradient(135deg, #6366f1, #7c3aed)",
                      border: "1px solid rgba(99,102,241,0.5)",
                      color: "#fff",
                      boxShadow: "0 4px 16px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.12)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 24px rgba(99,102,241,0.55), inset 0 1px 0 rgba(255,255,255,0.15)";
                      (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.12)";
                      (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                    }}
                  >
                    View Idea →
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper function to convert timestamp to "time ago" format
function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
