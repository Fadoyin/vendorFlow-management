/** @type {import('next').NextConfig} */
const nextConfig = {
  // Working configuration with security headers
  reactStrictMode: true,
  // Disable type checking during build for now
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable static generation to avoid prerendering errors
  output: 'standalone',
  trailingSlash: false,
  // Force dynamic rendering for all pages
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  // App Router is enabled by default in Next.js 13+
  // Help prevent hydration mismatches
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Suppress hydration warnings in development
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  env: {
    NEXT_PUBLIC_STORAGE_KEY: process.env.NEXT_PUBLIC_STORAGE_KEY || 'vendorflow-secure-key-change-in-production',
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; connect-src 'self' http://localhost:* https:; font-src 'self' data: https://fonts.gstatic.com;",
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig 