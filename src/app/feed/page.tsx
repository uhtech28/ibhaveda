import { preloadQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import { FeedClient } from "./FeedClient";

export default async function FeedPage() {
  const preloadedIdeas = await preloadQuery(api.ideas.getPublicIdeas, { limit: 20 });

  return <FeedClient preloadedIdeas={preloadedIdeas} />;
}
