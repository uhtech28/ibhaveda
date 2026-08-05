"use client";

/**
 * @file EditProfileModal.tsx
 * @description Modal-based Edit Profile UI opened from the profile
 *  page pencil button. Consolidates in a single scrollable dialog:
 *    1. Basic profile fields (avatar, name, username [read-only], bio,
 *       industries, skills) — same fields the old /profile-setup Edit
 *       form used to expose, submitted through api.users.updateUserProfile.
 *    2. Settings section — the shared <UserSettingsBody /> that renders
 *       the Persona / Social / Audio tabs already used by the in-map
 *       settings dialog.
 *
 *  /profile-setup is now onboarding-only, so all profile editing lives
 *  here. Product ask: "the pencil icon should open edit profile which
 *  includes the settings of persona change, account binding".
 */

import React, { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

import { AvatarUpload } from "@/components/user/avatar-upload";
import { IndustriesMultiSelect } from "@/components/IndustriesMultiSelect";
import { SkillsMultiSelect } from "@/components/SkillsMultiSelect";
import { UserSettingsBody } from "@/components/map/MapSettingsDialog";

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProfileModal({ open, onOpenChange }: EditProfileModalProps) {
  const { toast } = useToast();
  const existingProfile = useQuery(api.users.getCurrentUser, {});
  const updateUserProfile = useMutation(api.users.updateUserProfile);

  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    displayName: "",
    username: "",
    bio: "",
    avatar: "",
    industries: [] as string[],
    skills: [] as string[],
  });
  const [hydrated, setHydrated] = useState(false);

  // Hydrate the form from Convex the first time the profile arrives (or
  // whenever the modal re-opens). Re-hydration on open makes sure the
  // form always shows the latest server-side state instead of stale
  // local edits from a previous close-without-save.
  useEffect(() => {
    if (!existingProfile) return;
    if (hydrated && open) return;
    if (!open) {
      // Reset the "hydrated" flag when the modal closes so the next
      // open reloads fresh values.
      if (hydrated) setHydrated(false);
      return;
    }
    setFormData({
      displayName: existingProfile.displayName ?? "",
      username: existingProfile.username ?? "",
      bio: existingProfile.bio ?? "",
      avatar: existingProfile.avatar ?? "",
      industries:
        existingProfile.industries ??
        (existingProfile.industry ? [existingProfile.industry] : []),
      skills: existingProfile.skills ?? [],
    });
    setHydrated(true);
  }, [existingProfile, open, hydrated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!existingProfile) return;
    const trimmedName = formData.displayName.trim();
    if (!trimmedName) {
      toast({
        title: "Name required",
        description: "Please enter a display name.",
        variant: "destructive",
        duration: 4000,
      });
      return;
    }
    if (formData.bio.length > 500) {
      toast({
        title: "Bio too long",
        description: "Bio must be 500 characters or fewer.",
        variant: "destructive",
        duration: 4000,
      });
      return;
    }
    setSaving(true);
    try {
      await updateUserProfile({
        displayName: trimmedName,
        bio: formData.bio || undefined,
        avatar: formData.avatar || undefined,
        industry:
          formData.industries.length > 0 ? formData.industries[0] : undefined,
        industries: formData.industries,
        skills: formData.skills,
      });
      toast({
        title: "Profile updated",
        description: "Your changes have been saved.",
        duration: 3000,
      });
      onOpenChange(false);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to update profile";
      toast({
        title: "Update failed",
        description: msg,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setSaving(false);
    }
  };

  const loadingProfile = existingProfile === undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/*
        Width overrides — the shared DialogContent primitive ships with
        `sm:max-w-lg` (32rem) baked in, and any non-sm-prefixed
        `max-w-*` I add here loses to it in the CSS cascade because
        `sm:` is a media query. Have to use `sm:` and `md:` prefixes
        to actually beat that default. Aiming for a full-screen feel:
        max-w-5xl (~64rem) on desktop, near-full-width on smaller
        viewports, and 95vh so the modal fills the viewport vertically
        too — matches product ask ("make it wide like a separate
        screen").
      */}
      <DialogContent
        className="w-[95vw] max-w-[95vw] sm:!max-w-4xl md:!max-w-5xl xl:!max-w-6xl max-h-[95vh] overflow-y-auto p-0"
        srOnlyTitle="Edit Profile"
      >
        <DialogHeader className="px-8 pt-6 pb-3 border-b border-white/5">
          <DialogTitle className="text-2xl">Edit Profile</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Update your profile details and app settings.
          </p>
        </DialogHeader>

        {loadingProfile ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          // Wider inner padding + generous vertical rhythm so the
          // content breathes at the new max-w-5xl width. Previously
          // px-6 gave a cramped feel now that the frame is 2x wider.
          <div className="px-8 pb-8 pt-4 space-y-10">
            {/* ── Basic profile — avatar on the LEFT column, form on
                the RIGHT, so the wide layout doesn't waste horizontal
                space on a huge centered avatar column. On mobile it
                stacks vertically. ─────────────────────────────── */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex flex-col md:flex-row md:items-start md:gap-8">
                <div className="flex justify-center md:justify-start md:flex-shrink-0 md:pt-2">
                  <AvatarUpload
                    currentAvatar={formData.avatar}
                    displayName={formData.displayName || formData.username || "User"}
                    onAvatarChange={(url) =>
                      setFormData((prev) => ({ ...prev, avatar: url }))
                    }
                  />
                </div>
                <div className="flex-1 space-y-5 mt-4 md:mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-displayName" className="text-sm font-medium">
                    Full Name
                  </Label>
                  <Input
                    id="edit-displayName"
                    value={formData.displayName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        displayName: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => e.stopPropagation()}
                    onKeyUp={(e) => e.stopPropagation()}
                    onKeyPress={(e) => e.stopPropagation()}
                    placeholder="Your full name"
                    maxLength={60}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-username" className="text-sm font-medium">
                    Username
                  </Label>
                  <Input
                    id="edit-username"
                    value={formData.username}
                    disabled
                    readOnly
                    className="h-10 bg-muted/40 text-muted-foreground cursor-not-allowed"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Usernames cannot be changed after signup.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-bio" className="text-sm font-medium">
                  Bio
                </Label>
                <Textarea
                  id="edit-bio"
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, bio: e.target.value }))
                  }
                  onKeyDown={(e) => e.stopPropagation()}
                  onKeyUp={(e) => e.stopPropagation()}
                  onKeyPress={(e) => e.stopPropagation()}
                  placeholder="Tell people what you're building or what you're into."
                  maxLength={500}
                  rows={4}
                  className="resize-none"
                />
                <div className="flex justify-end">
                  <span className="text-[10px] text-muted-foreground">
                    {formData.bio.length}/500
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Industries</Label>
                <IndustriesMultiSelect
                  selectedIndustries={formData.industries}
                  onChange={(industries) =>
                    setFormData((prev) => ({ ...prev, industries }))
                  }
                  placeholder="Select industries…"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Skills</Label>
                <SkillsMultiSelect
                  selectedSkills={formData.skills}
                  onChange={(skills) =>
                    setFormData((prev) => ({ ...prev, skills }))
                  }
                  placeholder="Select skills…"
                />
              </div>
                </div>{/* /right column (form fields) */}
              </div>{/* /flex-row wrapper (avatar | fields) */}

              {/* Buttons row is OUTSIDE the two-column split so it
                  spans the full form width and sits flush-right. */}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "Update Profile"
                  )}
                </Button>
              </div>
            </form>

            {/* ── Settings (Persona / Social / Audio) ────────────────
                Reuses the same body the in-map settings dialog renders,
                but restyled inline against the modal background. The
                component was authored for a dark backdrop; we scope it
                inside a dark surface so its white text keeps contrast. */}
            <div className="pt-2 border-t border-border/60">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Settings
              </h3>
              <div className="rounded-lg bg-[#0a0d12] border border-white/10 p-4 text-white">
                <UserSettingsBody
                  onCloseParent={() => onOpenChange(false)}
                />
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default EditProfileModal;
