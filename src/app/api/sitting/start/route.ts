import { NextRequest, NextResponse } from 'next/server';
import { openSitting } from '@/lib/sitting';

export const dynamic = 'force-dynamic';

/**
 * Starts or resumes a sitting. Idempotent: the first call stamps the start
 * time and freezes the option shuffle; later calls return the same paper with
 * the remaining time recomputed server-side.
 */
export async function POST(req: NextRequest) {
  const { token } = (await req.json().catch(() => ({}))) as { token?: string };
  if (!token) return NextResponse.json({ error: 'not_found' }, { status: 400 });

  const out = await openSitting(token);
  if ('error' in out) return NextResponse.json({ error: out.error }, { status: 409 });
  return NextResponse.json(out.payload);
}
