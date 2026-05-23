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
    setConfirmDialog({ show: true, ideaId, title });
  };

  const handleConfirm = () => {
    if (confirmDialog) {
      router.push(`/idea/${confirmDialog.ideaId}`);
      setConfirmDialog(null);
    }
  };

  const handleCancel = () => {
    setConfirmDialog(null);
  };

  return (
    <div className="fixed bottom-3 right-3 z-40 flex flex-col gap-2 pointer-events-auto w-[280px]">
      {/* Collaborators list */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-1.5 p-2 rounded-lg bg-slate-900/90 border border-white/10 backdrop-blur-md shadow-xl">
        <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-1.5">
          <div className="flex items-center gap-1 text-white/80 font-semibold text-[9px] uppercase tracking-wider">
            <Users className="w-2.5 h-2.5 text-indigo-400" />
            <span>Active Collaborators</span>
          </div>
          <span className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[8px] font-mono font-bold">
            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
            LIVE
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {activeUsers.length > 0 ? (
            activeUsers.map((user, idx) => (
              <div key={idx} className="flex items-center group relative">
                <div className={`w-6 h-6 rounded-full bg-gradient-to-tr ${user.color} flex items-center justify-center text-[10px] shadow-md border border-white/20 font-semibold text-white`}>
                  {user.avatar}
                </div>
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block whitespace-nowrap bg-slate-950 text-white text-[8px] px-1.5 py-0.5 rounded border border-white/10 shadow-lg z-50">
                  {user.name}
                </span>
              </div>
            ))
          ) : (
            <div className="text-white/40 text-[9px] py-0.5">No active users</div>
          )}
        </div>
      </motion.div>

      {/* Activity Feed */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex flex-col gap-1.5 p-2 rounded-lg bg-slate-900/90 border border-white/10 backdrop-blur-md shadow-xl max-h-[200px] overflow-hidden">
        <div className="flex items-center gap-1 text-white/80 font-semibold text-[9px] uppercase tracking-wider border-b border-white/5 pb-1.5">
          <Activity className="w-2.5 h-2.5 text-rose-400" />
          <span>Real-time Activity</span>
        </div>

        <div className="flex flex-col gap-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pr-0.5">
          <AnimatePresence initial={false}>
            {feed.length === 0 ? (
              <div className="text-white/40 text-[9px] py-2 text-center font-mono">
                No recent activity...
              </div>
            ) : (
              feed.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: 20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: "auto" }}
                  exit={{ opacity: 0, x: -20, height: 0 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => handleActivityClick(event.id, event.detail)}
                  className="flex items-start gap-1.5 text-[9px] text-white/90 cursor-pointer hover:bg-white/5 rounded p-1 -m-1 transition-colors"
                >
                  <span className="text-[10px] select-none mt-0.5 w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-semibold text-white shrink-0">
                    {event.avatar}
                  </span>
                  <div className="flex flex-col leading-tight flex-1 min-w-0">
                    <p className="font-semibold text-white/95 truncate text-[10px]">{event.user}</p>
                    <p className="text-white/60 text-[9px] mt-0.5">
                      {event.action}
                    </p>
                    <p className="text-indigo-300 font-medium truncate text-[9px]">
                      {event.detail}
                    </p>
                    <p className="text-white/40 text-[8px] mt-0.5">{event.timestamp}</p>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {confirmDialog?.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={handleCancel}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-white/10 rounded-xl p-4 shadow-2xl max-w-[280px] w-full mx-4"
            >
              <h3 className="text-white font-semibold text-sm mb-2">View Idea?</h3>
              <p className="text-white/60 text-xs mb-4 line-clamp-2">
                {confirmDialog.title}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  className="flex-1 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 text-xs font-medium transition-colors border border-white/10"
                >
                  No
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 px-3 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-medium transition-colors"
                >
                  Yes
                </button>
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
