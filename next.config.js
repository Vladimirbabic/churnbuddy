/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for development
  reactStrictMode: true,

  // Disable x-powered-by header
  poweredByHeader: false,

  // Configure allowed image domains (if using next/image)
  images: {
    domains: [],
  },
};

module.exports = nextConfig;
