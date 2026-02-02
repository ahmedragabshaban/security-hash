const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@security-hash/shared'],
  experimental: {
    externalDir: true,
  },
  async rewrites() {
    return [
      {
        source: '/pwned/range/:prefix',
        destination: `${API_BASE_URL}/pwned/:prefix`,
      },
      {
        source: '/health',
        destination: `${API_BASE_URL}/health`,
      },
    ];
  },
};

module.exports = nextConfig;
