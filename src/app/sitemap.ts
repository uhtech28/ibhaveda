import type { MetadataRoute } from "next";
import {
  absoluteUrl,
  articlePath,
  articles,
  categories,
  categoryPath,
} from "@/lib/articles";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/articles"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...categories.map((category) => ({
      url: absoluteUrl(categoryPath(category)),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...articles.map((article) => ({
      url: absoluteUrl(articlePath(article)),
      lastModified: new Date(article.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
