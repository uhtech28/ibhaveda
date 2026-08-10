"use client";

/**
 * SuggestedContributorsDialog — Step 5 of the Ibhaveda onboarding
 * tutorial. Shown right after the user's first idea is posted, before
 * they navigate to the map.
 *
 * Product spec (updated):
 *   1. NO subtitle blurb.
 *   2. NO "0 of 3 sent · at least 1 required" progress dots.
 *   3. NO "Continue to your map" button + no gate copy underneath.
 *   4. Clicking "Send request" auto-composes a friendly template
 *      pitch ("Hi, I'm {username}, I want to contribute to your
 *      project '{ideaTitle}'.") and sends it in the same tap — no
 *      textarea, no character-count gate. The moment the send
 *      resolves we fire onContinue() so the user is taken straight
 *      to their map without needing a second confirmation from
 *      Sparky.
 *   5. Cancel / expand row + Sparky prompt bubble are gone (there's
 *      nothing left to write, so no guidance needed).
 *
 * Design constraints unchanged:
 *   - Same platform palette (navy #0F1726, gold accent, indigo CTA).
 *   - Mobile + desktop parity.
 *   - Author-side mutation is `sendInvitation` (author invites
 *     invitee by username). We are NOT calling the reverse-direction
 *     `createContributionRequest` — that would hit the "cannot
 *     request contribution to your own idea" auth check and fail
 *     every time.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

interface Props {
  /** ID of the idea just posted. Used as the request target. */
  ideaId: Id<"ideas">;
  /** Called after the FIRST successful auto-send so the parent can
   *  navigate the user to /map/world. Also called if the user
   *  dismisses / no suggestions exist so the tutorial isn't stuck. */
  onContinue: () => void;
}

