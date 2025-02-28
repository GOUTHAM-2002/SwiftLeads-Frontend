import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  // Add ESLint configuration to ignore errors during builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Add TypeScript configuration to ignore type errors during builds
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
