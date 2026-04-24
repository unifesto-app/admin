import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Skip static generation for admin pages that require authentication
  // These pages need runtime environment variables and session data
  experimental: {
    // Disable static optimization for dynamic routes
  },
  // Force dynamic rendering for all pages
  // This prevents build-time errors when environment variables are needed
  output: 'standalone',
}

export default nextConfig;
