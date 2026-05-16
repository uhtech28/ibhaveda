import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { api } from '@convex/_generated/api'
import { ConvexHttpClient } from 'convex/browser'

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexHttpClient(convexUrl) : null;

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

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()

    // Check profile completion for ALL authenticated routes
    const { userId } = await auth()
    
    if (userId) {
      // Check if user is already on the profile setup page to avoid infinite redirect
      // We also check for api/trpc routes to avoid breaking backend calls
      const isProfileSetupPage = req.nextUrl.pathname === '/profile-setup';
      const isApiRoute = req.nextUrl.pathname.startsWith('/api') || req.nextUrl.pathname.startsWith('/trpc');
      
      if (!isProfileSetupPage && !isApiRoute && convex) {
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
    '/((?!_next|[^?]*\\.(?:html?|css|js|jpe?g|webp|png|gif|svg|ico|ttf|woff2?|csv|docx?|xlsx?|zip|webmanifest|vcf)).*)',
    '/(api|trpc)(.*)',
  ],
}
