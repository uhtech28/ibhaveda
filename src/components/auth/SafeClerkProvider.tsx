/**
 * @file SafeClerkProvider.tsx
 * @description Wrapper around @clerk/nextjs ClerkProvider that skips
 *   initialization entirely when NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not
 *   present in the environment. Children render as a plain fragment, so
 *   the build's static-prerender pass on any Clerk-touching page (feed,
 *   calendar, community, map, etc.) succeeds even without Clerk env.
 *
 *   Vercel prod / any environment with the real key: identical behaviour
 *   to importing ClerkProvider directly. This is a pure passthrough there.
 *
 *   Aryan's CI (no env): ClerkProvider is not mounted. Auth-dependent
 *   pages render placeholder UI (no useUser context), but the build
 *   completes. His deployed site will still throw at runtime unless he
 *   adds the env var — that's a config task, not something code can fix.
 *
 *   NOTE: this is a build-safety net, not a runtime workaround. Prod MUST
 *   set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` for the app to actually work.
 */

import { ClerkProvider, type ClerkProviderProps } from "@clerk/nextjs";

export function SafeClerkProvider({ children, ...rest }: ClerkProviderProps) {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!key) {
    // CI/prerender fallback: no key, no ClerkProvider. Children render
    // without auth context — that's fine for static prerender because
    // Clerk hooks return undefined and pages usually gate on isLoaded.
    if (typeof window === "undefined") {
      // eslint-disable-next-line no-console
      console.warn(
        "[SafeClerkProvider] NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY missing at prerender — Clerk skipped. Set the env var for the deployed environment to actually work.",
      );
    }
    return <>{children}</>;
  }
  return <ClerkProvider {...rest}>{children}</ClerkProvider>;
}
