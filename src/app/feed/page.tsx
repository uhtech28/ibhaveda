import { preloadQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import { FeedClient } from "./FeedClient";

export default async function FeedPage() {
  // Prefetch the first page of ideas on the server so the feed renders
  // immediately — no WebSocket cold-start wait on the client.
  const preloadedIdeas = await preloadQuery(api.ideas.getPublicIdeas, {
    limit: 20,
    seed: 1, // stable seed for SSR; client randomises on hydration
  });

  return <FeedClient preloadedIdeas={preloadedIdeas} />;
}
