import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { candidateById, statusOf } from '@/lib/db';
import { markInviteEmailed, remainingSec, resultFor } from '@/lib/sitting';
import { sendInviteEmail } from '@/lib/mail';
import { requireAdmin } from '@/lib/auth';
import { CUTOFF } from '@/lib/scoring';
import { DOMAINS, TOTAL_ITEMS, bankFor } from '@/lib/questions';
import CopyLink from '@/components/CopyLink';
import SubmitButton from '@/components/SubmitButton';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: candidateById(id)?.name ?? 'Candidate' };
}

const fmt = (ms: number | null) =>
  ms ? new Date(ms).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—';

async function emailInvite(formData: FormData) {
  'use server';
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const c = candidateById(id);
  if (!c || !c.email) redirect(`/admin/c/${id}?mail=failed`);
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const outcome = await sendInviteEmail(c, `${proto}://${host}/t/${c.token}`);
  if (outcome === 'sent') markInviteEmailed(id);
  redirect(`/admin/c/${id}?mail=${outcome}`);
}

export default async function CandidateDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ new?: string; mail?: string }>;
}) {
  const { id } = await params;
  const { new: isNew, mail } = await searchParams;
  const c = candidateById(id);
  if (!c) notFound();

  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const link = `${proto}://${host}/t/${c.token}`;

  const status = statusOf(c);
  const bank = bankFor(c.level);
  const done = status === 'submitted';
  const result = done ? resultFor(c) : null;
  const stemById = new Map(bank.items.map((i) => [i.id, i]));

  const elapsed =
    c.started_at && c.submitted_at ? Math.round((c.submitted_at - c.started_at) / 1000) : null;

  return (
    <div className="wrap">
      <p className="noprint">
        <Link href="/admin">&larr; All Candidates</Link>
      </p>

      <div className="spread">
        <div>
          <h1>{c.name}</h1>
          <p className="sub">{[c.ref, c.position].filter(Boolean).join(' · ') || '—'}</p>
        </div>
        <div className="row">
          <span className={`lvl lvl-${bank.level}`}>{bank.name}</span>
          <span className={`st st-${status}`}>{status.replace('_', ' ')}</span>
        </div>
      </div>

      {mail === 'sent' ? (
        <div className="banner info noprint" role="status">
          {isNew ? 'Invite created and emailed' : 'Invite email sent'} to {c.email}.
        </div>
      ) : mail === 'failed' ? (
        <div className="banner crit noprint" role="alert">
          The invite email could not be sent. Check the server log and the SMTP settings in
          .env.local, or copy the link below and send it manually.
        </div>
      ) : mail === 'unconfigured' ? (
        <div className="banner warn noprint" role="alert">
          Email is not configured (set SMTP_USER / SMTP_PASS in .env.local and restart).
          Copy the link below and send it manually.
        </div>
      ) : isNew ? (
        <div className="banner info noprint" role="status">
          Invite created. Send the link below to the candidate.
        </div>
      ) : null}

      {!done ? (
        <div className="card noprint">
          <h2>Test Link</h2>
          <div className="linkbox">
            <span className="mono">{link}</span>
          </div>
          <div className="row">
            {c.email ? (
              <form action={emailInvite}>
                <input type="hidden" name="id" value={c.id} />
                <SubmitButton
                  className={c.invite_emailed_at ? 'ghost' : 'primary'}
                  pendingLabel="Sending…"
                >
                  {c.invite_emailed_at ? 'Resend Invite Email' : 'Email Link to Candidate'}
                </SubmitButton>
              </form>
            ) : null}
            <CopyLink url={link} label="Copy Test Link" size="md" />
            {!c.email ? (
              <span className="note">No email on record — send the link manually.</span>
            ) : null}
          </div>
          <p className="note" style={{ margin: '0.75rem 0 0' }}>
            Invite expires {fmt(c.expires_at)}
            {c.started_at
              ? ` · started ${fmt(c.started_at)} · ${Math.floor(remainingSec(c) / 60)} min left on the clock`
              : ' · clock starts when the candidate first opens it'}
          </p>
        </div>
      ) : null}

      <div className="card">
        <h2>Sitting</h2>
        <table>
          <tbody>
            {c.ref ? <tr><th>Candidate ID</th><td>{c.ref}</td></tr> : null}
            <tr><th>Difficulty</th><td>{bank.name}</td></tr>
            <tr><th>Email</th><td>{c.email || '—'}</td></tr>
            <tr><th>Invite Emailed</th><td>{fmt(c.invite_emailed_at)}</td></tr>
            <tr><th>Invited</th><td>{fmt(c.created_at)}</td></tr>
            <tr><th>Started</th><td>{fmt(c.started_at)}</td></tr>
            <tr><th>Submitted</th><td>{fmt(c.submitted_at)}</td></tr>
            <tr>
              <th>Time Allowed</th>
              <td>
                {Math.round(c.duration_sec / 60)} min
                {c.extra_time ? ' (25% extra time granted)' : ''}
              </td>
            </tr>
            <tr>
              <th>Time Used</th>
              <td>{elapsed === null ? '—' : `${Math.floor(elapsed / 60)} min ${elapsed % 60} s`}</td>
            </tr>
            <tr>
              <th>Completion</th>
              <td>
                {c.submit_mode === 'timeout'
                  ? 'Auto-submitted at time expiry'
                  : c.submit_mode === 'candidate'
                    ? 'Submitted by candidate'
                    : c.submit_mode === 'admin'
                      ? 'Closed by administrator'
                      : '—'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {result ? (
        <>
          <div className="card">
            <div className="score">
              {result.score}
              <span style={{ fontSize: '1.2rem', color: 'var(--muted)' }}> / {result.total}</span>
            </div>
            <p className="note">
              {result.pct}% &middot; shortlist cut-off {CUTOFF}/{TOTAL_ITEMS}
            </p>
            <span className={`tier t-${result.band.slug}`}>{result.band.name}</span>
            <p style={{ marginBottom: 0 }}>
              {result.band.recommendation}{' '}
              <b>{result.meetsCutoff ? 'Meets the shortlist threshold.' : 'Below the shortlist threshold.'}</b>
            </p>
          </div>

          <div className="card">
            <h2>Sub-Domain Profile</h2>
            <p className="note">
              Five items per domain. Use for role fit only — sub-scores are too short to rank
              candidates on.
            </p>
            <table>
              <thead>
                <tr><th>Domain</th><th className="right">Score</th><th>Profile</th></tr>
              </thead>
              <tbody>
                {result.domains.map((d) => (
                  <tr key={d.code}>
                    <td>{d.label}</td>
                    <td className="right">{d.correct} / {d.total}</td>
                    <td>
                      <div className="barwrap">
                        <div className="barfill" style={{ width: `${d.pct}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <h2>Item-Level Review</h2>
            <p className="note">
              Letters reflect the option order this candidate saw; option order is shuffled per
              sitting, so letters are not comparable between candidates.
            </p>
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Domain</th><th>Item</th>
                  <th>Given</th><th>Key</th><th>Result</th><th>Rationale</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((it, i) => (
                  <tr key={it.itemId}>
                    <td>{i + 1}</td>
                    <td><span className="tag">{DOMAINS[it.domain]}</span></td>
                    <td className="note">{stemById.get(it.itemId)!.stem.slice(0, 60)}…</td>
                    <td>{it.givenLetter}</td>
                    <td>{it.correctLetter}</td>
                    <td className={it.correct ? 'ok' : 'bad'}>
                      {it.correct ? 'Correct' : it.given === null ? 'Blank' : 'Incorrect'}
                    </td>
                    <td className="note">{stemById.get(it.itemId)!.rationale}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="card">
          <p className="note" style={{ margin: 0 }}>
            No result yet. Results appear here once the candidate submits or the clock expires.
          </p>
        </div>
      )}
    </div>
  );
}
