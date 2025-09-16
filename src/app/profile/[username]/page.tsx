"use client"

import React, { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { useQuery, useMutation } from "convex/react"
import { Id } from "../../../../convex/_generated/dataModel"
import Link from "next/link"
import { api } from "../../../../convex/_generated/api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AvatarUpload } from "@/components/user/avatar-upload"
import { RequestStatusCard } from "@/components/requests/request-status-card"
import { Plus, X, User, CheckCircle, XCircle } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { industryCardOptions, skillCardOptions } from "@/lib/options"

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
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    // Use only real Convex data
    return realProfile as UserProfile || null
  })

  const [formData, setFormData] = useState({
    displayName: "",
    bio: "",
    avatar: "",
    industry: "",
    skills: [] as string[],
  })
  const [newSkill, setNewSkill] = useState("")

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
      })
    }
  }, [profile])

  const handleSubmit = async () => {
    if (!profile) return

    setLoading(true)
    try {
      // TODO: Integrate with Convex mutation when ready
      console.log("Updating profile:", formData)

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Update the profile state with the new formData
      setProfile(prevProfile => {
        if (!prevProfile) return null
        return {
          ...prevProfile,
          displayName: formData.displayName,
          bio: formData.bio,
          avatar: formData.avatar,
          industry: formData.industry,
          skills: formData.skills,
          updatedAt: Date.now()
        }
      })

      setIsEditing(false)
      alert("Profile updated successfully!")
    } catch (error) {
      console.error("Error updating profile:", error)
      alert("Failed to update profile. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (profile) {
      setFormData({
        displayName: profile.displayName,
        bio: profile.bio || "",
        avatar: profile.avatar || "",
        industry: profile.industry || "",
        skills: profile.skills || [],
      })
    }
    setIsEditing(false)
  }

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }))
      setNewSkill("")
    }
  }

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }))
  }

  if (profile === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-destructive mb-2">Profile Not Found</h1>
              <p className="text-muted-foreground mb-4">
                The user @{username} doesn&#39;t exist or has not set up their profile.
              </p>
              <Button variant="outline" onClick={() => window.history.back()}>
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <Card className="mt-12 mb-6">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
              {/* Avatar Upload Component */}
              <div className="flex-shrink-0">
                <AvatarUpload
                  currentAvatar={formData.avatar}
                  onAvatarChange={(avatarUrl: string) =>
                    setFormData(prev => ({ ...prev, avatar: avatarUrl }))
                  }
                  displayName={formData.displayName}
                />
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="displayName" className="text-sm font-medium">
                        Full Name
                      </Label>
                      <Input
                        id="displayName"
                        value={formData.displayName}
                        onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                        className="mt-1"
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="username" className="text-sm font-medium">
                        Username
                      </Label>
                      <Input
                        id="username"
                        value={`@${username}`}
                        disabled
                        className="mt-1 bg-muted"
                      />
                    </div>

                    <div>
                      <Label htmlFor="bio" className="text-sm font-medium">
                        Bio
                      </Label>
                      <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                        className="mt-1"
                        placeholder="Tell us about yourself..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="industry" className="text-sm font-medium">
                        Industry
                      </Label>
                      <Select
                        value={formData.industry}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, industry: value }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select your industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {industryCardOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h1 className="text-3xl font-bold">{profile.displayName}</h1>
                    <p className="text-xl text-muted-foreground">@{username}</p>
                    {profile.bio && (
                      <p className="text-gray-600 dark:text-gray-300 max-w-2xl">{profile.bio}</p>
                    )}
                    {profile.industry && (
                      <Badge variant="secondary" className="text-sm">
                        {profile.industry}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* User Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="text-center py-6">
              <div className="text-2xl font-bold text-primary">{profile.ideasCreated || 0}</div>
              <div className="text-sm text-muted-foreground">Ideas Created</div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="text-center py-6">
              <div className="text-2xl font-bold text-primary">{profile.ideasSparked || 0}</div>
              <div className="text-sm text-muted-foreground">Ideas Sparked</div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="text-center py-6">
              <div className="text-2xl font-bold text-primary">{profile.ideasContributed || 0}</div>
              <div className="text-sm text-muted-foreground">Ideas Contributed</div>
            </CardContent>
          </Card>
        </div>

        {/* Skills Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Skills</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-4">
                {/* Current Skills */}
                <div className="flex flex-wrap gap-2 min-h-[40px]">
                  {formData.skills.map((skill: string, index: number) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>

                {/* Add New Skill */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Select
                      value={newSkill}
                      onValueChange={setNewSkill}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select a skill to add" />
                      </SelectTrigger>
                      <SelectContent>
                        {skillCardOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      onClick={addSkill}
                      size="sm"
                      disabled={!newSkill || formData.skills.includes(newSkill)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  {newSkill && formData.skills.includes(newSkill) && (
                    <p className="text-sm text-muted-foreground">
                      This skill has already been added.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile.skills.length > 0 ? (
                  profile.skills.map((skill: string, index: number) => (
                    <Badge key={index} variant="outline">
                      {skill}
                    </Badge>
                  ))
                ) : (
                  <p className="text-muted-foreground">No skills added yet.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contribution Requests Section */}
        {isCurrentUser && (
          <>
            {/* For Contributors: Show outgoing requests */}
            {myRequests && myRequests.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>My Contribution Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {myRequests.map((request) => (
                      <RequestStatusCard key={request._id} request={request} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* For Authors: Show incoming requests */}
            {incomingRequests && incomingRequests.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Incoming Contribution Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {incomingRequests.map((request) => (
                      <IncomingRequestCard key={request._id} request={request} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <div>
            {isCurrentUser && !isEditing && (
              <Link href="/profile/contribution-requests">
                <Button variant="outline" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Manage Contribution Requests
                </Button>
              </Link>
            )}
          </div>
          <div className="flex gap-4">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !formData.displayName.trim()}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              isCurrentUser && (
                <Button onClick={() => setIsEditing(true)} className="px-6">
                  Edit Profile
                </Button>
              )
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

// Incoming Request Card for authors
interface ContributionRequest {
  _id: Id<"contributionRequests">;
  contributor: {
    avatar?: string;
    displayName: string;
    username: string;
  } | null;
  status: "accepted" | "rejected" | "pending";
  createdAt: number;
  idea: {
    title: string;
  } | null;
  message: string;
}

// Incoming Request Card for authors
const IncomingRequestCard: React.FC<{ request: ContributionRequest }> = ({ request }) => {
  const updateStatusMutation = useMutation(api.contributionRequests.updateRequestStatus);
  const [isUpdating, setIsUpdating] = React.useState(false);

  const handleStatusUpdate = async (status: "accepted" | "rejected") => {
    try {
      setIsUpdating(true);
      await updateStatusMutation({ requestId: request._id, status });
    } catch (error) {
      console.error("Failed to update request status:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="border border-border rounded-lg p-4 bg-card">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={request.contributor?.avatar} alt={request.contributor?.displayName} />
            <AvatarFallback>
              {request.contributor?.displayName?.charAt(0).toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{request.contributor?.displayName || "Unknown"}</p>
            <p className="text-sm text-muted-foreground">@{request.contributor?.username || "unknown"}</p>
            <p className="text-xs text-muted-foreground">{formatDate(request.createdAt)}</p>
          </div>
        </div>
        <Badge
          variant={
            request.status === "accepted" ? "default" :
            request.status === "rejected" ? "destructive" : "secondary"
          }
        >
          {request.status === "accepted" && <CheckCircle className="w-3 h-3 mr-1" />}
          {request.status === "rejected" && <XCircle className="w-3 h-3 mr-1" />}
          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
        </Badge>
      </div>

      <div className="mt-3">
        <p className="text-sm font-medium mb-1">Request for: {request.idea?.title || "Idea"}</p>
        <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
          {request.message}
        </p>
      </div>

      {request.status === "pending" && (
        <div className="flex gap-2 mt-3">
          <Button
            size="sm"
            onClick={() => handleStatusUpdate("accepted")}
            disabled={isUpdating}
            className="bg-green-600 hover:bg-green-700"
          >
            {isUpdating ? "..." : "Accept"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleStatusUpdate("rejected")}
            disabled={isUpdating}
          >
            {isUpdating ? "..." : "Reject"}
          </Button>
        </div>
      )}
    </div>
  );
};
