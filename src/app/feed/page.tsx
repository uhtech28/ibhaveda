import { Suspense } from "react";
import { FeedClient } from "./FeedClient";

// Next 15 requires any subtree calling useSearchParams() to be inside a Suspense
// boundary during static prerender (masked previously by the global force-dynamic
// we removed). Ideaforge experience.tsx (mounted inside FeedClient) uses
// useSearchParams — wrap the whole client tree here so prerender doesn't bail.
export default function FeedPage() {
  return (
    <Suspense fallback={null}>
      <FeedClient />
    </Suspense>
  );
}
