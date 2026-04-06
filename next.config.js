/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Tetap build meski ada TypeScript warning
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, '').replace(/\/$/, '') ?? '',
      ].filter(Boolean),
    },
  },
}

module.exports = nextConfig
