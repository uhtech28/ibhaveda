"use client";

import React, { useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HeroHeader } from "@/components/header";
import FooterSection from "@/components/footer";
import { AvatarUpload } from "@/components/user/avatar-upload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { industryCardOptions, skillCardOptions } from "@/lib/options";

export default function ProfileSetupPage() {
  const { isLoaded, userId } = useAuth();

  // Simple idea card component - Show only title
  type IdeaType = {
    _id: string;
    title: string;
  };

  const IdeaCard = ({ idea }: { idea: IdeaType }) => (
    <Card className="flex-shrink-0 w-80 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-2">
          <h4 className="font-semibold text-sm line-clamp-2 leading-tight min-h-[2.5rem]">
            {idea.title}
          </h4>
        </div>
      </CardContent>
    </Card>
  );

  // Metrics section component
  const MetricsSection = () => (
    <Card className="shadow-lg mt-8">
      <CardHeader>
        <CardTitle>Your Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {/* Created Ideas */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Ideas Created</h3>
              {createdIdeasData && createdIdeasData.length > 3 && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => toggleExpanded('created')}
                  className="h-auto p-0 text-primary hover:text-primary/80"
                >
                  {expandedSections.created ? 'Show less' : `View all (${createdIdeasData.length})`}
                </Button>
              )}
            </div>
           {createdIdeasData ? (
             createdIdeas.length > 0 ? (
               <div className="flex gap-3 overflow-x-auto pb-2">
                 {createdIdeas.map((idea) => (
                   <IdeaCard key={idea._id} idea={idea} />
                 ))}
               </div>
             ) : (
               <p className="text-muted-foreground text-center py-4">No ideas created yet</p>
             )
           ) : (
             <div className="flex justify-center py-4">
               <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
             </div>
           )}
          </div>

          {/* Sparked Ideas */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Ideas Sparked</h3>
              {sparkedIdeasData && sparkedIdeasData.length > 3 && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => toggleExpanded('sparked')}
                  className="h-auto p-0 text-primary hover:text-primary/80"
                >
                  {expandedSections.sparked ? 'Show less' : `View all (${sparkedIdeasData.length})`}
                </Button>
              )}
            </div>
            {sparkedIdeasData ? (
              sparkedIdeas.length > 0 ? (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {sparkedIdeas.map((idea) => (
                    <IdeaCard key={idea._id} idea={idea} />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No ideas sparked yet</p>
              )
            ) : (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            )}
          </div>

          {/* Contributed Ideas */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Ideas Contributed To</h3>
              {contributedIdeasData && contributedIdeasData.length > 3 && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => toggleExpanded('contributed')}
                  className="h-auto p-0 text-primary hover:text-primary/80"
                >
                  {expandedSections.contributed ? 'Show less' : `View all (${contributedIdeasData.length})`}
                </Button>
              )}
            </div>
            {contributedIdeasData ? (
              contributedIdeas.length > 0 ? (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {contributedIdeas.map((idea) => (
                    <IdeaCard key={idea._id} idea={idea} />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No contributions yet</p>
              )
            ) : (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newSkill, setNewSkill] = useState("");
  const [expandedSections, setExpandedSections] = useState({
    created: false,
    sparked: false,
    contributed: false,
  });

  // Comprehensive profile form data
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    bio: '',
    avatar: '',
    industry: '',
    skills: [] as string[],
  });

  const createUserProfile = useMutation(api.users.createUserProfile);

  // Query user's ideas data - refresh when expanded sections change
  const createdIdeasData = useQuery(api.ideas.getUserIdeas);
  const sparkedIdeasData = useQuery(api.ideas.getUserSparkedIdeas, { limit: expandedSections.sparked ? 20 : 20 });
  const contributedIdeasData = useQuery(api.ideas.getUserContributedIdeas, { limit: expandedSections.contributed ? 20 : 20 });

  // Apply limit to created ideas for display
  const createdIdeas = createdIdeasData ? (expandedSections.created ? createdIdeasData : createdIdeasData.slice(0, 3)) : [];
  // sparked and contributed ideas are already limited in query, but we'll show all returned items
  const sparkedIdeas = sparkedIdeasData || [];
  const contributedIdeas = contributedIdeasData || [];

  // Pre-populate with Clerk data
  useEffect(() => {
    if (user) {
      const suggestedUsername = (user.username || user.firstName || 'user').toLowerCase().replace(/[^a-z0-9]/g, '');
      const suggestedName = user.fullName || suggestedUsername;

      setFormData(prev => ({
        ...prev,
        displayName: prev.displayName || suggestedName,
        username: prev.username || suggestedUsername,
      }));

      console.log('🎯 Profile setup page initialized:', {
        userId: userId ? '[PRESENT]' : 'null',
        clerkUser: {
          fullName: user.fullName,
          username: user.username,
          firstName: user.firstName,
          email: user.primaryEmailAddress?.emailAddress
        },
        formData: { displayName: suggestedName, username: suggestedUsername }
      });
    }
  }, [user, userId]);

  // Form validation
  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.displayName.trim()) {
      errors.push("Display name is required");
    } else if (formData.displayName.trim().length < 2) {
      errors.push("Display name must be at least 2 characters");
    }

    if (!formData.username.trim()) {
      errors.push("Username is required");
    } else if (!/^[a-z0-9]+$/.test(formData.username)) {
      errors.push("Username can only contain lowercase letters and numbers");
    } else if (formData.username.length < 3) {
      errors.push("Username must be at least 3 characters");
    }

    if (formData.bio.length > 500) {
      errors.push("Bio must be less than 500 characters");
    }

    if (formData.skills.length > 10) {
      errors.push("Please select no more than 10 skills");
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(". "));
      return;
    }

    if (!userId) return;

    setLoading(true);
    setError("");

    try {
      // Create comprehensive profile
      await createUserProfile({
        username: formData.username,
        displayName: formData.displayName,
        bio: formData.bio || undefined,
        avatar: formData.avatar || undefined,
        industry: formData.industry || undefined,
        skills: formData.skills,
      });

      // Redirect to feed
      router.push('/feed');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create profile";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Navigate back to home or sign-in page
    router.push('/');
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
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

  const toggleExpanded = (section: 'created' | 'sparked' | 'contributed') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };


  if (!isLoaded || !userId) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <HeroHeader />
        <main className="flex-1 flex items-center justify-center px-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p>Loading your profile setup...</p>
              </div>
            </CardContent>
          </Card>
        </main>
        <FooterSection />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <HeroHeader />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8 mt-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">Complete Your Profile</h1>
            <p className="text-lg text-muted-foreground">
              Tell us about yourself to personalize your experience
            </p>
          </div>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Profile Setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Avatar Upload Section */}
              <div className="flex justify-center">
                <AvatarUpload
                  currentAvatar={formData.avatar}
                  onAvatarChange={(avatarUrl: string) =>
                    setFormData(prev => ({ ...prev, avatar: avatarUrl }))
                  }
                  displayName={formData.displayName || "User"}
                />
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="displayName">Full Name *</Label>
                    <Input
                      id="displayName"
                      value={formData.displayName}
                      onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                      placeholder="Your full name"
                      className="mt-1"
                      maxLength={100}
                    />
                  </div>

                  <div>
                    <Label htmlFor="username">Username *</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        username: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '')
                      }))}
                      placeholder="uniqueusername"
                      className="mt-1"
                      maxLength={30}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Only lowercase letters and numbers (3-30 characters)
                    </p>
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell us about yourself, your interests, or what you're working on..."
                    className="mt-1 min-h-[100px] resize-none"
                    maxLength={500}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    {formData.bio.length}/500 characters
                  </p>
                </div>

                {/* Industry */}
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Select
                    value={formData.industry}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, industry: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select your industry (optional)" />
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

                {/* Skills */}
                <div>
                  <Label>Skills</Label>

                  {/* Current Skills */}
                  <div className="flex flex-wrap gap-2 min-h-[40px] mt-1">
                    {formData.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="flex items-center gap-1">
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
                  <div className="flex gap-2 mt-3">
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

                  <p className="text-sm text-muted-foreground mt-2">
                    Add up to 10 skills that describe your expertise and interests
                  </p>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="p-4 rounded-md bg-destructive/10 border border-destructive/20">
                    <p className="text-sm text-destructive font-medium">Please fix the following errors:</p>
                    <ul className="text-sm text-destructive mt-1 list-disc list-inside">
                      {error.split('. ').map((err, index) => (
                        <li key={index}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={loading}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !formData.displayName.trim() || !formData.username.trim()}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Creating Profile...
                      </div>
                    ) : (
                      "Complete Profile"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <MetricsSection />
        </div>
      </main>

      <FooterSection />
    </div>
  );
}
