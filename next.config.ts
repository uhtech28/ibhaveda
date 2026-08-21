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
      // MOBILE PERF: these packages are re-exports of many small modules;
      // optimizePackageImports strips unused re-exports at build time so we
      // don't ship the entire barrel to Moto-G-class devices. Every kB of JS
      // matters more on mobile because slow-3G throttling + weak CPU turn
      // extra bytes into visible TBT.
      "@clerk/nextjs",
      "convex",
      "convex/react",
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
    // MOBILE PERF: AVIF is ~50% smaller than JPEG, WebP is ~30% smaller.
    // On cellular / data-saver, a 100 KB JPEG hero becomes ~50 KB AVIF —
    // that alone can shave several hundred ms off mobile LCP. Order matters:
    // AVIF first so modern mobile browsers pick it, WebP fallback for
    // Safari < 16, and Next/Image auto-picks the original for older UAs.
    formats: ["image/avif", "image/webp"],
    // Tight device sizes — the smallest useful mobile viewport is 360.
    // Fewer breakpoints => fewer /_next/image build variants per asset =>
    // smaller total surface + more CDN cache hits.
    deviceSizes: [360, 480, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Cache optimized image responses at the CDN for a day; individual
    // deploys change the underlying source path so this is safe.
    minimumCacheTTL: 86400,
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
