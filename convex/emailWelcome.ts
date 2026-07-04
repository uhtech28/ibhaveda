/**
 * Welcome email system for Ibhaveda.
 *
 * Two email variants:
 *   1. Immediate welcome (sendImmediateWelcomeEmail) — fires on Clerk user.created
 *      before onboarding. No venture data; minimal, atmospheric.
 *   2. Onboarding complete (sendOnboardingCompleteEmail) — fires after the first
 *      venture is created. Full personalized RPG dispatch with boss intelligence.
 *
 * Both send via a dedicated Resend account (RESEND_WELCOME_API_KEY), separate
 * from the existing RESEND_API_KEY used for re-engagement emails.
 */

import { internalAction, internalQuery, action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const FROM_ADDRESS = "aryan@ibhaveda.org";
const FEED_URL = "https://ibhaveda.com/feed";
const LOGO_URL = "https://ibhaveda.com/logo.png";

type AngerTier = "barely_scratched" | "wounded_composed" | "furious_regrouping";

const ANGER_TIER_LABELS: Record<AngerTier, string> = {
  barely_scratched: "Patient. Undiminished. Waiting.",
  wounded_composed: "Wounded but composed. It has adapted.",
  furious_regrouping: "Furious. Regrouping. It will not make the same mistake.",
};

interface BossEmailData {
  name: string;
  nature: string;
  corruptionLine: string;
}

const BOSS_EMAIL_DATA: Record<number, BossEmailData> = {
  1: {
    name: "The Unraveller",
    nature: "Ancient Void Serpent",
    corruptionLine: "Pulls threads from reality — walls crack, plans collapse into incoherence",
  },
  2: {
    name: "The Pale Architect",
    nature: "Undead Perfectionist Titan",
    corruptionLine: "Freezes progress in amber — everything looks almost right but nothing moves forward",
  },
  3: {
    name: "The Hollow King",
    nature: "Spectral Sovereign",
    corruptionLine: "Drains meaning from actions — tasks complete but feel empty, the world greyscales",
  },
  4: {
    name: "The Thornwarden",
    nature: "Ancient Forest Colossus",
    corruptionLine: "Overgrows paths with thorns — every checkpoint requires twice the effort to reach",
  },
  5: {
    name: "The Mirror Witch",
    nature: "Illusionist Sorceress",
    corruptionLine: "Replaces real progress with reflections — you see what you want to see rather than what is true",
  },
  6: {
    name: "The Ashen Drake",
    nature: "Fire Dragon of Entropy",
    corruptionLine: "Burns completed work to ash if left untouched — idle stages decay",
  },
  7: {
    name: "The Tide Caller",
    nature: "Oceanic Leviathan",
    corruptionLine: "Floods the landscape with noise — too many directions, priorities submerged",
  },
  8: {
    name: "The Gravemind",
    nature: "Necromantic Hive Intelligence",
    corruptionLine: "Raises the corpses of abandoned ideas to block progress",
  },
  9: {
    name: "The Rusted Oracle",
    nature: "Corrupted Mechanical Prophet",
    corruptionLine: "Speaks only outdated truths — research feels stale, everything feels already done",
  },
  10: {
    name: "The Wraith Council",
    nature: "Parliament of Failed Founders",
    corruptionLine: "Seven spectral figures who argue endlessly — every decision is contested",
  },
  11: {
    name: "The Stonecaller",
    nature: "Mountain Elemental Warlord",
    corruptionLine: "Petrifies momentum — each checkpoint feels like moving a boulder",
  },
  12: {
    name: "The Veilwalker",
    nature: "Interdimensional Shadow Predator",
    corruptionLine: "Makes the idea invisible to others — no feedback comes, work feels unseen",
  },
};

type TemplateId = "venture" | "academic" | "lab" | "creative";

interface StageMonster {
  name: string;
  setting: string;
}

const STAGE_MONSTERS: Record<TemplateId, StageMonster> = {
  venture: { name: "The Fog of Vagueness", setting: "The Village" },
  academic: { name: "The Librarian of Lost Questions", setting: "The Ancient Library" },
  lab: { name: "The Mirage Lens", setting: "The Observatory" },
  creative: { name: "The Silence That Smothers", setting: "The Sacred Grove" },
};


// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL QUERIES
// ─────────────────────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getAngerTier(healthPercent: number): AngerTier {
  if (healthPercent > 85) return "barely_scratched";
  if (healthPercent >= 60) return "wounded_composed";
  return "furious_regrouping";
}

