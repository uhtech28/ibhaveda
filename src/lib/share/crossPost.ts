// Fire cross-posts to external platforms (PRD §7). Each platform opens
// its share-intent URL in a new tab; Instagram is special-cased to copy
// the caption to the clipboard.

import { buildShareUrl, composeText } from "./builders";
import type { ShareablePayload, SharePlatform } from "./types";

export interface CrossPostOutcome {
  platform: SharePlatform;
  status: "opened" | "skipped" | "failed";
  message?: string;
}

/**
 * Open the share-intent URL for each requested platform in a new tab.
 * Returns the per-destination outcome list so the caller can surface
 * it in a toast or inline panel.
 */
export function fireCrossPosts(
  platforms: SharePlatform[],
  payload: ShareablePayload,
): CrossPostOutcome[] {
  const outcomes: CrossPostOutcome[] = [];

  if (typeof window === "undefined") {
    return platforms.map((p) => ({
      platform: p,
      status: "skipped",
      message: "Cross-post can only run in the browser",
    }));
  }

  for (const platform of platforms) {
    try {
      // Instagram has no web share-intent URL — paste-into-Instagram
      // is the honest path. We copy a Title + URL caption to the
      // user's clipboard and open instagram.com so they can paste
      // into a new post.
      if (platform === "instagram") {
        const caption = composeText(payload, "instagram", { includeUrl: true });
        try {
          if (
            typeof navigator !== "undefined" &&
            navigator.clipboard?.writeText
          ) {
            // Fire and forget — clipboard may fail silently on
            // browsers that require a user gesture context; we still
            // try.
            void navigator.clipboard.writeText(caption);
          }
        } catch {
          // Non-fatal — still open Instagram below.
        }
        const opened = window.open(
          "https://www.instagram.com/",
          "_blank",
          "noopener,noreferrer",
        );
        outcomes.push(
          opened
            ? {
                platform,
                status: "opened",
                message: "Caption copied — paste into a new Instagram post",
              }
            : {
                platform,
                status: "failed",
                message: "Popup blocked — allow popups and try again",
              },
        );
        continue;
      }

      const url = buildShareUrl(platform, payload);
      if (!url) {
        outcomes.push({
          platform,
          status: "skipped",
          message: "No composer URL for this platform",
        });
        continue;
      }
      // Stagger tab opens slightly — popup blockers tend to allow the
      // first window.open during a click handler but block subsequent
      // ones in the same synchronous tick.
      const opened = window.open(url, "_blank", "noopener,noreferrer");
      if (!opened) {
        outcomes.push({
          platform,
          status: "failed",
          message: "Popup blocked — allow popups and try again",
        });
        continue;
      }
      outcomes.push({ platform, status: "opened" });
    } catch (err) {
      outcomes.push({
        platform,
        status: "failed",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return outcomes;
}

/**
 * Pretty label for an outcome — used by toast / status panel copy.
 */
export function summariseOutcomes(outcomes: CrossPostOutcome[]): string {
  const opened = outcomes.filter((o) => o.status === "opened");
  const failed = outcomes.filter((o) => o.status === "failed");
  const skipped = outcomes.filter((o) => o.status === "skipped");

  const parts: string[] = [];
  if (opened.length) {
    parts.push(`Opened: ${opened.map((o) => labelFor(o.platform)).join(", ")}`);
  }
  if (failed.length) {
    parts.push(`Failed: ${failed.map((o) => labelFor(o.platform)).join(", ")}`);
  }
  if (skipped.length) {
    parts.push(`Skipped: ${skipped.map((o) => labelFor(o.platform)).join(", ")}`);
  }
  return parts.join(" · ") || "No cross-posts attempted";
}

function labelFor(p: SharePlatform): string {
  switch (p) {
    case "twitter": return "X";
    case "linkedin": return "LinkedIn";
    case "instagram": return "Instagram";
    case "whatsapp": return "WhatsApp";
    case "facebook": return "Facebook";
    case "email": return "Email";
    case "copy": return "Copy";
    case "native": return "Native";
  }
}
