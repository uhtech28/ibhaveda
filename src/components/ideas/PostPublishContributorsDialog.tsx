"use client";

/**
 * PostPublishContributorsDialog — shown after a NORMAL (non-tutorial)
 * idea is posted, before the user is taken to their map.
 *
 * Sibling of `SuggestedContributorsDialog` (which is the tutorial-only
 * variant that auto-sends + auto-advances). Product spec (verbatim):
 *   "we made changes in this screen for the tutorial, dont change
 *    anything for tutorial but after normal post that is out of
 *    tutorial we need this screen, just remove the minimum criteria"
 *
 * So this file mirrors the older tutorial UI (title + subtitle + 3
 * contributor cards with an inline write-message row + Continue
 * button) but:
 *   • NO "0 of 3 sent · at least 1 required" progress counter
 *   • NO "Send at least one request to unlock Continue" gate copy
 *   • Continue button is always enabled — the user can hit it any
 *     time to head to their map, whether they sent invites or not
 *
 * Kept in a dedicated file so we can evolve the tutorial and
 * post-publish flows independently without one turning into a
 * conditional maze.
 */

import { useCallback, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

interface Props {
  /** ID of the idea just posted. Used as the invitation target. */
  ideaId: Id<"ideas">;
  /** Called when the user clicks Continue — always available; parent
   *  should navigate to the map. */
  onContinue: () => void;
}

export function PostPublishContributorsDialog({ ideaId, onContinue }: Props) {
  const currentUser = useQuery(api.users.getCurrentUser);
  const allUsers = useQuery(api.users.getAllUsers, {});
  const sendInvitation = useMutation(api.invitations.sendInvitation);

  const suggestions = useMemo(() => {
    if (!allUsers || !currentUser) return [];
    return allUsers.filter((u) => u._id !== currentUser._id).slice(0, 3);
  }, [allUsers, currentUser]);

  // Which user's write-row is expanded. Only one open at a time.
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [sentSet, setSentSet] = useState<Set<string>>(new Set());
  const [sendingSet, setSendingSet] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const handleExpand = useCallback((userId: string) => {
    setExpandedUserId((prev) => {
      const next = prev === userId ? null : userId;
      if (next === userId && typeof window !== "undefined") {
        let attempts = 0;
        const tryFocus = () => {
          const el = textareaRefs.current[userId];
          if (el) {
            el.focus();
            try {
              el.click();
            } catch {
              /* no-op */
            }
            return;
          }
          if (++attempts < 8) requestAnimationFrame(tryFocus);
        };
        requestAnimationFrame(tryFocus);
      }
      return next;
    });
  }, []);

  const handleSend = useCallback(
    async (userId: string) => {
      const message = (drafts[userId] || "").trim();
      if (message.length < 10) return;
      if (sentSet.has(userId) || sendingSet.has(userId)) return;
      const invitee = (allUsers ?? []).find((u) => u._id === userId);
      const inviteeUsername = invitee?.username;
      if (!inviteeUsername) {
        setErrors((prev) => ({
          ...prev,
          [userId]: "Missing username — try another suggestion.",
        }));
        return;
      }
      setSendingSet((prev) => {
        const next = new Set(prev);
        next.add(userId);
        return next;
      });
      setErrors((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      try {
        await sendInvitation({
          ideaId,
          username: inviteeUsername,
          message,
        });
        setSentSet((prev) => {
          const next = new Set(prev);
          next.add(userId);
          return next;
        });
        setExpandedUserId(null);
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message.replace(/^\[.*?\]\s*/, "")
            : "Send failed — try another builder.";
        setErrors((prev) => ({ ...prev, [userId]: msg }));
      } finally {
        setSendingSet((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      }
    },
    [sendInvitation, ideaId, drafts, sentSet, sendingSet, allUsers],
  );

  return (
    <AnimatePresence>
      <motion.div
        key="post-publish-contributors"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[400] flex items-center justify-center overflow-y-auto p-4 sm:p-6"
        style={{
          // Safe-area insets: iPhone notch + home indicator both eat
          // into the modal edges without these; on short viewports
          // the Continue CTA could sit behind the gesture bar.
          paddingTop:
            "max(1rem, env(safe-area-inset-top, 0px))",
          paddingBottom:
            "max(1rem, env(safe-area-inset-bottom, 0px))",
          background:
            "radial-gradient(ellipse 900px 600px at 50% -5%, rgba(99,102,241,0.14), transparent 60%), rgba(5,8,20,0.88)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          WebkitTapHighlightColor: "transparent",
          fontFamily: "'Inter', system-ui, sans-serif",
          color: "#F9FAFB",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-[560px] rounded-2xl border border-white/8 shadow-2xl"
          style={{
            background:
              "linear-gradient(180deg, #111827 0%, #0F1726 60%, #0B1220 100%)",
            boxShadow:
              "0 40px 80px -20px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.02)",
          }}
        >
          {/* Small × in the top-right so users can also dismiss without
              scrolling to Continue. Both paths lead to the same
              onContinue navigation — the modal is a soft offer, not a
              gate. */}
          <button
            type="button"
            onClick={onContinue}
            aria-label="Skip and continue to map"
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white/90"
          >
            <span className="text-xl leading-none">×</span>
          </button>

          <div className="p-6 sm:p-7">
            <h2
              className="text-[22px] leading-tight font-semibold sm:text-[26px]"
              style={{
                fontFamily: "'Space Grotesk', 'Inter', sans-serif",
                color: "#F9FAFB",
                letterSpacing: "-0.3px",
              }}
            >
              These are people we think can help you
            </h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-[#9CA3AF]">
              Send a contribution request if you&apos;d like their help —
              or head straight to your map and ask later.
            </p>

            <div className="mt-5 flex flex-col gap-2.5">
              {suggestions.length === 0 && (
                <div className="rounded-xl border border-white/8 bg-white/[0.02] px-4 py-6 text-center text-[13px] text-[#6B7280]">
                  {allUsers === undefined
                    ? "Finding builders you might want to invite…"
                    : "No suggestions yet — try again after the community grows."}
                </div>
              )}
              {suggestions.map((u) => {
                const sent = sentSet.has(u._id);
                const sending = sendingSet.has(u._id);
                const expanded = expandedUserId === u._id;
                const draft = drafts[u._id] || "";
                const canSend = draft.trim().length >= 10 && !sending;
                return (
                  <div
                    key={u._id}
                    className={`rounded-xl border transition-colors ${
                      sent
                        ? "border-[#22c55e]/40 bg-[#22c55e]/[0.06]"
                        : expanded
                          ? "border-[#6366F1]/50 bg-[#6366F1]/[0.05]"
                          : "border-white/8 bg-white/[0.02] hover:border-white/15"
                    }`}
                  >
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div
                        className="grid h-11 w-11 flex-shrink-0 place-items-center overflow-hidden rounded-full border border-white/12 text-[13px] font-semibold text-white"
                        style={{
                          background:
                            "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
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
                          (u.displayName || u.username || "U")
                            .slice(0, 1)
                            .toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[14px] font-semibold text-[#F9FAFB]">
                          {u.displayName || u.username}
                        </div>
                        <div className="truncate text-[11.5px] text-[#6B7280]">
                          @{u.username}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          sent ? undefined : handleExpand(u._id)
                        }
                        disabled={sent}
                        className={`shrink-0 rounded-full px-4 py-2 text-[12px] font-semibold uppercase tracking-wider transition ${
                          sent
                            ? "cursor-default bg-[#22c55e]/15 text-[#4ade80]"
                            : expanded
                              ? "bg-white/8 text-[#C7D2FE] hover:bg-white/12"
                              : "bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white hover:brightness-110 active:scale-95"
                        }`}
                      >
                        {sent
                          ? "✓ Sent"
                          : expanded
                            ? "Cancel"
                            : "Send request"}
                      </button>
                    </div>

                    <AnimatePresence initial={false}>
                      {expanded && !sent && (
                        <motion.div
                          key="write-row"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.22, ease: "easeOut" }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-1">
                            <textarea
                              ref={(el) => {
                                textareaRefs.current[u._id] = el;
                              }}
                              value={draft}
                              onChange={(e) =>
                                setDrafts((prev) => ({
                                  ...prev,
                                  [u._id]: e.target.value,
                                }))
                              }
                              placeholder="Hey — I'm building something you might be a great fit for. Here's why…"
                              maxLength={500}
                              rows={3}
                              style={{
                                WebkitAppearance: "none",
                                WebkitTapHighlightColor: "transparent",
                              }}
                              className="mt-1 w-full resize-none rounded-xl border border-white/12 bg-[#0B1220] px-3 py-2.5 text-[13.5px] leading-relaxed text-[#F9FAFB] placeholder:text-[#4B5563] focus:border-[#6366F1] focus:outline-none focus:ring-1 focus:ring-[#6366F1]/50"
                            />
                            <div className="mt-2 flex items-center justify-between">
                              <span
                                className={`text-[11px] ${
                                  draft.trim().length < 10
                                    ? "text-[#6B7280]"
                                    : "text-[#4ade80]"
                                }`}
                              >
                                {draft.trim().length < 10
                                  ? `${10 - draft.trim().length} more character${
                                      10 - draft.trim().length === 1 ? "" : "s"
                                    } to send`
                                  : `${draft.length} / 500`}
                              </span>
                              <button
                                type="button"
                                onClick={() => void handleSend(u._id)}
                                disabled={!canSend}
                                className={`rounded-full px-5 py-2 text-[12px] font-semibold uppercase tracking-wider transition ${
                                  canSend
                                    ? "bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white hover:brightness-110 active:scale-95"
                                    : "cursor-not-allowed bg-white/5 text-[#4B5563]"
                                }`}
                              >
                                {sending ? "Sending…" : "Send"}
                              </button>
                            </div>
                            {errors[u._id] && (
                              <p className="mt-1.5 text-[11px] leading-snug text-[#f87171]">
                                {errors[u._id]}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Continue — always enabled per spec ("just remove the
                minimum criteria"). No progress dots, no "at least 1
                required" gate copy. Users can send zero invites and
                still head straight to the map. */}
            <div className="mt-6">
              <button
                type="button"
                onClick={onContinue}
                className="w-full rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-6 py-3.5 text-[13.5px] font-semibold uppercase tracking-[0.14em] text-white shadow-lg shadow-[#6366F1]/25 transition hover:brightness-110 active:scale-[0.99]"
              >
                Continue to your map
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
