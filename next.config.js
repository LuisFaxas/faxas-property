/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  api: {
    bodyParser: {
      sizeLimit: '1mb', // Limit API route body size to 1MB
    },
    responseLimit: '8mb', // Limit API response size to 8MB
  },
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
  // Headers are now handled by middleware.ts for better control
};

module.exports = nextConfig;