import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { api } from '@convex/_generated/api'
import { ConvexHttpClient } from 'convex/browser'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

const isPublicRoute = createRouteMatcher([
  '/',
  '/contact',
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

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()

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
        const isProfileComplete = await convex.query(api.users.isProfileComplete, { clerkId: userId })

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
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js|jpe?g|webp|png|gif|svg|ico|ttf|woff2?|csv|docx?|xlsx?|zip|webmanifest|vcf)).*)',
    '/(api|trpc)(.*)',
  ],
}
