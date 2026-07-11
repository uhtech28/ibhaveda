import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { api } from '@convex/_generated/api'
import { ConvexHttpClient } from 'convex/browser'

// Resilient Convex client: don't crash at module load if the env var
// is missing on this environment (e.g. Vercel Preview without full env).
// The profile-complete check just becomes a no-op in that case, letting
// requests through instead of throwing MIDDLEWARE_INVOCATION_FAILED.
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL
const convex = CONVEX_URL ? new ConvexHttpClient(CONVEX_URL) : null

const isPublicRoute = createRouteMatcher([
  '/',
  '/demo(.*)',
  '/contact',
  '/api/vcard',
  '/intro-preview',
  '/aryan-awasthi.vcf',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/onboarding',
  '/profile-setup',
  '/robots.txt',
  '/sitemap.xml',
  '/articles',
  '/venture-creation(.*)',
  '/startup-execution(.*)',
  '/founder-collaboration(.*)',
  '/open-innovation(.*)',
  '/future-of-entrepreneurship(.*)',
])

/** Cookie name for the profile-complete cache flag */
const PROFILE_COMPLETE_COOKIE = 'vq_profile_complete'
/** How long (seconds) to trust the cached value before re-checking Convex */
const CACHE_TTL_SECONDS = 300 // 5 minutes

// Are Clerk env vars present? If not, we cannot construct the Clerk
// middleware without crashing. Fall back to a pass-through in that
// case so the app at least LOADS for a demo.
const CLERK_PK = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
const CLERK_SK = process.env.CLERK_SECRET_KEY
const CLERK_READY = Boolean(CLERK_PK && CLERK_SK)

// Pass-through middleware used when Clerk isn't configured. All routes
// are treated as public; auth-gated pages will handle their own gate
// client-side.
const passThroughMiddleware = () => NextResponse.next()

const clerkGuardedMiddleware = clerkMiddleware(async (auth, req) => {
  try {
    // Redirect authenticated users away from the landing page to the feed
    if (req.nextUrl.pathname === '/') {
      const { userId } = await auth()
      if (userId) {
        return NextResponse.redirect(new URL('/feed', req.url))
      }
    }

    if (!isPublicRoute(req)) {
      await auth.protect({ unauthenticatedUrl: new URL('/', req.url).toString() })

      const { userId } = await auth()

      if (userId) {
        const isProfileSetupPage = req.nextUrl.pathname === '/profile-setup'
        const isApiRoute = req.nextUrl.pathname.startsWith('/api') || req.nextUrl.pathname.startsWith('/trpc')

        if (!isProfileSetupPage && !isApiRoute) {
          // ── Fast path: check cookie cache first ──────────────────────────────
          const cachedValue = req.cookies.get(PROFILE_COMPLETE_COOKIE)?.value
          if (cachedValue === '1') {
            // Profile was complete within the last CACHE_TTL_SECONDS — skip Convex call
            return NextResponse.next()
          }

          // ── Slow path: query Convex (once per TTL per browser session) ───────
          // If Convex isn't configured on this environment, let the request
          // through rather than blocking with a redirect loop.
          if (!convex) {
            return NextResponse.next()
          }

          let isProfileComplete = true
          try {
            isProfileComplete = await convex.query(
              api.users.isProfileComplete,
              { clerkId: userId },
            )
          } catch (err) {
            // Convex unavailable (network / auth / schema mismatch) — do NOT
            // 500 the whole app. Assume profile is complete for this request;
            // the /profile-setup page has its own client-side gate anyway.
            console.error('[middleware] Convex isProfileComplete failed:', err)
            return NextResponse.next()
          }

          if (!isProfileComplete) {
            return NextResponse.redirect(new URL('/profile-setup', req.url))
          }

          // Cache the positive result so subsequent requests skip the Convex call
          const response = NextResponse.next()
          response.cookies.set(PROFILE_COMPLETE_COOKIE, '1', {
            httpOnly: true,
            sameSite: 'lax',
            maxAge: CACHE_TTL_SECONDS,
            path: '/',
            // Use secure in production
            secure: process.env.NODE_ENV === 'production',
          })
          return response
        }
      }
    }
  } catch (err) {
    // Absolute last-resort catch: whatever failed inside the middleware,
    // do not return a 500. Log and let the request through so the page
    // renders (even if it's just the landing / sign-in).
    console.error('[middleware] Fatal error caught, passing through:', err)
    return NextResponse.next()
  }
})

// Export the guarded middleware only if Clerk is ready; otherwise a
// no-op that always allows the request. This means the entire app is
// unauthenticated in that fallback state — fine for a static demo,
// unsafe for production. Set both Clerk env vars to restore auth.
const middleware = CLERK_READY ? clerkGuardedMiddleware : passThroughMiddleware
export default middleware

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js|jpe?g|webp|png|gif|svg|ico|ttf|woff2?|csv|docx?|xlsx?|zip|webmanifest|vcf)).*)',
    '/(api|trpc)(.*)',
  ],
}
