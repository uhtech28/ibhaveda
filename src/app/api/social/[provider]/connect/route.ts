/**
 * @file src/app/api/social/[provider]/connect/route.ts
 * @description OAuth "initiate" endpoint. Redirects the browser to
 * the provider's authorize URL with the right scopes + state + PKCE.
 *
 * Called when user clicks "Connect" on a platform card in the
 * Settings dialog. The provider will bounce back to
 * /api/social/[provider]/callback with a `code` we exchange for a
 * token.
 *
 * State/PKCE storage: we set an httpOnly cookie for the round-trip.
 * That cookie is read by the callback route to verify the OAuth
 * response wasn't spoofed and to send the same PKCE verifier back to
 * the token endpoint.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  getProviderConfig,
  getCallbackUrl,
  generatePkceVerifier,
  pkceChallengeFromVerifier,
  type SocialProvider,
} from "@/lib/social/providers";

const SUPPORTED: SocialProvider[] = [
  "linkedin",
  "twitter",
  "facebook",
  "instagram",
];

const COOKIE_MAX_AGE_SEC = 60 * 15; // 15 min — plenty for OAuth roundtrip

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

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const cfg = getProviderConfig(provider);
  if (!cfg) {
    return NextResponse.json(
      {
        error: `${provider} is not configured. Set ${provider.toUpperCase()}_CLIENT_ID and ${provider.toUpperCase()}_CLIENT_SECRET in your environment.`,
      },
      { status: 501 },
    );
  }

  const origin = req.nextUrl.origin;
  const redirectUri = getCallbackUrl(provider, origin);

  // Nonce protects against CSRF on the callback.
  const state = crypto.randomUUID();
  // PKCE — required by Twitter, ignored by others but doesn't hurt.
  const verifier = generatePkceVerifier();
  const challenge = await pkceChallengeFromVerifier(verifier);

  const authorize = new URL(cfg.authorizeUrl);
  authorize.searchParams.set("client_id", cfg.clientId!);
  authorize.searchParams.set("redirect_uri", redirectUri);
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("scope", cfg.scopes.join(" "));
  authorize.searchParams.set("state", state);
  authorize.searchParams.set("code_challenge", challenge);
  authorize.searchParams.set("code_challenge_method", "S256");

  const res = NextResponse.redirect(authorize.toString(), { status: 302 });
  // httpOnly cookies survive the OAuth round-trip and are read by
  // the callback route. Same-site=lax so provider redirects work.
  res.cookies.set(`social_state_${provider}`, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SEC,
  });
  res.cookies.set(`social_verifier_${provider}`, verifier, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SEC,
  });
  return res;
}
