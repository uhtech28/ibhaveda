import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/articles";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/articles",
          "/venture-creation",
          "/startup-execution",
          "/founder-collaboration",
          "/open-innovation",
          "/future-of-entrepreneurship",
        ],
        disallow: [
          "/api/",
          "/calendar",
          "/community",
          "/create-idea",
          "/feed",
          "/idea/",
          "/my-feed",
          "/my-ideas",
          "/my-ventures",
          "/profile/",
          "/todos",
          "/venture/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
