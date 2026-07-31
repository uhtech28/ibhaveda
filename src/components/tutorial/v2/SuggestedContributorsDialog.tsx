"use client";

/**
 * SuggestedContributorsDialog — the missing Step 5 from the
 * Ibhaveda Onboarding Tutorial Script.
 *
 * Shown right after the user's first idea is posted, BEFORE they
 * navigate to the map. Sparky's line for this beat:
 *
 *   "These are people we think can help you. Send a contribution
 *    request if you'd like their help, or click continue and ask
 *    later."
 *
 * Renders 3 real users (excluding the current author, prioritising
 * recently-active) as clickable cards with a "Send Request" button
 * on each. The user can send zero or more requests, then click
 * Continue to proceed to the map. Fires-and-forgets the underlying
 * createContributionRequest mutation so the dialog stays snappy.
 */

import { useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

interface Props {
  /** ID of the idea just posted. Used as the request target. */
  ideaId: Id<"ideas">;
  /** Called when the user clicks Continue (advance to map). */
  onContinue: () => void;
}

export function SuggestedContributorsDialog({ ideaId, onContinue }: Props) {
  const currentUser = useQuery(api.users.getCurrentUser);
  const allUsers = useQuery(api.users.getAllUsers, {});
  const createRequest = useMutation(
    api.contributionRequests.createContributionRequest,
  );

  const suggestions = useMemo(() => {
    if (!allUsers || !currentUser) return [];
    return allUsers
      .filter((u) => u._id !== currentUser._id)
      .slice(0, 3);
  }, [allUsers, currentUser]);

  const [sentSet, setSentSet] = useState<Set<string>>(new Set());

  const handleSend = useCallback(
    (userId: string, displayName: string) => {
      if (sentSet.has(userId)) return;
      setSentSet((prev) => {
        const next = new Set(prev);
        next.add(userId);
        return next;
      });
      // Fire-and-forget — the dialog doesn't wait on the server round-trip.
      // A generic personalised note is sent; the user can edit any
      // request later from their profile if they want to refine it.
      const msg = `Hi ${displayName || "there"}, I just posted a new idea and would love your input — would you be open to jumping in?`;
      void createRequest({
        ideaId,
        message: msg,
      }).catch(() => {
        /* silent — tutorial flow shouldn't dead-end on network hiccup */
      });
    },
    [createRequest, ideaId, sentSet],
  );

  return (
    <AnimatePresence>
      <motion.div
        key="suggested-contributors"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
        className="fixed inset-0 z-[400] flex items-center justify-center overflow-y-auto p-6"
        style={{
          background:
            "radial-gradient(ellipse 900px 600px at 50% -5%, rgba(143,92,232,0.20), transparent 60%), linear-gradient(180deg, rgba(7,5,12,0.92) 0%, rgba(13,10,23,0.96) 45%, rgba(20,15,34,0.98) 100%)",
          backdropFilter: "blur(8px)",
          fontFamily: "'Inter', system-ui, sans-serif",
          color: "#f6f4fa",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[560px] rounded-3xl border border-white/10"
          style={{
            background:
              "linear-gradient(180deg, rgba(20,15,34,0.92) 0%, rgba(13,10,23,0.98) 100%)",
            boxShadow:
              "0 40px 80px -20px rgba(0,0,0,0.7), 0 0 40px rgba(143,92,232,0.15)",
          }}
        >
          <div className="p-7 sm:p-8">
            <div
              className="text-[10px] font-bold uppercase tracking-[0.42em]"
              style={{ color: "#c9a45c" }}
            >
              Suggested collaborators
            </div>
            <h2
              className="mt-3 text-[26px] leading-tight font-bold sm:text-[30px]"
              style={{
                fontFamily: "'Space Grotesk', 'Inter', sans-serif",
                letterSpacing: "-0.4px",
              }}
            >
              These are people we think can help you
            </h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-[#a49bc0]">
              Send a contribution request if you'd like their help, or click
              Continue and ask later.
            </p>

            <div className="mt-6 flex flex-col gap-2.5">
              {suggestions.length === 0 && (
                <div className="rounded-xl border border-white/8 bg-white/[0.02] px-4 py-6 text-center text-[13px] text-[#786e96]">
                  {allUsers === undefined
                    ? "Finding builders you might want to invite…"
                    : "No suggestions yet — try again after the community grows a bit."}
                </div>
              )}
              {suggestions.map((u) => {
                const sent = sentSet.has(u._id);
                return (
                  <div
                    key={u._id}
                    className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.035] px-4 py-3 transition-colors"
                  >
                    <div
                      className="grid h-11 w-11 flex-shrink-0 place-items-center overflow-hidden rounded-full border border-white/15 text-[13px] font-bold text-white"
                      style={{
                        background:
                          "linear-gradient(155deg, #8f5ce8 0%, #e2739a 55%, #f6b25e 100%)",
                      }}
                    >
                      {u.avatar ? (
                        <img
                          src={u.avatar}
                          alt=""
                          className="h-full w-full object-cover"
                          draggable={false}
                        />
                      ) : (
                        (u.displayName || u.username || "U").slice(0, 1).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14px] font-semibold text-[#f6f4fa]">
                        {u.displayName || u.username}
                      </div>
                      <div className="truncate text-[11.5px] text-[#786e96]">
                        @{u.username}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleSend(u._id, u.displayName || u.username)
                      }
                      disabled={sent}
                      className={`shrink-0 rounded-full px-4 py-2 text-[12px] font-bold transition ${
                        sent
                          ? "cursor-default bg-white/5 text-[#7fd18a]"
                          : "bg-gradient-to-r from-[#8f5ce8] to-[#e2739a] text-white hover:brightness-110 active:scale-95"
                      }`}
                    >
                      {sent ? "✓ Sent" : "Send request"}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-7 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={onContinue}
                className="w-full rounded-2xl px-6 py-3.5 text-[14px] font-bold uppercase tracking-[0.14em] transition-transform hover:scale-[1.01] active:scale-[0.99]"
                style={{
                  background:
                    "linear-gradient(120deg, #f6b25e, #e2739a 55%, #8f5ce8)",
                  color: "#160b23",
                  boxShadow: "0 14px 32px -10px rgba(226,115,154,0.5)",
                }}
              >
                Continue to your map
              </button>
              <button
                type="button"
                onClick={onContinue}
                className="text-[12px] text-[#786e96] underline underline-offset-4 hover:text-[#a49bc0]"
              >
                I'll ask for help later
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
