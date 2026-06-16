/**
 * HTTP router for Convex.
 *
 * Routes:
 *   POST /clerk-webhook — handles Clerk user lifecycle events
 *     • user.created → send immediate welcome email (before onboarding)
 *
 * Verification uses the CLERK_WEBHOOK_SECRET env var via the svix library,
 * which is the standard Clerk-recommended approach.
 */

import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Webhook } from "svix";

const http = httpRouter();

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return new Response("CLERK_WEBHOOK_SECRET not configured", { status: 500 });
    }

    // Collect svix signature headers
    const svixId = request.headers.get("svix-id");
    const svixTimestamp = request.headers.get("svix-timestamp");
    const svixSignature = request.headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return new Response("Missing svix headers", { status: 400 });
    }

    const body = await request.text();

    let payload: Record<string, unknown>;
    try {
      const wh = new Webhook(webhookSecret);
      payload = wh.verify(body, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as Record<string, unknown>;
    } catch {
      return new Response("Invalid webhook signature", { status: 401 });
    }

    const eventType = payload.type as string;

    if (eventType === "user.created") {
      const data = payload.data as Record<string, unknown>;
      const emailAddresses = data.email_addresses as Array<{ email_address: string }> | undefined;
      const email = emailAddresses?.[0]?.email_address;

      if (!email) {
        // No email address on the Clerk user — nothing to send
        return new Response("ok", { status: 200 });
      }

      const firstName = (data.first_name as string | null) ?? "";
      const lastName = (data.last_name as string | null) ?? "";
      const name = [firstName, lastName].filter(Boolean).join(" ") || "Adventurer";

      // Schedule Email 1 for 25 minutes — it will self-cancel if the user
      // creates a venture before then (in which case Email 2 fires instead).
      await ctx.scheduler.runAfter(
        25 * 60 * 1000,
        internal.emailWelcome.sendDelayedWelcomeEmail,
        { email, name, clerkId: (data.id as string) ?? "" },
      );
    }

    return new Response("ok", { status: 200 });
  }),
});

export default http;
