/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['lh3.googleusercontent.com'], // Google OAuth用
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'hearing.yamashu.com'],
    },
  },
};

module.exports = nextConfig;
