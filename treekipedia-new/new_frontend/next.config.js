/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Configure image domains
  images: {
    domains: ['ipfs.io', 'bafybeihbmin5h7ektpjqgr7rdnmtxcaujjgxcxz6nu5ynvkqirtbxj7xt4.ipfs.infura-ipfs.io'],
  },
  
  // Use trailing slash for more consistent assets
  trailingSlash: true,
};

module.exports = nextConfig;