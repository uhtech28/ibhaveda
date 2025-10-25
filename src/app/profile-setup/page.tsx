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
import { Plus, X, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { industryCardOptions, skillCardOptions } from "@/lib/options";
import { useToast } from "@/components/ui/use-toast";

export default function ProfileSetupPage() {
  const { isLoaded, userId } = useAuth();
  const { toast } = useToast();


  // Metrics section component
  const MetricsSection = () => {
    const router = useRouter();
    const [expandedCards, setExpandedCards] = useState({
      created: false,
      sparked: false,
      contributed: false,
    });

    const toggleCard = (cardType: 'created' | 'sparked' | 'contributed') => {
      setExpandedCards(prev => ({
        ...prev,
        [cardType]: !prev[cardType]
      }));
    };

    const navigateToIdea = (ideaId: string) => {
      router.push(`/idea/${ideaId}`);
    };

    return (
      <Card className="shadow-lg mt-8">
        <CardHeader>
          <CardTitle>Your Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Created Ideas */}
            <div>
              <div
                className="text-center p-4 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={() => toggleCard('created')}
              >
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Ideas Created</h3>
                <p className="text-2xl font-bold text-primary">{createdIdeasData?.length || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {expandedCards.created ? 'Click to collapse' : 'Click to expand'}
                </p>
              </div>

              {expandedCards.created && (
                <div className="mt-4">
                  {createdIdeasData ? (
                    createdIdeasData.length > 0 ? (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {createdIdeasData.map((idea) => (
                          <div
                            key={idea._id}
                            className="p-3 bg-background border rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => navigateToIdea(idea._id)}
                          >
                            <h4 className="font-medium text-sm text-primary hover:underline">{idea.title}</h4>
                          </div>
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
              )}
            </div>

            {/* Sparked Ideas */}
            <div>
              <div
                className="text-center p-4 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={() => toggleCard('sparked')}
              >
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Ideas Sparked</h3>
                <p className="text-2xl font-bold text-primary">{sparkedIdeasData?.length || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {expandedCards.sparked ? 'Click to collapse' : 'Click to expand'}
                </p>
              </div>

              {expandedCards.sparked && (
                <div className="mt-4">
                  {sparkedIdeasData ? (
                    sparkedIdeas.length > 0 ? (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {sparkedIdeas.map((idea) => (
                          <div
                            key={idea._id}
                            className="p-3 bg-background border rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => navigateToIdea(idea._id)}
                          >
                            <h4 className="font-medium text-sm text-primary hover:underline">{idea.title}</h4>
                          </div>
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
              )}
            </div>

            {/* Contributed Ideas */}
            <div>
              <div
                className="text-center p-4 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={() => toggleCard('contributed')}
              >
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Ideas Contributed To</h3>
                <p className="text-2xl font-bold text-primary">{contributedIdeasData?.length || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {expandedCards.contributed ? 'Click to collapse' : 'Click to expand'}
                </p>
              </div>

              {expandedCards.contributed && (
                <div className="mt-4">
                  {contributedIdeasData ? (
                    contributedIdeas.length > 0 ? (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {contributedIdeas.map((idea) => (
                          <div
                            key={idea._id}
                            className="p-3 bg-background border rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => navigateToIdea(idea._id)}
                          >
                            <h4 className="font-medium text-sm text-primary hover:underline">{idea.title}</h4>
                          </div>
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
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newSkill, setNewSkill] = useState("");
  const [profilePopulated, setProfilePopulated] = useState(false);

  // Username validation state
  const [usernameValidation, setUsernameValidation] = useState({
    checking: false,
    available: null as boolean | null,
    error: '',
    suggestions: [] as string[],
  });

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
    skills: [] as string[],
  });

  const createUserProfile = useMutation(api.users.createUserProfile);
  const updateUserProfile = useMutation(api.users.updateUserProfile);

  // Effect to update validation state based on query results
  useEffect(() => {
    console.log('🔍 DEBUG: useEffect triggered for validation state update');
    console.log('🔍 DEBUG: validationUsername:', validationUsername);
    console.log('🔍 DEBUG: availabilityQuery:', availabilityQuery);
    console.log('🔍 DEBUG: suggestionsQuery:', suggestionsQuery);

    if (!validationUsername) {
      console.log('🔍 DEBUG: No validationUsername, resetting validation state');
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
      console.log('🔍 DEBUG: Query is loading, setting checking=true');
      setUsernameValidation(prev => ({ ...prev, checking: true, error: '' }));
      return;
    }

    if (availabilityQuery.available) {
      console.log('🔍 DEBUG: Username is available');
      setUsernameValidation({
        checking: false,
        available: true,
        error: '',
        suggestions: [],
      });
    } else {
      console.log('🔍 DEBUG: Username is taken, setting suggestions');
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
    console.log('🔍 DEBUG: validateUsername called with:', username);

    if (!username.trim()) {
      console.log('🔍 DEBUG: Username is empty or whitespace only');
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
      console.log('🔍 DEBUG: Username too short:', username.length);
      setUsernameValidation({
        checking: false,
        available: null,
        error: 'Username must be 3-20 characters, lowercase letters and numbers only',
        suggestions: [],
      });
      setValidationUsername('');
      return;
    }

    // Check regex - note: this allows underscores but form validation doesn't
    const regexTest = /^[a-z0-9_]+$/.test(username);
    console.log('🔍 DEBUG: Regex test result for', username, ':', regexTest);

    if (!regexTest) {
      console.log('🔍 DEBUG: Username failed regex validation');
      setUsernameValidation({
        checking: false,
        available: null,
        error: 'Username must be 3-20 characters, lowercase letters and numbers only',
        suggestions: [],
      });
      setValidationUsername('');
      return;
    }

    console.log('🔍 DEBUG: Username passes local validation, setting validationUsername to:', username);
    setValidationUsername(username);
  }, []);

  // Debounced onChange handler for username
  const handleUsernameChange = useCallback((username: string) => {
    console.log('🔍 DEBUG: handleUsernameChange called with raw input:', username);

    const normalizedUsername = username.toLowerCase().replace(/[^a-z0-9]/g, '');
    console.log('🔍 DEBUG: Normalized username:', normalizedUsername);

    setFormData(prev => ({ ...prev, username: normalizedUsername }));

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new debounced validation
    debounceTimer.current = setTimeout(() => {
      console.log('🔍 DEBUG: Debounce timer fired, calling validateUsername');
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

  // Query existing user profile to check if onboarding is completed
  const existingProfile = useQuery(api.users.getCurrentUser);

  // Query user's ideas data
  const createdIdeasData = useQuery(api.ideas.getUserIdeas);
  const sparkedIdeasData = useQuery(api.ideas.getUserSparkedIdeas, { limit: 20 });
  const contributedIdeasData = useQuery(api.ideas.getUserContributedIdeas, { limit: 20 });

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

  // Populate form with existing profile data
  useEffect(() => {
    if (existingProfile && !profilePopulated) {
      setFormData(prev => ({
        ...prev,
        displayName: existingProfile.displayName || prev.displayName,
        bio: existingProfile.bio || prev.bio,
        avatar: existingProfile.avatar || prev.avatar,
        industry: existingProfile.industry || prev.industry,
        skills: existingProfile.skills || prev.skills,
      }));
      setProfilePopulated(true);
    }
  }, [existingProfile, profilePopulated]);

  // Form validation with toast notifications
  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.displayName.trim()) {
      errors.push("Display name is required");
      toast({
        title: "Display name required",
        description: "Please enter your display name to continue.",
        variant: "destructive",
        duration: 4000,
      });
    } else if (formData.displayName.trim().length < 2) {
      errors.push("Display name must be at least 2 characters");
      toast({
        title: "Display name too short",
        description: "Your display name must be at least 2 characters long.",
        variant: "destructive",
        duration: 4000,
      });
    }

    if (!formData.username.trim()) {
      errors.push("Username is required");
      toast({
        title: "Username required",
        description: "Please enter a username to continue.",
        variant: "destructive",
        duration: 4000,
      });
    } else if (!/^[a-z0-9]+$/.test(formData.username)) {
      errors.push("Username can only contain lowercase letters and numbers");
      toast({
        title: "Invalid username",
        description: "Username can only contain lowercase letters and numbers.",
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

    if (!formData.avatar.trim()) {
      errors.push("Avatar is required - please upload a profile picture");
      toast({
        title: "Avatar required",
        description: "Please upload a profile picture to continue.",
        variant: "destructive",
        duration: 4000,
      });
    }

    if (!formData.industry.trim()) {
      errors.push("Industry is required - please select your industry");
      toast({
        title: "Industry required",
        description: "Please select your industry to continue.",
        variant: "destructive",
        duration: 4000,
      });
    }

    if (formData.bio.trim().length < 50) {
      errors.push("Bio is required and must be at least 50 characters long");
      toast({
        title: "Bio too short",
        description: `Your bio needs ${50 - formData.bio.trim().length} more characters. Please write at least 50 characters.`,
        variant: "destructive",
        duration: 5000,
      });
    } else if (formData.bio.length > 500) {
      errors.push("Bio must be less than 500 characters");
      toast({
        title: "Bio too long",
        description: "Your bio must be less than 500 characters.",
        variant: "destructive",
        duration: 4000,
      });
    }

    if (formData.skills.length < 3) {
      errors.push("At least 3 skills are required");
      toast({
        title: "Skills required",
        description: `Please select at least ${3 - formData.skills.length} more skills to continue.`,
        variant: "destructive",
        duration: 4000,
      });
    } else if (formData.skills.length > 10) {
      errors.push("Please select no more than 10 skills");
      toast({
        title: "Too many skills",
        description: "Please select no more than 10 skills.",
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
          industry: formData.industry || undefined,
          skills: formData.skills,
        });
      } else {
        // Create new profile
        await createUserProfile({
          username: formData.username,
          displayName: formData.displayName,
          bio: formData.bio || undefined,
          avatar: formData.avatar || undefined,
          industry: formData.industry || undefined,
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
                      onChange={(e) => !existingProfile && handleUsernameChange(e.target.value)}
                      placeholder="uniqueusername"
                      className={`mt-1 ${existingProfile ? 'bg-muted cursor-not-allowed' : ''}`}
                      maxLength={30}
                      disabled={!!existingProfile}
                      readOnly={!!existingProfile}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Only lowercase letters and numbers (3-30 characters)
                    </p>

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
                  <Label htmlFor="bio">Bio *</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell us about yourself, your interests, or what you're working on... (minimum 50 characters)"
                    className="mt-1 min-h-[100px] resize-none"
                    maxLength={500}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    {formData.bio.length}/500 characters (minimum 50 required)
                  </p>
                  {formData.bio.length > 0 && formData.bio.length < 50 && (
                    <p className="text-sm text-destructive mt-1">
                      Bio must be at least 50 characters long
                    </p>
                  )}
                </div>

                {/* Industry */}
                <div>
                  <Label htmlFor="industry">Industry *</Label>
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

                {/* Skills */}
                <div>
                  <Label>Skills *</Label>

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
                    Select at least 3 skills that describe your expertise and interests (maximum 10)
                  </p>
                  {formData.skills.length > 0 && formData.skills.length < 3 && (
                    <p className="text-sm text-destructive mt-1">
                      Please select at least 3 skills
                    </p>
                  )}
                </div>

                {/* Validation Feedback */}
                <div className="space-y-4 p-4 rounded-md bg-muted/50 border">
                  <h4 className="font-medium text-sm">Profile Completion Status</h4>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full ${formData.avatar.trim() ? 'bg-green-500' : 'bg-destructive'}`}></div>
                      <span className={`text-sm ${formData.avatar.trim() ? 'text-green-700' : 'text-destructive'}`}>
                        {formData.avatar.trim() ? '✓ Avatar uploaded' : '✗ Avatar required'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full ${formData.industry.trim() ? 'bg-green-500' : 'bg-destructive'}`}></div>
                      <span className={`text-sm ${formData.industry.trim() ? 'text-green-700' : 'text-destructive'}`}>
                        {formData.industry.trim() ? '✓ Industry selected' : '✗ Industry required'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full ${formData.bio.trim().length >= 50 ? 'bg-green-500' : 'bg-destructive'}`}></div>
                      <span className={`text-sm ${formData.bio.trim().length >= 50 ? 'text-green-700' : 'text-destructive'}`}>
                        {formData.bio.trim().length >= 50 ? '✓ Bio completed (50+ characters)' : `✗ Bio needs ${50 - formData.bio.trim().length} more characters`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full ${formData.skills.length >= 3 ? 'bg-green-500' : 'bg-destructive'}`}></div>
                      <span className={`text-sm ${formData.skills.length >= 3 ? 'text-green-700' : 'text-destructive'}`}>
                        {formData.skills.length >= 3 ? `✓ Skills selected (${formData.skills.length})` : `✗ Need ${3 - formData.skills.length} more skills`}
                      </span>
                    </div>
                  </div>

                  {formData.skills.length >= 3 && formData.bio.trim().length >= 50 && formData.avatar.trim() && formData.industry.trim() && (
                    <div className="flex items-center gap-2 p-2 rounded-md bg-green-50 border border-green-200">
                      <div className="w-4 h-4 rounded-full bg-green-500"></div>
                      <span className="text-sm text-green-700 font-medium">All required fields completed! Ready to submit.</span>
                    </div>
                  )}
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
                    disabled={
                      loading ||
                      !formData.displayName.trim() ||
                      (!existingProfile && (!formData.username.trim() || usernameValidation.available !== true)) ||
                      !formData.avatar.trim() ||
                      !formData.industry.trim() ||
                      formData.bio.trim().length < 50 ||
                      formData.skills.length < 3
                    }
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {existingProfile ? "Updating Profile..." : "Creating Profile..."}
                      </div>
                    ) : (
                      existingProfile ? "Update Profile" : "Complete Profile"
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
