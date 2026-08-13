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

// getAllUsers returns industries on the user doc and skills joined from
// userSkills. Both can be absent on older rows — normalise to clean
// string arrays so the ranking + tag chips never choke on undefined.
type UserLike = { industries?: string[]; skills?: string[] };
const userIndustries = (u: UserLike): string[] =>
  (u.industries ?? []).map((s) => (s ?? "").trim()).filter(Boolean);
const userSkills = (u: UserLike): string[] =>
  (u.skills ?? []).map((s) => (s ?? "").trim()).filter(Boolean);

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
    const others = allUsers.filter((u) => u._id !== currentUser._id);
    // Rank builders WITH profile tags first so at least one shown
    // suggestion carries an industry/skill tag whenever a tagged builder
    // exists (product ask). Both kinds → 2, one kind → 1, none → 0.
    // Array.sort is stable in modern engines, so equal-score builders keep
    // getAllUsers' newest-first order.
    const tagScore = (u: (typeof others)[number]) =>
      (userIndustries(u).length > 0 ? 1 : 0) +
      (userSkills(u).length > 0 ? 1 : 0);
    // Show at least 5 (or everyone, if the community is smaller).
    return [...others]
      .sort((a, b) => tagScore(b) - tagScore(a))
      .slice(0, 5);
  }, [allUsers, currentUser]);

  // Guard so the tap can only fire the invite + navigation once — a
  // second tap (or a double-tap) shouldn't stack sends / router.push.
  const [advancing, setAdvancing] = useState(false);

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

  // Tapping Invite goes STRAIGHT to the world — no "Sending… / Sent"
  // beats, no delay. The invite is fired-and-forgotten: onContinue does a
  // soft (client-side) route change to /map/world, which keeps the Convex
  // socket alive, so the mutation still lands after we've navigated.
  const handleAutoSend = useCallback(
    (userId: string) => {
      if (advancing) return;
      setAdvancing(true);
      const invitee = (allUsers ?? []).find((u) => u._id === userId);
      const inviteeUsername = invitee?.username;
      if (inviteeUsername) {
        void sendInvitation({
          ideaId,
          username: inviteeUsername,
          message: buildTemplateMessage(),
        }).catch(() => {
          // Swallow — the user has already moved on to their map by design;
          // a failed background invite shouldn't yank them back.
        });
      }
      window.requestAnimationFrame(() => onContinue());
    },
    [advancing, allUsers, sendInvitation, ideaId, buildTemplateMessage, onContinue],
  );

  // Empty-community fallback — the moment we know there's nobody to
  // invite, punt to the map so the tutorial doesn't dead-end.
  // Runs in an effect (never during render) so we don't infinite-loop
  // by setting state as a side-effect of rendering.
  useEffect(() => {
    if (!communityIsEmpty || advancing) return;
    setAdvancing(true);
    const t = window.setTimeout(() => onContinue(), 0);
    return () => window.clearTimeout(t);
  }, [communityIsEmpty, advancing, onContinue]);

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
          // Surface aligned to the create-idea / comments popups: flat
          // #0A0E1A fill, white/5 hairline border, 20px radius, the same
          // deep drop shadow — instead of the old bespoke navy gradient.
          className="w-full max-w-[560px] rounded-[20px] border border-white/5 bg-[#0A0E1A] text-[#F9FAFB] shadow-[0_20px_60px_rgba(0,0,0,0.85)]"
        >
          <div className="p-5">
            {/* Header — matches the other popups' title style (default
                sans, text-lg, no Space Grotesk display face). */}
            <h2 className="text-lg font-semibold leading-tight text-white">
              Potential Contributors
            </h2>

            <div className="mt-4 flex flex-col gap-2">
              {suggestions.length === 0 && (
                <div className="rounded-xl border border-white/8 bg-white/[0.02] px-4 py-6 text-center text-[13px] text-[#6B7280]">
                  {allUsers === undefined
                    ? "Finding builders you might want to invite…"
                    : "No suggestions yet — taking you to your map."}
                </div>
              )}
              {suggestions.map((u) => {
                return (
                  <div
                    key={u._id}
                    className="rounded-xl border border-white/8 bg-white/[0.02] transition-colors hover:border-white/15"
                  >
                    {/* Tighter row: smaller avatar + name shifted left, a
                        tag cluster, then the Invite button hard-right. The
                        middle group is flex-1 so leftover space collapses
                        BETWEEN the tags and the button — the "invisible
                        barrier" the button never crosses. */}
                    <div className="flex items-center gap-3 px-3 py-2.5">
                      <div
                        className="grid h-9 w-9 flex-shrink-0 place-items-center overflow-hidden rounded-full border border-white/12 text-[12px] font-semibold text-white"
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
                      <div className="min-w-0 flex-1 overflow-hidden">
                        {/* Name yields space before the tags do (higher
                            shrink factor) so short tag labels stay whole and
                            only the name truncates when the row gets tight. */}
                        <div className="truncate text-[13px] font-semibold text-[#F9FAFB]">
                          @{u.username}
                        </div>
                      </div>
                      {/* Invite — squarer + darker solid indigo to match
                          the site's other buttons (create-idea etc.), and
                          smaller now that the label is short. */}
                      <button
                        type="button"
                        onClick={() => handleAutoSend(u._id)}
                        disabled={advancing}
                        className="h-8 shrink-0 rounded-lg bg-[#6366F1] px-3.5 text-[13px] font-medium text-white transition hover:bg-[#5254cc] active:scale-95 disabled:opacity-80"
                      >
                        Send Invite
                      </button>
                    </div>
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
        {advancing && <ContributorHandoffScrim />}
      </motion.div>
    </AnimatePresence>
  );
}

function ContributorHandoffScrim() {
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
    </div>
  );
}
