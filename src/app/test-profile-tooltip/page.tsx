"use client"

import React from "react"
import { DetailedProfileView } from "@/components/user/DetailedProfileView"
import { TooltipProvider } from "@/components/ui/tooltip"

// Mock profile data for testing
const mockProfile = {
  _id: "test-id",
  clerkId: "test-clerk-id",
  username: "testuser",
  displayName: "Test User",
  bio: "This is a test bio for tooltip testing.",
  avatar: "",
  industry: "Technology",
  skills: ["JavaScript", "React", "TypeScript"],
  completedOnboarding: true,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ideasCreated: 5,
  ideasSparked: 3,
  ideasContributed: 7,
}

const mockFormData = {
  displayName: "Test User",
  bio: "This is a test bio for tooltip testing.",
  avatar: "",
  industry: "Technology",
  skills: ["JavaScript", "React", "TypeScript"],
  username: "testuser",
}

export default function TestProfileTooltip() {
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Profile Metrics Tooltip Test</h1>
          <p className="text-muted-foreground mb-8">
            This page is for testing the profile metrics tooltips. Hover over the numbers below to see the tooltips.
          </p>

          <DetailedProfileView
            profile={mockProfile}
            username="testuser"
            isEditing={false}
            setIsEditing={() => {}}
            formData={mockFormData}
            setFormData={() => {}}
            myRequests={[]}
            incomingRequests={[]}
          />
        </div>
      </div>
    </TooltipProvider>
  )
}