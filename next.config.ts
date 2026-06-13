import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV !== 'production';

// React dev mode (Fast Refresh, callstack reconstruction) requires eval().
// Allow it ONLY in development; production stays strict.
const scriptSrc = isDev ? "'self' 'unsafe-inline' 'unsafe-eval'" : "'self' 'unsafe-inline'";

// Defense-in-depth HTTP headers applied to every response.
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  // Lock down cross-origin sharing for the document. Same-origin resources
  // can still be loaded; cross-origin embedders are blocked.
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "form-action 'self'",
      // Next.js injects inline runtime/styles; framer-motion sets inline styles.
      `script-src ${scriptSrc}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.supabase.co",
      "font-src 'self' data:",
      // Supabase REST/Realtime, Google OAuth, Anthropic API.
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://oauth2.googleapis.com https://www.googleapis.com https://api.anthropic.com",
    ].join('; '),
  },
];

// Override the Vercel-default wildcard `Access-Control-Allow-Origin: *` on
// /api/* so APIs aren't advertised as cross-origin readable. Pin to the
// app's own origin; cross-origin requests will fail the browser's CORS check.
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
