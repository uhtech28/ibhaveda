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

  const [usernameValidation, setUsernameValidation] = useState({
    checking: false,
    available: null as boolean | null,
    error: '',
    suggestions: [] as string[],
  });

  const [validationUsername, setValidationUsername] = useState('');
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const availabilityQuery = useQuery(
    api.users.checkUsernameAvailability,
    validationUsername ? { username: validationUsername } : 'skip'
  );

  const suggestionsQuery = useQuery(
    api.users.generateUsernameSuggestions,
    (validationUsername && usernameValidation.available === false) ? { baseUsername: validationUsername, count: 3 } : 'skip'
  );

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
  const existingProfile = useQuery(api.users.getCurrentUser);

  useEffect(() => {
    if (!validationUsername) {
      setUsernameValidation({ checking: false, available: null, error: '', suggestions: [] });
      return;
    }
    if (availabilityQuery === undefined) {
      setUsernameValidation(prev => ({ ...prev, checking: true, error: '' }));
      return;
    }
    if (availabilityQuery.available) {
      setUsernameValidation({ checking: false, available: true, error: '', suggestions: [] });
    } else {
      setUsernameValidation({ checking: false, available: false, error: 'This username is already taken', suggestions: suggestionsQuery || [] });
    }
  }, [availabilityQuery, suggestionsQuery, validationUsername]);

  const validateUsername = useCallback((username: string) => {
    if (!username.trim()) {
      setUsernameValidation({ checking: false, available: null, error: '', suggestions: [] });
      setValidationUsername('');
      return;
    }
    if (username.length < 3) {
      setUsernameValidation({ checking: false, available: null, error: 'Username must be 3-30 characters', suggestions: [] });
      setValidationUsername('');
      return;
    }
    // Allow letters, numbers, and a broad set of special chars.
    // Disallows whitespace and URL-routing chars (/ ? # & = : @ < > " ' \ space).
    const regexTest = /^[^\s\/\\?#&=:@<>"'`]+$/.test(username);
    if (!regexTest) {
      setUsernameValidation({ checking: false, available: null, error: 'Username can\'t contain spaces or URL chars (/ ? # & = : @ < > " \')', suggestions: [] });
      setValidationUsername('');
      return;
    }
    setValidationUsername(username);
  }, []);

  const handleUsernameChange = useCallback((username: string) => {
    // Strip disallowed chars but keep everything else (special chars OK).
    const normalizedUsername = username
      .toLowerCase()
      .replace(/[\s\/\\?#&=:@<>"'`]/g, '');
    setFormData(prev => ({ ...prev, username: normalizedUsername }));
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => { validateUsername(normalizedUsername); }, 500);
  }, [validateUsername]);

  useEffect(() => {
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, []);

  useEffect(() => {
    if (user) {
      const suggestedUsername = (user.username || user.firstName || 'user')
        .toLowerCase()
        .replace(/[\s\/\\?#&=:@<>"'`]/g, '');
      const suggestedName = user.fullName || suggestedUsername;
      // Auto-pull avatar from Clerk if available, so first-time setup
      // doesn't have to ask the user to upload one.
      const clerkAvatar = user.imageUrl || "";
      setFormData(prev => ({
        ...prev,
        displayName: prev.displayName || suggestedName,
        username: prev.username || suggestedUsername,
        avatar: prev.avatar || clerkAvatar,
      }));
      if (suggestedUsername && suggestedUsername.length >= 3) {
        setValidationUsername(suggestedUsername);
      }
    }
  }, [user, userId]);

  useEffect(() => {
    if (existingProfile && !profilePopulated) {
      setFormData(prev => ({
        ...prev,
        username: existingProfile.username || prev.username,
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

  const validateForm = () => {
    const errors: string[] = [];
    if (!formData.username.trim()) {
      errors.push("Username is required");
      toast({ title: "Username required", description: "Please enter a username to continue.", variant: "destructive", duration: 4000 });
    } else if (!/^[a-z0-9_]+$/.test(formData.username)) {
      errors.push("Username can only contain lowercase letters, numbers, and underscores");
      toast({ title: "Invalid username", description: "Username can only contain lowercase letters, numbers, and underscores.", variant: "destructive", duration: 4000 });
    } else if (formData.username.length < 3) {
      errors.push("Username must be at least 3 characters");
      toast({ title: "Username too short", description: "Your username must be at least 3 characters long.", variant: "destructive", duration: 4000 });
    }
    if (existingProfile && !formData.displayName.trim()) {
      errors.push("Display name is required");
      toast({ title: "Display name required", description: "Please enter your full name to continue.", variant: "destructive", duration: 4000 });
    }
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!existingProfile && usernameValidation.available === false) {
      setError("Username is already taken. Please choose a different username.");
      toast({ title: "Username unavailable", description: "This username is already taken. Please choose one of the suggestions or try a different username.", variant: "destructive", duration: 5000 });
      return;
    }
    if (!existingProfile && usernameValidation.checking) {
      toast({ title: "Please wait", description: "Checking username availability...", duration: 2000 });
      return;
    }
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(". "));
      return;
    }
    if (!userId) return;
    setLoading(true);
    setError("");
    try {
      const finalDisplayName = formData.displayName.trim() || formData.username;
      if (existingProfile) {
        await updateUserProfile({
          displayName: finalDisplayName,
          bio: formData.bio || undefined,
          avatar: formData.avatar || undefined,
          industry: formData.industries.length > 0 ? formData.industries[0] : undefined,
          industries: formData.industries,
          skills: formData.skills,
        });
      } else {
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
      toast({ title: "Profile completed!", description: "Welcome to the community! Your profile has been successfully set up.", duration: 4000 });
      try {
        router.push('/feed');
        setTimeout(() => {
          if (typeof window !== 'undefined' && window.location.pathname.includes('profile-setup')) {
            window.location.href = '/feed';
          }
        }, 500);
      } catch {
        if (typeof window !== 'undefined') window.location.href = '/feed';
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : `Failed to ${existingProfile ? 'update' : 'create'} profile`;
      setError(errorMessage);
      toast({ title: `Failed to ${existingProfile ? 'update' : 'create'} profile`, description: errorMessage, variant: "destructive", duration: 6000 });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => { router.push('/'); };

  const UsernameValidationStatus = () => {
    if (!formData.username || existingProfile) return null;
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          {usernameValidation.checking ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Checking availability…</span>
            </>
          ) : usernameValidation.available === true ? (
            <>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs text-emerald-500 font-medium">Available</span>
            </>
          ) : usernameValidation.available === false ? (
            <>
              <XCircle className="w-3.5 h-3.5 text-destructive" />
              <span className="text-xs text-destructive font-medium">Taken</span>
            </>
          ) : null}
        </div>
        {usernameValidation.error && !usernameValidation.suggestions.length && (
          <p className="text-xs text-destructive leading-tight">{usernameValidation.error}</p>
        )}
        {usernameValidation.available === false && usernameValidation.suggestions.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Try one of these:</p>
            <div className="flex flex-wrap gap-1.5">
              {usernameValidation.suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleUsernameChange(suggestion)}
                  className="px-2 py-0.5 text-xs bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-md transition-colors"
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

  if (!existingProfile) {
    return (
      <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
        <HeroHeader />
        <main className="flex-1 flex items-center justify-center px-4 py-12 pt-32 w-full">
          <div className="w-full max-w-3xl">
            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                Complete Your Profile
              </h1>
              <p className="mt-2 text-sm md:text-base text-muted-foreground">
                Pick a username to get started
              </p>
            </div>
            <Card className="border-border/50 shadow-xl">
              <CardContent className="p-6 md:p-10">
                <form onSubmit={handleSubmit}>
                  {/* First-time setup is intentionally minimal:
                   *   - No avatar upload (auto-generated from initials/Clerk image)
                   *   - No Cancel button (forces profile completion before they
                   *     can use the app)
                   *   - Submit drops the user straight into /feed */}
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => handleUsernameChange(e.target.value)}
                        placeholder="yourname"
                        className="h-11 text-sm"
                        maxLength={30}
                        autoFocus
                      />
                      <UsernameValidationStatus />
                    </div>
                    {error && (
                      <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                        <p className="text-xs text-destructive font-medium">{error}</p>
                      </div>
                    )}
                    <Button
                      type="submit"
                      disabled={loading || usernameValidation.available === false || usernameValidation.checking || !formData.username}
                      size="default"
                      className="w-full h-11"
                    >
                      {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Setting up…</>) : ("Complete Setup")}
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

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-hidden">
      <HeroHeader />
      <main className="flex-1 container mx-auto px-4 flex items-center justify-center py-4 pt-24">
        <div className="max-w-5xl w-full">
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold text-foreground">Edit Your Profile</h1>
            <p className="text-sm text-muted-foreground">Update your profile information</p>
          </div>
          <Card className="shadow-lg border-border/50">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit}>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-shrink-0 flex flex-col items-center justify-start pt-2">
                    <AvatarUpload
                      currentAvatar={formData.avatar}
                      onAvatarChange={(avatarUrl: string) => setFormData(prev => ({ ...prev, avatar: avatarUrl }))}
                      displayName={formData.displayName || "User"}
                    />
                  </div>
                  <div className="flex-1 space-y-3">
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
                      <div className="space-y-1">
                        <Label htmlFor="username" className="text-xs font-medium">Username</Label>
                        <Input
                          id="username"
                          value={formData.username}
                          placeholder="uniqueusername"
                          className="h-8 text-sm bg-muted cursor-not-allowed"
                          maxLength={30}
                          disabled
                          readOnly
                        />
                      </div>
                    </div>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Industries</Label>
                        <IndustriesMultiSelect
                          selectedIndustries={formData.industries}
                          onChange={(newIndustries) => setFormData(prev => ({ ...prev, industries: newIndustries }))}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Skills</Label>
                        <SkillsMultiSelect
                          selectedSkills={formData.skills}
                          onChange={(newSkills) => setFormData(prev => ({ ...prev, skills: newSkills }))}
                        />
                      </div>
                    </div>
                    {error && (
                      <div className="p-2 rounded-md bg-destructive/10 border border-destructive/20">
                        <p className="text-xs text-destructive font-medium">{error}</p>
                      </div>
                    )}
                    <div className="flex justify-end gap-2 pt-2">
                      <Button type="button" variant="outline" onClick={handleCancel} disabled={loading} size="sm" className="h-8 px-4">Cancel</Button>
                      <Button type="submit" disabled={loading} size="sm" className="h-8 px-4">
                        {loading ? (<><Loader2 className="mr-2 h-3 w-3 animate-spin" />Saving...</>) : ("Update Profile")}
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
