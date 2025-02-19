/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // Configure routes that should be dynamic
  experimental: {
    // This setting is now required to prevent static generation of API routes
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

module.exports = nextConfig
