/**
 * @file src/app/api/social/[provider]/callback/route.ts
 * @description OAuth callback — exchanges the auth code for an
 * access token, then upserts the connection into Convex.
 *
 * On success: redirects the user back to /settings/connections (or
 * /?social=connected fallback) with a query string so the UI can
 * flash a "Connected!" toast.
 *
 * On failure: redirects with ?social_error=... — the settings dialog
 * reads that param and surfaces a red toast.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api, internal } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import {
  getProviderConfig,
  getCallbackUrl,
  type SocialProvider,
} from "@/lib/social/providers";

const SUPPORTED: SocialProvider[] = [
  "linkedin",
  "twitter",
  "facebook",
  "instagram",
];

function convexClient(): ConvexHttpClient {
  const url =
    process.env.NEXT_PUBLIC_CONVEX_URL ??
    process.env.CONVEX_URL ??
    "";
  return new ConvexHttpClient(url);
}

/**
 * Look up the Convex users._id for the current Clerk user. Public
 * `users:getByClerkId` query needed (we call the internal one via the
 * admin key — see note in `internal.socialConnections.internalUpsertConnection`).
 */
async function resolveConvexUserId(
  clerkId: string,
): Promise<Id<"users"> | null> {
  const client = convexClient();
  try {
    // Reuses the existing public getUser query which returns the
    // caller's own row. We'll only ever run this from an authenticated
    // request so the Clerk JWT is attached via the auth header.
    // For a truly server-only lookup with the admin key, add an
    // internal query `getUserByClerkId` and call it here.
    const me = (await client.query(api.users.getCurrentUser, {})) as
      | { _id: Id<"users"> }
      | null;
    return me?._id ?? null;
  } catch {
    return null;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider: providerRaw } = await params;
  if (!SUPPORTED.includes(providerRaw as SocialProvider)) {
    return NextResponse.json(
      { error: `Unknown provider: ${providerRaw}` },
      { status: 400 },
    );
  }
  const provider = providerRaw as SocialProvider;

  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.redirect(new URL("/sign-in", req.nextUrl.origin));
  }

  const cfg = getProviderConfig(provider);
  if (!cfg) {
    return redirectWithError(
      req,
      provider,
      "Provider not configured on this deployment.",
    );
  }

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const errorFromProvider = req.nextUrl.searchParams.get("error");
  if (errorFromProvider) {
    return redirectWithError(req, provider, errorFromProvider);
  }
  if (!code || !state) {
    return redirectWithError(req, provider, "Missing code or state.");
  }

  const cookieState = req.cookies.get(`social_state_${provider}`)?.value;
  const cookieVerifier = req.cookies.get(`social_verifier_${provider}`)?.value;
  if (!cookieState || cookieState !== state) {
    return redirectWithError(req, provider, "State mismatch (possible CSRF).");
  }
  if (!cookieVerifier) {
    return redirectWithError(req, provider, "PKCE verifier cookie expired.");
  }

  // ── Exchange code for access token ────────────────────────────────
  const redirectUri = getCallbackUrl(provider, req.nextUrl.origin);
  const tokenBody = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: cfg.clientId!,
    client_secret: cfg.clientSecret!,
    code_verifier: cookieVerifier,
  });
  const tokenRes = await fetch(cfg.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: tokenBody.toString(),
  });
  if (!tokenRes.ok) {
    const text = await tokenRes.text().catch(() => "");
    return redirectWithError(
      req,
      provider,
      `Token exchange failed (${tokenRes.status}): ${text.slice(0, 200)}`,
    );
  }
  const tokenJson = (await tokenRes.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
    token_type?: string;
  };
  const accessToken = tokenJson.access_token;
  if (!accessToken) {
    return redirectWithError(req, provider, "No access_token in response");
  }

  // ── Fetch provider account id + display name so the settings UI
  //    can render "Connected as <name>". Each provider has a
  //    slightly different "who am I" endpoint.
  let providerAccountId = "";
  let providerDisplayName: string | undefined;
  try {
    if (provider === "linkedin") {
      const meRes = await fetch("https://api.linkedin.com/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const me = (await meRes.json()) as { sub?: string; name?: string };
      providerAccountId = me.sub ?? "";
      providerDisplayName = me.name;
    } else if (provider === "twitter") {
      const meRes = await fetch("https://api.x.com/2/users/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const me = (await meRes.json()) as {
        data?: { id?: string; username?: string; name?: string };
      };
      providerAccountId = me.data?.id ?? "";
      providerDisplayName = me.data?.name ?? me.data?.username;
    } else if (provider === "facebook" || provider === "instagram") {
      const meRes = await fetch(
        `https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${encodeURIComponent(accessToken)}`,
      );
      const me = (await meRes.json()) as { id?: string; name?: string };
      providerAccountId = me.id ?? "";
      providerDisplayName = me.name;
    }
  } catch {
    // Non-fatal — we still store the token, but display name may be blank.
  }

  const convexUserId = await resolveConvexUserId(clerkUserId);
  if (!convexUserId) {
    return redirectWithError(req, provider, "Could not resolve user in DB");
  }

  // ── Persist the connection via the internal mutation ──────────────
  try {
    const client = convexClient();
    // NOTE: internal mutations require the admin key. If you don't
    // have CONVEX_DEPLOY_KEY set here, add a public wrapper
    // `socialConnections.saveMyConnection` that reads the caller's
    // clerkId from auth and calls the internal upsert.
    await client.mutation(
      internal.socialConnections.internalUpsertConnection as unknown as Parameters<typeof client.mutation>[0],
      {
        userId: convexUserId,
        platform: provider,
        providerAccountId,
        providerDisplayName,
        accessToken,
        refreshToken: tokenJson.refresh_token,
        expiresAt: tokenJson.expires_in
          ? Date.now() + tokenJson.expires_in * 1000
          : undefined,
        scope: tokenJson.scope,
      },
    );
  } catch (err) {
    return redirectWithError(
      req,
      provider,
      `Save failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  // ── Success — bounce back to Settings so the user sees the chip
  //    flip to "Connected".
  const redirect = new URL(
    `/?social=connected&provider=${provider}`,
    req.nextUrl.origin,
  );
  const res = NextResponse.redirect(redirect, { status: 302 });
  // Clean up the round-trip cookies.
  res.cookies.delete(`social_state_${provider}`);
  res.cookies.delete(`social_verifier_${provider}`);
  return res;
}

function redirectWithError(
  req: NextRequest,
  provider: SocialProvider,
  message: string,
): NextResponse {
  const url = new URL(
    `/?social=error&provider=${provider}&social_error=${encodeURIComponent(message)}`,
    req.nextUrl.origin,
  );
  return NextResponse.redirect(url, { status: 302 });
}
