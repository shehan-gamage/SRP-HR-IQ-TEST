import { NextRequest, NextResponse } from 'next/server';
import { saveAnswers, submitSitting } from '@/lib/sitting';

export const dynamic = 'force-dynamic';

/**
 * Final submit. Scores server-side and returns nothing but an acknowledgement:
 * the candidate must not learn their score, the key, or which items they got
 * wrong.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    token?: string;
    answers?: Record<string, number | null>;
    mode?: 'candidate' | 'timeout';
  };
  if (!body.token) return NextResponse.json({ ok: false }, { status: 400 });

  // Final flush, then close. A late flush is dropped by saveAnswers' own
  // deadline check, so a stalled tab cannot post answers after time.
  if (body.answers) await saveAnswers(body.token, body.answers);

  const result = await submitSitting(body.token, body.mode === 'timeout' ? 'timeout' : 'candidate');
  return NextResponse.json({ ok: result !== null });
}
