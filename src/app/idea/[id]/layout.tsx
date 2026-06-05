// OG + Twitter Card metadata for /idea/[id]. Lets LinkedIn / X / Facebook
// render a rich preview (title, body, image, video) when the URL is
// shared.

import type { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  let meta: Awaited<ReturnType<typeof fetchQuery<typeof api.ideas.getIdeaForShare>>> = null;
  try {
    meta = await fetchQuery(api.ideas.getIdeaForShare, {
      ideaId: id as Id<"ideas">,
    });
  } catch {
    meta = null;
  }

  // Fall back to a generic site card if the idea is missing, private,
  // or the fetch failed.
  if (!meta) {
    return {
      title: "Ibhaveda",
      description: "Builders shipping ideas in public.",
    };
  }

  const title = meta.title;
  const description = (meta.description ?? "").slice(0, 220);
  const ogImage = meta.imageUrl ?? undefined;
  const ogVideo = meta.videoUrl ?? undefined;
  const ogVideoMime = meta.videoMimeType ?? undefined;

  const openGraph: Metadata["openGraph"] = {
    type: "article",
    title,
    description,
    siteName: "Ibhaveda",
    authors: meta.authorDisplayName ? [meta.authorDisplayName] : undefined,
    ...(ogImage && {
      images: [{ url: ogImage, alt: title }],
    }),
    ...(ogVideo && {
      videos: [
        {
          url: ogVideo,
          type: ogVideoMime,
        },
      ],
    }),
  };

  // Large-image card when there's an image or video; plain summary
  // otherwise.
  const twitter: Metadata["twitter"] = {
    card: ogImage || ogVideo ? "summary_large_image" : "summary",
    title,
    description,
    ...(ogImage && { images: [ogImage] }),
  };

  return {
    title,
    description,
    openGraph,
    twitter,
  };
}

export default function IdeaLayout({ children }: LayoutProps) {
  return children;
}
