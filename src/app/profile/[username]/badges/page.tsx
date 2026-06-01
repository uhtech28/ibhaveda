"use client";

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

export default function ProfileBadgesPage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;

  const currentUser = useQuery(api.users.getCurrentUser);
  const profile = useQuery(api.users.getUserProfile, { username });

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

      <main className="flex-1 container mx-auto px-4 py-6 pt-24 max-w-5xl">
        <div className="mb-4 -ml-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Go back">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </div>

        <ProfileBadges userId={profile._id} isOwner={isCurrentUser} profile={profileData} />
      </main>

      <FooterSection />
    </div>
  );
}
