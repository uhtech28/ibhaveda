"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Id } from "../../../convex/_generated/dataModel"
import type { UserProfile } from "../../../convex/users"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AvatarUpload } from "@/components/user/avatar-upload"
import { RequestStatusCard, ContributionRequest } from "@/components/requests/request-status-card"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Plus, X, Edit2, MapPin, LinkIcon } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { industryCardOptions, skillCardOptions } from "@/lib/options"
import { useToast } from "../ui/use-toast"

interface Idea {
  _id: Id<"ideas">;
  title: string;
  description: string;
  visibility: string;
  category?: string;
  createdAt: number;
  sparkCount?: number;
  commentCount?: number;
}

interface DetailedProfileViewProps {
  profile: UserProfile;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  formData: {
    displayName: string;
    bio: string;
    avatar: string;
    location: string;
    website: string;
    github: string;
    linkedin: string;
    twitter: string;
    industry: string;
    industries: string[];
    skills: string[];
    username: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    displayName: string;
    bio: string;
    avatar: string;
    location: string;
    website: string;
    github: string;
    linkedin: string;
    twitter: string;
    industry: string;
    industries: string[];
    skills: string[];
    username: string;
  }>>;
  myRequests?: ContributionRequest[];
  incomingRequests?: ContributionRequest[];
}

