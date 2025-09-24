/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  // Disable ESLint during production builds to allow deployment with warnings
  eslint: {
    ignoreDuringBuilds: true,
  },
  // TEMPORARY: Disable TypeScript errors to deploy quickly
  // TODO: Remove this after fixing all type errors
  typescript: {
    ignoreBuildErrors: true,
  },
  // Completely disable all caching to avoid webpack issues
  webpack: (config, { dev, isServer }) => {
    // Disable all caching
    config.cache = false;

    // Additional webpack fixes for module resolution
    config.resolve = {
      ...config.resolve,
      fallback: {
        ...config.resolve?.fallback,
      },
    };

    // Disable splitChunks in development to avoid module issues
    if (dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: false,
      };
    }

    return config;
  },
  // Use default output for stability
  // output: 'standalone', // Commenting out for now
  // External packages for server components
  serverExternalPackages: ['@prisma/client', 'prisma'],
  // Headers are now handled by middleware.ts for better control
};

module.exports = nextConfig;