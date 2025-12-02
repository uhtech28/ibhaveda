import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['ik.imagekit.io', 'html.tailus.io', 'images.unsplash.com', 'randomuser.me', 'i.pinimg.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'blessed-hedgehog-939.convex.cloud',
        pathname: '/api/storage/**',
      },
    ],
  },
};

export default nextConfig;
