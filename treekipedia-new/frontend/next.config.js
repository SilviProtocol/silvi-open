/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactStrictMode: true,
  images: {
    domains: ['ipfs.io'], // Allow images from IPFS gateway
  },
};

module.exports = nextConfig;