import type { NextConfig } from 'next';

/* Content-Security-Policy. 'unsafe-inline' scripts are required by Next's
   own bootstrap and this app's two inline init scripts; the policy still
   blocks loading scripts from other origins, plugins, framing, and form
   posts to foreign hosts. Dev mode additionally needs 'unsafe-eval' for
   hot reload. */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const nextConfig: NextConfig = {
  // libsql ships native bindings; keep it out of the bundler's hands.
  serverExternalPackages: ['@libsql/client', 'libsql'],
  // The receipt PDF reads its font files with fs at runtime; make sure they
  // are traced into the serverless function bundle on Vercel.
  outputFileTracingIncludes: {
    '/t/[token]/receipt': ['./src/assets/fonts/**/*'],
  },
  // Hide the dev-mode "N" badge; it confuses test sittings run against
  // `npm run dev`. Production builds never show it either way.
  devIndicators: false,
  // Candidate PII lives here. Do not let it be indexed or framed.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'same-origin' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ];
  },
};

export default nextConfig;
