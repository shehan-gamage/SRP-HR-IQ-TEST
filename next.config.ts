import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // node:sqlite is a built-in module; keep it out of the bundler's hands.
  serverExternalPackages: ['node:sqlite'],
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
