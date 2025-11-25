"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HeroHeader } from "@/components/header";
import FooterSection from "@/components/footer";
import { AvatarUpload } from "@/components/user/avatar-upload";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { IndustriesMultiSelect } from "@/components/IndustriesMultiSelect";
import { SkillsMultiSelect } from "@/components/SkillsMultiSelect";

export default function ProfileSetupPage() {
  const { isLoaded, userId } = useAuth();
  const { toast } = useToast();
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [profilePopulated, setProfilePopulated] = useState(false);

  // Username validation state
  const [usernameValidation, setUsernameValidation] = useState({
    checking: false,
    available: null as boolean | null,
    error: '',
    suggestions: [] as string[],
  });

  // Current username for validation queries
  const [validationUsername, setValidationUsername] = useState('');

  // Debounced validation ref
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Convex queries for username validation
  const availabilityQuery = useQuery(
    api.users.checkUsernameAvailability,
    validationUsername ? { username: validationUsername } : 'skip'
  );

  const suggestionsQuery = useQuery(
    api.users.generateUsernameSuggestions,
    (validationUsername && usernameValidation.available === false) ? { baseUsername: validationUsername, count: 3 } : 'skip'
  );

  // Comprehensive profile form data
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    bio: '',
    avatar: '',
    industry: '',
    industries: [] as string[],
    skills: [] as string[],
  });

  const createUserProfile = useMutation(api.users.createUserProfile);
  const updateUserProfile = useMutation(api.users.updateUserProfile);

  // Query existing user profile to check if onboarding is completed
  const existingProfile = useQuery(api.users.getCurrentUser);

  // Effect to update validation state based on query results
  useEffect(() => {
    if (!validationUsername) {
      setUsernameValidation({
        checking: false,
        available: null,
        error: '',
        suggestions: [],
      });
      return;
    }

    if (availabilityQuery === undefined) {
      // Query is still loading
      setUsernameValidation(prev => ({ ...prev, checking: true, error: '' }));
      return;
    }

    if (availabilityQuery.available) {
      setUsernameValidation({
        checking: false,
        available: true,
        error: '',
        suggestions: [],
      });
    } else {
      setUsernameValidation({
        checking: false,
        available: false,
        error: 'This username is already taken',
        suggestions: suggestionsQuery || [],
      });
    }
  }, [availabilityQuery, suggestionsQuery, validationUsername]);

  // Debounced username validation function
  const validateUsername = useCallback((username: string) => {
    if (!username.trim()) {
      setUsernameValidation({
        checking: false,
        available: null,
        error: '',
        suggestions: [],
      });
      setValidationUsername('');
      return;
    }

    if (username.length < 3) {
      setUsernameValidation({
        checking: false,
        available: null,
        error: 'Username must be 3-30 characters',
        suggestions: [],
      });
      setValidationUsername('');
      return;
    }

    // Check regex - note: this allows underscores but form validation doesn't
    const regexTest = /^[a-z0-9_]+$/.test(username);

    if (!regexTest) {
      setUsernameValidation({
        checking: false,
        available: null,
        error: 'Username must only use lowercase characters, numbers, and underscores',
        suggestions: [],
      });
      setValidationUsername('');
      return;
    }

    setValidationUsername(username);
  }, []);

  // Debounced onChange handler for username
  const handleUsernameChange = useCallback((username: string) => {
    const normalizedUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '');

    setFormData(prev => ({ ...prev, username: normalizedUsername }));

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new debounced validation
    debounceTimer.current = setTimeout(() => {
      validateUsername(normalizedUsername);
    }, 500); // 500ms debounce
  }, [validateUsername]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // Pre-populate with Clerk data
  useEffect(() => {
    if (user) {
      const suggestedUsername = (user.username || user.firstName || 'user').toLowerCase().replace(/[^a-z0-9_]/g, '');
      const suggestedName = user.fullName || suggestedUsername;

      setFormData(prev => ({
        ...prev,
        displayName: prev.displayName || suggestedName,
        username: prev.username || suggestedUsername,
      }));
    }
  }, [user, userId]);

  // Populate form with existing profile data
  useEffect(() => {
    if (existingProfile && !profilePopulated) {
      setFormData(prev => ({
        ...prev,
        displayName: existingProfile.displayName || prev.displayName,
        bio: existingProfile.bio || prev.bio,
        avatar: existingProfile.avatar || prev.avatar,
        industry: existingProfile.industry || prev.industry,
        industries: existingProfile.industries || (existingProfile.industry ? [existingProfile.industry] : []) || prev.industries,
        skills: existingProfile.skills || prev.skills,
      }));
      setProfilePopulated(true);
    }
  }, [existingProfile, profilePopulated]);

  // Form validation with toast notifications
  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.username.trim()) {
      errors.push("Username is required");
      toast({
        title: "Username required",
        description: "Please enter a username to continue.",
        variant: "destructive",
        duration: 4000,
      });
    } else if (!/^[a-z0-9_]+$/.test(formData.username)) {
      errors.push("Username can only contain lowercase letters, numbers, and underscores");
      toast({
        title: "Invalid username",
        description: "Username can only contain lowercase letters, numbers, and underscores.",
        variant: "destructive",
        duration: 4000,
      });
    } else if (formData.username.length < 3) {
      errors.push("Username must be at least 3 characters");
      toast({
        title: "Username too short",
        description: "Your username must be at least 3 characters long.",
        variant: "destructive",
        duration: 4000,
      });
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
      if (existingProfile) {
        // Update existing profile
        await updateUserProfile({
          displayName: formData.displayName,
          bio: formData.bio || undefined,
          avatar: formData.avatar || undefined,
          industry: formData.industries.length > 0 ? formData.industries[0] : undefined,
          industries: formData.industries,
          skills: formData.skills,
        });
      } else {
        // Create new profile
        await createUserProfile({
          username: formData.username,
          displayName: formData.displayName,
          bio: formData.bio || undefined,
          avatar: formData.avatar || undefined,
          industry: formData.industries.length > 0 ? formData.industries[0] : undefined,
          industries: formData.industries,
          skills: formData.skills,
        });
      }

      // Redirect to feed
      toast({
        title: "Profile completed!",
        description: "Welcome to the community! Your profile has been successfully set up.",
        duration: 4000,
      });
      router.push('/feed');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : `Failed to ${existingProfile ? 'update' : 'create'} profile`;
      setError(errorMessage);
      toast({
        title: `Failed to ${existingProfile ? 'update' : 'create'} profile`,
        description: errorMessage,
        variant: "destructive",
        duration: 6000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Navigate back to home or sign-in page
    router.push('/');
  };

  // Username validation status component
  const UsernameValidationStatus = () => {
    if (!formData.username || existingProfile) return null;

    return (
      <div className="mt-3 p-4 rounded-lg border bg-card space-y-3">
        {/* Availability Status */}
        <div className="flex items-center gap-2">
          {usernameValidation.checking ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Checking availability...</span>
            </>
          ) : usernameValidation.available === true ? (
            <>
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600 font-medium">Username is available!</span>
            </>
          ) : usernameValidation.available === false ? (
            <>
              <XCircle className="w-4 h-4 text-destructive" />
              <span className="text-sm text-destructive font-medium">Username is taken</span>
            </>
          ) : null}
        </div>

        {/* Error Messages */}
        {usernameValidation.error && (
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">{usernameValidation.error}</p>
          </div>
        )}

        {/* Suggestions */}
        {usernameValidation.available === false && usernameValidation.suggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-medium">Try these suggestions:</p>
            <div className="flex flex-wrap gap-2">
              {usernameValidation.suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleUsernameChange(suggestion)}
                  className="px-3 py-1.5 text-sm bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-md transition-colors duration-200 hover:shadow-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Click any suggestion to use it as your username
            </p>
          </div>
        )}
      </div>
    );
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
            <h1 className="text-4xl font-bold text-foreground mb-4">
              {existingProfile ? "Edit Your Profile" : "Complete Your Profile"}
            </h1>
            <p className="text-lg text-muted-foreground">
              {existingProfile ? "Update your profile information and skills" : "Tell us about yourself to personalize your experience"}
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
                    <Label htmlFor="displayName">Full Name</Label>
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
                      onChange={(e) => !existingProfile && handleUsernameChange(e.target.value)}
                      placeholder="uniqueusername"
                      className={`mt-1 ${existingProfile ? 'bg-muted cursor-not-allowed' : ''}`}
                      maxLength={30}
                      disabled={!!existingProfile}
                      readOnly={!!existingProfile}
                    />

                    {/* Enhanced Username Validation Status Area */}
                    <UsernameValidationStatus />

                    {existingProfile && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Username cannot be changed after profile completion
                      </p>
                    )}
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

                {/* Industries */}
                <div>
                  <Label>Industries</Label>
                  <div className="mt-1">
                    <IndustriesMultiSelect
                      selectedIndustries={formData.industries}
                      onChange={(newIndustries) => 
                        setFormData(prev => ({ ...prev, industries: newIndustries }))
                      }
                    />
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <Label>Skills</Label>
                  <div className="mt-1">
                    <SkillsMultiSelect
                      selectedSkills={formData.skills}
                      onChange={(newSkills) => 
                        setFormData(prev => ({ ...prev, skills: newSkills }))
                      }
                    />
                  </div>
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
                <div className="flex justify-end gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || (usernameValidation.available === false && !existingProfile)}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      existingProfile ? "Update Profile" : "Complete Setup"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <FooterSection />
    </div>
  );
}
