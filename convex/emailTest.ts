// Development-only helper for previewing re-engagement emails without triggering the full cron.
// Run this from the Convex dashboard (Functions → emailTest → sendTestReengagementEmail)
// by passing any email address you want to receive the preview at.

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { buildReengagementEmail } from "./emailTemplates";

export const sendTestReengagementEmail = internalAction({
  args: {
    toEmail: v.string(), // e.g. "you@gmail.com"
  },
  handler: async (ctx, { toEmail }) => {
    const html = buildReengagementEmail(
      "Alex",
      12,
      [
        { message: "Sarah commented on your idea 'AI Tutor App'", type: "comment" },
        { message: "Your idea 'GreenMap' received 5 new sparks!", type: "spark" },
        { message: "You've been invited to collaborate on 'MedTrack'", type: "invitation" },
      ],
      [
        { ventureName: "EduTech Platform", currentStage: 3, currentCheckpoint: 2 },
        { ventureName: "Carbon Tracker", currentStage: 5, currentCheckpoint: 1 },
      ],
      { newVenturesThisWeek: 14 }
    );

    await ctx.runAction(internal.resend.sendEmail, {
      to: toEmail,
      subject: "[TEST] Re-engagement email preview — Interactive Ideas",
      html,
    });

    console.log(`Test re-engagement email sent to ${toEmail}`);
    return { success: true, sentTo: toEmail };
  },
});
