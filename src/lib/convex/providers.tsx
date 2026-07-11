"use client"

import { useEffect, useRef } from "react"
import { ConvexProviderWithClerk } from "convex/react-clerk"
import { useAuth } from "@clerk/nextjs"
import { useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import convex from "./client"

interface ConvexProviderProps {
  children: React.ReactNode
}

export function ConvexClientProvider({ children }: ConvexProviderProps) {
  // If Convex isn't configured on this environment (e.g. Preview
  // deployment without NEXT_PUBLIC_CONVEX_URL) skip the provider and
  // render children directly. Convex-dependent hooks will fail
  // gracefully at their call sites instead of crashing the whole app
  // during hydration.
  if (!convex) {
    return <>{children}</>
  }
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <TimezoneSync />
      {children}
    </ConvexProviderWithClerk>
  )
}

/**
 * PRD §9 AC4 — push the user's IANA timezone (e.g. "America/New_York")
 * to Convex once per session so streak day-boundary math runs in the
 * user's local day, not UTC. Runs once after auth resolves; skipped
 * for signed-out visitors.
 */
function TimezoneSync() {
  const { isSignedIn, isLoaded } = useAuth()
  const setMyTimezone = useMutation(api.streaks.setMyTimezone)
  const fired = useRef(false)

  useEffect(() => {
    if (!isLoaded || !isSignedIn || fired.current) return
    let tz = ""
    try {
      tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""
    } catch {
      tz = ""
    }
    if (!tz) return
    fired.current = true
    setMyTimezone({ timezone: tz }).catch(() => {
      // Streak TZ sync is non-critical — silent failure is fine. The
      // server falls back to UTC for any user without a cached zone.
      fired.current = false
    })
  }, [isLoaded, isSignedIn, setMyTimezone])

  return null
}
