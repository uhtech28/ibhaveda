"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Video } from "lucide-react";
import { VentureErrorBoundary } from "@/components/venture/error-boundary";

function StandaloneVideoCall() {
  const params = useParams();
  const ventureId = params.id as Id<"ventures">;
  const venture = useQuery(api.ventures.getVenture, { ventureId });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const roomName = venture
    ? encodeURIComponent(`InteractiveVenture_${venture._id}`)
    : null;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="border-b bg-card px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <Link href={`/venture/${ventureId}`}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-base font-bold flex items-center gap-2 sm:text-xl">
              <Video className="w-5 h-5 flex-shrink-0" />
              Live Video Call
            </h1>
            <p className="truncate text-xs text-muted-foreground sm:text-sm">
              Ad-hoc video session with project team. History is not stored.
            </p>
          </div>
        </div>
      </div>
      <div className="flex-1 w-full bg-black">
        {mounted && roomName ? (
          <iframe
            src={`https://meet.jit.si/${roomName}`}
            title="Venture video call"
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="w-full h-[calc(100vh-65px)] border-0 sm:h-[calc(100vh-80px)]"
          />
        ) : mounted && venture === null ? (
          <div className="flex h-[calc(100vh-65px)] items-center justify-center px-6 text-center text-sm text-muted-foreground sm:h-[calc(100vh-80px)]">
            This venture could not be found, so a video room cannot be started.
          </div>
        ) : (
          <div className="flex h-[calc(100vh-65px)] items-center justify-center text-sm text-muted-foreground sm:h-[calc(100vh-80px)]">
            Initializing secure video session...
          </div>
        )}
      </div>
    </div>
  );
}

export default function VideoCallPage() {
  return (
    <VentureErrorBoundary
      title="Failed to load Video Call"
      description="We couldn't load the live video session for this venture."
    >
      <StandaloneVideoCall />
    </VentureErrorBoundary>
  );
}
