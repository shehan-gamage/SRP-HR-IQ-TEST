import type { NextConfig } from 'next';

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
