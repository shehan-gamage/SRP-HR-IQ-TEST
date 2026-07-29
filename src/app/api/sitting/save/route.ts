import { NextRequest, NextResponse } from 'next/server';
import { saveAnswers } from '@/lib/sitting';

export const dynamic = 'force-dynamic';

/** Autosave. Rejected once the server-side deadline plus grace has passed. */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    token?: string;
    answers?: Record<string, number | null>;
  };
  if (!body.token || typeof body.answers !== 'object' || body.answers === null) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const ok = saveAnswers(body.token, body.answers);
  return NextResponse.json({ ok }, { status: ok ? 200 : 409 });
}
