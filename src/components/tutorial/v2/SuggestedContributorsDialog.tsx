"use client";

/**
 * SuggestedContributorsDialog — Step 5 of the Ibhaveda onboarding
 * tutorial. Shown right after the user's first idea is posted, before
 * they navigate to the map.
 *
 * Design constraints (from product):
 *   1. Must render identically on mobile AND desktop. Previously only
 *      surfaced reliably on mobile because the wizard's share panel
 *      auto-navigated to /map/world before the tutorial could catch
 *      the closed-wizard state. Wizard onDone now no-ops for
 *      tutorialMode; this dialog owns the navigation to /map/world.
 *   2. UI matches the platform palette — navy #0F1726 bg, border
 *      white/8, #6366F1 accent, gold #F5C542 highlights. NO pink/
 *      orange gradients (previous rev was inconsistent with the rest
 *      of the app).
 *   3. Compulsory — user must send at least one contribution request
 *      before the Continue button unlocks. There is no "ask later"
 *      escape hatch on this step.
 *   4. Sending is a real write: clicking "Send request" expands an
 *      inline textarea + Send button so the user composes an actual
 *      pitch. Sparky's bubble appears above the write row with the
 *      copy "Write a quick message saying why you'd be a great fit,
 *      then send your request!"
 */

import { useCallback, useMemo, useRef, useState } from "react";
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

const SPARKY_PROMPT =
  "Write a quick message saying why you'd be a great fit, then send your request!";

