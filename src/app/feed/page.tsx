import { preloadQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import { FeedClient } from "./FeedClient";

export default async function FeedPage() {
  // Random seed generated server-side and passed to the client so both sides
  // use the same value — avoids hydration mismatch while still varying per load.
  const seed = Math.floor(Math.random() * 5);

  const preloadedIdeas = await preloadQuery(api.ideas.getPublicIdeas, {
    limit: 20,
    seed,
  });

  return <FeedClient preloadedIdeas={preloadedIdeas} seed={seed} />;
}
