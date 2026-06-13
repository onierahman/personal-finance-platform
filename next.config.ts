import type { NextConfig } from 'next';

// Static defense-in-depth headers. The Content-Security-Policy is set per
// request in middleware so it can include a fresh nonce — keeping it out of
// here avoids serving a stale, weaker CSP.
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Lock down cross-origin sharing for the document. Same-origin resources
  // can still be loaded; cross-origin embedders are blocked.
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
];

// Override the Vercel-default wildcard `Access-Control-Allow-Origin: *` on
// /api/* so APIs aren't advertised as cross-origin readable. We pin to the
// app's own origin; cross-origin requests will fail the browser's CORS check.
// (Cross-Origin-Resource-Policy: same-origin in securityHeaders provides
// belt-and-braces protection regardless of CORS.)
const APP_ORIGIN = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, '')
  || 'https://financeos-sepia.vercel.app';
const apiCorsHeaders = [
  { key: 'Access-Control-Allow-Origin', value: APP_ORIGIN },
  { key: 'Vary', value: 'Origin' },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      { source: '/api/:path*', headers: apiCorsHeaders },
    ];
  },
};

export default nextConfig;
