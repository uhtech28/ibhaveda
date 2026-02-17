"use client"

import React from "react"
import { useParams } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { CompactProfileView } from "@/components/user/CompactProfileView"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { HeroHeader } from "@/components/header"
import { Spinner } from "@/components/ui/spinner"
import FooterSection from "@/components/footer"
import type { UserProfile } from "../../../../convex/users"

export default function ProfilePage() {
  const params = useParams()
  const username = params.username as string
  // Convex data
  const currentUser = useQuery(api.users.getCurrentUser)
  const realProfile = useQuery(api.users.getUserProfile, { username })
  const myRequests = useQuery(api.contributionRequests.getMyRequests, currentUser ? {} : "skip")
  const incomingRequests = useQuery(api.contributionRequests.getIncomingRequests, currentUser ? {} : "skip")
  // Fetch public ideas for the profile being viewed (skip if profile not yet loaded)
  const publicIdeas = useQuery(api.ideas.getPublicIdeasForUser, realProfile ? { userId: realProfile._id } : "skip")

  // Check if this is current user's profile
  const isCurrentUser = !!(currentUser && realProfile && currentUser._id === realProfile._id)




  // Loading state - show spinner while fetching profile
  if (realProfile === undefined) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <HeroHeader />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <Spinner />
            <p className="text-muted-foreground mt-4">Loading profile...</p>
          </div>
        </main>
        <FooterSection />
      </div>
    )
  }
  if (realProfile === null) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <HeroHeader />
        <main className="flex-1 flex items-center justify-center px-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-destructive mb-2">Profile Not Found</h1>
                <p className="text-muted-foreground mb-4">
                  The user @{username} doesn't exist or has not set up their profile.
                </p>
                <Button variant="outline" onClick={() => window.history.back()}>
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <FooterSection />
      </div>
    )
  }

  // At this point, realProfile is loaded and not null
  const profileData = { ...realProfile, skills: realProfile.skills || [], industries: realProfile.industries || [] } as UserProfile

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <HeroHeader />

      <main className="flex-1 container mx-auto px-4 py-12 pt-32">
        <CompactProfileView
          profile={profileData}
          isOwner={isCurrentUser}
          myRequests={myRequests}
          incomingRequests={incomingRequests}
        />
      </main>

      <FooterSection />
    </div>
  )
}
