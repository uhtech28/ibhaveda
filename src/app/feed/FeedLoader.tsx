import { unstable_cache } from "next/cache";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import { FeedClient } from "./FeedClient";

// Cache per seed bucket (0-4) for 60s.
// Server-side fetchQuery is an HTTP call (~200-400ms cold, ~0ms cached).
const getCachedIdeas = unstable_cache(
  async (seed: number) =>
    fetchQuery(api.ideas.getPublicIdeas, { limit: 20, seed }),
  ["public-feed-ideas"],
  { revalidate: 60 }
);

export async function FeedLoader({ seed }: { seed: number }) {
  const initialIdeas = await getCachedIdeas(seed);
  return <FeedClient initialIdeas={initialIdeas as any} seed={seed} />;
}