export function SuggestedContributorsDialog({ ideaId, onContinue }: Props) {
  const currentUser = useQuery(api.users.getCurrentUser);
  const allUsers = useQuery(api.users.getAllUsers, {});
  // Fetch the idea so we can bake its title into the auto-composed
  // pitch ("...contribute to your project 'Foo'."). Cheap read —
  // Convex will already have this cached from the wizard step.
  const idea = useQuery(api.ideas.getIdeaById, { ideaId });
  const sendInvitation = useMutation(api.invitations.sendInvitation);

  const suggestions = useMemo(() => {
    if (!allUsers || !currentUser) return [];
    return allUsers
      .filter((u) => u._id !== currentUser._id)
      .slice(0, 3);
  }, [allUsers, currentUser]);

  // Users we've successfully sent to.
  const [sentSet, setSentSet] = useState<Set<string>>(new Set());
  // Users mid-send (per-row spinner state).
  const [sendingSet, setSendingSet] = useState<Set<string>>(new Set());
  // Surface send errors inline instead of swallowing them silently —
  // if the server rejects (e.g. duplicate invitation), the user sees
  // the reason under the affected row.
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Guard so the auto-advance to /map/world can only fire once —
  // a second tap on another Send request row shouldn't stack
  // router.push calls on top of a navigation already in flight.
  const [advancedRef, setAdvancedRef] = useState(false);

  // If the community truly is empty (no other users to invite),
  // don't dead-end the tutorial — auto-advance the moment we've
  // confirmed the query resolved with zero suggestions.
  const communityIsEmpty =
    allUsers !== undefined &&
    currentUser !== undefined &&
    suggestions.length === 0;

  const buildTemplateMessage = useCallback(() => {
    // Prefer the display name — falls back to the @handle so we never
    // send "Hi, I'm undefined, ...".
    const meName =
      currentUser?.displayName ||
      currentUser?.username ||
      "a fellow builder";
    // Idea title comes from Convex; fall back to a generic phrase so
    // the pitch still reads well if the read hasn't landed yet.
    const projectName = idea?.title?.trim() || "your project";
    return `Hi, I'm ${meName}. I'd love to contribute to your project "${projectName}".`;
  }, [currentUser, idea]);

  const handleAutoSend = useCallback(
    async (userId: string) => {
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
          message: buildTemplateMessage(),
        });
        setSentSet((prev) => {
          const next = new Set(prev);
          next.add(userId);
          return next;
        });
        // Auto-advance to map on the FIRST successful send. Guard
        // against duplicate navigation if the user manages to tap
        // two rows in the same tick.
        if (!advancedRef) {
          setAdvancedRef(true);
          // Slight delay so the user sees the row's ✓ Sent flash
          // before the dialog unmounts (feels less abrupt).
          window.setTimeout(() => {
            onContinue();
          }, 350);
        }
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
    [
      sendInvitation,
      ideaId,
      sentSet,
      sendingSet,
      allUsers,
      buildTemplateMessage,
      advancedRef,
      onContinue,
    ],
  );

  // Empty-community fallback — the moment we know there's nobody to
  // invite, punt to the map so the tutorial doesn't dead-end.
  // Runs in an effect (never during render) so we don't infinite-loop
  // by setting state as a side-effect of rendering.
  useEffect(() => {
    if (!communityIsEmpty || advancedRef) return;
    setAdvancedRef(true);
    const t = window.setTimeout(() => onContinue(), 0);
    return () => window.clearTimeout(t);
  }, [communityIsEmpty, advancedRef, onContinue]);

  return (
    <AnimatePresence>
      <motion.div
        key="suggested-contributors"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[400] flex items-center justify-center overflow-y-auto p-4 sm:p-6"
        style={{
          // Safe-area insets so the modal doesn't sit under the iPhone
          // notch on top or the home indicator on the bottom.
          paddingTop: "max(1rem, env(safe-area-inset-top, 0px))",
          paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
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
          className="w-full max-w-[560px] rounded-2xl border border-white/8 shadow-2xl"
          style={{
            background:
              "linear-gradient(180deg, #111827 0%, #0F1726 60%, #0B1220 100%)",
            boxShadow:
              "0 40px 80px -20px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.02)",
          }}
        >
          <div className="p-6 sm:p-7">
            {/* Header — subtitle intentionally removed per spec. */}
            <h2
              className="text-[22px] leading-tight font-semibold sm:text-[26px]"
              style={{
                fontFamily: "'Space Grotesk', 'Inter', sans-serif",
                color: "#F9FAFB",
                letterSpacing: "-0.3px",
              }}
            >
              Potential Contributors
            </h2>

            <div className="mt-5 flex flex-col gap-2.5">
              {suggestions.length === 0 && (
                <div className="rounded-xl border border-white/8 bg-white/[0.02] px-4 py-6 text-center text-[13px] text-[#6B7280]">
                  {allUsers === undefined
                    ? "Finding builders you might want to invite…"
                    : "No suggestions yet — taking you to your map."}
                </div>
              )}
              {suggestions.map((u) => {
                const sent = sentSet.has(u._id);
                const sending = sendingSet.has(u._id);
                return (
                  <div
                    key={u._id}
                    className={`rounded-xl border transition-colors ${
                      sent
                        ? "border-[#22c55e]/40 bg-[#22c55e]/[0.06]"
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
                        onClick={() => (sent ? undefined : void handleAutoSend(u._id))}
                        disabled={sent || sending}
                        className={`shrink-0 rounded-full px-4 py-2 text-[12px] font-semibold uppercase tracking-wider transition ${
                          sent
                            ? "cursor-default bg-[#22c55e]/15 text-[#4ade80]"
                            : sending
                              ? "cursor-wait bg-white/8 text-[#C7D2FE]"
                              : "bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white hover:brightness-110 active:scale-95"
                        }`}
                      >
                        {sent ? "✓ Sent" : sending ? "Sending…" : "Send request"}
                      </button>
                    </div>
                    {errors[u._id] && (
                      <p className="px-4 pb-3 text-[11px] leading-snug text-[#f87171]">
                        {errors[u._id]}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Progress + Continue button + gate copy all removed per
                spec — a single tap on any Send request row auto-sends
                a template pitch and takes the user straight to their
                map. */}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
