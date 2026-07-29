import { candidateByToken } from '@/lib/db';
import { buildReceipt, referenceCode } from '@/lib/receipt';
import { sweepExpired } from '@/lib/sitting';

export const dynamic = 'force-dynamic';

/**
 * Candidate submission receipt as a PDF.
 *
 * The invite token is the only credential — the same secret that let the
 * candidate sit the test. Available only once the sitting is closed, so it
 * cannot be used to prove a sitting is "done" while it is still open.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  // Close out any sitting whose clock ran out, so a candidate who was timed
  // out can still download their receipt immediately.
  sweepExpired();

  const c = candidateByToken(token);
  if (!c) return new Response('Not found', { status: 404 });
  if (!c.submitted_at) return new Response('This assessment has not been submitted yet.', { status: 409 });

  const pdf = await buildReceipt(c);
  const stamp = new Date(c.submitted_at).toISOString().slice(0, 10);
  const slug = c.name.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'candidate';

  return new Response(Buffer.from(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="assessment-receipt-${slug}-${stamp}.pdf"`,
      'Content-Length': String(pdf.length),
      'Cache-Control': 'no-store',
      'X-Reference': referenceCode(c),
    },
  });
}
