"use client";

/**
 * Videos page — short-form video feed.
 *
 * Renders `VideoFeed` with the composer trigger enabled. The feed
 * handles its own loading / empty states and lazy-mounts videos as
 * they scroll into view.
 */

import { VideoFeed } from "@/components/video/VideoFeed";

export default function VideosPage() {
  return (
    <div className="mx-auto max-w-md p-4">
      <VideoFeed compose limit={20} />
    </div>
  );
}
