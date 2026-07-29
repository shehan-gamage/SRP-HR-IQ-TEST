import { NextRequest } from 'next/server';
import { isAuthed } from '@/lib/auth';
import { allCandidates, statusOf } from '@/lib/db';
import { resultFor, sweepExpired } from '@/lib/sitting';
import { BANDS, CUTOFF } from '@/lib/scoring';
import { DOMAINS, DomainCode, bankFor } from '@/lib/questions';

export const dynamic = 'force-dynamic';

/** RFC 4180 quoting, and a guard against spreadsheet formula injection. */
function cell(v: unknown): string {
  let s = v === null || v === undefined ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(req: NextRequest) {
  if (!(await isAuthed())) return new Response('Unauthorized', { status: 401 });
  await sweepExpired();

  const sp = req.nextUrl.searchParams;
  let rows = (await allCandidates()).map((c) => ({ c, status: statusOf(c) }));
  if (sp.get('status')) rows = rows.filter((r) => r.status === sp.get('status'));
  if (sp.get('tier')) rows = rows.filter((r) => r.c.band === sp.get('tier'));
  if (sp.get('level')) rows = rows.filter((r) => bankFor(r.c.level).level === sp.get('level'));
  const q = sp.get('q')?.toLowerCase();
  if (q) {
    rows = rows.filter(
      (r) =>
        r.c.name.toLowerCase().includes(q) ||
        r.c.ref.toLowerCase().includes(q) ||
        r.c.position.toLowerCase().includes(q),
    );
  }
  if (sp.get('sort') === 'score') {
    rows = [...rows].sort((a, b) => (b.c.score ?? -1) - (a.c.score ?? -1));
  }

  const domainCodes = Object.keys(DOMAINS) as DomainCode[];
  const header = [
    'Name', 'First name', 'Middle name', 'Last name',
    'Candidate ID', 'Position', 'Difficulty', 'Email', 'Status',
    'Score', 'Total', 'Percent', 'Tier', 'Meets cut-off',
    ...domainCodes.map((d) => DOMAINS[d]),
    'Extra time', 'Time allowed (min)', 'Time used (s)',
    'Invited', 'Started', 'Submitted', 'Completion',
  ];

  const lines = [header.map(cell).join(',')];

  for (const { c, status } of rows) {
    const done = Boolean(c.submitted_at);
    const r = done ? resultFor(c) : null;
    const used = c.started_at && c.submitted_at ? Math.round((c.submitted_at - c.started_at) / 1000) : '';
    lines.push(
      [
        c.name, c.first_name, c.middle_name, c.last_name,
        c.ref, c.position, bankFor(c.level).name, c.email, status,
        r ? r.score : '', r ? r.total : '', r ? r.pct : '',
        c.band ? BANDS.find((b) => b.slug === c.band)?.name : '',
        r ? (r.score >= CUTOFF ? 'YES' : 'NO') : '',
        ...domainCodes.map((d) => {
          const ds = r?.domains.find((x) => x.code === d);
          return ds ? `${ds.correct}/${ds.total}` : '';
        }),
        c.extra_time ? 'YES' : 'NO',
        Math.round(c.duration_sec / 60),
        used,
        new Date(c.created_at).toISOString(),
        c.started_at ? new Date(c.started_at).toISOString() : '',
        c.submitted_at ? new Date(c.submitted_at).toISOString() : '',
        c.submit_mode ?? '',
      ].map(cell).join(','),
    );
  }

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response('﻿' + lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="aptitude-results-${stamp}.csv"`,
    },
  });
}
