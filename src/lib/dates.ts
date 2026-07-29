/**
 * Date formatting pinned to the business timezone.
 *
 * Pages, receipts and emails all render on the server, and hosted servers
 * (Vercel) run in UTC — so relying on the server's local timezone shows HR
 * and candidates the wrong wall-clock time. Every human-facing timestamp
 * goes through these helpers instead. CSV exports deliberately keep ISO/UTC.
 */

export const TIME_ZONE = process.env.TIME_ZONE || 'Asia/Colombo';

/** e.g. "Jul 29, 2026, 10:56 PM" — used in tables and the receipt. */
export function fmtDateTime(ms: number | null | undefined): string {
  if (!ms) return '—';
  return new Date(ms).toLocaleString('en-US', {
    timeZone: TIME_ZONE,
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/** e.g. "August 12, 2026" — used for the invite email's deadline. */
export function fmtDate(ms: number | null | undefined): string {
  if (!ms) return '—';
  return new Date(ms).toLocaleDateString('en-US', {
    timeZone: TIME_ZONE,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
