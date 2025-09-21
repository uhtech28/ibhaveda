"use client"

import React, { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { CompactProfileView } from "@/components/user/CompactProfileView"
import { DetailedProfileView } from "@/components/user/DetailedProfileView"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { HeroHeader } from "@/components/header"
import { Spinner } from "@/components/ui/spinner"
import FooterSection from "@/components/footer"

// Local UserProfile interface for demonstration
interface UserProfile {
  _id: string;
  clerkId: string;
  username: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  industry?: string;
  skills: string[];
  completedOnboarding: boolean;
  createdAt: number;
  updatedAt: number;
  ideasCreated?: number;
  ideasSparked?: number;
  ideasContributed?: number;
}

// Mock profile removed - using only real data from Convex

export default function ProfilePage() {
  const params = useParams()
  const username = params.username as string
  const { user } = useUser()

  // Convex data
    const realProfile = useQuery(api.users.getUserProfile, { username })
    const myRequests = useQuery(api.contributionRequests.getMyRequests)
    const incomingRequests = useQuery(api.contributionRequests.getIncomingRequests)

  // Check if this is current user's profile
  const isCurrentUser = user?.username === username

  // Local state
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    // Use only real Convex data
    return realProfile as UserProfile || null
  })

  // At this point, realProfile is loaded and not null, so profileData is safe to use

  const [formData, setFormData] = useState({
    displayName: "",
    bio: "",
    avatar: "",
    industry: "",
    skills: [] as string[],
    username: "",
  })

  // Update profile when Convex data loads
  useEffect(() => {
    console.log('Profile page loading:', { username, realProfile });
    if (realProfile) {
      console.log('🎯 Found real user profile from Convex:', realProfile);
      setProfile(realProfile as UserProfile);
    }
  }, [realProfile, username]);

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      console.log('🎯 Initializing form with profile:', profile);
      setFormData({
        displayName: profile.displayName,
        bio: profile.bio || "",
        avatar: profile.avatar || "",
        industry: profile.industry || "",
        skills: profile.skills || [],
        username: profile.username,
      })
    }
  }, [profile])


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
const profileData = realProfile as UserProfile

return (
  <div className="min-h-screen flex flex-col bg-background">
    <HeroHeader />

    <main className="flex-1 container mx-auto px-4 py-12 pt-20">
      {isCurrentUser ? (
        <DetailedProfileView
          profile={profileData}
          username={username}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          formData={formData}
          setFormData={setFormData}
          myRequests={myRequests}
          incomingRequests={incomingRequests}
        />
      ) : (
        <CompactProfileView profile={profileData} />
      )}

    </main>

    <FooterSection />
  </div>
  )
}

