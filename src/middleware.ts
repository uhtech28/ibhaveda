import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { api } from '@convex/_generated/api'
import { ConvexHttpClient } from 'convex/browser'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

const isPublicRoute = createRouteMatcher(['/', '/sign-in(.*)', '/sign-up(.*)', '/onboarding', '/profile-setup'])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()

    // Check profile completion for feed routes
    const isFeedRoute = createRouteMatcher(['/feed(.*)', '/my-feed(.*)'])
    if (isFeedRoute(req)) {
      const { userId } = await auth()
      if (userId) {
        const isProfileComplete = await convex.query(api.users.isProfileComplete, { clerkId: userId })
        if (!isProfileComplete) {
          return NextResponse.redirect(new URL('/profile-setup', req.url))
        }
      }
    }
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
