/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactStrictMode: true,
  images: {
    domains: ['ipfs.io'], // Allow images from IPFS gateway
  },
  // Suppress specific warning messages
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // This suppresses the useLayoutEffect SSR warning from valtio
      config.infrastructureLogging = {
        level: 'error',
      }
    }
    return config
  },
  // Disable ESLint in production builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript type checking in production builds
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;