export function SuggestedContributorsDialog({ ideaId, onContinue }: Props) {
  const currentUser = useQuery(api.users.getCurrentUser);
  const allUsers = useQuery(api.users.getAllUsers, {});
  // This tutorial step is the AUTHOR inviting people to their own
  // just-created idea. It used to call `createContributionRequest`
  // which is the OPPOSITE direction (a would-be contributor asking
  // an author for permission). That mutation's server-side check
  // "You cannot request contribution to your own idea" fired every
  // single time because the requester and the idea author were the
  // same user, breaking the tutorial. `sendInvitation` is the
  // correct primitive: only the idea author can call it, and it
  // targets an invitee by username.
  const sendInvitation = useMutation(api.invitations.sendInvitation);

  const suggestions = useMemo(() => {
    if (!allUsers || !currentUser) return [];
    return allUsers
      .filter((u) => u._id !== currentUser._id)
      .slice(0, 3);
  }, [allUsers, currentUser]);

  // Which user's write-row is expanded. Only one can be open at a
  // time — keeps Sparky's bubble anchored to one target.
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  // Per-user message drafts. Persist across expand/collapse so the
  // user doesn't lose text if they collapse and reopen.
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  // Users we've successfully sent to.
  const [sentSet, setSentSet] = useState<Set<string>>(new Set());
  // Users mid-send (button spinner state).
  const [sendingSet, setSendingSet] = useState<Set<string>>(new Set());
  // Surface send errors inline instead of swallowing them silently —
  // if the server rejects (e.g. duplicate invitation, no matching
  // username), the user sees the reason under the affected row.
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Per-user textarea refs. iOS Safari ignores React's `autoFocus`
  // prop because it fires in a post-mount effect (after the
  // AnimatePresence height-expand animation), by which point the
  // user-gesture context is lost and iOS refuses to open the
  // keyboard. Instead we imperatively call .focus() *synchronously*
  // inside the tap handler — that preserves the gesture and iOS
  // opens the keyboard as expected. Android/desktop keep working
  // either way.
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  // Continue unlocks after at least one successful send OR when the
  // suggestions list is empty (fresh community with no other users)
  // OR when the users query loaded but returned zero suggestions.
  // Without the empty-community fallback the tutorial dead-ends for
  // the very first users on a new deployment, who have no one to
  // invite and can't proceed past this step.
  const communityIsEmpty =
    allUsers !== undefined && currentUser !== undefined && suggestions.length === 0;
  const canContinue = sentSet.size >= 1 || communityIsEmpty;

  const handleExpand = useCallback((userId: string) => {
    setExpandedUserId((prev) => {
      const next = prev === userId ? null : userId;
      // Kick focus() synchronously so iOS honours it. The textarea
      // may not exist yet (it mounts on the next frame after
      // setState + AnimatePresence expand), so we retry across a
      // couple of rAFs until the ref lands.
      if (next === userId && typeof window !== "undefined") {
        let attempts = 0;
        const tryFocus = () => {
          const el = textareaRefs.current[userId];
          if (el) {
            el.focus();
            // Some iOS versions need a nudge to raise the keyboard
            // even after focus — dispatching a click on the element
            // inside the same task keeps the gesture chain intact.
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
      // Guard: minimum 10 characters — matches ContributionRequestModal's
      // gate elsewhere in the app. A one-word "hi" isn't a real pitch.
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
        // Surface the server-side rejection reason (was silently
        // swallowed, which left the user stuck at 0/3 sent with no
        // idea why). Common reasons: duplicate invitation exists,
        // invitee doesn't accept invitations, etc.
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
        key="suggested-contributors"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[400] flex items-center justify-center overflow-y-auto p-4 sm:p-6"
        style={{
          // Platform-consistent scrim — deep navy with a soft indigo
          // radial. Matches the persona-picker / feed backdrop.
          background:
            "radial-gradient(ellipse 900px 600px at 50% -5%, rgba(99,102,241,0.14), transparent 60%), rgba(5,8,20,0.88)",
          backdropFilter: "blur(6px)",
          // iOS Safari (all versions) still needs the -webkit- prefix
          // for the backdrop-filter to actually paint. Without it the
          // scrim renders flat and the blur-behind effect that Android
          // gets silently drops on iPhone/iPad.
          WebkitBackdropFilter: "blur(6px)",
          // Kill the gray-flash tap highlight iOS paints on any
          // <button>/<a>/<textarea> tapped inside the dialog. Cascades
          // down through descendants so we don't have to repeat it.
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
            // Platform card surface — same as cardSurface used in feed.
            background:
              "linear-gradient(180deg, #111827 0%, #0F1726 60%, #0B1220 100%)",
            boxShadow:
              "0 40px 80px -20px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.02)",
          }}
        >
          <div className="p-6 sm:p-7">
            {/* Header — no eyebrow tag, keep the surface calm */}
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
              Send a contribution request to at least one collaborator to
              continue. Pick who might be the best fit and pitch them in
              your own words.
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

                    {/* ── Inline write-message row ─────────────────
                        Expands beneath the user row when "Send request"
                        is tapped. Sparky's bubble sits above the row
                        with the requested copy. */}
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
                            {/* Sparky guidance bubble — matches the
                                platform's tutorial bubble style
                                (white card, pointer arrow, gold accent
                                left border) but inlined into the
                                dialog so no portal is needed. */}
                            <SparkyGuidanceBubble />

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
                              // NOTE: no `autoFocus` — handled imperatively
                              // inside handleExpand for iOS compatibility.
                              // Reset iOS-default rounded/padded chrome so
                              // the field matches the platform's dark
                              // inputs on both platforms.
                              style={{
                                WebkitAppearance: "none",
                                WebkitTapHighlightColor: "transparent",
                              }}
                              className="mt-3 w-full resize-none rounded-xl border border-white/12 bg-[#0B1220] px-3 py-2.5 text-[13.5px] leading-relaxed text-[#F9FAFB] placeholder:text-[#4B5563] focus:border-[#6366F1] focus:outline-none focus:ring-1 focus:ring-[#6366F1]/50"
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
                                  ? `${10 - draft.trim().length} more character${10 - draft.trim().length === 1 ? "" : "s"} to send`
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

            {/* ── Progress + Continue ────────────────────────────── */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className={`h-1.5 w-8 rounded-full transition-colors ${
                      i < sentSet.size ? "bg-[#22c55e]" : "bg-white/8"
                    }`}
                  />
                ))}
                <span className="ml-2 text-[11px] text-[#6B7280]">
                  {sentSet.size} of 3 sent
                  {sentSet.size === 0 && (
                    <span className="ml-1 text-[#F5C542]">
                      · at least 1 required
                    </span>
                  )}
                </span>
              </div>
              <button
                type="button"
                onClick={canContinue ? onContinue : undefined}
                disabled={!canContinue}
                className={`w-full rounded-xl px-6 py-3.5 text-[13.5px] font-semibold uppercase tracking-[0.14em] transition ${
                  canContinue
                    ? "bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white shadow-lg shadow-[#6366F1]/25 hover:brightness-110 active:scale-[0.99]"
                    : "cursor-not-allowed bg-white/5 text-[#4B5563]"
                }`}
              >
                Continue to your map
              </button>
              {!canContinue && (
                <p className="text-center text-[11px] text-[#6B7280]">
                  Send at least one request to unlock Continue.
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Inline Sparky guidance bubble — white card with the requested
 * onboarding copy and a small gold-outlined puppy avatar on the left.
 * Kept inside this file so the dialog is self-contained (no reliance
 * on the portal-mounted TutorialMascot which is already suppressed
 * during the contributors beat by Step2TemplatePick).
 */
function SparkyGuidanceBubble() {
  return (
    <div className="flex items-start gap-2.5">
      {/* Small Sparky sprite — solid gold puppy silhouette so it
          reads as "our mascot" without importing the full animated
          sprite component (this is a static one-line guidance moment). */}
      <div
        className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full border border-[#F5C542]/40"
        style={{
          background:
            "radial-gradient(circle at 35% 35%, #fde68a 0%, #f5c542 55%, #b8790a 100%)",
          boxShadow: "0 0 12px rgba(245,197,66,0.25)",
        }}
        aria-hidden
      >
        {/* Simple pup emoji-style glyph — SVG so it renders crisply */}
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
          <path
            d="M6 10c0-3.5 2.7-6 6-6s6 2.5 6 6c0 1-.4 2-1 2.7l1 2.3-2.2-.6c-1 .7-2.3 1-3.8 1s-2.8-.3-3.8-1L6 15l1-2.3c-.6-.7-1-1.7-1-2.7Z"
            fill="#3a2412"
          />
          <circle cx="10" cy="10" r="1" fill="#fff2c8" />
          <circle cx="14" cy="10" r="1" fill="#fff2c8" />
          <circle cx="10" cy="10" r="0.5" fill="#3a2412" />
          <circle cx="14" cy="10" r="0.5" fill="#3a2412" />
          <path
            d="M11 12.5c.5.4 1.5.4 2 0"
            stroke="#3a2412"
            strokeWidth="0.6"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div
        className="relative flex-1 rounded-xl border-l-[3px] border-[#F5C542] bg-white px-3 py-2 text-[12.5px] leading-relaxed text-[#111827] shadow-sm"
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        {SPARKY_PROMPT}
        {/* Tail pointing left toward the Sparky avatar */}
        <span
          className="absolute -left-[6px] top-3 h-3 w-3 rotate-45 border-b border-l border-[#F5C542] bg-white"
          aria-hidden
        />
      </div>
    </div>
  );
}
