import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

export const resendWebhook = httpAction(async (ctx, request) => {
  const body = await request.json();
  const { type, data } = body;

  const eventMap: Record<string, string> = {
    "email.sent": "sent",
    "email.delivered": "delivered",
    "email.opened": "opened",
    "email.clicked": "clicked",
    "email.bounced": "bounced",
    "email.complained": "complained",
  };

  const eventType = eventMap[type];
  if (!eventType) return new Response("Unknown event type", { status: 200 });

  const recipientEmail = data.to?.[0] ?? data.email ?? "";
  const user = await ctx.runQuery(api.analytics.getUserByEmail, {
    email: recipientEmail,
  });

  await ctx.runMutation(api.analytics.logEmailEvent, {
    userId: user?._id,
    resendEmailId: data.email_id ?? data.id ?? "unknown",
    campaignType: data.tags?.campaign_type ?? "unknown",
    event: eventType,
    clickUrl: data.click?.link ?? undefined,
    timestamp: Date.now(),
    recipientEmail,
  });

  return new Response("OK", { status: 200 });
});
