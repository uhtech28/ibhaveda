"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar" // eslint-disable-line @typescript-eslint/no-unused-vars
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AvatarUpload } from "@/components/user/avatar-upload"
import { RequestStatusCard } from "@/components/requests/request-status-card"
import { Plus, X, User } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { industryCardOptions, skillCardOptions } from "@/lib/options"

// Interface matching the UserProfile from profile page
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

interface DetailedProfileViewProps {
  profile: UserProfile;
  username: string;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  formData: {
    displayName: string;
    bio: string;
    avatar: string;
    industry: string;
    skills: string[];
    username: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    displayName: string;
    bio: string;
    avatar: string;
    industry: string;
    skills: string[];
    username: string;
  }>>;
  myRequests: Array<{
    _id: string;
    idea: { title: string; _id: string; isDeleted?: boolean } | null;
    author: { displayName: string; username: string } | null;
  }> | undefined;
  incomingRequests: Array<{
    _id: string;
    idea: { title: string; description: string; _id: string; isDeleted?: boolean } | null;
    contributor: { avatar?: string; displayName: string; username: string } | null;
    status: "accepted" | "rejected" | "pending";
    createdAt: number;
    message: string;
  }> | undefined;
}

export const DetailedProfileView: React.FC<DetailedProfileViewProps> = ({
  profile,
  username,
  isEditing,
  setIsEditing,
  formData,
  setFormData,
  myRequests,
  incomingRequests,
}) => {
  console.log('DetailedProfileView: completedOnboarding =', profile.completedOnboarding)
  const [loading, setLoading] = useState(false)
  const [newSkill, setNewSkill] = useState("")

  const handleSubmit = async () => {
    setLoading(true)
    try {
      // TODO: Integrate with Convex mutation when ready
      console.log("Updating profile:", formData)

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

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
    setFormData({
      displayName: profile.displayName,
      bio: profile.bio || "",
      avatar: profile.avatar || "",
      industry: profile.industry || "",
      skills: profile.skills || [],
      username: profile.username,
    })
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

  return (
    <div className="max-w-4xl mx-auto">
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
                      value={formData.username}
                      onChange={(e) => !profile.completedOnboarding && setFormData(prev => ({ ...prev, username: e.target.value }))}
                      disabled={profile.completedOnboarding}
                      readOnly={profile.completedOnboarding}
                      className={`mt-1 ${profile.completedOnboarding ? 'bg-muted cursor-not-allowed' : ''}`}
                      placeholder="Enter your username"
                    />
                    {profile.completedOnboarding && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Username cannot be changed after profile completion
                      </p>
                    )}
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
                  <RequestStatusCard key={request._id} request={request as any} /> // eslint-disable-line @typescript-eslint/no-explicit-any
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
                  <div key={request._id} className="border border-border rounded-lg p-4 bg-card">
                    <p>Incoming request: {request.idea?.title || "Idea"}</p>
                    <p>{request.message}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <div>
          <Link href="/profile/contribution-requests">
            <Button variant="outline" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Manage Contribution Requests
            </Button>
          </Link>
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
            <Button onClick={() => setIsEditing(true)} className="px-6">
              Edit Profile
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}