async function dispatchEmail(
  apiKey: string,
  to: string,
  subject: string,
  html: string,
) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to,
      subject,
      html,
      tags: [{ name: "campaign_type", value: "welcome" }],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend welcome email error ${response.status}: ${body}`);
  }

  return (await response.json()) as { id: string };
}

// ─────────────────────────────────────────────────────────────────────────────
// HTML BUILDERS
// ─────────────────────────────────────────────────────────────────────────────

function buildImmediateWelcomeHtml(name: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ibhaveda</title></head>
<body style="margin:0;padding:0;background-color:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#000000">
  <tr><td align="center" style="padding:48px 20px 32px 20px;">
    <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

      <!-- Logo -->
      <tr><td align="center" style="padding:0 0 32px 0;">
        <img src="${LOGO_URL}" width="80" height="80" alt="Ibhaveda" style="display:block;margin:0 auto;border:0;" />
      </td></tr>

      <!-- Main card -->
      <tr><td style="background-color:#1A1830;border-radius:16px;padding:40px 40px 32px 40px;">

        <p style="margin:0 0 8px 0;font-size:22px;font-weight:700;color:#FFFFFF;line-height:1.3;font-family:'Courier New',Courier,monospace;">${name}, your quest awaits.</p>
        <p style="margin:0 0 28px 0;font-size:15px;color:#888888;line-height:1.7;">The map is drawn. Six stages stand between your idea and the world. Complete your profile to enter.</p>

        <!-- Divider -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px 0;">
          <tr><td style="border-top:1px solid #2A2845;"></td></tr>
        </table>

        <!-- Info row -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px 0;">
          <tr>
            <td style="background-color:#0F0E1A;border-left:3px solid #7C3AED;border-radius:0 6px 6px 0;padding:14px 18px;">
              <p style="margin:0;font-size:14px;color:#CCCCCC;line-height:1.5;">Bosses, corruption, checkpoints — none of it starts until you do.</p>
            </td>
          </tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 32px 0;">
          <tr>
            <td style="background-color:#0F0E1A;border-left:3px solid #7C3AED;border-radius:0 6px 6px 0;padding:14px 18px;">
              <p style="margin:0;font-size:14px;color:#CCCCCC;line-height:1.5;">Everything that happens after this is up to you.</p>
            </td>
          </tr>
        </table>

        <!-- CTA -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td bgcolor="#7C3AED" style="border-radius:8px;text-align:center;">
            <a href="${FEED_URL}" style="display:block;padding:15px 24px;font-size:15px;font-weight:700;color:#FFFFFF;text-decoration:none;">Enter the Quest &rarr;</a>
          </td></tr>
        </table>

      </td></tr>

      <!-- Footer -->
      <tr><td style="padding:24px 0 0 0;text-align:center;">
        <p style="margin:0 0 6px 0;font-size:12px;color:#2A2736;font-style:italic;">Something has been watching since before you arrived. It is not concerned with stages.</p>
        <p style="margin:16px 0 0 0;font-size:11px;color:#333;">&#169; 2025 Ibhaveda &nbsp;&middot;&nbsp; <a href="${FEED_URL}" style="color:#7C3AED;text-decoration:none;">Visit Platform</a></p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

interface FullWelcomeData {
  userName: string;
  projectName: string;
  templateId: TemplateId;
  bossId: number;
  bossHealthPercent: number;
}

function buildFullWelcomeHtml(data: FullWelcomeData): string {
  const { userName, projectName, templateId, bossId, bossHealthPercent } = data;
  const boss = BOSS_EMAIL_DATA[bossId] ?? BOSS_EMAIL_DATA[1];
  const monster = STAGE_MONSTERS[templateId] ?? STAGE_MONSTERS.venture;
  const tier = getAngerTier(bossHealthPercent);
  const tierLabel = ANGER_TIER_LABELS[tier];

  const stageLineMap: Record<TemplateId, string> = {
    venture: "Six stages ahead — The Village, The Forest, The Arena, The Artisan's Quarter, The Mine, The Harbour. Each one older and heavier than the last.",
    academic: "Six stages ahead — The Ancient Library, The Ruins, The Cartographer's Tower, The Scriptorium, The Council Chamber, The Grand Archive. The path was walked before. Not by you.",
    lab: "Seven stages ahead — The Observatory, The Ancient Library, The Cartographer's Tower, The Forge, The Alchemist's Laboratory, The Crossroads Town, The Grand Hall. Each checkpoint a proof. Each proof contested.",
    creative: "Six stages ahead — The Sacred Grove, The Gallery of Echoes, The Wilderness, The Village Square, The Artisan's Workshop, The Harbour. The work does not end when you ship. The work becomes the monument.",
  };

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ibhaveda — ${projectName}</title></head>
<body style="margin:0;padding:0;background-color:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#000000">
  <tr><td align="center" style="padding:48px 20px 32px 20px;">
    <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

      <!-- Logo -->
      <tr><td align="center" style="padding:0 0 32px 0;">
        <img src="${LOGO_URL}" width="80" height="80" alt="Ibhaveda" style="display:block;margin:0 auto;border:0;" />
      </td></tr>

      <!-- Main card -->
      <tr><td style="background-color:#1A1830;border-radius:16px;padding:40px 40px 32px 40px;">

        <!-- Header -->
        <p style="margin:0 0 4px 0;font-size:11px;letter-spacing:3px;color:#7C3AED;text-transform:uppercase;">Field dispatch — Stage 1</p>
        <p style="margin:0 0 6px 0;font-size:22px;font-weight:700;color:#FFFFFF;line-height:1.3;font-family:'Courier New',Courier,monospace;">${userName}. <span style="color:#FFDF00;">${projectName}</span> is in the field.</p>
        <p style="margin:0 0 28px 0;font-size:15px;color:#888888;line-height:1.7;">You crossed the first checkpoint. ${monster.name} retreated back into ${monster.setting}.</p>

        <!-- Divider -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px 0;">
          <tr><td style="border-top:1px solid #2A2845;"></td></tr>
        </table>

        <!-- Boss hit row -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px 0;">
          <tr><td style="background-color:#0F0E1A;border-left:3px solid #7C3AED;border-radius:0 6px 6px 0;padding:14px 18px;">
            <p style="margin:0;font-size:14px;color:#CCCCCC;line-height:1.5;">${boss.name} took one hit. It did not flinch.</p>
          </td></tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px 0;">
          <tr><td style="background-color:#0F0E1A;border-left:3px solid #7C3AED;border-radius:0 6px 6px 0;padding:14px 18px;">
            <p style="margin:0;font-size:14px;color:#888888;line-height:1.5;">It is still standing at the far end of the quest, exactly where it was before you arrived.</p>
          </td></tr>
        </table>

        <!-- Stage context -->
        <p style="margin:0 0 28px 0;font-size:13px;color:#555555;line-height:1.9;">Stage 1 — ${monster.setting}. ${stageLineMap[templateId]}</p>

        <!-- Divider -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px 0;">
          <tr><td style="border-top:1px solid #2A2845;"></td></tr>
        </table>

        <!-- Enemy status report label -->
        <p style="margin:0 0 12px 0;font-size:10px;letter-spacing:3px;color:#7C3AED;text-transform:uppercase;font-weight:700;">Enemy Status Report</p>

        <!-- Boss row -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px 0;">
          <tr><td style="background-color:#0F0E1A;border-left:3px solid #7C3AED;border-radius:0 6px 6px 0;padding:14px 18px;">
            <p style="margin:0 0 2px 0;font-size:10px;letter-spacing:2px;color:#4A4660;text-transform:uppercase;">Boss</p>
            <p style="margin:0;font-size:14px;color:#FFFFFF;font-weight:600;">${boss.name} <span style="color:#555;font-weight:400;">/ ${boss.nature}</span></p>
          </td></tr>
        </table>

        <!-- Health row -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px 0;">
          <tr><td style="background-color:#0F0E1A;border-left:3px solid #FFDF00;border-radius:0 6px 6px 0;padding:14px 18px;">
            <p style="margin:0 0 2px 0;font-size:10px;letter-spacing:2px;color:#4A4660;text-transform:uppercase;">Health</p>
            <p style="margin:0;font-size:14px;font-weight:700;color:#FFDF00;">${bossHealthPercent}% <span style="color:#555555;font-weight:400;">— ${tierLabel}</span></p>
          </td></tr>
        </table>

        <!-- Status row -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px 0;">
          <tr><td style="background-color:#0F0E1A;border-left:3px solid #7C3AED;border-radius:0 6px 6px 0;padding:14px 18px;">
            <p style="margin:0 0 2px 0;font-size:10px;letter-spacing:2px;color:#4A4660;text-transform:uppercase;">Status</p>
            <p style="margin:0;font-size:14px;color:#888888;">${boss.corruptionLine}.</p>
          </td></tr>
        </table>

        <!-- Position row -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 32px 0;">
          <tr><td style="background-color:#0F0E1A;border-left:3px solid #7C3AED;border-radius:0 6px 6px 0;padding:14px 18px;">
            <p style="margin:0 0 2px 0;font-size:10px;letter-spacing:2px;color:#4A4660;text-transform:uppercase;">Position</p>
            <p style="margin:0;font-size:14px;color:#888888;">Stage 1. Still there. Still watching.</p>
          </td></tr>
        </table>

        <!-- CTA -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td bgcolor="#7C3AED" style="border-radius:8px;text-align:center;">
            <a href="${FEED_URL}" style="display:block;padding:15px 24px;font-size:15px;font-weight:700;color:#FFFFFF;text-decoration:none;">Return to the Quest &rarr;</a>
          </td></tr>
        </table>

      </td></tr>

      <!-- Footer -->
      <tr><td style="padding:24px 0 0 0;text-align:center;">
        <p style="margin:0 0 6px 0;font-size:12px;color:#1A1830;font-style:italic;">Something has been watching since before you arrived. It is not concerned with stages.</p>
        <p style="margin:16px 0 0 0;font-size:11px;color:#333333;">&#169; 2025 Ibhaveda &nbsp;&middot;&nbsp; <a href="${FEED_URL}" style="color:#7C3AED;text-decoration:none;">Visit Platform</a></p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

// Checks if the user has created a venture yet (used to guard Email 1)
export const _userHasVenture = internalQuery({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }): Promise<boolean> => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();
    if (!user) return false;
    const venture = await ctx.db
      .query("ventures")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();
    return venture !== null;
  },
});

// Scheduled 25 minutes after sign-up. Only sends if no venture has been created yet.
export const sendDelayedWelcomeEmail = internalAction({
  args: {
    email: v.string(),
    name: v.string(),
    clerkId: v.string(),
  },
  handler: async (ctx, { email, name, clerkId }) => {
    const apiKey = process.env.RESEND_WELCOME_API_KEY;
    if (!apiKey) throw new Error("RESEND_WELCOME_API_KEY is not configured");

    // If the user already created a venture, Email 2 was sent — skip Email 1
    const hasVenture = await ctx.runQuery(internal.emailWelcome._userHasVenture, { clerkId });
    if (hasVenture) return;

    const displayName = name || "Adventurer";
    const subject = `${displayName}, the quest is waiting.`;
    return await dispatchEmail(apiKey, email, subject, buildImmediateWelcomeHtml(displayName));
  },
});

export const sendOnboardingCompleteEmail = internalAction({
  args: {
    email: v.string(),
    displayName: v.string(),
    projectName: v.string(),
    templateId: v.string(),
    bossId: v.number(),
    bossHealthPercent: v.number(),
  },
  handler: async (_ctx, { email, displayName, projectName, templateId, bossId, bossHealthPercent }) => {
    const apiKey = process.env.RESEND_WELCOME_API_KEY;
    if (!apiKey) throw new Error("RESEND_WELCOME_API_KEY is not configured");

    const boss = BOSS_EMAIL_DATA[bossId] ?? BOSS_EMAIL_DATA[1];
    const subject = `${boss.name} is barely scratched. ${projectName} is just getting started.`;
    const html = buildFullWelcomeHtml({
      userName: displayName || email.split("@")[0],
      projectName,
      templateId: (templateId as TemplateId) ?? "venture",
      bossId,
      bossHealthPercent,
    });

    return await dispatchEmail(apiKey, email, subject, html);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST ACTION — triggerable from Convex dashboard
// ─────────────────────────────────────────────────────────────────────────────

export const sendTestWelcomeEmail = action({
  args: {},
  handler: async (_ctx) => {
    const apiKey = process.env.RESEND_WELCOME_API_KEY;
    if (!apiKey) throw new Error("RESEND_WELCOME_API_KEY is not configured");

    const mock: FullWelcomeData = {
      userName: "Aryan",
      projectName: "Ibhaveda",
      templateId: "venture",
      bossId: 8, // The Gravemind
      bossHealthPercent: 93,
    };

    const boss = BOSS_EMAIL_DATA[8];
    const subject = `${boss.name} is barely scratched. ${mock.projectName} is just getting started.`;
    const html = buildFullWelcomeHtml(mock);

    return await dispatchEmail(apiKey, "aryanvawasthi@gmail.com", subject, html);
  },
});
