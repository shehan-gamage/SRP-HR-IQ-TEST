import Link from 'next/link';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { allCandidates, statusOf } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { deleteCandidate, sweepExpired } from '@/lib/sitting';
import { BANDS, CUTOFF } from '@/lib/scoring';
import { LEVELS, TOTAL_ITEMS, bankFor } from '@/lib/questions';
import CopyLink from '@/components/CopyLink';
import ConfirmButton from '@/components/ConfirmButton';
import { EyeIcon, TrashIcon } from '@/components/icons';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Candidates' };

async function baseUrl(): Promise<string> {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? 'http';
  return `${proto}://${host}`;
}

async function removeCandidate(formData: FormData) {
  'use server';
  // Server actions are their own POST endpoints; the auth-gated layout does
  // not protect them, so every mutating action checks for itself.
  await requireAdmin();
  await deleteCandidate(String(formData.get('id')));
  revalidatePath('/admin');
}


export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; tier?: string; level?: string; q?: string; sort?: string }>;
}) {
  await sweepExpired();
  const sp = await searchParams;
  const base = await baseUrl();

  let rows = (await allCandidates()).map((c) => ({ c, status: statusOf(c) }));

  if (sp.status) rows = rows.filter((r) => r.status === sp.status);
  if (sp.tier) rows = rows.filter((r) => r.c.band === sp.tier);
  if (sp.level) rows = rows.filter((r) => bankFor(r.c.level).level === sp.level);
  if (sp.q) {
    const q = sp.q.toLowerCase();
    rows = rows.filter(
      (r) => r.c.name.toLowerCase().includes(q) || r.c.position.toLowerCase().includes(q),
    );
  }
  if (sp.sort === 'score') {
    rows = [...rows].sort((a, b) => (b.c.score ?? -1) - (a.c.score ?? -1));
  }

  const all = await allCandidates();
  const submitted = all.filter((c) => c.submitted_at);
  const shortlisted = submitted.filter((c) => (c.score ?? 0) >= CUTOFF);
  // Carry only the filters that are actually set, so the export matches the view.
  const qs = new URLSearchParams(
    Object.entries(sp).filter(([, v]) => typeof v === 'string' && v !== '') as [string, string][],
  ).toString();

  return (
    <div className="wrap">
      <div className="spread">
        <div>
          <h1>Candidates</h1>
          <p className="sub">
            {all.length} invited &middot; {submitted.length} sat &middot; {shortlisted.length} at or
            above the cut-off ({CUTOFF}/{TOTAL_ITEMS})
          </p>
        </div>
        <div className="row noprint">
          <Link className="btn primary" href="/admin/new">New Invite</Link>
          <a className="btn ghost" href={`/admin/export${qs ? `?${qs}` : ''}`}>Export CSV</a>
        </div>
      </div>

      <div className="card noprint">
        <form className="row" method="get">
          <input
            type="text" name="q" placeholder="Search name or position"
            defaultValue={sp.q ?? ''} style={{ flex: '1 1 13.75rem', width: 'auto' }}
          />
          <select name="status" defaultValue={sp.status ?? ''} style={{ width: 'auto' }}>
            <option value="">All Statuses</option>
            <option value="pending">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="submitted">Submitted</option>
            <option value="expired">Expired</option>
          </select>
          <select name="tier" defaultValue={sp.tier ?? ''} style={{ width: 'auto' }}>
            <option value="">All Tiers</option>
            {BANDS.map((b) => (
              <option key={b.slug} value={b.slug}>{b.name}</option>
            ))}
          </select>
          <select name="level" defaultValue={sp.level ?? ''} style={{ width: 'auto' }}>
            <option value="">All Difficulties</option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>{bankFor(l).name}</option>
            ))}
          </select>
          <select name="sort" defaultValue={sp.sort ?? ''} style={{ width: 'auto' }}>
            <option value="">Newest First</option>
            <option value="score">Highest Score First</option>
          </select>
          <button className="ghost" type="submit">Apply</button>
          <Link className="btn ghost" href="/admin">Clear</Link>
        </form>
      </div>

      <div className="card">
        {rows.length === 0 ? (
          <p className="note" style={{ margin: 0 }}>
            No candidates match. Create an invite to get started.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Position</th>
                <th>Difficulty</th>
                <th>Status</th>
                <th className="right">Score</th>
                <th>Tier</th>
                <th className="noprint">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ c, status }) => (
                <tr key={c.id}>
                  <td>
                    <b>{c.name}</b>
                    {c.ref || c.extra_time ? (
                      <div className="note">
                        {[c.ref, c.extra_time ? 'extra time' : ''].filter(Boolean).join(' · ')}
                      </div>
                    ) : null}
                  </td>
                  <td>{c.position || '—'}</td>
                  <td>
                    <span className={`lvl lvl-${bankFor(c.level).level}`}>{bankFor(c.level).name}</span>
                  </td>
                  <td><span className={`st st-${status}`}>{status.replace('_', ' ')}</span></td>
                  <td className="right">
                    {c.score === null ? '—' : `${c.score}/${TOTAL_ITEMS}`}
                  </td>
                  <td>
                    {c.band ? (
                      <span className={`tier t-${c.band}`}>
                        {BANDS.find((b) => b.slug === c.band)?.name}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="noprint">
                    <div className="actions-row">
                      <Link
                        className="btn ghost btn-icon-only"
                        href={`/admin/c/${c.id}`}
                        aria-label={`View ${c.name}`}
                        title="View"
                      >
                        <EyeIcon />
                      </Link>
                      {status === 'pending' || status === 'in_progress' ? (
                        <CopyLink url={`${base}/t/${c.token}`} size="icon" label="Copy Test Link" />
                      ) : null}
                      <form action={removeCandidate}>
                        <input type="hidden" name="id" value={c.id} />
                        <ConfirmButton
                          className="danger btn-icon-only"
                          aria-label={`Delete ${c.name}`}
                          title="Delete"
                          message={`Delete ${c.name}'s record permanently? This cannot be undone.`}
                        >
                          <TrashIcon />
                        </ConfirmButton>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="note">
        See the <Link href="/admin/guide">scoring guide</Link> for the interpretation bands and
        administration rules.
      </p>
    </div>
  );
}
