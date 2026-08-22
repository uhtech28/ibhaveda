/**
 * @file SafeClerkProvider.tsx
 * @description Wrapper around @clerk/nextjs ClerkProvider that supplies a
 *   format-valid dummy publishableKey when NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
 *   is missing (e.g. Aryan's CI). This lets the static-prerender pass
 *   complete without throwing "Missing publishableKey" or "useUser can only
 *   be used within <ClerkProvider>" errors on pages like /calendar, /feed,
 *   /community that use Clerk hooks.
 *
 *   Vercel prod / any env with the real key: real key wins, behaviour is
 *   identical to raw ClerkProvider.
 *
 *   The dummy key `pk_test_ZHVtbXktY2kuYnVpbGQk` decodes to `dummy-ci.build$`
 *   which is Clerk's expected format (`base64url(<domain>$)` after the
 *   `pk_test_` prefix). Clerk accepts it as syntactically valid but never
 *   makes network calls during prerender, so the build succeeds. In a
 *   deployment that runs this key at runtime, actual auth calls would fail
 *   at the network layer — but that's the correct behaviour: deployments
 *   must set the real env var to actually work.
 */

import { ClerkProvider, type ClerkProviderProps } from "@clerk/nextjs";

// base64url("dummy-ci.build$") — Clerk's expected format for pk_test_<data>
const DUMMY_BUILD_KEY = "pk_test_ZHVtbXktY2kuYnVpbGQk";

export function SafeClerkProvider({ children, ...rest }: ClerkProviderProps) {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || DUMMY_BUILD_KEY;
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && typeof window === "undefined") {
    // eslint-disable-next-line no-console
    console.warn(
      "[SafeClerkProvider] Using dummy publishableKey — NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY not set. Deployment auth will fail until real env is provided.",
    );
  }
  return <ClerkProvider {...rest} publishableKey={key}>{children}</ClerkProvider>;
}
