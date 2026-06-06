import { Suspense } from "react";
import { FeedLoader } from "./FeedLoader";
import { FeedSkeleton } from "./FeedSkeleton";

export default function FeedPage() {
  // Seed generated here (sync) so it's stable for this request.
  // FeedLoader uses it for both the cached fetch and the client subscription.
  const seed = Math.floor(Math.random() * 5);

  return (
    // Shell + skeleton streams immediately — no blocking await.
    // FeedLoader streams in once the Convex cache/fetch resolves (~0ms cached, ~400ms cold).
    <Suspense fallback={<FeedSkeleton />}>
      <FeedLoader seed={seed} />
    </Suspense>
  );
}
