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
import { Card, CardContent } from "@/components/ui/card";
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

      // Trigger initial username validation if we have a suggested username
      if (suggestedUsername && suggestedUsername.length >= 3) {
        setValidationUsername(suggestedUsername);
      }
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

    // Validate displayName (required by Convex mutation)
    if (!formData.displayName.trim()) {
      errors.push("Display name is required");
      toast({
        title: "Display name required",
        description: "Please enter your full name to continue.",
        variant: "destructive",
        duration: 4000,
      });
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Block submission if username is taken (for new profiles only)
    if (!existingProfile && usernameValidation.available === false) {
      setError("Username is already taken. Please choose a different username.");
      toast({
        title: "Username unavailable",
        description: "This username is already taken. Please choose one of the suggestions or try a different username.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    // Block submission if username validation is still in progress
    if (!existingProfile && usernameValidation.checking) {
      toast({
        title: "Please wait",
        description: "Checking username availability...",
        duration: 2000,
      });
      return;
    }

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
      // Ensure displayName has a value (fallback to username if empty)
      const finalDisplayName = formData.displayName.trim() || formData.username;

      if (existingProfile) {
        // Update existing profile
        await updateUserProfile({
          displayName: finalDisplayName,
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
          displayName: finalDisplayName,
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

      // Use router.push first, then fallback to window.location for production compatibility
      try {
        router.push('/feed');
        // Fallback: if still on same page after 500ms, force redirect
        setTimeout(() => {
          if (typeof window !== 'undefined' && window.location.pathname.includes('profile-setup')) {
            window.location.href = '/feed';
          }
        }, 500);
      } catch {
        // Hard fallback for production environments
        if (typeof window !== 'undefined') {
          window.location.href = '/feed';
        }
      }
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
      <div className="mt-1 space-y-1 bg-background/80 backdrop-blur-sm z-10 rounded-md">
        {/* Availability Status */}
        <div className="flex items-center gap-1.5">
          {usernameValidation.checking ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Checking...</span>
            </>
          ) : usernameValidation.available === true ? (
            <>
              <CheckCircle className="w-3 h-3 text-green-600" />
              <span className="text-[10px] text-green-600 font-medium">Available</span>
            </>
          ) : usernameValidation.available === false ? (
            <>
              <XCircle className="w-3 h-3 text-destructive" />
              <span className="text-[10px] text-destructive font-medium">Taken</span>
            </>
          ) : null}
        </div>

        {/* Error Messages */}
        {usernameValidation.error && (
          <p className="text-[10px] text-destructive leading-tight">{usernameValidation.error}</p>
        )}

        {/* Suggestions */}
        {usernameValidation.available === false && usernameValidation.suggestions.length > 0 && (
          <div className="space-y-1 pt-0.5">
            <p className="text-[10px] text-muted-foreground font-medium">Suggestions:</p>
            <div className="flex flex-wrap gap-1.5">
              {usernameValidation.suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleUsernameChange(suggestion)}
                  className="px-1.5 py-0.5 text-[10px] bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded transition-colors duration-200"
                >
                  {suggestion}
                </button>
              ))}
            </div>
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
    <div className="min-h-screen flex flex-col bg-background overflow-hidden">
      <HeroHeader />

      <main className="flex-1 container mx-auto px-4 flex items-center justify-center py-4 pt-24">
        <div className="max-w-5xl w-full">
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold text-foreground">
              {existingProfile ? "Edit Your Profile" : "Complete Your Profile"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {existingProfile ? "Update your profile information" : "Tell us about yourself"}
            </p>
          </div>

          <Card className="shadow-lg border-border/50">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit}>
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Left Column: Avatar */}
                  <div className="flex-shrink-0 flex flex-col items-center justify-start pt-2">
                    <AvatarUpload
                      currentAvatar={formData.avatar}
                      onAvatarChange={(avatarUrl: string) =>
                        setFormData(prev => ({ ...prev, avatar: avatarUrl }))
                      }
                      displayName={formData.displayName || "User"}
                    />
                  </div>

                  {/* Right Column: Form Fields */}
                  <div className="flex-1 space-y-3">
                    {/* Row 1: Name & Username */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="displayName" className="text-xs font-medium">Full Name</Label>
                        <Input
                          id="displayName"
                          value={formData.displayName}
                          onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                          placeholder="Your full name"
                          className="h-8 text-sm"
                          maxLength={100}
                        />
                      </div>

                      <div className="space-y-1 relative">
                        <Label htmlFor="username" className="text-xs font-medium">Username *</Label>
                        <Input
                          id="username"
                          value={formData.username}
                          onChange={(e) => !existingProfile && handleUsernameChange(e.target.value)}
                          placeholder="uniqueusername"
                          className={`h-8 text-sm ${existingProfile ? 'bg-muted cursor-not-allowed' : ''}`}
                          maxLength={30}
                          disabled={!!existingProfile}
                          readOnly={!!existingProfile}
                        />
                        <div className="absolute top-full left-0 w-full mt-0.5">
                          <UsernameValidationStatus />
                        </div>
                      </div>
                    </div>

                    {/* Row 2: Bio */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="bio" className="text-xs font-medium">Bio</Label>
                        <span className="text-[10px] text-muted-foreground">{formData.bio.length}/500</span>
                      </div>
                      <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder="Tell us about yourself..."
                        className="min-h-[60px] h-[60px] resize-none text-sm py-2"
                        maxLength={500}
                      />
                    </div>

                    {/* Row 3: Industries & Skills */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Industries</Label>
                        <IndustriesMultiSelect
                          selectedIndustries={formData.industries}
                          onChange={(newIndustries) =>
                            setFormData(prev => ({ ...prev, industries: newIndustries }))
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Skills</Label>
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
                      <div className="p-2 rounded-md bg-destructive/10 border border-destructive/20">
                        <p className="text-xs text-destructive font-medium">{error}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={loading}
                        size="sm"
                        className="h-8 px-4"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={loading || (usernameValidation.available === false && !existingProfile)}
                        size="sm"
                        className="h-8 px-4"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          existingProfile ? "Update Profile" : "Complete Setup"
                        )}
                      </Button>
                    </div>
                  </div>
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
