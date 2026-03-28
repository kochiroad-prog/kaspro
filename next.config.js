/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        // VPS IP / domain dibaca otomatis dari env
        process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, '').replace(/\/$/, '') ?? '',
      ].filter(Boolean),
    },
  },
}

module.exports = nextConfig
