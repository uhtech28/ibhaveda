"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { HeroHeader } from "@/components/header";
import FooterSection from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft } from "lucide-react";
import { ProfileBadges } from "@/components/user/ProfileBadges";
import { PremiumIcon } from "@/components/ui/PremiumIcon";
import { getVentureBadgeEmoji } from "@/components/badges/BadgeCard";

export default function ProfileBadgesPage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;

  const currentUser = useQuery(api.users.getCurrentUser);
  const profile = useQuery(api.users.getUserProfile, { username });

  const earnedBadges = useQuery(api.badges.getUserProfileBadges, profile ? { userId: profile._id } : "skip");
  const equippedBadgeIds = profile?.equippedBadges || [];
  const equippedBadgesList = earnedBadges?.filter((b) => equippedBadgeIds.includes(b.id)) || [];

  if (profile === undefined) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <HeroHeader />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <Spinner />
            <p className="text-muted-foreground mt-4">Loading badges...</p>
          </div>
        </main>
        <FooterSection />
      </div>
    );
  }

  if (profile === null) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <HeroHeader />
        <main className="flex-1 flex items-center justify-center px-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <h1 className="text-2xl font-bold text-destructive mb-2">Profile Not Found</h1>
              <p className="text-muted-foreground mb-4">
                The user @{username} doesn&apos;t exist.
              </p>
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
              </Button>
            </CardContent>
          </Card>
        </main>
        <FooterSection />
      </div>
    );
  }

  const isCurrentUser = !!(currentUser && profile && currentUser._id === profile._id);
  const profileData = { ...profile, skills: profile.skills || [], industries: profile.industries || [] };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <HeroHeader />

      <main className="flex-1 container mx-auto px-4 py-12 pt-32 max-w-5xl">
        <div className="mb-6 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 flex-wrap">
              {profile.displayName}&apos;s Badges
              {equippedBadgesList.slice(0, 3).map((badge) => (
                <span
                  key={badge.id}
                  title={`${badge.name}: ${badge.description}`}
                  className="inline-flex items-center justify-center w-6.5 h-6.5 rounded-md bg-yellow-500/10 border border-yellow-500/40 text-yellow-400 text-sm select-none shadow-[0_0_8px_rgba(234,179,8,0.2)] animate-pulse hover:scale-115 transition-transform duration-200 cursor-pointer"
                  style={{ animationDuration: "3s" }}
                >
                  <PremiumIcon name={(badge as any).icon || getVentureBadgeEmoji(badge.id, badge.name)} className="w-4 h-4" strokeWidth={1.5} />
                </span>
              ))}
            </h1>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
          </div>
        </div>

        <ProfileBadges userId={profile._id} isOwner={isCurrentUser} profile={profileData} />
      </main>

      <FooterSection />
    </div>
  );
}
