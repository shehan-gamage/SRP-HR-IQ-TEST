import type { Metadata } from 'next';
import Script from 'next/script';
/**
 * Plus Jakarta Sans (SIL Open Font License 1.1), self-hosted.
 *
 * Shipped as an npm dependency rather than fetched by `next/font/google`:
 * the font files are vendored into node_modules and bundled at build time, so
 * builds need no network access and a candidate's browser never contacts
 * Google. Variable font — every weight from one file.
 *
 * (`next/font/google` was the first attempt. It fails behind this network's
 * TLS interception with UNABLE_TO_VERIFY_LEAF_SIGNATURE and silently
 * substitutes a metric fallback, which looks like it worked but is not the
 * requested face.)
 */
import '@fontsource-variable/plus-jakarta-sans';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Cognitive Aptitude Assessment',
    template: '%s — Cognitive Aptitude Assessment',
  },
  description: 'Pre-employment cognitive aptitude screening',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: browser extensions (Grammarly, password
    // managers, translators) inject attributes onto <body> before React
    // hydrates — e.g. data-gr-ext-installed — which React reports as a
    // hydration mismatch. This suppresses the warning for THIS element's
    // attributes only; genuine mismatches in any child still surface.
    <html lang="en">
      <body suppressHydrationWarning>
        {/* Browser extensions (MetaMask etc.) inject scripts into every page
            and their internal errors ("Failed to connect to MetaMask") land
            on window, where the dev overlay reports them as app crashes.
            Registered beforeInteractive so it runs ahead of the framework's
            handlers; stopImmediatePropagation swallows ONLY events whose
            stack or source is a browser extension, never app errors. */}
        <Script id="extension-error-filter" strategy="beforeInteractive">{`
          (function () {
            var fromExt = function (s) {
              return typeof s === 'string' && (
                s.indexOf('chrome-extension://') !== -1 ||
                s.indexOf('moz-extension://') !== -1 ||
                s.indexOf('safari-web-extension://') !== -1
              );
            };
            window.addEventListener('error', function (e) {
              if (fromExt(e.filename) || fromExt(e.error && e.error.stack)) {
                e.stopImmediatePropagation();
              }
            });
            window.addEventListener('unhandledrejection', function (e) {
              var r = e.reason;
              if (fromExt(r && r.stack) ||
                  (r && typeof r.message === 'string' && r.message.indexOf('MetaMask') !== -1)) {
                e.stopImmediatePropagation();
                e.preventDefault();
              }
            });
          })();
        `}</Script>
        {children}
      </body>
    </html>
  );
}