export function DetailedProfileView({
  profile,
  isEditing,
  setIsEditing,
  formData,
  setFormData,
  myRequests,
  incomingRequests
}: DetailedProfileViewProps) {
  const [activeTab, setActiveTab] = useState<"created" | "sparked" | "contributed">("created");
  const [newSkill, setNewSkill] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const updateProfile = useMutation(api.users.updateUserProfile);

  // Fetch ideas for the tabs
  const createdIdeas = useQuery(api.ideas.getProfileIdeas, { userId: profile._id });
  const sparkedIdeas = useQuery(api.ideas.getPublicSparkedIdeasForUser, { userId: profile._id });
  const contributedIdeas = useQuery(api.ideas.getPublicContributedIdeasForUser, { userId: profile._id });

  const handleCancel = () => {
    setFormData({
      displayName: profile.displayName,
      bio: profile.bio || "",
      avatar: profile.avatar || "",
      location: profile.location || "",
      website: profile.website || "",
      github: profile.github || "",
      linkedin: profile.linkedin || "",
      twitter: profile.twitter || "",
      industry: profile.industry || "",
      industries: profile.industries || [],
      skills: profile.skills || [],
      username: profile.username,
    });
    setIsEditing(false);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await updateProfile({
        displayName: formData.displayName,
        bio: formData.bio,
        avatar: formData.avatar,
        location: formData.location,
        website: formData.website,
        github: formData.github,
        linkedin: formData.linkedin,
        twitter: formData.twitter,
        industry: formData.industry,
        skills: formData.skills,
      });
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addSkill = () => {
    if (newSkill && !formData.skills.includes(newSkill)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill]
      }));
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const renderTabContent = () => {
    let ideas: Idea[] | undefined;
    let emptyMessage = "";

    switch (activeTab) {
      case "created":
        ideas = createdIdeas as Idea[] | undefined;
        emptyMessage = "No ideas created yet.";
        break;
      case "sparked":
        ideas = sparkedIdeas as Idea[] | undefined;
        emptyMessage = "No ideas sparked yet.";
        break;
      case "contributed":
        ideas = contributedIdeas as Idea[] | undefined;
        emptyMessage = "No contributions yet.";
        break;
    }

    if (ideas === undefined) return <div className="text-center py-8">Loading...</div>;

    if (ideas.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
          {emptyMessage}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {ideas.map((idea: Idea) => (
          <Link key={idea._id} href={`/ideas/${idea._id}`}>
            <Card className="hover:shadow-md transition-all duration-200 hover:border-primary/30 cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg mb-1 truncate">{idea.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{idea.description}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {idea.visibility === "public" ? "Public" : "Private"}
                      </Badge>
                      {idea.category && (
                        <Badge variant="secondary" className="text-xs">
                          {idea.category}
                        </Badge>
                      )}
                      <span>•</span>
                      <span>{new Date(idea.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground shrink-0">
                    <div className="flex items-center gap-1">
                      <span className="text-orange-600 dark:text-orange-400">🔥</span>
                      <span>{idea.sparkCount || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>💬</span>
                      <span>{idea.commentCount || 0}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div className="max-w-5xl mx-auto px-4 pb-12">
        {/* Header Layout - More Compact */}
        <div className="relative mb-12">
          {/* Banner */}
          <div className="h-32 w-full bg-gradient-to-r from-primary/10 to-primary/5 rounded-b-3xl border-b border-border/50"></div>
          
          {/* Profile Info Container - Overlapping Design */}
          <div className="relative -mt-16 px-4 md:px-8">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="rounded-full p-1 bg-background shadow-xl">
                  {isEditing ? (
                     <AvatarUpload
                     currentAvatar={formData.avatar}
                     onAvatarChange={(avatarUrl: string) =>
                       setFormData(prev => ({ ...prev, avatar: avatarUrl }))
                     }
                     displayName={formData.displayName}
                     className="w-28 h-28 md:w-32 md:h-32"
                   />
                  ) : (
                    <Avatar className="w-28 h-28 md:w-32 md:h-32 border-4 border-background shadow-sm">
                      <AvatarImage src={profile.avatar} alt={profile.displayName} className="object-cover" />
                      <AvatarFallback className="text-4xl bg-primary/10 text-primary">
                        {profile.displayName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </div>

              {/* Name, Bio, and Meta - Side by Side with Avatar */}
              <div className="flex-1 pt-8 md:pt-12">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-2xl md:text-3xl font-bold text-foreground">{profile.displayName}</h1>
                      {!isEditing && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setIsEditing(true)}
                          className="gap-2"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit
                        </Button>
                      )}
                    </div>
                    <p className="text-muted-foreground font-medium mb-3">@{profile.username}</p>
                    
                    {/* Bio & Meta */}
                    {!isEditing && (
                      <div className="space-y-3">
                        {profile.bio && <p className="text-foreground/80 leading-relaxed">{profile.bio}</p>}
                        
                        {/* Location and Links */}
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground items-center">
                          {profile.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {profile.location}
                            </div>
                          )}
                          {profile.website && (
                            <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
                              <LinkIcon className="w-3.5 h-3.5" />
                              Website
                            </a>
                          )}
                        </div>

                        {/* Skills and Industry - Below Bio */}
                        <div className="flex flex-wrap gap-2 pt-2">
                          {profile.industry && (
                            <Badge className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20 hover:bg-purple-500/20">
                              {profile.industry}
                            </Badge>
                          )}
                          {profile.skills && profile.skills.map((skill, index) => (
                            <Badge 
                              key={index} 
                              variant="secondary" 
                              className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20 hover:bg-blue-500/20"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Mode Form */}
        {isEditing && (
          <Card className="mb-8 border-primary/20 shadow-md">
            <CardHeader>
              <CardTitle>Edit Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={formData.displayName}
                    onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => !profile.completedOnboarding && setFormData(prev => ({ ...prev, username: e.target.value }))}
                    disabled={profile.completedOnboarding}
                    className={profile.completedOnboarding ? "bg-muted" : ""}
                  />
                </div>
                <div className="col-span-full space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    rows={3}
                  />
                </div>
                
                {/* New Fields */}
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g. San Francisco, CA"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="github">GitHub URL</Label>
                  <Input
                    id="github"
                    value={formData.github}
                    onChange={(e) => setFormData(prev => ({ ...prev, github: e.target.value }))}
                    placeholder="https://github.com/username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn URL</Label>
                  <Input
                    id="linkedin"
                    value={formData.linkedin}
                    onChange={(e) => setFormData(prev => ({ ...prev, linkedin: e.target.value }))}
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitter">Twitter/X URL</Label>
                  <Input
                    id="twitter"
                    value={formData.twitter}
                    onChange={(e) => setFormData(prev => ({ ...prev, twitter: e.target.value }))}
                    placeholder="https://twitter.com/username"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select
                    value={formData.industry}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, industry: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
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
                
                {/* Skills Edit */}
                <div className="col-span-full space-y-3">
                  <Label>Skills</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="gap-1 pl-2 pr-1 py-1">
                        {skill}
                        <button onClick={() => removeSkill(skill)} className="hover:bg-destructive/10 rounded-full p-0.5 transition-colors">
                          <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2 max-w-md">
                    <Select value={newSkill} onValueChange={setNewSkill}>
                      <SelectTrigger>
                        <SelectValue placeholder="Add a skill..." />
                      </SelectTrigger>
                      <SelectContent>
                        {skillCardOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" onClick={addSkill} size="icon" variant="secondary">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="ghost" onClick={handleCancel} disabled={loading}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={loading}>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Tabs */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => setActiveTab("created")}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 ${
              activeTab === "created"
                ? "bg-primary/5 border-primary/50 shadow-sm"
                : "bg-card border-border hover:border-primary/30 hover:bg-accent/50"
            }`}
          >
            <span className={`text-3xl font-bold mb-1 ${activeTab === "created" ? "text-primary" : "text-foreground"}`}>
              {profile.ideasCreated || 0}
            </span>
            <span className="text-sm text-muted-foreground font-medium">Ideas Created</span>
          </button>

          <button
            onClick={() => setActiveTab("sparked")}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 ${
              activeTab === "sparked"
                ? "bg-orange-500/5 border-orange-500/50 shadow-sm"
                : "bg-card border-border hover:border-orange-500/30 hover:bg-accent/50"
            }`}
          >
            <span className={`text-3xl font-bold mb-1 ${activeTab === "sparked" ? "text-orange-600 dark:text-orange-400" : "text-foreground"}`}>
              {profile.ideasSparked || 0}
            </span>
            <span className="text-sm text-muted-foreground font-medium">Ideas Sparked</span>
          </button>

          <button
            onClick={() => setActiveTab("contributed")}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 ${
              activeTab === "contributed"
                ? "bg-blue-500/5 border-blue-500/50 shadow-sm"
                : "bg-card border-border hover:border-blue-500/30 hover:bg-accent/50"
            }`}
          >
            <span className={`text-3xl font-bold mb-1 ${activeTab === "contributed" ? "text-blue-600 dark:text-blue-400" : "text-foreground"}`}>
              {profile.ideasContributed || 0}
            </span>
            <span className="text-sm text-muted-foreground font-medium">Contributed To</span>
          </button>
        </div>

        {/* Dynamic Content Area */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {activeTab === "created" && "Created Ideas"}
              {activeTab === "sparked" && "Sparked Ideas"}
              {activeTab === "contributed" && "Contributions"}
            </h2>
          </div>
          
          {renderTabContent()}
        </div>

        {/* Contribution Requests (Only visible to owner) */}
        {!isEditing && (
          <div className="mt-16 pt-8 border-t">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Contribution Requests</h2>
                <Link href="/profile/contribution-requests">
                  <Button variant="outline" size="sm" className="gap-2">
                    Manage Requests
                  </Button>
                </Link>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Outgoing Requests */}
                {myRequests && myRequests.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">My Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {myRequests.slice(0, 3).map((request) => (
                          <RequestStatusCard key={request._id} request={request} />
                        ))}
                        {myRequests.length > 3 && (
                          <Button variant="link" className="w-full text-xs">View all {myRequests.length} requests</Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Incoming Requests */}
                {incomingRequests && incomingRequests.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Incoming Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {incomingRequests.slice(0, 3).map((request) => (
                          <div key={request._id} className="border rounded-lg p-3 bg-muted/20 text-sm">
                            <p className="font-medium truncate">{request.idea?.title || "Idea"}</p>
                            <p className="text-muted-foreground truncate">{request.message}</p>
                          </div>
                        ))}
                         {incomingRequests.length > 3 && (
                          <Button variant="link" className="w-full text-xs">View all {incomingRequests.length} incoming</Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {(!myRequests?.length && !incomingRequests?.length) && (
                  <div className="col-span-full text-center py-8 text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                    No active contribution requests.
                  </div>
                )}
             </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}