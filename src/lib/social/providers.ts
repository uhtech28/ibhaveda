/**
 * @file src/lib/social/providers.ts
 * @description Per-provider OAuth config for the "Double Posting"
 * feature. Everything here is server-side only — client ID / secret /
 * scopes / endpoints all live in one place so the two API routes
 * (`/api/social/[provider]/connect` and `/callback`) stay lean.
 *
 * Add credentials via env vars (see the required-env comment on each
 * provider). Missing credentials cause the /connect route to return
 * a 501 with a clear error — the app still runs, just the platform
 * is disabled.
 *
 * Reference docs per provider:
 *   LinkedIn : https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow
 *   X        : https://docs.x.com/resources/fundamentals/authentication/oauth-2-0/user-access-token
 *   Facebook : https://developers.facebook.com/docs/facebook-login/guides/access-tokens
 *   Instagram: https://developers.facebook.com/docs/instagram-basic-display-api  (deprecated for publishing)
 */

export type SocialProvider =
  | "linkedin"
  | "twitter"
  | "facebook"
  | "instagram";

export interface ProviderOAuthConfig {
  provider: SocialProvider;
  authorizeUrl: string;
  tokenUrl: string;
  scopes: string[];
  clientId?: string;
  clientSecret?: string;
  /** Provider-specific extras (e.g. Twitter PKCE) exposed via helpers below. */
}

// ─────────────────────────────────────────────────────────────────────
// Env-based config loader
// ─────────────────────────────────────────────────────────────────────

function envOrUndef(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

/**
 * Returns config for the requested provider, or `null` if credentials
 * aren't configured (route handler should return 501 with a helpful
 * message pointing at .env).
 */
export function getProviderConfig(
  provider: SocialProvider,
): ProviderOAuthConfig | null {
  switch (provider) {
    case "linkedin": {
      const clientId = envOrUndef("LINKEDIN_CLIENT_ID");
      const clientSecret = envOrUndef("LINKEDIN_CLIENT_SECRET");
      if (!clientId || !clientSecret) return null;
      return {
        provider,
        authorizeUrl: "https://www.linkedin.com/oauth/v2/authorization",
        tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
        // openid + profile + email → so we can fetch the user's
        // person URN via /v2/userinfo. w_member_social → publish.
        scopes: ["openid", "profile", "email", "w_member_social"],
        clientId,
        clientSecret,
      };
    }
    case "twitter": {
      const clientId = envOrUndef("TWITTER_CLIENT_ID");
      const clientSecret = envOrUndef("TWITTER_CLIENT_SECRET");
      if (!clientId || !clientSecret) return null;
      return {
        provider,
        authorizeUrl: "https://twitter.com/i/oauth2/authorize",
        tokenUrl: "https://api.twitter.com/2/oauth2/token",
        scopes: [
          "tweet.read",
          "tweet.write",
          "users.read",
          "offline.access",
        ],
        clientId,
        clientSecret,
      };
    }
    case "facebook": {
      const clientId = envOrUndef("FACEBOOK_CLIENT_ID");
      const clientSecret = envOrUndef("FACEBOOK_CLIENT_SECRET");
      if (!clientId || !clientSecret) return null;
      return {
        provider,
        authorizeUrl: "https://www.facebook.com/v19.0/dialog/oauth",
        tokenUrl:
          "https://graph.facebook.com/v19.0/oauth/access_token",
        // publish_actions is deprecated; page-posting requires
        // pages_manage_posts + pages_read_engagement. Personal-profile
        // posts are restricted by Meta.
        scopes: ["public_profile", "email"],
        clientId,
        clientSecret,
      };
    }
    case "instagram": {
      const clientId = envOrUndef("INSTAGRAM_CLIENT_ID");
      const clientSecret = envOrUndef("INSTAGRAM_CLIENT_SECRET");
      if (!clientId || !clientSecret) return null;
      return {
        provider,
        // Instagram OAuth via Facebook Login → returns an IG User ID
        // usable with the Graph API's Business endpoints.
        authorizeUrl: "https://api.instagram.com/oauth/authorize",
        tokenUrl: "https://api.instagram.com/oauth/access_token",
        scopes: ["user_profile", "user_media"],
        clientId,
        clientSecret,
      };
    }
    default:
      return null;
  }
}

/**
 * Compute the callback URL for a provider. Points at
 * `/api/social/[provider]/callback` on the current site.
 */
export function getCallbackUrl(
  provider: SocialProvider,
  origin: string,
): string {
  return `${origin.replace(/\/$/, "")}/api/social/${provider}/callback`;
}

// ─────────────────────────────────────────────────────────────────────
// PKCE helpers (Twitter OAuth2 PKCE requires them; safe for LinkedIn
// too — LinkedIn just ignores the extra params).
// ─────────────────────────────────────────────────────────────────────

/** RFC 7636 §4.1: 43-128 char URL-safe verifier string. */
export function generatePkceVerifier(): string {
  const bytes = new Uint8Array(64);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

/** RFC 7636 §4.2: SHA-256 the verifier, base64url encode. */
export async function pkceChallengeFromVerifier(
  verifier: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(digest));
}

function base64UrlEncode(bytes: Uint8Array): string {
  const b64 = Buffer.from(bytes).toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
