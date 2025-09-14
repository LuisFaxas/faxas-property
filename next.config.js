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
  // Disable webpack cache entirely to avoid corruption
  webpack: (config) => {
    config.cache = false;
    return config;
  },
  // Ensure proper output
  output: 'standalone',
  // Headers are now handled by middleware.ts for better control
};

module.exports = nextConfig;