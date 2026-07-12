import type { NextConfig } from "next";

// Was `public, max-age=31536000, immutable` (1 YEAR immutable) which
// froze /assets/* on user devices for a full year -- new deploys had
// no effect on returning visitors because their browser refused to
// re-fetch. Now: cache for 1 hour then revalidate. Static-hash paths
// under /_next/static/ keep the long cache because Next.js includes
// a build hash in the filename (each new build = new URL, safe).
const staticCache = "public, max-age=3600, s-maxage=60, stale-while-revalidate=86400";
const buildHashedCache = "public, max-age=31536000, immutable";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "motion",
      "date-fns",
      "@radix-ui/react-dialog",
      "@radix-ui/react-tooltip",
      "@radix-ui/react-popover",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-tabs",
      "@radix-ui/react-select",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-avatar",
      "@radix-ui/react-accordion",
      "@radix-ui/react-label",
      "@radix-ui/react-progress",
      "@radix-ui/react-scroll-area",
      "@radix-ui/react-separator",
      "@radix-ui/react-switch",
      "@radix-ui/react-toast",
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*.vcf",
        headers: [
          { key: "Content-Type", value: "text/vcard; charset=utf-8" },
        ],
      },
      {
        source: "/assets/:path*",
        headers: [{ key: "Cache-Control", value: staticCache }],
      },
      {
        source: "/audio/:path*",
        headers: [{ key: "Cache-Control", value: staticCache }],
      },
      {
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: buildHashedCache }],
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "ik.imagekit.io" },
      { protocol: "https", hostname: "html.tailus.io" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "randomuser.me" },
      { protocol: "https", hostname: "i.pinimg.com" },
      { protocol: "https", hostname: "**.convex.cloud" },
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "images.clerk.dev" },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
